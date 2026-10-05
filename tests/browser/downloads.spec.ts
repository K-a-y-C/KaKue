import {test,expect,type Page} from './fixtures';
import {readFile} from 'node:fs/promises';

async function load(page:Page,clicks=[[704,498]]) {
  await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
  for(const [x,y] of clicks)await page.mouse.click(x,y);
  await expect(page.getByRole('row')).toHaveCount(clicks.length+1);
}
async function download(page:Page,name:string) {
  await expect(page.getByRole('button',{name,exact:true})).toBeEnabled();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name,exact:true}).click();
  const file=await pending;expect(await file.failure()).toBeNull();
  return {name:file.suggestedFilename(),bytes:await readFile((await file.path())!)};
}
function readPly(text:string) {
  const lines=text.trimEnd().split('\n'),end=lines.indexOf('end_header');
  expect(lines[0]).toBe('ply');expect(lines[1]).toBe('format ascii 1.0');expect(end).toBeGreaterThan(1);
  const header=lines.slice(0,end),count=Number(header.find(s=>s.startsWith('element vertex '))?.split(' ')[2]);
  expect(header.filter(s=>s.startsWith('element '))).toEqual([`element vertex ${count}`]);
  expect(header.filter(s=>s.startsWith('property '))).toEqual(['x','y','z','nx','ny','nz'].map(s=>`property double ${s}`));
  const rows=lines.slice(end+1).map(s=>s.split(' '));expect(rows).toHaveLength(count);
  for(const row of rows){expect(row).toHaveLength(6);row.forEach(v=>expect(v).toMatch(/^-?\d+\.\d{6}$/));}
  return {header,rows};
}
test('completed actual door visit downloads only selected surface vertices as a documented PLY',async({page})=>{
  test.setTimeout(60000);await load(page);
  await expect(page.getByRole('button',{name:'Download selected points (PLY)',exact:true})).toHaveCount(0);
  const row=page.getByRole('row').nth(1),surface=(await row.locator('td').allTextContents()).slice(0,3).map(Number);
  const normal=(await row.getAttribute('data-base-normal'))!.split(',').map(Number);
  await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:45000});
  const file=await download(page,'Download selected points (PLY)'),ply=readPly(file.bytes.toString('utf8'));
  expect(file.name).toBe('DOOR-of-CAR-selected-points.ply');expect(ply.rows).toHaveLength(1);
  surface.forEach((v,i)=>expect(Math.abs(Number(ply.rows[0][i])-v)).toBeLessThan(.051));
  normal.forEach((v,i)=>expect(Math.abs(Number(ply.rows[0][i+3])-v)).toBeLessThan(.00000051));
  expect(ply.header.join('\n')).toContain('robot-base');expect(ply.header.join('\n')).toContain('units mm');
  expect(ply.header.join('\n')).toContain('approach-side');expect(ply.header.join('\n')).toContain('selected CAD points');
  expect(ply.header.join('\n')).toContain('a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef');
});

// Independent RFC4180-style reader: no production formatting helpers.
function readCsv(text:string) {
  const rows:string[][]=[];let row:string[]=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(c==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}
    else if(c===','&&!quoted){row.push(field);field='';}
    else if(c==='\n'&&!quoted){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}
    else field+=c;
  }
  expect(quoted).toBe(false);if(field||row.length){row.push(field);rows.push(row);}
  expect(rows[0]).toEqual('point_id,order,frame,units,x,y,z,normal_x,normal_y,normal_z,stand_off_mm,target_x,target_y,target_z,status,reason,position_error_mm,orientation_error_deg'.split(','));
  rows.forEach(row=>expect(row).toHaveLength(18));return rows.slice(1);
}
test('completed 500 mm visit downloads matching CSV surfaces and separate emitter targets',async({page})=>{
  test.setTimeout(60000);await load(page,[[704,498],[704,498]]);
  await page.getByLabel('Stand-off (mm)').fill('500');await page.getByRole('button',{name:'Run',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:45000});
  const ply=readPly((await download(page,'Download selected points (PLY)')).bytes.toString());
  const file=await download(page,'Download coordinates (CSV)'),rows=readCsv(file.bytes.toString());
  expect(file.name).toBe('DOOR-of-CAR-selected-coordinates.csv');expect(rows).toHaveLength(2);
  rows.forEach((row,i)=>{
    expect(row.slice(0,4)).toEqual([String(i+1),String(i+1),'robot-base','mm']);expect(row.slice(4,10)).toEqual(ply.rows[i]);
    expect(Number(row[10])).toBe(500);expect(row[14]).toBe('visited');
    for(let j=0;j<3;j++)expect(Math.abs(Number(row[11+j])-(Number(row[4+j])+500*Number(row[7+j])))).toBeLessThan(.001);
    expect(row[16]).not.toBe('');expect(row[17]).not.toBe('');expect(Number(row[16])).toBeLessThanOrEqual(5);expect(Number(row[17])).toBeLessThanOrEqual(5);
  });
});

test('separate stopped downloads preserve bundled STEP bytes and release every object URL',async({page})=>{
 await page.addInitScript(()=>{
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
  (window as any).downloadUrls={created:[],revoked:[]};
  URL.createObjectURL=blob=>{const url=create(blob);(window as any).downloadUrls.created.push(url);return url;};
  URL.revokeObjectURL=url=>{(window as any).downloadUrls.revoked.push(url);revoke(url);};
 });
 await load(page,[[704,498],[712,520]]);
 let count=0;page.on('download',()=>count++);
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('row').nth(1)).toContainText('Moving');await page.getByRole('button',{name:'Stop',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation stopped');
 const ply=readPly((await download(page,'Download selected points (PLY)')).bytes.toString());
 const csv=readCsv((await download(page,'Download coordinates (CSV)')).bytes.toString());
 expect(csv.map(row=>row[14])).toEqual(['stopped','not_visited']);expect(ply.rows).toHaveLength(2);
 csv.forEach((row,i)=>{expect(row.slice(4,10)).toEqual(ply.rows[i]);expect(row.slice(16)).toEqual(['','']);});
 const file=await download(page,'Download original STEP');expect(file.name).toBe('DOOR-of-CAR.step');
 const {createHash}=await import('node:crypto');
 const original=await readFile('3d files/car-front-door-1/DOOR-of-CAR.step');
 expect(createHash('sha256').update(file.bytes).digest('hex')).toBe(createHash('sha256').update(original).digest('hex'));
 expect(file.bytes).toEqual(original);expect(count).toBe(3);
 await expect.poll(async()=>page.evaluate(()=>(window as any).downloadUrls)).toEqual(expect.objectContaining({created:expect.any(Array),revoked:expect.any(Array)}));
 await expect.poll(async()=>page.evaluate(()=>{const urls=(window as any).downloadUrls;return urls.created.every((u:string)=>urls.revoked.includes(u));})).toBe(true);
});

test('blocked route exports every selection with diagnostics and empty unattempted residuals',async({page})=>{
 await load(page,[[704,498],[780,500]]);await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Sequence blocked');
 const ply=readPly((await download(page,'Download selected points (PLY)')).bytes.toString());
 const originalCsv=(await download(page,'Download coordinates (CSV)')).bytes;const rows=readCsv(originalCsv.toString());
 expect(rows.map(row=>row[14])).toEqual(['not_visited','pose_unsolved']);expect(rows[1][15]).not.toBe('');
 rows.forEach((row,i)=>{expect(row.slice(4,10)).toEqual(ply.rows[i]);expect(row.slice(16)).toEqual(['','']);});
 await page.mouse.move(500,400);await page.mouse.down();await page.mouse.move(570,430);await page.mouse.up();
 expect((await download(page,'Download coordinates (CSV)')).bytes).toEqual(originalCsv);
 expect((await download(page,'Download coordinates (CSV)')).bytes).toEqual(originalCsv);
});

for(const [path,name,click] of [
 ['tests/fixtures/box-mm.step','my part.STP',[749,723]],
 ['3d files/car-front-door-1/DOOR-of-CAR.step','imported door.step',[704,498]]
] as const)test(`imported ${name} downloads its own exact bytes after a terminal outcome`,async({page})=>{
 test.setTimeout(90000);await load(page,[]);
 const input=await readFile(path);await page.getByLabel('Import STEP').setInputFiles({name,mimeType:'application/octet-stream',buffer:input});
 await expect(page.getByRole('status')).toContainText('Scene ready',{timeout:30000});
 await page.mouse.click(click[0],click[1]);await expect(page.getByRole('row')).toHaveCount(2);
 await page.getByRole('button',{name:'Run',exact:true}).click();
 if(name==='my part.STP')await expect(page.getByRole('status')).toContainText('Sequence blocked');
 else {await expect(page.getByRole('row').nth(1)).toContainText('Moving');await page.getByRole('button',{name:'Stop',exact:true}).click();await expect(page.getByRole('status')).toContainText('Simulation stopped');}
 const file=await download(page,'Download original STEP');expect(file.name).toBe(name);expect(file.bytes).toEqual(input);
 const {createHash}=await import('node:crypto');const hash=createHash('sha256').update(input).digest('hex');
 expect(createHash('sha256').update(file.bytes).digest('hex')).toBe(hash);
 const ply=readPly((await download(page,'Download selected points (PLY)')).bytes.toString());expect(ply.header.join('\n')).toContain(hash);
 const csv=readCsv((await download(page,'Download coordinates (CSV)')).bytes.toString());expect(csv[0].slice(4,10)).toEqual(ply.rows[0]);expect(csv[0].slice(16)).toEqual(['','']);
 await page.getByLabel('Import STEP').setInputFiles('tests/fixtures/box-inch.STP');await expect(page.getByRole('status')).toContainText('Scene ready');
 await expect(page.getByRole('button',{name:'Download original STEP',exact:true})).toHaveCount(0);await expect(page.getByRole('row')).toHaveCount(1);
});

test('preparation Stop captures every point once and late native results cannot change downloads',async({page})=>{
 await page.addInitScript(()=>{
  const NativeWorker=Worker;
  window.Worker=class extends NativeWorker{constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('preflight')){
   const native=this;Object.defineProperty(this,'onmessage',{set(callback){native.addEventListener('message',event=>{(window as any).poseQueued=true;(window as any).releasePose=()=>callback(event);});}});
  }}};
 });
 await load(page,[[704,498],[712,520]]);await page.getByLabel('Stand-off (mm)').fill('500');
 await page.getByRole('button',{name:'Run',exact:true}).click();await page.waitForFunction(()=>(window as any).poseQueued);
 await page.getByRole('button',{name:'Stop',exact:true}).click();await expect(page.getByRole('status')).toContainText('Simulation stopped');
 const before=await download(page,'Download coordinates (CSV)'),rows=readCsv(before.bytes.toString());
 expect(rows.map(row=>row[14])).toEqual(['not_visited','not_visited']);
 rows.forEach(row=>{expect(row.slice(16)).toEqual(['','']);expect(Number(row[10])).toBe(500);for(let i=0;i<3;i++)expect(Math.abs(Number(row[11+i])-Number(row[4+i])-500*Number(row[7+i]))).toBeLessThan(.001);});
 await page.evaluate(()=>(window as any).releasePose());await page.waitForTimeout(1200);
 expect((await download(page,'Download coordinates (CSV)')).bytes).toEqual(before.bytes);
 const ply=readPly((await download(page,'Download selected points (PLY)')).bytes.toString());rows.forEach((row,i)=>expect(row.slice(4,10)).toEqual(ply.rows[i]));
});

for(const outcome of ['dwell-stop','worker-failure','render-failure'] as const)test(`${outcome} retains all download rows and only completed-visit residuals`,async({page})=>{
 test.setTimeout(60000);
 if(outcome==='worker-failure')await page.addInitScript(()=>{
  const NativeWorker=Worker;window.Worker=class extends NativeWorker{constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('preflight'))this.postMessage=()=>setTimeout(()=>this.dispatchEvent(new Event('error')),0) as any;}};
 });
 await load(page,[[704,498],[712,520]]);
 const canvas=page.getByRole('img',{name:'3D robot and door scene'});
 if(outcome==='render-failure')await canvas.evaluate(element=>{
  const dataset=(element as HTMLElement).dataset;Object.defineProperty(element,'dataset',{get:()=>new Proxy(dataset,{set(target,key,value){
   if(key==='jointAngles'&&document.querySelector('[aria-label="Route progress"]')?.textContent?.includes('Current point: 2'))throw new Error('Renderer update failed.');Reflect.set(target,key,value);return true;
  }})});
 });
 if(outcome==='dwell-stop')await canvas.evaluate(element=>{
  let last='',stable=0;new MutationObserver(()=>{
   const q=(element as HTMLElement).dataset.jointAngles??'';stable=q===last?stable+1:0;last=q;
   if(stable>=2&&(element as HTMLElement).dataset.laser==='true'&&document.querySelector('[aria-label="Route progress"]')?.textContent?.includes('Current point: 2'))[...document.querySelectorAll('button')].find(b=>b.textContent==='Stop')?.click();
  }).observe(element,{attributes:true});
 });
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText(outcome==='dwell-stop'?'Simulation stopped':'Simulation failed',{timeout:45000});
 const rows=readCsv((await download(page,'Download coordinates (CSV)')).bytes.toString());
 expect(rows.map(row=>row[14])).toEqual(outcome==='worker-failure'?['not_visited','not_visited']:['visited','stopped']);
 rows.forEach(row=>{if(row[14]==='visited'){expect(row[16]).not.toBe('');expect(row[17]).not.toBe('');}else expect(row.slice(16)).toEqual(['','']);});
 const ply=readPly((await download(page,'Download selected points (PLY)')).bytes.toString());rows.forEach((row,i)=>expect(row.slice(4,10)).toEqual(ply.rows[i]));
 const step=await download(page,'Download original STEP');expect(step.bytes).toEqual(await readFile('3d files/car-front-door-1/DOOR-of-CAR.step'));
});

test('zero selections and a fresh unimported session cannot expose substitute downloads',async({page})=>{
 await load(page,[]);await expect(page.getByRole('button',{name:'Run',exact:true})).toBeDisabled();
 await expect(page.getByRole('button',{name:/Download/})).toHaveCount(0);
 await page.reload();
 await expect(page.getByRole('heading',{name:'Create a scan workspace'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Run',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:/Download/})).toHaveCount(0);
});

test('five actual surface selections complete and all three downloads agree in production',async({page})=>{
 test.setTimeout(180000);
 await load(page,[[681.160927,480.122642],[681.219904,506.444347],[680.244766,523.942241],[761.506759,575.148953],[764.290822,528.705958]]);
 await page.getByRole('button',{name:'Run',exact:true}).click();await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:125000});
 const plyFile=await download(page,'Download selected points (PLY)'),csvFile=await download(page,'Download coordinates (CSV)'),step=await download(page,'Download original STEP');
 const ply=readPly(plyFile.bytes.toString()),rows=readCsv(csvFile.bytes.toString());expect(rows).toHaveLength(5);expect(ply.rows).toHaveLength(5);
 const expected=[[1648.553932,300,550],[1658.438598,300,400],[1658.438587,300,300],[1656.719024,-300,300],[1645.645252,-300,550]];
 rows.forEach((row,i)=>{
  expect(row.slice(0,2)).toEqual([String(i+1),String(i+1)]);expect(row.slice(4,10)).toEqual(ply.rows[i]);expect(row[14]).toBe('visited');
  expect(Math.hypot(...row.slice(4,7).map((v,j)=>Number(v)-expected[i][j]))).toBeLessThan(.15);
  for(let j=0;j<3;j++)expect(Math.abs(Number(row[11+j])-Number(row[4+j])-100*Number(row[7+j]))).toBeLessThan(.001);
  expect(Number(row[16])).toBeLessThanOrEqual(5);expect(Number(row[17])).toBeLessThanOrEqual(5);expect(row[16]).not.toBe('');expect(row[17]).not.toBe('');
 });
 const {createHash}=await import('node:crypto');const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
 expect(hash(step.bytes)).toBe('a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef');
 const mode=process.env.PREVIEW==='1'?'production':'development';
 const {writeFile}=await import('node:fs/promises');
 await writeFile(`docs/verification/issue-09-${mode}.json`,JSON.stringify({mode,count:rows.length,ply:{name:plyFile.name,sha256:hash(plyFile.bytes),header:ply.header},csv:{name:csvFile.name,sha256:hash(csvFile.bytes),rows},step:{name:step.name,bytes:step.bytes.length,sha256:hash(step.bytes)}},null,2)+'\n');
 await writeFile(`docs/verification/issue-09-${mode}.ply`,plyFile.bytes);await writeFile(`docs/verification/issue-09-${mode}.csv`,csvFile.bytes);
 await page.getByRole('region',{name:'Downloads'}).scrollIntoViewIfNeeded().catch(()=>page.getByRole('button',{name:'Download original STEP',exact:true}).scrollIntoViewIfNeeded());
 await page.screenshot({path:`docs/verification/issue-09-${mode}.png`});
});
