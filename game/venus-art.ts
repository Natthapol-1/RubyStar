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
/** Sand Swirl at any scale, for the rule sheet: the same blocky octagon footprint (a warm tint and a thick sandy border)
 * and the same three turning ribbons and grit as in play. progress runs 0–1 over the sweep; tile is the tile size in px. */
export function drawSandSwirlPreview(ctx: CanvasRenderingContext2D, x: number, y: number, tile: number, progress: number) {
  const r = VENUS.sweepRadius, opacity = (1 - progress) ** .7;
  ctx.save();
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (!venusSweepCovers(dx, dy)) continue;
    const cx = x + (dx - .5) * tile, cy = y + (dy - .5) * tile;
    ctx.globalAlpha = opacity * .22; block(ctx, cx, cy, tile, tile, SAND);
    for (const [ex, ey, bx, by, bw, bh] of [[0, -1, 0, 0, tile, 3], [0, 1, 0, tile - 3, tile, 3], [-1, 0, 0, 0, 3, tile], [1, 0, tile - 3, 0, 3, tile]] as const) {
      if (venusSweepCovers(dx + ex, dy + ey)) continue; // only the outer edge gets the border
      ctx.globalAlpha = opacity * .75; block(ctx, cx + bx, cy + by, bw, bh, '#6e4e2a');
      ctx.globalAlpha = opacity; block(ctx, cx + bx + (bw > 3 ? 0 : 1), cy + by + (bh > 3 ? 0 : 1), bw > 3 ? bw : 1, bh > 3 ? bh : 1, '#fff0c8');
    }
  }
  const radius = r * tile, reach = tile * .75 + (radius - tile * .75) * (1 - (1 - progress) ** 2), rotation = progress * Math.PI * 1.65;
  for (let arm = 0; arm < 3; arm++) drawSandRibbon(ctx, x, y, rotation + arm * Math.PI * 2 / 3, reach * (1 - arm * .035), opacity, 12);
  for (let i = 0; i < 40; i++) {
    const angle = i * 2.39996 + rotation * (1 + i % 5 * .1), d = reach * (.32 + (i * 37 % 59) / 90), size = 2 + i % 2;
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
    ctx.globalAlpha = opacity * (1 - tail) * .48;
    block(ctx, -length / 2 - 4, -width / 2, length + 8, width + 4, '#ae7749');
    ctx.globalAlpha = opacity * (1 - tail) * .82;
    block(ctx, -length / 2, -width / 2, length, width, SAND);
    if (i % 3 === 0) {
      ctx.globalAlpha = opacity * (1 - tail) * .9;
      block(ctx, -length / 3, -width / 2 - 1, length * .7, 2, '#ffdfaa');
    }
    ctx.restore();
  }
}

/** Trace the fixed tile footprint and tint its floor. */
function drawSandSweepRange(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, centerX: number, centerY: number, camX: number, camY: number, opacity: number) {
  const centerTileX = Math.floor(centerX / S), centerTileY = Math.floor(centerY / S);
  const radius = VENUS.sweepRadius;
  const inRange = (dx: number, dy: number) => venusSweepCovers(dx, dy); // the blocky octagon footprint
  const sandTiles: [number, number, number, number][] = [];

  ctx.save();
  ctx.fillStyle = '#dcad72';
  ctx.globalAlpha = opacity * .16;
  ctx.beginPath();
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    if (!inRange(dx, dy)) continue;
    const tx = centerTileX + dx, ty = centerTileY + dy;
    const x = tx * S - camX, y = ty * S - camY;
    if (state.map[ty]?.[tx] === T_FLOOR) { ctx.fillRect(x, y, S, S); sandTiles.push([tx, ty, x, y]); }
    if (!inRange(dx, dy - 1)) { ctx.moveTo(x, y); ctx.lineTo(x + S, y); }
    if (!inRange(dx + 1, dy)) { ctx.moveTo(x + S, y); ctx.lineTo(x + S, y + S); }
    if (!inRange(dx, dy + 1)) { ctx.moveTo(x + S, y + S); ctx.lineTo(x, y + S); }
    if (!inRange(dx - 1, dy)) { ctx.moveTo(x, y + S); ctx.lineTo(x, y); }
  }
  // The swept floor looks sandy: shallow wind ripples and scattered grains on every tile in reach.
  const grain = (tx: number, ty: number, k: number) => { const n = Math.sin(tx * 127.1 + ty * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
  for (const [tx, ty, x, y] of sandTiles) {
    for (let r = 0; r < 2; r++) { // faint ripples: short shallow dunes across the tile
      const ry = y + 14 + r * 18 + Math.floor(grain(tx, ty, r) * 5), rx = x + 6 + Math.floor(grain(tx, ty, r + 9) * 10), len = 14 + Math.floor(grain(tx, ty, r + 19) * 12);
      ctx.globalAlpha = opacity * .18; block(ctx, rx, ry, len, 1, '#f1d29a');
      ctx.globalAlpha = opacity * .12; block(ctx, rx + 2, ry + 1, len - 2, 1, '#8a6338');
    }
    for (let g = 0; g < 5; g++) { // a few grains
      ctx.globalAlpha = opacity * (.15 + grain(tx, ty, g + 40) * .2);
      block(ctx, x + grain(tx, ty, g + 30) * (S - 3), y + grain(tx, ty, g + 50) * (S - 3), g % 3 ? 2 : 3, 2, g % 4 ? '#e8c48a' : '#a9784a');
    }
  }
  ctx.beginPath(); // the edge path below is rebuilt after the grains
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    if (!inRange(dx, dy)) continue;
    const x = (centerTileX + dx) * S - camX, y = (centerTileY + dy) * S - camY;
    if (!inRange(dx, dy - 1)) { ctx.moveTo(x, y); ctx.lineTo(x + S, y); }
    if (!inRange(dx + 1, dy)) { ctx.moveTo(x + S, y); ctx.lineTo(x + S, y + S); }
    if (!inRange(dx, dy + 1)) { ctx.moveTo(x + S, y + S); ctx.lineTo(x, y + S); }
    if (!inRange(dx - 1, dy)) { ctx.moveTo(x, y + S); ctx.lineTo(x, y); }
  }
  // A thick edge marks the reach: a dark sandy underline, then the bright line on top.
  ctx.lineCap = 'square';
  ctx.globalAlpha = opacity * .55;
  ctx.strokeStyle = '#7a5530';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.globalAlpha = opacity * .95;
  ctx.strokeStyle = '#f3cd91';
  ctx.lineWidth = 4;
  ctx.stroke();
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
      drawSandRibbon(ctx, x, y, rotation + arm * Math.PI * 2 / 3, reach * (1 - arm * .035), opacity, 12);
    }
    for (let i = 0; i < 66; i++) {
      const angle = i * 2.39996 + rotation * (1 + i % 5 * .1);
      const radius = reach * (.32 + (i * 37 % 59) / 90);
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
    ctx.globalAlpha = blink; ctx.strokeStyle = locked ? RED : GOLD; ctx.lineWidth = 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    // Locked: an inner square grows steadily from the centre and fills the target exactly as he lands, so the drop is
    // easy to time. It turns white once a Sand Swirl would parry the landing.
    if (locked) {
      const q = Math.round(r * fall / 2) * 2, parry = l.ticks <= VENUS.parryWindow;
      ctx.globalAlpha = .18 + .22 * fall; block(ctx, x - q, y - q, q * 2, q * 2, RED);
      ctx.globalAlpha = .95; ctx.strokeStyle = parry ? '#ffffff' : RED; ctx.lineWidth = 3; if (q > 2) ctx.strokeRect(x - q, y - q, q * 2, q * 2);
    }
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { block(ctx, x + sx * (r + 6) - (sx < 0 ? 0 : 10), y + sy * (r + 6) - (sy < 0 ? 0 : 3), 10, 3, locked ? RED : GOLD); block(ctx, x + sx * (r + 6) - (sx < 0 ? 0 : 3), y + sy * (r + 6) - (sy < 0 ? 0 : 10), 3, 10, locked ? RED : GOLD); }
  }
  // The lance's aim: a dashed band along its line, white in its last moments.
  const boss = state.enemies.find(e => e.id === t.bossId);
  if (t.lance && boss) {
    const l = t.lance, len = VENUS.lanceRange * S, w = VENUS.lanceHalfWidth * S, x = boss.x - camX, y = boss.y - camY, late = l.ticks <= VENUS.lanceLock;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(l.dy, l.dx));
    ctx.globalAlpha = late ? .35 + .3 * Math.abs(Math.sin(tick * .6)) : .18; block(ctx, 0, -w, len, w * 2, late ? '#ffffff' : GOLD);
    ctx.globalAlpha = .9; ctx.strokeStyle = late ? '#ffffff' : GOLD; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -tick * 2;
    ctx.strokeRect(0, -w, len, w * 2);
    ctx.setLineDash([]);
    block(ctx, len - 2, -w, 2, w * 2, late ? '#ffffff' : GOLD);
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
    for (let arm = 0; arm < 3; arm++) {
      drawSandRibbon(ctx, x, y, tick * .23 + arm * Math.PI * 2 / 3, 44, (.25 + .6 * left) * Math.min(1, left * 6), 8);
    }
  }
  for (const f of t.reflects) {
    const p = 1 - f.ticks / 18; ctx.globalAlpha = 1 - p; ctx.strokeStyle = GOLD; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(f.fromX - camX, f.fromY - camY); ctx.lineTo(f.toX - camX, f.toY - camY); ctx.stroke();
    block(ctx, f.toX - camX - 5, f.toY - camY - 5, 10, 10, '#fff1d0');
  }
  // A successful counter: a white flash over the view, two diamond shockwaves racing out, a burst of sand and cyan
  // shards, and a bright core where it was caught.
  for (const q of t.parries) {
    const p = 1 - q.ticks / 36, x = q.x - camX, y = q.y - camY, ease = 1 - (1 - p) ** 3;
    if (p < .2) { ctx.globalAlpha = (.2 - p) * 1.1; block(ctx, x - 3000, y - 3000, 6000, 6000, '#fff8e8'); }
    for (const [lag, col, lw, reach] of [[0, '#ffffff', 10, 170], [.12, CYAN, 7, 130], [.24, SAND, 5, 92]] as const) {
      const k = Math.max(0, ease - lag), r = 14 + reach * k; if (k <= 0) continue;
      ctx.globalAlpha = (1 - p) * .95; ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - p) + 1;
      ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.stroke();
    }
    for (let k = 0; k < 16; k++) {
      const a = k * Math.PI / 8 + .2, d = 18 + 130 * ease * (.6 + (k % 4) * .13), sz = k % 3 ? 7 : 11;
      ctx.globalAlpha = (1 - p); block(ctx, x + Math.cos(a) * d - sz / 2, y + Math.sin(a) * d - sz / 2, sz, sz, k % 2 ? CYAN : k % 3 ? SAND : '#ffffff');
    }
    if (p < .35) { const c = 32 * (1 - p / .35); ctx.globalAlpha = 1; block(ctx, x - c / 2, y - c / 2, c, c, '#ffffff'); }
  }
  // Relic finds: a bright ring in the relic's colour, with sparks rising.
  for (const f of t.finds) {
    const p = 1 - f.ticks / 50, x = f.x - camX, y = f.y - camY, col = RELIC_COLOR[f.kind], r = 12 + 40 * p;
    ctx.globalAlpha = 1 - p; ctx.strokeStyle = col; ctx.lineWidth = 4 * (1 - p) + 1; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    for (let k = 0; k < 6; k++) block(ctx, x - 14 + k * 6, y - 10 - p * (20 + k % 3 * 8), 3, 3, k % 2 ? col : '#fff6d0');
  }
  ctx.restore();
}

/**
 * The shield breaking: his shield shatters across the whole screen, wherever you are. A cyan-white flash, the shield
 * dome bursting, thick cracks and three bold diamond shockwaves racing out from him, a storm of big outlined shards
 * that spin and fall, glitter and a cyan frame. Centred on him, held inside the screen when he is off it. Drawn in
 * screen space over the world, below the HUD; it only reads state.
 */
export function drawVenusShatter(ctx: CanvasRenderingContext2D, s: Readonly<GameState>, w: number, h: number, camX: number, camY: number, zoom = 1, tick = 0) {
  const q = s.venus?.shatter; if (!q) return;
  const p = 1 - q.ticks / VENUS.shatterTicks, ease = 1 - (1 - p) ** 3, fade = (1 - p) ** .6, reach = Math.hypot(w, h);
  const x = Math.max(w * .12, Math.min(w * .88, (q.x - camX) * zoom)), y = Math.max(h * .12, Math.min(h * .88, (q.y - camY) * zoom));
  ctx.save(); ctx.shadowBlur = 0;
  if (p < .18) { ctx.globalAlpha = (.18 - p) * 3.5; ctx.fillStyle = p < .04 ? '#ffffff' : '#c8fbff'; ctx.fillRect(0, 0, w, h); }
  ctx.globalAlpha = fade * fade * .14; ctx.fillStyle = CYAN; ctx.fillRect(0, 0, w, h);
  if (p < .35) { // the shield dome, cracking and bursting
    const r = (44 + 30 * (p / .35)) * zoom; ctx.globalAlpha = (1 - p / .35) * .55; ctx.fillStyle = CYAN; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1 - p / .35; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
  }
  for (let k = 0; k < 12; k++) { // thick cracks: a white core over a cyan edge
    const a = k * Math.PI / 6 + .3, r = 40 + reach * (.35 + (k % 3) * .12) * ease, bend = (k % 2 ? .18 : -.18);
    for (const [col, lw] of [[CYAN, 10], ['#ffffff', 4]] as const) {
      ctx.globalAlpha = fade * .9; ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a + bend) * r * .45, y + Math.sin(a + bend) * r * .45); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
    }
  }
  for (const [lag, col, lw, k0] of [[0, '#ffffff', 16, .6], [.08, CYAN, 12, .45], [.16, GOLD, 9, .3]] as const) { // diamond shockwaves
    const k = Math.max(0, ease - lag), r = 20 + reach * k0 * k; if (k <= 0) continue;
    ctx.globalAlpha = fade; ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - p) + 2;
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.stroke();
  }
  for (let k = 0; k < 34; k++) { // big shield shards: spinning slabs with a dark outline, flung out then falling
    const a = k * 2.39996, d = 30 + reach * .4 * ease * (.4 + (k % 5) * .15), sz = (k % 3 ? 12 : 22) * Math.max(1, zoom * .8), fall = p * p * h * .3;
    ctx.save(); ctx.translate(x + Math.cos(a) * d, y + Math.sin(a) * d * .8 + fall); ctx.rotate(p * 9 + k); ctx.globalAlpha = fade;
    ctx.fillStyle = '#123a44'; ctx.fillRect(-sz / 2 - 2, -sz / 4 - 2, sz + 4, sz / 2 + 4);
    ctx.fillStyle = k % 2 ? CYAN : k % 3 ? '#ffffff' : GOLD; ctx.fillRect(-sz / 2, -sz / 4, sz, sz / 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-sz / 2, -sz / 4, sz / 2, 2);
    ctx.restore();
  }
  for (let k = 0; k < 30; k++) { // fine glitter
    const a = k * 1.7, d = 20 + reach * .3 * ease * (.3 + (k % 7) / 7);
    ctx.globalAlpha = fade * (Math.floor(tick / 3 + k) % 2 ? 1 : .4); ctx.fillStyle = '#ffffff'; ctx.fillRect(x + Math.cos(a) * d - 2, y + Math.sin(a) * d - 2 + p * p * h * .2, 4, 4);
  }
  if (p < .3) { const c = 70 * (1 - p / .3); ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - c / 2, y - c / 2, c, c); }
  const edge = Math.round(Math.min(w, h) * (.07 * fade + .015)); // a cyan frame, thick at first and thinning out
  ctx.globalAlpha = fade * .5; ctx.fillStyle = CYAN;
  ctx.fillRect(0, 0, w, edge); ctx.fillRect(0, h - edge, w, edge); ctx.fillRect(0, 0, edge, h); ctx.fillRect(w - edge, 0, edge, h);
  ctx.restore();
}
