'use client';
import {useEffect,useRef} from 'react';
import EnemyPortrait from './EnemyPortrait';
import {drawNeptuneShark} from './neptune-art';
import type {CelestialEnemyEntry} from './celestial-enemy-data';

function SharkPortrait(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const ctx=ref.current?.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,96,96);ctx.save();ctx.translate(48,52);ctx.scale(.9,.9);drawNeptuneShark(ctx,0,0);ctx.restore();},[]);
 return <canvas ref={ref} width={96} height={96} aria-label="Shark" style={{width:88,height:88,objectFit:'contain'}}/>;
}
export default function CelestialEnemyPortrait({entry}:{entry:CelestialEnemyEntry}){
 return entry.portrait==='shark'?<SharkPortrait/>:entry.type?<EnemyPortrait type={entry.type} variant={entry.variant}/>:null;
}
