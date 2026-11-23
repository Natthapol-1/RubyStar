import { drawEnemyHealthBar } from './enemy-health-art';
import { TILE_SIZE, MAP_COLS, MAP_ROWS, CHAMBER_BOUNDS, T_FLOOR, GAIA_POD_FUSE, GAIA_SUN_WARNING, GAIA_SCORCH_TICKS, GAIA_STONE_TRAVEL, GAIA_STONE_BLOOM_TICKS, GAIA_STONE_RELIGHT,
  GAIA_STONE_DRIFT_TICKS, GAIA_RING_RADIUS, GAIA_RING_WARN, GAIA_WARD_RADIUS, GAIA_SPORE_RADIUS, GAIA_SPORE_TICKS, GAIA_SNARE_ROOT, GAIA_BLOSSOM_PULSE } from './constants';
import { ENEMY_CONFIGS } from './constants';
import type { Enemy, GameState } from './engine';

// Blocky neon-vector art for the Gaia challenge: overgrowth, Sunstones, her plants and aliens, root snares,
// Sunfire and the forest backdrop.

/** The original corner-vine motif, enriched with more growth and drifting pollen. */
export function drawGaiaSunfireReady(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,w:number,h:number){
  const g=state.gaia;if(!g)return;
  const blend=g.sunReadyFade??0;if(blend<=0)return;
  const envelope=blend*blend*(3-2*blend);
  const tick=state.gameTick,breath=(.8+.2*Math.sin(tick*.025))*envelope;
  ctx.save();ctx.shadowBlur=0;
  for(let edge=0;edge<4;edge++){
    ctx.save();if(edge===1){ctx.translate(w,0);ctx.rotate(Math.PI/2);}else if(edge===2){ctx.translate(w,h);ctx.rotate(Math.PI);}else if(edge===3){ctx.translate(0,h);ctx.rotate(-Math.PI/2);}
    const span=edge%2?h:w,depth=Math.min(w,h)*.19,wash=ctx.createLinearGradient(0,0,0,depth);
    wash.addColorStop(0,'rgba(159,201,68,.28)');wash.addColorStop(.4,'rgba(246,209,105,.085)');wash.addColorStop(1,'rgba(103,169,57,0)');
    ctx.globalAlpha=breath;ctx.fillStyle=wash;ctx.fillRect(0,0,span,depth);ctx.restore();
  }
  for(let corner=0;corner<4;corner++){
    ctx.save();ctx.translate(corner%2?w:0,corner>1?h:0);ctx.scale(corner%2?-1:1,corner>1?-1:1);
    const points=[[0,174],[25,174],[25,120],[62,120],[62,70],[140,70],[140,28],[235,28]];
    for(const [width,color,alpha] of [[4,'#617d3c',.7],[2,'#bdcc7a',.6]] as const){
      ctx.globalAlpha=breath*alpha;ctx.strokeStyle=color;ctx.lineWidth=width;
      ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    }
    ctx.globalAlpha=breath*.4;ctx.strokeStyle='#a5b86b';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(25,150);ctx.lineTo(45,150);ctx.lineTo(45,188);ctx.lineTo(70,188);ctx.moveTo(105,70);ctx.lineTo(105,100);ctx.lineTo(135,100);ctx.moveTo(190,28);ctx.lineTo(190,51);ctx.lineTo(218,51);ctx.stroke();
    const leaves=[[20,153],[33,127],[51,115],[67,87],[80,69],[102,73],[130,68],[142,46],[160,28],[184,29],[210,28],[46,170],[65,185],[116,99],[204,51]];
    for(const [i,[x,y]] of leaves.entries()){
      const size=12+i%4*3,angle=(i%2?1:-1)*Math.PI/4+Math.sin(tick*.018+i)*.045;
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.globalAlpha=breath*(i%3?.65:.8);
      ctx.fillStyle=i%2?'#b8d56c':'#819f4a';ctx.fillRect(-3,-size*.65,6,size*1.3);
      ctx.globalAlpha=breath*.7;ctx.fillStyle='#e8e6a0';ctx.fillRect(-1,-size*.5,1,size);ctx.restore();
    }
    for(const [i,[x,y]] of [[30,126],[108,70],[211,29],[65,186]].entries()){
      const size=9+i%2*2;
      ctx.globalAlpha=breath*.75;ctx.fillStyle='#f3d78d';ctx.fillRect(x-size,y-3,size*2,6);ctx.fillRect(x-3,y-size,6,size*2);
      ctx.fillStyle='#fff5c7';ctx.fillRect(x-4,y-4,8,8);ctx.fillStyle='#bc9a45';ctx.fillRect(x-2,y-2,4,4);
      const glint=Math.pow(Math.max(0,Math.sin(tick*.035+i+corner)),5)*envelope;
      ctx.globalAlpha=glint*.65;ctx.fillStyle='#fff9d8';ctx.fillRect(x-1,y-size-6,2,4);
    }
    ctx.restore();
  }
  for(let i=0;i<84;i++){
    const side=i%4,along=((i*193+tick*(.12+i%3*.04))%997)/997,depth=16+(i*47%105)+Math.sin(tick*.018+i)*9;
    const x=side===0?along*w:side===1?w-depth:side===2?(1-along)*w:depth;
    const y=side===0?depth:side===1?along*h:side===2?h-depth:(1-along)*h;
    const glint=(.2+.8*Math.pow(Math.max(0,Math.sin(tick*.035+i*1.7)),3))*envelope;
    ctx.globalAlpha=glint*.6;ctx.fillStyle=i%3?'#e8ecac':'#fff6d0';ctx.fillRect(Math.round(x),Math.round(y),i%5?2:4,i%5?3:4);
    if(i%11===0){ctx.save();ctx.translate(x+7,y+12);ctx.rotate(tick*.006+i);ctx.globalAlpha=glint*.35;ctx.fillStyle='#b8d56c';ctx.fillRect(-2,-5,4,10);ctx.restore();}
  }
  // Loose block-built leaves ride a gentle breeze through the full viewport.
  for(let i=0;i<22;i++){
    const travel=((tick*(.8+i%4*.2)+i*97)%(w+160))/(w+160);
    const x=-80+travel*(w+160),y=((i*137+39)%h+Math.sin(travel*Math.PI*2+i)*24-travel*65+h)%h;
    const size=6+i%4*2,alpha=envelope*Math.sin(travel*Math.PI)*(.25+i%3*.06);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(.65+Math.sin(tick*.014+i)*.35+i%3*.4);
    ctx.globalAlpha=alpha;ctx.fillStyle=i%4?'#a9ca73':'#d9df9b';
    ctx.fillRect(-size*.25,-size*.8,size*.5,size*1.6);ctx.fillRect(-size*.4,-size*.35,size*.8,size*.7);
    ctx.globalAlpha=alpha*.8;ctx.fillStyle='#edf0ba';ctx.fillRect(-.5,-size*.6,1,size*1.2);
    ctx.restore();
  }
  ctx.restore();
}

export const GAIA_CHAMBER_COLORS = ['#8fdc4a', '#e0c44a', '#4fd49a', '#c7e05a'] as const;

const hash = (x: number, y: number, k: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// One overgrown tile, kept deliberately plain: a flat green wash that darkens with each level, plus one simple
// motif — two moss dots, one straight vine with a leaf, or a crossed vine with two thorns. No wiggle or clutter.
export function drawGrowthTile(ctx: CanvasRenderingContext2D, level: number, x: number, y: number, tx: number, ty: number, tick: number) {
  const s = TILE_SIZE, flip = hash(tx, ty, 1) > .5; void tick;
  if (level === 1) {
    ctx.globalAlpha = .16; block(ctx, x, y, s, s, '#4f9a33');
    ctx.globalAlpha = .7; block(ctx, x + 12, y + (flip ? 14 : 28), 6, 6, '#6fae45'); block(ctx, x + 30, y + (flip ? 30 : 16), 6, 6, '#6fae45');
    ctx.globalAlpha = 1; return;
  }
  const thicket = level >= 3;
  ctx.globalAlpha = thicket ? .62 : .42; block(ctx, x, y, s, s, thicket ? '#1d4a18' : '#2f6a24'); ctx.globalAlpha = 1;
  const vine = thicket ? '#4f8f34' : '#6fbf4a', leaf = thicket ? '#8fcf5a' : '#a8e47a';
  // One straight vine across the tile, oriented per tile so neighbours don't line up into stripes.
  if (flip) { block(ctx, x, y + 21, s, 6, vine); block(ctx, x + 14, y + 15, 8, 6, leaf); }
  else { block(ctx, x + 21, y, 6, s, vine); block(ctx, x + 27, y + 14, 6, 8, leaf); }
  if (thicket) {
    if (flip) block(ctx, x + 21, y, 6, s, vine); else block(ctx, x, y + 21, s, 6, vine);
    block(ctx, x + 8, y + 8, 4, 4, '#e0f4a8'); block(ctx, x + 36, y + 36, 4, 4, '#e0f4a8');
  }
}

export function drawStone(ctx: CanvasRenderingContext2D, cx: number, cy: number, lit: boolean, progress: number, tick: number) {
  ctx.save(); ctx.translate(Math.round(cx), Math.round(cy));
  const bob = lit ? Math.round(Math.sin(tick * .06) * 2) : 0;
  ctx.translate(0, bob);
  ctx.shadowColor = '#ffd36a'; ctx.shadowBlur = lit ? 4 + 2 * Math.abs(Math.sin(tick * .05)) : 0;
  const outer = lit ? '#c8912a' : '#5e5848', mid = lit ? '#ffd36a' : '#857d64', light = lit ? '#fff3b8' : '#a39b80';
  block(ctx, -4, -16, 8, 32, outer); block(ctx, -10, -10, 20, 20, outer); block(ctx, -16, -4, 32, 8, outer);
  ctx.shadowBlur = 0;
  block(ctx, -6, -8, 12, 16, mid); block(ctx, -8, -6, 16, 12, mid);
  block(ctx, -6, -8, 4, 8, light); block(ctx, -2, -12, 4, 4, light);
  if (!lit && progress > 0) { // relight ring fills around the dim stone
    ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.arc(0, 0, 21, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// A meteor-scorched floor tile: dark ash with an occasional ember, both fading as heat (1 → 0) cools.
// Shared by Gaia's meteor scorch and the Crater constellation's healing room.
export function drawScorchTile(ctx: CanvasRenderingContext2D, x: number, y: number, tx: number, ty: number, heat: number) {
  ctx.globalAlpha = .25 + .3 * heat; block(ctx, x, y, TILE_SIZE, TILE_SIZE, '#2a2118');
  ctx.globalAlpha = heat; if (hash(tx, ty, 5) > .7) block(ctx, x + 8 + hash(tx, ty, 6) * 28, y + 8 + hash(tx, ty, 7) * 28, 4, 4, '#ff9a3c');
  ctx.globalAlpha = 1;
}

// Under actors: growth, scorch, Ruby's ward and ring, Sunstones and snare cracks.
export function drawGaiaGround(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, viewW: number, viewH: number, tick: number) {
  const gaia = state.gaia; if (!gaia) return;
  const s = TILE_SIZE;
  const x0 = Math.max(0, Math.floor(camX / s) - 1), y0 = Math.max(0, Math.floor(camY / s) - 1);
  const x1 = Math.min(MAP_COLS - 1, Math.ceil((camX + viewW) / s) + 1), y1 = Math.min(state.map.length - 1, Math.ceil((camY + viewH) / s) + 1);
  ctx.save(); ctx.shadowBlur = 0;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (state.map[ty]?.[tx] !== T_FLOOR) continue;
    const i = ty * MAP_COLS + tx, x = tx * s - camX, y = ty * s - camY;
    if (gaia.scorch[i] > 0) drawScorchTile(ctx, x, y, tx, ty, gaia.scorch[i] / GAIA_SCORCH_TICKS);
    if (gaia.growth[i] > 0) drawGrowthTile(ctx, gaia.growth[i], x, y, tx, ty, tick);
  }
  // Ruby's ward (faint gold frame) and the ring warning when vines close in.
  if (state.rubyTileX !== -1) {
    const rx = state.rubyTileX * s - camX, ry = state.rubyTileY * s - camY;
    ctx.globalAlpha = .45; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 5;
    ctx.strokeRect(rx - GAIA_WARD_RADIUS * s + 3, ry - GAIA_WARD_RADIUS * s + 3, (GAIA_WARD_RADIUS * 2 + 1) * s - 6, (GAIA_WARD_RADIUS * 2 + 1) * s - 6);
    if (gaia.ringClosure >= GAIA_RING_WARN) {
      const closed = gaia.ringClosure >= 1, pulse = .5 + .5 * Math.sin(tick * (closed ? .3 : .15));
      ctx.globalAlpha = (closed ? .7 : .4) + .3 * pulse; ctx.strokeStyle = closed ? '#ff3b4f' : '#ff8a5a'; ctx.lineWidth = closed ? 6 : 4;
      ctx.strokeRect(rx - GAIA_RING_RADIUS * s + 3, ry - GAIA_RING_RADIUS * s + 3, (GAIA_RING_RADIUS * 2 + 1) * s - 6, (GAIA_RING_RADIUS * 2 + 1) * s - 6);
    }
    ctx.globalAlpha = 1;
  }
  // Root snare cracks: red zigzags that flash faster just before they erupt.
  for (const snare of gaia.snares) {
    const x = snare.tileX * s - camX, y = snare.tileY * s - camY, urgent = snare.ticks < 24;
    ctx.globalAlpha = urgent && Math.floor(tick / 3) % 2 ? 1 : .75;
    block(ctx, x + 2, y + 2, s - 4, s - 4, '#ff3b4f33');
    for (let k = 0; k < 6; k++) block(ctx, x + 6 + k * 6, y + 20 + (k % 2 ? 6 : 0), 6, 4, '#ff4d5a');
    for (let k = 0; k < 4; k++) block(ctx, x + 22 + (k % 2 ? 4 : 0), y + 6 + k * 8, 4, 6, '#ff8a8a');
    ctx.globalAlpha = 1;
  }
  // Sunstones, including ones flying to their new room.
  for (const stone of gaia.stones) {
    if (stone.travel > 0) {
      const t = 1 - stone.travel / GAIA_STONE_TRAVEL;
      const fx = (stone.fromX + .5) * s, fy = (stone.fromY + .5) * s, tx = (stone.x + .5) * s, ty = (stone.y + .5) * s;
      const px = fx + (tx - fx) * t - camX, py = fy + (ty - fy) * t - Math.sin(t * Math.PI) * 140 - camY;
      ctx.save(); ctx.shadowColor = '#ffd36a'; ctx.shadowBlur = 6;
      for (let k = 3; k >= 0; k--) { ctx.globalAlpha = 1 - k * .22; block(ctx, px - (tx - fx) * .02 * k - 5, py + k * 6 - 5, 10 - k * 2, 10 - k * 2, k ? '#ffd36a' : '#fff3b8'); }
      ctx.restore();
      continue;
    }
    const k = stone.slide ? stone.slide / GAIA_STONE_DRIFT_TICKS : 0; // phase 3 drift slides smoothly to its new tile
    const sx = stone.x + (stone.fromX - stone.x) * k, sy = stone.y + (stone.fromY - stone.y) * k;
    drawStone(ctx, (sx + .5) * s - camX, (sy + .5) * s - camY, stone.lit, stone.lit ? 0 : 1 - stone.relight / GAIA_STONE_RELIGHT, tick);
  }
  ctx.restore();
}

// Roots binding someone in place: four blocky roots burst up around the tile, curl over the top and grip,
// trembling while they hold, then sink back as the hold ends. `hold` 0–1 is how much of the hold remains.
export function drawRootBind(ctx: CanvasRenderingContext2D, x: number, y: number, hold: number, tick: number, squeeze = false) {
  const age = (1 - hold) * GAIA_SNARE_ROOT, rise = squeeze ? 1 : Math.min(1, age / 8), sink = squeeze ? 1 : Math.min(1, hold / .15);
  const reach = 26 * rise * sink, shake = Math.round(Math.sin(tick * (squeeze ? .9 : .6)) * (squeeze ? 1.5 : 2));
  ctx.save(); ctx.translate(Math.round(x) + shake, Math.round(y)); ctx.shadowBlur = 0;
  // Soil burst at the base.
  ctx.globalAlpha = .8 * sink; block(ctx, -24, 14, 48, 8, '#4a3420'); block(ctx, -18, 10, 36, 4, '#6a4a2c');
  ctx.globalAlpha = 1;
  for (const side of [-1, 1]) for (const k of [0, 1]) {
    const bx = side * (12 + k * 8), top = 18 - reach - k * 6;
    block(ctx, bx - 4, top, 8, 18 - top + 2, k ? '#7a5530' : '#5a3a1f'); // root shaft rising from the floor
    if (reach > 14) { // tip curls inward over the body
      const curl = side * -(6 + k * 2);
      block(ctx, bx - 4 + curl, top - 6, 8, 6, '#5a3a1f'); block(ctx, bx - 4 + curl * 2, top - 4, 6, 6, '#8fdc4a');
    }
  }
  if (reach > 18) { // a band of vine wrapping across the middle
    block(ctx, -20, -2, 40, 6, squeeze ? '#c94a3a' : '#3f8a2c'); block(ctx, -20, -2, 40, 2, squeeze ? '#ff8a7a' : '#8fdc4a');
  }
  ctx.restore();
}

export function drawSporeShot(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number) {
  ctx.save(); const len = Math.hypot(dx, dy) || 1;
  for (let k = 2; k > 0; k--) { ctx.globalAlpha = .18 * (3-k); block(ctx, x-dx/len*k*12-5, y-dy/len*k*12-5, 10, 10, '#b9a8ff'); }
  ctx.globalAlpha = 1; ctx.shadowColor = '#b9a8ff'; ctx.shadowBlur = 5;
  block(ctx, x-8, y-8, 16, 16, '#8a6fe0'); ctx.shadowBlur = 0;
  block(ctx, x-4, y-4, 8, 8, '#e2d9ff'); block(ctx, x-2, y-2, 4, 4, '#b6e05a'); ctx.restore();
}
export function drawSporeBurst(ctx: CanvasRenderingContext2D, x: number, y: number, age: number) {
  ctx.save(); const p = age/24; ctx.globalAlpha = Math.max(0,1-p); ctx.shadowBlur = 0;
  for (let k=0;k<8;k++) { const a=k*Math.PI/4, r=8+p*64; block(ctx,x+Math.cos(a)*r-3,y+Math.sin(a)*r-3,6,6,k%2?'#b9a8ff':'#b6e05a'); }
  ctx.strokeStyle='#b9a8ff';ctx.lineWidth=3;const r=8+p*40;ctx.strokeRect(x-r,y-r,r*2,r*2);ctx.restore();
}

const sunfireBloomPalette:Record<string,string>={
  '#d4cc77':'#e8b32f','#b7b26e':'#d6a744','#e3c878':'#f3ba3d','#fff4c9':'#ffe594',
  '#dfca80':'#e8b84d','#d4c579':'#d9ad43','#bcc47c':'#c5ab49','#a9bb70':'#bdac49',
  '#c7cf85':'#dfb54e','#e3d396':'#efc25e','#93ad64':'#b0a34d','#9db56c':'#b9ac50',
  '#ead397':'#f2bc48','#fff0be':'#ffdc80','#d6e3a4':'#e7c66b','#fff8db':'#ffeba5',
  '#b8af63':'#b69b48','#e3d284':'#edbb49','#fff3b8':'#ffe5a1'
};

/** Sunstone impact: open rectangular light bands with square botanical fragments. */
export function drawSunstoneBloom(ctx:CanvasRenderingContext2D,x:number,y:number,progress:number,scale=2,strength=1,particles=48,solar=false,rotation=0){
  const p=Math.max(0,Math.min(1,progress));if(p>=1)return;
  const ink=(base:string)=>solar?(sunfireBloomPalette[base]??base):base;
  const artScale=scale,seedReach=12;
  const ease=(t:number)=>1-(1-t)*(1-t);
  const fade=Math.min(1,(1-p)*2.5)*strength,reach=seedReach+ease(p)*(76-seedReach);
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(rotation);ctx.shadowBlur=0;
  // Every part keeps the original bloom proportions as the complete pattern expands.
  for(let layer=0;layer<3;layer++){
    const q=solar?(p-layer*.1)/(1-layer*.1):p-layer*.1;if(q<0)continue;
    const r=(seedReach+ease(q)*(76-seedReach))*.92,length=14+r*.3,alpha=fade*(1-layer*.3);
    for(let side=0;side<4;side++){
      ctx.save();ctx.rotate(side*Math.PI/2);ctx.translate(0,-r*scale);ctx.scale(artScale,artScale);
      ctx.globalAlpha=alpha*.1;block(ctx,-length*.6,-5,length*1.2,11,ink('#d4cc77'));
      ctx.globalAlpha=alpha*.8;block(ctx,-length/2,-2,length,5,layer?ink('#b7b26e'):ink('#e3c878'));
      ctx.globalAlpha=alpha;block(ctx,-length*.38,-1,length*.76,2,ink('#fff4c9'));
      if(layer===0){
        ctx.globalAlpha=fade*.16;block(ctx,-length*.43,3,length*.86,5,ink('#dfca80'));
        block(ctx,-length*.3,8,length*.6,5,ink('#d4c579'));block(ctx,-length*.16,13,length*.32,4,ink('#bcc47c'));
        ctx.globalAlpha=fade*.55;block(ctx,-length*.43,3,2,5,ink('#f3e7b0'));block(ctx,length*.43-2,3,2,5,ink('#f3e7b0'));
        ctx.globalAlpha=fade*.6;block(ctx,-length/2,5,length*.25,2,ink('#a9bb70'));block(ctx,length*.25,5,length*.25,2,ink('#a9bb70'));
      }
      ctx.restore();
    }
  }
  for(let i=0;i<4;i++){
    const angle=Math.PI/4+i*Math.PI/2,d=reach*.9;
    ctx.save();ctx.rotate(angle);ctx.translate(0,-d*scale);ctx.scale(artScale,artScale);
    ctx.globalAlpha=fade*.55;block(ctx,-8,-4,16,12,ink('#c7cf85'));block(ctx,-5,-8,10,4,ink('#e3d396'));
    ctx.globalAlpha=fade*.8;block(ctx,-4,-6,8,2,ink('#fff5cb'));block(ctx,-1,-4,2,8,ink('#fff5cb'));
    ctx.globalAlpha=fade*.35;block(ctx,-3,d*.24,6,10,ink('#93ad64'));ctx.restore();
  }
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4+.12,d=reach*(.67+i%3*.08);
    ctx.save();ctx.rotate(a);ctx.translate(d*scale,0);ctx.scale(artScale,artScale);
    ctx.globalAlpha=fade*.45;block(ctx,-7,-1,7,2,i%2?ink('#baca7d'):ink('#f5e8b1'));ctx.restore();
  }
  for(let i=0;i<particles;i++){
    const angle=i*2.39996+.2,d=Math.min(14,28/scale)+Math.pow(p,.7)*(60+i%6*12),lift=p*p*(10+i%4*6),isLeaf=i%2===0;
    const particleFade=Math.pow(1-p,.85)*(.4+i%3*.12)*strength,size=3+i%3;
    ctx.save();ctx.translate(Math.cos(angle)*d*scale,(Math.sin(angle)*d+lift)*scale);ctx.rotate(angle+p*(i%2?1:-1)*1.1);ctx.scale(Math.min(scale,3.5),Math.min(scale,3.5));
    ctx.globalAlpha=particleFade;ctx.fillStyle=isLeaf?ink('#9db56c'):i%3?ink('#ead397'):ink('#fff0be');
    ctx.fillRect(-size*.4,-size,size*.8,size*2);ctx.fillRect(-size*.65,-size*.4,size*1.3,size*.8);
    ctx.globalAlpha=particleFade*.8;ctx.fillStyle=isLeaf?ink('#d6e3a4'):ink('#fff8db');ctx.fillRect(-.5,-size*.7,1,size*1.4);ctx.restore();
  }
  ctx.save();ctx.scale(artScale,artScale);
  const flash=Math.max(0,1-p/.3)*strength;
  ctx.globalAlpha=flash*.75;block(ctx,-7,-7,14,14,ink('#b8af63'));block(ctx,-5,-5,10,10,ink('#e3d284'));block(ctx,-2,-2,4,4,ink('#fff8db'));
  for(const dx of [-1,1])for(const dy of [-1,1])block(ctx,dx*4-1,dy*4-1,2,2,ink('#fff3b8'));
  ctx.restore();ctx.restore();
}

// Above actors: spores, pollen drift, blossom shots, Sunstone burns, root binds and Sunfire.
export function drawGaiaOverlay(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const gaia = state.gaia; if (!gaia) return;
  const s = TILE_SIZE;
  ctx.save(); ctx.shadowBlur = 0;
  for (const b of gaia.sporeBursts ?? []) drawSporeBurst(ctx, b.x - camX, b.y - camY, 24 - b.ticks);
  for (const cloud of gaia.spores) {
    const fade = Math.min(1, cloud.ticks / 40) * (1 - Math.max(0, cloud.ticks - (GAIA_SPORE_TICKS - 20)) / 20);
    for (let k = 0; k < 18; k++) {
      const a = hash(cloud.x, cloud.y, k) * Math.PI * 2, r = hash(cloud.y, cloud.x, k) * GAIA_SPORE_RADIUS * s;
      const px = (cloud.x + .5) * s + Math.cos(a + tick * .01) * r - camX, py = (cloud.y + .5) * s + Math.sin(a + tick * .01) * r - camY;
      ctx.globalAlpha = fade * .55; block(ctx, px - 6, py - 6, 12, 12, k % 4 === 0 ? '#b6e05a' : k % 3 ? '#a58cff' : '#d8ccff'); // sickly green motes: it poisons
    }
  }
  if (gaia.pollen) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[gaia.pollen.chamber];
    const x = c1 * s - camX, y = r1 * s - camY, w = (c2 - c1 + 1) * s, h = (r2 - r1 + 1) * s, fade = Math.min(1, gaia.pollen.ticks / 40);
    ctx.globalAlpha = .16 * fade; block(ctx, x, y, w, h, '#f2d64a');
    for (let k = 0; k < 40; k++) {
      const px = x + ((hash(k, 1, 3) * w + tick * (.3 + hash(k, 2, 3) * .4)) % w), py = y + ((hash(k, 4, 3) * h + Math.sin(tick * .02 + k) * 20 + h) % h);
      ctx.globalAlpha = .7 * fade; block(ctx, px, py, 4, 4, k % 4 ? '#ffe680' : '#fff8cc');
    }
  }
  for (const bolt of gaia.bolts) {
    const t = 1 - bolt.ticks / 16;
    for (let k = 0; k < 4; k++) {
      const u = Math.max(0, t - k * .08);
      ctx.globalAlpha = 1 - k * .2; block(ctx, bolt.fromX + (bolt.toX - bolt.fromX) * u - camX - 5, bolt.fromY + (bolt.toY - bolt.fromY) * u - camY - 5, 10, 10, k ? '#ffb7dc' : '#fff0f8');
    }
  }
  // Blossom pulse: expanding stepped rings from a burst.
  for (const p of gaia.blossomPulses ?? []) {
    const t = 1 - p.ticks / GAIA_BLOSSOM_PULSE.ringTicks, reach = (GAIA_BLOSSOM_PULSE.radius + .5) * s, x = p.x - camX, y = p.y - camY;
    for (let k = 0; k < 3; k++) {
      const u = t - k * .14; if (u <= 0 || u >= 1) continue;
      const half = Math.round((10 + u * reach) / 6) * 6;
      ctx.globalAlpha = (1 - u) * .85; ctx.strokeStyle = k === 1 ? '#ff8fc8' : '#ffd6ec'; ctx.lineWidth = k === 1 ? 6 : 3;
      ctx.strokeRect(x - half, y - half, half * 2, half * 2);
    }
  }
  for (const flash of gaia.stoneFlashes) {
    const t = flash.ticks / GAIA_STONE_BLOOM_TICKS, sx = (flash.x + .5) * s - camX, sy = (flash.y + .5) * s - camY, ex = (flash.toX + .5) * s - camX, ey = (flash.toY + .5) * s - camY;
    ctx.globalAlpha = t*.65; ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3; ctx.shadowColor = '#ffd36a'; ctx.shadowBlur = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.shadowBlur = 0;
    drawSunstoneBloom(ctx,sx,sy,1-t);
  }
  // Roots holding you after a snare, and Ruby after a snare or while a closed ring squeezes it.
  if (gaia.snaredTicks > 0) drawRootBind(ctx, state.playerX - camX, state.playerY - camY, gaia.snaredTicks / GAIA_SNARE_ROOT, tick);
  if (state.rubyTileX !== -1 && (gaia.rubyRootTicks > 0 || gaia.ringClosure >= 1)) {
    const rx = (state.rubyTileX + .5) * s - camX, ry = (state.rubyTileY + .5) * s - camY;
    drawRootBind(ctx, rx, ry, gaia.rubyRootTicks > 0 ? gaia.rubyRootTicks / GAIA_SNARE_ROOT : 1, tick, gaia.rubyRootTicks <= 0);
  }
  // Sunfire: the chosen room glows gold with a narrowing column, then the sun strikes.
  if (gaia.sunfire) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[gaia.sunfire.chamber];
    const x = c1 * s - camX, y = r1 * s - camY, w = (c2 - c1 + 1) * s, h = (r2 - r1 + 1) * s, t = 1 - gaia.sunfire.ticks / GAIA_SUN_WARNING;
    ctx.globalAlpha = .12 + .14 * Math.abs(Math.sin(tick * .2)); block(ctx, x, y, w, h, '#ffd36a');
    const col = Math.max(16, w * (1 - t) * .5);
    ctx.globalAlpha = .25 + t * .35; block(ctx, x + w / 2 - col / 2, y - 600, col, h / 2 + 600, '#ffe680');
    ctx.globalAlpha = 1;
  }
  if (gaia.sunBurst) {
    const burst=gaia.sunBurst,p=1-burst.ticks/36,x=burst.x-camX,y=burst.y-camY;
    // The same tiered square-petal wave as Sunstones, scaled to this cast's real radius.
    drawSunstoneBloom(ctx,x,y,p,burst.radius*s/76,1,48,true);
  }
  if (gaia.sunImpact) {
    const [r1,c1,r2,c2]=CHAMBER_BOUNDS[gaia.sunImpact.chamber];
    const x=c1*s-camX,y=r1*s-camY,w=(c2-c1+1)*s,h=(r2-r1+1)*s,age=120-gaia.sunImpact.ticks;
    const cx=x+w/2,cy=y+h/2;
    ctx.globalAlpha=Math.max(0,1-age/12)*.22;block(ctx,x,y,w,h,'#fff4ce');
    // Both layers launch together; the softer lower wave travels beyond the chamber.
    const follow=age/84;
    if(follow>=0&&follow<1){
      const far=Math.max(...[[0,0],[MAP_COLS*s,0],[0,MAP_ROWS*s],[MAP_COLS*s,MAP_ROWS*s]].map(([px,py])=>Math.hypot(px-(cx+camX),py-(cy+camY))));
      const start=Math.min(w,h)*.66/76,growth=follow*follow*(3-2*follow);
      drawSunstoneBloom(ctx,cx,cy,follow,start+(far*1.25/76-start)*growth,.55,48,true);
    }
    // Keep the original chamber-sized flower: its fronts expand, its petals do not zoom.
    const progress=age/84,bloomScale=Math.min(w,h)*.66/76;
    if(progress<1)drawSunstoneBloom(ctx,cx,cy,progress,bloomScale,1,64,true);
  }
  ctx.restore();
}

// Gaia's plants and aliens. Returns false for any other unit.
export function drawGaiaUnit(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number): boolean {
  if (e.type !== 'seed_pod' && e.type !== 'blossom' && e.type !== 'sporeling' && e.type !== 'vine_crawler' && e.type !== 'angry_mushroom' && e.type !== 'lifebloom') return false;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.shadowBlur = 0;
  if (e.flashTicks > 0) ctx.filter = 'brightness(1.8)';
  if (e.type === 'seed_pod') {
    const grow = 1 - Math.max(0, e.windupTicks) / GAIA_POD_FUSE, urgent = grow > .66 && Math.floor(tick / 5) % 2 === 0;
    const size = Math.round(14 + grow * 12);
    block(ctx, -2, 4, 4, 14, '#3f7a2c'); block(ctx, -10, 12, 8, 4, '#5fae3e'); block(ctx, 2, 10, 8, 4, '#5fae3e');
    ctx.shadowColor = '#c6e86a'; ctx.shadowBlur = urgent ? 6 : 3;
    block(ctx, -size / 2, -size + 6, size, size, urgent ? '#f4ffb0' : '#a8d84a'); ctx.shadowBlur = 0;
    block(ctx, -size / 2, -size + 6, size / 3, size, '#7fb03a'); block(ctx, size / 6, -size + 6 + 4, 4, size - 8, '#e0f8a0');
    block(ctx, -4, -size + 2, 8, 4, '#3f7a2c');
  } else if (e.type === 'blossom') {
    const pulse = Math.round(Math.sin(tick * .1 + e.id) * 2);
    block(ctx, -2, 2, 4, 18, '#3f7a2c'); block(ctx, -12, 10, 10, 6, '#5fae3e'); block(ctx, 2, 6, 10, 6, '#5fae3e');
    ctx.shadowColor = '#ff8fc8'; ctx.shadowBlur = 4;
    for (const [dx, dy] of [[0, -12], [12, 0], [0, 12], [-12, 0]]) block(ctx, dx - 7 - (dx ? pulse : 0) * Math.sign(dx), dy - 7 - (dy ? pulse : 0) * Math.sign(dy) - 6, 14, 14, '#ff8fc8');
    ctx.shadowBlur = 0;
    for (const [dx, dy] of [[0, -12], [12, 0], [0, 12], [-12, 0]]) block(ctx, dx - 3, dy - 3 - 6, 6, 6, '#ffd6ec');
    block(ctx, -6, -12, 12, 12, '#ffd36a'); block(ctx, -6, -12, 4, 4, '#fff3b8');
    if (e.shootTicks > 0) { ctx.globalAlpha = e.shootTicks / 12; block(ctx, -10, -16, 20, 20, '#fff0f8'); ctx.globalAlpha = 1; }
  } else if (e.type === 'lifebloom') {
    // A friendly white-mint flower with a glowing green cross at its heart; it fades out in its last two seconds.
    const fade = Math.min(1, e.windupTicks / 120), pulse = .7 + .3 * Math.abs(Math.sin(tick * .1 + e.id));
    ctx.globalAlpha = fade;
    block(ctx, -2, 2, 4, 16, '#3f8a2c'); block(ctx, -12, 8, 10, 5, '#5fae3e'); block(ctx, 2, 4, 10, 5, '#5fae3e');
    ctx.shadowColor = '#9fffc8'; ctx.shadowBlur = 6 * pulse;
    for (const [dx, dy] of [[0, -11], [11, 0], [0, 11], [-11, 0]]) block(ctx, dx - 6, dy - 6 - 6, 12, 12, '#e8fff0');
    ctx.shadowBlur = 0;
    block(ctx, -6, -12, 12, 12, '#9fffc8');
    block(ctx, -2, -10, 4, 8, '#ffffff'); block(ctx, -4, -8, 8, 4, '#ffffff');
    ctx.globalAlpha = 1;
  } else if (e.type === 'angry_mushroom') {
    // A red-capped mushroom sprinting on stubby legs, brows furrowed; it lunges when it hits.
    const run = Math.floor(tick / 5 + e.id) % 2, lunge = e.shootTicks > 0 ? 4 : 0, dir = e.targetTileX - e.tileX < 0 ? -1 : 1;
    ctx.scale(dir, 1); ctx.translate(lunge, 0);
    block(ctx, -8, 8, 5, run ? 8 : 5, '#c9b896'); block(ctx, 3, 8, 5, run ? 5 : 8, '#c9b896');
    block(ctx, -9, -2, 18, 12, '#f0e2c0'); block(ctx, -9, 6, 18, 4, '#c9b896');
    block(ctx, -6, 0, 4, 4, '#1a0f0f'); block(ctx, 3, 0, 4, 4, '#1a0f0f');
    block(ctx, -8, -3, 6, 2, '#1a0f0f'); block(ctx, 2, -3, 6, 2, '#1a0f0f'); // angry brows
    block(ctx, -3, 6, 6, 2, '#8a2a2a');
    ctx.shadowColor = '#ff5a4a'; ctx.shadowBlur = 4;
    block(ctx, -18, -16, 36, 14, '#e2382c'); ctx.shadowBlur = 0;
    block(ctx, -14, -20, 28, 4, '#e2382c'); block(ctx, -18, -6, 36, 4, '#a8231c');
    block(ctx, -12, -16, 6, 5, '#ffe8e0'); block(ctx, 4, -18, 5, 5, '#ffe8e0'); block(ctx, 10, -11, 4, 4, '#ffe8e0');
  } else if (e.type === 'sporeling') {
    const bob = Math.round(Math.sin(tick * .15 + e.id) * 2);
    if (e.windupTicks > 0) { ctx.globalAlpha = .5 + .5 * Math.abs(Math.sin(tick*.3)); block(ctx, -8, -23 + bob, 16, 5, '#b6e05a'); ctx.globalAlpha = 1; }
    if (e.shootTicks > 0) block(ctx, -10, -20 + bob, 20, 6, '#e2d9ff');
    block(ctx, -8, 0 + bob, 16, 12, '#e6dcc0'); block(ctx, -8, 8 + bob, 16, 4, '#b8ad90');
    block(ctx, -5, 3 + bob, 3, 3, '#1a1426'); block(ctx, 2, 3 + bob, 3, 3, '#1a1426');
    ctx.shadowColor = '#b9a8ff'; ctx.shadowBlur = 4;
    block(ctx, -16, -14 + bob, 32, 14, '#8a6fe0'); ctx.shadowBlur = 0;
    block(ctx, -16, -6 + bob, 32, 6, '#5f48b0'); block(ctx, -12, -18 + bob, 24, 4, '#8a6fe0');
    block(ctx, -10, -14 + bob, 5, 5, '#e2d9ff'); block(ctx, 4, -12 + bob, 4, 4, '#e2d9ff'); block(ctx, -2, -17 + bob, 3, 3, '#e2d9ff');
  } else {
    const wave = (k: number) => Math.round(Math.sin(tick * .2 + k * 1.2 + e.id) * 3);
    const dir = e.targetTileX - e.tileX < 0 ? -1 : 1;
    ctx.scale(dir, 1);
    for (let k = 2; k >= 0; k--) {
      const x = -16 + k * 12;
      block(ctx, x - 7, -7 + wave(k), 14, 14, k === 2 ? '#7fd35a' : '#5fbf4a'); block(ctx, x - 7, 3 + wave(k), 14, 4, '#3f8a2c');
      if (k < 2) block(ctx, x - 3, -11 + wave(k), 6, 4, '#b6f0a0');
    }
    block(ctx, 12, -3 + wave(2), 3, 3, '#0b1020');
  }
  ctx.restore();
  drawEnemyHealthBar(ctx,e,sx,sy);
  return true;
}

// Gaia backdrop behind the station: a dusky forest seen through the void. Two parallax tree lines, light shafts,
// drifting pollen and blinking fireflies.
export function drawForestBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, camX: number, camY: number, tick: number) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, '#0b1a14'); sky.addColorStop(.6, '#0a2416'); sky.addColorStop(1, '#06140c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, viewW, viewH);
  for (let k = 0; k < 4; k++) { // light shafts
    const x = ((k * 377 - camX * .03) % (viewW + 400) + viewW + 400) % (viewW + 400) - 200;
    ctx.globalAlpha = .045 + .02 * Math.sin(tick * .01 + k); ctx.fillStyle = '#e8f0a0';
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 120, 0); ctx.lineTo(x + 260, viewH); ctx.lineTo(x + 100, viewH); ctx.fill();
  }
  // A pale moon with a soft halo and two far stepped ridges give the forest depth.
  const mx = viewW * .8 - camX * .008, my = viewH * .16 - camY * .006;
  for (let ring = 3; ring >= 0; ring--) { ctx.globalAlpha = ring ? .035 : .55; const r = 22 + ring * 16; for (let row = -r; row < r; row += 4) { const half = Math.round(Math.sqrt(r * r - row * row) / 4) * 4; block(ctx, mx - half, my + row, half * 2, 4, ring ? '#e8f0c0' : '#dfe8b8'); } }
  ctx.globalAlpha = .18; block(ctx, mx - 8, my - 6, 8, 6, '#9fb48a'); block(ctx, mx + 6, my + 8, 6, 4, '#9fb48a');
  for (const [par, base, amp, col] of [[.015, .5, .16, '#0c2216'], [.03, .62, .12, '#0d2818']] as const) {
    ctx.globalAlpha = 1; ctx.fillStyle = col;
    for (let x = -24; x < viewW + 24; x += 24) { const wx = x + camX * par, top = viewH * base - camY * par * .5 + Math.round((Math.sin(wx * .004) * amp + Math.sin(wx * .011 + 2) * amp * .35) * viewH / 8) * 8; ctx.fillRect(x, top, 24, viewH - top); }
  }
  // Three tree lines with very different heights: short shrubs, mid trees and rare towering pines. The vertical
  // offset follows where the camera is in the map, within a limited range, so canopies stay in view at the bottom.
  const mapH = MAP_ROWS * TILE_SIZE, depth = Math.max(0, Math.min(1, camY / mapH)) - .5;
  for (const [layer, par, color, light] of [[0, .05, '#0d2618', '#14361f'], [1, .1, '#113520', '#1a4a29'], [2, .16, '#15402a', '#215a32']] as const) {
    const span = 70 + layer * 34, lift = depth * viewH * (.1 + layer * .06);
    for (let k = -2; k < viewW / span + 3; k++) {
      const n = Math.floor(camX * par / span) + k, x = n * span - camX * par + (hash(n, layer, 7) - .5) * span * .5; // from the tree's world index, so nothing jumps when camX goes negative
      const roll = hash(n, layer, 1), kind = roll > .86 ? 'pine' : roll < .22 ? 'shrub' : 'tree';
      const h = viewH * (kind === 'pine' ? .85 + hash(n, layer, 2) * .25 : kind === 'shrub' ? .12 + hash(n, layer, 2) * .12 : .3 + hash(n, layer, 2) * .42) * (.8 + layer * .1);
      const top = viewH - h - lift, w = span * (kind === 'shrub' ? 1.1 : .9 + hash(n, layer, 3) * .4);
      ctx.globalAlpha = 1;
      if (kind === 'shrub') { block(ctx, x, top + 14, w, viewH - top, color); block(ctx, x + w * .15, top, w * .7, 16, color); block(ctx, x + w * .2, top, w * .4, 3, light); continue; }
      block(ctx, x + w * .44, top + 30, Math.max(6, w * .12), viewH - top + 60, color); // trunk
      const tiers = kind === 'pine' ? 6 + Math.floor(hash(n, layer, 4) * 3) : 3 + Math.floor(hash(n, layer, 4) * 2), th = kind === 'pine' ? 30 : 26;
      for (let tier = 0; tier < tiers; tier++) {
        const tw = kind === 'pine' ? w * (.3 + tier / tiers * .9) : w - Math.abs(tier - 1) * w * .18, tx = x + (w - tw) / 2;
        block(ctx, tx, top + tier * th, tw, th + 4, color); block(ctx, tx + 4, top + tier * th, tw * .45, 3, light);
      }
      if (layer === 2 && kind === 'tree') {
        // Hanging vines under the canopy and a small glowing mushroom cluster at the trunk.
        const bottom = top + tiers * th;
        for (let v = 0; v < 3; v++) if (hash(n, v, 21) > .45) { const vx = x + w * (.18 + v * .3), vl = 24 + hash(n, v, 22) * 70; block(ctx, vx, bottom, 2, vl, '#1d5a30'); block(ctx, vx - 2, bottom + vl * .5, 6, 4, '#24683a'); block(ctx, vx - 1, bottom + vl, 4, 4, '#2a7442'); }
        if (hash(n, 5, 23) > .5) {
          const gx = x + w * .44 + (hash(n, 6, 23) > .5 ? -12 : Math.max(6, w * .12) + 2), gy = viewH - 30 - lift * .3, glow = .55 + .3 * Math.sin(tick * .03 + n), col = hash(n, 7, 23) > .5 ? '#7affd2' : '#ffb0e8';
          ctx.globalAlpha = glow * .18; block(ctx, gx - 8, gy - 10, 26, 18, col);
          ctx.globalAlpha = glow; block(ctx, gx, gy, 8, 4, col); block(ctx, gx + 3, gy + 4, 2, 6, '#c8e8b8'); block(ctx, gx + 9, gy + 5, 6, 3, col); block(ctx, gx + 11, gy + 8, 2, 4, '#c8e8b8');
        }
      }
    }
  }
  // Slow mist drifts low across the forest.
  for (let k = 0; k < 5; k++) {
    const span = viewW + 600, x = ((k * 431 + tick * (.12 + k * .03) - camX * .12) % span + span) % span - 300, y = viewH * (.62 + k * .07) - camY * .02;
    ctx.globalAlpha = .045; block(ctx, x, y, 380, 18, '#cfe8c0'); block(ctx, x + 60, y - 8, 220, 8, '#cfe8c0');
  }
  for (let k = 0; k < 40; k++) {
    const x = ((hash(k, 1, 9) * viewW * 1.4 - camX * .1 + Math.sin(tick * .01 + k) * 30) % viewW + viewW) % viewW;
    const y = ((hash(k, 2, 9) * viewH * 1.4 - camY * .1 - tick * .2) % viewH + viewH) % viewH;
    const blink = k % 3 === 0 ? .5 + .5 * Math.sin(tick * .07 + k) : .5;
    ctx.globalAlpha = blink * .8; block(ctx, x, y, k % 3 === 0 ? 4 : 3, k % 3 === 0 ? 4 : 3, k % 3 === 0 ? '#d8ff7a' : '#fff3b8');
  }
  ctx.restore();
}

// Floor dressing: fireflies drifting over the station and roots creeping over cover blocks.
const isCoverTile = (state: Readonly<GameState>, tx: number, ty: number) => state.map[ty]?.[tx] === 0 && CHAMBER_BOUNDS.some(([t, l, b, r]) => tx > l && tx < r && ty > t && ty < b);

// A cover block as mossy stone: two or three grey-green stones of different sizes with dark mortar between them, a light
// top-left bevel and dark lower-right edge on each, an occasional crack, moss patches along the top, and a rim in the
// natural stone edges only where the block meets open floor.
export function drawGaiaStone(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string) {
  const s = TILE_SIZE, cover = hash(tx, ty, 70), moss = cover > .75 ? 2 : cover > .35 ? 1 : 0;
  ctx.save(); ctx.shadowBlur = 0; ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
  block(ctx, x, y, s, s, '#1b211a'); // mortar
  const split = 16 + Math.floor(hash(tx, ty, 21) * 16), cut = 14 + Math.floor(hash(tx, ty, 22) * 20), horizontal = hash(tx, ty, 23) > .5;
  const stones = horizontal
    ? [[1, 1, s - 2, split - 2], [1, split + 1, cut - 2, s - split - 2], [cut + 1, split + 1, s - cut - 2, s - split - 2]]
    : [[1, 1, split - 2, s - 2], [split + 1, 1, s - split - 2, cut - 2], [split + 1, cut + 1, s - split - 2, s - cut - 2]];
  stones.forEach(([sx, sy, w, h], i) => {
    const tone = hash(tx * 3 + i, ty, 24);
    block(ctx, x + sx, y + sy, w, h, tone > .66 ? '#56604f' : tone > .33 ? '#4b5446' : '#434b3f');
    block(ctx, x + sx, y + sy, w, 2, '#77816c'); block(ctx, x + sx, y + sy, 2, h, '#6a7461'); // light bevel
    block(ctx, x + sx, y + sy + h - 2, w, 2, '#2f362c'); block(ctx, x + sx + w - 2, y + sy, 2, h, '#343b31'); // shade
    if (hash(tx, ty, 25 + i) > .72 && w > 10 && h > 10) { // a short stepped crack
      const cx = x + sx + 4 + Math.floor(hash(tx, ty, 30 + i) * (w - 10)), cy = y + sy + 3;
      block(ctx, cx, cy, 2, 4, '#262c24'); block(ctx, cx + 2, cy + 4, 2, 4, '#262c24'); block(ctx, cx + 1, cy + 8, 2, 3, '#262c24');
    }
    if (moss > 0 && (moss === 2 || hash(tx, ty, 71 + i) > .3)) {
      // Thick flat moss mats grow over the stone faces; keep some masonry and its
      // shaded edges exposed even on the heavily overgrown variant.
      const depth = Math.max(4, Math.floor((h - 4) * (moss === 2 ? .78 : .38)));
      const mx = x + sx + 2, my = y + sy + 2, width = w - 4;
      ctx.save(); ctx.beginPath(); ctx.rect(mx, my, width, h - 4); ctx.clip();
      block(ctx, mx, my, width * .78, depth, '#365c2c');
      block(ctx, mx + width * .25, my + 1, width * .75, depth * .72, '#466f33');
      block(ctx, mx + width * .15, my + depth - 2, width * .3, moss === 2 ? 8 : 4, '#365e29');
      block(ctx, mx + width * .62, my + depth * .65, width * .25, moss === 2 ? 10 : 3, '#416d2e');
      block(ctx, mx + 2, my, Math.max(3, width * .4), 3, '#637e43');
      ctx.restore();
    }
  });
  if (!isCoverTile(state, tx, ty - 1)) { // moss creeping over the top
    for (let k = 0; k < 3; k++) if (hash(tx, ty, 40 + k) > .4) {
      const mx = x + 3 + Math.floor(hash(tx, ty, 43 + k) * (s - 14));
      const mw = Math.min(s - (mx - x) - 1, 6 + moss * 4 + Math.floor(hash(tx, ty, 46 + k) * 8));
      block(ctx, mx, y, mw, moss === 2 ? 5 : 3, '#5f9a3c');
      block(ctx, mx + 2, y + 3, Math.max(2, mw - 5), moss === 2 ? 7 : 2 + moss * 2, '#4a7f2e');
    }
  }
  const open = (dx: number, dy: number) => !isCoverTile(state, tx + dx, ty + dy);
  // Solid worn stone rims give joined walls weight without a luminous colour frame.
  if (open(0, -1)) { block(ctx, x, y, s, 3, '#899079'); block(ctx, x + 2, y + 3, s - 4, 1, '#626d58'); }
  if (open(-1, 0)) block(ctx, x, y + (open(0, -1) ? 3 : 0), 2, s - (open(0, -1) ? 3 : 0), '#737c66');
  if (open(1, 0)) block(ctx, x + s - 3, y + (open(0, -1) ? 3 : 0), 3, s - (open(0, -1) ? 3 : 0), '#30392c');
  if (open(0, 1)) { block(ctx, x, y + s - 4, s, 4, '#252e23'); block(ctx, x + 2, y + s - 5, s - 4, 1, '#59614e'); }
  if (moss > 0 && hash(tx, ty, 73) > .93) {
    ctx.globalAlpha = 1;
    const fx = x + 12 + Math.floor(hash(tx, ty, 74) * 24), fy = y + 9 + Math.floor(hash(tx, ty, 75) * 15);
    const petal = ['#b77e96', '#a99b65', '#9886ac'][Math.floor(hash(tx, ty, 76) * 3)];
    // Square petals and one solid centre, growing from moss rather than floating.
    block(ctx, fx, fy + 2, 2, 8, '#426e31'); block(ctx, fx + 2, fy + 6, 4, 3, '#5d893d');
    block(ctx, fx - 1, fy - 4, 3, 3, petal); block(ctx, fx - 4, fy - 1, 3, 3, petal);
    block(ctx, fx + 2, fy - 1, 3, 3, petal); block(ctx, fx - 1, fy + 2, 3, 3, petal);
    block(ctx, fx - 1, fy - 1, 3, 3, '#c1b27b');
  }
  ctx.restore();
}

function drawGaiaGrass(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, dark: boolean, lean = 0) {
  const body = dark ? '#365c2c' : '#477132', leaf = dark ? '#527b36' : '#658c40';
  const small = height < 14, width = small ? 3 : 5, thickness = small ? 2 : 3;
  ctx.save();
  for (let frond = 0; frond < 2; frond++) {
    const fh = height * (frond ? .78 : 1);
    ctx.save(); ctx.translate(x + (frond ? 4 : -3), y); ctx.rotate((frond ? .12 : -.1) + lean);
    block(ctx, -1, -fh, height > 18 ? 3 : 2, fh, body);
    block(ctx, -width, -fh * .4, width, thickness, leaf);
    block(ctx, -width, -fh * .4 - thickness + 1, 2, thickness, leaf);
    block(ctx, 1, -fh * .7, width, thickness, leaf);
    block(ctx, width - 1, -fh * .7 - thickness + 1, 2, thickness, leaf);
    ctx.restore();
  }
  block(ctx, x - 5, y - 1, 12, 2, body);
  ctx.restore();
}

// Wind sweep across Gaia's floor: 0 outside the band, 1 at its centre. World-space along x + .4y, like the Moon's sheen.
const WIND_PERIOD = 1500, WIND_SPEED = 1.5, WIND_HALF = 170;
function windAt(px: number, py: number, tick: number) {
  const d = (((px + py * .4) - tick * WIND_SPEED) % WIND_PERIOD + WIND_PERIOD) % WIND_PERIOD;
  return d < WIND_HALF * 2 ? Math.sin(d / (WIND_HALF * 2) * Math.PI) : 0;
}
export function drawForestAmbience(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number) {
  const s = TILE_SIZE;
  ctx.save(); ctx.shadowBlur = 0;
  { // A soft pale-green band of wind light rolls across open floor, clipped to floor tiles.
    const left = x0 * s - camX, top = y0 * s - camY, w = (x1 - x0 + 1) * s, h = (y1 - y0 + 1) * s;
    ctx.save(); ctx.beginPath();
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (state.map[ty]?.[tx] !== T_FLOOR) continue;
      const start = tx; while (tx < x1 && state.map[ty]?.[tx + 1] === T_FLOOR) tx++;
      ctx.rect(start * s - camX, ty * s - camY, (tx - start + 1) * s, s);
    }
    ctx.clip();
    const head = ((tick * WIND_SPEED) % WIND_PERIOD + WIND_PERIOD) % WIND_PERIOD, norm = 1.16; // |(1,.4)|^2
    const lo = left + camX + (top + camY) * .4 - WIND_HALF * 2, hi = left + w + camX + (top + h + camY) * .4 + WIND_HALF * 2;
    for (let u = lo - ((lo - head) % WIND_PERIOD + WIND_PERIOD) % WIND_PERIOD; u <= hi; u += WIND_PERIOD) {
      if (u < lo) continue;
      const C = u + WIND_HALF - camX - camY * .4, qx = C / norm, qy = C * .4 / norm, dx = WIND_HALF / Math.sqrt(norm), dy = dx * .4;
      const g = ctx.createLinearGradient(qx - dx, qy - dy, qx + dx, qy + dy);
      g.addColorStop(0, '#b8e07a00'); g.addColorStop(.4, '#b8e07a'); g.addColorStop(.5, '#e8f8c0'); g.addColorStop(.6, '#b8e07a'); g.addColorStop(1, '#b8e07a00');
      ctx.globalAlpha = .07; ctx.fillStyle = g; ctx.fillRect(left, top, w, h);
    }
    ctx.restore();
    // Subtle grass texture appears only on tiles the wind is crossing: short blades that
    // fade in and out with the band and bend slightly with it.
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (state.map[ty]?.[tx] !== T_FLOOR || windAt(tx * s + s / 2, ty * s + s / 2, tick) <= 0 && windAt(tx * s, ty * s, tick) <= 0 && windAt(tx * s + s, ty * s + s, tick) <= 0) continue;
      const x = tx * s - camX, y = ty * s - camY;
      for (let b = 0; b < 12; b++) {
        const bx = 2 + Math.floor(hash(tx * 13 + b, ty, 101) * 43), by = 6 + Math.floor(hash(tx, ty * 13 + b, 102) * 40), l = windAt(tx * s + bx, ty * s + by, tick);
        if (l <= .02) continue;
        const tall = 3 + Math.floor(hash(tx + b, ty, 103) * 3), bend = l > .5 ? 1 : 0;
        ctx.globalAlpha = l * .22; const col = b % 3 ? '#5f8f3a' : '#86b04e';
        block(ctx, x + bx, y + by - tall, 1, tall, col); block(ctx, x + bx + 1 + bend, y + by - tall - 2, 1, 2, col);
      }
    }
  }
  // Subtle forest floor, kept faint under the vines and fully static: thin right-angle root veins etched into some
  // tiles, a few fallen leaves, pebbles and low-contrast blocky grass tufts.
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (state.map[ty]?.[tx] !== T_FLOOR) continue;
    const x = tx * s - camX, y = ty * s - camY;
    // Colour variety in soft clumps: moss, olive, teal-green and earth patches in the same dark woodland range.
    const clump = hash(Math.floor((tx + 1) / 3), Math.floor((ty + 2) / 3), 90), patch = ['#2f5a22', '#4a5420', '#1f5444', '#4f3e22', '#3a5a2a'][Math.floor(clump * 5)];
    ctx.globalAlpha = .14 + hash(tx, ty, 91) * .06; block(ctx, x, y, s, s, patch);
    if (hash(tx, ty, 92) > .8) { ctx.globalAlpha = .14; block(ctx, x + 6 + Math.floor(hash(tx, ty, 93) * 20), y + 6 + Math.floor(hash(tx, ty, 94) * 20), 14, 10, clump > .5 ? '#5e7a2c' : '#2c6a50'); }
    if (hash(tx, ty, 95) > .95) { ctx.globalAlpha = .45; const fx = x + 8 + Math.floor(hash(tx, ty, 96) * 30), fy = y + 8 + Math.floor(hash(tx, ty, 97) * 30); block(ctx, fx, fy, 2, 2, ['#c9b86a', '#a98ab8', '#d8d8b0'][Math.floor(hash(tx, ty, 98) * 3)]); block(ctx, fx + 5, fy + 3, 2, 2, '#c9b86a'); }
    if (hash(tx, ty, 55) > .78) { // a root vein: one straight run with a right-angle bend
      const across = hash(tx, ty, 56) > .5, at = 10 + Math.floor(hash(tx, ty, 57) * 28), bend = 8 + Math.floor(hash(tx, ty, 58) * 30);
      ctx.globalAlpha = .45;
      if (across) { block(ctx, x, y + at, bend, 2, '#071008'); block(ctx, x + bend, y + at, 2, s - at, '#071008'); }
      else { block(ctx, x + at, y, 2, bend, '#071008'); block(ctx, x + at, y + bend, s - at, 2, '#071008'); }
    }
    if (hash(tx, ty, 60) > .9) { // a fallen leaf
      const lx = x + 8 + Math.floor(hash(tx, ty, 61) * 30), ly = y + 8 + Math.floor(hash(tx, ty, 62) * 30), tone = hash(tx, ty, 63) > .5 ? '#7a8a2e' : '#5f7a2a';
      ctx.globalAlpha = .4; block(ctx, lx, ly + 2, 6, 2, tone); block(ctx, lx + 2, ly, 2, 6, tone);
    }
    if (hash(tx, ty, 50) > .86) { ctx.globalAlpha = .28; block(ctx, x + 8 + Math.floor(hash(tx, ty, 51) * 28), y + 8 + Math.floor(hash(tx, ty, 52) * 28), 4, 3, '#6b6a52'); }
    if (hash(tx, ty, 53) > .9) {
      const tall = hash(tx, ty, 77) > .7;
      const height = tall ? 13 + Math.floor(hash(tx, ty, 78) * 6) : 6 + Math.floor(hash(tx, ty, 78) * 4);
      const gx = x + 12 + Math.floor(hash(tx, ty, 54) * 22), gy = y + 23 + Math.floor(hash(tx, ty, 79) * 16);
      const gust = windAt(tx * s + gx - x, ty * s + gy - y, tick);
      ctx.globalAlpha = (tall ? .25 : .3) + gust * .3;
      drawGaiaGrass(ctx, gx, gy, height, hash(tx, ty, 80) > .5, gust * .45);
    }
  }
  ctx.globalAlpha = 1;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (state.map[ty]?.[tx] !== 0 || hash(tx, ty, 3) < .55) continue;
    const ch = CHAMBER_BOUNDS.findIndex(([t, l, b, r]) => tx > l && tx < r && ty > t && ty < b); if (ch < 0) continue;
    const x = tx * s - camX, y = ty * s - camY;
    const onTop = !isCoverTile(state, tx, ty - 1) && hash(tx, ty, 81) > .45;
    const tall = hash(tx, ty, 82) > .65, baseX = x + 12 + Math.floor(hash(tx, ty, 83) * 22);
    const baseY = onTop ? y + 2 : y + s - 7;
    const height = tall ? 20 + Math.floor(hash(tx, ty, 84) * 11) : 8 + Math.floor(hash(tx, ty, 84) * 7);
    // Two simple rectangular fronds, like Neptune's kelp, in muted woodland greens.
    ctx.save(); ctx.globalAlpha = .85;
    drawGaiaGrass(ctx, baseX, baseY, height, hash(tx, ty, 85) > .5);
    ctx.restore();
  }
  for (let k = 0; k < 24; k++) {
    const fx = (x0 + hash(k, 5, 1) * (x1 - x0 + 1)) * s + Math.sin(tick * .013 + k * 2) * 60 - camX;
    const fy = (y0 + hash(k, 6, 1) * (y1 - y0 + 1)) * s + Math.cos(tick * .011 + k) * 50 - camY;
    ctx.globalAlpha = .35 + .35 * Math.sin(tick * .08 + k); block(ctx, fx, fy, 4, 4, '#d8ff7a');
  }
  ctx.restore();
}
