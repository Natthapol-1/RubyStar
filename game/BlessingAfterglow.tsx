'use client';
import BlessingGem from './BlessingGem';
import {useEffect,useRef,useState} from 'react';
import {BLESSING_REVEAL_TICKS,CELESTIAL_BLESSINGS,type CelestialBlessing} from './endless-builds';
export default function BlessingAfterglow({kind,ticks,readTicks}:{kind:CelestialBlessing;ticks:number;readTicks?:()=>number}){
 const [frameTicks,setFrameTicks]=useState(ticks),reader=useRef(readTicks);reader.current=readTicks;
 // Read the live simulation on each paint; the surrounding HUD only updates at 10 Hz.
 useEffect(()=>{if(!reader.current)return;let raf=0,last=-1,changedAt=0;
  const paint=(now:number)=>{const current=reader.current?.()??0;if(current!==last){last=current;changedAt=now;}
   setFrameTicks(Math.max(0,current-Math.min(1,(now-changedAt)*.06)));raf=requestAnimationFrame(paint);};
  raf=requestAnimationFrame(paint);return()=>cancelAnimationFrame(raf);
 },[kind]);
 const remaining=readTicks?frameTicks:ticks;
 const age=Math.max(0,Math.min(1,1-remaining/BLESSING_REVEAL_TICKS)),fade=Math.max(0,Math.min(age*16,remaining/24)),gem=CELESTIAL_BLESSINGS[kind],color=gem.color;
 const burst=Math.pow(1-age,2),reveal=Math.min(1,age*6);
 return <div aria-hidden="true" data-blessing-afterglow={kind} style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%, -50%)',width:'min(360px, 64vw, 64vh)',aspectRatio:'1',pointerEvents:'none',userSelect:'none',zIndex:8,opacity:fade,color}}>
  <svg viewBox="0 0 320 320" width="100%" height="100%" style={{position:'absolute',inset:0,overflow:'visible'}}>
   {[0,1,2,3].map(i=>{const angle=i*Math.PI/2,r=72+age*70;return <g key={i} transform={`translate(160 146) rotate(${i*90})`} opacity={burst*.7} fill={i%2?color:'#fff0da'}><rect x={r} y="-5" width="16" height="10"/><rect x={r+5} y="-10" width="6" height="20"/></g>;})}
   {Array.from({length:8},(_,i)=>{const angle=i*Math.PI/4+Math.PI/8,r=68+reveal*36+age*46,x=160+Math.cos(angle)*r,y=146+Math.sin(angle)*r;return <g key={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} opacity={burst*.8} fill={color}><rect x="-4" y="-4" width="8" height="8"/><rect x="-2" y="-2" width="4" height="4" fill="#fff4df"/></g>;})}
   {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx,dy],i)=>{const r=61+age*38,x=160+dx*r,y=146+dy*r;return <g key={i} opacity={burst*.45} fill={color}><rect x={x-(dx<0?0:18)} y={y} width="18" height="5"/><rect x={x} y={y-(dy<0?0:18)} width="5" height="18"/></g>;})}

  </svg>
  <div style={{position:'absolute',left:'26%',top:'22%',width:'48%',transform:`translateY(${-reveal*5}px) scale(${.72+reveal*.28})`,opacity:.85,filter:`drop-shadow(0 0 ${2+burst*3}px ${color})`}}><BlessingGem kind={kind}/></div>
  <div style={{position:'absolute',top:'72%',width:'100%',textAlign:'center',fontFamily:'var(--font-pixel)',fontSize:'clamp(8px, 1vw, 10px)',lineHeight:2,textShadow:'0 2px 4px #050812',opacity:.95}}><div style={{fontSize:'0.7em',letterSpacing:2,color:'#f5edda'}}>CELESTIAL BLESSING</div>{gem.name.toUpperCase()}</div>
 </div>;
}
