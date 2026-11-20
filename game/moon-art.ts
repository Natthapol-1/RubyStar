import { drawEnemyHealthBar } from './enemy-health-art';
import { TILE_SIZE, CHAMBER_BOUNDS, MAP_COLS, T_WALL, T_FLOOR, MOON_MARK_TICKS, MOON_REVEAL_TICKS, MOON_DARK_OVERLAY_TICKS, chamberOfTile } from './constants';
import type { Enemy, GameState } from './engine';

// The Moon challenge world (Shadow Queen): a shadowy crystal cavern beneath the lunar surface. Purely visual for now.

export const MOON_CHAMBER_COLORS = ['#b98cff', '#8f7dff', '#de9cff', '#86b8ff'] as const; // amethyst, violet, orchid, ice blue

export function isMoonMap(state: Readonly<GameState>) { return state.trial?.boss === 'splitter_queen'; }

const PALE = '#f4eaff', ICE = '#a9e6ff', SHADOW = '#05030b';
const hash = (x: number, y: number, k: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function tri(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, cx: number, cy: number) {
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
}
// Interior cover (not the outer walls, which stay open to the backdrop).
function isCover(state: Readonly<GameState>, tx: number, ty: number) {
  if ((state.map[ty]?.[tx] ?? T_WALL) !== T_WALL) return false;
  const ch = chamberOfTile(tx, ty); if (ch < 0) return false;
  const [t, l, b, r] = CHAMBER_BOUNDS[ch];
  return tx > l && tx < r && ty > t && ty < b;
}
// The diagonal light that sweeps across the crystal: 0 outside the band, 1 at its centre. World-space, so it runs
// on seamlessly from tile to tile.
function sweep(px: number, py: number, tick: number, period: number, speed: number, width: number) {
  const d = (((px + py) - tick * speed) % period + period) % period;
  return d < width ? 1 - Math.abs(d / width * 2 - 1) : 0;
}

// A distant crystal spire tapering along its entire height. Build outward from the
// tip, so extending its buried base cannot create a straight-sided stem or move its tip.
function spire(ctx: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, dir: 1 | -1, body: string, lit: string, tip: string, tipAlpha: number) {
  const step = 12, steps = Math.max(2, Math.ceil(h / step)), tipY = base - dir * h;
  for (let i = 0; i < steps; i++) {
    const distance = i * step, band = Math.min(step, h - distance);
    if (band <= 0) break;
    const sw = Math.max(4, Math.round(w * ((distance + band) / h) / 2) * 2);
    const y = dir > 0 ? tipY + distance : tipY - distance - band;
    block(ctx, x - sw / 2, y, sw, band, body);
    block(ctx, x - sw / 2, y, Math.max(2, sw * .3), band, lit);
  }
  ctx.globalAlpha *= tipAlpha; block(ctx, x - 2, dir > 0 ? tipY - 6 : tipY, 4, 6, tip); ctx.globalAlpha /= tipAlpha;
}

// Behind the station: the dark of a vast geode. Crystal spires rise from below and hang from above in two parallax
// layers, pale veins pulse inside the nearer ones, faint prism shafts sway, shadow mist drifts and lone shards turn
// slowly in the dark.
export function drawMoonBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, camX: number, camY: number, tick: number) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, '#07040f'); sky.addColorStop(.5, '#0e0722'); sky.addColorStop(1, '#060310');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, viewW, viewH);
  // Deep violet mist: stacked translucent blocks drifting very slowly.
  for (let n = 0; n < 3; n++) {
    const span = viewW + 900, nx = ((hash(n, 1, 7) * span - camX * .03 + tick * .02) % span + span) % span - 450, ny = viewH * (.2 + n * .3) - camY * .03;
    ctx.fillStyle = n === 1 ? '#3b6fa8' : '#6a3fb0';
    for (let b = 0; b < 6; b++) {
      ctx.globalAlpha = .03 + hash(n, b, 8) * .02;
      ctx.fillRect(Math.round(nx + (hash(n, b, 9) - .5) * 360), Math.round(ny + (hash(n, b, 10) - .5) * 140), 160 + hash(n, b, 11) * 220, 50 + hash(n, b, 12) * 70);
    }
  }
  // Prism shafts: narrow, faint and swaying.
  for (let k = 0; k < 4; k++) {
    const sx = ((hash(k, 2, 3) * viewW * 1.4 - camX * .05) % (viewW * 1.4) + viewW * 1.4) % (viewW * 1.4) - viewW * .2 + Math.sin(tick * .004 + k * 2) * 40;
    ctx.globalAlpha = .035 + .02 * Math.sin(tick * .01 + k);
    ctx.fillStyle = k % 2 ? ICE : '#c9a6ff';
    ctx.fillRect(Math.round(sx), 0, 26 + k * 6, viewH);
    ctx.globalAlpha *= .6; ctx.fillRect(Math.round(sx) + 8, 0, 4, viewH);
  }
  // Far cavern wall: stepped rock ledges with faint crystal seams and small glowing geodes.
  for (const [par, top, col] of [[.02, true, '#0b0619'], [.02, false, '#0b0619'], [.035, true, '#0e0820'], [.035, false, '#0e0820']] as const) {
    ctx.globalAlpha = 1; ctx.fillStyle = col;
    for (let x = -32; x < viewW + 32; x += 32) {
      const wx = Math.floor((x + camX * par) / 32), d = (par > .03 ? 60 : 30) + Math.round((Math.sin(wx * .37) * 26 + hash(wx, top ? 1 : 2, 31) * 28) / 6) * 6;
      if (top) ctx.fillRect(x, -camY * par * .4 - 40, 32, d + 40); else ctx.fillRect(x, viewH - d - camY * par * .4, 32, d + 60);
      if (par > .03 && hash(wx, top ? 3 : 4, 31) > .82) { ctx.globalAlpha = .35; ctx.fillStyle = '#6b4bb8'; ctx.fillRect(x + 8, top ? d - camY * par * .4 - 2 : viewH - d - camY * par * .4, 16, 2); ctx.globalAlpha = 1; ctx.fillStyle = col; }
    }
  }
  for (let g = 0; g < 7; g++) {
    const span = viewW + 300, gx = ((hash(g, 9, 3) * span - camX * .04) % span + span) % span - 150, gy = viewH * (.2 + hash(g, 10, 3) * .6) - camY * .04, glow = .5 + .5 * Math.sin(tick * .025 + g * 1.9), col = g % 3 ? '#b98cff' : ICE;
    // A small cluster of slanted crystals with a pale core glint, no box around it.
    for (let k = 0; k < 5; k++) {
      const ang = (k - 2) * .38, len = 10 + hash(g, k, 4) * 18, wid = 3 + hash(g, k, 5) * 3;
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(ang);
      ctx.globalAlpha = .25 + .3 * glow; ctx.fillStyle = '#4a3480'; ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(wid, -len * .25); ctx.lineTo(wid * .6, 0); ctx.lineTo(-wid * .6, 0); ctx.lineTo(-wid, -len * .25); ctx.closePath(); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -len); ctx.lineTo(-wid, -len * .25); ctx.lineTo(-wid * .6, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = .5 * glow; ctx.fillStyle = PALE; ctx.fillRect(Math.round(gx - 1), Math.round(gy - 12), 2, 6);
  }
  // Two spire layers; the far one is dim, the near one darker with glowing tips and pulsing veins.
  for (let layer = 0; layer < 2; layer++) {
    const par = layer ? .12 : .05, count = layer ? 8 : 12, span = viewW + 400;
    for (let i = 0; i < count; i++) {
      const up = (i + layer) % 3 !== 0, w = (layer ? 46 : 30) + hash(i, layer, 4) * (layer ? 50 : 30), h = viewH * ((layer ? .28 : .2) + hash(i, layer, 5) * .3);
      const x = ((hash(i, layer, 6) * span - camX * par) % span + span) % span - 200;
      const base = up ? viewH + 12 - camY * par : -12 - camY * par;
      const pulse = .55 + .45 * Math.sin(tick * .02 + i * 1.3 + layer);
      ctx.globalAlpha = layer ? .95 : .6;
      // Extend the same slope beyond the viewport: the tip retains its parallax
      // position while the whole visible body keeps widening toward its hidden root.
      const rootBase = up ? Math.max(base, viewH + 12) : Math.min(base, -12);
      const fullHeight = h + Math.abs(rootBase - base), fullWidth = w * fullHeight / h;
      spire(ctx, x, rootBase, fullWidth, fullHeight, up ? 1 : -1, layer ? '#120a26' : '#1b1238', layer ? '#2a1c52' : '#2b1f50', layer ? (i % 3 ? '#de9cff' : ICE) : '#8f7dff', layer ? pulse : .5);
      if (layer) { // a pale vein running up the middle
        ctx.globalAlpha = .18 * pulse; ctx.fillStyle = i % 3 ? '#b98cff' : ICE;
        const vh=h*.7,veinTop=up?base-vh:Math.min(base,-12),veinBottom=up?Math.max(base,viewH+12):base+vh;
        ctx.fillRect(Math.round(x-1),Math.round(veinTop),2,Math.round(veinBottom-veinTop));
        if (!up) { // drips gather at a hanging spire's tip and fall
          const tipY = base + h, cycle = (tick + i * 53) % 150, col = i % 3 ? '#de9cff' : ICE;
          ctx.globalAlpha = .5 + .3 * pulse; ctx.fillStyle = col; ctx.fillRect(Math.round(x - 2), Math.round(tipY - 2), 4, 4);
          if (cycle < 90) { const fy = tipY + 4 + cycle * cycle * .05; if (fy < viewH) { ctx.globalAlpha = .6 * (1 - cycle / 90); ctx.fillRect(Math.round(x - 1), Math.round(fy), 2, 5); } }
        }
      }
    }
  }
  // Lone shards turning slowly in the dark: whole solid diamonds, rotated as one shape.
  for (let k = 0; k < 10; k++) {
    const span = viewW + 300, x = ((hash(k, 4, 2) * span - camX * .09 + tick * .04 * (1 + k % 3)) % span + span) % span - 150;
    const y = viewH * (.15 + hash(k, 5, 2) * .7) + Math.sin(tick * .01 + k) * 12 - camY * .09, r = 6 + hash(k, 6, 2) * 10;
    ctx.save(); ctx.translate(x, y); ctx.rotate(tick * .004 * (k % 2 ? 1 : -1) + k);
    ctx.globalAlpha = .4 + .2 * Math.sin(tick * .03 + k);
    ctx.fillStyle = '#4a3480'; ctx.beginPath(); ctx.moveTo(0, -r * 1.6); ctx.lineTo(r, 0); ctx.lineTo(0, r * 1.6); ctx.lineTo(-r, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = k % 3 ? '#9f7dff' : '#6fa8e0'; ctx.beginPath(); ctx.moveTo(0, -r * 1.6); ctx.lineTo(0, r * 1.6); ctx.lineTo(-r, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALE; ctx.globalAlpha *= .8; ctx.fillRect(-1, -r * 1.2, 2, r * 1.4);
    ctx.restore();
  }
  // Crystal dust: a few pale glints that twinkle as four-point sparkles.
  for (let i = 0; i < 40; i++) {
    const x = ((hash(i, 2, 1) * viewW * 1.5 - camX * .08) % viewW + viewW) % viewW, y = ((hash(i, 3, 1) * viewH * 1.5 - camY * .08) % viewH + viewH) % viewH;
    const tw = Math.max(0, Math.sin(tick * .03 + i * 2.1));
    ctx.globalAlpha = .12 + .4 * tw; ctx.fillStyle = i % 4 ? '#dcd0ff' : ICE; ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
    if (tw > .85) { ctx.globalAlpha = (tw - .85) * 3; ctx.fillRect(Math.round(x) - 4, Math.round(y), 10, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - 4, 1, 10); }
  }
  // Shadow vignette: the cavern closes in at top and bottom.
  ctx.globalAlpha = 1;
  const v = ctx.createLinearGradient(0, 0, 0, viewH);
  v.addColorStop(0, '#000000aa'); v.addColorStop(.25, '#00000000'); v.addColorStop(.75, '#00000000'); v.addColorStop(1, '#000000aa');
  ctx.fillStyle = v; ctx.fillRect(0, 0, viewW, viewH);
  ctx.restore();
}

// A cover block made of crystal. Five broad cuts vary the polished geode's faces,
// shaded as lit from the top left in its room colour or a cold ice tint, with a deeper inner facet seen through the
// surface, thin pale facet edges, a bright rim only where the block meets open floor, and a glint sweeping across.
export function drawMoonCrystalBlock(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string, tick: number) {
  const s = TILE_SIZE, cut = Math.floor(hash(tx, ty, 1) * 5), hue = hash(tx, ty, 2);
  const tint = hue > .84 ? '#dc96ee' : hue < .08 ? '#97b8e6' : color, lift = .8 + hash(tx, ty, 3) * .38;
  const x1 = x + s, y1 = y + s;
  ctx.save(); ctx.shadowBlur = 0;
  block(ctx, x, y, s, s, '#120a26');
  ctx.fillStyle = tint; ctx.strokeStyle = PALE; ctx.lineWidth = 1;
  const edges: number[][] = [];
  if (cut === 0) { // split top-left to bottom-right: the upper-right face catches the light
    ctx.globalAlpha = .42 * lift; tri(ctx, x, y, x1, y, x1, y1);
    ctx.globalAlpha = .2 * lift; tri(ctx, x, y, x, y1, x1, y1);
    edges.push([x, y, x1, y1]);
  } else if (cut === 1) { // split top-right to bottom-left: the upper-left face is lit
    ctx.globalAlpha = .46 * lift; tri(ctx, x, y, x1, y, x, y1);
    ctx.globalAlpha = .14 * lift; tri(ctx, x1, y, x1, y1, x, y1);
    edges.push([x1, y, x, y1]);
  } else if (cut === 2) { // an off-centre point
    const px = x + s * (.3 + hash(tx, ty, 4) * .4), py = y + s * (.3 + hash(tx, ty, 5) * .4);
    ctx.globalAlpha = .44 * lift; tri(ctx, x, y, x1, y, px, py);
    ctx.globalAlpha = .3 * lift; tri(ctx, x, y, x, y1, px, py);
    ctx.globalAlpha = .15 * lift; tri(ctx, x1, y, x1, y1, px, py);
    ctx.globalAlpha = .07 * lift; tri(ctx, x, y1, x1, y1, px, py);
    edges.push([x, y, px, py], [x1, y, px, py], [x, y1, px, py], [x1, y1, px, py]);
  } else if (cut === 3) { // a broad upright cleavage face, like the cavern's crystal spires
    const px = x + s * (.35 + hash(tx, ty, 4) * .2);
    ctx.globalAlpha = .18 * lift; ctx.fillRect(x, y, s, s);
    ctx.globalAlpha = .43 * lift; tri(ctx, x, y, px, y, px - 5, y1);
    ctx.globalAlpha = .29 * lift; tri(ctx, x, y, px - 5, y1, x, y1);
    ctx.globalAlpha = .12 * lift; tri(ctx, px, y, x1, y1, px - 5, y1);
    edges.push([px, y, px - 5, y1]);
  } else { // a wide tabular crystal with quiet stepped inner shelves
    ctx.globalAlpha = .27 * lift; ctx.fillRect(x, y, s, s);
    ctx.globalAlpha = .37 * lift;
    block(ctx, x + 5, y + 5, s - 12, 15, tint); block(ctx, x + 10, y + 20, s - 18, 10, tint);
    ctx.globalAlpha = .18 * lift; tri(ctx, x + 5, y + 20, x1 - 7, y + 20, x + 10, y1 - 4);
    edges.push([x + 5, y + 20, x1 - 7, y + 20], [x + 10, y + 30, x1 - 8, y + 30]);
  }
  // Occasional smoky inclusions add depth inside the material without surface ornaments.
  if (hash(tx, ty, 17) > .78) {
    ctx.globalAlpha = .24;
    block(ctx, x + 8, y + 25, 18, 4, '#0b071c'); block(ctx, x + 18, y + 29, 17, 6, '#0b071c');
  }
  // In some tiles, a deeper facet inside the crystal slowly brightens and dims, with an ice-blue spark at its tip.
  if (hash(tx, ty, 9) > .55) {
    const pulse = .55 + .45 * Math.sin(tick * .03 + tx * 1.3 + ty * .7);
    const ix = x + 10 + hash(tx, ty, 6) * 14, iy = y + 8 + hash(tx, ty, 7) * 12, iw = 10 + hash(tx, ty, 8) * 8;
    ctx.globalAlpha = .16 + .16 * pulse; ctx.fillStyle = tint;
    ctx.beginPath(); ctx.moveTo(ix + iw / 2, iy); ctx.lineTo(ix + iw, iy + iw * .7); ctx.lineTo(ix + iw / 2, iy + iw * 1.4); ctx.lineTo(ix, iy + iw * .7); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = .3 + .6 * pulse; block(ctx, ix + iw / 2 - 1.5, iy + 2, 3, 3, ICE);
  }
  // Facet edges.
  ctx.globalAlpha = .22; ctx.beginPath();
  for (const [ax, ay, bx, by] of edges) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
  ctx.stroke();
  // Glint: a straight pale band on the line x + y = const, sweeping across all crystal in world space, clipped to
  // the block. A thin second line trails it.
  const period = 1800, u0 = (tx + ty) * s, head = ((tick * 2.2) % period + period) % period;
  const centre = u0 - ((u0 - head) % period + period) % period + period; // the next band position at or after this tile
  for (const c of [centre - period, centre]) {
    if (c < u0 - 30 || c > u0 + 2 * s + 30) continue;
    const C = c - (tx * s - x) - (ty * s - y); // to screen space
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip(); ctx.fillStyle = PALE;
    const band = (mid: number, hw: number, alpha: number) => {
      ctx.globalAlpha = alpha; ctx.beginPath();
      ctx.moveTo(mid - hw - (y - s), y - s); ctx.lineTo(mid + hw - (y - s), y - s); ctx.lineTo(mid + hw - (y + 2 * s), y + 2 * s); ctx.lineTo(mid - hw - (y + 2 * s), y + 2 * s);
      ctx.closePath(); ctx.fill();
    };
    band(C, 7, .38); band(C - 22, 2, .3);
    ctx.restore();
  }
  // Rim on exposed edges; the top edge also catches a pale highlight.
  const open = (dx: number, dy: number) => !isCover(state, tx + dx, ty + dy);
  ctx.globalAlpha = .85; ctx.fillStyle = color;
  if (open(0, -1)) block(ctx, x, y, s, 2, color);
  if (open(-1, 0)) block(ctx, x, y, 2, s, color);
  if (open(1, 0)) block(ctx, x + s - 2, y, 2, s, color);
  if (open(0, 1)) block(ctx, x, y + s - 2, s, 2, color);
  if (open(0, -1)) { ctx.globalAlpha = .55; block(ctx, x + 4, y + 3, s * .45, 1, PALE); }
  ctx.restore();
}

// Light bands along x + y = C crossing the given screen rectangle: soft-edged, repeating every `period` world px.
function sheen(ctx: CanvasRenderingContext2D, camX: number, camY: number, left: number, top: number, w: number, h: number, tick: number, period: number, speed: number, half: number, color: string, alpha: number) {
  const head = ((tick * speed) % period + period) % period, lo = left + top + camX + camY - half * 2, hi = left + top + w + h + camX + camY + half * 2;
  for (let u = lo - ((lo - head) % period + period) % period; u <= hi; u += period) {
    if (u < lo) continue;
    const C = u - camX - camY, qx = C / 2, qy = C / 2;
    const g = ctx.createLinearGradient(qx - half, qy - half, qx + half, qy + half);
    g.addColorStop(0, color + '00'); g.addColorStop(.42, color); g.addColorStop(.5, PALE); g.addColorStop(.58, color); g.addColorStop(1, color + '00');
    ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(left, top, w, h);
  }
}

/** The eclipse and glitter stay anchored to the dark chamber floor. */
export function drawMoonDarkRoom(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, room: number, opacity: number, camX: number, camY: number, tick: number) {
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[room];
  const x = c1 * TILE_SIZE - camX, y = r1 * TILE_SIZE - camY;
  const w = (c2 - c1 + 1) * TILE_SIZE, h = (r2 - r1 + 1) * TILE_SIZE;
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.beginPath();
  for (let row = r1; row <= r2; row++) for (let col = c1; col <= c2; col++) {
    if (state.map[row]?.[col] === T_WALL || chamberOfTile(col, row) !== room) continue;
    ctx.rect(col * TILE_SIZE - camX, row * TILE_SIZE - camY, TILE_SIZE, TILE_SIZE);
  }
  ctx.clip();
  ctx.globalAlpha = opacity;
  block(ctx, x, y, w, h, '#030108');
  // The eclipse is a dim floor imprint. The crest is brighter than the disc.
  const radius = Math.round(Math.min(w, h) * .14 / 8) * 8;
  const cx = x + w / 2, cy = y + h / 2;
  const pulse = .83 + .17 * Math.sin(tick * .025 + room);
  for (const [offset, scale, color, alpha] of [
    [0, 1.08, '#32204d', .21], [0, 1, '#8262ab', .27], [8, .99, '#060210', .88],
  ] as const) {
    const r = radius * scale;
    ctx.globalAlpha = opacity * alpha * (offset ? 1 : pulse);
    for (let dy = -Math.floor(r / 8) * 8; dy <= r; dy += 8) {
      const half = Math.round(Math.sqrt(Math.max(0, r * r - dy * dy)) / 8) * 8;
      if (half > 0) block(ctx, cx + offset - half, cy - offset + dy, half * 2, 8, color);
    }
  }

  const glitter = ['#593a82', '#7950a5', '#a975c6', '#59509b'];
  for (let i = 0; i < 96; i++) {
    const life = ((tick * (.32 + i % 4 * .07) + i * 19) % 85) / 85;
    const twinkle = Math.pow(Math.sin(life * Math.PI), 4);
    const px = x + (w - 64) * hash(room, i, 21) + 32 + life * 10;
    const py = y + (h - 80) * hash(room, i, 27) + 40 - life * 12;
    const color = glitter[i % glitter.length];
    ctx.globalAlpha = opacity * twinkle * (i % 5 === 0 ? .76 : .52);
    if (i % 5 === 0) {
      block(ctx, px - 4, py, 10, 2, color);
      block(ctx, px, py - 4, 2, 10, color);
      block(ctx, px, py, 2, 2, '#ba94d3');
    } else {
      block(ctx, px, py, i % 3 ? 2 : 4, 2, color);
    }
  }
  ctx.restore();
}

export function drawMoonDarkOverlay(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number, tick: number) {
  const progress = (state.moon?.darkOverlayTicks ?? 0) / MOON_DARK_OVERLAY_TICKS;
  if (progress <= 0) return;
  const opacity = progress * progress * (3 - 2 * progress);
  const cx = w / 2, cy = h * .43;
  ctx.save();
  ctx.shadowBlur = 0;

  // A deeper translucent wash gives the darkness weight while the centre stays readable.
  ctx.globalAlpha = opacity * .16;
  block(ctx, 0, 0, w, h, '#140923');

  // The perimeter catches a cold corona, with deeper indigo toward the centre.
  const rim = ctx.createRadialGradient(cx, cy, w * .1, cx, cy, w * .66);
  rim.addColorStop(0, 'rgba(3,1,8,0)');
  rim.addColorStop(.55, 'rgba(20,9,39,.29)');
  rim.addColorStop(.83, 'rgba(37,17,68,.56)');
  rim.addColorStop(1, 'rgba(75,44,119,.75)');
  ctx.globalAlpha = opacity;
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, w, h);

  // Low, layered bands drift across the shadow without bringing back the floor grid.
  for (let i = 0; i < 11; i++) {
    const bandY = (i * 79 + tick * (.28 + i % 3 * .13)) % h;
    const bandX = (hash(0, i, 5) - .4) * w;
    ctx.globalAlpha = opacity * (.09 + i % 3 * .03);
    block(ctx, bandX, bandY, w * .9, 9 + i % 4 * 8, i % 3 ? '#322053' : '#5f4085');
    block(ctx, bandX + w * .12, bandY - 5, w * .58, 5, '#674997');
  }

  // A few silver-violet shards drift across the overlay.
  for (let i = 0; i < 72; i++) {
    const px = (hash(0, i, 9) * w + tick * (.35 + i % 4 * .16)) % w;
    const py = (hash(0, i, 13) * h + tick * .14) % h;
    const twinkle = .35 + .65 * Math.pow(Math.max(0, Math.sin(tick * .047 + i * 2.4)), 3);
    ctx.globalAlpha = opacity * twinkle * (i % 6 ? .26 : .58);
    block(ctx, px, py, i % 6 ? 3 : 9, 3, i % 6 ? '#8e68c6' : '#e9d5ff');
    if (i % 6 === 0) block(ctx, px + 3, py - 3, 3, 9, '#bfa1ff');
  }
  ctx.restore();
}

// On the station floor: polished dark crystal. Soft diagonal sheens sweep across it (a broad violet one and a thin
// ice-blue one), crystal grain lines catch the light, blocks reflect into the floor below them, dark mist drifts
// over everything, small set crystals and rare runes glimmer, and magic motes rise through the rooms.
export function drawMoonAmbience(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number) {
  const s = TILE_SIZE, left = x0 * s - camX, top = y0 * s - camY, w = (x1 - x0 + 1) * s, h = (y1 - y0 + 1) * s;
  ctx.save(); ctx.shadowBlur = 0;
  // Clip to open floor (pads stay clean) for the sheen and the mist.
  ctx.save(); ctx.beginPath();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { // one rectangle per run of floor in a row
    if (state.map[ty]?.[tx] !== T_FLOOR) continue;
    const start = tx; while (tx < x1 && state.map[ty]?.[tx + 1] === T_FLOOR) tx++;
    ctx.rect(start * s - camX, ty * s - camY, (tx - start + 1) * s, s);
  }
  ctx.clip();
  sheen(ctx, camX, camY, left, top, w, h, tick, 1700, 1.4, 150, '#b98cff', .09);
  sheen(ctx, camX, camY, left, top, w, h, tick + 520, 2300, 1.9, 40, ICE, .1);
  // Shadow mist: large dark patches drifting slowly around fixed points in the world.
  const mapW = (state.map[0]?.length ?? 0) * s, mapH = state.map.length * s;
  for (let k = 0; k < 40; k++) {
    const mx = hash(k, 1, 13) * mapW + Math.sin(tick * .003 + k * 2.4) * 160 - camX;
    const my = hash(k, 2, 13) * mapH + Math.cos(tick * .0025 + k * 1.7) * 120 - camY, r = s * (3 + hash(k, 3, 13) * 3);
    if (mx + r < left || mx - r > left + w || my + r < top || my - r > top + h) continue;
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, r);
    g.addColorStop(0, SHADOW + 'b0'); g.addColorStop(.6, SHADOW + '50'); g.addColorStop(1, SHADOW + '00');
    ctx.globalAlpha = .7 + .3 * Math.sin(tick * .01 + k); ctx.fillStyle = g; ctx.fillRect(mx - r, my - r, r * 2, r * 2);
  }
  ctx.restore();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (state.map[ty]?.[tx] !== T_FLOOR) continue;
    const x = tx * s - camX, y = ty * s - camY, ch = chamberOfTile(tx, ty), color = ch >= 0 ? MOON_CHAMBER_COLORS[ch] : '#c9b6ff';
    // Crystal grain: a faint straight line in some tiles that brightens as the sheen passes.
    if (hash(tx, ty, 10) > .78) {
      const lit = sweep(tx * s, ty * s, tick, 1700, 1.4, 300), vertical = hash(tx, ty, 14) > .5, at = 8 + Math.floor(hash(tx, ty, 15) * 32);
      ctx.globalAlpha = .07 + .3 * lit;
      if (vertical) block(ctx, x + at, y + 6, 1, s - 12, PALE); else block(ctx, x + 6, y + at, s - 12, 1, PALE);
    }
    // Reflection of a crystal block standing just above: a glow fading down the floor.
    if (isCover(state, tx, ty - 1)) {
      const g = ctx.createLinearGradient(0, y, 0, y + s * .7), shimmer = .8 + .2 * Math.sin(tick * .03 + tx * .9);
      g.addColorStop(0, color + '40'); g.addColorStop(1, color + '00');
      ctx.globalAlpha = shimmer; ctx.fillStyle = g; ctx.fillRect(x, y, s, s * .7);
    }
    // Set crystals: a small faceted gem in a few tiles that twinkles.
    if (hash(tx, ty, 7) > .9) {
      const gx = x + 12 + hash(tx, ty, 8) * 24, gy = y + 12 + hash(tx, ty, 9) * 24, tw = Math.max(0, Math.sin(tick * .045 + tx * 1.7 + ty));
      ctx.globalAlpha = .55; ctx.fillStyle = '#5a3d9e'; tri(ctx, gx, gy - 5, gx + 4, gy, gx, gy + 5); ctx.fillStyle = color; tri(ctx, gx, gy - 5, gx - 4, gy, gx, gy + 5);
      ctx.globalAlpha = .4 + .5 * tw; block(ctx, gx - 1, gy - 1, 2, 2, PALE);
      if (tw > .8) { ctx.globalAlpha = (tw - .8) * 3; block(ctx, gx - 6, gy, 12, 1, PALE); block(ctx, gx, gy - 6, 1, 12, PALE); }
    }
    // Runes: a rare sigil that slowly fades in and out: a square frame, a turning diamond and four corner marks.
    if (hash(tx, ty, 11) > .98) {
      const life = Math.max(0, Math.sin(tick * .008 + hash(tx, ty, 12) * 20));
      if (life > 0) {
        const cx = x + s / 2, cy = y + s / 2;
        ctx.globalAlpha = .22 * life; ctx.strokeStyle = ICE; ctx.lineWidth = 1.5; ctx.strokeRect(x + 8.5, y + 8.5, s - 17, s - 17);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(tick * .006 + tx); ctx.globalAlpha = .4 * life; ctx.lineWidth = 2; ctx.strokeRect(-8, -8, 16, 16); ctx.restore();
        ctx.globalAlpha = .5 * life;
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) block(ctx, cx + dx * 15 - 1.5, cy + dy * 15 - 1.5, 3, 3, ICE);
        ctx.globalAlpha = .7 * life; block(ctx, cx - 2, cy - 2, 4, 4, PALE);
      }
    }
  }
  // Phase 2+ mirror tiles: a framed silver-lilac pane with a bright glint sliding across it. Walkable, but they bounce
  // your shots back.
  // When they move, the old panes fade out and the new ones fade in with a pale flash.
  const fade = state.moon ? state.moon.mirrorFade / 30 : 0;
  const panes = [...(state.moon?.oldMirrors ?? []).map(i => [i, fade] as const), ...(state.moon?.mirrors ?? []).map(i => [i, 1 - fade] as const)];
  for (const [index, visible] of panes) {
    if (visible <= 0) continue;
    const tx = index % MAP_COLS, ty = Math.floor(index / MAP_COLS);
    if (tx < x0 || tx > x1 || ty < y0 || ty > y1) continue;
    const x = tx * s - camX, y = ty * s - camY;
    ctx.save(); ctx.globalAlpha = visible; const alphaScale = visible;
    if (visible < 1 && (state.moon?.mirrors ?? []).includes(index)) { ctx.globalAlpha = (1 - visible) * .6; block(ctx, x, y, s, s, PALE); ctx.globalAlpha = visible; }
    ctx.globalAlpha = .4 * alphaScale; block(ctx, x + 3, y + 3, s - 6, s - 6, '#2c2450'); // see-through: the floor shows beneath
    const g = ctx.createLinearGradient(x, y, x + s, y + s);
    g.addColorStop(0, '#b8aef0'); g.addColorStop(.5, '#6a5cb0'); g.addColorStop(1, '#c9c0ff');
    ctx.globalAlpha = .32 * alphaScale; ctx.fillStyle = g; ctx.fillRect(x + 6, y + 6, s - 12, s - 12);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, s - 12, s - 12); ctx.clip();
    const d = ((tick * 1.5 + (tx + ty) * 14) % 120) - 30;
    ctx.globalAlpha = .5 * alphaScale; ctx.fillStyle = PALE; ctx.beginPath(); ctx.moveTo(x + d, y); ctx.lineTo(x + d + 8, y); ctx.lineTo(x + d - 40, y + s); ctx.lineTo(x + d - 48, y + s); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = .75 * alphaScale; ctx.strokeStyle = '#e6dcff'; ctx.lineWidth = 2; ctx.strokeRect(x + 4, y + 4, s - 8, s - 8);
    const tw = Math.max(0, Math.sin(tick * .06 + tx * 1.3 + ty));
    if (tw > .7) { ctx.globalAlpha = (tw - .7) * 3 * alphaScale; block(ctx, x + 9, y + 8, 6, 1, PALE); block(ctx, x + 11.5, y + 5.5, 1, 6, PALE); }
    ctx.restore();
  }
  // Magic motes rising through the rooms, violet and ice blue, each with a short tail. Each one loops on a fixed
  // world column, so the camera moving never makes them jump.
  const worldH = state.map.length * s, worldW = (state.map[0]?.length ?? 0) * s;
  for (let k = 0; k < 160; k++) {
    const fx = hash(k, 5, 1) * worldW + Math.sin(tick * .01 + k * 2) * 40 - camX;
    const fy = worldH - ((tick * (.3 + hash(k, 7, 1) * .3) + hash(k, 8, 1) * worldH) % worldH) - camY;
    if (fx < left - 10 || fx > left + w + 10 || fy < top - 10 || fy > top + h + 10) continue;
    const c = k % 3 ? '#d6c2ff' : ICE, a = .3 + .3 * Math.sin(tick * .05 + k);
    ctx.globalAlpha = a; block(ctx, fx, fy, 3, 3, c);
    ctx.globalAlpha = a * .4; block(ctx, fx + 1, fy + 3, 1, 6, c);
  }
  ctx.restore();
}

// The tell: only the real Queen casts a reflection on the crystal floor, a faint violet glow and a mirrored tiara
// below her. Illusions have none.
export function drawMoonReflection(ctx: CanvasRenderingContext2D, sx: number, sy: number, tick: number) {
  const half = Math.floor(TILE_SIZE * .4), top = sy + half + 2, shimmer = .75 + .25 * Math.sin(tick * .05);
  ctx.save(); ctx.shadowBlur = 0;
  const g = ctx.createLinearGradient(0, top, 0, top + 20);
  g.addColorStop(0, '#cc33ff66'); g.addColorStop(1, '#cc33ff00');
  ctx.globalAlpha = shimmer; ctx.fillStyle = g; ctx.fillRect(sx - half + 3, top, half * 2 - 6, 20);
  ctx.globalAlpha = .35 * shimmer; ctx.fillStyle = '#ddaaff'; // mirrored tiara, pointing down
  block(ctx, sx - 2, top + 3, 4, 9, '#ddaaff'); block(ctx, sx - half + 5, top + 3, 4, 5, '#ddaaff'); block(ctx, sx + half - 9, top + 3, 4, 5, '#ddaaff');
  ctx.restore();
}

/** Banked healing released where the Queen departed: floor-only lunar light and crisp crystal motes. */
function drawMoonHealing(ctx: CanvasRenderingContext2D,state:Readonly<GameState>,camX:number,camY:number) {
  for(const fx of state.moon?.healPulses??[]) {
    const p=1-fx.ticks/90,fade=Math.sin(Math.PI*p)**.7,[top,left,bottom,right]=CHAMBER_BOUNDS[fx.room];
    const x=fx.x-camX,y=fx.y-camY,reach=Math.max(...[[left,top],[right,top],[left,bottom],[right,bottom]].map(([tx,ty])=>Math.hypot(tx*TILE_SIZE-fx.x,ty*TILE_SIZE-fx.y)));
    ctx.save();ctx.beginPath();
    for(let ty=top+1;ty<bottom;ty++)for(let tx=left+1;tx<right;tx++)if(state.map[ty]?.[tx]===T_FLOOR)ctx.rect(tx*TILE_SIZE-camX,ty*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE);
    ctx.clip();
    // A broad violet aura blooms through the room, still clipped to open floor.
    const aura=ctx.createRadialGradient(x,y,20,x,y,reach*.85);
    aura.addColorStop(0,'#d9c4ff55');aura.addColorStop(.4,'#a9e6ff22');aura.addColorStop(1,'#8861d800');
    ctx.globalAlpha=fade*.7;ctx.fillStyle=aura;ctx.fillRect(left*TILE_SIZE-camX,top*TILE_SIZE-camY,(right-left)*TILE_SIZE,(bottom-top)*TILE_SIZE);
    // A soft band sweeps across the old room without washing the whole screen white.
    for(let ty=top+1;ty<bottom;ty++)for(let tx=left+1;tx<right;tx++) {
      const d=Math.hypot((tx+.5)*TILE_SIZE-fx.x,(ty+.5)*TILE_SIZE-fx.y),wave=reach*Math.min(1,p*1.65);
      const band=Math.max(0,1-Math.abs(d-wave)/(TILE_SIZE*1.1));
      ctx.globalAlpha=fade*(.04+.26*band);block(ctx,tx*TILE_SIZE-camX+2,ty*TILE_SIZE-camY+2,TILE_SIZE-4,TILE_SIZE-4,band>.5?ICE:'#b98cff');
    }
    for(let k=0;k<84;k++) {
      const tx=left+1+hash(k,fx.room,7)*(right-left-2),ty=top+1+hash(k,fx.room,9)*(bottom-top-2);
      const life=(p*1.4+hash(k,fx.room,3))%1,mx=tx*TILE_SIZE-camX,my=ty*TILE_SIZE-camY-life*48;
      ctx.shadowColor=k%3?ICE:'#c59aff';ctx.shadowBlur=k%4===0?6:0;
      ctx.globalAlpha=fade*Math.sin(life*Math.PI)*.85;ctx.save();ctx.translate(mx,my);ctx.rotate(Math.PI/4);
      block(ctx,-2,-2,k%4?4:7,k%4?4:7,k%3?ICE:PALE);ctx.restore();
      if(k%5===0){ctx.globalAlpha=fade*.65;block(ctx,mx-7,my-1,14,2,PALE);block(ctx,mx-1,my-7,2,14,PALE);}
    }
    ctx.shadowBlur=0;
    // A broken square seal opens where she stood, with a pale crystal at each corner.
    const radius=24+Math.min(1,p*2)*90;
    ctx.globalAlpha=fade*(1-p)*.85;ctx.strokeStyle=ICE;ctx.lineWidth=3;
    for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      const sx=x+dx*radius,sy=y+dy*radius;
      ctx.beginPath();ctx.moveTo(sx-dx*18,sy);ctx.lineTo(sx,sy);ctx.lineTo(sx,sy-dy*18);ctx.stroke();
      block(ctx,sx-3,sy-3,6,6,PALE);
    }
    ctx.restore();
    for(const [i,target] of fx.targets.entries()) {
      const px=target.x-camX,py=target.y-camY;
      ctx.save();ctx.shadowColor=ICE;ctx.shadowBlur=5;
      // Open square aura around each recipient, with orbiting solid crystal fragments.
      const radius=29+Math.sin(p*Math.PI)*7;
      ctx.strokeStyle=target.ruby?'#d9c4ff':ICE;ctx.lineWidth=3;ctx.globalAlpha=fade*.65;
      for(const [dx,dy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        const ax=px+dx*radius,ay=py+dy*radius;
        ctx.beginPath();ctx.moveTo(ax-dx*12,ay);ctx.lineTo(ax,ay);ctx.lineTo(ax,ay-dy*12);ctx.stroke();
      }
      for(let k=0;k<8;k++){
        const a=k*Math.PI/4+p*2,r=radius+8;
        ctx.save();ctx.translate(px+Math.cos(a)*r,py+Math.sin(a)*r*.7);ctx.rotate(a+.4);
        ctx.globalAlpha=fade*.7;block(ctx,-2,-4,4,8,k%2?ICE:PALE);ctx.restore();
      }
      for(let k=0;k<8;k++){
        const life=(p*1.6+k/8)%1,gx=px+Math.sin(k*2.4+i)*34,gy=py+18-life*80;
        ctx.globalAlpha=fade*Math.sin(life*Math.PI)*.9;
        block(ctx,gx-5,gy-1.5,10,3,target.ruby?'#d9c4ff':ICE);block(ctx,gx-1.5,gy-5,3,10,PALE);
      }
      ctx.restore();
    }
  }
}

// Arrival frames (she and her new illusions appear together), her disguise breaking at the reveal, and the crystal
// shards thrown by a destroyed illusion.
export function drawMoonEffects(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const moon = state.moon; if (!moon) return;
  ctx.save(); ctx.shadowBlur = 0;
  drawMoonHealing(ctx,state,camX,camY);
  for (const a of moon.arrivals) {
    const t = 1 - a.ticks / 30, size = Math.round((18 + t * 40) / 4) * 4, x = a.x - camX, y = a.y - camY;
    ctx.globalAlpha = (1 - t) * .8; ctx.strokeStyle = PALE; ctx.lineWidth = 2; ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    ctx.globalAlpha = (1 - t) * .5; ctx.strokeStyle = '#dd88ff'; ctx.lineWidth = 4; ctx.strokeRect(x - size / 2 - 6, y - size / 2 - 6, size + 12, size + 12);
  }
  const boss = moon.unmask && state.enemies.find(e => e.id === moon.unmask!.id);
  if (moon.unmask && boss) {
    const t = 1 - moon.unmask.ticks / 24, x = boss.x - camX, y = boss.y - camY;
    ctx.globalAlpha = (1 - t) * .55; block(ctx, x - 22, y - 22, 44, 44, PALE);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4 + .3, d = 14 + t * 34;
      ctx.globalAlpha = 1 - t; block(ctx, x + Math.cos(a) * d - 3, y + Math.sin(a) * d - 3, 6, 6, i % 2 ? '#dd88ff' : PALE);
    }
  }
  // Moon Mark: a luminous lunar seal, with a brief caster-to-target inscription.
  const marked = moon.mark && state.enemies.find(e => e.id === moon.mark!.id);
  if (moon.mark && marked) {
    const age = MOON_MARK_TICKS - moon.mark.ticks;
    const x = Math.round(marked.x - camX), y = Math.round(marked.y - camY);
    ctx.save();
    if (age < 32) {
      const t = age / 32, fade = 1-t;
      const px = (moon.mark.fromX ?? state.playerX)-camX, py = (moon.mark.fromY ?? state.playerY)-camY;
      // A small square seal opens at the caster; three whole rectangular lights travel outward.
      const radius = 13 + t*22;
      ctx.globalAlpha = fade*.6; ctx.shadowColor = ICE; ctx.shadowBlur = 5;
      for (const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
        block(ctx,px+dx*radius-(dx>0?7:0),py+dy*radius,7,2,ICE);
        block(ctx,px+dx*radius,py+dy*radius-(dy>0?7:0),2,7,ICE);
      }
      const angle = Math.atan2(y-py,x-px);
      for(let k=0;k<3;k++) {
        const progress = Math.max(0,Math.min(1,age/15-k*.12)), ease = 1-Math.pow(1-progress,2);
        if(progress>=1)continue;
        ctx.save();ctx.translate(px+(x-px)*ease,py+(y-py)*ease);ctx.rotate(angle);
        ctx.globalAlpha=(1-progress)*.75;block(ctx,-12,-3,20,6,'#70c9ff');
        ctx.globalAlpha=1-progress;block(ctx,-7,-1,13,2,PALE);ctx.restore();
      }
      // An interrupted square shock-seal and cardinal glints settle around the recipient.
      const impact = Math.max(0,(age-7)/25), r = 24+impact*33;
      ctx.shadowBlur=4;ctx.globalAlpha=Math.sin(impact*Math.PI)*.65;
      for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
        block(ctx,x+dx*r-(dx>0?14:0),y+dy*r,14,3,ICE);
        block(ctx,x+dx*r,y+dy*r-(dy>0?14:0),3,14,ICE);
      }
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
        const d=32+impact*24;
        block(ctx,x+dx*d-(dy?2:5),y+dy*d-(dx?2:5),dy?4:10,dx?4:10,PALE);
      }
    }
    if (moon.mark.ticks > 60 || Math.floor(tick / 6) % 2 === 0) {
      const settle = Math.pow(Math.max(0,1-age/22),2), r = 29 + settle*15;
      ctx.shadowColor = '#78ccff'; ctx.shadowBlur = 5;
      ctx.globalAlpha = .85 + .1*Math.sin(tick*.075);
      // Dark backing and pale upper lips keep the four solid brackets readable on crystal and darkness.
      for (const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]) {
        const bx=x+dx*r-(dx>0?11:0), by=y+dy*r-(dy>0?4:0);
        block(ctx,bx-1,by-1,13,6,'#10253e');block(ctx,bx,by,11,4,ICE);
        block(ctx,x+dx*r-(dx>0?4:0),y+dy*r-(dy>0?11:0),4,11,ICE);
        ctx.shadowBlur=0;block(ctx,bx+1,by,9,1,PALE);ctx.shadowBlur=5;
      }
      // A filled stepped diamond is the persistent identifier, floating above the head.
      const sy = y-r-18 + Math.round(Math.sin(tick*.06)*2);
      ctx.globalAlpha=.95;
      block(ctx,x-4,sy-10,8,20,ICE);block(ctx,x-7,sy-6,14,12,ICE);block(ctx,x-10,sy-3,20,6,ICE);
      ctx.shadowBlur=0;
      block(ctx,x-3,sy-6,6,12,'#163454');block(ctx,x-6,sy-3,12,6,'#163454');
      block(ctx,x-2,sy-3,4,6,PALE);
      block(ctx,x-2,sy+13,4,3,ICE);block(ctx,x-1,sy+17,2,3,PALE);
      // Two separated orbit glints avoid covering the marked model with a wash.
      for(let i=0;i<2;i++) {
        const a=tick*.025+i*Math.PI, gx=x+Math.cos(a)*(r+5), gy=y+Math.sin(a)*(r+5);
        ctx.globalAlpha=.6;block(ctx,gx-2,gy-2,4,4,ICE);
        ctx.globalAlpha=.8;block(ctx,gx-1,gy-1,2,2,PALE);
      }
    }
    ctx.restore();
  }
  // A shot bounced off a mirror: a pale streak from the mirror back to you and a small cross flash on the pane.
  for (const r of moon.reflects) {
    const k = r.ticks / 16, mx = r.x - camX, my = r.y - camY, px = r.toX - camX, py = r.toY - camY;
    ctx.globalAlpha = k; ctx.strokeStyle = PALE; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + (px - mx) * (1 - k * .6), my + (py - my) * (1 - k * .6)); ctx.stroke();
    block(ctx, mx - 10, my - 1.5, 20, 3, PALE); block(ctx, mx - 1.5, my - 10, 3, 20, PALE);
  }
  for (const s of moon.shards) {
    const x = s.x - camX, y = s.y - camY, fade = Math.min(1, s.ticks / 15);
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(s.dy, s.dx));
    ctx.globalAlpha = .3 * fade; ctx.fillStyle = '#b98cff'; ctx.fillRect(-22, -2, 16, 4); // short trail
    ctx.globalAlpha = fade; ctx.fillStyle = '#8f5fe0';
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(0, -5); ctx.lineTo(-8, 0); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALE; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(0, -2); ctx.lineTo(-4, 0); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Moon aliens. Mirror mite: a small blocky crystal bug with a mirror-bright shell (pale rim, dark inset, a glint
// sliding across its face), two pale eyes and three pairs of stepped legs that scuttle as it moves.
export function drawMoonUnit(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number): boolean {
  if (e.type === 'moon_shade') { drawShade(ctx, e, sx, sy, tick); drawEnemyHealthBar(ctx,e,sx,sy); return true; }
  if (e.type === 'moon_mimic') { drawMimic(ctx, e, sx, sy, tick); drawEnemyHealthBar(ctx,e,sx,sy); return true; }
  if (e.type !== 'mirror_mite') return false;
  const flash = e.flashTicks > 0, step = Math.floor(tick / 6 + e.id) % 2, attack = e.attackTimer > 0 && e.attackTimer <= 12;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.shadowBlur = 0;
  for (let k = -1; k <= 1; k++) { // bent legs, alternating as it scuttles
    const lift = (k + 1 + step) % 2 ? 3 : 0, y = k * 6;
    block(ctx, -15, y - 1, 5, 2, '#8a7ac0'); block(ctx, -17, y + 1 - lift, 2, 4, '#8a7ac0');
    block(ctx, 10, y - 1, 5, 2, '#8a7ac0'); block(ctx, 15, y + 1 - (3 - lift), 2, 4, '#8a7ac0');
  }
  const h = attack ? 12 : 10;
  ctx.shadowColor = '#c6b8ff'; ctx.shadowBlur = 5;
  block(ctx, -h, -h, h * 2, h * 2, flash ? '#ffffff' : '#c6b8ff'); ctx.shadowBlur = 0;
  if (!flash) {
    block(ctx, -h + 2, -h + 2, h * 2 - 4, h * 2 - 4, '#251a44');
    ctx.fillStyle = '#6b55b0'; tri(ctx, -h + 2, -h + 2, h - 2, -h + 2, -h + 2, h - 2); // lit mirror facet
    ctx.globalAlpha = .5; ctx.fillStyle = '#9d86e8'; tri(ctx, -h + 2, -h + 2, 2, -h + 2, -h + 2, 2); ctx.globalAlpha = 1;
    ctx.save(); ctx.beginPath(); ctx.rect(-h + 2, -h + 2, h * 2 - 4, h * 2 - 4); ctx.clip(); // glint sweeping across the mirror
    const g = ((tick * 1.4 + e.id * 17) % 44) - 22;
    ctx.globalAlpha = .7; ctx.fillStyle = PALE; ctx.beginPath(); ctx.moveTo(g - 3, -h); ctx.lineTo(g + 3, -h); ctx.lineTo(g - 13, h); ctx.lineTo(g - 19, h); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.globalAlpha = 1;
    block(ctx, -6, 0, 4, 4, '#f4eaff'); block(ctx, 2, 0, 4, 4, '#f4eaff');
    block(ctx, -5, 1, 2, 2, '#3a2a6a'); block(ctx, 3, 1, 2, 2, '#3a2a6a');
  }
  // a mirror shard on its back
  ctx.fillStyle = flash ? '#ffffff' : '#e8e0ff'; tri(ctx, -3, -h, 3, -h, 0, -h - 7);
  ctx.fillStyle = flash ? '#ffffff' : '#a98cff'; tri(ctx, 0, -h, 3, -h, 0, -h - 7);
  ctx.restore();
  drawEnemyHealthBar(ctx,e,sx,sy);
  return true;
}

// Shade: a translucent shadow wraith that hunts Ruby. A stepped hood and body in deep violet, flickering between
// see-through and nearly solid, a ragged tail of drifting blocks, and two ice-blue eyes that flare as it strikes.
function drawShade(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number) {
  const flash = e.flashTicks > 0, attack = e.attackTimer > 0 && e.attackTimer <= 14, bob = Math.round(Math.sin(tick * .08 + e.id) * 2);
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy) + bob); ctx.shadowBlur = 0;
  const alpha = flash ? 1 : .55 + .2 * Math.sin(tick * .11 + e.id * 2);
  ctx.globalAlpha = alpha * .6; // ragged tail
  for (let i = 0; i < 3; i++) block(ctx, -8 + i * 6 + Math.round(Math.sin(tick * .1 + i) * 2), 12 + i * 2, 4, 6 - i, '#3c2a6e');
  ctx.globalAlpha = alpha;
  ctx.shadowColor = '#7a5cc8'; ctx.shadowBlur = 6;
  block(ctx, -12, -6, 24, 18, flash ? '#ffffff' : '#2a1d4e'); // body
  block(ctx, -9, -13, 18, 8, flash ? '#ffffff' : '#2a1d4e');  // hood
  block(ctx, -5, -17, 10, 4, flash ? '#ffffff' : '#2a1d4e');
  ctx.shadowBlur = 0;
  if (!flash) {
    block(ctx, -12, -6, 3, 18, '#5a4396'); block(ctx, -9, -13, 3, 8, '#5a4396'); // lit edge
    block(ctx, -6, -6, 12, 7, '#120a26');                                      // face in shadow
    ctx.shadowColor = '#a9e6ff'; ctx.shadowBlur = attack ? 8 : 4;
    block(ctx, -5, -4, 3, attack ? 4 : 3, ICE); block(ctx, 2, -4, 3, attack ? 4 : 3, ICE);
    ctx.shadowBlur = 0;
    if (attack) { block(ctx, -16, 4, 4, 3, '#c9b6ff'); block(ctx, 12, 4, 4, 3, '#c9b6ff'); } // claws out
  }
  ctx.restore();
}

// Mimic in its own form: a soft lavender-grey shapeshifter cube whose horizontal slices keep sliding out of line, one
// large eye, and a faint flicker of the Queen's tiara above it, the look it is trying on. Disguised, it is drawn
// exactly as an illusion instead.
function drawMimic(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number) {
  const flash = e.flashTicks > 0, attack = e.attackTimer > 0 && e.attackTimer <= 12, h = attack ? 13 : 11;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.shadowBlur = 0;
  ctx.shadowColor = '#9a8cd0'; ctx.shadowBlur = 4;
  for (let k = 0; k < 4; k++) { // four slices drifting out of line
    const shift = Math.round(Math.sin(tick * .09 + k * 1.7 + e.id) * 3);
    block(ctx, -h + shift, -h + k * (h / 2), h * 2, h / 2, flash ? '#ffffff' : k % 2 ? '#8a7cc0' : '#a597d8');
  }
  ctx.shadowBlur = 0;
  if (!flash) {
    block(ctx, -6, -5, 12, 9, '#f2ecff'); block(ctx, -3, -3, 6, 6, '#3a2a6a'); block(ctx, -1, -2, 2, 2, ICE); // the eye
    const try_ = Math.max(0, Math.sin(tick * .05 + e.id)); // trying on her tiara
    ctx.globalAlpha = .25 + .35 * try_;
    block(ctx, -1, -h - 8, 3, 7, '#ddaaff'); block(ctx, -h + 3, -h - 5, 3, 4, '#ddaaff'); block(ctx, h - 6, -h - 5, 3, 4, '#ddaaff');
  }
  ctx.restore();
}

// Screen-space crystal overlay while the Queen is revealed: a pale flash, big chunky glass
// crystals growing in from the corners and edges, violet frost and glints. It peaks just after her mask breaks
// and melts away before she jumps. Cosmetic only.
export function drawMoonRevealOverlay(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number, tick: number) {
  const moon = state.moon; if (!moon) return;
  const boss = state.enemies.find(e => e.id === moon.bossId && e.hp > 0);
  if (!boss || boss.phaseTimer > MOON_REVEAL_TICKS || boss.phaseTimer <= 0) return;
  const t = 1 - boss.phaseTimer / MOON_REVEAL_TICKS, grow = Math.min(1, t / .18), fade = t < .18 ? 1 : Math.max(0, 1 - (t - .18) / .82), a = grow * fade;
  if (a <= 0) return;
  ctx.save(); ctx.shadowBlur = 0;
  if (t < .12) { ctx.globalAlpha = (1 - t / .12) * .22; ctx.fillStyle = PALE; ctx.fillRect(0, 0, w, h); }
  // Big chunky glass crystals grow in from the corners and edges: irregular faceted
  // gems with lit upper-left faces, shaded lower-right faces, pale edges and a glint.
  const chunks: [number, number, number][] = [[0, 0, 1.25], [w, 0, 1.1], [w, h, 1.3], [0, h, 1.05], [w * .5, 0, .7], [w * .5, h, .8], [0, h * .5, .75], [w, h * .45, .85], [w * .25, 0, .55], [w * .78, h, .6], [0, h * .78, .5], [w, h * .18, .5]];
  chunks.forEach(([cx, cy, scale], i) => {
    const R = Math.min(w, h) * .2 * scale * (.4 + .6 * grow), sides = 6 + (i % 2), rot = hash(i, 1, 67) * Math.PI;
    const pts: [number, number][] = [];
    for (let k = 0; k < sides; k++) { const ang = rot + k / sides * Math.PI * 2, rr = R * (.75 + hash(i, k, 68) * .35); pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * .9]); }
    const ox = cx - R * .18, oy = cy - R * .14; // the facet apex, offset so faces read as a cut gem
    for (let k = 0; k < sides; k++) {
      const [x1, y1] = pts[k], [x2, y2] = pts[(k + 1) % sides], mx = (x1 + x2) / 2 - cx, my = (y1 + y2) / 2 - cy;
      const light = (-mx - my) / (Math.hypot(mx, my) || 1); // faces toward the upper left catch the light
      ctx.globalAlpha = a * (.22 + .2 * Math.max(0, light));
      ctx.fillStyle = light > .35 ? '#d9c4ff' : light > -.35 ? (i % 3 ? '#9a74e0' : '#7fb8e8') : '#3e2a72';
      ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = a * .7; ctx.strokeStyle = PALE; ctx.lineWidth = 2; ctx.lineJoin = 'miter';
    ctx.beginPath(); pts.forEach(([px, py], k) => k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.stroke();
    ctx.globalAlpha = a * .25; ctx.lineWidth = 1;
    for (const [px, py] of pts) { ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.stroke(); }
    // A broad glassy highlight band across the upper-left face.
    ctx.globalAlpha = a * .35; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(ox - R * .45, oy - R * .1); ctx.lineTo(ox - R * .1, oy - R * .5); ctx.lineTo(ox - R * .02, oy - R * .42); ctx.lineTo(ox - R * .36, oy - R * .02); ctx.closePath(); ctx.fill();
  });
  // Soft violet frost at the rim and a few long prism lines across the view.
  const rim = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .72);
  rim.addColorStop(0, '#b98cff00'); rim.addColorStop(1, '#b98cff');
  ctx.globalAlpha = a * .22; ctx.fillStyle = rim; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) {
    const gx = hash(i, 7, 66) * w, gy = hash(i, 8, 66) * h, tw = Math.max(0, Math.sin(tick * .2 + i * 1.9));
    ctx.globalAlpha = a * tw * .8; ctx.fillStyle = i % 3 ? PALE : ICE;
    ctx.fillRect(gx - 5, gy, 11, 1); ctx.fillRect(gx, gy - 5, 1, 11); ctx.fillRect(gx - 1, gy - 1, 3, 3);
  }
  ctx.restore();
}
