import { CHAMBER_SPAWN_TILES, ENEMY_CONFIGS, MOVE_SPEED_MULT, FROST_FREEZE_DURATION, FROST_RELOCATE_INTERVAL, MAP_COLS, MAP_ROWS, PLAYER_MAX_HP, RUBY_MAX_HP, TILE_SIZE, chamberOfTile } from './constants';
import { playUiSfx } from './ui-sfx';
import { bfs, createEncounterEnemy, damageEnemy, damagePlayer, damageRuby, godSpawnBoss, healPlayer, healCore, relocateFrostWarden, isFloorTile, killEnemy, shovePlayerFromEnemy, playAudioOneShot, playSFX_alienShoot, playSFX_placeBomb, playSFX_objectBreak, type Enemy, type GameState } from './engine';

export const SATURN = {
  phaseHP: 1200, barrier: 5000, breakShare: .2, barrierHealShare: .2, breakHealShare: .2, ramRefundShare: .1, weakTicks: 480, shatterTicks: 66,
  levelTicks: 1800, pulseTicks: 60, damage: [2, 4, 7], enemyDamage: [.5, 1, 1.5], blizzardShieldCost: .5, bossChamberDamageMult: 1.5, shieldedChillMult: .85, shieldDamageAbsorb: 1,
  chargeTicks: 45, minRange: 2, maxRange: 8, rollSpeed: 18, rollDamage: 2, stealStunTicks: 72, cooldown: 120,
  iceCount: 32, bossIceCount: 16, iceInterval: 360, iceWarning: 60, shieldInterval: 300, allyShield: 20,
  spawnInterval: 210, population: 22, killShield: 10, shardShield: 40, thiefShield: 24, thiefWindup: 48, thiefRange: 8,
  icicleInterval: 480, icicleWarning: 144, icicleFallTicks: 24, icicleRange: 8, icicleDamage: 12, icicleIceTicks: 90,
} as const;

export interface SnowRoll { dx: number; dy: number; remaining: number; hitIds: number[]; wallStop: boolean }
export interface SaturnState {
  phase: 1 | 2 | 3; bossId: number; barrier: number; weakTicks: number;
  level: 1 | 2 | 3; levelTicks: number; pulse: number; shieldTimer: number; spawnTimer: number;
  iceTimer: number; iceWarning: number; nextIce: [number, number][];
  charging: boolean; charge: number; cooldown: number; roll: SnowRoll | null;
  permaShield: boolean;
  shatter: { x: number; y: number; ticks: number } | null;
  effects: { x: number; y: number; ticks: number; kind: 'steal' | 'break' | 'shove' }[];
  icicles: { x: number; y: number; ticks: number; landed: boolean }[];
  temporaryIce: { x: number; y: number; ticks: number }[];
}

export function createSaturnState(s: GameState) {
  s.saturn = { phase: 1, bossId: -1, barrier: SATURN.barrier, weakTicks: 0,
    level: 1, levelTicks: 0, pulse: 0, shieldTimer: SATURN.shieldInterval, spawnTimer: 60,
    iceTimer: 0, iceWarning: 0, nextIce: [], charging: false, charge: 0, cooldown: 0, roll: null, permaShield: false, shatter: null, effects: [], icicles: [], temporaryIce: [] };
  s.playerShieldHP = s.rubyShieldHP = 20; s.playerSaturnShield=s.rubySaturnShield=true;
}
export function saturnBoss(s: GameState) { return s.enemies.find(e => e.id === s.saturn?.bossId && e.hp > 0); }
export function saturnBlizzard(s: GameState) { return !!s.saturn && !!saturnBoss(s) && s.saturn.weakTicks <= 0; }
export function saturnShieldChilled(s:GameState){
  if(s.playerShieldHP<=0||!saturnBlizzard(s))return false;
  const boss=saturnBoss(s)!,room=chamberOfTile(boss.tileX,boss.tileY);
  return room>=0&&chamberOfTile(s.playerTileX,s.playerTileY)===room;
}
export function initializeSaturnBoss(s: GameState, boss: Enemy) {
  const t = s.saturn!;
  t.bossId = boss.id; t.phase = 1; t.barrier = SATURN.barrier; t.weakTicks = 0;
  t.level = 1; t.levelTicks = t.pulse = 0; t.shieldTimer = SATURN.shieldInterval;
  boss.hp = boss.maxHp = SATURN.phaseHP * 3;
  boss.icyShieldHP = 0; boss.pushTiles = 0; boss.phaseTimer = FROST_RELOCATE_INTERVAL;
  s.frostIceTiles = []; t.iceTimer = 0; t.nextIce = []; t.iceWarning = 0;
}
export function clearSaturnEncounter(s: GameState) {
  if (!s.saturn) return;
  s.saturn.charging = false; s.saturn.charge = 0; s.saturn.roll = null;
  s.saturn.nextIce = []; s.saturn.effects = []; s.saturn.iceWarning = 0;
  s.saturn.icicles = []; s.saturn.temporaryIce = [];
  s.saturn.shatter = null;
  s.frostIceTiles = []; s.playerFrozenTicks = 0;
}
// Ordinary rewards retain their original refill behavior outside this challenge.
export function grantSaturnShield(s: GameState, target: 'player' | 'ruby', amount: number) {
  if (target === 'player') {s.playerShieldHP += amount;if(amount>0)s.playerSaturnShield=true;} else {s.rubyShieldHP += amount;if(amount>0)s.rubySaturnShield=true;}
}
export function freezeSaturnPlayer(s: GameState) {
  if(!s.saturn?.permaShield){s.playerShieldHP *= .5;if(s.playerShieldHP<=0)s.playerSaturnShield=false;}
  s.playerFrozenTicks = FROST_FREEZE_DURATION;
  cancelSnowball(s); s.playerQueuedDirX = s.playerQueuedDirY = 0;
  s.frostIceTiles = s.frostIceTiles.filter(([x,y]) => x !== s.playerTileX || y !== s.playerTileY);
  if(s.saturn)s.saturn.temporaryIce=s.saturn.temporaryIce.filter(t => t.x !== s.playerTileX || t.y !== s.playerTileY);
}
export function saturnIceAt(s: GameState, x: number, y: number) {
  return !!s.saturn?.temporaryIce.some(t => t.x === x && t.y === y);
}
function frozenAt(s: GameState,x:number,y:number){return s.frostIceTiles.some(([ix,iy])=>ix===x&&iy===y)||saturnIceAt(s,x,y);}

function settlePlayer(s: GameState) {
  // Finish an interrupted interpolation at its nearest legal endpoint, never across cover.
  if (s.playerStepProgress >= TILE_SIZE / 2) { s.playerTileX = s.playerTargetX; s.playerTileY = s.playerTargetY; }
  s.playerTargetX = s.playerTileX; s.playerTargetY = s.playerTileY; s.playerStepProgress = 0;
  s.playerX = (s.playerTileX + .5) * TILE_SIZE; s.playerY = (s.playerTileY + .5) * TILE_SIZE;
  s.playerKnockback = null;
}
export function beginSnowball(s: GameState): boolean {
  const t = s.saturn;
  if (!t || s.gamePhase !== 'playing' || t.cooldown > 0 || t.roll || t.charging || s.playerFrozenTicks > 0) return false;
  settlePlayer(s); t.charging = true; t.charge = 0; playSFX_placeBomb(); return true;
}
function snowballRange(charge:number){return Math.floor(SATURN.minRange + (SATURN.maxRange - SATURN.minRange) * Math.min(1, charge / SATURN.chargeTicks));}
export function snowballPath(s: GameState, charge = s.saturn?.charge ?? 0): [number, number][] {
  const range = snowballRange(charge);
  const dx = s.playerDirX || (!s.playerDirY ? 1 : 0), dy = dx ? 0 : Math.sign(s.playerDirY);
  const tiles: [number, number][] = [];
  for (let n = 1; n <= range; n++) {
    const x = s.playerTileX + dx * n, y = s.playerTileY + dy * n;
    if (!isFloorTile(s.map, x, y)) break;
    tiles.push([x, y]);
  }
  return tiles;
}
export function releaseSnowball(s: GameState): boolean {
  const t = s.saturn;
  if (!t?.charging || s.gamePhase !== 'playing') return false;
  settlePlayer(s);
  const path = snowballPath(s),wallStop=path.length<snowballRange(t.charge); t.charging = false;
  t.cooldown = SATURN.cooldown;playSFX_alienShoot(3,1.3);
  if (!path.length) { t.charge = 0;playAudioOneShot('/sounds/snowball-hit.mp3',.7);t.cooldown=0;playUiSfx('fenceReady');return true; }
  const dx = Math.sign(path[0][0] - s.playerTileX), dy = Math.sign(path[0][1] - s.playerTileY);
  t.roll = { dx, dy, remaining: path.length * TILE_SIZE, hitIds: [], wallStop };
  t.cooldown = SATURN.cooldown; t.charge = 0;
  return true;
}
export function cancelSnowball(s: GameState): boolean {
  const t = s.saturn;
  if (!t || (!t.charging && !t.roll)) return false;
  if (t.roll) {
    settlePlayer(s);
    if(t.roll.hitIds.length===0&&t.cooldown>0){t.cooldown=0;playUiSfx('fenceReady');}
  }
  t.charging = false; t.charge = 0; t.roll = null; return true;
}

function crackBarrier(s: GameState, boss: Enemy) {
  const t = s.saturn!, spent = s.playerShieldHP;
  if(!t.permaShield){s.playerShieldHP = 0; s.playerSaturnShield = false;grantSaturnShield(s,'player',spent*SATURN.ramRefundShare);}
  if (t.barrier <= 0 || spent <= 0) return;
  // 100 shield deals 100 damage; each additional 100 doubles damage plus that baseline.
  const barrierDamage = Math.min(t.barrier, 100 * Math.expm1(Math.LN2 * spent / 100));
  t.barrier = Math.max(0, t.barrier - barrierDamage);
  const healingShare = barrierDamage / SATURN.barrier * SATURN.barrierHealShare;
  healPlayer(s, PLAYER_MAX_HP * healingShare);
  healCore(s, RUBY_MAX_HP * healingShare);
  t.level = 1; t.levelTicks = t.pulse = 0;
  t.effects.push({ x: boss.x, y: boss.y, ticks: 30, kind: 'break' });
  playSFX_objectBreak('frost');
  if (t.barrier === 0) {
    playAudioOneShot('/sounds/saturn-barrier-break.mp3', .85);
    t.shatter = { x: boss.x, y: boss.y, ticks: SATURN.shatterTicks };
    t.weakTicks = SATURN.weakTicks; s.frostIceTiles = []; t.nextIce = []; t.iceWarning = 0;
    damageEnemy(s, boss, SATURN.phaseHP * SATURN.breakShare, 'enemy');
    healPlayer(s, PLAYER_MAX_HP * SATURN.breakHealShare);
    healCore(s, RUBY_MAX_HP * SATURN.breakHealShare);
    s.screenShakeTicks = Math.max(s.screenShakeTicks, 30); s.screenShakeAmt = Math.max(s.screenShakeAmt, 16);
  }
}

// Called instead of ordinary player movement. Substeps catch units and ice even during a fast roll.
export function moveSaturnPlayer(s: GameState): boolean {
  const t = s.saturn;
  if (!t || (!t.charging && !t.roll)) return false;
  if (s.playerFrozenTicks > 0) { cancelSnowball(s); return true; }
  if (t.charging) { t.charge = Math.min(SATURN.chargeTicks, t.charge + 1); return false; }
  const roll = t.roll!;
  for (let n = 0; n < SATURN.rollSpeed && roll.remaining > 0 && t.roll; n++) {
    const x = s.playerX + roll.dx, y = s.playerY + roll.dy;
    const tx = Math.floor(x / TILE_SIZE), ty = Math.floor(y / TILE_SIZE);
    // Keep the rolling body inside floor, including its leading edge.
    if (!isFloorTile(s.map, Math.floor((x + roll.dx * 15) / TILE_SIZE), Math.floor((y + roll.dy * 15) / TILE_SIZE))) { playAudioOneShot('/sounds/snowball-hit.mp3',.7);cancelSnowball(s); break; }
    s.playerX = x; s.playerY = y;
    s.playerTileX = s.playerTargetX = tx; s.playerTileY = s.playerTargetY = ty; s.playerStepProgress = 0;
    s.playerChamber = chamberOfTile(tx, ty); roll.remaining--;
    if (frozenAt(s,tx,ty)) { freezeSaturnPlayer(s); break; }
    for (const enemy of [...s.enemies]) {
      const bossHit=enemy.id===t.bossId;
      const contactReach=Math.ceil(TILE_SIZE*ENEMY_CONFIGS.frost_warden.bodyFraction/2)+15;
      const contact=bossHit?Math.abs(enemy.x-x)<=contactReach&&Math.abs(enemy.y-y)<=contactReach:Math.hypot(enemy.x-x,enemy.y-y)<=TILE_SIZE*.68;
      if (enemy.hp <= 0 || roll.hitIds.includes(enemy.id) || !contact) continue;
      roll.hitIds.push(enemy.id);
      playAudioOneShot('/sounds/snowball-hit.mp3', bossHit?1:.7, bossHit?1.25:1);
      if (enemy.id === t.bossId) {
        const protectedBefore = t.barrier > 0;
        s.screenShakeTicks = Math.max(s.screenShakeTicks, 18); s.screenShakeAmt = Math.max(s.screenShakeAmt, 10);
        crackBarrier(s, enemy);
        if (!protectedBefore) damageEnemy(s, enemy, SATURN.rollDamage, 'player');
        // Snap back to a floor centre on the approach side, outside his solid body.
        const centre=roll.dx?enemy.x:enemy.y,dir=roll.dx||roll.dy;
        const edge=centre-dir*contactReach;
        const stopTile=dir>0?Math.floor((edge-TILE_SIZE/2)/TILE_SIZE):Math.ceil((edge-TILE_SIZE/2)/TILE_SIZE);
        const stopX=roll.dx?stopTile:s.playerTileX,stopY=roll.dy?stopTile:s.playerTileY;
        if(isFloorTile(s.map,stopX,stopY)){
          s.playerTileX=s.playerTargetX=stopX;s.playerTileY=s.playerTargetY=stopY;s.playerStepProgress=0;
          s.playerX=(stopX+.5)*TILE_SIZE;s.playerY=(stopY+.5)*TILE_SIZE;s.playerChamber=chamberOfTile(stopX,stopY);
        }
        s.playerQueuedDirX=s.playerQueuedDirY=0;
        cancelSnowball(s); break;
      }
      const stolen = enemy.icyShieldHP; enemy.icyShieldHP = 0;
      if (stolen > 0) {
        s.screenShakeTicks = Math.max(s.screenShakeTicks, 8); s.screenShakeAmt = Math.max(s.screenShakeAmt, 4);
        enemy.buildStopUntil = Math.max(enemy.buildStopUntil ?? 0, s.gameTick + SATURN.stealStunTicks);
        enemy.windupTicks = 0; enemy.frostRollLeft = 0; enemy.shootTicks = 0;
      }
      grantSaturnShield(s, 'player', stolen);
      grantSaturnShield(s, 'ruby', stolen);
      t.effects.push({ x: enemy.x, y: enemy.y, ticks: 24, kind: 'steal' });
      damageEnemy(s, enemy, SATURN.rollDamage, 'player');
      if(enemy.type==='armored'&&enemy.hp<=0)enemy.saturnSnowballKill=true;
    }
  }
  if (t.roll && roll.remaining <= 0) { if(roll.wallStop)playAudioOneShot('/sounds/snowball-hit.mp3',.7);cancelSnowball(s); }
  return true;
}

function chooseIce(s: GameState): [number, number][] {
  const pool: [number, number][] = [];
  for (let y = 1; y < MAP_ROWS - 1; y++) for (let x = 1; x < MAP_COLS - 1; x++) {
    if (!isFloorTile(s.map, x, y) || Math.hypot(x - s.playerTileX, y - s.playerTileY) < 2 || (x === s.rubyTileX && y === s.rubyTileY)) continue;
    pool.push([x, y]);
  }
  const result: [number, number][] = [];
  while (result.length < SATURN.iceCount && pool.length) result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  const boss=saturnBoss(s),room=boss?chamberOfTile(boss.tileX,boss.tileY):-1;
  const extra=pool.filter(([x,y])=>room>=0&&chamberOfTile(x,y)===room);
  for(let n=0;n<SATURN.bossIceCount&&extra.length;n++)result.push(extra.splice(Math.floor(Math.random()*extra.length),1)[0]);
  return result;
}
function castShields(s: GameState, boss: Enemy) {
  const allies = s.enemies.filter(e => e.id !== boss.id && e.hp > 0);
  allies.sort((a, b) => a.icyShieldHP - b.icyShieldHP || a.id - b.id);
  for (const ally of allies.slice(0, 3)) {
    ally.icyShieldHP += SATURN.allyShield;
    s.laserBeams.push({ fromX: boss.x, fromY: boss.y, endX: ally.x, endY: ally.y, dirX: 0, dirY: 0, ticks: 30, color: '#aaeeff' });
  }
  if (allies.length) { boss.shootTicks = 20; playAudioOneShot('/sounds/ice.mp3', .45); }
}

export function updateSaturn(s: GameState) {
  const t = s.saturn;
  if (!t || s.gamePhase !== 'playing') return;
  if(t.shatter&&--t.shatter.ticks<=0)t.shatter=null;
  if (t.cooldown > 0 && --t.cooldown === 0) playUiSfx('fenceReady');
  t.effects = t.effects.filter(fx => --fx.ticks > 0);
  spawnSaturnAliens(s);
  t.temporaryIce=t.temporaryIce.filter(tile=>--tile.ticks>0);
  for(const icicle of t.icicles){
    if(--icicle.ticks>0)continue;
    if(icicle.landed)continue;
    icicle.landed=true;icicle.ticks=24;
    if(Math.hypot(s.playerX-(icicle.x+.5)*TILE_SIZE,s.playerY-(icicle.y+.5)*TILE_SIZE)<TILE_SIZE*.75)damagePlayer(s,SATURN.icicleDamage);
    if(s.gamePhase!=='playing')return;
    if(s.rubyTileX>=0&&Math.hypot(s.rubyTileX-icicle.x,s.rubyTileY-icicle.y)<.75)damageRuby(s,SATURN.icicleDamage);
    if(s.gamePhase!=='playing')return;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const x=icicle.x+dx,y=icicle.y+dy;if(!isFloorTile(s.map,x,y))continue;
      const old=t.temporaryIce.find(tile=>tile.x===x&&tile.y===y);
      if(old)old.ticks=SATURN.icicleIceTicks;else t.temporaryIce.push({x,y,ticks:SATURN.icicleIceTicks});
    }
    playSFX_objectBreak('frost');
  }
  t.icicles=t.icicles.filter(i=>i.ticks>0);
  if(s.playerFrozenTicks<=0&&saturnIceAt(s,s.playerTileX,s.playerTileY))freezeSaturnPlayer(s);
  const boss = saturnBoss(s); if (!boss) return;
  const phase = Math.min(3, 3 - Math.floor(Math.max(0, boss.hp - .001) / SATURN.phaseHP)) as 1 | 2 | 3;
  if (phase > t.phase) { t.phase = phase; s.bossSpawnName = `FROST WARDEN · PHASE ${phase}`; s.bossSpawnTicks = 150; }
  if (t.weakTicks > 0) {
    if (--t.weakTicks === 0) { t.barrier = SATURN.barrier; t.level = 1; t.levelTicks = t.pulse = 0; t.iceTimer = 0; }
  } else {
    if(--boss.phaseTimer<=0)relocateFrostWarden(s,boss);
    if (++t.levelTicks >= SATURN.levelTicks) { t.level = Math.min(3, t.level + 1) as 1 | 2 | 3; t.levelTicks = 0; }
    if (--t.iceTimer <= 0 && t.iceWarning <= 0) { t.nextIce = chooseIce(s); t.iceWarning = SATURN.iceWarning; t.iceTimer = SATURN.iceInterval; }
    if (t.iceWarning > 0 && --t.iceWarning === 0) { s.frostIceTiles = t.nextIce; t.nextIce = []; }
    if (s.playerFrozenTicks <= 0 && s.frostIceTiles.some(([x, y]) => x === s.playerTileX && y === s.playerTileY)) {
      freezeSaturnPlayer(s);
      // A triggered tile melts, so standing still cannot chain-freeze the player forever.
      s.frostIceTiles = s.frostIceTiles.filter(([x, y]) => x !== s.playerTileX || y !== s.playerTileY);
    }
    if (--t.shieldTimer <= 0) { castShields(s, boss); t.shieldTimer = SATURN.shieldInterval; }
    if (++t.pulse >= SATURN.pulseTicks) {
      t.pulse = 0; const damage = SATURN.damage[t.level - 1];
      const bossRoom=chamberOfTile(boss.tileX,boss.tileY);
      const chamberMult=(x:number,y:number)=>bossRoom>=0&&chamberOfTile(x,y)===bossRoom?SATURN.bossChamberDamageMult:1;
      const before=s.playerHP+s.rubyHP;
      damagePlayer(s, damage*chamberMult(s.playerTileX,s.playerTileY), undefined, true, SATURN.blizzardShieldCost);
      if(s.gamePhase==='playing')damageRuby(s, damage*chamberMult(s.rubyTileX,s.rubyTileY), undefined, true, SATURN.blizzardShieldCost);
      if(s.playerHP+s.rubyHP<before)playAudioOneShot('/sounds/blizzard-damage.mp3', .65);
      if (s.gamePhase !== 'playing') return;
      for (const enemy of [...s.enemies]) if (enemy.id !== boss.id && enemy.hp > 0) {
        damageEnemy(s, enemy, SATURN.enemyDamage[t.level - 1]*chamberMult(enemy.tileX,enemy.tileY), 'enemy', 0, SATURN.blizzardShieldCost);
        if (enemy.hp <= 0) { const index = s.enemies.indexOf(enemy); if (index >= 0) killEnemy(s, index, true); }
      }
    }
  }

}

function spawnSaturnAliens(s:GameState){
  const t=s.saturn!;
  if (!s.noMobs && --t.spawnTimer <= 0) {
    t.spawnTimer = SATURN.spawnInterval;
    if (s.enemies.length < SATURN.population) {
      const room = Math.floor(Math.random() * 4), pool = CHAMBER_SPAWN_TILES[room];
      const options = pool.filter(([x, y]) => Math.hypot(x - s.playerTileX, y - s.playerTileY) > 4);
      const tile = options[Math.floor(Math.random() * options.length)];
      if (tile) {
        const pick=Math.random();
        const type = pick < .25 ? 'frost_raider' : pick < .45 ? 'ice_caller' : pick < .65 ? 'rime_brute' : pick < .85 ? 'armored' : 'normal';
        const enemy = createEncounterEnemy(s, type, tile[0], tile[1], ENEMY_CONFIGS[type].maxHp);
        enemy.icyShieldHP = type === 'frost_raider' ? SATURN.thiefShield : 0;
        s.enemies.push(enemy);
      }
    }
  }
}

// Match ordinary aliens: prefer the player unless placed Ruby is over two tiles closer.
function saturnTarget(s:GameState,e:Enemy){
  const rx=(s.rubyTileX+.5)*TILE_SIZE,ry=(s.rubyTileY+.5)*TILE_SIZE;
  const ruby=s.rubyTileX>=0&&!s.enemyDecoyActive&&Math.hypot(e.x-s.playerX,e.y-s.playerY)>Math.hypot(e.x-rx,e.y-ry)+2*TILE_SIZE;
  e.targeting=ruby?'ruby':'player';
  return ruby?{x:rx,y:ry,tx:s.rubyTileX,ty:s.rubyTileY}:{x:s.playerX,y:s.playerY,tx:s.playerTileX,ty:s.playerTileY};
}

export function updateIceCaller(s:GameState,e:Enemy){
  const target=saturnTarget(s,e);
  if(e.attackTimer>0)e.attackTimer--;
  if(e.attackTimer>0||Math.hypot(target.x-e.x,target.y-e.y)>SATURN.icicleRange*TILE_SIZE)return;
  e.attackTimer=SATURN.icicleInterval;e.shootTicks=30;
  s.saturn!.icicles.push({x:target.tx,y:target.ty,ticks:SATURN.icicleWarning,landed:false});
}

export function updateRimeBrute(s:GameState,e:Enemy){
  const target=saturnTarget(s,e);
  e.windupTicks=0;
  if(e.attackTimer>0)e.attackTimer--;
  if(e.attackTimer<=0&&Math.hypot(e.x-target.x,e.y-target.y)<TILE_SIZE*1.8){
    const dx=target.x-e.x,dy=target.y-e.y;
    e.chargeDirX=Math.abs(dx)>=Math.abs(dy)?Math.sign(dx)||1:0;e.chargeDirY=e.chargeDirX?0:Math.sign(dy)||1;
    e.shootTicks=24;e.attackTimer=180;
    if(e.targeting==='ruby'){
      damageRuby(s,12,e);s.saturn!.effects.push({x:target.x,y:target.y,ticks:18,kind:'shove'});playSFX_objectBreak('frost');return;
    }
    damagePlayer(s,12,e);
    if(s.gamePhase==='playing'&&!s.enemyDecoyActive){
      if(!s.saturn?.roll)cancelSnowball(s);shovePlayerFromEnemy(s,e,2);
      s.saturn!.effects.push({x:s.playerX,y:s.playerY,ticks:18,kind:'shove'});playSFX_objectBreak('frost');
    }
    return;
  }
  if(e.tileX!==e.targetTileX||e.tileY!==e.targetTileY){
    e.stepProgress=Math.min(TILE_SIZE,e.stepProgress+ENEMY_CONFIGS.rime_brute.speed*MOVE_SPEED_MULT);
    e.x=(e.tileX+.5)*TILE_SIZE+(e.targetTileX-e.tileX)*e.stepProgress;e.y=(e.tileY+.5)*TILE_SIZE+(e.targetTileY-e.tileY)*e.stepProgress;
    if(e.stepProgress>=TILE_SIZE){e.tileX=e.targetTileX;e.tileY=e.targetTileY;e.stepProgress=0;}
    return;
  }
  const path=bfs(s.map,e.tileX,e.tileY,target.tx,target.ty);
  if(path.length){e.targetTileX=path[0][0];e.targetTileY=path[0][1];e.stepProgress=0;}
}

export function updateFrostRaider(s: GameState, e: Enemy) {
  const target=saturnTarget(s,e);
  if (e.attackTimer > 0) e.attackTimer--;
  if (e.windupTicks > 0) {
    if (--e.windupTicks === 0) { e.frostRollLeft = SATURN.thiefRange * TILE_SIZE; e.frostStole = false; playSFX_alienShoot(3,1.3); }
    return;
  }
  if ((e.frostRollLeft ?? 0) > 0) {
    for (let n = 0; n < 12 && e.frostRollLeft! > 0; n++) {
      const x = e.x + e.chargeDirX, y = e.y + e.chargeDirY;
      if (!isFloorTile(s.map, Math.floor((x + e.chargeDirX * 15) / TILE_SIZE), Math.floor((y + e.chargeDirY * 15) / TILE_SIZE))) { e.frostRollLeft = 0; playAudioOneShot('/sounds/snowball-hit.mp3',.7); break; }
      e.x = x; e.y = y; e.frostRollLeft!--;
      const hitPlayer=Math.hypot(x-s.playerX,y-s.playerY)<TILE_SIZE*.65;
      const hitRuby=s.rubyTileX>=0&&Math.hypot(x-(s.rubyTileX+.5)*TILE_SIZE,y-(s.rubyTileY+.5)*TILE_SIZE)<TILE_SIZE*.65;
      if (!e.frostStole && (hitPlayer||hitRuby)) {
        e.frostStole = true;
        playAudioOneShot('/sounds/snowball-hit.mp3',.7);
        if(hitPlayer){
          if (!s.godMode && !s.enemyDecoyActive && !s.saturn?.permaShield) { e.icyShieldHP += s.playerShieldHP; s.playerShieldHP = 0; s.playerSaturnShield = false; }
          damagePlayer(s, 10, e);
        }else{
          if(!s.godMode&&!s.saturn?.permaShield){e.icyShieldHP+=s.rubyShieldHP;s.rubyShieldHP=0;s.rubySaturnShield=false;}
          damageRuby(s,10,e);
        }
        s.saturn!.effects.push({ x, y, ticks: 24, kind: 'steal' });
      }
    }
    e.tileX = e.targetTileX = Math.floor(e.x / TILE_SIZE); e.tileY = e.targetTileY = Math.floor(e.y / TILE_SIZE); e.stepProgress = 0;
    if (!e.frostRollLeft) { e.x = (e.tileX + .5) * TILE_SIZE; e.y = (e.tileY + .5) * TILE_SIZE; e.attackTimer = 180; }
    return;
  }
  if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
    e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + 1.5 * MOVE_SPEED_MULT);
    e.x = (e.tileX + .5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
    e.y = (e.tileY + .5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
    if (e.stepProgress >= TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
    return;
  }
  const dx = target.x - e.x, dy = target.y - e.y;
  if (e.attackTimer <= 0 && Math.hypot(dx, dy) < SATURN.thiefRange * TILE_SIZE && (Math.abs(dx) < 24 || Math.abs(dy) < 24)) {
    e.chargeDirX = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0;
    e.chargeDirY = e.chargeDirX ? 0 : Math.sign(dy) || 1;
    e.windupTicks = SATURN.thiefWindup; playSFX_placeBomb(); return;
  }
  const path = bfs(s.map, e.tileX, e.tileY, target.tx, target.ty);
  if (path.length) { e.targetTileX = path[0][0]; e.targetTileY = path[0][1]; e.stepProgress = 0; }
}

export function godSetSaturnPhase(s: GameState, phase: 1 | 2 | 3) {
  if (!s.saturn) return;
  if (!saturnBoss(s)) godSpawnBoss(s, 'frost_warden');
  const boss = saturnBoss(s); if (!boss) return;
  clearSaturnEncounter(s);
  boss.hp = SATURN.phaseHP * (4 - phase); s.saturn.phase = phase;
  s.saturn.barrier = SATURN.barrier; s.saturn.weakTicks = 0; s.saturn.level = 1; s.saturn.levelTicks = s.saturn.pulse = 0; s.saturn.iceTimer = 0;
}
