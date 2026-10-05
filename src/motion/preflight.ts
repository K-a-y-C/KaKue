import {scanPath,type ScanStep} from './scan-path.ts';
import demo from '../../assets/demo/manifest.json' with {type:'json'};
import type {SelectedPoint} from '../scene/surface-selection.ts';
import {robotDefinition} from '../robot/definition.ts';
import {forwardKinematics,multiply} from '../robot/forward-kinematics.ts';
import {inverseRigid,poseResidual,solveFlangePose} from '../robot/inverse-kinematics.ts';
export interface PlannedPoint {point:SelectedPoint;targetEmitter:number[];targetFlange:number[];angles:number[]|null;duration:number;path:ScanStep[];positionErrorMm?:number;orientationErrorDeg?:number;axisErrorDeg?:number;reason?:string;status:'ready'|'outside_reach'|'pose_unsolved'}
export interface RunPlan {points:PlannedPoint[];blocked:boolean;homeAngles:readonly number[];standOffMm:number}
export function preflight(points:readonly SelectedPoint[],standOffMm:number):RunPlan {
  if(!Number.isFinite(standOffMm)||standOffMm<50||standOffMm>500)throw new Error('Stand-off must be between 50 and 500 mm.');
  if(points.length===0)throw new Error('Select at least one surface point.');
  let previous=Array.from(demo.homeAngles);
  let previousEmitter:number[]|undefined;
  const planned=structuredClone(points).map(point=>{
    const n=point.baseNormal,length=Math.hypot(...n);
    if(!Number.isFinite(length)||length<1e-12||point.basePosition.some(v=>!Number.isFinite(v)))return {point,targetEmitter:[],targetFlange:[],angles:null,duration:0,path:[],status:'pose_unsolved' as const,reason:'Surface point or normal is invalid.'};
    const z=n.map(v=>-v/length),up=Math.abs(z[2])>.99?[0,1,0]:[0,0,1];
    const dot=up.reduce((sum,v,i)=>sum+v*z[i],0), y=up.map((v,i)=>v-dot*z[i]), yn=Math.hypot(...y);for(let i=0;i<3;i++)y[i]/=yn;
    const x=[y[1]*z[2]-y[2]*z[1],y[2]*z[0]-y[0]*z[2],y[0]*z[1]-y[1]*z[0]];
    const targetEmitter=[...x,0,...y,0,...z,0,...point.basePosition.map((v,i)=>v+standOffMm/1000*n[i]/length),1];
    const targetFlange=Array.from(multiply(targetEmitter,inverseRigid(robotDefinition.flangeToEmitter))),solution=solveFlangePose(targetFlange,previous);
    const result:PlannedPoint={point,targetEmitter,targetFlange,...solution,duration:0,path:[]};
    if(solution.angles) {
      Object.assign(result,poseResidual(targetEmitter,forwardKinematics(robotDefinition,solution.angles).emitter));
      if(![result.positionErrorMm,result.orientationErrorDeg,result.axisErrorDeg].every(v=>Number.isFinite(v))||result.positionErrorMm!>5||result.orientationErrorDeg!>5||result.axisErrorDeg!>5||solution.angles.some((v,i)=>!Number.isFinite(v)||v<robotDefinition.joints[i].lower||v>robotDefinition.joints[i].upper)){result.angles=null;result.status='pose_unsolved';result.reason='Independent emitter residual or hard interval acceptance failed.';}
      else {
        try {
          if(previousEmitter)result.path=scanPath(previousEmitter,targetEmitter,previous,standOffMm/1000);
          else result.path=[{angles:solution.angles,duration:Math.max(1,...solution.angles.map((v,i)=>1.5*Math.abs(v-previous[i])/robotDefinition.joints[i].demoSpeed)),fromEmitter:Array.from(forwardKinematics(robotDefinition,previous).emitter),targetEmitter,maxPositionErrorMm:result.positionErrorMm!,maxOrientationErrorDeg:result.orientationErrorDeg!}];
          result.angles=result.path.at(-1)!.angles;
          Object.assign(result,poseResidual(targetEmitter,forwardKinematics(robotDefinition,result.angles).emitter));
          result.duration=result.path.reduce((sum,s)=>sum+s.duration,0);previous=result.angles;previousEmitter=targetEmitter;
        } catch(error) {result.angles=null;result.status='pose_unsolved';result.reason=error instanceof Error?error.message:String(error);result.path=[];}
      }
    }
    return result;
  });
  return {points:planned,blocked:planned.some(p=>p.status!=='ready'),homeAngles:Array.from(demo.homeAngles),standOffMm};
}
