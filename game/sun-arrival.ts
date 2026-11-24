import { drawCelestialBodyIcon } from './celestial-body-art';
import { TILE_SIZE, T_FLOOR, T_WALL } from './constants';
import { drawFieryKingModel, drawSunBackdrop, drawSunCover, drawSunFloorTile } from './sun-art';
import { GEM_CUTS, gemMaterial } from './gemstone-cuts';
import { W, H, CRUISE_CHARGE_SOUND, type Ctx, type CutsceneCue, block, caption, cueArrivalApproach, discBands, ease, hash, nebula, ship, span, stars } from './cutscene-art';

export const SUN_ARRIVAL_DURATION = 11.8;
const BOOST_AT = .12;
const CRUISE_END = 4.1, TOUCHDOWN = 7.05, REVEAL = 7.35;
const DOCK_X = 492, DOCK_Y = 483;
const GOLD = '#ffd35c';
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const FORGE_PLAN = [
  '    ##....##    ',
  '  ###......###  ',
  ' ##..........## ',
  ' #............# ',
  '##..#......#..##',
  '#..............#',
  ' ##..........## ',
  '   .........#   ',
  '   #.......##   ',
];
const OPEN_SPACE = -1;
const forge = { sun: null, map: FORGE_PLAN.map(row => Array.from(row, cell => cell === ' ' ? OPEN_SPACE : cell === '#' ? T_WALL : T_FLOOR)) };

function drawForgeCourt(ctx: Ctx, tick: number) {
  const x0 = 256, y0 = 119, width = 16 * TILE_SIZE, height = FORGE_PLAN.length * TILE_SIZE;
  const occupied = (x: number, y: number) => (forge.map[y]?.[x] ?? OPEN_SPACE) !== OPEN_SPACE;
  const edges: [number, number, number, number][] = [];
  for (let y = 0; y < forge.map.length; y++) for (let x = 0; x < forge.map[y].length; x++) {
    if (!occupied(x, y)) continue;
    const dx = x0 + x * TILE_SIZE, dy = y0 + y * TILE_SIZE;
    const right = dx + TILE_SIZE, bottom = dy + TILE_SIZE;
    if (forge.map[y][x] === T_WALL) drawSunCover(ctx, forge, x, y, dx, dy, tick);
    else drawSunFloorTile(ctx, forge, x, y, dx, dy, tick);
    if (!occupied(x, y - 1)) edges.push([dx, dy, right, dy]);
    if (!occupied(x + 1, y)) edges.push([right, dy, right, bottom]);
    if (!occupied(x, y + 1)) edges.push([right, bottom, dx, bottom]);
    if (!occupied(x - 1, y)) edges.push([dx, bottom, dx, dy]);
  }
  const trim = ctx.createLinearGradient(x0, y0, x0 + width, y0 + height);
  trim.addColorStop(0, '#ffd35c'); trim.addColorStop(1, '#ff727e');
  ctx.strokeStyle = trim; ctx.lineWidth = 2;
  ctx.shadowColor = '#ff9056'; ctx.shadowBlur = 8;
  ctx.beginPath();
  for (const [ax, ay, bx, by] of edges) {
    ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// The Sun on approach, drawn exactly like its star-map icon (celestial-body-art.ts), with a warm halo.
function solarDisc(ctx: Ctx, x: number, y: number, r: number, t: number) {
  const glow = ctx.createRadialGradient(x, y, r * .8, x, y, r * 1.55);
  glow.addColorStop(0, '#ff631c48'); glow.addColorStop(1, '#ff631c00');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); drawCelestialBodyIcon(ctx, 'sun', r, t); ctx.restore();
}

function solarWind(ctx: Ctx, t: number, strength: number) {
  ctx.save();
  for (let i = 0; i < 34; i++) {
    const x = W - (hash(i, 61) * W + t * (120 + 230 * hash(i, 62))) % W;
    const y = 90 + hash(i, 63) * 520;
    ctx.globalAlpha = strength * (.14 + hash(i, 64) * .46);
    block(ctx, x, y, 5 + hash(i, 65) * 48, 2 + i % 4, i % 3 ? '#ff8541' : '#ffe4a8');
  }
  ctx.restore();
}

function rewardGem(ctx: Ctx, x: number, y: number, t: number) {
  const material = gemMaterial('fiery_king', '#f52b50');
  const outline = new Path2D(GEM_CUTS.cushion[0]), table = new Path2D(GEM_CUTS.cushion[1]);
  ctx.save(); ctx.translate(x, y + Math.sin(t * 3) * 4); ctx.scale(1.28, 1.28); ctx.translate(-40, -34);
  ctx.shadowColor = material.rim; ctx.shadowBlur = 18;
  ctx.fillStyle = material.rim; ctx.fill(outline); ctx.shadowBlur = 0;
  ctx.save(); ctx.translate(40, 34); ctx.scale(.82, .82); ctx.translate(-40, -34);
  ctx.fillStyle = material.shade; ctx.fill(outline); ctx.restore();
  ctx.fillStyle = material.body; ctx.fill(table);
  block(ctx, 25, 21, 5, 14, material.light); block(ctx, 30, 21, 9, 4, material.light);
  block(ctx, 35, 27, 10, 14, material.core);
  ctx.globalAlpha = .55 + .45 * Math.sin(t * 5);
  block(ctx, 54, 11, 12, 3, material.core); block(ctx, 58, 7, 3, 11, material.core);
  ctx.restore();
}

function drawForgeGuardian(ctx: Ctx, t: number, tick: number, advance: number) {
  block(ctx, 561, 160, 158, 73, '#100d16');
  block(ctx, 568, 164, 144, 62, '#30252d');
  block(ctx, 568, 164, 144, 3, '#edc080');
  block(ctx, 590, 221, 100, 4, '#d88d4e');
  rewardGem(ctx, 640, 188, t);
  ctx.save();
  ctx.translate(640, 306 + advance * 31);
  ctx.scale(1.45 + advance * .17, 1.45 + advance * .17);
  drawFieryKingModel(ctx, 0, 0, 74, tick, advance > .65);
  ctx.restore();
}

export function drawSunArrivalFrame(ctx: Ctx, t: number, cue: CutsceneCue, letterbox = true) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  block(ctx, 0, 0, W, H, '#070617');
  if (t < CRUISE_END) {
    // Cruise: the Sun resolves from a distant light as the ship closes in.
    const p = span(t, BOOST_AT, CRUISE_END), close = p ** 1.6;
    const ignition = ease(span(t, BOOST_AT, BOOST_AT + .3));
    nebula(ctx, t * 45, 0);
    stars(ctx, t * 270, 0, t, .5 + p * .65);
    solarDisc(ctx, mix(976, 910, close), mix(303, 340, close), mix(49, 222, close), t);
    solarWind(ctx, t, close * .65);
    ship(ctx, 185 + p * 385, 412 - p * 45 + Math.sin(t * 4) * 6, t, 1.2 * ignition, -.08 + Math.sin(t * 4) * .035, 1.45);
    caption(ctx, 'COURSE SET FOR THE SUN', 568, ease(span(t, .55, 1.2)) * (1 - span(t, 3.35, 4)), 16, '#ffca8c');
  } else if (t < REVEAL) {
    // Wide view of the same court and berth seen in the guardian shot.
    const p = ease(span(t, CRUISE_END, TOUCHDOWN)), tick = Math.floor(t * 60);
    const centerX = mix(950, 720, p), centerY = mix(368, 342, p);
    const zoom = mix(.28, .48, p);
    drawSunBackdrop(ctx, forge, W, H, t * 14 + 260 * (1 - p), 0, tick);
    ctx.save();
    ctx.translate(centerX, centerY); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    drawForgeCourt(ctx, tick);
    drawForgeGuardian(ctx, t, tick, 0);
    ctx.restore();
    const dockX = centerX + (DOCK_X - W / 2) * zoom, dockY = centerY + (DOCK_Y - H / 2) * zoom;
    const braking = ease(span(t, 5.85, TOUCHDOWN));
    ship(ctx, dockX - 650 * (1 - p), dockY - 150 * (1 - p), t, 1 - braking, .22 * (1 - p), mix(1.7, 1.08 * zoom, p));
    caption(ctx, 'SOLAR FORGE', 565, ease(span(t, 4.65, 5.15)) * (1 - span(t, 6.75, 7.32)), 22, GOLD);
  } else {
    // Close view: the player advances from the ship, and the King bars the way to the Ruby.
    const step = ease(span(t, 7.75, 9.4)), advance = ease(span(t, 9.15, 10.45));
    const zoom = 1 + ease(span(t, 7.4, 11.5)) * .08;
    const tick = Math.floor(t * 60);
    drawSunBackdrop(ctx, forge, W, H, t * 14, 0, tick);
    ctx.save(); ctx.translate(W / 2, 360); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -360);
    drawForgeCourt(ctx, tick);
    drawForgeGuardian(ctx, t, tick, advance);
    ship(ctx, DOCK_X, DOCK_Y, t, 0, 0, 1.08);
    const px = mix(510, 640, step), py = mix(484, 450, step);
    block(ctx, px - 18, py - 18, 36, 36, '#d8d870');
    block(ctx, px - 14, py - 14, 28, 28, '#a0a040');
    block(ctx, px - 10, py - 12, 20, 10, '#44ccff');
    block(ctx, px - 8, py - 11, 8, 3, '#c7f2ff');
    ctx.restore();
    caption(ctx, 'FIERY KING', 587, ease(span(t, 8.7, 9.45)), 23, '#ffb56a');
    caption(ctx, 'GUARDIAN OF THE RUBY', 619, ease(span(t, 9.1, 9.8)), 13, '#ffd0a4');
  }

  cue('burn', BOOST_AT, t, '/sounds/speedBoost.mp3', .45);
  if (t < CRUISE_END) cue('cruise', .5, t, CRUISE_CHARGE_SOUND, 1);
  if (t >= CRUISE_END && t < REVEAL) cueArrivalApproach(cue, t, CRUISE_END, 7);
  cue('guardian', 9.15, t, '/sounds/kingFireWarning.wav', .55);
  if (letterbox) {
    block(ctx, 0, 0, W, 70, '#000');
    block(ctx, 0, H - 70, W, 70, '#000');
  }
  // Fade through black at each camera cut and into the challenge.
  ctx.globalAlpha = Math.max(1 - ease(span(t, 0, .28)), 1 - ease(Math.abs(t - CRUISE_END) / .3),
    1 - ease(Math.abs(t - REVEAL) / .3), ease(span(t, 11.1, SUN_ARRIVAL_DURATION)));
  block(ctx, 0, 0, W, H, '#000');
  ctx.restore();
  return 0;
}
