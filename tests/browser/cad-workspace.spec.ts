import {clickScene} from './scene-clicks';
import {test,expect} from './fixtures';

test('actual CAD opens a professional modeling shell while keeping the scan viewport and controls',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await expect(page.getByRole('tab',{name:'Scan',exact:true})).toHaveAttribute('aria-selected','true');
 await expect(page.getByRole('region',{name:'Scene tree'})).toContainText('Imported part');
 await expect(page.getByRole('region',{name:'Scene tree'})).toContainText('Robot assembly');
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Stop',exact:true})).toBeDisabled();
 await expect(page.getByLabel('Import STEP')).toBeEnabled();
 for(const size of [{width:1440,height:900},{width:1280,height:800}]){
  await page.setViewportSize(size);
  const canvas=page.getByRole('img',{name:'3D robot and door scene'});
  await expect.poll(async()=>{const box=(await canvas.boundingBox())!;return {x:box.x,y:box.y,width:box.width,height:box.height};}).toEqual({x:221,y:188,width:size.width-492,height:size.height-212});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  await page.screenshot({path:`docs/verification/ribbon-shell-${size.width}${process.env.PREVIEW==='1'?'-production':''}.png`});
 }
});

test('menus support keyboard dismissal and placeholders cannot alter the imported scan session',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await clickScene(page,704,498);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),joints=await canvas.getAttribute('data-joint-angles'),row=await page.getByRole('row').nth(1).innerText();
 const file=page.getByRole('button',{name:'File',exact:true});
 await file.focus();await page.keyboard.press('Enter');await expect(file).toHaveAttribute('aria-expanded','true');
 await expect(page.getByRole('button',{name:'Save project',exact:true})).toBeEnabled();
 await page.keyboard.press('Escape');await expect(file).toHaveAttribute('aria-expanded','false');await expect(file).toBeFocused();
 await file.click();await page.getByRole('status').click();await expect(file).toHaveAttribute('aria-expanded','false');
 await expect(page.getByRole('row')).toHaveCount(2);expect(await page.getByRole('row').nth(1).innerText()).toBe(row);await expect(canvas).toHaveAttribute('data-joint-angles',joints!);
 await expect(page.getByRole('button',{name:'Run',exact:true})).toBeEnabled();
});
