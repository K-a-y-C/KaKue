import {test,expect} from './fixtures';
import {execFileSync} from 'node:child_process';

// Python's independent ZIP reader validates central directory, contents and CRCs.
function readArchive(path:string):Record<string,string> {
 return JSON.parse(execFileSync('python3',['-c','import zipfile,json,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print(json.dumps({n:z.read(n).decode("utf-8") for n in z.namelist()}))',path],{encoding:'utf8'}));
}
test('successful scan exposes one Export containing point cloud and matching coordinates',async({page})=>{
 test.setTimeout(90000);
 await page.addInitScript(()=>{
  const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
  (window as any).exportUrls={created:[],revoked:[]};
  URL.createObjectURL=blob=>{const url=create(blob);(window as any).exportUrls.created.push(url);return url;};
  URL.revokeObjectURL=url=>{(window as any).exportUrls.revoked.push(url);revoke(url);};
 });
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await expect(page.getByRole('button',{name:'Export',exact:true})).toHaveCount(0);
 await page.mouse.click(704,498);
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:60000});
 await expect(page.getByText(/original|Downloads/)).toHaveCount(0);
 const result=page.getByRole('region',{name:'Scan export'});
 await expect(result).toContainText('Point cloud (PLY)');await expect(result).toContainText('Coordinates (CSV)');
 let count=0;page.on('download',()=>count++);
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();
 const download=await pending;expect(await download.failure()).toBeNull();
 expect(download.suggestedFilename()).toBe('DOOR-of-CAR-scan-results.zip');
 const files=readArchive((await download.path())!);
 expect(Object.keys(files)).toEqual(['DOOR-of-CAR-selected-points.ply','DOOR-of-CAR-selected-coordinates.csv']);
 const ply=files[Object.keys(files)[0]].split('\n'),csv=files[Object.keys(files)[1]].trim().split('\r\n');
 expect(ply).toContain('element vertex 1');expect(ply).toContain('comment units mm');
 const values=ply[ply.indexOf('end_header')+1].split(' '),row=csv[1].split(',');
 expect(row.slice(4,10)).toEqual(values);expect(row[14]).toBe('visited');expect(row.slice(2,4)).toEqual(['robot-base','mm']);
 await expect.poll(()=>page.evaluate(()=>{const urls=(window as any).exportUrls;return urls.created.length===1&&urls.created.every((url:string)=>urls.revoked.includes(url));})).toBe(true);
 expect(count).toBe(1);
 await result.scrollIntoViewIfNeeded();await page.screenshot({path:'docs/verification/scan-export-home-platform.png'});
});

for(const outcome of ['blocked','preparation-stop','approach-stop','worker-failure'] as const)test(`${outcome} retains coordinates without a successful-scan export`,async({page})=>{
 if(outcome==='preparation-stop')await page.addInitScript(()=>{
  const NativeWorker=Worker;window.Worker=class extends NativeWorker{constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('preflight'))Object.defineProperty(this,'onmessage',{set(){}});}};
 });
 if(outcome==='worker-failure')await page.addInitScript(()=>{
  const NativeWorker=Worker;window.Worker=class extends NativeWorker{constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('preflight'))this.postMessage=()=>setTimeout(()=>this.dispatchEvent(new Event('error')),0) as any;}};
 });
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 await page.mouse.click(704,498);await page.mouse.click(outcome==='blocked'?780:712,outcome==='blocked'?500:520);
 await page.getByRole('button',{name:'Run',exact:true}).click();
 if(outcome.includes('stop')){
  await expect(page.getByRole('status')).toContainText(outcome==='preparation-stop'?'Preparing':'Simulation running');
  await page.getByRole('button',{name:'Stop',exact:true}).click();
 }
 await expect(page.getByRole('status')).toContainText(outcome==='blocked'?'Sequence blocked':outcome==='worker-failure'?'Simulation failed':'Simulation stopped');
 await expect(page.getByRole('row')).toHaveCount(3);
 await expect(page.getByRole('button',{name:'Export',exact:true})).toHaveCount(0);
 await expect(page.getByText(/original|Downloads/)).toHaveCount(0);
});

test('five actual surface points export one consistent archive after returning home',async({page})=>{
 test.setTimeout(180000);
 await page.goto('./');await expect(page.getByRole('status')).toContainText('Scene ready');
 const canvas=page.getByRole('img',{name:'3D robot and door scene'}),home=await canvas.getAttribute('data-joint-angles');
 const clicks=[[681.160927,480.122642],[681.219904,506.444347],[680.244766,523.942241],[761.506759,575.148953],[764.290822,528.705958]];
 for(const [x,y] of clicks)await page.mouse.click(x,y);
 await expect(page.getByRole('row')).toHaveCount(6);
 await page.getByRole('button',{name:'Run',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Returning home',{timeout:125000});
 await expect(canvas).toHaveAttribute('data-laser','false');
 await expect(page.getByRole('button',{name:'Export',exact:true})).toHaveCount(0);
 await expect(page.getByRole('status')).toContainText('Simulation complete',{timeout:60000});
 await expect(canvas).toHaveAttribute('data-joint-angles',home!);
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export',exact:true}).click();
 const file=await pending,files=readArchive((await file.path())!);
 const ply=files[Object.keys(files)[0]].split('\n'),csv=files[Object.keys(files)[1]].trim().split('\r\n');
 const vertices=ply.slice(ply.indexOf('end_header')+1).filter(Boolean).map(line=>line.split(' '));
 expect(vertices).toHaveLength(5);expect(csv).toHaveLength(6);
 const expected=[[1648.553932,300,550],[1658.438598,300,400],[1658.438587,300,300],[1656.719024,-300,300],[1645.645252,-300,550]];
 csv.slice(1).forEach((line,i)=>{
  const row=line.split(',');expect(row).toHaveLength(18);expect(row.slice(0,2)).toEqual([String(i+1),String(i+1)]);
  expect(row.slice(4,10)).toEqual(vertices[i]);expect(row[14]).toBe('visited');
  expect(Math.hypot(...row.slice(4,7).map((v,j)=>Number(v)-expected[i][j]))).toBeLessThan(.15);
  for(let j=0;j<3;j++)expect(Math.abs(Number(row[11+j])-Number(row[4+j])-100*Number(row[7+j]))).toBeLessThan(.001);
  expect(row[16]).not.toBe('');expect(Number(row[16])).toBeLessThanOrEqual(5);expect(row[17]).not.toBe('');expect(Number(row[17])).toBeLessThanOrEqual(5);
 });
 const {readFile,writeFile}=await import('node:fs/promises');
 const {createHash}=await import('node:crypto');
 const bytes=await readFile((await file.path())!),mode=process.env.PREVIEW==='1'?'production':'development';
 await writeFile(`docs/verification/scan-results-${mode}.zip`,bytes);
 await writeFile(`docs/verification/scan-results-${mode}.json`,JSON.stringify({mode,archive:file.suggestedFilename(),sha256:createHash('sha256').update(bytes).digest('hex'),files:Object.keys(files),vertexCount:vertices.length,csvRows:csv.length-1,home,laser:await canvas.getAttribute('data-laser'),rows:csv.slice(1).map(line=>line.split(','))},null,2)+'\n');

});
