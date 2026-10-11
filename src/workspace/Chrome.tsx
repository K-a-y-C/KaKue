import {useState} from 'react';

type SymbolName='part'|'robot'|'scanner'|'grid'|'play'|'stop'|'import'|'export'|'select'|'region'|'distance'|'route'|'eye'|'plus'|'move'|'rotate'|'zoom'|'measure'|'file'|'undo'|'redo';
const paths:Record<SymbolName,string>={
 part:'M4 7 12 3l8 4v10l-8 4-8-4V7Zm0 0 8 4 8-4M12 11v10',
 robot:'M4 21h8M8 21v-6l6-4-3-6M8 15l-4-5 7-5 5-2 4 5-6 3M18 8l3 3',
 scanner:'M4 5h16v10H4V5Zm4 10v4m8-4v4M8 9h8',
 grid:'M4 4h16v16H4V4Zm0 5h16M4 15h16M9 4v16M15 4v16',
 play:'m8 5 11 7-11 7V5Z',stop:'M6 6h12v12H6V6Z',
 import:'M14 3H5v18h14v-8M14 3v5h5M21 8h-9m3-3-3 3 3 3',
 export:'M14 3H5v18h14v-8M14 3v5h5M12 10h9m-3-3 3 3-3 3',
 select:'m4 3 5 15 3-6 6-3L4 3Zm13 11v8m-4-4h8',
 region:'M3 8V3h5m8 0h5v5m0 8v5h-5m-8 0H3v-5',
 distance:'M7 3h10v7H7V3Zm5 7v8m-3-3 3 3 3-3M3 21h18M3 17v4m18-4v4',
 route:'M4 5h5v6h6v7h5M2 3h4v4H2V3Zm16 13h4v4h-4v-4',
 eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm7 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
 plus:'M12 4v16M4 12h16',move:'M12 2v20M2 12h20m-13-7 3-3 3 3m-6 14 3 3 3-3M5 9l-3 3 3 3m14-6 3 3-3 3',
 rotate:'M20 9a8 8 0 1 0 0 7M20 3v6h-6',zoom:'M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14Zm5 12 6 6M7 10h6m-3-3v6',
 measure:'m3 17 14-14 4 4L7 21l-4-4Zm5-5 3 3m1-7 3 3',file:'M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h8',
 undo:'M4 9h10a6 6 0 0 1 0 12M4 9l5-5M4 9l5 5',redo:'M20 9H10a6 6 0 0 0 0 12M20 9l-5-5M20 9l-5 5'
};
export function ToolIcon({name}:{name:SymbolName}) {return <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill={name==='play'||name==='stop'?'currentColor':'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>;}
export function commandIcon(label:string):SymbolName {
 if(label.includes('Import'))return 'import';if(label==='Export')return 'export';if(label.includes('stand-off'))return 'distance';if(label.includes('surface'))return 'select';if(label.includes('region')||label.includes('Clear'))return 'region';if(/Route|route|Validate/.test(label))return 'route';if(/Scanner|Laser|mount/.test(label))return 'scanner';if(/Coordinates|Grid|Wireframe/.test(label))return 'grid';if(/Zoom|Fit/.test(label))return 'zoom';if(/Measure|Section/.test(label))return 'measure';if(/Rotate|Orbit|orientation/.test(label))return 'rotate';if(/Move|Pan|Axes/.test(label))return 'move';if(/robot|Joint|Jog|Home|pose/.test(label))return 'robot';if(/project|Save|Report|report|script|macro|Help|About/.test(label))return 'file';return 'part';
}
interface TreeNode {label:string;icon:SymbolName;children?:TreeNode[]}
export function SceneTree({pointCount,sourceName,preview}:{pointCount:number;sourceName:string;preview:(label:string)=>void}) {
 const [query,setQuery]=useState(''),[selected,setSelected]=useState('Imported part'),[collapsed,setCollapsed]=useState(new Set(['Robot assembly'])),[tab,setTab]=useState('Project outline');
 const nodes:TreeNode[]=[{label:'Inspection cell',icon:'part',children:[{label:sourceName?`Imported part — ${sourceName}`:'Imported part',icon:'part'},{label:'Robot assembly',icon:'robot',children:['Base',...Array.from({length:6},(_,i)=>`Link ${i+1}`)].map(label=>({label,icon:'robot'}))},{label:'Scanner',icon:'scanner'},{label:'Base platform',icon:'grid'},{label:`Surface points (${pointCount})`,icon:'select',children:Array.from({length:pointCount},(_,i)=>({label:`Point ${i+1}`,icon:'select'}))}]}];
 const matches=(node:TreeNode):boolean=>node.label.toLowerCase().includes(query.toLowerCase())||!!node.children?.some(matches);
 const row=(node:TreeNode,depth:number)=>{
  if(query&&!matches(node))return null;
  const expanded=!collapsed.has(node.label)||!!query;
  return <div key={node.label}><div className={`tree-row ${selected===node.label||selected==='Imported part'&&node.label.startsWith(selected)?'selected':''}`} style={{paddingLeft:depth*12}}>
  {node.children?.length?<button className="disclosure" aria-label={`${expanded?'Collapse':'Expand'} ${node.label}`} aria-expanded={expanded} onClick={()=>setCollapsed(old=>{const next=new Set(old);if(next.has(node.label))next.delete(node.label);else next.add(node.label);return next;})}>{expanded?'▾':'▸'}</button>:<span className="disclosure"/>}
  <button className="tree-object" title={node.label} onClick={()=>setSelected(node.label)}><ToolIcon name={node.icon}/><span>{node.label}</span></button><button className="visibility-command" aria-label={`${node.label} visibility`} title="Visibility · Preview command" onClick={()=>preview(`${node.label} visibility`)}><ToolIcon name="eye"/></button>
  </div>{expanded&&node.children?.map(child=>row(child,depth+1))}</div>;
 };
 return <section className="scene-tree dock-panel" aria-label="Scene tree"><div role="tablist" aria-label="Project panes" className="pane-tabs">{['Project outline','Model'].map(name=><button key={name} role="tab" aria-selected={tab===name} onClick={()=>setTab(name)}>{name}</button>)}</div><div className="tree-filter"><input aria-label="Filter project outline" type="text" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="tree-content">{nodes.map(node=>row(node,0))}</div></section>;
}
