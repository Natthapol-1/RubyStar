'use client';
import { useEffect, useRef } from 'react';
import { drawCelestialBodyIcon } from './celestial-body-art';

type Ctx = CanvasRenderingContext2D;
const SIZE = 140;

type RubyPalette = { rim: string; core: string; facet: string; table: string; glint: string; sparkle: string };
const RUBY: RubyPalette = { rim: '#ff1155', core: '#a8183f', facet: '#ff4d7a', table: '#ff6a8f', glint: '#ffd0dc', sparkle: '#ffd6e2' };
const ASCENDED: RubyPalette = { rim: '#a56bff', core: '#4e2a96', facet: '#c39bff', table: '#d4b6ff', glint: '#f3e8ff', sparkle: '#ece0ff' };
/** The Ruby from the end of the intro cutscene (IntroCutscene.tsx rubyGem): a faceted gem on its point (a square turned
 * 45°) with a deep core, a bright upper facet, an inner table, a white glint, a pulsing glow and two twinkling sparkles.
 * s is the gem's side; t is in seconds. */
function ruby(ctx: Ctx, x: number, y: number, s: number, t: number, p: RubyPalette) {
  const pulse = .5 + .5 * Math.sin(t * 2.4);
  ctx.save(); ctx.translate(Math.round(x), y + Math.sin(t * 1.6) * s * .06); // sub-pixel bob so the float is smooth
  ctx.save(); ctx.rotate(Math.PI / 4);
  const box = (bx: number, by: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(bx, by, w, h); };
  ctx.shadowColor = p.rim; ctx.shadowBlur = Math.min(14, s * (.6 + .4 * pulse)); box(-s / 2, -s / 2, s, s, p.rim); ctx.shadowBlur = 0;
  box(-s * .34, -s * .34, s * .68, s * .68, p.core);   // deep core
  box(-s * .34, -s * .34, s * .68, s * .3, p.facet);   // bright upper facet
  box(-s * .2, -s * .2, s * .4, s * .4, p.table);      // inner table
  box(-s * .34, -s * .34, s * .2, s * .2, p.glint);    // white glint
  ctx.restore();
  for (const [dx, dy, ph] of [[-s * .9, -s * .7, 0], [s * .85, s * .5, 2]] as const) {
    const tw = Math.max(0, Math.sin(t * 2 + ph)); if (tw <= 0) continue;
    ctx.globalAlpha = tw; const r = Math.round(s * .25 * tw) + 2; ctx.fillStyle = p.sparkle;
    ctx.fillRect(dx - r, dy - 1, r * 2, 2); ctx.fillRect(dx - 1, dy - r, 2, r * 2); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
/** The player's default suit: a luminous square with a dark panel and a cyan visor. */
function player(ctx: Ctx, x: number, y: number, s: number) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  ctx.shadowColor = '#eeee44'; ctx.shadowBlur = 5; ctx.fillStyle = '#d8d870'; ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.shadowBlur = 0; ctx.fillStyle = '#a0a040'; ctx.fillRect(-s / 2 + 3, -s / 2 + 3, s - 6, s - 6);
  ctx.fillStyle = '#44ccff'; ctx.fillRect(-s / 2 + 4, -s / 2 + 5, s - 8, 4);
  ctx.restore();
}
function twinkle(ctx: Ctx, x: number, y: number, tick: number, phase: number) {
  const a = .25 + .75 * Math.abs(Math.sin(tick * .04 + phase)), s = Math.round(4 + 3 * a);
  ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - s, 2, s * 2); ctx.fillRect(x - s, y - 1, s * 2, 2); ctx.globalAlpha = 1;
}
const bob = (tick: number, period = 150, amp = 5) => Math.sin(tick * Math.PI * 2 / period) * amp;
/** A blocky gold card (w×h) turned by angle about (x, y): a dark border, a flat body with a deeper lower-right shade and
 * a pale upper-left lip, and a black compass-star pip (pip) or a stepped black glint in the middle. */
function card(ctx: Ctx, x: number, y: number, w: number, h: number, angle: number, body: string, shade: string, pip: boolean) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ctx.fillStyle = '#6b4510'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowBlur = 0;     // dark border (only it glows)
  ctx.fillStyle = shade; ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);              // deeper lower-right shade
  ctx.fillStyle = body; ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w - 14, h - 14);             // flat body
  ctx.fillStyle = '#fff1bf'; ctx.fillRect(-w / 2 + 4, -h / 2 + 4, w - 14, 3); ctx.fillRect(-w / 2 + 4, -h / 2 + 4, 3, h - 14); // pale lip
  if (pip) { // a still compass star, like the lobby's click star
    const arm = 13;
    ctx.fillStyle = '#5a4630'; ctx.fillRect(-arm, -3, arm * 2, 6); ctx.fillRect(-3, -arm, 6, arm * 2);
    ctx.fillStyle = '#5a4630'; ctx.fillRect(-7, -7, 14, 14); ctx.fillStyle = '#fff6d8'; ctx.fillRect(-4, -4, 8, 8);
  } else { // a flat stepped black glint crystal, centred and turned with the card (the front card may cover it)
    ctx.fillStyle = '#5a4630'; ctx.fillRect(-3, -11, 6, 22); ctx.fillRect(-7, -7, 14, 14);
  }
  ctx.restore();
}

function paint(ctx: Ctx, id: string, tick: number) {
  const c = SIZE / 2;
  if (id === 'tutorial') { // First Orbit: you circle Ruby along a dashed square orbit
    ctx.strokeStyle = '#7fd7ff66'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -tick * .3; ctx.strokeRect(18, 18, SIZE - 36, SIZE - 36); ctx.setLineDash([]);
    ruby(ctx, c, c, 30, tick / 60, RUBY);
    const per = SIZE - 36, d = ((tick * 1.4) % (per * 4)), side = Math.floor(d / per), f = d % per;
    const [px, py] = side === 0 ? [18 + f, 18] : side === 1 ? [18 + per, 18 + f] : side === 2 ? [18 + per - f, 18 + per] : [18, 18 + per - f];
    player(ctx, px, py, 20);
  } else if (id === 'trials') { // Celestial Challenge: a world from the star map, with a moon and twinkles
    ctx.save(); ctx.translate(c, c + bob(tick, 170)); drawCelestialBodyIcon(ctx, 'saturn', 30, tick / 60); ctx.restore();
    ctx.save(); ctx.translate(116, 24 + bob(tick, 120, 3)); drawCelestialBodyIcon(ctx, 'neptune', 10, tick / 60, true); ctx.restore();
    twinkle(ctx, 18, 22, tick, 0); twinkle(ctx, 120, 116, tick, 1.6);
  } else if (id === 'gambit') { // Star Gambit: a fanned hand of two gold cards, the front one marked with a star
    const y = c + 4 + bob(tick, 160, 4), sway = Math.sin(tick * .02) * .03;
    ctx.save(); ctx.shadowColor = '#ffb84d'; ctx.shadowBlur = 6;
    card(ctx, c - 14, y, 50, 70, -.28 + sway, '#e0ad4e', '#b5832e', false);
    card(ctx, c + 14, y - 2, 50, 70, .16 + sway, '#ffd27a', '#e0ad4e', true);
    ctx.restore();
    twinkle(ctx, 116, 24, tick, .8); twinkle(ctx, 24, 112, tick, 2.4);
  } else if (id === 'ascension') { // Ascension: an awakened violet Ruby under a crown, with crossed light bars
    // the crossed bars bob with the Ruby (same motion as ruby())
    ctx.save(); ctx.translate(c, c + 8 + Math.sin(tick / 60 * 1.6) * 42 * .06); // centred on the Ruby ctx.globalAlpha = .35 + .15 * Math.sin(tick * .05);
    for (const angle of [Math.PI / 4, -Math.PI / 4]) { ctx.save(); ctx.rotate(angle); ctx.fillStyle = '#c99bff'; ctx.fillRect(-3, -48, 6, 96); ctx.restore(); }
    ctx.restore();
    ruby(ctx, c, c + 8, 42, tick / 60, ASCENDED);
    const y = 14 + bob(tick); ctx.shadowColor = '#ffcb3a'; ctx.shadowBlur = 5; ctx.fillStyle = '#ffe477';
    ctx.fillRect(c - 24, y + 8, 48, 8); for (const dx of [-24, -4, 16]) ctx.fillRect(c + dx, y, 8, 8); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff6c8'; ctx.fillRect(c - 2, y + 10, 4, 4);
  } else { // Endless Space: Ruby, floating
    ruby(ctx, c, c, 52, tick / 60, RUBY);
  }
}

/** A lobby mode icon drawn with the game's own art (Ruby, the player suit, star-map worlds), animated on its own clock. */
export default function ModeEmblem({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, ctx = canvas?.getContext('2d'); if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = SIZE * dpr; canvas.height = SIZE * dpr;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, start = 0;
    const frame = (now: number) => {
      start ||= now; const tick = still ? 40 : (now - start) * .06;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, SIZE, SIZE); paint(ctx, id, tick);
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [id]);
  return <canvas ref={ref} className="rs-emblem" style={{ width: SIZE, height: SIZE }} aria-hidden="true" />;
}
