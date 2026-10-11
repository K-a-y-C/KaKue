import {useEffect, useRef, useState} from 'react';

type SymbolName = 'part'|'robot'|'scanner'|'grid'|'play'|'stop';
const paths:Record<SymbolName,string>={
 part:'M4 7 12 3l8 4v10l-8 4-8-4V7Zm0 0 8 4 8-4M12 11v10',
 robot:'M4 21h8M8 21v-6l6-4-3-6M8 15l-4-5 7-5 5-2 4 5-6 3M18 8l3 3',
 scanner:'M4 5h16v10H4V5Zm4 10v4m8-4v4M8 9h8',
 grid:'M4 4h16v16H4V4Zm0 5h16M4 15h16M9 4v16M15 4v16',
 play:'m8 5 11 7-11 7V5Z',stop:'M6 6h12v12H6V6Z'
};
export function ToolIcon({name}:{name:SymbolName}) {
 return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;
}
const menus={File:['New project','Open project','Save project'],Edit:['Undo','Redo','Delete selection'],View:['Front view','Top view','Wireframe'],Tools:['Measure','Transform','CAD modeling'],Help:['Documentation','Keyboard shortcuts']};
export function ApplicationMenus() {
 const [open,setOpen]=useState<string|null>(null);
 const navigation=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(!open)return;
  const dismiss=(event:PointerEvent)=>{if(!navigation.current?.contains(event.target as Node))setOpen(null);};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){navigation.current?.querySelector<HTMLButtonElement>('[aria-expanded="true"]')?.focus();setOpen(null);}};
  document.addEventListener('pointerdown',dismiss);
  document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};
 },[open]);
 return <nav ref={navigation} className="application-menus" aria-label="Application menus">
  {Object.entries(menus).map(([name,commands])=><div className="menu-entry" key={name}>
   <button aria-expanded={open===name} aria-controls={`menu-${name}`} onClick={()=>setOpen(open===name?null:name)}>{name}</button>
   {open===name&&<div className="menu-panel" id={`menu-${name}`}><small>{name} commands</small>{commands.map(command=><button key={command} disabled title="Unavailable in this demo">{command}</button>)}<p>Additional commands are unavailable in this demo.</p>{name==='View'&&<p>Drag to orbit · Right-drag to pan · Scroll to zoom</p>}</div>}
  </div>)}
  <span className="menu-context">LOCAL WORKSPACE</span>
 </nav>;
}
export function WorkflowTabs() {
 return <div className="workflow-tabs" role="tablist" aria-label="Workspace modes"><button role="tab" aria-selected="false" disabled title="CAD modeling is unavailable in this demo">Model</button><button role="tab" aria-selected="true" aria-controls="scan-workspace" id="scan-planning-tab">Scan planning</button><button role="tab" aria-selected="false" disabled title="Analysis is unavailable in this demo">Analysis</button></div>;
}
export function SceneTree({pointCount}:{pointCount:number}) {
 return <section className="scene-tree" aria-label="Scene tree"><div className="tree-title"><strong>Scene</strong><span>ASSEMBLY</span></div><ul><li className="tree-root"><span aria-hidden="true">⌄</span> Inspection cell</li><li className="active-tree-item"><ToolIcon name="part"/><span>Imported part</span><small>STEP</small></li><li><ToolIcon name="robot"/><span>Robot assembly</span><small>6 axes</small></li><li><ToolIcon name="scanner"/><span>Scanner</span></li><li><ToolIcon name="grid"/><span>Base platform</span></li><li className="tree-points"><span aria-hidden="true">⌖</span> Surface points <small>{pointCount}</small></li></ul><div className="tree-footer">Fixed placement · Robot-base</div></section>;
}
