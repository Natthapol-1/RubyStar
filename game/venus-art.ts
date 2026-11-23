import { TILE_SIZE, T_FLOOR } from './constants';
import type { GameState } from './engine';
import { drawEncounterEnemy } from './encounter-art';
import { VENUS, venusCoreHintRect, venusCoreSealed, venusRevealing, venusRevealingOrder, venusShowingNumbers, venusSweepCovers, type RelicKind } from './venus';

// Venus challenge art: Sand Swirl bursts, his leap (landing marker and shadow), the lance telegraph and beam, totem
// blasts, parries and the number over each visible totem. Everything is drawn from the simulation state and tick.
const S = TILE_SIZE, CYAN = '#78dedf', GOLD = '#ffd27a', SAND = '#e3c08a', RED = '#ff6a4d';
const block = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export function drawVenusNest(ctx: CanvasRenderingContext2D, x: number, y: number) {
  block(ctx, x - 14, y + 2, 28, 8, '#59392d');
  block(ctx, x - 11, y - 3, 22, 9, '#a66648');
  block(ctx, x - 7, y - 7, 14, 6, '#d58e61');
  block(ctx, x - 5, y - 4, 10, 7, '#251818');
  block(ctx, x - 3, y - 2, 2, 2, '#ffc38a');
  block(ctx, x + 1, y - 2, 2, 2, '#ffc38a');
}

/** Draw an open, turning ribbon of sand as solid streaks aligned with the wind. */
/** Sand Swirl at any scale, for the rule sheet: the same blocky octagon footprint (a warm tint with no border)
 * and the same three turning ribbons and grit as in play. progress runs 0–1 over the sweep; tile is the tile size in px. */
export function drawSandSwirlPreview(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number, progress: number) {
  const r = VENUS.sweepRadius, opacity = (1 - progress) ** .7;
  ctx.save();
  drawSandFeather(ctx,x,y,tile,opacity);
  const radius = r * tile, reach = tile * .75 + (radius - tile * .75) * (1 - (1 - progress) ** 2), rotation = progress * Math.PI * 1.65;
  for (let arm = 0; arm < 3; arm++) drawSandRibbon(ctx, x, y, rotation + arm * Math.PI * 2 / 3, reach * (1 - arm * .035), opacity, 18);
  for (let i = 0; i < 110; i++) {
    const angle = i * 2.39996 + rotation * (1 + i % 5 * .1), d = reach * (.08 + Math.pow((i * 37 % 67) / 67,1.7)*.88), size = 2 + i % 2;
    ctx.globalAlpha = opacity * (.36 + i % 4 * .14); block(ctx, x + Math.cos(angle) * d, y + Math.sin(angle) * d, size, size, i % 4 === 0 ? '#ffe3b5' : i % 3 === 0 ? '#bd8757' : SAND);
  }
  ctx.restore();
}
function drawSandRibbon(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, reach: number, opacity: number, segments: number) {
  for (let i = 0; i < segments; i++) {
    const tail = i / segments;
    const direction = angle - tail * 1.52;
    const radius = reach * (1 - tail * .45);
    const length = 7 + reach * .10 * (1 - tail * .45);
    const width = 3 + (1 - tail) * reach * .049;
    ctx.save();
    ctx.translate(x + Math.cos(direction) * radius, y + Math.sin(direction) * radius);
    ctx.rotate(direction + 1.23);
    ctx.globalAlpha=opacity*Math.pow(1-tail,1.5)*.1;
    block(ctx,-length*.8,-width*.8,length*1.6,width*1.8,'#ecc789');
    ctx.globalAlpha = opacity * (1 - tail) * .48;
    block(ctx, -length / 2 - 4, -width / 2, length + 8, width + 4, '#ae7749');
    ctx.globalAlpha = opacity * (1 - tail) * .82;
    block(ctx, -length / 2, -width / 2, length, width, SAND);
    if (i % 2 === 0) {
      ctx.globalAlpha = opacity * (1 - tail) * .9;
      block(ctx, -length / 3, -width / 2 - 1, length * .7, 2, '#ffdfaa');
    }
    if(i===0){
      ctx.globalAlpha=opacity*.8;block(ctx,length*.2,-width/2-3,6,6,'#fff0ca');
      ctx.globalAlpha=opacity*.45;block(ctx,-length*.6,width*.7,4,3,'#e6ba79');
    }
    ctx.restore();
  }
}

let sandSweepContour:number[][]|undefined;
function sandTileContour(){
  if(sandSweepContour)return sandSweepContour;
  const r=VENUS.sweepRadius,edges:number[][][]=[];
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(!venusSweepCovers(dx,dy))continue;
    const l=dx*2-1,t=dy*2-1,rr=l+2,b=t+2;
    if(!venusSweepCovers(dx,dy-1))edges.push([[l,t],[rr,t]]);
    if(!venusSweepCovers(dx+1,dy))edges.push([[rr,t],[rr,b]]);
    if(!venusSweepCovers(dx,dy+1))edges.push([[rr,b],[l,b]]);
    if(!venusSweepCovers(dx-1,dy))edges.push([[l,b],[l,t]]);
  }
  const next=new Map(edges.map(edge=>[edge[0].join(','),edge[1]])),points:number[][]=[];
  const start=edges[0][0];let at=start;
  do{points.push(at);at=next.get(at.join(','))!;}while(at&&at.join(',')!==start.join(',')&&points.length<=edges.length);
  sandSweepContour=points.filter((p,i)=>{const a=points[(i+points.length-1)%points.length],b=points[(i+1)%points.length];return(p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0]);}).map(([x,y])=>[x/2,y/2]);
  return sandSweepContour;
}

/** The tile-shaped contour stays readable while its enlarged outer margin blends away. */
function drawSandFeather(ctx:CanvasRenderingContext2D,x:number,y:number,tile:number,opacity:number,floor?:(dx:number,dy:number)=>boolean){
  ctx.save();
  const r=VENUS.sweepRadius,depth=tile*.8,expand=-tile*.4,points=sandTileContour();
  if(floor){
    ctx.beginPath();for(let dy=-r-1;dy<=r+1;dy++)for(let dx=-r-1;dx<=r+1;dx++)if(floor(dx,dy))ctx.rect(x+(dx-.5)*tile,y+(dy-.5)*tile,tile,tile);ctx.clip();
  }
  const trace=(margin:number)=>{
    const offset=expand+margin;
    points.forEach((p,i)=>{
      const prev=points[(i+points.length-1)%points.length],next=points[(i+1)%points.length];
      const nx=Math.sign(p[1]-prev[1])+Math.sign(next[1]-p[1]),ny=-Math.sign(p[0]-prev[0])-Math.sign(next[0]-p[0]);
      const px=x+p[0]*tile+nx*offset,py=y+p[1]*tile+ny*offset;
      if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
    });ctx.closePath();
  };
  const sand=ctx.createRadialGradient(x,y,0,x,y,(r+.9)*tile);
  sand.addColorStop(0,'#a95720');sand.addColorStop(.32,'#cf8a35');sand.addColorStop(.65,'#edba68');sand.addColorStop(1,'#fff1c8');
  ctx.fillStyle=sand;ctx.globalAlpha=opacity*.28;ctx.beginPath();trace(0);ctx.fill();
  for(let band=0;band<28;band++){
    ctx.globalAlpha=opacity*.28*(1-(band+.5)/28);
    ctx.beginPath();trace(depth*(band+1)/28);trace(depth*band/28);ctx.fill('evenodd');
  }
  ctx.restore();
}

/** Trace the fixed tile footprint and tint its floor. */
function drawSandSweepRange(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, centerX: number, centerY: number, camX: number, camY: number, opacity: number) {
  const centerTileX = Math.floor(centerX / S), centerTileY = Math.floor(centerY / S);
  const radius = VENUS.sweepRadius;
  const inRange = (dx: number, dy: number) => venusSweepCovers(dx, dy); // the blocky octagon footprint
  const sandTiles: [number, number, number, number][] = [];

  ctx.save();
  drawSandFeather(ctx,(centerTileX+.5)*S-camX,(centerTileY+.5)*S-camY,S,opacity,(dx,dy)=>state.map[centerTileY+dy]?.[centerTileX+dx]===T_FLOOR);
  ctx.fillStyle = '#dcad72';
  ctx.globalAlpha = opacity * .16;
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    if (!inRange(dx, dy)) continue;
    const tx = centerTileX + dx, ty = centerTileY + dy;
    const x = tx * S - camX, y = ty * S - camY;
    if (state.map[ty]?.[tx] === T_FLOOR) sandTiles.push([tx, ty, x, y]);
  }
  // The swept floor looks sandy: shallow wind ripples and scattered grains on every tile in reach.
  const grain = (tx: number, ty: number, k: number) => { const n = Math.sin(tx * 127.1 + ty * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
  for (const [tx, ty, x, y] of sandTiles) {
    for (let r = 0; r < 2; r++) { // faint ripples: short shallow dunes across the tile
      const ry = y + 14 + r * 18 + Math.floor(grain(tx, ty, r) * 5), rx = x + 6 + Math.floor(grain(tx, ty, r + 9) * 10), len = 14 + Math.floor(grain(tx, ty, r + 19) * 12);
      ctx.globalAlpha = opacity * .18; block(ctx, rx, ry, len, 1, '#f1d29a');
      ctx.globalAlpha = opacity * .12; block(ctx, rx + 2, ry + 1, len - 2, 1, '#8a6338');
    }
    const centerWeight=Math.max(0,1-Math.hypot(tx-centerTileX,ty-centerTileY)/(radius+.5));
    for (let g = 0; g < 5+Math.floor(centerWeight*19); g++) { // denser sand near the cast centre
      ctx.globalAlpha = opacity * (.15 + grain(tx, ty, g + 40) * .2);
      block(ctx, x + grain(tx, ty, g + 30) * (S - 3), y + grain(tx, ty, g + 50) * (S - 3), g % 3 ? 2 : 3, 2, g % 4 ? '#e8c48a' : '#a9784a');
    }
  }
  ctx.restore();
}

/** A Sand Scarab, built like the Moon's mirror mite (a square body, two eyes, a hop) but as a plain beetle: a
 * sand-gold rim, a light head band with plain black eyes with two antennae, split bronze wing cases with a centre seam, spots and a shine
 * mark, and four little legs that scuttle. No glow; it swells a little as it bites and flashes white when hit. */
export function drawVenusScarab(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, id: number, attack: boolean, flash: boolean) {
  const hop = Math.round(Math.abs(Math.sin(tick * .25 + id)) * 3), h = attack ? 11 : 9, wig = Math.floor(tick / 10 + id) % 2;
  ctx.save(); ctx.shadowBlur = 0;
  ctx.globalAlpha = .25; block(ctx, Math.round(x) - h + 1, Math.round(y) + h - 1, h * 2 - 2, 3, '#000000'); ctx.globalAlpha = 1;
  ctx.translate(Math.round(x), Math.round(y) - hop);
  const c = (col: string) => flash ? '#ffffff' : col;
  block(ctx, -4, -h - 4 - wig, 2, 4, c('#5c3a18')); block(ctx, 2, -h - 4 + wig - 1, 2, 4, c('#5c3a18')); // antennae
  block(ctx, -6, -h - 6 - wig, 2, 2, c('#5c3a18')); block(ctx, 4, -h - 7 + wig, 2, 2, c('#5c3a18'));
  for (const side of [-1, 1]) for (const [ly, k] of [[-2, 0], [h - 5, 1]] as const) { // four legs, scuttling in turn
    const step = (wig + k) % 2 ? 2 : 0;
    block(ctx, side > 0 ? h : -h - 4, ly + step, 4, 2, c('#5c3a18')); block(ctx, side > 0 ? h + 3 : -h - 4, ly + step + 2, 2, 2, c('#5c3a18'));
  }
  block(ctx, -h, -h, h * 2, h * 2, c('#e3c08a'));                         // rim
  if (!flash) {
    block(ctx, -h + 2, -h + 2, h * 2 - 4, 6, '#d9b070');                  // head band
    block(ctx, -h + 2, -h + 8, h * 2 - 4, h * 2 - 10, '#a8743a');         // wing cases
    block(ctx, -1, -h + 8, 2, h * 2 - 10, '#5c3a18');                     // seam
    block(ctx, -h + 3, -h + 9, 3, 2, '#d9a85a'); block(ctx, 2, -h + 9, 3, 2, '#d9a85a'); // shine
    block(ctx, -h + 4, h - 6, 2, 2, '#7a4e24'); block(ctx, h - 6, h - 6, 2, 2, '#7a4e24'); block(ctx, -5, h - 9, 2, 2, '#7a4e24'); block(ctx, 3, h - 9, 2, 2, '#7a4e24'); // spots
    block(ctx, -7, -h + 2, 5, 6, '#120a04'); block(ctx, 2, -h + 2, 5, 6, '#120a04'); // big plain black eyes
  }
  ctx.restore();
}

/** A Dune Worm. Underground (and while it rumbles up) only a moving sand mound shows; as it bursts out it is a blocky
 * sand worm rising from a ring of churned sand: banded segments, a dark head plate, two big pale eyes and a jagged mouth
 * that opens as it bites. It sinks back into the ring before tunnelling on. It flashes white when hit. */
export function drawDuneWorm(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, id: number, burrow: 'under' | 'rising' | 'up' | 'sinking', burrowTicks: number, attack: boolean, flash: boolean) {
  x = Math.round(x); y = Math.round(y);
  ctx.save(); ctx.shadowBlur = 0;
  if (burrow === 'under' || burrow === 'rising') { // a mound; it shakes and spits grit just before it bursts
    const rising = burrow === 'rising', k = rising ? 1 - burrowTicks / VENUS.burrowRise : 0, sh = rising ? (Math.floor(tick / 2) % 2 ? 2 : -2) * k : 0, bob = Math.floor(tick / 8 + id) % 2;
    ctx.globalAlpha = .9; block(ctx, x - 12 + sh, y + 4 - bob, 24, 6, '#8a6338'); block(ctx, x - 8 + sh, y - bob, 16, 5, '#c99a5a'); block(ctx, x - 4 + sh, y - 3 - bob, 8, 3, SAND);
    if (rising) for (let g = 0; g < 6; g++) { const a = g * 1.05 + tick * .3, d = 8 + 10 * k; ctx.globalAlpha = .8; block(ctx, x + Math.cos(a) * d - 1, y - Math.abs(Math.sin(a)) * d * .8 - 1, 3, 3, g % 2 ? SAND : '#8a6338'); }
    ctx.restore(); return;
  }
  const rise = burrow === 'sinking' ? burrowTicks / VENUS.burrowSink : 1, top = Math.round(26 * rise);
  block(ctx, x - 14, y + 6, 28, 6, '#5c3a18'); // the hole
  ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 40, 40, 48); ctx.clip();
  const c = (col: string) => flash ? '#ffffff' : col, by = y + 8 - top;
  block(ctx, x - 8, by + 6, 16, top, c('#a8743a'));                         // body
  if (!flash) for (let r = by + 10; r < y + 8; r += 6) block(ctx, x - 8, r, 16, 2, '#7a4e24'); // segment bands
  block(ctx, x - 10, by - 6, 20, 14, c('#c99a5a'));                        // head
  if (!flash) {
    block(ctx, x - 10, by - 6, 20, 4, '#5c3a18');                          // head plate
    block(ctx, x - 9, by - 2, 7, 7, '#fff6e0'); block(ctx, x + 2, by - 2, 7, 7, '#fff6e0'); // big eyes
    block(ctx, x - 7, by, 3, 3, '#2a1a0c'); block(ctx, x + 4, by, 3, 3, '#2a1a0c');
    const open = attack ? 4 : 1; block(ctx, x - 5, by + 5, 10, open, '#2a1a0c'); // mouth
    if (attack) for (let k = 0; k < 3; k++) block(ctx, x - 4 + k * 3, by + 5, 2, 2, '#fff6e0');
  }
  ctx.restore();
  block(ctx, x - 16, y + 4, 6, 4, '#c99a5a'); block(ctx, x + 10, y + 4, 6, 4, '#c99a5a'); block(ctx, x - 12, y + 8, 24, 3, '#8a6338'); // sand ring in front
  ctx.restore();
}

/** His core: a small cube in his style, built around a big glowing cyan core. A dark rim, thin gold corner brackets
 * and a dark aperture holding the core. Sealed (totems left), the core glows a steady soft cyan; open, the brackets
 * part and it beats bright with a strong glow and a pale heart. It bobs a little and flashes white when hit. */
export function drawVenusCore(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, sealed: boolean, flash: boolean) {
  const bob = Math.round(Math.sin(tick * .05) * 1.2);
  x = Math.round(x); y = Math.round(y);
  ctx.save(); ctx.shadowBlur = 0;
  ctx.globalAlpha = .25; block(ctx, x - 13, y + 14, 26, 4, '#000000'); ctx.globalAlpha = 1;
  ctx.translate(x, y - 2 + bob);
  const c = (col: string) => flash ? '#ffffff' : col, open = sealed ? 0 : 2 + Math.round(Math.abs(Math.sin(tick * .1)));
  block(ctx, -15, -15, 30, 30, c('#263a3b'));                                     // rim
  block(ctx, -12, -12, 24, 24, c('#152f37'));                                     // aperture
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {                           // thin gold corner brackets, parting when open
    ctx.save(); ctx.scale(sx, sy); ctx.translate(open, open);
    block(ctx, 6, 13, 10, 3, c('#c5a35d')); block(ctx, 13, 6, 3, 10, c('#c5a35d')); block(ctx, 6, 13, 10, 1, c('#ead39a'));
    ctx.restore();
  }
  if (!flash) {
    const beat = sealed ? 0 : Math.max(0, Math.sin(tick * .2)) ** 3, r = sealed ? 7 : 8 + Math.round(beat * 2);
    ctx.shadowColor = CYAN; ctx.shadowBlur = sealed ? 8 : 14 + beat * 10;
    block(ctx, -r, -r, r * 2, r * 2, sealed ? '#4fb8bd' : CYAN);
    ctx.shadowBlur = sealed ? 4 : 10; block(ctx, -r + 2, -r + 2, r * 2 - 4, r * 2 - 4, sealed ? '#78dedf' : '#b8f6f6'); ctx.shadowBlur = 0;
    block(ctx, -3, -3, 6, 6, sealed ? '#b8f6f6' : '#ffffff');                    // pale heart
    block(ctx, -r + 2, -r + 2, 3, 2, '#ffffff');                                  // glint
    if (!sealed) { ctx.globalAlpha = .3 + beat * .5; ctx.strokeStyle = CYAN; ctx.lineWidth = 2; const q = 17 + Math.round(beat * 3); ctx.strokeRect(-q, -q, q * 2, q * 2); ctx.globalAlpha = 1; }
  }
  ctx.restore();
}

/** A Sand Scorpion, built like the scarab: a square body with a light rim, a darker inner panel, plain black eyes and
 * thin scuttling legs, in rust and amber. Two square pincers snap at the front, and a chain of small blocks curls up
 * from its back to an amber stinger that jabs forward as it stings. Buried, only a faint low mound shows; it rises out
 * of the sand and sinks back in, cut off at the ground line. It flashes white when hit. */
export function drawSandScorpion(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, id: number, burrow: 'under' | 'rising' | 'up' | 'sinking', burrowTicks: number, sting: boolean, flash: boolean) {
  x = Math.round(x); y = Math.round(y);
  ctx.save(); ctx.shadowBlur = 0;
  if (burrow === 'under') { ctx.globalAlpha = .22; block(ctx, x - 10, y + 4, 20, 4, '#8a6338'); block(ctx, x - 5, y + 2, 10, 2, '#c99a5a'); ctx.restore(); return; }
  const up = burrow === 'rising' ? 1 - burrowTicks / VENUS.scorpRise : burrow === 'sinking' ? burrowTicks / VENUS.burrowSink : 1, sink = Math.round((1 - up) * 30);
  ctx.globalAlpha = .45; block(ctx, x - 14, y + 9, 28, 4, '#5c3a18'); ctx.globalAlpha = 1; // the hole
  ctx.beginPath(); ctx.rect(x - 34, y - 44, 68, 55); ctx.clip(); ctx.translate(x, y + sink);
  const c = (col: string) => flash ? '#ffffff' : col, h = 10, wig = Math.floor(tick / 10 + id) % 2, snap = Math.floor(tick / 14 + id) % 2, jab = sting ? 5 : 0;
  for (const side of [-1, 1]) for (const [ly, k] of [[-1, 0], [h - 5, 1]] as const) { // four legs
    const step = (wig + k) % 2 ? 2 : 0;
    block(ctx, side > 0 ? h : -h - 4, ly + step, 4, 2, c('#6e2f14')); block(ctx, side > 0 ? h + 3 : -h - 4, ly + step + 2, 2, 2, c('#6e2f14'));
  }
  for (const side of [-1, 1]) { // pincers: an arm and a square claw that snaps
    block(ctx, side > 0 ? h - 2 : -h - 2, -h - 2, 4, 4, c('#c0703a'));
    block(ctx, side > 0 ? h + 1 : -h - 9, -h - 9 - snap, 8, 7, c('#f0b080')); if (!flash) block(ctx, side > 0 ? h + 3 : -h - 7, -h - 7 - snap, 4, 3, '#a0522d');
  }
  const tail: [number, number][] = [[3, -h - 4], [6, -h - 9], [8, -h - 14], [6 - jab, -h - 18]]; // a chain of blocks curling over the back
  for (const [tx, ty] of tail) block(ctx, tx, ty, 5, 5, c('#c0703a'));
  block(ctx, 3 - jab, -h - 19, 4, 4, c(GOLD)); if (!flash) block(ctx, 3 - jab, -h - 19, 2, 2, '#fff6d6'); // amber stinger
  block(ctx, -h, -h, h * 2, h * 2, c('#f0b080'));                          // rim
  if (!flash) {
    block(ctx, -h + 2, -h + 2, h * 2 - 4, h * 2 - 4, '#a0522d');           // inner panel
    block(ctx, -h + 2, h - 6, h * 2 - 4, 2, '#7a3a1c'); block(ctx, -h + 2, h - 10, h * 2 - 4, 2, '#7a3a1c'); // segment lines
    block(ctx, -h + 3, -h + 3, 4, 2, '#d98a5a');                            // shine
    block(ctx, -7, -h + 3, 5, 5, '#120a04'); block(ctx, 2, -h + 3, 5, 5, '#120a04'); // plain black eyes
  }
  ctx.restore();
}

const RELIC_COLOR: Record<RelicKind, string> = { urn: '#ff9f8a', sun: GOLD, eye: CYAN };
/** A sand relic, built like the scarab and the other square bodies: a square with a light rim, a darker inner panel and a
 * glowing icon with a pale core. A Healing Urn (rose: a jar-lipped square with a pale cross), a Sun Disk (gold: a square
 * with four stepped ray nubs around a gold core) or a Seer's Eye (cyan: a stone square with a slot holding a cyan eye).
 * It bobs a little; the icon pulses softly. */
export function drawVenusRelic(ctx: CanvasRenderingContext2D, kind: RelicKind, x: number, y: number, tick: number) {
  x = Math.round(x); y = Math.round(y);
  const pulse = .5 + .5 * Math.sin(tick * .12), col = RELIC_COLOR[kind], bob = Math.round(Math.sin(tick * .06) * 1.5), h = 10;
  ctx.save(); ctx.shadowBlur = 0;
  ctx.globalAlpha = .25; block(ctx, x - h + 1, y + h + 1, h * 2 - 2, 3, '#000000'); ctx.globalAlpha = 1;
  ctx.translate(x, y + bob);
  const icon = (fn: () => void) => { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 4 + 5 * pulse; fn(); ctx.restore(); };
  if (kind === 'urn') {
    block(ctx, -6, -h - 4, 12, 4, '#f0b090'); block(ctx, -4, -h - 2, 8, 2, '#c07050');  // jar lip
    block(ctx, -h, -h, h * 2, h * 2, '#f0b090');                                          // rim
    block(ctx, -h + 2, -h + 2, h * 2 - 4, h * 2 - 4, '#a8583a');                          // terracotta panel
    block(ctx, -h + 2, 1, h * 2 - 4, 3, '#ff9f8a');                                       // rose band
    icon(() => { block(ctx, -2, -6, 4, 12, '#fff1e8'); block(ctx, -5, -2, 10, 4, '#fff1e8'); }); // pale cross
  } else if (kind === 'sun') {
    for (const [rx, ry, w, hh] of [[-3, -h - 4, 6, 4], [-3, h, 6, 4], [-h - 4, -3, 4, 6], [h, -3, 4, 6]] as const) block(ctx, rx, ry, w, hh, '#ffe3a0'); // ray nubs
    block(ctx, -h, -h, h * 2, h * 2, '#ffe3a0');                                          // rim
    block(ctx, -h + 2, -h + 2, h * 2 - 4, h * 2 - 4, '#9a6a2c');                          // bronze panel
    icon(() => { block(ctx, -5, -5, 10, 10, GOLD); block(ctx, -2, -3, 3, 3, '#fff6d6'); }); // gold core
  } else {
    block(ctx, -h, -h, h * 2, h * 2, '#d8cba8');                                          // rim
    block(ctx, -h + 2, -h + 2, h * 2 - 4, h * 2 - 4, '#8f7f5c');                          // stone panel
    block(ctx, -7, -3, 14, 6, '#2a2418');                                                 // carved slot
    icon(() => { block(ctx, -3, -3, 6, 6, col); block(ctx, -1, -2, 2, 2, '#ffffff'); });  // cyan eye
  }
  ctx.restore();
}

/** Below the units: the swirling sand cast, leap target and lance aim line. */
export function drawVenusGround(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const t = state.venus; if (!t) return;
  ctx.save(); ctx.shadowBlur = 0;
  // The core window's search area, matching the minimap: a faint cyan wash with a pulsing dashed border that closes in.
  const area = venusCoreHintRect(state);
  if (area) {
    const [r1, c1, r2, c2] = area, x = Math.round(c1 * S - camX), y = Math.round(r1 * S - camY), w = Math.round((c2 - c1 + 1) * S), h = Math.round((r2 - r1 + 1) * S);
    const pulse = .5 + .5 * Math.sin(tick * .15);
    ctx.globalAlpha = .06 + .06 * pulse; block(ctx, x, y, w, h, CYAN);
    ctx.globalAlpha = .45 + .4 * pulse; ctx.strokeStyle = CYAN; ctx.lineWidth = 4; ctx.setLineDash([12, 8]); ctx.lineDashOffset = -tick; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4); ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
  for (const m of t.trails) { // a Dune Worm's trail: churned sand that fades
    const fade = Math.min(1, m.ticks / 60), x = Math.round(m.x - camX), y = Math.round(m.y - camY), seed = Math.round(m.x * 7 + m.y * 13);
    ctx.globalAlpha = fade * .16; block(ctx, x - 15, y - 6, 30, 12, '#8a6338'); block(ctx, x - 11, y - 9, 22, 18, '#8a6338'); // a wide, soft patch of churned sand
    ctx.globalAlpha = fade * .22; block(ctx, x - 9, y - 3, 18, 4, '#c99a5a');                                                     // a low ridge
    ctx.globalAlpha = fade * .3; for (let k = 0; k < 3; k++) block(ctx, x - 12 + ((seed + k * 37) % 24), y - 7 + ((seed >> 2) + k * 23) % 14, 2, 2, SAND); // loose grains
  }
  ctx.globalAlpha = 1;
  // Sand bursts stay on the floor underneath the small shield-wave release.
  for(const burst of t.blasts){
    if(burst.kind!=='totemBreak')continue;
    const p=1-burst.ticks/36,fade=Math.pow(1-p,1.2),x=burst.x-camX,y=burst.y-camY;
    for(let i=0;i<10;i++){
      const angle=i*2.39996,d=Math.pow(p,.7)*(24+i%4*17),size=18+i%3*10;
      ctx.globalAlpha=fade*.28;block(ctx,x+Math.cos(angle)*d-size/2,y+Math.sin(angle)*d*.3-3,size,size*.4,SAND);
    }
    for(let i=0;i<48;i++){
      const angle=i*2.39996,d=Math.pow(p,.7)*(34+i%7*13),lift=Math.sin(p*Math.PI)*(10+i%4*8),size=3+i%4;
      ctx.save();ctx.translate(x+Math.cos(angle)*d,y+Math.sin(angle)*d*.35-lift+p*p*12);ctx.rotate(angle+p*.5);
      ctx.globalAlpha=fade*.85;block(ctx,-size/2,-size/2,size,size,i%3?SAND:GOLD);
      ctx.globalAlpha=fade*.2;block(ctx,-size/2-2,-size/2+2,size,size,SAND);ctx.restore();
    }
  }
  ctx.globalAlpha=1;
  const core = t.core;
  // Clue arrows: where a totem broke, a blocky, see-through cyan arrow with an outer glow points toward the core (snapped to one
  // of eight directions so its blocks stay crisp), nudging along it, then fading out after 2 seconds.
  if (core?.clues) for (const clue of core.clues) {
    const x = (clue.tileX + .5) * S, y = (clue.tileY + .5) * S, fade = Math.min(1, clue.ticks / 30) * Math.min(1, (VENUS.clueTicks - clue.ticks + 1) / 8);
    const angle = Math.round(Math.atan2(core.enemy.y - y, core.enemy.x - x) / (Math.PI / 4)) * (Math.PI / 4), nudge = Math.round(Math.abs(Math.sin(tick * .12)) * 4);
    ctx.save(); ctx.translate(Math.round(x - camX), Math.round(y - camY)); ctx.rotate(angle); ctx.scale(1.6, 1.6); ctx.translate(nudge, 0); // drawn 1.6x so it reads from a distance
    ctx.shadowColor = CYAN; ctx.shadowBlur = 10; ctx.globalAlpha = .55 * fade;
    block(ctx, -20, -5, 18, 10, CYAN);                                                 // thick shaft
    for (let k = 0; k < 5; k++) block(ctx, -2 + k * 3, -12 + k * 3, 3, 24 - k * 6, CYAN); // stepped triangular head
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  for (const sweep of t.sweeps) {
    const progress = 1 - sweep.ticks / 30;
    const radius = VENUS.sweepRadius * S;
    const reach = 36 + (radius - 36) * (1 - (1 - progress) ** 2);
    const x = sweep.x - camX, y = sweep.y - camY;
    const rotation = progress * Math.PI * 1.65;
    const opacity = (1 - progress) ** .7;
    drawSandSweepRange(ctx, state, sweep.x, sweep.y, camX, camY, opacity);
    for (let arm = 0; arm < 3; arm++) {
      drawSandRibbon(ctx, x, y, rotation + arm * Math.PI * 2 / 3, reach * (1 - arm * .035), opacity, 18);
    }
    for (let i = 0; i < 110; i++) {
      const angle = i * 2.39996 + rotation * (1 + i % 5 * .1);
      const radius = reach * (.08 + Math.pow((i * 37 % 67) / 67,1.7)*.88);
      const size = 2 + i % 3;
      ctx.globalAlpha = opacity * (.36 + i % 4 * .14);
      block(ctx, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, size, i % 4 ? size : 2,
        i % 4 === 0 ? '#ffe3b5' : i % 3 === 0 ? '#bd8757' : SAND);
    }
  }
  // The leap: a target that tracks you, then locks red; his shadow grows as he falls.
  if (t.leap) {
    const l = t.leap, x = (l.tx + .5) * S - camX, y = (l.ty + .5) * S - camY, locked = l.stage === 'lock';
    const fall = locked ? 1 - l.ticks / VENUS.leapLock : 0, r = VENUS.leapRadius * S;
    const sw = Math.round(r * (.4 + .6 * fall) / 4) * 4, sh = Math.round(r * (.2 + .3 * fall) / 4) * 4; // a blocky shadow that grows as he falls
    ctx.globalAlpha = .25 + .45 * fall; block(ctx, x - sw, y + 6 - sh / 2, sw * 2, sh, '#000000'); block(ctx, x - sw + 4, y + 6 - sh / 2 - 4, sw * 2 - 8, sh + 8, '#000000');
    const blink = locked ? .6 + .4 * Math.abs(Math.sin(tick * .5)) : .5 + .3 * Math.abs(Math.sin(tick * .2));
    for(let band=0;band<12;band++){
      const inset=band*2;ctx.globalAlpha=blink*.13*(1-band/12);ctx.strokeStyle=locked?RED:GOLD;ctx.lineWidth=2;
      ctx.strokeRect(x-r+inset,y-r+inset,(r-inset)*2,(r-inset)*2);
    }
    ctx.globalAlpha = blink; ctx.strokeStyle = locked ? RED : GOLD; ctx.lineWidth = 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    // Locked: an inner square grows steadily from the centre and fills the target exactly as he lands, so the drop is
    // easy to time. It turns white once a Sand Swirl would parry the landing.
    if (locked) {
      const q = Math.round(r * fall / 2) * 2, parry = l.ticks <= VENUS.parryWindow;
      ctx.globalAlpha = .1 + .12 * fall; block(ctx, x - q, y - q, q * 2, q * 2, RED);
      for(let band=0;band<10;band++){const inset=band*2;if(q<=inset)break;
        ctx.globalAlpha=blink*.25*(1-band/10);ctx.strokeStyle=parry?'#fff1da':RED;ctx.lineWidth=2;
        ctx.strokeRect(x-q+inset,y-q+inset,(q-inset)*2,(q-inset)*2);
      }
      ctx.globalAlpha = .95; ctx.strokeStyle = parry ? '#ffffff' : RED; ctx.lineWidth = 3; if (q > 2) ctx.strokeRect(x - q, y - q, q * 2, q * 2);
    }
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { block(ctx, x + sx * (r + 6) - (sx < 0 ? 0 : 10), y + sy * (r + 6) - (sy < 0 ? 0 : 3), 10, 3, locked ? RED : GOLD); block(ctx, x + sx * (r + 6) - (sx < 0 ? 0 : 3), y + sy * (r + 6) - (sy < 0 ? 0 : 10), 3, 10, locked ? RED : GOLD); }
  }
  // The lance's aim: a dashed band along its line, white in its last moments.
  const boss = state.enemies.find(e => e.id === t.bossId);
  if (t.lance && boss) {
    const l = t.lance, len = VENUS.lanceRange * S, w = VENUS.lanceHalfWidth * S, x = boss.x - camX, y = boss.y - camY, late = l.ticks <= VENUS.lanceLock;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(l.dy, l.dx));
    const band=ctx.createLinearGradient(0,-w,0,w);
    band.addColorStop(0,late?'#ffe9cd':'#ffd27a');band.addColorStop(.35,'#9d5629');band.addColorStop(.65,'#9d5629');band.addColorStop(1,late?'#ffe9cd':'#ffd27a');
    ctx.globalAlpha=late?.3:.18;ctx.fillStyle=band;ctx.fillRect(0,-w,len,w*2);
    for(const side of [-1,1])for(let sheet=0;sheet<10;sheet++){
      ctx.globalAlpha=(late?.5:.3)*(1-sheet/10);block(ctx,0,side*w-side*sheet*2-1,len,2,late?'#fff1da':GOLD);
    }
    ctx.globalAlpha=.95;block(ctx,len-3,-w,3,w*2,late?'#ffffff':GOLD);
    for(const side of [-1,1]){block(ctx,0,side*w-2,22,4,GOLD);block(ctx,len-22,side*w-2,22,4,GOLD);}
    // Timing: a solid charge fills the band from him outward and reaches its far end exactly as the lance fires, with a
    // bright front edge, so the counter is easy to time.
    const fill = Math.round(len * (1 - l.ticks / VENUS.lanceWindup) / 2) * 2;
    ctx.globalAlpha = .35; block(ctx, 0, -w + 3, fill, w * 2 - 6, late ? '#ffffff' : '#ffb347');
    ctx.globalAlpha = .95; block(ctx, fill - 4, -w, 4, w * 2, '#ffffff');
    ctx.restore();
  }
  ctx.restore();
}

/** Above the units: totem numbers, lance beams, blasts, landings and parries. */
export function drawVenusEffects(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const t = state.venus; if (!t) return;
  ctx.save(); ctx.shadowBlur = 0; ctx.textAlign = 'center'; ctx.font = 'bold 18px monospace';
  // Sand churns at the base of a totem rising out or sinking in: a low mound and grains spraying sideways.
  for (const p of t.totems) {
    if (p.buried) continue;
    const rising = (p.rise ?? 0) > 0, sinking = p.overload <= 0 && p.visible < VENUS.sandTicks;
    if (!rising && !sinking) continue;
    const k = rising ? (p.rise ?? 0) / VENUS.sandTicks : 1 - p.visible / VENUS.sandTicks, x = p.enemy.x - camX, y = p.enemy.y - camY + 16;
    ctx.globalAlpha = .55 * Math.sin(k * Math.PI) + .2; block(ctx, x - 18, y - 3, 36, 5, '#b98a52'); block(ctx, x - 12, y - 6, 24, 4, SAND);
    for (let g = 0; g < 10; g++) {
      const side = g % 2 ? 1 : -1, f = ((tick * .9 + g * 7) % 18) / 18, gx = x + side * (6 + f * 22 + (g % 3) * 3), gy = y - 4 - Math.sin(f * Math.PI) * (8 + g % 4 * 3);
      ctx.globalAlpha = (1 - f) * .85; block(ctx, gx, gy, g % 3 ? 2 : 3, 2, g % 4 ? SAND : '#fff1d0');
    }
  }
  // God reveal: buried Sand Scorpions as a faint ghost inside a dashed bronze outline.
  if (venusRevealingOrder(state)) for (const e of state.enemies) {
    if (e.type !== 'sand_scorpion' || !(e.burrow === 'under' || e.burrow === 'rising' || !e.burrow)) continue;
    const x = e.x - camX, y = e.y - camY;
    ctx.save(); ctx.globalAlpha = .45; drawSandScorpion(ctx, x, y, tick, e.id, 'up', 60, false, false); ctx.restore();
    ctx.save(); ctx.globalAlpha = .8; ctx.strokeStyle = '#c99a4a'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.strokeRect(x - 20, y - 28, 40, 44); ctx.restore();
  }
  // God reveal shows each totem's model and order. Seer's Eye shows the buried positions and every number.
  const godReveal = venusRevealingOrder(state);
  for (const p of venusRevealing(state) ? t.totems : []) {
    if (p.buried) {
      const x = p.enemy.x - camX, y = p.enemy.y - camY;
      ctx.save();
      if (godReveal) {
        ctx.translate(x, y); ctx.scale(.7, .7); drawEncounterEnemy(ctx, p.enemy, 0, 0, tick, false);
      } else {
        ctx.globalAlpha = .7; ctx.strokeStyle = SAND; ctx.lineWidth = 4; ctx.lineJoin = 'miter'; ctx.setLineDash([8, 5]); // a thick dashed outline where it lies buried
        ctx.strokeRect(x - 14, y - 18, 28, 36);
      }
      ctx.restore();
    }
    if (!venusShowingNumbers(state)) continue;
    const x = p.enemy.x - camX, y = p.enemy.y - camY - 34, next = p.order === t.next, fading = !p.buried && p.visible < 40 ? .4 + .6 * Math.abs(Math.sin(tick * .3)) : 1;
    // The same blocky pixel numbers as the minimap: a dark outline, flat gold (next) or cyan fill, no glow.
    ctx.font = '16px "Press Start 2P", monospace'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = fading; ctx.lineWidth = 4; ctx.lineJoin = 'miter'; ctx.strokeStyle = '#0d0a06'; ctx.strokeText(String(p.order + 1), x, y);
    ctx.fillStyle = next ? GOLD : CYAN; ctx.fillText(String(p.order + 1), x, y);
    ctx.font = 'bold 18px monospace'; ctx.textBaseline = 'alphabetic';
  }
  // A nest bursting open: a sand fountain and a ring of grit.
  for (const b of t.nestBursts) {
    const p = 1 - b.ticks / 36, x = b.x - camX, y = b.y - camY, r = 10 + 40 * p;
    ctx.globalAlpha = (1 - p) * .9; ctx.strokeStyle = '#c99a5a'; ctx.lineWidth = 5 * (1 - p) + 1; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    for (let k = 0; k < 14; k++) { const a = k * Math.PI / 7 + .3, d = 6 + 36 * p * (.6 + (k % 3) * .2); ctx.globalAlpha = (1 - p); block(ctx, x + Math.cos(a) * d - 2, y + Math.sin(a) * d - 2 - Math.sin(p * Math.PI) * 14, k % 3 ? 3 : 5, 3, k % 2 ? SAND : '#8a6338'); }
  }
  if (godReveal) for (const n of t.nests) {
    ctx.save(); ctx.globalAlpha = .85;
    drawVenusNest(ctx, (n.tx + .5) * S - camX, (n.ty + .5) * S - camY);
    ctx.restore();
  }
  if (godReveal) for (const r of t.relics) {
    if (!r.buried) continue;
    const x = r.enemy.x - camX, y = r.enemy.y - camY;
    ctx.save(); ctx.globalAlpha = .75; drawVenusRelic(ctx, r.kind, x, y, tick); ctx.restore();
  }
  if (t.core?.buried && godReveal) { // only the god panel shows the buried core; a Seer's Eye never does
    const x = t.core.enemy.x - camX, y = t.core.enemy.y - camY;
    ctx.save(); ctx.globalAlpha = godReveal ? .75 : .45; drawVenusCore(ctx, x, y, tick, venusCoreSealed(state), false); ctx.restore();
    if (!godReveal) {
      ctx.save(); ctx.globalAlpha = .8; ctx.strokeStyle = CYAN; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.strokeRect(x - 16, y - 26, 32, 42); ctx.restore();
    }
  }
  // Like the other lasers: a soft outer band, bright shaft and a narrow white core.
  for (const b of t.beams) {
    const fade = b.ticks / 20, len = VENUS.lanceRange * S, w = VENUS.lanceHalfWidth * S;
    const outer = b.parried ? '#359eac' : '#dc8a35';
    const shaft = b.parried ? CYAN : GOLD;
    const rim = b.parried ? '#bdfaff' : '#ffe6af';
    ctx.save(); ctx.translate(b.x - camX, b.y - camY); ctx.rotate(Math.atan2(b.dy, b.dx));
    ctx.globalAlpha = fade * .4; ctx.shadowColor = outer; ctx.shadowBlur = 6;
    block(ctx, 0, -w, len, w * 2, outer);
    ctx.shadowBlur = 0; ctx.globalAlpha = fade * .9;
    block(ctx, 0, -w * .45, len - 5, w * .9, shaft);
    ctx.globalAlpha = fade;
    block(ctx, 0, -3, len - 10, 6, '#ffffff');
    ctx.globalAlpha = fade * .85;
    ctx.strokeStyle = rim; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(len - 12, -w + 1);
    ctx.lineTo(len - 1, -w + 1);
    ctx.lineTo(len - 1, w - 1);
    ctx.lineTo(len - 12, w - 1);
    ctx.stroke();
    ctx.restore();
  }
  // Totem blasts: a flash and a blocky cyan ring (the chamber-wide overload uses the shared totem effect too).
  for (const b of t.blasts) {
    if(b.kind==='overload')continue; // the chamber-clipped shared effect draws the complete overload
    if(b.kind==='totemBreak'){
      const p=1-b.ticks/36,fade=.5+.5*Math.cos(p*Math.PI),x=b.x-camX,y=b.y-camY;
      for(let echo=0;echo<2;echo++){
        const q=(p-echo*.12)/(1-echo*.12);if(q<0)continue;
        const radius=14+(1-(1-q)*(1-q))*S*2.65,strength=fade*(echo?.5:1),tail=Math.min(radius*.35,34);
        for(let sheet=11;sheet>=0;sheet--){
          const u=sheet/11;traceVenusShieldFront(ctx,x,y,radius-tail*u);
          ctx.globalAlpha=strength*.3*Math.pow(1-u,1.2);ctx.strokeStyle=CYAN;ctx.lineWidth=tail/11*1.2+.3;ctx.stroke();
        }
        traceVenusShieldFront(ctx,x,y,radius);ctx.globalAlpha=strength*.8;ctx.strokeStyle=echo?GOLD:CYAN;ctx.lineWidth=6;ctx.stroke();
        ctx.globalAlpha=strength;ctx.strokeStyle='#eafff7';ctx.lineWidth=2;ctx.stroke();
      }
      continue;
    }
    const p = 1 - b.ticks / 30, r = 2 * S * Math.min(1, p * 1.6), x = b.x - camX, y = b.y - camY;
    if (p < .25) { ctx.globalAlpha = (.25 - p) * 3; block(ctx, x - 22, y - 22, 44, 44, '#e9ffff'); }
    ctx.globalAlpha = (1 - p) * .9; ctx.strokeStyle = CYAN; ctx.lineWidth = 5 * (1 - p) + 1; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
  }
  // Landings: a shockwave and dust.
  for (const m of t.impacts) {
    const p = 1 - m.ticks / 30, r = VENUS.leapRadius * S * (.4 + .9 * p), x = m.x - camX, y = m.y - camY;
    ctx.globalAlpha = (1 - p) * .9; ctx.strokeStyle = GOLD; ctx.lineWidth = 6 * (1 - p) + 1; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, d = r * .9; ctx.globalAlpha = (1 - p) * .7; block(ctx, x + Math.cos(a) * d - 3, y + Math.sin(a) * d - 3 - p * 10, 6, 6, SAND); }
  }
  // Close streaks follow the player for the rest of the guard.
  if (state.gameTick <= t.guardUntil) {
    const left = (t.guardUntil - state.gameTick) / VENUS.guardTicks;
    const x = state.playerX - camX, y = state.playerY - camY;
    const age=1-left,veil=Math.min(1,age*8+.25)*Math.min(1,left*5);
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;
    const mist=ctx.createLinearGradient(-34,0,34,0);
    mist.addColorStop(0,'rgba(227,192,138,0)');mist.addColorStop(.35,'rgba(227,192,138,.1)');mist.addColorStop(.65,'rgba(255,224,174,.14)');mist.addColorStop(1,'rgba(227,192,138,0)');
    ctx.globalAlpha=veil*.6;ctx.fillStyle=mist;ctx.fillRect(-34,-25,68,50);
    // Short translucent sheets pass over the ship while gold grains orbit its guard.
    for(let i=0;i<6;i++){
      const a=age*2+i*Math.PI/3,px=Math.cos(a)*28,py=Math.sin(a)*21;
      ctx.save();ctx.translate(px,py);ctx.rotate(a+.7);
      ctx.globalAlpha=veil*.07;block(ctx,-13,-5,26,10,'#e3c08a');
      ctx.globalAlpha=veil*.19;block(ctx,-10,-1,20,2,'#ffe3b5');ctx.restore();
    }
    for(let i=0;i<22;i++){
      const a=i*2.39996+age*(1+i%3*.2),r=19+i%5*5;
      ctx.globalAlpha=veil*(i%4?.24:.39);block(ctx,Math.cos(a)*r,Math.sin(a)*r*.8-(age*6.5+i*3)%9,2+i%2,2,i%4?SAND:'#fff0c9');
    }
    ctx.restore();
    for (let arm = 0; arm < 3; arm++) {
      drawSandRibbon(ctx, x, y, tick * .115 + arm * Math.PI * 2 / 3, 44, (.25 + .6 * left) * Math.min(1, left * 6)*.6, 8);
    }
  }
  for (const f of t.reflects) {
    const p = 1 - f.ticks / 18; ctx.globalAlpha = 1 - p; ctx.strokeStyle = GOLD; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(f.fromX - camX, f.fromY - camY); ctx.lineTo(f.toX - camX, f.toY - camY); ctx.stroke();
    block(ctx, f.toX - camX - 5, f.toY - camY - 5, 10, 10, '#fff1d0');
  }
  // Counter: four open mirror-chevron fronts, pale cores and flat translucent wakes.
  for(const q of t.parries){
    const p=1-q.ticks/36,x=q.x-camX,y=q.y-camY,fade=.5+.5*Math.cos(p*Math.PI);
    ctx.shadowBlur=0;ctx.lineJoin='miter';
    for(let echo=0;echo<3;echo++){
      const travel=(p-echo*.11)/(1-echo*.11);if(travel<0)continue;
      const ease=1-(1-travel)*(1-travel),r=14+(VENUS.counterBlastRadius*S-14)*ease;
      const strength=fade*(1-echo*.25),tail=Math.min(r*.4,42),color=echo===2?GOLD:CYAN;
      for(let sheet=17;sheet>=0;sheet--){
        const u=sheet/17;traceVenusCounterFront(ctx,x,y,r-tail*u);
        ctx.globalAlpha=strength*.34*Math.pow(1-u,1.2);ctx.strokeStyle=color;ctx.lineWidth=tail/17+1;ctx.stroke();
      }
      traceVenusCounterFront(ctx,x,y,r);ctx.globalAlpha=strength*.8;ctx.strokeStyle=color;ctx.lineWidth=12;ctx.stroke();
      ctx.globalAlpha=strength;ctx.strokeStyle=echo===2?'#fff0c4':'#eafff7';ctx.lineWidth=3;ctx.stroke();
    }
    // Quiet overlapping glass and sand fragments retain the map's warm/cool contrast.
    for(let i=0;i<38;i++){
      const a=i*2.39996,d=18+(1-(1-p)*(1-p))*(44+i%6*16),size=3+i%3*2;
      ctx.save();ctx.translate(x+Math.cos(a)*d,y+Math.sin(a)*d);ctx.rotate(a+p*.7);
      const color=i%3?SAND:CYAN;
      ctx.globalAlpha=fade*.2;block(ctx,-size/2-3,-size/2+2,size,size,color);
      ctx.globalAlpha=fade*.55;block(ctx,-size/2,-size/2,size,size,color);
      if(i%7===0){ctx.globalAlpha=fade*.8;block(ctx,-5,-1,10,2,'#fff3d5');block(ctx,-1,-5,2,10,'#fff3d5');}
      ctx.restore();
    }
    const flash=Math.max(0,1-p/.28),r=12+p*35;
    for(const [dx,dy]of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      ctx.globalAlpha=flash*.8;block(ctx,x+dx*r-(dx>0?9:0),y+dy*r,9,3,'#eafff7');
      block(ctx,x+dx*r,y+dy*r-(dy>0?9:0),3,9,'#eafff7');
    }
  }
  // Relic finds: a bright ring in the relic's colour, with sparks rising.
  for (const f of t.finds) {
    const p = 1 - f.ticks / 50, x = f.x - camX, y = f.y - camY, col = RELIC_COLOR[f.kind], r = 12 + 40 * p;
    ctx.globalAlpha = 1 - p; ctx.strokeStyle = col; ctx.lineWidth = 4 * (1 - p) + 1; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    for (let k = 0; k < 6; k++) block(ctx, x - 14 + k * 6, y - 10 - p * (20 + k % 3 * 8), 3, 3, k % 2 ? col : '#fff6d0');
  }
  ctx.restore();
}

/** Four separated mirror chevrons give counters a silhouette distinct from the shield break. */
function traceVenusCounterFront(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){
  ctx.beginPath();
  for(let side=0;side<4;side++){
    const a=side*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);
    for(const [i,[lx,ly]]of [[-.52,-.56],[-.52,-.76],[0,-1],[.52,-.76],[.52,-.56]].entries()){
      const px=x+(lx*c-ly*sn)*r,py=y+(lx*sn+ly*c)*r;
      if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);
    }
  }
}

/** Open, stepped shield fronts keep Venus's armour identity without filling the centre. */
function traceVenusShieldFront(ctx:CanvasRenderingContext2D,x:number,y:number,r:number){
  ctx.beginPath();ctx.moveTo(x-r*.52,y-r*.84);ctx.lineTo(x+r*.52,y-r*.84);
  for(const side of [-1,1]){
    ctx.moveTo(x+side*r*.6,y-r*.84);ctx.lineTo(x+side*r*.74,y-r*.84);
    ctx.lineTo(x+side*r*.74,y-r*.68);ctx.lineTo(x+side*r*.9,y-r*.68);ctx.lineTo(x+side*r*.9,y-r*.2);
    ctx.moveTo(x+side*r*.9,y-r*.12);ctx.lineTo(x+side*r*.9,y+r*.2);
    ctx.lineTo(x+side*r*.7,y+r*.2);ctx.lineTo(x+side*r*.7,y+r*.42);
    ctx.moveTo(x+side*r*.62,y+r*.48);ctx.lineTo(x+side*r*.38,y+r*.48);
    ctx.lineTo(x+side*r*.38,y+r*.7);ctx.lineTo(x+side*r*.06,y+r*.7);
  }
}

/** Venus shield break: cyan glass pressure fronts, pale cores and fine gilded fragments. */
export function drawVenusShatter(ctx: CanvasRenderingContext2D, s: Readonly<GameState>, w: number, h: number, camX: number, camY: number, zoom = 1, tick = 0) {
  const q=s.venus?.shatter;if(!q)return;
  const p=Math.max(0,Math.min(1,1-q.ticks/VENUS.shatterTicks)),age=p*VENUS.shatterTicks;
  const fade=.5+.5*Math.cos(p*Math.PI),ease=1-(1-p)*(1-p),reach=Math.hypot(w,h)*1.1;
  const px=(q.x-camX)*zoom,py=(q.y-camY)*zoom,dx=px-w/2,dy=py-h/2;
  const offscreen=px<0||px>w||py<0||py>h;
  const edgeScale=offscreen?Math.min(w/2/Math.abs(dx),h/2/Math.abs(dy)):1;
  const x=offscreen?w/2+dx*edgeScale:px,y=offscreen?h/2+dy*edgeScale:py;
  ctx.save();ctx.shadowBlur=0;ctx.lineJoin='miter';ctx.lineCap='butt';
  ctx.globalAlpha=Math.pow(Math.max(0,1-age/11),2)*.34;block(ctx,0,0,w,h,'#effffe');
  // Three open shield fronts, each with a short spatial sheet fading behind its bright edge.
  for(let layer=0;layer<3;layer++){
    const travel=(age-layer*7)/82;if(travel<0||travel>=1)continue;
    const r=22+reach*(1-(1-travel)*(1-travel)),strength=fade*(1-layer*.28),tail=Math.min(r*.3,58+layer*5);
    for(let wake=23;wake>=0;wake--){
      const u=wake/23;traceVenusShieldFront(ctx,x,y,r-tail*u);
      ctx.globalAlpha=strength*.2*Math.pow(1-u,1.3);ctx.strokeStyle=layer===2?'#e5cc92':CYAN;ctx.lineWidth=tail/23+1;ctx.stroke();
    }
    traceVenusShieldFront(ctx,x,y,r);
    ctx.globalAlpha=strength*.85;ctx.strokeStyle=layer===2?GOLD:CYAN;ctx.lineWidth=9;ctx.stroke();
    ctx.globalAlpha=strength;ctx.strokeStyle='#edfffa';ctx.lineWidth=3;ctx.stroke();
    // Gilded inset plates accent the shield crown and its two shoulders.
    for(const side of [-1,1]){
      ctx.globalAlpha=strength*.65;
      block(ctx,x+side*r*.34-14,y-r*.84+9,28,2,GOLD);
      block(ctx,x+side*r*.9-2,y-r*.48,3,16,GOLD);
    }
    if(layer===0){
      // Gilded armour crests travel as whole pieces on the shield's crown, sides and foot.
      for(const [dx,dy,angle]of [[0,-.84,0],[.9,-.44,Math.PI/2],[-.9,-.44,-Math.PI/2],[.38,.7,Math.PI],[-.38,.7,Math.PI]]){
        ctx.save();ctx.translate(x+dx*r,y+dy*r);ctx.rotate(angle);
        ctx.globalAlpha=strength*.8;block(ctx,-21,-7,42,12,CYAN);
        ctx.globalAlpha=strength*.95;block(ctx,-23,-9,3,18,GOLD);block(ctx,20,-9,3,18,GOLD);
        block(ctx,-7,-10,14,3,GOLD);block(ctx,-4,-13,8,3,'#fff0bd');
        ctx.globalAlpha=strength;block(ctx,-3,-3,6,6,'#fff5d4');block(ctx,-1,-1,2,2,'#ffffff');
        ctx.restore();
      }
      // Detached shoulder shields give the silhouette depth without sealing its open gaps.
      for(const side of [-1,1]){
        ctx.save();ctx.translate(x+side*r*.74,y-r*.7);ctx.rotate(side*Math.PI/4);
        ctx.globalAlpha=strength*.35;block(ctx,-14,-10,28,22,CYAN);
        ctx.globalAlpha=strength*.8;block(ctx,-14,-7,3,14,GOLD);block(ctx,11,-7,3,14,GOLD);
        block(ctx,-4,-4,8,8,'#fff0ba');ctx.restore();
      }
    }
  }
  // The broken shell opens as eight short glass plates, then settles away.
  const release=Math.max(0,1-p/.3);
  for(let i=0;i<8&&release>0;i++){
    const angle=i*Math.PI/4,d=22+ease*170;
    ctx.save();ctx.translate(x+Math.cos(angle)*d,y+Math.sin(angle)*d);ctx.rotate(angle);
    ctx.globalAlpha=release*.55;block(ctx,-14,-6,28,12,i%3?CYAN:GOLD);ctx.restore();
  }
  // Overlapping translucent glass sheets build colour through alpha blending, never bevel shading.
  for(let i=0;i<56;i++){
    const angle=i*2.39996,d=26+reach*(.14+i%5*.065)*ease,fall=p*p*h*.13,size=6+i%4*2;
    ctx.save();ctx.translate(Math.round(x+Math.cos(angle)*d),Math.round(y+Math.sin(angle)*d*.82+fall));ctx.rotate(angle+p*(i%2?1:-1)*1.8);
    const ink=i%5?CYAN:GOLD;
    for(let sheet=2;sheet>=0;sheet--){
      ctx.save();ctx.translate(-sheet*size*.3,sheet*size*.12);ctx.rotate(sheet*.12);
      ctx.globalAlpha=fade*(.3-sheet*.075);block(ctx,-size/2,-size*.35,size,size*.7,ink);ctx.restore();
    }
    ctx.restore();
  }
  for(let i=0;i<48;i++){
    const angle=i*2.39996+.5,d=30+reach*(.18+i%4*.075)*ease;
    const gx=x+Math.cos(angle)*d,gy=y+Math.sin(angle)*d*.85+p*p*h*.08;
    const shine=Math.pow(Math.max(0,Math.sin(age*.16+i*1.9)),4),size=3+i%3;
    ctx.globalAlpha=fade*(.2+shine*.7);block(ctx,gx-size,gy,size*2+1,1,'#f2fff9');block(ctx,gx,gy-size,1,size*2+1,'#f2fff9');
    ctx.globalAlpha=fade*shine;block(ctx,gx-1,gy-1,2,2,'#ffffff');
  }
  // Soft edge light and separated shield plates replace the solid cyan frame.
  for(let side=0;side<4;side++){
    ctx.save();if(side===1){ctx.translate(w,0);ctx.rotate(Math.PI/2);}else if(side===2){ctx.translate(w,h);ctx.rotate(Math.PI);}else if(side===3){ctx.translate(0,h);ctx.rotate(-Math.PI/2);}
    const span=side%2?h:w,depth=Math.min(w,h)*.12;
    const wash=ctx.createLinearGradient(0,0,0,depth);wash.addColorStop(0,'rgba(120,222,223,.24)');wash.addColorStop(1,'rgba(120,222,223,0)');
    ctx.globalAlpha=fade;ctx.fillStyle=wash;ctx.fillRect(0,0,span,depth);
    for(let plate=0;plate<3;plate++){
      const px=span*(.2+plate*.3),length=span*.1;
      ctx.globalAlpha=fade*.45;block(ctx,px-length/2,7,length,3,CYAN);
      ctx.globalAlpha=fade*.65;block(ctx,px-length*.35,7,length*.7,1,'#effffe');
      ctx.globalAlpha=fade*.45;block(ctx,px-5,14,10,2,GOLD);
      ctx.globalAlpha=fade*.18;block(ctx,px-length*.35,12,length*.7,10,CYAN);block(ctx,px-length*.22,22,length*.44,7,CYAN);
      ctx.globalAlpha=fade*.7;block(ctx,px-length/2-2,5,2,14,GOLD);block(ctx,px+length/2,5,2,14,GOLD);
    }
    ctx.restore();
  }
  ctx.restore();
}
