import { drawSwarmConvergence } from './convergence-art';
import { gasDepth, gasFade, hookTarget, mawReach, mawWindow, singularityOpenness, singularityLift, SINGULARITY_LAND_TICKS, SINGULARITY_FALL_HEIGHT } from './singularity-maw';
import { CHAMBER_BOUNDS, MAP_COLS, MAP_ROWS, SINGULARITY_CHALLENGE, SOULLESS_LUNGE, SINGULARITY_GULP_SHAPE, SINGULARITY_GULP_TICKS, TELEPORT_PADS, TILE_SIZE, T_FLOOR, T_WALL, chamberOfTile } from './constants';
import { hasLineOfSight, type GameState } from './engine';
import { drawEnemyHealthBar } from './enemy-health-art';

// Three different materials and environments, tied to their guardians.
// Cosmetic only: world-space detail is deterministic and animation follows gameTick.
export interface WorldTheme {
  id: 'venus' | 'sirius' | 'singularity';
  name: string;
  colors: readonly string[];
  minimap: string;
  backdrop(ctx: CanvasRenderingContext2D, w: number, h: number, camX: number, camY: number, tick: number): void;
  floor(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string, tick: number): void;
  cover(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string, tick: number): void;
  ambience(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number): void;
}

const S = TILE_SIZE;
const hash = (x: number, y: number, k: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
const wrap = (v: number, span: number) => ((v % span) + span) % span;
function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function shape(ctx: CanvasRenderingContext2D, points: number[][], color: string) {
  ctx.fillStyle = color; ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
}
function isCover(state: Readonly<GameState>, tx: number, ty: number) {
  if (state.map[ty]?.[tx] !== T_WALL) return false;
  const ch = chamberOfTile(tx, ty); if (ch < 0) return false;
  const [t, l, b, r] = CHAMBER_BOUNDS[ch];
  return tx > l && tx < r && ty > t && ty < b;
}
function clipToFloor(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number) {
  ctx.beginPath();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++)
    if (state.map[ty]?.[tx] !== undefined && state.map[ty][tx] !== T_WALL) ctx.rect(tx * S - camX, ty * S - camY, S, S);
  ctx.clip();
}
function steppedDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, color: string, step = 8) {
  for (let y = -radius; y < radius; y += step) {
    const half = Math.floor(Math.sqrt(Math.max(0, radius * radius - (y + step / 2) ** 2)) / step) * step;
    if (half) block(ctx, cx - half, cy + y, half * 2, step, color);
  }
}

// Match the functional gas reach: cover blocks exposure, so vapour is clipped to visible floor.
function clipGasReach(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,x:number,y:number,radius:number,camX:number,camY:number) {
  const sx=Math.floor(x/S),sy=Math.floor(y/S);ctx.beginPath();
  for(let ty=Math.max(0,Math.floor((y-radius)/S));ty<=Math.min(MAP_ROWS-1,Math.ceil((y+radius)/S));ty++)
    for(let tx=Math.max(0,Math.floor((x-radius)/S));tx<=Math.min(MAP_COLS-1,Math.ceil((x+radius)/S));tx++)
      if(state.map[ty]?.[tx]!==T_WALL&&hasLineOfSight(state.map,sx,sy,tx,ty))ctx.rect(tx*S-camX,ty*S-camY,S,S);
  ctx.clip();
}

// VENUS: buried monuments and weathered relics of a fallen technological civilisation.
const V_CYAN = '#78dedf';
export function drawVenusSandWind(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number) {
  if (state.trial?.boss !== 'aegis_sentinel') return;
  const tick = state.gameTick, count = Math.max(110, Math.min(230, Math.round(w * h / (1280 * 720) * 155)));
  const gust = .78 + .16 * Math.sin(tick * .006) + .06 * Math.sin(tick * .017);
  ctx.save(); ctx.shadowBlur = 0;
  // An amber counterpart to Saturn's blizzard: fast flowing grains in two depths,
  // passing over the whole scene. No fog blanket, warning, damage, slow or push.
  for (let i = 0; i < count; i++) {
    const near = i % 3 === 0, speed = (near ? 5.2 : 2.8) + hash(i, 1, 91) * 2;
    const x = wrap(hash(i, 2, 91) * (w + 100) + tick * speed, w + 100) - 50;
    const y = wrap(hash(i, 3, 91) * (h + 60) - tick * speed * .12 + Math.sin(tick * .015 + i) * 5, h + 60) - 30;
    const length = near ? 18 + hash(i, 4, 91) * 22 : 7 + hash(i, 4, 91) * 11;
    ctx.globalAlpha = gust * (near ? .5 : .3);
    ctx.strokeStyle = near ? '#dfbd81' : '#c9a56a'; ctx.lineWidth = near && i % 2 === 0 ? 2 : 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - length, y + length * .12); ctx.stroke();
    if (near && i % 2 === 0) { ctx.globalAlpha = gust * .45; block(ctx, x - 1, y - 1, 2, 2, '#e2c28b'); }
  }
  ctx.restore();
}

const venus: WorldTheme = {
  id: 'venus', name: 'VENUS · FALLEN CITADEL',
  colors: ['#c9ad72', '#78a99b', '#b98264', '#c5c2a0'], minimap: '#120c06',
  backdrop(ctx, w, h, camX, camY, tick) {
    ctx.save();
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#21180f'); sky.addColorStop(.5, '#614328'); sky.addColorStop(1, '#b17b43');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // A pale sun smothered by the haze, and far dunes with wind-cut ridges.
    { const sx = w * .7 - camX * .008, sy = h * .2 - camY * .008;
      ctx.globalAlpha = .08; steppedDisc(ctx, sx, sy, 110, '#f0c888'); ctx.globalAlpha = .16; steppedDisc(ctx, sx, sy, 62, '#f4d6a0'); ctx.globalAlpha = .45; steppedDisc(ctx, sx, sy, 30, '#fbe6bc', 4); ctx.globalAlpha = 1; }
    for (const [par, base, col, ridge] of [[.01, .58, '#7a5632', '#a87a48'], [.02, .68, '#8c6238', '#b8874e']] as const) {
      for (let x = -32; x < w + 32; x += 16) {
        const wx = x + camX * par, top = h * base - camY * par + Math.round((Math.sin(wx * .0045) * 46 + Math.sin(wx * .013 + 1) * 14) / 4) * 4;
        ctx.globalAlpha = .55; block(ctx, x, top, 16, h - top, col); ctx.globalAlpha = .4; block(ctx, x, top, 16, 2, ridge);
        if (Math.floor(wx / 16) % 5 === 0) { ctx.globalAlpha = .25; block(ctx, x + 2, top + 14, 12, 1, ridge); block(ctx, x + 6, top + 26, 10, 1, ridge); }
      }
    }
    ctx.globalAlpha = 1;
    // A colossal fallen guardian's head lies half buried in the far dunes.
    { const gx = w * .4 - camX * .015, gy = h * .64 - camY * .015;
      ctx.globalAlpha = .6; shape(ctx, [[gx - 90, gy + 40], [gx - 84, gy - 50], [gx - 50, gy - 92], [gx + 30, gy - 96], [gx + 80, gy - 60], [gx + 92, gy + 40]], '#6c4e30');
      block(ctx, gx - 60, gy - 46, 44, 10, '#3a2a1c'); block(ctx, gx + 6, gy - 46, 44, 10, '#3a2a1c');
      ctx.globalAlpha = .3 + .15 * Math.sin(tick * .02); block(ctx, gx + 20, gy - 44, 14, 6, V_CYAN); ctx.globalAlpha = .6;
      block(ctx, gx - 8, gy - 30, 12, 32, '#5a4028'); block(ctx, gx - 50, gy + 4, 96, 6, '#3a2a1c');
      shape(ctx, [[gx - 84, gy - 50], [gx - 50, gy - 92], [gx - 40, gy - 86], [gx - 72, gy - 46]], '#a07a4c');
      shape(ctx, [[gx + 30, gy - 96], [gx + 4, gy - 60], [gx + 18, gy - 40], [gx + 2, gy - 10], [gx + 26, gy - 44], [gx + 12, gy - 62]], '#2e2418');
      ctx.globalAlpha = .7; ctx.fillStyle = '#b8874e'; ctx.fillRect(gx - 120, gy + 30, 240, 30); ctx.globalAlpha = 1; }
    // Half-buried terraces of a lost civilisation, with broad broken silhouettes.
    for (let layer = 0; layer < 2; layer++) {
      const par = layer ? .06 : .024, base = h * (.85 + layer * .1) - camY * par;
      for (let i = 0; i < 6; i++) {
        const span = w + 700, x = wrap(i * 327 + layer * 113 - camX * par, span) - 350;
        const width = 180 + hash(i, layer, 1) * 160, height = 65 + hash(i, layer, 2) * 105;
        const stone = layer ? '#665037' : '#735737';
        shape(ctx, [[x, base], [x, base - height * .5], [x + 25, base - height * .5], [x + 25, base - height], [x + width * .4, base - height], [x + width * .47, base - height + 16], [x + width * .65, base - height + 16], [x + width * .72, base - height * .6], [x + width, base - height * .6], [x + width, base]], stone);
        block(ctx, x + 28, base - height + 2, width * .28, 4, '#b08a56');
        block(ctx, x + 36, base - height + 29, width * .4, 3, '#473a28');
        for (let k = 0; k < 3; k++) block(ctx, x + 45 + k * 37, base - height + 40, 22, 28, '#51402c');
      }
    }
    // A vast broken monument beside the platform, tilted into the amber cloud sea.
    const mx = w * .075 - camX * .022, my = h * .6 - camY * .032;
    ctx.save(); ctx.translate(mx, my); ctx.rotate(-.21);
    shape(ctx, [[-76, 150], [-76, -175], [-53, -207], [-7, -207], [4, -188], [42, -188], [72, -151], [72, 150]], '#574631');
    shape(ctx, [[-76, 150], [-76, -175], [-53, -207], [-41, -193], [-45, 150]], '#b19260');
    shape(ctx, [[-41, -193], [-7, -207], [4, -188], [42, -188], [72, -151], [40, -159], [18, -177]], '#c5a46a');
    block(ctx, -37, -157, 91, 225, '#77623f');
    block(ctx, -24, -143, 65, 198, '#4c422f');
    // A worn aegis seal remains in the stone, mostly dormant and split by fractures.
    block(ctx, -8, -121, 34, 49, '#9e8956'); block(ctx, -2, -114, 22, 34, '#3a4233');
    block(ctx, 5, -107, 8, 21, '#607b60');
    ctx.globalAlpha = .2 + .1 * Math.sin(tick * .018);
    block(ctx, 7, -104, 3, 14, V_CYAN); ctx.globalAlpha = 1;
    for (let k = 0; k < 4; k++) { block(ctx, -14, -50 + k * 20, 43 - k * 4, 3, '#ae925b'); block(ctx, -14, -47 + k * 20, 43 - k * 4, 2, '#3e3828'); }
    shape(ctx, [[-55, -105], [-12, -72], [-19, -47], [30, -10], [0, -47], [1, -77]], '#302d23');
    shape(ctx, [[47, -142], [22, -93], [33, -62], [18, -31], [38, -60], [30, -93]], '#302d23');
    ctx.restore();
    // Dormant aegis totem fragments still hover, bobbing slowly; their cores flicker faintly.
    for (let i = 0; i < 4; i++) {
      const px = wrap(i * 360 + 220 - camX * .045, w + 300) - 150, py = h * (.3 + (i % 2) * .16) - camY * .04 + Math.sin(tick * .012 + i * 1.7) * 10, tall = 46 + (i % 3) * 18;
      ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(tick * .006 + i) * .06 + (i % 2 ? .12 : -.08));
      shape(ctx, [[-10, -tall], [10, -tall + 8], [12, tall * .5], [0, tall], [-12, tall * .5]], '#5e4a32');
      shape(ctx, [[-10, -tall], [0, -tall + 4], [0, tall], [-12, tall * .5]], '#9a7a4e');
      block(ctx, -13, -6, 26, 5, '#b08a56');
      const flick = Math.max(0, Math.sin(tick * .03 + i * 2.3)); ctx.globalAlpha = .15 + .35 * flick * flick; block(ctx, -2, -tall * .5, 4, tall * .7, V_CYAN);
      ctx.globalAlpha = .25; block(ctx, -16, tall + 10, 32, 3, '#3a2a1c');
      ctx.restore();
    }
    // Toppled lintel and scattered monumental blocks sink into dust, not a city of towers.
    ctx.save(); ctx.translate(w * .91 - camX * .035, h * .69 - camY * .04); ctx.rotate(.3);
    block(ctx, -155, -25, 310, 66, '#72583a'); block(ctx, -155, -25, 310, 7, '#b1915c');
    block(ctx, -148, -17, 296, 7, '#8e7247');
    for (let k = 0; k < 6; k++) { block(ctx, -130 + k * 49, -1, 27, 22, '#4b3e2c'); block(ctx, -128 + k * 49, -1, 23, 3, '#b0925a'); }
    shape(ctx, [[-20, -25], [-4, -5], [-13, 11], [8, 41], [-1, 8], [6, -7]], '#3c3325');
    ctx.restore();
    // Slow cloud banks bury the lower ruins; large soft layers leave dark gaps and scale.
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 6; i++) {
      const par = .018 + layer * .02, span = w + 1000;
      const x = wrap(i * 379 + layer * 139 + tick * (.025 + layer * .025) - camX * par, span) - 500;
      const y = h * (.23 + layer * .31) + (hash(i, layer, 5) - .5) * 90 - camY * par;
      const width = 300 + hash(i, layer, 6) * 230;
      const cloud = ctx.createLinearGradient(0, y - 25, 0, y + 120);
      cloud.addColorStop(0, '#d3a26400'); cloud.addColorStop(.4, layer === 2 ? '#d3a26455' : '#a8783e26'); cloud.addColorStop(1, '#be8a4e00');
      ctx.fillStyle = cloud; ctx.fillRect(x, y - 25, width, 145);
      ctx.globalAlpha = layer === 2 ? .11 : .06;
      shape(ctx, [[x, y + 63], [x + width * .2, y + 27], [x + width * .55, y + 14], [x + width * .7, y + 36], [x + width, y + 50], [x + width, y + 76], [x, y + 95]], '#d4a165');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
  floor(ctx, state, tx, ty, x, y, color) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, S, S); ctx.clip();
    const wx = tx * S, wy = ty * S;
    block(ctx, x, y, S, S, '#28261f');
    ctx.translate(x - wx, y - wy);
    // Each limestone slab spans three columns and two rows. Alternate courses
    // are staggered by one tile, and every joint stays aligned to the grid.
    const width = 3 * S, height = 2 * S;
    const row = Math.floor(ty / 2), offset = (row % 2) * S;
    const col = Math.floor((wx - offset) / width);
    const start = col * width + offset, end = start + width, py = row * height;
    const tone = hash(col, row, 82);
    block(ctx, start, py, width, height, '#3b3527'); // sand gathered in the joint
    block(ctx, start + 3, py + 3, width - 4, height - 5, tone > .66 ? '#37332a' : tone > .33 ? '#332f26' : '#302d25');
    block(ctx, start + 4, py + 3, width - 7, 1, '#4c4330');
    block(ctx, start + 3, py + 5, 1, height - 10, '#4f4833');
    block(ctx, start + 6, py + height - 4, width - 12, 2, '#25251e');
    // Subdued irregular wear, broad enough to feel like stone at gameplay scale.
    shape(ctx, [[start + 12, py + 13], [end - 29, py + 9], [end - 12, py + 37], [end - 46, py + 56], [start + 23, py + 42]], '#a68d550a');
    // Sand spills over chipped slab corners and collects in short shallow drifts.
    shape(ctx, [[start + 3, py + 3], [start + 26, py + 3], [start + 19, py + 8], [start + 8, py + 11], [start + 3, py + 20]], '#76613d35');
    if (hash(col, row, 85) > .65) {
      // Broad settled drifts bury parts of the slab joint, with stepped sandy shelves.
      block(ctx, start + 4, py + 87, 42, 7, '#79603930');
      block(ctx, start + 10, py + 82, 26, 5, '#80663e26');
      block(ctx, start + 15, py + 78, 13, 4, '#80663e18');
    }
    if (tone > .68) {
      block(ctx, end - 36, py + 83, 30, 2, '#75603c55');
      block(ctx, end - 29, py + 80, 19, 3, '#65553544');
      // An old fracture, partly lost under the joint's sand.
      ctx.strokeStyle = '#1f211b90'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(end - 38, py + 3); ctx.lineTo(end - 47, py + 19); ctx.lineTo(end - 44, py + 28); ctx.lineTo(end - 57, py + 42); ctx.stroke();
    }
    if (hash(col, row, 83) > .8) {
      // A small worn fragment of a carved seal, with no active light or circuitry.
      const sx = start + width * .52, sy = py + 48;
      block(ctx, sx - 12, sy - 10, 21, 2, '#1f221d75'); block(ctx, sx - 12, sy - 10, 2, 18, '#1f221d75');
      block(ctx, sx - 6, sy - 4, 12, 2, '#76613a45'); block(ctx, sx + 4, sy - 3, 2, 10, '#76613a45');
      block(ctx, sx - 6, sy + 7, 8, 2, '#1f221d75');
    }
    if (hash(col, row, 84) > .87) {
      // A few broken tesserae of an older mosaic show through the encroaching sand.
      // Flat, muted inlays stay embedded in the paving rather than reading as pickups.
      const mx = start + width * .29, my = py + 67;
      ctx.globalAlpha = .4;
      block(ctx, mx, my, 7, 5, '#9d8758'); block(ctx, mx + 9, my, 6, 5, '#7a8a6c');
      block(ctx, mx + 17, my + 1, 5, 4, '#998563');
      block(ctx, mx, my + 7, 6, 6, '#7a8a6c'); block(ctx, mx + 1, my + 15, 5, 5, '#a1895c');
      block(ctx, mx + 8, my + 15, 5, 4, '#8e7953');
      ctx.globalAlpha = 1;
      shape(ctx, [[mx + 9, my + 4], [mx + 25, my + 1], [mx + 28, my + 21], [mx + 9, my + 23], [mx + 15, my + 13]], '#4c423078');
      block(ctx, mx + 4, my + 18, 12, 2, '#7b653b44');
    }
    // Each tile is a worn paver scored into the slab: faint sand-filled seams on its top and left edges, broken where
    // the stone has worn smooth, with a soft lit lip beside them. Seams skip edges that already sit on a slab joint.
    const seamTop = ty % 2 !== 0, seamLeft = (wx - start) % width !== 0;
    for (let k = 0; k < 6; k++) {
      if (seamTop && hash(tx, ty, 90 + k) > .15) { block(ctx, wx + k * 8, wy, 8, 1, '#17150f88'); block(ctx, wx + k * 8, wy + 1, 8, 1, '#6a5b3c40'); }
      if (seamLeft && hash(tx, ty, 100 + k) > .15) { block(ctx, wx, wy + k * 8, 1, 8, '#17150f88'); block(ctx, wx + 1, wy + k * 8, 1, 8, '#6a5b3c38'); }
    }
    const wear = hash(tx, ty, 110);
    if (wear > .78) { // a chipped corner holding a little sand
      shape(ctx, [[wx + 1, wy + 1], [wx + 9, wy + 1], [wx + 1, wy + 8]], '#1f1d1650');
      shape(ctx, [[wx + 2, wy + 2], [wx + 7, wy + 2], [wx + 2, wy + 6]], '#8a6f4235');
    } else if (wear < .14) { // a hairline crack wandering in from one edge
      const cx = wx + 10 + Math.floor(hash(tx, ty, 111) * 26);
      ctx.strokeStyle = '#1d1e1870'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, wy + 1); ctx.lineTo(cx + 4, wy + 9); ctx.lineTo(cx + 2, wy + 15); ctx.lineTo(cx + 8, wy + 22); ctx.stroke();
      block(ctx, cx + 5, wy + 10, 2, 1, '#6a5b3a30');
    }
    if (isCover(state, tx, ty - 1)) {
      // Wind packs a faint bank against the foot of an existing ruin wall.
      block(ctx, wx + 3, wy, S - 6, 4, '#8e704330'); block(ctx, wx + 9, wy + 4, 27, 4, '#8e704320');
    }
    ctx.globalAlpha = .025; block(ctx, wx, wy, S, S, color);
    ctx.restore();
  },
  cover(ctx, state, tx, ty, x, y, color, tick) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, S, S); ctx.clip();
    const top = !isCover(state, tx, ty - 1), bottom = !isCover(state, tx, ty + 1);
    const left = !isCover(state, tx - 1, ty), right = !isCover(state, tx + 1, ty);
    // Monument fragments: broad weathered stone courses cross tile joins.
    block(ctx, x, y, S, S, '#675b41');
    const wx = tx * S, wy = ty * S;
    ctx.save(); ctx.translate(x - wx, y - wy);
    for (let row = Math.floor(wy / 77) - 1; row <= Math.floor((wy + S) / 77); row++) {
      for (let col = Math.floor(wx / 113) - 1; col <= Math.floor((wx + S) / 113); col++) {
        const px = col * 113 + (row % 2) * 43, py = row * 77;
        const tone = hash(col, row, 41);
        block(ctx, px, py, 111, 75, tone > .5 ? '#84734e' : '#7a6b4b');
        block(ctx, px + 2, py + 2, 107, 4, '#aa9464');
        block(ctx, px + 2, py + 6, 3, 66, '#988458');
        block(ctx, px, py + 73, 111, 2, '#4f4935');
        // Eroded mineral patches, broad and flat rather than recessed machine panels.
        shape(ctx, [[px + 9, py + 11], [px + 63, py + 9], [px + 89, py + 29], [px + 54, py + 42], [px + 15, py + 34]], '#a58c5730');
        if (tone > .62) {
          shape(ctx, [[px + 77, py], [px + 66, py + 21], [px + 73, py + 34], [px + 54, py + 56], [px + 68, py + 32], [px + 61, py + 21]], '#4a4434');
        }
      }
    }
    ctx.restore();
    // Worn crowns and plinths define the joined ruin, not a border around every cell.
    if (top) { block(ctx, x, y, S, 5, '#b9a174'); block(ctx, x, y + 5, S, 3, '#958055'); }
    if (left) block(ctx, x, y, 3, S, '#a18c62');
    if (right) block(ctx, x + 44, y, 4, S, '#4c4734');
    if (bottom) { block(ctx, x, y + 42, S, 6, '#484331'); block(ctx, x + 2, y + 40, 44, 2, '#9d8558'); }
    // Relic seals are rare: carved bronze remains of the civilisation's aegis technology.
    if (hash(tx, ty, 46) > .85) {
      block(ctx, x + 13, y + 11, 22, 27, '#5a5037');
      block(ctx, x + 15, y + 12, 18, 3, '#baa06a'); block(ctx, x + 15, y + 15, 3, 18, '#a18b58');
      block(ctx, x + 30, y + 15, 3, 18, '#a18b58'); block(ctx, x + 18, y + 33, 12, 3, '#8e7a50');
      block(ctx, x + 21, y + 19, 6, 11, '#525f44');
      ctx.globalAlpha = .16 + .13 * Math.sin(tick * .022 + tx + ty);
      block(ctx, x + 23, y + 21, 2, 7, V_CYAN); ctx.globalAlpha = 1;
    } else if (hash(tx, ty, 47) > .7) {
      // Worn inscription fragments: interrupted steps, bars or old glyph columns.
      const carving = Math.floor(hash(tx, ty, 49) * 3);
      if (carving === 0) {
        block(ctx, x + 11, y + 14, 25, 3, '#514b36'); block(ctx, x + 11, y + 17, 4, 15, '#514b36');
        block(ctx, x + 15, y + 29, 13, 3, '#514b36'); block(ctx, x + 25, y + 23, 3, 8, '#514b36');
        block(ctx, x + 12, y + 13, 23, 1, '#aa925f');
        block(ctx, x + 21, y + 14, 5, 3, '#84734e'); // erosion breaks the carved line
      } else if (carving === 1) {
        for (let k = 0; k < 3; k++) {
          block(ctx, x + 10 + k * 3, y + 13 + k * 8, 23 - k * 4, 3, '#514b36');
          block(ctx, x + 11 + k * 3, y + 12 + k * 8, 15 - k * 3, 1, '#aa925f');
        }
        block(ctx, x + 19, y + 20, 6, 4, '#7a6b4b');
      } else for (let k = 0; k < 3; k++) {
        const xx = x + 10 + k * 10;
        block(ctx, xx, y + 19, 3, 11 - k * 2, '#514b36'); block(ctx, xx, y + 19, 6, 3, '#514b36');
        block(ctx, xx + 1, y + 17, 6, 1, '#aa925f');
      }
    }
    // Chips remain inside the solid footprint; sand and patina collect on exposed faces.
    if (top && hash(tx, ty, 48) > .45) { block(ctx, x + 9, y, 13, 3, '#655a40'); block(ctx, x + 14, y + 3, 5, 3, '#7d6c47'); }
    if (bottom) { block(ctx, x + 5, y + 37, 16, 3, '#a68b55'); block(ctx, x + 8, y + 35, 7, 2, '#9a814f'); }
    ctx.restore();
  },
  ambience(ctx, state, camX, camY, x0, y0, x1, y1, tick) {
    ctx.save(); clipToFloor(ctx, state, camX, camY, x0, y0, x1, y1);
    // A few tiny windblown sand grains pass over the quiet ruins, fading before looping.
    for (let i = 0; i < 120; i++) {
      const life = wrap(tick * .002 + hash(i, 1, 87), 1);
      const x = hash(i, 2, 87) * MAP_COLS * S + life * 42 - camX;
      const y = hash(i, 3, 87) * MAP_ROWS * S - life * 9 - camY;
      if (x < x0 * S - camX || x > (x1 + 1) * S - camX || y < y0 * S - camY || y > (y1 + 1) * S - camY) continue;
      ctx.globalAlpha = Math.sin(life * Math.PI) * .22;
      block(ctx, x, y, i % 4 ? 2 : 3, 1, '#c2a16b');
    }
    ctx.restore();
  },
};

// SIRIUS: sacred architecture, prayer inscriptions and light falling into darkness.
const S_GOLD = '#dbc17a', S_WHITE = '#fffbe3';
export function drawSiriusLightOverlay(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number) {
  if (state.trial?.boss !== 'blind_prayer') return;
  const light = siriusLightAmount(state), tick = state.gameTick;
  if (light <= 0) return;
  // Four seconds of movement at the original speed, then eleven seconds of stillness.
  // Integrate short ease-in/out ramps so pausing the motion never snaps its phase.
  const period = 900, duration = 240, ramp = 24, age = tick % period;
  const motion = age < ramp ? age * age / (2 * ramp)
    : age < duration - ramp ? age - ramp / 2
    : age < duration ? duration - ramp - (duration - age) ** 2 / (2 * ramp)
    : duration - ramp;
  const motionTick = Math.floor(tick / period) * (duration - ramp) + motion;
  ctx.save(); ctx.shadowBlur = 0;
  // One source above and to the left of the viewport. Every ray fans outward from
  // it, so the cone is narrow at the source and opens naturally across the screen.
  const sourceX = -w * .22, sourceY = -h * .95;
  const beams = [[.17, .082, .8], [.66, .125, 1], [1.4, .057, .75]];
  const length = Math.hypot(w, h) * 2.6;
  for (let i = 0; i < beams.length; i++) {
    const [destination, spread, strength] = beams[i];
    const angle = Math.atan2(w * destination - sourceX, h - sourceY) + Math.sin(motionTick * .0025 + i * 1.7) * .008;
    const opening = spread * (1 + Math.sin(motionTick * .007 + i * 1.3) * .1);
    ctx.save(); ctx.translate(sourceX, sourceY); ctx.rotate(-angle);
    // During each short animation burst, the original drift and shimmer speeds return.
    // All motion uses simulation time and pauses with play.
    const shaft = ctx.createLinearGradient(0, 0, 0, length);
    for (let stop = 0; stop <= 8; stop++) {
      const distance = stop / 8;
      const shimmer = .78 + .22 * Math.sin(motionTick * .018 - distance * 9 + i * 1.6);
      shaft.addColorStop(distance, 'rgba(232,215,171,' + (1 - distance) * shimmer + ')');
    }
    ctx.fillStyle = shaft;
    const intensity = .085 * light * strength * (.9 + .1 * Math.sin(motionTick * .011 + i));
    // Broad, evenly weighted layers read as an atmospheric light filter rather than
    // a brilliant central spotlight. Their sides remain smoothly feathered cones.
    const layers = 32;
    for (let layer = 0; layer < layers; layer++) {
      const feather = 1 - layer / layers, near = (2 + i % 3) * feather;
      const far = length * opening * feather;
      ctx.globalAlpha = intensity * (1 - layer / layers * .45) * .5;
      ctx.beginPath(); ctx.moveTo(-near, 0); ctx.lineTo(near, 0);
      ctx.lineTo(far, length); ctx.lineTo(-far, length); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
// A small alphabet of block-carved fictional prayer runes; no repeated eye stickers.
function rune(ctx: CanvasRenderingContext2D, x: number, y: number, kind: number, color: string, scale = 1) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(scale, scale);
  block(ctx, -1, -8, 2, 16, color);
  if (kind % 3 === 0) {
    block(ctx, -7, -5, 14, 2, color); block(ctx, -7, -8, 2, 5, color); block(ctx, 5, -8, 2, 5, color); block(ctx, -4, 5, 8, 2, color);
  } else if (kind % 3 === 1) {
    block(ctx, -6, -7, 12, 2, color); block(ctx, -6, -7, 2, 9, color); block(ctx, 4, -7, 2, 9, color); block(ctx, -4, 1, 8, 2, color);
  } else {
    block(ctx, -6, -5, 6, 2, color); block(ctx, 0, 2, 7, 2, color); block(ctx, -6, -5, 2, 5, color); block(ctx, 5, -1, 2, 5, color); block(ctx, -4, 6, 8, 2, color);
  }
  ctx.restore();
}
function createSiriusTheme(light: number): WorldTheme {
  // Cache palette blends; scene drawing never parses colours on every tile/frame.
  const palette = new Map<string, string>();
  const ink = (dark: string, lit: string) => {
    if (light === 0) return dark;
    if (light === 1) return lit;
    const key = dark + lit, cached = palette.get(key); if (cached) return cached;
    const rgba = (value: string) => [1, 3, 5, 7].map((at, i) => i === 3 && value.length === 7 ? 255 : parseInt(value.slice(at, at + 2), 16));
    const from = rgba(dark), to = rgba(lit);
    const color = '#' + from.map((v, i) => Math.round(v + (to[i] - v) * light).toString(16).padStart(2, '0')).join('');
    palette.set(key, color); return color;
  };
  const inscription = ink(S_GOLD, '#736b56');
  return {
  id: 'sirius', name: 'SIRIUS · BLIND SANCTUARY',
  colors: ['#ffe45c', '#bfe0ff', '#ffb070', '#fff6d8'], minimap: ink('#0a0b18', '#35343b'),
  backdrop(ctx, w, h, camX, camY, tick) {
    ctx.save();
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, ink('#080a17', '#211e18')); sky.addColorStop(.5, ink('#1d1b31', '#3e3726')); sky.addColorStop(1, ink('#090b15', '#625236'));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    // A tall pointed-arch stained-glass window glows faintly in the far wall: stepped
    // stone tracery around a grid of dim coloured panes, no radiating spokes.
    {
      const wx = w * .62 - camX * .015, wy = h * .06 - camY * .015, cols = 4, rows = 9, pw = 18, ph = 22, gap = 4;
      const ww = cols * (pw + gap) + gap, wh = rows * (ph + gap) + gap, panes = ['#e8c860', '#7fa8e0', '#e09a58', '#c8b0f0'];
      const archRows = 4, frame = ink('#1e1c2c', '#5a503a'), stone = ink('#34303f', '#7a6c50');
      ctx.globalAlpha = 1;
      for (let k = 0; k < archRows; k++) { const inset = (archRows - k) * 11; block(ctx, wx - 10 + inset, wy - (archRows - k) * 16, ww + 20 - inset * 2, 16, stone); }
      block(ctx, wx - 10, wy, ww + 20, wh + 14, stone); block(ctx, wx, wy, ww, wh, frame);
      for (let k = 0; k < archRows; k++) { const inset = (archRows - k) * 11 + 8; if (ww - inset * 2 + 16 > 0) block(ctx, wx + inset - 8, wy - (archRows - k) * 16 + 6, ww - inset * 2 + 16, 12, frame); }
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const glow = .55 + .25 * Math.sin(tick * .012 + r * .9 + c * 1.7);
        ctx.globalAlpha = .26 * glow; block(ctx, wx + gap + c * (pw + gap), wy + gap + r * (ph + gap), pw, ph, panes[(r * 3 + c * 2 + Math.floor(hash(r, c, 35) * 2)) % 4]);
      }
      ctx.globalAlpha = .35; block(ctx, wx + ww / 2 - 2, wy - archRows * 16 + 10, 4, archRows * 16 + wh - 10, stone);
      ctx.globalAlpha = 1;
    }
    // Immense sanctuary colonnades, separated by darkness, in two depths.
    for (let layer = 0; layer < 2; layer++) {
      // The repeat span is a whole number of columns, so every arch lands on a column.
      const spacing = layer ? 310 : 215, count = Math.ceil(w / spacing) + 2;
      for (let i = 0; i < count; i++) {
      const par = layer ? .07 : .025;
      const x = wrap(i * spacing + layer * 83 - camX * par, count * spacing) - spacing;
      const top = h * (layer ? -.23 : .02) - camY * par, height = h * (layer ? 1.5 : 1.08);
      const width = layer ? 34 : 20;
      block(ctx, x, top + 95, width, height, layer ? ink('#292837', '#6e6249') : ink('#292535', '#514b38'));
      block(ctx, x + 3, top + 100, 4, height, layer ? ink('#756851', '#b6a276') : ink('#49404a', '#8e805d'));
      block(ctx, x - 8, top + 90, width + 16, 14, ink('#655b53', '#95815b'));
      block(ctx, x - 6, top + height - 12, width + 12, 18, ink('#4d4650', '#7b6b50'));
      // Stepped high arches join the columns; deep inner openings remain black.
      const spring = top + 100;
      for (let k = 0; k < 6; k++) {
        const rise = (5 - k) * 14, arm = (spacing - width) / 12;
        block(ctx, x + width + k * arm, spring - k * 14, arm + 1, 9, ink('#4e4650', '#9c865c'));
        block(ctx, x + spacing - (k + 1) * arm, spring - k * 14, arm + 1, 9, ink('#4e4650', '#9c865c'));
        if (rise < 20) block(ctx, x + width + k * arm, spring - k * 14, arm, 2, ink('#8a795e', '#c4ac79'));
      }
      if (layer) for (let k = 0; k < 4; k++) { ctx.globalAlpha = .3; rune(ctx, x + width / 2, top + 160 + k * 46, i + k, S_GOLD, .65); ctx.globalAlpha = 1; }
      if (layer) {
        // A lantern hangs on a long chain under each arch, swaying, with a warm halo.
        const lx = x + spacing / 2 + Math.sin(tick * .012 + i) * 8, chain = h * (.38 + hash(i, 4, 33) * .22), ly = spring - 70 + chain, glow = .7 + .3 * Math.sin(tick * .05 + i * 2);
        ctx.globalAlpha = .7; ctx.strokeStyle = ink('#3e384a', '#6e6249'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + spacing / 2, spring - 70); ctx.lineTo(lx + 1, ly); ctx.stroke();
        ctx.globalAlpha = .12 * glow; steppedDisc(ctx, lx + 1, ly + 10, 44, '#ffcf70', 6); ctx.globalAlpha = .22 * glow; steppedDisc(ctx, lx + 1, ly + 10, 24, '#ffe0a0', 4);
        ctx.globalAlpha = 1; block(ctx, lx - 7, ly, 16, 4, ink('#6a5a48', '#9c865c')); block(ctx, lx - 6, ly + 4, 14, 14, ink('#2a2434', '#4a412c')); block(ctx, lx - 6, ly + 18, 14, 3, ink('#6a5a48', '#9c865c'));
        ctx.globalAlpha = .55 + .35 * glow; block(ctx, lx - 3, ly + 6, 8, 10, '#ffd88a'); block(ctx, lx - 1, ly + 8, 4, 5, '#fff4d0');
      }
    }
    }
    // A remote altar-star is partly hidden by a dark eclipse, like the Prayer's blindfold.
    const sx = w * .075 - camX * .012, sy = h * .27 - camY * .018;
    ctx.globalAlpha = .07; steppedDisc(ctx, sx, sy, 100, '#ddd5a1');
    ctx.globalAlpha = .22; steppedDisc(ctx, sx, sy, 64, '#d1bc79');
    ctx.globalAlpha = 1; steppedDisc(ctx, sx, sy, 32, '#eee2b0', 4);
    steppedDisc(ctx, sx + 12, sy - 6, 29, ink('#0c0d1a', '#49412c'), 4);
    block(ctx, sx - 66, sy - 1, 132, 2, '#baa368'); block(ctx, sx - 1, sy - 66, 2, 132, '#baa368');
    for (let i = 0; i < 35; i++) {
      ctx.globalAlpha = .15 + .15 * Math.sin(tick * .018 + i);
      block(ctx, wrap(i * 137 - camX * .04, w), wrap(i * 89 + tick * .1 - camY * .04, h), 2, 2, S_WHITE);
    }
    // Small prayer lights rise slowly through the dark, flickering as they go.
    for (let i = 0; i < 14; i++) {
      const life = wrap(tick * (.0012 + hash(i, 1, 34) * .0008) + hash(i, 2, 34), 1), px = wrap(hash(i, 3, 34) * w * 1.3 - camX * .05 + Math.sin(tick * .01 + i) * 14, w), py = h * (1.05 - life * 1.1) - camY * .05;
      const fl = .6 + .4 * Math.sin(tick * .2 + i * 3);
      ctx.globalAlpha = Math.sin(life * Math.PI) * .15 * fl; block(ctx, px - 6, py - 6, 14, 14, '#ffd88a');
      ctx.globalAlpha = Math.sin(life * Math.PI) * .7 * fl; block(ctx, px - 1, py - 1, 3, 4, '#fff0c0');
    }
    ctx.restore();
  },
  floor(ctx, state, tx, ty, x, y, color) {
    ctx.save(); const n = hash(tx, ty, 3);
    block(ctx, x, y, S, S, n > .5 ? ink('#141420', '#514b38') : ink('#11121e', '#4c4735'));
    ctx.globalAlpha = .025; block(ctx, x, y, S, S, color); ctx.globalAlpha = 1;
    // Long polished marble flags in the active sanctuary palette. Sparse veins keep the arena quiet.
    if (ty % 2 === 0) block(ctx, x, y, S, 1, ink('#282635', '#403c2d'));
    if ((tx + Math.floor(ty / 2)) % 3 === 0) block(ctx, x, y, 1, S, ink('#252533', '#443f2f'));
    if (n > .78) {
      ctx.strokeStyle = ink('#b9b5cd13', '#ffffef32'); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 2, y + 6); ctx.lineTo(x + 19, y + 17); ctx.lineTo(x + 22, y + 27); ctx.lineTo(x + 44, y + 35); ctx.stroke();
    }
    ctx.restore();
  },
  cover(ctx, state, tx, ty, x, y, color, tick) {
    ctx.save();
    const top = !isCover(state, tx, ty - 1), bottom = !isCover(state, tx, ty + 1);
    const left = !isCover(state, tx - 1, ty), right = !isCover(state, tx + 1, ty);
    // The same carved sanctuary stone, with pale cornices above deep recesses in both states.
    block(ctx, x, y, S, S, ink('#625b68', '#8c846a'));
    block(ctx, x + 4, y + 6, 40, 37, ink('#3c374b', '#655f4c'));
    block(ctx, x + 8, y + 9, 32, 31, ink('#242336', '#34343c'));
    block(ctx, x + 9, y + 10, 30, 3, ink('#191b2c', '#242a33'));
    if (top) { block(ctx, x, y, S, 5, ink('#c1b7a0', '#c4b991')); block(ctx, x + 2, y + 5, 44, 3, ink('#867b7e', '#958b72')); block(ctx, x, y, S, 1, ink('#e6d8b3', '#ded2a9')); }
    if (left) { block(ctx, x, y, 4, S, ink('#9b9191', '#ada082')); block(ctx, x + 4, y + 7, 2, 34, ink('#c5b485', '#bca777')); }
    if (right) { block(ctx, x + 44, y, 4, S, ink('#2c2b3a', '#46464b')); block(ctx, x + 42, y + 7, 2, 34, ink('#746b61', '#81755c')); }
    if (bottom) { block(ctx, x, y + 42, S, 6, ink('#232433', '#3b3c42')); block(ctx, x + 3, y + 40, 42, 2, ink('#817462', '#938064')); }
    const kind = Math.floor(hash(tx, ty, 2) * 6);
    if (kind < 4) {
      // Gold writing is recessed, with only a few inscriptions receiving living light.
      const lit = kind === 0, pulse = .65 + .2 * Math.sin(tick * .023 + tx * .5 + ty);
      if (lit) { ctx.shadowColor = '#ead18c'; ctx.shadowBlur = 5; ctx.globalAlpha = pulse; }
      rune(ctx, x + 24, y + 25, kind, lit ? ink('#e5d297', '#fff9e6') : ink('#998663', '#c7bc9b'), 1.1);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    } else {
      // Narrow reliquary niche with pale sacred light behind its dark shutter.
      block(ctx, x + 18, y + 14, 12, 23, ink('#121728', '#353b4a'));
      block(ctx, x + 22, y + 16, 4, 17, ink('#d1c9a3', '#fff9e9'));
      block(ctx, x + 17, y + 34, 14, 3, S_GOLD);
      block(ctx, x + 19, y + 22, 10, 5, ink('#3e3b50', '#939190'));
    }
    ctx.restore();
  },
  ambience(ctx, state, camX, camY, x0, y0, x1, y1, tick) {
    ctx.save(); clipToFloor(ctx, state, camX, camY, x0, y0, x1, y1);
    // Sparse engraved prayers awaken under a slow diagonal wave of sacred light.
    // World coordinates keep the passing light attached to the marble when the camera moves.
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (state.map[ty]?.[tx] !== T_FLOOR) continue;
      const wx = tx * S, wy = ty * S, x = wx - camX, y = wy - camY;
      const phase = wrap(wx + wy * .45 - tick * .7, 1152);
      const glow = light * Math.max(0, 1 - Math.abs(phase - 576) / 180) ** 2;
      if (glow > 0) {
        ctx.globalAlpha = glow * (.08 + light * .16);
        block(ctx, x + 2, y + 2, S - 4, S - 4, ink('#f6dfa3', '#fff3c8'));
      }
      if (hash(tx, ty, 31) > .86) {
        const rx = x + 16 + hash(tx, ty, 32) * 16, ry = y + 19 + hash(tx, ty, 33) * 10;
        ctx.globalAlpha = .14 + light * .13;
        rune(ctx, rx, ry, Math.floor(hash(tx, ty, 34) * 3), inscription, .7);
        block(ctx, rx - 9, ry + 10, 18, 1, inscription);
        block(ctx, rx - 9, ry + 8, 1, 3, inscription); block(ctx, rx + 8, ry + 8, 1, 3, inscription);
        if (glow > 0) {
          ctx.globalAlpha = glow * .9;
          rune(ctx, rx, ry, Math.floor(hash(tx, ty, 34) * 3), ink('#f9e8ad', '#fff7d4'), .7);
          // A tiny pale glint catches the inscription as the light crests, then fades.
          const glint = Math.max(0, glow - .65) / .35;
          ctx.globalAlpha = glint * .8;
          block(ctx, rx + 8, ry - 8, 2, 6, S_WHITE); block(ctx, rx + 6, ry - 6, 6, 2, S_WHITE);
        }
      }
    }
    // One prayer inscription around each altar/pad remains the larger floor landmark.
    for (const [px, py] of TELEPORT_PADS) {
      const cx = (px + .5) * S - camX, cy = (py + .5) * S - camY;
      ctx.globalAlpha = .12; ctx.strokeStyle = inscription; ctx.lineWidth = 2;
      ctx.strokeRect(cx - 100, cy - 100, 200, 200);
      ctx.globalAlpha = .055; ctx.strokeRect(cx - 108, cy - 108, 216, 216);
      for (let i = 0; i < 12; i++) {
        const side = Math.floor(i / 3), along = (i % 3 - 1) * 43;
        ctx.globalAlpha = .17 + .04 * Math.sin(tick * .015 + i);
        rune(ctx, cx + (side === 1 ? 88 : side === 3 ? -88 : along), cy + (side === 0 ? -88 : side === 2 ? 88 : along), i, inscription, .6);
      }
    }
    if (light > 0) {
      for (let room = 0; room < CHAMBER_BOUNDS.length; room++) {
        const [top, left, bottom, right] = CHAMBER_BOUNDS[room];
        // Many tiny floor lights hover over fixed points in the marble. Their individual
        // fades and slight drift keep the sanctuary alive without a repeating particle grid.
        for (let i = 0; i < 96; i++) {
          const life = wrap(tick * (.0045 + i % 4 * .0004) + hash(i, room, 77), 1);
          const x = (left + 1 + hash(i, room, 78) * (right - left - 2)) * S - camX + Math.sin(tick * .04 + i * 1.7) * 9;
          const y = (top + 1 + hash(i, room, 79) * (bottom - top - 2)) * S - camY - Math.sin(life * Math.PI) * 18;
          if (x < x0 * S - camX - 8 || x > (x1 + 1) * S - camX + 8 || y < y0 * S - camY - 8 || y > (y1 + 1) * S - camY + 8) continue;
          const fade = Math.sin(life * Math.PI) ** 2;
          ctx.save(); ctx.shadowColor = '#ffe3a0'; ctx.shadowBlur = fade > .4 ? 10 : 5;
          ctx.globalAlpha = light * fade;
          block(ctx, x, y, i % 4 ? 2 : 3, 2, i % 3 ? '#fff7cb' : '#ffde8e');
          block(ctx, x, y, 1, 1, '#ded2a9');
          ctx.shadowBlur = 0;
          if (i % 9 === 0) {
            const glint = Math.max(0, fade - .7) / .3;
            ctx.globalAlpha = light * glint * .85;
            block(ctx, x - 3, y + 1, 8, 1, '#fffbe8'); block(ctx, x + 1, y - 3, 1, 8, '#fffbe8');
          }
          ctx.restore();
        }
        // Sparse higher airborne glints rise through the light above the floor motes.
        for (let i = 0; i < 20; i++) {
          const age = wrap(tick * .0042 + hash(i, room, 71), 1);
          const wx = (left + 1 + hash(i, room, 72) * (right - left - 2)) * S;
          const wy = (top + 2 + hash(i, room, 73) * (bottom - top - 3)) * S;
          const x = wx - camX + Math.sin(tick * .009 + i) * 5, y = wy - age * 65 - camY;
          const fade = Math.sin(age * Math.PI), twinkle = Math.max(0, Math.sin(tick * .06 + i * 2.3));
          ctx.globalAlpha = light * fade * (.35 + twinkle * .45);
          block(ctx, x, y, 2, 3, i % 3 ? '#fffdf0' : '#e4cf9e');
          if (i % 5 === 0) {
            ctx.globalAlpha = light * fade * twinkle * .65;
            block(ctx, x - 3, y + 1, 8, 1, '#fffdf2'); block(ctx, x + 1, y - 3, 1, 8, '#fffdf2');
          }
        }
      }
    }
    ctx.restore();
  },
  };
}
// Palette frames are shared by the battlefield, background, minimap and teleport picker.
const SIRIUS_LIGHT_STEPS = 96;
const siriusFrames = Array.from({ length: SIRIUS_LIGHT_STEPS + 1 }, (_, i) => createSiriusTheme(i / SIRIUS_LIGHT_STEPS));
function siriusLightAmount(state: Readonly<GameState>) {
  return Math.max(0, Math.min(1, state.trial?.siriusLightBlend ?? (state.trial?.siriusLight ? 1 : 0)));
}
function siriusTileTheme(state: Readonly<GameState>, tx: number, ty: number) {
  const blend = siriusLightAmount(state), room = chamberOfTile(tx, ty);
  const [top, left, bottom, right] = room >= 0 ? CHAMBER_BOUNDS[room] : [0, 0, MAP_ROWS, MAP_COLS];
  const distance = Math.max(0, Math.min(1, (tx - left + (ty - top) * .5) / (right - left + (bottom - top) * .5)));
  const front = Math.max(0, Math.min(1, blend * 1.6 - distance * .6));
  const eased = front * front * (3 - 2 * front);
  return siriusFrames[Math.round(eased * SIRIUS_LIGHT_STEPS)];
}
const siriusTransitions = siriusFrames.map(frame => ({
  ...frame,
  floor(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string, tick: number) {
    siriusTileTheme(state, tx, ty).floor(ctx, state, tx, ty, x, y, color, tick);
  },
  cover(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string, tick: number) {
    siriusTileTheme(state, tx, ty).cover(ctx, state, tx, ty, x, y, color, tick);
  },
}));

// SINGULARITY: fractured black matter, hooked edges and a voracious darkness.
// A blocky rounded void: straight sides with broad stepped rounded corners, matching the
// game's solid block geometry. `voidOutline` traces the same stepped edge for strokes.
function voidOutline(r: number): [number, number][] {
  const step = Math.max(4, Math.round(r * .09 / 2) * 2), c = r * .5, rows: [number, number][] = [];
  for (let y = -r; y < r; y += step) {
    const m = Math.max(Math.abs(y), Math.abs(y + step)), over = Math.max(0, Math.min(m, r) - (r - c));
    rows.push([y, Math.round((r - c + Math.sqrt(Math.max(0, c * c - over * over))) / step) * step]);
  }
  const pts: [number, number][] = [];
  for (const [y, half] of rows) { pts.push([half, y]); pts.push([half, y + step]); }
  for (let k = rows.length - 1; k >= 0; k--) { const [y, half] = rows[k]; pts.push([-half, y + step]); pts.push([-half, y]); }
  return pts;
}
function voidDisc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  shape(ctx, voidOutline(r).map(([px, py]) => [x + px, y + py]), color);
}

/** How visible a Maw is (0–1): it fades in over its first half second and out over the last third of a second before it
 * moves. Based on its own age, so a Maw with a longer first timer is still fully visible. */
export const mawFade = (m: { age?: number; ticks: number }) => Math.max(0, Math.min(1, ((m.age ?? 40) + 1) / 40, m.ticks / 40));
const smooth = (v: number) => { const c = Math.max(0, Math.min(1, v)); return c * c * (3 - 2 * c); };
/** How green a Maw is (0 violet – 1 green): it turns green over the warning before it moves, and the reopened Maw starts
 * green and eases back to violet over its first 1.5 seconds, so the colour never jumps across the move. */
export const mawGreen = (m: { age?: number; ticks: number }) => Math.max(
  m.ticks < SINGULARITY_CHALLENGE.mawPreview ? smooth(1 - m.ticks / SINGULARITY_CHALLENGE.mawPreview) : 0,
  1 - smooth((m.age ?? 90) / 90));
/** Blends two #rrggbb colours. */
export function mixHex(a: string, b: string, t: number) {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map(i => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0')).join('');
}

/** How hard the maw is sucking right now (0–1): rises and falls over the first ~4.5s of each gulp. */
/** How far into the current gulp the black hole is, in gulp-shape units (0 = it starts sucking). The first gulp comes
 * one full interval into play, so nothing sucks right as the challenge starts; before then this is past every envelope. */
function singularityGulpPhase(tick: number) {
  if (tick < SINGULARITY_GULP_TICKS) return SINGULARITY_GULP_TICKS / SINGULARITY_GULP_SHAPE;
  return wrap(tick / SINGULARITY_GULP_TICKS, 1) * SINGULARITY_GULP_TICKS / SINGULARITY_GULP_SHAPE;
}
/**
 * In the Singularity challenge the backdrop black hole gulps whenever a Maw opens instead of on its own 45-second clock.
 * Synced from the game state each frame before the backdrop draws: `devour` is how far into the latest opening it is (in
 * gulp-shape units), `count` how many openings there have been, so the kept inward and spin progress never snaps. A Maw
 * held by the god panel adds nothing. Outside the challenge it is cleared and the old clock runs.
 */
let gulpSync: { devour: number; count: number } | null = null;
export function syncSingularityGulp(state: Readonly<GameState> | null) {
  const maws = state?.trial?.devourer?.maws; if (!maws?.length) { gulpSync = null; return; }
  const C = SINGULARITY_CHALLENGE.mawCycle, cycle = C.closed + C.warn + C.open, start = C.closed + C.warn;
  let count = 0, since = Infinity;
  for (const m of maws) {
    if (m.forced) continue;
    const a = (m.offset ?? 0) + (m.age ?? 0), n = m.opens ?? 0; // counted by the Maw itself, so a teleport never resets it
    count += n; if (n > 0) since = Math.min(since, wrap((a - start) / cycle, 1) * cycle);
  }
  gulpSync = { devour: since === Infinity ? SINGULARITY_GULP_TICKS / SINGULARITY_GULP_SHAPE : since / SINGULARITY_GULP_SHAPE, count };
}
export function singularitySwell(tick: number) {
  const devour = singularityGulpPhase(tick);
  return devour < .45 ? Math.sin(devour / .45 * Math.PI) : 0;
}

// The exact reach of a pull: open floor tiles whose centres lie within `r` pixels of a point.
function reachTiles(state:Readonly<GameState>,x:number,y:number,r:number) {
  const set=new Set<number>();
  for(let ty=Math.max(0,Math.floor((y-r)/S));ty<=Math.min(MAP_ROWS-1,Math.floor((y+r)/S));ty++)
    for(let tx=Math.max(0,Math.floor((x-r)/S));tx<=Math.min(MAP_COLS-1,Math.floor((x+r)/S));tx++)
      if(state.map[ty]?.[tx]!==undefined&&state.map[ty][tx]!==T_WALL&&Math.hypot((tx+.5)*S-x,(ty+.5)*S-y)<=r)set.add(ty*MAP_COLS+tx);
  return set;
}
// The stepped outline of a tile set as closed loops of tile corners, so a dashed stroke marches around it.
function tileOutlinePath(ctx:CanvasRenderingContext2D,set:Set<number>,camX:number,camY:number) {
  const W=MAP_COLS+1,key=(cx:number,cy:number)=>cy*W+cx,edges=new Map<number,number[]>();
  const add=(ax:number,ay:number,bx:number,by:number)=>{const k=key(ax,ay);if(!edges.has(k))edges.set(k,[]);edges.get(k)!.push(key(bx,by));};
  for(const k of set){const tx=k%MAP_COLS,ty=Math.floor(k/MAP_COLS),has=(x:number,y:number)=>set.has(y*MAP_COLS+x);
    if(!has(tx,ty-1))add(tx,ty,tx+1,ty);if(!has(tx+1,ty))add(tx+1,ty,tx+1,ty+1);
    if(!has(tx,ty+1))add(tx+1,ty+1,tx,ty+1);if(!has(tx-1,ty))add(tx,ty+1,tx,ty);}
  ctx.beginPath();
  for(const start of [...edges.keys()]){
    let at=start;if(!edges.get(at)?.length)continue;
    ctx.moveTo((at%W)*S-camX,Math.floor(at/W)*S-camY);
    for(let guard=0;guard<4000;guard++){const list=edges.get(at);if(!list?.length)break;at=list.pop()!;ctx.lineTo((at%W)*S-camX,Math.floor(at/W)*S-camY);if(at===start)break;}
    ctx.closePath();
  }
}
// A reach drawn tile by tile: each tile lit more strongly toward the centre, with bright bands of tiles sweeping
// inward, then a glowing stepped boundary with a marching dash.
function drawReach(ctx:CanvasRenderingContext2D,set:Set<number>,cx:number,cy:number,rTiles:number,camX:number,camY:number,tick:number,o:{alpha:number;base:string;band:string;edge:string;speed:number}) {
  for(const k of set){
    const tx=k%MAP_COLS,ty=Math.floor(k/MAP_COLS),d=Math.hypot((tx+.5)*S-cx,(ty+.5)*S-cy)/S,near=1-d/(rTiles+.5);
    ctx.globalAlpha=o.alpha*(.22+.45*near);block(ctx,tx*S-camX+2,ty*S-camY+2,S-4,S-4,o.base);
    for(const lag of [0,.5]){const band=rTiles*(1-wrap(tick*o.speed+lag,1));
      if(Math.abs(d-band)<.55){ctx.globalAlpha=o.alpha*.45*(1-Math.abs(d-band)/.55);block(ctx,tx*S-camX+4,ty*S-camY+4,S-8,S-8,o.band);}}
  }
  tileOutlinePath(ctx,set,camX,camY);
  ctx.lineJoin='miter';
  ctx.globalAlpha=o.alpha*.18;ctx.strokeStyle=o.base;ctx.lineWidth=10;ctx.stroke();
  ctx.globalAlpha=o.alpha*.5;ctx.strokeStyle=o.base;ctx.lineWidth=2;ctx.stroke();
  ctx.globalAlpha=o.alpha*.95;ctx.strokeStyle=o.edge;ctx.lineWidth=3;ctx.setLineDash([12,8]);ctx.lineDashOffset=-tick*o.speed*60;ctx.stroke();ctx.setLineDash([]);
}

/** The Maw on the floor: its exact pull reach drawn tile by tile, with bands of light sweeping inward and a glowing
 * stepped boundary, a turning spiral of matter, and a blocky rounded black event horizon with a bright photon ring.
 * During the gulp the reach widens and brightens. A ghost Maw forming at its next spot shows where it will move. */
const SINGULARITY_GAS = { body:'#7dff8a', light:'#b6ff9a', shade:'#5ad86a' } as const; // the wall pipes' poison-green smoke
// A Lost Soul about to appear: a stepped diamond outline that tightens onto the tile as the moment nears, motes
// drawn in toward it, and a faint ghost silhouette fading in. Green, or gold for a Golden Soul. p runs 0 → 1.
function drawSoulSign(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,p:number,golden:boolean,seed:number,hollow=false,toxic=false) {
  const col=toxic?'#7dc88a':hollow?'#9a8fb0':golden?'#ffd86a':'#9dffb8',pale=toxic?'#c6ffb0':hollow?'#d8d0ec':golden?'#fff3c0':'#e8fff4',blink=.55+.45*Math.abs(Math.sin(tick*(.12+.25*p)+seed));
  ctx.save();ctx.shadowColor=col;ctx.shadowBlur=8;
  const r=Math.round((26-12*p)/2)*2,rim:[number,number][]=[[0,-r],[r/2,-r/2],[r,0],[r/2,r/2],[0,r],[-r/2,r/2],[-r,0],[-r/2,-r/2]];
  ctx.globalAlpha=blink*.9;ctx.strokeStyle=col;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.lineDashOffset=-tick;
  ctx.beginPath();rim.forEach(([px,py],k)=>k?ctx.lineTo(x+px,y+py):ctx.moveTo(x+px,y+py));ctx.closePath();ctx.stroke();ctx.setLineDash([]);
  for(let k=0;k<6;k++){const a=k*Math.PI/3+seed+tick*.03,d=(1-wrap(tick*.025+k/6,1))*34+4;ctx.globalAlpha=.5+.4*p;block(ctx,x+Math.cos(a)*d-2,y+Math.sin(a)*d-2,4,4,k%2?pale:col);}
  ctx.globalAlpha=.15+.45*p;block(ctx,x-5,y-8,10,12,pale);block(ctx,x-6,y-4,12,6,pale);
  ctx.restore();
}
export function drawSingularityTrap(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,camX:number,camY:number) {
  const t=state.trial?.devourer;if(!t)return;
  ctx.save();ctx.shadowBlur=0;
  (t.soulSigns??[]).forEach((g,i)=>drawSoulSign(ctx,(g.tx+.5)*S-camX,(g.ty+.5)*S-camY,state.gameTick,1-g.ticks/SINGULARITY_CHALLENGE.soulWarnTicks,g.golden,i*1.7,!!g.hollow,!!g.toxic));
  // Where a flung body will come down: a shadow that darkens and grows as it nears, inside pulsing green corners.
  for(const e of state.enemies){const lt=e.devourer?.landTicks;if(e.type!=='devourer'||!lt)continue;
    const q=1-lt/SINGULARITY_LAND_TICKS,x=e.x-camX,y=e.y-camY+S*.25;
    ctx.save();ctx.translate(x,y);ctx.scale(1,.45);ctx.globalAlpha=.15+.45*q;steppedDisc(ctx,0,0,S*(.2+.45*q),'#0a0412',5);ctx.restore();
    const c=S*(.75-.25*q),arm=6,on=.5+.5*Math.sin(state.gameTick*.5);ctx.globalAlpha=(.35+.5*q)*(.6+.4*on);
    for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]] as const){block(ctx,x+sx*c-(sx>0?arm:0),y-S*.25+sy*c*.6-(sy>0?2:0),arm,2,'#9dff8a');block(ctx,x+sx*c-(sx>0?2:0),y-S*.25+sy*c*.6-(sy>0?arm:0),2,arm,'#9dff8a');}
  }
  ctx.restore();
  if(t.jaw&&t.jaw.ticks>0)drawJawWarning(ctx,t.jaw,camX,camY,state.gameTick);
  if(!t.maws?.length)return;
  const tick=state.gameTick,SC=SINGULARITY_CHALLENGE;
  for(const m of t.maws) {
    const win=mawWindow(m),swell=win.open; // each Maw brightens and widens while its own window is open
    const x=m.x-camX,y=m.y-camY,fade=mawFade(m),g=mawGreen(m),c=(violet:string,green:string)=>mixHex(violet,green,g); // violet, turning green before a move
    // The drawn reach grows and shrinks smoothly with the window (the pull itself switches with the open state).
    const rTiles=SC.mawRadius+(SC.mawOpenRadius-SC.mawRadius)*swell,r=rTiles*S,set=reachTiles(state,m.x,m.y,r);
    const tone=(closed:string,open:string)=>mixHex(closed,open,swell);
    ctx.save();ctx.shadowBlur=0;
    drawReach(ctx,set,m.x,m.y,rTiles,camX,camY,tick,{alpha:fade*(.85+.15*swell),base:tone(c('#6a32a8','#1f7a45'),c('#8a4ae0','#2fae5e')),band:tone(c('#b07aff','#9dff8a'),c('#f0e4ff','#e8ffe0')),edge:tone(c('#c9a8ff','#c6ffb0'),c('#f0e4ff','#e8ffe0')),speed:.012+.02*swell});
    // About to open: the wide reach it will have blinks in, faster as the window nears.
    if(win.state==='warn'){
      const wide=reachTiles(state,m.x,m.y,SC.mawOpenRadius*S),blink=Math.floor(tick/Math.max(3,Math.round(10-win.p*7)))%2;
      ctx.save();tileOutlinePath(ctx,wide,camX,camY);ctx.lineJoin='miter';ctx.globalAlpha=fade*(.5+.5*win.p)*(blink?1:.35);ctx.strokeStyle=c('#f0e4ff','#e8ffe0');ctx.lineWidth=3;ctx.setLineDash([10,8]);ctx.lineDashOffset=tick;ctx.stroke();ctx.setLineDash([]);
      for(const k of wide){const tx=k%MAP_COLS,ty=Math.floor(k/MAP_COLS);ctx.globalAlpha=fade*(.06+.14*win.p)*(blink?1:.5);block(ctx,tx*S-camX+3,ty*S-camY+3,S-6,S-6,c('#b07aff','#9dff8a'));}
      ctx.restore();
    }
    // Three spiral arms of matter drifting inward, kept inside the reach.
    ctx.save();ctx.beginPath();for(const k of set)ctx.rect((k%MAP_COLS)*S-camX,Math.floor(k/MAP_COLS)*S-camY,S,S);ctx.clip();
    for(let arm=0;arm<3;arm++)for(let k=0;k<14;k++) {
      const life=wrap(tick*(.012+swell*.02)+k/14,1),d=r*(1-life),a=arm*Math.PI*2/3+life*Math.PI*2.4+tick*.01;
      ctx.globalAlpha=fade*Math.sin(life*Math.PI)*.75;block(ctx,Math.round((x+Math.cos(a)*d)/4)*4-3,Math.round((y+Math.sin(a)*d)/4)*4-3,k%3?5:7,k%3?5:7,k%4?c('#b07aff','#7dff8a'):c('#9dff8a','#e8ffe0'));
    }
    ctx.restore();
    const coreScale=1;
    // The event horizon: a dark halo, a blocky rounded black core and a bright photon ring.
    ctx.globalAlpha=fade*.6;voidDisc(ctx,x,y,S*.95*coreScale,c('#12081e','#08180e'));
    ctx.globalAlpha=fade;voidDisc(ctx,x,y,S*.6*(1-.1*swell)*coreScale,'#000000');
    const ring=.6+.4*Math.sin(tick*.08);
    for(const [lw,al,col] of [[8,.25,c('#b07aff','#7dff8a')],[3,.9,c('#f0e4ff','#e8ffe0')]] as const){ctx.globalAlpha=fade*al*(.7+.3*ring+swell*.3);ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();voidOutline(S*.62*(1-.1*swell)*coreScale).forEach(([px,py],k)=>k?ctx.lineTo(x+px,y+py):ctx.moveTo(x+px,y+py));ctx.closePath();ctx.stroke();}
    ctx.globalAlpha=fade*(.5+.4*ring);block(ctx,x-2,y-2,4,4,'#9dff8a');
    // Where it will move next: a faint hint, never mistaken for a Maw. A thin dashed green outline of its resting reach
    // and a small hollow ring at the centre, both fading in and pulsing a little faster as the move nears, with a few motes
    // drifting from the old spot to the new one. No fill and no black core.
    if(m.next&&m.ticks<SC.mawPreview) {
      const nx=(m.next.tx+.5)*S,ny=(m.next.ty+.5)*S,sx=nx-camX,sy=ny-camY,p=1-m.ticks/SC.mawPreview,ease=p*p*(3-2*p);
      const ghost=reachTiles(state,nx,ny,SC.mawRadius*S),beat=.5+.5*Math.sin(tick*(.06+.14*p));
      ctx.save();tileOutlinePath(ctx,ghost,camX,camY);ctx.lineJoin='miter';ctx.globalAlpha=(.12+.28*ease)*(.75+.25*beat);ctx.strokeStyle='#9dff8a';ctx.lineWidth=4;ctx.setLineDash([8,10]);ctx.lineDashOffset=-tick*.4;ctx.stroke();ctx.setLineDash([]);ctx.restore();
      ctx.globalAlpha=(.15+.35*ease)*(.6+.4*beat);ctx.strokeStyle='#9dff8a';ctx.lineWidth=5;ctx.beginPath();voidOutline(S*.3).forEach(([qx,qy],k)=>k?ctx.lineTo(sx+qx,sy+qy):ctx.moveTo(sx+qx,sy+qy));ctx.closePath();ctx.stroke();
      for(let k=0;k<3;k++){const f=wrap(tick*.012+k/3,1);ctx.globalAlpha=Math.sin(f*Math.PI)*(.1+.3*ease);block(ctx,x+(sx-x)*f-2,y+(sy-y)*f-Math.sin(f*Math.PI)*S*.6-2,4,4,'#9dff8a');}
    }
    ctx.restore();
  }
}

// A Lost Soul: a small pale wisp with a green heart, bobbing and trailing motes. Violet-tinged while dragged. A Golden
// Soul is the same wisp in gold with a bright heart and extra sparkles.
export function drawLostSoul(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,id:number,pulled:boolean,golden=false) {
  const bob=Math.round(Math.sin(tick*.08+id)*3),yy=y+bob,body=pulled?'#e8d8ff':golden?'#fff3c0':'#d8fff0',edge=pulled?'#b07aff':golden?'#ffbf3a':'#8fe8c4',heart=golden?'#ff9a1a':'#9dff8a';
  ctx.globalAlpha=.22+.08*Math.sin(tick*.1+id);steppedDisc(ctx,x,y+8,16,golden?'#ffd86a':'#9dff8a',4);
  for(let k=0;k<(golden?5:3);k++){const life=wrap(tick*.02+k/(golden?5:3)+id*.17,1);ctx.globalAlpha=(1-life)*.7;block(ctx,x-1+Math.round(Math.sin(life*6+id)*5),yy-14-life*16,3,3,k?body:heart);}
  // The body glows: a soft pulsing light in its own colour around the whole wisp, and a brighter glow on its heart.
  const pulse=.5+.5*Math.sin(tick*.12+id),glow=pulled?'#c9a8ff':golden?'#ffd86a':'#9dffb8';
  ctx.save();ctx.shadowColor=glow;ctx.shadowBlur=10+8*pulse;
  ctx.globalAlpha=.95;
  block(ctx,x-7,yy-6,14,12,edge);block(ctx,x-6,yy-9,12,16,edge);block(ctx,x-3,yy-12,6,4,edge);
  block(ctx,x-6,yy-5,12,10,body);block(ctx,x-5,yy-8,10,14,body);block(ctx,x-2,yy-11,4,4,body);
  const sway=Math.round(Math.sin(tick*.15+id)*2);block(ctx,x-5+sway,yy+7,3,3,body);block(ctx,x+2-sway,yy+7,3,3,body);block(ctx,x-1,yy+9,2,2,body);
  ctx.shadowBlur=0;block(ctx,x-4,yy-3,2,3,'#1c2a30');block(ctx,x+2,yy-3,2,3,'#1c2a30');
  ctx.shadowColor=heart;ctx.shadowBlur=8+6*pulse;ctx.globalAlpha=.7+.3*pulse;block(ctx,x-2,yy+1,4,4,heart);
  ctx.restore();
  if(golden)for(let k=0;k<2;k++){const a=tick*.07+k*Math.PI+id;ctx.globalAlpha=.6+.4*Math.sin(tick*.3+k);block(ctx,x+Math.cos(a)*13-1,yy+Math.sin(a)*13-1,3,3,'#fff8d0');}
}

// The Jaw is a small black hole core rising under you. Its fangs point inward from all four sides of the blocky core
// outline (the same rounded square as a Maw's horizon), so it reads as a mouth that will close on its centre.
function jawFangs(ctx:CanvasRenderingContext2D,cx:number,cy:number,r:number,alpha:number,color:string) {
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])for(const off of [-.5,0,.5]){
    const px=cx+dx*r+(dy?off*r:0),py=cy+dy*r+(dx?off*r:0),ix=-dx,iy=-dy; // on the rim, pointing at the centre
    ctx.globalAlpha=alpha;
    for(const [d,size] of [[0,12],[10,8],[17,4]] as const)block(ctx,Math.round(px+ix*d-size/2),Math.round(py+iy*d-size/2),size,size,color);
  }
}
// Warning: the dark core outline with a pulsing poison-green ring, its fangs creeping inward and blinking faster as the bite nears.
function drawJawWarning(ctx:CanvasRenderingContext2D,jaw:{tx:number;ty:number;ticks:number},camX:number,camY:number,tick:number) {
  const J=SINGULARITY_CHALLENGE.jaw,p=1-jaw.ticks/J.warn,cx=(jaw.tx+.5)*S-camX,cy=(jaw.ty+.5)*S-camY,R=(J.radius+.5)*S,blink=Math.floor(tick/Math.max(2,Math.round(8-6*p)))%2;
  ctx.save();ctx.shadowBlur=0;
  ctx.globalAlpha=.45+.35*p;voidDisc(ctx,cx,cy,R,'#0a0412');
  ctx.shadowColor='#7dff8a';ctx.shadowBlur=6;ctx.globalAlpha=(blink?.95:.45)*(.5+.5*p);ctx.strokeStyle='#7dff8a';ctx.lineWidth=3;
  ctx.beginPath();voidOutline(R-2).forEach(([x,y],k)=>k?ctx.lineTo(cx+x,cy+y):ctx.moveTo(cx+x,cy+y));ctx.closePath();ctx.stroke();ctx.shadowBlur=0;
  jawFangs(ctx,cx,cy,R*(1-.18*p)-8,.5+.45*p,'#efe4ff');
  ctx.restore();
}
// The bite: the core collapses to its centre from all four sides, its photon ring and fangs shrinking with it, then a
// flash at the centre (green if it caught you) and a few fragments kick out as it sinks.
function drawJawBite(ctx:CanvasRenderingContext2D,jaw:{tx:number;ty:number;snap:number;hit?:boolean},camX:number,camY:number) {
  const J=SINGULARITY_CHALLENGE.jaw,q=1-jaw.snap/J.snap,cx=(jaw.tx+.5)*S-camX,cy=(jaw.ty+.5)*S-camY,R=(J.radius+.5)*S;
  const close=Math.min(1,q/.2),ease=close*close,r=Math.max(4,R*(1-ease)),fade=q<.2?1:Math.max(0,1-(q-.2)/.8); // snaps shut in a fifth of the bite
  ctx.save();ctx.shadowBlur=0;
  if(close<1){
    ctx.globalAlpha=.9;voidDisc(ctx,cx,cy,r,'#000000');
    for(const [lw,al,col] of [[8,.3,'#b07aff'],[3,.95,'#f0e4ff']] as const){ctx.globalAlpha=al;ctx.strokeStyle=col;ctx.lineWidth=lw;ctx.beginPath();voidOutline(r).forEach(([x,y],k)=>k?ctx.lineTo(cx+x,cy+y):ctx.moveTo(cx+x,cy+y));ctx.closePath();ctx.stroke();}
    jawFangs(ctx,cx,cy,Math.max(6,r-6),.95,'#efe4ff');
  }else{
    const f=fade;ctx.globalAlpha=f*.85;voidDisc(ctx,cx,cy,S*(.35+.5*(1-f)),jaw.hit?'#7dff8a':'#f0e4ff');
    ctx.globalAlpha=f;voidDisc(ctx,cx,cy,S*.22*f,'#000000');
    for(let k=0;k<8;k++){const a=k*Math.PI/4,d=S*(.5+(1-f)*1.5);ctx.globalAlpha=f*.85;block(ctx,cx+Math.cos(a)*d-3,cy+Math.sin(a)*d-3,6,6,jaw.hit?'#c6ffb0':k%2?'#9dff8a':'#b07aff');}
  }
  ctx.restore();
}

// A toxic gas cloud, in the wall pipes' smoke style: layered soft green squares, each with a fainter shade halo, slowly
// swelling, turning and drifting around the cloud's centre, so the whole cloud reads as a living puff.
function drawGasCloud(ctx:CanvasRenderingContext2D,g:{x:number;y:number;seed:number;ticks:number;max:number},camX:number,camY:number,tick:number) {
  const fade=gasFade(g as never),R=((g as {r?:number}).r??SINGULARITY_CHALLENGE.gas.radius)*S,x=g.x-camX,y=g.y-camY;
  if(fade<=0)return;
  ctx.save();ctx.shadowBlur=0;
  for(let k=0;k<22;k++){
    const a=hash(k,g.seed,61)*Math.PI*2+tick*.004*(k%2?1:-1),d=R*(.15+.7*hash(k,g.seed,62)),life=wrap(tick*.006+hash(k,g.seed,63),1);
    const size=Math.round(R*(.35+.35*hash(k,g.seed,64))*(.8+.3*Math.sin(life*Math.PI))),sx=x+Math.cos(a)*d,sy=y+Math.sin(a)*d*.8-life*6;
    ctx.globalAlpha=fade*(.12+.1*Math.sin(life*Math.PI));block(ctx,sx-size/2,sy-size/2,size,size,k%3?SINGULARITY_GAS.body:SINGULARITY_GAS.light);
    ctx.globalAlpha*=.45;block(ctx,sx-size*.8,sy-size*.55,size*1.6,size*1.1,SINGULARITY_GAS.shade);
  }
  for(let k=0;k<10;k++){const life=wrap(tick*.01+k/10+g.seed,1),a=k*2.4+g.seed,d=R*(.3+.6*life);ctx.globalAlpha=fade*Math.sin(life*Math.PI)*.5;block(ctx,x+Math.cos(a)*d-2,y+Math.sin(a)*d-life*14-2,4,4,SINGULARITY_GAS.light);}
  ctx.restore();
}

// Soulless: one chunky bone shell, empty square sockets and two short feet. No soul core or spectral effects.
// The Contaminated Soulless: the same bone Soulless, with a few parts soaked in poison-green toxin (the top-left of the skull, a
// patch on the right cheek dripping down, and the left foot), and gas rising from each soaked part in the wall pipes'
// smoke style.
export function drawToxicSoulless(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,id:number,hurt=false) {
  drawSoulless(ctx,x,y,tick,id,hurt);
  const step=Math.round(Math.sin(tick*.16+id)),X=Math.round(x),Y=Math.round(y);
  ctx.save();ctx.shadowBlur=0;ctx.globalAlpha=hurt?.5:.92;
  const wet='#5ad86a',bright=SINGULARITY_GAS.light;
  block(ctx,X-20,Y-18,11,7,wet);block(ctx,X-16,Y-22,6,4,wet);block(ctx,X-18,Y-11,4,3,wet);block(ctx,X-17,Y-17,3,2,bright); // skull top-left
  block(ctx,X+12,Y-6,8,9,wet);block(ctx,X+15,Y+3,4,6,wet);block(ctx,X+16,Y+9,2,3,wet);block(ctx,X+14,Y-5,2,2,bright); // right cheek, dripping
  block(ctx,X-12,Y+18+step,8,3,wet);block(ctx,X-11,Y+21+step,3,2,bright); // left foot
  for(const [sx,sy,seed] of [[-15,-20,0],[16,-6,1.7],[-8,19+step,3.1]] as const)for(let k=0;k<3;k++){
    const life=wrap(tick*.014+k/3+seed*.21+id*.07,1),size=Math.round(4+life*9);
    ctx.globalAlpha=Math.sin(life*Math.PI)*.4;block(ctx,X+sx+Math.sin(life*5+seed+k)*4-size/2,Y+sy-life*22-size/2,size,size,k%2?SINGULARITY_GAS.body:SINGULARITY_GAS.light);
  }
  ctx.restore();
}
export function drawSoulless(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,id:number,hurt=false) {
  const step=Math.round(Math.sin(tick*.16+id)),bone=hurt?'#fff5e4':'#c5bcae';
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;ctx.globalAlpha=1;
  block(ctx,-16,-22,32,4,bone);block(ctx,-20,-18,40,29,bone);block(ctx,-13,11,26,7,bone);
  block(ctx,-17,-15,34,23,'#827b74');
  block(ctx,-13,-12,10,10,'#16151c');block(ctx,3,-12,10,10,'#16151c');
  block(ctx,-2,1,4,5,'#16151c');block(ctx,-9,11,18,4,'#16151c');block(ctx,-4,11,3,3,bone);block(ctx,3,11,3,3,bone);
  block(ctx,-12,18+step,8,6,bone);block(ctx,4,18-step,8,6,bone);
  ctx.restore();
}

/** Above the units: Soul Lure, implosions where the Maw eats and gorged bodies exploding. */
export function drawSingularityMawEffects(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,camX:number,camY:number) {
  drawSwarmConvergence(ctx,state,camX,camY);
  const t=state.trial?.devourer;if(!t)return;
  const tick=state.gameTick,SC=SINGULARITY_CHALLENGE;
  ctx.save();ctx.shadowBlur=0;
  // A body dropping out of the sky trails a green and violet streak above it.
  for(const e of state.enemies){const lift=e.type==='devourer'?singularityLift(e):0;if(!lift||lift===Infinity)continue;
    const x=e.x-camX,y=e.y-camY-lift;
    for(let k=1;k<8;k++){ctx.globalAlpha=(1-k/8)*.8;const w=k<3?8:6;block(ctx,x-w/2,y-S*.3-k*9,w,8,k%2?'#9dff8a':'#b07aff');}
  }
  ctx.globalAlpha=1;
  // Physical bone lunges: a short floor warning, a block trail and one close swipe. No beam.
  for(const e of state.enemies){
    const a=e.boneLunge;if(e.type!=='soulless'||!a||e.hp<=0)continue;
    const x=e.x-camX,y=e.y-camY;ctx.save();
    if(a.phase==='warning'){
      const progress=1-a.ticks/SOULLESS_LUNGE.warningTicks;
      for(let tile=1;tile<=SOULLESS_LUNGE.tiles;tile++){
        const tx=e.tileX+a.dx*tile,ty=e.tileY+a.dy*tile;
        if((state.map[ty]?.[tx]??T_WALL)===T_WALL)break;
        const px=(tx+.5)*S-camX,py=(ty+.5)*S-camY;
        ctx.globalAlpha=.08+.12*progress;block(ctx,px-S/2+2,py-S/2+2,S-4,S-4,'#c5bcae');
        ctx.globalAlpha=.45+.5*progress;ctx.strokeStyle='#eee4d2';ctx.lineWidth=3;ctx.strokeRect(px-S/2+3,py-S/2+3,S-6,S-6);
        block(ctx,px-6,py-3,12,6,'#eee4d2');
      }
    } else if(a.phase==='dash'){
      for(let k=1;k<=2;k++){ctx.globalAlpha=.3/k;block(ctx,x-a.dx*k*14-7,y-a.dy*k*14-7,14,14,'#c5bcae');}
    } else {
      const age=SOULLESS_LUNGE.recoverTicks-a.ticks;
      if(age<SOULLESS_LUNGE.swipeTicks){
        const progress=age/SOULLESS_LUNGE.swipeTicks;ctx.globalAlpha=(1-progress)*.9;
        ctx.translate(x+a.dx*22,y+a.dy*22);ctx.rotate(Math.atan2(a.dy,a.dx)-.65+progress*1.3);
        block(ctx,-3,-19,6,38,'#c5bcae');block(ctx,-1,-15,2,30,'#fff5e4');
      }
    }
    ctx.restore();
  }
  if(t.jaw&&t.jaw.ticks<=0)drawJawBite(ctx,t.jaw,camX,camY);
  for(const g of t.gas??[])drawGasCloud(ctx,g,camX,camY,tick);
  const CY='#7fe8ff',PALE='#e6fbff';
  const at=(id:number)=>state.enemies.find(e=>e.id===id&&e.hp>0);
  // The body the hook would catch: cyan corner brackets that breathe, and a faint dashed line to it.
  const aim=hookTarget(state as GameState);
  if(aim){
    const x=aim.x-camX,y=aim.y-camY,r=S*.75+Math.sin(tick*.15)*2;
    ctx.globalAlpha=.35;ctx.strokeStyle=CY;ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.lineDashOffset=-tick;ctx.beginPath();ctx.moveTo(state.playerX-camX,state.playerY-camY);ctx.lineTo(x,y);ctx.stroke();ctx.setLineDash([]);
    ctx.globalAlpha=.85;ctx.strokeStyle=CY;ctx.lineWidth=3;
    for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ctx.beginPath();ctx.moveTo(x+dx*(r-9),y+dy*r);ctx.lineTo(x+dx*r,y+dy*r);ctx.lineTo(x+dx*r,y+dy*(r-9));ctx.stroke();}
  }
  // The tether while you hold a body: a three-band cyan chain of links from you to it, tightening as the hold runs out.
  const held=t.hook&&at(t.hook.id);
  if(held){
    const x1=state.playerX-camX,y1=state.playerY-camY,x2=held.x-camX,y2=held.y-camY,strain=t.hook!.ticks/SC.hook.maxTicks,len=Math.hypot(x2-x1,y2-y1),n=Math.max(2,Math.round(len/14));
    ctx.save();ctx.lineCap='square';ctx.shadowColor=CY;
    for(const [w,col,a,g] of [[12,CY,.35,6],[5,'#bff6ff',.85,3],[2,'#ffffff',1,0]] as const){ctx.globalAlpha=a;ctx.shadowBlur=g;ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
    ctx.shadowBlur=0;for(let k=1;k<n;k++){const p=k/n;ctx.globalAlpha=.9;block(ctx,Math.round(x1+(x2-x1)*p)-3,Math.round(y1+(y2-y1)*p)-3,6,6,k%2?PALE:CY);}
    const r=S*.7;ctx.globalAlpha=.9;ctx.strokeStyle=strain>.75&&Math.floor(tick/3)%2?'#ffffff':CY;ctx.lineWidth=3;ctx.strokeRect(Math.round(x2-r),Math.round(y2-r),Math.round(r*2),Math.round(r*2));
    ctx.restore();
  }
  // Flung bodies: a cyan streak trailing behind each, the way it flies.
  for(const f of t.flings??[]){const e=at(f.id);if(!e)continue;const x=e.x-camX,y=e.y-camY;
    for(let k=1;k<=4;k++){ctx.globalAlpha=.55-k*.11;block(ctx,x-f.dx*k*12-(12-k*2)/2,y-f.dy*k*12-(12-k*2)/2,12-k*2,12-k*2,k%2?PALE:CY);}
    ctx.save();ctx.shadowColor=CY;ctx.shadowBlur=6;ctx.globalAlpha=.6;ctx.strokeStyle=CY;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(x-f.dx*S*1.4,y-f.dy*S*1.4);ctx.lineTo(x,y);ctx.stroke();ctx.restore();}
  // Slammed or wall-hit bodies are dazed: stars circle over them, blinking out as the stun ends.
  for(const e of state.enemies){const st=e.devourer?.stunTicks??0;if(e.type!=='devourer'||st<=0||e.hp<=0||e.devourer?.landTicks)continue;
    if(st<30&&Math.floor(st/4)%2)continue;
    const x=e.x-camX,y=e.y-camY-S*1.5;ctx.globalAlpha=.35;ctx.strokeStyle='#ffe680';ctx.lineWidth=2;ctx.strokeRect(Math.round(x-S*.5),Math.round(y-S*.12),Math.round(S),Math.round(S*.24));
    for(let k=0;k<3;k++){const a=tick*.14+k*Math.PI*2/3,sx=x+Math.cos(a)*S*.5,sy=y+Math.sin(a)*S*.12,front=Math.sin(a)>0;
      ctx.globalAlpha=front?1:.55;block(ctx,sx-2,sy-8,4,16,'#ffe680');block(ctx,sx-8,sy-2,16,4,'#ffe680');block(ctx,sx-3,sy-3,6,6,'#ffffff');}
  }
  ctx.globalAlpha=1;
  // Hook impacts: a latch flash, a slam between two bodies, a wall hit.
  for(const f of t.hookFx??[]){
    if(f.kind==='slam'){drawHookSlam(ctx,f.x-camX,f.y-camY,1-f.ticks/40,f.x+f.y);continue;}
    const max=f.kind==='wall'?22:20,p=1-f.ticks/max,x=f.x-camX,y=f.y-camY,r=S*.9*(.3+p);
    ctx.globalAlpha=(1-p)*.85;ctx.strokeStyle=CY;ctx.lineWidth=3;ctx.strokeRect(Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));
    if(f.kind!=='latch')for(let k=0;k<8;k++){const an=k*Math.PI/4,d=r*1.1;ctx.globalAlpha=(1-p)*.9;block(ctx,x+Math.cos(an)*d-3,y+Math.sin(an)*d-3,6,6,k%2?'#9dff8a':PALE);}}
  for(const w of t.swallows??[]) {
    const max=w.big?40:24,p=1-w.ticks/max,x=w.x-camX,y=w.y-camY,r=(w.big?90:50)*(1-p);
    ctx.globalAlpha=(1-p)*.9;ctx.strokeStyle=w.big?'#9dff8a':'#e8d8ff';ctx.lineWidth=w.big?6:3;
    ctx.beginPath();voidOutline(Math.max(4,r)).forEach(([qx,qy],k)=>k?ctx.lineTo(x+qx,y+qy):ctx.moveTo(x+qx,y+qy));ctx.closePath();ctx.stroke();
    // Staggered square fragments accelerate inward, then the throat snaps shut and rebounds.
    const pull=Math.min(1,p/.65),ease=pull*pull,reach=w.big?S*2.2:S*1.2;
    for(let k=0;k<8;k++){
      const an=k*Math.PI/4+p*.65,d=reach*(1-ease),sz=(k%2?8:12)*(1-pull*.75);
      ctx.save();ctx.translate(Math.round(x+Math.cos(an)*d),Math.round(y+Math.sin(an)*d));ctx.rotate(an);
      ctx.globalAlpha=Math.sin(Math.PI*pull)*.85;block(ctx,-sz,-sz/2,sz*2,sz,k%2?'#b07aff':'#9dff8a');ctx.restore();
    }
    // Keep a shrinking impression of the swallowed body, drawn toward the actual mouth.
    if(w.fromX!==undefined&&w.fromY!==undefined&&p<.6){
      const q=p/.6,sz=(w.size??S*.7)*(1-q),bx=w.fromX-camX+(x-(w.fromX-camX))*q*q,by=w.fromY-camY+(y-(w.fromY-camY))*q*q;
      ctx.save();ctx.translate(Math.round(bx),Math.round(by));ctx.rotate(q*Math.PI*.7);ctx.globalAlpha=(1-q)*.9;
      block(ctx,-sz/2,-sz/2,sz,sz,w.big?'#79ff88':'#d8eacb');block(ctx,-sz*.27,-sz*.27,sz*.54,sz*.54,'#17221d');ctx.restore();
    }
    const snap=Math.max(0,1-Math.abs(p-.65)/.18);
    if(snap>0){ctx.globalAlpha=snap*.85;ctx.strokeStyle='#efffe8';ctx.lineWidth=w.big?5:3;const jaw=S*(.3+snap*.35);ctx.strokeRect(Math.round(x-jaw),Math.round(y-jaw*.4),Math.round(jaw*2),Math.round(jaw*.8));}
    if(p>.65){const q=(p-.65)/.35;ctx.globalAlpha=(1-q)*.6;ctx.strokeStyle='#b07aff';ctx.lineWidth=3;const r=S*(.4+q*1.2);ctx.strokeRect(Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));}
  }
  // A gorged body bursting: a flash, two blocky shockwaves, flying debris and smoke, and a green comet arcing to
  // wherever each copy was flung.
  for(const b of t.bursts??[]) {
    const p=1-b.ticks/48,ease=1-(1-p)**3,x=b.x-camX,y=b.y-camY;
    if(p<.2){ctx.globalAlpha=(.2-p)/.2*.85;voidDisc(ctx,x,y,S*(1.2+2*p),'#f0ffe8');}
    for(const [lag,col,lw] of [[0,'#9dff8a',10],[.12,'#b07aff',6]] as const){const q=Math.max(0,ease-lag);if(q<=0)continue;
      ctx.globalAlpha=(1-p)*.85;ctx.strokeStyle=col;ctx.lineWidth=lw*(1-p)+1;ctx.beginPath();voidOutline(S*(.6+3.6*q)).forEach(([qx,qy],k)=>k?ctx.lineTo(x+qx,y+qy):ctx.moveTo(x+qx,y+qy));ctx.closePath();ctx.stroke();}
    for(let k=0;k<22;k++){const an=hash(k,b.x,7)*Math.PI*2,d=S*(1+hash(k,b.y,8)*3)*ease,sz=k%3?6:10;
      ctx.globalAlpha=(1-p)*.9;block(ctx,x+Math.cos(an)*d-sz/2,y+Math.sin(an)*d-sz/2+p*p*20,sz,sz,['#b07aff','#9dff8a','#2a1040','#e8d8ff'][k%4]);}
    for(let k=0;k<6;k++){const an=k*Math.PI/3+hash(k,b.x,9),d=S*1.2*ease;ctx.globalAlpha=(1-p)*.35;steppedDisc(ctx,x+Math.cos(an)*d,y+Math.sin(an)*d-p*14,S*.5*(.6+p),'#2a1040',6);}
    // Each comet climbs high over the map to a point above its landing spot; the body then drops from there.
    for(const [tx,ty0] of b.to){const f=Math.min(1,p*1.4),ty=ty0-SINGULARITY_FALL_HEIGHT*S;if(f>=1)continue;
      for(let k=0;k<7;k++){const g=Math.max(0,f-k*.035),hx=x+(tx-camX-x)*g,hy=y+(ty-camY-y)*g-Math.sin(g*Math.PI)*S*2.5;
        ctx.globalAlpha=1-k/7;block(ctx,hx-(k?3:5),hy-(k?3:5),k?6:10,k?6:10,k?'#b07aff':'#9dff8a');}
    }
  }
  // A jumping body coming down: a white-green flash, a scorched blocky crater, a ground shockwave rolling out low and
  // wide, and dust and debris kicked up and falling back.
  for(const l of t.lands??[]) {
    const p=1-l.ticks/30,ease=1-(1-p)**3,x=l.x-camX,y=l.y-camY+S*.25;
    ctx.globalAlpha=(1-p)*.55;steppedDisc(ctx,x,y,S*.8,'#120820',5);
    if(p<.25){ctx.globalAlpha=(.25-p)/.25*.9;voidDisc(ctx,x,y-S*.3,S*(.7+p*2),'#f0ffe8');}
    for(const [lag,col,lw] of [[0,'#9dff8a',8],[.15,'#b07aff',4]] as const){const q=Math.max(0,ease-lag);if(q<=0)continue;
      ctx.globalAlpha=(1-p)*.9;ctx.strokeStyle=col;ctx.lineWidth=lw*(1-p)+1;ctx.strokeRect(x-S*(.5+2*q),y-S*(.25+.9*q),S*(1+4*q),S*(.5+1.8*q));}
    for(let k=0;k<16;k++){const an=hash(k,l.x,11)*Math.PI*2,d=S*(.5+hash(k,l.y,12)*1.8)*ease,up=Math.sin(p*Math.PI)*S*(.4+hash(k,l.x,13)*.8),sz=k%3?6:9;
      ctx.globalAlpha=(1-p)*.9;block(ctx,x+Math.cos(an)*d-sz/2,y+Math.sin(an)*d*.5-up-sz/2,sz,sz,['#9dff8a','#2a1040','#b07aff','#e8d8ff'][k%4]);}
  }
  ctx.restore();
}

/** Two bodies flung into each other: a white flash, a jagged impact star, two shock squares (white, then green), and
 * sparks and chunks bursting out and falling. p runs 0–1 over 40 ticks. */
function drawHookSlam(ctx:CanvasRenderingContext2D,x:number,y:number,p:number,seed:number){
  const ease=1-(1-p)**3;
  if(p<.18){ctx.globalAlpha=(.18-p)/.18;voidDisc(ctx,x,y,S*(1+p*4),'#ffffff');}
  if(p<.35){const k=1-p/.35;ctx.globalAlpha=k;for(let a=0;a<8;a++){const an=a*Math.PI/4+.2,len=S*(a%2?1:1.8)*(.6+ease);ctx.save();ctx.translate(x,y);ctx.rotate(an);block(ctx,0,-3,len,6,a%2?'#9dff8a':'#ffffff');ctx.restore();}}
  for(const [lag,col,lw,size] of [[0,'#ffffff',8,2.4],[.12,'#9dff8a',5,3.2]] as const){const q=Math.max(0,ease-lag);if(q<=0)continue;const r=S*(.4+size*q);
    ctx.globalAlpha=(1-p)*.9;ctx.strokeStyle=col;ctx.lineWidth=lw*(1-p)+1;ctx.strokeRect(Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2));}
  for(let k=0;k<18;k++){const an=hash(k,seed,21)*Math.PI*2,d=S*(.4+hash(k,seed,22)*2.6)*ease,sz=k%3?6:10;
    ctx.globalAlpha=(1-p)*.95;block(ctx,x+Math.cos(an)*d-sz/2,y+Math.sin(an)*d-sz/2+p*p*S*.8,sz,sz,['#ffffff','#9dff8a','#ffe680','#b07aff'][k%4]);}
  ctx.globalAlpha=1;
}
/** Behind the station: while a Maw sucks, the void is dragged toward it (off the left side). Speed lines race across
 * the backdrop in its direction, the far side brightens and the near side darkens. Drawn under the floor and units. */
/** Where the backdrop black hole sits on screen (it drifts a little with the camera, as parallax). */
export const singularityHoleCentre = (w: number, h: number, camX: number, camY: number): [number, number] => [w * .1 - camX * .018, h * .47 - camY * .02];
export function drawSingularitySuction(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number, camX: number, camY: number) {
  if (state.trial?.boss !== 'devourer') return;
  const tick = state.gameTick;
  ctx.save(); ctx.shadowBlur = 0;
  const swell = singularityOpenness(state); // the backdrop drags toward whichever Maw is open
  if (swell > 0) {
    const [mx, my] = singularityHoleCentre(w, h, camX, camY); // centred on the backdrop black hole
    // A deep violet-to-black drag across the whole void, darkest at the Maw.
    const pull = ctx.createRadialGradient(mx, my, 0, mx, my, Math.hypot(w, h));
    pull.addColorStop(0, '#030008'); pull.addColorStop(.45, '#3a1460aa'); pull.addColorStop(1, '#b07aff22');
    ctx.globalAlpha = swell * .9; ctx.fillStyle = pull; ctx.fillRect(0, 0, w, h);
    // A huge vortex at the Maw's side: stepped rings spinning and shrinking inward around a black core.
    for (let r = 0; r < 9; r++) {
      const q = wrap(tick * .012 + r / 9, 1), rad = Math.max(w, h) * .75 * (1 - q), turn = tick * .02 + r * .7;
      ctx.save(); ctx.translate(mx, my); ctx.rotate(turn); ctx.globalAlpha = swell * Math.sin(q * Math.PI) * .5;
      ctx.strokeStyle = r % 3 === 0 ? '#9dff8a' : r % 2 ? '#b07aff' : '#e8d8ff'; ctx.lineWidth = 3 + (1 - q) * 8;
      ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 1.35); ctx.stroke(); ctx.restore();
    }
    ctx.globalAlpha = swell; steppedDisc(ctx, mx, my, Math.min(w, h) * .16 * swell, '#000000', 6);
    // Speed lines and torn debris racing into it, curving as they go.
    for (let i = 0; i < 110; i++) {
      const y0 = hash(i, 3, 61) * h, t = wrap(tick * (.026 + hash(i, 4, 61) * .035) + hash(i, 5, 61), 1);
      const x = w * 1.15 + (mx - w * 1.15) * t, y = y0 + (my - y0) * t * t, ang = Math.atan2(my - y, mx - x), len = (110 + hash(i, 6, 61) * 280) * swell * (.4 + t);
      ctx.globalAlpha = swell * Math.sin(t * Math.PI) * (i % 4 ? .55 : .9); ctx.strokeStyle = i % 5 ? '#d8c8ff' : '#9dff8a'; ctx.lineWidth = i % 3 ? 3 : 5;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(ang) * len, y - Math.sin(ang) * len); ctx.stroke();
      if (i % 4 === 0) { const sz = 6 + (i % 3) * 4; ctx.save(); ctx.translate(x, y); ctx.rotate(tick * .2 + i); block(ctx, -sz / 2, -sz / 2, sz, sz, i % 8 ? '#2a1040' : '#b07aff'); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

export function drawSingularityAtmosphere(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number) {
  if (state.trial?.boss !== 'devourer') return;
  const tick = state.gameTick, pulse = .5 + .5 * Math.sin(tick * .023);
  const convergence=state.trial?.devourer?.convergence;
  if(convergence){
    ctx.save();const blast=convergence.stage==='blast',p=blast?1-convergence.ticks/SINGULARITY_CHALLENGE.convergence.blastTicks:0;
    ctx.globalAlpha=blast?Math.max(0,1-p*5)*.26:.025;
    ctx.fillStyle=blast?'#eaffc8':'#b07aff';ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=blast?(1-p)*.6:.25;ctx.strokeStyle=blast?'#caff9c':'#b07aff';ctx.lineWidth=blast?8*(1-p):3;ctx.strokeRect(3,3,w-6,h-6);ctx.restore();
  }

  ctx.save(); ctx.shadowBlur = 0;
  // Inside toxic gas: a strong green tint and many big drifting smoke squares make it hard to see, thicker the deeper
  // you are.
  const gas = gasDepth(state, state.playerX, state.playerY);
  if (gas > 0) {
    ctx.globalAlpha = .3 * gas; block(ctx, 0, 0, w, h, SINGULARITY_GAS.shade);
    for (let k = 0; k < 24; k++) {
      const life = wrap(tick * .003 + hash(k, 3, 71), 1), size = Math.round((.2 + .16 * hash(k, 4, 71)) * Math.max(w, h));
      const sx = (hash(k, 5, 71) * 1.2 - .1) * w + Math.sin(tick * .006 + k) * 30, sy = (hash(k, 6, 71) * 1.2 - .1) * h - life * 40;
      ctx.globalAlpha = gas * (.22 + .2 * Math.sin(life * Math.PI)); block(ctx, sx - size / 2, sy - size / 2, size, size, k % 3 ? SINGULARITY_GAS.body : SINGULARITY_GAS.light);
      ctx.globalAlpha *= .5; block(ctx, sx - size * .75, sy - size * .5, size * 1.5, size, SINGULARITY_GAS.shade);
    }
  }
  // The void presses at the viewport edges, leaving the combat centre clear.
  for (let side = 0; side < 4; side++) {
    ctx.save(); ctx.translate(w / 2, h / 2); ctx.rotate(side * Math.PI / 2);
    const width = side % 2 ? h : w, height = side % 2 ? w : h;
    const shade = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 + Math.min(100, height * .16));
    shade.addColorStop(0, '#07020db0'); shade.addColorStop(.4, '#24102a38'); shade.addColorStop(1, '#07020d00');
    ctx.globalAlpha = .55 + pulse * .12; ctx.fillStyle = shade; ctx.fillRect(-width / 2, -height / 2, width, Math.min(100, height * .16));
    ctx.restore();
  }
  // Ash and elongated remnants pull toward the offscreen maw, never outward like an explosion.
  for (let i = 0; i < 30; i++) {
    const life = wrap(tick * (.0017 + i % 3 * .0003) + hash(i, 1, 95), 1), pull = life * life;
    const sx = hash(i, 2, 95) * w * 1.3, sy = hash(i, 3, 95) * h;
    const x = sx + (-w * .15 - sx) * pull, y = sy + (h * .48 - sy) * pull;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(h * .48 - sy, -w * .15 - sx));
    ctx.globalAlpha = Math.sin(life * Math.PI) * .28;
    block(ctx, 0, 0, 3 + life * 10, i % 6 ? 1 : 2, i % 6 ? '#b8a0bd' : '#a1c58e');
    ctx.restore();
  }
  ctx.restore();
}

const singularity: WorldTheme = {
  id: 'singularity', name: "THE SINGULARITY · DEVOURER'S MAW",
  colors: ['#a77bff', '#7dff8a', '#e06bf0', '#d0ff6a'], minimap: '#08040e',
  backdrop(ctx, w, h, camX, camY, tick) {
    ctx.save(); block(ctx, 0, 0, w, h, '#030209');
    const [bx, by] = singularityHoleCentre(w, h, camX, camY), maw = Math.min(w * .22, h * .33);
    // A gravity gulp each time a Maw opens (in the challenge; elsewhere every 45 seconds, none before the first). Every
    // envelope starts and ends at zero, and the disc's extra spin accumulates, so nothing snaps when a cycle ends.
    const devour = gulpSync?.devour ?? singularityGulpPhase(tick), gulps = gulpSync?.count ?? Math.floor(tick / SINGULARITY_GULP_TICKS), gulp = devour < .3 ? devour / .3 : 0;
    const swell = devour < .45 ? Math.sin(devour / .45 * Math.PI) : 0;
    const flashT = (devour - .2) / .32, flash = flashT > 0 && flashT < 1 ? Math.sin(flashT * Math.PI) ** 2 : 0;
    // The core squeezes in as the maw sucks (over the first ~3s of the gulp), then springs back past its size and settles.
    const sq = devour < .3 ? Math.sin(devour / .3 * Math.PI / 2) : devour < .5 ? Math.cos((devour - .3) / .2 * Math.PI / 2) : 0;
    const spring = devour >= .3 && devour < .6 ? Math.sin((devour - .3) / .3 * Math.PI) * .07 : 0;
    const squeeze = 1 - .22 * sq + spring;
    const ease0 = (v: number) => v * v * (3 - 2 * v);
    // Everything flowing inward surges while the maw sucks: extra progress builds over each gulp and is kept.
    const inward = gulps + ease0(Math.min(1, devour / .4));
    const ease = (v: number) => v * v * (3 - 2 * v), spinBoost = (gulps + ease(Math.min(1, devour / .45))) * .9;
    // A purple tint deepens with distance from the core: none until about the middle of the
    // view, then growing stronger toward the far edge.
    { const tint = ctx.createRadialGradient(bx, by, Math.max(maw * 1.2, w * .5 - bx), bx, by, Math.hypot(w - bx, h));
      tint.addColorStop(0, '#3a1a5a00'); tint.addColorStop(.45, '#3a1a5a88'); tint.addColorStop(1, '#4a2272dd');
      ctx.globalAlpha = 1; ctx.fillStyle = tint; ctx.fillRect(0, 0, w, h); }
    // Distant stars are lensed: near the maw they smear into arcs that bend around it.
    for (let i = 0; i < 90; i++) {
      const sx = hash(i, 1, 41) * w * 1.2, sy = hash(i, 2, 41) * h, dx = sx - bx, dy = sy - by, d = Math.hypot(dx, dy) || 1;
      const pull = Math.min(1, (maw * 2.6) / d), a = Math.atan2(dy, dx), arc = pull * pull * (.9 + swell * .8); // stars bend harder as it sucks
      ctx.globalAlpha = (.15 + .35 * hash(i, 3, 41)) * (.6 + .4 * Math.sin(tick * .02 + i));
      if (pull < .8) { block(ctx, sx, sy, i % 7 ? 2 : 3, i % 7 ? 2 : 3, i % 9 ? '#cdbfe0' : '#b8f0a0'); continue; }
      ctx.strokeStyle = i % 9 ? '#cdbfe0' : '#b8f0a0'; ctx.lineWidth = i % 7 ? 1 : 2;
      ctx.beginPath(); ctx.arc(bx, by, d, a - arc * .5 - .004, a + arc * .5 + .004); ctx.stroke();
    }
    // The accretion disc: a vast tilted ring of violet, orchid and poison-green light.
    // The approaching side blazes brighter. Its far half passes behind the maw.
    const disc = (front: boolean) => {
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-.24);
      for (let band = 0; band < 4; band++) {
        const rx = maw * (1.55 + band * .42) * (1 - .2 * sq + spring * 1.2), ry = rx * (.26 - .05 * sq), n = 70 + band * 14, // the disc tightens and flattens as it is sucked in
           spin = tick * (.006 - band * .0011) + spinBoost * (1 - band * .15);
        for (let k = 0; k < n; k++) {
          const t = k / n * Math.PI * 2 + spin, sinT = Math.sin(t); if (front ? sinT < 0 : sinT >= 0) continue;
          const beam = .45 + .55 * Math.max(0, Math.cos(t)), flick = .75 + .25 * Math.sin(tick * .09 + k * 2.7 + band);
          ctx.globalAlpha = (band === 0 ? 1 : .8 - band * .12) * beam * flick;
          const col = band === 0 ? (k % 5 ? '#f0e0ff' : '#d0ff6a') : band === 1 ? (k % 4 ? '#c88cff' : '#7dff8a') : band === 2 ? '#a050d0' : '#5a2a80';
          const len = 10 + band * 6 + beam * 14;
          block(ctx, Math.cos(t) * rx - len / 2, sinT * ry - 2, len, band < 2 ? 5 : 7, col);
          if (band < 2) { ctx.globalAlpha *= .25; block(ctx, Math.cos(t) * rx - len / 2 - 6, sinT * ry - 8, len + 12, 17, col); }
        }
      }
      ctx.restore();
    };
    disc(false);
    // Vast broken structures converge on a colossal square abyss. Whole solid arms
    // rotate as units; their right-angle joints never become pixel staircases.
    for (let arm = 0; arm < 7; arm++) {
      // The whole spoke set turns slowly into the maw, quickening as it gulps.
      ctx.save(); ctx.translate(bx, by); ctx.rotate(arm * Math.PI * 2 / 7 + tick * .0009 + .035 * Math.sin(tick * .004) + swell * .08);
      ctx.scale(1 - .16 * sq + spring, 1 - .16 * sq + spring); // the arms are drawn in toward the core, then spring back
      const points = [[170,0],[290,0],[290,-70],[460,-70],[460,-122],[750,-122]];
      for (const [width, color] of [[66,'#161020'],[42,'#261833'],[4,'#60426c']] as const) {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = width === 4 ? .42 + .3 * Math.max(0, Math.sin(tick * .04 + arm * 1.3)) : 1;
        ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
      }
      // Energy pulses race inward along each arm toward the maw.
      const segs = points.slice(1).map((p, k) => [points[k], p, Math.hypot(p[0] - points[k][0], p[1] - points[k][1])] as const), total = segs.reduce((s, q) => s + q[2], 0);
      for (let p = 0; p < 3; p++) {
        let d = total * (1 - wrap(tick * .006 + inward * 1.2 + p / 3 + arm * .13, 1));
        for (const [[x1, y1], [x2, y2], len] of segs) {
          if (d > len) { d -= len; continue; }
          const u = d / len, px = x1 + (x2 - x1) * u, py = y1 + (y2 - y1) * u;
          ctx.globalAlpha = .55; block(ctx, px - 7, py - 7, 14, 14, arm % 2 ? '#b07aff' : '#9dff8a');
          ctx.globalAlpha = .9; block(ctx, px - 3, py - 3, 6, 6, '#f4ecff'); break;
        }
      }
      ctx.restore();
    }
    // The station's severed beams and star fragments accelerate into the darkness.
    for (let i = 0; i < 88; i++) {
      const life = wrap(tick * (.0015 + i % 4 * .00035) + inward * (.5 + i % 4 * .1) + hash(i, 2, 9), 1), a = i * 2.399 + life * .7;
      const r = 950 * (1 - life * life) + 145, x = bx + Math.cos(a) * r, y = by + Math.sin(a) * r * .75;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.globalAlpha = Math.sin(life * Math.PI) * (i % 5 ? .48 : .72);
      if (i % 5 === 0) {
        const size = 12 + i % 4 * 9;
        block(ctx, 0, -size / 2, size * 1.6, size, '#3b3049');
        block(ctx, 0, -size / 2, size * 1.6, 3, '#7f6a8d');
        block(ctx, size * .8, 0, size * .7, 4, '#100e1a');
        if (i % 10 === 0) block(ctx, 4, -size / 2 + 6, 9, 2, '#94b985');
      } else block(ctx, 0, 0, 7 + life * 30, i % 3 ? 1 : 2, i % 7 ? '#a68bb6' : '#a6ce8b');
      ctx.restore();
    }
    ctx.save(); ctx.translate(bx, by);
    const size = Math.min(w * .22, h * .33), pulse = 1 + Math.sin(tick * .025) * .025 + Math.sin(tick * .061) * .009;
    ctx.scale(pulse * squeeze, squeeze / pulse);
    // Receding fractured horizons, filled dark interiors and broad hanging slabs.
    voidDisc(ctx, 0, 0, size * 1.2, '#160b21');
    voidDisc(ctx, 0, 0, size * 1.12, '#392444');
    voidDisc(ctx, 0, 0, size * 1.05, '#0c0814');
    voidDisc(ctx, 0, 0, size * .92, '#705377');
    voidDisc(ctx, 0, 0, size * .89, '#1b1026');
    voidDisc(ctx, 0, 0, size * .82, '#020107');
    for (let side = 0; side < 4; side++) {
      ctx.save(); ctx.rotate(side * Math.PI / 2);
      for (let k = 0; k < 3; k++) {
        ctx.save(); ctx.rotate((k - 1) * .5); const x = 0, depth = size * (.21 + hash(k, side, 97) * .18);
        block(ctx, x - 13, -size * .94, 26, depth, '#42304f');
        block(ctx, x - 13, -size * .94, 5, depth - 7, '#8b6c92');
        block(ctx, x - 8, -size * .94 + depth - 8, 21, 8, '#100a1b');
        if ((k + side) % 3 === 0) {
          ctx.globalAlpha = .35 + .25 * Math.sin(tick * .035 + side + k);
          block(ctx, x - 6, -size * .94 + depth - 11, 12, 3, '#b4d68f'); ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      ctx.restore();
    }
    voidDisc(ctx, 0, 0, size * .48, '#000004');
    // Uneven black bites interrupt the horizon rather than enclosing a tidy portal.
    for (let side = 0; side < 4; side++) {
      ctx.save(); ctx.rotate(side * Math.PI / 2);
      const offset = (hash(side, 2, 98) - .5) * size;
      block(ctx, offset, -size * 1.18, 20 + side * 7, size * .48, '#020107');
      block(ctx, offset - 9, -size * .94, 34 + side * 7, size * .2, '#020107');
      block(ctx, offset + 5, -size * 1.2 - 15, 17 + side * 3, 9, '#55405f');
      block(ctx, offset + 5, -size * 1.2 - 15, 17 + side * 3, 2, '#9a7aa3');
      ctx.restore();
    }
    // Interrupted plates contract into the horizon on each slow gravity breath.
    for (let i = 0; i < 12; i++) {
      const age = wrap(tick * .002 + inward * .8 + i / 12, 1), side = i % 4, r = size * (1.52 - age * .4);
      ctx.save(); ctx.rotate(side * Math.PI / 2);
      ctx.globalAlpha = Math.sin(age * Math.PI) * .55;
      block(ctx, -size * .42 + i % 3 * size * .22, -r, 22 + i % 3 * 10, 5, i % 4 ? '#8b6a9b' : '#b3c58a');
      ctx.restore();
    }
    ctx.restore();
    disc(true);
    // A thin photon ring hugs the horizon, flaring as the maw gulps.
    for (const [lw, al] of [[14, .12], [5, .3], [2, .7]] as const) { ctx.globalAlpha = Math.min(1, al * (1 + .4 * Math.sin(tick * .05) + swell * .6 + flash * .6)); ctx.strokeStyle = lw > 4 ? '#b07aff' : '#f0e4ff'; ctx.lineWidth = lw + swell * 3; ctx.beginPath(); voidOutline(maw * .5 * squeeze).forEach(([px, py], k) => k ? ctx.lineTo(bx + px, by + py) : ctx.moveTo(bx + px, by + py)); ctx.closePath(); ctx.stroke(); }
    // Twin relativistic jets lance out of the poles, flickering and widening.
    for (const dir of [-1, 1]) {
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-.24);
      for (let k = 0; k < 26; k++) {
        const t = wrap(k / 26 + tick * .012, 1), d = maw * .9 * squeeze + t * h * (1.1 + .6 * swell), wide = (10 + t * 70) * (1 + .5 * swell), flick = .6 + .4 * Math.sin(tick * .3 + k * 1.9);
        ctx.globalAlpha = (1 - t) * .22 * flick; block(ctx, -wide, dir * d - 8, wide * 2, 16, '#7a40c0');
        ctx.globalAlpha = (1 - t) * .55 * flick; block(ctx, -wide / 2, dir * d - 6, wide, 12, k % 3 ? '#b88cff' : '#9dff8a');
        ctx.globalAlpha = (1 - t) * .9 * flick; block(ctx, -3, dir * d - 6, 6, 12, '#f4ecff');
      }
      ctx.restore();
    }
    // A planet is torn apart: a stream of its blocks spirals into the maw.
    const px = w * .8 - camX * .03, py = h * .2 - camY * .03, pa = Math.atan2(py - by, px - bx), pd = Math.hypot(px - bx, py - by);
    for (let k = 0; k < 60; k++) {
      const t = wrap(k / 60 + tick * .0025 + inward * .6, 1), a = pa + t * t * Math.PI * 1.6, d = pd * (1 - t) + maw * .7 * t;
      ctx.globalAlpha = Math.sin(t * Math.PI) * .7 + (1 - t) * .2; const sz = 8 - t * 5;
      block(ctx, bx + Math.cos(a) * d - sz / 2, by + Math.sin(a) * d * .8 - sz / 2, sz * (1 + t * 2), sz, k % 4 ? '#c47a9a' : '#e8b0c8');
    }
    for (let row = -30; row < 30; row += 5) { const half = Math.round(Math.sqrt(900 - row * row) / 5) * 5 + Math.round(Math.max(0, -row) * .5); ctx.globalAlpha = 1; block(ctx, px - half, py + row, half * 2, 5, row < -8 ? '#a8607e' : '#6e3a58'); ctx.globalAlpha = .9; block(ctx, px + half * .2, py + row, half * .8, 5, '#2a1428'); }
    ctx.globalAlpha = .8; block(ctx, px - 34, py - 34, 10, 6, '#e8b0c8'); block(ctx, px - 46, py - 30, 6, 4, '#c47a9a');
    // The gulp: a violet shock ring contracts across the sky, the edges darken,
    // and a green flash bursts at the core as it lands.
    if (gulp > 0) {
      const rr = maw * .8 + (1 - ease(gulp)) * w * 1.1, fade = Math.sin(gulp * Math.PI);
      ctx.globalAlpha = fade * .45; ctx.strokeStyle = '#b07aff'; ctx.lineWidth = 6 + (1 - gulp) * 14; ctx.beginPath(); ctx.arc(bx, by, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = fade * .2; ctx.lineWidth = 40; ctx.stroke();
    }
    if (flash > 0) { // the green glow swells and fades softly in the core's own blocky shape
      for (const [scale, al] of [[1.1, .12], [.8, .22], [.5, .4]] as const) { ctx.globalAlpha = flash * al; voidDisc(ctx, bx, by, maw * scale * .5 * squeeze * (1 + flash * .15), '#9dff8a'); }
    }
    // While it sucks: streaks of light rush in from every edge, and rings in the core's own shape race inward.
    if (swell > 0) {
      for (let i = 0; i < 64; i++) {
        const a = i * 2.399 + hash(i, 7, 51) * .3, far = Math.hypot(w, h), t = wrap(tick * .03 + hash(i, 8, 51), 1);
        const r0 = far * (1 - t * t), len = 40 + 260 * swell * (1 - t);
        const x0 = bx + Math.cos(a) * r0, y0 = by + Math.sin(a) * r0, x1 = bx + Math.cos(a) * Math.max(maw * .6, r0 - len), y1 = by + Math.sin(a) * Math.max(maw * .6, r0 - len);
        ctx.globalAlpha = swell * (.25 + .45 * t) * (i % 5 ? .7 : 1); ctx.strokeStyle = i % 6 ? '#c9a8ff' : i % 2 ? '#9dff8a' : '#ffffff'; ctx.lineWidth = i % 4 ? 2 : 3;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      }
      for (let k = 0; k < 4; k++) {
        const t = wrap(tick * .02 + k / 4, 1), r = maw * (.6 + (1 - t) * 3.4);
        ctx.globalAlpha = swell * t * .35; ctx.strokeStyle = k % 2 ? '#b07aff' : '#e8d8ff'; ctx.lineWidth = 3 + t * 5;
        ctx.beginPath(); voidOutline(r).forEach(([px, py], j) => j ? ctx.lineTo(bx + px, by + py) : ctx.moveTo(bx + px, by + py)); ctx.closePath(); ctx.stroke();
      }
      ctx.globalAlpha = swell * .18; ctx.fillStyle = '#1a0830'; ctx.fillRect(0, 0, w, h); // the sky dims as light is drawn in
    }
    const edge = ctx.createRadialGradient(w * .5, h * .5, h * .35, w * .5, h * .5, w * .75);
    edge.addColorStop(0, '#00000000'); edge.addColorStop(1, `rgba(0,0,0,${.55 + swell * .25})`);
    ctx.globalAlpha = 1; ctx.fillStyle = edge; ctx.fillRect(0, 0, w, h);
    ctx.restore();
  },
  floor(ctx, state, tx, ty, x, y, color) {
    ctx.save(); const n = hash(tx, ty, 3);
    // Each 3x2 station plate has its own dark tone, with a slight violet, plum or green cast.
    const px = Math.floor(tx / 3), py = Math.floor(ty / 2), plate = hash(px, py, 4);
    block(ctx, x, y, S, S, ['#15111f', '#171122', '#13101d', '#18121f', '#121320'][Math.floor(plate * 5)]);
    ctx.globalAlpha = .035; block(ctx, x, y, S, S, color); ctx.globalAlpha = 1;
    // Plate bevels: a faint lit upper-left edge and a darker lower-right edge.
    if (ty % 2 === 0) block(ctx, x, y + 4, S, 1, '#251c32');
    if (tx % 3 === 0) block(ctx, x + 4, y, 1, S, '#221a2e');
    if (ty % 2 === 1) block(ctx, x, y + S - 2, S, 2, '#0c0a14');
    if (tx % 3 === 2) block(ctx, x + S - 2, y, 2, S, '#0c0a14');
    // Rivets at plate corners.
    if (ty % 2 === 0 && tx % 3 === 0) { block(ctx, x + 8, y + 9, 3, 3, '#3a2c46'); block(ctx, x + 8, y + 9, 1, 1, '#6a5478'); }
    if (ty % 2 === 1 && tx % 3 === 2) { block(ctx, x + S - 11, y + S - 12, 3, 3, '#3a2c46'); block(ctx, x + S - 11, y + S - 12, 1, 1, '#6a5478'); }
    // Faint etched circuit traces of the dead station on some plates.
    if (plate > .55) {
      const v = hash(tx, ty, 5), at = 12 + Math.floor(v * 24), trace = '#2a2037';
      if (v > .5) { block(ctx, x, y + at, S * .6, 1, trace); block(ctx, x + S * .6, y + at, 1, S - at, trace); }
      else { block(ctx, x + at, y, 1, S * .55, trace); block(ctx, x + at, y + S * .55, S - at, 1, trace); }
    }
    // Large dead station panels, stress-cleaved joints and remnants of severed fittings.
    if (ty % 2 === 0) { block(ctx, x, y, S, 3, '#080810'); block(ctx, x, y + 3, S, 1, '#35253e'); }
    if (tx % 3 === 0) { block(ctx, x, y, 3, S, '#080810'); block(ctx, x + 3, y, 1, S, '#302239'); }
    if (n > .86) {
      block(ctx, x + 9, y + 12, 25, 3, '#2f253a'); block(ctx, x + 9, y + 15, 3, 14, '#252130');
      block(ctx, x + 28, y + 16, 7, 5, '#06060e'); block(ctx, x + 17, y + 31, 15, 2, '#34273c');
    }
    if (n > .9) {
      ctx.save(); ctx.translate(x + 24, y + 24); ctx.rotate(Math.floor(n * 37) * Math.PI / 2);
      block(ctx, -14, -2, 20, 4, '#04040b'); block(ctx, 3, -12, 4, 14, '#04040b');
      block(ctx, -12, 2, 15, 1, '#6a427180'); ctx.restore();
    }
    ctx.restore();
  },
  cover(ctx, state, tx, ty, x, y, color, tick) {
    const top = !isCover(state, tx, ty - 1), bottom = !isCover(state, tx, ty + 1);
    const left = !isCover(state, tx - 1, ty), right = !isCover(state, tx + 1, ty);
    ctx.save(); ctx.shadowBlur = 0;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, S, S); ctx.clip();
    // Joined black monoliths with broad stepped plates, not triangular crystal facets.
    block(ctx, x, y, S, S, '#20182c');
    const wx = tx * S, wy = ty * S;
    ctx.save(); ctx.translate(x - wx, y - wy);
    for (let row = Math.floor(wy / 78) - 1; row <= Math.floor((wy + S) / 78); row++) for (let col = Math.floor(wx / 112) - 1; col <= Math.floor((wx + S) / 112); col++) {
      const px = col * 112 + (row % 2) * 37, py = row * 78;
      block(ctx, px, py, 109, 74, '#30233e'); block(ctx, px + 7, py + 7, 94, 26, '#3d2b4b');
      block(ctx, px + 16, py + 33, 85, 32, '#211a31'); block(ctx, px + 7, py + 4, 94, 3, '#60436c');
      block(ctx, px + 7, py + 7, 3, 51, '#4b355a');
      block(ctx, px + 29, py + 21, 7, 50, '#0a0914'); block(ctx, px + 36, py + 47, 27, 6, '#0a0914');
    }
    ctx.restore();
    if (top) { block(ctx, x, y, S, 4, '#8a7593'); block(ctx, x, y + 4, S, 3, '#4c365d'); }
    if (left) block(ctx, x, y + (top ? 4 : 0), 3, S - (top ? 4 : 0), '#665075');
    if (right) block(ctx, x + S - 4, y, 4, S, '#080812');
    if (bottom) block(ctx, x, y + S - 5, S, 5, '#07070f');
    const pulse = .45 + .25 * Math.sin(tick * .035 - tx * .8 + ty);
    if (hash(tx, ty, 7) > .45) {
      block(ctx, x + 17, y + 9, 5, 25, '#080912'); block(ctx, x + 22, y + 29, 14, 5, '#080912');
      ctx.globalAlpha = pulse; block(ctx, x + 19, y + 11, 2, 20, hash(tx, ty, 8) > .7 ? '#a8ce8d' : '#a979ba');
      block(ctx, x + 21, y + 31, 11, 1, '#8c5b9b'); ctx.globalAlpha = 1;
    }
    // Rectangular void bites, with pale fractured lips and dark inward tongues.
    if (top && hash(tx, ty, 11) > .45) { block(ctx, x + 9, y, 12, 9, '#080711'); block(ctx, x + 9, y + 8, 5, 9, '#080711'); block(ctx, x + 7, y + 1, 2, 9, '#a084aa'); }
    if (bottom && hash(tx, ty, 12) > .6) { block(ctx, x + 27, y + 34, 8, 14, '#05050c'); block(ctx, x + 21, y + 34, 14, 5, '#05050c'); }
    ctx.restore();
    // Some upper faces support broken obelisks. Their bases stay grounded in cover.
    if (top && hash(tx, ty, 14) > .73) {
      const height = 10 + Math.floor(hash(tx, ty, 15) * 15), px = x + 14 + hash(tx, ty, 16) * 12;
      block(ctx, px, y - height, 11, height + 4, '#241a33'); block(ctx, px, y - height, 11, 3, '#9a7caa');
      block(ctx, px + 2, y - height + 3, 3, height, '#594066');
      block(ctx, px + 6, y - height * .55, 7, 4, '#0b0a15');
    }
    ctx.restore();
  },
  ambience(ctx, state, camX, camY, x0, y0, x1, y1, tick) {
    ctx.save(); clipToFloor(ctx, state, camX, camY, x0, y0, x1, y1);
    // Massive branching stress fractures converge across each chamber. They are
    // scenery, not attack warnings: no enclosed target areas or hazard symbols.
    for (const [room, [top,left,bottom,right]] of CHAMBER_BOUNDS.entries()) {
      const cx = (left + right + 1) / 2 * S - camX, cy = (top + bottom + 1) / 2 * S - camY;
      for (let arm = 0; arm < 4; arm++) {
        const sx = (arm % 2 ? right - 2 : left + 2) * S - camX;
        const sy = (arm < 2 ? top + 2 : bottom - 2) * S - camY;
        const ex = cx + (arm % 2 ? 1 : -1) * S * 2.7, ey = cy + (arm < 2 ? -1 : 1) * S * 2.4;
        const mx = sx + (ex - sx) * .55, my = sy + (ey - sy) * .5;
        const path = [[sx,sy],[sx+(mx-sx)*.55,sy],[sx+(mx-sx)*.55,sy+(my-sy)*.25],[mx,sy+(my-sy)*.25],[mx,my],[ex,my],[ex,ey]];
        ctx.beginPath(); path.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
        ctx.globalAlpha = .9; ctx.strokeStyle = '#03030a'; ctx.lineWidth = 14; ctx.stroke();
        ctx.globalAlpha = .55; ctx.strokeStyle = '#563260'; ctx.lineWidth = 6; ctx.stroke();
        ctx.globalAlpha = .32 + .12 * Math.sin(tick * .024 - arm + room); ctx.strokeStyle = '#c18ac9'; ctx.lineWidth = 2; ctx.stroke();
        // Broken side branches keep the fault organic within the block geometry.
        ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx+(arm%2?22:-30),my);ctx.lineTo(mx+(arm%2?22:-30),my+(arm<2?24:-18));
        ctx.globalAlpha=.7;ctx.strokeStyle='#05050c';ctx.lineWidth=9;ctx.stroke();
        ctx.globalAlpha=.3;ctx.strokeStyle='#9b63aa';ctx.lineWidth=2;ctx.stroke();
        const life = wrap(tick * .003 + room * .21 + arm * .17, 1);
        const lengths=path.slice(1).map(([x,y],i)=>Math.abs(x-path[i][0])+Math.abs(y-path[i][1]));
        let distance=life*lengths.reduce((sum,n)=>sum+n,0),segment=0;
        while(segment<lengths.length-1&&distance>lengths[segment])distance-=lengths[segment++];
        const fraction=distance/Math.max(1,lengths[segment]),p=path[segment],q=path[segment+1];
        ctx.globalAlpha = .55 * Math.sin(life * Math.PI); block(ctx, p[0]+(q[0]-p[0])*fraction, p[1]+(q[1]-p[1])*fraction, 3, 3, '#c5df9e');
      }
    }
    // Gravity ripples: faint blocky rounded rings flow inward across each chamber toward its centre.
    for (const [room, [top,left,bottom,right]] of CHAMBER_BOUNDS.entries()) {
      const cx = (left + right + 1) / 2 * S - camX, cy = (top + bottom + 1) / 2 * S - camY, far = Math.max(right - left, bottom - top) * S * .62;
      for (let k = 0; k < 3; k++) {
        const t = wrap(tick * .0028 + k / 3 + room * .19, 1), r = far * (1 - t) + S * .6;
        ctx.globalAlpha = Math.sin(t * Math.PI) * .09; ctx.strokeStyle = k % 2 ? '#a77bff' : '#c99cff'; ctx.lineWidth = 3;
        ctx.beginPath(); voidOutline(r).forEach(([px, py], i) => i ? ctx.lineTo(cx + px, cy + py) : ctx.moveTo(cx + px, cy + py)); ctx.closePath(); ctx.stroke();
      }
    }
    // The etched circuit traces keep a few faint nodes that pulse now and then.
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (state.map[ty]?.[tx] === T_WALL || hash(Math.floor(tx / 3), Math.floor(ty / 2), 4) <= .55) continue;
      const v = hash(tx, ty, 5); if (hash(tx, ty, 6) < .55) continue;
      const at = 12 + Math.floor(v * 24), nx = (v > .5 ? tx * S + S * .6 : tx * S + at) - camX, ny = (v > .5 ? ty * S + at : ty * S + S * .55) - camY;
      const glow = Math.max(0, Math.sin(tick * .03 + tx * 1.7 + ty * 2.3)) ** 3;
      ctx.globalAlpha = .25 + .55 * glow; block(ctx, nx - 1, ny - 1, 3, 3, hash(tx, ty, 9) > .7 ? '#9dff8a' : '#b98cff');
      if (glow > .3) { ctx.globalAlpha = glow * .12; block(ctx, nx - 6, ny - 6, 13, 13, '#b98cff'); }
    }
    // Dark hooked roots spread from cover onto adjacent floor without hiding the edge.
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!isCover(state, tx, ty)) continue;
      for (let edge = 0; edge < 4; edge++) {
        const dx = [0,1,0,-1][edge], dy = [-1,0,1,0][edge];
        if (isCover(state, tx+dx, ty+dy) || hash(tx,ty,edge+21)<.55) continue;
        ctx.save(); ctx.translate((tx+.5)*S-camX,(ty+.5)*S-camY); ctx.rotate(edge*Math.PI/2);
        const reach = 14 + 5*Math.sin(tick*.018+tx+ty);
        ctx.globalAlpha = .65; block(ctx,-7,-S/2-reach,6,reach+3,'#06050d');block(ctx,-7,-S/2-reach,15,5,'#06050d');
        ctx.globalAlpha = .17;block(ctx,-8,-S/2-reach,1,reach,'#9366a4');ctx.restore();
      }
    }
    for (let room = 0; room < CHAMBER_BOUNDS.length; room++) {
      const [top,left,bottom,right] = CHAMBER_BOUNDS[room], cx=(left+right+1)/2*S, cy=(top+bottom+1)/2*S;
      for (let i=0;i<20;i++) {
        const life=wrap(tick*(.002+i%3*.0005)+hash(i,room,90),1), sx=(left+1+hash(i,room,91)*(right-left-2))*S, sy=(top+1+hash(i,room,92)*(bottom-top-2))*S;
        const x=sx+(cx-sx)*life*life-camX,y=sy+(cy-sy)*life*life-camY;
        ctx.globalAlpha=Math.sin(life*Math.PI)*.4;
        block(ctx,x,y,i%4?2:4,i%4?2:3,i%6?'#a18aae':'#a7c88d');
      }
    }
    ctx.restore();
    // Now and then a wall pipe vents a puff of poison-green smoke that rises and fades.
    ctx.save();
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (!isCover(state, tx, ty) || hash(tx, ty, 7) <= .45 || hash(tx, ty, 17) < .45) continue;
      const period = 360 + Math.floor(hash(tx, ty, 18) * 240), age = wrap(tick + hash(tx, ty, 19) * period, period);
      if (age > 150) continue;
      const ox = tx * S + 35 - camX, oy = ty * S + 31 - camY;
      for (let p = 0; p < 7; p++) {
        const life = (age - p * 12) / 90; if (life <= 0 || life >= 1) continue;
        const size = 4 + life * 14, sx = ox + Math.sin(life * 4 + p) * 5 + life * 10, sy = oy - life * 46;
        ctx.globalAlpha = Math.sin(life * Math.PI) * .26; block(ctx, sx - size / 2, sy - size / 2, size, size, p % 3 ? SINGULARITY_GAS.body : SINGULARITY_GAS.light);
        ctx.globalAlpha *= .4; block(ctx, sx - size, sy - size * .7, size * 2, size * 1.4, SINGULARITY_GAS.shade);
      }
    }
    ctx.restore();
  },
};

const THEMES: Partial<Record<string, WorldTheme>> = { aegis_sentinel: venus, devourer: singularity };
export function worldTheme(state: Readonly<GameState>): WorldTheme | null {
  if (state.trial?.boss === 'blind_prayer') return siriusTransitions[Math.round(siriusLightAmount(state) * SIRIUS_LIGHT_STEPS)];
  return (state.trial && THEMES[state.trial.boss]) || null;
}
