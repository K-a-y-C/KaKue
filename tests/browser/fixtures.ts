import {test as base,expect,type Page} from '@playwright/test';
export {expect,type Page};
/** Existing scan behaviors explicitly choose the supplied source after navigation. */
export const test=base.extend({page:async({page},use)=>{
 const goto=page.goto.bind(page);
 page.goto=async(...args:Parameters<Page['goto']>)=>{
  const response=await goto(...args);
  await page.getByLabel('Import STEP').setInputFiles('3d files/car-front-door-1/DOOR-of-CAR.step');
  return response;
 };
 await use(page);
}});
