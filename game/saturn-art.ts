import { drawEnemyHealthBar } from './enemy-health-art';
import { TELEPORT_PADS, T_WALL, TILE_SIZE, chamberOfTile } from './constants';
import { isFloorTile, type Enemy, type GameState } from './engine';
import { drawSaturnShield, drawMobIceShield } from './ice-shield-art';
import { SATURN, snowballPath, saturnBlizzard } from './saturn';

export const SATURN_CHAMBER_COLORS = ['#67dce3', '#7da9f4', '#a9dfff', '#ffffff'];
export const isSaturnMap = (state: GameState) => state.trial?.boss === 'frost_warden';
const panel = (ctx: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string) => {
  ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
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
    // Broad connected glacial crystal faces; world-space facets cross tile joins.
    const joined=(cx:number,cy:number)=>state.map[cy]?.[cx]===T_WALL;
    const top=!joined(tx,ty-1),bottom=!joined(tx,ty+1),left=!joined(tx-1,ty),right=!joined(tx+1,ty);
    panel(ctx,x,y,48,48,'#386b85');
    ctx.save();ctx.beginPath();ctx.rect(x,y,48,48);ctx.clip();
    const wx=tx*48,wy=ty*48;
    ctx.translate(x-wx,y-wy);
    // Large oblique planes give the whole formation depth without tile-sized emblems.
    for(let row=Math.floor(wy/112)-1;row<=Math.floor((wy+48)/112)+1;row++){
      for(let col=Math.floor(wx/138)-1;col<=Math.floor((wx+48)/138)+1;col++){
        const px=col*138+(row%2)*41,py=row*112;
        const seed=Math.abs(col*17+row*31)%4;
        ctx.fillStyle=['#51869b','#4c8299','#6096a5','#477b96'][seed];
        ctx.beginPath();ctx.moveTo(px-18,py);ctx.lineTo(px+84,py);ctx.lineTo(px+136,py+35);ctx.lineTo(px+39,py+96);ctx.closePath();ctx.fill();
        ctx.fillStyle='#a5cdd02b';ctx.beginPath();ctx.moveTo(px-18,py);ctx.lineTo(px+84,py);ctx.lineTo(px+39,py+96);ctx.lineTo(px+22,py+61);ctx.closePath();ctx.fill();
        ctx.strokeStyle='#b5e2df35';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px+84,py);ctx.lineTo(px+39,py+96);ctx.lineTo(px+57,py+111);ctx.stroke();
      }
    }
    ctx.restore();
    // Snow rests only on exposed tops; quiet cold edges preserve the solid footprint.
    if(top){panel(ctx,x,y,48,3,'#d8eff0');panel(ctx,x,y+3,48,2,'#93c5d2');
      if((tx*7+ty)%3===0)panel(ctx,x+7,y+3,13,3,'#c7e7e9');}
    if(left)panel(ctx,x,y+(top?5:0),2,48-(top?5:0),'#97c5d3');
    if(right)panel(ctx,x+46,y+(top?5:0),2,48-(top?5:0),'#234761');
    if(bottom)panel(ctx,x,y+46,48,2,'#22455f');
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

export function drawSaturnBlizzard(ctx:CanvasRenderingContext2D,w:number,h:number,camX:number,camY:number,tick:number,level=1) {
  ctx.save();
  // Two sparse depths of fast, slanting ice. No full-screen white wash.
  for(let i=0;i<40+level*25;i++) {
    const speed=(1.5+i%3*.7)*(1+level*.45);
    const x=((i*113-tick*speed-camX*.2)%(w+50)+w+50)%(w+50)-25;
    const y=((i*67+tick*speed*.24-camY*.2)%(h+30)+h+30)%(h+30)-15;
    ctx.strokeStyle=i%4===0?'#ecfffc65':'#c3eaf025';ctx.lineWidth=i%7===0?2:1;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7+i%4*3,y-3-i%4);ctx.stroke();
    if(i%11===0)drawSaturnSnowflake(ctx,x,y,4, '#d9faff99',tick*.008);
  }
  ctx.restore();
}

export function drawSaturnSnowflake(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color='#c7f4ff',angle=0){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.fillStyle=color;
  const width=Math.max(2,Math.round(r*.18));
  for(let i=0;i<6;i++){
    ctx.rotate(Math.PI/3);ctx.fillRect(0,-width/2,r,width);
    for(const side of [-1,1]){ctx.save();ctx.translate(r*.55,0);ctx.rotate(side*Math.PI/4);ctx.fillRect(0,-width/2,r*.4,width);ctx.restore();}
  }ctx.restore();
}
export function drawSnowball(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,tick:number,patches=true){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='#99cddc';ctx.beginPath();ctx.moveTo(-r*.5,-r);ctx.lineTo(r*.5,-r);ctx.lineTo(r*.5,-r*.7);ctx.lineTo(r,-r*.7);ctx.lineTo(r,r*.6);ctx.lineTo(r*.6,r*.6);ctx.lineTo(r*.6,r);ctx.lineTo(-r*.6,r);ctx.lineTo(-r*.6,r*.6);ctx.lineTo(-r,r*.6);ctx.lineTo(-r,-r*.6);ctx.lineTo(-r*.5,-r*.6);ctx.closePath();ctx.fill();
  ctx.fillStyle='#e3faff';ctx.fillRect(-r*.7,-r*.6,r*1.35,r*1.15);ctx.fillRect(-r*.4,-r*.85,r*.8,r*1.6);
  ctx.fillStyle='#fff';ctx.fillRect(-r*.45,-r*.65,r*.55,r*.22);
  if(patches){ctx.fillStyle='#b7dce7';ctx.fillRect(r*.15,r*.1,r*.35,r*.2);ctx.fillRect(-r*.35,r*.35,r*.3,r*.15);}
  ctx.restore();
}
export function drawRollTiles(ctx:CanvasRenderingContext2D,tiles:[number,number][],camX:number,camY:number,hostile=false){
  tiles.forEach(([tx,ty],i)=>{
    const x=tx*TILE_SIZE-camX,y=ty*TILE_SIZE-camY;
    ctx.fillStyle=hostile?'#e7a6c522':'#b4f5ff22';ctx.fillRect(x+5,y+5,38,38);
    ctx.strokeStyle=i===tiles.length-1?(hostile?'#ffe3ee':'#efffff'):(hostile?'#e9b1c9bb':'#91dceba0');ctx.lineWidth=4;ctx.strokeRect(x+5,y+5,38,38);
  });
}
export function drawSaturnGround(ctx:CanvasRenderingContext2D,s:GameState,camX:number,camY:number){
  const t=s.saturn;if(!t)return;ctx.save();ctx.shadowBlur=0;
  for(const [x,y] of t.nextIce){ctx.strokeStyle='#a9e5ff77';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.strokeRect(x*48-camX+3,y*48-camY+3,42,42);ctx.setLineDash([]);drawSaturnSnowflake(ctx,(x+.5)*48-camX,(y+.5)*48-camY,14,'#c7f4ff40');}
  for(const i of t.icicles){
    const x=(i.x+.5)*48-camX,y=(i.y+.5)*48-camY;
    if(i.landed){
      const age=24-i.ticks,fade=i.ticks/24,r=12+age*1.5;ctx.globalAlpha=fade;
      ctx.strokeStyle='#c7f4ff';ctx.lineWidth=3;ctx.strokeRect(x-r,y-r,r*2,r*2);
      for(let n=0;n<8;n++){ctx.save();ctx.translate(x,y);ctx.rotate(n*Math.PI/4);ctx.fillStyle=n%2?'#8fc5e5':'#e7ffff';ctx.fillRect(8+age*1.6,-2,8+(n%3)*3,4);ctx.fillRect(22+age*1.9,2,4,4);ctx.restore();}
      ctx.globalAlpha=1;continue;
    }
    const progress=1-i.ticks/SATURN.icicleWarning;
    // The Weaver's warning grammar: connected floor wash, luminous exposed edges and a central cue.
    ctx.save();
    const inArea=(tx:number,ty:number)=>Math.abs(tx-i.x)<=1&&Math.abs(ty-i.y)<=1&&isFloorTile(s.map,tx,ty);
    ctx.globalAlpha=.1+progress*.08;ctx.fillStyle='#8cd6f3';
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(inArea(i.x+dx,i.y+dy))ctx.fillRect((i.x+dx)*48-camX,(i.y+dy)*48-camY,48,48);}
    ctx.globalAlpha=.6+progress*.3;ctx.strokeStyle='#b8efff';ctx.shadowColor='#8bd7f2';ctx.shadowBlur=4;ctx.lineWidth=3;ctx.beginPath();
    for(let ty=i.y-1;ty<=i.y+1;ty++)for(let tx=i.x-1;tx<=i.x+1;tx++){
      if(!inArea(tx,ty))continue;const px=tx*48-camX,py=ty*48-camY;
      if(!inArea(tx-1,ty)){ctx.moveTo(px+1,py);ctx.lineTo(px+1,py+48);}if(!inArea(tx+1,ty)){ctx.moveTo(px+47,py);ctx.lineTo(px+47,py+48);}
      if(!inArea(tx,ty-1)){ctx.moveTo(px,py+1);ctx.lineTo(px+48,py+1);}if(!inArea(tx,ty+1)){ctx.moveTo(px,py+47);ctx.lineTo(px+48,py+47);}
    }ctx.stroke();ctx.shadowBlur=0;
    const size=14+Math.round(progress*8);ctx.globalAlpha=.8;ctx.strokeRect(x-size,y-size,size*2,size*2);
    ctx.fillStyle='#d4f7ff';ctx.fillRect(x-2,y-10,4,14);ctx.fillRect(x-2,y+8,4,4);ctx.restore();
    // A short accelerating drop, rather than a slowly hovering stick.
    if(i.ticks<=SATURN.icicleFallTicks){
      const fall=1-i.ticks/SATURN.icicleFallTicks,height=220*(1-fall*fall),tip=y-height;
      ctx.fillStyle='#9adcf02a';ctx.fillRect(x-6,tip-106,12,65);
      panel(ctx,x-12,tip-49,24,23,'#5c9fc4');panel(ctx,x-9,tip-26,18,11,'#70b8d5');
      panel(ctx,x-6,tip-15,12,7,'#91d3e5');panel(ctx,x-3,tip-8,6,8,'#d8faff');
      panel(ctx,x-8,tip-47,6,23,'#e7ffff');panel(ctx,x-5,tip-25,4,13,'#e7ffff');panel(ctx,x+7,tip-46,4,20,'#38749c');
    }
  }
  if(t.charging){
    drawRollTiles(ctx,snowballPath(s),camX,camY);
  }
  for(const e of s.enemies){
    if(e.type!=='frost_raider'||e.windupTicks<=0)continue;
    const tiles:[number,number][]=[];
    for(let n=1;n<=SATURN.thiefRange;n++){const x=e.tileX+e.chargeDirX*n,y=e.tileY+e.chargeDirY*n;if(!isFloorTile(s.map,x,y))break;tiles.push([x,y]);}
    drawRollTiles(ctx,tiles,camX,camY,true);
  }
  for(const fx of t.effects){
    const x=fx.x-camX,y=fx.y-camY;
    if(fx.kind==='shove'){
      const age=18-fx.ticks,r=9+age*1.3;ctx.globalAlpha=fx.ticks/18;ctx.strokeStyle='#c8f1ff';ctx.lineWidth=3;ctx.strokeRect(x-r,y-r,r*2,r*2);
      for(let k=0;k<4;k++){ctx.save();ctx.translate(x,y);ctx.rotate(k*Math.PI/2);panel(ctx,r+4,-2,6,4,'#91cde9');ctx.restore();}
    }else{const r=12+(30-fx.ticks)*1.5;ctx.globalAlpha=fx.ticks/30;ctx.strokeStyle=fx.kind==='break'?'#ffffff':'#91f0e0';ctx.lineWidth=3;ctx.strokeRect(x-r,y-r,r*2,r*2);}
  }
  ctx.restore();
}
export function drawSaturnUnit(ctx:CanvasRenderingContext2D,e:Enemy,x:number,y:number,tick:number){
  if(e.type!=='frost_raider'&&e.type!=='ice_caller'&&e.type!=='rime_brute')return false;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;
  if(e.flashTicks>0)ctx.filter='brightness(1.8)';
  const id=e.id??0;
  if(e.type==='frost_raider'){
    // A living snowball, distinct from the plain player roll by its two cold pin-eyes.
    const wind=e.windupTicks>0,rolling=(e.frostRollLeft??0)>0;
    const bob=rolling?0:wind?2:Math.round(Math.sin(tick*.1+id));
    ctx.translate(0,bob);drawSnowball(ctx,0,0,wind?16:19,tick,false);
    panel(ctx,-8,-5,4,5,'#2e617e');panel(ctx,4,-5,4,5,'#2e617e');
    if(rolling){ctx.globalAlpha=.3;panel(ctx,-26,6,7,4,'#e0f6ff');panel(ctx,20,9,5,3,'#d2efff');ctx.globalAlpha=1;}
  }else if(e.type==='ice_caller'){
    // One bold crystal body and two small detached shards, built like Neptune's clear silhouettes.
    const cast=e.shootTicks>0,progress=cast?1-Math.min(1,e.shootTicks/30):0,spell=cast?Math.sin(progress*Math.PI):0;
    const bob=Math.round(Math.sin(tick*.055+id)*2-spell*3);ctx.translate(0,bob);
    ctx.shadowColor='#76c8f0';ctx.shadowBlur=4;
    panel(ctx,-4,-25,8,5,'#8bd9f5');panel(ctx,-9,-20,18,7,'#8bd9f5');
    panel(ctx,-14,-13,28,25,'#6cb7e0');panel(ctx,-9,12,18,7,'#6cb7e0');panel(ctx,-4,19,8,5,'#6cb7e0');ctx.shadowBlur=0;
    panel(ctx,-9,-11,18,22,'#28658f');panel(ctx,-6,-17,5,11,'#c5f4ff');
    panel(ctx,-3,-9,6,18,e.shootTicks>0?'#ffffff':'#a9eaff');panel(ctx,7,-8,4,16,'#3d85b6');
    for(const side of [-1,1]){ctx.save();ctx.translate(side*(21+spell*7),side*4+Math.round(Math.sin(tick*.06+side)*2)-spell*8);ctx.rotate(side*(.3+spell*.2));panel(ctx,-3,-9,6,18,'#5e9dd0');panel(ctx,-2,-7,3,11,'#b5eaff');ctx.restore();}
    if(cast){
      ctx.globalAlpha=.55*(1-progress);ctx.strokeStyle='#b8edff';ctx.lineWidth=2;const r=18+progress*14;ctx.strokeRect(-r,-r,r*2,r*2);
      for(let k=0;k<3;k++){ctx.globalAlpha=(1-progress)*.8;panel(ctx,-14+k*13,-27-progress*18-(k%2)*5,4,6,k===1?'#eaffff':'#a5dcf4');}
      ctx.globalAlpha=1;
    }
  }else{
    // Ice Cub borrows the normal alien's construction, with its own frosted face and material.
    const hit=e.shootTicks>0;
    const size=Math.floor(TILE_SIZE*.9),half=size/2,pad=Math.max(2,Math.floor(size*.12));
    const nudge=hit?Math.round(Math.sin((1-Math.min(1,e.shootTicks/24))*Math.PI)*5):0;ctx.translate((e.chargeDirX||(!e.chargeDirY?1:0))*nudge,(e.chargeDirY||0)*nudge);
    ctx.shadowColor='#94cde9';ctx.shadowBlur=8;panel(ctx,-half,-half,size,size,'#94cde9');ctx.shadowBlur=0;
    panel(ctx,-half+pad,-half+pad,size-pad*2,size-pad*2,'#00000044');
    panel(ctx,-half+pad,-half+pad,size-pad*2,3,'#e9fbff88');panel(ctx,-half+pad,-half+pad+3,3,10,'#e9fbff77');
    panel(ctx,half-pad-7,6,7,9,'#4b91b555');panel(ctx,-half+pad+2,half-pad-5,12,3,'#d0f3f544');
    // Fine right-angle frost seams stay behind the face, rather than diagonal facet panels.
    panel(ctx,5,2,2,9,'#c8f2ff55');panel(ctx,5,9,9,2,'#c8f2ff55');
    const antenna=Math.max(3,Math.floor(size*.28));panel(ctx,-1,-half-antenna,2,antenna,'#94cde9');
    ctx.shadowColor='#dffaff';ctx.shadowBlur=6;panel(ctx,-1,-half-antenna-3,3,3,'#ffffff');ctx.shadowBlur=0;
    panel(ctx,-12,-8,24,9,'#225b78');panel(ctx,-9,-5,6,3,'#ccf9ff');panel(ctx,4,-5,6,3,'#a2e9fc');
    panel(ctx,-5,6,7,2,'#245b75');panel(ctx,1,6,2,4,'#245b75');panel(ctx,1,9,5,2,'#245b75');
  }
  ctx.filter='none';ctx.restore();ctx.save();
  if(e.icyShieldHP>0)drawMobIceShield(ctx,x,y,e.type==='rime_brute'?27:25,tick);
  drawEnemyHealthBar(ctx,e,x,y);
  ctx.restore();return true;
}
export function drawSaturnPlayer(ctx:CanvasRenderingContext2D,s:GameState,x:number,y:number){
  const t=s.saturn;if(!t?.charging&&!t?.roll)return false;
  ctx.save();
  if(t.roll){for(let i=3;i>0;i--){ctx.globalAlpha=.15*(4-i);drawSnowball(ctx,x-t.roll.dx*i*12,y-t.roll.dy*i*12,18,s.gameTick-i*4);}ctx.globalAlpha=1;}
  drawSnowball(ctx,x,y,19+(t.charging?t.charge/SATURN.chargeTicks*5:3),s.gameTick);
  if(s.playerShieldHP>0)drawSaturnShield(ctx,x,y,30,s.gameTick);
  if(s.playerCarryingRuby&&s.rubyShieldHP>0)drawSaturnShield(ctx,x,y,40,s.gameTick);
  if(s.playerCarryingRuby){panel(ctx,x-5,y-5,10,10,'#ff6696');panel(ctx,x-2,y-3,4,4,'#fff0f5');}
  ctx.restore();return true;
}
export function drawSaturnBarrier(ctx:CanvasRenderingContext2D,s:GameState,x:number,y:number){
  const t=s.saturn;if(!t)return;ctx.save();ctx.shadowBlur=0;
  if(t.barrier>0){
    drawMobIceShield(ctx,x,y,34,s.gameTick);
    ctx.fillStyle='#b1eaff16';ctx.fillRect(x-36,y-36,72,72);
    for(let i=0;i<4;i++){ctx.save();ctx.translate(x,y);ctx.rotate(i*Math.PI/2);panel(ctx,-10,-46,20,7,'#91d9ee');drawSaturnSnowflake(ctx,0,-45,8,'#f2ffff',s.gameTick*.012);ctx.restore();}
  }else{ctx.globalAlpha=.6;drawSaturnSnowflake(ctx,x,y+43,16,'#a7d1e4');}
  ctx.restore();
}

// Foreground weather: increasing blue pressure, sweeping gusts and close snow.
// Kept below the minimap/HUD; no gameplay footprint or renderer-side state changes.
export function drawSaturnShatter(ctx:CanvasRenderingContext2D,s:GameState,w:number,h:number,camX:number,camY:number,zoom=1){
  const fx=s.saturn?.shatter;if(!fx)return;
  const age=SATURN.shatterTicks-fx.ticks,life=age/SATURN.shatterTicks,fade=Math.max(0,1-life);
  const x=Math.max(w*.15,Math.min(w*.85,(fx.x-camX)*zoom)),y=Math.max(h*.15,Math.min(h*.85,(fx.y-camY)*zoom));
  ctx.save();ctx.shadowBlur=0;
  // A single cold impact flash, followed by whole ice faces separating from the screen.
  ctx.globalAlpha=Math.max(0,1-age/8)*.28;ctx.fillStyle='#eaffff';ctx.fillRect(0,0,w,h);
  const reach=Math.hypot(w,h),spread=Math.max(0,age-5)/61;
  for(let i=0;i<9;i++){
    const angle=i*Math.PI*2/9-.22,a=angle-.28,b=angle+.3;
    const shift=spread*spread*(90+i%3*25),dx=Math.cos(angle)*shift,dy=Math.sin(angle)*shift+spread*spread*80;
    ctx.save();ctx.translate(Math.round(x+dx),Math.round(y+dy));
    ctx.beginPath();ctx.moveTo(Math.cos(angle)*34,Math.sin(angle)*34);
    ctx.lineTo(Math.cos(a)*reach*.48,Math.sin(a)*reach*.48);ctx.lineTo(Math.cos(a+.07)*reach,Math.sin(a+.07)*reach);
    ctx.lineTo(Math.cos(b)*reach,Math.sin(b)*reach);ctx.lineTo(Math.cos(b-.06)*reach*.43,Math.sin(b-.06)*reach*.43);ctx.closePath();
    ctx.globalAlpha=fade*fade*.075;ctx.fillStyle=i%2?'#b6eeff':'#76bcd9';ctx.fill();
    ctx.globalAlpha=fade*fade*.48;ctx.strokeStyle='#a1deef';ctx.lineWidth=3;ctx.stroke();
    ctx.globalAlpha=fade*fade*.75;ctx.strokeStyle='#edffff';ctx.lineWidth=1;ctx.stroke();ctx.restore();
  }
  // Bold, independently tumbling rectangular fragments use the existing ice palette.
  for(let i=0;i<34;i++){
    const angle=i*2.399963,dist=28+(i%7)*25+life*(160+i%5*90),gravity=life*life*150;
    const px=x+Math.cos(angle)*dist,py=y+Math.sin(angle)*dist*.7+gravity;
    ctx.save();ctx.translate(Math.round(px),Math.round(py));ctx.rotate(angle+life*(i%2?2:-2));
    const sw=6+i%4*4,sh=12+i%5*7;
    ctx.globalAlpha=fade*fade*.85;ctx.fillStyle='#75bfdc';ctx.fillRect(-sw/2,-sh/2,sw,sh);
    ctx.fillStyle='#ecffff';ctx.fillRect(-sw/2,-sh/2,Math.max(2,sw*.3),sh*.7);ctx.restore();
  }
  ctx.restore();
}

export function drawSaturnAtmosphere(ctx:CanvasRenderingContext2D,s:GameState,w:number,h:number){
  if(!saturnBlizzard(s))return;
  const level=s.saturn!.level,tick=s.gameTick;
  ctx.save();ctx.shadowBlur=0;
  ctx.fillStyle=`rgba(114,169,224,${[.025,.08,.16][level-1]})`;ctx.fillRect(0,0,w,h);
  const edge=ctx.createRadialGradient(w*.5,h*.5,Math.min(w,h)*.22,w*.5,h*.5,Math.max(w,h)*.65);
  edge.addColorStop(0,'#85cfff00');edge.addColorStop(1,`rgba(161,214,249,${[.06,.17,.3][level-1]})`);
  ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
  for(let i=0;i<level*5;i++){
    const x=((i*317-tick*(6+level*3))%(w+600)+w+600)%(w+600)-300;
    const y=((i*139+tick*.6)%(h+150)+h+150)%(h+150)-75;
    ctx.fillStyle=`rgba(209,241,255,${.015+level*.012})`;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+270,y-58);ctx.lineTo(x+410,y-45);ctx.lineTo(x+70,y+12);ctx.closePath();ctx.fill();
  }
  for(let i=0;i<level*28;i++){
    const x=((i*167-tick*(3+level*2+i%4))%(w+90)+w+90)%(w+90)-45;
    const y=((i*83+tick*(.6+i%3*.3))%(h+80)+h+80)%(h+80)-40;
    ctx.fillStyle=i%5?'#dcf6ff77':'#efffffaa';ctx.fillRect(Math.round(x),Math.round(y),3+(i%3)*2,2);
    if(i%17===0)drawSaturnSnowflake(ctx,x,y,5+i%4,'#dff8ff99',-.2);
  }
  ctx.restore();
}
