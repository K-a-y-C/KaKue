import {test,expect} from '@playwright/test';

test('selected door points run in order with progress and post-dwell visits',async({page})=>{
  test.setTimeout(90000);
  await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
  await page.mouse.click(704,498);await page.mouse.click(712,520);
  await expect(page.getByRole('row')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Run',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.getByLabel('Route progress')).toContainText('Current point: 1');
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 0 of 2');
  await expect(page.getByRole('row').nth(1)).toContainText('Moving');
  await expect(page.getByRole('row').nth(2)).toContainText('Ready');
  const canvas=page.getByRole('img',{name:'3D robot and door scene'});
  await expect(page.getByLabel('Route progress')).toContainText('Current point: 2',{timeout:45000});
  await expect(page.getByRole('row').nth(1)).toContainText('Visited');
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 1 of 2');
  await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:45000});
  await expect(page.getByLabel('Route progress')).toContainText('Visited: 2 of 2');
  await expect(canvas).toHaveAttribute('data-laser','false');
  const final=await canvas.getAttribute('data-joint-angles');await page.waitForTimeout(1100);
  await expect(canvas).toHaveAttribute('data-joint-angles',final!);
});

test('a later unsolved actual door target blocks every motion and leaves earlier points not visited',async({page})=>{
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await page.mouse.click(704,498);await page.mouse.click(780,500);
 await expect(page.getByRole('row')).toHaveCount(3);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),home=await canvas.getAttribute('data-joint-angles');
 await canvas.evaluate(element=>{(window as any).motionStarted=false;new MutationObserver(()=>{if((element as HTMLElement).dataset.jointAngles!==((window as any).initialAngles)||(element as HTMLElement).dataset.laser==='true')(window as any).motionStarted=true;}).observe(element,{attributes:true});(window as any).initialAngles=(element as HTMLElement).dataset.jointAngles;});
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Sequence blocked');
 await expect(page.getByRole('row').nth(1)).toContainText('Not visited');
 await expect(page.getByRole('row').nth(2)).toContainText('Pose not solved');
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 0 of 2');
 await expect(canvas).toHaveAttribute('data-joint-angles',home!);await expect(canvas).toHaveAttribute('data-laser','false');
 expect(await page.evaluate(()=>(window as any).motionStarted)).toBe(false);
});

test('the frozen five actual surface clicks complete with bounded joints and one-second ordered dwells',async({page})=>{
 test.setTimeout(120000);
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const clicks=[[681.160927,480.122642],[681.219904,506.444347],[680.244766,523.942241],[761.506759,575.148953],[764.290822,528.705958]];
 for(const [x,y] of clicks)await page.mouse.click(x,y);
 await expect(page.getByRole('row')).toHaveCount(6);
 const surfaces=await page.getByRole('row').all();
 const reference=[[1648.553932,300,550],[1658.438598,300,400],[1658.438587,300,300],[1656.719024,-300,300],[1645.645252,-300,550]];
 for(let i=0;i<5;i++){
  const cells=await surfaces[i+1].locator('td').allTextContents();expect(Math.hypot(...cells.slice(0,3).map((v,j)=>Number(v)-reference[i][j]))).toBeLessThan(0.15);
 }
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 await canvas.evaluate(element=>{
  const records:any[]=[];(window as any).routeEvidence=records;
  new MutationObserver(()=>records.push({time:performance.now(),angles:(element as HTMLElement).dataset.jointAngles,pose:(element as HTMLElement).dataset.emitterPose,laser:(element as HTMLElement).dataset.laser,progress:document.querySelector('[aria-label="Route progress"]')?.textContent,statuses:[...document.querySelectorAll('tbody tr')].map(r=>r.lastElementChild?.textContent)})).observe(element,{attributes:true});
 });
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:95000});
 await expect(page.getByLabel('Route progress')).toContainText('Visited: 5 of 5');
 for(let i=1;i<=5;i++)await expect(page.getByRole('row').nth(i)).toContainText('Visited');
 const records=await page.evaluate(()=>(window as any).routeEvidence as any[]);
 const limits=[[-185,185],[-185,65],[-138,175],[-350,350],[-130,130],[-350,350]];
 for(const record of records)record.angles.split(',').map(Number).forEach((q:number,i:number)=>{expect(q*180/Math.PI).toBeGreaterThanOrEqual(limits[i][0]);expect(q*180/Math.PI).toBeLessThanOrEqual(limits[i][1]);});
 const dwells:any[][]=[];
 for(const record of records){if(record.laser==='true'){if(!dwells.length||dwells.at(-1)!.at(-1)!.ended)dwells.push([]);dwells.at(-1)!.push(record);}else if(dwells.length&&!dwells.at(-1)!.at(-1)!.ended)dwells.at(-1)!.push({...record,ended:true});}
 expect(dwells).toHaveLength(5);
 for(let i=0;i<5;i++){
  const dwell=dwells[i],first=dwell[0],last=dwell.at(-1)!;
  expect(last.time-first.time).toBeGreaterThanOrEqual(990);
  expect(new Set(dwell.filter(r=>!r.ended).map(r=>r.angles)).size).toBe(1);
  expect(first.progress).toContain(`Current point: ${i+1}`);
  expect(first.statuses[i]).toBe('Moving');
  const normal=(await surfaces[i+1].getAttribute('data-base-normal'))!.split(',').map(Number);
  const pose=first.pose.split(',').map(Number),target=reference[i].map((v,j)=>v/1000+.1*normal[j]);
  expect(Math.hypot(...target.map((v,j)=>v-pose[12+j]))*1000).toBeLessThanOrEqual(5);
  expect(Math.acos(Math.max(-1,Math.min(1,-normal.reduce((s,v,j)=>s+v*pose[8+j],0))))*180/Math.PI).toBeLessThanOrEqual(5);
 }
 await expect(canvas).toHaveAttribute('data-laser','false');
 const final=await canvas.getAttribute('data-joint-angles');await page.waitForTimeout(1100);await expect(canvas).toHaveAttribute('data-joint-angles',final!);
 const selectedPoints=await Promise.all(surfaces.slice(1).map(async(row,i)=>{
  const partPosition=(await row.getAttribute('data-part-position'))!.split(',').map(Number);
  return {id:i+1,order:i+1,partPosition,basePosition:[.9203385949134826-partPosition[1],-2.0353724360466003+partPosition[0],-.367240297+partPosition[2]],baseNormal:(await row.getAttribute('data-base-normal'))!.split(',').map(Number)};
 }));
 const {writeFile}=await import('node:fs/promises');
 await writeFile(`docs/verification/issue-07-browser-route${process.env.PREVIEW==='1'?'-production':''}.json`,JSON.stringify({clicks,reference,selectedPoints,records},null,2)+'\n');
 await page.getByLabel('Route progress').scrollIntoViewIfNeeded();await page.screenshot({path:`docs/verification/issue-07-route${process.env.PREVIEW==='1'?'-production':''}.png`});
});
