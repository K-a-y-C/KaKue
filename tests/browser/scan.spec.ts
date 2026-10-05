import {test,expect} from './fixtures';

test('Run keeps the laser on from first approach through transit; Stop extinguishes and freezes it',async({page})=>{
 test.setTimeout(60000);
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await page.mouse.click(704,498);await page.mouse.click(712,520);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),home=await canvas.getAttribute('data-joint-angles');
 await canvas.evaluate(element=>{
  (window as any).laserStates=[];
  new MutationObserver(()=>{const value=(element as HTMLElement).dataset.laser;const states=(window as any).laserStates;if(states.at(-1)!==value)states.push(value);}).observe(element,{attributes:true});
 });
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(canvas).not.toHaveAttribute('data-joint-angles',home!);
 await expect(canvas).toHaveAttribute('data-laser','true');
 await expect(page.getByLabel('Route progress')).toContainText('Current point: 2',{timeout:45000});
 await expect(canvas).toHaveAttribute('data-laser','true');
 expect(await page.evaluate(()=>(window as any).laserStates)).toEqual(['true']);
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
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');await page.mouse.click(704,498);
 const input=page.getByLabel('Stand-off (mm)'),run=page.getByRole('button',{name:'Run',exact:true}),canvas=page.getByRole('img',{name:'3D robot and door scene'});
 for(const value of ['49','501','']){await input.fill(value);await expect(run).toBeDisabled();}
 await input.fill(String(standOffMm));await expect(run).toBeEnabled();
 await page.mouse.move(700,450);await page.mouse.wheel(0,-700);
 await run.click();await expect(input).toBeDisabled();
 await expect(canvas).toHaveAttribute('data-laser','true',{timeout:15000});
 await expect(canvas).toHaveAttribute('data-fan-reach-m',String(standOffMm/1000));
 await expect(canvas).toHaveAttribute('data-fan-width-m','0.24');
 await expect(canvas).toHaveAttribute('data-fan-height-m','0.18');
 const corners=JSON.parse((await canvas.getAttribute('data-fan-end-corners-m'))!);
 expect(corners).toEqual([[-.12,-.09,standOffMm/1000],[.12,-.09,standOffMm/1000],[.12,.09,standOffMm/1000],[-.12,.09,standOffMm/1000]]);
 await expect(canvas).toHaveAttribute('data-fan-rays','117');
 await page.waitForFunction(()=>document.querySelector('canvas')?.getAttribute('data-joint-angles')===(window as any).fanPlan?.points[0].angles?.join(','));
 const mode=process.env.PREVIEW==='1'?'-production':'';
 const {writeFile}=await import('node:fs/promises');
 await writeFile(`docs/verification/laser-volume-${standOffMm}${mode}.json`,JSON.stringify({standOffMm,cornersM:corners,widthM:Number(await canvas.getAttribute('data-fan-width-m')),heightM:Number(await canvas.getAttribute('data-fan-height-m')),rays:Number(await canvas.getAttribute('data-fan-rays')),emitterPose:(await canvas.getAttribute('data-emitter-pose'))!.split(',').map(Number),angles:(await canvas.getAttribute('data-joint-angles'))!.split(',').map(Number)},null,2)+'\n');
 await page.screenshot({path:`docs/verification/laser-volume-${standOffMm}${mode}.png`});
 await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:45000});
 await expect(canvas).toHaveAttribute('data-laser','false');
});
