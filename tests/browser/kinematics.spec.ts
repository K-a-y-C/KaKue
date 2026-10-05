import { test, expect } from '@playwright/test';
test.skip(process.env.PREVIEW === '1', 'Source-module numeric fixtures run through development Vite; production workflow uses the public UI.');
test('preflight accepts a supplied door target using mounted emitter and preserves the surface point', async ({ page }) => {
  await page.goto('./');
  const result = await page.evaluate(async () => {
    // @ts-expect-error Browser loads the public Vite module.
    const { preflight } = await import('/src/motion/preflight.ts');
    const fixture = await fetch('/assets/demo/manifest.json').then(r => r.json());
    const p=fixture.representativeRoute[1];
    const point={id:1,order:1,basePosition:p.surfacePosition,baseNormal:p.approachNormal,partPosition:p.partLocalPosition,partNormal:p.approachNormal,meshIndex:0,triangleIndex:p.triangleIndex,status:'selected'};
    return preflight([point],100);
  });
  expect(result.blocked).toBe(false);
  expect(result.points[0].status).toBe('ready');
  expect(result.points[0].point.basePosition[0]).toBeCloseTo(1.6584385979191136,10);
  expect(result.points[0].targetEmitter[12]).toBeCloseTo(1.5584385979191637,10);
  expect(Math.abs(result.points[0].targetEmitter[12]-result.points[0].targetFlange[12])).toBeCloseTo(.08,5);
  expect(result.points[0].positionErrorMm).toBeLessThanOrEqual(5);
  expect(result.points[0].orientationErrorDeg).toBeLessThanOrEqual(5);
});

test('single supplied surface pose satisfies hard intervals and conservative peak speeds', async ({ page }) => {
  await page.goto('./');
  const evidence=await page.evaluate(async()=>{
    // @ts-expect-error Vite module.
    const {preflight}=await import('/src/motion/preflight.ts');
    // @ts-expect-error Vite module.
    const {robotDefinition}=await import('/src/robot/definition.ts');
    const fixture=await fetch('/assets/demo/manifest.json').then(r=>r.json());
    const points=fixture.representativeRoute.slice(1,2).map((p:any)=>({id:p.id,order:p.id,basePosition:p.surfacePosition,baseNormal:p.approachNormal,partPosition:p.partLocalPosition,partNormal:p.approachNormal,meshIndex:0,triangleIndex:p.triangleIndex,status:'selected'}));
    const plan=preflight(points,100);
    let previous=plan.homeAngles;
    return {blocked:plan.blocked,rows:plan.points.map((p:any)=>{
      const speeds=p.angles?.map((q:number,i:number)=>1.5*Math.abs(q-previous[i])/p.duration/robotDefinition.joints[i].demoSpeed);
      const bounds=p.angles?.every((q:number,i:number)=>Number.isFinite(q)&&q>=robotDefinition.joints[i].lower&&q<=robotDefinition.joints[i].upper);
      if(p.angles)previous=p.angles;
      return {...p,speeds,bounds};
    })};
  });
  expect(evidence.blocked).toBe(false);
  for(const row of evidence.rows){expect(row.status).toBe('ready');expect(row.bounds).toBe(true);expect(Math.max(...row.speeds)).toBeLessThanOrEqual(1+1e-12);expect(row.positionErrorMm).toBeLessThanOrEqual(5);expect(row.orientationErrorDeg).toBeLessThanOrEqual(5);expect(row.axisErrorDeg).toBeLessThanOrEqual(5);}
});

test('geometric Jacobian matches independent translation and rotation finite differences', async ({ page }) => {
  await page.goto('./');
  const error=await page.evaluate(async()=>{
    // @ts-expect-error Vite module.
    const {geometricJacobian}=await import('/src/robot/inverse-kinematics.ts');
    // @ts-expect-error Vite module.
    const {forwardKinematics}=await import('/src/robot/forward-kinematics.ts');
    // @ts-expect-error Vite module.
    const {robotDefinition}=await import('/src/robot/definition.ts');
    const q=[.2,-1,1.5,.3,-.7,-1],j=geometricJacobian(q),m=forwardKinematics(robotDefinition,q).flange,h=1e-6;let max=0;
    for(let c=0;c<6;c++){
      const next=q.slice();next[c]+=h;const a=forwardKinematics(robotDefinition,next).flange;
      const dr=Array.from({length:9},(_,i)=>{const r=Math.floor(i/3),col=i%3;let sum=0;for(let k=0;k<3;k++)sum+=(a[k*4+r]-m[k*4+r])/h*m[k*4+col];return sum;});
      const omega=[(dr[7]-dr[5])/2,(dr[2]-dr[6])/2,(dr[3]-dr[1])/2];
      for(let r=0;r<3;r++){max=Math.max(max,Math.abs(j[c*6+r]-(a[12+r]-m[12+r])/h),Math.abs(j[c*6+r+3]-omega[r]));}
    }
    return max;
  });
  expect(error).toBeLessThan(2e-6);
});

test('bounded preflight distinguishes envelope rejection from unsolved orientation and rejects invalid normals', async ({ page })=>{
  await page.goto('./');
  const result=await page.evaluate(async()=>{
    // @ts-expect-error Vite module.
    const {preflight}=await import('/src/motion/preflight.ts');
    const point=(position:number[],normal:number[])=>({id:1,order:1,basePosition:position,baseNormal:normal,partPosition:position,partNormal:normal,meshIndex:0,triangleIndex:0,status:'selected'});
    const fixtures=[point([10,0,0],[-1,0,0]),point([.1,0,-1],[-1,0,0]),point([1,0,1],[0,0,0]),point([1,0,1],[NaN,0,0])];
    return fixtures.map(p=>preflight([p],100)).map(p=>({blocked:p.blocked,status:p.points[0].status,angles:p.points[0].angles}));
  });
  expect(result.map(p=>p.status)).toEqual(['outside_reach','pose_unsolved','pose_unsolved','pose_unsolved']);
  for(const p of result){expect(p.blocked).toBe(true);expect(p.angles).toBeNull();}
});

test('singular and hard-interval boundary fixtures remain finite within bounds without wrapping', async ({page})=>{
  await page.goto('./');
  const checks=await page.evaluate(async()=>{
    // @ts-expect-error Vite module.
    const {solveFlangePose,poseResidual}=await import('/src/robot/inverse-kinematics.ts');
    // @ts-expect-error Vite module.
    const {forwardKinematics}=await import('/src/robot/forward-kinematics.ts');
    // @ts-expect-error Vite module.
    const {robotDefinition:d}=await import('/src/robot/definition.ts');
    const fixtures=[[0,-Math.PI/2,Math.PI/2,0,0,0],[d.joints[0].lower+1e-5,-.5,1.5,0,-.5,0],[0,d.joints[1].upper-1e-5,1.5,0,-.5,0]];
    return fixtures.map(q=>{
      const target=forwardKinematics(d,q).flange,seed=q.map((v,i)=>Math.min(d.joints[i].upper,Math.max(d.joints[i].lower,v+.01)));
      const solution=solveFlangePose(target,seed);
      return {status:solution.status,bounded:solution.angles?.every((v:number,i:number)=>Number.isFinite(v)&&v>=d.joints[i].lower&&v<=d.joints[i].upper),residual:solution.angles?poseResidual(target,forwardKinematics(d,solution.angles).flange):null};
    });
  });
  for(const check of checks){expect(check.status).toBe('ready');expect(check.bounded).toBe(true);expect(check.residual.positionErrorMm).toBeLessThanOrEqual(5);expect(check.residual.orientationErrorDeg).toBeLessThanOrEqual(5);expect(check.residual.axisErrorDeg).toBeLessThanOrEqual(5);}
});

test('pose acceptance rejects scaled and non-finite transforms rather than clipping their residuals', async ({page})=>{
  await page.goto('./');
  const statuses=await page.evaluate(async()=>{
    // @ts-expect-error Vite module.
    const {solveFlangePose}=await import('/src/robot/inverse-kinematics.ts');
    // @ts-expect-error Vite module.
    const {forwardKinematics}=await import('/src/robot/forward-kinematics.ts');
    // @ts-expect-error Vite module.
    const {robotDefinition:d}=await import('/src/robot/definition.ts');
    const scaled=forwardKinematics(d,d.home).flange;for(let c=0;c<3;c++)for(let r=0;r<3;r++)scaled[c*4+r]*=2;
    const nan=forwardKinematics(d,d.home).flange;nan[12]=NaN;
    return [scaled,nan].map(target=>solveFlangePose(target,d.home).status);
  });
  expect(statuses).toEqual(['pose_unsolved','pose_unsolved']);
});
