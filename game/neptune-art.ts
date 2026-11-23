import { drawPrimalAftershock, tracePrimalPressureFront } from './primal-impact-art';
import { NEPTUNE_CLAM, NEPTUNE_CORRUPTED_CLAM } from './constants';
import { drawEnemyHealthBar } from './enemy-health-art';
import { TILE_SIZE, CHAMBER_BOUNDS, MAP_COLS, MAP_ROWS, T_WALL, T_FLOOR, chamberOfTile, ENEMY_CONFIGS, NEPTUNE_PUFF_TICKS, NEPTUNE_BOMB_FUSE, NEPTUNE_BOMB_RADIUS, NEPTUNE_LASER_WARNING, NEPTUNE_CLONE_HEAL_FX_TICKS } from './constants';
import type { Enemy, GameState } from './engine';

// Blocky neon-vector art for the Neptune challenge: fish, stingers, water clones, water balls,
// tides and the player's sky laser.

function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

const rockHash = (x: number, y: number, k: number) => { const n = Math.sin(x * 127.1 + y * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
const isCover = (state: Readonly<GameState>, tx: number, ty: number) => {
  if ((state.map[ty]?.[tx] ?? T_WALL) !== T_WALL) return false;
  const ch = chamberOfTile(tx, ty); if (ch < 0) return false;
  const [t, l, b, r] = CHAMBER_BOUNDS[ch]; return tx > l && tx < r && ty > t && ty < b;
};

// Joined reef limestone: broad eroded faces cross tile boundaries, with natural shaded
// outer edges instead of a neon room-colour frame. Kelp remains a separate ambience pass.
export function drawNeptuneRock(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, color: string) {
  const s = TILE_SIZE, h = (k: number) => rockHash(tx, ty, k);
  const top = !isCover(state, tx, ty - 1), bottom = !isCover(state, tx, ty + 1);
  const left = !isCover(state, tx - 1, ty), right = !isCover(state, tx + 1, ty);
  const face = (points: number[][], fill: string) => {
    ctx.fillStyle = fill; ctx.beginPath();
    points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.closePath(); ctx.fill();
  };
  ctx.save(); ctx.shadowBlur = 0; ctx.beginPath(); ctx.rect(x, y, s, s); ctx.clip();
  block(ctx, x, y, s, s, '#204c5d');
  const wx = tx * s, wy = ty * s;
  ctx.save(); ctx.translate(x - wx, y - wy);
  // Broad irregular limestone shelves, independent of the collision tile grid.
  for (let row = Math.floor(wy / 83) - 1; row <= Math.floor((wy + s) / 83); row++) {
    for (let col = Math.floor(wx / 127) - 1; col <= Math.floor((wx + s) / 127); col++) {
      const px = col * 127 + (row % 2) * 39, py = row * 83;
      const wear = rockHash(col, row, 31), lip = 8 + wear * 12;
      face([[px - 22, py + lip], [px + 43, py + 3], [px + 99, py + 9], [px + 127, py + 31], [px + 113, py + 66], [px + 50, py + 78], [px - 22, py + 65]], wear > .5 ? '#306577' : '#2b5c6f');
      face([[px - 22, py + lip], [px + 43, py + 3], [px + 99, py + 9], [px + 108, py + 18], [px + 40, py + 13], [px - 22, py + lip + 8]], '#487e89');
      face([[px - 22, py + 57], [px + 49, py + 67], [px + 113, py + 56], [px + 113, py + 66], [px + 50, py + 78], [px - 22, py + 65]], '#183e50');
      if (wear > .55) {
        ctx.strokeStyle = '#153a49'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px + 86, py + 12); ctx.lineTo(px + 73, py + 27); ctx.lineTo(px + 78, py + 38); ctx.lineTo(px + 63, py + 51); ctx.stroke();
      }
    }
  }
  ctx.restore();
  // Continuous exposed rims: pale sediment above, shaded weight below. Opaque edge
  // fills avoid doubled bright corner pixels and never create seams between joined tiles.
  if (top) { block(ctx, x, y, s, 3, '#719ca4'); block(ctx, x, y + 3, s, 3, '#4a7d8a'); }
  if (left) block(ctx, x, y + (top ? 3 : 0), 2, s - (top ? 3 : 0), '#51828f');
  if (right) block(ctx, x + s - 3, y + (top ? 3 : 0), 3, s - (top ? 3 : 0), '#173c4c');
  if (bottom) { block(ctx, x, y + s - 4, s, 4, '#103343'); block(ctx, x + 2, y + s - 5, s - 4, 1, '#3b6977'); }
  ctx.globalAlpha = .035; block(ctx, x, y, s, s, color); ctx.globalAlpha = 1;
  if (top && h(35) > .45) { block(ctx, x + 8, y + 2, 11, 2, '#a0b7af'); block(ctx, x + 19, y + 3, 6, 2, '#6d9296'); }
  if (h(10) > .65) {
    const bx = x + 7 + Math.floor(h(13) * (s - 18)), by = y + 9 + Math.floor(h(16) * (s - 22));
    block(ctx, bx, by, 4, 4, '#bad4d1'); block(ctx, bx + 1, by + 1, 2, 2, '#49747f');
    block(ctx, bx + 5, by + 2, 3, 3, '#99bec3'); block(ctx, bx + 6, by + 3, 1, 1, '#49747f');
  }
  ctx.restore(); // Stone clips to its footprint; growth may extend above exposed tops.
  if (h(20) > .8) {
    const [body, shade] = [['#d68ba0', '#a6657c'], ['#dba374', '#a37755'], ['#ad97cc', '#7f719e']][Math.floor(h(21) * 3)];
    const onTop = top && h(23) > .5, cx = x + 12 + Math.floor(h(22) * (s - 28));
    const base = onTop ? y + 3 : y + s - 5;
    const size = 1.1 + h(25) * .5, centreHeight = 12 + Math.floor(h(24) * 10);
    const leftHeight = 14 + Math.floor(h(26) * 9), rightHeight = 12 + Math.floor(h(27) * 10);
    ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    ctx.translate(cx, base); ctx.scale(size, size); ctx.translate(-cx, -base);
    // A solid stepped branch silhouette, with broad shaded bases and no white tip specks.
    block(ctx, cx - 2, base - centreHeight, 6, centreHeight, body);
    block(ctx, cx - 9, base - 11, 10, 5, body); block(ctx, cx - 9, base - leftHeight, 5, leftHeight - 8, body);
    block(ctx, cx + 3, base - 9, 10, 5, body); block(ctx, cx + 8, base - rightHeight, 5, rightHeight - 6, body);
    block(ctx, cx - 2, base - 4, 6, 4, shade);
    block(ctx, cx - 9, base - 9, 7, 3, shade); block(ctx, cx + 4, base - 6, 9, 2, shade);
    ctx.restore();
  }
}

// Rooted blocky kelp: a few filled rectangles make each frond. The whole frond
// tilts with the water, preserving a simple solid silhouette with no fine leaf veins.
export function drawNeptuneKelp(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, tx: number, ty: number, x: number, y: number, tick: number) {
  if (!isCover(state, tx, ty) || rockHash(tx, ty, 49) < .36) return;
  const onTop = !isCover(state, tx, ty - 1) && rockHash(tx, ty, 55) > .5;
  if (!onTop && isCover(state, tx, ty + 1)) return;
  ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  const seed = rockHash(tx, ty, 50), variant = Math.floor(rockHash(tx, ty, 52) * 3);
  const count = variant === 1 ? 3 : 2;
  const stem = variant === 0 ? 2 : variant === 1 ? 5 : 4;
  const bladeWidth = variant === 0 ? 5 : variant === 1 ? 10 : 7;
  const bladeHeight = variant === 0 ? 3 : variant === 1 ? 5 : 4;
  // Colour varies independently of size: deep forest, muted jade and fresh green.
  const palette = [
    ['#286345', '#377957', '#4d9268'],
    ['#397a59', '#4b956e', '#67ac80'],
    ['#40946d', '#64b58a', '#82c395'],
  ][Math.floor(rockHash(tx, ty, 53) * 3)];
  const baseX = x + 18 + seed * 10, baseY = onTop ? y + 3 : y + TILE_SIZE - 6;
  const tall = variant === 2 && rockHash(tx, ty, 54) > .5;
  for (let frond = 0; frond < count; frond++) {
    const height = tall ? Math.round(72 + rockHash(tx + frond, ty, 51) * 24)
      : Math.round((variant === 2 ? 28 : variant === 1 ? 21 : 23) + rockHash(tx + frond, ty, 51) * (variant === 2 ? 14 : 12));
    const spread = frond - (count - 1) / 2;
    const sway = Math.sin(tick * .018 + tx * .8 + ty * .5 + frond * .9) * .08;
    ctx.save(); ctx.translate(Math.round(baseX + spread * (variant === 0 ? 5 : 7)), Math.round(baseY)); ctx.rotate(spread * .16 + sway);
    const body = palette[0], leaf = palette[frond % 2 ? 2 : 1];
    block(ctx, -stem / 2, -height, stem, height, body);
    // Three broad stepped blades, with alternating sides and no miniature detailing.
    for (let blade = 0; blade < 3; blade++) {
      const side = (blade + frond) % 2 ? 1 : -1, yy = -Math.round(height * (.28 + blade * .23));
      const start = side > 0 ? 0 : -bladeWidth;
      block(ctx, start, yy, bladeWidth, bladeHeight, leaf);
      block(ctx, side > 0 ? bladeWidth - 3 : -bladeWidth, yy - bladeHeight + 1, variant === 0 ? 2 : 3, bladeHeight, leaf);
    }
    block(ctx, -stem / 2, -height - 3, stem, 5, leaf);
    ctx.restore();
  }
  block(ctx, baseX - 6, baseY - 1, 12, 3, '#356b56');
  ctx.restore();
}

const seabedDetailCache = new WeakMap<GameState['map'], Map<number, number>>();
function seabedDetails(state: Readonly<GameState>) {
  const cached = seabedDetailCache.get(state.map); if (cached) return cached;
  const details = new Map<number, number>();
  for (const [top, left, bottom, right] of CHAMBER_BOUNDS) {
    const placed: number[][] = [], cx = (left + right) / 2, cy = (top + bottom) / 2;
    // One of each decoration per chamber, spaced apart, instead of a rare random
    // scatter that can accidentally omit starfish from whole rooms.
    for (let kind = 0; kind < 3; kind++) {
      let best = -Infinity, chosen: number[] | null = null;
      for (let ty = top + 2; ty < bottom - 1; ty++) for (let tx = left + 2; tx < right - 1; tx++) {
        if (state.map[ty]?.[tx] !== T_FLOOR || Math.hypot(tx - cx, ty - cy) < 2.5) continue;
        if (placed.some(([px, py]) => Math.hypot(tx - px, ty - py) < 4)) continue;
        const score = rockHash(tx, ty, 81 + kind * 7) - Math.hypot(tx - cx, ty - cy) * .025;
        if (score > best) { best = score; chosen = [tx, ty]; }
      }
      if (chosen) { placed.push(chosen); details.set(chosen[1] * MAP_COLS + chosen[0], kind); }
    }
  }
  seabedDetailCache.set(state.map, details); return details;
}

export function drawNeptuneAmbience(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, x0: number, y0: number, x1: number, y1: number, tick: number) {
  ctx.save(); ctx.shadowBlur = 0;
  const floorDetails = seabedDetails(state);
  // Preserve the original floor's glowing tile caustics and sandy specks.
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (state.map[ty]?.[tx] !== T_FLOOR) continue;
    const x = tx * TILE_SIZE - camX, y = ty * TILE_SIZE - camY;
    const wave = Math.sin(tx * .55 + ty * .35 + tick * .025) + Math.sin(tx * .21 - ty * .47 + tick * .018);
    if (wave > 1.1) { ctx.globalAlpha = Math.min(.12, (wave - 1.1) * .14); block(ctx, x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8, '#9fe8ff'); }
    if (rockHash(tx, ty, 1) > .82) {
      ctx.globalAlpha = .28;
      block(ctx, x + Math.floor(rockHash(tx, ty, 2) * 36) + 4, y + Math.floor(rockHash(tx, ty, 3) * 36) + 4, 3, 3, '#7fa8c4');
    }
    // Settled seabed details stay flat, muted and sparse, unlike floating pickups.
    if (floorDetails.has(ty * MAP_COLS + tx)) {
      const px = x + 10 + Math.floor(rockHash(tx, ty, 82) * 25), py = y + 12 + Math.floor(rockHash(tx, ty, 83) * 23);
      const kind = floorDetails.get(ty * MAP_COLS + tx)!;
      ctx.save(); ctx.translate(px, py); ctx.scale(2.6, 2.6); ctx.translate(-px, -py);
      ctx.globalAlpha = kind === 1 ? .42 : .36;
      if (kind === 0) {
        // Broad scallop fan: wide stepped crown, bold grooves and a narrow hinge.
        block(ctx, px - 4, py - 5, 8, 2, '#bdc6b3');
        block(ctx, px - 6, py - 3, 12, 3, '#a5b5aa');
        block(ctx, px - 4, py, 8, 3, '#91a69f');
        block(ctx, px - 2, py + 3, 4, 2, '#607b7e');
        block(ctx, px - 3, py - 2, 2, 3, '#647f7d');
        block(ctx, px + 1, py - 2, 2, 3, '#647f7d');
      } else if (kind === 1) {
        // Five chunky stepped arms, with no sloping star outline or thin points.
        block(ctx, px - 2, py - 2, 5, 5, '#b79282');
        block(ctx, px - 1, py - 6, 3, 5, '#b79282');
        block(ctx, px - 6, py - 1, 5, 3, '#b79282');
        block(ctx, px + 2, py - 1, 5, 3, '#b79282');
        block(ctx, px - 4, py + 2, 3, 4, '#9a786f');
        block(ctx, px + 2, py + 2, 3, 4, '#9a786f');
        block(ctx, px - 1, py - 4, 2, 3, '#cfad91');
      } else {
        // A low, broken coral sprig embedded in the silt, with no glow or pale tips.
        block(ctx, px - 1, py - 4, 3, 8, '#84969d'); block(ctx, px - 4, py - 1, 5, 3, '#84969d');
        block(ctx, px - 4, py - 4, 3, 4, '#84969d'); block(ctx, px + 1, py + 1, 5, 3, '#84969d');
        block(ctx, px + 4, py - 2, 3, 5, '#84969d');
      }
      ctx.restore();
    }
  }
  // Water light flows over connected floor areas, never as inset square tile flashes.
  ctx.save(); ctx.beginPath();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++)
    if (state.map[ty]?.[tx] === T_FLOOR) ctx.rect(tx * TILE_SIZE - camX, ty * TILE_SIZE - camY, TILE_SIZE, TILE_SIZE);
  ctx.clip();
  for (let axis = 0; axis < 2; axis++) {
    const start = axis ? x0 * TILE_SIZE : y0 * TILE_SIZE, end = axis ? (x1 + 1) * TILE_SIZE : (y1 + 1) * TILE_SIZE;
    const alongStart = axis ? y0 * TILE_SIZE : x0 * TILE_SIZE, alongEnd = axis ? (y1 + 1) * TILE_SIZE : (x1 + 1) * TILE_SIZE;
    for (let band = Math.floor(start / 150) - 1; band <= Math.ceil(end / 150) + 1; band++) {
      ctx.beginPath();
      for (let at = Math.floor(alongStart / 48) * 48 - 48; at <= alongEnd + 48; at += 48) {
        const across = band * 150 + Math.sin(at * .009 + tick * .012 + band * 2.1) * 26 + Math.cos(at * .017 - tick * .008 + band) * 12;
        const px = (axis ? across : at) - camX, py = (axis ? at : across) - camY;
        at === Math.floor(alongStart / 48) * 48 - 48 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#9fe9e3'; ctx.globalAlpha = axis ? .009 : .012; ctx.lineWidth = 14; ctx.stroke();
      ctx.globalAlpha = axis ? .033 : .047; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  // Marine snow moves gently in world space and fades before each short drift resets.
  for (let i = 0; i < 160; i++) {
    const life = ((tick * .0014 + rockHash(i, 1, 65)) % 1 + 1) % 1;
    const x = rockHash(i, 2, 65) * MAP_COLS * TILE_SIZE + life * 18 - camX;
    const y = rockHash(i, 3, 65) * MAP_ROWS * TILE_SIZE + life * 32 - camY;
    if (x < x0 * TILE_SIZE - camX || x > (x1 + 1) * TILE_SIZE - camX || y < y0 * TILE_SIZE - camY || y > (y1 + 1) * TILE_SIZE - camY) continue;
    ctx.globalAlpha = Math.sin(life * Math.PI) * .32; block(ctx, x, y, i % 4 ? 1 : 2, 2, '#c2e3df');
  }
  ctx.restore();
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const x = tx * TILE_SIZE - camX, y = ty * TILE_SIZE - camY;
    if (state.map[ty]?.[tx] === T_WALL) { drawNeptuneKelp(ctx, state, tx, ty, x, y, tick); continue; }
    if (state.map[ty]?.[tx] !== T_FLOOR || rockHash(tx, ty, 4) <= .93) continue;
    // Keep Neptune's original plentiful square bubbles, vent positions and motion.
    const rise = ((tick + Math.floor(rockHash(tx, ty, 5) * 240)) % 240) / 240;
    const bx = x + 12 + Math.round(Math.sin(tick * .05 + tx) * 4) + Math.floor(rockHash(tx, ty, 6) * 20);
    const by = y + TILE_SIZE - rise * TILE_SIZE * 2.4;
    ctx.globalAlpha = .5 * (1 - rise); ctx.strokeStyle = '#c9f2ff'; ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, 6, 6); block(ctx, bx + 1, by + 1, 2, 2, '#ffffff');
  }
  ctx.restore();
}

function facing(e: Readonly<Enemy>) {
  const dx = e.targetTileX - e.tileX;
  return dx < 0 ? -1 : 1;
}

// Small fish: body, tail and eye, swimming toward its next tile with a little bob.
function drawFish(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  const red = e.type === 'fish_red';
  const body = red ? '#ff5a6a' : '#59c8ff', dark = red ? '#a8243a' : '#1f6fa8', light = red ? '#ffc2c8' : '#d8f4ff';
  ctx.save(); ctx.scale(facing(e), 1); ctx.translate(0, Math.round(Math.sin(tick * .2 + e.id) * 1.5));
  ctx.shadowColor = body; ctx.shadowBlur = 6;
  block(ctx, -9, -6, 16, 12, body); ctx.shadowBlur = 0;
  block(ctx, -9, 2, 16, 4, dark); block(ctx, -7, -6, 10, 3, light);
  const flap = Math.floor(tick / 6 + e.id) % 2 ? 2 : 0;
  block(ctx, -15, -6 + flap, 6, 4, body); block(ctx, -15, 2 - flap, 6, 4, body);
  block(ctx, 2, -3, 3, 3, '#0b1020');
  if (red) { block(ctx, -3, -9, 2, 3, light); block(ctx, 1, -9, 2, 3, light); } // little warning spines
  else block(ctx, -1, -1, 3, 3, '#ffffff'); // healing sparkle
  ctx.restore();
}

// Stinger: a larger teal fish with a spiked back and a glowing poison barb.
function drawStinger(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  ctx.save(); ctx.scale(facing(e), 1);
  ctx.shadowColor = '#3fd6b0'; ctx.shadowBlur = 6;
  block(ctx, -13, -9, 24, 18, '#2fa889'); ctx.shadowBlur = 0;
  block(ctx, -13, 3, 24, 6, '#1a6b58'); block(ctx, -11, -9, 18, 4, '#a8f5e2');
  for (const x of [-9, -3, 3]) block(ctx, x, -14, 3, 5, '#a8f5e2');
  block(ctx, -20, -8, 7, 6, '#2fa889'); block(ctx, -20, 2, 7, 6, '#2fa889');
  block(ctx, 5, -4, 4, 4, '#0b1020');
  const pulse = .55 + .45 * Math.abs(Math.sin(tick * .15));
  ctx.globalAlpha = pulse; block(ctx, 11, -2, 8, 4, '#c6ff8a'); ctx.globalAlpha = 1;
  if (e.shootTicks > 0) { ctx.globalAlpha = e.shootTicks / 14; block(ctx, 14, -6, 10, 12, '#c6ff8a'); ctx.globalAlpha = 1; }
  ctx.restore();
}

// Water clone: a smaller, see-through echo of the Sea Chanter's silhouette (square shell, stepped fan fins,
// crest and fluke, pearl eyes) built from a few flat water-tone blocks, without her scales, gills or lashes.
function drawClone(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  const taunted=(e.neptuneTauntTicks??0)>0;
  const shimmer = (taunted?.72:.55) + .12 * Math.sin(tick * .12 + e.id), edge = taunted?'#519aaf':'#4f7fc4', water = taunted?'#a5fff2':'#6fc7ff', pale = taunted?'#effffb':'#d8f2ff';
  ctx.save(); ctx.globalAlpha = shimmer; ctx.translate(0, Math.round(Math.sin(tick * .06 + e.id) * 2)); ctx.scale(.75, .75);
  for (const side of [-1, 1]) {
    block(ctx, side * 27 - 5, -22, 10, 34, edge); block(ctx, side * 36 - 4, -28, 8, 28, edge);
    block(ctx, side * 27 - 3, -20, 6, 30, water);
  }
  block(ctx, -8, 20, 16, 12, edge); block(ctx, -20, 28, 16, 8, edge); block(ctx, 4, 28, 16, 8, edge);
  block(ctx, -8, -34, 16, 12, edge); block(ctx, -2, -32, 4, 10, water);
  ctx.shadowColor = water; ctx.shadowBlur = 6;
  block(ctx, -25, -24, 50, 48, water); ctx.shadowBlur = 0;
  block(ctx, -20, -19, 40, 38, '#1d5a8f');
  block(ctx, -16, -8, 12, 6, pale); block(ctx, 4, -8, 12, 6, pale);
  block(ctx, -3, 6, 6, 4, pale);
  // One slow light band sweeps down the shell, so it reads as water rather than a solid body.
  ctx.globalAlpha = shimmer * .6; block(ctx, -20, -19 + Math.floor((tick * .4 + e.id * 7) % 34), 40, 4, pale);
  ctx.restore();

}

// Water ball: a glowing orb whose ring empties as the fuse burns, with its blast area marked on the floor.
function drawWaterBall(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  const left = Math.max(0, e.windupTicks / NEPTUNE_BOMB_FUSE), radius = NEPTUNE_BOMB_RADIUS * TILE_SIZE;
  const urgent = left < .34, flash = urgent && Math.floor(tick / 4) % 2 === 0;
  ctx.save();
  ctx.globalAlpha = .1 + (1 - left) * .14; ctx.fillStyle = '#7fd0ff'; ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.globalAlpha = .55 + (1 - left) * .4; ctx.strokeStyle = flash ? '#ffffff' : '#7fd0ff'; ctx.lineWidth = 3;
  ctx.strokeRect(-radius + 1, -radius + 1, radius * 2 - 2, radius * 2 - 2);
  ctx.globalAlpha = 1; ctx.shadowColor = '#7fd0ff'; ctx.shadowBlur = 12;
  block(ctx, -12, -12, 24, 24, '#3fa8f0'); ctx.shadowBlur = 0;
  block(ctx, -8, -8, 16, 16, '#7fd0ff'); block(ctx, -6, -6, 6, 6, '#ffffff');
  ctx.strokeStyle = '#e1f6ff'; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(0, -17); // fuse ring: clockwise square perimeter that empties
  const perimeter = [[17, -17], [17, 17], [-17, 17], [-17, -17], [0, -17]], total = left * 4;
  for (let i = 0; i < 4 && i < total; i++) {
    const [x1, y1] = i === 0 ? [0, -17] : perimeter[i - 1], [x2, y2] = perimeter[i], part = Math.min(1, total - i);
    ctx.lineTo(x1 + (x2 - x1) * part, y1 + (y2 - y1) * part);
  }
  ctx.stroke();
  ctx.restore();
}

// Jellyfish: a glowing pink bell that pulses, with blocky tentacles swaying below.
function drawJellyfish(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  const pulse = Math.sin(tick * .12 + e.id), squash = Math.round(pulse * 2);
  ctx.translate(0, Math.round(Math.sin(tick * .05 + e.id) * 3));
  for (let k = 0; k < 4; k++) {
    const x = -10 + k * 6, sway = Math.round(Math.sin(tick * .15 + k) * 2);
    block(ctx, x + sway, 4, 3, 6, '#ff9ce6'); block(ctx, x - sway, 10, 3, 6, '#ffc4ef'); block(ctx, x + sway, 16, 3, 4, '#ff9ce6');
  }
  ctx.shadowColor = '#ff9ce6'; ctx.shadowBlur = 6;
  block(ctx, -14 - squash, -12 + squash, 28 + squash * 2, 16 - squash, '#e25fc0'); ctx.shadowBlur = 0;
  block(ctx, -10 - squash, -16 + squash, 20 + squash * 2, 4, '#e25fc0');
  block(ctx, -14 - squash, 0, 28 + squash * 2, 4, '#a83a8c');
  block(ctx, -8, -12 + squash, 6, 6, '#ffd6f4'); block(ctx, 4, -8 + squash, 4, 4, '#ffd6f4');
}

// Pufferfish: a round blocky fish that swells and bristles with spikes before it bursts.
function drawPufferfish(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, tick: number) {
  const swell = e.windupTicks > 0 ? 1 - e.windupTicks / NEPTUNE_PUFF_TICKS : 0, burst = e.shootTicks > 0 ? e.shootTicks / 18 : 0;
  const r = Math.round(10 + swell * 8), flash = swell > .6 && Math.floor(tick / 3) % 2 === 0;
  ctx.save(); ctx.scale(facing(e), 1); ctx.translate(0, swell ? 0 : Math.round(Math.sin(tick * .2 + e.id) * 1.5));
  block(ctx, -r - 6, -4, 6, 8, '#e0a83a'); // tail
  ctx.shadowColor = '#ffc94a'; ctx.shadowBlur = 4 + swell * 4;
  block(ctx, -r, -r + 2, r * 2, r * 2 - 4, flash ? '#fff0b8' : '#ffc94a'); block(ctx, -r + 2, -r, r * 2 - 4, r * 2, flash ? '#fff0b8' : '#ffc94a');
  ctx.shadowBlur = 0;
  block(ctx, -r + 2, r - 6, r * 2 - 4, 4, '#c98a2a'); block(ctx, -r + 4, -r + 2, r, 4, '#fff0b8');
  block(ctx, r - 8, -5, 4, 4, '#1a1020'); block(ctx, r - 2, 0, 4, 3, '#8a4a2a');
  if (swell > 0) for (let k = 0; k < 8; k++) { // spikes push out as it swells
    const a = k * Math.PI / 4, d = r + 2 + swell * 4;
    block(ctx, Math.cos(a) * d - 2, Math.sin(a) * d - 2, 4, 4, '#fff0b8');
  }
  ctx.restore();
  if (burst > 0) { // spike burst ring
    ctx.save(); ctx.globalAlpha = burst; ctx.strokeStyle = '#ffe680'; ctx.lineWidth = 4;
    const half = Math.round((1 - burst) * 1.6 * TILE_SIZE + 12); ctx.strokeRect(-half, -half, half * 2, half * 2);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; block(ctx, Math.cos(a) * half - 3, Math.sin(a) * half - 3, 6, 6, '#fff0b8'); }
    ctx.restore();
  }
}

export function drawNeptuneShark(ctx:CanvasRenderingContext2D,x:number,y:number,angle=0) {
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(angle);
      ctx.globalAlpha = .35; ctx.fillStyle = '#9fd8ff'; for (let k = 1; k <= 3; k++) ctx.fillRect(-30 - k * 14, -6 + (k % 2) * 4, 10, 4); // wake
      ctx.globalAlpha = 1; ctx.shadowColor = '#7fa8c8'; ctx.shadowBlur = 4;
      block(ctx, -34, -12, 56, 24, '#5f7e98'); ctx.shadowBlur = 0;
      block(ctx, -34, 4, 56, 8, '#3d566c'); block(ctx, -28, -12, 44, 4, '#9fb8cc');
      block(ctx, 22, -8, 10, 16, '#5f7e98'); block(ctx, 30, -4, 6, 8, '#5f7e98'); // snout
      block(ctx, -46, -16, 12, 10, '#5f7e98'); block(ctx, -46, 6, 12, 10, '#5f7e98'); // tail
      block(ctx, -8, -24, 14, 12, '#4a667e'); block(ctx, -4, -28, 8, 4, '#4a667e'); // dorsal fin
      block(ctx, 18, -6, 4, 4, '#0b1020'); block(ctx, 22, 4, 10, 3, '#e8f4ff'); // eye, teeth
      ctx.restore();
}

export function drawNeptuneUnit(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number): boolean {
  if (e.type !== 'fish_blue' && e.type !== 'fish_red' && e.type !== 'stinger' && e.type !== 'water_clone' && e.type !== 'water_bomb' && e.type !== 'jellyfish' && e.type !== 'pufferfish') return false;
  ctx.save(); ctx.translate(Math.round(sx), Math.round(sy));
  if (e.flashTicks > 0) ctx.filter = 'brightness(1.8)';
  if (e.type === 'jellyfish') { ctx.scale(1.3, 1.3); drawJellyfish(ctx, e, tick); }
  else if (e.type === 'pufferfish') {
    ctx.save(); ctx.scale(1.3, 1.3); drawPufferfish(ctx, e, tick); ctx.restore();
  }
  else if (e.type === 'water_bomb') drawWaterBall(ctx, e, tick);
  else if (e.type === 'water_clone') drawClone(ctx, e, tick);
  else if (e.type === 'stinger') {
    ctx.save(); ctx.scale(1.15, 1.15); drawStinger(ctx, e, tick); ctx.restore();
  } else { ctx.scale(1.4, 1.4); drawFish(ctx, e, tick); }
  ctx.restore();
  drawEnemyHealthBar(ctx,e,sx,sy);
  return true;
}

/** Pearl shell with a hinged upper valve; the same model is used in the rule sheet. */
export function drawNeptuneClam(ctx:CanvasRenderingContext2D,x:number,y:number,openTicks:number,tick:number,corrupted=false){
  const openDuration=corrupted?NEPTUNE_CORRUPTED_CLAM.openTicks:NEPTUNE_CLAM.openTicks;
  const opening=openTicks>0?Math.min(1,(openDuration-openTicks)/10,openTicks/12):0;
  const palette:Record<string,string>={'#456978':'#563347','#294854':'#302336','#9bb5bd':'#b87999','#658b9c':'#78465f','#243747':'#271d31','#786a8f':'#753c67','#b6e7df':'#f58caf','#f0fff3':'#ffe0e7','#496c83':'#673750','#92adbf':'#a86887','#bed0d7':'#c18aa4','#dce5df':'#efbbcd','#687f9f':'#713c61','#6b88a2':'#864a6a','#9babc8':'#9a557a','#a2b5c8':'#b17492','#c3f6e6':'#ffaccd','#587b8c':'#dc7ca0','#bff5e8':'#ffb5cd'};
  const paint=(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string)=>block(ctx,x,y,w,h,corrupted?(palette[color]??color):color);
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  paint(ctx,-22,11,44,7,'#071c2b');
  paint(ctx,-20,0,40,14,'#456978');paint(ctx,-15,11,30,6,'#294854');
  paint(ctx,-18,-1,36,9,'#9bb5bd');paint(ctx,-13,7,26,5,'#658b9c');
  if(opening>0){
    paint(ctx,-16,-2-opening*8,32,8+opening*8,'#243747');
    paint(ctx,-12,0,24,7,'#786a8f');
    ctx.shadowColor=corrupted?'#ee80ab':'#bff5e8';ctx.shadowBlur=opening*5;
    paint(ctx,-5,-3,10,10,'#b6e7df');paint(ctx,-3,-4,6,8,'#f0fff3');ctx.shadowBlur=0;
  }
  ctx.save();ctx.translate(0,-opening*17);
  paint(ctx,-21,-5,42,9,'#496c83');paint(ctx,-17,-12,34,16,'#92adbf');
  paint(ctx,-12,-17,24,21,'#bed0d7');paint(ctx,-5,-20,10,24,'#dce5df');
  paint(ctx,-16,-10,4,10,'#687f9f');paint(ctx,12,-10,4,10,'#6b88a2');
  paint(ctx,-9,-15,3,14,'#9babc8');paint(ctx,6,-15,3,14,'#a2b5c8');
  paint(ctx,-17,1,34,3,opening>0?'#c3f6e6':'#587b8c');
  ctx.restore();
  if(opening>0){ctx.globalAlpha=opening*(.55+.15*Math.sin(tick*.08));paint(ctx,-3,9,6,3,'#bff5e8');}
  ctx.restore();
}

export function drawNeptuneClamWave(ctx:CanvasRenderingContext2D,x:number,y:number,waveTicks:number,corrupted=false){
  if(waveTicks<=0)return;
  const p=1-waveTicks/NEPTUNE_CLAM.waveTicks,r=(corrupted?NEPTUNE_CORRUPTED_CLAM.radius:NEPTUNE_CLAM.radius)*TILE_SIZE*p,fade=Math.min(1,(1-p)*4);
  ctx.save();ctx.lineJoin='miter';
  if(corrupted){
    tracePrimalPressureFront(ctx,x,y,r*.97);ctx.globalAlpha=fade*.6;ctx.strokeStyle='#24162e';ctx.lineWidth=23;ctx.stroke();
    ctx.save();ctx.translate(x,y);ctx.scale(.97+.025*Math.sin(p*18),.97+.025*Math.cos(p*21));
    tracePrimalPressureFront(ctx,0,0,r*.9);ctx.setLineDash([22,10,6,14]);ctx.lineDashOffset=-p*65;
    ctx.globalAlpha=fade*.75;ctx.strokeStyle='#ad4b84';ctx.lineWidth=6;ctx.stroke();ctx.restore();
    for(let i=0;i<12;i++){
      const angle=i*Math.PI/6,travel=r*(.78+.12*Math.sin(i*2.3+p*8));
      ctx.save();ctx.translate(x+Math.cos(angle)*travel,y+Math.sin(angle)*travel);ctx.rotate(angle+.3*Math.sin(i+p*9));
      ctx.globalAlpha=fade*.7;ctx.fillStyle='#66365f';ctx.fillRect(-22,-4,32,8);
      ctx.globalAlpha=fade*.9;ctx.fillStyle=i%3?'#d86ca5':'#ffd4e4';ctx.fillRect(-14,-2,22,3);ctx.restore();
    }
  }
  for(const [scale,color,width,alpha] of [[1,corrupted?'#f7a2c5':'#baf7eb',4,.8],[.94,corrupted?'#a14a7c':'#639fb7',10,.28],[.84,corrupted?'#d07da7':'#92cbdc',2,.35]] as const){
    tracePrimalPressureFront(ctx,x,y,r*scale);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.globalAlpha=fade*alpha;ctx.stroke();
  }
  ctx.restore();
}

// Floor layer: tides flowing through a room and the sky laser's countdown on its chosen room.
export function drawNeptuneOverlay(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const neptune = state.neptune;
  if (!neptune) return;
  ctx.save();
  for(const clam of neptune.clams??[]){
    if(clam.waveTicks>0){
      ctx.save();ctx.beginPath();
      for(let ty=clam.tileY-NEPTUNE_CLAM.radius;ty<=clam.tileY+NEPTUNE_CLAM.radius;ty++)for(let tx=clam.tileX-NEPTUNE_CLAM.radius;tx<=clam.tileX+NEPTUNE_CLAM.radius;tx++){
        if(state.map[ty]?.[tx]===T_FLOOR)ctx.rect(tx*TILE_SIZE-camX,ty*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE);
      }
      ctx.clip();drawNeptuneClamWave(ctx,(clam.tileX+.5)*TILE_SIZE-camX,(clam.tileY+.5)*TILE_SIZE-camY,clam.waveTicks,clam.corrupted);ctx.restore();
    }
    drawNeptuneClam(ctx,(clam.tileX+.5)*TILE_SIZE-camX,(clam.tileY+.5)*TILE_SIZE-camY,clam.openTicks,tick,clam.corrupted);
  }
  for (const tide of neptune.tides) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[tide.chamber];
    const x = c1 * TILE_SIZE - camX, y = r1 * TILE_SIZE - camY, w = (c2 - c1 + 1) * TILE_SIZE, h = (r2 - r1 + 1) * TILE_SIZE;
    ctx.globalAlpha = .1; ctx.fillStyle = '#3f8fe8'; ctx.fillRect(x, y, w, h);
    // Chevrons drift along the current.
    ctx.globalAlpha = .45; ctx.fillStyle = '#9fd8ff';
    const step = TILE_SIZE * 3, drift = (tick * 2) % step;
    for (let gy = 0; gy < h; gy += step) for (let gx = 0; gx < w; gx += step) {
      const px = x + gx + step / 2 + tide.dirX * (drift - step / 2), py = y + gy + step / 2 + tide.dirY * (drift - step / 2);
      if (px < x || px > x + w || py < y || py > y + h) continue;
      ctx.save(); ctx.translate(Math.round(px), Math.round(py)); ctx.rotate(Math.atan2(tide.dirY, tide.dirX));
      ctx.fillRect(-6, -10, 6, 4); ctx.fillRect(0, -6, 6, 4); ctx.fillRect(0, 2, 6, 4); ctx.fillRect(-6, 6, 6, 4);
      ctx.restore();
    }
    ctx.globalAlpha = .6; ctx.strokeStyle = '#7fc7ff'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  }
  // Shark: a striped warning lane across the chamber, then the shark charges through and out of the wall.
  for (const shark of [neptune.shark,neptune.sharkFollowup,neptune.sharkThird]) {
    if(!shark)continue;
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[shark.chamber];
    const lo = shark.vertical ? r1 : c1, hi = shark.vertical ? r2 : c2;
    for (let k = lo; k <= hi; k++) {
      const tx = shark.vertical ? shark.line : k, ty = shark.vertical ? k : shark.line;
      if (state.map[ty]?.[tx] === 0) continue;
      const x = tx * TILE_SIZE - camX, y = ty * TILE_SIZE - camY;
      if (shark.warning > 0) {
        ctx.globalAlpha = .22 + .2 * Math.abs(Math.sin(tick * .25 + k * .5)); ctx.fillStyle = '#ff4d5a'; ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        ctx.globalAlpha = .7; ctx.fillStyle = '#ffd0d0';
        const along = ((k - lo) * shark.dir + Math.floor(tick / 5)) % 3 === 0; // chevrons running toward the exit wall
        if (along) { ctx.save(); ctx.translate(x + TILE_SIZE / 2, y + TILE_SIZE / 2); ctx.rotate(Math.atan2(shark.vertical ? shark.dir : 0, shark.vertical ? 0 : shark.dir));
          ctx.fillRect(-8, -10, 6, 4); ctx.fillRect(-2, -6, 6, 4); ctx.fillRect(-2, 2, 6, 4); ctx.fillRect(-8, 6, 6, 4); ctx.restore(); }
      } else { ctx.globalAlpha = .12; ctx.fillStyle = '#ff4d5a'; ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4); }
    }
    if (shark.warning <= 0) {
      const px = ((shark.vertical ? shark.line : shark.pos) + .5) * TILE_SIZE - camX, py = ((shark.vertical ? shark.pos : shark.line) + .5) * TILE_SIZE - camY;
      drawNeptuneShark(ctx,px,py,Math.atan2(shark.vertical?shark.dir:0,shark.vertical?0:shark.dir));
    }
    ctx.globalAlpha = 1;
  }
  // A clone revealed by a jellyfish: a pulsing light column above it.
  const reveal = neptune.reveal, revealed = reveal && state.enemies.find(c => c.id === reveal.cloneId);
  if (reveal && revealed) {
    const x = revealed.x - camX, y = revealed.y - camY, fade = Math.min(1, reveal.ticks / 30), pulse = .5 + .5 * Math.sin(tick * .2);
    ctx.globalAlpha = (.25 + .2 * pulse) * fade; ctx.fillStyle = '#ffd6f4'; ctx.fillRect(x - 10, y - 420, 20, 400);
    ctx.globalAlpha = (.7 + .3 * pulse) * fade; ctx.strokeStyle = '#ff9ce6'; ctx.lineWidth = 4;
    const half = 30 + pulse * 6; ctx.strokeRect(x - half, y - half, half * 2, half * 2);
    ctx.globalAlpha = 1;
  }
  const laser = neptune.laser;
  if (laser) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[laser.chamber], progress = 1 - laser.ticks / NEPTUNE_LASER_WARNING;
    const x = c1 * TILE_SIZE - camX, y = r1 * TILE_SIZE - camY, w = (c2 - c1 + 1) * TILE_SIZE, h = (r2 - r1 + 1) * TILE_SIZE;
    const pulse=.5+.5*Math.sin(tick*(.1+progress*.12));
    ctx.globalAlpha=.05+pulse*(.06+progress*.08);ctx.fillStyle='#b7f2ed';ctx.fillRect(x,y,w,h);
    ctx.globalAlpha=.55+pulse*.25;ctx.strokeStyle='#d5fff6';ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,w-4,h-4);
    const cx=x+w/2,beam=Math.round(w*(.5-progress*.42));
    ctx.globalAlpha=.14+progress*.24;ctx.fillStyle='#8edbe9';ctx.fillRect(cx-beam/2,y,beam,h);
  }
  ctx.restore();
}

// Water ball burst: a flat stepped water ring sweeps out to the blast edge over a brief pale wash, a short
// white splash column rises from the centre, and eight 12px droplets arc outward and fall. 28 ticks, no glow.
export function drawWaterBurst(ctx: CanvasRenderingContext2D, x: number, y: number, maxRadius: number, ticks: number) {
  const progress = 1 - ticks / 28, fade = 1 - progress, G = 12;
  const snap = (v: number) => Math.round(v / 6) * 6;
  const block = (px: number, py: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(snap(px), snap(py), w, h); };
  ctx.save(); ctx.shadowBlur = 0;
  // Wash marking the hit area, strongest at the moment of the burst.
  ctx.globalAlpha = fade * .22; ctx.fillStyle = '#59c8ff';
  ctx.beginPath(); ctx.arc(x, y, maxRadius, 0, Math.PI * 2); ctx.fill();
  // Two stepped rings of 12px blocks: a bright crest leading, a deeper blue trough behind it.
  const ring = (r: number, c: string, alpha: number) => {
    const rr = Math.max(G * 2, Math.round(r / G) * G);
    ctx.globalAlpha = alpha;
    for (let py = -rr; py <= rr; py += G) for (let px = -rr; px <= rr; px += G) {
      const d = px * px + py * py;
      if (d <= rr * rr && d >= (rr - G) * (rr - G)) block(x + px - G / 2, y + py - G / 2, G, G, c);
    }
  };
  const ease = 1 - (1 - progress) * (1 - progress);
  ring(maxRadius * ease, '#e8fbff', fade * .95);
  if (progress > .15) ring(maxRadius * ease * .7, '#2f7fd0', fade * .7);
  // Splash column: rises then sinks back.
  const rise = Math.sin(Math.min(1, progress * 1.6) * Math.PI) * 42;
  ctx.globalAlpha = fade;
  block(x - 12, y - rise, 24, Math.max(6, rise), '#9fe4ff'); block(x - 6, y - rise - 6, 12, 12, '#ffffff');
  // Droplets thrown outward on a short arc.
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 + Math.PI / 8, d = maxRadius * (.25 + ease * .55), lift = Math.sin(progress * Math.PI) * 30;
    block(x + Math.cos(a) * d - 6, y + Math.sin(a) * d * .8 - lift - 6, G, G, i % 2 ? '#9fe4ff' : '#e8fbff');
  }
  ctx.restore();
}

// Ocean’s Chorus retains the broad column, narrowing core and square water shockwaves.
/** Coherent arcing sprays keep Chorus's water readable beyond the bright impact column. */
/** Hollow water bubbles and pearl glitter scatter with the outgoing stepped wave. */
function drawChorusWaveScatter(ctx:CanvasRenderingContext2D,cx:number,cy:number,reach:number,age:number){
  const rim=[[-.44,-1],[.44,-1],[.44,-.78],[.78,-.78],[.78,-.44],[1,-.44],[1,.44],[.78,.44],[.78,.78],[.44,.78],[.44,1],[-.44,1],[-.44,.78],[-.78,.78],[-.78,.44],[-1,.44],[-1,-.44],[-.78,-.44],[-.78,-.78],[-.44,-.78]];
  ctx.save();ctx.shadowBlur=0;
  for(let echo=0;echo<2;echo++){
    const p=(age-6-echo*9)/95;if(p<=0||p>=1)continue;
    const radius=p*reach,fade=Math.min(1,p*12,(1-p)*5)*(echo?.65:1),count=echo?112:168;
    for(let i=0;i<count;i++){
      const segment=i%rim.length,t=(i*.618034+echo*.31)%1,a=rim[segment],b=rim[(segment+1)%rim.length];
      const spread=.9+(i%9)*.018,dx=(a[0]+(b[0]-a[0])*t)*radius*spread,dy=(a[1]+(b[1]-a[1])*t)*radius*spread;
      const x=Math.round(cx+dx),y=Math.round(cy+dy-Math.sin(p*Math.PI)*(i%4)*4);
      if(i%3!==0){
        const size=4+i%3; // 10–12px hollow bubbles; the battlefield stays visible inside.
        tracePrimalPressureFront(ctx,x,y,size);
        ctx.globalAlpha=fade*.085;ctx.fillStyle='#83dce8';ctx.fill();
        ctx.globalAlpha=fade*.55;ctx.strokeStyle='#d1fff6';ctx.lineWidth=1.5;ctx.stroke();
        ctx.globalAlpha=fade*.8;block(ctx,x-size+1,y-2,1,3,'#effff9');block(ctx,x-1,y-size+1,3,1,'#effff9');
      }else{
        const shine=Math.pow(Math.max(0,Math.sin(age*.16+i*1.7+echo)),3),size=4+i%4;
        ctx.globalAlpha=fade*(.28+shine*.65);
        block(ctx,x-size,y,size*2+1,1,'#dcfff6');block(ctx,x,y-size,1,size*2+1,'#dcfff6');
        ctx.globalAlpha=fade*(.4+shine*.6);block(ctx,x-1,y-1,3,3,'#ffffff');
      }
    }
  }
  ctx.restore();
}

function drawChorusPearlSpray(ctx:CanvasRenderingContext2D,cx:number,cy:number,width:number,height:number,age:number){
  ctx.save();ctx.shadowBlur=0;
  for(let i=0;i<48;i++){
    const p=(age-i%6*2)/(66+i%4*5);if(p<=0||p>=1)continue;
    const angle=i*2.39996+.2,reach=width*(.44+i%5*.055),lift=height*(.14+i%3*.045);
    const at=(t:number)=>{const d=reach*(1-(1-t)*(1-t));return[Math.cos(angle)*d,Math.sin(angle)*d*.65-Math.sin(t*Math.PI)*lift+t*t*height*.1];};
    const [x,y]=at(p),[px,py]=at(Math.max(0,p-.025)),turn=Math.atan2(y-py,x-px),fade=Math.sin(p*Math.PI)*Math.pow(1-p,.35)*.3,size=6+i%4*2;
    ctx.save();ctx.translate(Math.round(cx+x),Math.round(cy+y));ctx.rotate(turn);ctx.scale(.4,.4);
    ctx.globalAlpha=fade*.8;block(ctx,-size/2,-size*.35,size,size*.7,'#459abb');
    block(ctx,-size/2,-size*.35,size,3,i%3?'#a7eee8':'#effff8');
    ctx.globalAlpha=fade;block(ctx,size*.12,-1,size*.28,2,'#f5fff9');ctx.restore();
    if(i%4===0){
      const shine=fade*(.35+.65*Math.pow(Math.max(0,Math.sin(age*.13+i)),3));
      ctx.globalAlpha=shine*.6;block(ctx,cx+x-3,cy+y-.5,6,1,'#dffff5');block(ctx,cx+x-.5,cy+y-3,1,6,'#dffff5');
    }
  }
  ctx.restore();
}

export function drawSkyLaserImpact(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number) {
  const impact=state.neptune?.laserImpact;if(!impact)return;
  const total=120,age=total-impact.ticks,progress=age/total;
  const [r1,c1,r2,c2]=CHAMBER_BOUNDS[impact.chamber];
  const left=c1*TILE_SIZE-camX,top=r1*TILE_SIZE-camY,width=(c2-c1+1)*TILE_SIZE,height=(r2-r1+1)*TILE_SIZE,cx=left+width/2,cy=top+height/2;
  drawPrimalAftershock(ctx,state,camX,camY,impact.chamber,age,'#54bad3','#dffff5',false);
  ctx.save();ctx.shadowBlur=0;
  ctx.globalAlpha=Math.max(0,1-age/12)*.36;ctx.fillStyle='#ddfff7';ctx.fillRect(left,top,width,height);
  // Preserve the original broad strike and narrowing core, with cool pearl water layers.
  const beam=Math.max(10,width*Math.max(0,1-age/26)),fade=Math.max(0,1-Math.max(0,age-26)/30),beamTop=top-900;
  ctx.globalAlpha=.25*fade;ctx.fillStyle='#3e9fc3';ctx.fillRect(Math.round(cx-beam/2-18),beamTop,Math.round(beam+36),cy-beamTop);
  ctx.globalAlpha=.65*fade;ctx.fillStyle='#8bdbe5';ctx.fillRect(Math.round(cx-beam/2),beamTop,Math.round(beam),cy-beamTop);
  ctx.globalAlpha=fade;ctx.fillStyle='#e6fff8';ctx.fillRect(Math.round(cx-beam/6),beamTop,Math.round(beam/3),cy-beamTop);
  // Fine refractions remain inside the same column silhouette.
  for(const side of [-1,1]){ctx.globalAlpha=fade*.7;ctx.fillStyle='#bafff5';ctx.fillRect(Math.round(cx+side*beam*.39),beamTop,2,cy-beamTop);}
  // Pearl refractions flow inside the original column, preserving its silhouette.
  for(let i=0;i<6;i++){
    const f=(i-2.5)/6,xx=cx+beam*f*.85,travel=(age*31+i*149)%Math.max(1,cy-beamTop);
    ctx.globalAlpha=fade*(i%2?.22:.4);ctx.fillStyle=i%2?'#53b9d4':'#c6fff3';
    ctx.fillRect(Math.round(xx),beamTop,2,cy-beamTop);
    ctx.globalAlpha=fade*.8;ctx.fillStyle='#f2fff8';ctx.fillRect(Math.round(xx)-1,beamTop+travel,4,18+i%3*8);
  }
  drawChorusPearlSpray(ctx,cx,cy,width,height,age);
  const reach=Math.max(...[[0,0],[MAP_COLS*TILE_SIZE,0],[0,MAP_ROWS*TILE_SIZE],[MAP_COLS*TILE_SIZE,MAP_ROWS*TILE_SIZE]].map(([x,y])=>Math.hypot(x-(cx+camX),y-(cy+camY))));
  drawChorusWaveScatter(ctx,cx,cy,reach,age);
  ctx.beginPath();ctx.rect(left,top,width,height);ctx.clip();
  for(let i=0;i<4;i++){
    const t=(age-i*7)/45;if(t<=0||t>=1)continue;
    const half=Math.round((20+t*width*.6)/8)*8;
    ctx.globalAlpha=(1-t)*(i%2?.3:.7);ctx.strokeStyle=i%2?'#54bad3':'#dffff5';ctx.lineWidth=i%2?3:5;
    ctx.shadowColor='#a5f3ed';ctx.shadowBlur=i%2?0:4;ctx.strokeRect(cx-half,cy-half,half*2,half*2);ctx.shadowBlur=0;
  }
  // Large shaded water drops, each with a pale face and a blue underside.
  for(let i=0;i<64;i++){
    const angle=i*2.39996,speed=3+i%6,lift=5+i%4*2;
    const x=cx+Math.cos(angle)*speed*age,y=cy+Math.sin(angle)*speed*age*.55-lift*age+.18*age*age,size=4+i%4;
    ctx.globalAlpha=(1-progress)*(i%3?.18:.24);ctx.fillStyle='#58afcf';ctx.fillRect(Math.round(x),Math.round(y),size,size+2);
    ctx.fillStyle=i%3?'#adefe9':'#eafff7';ctx.fillRect(Math.round(x),Math.round(y),size,2);
    ctx.globalAlpha*=.75;ctx.fillStyle='#dcfff5';ctx.fillRect(Math.round(x)+2,Math.round(y)+2,1,Math.max(2,size-2));
  }
  // Prominent pearl glints follow the splash with a clean, staggered shimmer.
  for(let i=0;i<24;i++){
    const angle=i*2.39996,r=age*(2+i%3),xx=cx+Math.cos(angle)*r,yy=cy+Math.sin(angle)*r*.6-age*.7;
    const shine=Math.max(0,Math.sin(age*.16+i));ctx.globalAlpha=(1-progress)*shine*.2;ctx.fillStyle='#e6fff6';
    const size=3+i%3*.5;
    ctx.fillRect(Math.round(xx)-size,Math.round(yy)-1,size*2,1.5);ctx.fillRect(Math.round(xx)-1,Math.round(yy)-size,1.5,size*2);
    ctx.globalAlpha=(1-progress)*shine*.3;ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(xx)-1,Math.round(yy)-1,2,2);
  }
  ctx.restore();
}

/** A screen-wide tide flows toward the Sea Chanter as she resurfaces. */
export function drawNeptuneResurfaceEffect(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, width: number, height: number, camX: number, camY: number, zoom: number) {
  const remaining = state.neptune?.resurfaceEffectTicks ?? 0;
  if (remaining <= 0) return;
  const boss = state.enemies.find(enemy => enemy.id === state.neptune?.bossId && enemy.hp > 0);
  if (!boss) return;

  const age = NEPTUNE_CLONE_HEAL_FX_TICKS - remaining;
  const fade = remaining / NEPTUNE_CLONE_HEAL_FX_TICKS;
  const bossX = (boss.x - camX) * zoom, bossY = (boss.y - camY) * zoom;
  const x = Math.max(24, Math.min(width - 24, bossX)), y = Math.max(24, Math.min(height - 24, bossY));
  const span = Math.hypot(width, height);

  ctx.save();
  ctx.globalAlpha = fade * .09 + Math.max(0, 1 - age / 12) * .22;
  block(ctx, 0, 0, width, height, '#65def4');

  for (let i = 0; i < 3; i++) {
    const travel = (age - i * 9) / 49;
    if (travel < 0 || travel >= 1) continue;
    const radius = 30 + span * .78 * (1 - travel) ** 1.3;
    const half = radius * .53;
    ctx.beginPath();
    ctx.moveTo(x - half, y - radius);
    ctx.lineTo(x + half, y - radius);
    ctx.lineTo(x + half, y - half);
    ctx.lineTo(x + radius, y - half);
    ctx.lineTo(x + radius, y + half);
    ctx.lineTo(x + half, y + half);
    ctx.lineTo(x + half, y + radius);
    ctx.lineTo(x - half, y + radius);
    ctx.lineTo(x - half, y + half);
    ctx.lineTo(x - radius, y + half);
    ctx.lineTo(x - radius, y - half);
    ctx.lineTo(x - half, y - half);
    ctx.closePath();
    ctx.globalAlpha = fade * .14;
    ctx.strokeStyle = '#38b8e2';
    ctx.lineWidth = 22;
    ctx.stroke();
    ctx.globalAlpha = fade * .65;
    ctx.strokeStyle = i ? '#67d8f0' : '#bcfff3';
    ctx.lineWidth = i ? 3 : 6;
    ctx.stroke();
  }

  for (let i = 0; i < 54; i++) {
    const travel = (age - i % 9 * 2) / (44 + i % 5 * 4);
    if (travel <= 0 || travel >= 1) continue;
    const angle = i * 2.39996 + travel * .48;
    const distance = 26 + span * (.42 + i % 5 * .055) * (1 - travel) ** 1.35;
    ctx.save();
    ctx.translate(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
    ctx.rotate(angle);
    ctx.globalAlpha = Math.sin(travel * Math.PI) * fade * .85;
    block(ctx, 0, -2, 10 + i % 5 * 8, 3 + i % 3, i % 4 ? '#68cfe9' : '#e4fffb');
    block(ctx, -7, 3, 4, 4, '#b7faef');
    ctx.restore();
  }

  if (state.neptune?.resurfaceHealed && bossX === x && bossY === y && age >= 28) {
    const life = (age - 28) / (NEPTUNE_CLONE_HEAL_FX_TICKS - 28);
    for (let i = 0; i < 6; i++) {
      const px = x + (i - 2.5) * 17;
      const py = y - 22 - i % 2 * 15 - life * (40 + i % 3 * 11);
      ctx.globalAlpha = Math.sin(life * Math.PI) * .85;
      block(ctx, px - 6, py - 2, 12, 4, '#b8ffdf');
      block(ctx, px - 2, py - 6, 4, 12, '#dcfff3');
    }
  }
  ctx.restore();
}
