'use client';
import {useEffect,useState} from 'react';
import {flushProfile,isDesktop,loadProfile,loadWebSettings,saveError} from './profile';
export default function DesktopProvider({children}:{children:React.ReactNode}){
 const [ready,setReady]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{
   const refresh=()=>setError(saveError());window.addEventListener('ruby-profile',refresh);
   if(!isDesktop()){loadWebSettings();setReady(true);return ()=>window.removeEventListener('ruby-profile',refresh);}
   void loadProfile().then(()=>{refresh();setReady(true);});
   const off=window.rubyDesktop!.onClosing(()=>{window.dispatchEvent(new Event('ruby-save-run'));void flushProfile().then(saved=>window.rubyDesktop!.closeReady(saved));});
   const key=(e:KeyboardEvent)=>{if(e.key==='F11'||(e.altKey&&e.key==='Enter')){e.preventDefault();void window.rubyDesktop!.fullscreen();}};
   window.addEventListener('keydown',key);
   return ()=>{off();window.removeEventListener('ruby-profile',refresh);window.removeEventListener('keydown',key);};
 },[]);
 return <>{ready?children:<LoadingScreen/>}{error&&<div role="alert" style={{position:'fixed',bottom:8,left:8,zIndex:1000,padding:12,maxWidth:500,background:'#21121e',border:'1px solid #ff6f9f',color:'#ffe1ed'}}>{error}</div>}</>;
}

/** Shown while the desktop profile loads: Ruby's blocky gem, the pixel title and three stepping square pips. */
function LoadingScreen(){
 return <main className="rs-loading" role="status" aria-label="Ruby Star loading">
  <style>{`
   .rs-loading{position:fixed;inset:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:#07080f;
     background-image:radial-gradient(1px 1px at 20% 30%,#ffffff55,transparent),radial-gradient(1px 1px at 70% 60%,#ffffff44,transparent),radial-gradient(1px 1px at 45% 80%,#ffffff33,transparent);background-size:97px 89px,151px 137px,123px 113px}
   /* The in-game Ruby (drawRubyGem) at 5/3 scale: rose rim, dark inner square, glowing pink compass star, pale centre and a small top-left highlight. */
   .rs-loading-gem{position:relative;width:36px;height:36px;margin:12px;transform:scale(1.6667);background:#ff1155;box-shadow:0 0 4px #ff1155;animation:rs-load-glow 1.6s steps(4) infinite}
   .rs-loading-gem>span{position:absolute;display:block}
   .rs-lg-inner{left:4px;top:4px;width:28px;height:28px;background:#780d30}
   .rs-lg-star{inset:0;filter:drop-shadow(0 0 2px #ff6e99)}
   .rs-lg-star>span{position:absolute;background:#ff88aa}
   .rs-lg-core{left:16px;top:16px;width:4px;height:4px;background:#ffe6eb}
   .rs-lg-hi{left:6px;top:6px;width:3px;height:3px;background:#ffb6ca}
   .rs-loading-title{margin:0;font-family:var(--font-pixel);font-size:1.6rem;letter-spacing:.12em;color:#ff6f9f;text-shadow:0 0 18px #ff2f6f88,4px 4px 0 #3a0f22}
   .rs-loading-pips{display:flex;gap:10px}
   .rs-loading-pips span{width:10px;height:10px;background:#ff6f9f;box-shadow:0 0 4px #ff2f6f;opacity:.2;animation:rs-load-pip 1.2s steps(1) infinite}
   .rs-loading-pips span:nth-child(2){animation-delay:.4s}.rs-loading-pips span:nth-child(3){animation-delay:.8s}
   @keyframes rs-load-glow{50%{box-shadow:0 0 9px #ff1155}}
   @keyframes rs-load-pip{0%{opacity:1}33%{opacity:.2}}
   @media (prefers-reduced-motion:reduce){.rs-loading-gem,.rs-loading-pips span{animation:none}.rs-loading-pips span{opacity:.6}}
  `}</style>
  <div className="rs-loading-gem" aria-hidden="true"><span className="rs-lg-inner"/><span className="rs-lg-star"><span style={{left:16,top:8,width:4,height:20}}/><span style={{left:8,top:16,width:20,height:4}}/><span style={{left:14,top:14,width:8,height:8}}/>{[[11,11],[23,11],[11,23],[23,23]].map(([x,y])=><span key={x+'-'+y} style={{left:x,top:y,width:2,height:2}}/>)}</span><span className="rs-lg-core"/><span className="rs-lg-hi"/></div>
  <h1 className="rs-loading-title">RUBY STAR</h1>
  <div className="rs-loading-pips" aria-hidden="true"><span/><span/><span/></div>
 </main>;
}
