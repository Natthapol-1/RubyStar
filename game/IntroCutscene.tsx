'use client';

import CutscenePlayer from './CutscenePlayer';
import { W, H, CRUISE_CHARGE_SOUND, type Ctx, type CutsceneCue, hash, clamp, ease, span, block, stars, nebula, ship, caption } from './cutscene-art';

// The opening cinematic, drawn on one canvas in the game's blocky neon style (a 1280×720 stage scaled to the window,
// with letterbox bars). About 26 seconds:
//   1. LAUNCH   (0–5s)    your ship lifts off a pad on a blocky planet; the camera follows it up.
//   2. CRUISE   (5–10s)   it cruises right through a parallax starfield toward a distant red star.
//   3. AMBUSH   (10–14s)  an alien streaks in and rams it: white flash, sparks, the ship spins, red alarm.
//   4. FALL     (14–19s)  seen from above, the ship spirals down trailing smoke onto the neon station and crashes.
//   5. SURROUNDED (19–24.5s) you climb out of the wreck as aliens teleport in around you and close in.
//   6. TITLE    (24.5–27s) fade to black, the RUBY STAR title, then onDone.
// Skip with the button, Escape or Enter. Everything is drawn from the elapsed time, so it plays the same every time.

const END = 27;
const FALL_AT = 14, IMPACT_AT = 18.2;
const CYAN = '#5ad8ff', RED = '#ff4d5a', WHITE = '#ffffff';
const ALIEN_COLORS = ['#ff4d5a', '#5ad8ff', '#4dff9a', '#ffaa33', '#c58cff', '#ff6bd0'];

/** The Ruby: a faceted gem standing on its point (a square turned 45°), with a deep core, a bright facet, a white glint,
 * a soft pulsing glow and two twinkling cross sparkles. */
function rubyGem(ctx: Ctx, x: number, y: number, s: number, t: number, alpha = 1) {
  if (alpha <= 0) return; const pulse = .5 + .5 * Math.sin(t * 2.4);
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y + Math.sin(t * 1.6) * s * .06);
  ctx.save(); ctx.rotate(Math.PI / 4);
  ctx.shadowColor = '#ff1155'; ctx.shadowBlur = s * (.6 + .4 * pulse); block(ctx, -s / 2, -s / 2, s, s, '#ff1155'); ctx.shadowBlur = 0;
  block(ctx, -s * .34, -s * .34, s * .68, s * .68, '#a8183f');           // deep core
  block(ctx, -s * .34, -s * .34, s * .68, s * .3, '#ff4d7a');            // bright upper facet
  block(ctx, -s * .2, -s * .2, s * .4, s * .4, '#ff6a8f');               // inner table
  block(ctx, -s * .34, -s * .34, s * .2, s * .2, '#ffd0dc');             // white glint
  ctx.restore();
  for (const [dx, dy, ph] of [[-s * .9, -s * .7, 0], [s * .85, s * .5, 2]] as const) { const tw = Math.max(0, Math.sin(t * 2 + ph)); if (tw <= 0) continue;
    ctx.globalAlpha = alpha * tw; const r = Math.round(s * .25 * tw) + 2; block(ctx, dx - r, dy - 1, r * 2, 2, '#ffd6e2'); block(ctx, dx - 1, dy - r, 2, r * 2, '#ffd6e2'); }
  ctx.restore();
}
/** A normal alien in the game's style: a neon square with a dark inset, an antenna and two eyes. */
function alien(ctx: Ctx, x: number, y: number, s: number, color: string, t: number, id = 0) {
  const h = s / 2; ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 10;
  block(ctx, x - h, y - h, s, s, color); ctx.shadowBlur = 0; block(ctx, x - h + s * .12, y - h + s * .12, s * .76, s * .76, '#00000055');
  block(ctx, x - 1, y - h - s * .3, 2, s * .3, color); ctx.shadowColor = WHITE; ctx.shadowBlur = 6; block(ctx, x - 2, y - h - s * .3 - 4, 4, 4, WHITE); ctx.shadowBlur = 0;
  const e = Math.max(3, s * .18), blink = Math.floor(t * 2 + id) % 7 === 0;
  block(ctx, x - h + s * .18, y - h + s * .22, e, blink ? 1 : e, WHITE); block(ctx, x + h - s * .18 - e, y - h + s * .22, e, blink ? 1 : e, WHITE);
  if (!blink) { block(ctx, x - h + s * .18 + 1, y - h + s * .22 + 1, e - 1, e - 1, RED); block(ctx, x + h - s * .18 - e + 1, y - h + s * .22 + 1, e - 1, e - 1, RED); }
  ctx.restore();
}
/** You on the battlefield, drawn exactly like the player in play: the luminous suit square, its darker inset panel and
 * a glowing visor on the side you face (down here), with a small highlight. */
function hero(ctx: Ctx, x: number, y: number, s: number, t: number) {
  const h = s / 2, pad = Math.max(2, Math.floor(s * .12)), vw = Math.floor(s * .56), vh = Math.floor(s * .3);
  ctx.save(); ctx.shadowColor = '#d8d870'; ctx.shadowBlur = 14 + 3 * Math.sin(t * 4); block(ctx, x - h, y - h, s, s, '#d8d870'); ctx.shadowBlur = 0;
  block(ctx, x - h + pad, y - h + pad, s - pad * 2, s - pad * 2, '#a0a040');
  const vx = x - vw / 2, vy = y + h - pad - Math.floor(vh * .1) - vh;
  ctx.shadowColor = '#44ccff'; ctx.shadowBlur = 10; block(ctx, vx, vy, vw, vh, '#44ccffcc'); ctx.shadowBlur = 0; block(ctx, vx + 1, vy + 1, Math.floor(vw * .4), Math.floor(vh * .4), '#ffffff55');
  ctx.restore();
}
function burst(ctx: Ctx, x: number, y: number, p: number, cols: string[], reach: number, n = 18) {
  const e = 1 - (1 - p) ** 3;
  for (let k = 0; k < 3; k++) { const r = 10 + reach * Math.max(0, e - k * .08); ctx.globalAlpha = 1 - p; ctx.strokeStyle = cols[k % cols.length]; ctx.lineWidth = 8 - k * 2; ctx.strokeRect(x - r, y - r, r * 2, r * 2); }
  for (let k = 0; k < n; k++) { const a = k * 2.39996, d = 10 + reach * 1.2 * e * (.5 + (k % 4) * .15), sz = k % 3 ? 6 : 10; ctx.globalAlpha = 1 - p; block(ctx, x + Math.cos(a) * d - sz / 2, y + Math.sin(a) * d - sz / 2 + p * p * 40, sz, sz, cols[k % cols.length]); }
  ctx.globalAlpha = 1;
}
/** The station from above: four neon chambers joined by hallways, on a dark grid. */
function station(ctx: Ctx, cx: number, cy: number, z: number, t: number, glow = 1) {
  const cols = ['#00d4ff', '#ff6b6b', '#00ff88', '#ffaa00'], room = 300 * z, gap = 120 * z;
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = '#0a0a1a'; ctx.fillRect(-room - gap / 2, -room - gap / 2, room * 2 + gap, room * 2 + gap);
  for (let k = 0; k < 4; k++) {
    const x = (k % 2 ? gap / 2 : -room - gap / 2), y = (k < 2 ? -room - gap / 2 : gap / 2);
    ctx.fillStyle = '#0d0d22'; ctx.fillRect(x, y, room, room); ctx.fillStyle = cols[k] + '12'; ctx.fillRect(x, y, room, room);
    ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = 1; for (let g = 1; g < 8; g++) { ctx.beginPath(); ctx.moveTo(x + g * room / 8, y); ctx.lineTo(x + g * room / 8, y + room); ctx.moveTo(x, y + g * room / 8); ctx.lineTo(x + room, y + g * room / 8); ctx.stroke(); }
    ctx.shadowColor = cols[k]; ctx.shadowBlur = 16 * glow; ctx.strokeStyle = cols[k]; ctx.globalAlpha = .55 + .2 * Math.sin(t * 2 + k); ctx.lineWidth = Math.max(2, 4 * z); ctx.strokeRect(x, y, room, room); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
  ctx.fillStyle = '#5ad8ff22'; ctx.fillRect(-gap / 2, -room * .2, gap, room * .4); ctx.fillRect(-room * .2, -gap / 2, room * .4, gap);
  ctx.restore();
}

/** Draws one frame of the cutscene at time t (seconds) on a stage already scaled to 1280×720, and returns the screen
 * shake to apply. sfx plays each cue once. Exported so the frames can be rendered offline for checking. */
export function drawIntroFrame(ctx: Ctx, t: number, sfx: CutsceneCue = () => {}): number {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  let shake = 0;
  if (t < 5) { // 1. LAUNCH
    const lift = ease(span(t, 2.8, 5)), cam = lift * 520;
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#05051a'); sky.addColorStop(1, '#1a1040'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    stars(ctx, 0, -cam * 2, t); nebula(ctx, 0, -cam);
    const gy = 500 + cam; // a blocky planet horizon with a glowing rim, and the launch pad (the camera follows the ship up)
    for (let x = 0; x < W; x += 16) { const d = (x - W / 2) / W, hgt = Math.round((d * d * 260) / 8) * 8; block(ctx, x, gy + hgt, 16, H, '#140f2e'); block(ctx, x, gy + hgt, 16, 4, '#6f5cff'); }
    ctx.shadowColor = CYAN; ctx.shadowBlur = 10; block(ctx, W / 2 - 90, gy - 10, 180, 10, CYAN); ctx.shadowBlur = 0; block(ctx, W / 2 - 80, gy - 6, 160, 6, '#0d2a3a');
    block(ctx, W / 2 + 70, gy - 150, 10, 140, '#2a2a4a'); for (let k = 0; k < 6; k++) block(ctx, W / 2 + 70, gy - 140 + k * 22, 26, 3, '#3a3a6a');
    const ign = span(t, 1.6, 2.8), sy = 454 - lift * 200; shake = ign * (1 - lift) * 4 + (t > 2.8 && t < 3.6 ? 5 : 0);
    if (ign > 0) for (let k = 0; k < 10; k++) { const a = hash(k, 9) * Math.PI, d = 30 + (t * 60 + k * 20) % 90; ctx.globalAlpha = .4 * ign * (1 - lift); block(ctx, W / 2 + Math.cos(a) * d * (k % 2 ? 1 : -1) - 6, gy - 14 - Math.sin(a) * 14, 12, 8, '#8a7aa8'); }
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(W / 2, sy); ctx.rotate(-Math.PI / 2); ship(ctx, 0, 0, t, ign, 0, 1.6); ctx.restore();
    caption(ctx, 'RUBY STATION', 120, span(t, .6, 1.4) * (1 - span(t, 3.4, 4.2)), 18, '#9fb4ff');
    sfx('ignite', 1.6, t, '/sounds/jupiter-charge-power-up.wav', .8, .8); sfx('lift', 2.8, t, '/sounds/meteorFalling.mp3', .9, .7);
  } else if (t < FALL_AT) { // 2. CRUISE and 3. AMBUSH
    const cruise = t - 5;
    ctx.fillStyle = '#05051a'; ctx.fillRect(0, 0, W, H);
    stars(ctx, cruise * 420, 0, t, t < 12.2 ? .4 : 0); nebula(ctx, cruise * 40, 0);
    rubyGem(ctx, 1100 - cruise * 6, 180, 14, t); // the distant Ruby Star
    const hit = t >= 12.2, after = hit ? t - 12.2 : 0;
    const sx = hit ? 560 + after * 120 : 380 + Math.sin(t * 1.2) * 20 + ease(span(t, 5, 6.5)) * 180 - 180, syy = hit ? 360 + after * after * 60 : 360 + Math.sin(t * 2) * 8;
    if (hit) for (let k = 0; k < 14; k++) { const age = (after * 8 + k) % 14; ctx.globalAlpha = .35 * (1 - age / 14); block(ctx, sx - 40 - age * 18, syy - 6 + Math.sin(k) * 10, 14, 14, '#5a5a6a'); } // smoke trail
    ctx.globalAlpha = 1;
    ship(ctx, sx, syy, t, hit ? .3 : 1, hit ? after * 6 : Math.sin(t * 2) * .04, 1.4, hit ? 1 : 0);
    if (t > 10 && t < 12.4) { const p = span(t, 10, 12.2), ax = 1500 - p * 940, ay = 120 + p * 240; // the alien streaks in
      for (let k = 1; k <= 6; k++) { ctx.globalAlpha = .25 * (1 - k / 7); block(ctx, ax + k * 26, ay - k * 6 - 10, 20, 20, RED); } ctx.globalAlpha = 1;
      alien(ctx, ax, ay, 44, RED, t); }
    if (hit && after < 1) { burst(ctx, 590, 360, after, [WHITE, '#ffcc4d', RED], 220); if (after < .15) { ctx.globalAlpha = (.15 - after) * 6; block(ctx, 0, 0, W, H, WHITE); ctx.globalAlpha = 1; } }
    if (hit) { const blink = Math.floor(after * 4) % 2 === 0; ctx.globalAlpha = blink ? .14 : .04; block(ctx, 0, 0, W, H, RED); ctx.globalAlpha = 1; caption(ctx, '! HULL BREACH !', 110, blink ? 1 : .4, 20, RED); shake = after < .6 ? 14 * (1 - after / .6) : 2; }
    caption(ctx, 'COURSE SET FOR THE RUBY STAR', 590, span(t, 5.8, 6.6) * (1 - span(t, 9.2, 10)), 16, '#9fb4ff');
    if (t < 10) sfx('cruise', 5.8, t, CRUISE_CHARGE_SOUND, 1);
    sfx('whoosh', 10.4, t, '/sounds/speedBoost.mp3', .8, .7); sfx('crash1', 12.2, t, '/sounds/sci-fi-explosion-09.mp3', 1, .8); sfx('crash2', 12.25, t, '/sounds/meteorExplode.mp3', .9); sfx('alarm', 12.6, t, '/sounds/sun-heat-warning.mp3', .7);
  } else if (t < 19) { // 4. FALL, from above
    const p = span(t, FALL_AT, IMPACT_AT), z = .35 + ease(p) * .9;
    ctx.fillStyle = '#05051a'; ctx.fillRect(0, 0, W, H); stars(ctx, 0, 0, t); nebula(ctx, 0, 0);
    station(ctx, W / 2, H / 2, z, t);
    const fx = W / 2 + Math.cos(t * 5) * 220 * (1 - p), fy = H / 2 + Math.sin(t * 5) * 140 * (1 - p), fs = 2.4 - p * 1.6;
    for (let k = 0; k < 16; k++) { const tt = t - k * .05, kx = W / 2 + Math.cos(tt * 5) * 220 * (1 - span(tt, FALL_AT, IMPACT_AT)), ky = H / 2 + Math.sin(tt * 5) * 140 * (1 - span(tt, FALL_AT, IMPACT_AT)); ctx.globalAlpha = .3 * (1 - k / 16); block(ctx, kx - 10, ky - 10, 20, 20, '#5a5a6a'); }
    ctx.globalAlpha = 1;
    if (t < IMPACT_AT) ship(ctx, fx, fy, t, .3, t * 7, fs, 1);
    if (t >= IMPACT_AT) { const a = span(t, IMPACT_AT, 19); burst(ctx, W / 2, H / 2, a, [WHITE, '#ffcc4d', '#ff8a3d', CYAN], 320, 26); if (a < .2) { ctx.globalAlpha = (.2 - a) * 4; block(ctx, 0, 0, W, H, '#fff6e0'); ctx.globalAlpha = 1; } shake = 18 * (1 - a); }
    if (t < IMPACT_AT) sfx('fall', FALL_AT, t, '/sounds/intro-ship-fall.wav', .9);
    sfx('impact', IMPACT_AT, t, '/sounds/bombExplode.wav', 1, .7); sfx('impact2', IMPACT_AT + .05, t, '/sounds/sci-fi-explosion-09.mp3', 1, .6);
  } else if (t < 24.5) { // 5. SURROUNDED
    const p = t - 19, zoom = 1.75 + ease(span(t, 19, 24.5)) * .25; // a close shot on the crash site
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    for (let x = -2; x < W / 48 + 2; x++) for (let y = -2; y < H / 48 + 2; y++) { const gx = x * 48 + 16, gy = y * 48 + 8; block(ctx, gx, gy, 48, 48, '#0d0d22'); ctx.strokeStyle = '#ffffff0d'; ctx.strokeRect(gx + .5, gy + .5, 47, 47); }
    ctx.shadowColor = CYAN; ctx.shadowBlur = 14; ctx.strokeStyle = CYAN + 'aa'; ctx.lineWidth = 4; ctx.strokeRect(40, 40, W - 80, H - 80); ctx.shadowBlur = 0;
    for (let k = 0; k < 8; k++) { const a = k * .8 + 1, d = 70 + (k % 3) * 22; block(ctx, W / 2 + Math.cos(a) * d - 8, H / 2 + Math.sin(a) * d - 6, 16 + (k % 2) * 8, 10, '#2a2a3a'); } // wreckage
    for (let k = 0; k < 6; k++) { const age = (p * 1.5 + k * .4) % 2.4; ctx.globalAlpha = .3 * (1 - age / 2.4); block(ctx, W / 2 - 30 + k * 12 - 10, H / 2 - 20 - age * 60, 20, 20, '#4a4a5a'); } // smoke
    ctx.globalAlpha = 1; block(ctx, W / 2 - 44, H / 2 - 22, 88, 44, '#1c1a10'); block(ctx, W / 2 - 40, H / 2 - 18, 80, 36, '#3a3410'); // the wreck
    if (Math.floor(p * 6) % 2) { ctx.globalAlpha = .7; block(ctx, W / 2 - 10, H / 2 - 30, 8, 8, '#ff8a3d'); block(ctx, W / 2 + 18, H / 2 - 26, 6, 6, '#ffcc4d'); ctx.globalAlpha = 1; } // flames
    const out = ease(span(t, 19.6, 20.6)); if (out > 0) hero(ctx, W / 2, H / 2 + 70 * out, 34, t); // you climb out
    for (let k = 0; k < 10; k++) { // aliens teleport in around you and close in
      const at = 20.6 + k * .22; if (t < at) continue; const q = t - at, a = k / 10 * Math.PI * 2 + .3, r0 = 270 + (k % 3) * 26, r = r0 - ease(clamp(q / 2.6)) * 120;
      const x = W / 2 + Math.cos(a) * r, y = H / 2 + 70 + Math.sin(a) * r * .62;
      if (q < .35) { const s = q / .35; ctx.globalAlpha = 1 - s; ctx.strokeStyle = ALIEN_COLORS[k % 6]; ctx.lineWidth = 3; ctx.strokeRect(x - 30 * (1 - s) - 10, y - 30 * (1 - s) - 10, 20 + 60 * (1 - s), 20 + 60 * (1 - s)); ctx.globalAlpha = 1; }
      alien(ctx, x, y, 34, ALIEN_COLORS[k % 6], t, k);
    }
    ctx.restore();
    const vign = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 760); vign.addColorStop(0, '#00000000'); vign.addColorStop(1, '#000000cc'); ctx.fillStyle = vign; ctx.fillRect(0, 0, W, H);
    sfx('tp', 20.6, t, '/sounds/gameModeClick.mp3', .8); sfx('tp2', 21.4, t, '/sounds/gameModeClick.mp3', .7, 1.2); sfx('tp3', 22.2, t, '/sounds/gameModeClick.mp3', .6, .9); 
  } else { // 6. TITLE
    const a = span(t, 24.5, 25.3), out = span(t, 26.3, 27);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); stars(ctx, t * 20, 0, t); ctx.globalAlpha = 1;
    rubyGem(ctx, W / 2, H / 2 - 110, 46, t, a * (1 - out));
    caption(ctx, 'RUBY STAR', H / 2 + 20, a * (1 - out), 48, '#ff6b8d');
    caption(ctx, 'FIRST ORBIT', H / 2 + 80, span(t, 25.2, 25.8) * (1 - out), 14, '#9fb4ff');
    sfx('title', 24.6, t, '/sounds/ascension-unlock.mp3', .8);
  }
  ctx.restore();
  // Letterbox bars that slide in at the start.
  const bar = H * .1 * ease(span(t, 0, 1));
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  if (t < .8) { ctx.globalAlpha = 1 - t / .8; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  return shake;
}

export default function IntroCutscene({ onDone }: { onDone: () => void }) {
  return <CutscenePlayer label="Intro cutscene" duration={END} drawFrame={drawIntroFrame} onDone={onDone} />;
}
