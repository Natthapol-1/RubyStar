import { CHAMBER_BOUNDS, ENEMY_CONFIGS, JUPITER, PLAYER_BASE_SPEED, SPECIAL_REAPER_SLOW, TILE_SIZE, T_FLOOR, MAP_COLS, MAP_ROWS, chamberOfTile } from './constants';
import { ATTACK_SFX_VOLUME, bfs, damageEnemy, damagePlayer, damageRuby, godSpawnBoss, healPlayer, stormSlowMultiplier, playSFX_pickup, isFloorTile, killEnemy, playSFX_reaperStrike, playAudioOneShot, tryReaperHallwaySeal, type Enemy, type GameState } from './engine';
import { playUiSfx } from './ui-sfx';
import { playJupiterAmbientSound, stopJupiterAmbientSound, playJupiterChargeSound, stopJupiterChargeSound } from './event-audio';

export type JupiterStage = 'charging' | 'pursuit' | 'escape';
export interface VoltWall { x: number; y: number; vertical: boolean; half: number; negative?: number; positive?: number; age: number }
export interface ChargedTile { id: number; room: number; x: number; y: number; cooldown: number }
export interface PursuitFragment { id: number; x: number; y: number }
export interface MiniStorm { id: number; room: number; x: number; y: number; path: [number,number][]; retarget: number }
export interface JupiterState {
  phase: 1 | 2 | 3; bossId: number; stage: JupiterStage; round: 1 | 2;
  ambientTimer: number; stormBlend: number; energy: number; stageTicks: number; safeRoom: number; stormAge: number; stormTimer: number;
  playerDashX: number; playerDashY: number; bossDashX: number; bossDashY: number;
  guardTicks: number; wallCooldown: number; playerBoost: number; bossBoost: number; boostCooldown: number;
  shardTarget: number; shards: {id:number;x:number;y:number}[]; shardEffects: {x:number;y:number;bossX:number;bossY:number;heal:boolean;ticks:number}[]; shardPlayerX:number; shardPlayerY:number; shardBossX:number; shardBossY:number; chargeRoom: number; blast: {room:number;ticks:number}|null; slowTicks: number;
  shockTiles: ChargedTile[]; tileBursts: {x:number;y:number;ticks:number}[];
  fragments: PursuitFragment[]; fragmentOverdrive: boolean; overdriveCharge: number; overdriveBurstTicks: number;
  miniStorms: MiniStorm[]; miniStormHitCooldown: number;
  walls: VoltWall[]; bursts: { x: number; y: number; ticks: number; vertical: boolean; half: number; negative?: number; positive?: number }[];
}

export function createJupiterState(state: GameState) {
  state.jupiter = { phase: 1, bossId: -1, stage: 'charging', round: 1, ambientTimer: 180 + Math.floor(Math.random()*240), stormBlend: 0, energy: 0, stageTicks: JUPITER.chargeTicks,
    playerDashX: 1, playerDashY: 0, bossDashX: 1, bossDashY: 0, safeRoom: -1, stormAge: 0, stormTimer: JUPITER.stormInterval, guardTicks: 0, wallCooldown: 0, playerBoost: 0,
    bossBoost: 0, boostCooldown: JUPITER.boostCooldown, shardTarget: -1, shards: [], shardEffects: [], shardPlayerX: state.playerX, shardPlayerY: state.playerY, shardBossX: 0, shardBossY: 0, chargeRoom: -1, blast: null, slowTicks: 0, shockTiles: [], tileBursts: [], walls: [], bursts: [], fragments: [], fragmentOverdrive: false, overdriveCharge: 0, overdriveBurstTicks: 0, miniStorms: [], miniStormHitCooldown: 0 };
  for(let id=0;id<JUPITER.shockTileCount;id++){const room=id%4,tile=randomChargedTile(state,room);if(tile)state.jupiter.shockTiles.push({id,room,x:tile[0],y:tile[1],cooldown:0});}
}
export function jupiterMaxEnergy(j:JupiterState) {
  const phaseMultiplier=1+(j.phase-1)*.2;
  const roundEnergy=j.round===2?JUPITER.secondPursuitEnergy:JUPITER.pursuitEnergy;
  return Math.round(roundEnergy*phaseMultiplier);
}
export function jupiterBoss(state: GameState) { return state.enemies.find(e => e.id === state.jupiter?.bossId && e.hp > 0); }
export function initializeJupiterBoss(state: GameState, boss: Enemy) {
  const previous = state.jupiter;
  createJupiterState(state);
  if (previous) { state.jupiter!.shockTiles=previous.shockTiles??state.jupiter!.shockTiles;state.jupiter!.slowTicks=previous.slowTicks??0;state.jupiter!.guardTicks=previous.guardTicks ?? 0; state.jupiter!.walls=previous.walls; state.jupiter!.wallCooldown=previous.wallCooldown; state.jupiter!.playerBoost=previous.playerBoost; state.jupiter!.playerDashX=previous.playerDashX??1; state.jupiter!.playerDashY=previous.playerDashY??0; }
  state.jupiter!.bossId = boss.id; boss.hp = boss.maxHp = JUPITER.phaseHP * 3;
  boss.path = []; boss.pushTiles = 0;
  state.jupiter!.chargeRoom=nearestRoom(boss.tileX,boss.tileY);
  playJupiterChargeSound();
}
export function clearJupiterEncounter(state: GameState) {
  if (!state.jupiter) return;
  stopJupiterAmbientSound(); stopJupiterChargeSound();
  state.jupiter.walls = []; state.jupiter.bursts = []; state.jupiter.safeRoom = -1;
  state.jupiter.shards=[];state.jupiter.shardEffects=[];state.jupiter.shardTarget=-1;
  state.jupiter.fragments=[];state.jupiter.fragmentOverdrive=false;state.jupiter.overdriveCharge=0;state.jupiter.overdriveBurstTicks=0;state.jupiter.miniStorms=[];
  state.jupiter.slowTicks=0;state.jupiter.chargeRoom=-1;state.jupiter.blast=null;state.jupiter.tileBursts=[];
  state.jupiter.guardTicks = state.jupiter.bossBoost = state.jupiter.playerBoost = 0;
}
export function jupiterDashMultiplier(left: number, duration: number, peak: number) { return left > 0 ? 1+(peak-1)*Math.pow(Math.min(1,left/duration),2) : 1; }
export function jupiterPlayerSpeed(state: GameState) {
  const j = state.jupiter;
  const stageSpeed=j&&jupiterBoss(state)?j.stage==='escape'?JUPITER.fleeSpeed/PLAYER_BASE_SPEED:j.stage==='pursuit'?JUPITER.playerPursuitSpeed:1:1;
  return j ? stageSpeed * jupiterDashMultiplier(j.playerBoost,JUPITER.playerBoostTicks,JUPITER.playerBoostSpeed) * ((j.slowTicks??0)>0?JUPITER.shockSlow:1) : 1;
}
export function jupiterReaperSpeed(state:GameState,boss:Enemy) {
  const j=state.jupiter!;
  const distance=Math.hypot(boss.x-state.playerX,boss.y-state.playerY)/TILE_SIZE;
  const catchup=j.stage==='pursuit'?1+(JUPITER.catchupMultiplier-1)*Math.max(0,Math.min(1,(distance-JUPITER.catchupStartTiles)/(JUPITER.catchupFullTiles-JUPITER.catchupStartTiles))):1;
  const slowStrength=j.stage==='pursuit'&&j.fragmentOverdrive ? 1/5 : 1;
  const wallSlow=(boss.voltSlowTicks??0)>0?(j.stage==='escape'?JUPITER.exposedWallSlow:JUPITER.wallSlow):1;
  const effectiveWallSlow=1-(1-wallSlow)*slowStrength;
  return (j.stage==='escape'?JUPITER.fleeSpeed:JUPITER.pursuitSpeed)*catchup*(j.stage==='pursuit'&&j.fragmentOverdrive?JUPITER.fragmentBoost:1)*
    jupiterDashMultiplier(j.bossBoost,JUPITER.boostTicks,JUPITER.boostSpeed)*
    Math.min(effectiveWallSlow,stormSlowMultiplier(state,boss,slowStrength));
}
export function jupiterStormRoom(state: GameState, room: number) {
  return !!state.jupiter && state.jupiter.stage === 'pursuit' && state.jupiter.safeRoom >= 0 && room >= 0 && room !== state.jupiter.safeRoom;
}
export function jupiterDamageTaken(state: GameState, enemy: Enemy) {
  return state.jupiter?.bossId === enemy.id && state.jupiter.stage !== 'escape' ? JUPITER.damageTaken : 1;
}
export function drainJupiterEnergy(state: GameState, enemy: Enemy, hpLost: number) {
  if (state.jupiter?.bossId === enemy.id && state.jupiter.stage === 'pursuit') {
    state.jupiter.energy = Math.max(0, state.jupiter.energy - hpLost * JUPITER.energyPerDamage);
  }
}

export function useVoltFence(state: GameState): boolean {
  const j = state.jupiter;
  if (!j || state.gamePhase !== 'playing' || j.wallCooldown > 0) return false;
  const vertical = state.playerDirX !== 0 || state.playerDirY === 0;
  // Leave a fence across the player's current tile, perpendicular to the movement direction.
  // Stop at cover: the visual segment and its collision use these exact endpoints.
  const x = state.playerTileX, y = state.playerTileY;
  if (!isFloorTile(state.map, x, y)) return false;
  const reach=(side:number)=>{
    let tiles=0;
    for(let r=1;r<=JUPITER.wallHalfLength;r++) {
      if(!isFloorTile(state.map,x+(vertical?0:side*r),y+(vertical?side*r:0)))break;
      tiles=r;
    }
    return (tiles+.5)*TILE_SIZE;
  };
  const negative=reach(-1),positive=reach(1);
  j.walls.push({x:(x+.5)*TILE_SIZE,y:(y+.5)*TILE_SIZE,vertical,half:Math.max(negative,positive),negative,positive,age:0});
  j.playerDashX=state.playerDirX||(!state.playerDirY?1:0);j.playerDashY=state.playerDirY;
  j.guardTicks = JUPITER.fenceGuardTicks; j.wallCooldown = JUPITER.wallCooldown; j.playerBoost = JUPITER.playerBoostTicks;
  state.speedFlashTicks = 20;
  playAudioOneShot('/sounds/jupiter-fence-cast.wav', .85);
  return true;
}

function nearestRoom(x:number,y:number) {
  const room=chamberOfTile(x,y);if(room>=0)return room;
  let best=0,distance=Infinity;
  CHAMBER_BOUNDS.forEach(([r1,c1,r2,c2],i)=>{const d=Math.hypot(x-(c1+c2)/2,y-(r1+r2)/2);if(d<distance){distance=d;best=i;}});
  return best;
}
function closestRoom(state:GameState){return nearestRoom(state.playerTileX,state.playerTileY);}
function randomChargedTile(state:GameState,room:number,exclude?:ChargedTile):[number,number]|null {
  const options:[number,number][]=[];
  for(let y=2;y<MAP_ROWS-2;y++)for(let x=2;x<MAP_COLS-2;x++) {
    if(state.map[y]?.[x]!==T_FLOOR||chamberOfTile(x,y)!==room||Math.hypot(x-state.playerTileX,y-state.playerTileY)<3||
      (x===state.rubyTileX&&y===state.rubyTileY)||state.jupiter?.shards?.some(s=>s.x===x&&s.y===y)||state.jupiter?.shockTiles.some(t=>t!==exclude&&Math.hypot(t.x-x,t.y-y)<3)||
      (exclude&&Math.hypot(x-exclude.x,y-exclude.y)<5))continue;
    options.push([x,y]);
  }
  return options.length?options[Math.floor(Math.random()*options.length)]:null;
}
function updateChargedTiles(state:GameState) {
  const j=state.jupiter!;j.shockTiles??=[];j.tileBursts??=[];
  j.tileBursts=j.tileBursts.filter(b=>--b.ticks>0);
  if((j.slowTicks??0)>0)j.slowTicks--;
  for(const tile of j.shockTiles) {
    if(tile.cooldown>0) {
      if(--tile.cooldown===0){const next=randomChargedTile(state,tile.room,tile);if(next){tile.x=next[0];tile.y=next[1];}else tile.cooldown=60;}
      continue;
    }
    if(tile.x!==state.playerTileX||tile.y!==state.playerTileY)continue;
    tile.cooldown=JUPITER.shockTileRespawn;j.slowTicks=JUPITER.shockSlowTicks;
    j.tileBursts.push({x:tile.x,y:tile.y,ticks:30});
    if(j.stage==='pursuit'&&jupiterBoss(state))j.energy=Math.min(jupiterMaxEnergy(j),j.energy+JUPITER.shockEnergy);
    playAudioOneShot('/sounds/jupiter-fence-hit.mp3', .65);
  }
}
function releaseChargeBlast(state:GameState) {
  const j=state.jupiter!,boss=jupiterBoss(state);if(!boss)return;
  const room=j.chargeRoom>=0?j.chargeRoom:nearestRoom(boss.tileX,boss.tileY);
  j.blast={room,ticks:JUPITER.chargeBlastTicks};
  if(chamberOfTile(state.playerTileX,state.playerTileY)===room)damagePlayer(state,JUPITER.chargeBlastDamage);
  if(state.gamePhase!=='playing')return;
  if(state.rubyTileX>=0&&chamberOfTile(state.rubyTileX,state.rubyTileY)===room)damageRuby(state,JUPITER.chargeBlastDamage);
  if(state.gamePhase!=='playing')return;
  for(const enemy of [...state.enemies]) {
    if(enemy.id===j.bossId||enemy.hp<=0||!state.enemies.includes(enemy)||chamberOfTile(enemy.tileX,enemy.tileY)!==room)continue;
    damageEnemy(state,enemy,JUPITER.chargeBlastDamage,'enemy');
    if(enemy.hp<=0){const index=state.enemies.indexOf(enemy);if(index>=0)killEnemy(state,index,true);}
  }
}
function startPursuit(state: GameState) {
  const j=state.jupiter!,boss=jupiterBoss(state);if(!boss)return;
  j.shards=[];j.shardTarget=-1;
  j.stage='pursuit';j.energy=jupiterMaxEnergy(j);j.safeRoom=closestRoom(state);j.stormAge=0;j.stormTimer=JUPITER.stormInterval;
  j.boostCooldown=JUPITER.boostCooldown;j.bossBoost=0;boss.pathTimer=0;
  j.fragments=[];j.fragmentOverdrive=false;j.overdriveCharge=0;j.overdriveBurstTicks=0;
  updatePursuitFragments(state,boss);
  updateMiniStorms(state);
  state.screenShakeTicks=Math.max(state.screenShakeTicks,22);state.screenShakeAmt=Math.max(state.screenShakeAmt,10);
  state.bossSpawnName=j.round===2?'OVERCHARGED PURSUIT':'STORM PURSUIT';state.bossSpawnTicks=120;
  stopJupiterChargeSound();
  playAudioOneShot('/sounds/jupiter-pursuit-thunder.mp3', .85);
}
function startCharging(state: GameState, round: 1 | 2) {
  const j = state.jupiter!, boss = jupiterBoss(state)!;
  j.stage = 'charging'; j.round = round; j.stageTicks = JUPITER.chargeTicks; j.energy = 0; j.safeRoom = -1;
  j.chargeRoom=nearestRoom(Math.round(boss.x/TILE_SIZE-.5),Math.round(boss.y/TILE_SIZE-.5));
  j.shards=[];j.shardTarget=-1;
  j.fragments=[];j.fragmentOverdrive=false;j.overdriveCharge=0;j.overdriveBurstTicks=0;j.miniStorms=[];
  j.bossBoost = 0; boss.path = []; boss.pathTimer = 0;
  // Stop exactly where he is without leaving tile and interpolation coordinates inconsistent.
  boss.tileX = boss.targetTileX = Math.round(boss.x / TILE_SIZE - .5);
  boss.tileY = boss.targetTileY = Math.round(boss.y / TILE_SIZE - .5);
  boss.x = (boss.tileX + .5) * TILE_SIZE; boss.y = (boss.tileY + .5) * TILE_SIZE; boss.stepProgress = 0;
  playJupiterChargeSound();
}
function scatterStormShards(state:GameState,boss:Enemy) {
  const j=state.jupiter!;j.shards=[];j.shardTarget=-1;
  for(let room=0;room<4;room++) {
    const options:{x:number;y:number}[]=[];
    const [r1,c1,r2,c2]=CHAMBER_BOUNDS[room];
    for(let y=r1+1;y<r2;y++)for(let x=c1+1;x<c2;x++) {
      if(state.map[y]?.[x]!==T_FLOOR||Math.hypot((x+.5)*TILE_SIZE-state.playerX,(y+.5)*TILE_SIZE-state.playerY)<TILE_SIZE*2||
        Math.hypot((x+.5)*TILE_SIZE-boss.x,(y+.5)*TILE_SIZE-boss.y)<TILE_SIZE*2||
        (x===state.rubyTileX&&y===state.rubyTileY)||j.shockTiles.some(t=>t.x===x&&t.y===y))continue;
      options.push({x,y});
    }
    let placed=0;
    while(options.length&&placed<JUPITER.shardCount/4) {
      const tile=options.splice(Math.floor(Math.random()*options.length),1)[0];
      if(j.shards.some(s=>Math.hypot(s.x-tile.x,s.y-tile.y)<2))continue;
      j.shards.push({id:room*100+placed++,...tile});
    }
  }
  j.shardPlayerX=state.playerX;j.shardPlayerY=state.playerY;j.shardBossX=boss.x;j.shardBossY=boss.y;
  boss.path=[];boss.pathTimer=0;
}
// One flood search chooses the nearest reachable shard by walking distance, through actual hallways.
function shardPath(state:GameState,boss:Enemy):{target:number;path:[number,number][]} {
  const shards=new Map((state.jupiter!.shards??[]).map(s=>[s.y*MAP_COLS+s.x,s.id]));
  const start=boss.targetTileY*MAP_COLS+boss.targetTileX,queue=[start],parents=new Int32Array(MAP_COLS*MAP_ROWS);parents.fill(-1);parents[start]=-2;
  for(let head=0;head<queue.length;head++) {
    const key=queue[head],x=key%MAP_COLS,y=Math.floor(key/MAP_COLS);
    if(shards.has(key)) {
      const path:[number,number][]=[];let p=key;
      while(parents[p]>=0){path.push([p%MAP_COLS,Math.floor(p/MAP_COLS)]);p=parents[p];}
      return {target:shards.get(key)!,path:path.reverse()};
    }
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx=x+dx,ny=y+dy,n=ny*MAP_COLS+nx;
      if(nx<0||ny<0||nx>=MAP_COLS||ny>=MAP_ROWS||parents[n]!==-1||!isFloorTile(state.map,nx,ny))continue;
      parents[n]=key;queue.push(n);
    }
  }
  return {target:-1,path:[]};
}
function pickupDistance(x:number,y:number,oldX:number,oldY:number,nowX:number,nowY:number) {
  const dx=nowX-oldX,dy=nowY-oldY,length=dx*dx+dy*dy;
  // Teleportation is not movement through all intervening shards.
  const t=length>0&&length<TILE_SIZE*TILE_SIZE*4?Math.max(0,Math.min(1,((x-oldX)*dx+(y-oldY)*dy)/length)):1;
  return Math.hypot(x-oldX-dx*t,y-oldY-dy*t);
}
function updateStormShards(state:GameState,boss:Enemy) {
  const j=state.jupiter!;j.shards??=[];
  for(const shard of [...j.shards]) {
    const x=(shard.x+.5)*TILE_SIZE,y=(shard.y+.5)*TILE_SIZE;
    const pd=pickupDistance(x,y,j.shardPlayerX??state.playerX,j.shardPlayerY??state.playerY,state.playerX,state.playerY);
    const bd=pickupDistance(x,y,j.shardBossX??boss.x,j.shardBossY??boss.y,boss.x,boss.y);
    if(Math.min(pd,bd)>TILE_SIZE*JUPITER.shardReach)continue;
    const heal=bd<pd;
    j.shards=j.shards.filter(s=>s.id!==shard.id);j.shardTarget=-1;boss.pathTimer=0;
    j.shardEffects.push({x,y,bossX:boss.x,bossY:boss.y,heal,ticks:26});
    if(heal) {
      boss.hp=Math.min((4-j.phase)*JUPITER.phaseHP,boss.hp+JUPITER.phaseHP*JUPITER.shardShare);
      boss.healFlashTicks=18;playSFX_pickup();
    } else {
      damageEnemy(state,boss,JUPITER.phaseHP*JUPITER.shardShare,'special');
      j.phase=Math.max(j.phase,Math.min(3,4-Math.ceil(boss.hp/JUPITER.phaseHP))) as 1|2|3;
      playAudioOneShot('/sounds/jupiter-fence-hit.mp3',.7);
      if(boss.hp<=0){const index=state.enemies.indexOf(boss);if(index>=0)killEnemy(state,index);return;}
    }
  }
  j.shardPlayerX=state.playerX;j.shardPlayerY=state.playerY;j.shardBossX=boss.x;j.shardBossY=boss.y;
}
function startEscape(state:GameState) {
  const j=state.jupiter!,boss=jupiterBoss(state);if(!boss)return;
  j.stage='escape';j.energy=0;j.stageTicks=0;j.safeRoom=-1;j.bossBoost=0;
  j.fragments=[];j.fragmentOverdrive=false;j.overdriveCharge=0;j.overdriveBurstTicks=0;
  scatterStormShards(state,boss);
  state.bossSpawnName='EXPOSED · SHARD RACE';state.bossSpawnTicks=150;playUiSfx('jupiterExposed');
}

function spawnPursuitFragment(state:GameState,boss:Enemy,id:number,room:number) {
  const j=state.jupiter!,candidates:[number,number][]=[];
  if(room<0)return;
  const [r1,c1,r2,c2]=CHAMBER_BOUNDS[room];
  for(let y=r1+1;y<r2;y++)for(let x=c1+1;x<c2;x++) {
    if(state.map[y]?.[x]!==T_FLOOR||Math.hypot(x-state.playerTileX,y-state.playerTileY)<3||Math.hypot(x-boss.tileX,y-boss.tileY)<2||
      j.fragments.some(f=>Math.hypot(f.x-x,f.y-y)<3)||j.shockTiles.some(t=>t.x===x&&t.y===y)||(x===state.rubyTileX&&y===state.rubyTileY))continue;
    candidates.push([x,y]);
  }
  if(candidates.length){const [x,y]=candidates[Math.floor(Math.random()*candidates.length)];j.fragments.push({id,x,y});}
}
// Pursuit fragments stay in the safe chamber so collecting them is always possible.
function updatePursuitFragments(state:GameState,boss:Enemy) {
  const j=state.jupiter!;
  if(j.phase<2||j.stage!=='pursuit')return;
  j.fragments??=[];
  for(let id=0;id<JUPITER.fragmentCount;id++)if(!j.fragments.some(f=>f.id===id))spawnPursuitFragment(state,boss,id,j.safeRoom);
  j.overdriveCharge=Math.min(JUPITER.fragmentChargeTicks,(j.overdriveCharge??0)+1);
  let collected=false;
  for(const fragment of [...j.fragments]) {
    const x=(fragment.x+.5)*TILE_SIZE,y=(fragment.y+.5)*TILE_SIZE;
    if(pickupDistance(x,y,j.shardPlayerX??state.playerX,j.shardPlayerY??state.playerY,state.playerX,state.playerY)>TILE_SIZE*JUPITER.shardReach)continue;
    j.fragments=j.fragments.filter(f=>f!==fragment);collected=true;
    j.shardEffects.push({x,y,bossX:boss.x,bossY:boss.y,heal:false,ticks:26});
    // A collected fragment bypasses pursuit armour, like the lightning in Shard Race.
    damageEnemy(state,boss,JUPITER.phaseHP*JUPITER.shardShare/JUPITER.damageTaken,'special');
    playAudioOneShot('/sounds/jupiter-fence-hit.mp3',.7);
    if(boss.hp<=0){const i=state.enemies.indexOf(boss);if(i>=0)killEnemy(state,i);return;}
    spawnPursuitFragment(state,boss,fragment.id,chamberOfTile(fragment.x,fragment.y));
  }
  if(collected) {
    j.fragmentOverdrive=false;j.overdriveCharge=0;j.overdriveBurstTicks=0;j.bossBoost=0;boss.pathTimer=0;
    // One pickup resets the shared pursuit overdrive bar.
  } else if(j.overdriveCharge>=JUPITER.fragmentChargeTicks&&!j.fragmentOverdrive) {
    j.fragmentOverdrive=true;j.overdriveBurstTicks=30;playAudioOneShot('/sounds/aegis-attack.mp3',.8*ATTACK_SFX_VOLUME);playAudioOneShot('/sounds/jupiter-reaper-boost.mp3',.85);
  }
  j.shardPlayerX=state.playerX;j.shardPlayerY=state.playerY;
}

function updateMiniStorms(state:GameState) {
  const j=state.jupiter!;
  if(j.phase<3||j.stage==='charging')return;
  j.miniStorms??=[];
  if(!j.miniStorms.length)for(let room=0;room<4;room++)for(let n=0;n<JUPITER.miniStormsPerRoom;n++) {
    const tile=randomChargedTile(state,room);if(tile)j.miniStorms.push({id:room*2+n,room,x:(tile[0]+.5)*TILE_SIZE,y:(tile[1]+.5)*TILE_SIZE,path:[],retarget:0});
  }
  if(j.miniStormHitCooldown>0)j.miniStormHitCooldown--;
  for(const storm of j.miniStorms) {
    const chase=j.stage==='escape'&&chamberOfTile(state.playerTileX,state.playerTileY)===storm.room&&Math.hypot(storm.x-state.playerX,storm.y-state.playerY)<JUPITER.miniStormChaseRange*TILE_SIZE;
    if(--storm.retarget<=0||!storm.path.length) {
      const tile=chase?[state.playerTileX,state.playerTileY]:randomChargedTile(state,storm.room);
      storm.path=tile?bfs(state.map,Math.floor(storm.x/TILE_SIZE),Math.floor(storm.y/TILE_SIZE),tile[0],tile[1]):[];
      storm.retarget=chase?20:120;
    }
    const next=storm.path[0];
    if(next) {
      const dx=(next[0]+.5)*TILE_SIZE-storm.x,dy=(next[1]+.5)*TILE_SIZE-storm.y,d=Math.hypot(dx,dy),speed=chase?JUPITER.miniStormChaseSpeed:JUPITER.miniStormSpeed;
      if(!isFloorTile(state.map,next[0],next[1])){storm.path=[];continue;}
      if(d<=speed){storm.x=(next[0]+.5)*TILE_SIZE;storm.y=(next[1]+.5)*TILE_SIZE;storm.path.shift();}
      else{storm.x+=dx/d*speed;storm.y+=dy/d*speed;}
    }
    if(j.miniStormHitCooldown>0||Math.hypot(storm.x-state.playerX,storm.y-state.playerY)>TILE_SIZE*.7)continue;
    j.miniStormHitCooldown=JUPITER.miniStormHitCooldown;
    damagePlayer(state,JUPITER.miniStormDamage);
    const dx=state.playerX-storm.x,dy=state.playerY-storm.y;
    state.playerKnockback={dirX:Math.abs(dx)>=Math.abs(dy)?Math.sign(dx)||1:0,dirY:Math.abs(dy)>Math.abs(dx)?Math.sign(dy):0,started:false,tilesLeft:2};
    state.screenShakeTicks=Math.max(state.screenShakeTicks,10);state.screenShakeAmt=Math.max(state.screenShakeAmt,4);
    playAudioOneShot('/sounds/jupiter-fence-hit.mp3',.65);
    if(state.gamePhase!=='playing')return;
  }
}
export function updateJupiterReaper(state: GameState, boss: Enemy) {
  const j = state.jupiter!; boss.pushTiles = 0; boss.targeting = 'player';
  if (j.stage === 'charging') return;
  if(j.stage==='escape'&&!j.shards)scatterStormShards(state,boss);
  tryReaperHallwaySeal(state, boss);
  if (boss.attackTimer > 0) boss.attackTimer--;
  if (j.stage === 'pursuit' && boss.attackTimer <= 0 && Math.hypot(boss.x-state.playerX,boss.y-state.playerY) <= TILE_SIZE * 1.05) {
    damagePlayer(state, ENEMY_CONFIGS.storm_reaper.damageToPlayer, boss);
    boss.attackTimer = ENEMY_CONFIGS.storm_reaper.attackCooldown; boss.shootTicks = 14;
    state.slashEffects.push({ x: state.playerX, y: state.playerY, angle: Math.atan2(state.playerY-boss.y,state.playerX-boss.x), ticks: 14, maxTicks: 14 });
    playSFX_reaperStrike();
  }
  if (state.gamePhase !== 'playing') return;
  if(j.stage==='escape'&&!(j.shards??[]).some(s=>s.id===j.shardTarget))boss.pathTimer=0;
  if (--boss.pathTimer <= 0) {
    if(j.stage==='escape') {
      const route=shardPath(state,boss);j.shardTarget=route.target;boss.path=route.path;
    } else boss.path=bfs(state.map,boss.targetTileX,boss.targetTileY,state.playerTileX,state.playerTileY);
    boss.pathTimer=j.stage==='escape'?24:8;
  }
  if (boss.tileX === boss.targetTileX && boss.tileY === boss.targetTileY) {
    const next: [number,number] | undefined = j.bossBoost > 0 ? [boss.tileX+(j.bossDashX??1),boss.tileY+(j.bossDashY??0)] : boss.path.shift();
    if (next && isFloorTile(state.map, next[0], next[1])) { [boss.targetTileX,boss.targetTileY] = next; boss.stepProgress = 0; }
    else if(j.bossBoost>0){j.bossBoost=0;boss.pathTimer=0;}
  } else {
    const speed = jupiterReaperSpeed(state,boss);
    boss.stepProgress = Math.min(TILE_SIZE, boss.stepProgress + speed);
    boss.x = (boss.tileX + .5) * TILE_SIZE + (boss.targetTileX-boss.tileX) * boss.stepProgress;
    boss.y = (boss.tileY + .5) * TILE_SIZE + (boss.targetTileY-boss.tileY) * boss.stepProgress;
    if (boss.stepProgress >= TILE_SIZE) { boss.tileX = boss.targetTileX; boss.tileY = boss.targetTileY; boss.stepProgress = 0; }
  }
}

export function updateJupiter(state: GameState) {
  const j = state.jupiter; if (!j || state.gamePhase !== 'playing') return;
  if(!j.shockTiles){j.shockTiles=[];for(let id=0;id<JUPITER.shockTileCount;id++){const room=id%4,tile=randomChargedTile(state,room);if(tile)j.shockTiles.push({id,room,x:tile[0],y:tile[1],cooldown:0});}}
  if(j.chargeRoom===undefined){const current=jupiterBoss(state);j.chargeRoom=current?nearestRoom(current.tileX,current.tileY):-1;}

  if (--j.ambientTimer <= 0) {
    playJupiterAmbientSound();
    j.ambientTimer=360+Math.floor(Math.random()*480);
  }
  const blendTarget=j.stage==='pursuit'?1:0;
  const blend=j.stormBlend??(j.stage==='pursuit'?1:0);
  j.stormBlend=blendTarget>blend?Math.min(1,blend+.035):Math.max(0,blend-.035);
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600);
  if (j.wallCooldown > 0 && --j.wallCooldown === 0) playUiSfx('fenceReady');
  if ((j.guardTicks ?? 0) > 0) j.guardTicks--;
  if (j.playerBoost > 0) j.playerBoost--;
  if((j.overdriveBurstTicks??0)>0)j.overdriveBurstTicks--;
  j.shardEffects=(j.shardEffects??[]).filter(effect=>--effect.ticks>0);
  j.bursts = j.bursts.filter(b => --b.ticks > 0);
  if(j.blast&&--j.blast.ticks<=0)j.blast=null;
  updateChargedTiles(state);
  // Segment intersection, including a fast enemy crossing the whole fence between frames.
  j.walls = j.walls.filter(w => {
    if (state.gamePhase !== 'playing') return false;
    if (++w.age >= JUPITER.wallTicks) return false;
    const enemy = state.enemies.find(e => {
      if (e.hp <= 0) return false;
      const oldX = e.voltPreviousX ?? e.x, oldY = e.voltPreviousY ?? e.y;
      const a = w.vertical ? oldX-w.x : oldY-w.y, b = w.vertical ? e.x-w.x : e.y-w.y;
      const f = Math.abs(b-a) > .001 ? Math.max(0,Math.min(1,-a/(b-a))) : 1;
      const along = w.vertical ? oldY+(e.y-oldY)*f-w.y : oldX+(e.x-oldX)*f-w.x;
      return along >= -(w.negative??w.half) && along <= (w.positive??w.half) && (Math.min(Math.abs(a),Math.abs(b)) <= 12 || a*b <= 0);
    });
    if (!enemy) return true;
    enemy.voltSlowTicks = JUPITER.wallSlowTicks;
    j.bursts.push({ x: w.x,y: w.y,vertical:w.vertical,half:w.half,negative:w.negative,positive:w.positive,ticks:24 });
    damageEnemy(state,enemy,JUPITER.wallDamage,'special');
    if(enemy.id===j.bossId&&j.stage==='pursuit')j.energy=Math.max(0,j.energy-JUPITER.wallEnergyDrain);
    healPlayer(state,JUPITER.wallHealing);
    playAudioOneShot('/sounds/jupiter-fence-hit.mp3', .85);
    if (enemy.hp <= 0) { const i = state.enemies.indexOf(enemy); if (i >= 0) killEnemy(state,i); }
    return false;
  });
  for (const enemy of state.enemies) { enemy.voltPreviousX=enemy.x;enemy.voltPreviousY=enemy.y; }
  if (state.gamePhase !== 'playing') { clearJupiterEncounter(state); return; }
  const boss = jupiterBoss(state); if (!boss) return;
  j.phase = Math.max(j.phase, Math.min(3, 4-Math.ceil(boss.hp/JUPITER.phaseHP))) as 1|2|3;
  updateMiniStorms(state);
  if(state.gamePhase!=='playing')return;
  if (j.stage === 'charging') {
    j.energy = jupiterMaxEnergy(j) * (1 - --j.stageTicks / JUPITER.chargeTicks);
    if (j.stageTicks <= 0) {
      releaseChargeBlast(state);
      if(state.gamePhase==='playing')startPursuit(state);
    }
  } else if (j.stage === 'pursuit') {
    updatePursuitFragments(state,boss);
    if(state.gamePhase!=='playing'||!jupiterBoss(state))return;
    j.energy = Math.max(0,j.energy-JUPITER.energyDrainPerSecond/60);
    if (j.energy <= 0) {
      if (j.round===1) startCharging(state,2);
      else startEscape(state);
      return;
    }
    j.stormAge++;
    if (j.bossBoost > 0 && --j.bossBoost===0) boss.pathTimer=0;
    if (--j.boostCooldown <= 0) {
      const dx=state.playerX-boss.x,dy=state.playerY-boss.y;
      j.bossDashX=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx)||1:0;j.bossDashY=j.bossDashX?0:Math.sign(dy)||1;
      j.bossBoost=JUPITER.boostTicks;j.boostCooldown=JUPITER.boostCooldown;
      playAudioOneShot('/sounds/jupiter-reaper-boost.mp3', .85);
    }
    if (j.stormAge > JUPITER.stormGrace && --j.stormTimer <= 0) {
      j.stormTimer=JUPITER.stormInterval;
      if (jupiterStormRoom(state,chamberOfTile(state.playerTileX,state.playerTileY))) damagePlayer(state,JUPITER.stormDamage);
      if (state.gamePhase !== 'playing') return;
      if (state.rubyTileX >= 0 && jupiterStormRoom(state,chamberOfTile(state.rubyTileX,state.rubyTileY))) damageRuby(state,JUPITER.stormRubyDamage);
      if (state.gamePhase !== 'playing') return;
      for(const enemy of [...state.enemies]) {
        if(enemy.id===j.bossId||enemy.hp<=0||!state.enemies.includes(enemy)||!jupiterStormRoom(state,chamberOfTile(enemy.tileX,enemy.tileY)))continue;
        damageEnemy(state,enemy,JUPITER.stormDamage,'enemy');
        if(enemy.hp<=0){const index=state.enemies.indexOf(enemy);if(index>=0)killEnemy(state,index,true);}
      }
    }
  } else {
    updateStormShards(state,boss);
    if(state.gamePhase!=='playing'||!jupiterBoss(state))return;
    if(j.shards.length===0)startCharging(state,1);
  }
}

export function godSetJupiterPhase(state: GameState, phase: 1|2|3) {
  if(!state.jupiter||state.gamePhase!=='playing')return;
  state.noBossSpawns=false;
  const existing=jupiterBoss(state);
  if(!existing)godSpawnBoss(state,'storm_reaper');
  const boss=jupiterBoss(state);if(!boss)return;
  boss.hp=(4-phase)*JUPITER.phaseHP;state.jupiter!.phase=phase;
  startCharging(state,1);
}
export function godSetJupiterStage(state: GameState, stage: JupiterStage) {
  const j=state.jupiter,boss=jupiterBoss(state);if(!j||!boss||state.gamePhase!=='playing')return;
  if(stage==='charging')startCharging(state,1);
  else if(stage==='pursuit')startPursuit(state);
  else startEscape(state);
}
