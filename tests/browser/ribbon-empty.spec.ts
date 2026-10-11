import {test,expect} from '@playwright/test';
test('empty desktop workspace exposes import and disables scan commands without requesting CAD',async({page})=>{
 const requests:string[]=[];page.on('request',r=>{if(/\.glb$|\.step$|\.wasm$|worker/.test(r.url()))requests.push(r.url());});await page.goto('./');
 await expect(page.getByText('No model open',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Import CAD',exact:true})).toBeEnabled();
 for(const name of ['Run','Stop','Export','Set stand-off','Select surface point'])await expect(page.getByRole('button',{name,exact:true})).toBeDisabled();
 await expect(page.getByRole('region',{name:'Scene tree'})).toBeVisible();await expect(page.getByRole('img',{name:'3D robot and door scene'})).toHaveCount(0);
 for(const size of [{width:1440,height:900},{width:1280,height:800}]){await page.setViewportSize(size);await page.screenshot({path:`docs/verification/ribbon-empty-${size.width}${process.env.PREVIEW==='1'?'-production':''}.png`});}
 await page.waitForTimeout(350);expect(requests).toEqual([]);
});
