import { drawGaiaOverlay } from './gaia-art';
import { drawThornGround } from './thorn-art';
import { THORN_WINDUP, THORN_LIFETIME, T_FLOOR, CHAMBER_BOUNDS, TILE_SIZE, GAIA_SUN_WARNING } from './constants';
import type { GameState, Enemy } from './engine';
// Player and Ruby silhouettes used by the challenge rule illustrations.
export function drawGuidePlayer(ctx:CanvasRenderingContext2D,x:number,y:number,size=20) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  ctx.shadowColor='#ffe14a';ctx.shadowBlur=4;ctx.fillStyle='#fff07a';ctx.fillRect(-size/2,-size/2,size,size);ctx.shadowBlur=0;
  ctx.fillStyle='#e8c93a';ctx.fillRect(-size/2+4,-size/2+4,size-8,size-8);
  ctx.fillStyle='#48c8ff';ctx.fillRect(-size/4,0,size/2,Math.round(size*.2));ctx.restore();
}
export function drawGuideRuby(ctx:CanvasRenderingContext2D,x:number,y:number) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowColor='#ff4d7a';ctx.shadowBlur=5;
  ctx.fillStyle='#e8326a';ctx.fillRect(-11,-11,22,22);ctx.shadowBlur=0;
  ctx.fillStyle='#a8183f';ctx.fillRect(-7,-7,14,14);ctx.fillStyle='#ff6a8f';ctx.fillRect(-4,-4,8,8);
  ctx.fillStyle='#ffd0dc';ctx.fillRect(-9,-9,5,5);ctx.restore();
}

// Simplified attacks keep the normal player's cyan outer light and pale cyan/white core.
export function drawGuideLaser(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, ticks = 18) {
  ctx.save(); ctx.lineCap = 'butt';
  for (const [width, color, alpha] of [[9, '#44ddff', .3], [4, '#aaffff', .85], [1, '#ffffff', 1]] as const) {
    ctx.globalAlpha = Math.min(1, ticks / 18) * alpha; ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  ctx.restore();
}
export function drawGuideBullet(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(Math.atan2(dy, dx));
  ctx.globalAlpha = .3; ctx.fillStyle = '#44ddff'; ctx.fillRect(-12, -5, 20, 10);
  ctx.globalAlpha = .8; ctx.fillRect(-9, -3, 15, 6);
  ctx.globalAlpha = 1; ctx.fillStyle = '#aaffff'; ctx.fillRect(-5, -1, 10, 2);
  ctx.restore();
}

// The same locked warning, overhead seed and impact used by the Weaver, at card scale.
export function drawGuideThornDrop(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, tick: number) {
  const center = 144, landed = age >= THORN_WINDUP;
  const state = {
    map: Array.from({ length: 7 }, () => Array(7).fill(T_FLOOR)),
    enemies: landed ? [] : [{ type: 'thorn_weaver', hp: 1, thorn: { aimX: center, aimY: center, windupTicks: THORN_WINDUP - age } } as Enemy],
    thornPatches: landed ? [{ x: center, y: center, ticks: THORN_LIFETIME - (age - THORN_WINDUP) }] : [],
  } as unknown as GameState;
  ctx.save(); ctx.translate(x, y); ctx.scale(.32, .32);
  drawThornGround(ctx, state, center, center, tick);
  ctx.restore();
}

const sunfireFloor = Array.from({ length: 51 }, () => Array(51).fill(T_FLOOR));
export function drawGuideFullSunfire(ctx: CanvasRenderingContext2D, age: number, tick: number) {
  const [top, left, bottom, right] = CHAMBER_BOUNDS[0];
  const width = (right - left + 1) * TILE_SIZE, scale = 88 / width;
  const state = {
    map: sunfireFloor, enemies: [], rubyTileX: -1,
    gaia: { spores: [], bolts: [], stoneFlashes: [], snaredTicks: 0,
      sunfire: age < GAIA_SUN_WARNING ? { chamber: 0, ticks: GAIA_SUN_WARNING - age } : null,
      sunImpact: age >= GAIA_SUN_WARNING ? { chamber: 0, ticks: Math.max(0, 120 - (age - GAIA_SUN_WARNING)) } : null,
    },
  } as unknown as GameState;
  ctx.save(); ctx.translate(100, 18); ctx.scale(scale, scale);
  ctx.fillStyle = '#152017'; ctx.fillRect(0, 0, width, (bottom - top + 1) * TILE_SIZE);
  ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2 / scale; ctx.strokeRect(0, 0, width, width);
  drawGaiaOverlay(ctx, state, left * TILE_SIZE, top * TILE_SIZE, tick);
  ctx.restore();
}
