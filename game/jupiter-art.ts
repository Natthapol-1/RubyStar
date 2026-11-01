import { drawChamberCountdown, drawMinimapHazard } from './warning-art';
import { CHAMBER_BOUNDS, JUPITER, TILE_SIZE, T_WALL, chamberOfTile } from './constants';
import type { GameState } from './engine';
import { jupiterStormRoom } from './jupiter';

// Warm-state chamber accents: ALPHA gold, BETA coral, DELTA copper, GAMMA lilac.
export const JUPITER_WARM = ['#ffd26b','#ff7b7d','#f0a06a','#cdb0f3'];
export const JUPITER_STORM = ['#52ffd6','#8ccfff','#b5a1ff','#8de6c1'];
export function jupiterTint(state:GameState,warm:string,cold:string) {
  const blend=state.jupiter?.stormBlend??(state.jupiter?.stage==='pursuit'?1:0);
  return '#'+[1,3,5].map(i=>Math.round(parseInt(warm.slice(i,i+2),16)*(1-blend)+parseInt(cold.slice(i,i+2),16)*blend).toString(16).padStart(2,'0')).join('');
}
export function jupiterColors(state: GameState) { return JUPITER_WARM.map((color,i)=>jupiterTint(state,color,JUPITER_STORM[i])); }
const rect = (ctx: CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string) => {ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};

export function drawJupiterBackdrop(ctx: CanvasRenderingContext2D,state:GameState,w:number,h:number,camX:number,camY:number,tick:number) {
  const storm=state.jupiter?.stage==='pursuit';ctx.save();
  rect(ctx,0,0,w,h,jupiterTint(state,'#211921','#071c25'));
  // Large shadow banks and occasional distant bolts, with plenty of negative space.
  const drift=tick*(storm?.12:.045)-camX*.04;
  for(let i=0;i<4;i++) {
    const base=i*h*.32-h*.15-camY*.035,offset=Math.sin(drift*.004+i)*30;
    ctx.globalAlpha=.22;ctx.fillStyle=jupiterTint(state,i%2?'#4c3d43':'#514047',i%2?'#1b3d4c':'#163742');
    ctx.beginPath();ctx.moveTo(-90,base+60);
    const points=[[-90,60],[w*.1,20],[w*.24,35],[w*.35,-4],[w*.51,15],[w*.67,-8],[w*.8,34],[w+90,12],[w+90,125],[w*.72,99],[w*.5,130],[w*.31,100],[-90,140]];
    points.forEach(([x,y])=>ctx.lineTo(x+offset,base+y));ctx.closePath();ctx.fill();
    ctx.globalAlpha=.1;rect(ctx,0,base+112,w,3,storm?'#74b5b6':'#b08d7e');
  }
  // Jupiter's Great Red Spot is a subdued distant shape, not another foreground pattern.
  const cx=w*.72-camX*.04,cy=h*.72-camY*.025;
  ctx.globalAlpha=.09;rect(ctx,cx-140,cy-24,280,48,storm?'#60778d':'#ba705c');
  rect(ctx,cx-95,cy-42,190,84,storm?'#435a75':'#a75749');
  // A broad storm eye, visible beside the platform, gives the cloud sea a focal point.
  ctx.save();ctx.translate(w*.075-camX*.025,h*.64-camY*.018);ctx.scale(1,.55);ctx.rotate(Math.sin(tick*.002)*.08);
  for(let ring=3;ring>=1;ring--) {
    const rx=75+ring*44,ry=55+ring*30;
    ctx.globalAlpha=.12+ring*.02;ctx.strokeStyle=jupiterTint(state,ring%2?'#d29a78':'#875b59',ring%2?'#67afa9':'#345b77');ctx.lineWidth=ring===3?18:12;
    ctx.beginPath();for(let k=0;k<12;k++){const angle=k*Math.PI/6,x=Math.cos(angle)*rx,y=Math.sin(angle)*ry;if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.stroke();
  }
  ctx.globalAlpha=.25;rect(ctx,-48,-30,96,60,jupiterTint(state,'#592e37','#0e303e'));ctx.restore();
  const period=storm?190:280;
  for(let i=0;i<2;i++) {
    const age=(tick+i*113)%period,life=26;if(age>=life)continue;
    const x=w*(i?.94:.085)-Math.sin(camX*.0003+i)*16,y=-h*.08;
    const fade=Math.pow(1-age/life,1.4);
    ctx.globalAlpha=fade*(storm?.055:.035);rect(ctx,0,0,w,h,jupiterTint(state,'#eac59f','#89e5d9'));
    ctx.globalAlpha=fade*(storm?.8:.6);ctx.strokeStyle=jupiterTint(state,'#9d806c','#307e83');ctx.lineWidth=storm?15:10;
    ctx.beginPath();ctx.moveTo(x+24,y);ctx.lineTo(x-35,y+h*.27);ctx.lineTo(x+18,y+h*.27);ctx.lineTo(x-52,y+h*.59);ctx.lineTo(x+5,y+h*.59);ctx.lineTo(x-80,y+h*1.1);ctx.stroke();
    ctx.strokeStyle=jupiterTint(state,'#ffe8c8','#c4fff1');ctx.lineWidth=storm?4:3;ctx.stroke();
    ctx.globalAlpha=fade*(storm?.65:.4);ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x-20,y+h*.23);ctx.lineTo(x+100,y+h*.42);ctx.lineTo(x+65,y+h*.55);ctx.lineTo(x+145,y+h*.77);ctx.stroke();
  }

  ctx.restore();
}
export function drawJupiterTile(ctx:CanvasRenderingContext2D,state:GameState,tx:number,ty:number,x:number,y:number,cover=false) {
  const storm=state.jupiter?.stage==='pursuit',ch=chamberOfTile(tx,ty),c=jupiterColors(state)[Math.max(0,ch)];
  ctx.save();
  rect(ctx,x,y,48,48,jupiterTint(state,'#241d25','#0b202b'));
  if(cover) {
    // Square capacitor banks with inset coils, brass housings and pale charged cores.
    rect(ctx,x+2,y+2,44,44,jupiterTint(state,'#624a3b','#1c3c45'));rect(ctx,x+5,y+6,38,36,jupiterTint(state,'#30272a','#102831'));
    rect(ctx,x+5,y+3,38,3,c);rect(ctx,x+5,y+42,38,3,jupiterTint(state,'#806049','#326372'));
    const variant=(tx*13+ty*7)%4,coil=jupiterTint(state,'#90705a','#396b71');
    if(variant===0) {
      for(let k=0;k<3;k++){rect(ctx,x+13,y+12+k*9,22,3,coil);rect(ctx,x+21,y+11+k*9,5,5,c);}
    } else if(variant===1) {
      for(let k=0;k<3;k++){rect(ctx,x+13+k*9,y+11,5,27,coil);rect(ctx,x+14+k*9,y+15,3,12,c);}
      rect(ctx,x+12,y+34,26,3,jupiterTint(state,'#b89b74','#508a91'));
    } else if(variant===2) {
      for(let k=0;k<2;k++){
        rect(ctx,x+13+k*14,y+12,10,25,coil);rect(ctx,x+15+k*14,y+15,6,18,'#101e29');
        rect(ctx,x+16+k*14,y+18,4,10,c);rect(ctx,x+15+k*14,y+12,6,3,c);
      }
    } else {
      for(let k=0;k<4;k++)rect(ctx,x+12,y+12+k*7,18,2,coil);
      rect(ctx,x+34,y+12,4,25,jupiterTint(state,'#b89b74','#508a91'));
      for(let k=0;k<3;k++)rect(ctx,x+33,y+14+k*8,6,3,c);
    }
    rect(ctx,x+6,y+9,3,30,jupiterTint(state,'#b89b74','#508a91'));
  } else {
    ctx.strokeStyle=jupiterTint(state,'#edc89c','#7dceda')+'13';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,47,47);
    if((tx+ty*3)%7===0) {rect(ctx,x+7,y+7,10,2,jupiterTint(state,'#80634f','#4e8b8c'));rect(ctx,x+7,y+7,2,8,jupiterTint(state,'#80634f','#4e8b8c'));}
    // Long conductor strips run across panels, with sparse polarity markers.
    if(ty%5===2) {rect(ctx,x,y+35,48,2,jupiterTint(state,'#665044','#29505b'));if(tx%4===0)rect(ctx,x+20,y+32,8,8,c+'55');}
  }
  const period=cover?(storm?100:180):230,age=(state.gameTick+tx*17+ty*29)%period;
  if(age<(cover?(storm?18:12):10)&&(cover||(tx*11+ty*7)%7===0)) {
    ctx.globalAlpha=(1-age/(cover?20:12))*(cover?.85:.45);
    ctx.strokeStyle=storm?'#a2ffe9':'#e9c89a';ctx.lineWidth=cover?2:1;
    ctx.shadowColor=storm?'#52ffd6':'#e5ba7f';ctx.shadowBlur=cover?3:0;
    const yy=y+(cover?8:35),hop=Math.floor(age/3)%2?4:-4;
    ctx.beginPath();ctx.moveTo(x+5,yy);ctx.lineTo(x+15,yy+hop);ctx.lineTo(x+21,yy-3);ctx.lineTo(x+32,yy+hop);ctx.lineTo(x+43,yy);ctx.stroke();
    if(cover){ctx.beginPath();ctx.moveTo(x+43,yy);ctx.lineTo(x+39,y+19);ctx.lineTo(x+45,y+27);ctx.lineTo(x+41,y+40);ctx.stroke();rect(ctx,x+41,y+39,3,3,'#e0fff0');}
  }
  ctx.restore();
}
export function drawVoltFence(ctx:CanvasRenderingContext2D,x:number,y:number,vertical:boolean,half:number,tick:number,fade=1) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));if(!vertical)ctx.rotate(Math.PI/2);ctx.shadowBlur=0;
  // Same axis-aligned plasma cuts and layered palette as Reaper's melee lightning.
  const flip=Math.floor(tick/6)%2?1:-1,span=half*2;
  const points=[[0,-half],[0,-half+span*.16],[-5*flip,-half+span*.16],[-5*flip,-half+span*.38],
    [5*flip,-half+span*.38],[5*flip,-half+span*.65],[-3*flip,-half+span*.65],[-3*flip,-half+span*.84],[0,-half+span*.84],[0,half]];
  for(const [width,color,alpha]of [[10,'#2fa58c',.55],[6,'#52ffd6',.95],[2,'#e2fff0',1]] as const) {
    ctx.globalAlpha=fade*alpha;
    for(let i=1;i<points.length;i++) {
      const [ax,ay]=points[i-1],[bx,by]=points[i];
      rect(ctx,Math.min(ax,bx)-width/2,Math.min(ay,by)-width/2,Math.max(width,Math.abs(ax-bx)+width),Math.max(width,Math.abs(ay-by)+width),color);
    }
  }
  ctx.globalAlpha=fade;
  for(const side of [-1,1]) {rect(ctx,-8,side*half-7,16,14,'#193f43');rect(ctx,-8,side*half-7,16,3,'#8cffe0');rect(ctx,-3,side*half-4,6,8,'#e3fff5');}
  ctx.restore();
}

export function drawStormShard(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,seed=0) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y+Math.sin(tick*.045+seed)*3));
  // Match Stellar Shards and Sunstones: a stepped solid silhouette, pale core and cardinal rays.
  const shape=(color:string,scale:number)=>{
    ctx.fillStyle=color;rect(ctx,-6*scale,-22*scale,12*scale,44*scale,color);
    rect(ctx,-12*scale,-14*scale,24*scale,28*scale,color);rect(ctx,-18*scale,-6*scale,36*scale,12*scale,color);
  };
  ctx.shadowColor='#ffd26a';ctx.shadowBlur=4;shape('#edb640',1);ctx.shadowBlur=0;
  shape('#fff0ac',.68);shape('#fffce0',.35);
  rect(ctx,-3,-5,6,10,'#fffef2');
  for(let i=0;i<4;i++) {
    const age=(tick+i*9+seed*7)%36,fade=1-age/36,d=24+Math.floor(age/6)*2;
    ctx.globalAlpha=fade*.7;const horizontal=i%2===1,side=i<2?1:-1;
    rect(ctx,horizontal?side*d-3:-1,horizontal?-1:side*d-3,horizontal?6:2,horizontal?2:6,i%2?'#fff0b9':'#ffd26a');
  }
  ctx.restore();
}

function drawShardEffects(ctx:CanvasRenderingContext2D,state:GameState,camX:number,camY:number) {
  for(const effect of state.jupiter?.shardEffects??[]) {
    const age=26-effect.ticks,fade=effect.ticks/26,x=effect.x-camX,y=effect.y-camY,bx=effect.bossX-camX,by=effect.bossY-camY;
    ctx.save();ctx.globalAlpha=fade;
    const color=effect.heal?'#8fffc1':'#ffe3a0';
    for(let k=0;k<4;k++){const a=k*Math.PI/2,r=8+age*.65;rect(ctx,x+Math.cos(a)*r-2,y+Math.sin(a)*r-2,4,4,color);}
    if(effect.heal) {
      ctx.strokeStyle='#83f5bb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(bx,by);ctx.stroke();
      rect(ctx,bx-3,by-16,6,32,'#9affe0');rect(ctx,bx-16,by-3,32,6,'#9affe0');
    } else if(age<16) {
      const points=[[bx-25,by-330],[bx+15,by-230],[bx-13,by-230],[bx+18,by-104],[bx-8,by-104],[bx,by]];
      for(const [width,c]of [[7,'#73d8b1'],[2,'#f1fff3']] as const) {
        ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();
      }
      for(let k=0;k<6;k++){const a=k*Math.PI/3,r=12+age*2;rect(ctx,bx+Math.cos(a)*r-2,by+Math.sin(a)*r-2,4,4,'#e2ffed');}
    }
    ctx.restore();
  }
}

export function drawJupiterGround(ctx:CanvasRenderingContext2D,state:GameState,camX:number,camY:number,tick:number) {
  const j=state.jupiter;if(!j)return;ctx.save();

  drawJupiterDischarge(ctx,state,camX,camY,tick);
  for(const fragment of j.fragments??[]) {
    const x=(fragment.x+.5)*TILE_SIZE-camX,y=(fragment.y+.5)*TILE_SIZE-camY;
    ctx.save();ctx.translate(x,y);ctx.scale(.85,.85);drawStormShard(ctx,0,0,tick,fragment.id);ctx.restore();
    const left=Math.ceil(fragment.charge/JUPITER.fragmentChargeTicks*8);
    for(let k=0;k<8;k++)rect(ctx,x-23+k*6,y+29,4,4,k<left?'#bc9aff':'#392d51');
    if(j.fragmentOverdrive){ctx.strokeStyle='#dfb0ff';ctx.lineWidth=2;ctx.strokeRect(x-24,y-27,48,64);}
  }
  for(const storm of j.miniStorms??[])drawMiniStorm(ctx,storm.x-camX,storm.y-camY,tick,storm.id);
  if(j.stage==='escape')for(const shard of j.shards??[])drawStormShard(ctx,(shard.x+.5)*TILE_SIZE-camX,(shard.y+.5)*TILE_SIZE-camY,tick,shard.id);
  for(const tile of j.shockTiles??[]) {
    if(tile.cooldown>0)continue;
    drawChargedTile(ctx,tile.x*TILE_SIZE-camX,tile.y*TILE_SIZE-camY,tick+tile.id*17);
  }
  for(const burst of j.tileBursts??[]) {
    const age=1-burst.ticks/30,x=(burst.x+.5)*TILE_SIZE-camX,y=(burst.y+.5)*TILE_SIZE-camY,r=12+age*58;
    ctx.globalAlpha=(1-age)*.8;ctx.strokeStyle='#b6ddff';ctx.lineWidth=3;ctx.strokeRect(x-r,y-r,r*2,r*2);
    ctx.globalAlpha=(1-age)*.25;rect(ctx,x-r,y-r,r*2,r*2,'#69b8ff');
  }
  ctx.globalAlpha=1;
  if(j.stage==='charging') {
    const boss=state.enemies.find(e=>e.id===j.bossId&&e.hp>0);
    if(boss)drawReaperCharge(ctx,boss.x-camX,boss.y-camY,j.energy/100,tick,j.round===2);
  }
  if(j.stage==='pursuit'&&j.safeRoom>=0) {
    const warning=j.stormAge<JUPITER.stormGrace;
    for(let room=0;room<4;room++) {
      const [r1,c1,r2,c2]=CHAMBER_BOUNDS[room],x=c1*TILE_SIZE-camX,y=r1*TILE_SIZE-camY,w=(c2-c1+1)*TILE_SIZE,h=(r2-r1+1)*TILE_SIZE;
      if(room===j.safeRoom) {ctx.strokeStyle='#c4ffe0';ctx.globalAlpha=.55;ctx.lineWidth=3;ctx.setLineDash([12,12]);ctx.strokeRect(x+TILE_SIZE+6,y+TILE_SIZE+6,w-2*TILE_SIZE-12,h-2*TILE_SIZE-12);ctx.setLineDash([]);continue;}
      // Colour every hazardous floor tile, with walls left untouched.
      ctx.globalAlpha=warning?.08:.21;ctx.fillStyle='#56d6c2';
      for(let ty=r1;ty<=r2;ty++)for(let tx=c1;tx<=c2;tx++)if(state.map[ty]?.[tx]!==T_WALL)ctx.fillRect(tx*TILE_SIZE-camX,ty*TILE_SIZE-camY,TILE_SIZE,TILE_SIZE);
      ctx.globalAlpha=.6;ctx.strokeStyle='#70ffe4';ctx.lineWidth=4;ctx.strokeRect(x+TILE_SIZE+4,y+TILE_SIZE+4,w-2*TILE_SIZE-8,h-2*TILE_SIZE-8);
      // Broad surging fronts and two large, forked lightning columns: danger stays legible.
      ctx.save();ctx.beginPath();ctx.rect(x+TILE_SIZE,y+TILE_SIZE,w-2*TILE_SIZE,h-2*TILE_SIZE);ctx.clip();
      for(let k=0;k<3;k++) {const yy=y+(tick*20+k*320)%h;ctx.globalAlpha=.15;rect(ctx,x,yy,w,12,'#a3ffe7');}
      const strike=(tick+room*11)%40;
      if(!warning&&strike<15)for(let bolt=0;bolt<2;bolt++) {
        const lx=x+w*(bolt?.72:.28)+(Math.floor(tick/40)%3-1)*28;
        ctx.globalAlpha=(1-strike/16)*.9;ctx.strokeStyle='#49bfae';ctx.lineWidth=12;ctx.shadowColor='#8cffe4';ctx.shadowBlur=5;
        ctx.beginPath();ctx.moveTo(lx,y+30);ctx.lineTo(lx-45,y+h*.3);ctx.lineTo(lx+12,y+h*.3);ctx.lineTo(lx-54,y+h*.65);ctx.lineTo(lx-10,y+h*.65);ctx.lineTo(lx-70,y+h);ctx.stroke();
        ctx.strokeStyle='#d8fff0';ctx.lineWidth=3;ctx.stroke();ctx.shadowBlur=0;
        ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(lx-28,y+h*.24);ctx.lineTo(lx+80,y+h*.38);ctx.lineTo(lx+56,y+h*.5);ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.globalAlpha=1;
  CHAMBER_BOUNDS.forEach(([r1,c1,r2,c2],room)=>{
    for(let side=0;side<2;side++) {
      const age=(tick+room*39+side*61)%160;if(age>14)continue;
      const x=(side?c2:c1+1)*TILE_SIZE-camX,y=(r1+3+Math.floor((tick+room*29)/160)%12)*TILE_SIZE-camY;
      ctx.globalAlpha=(1-age/15)*.65;ctx.strokeStyle=j.stage==='pursuit'?'#a3ffe6':'#edcea0';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(side?-6:6),y+12);ctx.lineTo(x-3,y+20);ctx.lineTo(x,y+36);ctx.stroke();
    }
  });
  ctx.globalAlpha=1;
  for(const wall of j.walls)drawVoltFence(ctx,wall.x-camX,wall.y-camY,wall.vertical,wall.half,tick,Math.min(1,(JUPITER.wallTicks-wall.age)/60));
  for(const b of j.bursts) {
    ctx.globalAlpha=b.ticks/24;const x=b.x-camX,y=b.y-camY,r=(1-b.ticks/24)*38;
    ctx.strokeStyle='#d5fff1';ctx.lineWidth=3;ctx.strokeRect(x-r,y-r,r*2,r*2);
    drawVoltFence(ctx,x,y,b.vertical,b.half,tick,b.ticks/24);
  }
  ctx.restore();
}

export function drawChargedTile(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number) {
  ctx.save();rect(ctx,x+5,y+5,38,38,'#152c42');ctx.strokeStyle='#8dcfff';ctx.lineWidth=2;ctx.strokeRect(x+5,y+5,38,38);
  ctx.globalAlpha=.6+.3*Math.sin(tick*.12);ctx.shadowColor='#67baff';ctx.shadowBlur=3;
  // The same axis-aligned energy-bolt grammar as the HUD, instead of a freeform diagonal flash.
  ctx.save();ctx.translate(x+10,y+9);ctx.scale(1.2,1.2);ctx.fillStyle='#c0e6ff';
  const points=[[11,2],[20,2],[20,6],[17,6],[17,9],[14,9],[14,12],[19,12],[19,15],[15,15],[15,18],[11,18],[11,22],[5,22],[5,15],[8,15],[8,11],[5,11],[5,8],[8,8],[8,5],[11,5]];
  ctx.beginPath();points.forEach(([xx,yy],i)=>i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy));ctx.closePath();ctx.fill();ctx.restore();ctx.shadowBlur=0;
  ctx.globalAlpha=1;for(const side of [0,1]){rect(ctx,x+7+side*29,y+7,5,3,'#ffcf79');rect(ctx,x+7+side*29,y+38,5,3,'#ffcf79');}ctx.restore();
}

export function drawMiniStorm(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,id=0) {
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  ctx.fillStyle='#143d40cc';ctx.fillRect(-24,-20,48,40);
  // Broken rectangular wind bands share the Reaper's sharp, stepped electricity.
  for(let k=0;k<3;k++) {
    const r=12+k*7,side=(Math.floor(tick/5)+k+id)%4;
    ctx.strokeStyle=k===0?'#dcfff1':'#63cdb3';ctx.globalAlpha=.9-k*.18;ctx.lineWidth=k===0?3:2;
    ctx.beginPath();
    if(side%2){ctx.moveTo(-r,-r+5);ctx.lineTo(-r,r);ctx.lineTo(r-7,r);}
    else{ctx.moveTo(-r+7,-r);ctx.lineTo(r,-r);ctx.lineTo(r,r-5);}
    ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.strokeStyle='#ecfff5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(4,-15);ctx.lineTo(-5,-2);ctx.lineTo(5,-2);ctx.lineTo(-3,14);ctx.stroke();
  ctx.restore();
}

function drawJupiterDischarge(ctx:CanvasRenderingContext2D,state:GameState,camX:number,camY:number,tick:number) {
  const j=state.jupiter;if(!j)return;
  const room=j.blast?.room??(j.stage==='charging'?(j.chargeRoom??-1):-1);if(room<0)return;
  const [r1,c1,r2,c2]=CHAMBER_BOUNDS[room],x=(c1+1)*TILE_SIZE-camX,y=(r1+1)*TILE_SIZE-camY,w=(c2-c1-1)*TILE_SIZE,h=(r2-r1-1)*TILE_SIZE;
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
  if(j.blast) {
    const age=1-j.blast.ticks/JUPITER.chargeBlastTicks;
    ctx.globalAlpha=Math.pow(1-age,2)*.65;rect(ctx,x,y,w,h,age<.15?'#edfff7':'#71f8d4');
    const boss=state.enemies.find(e=>e.id===j.bossId),bx=(boss?.x??((c1+c2+1)/2)*TILE_SIZE)-camX,by=(boss?.y??((r1+r2+1)/2)*TILE_SIZE)-camY;
    for(let i=0;i<3;i++){const reach=Math.max(0,age*2-i*.2)*Math.max(w,h);ctx.globalAlpha=(1-age)*(.8-i*.15);ctx.strokeStyle=i?'#74f4d9':'#f0fff7';ctx.lineWidth=i?4:8;ctx.strokeRect(bx-reach,by-reach,reach*2,reach*2);}
    ctx.globalAlpha=(1-age)*.8;ctx.strokeStyle='#d8fff2';ctx.lineWidth=4;
    for(let i=0;i<8;i++){const angle=i*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle),r=100+age*900;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+dx*r*.4-dy*22,by+dy*r*.4+dx*22);ctx.lineTo(bx+dx*r*.6+dy*12,by+dy*r*.6-dx*12);ctx.lineTo(bx+dx*r,by+dy*r);ctx.stroke();}
  } else {
    const progress=j.energy/100,color=j.round===2?'#c5a4ff':'#72ffd9';
    ctx.globalAlpha=.05+progress*.08;rect(ctx,x,y,w,h,color);
    ctx.globalAlpha=.55+progress*.35;ctx.strokeStyle=color;ctx.lineWidth=4;ctx.setLineDash([22,12]);ctx.strokeRect(x+3,y+3,w-6,h-6);ctx.setLineDash([]);
    drawChamberCountdown(ctx,x+w/2,y+h*.23,'DISCHARGE',j.stageTicks,color);
  }
  ctx.restore();
}
export function drawReaperCharge(ctx:CanvasRenderingContext2D,x:number,y:number,progress:number,tick:number,second=false,front=false) {
  const p=Math.max(0,Math.min(1,progress)),color=second?'#c5a4ff':'#52ffd6',core=second?'#f2e9ff':'#dcfff2';
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  if(!front) {
    // Low pressure ripples tighten under him while the body lifts and the blades accelerate.
    for(let wave=0;wave<2;wave++) {
      const t=(tick*(.012+p*.012)+wave*.5)%1,r=95-t*58;
      ctx.globalAlpha=Math.sin(t*Math.PI)*(.1+p*.18);ctx.strokeStyle=color;ctx.lineWidth=2;
      ctx.beginPath();for(let k=0;k<8;k++){const angle=k*Math.PI/4,px=Math.cos(angle)*r,py=Math.sin(angle)*r*.55;if(k===0)ctx.moveTo(px,py+24);else ctx.lineTo(px,py+24);}ctx.closePath();ctx.stroke();
    }
    // Four staggered electrical feeds converge on the body. No enclosing warning box.
    for(let i=0;i<4;i++) {
      const sx=i%2?1:-1,sy=i<2?-1:1,travel=(tick*(.022+p*.025)+i*.27)%1;
      const ax=sx*(82-p*12),ay=sy*48,bx=sx*28,by=sy*12;
      ctx.globalAlpha=.16+p*.26;ctx.strokeStyle=color;ctx.lineWidth=4;
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(sx*55,ay);ctx.lineTo(sx*45,sy*24);ctx.lineTo(bx,by);ctx.stroke();
      ctx.globalAlpha=.45+p*.4;ctx.strokeStyle=core;ctx.lineWidth=1.5;
      const kink=Math.sin(Math.floor(tick/3)+i*3)*(2+p*4);
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(sx*60,ay+kink);ctx.lineTo(sx*48+kink,sy*28);ctx.lineTo(bx,by);ctx.stroke();
      const px=ax+(bx-ax)*travel,py=ay+(by-ay)*travel;
      ctx.globalAlpha=Math.sin(travel*Math.PI)*(.5+p*.45);rect(ctx,px-4,py-2,8,4,core);
      ctx.globalAlpha=.25+p*.25;rect(ctx,ax-6,ay-2,12,3,color);
    }
  } else {
    // Fill the shell's edges as the stored charge rises; the eye and face stay clear.
    ctx.shadowColor=color;ctx.shadowBlur=4;ctx.globalAlpha=.35+p*.6;
    const fill=5+p*32;
    rect(ctx,-25,20-fill,3,fill,color);rect(ctx,22,20-fill,3,fill,color);
    rect(ctx,-17,22,34,3,core);rect(ctx,-10,-25,20,3,color);
    if(p>.6)for(const side of [-1,1]) {
      const beat=Math.sin(tick*.5+side)*4;
      ctx.globalAlpha=(p-.6)*1.7;ctx.strokeStyle=core;ctx.lineWidth=2;ctx.beginPath();
      ctx.moveTo(side*23,-15);ctx.lineTo(side*(34+beat),-35);ctx.lineTo(side*26,-35);ctx.lineTo(side*(40-beat),-58);ctx.stroke();
    }
    for(const side of [-1,1]) {
      const beat=Math.floor(tick/4)%3;
      ctx.globalAlpha=.3+p*.6;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.shadowBlur=3;
      ctx.beginPath();ctx.moveTo(side*36,31);ctx.lineTo(side*(49+beat*3),8);ctx.lineTo(side*39,4);ctx.lineTo(side*(54-beat*3),-29);ctx.lineTo(side*44,-34);ctx.lineTo(side*(50+p*16),-58-p*32);ctx.stroke();
      ctx.globalAlpha=.55+p*.4;ctx.fillStyle=core;
      for(let k=0;k<3;k++){const age=(tick*(.7+p)+k*29+side*7)%88;rect(ctx,side*(44+k*9)-2,34-age,3+k%2,6,core);}
    }
  }
  ctx.restore();
}

export function drawJupiterBossEffect(ctx:CanvasRenderingContext2D,state:GameState,x:number,y:number,tick:number) {
  const j=state.jupiter;if(!j)return;ctx.save();
  const color=j.stage==='escape'?'#ffc887':j.round===2?'#c5a4ff':'#52ffd6';
  if(j.stage==='charging') {
    drawReaperCharge(ctx,x+Math.sin(tick*.65)*Math.pow(j.energy/100,2)*2,y-j.energy/100*9+Math.sin(tick*.1)*2,j.energy/100,tick,j.round===2,true);
  }
  if(j.stage==='pursuit'&&j.stormAge<18) {
    const age=j.stormAge/18;
    ctx.globalAlpha=(1-age)*.8;ctx.strokeStyle=j.round===2?'#e4d5ff':'#d8fff1';ctx.lineWidth=3;
    for(let i=0;i<4;i++) {
      ctx.save();ctx.translate(x,y);ctx.rotate(i*Math.PI/2);
      ctx.beginPath();ctx.moveTo(28+age*24,0);ctx.lineTo(50+age*65,-6);ctx.lineTo(55+age*65,3);ctx.lineTo(72+age*100,0);ctx.stroke();ctx.restore();
    }
  }
  if(j.stage==='escape') {
    const boss=state.enemies.find(e=>e.id===j.bossId);
    if(boss&&(boss.targetTileX!==boss.tileX||boss.targetTileY!==boss.tileY)) {
      const dx=boss.targetTileX-boss.tileX,dy=boss.targetTileY-boss.tileY;
      for(let i=0;i<4;i++) {
        const age=(tick*1.8+i*13)%48,d=30+age;
        ctx.globalAlpha=(1-age/48)*.55;
        rect(ctx,x-dx*d+(dy?i%2*13-6:0)-2,y-dy*d+(dx?i%2*13-6:0)-2,dx?10:3,dy?10:3,i%2?'#a2bfb2':'#edbd8d');
      }
    }
  }
  if(j.bossBoost>0){
    ctx.fillStyle='#52ffd6';for(let i=4;i>=1;i--){ctx.globalAlpha=.22/i;ctx.fillRect(Math.round(x-(j.bossDashX??1)*i*14-25),Math.round(y-(j.bossDashY??0)*i*14-25),50,50);}
  }
  if(j.bossBoost>0) {
    ctx.globalAlpha=.55;
    ctx.strokeStyle='#d5fff1';ctx.lineWidth=3;ctx.strokeRect(x-42,y-42,84,84);
    for(let i=0;i<3;i++)rect(ctx,x-30+i*22,y+47,12,3,color);
  }
  ctx.restore();
}
export function drawJupiterMinimap(ctx:CanvasRenderingContext2D,state:GameState,mx:number,my:number,scale:number) {
  const j=state.jupiter;if(!j)return;ctx.save();
  for(const f of j.fragments??[]){const x=mx+(f.x+.5)*scale,y=my+(f.y+.5)*scale;rect(ctx,x-3,y-3,6,6,j.fragmentOverdrive?'#e5b4ff':'#c5a4ff');rect(ctx,x-1,y-1,2,2,'#fff4d2');}
  for(const s of j.miniStorms??[]) {ctx.strokeStyle='#b1f4df';ctx.lineWidth=1;ctx.strokeRect(mx+s.x/TILE_SIZE*scale-3,my+s.y/TILE_SIZE*scale-3,6,6);}
  if(j.stage==='escape')for(const shard of j.shards??[]) {
    const x=mx+(shard.x+.5)*scale,y=my+(shard.y+.5)*scale;
    ctx.save();ctx.fillStyle='#111821';ctx.fillRect(x-4,y-5,8,10);
    rect(ctx,x-1,y-4,2,8,'#ffd574');rect(ctx,x-3,y-2,6,4,'#ffd574');
    rect(ctx,x-1,y-2,2,4,'#fff8d8');ctx.restore();
  }
  for(const tile of j.shockTiles??[])if(tile.cooldown<=0)rect(ctx,mx+tile.x*scale,my+tile.y*scale,2,2,'#9fd8ff');
  if(j.stage==='charging'&&j.chargeRoom>=0){
    const [r1,c1,r2,c2]=CHAMBER_BOUNDS[j.chargeRoom],color=j.round===2?'#c5a4ff':'#8affe0';
    const x=mx+c1*scale,y=my+r1*scale,w=(c2-c1+1)*scale,h=(r2-r1+1)*scale;
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,w-4,h-4);
    drawMinimapHazard(ctx,x+w/2,y+h*.24,'discharge',color);
  }
  if(j.stage!=='pursuit'||j.safeRoom<0){ctx.restore();return;}
  CHAMBER_BOUNDS.forEach(([r1,c1,r2,c2],room)=>{
    const danger=jupiterStormRoom(state,room),x=mx+c1*scale,y=my+r1*scale,w=(c2-c1+1)*scale,h=(r2-r1+1)*scale;
    ctx.fillStyle=danger?'#52ffd633':'#ffe0a50c';ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=danger?'#64e8d4':'#ffe0a5';ctx.lineWidth=danger?2:3;ctx.strokeRect(x+2,y+2,w-4,h-4);
    if(danger) {
      drawMinimapHazard(ctx,x+w/2,y+h*.24,'storm','#8cffe7');
    }
  });
  ctx.restore();
}

export function drawJupiterGuard(ctx:CanvasRenderingContext2D,state:GameState,camX:number,camY:number,tick:number) {
  drawShardEffects(ctx,state,camX,camY);
  if((state.jupiter?.slowTicks??0)>0) {
    const x=Math.round(state.playerX-camX),y=Math.round(state.playerY-camY);
    const fade=Math.min(1,state.jupiter!.slowTicks/12),frame=Math.floor(tick/5);
    ctx.save();ctx.globalAlpha=fade*.8;
    // Small grounding contacts and intermittent ankle arcs, using the player's crisp geometry.
    // Leave the face and body clear; this is a debuff, not an enclosing shield or stacked waves.
    for(const side of [-1,1]) {
      const xx=x+side*11;
      rect(ctx,xx-5,y+16,10,4,'#183e50');rect(ctx,xx-4,y+16,8,2,'#83d5ed');
      if((frame+(side===1?2:0))%4<2) {
        ctx.strokeStyle='#86d7f0';ctx.lineWidth=2;ctx.beginPath();
        ctx.moveTo(x+side*14,y+7);ctx.lineTo(x+side*19,y+11);ctx.lineTo(x+side*15,y+15);ctx.lineTo(xx,y+18);ctx.stroke();
        rect(ctx,xx-2,y+16,4,2,'#def9ff');
      }
      if((frame+(side===1?1:0))%3===0)rect(ctx,x+side*23-1,y+13+(frame%2)*4,2,2,'#b9efff');
    }
    ctx.restore();
  }
  const left=state.jupiter?.guardTicks??0;if(left<=0)return;
  ctx.save();ctx.globalAlpha=Math.min(1,left/8);ctx.strokeStyle='#b8ffe8';ctx.lineWidth=3;ctx.shadowColor='#52ffd6';ctx.shadowBlur=4;
  const shell=(x:number,y:number,r:number)=>{
    ctx.strokeRect(Math.round(x-r),Math.round(y-r),r*2,r*2);
    ctx.fillStyle='#e4fff5';for(const a of [0,1,2,3]){const angle=a*Math.PI/2+tick*.08;ctx.fillRect(Math.round(x+Math.cos(angle)*r)-2,Math.round(y+Math.sin(angle)*r)-2,4,4);}
  };
  shell(state.playerX-camX,state.playerY-camY,state.playerCarryingRuby?34:28);
  if(state.rubyTileX>=0)shell((state.rubyTileX+.5)*TILE_SIZE-camX,(state.rubyTileY+.5)*TILE_SIZE-camY,26);
  ctx.restore();
}

export function drawJupiterTransition(ctx:CanvasRenderingContext2D,state:GameState,w:number,h:number,tick:number) {
  const j=state.jupiter;if(!j)return;const blend=j.stormBlend??0;
  if(j.stage==='charging') {
    const charge=Math.pow(j.energy/100,3),pulse=.65+.35*Math.sin(tick*.3);
    ctx.save();ctx.globalAlpha=charge*pulse*.065;rect(ctx,0,0,w,h,j.round===2?'#c5a4ff':'#76ffd7');
    ctx.globalAlpha=charge*.35;ctx.strokeStyle=j.round===2?'#c5a4ff':'#76ffd7';ctx.lineWidth=3;ctx.strokeRect(3,3,w-6,h-6);ctx.restore();
  }
  if(j.stage==='pursuit'&&j.stormAge<18) {
    const t=j.stormAge/18;ctx.save();ctx.globalAlpha=Math.pow(1-t,2)*.3;
    rect(ctx,0,0,w,h,j.round===2?'#e8dcff':'#d6fff1');
    ctx.globalAlpha=(1-t)*.55;ctx.strokeStyle=j.round===2?'#d5baff':'#8affe0';ctx.lineWidth=5;
    const r=.3+t*1.2;ctx.strokeRect(w*(1-r)/2,h*(1-r)/2,w*r,h*r);ctx.restore();
  }
  if(blend<=0||blend>=1)return;
  const entering=j.stage==='pursuit',progress=entering?blend:1-blend,impact=Math.sin(progress*Math.PI);
  ctx.save();
  ctx.globalAlpha=impact*.1;rect(ctx,0,0,w,h,entering?'#8affdf':'#ffcc8d');
  const front=w*(progress*1.4-.2);
  ctx.globalAlpha=impact*.16;rect(ctx,front-64,0,128,h,entering?'#52ffd6':'#ffc18a');
  ctx.globalAlpha=impact*.8;ctx.strokeStyle=entering?'#d8fff1':'#ffecd0';ctx.lineWidth=3;ctx.shadowColor=entering?'#52ffd6':'#ffc18a';ctx.shadowBlur=5;
  ctx.beginPath();ctx.moveTo(front,0);
  for(let i=1;i<=8;i++)ctx.lineTo(front+(i%2?18:-18),h*i/8);ctx.stroke();ctx.shadowBlur=0;
  // Long cardinal streaks convey pressure changing across the whole arena.
  for(let i=0;i<6;i++) {
    const y=h*(i+.5)/6,x=(tick*12+i*173)%w;
    ctx.globalAlpha=impact*.3;rect(ctx,x,y,70+impact*80,3,entering?'#b4ffe9':'#f7d3a9');
  }
  ctx.globalAlpha=impact*.6;ctx.strokeStyle=entering?'#6feacb':'#e9b679';ctx.lineWidth=4;
  const inset=4+progress*12;ctx.strokeRect(inset,inset,w-inset*2,h-inset*2);
  ctx.restore();
}
