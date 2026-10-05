import { test, expect } from './fixtures';

test('actual door visit locks controls, moves the joints, dwells then completes', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
  await expect(page.getByLabel('Stand-off (mm)')).toHaveValue('100');
  await page.mouse.click(704,498);
  await expect(page.getByRole('row')).toHaveCount(2);
  const canvas=page.getByRole('img',{name:'3D robot and door scene'});
  const home=await canvas.getAttribute('data-joint-angles');
  await canvas.evaluate(element=> {
    const records: {time:number;laser:string|undefined;angles:string|undefined;pose:string|undefined}[]=[];
    (window as any).motionEvidence=records;
    new MutationObserver(()=>records.push({time:performance.now(),laser:(element as HTMLElement).dataset.laser,angles:(element as HTMLElement).dataset.jointAngles,pose:(element as HTMLElement).dataset.emitterPose})).observe(element,{attributes:true});
  });
  await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.getByLabel('Import STEP')).toBeDisabled();
  await expect(page.getByLabel('Stand-off (mm)')).toBeDisabled();
  await expect(canvas).not.toHaveAttribute('data-joint-angles',home!);
  await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:45000});
  await expect(page.getByRole('row').last()).toContainText('Visited');
  const records=await page.evaluate(()=>(window as any).motionEvidence as {time:number;laser:string;angles:string;pose:string}[]);
  const lit=records.filter(record=>record.laser==='true'); expect(lit.length).toBeGreaterThan(0);
  const off=records.find(record=>record.time>lit[0].time && record.laser==='false')!;
  expect(off.time-lit[0].time).toBeGreaterThanOrEqual(990);
  expect(new Set(lit.map(record=>record.angles)).size).toBe(1);
  expect(records.filter(record=>record.laser==='false'&&record.angles!==home).length).toBeGreaterThan(2);
  await expect(canvas).toHaveAttribute('data-joint-angles',home!);
  const surface=await page.getByRole('row').last().locator('td').allTextContents();
  const normal=(await page.getByRole('row').last().getAttribute('data-base-normal'))!.split(',').map(Number);
  const pose=lit.at(-1)!.pose.split(',').map(Number);
  const expected=surface.slice(0,3).map((value,i)=>Number(value)/1000+.1*normal[i]);
  expect(Math.hypot(...expected.map((value,i)=>value-pose[12+i]))*1000).toBeLessThanOrEqual(5.1);
  expect(Math.acos(Math.max(-1,Math.min(1,-normal.reduce((sum,value,i)=>sum+value*pose[8+i],0))))*180/Math.PI).toBeLessThanOrEqual(5);
  await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
  await page.mouse.click(705,500); await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByRole('row').last().scrollIntoViewIfNeeded();
  await page.screenshot({path:'docs/verification/issue-06-visit.png'});
});

test('distant imported STEP point blocks without motion or laser', async ({ page }) => {
  test.setTimeout(45000);
  await page.goto('./'); await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.getByLabel('Import STEP').setInputFiles('tests/fixtures/box-mm.step');
  await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(749,723);
  await expect(page.getByRole('row')).toHaveCount(2);
  const canvas=page.getByRole('img',{name:'3D robot and door scene'}), home=await canvas.getAttribute('data-joint-angles');
  await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Sequence blocked');
  await expect(canvas).toHaveAttribute('data-joint-angles',home!);
  await expect(canvas).toHaveAttribute('data-laser','false');
  await expect(page.getByRole('row').last()).toContainText(/Outside reach|Pose not solved/);
});

test('delayed animation frame still gives a full endpoint dwell', async ({ page }) => {
  test.skip(process.env.PREVIEW==='1','Vite public execution fixture; actual production UI verifies real dwell.');
  await page.goto('./');
  const evidence=await page.evaluate(async()=> {
    const {visit}=await import(String('/src/motion/execution.ts')) as typeof import('../../src/motion/execution');
    const original=requestAnimationFrame, cancel=cancelAnimationFrame;
    let callback: FrameRequestCallback=()=>{}, finished=false, laser=false;
    window.requestAnimationFrame=fn=>{callback=fn;return 1;}; window.cancelAnimationFrame=()=>{};
    try {
      const q=[0,-1,1,0,0,0]; const pending=visit(q,q,()=>{},on=>{laser=on;},new AbortController().signal).then(()=>{finished=true;});
      callback(0); callback(3000); await Promise.resolve();
      const atArrival={finished,laser}; callback(3999); await Promise.resolve(); const beforeEnd={finished,laser};
      callback(4000); await pending; return {atArrival,beforeEnd,finished,laser};
    } finally {window.requestAnimationFrame=original;window.cancelAnimationFrame=cancel;}
  });
  expect(evidence.atArrival).toEqual({finished:false,laser:true});
  expect(evidence.beforeEnd).toEqual({finished:false,laser:true}); expect(evidence.finished).toBe(true); expect(evidence.laser).toBe(false);
});

test('smooth joint transitions retain hard intervals and conservative peak speeds', async ({ page }) => {
  test.skip(process.env.PREVIEW==='1','Public Vite numerical fixture supplements actual production movement.');
  await page.goto('./');
  const result=await page.evaluate(async()=> {
    const {interpolateJoints,transitionDuration}=await import(String('/src/motion/execution.ts')) as typeof import('../../src/motion/execution');
    const {robotDefinition}=await import(String('/src/robot/definition.ts')) as typeof import('../../src/robot/definition');
    const from=robotDefinition.joints.map(j=>j.lower+.01), to=robotDefinition.joints.map(j=>j.upper-.01), duration=transitionDuration(from,to);
    const samples=Array.from({length:1001},(_,i)=>interpolateJoints(from,to,i/1000));
    return {finiteBounds:samples.every(row=>row.every((q,i)=>Number.isFinite(q)&&q>=robotDefinition.joints[i].lower&&q<=robotDefinition.joints[i].upper)),maxSpeedRatio:Math.max(...samples.slice(1).flatMap((row,s)=>row.map((q,j)=>Math.abs(q-samples[s][j])/(duration/1000)/robotDefinition.joints[j].demoSpeed))),first:samples[0],last:samples[1000],from,to};
  });
  expect(result.finiteBounds).toBe(true);expect(result.maxSpeedRatio).toBeLessThanOrEqual(1+1e-10);expect(result.first).toEqual(result.from);for(const [i,q] of result.last.entries())expect(q).toBeCloseTo(result.to[i],12);
});
