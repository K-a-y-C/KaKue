import type {PartAsset} from '../import/types';
import type {SelectedPoint} from '../scene/surface-selection';
import type {RunPlan} from '../motion/preflight';

export type TerminalOutcome='completed'|'blocked'|'stopped'|'failed';
export interface DownloadPoint {
  readonly id:number;readonly order:number;
  readonly surface:readonly number[];readonly normal:readonly number[];
  readonly target:readonly number[];readonly status:string;readonly reason:string;
  readonly positionErrorMm?:number;readonly orientationErrorDeg?:number;
}
export interface DownloadSnapshot {
  readonly sourceName:string;readonly sourceHash:string;readonly source:Blob;
  readonly outcome:TerminalOutcome;readonly standOffMm:number;
  readonly points:readonly DownloadPoint[];
}
const statusCodes:Record<string,string>={Visited:'visited','Not visited':'not_visited',Stopped:'stopped','Outside reach':'outside_reach','Pose not solved':'pose_unsolved'};
/** Own terminal data once; immutable Blob retains exact source bytes after worker transfers. */
export function captureDownloadSnapshot(part:PartAsset,points:readonly SelectedPoint[],statuses:Readonly<Record<number,string>>,plan:RunPlan|null,standOffMm:number,outcome:TerminalOutcome):DownloadSnapshot {
  const distance=plan?.standOffMm??standOffMm;
  if(!Number.isFinite(distance)||distance<50||distance>500||part.outputUnits!=='meter'||!/^([a-f0-9]{64})$/i.test(part.sourceHash))throw new Error('Invalid export units, stand-off or source identity.');
  const entries=points.map(point=>{
    const planned=plan?.points.find(entry=>entry.point.id===point.id);
    const status=statusCodes[statuses[point.id]]??'not_visited';
    const surface=Object.freeze(point.basePosition.map(v=>v*1000)),normal=Object.freeze([...point.baseNormal]);
    if(surface.length!==3||normal.length!==3||[...surface,...normal].some(v=>!Number.isFinite(v)||Math.abs(v)>=1e21)||Math.abs(Math.hypot(...normal)-1)>1e-6)throw new Error('Invalid export surface coordinates or approach-side normal.');
    const target=Object.freeze(planned?.targetEmitter.length===16?planned.targetEmitter.slice(12,15).map(v=>v*1000):surface.map((v,i)=>v+distance*normal[i]));
    if(target.some(v=>!Number.isFinite(v)||Math.abs(v)>=1e21)||!Number.isSafeInteger(point.id)||point.id<1||!Number.isSafeInteger(point.order)||point.order<1)throw new Error('Invalid export target or point identity.');
    if(status==='visited'&&[planned?.positionErrorMm,planned?.orientationErrorDeg].some(v=>v===undefined||!Number.isFinite(v)||v<0||v>5))throw new Error('Invalid export visited-pose residuals.');
    return Object.freeze({id:point.id,order:point.order,surface,normal,target,status,reason:planned?.reason??(status==='stopped'?'Visit interrupted.':status==='not_visited'?'Visit not attempted.':''),positionErrorMm:status==='visited'?planned?.positionErrorMm:undefined,orientationErrorDeg:status==='visited'?planned?.orientationErrorDeg:undefined});
  });
  return Object.freeze({sourceName:part.sourceName,sourceHash:part.sourceHash,source:part.source,outcome,standOffMm:distance,points:Object.freeze(entries)});
}
const decimal=(value:number)=>value.toFixed(6);
const basename=(name:string)=>name.split(/[\\/]/).at(-1)!.replace(/\.(step|stp)$/i,'').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'model';
export function selectedPointsPly(snapshot:DownloadSnapshot) {
  return {name:`${basename(snapshot.sourceName)}-selected-points.ply`,blob:new Blob([[
    'ply','format ascii 1.0','comment frame robot-base','comment units mm',
    'comment normals unitless mesh-derived approach-side',
    'comment simulated selected CAD points, not acquired measurements',
    `comment source_name ${snapshot.sourceName.split(/[\\/]/).at(-1)!.replace(/[^\x20-\x7e]/g,'_')}`, 'comment source_format STEP', `comment outcome ${snapshot.outcome}`,`comment source_sha256 ${snapshot.sourceHash}`,
    `element vertex ${snapshot.points.length}`,...['x','y','z','nx','ny','nz'].map(name=>`property double ${name}`),
    'end_header',...snapshot.points.map(point=>[...point.surface,...point.normal].map(decimal).join(' ')),''
  ].join('\n')],{type:'application/octet-stream'})};
}
const csvCell=(value:string)=>/[",\r\n]/.test(value)?`"${value.replace(/"/g,'""')}"`:value;
export function selectedCoordinatesCsv(snapshot:DownloadSnapshot) {
  const header='point_id,order,frame,units,x,y,z,normal_x,normal_y,normal_z,stand_off_mm,target_x,target_y,target_z,status,reason,position_error_mm,orientation_error_deg';
  const rows=snapshot.points.map(point=>[
    String(point.id),String(point.order),'robot-base','mm',...point.surface.map(decimal),...point.normal.map(decimal),
    decimal(snapshot.standOffMm),...point.target.map(decimal),point.status,/^\s*[=+@-]/.test(point.reason)?`'${point.reason}`:point.reason,
    point.positionErrorMm===undefined?'':decimal(point.positionErrorMm),point.orientationErrorDeg===undefined?'':decimal(point.orientationErrorDeg)
  ].map(csvCell).join(','));
  return {name:`${basename(snapshot.sourceName)}-selected-coordinates.csv`,blob:new Blob([[header,...rows,''].join('\r\n')],{type:'text/csv;charset=utf-8'})};
}
/** Source Blob is returned unchanged, never serialized from the rendered geometry. */
export function originalStep(snapshot:Pick<DownloadSnapshot,'sourceName'|'source'>) {
  const name=snapshot.sourceName.split(/[\\/]/).at(-1)!.replace(/[<>:"|?*\x00-\x1f\x7f]/g,'_');
  return {name:/\.(step|stp)$/i.test(name)?name:'model.step',blob:snapshot.source};
}
