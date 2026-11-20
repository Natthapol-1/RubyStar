import { TILE_SIZE } from './constants';
import type { Enemy, GameState } from './engine';
import { RUNES, RUNE_STEP, SIRIUS, SIRIUS_BURST_TICKS, runeProgress, type Rune } from './sirius';

// Sirius challenge art: the walked trail, rune strikes, the two sanctuary aliens and their tells, and screen flashes.
export const RUNE_GOLD = '#ffe27a', WRATH_RED = '#ff6a4d', TRAIL_GOLD = '#e8c45c';
const panel = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

/** The rune as the tiles you walk: the start tile, then one tile per step. */
export function runeCells(rune: Rune): [number, number][] {
  const cells: [number, number][] = [[0, 0]];
  let x = 0, y = 0;
  for (const [dir, len] of rune.strokes) for (let k = 0; k < len; k++) { x += RUNE_STEP[dir][0]; y += RUNE_STEP[dir][1]; cells.push([x, y]); }
  return cells;
}

/** Draws a rune as clear tiles fitted into a box: dim untraced tiles, bright traced ones, an outlined start tile. */
export function drawRuneTiles(ctx: CanvasRenderingContext2D, rune: Rune, cx: number, cy: number, box: number, traced: number) {
  const cells = runeCells(rune), xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys), cols = Math.max(...xs) - minX + 1, rows = Math.max(...ys) - minY + 1;
  const size = Math.floor(box / Math.max(cols, rows)), ox = Math.round(cx - cols * size / 2), oy = Math.round(cy - rows * size / 2);
  cells.forEach(([x, y], i) => {
    const px = ox + (x - minX) * size, py = oy + (y - minY) * size, lit = i <= traced && traced > 0;
    panel(ctx, px + 1, py + 1, size - 2, size - 2, lit ? '#fff6d0' : '#5e5130');
    if (!lit) panel(ctx, px + 3, py + 3, size - 6, size - 6, '#a88d45');
    if (i === 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, size - 2, size - 2); }
  });
}

/** Your trail on the floor: a gold line through the tiles you walked; the part that already matches the rune glows. */
export function drawSiriusGround(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const t = state.sirius; if (!t) return;
  ctx.save(); ctx.shadowBlur = 0;
  const rune = t.rune && t.rune.cast <= 0 ? RUNES[t.rune.index] : null;
  const matched = rune ? runeProgress(t.steps, rune).tiles : 0, first = t.trail.length - 1 - matched;
  for (let i = 0; i < t.trail.length; i++) {
    const p = t.trail[i], age = (t.trail.length - 1 - i) / Math.max(1, SIRIUS.trailMax), lit = i >= first && matched > 0;
    const x = (p.x + .5) * TILE_SIZE - camX, y = (p.y + .5) * TILE_SIZE - camY;
    ctx.globalAlpha = lit ? .85 : .4 * (1 - age * .7);
    if (i > 0) { // a connecting bar to the previous tile
      const q = t.trail[i - 1], qx = (q.x + .5) * TILE_SIZE - camX, qy = (q.y + .5) * TILE_SIZE - camY;
      panel(ctx, Math.min(x, qx) - 3, Math.min(y, qy) - 3, Math.abs(x - qx) + 6, Math.abs(y - qy) + 6, lit ? RUNE_GOLD : TRAIL_GOLD);
      if (lit) { ctx.globalAlpha = .25 + .15 * Math.sin(tick * .2 + i); panel(ctx, Math.min(x, qx) - 8, Math.min(y, qy) - 8, Math.abs(x - qx) + 16, Math.abs(y - qy) + 16, RUNE_GOLD); }
    }
    ctx.globalAlpha = lit ? 1 : .5 * (1 - age * .7); panel(ctx, x - 4, y - 4, 8, 8, lit ? '#fff6d0' : TRAIL_GOLD);
  }
  // Penitent bites: a dark smudge where it ate a trail tile.
  for (const p of t.eaten) { ctx.globalAlpha = p.ticks / 24 * .6; panel(ctx, p.x * TILE_SIZE - camX + 14, p.y * TILE_SIZE - camY + 14, TILE_SIZE - 28, TILE_SIZE - 28, '#1a1020'); }
  // Mason walls: a gold seam outlines each raised stone; it flickers as the wall is about to sink.
  for (const w of t.walls) {
    const x = w.x * TILE_SIZE - camX, y = w.y * TILE_SIZE - camY, rise = Math.min(1, (SIRIUS.mason.wallTicks - w.ticks) / 10), end = w.ticks < 45 ? (Math.floor(tick / 6) % 2 ? .35 : 1) : 1;
    ctx.globalAlpha = .75 * rise * end; ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.globalAlpha = .25 * rise * end; panel(ctx, x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8, '#fff2c4');
    ctx.globalAlpha = .6 * end; panel(ctx, x + 6, y + TILE_SIZE - 8, (TILE_SIZE - 12) * (w.ticks / SIRIUS.mason.wallTicks), 3, RUNE_GOLD); // time left
  }
  // Zealot lanes, Bellringer rings and Mason wall marks in wind-up.
  for (const e of state.enemies) {
    const act = e.siriusAct; if (!act) continue;
    if (e.type === 'zealot' && !act.dashing) {
      const p = 1 - act.ticks / SIRIUS.zealot.windup;
      let x = e.tileX, y = e.tileY;
      while (x !== act.tx || y !== act.ty) {
        x += act.dx; y += act.dy;
        ctx.globalAlpha = .2 + .35 * p; ctx.strokeStyle = WRATH_RED; ctx.lineWidth = 2; ctx.strokeRect(x * TILE_SIZE - camX + 6, y * TILE_SIZE - camY + 6, TILE_SIZE - 12, TILE_SIZE - 12);
      }
    } else if (e.type === 'mason') {
      const p = 1 - act.ticks / SIRIUS.mason.windup;
      for (const [x, y] of act.tiles ?? []) {
        ctx.globalAlpha = .25 + .55 * p; ctx.strokeStyle = '#d8d2ec'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.strokeRect(x * TILE_SIZE - camX + 4, y * TILE_SIZE - camY + 4, TILE_SIZE - 8, TILE_SIZE - 8); ctx.setLineDash([]);
        ctx.globalAlpha = .15 * p; panel(ctx, x * TILE_SIZE - camX + 4, y * TILE_SIZE - camY + TILE_SIZE - 4 - (TILE_SIZE - 8) * p, TILE_SIZE - 8, (TILE_SIZE - 8) * p, '#9a94ad');
      }
    } else if (e.type === 'bellringer') {
      const p = 1 - act.ticks / SIRIUS.bellringer.windup, r = SIRIUS.bellringer.radius * TILE_SIZE;
      ctx.globalAlpha = .15 + .4 * p; ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
      ctx.strokeRect(e.x - camX - r, e.y - camY - r, r * 2, r * 2); ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

/** Effects over the battlefield: Bellringer pulses, rune strikes on the Prayer and the wrath aura on aliens. */
export function drawSiriusEffects(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const t = state.sirius; if (!t) return;
  ctx.save(); ctx.shadowBlur = 0;
  for (const ring of t.rings) {
    const p = 1 - ring.ticks / 30, r = ring.radius * TILE_SIZE * (.4 + .6 * p);
    ctx.globalAlpha = (1 - p) * .8; ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = 6 - p * 4;
    ctx.strokeRect(ring.x - camX - r, ring.y - camY - r, r * 2, r * 2);
  }
  // The Holy Light burst in the world: a turning starburst of rays and three shock squares rolling out from where
  // you released it, with sparks thrown outward.
  if (t.burst > 0) {
    const p = 1 - t.burst / SIRIUS_BURST_TICKS, cx = t.burstAt.x - camX, cy = t.burstAt.y - camY, out = Math.sin(Math.min(1, p * 3) * Math.PI / 2);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(p * .9);
    for (let k = 0; k < 16; k++) {
      ctx.save(); ctx.rotate(k / 16 * Math.PI * 2);
      const len = 1600 * out, wide = (k % 2 ? 10 : 26) * (1 - p * .6);
      ctx.globalAlpha = (1 - p) * (k % 2 ? .35 : .55); panel(ctx, 0, -wide / 2, len, wide, k % 4 === 0 ? '#ffffff' : RUNE_GOLD);
      ctx.restore();
    }
    ctx.restore();
    for (let k = 0; k < 3; k++) {
      const q = Math.max(0, p * 1.4 - k * .18); if (q <= 0 || q >= 1) continue;
      const r = q * 1500; ctx.globalAlpha = (1 - q) * .9; ctx.strokeStyle = k ? RUNE_GOLD : '#ffffff'; ctx.lineWidth = 26 - k * 7;
      ctx.strokeRect(cx - r, cy - r, r * 2, r * 2);
    }
    const core = Math.max(0, 1 - p * 2.5); ctx.globalAlpha = core; panel(ctx, cx - 60 * core - 20, cy - 60 * core - 20, 120 * core + 40, 120 * core + 40, '#fff6d0');
    for (let i = 0; i < 48; i++) {
      const a = i * 2.399, d = p * (300 + (i % 7) * 120), sz = i % 3 ? 4 : 7;
      ctx.globalAlpha = (1 - p) * .9; panel(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d - p * 40, sz, sz, i % 4 ? RUNE_GOLD : '#ffffff');
    }
  }
  for (const bolt of t.bolts) {
    const life = bolt.big ? (bolt.ticks > 0 ? bolt.ticks : 0) / 70 : bolt.ticks / 36, x = bolt.x - camX, y = bolt.y - camY, p = Math.min(1, life * 1.4);
    if (bolt.big) { // a wide pillar of light slams down, flares at the base and narrows as it fades
      const w = 46 * p + 8;
      ctx.globalAlpha = p * .35; panel(ctx, x - w, y - 900, w * 2, 900, RUNE_GOLD);
      ctx.globalAlpha = p; panel(ctx, x - w / 2, y - 900, w, 900, '#fff2b0'); panel(ctx, x - w / 6, y - 900, w / 3, 900, '#ffffff');
      ctx.globalAlpha = p * .6; panel(ctx, x - 70 * p, y - 22, 140 * p, 44, RUNE_GOLD); panel(ctx, x - 40 * p, y - 40 * p, 80 * p, 80 * p, '#ffffff');
      continue;
    }
    ctx.globalAlpha = life; panel(ctx, x - 10, y - 600, 20, 600, '#fff2b0'); panel(ctx, x - 4, y - 600, 8, 600, '#ffffff');
    ctx.globalAlpha = life * .5; panel(ctx, x - 36, y - 36, 72, 72, RUNE_GOLD);
  }
  if (t.wrath > 0) for (const e of state.enemies) {
    if (e.id === t.bossId || e.hp <= 0) continue;
    const x = e.x - camX, y = e.y - camY, r = 22 + Math.sin(tick * .2 + e.id) * 2;
    ctx.globalAlpha = .55; ctx.strokeStyle = WRATH_RED; ctx.lineWidth = 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = .18; panel(ctx, x - r, y - r, r * 2, r * 2, WRATH_RED);
  }
  ctx.restore();
}

/** Screen flashes: a gold burst for a traced rune, a red pulse for a missed one, a soft wash on a light swap. */
export function drawSiriusScreen(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number) {
  const t = state.sirius; if (!t) return;
  ctx.save();
  // In the dark: a light indigo tint over the view, a little deeper at the edges. It follows the light/dark blend.
  const dark = 1 - (state.trial?.siriusLightBlend ?? (t.light ? 1 : 0));
  if (dark > 0) {
    ctx.globalAlpha = dark * .14; ctx.fillStyle = '#0a0618'; ctx.fillRect(0, 0, w, h);
    const rim = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .4, w / 2, h / 2, Math.max(w, h) * .75);
    rim.addColorStop(0, '#0a061800'); rim.addColorStop(1, '#0a0618');
    ctx.globalAlpha = dark * .22; ctx.fillStyle = rim; ctx.fillRect(0, 0, w, h);
  }
  for (const f of t.flashes) {
    const p = f.ticks / (f.kind === 'swap' ? 40 : f.kind.startsWith('guess') ? 45 : 50);
    const color = f.kind === 'success' || f.kind === 'guessRight' ? RUNE_GOLD : f.kind === 'swap' ? (t.light ? '#fff6d8' : '#1a1430') : WRATH_RED;
    ctx.globalAlpha = p * (f.kind === 'swap' ? .35 : f.kind.startsWith('guess') ? .12 : .2); ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = p * .8; ctx.strokeStyle = color; ctx.lineWidth = 14; ctx.strokeRect(7, 7, w - 14, h - 14);
  }
  if (t.wrath > 0) { ctx.globalAlpha = .25 + .1 * Math.sin(state.gameTick * .1); ctx.strokeStyle = WRATH_RED; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6); }
  if (t.halo > 0) { // floating: a warm glow at the edges, light from above and motes drifting up the view
    const tick = state.gameTick, k = Math.min(1, (SIRIUS.haloTicks - t.halo) / 20, t.halo / 30);
    const lit = 1 + .7 * (state.trial?.siriusLightBlend ?? (t.light ? 1 : 0)); // stronger in light, where it competes with the rays
    const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75);
    edge.addColorStop(0, '#ffe27a00'); edge.addColorStop(1, '#ffe27a');
    ctx.globalAlpha = Math.min(1, k * lit * (.32 + .06 * Math.sin(tick * .08))); ctx.fillStyle = edge; ctx.fillRect(0, 0, w, h);
    const top = ctx.createLinearGradient(0, 0, 0, h * .45); top.addColorStop(0, '#fff6d0'); top.addColorStop(1, '#fff6d000');
    ctx.globalAlpha = k * lit * .14; ctx.fillStyle = top; ctx.fillRect(0, 0, w, h * .45);
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 211.7 + Math.sin(tick * .02 + i) * 30) % w + w) % w, sy = h - (((tick * (1.2 + (i % 4) * .4) + i * 97) % (h + 40)));
      ctx.globalAlpha = Math.min(1, k * lit * (.35 + .3 * Math.sin(tick * .1 + i))); ctx.fillStyle = i % 3 ? (lit > 1.3 ? '#fff6d0' : '#ffe27a') : '#ffffff';
      ctx.fillRect(Math.round(sx), Math.round(sy), i % 5 ? 3 : 4, i % 5 ? 6 : 8); // small upright feathers of light
    }
  }
  ctx.restore();
}

/** Zealot and Bellringer. The Zealot is an ivory-armoured lancer with a crimson plume and a long spear that points
 * where it is going; the Bellringer is a robed violet body bearing a cream bell. Returns false for other types. */
export function drawSiriusUnit(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, tick: number) {
  if (e.type !== 'zealot' && e.type !== 'bellringer' && e.type !== 'mason' && e.type !== 'penitent') return false;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.shadowBlur = 0;
  if (e.flashTicks > 0) ctx.filter = 'brightness(1.8)';
  const act = e.siriusAct;
  if (e.type === 'zealot') {
    const dx = act ? act.dx : Math.sign((e.targetTileX ?? e.tileX) - e.tileX) || 1, dy = act ? act.dy : Math.sign((e.targetTileY ?? e.tileY) - e.tileY);
    const brace = act && !act.dashing ? 1 - act.ticks / SIRIUS.zealot.windup : 0, dash = !!act?.dashing;
    if (dash) for (let k = 3; k >= 1; k--) { ctx.globalAlpha = .16 * (4 - k); panel(ctx, -11 - dx * k * 12, -13 - dy * k * 12, 22, 26, '#f2e6c8'); }
    ctx.globalAlpha = 1;
    // Body: an upright ivory cuirass with a dark visor, red sash and a tall crimson plume.
    ctx.shadowColor = '#ff6a4d'; ctx.shadowBlur = 4;
    panel(ctx, -11, -12, 22, 26, '#f2e6c8'); ctx.shadowBlur = 0;
    panel(ctx, -8, -9, 16, 7, '#2a1a24'); panel(ctx, -6, -7, 12, 3, brace > .5 || dash ? '#ffffff' : '#ff6a4d'); // visor and its burning slit
    panel(ctx, -11, 2, 22, 4, '#c8332a'); // sash
    panel(ctx, -11, 10, 7, 5, '#b9a98a'); panel(ctx, 4, 10, 7, 5, '#b9a98a'); // greaves
    panel(ctx, -3, -22, 6, 10, '#c8332a'); panel(ctx, -1, -26, 6, 5, '#ff6a4d'); // plume
    // The spear turns as one solid shape toward its line; it draws back while bracing.
    ctx.save(); ctx.rotate(Math.atan2(dy, dx)); ctx.translate(-brace * 8, 0);
    panel(ctx, 4, -2, 26, 4, '#8a6a3a'); panel(ctx, 28, -4, 8, 8, '#ffd36b'); panel(ctx, 34, -2, 4, 4, '#ffffff');
    ctx.restore();
  } else if (e.type === 'penitent') {
    // A hunched ash-grey penitent in a black cowl with a pale bone mask and red-violet eyes, dragging a chain; it
    // stoops low, sniffing out your trail.
    const sway = Math.sin(tick * .15 + e.id) * 2;
    ctx.translate(sway, 0);
    ctx.shadowColor = '#b04a8a'; ctx.shadowBlur = 4; panel(ctx, -12, -14, 24, 30, '#5a5262'); ctx.shadowBlur = 0;
    panel(ctx, -14, -18, 28, 12, '#1a1420'); panel(ctx, -9, -12, 18, 12, '#d8cfc0'); // cowl and mask
    panel(ctx, -6, -8, 4, 3, '#ff5fa8'); panel(ctx, 2, -8, 4, 3, '#ff5fa8'); panel(ctx, -3, -3, 6, 2, '#8a8070');
    panel(ctx, -12, 4, 24, 3, '#3a3242'); panel(ctx, -12, 14, 8, 3, '#3a3242'); panel(ctx, 4, 14, 8, 3, '#3a3242');
    for (let k = 0; k < 4; k++) panel(ctx, 12 + k * 4 - sway, 8 + (k % 2) * 2, 3, 3, '#8a8494'); // the dragging chain
  } else if (e.type === 'mason') {
    // A squat stone builder: a slate block with gold eyes and stone fists; it hoists a gold-edged tablet overhead
    // while it raises a wall, and slams it down when the wall rises.
    const lift = act ? 1 - act.ticks / SIRIUS.mason.windup : 0, slam = e.shootTicks > 0;
    ctx.shadowColor = '#9a94ad'; ctx.shadowBlur = 4; panel(ctx, -17, -10, 34, 26, '#9a94ad'); ctx.shadowBlur = 0;
    panel(ctx, -14, -7, 28, 20, '#3c3848'); panel(ctx, -14, -7, 28, 4, '#6e6880');
    panel(ctx, -8, -1, 5, 4, '#ffe27a'); panel(ctx, 3, -1, 5, 4, '#ffe27a');
    panel(ctx, -21, 4 - lift * 14, 7, 8, '#7a7490'); panel(ctx, 14, 4 - lift * 14, 7, 8, '#7a7490'); // fists
    const ty = slam ? -14 : -18 - lift * 12;
    panel(ctx, -12, ty, 24, 8, '#b8b2c8'); panel(ctx, -12, ty, 24, 2, '#ffe27a'); panel(ctx, -2, ty + 3, 4, 3, '#ffe27a'); // tablet
    panel(ctx, -15, 16, 9, 4, '#6e6880'); panel(ctx, 6, 16, 9, 4, '#6e6880');
  } else {
    // A robed bell-bearer: a cream bell on a violet body; it lifts the bell before each ring.
    const lift = act ? 1 - act.ticks / SIRIUS.bellringer.windup : 0, ring = e.shootTicks > 0 ? Math.sin(tick * .8) * 3 : 0, bob = Math.round(Math.sin(tick * .05 + e.id));
    ctx.translate(0, bob);
    ctx.shadowColor = '#e9c98a'; ctx.shadowBlur = 4; panel(ctx, -15, -6, 30, 22, '#e9c98a'); ctx.shadowBlur = 0;
    panel(ctx, -12, -3, 24, 16, '#2e2442');
    panel(ctx, -8, 1, 4, 3, '#fff2c4'); panel(ctx, 4, 1, 4, 3, '#fff2c4');
    ctx.save(); ctx.translate(ring, -14 - lift * 8);
    panel(ctx, -9, -8, 18, 14, '#f6e3a8'); panel(ctx, -11, 4, 22, 4, '#c9a44a'); panel(ctx, -2, 7, 4, 4, '#fff6d8'); panel(ctx, -2, -12, 4, 4, '#c9a44a');
    ctx.restore();
    panel(ctx, -16, 14, 8, 4, '#a98a4a'); panel(ctx, 8, 14, 8, 4, '#a98a4a');
  }
  ctx.restore();
  return true;
}

/** How high your model floats under Halo: it rises over a quarter second, bobs, and settles as the halo fades. */
export function siriusFloatLift(state: Readonly<GameState>, tick: number) {
  const t = state.sirius; if (!t || t.halo <= 0) return 0;
  const rise = Math.min(1, (SIRIUS.haloTicks - t.halo) / 15), settle = Math.min(1, t.halo / 20), ease = (v: number) => v * v * (3 - 2 * v);
  return Math.round((16 + Math.sin(tick * .12) * 3) * ease(rise) * ease(settle));
}

/** Halo: your shadow stays on the floor and shrinks as you rise; a gold halo over a small crown hovers above you, with motes. */
export function drawSiriusHalo(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, x: number, y: number, lift: number, tick: number) {
  const t = state.sirius; if (!t || t.halo <= 0) return;
  const fade = Math.min(1, t.halo / 30), w = 30 - lift * .5;
  ctx.save(); ctx.shadowBlur = 0;
  ctx.globalAlpha = .4 * fade; panel(ctx, x - w / 2, y + 16, w, 6, '#000000');
  ctx.globalAlpha = .9 * fade; ctx.shadowColor = RUNE_GOLD; ctx.shadowBlur = 8;
  y -= lift; const hy = y - 34;
  panel(ctx, x - 14, hy, 28, 3, RUNE_GOLD); panel(ctx, x - 14, hy + 6, 28, 3, RUNE_GOLD); panel(ctx, x - 17, hy + 3, 3, 3, RUNE_GOLD); panel(ctx, x + 14, hy + 3, 3, 3, RUNE_GOLD);
  ctx.shadowBlur = 0;
  panel(ctx, x - 8, hy + 12, 16, 4, '#fff2c4'); for (const k of [-8, -2, 4]) panel(ctx, x + k, hy + 9, 4, 3, '#fff2c4');
  for (let i = 0; i < 4; i++) { const p = ((tick * .03 + i / 4) % 1); ctx.globalAlpha = (1 - p) * .7 * fade; panel(ctx, x - 18 + i * 11, y + 14 - p * 40, 3, 3, '#fff6d0'); }
  ctx.restore();
}

/** The Holy Light burst: a gold wash and expanding frame across the whole view. */
export function drawSiriusBurst(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number) {
  const t = state.sirius; if (!t || t.burst <= 0) return;
  const p = 1 - t.burst / SIRIUS_BURST_TICKS;
  ctx.save();
  // A white flash, then a gold wash that lingers, and a thick golden frame that pulses as it fades.
  if (p < .12) { ctx.globalAlpha = (1 - p / .12) * .85; ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h); }
  ctx.globalAlpha = Math.max(0, 1 - p) * .35; ctx.fillStyle = '#fff2b0'; ctx.fillRect(0, 0, w, h);
  const frame = 22 + 10 * Math.sin(p * Math.PI * 6);
  ctx.globalAlpha = (1 - p) * .9; ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = frame; ctx.strokeRect(frame / 2, frame / 2, w - frame, h - frame);
  ctx.globalAlpha = (1 - p) * .6; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(frame + 6, frame + 6, w - frame * 2 - 12, h - frame * 2 - 12);
  ctx.restore();
}
