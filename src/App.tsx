import { prepareRun } from './motion/preflight-client';
import type { RunPlan } from './motion/preflight';
import { visit } from './motion/execution';
import type { SelectedPoint } from './scene/surface-selection';
import React, { useEffect, useRef, useState } from 'react';
import { openDemoScene, type SceneHandle, type SceneInformation } from './scene/demo-scene';
import { importStep, validateStepFile } from './import/step-import';
import type { PartAsset } from './import/types';
function interruptedStatuses(points: readonly SelectedPoint[], statuses: Record<number,string>) {
  return Object.fromEntries(points.map(point=> {
    const status=statuses[point.id];
    return [point.id, status==='Visited'||status==='Outside reach'||status==='Pose not solved'?status:status==='Moving'?'Stopped':'Not visited'];
  }));
}
export default function App() {
  const [phase,setPhase] = useState<'selecting'|'preparing'|'running'|'completed'|'blocked'|'stopped'|'failed'>('selecting');
  const [standOff,setStandOff]=useState('100');
  const [currentPoint,setCurrentPoint]=useState<number|null>(null);
  const [visitedCount,setVisitedCount]=useState(0);
  const [statuses,setStatuses]=useState<Record<number,string>>({});
  const runToken=useRef(0);
  const runActive=useRef(false);
  const runAbort=useRef<AbortController|null>(null);
  const workerCancel=useRef<(()=>void)|null>(null);
  const plan=useRef<RunPlan|null>(null);
  const locked=phase!=='selecting';
  const [points, setPoints] = useState<SelectedPoint[]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const [information, setInformation] = useState<SceneInformation | null>(null);
  const scene = useRef<SceneHandle | null>(null);
  const pending = useRef<AbortController | null>(null);
  const source = useRef<PartAsset | null>(null);
  const request = useRef(0);
  const [sourceName, setSourceName] = useState('DOOR-of-CAR.step');
  const [sceneReady, setSceneReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!viewport.current) return;
    scene.current = openDemoScene(viewport.current, (info, part) => { setInformation(info); setSceneReady(true); source.current = part; }, setError, point => setPoints(points => [...points, point]));
    return () => { runToken.current++; runAbort.current?.abort(); workerCancel.current?.(); request.current++; pending.current?.abort(); source.current = null; scene.current?.dispose(); };

  }, []);
  const replace = async (file: File) => {
    try { validateStepFile(file); } catch (error) { setError(error instanceof Error ? error.message : String(error)); return; }
    runActive.current=false; runToken.current++; runAbort.current?.abort(); workerCancel.current?.(); plan.current=null; setPhase('selecting'); setStatuses({}); setCurrentPoint(null); setVisitedCount(0); scene.current?.setSelectionEnabled(true);
    const id = ++request.current;
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    source.current = null; scene.current?.clearPart(); setPoints([]); setInformation(null); setError(''); setLoading(true); setSourceName(file.name);
    try {
      const part = await importStep(file, { signal: controller.signal });
      if (id !== request.current) return;
      source.current = part; scene.current?.replacePart(part);
    } catch (error) { if (id === request.current) setError(error instanceof Error ? error.message : String(error)); }
    finally { if (id === request.current) setLoading(false); }
  };
  const stop = () => {
    if (!runActive.current) return;
    runActive.current=false;
    runToken.current++; workerCancel.current?.(); workerCancel.current=null; runAbort.current?.abort();
    try { scene.current?.setLaser(false); } catch { /* Stop remains terminal when renderer cleanup fails. */ } setPhase('stopped'); setCurrentPoint(null);
    setStatuses(old=>interruptedStatuses(points,old));
  };
  const run=async () => {
    const distance=Number(standOff);
    if (locked || !information || !source.current || points.length===0 || !Number.isFinite(distance) || distance<50 || distance>500) return;
    const token=++runToken.current, controller=new AbortController(); runAbort.current=controller;
    runActive.current=true; scene.current?.setSelectionEnabled(false); setPhase('preparing'); setError('');
    try {
      const preparation=prepareRun(points,distance); workerCancel.current=preparation.cancel;
      const prepared=await preparation.promise; if (token!==runToken.current) return;
      workerCancel.current=null; plan.current=prepared;
      setStatuses(Object.fromEntries(prepared.points.map(entry=>[entry.point.id,entry.status==='ready'?(prepared.blocked?'Not visited':'Ready'):entry.status==='outside_reach'?'Outside reach':'Pose not solved'])));
      if (prepared.blocked) { runActive.current=false; setError(prepared.points.filter(p=>p.reason).map(p=>`Point ${p.point.order}: ${p.reason}`).join(' ')); setPhase('blocked'); return; }
      setPhase('running');
      let previous=prepared.homeAngles;
      for (const entry of prepared.points) {
      setCurrentPoint(entry.point.order);
      if (!entry.angles) throw new Error('Preflight did not return a verified joint pose.');
      setStatuses(old=>({...old,[entry.point.id]:'Moving'}));
      await visit(previous,entry.angles,angles=>{if(token===runToken.current)scene.current?.setJoints(angles);},on=>{if(token===runToken.current)scene.current?.setLaser(on,prepared.standOffMm/1000);},controller.signal,true,entry.path);
      if (token!==runToken.current) return;
      setStatuses(old=>({...old,[entry.point.id]:'Visited'}));
      setVisitedCount(count=>count+1);
      previous=entry.angles;
      }
      setCurrentPoint(null);
      scene.current?.setLaser(false); runActive.current=false; setPhase('completed');
    } catch (failure) {
      if (token!==runToken.current) return;
      runActive.current=false; workerCancel.current=null; controller.abort();
      setStatuses(old=>interruptedStatuses(points,old));
      setCurrentPoint(null); try { scene.current?.setLaser(false); } catch { /* Retain the original failure and terminal data. */ } setPhase('failed'); setError(failure instanceof Error?failure.message:String(failure));
    }
  };
  return <main>
    <header><div><p className="eyebrow">SIMULATED SCENE INSPECTION</p><h1>Robot Door Scan Demo</h1></div><span className="badge">Fixed demo</span></header>
    <div className="workspace"><div className="viewport" ref={viewport} />
    <aside><h2>Inspect the scene</h2><p role="status">{phase==='completed'?'Simulation complete':phase==='blocked'?'Sequence blocked — no robot movement.':phase==='failed'?'Simulation failed':phase==='stopped'?'Simulation stopped':phase==='preparing'?'Preparing scanner poses…':phase==='running'?'Simulation running…':loading ? 'Loading model…' : information ? 'Scene ready — inspect the fixed door and robot.' : error ? 'Scene unavailable.' : 'Loading supplied CAD assets…'}</p>
    {error && <p role="alert">{error}</p>}
    <p>Drag to orbit · right-drag to pan · scroll to zoom.</p>
    <label>Import STEP<input type="file" accept=".step,.stp" disabled={!sceneReady || phase==='preparing' || phase==='running'} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void replace(file); }}/></label>
    <section aria-label="Scanner visit"><h3>Scanner visit</h3><label>Stand-off (mm)<input type="number" min="50" max="500" value={standOff} disabled={locked} onChange={event=>setStandOff(event.target.value)}/></label><button onClick={()=>void run()} disabled={locked || !information || points.length===0 || !Number.isFinite(Number(standOff)) || Number(standOff)<50 || Number(standOff)>500}>Run</button><button onClick={stop} disabled={phase!=='preparing' && phase!=='running'}>Stop</button><p>Illustrative continuous scan · selection order · endpoint dwell 1 second.</p><p aria-label="Route progress">Current point: {currentPoint??'—'} · Visited: {visitedCount} of {points.length}</p></section><hr/><h3>Current part</h3><p>{sourceName}</p><p>The robot and door keep their original physical dimensions on one shared floor.</p>
    {information && <dl aria-label="Scene measurements"><dt>Door width × height</dt><dd>{information.doorWidthMm} × {information.doorHeightMm} mm</dd><dt>Robot core links</dt><dd>{information.robotLinkCount}</dd><dt>Scanner emitter at home</dt><dd>{information.emitterMm.join(', ')} mm</dd><dt>Coordinate frame</dt><dd>Robot-base · +Z up · floor Z=0</dd></dl>}
    <section aria-label="Surface selection"><h3>Selected points ({points.length})</h3><p>Click door surfaces to append points. XYZ: robot-base mm.</p><table aria-label="Selected surface points"><thead><tr><th>Point</th><th>X</th><th>Y</th><th>Z</th><th>Status</th></tr></thead><tbody>{points.map(point => <tr key={point.id} data-part-position={point.partPosition.join(',')} data-part-normal={point.partNormal.join(',')} data-base-normal={point.baseNormal.join(',')}><th>{point.order}</th>{point.basePosition.map((value, i) => <td key={i}>{(value*1000).toFixed(1)}</td>)}<td>{statuses[point.id]??'Selected'}</td></tr>)}</tbody></table></section></aside></div>
  </main>;
}
