import {StandOffEditor} from './workspace/StandOffEditor';
import {ScanRibbon,CommandButton} from './workspace/Ribbon';
import {SceneTree, ToolIcon} from './workspace/Chrome';
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
  const distanceTrigger=useRef<HTMLElement|null>(null);
  const [inspector,setInspector]=useState('data');
  const [distanceEditor,setDistanceEditor]=useState(false);
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
  const fileInput=useRef<HTMLInputElement>(null);
  const [previewMessage,setPreviewMessage]=useState('');
  const previewTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(previewTimer.current)clearTimeout(previewTimer.current);},[]);
  const preview=(label:string)=>{if(previewTimer.current)clearTimeout(previewTimer.current);setPreviewMessage(`${label} — preview command`);previewTimer.current=setTimeout(()=>setPreviewMessage(''),3000);};
  const importControl=<label className="import-control"><span>＋ Import CAD</span><input ref={fileInput} aria-label="Import STEP" type="file" accept=".step,.stp" disabled={phase==='preparing'||phase==='running'} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void replace(file);}}/></label>;
  return <main className={sceneReady?'app-shell':'app-shell awaiting-import'}>
    <header className="app-header"><div className="title-bar"><div className="brand"><img src={logo} alt="KaKue Automation"/><div><h1>KaKue scan studio</h1></div></div><div className="quick-access">{["New","Open","Save","Undo","Redo"].map(label=><CommandButton key={label} label={label} preview={preview} icon={label==='Undo'?'undo':label==='Redo'?'redo':'file'}/>)}</div></div></header>
<ScanRibbon preview={preview} onImport={()=>fileInput.current?.click()} importLocked={phase==='preparing'||phase==='running'} onRun={()=>void run()} runDisabled={locked||!information||!points.length||!Number.isFinite(Number(standOff))||Number(standOff)<50||Number(standOff)>500} onStop={stop} stopDisabled={phase!=='preparing'&&phase!=='running'} onStandOff={()=>{distanceTrigger.current=document.activeElement as HTMLElement;setDistanceEditor(true);}} settingsDisabled={locked||!information} onSelect={()=>viewport.current?.focus()} onProperties={()=>{setInspector('properties');document.querySelector<HTMLDetailsElement>('.model-properties')?.setAttribute('open','');document.querySelector<HTMLButtonElement>('[role=tab][aria-controls=properties-panel]')?.focus();}} output={phase==='completed'?<DownloadControls part={source.current} points={points} statuses={statuses} plan={plan.current} standOffMm={Number(standOff)} outcome={phase}/>:<CommandButton label="Export" large disabled/>}/><div className="ribbon-import">{importControl}</div>
    <div className="workspace" id="scan-workspace" aria-label="Scan workspace"><SceneTree pointCount={points.length} sourceName={information?sourceName:''} preview={preview}/><div className="document-view"><div className="document-strip"><span>{information?`${sourceName} — 3D view`:"No document"}</span><CommandButton label="New view" icon="plus" preview={preview}/></div><div className="viewport" ref={viewport} tabIndex={0} aria-label="Scan viewport">{sceneReady&&<div className="view-tools">{["Perspective","Fit","Orbit","Pan","Grid","Axes"].map(label=><button key={label} aria-label={`${label} view tool`} title={`${label} · Preview command`} onClick={()=>preview(label)}><ToolIcon name={label==='Grid'?'grid':label==='Fit'?'zoom':label==='Orbit'?'rotate':'move'}/></button>)}</div>}{!sceneReady&&<div className="empty-workspace"><strong>{loading?"Preparing your workspace":"No model open"}</strong><p>{loading?"Verifying model and loading assets…":"Import CAD to begin"}</p></div>}</div></div>
    <aside className="dock-panel"><div className="pane-tabs" role="tablist" aria-label="Inspector panes">{['Properties','Scan data'].map(name=><button key={name} role="tab" aria-selected={inspector===(name==='Properties'?'properties':'data')} aria-controls={name==='Properties'?'properties-panel':'data-panel'} onClick={()=>setInspector(name==='Properties'?'properties':'data')}>{name}</button>)}</div><div className="inspector-content"><p role="status">{phase==='completed'?'Simulation complete':phase==='blocked'?'Sequence blocked — no robot movement.':phase==='failed'?'Simulation failed':phase==='stopped'?'Simulation stopped':phase==='preparing'?'Preparing scanner poses…':phase==='running'?(returning?'Returning home…':'Simulation running…'):loading ? 'Loading model…' : information ? 'Scene ready — select CAD surfaces to plan your scan.' : error ? 'Scene unavailable.' : 'Import CAD to begin.'}</p>
    {error && <p role="alert">{error}</p>}
    <div id="properties-panel" hidden={inspector!=='properties'}><details open><summary>Scanner</summary><section aria-label="Scanner visit"><h3>Scanner settings</h3><label>Stand-off (mm)<input type="number" min="50" max="500" value={standOff} disabled={locked||!information} onChange={event=>setStandOff(event.target.value)}/></label><p className="simulation-note">Continuous scan · 1 second at each point</p></section></details>
    {information && <details className="model-properties"><summary>Part</summary><dl aria-label="Scene measurements"><dt>Door width × height</dt><dd>{information.doorWidthMm} × {information.doorHeightMm} mm</dd><dt>Robot core links</dt><dd>{information.robotLinkCount}</dd><dt>Scanner emitter at home</dt><dd>{information.emitterMm.join(', ')} mm</dd><dt>Coordinate frame</dt><dd>Robot-base · +Z up · floor Z=0</dd></dl></details>}
    <details open><summary>Sequence</summary><p>State: {phase}</p><p>Visited: {visitedCount} of {points.length}</p><p>Append-only · selection order</p></details></div>
    <div id="data-panel" hidden={inspector!=='data'}><p aria-label="Route progress">Current point: {currentPoint??'—'} · Visited: {visitedCount} of {points.length}</p>    <section aria-label="Surface selection"><h3>Selected points <span className="point-count">{points.length}</span></h3><p className="selection-hint">Robot-base · mm</p><table aria-label="Selected surface points">{points.length>0&&<thead><tr><th>Point</th><th>X</th><th>Y</th><th>Z</th><th>Status</th></tr></thead>}<tbody>{points.length===0&&<tr className="empty-row"><td colSpan={5}>No surface points selected</td></tr>}{points.map(point => <tr key={point.id} data-part-position={point.partPosition.join(',')} data-part-normal={point.partNormal.join(',')} data-base-normal={point.baseNormal.join(',')}><th>{point.order}</th>{point.basePosition.map((value, i) => <td key={i}>{(value*1000).toFixed(1)}</td>)}<td>{statuses[point.id]??'Selected'}</td></tr>)}</tbody></table></section></div><p className="inspector-footnote">Simulated visits · Selected CAD points</p></div></aside></div>
    {distanceEditor&&!locked&&information&&<StandOffEditor value={standOff} onApply={setStandOff} onClose={()=>{setDistanceEditor(false);requestAnimationFrame(()=>distanceTrigger.current?.focus());}}/>}
    <footer aria-label="Application status" aria-live="polite">Simulation · {previewMessage||`${loading?'Loading model':!information?'No model open':phase==='selecting'?'Selection mode':phase==='running'?(returning?'Returning home':'Scan in progress'):phase.charAt(0).toUpperCase()+phase.slice(1)} · ${points.length} surface points · Robot-base · mm · Drag to orbit · Right-drag to pan · Scroll to zoom`}</footer>
  </main>;
}
