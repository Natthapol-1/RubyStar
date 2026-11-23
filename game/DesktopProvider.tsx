'use client';
import {useEffect,useState} from 'react';
import LoadingScreen from './LoadingScreen';
import NavigationProvider from './NavigationProvider';
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
   // Unexpected errors go to a local log (logs/errors.log in the save folder) that players can attach to bug reports.
   let logged=0;const log=(text:string)=>{if(logged++<50)window.rubyDesktop!.logError?.(location.pathname+' '+text);};
   const onError=(e:ErrorEvent)=>log(String(e.error?.stack??e.message));
   const onRejection=(e:PromiseRejectionEvent)=>log('Unhandled rejection: '+String((e.reason as Error)?.stack??e.reason));
   window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onRejection);
   return ()=>{off();window.removeEventListener('ruby-profile',refresh);window.removeEventListener('keydown',key);window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onRejection);};
 },[]);
 return <>{ready?<NavigationProvider>{children}</NavigationProvider>:<LoadingScreen/>}{error&&<div role="alert" style={{position:'fixed',bottom:8,left:8,zIndex:1000,padding:12,maxWidth:500,background:'#21121e',border:'1px solid #ff6f9f',color:'#ffe1ed'}}>{error}</div>}</>;
}
