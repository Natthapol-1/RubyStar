'use client';
import {useEffect,useState} from 'react';
import MenuButton from './MenuButton';
import {bindings,CONTROL_LABELS,DEFAULT_BINDINGS,keyLabel,setBinding,resetBindings,type ControlAction} from './controls';
import {playUiSfx} from './ui-sfx';
export default function ControlSettings({onClose}:{onClose:()=>void}){
 const [selected,setSelected]=useState<{action:ControlAction;slot:number}|null>(null),[error,setError]=useState(''),[,refresh]=useState(0);
 useEffect(()=>{if(!selected)return;const accept=(code:string|null)=>{const result=setBinding(selected.action,selected.slot,code);setError(result??'');if(!result){playUiSfx('confirm');setSelected(null);refresh(n=>n+1);}else playUiSfx('locked');};
 const key=(e:KeyboardEvent)=>{e.preventDefault();e.stopPropagation();if(e.key==='Escape'){setSelected(null);setError('');return;}if(e.repeat)return;accept(e.key==='Delete'||e.key==='Backspace'?null:e.code);};
 const mouse=(e:MouseEvent)=>{e.preventDefault();e.stopPropagation();accept('Mouse'+e.button);};window.addEventListener('keydown',key,true);window.addEventListener('mousedown',mouse,true);return()=>{window.removeEventListener('keydown',key,true);window.removeEventListener('mousedown',mouse,true);};},[selected]);
 const current=bindings();
 return <div role="dialog" aria-modal="true" aria-label="Controls" onClick={e=>{if(e.target===e.currentTarget&&!selected){playUiSfx('back');onClose();}}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'&&!selected)onClose();}} onContextMenu={e=>e.preventDefault()} style={{position:'fixed',inset:0,zIndex:650,background:'#050914f2',padding:24,display:'grid',placeItems:'center'}}>
 <section style={{width:'min(700px,100%)',maxHeight:'calc(100dvh - 48px)',overflowY:'auto',padding:24,boxSizing:'border-box',background:'#101a2b',border:'2px solid #88b8c7',color:'#dcecf4',fontFamily:'var(--font-pixel)',fontSize:10,lineHeight:1.6}}>
 <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'center'}}><h2 style={{fontSize:15}}>CONTROLS</h2><MenuButton className="btn" sound="back" onClick={onClose}>CLOSE</MenuButton></div>
 <p style={{fontFamily:'var(--font-mono)',fontSize:14,color:'#a5b9cd'}}>{selected?'Press a key or mouse button. Delete clears. Escape cancels.':'Choose a binding to change it. Escape, F3 and F11 stay reserved.'}</p>
 {error&&<p role="alert" style={{color:'#ffacaf',fontSize:9}}>{error}</p>}
 <div style={{display:'grid',gap:8}}>{(Object.keys(DEFAULT_BINDINGS) as ControlAction[]).map(action=><div key={action} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,alignItems:'center',padding:10,border:'1px solid #30465d',background:'#142137'}}><span>{CONTROL_LABELS[action]}</span>{[0,1].map(slot=><MenuButton key={slot} className="btn" style={{fontSize:9,padding:'8px 5px',background:selected?.action===action&&selected.slot===slot?'#2e5360':'#1a2c43',border:'1px solid #638b9d',minHeight:36,color:'#dfedf3'}} onClick={()=>{setError('');setSelected({action,slot});}}>{selected?.action===action&&selected.slot===slot?'PRESS INPUT':current[action][slot]?keyLabel(current[action][slot]):'ADD KEY'}</MenuButton>)}</div>)}</div>
 <MenuButton className="btn" sound="back" style={{marginTop:16,width:'100%'}} onClick={()=>{resetBindings();setSelected(null);setError('');refresh(n=>n+1);}}>RESET TO DEFAULTS</MenuButton>
 </section></div>;
}
