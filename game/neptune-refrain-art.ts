import type { GameState } from './engine';
import { tracePrimalPressureFront } from './primal-impact-art';
import { NEPTUNE_MELODY_TAUNT_RADIUS, TILE_SIZE } from './constants';
import { NEPTUNE_REFRAIN, refrainWindow, type NeptuneRefrain } from './neptune-refrain';

/** Compact guardian-style bar; every square shares a single timing line. */
export function drawRefrainScore(ctx: CanvasRenderingContext2D, song: NeptuneRefrain, width: number, height: number, key='C') {
  ctx.save();ctx.clearRect(0,0,width,height);
  const left=key?65:8,span=width-left-8,mid=height/2,cursor=left+Math.min(1,song.tick/song.span)*span;
  const listen=song.stage==='listen',accent=listen?'#8ecbe8':'#f1d58b';
  ctx.font='bold 8px monospace';ctx.textAlign='left';ctx.fillStyle=accent;
  ctx.textBaseline='middle';if(key)ctx.fillText('MELODY',0,mid);
  ctx.fillStyle=listen?'#102b3b':'#2b2519';ctx.fillRect(left,mid-3,span,6);ctx.strokeStyle=listen?'#5084a0':'#a48e59';ctx.lineWidth=1;ctx.strokeRect(left+.5,mid-3.5,span-1,7);
  ctx.fillStyle=listen?'#488db0':'#c0a660';ctx.fillRect(left+1,mid-2,Math.max(0,cursor-left-1),4);
  for(let beat=0;beat<NEPTUNE_REFRAIN.beats;beat++){
    const x=left+(NEPTUNE_REFRAIN.lead+beat*NEPTUNE_REFRAIN.beat)/song.span*span;
    ctx.fillStyle=beat%4===0?'#96bdd0':'#416378';ctx.fillRect(Math.round(x),mid+5,1,beat%4===0?3:1);
  }
  for(const note of song.notes){
    const x=Math.round(left+note.at/song.span*span),active=(song.exampleLeadIn??0)<=0&&Math.abs(note.at-song.tick)<=refrainWindow(song,note);
    const hit=note.result==='hit',miss=note.result==='miss',lit=active||hit||(listen&&!!note.played);
    const rim=hit?'#ffe6a1':miss?'#e7808d':active?'#fff3ce':'#83c5e5';
    const face=hit?'#ad8b36':miss?'#8c415d':active?'#ad9456':lit?'#468fb1':'#24536b';
    ctx.fillStyle='#0b2235';ctx.fillRect(x-7,mid-7,14,14);
    ctx.fillStyle=rim;ctx.fillRect(x-6,mid-6,12,12);
    ctx.fillStyle=face;ctx.fillRect(x-4,mid-4,8,8);
    ctx.globalAlpha=.35;ctx.fillStyle=lit?'#efffff':rim;ctx.fillRect(x-3,mid-3,6,1);ctx.globalAlpha=1;


  }
  ctx.fillStyle='#f0fbff';ctx.fillRect(Math.round(cursor),mid-5,2,10);
  ctx.fillStyle='#f06b87';for(const at of song.mistakeMarks??[]){const x=Math.round(left+Math.max(0,Math.min(1,at/song.span))*span);ctx.fillRect(x-1,mid-9,3,18);}
  ctx.restore();
}

/** A scaled, quieter version of the trident explosion's pressure wave. */
export function drawNeptuneRefrainEffects(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number) {
  ctx.save();ctx.shadowBlur=0;ctx.lineJoin='miter';
  for(const pulse of state.neptune?.notePulses??[]){
    const p=Math.max(0,Math.min(1,1-pulse.ticks/36)),x=pulse.x-camX,y=pulse.y-camY;
    const color=pulse.good?'#4eb3d3':'#b36685',core=pulse.good?'#dffff5':'#ffe1eb',reach=pulse.boss?120:NEPTUNE_MELODY_TAUNT_RADIUS*TILE_SIZE-12;
    for(let echo=0;echo<3;echo++){
      const t=(p-echo*.14)/(1-echo*.14);if(t<0||t>=1)continue;
      const r=12+reach*(1-(1-t)*(1-t)),fade=Math.pow(1-t,1.35)*(echo?.32:1);
      tracePrimalPressureFront(ctx,x,y,r);
      ctx.globalAlpha=fade*.09;ctx.strokeStyle=color;ctx.lineWidth=echo?10:26;ctx.stroke();
      ctx.globalAlpha=fade*.4;ctx.lineWidth=echo?4:10;ctx.stroke();
      ctx.globalAlpha=fade*.8;ctx.strokeStyle=core;ctx.lineWidth=echo?1.5:3;ctx.stroke();
    }
    // Sparse long refractions travel with the leading front, matching the full explosion.
    const radius=12+reach*(1-(1-p)*(1-p)),fade=(1-p)*.65;
    // Larger pearl glints catch the light along the front, with staggered shimmer.
    for(let i=0;i<18;i++){
      const angle=i*2.39996+.3,travel=radius*(.72+i%4*.065);
      const shimmer=Math.pow(Math.max(0,Math.sin(p*Math.PI*3+i*1.7)),5)*(1-p);
      if(shimmer<.06)continue;
      const gx=Math.round(x+Math.cos(angle)*travel),gy=Math.round(y+Math.sin(angle)*travel),size=2.5+i%3*.75;
      ctx.globalAlpha=shimmer*.45;ctx.fillStyle=core;ctx.fillRect(gx-1,gy-size,2,size*2);ctx.fillRect(gx-size,gy-1,size*2,2);
      ctx.globalAlpha=shimmer*.13;ctx.fillStyle=color;ctx.fillRect(gx-3,gy-3,6,6);
      ctx.globalAlpha=shimmer*.5;ctx.fillStyle='#ffffff';ctx.fillRect(gx-1,gy-1,3,3);
    }
    for(let i=0;i<(pulse.boss?5:10);i++){
      const angle=i*2.39996+.4,d=radius*(.5+i%5*.09),lift=Math.sin(p*Math.PI)*(6+i%3*5),size=4+i%3*1.5;
      ctx.save();ctx.translate(Math.round(x+Math.cos(angle)*d),Math.round(y+Math.sin(angle)*d-lift));ctx.rotate(angle+.5-p*.35);
      ctx.globalAlpha=Math.pow(1-p,1.1)*.3;ctx.fillStyle=color;ctx.fillRect(-size/2,-size*.7,size,size*1.4);
      ctx.fillStyle=core;ctx.fillRect(-size/2,-size*.7,size,3);ctx.globalAlpha*=.8;ctx.fillRect(-1,-size*.3,2,size*.65);
      ctx.restore();
    }
    for(let i=0;i<10;i++){
      const angle=i*Math.PI/5+.12,travel=radius*(.89+i%3*.035);
      ctx.save();ctx.translate(Math.round(x+Math.cos(angle)*travel),Math.round(y+Math.sin(angle)*travel));ctx.rotate(angle);
      const length=10+i%3*5;ctx.globalAlpha=fade*.5;ctx.fillStyle=color;ctx.fillRect(-length/2,-2,length,4);
      ctx.globalAlpha=fade*.75;ctx.fillStyle=core;ctx.fillRect(-length/2,-1,length*.55,2);ctx.restore();
    }
  }ctx.restore();
}

/** Large faceted water crests frame the view, keeping the center clear for combat. */
export function drawNeptuneRhythmOverlay(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,w:number,h:number){
  const event=state.neptune?.rhythmOverlay;if(!event)return;
  const total=event.kind==='miss'?30:180,p=Math.max(0,1-event.ticks/total),grow=Math.min(1,p*6);
  const a=grow*Math.pow(1-p,1.3),miss=event.kind==='miss';
  const light=miss?'#ff9eb9':event.kind==='perfect'?'#a9ffe1':'#91e8ff';
  const mid=miss?'#984b76':'#2b85ad';
  const size=Math.min(w,h)*(miss?.15:.28);
  ctx.save();ctx.shadowBlur=0;
  if(!miss){
    // A clear water pressure front opens the completed phrase, then hands off to the edge crests.
    const span=Math.hypot(w,h)*.63;
    for(let echo=0;echo<2;echo++){
      const travel=(p-echo*.075)/.55;if(travel<=0||travel>=1)continue;
      const radius=24+span*(1-Math.pow(1-travel,1.4)),wave=Math.sin(Math.PI*travel)*(echo===0?.65:echo===1?.3:.16);
      tracePrimalPressureFront(ctx,w/2,h/2,radius);
      ctx.globalAlpha=wave*.09;ctx.strokeStyle=light;ctx.lineWidth=32;ctx.stroke();
      ctx.globalAlpha=wave*.35;ctx.lineWidth=9;ctx.stroke();
      ctx.globalAlpha=wave*.8;ctx.strokeStyle='#eafff8';ctx.lineWidth=2;ctx.stroke();
    }
    ctx.globalAlpha=Math.max(0,1-p/.1)*.11;ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
  }
  const rim=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.33,w/2,h/2,Math.max(w,h)*.64);
  rim.addColorStop(0,'#00000000');rim.addColorStop(1,light);ctx.globalAlpha=a*(miss?.17:.28);ctx.fillStyle=rim;ctx.fillRect(0,0,w,h);
  for(let corner=0;corner<4;corner++){
    ctx.save();ctx.translate(corner%2?w:0,corner>=2?h:0);ctx.scale(corner%2?-1:1,corner>=2?-1:1);
    // Flat translucent tidal sheets with luminous foam contours, without shaded faces.
    for(let layer=0;layer<3;layer++){
      const r=size*(1-layer*.24)*(.55+.45*grow),drift=p*18;
      const pts=[[0,0],[r*1.65,0],[r*1.65,r*.12],[r*1.1,r*.12],[r*1.1,r*.28],[r*.78,r*.28],[r*.78,r*.52],[r*.48,r*.52],[r*.48,r*.9],[r*.22,r*.9],[r*.22,r*1.5],[0,r*1.5]];
      ctx.translate(layer?drift*.12:0,layer?drift*.12:0);ctx.globalAlpha=a*.24;ctx.fillStyle=mid;
      ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
      ctx.globalAlpha=a*(.6+layer*.18);ctx.strokeStyle=light;ctx.shadowColor=light;ctx.shadowBlur=layer===2?5:0;ctx.lineWidth=layer===2?3:2;ctx.beginPath();pts.slice(1,-1).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.shadowBlur=0;
      // Refracted long rectangular strings and floating foam shards.
      for(let j=0;j<4;j++){
        const xx=r*(.18+j*.19),yy=r*(.6-j*.13);
        ctx.globalAlpha=a*.22;ctx.fillStyle=light;ctx.fillRect(xx,0,2,yy);
        ctx.globalAlpha=a*.9;ctx.fillStyle='#edffff';ctx.fillRect(xx-1,yy-3,4,6);
        ctx.globalAlpha=a*.26;ctx.fillStyle=light;ctx.fillRect(xx-4,yy-12,10,25);
      }
    }
    for(let j=0;j<7;j++){
      const xx=size*(.2+(j%4)*.4)+p*20,yy=size*(.3+((j*3)%7)*.19)-p*22;
      const glint=Math.max(0,Math.sin(p*9+j*2.1));ctx.globalAlpha=a*glint*.85;ctx.fillStyle=light;
      ctx.fillRect(xx-4,yy,10,2);ctx.fillRect(xx,yy-4,2,10);ctx.fillStyle='#f0ffff';ctx.fillRect(xx,yy,2,2);
    }ctx.restore();
  }
  if(!miss){
    // Broad, translucent water reflections gather at the sides during the afterglow.
    for(let side=0;side<2;side++)for(let i=0;i<3;i++){
      const xx=side?w-24-i*25:12+i*25,yy=h*(.12+i*.2)-p*35;
      ctx.globalAlpha=a*.07;ctx.fillStyle=light;ctx.fillRect(xx,yy,10+i*3,h*(.32-i*.035));
      ctx.globalAlpha=a*.35;ctx.fillStyle='#e8fff8';ctx.fillRect(xx,yy,1,h*(.32-i*.035));
    }
    // Long pearl refractions rise along the sides as the completed phrase rings out.
    for(let i=0;i<24;i++){
      const side=i%2,xx=side?w-18-(i%5)*22:18+(i%5)*22,yy=h*(.12+((i*7)%17)/22)-p*70;
      const shimmer=Math.max(0,Math.sin(p*10+i*1.7));ctx.globalAlpha=a*shimmer*.6;ctx.fillStyle=light;ctx.fillRect(xx-1,yy-15,3,32);
      ctx.globalAlpha=a*shimmer*.9;ctx.fillStyle='#edffff';ctx.fillRect(xx-3,yy-2,7,4);
    }
  }
  // Travelling edge crests connect the corners without filling the middle.
  for(let side=0;side<4;side++){
    ctx.save();ctx.translate(side===1?w:side===3?0:w/2,side===0?0:side===2?h:h/2);ctx.rotate(side*Math.PI/2);
    const length=side%2?h:w;
    for(let i=0;i<9;i++){
      const x=(i/9-.5)*length,depth=Math.round(size*.28*(.65+.3*Math.sin(i*1.8+side)+p));
      ctx.globalAlpha=a*.1;ctx.fillStyle=mid;ctx.fillRect(x,0,length/9-9,depth);
      ctx.globalAlpha=a*.45;ctx.fillStyle=light;ctx.fillRect(x+6,depth-2,length/9-21,2);
    }ctx.restore();
  }ctx.restore();
}
