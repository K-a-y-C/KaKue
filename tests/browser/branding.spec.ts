import {test,expect} from './fixtures';

test('title bar shows Scan Studio and no source filename while the document keeps its name',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const title=page.locator('.title-bar');
 await expect(page).toHaveTitle('Scan Studio');
 await expect(page.locator('body')).not.toContainText(/kakue/i);
 await expect(title.getByRole('heading',{level:1})).toHaveText('Scan Studio');
 await expect(title).not.toContainText('DOOR-of-CAR.step');
 await expect(page.locator('.document-strip')).toContainText('DOOR-of-CAR.step — 3D view');
 await expect(page.getByRole('region',{name:'Scene tree'})).toContainText('Imported part — DOOR-of-CAR.step');
});

test('workspace has no KaKue logos at either desktop size',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 for(const size of [{width:1440,height:900},{width:1280,height:800}]){
  await page.setViewportSize(size);
  await expect(page.getByRole('img',{name:'KaKue Automation'})).toHaveCount(0);
  await expect(page.getByRole('heading',{level:1})).toHaveText('Scan Studio');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});

test('actual 3D scene background uses the company blue sampled from the supplied logo',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 const screenshot=(await canvas.screenshot()).toString('base64');
 const pixel=await page.evaluate(async screenshot=>{
  const source=new Image();source.src=`data:image/png;base64,${screenshot}`;await source.decode();
  const image=document.createElement('canvas');image.width=source.width;image.height=source.height;
  const context=image.getContext('2d')!;context.drawImage(source,0,0);
  return [...context.getImageData(10,10,1,1).data];
 },screenshot);
 expect(pixel).toEqual([0,64,151,255]);
 if(process.env.PREVIEW==='1')await page.screenshot({path:'docs/verification/issue-32-production.png'});
});
