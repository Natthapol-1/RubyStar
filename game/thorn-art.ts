import { TILE_SIZE, T_WALL, THORN_RADIUS, THORN_WINDUP, THORN_LIFETIME, getThornFieldBounds } from './constants';
import type { GameState } from './engine';

export function drawThornGround(ctx: CanvasRenderingContext2D, state: GameState, camX: number, camY: number, tickN: number) {
  ctx.save();
  const areas = (state.thornPatches ?? []).map(p => ({ x: p.x, y: p.y, ticks: p.ticks, radius: p.radius ?? THORN_RADIUS, warning: false }));
  for (const e of state.enemies) {
    if (e.type === 'thorn_weaver' && e.hp > 0 && (e.thorn?.windupTicks ?? 0) > 0)
      areas.push({ x: e.thorn!.aimX, y: e.thorn!.aimY, ticks: e.thorn!.windupTicks, radius: THORN_RADIUS, warning: true });
    if (e.type === 'thorn_weaver' && e.hp > 0 && (e.thorn?.windupTicks ?? 0) > 0 && e.thorn!.aim2) // Gaia phase 3 twin cast
      areas.push({ x: e.thorn!.aim2.x, y: e.thorn!.aim2.y, ticks: e.thorn!.windupTicks, radius: THORN_RADIUS, warning: true });
  }
  for (const rawArea of areas) {
    const bounds=getThornFieldBounds(rawArea.x,rawArea.y,rawArea.radius),area={...rawArea,x:bounds.x,y:bounds.y};
    ctx.save();ctx.beginPath();
    for(let ty=bounds.top/TILE_SIZE;ty<bounds.bottom/TILE_SIZE;ty++)for(let tx=bounds.left/TILE_SIZE;tx<bounds.right/TILE_SIZE;tx++){
      if((state.map[ty]?.[tx]??T_WALL)!==T_WALL)ctx.rect(tx*TILE_SIZE-camX,ty*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE);
    }
    ctx.clip();
    const age = area.warning ? 0 : THORN_LIFETIME - area.ticks;
    const fade = area.warning ? 1 : Math.min(1, area.ticks / 90);
    const growth = area.warning ? 0 : Math.min(1, age / 24);
    const progress = area.warning ? 1 - area.ticks / THORN_WINDUP : 1;
    // A continuous translucent wash tints floor tiles, keeping walls clear and no grid seams.
    ctx.globalAlpha = fade * (area.warning ? .09 + progress * .05 : .26);
    ctx.fillStyle = area.warning ? '#b5bd50' : '#729d3d'; // the defence field shares the normal field's green
    for(let ty=bounds.top/TILE_SIZE;ty<bounds.bottom/TILE_SIZE;ty++){
      for(let tx=bounds.left/TILE_SIZE;tx<bounds.right/TILE_SIZE;tx++){
        if((state.map[ty]?.[tx] ?? T_WALL)!==T_WALL)ctx.fillRect(tx*TILE_SIZE-camX,ty*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE);
      }
    }
    // One simple thorn sprout per tile, matching the plain overgrowth style: a stem that grows in, then a pale tip.
    for(let ty=bounds.top/TILE_SIZE;!area.warning&&ty<bounds.bottom/TILE_SIZE;ty++)for(let tx=bounds.left/TILE_SIZE;tx<bounds.right/TILE_SIZE;tx++){
      if((state.map[ty]?.[tx]??T_WALL)===T_WALL)continue;
      const n=Math.sin(tx*127.1+ty*311.7)*43758.5453,h=n-Math.floor(n);
      const x=tx*TILE_SIZE-camX+12+Math.floor(h*22),y=ty*TILE_SIZE-camY+34,height=Math.round(18*growth);
      ctx.globalAlpha=fade;ctx.fillStyle='#4f8f3c';ctx.fillRect(x-3,y-height,6,height);
      ctx.fillStyle='#85c76a';ctx.fillRect(x+3,y-Math.round(height*.6),6,4);
      if(height>6){ctx.fillStyle='#e0f4a8';ctx.fillRect(x-2,y-height-4,4,4);}
    }
    // One luminous boundary marks the actual walkable hazard tiles.
    ctx.globalAlpha=fade*(area.warning?.6+progress*.3:.45);ctx.strokeStyle=area.warning?'#ffd68b':'#99cf68';ctx.shadowColor=area.warning?'#ffbc65':'#88bc45';ctx.shadowBlur=4;ctx.lineWidth=3;
    const floor=(tx:number,ty:number)=>tx>=bounds.left/TILE_SIZE&&tx<bounds.right/TILE_SIZE&&ty>=bounds.top/TILE_SIZE&&ty<bounds.bottom/TILE_SIZE&&(state.map[ty]?.[tx]??T_WALL)!==T_WALL;
    ctx.beginPath();
    for(let ty=bounds.top/TILE_SIZE;ty<bounds.bottom/TILE_SIZE;ty++)for(let tx=bounds.left/TILE_SIZE;tx<bounds.right/TILE_SIZE;tx++){
      if(!floor(tx,ty))continue;const x=tx*TILE_SIZE-camX,y=ty*TILE_SIZE-camY;
      if(!floor(tx-1,ty)){ctx.moveTo(x+1,y);ctx.lineTo(x+1,y+TILE_SIZE);}
      if(!floor(tx+1,ty)){ctx.moveTo(x+TILE_SIZE-1,y);ctx.lineTo(x+TILE_SIZE-1,y+TILE_SIZE);}
      if(!floor(tx,ty-1)){ctx.moveTo(x,y+1);ctx.lineTo(x+TILE_SIZE,y+1);}
      if(!floor(tx,ty+1)){ctx.moveTo(x,y+TILE_SIZE-1);ctx.lineTo(x+TILE_SIZE,y+TILE_SIZE-1);}
    }
    ctx.stroke();ctx.shadowBlur=0;
    if (area.warning) {
      const x = Math.round(area.x - camX), y = Math.round(area.y - camY), size = 14 + Math.round(progress * 10);
      ctx.globalAlpha = 0.7 + Math.sin(tickN * 0.15) * 0.2; ctx.strokeStyle = '#ffd68b'; ctx.lineWidth = 3;
      ctx.strokeRect(x - size, y - size, size * 2, size * 2);
      ctx.fillStyle = '#ffd68b'; ctx.fillRect(x - 2, y - 10, 4, 14); ctx.fillRect(x - 2, y + 8, 4, 4);
    }
    ctx.restore();
    // Airborne seed is drawn outside the ground clip so its descent starts above the field.
    if(area.warning && area.ticks <= 30){
      const fall=1-area.ticks/30, x=Math.round(area.x-camX), groundY=Math.round(area.y-camY);
      const y=Math.round(groundY-220*(1-fall*fall));
      ctx.save();ctx.shadowBlur=0;
      // Growing square landing shadow anchors the falling object to the marked floor.
      ctx.globalAlpha=.15+fall*.25;ctx.fillStyle='#132b16';
      const shadow=7+fall*8;ctx.fillRect(x-shadow,groundY-shadow*.35,shadow*2,shadow*.7);
      // A compact orbital energy bolt: stepped plasma tail and a pale luminous core.
      ctx.shadowColor='#a7e66c';ctx.shadowBlur=9;
      for(let i=4;i>=1;i--){
        ctx.globalAlpha=(5-i)*.12;ctx.fillStyle=i%2?'#88bc45':'#c9ed9a';
        ctx.fillRect(x-4-i,y-i*13,8+i*2,12);
      }
      ctx.globalAlpha=.35;ctx.fillStyle='#88bc45';ctx.fillRect(x-10,y-22,20,31);
      ctx.globalAlpha=1;ctx.fillStyle='#a9d866';ctx.fillRect(x-6,y-17,12,24);
      ctx.shadowBlur=3;ctx.fillStyle='#eaffc8';ctx.fillRect(x-3,y-15,6,23);
      ctx.fillStyle='#ffffff';ctx.fillRect(x-2,y-3,4,13);
      ctx.shadowBlur=0;ctx.fillStyle='#bb688b';ctx.fillRect(x-7,y-8,2,5);ctx.fillRect(x+5,y-8,2,5);
      ctx.restore();
    }else if(!area.warning && age<16){
      const hit=age/16,x=area.x-camX,y=area.y-camY;
      ctx.save();ctx.globalAlpha=(1-hit)*.8;ctx.shadowBlur=0;
      for(let i=0;i<8;i++){
        const angle=i*Math.PI/4, r=10+hit*30;
        ctx.fillStyle=i%2?'#7e9c43':'#b9cb87';
        ctx.fillRect(Math.round(x+Math.cos(angle)*r),Math.round(y+Math.sin(angle)*r*.5-Math.sin(hit*Math.PI)*13),4,5);
      }
      ctx.restore();
    }
  }
  ctx.restore();
}

