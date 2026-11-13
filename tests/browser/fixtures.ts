import {test as base,expect,type Page} from '@playwright/test';
export {expect,type Page};
/** Existing scan behaviors explicitly choose the supplied example after navigation. */
export const test=base.extend({page:async({page},use)=>{
 const goto=page.goto.bind(page);
 page.goto=async(...args:Parameters<Page['goto']>)=>{
  const response=await goto(...args);
  await page.getByRole('button',{name:'Try example',exact:true}).click();
  return response;
 };
 await use(page);
}});
