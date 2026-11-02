import {drawSingularityFieldTiles} from './field-art';
import {growthContainsTile} from './blessing-effects';
import {nebulaContainsTile} from './endless-builds';
import { TILE_SIZE } from './constants';
import { getBombRadius, isFloorTile, type GameState } from './engine';

function pullMarks(ctx:CanvasRenderingContext2D,x:number,y:number,radius:number,tick:number,fade:number,color:string,core:string) {
  ctx.save();ctx.translate(x,y);ctx.lineCap='butt';ctx.lineJoin='miter';ctx.shadowBlur=0;
  for(let i=0;i<8;i++){
    const phase=(tick*.032+i*.137)%1,distance=radius*(1-phase),alpha=Math.sin(phase*Math.PI)*fade;
    ctx.save();ctx.rotate(i*Math.PI/4);ctx.translate(distance,0);ctx.globalAlpha=alpha;
    // Solid rectangles keep the inward current thick, square-ended and unrounded.
    ctx.fillStyle=color;ctx.fillRect(-16,-3,23,6);ctx.fillRect(-16,-8,6,5);ctx.fillRect(-16,3,6,5);
    ctx.fillStyle=core;ctx.fillRect(-12,-1,16,2);ctx.restore();
  }
  ctx.globalAlpha=fade*.65;ctx.fillStyle=core;
  for(const side of [-1,1]){ctx.fillRect(side*12-2,-2,4,4);ctx.fillRect(-2,side*12-2,4,4);}
  ctx.restore();
}

export function drawRunBuildEffects(ctx:CanvasRenderingContext2D,state:GameState,camX:number,camY:number) {
  ctx.save();
  ctx.lineCap='butt';ctx.lineJoin='miter';ctx.shadowBlur=0;
  for(const wire of state.build.tripwires){
    ctx.save();ctx.globalAlpha=Math.min(1,wire.ticks/30)*(wire.armTicks>0?.18:.48);
    ctx.beginPath();
    // Empowered rays may pierce cover; their floor tethers remain clipped to floor cells.
    for(let ty=Math.max(0,Math.floor(Math.min(wire.y1,wire.y2)/TILE_SIZE)-1);ty<=Math.min(state.map.length-1,Math.floor(Math.max(wire.y1,wire.y2)/TILE_SIZE)+1);ty++)
      for(let tx=Math.max(0,Math.floor(Math.min(wire.x1,wire.x2)/TILE_SIZE)-1);tx<=Math.min(state.map[ty].length-1,Math.floor(Math.max(wire.x1,wire.x2)/TILE_SIZE)+1);tx++)
        if(state.map[ty][tx]!==0)ctx.rect(tx*TILE_SIZE-camX,ty*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE);
    ctx.clip();ctx.strokeStyle='#6bbdd9';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(wire.x1-camX,wire.y1-camY);ctx.lineTo(wire.x2-camX,wire.y2-camY);ctx.stroke();
    ctx.strokeStyle='#d0f3ff';ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
  }
  if(state.build.rubyWaveStored&&state.rubyTileX>=0&&!state.playerCarryingRuby){
    const x=Math.round((state.rubyTileX+.5)*TILE_SIZE-camX),y=Math.round((state.rubyTileY+.5)*TILE_SIZE-camY);
    ctx.globalAlpha=.65+.15*Math.sin(state.gameTick*.08);ctx.fillStyle='#ffc1dc';
    for(const dx of [-1,1])for(const dy of [-1,1]){ctx.fillRect(x+dx*26-3,y+dy*26-2,7,3);ctx.fillRect(x+dx*26-2,y+dy*26-3,3,7);}
  }
  for(const effect of state.build.impacts){
    const x=Math.round(effect.x-camX),y=Math.round(effect.y-camY),age=18-effect.ticks,r=6+age*.8;
    ctx.globalAlpha=effect.ticks/18;ctx.fillStyle=effect.kind==='slam'?'#ffce9b':effect.kind==='wire'?'#c7eeff':'#a2e9ce';
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]])ctx.fillRect(Math.round(x+dx*r)-2,Math.round(y+dy*r)-2,dx?6:3,dy?6:3);
  }
  ctx.globalAlpha=1;
  for(const enemy of state.enemies)if((enemy.buildStopUntil??0)>state.gameTick){
    ctx.fillStyle='#ffdcaa';
    for(let i=0;i<3;i++)ctx.fillRect(Math.round(enemy.x-camX-12+i*10),Math.round(enemy.y-camY-38+(i===1?-3:0)),4,4);
  }
  // Draw each walked tile once so overlapping fields stay clean and equally bright.
  const growthTiles=new Map<string,{tx:number;ty:number;fade:number}>();
  for(const zone of state.build.zones)if(zone.kind==='growth'&&zone.ticks>0){const tx=Math.floor(zone.x/TILE_SIZE),ty=Math.floor(zone.y/TILE_SIZE),fade=Math.min(1,zone.ticks/120);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(growthContainsTile(zone,tx+dx,ty+dy)&&isFloorTile(state.map,tx+dx,ty+dy)){const key=(tx+dx)+','+(ty+dy),old=growthTiles.get(key);if(!old||old.fade<fade)growthTiles.set(key,{tx:tx+dx,ty:ty+dy,fade});}}
  for(const tile of growthTiles.values()){const px=tile.tx*TILE_SIZE-camX,py=tile.ty*TILE_SIZE-camY;
    ctx.fillStyle='#55d55b';ctx.globalAlpha=.16*tile.fade;ctx.fillRect(px,py,TILE_SIZE,TILE_SIZE);
  }
  for(const tile of growthTiles.values()){const px=tile.tx*TILE_SIZE-camX,py=tile.ty*TILE_SIZE-camY;
    const top=!growthTiles.has(tile.tx+','+(tile.ty-1)),bottom=!growthTiles.has(tile.tx+','+(tile.ty+1)),left=!growthTiles.has((tile.tx-1)+','+tile.ty),right=!growthTiles.has((tile.tx+1)+','+tile.ty),w=4;
    ctx.fillStyle='#86f46d';ctx.globalAlpha=.62*tile.fade;
    if(top)ctx.fillRect(px,py,TILE_SIZE,w);if(bottom)ctx.fillRect(px,py+TILE_SIZE-w,TILE_SIZE,w);
    const y0=py+(top?w:0),height=TILE_SIZE-(top?w:0)-(bottom?w:0);
    if(left)ctx.fillRect(px,y0,w,height);if(right)ctx.fillRect(px+TILE_SIZE-w,y0,w,height);
  }
  ctx.globalAlpha=1;
  for(const zone of state.build.zones) {
    const x=Math.round(zone.x-camX),y=Math.round(zone.y-camY),r=zone.radius*TILE_SIZE;
    if(zone.kind==='growth')continue;
    if(zone.kind==='void'){drawSingularityFieldTiles(ctx,state.map,zone.x,zone.y,zone.radius,camX,camY,state.gameTick,Math.min(1,zone.ticks/90));continue;}
    if(zone.kind==='nebula'){
      ctx.save();const fade=Math.min(1,zone.ticks/30);ctx.fillStyle='#85b8df';ctx.globalAlpha=.11*fade;
      const tx=Math.floor(zone.x/TILE_SIZE),ty=Math.floor(zone.y/TILE_SIZE);
      for(let dy=-Math.ceil(zone.radius);dy<=Math.ceil(zone.radius);dy++)for(let dx=-Math.ceil(zone.radius);dx<=Math.ceil(zone.radius);dx++)if(nebulaContainsTile(zone,tx+dx,ty+dy)&&isFloorTile(state.map,tx+dx,ty+dy)){
        const px=(tx+dx)*TILE_SIZE-camX,py=(ty+dy)*TILE_SIZE-camY;
        ctx.fillRect(px+2,py+2,TILE_SIZE-4,TILE_SIZE-4);
        ctx.globalAlpha=.35*fade;ctx.fillRect(px+8,py+8,7,2);ctx.fillRect(px+8,py+8,2,7);ctx.globalAlpha=.11*fade;
      }
      ctx.restore();continue;
    }
    if(zone.kind==='trail'){
      ctx.save();ctx.shadowBlur=0;ctx.globalAlpha=Math.min(1,zone.ticks/24)*.3;
      ctx.fillStyle='#69cba5';ctx.fillRect(x-TILE_SIZE/2+1,y-TILE_SIZE/2+1,TILE_SIZE-2,TILE_SIZE-2);
      ctx.restore();continue;
    }
    if(zone.kind==='gravity'){pullMarks(ctx,x,y,r,state.gameTick,.55*Math.min(1,zone.ticks/30),'#ad94db','#eee5ff');continue;}
    ctx.globalAlpha=Math.min(1,zone.ticks/30)*.17;ctx.fillStyle='#ffad64';ctx.fillRect(x-r,y-r,r*2,r*2);
    ctx.globalAlpha=Math.min(1,zone.ticks/30)*.65;ctx.strokeStyle='#ffad64';ctx.lineWidth=2;ctx.strokeRect(x-r+3,y-r+3,r*2-6,r*2-6);
  }
  if(state.bomb?.detonateTicks!==undefined) {
    const b=state.bomb,x=(b.tileX+.5)*TILE_SIZE-camX,y=(b.tileY+.5)*TILE_SIZE-camY,r=(getBombRadius(state,b.powered)+2)*TILE_SIZE;
    pullMarks(ctx,x,y,r,24-(b.detonateTicks??0),.9,b.powered?'#ffe079':'#ffb778',b.powered?'#fff5ca':'#fff0d8');
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
