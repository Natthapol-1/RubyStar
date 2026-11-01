import { CHAMBER_BOUNDS, TELEPORT_PADS, T_WALL, TILE_SIZE, chamberOfTile } from './constants';
import type { GameState } from './engine';

export const SATURN_CHAMBER_COLORS = ['#89e7e4', '#b6d5f3', '#a2dfc9', '#d9f3f0'];
export const isSaturnMap = (state: GameState) => state.trial?.boss === 'frost_warden';
const panel = (ctx: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string) => {
  ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);
};

// Wide, flat floes distinguish this frozen ring field from Moon's vertical geode spires.
function iceFloe(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,near:boolean,seed:number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  ctx.beginPath();ctx.moveTo(-w*.5,-h*.16);ctx.lineTo(-w*.31,-h*.36);ctx.lineTo(w*.2,-h*.3);
  ctx.lineTo(w*.49,-h*.06);ctx.lineTo(w*.35,h*.26);ctx.lineTo(w*.04,h*.55);ctx.lineTo(-w*.29,h*.37);ctx.closePath();
  ctx.fillStyle=near?'#285562':'#1b3d49';ctx.fill();
  ctx.beginPath();ctx.moveTo(-w*.5,-h*.16);ctx.lineTo(-w*.31,-h*.36);ctx.lineTo(w*.2,-h*.3);ctx.lineTo(w*.49,-h*.06);
  ctx.lineTo(w*.12,h*.08);ctx.lineTo(-w*.24,h*.03);ctx.closePath();ctx.fillStyle=near?'#649fa5':'#386976';ctx.fill();
  ctx.beginPath();ctx.moveTo(-w*.49,-h*.16);ctx.lineTo(-w*.31,-h*.36);ctx.lineTo(w*.2,-h*.3);ctx.lineTo(w*.34,-h*.18);
  ctx.lineTo(-w*.25,-h*.2);ctx.closePath();ctx.fillStyle=near?'#cdebf0':'#86afba';ctx.fill();
  // A trapped turquoise fissure and the darker submerged keel.
  ctx.strokeStyle=near?'#9cdee1':'#579aa4';ctx.lineWidth=near?2:1;ctx.beginPath();ctx.moveTo(-w*.12,-h*.18);ctx.lineTo(w*.02,h*.04);ctx.lineTo(-w*.05,h*.24);ctx.lineTo(w*.04,h*.47);ctx.stroke();
  ctx.fillStyle=near?'#183d4a':'#132f3d';ctx.beginPath();ctx.moveTo(w*.12,h*.08);ctx.lineTo(w*.49,-h*.06);ctx.lineTo(w*.35,h*.26);ctx.lineTo(w*.04,h*.55);ctx.closePath();ctx.fill();
  if(seed%3===0){panel(ctx,-w*.21,-h*.15,Math.max(4,w*.12),2,near?'#ecfffc':'#b8dce0');}
  ctx.restore();
}

export function drawSaturnBackdrop(ctx:CanvasRenderingContext2D,w:number,h:number,camX:number,camY:number,tick:number) {
  ctx.save();
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#091b25');sky.addColorStop(.55,'#112f3a');sky.addColorStop(1,'#0a1e2c');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  // Faint vertical polar light curtains, leaving broad quiet space around the ice.
  for(let i=0;i<3;i++) {
    const x=w*(.1+i*.43)-camX*.025+Math.sin(tick*.002+i)*25;
    const light=ctx.createLinearGradient(x,0,x,h*.75);light.addColorStop(0,'#89e7e418');light.addColorStop(1,'#89e7e400');
    ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(x-45,0);ctx.lineTo(x+70,0);ctx.lineTo(x+14,h*.75);ctx.lineTo(x-18,h*.6);ctx.closePath();ctx.fill();
  }
  // A monumental fractured ice ring gives the environment one recognizable landmark.
  // Its broad slab faces stay behind the battlefield; no bright halo or enclosing HUD frame.
  ctx.save();ctx.translate(w*.075-camX*.035,h*.57-camY*.035);ctx.rotate(-.32);
  const rx=Math.min(215,w*.2),ry=h*.48;
  for(let i=0;i<16;i++) {
    if(i===2||i===3||i===10)continue;
    const a=i*Math.PI/8,b=(i+1)*Math.PI/8-.014;
    const point=(angle:number,inside:boolean):[number,number]=>[Math.cos(angle)*(rx-(inside?27:0)),Math.sin(angle)*(ry-(inside?37:0))];
    const outerA=point(a,false),outerB=point(b,false),innerB=point(b,true),innerA=point(a,true);
    ctx.beginPath();ctx.moveTo(...outerA);ctx.lineTo(...outerB);ctx.lineTo(...innerB);ctx.lineTo(...innerA);ctx.closePath();
    ctx.fillStyle=i%3===0?'#416c7b':'#2d5363';ctx.fill();
    ctx.strokeStyle='#a8d5da70';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...outerA);ctx.lineTo(...outerB);ctx.stroke();
    ctx.strokeStyle='#172e40';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(...innerA);ctx.lineTo(...innerB);ctx.stroke();
  }
  // A few displaced fragments reveal the ring's broken ends.
  iceFloe(ctx,rx*.51,ry*.7,52,30,false,1);iceFloe(ctx,-rx*.5,-ry*.83,37,20,false,2);
  ctx.restore();
  // Saturn's ring is a broken orbit of ice slabs, with gaps instead of parallel storm bands.
  ctx.save();ctx.translate(w*.53-camX*.025,h*.5-camY*.025);ctx.rotate(-.4);
  for(let i=0;i<26;i++) {
    const a=i*Math.PI/13;
    iceFloe(ctx,Math.cos(a)*w*.66,Math.sin(a)*h*.44,34+(i*19)%42,13+(i*7)%15,false,i);
  }
  ctx.restore();
  // Large parallax floes hang in the polar blizzard; all surfaces remain flat geometric faces.
  for(let layer=0;layer<2;layer++)for(let i=0;i<7;i++) {
    const span=w+380,par=layer?.1:.045;
    const x=((i*307+layer*151-camX*par-tick*(layer?.025:.012))%span+span)%span-190;
    const y=((i*173+layer*283-camY*par)%(h+200)+h+200)%(h+200)-100;
    iceFloe(ctx,x,y,(layer?155:65)+(i*31)%90,(layer?68:30)+(i*13)%35,!!layer,i);
  }
  // Snow travels across the gaps at different depths, with occasional larger ice flecks.
  for(let i=0;i<65;i++) {
    const speed=.6+i%4*.3;
    const x=((i*137-tick*speed-camX*.06)%(w+50)+w+50)%(w+50)-25;
    const y=((i*79+tick*speed*.26-camY*.04)%(h+30)+h+30)%(h+30)-15;
    ctx.strokeStyle=i%7===0?'#d1f3f080':'#9acbd044';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+5+i%4*2,y-2);ctx.stroke();
    if(i%13===0)panel(ctx,x,y,3,3,'#e0f7f4');
  }
  ctx.restore();
}

export function drawSaturnTile(ctx:CanvasRenderingContext2D,state:GameState,tx:number,ty:number,x:number,y:number,cover=false) {
  const color=SATURN_CHAMBER_COLORS[Math.max(0,chamberOfTile(tx,ty))];ctx.save();
  if(!cover)panel(ctx,x,y,TILE_SIZE,TILE_SIZE,'#122c36');
  if(cover) {
    // Adjacent cover tiles are one ice mass. Only exposed edges receive a bevel.
    const joined=(cx:number,cy:number)=>{
      const room=chamberOfTile(cx,cy);if(room<0||state.map[cy]?.[cx]!==T_WALL)return false;
      const [top,left,bottom,right]=CHAMBER_BOUNDS[room];return cx>left&&cx<right&&cy>top&&cy<bottom;
    };
    const top=!joined(tx,ty-1),bottom=!joined(tx,ty+1),left=!joined(tx-1,ty),right=!joined(tx+1,ty);
    const ix=left?2:0,iy=top?2:0,iw=48-ix-(right?2:0),ih=48-iy-(bottom?2:0);
    // A flat translucent ice sheet. Fine frost boundaries replace raised bevels and dark side faces.
    panel(ctx,x+ix,y+iy,iw,ih,'#91d9df90');
    panel(ctx,x+ix,y+iy,iw,ih,color+'0a');
    ctx.strokeStyle='#d5f4f073';ctx.lineWidth=1;ctx.beginPath();
    if(top){ctx.moveTo(x+ix,y+iy+.5);ctx.lineTo(x+ix+iw,y+iy+.5);}
    if(bottom){ctx.moveTo(x+ix,y+iy+ih-.5);ctx.lineTo(x+ix+iw,y+iy+ih-.5);}
    if(left){ctx.moveTo(x+ix+.5,y+iy);ctx.lineTo(x+ix+.5,y+iy+ih);}
    if(right){ctx.moveTo(x+ix+iw-.5,y+iy);ctx.lineTo(x+ix+iw-.5,y+iy+ih);}
    ctx.stroke();
    ctx.save();ctx.beginPath();ctx.rect(x+ix,y+iy,iw,ih);ctx.clip();
    const wx=tx*48,wy=ty*48;
    // Milky trapped frost ribbons continue through the connected ice, with broad clear pockets.
    const ribbon=Math.floor((wy+wx*.35)/130),start=Math.floor(wx/144)*144;
    for(let k=ribbon-1;k<=ribbon+1;k++) {
      const path=()=>{ctx.beginPath();for(let n=-1;n<=2;n++){
        const px=start+n*144,py=k*130-px*.35+Math.sin(px/144+k)*18;
        n===-1?ctx.moveTo(x+px-wx,y+py-wy):ctx.lineTo(x+px-wx,y+py-wy);
      }};
      path();ctx.strokeStyle='#c4f5ee10';ctx.lineWidth=14;ctx.stroke();
      path();ctx.strokeStyle='#e7ffff1c';ctx.lineWidth=2;ctx.stroke();
    }
    // Long asymmetric hairline fractures replace the identical cracks on individual blocks.
    const fracture=Math.floor((wx+wy*.44)/205);
    for(let k=fracture-1;k<=fracture+1;k++) {
      const yy=Math.floor(wy/96)*96;
      ctx.beginPath();
      for(let n=-1;n<=2;n++) {
        const py=yy+n*96,px=k*205-py*.44+Math.sin(py/96*2+k)*16;
        n===-1?ctx.moveTo(x+px-wx,y+py-wy):ctx.lineTo(x+px-wx,y+py-wy);
      }
      ctx.strokeStyle='#d9f7f145';ctx.lineWidth=1;ctx.stroke();
    }
    // A few bubbles and short trapped splinters add depth without outlining a tile grid.
    if((tx*7+ty*11)%4===0) {
      panel(ctx,x+14,y+23,2,3,'#e7ffff55');panel(ctx,x+28,y+31,2,2,'#c9f1f038');
      ctx.strokeStyle='#d1f3f13a';ctx.beginPath();ctx.moveTo(x+19,y+15);ctx.lineTo(x+27,y+12);ctx.stroke();
    }
    if(top)panel(ctx,x+12,y+3,10,1,'#efffff27');

    ctx.restore();
  } else {
    // Frozen floor tiles with quiet seams; frost sweeps continue across the grid.
    ctx.save();ctx.beginPath();ctx.rect(x,y,48,48);ctx.clip();
    const wx=tx*48,wy=ty*48;
    const band=Math.floor((wy-wx*.18)/170),start=Math.floor(wx/192)*192;
    for(let k=band-1;k<=band+1;k++) {
      const path=()=>{ctx.beginPath();for(let n=-1;n<=2;n++){
        const px=start+n*192,py=k*170+px*.18+Math.sin(px/192*1.7+k*2)*21;
        n===-1?ctx.moveTo(x+px-wx,y+py-wy):ctx.lineTo(x+px-wx,y+py-wy);
      }};
      // Wind-polished frost shelves have broad, quiet depth beneath a fine ice seam.
      path();ctx.strokeStyle='#75bfca09';ctx.lineWidth=32;ctx.stroke();
      path();ctx.strokeStyle='#c1f1eb15';ctx.lineWidth=2;ctx.stroke();
    }
    if((tx*13+ty*7)%19===0) {
      ctx.strokeStyle='#b2e7df24';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-4,y+12);ctx.lineTo(x+14,y+18);ctx.lineTo(x+23,y+31);ctx.lineTo(x+40,y+35);ctx.moveTo(x+23,y+31);ctx.lineTo(x+20,y+44);ctx.stroke();
    }
    // One worn frozen orbit per chamber: a landmark in the ice rather than repeated tile emblems.
    const room=chamberOfTile(tx,ty);
    if(room>=0) {
      const [px,py]=TELEPORT_PADS[room];
      if(Math.abs(tx-px)<4&&Math.abs(ty-py)<4) {
        ctx.save();ctx.translate(x+(px-tx+.5)*48,y+(py-ty+.5)*48);ctx.rotate(-.3);
        ctx.strokeStyle=color+'21';ctx.lineWidth=4;
        for(const [start,end]of [[.18,2.7],[3.05,5.8]]) {
          ctx.beginPath();for(let k=0;k<=10;k++){const angle=start+(end-start)*k/10,xx=Math.cos(angle)*125,yy=Math.sin(angle)*75;k?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.stroke();
        }
        ctx.strokeStyle='#ddfffa20';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-21,-11);ctx.lineTo(-9,-26);ctx.lineTo(15,-23);ctx.stroke();ctx.restore();
      }
    }
    // Tiny frost wisps follow one wind direction, with plenty of unmarked dark ice.
    if((tx*3+ty*11)%9===0) {
      ctx.strokeStyle='#dcfff016';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+7,y+31);ctx.lineTo(x+33,y+24);ctx.moveTo(x+14,y+35);ctx.lineTo(x+30,y+31);ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle='#afdde322';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,47,47);
  }
  ctx.restore();
}

export function drawSaturnBlizzard(ctx:CanvasRenderingContext2D,w:number,h:number,camX:number,camY:number,tick:number) {
  ctx.save();
  // Two sparse depths of fast, slanting ice. No full-screen white wash.
  for(let i=0;i<54;i++) {
    const speed=1.5+i%3*.7;
    const x=((i*113-tick*speed-camX*.2)%(w+50)+w+50)%(w+50)-25;
    const y=((i*67+tick*speed*.24-camY*.2)%(h+30)+h+30)%(h+30)-15;
    ctx.strokeStyle=i%4===0?'#ecfffc65':'#c3eaf025';ctx.lineWidth=i%7===0?2:1;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7+i%4*3,y-3-i%4);ctx.stroke();
  }
  ctx.restore();
}
