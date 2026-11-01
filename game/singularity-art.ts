import { CHAMBER_BOUNDS, TILE_SIZE, T_WALL, chamberOfTile } from './constants';
import type { GameState } from './engine';

export const VOID_CHAMBER_COLORS=['#aaa4bc','#bfa2ab','#8eabb7','#a28ac2'];
export const isSingularityMap=(state:GameState)=>state.trial?.boss==='devourer';
const rect=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};


export function drawVoidBackdrop(ctx:CanvasRenderingContext2D,w:number,h:number,camX:number,camY:number,tick:number) {
  ctx.save();rect(ctx,0,0,w,h,'#03040a');
  const cx=w*.09-camX*.025,cy=h*.53-camY*.025;
  // Light, not solid props, gives this abyss depth. No outlined cliffs or enormous stone shapes.
  const distant=ctx.createRadialGradient(cx,cy,25,cx,cy,Math.max(w,h)*.65);
  distant.addColorStop(0,'#020308');distant.addColorStop(.3,'#0b0d19');distant.addColorStop(.7,'#070913');distant.addColorStop(1,'#03040a');
  ctx.fillStyle=distant;ctx.fillRect(0,0,w,h);
  for(let i=0;i<72;i++) {
    const age=(tick*(.00018+i%3*.000035)+i*.173)%1;
    const angle=i*2.399+age*.18,r=(1-age)*(w*.85+160)+35;
    const x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r*.9;
    ctx.globalAlpha=Math.sin(age*Math.PI)*(.2+i%5*.045);
    rect(ctx,x,y,1,1,i%7===0?'#d5d6e0':'#84899d');
    if(i%4===0) {
      ctx.strokeStyle='#a2a8c2';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x,y);
      const bend=angle+.025;ctx.quadraticCurveTo(x+Math.cos(bend)*9,y+Math.sin(bend)*9,x+Math.cos(bend+.04)*21,y+Math.sin(bend+.04)*21);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
  // Long, faint gravitational light filaments bend into an unlit absence.
  for(let i=0;i<9;i++) {
    ctx.strokeStyle=i%3===0?'#c2c6dc50':'#8e89bc2c';ctx.lineWidth=.75;
    const drift=Math.sin(tick*.0015+i)*9;
    ctx.beginPath();ctx.moveTo(cx-75-i*17,-50);
    ctx.bezierCurveTo(cx+95+i*12,cy-160+drift,cx-90-i*7,cy+115,cx+35+i*13,h+60);ctx.stroke();
  }
  // Fine lensing echoes split the last light into restrained cold and violet traces.
  for(let i=0;i<5;i++) {
    const y=cy+(i-2)*100,breath=.72+.15*Math.sin(tick*.004+i);
    ctx.globalAlpha=breath;ctx.lineWidth=.7;
    for(const [shift,color]of [[0,'#a9bac840'],[2,'#9f8cba27']] as const) {
      ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(-30,y-30+shift);
      ctx.bezierCurveTo(cx-50,y+shift,cx+100,cy+(i-2)*16+shift,w*.25,y+55+shift);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
  // Soft extinction hides the filament centres; it has no hard boundary, rim or glowing frame.
  const absence=ctx.createRadialGradient(cx,cy,15,cx,cy,125);
  absence.addColorStop(0,'#000106ff');absence.addColorStop(.5,'#000106c0');absence.addColorStop(1,'#00010600');
  ctx.fillStyle=absence;ctx.fillRect(cx-125,cy-125,250,250);
  ctx.restore();
}

function matterTraces(ctx:CanvasRenderingContext2D,tx:number,ty:number,x:number,y:number,dense:boolean) {
  const wx=tx*48,wy=ty*48,spacing=dense?20:128,start=Math.floor(wx/48)*48;
  const first=Math.floor(wy/spacing);
  ctx.save();ctx.beginPath();ctx.rect(x,y,48,48);ctx.clip();
  for(let k=first-3;k<=first+3;k++) {
    ctx.beginPath();
    for(let n=-1;n<=4;n++) {
      const px=start+n*24;
      const py=k*spacing+Math.sin(px/95+k*1.9)*11+Math.sin(px/217)*17;
      n===-1?ctx.moveTo(x+px-wx,y+py-wy):ctx.lineTo(x+px-wx,y+py-wy);
    }
    ctx.lineWidth=dense?.65:.8;ctx.strokeStyle=dense?'#b0b3cf26':'#a9a3ca1d';ctx.stroke();
  }
  // Minute suspended specks read as depth inside the matter, without stone facets or bevels.
  if(dense)for(let i=0;i<3;i++) {
    const px=(tx*17+ty*31+i*13)%44+2,py=(tx*29+ty*11+i*19)%44+2;
    rect(ctx,x+px,y+py,1,1,i===0?'#b9bdd542':'#8987a52a');
  }
  ctx.restore();
}

export function drawVoidTile(ctx:CanvasRenderingContext2D,state:GameState,tx:number,ty:number,x:number,y:number,cover=false) {
  const room=chamberOfTile(tx,ty),color=VOID_CHAMBER_COLORS[Math.max(0,room)];ctx.save();
  if(cover) {
    const joined=(cx:number,cy:number)=>{
      const ch=chamberOfTile(cx,cy);if(ch<0||state.map[cy]?.[cx]!==T_WALL)return false;
      const [t,l,b,r]=CHAMBER_BOUNDS[ch];return cx>l&&cx<r&&cy>t&&cy<b;
    };
    // Flat dark matter: fine continuous boundaries, no top cap, side face, bevel or crack outline.
    rect(ctx,x,y,48,48,'#191b27');rect(ctx,x,y,48,48,color+'08');
    matterTraces(ctx,tx,ty,x,y,true);
    ctx.strokeStyle=color+'66';ctx.lineWidth=1;ctx.beginPath();
    if(!joined(tx,ty-1)){ctx.moveTo(x+.5,y+.5);ctx.lineTo(x+47.5,y+.5);}
    if(!joined(tx,ty+1)){ctx.moveTo(x+.5,y+47.5);ctx.lineTo(x+47.5,y+47.5);}
    if(!joined(tx-1,ty)){ctx.moveTo(x+.5,y);ctx.lineTo(x+.5,y+48);}
    if(!joined(tx+1,ty)){ctx.moveTo(x+47.5,y);ctx.lineTo(x+47.5,y+48);}
    ctx.stroke();
    if((tx*3+ty*7)%11===0){rect(ctx,x+13,y+23,16,1,color+'23');}
  } else {
    rect(ctx,x,y,TILE_SIZE,TILE_SIZE,'#0e111b');
    matterTraces(ctx,tx,ty,x,y,false);
    ctx.strokeStyle='#b5bccc12';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,47,47);
    if((tx*7+ty*3)%17===0){rect(ctx,x+17,y+26,1,1,'#b0afc144');}
  }
  ctx.restore();
}
