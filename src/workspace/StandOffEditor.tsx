import {useEffect,useRef,useState} from 'react';
/** Only the draft is local; App owns the committed scanner distance. */
export function StandOffEditor({value,onApply,onClose}:{value:string;onApply:(value:string)=>void;onClose:()=>void}) {
 const [draft,setDraft]=useState(value),dialog=useRef<HTMLDialogElement>(null);
 const valid=draft.trim()!==''&&Number.isFinite(Number(draft))&&Number(draft)>=50&&Number(draft)<=500;
 useEffect(()=>{const trigger=document.activeElement as HTMLElement;dialog.current?.showModal();return()=>{dialog.current?.close();trigger?.focus();};},[]);
 return <dialog ref={dialog} aria-label="Set stand-off" onCancel={e=>{e.preventDefault();onClose();}}><form onSubmit={e=>{e.preventDefault();if(valid){onApply(draft);onClose();}}}>
 <h2>Set stand-off</h2><label className="distance-editor">Stand-off <input aria-label="Stand-off" type="number" min="50" max="500" step="any" value={draft} onChange={e=>setDraft(e.target.value)}/> mm</label><p>Allowed range: 50–500 mm</p><div className="dialog-actions"><button type="submit" disabled={!valid}>Apply</button><button type="button" onClick={onClose}>Cancel</button></div>
 </form></dialog>;
}
