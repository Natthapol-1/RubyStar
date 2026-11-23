'use client';
import MenuButton from './MenuButton';
import {markPhotosensitivitySeen,setDisplaySetting} from './display-settings';

// Shown once, before anything else plays on first launch.
export default function PhotosensitivityNotice({onDone}:{onDone:()=>void}){
 const finish=(comfort:boolean)=>{if(comfort)setDisplaySetting({reduceFlashing:true,shake:'low'});markPhotosensitivitySeen();onDone();};
 return <div role="dialog" aria-modal="true" aria-labelledby="rs-photo-title" onKeyDown={e=>e.stopPropagation()} style={{position:'fixed',inset:0,zIndex:900,background:'#04060d',display:'grid',placeItems:'center',padding:24}}>
  <section style={{width:'min(560px,100%)',background:'#101a2b',border:'2px solid #ffcf6e',padding:28,color:'#e4eef4',boxShadow:'0 0 24px #ffcf6e22',display:'grid',gap:18}}>
   <h2 id="rs-photo-title" style={{fontFamily:'var(--font-pixel)',fontSize:15,lineHeight:1.6,color:'#ffcf6e'}}>PHOTOSENSITIVITY WARNING</h2>
   <p style={{fontFamily:'var(--font-mono)',fontSize:17,lineHeight:1.5}}>Ruby Star contains flashing lights, bright full-screen effects and screen shake. These may trigger seizures in people with photosensitive epilepsy, even without a history of seizures.</p>
   <p style={{fontFamily:'var(--font-mono)',fontSize:17,lineHeight:1.5}}>If you feel dizzy, notice blurred vision, eye or muscle twitches, or any loss of awareness, stop playing and consult a doctor.</p>
   <p style={{fontFamily:'var(--font-mono)',fontSize:15,lineHeight:1.5,color:'#a9c4d2'}}>You can change Reduce Flashing and Screen Shake at any time in Settings.</p>
   <div style={{display:'grid',gap:10}}>
    <MenuButton autoFocus className="btn rs-panel-btn" sound="confirm" style={{width:'100%'}} onClick={()=>finish(false)}>CONTINUE</MenuButton>
    <MenuButton className="btn rs-panel-btn" sound="confirm" style={{width:'100%'}} onClick={()=>finish(true)}>CONTINUE WITH REDUCED FLASHING & SHAKE</MenuButton>
   </div>
  </section>
 </div>;
}
