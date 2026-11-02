'use client';
import {useEffect,useState} from 'react';
import {getProfile,setAudioPreference} from './profile';
export default function AudioSliders(){
 const [values,setValues]=useState({...getProfile().settings});
 useEffect(()=>{const refresh=()=>setValues({...getProfile().settings});window.addEventListener('ruby-audio',refresh);return()=>window.removeEventListener('ruby-audio',refresh);},[]);
 return <div className="rs-audio-settings">
  <style>{`
   .rs-audio-settings{display:grid;gap:12px;width:100%;text-align:left}
   .rs-audio-setting{display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px;background:#142137;border:1px solid #354960;box-sizing:border-box;font-family:var(--font-pixel);font-size:10px;line-height:1.6;color:#d9ebf4}
   .rs-audio-percent{color:#9bd3c4;font-size:9px}
   .rs-audio-range{grid-column:1/-1;appearance:none;-webkit-appearance:none;width:100%;height:8px;margin:4px 0;border:1px solid #496277;border-radius:0;cursor:pointer;box-sizing:border-box}
   .rs-audio-range::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:16px;height:18px;border:2px solid #dcfff2;border-radius:0;background:#87d8bf;box-shadow:0 0 5px #85e6c555}
   .rs-audio-range::-moz-range-thumb{width:12px;height:14px;border:2px solid #dcfff2;border-radius:0;background:#87d8bf}
   .rs-audio-range:focus-visible{outline:2px solid #c8f7eb;outline-offset:5px}
  `}</style>
  {(['music','attack','effects'] as const).map(channel=><label key={channel} className="rs-audio-setting"><span>{channel==='music'?'BGM':channel==='attack'?'ATTACK SFX':'OTHER GAME SFX'}</span><span className="rs-audio-percent">{Math.round(values[channel]*100)}%</span><input className="rs-audio-range" aria-label={channel+' volume'} type="range" min="0" max="1" step="0.05" value={values[channel]} style={{background:`linear-gradient(to right,#75b8aa ${values[channel]*100}%,#0a1423 ${values[channel]*100}%)`}} onChange={e=>setAudioPreference(channel,Number(e.target.value))}/></label>)}
 </div>;
}
