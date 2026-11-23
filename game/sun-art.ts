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
  const size=Math.floor(TILE_SIZE*ENEMY_CONFIGS.fiery_king.bodyFraction),flash=e.flashTicks>0;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(size/60,size/60);ctx.shadowBlur=0;
  // Burnt shoulder plates retain their silhouette, with chipped ash and copper underneath.
  for(const side of [-1,1]){
    const left=side<0?-41:30;
    block(ctx,left,-7,11,21,'#4a5052');block(ctx,left+2,-3,7,14,'#80584a');
    block(ctx,left+(side<0?1:5),-7,5,4,'#b5b6a9');block(ctx,left+3,10,4,4,'#282e34');
  }
  block(ctx,-30,-30,60,60,flash?'#f3f3e8':'#707a79');
  block(ctx,-26,-26,52,52,'#30373d');
  // Individual scorched armor plates, separated by cold charcoal seams.
  block(ctx,-25,-25,23,25,'#4f4e49');block(ctx,2,-25,23,25,'#3d4449');
  block(ctx,-25,3,23,22,'#474444');block(ctx,2,3,23,22,'#394146');
  block(ctx,-24,-24,8,4,'#956b51');block(ctx,14,14,10,7,'#785347');
  block(ctx,-30,-29,16,3,'#c4c2af');block(ctx,-29,-26,4,9,'#aaa99b');
  block(ctx,18,26,11,3,'#a0aaa4');
  // The five crown points are tarnished, cracked and chipped, with no live fire.
  const heights=[13,7,15,7,12];
  block(ctx,-30,-33,60,5,'#766c54');
  for(let i=0;i<5;i++){
    const left=-30+i*12,height=heights[i];
    block(ctx,left,-30-height,10,height,i%2?'#8b8062':'#aa9a70');
    block(ctx,left+3,-height-28,3,Math.max(2,height-5),'#5d625c');
    if(i%2===0)block(ctx,left,-30-height,5,3,'#c9c9b4');
  }
  block(ctx,3,-45,4,4,'#202b32');block(ctx,-29,-40,3,3,'#27333a');
  // Cooled seams and irregular ash deposits give the inert armor its own material detail.
  ctx.strokeStyle='#949e97';ctx.lineWidth=1.5;
  for(const points of [[[-20,-25],[-17,-20],[-20,-14]],[[-1,-24],[3,-17],[0,-10],[4,-3]],[[24,5],[18,9],[20,15],[14,20]]]){
    ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();
  }
  for(const [px,py,pw,ph] of [[-24,13,4,3],[-21,17,6,2],[17,-22,5,2],[21,-19,3,4],[-4,24,7,2]])block(ctx,px,py,pw,ph,'#a6aba0');
  // Normal King's four square eyes and jagged mouth, using the current cooled palette.
  if(!flash){
    const eyeSize=9,pupilSize=5,eyeXs=[-22,13],eyeYs=[-22,-10];
    for(const ex of eyeXs)for(const ey of eyeYs){
      block(ctx,ex,ey,eyeSize,eyeSize,'#b3d3ce');
      block(ctx,ex+1,ey+1,pupilSize,pupilSize,'#506d6d');
    }
    const mouthX=-21,mouthY=2,mouthWidth=42,mouthHeight=6,toothWidth=7;
    block(ctx,mouthX,mouthY,mouthWidth,mouthHeight,'#172128');
    for(let i=0;i<5;i++)block(ctx,mouthX+toothWidth*i+1,mouthY-mouthHeight,toothWidth-2,mouthHeight+1,'#bcb8a3');
  }
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

// Scorch Sapper: a siphon bug that steals coolant. A segmented body facing where it walks: a glass abdomen sac behind
// that fills and glows with stolen cyan coolant while it drains, a charcoal thorax plate with molten-orange seams, a
// small dark head with two ember eyes and a long brass siphon needle in front (its tip glows while draining), and six
// stepping legs. Steam puffs rise from the sac while it drains a station.
function drawScorchSapper(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, tick: number) {
  const flash = e.flashTicks > 0, draining = e.sapStation !== undefined;
  const face = draining ? (e.chargeDirX || 1) : e.targetTileX !== e.tileX ? Math.sign(e.targetTileX - e.tileX) : (e.id % 2 ? 1 : -1), step = Math.floor(tick / 5 + e.id) % 2;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(face, 1); // drawn facing right, mirrored to face left
  for (const [lx, k] of [[-8, 0], [0, 1], [7, 0]] as const) { // three pairs of legs, alternating as it scuttles
    const lift = (k + step) % 2 ? 2 : 0;
    block(ctx, lx - 1, -13 + lift, 2, 6, '#8a5a3e'); block(ctx, lx - 3, -14 + lift, 4, 2, '#8a5a3e');
    block(ctx, lx - 1, 7 - lift, 2, 6, '#8a5a3e'); block(ctx, lx - 3, 12 - lift, 4, 2, '#8a5a3e');
  }
  // Abdomen: a glass sac of stolen coolant.
  block(ctx, -19, -8, 14, 16, flash ? '#ffffff' : '#b5652e');
  if (!flash) {
    block(ctx, -17, -6, 10, 12, '#13232a');
    const level = draining ? 9 + Math.round(Math.sin(tick * .2)) : 3 + Math.round(Math.sin(tick * .12 + e.id));
    ctx.shadowColor = '#6bd9ea'; ctx.shadowBlur = draining ? 8 : 0;
    block(ctx, -17, 6 - level, 10, level, '#58d4ea'); ctx.shadowBlur = 0;
    block(ctx, -17, 6 - level, 10, 1, '#d8fbff'); block(ctx, -16, -5, 2, 4, '#9fdcea'); // coolant surface, glass glint
  }
  // Thorax: a charcoal plate with molten seams.
  block(ctx, -6, -9, 14, 18, flash ? '#ffffff' : '#c9783a');
  if (!flash) {
    block(ctx, -4, -7, 10, 14, '#3a241e'); block(ctx, -4, -7, 10, 3, '#5a3a2e');
    block(ctx, -3, -2, 8, 2, '#ff7a2a'); block(ctx, -3, 3, 8, 2, '#ff7a2a'); // two molten vent seams
  }
  // Head with ember eyes, and the siphon needle.
  block(ctx, 8, -6, 8, 12, flash ? '#ffffff' : '#4a2c22');
  if (!flash) { block(ctx, 11, -4, 3, 3, '#ffd166'); block(ctx, 11, 2, 3, 3, '#ffd166'); }
  block(ctx, 16, -1, 9, 3, flash ? '#ffffff' : '#c9a052'); block(ctx, 16, -1, 9, 1, '#f0d48a');
  if (draining && !flash) { ctx.shadowColor = '#6bd9ea'; ctx.shadowBlur = 6; block(ctx, 24, -2, 3, 5, '#bff4ff'); ctx.shadowBlur = 0; }
  ctx.restore();
  if (draining && !flash) for (let k = 0; k < 2; k++) { // steam puffs over the sac
    const age = (tick * .6 + k * 20 + e.id * 7) % 40, sx = Math.round(x) - face * (14 - k * 5);
    ctx.save(); ctx.globalAlpha = .5 * (1 - age / 40); block(ctx, sx - 2, Math.round(y) - 12 - age * .5, 4, 4, '#c9d2d6'); ctx.restore();
  }
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
  const charge=1-Math.max(0,Math.min(1,ticks/SUN.flareWarning)),pulse=.5+.5*Math.sin(tick*(charge>.65?.18:.07));
  ctx.save();ctx.shadowBlur=0;ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  const warmth=ctx.createRadialGradient(x+w/2,y+h/2,0,x+w/2,y+h/2,Math.hypot(w,h)*.65);
  warmth.addColorStop(0,'rgba(255,182,40,.1)');warmth.addColorStop(.55,'rgba(239,143,35,.17)');warmth.addColorStop(1,'rgba(255,200,72,.38)');
  ctx.globalAlpha=.55+charge*.45;ctx.fillStyle=warmth;ctx.fillRect(x,y,w,h);
  ctx.globalAlpha=.035+charge*.065+pulse*.015;block(ctx,x,y,w,h,'#ffbd4d');
  // Heat gathers inward from the perimeter, leaving the middle open for the countdown.
  const depth=compact?8:36,steps=compact?4:12;
  for(let i=0;i<steps;i++){
    const u=(i+.5)/steps,d=u*depth,thick=depth/steps+.5;
    ctx.globalAlpha=(.05+charge*.08+pulse*.025)*(1-u);ctx.fillStyle='#ffcf69';
    ctx.fillRect(x+d,y+d,w-d*2,thick);ctx.fillRect(x+d,y+h-d-thick,w-d*2,thick);
    ctx.fillRect(x+d,y+d,thick,h-d*2);ctx.fillRect(x+w-d-thick,y+d,thick,h-d*2);
  }
  const inset=compact?3:10,arm=Math.min(w,h)*.16;
  for(const sx of [0,1])for(const sy of [0,1]){
    const cx=x+(sx?w-inset:inset),cy=y+(sy?h-inset:inset),dx=sx?-1:1,dy=sy?-1:1;
    for(let layer=2;layer>=0;layer--){
      ctx.globalAlpha=layer?(.08+charge*.07)*(3-layer):.75+pulse*.25;
      ctx.strokeStyle=layer?'#e9ac3e':'#ffe778';ctx.lineWidth=layer?(compact?3:10):compact?2:4;
      ctx.beginPath();ctx.moveTo(cx+dx*arm,cy+dy*layer*5);ctx.lineTo(cx+dx*layer*5,cy+dy*layer*5);ctx.lineTo(cx+dx*layer*5,cy+dy*arm);ctx.stroke();
    }
  }
  if(!compact)for(let i=0;i<24;i++){
    const side=i%4,along=(i*137%997)/997,flow=(tick*.006+i*.17)%1,d=10+flow*34;
    const px=side<2?x+along*w:x+(side===2?d:w-d),py=side>=2?y+along*h:y+(side===0?d:h-d);
    ctx.globalAlpha=Math.sin(flow*Math.PI)*(.12+charge*.3);block(ctx,px-2,py-2,3+i%2,3+i%2,i%4?'#ffd077':'#fff0ba');
  }
  ctx.globalAlpha=1;drawChamberCountdown(ctx,x+w/2,y+h*.3,'SUNBURST',ticks,'#ffe778',compact);ctx.restore();
}

/** A room-sized solar pressure bloom, with a cyan coolant variant for defusing it. */
function drawSunburstRelease(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,age:number,defused:boolean,arenaReach?:number,anchorX=x+w/2,anchorY=y+h/2){
  const p=Math.max(0,Math.min(1,age/45)),fade=.5+.5*Math.cos(p*Math.PI),reach=arenaReach??Math.hypot(w,h)*.67;
  const color=defused?'#6ed4ee':'#ffb64a',pale=defused?'#e9fcff':'#fff0bc';
  ctx.save();ctx.shadowBlur=0;if(defused){ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();}ctx.translate(anchorX,anchorY);ctx.lineJoin='miter';
  const heat=ctx.createRadialGradient(0,0,0,0,0,reach);
  heat.addColorStop(0,defused?'rgba(106,216,243,.22)':'rgba(255,171,35,.3)');heat.addColorStop(.55,defused?'rgba(106,216,243,.07)':'rgba(236,91,26,.13)');heat.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=fade;ctx.fillStyle=heat;ctx.fillRect(x-anchorX,y-anchorY,w,h);
  ctx.globalAlpha=Math.pow(Math.max(0,1-age/9),2)*(defused?.14:.32);block(ctx,x-anchorX,y-anchorY,w,h,pale);
  for(let echo=0;echo<(defused?2:4);echo++){
    const travel=(age-echo*5)/32;if(travel<=0||travel>=1.35)continue;
    const r=14+reach*travel,strength=fade*(1-echo*.18),tail=Math.min(r*.45,defused?54:140);
    for(let sheet=23;sheet>=0;sheet--){
      const u=sheet/23;traceHydroPulseFront(ctx,Math.max(1,r-tail*u));
      ctx.globalAlpha=strength*(defused?.22:.4)*Math.pow(1-u,1.15);ctx.strokeStyle=color;ctx.lineWidth=tail/23+1;ctx.stroke();
    }
    traceHydroPulseFront(ctx,r);ctx.globalAlpha=strength*.7;ctx.strokeStyle=defused?'#419ebf':'#e66f24';ctx.lineWidth=echo?14:26;ctx.stroke();
    ctx.globalAlpha=strength*.9;ctx.strokeStyle=color;ctx.lineWidth=echo?6:12;ctx.stroke();
    ctx.globalAlpha=strength;ctx.strokeStyle=pale;ctx.lineWidth=echo?2:4;ctx.stroke();
    if(echo===0&&!defused)for(let arm=0;arm<8;arm++){
      // Broad detached corona teeth, made from overlapping flat flame sheets.
      ctx.save();ctx.rotate(arm*Math.PI/4);ctx.translate(0,-r);
      const flare=12+Math.min(24,r*.06);
      for(let layer=2;layer>=0;layer--){
        ctx.globalAlpha=strength*(.19-layer*.045);ctx.fillStyle=layer?'#ffac42':'#ffda7d';
        const back=layer*9;ctx.beginPath();ctx.moveTo(-flare,back+16);ctx.lineTo(-flare,back);ctx.lineTo(-flare*.45,back);ctx.lineTo(-flare*.45,back-18);ctx.lineTo(flare*.2,back-18);ctx.lineTo(flare*.2,back-8);ctx.lineTo(flare,back-8);ctx.lineTo(flare,back+16);ctx.closePath();ctx.fill();
      }
      ctx.globalAlpha=strength*.65;block(ctx,-flare*.4,-18,flare*.6,3,pale);ctx.restore();
    }
  }
  for(let i=0;i<(defused?30:64);i++){
    const a=i*2.39996,d=(14+reach*p)*(.3+i%7*.075),size=3+i%4*2;
    ctx.save();ctx.translate(Math.cos(a)*d,Math.sin(a)*d-p*(12+i%3*8));ctx.rotate(a+p*.65);
    for(let layer=1;layer>=0;layer--){ctx.globalAlpha=fade*(layer?.12:.3);block(ctx,-size/2-layer*3,-size/2+layer*2,size,size,color);}
    ctx.restore();
    if(i%2===0){
      const shine=Math.pow(Math.max(0,Math.sin(age*.2+i*1.7)),4),gx=Math.cos(a)*d,gy=Math.sin(a)*d-p*16;
      ctx.globalAlpha=fade*(.1+shine*.6);block(ctx,gx-4,gy,9,1,pale);block(ctx,gx,gy-4,1,9,pale);
    }
  }
  if(!defused){
    // A flat block-built sun is the source of the travelling pressure fronts.
    const radius=24+Math.min(1,age/10)*22,sunFade=fade*Math.min(1,.35+age/4);
    const rows=[.35,.65,.85,1,1,1,1,.85,.65,.35];
    for(let arm=0;arm<12;arm++){
      const angle=arm*Math.PI/6,length=25,width=10;
      ctx.save();ctx.rotate(angle);ctx.translate(radius-4,0);
      for(let layer=2;layer>=0;layer--){
        ctx.globalAlpha=sunFade*(.22-layer*.055);block(ctx,-layer*7,-width/2-layer*2,length,width+layer*4,layer?'#f68d30':'#ffd375');
      }
      ctx.globalAlpha=sunFade*.75;block(ctx,4,-1,length*.65,2,'#fff0b0');ctx.restore();
    }
    for(const [scale,color,opacity]of [[1,'#ff9e35',.82],[.78,'#ffd15b',.6],[.48,'#fff0ad',.6]] as const){
      const r=radius*scale;ctx.beginPath();rows.forEach((half,row)=>ctx.rect(-half*r,-r+row*r/5,half*r*2,r/5));ctx.globalAlpha=sunFade*opacity;ctx.fillStyle=color;ctx.fill();
    }
    ctx.globalAlpha=sunFade*.6;block(ctx,-radius*.3,-radius*.25,radius*.6,4,'#fff0b0');block(ctx,-radius*.2,radius*.18,radius*.4,3,'#ffe28d');
  }
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
    const [x,y,w,h]=roomRect(sun.flareFlash.room);
    drawSunburstRelease(ctx,x,y,w,h,45-sun.flareFlash.ticks,true);
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

function traceHydroPulseFront(ctx:CanvasRenderingContext2D,r:number){
    ctx.beginPath();ctx.moveTo(-r*.5,-r);ctx.lineTo(r*.5,-r);ctx.lineTo(r,-r*.5);ctx.lineTo(r,r*.5);
    ctx.lineTo(r*.5,r);ctx.lineTo(-r*.5,r);ctx.lineTo(-r,r*.5);ctx.lineTo(-r,-r*.5);ctx.closePath();
  }

export function drawCoolingRipple(ctx: CanvasRenderingContext2D, x: number, y: number, ticks: number, empowered: boolean, radius = SUN.waveRadius * TILE_SIZE) {
  const elapsed=Math.max(0,SUN.waveVisualTicks-ticks),age=Math.min(1,elapsed/36);
  const fade=Math.pow(Math.max(0,1-elapsed/SUN.waveVisualTicks),.7),release=1-Math.pow(1-age,empowered?2.7:2);
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;ctx.lineJoin='miter';
  // Crisp pressure rims carry a short translucent motion sheet on their inner side.
  const front=(r:number)=>traceHydroPulseFront(ctx,r);
  for(let i=0;i<(empowered?4:3);i++){
    const travel=Math.max(0,release-i*(empowered?.12:.14)),r=radius*travel;if(r<2)continue;
    const rim=i?(empowered?8:5):(empowered?22:12),tail=Math.min(r*.45,empowered?34:22),slices=24;
    for(let wake=slices-1;wake>=0;wake--){
      const u=wake/(slices-1);
      front(Math.max(1,r-rim*.4-tail*u));
      ctx.globalAlpha=fade*(i?.25:.65)*Math.pow(1-u,1.15);
      ctx.strokeStyle='#75dbea';ctx.lineWidth=tail/(slices-1)*1.2+.3;ctx.stroke();
    }
    front(r);
    ctx.globalAlpha=fade*(i?.3:.7);ctx.strokeStyle='#238eae';ctx.lineWidth=rim;ctx.stroke();
    ctx.globalAlpha=fade*(i?.55:.95);ctx.strokeStyle='#75e6f5';ctx.lineWidth=i?(empowered?3:2):(empowered?12:6);ctx.stroke();
    if(i===0){ctx.globalAlpha=fade;ctx.strokeStyle='#efffff';ctx.lineWidth=empowered?4:2;ctx.stroke();}
  }
  // Long droplets travel outward, then smaller square spray lifts into cooling steam.
  const sprays=empowered?24:16;
  for(let i=0;i<sprays;i++){
    const angle=i*Math.PI*2/sprays,travel=Math.min(1,age*(1.35+i%3*.22)),d=radius*travel;
    const length=(empowered?1.5:1)*(8+i%4*4)*(1-age*.45);
    ctx.save();ctx.rotate(angle);ctx.globalAlpha=fade*(i%2?.55:.85);
    block(ctx,d-length,-2,length,4,i%2?'#51c3df':'#d8fbff');
    if(i%2===0){ctx.globalAlpha=fade*.45;block(ctx,d-length-12,5,6,3,'#78d9ea');}
    ctx.restore();
    const lift=Math.sin(age*Math.PI)*(10+i%3*7),size=(empowered?5:3)+i%3;
    ctx.globalAlpha=fade*Math.min(1,age*6)*.55;
    block(ctx,Math.cos(angle)*d*.8-size/2,Math.sin(angle)*d*.8-lift-size/2,size,size,'#c7f3f6');
  }
  // Compact reservoir-like jets make the release read as water under pressure.
  const burst=Math.max(0,1-age/.4),jet=10+age*radius*(empowered?.45:.3);
  for(let i=0;i<4&&burst>0;i++){
    ctx.save();ctx.rotate(i*Math.PI/2);ctx.globalAlpha=burst*.8;
    block(ctx,empowered?-7:-4,-jet,empowered?14:8,jet-4,'#57cde7');block(ctx,empowered?-2:-1,-jet-3,empowered?4:2,jet-1,'#efffff');ctx.restore();
  }
  ctx.restore();
}

export function drawSunEffects(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number) {
  const sun = state.sun; if (!sun) return;
  for(const hit of sun.spitterHits??[])drawSpitterHit(ctx,hit.x-camX,hit.y-camY,hit.ticks);
  if(sun.flareFlash && !sun.flareFlash.defused) {
    const [r1,c1,r2,c2]=CHAMBER_BOUNDS[sun.flareFlash.room];
    const x=c1*TILE_SIZE-camX,y=r1*TILE_SIZE-camY,w=(c2-c1+1)*TILE_SIZE,h=(r2-r1+1)*TILE_SIZE;
    const [padX,padY]=TELEPORT_PADS[sun.flareFlash.room];
    const cx=(padX+.5)*TILE_SIZE,cy=(padY+.5)*TILE_SIZE,mapW=state.map[0].length*TILE_SIZE,mapH=state.map.length*TILE_SIZE;
    const reach=Math.max(...[[0,0],[mapW,0],[0,mapH],[mapW,mapH]].map(([mx,my])=>Math.hypot(mx-cx,my-cy)))*1.05;
    drawSunburstRelease(ctx,x,y,w,h,45-sun.flareFlash.ticks,false,reach,cx-camX,cy-camY);
  }
  for (const r of sun.ripples) drawCoolingRipple(ctx, r.x - camX, r.y - camY, r.ticks, r.empowered);
  const boss = state.enemies.find(e => e.id === sun.bossId);
  if (boss && sun.quenchedTicks > 0) {
    ctx.save(); const x = boss.x - camX, y = boss.y - camY;
    const age=SUN.quenchTicks-sun.quenchedTicks,fade=Math.max(0,1-age/110);
    // Flat translucent frost fragments lift off the King, with a few clean pearl glints.
    if(fade>0){
      // A local coolant release anchors the screen-wide pulse to the extinguished King.
      const waveFade=.5+.5*Math.cos(Math.min(1,age/72)*Math.PI);
      for(let echo=0;echo<3;echo++){
        const travel=(age-echo*7)/60;if(travel<=0||travel>=1)continue;
        const radius=16+travel*TILE_SIZE*6,tail=Math.min(radius*.4,48),strength=waveFade*(1-echo*.25);
        ctx.save();ctx.translate(x,y);ctx.lineJoin='miter';
        for(let sheet=23;sheet>=0;sheet--){
          const u=sheet/23;traceHydroPulseFront(ctx,Math.max(1,radius-tail*u));
          ctx.globalAlpha=strength*.35*Math.pow(1-u,1.2);ctx.strokeStyle='#75dbea';ctx.lineWidth=tail/23*1.2+.4;ctx.stroke();
        }
        traceHydroPulseFront(ctx,radius);
        ctx.globalAlpha=strength*.7;ctx.strokeStyle='#4fc9e4';ctx.lineWidth=echo?7:14;ctx.stroke();
        ctx.globalAlpha=strength;ctx.strokeStyle='#eaffff';ctx.lineWidth=echo?2:3;ctx.stroke();ctx.restore();
      }
      const p=Math.min(1,age/110),travel=1-Math.pow(1-p,2);
      for(let i=0;i<32;i++){
        const angle=i*2.39996,d=24+travel*(90+i%5*25),size=6+i%4*2;
        const px=x+Math.cos(angle)*d,py=y+Math.sin(angle)*d*.65-travel*(18+i%3*12);
        ctx.save();ctx.translate(px,py);ctx.rotate(angle+p*(i%2?1:-1)*.7);
        for(let layer=2;layer>=0;layer--){
          ctx.save();ctx.translate(-layer*3,layer*2);ctx.globalAlpha=fade*(.3-layer*.07);ctx.fillStyle='#a4e8f2';
          ctx.beginPath();ctx.moveTo(-size*.5,-size*.4);ctx.lineTo(size*.5,-size*.4);ctx.lineTo(size*.5,size*.1);
          ctx.lineTo(size*.2,size*.1);ctx.lineTo(size*.2,size*.4);ctx.lineTo(-size*.5,size*.4);ctx.closePath();ctx.fill();ctx.restore();
        }
        ctx.restore();
        if(i%4===0){
          const shine=Math.pow(Math.max(0,Math.sin(age*.13+i)),4);ctx.globalAlpha=fade*shine*.7;
          block(ctx,px-3,py,7,1,'#edffff');block(ctx,px,py-3,1,7,'#edffff');
        }
      }
      for(let i=0;i<10;i++){
        const rise=(age*.8+i*9)%100,px=x+(i-4.5)*9+Math.sin(age*.025+i)*8,py=y-12-rise,size=10+i%3*4;
        ctx.globalAlpha=fade*(1-rise/100)*.09;block(ctx,px-size/2,py-size/2,size,size,'#c2f4fa');
      }
    }
    ctx.globalAlpha=1;
    ctx.font = '12px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.lineJoin = 'bevel';
    ctx.strokeStyle = '#3b211b'; ctx.lineWidth = 3;
    ctx.strokeText(`PULSE ×${sun.empoweredCasts}`, x, y - 76);
    ctx.fillStyle = '#fff2c5'; ctx.fillText(`PULSE ×${sun.empoweredCasts}`, x, y - 76); ctx.restore();
  }
}

/** Translucent coolant currents or flame sheets beneath the thermal blast and vent details. */
function drawThermalSurface(ctx:CanvasRenderingContext2D,w:number,h:number,age:number,cold:boolean){
  ctx.save();ctx.shadowBlur=0;
  if(cold){
    const p=Math.min(1,age/76),fade=.5+.5*Math.cos(p*Math.PI),flow=1-(1-p)*(1-p);
    ctx.globalAlpha=fade*.14;block(ctx,0,0,w,h,'#84d5ed');
    const haze=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.hypot(w,h)*.6);
    haze.addColorStop(0,'rgba(201,246,255,.07)');haze.addColorStop(.6,'rgba(117,215,236,.04)');haze.addColorStop(1,'rgba(117,215,236,0)');
    ctx.globalAlpha=fade;ctx.fillStyle=haze;ctx.fillRect(0,0,w,h);
    // Broad coolant mist currents return beneath the main pulse fronts.
    for(let i=0;i<14;i++){
      const side=i%2?1:-1,row=Math.floor(i/2),length=w*(.4+i%3*.08),depth=36+i%4*12;
      const x=w*(side<0?.22:.78)+side*flow*w*.28,y=h*(.07+row*.14)-flow*(10+i%3*7);
      ctx.save();ctx.translate(x,y);ctx.scale(side,1);
      const veil=ctx.createLinearGradient(-length*.5,0,length*.5,0);
      veil.addColorStop(0,'rgba(128,213,237,0)');veil.addColorStop(.3,'rgba(155,232,249,.25)');
      veil.addColorStop(.65,'rgba(215,249,255,.19)');veil.addColorStop(1,'rgba(155,232,249,0)');
      for(let layer=2;layer>=0;layer--){
        ctx.save();ctx.translate(-layer*18,layer*depth*.28);ctx.globalAlpha=fade*(1-layer*.24);ctx.fillStyle=veil;
        ctx.beginPath();ctx.moveTo(-length*.5,-depth*.3);ctx.lineTo(-length*.2,-depth*.3);ctx.lineTo(-length*.2,-depth*.55);
        ctx.lineTo(length*.18,-depth*.55);ctx.lineTo(length*.18,-depth*.25);ctx.lineTo(length*.5,-depth*.25);
        ctx.lineTo(length*.5,depth*.25);ctx.lineTo(length*.1,depth*.25);ctx.lineTo(length*.1,depth*.5);
        ctx.lineTo(-length*.3,depth*.5);ctx.lineTo(-length*.3,depth*.2);ctx.lineTo(-length*.5,depth*.2);ctx.closePath();ctx.fill();ctx.restore();
      }
      ctx.restore();
    }
    // Tiny condensation squares rise through the coolant flow and dissolve with it.
    for(let i=0;i<56;i++){
      const side=i%2?1:-1,x=w*(.5+side*(.08+(i%7)*.055+flow*.2));
      const y=((i*137)%h)-flow*(24+i%5*13),size=2+i%3;
      ctx.globalAlpha=fade*(.18+i%3*.08);block(ctx,x,y,size,size,'#e1faff');
      if(i%4===0){const shine=Math.pow(Math.max(0,Math.sin(age*.15+i)),4);ctx.globalAlpha=fade*shine*.65;block(ctx,x-3,y,7,1,'#efffff');block(ctx,x,y-3,1,7,'#efffff');}
    }
  }else{
    const fade=Math.pow(Math.max(0,1-age/90),.8),rise=age*3.2;
    ctx.globalAlpha=fade*.13;block(ctx,0,0,w,h,'#ed4d20');
    // Broad translucent tongues fill the screen, each with a rising amber heart.
    for(let row=0;row<3;row++)for(let i=0;i<12;i++){
      const seed=(i*37+row*29)%83,width=w/10,base=h*(.4+row*.38)-(rise+seed*3)%(h*.42);
      const x=(i-.5)*w/11+Math.sin(age*.055+i+row)*12,height=h*(.36+seed/300);
      ctx.save();ctx.translate(x,base);
      const flame=ctx.createLinearGradient(0,0,0,-height);
      flame.addColorStop(0,'rgba(180,34,14,0)');flame.addColorStop(.4,'rgba(242,72,19,.75)');flame.addColorStop(.8,'rgba(255,133,39,.7)');flame.addColorStop(1,'rgba(255,209,100,0)');
      ctx.globalAlpha=fade*.3;ctx.fillStyle=flame;
      ctx.beginPath();ctx.moveTo(-width*.7,0);ctx.lineTo(-width*.48,-height*.38);ctx.lineTo(-width*.3,-height*.56);
      ctx.lineTo(-width*.22,-height*.83);ctx.lineTo(width*.12,-height);ctx.lineTo(width*.08,-height*.64);
      ctx.lineTo(width*.4,-height*.43);ctx.lineTo(width*.6,0);ctx.closePath();ctx.fill();
      ctx.globalAlpha=fade*.12;ctx.fillStyle='#ffcf72';
      ctx.beginPath();ctx.moveTo(-width*.2,0);ctx.lineTo(-width*.12,-height*.38);ctx.lineTo(width*.12,-height*.67);ctx.lineTo(width*.07,-height*.3);ctx.lineTo(width*.25,0);ctx.closePath();ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Thermal extremes burst from the centre, then settle into forge vents at the edges. */
function drawThermalRelease(ctx:CanvasRenderingContext2D,width:number,height:number,age:number,cold:boolean){
  const duration=cold?150:90,p=Math.max(0,Math.min(1,age/duration)),fade=Math.pow(1-p,.85);
  const attack=Math.min(1,age/5),strength=fade*attack,depth=Math.min(width,height)*(cold?.19:.23);
  const color=cold?'#56cfe8':'#ff7736',pale=cold?'#e5fcff':'#fff0b5';
  ctx.save();ctx.shadowBlur=0;
  drawThermalSurface(ctx,width,height,age,cold);
  ctx.globalAlpha=Math.pow(Math.max(0,1-age/12),2)*(cold?.26:.34);
  block(ctx,0,0,width,height,pale);
  // Arena-scale Hydro Pulse: thick luminous fronts with continuous translucent motion sheets.
  if(age<90){
    const burstAge=age/90,blastFade=.5+.5*Math.cos(burstAge*Math.PI),reach=Math.hypot(width,height)*.72;
    ctx.save();ctx.translate(width/2,height/2);ctx.lineJoin='miter';
    for(let echo=0;echo<4;echo++){
      const travel=(age-echo*8)/76;if(travel<=0||travel>=1)continue;
      const r=18+reach*travel,rim=echo?20:36,tail=Math.min(r*.44,echo?66:110),echoFade=blastFade*(1-echo*.19);
      for(let wake=31;wake>=0;wake--){
        const u=wake/31;traceHydroPulseFront(ctx,Math.max(1,r-rim*.4-tail*u));
        ctx.globalAlpha=echoFade*(echo?.26:.58)*Math.pow(1-u,1.25);
        ctx.strokeStyle=cold?'#75dbea':'#ffac54';ctx.lineWidth=tail/31*1.2+.4;ctx.stroke();
      }
      traceHydroPulseFront(ctx,r);
      ctx.globalAlpha=echoFade*.65;ctx.strokeStyle=cold?'#238eae':'#e65a28';ctx.lineWidth=rim;ctx.stroke();
      ctx.globalAlpha=echoFade*.95;ctx.strokeStyle=cold?'#8eeefa':'#ffd076';ctx.lineWidth=echo?9:18;ctx.stroke();
      ctx.globalAlpha=echoFade;ctx.strokeStyle=cold?'#efffff':'#fff2c9';ctx.lineWidth=echo?3:5;ctx.stroke();
    }
    // Flat translucent droplets / ember chips scatter with the release, with clear square glitter.
    for(let i=0;i<56;i++){
      const angle=i*2.39996,travel=Math.min(1,age/76),d=(18+reach*travel)*(.65+i%5*.075),size=4+i%4*2;
      ctx.save();ctx.translate(Math.cos(angle)*d,Math.sin(angle)*d+burstAge*burstAge*(cold?-25:30));ctx.rotate(angle+burstAge*.5);
      for(let layer=2;layer>=0;layer--){
        ctx.globalAlpha=blastFade*(.34-layer*.08);block(ctx,-size/2-layer*3,-size*.35+layer*2,size,size*.7,cold?'#a3edfa':'#ffc05e');
      }
      ctx.restore();
      if(i%2===0){
        const shine=Math.pow(Math.max(0,Math.sin(age*.16+i*1.7)),4),gx=Math.cos(angle)*d,gy=Math.sin(angle)*d;
        ctx.globalAlpha=blastFade*(.12+shine*.7);block(ctx,gx-4,gy,9,1,pale);block(ctx,gx,gy-4,1,9,pale);
      }
    }
    const flash=Math.max(0,1-age/18),jet=16+age*5;
    for(let side=0;side<4&&flash>0;side++){
      ctx.save();ctx.rotate(side*Math.PI/2);ctx.globalAlpha=flash*.45;block(ctx,-10,-jet,20,jet-5,color);
      ctx.globalAlpha=flash*.8;block(ctx,-2,-jet,4,jet-5,pale);ctx.restore();
    }
    ctx.restore();
  }
  // Broken Hydro Pulse crests press inward from the rim, with open gaps and spatial wakes.
  for(let edge=0;edge<4;edge++){
    ctx.save();
    if(edge===1){ctx.translate(width,0);ctx.rotate(Math.PI/2);}else if(edge===2){ctx.translate(width,height);ctx.rotate(Math.PI);}else if(edge===3){ctx.translate(0,height);ctx.rotate(-Math.PI/2);}
    const span=edge%2?height:width,count=Math.ceil(span/380),growth=1-Math.pow(1-Math.min(1,age/18),2);
    const body=cold?'#75dbea':'#ffb45e',crest=cold?'#e5fcff':'#fff0bc';
    const wash=ctx.createLinearGradient(0,0,0,depth*.65);
    wash.addColorStop(0,cold?'rgba(91,218,244,.12)':'rgba(255,148,58,.12)');wash.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=strength;ctx.fillStyle=wash;ctx.fillRect(0,0,span,depth*.65);
    for(let i=0;i<count;i++){
      const seed=(i*47+edge*31)%97,half=span/count*(.34+seed/1700),x=span*(i+.45+(seed%7)*.012)/count;
      const height=(26+seed*.38)*(.7+.3*growth),tail=28;
      const trace=(offset:number)=>{
        ctx.beginPath();ctx.moveTo(-half,height*.25-offset);ctx.lineTo(-half*.76,height*.25-offset);
        ctx.lineTo(-half*.5,height*.78-offset);ctx.lineTo(half*.28,height*.78-offset);
        ctx.lineTo(half*.56,height*.38-offset);ctx.lineTo(half,height*.38-offset);
      };
      ctx.save();ctx.translate(x,0);if(i%2)ctx.scale(-1,1);
      for(let echo=1;echo>=0;echo--){
        const power=strength*(echo?.4:1),lag=echo*14;
        for(let sheet=23;sheet>=0;sheet--){
          const u=sheet/23;trace(lag+tail*u);ctx.globalAlpha=power*.36*Math.pow(1-u,1.25);
          ctx.strokeStyle=body;ctx.lineWidth=tail/23*1.2+.4;ctx.stroke();
        }
        trace(lag);ctx.globalAlpha=power*.7;ctx.strokeStyle=body;ctx.lineWidth=8;ctx.stroke();
        ctx.globalAlpha=power*.9;ctx.strokeStyle=crest;ctx.lineWidth=2;ctx.stroke();
      }
      ctx.restore();
      for(let mote=0;mote<3;mote++){
        const travel=(age*.8+seed+mote*23)%85,xx=x+(mote-1)*half*.4;
        ctx.globalAlpha=strength*(1-travel/85)*.45;block(ctx,xx,height*.65+travel,3+mote,3+mote,body);
      }
    }
    ctx.restore();
  }
  // Condensation falls beside the viewport; solar cinders rise from its lower corners.
  for(let i=0;i<28;i++){
    const side=i%2,travel=(age*(1+i%4*.4)+i*43)%(height+80),x=side?width-(18+i%5*22):18+i%5*22;
    const y=cold?travel-40:height+40-travel;
    ctx.globalAlpha=strength*(.25+i%3*.12);block(ctx,x,y,3+i%2,6+i%4*3,i%3?color:pale);
  }
  ctx.restore();
}

export function drawSunAtmosphere(ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number, tick: number) {
  const sun = state.sun; if (!sun) return;
  const heat = sun.heat / 100, cold = sun.quenchedTicks > 0;
  ctx.save();
  const quenchAge = SUN.quenchTicks - sun.quenchedTicks;
  if (cold && quenchAge < 150) drawThermalRelease(ctx,width,height,quenchAge,true);
  ctx.globalAlpha = 1;
  const impact = sun.ripples.reduce((strongest, ripple) => ripple.empowered
    ? Math.max(strongest, Math.max(0, (ripple.ticks - (SUN.waveVisualTicks-8)) / 8)) : strongest, 0);
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
  if (sun.eruptionTicks > 0) drawThermalRelease(ctx,width,height,90-sun.eruptionTicks,false);
  ctx.restore();
}
