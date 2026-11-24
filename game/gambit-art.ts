import { TILE_SIZE } from './constants';
import { GAMBIT, GLINT, WEAPONS, markTarget, novaRadius } from './gambit';
import type { GameState } from './engine';
import { bindings, keyLabel } from './controls';

/** The first key or button bound to the Primal Skill control, which fires the run's weapon. */
export function weaponKeyLabel() { const code = bindings().mapSkill[0]; return code ? keyLabel(code) : 'UNBOUND'; }

// Star Gambit weapon visuals in the player-attack style: three-layer bands (a wide glowing base, a light middle, a white
// core), square rims with inner accent squares, pixel rays and compass-star flashes. Glow stays at 6 or less. Drawing
// never changes state.
const T = TILE_SIZE;
function block(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 1) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
}
/** A beam or bolt as three stacked strokes along a polyline; the base glows. */
function band(ctx: CanvasRenderingContext2D, pts: [number, number][], fade: number, colors: readonly [string, string, string], widths: readonly [number, number, number]) {
  ctx.save(); ctx.lineCap = 'square'; ctx.lineJoin = 'miter'; ctx.shadowColor = colors[0];
  ([[widths[0], colors[0], .4, 6], [widths[1], colors[1], .85, 3], [widths[2], colors[2], 1, 0]] as const).forEach(([w, c, a, g]) => {
    ctx.globalAlpha = fade * a; ctx.shadowBlur = g; ctx.strokeStyle = c; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.stroke();
  });
  ctx.restore();
}
/** A square ring like the charge wave: a thick glowing base rim, a light inner rim, an accent square and a faint fill. */
function rim(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fade: number, base: string, light: string, accent: string, thick = 12) {
  const R = (v: number) => Math.round(v);
  ctx.save(); ctx.shadowColor = base; ctx.shadowBlur = 6;
  ctx.globalAlpha = fade * .8; ctx.strokeStyle = base; ctx.lineWidth = thick; ctx.strokeRect(R(x - r), R(y - r), R(r * 2), R(r * 2));
  ctx.globalAlpha = fade; ctx.strokeStyle = light; ctx.lineWidth = Math.max(2, thick / 3); ctx.strokeRect(R(x - r), R(y - r), R(r * 2), R(r * 2));
  const a = r * .7; ctx.globalAlpha = fade * .6; ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.strokeRect(R(x - a), R(y - a), R(a * 2), R(a * 2));
  ctx.shadowBlur = 0; ctx.globalAlpha = fade * .1; ctx.fillStyle = base; ctx.fillRect(R(x - r), R(y - r), R(r * 2), R(r * 2));
  ctx.restore();
}
/** The game's four-point pixel star. */
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, alpha: number) {
  const u = Math.max(2, Math.round(size / 12)); cx = Math.round(cx); cy = Math.round(cy);
  ctx.save(); ctx.globalAlpha = alpha; ctx.shadowColor = color; ctx.shadowBlur = 6; ctx.fillStyle = color;
  ctx.fillRect(cx - u, cy - u * 5, u * 2, u * 10); ctx.fillRect(cx - u * 5, cy - u, u * 10, u * 2); ctx.fillRect(cx - u * 2, cy - u * 2, u * 4, u * 4);
  ctx.restore();
}
/** A short pixel ray: three blocks stepping outward. */
function ray(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, color: string, alpha: number, size = 6) {
  for (let k = 0; k < 3; k++) block(ctx, x + dx * k * (size + 2), y + dy * k * (size + 2), size - k * 2, color, alpha * (1 - k * .25));
}
const EIGHT = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]] as const;

/** Every weapon effect in the world, drawn above units. */
export function drawGambitEffects(ctx: CanvasRenderingContext2D, s: GameState, camX: number, camY: number) {
  const g = s.gambit; if (!g) return;
  const tick = s.gameTick, R = (v: number) => Math.round(v);
  ctx.save();
  // Orbital Strike: gold corner brackets close on the 3×3 area while a star falls toward it; on impact a white-cored
  // column, a bomb-style square blast with an accent ring, eight pixel rays and a fading star.
  for (const st of g.strikes) {
    const x = (st.x + .5) * T - camX, y = (st.y + .5) * T - camY, half = (GAMBIT.orbital.radius + .5) * T, c = WEAPONS.orbital.color;
    if (st.ticks > 0) {
      const p = 1 - st.ticks / GAMBIT.orbital.delay, warn = st.ticks < 12 && Math.floor(tick / 3) % 2;
      ctx.globalAlpha = .08 + .14 * p; ctx.fillStyle = c; ctx.fillRect(R(x - half), R(y - half), R(half * 2), R(half * 2));
      const r = half * (1.5 - .5 * p);
      ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.globalAlpha = .95; ctx.fillStyle = warn ? '#ffffff' : c;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const cx = x + sx * r, cy = y + sy * r; ctx.fillRect(R(cx - (sx > 0 ? 14 : 0)), R(cy - 2), 14, 4); ctx.fillRect(R(cx - 2), R(cy - (sy > 0 ? 14 : 0)), 4, 14); }
      ctx.restore();
      const fy = y - (1 - p) * 260, a = Math.min(1, p * 2);
      band(ctx, [[x, fy - 70 * (1 - p) - 10], [x, fy]], a, [c, '#ffe0a0', '#ffffff'], [18, 8, 3]); star(ctx, x, fy, 34, '#fff3d4', a);
    } else {
      const f = st.blast / 24, p = 1 - f, out = half + p * 46;
      band(ctx, [[x, y - 420], [x, y]], f, [c, '#ffe0a0', '#ffffff'], [44 * f + 8, 18 * f + 4, 6 * f + 2]);
      if (p < .25) { ctx.globalAlpha = (1 - p * 4) * .7; ctx.fillStyle = '#fff3d4'; ctx.fillRect(R(x - half), R(y - half), R(half * 2), R(half * 2)); }
      rim(ctx, x, y, out, f, c, '#fff3d4', '#ff7a3a', 14);
      for (const [dx, dy] of EIGHT) ray(ctx, x + dx * out, y + dy * out, dx, dy, '#ffe0a0', f, 12);
      star(ctx, x, y, 40 + p * 30, '#fff3d4', f * f);
    }
  }
  // Gravity Well: a short warning of closing violet brackets, then violet rims closing in on a dark core again and
  // again, pixel rays drawn inward and a turning star.
  for (const w of g.wells) {
    const x = (w.x + .5) * T - camX, y = (w.y + .5) * T - camY, r = (GAMBIT.well.radius + .5) * T, c = WEAPONS.well.color;
    if (w.delay > 0) {
      const p = 1 - w.delay / GAMBIT.well.delay, rr = r * (1.4 - .4 * p);
      ctx.globalAlpha = .06 + .1 * p; ctx.fillStyle = c; ctx.fillRect(R(x - r), R(y - r), R(r * 2), R(r * 2));
      ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.globalAlpha = .9; ctx.fillStyle = c;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const cx = x + sx * rr, cy = y + sy * rr; ctx.fillRect(R(cx - (sx > 0 ? 14 : 0)), R(cy - 2), 14, 4); ctx.fillRect(R(cx - 2), R(cy - (sy > 0 ? 14 : 0)), 4, 14); }
      ctx.restore(); continue;
    }
    const fade = Math.min(1, w.ticks / 20);
    ctx.save(); ctx.setLineDash([12, 8]); ctx.lineDashOffset = -tick; ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.globalAlpha = .7 * fade; ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.strokeRect(R(x - r), R(y - r), R(r * 2), R(r * 2)); ctx.restore();
    ctx.globalAlpha = .08 * fade; ctx.fillStyle = c; ctx.fillRect(R(x - r), R(y - r), R(r * 2), R(r * 2));
    for (let k = 0; k < 3; k++) {
      const p = (tick / 40 + k / 3) % 1, rr = r * (1 - p);
      ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.globalAlpha = fade * Math.sin(p * Math.PI) * .7; ctx.strokeStyle = k % 2 ? '#e8d8ff' : c; ctx.lineWidth = 3; ctx.strokeRect(R(x - rr), R(y - rr), R(rr * 2), R(rr * 2)); ctx.restore();
    }
    for (const [dx, dy] of EIGHT) { const p = (tick * .025 + (dx + 2) * .13 + (dy + 2) * .07) % 1, d = r * (1 - p) * (dx && dy ? .9 : 1); ray(ctx, x + dx * d, y + dy * d, -dx, -dy, '#e8d8ff', fade * Math.sin(p * Math.PI) * .9, 10); }
    block(ctx, x, y, 22, '#140a24', fade);
    ctx.save(); ctx.globalAlpha = fade; ctx.strokeStyle = '#e8d8ff'; ctx.lineWidth = 2; ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.strokeRect(R(x - 11), R(y - 11), 22, 22); ctx.restore();
    ctx.save(); ctx.translate(R(x), R(y)); ctx.rotate(Math.floor(tick / 6) * Math.PI / 8); star(ctx, 0, 0, 20, '#e8d8ff', fade * .9); ctx.restore();
  }
  // Ruby Sling: a rose tether from you to Ruby while held; Ruby flies as a turning gem with a three-band streak; it lands
  // in a rose square blast with rays and star sparks (the stunned enemies show the usual stun).
  if (g.sling && s.rubyTileX !== -1 && !s.playerCarryingRuby) {
    const rx = (s.rubyTileX + .5) * T - camX, ry = (s.rubyTileY + .5) * T - camY, f = .6 + .3 * Math.sin(tick * .3);
    band(ctx, [[s.playerX - camX, s.playerY - camY], [rx, ry]], f, [WEAPONS.sling.color, '#ffd0dc', '#ffffff'], [10, 5, 2]);
    rim(ctx, rx, ry, T * .55, .8, WEAPONS.sling.color, '#ffffff', '#ffd0dc', 4);
  }
  if (g.slingFlight) {
    const f = g.slingFlight, p = 1 - f.ticks / GAMBIT.sling.flight, ax = (f.fromX + .5) * T - camX, ay = (f.fromY + .5) * T - camY;
    const bx = (f.toX + .5) * T - camX, by = (f.toY + .5) * T - camY, x = ax + (bx - ax) * p, y = ay + (by - ay) * p - Math.sin(p * Math.PI) * T * .6;
    band(ctx, [[ax + (bx - ax) * Math.max(0, p - .35), ay + (by - ay) * Math.max(0, p - .35)], [x, y]], .8, [WEAPONS.sling.color, '#ffd0dc', '#ffffff'], [22, 9, 3]);
    ctx.save(); ctx.translate(R(x), R(y)); ctx.rotate(Math.PI / 4 + p * Math.PI * 2); ctx.shadowColor = '#ff2f6f'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#ff1155'; ctx.fillRect(-13, -13, 26, 26); ctx.shadowBlur = 0; ctx.fillStyle = '#a8183f'; ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = '#ff6a8f'; ctx.fillRect(-8, -8, 16, 6); ctx.fillStyle = '#ffd0dc'; ctx.fillRect(-8, -8, 5, 5); ctx.restore();
  }
  // Ruby Leap: in the air, a pale arc trails behind you and closing brackets mark where you will land; then a landing
  // blast that pushes outward.
  if (g.leapFlight) {
    const f = g.leapFlight, p = 1 - f.ticks / f.total, pts: [number, number][] = [];
    for (let k = 0; k <= 8; k++) { const q = p * k / 8; pts.push([f.fromX + (f.toX - f.fromX) * q - camX, f.fromY + (f.toY - f.fromY) * q - camY - Math.sin(q * Math.PI) * T * 1.2]); }
    band(ctx, pts, .8, [WEAPONS.leap.color, '#ffe4ec', '#ffffff'], [18, 7, 3]);
    const lx = f.toX - camX, ly = f.toY - camY, r = (GAMBIT.leap.radius + .5) * T * (1.3 - .3 * p);
    ctx.globalAlpha = .06 + .12 * p; ctx.fillStyle = WEAPONS.leap.color; ctx.fillRect(R(lx - r), R(ly - r), R(r * 2), R(r * 2));
    ctx.save(); ctx.shadowColor = WEAPONS.leap.color; ctx.shadowBlur = 6; ctx.globalAlpha = .9; ctx.fillStyle = f.ticks < 10 && Math.floor(tick / 3) % 2 ? '#ffffff' : WEAPONS.leap.color;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const cx = lx + sx * r, cy = ly + sy * r; ctx.fillRect(R(cx - (sx > 0 ? 14 : 0)), R(cy - 2), 14, 4); ctx.fillRect(R(cx - 2), R(cy - (sy > 0 ? 14 : 0)), 4, 14); }
    ctx.restore();
  }
  // Glint chips: small gold crystals on their point (bigger for richer chips) with a pale facet and a white glint,
  // bobbing gently; they blink in their last seconds and stretch into a short streak while flying to you.
  for (const d of g.drops) {
    if (!d.speed && d.ticks < GLINT.blink && Math.floor(tick / 5) % 2) continue;
    const size = 8 + Math.min(6, d.value / 70), x = d.x - camX, y = d.y - camY - (d.speed ? 0 : Math.round(Math.sin((tick + d.x) * .08) * 2));
    if (d.speed) { const dx = s.playerX - d.x, dy = s.playerY - d.y, l = Math.hypot(dx, dy) || 1; band(ctx, [[x - dx / l * 18, y - dy / l * 18], [x, y]], .7, ['#ffd23f', '#fff2b0', '#ffffff'], [10, 5, 2]); }
    ctx.save(); ctx.translate(R(x), R(y)); ctx.rotate(Math.PI / 4); ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 5;
    ctx.fillStyle = '#c9901a'; ctx.fillRect(-size / 2, -size / 2, size, size); ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(-size / 2 + 2, -size / 2 + 2, size - 4, size - 4);
    ctx.fillStyle = '#fff2b0'; ctx.fillRect(-size / 2 + 2, -size / 2 + 2, size / 2, size / 2 - 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-size / 2 + 2, -size / 2 + 2, 2, 2); ctx.restore();
  }
  // Siphon Nova: while charging, a mint square field grows around you with inward rays and a pulsing edge; the release
  // is a mint square burst rolling out to the field's edge, with plus-shaped heal sparks rising off you.
  if (g.weapon === 'nova' && g.charge > 0) {
    const p = g.charge / GAMBIT.nova.charge, r = (novaRadius(p) + .5) * T, x = s.playerX - camX, y = s.playerY - camY, c = WEAPONS.nova.color;
    ctx.globalAlpha = .07 + .08 * p; ctx.fillStyle = c; ctx.fillRect(R(x - r), R(y - r), R(r * 2), R(r * 2));
    ctx.save(); ctx.setLineDash([10, 8]); ctx.lineDashOffset = tick; ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.globalAlpha = .6 + .3 * Math.sin(tick * .3); ctx.strokeStyle = p >= 1 && Math.floor(tick / 4) % 2 ? '#ffffff' : c; ctx.lineWidth = 3; ctx.strokeRect(R(x - r), R(y - r), R(r * 2), R(r * 2)); ctx.restore();
    for (const [dx, dy] of EIGHT) ray(ctx, x + dx * (r - 6), y + dy * (r - 6), -dx, -dy, '#dcfff0', .5 + .4 * p, 6);
  }
  for (const n of g.novas) {
    const f = n.ticks / 26, q = 1 - f, x = n.x - camX, y = n.y - camY, r = (n.radius + .5) * T * (.35 + .65 * Math.min(1, q * 2)), c = WEAPONS.nova.color;
    if (q < .2) { ctx.globalAlpha = (1 - q * 5) * .35; ctx.fillStyle = '#dcfff0'; ctx.fillRect(R(x - r), R(y - r), R(r * 2), R(r * 2)); }
    rim(ctx, x, y, r, f, c, '#ffffff', '#dcfff0', 12);
    if (n.hits) for (let k = 0; k < 4; k++) { const hx = x + (k - 1.5) * 14, hy = y - 30 - q * 40 - (k % 2) * 10; ctx.globalAlpha = f; ctx.fillStyle = c; ctx.fillRect(R(hx - 2), R(hy - 7), 4, 14); ctx.fillRect(R(hx - 7), R(hy - 2), 14, 4); }
    ctx.globalAlpha = 1;
  }
  // Star Cannon: a big pale-blue orb three tiles across (a square rim around a dark ring and a bright core) with a
  // three-band trail.
  for (const o of g.orbs) {
    const x = o.x - camX, y = o.y - camY, l = Math.hypot(o.dx, o.dy) || 1, c = WEAPONS.cannon.color;
    const h = GAMBIT.cannon.radius * T;
    band(ctx, [[x - o.dx / l * h * 2.2, y - o.dy / l * h * 2.2], [x, y]], .8, [c, '#d8f6ff', '#ffffff'], [h * 1.8, h * .8, 8]);
    ctx.save(); ctx.translate(R(x), R(y)); ctx.shadowColor = c; ctx.shadowBlur = 6;
    ctx.fillStyle = c; ctx.fillRect(R(-h), R(-h), R(h * 2), R(h * 2)); ctx.shadowBlur = 0;
    ctx.fillStyle = '#123a5a'; ctx.fillRect(R(-h + 10), R(-h + 10), R(h * 2 - 20), R(h * 2 - 20));
    ctx.fillStyle = '#d8f6ff'; ctx.fillRect(R(-h * .55), R(-h * .55), R(h * 1.1), R(h * 1.1));
    ctx.rotate(Math.floor(tick / 5) * Math.PI / 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(R(-h * .28), R(-h * .28), R(h * .56), R(h * .56)); ctx.restore();
  }
  for (const b of g.blasts) {
    if (b.kind === 'cannon') {
      const f = b.ticks / 18, x = (b.x + .5) * T - camX, y = (b.y + .5) * T - camY, out = T * (GAMBIT.cannon.radius + (1 - f) * .9);
      rim(ctx, x, y, out, f, WEAPONS.cannon.color, '#ffffff', '#d8f6ff', 10);
      for (const [dx, dy] of EIGHT) ray(ctx, x + dx * out, y + dy * out, dx, dy, '#d8f6ff', f, 8);
      continue;
    }
    const f = b.ticks / 24, p = 1 - f, x = (b.x + .5) * T - camX, y = (b.y + .5) * T - camY;
    const leap = b.kind === 'leap', c = leap ? WEAPONS.leap.color : WEAPONS.sling.color, half = ((leap ? GAMBIT.leap.radius : GAMBIT.sling.radius) + .5) * T, out = half * (.55 + p * .55);
    if (p < .25) { ctx.globalAlpha = (1 - p * 4) * .5; ctx.fillStyle = '#ffe4ec'; ctx.fillRect(R(x - half), R(y - half), R(half * 2), R(half * 2)); }
    rim(ctx, x, y, out, f, c, '#ffffff', leap ? '#ffd0dc' : '#ff2f6f', 12);
    for (const [dx, dy] of EIGHT) ray(ctx, x + dx * out, y + dy * out, dx, dy, '#ffe4ec', f, 10);
    star(ctx, x, y, 30 + p * 24, '#ffffff', f * f);
  }
  // Storm Mark: yellow corner brackets and a small bolt over the marked enemy; while aiming, faint brackets on the enemy
  // the mark would take.
  const markRing = (e: { x: number; y: number }, a: number, size: number) => {
    const x = e.x - camX, y = e.y - camY, r = T * size, c = WEAPONS.mark.color;
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 6; ctx.globalAlpha = a; ctx.fillStyle = c;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const cx = x + sx * r, cy = y + sy * r; ctx.fillRect(R(cx - (sx > 0 ? 12 : 0)), R(cy - 2), 12, 4); ctx.fillRect(R(cx - 2), R(cy - (sy > 0 ? 12 : 0)), 4, 12); }
    ctx.restore();
  };
  if (g.mark) { const e = s.enemies.find(o => o.id === g.mark!.id); if (e) { markRing(e, g.mark.ticks < 60 && Math.floor(tick / 6) % 2 ? .4 : .95, .7 + .05 * Math.sin(tick * .2)); block(ctx, e.x - camX, e.y - camY - T * .95, 8, '#ffffff', .9); block(ctx, e.x - camX + 4, e.y - camY - T * .95 + 6, 6, WEAPONS.mark.color, .9); } }
  else if (g.weapon === 'mark' && g.cd <= 0) { const e = markTarget(s); if (e) markRing(e, .35, .8); }
  // Arc Blade: a faceted crescent in three bands sweeping in front of you, with white sparks at both tips.
  for (const a of g.arcs) {
    const f = a.ticks / 14, base = Math.atan2(a.dy, a.dx), sweep = (1 - f) * .5, d = T * (1.15 + (1 - f) * .35), c = WEAPONS.blade.color;
    const pts = Array.from({ length: 7 }, (_, k) => { const ang = base - .95 + sweep + k * (1.9 / 6); return [a.x - camX + Math.cos(ang) * d, a.y - camY + Math.sin(ang) * d] as [number, number]; });
    band(ctx, pts, f, [c, '#ffd0dc', '#ffffff'], [28, 12, 4]);
    for (const p of [pts[0], pts[6]]) { block(ctx, p[0], p[1], 10, '#ffffff', f); star(ctx, p[0], p[1], 18, '#ffd0dc', f * .8); }
  }
  // Comet Dash: while charging, a cyan square closes in around you with rays drawn inward, blinking white when full; the
  // dash leaves a three-band streak from where it started, with trailing blocks.
  if (g.weapon === 'dash' && g.charge > 0) {
    const p = g.charge / GAMBIT.dash.charge, x = s.playerX - camX, y = s.playerY - camY, r = T * (1.1 - .45 * p);
    ctx.save(); ctx.shadowColor = WEAPONS.dash.color; ctx.shadowBlur = 6; ctx.globalAlpha = .25 + .65 * p; ctx.strokeStyle = p >= 1 && Math.floor(tick / 4) % 2 ? '#ffffff' : WEAPONS.dash.color; ctx.lineWidth = 2 + Math.round(p * 3);
    ctx.strokeRect(R(x - r), R(y - r), R(r * 2), R(r * 2)); ctx.restore();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ray(ctx, x + dx * (r + 10), y + dy * (r + 10), -dx, -dy, '#e4ffff', p * .8, 5);
  }
  if (g.dash) {
    const f = Math.min(1, g.dash.ticks / 20), c = WEAPONS.dash.color;
    band(ctx, [[g.dash.fromX - camX, g.dash.fromY - camY], [s.playerX - camX, s.playerY - camY]], f, [c, '#d8f6ff', '#ffffff'], [34, 14, 4]);
    for (let k = 1; k <= 4; k++) block(ctx, s.playerX - camX - (s.playerKnockback?.dirX ?? 0) * k * 14, s.playerY - camY - (s.playerKnockback?.dirY ?? 0) * k * 14, 20 - k * 3, k % 2 ? '#ffffff' : c, f * (.8 - k * .15));
  }
  // A small four-block cursor marker for weapons aimed at the cursor.
  if (g.weapon === 'orbital' || g.weapon === 'well') { // Orbital Strike and Gravity Well aim at the cursor; the rest follow your facing, movement or Ruby
    const x = g.cursorX - camX, y = g.cursorY - camY; ctx.globalAlpha = .8; ctx.fillStyle = '#ffffff';
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillRect(R(x + dx * 8 - 2), R(y + dy * 8 - 2), 4, 4);
  }
  ctx.restore();
}

/**
 * Star Gambit backdrop: the same blocky, parallax construction as the Endless sky, but a warm dusk over a trading
 * port. A plum-to-amber gradient, two soft stepped nebula clouds in rose and amber, a distant station skyline of
 * stacked towers with lit windows and blinking beacons, slow cargo freighters with running lights crossing, drifting
 * crates, and sparse warm stars. Motion follows the tick; nothing jumps.
 */
export function drawGambitBackdrop(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, camX: number, camY: number, tick: number) {
  const hash = (i: number, k: number) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n); };
  const wrap = (v: number, span: number) => ((v % span) + span) % span;
  ctx.save(); ctx.shadowBlur = 0;
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, '#1a0d24'); sky.addColorStop(.55, '#120a1c'); sky.addColorStop(1, '#2a1410');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, viewW, viewH);
  // Warm stars, sparse, in two depths.
  for (let i = 0; i < 120; i++) {
    const par = i % 3 ? .04 : .09, x = wrap(hash(i, 2) * viewW * 1.4 - camX * par, viewW), y = wrap(hash(i, 3) * viewH * 1.4 - camY * par, viewH);
    ctx.globalAlpha = (i % 3 ? .18 : .35) * (i % 7 === 0 ? .6 + .4 * Math.sin(tick * .05 + i) : 1); ctx.fillStyle = i % 4 === 0 ? '#ffd9a8' : '#f2e6ff';
    ctx.fillRect(Math.round(x), Math.round(y), i % 3 ? 1 : 2, i % 3 ? 1 : 2);
  }
  // Two nebula clouds of stepped blocks, rose and amber, fading at their edges.
  ([['#ff6f9f', .28, .32], ['#ffb84d', .7, .7]] as const).forEach(([color, fx, fy], n) => {
    const span = viewW + 1400, cx = wrap(fx * span - camX * .03 + tick * .005, span) - 700, cy = fy * viewH - camY * .03;
    ctx.fillStyle = color;
    for (let ring = 3; ring >= 0; ring--) for (let b = 0; b < 6; b++) {
      const k = n * 40 + ring * 7 + b, spread = 70 + ring * 70, w = (90 + hash(k, 1) * 140) * (1 + ring * .35), h = (30 + hash(k, 2) * 60) * (1 + ring * .3);
      ctx.globalAlpha = .01 + (3 - ring) * .007;
      ctx.fillRect(Math.round(cx + (hash(k, 3) - .5) * spread * 2 - w / 2), Math.round(cy + (hash(k, 4) - .5) * spread - h / 2), Math.round(w), Math.round(h));
    }
  });
  // Sky detail, far to near: a stepped setting sun low on the horizon cut by dark bands, a small ringed planet and a
  // moon high up, long drifting cloud streaks, and a dotted traffic lane where tiny ship lights travel.
  { const sx = wrap(viewW * .62 - camX * .008, viewW + 400) - 200, sy = viewH * .56 - camY * .008, r = 84;
    for (let step = 0; step < 4; step++) { // soft stepped halo
      ctx.globalAlpha = .05; ctx.fillStyle = '#ff9a4d'; const g = r + 26 + step * 22; ctx.fillRect(Math.round(sx - g), Math.round(sy - g * .7), g * 2, Math.round(g * 1.4));
    }
    for (let row = -r; row < r; row += 6) { // the disc as 6px rows, warmer toward the bottom, with dark bands across its lower half
      const half = Math.round(Math.sqrt(Math.max(0, r * r - (row + 3) * (row + 3))) / 6) * 6, t = (row + r) / (r * 2);
      if (t > .55 && Math.floor((row + r) / 6) % 3 === 0) continue;
      ctx.globalAlpha = .55; ctx.fillStyle = t < .35 ? '#ffd27a' : t < .7 ? '#ffaa55' : '#ff7a6a'; ctx.fillRect(Math.round(sx - half), Math.round(sy + row), half * 2, 6);
    } }
  { ctx.save(); ctx.translate(Math.round(wrap(viewW * .2 - camX * .015, viewW + 300) - 150), Math.round(viewH * .2 - camY * .015)); ctx.scale(2, 2); const px = 0, py = 0; // ringed planet, drawn at 2× in whole pixels
    ctx.globalAlpha = .5; ctx.fillStyle = '#8a5a9e'; ctx.fillRect(Math.round(px - 54), Math.round(py - 2), 108, 4); // ring, back
    ctx.globalAlpha = .9; ctx.fillStyle = '#6b3f7e'; ctx.fillRect(Math.round(px - 22), Math.round(py - 22), 44, 44);
    ctx.fillStyle = '#8e5aa3'; ctx.fillRect(Math.round(px - 22), Math.round(py - 22), 44, 10); ctx.fillStyle = '#4c2a5c'; ctx.fillRect(Math.round(px - 22), Math.round(py + 10), 44, 12);
    ctx.fillStyle = '#c99be0'; ctx.fillRect(Math.round(px - 16), Math.round(py - 18), 8, 4);
    ctx.fillStyle = '#d6a6ff'; ctx.globalAlpha = .7; ctx.fillRect(Math.round(px - 54), Math.round(py + 2), 108, 4); // ring, front
    const mx = px + 120, my = py + 46; // a small moon
    ctx.globalAlpha = .8; ctx.fillStyle = '#c9b8d6'; ctx.fillRect(Math.round(mx - 8), Math.round(my - 8), 16, 16); ctx.fillStyle = '#8e7da0'; ctx.fillRect(Math.round(mx), Math.round(my - 8), 8, 16); ctx.restore(); }
  for (let c = 0; c < 9; c++) { // cloud streaks
    const span = viewW + 700, x = wrap(hash(c, 40) * span + tick * (.04 + hash(c, 41) * .05) - camX * .02, span) - 350, y = viewH * (.3 + hash(c, 42) * .38) - camY * .02;
    const len = 160 + hash(c, 43) * 260; ctx.fillStyle = c % 3 ? '#ff8fb1' : '#ffb070';
    ctx.globalAlpha = .06; ctx.fillRect(Math.round(x), Math.round(y), Math.round(len), 6); ctx.globalAlpha = .045; ctx.fillRect(Math.round(x + len * .2), Math.round(y - 6), Math.round(len * .5), 6);
  }
  { const ly = viewH * .42 - camY * .03, span = viewW + 200; // traffic lane
    ctx.globalAlpha = .12; ctx.fillStyle = '#ffd27a'; for (let x = -wrap(camX * .03, 24); x < viewW; x += 24) ctx.fillRect(Math.round(x), Math.round(ly), 10, 2);
    for (let k = 0; k < 4; k++) { const x = wrap(hash(k, 50) * span + tick * (.5 + k * .15) * (k % 2 ? -1 : 1) - camX * .03, span) - 100; ctx.globalAlpha = .9; ctx.fillStyle = k % 2 ? '#ff8fb1' : '#fff1c4'; ctx.fillRect(Math.round(x), Math.round(ly - 1), 4, 4); ctx.globalAlpha = .3; ctx.fillRect(Math.round(x + (k % 2 ? 4 : -14)), Math.round(ly), 14, 2); } }
  // The trading-port skyline in three depths: a tall hazy far row, the lit middle row, and a dark near row with rooftop
  // gear and neon signs. Each moves slower the further it is.
  const skyline = (seed: number, count: number, gap: number, minW: number, varW: number, minH: number, varH: number, baseY: number, par: number,
    body: string, roof: string, alpha: number, win: number, winAlpha: number, near: boolean) => {
    const base = baseY - camY * par, span = count * gap, off = camX * par;
    for (let i = 0; i < count; i++) {
      const k = seed + i, x = wrap(i * gap + hash(k, 9) * gap * .3 - off, span) - 240, w = minW + Math.round(hash(k, 10) * varW), h = minH + Math.round(hash(k, 11) * varH);
      if (x > viewW + 60 || x + w < -60) continue;
      const X = Math.round(x), top = Math.round(base - h);
      ctx.globalAlpha = alpha; ctx.fillStyle = body; ctx.fillRect(X, top, w, Math.round(h + viewH));
      if (hash(k, 12) > .5) { const tw = Math.round(w * .5); ctx.fillRect(X + Math.round((w - tw) / 2), top - 18, tw, 18); } // a stepped top tier
      ctx.fillStyle = roof; ctx.fillRect(X, top, w, 3);
      const step = win * 2;
      for (let wy = win + 4; wy < h - win; wy += step + 2) for (let wx = win; wx < w - win * 1.5; wx += step) {
        if (hash(k * 31 + wy, wx) < .5) continue;
        ctx.globalAlpha = winAlpha * (.6 + .4 * hash(k, wy + wx)); ctx.fillStyle = hash(k, wy) > .5 ? '#ffb84d' : '#ff8fb1'; ctx.fillRect(X + wx, top + wy, win, win);
      }
      if (hash(k, 13) > .6 && Math.floor(tick / 40 + i) % 2) { ctx.globalAlpha = .9; ctx.fillStyle = '#ff5c5c'; ctx.fillRect(X + Math.round(w / 2) - 2, top - 26, 4, 4); ctx.globalAlpha = alpha; ctx.fillStyle = body; ctx.fillRect(X + Math.round(w / 2) - 1, top - 22, 2, 22); }
      if (near) { // rooftop tank and antenna, and now and then a neon sign
        ctx.globalAlpha = alpha; ctx.fillStyle = body; ctx.fillRect(X + 10, top - 12, 18, 12); ctx.fillRect(X + w - 18, top - 30, 3, 30);
        if (hash(k, 14) > .55) { const sw = 34 + Math.round(hash(k, 15) * 20), on = Math.floor(tick / 50 + k) % 5 !== 0; ctx.globalAlpha = on ? .75 : .25; ctx.fillStyle = ['#ff8fb1', '#7fe8ff', '#ffd27a'][k % 3]; ctx.fillRect(X + Math.round((w - sw) / 2), top + 14, sw, 10); ctx.globalAlpha = on ? .9 : .3; ctx.fillStyle = '#fff6e0'; ctx.fillRect(X + Math.round((w - sw) / 2) + 4, top + 18, sw - 8, 2); }
      }
    }
  };
  skyline(100, 16, 120, 60, 70, 50, 130, viewH * .80, .012, '#2a1636', '#3c2248', .95, 4, .25, false);
  { const hy = Math.round(viewH * .80 - camY * .012); ctx.fillStyle = '#ff9a6a'; for (let b = 0; b < 5; b++) { ctx.globalAlpha = .04 + b * .03; ctx.fillRect(0, hy - 75 + b * 15, viewW, 15); } } // stepped haze between far and middle rows
  skyline(200, 14, 130, 72, 60, 50, 150, viewH * .86, .025, '#1c1022', '#2a1830', .85, 8, .6, false);
  skyline(300, 10, 210, 110, 80, 40, 110, viewH * .96, .05, '#0d0812', '#1e1226', .95, 10, .7, true);
  // Cargo freighters crossing slowly: a long blocky hull, a cargo stack and blinking running lights.
  for (let f = 0; f < 3; f++) {
    const span = viewW + 600, dir = f % 2 ? -1 : 1, speed = .12 + f * .05;
    const x = wrap(hash(f, 20) * span + dir * tick * speed - camX * .04, span) - 300, y = viewH * (.18 + f * .2) - camY * .04, len = 120 - f * 25;
    ctx.globalAlpha = .55 - f * .1; ctx.fillStyle = '#2b1d38'; ctx.fillRect(Math.round(x), Math.round(y), len, 14);
    ctx.fillStyle = '#3a2a4e'; ctx.fillRect(Math.round(x + (dir > 0 ? 10 : len - 40)), Math.round(y - 10), 30, 10);
    ctx.fillStyle = '#4a3a2a'; for (let c = 0; c < 3; c++) ctx.fillRect(Math.round(x + len * .35 + c * 14), Math.round(y - 8), 12, 8);
    if (Math.floor(tick / 30 + f) % 2) { ctx.globalAlpha = .9; ctx.fillStyle = '#9dff8a'; ctx.fillRect(Math.round(x + (dir > 0 ? len - 4 : 0)), Math.round(y + 5), 4, 4); ctx.fillStyle = '#ff5c5c'; ctx.fillRect(Math.round(x + (dir > 0 ? 0 : len - 4)), Math.round(y + 5), 4, 4); }
    ctx.globalAlpha = .25; ctx.fillStyle = '#ffb84d'; ctx.fillRect(Math.round(x + (dir > 0 ? -18 : len)), Math.round(y + 4), 18, 6); // engine glow
  }
  // A few cargo crates drifting and turning as whole squares.
  for (let c = 0; c < 6; c++) {
    const x = wrap(hash(c, 30) * (viewW + 200) + tick * (.05 + hash(c, 31) * .08) - camX * .06, viewW + 200) - 100;
    const y = wrap(hash(c, 32) * viewH + Math.sin(tick * .01 + c) * 12 - camY * .06, viewH), s = 10 + Math.round(hash(c, 33) * 10);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(tick * .002 * (c % 2 ? 1 : -1) + c);
    ctx.globalAlpha = .45; ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-s / 2, -s / 2, s, s); ctx.fillStyle = '#3a2614'; ctx.fillRect(-s / 2 + 2, -s / 2 + 2, s - 4, s - 4);
    ctx.fillStyle = '#ffb84d'; ctx.globalAlpha = .4; ctx.fillRect(-s / 2, -1, s, 2);
    ctx.restore();
  }
  ctx.restore();
}
