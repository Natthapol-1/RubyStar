import { drawDevourerModel } from './devourer-model-art';
import { ENEMY_CONFIGS, SINGULARITY_CHALLENGE as SC, TILE_SIZE as S } from './constants';
import { devourerBodyScale, type GameState } from './engine';
import { SINGULARITY_LAND_TICKS, SINGULARITY_FALL_TICKS, SINGULARITY_FALL_HEIGHT } from './singularity-maw';

// Cosmetic fallout uses the boss's poison palette, stubby pufferfish spores and the Souls' stepped wisp silhouette.
function drawFallout(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,index:number,p:number,alpha:number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  if(index%4===0){
    const r=size*(1.8+p*1.6);ctx.globalAlpha=alpha*.16;ctx.fillStyle='#5ad86a';ctx.fillRect(-r,-r*.55,r*1.65,r*1.15);
    ctx.globalAlpha=alpha*.12;ctx.fillStyle='#7dff8a';ctx.fillRect(-r*.55,-r*.85,r*1.3,r*1.6);
    ctx.globalAlpha=alpha*.08;ctx.fillStyle='#b6ff9a';ctx.fillRect(-r*.22,-r*.45,r*.85,r*.8);
  }else if(index%4===1){
    ctx.globalAlpha=alpha*.85;ctx.fillStyle='#8fe8c4';ctx.fillRect(-size*.36,-size*.35,size*.72,size*.6);ctx.fillRect(-size*.24,-size*.55,size*.48,size*.3);
    ctx.fillStyle='#d8fff0';ctx.fillRect(-size*.26,-size*.3,size*.52,size*.65);ctx.fillRect(-size*.17,-size*.48,size*.34,size*.3);
    ctx.fillRect(-size*.24,size*.3,size*.16,size*.23);ctx.fillRect(size*.08,size*.3,size*.16,size*.15);
    ctx.fillStyle='#1c2a30';ctx.fillRect(-size*.18,-size*.17,size*.09,size*.13);ctx.fillRect(size*.09,-size*.17,size*.09,size*.13);
    ctx.fillStyle='#9dff8a';ctx.fillRect(-size*.08,size*.04,size*.16,size*.16);
  }else{
    ctx.rotate(index*.7+p*2);ctx.globalAlpha=alpha*.9;
    ctx.fillStyle='#50206a';ctx.fillRect(-size*.5,-size*.5,size,size);
    for(let k=0;k<4;k++){ctx.save();ctx.rotate(k*Math.PI/2);ctx.fillRect(size*.4,-size*.1,size*.35,size*.2);ctx.restore();}
    ctx.fillStyle='#7dff8a';ctx.fillRect(-size*.34,-size*.34,size*.68,size*.68);
    ctx.fillStyle='#285234';ctx.fillRect(-size*.17,-size*.17,size*.34,size*.34);
    ctx.fillStyle='#c6ff9a';ctx.fillRect(-size*.07,-size*.12,size*.14,size*.24);
  }
  ctx.restore();
}

// Exactly one full-sized body travels inward per slot; each arrival adds a brief swell.
export function drawSwarmConvergence(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,camX:number,camY:number) {
  const a=state.trial?.devourer?.convergence;if(!a)return;
  const C=SC.convergence,x=a.x-camX,y=a.y-camY,count=a.members.length;
  const sizeOf=(m:typeof a.members[number])=>{const e=state.enemies.find(e=>e.id===m.id);return m.size??Math.floor(S*ENEMY_CONFIGS.devourer.bodyFraction*(e?devourerBodyScale(e):1));};
  ctx.save();ctx.shadowBlur=0;
  if(a.stage!=='blast') {
    const duration=a.gatherTicks??Math.max(C.gatherTicks,count*C.bodyTicks),elapsed=a.stage==='charge'?duration:duration-a.ticks;
    const slot=duration/Math.max(1,count),arrived=Math.min(count,Math.floor(elapsed/slot));
    let swell=0;
    for(let i=Math.max(0,arrived-4);i<arrived;i++){const age=elapsed-(i+1)*slot;if(a.members[i].started&&age>=0&&age<14)swell+=Math.sin(age/14*Math.PI)*Math.exp(-age/18);}
    swell=Math.min(1.3,swell);
    const absorbed=a.members.slice(0,arrived).filter(m=>m.started).length;
    const radius=S*(.65+Math.sqrt(absorbed)*.25)*(1+swell*.12);
    // Waiting bodies use the normal renderer and simulation; this painter only owns the active intake.
    for(const [i,m] of a.members.entries()) {
      if(i!==arrived||!m.started||!state.enemies.some(e=>e.id===m.id&&e.hp>0))continue;
      const u=Math.max(0,Math.min(1,(elapsed-i*slot)/slot)),ease=u*u;
      const bx=m.x-camX+(x-(m.x-camX))*ease,by=m.y-camY+(y-(m.y-camY))*ease;
      const dx=x-(m.x-camX),dy=y-(m.y-camY),len=Math.hypot(dx,dy)||1;
      if(u>0){ctx.save();ctx.translate(Math.round(bx),Math.round(by));ctx.rotate(Math.atan2(dy,dx));
        for(let k=1;k<=4;k++){ctx.globalAlpha=(1-k/5)*u*.7;ctx.fillStyle=k%2?'#b07aff':'#d2ff9c';ctx.fillRect(-len*ease*.28*k/4,-(k%2?3:5),Math.max(8,len*ease*.22),k%2?6:10);}ctx.restore();}
      ctx.globalAlpha=1;drawDevourerModel(ctx,Math.round(bx),Math.round(by),sizeOf(m),false,u>.65);
    }
    ctx.strokeStyle='#8c52bb';ctx.lineWidth=3;
    for(let k=0;k<3;k++){const p=(elapsed/36+k/3)%1,r=radius+S*(2.5*(1-p)+.2);ctx.globalAlpha=Math.sin(p*Math.PI)*.4;ctx.strokeRect(Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));}
    if(absorbed>0){
      ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(1-swell*.025,1+swell*.04);ctx.globalAlpha=1;
      drawDevourerModel(ctx,0,0,radius*2,false,swell>.18,false,swell>.3);
      // Short luminous seams on the outer shell replace the zigzags across the face.
      ctx.globalAlpha=Math.min(.85,swell*.7);ctx.fillStyle='#d5ff9d';
      for(const side of [-1,1]){ctx.fillRect(side*radius*.83-2,-radius*.7,4,radius*.45);ctx.fillRect(side*radius*.67-radius*.12,radius*.8,radius*.24,4);}ctx.restore();
      const age=elapsed-arrived*slot,p=Math.min(1,age/14),r=radius+S*.8*p;
      ctx.globalAlpha=(1-p)*.55;ctx.strokeStyle='#caff9c';ctx.lineWidth=4*(1-p)+1;ctx.strokeRect(Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));
    }
  }else{
    const elapsed=C.blastTicks-a.ticks,p=elapsed/C.blastTicks,width=(state.map[0]?.length??51)*S,height=state.map.length*S;
    // Radius is measured to all four map corners, including from an off-centre explosion.
    const farthest=Math.max(...[[0,0],[width,0],[0,height],[width,height]].map(([bx,by])=>Math.hypot(bx-a.x,by-a.y))),extent=farthest/.7+S*3;
    if(p<.2){const r=S*(2+16*p);ctx.globalAlpha=(1-p/.2)*.95;ctx.fillStyle='#f2ffda';ctx.fillRect(x-r,y-r,r*2,r*2);}
    for(const [delay,color,line] of [[0,'#b6ff9a',28],[.06,'#9b66c9',18],[.14,'#5ad86a',12]] as const){
      const q=Math.max(0,(p-delay)/(1-delay));if(!q)continue;const r=S*1.5+extent*(1-(1-q)**2),fade=Math.min(1,(1-q)*5);
      ctx.globalAlpha=fade*.85;ctx.strokeStyle=color;ctx.lineWidth=line*fade+3;
      ctx.beginPath();for(const [i,[dx,dy]] of [[-.7,-1],[.7,-1],[.7,-.7],[1,-.7],[1,.7],[.7,.7],[.7,1],[-.7,1],[-.7,.7],[-1,.7],[-1,-.7],[-.7,-.7]].entries())i?ctx.lineTo(x+dx*r,y+dy*r):ctx.moveTo(x+dx*r,y+dy*r);ctx.closePath();
      if(delay===0){ctx.globalAlpha=fade*.055;ctx.fill();ctx.globalAlpha=fade*.9;}ctx.stroke();
    }
    // Poison spray, gas puffs, germs and soul wisps spread across the station instead of glass shards.
    for(let k=0;k<20;k++){
      const angle=k*Math.PI/10,d=extent*(1-(1-p)**2),length=S*(.4+1.2*(1-p));
      ctx.save();ctx.translate(Math.round(x+Math.cos(angle)*d),Math.round(y+Math.sin(angle)*d));ctx.rotate(angle);ctx.globalAlpha=(1-p)*.6;
      ctx.fillStyle='#50206a';ctx.fillRect(-length,-7,length*2,14);ctx.fillStyle='#7dff8a';ctx.fillRect(-length*.65,-3,length*1.3,6);ctx.fillRect(length-5,-5,10,10);ctx.restore();
    }
    for(let k=0;k<64;k++){const angle=k*2.399,d=farthest*(.15+(k%11)/12)*(1-(1-p)**3),sz=(k%3?18:28)*(1-p*.25);drawFallout(ctx,x+Math.cos(angle)*d,y+Math.sin(angle)*d-p*S*(k%3),sz,k,p,(1-p)**.7);}
    // Full-sized bodies fly out on the same timer as their real landing, without shrinking to dots.
    const travelTicks=SINGULARITY_LAND_TICKS-SINGULARITY_FALL_TICKS,u=Math.min(1,elapsed/travelTicks);
    if(u<1)for(const m of a.members){const bx=x+((m.tx+.5)*S-a.x)*u,by=y+((m.ty+.5)*S-a.y)*u-Math.sin(u*Math.PI)*S*SINGULARITY_FALL_HEIGHT;ctx.globalAlpha=1;drawDevourerModel(ctx,Math.round(bx),Math.round(by),sizeOf(m),false,true);}
  }
  ctx.restore();
}

/** Screen-space pressure burst, following Venus's shield-break convention: an offscreen source is held just outside the viewport. */
export function drawConvergenceScreen(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,w:number,h:number,camX:number,camY:number,zoom=1) {
  const a=state.trial?.devourer?.convergence;if(!a||a.stage!=='blast')return;
  const p=Math.max(0,Math.min(1,1-a.ticks/SC.convergence.blastTicks)),ease=1-(1-p)**2,fade=(1-p)**.75;
  const px=(a.x-camX)*zoom,py=(a.y-camY)*zoom,offscreen=px<0||px>w||py<0||py>h;
  const x=px<0?-32:px>w?w+32:px,y=py<0?-32:py>h?h+32:py;
  const reach=Math.hypot(w,h);
  ctx.save();ctx.shadowBlur=0;ctx.lineCap='square';
  if(p<.08){ctx.globalAlpha=(1-p/.08)*.16;ctx.fillStyle='#efffd5';ctx.fillRect(0,0,w,h);}
  // The core stays just offscreen and its blast spills into view from the correct direction.
  if(p<.28){const r=26+ease*100;ctx.globalAlpha=(1-p/.28)*.7;ctx.fillStyle='#cfff9c';ctx.fillRect(x-r,y-r,r*2,r*2);ctx.strokeStyle='#f2ffe0';ctx.lineWidth=6;ctx.strokeRect(x-r,y-r,r*2,r*2);}
  for(const [delay,color,width] of [[0,'#b6ff9a',15],[.07,'#a575d1',11],[.16,'#5ad86a',7]] as const){
    const q=Math.max(0,(p-delay)/(1-delay));if(q<=0)continue;const r=24+reach*(1-(1-q)**2)*.9;
    ctx.globalAlpha=fade*.8;ctx.strokeStyle=color;ctx.lineWidth=width*(1-p)+2;
    ctx.beginPath();for(const [i,[dx,dy]] of [[-.65,-1],[.65,-1],[.65,-.65],[1,-.65],[1,.65],[.65,.65],[.65,1],[-.65,1],[-.65,.65],[-1,.65],[-1,-.65],[-.65,-.65]].entries())i?ctx.lineTo(x+dx*r,y+dy*r):ctx.moveTo(x+dx*r,y+dy*r);ctx.closePath();ctx.stroke();
  }
  // Poison jets feed drifting gas puffs, germ-like spores and escaped soul fragments.
  for(let k=0;k<12;k++){
    const angle=k*Math.PI/6+.12,d=24+reach*.55*ease,len=14+reach*.065*(1-p);
    ctx.save();ctx.translate(x+Math.cos(angle)*d,y+Math.sin(angle)*d);ctx.rotate(angle);
    ctx.globalAlpha=fade*.55;ctx.fillStyle='#50206a';ctx.fillRect(-len,-7,len*2,14);
    ctx.fillStyle='#7dff8a';ctx.fillRect(-len*.6,-3,len*1.2,6);ctx.fillRect(len-5,-5,10,10);ctx.restore();
  }
  for(let k=0;k<36;k++){
    const angle=k*2.39996,d=28+reach*(.18+(k%5)*.1)*ease,sz=k%4===0?34:k%3?19:27;
    drawFallout(ctx,x+Math.cos(angle)*d,y+Math.sin(angle)*d-p*h*.07,sz,k,p,fade);
  }
  // Directional pressure along the nearest edge(s), like the shield-shatter frame but aimed at the explosion.
  if(offscreen){
    const thick=Math.round(3+Math.min(w,h)*.035*fade);ctx.globalAlpha=fade*.65;ctx.fillStyle='#bc91ed';
    if(px<0)ctx.fillRect(0,Math.max(0,y-h*.24),thick,h*.48);
    if(px>w)ctx.fillRect(w-thick,Math.max(0,y-h*.24),thick,h*.48);
    if(py<0)ctx.fillRect(Math.max(0,x-w*.24),0,w*.48,thick);
    if(py>h)ctx.fillRect(Math.max(0,x-w*.24),h-thick,w*.48,thick);
  }
  ctx.restore();
}
