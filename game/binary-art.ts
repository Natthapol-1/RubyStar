import { TILE_SIZE } from './constants';
import { BINARY, BINARY_TWIN_COLORS, POLE_COLORS, binaryTwins, cloneMagnet, grounded, magneticEnemies, reversalTimer, twinPole, type Pole } from './binary';
import type { Enemy, GameState } from './engine';
import { drawEnemyHealthBar } from './enemy-health-art';

// Binary Star world art. Read-only: everything is drawn from state and gameTick.

const POLE_DARK: Record<Pole, string> = { north: '#5a2a2a', south: '#1d3550' };
const POLE_PALE: Record<Pole, string> = { north: '#ffd9cc', south: '#e3f5ff' };

/** A blocky horseshoe magnet: a solid U in the pole colour, dark inset, pale tips. */
export function drawMagnet(ctx: CanvasRenderingContext2D, x: number, y: number, pole: Pole, tick: number, scale = 1) {
  x = Math.round(x); y = Math.round(y);
  const c = POLE_COLORS[pole], dark = POLE_DARK[pole], pale = POLE_PALE[pole], u = 3 * scale;
  ctx.save();
  // grounded plate
  ctx.globalAlpha = .55; ctx.fillStyle = dark; ctx.fillRect(x - 7 * u, y - 7 * u, 14 * u, 14 * u);
  ctx.globalAlpha = 1; ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.strokeRect(x - 7 * u + 1, y - 7 * u + 1, 14 * u - 2, 14 * u - 2);
  // U body
  ctx.shadowColor = c; ctx.shadowBlur = 4 + 2 * Math.sin(tick * .08);
  ctx.fillStyle = c;
  ctx.fillRect(x - 5 * u, y - 4 * u, 3 * u, 8 * u); ctx.fillRect(x + 2 * u, y - 4 * u, 3 * u, 8 * u); ctx.fillRect(x - 5 * u, y + 2 * u, 10 * u, 3 * u);
  ctx.shadowBlur = 0; ctx.fillStyle = dark;
  ctx.fillRect(x - 4 * u, y - 2 * u, u, 5 * u); ctx.fillRect(x + 3 * u, y - 2 * u, u, 5 * u); ctx.fillRect(x - 4 * u, y + 3 * u, 8 * u, u);
  // pale tips
  ctx.fillStyle = pale; ctx.fillRect(x - 5 * u, y - 5 * u, 3 * u, 2 * u); ctx.fillRect(x + 2 * u, y - 5 * u, 3 * u, 2 * u);
  ctx.restore();
}

/** Chevrons around a source in range of the player: moving out for a push, in for a pull. */
function drawForceChevrons(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, repel: boolean, tick: number) {
  ctx.save(); ctx.fillStyle = color;
  for (let k = 0; k < 2; k++) {
    const life = ((tick * 1.2 + k * 24) % 48) / 48, reach = 26 + (repel ? life : 1 - life) * 52;
    ctx.globalAlpha = .55 * Math.sin(life * Math.PI);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const cx = Math.round(x + dx * reach), cy = Math.round(y + dy * reach), out = repel ? 1 : -1;
      // a two-block chevron pointing along the force
      if (dx) { ctx.fillRect(cx - 3 * out * dx, cy - 8, 6, 6); ctx.fillRect(cx - 3 * out * dx, cy + 2, 6, 6); ctx.fillRect(cx + 3 * out * dx - 3, cy - 3, 6, 6); }
      else { ctx.fillRect(cx - 8, cy - 3 * out * dy, 6, 6); ctx.fillRect(cx + 2, cy - 3 * out * dy, 6, 6); ctx.fillRect(cx - 3, cy + 3 * out * dy - 3, 6, 6); }
    }
  }
  ctx.restore();
}

export function drawBinaryGround(ctx: CanvasRenderingContext2D, s: GameState, camX: number, camY: number) {
  const b = s.binary; if (!b) return;
  const tick = s.gameTick, range = BINARY.magnetRange;
  const moving = b.magnetTimer <= BINARY.magnetMoveWarning, blink = moving && Math.floor(b.magnetTimer / 8) % 2 === 0;
  for (const m of b.magnets) {
    const x = (m.x + .5) * TILE_SIZE - camX, y = (m.y + .5) * TILE_SIZE - camY;
    if (blink) { ctx.save(); ctx.globalAlpha = .35; drawMagnet(ctx, x, y, m.pole, tick); ctx.restore(); continue; } // about to move
    if (Math.hypot(s.playerTileX - m.x, s.playerTileY - m.y) <= range) drawForceChevrons(ctx, x, y, POLE_COLORS[m.pole], m.pole === b.pole, tick);
    drawMagnet(ctx, x, y, m.pole, tick);
  }
  // Your field on a twin in reach: chevrons around the twin in your pole's colour, outward when you push it, inward when
  // you pull it. A Lodestone's field on you: chevrons around it in its own colour.
  for (const { e, pole } of magneticEnemies(s)) {
    if (Math.max(Math.abs(s.playerTileX - e.tileX), Math.abs(s.playerTileY - e.tileY)) > range) continue; // square reach, as in gameplay
    drawForceChevrons(ctx, e.x - camX, e.y - camY, POLE_COLORS[e.type === 'lodestone' ? pole : b.pole], pole === b.pole, tick);
  }
  // Phase 3 charging tiles (drawn by the shared painter, which the rule sheet uses too).
  for (const c of b.chargeTiles ?? []) {
    const charging = Object.values(b.chargeSeek ?? {}).some(g => g && g.charging && g.x === c.x && g.y === c.y);
    drawChargeTile(ctx, c.x * TILE_SIZE - camX, c.y * TILE_SIZE - camY, tick, charging);
  }
  // Grounder: a dull grey square marks the tiles its grounding reaches.
  for (const g of s.enemies) {
    if (g.type !== 'grounder' || g.hp <= 0) continue;
    const r = (BINARY.grounder.reach + .5) * TILE_SIZE, x = Math.round(g.x - camX), y = Math.round(g.y - camY);
    ctx.save(); ctx.globalAlpha = .07; ctx.fillStyle = '#9aa3b5'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = .45; ctx.strokeStyle = '#9aa3b5'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  // A dead Pulsar's field: its reach in the pole's colour, chevrons showing its pull or push on you, a shrinking
  // blast square inside it and a pulsing core, all brightening as the explosion nears.
  for (const f of b.pulsarFields ?? []) {
    if (f.ticks <= 0) continue;
    const P = BINARY.pulsar, col = POLE_COLORS[f.pole], x = (f.x + .5) * TILE_SIZE - camX, y = (f.y + .5) * TILE_SIZE - camY;
    const t = 1 - f.ticks / P.fieldTicks, r = (P.range + .5) * TILE_SIZE, blast = (P.blast + .5) * TILE_SIZE, urgent = f.ticks < 40 && Math.floor(tick / 3) % 2 === 0;
    ctx.save();
    ctx.globalAlpha = .08 + .1 * t; ctx.fillStyle = col; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = .55 + .35 * t; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([12, 6]); ctx.lineDashOffset = -tick * 1.5; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    ctx.setLineDash([]); ctx.strokeStyle = urgent ? '#ffffff' : col; ctx.lineWidth = 4; const inset = Math.round((1 - t) * 40); ctx.strokeRect(x - blast + inset, y - blast + inset, (blast - inset) * 2, (blast - inset) * 2);
    const core = 10 + Math.round(6 * Math.abs(Math.sin(tick * (.15 + t * .4)))); ctx.globalAlpha = 1; ctx.fillStyle = urgent ? '#ffffff' : col; ctx.fillRect(Math.round(x) - core / 2, Math.round(y) - core / 2, core, core);
    ctx.restore();
    if (Math.max(Math.abs(s.playerTileX - f.x), Math.abs(s.playerTileY - f.y)) <= P.range) drawForceChevrons(ctx, x, y, col, f.pole === b.pole, tick);
  }
  const clone = cloneMagnet(s); // your F twin's field: a faint dashed square in its pole's colour marks its reach
  if (clone) {
    const x = (clone.x + .5) * TILE_SIZE - camX, y = (clone.y + .5) * TILE_SIZE - camY, r = (clone.range + .5) * TILE_SIZE, fade = Math.min(1, s.mirrorTwinTicks / 30);
    ctx.save(); ctx.globalAlpha = .06 * fade; ctx.fillStyle = POLE_COLORS[clone.pole]; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = .4 * fade; ctx.strokeStyle = POLE_COLORS[clone.pole]; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -tick * .5; ctx.strokeRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
}

/** Twin jump warning, echo shots and jump flashes, drawn above units. */
export function drawBinaryEffects(ctx: CanvasRenderingContext2D, s: GameState, camX: number, camY: number) {
  const b = s.binary; if (!b) return;
  const tick = s.gameTick;
  if (b.swapTimer <= BINARY.swapWarning) {
    const t = 1 - b.swapTimer / BINARY.swapWarning;
    for (const twin of binaryTwins(s)) {
      if (twin.hp <= 0 || twin.twin!.downedTicks) continue;
      const x = Math.round(twin.x - camX), y = Math.round(twin.y - camY), r = Math.round(44 - t * 20), arm = 12;
      ctx.save(); ctx.globalAlpha = .5 + .5 * Math.abs(Math.sin(tick * (.2 + t * .3)));
      ctx.fillStyle = BINARY_TWIN_COLORS[twin.twin!.index];
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        ctx.fillRect(x + sx * r - (sx > 0 ? 4 : 0), y + sy * r - (sy > 0 ? 4 : 0), 4, 4);
        ctx.fillRect(x + sx * r - (sx > 0 ? arm : 0), y + sy * r - (sy > 0 ? 4 : 0), arm, 4);
        ctx.fillRect(x + sx * r - (sx > 0 ? 4 : 0), y + sy * r - (sy > 0 ? arm : 0), 4, arm);
      }
      ctx.restore();
    }
  }
  // The bond: while the twins are bound, a dashed line in their two colours joins them; it is gone while they are exposed.
  const pair = binaryTwins(s).filter(t => t.hp > 0 && !t.twin!.downedTicks);
  if (pair.length === 2 && !((b.exposed ?? 0) > 0)) {
    const [p, q] = pair, mx = (p.x + q.x) / 2 - camX, my = (p.y + q.y) / 2 - camY;
    ctx.save(); ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.lineDashOffset = -tick * .6; ctx.globalAlpha = .35 + .1 * Math.sin(tick * .1);
    ctx.strokeStyle = BINARY_TWIN_COLORS[0]; ctx.beginPath(); ctx.moveTo(p.x - camX, p.y - camY); ctx.lineTo(mx, my); ctx.stroke();
    ctx.strokeStyle = BINARY_TWIN_COLORS[1]; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(q.x - camX, q.y - camY); ctx.stroke();
    ctx.restore();
  }
  // Exposed: each twin flickers inside a white frame.
  if ((b.exposed ?? 0) > 0) for (const t of pair) {
    const x = Math.round(t.x - camX), y = Math.round(t.y - camY), r = 34 + Math.round(Math.sin(tick * .3) * 2);
    ctx.save(); ctx.globalAlpha = .5 + .4 * Math.abs(Math.sin(tick * .2)); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  drawTwinMoves(ctx, s, camX, camY);
  // Phase 3: each twin wears an aura in its current pole's colour; before it flips, the aura blinks between both.
  if (b.phase >= BINARY.reversal.fromPhase) for (const t of binaryTwins(s)) {
    if (t.hp <= 0 || t.twin!.downedTicks) continue;
    const pole = twinPole(t), left = reversalTimer(s, t), warning = left <= BINARY.reversal.warn;
    const col = warning && Math.floor(left / 6) % 2 ? POLE_COLORS[pole === 'north' ? 'south' : 'north'] : POLE_COLORS[pole];
    const x = Math.round(t.x - camX), y = Math.round(t.y - camY), pulse = .5 + .5 * Math.sin(tick * .12), r = 30 + Math.round(pulse * 4);
    ctx.save(); ctx.globalAlpha = warning ? .3 : .14 + .08 * pulse; ctx.fillStyle = col; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = warning ? .95 : .55; ctx.strokeStyle = col; ctx.lineWidth = warning ? 4 : 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  // Grounded twins: a dull grey frame with four heavy corner blocks.
  for (const t of binaryTwins(s)) {
    if (t.hp <= 0 || t.twin!.downedTicks || !grounded(s, t)) continue;
    const x = Math.round(t.x - camX), y = Math.round(t.y - camY), r = 32;
    ctx.save(); ctx.globalAlpha = .8; ctx.strokeStyle = '#9aa3b5'; ctx.lineWidth = 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = '#c6ccd8'; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(x + sx * r - 5, y + sy * r - 5, 10, 10); ctx.restore();
  }
  // Binary Collision, 1.5s: the screen splits coral and blue around a white-hot core, a cross of light seams sweeps the
  // whole view, four layered stepped shock fronts and eight straight light rays burst out, chunky debris flies and
  // falls, and a scorched coral/blue ring lingers on the floor. A Lodestone burst reuses it smaller and without the
  // screen-wide parts.
  for (const c of b.collisions ?? []) {
    const total = c.small ? 50 : 90, p = 1 - c.ticks / total, x = Math.round(c.x - camX), y = Math.round(c.y - camY), ease = 1 - (1 - p) ** 3;
    const [coral, blue] = BINARY_TWIN_COLORS;
    ctx.save();
    if (!c.small) {
      if (p < .22) { // split flash: coral left, blue right, white over everything at the first instant
        const f = 1 - p / .22; ctx.globalAlpha = .45 * f; ctx.fillStyle = coral; ctx.fillRect(x - 4000, y - 4000, 4000, 8000); ctx.fillStyle = blue; ctx.fillRect(x, y - 4000, 4000, 8000);
        ctx.globalAlpha = .7 * f * f; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4000, y - 4000, 8000, 8000);
      }
      if (p < .45) { // a cross of light seams across the whole view
        const f = 1 - p / .45, w = Math.round(28 * f) + 2; ctx.globalAlpha = .85 * f;
        ctx.fillStyle = coral; ctx.fillRect(x - 4000, y - w, 4000, w * 2); ctx.fillStyle = blue; ctx.fillRect(x, y - w, 4000, w * 2);
        ctx.fillStyle = coral; ctx.fillRect(x - w, y - 4000, w * 2, 4000); ctx.fillStyle = blue; ctx.fillRect(x - w, y, w * 2, 4000);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4000, y - Math.max(1, w / 4), 8000, Math.max(2, w / 2)); ctx.fillRect(x - Math.max(1, w / 4), y - 4000, Math.max(2, w / 2), 8000);
      }
      // a scorched ring on the floor, fading over the last half
      const ring = 90; ctx.globalAlpha = Math.min(1, (1 - p) * 2) * .5; ctx.strokeStyle = coral; ctx.lineWidth = 6; ctx.strokeRect(x - ring, y - ring, ring, ring * 2); ctx.strokeStyle = blue; ctx.strokeRect(x, y - ring, ring, ring * 2);
    } else { ctx.translate(x, y); ctx.scale(.45, .45); ctx.translate(-x, -y); }
    // eight straight light rays, each one solid band turned as a whole
    if (p < .55) for (let k = 0; k < 8; k++) {
      const f = 1 - p / .55, len = 60 + 260 * ease; ctx.save(); ctx.translate(x, y); ctx.rotate(k * Math.PI / 4 + .2);
      ctx.globalAlpha = .8 * f; ctx.fillStyle = k % 2 ? blue : coral; ctx.fillRect(0, -7 * f - 1, len, 14 * f + 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -2 * f - 1, len * .8, 4 * f + 2); ctx.restore();
    }
    // four stepped shock fronts: white, coral, blue, white
    for (const [k, col] of [[0, '#ffffff'], [1, coral], [2, blue], [3, '#ffffff']] as const) {
      const r = 24 + (300 - k * 55) * Math.max(0, ease - k * .07); ctx.globalAlpha = (1 - p) * (k === 3 ? .5 : 1); ctx.strokeStyle = col; ctx.lineWidth = 16 - k * 3;
      ctx.strokeRect(x - r, y - r, r * 2, r * 2); ctx.strokeRect(x - r + 8, y - r + 8, r * 2 - 16, r * 2 - 16);
    }
    // chunky debris thrown out and falling
    for (let k = 0; k < 30; k++) {
      const ang = k * 2.39996, speed = .6 + (k % 5) * .15, d = 30 + 260 * ease * speed, fall = p * p * 140 * (.5 + (k % 3) * .3), sz = k % 4 === 0 ? 16 : k % 3 ? 8 : 11;
      ctx.globalAlpha = 1 - p; ctx.fillStyle = k % 5 === 0 ? '#ffffff' : k % 2 ? coral : blue;
      ctx.fillRect(Math.round(x + Math.cos(ang) * d - sz / 2), Math.round(y + Math.sin(ang) * d + fall - sz / 2), sz, sz);
    }
    if (p < .4) { const s2 = 70 * (1 - p / .4); ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - s2 / 2, y - s2 / 2, s2, s2); ctx.fillStyle = coral; ctx.fillRect(x - s2 / 2, y - s2 / 2, s2 / 2, 4); ctx.fillStyle = blue; ctx.fillRect(x, y + s2 / 2 - 4, s2 / 2, 4); }
    ctx.restore();
  }
  // Swap surge: a stepped bolt of blocks from you to the enemy it jolts, and a square burst on it.
  for (const z of b.zaps) {
    const age = 1 - z.ticks / 24, tx = Math.round(z.x - camX), ty = Math.round(z.y - camY), px = (z.fromX ?? s.playerX) - camX, py = (z.fromY ?? s.playerY) - camY;
    ctx.save(); ctx.globalAlpha = 1 - age; ctx.fillStyle = z.color;
    const steps = Math.max(2, Math.round(Math.hypot(tx - px, ty - py) / 14));
    for (let k = 1; k < steps; k++) {
      const t = k / steps, jx = k % 2 ? 5 : -5;
      ctx.fillRect(Math.round(px + (tx - px) * t + jx) - 4, Math.round(py + (ty - py) * t - jx) - 4, 8, 8);
    }
    const r = Math.round(18 + age * 28);
    ctx.strokeStyle = z.color; ctx.lineWidth = 8; ctx.strokeRect(tx - r, ty - r, r * 2, r * 2);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.strokeRect(tx - r * .55, ty - r * .55, r * 1.1, r * 1.1);
    ctx.restore();
  }
  for (const j of b.jumps) {
    const age = 1 - j.ticks / 30, r = j.arrive ? 10 + age * 40 : 50 - age * 40, x = Math.round(j.x - camX), y = Math.round(j.y - camY);
    ctx.save(); ctx.globalAlpha = (1 - age) * .9; ctx.strokeStyle = j.color; ctx.lineWidth = 6; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff'; ctx.strokeRect(x - r * .6, y - r * .6, r * 1.2, r * 1.2);
    if (!j.arrive) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y - 24 + age * 16, 4, 48 - age * 32); }
    ctx.restore();
  }
}

/** Dawn's Comet Dash lane and afterimages, Dusk's Starfall marks and bursts, and the Twin Beam between them. */
function drawTwinMoves(ctx: CanvasRenderingContext2D, s: GameState, camX: number, camY: number) {
  const m = s.binary?.moves; if (!m) return;
  const tick = s.gameTick, coral = BINARY_TWIN_COLORS[0], blue = BINARY_TWIN_COLORS[1];
  const dash = m.dash, dawn = dash ? s.enemies.find(e => e.id === dash.id) : null;
  if (dash && dawn) {
    if (dash.warn > 0) { // the lane: coral tiles along the dash, flashing white near the end
      const urgent = dash.warn < 12 && Math.floor(tick / 3) % 2 === 0;
      ctx.save();
      for (let k = 1; k <= dash.tiles; k++) {
        const x = (dawn.tileX + dash.dx * k) * TILE_SIZE - camX, y = (dawn.tileY + dash.dy * k) * TILE_SIZE - camY;
        ctx.globalAlpha = .16 + .12 * Math.sin(tick * .3 - k * .6); ctx.fillStyle = urgent ? '#ffffff' : coral; ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.globalAlpha = .75; ctx.fillStyle = urgent ? '#ffffff' : coral; // a chevron pointing along the dash
        const cx = x + TILE_SIZE / 2, cy = y + TILE_SIZE / 2;
        for (let j = -1; j <= 1; j++) ctx.fillRect(Math.round(cx + dash.dx * (6 - Math.abs(j) * 6) + (dash.dy ? j * 6 : 0)) - 3, Math.round(cy + dash.dy * (6 - Math.abs(j) * 6) + (dash.dx ? j * 6 : 0)) - 3, 6, 6);
      }
      ctx.restore();
    }
    for (const p of dash.trail) { // afterimages: fading coral squares
      ctx.save(); ctx.globalAlpha = p.ticks / 12 * .5; ctx.fillStyle = coral; ctx.fillRect(Math.round(p.x - camX) - 18, Math.round(p.y - camY) - 18, 36, 36); ctx.restore();
    }
  }
  for (const st of m.stars) {
    const x = st.x * TILE_SIZE - camX, y = st.y * TILE_SIZE - camY, size = TILE_SIZE * 3, left = x - TILE_SIZE, top = y - TILE_SIZE;
    ctx.save();
    if (st.ticks > 0) { // a blue 3×3 mark with a square closing in, and a falling star block above it
      const t = 1 - st.ticks / BINARY.starfall.warn, inset = Math.round((1 - t) * 30);
      ctx.globalAlpha = .12 + .1 * t; ctx.fillStyle = blue; ctx.fillRect(left, top, size, size);
      ctx.globalAlpha = .8; ctx.strokeStyle = st.ticks < 15 && Math.floor(tick / 3) % 2 === 0 ? '#ffffff' : blue; ctx.lineWidth = 3; ctx.strokeRect(left + inset, top + inset, size - inset * 2, size - inset * 2);
      const fall = Math.max(0, st.ticks - 6) * 9, cx = x + TILE_SIZE / 2, cy = y + TILE_SIZE / 2 - fall;
      ctx.globalAlpha = Math.min(1, t * 2); ctx.fillStyle = '#e9f6ff'; ctx.fillRect(Math.round(cx) - 6, Math.round(cy) - 6, 12, 12);
      ctx.fillStyle = blue; ctx.fillRect(Math.round(cx) - 3, Math.round(cy) - 18, 6, 10); ctx.globalAlpha *= .5; ctx.fillRect(Math.round(cx) - 2, Math.round(cy) - 30, 4, 10);
    } else { // the burst: a white flash, an expanding blue square and four sparks
      const p = 1 - st.burst / 24, cx = x + TILE_SIZE / 2, cy = y + TILE_SIZE / 2, r = 12 + p * 60;
      ctx.globalAlpha = 1 - p; ctx.fillStyle = '#ffffff'; if (p < .3) ctx.fillRect(left, top, size, size);
      ctx.strokeStyle = blue; ctx.lineWidth = 6; ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = '#e9f6ff'; for (const [sx, sy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.fillRect(Math.round(cx + sx * r * 1.2) - 4, Math.round(cy + sy * r * 1.2) - 4, 8, 8);
    }
    ctx.restore();
  }
  const bm = m.beam;
  if (bm) {
    const ax = bm.ax - camX, ay = bm.ay - camY, bx = bm.bx - camX, by = bm.by - camY;
    ctx.save(); ctx.lineCap = 'butt';
    if (bm.warn > 0) { // a dashed coral-to-blue link that tightens and brightens as it charges
      const t = 1 - bm.warn / BINARY.beam.warn, mx = (ax + bx) / 2, my = (ay + by) / 2;
      ctx.globalAlpha = .4 + .5 * t; ctx.lineWidth = 2 + t * 4; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -tick * 2;
      ctx.strokeStyle = coral; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx, my); ctx.stroke();
      ctx.strokeStyle = blue; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(bx, by); ctx.stroke();
      if (bm.warn < 15 && Math.floor(tick / 3) % 2 === 0) { ctx.setLineDash([]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); }
    } else { // the beam: a wide coral band, a blue band and a white core, as straight stroked bands
      const fade = bm.fire / BINARY.beam.fire, w = BINARY.beam.reach * TILE_SIZE * 2;
      for (const [width, col, a] of [[w, coral, .35], [w * .6, blue, .7], [w * .22, '#ffffff', 1]] as const) {
        ctx.globalAlpha = a * fade; ctx.strokeStyle = col; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
    }
    ctx.restore();
  }
}

/** Your current pole: a square frame in its colour around the player, flaring when you swap. */
export function drawPoleFrame(ctx: CanvasRenderingContext2D, s: GameState, x: number, y: number, pole = s.binary?.pole) {
  const b = s.binary; if (!b || !pole) return;
  const c = POLE_COLORS[pole], flare = b.swapFlashTicks / 18, r = Math.round(30 + flare * 10);
  x = Math.round(x); y = Math.round(y);
  ctx.save(); ctx.globalAlpha = .55 + .45 * flare; ctx.shadowColor = c; ctx.shadowBlur = 4;
  ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
  ctx.shadowBlur = 0; ctx.fillStyle = POLE_PALE[pole];
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(x + sx * r - 3, y + sy * r - 3, 6, 6);
  ctx.restore();
}

export function drawBinaryMinimap(ctx: CanvasRenderingContext2D, s: GameState, ox: number, oy: number, scale: number) {
  const b = s.binary; if (!b) return;
  for (const c of b.chargeTiles ?? []) { const x = Math.round(ox + (c.x + .5) * scale), y = Math.round(oy + (c.y + .5) * scale); ctx.fillStyle = '#e9f6ff'; ctx.fillRect(x - 2, y - 2, 4, 4); }
  for (const m of b.magnets) {
    const x = Math.round(ox + (m.x + .5) * scale), y = Math.round(oy + (m.y + .5) * scale);
    ctx.fillStyle = POLE_COLORS[m.pole];
    ctx.fillRect(x - 3, y - 3, 6, 2); ctx.fillRect(x - 3, y - 3, 2, 6); ctx.fillRect(x + 1, y - 3, 2, 6);
  }
}

/**
 * Lodestone: a squat steel-lilac block wearing a horseshoe magnet as horns, in its pole's colour, with a dark visor and
 * two pale eyes. The horn tips spark faintly. Returns false for other units.
 */
export function drawBinaryUnit(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number): boolean {
  if (e.type === 'grounder') { drawGrounder(ctx, e, sx, sy, tick); return true; }
  if (e.type === 'pulsar' && e.pole) { drawPulsar(ctx, e, sx, sy, tick); return true; }
  if (e.type !== 'lodestone' || !e.pole) return false;
  const pole = e.pole, c = POLE_COLORS[pole], dark = POLE_DARK[pole], pale = POLE_PALE[pole], flash = e.flashTicks > 0;
  const bob = Math.floor(tick / 10 + e.id) % 2, x = Math.round(sx), y = Math.round(sy) + bob;
  ctx.save(); ctx.shadowBlur = 0;
  // horseshoe horns
  ctx.fillStyle = flash ? '#ffffff' : c;
  ctx.fillRect(x - 13, y - 22, 6, 12); ctx.fillRect(x + 7, y - 22, 6, 12); ctx.fillRect(x - 13, y - 14, 26, 5);
  ctx.fillStyle = pale; ctx.fillRect(x - 13, y - 25, 6, 3); ctx.fillRect(x + 7, y - 25, 6, 3);
  if (Math.sin(tick * .2 + e.id) > .6) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 11, y - 29, 2, 2); ctx.fillRect(x + 9, y - 29, 2, 2); }
  // body: glowing pole rim, dark inset, steel panel
  ctx.shadowColor = c; ctx.shadowBlur = 5; ctx.fillStyle = flash ? '#ffffff' : c; ctx.fillRect(x - 15, y - 10, 30, 26); ctx.shadowBlur = 0;
  if (!flash) {
    ctx.fillStyle = dark; ctx.fillRect(x - 12, y - 7, 24, 20);
    ctx.fillStyle = '#c9b8ff'; ctx.globalAlpha = .35; ctx.fillRect(x - 12, y - 7, 24, 5); ctx.globalAlpha = 1;
    ctx.fillStyle = '#0b0918'; ctx.fillRect(x - 9, y - 1, 18, 7);
    ctx.fillStyle = pale; ctx.fillRect(x - 7, y + 1, 4, 3); ctx.fillRect(x + 3, y + 1, 4, 3);
  }
  ctx.restore();
  drawEnemyHealthBar(ctx, e, sx, sy);
  return true;
}

/**
 * Charging tile, one 48px tile with its top-left at (x, y): a recessed plate edged coral (top/left) and blue
 * (bottom/right) holding a stepped battery whose four cells light coral to blue. Idle, one cell glows dimly; while a
 * twin charges, the cells fill one after another and mint healing crosses rise from the plate.
 */
export function drawChargeTile(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, charging: boolean) {
  const T = TILE_SIZE, glow = charging ? .7 + .3 * Math.abs(Math.sin(tick * .15)) : .4 + .15 * Math.sin(tick * .05);
  x = Math.round(x); y = Math.round(y);
  ctx.save();
  ctx.fillStyle = '#100d1f'; ctx.fillRect(x + 4, y + 4, T - 8, T - 8);
  ctx.globalAlpha = glow; ctx.fillStyle = BINARY_TWIN_COLORS[0]; ctx.fillRect(x + 4, y + 4, T - 8, 3); ctx.fillRect(x + 4, y + 4, 3, T - 8);
  ctx.fillStyle = BINARY_TWIN_COLORS[1]; ctx.fillRect(x + 4, y + T - 7, T - 8, 3); ctx.fillRect(x + T - 7, y + 4, 3, T - 8);
  // battery: pale casing with a terminal nub on the right, four cells inside
  ctx.globalAlpha = .55 + glow * .45; ctx.fillStyle = '#e9f6ff';
  ctx.fillRect(x + 11, y + 16, 24, 2); ctx.fillRect(x + 11, y + 30, 24, 2); ctx.fillRect(x + 11, y + 16, 2, 16); ctx.fillRect(x + 33, y + 16, 2, 16); ctx.fillRect(x + 35, y + 21, 3, 6);
  const lit = charging ? 1 + Math.floor(tick / 15) % 4 : 1, cells = ['#f08062', '#d98fa0', '#a6a8d6', '#83cfff'];
  for (let k = 0; k < 4; k++) { ctx.globalAlpha = k < lit ? (charging ? 1 : .35 + .25 * Math.sin(tick * .05)) : .12; ctx.fillStyle = cells[k]; ctx.fillRect(x + 15 + k * 5, y + 20, 4, 8); }
  if (charging) for (let k = 0; k < 3; k++) { const p = ((tick + k * 20) % 60) / 60, cx = x + 12 + k * 12, cy = y + 6 - p * 30; ctx.globalAlpha = 1 - p; ctx.fillStyle = '#8dffb0'; ctx.fillRect(cx - 1, cy - 4, 3, 9); ctx.fillRect(cx - 4, cy - 1, 9, 3); }
  ctx.restore();
}

/** Grounder: a heavy, squat slate block with a grey rim, a dark inset and a downward anchor spike; two dim eyes. */
function drawGrounder(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number) {
  const x = Math.round(sx), y = Math.round(sy), flash = e.flashTicks > 0;
  ctx.save();
  ctx.shadowColor = '#9aa3b5'; ctx.shadowBlur = 3; ctx.fillStyle = flash ? '#ffffff' : '#9aa3b5'; ctx.fillRect(x - 18, y - 14, 36, 28); ctx.shadowBlur = 0;
  if (!flash) {
    ctx.fillStyle = '#2a2f3b'; ctx.fillRect(x - 14, y - 10, 28, 20);
    ctx.fillStyle = '#4a5162'; ctx.fillRect(x - 14, y - 10, 28, 5);
    ctx.fillStyle = '#c6ccd8'; ctx.fillRect(x - 9, y - 3, 5, 3); ctx.fillRect(x + 4, y - 3, 5, 3);
  }
  // the anchor spike driven into the floor, with a pulse running down it
  ctx.fillStyle = flash ? '#ffffff' : '#c6ccd8'; ctx.fillRect(x - 3, y + 14, 6, 9); ctx.fillRect(x - 9, y + 21, 18, 4);
  const p = (tick % 40) / 40; ctx.globalAlpha = 1 - p; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, y + 14 + Math.round(p * 8), 4, 3);
  ctx.restore();
  drawEnemyHealthBar(ctx, e, sx, sy);
}

/** Pulsar: a small diamond-cut block in its pole's colour with a bright beating core and four corner sparks. */
function drawPulsar(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number) {
  const pole = e.pole!, c = POLE_COLORS[pole], dark = POLE_DARK[pole], pale = POLE_PALE[pole], flash = e.flashTicks > 0;
  const x = Math.round(sx), y = Math.round(sy) + Math.floor(tick / 8 + e.id) % 2, beat = Math.abs(Math.sin(tick * .18 + e.id));
  ctx.save();
  // antenna: a short stalk with a square tip that blinks with the beat
  ctx.fillStyle = flash ? '#ffffff' : c; ctx.fillRect(x - 2, y - 21, 4, 8);
  ctx.fillStyle = beat > .7 ? '#ffffff' : pale; ctx.fillRect(x - 3, y - 25, 6, 5);
  // body: glowing square rim in its pole's colour, dark inset
  ctx.shadowColor = c; ctx.shadowBlur = 5; ctx.fillStyle = flash ? '#ffffff' : c; ctx.fillRect(x - 14, y - 13, 28, 27); ctx.shadowBlur = 0;
  if (!flash) {
    ctx.fillStyle = dark; ctx.fillRect(x - 11, y - 10, 22, 21);
    // two pale eyes over a square reactor window whose core swells with the beat
    ctx.fillStyle = pale; ctx.fillRect(x - 7, y - 7, 4, 3); ctx.fillRect(x + 3, y - 7, 4, 3);
    ctx.fillStyle = '#0b0918'; ctx.fillRect(x - 6, y - 1, 12, 9);
    const k = 2 + Math.round(beat * 2); ctx.fillStyle = c; ctx.fillRect(x - k, y + 3 - k, k * 2, k * 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y + 2, 2, 2);
  }
  ctx.restore();
  drawEnemyHealthBar(ctx, e, sx, sy);
}

/**
 * Screen-space jump cue: during the warning the viewport edges blink coral and blue in turn, faster as the jump
 * nears; the jump itself gives a short pale flash with the edges split coral (left/top) and blue (right/bottom).
 */
export function drawBinaryScreen(ctx: CanvasRenderingContext2D, s: GameState, w: number, h: number) {
  const b = s.binary; if (!b || !binaryTwins(s).some(t => t.hp > 0 && !t.twin!.downedTicks)) return;
  const edge = Math.round(Math.min(w, h) * .05);
  ctx.save();
  if (b.swapTimer <= BINARY.swapWarning) {
    const t = 1 - b.swapTimer / BINARY.swapWarning, period = Math.max(4, Math.round(16 - t * 12));
    const on = Math.floor(b.swapTimer / period) % 2 === 0, color = Math.floor(b.swapTimer / period / 2) % 2 ? BINARY_TWIN_COLORS[0] : BINARY_TWIN_COLORS[1];
    if (on) {
      ctx.globalAlpha = .25 + .35 * t; ctx.strokeStyle = color; ctx.lineWidth = edge; ctx.strokeRect(edge / 2, edge / 2, w - edge, h - edge);
      ctx.globalAlpha = .05 + .05 * t; ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
    }
  }
  const flash = Math.max(0, ...b.jumps.filter(j => j.arrive).map(j => j.ticks)) / 30;
  if (flash > 0) {
    const f = flash * flash;
    ctx.globalAlpha = .28 * f; ctx.fillStyle = '#f4ecff'; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = .7 * f; ctx.fillStyle = BINARY_TWIN_COLORS[0]; ctx.fillRect(0, 0, w, edge * .6); ctx.fillRect(0, 0, edge * .6, h);
    ctx.fillStyle = BINARY_TWIN_COLORS[1]; ctx.fillRect(0, h - edge * .6, w, edge * .6); ctx.fillRect(w - edge * .6, 0, edge * .6, h);
  }
  ctx.restore();
}
