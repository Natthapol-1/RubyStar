import { drawDevourerModel } from './devourer-model-art';
import { ENEMY_CONFIGS, SINGULARITY_CHALLENGE as SC, TILE_SIZE as S } from './constants';
import { devourerBodyScale, type GameState } from './engine';
import { SINGULARITY_LAND_TICKS, SINGULARITY_FALL_TICKS, SINGULARITY_FALL_HEIGHT, convergenceWaveRadius, convergenceGatherTicks } from './singularity-maw';

type BurstView={left:number;top:number;right:number;bottom:number};
function burstView(ctx:CanvasRenderingContext2D):BurstView{
  const m=ctx.getTransform();
  if(m.b||m.c||m.a<=0||m.d<=0)return{left:-Infinity,top:-Infinity,right:Infinity,bottom:Infinity};
  return{left:-m.e/m.a,top:-m.f/m.d,right:(ctx.canvas.width-m.e)/m.a,bottom:(ctx.canvas.height-m.f)/m.d};
}
const TOXIC_FRONT=[[-.65,-1],[.65,-1],[.65,-.65],[1,-.65],[1,.65],[.65,.65],[.65,1],[-.65,1],[-.65,.65],[-1,.65],[-1,-.65],[-.65,-.65]];
/** The growing gathering body remains visible while its real members merge into it. */
export function drawConvergenceMinimap(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,mapX:number,mapY:number,scale:number,tick:number){
  const a=state.trial?.devourer?.convergence;if(!a||a.stage==='blast')return;
  const x=Math.round(mapX+a.x/S*scale),y=Math.round(mapY+a.y/S*scale),pulse=.7+.3*Math.abs(Math.sin(tick*.09));
  ctx.save();ctx.shadowBlur=0;ctx.globalAlpha=1;
  // Two translucent square signals separate the gathering point from ordinary boss dots.
  for(let i=0;i<2;i++){
    const phase=(tick/70+i*.5)%1,r=14+phase*17;
    ctx.globalAlpha=(1-phase)*.46;ctx.strokeStyle=i?'#caff9c':'#b578ee';ctx.lineWidth=4;
    ctx.strokeRect(x-r,y-r,r*2,r*2);
    ctx.globalAlpha=(1-phase)*.65;ctx.lineWidth=1;ctx.strokeRect(x-r,y-r,r*2,r*2);
  }
  ctx.globalAlpha=1;ctx.fillStyle='#08070f';ctx.fillRect(x-10,y-10,20,20);
  ctx.fillStyle='#a45bdd';ctx.fillRect(x-8,y-8,16,16);ctx.fillRect(x-11,y-4,3,7);ctx.fillRect(x+8,y-5,3,5);
  ctx.fillStyle='#32153e';ctx.fillRect(x-5,y-5,10,10);
  ctx.fillStyle='#e3ffc1';ctx.fillRect(x-3,y-4,6,4);ctx.fillStyle='#b6ff9a';ctx.fillRect(x-4,y+3,8,2);
  const r=15+Math.round((1-pulse)*5),arm=7;
  for(const [width,color]of [[5,'#0b0b13'],[3,'#caff9c']] as const){
    ctx.globalAlpha=pulse;ctx.strokeStyle=color;ctx.lineWidth=width;
    for(const dx of [-1,1])for(const dy of [-1,1]){
      ctx.beginPath();ctx.moveTo(x+dx*(r-arm),y+dy*r);ctx.lineTo(x+dx*r,y+dy*r);ctx.lineTo(x+dx*r,y+dy*(r-arm));ctx.stroke();
    }
  }
  for(let i=0;i<4;i++){
    const q=(tick/45+i*.25)%1,d=19+(1-q)*12,dx=i===0?1:i===2?-1:0,dy=i===1?1:i===3?-1:0;
    ctx.globalAlpha=Math.sin(q*Math.PI)*.85;ctx.fillStyle='#e3ffc1';ctx.fillRect(Math.round(x+dx*d)-1,Math.round(y+dy*d)-1,3,3);
  }
  ctx.restore();
}
function traceToxicFront(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){
  ctx.beginPath();
  for(const [i,[dx,dy]]of TOXIC_FRONT.entries())i?ctx.lineTo(x+dx*r,y+dy*r):ctx.moveTo(x+dx*r,y+dy*r);
  ctx.closePath();
}
function drawToxicFront(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,alpha:number,echo:number,view?:BurstView,travelStep=0){
  // Keep several frames of visible wake even when the front crosses a large arena quickly.
  const tail=Math.min(r*.65,Math.max(echo?240:420,travelStep*(echo?4:6)));
  const outer=r+30,inner=r*.65-tail-30;
  if(alpha<=.01||(view&&(x+outer<view.left||x-outer>view.right||y+outer<view.top||y-outer>view.bottom||(inner>0&&view.left>x-inner&&view.right<x+inner&&view.top>y-inner&&view.bottom<y+inner))))return;
  for(let layer=11;layer>=0;layer--){
    const u=layer/11;traceToxicFront(ctx,x,y,Math.max(1,r-tail*u));
    ctx.globalAlpha=alpha*.48*Math.pow(1-u,1.1);ctx.strokeStyle=echo===1?'#9945c7':'#7dff8a';ctx.lineWidth=tail/11*1.2+.5;ctx.stroke();
  }
  traceToxicFront(ctx,x,y,r);ctx.globalAlpha=alpha*.75;ctx.strokeStyle=echo===1?'#9945c7':'#7dff8a';ctx.lineWidth=echo?24:44;ctx.stroke();
  ctx.globalAlpha=alpha*.95;ctx.strokeStyle='#b6ff9a';ctx.lineWidth=echo?3:6;ctx.stroke();
}

// Exactly one full-sized body travels inward per slot; each arrival adds a brief swell.
export function drawSwarmConvergence(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,camX:number,camY:number) {
  const a=state.trial?.devourer?.convergence;if(!a)return;
  const view=burstView(ctx);
  const C=SC.convergence,x=a.x-camX,y=a.y-camY,count=a.members.length;
  const sizeOf=(m:typeof a.members[number])=>{const e=state.enemies.find(e=>e.id===m.id);return m.size??Math.floor(S*ENEMY_CONFIGS.devourer.bodyFraction*(e?devourerBodyScale(e):1));};
  ctx.save();ctx.shadowBlur=0;
  if(a.stage!=='blast') {
    const duration=a.gatherTicks??convergenceGatherTicks(count),elapsed=a.stage==='charge'?duration:duration-a.ticks;
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
    const elapsed=C.blastTicks-a.ticks,travelStep=convergenceWaveRadius(state,a,1)-convergenceWaveRadius(state,a,0);
    for(let echo=0;echo<3;echo++){
      const waveAge=elapsed-echo*C.waveEchoTicks,q=waveAge/C.waveTicks;if(q<0||q>=1)continue;
      const r=convergenceWaveRadius(state,a,waveAge);drawToxicFront(ctx,x,y,r,Math.min(1,(1-q)*4)*(1-echo*.2),echo,view,travelStep);
    }
    // Full-sized bodies fly out on the same timer as their real landing, without shrinking to dots.
    const travelTicks=SINGULARITY_LAND_TICKS-SINGULARITY_FALL_TICKS,u=Math.min(1,elapsed/travelTicks);
    if(u<1)for(const m of a.members){const bx=x+((m.tx+.5)*S-a.x)*u,by=y+((m.ty+.5)*S-a.y)*u-Math.sin(u*Math.PI)*S*SINGULARITY_FALL_HEIGHT;ctx.globalAlpha=1;drawDevourerModel(ctx,Math.round(bx),Math.round(by),sizeOf(m),false,true);}
  }
  ctx.restore();
}

// Deterministic irregular silhouettes keep the screen overlay varied without per-frame randomization.
const TOXIC_GAS_PUFFS=Array.from({length:14},(_,i)=>{
  const random=(salt:number)=>{const n=Math.sin(i*127.1+salt*83.17+41.3)*43758.5453;return n-Math.floor(n);};
  return{x:.03+random(1)*.94,y:.04+random(2)*.92,size:.075+random(3)*.18,aspect:.7+random(4)*.8,
    angle:(random(5)-.5)*.5,turn:(random(6)-.5)*.5,dx:(random(7)-.5)*.15,dy:-.025-random(8)*.07,phase:random(9)*Math.PI*2,
    light:random(10)>.72,lobes:Array.from({length:4},(_,j)=>({x:(random(20+j*4)-.5)*.65,y:(random(21+j*4)-.5)*.55,
      w:.55+random(22+j*4)*.6,h:.55+random(23+j*4)*.6,alpha:.06+random(40+j)*.055}))};
});

/** While the swarm gathers: a heavy violet tint throbbing with a quickening heartbeat, thick stepped dark bands closing in
 * from the screen edges, translucent stepped waves contracting onto the gather point, dense streaks rushing toward it, a
 * green glow square where it merges, and a thick lime edge frame flashing with each beat. When the gather point is off
 * screen, everything centres just past the nearest edge toward it. Cosmetic only; p runs 0-1 over the gather. */
function drawConvergenceGatherScreen(ctx:CanvasRenderingContext2D,a:NonNullable<NonNullable<NonNullable<GameState['trial']>['devourer']>['convergence']>,w:number,h:number,camX:number,camY:number,zoom:number,tick:number){
  const total=a.gatherTicks??a.ticks,p=Math.max(0,Math.min(1,1-a.ticks/Math.max(1,total))),ease=p*p*(3-2*p);
  // On screen, the effect centres on the gather point; off screen, on the edge point toward it, pushed just past the edge.
  const px=(a.x-camX)*zoom,py=(a.y-camY)*zoom,dx=px-w/2,dy=py-h/2,offscreen=px<0||px>w||py<0||py>h;
  const edge=offscreen?Math.min(w/2/Math.max(1e-6,Math.abs(dx)),h/2/Math.max(1e-6,Math.abs(dy))):1,len=Math.hypot(dx,dy)||1;
  const gx=offscreen?w/2+dx*edge+dx/len*32:px,gy=offscreen?h/2+dy*edge+dy/len*32:py;
  ctx.save();ctx.shadowBlur=0;
  const beat=.5+.5*Math.sin(tick*(.08+.32*ease)),thump=Math.pow(beat,6); // the heartbeat quickens toward the blast
  // A heavy violet tint that deepens as bodies merge, throbbing with the heartbeat.
  ctx.globalAlpha=.16+.24*ease+.06*thump;ctx.fillStyle='#3a1466';ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=.05+.07*ease*thump;ctx.fillStyle='#7dff8a';ctx.fillRect(0,0,w,h);
  // Thick stepped dark bands close in from every edge.
  const depth=Math.min(w,h)*(.09+.17*ease+.02*thump);
  for(let k=0;k<6;k++){const d=depth*(1-k/6);ctx.globalAlpha=(.22+.25*ease)*(1-k/7);ctx.fillStyle='#07020f';
    ctx.fillRect(0,0,w,d);ctx.fillRect(0,h-d,w,d);ctx.fillRect(0,d,d,h-d*2);ctx.fillRect(w-d,d,d,h-d*2);}
  // Translucent stepped waves contract onto the gather point, in the blast fronts' style: a soft wake trailing outside
  // each front (behind it as it moves in), a translucent body and a thin pale core.
  const far=Math.hypot(Math.max(gx,w-gx),Math.max(gy,h-gy))+40;
  ctx.lineJoin='miter';
  for(let k=0;k<3;k++){
    const q=((tick*(.005+.01*ease)+k/3)%1),r=12+far*(1-q)*(1-q),strength=Math.sin(q*Math.PI)*(.55+.45*ease),col=k===1?'#9945c7':'#7dff8a';
    const tail=Math.min(160,30+r*.35);
    for(let layer=11;layer>=0;layer--){const u=layer/11;traceToxicFront(ctx,gx,gy,r+tail*u);
      ctx.globalAlpha=strength*.32*Math.pow(1-u,1.2);ctx.strokeStyle=col;ctx.lineWidth=tail/11*1.2+.5;ctx.stroke();}
    traceToxicFront(ctx,gx,gy,r);ctx.globalAlpha=strength*.5;ctx.strokeStyle=col;ctx.lineWidth=k===1?14:22;ctx.stroke();
    ctx.globalAlpha=strength*.8;ctx.strokeStyle='#d8ffc8';ctx.lineWidth=k===1?2:4;ctx.stroke();
  }
  // Dense streaks rush in toward the gather point from all around, faster and longer as it fills.
  const reach=Math.hypot(w,h)*.75;
  for(let i=0;i<56;i++){
    const ang=i*2.399+Math.sin(i*1.7)*.3,life=((tick*(.014+.03*ease)+i*.137)%1),d=reach*(1-life*life)+10,len=24+60*ease;
    const x=gx+Math.cos(ang)*d,y=gy+Math.sin(ang)*d,ux=Math.cos(ang),uy=Math.sin(ang);
    ctx.globalAlpha=Math.sin(life*Math.PI)*(.45+.5*ease);ctx.strokeStyle=i%3?'#c9a8ff':i%2?'#9dff8a':'#f0e6ff';ctx.lineWidth=i%4?3:5;
    ctx.beginPath();ctx.moveTo(Math.round(x),Math.round(y));ctx.lineTo(Math.round(x+ux*len),Math.round(y+uy*len));ctx.stroke();
  }
  // A pulsing green glow square where the swarm is merging (off screen, past the edge, so unseen).
  const core=18+26*ease+10*thump;ctx.globalAlpha=.25+.35*ease;ctx.fillStyle='#9dff8a';ctx.fillRect(Math.round(gx-core/2),Math.round(gy-core/2),Math.round(core),Math.round(core));
  ctx.globalAlpha=.5+.4*ease;ctx.fillStyle='#07020f';ctx.fillRect(Math.round(gx-core/4),Math.round(gy-core/4),Math.round(core/2),Math.round(core/2));
  // A thick lime frame at the screen edge flashes with each beat.
  ctx.globalAlpha=(.25+.45*ease)*beat;ctx.strokeStyle='#9dff8a';ctx.lineWidth=6+10*ease;ctx.strokeRect(0,0,w,h);
  ctx.globalAlpha=(.2+.3*ease)*thump;ctx.strokeStyle='#f0ffe8';ctx.lineWidth=3;ctx.strokeRect(6+8*ease,6+8*ease,w-12-16*ease,h-12-16*ease);
  ctx.restore();
}

/** While the swarm gathers, the merging body is drawn again over the gather screen effect so the effect sits behind it. */
export function drawConvergenceGatherBody(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,camX:number,camY:number,zoom=1){
  if(state.trial?.devourer?.convergence?.stage!=='gather')return;
  ctx.save();ctx.scale(zoom,zoom);drawSwarmConvergence(ctx,state,camX,camY);ctx.restore();
}

/** One inexpensive screen-space gas overlay, identical in every room and camera position. */
export function drawConvergenceScreen(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,w:number,h:number,camX:number,camY:number,zoom=1){
  const a=state.trial?.devourer?.convergence;if(!a)return;
  if(a.stage==='gather'){drawConvergenceGatherScreen(ctx,a,w,h,camX,camY,zoom,state.gameTick);return;}
  if(a.stage!=='blast')return;
  const p=Math.max(0,Math.min(1,1-a.ticks/SC.convergence.blastTicks)),rise=Math.min(1,p/.08);
  const fade=rise*rise*(3-2*rise)*(.5+.5*Math.cos(p*Math.PI));
  ctx.save();ctx.shadowBlur=0;
  ctx.globalAlpha=Math.pow(Math.max(0,1-p/.09),2)*.12;ctx.fillStyle='#b6ff9a';ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=fade*.045;ctx.fillStyle='#5ad86a';ctx.fillRect(0,0,w,h);
  // Uneven flat gas clusters drift and turn gently; all motion remains independent of the camera.
  const drift=p*p*(3-2*p);
  for(const puff of TOXIC_GAS_PUFFS){
    const size=Math.min(w,h)*puff.size*(1+Math.sin(p*Math.PI+puff.phase)*.08);
    const x=w*(puff.x+puff.dx*drift)+Math.sin(p*3+puff.phase)*size*.08,y=h*(puff.y+puff.dy*drift);
    ctx.save();ctx.translate(x,y);ctx.rotate(puff.angle+puff.turn*drift);
    ctx.fillStyle=puff.light?'#b6ff9a':'#7dff8a';
    for(const lobe of puff.lobes){
      ctx.globalAlpha=fade*lobe.alpha;
      ctx.fillRect(size*(lobe.x-lobe.w/2)*puff.aspect,size*(lobe.y-lobe.h/2),size*lobe.w*puff.aspect,size*lobe.h);
    }
    ctx.restore();
  }
  for(let i=0;i<18;i++){
    const x=w*((i*71+19)%103)/103,y=h*((i*37+11)%97)/97-p*(12+i%4*8),size=3+i%3;
    ctx.globalAlpha=fade*(.18+i%3*.06);ctx.fillStyle='#9dd959';ctx.fillRect(Math.round(x),Math.round(y),size,size);
  }
  ctx.restore();
}
