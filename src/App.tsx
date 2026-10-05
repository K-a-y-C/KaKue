import logo from './assets/logo.jpeg';
import {DownloadControls} from './export/DownloadControls';
import { prepareRun } from './motion/preflight-client';
import type { RunPlan } from './motion/preflight';
import { visit, returnHome } from './motion/execution';
import type { SelectedPoint } from './scene/surface-selection';
import React, { useEffect, useRef, useState } from 'react';
import { openDemoScene, type SceneHandle, type SceneInformation } from './scene/demo-scene';
import { importStep, prepareInitialStep, validateStepFile } from './import/step-import';
import type { InitialPart, PartAsset } from './import/types';
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
  const [returning,setReturning]=useState(false);
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
  const [sourceName, setSourceName] = useState('');
  const [initialPart,setInitialPart]=useState<InitialPart|null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Pending file parsing needs cleanup even before a scene exists.
  useEffect(() => () => {
    runToken.current++; runAbort.current?.abort(); workerCancel.current?.();
    request.current++; pending.current?.abort(); source.current=null;
  }, []);
  useEffect(() => {
    if (!viewport.current || !initialPart) return;
    const generation=request.current;
    let initialized=false;
    const handle=openDemoScene(viewport.current, (info,part) => {
      if(!initialized && generation!==request.current)return;
      initialized=true;setInformation(info);setSceneReady(true);setLoading(false);source.current=part;
    }, message=>{
      if(generation===request.current){setError(message);setLoading(false);}
    }, point=>setPoints(points=>[...points,point]), initialPart);
    scene.current=handle;
    return ()=>{handle.dispose();if(scene.current===handle)scene.current=null;};
  }, [initialPart]);
  const replace = async (file: File) => {
    try { validateStepFile(file); } catch (error) { setError(error instanceof Error ? error.message : String(error)); return; }
    runActive.current=false; runToken.current++; runAbort.current?.abort(); workerCancel.current?.(); plan.current=null; setPhase('selecting'); setReturning(false); setStatuses({}); setCurrentPoint(null); setVisitedCount(0); scene.current?.setSelectionEnabled(true);
    const id = ++request.current;
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    source.current = null; scene.current?.clearPart(); setPoints([]); setInformation(null); setError(''); setLoading(true); setSourceName(file.name);
    try {
      if(!sceneReady){
        const initial=await prepareInitialStep(file,{signal:controller.signal});
        if(id===request.current){setInitialPart(initial);}
        return;
      }
      const part = await importStep(file, { signal: controller.signal });
      if (id !== request.current) return;
      source.current = part; scene.current?.replacePart(part);
    } catch (error) { if (id === request.current) {setError(error instanceof Error ? error.message : String(error));setLoading(false);} }
    finally { if (id === request.current && (sceneReady || controller.signal.aborted)) setLoading(false); }
  };
  const stop = () => {
    if (!runActive.current) return;
    runActive.current=false;
    runToken.current++; workerCancel.current?.(); workerCancel.current=null; runAbort.current?.abort();
    try { scene.current?.setLaser(false); } catch { /* Stop remains terminal when renderer cleanup fails. */ } setPhase('stopped'); setReturning(false); setCurrentPoint(null);
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
      setReturning(true);
      await returnHome(previous,prepared.homeAngles,angles=>{if(token===runToken.current)scene.current?.setJoints(angles);},on=>{if(token===runToken.current)scene.current?.setLaser(on);},controller.signal);
      if (token!==runToken.current) return;
      setReturning(false); runActive.current=false; setPhase('completed');
    } catch (failure) {
      if (token!==runToken.current) return;
      runActive.current=false; workerCancel.current=null; controller.abort();
      setStatuses(old=>interruptedStatuses(points,old));
      setCurrentPoint(null); try { scene.current?.setLaser(false); } catch { /* Retain the original failure and terminal data. */ } setReturning(false); setPhase('failed'); setError(failure instanceof Error?failure.message:String(failure));
    }
  };
  const importControl=<label className="import-control"><span>＋ Import CAD</span><input aria-label="Import STEP" type="file" accept=".step,.stp" disabled={phase==='preparing'||phase==='running'} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void replace(file);}}/></label>;
  return <main className={sceneReady?'app-shell':'app-shell awaiting-import'}>
    <header className="app-header"><div className="brand"><img src={logo} alt="KaKue Automation"/><span className="brand-divider"/><div><h1>Scan Studio</h1><p>Robot inspection workspace</p></div></div><span className="environment"><i/> Simulation</span></header>
    {!sceneReady&&<section className="import-screen"><div className="welcome-copy"><span className="section-kicker">CAD INSPECTION · ROBOT SIMULATION</span><h2>Create a scan workspace</h2><p>Import your CAD model to inspect its surfaces, plan scanner visits, and export your selected points.</p><div className="import-card"><div className="file-symbol" aria-hidden="true">↥</div><h3>{loading?'Preparing your workspace':'Start with your CAD file'}</h3><p>{loading?'Verifying the model and loading the inspection workspace…':'Choose a STEP model from your computer.'}</p>{importControl}<small>STEP / STP · Up to 50 MiB · Processed locally</small>{error&&<p role="alert">{error}</p>}</div><div className="workflow-guide"><span><b>01</b> Import model</span><span><b>02</b> Select surfaces</span><span><b>03</b> Simulate & export</span></div></div><p className="welcome-footnote">Your CAD stays in this browser. No upload or account required.</p></section>}
    {initialPart&&<><div className="document-toolbar" style={{visibility:sceneReady?'visible':'hidden'}}><div className="document-name"><span className="document-icon">◇</span><strong>{sourceName}</strong><span className="document-tag">STEP</span></div>{sceneReady&&importControl}</div>
    <div className="workspace" style={{visibility:sceneReady?'visible':'hidden'}} aria-hidden={!sceneReady}><div className="viewport" ref={viewport}><div className="viewport-label">PERSPECTIVE <span>Robot-base · mm</span></div><div className="viewport-hint">Drag to orbit <i/> Right-drag to pan <i/> Scroll to zoom</div></div>
    <aside><div className="inspector-title"><h2>Scan setup</h2><span>INSPECTOR</span></div><p role="status">{phase==='completed'?'Simulation complete':phase==='blocked'?'Sequence blocked — no robot movement.':phase==='failed'?'Simulation failed':phase==='stopped'?'Simulation stopped':phase==='preparing'?'Preparing scanner poses…':phase==='running'?(returning?'Returning home…':'Simulation running…'):loading ? 'Loading model…' : information ? 'Scene ready — select CAD surfaces to plan your scan.' : error ? 'Scene unavailable.' : 'Loading supplied CAD assets…'}</p>
    {error && <p role="alert">{error}</p>}
    <section aria-label="Scanner visit"><h3>Scanner settings</h3><label>Stand-off (mm)<input type="number" min="50" max="500" value={standOff} disabled={locked} onChange={event=>setStandOff(event.target.value)}/></label><div className="run-controls"><button className="primary-action" onClick={()=>void run()} disabled={locked || !information || points.length===0 || !Number.isFinite(Number(standOff)) || Number(standOff)<50 || Number(standOff)>500}>Run</button><button className="stop-action" onClick={stop} disabled={phase!=='preparing' && phase!=='running'}>Stop</button></div><p className="simulation-note">Continuous scan · 1 second at each point</p><p aria-label="Route progress">Current point: {currentPoint??'—'} · Visited: {visitedCount} of {points.length}</p></section>
    {information && <details className="model-properties"><summary>Model properties</summary><dl aria-label="Scene measurements"><dt>Door width × height</dt><dd>{information.doorWidthMm} × {information.doorHeightMm} mm</dd><dt>Robot core links</dt><dd>{information.robotLinkCount}</dd><dt>Scanner emitter at home</dt><dd>{information.emitterMm.join(', ')} mm</dd><dt>Coordinate frame</dt><dd>Robot-base · +Z up · floor Z=0</dd></dl></details>}
    {phase==='completed'&&<DownloadControls part={source.current} points={points} statuses={statuses} plan={plan.current} standOffMm={Number(standOff)} outcome={phase}/>}
    <section aria-label="Surface selection"><h3>Selected points <span className="point-count">{points.length}</span></h3><p className="selection-hint">Click a visible CAD surface to add a point.</p>{points.length===0&&<div className="empty-selection"><span>⌖</span><strong>No points selected</strong><p>Your selection order becomes the scan route.</p></div>}<table aria-label="Selected surface points"><thead><tr><th>Point</th><th>X</th><th>Y</th><th>Z</th><th>Status</th></tr></thead><tbody>{points.map(point => <tr key={point.id} data-part-position={point.partPosition.join(',')} data-part-normal={point.partNormal.join(',')} data-base-normal={point.baseNormal.join(',')}><th>{point.order}</th>{point.basePosition.map((value, i) => <td key={i}>{(value*1000).toFixed(1)}</td>)}<td>{statuses[point.id]??'Selected'}</td></tr>)}</tbody></table></section><p className="inspector-footnote">Simulated visits · Selected CAD points</p></aside></div></>}
  </main>;
}
