import {measuredEmitter} from '../helpers/measured-emitter';
import {Matrix4,Quaternion} from 'three';
import {test,expect} from './fixtures';

test('selected door points run in order with progress and post-dwell visits',async({page})=>{
  test.setTimeout(90000);
  await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(704,498);await page.mouse.click(712,520);
  await expect(page.getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Run',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.getByLabel('Route progress')).toContainText('Current point: 1');
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 0 of 2');
  await expect(page.getByRole('row').nth(1)).toContainText('Moving');
  await expect(page.getByRole('row').nth(2)).toContainText('Ready');
  const canvas=page.getByRole('img',{name:'3D robot and door scene'});
  const home=await canvas.getAttribute('data-joint-angles');
  await expect(page.getByLabel('Route progress')).toContainText('Current point: 2',{timeout:45000});
  await expect(page.getByRole('row').nth(1)).toContainText('Visited');
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 1 of 2');
  await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:45000});
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 2 of 2');
  await expect(canvas).toHaveAttribute('data-laser','false');
  await expect(canvas).toHaveAttribute('data-joint-angles',home!);
  const final=await canvas.getAttribute('data-joint-angles');await page.waitForTimeout(1100);
  await expect(canvas).toHaveAttribute('data-joint-angles',final!);
});

test('a later unsolved actual door target blocks every motion and leaves earlier points not visited',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await page.mouse.click(704,498);await page.mouse.click(780,500);
 await expect(page.getByRole('row')).toHaveCount(3);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),home=await canvas.getAttribute('data-joint-angles');
 await canvas.evaluate(element=>{(window as any).motionStarted=false;new MutationObserver(()=>{if((element as HTMLElement).dataset.jointAngles!==((window as any).initialAngles)||(element as HTMLElement).dataset.laser==='true')(window as any).motionStarted=true;}).observe(element,{attributes:true});(window as any).initialAngles=(element as HTMLElement).dataset.jointAngles;});
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Sequence blocked');
 await expect(page.getByRole('row').nth(1)).toContainText('Not visited');
 await expect(page.getByRole('row').nth(2)).toContainText('Pose not solved');
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 0 of 2');
 await expect(canvas).toHaveAttribute('data-joint-angles',home!);await expect(canvas).toHaveAttribute('data-laser','false');
 expect(await page.evaluate(()=>(window as any).motionStarted)).toBe(false);
});

for(const standOffMm of [100,500])test(`the frozen five actual surface clicks complete a continuous ${standOffMm} mm scan with bounded joints and endpoint dwells`,async({page})=>{
 test.setTimeout(180000);
 await page.addInitScript(()=>{
  const NativeWorker=Worker;
  window.Worker=class extends NativeWorker {constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('preflight'))this.addEventListener('message',event=>{(window as any).scanPlan=event.data.plan;});}};
 });
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const clicks=[[681.160927,480.122642],[681.219904,506.444347],[680.244766,523.942241],[761.506759,575.148953],[764.290822,528.705958]];
 for(const [x,y] of clicks)await page.mouse.click(x,y);
 await expect(page.getByRole('row')).toHaveCount(6);
 const surfaces=await page.getByRole('row').all();
 const reference=[[1648.553932,300,550],[1658.438598,300,400],[1658.438587,300,300],[1656.719024,-300,300],[1645.645252,-300,550]];
 for(let i=0;i<5;i++){
  const cells=await surfaces[i+1].locator('td').allTextContents();expect(Math.hypot(...cells.slice(0,3).map((v,j)=>Number(v)-reference[i][j]))).toBeLessThan(0.15);
 }
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 await canvas.evaluate(element=>{
  const records:any[]=[];(window as any).routeEvidence=records;
  new MutationObserver(()=>records.push({time:performance.now(),angles:(element as HTMLElement).dataset.jointAngles,pose:(element as HTMLElement).dataset.emitterPose,laser:(element as HTMLElement).dataset.laser,progress:document.querySelector('[aria-label="Route progress"]')?.textContent,statuses:[...document.querySelectorAll('tbody tr')].map(r=>r.lastElementChild?.textContent)})).observe(element,{attributes:true});
 });
 await page.getByLabel('Stand-off (mm)').fill(String(standOffMm));
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByLabel('Route progress')).toContainText('Current point: 2',{timeout:90000});
 await page.screenshot({path:`docs/verification/issue-21-motion-${standOffMm}${process.env.PREVIEW==='1'?'-production':''}.png`});
 await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:125000});
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 5 of 5');
 for(let i=1;i<=5;i++)await expect(page.getByRole('row').nth(i)).toContainText('Visited');
 const plan=await page.evaluate(()=>(window as any).scanPlan);
 const records=await page.evaluate(()=>(window as any).routeEvidence as any[]);
 const limits=[[-185,185],[-185,65],[-138,175],[-350,350],[-130,130],[-350,350]];
 for(const record of records)record.angles.split(',').map(Number).forEach((q:number,i:number)=>{expect(q*180/Math.PI).toBeGreaterThanOrEqual(limits[i][0]);expect(q*180/Math.PI).toBeLessThanOrEqual(limits[i][1]);});
 let maxPositionMm=0,maxOrientationDeg=0,maxPublishedPoseError=0;
 const chords:any[]=[];let previous=plan.homeAngles;
 plan.points.forEach((entry:any,index:number)=>entry.path.forEach((step:any)=>{chords.push({previous,step,index});previous=step.angles;}));
 for(const record of records.filter(r=>r.laser==='true')){
  const q=record.angles.split(',').map(Number),actual=measuredEmitter(q),published=record.pose.split(',').map(Number);
  maxPublishedPoseError=Math.max(maxPublishedPoseError,...actual.map((v,j)=>Math.abs(v-published[j])));
  let match:any=null,best=Infinity;
  for(const chord of chords){
   const delta=chord.step.angles.map((v:number,j:number)=>v-chord.previous[j]);
   const norm=delta.reduce((sum:number,v:number)=>sum+v*v,0);
   const fraction=norm<1e-20?1:Math.max(0,Math.min(1,delta.reduce((sum:number,v:number,j:number)=>sum+v*(q[j]-chord.previous[j]),0)/norm));
   const error=Math.hypot(...q.map((v:number,j:number)=>v-chord.previous[j]-fraction*delta[j]));
   if(error<best){best=error;match={...chord,fraction};}
  }
  expect(best).toBeLessThan(1e-6);
  if(match.index===0)continue; // home approach establishes stand-off on arrival
  const a=match.step.fromEmitter,b=match.step.targetEmitter,f=match.fraction,d=standOffMm/1000;
  const rotation=new Quaternion().setFromRotationMatrix(new Matrix4().fromArray(a)).slerp(new Quaternion().setFromRotationMatrix(new Matrix4().fromArray(b)),f);
  const target=new Matrix4().makeRotationFromQuaternion(rotation).elements;
  const position=[0,1,2].map(j=>(a[12+j]+d*a[8+j])*(1-f)+(b[12+j]+d*b[8+j])*f-d*target[8+j]);
  maxPositionMm=Math.max(maxPositionMm,1000*Math.hypot(...position.map((v,j)=>v-actual[12+j])));
  maxOrientationDeg=Math.max(maxOrientationDeg,rotation.angleTo(new Quaternion().setFromRotationMatrix(new Matrix4().fromArray(actual)))*180/Math.PI);
 }
 expect(maxPublishedPoseError).toBeLessThan(1e-10);expect(maxPositionMm).toBeLessThanOrEqual(5);expect(maxOrientationDeg).toBeLessThanOrEqual(5);
 const lit=records.filter(r=>r.laser==='true');
 expect(lit.length).toBeGreaterThan(2);
 const laserChanges=records.map(r=>r.laser).filter((v,i,a)=>i===0||v!==a[i-1]);
 expect(laserChanges.filter(v=>v==='true')).toHaveLength(1);
 for(let i=0;i<5;i++){
  const group=lit.filter(r=>r.progress.includes(`Current point: ${i+1}`));
  const last=group.at(-1)!;
  const dwell=group.filter(r=>r.angles===last.angles);
  expect(dwell.at(-1)!.time-dwell[0].time).toBeGreaterThanOrEqual(990);
  const normal=(await surfaces[i+1].getAttribute('data-base-normal'))!.split(',').map(Number);
  const pose=last.pose.split(',').map(Number),target=reference[i].map((v,j)=>v/1000+standOffMm/1000*normal[j]);
  expect(Math.hypot(...target.map((v,j)=>v-pose[12+j]))*1000).toBeLessThanOrEqual(5);
  expect(Math.acos(Math.max(-1,Math.min(1,-normal.reduce((s,v,j)=>s+v*pose[8+j],0))))*180/Math.PI).toBeLessThanOrEqual(5);
 }
 await expect(canvas).toHaveAttribute('data-laser','false');
 const final=await canvas.getAttribute('data-joint-angles');await page.waitForTimeout(1100);await expect(canvas).toHaveAttribute('data-joint-angles',final!);
 const selectedPoints=await Promise.all(surfaces.slice(1).map(async(row,i)=>{
  const partPosition=(await row.getAttribute('data-part-position'))!.split(',').map(Number);
  return {id:i+1,order:i+1,partPosition,basePosition:[.9203385949134826-partPosition[1],-2.0353724360466003+partPosition[0],-.367240297+partPosition[2]],baseNormal:(await row.getAttribute('data-base-normal'))!.split(',').map(Number)};
 }));
 const {writeFile}=await import('node:fs/promises');
 await writeFile(`docs/verification/issue-21-browser-route-${standOffMm}${process.env.PREVIEW==='1'?'-production':''}.json`,JSON.stringify({standOffMm,clicks,reference,selectedPoints,maxPositionMm,maxOrientationDeg,maxPublishedPoseError,records},null,2)+'\n');
 await page.getByLabel('Route progress').scrollIntoViewIfNeeded();await page.screenshot({path:`docs/verification/issue-21-route-${standOffMm}${process.env.PREVIEW==='1'?'-production':''}.png`});
});
