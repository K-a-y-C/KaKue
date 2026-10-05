import type {SelectedPoint} from '../scene/surface-selection.ts';
import type {RunPlan} from './preflight.ts';
export function prepareRun(points:readonly SelectedPoint[],standOffMm:number) {
  const worker=new Worker(new URL('./preflight.worker.ts',import.meta.url),{type:'module'});
  let rejectPending:(reason:Error)=>void=()=>{};
  const promise=new Promise<RunPlan>((resolve,reject)=>{rejectPending=reject;worker.onmessage=event=>{worker.terminate();if(event.data.error)reject(new Error(event.data.error));else resolve(event.data.plan);};worker.onerror=()=>{worker.terminate();reject(new Error('Pose worker failed.'));};worker.postMessage({points,standOffMm});});
  return {promise,cancel(){worker.terminate();rejectPending(new Error('Preparation cancelled.'));}};
}
export function preflightInWorker(points:readonly SelectedPoint[],standOffMm:number){return prepareRun(points,standOffMm).promise;}
