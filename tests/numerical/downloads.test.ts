import {test} from 'node:test';
import assert from 'node:assert/strict';
import {captureDownloadSnapshot,selectedPointsPly,selectedCoordinatesCsv,originalStep} from '../../src/export/downloads.ts';
import type {PartAsset} from '../../src/import/types.ts';
import type {SelectedPoint} from '../../src/scene/surface-selection.ts';
import type {RunPlan} from '../../src/motion/preflight.ts';
const part:PartAsset={sourceName:'fixture.step',sourceFormat:'STEP',source:new Blob(['exact source\r\n']),sourceHash:'a'.repeat(64),sourceUnits:'millimeter',outputUnits:'meter',meshes:[],partToBase:[]};
const point:SelectedPoint={id:1,order:1,partPosition:[0,0,0],partNormal:[1,0,0],basePosition:[1.25,-.4,.8],baseNormal:[-1,0,0],meshIndex:0,triangleIndex:0,status:'selected'};
test('download capture rejects nonfinite or inconsistent physical values before emitting files',()=>{
 for(const value of [NaN,Infinity,-Infinity,1e24])assert.throws(()=>captureDownloadSnapshot(part,[{...point,basePosition:[value,0,0]}],{1:'Not visited'},null,100,'stopped'),/Invalid export/);
 for(const distance of [NaN,Infinity,49,501])assert.throws(()=>captureDownloadSnapshot(part,[point],{1:'Not visited'},null,distance,'stopped'),/Invalid export/);
 assert.throws(()=>captureDownloadSnapshot(part,[{...point,baseNormal:[0,0,0]}],{1:'Not visited'},null,100,'stopped'),/Invalid export/);
});

test('CSV diagnostics are quoted plain text and source metadata cannot inject executable rows',async()=>{
 const reason='=HYPERLINK("https://example.invalid","bad")\nsecond line, detail';
 const plan:RunPlan={standOffMm:500,blocked:true,homeAngles:[],points:[{point,targetEmitter:[],targetFlange:[],angles:null,duration:0,path:[],status:'pose_unsolved',reason}]};
 const snapshot=captureDownloadSnapshot({...part,sourceName:'../../evil\nend_header.step'},[point],{1:'Pose not solved'},plan,100,'blocked');
 const csv=await selectedCoordinatesCsv(snapshot).blob.text();
 assert.ok(csv.includes('"\'=HYPERLINK(""https://example.invalid"",""bad"")\nsecond line, detail"'));
 const ply=await selectedPointsPly(snapshot).blob.text();assert.equal(ply.split('\n').filter(line=>line==='end_header').length,1);
 assert.match(selectedCoordinatesCsv(snapshot).name,/^[A-Za-z0-9_-]+\.csv$/);
 assert.equal(originalStep(snapshot).name,'evil_end_header.step');
});

test('shared download snapshot owns terminal coordinates, targets and statuses while preserving source bytes',async()=>{
 const mutable=structuredClone(point),statuses={1:'Visited'};
 const plan:RunPlan={standOffMm:500,blocked:false,homeAngles:[],points:[{point:mutable,targetEmitter:[1,0,0,0,0,1,0,0,0,0,1,0,.75,-.4,.8,1],targetFlange:[],angles:[],duration:1,path:[],status:'ready',positionErrorMm:.25,orientationErrorDeg:.5}]};
 const snapshot=captureDownloadSnapshot(part,[mutable],statuses,plan,100,'completed');
 const before=await selectedCoordinatesCsv(snapshot).blob.text();
 (mutable.basePosition as number[])[0]=9;statuses[1]='Stopped';plan.points[0].targetEmitter[12]=20;plan.points[0].positionErrorMm=4;plan.standOffMm=100;
 assert.equal(await selectedCoordinatesCsv(snapshot).blob.text(),before);
 assert.ok(before.includes('1,1,robot-base,mm,1250.000000,-400.000000,800.000000,-1.000000,0.000000,0.000000,500.000000,750.000000,-400.000000,800.000000,visited,,0.250000,0.500000'));
 assert.ok((await selectedPointsPly(snapshot).blob.text()).endsWith('1250.000000 -400.000000 800.000000 -1.000000 0.000000 0.000000\n'));
 assert.equal(await originalStep(snapshot).blob.text(),'exact source\r\n');assert.ok(Object.isFrozen(snapshot.points[0].surface));assert.ok(Object.isFrozen(snapshot.points[0]));
});
