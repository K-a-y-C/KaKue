import {useEffect,useRef,useState,type ReactNode} from 'react';
import {ToolIcon,commandIcon} from './Chrome';
export function CommandButton({label,icon=commandIcon(label),large=false,disabled=false,onClick,active=false,preview}:{label:string;icon?:Parameters<typeof ToolIcon>[0]['name'];large?:boolean;disabled?:boolean;onClick?:()=>void;active?:boolean;preview?:(label:string)=>void}) {
 return <button aria-label={label} className={`command ${large?'large':''}`} disabled={disabled} onClick={preview?()=>preview(label):onClick} aria-pressed={active||undefined} title={preview?`${label} · Preview command`:label}><ToolIcon name={icon}/><span>{label}</span></button>;
}
export function RibbonGroup({name,children}:{name:string;children:ReactNode}) {return <div role="group" aria-label={name} className="ribbon-group"><div className="group-tools">{children}</div><div className="group-caption">{name}</div></div>;}
export function ScanRibbon({onImport,importLocked,onRun,runDisabled,onStop,stopDisabled,onStandOff,settingsDisabled,onSelect,onProperties,output,preview}:{onImport:()=>void;importLocked:boolean;onRun:()=>void;runDisabled:boolean;onStop:()=>void;stopDisabled:boolean;onStandOff:()=>void;settingsDisabled:boolean;onSelect:()=>void;onProperties:()=>void;output:ReactNode;preview:(label:string)=>void}) {
 const [tab,setTab]=useState('Scan'),[menu,setMenu]=useState<string|null>(null);
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!menu)return;
  const dismiss=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setMenu(null);};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){root.current?.querySelector<HTMLButtonElement>('[aria-expanded=true]')?.focus();setMenu(null);}};
  document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',escape);
  return ()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape);};
 },[menu]);
 return <><div ref={root} className="ribbon-navigation"><div role="tablist" aria-label="Workflow tabs" className="ribbon-tabs">{['File','Geometry','Robot','Scan','View','Results','Tools','Help'].map(name=>name==='File'||name==='Help'?<button key={name} aria-expanded={menu===name} aria-controls={`menu-${name}`} onClick={()=>setMenu(menu===name?null:name)}>{name}</button>:<button key={name} role="tab" aria-selected={tab===name} aria-controls="ribbon-commands" id={`tab-${name}`} onClick={()=>{setTab(name);setMenu(null);}} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const tabs=[...e.currentTarget.parentElement!.querySelectorAll<HTMLButtonElement>('[role=tab]')];tabs[(tabs.indexOf(e.currentTarget)+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length].click();tabs[(tabs.indexOf(e.currentTarget)+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length].focus();}}}>{name}</button>)}</div>
 {menu&&<div className="menu-panel" id={`menu-${menu}`} style={{left:menu==='File'?0:490}}>{(menu==='File'?['New project','Open project','Save project','Save as','Recent projects']:['Help contents','Keyboard shortcuts','About']).map(label=><CommandButton key={label} label={label} preview={label=>{preview(label);root.current?.querySelector<HTMLButtonElement>('[aria-expanded=true]')?.focus();setMenu(null);}}/>)}{menu==='File'&&<CommandButton label="Import CAD" onClick={()=>{setMenu(null);onImport();}} disabled={importLocked}/>}</div>}</div>
 <section id="ribbon-commands" className="ribbon" aria-label={`${tab} commands`}>
 {tab!=='Scan'&&!stopDisabled&&<RibbonGroup name="Active sequence"><CommandButton label="Stop" icon="stop" large onClick={onStop}/></RibbonGroup>}
 {tab==='Scan'?<>
 <RibbonGroup name="CAD"><CommandButton label="Import CAD" large onClick={onImport} disabled={importLocked}/><CommandButton label="Model properties" onClick={onProperties}/></RibbonGroup>
 <RibbonGroup name="Selection"><CommandButton label="Select surface point" large active={!settingsDisabled} onClick={onSelect} disabled={settingsDisabled}/><div className="command-stack">{['Select face','Select region','Clear selection'].map(label=><CommandButton key={label} label={label} preview={preview}/>)}</div></RibbonGroup>
 <RibbonGroup name="Scanner"><CommandButton label="Set stand-off" icon="distance" large onClick={onStandOff} disabled={settingsDisabled}/><div className="command-stack">{['Scanner orientation','Laser preview'].map(label=><CommandButton key={label} label={label} preview={preview} icon="scanner"/>)}</div></RibbonGroup>
 <RibbonGroup name="Sequence"><CommandButton label="Run" icon="play" large onClick={onRun} disabled={runDisabled}/><CommandButton label="Stop" icon="stop" large onClick={onStop} disabled={stopDisabled}/><div className="command-stack">{['Route options','Validate route'].map(label=><CommandButton key={label} label={label} preview={preview}/>)}</div></RibbonGroup>
 <RibbonGroup name="Output">{output}<div className="command-stack">{['Point cloud','Coordinates','Report'].map(label=><CommandButton key={label} label={label} preview={preview} icon="grid"/>)}</div></RibbonGroup>
 </>:Object.entries(previewTabs[tab]).map(([group,commands])=><RibbonGroup key={group} name={group}>{commands.map(label=><CommandButton key={label} label={label} large preview={preview}/>)}</RibbonGroup>)}
 </section></>;
}

const previewTabs:Record<string,Record<string,string[]>>={
 Geometry:{Create:['Box','Cylinder','Plane'],Modify:['Move','Rotate','Scale'],Inspect:['Measure','Section','Interference']},
 Robot:{Setup:['Select robot','Tool mount','Joint limits'],Position:['Jog','Home','Teach pose']},
 View:{Navigate:['Orbit','Pan','Zoom','Fit'],Orientation:['Front','Top','Right','Isometric'],Display:['Shaded','Wireframe','Grid','Axes']},
 Results:{Data:['Point cloud','Coordinates','Scan report'],Compare:['Compare scans','Statistics']},
 Tools:{Automation:['Script editor','Run script','Record macro'],Workspace:['Preferences','Layout','Plugins']}
};
