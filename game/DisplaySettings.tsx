'use client';
import {useEffect,useState} from 'react';
import {playUiSfx} from './ui-sfx';
import {displaySettings,setDisplaySetting,type ShakeLevel} from './display-settings';

// Comfort options shared by the lobby Settings panel and the in-game pause menu.
export default function DisplaySettings(){
 const [values,setValues]=useState(displaySettings);
 useEffect(()=>{const refresh=()=>setValues({...displaySettings()});window.addEventListener('ruby-display',refresh);window.addEventListener('ruby-profile',refresh);return()=>{window.removeEventListener('ruby-display',refresh);window.removeEventListener('ruby-profile',refresh);};},[]);
 const option=(on:boolean)=>({flex:1,minHeight:30,padding:'0 6px',fontFamily:'var(--font-pixel)',fontSize:9,letterSpacing:'.04em',color:on?'#08131c':'#c9e2ec',background:on?'#87d8bf':'#0a1423',border:'1px solid '+(on?'#dcfff2':'#496277')});
 return <div className="rs-display-settings" style={{display:'grid',gap:12,width:'100%',textAlign:'left'}}>
  <div role="group" aria-label="Screen shake" style={{display:'grid',gap:10,padding:12,background:'#142137',border:'1px solid #354960',fontFamily:'var(--font-pixel)',fontSize:10,lineHeight:1.6,color:'#d9ebf4'}}>
   <span>SCREEN SHAKE</span>
   <div style={{display:'flex',gap:6}}>{(['off','low','full'] as ShakeLevel[]).map(level=><button key={level} type="button" aria-pressed={values.shake===level} style={option(values.shake===level)} onClick={()=>{playUiSfx('confirm');setDisplaySetting({shake:level});}}>{level.toUpperCase()}</button>)}</div>
  </div>
  <label style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:12,background:'#142137',border:'1px solid #354960',fontFamily:'var(--font-pixel)',fontSize:10,lineHeight:1.6,color:'#d9ebf4',cursor:'pointer'}}>
   <span>REDUCE FLASHING</span>
   <input type="checkbox" aria-label="Reduce flashing" checked={values.reduceFlashing} onChange={e=>{playUiSfx('confirm');setDisplaySetting({reduceFlashing:e.target.checked});}} style={{width:18,height:18,accentColor:'#87d8bf',cursor:'pointer'}}/>
  </label>
 </div>;
}
