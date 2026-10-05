import { robotDefinition } from '../robot/definition';
/** Bounded interval interpolation: no periodic angle wrapping. */
export function interpolateJoints(from: readonly number[], to: readonly number[], fraction: number): number[] {
  const t=Math.max(0,Math.min(1,fraction)), smooth=t*t*(3-2*t);
  return from.map((angle,i)=>angle+(to[i]-angle)*smooth);
}
export function transitionDuration(from: readonly number[], to: readonly number[]): number {
  return Math.max(1,...from.map((angle,i)=>1.5*Math.abs(to[i]-angle)/robotDefinition.joints[i].demoSpeed));
}
/** Scene updates run outside React. Resolves only after an endpoint's one-second dwell. */
export function visit(from: readonly number[], to: readonly number[], apply: (angles: number[])=>void, laser:(on:boolean)=>void, signal: AbortSignal): Promise<void> {
  const duration=transitionDuration(from,to)*1000;
  return new Promise((resolve,reject)=> {
    let frame=0, start: number|undefined, dwellStart: number|undefined;
    const cancelled=()=> { cancelAnimationFrame(frame); laser(false); reject(new DOMException('Sequence cancelled','AbortError')); };
    signal.addEventListener('abort',cancelled,{once:true});
    const tick=(now:number)=> {
      if (signal.aborted) return cancelled();
      try {
      start ??=now;
      const elapsed=now-start;
      if (elapsed<duration) apply(interpolateJoints(from,to,elapsed/duration));
      // The frame timestamp predates FK/render work; dwell starts after actual laser activation.
      else { apply([...to]); laser(true); dwellStart ??=Math.max(now,performance.now()); }
      if (dwellStart!==undefined && now-dwellStart>=1000) { laser(false); signal.removeEventListener('abort',cancelled); resolve(); }
      else frame=requestAnimationFrame(tick);
      } catch (error) { signal.removeEventListener('abort',cancelled); laser(false); reject(error); }
    };
    frame=requestAnimationFrame(tick);
  });
}
