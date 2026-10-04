import React, { useEffect, useRef, useState } from 'react';
import { openDemoScene, type SceneHandle, type SceneInformation } from './scene/demo-scene';
import { importStep } from './import/step-import';
import type { PartAsset } from './import/types';
export default function App() {
  const viewport = useRef<HTMLDivElement>(null);
  const [information, setInformation] = useState<SceneInformation | null>(null);
  const scene = useRef<SceneHandle | null>(null);
  const pending = useRef<AbortController | null>(null);
  const source = useRef<PartAsset | null>(null);
  const request = useRef(0);
  const [sourceName, setSourceName] = useState('DOOR-of-CAR.step');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!viewport.current) return;
    scene.current = openDemoScene(viewport.current, (info, part) => { setInformation(info); source.current = part; }, setError);
    return () => { request.current++; pending.current?.abort(); source.current = null; scene.current?.dispose(); };

  }, []);
  const replace = async (file: File) => {
    const id = ++request.current;
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    source.current = null; scene.current?.clearPart(); setInformation(null); setError(''); setLoading(true); setSourceName(file.name);
    try {
      const part = await importStep(file, { signal: controller.signal });
      if (id !== request.current) return;
      source.current = part; scene.current?.replacePart(part);
    } catch (error) { if (id === request.current) setError(error instanceof Error ? error.message : String(error)); }
    finally { if (id === request.current) setLoading(false); }
  };
  return <main>
    <header><div><p className="eyebrow">SIMULATED SCENE INSPECTION</p><h1>Robot Door Scan Demo</h1></div><span className="badge">Fixed demo</span></header>
    <div className="workspace"><div className="viewport" ref={viewport} />
    <aside><h2>Inspect the scene</h2><p role="status">{loading ? 'Loading model…' : error ? 'Scene unavailable.' : information ? 'Scene ready — inspect the fixed door and robot.' : 'Loading supplied CAD assets…'}</p>
    {error && <p role="alert">{error}</p>}
    <p>Drag to orbit · right-drag to pan · scroll to zoom.</p>
    <label>Import STEP<input type="file" accept=".step,.stp" disabled={!information && !loading && !error} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void replace(file); }}/></label>
    <hr/><h3>Current part</h3><p>{sourceName}</p><p>The robot and door keep their original physical dimensions on one shared floor.</p>
    {information && <dl aria-label="Scene measurements"><dt>Door width × height</dt><dd>{information.doorWidthMm} × {information.doorHeightMm} mm</dd><dt>Robot core links</dt><dd>{information.robotLinkCount}</dd><dt>Scanner emitter at home</dt><dd>{information.emitterMm.join(', ')} mm</dd><dt>Coordinate frame</dt><dd>Robot-base · +Z up · floor Z=0</dd></dl>}
    <p className="note">Inspect the door and robot with the camera.</p></aside></div>
  </main>;
}
