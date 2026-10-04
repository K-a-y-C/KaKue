import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const server=spawn(process.execPath,['tools/robot-assets/preview-server.mjs'],{cwd:root,env:{...process.env,ROBOT_PREVIEW_PORT:'4173'},stdio:['ignore','pipe','pipe']});
let browser;
try {
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Preview server exited ${code}`)));});
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto('http://127.0.0.1:4173');
  await page.waitForFunction(()=>window.robotVerification?.loaded,{timeout:30000});
  assert.deepEqual(await page.evaluate(()=>window.robotVerification.emitterMm),[1048,0,1450]);
  await page.screenshot({path:root+'assets/robot/evidence/home-overlay.png'});
  await page.locator('#overlay').uncheck();
  await page.screenshot({path:root+'assets/robot/evidence/home.png'});
  await page.locator('#wrist').click();
  assert.deepEqual(await page.evaluate(()=>window.robotVerification.emitterMm),[815,0,1217]);
  await page.screenshot({path:root+'assets/robot/evidence/wrist-bend.png'});
  await page.locator('#home').click();
  assert.deepEqual(await page.evaluate(()=>window.robotVerification.emitterMm),[1048,0,1450]);
  assert.deepEqual(errors,[]);
  console.log(`Chrome ${browser.version()}: home, source overlay, wrist bend, return home; no browser errors`);
} finally {await browser?.close();server.kill();}
