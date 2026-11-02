import {TILE_SIZE,T_WALL} from './constants';
import type {GameState} from './engine';

// Shared floor tiles for the celestial Singularity and Obsidian's smaller wells.
export function drawSingularityFieldTiles(ctx:CanvasRenderingContext2D,map:GameState['map'],x:number,y:number,radius:number,camX:number,camY:number,tick:number,fade:number){
 const centerX=Math.floor(x/TILE_SIZE),centerY=Math.floor(y/TILE_SIZE),extent=Math.ceil(radius);
 const affected=(dx:number,dy:number)=>Math.hypot(dx,dy)<=radius&&(map[centerY+dy]?.[centerX+dx]??T_WALL)!==T_WALL;
 ctx.save();ctx.shadowBlur=0;
 for(let dy=-extent;dy<=extent;dy++)for(let dx=-extent;dx<=extent;dx++){
  if(!affected(dx,dy))continue;const tx=(centerX+dx)*TILE_SIZE-camX,ty=(centerY+dy)*TILE_SIZE-camY;
  ctx.globalAlpha=fade*(.09+.025*Math.abs(Math.sin(tick*.04)));ctx.fillStyle='#b1b1c1';ctx.fillRect(tx+1,ty+1,TILE_SIZE-2,TILE_SIZE-2);
  const pulse=.5+.5*Math.sin(tick*.065-(Math.abs(dx)+Math.abs(dy))*.9);ctx.globalAlpha=fade*(.4+pulse*.25);ctx.fillStyle='#a1a1b1';
  if(!affected(dx-1,dy))ctx.fillRect(tx,ty,4,TILE_SIZE);if(!affected(dx+1,dy))ctx.fillRect(tx+TILE_SIZE-4,ty,4,TILE_SIZE);
  if(!affected(dx,dy-1))ctx.fillRect(tx,ty,TILE_SIZE,4);if(!affected(dx,dy+1))ctx.fillRect(tx,ty+TILE_SIZE-4,TILE_SIZE,4);
 }
 ctx.restore();
}
