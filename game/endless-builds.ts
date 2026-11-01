import { TILE_SIZE, CHAMBER_BOUNDS, isBossType } from './constants';
import { damageEnemy, healPlayer, healCore, isFloorTile, playAudioOneShot, type Enemy, type GameState } from './engine';

export const CELESTIAL_BLESSINGS = {
  blind_prayer: { name: 'Citrine', celestial: 'Sirius', cut: 'brilliant', description: 'Every third Laser or Charge Wave grants you and Ruby a small shield.', color: '#ffdf89' },
  frost_warden: { name: 'Aquamarine', celestial: 'Saturn', cut: 'prism', description: 'Charge Waves chill enemies, slowing them for two seconds.', color: '#a3e8ef' },
  fiery_king: { name: 'Amber', celestial: 'Sun', cut: 'cushion', description: 'Meteors leave burning patches that hurt enemies.', color: '#ffb16e' },
  storm_reaper: { name: 'Emerald', celestial: 'Jupiter', cut: 'emerald', description: 'Laser hits arc to one nearby enemy for reduced damage.', color: '#89efd0' },
  splitter_queen: { name: 'Amethyst', celestial: 'Moon', cut: 'crystal', description: 'Every fourth bullet hit creates a weaker echo hit.', color: '#c9b2ff' },
  devourer: { name: 'Obsidian', celestial: 'Singularity', cut: 'shard', description: 'Bombs leave a brief gravity field that pulls and hurts enemies.', color: '#9b91bd' },
  astral_twins: { name: 'Rubellite', celestial: 'Binary Star', cut: 'twin', description: 'Alternating Laser and Charge Wave strengthens the next cast.', color: '#ffb6ab' },
  sea_chanter: { name: 'Sapphire', celestial: 'Neptune', cut: 'kite', description: 'Charge Waves periodically restore a little health to you and Ruby.', color: '#88cfff' },
  thorn_weaver: { name: 'Peridot', celestial: 'Gaia', cut: 'hexagon', description: 'Repeated bullet hits briefly root their target.', color: '#b5d883' },
  aegis_sentinel: { name: 'Turquoise', celestial: 'Venus', cut: 'square', description: 'A small shield for you and Ruby regenerates over time.', color: '#8fe6df' },
} as const;
export type CelestialBlessing = keyof typeof CELESTIAL_BLESSINGS;
export type BuildZone = { x:number; y:number; radius:number; ticks:number; damage:number; kind:'trail'|'fire'|'gravity' };
export interface RunBuildState {
  blessings: CelestialBlessing[]; blessingChoices: CelestialBlessing[]; pendingBlessings: number;
  zones: BuildZone[];
  echoes: { x:number; y:number; radius:number; damage:number; ticks:number }[];
  quickWave: boolean; lastCast: 'laser'|'wave'|null; castCount:number; bulletHits:number;
  tideReadyAt:number; shieldReadyAt:number; trailTick:number;
}
export function createRunBuildState():RunBuildState {
  return { blessings:[],blessingChoices:[],pendingBlessings:0,zones:[],echoes:[],quickWave:false,lastCast:null,castCount:0,bulletHits:0,tideReadyAt:0,shieldReadyAt:900,trailTick:0 };
}
export function hasBlessing(state:GameState,kind:CelestialBlessing) { return state.build.blessings.includes(kind); }
export function offerCelestialBlessing(state:GameState) {
  if((state.mode==='endless'||state.mode==='ascension')&&state.bossesKilled>=20&&state.bossesKilled%10===0)state.build.pendingBlessings++;
}
export function prepareBlessingChoice(state:GameState) {
  if(!state.build.pendingBlessings||state.gamePhase!=='playing'||state.constellationChoices.length||state.constellationDelayTicks)return;
  const pool=(Object.keys(CELESTIAL_BLESSINGS) as CelestialBlessing[]).filter(k=>!hasBlessing(state,k));
  state.build.pendingBlessings--;
  if(!pool.length)return;
  state.build.blessingChoices=pool;
  state.gamePhase='blessing';state.playerQueuedDirX=state.playerQueuedDirY=0;
  playAudioOneShot('/sounds/constellation-choice.wav',.6);
}
export function chooseCelestialBlessing(state:GameState,kind:CelestialBlessing):boolean {
  if(state.gamePhase!=='blessing'||!state.build.blessingChoices.includes(kind)||hasBlessing(state,kind))return false;
  state.build.blessings.push(kind);state.build.blessingChoices=[];state.gamePhase='playing';
  playAudioOneShot('/sounds/constellation-chosen.wav',.6);
  state.build.shieldReadyAt=state.gameTick+900;
  return true;
}
function shield(state:GameState,amount:number,cap:number) {
  // Never replace or reduce a larger Saturn shield.
  state.playerShieldHP=Math.max(state.playerShieldHP,Math.min(cap,state.playerShieldHP+amount));
  state.rubyShieldHP=Math.max(state.rubyShieldHP,Math.min(cap,state.rubyShieldHP+amount));
  state.rewardEffects.push({target:'player',kind:'shield',ticks:45},{target:'ruby',kind:'shield',ticks:45});
}
export function buildCastMultiplier(state:GameState,kind:'laser'|'wave') {
  const b=state.build,boost=hasBlessing(state,'astral_twins')&&b.lastCast!==null&&b.lastCast!==kind?1.2:1;
  b.lastCast=kind;
  if(hasBlessing(state,'blind_prayer')&&++b.castCount%3===0)shield(state,6,12);
  if(kind==='wave'&&hasBlessing(state,'sea_chanter')&&state.gameTick>=b.tideReadyAt){healPlayer(state,3);healCore(state,3);b.tideReadyAt=state.gameTick+240;}
  return boost;
}
function extraHit(state:GameState,enemy:Enemy,damage:number) {
  if(enemy.hp>0)damageEnemy(state,enemy,damage,'special');
}
export function buildBulletHit(state:GameState,enemy:Enemy,damage:number) {
  if(enemy.hp<=0)return;
  if(state.constellations.includes('bulletMark')) {enemy.buildMarks=Math.min(3,(enemy.buildMarks??0)+1);enemy.buildMarkUntil=state.gameTick+360;}
  if(hasBlessing(state,'splitter_queen')&&++state.build.bulletHits%4===0) {
    extraHit(state,enemy,damage*.65);
    state.lightningArcs.push({fromX:enemy.x-18,fromY:enemy.y-18,toX:enemy.x+18,toY:enemy.y+18,ticks:12});
  }
  if(hasBlessing(state,'thorn_weaver')) {
    enemy.buildRootHits=(enemy.buildRootHits??0)+1;
    if(enemy.buildRootHits>=5){enemy.buildRootHits=0;enemy.buildRootUntil=state.gameTick+90;}
  }
}
export function buildLaserHit(state:GameState,enemy:Enemy,damage:number) {
  if(!hasBlessing(state,'storm_reaper'))return;
  const target=state.enemies.filter(e=>e!==enemy&&e.hp>0&&!e.twin?.downedTicks&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<=3*TILE_SIZE).sort((a,b)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(b.x-enemy.x,b.y-enemy.y))[0];
  if(target){extraHit(state,target,damage*.3);state.lightningArcs.push({fromX:enemy.x,fromY:enemy.y,toX:target.x,toY:target.y,ticks:14});}
}
export function buildWaveHit(state:GameState,enemy:Enemy,damage:number) {
  if(hasBlessing(state,'frost_warden')){enemy.buildSlowUntil=Math.max(enemy.buildSlowUntil??0,state.gameTick+120);enemy.buildSlow=.65;}
  if(!state.constellations.includes('bulletMark')||(enemy.buildMarks??0)<3||(enemy.buildMarkUntil??0)<state.gameTick)return;
  enemy.buildMarks=0;
  state.bombBlasts.push({cx:enemy.x,cy:enemy.y,radius:0,maxRadius:1.6*TILE_SIZE,ticks:28});
  for(const target of [...state.enemies])if(Math.hypot(target.x-enemy.x,target.y-enemy.y)<=1.6*TILE_SIZE)extraHit(state,target,damage*.3);
}
export function emitBuildWave(state:GameState,x:number,y:number,radius:number,damage:number) {
  state.waveEffects.push({cx:x,cy:y,radius:0,maxRadius:radius*TILE_SIZE,ticks:30});
  for(const enemy of [...state.enemies])if(Math.hypot(enemy.x-x,enemy.y-y)<=radius*TILE_SIZE)extraHit(state,enemy,damage);
}
export function buildMeteorZones(state:GameState,room:number) {
  if(!hasBlessing(state,'fiery_king'))return;
  const [r1,c1,r2,c2]=CHAMBER_BOUNDS[room];
  for(const [fx,fy]of [[.3,.3],[.7,.3],[.5,.7]]) {
    const tx=Math.round(c1+(c2-c1)*fx),ty=Math.round(r1+(r2-r1)*fy);
    let spot:[number,number]|undefined;
    for(let r=0;r<4&&!spot;r++)for(let dy=-r;dy<=r&&!spot;dy++)for(let dx=-r;dx<=r;dx++)if(isFloorTile(state.map,tx+dx,ty+dy)){spot=[tx+dx,ty+dy];break;}
    if(spot)state.build.zones.push({x:(spot[0]+.5)*TILE_SIZE,y:(spot[1]+.5)*TILE_SIZE,radius:2,ticks:360,damage:Math.min(12,4+state.bossesKilled*.2),kind:'fire'});
  }
}
export function buildSlowMultiplier(state:GameState,enemy:Enemy) {
  return Math.min((enemy.buildSlowUntil??0)>state.gameTick?(enemy.buildSlow??1):1,(enemy.buildRootUntil??0)>state.gameTick?(isBossType(enemy.type)?.65:.15):1);
}
// Pull by complete floor tiles only; reset interpolation so cover is never crossed.
export function pullBuildEnemies(state:GameState,x:number,y:number,radius:number) {
  for(const e of state.enemies) {
    if(e.hp<=0||isBossType(e.type)||e.twin?.downedTicks||Math.hypot(e.x-x,e.y-y)>radius*TILE_SIZE)continue;
    const dx=x-e.x,dy=y-e.y,tx=e.tileX+(Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0),ty=e.tileY+(Math.abs(dy)>Math.abs(dx)?Math.sign(dy):0);
    if(isFloorTile(state.map,tx,ty)){e.tileX=e.targetTileX=tx;e.tileY=e.targetTileY=ty;e.x=(tx+.5)*TILE_SIZE;e.y=(ty+.5)*TILE_SIZE;e.stepProgress=0;e.path=[];e.pathTimer=0;}
  }
}
export function updateRunBuilds(state:GameState) {
  const b=state.build;
  for(const echo of b.echoes)if(--echo.ticks===0)emitBuildWave(state,echo.x,echo.y,echo.radius,echo.damage);
  b.echoes=b.echoes.filter(e=>e.ticks>0);
  if(state.constellations.includes('boostTrail')&&state.speedActiveTicks>0&&state.gameTick-b.trailTick>=10) {
    b.trailTick=state.gameTick;b.zones.push({x:state.playerX,y:state.playerY,radius:.65,ticks:90,damage:0,kind:'trail'});
  }
  for(const zone of b.zones) {
    zone.ticks--;
    for(const enemy of state.enemies)if(enemy.hp>0&&Math.hypot(enemy.x-zone.x,enemy.y-zone.y)<=zone.radius*TILE_SIZE) {
      if(zone.kind==='trail'){enemy.buildSlow=.65;enemy.buildSlowUntil=Math.max(enemy.buildSlowUntil??0,state.gameTick+15);}
      else if(state.gameTick%30===0)extraHit(state,enemy,zone.damage*.5);
    }
    if(zone.kind==='gravity'&&state.gameTick%20===0)pullBuildEnemies(state,zone.x,zone.y,zone.radius);
  }
  b.zones=b.zones.filter(z=>z.ticks>0).slice(-80);
  if(hasBlessing(state,'aegis_sentinel')&&state.gameTick>=b.shieldReadyAt){shield(state,8,16);b.shieldReadyAt=state.gameTick+900;}
}
