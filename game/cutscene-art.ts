export const W = 1280, H = 720;
export const CRUISE_CHARGE_SOUND = '/sounds/charging-sun-travel.wav';
export const TELEPORT_SOUND_FILE = 'gameModeClick.mp3';
const CYAN = '#5ad8ff', WHITE = '#ffffff';
export type CutsceneCue = (id: string, at: number, t: number, src: string, vol: number, rate?: number) => void;
export type CutsceneFrame = (ctx: Ctx, t: number, sfx: CutsceneCue) => number;

/** One closed silhouette, with shared edges for any surface bands painted inside it. */
export function discBands(ctx: Ctx, radius: number, rows: number) {
  const step = radius / rows;
  const bands = Array.from({ length: rows * 2 }, (_, i) => {
    const row = i - rows;
    const y = Math.round(row * step), bottom = Math.round((row + 1) * step);
    const half = Math.round(Math.floor(Math.sqrt(rows * rows - (row + .5) ** 2)) * step);
    return { row, y, bottom, half };
  });
  ctx.beginPath();
  ctx.moveTo(-bands[0].half, bands[0].y);
  for (const { y, bottom, half } of bands) {
    ctx.lineTo(-half, y); ctx.lineTo(-half, bottom);
  }
  for (const { y, bottom, half } of bands.slice().reverse()) {
    ctx.lineTo(half, bottom); ctx.lineTo(half, y);
  }
  ctx.closePath();
  return bands;
}

/** The flyby starts as the approach shot fades in, followed by the docking cue. */
export function cueArrivalApproach(cue: CutsceneCue, t: number, approach: number, touchdown?: number) {
  cue('flyby', approach + .25, t, '/sounds/meteorFalling.mp3', .45, .88);
  if (touchdown !== undefined) cue('landing', touchdown, t, '/sounds/' + TELEPORT_SOUND_FILE, .48, .75);
}

export type Ctx = CanvasRenderingContext2D;
export const hash = (i: number, k: number) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n); };
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const ease = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
export const span = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const block = (ctx: Ctx, x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

export function stars(ctx: Ctx, ox: number, oy: number, t: number, streak = 0) {
  for (let i = 0; i < 220; i++) {
    const layer = i % 5 === 0 ? 2 : i % 2 ? 0 : 1, par = [.15, .35, .7][layer];
    const x = (((hash(i, 1) * W * 2 - ox * par) % W) + W) % W, y = (((hash(i, 2) * H * 2 - oy * par) % H) + H) % H;
    ctx.globalAlpha = [.35, .55, .85][layer] * (layer === 2 ? .7 + .3 * Math.sin(t * 3 + i) : 1); ctx.fillStyle = i % 9 === 0 ? '#c9b8ff' : '#dfe6ff';
    const len = 1 + layer + streak * par * 30; ctx.fillRect(Math.round(x - (streak ? len : 0)), Math.round(y), Math.round(len + (streak ? 0 : layer)), layer + 1);
  }
  ctx.globalAlpha = 1;
}
export function nebula(ctx: Ctx, ox: number, oy: number) {
  [['#3a5cff', .25, .3], ['#b04dff', .7, .55], ['#00d4ff', .45, .85]].forEach(([c, fx, fy], n) => {
    const cx = (fx as number) * W - ox * .08, cy = (fy as number) * H - oy * .08; ctx.fillStyle = c as string;
    for (let r = 3; r >= 0; r--) for (let b = 0; b < 6; b++) { const k = n * 40 + r * 7 + b, w = (120 + hash(k, 3) * 200) * (1 + r * .4), h = (40 + hash(k, 4) * 80) * (1 + r * .3);
      ctx.globalAlpha = .015 + (3 - r) * .012; ctx.fillRect(cx + (hash(k, 5) - .5) * (100 + r * 100) * 2 - w / 2, cy + (hash(k, 6) - .5) * (80 + r * 60) - h / 2, w, h); }
  });
  ctx.globalAlpha = 1;
}
/** Your ship, side view, nose to the right: a white neon hull, a cyan cockpit, fins and a flickering thruster flame. */
export function ship(ctx: Ctx, x: number, y: number, t: number, flame: number, angle = 0, scale = 1, damaged = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  if (flame > 0) { const f = flame * (14 + 8 * Math.abs(Math.sin(t * 40))); ctx.shadowColor = '#ffb04d'; ctx.shadowBlur = 16;
    block(ctx, -40 - f, -7, f, 14, '#ff8a3d'); block(ctx, -40 - f * .6, -4, f * .6, 8, '#ffe28a'); block(ctx, -40 - f * .3, -2, f * .3, 4, WHITE); ctx.shadowBlur = 0; }
  const HULL = '#e8f0ff';
  ctx.shadowColor = '#cfe0ff'; ctx.shadowBlur = 12;
  block(ctx, -40, -12, 64, 24, HULL); block(ctx, 24, -8, 12, 16, HULL); block(ctx, 36, -4, 8, 8, HULL); // hull and stepped nose
  block(ctx, -36, -24, 18, 12, HULL); block(ctx, -36, 12, 18, 12, HULL);                                 // fins
  ctx.shadowBlur = 0;
  block(ctx, -36, -8, 56, 16, '#2a3040');                                                                     // dark inset
  ctx.shadowColor = CYAN; ctx.shadowBlur = 10; block(ctx, 6, -6, 16, 12, CYAN); ctx.shadowBlur = 0; block(ctx, 10, -4, 6, 4, WHITE); // cockpit
  block(ctx, -28, -3, 4, 6, HULL); block(ctx, -18, -3, 4, 6, HULL);                                            // hull lights
  if (damaged > 0) { block(ctx, -20, -12, 10, 6, '#1a1408'); block(ctx, -6, 6, 8, 6, '#1a1408'); }
  ctx.restore();
}
export function caption(ctx: Ctx, text: string, y: number, alpha: number, size = 22, color = '#e8f4ff') {
  if (alpha <= 0) return; ctx.save(); ctx.globalAlpha = alpha; ctx.font = `${size}px "Press Start 2P", monospace`; ctx.textAlign = 'center';
  ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.fillStyle = color; ctx.fillText(text, W / 2, y); ctx.restore();
}
