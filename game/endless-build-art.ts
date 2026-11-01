import { TILE_SIZE } from './constants';
import { getBombRadius, type GameState } from './engine';

export function drawRunBuildEffects(ctx:CanvasRenderingContext2D,state:GameState,camX:number,camY:number) {
  ctx.save();
  for(const zone of state.build.zones) {
    const x=Math.round(zone.x-camX),y=Math.round(zone.y-camY),r=zone.radius*TILE_SIZE;
    const color=zone.kind==='trail'?'#91e6bb':zone.kind==='fire'?'#ffad64':'#b9a1f1';
    ctx.globalAlpha=Math.min(1,zone.ticks/30)*.17;ctx.fillStyle=color;ctx.fillRect(x-r,y-r,r*2,r*2);
    ctx.globalAlpha=Math.min(1,zone.ticks/30)*.65;ctx.strokeStyle=color;ctx.lineWidth=2;
    const stride=zone.kind==='trail'?8:18;
    for(let k=0;k<4;k++) {
      const a=k*Math.PI/2,d=r*(.35+((state.gameTick+k*11)%45)/70),px=Math.round(x+Math.cos(a)*d),py=Math.round(y+Math.sin(a)*d);
      ctx.fillRect(px-2,py-stride/2,4,stride);
    }
    ctx.strokeRect(x-r+3,y-r+3,r*2-6,r*2-6);
  }
  if(state.bomb?.detonateTicks!==undefined) {
    const b=state.bomb,x=(b.tileX+.5)*TILE_SIZE-camX,y=(b.tileY+.5)*TILE_SIZE-camY,r=(getBombRadius(state,b.powered)+1)*TILE_SIZE*(b.detonateTicks??0)/24;
    ctx.globalAlpha=.65;ctx.strokeStyle='#ffc48b';ctx.lineWidth=2;ctx.strokeRect(x-r,y-r,r*2,r*2);
  }
  ctx.globalAlpha=1;
  for(const enemy of state.enemies) {
    if((enemy.buildMarks??0)<3||(enemy.buildMarkUntil??0)<state.gameTick)continue;
    const x=Math.round(enemy.x-camX),y=Math.round(enemy.y-camY),r=23;
    ctx.strokeStyle='#d5afff';ctx.lineWidth=2;
    for(const side of [-1,1])for(const vertical of [-1,1]) {
      ctx.beginPath();ctx.moveTo(x+side*(r-7),y+vertical*r);ctx.lineTo(x+side*r,y+vertical*r);ctx.lineTo(x+side*r,y+vertical*(r-7));ctx.stroke();
    }
  }
  ctx.restore();
}
