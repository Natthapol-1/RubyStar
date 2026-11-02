import { BOSS_TYPES, ENEMY_CONFIGS, TILE_SIZE, type BossType } from './constants';
import type { Enemy } from './engine';

// The Endless regular-alien bar, shared by every world's non-boss units.
export function drawEnemyHealthBar(ctx:CanvasRenderingContext2D,e:Readonly<Enemy>,x:number,y:number){
  if(!Number.isFinite(e.hp)||!Number.isFinite(e.maxHp)||e.maxHp<=0||e.hp<=0||e.hp>=e.maxHp||BOSS_TYPES.includes(e.type as BossType))return;
  const size=Math.floor(TILE_SIZE*ENEMY_CONFIGS[e.type].bodyFraction),half=size/2;
  const antenna=Math.max(3,Math.floor(size*.28)),dot=3;
  const width=size+4,height=Math.max(5,Math.floor(size*.13));
  const bx=x-width/2,by=y-half-antenna-dot-height-3,pct=Math.max(0,Math.min(1,e.hp/e.maxHp));
  ctx.save();ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.filter='none';
  ctx.fillStyle='#330000';ctx.fillRect(bx,by,width,height);
  ctx.fillStyle=pct>.5?'#00cc44':pct>.25?'#ffaa00':'#ff3300';ctx.fillRect(bx,by,width*pct,height);
  ctx.strokeStyle='#ffffff22';ctx.lineWidth=1;ctx.strokeRect(bx,by,width,height);ctx.restore();
}
