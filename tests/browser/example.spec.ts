import {test,expect} from '@playwright/test';
import {createHash} from 'node:crypto';
import {clickScene} from './scene-clicks';

test('Try example loads the supplied door on demand and supports selection and a complete scan',async({page})=>{
 test.setTimeout(90000);
 const cadRequests:string[]=[];
 page.on('request',request=>{if(/\.glb$|\.step$|\.wasm$|worker/.test(request.url()))cadRequests.push(request.url());});
 await page.goto('./');
 await expect(page.getByRole('img',{name:'KaKue Automation'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
 const example=page.getByRole('button',{name:'Try example',exact:true});
 await expect(example).toBeVisible();
 expect(cadRequests).toEqual([]);
 const response=page.waitForResponse('**/demo-v1/door/DOOR-of-CAR.step');
 await example.click();
 const source=await response;
 expect(source.status()).toBe(200);
 await expect(page.getByRole('status')).toContainText('Scene ready');
 const supplied=await page.request.get(source.url());
 expect(createHash('sha256').update(await supplied.body()).digest('hex')).toBe('a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef');
 await expect(example).toHaveCount(0);
 await expect(page.locator('.document-strip')).toContainText('DOOR-of-CAR.step — 3D view');
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
 await clickScene(page,704,498);
 await expect(page.getByRole('row')).toHaveCount(2);
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:60000});
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 1 of 1');
 await expect(page.getByRole('button',{name:'Export',exact:true})).toBeEnabled();
 await page.reload();
 await expect(example).toBeVisible();
 await expect(page.getByRole('img',{name:'3D robot and door scene'})).toHaveCount(0);
});

test('missing or mismatched example source reports an error and can retry without substituting geometry',async({page})=>{
 await page.goto('./');
 const example=page.getByRole('button',{name:'Try example',exact:true});
 await page.route('**/demo-v1/door/DOOR-of-CAR.step',route=>route.fulfill({status:404,body:'Missing door'}));
 await example.click();
 await expect(page.getByRole('alert')).toContainText('Required asset unavailable');
 await expect(page.getByRole('img',{name:'3D robot and door scene'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
 await page.unroute('**/demo-v1/door/DOOR-of-CAR.step');
 await page.route('**/demo-v1/door/DOOR-of-CAR.step',route=>route.fulfill({status:200,body:'Unrelated geometry'}));
 await example.click();
 await expect(page.getByRole('alert')).toContainText('Bundled STEP identity mismatch');
 await expect(page.getByRole('img',{name:'3D robot and door scene'})).toHaveCount(0);
 await page.unroute('**/demo-v1/door/DOOR-of-CAR.step');
 await example.click();
 await expect(page.getByRole('status')).toContainText('Scene ready');
 await expect(page.getByRole('alert')).toHaveCount(0);
});

test('local import supersedes an example still loading and ignores its late response',async({page})=>{
 let release!:()=>void,requested!:()=>void;
 const held=new Promise<void>(resolve=>{release=resolve;}),started=new Promise<void>(resolve=>{requested=resolve;});
 await page.route('**/demo-v1/door/DOOR-of-CAR.step',async route=>{requested();await held;await route.continue();});
 await page.goto('./');
 await page.getByRole('button',{name:'Try example',exact:true}).click();
 await started;
 await expect(page.getByText('Preparing your workspace',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Try example',exact:true})).toHaveCount(0);
 try{
  await page.getByLabel('Import STEP').setInputFiles('tests/fixtures/box-mm.step');
  await expect(page.getByRole('status')).toContainText('Scene ready');
 }finally{release();}
 await page.waitForTimeout(500);
 await expect(page.locator('.document-strip')).toContainText('box-mm.step — 3D view');
 await expect(page.getByRole('alert')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
});

test('example entry and loaded workspace fit both desktop sizes and support keyboard activation',async({page})=>{
 await page.goto('./');
 const mode=process.env.PREVIEW==='1'?'production':'development';
 for(const size of [{width:1440,height:900},{width:1280,height:800}]){
  await page.setViewportSize(size);
  const example=page.getByRole('button',{name:'Try example',exact:true});
  await expect(example).toBeVisible();
  const button=(await example.boundingBox())!;
  expect(button.x).toBeGreaterThanOrEqual(0);expect(button.x+button.width).toBeLessThanOrEqual(size.width);
  expect(button.y).toBeGreaterThanOrEqual(188);expect(button.y+button.height).toBeLessThan(size.height-24);
  expect(button.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  await page.screenshot({path:`docs/verification/try-example-welcome-${size.width}-${mode}.png`});
 }
 const example=page.getByRole('button',{name:'Try example',exact:true});
 await example.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('status')).toContainText('Scene ready');
 for(const size of [{width:1280,height:800},{width:1440,height:900}]){
  await page.setViewportSize(size);
  await expect.poll(async()=>Math.round((await page.getByRole('img',{name:'3D robot and door scene'}).boundingBox())!.height)).toBe(size.height-212);
  await expect(page.getByRole('img',{name:'KaKue Automation'})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  await page.screenshot({path:`docs/verification/try-example-loaded-${size.width}-${mode}.png`});
 }
});
