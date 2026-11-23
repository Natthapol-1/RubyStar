'use client';
import {playUiSfx} from './ui-sfx';
import ControlSettings from './ControlSettings';
import MenuButton from './MenuButton';
import AudioSliders from './AudioSliders';
import DisplaySettings from './DisplaySettings';
import Credits from './Credits';
import {APP_VERSION} from './app-version';
import {useEffect,useRef,useState} from 'react';
import {getProfile,isDesktop,setAudioPreference} from './profile';
export default function GameSettings({onClose}:{onClose:()=>void}){
 const [controlsOpen,setControlsOpen]=useState(false);const [creditsOpen,setCreditsOpen]=useState(false);const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;root.current?.querySelector('button')?.focus();return()=>previous?.focus();},[]);
 const fullscreen=()=>{if(isDesktop())void window.rubyDesktop!.fullscreen();else if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>{});};
 return <>{controlsOpen&&<ControlSettings onClose={()=>setControlsOpen(false)}/>}{creditsOpen&&<Credits onClose={()=>setCreditsOpen(false)}/>}<div role="dialog" aria-modal="true" aria-label="Settings" onClick={e=>{if(e.target===e.currentTarget){playUiSfx('back');onClose();}}} ref={root} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')onClose();if(e.key==='Tab'){const controls=root.current?.querySelectorAll<HTMLElement>('button,input');if(!controls?.length)return;const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}} style={{position:'fixed',inset:0,zIndex:500,background:'#050914e8',display:'grid',placeItems:'center',padding:24}}>
  <section style={{width:'min(440px,100%)',background:'#101a2b',border:'2px solid #8eb7c9',padding:24,color:'#dfedf4',boxShadow:'0 0 24px #80bfd522'}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:24}}><h2 style={{fontFamily:'var(--font-pixel)',fontSize:17,color:'#b3dfeb'}}>SETTINGS</h2><MenuButton className="btn rs-panel-btn" sound="back" onClick={onClose}>CLOSE</MenuButton></div>
   <div style={{margin:'24px 0',display:'grid',gap:12}}><AudioSliders/><DisplaySettings/></div>
   <MenuButton className="btn rs-panel-btn" sound="page" style={{width:"100%",marginBottom:14}} onClick={()=>setControlsOpen(true)}>CONTROLS</MenuButton>
   <MenuButton className="btn rs-panel-btn" style={{width:'100%',marginBottom:14}} onClick={fullscreen}>FULLSCREEN / WINDOW</MenuButton>
   {isDesktop()&&<MenuButton className="btn rs-panel-btn" style={{width:'100%',marginBottom:14}} title="Saves and the error log (logs/errors.log) live here" onClick={()=>void window.rubyDesktop?.openDataFolder?.()}>OPEN SAVE & LOG FOLDER</MenuButton>}
   <MenuButton className="btn rs-panel-btn" sound="page" style={{width:'100%'}} onClick={()=>setCreditsOpen(true)}>CREDITS</MenuButton>
   <p style={{marginTop:16,fontFamily:'var(--font-pixel)',fontSize:9,color:'#7f98a8',textAlign:'right'}}>VERSION {APP_VERSION}</p>
  </section>
 </div></>;
}
