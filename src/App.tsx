import React, { useEffect, useRef, useState } from 'react';
import { openDemoScene, type SceneInformation } from './scene/demo-scene';
export default function App() {
  const viewport = useRef<HTMLDivElement>(null);
  const [information, setInformation] = useState<SceneInformation | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!viewport.current) return;
    return openDemoScene(viewport.current, setInformation, setError);
  }, []);
  return <main>
    <header><div><p className="eyebrow">SIMULATED SCENE INSPECTION</p><h1>Robot Door Scan Demo</h1></div><span className="badge">Fixed demo</span></header>
    <div className="workspace"><div className="viewport" ref={viewport} />
    <aside><h2>Inspect the scene</h2><p role="status">{error ? 'Scene unavailable.' : information ? 'Scene ready — inspect the fixed door and robot.' : 'Loading supplied CAD assets…'}</p>
    {error && <p role="alert">{error}</p>}
    <p>Drag to orbit · right-drag to pan · scroll to zoom.</p>
    <hr/><h3>Supplied door</h3><p>DOOR-of-CAR.step</p><p>The robot and door keep their original physical dimensions on one shared floor.</p>
    {information && <dl aria-label="Scene measurements"><dt>Door width × height</dt><dd>{information.doorWidthMm} × {information.doorHeightMm} mm</dd><dt>Robot core links</dt><dd>{information.robotLinkCount}</dd><dt>Scanner emitter at home</dt><dd>{information.emitterMm.join(', ')} mm</dd><dt>Coordinate frame</dt><dd>Robot-base · +Z up · floor Z=0</dd></dl>}
    <p className="note">Inspect the door and robot with the camera.</p></aside></div>
  </main>;
}
