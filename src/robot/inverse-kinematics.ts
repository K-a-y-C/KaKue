import demo from '../../assets/demo/manifest.json' with {type:'json'};
import { robotDefinition } from './definition.ts';
import { forwardKinematics, multiply, jointTransform, type RigidMatrix } from './forward-kinematics.ts';

const cross=(a:ArrayLike<number>,b:ArrayLike<number>)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export function inverseRigid(m:ArrayLike<number>):RigidMatrix {
  const r=new Float64Array([m[0],m[4],m[8],0,m[1],m[5],m[9],0,m[2],m[6],m[10],0,0,0,0,1]);
  for(let i=0;i<3;i++) r[12+i]=-(r[i]*m[12]+r[4+i]*m[13]+r[8+i]*m[14]);
  return r;
}
/** World-frame logarithm of target rotation times current rotation transpose. */
function rotationError(target:ArrayLike<number>,current:ArrayLike<number>):number[] {
  const r=multiply(target,inverseRigid(current));
  const angle=Math.acos(clamp((r[0]+r[5]+r[10]-1)/2,-1,1));
  const skew=[r[6]-r[9],r[8]-r[2],r[1]-r[4]];
  if(angle<1e-7) return skew.map(v=>v/2);
  if(Math.PI-angle<1e-5) {
    const axis=[Math.sqrt(Math.max(0,(r[0]+1)/2)),Math.sqrt(Math.max(0,(r[5]+1)/2)),Math.sqrt(Math.max(0,(r[10]+1)/2))];
    const pivot=axis.indexOf(Math.max(...axis));
    if(pivot===0) {axis[1]=Math.sign(r[4]+r[1]||1)*axis[1];axis[2]=Math.sign(r[8]+r[2]||1)*axis[2];}
    else if(pivot===1) {axis[0]=Math.sign(r[4]+r[1]||1)*axis[0];axis[2]=Math.sign(r[9]+r[6]||1)*axis[2];}
    else {axis[0]=Math.sign(r[8]+r[2]||1)*axis[0];axis[1]=Math.sign(r[9]+r[6]||1)*axis[1];}
    return axis.map(v=>v*angle);
  }
  return skew.map(v=>v*angle/(2*Math.sin(angle)));
}
export function poseResidual(target:ArrayLike<number>,actual:ArrayLike<number>) {
  return {positionErrorMm:1000*Math.hypot(target[12]-actual[12],target[13]-actual[13],target[14]-actual[14]),orientationErrorDeg:Math.hypot(...rotationError(target,actual))*180/Math.PI,axisErrorDeg:Math.acos(clamp(target[8]*actual[8]+target[9]*actual[9]+target[10]*actual[10],-1,1))*180/Math.PI};
}
/** Analytic world-frame geometric flange Jacobian, column-major 6 by 6. */
export function geometricJacobian(angles:readonly number[]):Float64Array {
  const pose=forwardKinematics(robotDefinition,angles), end=pose.flange.slice(12,15), out=new Float64Array(36);
  robotDefinition.joints.forEach((joint,c)=>{
    const origin=multiply(pose.linkMatrices[joint.parent],jointTransform(joint.origin,joint.axis,0));
    const axis=joint.axis.map((_,r)=>origin[r]*joint.axis[0]+origin[4+r]*joint.axis[1]+origin[8+r]*joint.axis[2]);
    const linear=cross(axis,end.map((v,r)=>v-origin[12+r]));
    for(let r=0;r<3;r++) {out[c*6+r]=linear[r];out[c*6+r+3]=axis[r];}
  });
  return out;
}
function linearSolve(a:Float64Array,b:Float64Array):Float64Array|null {
  const n=6;
  for(let i=0;i<n;i++) {
    let pivot=i;for(let r=i+1;r<n;r++) if(Math.abs(a[r*n+i])>Math.abs(a[pivot*n+i]))pivot=r;
    if(Math.abs(a[pivot*n+i])<1e-14)return null;
    for(let c=i;c<n;c++)[a[i*n+c],a[pivot*n+c]]=[a[pivot*n+c],a[i*n+c]];
    [b[i],b[pivot]]=[b[pivot],b[i]];
    const d=a[i*n+i];for(let c=i;c<n;c++)a[i*n+c]/=d;b[i]/=d;
    for(let r=0;r<n;r++)if(r!==i){const f=a[r*n+i];for(let c=i;c<n;c++)a[r*n+c]-=f*a[i*n+c];b[r]-=f*b[i];}
  }
  return b;
}
export interface PoseSolution { angles:number[]|null; status:'ready'|'outside_reach'|'pose_unsolved'; reason?:string }
export function solveFlangePose(target:ArrayLike<number>,previous:readonly number[]):PoseSolution {
  if(target.length!==16 || Array.from(target).some(v=>!Number.isFinite(v)))return {angles:null,status:'pose_unsolved',reason:'Target pose is non-finite.'};
  let rigid=true;
  for(let a=0;a<3;a++)for(let b=0;b<3;b++) {
    let dot=0;for(let r=0;r<3;r++)dot+=target[a*4+r]*target[b*4+r];
    if(Math.abs(dot-(a===b?1:0))>1e-8)rigid=false;
  }
  const determinant=target[0]*(target[5]*target[10]-target[9]*target[6])-target[4]*(target[1]*target[10]-target[9]*target[2])+target[8]*(target[1]*target[6]-target[5]*target[2]);
  if(!rigid||Math.abs(determinant-1)>1e-8||[target[3],target[7],target[11],target[15]-1].some(v=>Math.abs(v)>1e-8))return {angles:null,status:'pose_unsolved',reason:'Target is not a rigid right-handed pose.'};
  // Triangle inequality from the base origin gives a conservative envelope only.
  const radius=robotDefinition.joints.reduce((sum,j)=>sum+Math.hypot(...j.origin),Math.hypot(...robotDefinition.linkToFlange.slice(12,15)));
  if(Math.hypot(target[12],target[13],target[14])>radius+1e-9)return {angles:null,status:'outside_reach',reason:'Target flange is outside the conservative robot reach envelope.'};
  const seeds=[Array.from(previous),Array.from(demo.homeAngles),[0,-.5,1.3,0,-1,-Math.PI/2],[0,-.5,1.3,-1.7,-.2,0],[0,-.5,1.3,1.7,-.2,-Math.PI],[0,-1,1.7,0,1,Math.PI/2],[Math.PI,-2,1.5,0,1,0],[-Math.PI,-2,1.5,0,-1,0]];
  const candidates:number[][]=[];
  for(const seed of seeds) {
    let q=seed.map((v,i)=>clamp(v,robotDefinition.joints[i].lower,robotDefinition.joints[i].upper));
    for(let iteration=0;iteration<200;iteration++) {
      const actual=forwardKinematics(robotDefinition,q).flange, residual=poseResidual(target,actual);
      if(residual.positionErrorMm<=.1 && residual.orientationErrorDeg<=.1)break;
      const rot=rotationError(target,actual), e=new Float64Array([target[12]-actual[12],target[13]-actual[13],target[14]-actual[14],...rot.map(v=>.25*v)]), j=geometricJacobian(q);
      for(let c=0;c<6;c++)for(let r=3;r<6;r++)j[c*6+r]*=.25;
      const a=new Float64Array(36),b=new Float64Array(6);
      for(let r=0;r<6;r++){for(let c=0;c<6;c++){for(let k=0;k<6;k++)a[r*6+c]+=j[r*6+k]*j[c*6+k];}a[r*6+r]+=.0004;for(let k=0;k<6;k++)b[r]+=j[r*6+k]*e[k];}
      const step=linearSolve(a,b);if(!step)break;
      const max=Math.max(.2,...Array.from(step,Math.abs));
      q=q.map((v,i)=>clamp(v+step[i]*.2/max,robotDefinition.joints[i].lower,robotDefinition.joints[i].upper));
    }
    const residual=poseResidual(target,forwardKinematics(robotDefinition,q).flange);
    if([residual.positionErrorMm,residual.orientationErrorDeg,residual.axisErrorDeg].every(Number.isFinite)&&residual.positionErrorMm<=5 && residual.orientationErrorDeg<=5 && residual.axisErrorDeg<=5)candidates.push(q);
  }
  candidates.sort((a,b)=>a.reduce((sum,v,i)=>sum+(v-previous[i])**2,0)-b.reduce((sum,v,i)=>sum+(v-previous[i])**2,0));
  if(candidates.length)return {angles:candidates[0],status:'ready'};
  return {angles:null,status:'pose_unsolved',reason:'Bounded pose solver exhausted eight seeds of 200 iterations.'};
}
