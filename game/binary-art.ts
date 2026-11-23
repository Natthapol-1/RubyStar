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
  // Collisions split into paired magnetic pressure fronts, with transparent motion sheets.
  for(const collision of b.collisions??[])if(collision.small)drawBinaryCollision(ctx,collision.x-camX,collision.y-camY,1-collision.ticks/50,true);
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

/** Open halves leave a pale seam between the two opposing magnetic colors. */
function traceBinaryPressure(ctx:CanvasRenderingContext2D,r:number,side:number){
  ctx.beginPath();ctx.moveTo(side*r*.06,-r);ctx.lineTo(side*r*.6,-r);ctx.lineTo(side*r*.6,-r*.76);
  ctx.lineTo(side*r,-r*.76);ctx.lineTo(side*r,r*.76);ctx.lineTo(side*r*.6,r*.76);ctx.lineTo(side*r*.6,r);ctx.lineTo(side*r*.06,r);
}
function drawBinaryCollision(ctx:CanvasRenderingContext2D,x:number,y:number,p:number,small:boolean,reach=410){
  const wide=reach>410,scale=reach/410;
  const fade=.5+.5*Math.cos(p*Math.PI),[coral,blue]=BINARY_TWIN_COLORS;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));if(small)ctx.scale(.45,.45);ctx.shadowBlur=0;ctx.lineJoin='miter';
  if(!small){
    // Twin light overlaps, rather than becoming a white screen or a raised panel.
    for(const [side,color]of [[-1,coral],[1,blue]] as const){
      const wash=ctx.createRadialGradient(side*55,0,0,side*55,0,reach*1.1);
      wash.addColorStop(0,color+(wide?'80':'50'));wash.addColorStop(.5,color+(wide?'30':'18'));wash.addColorStop(1,color+'00');
      ctx.globalAlpha=fade;ctx.fillStyle=wash;ctx.fillRect(-reach*1.3,-reach*1.3,reach*2.6,reach*2.6);
    }
  }
  for(let echo=0;echo<(wide?5:4);echo++){
    const q=p-echo*.065;if(q<0)continue;
    const r=18+Math.min(1,q*1.55)*reach,strength=fade*(1-echo*.19),tail=Math.min(r*.4,wide?125:70);
    for(const side of [-1,1]){
      const color=side<0?coral:blue,pale=side<0?'#ffe1d6':'#e2f5ff';
      for(let sheet=17;sheet>=0;sheet--){
        const u=sheet/17;traceBinaryPressure(ctx,r-tail*u,side);
        ctx.globalAlpha=strength*.32*Math.pow(1-u,1.2);ctx.strokeStyle=color;ctx.lineWidth=tail/17+1;ctx.stroke();
      }
      traceBinaryPressure(ctx,r,side);ctx.globalAlpha=strength*.72;ctx.strokeStyle=color;ctx.lineWidth=echo?(wide?18:12):(wide?34:22);ctx.stroke();
      ctx.globalAlpha=strength*.95;ctx.strokeStyle=pale;ctx.lineWidth=echo?2:wide?5:4;ctx.stroke();
    }
  }
  for(let i=0;i<(wide?88:48);i++){
    const a=i*2.39996,d=22+(1-(1-p)*(1-p))*(95+i%6*33)*scale,size=(wide?4:3)+i%4*2;
    const px=Math.cos(a)*d,py=Math.sin(a)*d,color=i%2?coral:blue;
    ctx.save();ctx.translate(px,py);ctx.rotate(a+p*.6);
    const traceShard=()=>{
      ctx.beginPath();
      if(i%3===0){ctx.moveTo(-size,0);ctx.lineTo(-size*.18,-size*.3);ctx.lineTo(size*.75,0);ctx.lineTo(size*.1,size*.3);}
      else{ctx.moveTo(-size,-size*.35);ctx.lineTo(size*.4,-size*.35);ctx.lineTo(size,size*.18);ctx.lineTo(size*.15,size*.18);ctx.lineTo(-size*.15,size*.6);ctx.lineTo(-size,size*.6);}
      ctx.closePath();
    };
    ctx.save();ctx.translate(-4,2);ctx.globalAlpha=fade*.14;ctx.fillStyle=color;traceShard();ctx.fill();ctx.restore();
    ctx.globalAlpha=fade*.48;ctx.fillStyle=color;traceShard();ctx.fill();
    ctx.globalAlpha=fade*.55;ctx.strokeStyle=i%2?'#ffe4d9':'#e4f5ff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-size*.8,-size*.28);ctx.lineTo(size*.35,-size*.28);ctx.stroke();ctx.restore();
    if(i%2===0){const shine=Math.pow(Math.max(0,Math.sin(p*24+i*1.7)),4);ctx.globalAlpha=fade*(.1+shine*.65);ctx.fillStyle='#f1f8ff';ctx.fillRect(px-4,py,9,1);ctx.fillRect(px,py-4,1,9);}
  }
  const flash=Math.max(0,1-p/.25);
  for(const side of [-1,1]){
    ctx.globalAlpha=flash*.55;ctx.fillStyle=side<0?coral:blue;ctx.fillRect(side<0?-29:17,-14,12,28);
    ctx.globalAlpha=flash*.8;ctx.fillStyle='#f5faff';ctx.fillRect(side<0?-29:17,-14,12,3);ctx.fillRect(side<0?-29:17,11,12,3);
  }
  ctx.restore();
}

/** Full twin collisions fill every camera view; Lodestones retain their small world-space burst. */
export function drawBinaryCollisionScreen(ctx:CanvasRenderingContext2D,s:Readonly<GameState>,w:number,h:number,camX:number,camY:number,zoom=1){
  for(const collision of s.binary?.collisions??[]){
    if(collision.small)continue;
    const p=1-collision.ticks/90,fade=.5+.5*Math.cos(p*Math.PI),px=(collision.x-camX)*zoom,py=(collision.y-camY)*zoom;
    const dx=px-w/2,dy=py-h/2,outside=px<0||px>w||py<0||py>h;
    const edge=outside?Math.min(w/2/Math.abs(dx),h/2/Math.abs(dy)):1,x=outside?w/2+dx*edge:px,y=outside?h/2+dy*edge:py;
    const reach=Math.max(...[[0,0],[w,0],[0,h],[w,h]].map(([cx,cy])=>Math.hypot(cx-x,cy-y)))*1.06;
    ctx.save();ctx.shadowBlur=0;
    const tint=ctx.createLinearGradient(0,0,w,0);tint.addColorStop(0,'#ff8f7a');tint.addColorStop(.48,'#b7b5dc');tint.addColorStop(1,'#8fb8ff');
    ctx.globalAlpha=fade*.18;ctx.fillStyle=tint;ctx.fillRect(0,0,w,h);
    drawBinaryCollision(ctx,x,y,p,false,Math.max(420,reach));
    // Layered magnetic corner contacts frame the screen without large raised plates.
    for(const side of [-1,1])for(const vertical of [-1,1]){
      const cx=side<0?12:w-12,cy=vertical<0?12:h-12,color=side<0?BINARY_TWIN_COLORS[0]:BINARY_TWIN_COLORS[1];
      for(let layer=2;layer>=0;layer--){
        const inset=layer*10,span=30+Math.min(1,p*5)*55;
        ctx.globalAlpha=fade*(layer?.12:.65);ctx.strokeStyle=color;ctx.lineWidth=layer?12:5;
        ctx.beginPath();ctx.moveTo(cx-side*span,cy-vertical*inset);ctx.lineTo(cx-side*inset,cy-vertical*inset);ctx.lineTo(cx-side*inset,cy-vertical*span);ctx.stroke();
      }
    }
    ctx.restore();
  }
}

/** Your current pole: a square frame in its colour around the player, flaring when you swap. */
export function drawPoleFrame(ctx: CanvasRenderingContext2D, s: GameState, x: number, y: number, pole = s.binary?.pole) {
  const b=s.binary;if(!b||!pole)return;
  const c=POLE_COLORS[pole],pale=POLE_PALE[pole],flare=Math.min(1,b.swapFlashTicks/BINARY.swapVisualTicks),r=30+flare*10;
  x=Math.round(x);y=Math.round(y);ctx.save();ctx.translate(x,y);ctx.shadowBlur=0;ctx.lineJoin='miter';
  // The player's pole remains a square instrument frame, with a soft inward light sheet.
  for(let sheet=7;sheet>=0;sheet--){
    const inset=sheet*1.2;ctx.globalAlpha=(.055+flare*.02)*(1-sheet/8);ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.strokeRect(-r+inset,-r+inset,(r-inset)*2,(r-inset)*2);
  }
  ctx.globalAlpha=.5+flare*.3;ctx.strokeStyle=c;ctx.lineWidth=5;ctx.strokeRect(-r,-r,r*2,r*2);
  // Swapping lights the existing square rim, with colored shoulders and a pale core.
  if(flare>0){
    ctx.save();ctx.globalCompositeOperation='lighter';
    for(const [width,alpha]of [[10,.012],[8,.03],[6,.1]]){
      ctx.globalAlpha=Math.pow(flare,1.25)*alpha;ctx.strokeStyle=c;ctx.lineWidth=width;ctx.strokeRect(-r,-r,r*2,r*2);
    }
    ctx.globalAlpha=Math.pow(flare,1.25)*.95;ctx.strokeStyle=pale;ctx.lineWidth=3.8;ctx.shadowColor=c;ctx.shadowBlur=0;ctx.strokeRect(-r,-r,r*2,r*2);
    ctx.restore();
  }
  for(const [sx,sy]of [[-1,-1],[1,-1],[-1,1],[1,1]]){
    ctx.globalAlpha=.65+flare*.25;ctx.fillStyle=pale;ctx.fillRect(sx*r-3,sy*r-3,6,6);
  }
  if(b.swapFlashTicks>0){
    const p=1-flare,ease=1-(1-p)*(1-p),other=pole==='north'?'south':'north';
    // Soft square light surrounds the ship, without solid side contacts over its model.
    for(let sheet=15;sheet>=0;sheet--){
      const u=sheet/15,extent=24+u*31;
      ctx.globalAlpha=flare*.035*Math.pow(1-u,1.35);ctx.strokeStyle=c;ctx.lineWidth=2.6;ctx.strokeRect(-extent,-extent,extent*2,extent*2);
    }
    // Broad horseshoe rails reverse past each other with a short translucent magnetic wake.
    for(let side=0;side<2;side++){
      const col=side?POLE_COLORS[other]:c,tip=side?POLE_PALE[other]:pale;
      ctx.save();ctx.rotate((side?Math.PI:0)+(pole==='north'?1:-1)*ease*Math.PI*.7);
      const d=40+ease*40,h=22+ease*12;
      const trace=(offset:number)=>{ctx.beginPath();ctx.moveTo(-d+18,-h-offset*.25);ctx.lineTo(-d-offset,-h-offset*.25);ctx.lineTo(-d-offset,h+offset*.25);ctx.lineTo(-d+18,h+offset*.25);};
      for(let sheet=11;sheet>=0;sheet--){const u=sheet/11;trace(u*20);ctx.globalAlpha=flare*.3*Math.pow(1-u,1.2);ctx.strokeStyle=col;ctx.lineWidth=2.5;ctx.stroke();}
      trace(0);ctx.globalAlpha=flare*.85;ctx.strokeStyle=col;ctx.lineWidth=7;ctx.stroke();
      ctx.globalAlpha=flare*.9;ctx.strokeStyle=tip;ctx.lineWidth=2;ctx.stroke();
      ctx.fillStyle=tip;ctx.fillRect(-d+12,-h-3,9,6);ctx.fillRect(-d+12,h-3,9,6);ctx.restore();
    }
    for(let i=0;i<36;i++){
      const outgoing=i%2===0,t=(p+i%5*.12)%1,a=i*2.39996+(outgoing?ease:-ease)*.65,d=outgoing?32+t*90:28+(1-t)*90;
      const alpha=flare*Math.sin(Math.PI*t),size=3+i%3*2;
      ctx.save();ctx.rotate(a);ctx.globalAlpha=alpha*.18;ctx.fillStyle=outgoing?c:POLE_COLORS[other];ctx.fillRect(d-3,-size/2+2,size,size);
      ctx.globalAlpha=alpha*.6;ctx.fillRect(d,-size/2,size,size);
      if(i%5===0){ctx.globalAlpha=alpha*.8;ctx.fillStyle=outgoing?pale:POLE_PALE[other];ctx.fillRect(d-3,0,9,1);ctx.fillRect(d+1,-4,1,9);}ctx.restore();
    }

  }
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
// Pulsar: a pulsing star, kept unlike the horned Lodestone. A small upright square body in its pole's colour with a
// dark inset, pale eyes and a white core that swells with its beat, and four short ray blocks, one on each side, that
// push out and pull back with the beat (staggered, like the full-energy aura's cardinal rays).
function drawPulsar(ctx: CanvasRenderingContext2D, e: Readonly<Enemy>, sx: number, sy: number, tick: number) {
  const pole = e.pole!, c = POLE_COLORS[pole], dark = POLE_DARK[pole], pale = POLE_PALE[pole], flash = e.flashTicks > 0;
  const x = Math.round(sx), y = Math.round(sy) + Math.floor(tick / 8 + e.id) % 2, beat = Math.abs(Math.sin(tick * .18 + e.id));
  ctx.save(); ctx.translate(x, y);
  // four cardinal rays: a solid bar with a pale tip, the side pair a little behind the top/bottom pair
  for (const [dx, dy, lag] of [[0, -1, 0], [0, 1, 0], [-1, 0, .5], [1, 0, .5]] as const) {
    const b = Math.abs(Math.sin(tick * .18 + e.id + lag)), len = 4 + Math.round(b * 6), at = 13;
    const rx = dx ? (dx > 0 ? at : -at - len) : -2, ry = dy ? (dy > 0 ? at : -at - len) : -2;
    const w = dx ? len : 4, h = dy ? len : 4;
    ctx.fillStyle = flash ? '#ffffff' : c; ctx.fillRect(rx, ry, w, h);
    ctx.fillStyle = flash ? '#ffffff' : pale; ctx.fillRect(dx > 0 ? rx + w - 2 : rx, dy > 0 ? ry + h - 2 : ry, dx ? 2 : w, dy ? 2 : h);
  }
  // the body
  ctx.shadowColor = c; ctx.shadowBlur = 5; ctx.fillStyle = flash ? '#ffffff' : c; ctx.fillRect(-11, -11, 22, 22); ctx.shadowBlur = 0;
  if (!flash) {
    ctx.fillStyle = dark; ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = pale; ctx.fillRect(-6, -5, 3, 3); ctx.fillRect(3, -5, 3, 3); // eyes
    const k = 1 + Math.round(beat * 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(-k, 3 - k, k * 2, k * 2); // core, swelling with the beat
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
