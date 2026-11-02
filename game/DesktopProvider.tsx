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
 return <>{ready?children:<main style={{background:'#07080f',color:'#ff6f9f',height:'100vh',display:'grid',placeItems:'center'}}>RUBY STAR · LOADING</main>}{error&&<div role="alert" style={{position:'fixed',bottom:8,left:8,zIndex:1000,padding:12,maxWidth:500,background:'#21121e',border:'1px solid #ff6f9f',color:'#ffe1ed'}}>{error}</div>}</>;
}
