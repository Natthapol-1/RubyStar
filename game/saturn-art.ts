import { drawEnemyHealthBar } from './enemy-health-art';
import { TELEPORT_PADS, T_WALL, TILE_SIZE, chamberOfTile } from './constants';
import { isFloorTile, type Enemy, type GameState } from './engine';
import { drawMobIceShield } from './ice-shield-art';
import { SATURN, SATURN_BACKLASH_TICKS, SATURN_COUNTER_FX_TICKS, saturnBlizzard, saturnBoss } from './saturn';

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
  // A sparse twinkling starfield and the distant ringed planet with two small moons.
  for(let i=0;i<40;i++){const sx=((i*389.7-camX*.006)%w+w)%w,sy=(i*157.3)%(h*.55);ctx.globalAlpha=.2+.25*Math.max(0,Math.sin(tick*.025+i*2.3));ctx.fillStyle=i%6?'#cfeff0':'#fff3d6';ctx.fillRect(Math.round(sx),Math.round(sy),i%7?2:3,i%7?2:3);}
  {
    const px=w*.83-camX*.008,py=h*.2-camY*.006,r=Math.min(78,h*.12),tilt=-.18;
    const ring=(front:boolean)=>{ctx.save();ctx.translate(px,py);ctx.rotate(tilt);for(let k=0;k<3;k++){ctx.globalAlpha=front?.42-k*.1:.22-k*.05;ctx.strokeStyle=['#ddfaff','#a6d6dc','#649fa5'][k];ctx.lineWidth=5-k;ctx.beginPath();ctx.ellipse(0,0,r*(1.75+k*.18),r*(.38+k*.04),0,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();}ctx.restore();};
    ring(false);
    for(let row=-r;row<r;row+=6){const half=Math.round(Math.sqrt(r*r-row*row)/6)*6,band=Math.floor((row+r)/14)%3;ctx.globalAlpha=.55;ctx.fillStyle=['#89e7e4','#70b9c4','#5d9cab'][band];ctx.fillRect(Math.round(px-half),Math.round(py+row),half*2,6);ctx.globalAlpha=.4;ctx.fillStyle='#0d2430';ctx.fillRect(Math.round(px+half*.3),Math.round(py+row),Math.round(half*.7),6);}
    ring(true);
    for(const [d,s,o] of [[2.4,6,0],[3.1,4,2]] as const){const a=tick*.0015*(o?-1:1)+o;ctx.globalAlpha=.5;ctx.fillStyle='#c9dcd8';ctx.fillRect(Math.round(px+Math.cos(a)*r*d),Math.round(py+Math.sin(a)*r*d*.3),s,s);}
  }
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

// ─── Her ice: grant and recall cues, beams and the time-stop field ──────────
// Grants are cyan and square (she gives); recalls are violet and diamond-shaped (she takes back), so they never read alike.

export const GRANT_COLOR = '#9ff1ff', RECALL_COLOR = '#c39bff', REVERSE_GRANT_COLOR = '#ffd05f';
const ICE_DEEP = '#6fc3e8', TIME = '#f2f8ff';
const GRANT_RING_TICKS = 90; // the closing ring appears for the last 1.5s before a grant lands

/** Grant cue: a cyan square closing onto the unit, landing on its outline exactly when the ice arrives. */
function grantRing(ctx: CanvasRenderingContext2D, x: number, y: number, left: number, color = GRANT_COLOR) {
  const p = 1 - Math.min(1, left / GRANT_RING_TICKS), r = Math.round(24 + (1 - p) * 36);
  x = Math.round(x); y = Math.round(y);
  ctx.save(); ctx.globalAlpha = .4 + .55 * p; ctx.strokeStyle = color; ctx.lineWidth = 3 + Math.round(p * 2);
  ctx.strokeRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = '#ffffff'; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(x + sx * r - 4, y + sy * r - 4, 8, 8);
  ctx.globalAlpha = .9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x - 24, y - 24, 48, 48);
  if (left <= SATURN.fieldTicks) { ctx.globalAlpha = .22 + .22 * Math.abs(Math.sin(left * .5)); ctx.fillStyle = color; ctx.fillRect(x - 24, y - 24, 48, 48); }
  ctx.restore();
}
/** Recall cue: a violet diamond closing onto the unit with four chevrons pointing back toward her. */
function recallRing(ctx: CanvasRenderingContext2D, x: number, y: number, left: number, toX: number, toY: number) {
  const p = 1 - left / SATURN.recallWarning, r = Math.round(30 + (1 - p) * 44);
  x = Math.round(x); y = Math.round(y);
  ctx.save(); ctx.translate(x, y);
  ctx.save(); ctx.rotate(Math.PI / 4); ctx.globalAlpha = .4 + .55 * p; ctx.strokeStyle = RECALL_COLOR; ctx.lineWidth = 4 + Math.round(p * 2);
  const d = Math.round(r * .72); ctx.strokeRect(-d, -d, d * 2, d * 2);
  ctx.globalAlpha = .9; ctx.strokeStyle = '#efe4ff'; ctx.lineWidth = 2; ctx.strokeRect(-24, -24, 48, 48); ctx.restore();
  // Chevrons along the line to her, sliding toward her.
  const a = Math.atan2(toY - y, toX - x), slide = (1 - left % 30 / 30) * 14;
  ctx.rotate(a); ctx.fillStyle = RECALL_COLOR; ctx.globalAlpha = .55 + .4 * p;
  for (let k = 0; k < 3; k++) { const cx = 34 + k * 14 + slide; ctx.fillRect(cx - 6, -9, 6, 6); ctx.fillRect(cx, -3, 6, 6); ctx.fillRect(cx - 6, 3, 6, 6); }
  if (left <= SATURN.fieldTicks) { ctx.rotate(-a + Math.PI / 4); ctx.globalAlpha = .22 + .22 * Math.abs(Math.sin(left * .5)); ctx.fillStyle = RECALL_COLOR; ctx.fillRect(-24, -24, 48, 48); }
  ctx.restore();
}
function iceBeam(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, alpha: number, color: string, width: number, dashed = false) {
  ctx.save(); ctx.lineCap = 'square'; if (dashed) ctx.setLineDash([10, 10]);
  ctx.globalAlpha = alpha * .4; ctx.strokeStyle = color; ctx.lineWidth = width * 2.2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.globalAlpha = alpha; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, width * .5); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}
/** Square motes travelling along a beam: toward the target for a grant, back toward her for a recall. */
function beamMotes(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, tick: number, color: string, alpha: number) {
  ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha;
  for (let k = 0; k < 5; k++) { const t = ((tick * .02 + k / 5) % 1); ctx.fillRect(Math.round(x1 + (x2 - x1) * t) - 3, Math.round(y1 + (y2 - y1) * t) - 3, 6, 6); }
  ctx.restore();
}

/** Shared grant mark for gameplay and the rule-sheet example. */
export function drawSaturnGrantMark(ctx:CanvasRenderingContext2D,x:number,y:number,fromX:number,fromY:number,left:number,tick:number,reversed=false) {
  const p=1-left/SATURN.grantInterval;
  const color = reversed ? REVERSE_GRANT_COLOR : GRANT_COLOR;
  iceBeam(ctx,fromX,fromY,x,y,.12+.25*p,color,3,true);
  if(left<=GRANT_RING_TICKS){beamMotes(ctx,fromX,fromY,x,y,tick,color,.7);grantRing(ctx,x,y,left,color);}
  drawSaturnSnowflake(ctx,x,y-42,10,reversed?REVERSE_GRANT_COLOR:'#e8fbff',tick*.05);
}

/** Small time-stop asterisk glitter: a bright white line and restrained icy glow. */
function drawZeroCrystalParticle(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,alpha:number,angle:number,shine=.6){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.shadowBlur=0;ctx.lineCap='butt';ctx.lineJoin='miter';ctx.beginPath();
  for(let arm=0;arm<6;arm++){
    const a=arm*Math.PI/3,c=Math.cos(a),sn=Math.sin(a);ctx.moveTo(0,0);ctx.lineTo(c*r,sn*r);
  }
  // Additive ice-blue light spills past the white skeleton, with a brief sharper twinkle.
  ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha*(.28+shine*.35);ctx.strokeStyle='#8cdfff';ctx.shadowColor='#6dd4ff';ctx.shadowBlur=6;ctx.lineWidth=2.8;ctx.stroke();
  ctx.globalAlpha=Math.min(1,alpha*1.4);ctx.strokeStyle='#ffffff';ctx.shadowColor='#e0faff';ctx.shadowBlur=3;ctx.lineWidth=1.2+shine*.25;ctx.stroke();
  ctx.shadowBlur=0;ctx.globalAlpha=Math.min(1,alpha*(.65+shine*.6));ctx.fillStyle='#ffffff';ctx.fillRect(-.8,-.8,1.6,1.6);
  ctx.restore();
}

function drawTimeField(ctx: CanvasRenderingContext2D, t: NonNullable<GameState['saturn']>, camX: number, camY: number) {
  const f=t.field;if(!f)return;
  const age=1-f.ticks/SATURN.fieldTicks,fade=Math.max(0,Math.min(1,(.86-age)/.25)),radius=SATURN.fieldRadius*TILE_SIZE;
  const x=Math.round(f.x-camX),y=Math.round(f.y-camY);
  ctx.save();ctx.translate(x,y);ctx.shadowBlur=0;
  // A quiet square wash and suspended snow keep the corners visible after the front passes.
  const fieldFade=Math.min(1,f.ticks/12),outer=radius*1.16,feather=outer-radius;
  ctx.save();ctx.beginPath();ctx.rect(-outer,-outer,outer*2,outer*2);ctx.clip();
  // Keep the original square visible; only the added outer margin fades away.
  ctx.globalAlpha=fieldFade*.055;panel(ctx,-radius,-radius,radius*2,radius*2,'#c3ecff');
  for(let band=0;band<24;band++){
    const inner=radius+feather*band/24,extent=radius+feather*(band+1)/24;
    ctx.globalAlpha=fieldFade*.055*(1-(band+.5)/24);ctx.fillStyle='#c3ecff';
    ctx.beginPath();ctx.rect(-extent,-extent,extent*2,extent*2);ctx.rect(-inner,-inner,inner*2,inner*2);ctx.fill('evenodd');
  }
  for(let i=0;i<72;i++){
    const px=(((i*97+19)%307)/307-.5)*outer*1.9;
    const py=(((i*163+71)%311)/311-.5)*outer*1.9+age*(10+i%4*4);
    const edge=Math.max(0,Math.min(1,(outer-Math.max(Math.abs(px),Math.abs(py)))/feather));
    ctx.globalAlpha=fieldFade*edge*(i%4?.24:.4);
    if(i%8===0)drawZeroCrystalParticle(ctx,px,py,3.5,fieldFade*edge*.35,age*.18);
    else panel(ctx,px,py,i%3?2:3,i%3?3:5,'#e7f9ff');
  }
  for(const dx of [-1,1])for(const dy of [-1,1]){
    ctx.globalAlpha=fieldFade*.35;
    drawZeroCrystalParticle(ctx,dx*radius*.86,dy*radius*.86+age*10,3.5,fieldFade*.28,age*.3);
  }
  ctx.restore();
  // A pale snowflake expands under the separated crystalline pressure fronts.
  const travel=Math.min(1,age*2.2),reach=radius*(.06+.94*(1-(1-travel)*(1-travel)));
  ctx.globalAlpha=fade*.15;drawSaturnSnowflake(ctx,0,0,reach,'#c2eaff');
  for(let echo=0;echo<3;echo++){
    const p=Math.min(1,age*2.2-echo*.095);if(p<0)continue;
    const r=radius*(.06+.94*(1-(1-p)*(1-p))),strength=fade*(1-echo*.28);
    for(let arm=0;arm<6;arm++){
      ctx.save();ctx.rotate(arm*Math.PI/3);
      const span=16+r*.18;
      ctx.globalAlpha=strength*.12;panel(ctx,-span,-r-7,span*2,15,'#79cce6');
      ctx.globalAlpha=strength*.8;panel(ctx,-span,-r-2,span*2,5,'#a0e6f5');
      ctx.globalAlpha=strength;panel(ctx,-span*.75,-r-1,span*1.5,2,'#f2fcff');
      if(echo===0){
        // Ice branches fork toward the wave's leading tips, like a snow crystal.
        ctx.globalAlpha=fade*.85;panel(ctx,-2,-r-12,4,30,'#d9f7ff');
        for(const side of [-1,1]){
          ctx.save();ctx.translate(0,-r+5);ctx.rotate(side*Math.PI/4);
          panel(ctx,-1,-17,3,17,'#a6e9ff');panel(ctx,-.5,-17,1,12,'#ffffff');ctx.restore();
        }
      }
      ctx.restore();
    }
  }
  // Detached snow crystals and short frozen streaks follow the front.
  for(let i=0;i<18;i++){
    const angle=i*Math.PI/9+.12,d=reach*(.62+i%3*.12);
    ctx.globalAlpha=fade*(i%3?.45:.7);
    if(i%3!==0){ctx.save();ctx.rotate(angle);panel(ctx,d-13,-1,13,3,'#b4e9fa');ctx.restore();}
  }
  // Mini crystals alone move independently; the field, large snowflake and wave stay unchanged.
  for(let i=0;i<12;i++){
    const delay=i%4*.015,life=(age-delay)/(1-delay);if(life<=0||life>=1)continue;
    const a=i*2.39996,d=14+radius*(.35+i%7*.1)*Math.pow(life,.78);
    const px=Math.cos(a)*d,py=Math.sin(a)*d-life*(10+i%3*5),opacity=Math.min(1,life*12)*Math.pow(1-life,.7);
    drawZeroCrystalParticle(ctx,px,py,(6+i%4*2)*.5,opacity,a+life*(i%2?.9:-.7),Math.pow(Math.max(0,Math.sin(life*12+i*1.9)),4));
  }
  ctx.restore();
}

function drawFieldHourglass(ctx:CanvasRenderingContext2D,t:NonNullable<GameState['saturn']>,x:number,y:number){
  const f=t.field;if(!f)return;
  const age=1-f.ticks/SATURN.fieldTicks,flip=Math.min(1,age/.82),turn=flip*flip*(3-2*flip);
  const alpha=.4*Math.min(1,f.ticks/10);
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(turn*Math.PI);ctx.scale(2.35,2.35);ctx.shadowBlur=0;
  // Stepped glass, rim and sand are solid blocks; the complete symbol flips as one piece.
  const rows=[[-24,-30,48,8],[-20,-22,40,7],[-14,-15,28,7],[-8,-8,16,16],[-14,8,28,7],[-20,15,40,7],[-24,22,48,8]];
  for(const [left,top,width,height] of rows){
    ctx.globalAlpha=alpha*.25;panel(ctx,left,top,width,height,'#77c6e8');
    ctx.globalAlpha=alpha;panel(ctx,left,top,4,height,'#e7faff');panel(ctx,left+width-4,top,4,height,'#c5e7ff');
  }
  ctx.globalAlpha=alpha;panel(ctx,-29,-38,58,6,'#d9f3ff');panel(ctx,-29,32,58,6,'#d9f3ff');
  ctx.globalAlpha=alpha*.6;panel(ctx,-25,-32,50,3,'#91c9e9');panel(ctx,-25,29,50,3,'#91c9e9');
  ctx.globalAlpha=alpha*.85;
  for(let i=0;i<4;i++){
    panel(ctx,-16+i*4,-26+i*4,32-i*8,4,'#b4edff');
    panel(ctx,-4-i*4,12+i*4,8+i*8,4,'#b4edff');
  }
  ctx.globalAlpha=alpha;panel(ctx,-2,-5,4,4,'#f5fdff');panel(ctx,-1,2,2,5,'#f5fdff');
  ctx.restore();
}

export function drawSaturnGround(ctx: CanvasRenderingContext2D, s: GameState, camX: number, camY: number) {
  const t = s.saturn; if (!t) return;
  const tick = s.gameTick, boss = saturnBoss(s);
  ctx.save(); ctx.shadowBlur = 0;
  // Departed footsteps are tinted immediately, before becoming hazardous frozen tiles.
  const trailWarnings = [
    ...(t.frostTrail ?? []).map(tile => ({ ...tile, opacity: 1 })),
    ...(t.trailFades ?? []).map(tile => ({ ...tile, ticks: tile.footprintTicks, opacity: tile.ticks / SATURN.trailReplaceFadeTicks })),
  ];
  for (const tile of trailWarnings) {
    if (tile.ticks <= 0 || !isFloorTile(s.map, tile.x, tile.y)) continue;
    const progress = 1 - tile.ticks / SATURN.trailDelay;
    const x = tile.x * TILE_SIZE - camX, y = tile.y * TILE_SIZE - camY;
    ctx.save();
    ctx.globalAlpha = (.22 + .12 * progress) * tile.opacity;
    panel(ctx, x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4, '#76dce8');
    ctx.globalAlpha = (.35 + .25 * progress) * tile.opacity;
    ctx.strokeStyle = '#a9e5ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    ctx.restore();
  }
  // Next frozen-floor layout.
  for (const [x, y] of t.nextIce) { ctx.strokeStyle = '#a9e5ff77'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.strokeRect(x * 48 - camX + 3, y * 48 - camY + 3, 42, 42); ctx.setLineDash([]); drawSaturnSnowflake(ctx, (x + .5) * 48 - camX, (y + .5) * 48 - camY, 14, '#c7f4ff40'); }
  drawTimeField(ctx, t, camX, camY);
  // Mortar shells: a target square on each landing tile, closing as the shell drops.
  for (const shell of t.shells) {
    const x = shell.x * 48 - camX, y = shell.y * 48 - camY, p = 1 - shell.ticks / SATURN.mortar.warning;
    ctx.globalAlpha = .15 + p * .2; ctx.fillStyle = '#8fc5ff'; ctx.fillRect(x, y, 48, 48);
    ctx.globalAlpha = .9; ctx.strokeStyle = '#d6efff'; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, 44, 44);
    const inner = Math.round(20 * (1 - p)); ctx.strokeRect(x + 24 - inner, y + 24 - inner, inner * 2, inner * 2);
    if (shell.ticks < 14) { const h = shell.ticks * 12; ctx.fillStyle = '#e8f7ff'; ctx.fillRect(x + 18, y + 14 - h, 12, 16); ctx.fillStyle = '#8fc5ff'; ctx.fillRect(x + 20, y + 30 - h, 8, 4); }
  }
  ctx.globalAlpha = 1;
  // Frostbiter landing tiles and Glacier Hulk slam areas, in a hostile rose.
  for (const e of s.enemies) {
    const act = e.frostAct; if (!act) continue;
    if (act.kind === 'pounce' && !act.leaping) {
      const x = act.tx * 48 - camX, y = act.ty * 48 - camY, p = 1 - act.ticks / SATURN.frostbiter.crouch;
      ctx.globalAlpha = .2 + p * .25; ctx.fillStyle = '#ffb1c8'; ctx.fillRect(x, y, 48, 48);
      ctx.globalAlpha = .95; ctx.strokeStyle = '#ffe3ee'; ctx.lineWidth = 4; ctx.strokeRect(x + 4, y + 4, 40, 40);
    } else if (act.kind === 'slam') {
      const reach = SATURN.hulk.reach, x = (e.tileX - reach) * 48 - camX, y = (e.tileY - reach) * 48 - camY, size = (reach * 2 + 1) * 48, p = 1 - act.ticks / SATURN.hulk.windup;
      ctx.globalAlpha = .12 + p * .2; ctx.fillStyle = '#ffb1c8'; ctx.fillRect(x, y, size, size);
      ctx.globalAlpha = .9; ctx.strokeStyle = '#ffd5e3'; ctx.lineWidth = 4; ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
      const inner = Math.round(size / 2 * (1 - p)); ctx.strokeRect(x + size / 2 - inner, y + size / 2 - inner, inner * 2, inner * 2);
    }
  }
  ctx.globalAlpha = 1;
  // Grant: targets are marked for the whole cycle (snowflake and a dotted cyan line to her); the ring closes at the end.
  if (boss && t.grantTargets.length) {
    const left = t.grantTimer;
    for (const id of t.grantTargets) {
      const e = s.enemies.find(x => x.id === id && x.hp > 0); if (!e) continue;
      drawSaturnGrantMark(ctx,e.x-camX,e.y-camY,boss.x-camX,boss.y-camY,left,tick,t.phase>=3&&id===t.reverseGrantId);
    }
  }
  // Recall: everything holding her ice (aliens, and you) gets a violet diamond and chevrons pointing back to her.
  if (boss && t.recallTimer <= SATURN.recallWarning) {
    const left = t.recallTimer, p = 1 - left / SATURN.recallWarning;
    const holders: { x: number; y: number }[] = s.enemies.filter(e => e !== boss && e.hp > 0 && e.icyShieldHP > 0);
    if (Math.min(t.playerIce, s.playerShieldHP) > 0) holders.push({ x: s.playerX, y: s.playerY });
    for (const h of holders) {
      iceBeam(ctx, h.x - camX, h.y - camY, boss.x - camX, boss.y - camY, .12 + .3 * p, RECALL_COLOR, 3);
      beamMotes(ctx, h.x - camX, h.y - camY, boss.x - camX, boss.y - camY, tick, RECALL_COLOR, .7);
      recallRing(ctx, h.x - camX, h.y - camY, left, boss.x - camX, boss.y - camY);
    }
    // A violet diamond pulls in on her too, so a recall with nothing to take still reads.
    ctx.save(); ctx.translate(Math.round(boss.x - camX), Math.round(boss.y - camY)); ctx.rotate(Math.PI / 4);
    const r = Math.round(30 + (1 - p) * 60); ctx.globalAlpha = .3 + .5 * p; ctx.strokeStyle = RECALL_COLOR; ctx.lineWidth = 5; ctx.strokeRect(-r, -r, r * 2, r * 2); ctx.restore();
  }
  ctx.restore();
}

/** Minimap: aliens holding her ice (violet squares), her marked grant targets (cyan brackets) and the time-stop field. */
export function drawSaturnMinimap(ctx: CanvasRenderingContext2D, s: GameState, ox: number, oy: number, scale: number) {
  const t = s.saturn; if (!t) return;
  ctx.save();
  // Aliens holding her ice (what a recall would take back): a bold violet diamond outline with a dark edge, drawn over
  // the enemy dot; it flashes white during the recall warning.
  const recallSoon = t.recallTimer <= SATURN.recallWarning && Math.floor(s.gameTick / 8) % 2 === 0;
  for (const e of s.enemies) {
    if (e.id === t.bossId || e.hp <= 0 || e.icyShieldHP <= 0) continue;
    const x = Math.round(ox + (e.tileX + .5) * scale), y = Math.round(oy + (e.tileY + .5) * scale);
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = '#120a24'; ctx.lineWidth = 4; ctx.strokeRect(-7, -7, 14, 14);
    ctx.strokeStyle = recallSoon ? '#ffffff' : RECALL_COLOR; ctx.lineWidth = 2; ctx.strokeRect(-7, -7, 14, 14);
    ctx.restore();
  }
  for (const id of t.grantTargets) {
    const e = s.enemies.find(x => x.id === id && x.hp > 0); if (!e) continue;
    const x = Math.round(ox + (e.tileX + .5) * scale), y = Math.round(oy + (e.tileY + .5) * scale), blink = t.grantTimer <= GRANT_RING_TICKS && Math.floor(s.gameTick / 8) % 2 === 0;
    const reversed = t.phase >= 3 && id === t.reverseGrantId;
    ctx.strokeStyle = blink ? '#ffffff' : reversed ? REVERSE_GRANT_COLOR : GRANT_COLOR; ctx.lineWidth = 2; ctx.strokeRect(x - 5, y - 5, 10, 10);
  }
  if (t.field) { const r = SATURN.fieldRadius * scale, x = ox + t.field.x / TILE_SIZE * scale, y = oy + t.field.y / TILE_SIZE * scale; ctx.globalAlpha = .7; ctx.strokeStyle = TIME; ctx.lineWidth = 1; ctx.strokeRect(Math.round(x - r), Math.round(y - r), Math.round(r * 2), Math.round(r * 2)); }
  ctx.restore();
}

function drawSaturnCounter(ctx: CanvasRenderingContext2D, x: number, y: number, ticks: number, grant: boolean) {
  const age = SATURN_COUNTER_FX_TICKS - ticks;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.5, 1.5);
  if (grant) {
    // The caught Grant breaks into four compact cyan corners and a few ice chips.
    const progress = Math.min(1, age / 30);
    const strength = 1 - progress;
    const reach = 24 + progress * 52;
    const corner = 14 + progress * 7;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.globalAlpha = strength * .64;
      panel(ctx, reach - corner, -reach - 3, corner + 3, 6, '#65c8ed');
      panel(ctx, reach - 3, -reach, 6, corner, '#65c8ed');
      ctx.globalAlpha = strength * .85;
      panel(ctx, reach - corner + 4, -reach - 1, corner - 2, 2, '#e9fcff');
      panel(ctx, reach - 1, -reach, 2, corner - 4, '#e9fcff');
    }
    for (let i = 0; i < 10; i++) {
      const angle = i * 2.39996;
      const distance = 22 + age * (1.5 + i % 4 * .45);
      ctx.save();
      ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
      ctx.rotate(angle + progress);
      ctx.globalAlpha = strength * .74;
      panel(ctx, -3, -2, 6 + i % 3 * 2, 4, i % 3 ? GRANT_COLOR : '#ffffff');
      ctx.restore();
    }
  } else {
    const snapTicks = 8;
    if (age < snapTicks) {
      // Four violet seal corners snap inward, carrying short comet-like trails.
      const charge = age / snapTicks;
      const reach = 116 - charge * 85;
      ctx.rotate(Math.PI / 4);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.globalAlpha = .45 + charge * .4;
        panel(ctx, reach - 40, -reach - 5, 45, 10, '#9a63f3');
        panel(ctx, reach - 5, -reach, 10, 45, '#9a63f3');
        ctx.globalAlpha = .9;
        panel(ctx, reach - 26, -reach - 2, 28, 4, '#f3ddff');
        panel(ctx, reach - 2, -reach, 4, 28, '#f3ddff');
      }
    } else {
      const burstAge = age - snapTicks;
      const burst = burstAge / (SATURN_COUNTER_FX_TICKS - snapTicks);
      const strength = 1 - burst;
      const flash = Math.max(0, 1 - burstAge / 12);

      // The broken seal leaves a white-mint impact and four diagonal bursts.
      ctx.save();
      ctx.rotate(Math.PI / 4);
      ctx.globalAlpha = flash * .75;
      panel(ctx, -25, -25, 50, 50, '#e6fff6');
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        const reach = 68 + Math.sqrt(burst) * 91;
        ctx.globalAlpha = strength * .64;
        panel(ctx, 27, -7, reach - 27, 14, '#55e3be');
        panel(ctx, reach - 35, -15, 26, 6, '#a481ff');
        ctx.globalAlpha = strength * .9;
        panel(ctx, 34, -2, reach - 39, 4, '#effff7');
        panel(ctx, reach + 4, -3, 12, 6, '#caffed');
      }
      ctx.restore();

      for (let i = 0; i < 24; i++) {
        const angle = i * 2.39996;
        const distance = 28 + burstAge * (2.5 + i % 5 * .9);
        const size = 3 + i % 4 * 2;
        ctx.save();
        ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance);
        ctx.rotate(angle + burstAge * (i % 2 ? .08 : -.08));
        ctx.globalAlpha = strength * (i % 3 ? .7 : 1);
        panel(ctx, -size / 2, -size / 2, size * 2, size, i % 3 ? '#bd9aff' : '#caffed');
        ctx.restore();
      }
      for (let i = 0; i < 6; i++) {
        const life = (burstAge - i * 2) / 30;
        if (life <= 0 || life >= 1) continue;
        const px = (i - 2.5) * (16 + life * 8);
        const py = 10 + i % 2 * 20 - life * 84;
        ctx.globalAlpha = Math.sin(life * Math.PI);
        panel(ctx, px - 2, py - 8, 4, 16, '#c5ffdc');
        panel(ctx, px - 8, py - 2, 16, 4, '#e6fff1');
      }
    }
  }
  ctx.restore();
}

/** Beams that just fired and short bursts, drawn above units. */
export function drawSaturnEffects(ctx: CanvasRenderingContext2D, s: GameState, camX: number, camY: number) {
  const t = s.saturn; if (!t) return;
  ctx.save(); ctx.shadowBlur = 0;
  // Phase 2+: aliens holding her ice are empowered: a frosty square aura and rising streaks, stronger with more ice.
  if (t.phase >= SATURN.empowerFromPhase) for (const e of s.enemies) {
    if (e.id === t.bossId || e.hp <= 0 || e.icyShieldHP <= 0) continue;
    const power = Math.min(1, e.icyShieldHP / SATURN.empowerFullIce), x = Math.round(e.x - camX), y = Math.round(e.y - camY), r = 26 + Math.round(power * 6);
    ctx.globalAlpha = (.25 + .35 * power) * (.75 + .25 * Math.sin(s.gameTick * .2 + e.id)); ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2 + Math.round(power * 2);
    ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = '#bff4ff';
    for (let k = 0; k < 2 + Math.round(power * 2); k++) { const life = ((s.gameTick * 1.5 + k * 17 + e.id * 7) % 30) / 30; ctx.globalAlpha = (1 - life) * (.4 + .5 * power); ctx.fillRect(x - r + 6 + k * 12, Math.round(y + r - life * 30), 3, 8); }
  }
  ctx.globalAlpha = 1;
  for (const b of t.beams) {
    const a = b.ticks / 24, color = b.kind === 'recall' ? RECALL_COLOR : b.kind === 'reverseGrant' ? REVERSE_GRANT_COLOR : b.kind === 'steal' ? '#ffffff' : GRANT_COLOR;
    iceBeam(ctx, b.fromX - camX, b.fromY - camY, b.toX - camX, b.toY - camY, a, color, b.kind === 'steal' ? 7 : 5);
  }
  for (const fx of t.effects) {
    const x = Math.round(fx.x - camX), y = Math.round(fx.y - camY);
    if (fx.kind === 'shatter') {
      const age = 18 - fx.ticks; ctx.globalAlpha = fx.ticks / 18;
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, d = 10 + age * 2.2; ctx.fillStyle = k % 2 ? '#e8fbff' : ICE_DEEP; ctx.fillRect(Math.round(x + Math.cos(a) * d) - 3, Math.round(y + Math.sin(a) * d) - 3, 6, 6); }
    } else if (fx.kind === 'backlash') {
      const age = 36 - fx.ticks, r = 20 + age * 2; ctx.globalAlpha = fx.ticks / 36; ctx.strokeStyle = '#ffd0dc'; ctx.lineWidth = 5; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(x, y); ctx.rotate(k * Math.PI / 2 + .4); ctx.fillRect(10, -2, 18 + age, 4); ctx.restore(); }
    } else if (fx.kind === 'fizzle') { // an attack cancelled by the time-stop field: a white cross that fades
      ctx.globalAlpha = fx.ticks / 18; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 12, y - 2, 24, 4); ctx.fillRect(x - 2, y - 12, 4, 24);
    } else if (fx.kind === 'grantCounter' || fx.kind === 'recallCounter') {
      drawSaturnCounter(ctx, x, y, fx.ticks, fx.kind === 'grantCounter');
    } else if (fx.kind === 'intercept' || fx.kind === 'steal') {
      const r = 18 + (30 - fx.ticks) * 1.2; ctx.globalAlpha = Math.min(1, fx.ticks / 20); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    } else {
      const total = fx.kind === 'slam' ? 24 : 20, age = total - fx.ticks, r = (fx.kind === 'slam' ? 40 : 16) + age * (fx.kind === 'slam' ? 3 : 1.6);
      ctx.globalAlpha = fx.ticks / total; ctx.strokeStyle = '#d6f4ff'; ctx.lineWidth = fx.kind === 'slam' ? 6 : 4; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
      for (let k = 0; k < 8; k++) { ctx.save(); ctx.translate(x, y); ctx.rotate(k * Math.PI / 4); panel(ctx, r * .6, -2, 8 + (k % 3) * 3, 4, k % 2 ? '#8fc5e5' : '#e7ffff'); ctx.restore(); }
    }
  }
  drawFieldHourglass(ctx,t,s.playerX-camX,s.playerY-camY);
  ctx.restore();
}

// ─── Her aliens ──────────────────────────────────────────────────────────────

export function drawSaturnUnit(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, tick: number, stopped = false) {
  if (e.type !== 'frostbiter' && e.type !== 'sleet_mortar' && e.type !== 'glacier_hulk') return false;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.shadowBlur = 0;
  if (e.flashTicks > 0) ctx.filter = 'brightness(1.8)';
  const id = e.id ?? 0, act = e.frostAct;
  if (e.type === 'frostbiter') {
    // A simple ice cube: a flat square with a bright icy rim, a lighter ice inset and one gloss mark, two square eyes
    // (white while crouching before a pounce), small pink cheeks and a small v smile. It squashes as it crouches and stretches in the leap.
    const crouch = act && !act.leaping ? 1 - act.ticks / SATURN.frostbiter.crouch : 0, leap = act?.leaping;
    const sy = leap ? -8 : Math.round(crouch * 5), squash = leap ? .9 : 1 + crouch * .15;
    ctx.translate(0, sy); ctx.scale(squash, 2 - squash);
    ctx.shadowColor = '#bff4ff'; ctx.shadowBlur = 5; panel(ctx, -13, -13, 26, 26, '#c9f3ff'); ctx.shadowBlur = 0;
    panel(ctx, -10, -10, 20, 20, '#72cdf0');
    panel(ctx, -10, -10, 6, 2, '#f2fdff'); panel(ctx, -10, -8, 2, 4, '#f2fdff'); // gloss
    const eye = crouch > .5 ? '#ffffff' : '#123048';
    panel(ctx, -8, -5, 6, 6, eye); panel(ctx, 2, -5, 6, 6, eye);
    panel(ctx, -3, 3, 2, 2, '#123048'); panel(ctx, -1, 5, 2, 2, '#123048'); panel(ctx, 1, 3, 2, 2, '#123048'); // a small v smile
    panel(ctx, -9, 1, 3, 2, '#ff9fbf'); panel(ctx, 6, 1, 3, 2, '#ff9fbf'); // small pink cheeks
  } else if (e.type === 'sleet_mortar') {
    // A squat turret of packed snow with a wide barrel pointing up; a pale shell shows when it is about to fire.
    const fire = e.shootTicks > 0 ? Math.sin((1 - e.shootTicks / 30) * Math.PI) : 0, bob = Math.round(Math.sin(tick * .06 + id));
    ctx.translate(0, bob);
    ctx.shadowColor = '#a7c4ff'; ctx.shadowBlur = 4; panel(ctx, -16, -4, 32, 18, '#a7c4ff'); ctx.shadowBlur = 0;
    panel(ctx, -13, -1, 26, 12, '#24365a');
    panel(ctx, -7, -20 + fire * 4, 14, 18, '#cfe1ff'); panel(ctx, -4, -20 + fire * 4, 8, 4, '#24365a');
    if (e.attackTimer < 40) panel(ctx, -3, -26, 6, 6, '#ffffff');
    panel(ctx, -9, 3, 5, 3, '#e8f4ff'); panel(ctx, 4, 3, 5, 3, '#e8f4ff');
    panel(ctx, -18, 12, 8, 4, '#7d98c9'); panel(ctx, 10, 12, 8, 4, '#7d98c9');
  } else {
    // A massive glacier block with two fists; it raises them before a slam.
    const lift = act ? 1 - act.ticks / SATURN.hulk.windup : 0, hit = e.shootTicks > 0;
    ctx.shadowColor = '#7fb3e6'; ctx.shadowBlur = 6; panel(ctx, -22, -18, 44, 38, '#7fb3e6'); ctx.shadowBlur = 0;
    panel(ctx, -18, -14, 36, 30, '#1c3352');
    panel(ctx, -18, -14, 36, 6, '#3b6493'); panel(ctx, 6, -2, 3, 14, '#5d8fc0'); panel(ctx, 6, 9, 10, 3, '#5d8fc0');
    panel(ctx, -12, -6, 9, 4, '#d6f1ff'); panel(ctx, 3, -6, 9, 4, '#d6f1ff'); panel(ctx, -8, 6, 16, 3, '#0b1626');
    const fy = hit ? 14 : -lift * 22;
    panel(ctx, -32, fy - 6, 11, 14, '#a7d4f5'); panel(ctx, 21, fy - 6, 11, 14, '#a7d4f5');
    panel(ctx, -30, fy - 4, 7, 4, '#ffffff'); panel(ctx, 23, fy - 4, 7, 4, '#ffffff');
  }
  ctx.filter = 'none'; ctx.restore(); ctx.save();
  if (stopped) { ctx.globalAlpha = .6; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.strokeRect(Math.round(x) - 28, Math.round(y) - 28, 56, 56); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  if (e.icyShieldHP > 0) drawMobIceShield(ctx, x, y, e.type === 'glacier_hulk' ? 34 : 26, tick);
  drawEnemyHealthBar(ctx, e, x, y);
  ctx.restore(); return true;
}

export function drawSaturnAtmosphere(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number) {
  if (!saturnBlizzard(s)) return;
  const tick = s.gameTick;
  ctx.save(); ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(114,169,224,.025)'; ctx.fillRect(0, 0, w, h);
  const edge = ctx.createRadialGradient(w * .5, h * .5, Math.min(w, h) * .22, w * .5, h * .5, Math.max(w, h) * .65);
  edge.addColorStop(0, '#85cfff00'); edge.addColorStop(1, 'rgba(161,214,249,.06)');
  ctx.fillStyle = edge; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 5; i++) {
    const x = ((i * 317 - tick * 9) % (w + 600) + w + 600) % (w + 600) - 300, y = ((i * 139 + tick * .6) % (h + 150) + h + 150) % (h + 150) - 75;
    ctx.fillStyle = 'rgba(209,241,255,.027)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 270, y - 58); ctx.lineTo(x + 410, y - 45); ctx.lineTo(x + 70, y + 12); ctx.closePath(); ctx.fill();
  }
  for (let i = 0; i < 28; i++) {
    const x = ((i * 167 - tick * (5 + i % 4)) % (w + 90) + w + 90) % (w + 90) - 45, y = ((i * 83 + tick * (.6 + i % 3 * .3)) % (h + 80) + h + 80) % (h + 80) - 40;
    ctx.fillStyle = i % 5 ? '#dcf6ff77' : '#efffffaa'; ctx.fillRect(Math.round(x), Math.round(y), 3 + (i % 3) * 2, 2);
    if (i % 17 === 0) drawSaturnSnowflake(ctx, x, y, 5 + i % 4, '#dff8ff99', -.2);
  }
  ctx.restore();
}


const RECALL_SCREEN_CRACKS=Array.from({length:14},(_,i)=>{
  const random=(salt:number)=>{const v=Math.sin(i*127.1+salt*73.17+21.7)*43758.5453;return v-Math.floor(v);};
  const angle=random(3)*Math.PI*2,length=.1+random(4)*.15;
  return{x:.05+random(1)*.9,y:.05+random(2)*.9,angle,length,bend:(random(5)>.5?1:-1)*(.35+random(6)*.4),branch:.3+random(7)*.25};
});
function drawRecallScreenCracks(ctx:CanvasRenderingContext2D,w:number,h:number,age:number){
  const p=Math.max(0,Math.min(1,age/SATURN_BACKLASH_TICKS)),fade=.5+.5*Math.cos(p*Math.PI),rise=Math.min(1,age/8);
  ctx.save();ctx.shadowBlur=0;ctx.lineJoin='miter';ctx.lineCap='butt';
  for(const crack of RECALL_SCREEN_CRACKS){
    const length=Math.min(w,h)*crack.length;
    ctx.save();ctx.translate(crack.x*w,crack.y*h);ctx.rotate(crack.angle);
    ctx.beginPath();ctx.moveTo(-length*.5,0);ctx.lineTo(-length*.15,0);ctx.lineTo(length*.12,length*crack.bend*.22);
    ctx.lineTo(length*.35,length*crack.bend*.22);ctx.lineTo(length*.6,length*crack.bend*.4);
    ctx.moveTo(-length*.15,0);ctx.lineTo(length*.05,-length*crack.branch*.4);ctx.lineTo(length*.3,-length*crack.branch*.4);
    ctx.moveTo(length*.35,length*crack.bend*.22);ctx.lineTo(length*.43,-length*crack.branch*.23);ctx.lineTo(length*.66,-length*crack.branch*.23);
    ctx.moveTo(-length*.32,0);ctx.lineTo(-length*.4,length*crack.branch*.25);
    ctx.globalAlpha=fade*rise*.18;ctx.strokeStyle='#b18bdb';ctx.lineWidth=6;ctx.stroke();
    ctx.globalAlpha=fade*rise*.26;ctx.strokeStyle='#ddc5fa';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  }
  ctx.restore();
}

/** Failed recall: six open frost fronts, crystalline wakes and drifting snow. */
export function drawSaturnBacklash(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number, camX: number, camY: number, zoom = 1) {
  const fx=s.saturn?.backlash;if(!fx)return;
  const age=SATURN_BACKLASH_TICKS-fx.ticks,p=Math.max(0,Math.min(1,age/SATURN_BACKLASH_TICKS)),fade=.5+.5*Math.cos(p*Math.PI);
  const px=(fx.x-camX)*zoom,py=(fx.y-camY)*zoom,dx=px-w/2,dy=py-h/2,offscreen=px<0||px>w||py<0||py>h;
  const edgeScale=offscreen?Math.min(w/2/Math.abs(dx),h/2/Math.abs(dy)):1;
  const x=offscreen?w/2+dx*edgeScale:px,y=offscreen?h/2+dy*edgeScale:py,reach=Math.hypot(w,h)*.9;
  ctx.save();ctx.shadowBlur=0;
  // A gentle violet grade unifies the scene beneath the flat luminous burst layers.
  const filterIn=Math.min(1,age/6),filter=filterIn*filterIn*(3-2*filterIn)*fade;
  ctx.globalAlpha=filter*.075;panel(ctx,0,0,w,h,'#ba90e9');
  const light=ctx.createRadialGradient(x,y,0,x,y,Math.hypot(w,h)*.6);
  light.addColorStop(0,'rgba(166,85,235,.32)');light.addColorStop(.45,'rgba(184,121,238,.13)');light.addColorStop(1,'rgba(194,151,238,0)');
  ctx.globalAlpha=filter;ctx.fillStyle=light;ctx.fillRect(0,0,w,h);
  const vignette=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.3,w/2,h/2,Math.hypot(w,h)*.58);
  vignette.addColorStop(0,'rgba(38,15,63,0)');vignette.addColorStop(.65,'rgba(49,20,75,.08)');vignette.addColorStop(1,'rgba(38,15,63,.28)');
  ctx.fillStyle=vignette;ctx.fillRect(0,0,w,h);
  ctx.globalAlpha=Math.pow(Math.max(0,1-age/10),2)*.32;panel(ctx,0,0,w,h,'#ead8ff');
  drawRecallScreenCracks(ctx,w,h,age);
  // The original radial ice cracks sit quietly behind the brighter layered wave.
  const crackGrow=Math.min(1,age/14);
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6+(i%2?.13:-.09),length=reach*(.35+i%3*.14)*crackGrow,width=10+i%4*4;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    ctx.globalAlpha=fade*.2;ctx.fillStyle=RECALL_COLOR;
    ctx.beginPath();ctx.moveTo(18,-width/2);ctx.lineTo(length,-2);ctx.lineTo(length,2);ctx.lineTo(18,width/2);ctx.closePath();ctx.fill();
    ctx.globalAlpha=fade*.28;ctx.fillStyle='#d9baff';
    ctx.beginPath();ctx.moveTo(18,-width/5);ctx.lineTo(length*.92,-1);ctx.lineTo(length*.92,1);ctx.lineTo(18,width/5);ctx.closePath();ctx.fill();
    if(i%2===0){ctx.translate(length*.45,0);ctx.rotate(.5);ctx.globalAlpha=fade*.22;panel(ctx,0,-2,length*.18,4,'#c7a0f5');}
    ctx.restore();
  }
  // One circular travelling wash, feathered on both sides like Sirius's Holy Light wave.
  const washFront=p*reach*1.15,washDepth=Math.min(washFront,Math.max(120,washFront*.36)),washStep=washDepth/32;
  if(washStep>0){
    ctx.save();ctx.lineJoin='miter';
    for(let sheet=0;sheet<32;sheet++){
      const u=(sheet+.5)/32,r=washFront-u*washDepth;
      ctx.globalAlpha=Math.sin(u*Math.PI)*Math.min(1,(1-p)*3)*.34;
      const purple=1-u;
      ctx.strokeStyle=`rgb(${Math.round(231-purple*76)},${Math.round(205-purple*151)},${Math.round(250-purple*15)})`;
      ctx.globalAlpha*=.65+.95*purple;
      ctx.lineWidth=washStep+.5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
  }
  // Frost Warden's sixfold identity, using the open wave construction of Absolute Zero.
  ctx.save();ctx.translate(x,y);
  for(let echo=0;echo<4;echo++){
    const travel=(age-echo*7)/66;if(travel<0||travel>=1)continue;
    const r=18+reach*travel,strength=fade*(1-echo*.22),span=22+r*.22,wake=Math.min(r*.44,130);
    for(let arm=0;arm<6;arm++){
      ctx.save();ctx.rotate(arm*Math.PI/3);
      for(let sheet=23;sheet>=0;sheet--){
        const u=sheet/23;ctx.globalAlpha=strength*.3*Math.pow(1-u,1.2);
        panel(ctx,-span,-r+wake*u,span*2,wake/23+1,echo===1?'#bca7f2':'#ae87e7');
      }
      ctx.globalAlpha=strength*.3;panel(ctx,-span-5,-r-17,span*2+10,38,RECALL_COLOR);
      ctx.globalAlpha=strength*.9;panel(ctx,-span,-r-11,span*2,22,echo===1?RECALL_COLOR:'#b893ef');
      ctx.globalAlpha=strength;panel(ctx,-span*.8,-r-3,span*1.6,6,'#ecdcff');
      if(echo===0){
        // Broad crystalline fans overlap like translucent petals, without shaded faces.
        const fan=24+Math.min(30,r*.06);
        for(let sheet=2;sheet>=0;sheet--){
          ctx.save();ctx.translate(0,-r+sheet*10);
          ctx.globalAlpha=strength*(.26-sheet*.055);
          panel(ctx,-fan,-10,fan*2,16,sheet===1?RECALL_COLOR:'#bd96ef');
          panel(ctx,-fan*.75,6,fan*1.5,12,sheet===1?RECALL_COLOR:'#bd96ef');
          panel(ctx,-fan*.42,18,fan*.84,10,sheet===1?RECALL_COLOR:'#bd96ef');ctx.restore();
        }
        // A crystal spine and paired branches cap each moving snowflake arm.
        ctx.globalAlpha=strength*.85;panel(ctx,-4,-r-34,8,72,'#dcc0ff');
        panel(ctx,-1,-r-34,3,64,'#f3e7ff');
        for(const side of [-1,1]){
          for(let fork=0;fork<2;fork++){
            ctx.save();ctx.translate(side*(12+fork*6),-r+4+fork*16);ctx.rotate(side*Math.PI/4);
            ctx.globalAlpha=strength*.7;panel(ctx,-3,-26,6,30,'#b6a8ef');
            ctx.globalAlpha=strength;panel(ctx,-1,-26,2,26,'#ead5ff');ctx.restore();
          }
          ctx.globalAlpha=strength*.65;panel(ctx,side*span-side*12,-r+9,12,3,'#c8b5f3');
        }
      }
      ctx.restore();
    }
  }
  const core=Math.max(0,1-p/.5);
  ctx.globalAlpha=core*.55;drawSaturnSnowflake(ctx,0,0,48+p*170,'#dec4ff');
  ctx.globalAlpha=core*.28;drawSaturnSnowflake(ctx,0,0,36+p*140,RECALL_COLOR,Math.PI/6);ctx.restore();
  // Small rotating translucent ice chips scatter around the breaking frost fronts.
  for(let i=0;i<96;i++){
    const angle=i*2.39996,ease=1-(1-p)*(1-p),d=22+reach*(.12+i%6*.065)*ease;
    const sx=x+Math.cos(angle)*d,sy=y+Math.sin(angle)*d,size=6+i%4*2;
    ctx.save();ctx.translate(sx,sy);ctx.rotate(angle+p*(i%2?1:-1)*1.8);
    for(let sheet=2;sheet>=0;sheet--){
      ctx.save();ctx.translate(-sheet*size*.25,sheet*size*.16);ctx.rotate(sheet*.12);
      ctx.globalAlpha=fade*(.32-sheet*.07);panel(ctx,-size/2,-size*.7,size,size*1.4,'#ffffff');ctx.restore();
    }
    ctx.restore();
  }
  for(let i=0;i<64;i++){
    const angle=i*2.39996+.8,d=reach*p*(.4+i%4*.12),gx=x+Math.cos(angle)*d,gy=y+Math.sin(angle)*d;
    const shine=Math.pow(Math.max(0,Math.sin(age*.2+i*1.7)),4);
    ctx.globalAlpha=fade*(.22+shine*.75);panel(ctx,gx-5,gy,11,1,'#ffffff');panel(ctx,gx,gy-5,1,11,'#ffffff');
  }
  // Original frosted frame, softened into a faint purple edge with short ice tips.
  const edge=Math.max(2,Math.round(Math.min(w,h)*(.012*fade+.004)));
  ctx.globalAlpha=fade*.24;ctx.fillStyle=RECALL_COLOR;
  ctx.fillRect(0,0,w,edge);ctx.fillRect(0,h-edge,w,edge);ctx.fillRect(0,0,edge,h);ctx.fillRect(w-edge,0,edge,h);
  for(let i=0;i<16;i++){
    const side=i%4,along=((i*97)%100)/100,length=(6+i%3*6)*fade;
    ctx.globalAlpha=fade*.28;ctx.fillStyle='#d5b5fa';
    if(side===0)ctx.fillRect(along*w,edge,2,length);
    else if(side===1)ctx.fillRect(along*w,h-edge-length,2,length);
    else if(side===2)ctx.fillRect(edge,along*h,length,2);
    else ctx.fillRect(w-edge-length,along*h,length,2);
  }
  ctx.restore();
}
