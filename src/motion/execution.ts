import type {ScanStep} from './scan-path.ts';
import { robotDefinition } from '../robot/definition.ts';
/** Bounded interval interpolation: no periodic angle wrapping. */
export function interpolateJoints(from: readonly number[], to: readonly number[], fraction: number): number[] {
  const t=Math.max(0,Math.min(1,fraction)), smooth=t*t*(3-2*t);
  return from.map((angle,i)=>angle+(to[i]-angle)*smooth);
}
export function transitionDuration(from: readonly number[], to: readonly number[]): number {
  return Math.max(1,...from.map((angle,i)=>1.5*Math.abs(to[i]-angle)/robotDefinition.joints[i].demoSpeed));
}
/** Scene updates run outside React. Resolves only after an endpoint's one-second dwell. */
export function visit(from: readonly number[], to: readonly number[], apply: (angles: number[])=>void, laser:(on:boolean)=>void, signal: AbortSignal, keepLaser=false, path?:readonly ScanStep[]): Promise<void> {
  const steps=path??[{angles:Array.from(to),duration:transitionDuration(from,to)}];
  const duration=steps.reduce((sum,step)=>sum+step.duration*1000,0);
  return new Promise((resolve,reject)=> {
    let settled=false;
    let frame=0, start: number|undefined, dwellStart: number|undefined;
    const cancelled=()=> { if(settled)return; settled=true; signal.removeEventListener('abort',cancelled); cancelAnimationFrame(frame); try { laser(false); } catch { /* Cancellation still settles if renderer cleanup fails. */ } reject(new DOMException('Sequence cancelled','AbortError')); };
    signal.addEventListener('abort',cancelled,{once:true});
    const tick=(now:number)=> {
      if (settled) return;
      if (signal.aborted) return cancelled();
      try {
      start ??=now;
      if(keepLaser)laser(true);
      const elapsed=now-start;
      if (elapsed<duration) {
        let offset=0,previous=from;
        for(const step of steps){
          const milliseconds=step.duration*1000;
          if(elapsed<offset+milliseconds){apply(interpolateJoints(previous,step.angles,(elapsed-offset)/milliseconds));break;}
          offset+=milliseconds;previous=step.angles;
        }
      }
      // The frame timestamp predates FK/render work; dwell starts after actual laser activation.
      else { apply([...to]); laser(true); dwellStart ??=Math.max(now,performance.now()); }
      if (dwellStart!==undefined && now-dwellStart>=1000) { settled=true; if(!keepLaser)laser(false); signal.removeEventListener('abort',cancelled); resolve(); }
      else frame=requestAnimationFrame(tick);
      } catch (error) { settled=true; signal.removeEventListener('abort',cancelled); try { laser(false); } catch { /* Preserve the original execution failure. */ } reject(error); }
    };
    if(signal.aborted)cancelled();else frame=requestAnimationFrame(tick);
  });
}
