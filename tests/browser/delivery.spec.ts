import {test,expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const evidencePrefix=process.env.EVIDENCE_PREFIX??'issue-10';

test('production import and pose preparation resolve local workers/WASM and record actual transfer sizes',async({page})=>{
 test.skip(process.env.PREVIEW!=='1','Static-production delivery gate.');test.setTimeout(90000);
 const responses:{url:string;status:number;type:string}[]=[],sizes:Promise<unknown>[]=[],failures:string[]=[];
 page.on('response',response=>responses.push({url:response.url(),status:response.status(),type:response.headers()['content-type']??''}));
 page.on('requestfinished',request=>sizes.push(request.sizes().then(size=>({url:request.url(),...size}))));
 page.on('requestfailed',request=>failures.push(request.url()));
 await page.addInitScript(()=>{
  (window as any).deliveryFrames=[];
  const frame=(time:number)=>{(window as any).deliveryFrames.push(time);requestAnimationFrame(frame);};requestAnimationFrame(frame);
 });
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const importStart=await page.evaluate(()=>performance.now());
 await page.getByLabel('Import STEP').setInputFiles('3d files/car-front-door-1/DOOR-of-CAR.step');
 await expect(page.getByRole('status')).toContainText('Loading model');
 await page.mouse.move(460,380);await page.mouse.down();await page.mouse.move(510,410);await page.mouse.up();
 await expect(page.getByRole('status')).toContainText('Scene ready',{timeout:45000});
 const importEnd=await page.evaluate(()=>performance.now());
 // A fresh import fits the initial camera; actual supplied surface click remains valid.
 await page.mouse.click(704,498);await expect(page.getByRole('row')).toHaveCount(2);
 await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.getByRole('row').nth(1)).toContainText('Moving');
 await page.getByRole('button',{name:'Stop',exact:true}).click();await expect(page.getByRole('status')).toContainText('Simulation stopped');
 const origin=new URL(page.url()).origin;expect(failures).toEqual([]);
 for(const response of responses){expect(new URL(response.url).origin).toBe(origin);expect(response.status).toBe(200);}
 for(const pattern of [/step\.worker-[^/]+\.js$/, /preflight\.worker-[^/]+\.js$/, /occt-import-js\.js$/]){
  const response=responses.find(r=>pattern.test(r.url));expect(response).toBeDefined();expect(response!.type).toContain('javascript');
 }
 const wasm=responses.find(r=>r.url.endsWith('.wasm'));expect(wasm?.type).toContain('application/wasm');
 const frames=await page.evaluate(({start,end})=>(window as any).deliveryFrames.filter((t:number)=>t>=start&&t<=end) as number[],{start:importStart,end:importEnd});
 expect(frames.length).toBeGreaterThan(2);
 const transfer=await Promise.all(sizes);
 await writeFile(`docs/verification/${evidencePrefix}-network${process.env.PRESENTER==='1'?'-hardware':''}.json`,JSON.stringify({mode:process.env.PRESENTER==='1'?'static-production-hardware':'static-production-software-WebGL',origin,requests:responses,transfers:transfer,import:{elapsedMs:importEnd-importStart,animationFrames:frames.length,maxFrameGapMs:Math.max(...frames.slice(1).map((t,i)=>t-frames[i]))}},null,2)+'\n');
});

for(const size of [{width:1280,height:800},{width:1440,height:900}])test(`production controls and terminal files remain readable at ${size.width}x${size.height}`,async({page})=>{
 test.skip(process.env.PREVIEW!=='1','Static-production layout gate.');
 await page.setViewportSize(size);await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),bounds=await canvas.boundingBox();
 expect(bounds!.width/size.width).toBeGreaterThan(.75);expect(bounds!.height).toBeGreaterThan(500);
 await expect(page.getByLabel('Import STEP')).toBeVisible();await page.getByRole('button',{name:'Run',exact:true}).scrollIntoViewIfNeeded();
 await page.setViewportSize({width:1440,height:900});await expect.poll(async()=>{const box=await canvas.boundingBox();return {width:Math.round(box!.width),height:Math.round(box!.height)};}).toEqual({width:1130,height:790});await page.mouse.click(704,498);await page.mouse.click(712,520);
 await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.getByRole('row').nth(1)).toContainText('Moving');
 await page.getByRole('button',{name:'Stop',exact:true}).click();await expect(page.getByRole('status')).toContainText('Simulation stopped');
 await page.setViewportSize(size);
 await expect.poll(async()=>Math.round((await canvas.boundingBox())!.height)).toBe(size.height-110);
 expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
 for(const name of ['Download selected points (PLY)','Download coordinates (CSV)','Download original STEP']){
  const button=page.getByRole('button',{name,exact:true});await button.scrollIntoViewIfNeeded();await expect(button).toBeVisible();
  const box=await button.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(size.width-310);expect(box!.x+box!.width).toBeLessThanOrEqual(size.width);expect(box!.height).toBeGreaterThanOrEqual(32);
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`docs/verification/${evidencePrefix}-layout-${size.width}x${size.height}.png`});
});

for(const size of [{width:1440,height:900},{width:1280,height:800}])test(`hardware Chrome sustains the actual five-point presentation at ${size.width}x${size.height}`,async({page,browser})=>{
 test.skip(process.env.PREVIEW!=='1'||process.env.PRESENTER!=='1','Opt-in visible hardware presenter measurement.');test.setTimeout(180000);
 await page.addInitScript(()=>{
  (window as any).presenterFrames=[];
  const frame=(time:number)=>{
   if(document.querySelector('canvas[aria-label="3D robot and door scene"]')?.getAttribute('data-laser')==='true')(window as any).presenterFrames.push(time);
   requestAnimationFrame(frame);
  };requestAnimationFrame(frame);
 });
 await page.setViewportSize({width:1440,height:900});await page.goto('./');await page.bringToFront();await expect(page.getByRole('status')).toContainText('Scene ready');
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 const graphics=await canvas.evaluate(element=>{
  const gl=(element as HTMLCanvasElement).getContext('webgl2')!,info=gl.getExtension('WEBGL_debug_renderer_info');
  return {vendor:info?String(gl.getParameter(info.UNMASKED_VENDOR_WEBGL)):'unavailable',renderer:info?String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)):'unavailable'};
 });
 expect(graphics.renderer).not.toMatch(/swiftshader|software|llvmpipe|unavailable/i);
 const clicks=[[681.160927,480.122642],[681.219904,506.444347],[680.244766,523.942241],[761.506759,575.148953],[764.290822,528.705958]];
 for(const [x,y] of clicks)await page.mouse.click(x,y);await expect(page.getByRole('row')).toHaveCount(6);
 await page.setViewportSize(size);await expect.poll(async()=>Math.round((await canvas.boundingBox())!.height)).toBe(size.height-110);
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:125000});await expect(page.getByLabel('Route progress')).toContainText('Visited: 5 of 5');
 const frames=await page.evaluate(()=>(window as any).presenterFrames as number[]);expect(frames.length).toBeGreaterThan(30);
 const intervals=frames.slice(1).map((t,i)=>t-frames[i]),sorted=[...intervals].sort((a,b)=>a-b);
 const fps=(frames.length-1)*1000/(frames.at(-1)!-frames[0]);
 const display=await canvas.evaluate(element=>({devicePixelRatio,bufferWidth:(element as HTMLCanvasElement).width,bufferHeight:(element as HTMLCanvasElement).height}));
 const report={scheduling:'visible hardware; background throttles and Chrome battery-saver frame cap disabled for measurement',visibility:await page.evaluate(()=>({state:document.visibilityState,focused:document.hasFocus()})),display,browser:browser.version(),mode:'visible hardware Chrome',graphics,viewport:size,standOffMm:100,selectedPoints:5,visited:5,frames:frames.length,activeElapsedMs:frames.at(-1)!-frames[0],fps,p95FrameIntervalMs:sorted[Math.floor(.95*(sorted.length-1))],maxFrameIntervalMs:Math.max(...intervals),frameTimesMs:frames};
 await writeFile(`docs/verification/${evidencePrefix}-presenter-${size.width}x${size.height}.json`,JSON.stringify(report,null,2)+'\n');
 await page.screenshot({path:`docs/verification/${evidencePrefix}-presenter-${size.width}x${size.height}.png`});
 expect(fps).toBeGreaterThanOrEqual(30);
});


test('hardware production five-point preparation keeps camera and animation responsive',async({page})=>{
 test.skip(process.env.PREVIEW!=='1'||process.env.PRESENTER!=='1','Opt-in hardware worker responsiveness evidence.');test.setTimeout(60000);
 await page.addInitScript(()=>{(window as any).preparationFrames=[];const frame=(time:number)=>{if(document.querySelector('[role="status"]')?.textContent?.includes('Preparing scanner poses'))(window as any).preparationFrames.push(time);requestAnimationFrame(frame);};requestAnimationFrame(frame);});
 await page.goto('./');await page.bringToFront();await expect(page.getByRole('status')).toContainText('Scene ready');
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 for(const [x,y] of [[681.160927,480.122642],[681.219904,506.444347],[680.244766,523.942241],[761.506759,575.148953],[764.290822,528.705958]])await page.mouse.click(x,y);
 const beforeCamera=await canvas.screenshot();await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Preparing scanner poses');
 await page.mouse.move(440,350);await page.mouse.down();await page.mouse.move(480,375,{steps:5});await page.mouse.up();await page.waitForTimeout(150);
 await expect(page.getByRole('status')).toContainText('Preparing scanner poses');
 const afterCamera=await canvas.screenshot();expect(afterCamera.equals(beforeCamera)).toBe(false);await expect(page.getByRole('row')).toHaveCount(6);
 await expect(canvas).toHaveAttribute('data-laser','true',{timeout:45000});
 const preparationFrames=await page.evaluate(()=>(window as any).preparationFrames as number[]);expect(preparationFrames.length).toBeGreaterThan(2);
 const preparationIntervals=preparationFrames.slice(1).map((t,i)=>t-preparationFrames[i]);expect(Math.max(...preparationIntervals)).toBeLessThan(250);
 const preparation={cameraChanged:true,selectedPointsRetained:5,frames:preparationFrames.length,elapsedMs:preparationFrames.at(-1)!-preparationFrames[0],maxFrameGapMs:Math.max(...preparationIntervals),frameTimesMs:preparationFrames};
 await page.getByRole('button',{name:'Stop',exact:true}).click();await expect(page.getByRole('status')).toContainText('Simulation stopped');
 await writeFile(`docs/verification/${evidencePrefix}-preparation.json`,JSON.stringify(preparation,null,2)+'\n');
 await writeFile(`docs/verification/${evidencePrefix}-preparation-before.png`,beforeCamera);await writeFile(`docs/verification/${evidencePrefix}-preparation-after.png`,afterCamera);
});
