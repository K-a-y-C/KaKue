import {test,expect} from '@playwright/test';

test('fresh application waits for CAD import before showing any scene or scan controls',async({page})=>{
 const cadRequests:string[]=[];page.on('request',request=>{if(/\.glb$|\.step$|\.wasm$|worker/.test(request.url()))cadRequests.push(request.url());});
 await page.goto('./');
 await expect(page).toHaveTitle('KaKue Scan Studio');
 await expect(page.getByRole('img',{name:'3D robot and door scene'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Run',exact:true})).toHaveCount(0);
 await expect(page.getByRole('img',{name:'KaKue Automation'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Create a scan workspace'})).toBeVisible();
 await expect(page.getByLabel('Import STEP')).toBeEnabled();
 await page.waitForTimeout(350);expect(cadRequests).toEqual([]);
});

test('imported actual CAD opens a branded inspection workspace with the selected filename',async({page})=>{
 const {readFile}=await import('node:fs/promises');const source=await readFile('3d files/car-front-door-1/DOOR-of-CAR.step');
 const requests:string[]=[];page.on('request',request=>requests.push(request.url()));await page.goto('./');
 await page.screenshot({path:'docs/verification/workspace-welcome.png'});
 await page.getByLabel('Import STEP').setInputFiles({name:'Presenter door.stp',mimeType:'application/octet-stream',buffer:source});
 await expect(page.getByRole('status')).toContainText('Scene ready');
 await expect(page.getByRole('heading',{name:'Create a scan workspace'})).toHaveCount(0);
 await expect(page.getByText('Presenter door.stp',{exact:true})).toBeVisible();
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 await expect.poll(async()=>{const box=await canvas.boundingBox();return {y:Math.round(box!.y),width:Math.round(box!.width),height:Math.round(box!.height)};}).toEqual({y:110,width:1130,height:790});
 expect(requests.some(url=>url.endsWith('DOOR-of-CAR.step'))).toBe(false);
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
 for(const size of [{width:1440,height:900},{width:1280,height:800}]){await page.setViewportSize(size);await expect.poll(async()=>Math.round((await canvas.boundingBox())!.height)).toBe(size.height-110);expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`docs/verification/workspace-imported-${size.width}.png`});}
});

test('invalid first imports stay on the import screen and another STEP opens only its own geometry',async({page})=>{
 const requests:string[]=[];page.on('request',request=>requests.push(request.url()));await page.goto('./');
 await page.getByLabel('Import STEP').setInputFiles({name:'door.CATPart',mimeType:'application/octet-stream',buffer:Buffer.from('unsupported')});
 await expect(page.getByRole('alert')).toContainText('CATPart is not supported');await expect(page.getByRole('img',{name:'3D robot and door scene'})).toHaveCount(0);
 await page.getByLabel('Import STEP').setInputFiles({name:'malformed.step',mimeType:'application/octet-stream',buffer:Buffer.from('not a STEP model')});await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByRole('img',{name:'3D robot and door scene'})).toHaveCount(0);
 await page.getByLabel('Import STEP').setInputFiles('tests/fixtures/box-mm.step');await expect(page.getByRole('status')).toContainText('Scene ready');
 await expect(page.getByText('box-mm.step',{exact:true})).toBeVisible();await expect(page.locator('dl')).toContainText('100.0 × 300.0 mm');
 expect(requests.some(url=>url.endsWith('/door/door.glb')||url.endsWith('DOOR-of-CAR.step'))).toBe(false);
 await page.reload();await expect(page.getByRole('heading',{name:'Create a scan workspace'})).toBeVisible();await expect(page.getByRole('img',{name:'3D robot and door scene'})).toHaveCount(0);await expect(page.getByRole('button',{name:'Run',exact:true})).toHaveCount(0);
});

test('a later first import owns the workspace even if old cache loading finishes late',async({page})=>{
 let release!:()=>void;const held=new Promise<void>(resolve=>{release=resolve;});let requested!:()=>void;const started=new Promise<void>(resolve=>{requested=resolve;});let first=true;
 await page.route('**/demo-v1/door/door.glb',async route=>{if(first){first=false;requested();await held;}await route.continue();});
 await page.goto('./');await page.getByLabel('Import STEP').setInputFiles('3d files/car-front-door-1/DOOR-of-CAR.step');
 await started;await expect(page.getByText('Preparing your workspace',{exact:true})).toBeVisible();
 await page.getByLabel('Import STEP').setInputFiles('tests/fixtures/box-mm.step');
 try{await expect(page.getByRole('status')).toContainText('Scene ready',{timeout:20000});}finally{release();}
 await page.waitForTimeout(500);await expect(page.getByText('box-mm.step',{exact:true})).toBeVisible();await expect(page.locator('dl')).toContainText('100.0 × 300.0 mm');
 await expect(page.getByRole('alert')).toHaveCount(0);
});
