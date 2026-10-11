import {clickScene,moveScene,setStandOff} from './scene-clicks';
import {test,expect} from './fixtures';

test('Run keeps the laser off until point 1, then on through scan transit; Stop extinguishes and freezes it',async({page})=>{
 test.setTimeout(60000);
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await clickScene(page,704,498);await clickScene(page,712,520);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),home=await canvas.getAttribute('data-joint-angles');
 await canvas.evaluate(element=>{
  (window as any).laserStates=[];
  new MutationObserver(()=>{const value=(element as HTMLElement).dataset.laser;const states=(window as any).laserStates;if(states.at(-1)!==value)states.push(value);}).observe(element,{attributes:true});
 });
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(canvas).not.toHaveAttribute('data-joint-angles',home!);
 await expect(canvas).toHaveAttribute('data-laser','false');
 await expect(canvas).toHaveAttribute('data-laser','true',{timeout:45000});
 await expect(page.getByLabel('Route progress')).toContainText('Current point: 2',{timeout:45000});
 await expect(canvas).toHaveAttribute('data-laser','true');
 expect(await page.evaluate(()=>(window as any).laserStates)).toEqual(['false','true']);
 await page.getByRole('button',{name:'Stop',exact:true}).click();
 await expect(canvas).toHaveAttribute('data-laser','false');
 const frozen=await canvas.getAttribute('data-joint-angles');await page.waitForTimeout(1200);
 await expect(canvas).toHaveAttribute('data-joint-angles',frozen!);
 await expect(page.getByRole('row').nth(1)).toContainText('Visited');
 await expect(page.getByRole('row').nth(2)).toContainText('Stopped');
});

for(const standOffMm of [50,500])test(`${standOffMm} mm is accepted and the rigid 3D beam reaches a rectangular patch; range remains locked during Run`,async({page})=>{
 test.setTimeout(60000);
 await page.addInitScript(()=>{const NativeWorker=Worker;window.Worker=class extends NativeWorker{constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('preflight'))this.addEventListener('message',event=>{(window as any).fanPlan=event.data.plan;});}};});
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');await clickScene(page,704,498);
 const input=page.getByLabel('Stand-off (mm)'),run=page.getByRole('button',{name:'Run',exact:true}),canvas=page.getByRole('img',{name:'3D robot and door scene'});
 for(const value of ['49','501','']){await setStandOff(page,value);await expect(run).toBeDisabled();}
 await setStandOff(page,String(standOffMm));await expect(run).toBeEnabled();
 await moveScene(page,700,450);await page.mouse.wheel(0,-700);
 // Capture the short endpoint dwell atomically in the browser. Separate protocol
 // reads can straddle laser-off home return, which restores idle beam dimensions.
 await canvas.evaluate(element=>{
  new MutationObserver(()=>{
   const data=(element as HTMLElement).dataset;
   if(data.laser==='true'&&data.jointAngles===(window as any).fanPlan?.points[0].angles?.join(','))
    (window as any).activeFan={...data};
  }).observe(element,{attributes:true});
 });
 await run.click();await expect(input).toBeDisabled();
 await page.waitForFunction(()=>(window as any).activeFan,{},{timeout:15000});
 const fan=await page.evaluate(()=>(window as any).activeFan as Record<string,string>);
 expect(fan.laser).toBe('true');expect(fan.fanReachM).toBe(String(standOffMm/1000));
 expect(fan.fanWidthM).toBe('0.24');expect(fan.fanHeightM).toBe('0.18');
 const corners=JSON.parse(fan.fanEndCornersM);
 expect(corners).toEqual([[-.12,-.09,standOffMm/1000],[.12,-.09,standOffMm/1000],[.12,.09,standOffMm/1000],[-.12,.09,standOffMm/1000]]);
 expect(fan.fanRays).toBe('117');
 const mode=process.env.PREVIEW==='1'?'-production':'';
 const {writeFile}=await import('node:fs/promises');
 await writeFile(`docs/verification/ribbon-volume-${standOffMm}${mode}.json`,JSON.stringify({standOffMm,cornersM:corners,widthM:Number(fan.fanWidthM),heightM:Number(fan.fanHeightM),rays:Number(fan.fanRays),emitterPose:fan.emitterPose.split(',').map(Number),angles:fan.jointAngles.split(',').map(Number)},null,2)+'\n');
 await page.screenshot({path:`docs/verification/ribbon-volume-${standOffMm}${mode}.png`});
 await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:45000});
 await expect(canvas).toHaveAttribute('data-laser','false');
});
