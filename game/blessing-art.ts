import {solarBlessingReady,emeraldBlessingFull,AMETHYST_SHOT_INTERVAL} from './blessing-effects';
import type {GameState} from './engine';

// Dedicated status shapes. No decorative gemstone particles, orbit lights or miniatures.
export function drawDiamondBlessingShield(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number){
 const pulse=.8+.2*Math.abs(Math.sin(tick*.055)),r=25,border=7;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;
 ctx.globalAlpha=.08;ctx.fillStyle='#69cfe8';ctx.fillRect(-r,-r,r*2,r*2);
 ctx.save();ctx.beginPath();ctx.rect(-2048,-2048,4096,4096);ctx.rect(-r,-r,r*2,r*2);ctx.clip('evenodd');
 ctx.shadowColor='#69d8ef';ctx.shadowBlur=32;ctx.globalAlpha=pulse*.75;ctx.fillStyle='#69d8ef';
 ctx.fillRect(-r,-r,r*2,border);ctx.fillRect(-r,-r,border,r*2);ctx.fillRect(-r,r-border,r*2,border);ctx.fillRect(r-border,-r,border,r*2);
 ctx.restore();ctx.shadowBlur=0;
 ctx.globalAlpha=pulse*.65;ctx.fillStyle='#409fbc';ctx.fillRect(-r,-r,r*2,border);ctx.fillRect(-r,-r,border,r*2);
 ctx.globalAlpha=pulse*.9;ctx.fillStyle='#adeaf6';ctx.fillRect(-r,r-border,r*2,border);ctx.fillRect(r-border,-r,border,r*2);
 ctx.shadowBlur=0;ctx.globalAlpha=.85;ctx.fillStyle='#e8fcff';ctx.fillRect(-r,-r,12,border);ctx.fillRect(-r,-r,border,12);ctx.fillRect(r-10,r-border,10,border);ctx.restore();
}
export function drawBlessingBehindPlayer(ctx:CanvasRenderingContext2D,s:GameState,x:number,y:number){
 if(!solarBlessingReady(s))return;
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=6;ctx.shadowColor='#f52b50';
 const r=32;ctx.globalAlpha=.85;ctx.fillStyle='#ed3d69';ctx.fillRect(-r,-r,r*2,6);ctx.fillRect(-r,-r,6,r*2);
 ctx.fillStyle='#ff6684';ctx.fillRect(-r,r-6,r*2,6);ctx.fillRect(r-6,-r,6,r*2);
 ctx.shadowBlur=0;ctx.globalAlpha=.12;ctx.fillStyle='#ce2957';ctx.fillRect(-r+6,-r+6,r*2-12,r*2-12);
 ctx.globalAlpha=.65;ctx.fillStyle='#8d1c40';ctx.fillRect(-26,-24,7,40);ctx.fillRect(19,-16,7,40);
 ctx.fillStyle='#ff8aa5';ctx.globalAlpha=.8;ctx.fillRect(-24,-26,18,5);ctx.fillRect(15,21,11,5);
 ctx.globalAlpha=.3;ctx.fillStyle='#ff6684';ctx.fillRect(-12,-12,24,24);ctx.restore();
}
export function drawBlessingCombatEffects(ctx:CanvasRenderingContext2D,s:GameState,camX:number,camY:number){
 const x=Math.round(s.playerX-camX),y=Math.round(s.playerY-camY);
 if(s.build.blessings.includes('storm_reaper')&&s.build.reaperHaste?.some(until=>until>s.gameTick)){
  const full=emeraldBlessingFull(s),r=solarBlessingReady(s)?40:33,w=full?7:5,len=12,pulse=.85+.15*Math.sin(s.gameTick*.09);
  ctx.save();ctx.globalAlpha=full?pulse:.85;ctx.fillStyle=full?'#4cffae':'#49da95';ctx.shadowColor=full?'#4cffae':'#41cb87';ctx.shadowBlur=full?8:4;
  for(const dx of [-1,1])for(const dy of [-1,1]){const px=x+dx*r,py=y+dy*r,hx=px-(dx>0?len:0),hy=py-(dy>0?w:0),vx=px-(dx>0?w:0),vy=py-(dy>0?len:0);
   ctx.fillRect(hx,hy,len,w);ctx.fillRect(vx,vy,w,len);
   if(full){ctx.shadowBlur=0;ctx.fillStyle='#c5ffe3';ctx.fillRect(hx+2,hy+2,len-4,w-4);ctx.fillRect(vx+2,vy+2,w-4,len-4);ctx.fillStyle='#4cffae';ctx.shadowBlur=8;}
  }ctx.restore();
 }
 for(const decoy of s.build.queenDecoys??[])if(decoy.shotAt-s.gameTick>AMETHYST_SHOT_INTERVAL-6)statusFrame(ctx,decoy.x-camX,decoy.y-camY,25,'#ac70f1',.55);
 const pearl=(s.build.pearlReflectUntil??0)-s.gameTick;
 if(s.build.blessings.includes('aegis_sentinel'))drawPearlBlessingAura(ctx,x,y,s.gameTick,pearl>0);
 const reflected=s.build.pearlReflectTarget;if(s.build.blessings.includes('aegis_sentinel')&&reflected&&reflected.until>s.gameTick)drawPearlReflectMarker(ctx,reflected.x-camX,reflected.y-camY-38,Math.min(1,(reflected.until-s.gameTick)/10));
 const opal=s.build.opalFlash;
 if(s.build.blessings.includes('astral_twins')&&opal&&opal.until>s.gameTick){const a=.6*Math.min(1,(opal.until-s.gameTick)/6);statusFrame(ctx,opal.x-camX-4,opal.y-camY-4,23,'#8bcaff',a);statusFrame(ctx,opal.x-camX+4,opal.y-camY+4,23,'#edb0d4',a);}
 const amber=(s.build.amberRefreshUntil??0)-s.gameTick;
 if(s.build.blessings.includes('blind_prayer')&&amber>0)drawAmberEnergyMarker(ctx,x+((s.build.sapphireRegenUntil??0)>s.gameTick?22:0),y-49,Math.min(1,amber/8));
 const diamond=(s.build.diamondShieldUntil??0)-s.gameTick;if(s.build.blessings.includes('frost_warden')&&diamond>0)drawDiamondShieldMarker(ctx,x+(((s.build.sapphireRegenUntil??0)>s.gameTick||amber>0)?-22:0),y-49,Math.min(1,diamond/10));
 const remaining=(s.build.sapphireRegenUntil??0)-s.gameTick;
 if(s.build.blessings.includes('sea_chanter')&&remaining>0){
  ctx.save();ctx.translate(x,y-49);ctx.globalAlpha=Math.min(1,remaining/8);ctx.fillStyle='#39bde9';ctx.shadowColor='#39bde9';ctx.shadowBlur=5;
  ctx.fillRect(-5,-5,10,10);ctx.fillRect(-3,-11,6,22);ctx.fillRect(-11,-3,22,6);
  for(const dx of [-1,1])for(const dy of [-1,1])ctx.fillRect(dx*8-2,dy*8-2,4,4);
  ctx.shadowBlur=0;ctx.fillStyle='#19658e';ctx.fillRect(-3,-3,6,6);
  ctx.fillStyle='#82e2ff';ctx.fillRect(-1,-9,2,18);ctx.fillRect(-9,-1,18,2);
  ctx.fillStyle='#e1faff';ctx.fillRect(-2,-3,4,5);ctx.fillRect(-3,-3,3,3);ctx.restore();
 }
}

export function drawSapphireHitCorners(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,tick:number,until:number){
 const remaining=until-tick;if(remaining<=0)return;
 const r=Math.max(34,Math.round(radius)),length=26,thickness=7;
 ctx.save();ctx.globalAlpha=.55*Math.min(1,remaining/12);ctx.globalCompositeOperation='lighter';ctx.fillStyle='#70ddff';ctx.shadowColor='#24baff';ctx.shadowBlur=14;
 for(const dx of [-1,1])for(const dy of [-1,1]){
  const px=x+dx*r,py=y+dy*r;
  ctx.fillRect(dx<0?px:px-length,dy<0?py:py-thickness,length,thickness);
  ctx.fillRect(dx<0?px:px-thickness,dy<0?py:py-length,thickness,length);
 }
 ctx.shadowBlur=0;ctx.fillStyle='#d9f8ff';
 for(const dx of [-1,1])for(const dy of [-1,1]){
  const px=x+dx*r,py=y+dy*r;
  ctx.fillRect(dx<0?px:px-length,dy<0?py:py-2,length,2);
  ctx.fillRect(dx<0?px:px-2,dy<0?py:py-length,2,length);
 }
 ctx.restore();
}

function statusFrame(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,alpha:number){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.shadowBlur=0;
 ctx.fillRect(-r,-r,r*2,4);ctx.fillRect(-r,-r,4,r*2);ctx.fillRect(-r,r-4,r*2,4);ctx.fillRect(r-4,-r,4,r*2);ctx.restore();
}
function drawAmberEnergyMarker(ctx:CanvasRenderingContext2D,x:number,y:number,alpha:number){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.globalAlpha=alpha;ctx.shadowColor='#ffc23b';ctx.shadowBlur=5;ctx.fillStyle='#ffc23b';
 ctx.fillRect(-5,-11,10,22);ctx.fillRect(-8,-7,16,14);ctx.shadowBlur=0;
 ctx.fillStyle='#ac661b';ctx.fillRect(-5,-7,10,14);ctx.fillStyle='#ffda68';ctx.fillRect(-3,-7,6,14);
 ctx.fillStyle='#fff1bd';ctx.fillRect(-3,-7,4,5);ctx.fillRect(-2,-2,4,7);ctx.restore();
}
function drawDiamondShieldMarker(ctx:CanvasRenderingContext2D,x:number,y:number,alpha:number){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.globalAlpha=alpha;ctx.shadowColor='#8eeaff';ctx.shadowBlur=5;ctx.fillStyle='#71d9ee';
 ctx.fillRect(-2,-10,4,4);ctx.fillRect(-6,-6,12,4);ctx.fillRect(-9,-2,18,4);ctx.fillRect(-6,2,12,4);ctx.fillRect(-2,6,4,4);
 ctx.shadowBlur=0;ctx.fillStyle='#e7fcff';ctx.fillRect(-2,-6,3,7);ctx.fillRect(-5,-2,3,3);ctx.restore();
}
function drawPearlReflectMarker(ctx:CanvasRenderingContext2D,x:number,y:number,alpha:number){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.globalAlpha=alpha;ctx.shadowColor='#f0bccb';ctx.shadowBlur=5;ctx.fillStyle='#d8a5b4';
 for(const [row,width]of [[-9,6],[-6,12],[-3,18],[0,18],[3,12],[6,6]])ctx.fillRect(-width/2,row,width,3);
 ctx.shadowBlur=0;ctx.fillStyle='#fff0f1';
 for(const [row,width]of [[-6,6],[-3,12],[0,12],[3,6]])ctx.fillRect(-width/2,row,width,3);
 ctx.fillStyle='#ffffff';ctx.fillRect(-5,-5,3,3);ctx.restore();
}

function drawPearlBlessingAura(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,reflecting:boolean){
 const r=28,border=4,cell=4,extent=r*2,tiles=extent/border,perimeter=extent*4,sweep=(tick*2)%perimeter;
 const colors:{color:string;cells:[number,number,number,number][]}[]=[{color:'#f6e6df',cells:[]},{color:'#d8a5b4',cells:[]}];
 for(let row=0;row<tiles;row++)for(let col=0;col<tiles;col++){
  if(row!==0&&row!==tiles-1&&col!==0&&col!==tiles-1)continue;
  const index=row===0?col:col===tiles-1?tiles+row:row===tiles-1?tiles*2+(tiles-1-col):tiles*3+(tiles-1-row);
  colors[Math.floor(index/2)%2].cells.push([-r+col*cell,-r+row*cell,cell,cell]);
 }
 ctx.save();ctx.translate(Math.round(x),Math.round(y));
 ctx.save();ctx.beginPath();ctx.rect(-2048,-2048,4096,4096);ctx.rect(-r+border,-r+border,extent-border*2,extent-border*2);ctx.clip('evenodd');
 ctx.globalAlpha=reflecting?.58:.34;ctx.shadowColor='#f0bccb';ctx.shadowBlur=4;
 for(const group of colors){ctx.beginPath();for(const [px,py,w,h]of group.cells)ctx.rect(px,py,w,h);ctx.fillStyle=group.color;ctx.fill();}
 ctx.restore();
 ctx.globalAlpha=reflecting?.72:.55;ctx.shadowBlur=0;
 for(const group of colors){ctx.beginPath();for(const [px,py,w,h]of group.cells)ctx.rect(px,py,w,h);ctx.fillStyle=reflecting&&group.color==='#f6e6df'?'#fff0f1':group.color;ctx.fill();}
 const side=Math.floor(sweep/extent),along=sweep%extent-r,px=side===0?along:side===1?r:side===2?-along:-r,py=side===0?-r:side===1?along:side===2?r:-along;
 ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(px/border)*border-2,Math.round(py/border)*border-2,border,border);
 ctx.restore();
}
