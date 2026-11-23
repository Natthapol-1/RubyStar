'use client';
import { useEffect, useRef } from 'react';
import type { GameState } from './engine';
import { refrainAnswerLeft } from './neptune-refrain';
import { drawRefrainScore } from './neptune-refrain-art';

export default function NeptuneRefrainBar({state}:{state:GameState}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    let frame=0;
    const paint=()=>{
      const canvas=ref.current,ctx=canvas?.getContext('2d'),n=state.neptune;
      if(canvas&&ctx&&n){
        const width=canvas.clientWidth||320,height=canvas.clientHeight||16,ratio=window.devicePixelRatio||1;
        if(canvas.width!==Math.round(width*ratio)||canvas.height!==Math.round(height*ratio)){canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);}
        ctx.setTransform(ratio,0,0,ratio,0,0);
        if(n.refrain)drawRefrainScore(ctx,n.refrain,width,height,'');
        else ctx.clearRect(0,0,width,height);
      }
      frame=requestAnimationFrame(paint);
    };paint();return()=>cancelAnimationFrame(frame);
  },[state]);
  const song=state.neptune?.refrain;
  return <div role="img" aria-label={song?`Ocean’s Melody: ${song.stage==='listen'?'listen':'your turn'}, ${song.notes.filter(n=>n.result==='hit').length} of ${song.notes.length} notes hit`:'Ocean’s Melody'} style={{display:'flex',alignItems:'center',gap:4,marginTop:4}}>
    <span className="rs-guardian-name" style={{fontSize:8,color:song?.stage==='listen'?'#8ecbe8':'#f1d58b',whiteSpace:'nowrap',marginBottom:0,transform:'translateY(1px)',height:16,display:'flex',alignItems:'center'}}>MELODY</span>
    <canvas ref={ref} width={250} height={16} aria-hidden="true" style={{display:'block',flex:1,minWidth:0,width:0,height:16}}/>
    {song?.stage==='answer'&&<span className="rs-guardian-name" style={{fontSize:8,color:'#f1d58b',minWidth:20,textAlign:'right',marginBottom:0,transform:'translateY(1px)',height:16,display:'flex',alignItems:'center',justifyContent:'flex-end'}}>{Math.ceil(refrainAnswerLeft(song)/60)}s</span>}
  </div>;
}
