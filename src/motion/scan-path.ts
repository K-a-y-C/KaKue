import {Matrix4,Quaternion} from 'three';
import {robotDefinition} from '../robot/definition.ts';
import {forwardKinematics,multiply} from '../robot/forward-kinematics.ts';
import {inverseRigid,poseResidual,solveFlangePose} from '../robot/inverse-kinematics.ts';
export interface ScanStep {angles:number[];duration:number;fromEmitter:number[];targetEmitter:number[];maxPositionErrorMm:number;maxOrientationErrorDeg:number}
const reach=robotDefinition.joints.reduce((sum,j)=>sum+Math.hypot(...j.origin),Math.hypot(...robotDefinition.flangeToEmitter.slice(12,15)));
const rotation=(pose:readonly number[])=>new Quaternion().setFromRotationMatrix(new Matrix4().fromArray(pose));
/** Shortest-arc full-orientation interpolation; surface polyline plus its interpolated normal offset. */
export function scanTarget(from:readonly number[],to:readonly number[],fraction:number,distance:number):number[] {
 const q=rotation(from).slerp(rotation(to),fraction),m=new Matrix4().makeRotationFromQuaternion(q).elements;
 for(let i=0;i<3;i++)m[12+i]=(from[12+i]+distance*from[8+i])*(1-fraction)+(to[12+i]+distance*to[8+i])*fraction-distance*m[8+i];
 return m;
}
/** Preflight the exact smoothstep joint interpolants executed by the scene, including a between-samples error bound. */
export function scanPath(from:readonly number[],to:readonly number[],start:readonly number[],distance:number):ScanStep[] {
 if(from[8]*to[8]+from[9]*to[9]+from[10]*to[10]<-1+1e-6)throw new Error('Scan transition has opposite (antipodal) approach-side normals; select a route on one surface side.');
 const result:ScanStep[]=[];
 function segment(a:number,b:number,q0:readonly number[],depth:number):number[] {
  if(result.length>=1024||depth>12)throw new Error('Scan transition cannot be verified within the bounded subdivision budget.');
  const p0=scanTarget(from,to,a,distance),p1=scanTarget(from,to,b,distance);
  const solution=solveFlangePose(multiply(p1,inverseRigid(robotDefinition.flangeToEmitter)),q0);
  if(!solution.angles)throw new Error(`Scan transition at ${(b*100).toFixed(1)}%: ${solution.reason}`);
  const q1=solution.angles;
  const travel=q1.reduce((sum,v,i)=>sum+Math.abs(v-q0[i]),0);
  const angle=rotation(p0).angleTo(rotation(p1));
  const surfaceDistance=Math.hypot(...[0,1,2].map(i=>p1[12+i]+distance*p1[8+i]-p0[12+i]-distance*p0[8+i]));
  // Nearest sample is at most 1/32 of a smoothstep interval away; derivative <=1.5.
  // Triangle inequality bounds any unsampled FK translation by chain reach * total joint travel.
  const positionBound=1000*1.5*(reach*travel+surfaceDistance+distance*angle)/32;
  const orientationBound=1.5*(travel+angle)*180/Math.PI/32;
  let position=0,orientation=0;
  for(let i=0;i<=16;i++){
   const t=i/16,s=t*t*(3-2*t),q=q0.map((v,j)=>v+(q1[j]-v)*s);
   const residual=poseResidual(scanTarget(from,to,a+(b-a)*s,distance),forwardKinematics(robotDefinition,q).emitter);
   position=Math.max(position,residual.positionErrorMm);orientation=Math.max(orientation,residual.orientationErrorDeg,residual.axisErrorDeg);
  }
  if(position+positionBound>5||orientation+orientationBound>5){
   const mid=(a+b)/2,qmid=segment(a,mid,q0,depth+1);
   return segment(mid,b,qmid,depth+1);
  }
  const duration=Math.max(.01,...q1.map((v,i)=>1.5*Math.abs(v-q0[i])/robotDefinition.joints[i].demoSpeed));
  result.push({angles:q1,duration,fromEmitter:p0,targetEmitter:p1,maxPositionErrorMm:position+positionBound,maxOrientationErrorDeg:orientation+orientationBound});
  return q1;
 }
 segment(0,1,start,0);return result;
}
