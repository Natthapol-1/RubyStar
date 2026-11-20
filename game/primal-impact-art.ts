import { CHAMBER_BOUNDS, MAP_COLS, MAP_ROWS, TILE_SIZE, T_FLOOR } from './constants';
import type { GameState } from './engine';

/** Cosmetic pressure front: crosses all chambers without changing damage or simulation. */
export function drawPrimalAftershock(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, chamber: number, age: number, color: string, core: string) {
  const [r1,c1,r2,c2]=CHAMBER_BOUNDS[chamber],s=TILE_SIZE;
  const cx=(c1+c2+1)*s/2,cy=(r1+r2+1)*s/2;
  const reach=Math.max(...[[0,0],[MAP_COLS*s,0],[0,MAP_ROWS*s],[MAP_COLS*s,MAP_ROWS*s]].map(([x,y])=>Math.hypot(x-cx,y-cy)));
  ctx.save();
  // The blast visibly crosses open space as well as floor, so distant chambers feel the impact.
  // These bands and fragments are cosmetic; they never add damage or scorching.
  for(let echo=0;echo<3;echo++) {
    const p=(age-6-echo*9)/95;if(p<=0||p>=1)continue;
    const r=p*reach,fade=Math.min(1,(1-p)*5)*(1-echo*.26),x=cx-camX,y=cy-camY;
    const shoulder=.44*r;
    ctx.beginPath();
    ctx.moveTo(x-shoulder,y-r);ctx.lineTo(x+shoulder,y-r);
    ctx.lineTo(x+shoulder,y-r*.78);ctx.lineTo(x+r*.78,y-r*.78);
    ctx.lineTo(x+r*.78,y-shoulder);ctx.lineTo(x+r,y-shoulder);
    ctx.lineTo(x+r,y+shoulder);ctx.lineTo(x+r*.78,y+shoulder);
    ctx.lineTo(x+r*.78,y+r*.78);ctx.lineTo(x+shoulder,y+r*.78);
    ctx.lineTo(x+shoulder,y+r);ctx.lineTo(x-shoulder,y+r);
    ctx.lineTo(x-shoulder,y+r*.78);ctx.lineTo(x-r*.78,y+r*.78);
    ctx.lineTo(x-r*.78,y+shoulder);ctx.lineTo(x-r,y+shoulder);
    ctx.lineTo(x-r,y-shoulder);ctx.lineTo(x-r*.78,y-shoulder);
    ctx.lineTo(x-r*.78,y-r*.78);ctx.lineTo(x-shoulder,y-r*.78);ctx.closePath();
    ctx.lineJoin='miter';ctx.strokeStyle=color;
    ctx.globalAlpha=fade*.12;ctx.lineWidth=80;ctx.stroke();
    ctx.globalAlpha=fade*.65;ctx.lineWidth=18;ctx.stroke();
    ctx.globalAlpha=fade*.85;ctx.strokeStyle=core;ctx.lineWidth=5;ctx.stroke();
    if(echo===0)for(let i=0;i<56;i++) {
      const a=i*2.39996,travel=r*(.85+i%4*.05);
      ctx.save();ctx.translate(x+Math.cos(a)*travel,y+Math.sin(a)*travel);ctx.rotate(a);
      ctx.globalAlpha=fade*.65;ctx.fillStyle=i%3?color:core;
      ctx.fillRect(-24-i%5*10,-3,32+i%5*14,5+i%3*2);ctx.restore();
    }
  }
  for(let echo=0;echo<2;echo++) {
    const p=(age-8-echo*10)/95;if(p<=0||p>=1)continue;
    const radius=p*reach,fade=Math.min(1,(1-p)*4);
    for(let y=0;y<MAP_ROWS;y++)for(let x=0;x<MAP_COLS;x++) {
      if(state.map[y]?.[x]!==T_FLOOR)continue;
      const d=Math.hypot((x+.5)*s-cx,(y+.5)*s-cy),band=Math.max(0,1-Math.abs(d-radius)/(s*1.7));
      if(band<=0)continue;
      ctx.globalAlpha=band*fade*(echo?.15:.35);ctx.fillStyle=color;
      ctx.fillRect(Math.round(x*s-camX+3),Math.round(y*s-camY+3),s-6,s-6);
      ctx.globalAlpha=band*band*fade*(echo?.25:.65);ctx.fillStyle=core;
      ctx.fillRect(Math.round(x*s-camX+8),Math.round(y*s-camY+s/2),s-16,3);
    }
  }
  // Chunky radiant fragments emphasize the initial room impact.
  const burst=Math.max(0,1-age/58);
  for(let i=0;i<40&&burst>0;i++) {
    const a=i*2.39996,r=age*(4+i%7),x=cx+Math.cos(a)*r-camX,y=cy+Math.sin(a)*r-camY;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);
    ctx.globalAlpha=burst*(i%3?.65:.9);ctx.fillStyle=i%3?color:core;
    ctx.fillRect(0,-3,12+i%5*8,4+i%3*2);ctx.restore();
  }
  ctx.restore();
}
