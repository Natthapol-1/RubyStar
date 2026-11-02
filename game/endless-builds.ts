import {playBlessingPassive,playGemFieldHit,blessingEnemySlow,updateBlessingEffects,type QueenBlessingDecoy} from './blessing-effects';
import {playUiSfx} from './ui-sfx';
import {getProfile,isDesktop} from './profile';
import { TILE_SIZE, CHAMBER_BOUNDS, WAVE_RADIUS, WAVE_DMG, isBossType } from './constants';
import { damageEnemy, healPlayer, healCore, isFloorTile, playAudioOneShot, type Enemy, type GameState } from './engine';

export const BLESSING_REVEAL_TICKS = 72;
export const CELESTIAL_BLESSINGS = {
  stardust: {name:'Stardust',celestial:'Temporary blessing',cut:'brilliant',description:'Grants you and Ruby a small shield periodically. Clear a world to unlock its gemstone.',color:'#b4c2d6'},
  blind_prayer: { name: 'Amber', celestial: 'Sirius', cut: 'prism', description: 'Gain energy faster, refresh abilities at full energy, and stay powered 1s longer.', color: '#ffc53d' },
  frost_warden: { name: 'Diamond', celestial: 'Saturn', cut: 'diamond', description: 'Healing grants shield; harder incoming hits grant more.', color: '#39cde0' },
  fiery_king: { name: 'Ruby', celestial: 'Sun', cut: 'cushion', description: 'Stay unharmed to move faster and strike with stronger red attacks. Hits end the surge.', color: '#f52b50' },
  storm_reaper: { name: 'Emerald', celestial: 'Jupiter', cut: 'emerald', description: 'Attacking builds speed. Your hits stack a slowing charge on enemies.', color: '#1dd5a0' },
  splitter_queen: { name: 'Amethyst', celestial: 'Moon', cut: 'crystal', description: 'Speed bursts leave up to three shooting decoys. Enemies can destroy them.', color: '#a56af0' },
  devourer: { name: 'Obsidian', celestial: 'Singularity', cut: 'shard', description: 'Defeated enemies can leave larger gravity wells that pull, damage and slow.', color: '#75618e' },
  astral_twins: { name: 'Opal', celestial: 'Binary Star', cut: 'twin', description: 'Ruby sometimes copies your Laser, Wave, bullets or bomb.', color: '#82baff' },
  sea_chanter: { name: 'Sapphire', celestial: 'Neptune', cut: 'sapphire', description: 'Your attacks leech health and briefly weaken enemies.', color: '#288ef0' },
  thorn_weaver: { name: 'Peridot', celestial: 'Gaia', cut: 'hexagon', description: 'Walking leaves wider, lingering fields that hurt and slow enemies.', color: '#87bf3b' },
  aegis_sentinel: { name: 'Pearl', celestial: 'Venus', cut: 'pearl', description: 'Take 20% less damage and reflect hits before this reduction.', color: '#e8ccd3' },
} as const;
export type CelestialBlessing = keyof typeof CELESTIAL_BLESSINGS;
export type BuildZone = { x:number; y:number; radius:number; ticks:number; damage:number; kind:'trail'|'fire'|'gravity'|'nebula'|'growth'|'void' };
export interface RunBuildState {
  siriusRefreshSerial?:number; sunUntouchedTicks?:number; reaperHaste?:number[]; sapphireWindowAt?:number; sapphireHealing?:number;
  obsidianBossReadyAt?:number; obsidianBossHits?:{enemyId:number;tick:number}[];
  wardenReadyAt?:number; queenDecoys?:QueenBlessingDecoy[]; nextQueenId?:number; queenTargetId?:number; weaverTile?:string;
  blessingReveal?:{kind:CelestialBlessing;ticks:number};
  gemPassiveReadyAt?:Partial<Record<CelestialBlessing,number>>; gemPassiveLastTick?:number; gemFieldSoundReadyAt?:number; gemDecoySoundReadyAt?:number;
  sapphireRegenUntil?:number; diamondShieldUntil?:number; amberRefreshUntil?:number; pearlReflectUntil?:number; pearlReflectTarget?:{x:number;y:number;until:number}; opalFlash?:{x:number;y:number;until:number};
  blessings: CelestialBlessing[]; blessingChoices: CelestialBlessing[]; pendingBlessings: number;
  zones: BuildZone[];
  echoes: { x:number; y:number; radius:number; damage:number; ticks:number }[];
  rubyWaveStored: boolean; wallStepReady: boolean; bulletBurstReadyAt: number;
  decoy: {x:number;y:number;tileX:number;tileY:number;ticks:number}|null; decoyTargetActive: boolean;
  tripwireCastSerial?:number;
  tripwires: {x1:number;y1:number;x2:number;y2:number;damage:number;ticks:number;armTicks:number;blockedIds:number[];castId?:number}[];
  impacts: {x:number;y:number;kind:'slam'|'wire'|'phase';ticks:number}[];
  waveLaserReady: boolean; godBlessingMode: boolean;
  quickWave: boolean; lastCast: 'laser'|'wave'|null; castCount:number; bulletHits:number;
  shieldBulletHits?:number; bulletShieldReadyAt?:number;
  tideReadyAt:number; shieldReadyAt:number; trailTick:number;
}
export function createRunBuildState():RunBuildState {
  return { rubyWaveStored:false,wallStepReady:false,bulletBurstReadyAt:0,decoy:null,decoyTargetActive:false,tripwires:[],impacts:[],blessings:[],blessingChoices:[],pendingBlessings:0,zones:[],echoes:[],waveLaserReady:false,godBlessingMode:false,quickWave:false,lastCast:null,castCount:0,bulletHits:0,tideReadyAt:0,shieldReadyAt:900,trailTick:0 };
}
export function hasBlessing(state:GameState,kind:CelestialBlessing) { return state.build.blessings.includes(kind); }
export function offerCelestialBlessing(state:GameState) {
  if((state.mode==='endless'||state.mode==='ascension')&&state.bossesKilled>=20&&state.bossesKilled%10===0)state.build.pendingBlessings++;
}
export function prepareBlessingChoice(state:GameState) {
  if(!state.build.pendingBlessings||state.gamePhase!=='playing'||state.constellationChoices.length||state.constellationDelayTicks)return;
  const pool=(Object.keys(CELESTIAL_BLESSINGS) as CelestialBlessing[]).filter(k=>!hasBlessing(state,k)&&(isDesktop()?(k==='stardust'?getProfile().completed.length===0:getProfile().completed.includes(k)):k!=='stardust'));
  state.build.pendingBlessings--;
  if(!pool.length)return;
  state.build.blessingChoices=pool;
  state.gamePhase='blessing';state.playerQueuedDirX=state.playerQueuedDirY=0;
  playAudioOneShot('/sounds/constellation-choice.wav',.6);
}
export function chooseCelestialBlessing(state:GameState,kind:CelestialBlessing):boolean {
  if(state.gamePhase!=='blessing'||!state.build.blessingChoices.includes(kind))return false;
  if(!state.build.godBlessingMode&&hasBlessing(state,kind))return false;
  if(state.build.godBlessingMode){const i=state.build.blessings.indexOf(kind);if(i>=0)state.build.blessings.splice(i,1);else {state.build.blessings.push(kind);state.build.blessingReveal={kind,ticks:BLESSING_REVEAL_TICKS};playUiSfx('gemBlessing');}return true;}
  state.build.blessings.push(kind);state.build.blessingReveal={kind,ticks:BLESSING_REVEAL_TICKS};state.build.blessingChoices=[];state.gamePhase='playing';
  playUiSfx('gemBlessing');
  state.build.shieldReadyAt=state.gameTick+900;
  return true;
}
function shield(state:GameState,amount:number,cap:number) {
  // Never replace or reduce a larger Saturn shield.
  state.playerShieldHP=Math.max(state.playerShieldHP,state.saturn ? state.playerShieldHP+amount : Math.min(cap,state.playerShieldHP+amount));
  state.rubyShieldHP=Math.max(state.rubyShieldHP,state.saturn ? state.rubyShieldHP+amount : Math.min(cap,state.rubyShieldHP+amount));
  state.rewardEffects.push({target:'player',kind:'shield',ticks:45},{target:'ruby',kind:'shield',ticks:45});
}
function extraHit(state:GameState,enemy:Enemy,damage:number) {
  if(enemy.hp>0)damageEnemy(state,enemy,damage,'special');
}
export function buildBulletHit(state:GameState,enemy:Enemy,damage:number) {
  if(state.constellations.includes('bulletShield')){
    const b=state.build;b.shieldBulletHits=Math.min(8,(b.shieldBulletHits??0)+1);
    if(b.shieldBulletHits>=8&&state.gameTick>=(b.bulletShieldReadyAt??0)){
      b.shieldBulletHits=0;b.bulletShieldReadyAt=state.gameTick+180;
      state.playerShieldHP=Math.max(state.playerShieldHP,state.saturn ? state.playerShieldHP+4 : Math.min(12,state.playerShieldHP+4));
      state.rewardEffects.push({target:'player',kind:'shield',ticks:45});
    }
  }
  if(state.constellations.includes('bulletBurst')&&state.gameTick>=state.build.bulletBurstReadyAt){
    state.build.bulletBurstReadyAt=state.gameTick+90;
    const radius=1.5*TILE_SIZE;
    state.bombBlasts.push({cx:enemy.x,cy:enemy.y,radius:0,maxRadius:radius,ticks:24});
    for(const target of [...state.enemies])if(target.hp>0&&!target.twin?.downedTicks&&Math.hypot(target.x-enemy.x,target.y-enemy.y)<=radius)extraHit(state,target,damage);
  }
  if(enemy.hp<=0)return;
  if(state.constellations.includes('bulletMark')) {enemy.buildMarks=Math.min(3,(enemy.buildMarks??0)+1);enemy.buildMarkUntil=state.gameTick+360;}

}
export function buildWaveHit(state:GameState,enemy:Enemy,damage:number) {
  if(!state.constellations.includes('bulletMark')||(enemy.buildMarks??0)<3||(enemy.buildMarkUntil??0)<state.gameTick)return;
  enemy.buildMarks=0;
  state.bombBlasts.push({cx:enemy.x,cy:enemy.y,radius:0,maxRadius:1.6*TILE_SIZE,ticks:28});
  for(const target of [...state.enemies])if(Math.hypot(target.x-enemy.x,target.y-enemy.y)<=1.6*TILE_SIZE)extraHit(state,target,damage*.5);
}
export function emitBuildWave(state:GameState,x:number,y:number,radius:number,damage:number) {
  state.waveEffects.push({cx:x,cy:y,radius:0,maxRadius:radius*TILE_SIZE,ticks:30});
  for(const enemy of [...state.enemies])if(Math.hypot(enemy.x-x,enemy.y-y)<=radius*TILE_SIZE)extraHit(state,enemy,damage);
}
export function buildSlowMultiplier(state:GameState,enemy:Enemy) {
  return Math.min(blessingEnemySlow(state,enemy),(enemy.buildSlowUntil??0)>state.gameTick?(enemy.buildSlow??1):1,(enemy.buildRootUntil??0)>state.gameTick?(isBossType(enemy.type)?.65:.15):1);
}
// Pull by complete floor tiles only; reset interpolation so cover is never crossed.
export function pullBuildEnemies(state:GameState,x:number,y:number,radius:number,pulled?:Set<number>) {
  for(const e of state.enemies) {
    if(e.hp<=0||pulled?.has(e.id)||isBossType(e.type)||e.twin?.downedTicks||Math.hypot(e.x-x,e.y-y)>radius*TILE_SIZE)continue;
    pulled?.add(e.id);
    const dx=x-e.x,dy=y-e.y,tx=e.tileX+(Math.abs(dx)>=Math.abs(dy)?Math.sign(dx):0),ty=e.tileY+(Math.abs(dy)>Math.abs(dx)?Math.sign(dy):0);
    if(isFloorTile(state.map,tx,ty)){e.tileX=e.targetTileX=tx;e.tileY=e.targetTileY=ty;e.x=(tx+.5)*TILE_SIZE;e.y=(ty+.5)*TILE_SIZE;e.stepProgress=0;e.path=[];e.pathTimer=0;}
  }
}
export function distanceToBuildWire(x:number,y:number,wire:{x1:number;y1:number;x2:number;y2:number}) {
  const dx=wire.x2-wire.x1,dy=wire.y2-wire.y1,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((x-wire.x1)*dx+(y-wire.y1)*dy)/length)):0;
  return Math.hypot(x-wire.x1-t*dx,y-wire.y1-t*dy);
}
export function storeLaserTripwires(state:GameState,firstBeam:number,damage:number) {
  if(!state.constellations.includes('laserWire'))return;
  const b=state.build,existing=b.tripwires.filter(wire=>wire.ticks>0),castId=Math.max(b.tripwireCastSerial??0,...existing.map(wire=>wire.castId??0))+1;
  b.tripwireCastSerial=castId;
  const hasPreviousCast=existing.some(wire=>wire.castId===castId-1);
  const untracked=existing.filter(wire=>wire.castId===undefined);
  if(!hasPreviousCast&&untracked.length){
    const newestTicks=Math.max(...untracked.map(wire=>wire.ticks));
    for(const wire of untracked)if(wire.ticks===newestTicks)wire.castId=castId-1;else wire.ticks=0;
  }
  const previous=existing.filter(wire=>wire.ticks>0&&wire.castId===castId-1);
  const current=state.laserBeams.slice(firstBeam).filter(beam=>Math.hypot(beam.endX-beam.fromX,beam.endY-beam.fromY)>8).map(beam=>{
    const wire={x1:beam.fromX,y1:beam.fromY,x2:beam.endX,y2:beam.endY,damage:(beam.buildDamage??damage)*.75,ticks:300,armTicks:18,blockedIds:[] as number[],castId};
    wire.blockedIds=state.enemies.filter(enemy=>distanceToBuildWire(enemy.x,enemy.y,wire)<=18).map(enemy=>enemy.id);
    return wire;
  });
  b.tripwires=[...previous,...current];
}
export function updateRunBuilds(state:GameState) {
  const b=state.build;
  if(b.blessingReveal&&--b.blessingReveal.ticks<=0)b.blessingReveal=undefined;
  b.impacts=b.impacts.filter(effect=>--effect.ticks>0);
  if(b.decoy&&(--b.decoy.ticks<=0||!state.constellations.includes('teleportDecoy'))){b.decoy=null;state.enemies.forEach(enemy=>enemy.pathTimer=0);}
  if(!state.constellations.includes('rubyDefense'))b.rubyWaveStored=false;
  if(!state.constellations.includes('wallStep'))b.wallStepReady=false;
  if(state.speedActiveTicks<=0)b.wallStepReady=false;
  if(!state.constellations.includes('laserWire'))b.tripwires=[];
  if(b.rubyWaveStored&&state.rubyTileX>=0&&!state.playerCarryingRuby){
    const x=(state.rubyTileX+.5)*TILE_SIZE,y=(state.rubyTileY+.5)*TILE_SIZE;
    if(state.enemies.some(enemy=>enemy.hp>0&&!enemy.twin?.downedTicks&&Math.hypot(enemy.x-x,enemy.y-y)<=3*TILE_SIZE)){
      b.rubyWaveStored=false;
      emitBuildWave(state,x,y,WAVE_RADIUS*.6,WAVE_DMG*.5*(state.constellations.includes('wave')?1.25:1));
      for(const enemy of state.enemies)if(enemy.hp>0&&!isBossType(enemy.type)&&Math.hypot(enemy.x-x,enemy.y-y)<=WAVE_RADIUS*.6*TILE_SIZE){
        const dx=enemy.tileX-state.rubyTileX,dy=enemy.tileY-state.rubyTileY;
        enemy.pushDirX=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx)||1:0;enemy.pushDirY=enemy.pushDirX?0:Math.sign(dy)||1;enemy.pushTiles=Math.max(1,enemy.pushTiles);
      }
    }
  }
  for(const wire of b.tripwires){
    wire.ticks--;if(wire.armTicks>0){wire.armTicks--;continue;}
    wire.blockedIds=wire.blockedIds.filter(id=>state.enemies.some(enemy=>enemy.id===id&&distanceToBuildWire(enemy.x,enemy.y,wire)<=18));
    const enemy=state.enemies.find(enemy=>enemy.hp>0&&!enemy.twin?.downedTicks&&!wire.blockedIds.includes(enemy.id)&&distanceToBuildWire(enemy.x,enemy.y,wire)<=18&&isFloorTile(state.map,Math.floor(enemy.x/TILE_SIZE),Math.floor(enemy.y/TILE_SIZE)));
    if(enemy){
      wire.ticks=0;extraHit(state,enemy,wire.damage);
      playAudioOneShot('/sounds/jupiter-fence-cast.wav',.85);
      enemy.buildStopUntil=Math.max(enemy.buildStopUntil??0,state.gameTick+(isBossType(enemy.type)?15:30));
      b.impacts.push({x:enemy.x,y:enemy.y,kind:'wire',ticks:18});
    }
  }
  b.tripwires=b.tripwires.filter(wire=>wire.ticks>0);
  for(const echo of b.echoes)if(--echo.ticks===0)emitBuildWave(state,echo.x,echo.y,echo.radius,echo.damage);
  b.echoes=b.echoes.filter(e=>e.ticks>0);
  if(state.constellations.includes('boostTrail')&&state.speedActiveTicks>0) {
    const tx=Math.floor(state.playerX/TILE_SIZE),ty=Math.floor(state.playerY/TILE_SIZE),x=(tx+.5)*TILE_SIZE,y=(ty+.5)*TILE_SIZE;
    if(isFloorTile(state.map,tx,ty)){
      const existing=b.zones.find(zone=>zone.kind==='trail'&&zone.x===x&&zone.y===y);
      if(existing)existing.ticks=90;
      else b.zones.push({x,y,radius:.5,ticks:90,damage:0,kind:'trail'});
    }
  }
  const voidPulled=new Set<number>();
  for(const zone of b.zones) {
    zone.ticks--;
    for(const enemy of state.enemies)if(enemy.hp>0&&(zone.kind==='trail'?Math.floor(enemy.x/TILE_SIZE)===Math.floor(zone.x/TILE_SIZE)&&Math.floor(enemy.y/TILE_SIZE)===Math.floor(zone.y/TILE_SIZE):Math.hypot(enemy.x-zone.x,enemy.y-zone.y)<=zone.radius*TILE_SIZE)) {
      if(zone.kind==='trail'){enemy.buildSlow=.65;enemy.buildSlowUntil=Math.max(enemy.buildSlowUntil??0,state.gameTick+15);}
      else if(zone.kind!=='nebula'&&zone.kind!=='growth'&&zone.kind!=='void'&&state.gameTick%30===0)extraHit(state,enemy,zone.damage*.5);
    }
    if(zone.kind==='void'&&zone.ticks>0&&state.gameTick%30===0)pullBuildEnemies(state,zone.x,zone.y,zone.radius,voidPulled);
  }
  // A well can damage and slow each enemy once per pulse, even inside overlapping wells.
  for(const enemy of [...state.enemies])if(enemy.hp>0&&!enemy.twin?.downedTicks&&isFloorTile(state.map,enemy.tileX,enemy.tileY)&&b.zones.some(z=>z.kind==='void'&&z.ticks>0&&Math.hypot(enemy.x-z.x,enemy.y-z.y)<=z.radius*TILE_SIZE)){
    const slow=isBossType(enemy.type)?.85:.75;
    enemy.buildSlow=(enemy.buildSlowUntil??0)>state.gameTick?Math.min(enemy.buildSlow??1,slow):slow;
    enemy.buildSlowUntil=Math.max(enemy.buildSlowUntil??0,state.gameTick+2);
    if(state.gameTick%30===0){const hp=enemy.hp,shield=enemy.icyShieldHP;damageEnemy(state,enemy,isBossType(enemy.type)?enemy.maxHp*.0015:3,'summon');if(enemy.hp<hp||enemy.icyShieldHP<shield)playGemFieldHit(state);}
  }
  // Shared fields use one membership test per enemy, so neither source nor overlap stacks.
  for(const enemy of [...state.enemies])if(enemy.hp>0&&!enemy.twin?.downedTicks&&isFloorTile(state.map,enemy.tileX,enemy.tileY)&&b.zones.some(zone=>zone.kind==='nebula'&&zone.ticks>0&&nebulaContainsTile(zone,enemy.tileX,enemy.tileY))){
    const slow=isBossType(enemy.type)?.9:.8;
    enemy.buildSlow=(enemy.buildSlowUntil??0)>state.gameTick?Math.min(enemy.buildSlow??1,slow):slow;
    enemy.buildSlowUntil=Math.max(enemy.buildSlowUntil??0,state.gameTick+2);
    if(state.gameTick%30===0)extraHit(state,enemy,1);
  }
  b.zones=b.zones.filter(z=>z.ticks>0).slice(-80);
  if(hasBlessing(state,'stardust')&&state.gameTick>=b.shieldReadyAt){const before=state.playerShieldHP+state.rubyShieldHP;shield(state,2,4);if(state.playerShieldHP+state.rubyShieldHP>before)playBlessingPassive(state,'stardust');b.shieldReadyAt=state.gameTick+1800;}
  updateBlessingEffects(state);
}

export function openGodBlessings(state:GameState):boolean {
  if(state.gamePhase!=='playing'||state.constellationChoices.length||state.build.blessingChoices.length)return false;
  state.build.godBlessingMode=true;state.build.blessingChoices=(Object.keys(CELESTIAL_BLESSINGS) as CelestialBlessing[]).filter(k=>k!=='stardust');state.gamePhase='blessing';state.playerQueuedDirX=state.playerQueuedDirY=0;
  playAudioOneShot('/sounds/constellation-choice.wav',.6);return true;
}
export function closeGodBlessings(state:GameState):boolean {
  if(state.gamePhase!=='blessing'||!state.build.godBlessingMode)return false;
  state.build.godBlessingMode=false;state.build.blessingChoices=[];state.gamePhase='playing';return true;
}

export function addNebulaField(state:GameState,tileX:number,tileY:number,ticks:number,radius=1.25){
  if(!isFloorTile(state.map,tileX,tileY))return;
  const x=(tileX+.5)*TILE_SIZE,y=(tileY+.5)*TILE_SIZE;
  const old=state.build.zones.find(z=>z.kind==='nebula'&&z.x===x&&z.y===y);
  if(old){old.ticks=Math.max(old.ticks,ticks);old.radius=Math.max(old.radius,radius);return;}
  const fields=state.build.zones.filter(z=>z.kind==='nebula');
  if(fields.length>=8)state.build.zones.splice(state.build.zones.indexOf(fields[0]),1);
  state.build.zones.push({x,y,radius,ticks,damage:2,kind:'nebula'});
}
export function buildChargeField(state:GameState){
  if(state.gamePhase==='playing'&&state.waveCooldown<=0&&state.constellations.includes('chargeField'))addNebulaField(state,state.playerTileX,state.playerTileY,90,2.25);
}
export function buildDeathField(state:GameState,enemy:Enemy){
  if(state.constellations.includes('deathField'))addNebulaField(state,enemy.tileX,enemy.tileY,240);
}
export function buildBombStun(state:GameState,enemy:Enemy){
  if(enemy.hp>0&&state.constellations.includes('bombStun'))enemy.buildStopUntil=Math.max(enemy.buildStopUntil??0,state.gameTick+(isBossType(enemy.type)?60:72));
}

export function nebulaContainsTile(zone:BuildZone,tx:number,ty:number){return Math.hypot(tx-Math.floor(zone.x/TILE_SIZE),ty-Math.floor(zone.y/TILE_SIZE))<=zone.radius;}
