import {test} from 'node:test';
import assert from 'node:assert/strict';
import {measuredEmitter} from '../helpers/measured-emitter.ts';
import {preflight} from '../../src/motion/preflight.ts';
import type {SelectedPoint} from '../../src/scene/surface-selection.ts';

function point(id:number,position:number[],normal=[-1,0,0]):SelectedPoint {
 return {id,order:id,basePosition:position,baseNormal:normal,partPosition:position,partNormal:normal,meshIndex:0,triangleIndex:0,status:'selected'};
}

test('public preflight supplies executable planar scan motion that stays within stand-off and optical tolerances',()=>{
 const points=[point(1,[1.55,.3,.4]),point(2,[1.55,-.3,.4])];
 const plan=preflight(points,100);assert.equal(plan.blocked,false);
 const path=plan.points[1].path;assert.ok(path?.length,'preflight must return the intermediate motion, not endpoints alone');
 let previous=plan.points[0].angles!;
 let maxPositionMm=0,maxAxisDeg=0;
 for(const step of path){
  for(let i=0;i<=200;i++){
   const f=i/200,t=f*f*(3-2*f),q=previous.map((v,j)=>v+(step.angles[j]-v)*t),m=measuredEmitter(q);
   maxPositionMm=Math.max(maxPositionMm,1000*Math.abs(m[12]-1.45),1000*Math.abs(m[14]-.4));
   maxAxisDeg=Math.max(maxAxisDeg,Math.acos(Math.max(-1,Math.min(1,m[8])))*180/Math.PI);
  }
  previous=step.angles;
 }
 assert.ok(maxPositionMm<=5,`planar stand-off/path error ${maxPositionMm} mm`);
 assert.ok(maxAxisDeg<=5,`optical axis error ${maxAxisDeg} deg`);
});

test('public execution follows the preflighted surface-facing path instead of an endpoint-only joint chord',async()=>{
 const {visit}=await import('../../src/motion/execution.ts');
 const plan=preflight([point(1,[1.55,.3,.4]),point(2,[1.55,-.3,.4])],100);
 const entry=plan.points[1];let callback:FrameRequestCallback=()=>{},finished=false,maxError=0;
 const original=globalThis.requestAnimationFrame,cancel=globalThis.cancelAnimationFrame;
 globalThis.requestAnimationFrame=fn=>{callback=fn;return 1;};globalThis.cancelAnimationFrame=()=>{};
 try {
  const pending=visit(plan.points[0].angles!,entry.angles!,q=>{const m=measuredEmitter(q);maxError=Math.max(maxError,1000*Math.abs(m[12]-1.45),1000*Math.abs(m[14]-.4));},()=>{},new AbortController().signal,true,entry.path).then(()=>finished=true);
  for(let t=10000;t<200000&&!finished;t+=10){callback(t);await Promise.resolve();}
  await pending;assert.ok(maxError<=5,`executed planar error ${maxError} mm`);
 }finally{globalThis.requestAnimationFrame=original;globalThis.cancelAnimationFrame=cancel;}
});

test('planner accepts inclusive 50–500 mm without silently reducing the requested stand-off',()=>{
 for(const distance of [50,100,500]){
  const plan=preflight([point(1,[1.55,.3,.4])],distance);
  assert.equal(plan.blocked,false);assert.ok(Math.abs(plan.points[0].targetEmitter[12]-(1.55-distance/1000))<1e-12);
 }
 for(const distance of [49,501,NaN,Infinity])assert.throws(()=>preflight([point(1,[1.55,.3,.4])],distance),/50.*500/);
});

test('opposite-side normals block an ambiguous surface-facing transition before any motion',()=>{
 const points=[point(1,[.4,0,1.4]),point(2,[.4,0,1.4],[1,0,0])];
 for(const p of points)assert.equal(preflight([p],100).blocked,false,'both endpoints alone are reachable');
 const plan=preflight(points,100);
 assert.equal(plan.blocked,true);assert.equal(plan.points[1].status,'pose_unsolved');
 assert.match(plan.points[1].reason!,/opposite|antipodal/i);
});

test('supplied five-point route preflights curved intermediate poses, bounded joints and conservative speeds at 100 and 500 mm',async()=>{
 const demo=(await import('../../assets/demo/manifest.json',{with:{type:'json'}})).default;
 const {Matrix4,Quaternion}=await import('three');
 const limits=[[-185,185],[-185,65],[-138,175],[-350,350],[-130,130],[-350,350]];
 const speeds=[20,17.5,19,43,43,63].map(v=>v*Math.PI/180);
 const evidence=[];
 for(const distance of [100,500]){
  const plan=preflight(demo.representativeRoute.map(p=>point(p.id,p.surfacePosition,p.approachNormal)),distance);
  assert.equal(plan.blocked,false,JSON.stringify(plan.points.map(p=>p.reason)));
  let previous=plan.homeAngles,maxPositionMm=0,maxOrientationDeg=0,maxSpeedRatio=0;
  for(const [index,entry] of plan.points.entries())for(const step of entry.path){
   const r0=new Quaternion().setFromRotationMatrix(new Matrix4().fromArray(step.fromEmitter)),r1=new Quaternion().setFromRotationMatrix(new Matrix4().fromArray(step.targetEmitter));
   for(let i=0;i<=100;i++){
    const t=i/100,s=t*t*(3-2*t),q=previous.map((v,j)=>v+(step.angles[j]-v)*s),m=measuredEmitter(q);
    q.forEach((v,j)=>{assert.ok(Number.isFinite(v)&&v*180/Math.PI>=limits[j][0]&&v*180/Math.PI<=limits[j][1]);maxSpeedRatio=Math.max(maxSpeedRatio,1.5*Math.abs(step.angles[j]-previous[j])/step.duration/speeds[j]);});
    if(index===0)continue;
    const orientation=r0.clone().slerp(r1,s),target=new Matrix4().makeRotationFromQuaternion(orientation).elements;
    const d=distance/1000;
    const desired=[0,1,2].map(j=>(step.fromEmitter[12+j]+d*step.fromEmitter[8+j])*(1-s)+(step.targetEmitter[12+j]+d*step.targetEmitter[8+j])*s-d*target[8+j]);
    maxPositionMm=Math.max(maxPositionMm,1000*Math.hypot(...desired.map((v,j)=>v-m[12+j])));
    maxOrientationDeg=Math.max(maxOrientationDeg,orientation.angleTo(new Quaternion().setFromRotationMatrix(new Matrix4().fromArray(m)))*180/Math.PI);
   }
   previous=step.angles;
  }
  assert.ok(maxPositionMm<=5);assert.ok(maxOrientationDeg<=5);assert.ok(maxSpeedRatio<=1+1e-12);
  evidence.push({distance,maxPositionMm,maxOrientationDeg,maxSpeedRatio,plan});
 }
 const {writeFile}=await import('node:fs/promises');await writeFile('docs/verification/issue-21-numerical-route.json',JSON.stringify(evidence,null,2)+'\n');
});

test('run planning retains the actual stand-off and a point snapshot for terminal downloads',()=>{
 const selected=point(1,[1.55,.3,.4]);const plan=preflight([selected],500);
 assert.equal(plan.standOffMm,500);
 (selected.basePosition as number[])[0]=9;
 assert.equal(plan.points[0].point.basePosition[0],1.55);
});
