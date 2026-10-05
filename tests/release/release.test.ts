import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

test('public release command verifies the actual static build and emits a deterministic file inventory',async()=>{
 const result=spawnSync('npm',['run','verify:release'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stdout+result.stderr);
 const bytes=await readFile('dist/release-manifest.json'),report=JSON.parse(bytes.toString());
 assert.equal(report.sourceDoorSha256,'a2662bda82f6bb30ffd70266ad4fc6398871c36c5d2803f138ef9abd57ef53ef');
 assert.ok(report.files.some((file:{path:string})=>file.path.endsWith('.wasm')));
 assert.ok(report.files.some((file:{path:string})=>file.path.includes('preflight.worker-')));
 assert.ok(report.files.some((file:{path:string})=>file.path.includes('step.worker-')));
 for(const file of report.files){const actual=await readFile('dist/'+file.path);assert.equal(actual.length,file.bytes);assert.equal(createHash('sha256').update(actual).digest('hex'),file.sha256);}
 assert.equal(spawnSync('npm',['run','verify:release'],{encoding:'utf8'}).status,0);
 assert.deepEqual(await readFile('dist/release-manifest.json'),bytes);
});

test('a changed release fails verification and cannot retain a stale success inventory',async()=>{
 const {mkdtemp,cp,writeFile,access,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const directory=await mkdtemp(join(tmpdir(),'kakue-release-'));
 try{
  await cp('dist',directory,{recursive:true});await writeFile(join(directory,'demo-v1/door/DOOR-of-CAR.step'),'substitute');
  const result=spawnSync('npm',['run','verify:release','--','--directory',directory],{encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/Release identity mismatch/);
  await assert.rejects(access(join(directory,'release-manifest.json')));
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('missing workers, WASM or notices reject an otherwise genuine release',async()=>{
 const {mkdtemp,cp,rm,writeFile,readdir}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const directory=await mkdtemp(join(tmpdir(),'kakue-release-missing-'));
 try{
  await cp('dist',directory,{recursive:true});
  const worker=(await readdir(join(directory,'assets'))).find(name=>name.startsWith('preflight.worker-'))!;
  for(const path of ['parser/occt-import-js/0.0.23/occt-import-js.wasm','demo-v1/notices/three-LICENSE','assets/'+worker]){
   const original=await readFile(join(directory,path));await rm(join(directory,path));
   const result=spawnSync('npm',['run','verify:release','--','--directory',directory],{encoding:'utf8'});
   assert.notEqual(result.status,0);assert.match(result.stdout+result.stderr,/Missing required release file|Missing or ambiguous compiled worker/);
   await writeFile(join(directory,path),original);
  }
 }finally{await rm(directory,{recursive:true,force:true});}
});


test('entry URLs must resolve to real files under the declared deployment base',async()=>{
 const {mkdtemp,cp,rm,writeFile}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const directory=await mkdtemp(join(tmpdir(),'kakue-release-entry-'));
 try{
  await cp('dist',directory,{recursive:true});const index=await readFile(join(directory,'index.html'),'utf8');
  for(const entry of ['/missing.js','/incorrect/assets/missing.js']){
   await writeFile(join(directory,'index.html'),index.replace(/src="[^"]+\.js"/,`src="${entry}"`));
   const result=spawnSync('npm',['run','verify:release','--','--directory',directory],{encoding:'utf8'});
   assert.notEqual(result.status,0,'A nonexistent application URL must fail release verification.');
  }
  const nested=index.replaceAll('"/assets/','"/demo/assets/');await writeFile(join(directory,'index.html'),nested);
  assert.equal(spawnSync('npm',['run','verify:release','--','--directory',directory],{encoding:'utf8',env:{...process.env,BASE_PATH:'/demo/'}}).status,0);
  assert.notEqual(spawnSync('npm',['run','verify:release','--','--directory',directory],{encoding:'utf8',env:{...process.env,BASE_PATH:'/different/'}}).status,0);
 }finally{await rm(directory,{recursive:true,force:true});}
});
