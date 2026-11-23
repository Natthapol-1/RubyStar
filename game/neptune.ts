import { gameAudio, channelVolume, playReversed, preloadReversed } from './audio-settings';
import {
  CHAMBER_BOUNDS, ENEMY_CONFIGS, MAP_COLS, MAP_ROWS, METEORITE_PLAYER_DMG, METEORITE_RUBY_DMG, NEPTUNE_BOMB_DAMAGE,
  NEPTUNE_BOMB_FUSE, NEPTUNE_BOMB_INTERVAL, NEPTUNE_BOMB_RADIUS, NEPTUNE_CLONES, NEPTUNE_CLONE_HEAL, NEPTUNE_CLONE_HEAL_FX_TICKS, NEPTUNE_DIVE_POINTS, NEPTUNE_DIVE_TICKS,
  NEPTUNE_CLONE_FLEE_RADIUS, NEPTUNE_CLONE_FLEE_BURST_MULT, NEPTUNE_CLONE_FLEE_BURST_TICKS, NEPTUNE_CLONE_FLEE_BURST_COOLDOWN, NEPTUNE_FISH_BOSS_HEAL, NEPTUNE_FISH_CAP, neptuneFishCap, NEPTUNE_FISH_HEAL, neptuneFishChargeScale, neptuneFishRedChance, NEPTUNE_FISH_SPAWN_GAP, NEPTUNE_HEAL_CHARGE_MAX, NEPTUNE_HEAL_CHARGE_RATE,
  NEPTUNE_JELLY_CAP, NEPTUNE_JELLY_DIVE_CHANCE, NEPTUNE_JELLY_DIVE_DELAY, NEPTUNE_JELLY_GAP, NEPTUNE_PHASE_HPS, NEPTUNE_TOTAL_HP,
  NEPTUNE_POISON_DAMAGE, NEPTUNE_PUFF_DAMAGE, NEPTUNE_PUFF_KNOCKBACK, NEPTUNE_PUFF_RADIUS, NEPTUNE_PUFF_TICKS, NEPTUNE_REVEAL_TICKS,
  NEPTUNE_SHARK_BOSS_DAMAGE, NEPTUNE_SHARK_DAMAGE, NEPTUNE_CLONE_PHASE3_SPEED, NEPTUNE_SHARK_GAP, NEPTUNE_SHARK_KNOCKBACK, NEPTUNE_SHARK_SPEED, NEPTUNE_SHARK_WARNING, NEPTUNE_SHARK_FOLLOWUP_CHANCE, NEPTUNE_SHARK_TRIPLE_CHANCE, NEPTUNE_SHARK_FOLLOWUP_DELAY,
  NEPTUNE_TRIDENT_DAMAGE, NEPTUNE_TIDE_AGAINST, NEPTUNE_TIDE_PUSH_GAP, NEPTUNE_TIDE_ROTATE, NEPTUNE_TIDE_WITH,
  SEA_ALLY_HEAL_INTERVAL, SEA_SONG_FIRST_DELAY, TILE_SIZE, T_FLOOR, chamberOfTile, isBossType, neptunePhaseCeilHP, neptunePhaseFloorHP, type EnemyType,
  MOVE_SPEED_MULT,
} from './constants';
import { godPhaseClock,
  bfs, fleePath, stormSlowMultiplier, createEncounterEnemy, createSeaChanterAbilities, damageEnemy, damagePlayer, damageRuby, freeChamberTiles, godSpawnBoss, healPlayer, healCore, isFloorTile,
  ATTACK_SFX_VOLUME, isSeaChanterDiving, killEnemy, playCelestialSound, playSFX_bomb, playSFX_meteorite, playSeaHealing, playSeaSound, roamPath, stopSeaSound,
  tileEuclidDist, type Enemy, type GameState,
} from './engine';
import { playStrikeCharged } from './gaia';
import { updateNeptuneClams, type NeptuneClam } from './neptune-clam';
import { cancelNeptuneRefrain, playOceanMelody, playRefrainNote, releaseRefrainCharge, updateNeptuneRefrain, updateRefrainVisuals, type NeptuneRefrain } from './neptune-refrain';

// Neptune challenge (Sea Chanter): phases, dives and clones, fish, jellyfish, sharks, pufferfish, tides and the Ocean’s Chorus.
// The core engine calls in through updateNeptune and the exported helpers; this module uses engine helpers in turn.

export interface NeptuneTide { chamber: number; dirX: number; dirY: number; ticks: number }
export interface NeptuneState {
  clams?:NeptuneClam[];clamRepositionTicks?:number;
  corruptedClamSlowUntil?:number;
  phase: 1 | 2 | 3; bossId: number;
  armed: boolean[]; // phase 1 keeps cleared points finished; later phases re-arm above their thresholds
  dive: { point: number; ticks: number; dropsLeft: number; dropTimer: number; cloneIds: number[]; jellyTimer: number } | null;
  reveal: { cloneId: number; ticks: number } | null; // a killed jellyfish marks one clone
  // Shark mini-event: a telegraphed lane across one chamber, then a shark charges along it and leaves.
  shark: { chamber: number; vertical: boolean; line: number; dir: 1 | -1; from: number; to: number; pos: number; warning: number; hitPlayer: boolean; hitRuby: boolean; hitBoss: boolean } | null;
  sharkFollowup?: NeptuneState['shark']; sharkThird?: NeptuneState['shark']; sharkTriple?: boolean; // phase 3: a third charge after the follow-up
  sharkTimer: number; jellyTimer: number;
  healCharge: number;
  refrain?: NeptuneRefrain | null; refrainTimer?: number; refrainPreview?: boolean; refrainFullPending?: boolean; lastRefrain?: number; freeNote?: number;
  rhythmOverlay?: {kind:'miss'|'perfect'|'complete';ticks:number};
  refrainResult?: { hits: number; total: number; mistakes: number; heal: number; ticks: number };
  notePulses?: { x: number; y: number; pitch: number; good: boolean; boss: boolean; ticks: number }[];
  resurfaceEffectTicks?: number;
  resurfaceHealed?: boolean;
  laser: { chamber: number; ticks: number } | null;
  laserImpact: { chamber: number; ticks: number } | null; // the strike's visual, separate from meteor impacts
  bombTimer: number; fishTimer: number; poisonTicks: number; poisonTimer: number;
  tides: NeptuneTide[]; tideTimer: number; tidePushTimer: number;
  phaseBannerTicks: number;
}



export function isNeptuneObject(type: EnemyType) {
  return type === 'fish_blue' || type === 'fish_red' || type === 'water_clone' || type === 'water_bomb';
}

export function neptunePhaseFloor(neptune: NeptuneState) { return neptunePhaseFloorHP(neptune.phase); }
function neptunePhaseCeil(neptune: NeptuneState) { return neptunePhaseCeilHP(neptune.phase); }

// Healing can never lift her past the top of the current phase.
export function healNeptune(state: GameState, boss: Enemy, amount: number) {
  const neptune = state.neptune!;
  if (amount <= 0 || boss.hp <= 0) return;
  boss.hp = Math.min(neptunePhaseCeil(neptune), boss.hp + amount);
  if (boss.sea) boss.sea.healPulseTicks = 24;
}

export function chargeNeptuneHealing(state: GameState, healed: number) {
  if (!state.neptune || healed <= 0) return;
  const before = state.neptune.healCharge;
  if (state.neptune.refrainFullPending) return;
  if (state.neptune.refrain && before + healed * NEPTUNE_HEAL_CHARGE_RATE >= NEPTUNE_HEAL_CHARGE_MAX) {
    state.neptune.healCharge = NEPTUNE_HEAL_CHARGE_MAX - 1; state.neptune.refrainFullPending = true; return;
  }
  state.neptune.healCharge = Math.min(NEPTUNE_HEAL_CHARGE_MAX, state.neptune.healCharge + healed * NEPTUNE_HEAL_CHARGE_RATE);
  if (before < NEPTUNE_HEAL_CHARGE_MAX && state.neptune.healCharge >= NEPTUNE_HEAL_CHARGE_MAX) playStrikeCharged(); // the Ocean’s Chorus is ready
}

export function fillNeptuneCharge(state: GameState) {
  if (state.neptune) chargeNeptuneHealing(state, NEPTUNE_HEAL_CHARGE_MAX / NEPTUNE_HEAL_CHARGE_RATE);
}

export function blueFishPopped(state: GameState) {
  const neptune = state.neptune!, boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
  if (boss && isSeaChanterDiving(boss)) { healNeptune(state, boss, NEPTUNE_PHASE_HPS[neptune.phase] * NEPTUNE_FISH_BOSS_HEAL); playSeaHealing(boss); }
  else {const scale=neptuneFishChargeScale(neptune.phase);healPlayer(state, NEPTUNE_FISH_HEAL,true,scale);healCore(state, NEPTUNE_FISH_HEAL,scale);}
}

export function updateFish(state: GameState, e: Enemy) {
  if(state.gamePhase!=='playing')return;
  const clone=e.type==='water_clone'&&!!state.neptune;
  if(clone&&e.neptuneTauntTicks)e.neptuneTauntTicks=Math.max(0,e.neptuneTauntTicks-1);
  const fleeBurstActive=clone&&e.neptuneCloneMode==='flee'&&(e.neptuneTauntTicks??0)===0&&(e.neptuneFleeBurstTicks??0)>0;
  if(clone){
    if((e.neptuneFleeBurstCooldown??0)>0)e.neptuneFleeBurstCooldown=Math.max(0,(e.neptuneFleeBurstCooldown??0)-1);
    if((e.neptuneFleeBurstTicks??0)>0)e.neptuneFleeBurstTicks=Math.max(0,(e.neptuneFleeBurstTicks??0)-1);
  }
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    if(clone){
      const mode=(e.neptuneTauntTicks??0)>0?'taunt':Math.hypot(e.x-state.playerX,e.y-state.playerY)<=NEPTUNE_CLONE_FLEE_RADIUS*TILE_SIZE?'flee':'roam';
      if(mode!==e.neptuneCloneMode){
        e.path=[];e.neptuneCloneMode=mode;
        if(mode==='flee'&&(e.neptuneFleeBurstCooldown??0)<=0){
          e.neptuneFleeBurstTicks=NEPTUNE_CLONE_FLEE_BURST_TICKS;
          e.neptuneFleeBurstCooldown=NEPTUNE_CLONE_FLEE_BURST_COOLDOWN;
        }
      }
      if(mode==='taunt')e.path=bfs(state.map,e.tileX,e.tileY,state.playerTileX,state.playerTileY);
      else if(mode==='flee')e.path=fleePath(state,e);
      else if(!e.path.length)e.path=roamPath(state,e);
    }else if(e.path.length===0)e.path=roamPath(state,e);
    const next = e.path.shift();
    if (next && isFloorTile(state.map, next[0], next[1])) { [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0; }
    return;
  }
  const phase3Clone = e.type === 'water_clone' && state.neptune?.phase === 3 ? NEPTUNE_CLONE_PHASE3_SPEED : 1; // phase 3: clones swim faster
  e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + ENEMY_CONFIGS[e.type].speed * phase3Clone * (fleeBurstActive?NEPTUNE_CLONE_FLEE_BURST_MULT:1) * MOVE_SPEED_MULT * stormSlowMultiplier(state,e));
  e.x = (e.tileX + .5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
  e.y = (e.tileY + .5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
  if (e.stepProgress === TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
}

function spawnNeptuneObject(state: GameState, type: EnemyType, x: number, y: number) {
  const object = createEncounterEnemy(state, type, x, y, ENEMY_CONFIGS[type].maxHp);
  object.attackTimer = 100000; object.visualSpawnTicks = 20;
  state.enemies.push(object);
  return object;
}

export function randomFloorTileAwayFromPlayer(state: GameState, minDistance: number): [number, number] | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    const x = 1 + Math.floor(Math.random() * (MAP_COLS - 2)), y = 1 + Math.floor(Math.random() * (MAP_ROWS - 2));
    if (state.map[y]?.[x] === T_FLOOR && tileEuclidDist(x, y, state.playerTileX, state.playerTileY) >= minDistance) return [x, y];
  }
  return null;
}

// Speed along a tide: faster with the flow, slower against it.
export function neptuneTideSpeed(state: GameState) {
  if(state.neptune?.phase!==3)return 1;
  const tide = state.neptune?.tides.find(t => t.chamber === chamberOfTile(state.playerTileX, state.playerTileY));
  if (!tide) return 1;
  const dx = state.playerTargetX - state.playerTileX, dy = state.playerTargetY - state.playerTileY;
  if (dx === tide.dirX && dy === tide.dirY) return NEPTUNE_TIDE_WITH;
  if (dx === -tide.dirX && dy === -tide.dirY) return NEPTUNE_TIDE_AGAINST;
  return 1;
}

function randomTide(chamber: number, ticks: number): NeptuneTide {
  const [dirX, dirY] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
  return { chamber, dirX, dirY, ticks };
}

function updateNeptuneTides(state: GameState) {
  const neptune = state.neptune!;
  if(neptune.phase!==3){neptune.tides=[];neptune.tidePushTimer=NEPTUNE_TIDE_PUSH_GAP;return;}
  if (neptune.phase === 3) {
    // Phase 3: two rooms always flow, and the currents move every 15s.
    if (neptune.tides.length < 2 || neptune.tides.some(t => t.ticks <= 0)) {
      const rooms = [0, 1, 2, 3].sort(() => Math.random() - .5).slice(0, 2);
      neptune.tides = rooms.map(room => randomTide(room, NEPTUNE_TIDE_ROTATE));
    }
  }
  for (const tide of neptune.tides) tide.ticks--;
  // Like the black hole: anyone not swimming with the current is pushed one tile along it.
  if (--neptune.tidePushTimer > 0) return;
  neptune.tidePushTimer = NEPTUNE_TIDE_PUSH_GAP;
  const tide = neptune.tides.find(t => t.chamber === chamberOfTile(state.playerTileX, state.playerTileY));
  if (!tide || state.playerKnockback || state.playerFrozenTicks > 0 || neptuneTideSpeed(state) === NEPTUNE_TIDE_WITH) return;
  if (isFloorTile(state.map, state.playerTargetX + tide.dirX, state.playerTargetY + tide.dirY))
    state.playerKnockback = { dirX: tide.dirX, dirY: tide.dirY, started: false };
}

// A random floor tile in a room that has no clone yet (any room once all four are used), away from the player.
function neptuneCloneTile(state: GameState, cloneIds: number[]): [number, number] | null {
  const used = new Set(state.enemies.filter(c => cloneIds.includes(c.id)).map(c => chamberOfTile(c.tileX, c.tileY)));
  const rooms = [0, 1, 2, 3].filter(room => !used.has(room));
  const room = (rooms.length ? rooms : [0, 1, 2, 3])[Math.floor(Math.random() * (rooms.length || 4))];
  const tiles = freeChamberTiles(state, room).filter(([x, y]) => tileEuclidDist(x, y, state.playerTileX, state.playerTileY) >= 5);
  return tiles.length ? tiles[Math.floor(Math.random() * tiles.length)] : null;
}

function startNeptuneDive(state: GameState, boss: Enemy, point: number) {
  cancelNeptuneRefrain(state);
  const neptune = state.neptune!, sea = boss.sea ??= createSeaChanterAbilities();
  neptune.dive = { point, ticks: NEPTUNE_DIVE_TICKS[neptune.phase], dropsLeft: NEPTUNE_CLONES[neptune.phase], dropTimer: 1, cloneIds: [],
    jellyTimer: Math.random() < NEPTUNE_JELLY_DIVE_CHANCE ? NEPTUNE_JELLY_DIVE_DELAY : -1 };
  preloadReversed('/sounds/seaSong.mp3'); // ready for the resurface
  sea.mode = 'diving'; sea.diveElapsedTicks = 0; sea.diveFleeing = false; sea.songWindupTicks = 0; sea.resurfaceTicks = 0;
  boss.pathTimer = 0; boss.path = [];
  playSeaSound('dive'); playSeaSound('diveSinging');
  try { const harp=gameAudio('/sounds/neptune-dive-harp.mp3','effects');harp.volume=.65;void harp.play().catch(()=>{}); } catch { }
}

function endNeptuneDive(state: GameState, boss: Enemy, healed = false) {
  const neptune = state.neptune!, sea = boss.sea!;
  for (const id of neptune.dive?.cloneIds ?? []) { const i = state.enemies.findIndex(c => c.id === id); if (i >= 0) state.enemies.splice(i, 1); }
  neptune.dive = null; neptune.reveal = null;
  neptune.resurfaceEffectTicks = NEPTUNE_CLONE_HEAL_FX_TICKS; neptune.resurfaceHealed = healed;
  sea.mode = 'hunting'; sea.songCooldown = SEA_SONG_FIRST_DELAY; sea.allyHealCooldown = SEA_ALLY_HEAL_INTERVAL;
  sea.resurfaceTicks = 36; sea.resurfaceX = boss.x; sea.resurfaceY = boss.y; sea.songWindupTicks = 0;
  boss.pathTimer = 0; boss.path = [];
  stopSeaSound('diveSinging');

  playReversed('/sounds/seaSong.mp3', .5 * ATTACK_SFX_VOLUME, 1.25, 'effects', .3); // water resurface cue with a soft tail
  try{const harp=gameAudio('/sounds/neptune-resurface-harp.mp3','effects');harp.volume=.4;void harp.play().catch(()=>{});}catch{} // added harp layer; original cue remains above
}

function advanceNeptunePhase(state: GameState, boss: Enemy) {
  const neptune = state.neptune!;
  if (neptune.phase === 3) { boss.hp = 0; killEnemy(state, state.enemies.indexOf(boss)); return; } // clearing her final dive (0 HP) defeats her
  neptune.phase = (neptune.phase + 1) as 2 | 3;
  neptune.armed = NEPTUNE_DIVE_POINTS[neptune.phase].map(() => true);
  neptune.bombTimer = NEPTUNE_BOMB_INTERVAL; neptune.tides = []; neptune.phaseBannerTicks = 180;
  boss.hp = neptunePhaseCeil(neptune) - .01; boss.healFlashTicks = 30;
  state.bossSpawnName = `PHASE ${neptune.phase}`; state.bossSpawnColor = ENEMY_CONFIGS.sea_chanter.color; state.bossSpawnTicks = 150;
  playCelestialSound('ready');
}

// God panel: jump straight to a phase at full phase HP (summoning her first if she has not arrived).
export function godSetNeptunePhase(state: GameState, phase: 1 | 2 | 3) {
  godPhaseClock(state, phase); // phase 2+ starts at least a minute in
  const neptune = state.neptune;
  if (!neptune || state.gamePhase !== 'playing') return;
  let boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
  if (!boss) { godSpawnBoss(state, 'sea_chanter'); boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0); }
  if (!boss) return;
  cancelNeptuneRefrain(state); neptune.refrainResult = undefined; neptune.notePulses = [];
  if (neptune.dive) endNeptuneDive(state, boss);
  state.enemies = state.enemies.filter(e => e.type !== 'water_clone' && e.type !== 'water_bomb');
  neptune.phase = phase; neptune.resurfaceEffectTicks = 0; neptune.resurfaceHealed = false;
  neptune.armed = NEPTUNE_DIVE_POINTS[phase].map(() => true);
  neptune.bombTimer = NEPTUNE_BOMB_INTERVAL; neptune.tides = [];
  boss.hp = neptunePhaseCeil(neptune) - .01; boss.healFlashTicks = 30;
  state.bossSpawnName = 'PHASE ' + phase; state.bossSpawnColor = ENEMY_CONFIGS.sea_chanter.color; state.bossSpawnTicks = 120;
}

export function godDiveToNextThreshold(state: GameState): boolean {
  const neptune = state.neptune;
  if (!neptune || state.gamePhase !== 'playing' || neptune.dive) return false;
  const boss = state.enemies.find(enemy => enemy.id === neptune.bossId && enemy.hp > 0);
  if (!boss) return false;
  if (neptune.phase === 1 && neptune.armed.length === 4) neptune.armed = [neptune.armed[0] && neptune.armed[1], neptune.armed[2], neptune.armed[3]];
  const floor = neptunePhaseFloor(neptune);
  const points = NEPTUNE_DIVE_POINTS[neptune.phase];
  const index = points.findIndex((point, i) => neptune.armed[i] && boss.hp > floor + point * NEPTUNE_PHASE_HPS[neptune.phase] + .02);
  if (index < 0) return false;
  cancelNeptuneRefrain(state); neptune.refrainResult = undefined; neptune.notePulses = [];
  boss.hp = floor + points[index] * NEPTUNE_PHASE_HPS[neptune.phase];
  return true;
}

export function updateNeptune(state: GameState) {
  if (!state.neptune || state.gamePhase !== 'playing') return;
  const neptune = state.neptune!;
  updateRefrainVisuals(state);
  updateNeptuneClams(state);
  if (neptune.resurfaceEffectTicks) neptune.resurfaceEffectTicks--;
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600); // no space events on this world
  // Stinger poison.
  if (neptune.poisonTicks > 0) {
    neptune.poisonTicks--;
    if (--neptune.poisonTimer <= 0) { damagePlayer(state, NEPTUNE_POISON_DAMAGE); neptune.poisonTimer = 60; }
  }
  // Fish keep the water busy.
  const fish = state.enemies.filter(f => f.type === 'fish_blue' || f.type === 'fish_red').length;
  if (fish < neptuneFishCap(neptune.phase) && --neptune.fishTimer <= 0) {
    const tile = randomFloorTileAwayFromPlayer(state, 6);
    const extraBlue=neptune.phase===3&&fish>=NEPTUNE_FISH_CAP;
    if (tile) spawnNeptuneObject(state, !extraBlue&&Math.random() < neptuneFishRedChance(neptune.phase) ? 'fish_red' : 'fish_blue', tile[0], tile[1]);
    neptune.fishTimer = NEPTUNE_FISH_SPAWN_GAP;
  }
  updateNeptuneTides(state);
  updateNeptuneShark(state);
  // Now and then a jellyfish drifts in; killing one during a dive marks a clone.
  if (!state.noMobs && --neptune.jellyTimer <= 0) {
    neptune.jellyTimer = NEPTUNE_JELLY_GAP[0] + Math.floor(Math.random() * (NEPTUNE_JELLY_GAP[1] - NEPTUNE_JELLY_GAP[0]));
    if (state.enemies.filter(j => j.type === 'jellyfish').length < NEPTUNE_JELLY_CAP) spawnJellyfish(state);
  }
  // Half of all dives also bring one, a few seconds after she goes under.
  if (!state.noMobs && neptune.dive && neptune.dive.jellyTimer > 0 && --neptune.dive.jellyTimer === 0) spawnJellyfish(state);
  if (neptune.reveal && (--neptune.reveal.ticks <= 0 || !state.enemies.some(c => c.id === neptune.reveal!.cloneId && c.hp > 0))) neptune.reveal = null;
  // Sky laser countdown and strike.
  if (neptune.laser) {
    // Incoming: a brighter, faster take on the meteor's fall lands with the strike, with an electric crackle at the end.
    if (neptune.laser.ticks === TRIDENT_FALL_TICKS) { try { const a = gameAudio('/sounds/meteorFalling.mp3'); a.volume = .5; a.preservesPitch = false; a.playbackRate = 1.6; a.play().catch(() => {}); } catch { } }
    if (neptune.laser.ticks === 30) playCelestialSound('neptune_electric', .8);
  }
  if (neptune.laser && --neptune.laser.ticks <= 0) { neptuneStrike(state, neptune.laser.chamber); neptune.laser = null; }
  if (neptune.phaseBannerTicks > 0) neptune.phaseBannerTicks--;
  if (neptune.laserImpact && --neptune.laserImpact.ticks <= 0) neptune.laserImpact = null;
  // Water balls tick toward their burst.
  const slowBallFuse=neptune.refrain?.stage==='answer'&&neptune.refrain.answerStarted;
  for (const ball of state.enemies.filter(b => b.type === 'water_bomb')) {
    if(slowBallFuse&&state.gameTick%8!==0)continue;
    if (--ball.windupTicks > 0) continue;
    state.bombBlasts.push({ cx: ball.x, cy: ball.y, radius: 0, maxRadius: NEPTUNE_BOMB_RADIUS * TILE_SIZE, ticks: 28, water: true });
    if (tileEuclidDist(ball.tileX, ball.tileY, state.playerTileX, state.playerTileY) <= NEPTUNE_BOMB_RADIUS) damagePlayer(state, NEPTUNE_BOMB_DAMAGE);
    if (state.rubyTileX !== -1 && tileEuclidDist(ball.tileX, ball.tileY, state.rubyTileX, state.rubyTileY) <= NEPTUNE_BOMB_RADIUS) damageRuby(state, NEPTUNE_BOMB_DAMAGE);
    state.enemies.splice(state.enemies.indexOf(ball), 1);
    playSFX_bomb();
  }
  const boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
  if (!boss) { if (neptune.refrainPreview) updateNeptuneRefrain(state); else if (neptune.refrain) cancelNeptuneRefrain(state); return; }
  if (neptune.dive && neptune.refrain && !neptune.refrain.practice) cancelNeptuneRefrain(state);
  if (neptune.dive && neptune.refrain?.practice) updateNeptuneRefrain(state);
  boss.maxHp=NEPTUNE_TOTAL_HP;
  // Older phase-1 run snapshots had four dive points. Preserve the final point
  // when folding their progress into the shorter phase.
  if(neptune.phase===1&&neptune.armed.length===4)neptune.armed=[neptune.armed[0]&&neptune.armed[1],neptune.armed[2],neptune.armed[3]];
  boss.hp = Math.min(boss.hp, neptunePhaseCeil(neptune));
  const points = NEPTUNE_DIVE_POINTS[neptune.phase], floor = neptunePhaseFloor(neptune);
  const level = (point: number) => floor + point * NEPTUNE_PHASE_HPS[neptune.phase];
  const dive = neptune.dive;
  if (!dive && neptune.phase>=2) points.forEach((point, i) => { if (boss.hp > level(point) + .5) neptune.armed[i] = true; }); // re-arm only while surfaced
  if (!dive) {
    const i = points.findIndex((point, index) => neptune.armed[index] && boss.hp <= level(point) + .02);
    if (i >= 0) { neptune.armed[i] = false; startNeptuneDive(state, boss, points[i]); return; }
    const refrainHeal = updateNeptuneRefrain(state, boss);
    if (refrainHeal > 0) healNeptune(state, boss, refrainHeal);
    // Phase 2+: water balls while surfaced.
    if (neptune.phase >= 2 && --neptune.bombTimer <= 0) {
      neptune.bombTimer = NEPTUNE_BOMB_INTERVAL;
      const ball = spawnNeptuneObject(state, 'water_bomb', state.playerTileX, state.playerTileY);
      ball.windupTicks = NEPTUNE_BOMB_FUSE;
      boss.shootTicks = 24; playSeaSound('attack');
    }
    return;
  }
  // Diving: the moment she goes under, every clone appears at once somewhere random in its own room; then wait for them to be found.
  if (dive.dropsLeft > 0 && --dive.dropTimer <= 0) {
    // All of the dive's clones appear together, each in a different room.
    while (dive.dropsLeft > 0) {
      const tile = neptuneCloneTile(state, dive.cloneIds) ?? [boss.tileX, boss.tileY];
      dive.cloneIds.push(spawnNeptuneObject(state, 'water_clone', tile[0], tile[1]).id);
      dive.dropsLeft--;
    }
  }
  const alive = dive.cloneIds.filter(id => state.enemies.some(c => c.id === id && c.hp > 0)).length;
  if (dive.dropsLeft === 0 && alive === 0) {
    boss.hp = Math.min(boss.hp, Math.max(level(dive.point), .01)); // all ally healing during the dive is cancelled
    const finished = dive.point === 0;
    endNeptuneDive(state, boss);
    if (finished) advanceNeptunePhase(state, boss);
    return;
  }
  if (--dive.ticks <= 0) {
    const pointIndex=points.indexOf(dive.point);
    if(neptune.phase===1&&pointIndex>=0)neptune.armed[pointIndex]=true; // failed dives still need clearing
    const previousHp = boss.hp;
    healNeptune(state, boss, alive * NEPTUNE_CLONE_HEAL * NEPTUNE_PHASE_HPS[neptune.phase]);
    const healed = boss.hp > previousHp;
    playSeaHealing(boss);
    endNeptuneDive(state, boss, healed);
  }
}

// Pufferfish: once close and off cooldown it stops and swells for 0.5s, then bursts. Anyone within 3.5 tiles takes 8
// (Ruby too); you are shoved 2 tiles away from it. Returns true while it is busy puffing (it does not move then).
export function updatePufferfish(state: GameState, e: Enemy): boolean {
  if (e.attackTimer > 0) e.attackTimer--;
  if (e.windupTicks > 0) {
    if (--e.windupTicks > 0) return true;
    pufferBurst(state, e);
    e.shootTicks = 18; e.attackTimer = ENEMY_CONFIGS.pufferfish.attackCooldown;
    return true;
  }
  if (e.attackTimer <= 0 && tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= NEPTUNE_PUFF_RADIUS - .5) {
    e.windupTicks = NEPTUNE_PUFF_TICKS; return true;
  }
  return false;
}

// The spike burst (also when it dies): 8 to you and Ruby within 3.5 tiles, and you are shoved 2 tiles away.
export function pufferBurst(state: GameState, e: Enemy) {
  const reach = (x: number, y: number) => tileEuclidDist(e.tileX, e.tileY, x, y) <= NEPTUNE_PUFF_RADIUS;
  if (reach(state.playerTileX, state.playerTileY)) {
    damagePlayer(state, NEPTUNE_PUFF_DAMAGE, e);
    const dx = state.playerTileX - e.tileX, dy = state.playerTileY - e.tileY;
    const [kx, ky] = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx) || 1, 0] : [0, Math.sign(dy) || 1];
    if (!state.playerKnockback && isFloorTile(state.map, state.playerTargetX + kx, state.playerTargetY + ky))
      state.playerKnockback = { dirX: kx, dirY: ky, started: false, tilesLeft: NEPTUNE_PUFF_KNOCKBACK };
  }
  if (state.rubyTileX !== -1 && reach(state.rubyTileX, state.rubyTileY)) damageRuby(state, NEPTUNE_PUFF_DAMAGE, e);
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 8); state.screenShakeAmt = Math.max(state.screenShakeAmt, 4);
  playSeaSound('attack');
}

function spawnJellyfish(state: GameState) {
  const tile = randomFloorTileAwayFromPlayer(state, 6);
  if (tile) { const jelly = createEncounterEnemy(state, 'jellyfish', tile[0], tile[1], ENEMY_CONFIGS.jellyfish.maxHp); jelly.visualSpawnTicks = 20; state.enemies.push(jelly); }
}

// Killing a jellyfish during a dive marks the clone nearest to you for a few seconds.
const TRIDENT_FALL_TICKS = 94; // meteorFalling.mp3 at 1.6× (pitch raised too) lasts about 1.6s

export function neptuneRevealClone(state: GameState) {
  const neptune = state.neptune, dive = neptune?.dive; if (!neptune || !dive) return;
  const clones = state.enemies.filter(c => dive.cloneIds.includes(c.id) && c.hp > 0 && c.id !== neptune.reveal?.cloneId)
    .sort((a, b) => tileEuclidDist(a.tileX, a.tileY, state.playerTileX, state.playerTileY) - tileEuclidDist(b.tileX, b.tileY, state.playerTileX, state.playerTileY));
  if (clones[0]) { neptune.reveal = { cloneId: clones[0].id, ticks: NEPTUNE_REVEAL_TICKS }; playCelestialSound('ready', .6); }
}

// A possible follow-up is warned as the first charge launches, then charges one second later.
function createShark(state:GameState,warning:number,verticalOverride?:boolean): NeptuneState['shark'] {
    const chamber = chamberOfTile(state.playerTileX, state.playerTileY);
    if (chamber < 0) { return null; } // try again soon once you are in a chamber
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber], vertical = verticalOverride ?? Math.random() < .5, dir: 1 | -1 = Math.random() < .5 ? 1 : -1;
    const [lo, hi] = vertical ? [r1, r2] : [c1, c2];
    return { chamber, vertical, line: vertical ? state.playerTileX : state.playerTileY, dir, from: dir > 0 ? lo : hi, to: dir > 0 ? hi : lo,
      pos: dir > 0 ? lo - 1 : hi + 1, warning, hitPlayer: false, hitRuby: false, hitBoss: false };

}
function updateNeptuneShark(state: GameState) {
  const neptune = state.neptune!;
  if(state.noMobs){
    neptune.shark=neptune.sharkFollowup=neptune.sharkThird=null;
    neptune.sharkTriple=false;
    return;
  }
  if(neptune.refrain?.stage==='answer'&&neptune.refrain.answerStarted&&state.gameTick%8!==0)return;
  if (!neptune.shark && !neptune.sharkFollowup && !neptune.sharkThird) {
    if (--neptune.sharkTimer > 0) return;
    neptune.sharkTimer = NEPTUNE_SHARK_GAP[0] + Math.floor(Math.random() * (NEPTUNE_SHARK_GAP[1] - NEPTUNE_SHARK_GAP[0]));
    neptune.shark=createShark(state,NEPTUNE_SHARK_WARNING); neptune.sharkTriple = neptune.phase === 3 && Math.random() < NEPTUNE_SHARK_TRIPLE_CHANCE;
    if(!neptune.shark)neptune.sharkTimer=120;
    return;
  }
  const active=(['shark','sharkFollowup','sharkThird'] as const).map(key=>({key,shark:neptune[key]}));
  for(const {key,shark} of active) {
    if(!shark)continue;
    if (shark.warning > 0) {
      if (--shark.warning === 0) {
        playSeaSound('attack');
        if(key==='shark'&&(neptune.sharkTriple||Math.random()<NEPTUNE_SHARK_FOLLOWUP_CHANCE[neptune.phase]))
          neptune.sharkFollowup=createShark(state,NEPTUNE_SHARK_FOLLOWUP_DELAY,!shark.vertical);
        if(key==='sharkFollowup'&&neptune.sharkTriple){ // a triple: one more charge, across the follow-up's lane
          neptune.sharkThird=createShark(state,NEPTUNE_SHARK_FOLLOWUP_DELAY,!shark.vertical); neptune.sharkTriple=false;
        }
      }
      continue;
    }
    shark.pos += shark.dir * NEPTUNE_SHARK_SPEED;
    const along = (x: number, y: number) => shark.vertical ? x === shark.line && Math.abs(y - shark.pos) < .8 : y === shark.line && Math.abs(x - shark.pos) < .8;
    if (!shark.hitPlayer && along(state.playerTileX, state.playerTileY)) {
      shark.hitPlayer = true;
      damagePlayer(state, NEPTUNE_SHARK_DAMAGE);
      // Thrown sideways off the lane (the other side if a wall is there).
      const [sx, sy] = shark.vertical ? [1, 0] : [0, 1], side = Math.random() < .5 ? 1 : -1;
      for (const k of [side, -side]) if (isFloorTile(state.map, state.playerTargetX + sx * k, state.playerTargetY + sy * k)) { state.playerKnockback = { dirX: sx * k, dirY: sy * k, started: false, tilesLeft: NEPTUNE_SHARK_KNOCKBACK }; break; }
      state.screenShakeTicks = Math.max(state.screenShakeTicks, 10); state.screenShakeAmt = Math.max(state.screenShakeAmt, 5);
    }
    if (!shark.hitRuby && state.rubyTileX !== -1 && along(state.rubyTileX, state.rubyTileY)) { shark.hitRuby = true; damageRuby(state, NEPTUNE_SHARK_DAMAGE); }
    const boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
    if (boss && !shark.hitBoss && along(boss.tileX, boss.tileY)) { shark.hitBoss = true; damageEnemy(state, boss, NEPTUNE_PHASE_HPS[neptune.phase] * NEPTUNE_SHARK_BOSS_DAMAGE, 'meteor'); }
    if ((shark.dir > 0 && shark.pos > shark.to + 2) || (shark.dir < 0 && shark.pos < shark.to - 2)) neptune[key] = null;
  }
}

// Meteor-like strike on a whole room: aliens and water objects there are destroyed, she takes a share of
// phase HP, and the player and Ruby are hit like a meteor if they are inside.
function neptuneStrike(state: GameState, chamber: number) {
  const neptune = state.neptune!;
  neptune.laserImpact = { chamber, ticks: 120 };
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 22); state.screenShakeAmt = Math.max(state.screenShakeAmt, 12);
  playSFX_meteorite();
  for (const target of [...state.enemies].reverse()) {
    if (!state.enemies.includes(target) || chamberOfTile(target.tileX, target.tileY) !== chamber) continue;
    if (target.id === neptune.bossId) damageEnemy(state, target, NEPTUNE_PHASE_HPS[neptune.phase] * NEPTUNE_TRIDENT_DAMAGE[neptune.phase], 'meteor');
    else if (!isBossType(target.type)) { damageEnemy(state, target, target.hp + 1, 'meteor'); const i = state.enemies.indexOf(target); if (i >= 0) killEnemy(state, i, true); }
  }
  if (chamberOfTile(state.playerTileX, state.playerTileY) === chamber) damagePlayer(state, METEORITE_PLAYER_DMG);
  if (state.rubyTileX !== -1 && chamberOfTile(state.rubyTileX, state.rubyTileY) === chamber) damageRuby(state, METEORITE_RUBY_DMG);
}

export function canOpenSkyLaser(state: GameState) {
  const neptune=state.neptune;
  return !!neptune && state.gamePhase==='playing' && !neptune.laser && (neptune.healCharge>=NEPTUNE_HEAL_CHARGE_MAX||neptune.refrainFullPending);
}
export function openSkyLaser(state: GameState): boolean {
  if (!canOpenSkyLaser(state)) return false;
  if(state.neptune!.refrainFullPending)releaseRefrainCharge(state);
  state.gamePhase = 'laserTarget'; state.playerQueuedDirX = state.playerQueuedDirY = 0;
  return true;
}

export function useOceanMelody(state: GameState): boolean {
  return playOceanMelody(state);
}

export const NEPTUNE_CHORUS_HOLD_MS=200;

/** God-panel start/restart keeps stored charge and never forces a guardian spawn. */
export function godStartOceanMelody(state:GameState):boolean{
  const n=state.neptune;if(!n||state.gamePhase!=='playing')return false;
  if(n.refrain)cancelNeptuneRefrain(state);
  const boss=state.enemies.find(enemy=>enemy.id===n.bossId&&enemy.hp>0);
  if(n.healCharge>=NEPTUNE_HEAL_CHARGE_MAX){n.healCharge=NEPTUNE_HEAL_CHARGE_MAX-1;n.refrainFullPending=true;}
  n.refrainPreview=true;n.refrainTimer=0;
  updateNeptuneRefrain(state,n.dive||n.laser?undefined:boss);return !!n.refrain;
}

export function playOceanChorusCast(){
  for(const [src,volume] of [['/sounds/neptune-chorus-epiphany.mp3',.65],['/sounds/neptune-chorus-angels.mp3',.5]] as const){
    try{const choir=gameAudio(src,'effects');choir.volume=volume;void choir.play().catch(()=>{});}catch{}
  }
}

export function playNeptuneCloneNote(){playRefrainNote(Math.floor(Math.random()*6));}
