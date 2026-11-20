import { drawEnemyHealthBar } from './enemy-health-art';
import { drawChamberCountdown } from './warning-art';
import { SUN, TILE_SIZE, T_WALL, TELEPORT_PADS, ENEMY_CONFIGS, CHAMBER_BOUNDS, chamberOfTile } from './constants';
import type { Enemy, GameState } from './engine';
import type { CoolingStation } from './sun';

export { drawFieryKingModel } from './fiery-king-art';

// ALPHA gold, BETA coral, DELTA orange, GAMMA dawn rose; shared by borders, pads and maps.
export const SUN_CHAMBER_COLORS = ['#ffd35c', '#ff727e', '#ff9a45', '#eeb1d6'];

const hash = (x: number, y: number, salt = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
const block = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

// Layered photosphere scenery: broad plasma currents, distant magnetic plumes and open dark space.
export function drawSunBackdrop(ctx: CanvasRenderingContext2D, state: Readonly<Pick<GameState, 'sun'>>, width: number, height: number, camX: number, camY: number, tick: number) {
  const heat = (state.sun?.heat ?? 50) / 100, cold = (state.sun?.quenchedTicks ?? 0) > 0;
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#0c0913'); sky.addColorStop(.6, '#190d19'); sky.addColorStop(1, '#2e1520');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
  // A broad, low horizon glow supplies depth without outlining every patch of the void.
  const horizon = ctx.createLinearGradient(0, height * .4, 0, height);
  horizon.addColorStop(0, 'rgba(166,55,33,0)');
  horizon.addColorStop(1, `rgba(191,67,36,${cold ? .06 : .1 + heat * .09})`);
  ctx.fillStyle = horizon; ctx.fillRect(0, height * .4, width, height * .6);
  // The star's vast limb rises from the lower left: a blazing stepped edge under a
  // streaming corona, irregular convection cells, sunspots and a giant prominence that
  // slowly rises, erupts into a flare and flings plasma outward, then reforms.
  const lx = width * .12 - camX * .012, ly = height * 1.4 - camY * .01, r = height * .9, glow = cold ? .45 : .7 + heat * .5;
  const cycle = (tick % 900) / 900, rim = (th: number, d = 0): [number, number] => [lx + Math.cos(th) * (r + d), ly + Math.sin(th) * (r + d)];
  {
    // Corona rays streaming outward from the limb, flickering in length.
    for (let k = 0; k < 30; k++) {
      const th = -Math.PI * (.08 + k / 30 * .84), len = r * (.12 + hash(k, 50) * .3) * (.8 + .2 * Math.sin(tick * .02 + k * 1.3)), wd = .012 + hash(k, 51) * .02;
      const [ax, ay] = rim(th - wd), [bx, by] = rim(th + wd), [tx, ty] = rim(th, len);
      ctx.globalAlpha = (.04 + hash(k, 52) * .05) * glow; ctx.fillStyle = k % 3 ? '#ff7a40' : '#ffb070';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(tx, ty); ctx.lineTo(bx, by); ctx.closePath(); ctx.fill();
    }
    for (let ring = 4; ring >= 1; ring--) { ctx.globalAlpha = (.035 + heat * .02) * glow; ctx.fillStyle = ring > 2 ? '#c84a2c' : '#ff7a40'; const rr = r + ring * 22; for (let row = -rr; row < 0; row += 8) { const half = Math.sqrt(rr * rr - row * row); ctx.fillRect(lx - half, ly + row, half * 2, 8); } }
    // The disc: dark molten interior brightening toward a blazing rim.
    const body = ctx.createRadialGradient(lx, ly, r * .5, lx, ly, r);
    body.addColorStop(0, '#2a0e14'); body.addColorStop(.75, '#5e2224'); body.addColorStop(.95, '#a8442c'); body.addColorStop(1, '#e0703c');
    ctx.globalAlpha = (.55 + heat * .2) * glow; ctx.fillStyle = body; ctx.beginPath(); ctx.arc(lx, ly, r, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
    for (const [lw, col, al] of [[18, '#ff7a40', .22], [7, '#ffa060', .5], [2, '#fff0cc', .75]] as const) { ctx.globalAlpha = al * glow; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(lx, ly, r, Math.PI, Math.PI * 2); ctx.stroke(); }
    for (let gy = 0; gy < 14; gy++) for (let gx = 0; gx < 20; gx++) {
      const cx = lx - r + gx * 36 + hash(gx, gy + 40) * 22, cy = ly - r + 40 + gy * 28 + hash(gx + 40, gy) * 14, dx = cx - lx, dy = cy - ly;
      if (dx * dx + dy * dy > (r - 24) * (r - 24) || cy > height + 20 || cx > width + 40 || hash(gx, gy + 80) < .35) continue;
      const gw = 8 + hash(gx + 80, gy) * 14, gh = 6 + hash(gx, gy + 120) * 8;
      ctx.globalAlpha = (.035 + .035 * Math.max(0, Math.sin(tick * .015 + gx * 1.7 + gy * 2.3))) * glow; block(ctx, cx, cy, gw, gh, '#ffa060'); block(ctx, cx + 2, cy - 2, gw - 4, gh + 4, '#ffa060');
    }
    const sx = lx + r * .35, sy = ly - r * .78; ctx.globalAlpha = .4 * glow; block(ctx, sx, sy, 22, 16, '#2a0e14'); block(ctx, sx + 34, sy + 10, 12, 10, '#2a0e14');
    ctx.globalAlpha = .14 * glow; block(ctx, sx - 6, sy - 4, 34, 24, '#ffb070');
  }
  {
    // The giant prominence: grows for most of the cycle, then erupts.
    const f1 = -1.28, f2 = -.86, [ax, ay] = rim(f1), [bx, by] = rim(f2), mid = (f1 + f2) / 2;
    const grow = Math.min(1, cycle / .6), erupt = cycle > .6 && cycle < .9 ? (cycle - .6) / .3 : 0, heightNow = r * (.12 + grow * .26), shown = cycle < .6 ? 1 : erupt ? 1 - erupt : 0;
    if (shown > 0) {
      const pts: [number, number][] = [];
      for (let j = 0; j <= 12; j++) { const u = j / 12, th = f1 + (f2 - f1) * u, lift = Math.sin(u * Math.PI) * heightNow * (1 + erupt * 1.6) + Math.sin(tick * .05 + j) * 4; pts.push(rim(th, lift)); }
      for (const [lw, col, al] of [[22, '#c84a2c', .22], [11, '#ff7a40', .4], [3, '#ffe2b0', .55]] as const) {
        ctx.beginPath(); pts.forEach(([px, py], j) => j ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
        ctx.lineJoin = 'bevel'; ctx.globalAlpha = al * shown * glow; ctx.strokeStyle = col; ctx.lineWidth = lw * (1 - erupt * .5); ctx.stroke();
      }
      for (let k = 0; k < 6; k++) { const u = ((tick * .004 + k / 6) % 1), p = pts[Math.min(12, Math.floor(u * 12))]; ctx.globalAlpha = .6 * shown * glow; block(ctx, p[0] - 3, p[1] - 3, 6, 6, '#fff0cc'); }
    }
    if (erupt > 0) {
      // Coronal mass ejection: an expanding broken shell of plasma blocks flung outward.
      const [cx, cy] = rim(mid, heightNow * 1.4 + erupt * r * .9);
      for (let k = 0; k < 24; k++) { const sp = (k / 23 - .5) * 1.8, d = erupt * r * .5 * (.85 + hash(k, 70) * .3), px = cx + Math.cos(mid + sp) * d, py = cy + Math.sin(mid + sp) * d; ctx.globalAlpha = (1 - erupt) * .6 * glow; block(ctx, px - 7, py - 4, 14 - k % 3 * 3, 8, k % 2 ? '#ffb070' : '#ff7a40'); ctx.globalAlpha *= .3; block(ctx, px - 14, py - 9, 28, 18, '#ff7a40'); }
      // Flare: a bright burst at the footpoints and a brief warm wash over the sky.
      const flash = Math.max(0, 1 - erupt * 5);
      if (flash > 0) {
        ctx.globalAlpha = flash * (cold ? .05 : .12); ctx.fillStyle = '#ffb070'; ctx.fillRect(0, 0, width, height);
        for (const [fx, fy] of [[ax, ay], [bx, by]]) { ctx.globalAlpha = flash * .7 * glow; block(ctx, fx - 18, fy - 10, 36, 20, '#ffe2b0'); ctx.globalAlpha = flash * .25 * glow; block(ctx, fx - 50, fy - 26, 100, 52, '#ff9a5c'); }
      }
    }
  }
  // Solar wind: faint streaks race outward from the star across the sky.
  for (let k = 0; k < 22; k++) {
    const th = -Math.PI * (.1 + hash(k, 60) * .8), t = ((tick * (.003 + hash(k, 61) * .003) + hash(k, 62)) % 1), d = r * 1.05 + t * r * 1.4;
    const [px, py] = rim(th, d - r), ex = Math.cos(th) * 28, ey = Math.sin(th) * 28;
    ctx.globalAlpha = Math.sin(t * Math.PI) * (cold ? .06 : .12 + heat * .08); ctx.strokeStyle = '#ffc890'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + ex, py + ey); ctx.stroke();
  }
  // Small prominence loops lift off the limb, with plasma beads tracing them.
  for (let p = 0; p < 2; p++) {
    const px = width * (.18 + p * .2) - camX * .012, base = height * (.58 + p * .12) - camY * .01, pr = 46 + p * 22, lift = 1 + Math.sin(tick * .006 + p * 2) * .12;
    ctx.beginPath(); for (let j = 0; j <= 8; j++) { const a = j / 8 * Math.PI; const qx = px - Math.cos(a) * pr, qy = base - Math.sin(a) * pr * 1.3 * lift; if (j === 0) ctx.moveTo(qx, qy); else ctx.lineTo(qx, qy); }
    ctx.lineJoin = 'bevel'; ctx.globalAlpha = cold ? .05 : .09 + heat * .07; ctx.strokeStyle = '#f07a48'; ctx.lineWidth = 7; ctx.stroke();
    ctx.globalAlpha *= .9; ctx.strokeStyle = '#ffd09a'; ctx.lineWidth = 1.5; ctx.stroke();
    const t = ((tick * .006 + p * .5) % 1), a = t * Math.PI; ctx.globalAlpha = cold ? .15 : .35 + heat * .3; block(ctx, px - Math.cos(a) * pr - 2, base - Math.sin(a) * pr * 1.3 * lift - 2, 5, 5, '#ffe2b0');
  }
  // Three broad plasma rivers provide readable landmarks, rather than a field of small outlines.
  // Their slow drift sits behind the faster foreground cinders and the station's solid silhouette.
  for (let river = 0; river < 3; river++) {
    const base = height * [.23, .65, .94][river] - camY * .035 % 75;
    const drift = camX * .06 + tick * (.06 + river * .015);
    const flowY = (px: number) => base + Math.sin((px + drift) / 230 + river * 2) * 38
      + Math.sin((px + drift) / 510 - river) * 24;
    const points = Array.from({ length: 19 }, (_, j) => {
      const px = -90 + j * (width + 180) / 18;
      return [px, flowY(px)] as const;
    });
    for (const [thickness, color, opacity] of [[46, '#793934', .24], [20, '#bd5a3c', .18], [3, '#f3b177', .2]] as const) {
      ctx.beginPath();
      for (let j = 0; j < points.length; j++) {
        const [px, py] = points[j];
        if (j === 0) ctx.moveTo(px, py - thickness / 2); else ctx.lineTo(px, py - thickness / 2);
      }
      for (let j = points.length - 1; j >= 0; j--) ctx.lineTo(points[j][0], points[j][1] + thickness / 2);
      ctx.closePath(); ctx.globalAlpha = opacity * (cold ? .55 : .7 + heat * .6);
      ctx.fillStyle = color; ctx.fill();
    }
    // A few separated glints move with each current, giving it direction without particle clutter.
    for (let j = 0; j < 3; j++) {
      const span = width + 200, px = ((j * 379 + river * 143 + tick * .17 - camX * .08) % span + span) % span - 100;
      const py = flowY(px);
      ctx.globalAlpha = cold ? .1 : .2 + heat * .12;
      block(ctx, px, py - 2, 18 + j * 8, 2, '#ffd5a1');
      ctx.globalAlpha *= .55; block(ctx, px - 10, py + 7, 9, 2, '#ee8a61');
    }
  }
  // Widely spaced magnetic plumes in the distance: stepped silhouettes with a thin lit edge.
  // Their scale and different parallax add depth, like Neptune's reefs and Moon's cavern spires.
  for (let i = 0; i < 5; i++) {
    const span = width + 400;
    const px = ((i * 331 + 60 - camX * .025) % span + span) % span - 160;
    const base = height * (.38 + hash(i, 8) * .45) - camY * .02 % 50;
    const h = 70 + hash(i, 9) * 140;
    ctx.globalAlpha = .3;
    block(ctx, px - 24, base - h * .35, 62, h * .35, '#432331');
    block(ctx, px - 12, base - h * .7, 35, h * .35, '#432331');
    block(ctx, px, base - h, 16, h * .3, '#432331');
    ctx.globalAlpha = cold ? .06 : .1 + heat * .09;
    block(ctx, px, base - h, 3, h * .3, '#e79b66');
    block(ctx, px - 12, base - h * .7, 3, h * .35, '#cd764f');
  }
  // Broad, widely separated solar-cloud silhouettes, like the other worlds' distant scenery.
  // They add a little material and parallax while leaving most of the void open.
  for (let i = 0; i < 3; i++) {
    const span = width + 650, par = .025 + i * .012;
    const cx = ((width * (.37 + i * .31) - camX * par + tick * .018 * (i % 2 ? -1 : 1)) % span + span) % span - 120;
    const cy = height * [.16, .67, .38][i] - camY * par % 80;
    const w = 240 + hash(i, 6) * 160;
    ctx.globalAlpha = cold ? .045 : .065 + heat * .055;
    block(ctx, cx, cy, w, 46, '#ad5b50');
    block(ctx, cx + 45, cy - 18, w - 100, 18, '#ad5b50');
    block(ctx, cx + 70, cy + 46, w - 130, 14, '#ad5b50');
    ctx.globalAlpha *= .5;
    block(ctx, cx + 22, cy + 20, w - 20, 2, '#ffd69f');
  }
  // One distant angular arc, subdued like the forest silhouettes and cavern spires.
  const x = width * .73 - camX * .025, base = height * 1.12 - camY * .02 % 50;
  const radius = Math.min(width * .32, 350), rise = height * (.29 + Math.sin(tick * .002) * .01);
  ctx.beginPath();
  for (let j = 0; j <= 12; j++) {
    const a = j / 12 * Math.PI, px = x - Math.cos(a) * radius, py = base - Math.sin(a) * rise;
    if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.lineJoin = 'bevel';
  ctx.globalAlpha = cold ? .04 : .06 + heat * .05;
  ctx.strokeStyle = '#e77d4f'; ctx.lineWidth = 9; ctx.stroke();
  ctx.globalAlpha *= .8; ctx.strokeStyle = '#ffd09a'; ctx.lineWidth = 2; ctx.stroke();
  for (let b = 0; b < 3; b++) { // plasma beads travel along the great arc
    const t = ((tick * .0025 + b / 3) % 1), a = t * Math.PI;
    ctx.globalAlpha = cold ? .12 : .25 + heat * .25; block(ctx, x - Math.cos(a) * radius - 3, base - Math.sin(a) * rise - 3, 6, 6, '#ffe2b0');
  }
  // Small, separated embers in world space; no repeated cells, outlines or foreground shelf.
  for (let i = 0; i < 14; i++) {
    const span = width + 80, spanY = height + 80;
    const px = ((hash(i, 1) * span - camX * .08 + Math.sin(tick * .004 + i) * 9) % span + span) % span - 40;
    const py = ((hash(i, 2) * spanY - camY * .06 - tick * (.06 + i % 3 * .025)) % spanY + spanY) % spanY - 40;
    ctx.globalAlpha = .08 + heat * .09;
    block(ctx, px, py, 2, i % 4 === 0 ? 4 : 2, '#e9b17b');
    if (i % 5 === 0) {
      ctx.globalAlpha *= .6;
      block(ctx, px + 12, py - 7, 2, 2, '#f5a16e');
      block(ctx, px - 9, py + 13, 1, 2, '#f5a16e');
    }
  }
  ctx.restore();
}

// Readable dark heat shields over a molten substrate. Seams are scenery, never damage tiles.
export function drawSunFloorTile(ctx: CanvasRenderingContext2D, state: Readonly<Pick<GameState, 'sun'>>, tx: number, ty: number, x: number, y: number, tick: number) {
  const s = TILE_SIZE, n = hash(tx, ty), heat = (state.sun?.heat ?? 50) / 100;
  ctx.save();
  block(ctx, x, y, s, s, '#100d16');
  block(ctx, x + 2, y + 2, s - 4, s - 4, n > .65 ? '#201923' : n > .3 ? '#1a1620' : '#18141d');
  block(ctx, x + 3, y + 3, s - 6, 1, '#35252e');
  block(ctx, x + 3, y + 4, 1, s - 8, '#2d212d');
  // Joined molten faults run through selected plate seams, with a slow travelling light.
  const faultX = tx % 7 === 2 || hash(Math.floor(tx / 2), ty, 11) > .84;
  const faultY = ty % 9 === 5 || hash(tx, Math.floor(ty / 2), 12) > .88;
  const glow = .18 + heat * .38 + Math.sin(tick * .025 - (tx + ty) * .65) * .08;
  ctx.globalAlpha = glow;
  if (faultX) { block(ctx, x, y, 2, s, '#ff964f'); block(ctx, x + 2, y + 7, 5, 2, '#f47440'); }
  if (faultY) { block(ctx, x, y, s, 2, '#e78448'); block(ctx, x + 28, y + 2, 2, 6, '#ffba6a'); }
  ctx.globalAlpha = 1;
  if (n > .72) {
    // Riveted reinforced plates; quiet enough to leave combat silhouettes clear.
    block(ctx, x + 7, y + 8, 2, 2, '#635047'); block(ctx, x + s - 9, y + s - 10, 2, 2, '#42343a');
    block(ctx, x + 14, y + s - 8, 17, 1, '#33242c');
  } else if (n < .12) {
    ctx.globalAlpha = .22;
    ctx.strokeStyle = '#b48b5b'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 17, y + 17, 14, 14);
    block(ctx, x + 23, y + 20, 2, 8, '#c99b62'); ctx.globalAlpha = 1;
  }
  // Ceremonial sun-wheel inlaid around each teleport pad, clipped naturally by floor tiles.
  const room = chamberOfTile(tx, ty), pad = room >= 0 ? TELEPORT_PADS[room] : undefined;
  if (pad) {
    const dx = tx - pad[0], dy = ty - pad[1], ring = Math.max(Math.abs(dx), Math.abs(dy));
    if (ring === 2 && (Math.abs(dx) === 2 || Math.abs(dy) === 2)) {
      ctx.globalAlpha = .25;
      const color = SUN_CHAMBER_COLORS[room];
      if (Math.abs(dx) === 2) block(ctx, x + (dx < 0 ? 37 : 9), y, 2, s, color);
      if (Math.abs(dy) === 2) block(ctx, x, y + (dy < 0 ? 37 : 9), s, 2, color);
    }
    if ((dx === 0 || dy === 0) && ring === 3) {
      ctx.globalAlpha = .32;
      block(ctx, x + 19, y + 19, 10, 10, SUN_CHAMBER_COLORS[room]);
      block(ctx, x + 22, y + 22, 4, 4, '#17131e');
    }
  }
  ctx.restore();
}

export function drawSunCover(ctx: CanvasRenderingContext2D, state: Readonly<Pick<GameState, 'sun' | 'map'>>, tx: number, ty: number, x: number, y: number, tick: number) {
  const s = TILE_SIZE, n = hash(tx, ty), heat = (state.sun?.heat ?? 50) / 100;
  const wall = (dx: number, dy: number) => state.map[ty + dy]?.[tx + dx] === T_WALL;
  ctx.save();
  block(ctx, x, y, s, s, '#15121c');
  block(ctx, x + 3, y + 3, s - 6, s - 6, n > .5 ? '#39303b' : '#302934');
  block(ctx, x + 6, y + 7, s - 12, s - 15, '#241f2c');
  block(ctx, x + 7, y + 8, s - 14, 2, '#615047');
  // Gold caps join into fortifications; no glow on the whole body.
  if (!wall(0, -1)) {
    block(ctx, x + 1, y, s - 2, 5, '#9e7145'); block(ctx, x + 4, y, s - 8, 2, '#edc080');
    block(ctx, x + 7, y + 5, s - 14, 3, '#513c36');
  }
  if (!wall(-1, 0)) { block(ctx, x, y + 3, 4, s - 3, '#967345'); block(ctx, x, y + 4, 1, s - 8, '#e1b57b'); }
  if (!wall(1, 0)) block(ctx, x + s - 4, y + 4, 4, s - 4, '#4d3636');
  if (!wall(0, 1)) {
    block(ctx, x + 2, y + s - 7, s - 4, 7, '#110e18');
    block(ctx, x + 7, y + s - 5, s - 14, 2, '#a46038');
  }
  // An inset solar seal or exposed molten core gives each block a physical material.
  if (n > .52) {
    ctx.fillStyle = '#906a48'; ctx.fillRect(x + 17, y + 17, 14, 14);
    block(ctx, x + 20, y + 20, 8, 8, '#251b28'); block(ctx, x + 23, y + 14, 2, 20, '#bd925f');
    block(ctx, x + 14, y + 23, 20, 2, '#bd925f');
  } else {
    block(ctx, x + 19, y + 12, 10, 24, '#120e18');
    const flicker = .45 + heat * .3 + Math.sin(tick * .04 + tx * 2 + ty) * .1;
    ctx.globalAlpha = flicker;
    block(ctx, x + 22, y + 14, 4, 20, '#fa8646'); block(ctx, x + 23, y + 17, 2, 11, '#ffe5ad');
    ctx.globalAlpha = 1;
    block(ctx, x + 15, y + 18, 18, 3, '#4e3b3b'); block(ctx, x + 15, y + 29, 18, 3, '#4e3b3b');
  }
  ctx.restore();
}

export function drawSunPad(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, room: number) {
  const s = TILE_SIZE, color = SUN_CHAMBER_COLORS[Math.max(0, room)];
  ctx.save();
  block(ctx, x + 2, y + 2, s - 4, s - 4, '#403040');
  block(ctx, x + 6, y + 6, s - 12, s - 12, '#110f1b');
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.shadowColor = color; ctx.shadowBlur = 4;
  ctx.strokeRect(x + 7, y + 7, s - 14, s - 14); ctx.shadowBlur = 0;
  block(ctx, x + 18, y + 18, 12, 12, color); block(ctx, x + 21, y + 21, 6, 6, '#ffefd0');
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.translate(x + s / 2, y + s / 2); ctx.rotate(i * Math.PI / 2);
    ctx.globalAlpha = .45 + .4 * Math.sin(tick * .04 - i * 1.57);
    block(ctx, -2, -19, 4, 6, color); ctx.restore();
  }
  ctx.restore();
}

export function drawFlareSpitter(ctx:CanvasRenderingContext2D,e:Enemy,x:number,y:number,tick:number) {
  const p=e.spit?1-e.spit.ticks/SUN.spitter.warningTicks:0,cold=!!e.doused; // doused by water: its flame armor is gone
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;
  const part=(color:string,bx:number,by:number,w:number,h:number)=>{ctx.fillStyle=e.flashTicks>0?'#fff2d2':color;ctx.fillRect(Math.round(bx),Math.round(by),Math.round(w),Math.round(h));};
  part('#78614a',-15,-28,7,13);part('#78614a',8,-28,7,13);
  part('#272127',-19,-17,38,34);part(cold?'#79b8c9':'#b47b3b',-20,-15,40,30);part('#302329',-16,-13,32,27);
  part(cold?'#b5eff5':'#ffd390',-12,-10,7,4);part(cold?'#b5eff5':'#ffd390',5,-10,7,4);
  const mw=20+p*8,mh=10+p*8;part('#130e18',-mw/2,0,mw,mh);
  ctx.shadowColor=cold?'#8edbea':'#ff913f';ctx.shadowBlur=e.spit?4:0;
  part(cold?'#668a9d':'#e25f2c',-mw/2+2,2,mw-4,mh-4);part(cold?'#addef1':p>.65?'#fff4bd':'#ffb957',-mw*.3,4,mw*.6,Math.max(3,mh-7));ctx.shadowBlur=0;
  part('#635044',-16,17,11,4);part('#635044',5,17,11,4);
  if(e.spit){
    for(const side of [-1,1]){part('#ffb957',side<0?-15:8,-32-p*8,7,5+p*8);part('#fff0b0',side<0?-13:10,-32-p*8,3,4);}
    const base=Math.atan2(e.spit.dy,e.spit.dx);
    for(const offset of [-SUN.spitter.spread,0,SUN.spitter.spread]){const angle=base+offset;for(let k=0;k<2;k++){const d=30+k*15;ctx.globalAlpha=(.35+p*.55)*(1-k*.3);ctx.save();ctx.translate(Math.cos(angle)*d,Math.sin(angle)*d);ctx.rotate(angle);part(p>.8?'#fff0b0':'#ef8b39',-4,-2,8,4);ctx.restore();}}
  }
  ctx.restore();
}

export function drawSpitterHit(ctx:CanvasRenderingContext2D,x:number,y:number,ticks:number) {
  const p=1-ticks/24,fade=1-p;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;
  if(p<.25){ctx.globalAlpha=(1-p/.25)*.7;ctx.fillStyle='#fff0ac';ctx.fillRect(-9,-9,18,18);}
  ctx.globalAlpha=fade*.8;ctx.strokeStyle='#f38132';ctx.lineWidth=4*fade+1;const r=14+p*24;ctx.strokeRect(-r,-r,r*2,r*2);
  for(let k=0;k<8;k++){
    const a=k*Math.PI/4,d=14+p*35,s=(k%2?5:8)*fade;ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d-p*p*15);ctx.rotate(a);
    ctx.globalAlpha=fade;ctx.fillStyle=k%2?'#df5629':'#ffbb59';ctx.fillRect(-s/2,-s,s,s*2);ctx.fillStyle='#fff0b0';ctx.fillRect(-s/4,-s*.4,s/2,s*.8);ctx.restore();
  }
  ctx.restore();
}

export function drawFlareFireball(ctx:CanvasRenderingContext2D,x:number,y:number,dx:number,dy:number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(Math.atan2(dy,dx));ctx.scale(1.5,1.5);
  for(let k=2;k>0;k--){ctx.globalAlpha=.4/k;ctx.fillStyle='#dd5828';ctx.fillRect(-10-k*9,-4,8,8);}
  ctx.globalAlpha=1;ctx.fillStyle='#b94426';ctx.fillRect(-9,-7,17,14);ctx.fillStyle='#ff9b3c';ctx.fillRect(-6,-5,14,10);ctx.fillStyle='#fff0ac';ctx.fillRect(0,-3,6,6);ctx.restore();
}

export function drawSunUnit(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, tick: number): boolean {
  if(e.type==='flare_spitter'){drawFlareSpitter(ctx,e,x,y,tick);drawEnemyHealthBar(ctx,e,x,y);return true;}
  if (e.type === 'scorch_sapper') { drawScorchSapper(ctx, e, x, y, tick); drawEnemyHealthBar(ctx,e,x,y); return true; }
  if (e.type !== 'cinder_wisp' && e.type !== 'emberling') return false;
  const cold = !!e.extinguished, wisp = e.type === 'cinder_wisp';
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  const pulse = Math.round(Math.sin(tick * .12 + e.id) * 2);
  ctx.shadowColor = cold ? '#93bac4' : '#ff9c42'; ctx.shadowBlur = cold ? 0 : 5;
  ctx.fillStyle = e.flashTicks > 0 ? '#ffffff' : cold ? '#7e8e96' : wisp ? '#ffb34f' : '#ff6843';
  if (wisp) {
    ctx.fillRect(-11, -9, 22, 21); ctx.fillRect(-7, -16 - (cold ? 0 : pulse), 14, 9);
    ctx.shadowBlur = 0; ctx.fillStyle = cold ? '#283b49' : '#792a21'; ctx.fillRect(-7, -5, 14, 13);
    ctx.fillStyle = cold ? '#c2e9ef' : '#fff4be';
    ctx.fillRect(-3, -9, 6, 12); ctx.fillRect(-6, -3, 12, 5);
    if (!cold) {
      ctx.fillStyle = '#ffce79';
      for (let i = 0; i < 3; i++) { const age = (tick * .8 + e.id * 11 + i * 14) % 42; ctx.globalAlpha = 1 - age / 42; ctx.fillRect((i - 1) * 8, -14 - age, 3, 6); }
    } else { ctx.fillStyle = '#a9d6e0'; ctx.fillRect(-12, 13, 24, 2); }
  } else {
    // Emberling: larger, armored heavy silhouette
    ctx.fillRect(-15, -12, 30, 27); ctx.fillRect(-10, -21 - (cold ? 0 : pulse), 20, 11);
    ctx.shadowBlur = 0; ctx.fillStyle = cold ? '#283b49' : '#792a21'; ctx.fillRect(-10, -7, 20, 18);
    ctx.fillStyle = cold ? '#c2e9ef' : '#fff4be';
    ctx.fillRect(-9, -4, 6, 4); ctx.fillRect(3, -4, 6, 4);
    if (!cold) {
      ctx.fillStyle = '#ffce79';
      for (let i = 0; i < 3; i++) { const age = (tick * 1.3 + e.id * 11 + i * 14) % 42; ctx.globalAlpha = 1 - age / 42; ctx.fillRect((i - 1) * 11, -19 - age, 4, 7); }
      ctx.globalAlpha = .75; ctx.strokeStyle = '#ffc66d'; ctx.lineWidth = 2.5; ctx.strokeRect(-20, -18, 40, 38);
    } else { ctx.fillStyle = '#a9d6e0'; ctx.fillRect(-16, 16, 32, 3); }
  }
  ctx.restore(); drawEnemyHealthBar(ctx,e,x,y); return true;
}

// The same King's square armor, shoulders, crown and four eyes, cooled to an inert brown husk.
// No aura, flames, orbiting accents, particles or animated glow in this state.
export function drawQuenchedKing(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number) {
  const size = Math.floor(TILE_SIZE * ENEMY_CONFIGS.fiery_king.bodyFraction), h = size / 2;
  const pad = Math.max(3, Math.floor(size * .1)), spike = Math.floor(size * .18);
  const flash = e.flashTicks > 0;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.shadowBlur = 0;
  block(ctx, -h - spike, -h * .2, spike, size * .3, '#8c7865');
  block(ctx, h, -h * .2, spike, size * .3, '#8c7865');
  block(ctx, -h, -h, size, size, flash ? '#e8ddcc' : '#b49b80');
  block(ctx, -h + pad, -h + pad, size - pad * 2, size - pad * 2, '#72604e');
  block(ctx, -h + pad, -2, size - pad * 2, 4, '#95816b');
  block(ctx, -2, -h + pad, 4, size - pad * 2, '#95816b');
  const crown = Math.floor(size * .22), segment = Math.floor(size / 5);
  for (let i = 0; i < 5; i++) {
    const tall = i % 2 ? Math.floor(crown * .55) : crown;
    block(ctx, -h + i * segment, -h - tall, segment - 1, tall, '#cdbb9d');
  }
  block(ctx, -2, -h - crown - 3, 4, 4, '#a5947c');
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) block(ctx, dx * (h - pad - 4) - 2, dy * (h - pad - 4) - 2, 4, 4, '#d2c0a4');
  const eye = Math.max(3, Math.floor(size * .16)), pupil = Math.max(2, Math.floor(eye * .6));
  const left = -h + pad + 2, right = h - pad - eye - 2, top = -h + pad + 2;
  for (const ex of [left, right]) for (const ey of [top, top + eye + 3]) {
    block(ctx, ex, ey, eye, eye, '#ddd4c1'); block(ctx, ex + 1, ey + 2, pupil, Math.max(2, pupil - 2), '#695c4e');
  }
  const mouthW = Math.floor(size * .7), mouthY = top + eye * 2 + 6;
  block(ctx, -mouthW / 2, mouthY, mouthW, Math.floor(size * .1), '#51483f');
  for (let i = 0; i < 5; i++) block(ctx, -mouthW / 2 + i * mouthW / 6 + 1, mouthY - 3, 4, 5, '#c8bba5');
  ctx.restore();
}

export function drawCoolingStation(ctx: CanvasRenderingContext2D, station: CoolingStation, x: number, y: number, tick: number, nearby = false) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  const color = station.blocked ? '#ff7956' : '#81eaf5', fill = Math.max(0, Math.min(1, station.charge / 100));
  // A glass coolant reservoir on four brass clamps, distinct from health pickups.
  block(ctx, -24, -24, 48, 48, '#101823');
  block(ctx, -18, -21, 36, 42, '#306371');
  block(ctx, -14, -17, 28, 34, '#102f44');
  ctx.shadowColor = color; ctx.shadowBlur = nearby ? 6 : 3;
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(-17, -20, 34, 40); ctx.shadowBlur = 0;
  const water = Math.round(9 + fill * 20);
  block(ctx, -13, 16 - water, 26, water, station.blocked ? '#a64b43' : '#267ca0');
  block(ctx, -13, 16 - water, 26, 2, color);
  block(ctx, -10, -14, 3, 24, '#a5efff');
  ctx.globalAlpha = .45; block(ctx, -6, -14, 2, 13, '#a5efff'); ctx.globalAlpha = 1;
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) {
    block(ctx, dx < 0 ? -25 : 17, dy < 0 ? -24 : 16, 8, 8, '#a48560');
    block(ctx, dx < 0 ? -23 : 19, dy < 0 ? -23 : 17, 4, 2, '#f4d1a0');
  }
  for (let i = 0; i < 3; i++) {
    const rise = (tick * .35 + i * 11 + station.id * 7) % water;
    ctx.globalAlpha = .65; block(ctx, -6 + i * 5, 14 - rise, 2, 2, color);
  }
  ctx.globalAlpha = 1;
  block(ctx, -22, 28, 44, 5, '#101c2a'); block(ctx, -22, 28, 44 * fill, 5, color);
  for (let i = 1; i < 4; i++) block(ctx, -22 + 11 * i, 28, 1, 5, '#172c3a');
  if (station.blocked && !station.sapped) { // a Sapper's drain shows only through the blinking station and spark line
    ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color;
    ctx.fillText('KING NEARBY', 0, -33);
  }
  ctx.restore();
}

// One tile of the King's phase 2+ burning trail (also used by the rule sheet).
export function drawBurningTile(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, fade: number, bx = 0, by = 0) {
  const s = TILE_SIZE, b = { x: bx, y: by };
  ctx.save();
  ctx.globalAlpha = .55 * fade; block(ctx, x + 2, y + 2, s - 4, s - 4, '#5a1a10');
  ctx.globalAlpha = (.35 + .15 * Math.sin(tick * .2 + b.x + b.y)) * fade; block(ctx, x + 6, y + 6, s - 12, s - 12, '#ff6a2a');
  for (let k = 0; k < 3; k++) { // stepped tapering flames: wide base, narrower body, pale tip, each flickering
    const h = 9 + Math.round((Math.sin(tick * .25 + k * 2.1 + b.x * 1.3) + 1) * 4), cx = x + 12 + k * 12, base = y + s - 9;
    const sway = Math.round(Math.sin(tick * .18 + k + b.y) * 1.5), step = Math.max(3, Math.round(h / 3));
    ctx.globalAlpha = .9 * fade;
    block(ctx, cx - 4, base - step, 8, step, '#ff6a2a');
    block(ctx, cx - 3 + sway, base - step * 2, 6, step, '#ff8a3a');
    block(ctx, cx - 1 + sway, base - h, 3, h - step * 2, '#ffd36a');
  }
  ctx.globalAlpha = .6 * fade; ctx.strokeStyle = '#ff9b4a'; ctx.lineWidth = 2; ctx.strokeRect(x + 3, y + 3, s - 6, s - 6);
  ctx.restore();
}

// Scorch Sapper: not a flame but a dark armoured siphon beetle that steals coolant. A basalt shell with thin molten
// seams and a lighter top plate, two small ember eyes, a brass siphon nozzle on the side it faces, six stepping legs,
// and a glass tank on its back holding stolen cyan coolant that sloshes, and fills and glows while it drains a
// station (with little puffs of steam).
function drawScorchSapper(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, tick: number) {
  const flash = e.flashTicks > 0, draining = e.sapStation !== undefined;
  const face = draining ? (e.chargeDirX || 1) : e.targetTileX !== e.tileX ? Math.sign(e.targetTileX - e.tileX) : (e.id % 2 ? 1 : -1), step = Math.floor(tick / 6 + e.id) % 2;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  for (let k = -1; k <= 1; k++) { // legs
    const lift = (k + 1 + step) % 2 ? 2 : 0;
    block(ctx, -15, k * 6 + 2 - lift, 4, 2, '#3a2a26'); block(ctx, 11, k * 6 + 2 - (2 - lift), 4, 2, '#3a2a26');
  }
  block(ctx, -13, -7, 26, 20, flash ? '#ffffff' : '#a8723e');                           // bronze outline so it reads on the dark floor
  block(ctx, -11, -5, 22, 16, flash ? '#ffffff' : '#3e2c28');                           // shell
  if (!flash) {
    block(ctx, -11, -5, 22, 4, '#5c4238');                                               // lighter top plate
    block(ctx, -6, 4, 12, 2, '#ff7a2a'); block(ctx, 2, 0, 2, 8, '#ff7a2a');              // molten seams
    block(ctx, face > 0 ? 6 : -10, 0, 4, 3, '#ffb347');                                   // ember eye
    block(ctx, face > 0 ? 12 : -18, 2, 6, 4, '#b9893f');                                  // brass siphon nozzle
    block(ctx, face > 0 ? 17 : -19, 1, 2, 6, '#e0b860');
    // Glass tank of stolen coolant on its back.
    const level = draining ? 6 + Math.round(Math.sin(tick * .2) * 1) : 3 + Math.round(Math.sin(tick * .12 + e.id));
    block(ctx, -7, -17, 14, 12, '#16232a'); ctx.strokeStyle = '#9fdcea'; ctx.lineWidth = 2; ctx.strokeRect(-7, -17, 14, 12);
    ctx.shadowColor = '#6bd9ea'; ctx.shadowBlur = draining ? 8 : 0;
    block(ctx, -5, -6 - level, 10, level, '#58d4ea'); ctx.shadowBlur = 0;
    block(ctx, -5, -6 - level, 10, 1, '#d8fbff');
    if (draining) for (let k = 0; k < 2; k++) { // steam puffs
      const age = (tick * .6 + k * 20 + e.id * 7) % 40;
      ctx.globalAlpha = .5 * (1 - age / 40); block(ctx, -2 + k * 5, -22 - age * .5, 4, 4, '#c9d2d6');
    }
  }
  ctx.restore();
}

// Shared solar hazard identity, used by the battlefield, minimap and rule sheet.
export function drawSunburstEmblem(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(size / 32, size / 32);
  block(ctx, -7, -7, 14, 14, '#ffe778'); block(ctx, -4, -4, 8, 8, '#fff9d5');
  for (let i = 0; i < 8; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 4); block(ctx, -2, -16, 4, 6, '#ffe778'); ctx.restore();
  }
  ctx.restore();
}

export function drawSunburstWarning(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ticks: number, tick: number, compact = false) {
  const remaining = Math.max(0, Math.min(1, ticks / SUN.flareWarning));
  const pulse = .5 + .5 * Math.sin(tick * (remaining < .35 ? .18 : .07));
  ctx.save();
  ctx.globalAlpha = .045 + pulse * .035; block(ctx, x, y, w, h, '#ffe778');
  ctx.globalAlpha = 1; ctx.strokeStyle = '#ffe778'; ctx.lineWidth = compact ? 2 : 4;
  const inset = compact ? 3 : 10, arm = Math.min(w, h) * .16;
  for (const sx of [0, 1]) for (const sy of [0, 1]) {
    const cx = x + (sx ? w - inset : inset), cy = y + (sy ? h - inset : inset);
    ctx.beginPath(); ctx.moveTo(cx + (sx ? -arm : arm), cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + (sy ? -arm : arm)); ctx.stroke();
  }
  drawChamberCountdown(ctx,x+w/2,y+h*.3,'SUNBURST',ticks,'#ffe778',compact);
  ctx.restore();
}

export function drawSunGround(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tick: number) {
  const sun = state.sun; if (!sun) return;
  ctx.save();
  // Scorch Sappers draining a station: a crackling orange spark line from the imp to the reservoir.
  for (const e of state.enemies) {
    if (e.type !== 'scorch_sapper' || e.sapStation === undefined) continue;
    const station = sun.stations.find(s => s.id === e.sapStation); if (!station) continue;
    const ax = e.x - camX, ay = e.y - camY, bx = (station.x + .5) * TILE_SIZE - camX, by = (station.y + .5) * TILE_SIZE - camY;
    ctx.globalAlpha = .75 + .25 * Math.sin(tick * .5); ctx.shadowColor = '#6bd9ea'; ctx.shadowBlur = 8; ctx.strokeStyle = '#9fe8f5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); // coolant being siphoned off
    for (let k = 1; k < 4; k++) ctx.lineTo(ax + (bx - ax) * k / 4 + (k % 2 ? 4 : -4) * Math.sin(tick * .4 + k), ay + (by - ay) * k / 4);
    ctx.lineTo(bx, by); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.globalAlpha = 1; block(ctx, bx - 3, by - 3, 6, 6, '#ffe08a');
  }
  ctx.globalAlpha = 1;
  // Phase 2+ burning trail: a glowing ember plate with three flickering stepped flames, fading over its last second.
  // Phase 3 sunburst: the marked room pulses gold with a countdown; when it goes off it flashes orange (cyan if defused).
  const roomRect = (room: number) => { const [r1, c1, r2, c2] = CHAMBER_BOUNDS[room]; return [c1 * TILE_SIZE - camX, r1 * TILE_SIZE - camY, (c2 - c1 + 1) * TILE_SIZE, (r2 - r1 + 1) * TILE_SIZE] as const; };
  if (sun.flare) {
    const [x, y, w, h] = roomRect(sun.flare.room);
    drawSunburstWarning(ctx, x, y, w, h, sun.flare.ticks, tick);
  }
  if (sun.flareFlash?.defused) {
    const [x, y, w, h] = roomRect(sun.flareFlash.room), k = sun.flareFlash.ticks / 45;
    ctx.globalAlpha = .5 * k; block(ctx, x, y, w, h, sun.flareFlash.defused ? '#a5efff' : '#ff8a3a');
  }
  ctx.globalAlpha = 1;
  for (const b of sun.burning) drawBurningTile(ctx, b.x * TILE_SIZE - camX, b.y * TILE_SIZE - camY, tick, Math.min(1, b.ticks / 60), b.x, b.y);
  ctx.globalAlpha = 1;
  for (const station of sun.stations) {
    const x = (station.x + .5) * TILE_SIZE - camX, y = (station.y + .5) * TILE_SIZE - camY;
    // Small cyan guide lights mark the reservoir; no false water/hazard field.
    ctx.globalAlpha = .28 + station.charge / 300;
    for (let side = -1; side <= 1; side += 2) {
      block(ctx, x + side * 30 - 2, y - 5, 4, 10, '#6bd9ea');
      block(ctx, x - 5, y + side * 30 - 2, 10, 4, '#6bd9ea');
    }
    ctx.globalAlpha = 1;
    drawCoolingStation(ctx, station, x, y, tick,
      Math.hypot(station.x - state.playerX / TILE_SIZE + .5, station.y - state.playerY / TILE_SIZE + .5) <= SUN.stationReach);
  }
  ctx.restore();
}

export function drawCoolingRipple(ctx: CanvasRenderingContext2D, x: number, y: number, ticks: number, empowered: boolean, radius = SUN.waveRadius * TILE_SIZE) {
  const age = 1 - ticks / 36;
  if (empowered) {
    // A pressure burst for the five-cast extinguish window. All motion follows the stored
    // ripple lifetime; repeated casts may overlap without adding new state or damage.
    const reach = SUN.waveRadius * TILE_SIZE, scale = radius / reach;
    const fade = Math.pow(Math.max(0, 1 - age), .65), release = Math.min(1, age * 3);
    const burst = Math.max(0, 1 - age * 4);
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    const front = (r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    };
    ctx.shadowColor = '#79e8ff'; ctx.shadowBlur = 3;
    // A pale moving water front with a solid blue pressure band behind its white rim.
    for (let i = 0; i < 3; i++) {
      const travel = Math.max(0, release - i * .18), r = reach * travel;
      if (r <= 0) continue;
      front(r);
      ctx.globalAlpha = fade * (i === 0 ? .8 : .4);
      ctx.strokeStyle = i === 0 ? '#3ebfdf' : '#70e2f5'; ctx.lineWidth = i === 0 ? 24 : 7; ctx.stroke();
      ctx.globalAlpha = fade * (i === 0 ? 1 : .65);
      ctx.strokeStyle = i === 0 ? '#efffff' : '#baf5ff'; ctx.lineWidth = i === 0 ? 8 : 3; ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Directional spray travels with the shock front. Each fragment rotates as a solid shape.
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, travel = Math.min(1, age * (i % 2 ? 1.55 : 2.1));
      const r = 26 + (reach - 26) * travel, length = 12 + (1 - travel) * 28;
      ctx.save(); ctx.rotate(a); ctx.globalAlpha = fade * (i % 2 ? .55 : .9);
      block(ctx, r - length, -3, length, 6, i % 2 ? '#70daef' : '#d9fdff');
      if (i % 2 === 0) { ctx.globalAlpha *= .55; block(ctx, r - length - 14, 7, 9, 4, '#64cce7'); }
      ctx.restore();
    }
    // A brief geyser and compact impact flare give the cast weight at its origin.
    const column = 100 * Math.sin(Math.min(1, age * 2.5) * Math.PI);
    ctx.globalAlpha = fade * .7;
    block(ctx, -20, -column, 40, column + 20, '#57cde7');
    block(ctx, -9, -column - 8, 18, column + 28, '#efffff');
    // Chunky water jets break away from the central geyser and fall back into the wave.
    for (let jet = 0; jet < 8; jet++) {
      const a = jet * Math.PI / 4, d = 24 + age * 190;
      const lift = Math.sin(Math.min(1, age * 1.5) * Math.PI) * (30 + jet % 3 * 18);
      ctx.globalAlpha = fade * .85;
      block(ctx, Math.cos(a) * d - 5, Math.sin(a) * d - lift - 5, 10, 16, jet % 2 ? '#8eeafa' : '#e6ffff');
    }
    ctx.globalAlpha = burst * .8;
    block(ctx, -36, -6, 72, 12, '#ecffff'); block(ctx, -6, -28, 12, 56, '#ecffff');
    ctx.globalAlpha = burst * .4; ctx.strokeStyle = '#bcf6ff'; ctx.lineWidth = 4;
    const half = 18 + age * 100; ctx.strokeRect(-half, -half, half * 2, half * 2);
    ctx.restore(); return;
  }
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = (1 - age) * .8;
  ctx.strokeStyle = empowered ? '#eaffff' : '#8ee8f5'; ctx.shadowColor = '#65d9ff'; ctx.shadowBlur = empowered ? 6 : 3;
  for (let i = 0; i < 3; i++) {
    const r = radius * Math.max(0, Math.min(1, age * 1.5 - i * .17)); if (r <= 0) continue;
    ctx.lineWidth = i === 0 ? 5 : 2;
    ctx.beginPath(); ctx.moveTo(-r * .5, -r); ctx.lineTo(r * .5, -r); ctx.lineTo(r, -r * .5); ctx.lineTo(r, r * .5);
    ctx.lineTo(r * .5, r); ctx.lineTo(-r * .5, r); ctx.lineTo(-r, r * .5); ctx.lineTo(-r, -r * .5); ctx.closePath(); ctx.stroke();
  }
  ctx.shadowBlur = 0;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r = radius * age; ctx.fillStyle = i % 2 ? '#b9f7ff' : '#65cfe8'; ctx.fillRect(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 4, 8); }
  ctx.restore();
}

export function drawSunEffects(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number) {
  const sun = state.sun; if (!sun) return;
  for(const hit of sun.spitterHits??[])drawSpitterHit(ctx,hit.x-camX,hit.y-camY,hit.ticks);
  if(sun.flareFlash && !sun.flareFlash.defused) {
    const [r1,c1,r2,c2]=CHAMBER_BOUNDS[sun.flareFlash.room];
    const x=c1*TILE_SIZE-camX,y=r1*TILE_SIZE-camY,w=(c2-c1+1)*TILE_SIZE,h=(r2-r1+1)*TILE_SIZE;
    const age=45-sun.flareFlash.ticks,fade=sun.flareFlash.ticks/45,cx=x+w/2,cy=y+h/2;
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    // White-hot ignition collapses into a gold firestorm, confined to the real blast room.
    ctx.globalAlpha=Math.pow(Math.max(0,1-age/12),2)*.85;
    block(ctx,x,y,w,h,'#fff5ce');
    ctx.globalAlpha=fade*fade*.28;block(ctx,x,y,w,h,'#ff6826');
    for(let i=0;i<4;i++) {
      const t=(age-i*4)/28;if(t<=0||t>=1.4)continue;
      const rx=w*t*.7,ry=h*t*.7;
      ctx.strokeStyle='#ff6e2d';ctx.globalAlpha=(1-t/1.4)*.6;ctx.lineWidth=28-i*4;
      ctx.strokeRect(cx-rx,cy-ry,rx*2,ry*2);
      ctx.strokeStyle='#fff0a8';ctx.globalAlpha=(1-t/1.4)*.9;ctx.lineWidth=i?4:9;
      ctx.strokeRect(cx-rx,cy-ry,rx*2,ry*2);
    }
    for(let i=0;i<32;i++) {
      const px=x+((i*193)%w),base=y+h-((i*137)%(h*.8));
      const burst=Math.sin(Math.min(1,age/32)*Math.PI),rise=(65+i%6*30)*burst;
      ctx.globalAlpha=fade*.65;
      block(ctx,px-12,base-rise,24,rise,'#ff7a29');
      block(ctx,px-5,base-rise*.85,10,rise*.85,'#ffe08a');
      block(ctx,px-2,base-rise*.7,4,rise*.7,'#fff5d0');
    }
    for(let i=0;i<72;i++) {
      const a=i*2.39996,r=age*(6+i%7*2);
      ctx.save();ctx.translate(cx+Math.cos(a)*r,cy+Math.sin(a)*r*.7-age*1.5);ctx.rotate(a);
      ctx.globalAlpha=fade*(i%3?.7:1);
      block(ctx,-8,-3,16+i%5*9,4+i%3*3,i%3?'#ffad48':'#fff3bf');ctx.restore();
    }
    ctx.restore();
  }
  for (const r of sun.ripples) drawCoolingRipple(ctx, r.x - camX, r.y - camY, r.ticks, r.empowered);
  const boss = state.enemies.find(e => e.id === sun.bossId);
  if (boss && sun.quenchedTicks > 0) {
    ctx.save(); const x = boss.x - camX, y = boss.y - camY;
    const age=SUN.quenchTicks-sun.quenchedTicks,fade=Math.max(0,1-age/110);
    // Steam erupts from the extinguished King, anchoring the transition to its cause.
    if(fade>0) {
      for(let i=0;i<32;i++) {
        const a=i*2.39996,r=24+age*(1.5+i%5*.65);
        ctx.save();ctx.translate(x+Math.cos(a)*r,y+Math.sin(a)*r*.55-age*.8);ctx.rotate(a);
        ctx.globalAlpha=fade*(i%3?.55:.85);block(ctx,-6,-3,12+i%4*8,6+i%3*3,i%3?'#83d7e7':'#e7ffff');ctx.restore();
      }
      ctx.globalAlpha=Math.max(0,1-age/35)*.85;
      block(ctx,x-8,y-140-age*2,16,160+age*2,'#d5fcff');
      block(ctx,x-80-age*2,y-5,160+age*4,10,'#baf5ff');
    }
    ctx.globalAlpha=1;
    ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#eadac2'; ctx.textAlign = 'center'; ctx.fillText(`C ×${sun.empoweredCasts}`, x, y - 68); ctx.restore();
  }
}

export function drawSunAtmosphere(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number, tick: number) {
  const sun = state.sun; if (!sun) return;
  const heat = sun.heat / 100, cold = sun.quenchedTicks > 0;
  ctx.save();
  const quenchAge = SUN.quenchTicks - sun.quenchedTicks;
  if (cold && quenchAge < 150) {
    const t=quenchAge/150,fade=1-t;
    const flash=Math.pow(Math.max(0,1-quenchAge/18),2);
    // One hard pressure flash, then a deep cold wash while the frost front tears outward.
    ctx.globalAlpha=flash*.82+fade*.08;block(ctx,0,0,width,height,'#d5fcff');
    for(let i=0;i<4;i++) {
      const p=(quenchAge-i*7)/52;if(p<=0||p>=1.6)continue;
      const halfW=width*p*.7,halfH=height*p*.7;
      ctx.strokeStyle='#59c7e8';ctx.globalAlpha=(1-Math.min(1,p/1.6))*.4;
      ctx.lineWidth=i?24:48;ctx.strokeRect(width/2-halfW,height/2-halfH,halfW*2,halfH*2);
      ctx.strokeStyle='#e6ffff';ctx.globalAlpha=(1-Math.min(1,p/1.6))*.85;
      ctx.lineWidth=i?4:10;ctx.strokeRect(width/2-halfW,height/2-halfH,halfW*2,halfH*2);
    }
    // Long separated shards accelerate away from the pressure collapse.
    for(let i=0;i<72;i++) {
      const a=i*2.39996,r=quenchAge*(4+i%7*1.9),life=Math.max(0,1-quenchAge/105);
      ctx.save();ctx.translate(width/2+Math.cos(a)*r,height/2+Math.sin(a)*r);ctx.rotate(a);
      ctx.globalAlpha=life*(i%3?.5:.85);
      block(ctx,0,-3,24+i%6*16,4+i%3*3,i%3?'#78d8ec':'#eaffff');ctx.restore();
    }
    // Large layered ice teeth catch all four edges before dissolving into falling crystals.
    const frost=Math.min(1,quenchAge/8)*Math.pow(fade,.8);
    for(let i=0;i<28;i++) {
      const x=(i*193)%width,y=(i*137)%height,h=(30+i%5*15)*frost;
      ctx.globalAlpha=fade*.55;
      block(ctx,x,0,20,h*.65,'#52b6d5');block(ctx,x+5,0,10,h,'#baf5ff');
      block(ctx,width-x,height-h,12,h,'#baf5ff');
      block(ctx,0,y,h*.6,12,'#78d8ec');block(ctx,width-h*.6,height-y,h*.6,12,'#78d8ec');
    }
    for(let i=0;i<80;i++) {
      const x=(i*193+Math.sin(i+quenchAge*.02)*24+width)%width;
      const y=(i*137+quenchAge*(1.4+i%4*.55))%height;
      ctx.globalAlpha=fade*(i%4?.25:.65);
      block(ctx,x,y,i%4?3:6,i%4?7:14,i%4?'#91deee':'#eaffff');
    }
  }
  ctx.globalAlpha = 1;
  const impact = sun.ripples.reduce((strongest, ripple) => ripple.empowered
    ? Math.max(strongest, Math.max(0, (ripple.ticks - 28) / 8)) : strongest, 0);
  if (impact > 0) {
    // A short icy impact flash accompanies the real empowered cast, including distant hits.
    ctx.globalAlpha = impact * .16; ctx.fillStyle = '#b7f5ff'; ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = impact * .55; ctx.strokeStyle = '#d9fbff'; ctx.lineWidth = 3;
    const inset = 3 + (1 - impact) * 12;
    ctx.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
  }
  ctx.globalAlpha = 1;
  // Edge light conveys heat without flattening the dark plates and actor contrast.
  const vignette = ctx.createRadialGradient(width * .5, height * .5, height * .12, width * .5, height * .5, Math.max(width, height) * .65);
  vignette.addColorStop(0, 'rgba(255,100,35,0)');
  vignette.addColorStop(.65, cold ? 'rgba(74,164,208,.025)' : `rgba(200,62,28,${.025 + heat * .035})`);
  vignette.addColorStop(1, cold ? 'rgba(90,208,240,.11)' : `rgba(255,116,38,${.05 + heat * .14})`);
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 16; i++) {
    const life = (tick * (.35 + i % 3 * .16) + i * 97) % (height + 60);
    const x = (i * 193 + Math.round(Math.sin(tick * .008 + i) * 18)) % width, y = height + 30 - life;
    ctx.globalAlpha = (.1 + heat * .35) * Math.sin(life / (height + 60) * Math.PI);
    block(ctx, x, y, i % 3 === 0 ? 3 : 2, i % 3 === 0 ? 7 : 3, cold ? '#9ee6f0' : i % 4 ? '#ff9861' : '#ffe4af');
  }
  if (heat >= .9 && !cold) {
    const danger = Math.min(1, (heat - .9) / .1), pulse = .5 + .5 * Math.sin(tick * .09);
    ctx.globalAlpha = .08 + danger * .12 + pulse * .035;
    block(ctx, 0, 0, width, height, '#ff4c20');
    ctx.globalAlpha = 1;
    const scorch = ctx.createRadialGradient(width*.5,height*.5,height*.2,width*.5,height*.5,Math.max(width,height)*.6);
    scorch.addColorStop(0,'rgba(255,80,15,0)');scorch.addColorStop(.65,`rgba(255,65,16,${.1+danger*.18})`);
    scorch.addColorStop(1,`rgba(255,124,28,${.35+danger*.3+pulse*.08})`);
    ctx.fillStyle=scorch;ctx.fillRect(0,0,width,height);
    ctx.globalAlpha=.5+pulse*.3;ctx.strokeStyle='#ffb45c';ctx.lineWidth=4;ctx.strokeRect(3,3,width-6,height-6);
    // Broad edge shimmer, leaving the centre clear enough to follow enemies and water.
    for(let i=0;i<5;i++) {
      const y=Math.round((height+100-(tick*(.7+danger*.4)+i*153)%(height+150)));
      ctx.globalAlpha=(.06+danger*.07)*pulse;block(ctx,0,y,width,3,'#ffe3a1');
    }
  }
  if (sun.eruptionTicks > 0) {
    const age=90-sun.eruptionTicks,t=age/90,fade=1-t;
    // A brief white-hot shock, then orange pressure, streaks and falling molten debris.
    ctx.globalAlpha=Math.pow(Math.max(0,1-age/16),2)*.9+fade*fade*.17;
    block(ctx,0,0,width,height,age<10?'#fff3c4':'#ff6b25');
    for(let i=0;i<5;i++) {
      const p=(age-i*5)/42;if(p<=0||p>=1.7)continue;
      const rx=width*p*.6,ry=height*p*.6;
      ctx.globalAlpha=(1-p/1.7)*.5;ctx.strokeStyle='#ff6726';ctx.lineWidth=i?20:48;
      ctx.strokeRect(width/2-rx,height/2-ry,rx*2,ry*2);
      ctx.globalAlpha=(1-p/1.7)*.85;ctx.strokeStyle=i?'#ffbf66':'#fff1b3';ctx.lineWidth=i?4:10;
      ctx.strokeRect(width/2-rx,height/2-ry,rx*2,ry*2);
    }
    for(let i=0;i<96;i++) {
      const a=i*2.39996,r=age*(5+i%9*1.5);
      ctx.save();ctx.translate(width/2+Math.cos(a)*r,height/2+Math.sin(a)*r);ctx.rotate(a);
      ctx.globalAlpha=fade*(i%4?.55:.95);
      block(ctx,0,-3,20+i%6*16,4+i%4*2,i%4?'#ff9a42':'#fff1b3');ctx.restore();
    }
    for(let i=0;i<56;i++) {
      const x=(i*193+Math.sin(i+age*.04)*24+width)%width;
      const y=(i*137+age*(2+i%4))%height;
      ctx.globalAlpha=fade*(i%3?.45:.8);
      block(ctx,x,y,4+i%3*3,8+i%4*5,i%3?'#ffad4d':'#ffe6a1');
    }
    for(let i=0;i<18;i++) {
      const h=(25+i%5*14)*fade,x=(i*197)%width;
      ctx.globalAlpha=fade*.65;block(ctx,x,height-h,16,h,'#f56b2c');
      block(ctx,x+4,height-h*.8,7,h*.8,'#ffc76b');
    }
  }
  ctx.restore();
}
