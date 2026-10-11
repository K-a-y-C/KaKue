import type {Page} from '@playwright/test';
/** Reproject independently recorded hits from the accepted 1130×790 canvas.
 * Camera pose and vertical FOV are unchanged; perspective coordinates scale by height.
 * This preserves the actual surface location, rather than fitting/moving geometry.
 */
export async function scenePosition(page:Page,x:number,y:number) {
 const bounds=(await page.getByRole('img',{name:'3D robot and door scene'}).boundingBox())!;
 const scale=bounds.height/790;
 return {x:bounds.x+bounds.width/2+(x-565)*scale,y:bounds.y+bounds.height/2+(y-505)*scale};
}
export async function clickScene(page:Page,x:number,y:number,options?:Parameters<Page['mouse']['click']>[2]) {
 const hit=await scenePosition(page,x,y);await page.mouse.click(hit.x,hit.y,options);
}
export async function moveScene(page:Page,x:number,y:number,options?:Parameters<Page['mouse']['move']>[2]) {
 const hit=await scenePosition(page,x,y);await page.mouse.move(hit.x,hit.y,options);
}
export async function setStandOff(page:Page,value:string) {
 await page.getByRole('tab',{name:'Properties',exact:true}).click();
 await page.getByLabel('Stand-off (mm)').fill(value);
 await page.getByRole('tab',{name:'Scan data',exact:true}).click();
}
