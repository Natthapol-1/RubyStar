import { CHAMBER_BOUNDS, TELEPORT_PADS, TILE_SIZE, T_WALL, chamberOfTile } from './constants';
import type { GameState } from './engine';
import { BINARY, POLE_COLORS } from './binary';

// Binary Star world: a station between two orbiting stars. Read-only, driven by gameTick.
// Opposite rooms are paired warm/cool, like the twins: ALPHA coral ↔ GAMMA ice, BETA periwinkle ↔ DELTA apricot.
export const BINARY_CHAMBER_COLORS = ['#ff8f7a', '#8fb8ff', '#ffb38a', '#7fd4ff'] as const; // [ALPHA, BETA, DELTA, GAMMA]
export function isBinaryMap(state: Readonly<GameState>) { return state.trial?.boss === 'astral_twins'; }

const CORAL = '#ff8f7a', BLUE = '#83cfff', SEAM = '#fff4ee';
const hash = (x: number, y: number, k: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };

// A star built from stepped horizontal strips, so its edge is blocky rather than a smooth circle.
function steppedDisc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, step = 8) {
  ctx.fillStyle = color;
  for (let dy = -r; dy < r; dy += step) {
    const mid = dy + step / 2, half = Math.sqrt(Math.max(0, r * r - mid * mid));
    const w = Math.round(half / step) * step;
    if (w > 0) ctx.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2, step);
  }
}
function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rim: string, body: string, core: string, tick: number, seed: number) {
  ctx.save();
  ctx.globalAlpha = .06; steppedDisc(ctx, x, y, r + 34, rim, 12);
  ctx.globalAlpha = .12; steppedDisc(ctx, x, y, r + 16, rim, 10);
  ctx.globalAlpha = 1; steppedDisc(ctx, x, y, r, rim);
  steppedDisc(ctx, x, y, r - 8, body);
  steppedDisc(ctx, x - r * .18, y - r * .18, r * .45, core);
  // Prominences: short blocky flares that rise and fall around the rim.
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2 + seed, life = .5 + .5 * Math.sin(tick * .03 + k * 1.7 + seed), len = 6 + life * 14;
    const px = x + Math.cos(a) * (r + 2), py = y + Math.sin(a) * (r + 2);
    ctx.globalAlpha = .35 + .4 * life; ctx.fillStyle = k % 2 ? rim : core;
    ctx.fillRect(Math.round(px - 3 + Math.cos(a) * len / 2), Math.round(py - 3 + Math.sin(a) * len / 2), 6, 6);
  }
  ctx.restore();
}

/**
 * Your pole tints the world: coral for north, blue for south. After a swap the tint cross-fades over half a second,
 * read from the swap cooldown so drawing never changes state. Right after a swap the new colour flares much stronger
 * (up to 1 + POLE_FLASH_BOOST times) and eases back over POLE_FLASH_TICKS. Returns [old colour, new colour, blend 0–1, flare 0–1].
 */
const POLE_FLASH_TICKS = 40, POLE_FLASH_BOOST = 8;
export function poleTint(state: Readonly<GameState>): [string, string, number, number] | null {
  const b = state.binary; if (!b) return null;
  const now = POLE_COLORS[b.pole], before = POLE_COLORS[b.pole === 'north' ? 'south' : 'north'];
  const since = BINARY.poleCooldown - b.poleCooldown, fading = b.poleCooldown > 0 && since < 30;
  const flare = b.poleCooldown > 0 && since < POLE_FLASH_TICKS ? (1 - since / POLE_FLASH_TICKS) ** 2 : 0;
  return [before, now, fading ? Math.min(1, since / 8) : 1, flare];
}
function tintWash(ctx: CanvasRenderingContext2D, tint: [string, string, number, number] | null, x: number, y: number, w: number, h: number, alpha: number) {
  if (!tint) return;
  const [before, now, t, flare] = tint;
  ctx.save();
  if (t < 1) { ctx.globalAlpha = alpha * (1 - t); ctx.fillStyle = before; ctx.fillRect(x, y, w, h); }
  ctx.globalAlpha = Math.min(1, alpha * t * (1 + POLE_FLASH_BOOST * flare)); ctx.fillStyle = now; ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** Behind the station: a coral and a blue star orbit each other, trading a stream of light, over a split warm/cool sky. */
export function drawBinaryBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, camX: number, camY: number, tick: number, state?: Readonly<GameState>) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, viewW, viewH);
  sky.addColorStop(0, '#140a18'); sky.addColorStop(.5, '#0b0a1c'); sky.addColorStop(1, '#07101f');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, viewW, viewH);
  tintWash(ctx, state ? poleTint(state) : null, 0, 0, viewW, viewH, .06); // your pole tints the sky
  // A faint Milky Way band crosses the sky diagonally: a soft glow dense with tiny stars.
  {
    const ox = -camX * .01, oy = -camY * .01;
    ctx.save(); ctx.translate(viewW * .5 + ox, viewH * .5 + oy); ctx.rotate(-.42);
    const band = ctx.createLinearGradient(0, -viewH * .28, 0, viewH * .28);
    band.addColorStop(0, '#9a8cff00'); band.addColorStop(.5, '#b8a8ff'); band.addColorStop(1, '#9a8cff00');
    ctx.globalAlpha = .07; ctx.fillStyle = band; ctx.fillRect(-viewW, -viewH * .28, viewW * 2, viewH * .56);
    for (let i = 0; i < 220; i++) {
      const sx = (hash(i, 21, 5) - .5) * viewW * 2, sy = (hash(i, 22, 5) + hash(i, 23, 5) - 1) * viewH * .26;
      ctx.globalAlpha = .12 + hash(i, 24, 5) * .3; ctx.fillStyle = i % 5 ? '#e4dcff' : '#ffd8cc'; ctx.fillRect(Math.round(sx), Math.round(sy), 1 + (i % 9 === 0 ? 1 : 0), 1 + (i % 9 === 0 ? 1 : 0));
    }
    // Dark dust lanes split the band.
    for (let k = 0; k < 7; k++) { ctx.globalAlpha = .14; ctx.fillStyle = '#07061a'; ctx.fillRect(Math.round((k - 3.5) * viewW * .26 + hash(k, 25, 5) * 60), Math.round((hash(k, 26, 5) - .5) * 30), 120 + hash(k, 27, 5) * 160, 6 + hash(k, 28, 5) * 10); }
    ctx.restore();
  }
  // Layered nebula clouds: warm coral and rose on the left, cool blue and teal on the right,
  // each a soft glow with brighter knots, drifting very slowly.
  for (let n = 0; n < 9; n++) {
    const warm = n % 2 === 0, span = viewW + 700;
    const x = ((hash(n, 1, 3) * span * .55 + (warm ? 0 : span * .45) - camX * .025 + tick * (warm ? .012 : -.012)) % span + span) % span - 350;
    const y = viewH * (.1 + hash(n, 2, 3) * .8) - camY * .025, r = 150 + hash(n, 4, 3) * 200;
    const col = warm ? (n % 4 ? '#ff7d6a' : '#ff6ab0') : (n % 4 === 1 ? '#5aa6ff' : '#4ad8d0');
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col + '30'); g.addColorStop(.5, col + '14'); g.addColorStop(1, col + '00');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    for (let k = 0; k < 4; k++) { ctx.globalAlpha = .12 + .06 * Math.sin(tick * .01 + n + k); ctx.fillStyle = col; const kx = x + (hash(n, k, 6) - .5) * r, ky = y + (hash(n, k, 7) - .5) * r * .6; ctx.globalAlpha *= .6; ctx.fillRect(Math.round(kx), Math.round(ky), 3, 3); }
  }
  // Distant stars, warm, cool and white, twinkling.
  for (let i = 0; i < 70; i++) {
    const x = ((hash(i, 6, 1) * viewW * 1.6 - camX * .05) % viewW + viewW) % viewW, y = ((hash(i, 7, 1) * viewH * 1.6 - camY * .05) % viewH + viewH) % viewH;
    const tw = .5 + .5 * Math.sin(tick * .025 + i * 1.9);
    ctx.globalAlpha = .15 + .45 * tw; ctx.fillStyle = i % 3 === 0 ? '#ffd2c6' : i % 3 === 1 ? '#cfe9ff' : '#ffffff';
    const size = i % 7 ? 2 : 3; ctx.fillRect(Math.round(x), Math.round(y), size, size);
    if (i % 8 === 0) { ctx.globalAlpha = (.2 + .4 * tw) * .7; ctx.fillRect(Math.round(x) - 6, Math.round(y) + 1, 15, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - 6, 1, 15); }
  }
  // A dim distant spiral galaxy in the lower left, turning very slowly.
  {
    const gx = viewW * .2 - camX * .015, gy = viewH * .74 - camY * .015, spin = tick * .0004;
    for (let arm = 0; arm < 2; arm++) for (let k = 0; k < 26; k++) {
      const t = k / 26, ang = spin + arm * Math.PI + t * Math.PI * 2.2, rad = 10 + t * 170, sz = t < .4 ? 6 : 4;
      ctx.globalAlpha = .32 * (1 - t * .8); ctx.fillStyle = arm ? '#ffcbbd' : '#cfe0ff';
      ctx.fillRect(Math.round(gx + Math.cos(ang) * rad), Math.round(gy + Math.sin(ang) * rad * .4), sz, sz);
      ctx.globalAlpha *= .3; ctx.fillRect(Math.round(gx + Math.cos(ang) * rad) - 4, Math.round(gy + Math.sin(ang) * rad * .4) - 2, sz + 8, sz + 4);
    }
    ctx.globalAlpha = .15; ctx.fillStyle = '#ffe6da'; ctx.fillRect(Math.round(gx) - 22, Math.round(gy) - 9, 44, 18);
    ctx.globalAlpha = .55; ctx.fillStyle = '#fff1e8'; ctx.fillRect(Math.round(gx) - 7, Math.round(gy) - 4, 14, 8);
  }
  // An occasional comet streaks across the upper sky.
  {
    const cyc = tick % 900; if (cyc < 140) {
      const t = cyc / 140, sx = viewW * (1.05 - t * 1.2), sy = viewH * (.06 + t * .22) + Math.floor(tick / 900) % 3 * 30;
      for (let k = 0; k < 12; k++) { ctx.globalAlpha = .5 * (1 - k / 12) * Math.sin(t * Math.PI); ctx.fillStyle = k < 2 ? '#ffffff' : '#bfe0ff'; ctx.fillRect(Math.round(sx + k * 10), Math.round(sy - k * 2), k < 2 ? 4 : 3, k < 2 ? 4 : 2); }
    }
  }
  // The pair: opposite each other on a flattened orbit around their barycentre.
  const bx = viewW * .66 - camX * .04, by = viewH * .34 - camY * .04, rx = Math.min(viewW, viewH) * .2, ry = rx * .42;
  const a = tick * .0011, cx = bx + Math.cos(a) * rx, cy = by + Math.sin(a) * ry, dx = bx - Math.cos(a) * rx * .8, dy = by - Math.sin(a) * ry * .8;
  ctx.fillStyle = '#c9b8ff'; ctx.globalAlpha = .1;
  for (let k = 0; k < 64; k++) { const t = k / 64 * Math.PI * 2; ctx.fillRect(Math.round(bx + Math.cos(t) * rx) - 2, Math.round(by + Math.sin(t) * ry) - 2, 4, 4); }
  // Mass transfer: a bowed stream of blocks flowing from the blue star into the coral one.
  const mx = (cx + dx) / 2 + (cy - dy) * .25, my = (cy + dy) / 2 - (cx - dx) * .25;
  for (let k = 0; k < 18; k++) {
    const t = (k / 18 + tick * .004) % 1, u = 1 - t;
    const px = u * u * dx + 2 * u * t * mx + t * t * cx, py = u * u * dy + 2 * u * t * my + t * t * cy;
    ctx.globalAlpha = .55 * Math.sin(t * Math.PI); ctx.fillStyle = t < .5 ? '#cfe9ff' : '#ffd2c6';
    ctx.fillRect(Math.round(px) - 3, Math.round(py) - 3, 6, 6);
  }
  const coral = { x: cx, y: cy, r: 54, rim: CORAL, body: '#ffb39a', core: '#fff1e8', seed: 0 };
  const blue = { x: dx, y: dy, r: 40, rim: BLUE, body: '#a9dcff', core: '#f1faff', seed: 2 };
  // Wide soft halos: each star lights the space around it.
  for (const s of [coral, blue]) { const g = ctx.createRadialGradient(s.x, s.y, s.r * .6, s.x, s.y, s.r * 5); g.addColorStop(0, s.rim + '40'); g.addColorStop(.4, s.rim + '12'); g.addColorStop(1, s.rim + '00'); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(s.x - s.r * 5, s.y - s.r * 5, s.r * 10, s.r * 10); }
  for (const s of Math.sin(a) > 0 ? [blue, coral] : [coral, blue]) drawStar(ctx, s.x, s.y, s.r, s.rim, s.body, s.core, tick, s.seed);
  // A small dark planet circles the pair on a wide orbit, lit on the side facing them.
  {
    const pa = -tick * .0006 + 2, px = bx + Math.cos(pa) * rx * 2.3, py = by + Math.sin(pa) * ry * 2.6, pr = 12;
    ctx.globalAlpha = .1; ctx.fillStyle = '#c9b8ff';
    for (let k = 0; k < 80; k += 2) { const t = k / 80 * Math.PI * 2; ctx.fillRect(Math.round(bx + Math.cos(t) * rx * 2.3) - 1, Math.round(by + Math.sin(t) * ry * 2.6) - 1, 2, 2); }
    const lit = Math.cos(pa) > 0 ? -1 : 1;
    for (let row = -pr; row < pr; row += 3) { const half = Math.round(Math.sqrt(pr * pr - row * row)); ctx.globalAlpha = .95; ctx.fillStyle = '#1d1a35'; ctx.fillRect(Math.round(px - half), Math.round(py + row), half * 2, 3); ctx.fillStyle = lit < 0 ? '#ffb39a' : '#a9dcff'; ctx.globalAlpha = .55; ctx.fillRect(Math.round(lit < 0 ? px - half : px + half * .4), Math.round(py + row), Math.round(half * .6), 3); }
  }
  ctx.restore();
}

// Interior cover only; outer walls stay open to the backdrop.
function isCover(state: Readonly<GameState>, tx: number, ty: number) {
  if ((state.map[ty]?.[tx] ?? T_WALL) !== T_WALL) return false;
  const ch = chamberOfTile(tx, ty); if (ch < 0) return false;
  const [t, l, b, r] = CHAMBER_BOUNDS[ch];
  return tx > l && tx < r && ty > t && ty < b;
}
const block = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
/** Which teleport-pad ring a floor tile sits on (0 = the pad itself), or -1 outside the rooms. */
function padRing(tx: number, ty: number) {
  const room = chamberOfTile(tx, ty), pad = room >= 0 ? TELEPORT_PADS[room] : undefined;
  return pad ? Math.max(Math.abs(tx - pad[0]), Math.abs(ty - pad[1])) : -1;
}
interface Mass { base: string; inset: string; cap: string; capLight: string; capShade: string; left: string; right: string; bottom: string; bottomLine: string }
/**
 * A raised bulkhead that joins with its neighbours: a cap only on exposed tops, a lit left face, shaded right face and a
 * deep bottom face, so adjacent blocks read as one solid wall. Returns the inner rectangle for the material.
 */
function joinedMass(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, m: Mass) {
  const s = TILE_SIZE, open = (dx: number, dy: number) => !isCover(state, tx + dx, ty + dy);
  const top = open(0, -1), left = open(-1, 0), right = open(1, 0), bottom = open(0, 1);
  block(ctx, x, y, s, s, m.base);
  const ix = x + (left ? 5 : 0), iy = y + (top ? 7 : 0), iw = s - (left ? 5 : 0) - (right ? 5 : 0), ih = s - (top ? 7 : 0) - (bottom ? 8 : 0);
  block(ctx, ix, iy, iw, ih, m.inset);
  if (top) { block(ctx, x, y, s, 6, m.cap); block(ctx, x + 3, y, s - 6, 2, m.capLight); block(ctx, x, y + 6, s, 2, m.capShade); }
  if (left) { block(ctx, x, y + (top ? 6 : 0), 4, s - (top ? 6 : 0), m.left); block(ctx, x, y + (top ? 8 : 2), 1, s - 12, m.capLight); }
  if (right) block(ctx, x + s - 4, y + (top ? 6 : 0), 4, s - (top ? 6 : 0), m.right);
  if (bottom) { block(ctx, x, y + s - 8, s, 8, m.bottom); block(ctx, x + 4, y + s - 5, s - 8, 2, m.bottomLine); }
  return { ix, iy, iw, ih, top, left, right, bottom };
}
/** A thin room-coloured outline on edges that face open floor. */
function roomEdge(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string) {
  const s = TILE_SIZE, open = (dx: number, dy: number) => !isCover(state, tx + dx, ty + dy);
  ctx.globalAlpha = .55;
  if (open(0, -1)) block(ctx, x, y, s, 1, color); if (open(-1, 0)) block(ctx, x, y, 1, s, color);
  if (open(1, 0)) block(ctx, x + s - 1, y, 1, s, color); if (open(0, 1)) block(ctx, x, y + s - 1, s, 1, color);
  ctx.globalAlpha = 1;
}

const BINARY_MASS: Mass = { base: '#120f24', inset: '#1b1734', cap: '#3c3366', capLight: '#ffd2c6', capShade: '#221c40', left: '#6a3f52', right: '#2a4466', bottom: '#09071a', bottomLine: '#4f6fa0' };

/**
 * Interior cover: a joined station bulkhead lit by both stars, a warm left face and a cool right face. Inside, either
 * twin cells that trade light across a pale seam, an orbit dial with a coral and a blue bead circling, or vented ribs.
 */
export function drawBinaryCover(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string, tick: number) {
  ctx.save(); ctx.shadowBlur = 0;
  const r = joinedMass(ctx, state, tx, ty, x, y, BINARY_MASS), n = hash(tx, ty, 1);
  if (r.right) { ctx.globalAlpha = .5; ctx.fillStyle = BLUE; ctx.fillRect(x + TILE_SIZE - 2, y + (r.top ? 8 : 2), 1, TILE_SIZE - 12); ctx.globalAlpha = 1; }
  const cx = r.ix + r.iw / 2, cy = r.iy + r.ih / 2;
  if (n > .55) { // twin cells
    const phase = Math.sin(tick * .03 + tx * .9 + ty * .6), h = Math.min(18, r.ih - 10);
    ctx.fillStyle = '#0b0918'; ctx.fillRect(cx - 14, cy - h / 2 - 2, 28, h + 4);
    ctx.globalAlpha = .55 + .35 * phase; ctx.fillStyle = CORAL; ctx.fillRect(cx - 12, cy - h / 2, 10, h);
    ctx.globalAlpha = .55 - .35 * phase; ctx.fillStyle = BLUE; ctx.fillRect(cx + 2, cy - h / 2, 10, h);
    ctx.globalAlpha = .8; ctx.fillStyle = SEAM; ctx.fillRect(cx - 1, cy - h / 2 - 2, 2, h + 4);
  } else if (n > .3) { // orbit dial
    ctx.fillStyle = '#0b0918'; ctx.fillRect(cx - 12, cy - 9, 24, 18);
    ctx.globalAlpha = .35; ctx.strokeStyle = '#c9b8ff'; ctx.lineWidth = 2; ctx.strokeRect(Math.round(cx - 10) + .5, Math.round(cy - 6) + .5, 20, 12);
    const a = tick * .04 + tx + ty;
    ctx.globalAlpha = .9; ctx.fillStyle = CORAL; ctx.fillRect(Math.round(cx + Math.cos(a) * 9) - 2, Math.round(cy + Math.sin(a) * 5) - 2, 5, 5);
    ctx.fillStyle = BLUE; ctx.fillRect(Math.round(cx - Math.cos(a) * 9) - 2, Math.round(cy - Math.sin(a) * 5) - 2, 4, 4);
  } else { // vented ribs with corner bolts
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#0b0918'; ctx.fillRect(r.ix + 7, r.iy + 7 + k * 7, r.iw - 14, 3); ctx.fillStyle = '#3a3166'; ctx.fillRect(r.ix + 7, r.iy + 10 + k * 7, r.iw - 14, 1); }
    ctx.fillStyle = '#8a7fc0'; for (const [dx, dy] of [[3, 3], [r.iw - 6, 3], [3, r.ih - 6], [r.iw - 6, r.ih - 6]]) ctx.fillRect(r.ix + dx, r.iy + dy, 3, 3);
  }
  ctx.globalAlpha = 1; roomEdge(ctx, state, tx, ty, x, y, color);
  ctx.restore();
}

/**
 * Floor: dark station plates with a light top-left bevel. Every sixth column is a coral conduit and every sixth row a
 * blue one, so the warm and cool lines cross; plates have bolts or a small panel, and an orbit ring circles each pad.
 */
export function drawBinaryFloor(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string, tick: number) {
  const s = TILE_SIZE, ch = chamberOfTile(tx, ty), n = hash(tx, ty, 11);
  ctx.save(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#07061a'; ctx.fillRect(x, y, s, s);
  ctx.fillStyle = ch < 0 ? '#0a0918' : n > .66 ? '#0f0d1f' : n > .33 ? '#0e0c1d' : '#0d0b1b'; ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
  ctx.fillStyle = '#1b1834'; ctx.fillRect(x + 2, y + 2, s - 4, 1); ctx.fillRect(x + 2, y + 3, 1, s - 6);
  if (ch >= 0) { ctx.globalAlpha = .035; ctx.fillStyle = color; ctx.fillRect(x + 2, y + 2, s - 4, s - 4); }
  // Glowing conduits: dark trench, soft halo, bright core and a hot travelling pulse.
  const pulse = (k: number) => .55 + .35 * Math.max(0, Math.sin(tick * .04 - k * .5));
  const conduit = (vertical: boolean, k: number, col: string, along: number) => {
    const r = (ox: number, w: number) => vertical ? ctx.fillRect(x + s / 2 + ox, y, w, s) : ctx.fillRect(x, y + s / 2 + ox, s, w);
    ctx.globalAlpha = 1; ctx.fillStyle = '#07061a'; r(-4, 8);
    const p = pulse(k); ctx.fillStyle = col;
    ctx.globalAlpha = .1 * p; r(-7, 14); ctx.globalAlpha = .22 * p; r(-3, 6); ctx.globalAlpha = p; r(-1, 2);
    ctx.globalAlpha = .35 * p; ctx.fillStyle = '#ffffff'; r(0, 1);
    const head = ((tick * 2.2 - along * s) % (s * 9) + s * 9) % (s * 9);
    if (head < s) { ctx.globalAlpha = .85; ctx.fillStyle = '#ffffff'; vertical ? ctx.fillRect(x + s / 2 - 1, y + head - 6, 2, 12) : ctx.fillRect(x + head - 6, y + s / 2 - 1, 12, 2); ctx.globalAlpha = .3; ctx.fillStyle = col; vertical ? ctx.fillRect(x + s / 2 - 4, y + head - 10, 8, 20) : ctx.fillRect(x + head - 10, y + s / 2 - 4, 20, 8); }
  };
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
  if (tx % 6 === 3) conduit(true, ty, CORAL, ty);
  if (ty % 6 === 3) conduit(false, -tx, BLUE, tx);
  ctx.restore();
  if (tx % 6 === 3 && ty % 6 === 3) { ctx.globalAlpha = .9; ctx.fillStyle = SEAM; ctx.fillRect(x + s / 2 - 4, y + s / 2 - 4, 8, 8); ctx.globalAlpha = .8; ctx.fillStyle = '#ffffff'; ctx.fillRect(x + s / 2 - 1, y + s / 2 - 1, 2, 2); }
  else if (tx % 6 !== 3 && ty % 6 !== 3) {
    ctx.globalAlpha = 1;
    if (n > .92) { ctx.fillStyle = '#1c1938'; ctx.fillRect(x + 12, y + 12, s - 24, s - 24); ctx.fillStyle = '#100e22'; ctx.fillRect(x + 14, y + 14, s - 28, s - 28); ctx.globalAlpha = .3; ctx.fillStyle = n > .94 ? CORAL : BLUE; ctx.fillRect(x + s / 2 - 2, y + s / 2 - 2, 4, 4); }
    else if (n < .2) { ctx.fillStyle = '#211d3e'; ctx.fillRect(x + 6, y + 6, 2, 2); ctx.fillRect(x + s - 8, y + 6, 2, 2); ctx.fillRect(x + 6, y + s - 8, 2, 2); ctx.fillRect(x + s - 8, y + s - 8, 2, 2); }
  }
  if (padRing(tx, ty) === 2) { ctx.globalAlpha = .22; ctx.strokeStyle = '#c9b8ff'; ctx.lineWidth = 2; ctx.strokeRect(x + 6.5, y + 6.5, s - 13, s - 13); const warm = Math.sin(tick * .04 + tx + ty) > 0; ctx.globalAlpha = .45; ctx.fillStyle = warm ? CORAL : BLUE; ctx.fillRect(x + s / 2 - 2, y + 5, 4, 4); }
  ctx.restore();
}

/** Floor ambience: a warm light band drifts one way and a cool one the other. */
export function drawBinaryAmbience(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number) {
  const s = TILE_SIZE, left = x0 * s - camX, top = y0 * s - camY, w = (x1 - x0 + 1) * s, h = (y1 - y0 + 1) * s;
  tintWash(ctx, poleTint(state), left, top, w, h, .035); // a faint wash of your pole over the floor
  ctx.save();
  for (const [color, dir, period] of [[CORAL, 1, 2200], [BLUE, -1, 2600]] as const) {
    const head = ((tick * 1.4 * dir) % period + period) % period;
    for (let wx = Math.floor((camX + left) / period) * period - period + head; wx < camX + left + w + period; wx += period) {
      const sx = wx - camX, g = ctx.createLinearGradient(sx - 220, 0, sx + 220, 0);
      g.addColorStop(0, color + '00'); g.addColorStop(.5, color); g.addColorStop(1, color + '00');
      ctx.globalAlpha = .045; ctx.fillStyle = g; ctx.fillRect(Math.max(left, sx - 220), top, 440, h);
    }
  }
  ctx.restore();
}
