import {test,expect} from '@playwright/test';

async function loadPoints(page:import('@playwright/test').Page) {
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await page.mouse.click(704,498);await page.mouse.click(712,520);
 await expect(page.getByRole('row')).toHaveCount(3);
}

test('Stop during preparation retains selections and rejects a late native worker response',async({page})=>{
 await page.addInitScript(()=>{
  const NativeWorker=Worker;
  (window as any).releasePose=()=>{};
  window.Worker=class extends NativeWorker {
   constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('preflight')){
    const native=this;
    Object.defineProperty(this,'onmessage',{set(callback){native.addEventListener('message',event=>{(window as any).poseQueued=true;(window as any).releasePose=()=>callback(event);});}});
   }}
  };
 });
 await loadPoints(page);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),home=await canvas.getAttribute('data-joint-angles');
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Preparing');
 await expect(page.getByLabel('Import STEP')).toBeDisabled();
 await page.waitForFunction(()=>(window as any).poseQueued===true);
 await page.getByRole('button',{name:'Stop',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation stopped');
 await page.evaluate(()=>(window as any).releasePose());
 await page.waitForTimeout(1200);
 await expect(canvas).toHaveAttribute('data-joint-angles',home!);await expect(canvas).toHaveAttribute('data-laser','false');
 for(let i=1;i<=2;i++)await expect(page.getByRole('row').nth(i)).toContainText('Not visited');
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 0 of 2');
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Stop',exact:true})).toBeDisabled();
 await expect(page.getByLabel('Import STEP')).toBeEnabled();
 await page.getByLabel('Import STEP').setInputFiles('tests/fixtures/box-mm.step');
 await expect(page.getByRole('status')).toContainText('Scene ready');
 await page.evaluate(()=>(window as any).releasePose());
 await page.waitForTimeout(200);
 await expect(page.getByRole('row')).toHaveCount(1);await expect(canvas).toHaveAttribute('data-joint-angles',home!);
});

test('Stop during transit freezes joints, retains all points and fresh import restores home',async({page})=>{
 await loadPoints(page);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),home=await canvas.getAttribute('data-joint-angles');
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(canvas).not.toHaveAttribute('data-joint-angles',home!);
 await expect(canvas).toHaveAttribute('data-laser','true');
 await page.getByRole('button',{name:'Stop',exact:true}).click();
 const frozen=await canvas.getAttribute('data-joint-angles');
 await expect(page.getByRole('status')).toContainText('Simulation stopped');
 await expect(page.getByRole('row').nth(1)).toContainText('Stopped');
 await expect(page.getByRole('row').nth(2)).toContainText('Not visited');
 await page.waitForTimeout(1200);await expect(canvas).toHaveAttribute('data-joint-angles',frozen!);
 await expect(canvas).toHaveAttribute('data-laser','false');
 await page.mouse.click(704,498);await expect(page.getByRole('row')).toHaveCount(3);
 await page.getByLabel('Import STEP').setInputFiles('tests/fixtures/box-mm.step');
 await expect(page.getByRole('status')).toContainText('Scene ready');
 await expect(page.getByRole('row')).toHaveCount(1);await expect(canvas).toHaveAttribute('data-joint-angles',home!);
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 0 of 0');
 await expect(page.getByLabel('Stand-off (mm)')).toBeEnabled();
});

test('Stop in the second dwell preserves the first visited point and extinguishes laser',async({page})=>{
 test.setTimeout(60000);await loadPoints(page);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 await canvas.evaluate(element=>{
  let last='',stable=0;
  new MutationObserver(()=>{const q=(element as HTMLElement).dataset.jointAngles??'';stable=q===last?stable+1:0;last=q;if(stable>=2&&(element as HTMLElement).dataset.laser==='true'&&document.querySelector('[aria-label="Route progress"]')?.textContent?.includes('Current point: 2')){
   const stop=[...document.querySelectorAll('button')].find(b=>b.textContent==='Stop');stop?.click();
  }}).observe(element,{attributes:true});
 });
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation stopped',{timeout:45000});
 await expect(page.getByRole('row').nth(1)).toContainText('Visited');await expect(page.getByRole('row').nth(2)).toContainText('Stopped');
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 1 of 2');
 const frozen=await canvas.getAttribute('data-joint-angles');await page.waitForTimeout(1200);
 await expect(canvas).toHaveAttribute('data-joint-angles',frozen!);await expect(canvas).toHaveAttribute('data-laser','false');
});

test('unexpected pose worker failure retains honest terminal rows and permits fresh import recovery',async({page})=>{
 await page.addInitScript(()=>{
  const NativeWorker=Worker;
  window.Worker=class extends NativeWorker {
   constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('preflight'))this.postMessage=()=>setTimeout(()=>this.dispatchEvent(new Event('error')),0) as any;}
  };
 });
 await loadPoints(page);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),home=await canvas.getAttribute('data-joint-angles');
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation failed');await expect(page.getByRole('alert')).toContainText('Pose worker failed');
 for(let i=1;i<=2;i++)await expect(page.getByRole('row').nth(i)).toContainText('Not visited');
 await expect(canvas).toHaveAttribute('data-joint-angles',home!);await expect(canvas).toHaveAttribute('data-laser','false');
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();await expect(page.getByLabel('Import STEP')).toBeEnabled();
});

test('unexpected render update failure freezes execution and preserves completed visits',async({page})=>{
 test.setTimeout(60000);await loadPoints(page);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 await canvas.evaluate(element=>{
  const dataset=(element as HTMLElement).dataset;
  Object.defineProperty(element,'dataset',{get:()=>new Proxy(dataset,{set(target,key,value){
   if(key==='jointAngles'&&document.querySelector('[aria-label="Route progress"]')?.textContent?.includes('Current point: 2'))throw new Error('Renderer update failed.');
   Reflect.set(target,key,value);return true;
  }})});
 });
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation failed',{timeout:45000});
 await expect(page.getByRole('alert')).toContainText('Renderer update failed');
 await expect(page.getByRole('row').nth(1)).toContainText('Visited');await expect(page.getByRole('row').nth(2)).toContainText('Stopped');
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 1 of 2');
 await expect(canvas).toHaveAttribute('data-laser','false');
 const frozen=await canvas.getAttribute('data-joint-angles');await page.waitForTimeout(1200);await expect(canvas).toHaveAttribute('data-joint-angles',frozen!);
});

test('queued animation callbacks after cancellation or completion cannot touch a replacement',async({page})=>{
 test.skip(process.env.PREVIEW==='1','External animation seam on public visit; actual production UI covers transit and dwell.');
 await page.goto('./');
 const result=await page.evaluate(async()=>{
  const {visit}=await import(String('/src/motion/execution.ts')) as typeof import('../../src/motion/execution');
  const original=requestAnimationFrame,cancel=cancelAnimationFrame;
  let queued:FrameRequestCallback=()=>{},joints=0,laserWrites=0;
  window.requestAnimationFrame=callback=>{queued=callback;return 1;};window.cancelAnimationFrame=()=>{};
  try{
   const controller=new AbortController(),q=[0,-1,1,0,0,0];
   const cancelled=visit(q,q,()=>joints++,()=>laserWrites++,controller.signal).catch(()=>{});
   const lateCancelled=queued;controller.abort();await cancelled;
   const afterStop={joints,laserWrites};lateCancelled(5000);const afterLate={joints,laserWrites};
   const complete=visit(q,q,()=>joints++,()=>laserWrites++,new AbortController().signal);
   queued(10000);queued(12000);const lateComplete=queued;queued(13000);await complete;
   const afterComplete={joints,laserWrites};lateComplete(15000);
   return {afterStop,afterLate,afterComplete,afterDuplicate:{joints,laserWrites}};
  }finally{window.requestAnimationFrame=original;window.cancelAnimationFrame=cancel;}
 });
 expect(result.afterLate).toEqual(result.afterStop);expect(result.afterDuplicate).toEqual(result.afterComplete);
});

test('laser update and cleanup errors still enter failed with retained selections',async({page})=>{
 test.setTimeout(45000);
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');await page.mouse.click(704,498);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 await canvas.evaluate(element=>{
  const dataset=(element as HTMLElement).dataset;
  Object.defineProperty(element,'dataset',{get:()=>new Proxy(dataset,{set(target,key,value){
   if(key==='laser')throw new Error('Laser update failed.');
   Reflect.set(target,key,value);return true;
  }})});
 });
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation failed',{timeout:25000});
 await expect(page.getByRole('alert')).toContainText('Laser update failed');
 await expect(page.getByRole('row').nth(1)).toContainText('Stopped');await expect(page.getByLabel('Route progress')).toContainText('Visited: 0 of 1');
 await expect(page.getByLabel('Import STEP')).toBeEnabled();
});
