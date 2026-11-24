import type { TrialBody } from './trials';
import { TRIALS } from './trials';

type Ctx = CanvasRenderingContext2D;

// Canvas version of the star-map planets (CelestialBody.tsx + celestial-body.css), for scenes such as the challenge
// arrivals. Every size in the CSS art is in map pixels, so it is scaled by k = (2 × radius) / the world's map size.

/** A stepped circle (rows of axis-aligned runs, as planets are drawn in game), centred on (ox, oy). */
function steppedPath(r: number, rows: number, ox = 0, oy = 0) {
  const path = new Path2D(), h = (2 * r) / rows, right: [number, number][] = [], left: [number, number][] = [];
  for (let k = 0; k < rows; k++) {
    const y0 = -r + k * h, y1 = y0 + h, mid = (y0 + y1) / 2, w = Math.round(r * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(mid / r), SQUIRCLE)), 1 / SQUIRCLE) / (h / 2)) * (h / 2); // a rounded square, half-widths snapped to the row grid
    right.push([ox + w, oy + y0], [ox + w, oy + y1]);
    left.unshift([ox - w, oy + y1], [ox - w, oy + y0]);
  }
  [...right, ...left].forEach(([x, y], i) => i ? path.lineTo(Math.round(x), Math.round(y)) : path.moveTo(Math.round(x), Math.round(y)));
  path.closePath(); return path;
}
const ROWS = 8; // the same chunky stepping as the star map's planet polygon
const SQUIRCLE = 2; // outline exponent: 2 is a circle (matching celestial-body.css)

/** CSS-style inset shading inside a body: a dark patch along the lower-right edge and a pale one along the upper-left. */
function shadeInside(ctx: Ctx, r: number, dark: number, darkColor: string, light: number, lightColor: string, darkX = dark, darkY = dark, outline = steppedPath) {
  const outside = (dx: number, dy: number, color: string) => {
    const p = new Path2D(); p.rect(-2 * r, -2 * r, 4 * r, 4 * r); p.addPath(outline(r, ROWS, dx, dy));
    ctx.fillStyle = color; ctx.fill(p, 'evenodd');
  };
  if (light > 0) outside(light, light, lightColor);
  if (darkX || darkY) outside(-darkX, -darkY, darkColor);
}
/** A rimmed planet body: rim, then the body inset by 2 map pixels, with fill painted by `paint` inside the clip. */
function orb(ctx: Ctx, r: number, k: number, rim: string, paint: (inner: number) => void, outline = steppedPath) {
  ctx.fillStyle = rim; ctx.fill(outline(r, ROWS));
  const inner = r - 5 * k; // a bold border (5 map pixels) in a darker shade of the planet
  ctx.save(); ctx.clip(outline(inner, ROWS)); paint(inner); ctx.restore();
}
/** A smaller rimmed body centred at (x, y): radius rr, with the star map's shading at its own map size. */
function orbAt(ctx: Ctx, x: number, y: number, rr: number, k: number, mapSize: number, rim: string, fill: string, dark: string, light: string, glint: string) {
  ctx.save(); ctx.translate(x, y);
  orb(ctx, rr, k, rim, inner => { ctx.fillStyle = fill; ctx.fillRect(-inner, -inner, 2 * inner, 2 * inner); shadeInside(ctx, inner, Math.round(mapSize * .16) * k, dark, 0, light); });
  ctx.globalAlpha = .85; ctx.fillStyle = glint; ctx.fillRect(Math.round(-rr + rr * 2 * .22), Math.round(-rr + rr * 2 * .2), Math.round(rr * 2 * .16), Math.round(rr * 2 * .12)); ctx.globalAlpha = 1;
  ctx.restore();
}
/** Between the Moon's notched square and the Sun's circle: a square with two-step rounded corners, side 2r, centred on (ox, oy). */
function softPath(r: number, _rows: number, ox = 0, oy = 0) {
  const pts = [[0.25, 0.0],[0.75, 0.0],[0.75, 0.09],[0.91, 0.09],[0.91, 0.25],[1.0, 0.25],[1.0, 0.75],[0.91, 0.75],[0.91, 0.91],[0.75, 0.91],[0.75, 1.0],[0.25, 1.0],[0.25, 0.91],[0.09, 0.91],[0.09, 0.75],[0.0, 0.75],[0.0, 0.25],[0.09, 0.25],[0.09, 0.09],[0.25, 0.09]];
  const path = new Path2D();
  pts.forEach(([x, y], i) => { const X = Math.round(ox - r + x * 2 * r), Y = Math.round(oy - r + y * 2 * r); if (i) path.lineTo(X, Y); else path.moveTo(X, Y); });
  path.closePath(); return path;
}
/** The Ruby gemstone's notched-square silhouette (its cushion cut), side 2r, centred on (ox, oy). */
function cushionPath(r: number, _rows: number, ox = 0, oy = 0) {
  const pts = [[.143, 0], [.857, 0], [.857, .125], [1, .125], [1, .875], [.857, .875], [.857, 1], [.143, 1], [.143, .875], [0, .875], [0, .125], [.143, .125]];
  const path = new Path2D();
  pts.forEach(([x, y], i) => { const X = Math.round(ox - r + x * 2 * r), Y = Math.round(oy - r + y * 2 * r); if (i) path.lineTo(X, Y); else path.moveTo(X, Y); });
  path.closePath(); return path;
}
const stripes = (ctx: Ctx, r: number, bands: [number, string][]) => {
  const total = bands.reduce((s, [h]) => s + h, 0);
  for (let y = -r, i = 0; y < r; i++) { const [h, c] = bands[i % bands.length]; ctx.fillStyle = c; ctx.fillRect(-r, y, 2 * r, h + .5); y += h; if (total <= 0) break; }
};
const rect = (ctx: Ctx, r: number, x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(-r + x), Math.round(-r + y), Math.round(w), Math.round(h)); };

/** Draws a world's star-map icon centred on the origin with radius r. t (seconds) drives the small pulses. */
/** cushion: draw a round world in the Moon's notched-square silhouette instead (used for tiny icons). */
export function drawCelestialBodyIcon(ctx: Ctx, id: TrialBody, r: number, t: number, cushion = false) {
  const size = TRIALS.find(trial => trial.id === id)?.size ?? 50, d = 2 * r, k = d / size;
  // One flat dark patch on the lower-right, then a single pale square glint (as on the star map).
  const roundPath = cushion ? cushionPath : softPath;
  const shadeSoft = (rr: number, dark: string, light: string) => { shadeInside(ctx, rr, Math.round(size * .16) * k, dark, 0, light, undefined, undefined, roundPath); ctx.globalAlpha = .85; ctx.fillStyle = light; ctx.fillRect(Math.round(-rr + rr * 2 * .22), Math.round(-rr + rr * 2 * .2), Math.round(rr * 2 * .16), Math.round(rr * 2 * .12)); ctx.globalAlpha = 1; };
  const shade = (rr: number, dark: string, light: string) => { shadeInside(ctx, rr, Math.round(size * .16) * k, dark, 0, light); ctx.globalAlpha = .85; ctx.fillStyle = light; ctx.fillRect(Math.round(-rr + rr * 2 * .22), Math.round(-rr + rr * 2 * .2), Math.round(rr * 2 * .16), Math.round(rr * 2 * .12)); ctx.globalAlpha = 1; };
  ctx.save();
  switch (id) {
    case 'sun': {
      const pulse = .65 + .35 * Math.abs(Math.sin(t * 1.3));
      ctx.globalAlpha = pulse; ctx.fillStyle = '#ffcf5a'; ctx.fillRect(-d * .75, -6 * k, d * 1.5, 12 * k); ctx.fillRect(-6 * k, -d * .75, 12 * k, d * 1.5); ctx.globalAlpha = 1;
      orb(ctx, r, k, '#d0602a', rr => { ctx.fillStyle = '#ff8a2a'; ctx.fillRect(-rr, -rr, 2 * rr, 2 * rr); shade(rr, '#c94a16', '#ffc06a'); });
      const c = d * .2; ctx.save(); ctx.clip(steppedPath(c, ROWS)); ctx.fillStyle = '#fff1a8'; ctx.fillRect(-c, -c, 2 * c, 2 * c); shadeInside(ctx, c, 5 * k, '#ffd36a', 0, ''); ctx.restore();
      break;
    }
    case 'venus': orb(ctx, r, k, '#c0927c', rr => { stripes(ctx, rr, [[11 * k, '#f5dcc8'], [6 * k, '#e9c3ad']]); shadeSoft(rr, '#b98a72', '#fff3e8'); }, softPath); break;
    case 'gaia': orb(ctx, r, k, '#2e5cb0', rr => {
      ctx.fillStyle = '#2f6fd0'; ctx.fillRect(-rr, -rr, 2 * rr, 2 * rr);
      // CSS background-position: offset = (box − patch) × percentage.
      const patch = (px: number, py: number, w: number, h: number, c: string) => rect(ctx, r, (d - w * d) * px, (d - h * d) * py, w * d, h * d, c);
      patch(.22, .24, .34, .22, '#78cc4f'); patch(.62, .66, .30, .26, '#78cc4f'); patch(.70, .14, .22, .08, '#ffffff');
      shadeSoft(rr, '#1c4790', '#7fb0ff');
    }, softPath); break;
    case 'moon': { // the Ruby gemstone's notched-square silhouette with the Moon's surface: a dark side and a crater
      const m = r * 1.22;
      orb(ctx, m, k, '#7a58c4', rr => { ctx.fillStyle = '#c6a2ff'; ctx.fillRect(-rr, -rr, 2 * rr, 2 * rr); shadeInside(ctx, rr, 0, '#4a2d8c', 0, '', Math.round(size * .42) * k, 0, cushionPath);
        ctx.globalAlpha = .85; ctx.fillStyle = '#e6d4ff'; ctx.fillRect(Math.round(-rr + rr * 2 * .22), Math.round(-rr + rr * 2 * .2), Math.round(rr * 2 * .16), Math.round(rr * 2 * .12)); ctx.globalAlpha = 1; }, cushionPath);
      rect(ctx, r, d * .18, d * .26, size * .22 * k, size * .22 * k, '#a27ee8'); break;
    }
    case 'jupiter':
      orb(ctx, r, k, '#9a5a30', rr => { stripes(ctx, rr, [[13 * k, '#e0a36a'], [8 * k, '#b9713f'], [7 * k, '#f2cf9a']]); shade(rr, '#7a4322', '#ffe2b8'); });
      rect(ctx, r, d * .56, d * .56, d * .22, d * .13, '#c8452f'); rect(ctx, r, d * .56 + d * .22 - 3 * k, d * .56 + 3 * k, 3 * k, d * .13 - 3 * k, '#8f2b1c'); rect(ctx, r, d * .56 + 3 * k, d * .56 + d * .13 - 3 * k, d * .22 - 3 * k, 3 * k, '#8f2b1c'); break;
    case 'saturn': {
      const ring = (front: boolean) => {
        ctx.save(); ctx.rotate(-14 * Math.PI / 180);
        const w = d * 1.9, h = d * .46, b = Math.max(4, Math.round(size * .09)) * k;
        ctx.beginPath(); ctx.rect(-w, front ? 0 : -h, 2 * w, h); ctx.clip();
        ctx.strokeStyle = front ? '#ddfaff' : '#649fa5'; ctx.lineWidth = b; ctx.strokeRect(-w / 2 + b / 2, -h / 2 + b / 2, w - b, h - b);
        ctx.restore();
      };
      ring(false);
      orb(ctx, r, k, '#4a8f9c', rr => { stripes(ctx, rr, [[11 * k, '#89e7e4'], [6 * k, '#70b9c4']]); shade(rr, '#39778a', '#ecfffc'); });
      ring(true); break;
    }
    case 'neptune':
      orb(ctx, r, k, '#2f55b8', rr => { ctx.fillStyle = '#3f78e8'; ctx.fillRect(-rr, -rr, 2 * rr, 2 * rr); shadeSoft(rr, '#1f3e9a', '#9fc0ff'); }, roundPath);
      rect(ctx, r, d * .30, d * .42, d * .24, d * .14, '#1b2f78'); break;
    case 'sirius': { // the click-star style: solid gold compass bars, a white core in a gold ring, four diagonal sparks
      const pulse = .7 + .3 * Math.abs(Math.sin(t * 1.3)), bar = Math.max(4, Math.round(size * .12)) * k;
      const b = 3 * k, sp = d * .12, ring = d * .42, core = d * .26, sparks = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      ctx.fillStyle = '#d29a2a'; ctx.fillRect(-ring / 2 - b, -ring / 2 - b, ring + 2 * b, ring + 2 * b);
      ctx.globalAlpha = pulse; ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = 5; ctx.fillStyle = '#ffe680';
      ctx.fillRect(-d * .95, -bar / 2, d * 1.9, bar); ctx.fillRect(-bar / 2, -d * .95, bar, d * 1.9); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff3b0'; for (const [dx, dy] of sparks) ctx.fillRect(dx * d * .3 - sp / 2, dy * d * .3 - sp / 2, sp, sp);
      ctx.globalAlpha = 1;
      ctx.shadowColor = '#fff6c8'; ctx.shadowBlur = 6; ctx.fillStyle = '#ffe680'; ctx.fillRect(-ring / 2, -ring / 2, ring, ring); ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff8d2'; ctx.fillRect(-core / 2, -core / 2, core, core); // pale yellow core, white at the top left
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-core / 2, -core / 2, core - d * .12, core - d * .12);
      break;
    }
    case 'binary': { // two rimmed stars, coral and blue, on a dashed link
      const bob = Math.sin(t * 2.4) * 3 * k;
      ctx.save(); ctx.translate(-r + d * .5, -r + d * .47); ctx.rotate(-30 * Math.PI / 180); ctx.setLineDash([4 * k, 4 * k]); ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.moveTo(-d * .28, 0); ctx.lineTo(d * .28, 0); ctx.stroke(); ctx.restore();
      for (const [x, y, sz, rim, fill, dark, light] of [[d * .25, d * .61 + bob, .62, '#c04a36', '#ff8f7a', '#b8452f', '#ffd0c4'], [d * .78, d * .24 - bob, .48, '#3d82c0', '#83cfff', '#3f7fb8', '#d8f1ff']] as const) {
        const rr = d * sz / 2; ctx.save(); ctx.translate(-r + x, -r + y);
        orb(ctx, rr, k, rim, inner => { ctx.fillStyle = fill; ctx.fillRect(-inner, -inner, 2 * inner, 2 * inner); shadeInside(ctx, inner, Math.round(size * sz * .16) * k, dark, 0, light, undefined, undefined, cushionPath);
          ctx.globalAlpha = .85; ctx.fillStyle = light; ctx.fillRect(Math.round(-inner + inner * 2 * .22), Math.round(-inner + inner * 2 * .2), Math.round(inner * 2 * .16), Math.round(inner * 2 * .12)); ctx.globalAlpha = 1; }, cushionPath);
        ctx.restore();
      }
      break;
    }
    case 'singularity': { // a black hole: radiating stepped layers of violet light, a pale photon-ring edge, a black core and bright streaks
      const pulse = .75 + .25 * Math.sin(t * 2);
      for (const [scale, color, a] of [[1.92, '#3a1d6a', .25 * pulse], [1.6, '#4b2888', .36 * pulse], [1.3, '#62399f', .45]] as const) {
        ctx.globalAlpha = a; ctx.fillStyle = color; ctx.fill(softPath(r * scale, ROWS));
      }
      ctx.globalAlpha = 1;
      orb(ctx, r, k, '#e2d4ff', rr => { ctx.fillStyle = '#120c22'; ctx.fillRect(-rr, -rr, 2 * rr, 2 * rr); ctx.save(); ctx.clip(softPath(rr - size * .07 * k, ROWS)); ctx.fillStyle = '#030208'; ctx.fillRect(-rr, -rr, 2 * rr, 2 * rr); ctx.restore(); }, softPath);
      rect(ctx, r, -d * .30, d * .44, size * .14 * k, 3 * k, '#9dff8a'); rect(ctx, r, d * 1.12, d * .30, size * .12 * k, 3 * k, '#c8a8ff');
      rect(ctx, r, d * .40, -d * .30, 3 * k, size * .12 * k, '#c8a8ff'); rect(ctx, r, d * .62, d * 1.16, 3 * k, size * .1 * k, '#9dff8a');
      break;
    }
  }
  ctx.restore();
}
