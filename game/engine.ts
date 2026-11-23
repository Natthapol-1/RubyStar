import { neptuneClamSlow } from './neptune-clam';
import { swallowAtField, updateSingularityMaws, clearSingularityMaws, phaseHP as singularityPhaseHP, phaseStacks as singularityPhaseStacks, updateLostSoul, mawAvoider, nearlyFull, singularityHeld, bodyStackCap, bodyJump, gasDepth, gasPlayerSlow, bodySpreadStep, SINGULARITY_BURST_TICKS, SINGULARITY_LAND_TICKS, type SingularityTrial } from './singularity-maw';
import { VENUS, createVenusState, initializeVenusBoss, updateVenus, clearVenusEncounter, venusAirborne, venusHoldsBoss, venusTotemDestroyed, venusGuard, venusRelicDestroyed, venusCoreHit, venusCoreDestroyed, venusReflectScale, venusBand, venusFloor, venusPhaseOf, duneWormHidden, updateDuneWorm, updateSandScorpion, type VenusState } from './venus';
export { pressGravityHook, releaseGravityHook, hookTarget, mawWindow, singularityOpenness } from './singularity-maw';
import { updateRegularAlien } from './aliens';
export { lancerBeamEnd } from './aliens';
import {obsidianBossHit,blessingDeath,rubyBlessingCopy,addStarEnergy,blessingAttack,blessingLandedAttack,blessingDamageMultiplier,blessingSpeedMultiplier,blessingHit,blessingHealed,blessingIncoming,blessingReflectIncoming,blessingAfterHit,leaveQueenBlessingDecoy,solarBlessingReady} from './blessing-effects';
import { gameAudio, channelVolume, getAudioCtx, setNonMusicAudioDuck } from './audio-settings';
import { recordBoss, recordStage, updateProfile, getProfile, isDesktop } from './profile';
import { createRunBuildState, updateRunBuilds, buildBulletHit, buildWaveHit, emitBuildWave, buildSlowMultiplier, hasBlessing, pullBuildEnemies, offerCelestialBlessing, prepareBlessingChoice, buildDeathField, buildBombStun, type RunBuildState } from './endless-builds';
import { SATURN, createSaturnState, initializeSaturnBoss, clearSaturnEncounter, updateSaturn, updateSaturnAlien, interruptSaturnAlien, isSaturnAlien, saturnTimeStopped, saturnDamageTaken, saturnShatter, saturnEmpower, saturnIceAt, saturnBlizzard, freezeSaturnPlayer, type SaturnState } from './saturn';
import { SIRIUS, siriusCanFloat, siriusPlayerSpeed, guessSiriusRitual, createSiriusState, initializeSiriusBoss, clearSiriusEncounter, updateSirius, updateSiriusAlien, interruptSiriusAlien, isSiriusAlien, siriusReversed, siriusDamageTaken, siriusEmpower, type SiriusState } from './sirius';
import { createGambitState, updateGambit, type GambitState } from './gambit';
import { createBinaryState, initializeBinaryTwins, binaryLoseLife, clearBinaryEncounter, updateBinary, binaryDamageTaken, binaryTwinBusy, binaryWallStun, updateGrounder, pulsarDied, BINARY, type BinaryState } from './binary';
import { createJupiterState, initializeJupiterBoss, clearJupiterEncounter, drainJupiterEnergy, jupiterDamageTaken, jupiterBoss, jupiterPlayerSpeed, updateJupiterReaper, updateJupiter, normalizeJupiterHealth, type JupiterState } from './jupiter';
import { CHALLENGE_EXTRA_POOL, JUPITER, jupiterPhaseHP, jupiterPhaseFloorHP, jupiterPhaseOfHP, SINGULARITY_CHALLENGE, SUN } from './constants';
import { clearSunEncounter, createSunState, defuseSunFlare, igniteSpitterTile, updateScorchSapper, initializeSunBoss, spawnSunWisps, sunStationNearPlayer, updateSun, type SunState } from './sun';
import {
  NEPTUNE_PHASE_HPS, NEPTUNE_TOTAL_HP, NEPTUNE_DIVE_POINTS, NEPTUNE_DIVE_SPEED, NEPTUNE_BOSS_SPEED_MULT,
  NEPTUNE_BOMB_INTERVAL, NEPTUNE_SONG_BONUS, NEPTUNE_BOMB_SELF_DAMAGE, NEPTUNE_ATTACK_MULT,
  NEPTUNE_STRIKE_DAMAGE, NEPTUNE_HEAL_CHARGE_MAX,
  NEPTUNE_CLAM, NEPTUNE_STINGER_CHANCE, NEPTUNE_POISON_TICKS,
  NEPTUNE_CLONE_KILL_HEAL, NEPTUNE_CLONE_CHARGE_HEAL, NEPTUNE_TIDE_SKILL_HEAL, NEPTUNE_TIDE_SKILL_CHARGE_HEAL, NEPTUNE_CLONE_HEAL_BLOCK, NEPTUNE_TIDE_GAP, NEPTUNE_TIDE_PUSH_GAP,
  NEPTUNE_JELLY_GAP, NEPTUNE_SHARK_GAP, NEPTUNE_PUFFER_CHANCE, NEPTUNE_PUFF_RADIUS,
  GAIA_CAST_COOLDOWN, GAIA_THORN_CONTACT_DAMAGE, GAIA_THORN_RUBY_DAMAGE, GAIA_THORN_RUBY_CUT,
  GAIA_STRIKE_DAMAGE, GAIA_SUN_WARNING, NEPTUNE_LASER_WARNING,
  MOON_PHASE_HP, MOON_QUEEN_DAMAGE_MULT, MOON_STRIKE_DAMAGE, MOON_MITE_CHANCE, MOON_SHADE_CHANCE, MOON_HOUND, MOON_BLINKER_CHANCE, MOON_BLINKER_MAX, MOON_MITE_KILL_HEAL, MOON_HIT_HEAL,
  GAIA_POD_CHARGE,
  GAIA_BLOSSOM_SELF_DAMAGE, GAIA_BLOSSOM_KILL_HEAL, GAIA_LIFEBLOOM_HEAL,
  GAIA_ALIEN_CHANCE, GAIA_MUSHROOM_KNOCKBACK, GAIA_SPAWN_RATE, GAIA_EXTRA_ENEMIES,
} from './constants';
import { stopSunHeatWarning, stopSunburstWarning, syncToxicGasSound, stopAmbientEventSounds, pauseAmbientEventSounds, resumeAmbientEventSounds } from './event-audio';
import { playUiSfx } from './ui-sfx';
import { createAmbientEvents, updateAmbientEvents, isEclipseActive, hitSupernova, SUPERNOVA_PLAYER_RADIUS, SUPERNOVA_FULL_DAMAGE_RADIUS, type AmbientEventState } from './events';
export { AMBIENT_EVENTS, STAR_FALL_TICKS, SUPERNOVA_CHARGE_TICKS, SUPERNOVA_BLAST_TICKS, triggerAmbientEvent } from './events';
export type { AmbientEventKind } from './events';
import {
  TILE_SIZE, MAP_COLS, MAP_ROWS,
  SpecialSkill, SPECIAL_UNLOCK_KILLS, SPECIAL_SKILLS, SPECIAL_REAPER_RADIUS, SPECIAL_REAPER_HASTE, SPECIAL_REAPER_HASTE_TICKS, SPECIAL_REAPER_SLOW, SPECIAL_REAPER_SLOW_TICKS, SPECIAL_WARDEN_SHIELD, SPECIAL_SUSTAIN_PER_STAGE,
  SPECIAL_VENUS_DURATION, SPECIAL_VENUS_DAMAGE_MULT, SPECIAL_VENUS_BOSS_REFLECT_CAP, SPECIAL_TWIN_DURATION, SPECIAL_TWIN_DAMAGE_MULT,
  SPECIAL_CHANTER_HEAL, SPECIAL_CHANTER_RADIUS, SPECIAL_CHANTER_PUSH, SPECIAL_PRAYER_DURATION, SPECIAL_QUEEN_DECOY_HITS, SPECIAL_QUEEN_DECOY_INVULNERABILITY,
  SPECIAL_WEAVER_DURATION, GAIA_ROOTS_DURATION, SPECIAL_WEAVER_RADIUS, SPECIAL_WEAVER_SLOW, SPECIAL_WEAVER_NORMAL_DAMAGE, SPECIAL_WEAVER_BOSS_DAMAGE,
  SPECIAL_SINGULARITY_RADIUS, SPECIAL_SINGULARITY_TICKS, SPECIAL_SINGULARITY_NORMAL_DAMAGE, SPECIAL_SINGULARITY_BOSS_DAMAGE, REGULAR_ENEMY_HP_MULT,
  T_WALL, T_TELEPORT, T_FLOOR,
  PLAYER_START, CHAMBER_SPAWN_TILES, CHAMBER_BOUNDS, TELEPORT_PADS, TELEPORT_COOLDOWN, HALLWAY_BOUNDS,
  chamberOfTile, hallwayOfTile,
  PLAYER_MAX_HP, RUBY_MAX_HP, PLAYER_BASE_SPEED, PLAYER_CARRY_MULT,
  LASER_RANGE, LASER_RANGE_PWR, LASER_DMG, LASER_DMG_PWR, LASER_COOLDOWN,
  CHARGE_NEEDED, CHARGE_DECAY_TICKS,
  WAVE_RADIUS, WAVE_RADIUS_PWR, WAVE_DMG, WAVE_DMG_PWR,
  WAVE_PUSH_TILES, WAVE_PUSH_TILES_PWR, WAVE_COOLDOWN,
  SPEED_DURATION, SPEED_DURATION_PWR, SPEED_MULT, SPEED_COOLDOWN, CARRY_BOOST_SPEED_MULT,
  BOMB_RADIUS, BOMB_RADIUS_PWR, BOMB_DMG, BOMB_DMG_PWR,
  BULLET_COOLDOWN, BULLET_DMG, BULLET_DMG_PWR, BULLET_SPEED, BULLET_HEAVY_EVERY, BULLET_HEAVY_EVERY_MONOCEROS, BULLET_HEAVY_MULT, BULLET_HEAVY_PUSH,
  STAR_ENERGY_MAX, SIRIUS_HOLY_PER_ENERGY, STAR_ENERGY_PER_KILL, ENERGY_LEECH_DRAIN,
  RESOURCE_SPAWN_INTERVAL, RESOURCE_MAX_ON_MAP, HEAL_AMOUNT, ENERGY_AMOUNT,
  RUBY_HEAL_AMOUNT, RUBY_HEAL_COOLDOWN, RUBY_HEAL_RANGE, RUBY_HEAL_CLEAR_RANGE,
  METEORITE_CYCLE, METEORITE_WARNING, TUTORIAL_STEPS, TUTORIAL_STEP_PAUSE, TRIAL_BOSS_DELAY, trialSkillCooldown, SPECIAL_RECAST_LOCK, METEORITE_PLAYER_DMG, METEORITE_RUBY_DMG,
  SNIPER_ATTACK_RANGE, SNIPER_WINDUP_TICKS, SNIPER_CHAIN_RANGE, SNIPER_CHAIN_DMG,
  HEALER_HEAL_RADIUS, HEALER_HEAL_AMOUNT, HEALER_HEAL_INTERVAL,
  CHARGER_CHARGE_SPEED, CHARGER_WINDUP_TICKS, CHARGER_CHARGE_TILES, CHARGER_SIGHT_RANGE, CHARGER_STUN_TICKS,
  SHIELDER_SHIELD_RANGE, KILL_SHIELD_HP, KILL_SHIELD_CAP,
  BOSS_SPAWN_INTERVAL, BOSS_WARNING_TICKS, BOSS_METEOR_DMG, BOSS_LATE_METEOR_DMG, BOSS_ATTACK_RANGE, BOSS_FIRST_SPAWN_TIMER,
  BOSS_ANNOUNCEMENT_TICKS, BOSS_NAMES, BossType, isBossType, PRAYER_FLEE_REPATH_TICKS,
  BOSS_SKILL_REWARDS, AEGIS_DAMAGE_MULT, AEGIS_REFLECT_RATIO, AEGIS_EXPOSE_TICKS, AEGIS_RESHIELD_WARNING_TICKS, AEGIS_EXPOSED_SPEED,
  TOTEM_LIFETIME_TICKS, TOTEM_OVERLOAD_WINDUP, TOTEM_OVERLOAD_DAMAGE,
  TWIN_REVIVE_TICKS, TWIN_REVIVE_HP_RATIO, TWIN_REVIVE_HASTE_TICKS, TWIN_REVIVE_HASTE_MULT, TWIN_BERSERK_SPEED_MULT, TWIN_BERSERK_COOLDOWN_MULT, TWIN_BERSERK_DAMAGE_TAKEN, TWIN_MIN_SEPARATION,
  TWIN_RANGED_RANGE, TWIN_RANGED_SPEED, TWIN_RANGED_WINDUP, TWIN_RANGED_COOLDOWN, TWIN_RANGED_DAMAGE,
  TWIN_TRANSFER_MIN_TICKS, TWIN_TRANSFER_MAX_TICKS, TWIN_TRANSFER_RATIO, TWIN_TRANSFER_FX_TICKS,
  PRAYER_RUBY_COOLDOWN, PRAYER_RUBY_WINDUP, PRAYER_ESCAPE_WINDUP,
  PRAYER_ESCAPE_DURATION, PRAYER_ESCAPE_SPEED, PRAYER_ESCAPE_GRACE,
  PRAYER_KNOCKBACK_SPEED,
  GAIA_SPORE_SHOT, THORN_WINDUP, THORN_FIRST_DELAY, THORN_RADIUS, THORN_DEFENSE_RADIUS, THORN_DEFENSE_TRIGGER_RANGE, THORN_DEFENSE_COOLDOWN, THORN_LIFETIME, THORN_MAX_PATCHES, getThornFieldBounds, thornFieldContainsTile,
  THORN_POISON_TICKS, THORN_POISON_INTERVAL, THORN_POISON_DAMAGE, THORN_CONTACT_DAMAGE, THORN_CONTACT_INTERVAL, THORN_SLOW_MULT, THORN_FLEE_RANGE,
  SEA_DIVE_DAMAGE_MULTIPLIER, SEA_DIVE_SPEED, SEA_DIVE_FLEE_RANGE, SEA_DIVE_ENTER_HP, SEA_DIVE_EXIT_HP, SEA_MINIMAP_INTERVAL, SEA_MINIMAP_REVEAL,
  SEA_ALLY_HEAL_RADIUS, SEA_ALLY_HEAL_AMOUNT, SEA_ALLY_HEAL_INTERVAL, SEA_ALLY_PASSIVE_HEAL, SEA_FEED_HEAL_RATIO, SEA_FEED_HEAL_CAP, SEA_HEALING_BLOCK_TICKS,
  SEA_SONG_WINDUP, SEA_SONG_FIRST_DELAY, SEA_SONG_SPEED, SEA_SONG_HIT_RADIUS, SEA_SONG_BLAST_RADIUS, SEA_SONG_BLAST_TICKS, SEA_SONG_BLAST_DAMAGE_CENTER, SEA_SONG_BLAST_DAMAGE_EDGE,
  KING_SPEED_RAMP_PER_SEC, KING_SPEED_CAP,
  KING_UNTOUCHED_TICKS, KING_ARENA_WINDUP, KING_ARENA_DAMAGE, KING_ARENA_DAMAGE_MAX, KING_RAMP_SECONDS, KING_ARENA_FX_TICKS,
  QUEEN_PHASE_INTERVAL, QUEEN_ATTACK_RANGE, QUEEN_WINDUP_TICKS, QUEEN_PHASE_HEAL_PCT, QUEEN_PHASE_HEAL_CAP,
  REAPER_SEAL_DURATION, REAPER_SEAL_COOLDOWN,
  DEVOURER_ABSORB_RANGE, DEVOURER_ABSORB_COOLDOWN, DEVOURER_ABSORB_COOLDOWN_PER_GEN, DEVOURER_ABSORB_COOLDOWN_GEN_STEP, DEVOURER_MAX_STACKS, DEVOURER_STACK_HP_PCT, DEVOURER_STACK_DAMAGE, DEVOURER_ENDLESS_BITE_BONUS, DEVOURER_KNOCKBACK_CHANCE, DEVOURER_KNOCKBACK_TILES,
  DEVOURER_FULL_HEAL_PCT, DEVOURER_HUNGRY_BELOW, DEVOURER_NEWBORN_TICKS, DEVOURER_NEWBORN_SPEED_MULT, DEVOURER_COPY_FIRST_MEAL, DEVOURER_START_STACKS, DEVOURER_GEN_SPEED_MULT, DEVOURER_GEN_DAMAGE_MULT, DEVOURER_FAMILY_CAP, DEVOURER_SELF_SPLIT_TICKS, DEVOURER_BODY_KILL_HEAL, DEVOURER_HP_PER_DEFEAT, DEVOURER_COPY_HP_RATIO, DEVOURER_COPY_SCALE,
  FROST_CHILL_SPEED_MULT, FROST_CHILL_TICK_RATE, FROST_ICE_TILE_COUNT,
  FROST_FREEZE_DURATION, FROST_RELOCATE_INTERVAL, FROST_SHIELD_HP, FROST_SHIELD_HP_PER_DEFEAT, FROST_SHIELD_HP_MAX, FROST_SHIELD_CAST_DELAY,
  DIFFICULTY_OPENING_THRESHOLDS, DIFFICULTY_TIERS,
  ENEMY_CONFIGS, CRATER, TRIANGULUM, ENCHANTER, BLEEDER, SNATCHER, IMPOSTOR, SHOOTER, REFLECTOR, TRAPPER, DROPPER, BLINKER, JAMMER, SPOOK, GRAPPLER, lateEnemyDamageMult, ALIEN_HP_PER_MILESTONE, BLESSING, CARRY_DAMAGE_MULT, CARRY_PUSH_MULT, URSA_PUSH_MULT, CARRY_BOOST_MULT, HYDRA, ALIEN_KNOCKBACK, TWIN_MELEE_KNOCKBACK, COMET, RETICULUM, MOVE_SPEED_MULT, KNOCKBACK_SHAKE_TICKS, KNOCKBACK_SHAKE_AMOUNT, LANCER, EnemyType, BOSS_TYPES,
  generateMap, generateBazaarMap, applyChamberLayout,
} from './constants';
import { playOceanChorusCast, playNeptuneCloneNote,
  chargeNeptuneHealing, healNeptune, isNeptuneObject, neptunePhaseFloor, neptuneRevealClone, neptuneTideSpeed, pufferBurst, updateFish, updateNeptune, updatePufferfish,
} from './neptune';
import type { NeptuneState } from './neptune';
import {
  addGaiaSunCharge, createGaiaState, gaiaAlienType, gaiaBoss, gaiaBossDamageMult, gaiaClearArea, gaiaClearRootsField, gaiaClearTile, gaiaLaserRangeMult, gaiaLevel, gaiaPhaseFloor, gaiaPlayerSpeed, gaiaScorchRoom, gaiaSeekPath, gaiaSelfDamage, gaiaSporeCloud, gaiaSporeImpact, gaiaStoneBlocksField, gaiaStrikeDamage, gaiaTwinFieldAim, initializeGaiaBoss, isGaiaObject, updateGaia,
  playStrikeCharged,
} from './gaia';
import type { GaiaState } from './gaia';
export type { NeptuneTide, NeptuneState } from './neptune';
export type { GaiaStone, GaiaState } from './gaia';
import {
  clearMoonIllusions, moonShadePushRuby, updateMoonShade, moonMiteHint, moonSeenWhenHit, createMoonState, updateMoonMimic, isMoonMirror, moonReflect, initializeMoonBoss, isMoonBoss, isMoonObject, moonBossDamageMult, moonQueenJumped, moonShatter, updateMoon,
} from './moon';
import type { MoonState } from './moon';
export type { MoonShard, MoonState } from './moon';

// Chamber indices are 0=ALPHA(TL), 1=BETA(TR), 2=DELTA(BL), 3=GAMMA(BR) — see constants.ts.
// Clockwise strike order: ALPHA(TL) -> BETA(TR) -> GAMMA(BR) -> DELTA(BL).
export const METEOR_CLOCKWISE_ORDER = [0, 1, 3, 2];

export const CONSTELLATIONS = {
  chargeField:{name:'Dorado',description:'Charging a Wave leaves a small field that hurts and slows aliens.',color:'#8ecfdc'},
  deathField:{name:'Serpens',description:'Defeated aliens leave a brief damaging slow field.',color:'#9ebde7'},
  bombStun:{name:'Vulpecula',description:'Bombs briefly stun survivors. Bosses recover faster.',color:'#ffcb93'},
  bulletShield:{name:'Circinus',description:'Eight bullet hits restore a small player shield.',color:'#a5dfcf'},
  wallSlam: {name:'Sculptor',description:'Waves slam aliens into walls for bonus damage.',color:'#e5b48b'},
  rubyDefense: {name:'Columba',description:'Healing Ruby stores a weaker Wave that fires when enemies approach.',color:'#f4a6c6'},
  laserWire: {name:'Reticulum',description:'Laser hits briefly stun aliens.',color:'#9edfff'},
  teleportDecoy: {name:'Pyxis',description:'Teleporting leaves a fragile decoy that draws nearby aliens.',color:'#c6b8ff'},
  wallStep: {name:'Caelum',description:'Speed Boost can cross one piece of cover, ending the boost.',color:'#a2e9ce'},
  bulletBurst: {name:'Ara',description:'Bullet hits trigger a small explosion, with a short cooldown.',color:'#ffbc89'},
  healing: { name: 'Ophiuchus', description: 'Manual healing recharges 50% faster.', color: '#ff9cae' },
  laser: { name: 'Lyra', description: 'Lasers deal 25% more damage.', color: '#7ee8f5' },
  speed: { name: 'Pegasus', description: 'Move 8% faster, including while carrying Ruby.', color: '#89e5c6' },
  energy: { name: 'Aquarius', description: 'Gain 20% more energy from alien kills and blue shards.', color: '#8aafff' },
  bomb: { name: 'Perseus', description: 'Bomb radius grows by one tile. Stay clear of your blast!', color: '#ffb778' },
  bullets: { name: 'Orion', description: 'Bullets deal 25% more damage.', color: '#7ecbff' },
  wave: { name: 'Draco', description: 'Waves deal 25% more damage.', color: '#bba0ff' },
  ruby: { name: 'Cassiopeia', description: 'Ruby takes 15% less damage, including hits to its shields.', color: '#ff8dbb' },
  power: { name: 'Phoenix', description: 'Powered mode lasts one extra second, including Sirius Surge.', color: '#ffd477' },
  laserRate: { name: 'Aquila', description: 'Laser cooldown is 15% shorter.', color: '#8fe7ff' },
  waveReach: { name: 'Cygnus', description: 'Waves reach one tile farther and push one extra tile.', color: '#a0c7ff' },
  bombDamage: { name: 'Scorpius', description: 'Bombs deal 25% more damage. Your own blast hurts more too.', color: '#ffa08c' },
  burstDuration: { name: 'Taurus', description: 'All speed bursts last 25% longer.', color: '#8de6b1' },
  burstRate: { name: 'Vela', description: 'Speed-burst cooldown is 20% shorter.', color: '#a0ead8' },
  waveRate: { name: 'Centaurus', description: 'Wave cooldown is 15% shorter.', color: '#d1b1ff' },
  playerGuard: { name: 'Delphinus', description: 'Take 15% less damage, including hits to your shields.', color: '#ffabbf' },
  manualHealing: { name: 'Libra', description: 'Each manual heal restores 1 extra HP to you and Ruby.', color: '#f6b4df' },
  killHealing: { name: 'Hercules', description: 'Ordinary alien defeats restore 2 extra player HP.', color: '#e5b48b' },
  bombRate: { name: 'Cepheus', description: 'Bomb cooldown is 20% shorter.', color: '#ffc88a' },
  laserRange: { name: 'Crux', description: 'Lasers reach two tiles farther.', color: '#9ce7ef' },
  waveLaser: { name: 'Andromeda', description: 'A fully charged Wave makes your next Laser wider and pierce one wall.', color: '#a9e4ff' },
  twinShot: { name: 'Lepus', description: 'Fire two bullets at different enemies, each dealing 60% damage.', color: '#9ed9ff' },
  ricochet: { name: 'Sagitta', description: 'Lasers reflect off a wall once with reduced damage.', color: '#91eff0' },
  waveEcho: { name: 'Eridanus', description: 'Charge Wave leaves a weaker delayed wave.', color: '#bbadff' },
  bombPull: { name: 'Fornax', description: 'Bombs pull nearby aliens just before exploding.', color: '#f5b28b' },
  boostTrail: { name: 'Lacerta', description: 'Speed Boost leaves a short enemy-slowing trail.', color: '#9fe8bd' },
  rubyWave: { name: 'Corona', description: 'Placed Ruby emits a smaller, weaker Charge Wave with you.', color: '#ffabc9' },
  bulletMark: { name: 'Lupus', description: 'Three bullet hits mark a target. Charge Wave detonates the mark.', color: '#d7afff' },
  boostCharge: { name: 'Puppis', description: 'Speed Boost makes your next Charge Wave charge faster.', color: '#9ae6de' },
  rubyLaser: { name: 'Pictor', description: 'Fire Laser near placed Ruby to make it fire a weaker copy.', color: '#ffaec1' },
  laserPull: { name: 'Triangulum', description: 'Lasers pull nearby hit aliens together.', color: '#c9b6ff' },
  meteorHeal: { name: 'Crater', description: 'Meteors leave their room healing you and Ruby.', color: '#a8e77b' },
  heavyShot: { name: 'Monoceros', description: 'Heavy shots come every 8th bullet.', color: '#ffe9a0' },
  bombSafe: { name: 'Scutum', description: 'Your bombs no longer hurt you.', color: '#ffb38a' },
  steady: { name: 'Ursa Major', description: 'Knockbacks and pushes move you half as far.', color: '#c9b08a' },
  laserChain: { name: 'Hydra', description: 'Hitting more enemies makes your next Laser stronger.', color: '#8fe0d0' },
} as const;
export type Constellation = keyof typeof CONSTELLATIONS;
export const CONSTELLATION_INTERVAL = 3;
export const ASCENSION_START_CONSTELLATIONS = 3; // picks offered one after another when Ascension mode starts

export function constellationBonus(state: GameState, kind: Constellation): number {
  return state.constellations.includes(kind) ? 1 : 0;
}

export function getBombRadius(state: GameState, powered: boolean): number {
  return (powered ? BOMB_RADIUS_PWR : BOMB_RADIUS) + constellationBonus(state, 'bomb');
}

// Extra health applies only to new regular aliens, including Splitter children.
export const LATE_ALIEN_HP_FROM = 18;        // milestone bonus tops out here (+24%)...
export const LATE_ALIEN_HP_PER_STAGE = 0.02; // ...then every further boss defeat adds 2%, without a cap
export const DEEP_ALIEN_HP_FROM = 30, DEEP_ALIEN_HP_PER_STAGE = 0.01; // from stage 30, every further stage adds another 1% on top

// Saturn Guard and Neptune's Tide amounts grow with the stage only up to SKILL_SCALE_STAGE_CAP.
export const SKILL_SCALE_STAGE_CAP = 18;
export function skillStage(state: GameState) { return Math.min(state.bossesKilled, SKILL_SCALE_STAGE_CAP); }
// Neptune's Tide heal / Saturn Guard shield: +1 per stage to the cap, then scaled with late enemy damage so they cover
// the same number of hits as enemies hit harder, never above the player's max HP.
export function sustainSkillAmount(state: GameState, base: number) {
  return Math.min(PLAYER_MAX_HP, (base + SPECIAL_SUSTAIN_PER_STAGE * skillStage(state)) * (state.trial ? 1 : lateEnemyDamageMult(state.bossesKilled)));
}
// Skill damage to regular aliens (Solar, Jupiter, Singularity, Gaia's Roots, Amethyst decoys, comets) grows by exactly
// the same factors as their HP at every stage, so skills keep the same effect on aliens all run.
export function skillAlienScale(state: GameState): number {
  return DIFFICULTY_TIERS[state.difficultyLevel].hpMult * alienHPMultAt(state.bossesKilled);
}

export function constellationAlienHPMult(state: GameState): number { return alienHPMultAt(state.bossesKilled); }
function alienHPMultAt(kills: number): number {
  return 1 + Math.min(6, Math.floor(kills / CONSTELLATION_INTERVAL)) * ALIEN_HP_PER_MILESTONE
    + Math.max(0, kills - LATE_ALIEN_HP_FROM) * LATE_ALIEN_HP_PER_STAGE + Math.max(0, kills - DEEP_ALIEN_HP_FROM) * DEEP_ALIEN_HP_PER_STAGE;
}

// force skips the every-third-boss check (used for Ascension's starting picks).
function offerConstellation(state: GameState, force = false) {
  if ((!force && state.bossesKilled % CONSTELLATION_INTERVAL !== 0) || state.gamePhase === 'lost') return;
  if(state.constellationChoices.length){state.queuedConstellationRewards++;return;}
  const pool = (Object.keys(CONSTELLATIONS) as Constellation[]).filter(kind => !state.constellations.includes(kind));
  if (!pool.length) return;
  const choices: Constellation[] = [];
  while (choices.length < 3 && pool.length) choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  state.constellationChoices = choices;
  state.constellationDelayTicks = 60;
}

export const CONSTELLATION_REVEAL_TICKS = 96;

export function chooseConstellation(state: GameState, kind: Constellation): boolean {
  if (state.gamePhase !== 'constellation' || !state.constellationChoices.includes(kind)) return false;
  if (state.godConstellationMode) {
    const index=state.constellations.indexOf(kind);
    if(index>=0)state.constellations.splice(index,1);else state.constellations.push(kind);
    if(kind==='waveLaser'&&index>=0)state.build.waveLaserReady=false;
    if(index>=0){
      if(kind==='rubyDefense')state.build.rubyWaveStored=false;
      if(kind==='wallStep')state.build.wallStepReady=false;
      if(kind==='teleportDecoy'){state.build.decoy=null;state.enemies.forEach(enemy=>enemy.pathTimer=0);}
      if(kind==='wallSlam')state.enemies.forEach(enemy=>enemy.buildWallDamage=undefined);
    }
    return true;
  }
  if (state.constellations.includes(kind)) return false;
  state.constellations.push(kind);
  state.constellationReveal = { kind, ticks: CONSTELLATION_REVEAL_TICKS };
  try {
    const sound = gameAudio('/sounds/constellation-chosen.wav'); sound.volume = .6; sound.play().catch(() => {});
  } catch { }
  state.constellationChoices = [];
  state.playerQueuedDirX = state.playerQueuedDirY = 0;
  state.gamePhase = 'playing';
  // Ascension's starting picks follow one another until none remain.
  if (state.pendingConstellations > 0 && --state.pendingConstellations > 0) offerConstellation(state, true);
  else if(state.queuedConstellationRewards>0){state.queuedConstellationRewards--;offerConstellation(state,true);}
  return true;
}

export function openGodConstellations(state: GameState): boolean {
  if(state.gamePhase!=='playing'||state.constellationChoices.length)return false;
  state.godConstellationMode=true;state.constellationChoices=Object.keys(CONSTELLATIONS) as Constellation[];
  state.gamePhase='constellation';state.playerQueuedDirX=state.playerQueuedDirY=0;
  try { const sound=gameAudio('/sounds/constellation-choice.wav');sound.volume=.6;sound.play().catch(()=>{}); } catch {}
  return true;
}

export function closeGodConstellations(state: GameState): boolean {
  if(state.gamePhase!=='constellation'||!state.godConstellationMode)return false;
  state.godConstellationMode=false;state.constellationChoices=[];state.gamePhase='playing';return true;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrayerAbilities {
  rubyCooldown: number;
  rubyCastTicks: number;
  rubyDestination: number;
  rubyOriginX: number;
  rubyOriginY: number;
  escapeCooldown: number;
  escapeWindupTicks: number;
  escapeBoostTicks: number;
  fleeing?: boolean;
}

export interface KingAbilities {
  untouchedTicks: number;
  arenaWindupTicks: number;
}

export interface ThornAbilities {
  cooldown: number; defenseCooldown: number; windupTicks: number; aimX: number; aimY: number; fleeing: boolean;
  aim2?: { x: number; y: number } | null; // Gaia phase 3: the second field of a twin cast
}
export interface ThornPatch { x: number; y: number; ticks: number; ownerId: number; radius?: number; clearedTiles?: number[]; }
export interface EncounterEffect {
  kind: 'reflect' | 'shield-break' | 'shield-form' | 'construct-break' | 'totem-overload' | 'sentinel-hit' | 'sentinel-death' | 'melee' | 'shot' | 'transfer' | 'fall' | 'revive';
  x: number; y: number; toX: number; toY: number; ticks: number; maxTicks: number; ownerId: number; targetId?: number; color: string;
}

export interface SeaChanterAbilities {
  mode: 'hunting' | 'diving';
  diveElapsedTicks: number;
  diveFleeing: boolean;
  healingBlockedUntilTick: number;
  songCooldown: number;
  songWindupTicks: number;
  songAimX: number;
  songAimY: number;
  supportPulseTicks: number;
  allyHealCooldown: number;
  healPulseTicks: number;
  healSoundCooldown: number;
  resurfaceTicks: number;
  resurfaceX: number; resurfaceY: number;
  neptune?: boolean; // the Neptune challenge drives her dives instead of the HP thresholds below
}

export interface SeaSongWave {
  x: number; y: number;
  dx: number; dy: number;
  rangeLeft: number;
  aimX: number; aimY: number;
  hitPlayer: boolean;
  hitDecoy?: boolean;
  hitRuby?: boolean;
  ownerId: number;
}

export interface PrayerWave {
  x: number;
  y: number;
  radius: number;
  ticks: number;
}

export interface Enemy {
  encounterId?: number;
  blessingReaperStacks?:number; blessingReaperUntil?:number;
  sapphireWeakenUntil?:number;
  buildMarks?: number; buildMarkUntil?: number; buildRootHits?: number; buildRootUntil?: number; buildSlowUntil?: number; buildSlow?: number;
  mimic?: { disguised: boolean; timer: number; seek?: [number, number]; wander?: [number, number] }; // Moon mimic: posing yet, ticks before it goes to pose, its spot and wander goal
  shade?: { home: number; wander?: [number, number] }; // Moon shade: the chamber it stays in and its idle wander goal
  id: number;
  type: EnemyType;
  stormSlowUntilTick?: number;
  clamSlowUntil?:number;
  voltSlowTicks?: number;
  voltPreviousX?: number; voltPreviousY?: number;
  extinguished?: boolean; // Sun Emberling: quenched permanently, harmless and stationary
  sapStation?: number;    // Sun Scorch Sapper: id of the station it is draining right now
  x: number;   // pixel center
  y: number;
  tileX: number;
  tileY: number;
  targetTileX: number;
  targetTileY: number;
  stepProgress: number; // 0..TILE_SIZE pixels into current step
  hp: number;
  maxHp: number;
  path: [number, number][];
  neptuneTauntTicks?: number; neptuneCloneMode?: 'roam' | 'flee' | 'taunt';
  neptuneFleeBurstTicks?: number; neptuneFleeBurstCooldown?: number;
  pathTimer: number;   // ticks until next BFS recalc
  attackTimer: number; // ticks until next attack
  targeting: 'player' | 'ruby';
  // push state (from charge wave)
  buildWallDamage?: number; buildStopUntil?: number; reticulumReadyAt?: number; slamStun?: number; surgeShoved?: number; magnetMoved?: number; // magnetMoved: ticks a Binary magnetic move (field pulse or swap shove) can still cause a collision; // surgeShoved: ticks a Binary surge shove can still cause a collision; slamStun: ticks stunned when a wall slam lands (Binary Star surge)
  pushDirX: number;
  pushDirY: number;
  pushTiles: number; // remaining push tiles
  haloStunTicks?: number; // Sacred Halo: stun queued until knockback finishes or hits a wall
  flashTicks: number; // hit flash
  healFlashTicks: number; // pink heal-aura ticks (healer's pulse landed on this enemy)
  shootTicks: number; // ticks remaining for attack-laser visual
  // bomber specific
  exploding: boolean;
  explodeTick: number;
  // sniper specific
  windupTicks: number; // >0 = telegraphing before firing (charger: stun ticks)
  // charger specific
  chargeDirX: number; // locked charge direction; 0 = not charging
  faceX?: number; faceY?: number; turnTimer?: number; mirrorDownUntil?: number; mirrorDown?: boolean; // Reflector: mirrored front, turn delay, knocked-down mirror
  blinkOnDeath?: boolean; // a player/skill kill triggers the Blinker warp, environmental deaths do not
  boneLunge?: { phase: 'warning'|'dash'|'recover'; dx: number; dy: number; ticks: number; left: number };
  hook?: { phase: 'warning'|'flying'|'retract'|'pull'; dx: number; dy: number; x: number; y: number; ticks: number; travel: number };
  dropAttack?: { tileX: number; tileY: number; ticks: number }; // Dropper's locked 2x2 warning, anchored at its top-left tile
  dropImpact?: { tileX: number; tileY: number; until: number }; // cosmetic impact, on the gameplay clock
  mineTimer?: number; // Trapper: ticks until its next mine
  disguiseOf?: number; impostorExpired?: boolean; disguiseIn?: number; // disguiseIn: ticks left before the Impostor takes on a boss's look // Impostor: the boss it copies; removed quietly when no boss is left
  enchantedUntil?: number; // Enchanter buff: faster and harder-hitting until this gameTick
  enchantPulseTicks?: number; // Enchanter: pulse ring animation (its own timer, so the body does not squash)
  lanceDirX?: number; lanceDirY?: number; // Lancer: locked aim (unit vector in tiles) while charging
  chargeDirY: number;
  chargeWindupTicks?: number; // locked warning before a Charger rush (or Lodestone snap); windupTicks remains its recovery
  snapCooldown?: number; snapRecover?: number; // Lodestone Magnet Snap: ticks until the next snap, and rest after one
  chargeTilesLeft?: number;
  // Leech: only energy actually removed from the player is stored/refunded.
  stolenEnergy?: number;
  // shielder specific
  shieldTargetId: number; // ID of ally being shielded; -1 = none
  // splitter_queen specific — countdown to her next phase-jump; unused for queen_echo (echoes are permanent)
  phaseTimer: number;
  // frost_warden specific — remaining absorb capacity of an icy shield she granted this
  // ally; damageEnemy drains this before touching real hp. 0 = no shield.
  relicKind?: 'urn' | 'sun' | 'eye'; // Venus: which sand relic this is
  burrow?: 'under' | 'rising' | 'up' | 'sinking'; burrowTicks?: number; // Venus Dune Worm: underground (unhittable) until it bursts up
  coreSealed?: boolean; // Venus phase 3: his core is sealed while totems are left (drawing)
  venusOrder?: number; // Venus challenge: this totem's place in the shield sequence (0-based)
  siriusAct?: { ticks: number; tx: number; ty: number; dx: number; dy: number; fromX: number; fromY: number; dashing: boolean; hit?: boolean; hitRuby?: boolean; tiles?: [number, number][] }; // Sirius alien attack in progress
  frostAct?: { kind: 'pounce' | 'slam'; ticks: number; tx: number; ty: number; fromX: number; fromY: number; leaping?: boolean }; // Saturn alien attack in progress
  icyShieldHP: number;
  prayer?: PrayerAbilities;
  king?: KingAbilities;
  sea?: SeaChanterAbilities;
  thorn?: ThornAbilities;
  aegis?: { shielded: boolean; exposedUntilTick: number; constructsLeft: number; openAmount?: number; reflectTicks?: number; brokenOnce?: boolean; reshieldTicks?: number };
  constructOwnerId?: number;
  totem?: { ageTicks: number; overloadTicks: number };
  visualSpawnTicks?: number;
  toxin?: { ticks: number; stacks: number };
  goldenSoul?: boolean; // Singularity: a Golden Soul (a lost_soul that fills a body to full stacks)
  gasTrail?: { tx: number; ty: number; tick: number };
  mawBurn?: number; // Singularity: ticks a Soulless has stayed on a Maw's centre since its last hit there // Singularity: where and when a Contaminated Soulless last left a gas puff
  singularityPull?: { started: boolean; dx?: number; dy?: number; speed?: number }; // environmental gravity overrides ordinary knockback immunity
  sapSoundAt?: number;
  spit?: { dx:number; dy:number; ticks:number }; // Flare Spitter: locked fan warning
  doused?: boolean; // Sun Flare Spitter: water has stripped its flame armor (for good)
  devourer?: { generation: number; newbornTicks?: number; splitTicks?: number; originMaxHp?: number; challenge?: boolean; consumed?: boolean; gorgeTicks?: number; stunTicks?: number; jumpTicks?: number; aggroTicks?: number; mealSpeedTicks?: number; merging?: boolean; landTicks?: number; roamTo?: [number, number] }; // stunTicks: Singularity, after a hook slam // gorgeTicks: Singularity fuse before a full body bursts // generation, newborn sprint, self-split timer, original's spawn HP
  pole?: 'north' | 'south'; // Binary Star Lodestone: its magnetic pole
  twin?: { pairId: number; index: number; downedTicks: number; partnerDownTicks: number; transferTicks: number; transferGiveTicks?: number; transferGetTicks?: number; shotAimX?: number; shotAimY?: number; shotTargetX?: number; shotTargetY?: number; strikeAngle?: number; fallTicks?: number; reviveTicks?: number; hasteTicks?: number; revives?: number; revivePhase?: number }; // revives: Binary Star revivals this phase (revivePhase)
}

export interface Bomb {
  detonateTicks?: number;
  tileX: number;
  tileY: number;
  powered: boolean;
}

export interface Resource {
  tileX: number;
  tileY: number;
  type: 'health' | 'energy' | 'shield';
}

export interface LaserBeam {
  opal?:boolean;
  solar?:boolean;
  buildDamage?: number;
  width?: number;
  fromX: number; fromY: number;
  dirX: number; dirY: number;
  endX: number; endY: number;
  ticks: number;
  powered?: boolean;
  color?: string; // undefined = player cyan; set for enemy beams
}

export interface WaveEffect {
  opal?:boolean;
  solar?:boolean;
  cx: number; cy: number;
  radius: number;
  maxRadius: number;
  ticks: number;
  powered?: boolean;
  echo?: boolean; // Binary Star: repeated by the past-self echo
}

export interface BombBlast {
  opal?:boolean;
  powered?:boolean;
  cx: number; cy: number;
  radius: number;
  maxRadius: number;
  ticks: number;
  water?: boolean; // Neptune's water ball: drawn as a water burst instead of a bomb blast
  trap?: boolean; // hostile crimson blast shared by Trapper mines and Bomber explosions
  echo?: boolean; // Binary Star: the past-self echo's bomb
}

export interface LaserBullet {
  solar?:boolean; blessingCopy?:boolean; plainCopy?:boolean; // plainCopy: a Ruby copy drawn in normal colours (Reflector reward)
  blessingDecoy?:boolean; blessingDamage?:number;
  avoidEnemyId?: number; // Lepus splits a volley between distinct targets when possible.
  heavy?: boolean; // every 20th player shot: double damage and a push on hit
  damageScale?: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  powered: boolean;
  ticks: number;
  mirror?: boolean; // fired by the Binary Star twin at reduced damage
}

export interface LightningArc {
  fromX: number; fromY: number;
  toX: number; toY: number;
  ticks: number;
}

// Storm Reaper's melee strike — a crescent electric slash, not a laser beam (she's melee-only).
export interface SlashEffect {
  x: number; y: number;
  angle: number; // facing direction of the swipe
  ticks: number;
  maxTicks: number;
}

export interface DeathParticle {
  x: number; y: number;
  vx: number; vy: number;
  ticks: number;
  maxTicks: number;
  size: number;
  color: string;
}

export interface SapphireHitEffect {
  enemyId: number;
  x: number;
  y: number;
  untilTick: number;
}

export type GamePhase = 'playing' | 'teleporting' | 'laserTarget' | 'constellation' | 'blessing' | 'skillChoice' | 'loadout' | 'won' | 'lost'; // loadout: Star Gambit weapon picker

export interface RewardEffect {
  target: 'player' | 'ruby';
  kind: 'heal' | 'energy' | 'shield' | 'speed' | 'electric' | 'stun' | 'restore';
  ticks: number;
}

export interface GameState {
  gemstoneReward?: BossType;
  mode: RubyStarMode;
  build: RunBuildState;
  queuedConstellationRewards: number;
  bossOverlapTicks: number;
  tutorial: TutorialState | null;
  trial: { boss: BossType; skill: SpecialSkill; cooldown: number; mapOnly?: boolean; siriusLight?: boolean; siriusLightBlend?: number; devourer?: SingularityTrial } | null; // Sirius lighting is cosmetic; cooldown counts down after a cast
  neptune: NeptuneState | null;
  gaia: GaiaState | null;
  moon: MoonState | null;
  sun: SunState | null;
  jupiter: JupiterState | null;
  saturn: SaturnState | null;
  gambit?: GambitState | null; // Star Gambit: weapon slots and their effects
  binary: BinaryState | null; // Binary Star challenge: twin lives, opposite-room jumps and the past-self echo
  sirius: SiriusState | null; // Sirius challenge: light/dark control swaps, traced runes and the Ruby guess
  venus: VenusState | null; // Venus challenge: the buried totem sequence, his leap and lance, and Sand Swirl
  ambientEvents: AmbientEventState;
  map: number[][];
  gameTick: number;
  gamePhase: GamePhase;
  score: number;           // time survived in seconds (fractional)
  killScore: number;
  difficultyLevel: number;
  difficultyTimer: number;

  // Player
  playerX: number;
  playerY: number;
  playerTileX: number;
  playerTileY: number;
  playerTargetX: number;
  playerTargetY: number;
  playerDirX: number;
  playerDirY: number;
  playerQueuedDirX: number;
  playerQueuedDirY: number;
  playerStepProgress: number;
  playerKnockback: { dirX: number; dirY: number; started: boolean; tilesLeft?: number; shaken?: boolean; carryChecked?: boolean; hookOwnerId?: number; speedMult?: number } | null; // one tile unless tilesLeft says more
  carryPushRemainder?: number; // half-tile carried between pushes while carrying Ruby
  craterField?: { chamber: number; ticks: number } | null; // Crater: the meteor-struck room heals the player for a while
  rubyStolenBy?: number; // id of the Snatcher carrying Ruby away; Ruby's tile follows it
  empoweredUntil?: number; // Enchanter kill: player attacks deal more damage until this gameTick
  regenUntil?: number; // Bleeder kill: player regenerates until this gameTick
  bleedingUntil?: number; // Bleeder curse: no player healing and a draining shield until this gameTick
  playerStunned?: boolean; // the current freeze lock is a comet stun, not ice
  carryBoostDrain?: number; // fractional extra speed-boost ticks drained while carrying Ruby
  playerHP: number;
  playerShieldHP: number; // Armored kill reward — absorbs damage before player HP
  playerSaturnShield: boolean;
  runnerEnergyFlashTicks: number; // orange energy reward burst after a Charger kill (field name predates the swap)
  playerCarryingRuby: boolean;
  playerFrozenTicks: number; // Frost Warden ice-tile freeze — fully immobilized while > 0
  playerChilledPrev: boolean; // whether player was in a Frost Warden's chamber last tick — edge-triggers the enter-field SFX

  // Ruby
  rubyHP: number;
  rubyShieldHP: number; // Shielder kill reward — absorbs damage before core HP
  rubySaturnShield: boolean;
  rubyTileX: number;  // -1 when carried
  rubyTileY: number;
  rubyPlacedFlashTicks: number; // brief feedback after teleport auto-places a carried Ruby

  // Abilities
  laserCooldown: number;
  waveCooldown: number;
  speedCooldown: number;
  chargeCount: number;
  chargeDecayTimer: number; // ticks since last charge press
  speedActiveTicks: number; // remaining ticks of speed boost
  stormHasteTicks?: number; // Jupiter Storm: remaining ticks of its +30% speed
  speedFlashTicks: number; // burst glow ticks on initial cast
  playerCastTicks: number; // cosmetic cast pose; never blocks movement or attacks
  playerPrimalCast?: boolean; // body pose only; celestial/bomb casts retain their outer accents
  specialLockTicks: number; // endless: brief lockout after a celestial cast
  playerCastKind: SpecialSkill | 'bomb' | null;
  bomb: Bomb | null;
  bombCooldown: number;
  bulletCooldown: number;

  // Star energy
  starEnergy: number;
  stellarPowerBonusTicks: number;
  poweredTicks: number; // >0 when abilities are powered (e.g. 1.5s duration)

  // Enemies
  enemies: Enemy[];
  enemyIdCounter: number;
  spawnTimer: number;
  nextEnemyId: number;

  // Resources on map
  resources: Resource[];
  resourceTimer: number;

  // Meteorite
  meteoriteImpact: { chamber: number; ticks: number } | null;
  /** Endless comet: countdown to the next one, its marked 3x3 target (centre tile) and the brief impact effect. */
  comet?: { timer: number; target: { x: number; y: number; ticks: number } | null; impact: { x: number; y: number; ticks: number } | null };
  meteoriteTimer: number;   // countdown to next strike
  meteoriteWarning: number; // -1 = no warning; 0-3 = chamber index
  meteoriteStrikeIn: number; // ticks remaining in warning phase
  meteoriteChamberSeq: number; // index into the clockwise strike order (ALPHA->BETA->GAMMA->DELTA)

  // Storm Reaper hallway seal
  hallwaySeal: number;         // -1 = none; 0-3 = sealed hallway index (walled off)
  hallwaySealTicks: number;    // ticks remaining until the seal lifts
  hallwaySealCooldown: number; // ticks before the Reaper can seal another hallway

  // Frost Warden ice tiles — hazard tiles in whichever chamber she currently occupies
  frostIceTiles: [number, number][];

  // FX
  laserBeams: LaserBeam[];
  laserBullets: LaserBullet[];
  waveEffects: WaveEffect[];
  bombBlasts: BombBlast[];
  lightningArcs: LightningArc[];
  slashEffects: SlashEffect[];
  deathParticles: DeathParticle[];
  enemyShots?: { x: number; y: number; dx: number; dy: number; ownerId: number; ticks: number; mirror?: boolean; flare?: boolean; spore?: boolean }[]; // Shooter orbs and Reflector bounces (mirror), in pixels
  mines?: { tileX: number; tileY: number; ownerId: number; ticks: number; fuse?: number }[]; // Trapper mines
  rubyCopyUntil?: number; // Reflector kill reward: Ruby copies your attacks
  ccImmuneUntil?: number; // Grappler kill: immunity to forced movement and disabling effects
  jammerWasActive?: boolean; // entry cue only on an outside-to-inside transition
  jammerWaveReady?: boolean; // next completed pad teleport releases a larger free Wave
  heavyImpactUntil?: number; // Dropper kill reward: larger, stronger Waves, extra push and faster recharge
  explosiveBulletsUntil?: number; // Trapper kill reward: bullets explode on hit
  bulletStunUntil?: number; // Shooter kill reward: bullets hit harder and briefly stop enemies until this gameTick
  sapphireHitEffects: SapphireHitEffect[];
  rewardEffects: RewardEffect[];
  prayerWaves: PrayerWave[];
  thornPatches: ThornPatch[];
  encounterEffects: EncounterEffect[];
  thornPoisonTicks: number;
  thornPoisonTimer: number;
  thornWasInside: boolean;
  thornContactTimer: number;
  seaSongWaves: SeaSongWave[];
  seaSongBursts: { x: number; y: number; ticks: number; ownerId: number }[];
  kingArenaPulseTicks: number;

  // Teleport
  playerChamber: number;   // -1 if in hallway
  spookFace?: { until: number; id: number }; // one brief death-face overlay; successive deaths replace it
  blinkerWarp?: { fromX: number; fromY: number; x: number; y: number; until: number };
  teleportDestOptions: number[]; // which chambers can be jumped to
  teleportCooldown: number; // ticks after arrival before another teleport

  singularity: { x: number; y: number; ticks: number; maxTicks: number; pullTimer: number; damageTimer: number } | null;
  celestialField: { x: number; y: number; ticks: number; damageTimer: number } | null;
  lunarDecoy: { x: number; y: number; tileX: number; tileY: number; hitsLeft: number; maxHits: number; flashTicks: number; invulnerableTicks: number } | null;
  enemyDecoyActive: boolean;
  ascensionBannerTicks: number;
  // NEW ALIEN callout (desktop only): shown once ever per late alien type, using the profile's encountered list
  alienIntro?: { type: EnemyType; ticks: number } | null; alienIntroQueue?: EnemyType[]; introducedAliens?: string[];
  specialSkill: SpecialSkill | null;
  specialEffects: { kind: SpecialSkill; x: number; y: number; ticks: number }[];
  venusVeilTicks: number;
  mirrorTwinTicks: number;
  venusReflects: { fromX: number; fromY: number; toX: number; toY: number; ticks: number }[];

  // Screen shake
  screenShakeTicks: number;
  screenShakeAmt: number;

  // Ruby Core healing
  rubyHealCooldown: number;

  // God mode
  godMode: boolean; // Invincible: ignores damage
  immortal: boolean; // HP damage applies, but player and Ruby stay at 1+ HP
  noFreeze?: boolean; // debug: ignore ice freezes; optional for older saves
  noMeteors?: boolean; // debug: suppress meteor warnings and strikes; optional for older saves
  noBossSpawns: boolean;
  noMobs: boolean; // debug: suppress regular enemies while retaining boss-created echoes

  // Sniper kill buff — electric chain on player attacks
  electricBuffTicks: number;
  laserStunTicks?: number; // Lancer reward: laser hits briefly stun enemies while > 0
  laserMomentum?: number; // Hydra: distinct enemies the last Laser cast hit
  bulletShotCount?: number; // player bullet shots this run; every BULLET_HEAVY_EVERY-th is heavy

  // Boss spawn system
  bossTimer: number;        // countdown to next boss spawn
  bossWarningTicks: number; // >0 while boss is about to spawn (shows warning)
  bossSpawnName: string;
  bossSpawnColor: string;
  bossSpawnTicks: number;   // remaining ticks of the post-spawn name banner
  constellations: Constellation[];
  constellationChoices: Constellation[];
  constellationDelayTicks: number;
  pendingConstellations: number; // starting picks still owed (Ascension mode)
  godConstellationMode: boolean;
  constellationReveal: { kind: Constellation; ticks: number } | null;
  bossesKilled: number;     // tracks how many bosses have been killed (each +15 HP)
  bossPool: BossType[];     // natural spawns draw every boss once before reshuffling
  bossPoolBlock: number;    // which block of ten bosses (stages 1–10, 11–20, ...) the pool belongs to
  lastNaturalBoss: BossType | null;

  healJiggleTicks: number;  // >0 while player jiggle animation plays after heal
}

// ─── BFS ─────────────────────────────────────────────────────────────────────

export function bfs(
  map: number[][],
  fx: number, fy: number,
  tx: number, ty: number,
  avoid?: (x: number, y: number) => boolean, // optional tiles to route around
  closest = false, // when the target cannot be reached, path to the reachable tile nearest it instead
): [number, number][] {
  if (fx === tx && fy === ty) return [];
  const DIRS = [[1,0],[-1,0],[0,1],[0,-1]];
  const key = (x: number, y: number) => y * MAP_COLS + x;
  const visited = new Set<number>();
  const prev = new Map<number, number>();
  const q: [number, number][] = [[fx, fy]];
  visited.add(key(fx, fy));

  const trace = (end: number) => {
    const path: [number, number][] = [];
    let k = end;
    while (prev.has(k)) {
      path.unshift([k % MAP_COLS, Math.floor(k / MAP_COLS)]);
      k = prev.get(k)!;
    }
    return path;
  };
  let nearest = key(fx, fy), nearestDist = Math.hypot(fx - tx, fy - ty);
  while (q.length) {
    const [cx, cy] = q.shift()!;
    if (cx === tx && cy === ty) return trace(key(cx, cy));
    const d = Math.hypot(cx - tx, cy - ty); if (d < nearestDist) { nearestDist = d; nearest = key(cx, cy); }
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) continue;
      if (map[ny][nx] === T_WALL) continue;
      if (avoid && avoid(nx, ny)) continue;
      const nk = key(nx, ny);
      if (visited.has(nk)) continue;
      visited.add(nk);
      prev.set(nk, key(cx, cy));
      q.push([nx, ny]);
    }
  }
  return closest ? trace(nearest) : [];
}

// ─── Audio helpers ───────────────────────────────────────────────────────────

// Shared trim for player and enemy attack sounds, preserving their relative mix.
export const ATTACK_SFX_VOLUME = 0.765;

function playTone(freq: number, dur: number, vol = 0.16, type: OscillatorType = 'square') {
  try {
    if(channelVolume('effects')===0)return;
    vol*=channelVolume('effects');
    const ctx = getAudioCtx(); if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  } catch { }
}

const CELESTIAL_AUDIO: Record<SpecialSkill | 'ready' | 'empty' | 'pickup' | 'solar_swoosh' | 'jupiter_shot' | 'neptune_electric' | 'binary_reach', { file: string; gain: number }> = {
  binary_reach:{file:'gaia-reach.mp3',gain:.45},
  neptune_electric:{file:'neptune-electric.wav',gain:.6},
  jupiter_shot:{file:'jupiter-shot.wav',gain:.75},
  solar_swoosh:{file:'solar-flare-swoosh.wav',gain:.8},
  fiery_king:{file:'solar-flare.wav',gain:.75}, storm_reaper:{file:'jupiter-storm.wav',gain:.8},
  splitter_queen:{file:'lunar-echo.wav',gain:1.1}, devourer:{file:'singularity.wav',gain:.8},
  frost_warden:{file:'saturn-guard.wav',gain:.85},sea_chanter:{file:'neptune-tide.wav',gain:.9},
  blind_prayer:{file:'sirius-surge.wav',gain:1.3},aegis_sentinel:{file:'venus-veil.wav',gain:.8},astral_twins:{file:'binary-star.mp3',gain:.8},thorn_weaver:{file:'gaia-reach.wav',gain:.45},
  ready:{file:'skill-ready.wav',gain:.5},empty:{file:'empty-charge.wav',gain:.22},pickup:{file:'energy-pickup.wav',gain:.4},
};
export function playCelestialSound(cue: keyof typeof CELESTIAL_AUDIO, multiplier = 1) {
  const clip = CELESTIAL_AUDIO[cue];
  playAudioOneShot('/sounds/celestial/' + clip.file, clip.gain * ATTACK_SFX_VOLUME * multiplier);
}

export function playAudioOneShot(file: string, level: number, pitch = 1) {
  try {
    const sound = gameAudio(file); sound.volume = Math.min(1, level); sound.loop = false;
    if(pitch!==1){sound.playbackRate=pitch;sound.preservesPitch=false;}
    let cleanup = () => {};
    if (level > 1) {
      const ctx = getAudioCtx();
      if (ctx) {
        const source = ctx.createMediaElementSource(sound), boost = ctx.createGain();
        boost.gain.value = level; source.connect(boost); boost.connect(ctx.destination);
        cleanup = () => { source.disconnect(); boost.disconnect(); sound.onended = null; sound.onerror = null; };
        sound.onended = cleanup; sound.onerror = cleanup;
      }
    }
    sound.play().catch(() => cleanup());
  } catch { }
}

let singularityVoice: HTMLAudioElement | null = null;
export function stopSingularitySound() {
  if (!singularityVoice) return;
  singularityVoice.pause(); singularityVoice.currentTime = 0; singularityVoice = null;
}
function updateSingularitySound(state: GameState) {
  if (!state.singularity || state.gamePhase !== 'playing' || (typeof document !== 'undefined' && document.hidden)) {
    stopSingularitySound(); return;
  }
  if (singularityVoice) return;
  try {
    const clip = CELESTIAL_AUDIO.devourer;
    const voice = gameAudio('/sounds/celestial/' + clip.file);
    voice.volume = clip.gain * ATTACK_SFX_VOLUME; voice.loop = true;
    singularityVoice = voice;
    voice.play().catch(() => { if (singularityVoice === voice) stopSingularitySound(); });
  } catch { stopSingularitySound(); }
}

// Non-boss alien attack sounds are levelled to about -21 dB (loudest 50ms RMS after volume); see AUDIO.md.
export const ALIEN_ATTACK_SFX = {
  shot: 1.86,          // alienShootLaser.wav multiplier: melee hits, Charger rush, Shooter fire
  laser: 1.14,         // laserBeam.mp3 multiplier: Sniper shot, Lancer beam
  lancerCharge: .556,  // charging.wav level
  chargerLock: .174,   // place_bomb.wav level
  chargerImpact: .195, // hitHurt.wav level
  bomber: .248,        // bombExplode.wav level
} as const;

export function playSFX_laser(volumeMultiplier = 1) {
  try {
    const a = gameAudio('/sounds/laserBeam.mp3', 'attack'); a.volume = 0.3045 * ATTACK_SFX_VOLUME * volumeMultiplier; a.play().catch(() => {});
  } catch { }
}

export function playSFX_laserBullet(pitch = 1, volumeMultiplier = 1) {
  try {
    const a = gameAudio('/sounds/laserBullet.mp3', 'attack'); a.volume = 0.2541 * ATTACK_SFX_VOLUME * volumeMultiplier; a.playbackRate = pitch; if(pitch!==1)a.preservesPitch=false; a.play().catch(() => {});
  } catch { }
}

export function playSFX_wave() {
  try {
    const a = gameAudio('/sounds/chargeWave.mp3', 'attack'); a.volume = 0.768 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
    const a2 = gameAudio('/sounds/chargeWave.mp3', 'attack'); a2.volume = 0.768 * ATTACK_SFX_VOLUME; a2.play().catch(() => {});
  } catch { }
}

export function playSFX_alienHit() {
  try {
    const a = gameAudio('/sounds/alienGetDamaged.wav'); a.volume = 0.1933155; a.play().catch(() => {});
  } catch { }
}

function playSFX_alienDeath() {
  try {
    const a = gameAudio('/sounds/alienDeath.mp3'); a.volume = 0.13; a.play().catch(() => {});
  } catch { }
}

function playSFX_bossDeath() {
  try {
    const a = gameAudio('/sounds/shield.mp3'); a.volume = 0.55; a.play().catch(() => {});
  } catch { }
}

function playSFX_decoyDeath() {
  try {
    const a = gameAudio('/sounds/decoyDeath.mp3'); a.volume = 0.4; a.play().catch(() => {});
  } catch { }
}

export function playSFX_alienShoot(volumeMultiplier = 1, pitch = 1) {
  try {
    const a = gameAudio('/sounds/alienShootLaser.wav', 'attack'); a.volume = 0.2 * ATTACK_SFX_VOLUME * volumeMultiplier;
    a.playbackRate = pitch; if(pitch!==1)a.preservesPitch=false; a.play().catch(() => {});
  } catch { }
}

function playSFX_queenAttack(volumeMult = 1) {
  try {
    const a = gameAudio('/sounds/bossQueenAttack1.mp3', 'attack'); a.volume = 0.765 * ATTACK_SFX_VOLUME * volumeMult; a.play().catch(() => {});
    const b = gameAudio('/sounds/gameModeClick.mp3', 'attack'); b.volume = 0.72 * ATTACK_SFX_VOLUME * volumeMult; b.play().catch(() => {});
  } catch { }
}

function playSFX_bossLaser() {
  try {
    for (let i = 0; i < 3; i++) {
      const a = gameAudio('/sounds/chargeWave.mp3', 'attack'); a.volume = 0.855 * ATTACK_SFX_VOLUME; a.play().catch(() => {});
    }
    const b = gameAudio('/sounds/laserBeam.mp3', 'attack'); b.volume = 0.45 * ATTACK_SFX_VOLUME; b.play().catch(() => {});
  } catch { }
}

export function playSFX_bomb(level = 0.832 * ATTACK_SFX_VOLUME) {
  try {
    const a = gameAudio('/sounds/bombExplode.wav', 'attack'); a.volume = level; a.play().catch(() => {});
  } catch { }
}

export function playSFX_supernova() {
  for (const [file, volume] of [['bombExplode.wav', 1], ['meteorExplode.mp3', .85]] as const) {
    try {
      const sound = gameAudio('/sounds/' + file); sound.volume = volume; sound.play().catch(() => {});
    } catch { }
  }
  playTone(65, .8, .3, 'sawtooth');
}

function announceAscension(state: GameState) {
  state.ascensionBannerTicks = 360;
  if (state.gamePhase === 'lost') return;
  try {
    const sound = gameAudio('/sounds/ascension-unlock.mp3'); sound.volume = .7; sound.play().catch(() => {});
  } catch { }
}

export function playSFX_hit() {
  try {
    const a = gameAudio('/sounds/hitHurt.wav'); a.volume = 0.22; a.play().catch(() => {});
  } catch { }
}

export function playSFX_chargerImpact() {
  try {
    const sound = gameAudio('/sounds/hitHurt.wav');
    sound.volume = ALIEN_ATTACK_SFX.chargerImpact; sound.playbackRate = .7; sound.preservesPitch = false;
    sound.play().catch(() => {});
  } catch { }
  playTone(90, .14, .15, 'triangle');
}

export function playSFX_pickup() { playCelestialSound('pickup'); }

function playSFX_healPickup() {
  try {
    const a = gameAudio('/sounds/grow.wav'); a.volume = 0.32; a.play().catch(() => {});
  } catch { }
}

/** Special-alien sounds (Enchanter, Bleeder, Snatcher, Impostor, Shooter and their kill buffs). */
export function playSFX_special(kind: 'orbHit' | 'orbRuby' | 'bleed' | 'snatch' | 'rubyBack' | 'empower' | 'disguise') {
  switch (kind) {
    case 'orbHit': playAudioOneShot('/sounds/snowball-hit.mp3', .272, 1.1); playAudioOneShot('/sounds/strike-charged.wav', .191, 1.35); break;
    case 'orbRuby': playAudioOneShot('/sounds/snowball-hit.mp3', .4 * ATTACK_SFX_VOLUME, .9); break;
    case 'bleed': playAudioOneShot('/sounds/poisoned.wav', .45, .8); break;
    case 'snatch': playAudioOneShot('/sounds/snatch-whistle.wav', 1); break;
    case 'rubyBack': playAudioOneShot('/sounds/shield.mp3', .5); break;
    case 'empower': playAudioOneShot('/sounds/powerUpBoost.mp3', .4, .85); break;
    case 'disguise': playAudioOneShot('/sounds/deghost.wav', .4, .7); break;
  }
}

export function playSFX_powerUp() {
  try {
    const a = gameAudio('/sounds/powerUpBoost.mp3'); a.volume = 0.38; a.play().catch(() => {});
  } catch { }
}

export function playSFX_speed() {
  try {
    const a = gameAudio('/sounds/speedBoost.mp3'); a.volume = 0.35; a.play().catch(() => {});
  } catch { }
}

let _chargeSound: HTMLAudioElement | null = null;
let _chargeHolding = false;
function getChargeSound(): HTMLAudioElement {
  if (!_chargeSound) {
    _chargeSound = gameAudio('/sounds/charging.wav');
    _chargeSound.preload = 'auto';
    _chargeSound.volume = 0.85 * ATTACK_SFX_VOLUME;
  }
  return _chargeSound;
}

export function startChargeSound(chargeSeconds = 0.8) {
  try {
    if (_chargeHolding) return;
    const sound = getChargeSound();
    // Stretch one play to the charge window instead of looping into its intro.
    const duration = Number.isFinite(sound.duration) && sound.duration > 0 ? sound.duration : 26028 / 44100;
    sound.playbackRate = Math.max(0.25, Math.min(2, duration / Math.max(0.1, chargeSeconds)));
    sound.loop = false;
    sound.currentTime = 0;
    _chargeHolding = true;
    sound.play().catch(() => { _chargeHolding = false; });
  } catch { }
}

export function stopChargeSound() {
  _chargeHolding = false;
  if (!_chargeSound) return;
  _chargeSound.pause();
  _chargeSound.currentTime = 0;
  _chargeSound.loop = false;
}

export function playSFX_charge() {
  try {
    const sound = getChargeSound();
    if (sound.paused) {
      sound.loop = false; sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  } catch { }
}

export function playSFX_enemyAttack(enemy?: Enemy) {
  const file = enemy?.type === 'aegis_sentinel' ? 'aegis-attack.mp3'
    : enemy?.type === 'astral_twins' ? enemy.twin?.index === 1 ? 'dusk-attack.mp3' : 'celestial/jupiter-storm.wav' : null;
  if (!file) { playSFX_alienShoot(enemy && isBossType(enemy.type) ? 1 : ALIEN_ATTACK_SFX.shot); return; }
  if (enemy?.type === 'astral_twins' && enemy.twin?.index === 1) playCelestialSound('neptune_electric', 3.5);
  try {
    const sound = gameAudio('/sounds/' + file);
    sound.volume = (file === 'celestial/jupiter-storm.wav' ? 1.3 : .8) * ATTACK_SFX_VOLUME; sound.loop = false;
    sound.play().catch(() => {});
  } catch { }
}

export function playSFX_twinRevive() {
  try {
    const sound = gameAudio('/sounds/twin-revive.mp3');
    sound.volume = .85 * ATTACK_SFX_VOLUME; sound.loop = false;
    sound.play().catch(() => {});
  } catch { }
}

function playSFX_twinTransfer() { playCelestialSound('ready'); }

export function playSFX_objectBreak(kind: 'frost' | 'totem' | 'aegis') {
  const clips = {
    frost: { file: 'frost-shield-break.mp3', gain: .7 },
    totem: { file: 'totem-break.wav', gain: .85 },
    aegis: { file: 'aegis-shield-break.wav', gain: 3 },
  };
  const clip = clips[kind];
  playAudioOneShot('/sounds/' + clip.file, clip.gain * ATTACK_SFX_VOLUME);
}

export function playSFX_totemExplosion() {
  try {
    const sound = gameAudio('/sounds/totem-explode.mp3');
    sound.volume = .9 * ATTACK_SFX_VOLUME; sound.loop = false;
    sound.play().catch(() => {});
  } catch { }
}

function playSFX_rubyHit() {
  try {
    const a = gameAudio('/sounds/shieldBreak.mp3'); a.volume = 0.42; a.play().catch(() => {});
  } catch { }
}

export function playSFX_rubyToggle() {
  try {
    const a = gameAudio('/sounds/levelup.mp3'); a.volume = 0.38; a.play().catch(() => {});
  } catch { }
}

export function playSFX_teleport() {
  try {
    const sound = gameAudio('/sounds/gameModeClick.mp3');
    sound.volume = 0.64;
    sound.play().catch(() => {});
  } catch { }
}

export function playSFX_queenTeleport() {
  try {
    const a = gameAudio('/sounds/ghostHunt2.mp3'); a.volume = 0.5; a.play().catch(() => {});
  } catch { }
}

export function playSFX_reaperStrike() {
  try {
    const a = gameAudio('/sounds/slash.mp3', 'attack'); a.volume = 1.0 * ATTACK_SFX_VOLUME; a.play().catch(() => {}); // base file is quiet, so retain its higher mix level
    const b = gameAudio('/sounds/laserBullet.mp3', 'attack'); b.volume = 0.6 * ATTACK_SFX_VOLUME; b.play().catch(() => {});
  } catch { }
}

/** Singularity sound cooldowns, so a swarm never stacks the same sound: each kind (bite, eat, boom, swallow, fuse, hit,
 * ready, alien) plays at most once every soundGap ticks (1s). Outside the challenge everything plays. */
export function devourerSoundAllowed(state:GameState|undefined,kind:string) {
  const t=state?.trial?.devourer;if(!t||!state)return true;
  const ticks=t.soundTicks??={},last=ticks[kind];
  if(last!==undefined&&state.gameTick-last<(kind==='eat'?SINGULARITY_CHALLENGE.eatSoundGap:SINGULARITY_CHALLENGE.soundGap))return false;
  ticks[kind]=state.gameTick;return true;
}

function playSFX_devourerBite(state?:GameState) {
  if(!devourerSoundAllowed(state,'bite'))return;
  const multiplier=state?.trial?.devourer ? .4 : 1;
  try {
    const a = gameAudio('/sounds/soundWaveAttack.mp3', 'attack'); a.volume = 0.49 * ATTACK_SFX_VOLUME * multiplier; a.play().catch(() => {});
    const b = gameAudio('/sounds/slash.mp3', 'attack'); b.volume = 0.35 * ATTACK_SFX_VOLUME * multiplier; b.play().catch(() => {});
  } catch { }
}

function playSFX_devourerAbsorb(state?:GameState) {
  if(!devourerSoundAllowed(state,'eat'))return;
  const quiet=state?.trial?.devourer ? .5 : 1; // Quieter swarm meals; the shared eat cooldown limits repeated voices.
  try {
    // The Jaw's monster bite, pitched up for a smaller, quicker chomp.
    const a = gameAudio('/sounds/jaw-bite.wav', 'attack'); a.volume = Math.min(1, 0.9 * ATTACK_SFX_VOLUME * quiet); a.playbackRate = 1.7; a.preservesPitch = false; a.play().catch(() => {});
  } catch { }
}

function playSFX_hallwaySeal() {
  try {
    const a = gameAudio('/sounds/shieldBreak.mp3'); a.volume = 0.6; a.play().catch(() => {});
  } catch { }
}

function playSFX_frostFreeze() {
  try {
    const a = gameAudio('/sounds/freeze.mp3'); a.volume = 1.0; a.play().catch(() => {});
  } catch { }
}

function playSFX_frostFieldEnter() {
  try {
    const a = gameAudio('/sounds/swap.mp3'); a.volume = 0.5; a.play().catch(() => {});
    const b = gameAudio('/sounds/freeze.mp3'); b.volume = 0.5; b.play().catch(() => {});
  } catch { }
}

function playSFX_frostRelocate() {
  try {
    const a = gameAudio('/sounds/ice.mp3'); a.volume = 0.5; a.play().catch(() => {});
    const b = gameAudio('/sounds/slash.mp3'); b.volume = 1.0; b.play().catch(() => {});
  } catch { }
}

// No thaw.mp3 asset exists — reusing thaw.wav here instead, freed up since it moved off
// playSFX_frostRelocate above (kept the two "thaw" sounds from overlapping in meaning).
function playSFX_thaw() {
  try {
    const a = gameAudio('/sounds/thaw.wav'); a.volume = 0.6; a.play().catch(() => {});
  } catch { }
}

export function playSFX_meteorite() {
  try {
    const a = gameAudio('/sounds/meteorExplode.mp3'); a.volume = 0.38; a.play().catch(() => {});
  } catch { }
}

export function playSFX_meteorFalling() {
  try {
    const a = gameAudio('/sounds/meteorFalling.mp3'); a.volume = 0.45; a.play().catch(() => {});
  } catch { }
}

export function playSFX_meteorWarning(urgent: boolean) {
  playTone(urgent ? 1320 : 880, 0.1, 0.1, 'square');
}

// Softer rising chime than the meteor beep, so the shield countdown reads as its own cue.
function playSFX_aegisReshieldWarning(final: boolean) {
  playTone(final ? 990 : 660, 0.18, 0.13, 'triangle');
  setTimeout(() => playTone(final ? 1480 : 990, 0.14, 0.1, 'triangle'), 90);
}

export function playSFX_gameOver() {
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    [220, 185, 155, 110].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.2;
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = f;
      g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.38);
    });
  } catch { }
}

// ─── Initial state ────────────────────────────────────────────────────────────

export interface TutorialState {
  step: number; count: number; pauseTicks: number; retry: boolean;
  lastTile: [number, number]; cooldowns: Record<string, number>; carried: boolean;
}

// Ascension's opening pick: hold any one celestial skill, then play resumes.
export function chooseStartingSkill(state: GameState, kind: SpecialSkill): boolean {
  if (state.gamePhase !== 'skillChoice') return false;
  state.specialSkill = kind;
  state.gamePhase = 'playing';
  playCelestialSound('ready');
  return true;
}

// Game modes picked in the lobby. Endless Space is the standard run; Ascension starts at stage 10
// with celestial skills already unlocked and regular aliens at their hardest tier.
export type RubyStarMode = 'endless' | 'ascension' | 'tutorial' | 'trial' | 'gambit';

export function createModeState(mode: RubyStarMode, trialBoss?: BossType): GameState {
  const state = createInitialState();
  state.mode = mode;
  if (mode === 'ascension') {
    state.bossesKilled = SPECIAL_UNLOCK_KILLS;
    state.difficultyLevel = DIFFICULTY_TIERS.length - 1;
    state.ascensionBannerTicks = 360;
    state.pendingConstellations = ASCENSION_START_CONSTELLATIONS;
    offerConstellation(state, true);
    state.gamePhase = 'skillChoice'; // pick a starting celestial skill first; the Constellation picks follow
  }
  if (mode === 'trial' && trialBoss) {
    // Stage 0 run where the guardian is the only boss; beating it wins. Its celestial skill is always on hand.
    state.trial = { boss: trialBoss, skill: BOSS_SKILL_REWARDS[trialBoss], cooldown: 0 };
    state.specialSkill = state.trial.skill;
    state.bossTimer = TRIAL_BOSS_DELAY;
    if (trialBoss === 'sea_chanter') {
      state.neptune = { phase: 1, bossId: -1, armed: [], dive: null, healCharge: 0, laser: null, laserImpact: null, bombTimer: NEPTUNE_BOMB_INTERVAL,
        fishTimer: 0, poisonTicks: 0, poisonTimer: 0, tides: [], tideTimer: NEPTUNE_TIDE_GAP[0], tidePushTimer: NEPTUNE_TIDE_PUSH_GAP, phaseBannerTicks: 0,
        reveal: null, shark: null, sharkTimer: NEPTUNE_SHARK_GAP[0], jellyTimer: NEPTUNE_JELLY_GAP[0] };
    }
    if (trialBoss === 'thorn_weaver') createGaiaState(state);
    if (trialBoss === 'splitter_queen') createMoonState(state);
    if (trialBoss === 'fiery_king') createSunState(state);
    if (trialBoss === 'storm_reaper') createJupiterState(state);
    if (trialBoss === 'blind_prayer') createSiriusState(state);
    if (trialBoss === 'devourer') state.trial.devourer = { phase: 1, encounterId: -1, defeatedMaxHp: 0 };
    if (trialBoss === 'aegis_sentinel') createVenusState(state); // Venus: the buried totem sequence
    if (trialBoss === 'frost_warden') createSaturnState(state);
    if (trialBoss === 'astral_twins') createBinaryState(state);
  }
  if (mode === 'gambit') {
    // Star Gambit (first step): the Bazaar Ring map as an empty sandbox: no aliens, bosses, meteors or events yet.
    applyChamberLayout('bazaar'); state.map = generateBazaarMap(); state.noMobs = true; state.noBossSpawns = true;
    // Start in the first stall: Ruby on its pad, you just below it.
    [state.rubyTileX, state.rubyTileY] = TELEPORT_PADS[0];
    const [sx, sy] = [TELEPORT_PADS[0][0], TELEPORT_PADS[0][1] + 2];
    Object.assign(state, { playerTileX: sx, playerTileY: sy, playerTargetX: sx, playerTargetY: sy, playerX: (sx + .5) * TILE_SIZE, playerY: (sy + .5) * TILE_SIZE, playerStepProgress: 0 });
    createGambitState(state);
  }
  if (mode === 'tutorial') {
    // A safe sandbox: no natural aliens, bosses, meteors or events; you and Ruby never drop below 1 HP.
    state.noMobs = true; state.noBossSpawns = true; state.immortal = true;
    state.tutorial = { step: 0, count: 0, pauseTicks: 0, retry: false, lastTile: [state.playerTileX, state.playerTileY], cooldowns: {}, carried: false };
  }
  return state;
}

export function createInitialState(): GameState {
  stopSunHeatWarning();stopSunburstWarning();
  stopGaiaFieldSound();
  stopSingularitySound();
  stopPoisonSound();
  stopSeaSounds();
  stopChargeSound();
  applyChamberLayout('standard'); // every mode starts on the four-chamber station; Star Gambit swaps in its Bazaar below
  const map = generateMap();
  const [px, py] = PLAYER_START;
  return {
    mode: 'endless', build: createRunBuildState(), queuedConstellationRewards: 0, bossOverlapTicks: 0, tutorial: null, trial: null, neptune: null, gaia: null, moon: null, sun: null, jupiter: null, saturn: null, binary: null, sirius: null, venus: null,
    map,
    gameTick: 0,
    gamePhase: 'playing',
    ambientEvents: createAmbientEvents(),
    score: 0,
    killScore: 0,
    difficultyLevel: 0,
    difficultyTimer: 0,

    playerX: px * TILE_SIZE + TILE_SIZE / 2,
    playerY: py * TILE_SIZE + TILE_SIZE / 2,
    playerTileX: px,
    playerTileY: py,
    playerTargetX: px,
    playerTargetY: py,
    playerDirX: 1,
    playerDirY: 0,
    playerQueuedDirX: 0,
    playerQueuedDirY: 0,
    playerStepProgress: 0,
    playerKnockback: null,
    playerHP: PLAYER_MAX_HP,
    playerShieldHP: 0,
    playerSaturnShield: false,
    runnerEnergyFlashTicks: 0,
    playerCarryingRuby: false,
    playerFrozenTicks: 0,
    playerChilledPrev: false,

    rubyHP: RUBY_MAX_HP,
    rubyShieldHP: 0,
    rubySaturnShield: false,
    rubyTileX: TELEPORT_PADS[0][0],
    rubyTileY: TELEPORT_PADS[0][1],
    rubyPlacedFlashTicks: 0,

    laserCooldown: 0,
    waveCooldown: 0,
    speedCooldown: 0,
    chargeCount: 0,
    chargeDecayTimer: 0,
    speedActiveTicks: 0,
    speedFlashTicks: 0,
    playerCastTicks: 0,
    specialLockTicks: 0,
    playerCastKind: null,
    bomb: null,
    bombCooldown: 0,
    bulletCooldown: 0,

    starEnergy: 0,
    poweredTicks: 0,
    stellarPowerBonusTicks: 0,

    enemies: [],
    enemyIdCounter: 0,
    spawnTimer: 0,
    nextEnemyId: 0,

    resources: [],
    resourceTimer: 0,

    meteoriteImpact: null,
    comet: { timer: cometGap(), target: null, impact: null },
    meteoriteTimer: METEORITE_CYCLE,
    meteoriteWarning: -1,
    meteoriteStrikeIn: 0,
    meteoriteChamberSeq: 0,

    hallwaySeal: -1,
    hallwaySealTicks: 0,
    hallwaySealCooldown: 0,

    frostIceTiles: [],

    laserBeams: [],
    laserBullets: [],
    waveEffects: [],
    bombBlasts: [],
    lightningArcs: [],
    slashEffects: [],
    deathParticles: [],
    enemyShots: [],
    sapphireHitEffects: [],
    rewardEffects: [],
    prayerWaves: [],
    thornPatches: [], encounterEffects: [], thornPoisonTicks: 0, thornPoisonTimer: 0, thornWasInside: false, thornContactTimer: 0,
    seaSongWaves: [],
    seaSongBursts: [],
    kingArenaPulseTicks: 0,
    specialSkill: null, specialEffects: [], venusVeilTicks: 0, mirrorTwinTicks: 0, venusReflects: [], ascensionBannerTicks: 0, lunarDecoy: null, enemyDecoyActive: false, celestialField: null, singularity: null,

    playerChamber: 0,
    teleportDestOptions: [],
    teleportCooldown: 0,

    screenShakeTicks: 0,
    screenShakeAmt: 0,

    rubyHealCooldown: 0,

    godMode: false,
    immortal: false,
    noFreeze: false,
    noMobs: false, noBossSpawns: false, noMeteors: false,

    electricBuffTicks: 0,
    laserStunTicks: 0,

    bossTimer: BOSS_FIRST_SPAWN_TIMER,
    bossWarningTicks: 0,
    bossSpawnName: '',
    bossSpawnColor: '',
    bossSpawnTicks: 0,
    constellations: [],
    constellationChoices: [],
    constellationDelayTicks: 0, pendingConstellations: 0,
    godConstellationMode: false,
    constellationReveal: null,
    bossesKilled: 0,
    bossPool: [], bossPoolBlock: 0,
    lastNaturalBoss: null,
    healJiggleTicks: 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function tileDist(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function tileEuclidDist(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function isFloorTile(map: number[][], tx: number, ty: number) {
  if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) return false;
  return map[ty][tx] !== T_WALL;
}

function damageLunarDecoy(state: GameState, amount: number) {
  if(state.build.queenTargetId!==undefined){
    const decoy=state.build.queenDecoys?.find(d=>d.id===state.build.queenTargetId);if(!decoy||amount<=0)return;
    decoy.hp-=amount;if(decoy.hp<=0){state.build.queenDecoys=state.build.queenDecoys!.filter(d=>d!==decoy);state.enemies.forEach(e=>e.pathTimer=0);playSFX_decoyDeath();}return;
  }
  if(state.build.decoyTargetActive){
    const decoy=state.build.decoy;if(!decoy||amount<=0)return;
    state.build.decoy=null;state.enemies.forEach(enemy=>enemy.pathTimer=0);
    for(let i=0;i<8;i++)state.deathParticles.push({x:decoy.x,y:decoy.y,vx:Math.cos(i*Math.PI/4)*2,vy:Math.sin(i*Math.PI/4)*2,ticks:18,maxTicks:18,size:3,color:'#c6b8ff'});
    return;
  }
  const decoy=state.lunarDecoy;if(!decoy || amount<=0 || decoy.invulnerableTicks>0)return;
  decoy.hitsLeft=Math.max(0,decoy.hitsLeft-1);decoy.flashTicks=8;decoy.invulnerableTicks=SPECIAL_QUEEN_DECOY_INVULNERABILITY;
  if(decoy.hitsLeft<=0){
    for(let i=0;i<12;i++)state.deathParticles.push({x:decoy.x,y:decoy.y,vx:Math.cos(i*Math.PI/6)*2,vy:Math.sin(i*Math.PI/6)*2,ticks:24,maxTicks:24,size:3,color:i%2?'#cc88ff':'#e5d4ff'});
    state.lunarDecoy=null;state.enemies.forEach(e=>e.pathTimer=0);playSFX_decoyDeath();
  }
}

/** Venus Veil: the share of damage you and Ruby still take (85% cut in the Venus challenge, 65% elsewhere). */
const veilDamageMult = (state: GameState) => state.venus ? VENUS.veilDamage : SPECIAL_VENUS_DAMAGE_MULT;

// Venus returns the full incoming hit to a direct attacker; bosses take a capped share.
function reflectVenusDamage(state: GameState, attacker: Enemy | undefined, amount: number, fromX: number, fromY: number) {
  if (state.venusVeilTicks <= 0 || !attacker || attacker.hp <= 0 || amount <= 0) return;
  const scaled = amount * venusReflectScale(state, attacker); // Venus: scaled with his HP so it stays the same share
  const damage = isBossType(attacker.type) && !state.venus ? Math.min(scaled, attacker.maxHp * SPECIAL_VENUS_BOSS_REFLECT_CAP) : scaled; // no cap in the Venus challenge
  damageEnemy(state, attacker, damage, 'reflection');
  state.venusReflects.push({ fromX, fromY, toX: attacker.x, toY: attacker.y, ticks: 18 });
  if (state.venusReflects.length > 24) state.venusReflects.shift();
}

export function damagePlayer(state: GameState, amount: number, attacker?: Enemy, silentHit = false, shieldCost = 1) {
  if(attacker&&state.build.blessings.includes('sea_chanter')&&(attacker.sapphireWeakenUntil??0)>state.gameTick)amount*=BLESSING.sapphireWeaken;
  if(attacker&&!state.trial)amount*=lateEnemyDamageMult(state.bossesKilled); // stage 15+: enemy attacks hit harder every 5 stages
  if(attacker&&(attacker.enchantedUntil??0)>state.gameTick)amount*=isBossType(attacker.type)?ENCHANTER.bossDamageMult:ENCHANTER.damageMult; // Enchanter buff (smaller on bosses)
  if (attacker) amount *= saturnEmpower(state, attacker, 'damage') * siriusEmpower(state, attacker, 'damage'); // Saturn ice / Sirius wrath make them hit harder
  if (attacker && isMoonBoss(state, attacker)) amount *= MOON_QUEEN_DAMAGE_MULT;
  if (state.neptune && attacker?.id === state.neptune.bossId) {
    amount *= NEPTUNE_ATTACK_MULT[state.neptune.phase];
  }
  if(state.enemyDecoyActive){damageLunarDecoy(state,amount);return;}
  // Venus: his leap and lance hit 30% softer but reflect at their full strength (reflectAs).
  const reflectBase = state.venus?.reflectAs ?? amount; if (state.venus) state.venus.reflectAs = undefined;
  reflectVenusDamage(state, attacker, reflectBase, state.playerX, state.playerY);
  if (state.venus) amount = venusGuard(state, attacker, amount, reflectBase); // Venus: the Sand Swirl guard cuts the hit and reflects it (on top of Venus Veil)
  if(state.godMode){const mitigated=amount*((state.jupiter?.guardTicks??0)>0?JUPITER.fenceGuardDamage:1)*(state.constellations.includes('playerGuard')?.85:1)*(state.playerCarryingRuby?CARRY_DAMAGE_MULT:1)*(state.venusVeilTicks>0?veilDamageMult(state):1);blessingReflectIncoming(state,mitigated,attacker);return;}
  if ((state.jupiter?.guardTicks ?? 0) > 0) amount *= JUPITER.fenceGuardDamage;
  amount *= state.constellations.includes('playerGuard') ? 0.85 : 1;
  if (state.playerCarryingRuby) amount *= CARRY_DAMAGE_MULT; // carrying Ruby: less damage taken
  if (state.venusVeilTicks > 0) amount *= veilDamageMult(state);
  blessingIncoming(state,amount,attacker);
  if(hasBlessing(state,'aegis_sentinel'))amount*=BLESSING.pearlReduction; // Pearl
  const incoming=amount;
  const absorbed = Math.min(state.playerShieldHP / shieldCost, amount);
  state.playerShieldHP = Math.max(0,state.playerShieldHP-absorbed*shieldCost);
  if(state.playerShieldHP<=0)state.playerSaturnShield=false;
  amount -= absorbed;
  if (absorbed > 0) showRewardEffect(state, 'player', 'shield');
  if (amount <= 0) {blessingAfterHit(state,incoming);return;}
  state.playerHP = Math.max(state.immortal ? 1 : 0, state.playerHP - amount);
  state.build.sunUntouchedTicks = 0; // Ruby gem: only real HP loss ends the surge, not shield-absorbed hits
  blessingAfterHit(state,incoming);
  if (!silentHit) playSFX_hit();
  if (state.playerHP <= 0) endGame(state);
}

export function damageRuby(state: GameState, amount: number, attacker?: Enemy, silentHit = false, shieldCost = 1) {
  if (state.rubyTileX === -1) return; // carried — ruby not vulnerable
  if(attacker&&state.build.blessings.includes('sea_chanter')&&(attacker.sapphireWeakenUntil??0)>state.gameTick)amount*=BLESSING.sapphireWeaken;
  if(attacker&&!state.trial)amount*=lateEnemyDamageMult(state.bossesKilled); // stage 15+: enemy attacks hit harder every 5 stages
  if(attacker&&(attacker.enchantedUntil??0)>state.gameTick)amount*=isBossType(attacker.type)?ENCHANTER.bossDamageMult:ENCHANTER.damageMult; // Enchanter buff (smaller on bosses)
  if (attacker) amount *= saturnEmpower(state, attacker, 'damage') * siriusEmpower(state, attacker, 'damage'); // Saturn ice / Sirius wrath make them hit harder
  if (attacker && isMoonBoss(state, attacker)) amount *= MOON_QUEEN_DAMAGE_MULT;
  if (state.neptune && attacker?.id === state.neptune.bossId) {
    amount *= NEPTUNE_ATTACK_MULT[state.neptune.phase];
  }
  reflectVenusDamage(state, attacker, amount, (state.rubyTileX + .5) * TILE_SIZE, (state.rubyTileY + .5) * TILE_SIZE);
  if (state.godMode) return;
  if ((state.jupiter?.guardTicks ?? 0) > 0) amount *= JUPITER.fenceGuardDamage;
  amount *= 1 - 0.15 * constellationBonus(state, 'ruby');
  if (state.venusVeilTicks > 0) amount *= veilDamageMult(state);
  const absorbed = Math.min(state.rubyShieldHP / shieldCost, amount);
  state.rubyShieldHP = Math.max(0,state.rubyShieldHP-absorbed*shieldCost);
  if(state.rubyShieldHP<=0)state.rubySaturnShield=false;
  amount -= absorbed;
  if (absorbed > 0) showRewardEffect(state, 'ruby', 'shield');
  if (amount <= 0) return;
  state.rubyHP = Math.max(state.immortal ? 1 : 0, state.rubyHP - amount);
  if (!silentHit) playSFX_rubyHit();
  if (state.rubyHP <= 0) endGame(state);
}

export function playerCCImmune(state:Readonly<GameState>):boolean {
  return (state.ccImmuneUntil??0)>state.gameTick;
}

export function shovePlayerFromEnemy(state:GameState,e:Enemy,tiles:number):boolean{
  if(state.gamePhase!=='playing'||state.enemyDecoyActive||state.playerKnockback||playerCCImmune(state))return false;
  const dx=state.playerTileX-e.tileX,dy=state.playerTileY-e.tileY;
  const [kx,ky]=Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx)||1,0]:[0,Math.sign(dy)||1];
  const open=isFloorTile(state.map,state.playerTargetX+kx,state.playerTargetY+ky);
  if(open)state.playerKnockback={dirX:kx,dirY:ky,started:false,tilesLeft:tiles};
  state.screenShakeTicks=Math.max(state.screenShakeTicks,8);state.screenShakeAmt=Math.max(state.screenShakeAmt,4);
  return open;
}

/** Phase HP for guardians whose three phases are equal bands of one HP pool (Sun, Saturn, Moon, Sirius). */
function phasedBossStep(state: GameState, e: Enemy): number {
  if (state.sun && e.id === state.sun.bossId) return SUN.phaseHP;
  if (state.saturn && e.id === state.saturn.bossId) return SATURN.phaseHP;
  if (state.sirius && e.id === state.sirius.bossId) return SIRIUS.phaseHP;
  if (state.venus && e.id === state.venus.bossId) return VENUS.phaseHP;
  if (isMoonBoss(state, e)) return MOON_PHASE_HP;
  return 0;
}

export function damageEnemy(state: GameState, e: Enemy, amount: number, source: 'player' | 'meteor' | 'enemy' | 'special' | 'reflection' | 'summon' = 'player', sapphireHealing = 0, shieldCost = 1) {
  if (e.devourer?.merging || e.hp <= 0 || (e.twin?.downedTicks ?? 0) > 0 || amount <= 0) return;
  if (state.neptune && (e.type === 'fish_blue' || e.type === 'fish_red')) return; // only Ocean Melody breaks fish
  if(state.jupiter)normalizeJupiterHealth(state,e);
  if (duneWormHidden(e)) return; // Venus: a Dune Worm under the sand cannot be hit
  if (state.venus && e.type === 'sand_core' && venusCoreHit(state, e)) return; // Venus: his core is sealed while totems are left
  if (state.venus && e.type === 'sand_core') amount = Math.max(amount, e.hp); // once open, any hit breaks it
  if (state.venus && venusAirborne(state, e)) return; // Venus: mid-leap he cannot be hit
  if(source==='player'||source==='special'){amount*=blessingDamageMultiplier(state);blessingHit(state,e);}
  if((source==='player'||source==='special')&&e.type==='devourer'&&e.devourer?.challenge){e.devourer.aggroTicks=SINGULARITY_CHALLENGE.aggroTicks;e.pathTimer=0;} // Singularity: a body you hit drops its food and hunts you
  const wasSeaHunting = e.type === 'sea_chanter' && !isSeaChanterDiving(e);
  const previousHP = e.hp;
  const shielded = state.enemies.some(s => s.type === 'shielder' && s.shieldTargetId === e.id);
  let actual = (shielded ? amount / 2 : amount) * jupiterDamageTaken(state, e) * saturnDamageTaken(state, e, source) * siriusDamageTaken(state, e, source) * binaryDamageTaken(state, e, source);
  if (e.type === 'emberling' && !e.extinguished) actual *= SUN.emberlingArmor;
  if (e.type === 'flare_spitter' && !e.doused) actual *= SUN.spitter.armor; // flame armor until water douses it
  if (e.twin?.partnerDownTicks) actual *= TWIN_BERSERK_DAMAGE_TAKEN; // berserk survivor
  if (e.aegis) {
    refreshAegisShield(state, e);
    if (e.aegis.shielded) {
      actual *= AEGIS_DAMAGE_MULT;
      // Every player-dealt hit returns its incoming damage, before the Aegis shield reduces it.
      if (source === 'player' || source === 'special') {
        e.aegis.reflectTicks = 10;
        encounterEffect(state, 'reflect', e, state.playerX, state.playerY, 12, '#78dedf');
        damagePlayer(state, amount * AEGIS_REFLECT_RATIO);
      }
    }
  }

  // Frost Warden's icy shield absorbs damage outright (a real HP pool, not a %-reduction
  // like the shielder's) — drains first, any overflow past its remaining capacity spills to hp.
  if (e.icyShieldHP > 0) {
    const absorbed = Math.min(e.icyShieldHP / shieldCost, actual);
    e.icyShieldHP = Math.max(0,e.icyShieldHP-absorbed*shieldCost);
    // Saturn: her ice is her life. Ice you break on her aliens is taken from her.
    if(state.saturn&&!isBossType(e.type)&&absorbed>0&&(source==='player'||source==='special'))saturnShatter(state,absorbed*shieldCost,e);
    if (absorbed > 0 && e.icyShieldHP <= 0) {
      if (e.type === 'devourer' && e.devourer?.challenge && state.trial?.devourer) { // Singularity: a Void Shell shatters
        (state.trial.devourer.shellBreaks ??= []).push({ x: e.x, y: e.y, ticks: 30 }); e.flashTicks = 8;
        playAudioOneShot('/sounds/aegis-shield-break.wav', .7, 1.3);
      } else playSFX_objectBreak('frost');
    }
    actual -= absorbed;
  }

  // Underwater vulnerability boosts HP damage after shields absorb their share.
  if (isSeaChanterDiving(e)) actual *= SEA_DIVE_DAMAGE_MULTIPLIER;
  const gaia = state.gaia;
  if (gaia && e.id === gaia.bossId) actual *= gaiaBossDamageMult(state, e);
  if (isMoonBoss(state, e)) actual *= moonBossDamageMult(state, e);
  if((e.type==='spook'||e.type==='lost_soul'||e.type==='mirror_mite')&&actual>0)actual=Math.max(actual,e.hp); // one damaging hit, even a fractional bullet
  e.hp -= actual;
  if(e.type==='blinker'&&e.hp<=0)e.blinkOnDeath=source!=='enemy'&&source!=='meteor';
  // One hit never carries damage across a phase: it stops at the boundary, and the next hit starts the next phase.
  // (Gaia and Neptune have their own floors below; Binary Star's twins lose one life per phase.)
  const phaseStep = phasedBossStep(state, e);
  if (state.venus && e.id === state.venus.bossId && previousHP > 0) { const floor = venusFloor(venusPhaseOf(previousHP)); if (floor > 0 && e.hp < floor) e.hp = floor; } // Venus: unequal bands (a bigger final phase)
  else if (state.jupiter && e.id === state.jupiter.bossId && previousHP > 0) e.hp=Math.max(e.hp,jupiterPhaseFloorHP(jupiterPhaseOfHP(previousHP)));
  else if (phaseStep && previousHP > 0) { const floor = Math.floor((previousHP - .001) / phaseStep) * phaseStep; if (floor > 0 && e.hp < floor) e.hp = floor; }
  if (gaia && e.id === gaia.bossId && gaia.phase < 3) e.hp = Math.max(e.hp, gaiaPhaseFloor(gaia) + .01); // a hit stops at the phase floor; the next phase starts on the next update
  if (gaia && previousHP > 0 && e.hp <= 0 && e.type === 'seed_pod' && source === 'player') addGaiaSunCharge(state, GAIA_POD_CHARGE);
  // Breaking a lifebloom heals you and Ruby.
  if (gaia && previousHP > 0 && e.hp <= 0 && e.type === 'lifebloom' && source !== 'enemy') {
    healPlayer(state, GAIA_LIFEBLOOM_HEAL); healCore(state, GAIA_LIFEBLOOM_HEAL);
    showRewardEffect(state, 'player', 'heal'); if (state.rubyTileX !== -1) showRewardEffect(state, 'ruby', 'heal');
  }
  // Breaking one of her blossoms (not one wilting away) costs her some of the phase and heals you.
  if (gaia && previousHP > 0 && e.hp <= 0 && e.type === 'blossom' && source !== 'enemy') {
    const boss = gaiaBoss(state); if (boss) gaiaSelfDamage(state, boss, GAIA_BLOSSOM_SELF_DAMAGE);
    healPlayer(state, GAIA_BLOSSOM_KILL_HEAL); showRewardEffect(state, 'player', 'heal'); // and its nectar heals you
  }
  const neptune = state.neptune;
  if (neptune && e.id === neptune.bossId) e.hp = Math.max(e.hp, neptunePhaseFloor(neptune) + .01); // phases end only through the final dive
  // Hitting one of her clones stops her ally-feeding heal for a while.
  if (neptune && e.type === 'water_clone' && actual > 0) {
    const boss = state.enemies.find(b => b.id === neptune.bossId);
    if (boss?.sea) boss.sea.healingBlockedUntilTick = Math.max(boss.sea.healingBlockedUntilTick, state.gameTick + NEPTUNE_CLONE_HEAL_BLOCK);
  }
  if (neptune && previousHP > 0 && e.hp <= 0) {
    if (e.type === 'water_bomb' && source !== 'enemy') {
      const boss = state.enemies.find(b => b.id === neptune.bossId && b.hp > 0);
      if (boss) damageEnemy(state, boss, NEPTUNE_PHASE_HPS[neptune.phase] * NEPTUNE_BOMB_SELF_DAMAGE, 'enemy');
    }
  }
  const hpLost = Math.min(Math.max(0, previousHP), Math.max(0, actual));
  if(e.hp<=0)state.sapphireHitEffects=(state.sapphireHitEffects??[]).filter(hit=>hit.enemyId!==e.id);
  if(e.hp>0&&hpLost>0&&previousHP>e.hp&&!isChallengeObject(e.type)&&state.build.blessings.includes('sea_chanter')&&(source==='player'||source==='special')){
    if(source==='player'||sapphireHealing>0)e.sapphireWeakenUntil=state.gameTick+180;
    const effects=state.sapphireHitEffects??=[];
    const effect=effects.find(hit=>hit.enemyId===e.id);
    if(effect){effect.x=e.x;effect.y=e.y;effect.untilTick=state.gameTick+72;}
    else effects.push({enemyId:e.id,x:e.x,y:e.y,untilTick:state.gameTick+72});
  }
  if(previousHP>e.hp&&!isChallengeObject(e.type)&&(source==='player'||source==='special')){blessingLandedAttack(state,sapphireHealing);if(sapphireHealing>0)obsidianBossHit(state,e);}
  if (state.jupiter && hpLost > 0) drainJupiterEnergy(state, e, source === 'meteor' ? hpLost * jupiterDamageTaken(state, e) : hpLost); // a meteor ignores his protection but drains energy as if it were cut
  if (state.sun && hpLost > 0 && e.id === state.sun.bossId) state.sun.rage = Math.max(0, state.sun.rage - hpLost * SUN.rageOnHit); // hurting the King cools his rage a little
  if (state.moon && amount > 0) moonSeenWhenHit(state, e); // a hit lights it up in the dark
  // HP the real Queen loses to you banks a heal, paid out when she jumps, so a hit never gives her away on the spot.
  if (source === 'player' && hpLost > 0 && state.moon && isMoonBoss(state, e)) state.moon.healBank += hpLost * MOON_HIT_HEAL;
  if (hpLost > 0 && isSeaChanterDiving(e)) {
    e.sea!.healingBlockedUntilTick = state.gameTick + SEA_HEALING_BLOCK_TICKS;
  }
  if (source === 'player' && hpLost > 0) {
    if (wasSeaHunting && e.hp > 0) {
      healSeaAllies(state, e, SEA_ALLY_HEAL_AMOUNT);
    } else if (!isBossType(e.type) && e.type !== 'queen_echo' && e.type !== 'aegis_construct' && !isChallengeObject(e.type)) {
      for (const chanter of state.enemies) {
        if (!isSeaChanterDiving(chanter) || chanter.hp <= 0 || state.gameTick < chanter.sea!.healingBlockedUntilTick) continue;
        chanter.hp = Math.min(chanter.maxHp, chanter.hp + Math.min(SEA_FEED_HEAL_CAP, hpLost * SEA_FEED_HEAL_RATIO));
        chanter.sea!.healPulseTicks = 24;
        playSeaHealing(chanter);
        updateSeaMode(chanter);
      }
    }
  }
  if (e.type === 'sea_chanter' && e.hp > 0) updateSeaMode(e);
  if (e.type === 'fiery_king' && actual > 0) {
    e.king = { untouchedTicks: 0, arenaWindupTicks: 0 };
  }
  e.flashTicks = 10;
}

// Called after a player attack hits `hitEnemy` — if electric buff is active,
// chain lightning to up to 2 nearby enemies.
/** Laser-hit stuns (shared Vulpecula stop timer and art): the Lancer reward while active, and the Reticulum constellation. */
function laserStun(state: GameState, enemy: Enemy) {
  if (enemy.hp <= 0) return;
  const boss = isBossType(enemy.type);
  if ((state.laserStunTicks ?? 0) > 0) enemy.buildStopUntil = Math.max(enemy.buildStopUntil ?? 0, state.gameTick + (boss ? LANCER.bossStunTicks : LANCER.stunTicks));
  if (!boss && state.constellations.includes('laserWire') && state.gameTick >= (enemy.reticulumReadyAt ?? 0)) {
    enemy.buildStopUntil = Math.max(enemy.buildStopUntil ?? 0, state.gameTick + RETICULUM.stunTicks);
    enemy.reticulumReadyAt = state.gameTick + RETICULUM.recoverTicks;
    state.build.impacts.push({ x: enemy.x, y: enemy.y, kind: 'wire', ticks: 18 });
  }
}

function chainElectric(state: GameState, hitEnemy: Enemy, bombProtected?: Set<number>) {
  if (state.electricBuffTicks <= 0) return;
  const targets = state.enemies
    .filter(a => a !== hitEnemy && a.hp > 0 && !(a.twin?.downedTicks) && tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, a.tileX, a.tileY) <= SNIPER_CHAIN_RANGE)
    .sort((a, b) => tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, a.tileX, a.tileY) - tileEuclidDist(hitEnemy.tileX, hitEnemy.tileY, b.tileX, b.tileY))
    .slice(0, 2);
  for (const t of targets) {
    state.lightningArcs.push({ fromX: hitEnemy.x, fromY: hitEnemy.y, toX: t.x, toY: t.y, ticks: 22 });
    const damage = bombProtected?.has(t.id) ? Math.min(SNIPER_CHAIN_DMG, t.icyShieldHP) : SNIPER_CHAIN_DMG;
    if (damage > 0) damageEnemy(state, t, damage);
  }
}

function endGame(state: GameState) {
  stopGaiaFieldSound();
  stopSingularitySound();
  stopSeaSounds();
  state.gamePhase = 'lost';
  stopAmbientEventSounds();
  playSFX_gameOver();
}

// ─── Spawn ────────────────────────────────────────────────────────────────────

// Late aliens join the tier's spawn pool once their stage is reached (Endless/Ascension only), each up to its own cap;
// the Impostor only while a boss is alive, since it copies one.
const LATE_ALIENS = [['shooter', SHOOTER], ['reflector', REFLECTOR], ['trapper', TRAPPER], ['dropper', DROPPER], ['blinker', BLINKER], ['jammer', JAMMER], ['spook', SPOOK], ['grappler', GRAPPLER], ['enchanter', ENCHANTER], ['bleeder', BLEEDER], ['snatcher', SNATCHER], ['impostor', IMPOSTOR]] as const;
const LATE_ALIEN_TYPES: readonly string[] = LATE_ALIENS.map(([type]) => type);
export const ALIEN_INTRO_TICKS = 300;

// Aliens too basic (or too derivative) for an introduction card.
const NO_INTRO: readonly string[] = ['normal', 'mini_splitter', 'queen_echo'];
const INTRO_ALIENS: readonly string[] = [...new Set([...DIFFICULTY_TIERS.flatMap(t => t.spawnTypes), ...LATE_ALIEN_TYPES])].filter(t => !NO_INTRO.includes(t));

/** Desktop Endless/Ascension only: the first time each alien (except the basic ones) or boss ever appears, queue a short
 *  NEW ALIEN / NEW BOSS callout (name and one line, drawn by the HUD). */
function updateAlienIntros(state: GameState) {
  if (!isDesktop() || (state.mode !== 'endless' && state.mode !== 'ascension')) return;
  const introduced = (type: string) => INTRO_ALIENS.includes(type) || isBossType(type as EnemyType);
  const seen = state.introducedAliens ??= getProfile().encountered.filter(introduced);
  const queue = state.alienIntroQueue ??= [];
  for (const e of state.enemies) {
    if (!introduced(e.type) || seen.includes(e.type)) continue;
    seen.push(e.type); queue.push(e.type);
  }
  if (state.alienIntro && --state.alienIntro.ticks <= 0) state.alienIntro = null;
  if (!state.alienIntro && queue.length) {
    state.alienIntro = { type: queue.shift()!, ticks: ALIEN_INTRO_TICKS };
    playAudioOneShot('/sounds/constellation-choice.wav', .35);
  }
}
export function spawnPool(state: GameState, base: EnemyType[]): EnemyType[] {
  if (state.trial) {
    if ((state.sun || state.gaia || state.moon || state.venus || state.binary || state.neptune || state.saturn || state.sirius) && state.difficultyTimer >= CHALLENGE_EXTRA_POOL.afterTicks) {
      const common = [...new Set(base)]; // each type once: Normal's opening double weight ends here
      for (const type of ['ghost','bomber','lancer'] as EnemyType[]) if (!common.includes(type)) common.push(type);
      return [...common.flatMap(type=>Array<EnemyType>(type==='normal'?CHALLENGE_EXTRA_POOL.normalWeight:CHALLENGE_EXTRA_POOL.commonWeight).fill(type)),...Array<EnemyType>(CHALLENGE_EXTRA_POOL.shooterWeight).fill('shooter')];
    }
    return base;
  }
  const extra = LATE_ALIENS.filter(([type, cfg]) => state.bossesKilled >= cfg.fromStage
    && state.enemies.filter(e => e.type === type).length < cfg.maxAlive
    && (type !== 'impostor' || state.enemies.some(b => isBossType(b.type) && b.hp > 0))).map(([type]) => type);
  return extra.length ? [...base, ...extra] : base;
}

function spawnEnemy(state: GameState) {
  const tier = DIFFICULTY_TIERS[Math.min(state.difficultyLevel, DIFFICULTY_TIERS.length - 1)];
  if (state.trial?.devourer) return; // the Singularity has no aliens: its only food is Lost Souls
  const population = state.enemies.filter(e => !isChallengeObject(e.type) && e.type !== 'moon_mimic' && e.type !== 'scorch_sapper').length; // challenge objects, mimics and sappers never block aliens
  const maxEnemies = tier.maxEnemies + (state.gaia ? GAIA_EXTRA_ENEMIES : 0);
  if (population >= maxEnemies) return;

  // Pick a chamber far from player or near ruby depending on tension
  const chambers = [0, 1, 2, 3];
  // Weight chambers: prefer ones with player or ruby
  const _playerCh = state.playerChamber; void _playerCh;

  const eligibleSpawns: [number, number][] = [];
  for (const ch of chambers) {
    for (const [tx, ty] of CHAMBER_SPAWN_TILES[ch]) {
      // Don't spawn right on top of player
      if (Math.abs(tx - state.playerTileX) + Math.abs(ty - state.playerTileY) > 6) {
        eligibleSpawns.push([tx, ty]);
      }
    }
  }
  if (!eligibleSpawns.length) return;

  const baseCount = Math.min(tier.spawnCount, maxEnemies - population);
  // Sun phase 2+: now and then one extra ordinary alien comes along after the usual spawn (it replaces nothing). Rolled
  // only once the usual spawns are done.
  const extraPlain = () => !!state.sun && state.sun.phase >= 2 && baseCount > 0 && baseCount < maxEnemies - population && Math.random() < SUN.extraPlainChance;
  for (let s = 0; s < baseCount || (s === baseCount && extraPlain()); s++) {
    const idx = Math.floor(Math.random() * eligibleSpawns.length);
    const [tx, ty] = eligibleSpawns[idx];

    const pool = spawnPool(state, tier.spawnTypes), typeIdx = Math.floor(Math.random() * pool.length);
    const type: EnemyType = s >= baseCount ? pool[typeIdx] // the extra ordinary alien skips the themed rolls
      : state.sun && Math.random() < SUN.emberlingSpawnChance ? 'emberling'
      : state.sun && state.sun.phase>=SUN.spitter.fromPhase && state.enemies.filter(e=>e.type==='flare_spitter'&&e.hp>0).length<SUN.spitter.cap && Math.random()<SUN.spitter.chance ? 'flare_spitter'
      : state.neptune && Math.random() < NEPTUNE_STINGER_CHANCE ? 'stinger'
      : state.neptune && state.neptune.phase >= 2 && Math.random() < NEPTUNE_PUFFER_CHANCE ? 'pufferfish' // Neptune: pufferfish from phase 2
      : state.gaia && Math.random() < GAIA_ALIEN_CHANCE ? gaiaAlienType()
      : state.moon && state.moon.phase >= 3 && Math.random() < MOON_BLINKER_CHANCE && state.enemies.filter(e => e.type === 'blinker').length < MOON_BLINKER_MAX ? 'blinker'
      : state.moon && state.moon.phase >= 2 && Math.random() < MOON_SHADE_CHANCE ? 'moon_shade' // Moon: shades from phase 2
      : state.moon && Math.random() < MOON_HOUND.chance && state.enemies.filter(e => e.type === 'moon_hound' && e.hp > 0).length < MOON_HOUND.max ? 'moon_hound'
      : state.moon && Math.random() < MOON_MITE_CHANCE ? 'mirror_mite'
      : state.venus && state.venus.phase >= VENUS.wormFromPhase && Math.random() < VENUS.wormChance && state.enemies.filter(e => e.type === 'dune_worm').length < VENUS.wormMax ? 'dune_worm'
      : state.binary && state.binary.phase >= BINARY.lodestoneFromPhase && Math.random() < BINARY.lodestoneChance && state.enemies.filter(e => e.type === 'lodestone').length < BINARY.lodestoneMax ? 'lodestone'
      : state.binary && state.binary.phase >= BINARY.pulsar.fromPhase && Math.random() < BINARY.pulsar.chance && state.enemies.filter(e => e.type === 'pulsar').length < BINARY.pulsar.max ? 'pulsar'
      : pool[typeIdx];
    const cfg = ENEMY_CONFIGS[type];
    const hpScaled = type==='spook'||type==='mirror_mite' ? 1 : Math.ceil(cfg.maxHp * tier.hpMult) * REGULAR_ENEMY_HP_MULT * constellationAlienHPMult(state);

    const enemy: Enemy = {
      id: state.nextEnemyId++,
      type,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      tileX: tx, tileY: ty,
      targetTileX: tx, targetTileY: ty,
      stepProgress: 0,
      hp: hpScaled, maxHp: hpScaled,
      path: [], pathTimer: Math.floor(Math.random() * 30),
      attackTimer: 0,
      targeting: 'player',
      pushDirX: 0, pushDirY: 0, pushTiles: 0,
      flashTicks: 0,
      healFlashTicks: 0,
      shootTicks: 0,
      exploding: false, explodeTick: 0,
      windupTicks: 0,
      chargeDirX: 0, chargeDirY: 0,
      shieldTargetId: -1,
      phaseTimer: 0,
      icyShieldHP: 0,
    };
    if (type === 'lodestone' || type === 'pulsar') enemy.pole = Math.random() < .5 ? 'north' : 'south';
    state.enemies.push(enemy);
  }
}

// ─── Resource spawning ────────────────────────────────────────────────────────

function spawnResource(state: GameState) {
  if (state.resources.length >= RESOURCE_MAX_ON_MAP) return;
  // Pick random floor tile not occupied by player, ruby, or existing resource
  const candidates: [number, number][] = [];
  for (let ty = 0; ty < MAP_ROWS; ty++) {
    for (let tx = 0; tx < MAP_COLS; tx++) {
      if (state.map[ty][tx] === T_WALL) continue;
      if (tx === state.playerTileX && ty === state.playerTileY) continue;
      if (tx === state.rubyTileX && ty === state.rubyTileY) continue;
      if (state.resources.some(r => r.tileX === tx && r.tileY === ty)) continue;
      candidates.push([tx, ty]);
    }
  }
  if (!candidates.length) return;
  const [tx, ty] = candidates[Math.floor(Math.random() * candidates.length)];
  const type: Resource['type'] = Math.random() < 0.5 ? 'health' : 'energy';
  state.resources.push({ tileX: tx, tileY: ty, type });
}

// ─── Line of sight (Bresenham) ───────────────────────────────────────────────

export function hasLineOfSight(map: number[][], x1: number, y1: number, x2: number, y2: number): boolean {
  let dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy, cx = x1, cy = y1;
  while (true) {
    if ((cx !== x1 || cy !== y1) && map[cy]?.[cx] === T_WALL) return false;
    if (cx === x2 && cy === y2) return true;
    const e2 = err * 2;
    const prevCx = cx, prevCy = cy;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx)  { err += dx; cy += sy; }
    
    // If we moved diagonally, prevent seeing through solid corners
    if (cx !== prevCx && cy !== prevCy) {
      if (map[prevCy]?.[cx] === T_WALL || map[cy]?.[prevCx] === T_WALL) return false;
    }
  }
}

function fireQueenBolt(state: GameState, e: Enemy, tgtX: number, tgtY: number, targetIsPlayer: boolean) {
  const cfg = ENEMY_CONFIGS[e.type as 'splitter_queen' | 'queen_echo' | 'moon_illusion'];
  const color = isMoonBoss(state, e) ? ENEMY_CONFIGS.moon_illusion.color : cfg.color;
  state.laserBeams.push({ fromX: e.x, fromY: e.y, dirX: 0, dirY: 0, endX: tgtX, endY: tgtY, ticks: 20, color });
  if (targetIsPlayer) damagePlayer(state, cfg.damageToPlayer, e);
  else if (state.rubyTileX !== -1) damageRuby(state, cfg.damageToRuby, e);
  e.shootTicks = 20;
  e.attackTimer = cfg.attackCooldown;
  playSFX_queenAttack(state.moon?.bossId === e.id ? .9 : 1);
}

// Walls off (or reopens) every tile in a hallway — hallways are pure floor by construction
// (no cover-walls or teleport pads inside them), so this is always a clean, reversible swap.
// Walls off only the two end-caps of a hallway (like a portcullis dropping at each mouth),
// not the whole corridor — sealing every tile would strand whoever's inside with zero
// adjacent floor tiles, freezing them in place instead of trapping them in a fightable space.
function setHallwayWalled(state: GameState, hallwayIdx: number, walled: boolean) {
  if (hallwayIdx < 0) return;
  const [r1, c1, r2, c2] = HALLWAY_BOUNDS[hallwayIdx];
  const horizontal = (c2 - c1) > (r2 - r1);
  if (horizontal) {
    for (let r = r1; r <= r2; r++) {
      state.map[r][c1] = walled ? T_WALL : T_FLOOR;
      state.map[r][c2] = walled ? T_WALL : T_FLOOR;
    }
  } else {
    for (let c = c1; c <= c2; c++) {
      state.map[r1][c] = walled ? T_WALL : T_FLOOR;
      state.map[r2][c] = walled ? T_WALL : T_FLOOR;
    }
  }
}

// Whether the player currently shares a chamber with a living Frost Warden — drives both
// the movement slow and the attack-speed slow, computed fresh each tick rather than stored.
export function isPlayerChilled(state: GameState): boolean {
  if(playerCCImmune(state))return false;
  if (state.saturn) return saturnBlizzard(state) && state.playerShieldHP <= 0; // the blizzard chills you only while you have no shield
  const playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);
  if (playerChamber === -1) return false;
  return state.enemies.some(e => e.type === 'frost_warden' && chamberOfTile(e.tileX, e.tileY) === playerChamber);
}

// Scatters FROST_ICE_TILE_COUNT ice tiles across the given chamber's spawn-tile pool —
// reuses CHAMBER_SPAWN_TILES as a ready-made set of valid, non-wall interior floor tiles.
function scatterFrostIceTiles(state: GameState, chamberIdx: number) {
  // Any floor tile in the chamber interior qualifies — not just the perimeter spawn-point
  // pool (CHAMBER_SPAWN_TILES), which is why ice used to only ever appear near the edges.
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamberIdx];
  const candidates: [number, number][] = [];
  for (let ty = r1; ty <= r2; ty++) {
    for (let tx = c1; tx <= c2; tx++) {
      if (state.map[ty][tx] === T_FLOOR) candidates.push([tx, ty]);
    }
  }
  state.frostIceTiles = [];
  for (let i = 0; i < FROST_ICE_TILE_COUNT && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    state.frostIceTiles.push(candidates[idx]);
    candidates.splice(idx, 1);
  }
}

// Teleports the Frost Warden into the player's chamber (a random other chamber if she is already there or the
// player is in a hallway) and re-scatters her ice tiles there. She lands at least 3 tiles from the player when possible.
export function relocateFrostWarden(state: GameState, e: Enemy) {
  if (isEnemyInSingularity(state,e)) return;
  const curChamber = chamberOfTile(e.tileX, e.tileY), playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);
  const others = [0, 1, 2, 3].filter(ch => ch !== curChamber);
  const nextChamber = playerChamber >= 0 && playerChamber !== curChamber ? playerChamber : others[Math.floor(Math.random() * others.length)];
  const spawns = CHAMBER_SPAWN_TILES[nextChamber], clear = spawns.filter(([x, y]) => tileEuclidDist(x, y, state.playerTileX, state.playerTileY) >= 3);
  const pool = clear.length ? clear : spawns;
  const [tx, ty] = pool[Math.floor(Math.random() * pool.length)];
  e.tileX = tx; e.tileY = ty; e.targetTileX = tx; e.targetTileY = ty;
  e.x = tx * TILE_SIZE + TILE_SIZE / 2; e.y = ty * TILE_SIZE + TILE_SIZE / 2;
  e.stepProgress = 0;
  e.phaseTimer = FROST_RELOCATE_INTERVAL;
  if(!state.saturn)scatterFrostIceTiles(state, nextChamber);
  else{state.saturn.iceTimer=0;state.saturn.iceWarning=0;state.saturn.nextIce=[];}

  // Doesn't grant the shield immediately — windupTicks (unused otherwise for this type)
  // counts down to when she fires the ice-laser shield cast, FROST_SHIELD_CAST_DELAY after
  // settling into the new chamber.
  e.windupTicks = FROST_SHIELD_CAST_DELAY;

  playSFX_frostRelocate();
}

// Fires an ice-laser at one random ally sharing her chamber, granting them an icy shield
// (absorbs FROST_SHIELD_HP plus a per-defeat bonus) — her support role for the grunts defending alongside her.
function castFrostShield(state: GameState, e: Enemy) {
  const chamber = chamberOfTile(e.tileX, e.tileY);
  const alliesHere = state.enemies.filter(a =>
    a !== e && !isBossType(a.type) && a.type !== 'queen_echo' && a.type !== 'aegis_construct' &&
    chamberOfTile(a.tileX, a.tileY) === chamber
  );
  if (alliesHere.length === 0) return;
  // Spread protection before refreshing an ally that still has an active ice shield.
  const unshielded = alliesHere.filter(a => (a.icyShieldHP ?? 0) <= 0);
  const candidates = unshielded.length > 0 ? unshielded : alliesHere;
  const ally = candidates[Math.floor(Math.random() * candidates.length)];
  ally.icyShieldHP = Math.min(FROST_SHIELD_HP_MAX, FROST_SHIELD_HP + state.bossesKilled * FROST_SHIELD_HP_PER_DEFEAT);
  e.shootTicks = 20; // Animate the caster only when a shield actually fires.
  state.laserBeams.push({
    fromX: e.x, fromY: e.y, dirX: 0, dirY: 0,
    endX: ally.x, endY: ally.y, ticks: 30, color: '#aaeeff',
  });
  try { const a = gameAudio('/sounds/ice.mp3', 'attack'); a.volume = 0.6 * ATTACK_SFX_VOLUME; a.play().catch(() => {}); } catch { }
}

// Teleports the Queen to a spawn tile in a different chamber (weighted toward whichever
// is farthest from the player), leaving a decaying 1-HP echo at her old position.
function phaseQueenJump(state: GameState, e: Enemy) {
  if (isEnemyInSingularity(state,e)) return;
  const curChamber = chamberOfTile(e.tileX, e.tileY);
  const departed = { x: e.x, y: e.y, room: curChamber };
  const playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);

  if (!state.moon) state.enemies.push({
    id: state.nextEnemyId++, type: 'queen_echo',
    x: e.x, y: e.y, tileX: e.tileX, tileY: e.tileY, targetTileX: e.tileX, targetTileY: e.tileY,
    stepProgress: 0, hp: 1, maxHp: 1,
    path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
    pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0,
    shootTicks: 0, exploding: false, explodeTick: 0,
    windupTicks: 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1,
    phaseTimer: 0, // unused for echoes — they persist until killed, not on a timer
    icyShieldHP: 0,
  });

  // Never land in the chamber she just left, or the one the player is currently standing in
  const others = [0, 1, 2, 3].filter(ch => ch !== curChamber && ch !== playerChamber);
  others.sort((a, b) => {
    const da = tileEuclidDist(state.playerTileX, state.playerTileY, TELEPORT_PADS[a][0], TELEPORT_PADS[a][1]);
    const db = tileEuclidDist(state.playerTileX, state.playerTileY, TELEPORT_PADS[b][0], TELEPORT_PADS[b][1]);
    return db - da; // farthest-from-player first
  });
  const nextChamber = Math.random() < 0.65 ? others[0] : others[Math.floor(Math.random() * others.length)];

  const pool = CHAMBER_SPAWN_TILES[nextChamber];
  const [tx, ty] = pool[Math.floor(Math.random() * pool.length)];
  e.tileX = tx; e.tileY = ty; e.targetTileX = tx; e.targetTileY = ty;
  e.x = tx * TILE_SIZE + TILE_SIZE / 2; e.y = ty * TILE_SIZE + TILE_SIZE / 2;
  e.stepProgress = 0;
  e.phaseTimer = QUEEN_PHASE_INTERVAL;
  e.windupTicks = 0;
  e.attackTimer = 0;

  if (state.moon) { moonQueenJumped(state, e, departed); playSFX_queenTeleport(); return; }

  // Each jump heals her a small amount — rewards ignoring her in favor of the decoys.
  if (e.hp < e.maxHp) {
    e.hp = Math.min(e.maxHp, e.hp + Math.min(QUEEN_PHASE_HEAL_CAP, Math.max(1, Math.round(e.maxHp * QUEEN_PHASE_HEAL_PCT))));
    e.healFlashTicks = 20;
  }

  playSFX_queenTeleport();
}

// ─── Enemy update ────────────────────────────────────────────────────────────

export function isMovementReversed(state: GameState): boolean {
  if (state.sirius) return siriusReversed(state); // Sirius: the dark reverses you, not the Prayer
  return state.enemies.some(e => e.type === 'blind_prayer' && e.hp > 0);
}

type SeaSound = 'dive' | 'attack' | 'heal' | 'singing' | 'diveSinging';
const seaVoices: Partial<Record<SeaSound, HTMLAudioElement>> = {};
export function stopSeaSound(cue: SeaSound) {
  const voice = seaVoices[cue];
  if (voice) { voice.pause(); voice.ontimeupdate = null; delete seaVoices[cue]; }
}
function stopSeaSounds() { for (const cue of Object.keys(seaVoices) as SeaSound[]) stopSeaSound(cue); }
export function playSeaSound(cue: SeaSound, playbackRate = 1) {
  try {
    stopSeaSound(cue);
    const mix = { diveSinging: ['seaSinging4.mp3', 0.32], dive: ['seaDive.mp3', 0.28], attack: ['seaSong.mp3', 0.30], heal: ['seaHeal.mp3', 0.52], singing: ['seaSinging.mp3', 0.58] } as const;
    const [file, gain] = mix[cue];
    const voice = gameAudio('/sounds/' + file);
    voice.volume = Number(gain) * ATTACK_SFX_VOLUME;
    if (cue === 'singing') voice.playbackRate = 1; // full natural note overlaps the faster wave launch
    if (playbackRate !== 1) {
      voice.playbackRate = playbackRate;
      voice.preservesPitch = false;
    }
    if (cue === 'heal') {
      // The supplied healing clip is 10 seconds; use a short, fading cue without stacking.
      voice.ontimeupdate = () => {
        voice.volume = Number(gain) * ATTACK_SFX_VOLUME * Math.max(0, Math.min(1, (1.6 - voice.currentTime) / 0.5));
        if (voice.currentTime >= 1.6) stopSeaSound('heal');
      };
    }
    voice.onended = () => { if (seaVoices[cue] === voice) delete seaVoices[cue]; };
    seaVoices[cue] = voice; voice.play().catch(() => {});
  } catch { }
}
export function playSeaHealing(e: Enemy) {
  const sea = e.sea;
  if (!sea || sea.healSoundCooldown > 0) return;
  sea.healSoundCooldown = 180; playSeaSound('heal');
}

export function isSeaChanterDiving(enemy: Enemy): boolean {
  return enemy.type === 'sea_chanter' && enemy.sea?.mode === 'diving';
}

export function isEnemyVisibleOnMinimap(enemy: Enemy): boolean {
  if (duneWormHidden(enemy)) return false; // under the sand: only its trail shows
  if (!isSeaChanterDiving(enemy)) return true;
  const phase = (enemy.sea?.diveElapsedTicks ?? 0) % SEA_MINIMAP_INTERVAL;
  return phase >= SEA_MINIMAP_INTERVAL - SEA_MINIMAP_REVEAL;
}

export function encounterEffect(state: GameState, kind: EncounterEffect['kind'], enemy: Enemy, toX = enemy.x, toY = enemy.y, ticks = 24, color = ENEMY_CONFIGS[enemy.type].color) {
  // Rapid reflected bullets refresh one return streak instead of piling up effects.
  const old = kind === 'reflect' ? state.encounterEffects.find(fx => fx.kind === kind && fx.ownerId === enemy.id) : undefined;
  if (old) { Object.assign(old, { x: enemy.x, y: enemy.y, toX, toY, ticks, maxTicks: ticks }); return old; }
  const effect: EncounterEffect = { kind, x: enemy.x, y: enemy.y, toX, toY, ticks, maxTicks: ticks, ownerId: enemy.id, color };
  state.encounterEffects.push(effect);
  if (state.encounterEffects.length > 48) state.encounterEffects.shift();
  return effect;
}

// Regular aliens only: no bosses, echoes, totems or downed twins.
function nearestDevourerFood(state: GameState, e: Enemy, maxDist: number): Enemy | null {
  let nearest: Enemy | null = null, nearestDist = maxDist;
  for (const ally of state.enemies) {
    if (state.trial?.devourer && (state.trial.devourer.hook?.id === ally.id || state.trial.devourer.flings?.some(f=>f.id===ally.id))) continue;
    if (ally === e || ally.type === 'aegis_construct' || (ally.twin?.downedTicks ?? 0) > 0) continue;
    if (isBossType(ally.type) || ally.type === 'queen_echo' || (isChallengeObject(ally.type) && ally.type !== 'lost_soul') || ally.type === 'soulless' || ally.type === 'toxic_soulless') continue; // Lost Souls are food; a Soulless is not
    const d = tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY);
    if (d <= nearestDist) { nearest = ally; nearestDist = d; }
  }
  return nearest;
}

function devourerAbsorbCooldown(state: GameState, e: Enemy) {
  // Generation g adds 3s + 4s + ... : g * 180 + 60 * g(g-1)/2 ticks.
  const g = devourerStatGeneration(e);
  const cooldown=(state.trial?.devourer ? SINGULARITY_CHALLENGE.mealCooldown : DEVOURER_ABSORB_COOLDOWN) + (DEVOURER_ABSORB_COOLDOWN_PER_GEN * g + DEVOURER_ABSORB_COOLDOWN_GEN_STEP * g * (g - 1) / 2) * (state.trial?.devourer ? SINGULARITY_CHALLENGE.mealPenalty : 1);
  return state.trial?.devourer ? Math.min(SINGULARITY_CHALLENGE.mealMaxCooldown, cooldown) : cooldown;
}

// The generation used for weakening. In the Singularity it stops at weakestGeneration, so later copies are never
// smaller, slower, weaker or lower in HP than the second generation, and killing by hand never grinds the swarm down.
function devourerStatGeneration(e: Enemy) {
  const g = e.devourer?.generation ?? 0;
  return e.devourer?.challenge ? Math.min(g, SINGULARITY_CHALLENGE.weakestGeneration) : g;
}
// Visual size: each stack swells the body; each generation of copies is smaller.
export function devourerBodyScale(e: Enemy) {
  const scale=Math.pow(e.devourer?.challenge ? SINGULARITY_CHALLENGE.generationScale : DEVOURER_COPY_SCALE, devourerStatGeneration(e));
  const gorge=e.devourer?.gorgeTicks,swell=gorge===undefined?1:1+.3*(1-gorge/SINGULARITY_CHALLENGE.gorgeTicks)+.06*Math.sin(gorge*.6); // a full body swells and throbs before it bursts
  return (1 + e.chargeDirX * 0.1) * (e.devourer?.challenge ? Math.max(SINGULARITY_CHALLENGE.minimumScale,scale) : scale) * swell;
}

// Each stack bursts out as a fresh copy on nearby floor; copies start empty but can eat and split again.
function devourerFamilyRoom(state: GameState, parent: Enemy) {
  // Shared family limit applies to death-splits and self-splits.
  const cap = state.trial?.devourer ? SINGULARITY_CHALLENGE.familyCap[state.trial.devourer.phase - 1] : DEVOURER_FAMILY_CAP;
  return cap - state.enemies.filter(other => other !== parent && other.type === 'devourer' && (other.encounterId ?? other.id) === (parent.encounterId ?? parent.id) && other.hp > 0).length;
}

/** Singularity: a meal adds `stacks` stacks (each +stackHP, healing it to full). Reaching the phase's full stacks lights
 * its fuse: it swells and bursts gorgeTicks later (explodeDevourer), unless a Maw swallows it first. */
function feedSingularityBody(state: GameState, e: Enemy, stacks: number) {
  const cap = bodyStackCap(state.trial!.devourer!.phase, e), add = Math.max(0, Math.min(stacks, cap - e.chargeDirX));
  e.chargeDirX += add; e.maxHp += add * SINGULARITY_CHALLENGE.stackHP; e.hp = e.maxHp;
  (e.devourer ??= { generation: 0 }).mealSpeedTicks = SINGULARITY_CHALLENGE.mealSpeedTicks;
  if (e.chargeDirX >= cap && e.devourer && e.devourer.gorgeTicks === undefined) { e.devourer.gorgeTicks = SINGULARITY_CHALLENGE.gorgeTicks; if (devourerSoundAllowed(state, 'fuse')) playAudioOneShot('/sounds/charging.wav', .5, .8); }
}
/** Singularity: a full body explodes, flinging its copies across the whole map. */
export function explodeDevourer(state: GameState, e: Enemy) {
  const trial = state.trial?.devourer; if (!trial) return;
  trial.defeatedMaxHp += e.maxHp;
  // Every burst makes one copy per stack (the original's 7 or 8, a full copy's 3); a body killed by hand leaves one per two.
  const original = (e.devourer?.generation ?? 0) === 0; void original;
  // The burst hits everything nearby before the copies fly out: you (and a shove), a placed Ruby, and other enemies.
  const B = SINGULARITY_CHALLENGE.burst, near = (x: number, y: number) => Math.hypot(x - e.x, y - e.y) <= B.radius * TILE_SIZE;
  if (state.rubyTileX !== -1 && !state.playerCarryingRuby && near((state.rubyTileX + .5) * TILE_SIZE, (state.rubyTileY + .5) * TILE_SIZE)) { damageRuby(state, B.rubyDamage, e); if (state.gamePhase !== 'playing') return; }
  for (const o of state.enemies.filter(o => o !== e && o.hp > 0 && o.type !== 'lost_soul' && near(o.x, o.y))) {
    damageEnemy(state, o, B.enemyDamage, 'special');
    if (o.hp <= 0 && state.enemies.includes(o)) killEnemy(state, state.enemies.indexOf(o), false, true);
    if (state.gamePhase !== 'playing') return;
  }
  const spots = spawnDevourerCopies(state, e, e.chargeDirX * SINGULARITY_CHALLENGE.stacksPerCopy, true);
  (trial.bursts ??= []).push({ x: e.x, y: e.y, ticks: SINGULARITY_BURST_TICKS, to: spots.map(([x, y]) => [(x + .5) * TILE_SIZE, (y + .5) * TILE_SIZE]) });
  state.bombBlasts.push({ cx: e.x, cy: e.y, radius: 0, maxRadius: B.radius * TILE_SIZE, ticks: 30, powered: true });
  if (near(state.playerX, state.playerY)) { damagePlayer(state, B.damage, e); if (state.gamePhase === 'playing') shovePlayerFromEnemy(state, e, B.knock); }
  if (devourerSoundAllowed(state, 'boom')) playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', 1, .8);
  playSFX_devourerAbsorb(state);
  spawnDeathParticles(state, e); // no screen shake: bursts are frequent (Convergence keeps its own)
  const i = state.enemies.indexOf(e); if (i >= 0) state.enemies.splice(i, 1);
}

function spawnDevourerCopies(state: GameState, parent: Enemy, wanted = parent.chargeDirX, acrossMap = false) {
  // Singularity: one copy per stacksPerCopy stacks (rounded up), so the swarm stays small.
  const copies = state.trial?.devourer ? Math.ceil(wanted / SINGULARITY_CHALLENGE.stacksPerCopy) : wanted;
  const count = Math.max(0, Math.min(state.trial?.devourer ? singularityPhaseStacks(state.trial.devourer.phase) : DEVOURER_MAX_STACKS, copies, devourerFamilyRoom(state, parent)));
  const generation = (parent.devourer?.generation ?? 0) + 1;
  // Singularity: every copy has the phase's fixed copyHP; the normal fight halves the parent's.
  const hp = state.trial?.devourer ? SINGULARITY_CHALLENGE.copyHP[state.trial.devourer.phase - 1] : Math.max(1, Math.round(parent.maxHp * DEVOURER_COPY_HP_RATIO));
  const spots: [number, number][] = [];
  for (let r = 0; r <= 3 && spots.length < count; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || spots.length >= count) continue;
      const x = parent.tileX + dx, y = parent.tileY + dy;
      if (isFloorTile(state.map, x, y) && !spots.some(([sx, sy]) => sx === x && sy === y)) spots.push([x, y]);
    }
  }
  while (spots.length < count) spots.push([parent.tileX, parent.tileY]);
  if (acrossMap) { // flung across the map: random open floor in every chamber, away from you
    const far = [0, 1, 2, 3].flatMap(room => freeChamberTiles(state, room)).filter(([x, y]) => Math.hypot(x - state.playerTileX, y - state.playerTileY) >= 4);
    for (let i = 0; i < spots.length && far.length; i++) spots[i] = far.splice(Math.floor(Math.random() * far.length), 1)[0];
  }
  for (const [x, y] of spots) {
    const copy = createEncounterEnemy(state, 'devourer', x, y, hp);
    spawnAbsorbBurst(state, parent.x, parent.y, (x + .5) * TILE_SIZE, (y + .5) * TILE_SIZE);
    copy.encounterId = parent.encounterId ?? parent.id;
    copy.devourer = { generation, ...(state.trial?.devourer ? { challenge: true } : {}), newbornTicks: DEVOURER_NEWBORN_TICKS, originMaxHp: parent.devourer?.originMaxHp ?? parent.maxHp };
    copy.windupTicks = state.trial?.devourer ? SINGULARITY_CHALLENGE.firstMeal : DEVOURER_COPY_FIRST_MEAL;
    if(state.trial?.devourer)copy.chargeDirX = 0; // Singularity: copies start empty and build stacks by eating
    const shell = SINGULARITY_CHALLENGE.shell; // Singularity phase 3: some copies carry a Void Shell
    if (state.trial?.devourer && state.trial.devourer.phase >= shell.fromPhase && Math.random() < shell.chance) copy.icyShieldHP = shell.hp;
    copy.attackTimer = 45; copy.visualSpawnTicks = 30; copy.healFlashTicks = 26;
    if (acrossMap && state.trial?.devourer) copy.devourer.landTicks = SINGULARITY_LAND_TICKS; // Singularity: flung up and falls onto its spot
    state.enemies.push(copy);
  }
  return spots;
}

export function createEncounterEnemy(state: GameState, type: EnemyType, tx: number, ty: number, hp: number): Enemy {
  return {
    id: state.nextEnemyId++, type, x: (tx + .5) * TILE_SIZE, y: (ty + .5) * TILE_SIZE,
    tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty, stepProgress: 0, hp, maxHp: hp,
    path: [], pathTimer: 0, attackTimer: 60, targeting: 'player',
    pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0, shootTicks: 0,
    exploding: false, explodeTick: 0, windupTicks: 0, chargeDirX: 0, chargeDirY: 0,
    shieldTargetId: -1, phaseTimer: 0, icyShieldHP: 0,
  };
}

export function freeChamberTiles(state: GameState, chamber: number): [number, number][] {
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[chamber];
  const tiles: [number, number][] = [];
  for (let y = r1 + 1; y < r2; y++) for (let x = c1 + 1; x < c2; x++) {
    if (state.map[y]?.[x] !== T_FLOOR || x === state.playerTileX && y === state.playerTileY ||
        x === state.rubyTileX && y === state.rubyTileY ||
        state.enemies.some(e => e.tileX === x && e.tileY === y)) continue;
    tiles.push([x, y]);
  }
  return tiles;
}

function summonAegisConstructs(state: GameState, boss: Enemy) {
  const chambers = [0, 1, 2, 3];
  for (let i = 0; i < 2; i++) {
    const chamber = chambers.splice(Math.floor(Math.random() * chambers.length), 1)[0];
    const tiles = freeChamberTiles(state, chamber);
    if (!tiles.length) continue;
    const [x, y] = tiles[Math.floor(Math.random() * tiles.length)];
    const construct = createEncounterEnemy(state, 'aegis_construct', x, y, ENEMY_CONFIGS.aegis_construct.maxHp + state.bossesKilled * 3);
    construct.constructOwnerId = boss.id;
    construct.totem = { ageTicks: 0, overloadTicks: 0 };
    construct.visualSpawnTicks = 30;
    state.enemies.push(construct);
  }
  const wasExposed = boss.aegis && !boss.aegis.shielded;
  boss.aegis = { shielded: true, exposedUntilTick: 0, constructsLeft: 2, openAmount: boss.aegis?.openAmount ?? 0, reflectTicks: 0, brokenOnce: boss.aegis?.brokenOnce ?? false, reshieldTicks: 0 };
  if (wasExposed) encounterEffect(state, 'shield-form', boss, boss.x, boss.y, 30, '#78dedf');
  refreshAegisShield(state, boss);
}

function refreshAegisShield(state: GameState, boss: Enemy) {
  if (!boss.aegis || state.venus) return; // Venus runs its own shield (the totem sequence)
  const count = state.enemies.filter(e => e.constructOwnerId === boss.id && e.hp > 0).length;
  boss.aegis.constructsLeft = count;
  if (boss.aegis.shielded && count === 0) {
    boss.aegis.shielded = false;
    boss.aegis.brokenOnce = true;
    boss.aegis.exposedUntilTick = state.gameTick + AEGIS_EXPOSE_TICKS;
    boss.flashTicks = 20;
    encounterEffect(state, 'shield-break', boss, boss.x, boss.y, 30, '#78dedf');
    playSFX_objectBreak('aegis');
  }
}

function initializeNewEncounter(state: GameState, boss: Enemy, playArrivalSound = true) {
  boss.encounterId ??= boss.id;
  if (boss.type === 'aegis_sentinel' || boss.type === 'astral_twins') boss.visualSpawnTicks = 30;
  if (boss.type === 'aegis_sentinel') { if (state.venus) initializeVenusBoss(state, boss); else summonAegisConstructs(state, boss); }
  if (boss.type === 'sea_chanter' && state.neptune) {
    // Neptune guardian: one body carrying all three phases; the challenge controls her dives.
    boss.hp = boss.maxHp = NEPTUNE_TOTAL_HP;
    state.neptune.bossId = boss.id; state.neptune.phase = 1;
    state.neptune.refrain = null; state.neptune.refrainTimer = undefined; state.neptune.refrainResult = undefined; state.neptune.notePulses = [];
    if (state.neptune.refrainFullPending) state.neptune.healCharge = NEPTUNE_HEAL_CHARGE_MAX;
    state.neptune.refrainFullPending = false;
    state.neptune.armed = NEPTUNE_DIVE_POINTS[1].map(() => true);
    (boss.sea ??= createSeaChanterAbilities()).neptune = true;
  }
  if (boss.type === 'thorn_weaver' && state.gaia) initializeGaiaBoss(state, boss);
  if (boss.type === 'splitter_queen' && state.moon) initializeMoonBoss(state, boss, playArrivalSound);
  if (boss.type === 'fiery_king' && state.sun) initializeSunBoss(state, boss);
  if (boss.type === 'storm_reaper' && state.jupiter) initializeJupiterBoss(state, boss);
  if (boss.type === 'frost_warden' && state.saturn) initializeSaturnBoss(state, boss);
  if (boss.type === 'blind_prayer' && state.sirius) initializeSiriusBoss(state, boss);
  if (boss.type === 'devourer') {
    boss.chargeDirX = state.trial?.devourer ? singularityPhaseStacks(state.trial.devourer.phase) : DEVOURER_START_STACKS; // challenge originals begin full; copies still start empty
    // Its swarm multiplies effective HP, so it scales slower than the usual +15 per defeat.
    boss.hp = boss.maxHp = state.trial?.devourer ? singularityPhaseHP(state.trial.devourer.phase) : ENEMY_CONFIGS.devourer.maxHp + state.bossesKilled * DEVOURER_HP_PER_DEFEAT;
    boss.devourer = { generation: 0, originMaxHp: boss.maxHp, ...(state.trial?.devourer ? { challenge: true, gorgeTicks: SINGULARITY_CHALLENGE.gorgeTicks } : {}) }; // Singularity: the full original bursts after 2s
    if (state.trial?.devourer) {
      const trial=state.trial.devourer;
      trial.encounterId=boss.encounterId!;trial.defeatedMaxHp=0;trial.phaseStartTick=state.gameTick;
      trial.convergence=undefined;trial.convergenceTimer=SINGULARITY_CHALLENGE.convergence.everyTicks;
      trial.hook=undefined;trial.hookCooldown=0;trial.flings=[];trial.hookFx=[];trial.feast=undefined;trial.jaw=undefined;trial.jawTimer=undefined;trial.gas=[];
      // Lost Souls, the Soulless and their signs all carry over into the next phase.
    }
  }
  if (boss.type !== 'astral_twins') return;
  // One encounter's +15 HP per stage is shared between its two bodies.
  boss.hp = boss.maxHp = ENEMY_CONFIGS.astral_twins.maxHp + state.bossesKilled * 7.5;
  boss.twin = { pairId: boss.id, index: 0, downedTicks: 0, partnerDownTicks: 0, transferTicks: TWIN_TRANSFER_MIN_TICKS + Math.floor(Math.random() * (TWIN_TRANSFER_MAX_TICKS - TWIN_TRANSFER_MIN_TICKS + 1)) };
  const chamber = chamberOfTile(boss.tileX, boss.tileY);
  const tiles = freeChamberTiles(state, chamber).filter(([x, y]) => {
    const distance = Math.hypot(x - boss.tileX, y - boss.tileY);
    return distance >= TWIN_MIN_SEPARATION && distance <= 8;
  });
  const [x, y] = tiles.length ? tiles[Math.floor(Math.random() * tiles.length)] : [boss.tileX, boss.tileY];
  const twin = createEncounterEnemy(state, 'astral_twins', x, y, boss.maxHp);
  twin.encounterId = boss.encounterId;
  twin.twin = { ...boss.twin, index: 1 };
  twin.attackTimer = 90;
  twin.visualSpawnTicks = 30;
  state.enemies.push(twin);
  if (state.binary) initializeBinaryTwins(state, boss);
}

function updateBossEncounters(state: GameState) {
  state.encounterEffects = state.encounterEffects.filter(fx => --fx.ticks > 0);
  for (const boss of [...state.enemies]) {
    if (boss.hp <= 0) continue;
    if ((boss.visualSpawnTicks ?? 0) > 0) boss.visualSpawnTicks = (boss.visualSpawnTicks ?? 0) - 1;
    if (boss.totem && boss.venusOrder === undefined && !isEclipseActive(state)) updateTotemOverload(state, boss); // Venus totems run their own overload
    if (boss.aegis) {
      refreshAegisShield(state, boss);
      // The last seconds of exposure count down with a closing frame and a beep each second.
      const reshieldLeft = boss.aegis.shielded ? 0 : boss.aegis.exposedUntilTick - state.gameTick;
      boss.aegis.reshieldTicks = reshieldLeft > 0 && reshieldLeft <= AEGIS_RESHIELD_WARNING_TICKS ? reshieldLeft : 0;
      if (boss.aegis.reshieldTicks && boss.aegis.reshieldTicks % 60 === 0) playSFX_aegisReshieldWarning(boss.aegis.reshieldTicks <= 60);
      if (!state.venus && !boss.aegis.shielded && state.gameTick >= boss.aegis.exposedUntilTick) summonAegisConstructs(state, boss);
      const target = boss.aegis.shielded ? 0 : 1;
      const previous = boss.aegis.openAmount ?? target;
      boss.aegis.openAmount = previous + Math.max(-1 / 24, Math.min(1 / 24, target - previous));
      if ((boss.aegis.reflectTicks ?? 0) > 0) boss.aegis.reflectTicks = (boss.aegis.reflectTicks ?? 0) - 1;
    }
    if ((boss.twin?.fallTicks ?? 0) > 0) boss.twin!.fallTicks = (boss.twin!.fallTicks ?? 0) - 1;
    if ((boss.twin?.reviveTicks ?? 0) > 0) boss.twin!.reviveTicks = (boss.twin!.reviveTicks ?? 0) - 1;
    if ((boss.twin?.hasteTicks ?? 0) > 0) boss.twin!.hasteTicks = (boss.twin!.hasteTicks ?? 0) - 1;
    if ((boss.twin?.transferGiveTicks ?? 0) > 0) boss.twin!.transferGiveTicks = (boss.twin!.transferGiveTicks ?? 0) - 1;
    if ((boss.twin?.transferGetTicks ?? 0) > 0) boss.twin!.transferGetTicks = (boss.twin!.transferGetTicks ?? 0) - 1;
    // Binary Star: a fallen twin cannot revive while it is stunned; its revival timer waits for the stun to end.
    if (boss.twin?.downedTicks && !(state.binary && (boss.buildStopUntil ?? 0) > state.gameTick)) {
      if (--boss.twin.downedTicks === 0) {
        let ratio = TWIN_REVIVE_HP_RATIO;
        if (state.binary) { // Binary Star revives weaker, and weaker again from a twin's second revival in a phase
          const t = boss.twin, phase = state.binary.phase;
          if (t.revivePhase !== phase) { t.revivePhase = phase; t.revives = 0; }
          t.revives = (t.revives ?? 0) + 1;
          ratio = t.revives >= 2 ? BINARY.lateReviveHpRatio : BINARY.reviveHpRatio;
        }
        boss.hp = Math.max(1, boss.maxHp * ratio);
        boss.icyShieldHP = 0; boss.healFlashTicks = 30; boss.attackTimer = 60;
        boss.path = []; boss.pathTimer = 0;
        boss.twin.reviveTicks = 48; boss.twin.hasteTicks = TWIN_REVIVE_HASTE_TICKS;
        encounterEffect(state, 'revive', boss, boss.x, boss.y, 48, boss.twin.index === 1 ? '#83cfff' : '#f08062');
        playSFX_twinRevive();
      }
    }
  }
  for (const leader of state.enemies) {
    if (!leader.twin || leader.twin.index !== 0) continue;
    const partner = state.enemies.find(e => e !== leader && e.twin?.pairId === leader.twin!.pairId);
    if (!partner?.twin) continue;
    leader.twin.partnerDownTicks = partner.twin.downedTicks;
    partner.twin.partnerDownTicks = leader.twin.downedTicks;
    if (leader.twin.downedTicks || partner.twin.downedTicks || isEclipseActive(state)) continue;
    if (--leader.twin.transferTicks > 0) continue;
    leader.twin.transferTicks = TWIN_TRANSFER_MIN_TICKS + Math.floor(Math.random() * (TWIN_TRANSFER_MAX_TICKS - TWIN_TRANSFER_MIN_TICKS + 1)) + (state.binary ? BINARY.transferDelay : 0); // Binary Star: 4s rarer
    const transfers = [[leader, partner], [partner, leader]].filter(([donor, receiver]) => donor.hp > 1 && receiver.hp < receiver.maxHp);
    if (!transfers.length) continue;
    const [donor, receiver] = transfers[Math.floor(Math.random() * transfers.length)];
    const amount = Math.min(donor.hp * TWIN_TRANSFER_RATIO, receiver.maxHp - receiver.hp, donor.hp - 1);
    donor.hp -= amount; receiver.hp += amount;
    donor.twin!.transferGiveTicks = TWIN_TRANSFER_FX_TICKS; receiver.twin!.transferGetTicks = TWIN_TRANSFER_FX_TICKS;
    const transfer = encounterEffect(state, 'transfer', donor, receiver.x, receiver.y, TWIN_TRANSFER_FX_TICKS, donor.twin!.index === 1 ? '#83cfff' : '#f08062');
    transfer.targetId = receiver.id;
    playSFX_twinTransfer();
  }
}

function updateTotemOverload(state: GameState, e: Enemy) {
  const totem = e.totem!;
  if (totem.overloadTicks <= 0) {
    if (++totem.ageTicks >= TOTEM_LIFETIME_TICKS) totem.overloadTicks = TOTEM_OVERLOAD_WINDUP;
    return;
  }
  const chamber = chamberOfTile(e.tileX, e.tileY);
  if (totem.overloadTicks % 60 === 0) playSFX_meteorWarning(totem.overloadTicks <= 60);
  if (--totem.overloadTicks > 0) return;
  encounterEffect(state, 'totem-overload', e, e.x, e.y, 36, '#ffce8a');
  if (chamber >= 0 && chamberOfTile(state.playerTileX, state.playerTileY) === chamber) {
    damagePlayer(state, TOTEM_OVERLOAD_DAMAGE);
    state.screenShakeTicks = Math.max(state.screenShakeTicks, 22);
    state.screenShakeAmt = Math.max(state.screenShakeAmt, 8);
  }
  playSFX_totemExplosion();
  const occupied = new Set(state.enemies.filter(other => other !== e && other.constructOwnerId === e.constructOwnerId && other.hp > 0).map(other => chamberOfTile(other.tileX, other.tileY)));
  const chambers = [0, 1, 2, 3].filter(ch => ch !== chamber && !occupied.has(ch));
  const destination = chambers[Math.floor(Math.random() * chambers.length)];
  const tiles = freeChamberTiles(state, destination);
  if (tiles.length) {
    const [x, y] = tiles[Math.floor(Math.random() * tiles.length)];
    Object.assign(e, { tileX: x, tileY: y, targetTileX: x, targetTileY: y, x: (x + .5) * TILE_SIZE, y: (y + .5) * TILE_SIZE, stepProgress: 0 });
  }
  e.hp = e.maxHp; e.icyShieldHP = 0; e.visualSpawnTicks = 30; e.path = []; e.pushTiles = 0;
  totem.ageTicks = 0; totem.overloadTicks = 0;
}

// Dusk picks its own firing spot: about 7 tiles from the player, off their row/column, near its current position.
function twinRangedPath(state: GameState, e: Enemy, goalX = state.playerTileX, goalY = state.playerTileY): [number, number][] {
  const start = e.targetTileY * MAP_COLS + e.targetTileX;
  const queue = [start], parents = new Map<number, number>([[start, -1]]), distances = new Map<number, number>([[start, 0]]);
  let best = start, bestScore = Infinity;
  for (let i = 0; i < queue.length; i++) {
    const tile = queue[i], x = tile % MAP_COLS, y = Math.floor(tile / MAP_COLS), steps = distances.get(tile)!;
    const playerDistance = tileEuclidDist(x, y, goalX, goalY);
    const aligned = Math.abs(x - goalX) < 2 || Math.abs(y - goalY) < 2;
    const score = Math.abs(playerDistance - 7) + Math.max(0, playerDistance - TWIN_RANGED_RANGE) * 2 +
      (aligned ? 8 : 0) + steps * .12;
    if (score < bestScore) { best = tile; bestScore = score; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, key = ny * MAP_COLS + nx;
      if (!isFloorTile(state.map, nx, ny) || parents.has(key)) continue;
      parents.set(key, tile); distances.set(key, steps + 1); queue.push(key);
    }
  }
  const path: [number, number][] = [];
  while (best !== start && best !== -1) {
    path.push([best % MAP_COLS, Math.floor(best / MAP_COLS)]); best = parents.get(best)!;
  }
  return path.reverse();
}

/** The survivor's berserk multipliers while its partner is down; the Binary Star challenge makes them much harsher. */
export function twinBerserk(state: GameState, e: Enemy) {
  const base = !e.twin?.partnerDownTicks ? { speed: 1, cooldown: 1, damage: 1 }
    : state.binary ? BINARY.berserk : { speed: TWIN_BERSERK_SPEED_MULT, cooldown: TWIN_BERSERK_COOLDOWN_MULT, damage: 1 };
  return state.binary ? { ...base, damage: base.damage * BINARY.twinDamage } : base; // Binary Star: twin attacks deal twinDamage
}

function updateAstralTwin(state: GameState, e: Enemy) {
  if (state.binary && binaryTwinBusy(state, e)) return; // Binary Star: Dawn is marking or running her Comet Dash
  const twin = e.twin!;
  // Each twin hunts on its own path; there is no leash or regrouping. Like most aliens, each goes for whichever is
  // closer to it: you, or a placed Ruby (you while you carry it).
  const rubyPlaced = state.rubyTileX !== -1 && !state.playerCarryingRuby;
  const toRuby = rubyPlaced && tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) < tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
  e.targeting = toRuby ? 'ruby' : 'player';
  const goalTX = toRuby ? state.rubyTileX : state.playerTileX, goalTY = toRuby ? state.rubyTileY : state.playerTileY;
  const goalX = toRuby ? (state.rubyTileX + .5) * TILE_SIZE : state.playerX, goalY = toRuby ? (state.rubyTileY + .5) * TILE_SIZE : state.playerY;
  if (e.attackTimer > 0) e.attackTimer--;
  const ranged = twin.index === 1;
  const berserk = twinBerserk(state, e), berserkCooldown = berserk.cooldown;
  const inRange = tileEuclidDist(e.tileX, e.tileY, goalTX, goalTY) <= (ranged ? TWIN_RANGED_RANGE : 1);
  const chamber = chamberOfTile(e.tileX, e.tileY);
  const canTrack = inRange && chamber >= 0 && chamber === chamberOfTile(goalTX, goalTY);
  if (ranged) {
    twin.shotAimX = goalTX; twin.shotAimY = goalTY;
    twin.shotTargetX = goalX; twin.shotTargetY = goalY;
  } else {
    e.windupTicks = inRange && e.attackTimer > 0 && e.attackTimer <= 12 ? e.attackTimer : 0;
  }

  if (ranged && e.windupTicks > 0) {
    if (!canTrack) e.windupTicks = 0;
    else {
      if (--e.windupTicks === 0) {
        state.laserBeams.push({ fromX: e.x, fromY: e.y, endX: goalX, endY: goalY,
          dirX: 0, dirY: 0, ticks: 18, color: '#89cbff' });
        if (toRuby) damageRuby(state, Math.round(TWIN_RANGED_DAMAGE * ENEMY_CONFIGS.astral_twins.damageToRuby / ENEMY_CONFIGS.astral_twins.damageToPlayer) * berserk.damage, e);
        else damagePlayer(state, TWIN_RANGED_DAMAGE * berserk.damage, e);
        playSFX_enemyAttack(e); e.shootTicks = 14; e.attackTimer = Math.round(TWIN_RANGED_COOLDOWN * berserkCooldown);
        encounterEffect(state, 'shot', e, goalX, goalY, 18, '#83cfff');
      }
      return;
    }
  }
  if (inRange && e.attackTimer <= 0) {
    if (ranged && canTrack) {
      twin.shotAimX = goalTX; twin.shotAimY = goalTY; e.windupTicks = TWIN_RANGED_WINDUP;
      return;
    }
    if (!ranged) {
      twin.strikeAngle = Math.atan2(goalY - e.y, goalX - e.x);
      if (toRuby) damageRuby(state, ENEMY_CONFIGS.astral_twins.damageToRuby * berserk.damage, e);
      else { damagePlayer(state, ENEMY_CONFIGS.astral_twins.damageToPlayer * berserk.damage, e); shovePlayerFromEnemy(state, e, TWIN_MELEE_KNOCKBACK); }
      playSFX_enemyAttack(e);
      encounterEffect(state, 'melee', e, goalX, goalY, 22, '#f08062');
      e.shootTicks = 22; e.attackTimer = Math.round(ENEMY_CONFIGS.astral_twins.attackCooldown * berserkCooldown);
    }
  }
  e.pathTimer--;
  if (e.pathTimer <= 0) {
    e.path = ranged ? twinRangedPath(state, e, goalTX, goalTY) : bfs(state.map, e.targetTileX, e.targetTileY, goalTX, goalTY);
    e.pathTimer = 18;
  }
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    // The melee twin holds its attack position; the ranged twin keeps repositioning during cooldown.
    if (!ranged && inRange) return;
    const next = e.path.shift();
    if (!next || !isFloorTile(state.map, next[0], next[1])) return;
    [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0;
  } else {
    const haste = ((e.twin?.hasteTicks ?? 0) > 0 ? TWIN_REVIVE_HASTE_MULT : 1) * berserk.speed;
    e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + (ranged ? TWIN_RANGED_SPEED : ENEMY_CONFIGS.astral_twins.speed) * haste * celestialMoveMultiplier(state, e));
    e.x = (e.tileX + .5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
    e.y = (e.tileY + .5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
    if (e.stepProgress === TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
  }
}

function createThornAbilities(): ThornAbilities {
  return { cooldown: THORN_FIRST_DELAY, defenseCooldown: 0, windupTicks: 0, aimX: 0, aimY: 0, fleeing: false };
}
export function clearThornHazards(state: GameState) {
  stopPoisonSound();
  state.thornPatches = []; state.thornPoisonTicks = 0; state.thornPoisonTimer = 0; state.thornWasInside = false; state.thornContactTimer = 0;
}
let poisonVoice: HTMLAudioElement | null = null;
let poisonSoundGap = 0;
export function stopPoisonSound() {
  if (poisonVoice) { poisonVoice.onended = null; poisonVoice.pause(); poisonVoice.currentTime = 0; poisonVoice = null; }
  poisonSoundGap = 0;
}
function updatePoisonSound(state: GameState) {
  if (state.gamePhase !== 'playing' || state.thornPoisonTicks <= 0 || (typeof document !== 'undefined' && document.hidden)) { stopPoisonSound(); return; }
  if (poisonVoice) return;
  if (poisonSoundGap > 0) { poisonSoundGap--; return; }
  try {
    const voice = gameAudio('/sounds/poisoned.wav');
    voice.volume = .28 * ATTACK_SFX_VOLUME; voice.loop = false;
    voice.onended = () => {
      if (poisonVoice !== voice) return;
      poisonVoice = null; poisonSoundGap = 36; // A 0.6-second gap at 60 ticks/sec.
    };
    poisonVoice = voice;
    voice.play().catch(() => { if (poisonVoice === voice) { poisonVoice = null; poisonSoundGap = 60; } });
  } catch { poisonVoice = null; poisonSoundGap = 60; }
}

// The Weaver's field: a falling sound timed to land as the seed hits and the thorns erupt.
const THORN_FALL_SOUND_TICKS = 45; // falling-thing.wav is 0.75s long
export function playThornFall() {
  try { const sound = gameAudio('/sounds/falling-thing.wav', 'attack'); sound.volume = 0.6 * ATTACK_SFX_VOLUME; sound.play().catch(() => {}); } catch { }
}

export function playThornCut() {
  try { const sound = gameAudio('/sounds/cut.mp3', 'attack'); sound.volume = 0.95 * ATTACK_SFX_VOLUME; sound.play().catch(() => {}); } catch { }
}
function applyThornPoison(state: GameState) {
  state.thornPoisonTicks = THORN_POISON_TICKS;
  if (state.thornPoisonTimer <= 0) state.thornPoisonTimer = THORN_POISON_INTERVAL;
}
export function isPlayerInThorns(state: GameState): boolean {
  if (!isFloorTile(state.map, Math.floor(state.playerX / TILE_SIZE), Math.floor(state.playerY / TILE_SIZE))) return false;
  return (state.thornPatches ?? []).some(p => p.ticks > 0 && thornFieldContainsTile(p,Math.floor(state.playerX/TILE_SIZE),Math.floor(state.playerY/TILE_SIZE)));
}
function isPlayerInThornField(state: GameState,x: number,y: number,radius = THORN_RADIUS): boolean {
  const bounds=getThornFieldBounds(x,y,radius);
  return isFloorTile(state.map,Math.floor(state.playerX/TILE_SIZE),Math.floor(state.playerY/TILE_SIZE)) &&
    state.playerX>=bounds.left&&state.playerX<bounds.right&&state.playerY>=bounds.top&&state.playerY<bounds.bottom;
}
function eruptThornField(state: GameState, e: Enemy, x: number, y: number, radius = THORN_RADIUS) {
  if (gaiaStoneBlocksField(state, e, x, y, radius)) return; // Gaia: a Sunstone burns the field away
  const center = getThornFieldBounds(x, y, radius);
  (state.thornPatches ??= []).push({ x: center.x, y: center.y, radius, ticks: THORN_LIFETIME, ownerId: e.id });
  if (state.thornPatches.length > THORN_MAX_PATCHES) state.thornPatches.shift();
  if (isPlayerInThornField(state, center.x, center.y, radius)) {
    damagePlayer(state, ENEMY_CONFIGS.thorn_weaver.damageToPlayer, e); applyThornPoison(state);
    playThornCut(); state.thornWasInside = true; state.thornContactTimer = THORN_CONTACT_INTERVAL;
  }
  // Gaia: the eruption also cuts a placed Ruby inside it (less than it cuts you).
  if (state.gaia && state.rubyTileX !== -1) {
    const rx = (state.rubyTileX + .5) * TILE_SIZE, ry = (state.rubyTileY + .5) * TILE_SIZE, b = getThornFieldBounds(center.x, center.y, radius);
    if (rx >= b.left && rx < b.right && ry >= b.top && ry < b.bottom) { damageRuby(state, GAIA_THORN_RUBY_CUT, e); state.gaia.rubyThornTimer = THORN_CONTACT_INTERVAL; }
  }
  e.shootTicks = 14;
  try { const sound = gameAudio('/sounds/place-plant.mp3', 'attack'); sound.volume = 0.4 * ATTACK_SFX_VOLUME; sound.play().catch(() => {}); } catch { }
}
function updateThornWeaver(state: GameState, e: Enemy) {
  if (e.hp <= 0) return;
  const gaia = state.gaia, gaiaBoss = !!gaia && e.id === gaia.bossId;
  const thorn = e.thorn ??= createThornAbilities();
  thorn.defenseCooldown = Math.max(0, (thorn.defenseCooldown ?? 0) - 1);
  if (thorn.defenseCooldown === 0 && Math.hypot(e.x - state.playerX, e.y - state.playerY) <= THORN_DEFENSE_TRIGGER_RANGE) {
    eruptThornField(state, e, e.x, e.y, THORN_DEFENSE_RADIUS);
    thorn.defenseCooldown = THORN_DEFENSE_COOLDOWN;
  }
  if (thorn.windupTicks > 0) {
    if (thorn.windupTicks === THORN_FALL_SOUND_TICKS) playThornFall();
    if (--thorn.windupTicks === 0) {
      eruptThornField(state, e, thorn.aimX, thorn.aimY);
      if (thorn.aim2) { eruptThornField(state, e, thorn.aim2.x, thorn.aim2.y); thorn.aim2 = null; }
      thorn.cooldown = state.gaia ? GAIA_CAST_COOLDOWN : ENEMY_CONFIGS.thorn_weaver.attackCooldown; // casts faster in the Gaia challenge
    }
  } else if (thorn.cooldown > 0) thorn.cooldown--;
  else {
    // Global ground targeting: cover and distance cannot cancel the attack; leaving the marked area can.
    const aim=getThornFieldBounds(state.playerX,state.playerY);
    thorn.aimX = aim.x; thorn.aimY = aim.y; thorn.windupTicks = THORN_WINDUP;
    thorn.aim2 = gaiaBoss && gaia!.phase === 3 ? gaiaTwinFieldAim(state) : null;
  }
  e.pathTimer--;
  if (e.pathTimer <= 0) {
    const threatened = tileEuclidDist(e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY) <= THORN_FLEE_RANGE;
    if (threatened) e.path = fleePath(state, e);
    else if (gaiaBoss && gaiaLevel(state, e.targetTileX, e.targetTileY) >= 2) e.path = []; // on overgrowth: stay and heal
    else if (gaiaBoss) e.path = gaiaSeekPath(state, e) ?? (thorn.fleeing || e.path.length === 0 ? roamPath(state, e) : e.path);
    else if (thorn.fleeing || e.path.length === 0) e.path = roamPath(state, e);
    thorn.fleeing = threatened; e.pathTimer = 30;
  }
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    const next = e.path.shift();
    if (next && isFloorTile(state.map, next[0], next[1])) { [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0; }
  } else {
    e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + ENEMY_CONFIGS.thorn_weaver.speed * celestialMoveMultiplier(state,e));
    e.x = (e.tileX + 0.5) * TILE_SIZE + (e.targetTileX - e.tileX) * e.stepProgress;
    e.y = (e.tileY + 0.5) * TILE_SIZE + (e.targetTileY - e.tileY) * e.stepProgress;
    if (e.stepProgress === TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
  }
}
function updateThornHazards(state: GameState) {
  state.thornPatches ??= [];
  if (!state.enemies.some(e => e.type === 'thorn_weaver' && e.hp > 0)) { clearThornHazards(state); return; }
  state.thornPatches = state.thornPatches.filter(p => --p.ticks > 0 && state.enemies.some(e => e.id === p.ownerId && e.hp > 0));
  const inside = isPlayerInThorns(state);
  if (inside) {
    if (!state.thornWasInside) { playThornCut(); state.thornContactTimer = THORN_CONTACT_INTERVAL; }
    applyThornPoison(state);
    if (--state.thornContactTimer <= 0) {
      damagePlayer(state, state.gaia ? GAIA_THORN_CONTACT_DAMAGE : THORN_CONTACT_DAMAGE); playThornCut();
      state.thornContactTimer = THORN_CONTACT_INTERVAL;
    }
  } else state.thornContactTimer = 0;
  state.thornWasInside = inside;
  // Gaia: a placed Ruby inside his field takes a small continuous damage.
  const gaia = state.gaia;
  if (gaia && state.rubyTileX !== -1) {
    const rx = (state.rubyTileX + .5) * TILE_SIZE, ry = (state.rubyTileY + .5) * TILE_SIZE;
    const rubyInside = state.thornPatches.some(p => thornFieldContainsTile(p,state.rubyTileX,state.rubyTileY));
    if (!rubyInside) gaia.rubyThornTimer = THORN_CONTACT_INTERVAL;
    else if (--gaia.rubyThornTimer <= 0) { damageRuby(state, GAIA_THORN_RUBY_DAMAGE); gaia.rubyThornTimer = THORN_CONTACT_INTERVAL; }
  }
  if (state.thornPoisonTicks > 0) {
    state.thornPoisonTicks--;
    if (--state.thornPoisonTimer <= 0) {
      damagePlayer(state, THORN_POISON_DAMAGE); state.thornPoisonTimer = THORN_POISON_INTERVAL;
    }
  } else state.thornPoisonTimer = 0;
}

export function createSeaChanterAbilities(): SeaChanterAbilities {
  return { mode: 'hunting', diveElapsedTicks: 0, diveFleeing: false, healingBlockedUntilTick: 0, songCooldown: SEA_SONG_FIRST_DELAY, songWindupTicks: 0,
    songAimX: 0, songAimY: 0, allyHealCooldown: SEA_ALLY_HEAL_INTERVAL, supportPulseTicks: 0, healPulseTicks: 0, healSoundCooldown: 0, resurfaceTicks: 0, resurfaceX: 0, resurfaceY: 0 };
}

function updateSeaMode(e: Enemy) {
  const sea = e.sea ??= createSeaChanterAbilities();
  if (sea.neptune) return;
  if (sea.mode === 'hunting' && e.hp <= e.maxHp * SEA_DIVE_ENTER_HP) {
    sea.mode = 'diving'; sea.diveElapsedTicks = 0; sea.diveFleeing = false; sea.songWindupTicks = 0; sea.resurfaceTicks = 0;
    playSeaSound('dive'); playSeaSound('diveSinging'); e.pathTimer = 0; e.path = [];
  } else if (sea.mode === 'diving' && e.hp >= e.maxHp * SEA_DIVE_EXIT_HP) {
    sea.mode = 'hunting'; sea.songCooldown = SEA_SONG_FIRST_DELAY;
    sea.allyHealCooldown = SEA_ALLY_HEAL_INTERVAL;
    sea.resurfaceTicks = 36; sea.resurfaceX = e.x; sea.resurfaceY = e.y;
    stopSeaSound('diveSinging');
    sea.songWindupTicks = 0; e.pathTimer = 0; e.path = [];
  }
}

export function roamPath(state: GameState, e: Enemy): [number, number][] {
  const candidates: [number, number][] = [];
  // Short wandering routes keep her swimming around instead of selecting the farthest map corner.
  for (let y = Math.max(0, e.targetTileY - 10); y <= Math.min(state.map.length - 1, e.targetTileY + 10); y++) {
    for (let x = Math.max(0, e.targetTileX - 10); x <= Math.min(state.map[0].length - 1, e.targetTileX + 10); x++) {
      const distance = tileEuclidDist(e.targetTileX, e.targetTileY, x, y);
      if (distance < 4 || distance > 10 || !isFloorTile(state.map, x, y)) continue;
      const openSides = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => isFloorTile(state.map, x + dx, y + dy)).length;
      if (openSides >= 3) candidates.push([x, y]);
    }
  }
  // Try other destinations if a temporary hallway seal makes one unreachable.
  while (candidates.length > 0) {
    const [destination] = candidates.splice(Math.floor(Math.random() * candidates.length), 1);
    const path = bfs(state.map, e.targetTileX, e.targetTileY, destination[0], destination[1]);
    if (path.length > 0) return path;
  }
  return [];
}

function healSeaAllies(state: GameState, e: Enemy, amount: number) {
  let healed = false;
  for (const ally of state.enemies) {
    if (isBossType(ally.type) || ally.type === 'queen_echo' || ally.type === 'aegis_construct' || ally.hp <= 0 ||
        tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) > SEA_ALLY_HEAL_RADIUS) continue;
    const before = ally.hp;
    ally.hp = Math.min(ally.maxHp, ally.hp + amount);
    if (ally.hp > before) { ally.healFlashTicks = 20; healed = true; }
  }
  if (healed) {
    (e.sea ??= createSeaChanterAbilities()).supportPulseTicks = 24;
    playSeaHealing(e);
  }
}

/** Sea Chanter chases you first: you whenever you are in her chamber (so beside Ruby she aims at you); a placed Ruby
 * only when it is in her chamber and you are not; otherwise you. */
function seaGoal(state: GameState, e: Enemy) {
  const room = chamberOfTile(e.tileX, e.tileY);
  const ruby = room >= 0 && state.rubyTileX !== -1 && !state.playerCarryingRuby && !state.enemyDecoyActive &&
    chamberOfTile(state.playerTileX, state.playerTileY) !== room && chamberOfTile(state.rubyTileX, state.rubyTileY) === room;
  e.targeting = ruby ? 'ruby' : 'player';
  return ruby ? { tx: state.rubyTileX, ty: state.rubyTileY, x: (state.rubyTileX + .5) * TILE_SIZE, y: (state.rubyTileY + .5) * TILE_SIZE }
    : { tx: state.playerTileX, ty: state.playerTileY, x: state.playerX, y: state.playerY };
}
function updateSeaChanter(state: GameState, e: Enemy) {
  if (e.hp <= 0) return;
  const sea = e.sea ??= createSeaChanterAbilities();
  updateSeaMode(e);
  if (sea.resurfaceTicks > 0) sea.resurfaceTicks--;
  if (sea.supportPulseTicks > 0) sea.supportPulseTicks--;
  if (sea.healPulseTicks > 0) sea.healPulseTicks--;
  if (sea.healSoundCooldown > 0) sea.healSoundCooldown--;
  if (sea.songCooldown > 0) sea.songCooldown--;
  if (sea.mode === 'hunting') {
    sea.allyHealCooldown = (sea.allyHealCooldown ?? SEA_ALLY_HEAL_INTERVAL) - 1;
    if (sea.allyHealCooldown <= 0) {
      sea.supportPulseTicks = 24;
      healSeaAllies(state, e, SEA_ALLY_PASSIVE_HEAL);
      sea.allyHealCooldown = SEA_ALLY_HEAL_INTERVAL;
    }
  }
  if (sea.mode === 'diving') {
    sea.diveElapsedTicks = (sea.diveElapsedTicks ?? 0) + 1;
    updateSeaMode(e);
  } else if (sea.songWindupTicks > 0) {
    sea.songWindupTicks--;
    if (sea.songWindupTicks === 0) {
      const dx = sea.songAimX - e.x, dy = sea.songAimY - e.y;
      const length = Math.hypot(dx, dy) || 1;
      (state.seaSongWaves ??= []).push({ x: e.x, y: e.y, dx: dx / length, dy: dy / length,
        rangeLeft: length, aimX: sea.songAimX, aimY: sea.songAimY, hitPlayer: false, ownerId: e.id });
      e.shootTicks = 24;
      playSeaSound('attack');
      sea.songCooldown = ENEMY_CONFIGS.sea_chanter.attackCooldown;
    }
  } else if (sea.songCooldown === 0 && e.tileX === e.targetTileX && e.tileY === e.targetTileY &&
      tileEuclidDist(e.tileX, e.tileY, seaGoal(state, e).tx, seaGoal(state, e).ty) <= ENEMY_CONFIGS.sea_chanter.attackRange) {
    const goal = seaGoal(state, e); sea.songAimX = goal.x; sea.songAimY = goal.y;
    sea.songWindupTicks = SEA_SONG_WINDUP;
    playSeaSound('singing');
  }
  // Singing is a stationary, telegraphed ranged attack. Diving never deals damage.
  if (sea.songWindupTicks > 0) return;
  e.pathTimer--;
  if (e.pathTimer <= 0) {
    if (sea.mode === 'diving') {
      const threatened = tileEuclidDist(e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY) <= SEA_DIVE_FLEE_RANGE;
      if (threatened) e.path = fleePath(state, e);
      else if (sea.diveFleeing || e.path.length === 0) e.path = roamPath(state, e);
      sea.diveFleeing = threatened;
    } else {
      const goal = seaGoal(state, e); e.path = bfs(state.map, e.targetTileX, e.targetTileY, goal.tx, goal.ty);
    }
    e.pathTimer = 20;
  }
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    const next = e.path.shift();
    if (next && isFloorTile(state.map, next[0], next[1])) {
      [e.targetTileX, e.targetTileY] = next; e.stepProgress = 0;
    }
  } else {
    const baseSpeed = isSeaChanterDiving(e) ? (sea.neptune ? NEPTUNE_DIVE_SPEED : SEA_DIVE_SPEED) : ENEMY_CONFIGS.sea_chanter.speed;
    const speed = baseSpeed * (sea.neptune ? NEPTUNE_BOSS_SPEED_MULT : 1);
    e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + speed * celestialMoveMultiplier(state,e));
    e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + (e.targetTileX - e.tileX) * e.stepProgress;
    e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + (e.targetTileY - e.tileY) * e.stepProgress;
    if (e.stepProgress === TILE_SIZE) {
      e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0;
    }
  }
}

function updateSeaSongWaves(state: GameState) {
  const bursts = state.seaSongBursts ??= [];
  for (let i = bursts.length - 1; i >= 0; i--) {
    if (--bursts[i].ticks <= 0 || !state.enemies.some(e => e.id === bursts[i].ownerId && e.hp > 0)) bursts.splice(i, 1);
  }
  const waves = state.seaSongWaves ??= [];
  for (let i = waves.length - 1; i >= 0; i--) {
    const wave = waves[i];
    let remove = !state.enemies.some(e => e.id === wave.ownerId && e.hp > 0);
    // Substeps preserve player collision at the faster speed; water magic passes through walls.
    for (let distance = 0; distance < SEA_SONG_SPEED && !remove; distance += 4) {
      const step = Math.min(4, SEA_SONG_SPEED - distance, wave.rangeLeft), bonus = state.neptune ? NEPTUNE_SONG_BONUS : 0;
      wave.x += wave.dx * step; wave.y += wave.dy * step; wave.rangeLeft -= step;
      const decoy=state.lunarDecoy;
      if(decoy && !wave.hitDecoy && Math.hypot(wave.aimX-decoy.x,wave.aimY-decoy.y)>SEA_SONG_HIT_RADIUS && Math.hypot(wave.x-decoy.x,wave.y-decoy.y)<=SEA_SONG_HIT_RADIUS){
        damageLunarDecoy(state,ENEMY_CONFIGS.sea_chanter.damageToPlayer);wave.hitDecoy=true;
      }
      if (!wave.hitPlayer && Math.hypot(wave.aimX - state.playerX, wave.aimY - state.playerY) > SEA_SONG_HIT_RADIUS &&
          Math.hypot(wave.x - state.playerX, wave.y - state.playerY) <= SEA_SONG_HIT_RADIUS) {
        damagePlayer(state, ENEMY_CONFIGS.sea_chanter.damageToPlayer + bonus, state.enemies.find(e => e.id === wave.ownerId)); wave.hitPlayer = true;
      }
      if (!wave.hitRuby && state.rubyTileX !== -1 && !state.playerCarryingRuby) { // the wave washes over a placed Ruby on its way, too
        const rx = (state.rubyTileX + .5) * TILE_SIZE, ry = (state.rubyTileY + .5) * TILE_SIZE;
        if (Math.hypot(wave.aimX - rx, wave.aimY - ry) > SEA_SONG_HIT_RADIUS && Math.hypot(wave.x - rx, wave.y - ry) <= SEA_SONG_HIT_RADIUS) {
          damageRuby(state, ENEMY_CONFIGS.sea_chanter.damageToRuby + bonus, state.enemies.find(e => e.id === wave.ownerId)); wave.hitRuby = true;
        }
      }
      if (wave.rangeLeft <= 0) {
        bursts.push({ x: wave.aimX, y: wave.aimY, ticks: SEA_SONG_BLAST_TICKS, ownerId: wave.ownerId });
        const decoy=state.lunarDecoy;
        if(decoy && !wave.hitDecoy){
          const d=Math.hypot(wave.aimX-decoy.x,wave.aimY-decoy.y);
          if(d<=SEA_SONG_BLAST_RADIUS)damageLunarDecoy(state,Math.round(SEA_SONG_BLAST_DAMAGE_CENTER-(SEA_SONG_BLAST_DAMAGE_CENTER-SEA_SONG_BLAST_DAMAGE_EDGE)*d/SEA_SONG_BLAST_RADIUS));
        }
        const blastDistance = Math.hypot(wave.aimX - state.playerX, wave.aimY - state.playerY);
        if (!wave.hitPlayer && blastDistance <= SEA_SONG_BLAST_RADIUS) {
          const damage = Math.round(SEA_SONG_BLAST_DAMAGE_CENTER -
            (SEA_SONG_BLAST_DAMAGE_CENTER - SEA_SONG_BLAST_DAMAGE_EDGE) * blastDistance / SEA_SONG_BLAST_RADIUS) + bonus;
          damagePlayer(state, damage, state.enemies.find(e => e.id === wave.ownerId));
        }
        // Her bursts also hit a placed Ruby, exactly as hard as they hit you.
        if (state.rubyTileX !== -1 && !state.playerCarryingRuby) {
          const rubyDistance = Math.hypot(wave.aimX - (state.rubyTileX + .5) * TILE_SIZE, wave.aimY - (state.rubyTileY + .5) * TILE_SIZE);
          if (rubyDistance <= SEA_SONG_BLAST_RADIUS) damageRuby(state, Math.round(SEA_SONG_BLAST_DAMAGE_CENTER -
            (SEA_SONG_BLAST_DAMAGE_CENTER - SEA_SONG_BLAST_DAMAGE_EDGE) * rubyDistance / SEA_SONG_BLAST_RADIUS) + bonus, state.enemies.find(e => e.id === wave.ownerId));
        }
        remove = true;
      }
    }
    if (remove) waves.splice(i, 1);
  }
}

function createPrayerAbilities(): PrayerAbilities {
  return {
    rubyCooldown: PRAYER_RUBY_COOLDOWN, rubyCastTicks: 0, rubyDestination: -1,
    rubyOriginX: -1, rubyOriginY: -1,
    escapeCooldown: PRAYER_ESCAPE_GRACE, escapeWindupTicks: 0, escapeBoostTicks: 0,
  };
}

function playSFX_kingArenaFire(warning: boolean) {
  // A soft warning followed by the supplied fire-spell cue on the arena pulse.
  try {
    const sound = gameAudio(warning ? '/sounds/kingFireWarning.wav' : '/sounds/kingFireSpell.mp3');
    sound.volume = (warning ? 0.38 : 0.605) * ATTACK_SFX_VOLUME;
    sound.play().catch(() => {});
  } catch { }
}

function updateKingArenaAttack(state: GameState, e: Enemy) {
  if (e.hp <= 0) return;
  const ability = e.king ??= { untouchedTicks: 0, arenaWindupTicks: 0 };
  if (ability.arenaWindupTicks > 0) {
    ability.arenaWindupTicks--;
    if (ability.arenaWindupTicks === 0) {
      const progress = Math.min(1, e.phaseTimer / (KING_RAMP_SECONDS * 60));
      const damage = KING_ARENA_DAMAGE + Math.floor((KING_ARENA_DAMAGE_MAX - KING_ARENA_DAMAGE) * progress);
      const targetingDecoy=state.enemyDecoyActive;state.enemyDecoyActive=false;
      damagePlayer(state, damage, e);damageLunarDecoy(state,damage);
      state.enemyDecoyActive=targetingDecoy;
      damageRuby(state, damage, e);
      state.kingArenaPulseTicks = KING_ARENA_FX_TICKS;
      state.screenShakeTicks = Math.max(state.screenShakeTicks, 10);
      state.screenShakeAmt = Math.max(state.screenShakeAmt, 3);
      playSFX_kingArenaFire(false);
      ability.untouchedTicks = 0;
      if (state.sun) spawnSunWisps(state, SUN.arenaWisps);
    }
  } else {
    ability.untouchedTicks++;
    if (ability.untouchedTicks >= KING_UNTOUCHED_TICKS) {
      ability.arenaWindupTicks = KING_ARENA_WINDUP;
      playSFX_kingArenaFire(true);
    }
  }
}

function playPrayerSound(path: string, volume: number) {
  try { const sound = gameAudio(path); sound.volume = volume; sound.play().catch(() => {}); } catch { }
}

function prayerBurst(state: GameState, x: number, y: number) {
  for (let i = 0; i < 12; i++) {
    const angle = i * Math.PI / 6;
    state.deathParticles.push({
      x, y, vx: Math.cos(angle) * 2.4, vy: Math.sin(angle) * 2.4,
      ticks: 24, maxTicks: 24, size: 3, color: i % 3 ? '#ffdd22' : '#ffffff',
    });
  }
}

function updatePrayerAbilities(state: GameState, e: Enemy) {
  const ability = e.prayer ??= createPrayerAbilities();
  const cfg = ENEMY_CONFIGS.blind_prayer;
  if (ability.escapeBoostTicks > 0) ability.escapeBoostTicks--;
  if (ability.escapeCooldown > 0) ability.escapeCooldown--;
  const inAttackRange = () => tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= cfg.attackRange &&
    hasLineOfSight(state.map, e.tileX, e.tileY, state.playerTileX, state.playerTileY);
  if (ability.escapeWindupTicks > 0) {
    ability.escapeWindupTicks--;
    if (ability.escapeWindupTicks === 0) {
      (state.prayerWaves ??= []).push({ x: e.x, y: e.y, radius: cfg.attackRange * TILE_SIZE, ticks: 30 });
      if (inAttackRange()) {
        playSFX_laser();
        damagePlayer(state, cfg.damageToPlayer, e);
        if (state.gamePhase !== 'lost' && !state.enemyDecoyActive) {
          const dx = state.playerX - e.x, dy = state.playerY - e.y;
          state.playerKnockback = {
            dirX: Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) || 1 : 0,
            dirY: Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0,
            started: false,
          };
        }
        state.laserBeams.push({ fromX: e.x, fromY: e.y, dirX: 0, dirY: 0,
          endX: state.playerX, endY: state.playerY, ticks: 18, color: '#ffdd22' });
      }
      e.shootTicks = 14; // Brief body pulse synchronized with the escape wave.
      ability.escapeBoostTicks = PRAYER_ESCAPE_DURATION;
      ability.escapeCooldown = cfg.attackCooldown;
      e.pathTimer = 0;
      prayerBurst(state, e.x, e.y);
      playPrayerSound('/sounds/holy2.mp3', 1.0);
    }
  } else if (ability.escapeCooldown === 0 && inAttackRange()) {
    ability.escapeWindupTicks = PRAYER_ESCAPE_WINDUP;
  }

  // Carrying or moving the core cancels the cast and grants a full preparation window.
  if (state.rubyTileX === -1 || (ability.rubyCastTicks > 0 &&
      (state.rubyTileX !== ability.rubyOriginX || state.rubyTileY !== ability.rubyOriginY))) {
    ability.rubyCooldown = PRAYER_RUBY_COOLDOWN;
    ability.rubyCastTicks = 0;
    ability.rubyDestination = -1;
    return;
  }
  if (ability.rubyCooldown > 0) ability.rubyCooldown--;
  if (ability.rubyCastTicks > 0) {
    ability.rubyCastTicks--;
    if (ability.rubyCastTicks === 0) {
      const destination = ability.rubyDestination;
      // Never deliver the Ruby into an active meteor warning, even if it began mid-cast.
      if (destination >= 0 && destination !== state.meteoriteWarning) {
        prayerBurst(state, state.rubyTileX * TILE_SIZE + TILE_SIZE / 2, state.rubyTileY * TILE_SIZE + TILE_SIZE / 2);
        [state.rubyTileX, state.rubyTileY] = TELEPORT_PADS[destination];
        prayerBurst(state, state.rubyTileX * TILE_SIZE + TILE_SIZE / 2, state.rubyTileY * TILE_SIZE + TILE_SIZE / 2);
        showRewardEffect(state, 'ruby', 'restore');
      }
      ability.rubyDestination = -1;
    }
  } else if (ability.rubyCooldown === 0) {
    const current = chamberOfTile(state.rubyTileX, state.rubyTileY);
    const options = [0, 1, 2, 3].filter(ch => ch !== current && ch !== state.meteoriteWarning);
    ability.rubyDestination = options[Math.floor(Math.random() * options.length)];
    ability.rubyOriginX = state.rubyTileX; ability.rubyOriginY = state.rubyTileY;
    ability.rubyCastTicks = PRAYER_RUBY_WINDUP;
    ability.rubyCooldown = PRAYER_RUBY_COOLDOWN;
    playPrayerSound('/sounds/holy1.mp3', 1.0);
  }
}

export function fleePath(state: GameState, e: Enemy): [number, number][] {
  const cols = state.map[0].length;
  const size = cols * state.map.length;
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function explore(x: number, y: number) {
    const distances = new Int32Array(size).fill(-1);
    const parents = new Int32Array(size).fill(-1);
    const start = y * cols + x;
    const queue = [start];
    distances[start] = 0;
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      for (const [dx, dy] of directions) {
        const nx = current % cols + dx, ny = Math.floor(current / cols) + dy;
        if (!isFloorTile(state.map, nx, ny)) continue;
        const next = ny * cols + nx;
        if (distances[next] !== -1) continue;
        distances[next] = distances[current] + 1;
        parents[next] = current;
        queue.push(next);
      }
    }
    return { distances, parents, queue, start };
  }
  // Walking distance accounts for cover walls and corridors, rather than trying to
  // run straight through walls. Re-plan from the tile the current step will reach.
  const threat = explore(state.playerTileX, state.playerTileY);
  const escape = explore(e.targetTileX, e.targetTileY);
  let best = escape.start;
  let bestScore = threat.distances[best];
  for (const tile of escape.queue) {
    if (threat.distances[tile] < 0) continue;
    const score = threat.distances[tile] - escape.distances[tile] * 0.15;
    if (score > bestScore) { best = tile; bestScore = score; }
  }
  const path: [number, number][] = [];
  while (best !== escape.start && best !== -1) {
    path.push([best % cols, Math.floor(best / cols)]);
    best = escape.parents[best];
  }
  return path.reverse();
}

/** Singularity: with no food to chase, a body you just hit hunts you; otherwise it flees from you when you are within
 * fleeRadius tiles, and roams to random spots away from you, routing around the Maws. */
function singularityIdlePath(state: GameState, e: Enemy, angry: boolean, avoid?: (x: number, y: number) => boolean): [number, number][] {
  const R = SINGULARITY_CHALLENGE.fleeRadius;
  if (angry) return bfs(state.map, e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY, avoid, !!avoid);
  if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= R) return fleePath(state, e);
  const d = e.devourer!;
  if (!d.roamTo || (e.targetTileX === d.roamTo[0] && e.targetTileY === d.roamTo[1])) {
    const spots = [0, 1, 2, 3].flatMap(room => freeChamberTiles(state, room)).filter(([x, y]) => Math.hypot(x - state.playerTileX, y - state.playerTileY) > R);
    d.roamTo = spots.length ? spots[Math.floor(Math.random() * spots.length)] : [e.tileX, e.tileY];
  }
  return bfs(state.map, e.targetTileX, e.targetTileY, d.roamTo[0], d.roamTo[1], avoid, !!avoid);
}

/** Short, reachable escape routes that separate newborn siblings as well as fleeing the player. */
export function devourerScatterPath(state:GameState,e:Enemy):[number,number][] {
  const cols=state.map[0].length,start=e.targetTileY*cols+e.targetTileX;
  const peers=state.enemies.filter(other=>other!==e&&other.type==='devourer'&&other.hp>0&&(other.encounterId??other.id)===(e.encounterId??e.id));
  const forecast=peers.map(other=>other.path.length?other.path[Math.min(3,other.path.length-1)]:[other.targetTileX,other.targetTileY]);
  const parent=new Map<number,number>(),distance=new Map<number,number>([[start,0]]),queue=[start];
  const startThreat=Math.hypot(e.targetTileX-state.playerTileX,e.targetTileY-state.playerTileY);
  let best=start,bestScore=-Infinity;
  for(let head=0;head<queue.length;head++) {
    const tile=queue[head],x=tile%cols,y=Math.floor(tile/cols),steps=distance.get(tile)!;
    const threat=Math.hypot(x-state.playerTileX,y-state.playerTileY);
    if(tile!==start&&threat>=startThreat) {
      const crowd=forecast.reduce((total,[px,py])=>total+Math.pow(Math.max(0,4-Math.hypot(x-px,y-py)),2),0);
      const angle=Math.atan2(y-e.targetTileY,x-e.targetTileX);
      const score=threat*.9-crowd*.8-steps*.15+Math.cos(angle-e.id*2.399)*.3;
      if(score>bestScore){best=tile;bestScore=score;}
    }
    if(steps>=6)continue;
    const directions=[[1,0],[0,1],[-1,0],[0,-1]];
    for(let i=0;i<4;i++) {
      const [dx,dy]=directions[(i+e.id)%4],nx=x+dx,ny=y+dy,next=ny*cols+nx;
      if(!isFloorTile(state.map,nx,ny)||distance.has(next))continue;
      distance.set(next,steps+1);parent.set(next,tile);queue.push(next);
    }
  }
  const path:[number,number][]=[];
  while(best!==start&&parent.has(best)){path.push([best%cols,Math.floor(best/cols)]);best=parent.get(best)!;}
  return path.reverse();
}

function isEnemyInSingularity(state: GameState, enemy: Enemy): boolean {
  const field=state.singularity;if(!field||field.ticks<=0)return false;
  const radius=SPECIAL_SINGULARITY_RADIUS;
  const x=Math.floor(enemy.x/TILE_SIZE),y=Math.floor(enemy.y/TILE_SIZE);
  return isFloorTile(state.map,x,y)&&Math.hypot((x+.5)*TILE_SIZE-field.x,(y+.5)*TILE_SIZE-field.y)<=radius;
}

function updateSingularity(state: GameState) {
  const field=state.singularity;if(!field){stopSingularitySound();return;}
  if(--field.ticks<=0){state.singularity=null;stopSingularitySound();return;}
  if (state.trial?.devourer) { swallowAtField(state); if ((state as GameState).gamePhase !== 'playing') return; } // its centre swallows bodies like a Maw
  const radius = SPECIAL_SINGULARITY_RADIUS;
  updateSingularitySound(state);
  field.pullTimer--;field.damageTimer--;
  const targets=state.enemies.filter(e=>{
    const tx=Math.floor(e.x/TILE_SIZE),ty=Math.floor(e.y/TILE_SIZE);
    return e.hp>0&&isFloorTile(state.map,tx,ty)&&Math.hypot((tx+.5)*TILE_SIZE-field.x,(ty+.5)*TILE_SIZE-field.y)<=radius;
  });
  if(field.pullTimer<=0){
    // The Singularity challenge pulls every 10 ticks instead of 15, and Devourer bodies on five of every six pulses (~12 ticks).
    const interval=state.trial?.devourer?SINGULARITY_CHALLENGE.fPullTicks:15;
    field.pullTimer=interval;const pullBoss=(field.maxTicks-field.ticks)%30===0;
    const pullBody=Math.round((field.maxTicks-field.ticks)/interval)%6!==5; // bodies on five of every six pulses
    const pullFullBody=Math.round((field.maxTicks-field.ticks)/interval)%3!==2; // nearly full bodies on two of every three
    for(const enemy of targets){
      const strongBoss=!!state.trial?.devourer&&enemy.type==='devourer';
      if(enemy.devourer?.merging||enemy.type==='aegis_construct'||enemy.twin?.downedTicks||enemy.pushTiles>0||isBossType(enemy.type)&&!(strongBoss?(nearlyFull(state,enemy)?pullFullBody:pullBody):pullBoss))continue; // small things every pulse, heavy bodies less often
      const tx=Math.floor(field.x/TILE_SIZE),ty=Math.floor(field.y/TILE_SIZE),dx=tx-enemy.tileX,dy=ty-enemy.tileY;
      if(!dx&&!dy)continue;
      const choices=Math.abs(dx)>=Math.abs(dy)?[[Math.sign(dx),0],[0,Math.sign(dy)]]:[[0,Math.sign(dy)],[Math.sign(dx),0]];
      const step=choices.find(([x,y])=>(x||y)&&isFloorTile(state.map,enemy.tileX+x,enemy.tileY+y));
      if(step){
        if(strongBoss){if(!enemy.singularityPull)enemy.singularityPull={started:false,dx:step[0],dy:step[1],speed:SINGULARITY_CHALLENGE.wellPullSpeed};}
        else{enemy.pushDirX=step[0];enemy.pushDirY=step[1];enemy.pushTiles=1;}
      }
    }
  }
  if(field.damageTimer<=0){
    field.damageTimer=60;
    hitSupernova(state, (x, y) => Math.hypot(x - field.x, y - field.y) <= radius);
    for(const enemy of targets)damageEnemy(state,enemy,isBossType(enemy.type)?enemy.maxHp*SPECIAL_SINGULARITY_BOSS_DAMAGE:SPECIAL_SINGULARITY_NORMAL_DAMAGE*skillAlienScale(state),'special');
    for(const enemy of targets){const index=state.enemies.indexOf(enemy);if(index>=0&&enemy.hp<=0)killEnemy(state,index);}
  }
}

function inCelestialField(state: GameState, e: Enemy): boolean {
  const field=state.celestialField;
  if(!field||field.ticks<=0)return false;
  const tx=Math.floor(e.x/TILE_SIZE),ty=Math.floor(e.y/TILE_SIZE);
  return isFloorTile(state.map,tx,ty)&&tx>=(field.x-SPECIAL_WEAVER_RADIUS)/TILE_SIZE&&tx<(field.x+SPECIAL_WEAVER_RADIUS)/TILE_SIZE&&ty>=(field.y-SPECIAL_WEAVER_RADIUS)/TILE_SIZE&&ty<(field.y+SPECIAL_WEAVER_RADIUS)/TILE_SIZE;
}
export function stormSlowMultiplier(state:GameState,e:Enemy,slowStrength=1):number {
  const skillSlow=e.stormSlowUntilTick!==undefined&&state.gameTick<=e.stormSlowUntilTick?1-(1-SPECIAL_REAPER_SLOW)*slowStrength:1;
  return Math.min(skillSlow,buildSlowMultiplier(state,e),(e.clamSlowUntil??0)>state.gameTick?NEPTUNE_CLAM.slow:1);
}
export function celestialMoveMultiplier(state: GameState, e: Enemy): number { return MOVE_SPEED_MULT * saturnEmpower(state, e, 'speed') * siriusEmpower(state, e, 'speed') * ((e.enchantedUntil ?? 0) > state.gameTick ? (isBossType(e.type) ? ENCHANTER.bossSpeedMult : ENCHANTER.speedMult) : 1) * (inCelestialField(state,e)?SPECIAL_WEAVER_SLOW:1) * Math.min((e.voltSlowTicks ?? 0)>0 ? JUPITER.wallSlow : 1,stormSlowMultiplier(state,e),buildSlowMultiplier(state,e)); }
let gaiaFieldVoice: HTMLAudioElement | null = null;
export function stopGaiaFieldSound() {
  if (!gaiaFieldVoice) return;
  gaiaFieldVoice.pause(); gaiaFieldVoice.currentTime = 0; gaiaFieldVoice = null;
}
function updateGaiaFieldSound(state: GameState) {
  if (state.gamePhase !== 'playing' || !state.celestialField ||
      (typeof document !== 'undefined' && document.hidden) ||
      !state.enemies.some(enemy => enemy.hp > 0 && inCelestialField(state, enemy))) {
    stopGaiaFieldSound(); return;
  }
  if (gaiaFieldVoice) return;
  try {
    const voice = gameAudio('/sounds/celestial/gaia-field-click.wav');
    voice.volume = .4 * ATTACK_SFX_VOLUME; voice.loop = true;
    gaiaFieldVoice = voice;
    voice.play().catch(() => { if (gaiaFieldVoice === voice) stopGaiaFieldSound(); });
  } catch { stopGaiaFieldSound(); }
}
function updateCelestialField(state: GameState) {
  const field=state.celestialField;if(!field){stopGaiaFieldSound();return;}
  if(--field.ticks<=0){state.celestialField=null;stopGaiaFieldSound();return;}
  updateGaiaFieldSound(state);
  if(--field.damageTimer>0)return;
  field.damageTimer=60;
  hitSupernova(state, (x, y) => x >= field.x - SPECIAL_WEAVER_RADIUS && x < field.x + SPECIAL_WEAVER_RADIUS && y >= field.y - SPECIAL_WEAVER_RADIUS && y < field.y + SPECIAL_WEAVER_RADIUS);
  const targets=state.enemies.filter(e=>e.hp>0&&inCelestialField(state,e));
  for(const target of targets)damageEnemy(state,target,isBossType(target.type)?target.maxHp*SPECIAL_WEAVER_BOSS_DAMAGE:SPECIAL_WEAVER_NORMAL_DAMAGE*skillAlienScale(state),'special');
  for(const target of targets){const index=state.enemies.indexOf(target);if(index>=0&&target.hp<=0)killEnemy(state,index);}
  updateGaiaFieldSound(state);
}

function updateEnemyTargets(state: GameState) {
  const decoy=state.build.decoy;
  if(!decoy){updateQueenBlessingTargets(state);return;}
  const lured=new Set(state.enemies.filter(enemy=>enemy.hp>0&&!isBossType(enemy.type)&&Math.hypot(enemy.x-decoy.x,enemy.y-decoy.y)<=10*TILE_SIZE).map(enemy=>enemy.id));
  const saved={playerX:state.playerX,playerY:state.playerY,playerTileX:state.playerTileX,playerTileY:state.playerTileY,playerTargetX:state.playerTargetX,playerTargetY:state.playerTargetY,playerChamber:state.playerChamber,playerCarryingRuby:state.playerCarryingRuby};
  state.enemyDecoyActive=state.build.decoyTargetActive=true;
  Object.assign(state,{playerX:decoy.x,playerY:decoy.y,playerTileX:decoy.tileX,playerTileY:decoy.tileY,playerTargetX:decoy.tileX,playerTargetY:decoy.tileY,playerChamber:chamberOfTile(decoy.tileX,decoy.tileY),playerCarryingRuby:true});
  try{updateEnemies(state,enemy=>lured.has(enemy.id));}finally{Object.assign(state,saved);state.enemyDecoyActive=state.build.decoyTargetActive=false;}
  updateQueenBlessingTargets(state,enemy=>!lured.has(enemy.id));
}
function updateQueenBlessingTargets(state:GameState,only:(enemy:Enemy)=>boolean=()=>true){
  const handled=new Set<number>();
  for(const decoy of [...(state.build.queenDecoys??[])]){
    if(decoy.hp<=0)continue;
    const lured=new Set(state.enemies.filter(e=>only(e)&&!handled.has(e.id)&&e.hp>0&&!isBossType(e.type)&&Math.hypot(e.x-decoy.x,e.y-decoy.y)<=6*TILE_SIZE).map(e=>e.id));
    const saved={playerX:state.playerX,playerY:state.playerY,playerTileX:state.playerTileX,playerTileY:state.playerTileY,playerTargetX:state.playerTargetX,playerTargetY:state.playerTargetY,playerChamber:state.playerChamber,playerCarryingRuby:state.playerCarryingRuby};
    state.enemyDecoyActive=true;state.build.queenTargetId=decoy.id;
    Object.assign(state,{playerX:decoy.x,playerY:decoy.y,playerTileX:decoy.tileX,playerTileY:decoy.tileY,playerTargetX:decoy.tileX,playerTargetY:decoy.tileY,playerChamber:chamberOfTile(decoy.tileX,decoy.tileY),playerCarryingRuby:true});
    try{updateEnemies(state,e=>lured.has(e.id));}finally{Object.assign(state,saved);state.enemyDecoyActive=false;state.build.queenTargetId=undefined;}
    for(const id of lured)handled.add(id);
  }
  updateLunarEnemyTargets(state,e=>only(e)&&!handled.has(e.id));
}
function updateLunarEnemyTargets(state: GameState,only:(enemy:Enemy)=>boolean=()=>true) {
  const decoy=state.lunarDecoy;
  if(!decoy){updateEnemies(state,only);return;}
  const saved={playerX:state.playerX,playerY:state.playerY,playerTileX:state.playerTileX,playerTileY:state.playerTileY,
    playerTargetX:state.playerTargetX,playerTargetY:state.playerTargetY,playerChamber:state.playerChamber,playerCarryingRuby:state.playerCarryingRuby};
  state.enemyDecoyActive=true;
  Object.assign(state,{playerX:decoy.x,playerY:decoy.y,playerTileX:decoy.tileX,playerTileY:decoy.tileY,
    playerTargetX:decoy.tileX,playerTargetY:decoy.tileY,playerChamber:chamberOfTile(decoy.tileX,decoy.tileY),playerCarryingRuby:true});
  // The Moon Queen ignores the decoy and keeps after the real player; her illusions take the bait, which gives her away.
  const ignoresDecoy=(e:Enemy)=>isMoonBoss(state,e);
  try{updateEnemies(state,e=>only(e)&&!ignoresDecoy(e));}finally{Object.assign(state,saved);state.enemyDecoyActive=false;}
  if(state.moon)updateEnemies(state,e=>only(e)&&ignoresDecoy(e));
}

export function releaseReaperHallwaySeal(state:GameState) {
  if(state.hallwaySeal!==-1)setHallwayWalled(state,state.hallwaySeal,false);
  state.hallwaySeal=-1;state.hallwaySealTicks=0;
}

// Shared by the standard Reaper and Jupiter: seal both end caps, leaving the corridor fightable.
export function tryReaperHallwaySeal(state: GameState, e: Enemy) {
  const rHallway = hallwayOfTile(e.tileX, e.tileY);
  if (
    rHallway !== -1 &&
    rHallway === hallwayOfTile(state.playerTileX, state.playerTileY) &&
    state.hallwaySeal === -1 &&
    state.hallwaySealCooldown === 0
  ) {
    setHallwayWalled(state, rHallway, true);
    state.hallwaySeal = rHallway;
    state.hallwaySealTicks = REAPER_SEAL_DURATION;
    state.hallwaySealCooldown = REAPER_SEAL_COOLDOWN;
    playSFX_hallwaySeal();
    state.screenShakeTicks = 14;
    state.screenShakeAmt = 6;
  }

}

function updateEnemies(state: GameState, only?: (e: Enemy) => boolean) {
  const playerCarrying = state.playerCarryingRuby;

  for (const e of [...state.enemies].reverse()) {
    if (!state.enemies.includes(e) || e.hp <= 0 || (e.twin?.downedTicks ?? 0) > 0) continue;
    if (only && !only(e)) continue;
    if (e.singularityPull && moveSingularityBody(state, e)) {
      // Forced movement suspends the burst fuse until the body is free again.
      continue;
    }
    if (e.type !== 'devourer' && state.trial?.devourer && singularityHeld(state,e)) continue;
    if (e.type === 'reflector') checkReflectorControl(state, e); // before the stun skip, so stuns drop its mirror
    if((e.buildStopUntil??0)>state.gameTick){if(e.type==='soulless'&&e.boneLunge){e.boneLunge=undefined;e.attackTimer=ENEMY_CONFIGS.soulless.attackCooldown;}if(e.type==='grappler'&&e.hook){e.hook=undefined;e.attackTimer=ENEMY_CONFIGS.grappler.attackCooldown;}continue;}
    if (e.type === 'moon_mimic' && updateMoonMimic(state, e)) continue; // disguised: stands still and never attacks
    if ((e.voltSlowTicks ?? 0) > 0) e.voltSlowTicks!--;
    if (state.jupiter?.bossId === e.id) {
      if (e.flashTicks > 0) e.flashTicks--; if (e.shootTicks > 0) e.shootTicks--;
      if(e.healFlashTicks>0)e.healFlashTicks--;
      updateJupiterReaper(state,e); continue;
    }
    if (state.saturn?.bossId === e.id) {
      if (e.flashTicks > 0) e.flashTicks--; if (e.shootTicks > 0) e.shootTicks--;
      e.pushTiles = 0; continue;
    }
    if (saturnTimeStopped(state, e)) continue; // inside C's time-stop field
    if (e.flashTicks > 0) e.flashTicks--;
    if (e.healFlashTicks > 0) e.healFlashTicks--;
    if (e.shootTicks > 0) e.shootTicks--;
    if (e.type === 'lost_soul') { e.pushTiles = 0; updateLostSoul(state, e); continue; }
    if (e.type === 'sand_relic' || e.type === 'sand_core') { e.pushTiles = 0; continue; } // Venus: relics and his core lie still
    if (duneWormHidden(e) || e.type === 'sand_scorpion') e.pushTiles = 0; // Venus: a Dune Worm under the sand, or a scorpion on its tile, cannot be pushed
    if (e.type === 'moon_shade') e.pushTiles = 0; // Moon: shades cannot be knocked back
    if (e.type === 'cinder_wisp' || (e.type === 'emberling' && e.extinguished) || (state.sun?.bossId === e.id && state.sun.quenchedTicks > 0)) { e.pushTiles = 0; continue; }
    // Slow all enemy AI together so movement, melee/ranged cooldowns, windups and
    // special attacks keep the same half-speed cadence throughout the cold window.
    // Player actions and visual flash lifetimes still update every gameplay tick.
    if (state.sun && state.sun.quenchedTicks > 0 && state.gameTick % SUN.quenchEnemyTickInterval !== 0) continue;
    if (e.type === 'scorch_sapper') { updateScorchSapper(state, e); continue; } // goes for stations, never attacks

    // Bomber explode mechanic
    if (e.type === 'bomber' && e.exploding) {
      e.explodeTick--;
      if (e.explodeTick <= 0) {
        triggerBomberExplosion(state, e);
        const index = state.enemies.indexOf(e);
        if (index >= 0) state.enemies.splice(index, 1);
      }
      continue;
    }

    if (e.type === 'aegis_construct') { e.pushTiles = 0; continue; }
    if (e.type === 'water_bomb' || e.type === 'seed_pod' || e.type === 'blossom' || e.type === 'lifebloom') { e.pushTiles = 0; continue; } // stationary; the challenge drives them
    if (e.type === 'pufferfish' && updatePufferfish(state, e)) continue; // swelling up or bursting; otherwise it chases like any alien
    if ((e.type === 'fish_blue' || e.type === 'fish_red' || e.type === 'water_clone' || e.type === 'vine_crawler') && e.pushTiles <= 0) { updateFish(state, e); continue; } // fish, clones and crawlers roam

    // Push (knockback)
    if (e.pushTiles > 0) {
      // An alien partway through a step can already occupy its next tile.
      const currentX = Math.floor(e.x / TILE_SIZE);
      const currentY = Math.floor(e.y / TILE_SIZE);
      if (isFloorTile(state.map, currentX, currentY)) {
        e.tileX = currentX; e.tileY = currentY;
      }
      const nx = e.tileX + e.pushDirX;
      const ny = e.tileY + e.pushDirY;
      if (isFloorTile(state.map, nx, ny) && hasLineOfSight(state.map, e.tileX, e.tileY, nx, ny)) {
        e.tileX = nx; e.tileY = ny;
      } else {
        e.pushTiles = 0;
        if (e.buildWallDamage !== undefined) {
          damageEnemy(state,e,e.buildWallDamage,'special');
          state.build.impacts.push({x:e.x+e.pushDirX*20,y:e.y+e.pushDirY*20,kind:'slam',ticks:18});
          if(e.slamStun)binaryWallStun(state,e,e.slamStun); // Binary Star: pushed or pulled into a wall
        }
      }
      // Rebuild movement from the final tile. The old path can skip over walls from here.
      e.x = (e.tileX + .5) * TILE_SIZE; e.y = (e.tileY + .5) * TILE_SIZE;
      e.targetTileX = e.tileX; e.targetTileY = e.tileY; e.stepProgress = 0;
      e.path = []; e.pathTimer = 0;
      if(state.saturn&&isSaturnAlien(e.type))interruptSaturnAlien(e);
      if(state.sirius&&isSiriusAlien(e.type))interruptSiriusAlien(e);
      if (e.type === 'charger' || e.type === 'lodestone') { e.chargeDirX = 0; e.chargeDirY = 0; e.chargeWindupTicks=0; e.chargeTilesLeft=0; }
      if (e.type === 'dropper') e.dropAttack = undefined;
      if (e.type === 'soulless' && e.boneLunge) { e.boneLunge=undefined; e.attackTimer=ENEMY_CONFIGS.soulless.attackCooldown; }
      if (e.type === 'grappler' && e.hook) { e.hook = undefined; e.attackTimer = ENEMY_CONFIGS.grappler.attackCooldown; }
      if (e.type === 'lancer') { e.windupTicks = 0; e.lanceDirX = e.lanceDirY = undefined; }
      e.pushTiles = Math.max(0, e.pushTiles - 1);
      if(e.pushTiles===0){
        e.buildWallDamage=undefined;e.slamStun=undefined;
        if ((e.haloStunTicks ?? 0) > 0) {
          e.buildStopUntil = Math.max(e.buildStopUntil ?? 0, state.gameTick + e.haloStunTicks!);
          e.haloStunTicks = undefined;
        }
      }
      continue;
    }

    if (state.saturn && isSaturnAlien(e.type)) { updateSaturnAlien(state, e); continue; }
    if (state.sirius && isSiriusAlien(e.type)) { updateSiriusAlien(state, e); continue; }
    if (state.venus && venusHoldsBoss(state, e)) { e.pushTiles = 0; continue; } // Venus: leaping, charging his lance or stunned
    if (e.type === 'astral_twins' && e.twin) { updateAstralTwin(state, e); continue; }
    if (e.type === 'grounder' && state.binary) { updateGrounder(state, e); continue; } // Binary Star: escorts a twin, never attacks
    if (e.type === 'thorn_weaver') { updateThornWeaver(state, e); continue; }
    if (e.type === 'sea_chanter') {
      updateSeaChanter(state, e);
      continue;
    }

    // Blind Prayer flees, with a telegraphed escape attack and occasional Ruby ritual.
    if (e.type === 'blind_prayer') {
      if (!state.sirius) updatePrayerAbilities(state, e); // in Sirius he never attacks; the challenge runs his runes and ritual
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        // Same escape range as Thorn Weaver: flee when the player is close, otherwise wander.
        const threatened = tileEuclidDist(e.targetTileX, e.targetTileY, state.playerTileX, state.playerTileY) <= THORN_FLEE_RANGE;
        if (threatened) e.path = fleePath(state, e);
        else if (e.prayer!.fleeing || e.path.length === 0) e.path = roamPath(state, e);
        e.prayer!.fleeing = threatened;
        e.pathTimer = PRAYER_FLEE_REPATH_TICKS;
      }
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
        const next = e.path.shift();
        if (next && isFloorTile(state.map, next[0], next[1])) {
          [e.targetTileX, e.targetTileY] = next;
          e.stepProgress = 0;
        }
      } else {
        const speed = e.prayer!.escapeBoostTicks > 0 ? PRAYER_ESCAPE_SPEED : ENEMY_CONFIGS.blind_prayer.speed;
        e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + speed * celestialMoveMultiplier(state,e));
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + (e.targetTileX - e.tileX) * e.stepProgress;
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + (e.targetTileY - e.tileY) * e.stepProgress;
        if (e.stepProgress === TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Boss special logic ───────────────────────────────────────────────
    if (e.type === 'fiery_king') {
      // Boss is immune to push
      e.pushTiles = 0;
      if (e.attackTimer > 0) e.attackTimer--;
      // phaseTimer is unused for fiery_king otherwise — reused here as "ticks alive since
      // this king spawned", so speed ramps from base on every fresh spawn, not from run start.
      e.phaseTimer++;
      updateKingArenaAttack(state, e);

      // Targets whichever of player/ruby is closer — unlike the Reaper, who only ever
      // hunts the player, the King (like the Queen) will go straight for an undefended ruby.
      const bHasRuby = !state.enemyDecoyActive && state.rubyTileX !== -1;
      const bDistPlayer = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const bDistRuby = bHasRuby ? tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) : Infinity;
      const bTargetIsPlayer = !bHasRuby || bDistPlayer <= bDistRuby;
      e.targeting = bTargetIsPlayer ? 'player' : 'ruby';
      const bTgtTX = bTargetIsPlayer ? state.playerTileX : state.rubyTileX;
      const bTgtTY = bTargetIsPlayer ? state.playerTileY : state.rubyTileY;
      const bDist  = bTargetIsPlayer ? bDistPlayer : bDistRuby;

      // Attack if within range
      if (e.attackTimer === 0 && bDist <= BOSS_ATTACK_RANGE) {
        playSFX_bossLaser();
        const bTgtX = bTargetIsPlayer ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
        const bTgtY = bTargetIsPlayer ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
        if (bTargetIsPlayer) damagePlayer(state, ENEMY_CONFIGS.fiery_king.damageToPlayer, e);
        else damageRuby(state, ENEMY_CONFIGS.fiery_king.damageToRuby, e);
        e.attackTimer = ENEMY_CONFIGS.fiery_king.attackCooldown;
        e.shootTicks = 22;
        state.laserBeams.push({
          fromX: e.x, fromY: e.y,
          dirX: 0, dirY: 0,
          endX: bTgtX, endY: bTgtY,
          ticks: 22,
          color: '#cc0022'
        });
        spawnFireBurst(state, bTgtX, bTgtY);
      }

      // BFS toward player — recalculate frequently so boss tracks across chambers
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        e.path = bfs(state.map, e.targetTileX, e.targetTileY, bTgtTX, bTgtTY);
        e.pathTimer = 8;
      }
      const bCfg = ENEMY_CONFIGS.fiery_king;
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
      } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
        // Gradually speeds up the longer THIS king has been alive — resets to base speed
        // on every fresh spawn — capped at an absolute top speed.
        const kingAliveSec = e.phaseTimer / 60;
        const kingSpeed = state.sun ? (.8 + state.sun.rage * .035) * ((state.sun.kingSlowTicks??0)>0 ? SUN.waveSlowMult : 1) : Math.min(KING_SPEED_CAP, bCfg.speed * (1 + kingAliveSec * KING_SPEED_RAMP_PER_SEC));
        e.stepProgress += kingSpeed * celestialMoveMultiplier(state, e);
        const bdx = e.targetTileX - e.tileX, bdy = e.targetTileY - e.tileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + bdx * Math.min(e.stepProgress, TILE_SIZE);
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + bdy * Math.min(e.stepProgress, TILE_SIZE);
        if (e.stepProgress >= TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Storm Reaper special logic ──────────────────────────────────────
    if (e.type === 'storm_reaper') {
      e.pushTiles = 0; // immune to push, like the other bosses
      if (e.attackTimer > 0) e.attackTimer--;

      // Always hunts the player specifically — never the ruby, unlike King/Queen.
      const rTgtTX = state.playerTileX;
      const rTgtTY = state.playerTileY;
      const rCfg = ENEMY_CONFIGS.storm_reaper;
      const rDist = tileEuclidDist(e.tileX, e.tileY, rTgtTX, rTgtTY);

      // Melee strike if adjacent and off cooldown — an electric slash, not a laser beam,
      // since he's a close-range striker rathis than a ranged attacker like the King/Queen.
      if (e.attackTimer === 0 && rDist <= rCfg.attackRange) {
        playSFX_reaperStrike();
        damagePlayer(state, rCfg.damageToPlayer, e);
        e.attackTimer = rCfg.attackCooldown;
        e.shootTicks = 14;
        const slashAngle = Math.atan2(state.playerY - e.y, state.playerX - e.x);
        state.slashEffects.push({ x: state.playerX, y: state.playerY, angle: slashAngle, ticks: 14, maxTicks: 14 });
        spawnSlashBurst(state, state.playerX, state.playerY);
        state.screenShakeTicks = 10;
        state.screenShakeAmt = 7;
      }

      tryReaperHallwaySeal(state, e);

      // BFS toward player — recalculate frequently so he tracks across chambers/hallways
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        e.path = bfs(state.map, e.targetTileX, e.targetTileY, rTgtTX, rTgtTY);
        e.pathTimer = 8;
      }
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
      } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
        e.stepProgress += rCfg.speed * celestialMoveMultiplier(state, e);
        const rdx = e.targetTileX - e.tileX, rdy = e.targetTileY - e.tileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + rdx * Math.min(e.stepProgress, TILE_SIZE);
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + rdy * Math.min(e.stepProgress, TILE_SIZE);
        if (e.stepProgress >= TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Devourer special logic ──────────────────────────────────────────
    if (e.type === 'devourer') {
      if (e.devourer?.merging) continue;
      e.pushTiles = 0; // immune to push, like the other bosses
      if (e.attackTimer > 0) e.attackTimer--;
      // chargeDirX is unused for this type otherwise — reused as her absorb-stack counter (0..DEVOURER_MAX_STACKS).
      // windupTicks is unused otherwise — reused as her absorb cooldown countdown.
      const stacks = e.chargeDirX;
      const dCfg = ENEMY_CONFIGS.devourer;
      if ((e.devourer?.mealSpeedTicks ?? 0) > 0) e.devourer!.mealSpeedTicks!--;
      // Newborn copies scatter: they flee the player at boosted speed and hold their bite.
      const newborn = (e.devourer?.newbornTicks ?? 0) > 0;
      if (newborn) e.devourer!.newbornTicks!--;
      // Singularity: a full body swells in place and bursts when its fuse runs out, unless the Maw eats it first.
      if (e.devourer?.gorgeTicks !== undefined) {
        if (state.trial?.devourer && singularityHeld(state,e)) continue; // holding, throwing and stun pause the fuse
        const left = --e.devourer.gorgeTicks;
        if (left % Math.max(6, Math.round(left / 5)) === 0) { e.flashTicks = 4; }
        if (left <= 0) explodeDevourer(state, e);
        continue;
      }
      if (state.trial?.devourer && singularityHeld(state, e)) continue; // Singularity: hooked, flung or stunned by a slam
      if (state.trial?.devourer && bodyJump(state, e)) continue; // Singularity: now and then a copy blinks across the map
      // Ignored too long, a body with a stack spends it to bud a copy on its own (counts toward the family cap).
      e.devourer ??= { generation: 0 };
      e.devourer.splitTicks = Math.min(DEVOURER_SELF_SPLIT_TICKS, (e.devourer.splitTicks ?? 0) + 1);
      if (!e.devourer.challenge && e.devourer.splitTicks >= DEVOURER_SELF_SPLIT_TICKS && e.chargeDirX > 0 && devourerFamilyRoom(state, e) > 1) { // the Singularity swarm only multiplies by bursting or dying
        spawnDevourerCopies(state, e, 1);
        e.chargeDirX--; e.devourer.splitTicks = 0; e.healFlashTicks = 26;
        playSFX_devourerAbsorb(state);
      }

      // Targets whichever of player/ruby is closer for its bite, same split-attention as the King. In the Singularity a
      // body you just hit (aggroTicks) ignores food and hunts you.
      const aggro = (e.devourer?.aggroTicks ?? 0) > 0; if (aggro) e.devourer!.aggroTicks!--;
      const dHasRuby = !aggro && !state.enemyDecoyActive && state.rubyTileX !== -1;
      const dDistPlayer = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const dDistRuby = dHasRuby ? tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) : Infinity;
      const dTargetIsPlayer = !dHasRuby || dDistPlayer <= dDistRuby;
      e.targeting = dTargetIsPlayer ? 'player' : 'ruby';
      const dTgtTX = dTargetIsPlayer ? state.playerTileX : state.rubyTileX;
      const dTgtTY = dTargetIsPlayer ? state.playerTileY : state.rubyTileY;
      const dDist = dTargetIsPlayer ? dDistPlayer : dDistRuby;
      const dAttackRange = dCfg.attackRange;

      // Short sound-wave bite; each stack adds damage.
      if (!newborn && e.attackTimer === 0 && dDist <= dAttackRange) {
        playSFX_devourerBite(state);
        const dTgtX = dTargetIsPlayer ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
        const dTgtY = dTargetIsPlayer ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
        const familyScale = state.trial?.devourer ? SINGULARITY_CHALLENGE.biteDamage/Math.pow(Math.max(1,state.enemies.filter(other=>other.type==='devourer'&&other.hp>0&&(other.encounterId??other.id)===(e.encounterId??e.id)).length),SINGULARITY_CHALLENGE.biteFamilyExponent) : 1;
        const genDamage = familyScale * Math.max(state.trial?.devourer ? SINGULARITY_CHALLENGE.minimumStats : 0,Math.pow(state.trial?.devourer ? SINGULARITY_CHALLENGE.generationDamage : DEVOURER_GEN_DAMAGE_MULT, devourerStatGeneration(e))); // generation weakening is gentler in the Singularity challenge
        const endlessBonus = state.mode === 'endless' ? DEVOURER_ENDLESS_BITE_BONUS : 0;
        if (dTargetIsPlayer) { damagePlayer(state, (dCfg.damageToPlayer + endlessBonus + stacks * DEVOURER_STACK_DAMAGE) * genDamage, e); if (Math.random() < DEVOURER_KNOCKBACK_CHANCE) shovePlayerFromEnemy(state, e, DEVOURER_KNOCKBACK_TILES); } // half its bites knock you back
        else damageRuby(state, (dCfg.damageToRuby + endlessBonus + stacks * DEVOURER_STACK_DAMAGE) * genDamage, e);
        state.laserBeams.push({
          fromX: e.x, fromY: e.y,
          dirX: 0, dirY: 0,
          endX: dTgtX, endY: dTgtY,
          ticks: 20,
          color: '#6b2fa8',
        });
        e.attackTimer = dCfg.attackCooldown;
        e.shootTicks = 16;
        state.screenShakeTicks = Math.max(state.screenShakeTicks, 6);
        state.screenShakeAmt = Math.max(state.screenShakeAmt, 4 + stacks);
      }

      // Periodically consume the nearest regular ally in reach. Below the cap each meal adds a
      // stack (more HP, reach and damage, and one more copy on death); at the cap it only heals.
      if (e.windupTicks > 0) {
        e.windupTicks--;
      } else {
        const nearest = nearestDevourerFood(state, e, state.trial?.devourer ? 0 : DEVOURER_ABSORB_RANGE); // Singularity: it must walk over the food
        if (nearest) {
          spawnAbsorbBurst(state, nearest.x, nearest.y, e.x, e.y);
          const idx2 = state.enemies.indexOf(nearest);
          if (idx2 !== -1) state.enemies.splice(idx2, 1);
          const golden = !!nearest.goldenSoul; // Golden Soul: fills the body to full stacks at once
          const cap = state.trial?.devourer ? singularityPhaseStacks(state.trial.devourer.phase) : DEVOURER_MAX_STACKS;
          if (state.trial?.devourer) {
            feedSingularityBody(state, e, golden ? bodyStackCap(state.trial.devourer.phase, e) : SINGULARITY_CHALLENGE.mealStacks); // Singularity: every meal adds a stack (a Golden Soul fills it); full bodies burst
          } else if (stacks < cap) {
            const gained = Math.round(e.maxHp * DEVOURER_STACK_HP_PCT);
            e.maxHp += gained;
            e.hp = Math.min(e.maxHp, e.hp + gained);
            e.chargeDirX = stacks + 1;
          } else {
            e.hp = Math.min(e.maxHp, e.hp + e.maxHp * DEVOURER_FULL_HEAL_PCT); // unrounded: 1% of a small body is under 1 HP
          }
          e.healFlashTicks = 26; // drives the big shockwave-ring pulse in drawEnemy
          playSFX_devourerAbsorb(state); // no screen shake: meals are frequent
          e.windupTicks = devourerAbsorbCooldown(state, e); // the cooldown starts only after a real meal
        }
      }

      // BFS toward target — recalculate frequently so she tracks across chambers. While nearly
      // empty she hunts food: below 3 stacks in Singularity, below 2 in the normal encounter.
      e.pathTimer--;
      if (e.pathTimer <= 0) {
        const trial = state.trial?.devourer;
        const food = newborn || aggro ? null : trial
          ? nearestDevourerFood(state, e, SINGULARITY_CHALLENGE.foodRadius)
          : e.chargeDirX < DEVOURER_HUNGRY_BELOW ? nearestDevourerFood(state, e, Infinity) : null;
        const avoid = trial ? mawAvoider(state, e) : undefined;
        const foodPath = food ? bfs(state.map, e.targetTileX, e.targetTileY, food.tileX, food.tileY) : [];
        e.path = newborn ? (trial ? devourerScatterPath(state,e) : fleePath(state, e))
          : foodPath.length ? foodPath
          : trial ? singularityIdlePath(state, e, aggro, avoid) // the Singularity swarm hunts you only after you hit it; otherwise it flees or roams
          : bfs(state.map, e.targetTileX, e.targetTileY, dTgtTX, dTgtTY, avoid, !!avoid);
        e.pathTimer = 8;
      }
      // Singularity: a body crowding another steps away from it instead of following its path (unless food is right there).
      if (state.trial?.devourer && !newborn && !aggro && e.tileX === e.targetTileX && e.tileY === e.targetTileY && Math.random() < SINGULARITY_CHALLENGE.spreadChance) {
        const step = bodySpreadStep(state, e);
        if (step) { e.targetTileX = step[0]; e.targetTileY = step[1]; e.stepProgress = 0; e.path = []; e.pathTimer = 4; }
      }
      if (e.tileX === e.targetTileX && e.tileY === e.targetTileY && e.path.length > 0) {
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
      } else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) {
        const genSpeed = Math.max(state.trial?.devourer ? SINGULARITY_CHALLENGE.minimumStats : 0,Math.pow(state.trial?.devourer ? SINGULARITY_CHALLENGE.generationSpeed : DEVOURER_GEN_SPEED_MULT, devourerStatGeneration(e))); // each copy generation is a bit slower
        e.stepProgress += dCfg.speed * (state.trial?.devourer ? SINGULARITY_CHALLENGE.bodySpeed * ((e.devourer?.mealSpeedTicks ?? 0) > 0 ? SINGULARITY_CHALLENGE.mealSpeed : 1) : 1) * genSpeed * (newborn ? (state.trial?.devourer ? SINGULARITY_CHALLENGE.newbornSpeed : DEVOURER_NEWBORN_SPEED_MULT) : 1) * celestialMoveMultiplier(state, e);
        const ddx = e.targetTileX - e.tileX, ddy = e.targetTileY - e.tileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + ddx * Math.min(e.stepProgress, TILE_SIZE);
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + ddy * Math.min(e.stepProgress, TILE_SIZE);
        if (e.stepProgress >= TILE_SIZE) {
          e.tileX = e.targetTileX; e.tileY = e.targetTileY;
          e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
          e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
          e.stepProgress = 0;
        }
      }
      continue;
    }

    // ── Frost Warden special logic ──────────────────────────────────────
    if (e.type === 'frost_warden') {
      e.pushTiles = 0; // immune to push, like the other bosses

      // No direct attack on the player — she's a pure field-controller. Her threat is
      // entirely the chamber-wide chill debuff (isPlayerChilled) and the ice-tile freeze
      // hazards. Her only "offense" is supportive: firing an ice-laser shield cast at a
      // random ally every FROST_SHIELD_CAST_DELAY ticks (recurring, not a one-shot per
      // relocation) — any number of allies can be carrying a shield at once, not just one.
      if (e.windupTicks > 0) {
        e.windupTicks--;
        if (e.windupTicks === 0) {
          castFrostShield(state, e);
          e.windupTicks = FROST_SHIELD_CAST_DELAY;
        }
      }

      // Periodically relocate to a new chamber, re-scattering her ice tiles there —
      // phaseTimer is unused for this type otherwise (only meaningful for splitter_queen).
      e.phaseTimer--;
      if (e.phaseTimer <= 0) {
        relocateFrostWarden(state, e);
      }
      continue;
    }

    // ── Splitter Queen special logic ──────────────────────────────────────
    if (e.type === 'splitter_queen' || e.type === 'moon_illusion') {
      e.pushTiles = 0; // immune to knockback, like the boss

      const qChamber = chamberOfTile(e.tileX, e.tileY);
      const hasPlacedRubyQ = !state.enemyDecoyActive && state.rubyTileX !== -1;
      const playerInChamber = chamberOfTile(state.playerTileX, state.playerTileY) === qChamber;
      const rubyInChamber = hasPlacedRubyQ && chamberOfTile(state.rubyTileX, state.rubyTileY) === qChamber;
      const targetIsPlayer = playerInChamber || !rubyInChamber;
      e.targeting = targetIsPlayer ? 'player' : 'ruby';
      const qTgtTX = targetIsPlayer ? state.playerTileX : state.rubyTileX;
      const qTgtTY = targetIsPlayer ? state.playerTileY : state.rubyTileY;
      const inChamberTarget = targetIsPlayer ? playerInChamber : rubyInChamber;
      const qDist = tileEuclidDist(e.tileX, e.tileY, qTgtTX, qTgtTY);
      // No line-of-sight requirement — her bolts pierce walls, only chamber + range gate her.

      if (e.windupTicks > 0) {
        if (!inChamberTarget || qDist > QUEEN_ATTACK_RANGE) {
          e.windupTicks = 0;
        } else {
          e.windupTicks--;
          if (e.windupTicks === 0) {
            const tgtX = targetIsPlayer ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
            const tgtY = targetIsPlayer ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
            fireQueenBolt(state, e, tgtX, tgtY, targetIsPlayer);
          }
        }
      } else {
        if (e.attackTimer > 0) e.attackTimer--;
        if (e.attackTimer === 0 && inChamberTarget && qDist <= QUEEN_ATTACK_RANGE) {
          e.windupTicks = QUEEN_WINDUP_TICKS;
        }
      }

      // Phase-jump countdown runs independently of her attack state
      if (e.type === 'splitter_queen') { e.phaseTimer--; if (e.phaseTimer <= 0) phaseQueenJump(state, e); }
      continue;
    }

    // ── Queen Echo special logic ──────────────────────────────────────────
    if (e.type === 'queen_echo') {
      e.pushTiles = 0;
      const chamber = chamberOfTile(e.tileX, e.tileY);
      const playerInChamber = chamberOfTile(state.playerTileX, state.playerTileY) === chamber;
      const eDist = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      // No line-of-sight requirement — bolts pierce walls, only chamber + range gate the attack.

      if (e.windupTicks > 0) {
        if (!playerInChamber || eDist > QUEEN_ATTACK_RANGE) {
          e.windupTicks = 0;
        } else {
          e.windupTicks--;
          if (e.windupTicks === 0) fireQueenBolt(state, e, state.playerX, state.playerY, true);
        }
      } else {
        if (e.attackTimer > 0) e.attackTimer--;
        if (e.attackTimer === 0 && playerInChamber && eDist <= QUEEN_ATTACK_RANGE) {
          e.windupTicks = QUEEN_WINDUP_TICKS;
        }
      }

      // Echoes persist until the player kills them — no self-expiry.
      continue;
    }

    if (e.type === 'sand_scorpion') { updateSandScorpion(state, e); continue; } // Venus phase 3: never leaves its tile
    if (e.type === 'dune_worm' && updateDuneWorm(state, e)) continue; // Venus: surfacing, up or digging back down

    // Sniper, Lancer, Healer, Charger, Ghost and Shielder have their own AI (aliens.ts)
    if (updateRegularAlien(state, e, playerCarrying)) continue;

    if (e.type === 'moon_shade' && updateMoonShade(state, e, playerCarrying)) continue; // Moon: stays in its own chamber

    // Determine target
    const hasPlacedRuby = state.rubyTileX !== -1;
    if (e.type === 'energy_leech' || e.type === 'dune_worm' || e.type === 'moon_hound' || playerCarrying || !hasPlacedRuby) { // Crystal Hounds only hunt you
      e.targeting = 'player';
    } else {
      // Closest to player? target player; else target ruby
      const distToPlayer = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
      const distToRuby = tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY);
      e.targeting = distToPlayer <= distToRuby + 2 ? 'player' : 'ruby';
    }

    const tgtTX = e.targeting === 'player' ? state.playerTileX : state.rubyTileX;
    const tgtTY = e.targeting === 'player' ? state.playerTileY : state.rubyTileY;

    // BFS recalc
    e.pathTimer--;
    if (e.pathTimer <= 0) {
      e.path = bfs(state.map, e.targetTileX, e.targetTileY, tgtTX, tgtTY);
      e.pathTimer = 25 + Math.floor(Math.random() * 15);
    }

    // Move toward next path tile
    const cfg = ENEMY_CONFIGS[e.type];
    const speed = state.venus && e.id === state.venus.bossId && (state.venus.leapSlow ?? 0) > 0 ? Math.min(VENUS.leapSlowSpeed, e.aegis && !e.aegis.shielded ? AEGIS_EXPOSED_SPEED * VENUS.exposedSpeedMult : VENUS.shieldedSpeed) // Venus: slow just after a leap
      : e.aegis && !e.aegis.shielded ? AEGIS_EXPOSED_SPEED * (state.venus && e.id === state.venus.bossId ? VENUS.exposedSpeedMult : 1) : state.venus && e.id === state.venus.bossId ? VENUS.shieldedSpeed : cfg.speed; // Venus: slower while shielded than in endless

    if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
      // Check attack adjacency
      const adjPlayer = tileDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= cfg.attackRange;
      const adjRuby = hasPlacedRuby && tileDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= cfg.attackRange;

      if (e.attackTimer > 0) {
        e.attackTimer--;
      } else if (adjPlayer && e.targeting === 'player') {
        if (e.type === 'bomber') {
          e.exploding = true; e.explodeTick = 45;
        } else if (e.type === 'energy_leech') {
          // Echo attracts the bite, but contains no real star energy to steal.
          if (state.enemyDecoyActive) damageLunarDecoy(state, 1);
          else if (!state.godMode) {
            const stolen = Math.min(ENERGY_LEECH_DRAIN, state.starEnergy);
            state.starEnergy -= stolen;
            e.stolenEnergy = (e.stolenEnergy ?? 0) + stolen;
          }
          playSFX_enemyAttack(e);
          e.attackTimer = cfg.attackCooldown;
          e.shootTicks = 14;
        } else {
          if (!state.trial?.devourer || devourerSoundAllowed(state, 'alien')) playSFX_enemyAttack(e); // the Singularity's Soulless share one cooldown
          damagePlayer(state, state.venus && e.id === state.venus.bossId ? VENUS.meleeDamage : cfg.damageToPlayer, e); // Venus: his melee is weaker
          if (e.type === 'stinger' && state.neptune) { state.neptune.poisonTicks = NEPTUNE_POISON_TICKS; state.neptune.poisonTimer ||= 60; }
          const knockback = ALIEN_KNOCKBACK[e.type];
          if (knockback) shovePlayerFromEnemy(state, e, knockback);
          if (e.type === 'bleeder' && !state.enemyDecoyActive && state.gamePhase === 'playing') { if ((state.bleedingUntil ?? 0) <= state.gameTick) playSFX_special('bleed'); state.bleedingUntil = state.gameTick + BLEEDER.curseTicks; }
          if (e.type === 'angry_mushroom') shovePlayerFromEnemy(state,e,GAIA_MUSHROOM_KNOCKBACK);
          if (e.type === 'moon_hound') shovePlayerFromEnemy(state,e,MOON_HOUND.knockback);
          if (e.type === 'emberling' && !e.extinguished) shovePlayerFromEnemy(state,e,SUN.emberlingKnockback);
          if (e.aegis) encounterEffect(state, 'sentinel-hit', e, state.playerX, state.playerY, 18, '#78dedf');
          e.attackTimer = cfg.attackCooldown;
          e.shootTicks = 14;
        }
      } else if (adjRuby && e.targeting === 'ruby') {
        if (e.type === 'bomber') {
          e.exploding = true; e.explodeTick = 45;
        } else {
          if (!state.trial?.devourer || devourerSoundAllowed(state, 'alien')) playSFX_enemyAttack(e);
          damageRuby(state, cfg.damageToRuby, e);
          if (e.type === 'moon_shade') moonShadePushRuby(state, e); // Moon: shades shove Ruby away
          if (e.aegis) encounterEffect(state, 'sentinel-hit', e, (state.rubyTileX + .5) * TILE_SIZE, (state.rubyTileY + .5) * TILE_SIZE, 18, '#78dedf');
          e.attackTimer = cfg.attackCooldown;
          e.shootTicks = 14;
        }
      } else if (e.path.length > 0) {
        // Start moving to next tile
        const [ntx, nty] = e.path.shift()!;
        if (isFloorTile(state.map, ntx, nty)) {
          e.targetTileX = ntx; e.targetTileY = nty;
          e.stepProgress = 0;
        }
      }
    } else {
      // Interpolate pixel position
      e.stepProgress += speed * celestialMoveMultiplier(state, e);
      const dx = e.targetTileX - e.tileX;
      const dy = e.targetTileY - e.tileY;
      e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + dx * Math.min(e.stepProgress, TILE_SIZE);
      e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + dy * Math.min(e.stepProgress, TILE_SIZE);
      if (e.stepProgress >= TILE_SIZE) {
        e.tileX = e.targetTileX; e.tileY = e.targetTileY;
        e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2;
        e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
        e.stepProgress = 0;
      }
    }

    // Bomber check: if adjacent to target, start exploding
    if (e.type === 'bomber' && !e.exploding) {
      const adjPlayer = tileDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= cfg.attackRange;
      const adjRuby = hasPlacedRuby && tileDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= cfg.attackRange;
      if ((e.targeting === 'player' && adjPlayer) || (e.targeting === 'ruby' && adjRuby)) {
        e.exploding = true; e.explodeTick = 60;
      }
    }
  }
}

function triggerBomberExplosion(state: GameState, e: Enemy) {
  const RANGE = ENEMY_CONFIGS.bomber.bombExplodeRange;
  playSFX_bomb(ALIEN_ATTACK_SFX.bomber);
  state.bombBlasts.push({ cx: e.x, cy: e.y, radius: 0, maxRadius: RANGE * TILE_SIZE, ticks: 25, trap: true });
  // Damage player if in range
  if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= RANGE) {
    damagePlayer(state, 25);
    shovePlayerFromEnemy(state, e, ALIEN_KNOCKBACK.bomber!);
  }
  // Damage ruby if in range
  if (state.rubyTileX !== -1 && tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= RANGE) {
    damageRuby(state, 30);
  }
  // Kill nearby normal enemies (splash)
  for (const other of [...state.enemies].reverse()) {
    if (other === e || !state.enemies.includes(other) || other.twin?.downedTicks) continue;
    if (tileEuclidDist(e.tileX, e.tileY, other.tileX, other.tileY) <= RANGE * 0.6) {
      damageEnemy(state, other, 2, 'enemy');
      if (other.hp <= 0) { killEnemy(state, state.enemies.indexOf(other)); }
    }
  }
}

function spawnFireBurst(state: GameState, x: number, y: number) {
  const colors = ['#ffee00', '#ff8800', '#ff3300'];
  const count = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 0.6 + Math.random() * 2.0;
    state.deathParticles.push({
      x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.6, // slight upward kick, like fire
      ticks: 18, maxTicks: 18,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function spawnSlashBurst(state: GameState, x: number, y: number) {
  const colors = ['#ffffff', '#00eaff', '#aefcff'];
  const count = 16 + Math.floor(Math.random() * 6);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1.2 + Math.random() * 2.6; // faster, flatter spray than fire — electric snap, not rising embers
    state.deathParticles.push({
      x, y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      ticks: 14, maxTicks: 14,
      size: 1.5 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

// Consumed enemy gets pulled INTO the devourer — particles converge toward her rather
// than scattering outward, selling "absorbed" instead of "destroyed".
function spawnAbsorbBurst(state: GameState, fromX: number, fromY: number, toX: number, toY: number) {
  const colors = ['#6b2fa8', '#b088e0', '#88ff44', '#ffffff', '#c8ff88'];
  const count = 20 + Math.floor(Math.random() * 8);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const spawnR = 6 + Math.random() * 16;
    const px = fromX + Math.cos(angle) * spawnR;
    const py = fromY + Math.sin(angle) * spawnR;
    const pullAngle = Math.atan2(toY - py, toX - px);
    const speed = 2.5 + Math.random() * 4;
    state.deathParticles.push({
      x: px, y: py,
      vx: Math.cos(pullAngle) * speed, vy: Math.sin(pullAngle) * speed,
      ticks: 18, maxTicks: 18,
      size: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

export function spawnDeathParticles(state: GameState, e: Enemy) {
  const color = ENEMY_CONFIGS[e.type].color;
  const count = 10 + Math.floor(Math.random() * 4);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const speed = 0.8 + Math.random() * 2.2;
    state.deathParticles.push({
      x: e.x, y: e.y,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      ticks: 22, maxTicks: 22,
      size: 2 + Math.random() * 3,
      color,
    });
  }
}

function showRewardEffect(state: GameState, target: RewardEffect['target'], kind: RewardEffect['kind']) {
  // Refresh matching effects instead of stacking bursts during crowd kills.
  const effect = state.rewardEffects.find(fx => fx.target === target && fx.kind === kind);
  if (effect) effect.ticks = 36;
  else state.rewardEffects.push({ target, kind, ticks: 36 });
}

export function healPlayer(state: GameState, amount: number, showEffect = true, neptuneChargeScale = 1) {
  if ((state.bleedingUntil ?? 0) > state.gameTick) return; // Bleeder curse: no healing
  const before = state.playerHP;
  state.playerHP = Math.min(PLAYER_MAX_HP, Math.round((state.playerHP + amount) * 10) / 10);
  chargeNeptuneHealing(state, (state.playerHP - before)*neptuneChargeScale);
  blessingHealed(state,state.playerHP-before);
  if (showEffect && state.playerHP > before) showRewardEffect(state, 'player', 'heal');
}

export function healCore(state: GameState, amount: number, neptuneChargeScale = 1) {
  const before = state.rubyHP;
  state.rubyHP = Math.min(RUBY_MAX_HP, state.rubyHP + amount);
  chargeNeptuneHealing(state, (state.rubyHP - before)*neptuneChargeScale);
  blessingHealed(state,state.rubyHP-before);
  if (state.rubyHP > before) showRewardEffect(state, 'ruby', 'heal');
}

/** Kill shields add to the pool, up to KILL_SHIELD_CAP; a pool already above the cap (from other sources) is kept. */
function stackKillShield(current: number, amount: number) { return Math.max(current, Math.min(KILL_SHIELD_CAP, current + amount)); }

/** suppressEnergy marks a Solar Flare kill: no energy, and regular aliens give no killing buff or kill heal (bosses keep every reward). */
export function killEnemy(state: GameState, idx: number, fromMeteor = false, suppressEnergy = false) {
  const victim = state.enemies[idx];
  if (!victim || victim.devourer?.merging || (victim.twin?.downedTicks ?? 0) > 0) return;
  if (state.neptune && victim.hp > 0 && (victim.type === 'fish_blue' || victim.type === 'fish_red')) return;
  if(victim.type==='spook') {
    state.spookFace={until:state.gameTick+SPOOK.faceTicks,id:victim.id};
    playAudioOneShot('/sounds/deghost.wav',.28*ATTACK_SFX_VOLUME,1.4);
    playAudioOneShot('/sounds/spook-bleh.mp3',1.75);
  }
  if (victim.impostorExpired) { state.enemies.splice(idx, 1); return; } // an Impostor with no boss left to copy just vanishes
  if (state.rubyStolenBy === victim.id) { state.rubyStolenBy = undefined; state.rubyTileX = victim.tileX; state.rubyTileY = victim.tileY; } // Snatcher drops Ruby
  if (victim.type === 'bleeder') state.bleedingUntil = 0; // lift the curse first, so this kill's own healing works
  if (victim.type === 'sporeling') gaiaSporeCloud(state, victim);
  if (victim.type === 'jellyfish') neptuneRevealClone(state);
  if (victim.type === 'pulsar' && state.binary) pulsarDied(state, victim); // Binary Star: its field takes hold, then explodes
  if (victim.type === 'pufferfish' && state.neptune) { // it bursts as it dies
    pufferBurst(state, victim);
    state.bombBlasts.push({ cx: victim.x, cy: victim.y, radius: 0, maxRadius: NEPTUNE_PUFF_RADIUS * TILE_SIZE, ticks: 28, water: true });
  }
  if (victim.type === 'moon_illusion' && !fromMeteor) moonShatter(state, victim);
  if (victim.type === 'sand_core' && state.venus) { spawnDeathParticles(state, victim); venusCoreDestroyed(state, victim); return; } // Venus: his core breaks his shield
  if (victim.type === 'sand_relic' && state.venus) { spawnDeathParticles(state, victim); venusRelicDestroyed(state, victim); return; } // Venus: a relic's effect
  if (victim.type === 'lost_soul' && state.trial?.devourer && !fromMeteor) { healPlayer(state, SINGULARITY_CHALLENGE.soulKillHeal); showRewardEffect(state, 'player', 'heal'); } // Singularity: killing a Lost Soul heals you a little
  if (isChallengeObject(victim.type)) {
    // Challenge objects grant no score, energy or progression; Neptune clones have their own small heal.
    spawnDeathParticles(state, victim);
    state.enemies.splice(idx, 1);
    if(state.neptune&&victim.type==='water_clone'){playNeptuneCloneNote();const scale=NEPTUNE_CLONE_CHARGE_HEAL/NEPTUNE_CLONE_KILL_HEAL;healPlayer(state,NEPTUNE_CLONE_KILL_HEAL,true,scale);healCore(state,NEPTUNE_CLONE_KILL_HEAL,scale);}
    if (victim.type === 'water_clone' || victim.type === 'water_bomb') playSFX_objectBreak('frost');
    else if (victim.type !== 'fish_blue' && victim.type !== 'fish_red') playSFX_alienDeath(); // fish sound plays on the Melody hit
    return;
  }
  if (victim.venusOrder !== undefined && state.venus) { // Venus: a totem of the sequence
    spawnDeathParticles(state, victim); venusTotemDestroyed(state, victim); playSFX_objectBreak('totem'); return;
  }
  if (victim.type === 'aegis_construct') {
    spawnDeathParticles(state, victim);
    encounterEffect(state, 'construct-break', victim, victim.x, victim.y, 150, '#78dedf');
    state.enemies.splice(idx, 1);
    const owner = state.enemies.find(e => e.id === victim.constructOwnerId);
    if (owner) refreshAegisShield(state, owner);
    playSFX_objectBreak('totem');
    return; // Objectives give no score, healing, energy, or stage progress.
  }
  if (victim.type === 'devourer') {
    if(state.mode==='endless')recordBoss('devourer',state);
    if (state.trial?.devourer) state.trial.devourer.defeatedMaxHp += victim.maxHp;
    if (!victim.devourer?.consumed && !victim.devourer?.merging) spawnDevourerCopies(state, victim); // a small body the Maw swallows is gone for good; any other death splits it
    if (state.enemies.some(other => other !== victim && other.type === 'devourer' && (other.encounterId ?? other.id) === (victim.encounterId ?? victim.id) && other.hp > 0)) {
      // Not the last of the family: no boss reward yet, but each body killed heals the player a little.
      if (!fromMeteor) healPlayer(state, DEVOURER_BODY_KILL_HEAL + 2 * constellationBonus(state, 'killHealing'));
      spawnDeathParticles(state, victim);
      state.enemies.splice(state.enemies.indexOf(victim), 1);
      playSFX_alienDeath();
      return;
    }
  }
  // A phase ends only after the last body and all its death-splits are gone.
  if (victim.type === 'devourer' && state.trial?.devourer && state.trial.devourer.phase < 3) {
    const trial = state.trial.devourer;
    trial.phase = (trial.phase + 1) as 2 | 3;
    spawnDeathParticles(state, victim);
    state.enemies.splice(state.enemies.indexOf(victim), 1);
    const next = createEncounterEnemy(state, 'devourer', victim.tileX, victim.tileY, singularityPhaseHP(trial.phase));
    state.enemies.push(next); initializeNewEncounter(state, next);
    state.bossSpawnName = `SOUL DEVOURER · PHASE ${trial.phase}`;
    state.bossSpawnColor = ENEMY_CONFIGS.devourer.color; state.bossSpawnTicks = BOSS_ANNOUNCEMENT_TICKS;
    playSFX_alienDeath();
    return;
  }
  if (victim.twin) {
    const partner = state.enemies.find(e => e !== victim && e.twin?.pairId === victim.twin!.pairId);
    if (partner && partner.hp > 0 && !partner.twin!.downedTicks) {
      victim.hp = 1; // Keep the downed body in the encounter without feeding casualty sweeps.
      victim.twin.downedTicks = TWIN_REVIVE_TICKS;
      victim.twin.fallTicks = 24;
      partner.twin!.partnerDownTicks = TWIN_REVIVE_TICKS;
      victim.path = []; victim.pushTiles = 0; victim.icyShieldHP = 0; victim.windupTicks = 0;
      victim.targetTileX = victim.tileX; victim.targetTileY = victim.tileY;
      victim.x = (victim.tileX + .5) * TILE_SIZE; victim.y = (victim.tileY + .5) * TILE_SIZE; victim.stepProgress = 0;
      spawnDeathParticles(state, victim);
      encounterEffect(state, 'fall', victim, victim.x, victim.y, 24, victim.twin.index === 1 ? '#83cfff' : '#f08062');
      return;
    }
    if (binaryLoseLife(state, victim)) return; // Binary Star: the pair loses one of its three lives and rises again
    if (partner) {
      encounterEffect(state, 'fall', partner, partner.x, partner.y, 30, partner.twin!.index === 1 ? '#83cfff' : '#f08062');
      spawnDeathParticles(state, partner);
      state.enemies.splice(state.enemies.indexOf(partner), 1);
    }
    encounterEffect(state, 'fall', victim, victim.x, victim.y, 30, victim.twin.index === 1 ? '#83cfff' : '#f08062');
    idx = state.enemies.indexOf(victim);
  }
  if (victim.aegis) {
    encounterEffect(state, 'sentinel-death', victim, victim.x, victim.y, 36, '#c5a35d');
    state.enemies = state.enemies.filter(e => e.constructOwnerId !== victim.id);
    idx = state.enemies.indexOf(victim);
  }
  if (state.enemies[idx]?.type === 'thorn_weaver') clearThornHazards(state);
  if (state.enemies[idx]?.type === 'sea_chanter') { stopSeaSounds(); }
  const e = state.enemies[idx];
  spawnDeathParticles(state, e);

  const skipRewards = fromMeteor, noBuff = suppressEnergy && !isBossType(e.type);
  const recoveredEnergy = e.type === 'energy_leech' ? (e.stolenEnergy ?? 0) : 0;
  const energyGain = suppressEnergy ? 0 : (skipRewards ? 0 : (STAR_ENERGY_PER_KILL + (e.type === 'charger' ? 15 : 0)) * (1 + 0.2 * constellationBonus(state, 'energy'))) + recoveredEnergy;
  addStarEnergy(state,Math.max(0,energyGain-(suppressEnergy?0:recoveredEnergy)));
  if(!suppressEnergy)addStarEnergy(state,recoveredEnergy,false);
  // Stolen energy is returned even when a meteor defeats the Leech.
  if (recoveredEnergy > 0 && !suppressEnergy) state.runnerEnergyFlashTicks = 60;
  if (!skipRewards) {
    state.killScore += ENEMY_CONFIGS[e.type].scoreValue;

    // Passive sustain — every kill heals a small flat amount, stacking on top of any
    // type-specific reward below (e.g. a healer kill grants this +24 more, not instead of).
    if (!noBuff) healPlayer(state, 5 + 2 * constellationBonus(state, 'killHealing'), false);

    // ── Kill effects by type ─────────────────────────────────────────────
    // Solar Flare kills skip the buffs; Bomber blasts, Splitter splits and the Impostor's smoke still happen.
    if (noBuff && e.type !== 'bomber' && e.type !== 'splitter' && e.type !== 'impostor') { /* no killing buff */ }
    else if (e.type === 'bomber') {
      // Explode on death — damages nearby allies
      const RANGE = ENEMY_CONFIGS.bomber.bombExplodeRange;
      playSFX_bomb(ALIEN_ATTACK_SFX.bomber);
      state.bombBlasts.push({ cx: e.x, cy: e.y, radius: 0, maxRadius: RANGE * TILE_SIZE, ticks: 25, trap: true });
      if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= RANGE) damagePlayer(state, 25);
      if (state.rubyTileX !== -1 && tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= RANGE) damageRuby(state, 30);
      for (const ally of state.enemies) {
        if (ally === e || (ally.twin?.downedTicks ?? 0) > 0) continue;
        if (tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) <= RANGE * 0.75) damageEnemy(state, ally, 20, 'enemy');
      }
    } else if (e.type === 'mirror_mite') {
      healPlayer(state, MOON_MITE_KILL_HEAL, false); showRewardEffect(state, 'player', 'heal');
      moonMiteHint(state);
    } else if (e.type === 'fast') {
      state.speedActiveTicks = Math.max(state.speedActiveTicks, 120);
      state.speedFlashTicks = 15;
      showRewardEffect(state, 'player', 'speed');
      playSFX_speed();
    } else if (e.type === 'armored') {
      state.playerShieldHP = stackKillShield(state.playerShieldHP, KILL_SHIELD_HP);
      showRewardEffect(state, 'player', 'shield');
      playSFX_rubyToggle();
    } else if (e.type === 'healer') {
      healPlayer(state, 24);
      showRewardEffect(state, 'player', 'heal');
      try { const a = gameAudio('/sounds/grow.wav'); a.volume = 0.38; a.play().catch(() => {}); } catch {}
    } else if (e.type === 'charger') {
      if (!suppressEnergy) state.runnerEnergyFlashTicks = 60;
    } else if (e.type === 'ghost') {
      if (state.rubyTileX !== -1) {
        healCore(state, 15);
        showRewardEffect(state, 'ruby', 'heal');
      }
      playSFX_teleport();
    } else if (e.type === 'shielder') {
      state.rubyShieldHP = stackKillShield(state.rubyShieldHP, KILL_SHIELD_HP);
      showRewardEffect(state, 'ruby', 'shield');
      playSFX_rubyToggle();
    } else if (e.type === 'bleeder') {
      // the curse was lifted at the start of killEnemy; now a short regeneration
      state.regenUntil = state.gameTick + BLEEDER.regenTicks; showRewardEffect(state, 'player', 'heal');
    } else if (e.type === 'shooter') {
      state.bulletStunUntil = state.gameTick + SHOOTER.rewardTicks; showRewardEffect(state, 'player', 'stun');
    } else if (e.type === 'impostor') {
      // Unmasked: grey smoke puffs rise where it fell, with the decoy-break sound, so it reads as a fake.
      for (let i = 0; i < 18; i++) {
        const angle = i / 18 * Math.PI * 2, size = 10 + (i % 3) * 4;
        state.deathParticles.push({ x: e.x + Math.cos(angle) * 12, y: e.y + Math.sin(angle) * 10, vx: Math.cos(angle) * 2.4, vy: Math.sin(angle) * 1.6 - 2.2 - (i % 4) * .5, ticks: 70, maxTicks: 70, size, color: i % 3 === 0 ? '#e4e4ee' : i % 3 === 1 ? '#b4b4c2' : '#8a8a98' });
      }
      playSFX_decoyDeath();
      // A fake for a fake: a fragile decoy where it fell draws nearby aliens for a few seconds.
      if (!noBuff) {
        state.build.decoy = { x: (e.tileX + .5) * TILE_SIZE, y: (e.tileY + .5) * TILE_SIZE, tileX: e.tileX, tileY: e.tileY, ticks: IMPOSTOR.rewardDecoyTicks, free: true };
        state.enemies.forEach(enemy => enemy.pathTimer = 0);
      }
    } else if (e.type === 'reflector') {
      state.rubyCopyUntil = state.gameTick + REFLECTOR.rewardTicks; showRewardEffect(state, 'ruby', 'stun'); playSFX_special('empower');
    } else if (e.type === 'grappler') {
      state.ccImmuneUntil=state.gameTick+GRAPPLER.rewardTicks;
      state.playerKnockback=null;state.playerFrozenTicks=0;state.playerStunned=false;
      if(state.gaia)state.gaia.snaredTicks=0;
      showRewardEffect(state,'player','shield');playSFX_special('empower');
    } else if (e.type === 'jammer') {
      state.jammerWaveReady=true;
      showRewardEffect(state,'player','stun');playSFX_special('empower');
    } else if (e.type === 'dropper') {
      state.heavyImpactUntil = state.gameTick + DROPPER.rewardTicks;
      showRewardEffect(state, 'player', 'stun'); playSFX_special('empower');
    } else if (e.type === 'trapper') {
      state.explosiveBulletsUntil = state.gameTick + TRAPPER.rewardTicks; showRewardEffect(state, 'player', 'electric'); playSFX_special('empower');
    } else if (e.type === 'snatcher') {
      state.rubyShieldHP = stackKillShield(state.rubyShieldHP, SNATCHER.rewardRubyShield); showRewardEffect(state, 'ruby', 'shield'); playSFX_special('rubyBack');
    } else if (e.type === 'enchanter') {
      state.empoweredUntil = state.gameTick + ENCHANTER.rewardTicks; showRewardEffect(state, 'player', 'stun'); playSFX_special('empower');
    } else if (e.type === 'lancer') {
      state.laserStunTicks = Math.max(state.laserStunTicks ?? 0, LANCER.rewardTicks);
      showRewardEffect(state, 'player', 'stun');
      playSFX_laser(0.6);
    } else if (e.type === 'sniper') {
      // Grant player electric chain buff for ~5s (300 ticks)
      state.electricBuffTicks = Math.max(state.electricBuffTicks, 300);
      showRewardEffect(state, 'player', 'electric');
      playSFX_laser();
    } else if (e.type === 'splitter') {
      // Spawn 2 mini_splitters
      const miniCfg = ENEMY_CONFIGS.mini_splitter;
      const offsets: [number,number][] = [[-1,0],[1,0],[0,-1],[0,1],[0,0]];
      const spawnPositions: [number,number][] = [];
      for (const [ox, oy] of offsets) {
        const tx = e.tileX + ox, ty = e.tileY + oy;
        if (isFloorTile(state.map, tx, ty)) { spawnPositions.push([tx, ty]); if (spawnPositions.length >= 2) break; }
      }
      while (spawnPositions.length < 2) spawnPositions.push([e.tileX, e.tileY]);
      for (const [tx, ty] of spawnPositions) {
        state.enemies.push({
          id: state.nextEnemyId++, type: 'mini_splitter',
          x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2,
          tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty, stepProgress: 0,
          hp: miniCfg.maxHp * REGULAR_ENEMY_HP_MULT * constellationAlienHPMult(state), maxHp: miniCfg.maxHp * REGULAR_ENEMY_HP_MULT * constellationAlienHPMult(state),
          path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
          pushDirX: 0, pushDirY: 0, pushTiles: 0,
          flashTicks: 0, healFlashTicks: 0, shootTicks: 0, exploding: false, explodeTick: 0,
          windupTicks: 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1, phaseTimer: 0,
          icyShieldHP: 0,
        });
      }
    }
  }

  if(e.type==='blinker'&&e.blinkOnDeath)warpPlayerFromBlinker(state);
  if (e.type === 'trapper' && state.mines) state.mines = state.mines.filter(m => m.ownerId !== e.id); // its mines go with it
  buildDeathField(state,e);
  if(!fromMeteor)blessingDeath(state,e);

  // Boss-tier full-restore reward — applies no matter how the kill happened (including a
  // meteor strike finishing it off), unlike the score/energy rewards above which meteor kills skip.
  if (isBossType(e.type)) {
    state.bossesKilled++;
    recordBoss(e.type, state);
    if (state.trial) { state.gamePhase = 'won'; clearSunEncounter(state); clearJupiterEncounter(state); clearSaturnEncounter(state); clearBinaryEncounter(state); clearSiriusEncounter(state); clearSingularityMaws(state); clearVenusEncounter(state); } // defeating the guardian clears the trial
    offerConstellation(state);
    offerCelestialBlessing(state);
    if (state.bossesKilled === SPECIAL_UNLOCK_KILLS) announceAscension(state);
    if (state.bossesKilled >= SPECIAL_UNLOCK_KILLS) {
      state.specialSkill = BOSS_SKILL_REWARDS[e.type];
    }
    if(!countBossEncounters(state,e)){state.bossTimer = BOSS_SPAWN_INTERVAL;state.bossWarningTicks = 0;state.bossOverlapTicks=0;}
    healPlayer(state, PLAYER_MAX_HP, false);
    healCore(state, RUBY_MAX_HP);
    showRewardEffect(state, 'player', 'restore');
    showRewardEffect(state, 'ruby', 'restore');
    addStarEnergy(state,STAR_ENERGY_MAX,false);
    if(state.bossesKilled>=SPECIAL_UNLOCK_KILLS)playCelestialSound('ready');
    if (e.type === 'splitter_queen') {
      clearMoonIllusions(state);
      // Killing the real Queen instantly dissolves any echoes she left behind
      for (let j = state.enemies.length - 1; j >= 0; j--) {
        if (state.enemies[j].type === 'queen_echo') {
          spawnDeathParticles(state, state.enemies[j]);
          state.enemies.splice(j, 1);
          playSFX_decoyDeath();
        }
      }
    }
    if (e.type === 'storm_reaper' && state.hallwaySeal !== -1) {
      // No reason to keep a hallway sealed once the one who sealed it is dead
      setHallwayWalled(state, state.hallwaySeal, false);
      state.hallwaySeal = -1;
      state.hallwaySealTicks = 0;
    }
    if (e.type === 'frost_warden') {
      state.frostIceTiles = []; // ice hazards vanish once she's dead
    }
  }

  // Re-locate by reference — the echo cleanup above may have shifted this enemy's index
  const finalIdx = state.enemies.indexOf(e);
  if (finalIdx !== -1) state.enemies.splice(finalIdx, 1);

  if (isBossType(e.type)) playSFX_bossDeath();
  else if (e.type === 'queen_echo') playSFX_decoyDeath();
  else playSFX_alienDeath();
}

/** Current phase health combines every living body; dead bodies retain their place in its capacity. */
export function singularityTrialHealth(state: GameState) {
  const trial = state.trial?.devourer;
  const bodies = state.enemies.filter(e => e.type === 'devourer' && e.hp > 0 && (e.encounterId ?? e.id) === trial?.encounterId);
  return { hp: bodies.reduce((n,e)=>n+e.hp,0), max: (trial?.defeatedMaxHp ?? 0) + bodies.reduce((n,e)=>n+e.maxHp,0), bodies: bodies.length };
}

function moveSingularityBody(state: GameState, e: Enemy): boolean {
  const gravity = e.singularityPull!, dx=gravity.dx??-1,dy=gravity.dy??0;
  // Finish the in-flight step first, so suction never snaps a body across cover.
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    if (gravity.started || !isFloorTile(state.map, e.tileX+dx, e.tileY+dy)) { e.singularityPull = undefined; return false; }
    e.targetTileX = e.tileX+dx; e.targetTileY = e.tileY+dy; e.stepProgress = 0; gravity.started = true;
  }
  e.stepProgress = Math.min(TILE_SIZE, e.stepProgress + (gravity.speed??3) * MOVE_SPEED_MULT);
  e.x = (e.tileX+.5)*TILE_SIZE + (e.targetTileX-e.tileX)*e.stepProgress;
  e.y = (e.tileY+.5)*TILE_SIZE + (e.targetTileY-e.tileY)*e.stepProgress;
  if (e.stepProgress >= TILE_SIZE) {
    e.tileX=e.targetTileX;e.tileY=e.targetTileY;e.stepProgress=0;e.path=[];e.pathTimer=0;
    if(gravity.started)e.singularityPull=undefined;
  }
  return true;
}

// ─── Player movement ──────────────────────────────────────────────────────────

function updatePlayer(state: GameState) {
  if (state.noFreeze && !state.playerStunned) state.playerFrozenTicks = 0;
  const ccImmune=playerCCImmune(state);
  if(ccImmune){state.playerKnockback=null;state.playerFrozenTicks=0;state.playerStunned=false;if(state.gaia)state.gaia.snaredTicks=0;}
  const resistSlow=(mult:number)=>ccImmune&&mult<1?1:mult;
  // Frozen solid by a Frost Warden ice tile — no movement at all until it wears off
  if (state.playerFrozenTicks > 0 || (state.gaia?.snaredTicks ?? 0) > 0) { // frozen, or held by a Gaia root snare
    state.playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);
    return;
  }

  const chilled = isPlayerChilled(state);
  const boostMultiplier=state.jupiter?.stage==='escape'&&jupiterBoss(state)?JUPITER.raceSpeedBoost:SPEED_MULT;
  const speedMultiplier =
    (state.speedActiveTicks > 0 ? boostMultiplier * (state.playerCarryingRuby ? CARRY_BOOST_SPEED_MULT : 1) :
    state.playerCarryingRuby ? PLAYER_CARRY_MULT : 1.0) *
    (chilled ? FROST_CHILL_SPEED_MULT : 1) * (isPlayerInThorns(state) ? resistSlow(THORN_SLOW_MULT) : 1) *
    ((state.empoweredUntil ?? 0) > state.gameTick ? ENCHANTER.rewardSpeedMult : 1) * // Enchanter kill: Empowered also quickens you
    (state.trial?.devourer ? gasPlayerSlow(state) : 1); // Singularity: toxic gas slows you
  if(state.playerKnockback?.hookOwnerId!==undefined) {
    const owner=state.enemies.find(e=>e.id===state.playerKnockback!.hookOwnerId);
    if(!owner||owner.hp<=0||owner.hook?.phase!=='pull'||owner.pushTiles>0||(owner.buildStopUntil??0)>state.gameTick)state.playerKnockback=null;
  }
  const knockback = state.playerKnockback;
  const baseSpeed = knockback?.started ? PRAYER_KNOCKBACK_SPEED * (knockback.hookOwnerId!==undefined ? GRAPPLER.pullSpeedMult : 1) * (knockback.speedMult ?? 1) : PLAYER_BASE_SPEED * speedMultiplier * (1 + 0.08 * constellationBonus(state, 'speed')) * resistSlow(neptuneTideSpeed(state)) * resistSlow(neptuneClamSlow(state)) * resistSlow(gaiaPlayerSpeed(state)) * resistSlow(jupiterPlayerSpeed(state)) * resistSlow(blessingSpeedMultiplier(state)) * resistSlow(siriusPlayerSpeed(state)) * ((state.stormHasteTicks ?? 0) > 0 ? SPECIAL_REAPER_HASTE : 1);

  if (state.playerTileX === state.playerTargetX && state.playerTileY === state.playerTargetY) {

    if (knockback && !knockback.carryChecked) {
      // Carrying Ruby halves every push, and Ursa Major halves it again (they stack). Whole tiles only, so the
      // leftover fraction carries over to the next push (a halved 1-tile push lands every other time).
      knockback.carryChecked = true;
      const pushMult = (state.playerCarryingRuby ? CARRY_PUSH_MULT : 1) * (state.constellations.includes('steady') ? URSA_PUSH_MULT : 1);
      if (pushMult < 1) {
        const half = (knockback.tilesLeft ?? 1) * pushMult + (state.carryPushRemainder ?? 0), tiles = Math.floor(half + 1e-9);
        state.carryPushRemainder = half - tiles;
        if (tiles <= 0) state.playerKnockback = null; else knockback.tilesLeft = tiles;
      }
    }
    if(knockback?.hookOwnerId!==undefined&&state.playerKnockback) {
      const owner=state.enemies.find(e=>e.id===knockback.hookOwnerId)!;
      const dx=owner.tileX-state.playerTileX,dy=owner.tileY-state.playerTileY;
      if(Math.abs(dx)+Math.abs(dy)<=1)state.playerKnockback=null;
      else {
        // Pick adjacent floor steps closest to the locked ray; never use fractional tiles or cut corners.
        const sx=Math.sign(dx),sy=Math.sign(dy),ray=owner.hook!;
        const error=(x:number,y:number)=>Math.abs((x+.5-owner.x/TILE_SIZE)*ray.dy-(y+.5-owner.y/TILE_SIZE)*ray.dx);
        const horizontal=sx!==0&&(sy===0||error(state.playerTileX+sx,state.playerTileY)<=error(state.playerTileX,state.playerTileY+sy));
        knockback.dirX=horizontal?sx:0;knockback.dirY=horizontal?0:sy;
      }
    }
    if (knockback && state.playerKnockback) {
      // Finish any existing step before pushing one cardinal tile. Never snap the
      // player across a wall or overwrite held input with the forced direction.
      const nx = state.playerTileX + knockback.dirX;
      const ny = state.playerTileY + knockback.dirY;
      if (isFloorTile(state.map, nx, ny)) {
        state.playerTargetX = nx; state.playerTargetY = ny;
        state.playerStepProgress = 0;
        knockback.started = true;
        if (!knockback.shaken) { // a small shake once per push, whatever caused it
          knockback.shaken = true;
          state.screenShakeTicks = Math.max(state.screenShakeTicks, KNOCKBACK_SHAKE_TICKS);
          state.screenShakeAmt = Math.max(state.screenShakeAmt, KNOCKBACK_SHAKE_AMOUNT);
        }
      } else state.playerKnockback = null;
    } else {
      // Try to apply queued direction
      // All keyboard, swipe, and joystick input stays raw in the queue. Reverse it
      // exactly once when selecting the next tile; never reverse an in-flight step.
      const controlSign = isMovementReversed(state) ? -1 : 1;
      const jupiterDash=state.jupiter&&(state.jupiter.playerBoost>0);
      const qdx = jupiterDash ? state.jupiter!.playerDashX??state.playerDirX : state.playerQueuedDirX * controlSign;
      const qdy = jupiterDash ? state.jupiter!.playerDashY??state.playerDirY : state.playerQueuedDirY * controlSign;
      if (qdx !== 0 || qdy !== 0) {
        const ntx = state.playerTileX + qdx;
        const nty = state.playerTileY + qdy;
        if (isFloorTile(state.map, ntx, nty) || siriusCanFloat(state, ntx, nty)) { // Sirius Halo: float over walls
          state.playerTargetX = ntx;
          state.playerTargetY = nty;
          state.playerDirX = qdx;
          state.playerDirY = qdy;
          state.playerStepProgress = 0;
        } else if(state.build.wallStepReady&&state.speedActiveTicks>0&&Math.abs(qdx)+Math.abs(qdy)===1&&chamberOfTile(ntx,nty)>=0&&chamberOfTile(ntx,nty)===chamberOfTile(state.playerTileX,state.playerTileY)&&chamberOfTile(ntx+qdx,nty+qdy)===chamberOfTile(ntx,nty)&&isFloorTile(state.map,ntx+qdx,nty+qdy)){
          state.build.impacts.push({x:state.playerX,y:state.playerY,kind:'phase',ticks:18});
          state.playerTileX=state.playerTargetX=ntx+qdx;state.playerTileY=state.playerTargetY=nty+qdy;
          state.playerX=(state.playerTileX+.5)*TILE_SIZE;state.playerY=(state.playerTileY+.5)*TILE_SIZE;
          state.playerStepProgress=0;state.playerDirX=qdx;state.playerDirY=qdy;
          state.speedActiveTicks=state.speedFlashTicks=0;state.build.wallStepReady=false;
          state.build.impacts.push({x:state.playerX,y:state.playerY,kind:'phase',ticks:18});
          if(!state.noFreeze&&!ccImmune&&(state.frostIceTiles.some(([tx,ty])=>tx===state.playerTileX&&ty===state.playerTileY)||saturnIceAt(state,state.playerTileX,state.playerTileY))){state.playerFrozenTicks=FROST_FREEZE_DURATION;if(state.saturn)freezeSaturnPlayer(state);state.playerQueuedDirX=state.playerQueuedDirY=0;playSFX_frostFreeze();}
        } else if(jupiterDash) state.jupiter!.playerBoost=0;
      }
    }
  } else {
    state.playerStepProgress += baseSpeed * MOVE_SPEED_MULT;
    const dx = state.playerTargetX - state.playerTileX;
    const dy = state.playerTargetY - state.playerTileY;
    state.playerX = state.playerTileX * TILE_SIZE + TILE_SIZE / 2 + dx * Math.min(state.playerStepProgress, TILE_SIZE);
    state.playerY = state.playerTileY * TILE_SIZE + TILE_SIZE / 2 + dy * Math.min(state.playerStepProgress, TILE_SIZE);
    if (state.playerStepProgress >= TILE_SIZE) {
      state.playerTileX = state.playerTargetX;
      state.playerTileY = state.playerTargetY;
      state.playerX = state.playerTileX * TILE_SIZE + TILE_SIZE / 2;
      state.playerY = state.playerTileY * TILE_SIZE + TILE_SIZE / 2;
      state.playerStepProgress = 0;
      if (knockback?.started) {
        if ((knockback.tilesLeft ?? 1) > 1) { knockback.tilesLeft = (knockback.tilesLeft ?? 1) - 1; knockback.started = false; }
        else state.playerKnockback = null;
      }

      // Stepped onto an active Frost Warden ice tile — freeze in place
      if (!state.noFreeze&&!ccImmune&&(state.frostIceTiles.some(([tx, ty]) => tx === state.playerTileX && ty === state.playerTileY) || saturnIceAt(state,state.playerTileX,state.playerTileY))) {
        state.playerFrozenTicks = FROST_FREEZE_DURATION;
        if (state.saturn) freezeSaturnPlayer(state);
        state.playerQueuedDirX = 0; state.playerQueuedDirY = 0;
        playSFX_frostFreeze();
      }
    }
  }

  // Update which chamber the player is in
  state.playerChamber = chamberOfTile(state.playerTileX, state.playerTileY);

  // Collect resources
  for (let i = state.resources.length - 1; i >= 0; i--) {
    const r = state.resources[i];
    if (r.tileX === state.playerTileX && r.tileY === state.playerTileY) {
      if (r.type === 'shield') {
        state.resources.splice(i, 1);
      } else if (r.type === 'health') {
        healPlayer(state, HEAL_AMOUNT);
        state.resources.splice(i, 1);
        playSFX_healPickup();
      } else {
        const filled = addStarEnergy(state, ENERGY_AMOUNT * (1 + 0.2 * constellationBonus(state, 'energy')));
        showRewardEffect(state, 'player', 'energy');
        if (!filled) playSFX_pickup();
        grantInstantSpeedBoost(state, false);
        state.resources.splice(i, 1);
      }
    }
  }
}

// ─── Meteorite ───────────────────────────────────────────────────────────────

/** Comet and Shooter stun: reuses the freeze lock (no moving, attacking or casting). An ice freeze already running keeps its look. */
export function stunPlayer(state: GameState, ticks: number) {
  if(playerCCImmune(state))return;
  if (state.gamePhase !== 'playing') return;
  if (state.playerFrozenTicks <= 0) state.playerStunned = true;
  state.playerFrozenTicks = Math.max(state.playerFrozenTicks, ticks);
}

/** Shooter orbs fly straight until a wall. Hitting the player deals damage and stuns; a placed Ruby only takes damage. */
function updateEnemyShots(state: GameState) {
  const shots = state.enemyShots ??= [];
  for (let i = shots.length - 1; i >= 0; i--) {
    const shot = shots[i], previousX=shot.x, previousY=shot.y;
    shot.x += shot.dx; shot.y += shot.dy; shot.ticks++;
    const tx = Math.floor(shot.x / TILE_SIZE), ty = Math.floor(shot.y / TILE_SIZE);
    if (!isFloorTile(state.map, tx, ty)) { if(shot.flare)igniteSpitterTile(state,previousX,previousY);if(shot.spore)gaiaSporeImpact(state,previousX,previousY);shots.splice(i, 1); continue; }
    const owner = state.enemies.find(en => en.id === shot.ownerId && en.hp > 0), cfg = ENEMY_CONFIGS.shooter, reach = SHOOTER.hitRadius * TILE_SIZE;
    if (shot.spore) {
      const impact = () => { gaiaSporeImpact(state, shot.x, shot.y); shots.splice(i, 1); };
      if (Math.hypot(shot.x-state.playerX,shot.y-state.playerY) <= TILE_SIZE*.3) {
        damagePlayer(state, ENEMY_CONFIGS.sporeling.damageToPlayer, owner);
        if (state.gaia && !state.enemyDecoyActive && !playerCCImmune(state)) state.gaia.sporeSlowTicks = Math.max(state.gaia.sporeSlowTicks ?? 0, GAIA_SPORE_SHOT.slowTicks);
        impact(); continue;
      }
      if (state.rubyTileX !== -1 && !state.playerCarryingRuby && Math.hypot(shot.x-(state.rubyTileX+.5)*TILE_SIZE,shot.y-(state.rubyTileY+.5)*TILE_SIZE) <= TILE_SIZE*.3) {
        damageRuby(state, ENEMY_CONFIGS.sporeling.damageToRuby, owner); impact(); continue;
      }
      if (shot.ticks >= GAIA_SPORE_SHOT.life) impact();
      continue;
    }
    if (shot.flare) {
      if (shot.ticks >= SUN.spitter.shotLife) { igniteSpitterTile(state,shot.x,shot.y);shots.splice(i,1); continue; }
      if (Math.hypot(shot.x-state.playerX,shot.y-state.playerY)<=TILE_SIZE*.3) {
        damagePlayer(state,ENEMY_CONFIGS.flare_spitter.damageToPlayer,owner);if(state.gamePhase==='playing')stunPlayer(state,SUN.spitter.hitStun);igniteSpitterTile(state,shot.x,shot.y);if(state.sun)(state.sun.spitterHits??=[]).push({x:state.playerX,y:state.playerY,ticks:24});shots.splice(i,1);continue;
      }
      if(state.rubyTileX!==-1&&!state.playerCarryingRuby&&Math.hypot(shot.x-(state.rubyTileX+.5)*TILE_SIZE,shot.y-(state.rubyTileY+.5)*TILE_SIZE)<=TILE_SIZE*.3){damageRuby(state,ENEMY_CONFIGS.flare_spitter.damageToRuby,owner);igniteSpitterTile(state,shot.x,shot.y);shots.splice(i,1);}
      continue;
    }
    if (shot.mirror) { // a bullet bounced off a Reflector: hurts only you, no stun
      if (Math.hypot(shot.x - state.playerX, shot.y - state.playerY) <= reach) { damagePlayer(state, REFLECTOR.bulletDamage, owner); playSFX_special('orbRuby'); shots.splice(i, 1); }
      else if (shot.ticks > 240) shots.splice(i, 1);
      continue;
    }
    if (Math.hypot(shot.x - state.playerX, shot.y - state.playerY) <= reach) {
      damagePlayer(state, cfg.damageToPlayer, owner);
      if (!state.enemyDecoyActive) stunPlayer(state, SHOOTER.stunTicks);
      playSFX_special('orbHit');
      shots.splice(i, 1); continue;
    }
    if (state.rubyTileX !== -1 && !state.playerCarryingRuby && Math.hypot(shot.x - (state.rubyTileX + .5) * TILE_SIZE, shot.y - (state.rubyTileY + .5) * TILE_SIZE) <= reach) {
      damageRuby(state, cfg.damageToRuby, owner); playSFX_special('orbRuby'); shots.splice(i, 1);
    }
  }
}

/** Trapper mines: arm, fuse when the player steps on one, then blast; they fade after TRAPPER.lifeTicks. */
function updateMines(state: GameState) {
  const mines = state.mines ??= [];
  for (let i = mines.length - 1; i >= 0; i--) {
    const m = mines[i], cx = (m.tileX + .5) * TILE_SIZE, cy = (m.tileY + .5) * TILE_SIZE;
    m.ticks++;
    if (m.fuse === undefined) {
      if (m.ticks >= TRAPPER.lifeTicks) { mines.splice(i, 1); continue; }
      if (m.ticks >= TRAPPER.armTicks && state.gamePhase === 'playing' && Math.hypot(state.playerX - cx, state.playerY - cy) <= TRAPPER.triggerRange * TILE_SIZE) {
        m.fuse = TRAPPER.fuseTicks; playAudioOneShot('/sounds/bomb-ready.wav', .3, 1.4);
      }
      continue;
    }
    if (--m.fuse > 0) continue;
    mines.splice(i, 1);
    const owner = state.enemies.find(e => e.id === m.ownerId && e.hp > 0), r = TRAPPER.radius;
    state.bombBlasts.push({ cx, cy, radius: 0, maxRadius: r * TILE_SIZE, ticks: 28, trap: true });
    playAudioOneShot('/sounds/bombExplode.wav', .832 * ATTACK_SFX_VOLUME, 1.35); // your bomb's sound, pitched up
    state.screenShakeTicks = Math.max(state.screenShakeTicks, 10); state.screenShakeAmt = Math.max(state.screenShakeAmt, 5);
    if (Math.hypot(state.playerX - cx, state.playerY - cy) <= r * TILE_SIZE) damagePlayer(state, TRAPPER.damage, owner);
    if (state.rubyTileX !== -1 && !state.playerCarryingRuby && tileEuclidDist(state.rubyTileX, state.rubyTileY, m.tileX, m.tileY) <= r) damageRuby(state, TRAPPER.rubyDamage, owner);
    for (const e of [...state.enemies]) {
      if (!state.enemies.includes(e) || isBossType(e.type) || e.hp <= 0 || tileEuclidDist(e.tileX, e.tileY, m.tileX, m.tileY) > r) continue;
      damageEnemy(state, e, TRAPPER.alienDamage, 'enemy');
      if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e));
    }
  }
}

/** Reflector mirrors: the first mirror the segment (x0,y0)->(x1,y1), in tile units, crosses from its front, with the
 *  crossing point; null if none. Each mirror is a 3-tile plate across the Reflector's facing edge. */
export function mirrorCrossing(state: GameState, x0: number, y0: number, x1: number, y1: number): { e: Enemy; x: number; y: number } | null {
  let best: { e: Enemy; x: number; y: number } | null = null, bestT = Infinity;
  for (const e of state.enemies) {
    if (e.type !== 'reflector' || e.hp <= 0 || e.faceX === undefined || e.faceY === undefined || (e.mirrorDownUntil ?? 0) > state.gameTick) continue;
    const fx = e.faceX, fy = e.faceY, mx = e.x / TILE_SIZE + fx * .5, my = e.y / TILE_SIZE + fy * .5;
    const s0 = (x0 - mx) * fx + (y0 - my) * fy, s1 = (x1 - mx) * fx + (y1 - my) * fy;
    if (!(s0 > 0 && s1 <= 0)) continue;
    const t = s0 / (s0 - s1), cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
    if (Math.abs((cx - mx) * -fy + (cy - my) * fx) > REFLECTOR.halfWidth || t >= bestT) continue;
    bestT = t; best = { e, x: cx, y: cy };
  }
  return best;
}

/** A laser that hits a mirror leaves it bent REFLECTOR.bendDegrees to a random side; it hurts the player only if they
 *  stand in that new path. */
function bendReflectedLaser(state: GameState, m: Enemy, x: number, y: number, backX: number, backY: number, range: number) {
  const a = (Math.random() < .5 ? -1 : 1) * REFLECTOR.bendDegrees * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
  const rx = backX * cos - backY * sin, ry = backX * sin + backY * cos;
  let ex = x, ey = y;
  for (let d = .2; d <= range + .0001; d += .2) { const px = x + rx * d, py = y + ry * d; if (!isFloorTile(state.map, Math.floor(px), Math.floor(py))) break; ex = px; ey = py; }
  state.laserBeams.push({ fromX: x * TILE_SIZE, fromY: y * TILE_SIZE, dirX: rx, dirY: ry, endX: ex * TILE_SIZE, endY: ey * TILE_SIZE, ticks: 18, powered: false, color: '#dfe8f5' });
  // Distance from the player to the bent beam's segment, in tiles
  const px = state.playerX / TILE_SIZE - x, py = state.playerY / TILE_SIZE - y, len = Math.hypot(ex - x, ey - y) || 1;
  const along = Math.max(0, Math.min(len, px * rx + py * ry)), off = Math.hypot(px - rx * along, py - ry * along);
  if (off <= REFLECTOR.bendHitRadius) damagePlayer(state, REFLECTOR.laserDamage, m);
}

/** Any Wave hit, push, pull, stun or slow knocks a Reflector's mirror down for a while. */
function checkReflectorControl(state: GameState, e: Enemy) {
  const tick = state.gameTick, base = MOVE_SPEED_MULT * ((e.enchantedUntil ?? 0) > tick ? ENCHANTER.speedMult : 1);
  const controlled = e.pushTiles > 0 || (e.buildStopUntil ?? 0) > tick || celestialMoveMultiplier(state, e) < base - 1e-6;
  if (controlled) dropReflectorMirror(state, e);
  e.mirrorDown = (e.mirrorDownUntil ?? 0) > tick; // for drawing
}
export function dropReflectorMirror(state: GameState, e: Enemy) {
  if (e.type === 'reflector') e.mirrorDownUntil = Math.max(e.mirrorDownUntil ?? 0, state.gameTick + REFLECTOR.mirrorDownTicks);
}

function cometGap() { return COMET.minGap + Math.floor(Math.random() * (COMET.maxGap - COMET.minGap + 1)); }

/** Marks a random 3x3 area of floor in the player's room (the nearest room from a hallway) and starts the warning. */
function startComet(state: GameState) {
  const comet = state.comet ??= { timer: cometGap(), target: null, impact: null };
  let room = chamberOfTile(state.playerTileX, state.playerTileY);
  if (room < 0) {
    let best = Infinity;
    CHAMBER_BOUNDS.forEach(([r1, c1, r2, c2], i) => {
      const d = Math.hypot((c1 + c2) / 2 - state.playerTileX, (r1 + r2) / 2 - state.playerTileY);
      if (d < best) { best = d; room = i; }
    });
  }
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[room], edge = Math.floor(COMET.size / 2) + 1;
  let x = Math.min(c2 - edge, Math.max(c1 + edge, state.playerTileX)), y = Math.min(r2 - edge, Math.max(r1 + edge, state.playerTileY));
  // Random spots stay within COMET.spawnRange tiles of the player (half a chamber), clamped inside the room.
  const minX = Math.max(c1 + edge, x - COMET.spawnRange), maxX = Math.min(c2 - edge, x + COMET.spawnRange);
  const minY = Math.max(r1 + edge, y - COMET.spawnRange), maxY = Math.min(r2 - edge, y + COMET.spawnRange);
  for (let attempt = 0; attempt < 40; attempt++) {
    const tx = minX + Math.floor(Math.random() * (maxX - minX + 1)), ty = minY + Math.floor(Math.random() * (maxY - minY + 1));
    if (isFloorTile(state.map, tx, ty)) { x = tx; y = ty; break; }
  }
  // Sometimes it aims straight at the player instead (even in a hallway).
  if (Math.random() < COMET.playerAimChance) { x = state.playerTileX; y = state.playerTileY; }
  comet.target = { x, y, ticks: COMET.warningTicks };
  playSFX_meteorWarning(false);
}

export function godTriggerComet(state: GameState) {
  if (state.gamePhase !== 'playing' || state.comet?.target) return false;
  startComet(state);
  return true;
}

function strikeComet(state: GameState, cx: number, cy: number) {
  const half = Math.floor(COMET.size / 2), inside = (tx: number, ty: number) => Math.abs(tx - cx) <= half && Math.abs(ty - cy) <= half;
  const bossShare = state.bossesKilled >= SPECIAL_UNLOCK_KILLS ? COMET.lateBossShare : COMET.bossShare;
  for (const e of [...state.enemies].reverse()) {
    if (!state.enemies.includes(e) || e.hp <= 0 || (e.twin?.downedTicks ?? 0) > 0 || !inside(e.tileX, e.tileY)) continue;
    const big = isBossType(e.type) || e.type === 'aegis_construct';
    damageEnemy(state, e, big ? e.maxHp * bossShare : COMET.alienDamage * skillAlienScale(state), 'meteor');
    if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
  }
  if (inside(state.playerTileX, state.playerTileY)) {
    damagePlayer(state, COMET.playerDamage);
    // Stun: reuses the freeze lock (no moving, attacking or casting). An ice freeze already running keeps its own look.
    stunPlayer(state, COMET.stunTicks);
  }
  if (state.rubyTileX !== -1 && !state.playerCarryingRuby && inside(state.rubyTileX, state.rubyTileY)) damageRuby(state, COMET.rubyDamage);
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 14); state.screenShakeAmt = Math.max(state.screenShakeAmt, 6);
  playSFX_bomb();
}

function updateComet(state: GameState) {
  const comet = state.comet ??= { timer: cometGap(), target: null, impact: null };
  if (state.bossesKilled < COMET.fromStage && !comet.target && !comet.impact) return; // comets begin at stage 3
  if (comet.impact && --comet.impact.ticks <= 0) comet.impact = null;
  if (comet.target) {
    if (--comet.target.ticks === COMET.fallTicks) playAudioOneShot('/sounds/falling-thing.wav', .6 * ATTACK_SFX_VOLUME); // 0.75s, the length of the fall
    if (comet.target.ticks > 0) return;
    const { x, y } = comet.target;
    comet.target = null;
    comet.impact = { x, y, ticks: COMET.impactTicks };
    comet.timer = cometGap();
    strikeComet(state, x, y);
    return;
  }
  if (--comet.timer <= 0) startComet(state);
}

function updateMeteorite(state: GameState) {
  if(state.noMeteors)return;
  if (state.meteoriteWarning >= 0) {
    // Short alarm pulses during the red-flashing countdown, only in the impact chamber.
    // Scheduling by game ticks also pauses the alarm while the teleport menu is open.
    if (state.meteoriteStrikeIn > 0 && state.meteoriteStrikeIn % 30 === 0 &&
        chamberOfTile(state.playerTileX, state.playerTileY) === state.meteoriteWarning) {
      playSFX_meteorWarning(state.meteoriteStrikeIn <= 60);
    }
    state.meteoriteStrikeIn--;
    if (state.meteoriteStrikeIn === 150) {
      playSFX_meteorFalling();
    }
    if (state.meteoriteStrikeIn <= 0) {
      // STRIKE
      const ch = state.meteoriteWarning;
      // Consume the warning before resolving the strike. Its impact animation has its own lifetime.
      state.meteoriteWarning = -1;
      state.meteoriteStrikeIn = 0;
      state.meteoriteImpact = { chamber: ch, ticks: 60 };
      playSFX_meteorite();
      // Kill all enemies in that chamber (boss only takes heavy damage)
      for (const e of [...state.enemies].reverse()) {
        if (!state.enemies.includes(e) || e.devourer?.merging || e.type === 'water_clone' || (e.twin?.downedTicks ?? 0) > 0) continue;
        if (chamberOfTile(e.tileX, e.tileY) === ch) {
          // An active Frost Warden shield blocks the meteor completely, without
          // draining its absorb pool. Break the shield with attacks first.
          if (e.icyShieldHP > 0 && !(state.saturn && e.id === state.saturn.bossId)) { // the Frost Warden herself is hit through her shield (below)
            // Saturn: a meteor breaks her ice instead (it costs her like any broken ice); the alien itself survives.
            if (state.saturn && !isBossType(e.type)) { const ice = e.icyShieldHP; e.icyShieldHP = 0; saturnShatter(state, ice, e); if (state.gamePhase !== 'playing') return; }
            continue;
          }
          if (state.neptune && e.id === state.neptune.bossId) {
            damageEnemy(state, e, NEPTUNE_PHASE_HPS[state.neptune.phase] * NEPTUNE_STRIKE_DAMAGE, 'meteor');
          } else if (state.gaia && e.id === state.gaia.bossId) {
            gaiaStrikeDamage(state, e, GAIA_STRIKE_DAMAGE);
          } else if (state.jupiter && e.id === state.jupiter.bossId) {
            damageEnemy(state, e, jupiterPhaseHP(state.jupiter.phase) * JUPITER.meteorShare / jupiterDamageTaken(state, e), 'meteor'); // always 10% of a phase: it ignores his damage reduction
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (state.binary && e.type === 'astral_twins') {
            // Always 10% of a twin's HP: scaled up front past the bond's cut and the berserk survivor's reduction.
            damageEnemy(state, e, BINARY.twinHP * BINARY.meteorShare / (binaryDamageTaken(state, e, 'meteor') * (e.twin?.partnerDownTicks ? TWIN_BERSERK_DAMAGE_TAKEN : 1)), 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (state.sirius && e.id === state.sirius.bossId) {
            damageEnemy(state, e, SIRIUS.phaseHP * SIRIUS.meteorShare, 'meteor'); // not the generic 75%: he is a three-phase guardian
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (state.saturn && e.id === state.saturn.bossId) {
            const ice = e.icyShieldHP; e.icyShieldHP = 0; // always 10% of a phase: her frost shield neither blocks nor absorbs it
            damageEnemy(state, e, SATURN.phaseHP * SATURN.meteorShare, 'meteor'); e.icyShieldHP = ice;
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (state.sun && e.id === state.sun.bossId) {
            damageEnemy(state, e, SUN.phaseHP * SUN.meteorShare, 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (state.venus && e.id === state.venus.bossId) {
            // Always 10% of a phase: scaled up front past his shield's cut
            damageEnemy(state, e, venusBand(state.venus.phase) * VENUS.meteorShare / (e.aegis?.shielded ? AEGIS_DAMAGE_MULT : 1), 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (isMoonBoss(state, e)) {
            damageEnemy(state, e, MOON_PHASE_HP * MOON_STRIKE_DAMAGE, 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (e.type === 'devourer' && state.trial?.devourer && (e.devourer?.generation ?? 0) === 0) {
            // Singularity: each phase's original is untouchable by meteors; it always bursts.
          } else if (e.type === 'devourer') {
            // The whole body is destroyed: no stacks survive to create offspring.
            if (e.devourer) e.devourer.consumed = true;
            e.hp = 0;
            killEnemy(state, state.enemies.indexOf(e), true);
          } else if (e.type === 'aegis_construct') {
            damageEnemy(state, e, e.maxHp * 0.5, 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else if (isBossType(e.type)) {
            // Deals BOSS_METEOR_DMG% of the boss's max HP — so anything already at or below
            // that HP fraction dies outright.
            damageEnemy(state, e, Math.round(e.maxHp * ((state.bossesKilled >= SPECIAL_UNLOCK_KILLS ? BOSS_LATE_METEOR_DMG : BOSS_METEOR_DMG) / 100)), 'meteor');
            if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e), true);
          } else {
            killEnemy(state, state.enemies.indexOf(e), true);
          }
        }
      }
      // Damage player if in struck chamber
      if (state.playerChamber === ch) {
        damagePlayer(state, METEORITE_PLAYER_DMG);
      }
      // Damage ruby if placed in struck chamber
      if (state.rubyTileX !== -1 && chamberOfTile(state.rubyTileX, state.rubyTileY) === ch) {
        damageRuby(state, METEORITE_RUBY_DMG);
      }

      gaiaScorchRoom(state, ch); // Gaia: a meteor scorches the room clean
      if (state.constellations.includes('meteorHeal')) state.craterField = { chamber: ch, ticks: CRATER.ticks };
      state.meteoriteTimer = METEORITE_CYCLE + Math.floor(Math.random() * 300 - 150);
    }
  } else {
    state.meteoriteTimer--;
    if (state.meteoriteTimer <= 0) {
      // Cycle chambers clockwise: ALPHA(TL) -> BETA(TR) -> DELTA(BR) -> GAMMA(BL) -> repeat
      state.meteoriteWarning = METEOR_CLOCKWISE_ORDER[state.meteoriteChamberSeq % 4];
      state.meteoriteChamberSeq++;
      state.meteoriteStrikeIn = METEORITE_WARNING;
    }
  }
}

// ─── Abilities ───────────────────────────────────────────────────────────────

// Grants a free speed burst that ignores/doesn't touch the SPEED ability's own cooldown —
// used as a passive bonus (energy pickups, entering the powered-up state), not a manual cast.
export function grantInstantSpeedBoost(state: GameState, withSound = true, leaveDecoy = true) {
  if(leaveDecoy)leaveQueenBlessingDecoy(state);
  state.speedActiveTicks = Math.max(state.speedActiveTicks, SPEED_DURATION * (state.constellations.includes('burstDuration') ? 1.25 : 1));
  state.speedFlashTicks = 30;
  if (withSound) playSFX_speed();
}

function checkAndConsumePower(state: GameState): boolean {
  if (state.poweredTicks > 0) return true;
  if (state.starEnergy >= STAR_ENERGY_MAX) {
    state.starEnergy = 0;
    state.poweredTicks = 120 + state.stellarPowerBonusTicks + 60 * constellationBonus(state, 'power') + (hasBlessing(state,'blind_prayer')?BLESSING.amberPowerTicks:0);
    state.stellarPowerBonusTicks = 0;
    grantInstantSpeedBoost(state);
    return true;
  }
  return false;
}

// Binary Star's twin stands on the first open tile beside Ruby (or beside the player while carrying).
export function getMirrorTwinTile(state: GameState): { tileX: number; tileY: number } | null {
  if (state.mirrorTwinTicks <= 0) return null;
  const ax = state.rubyTileX !== -1 ? state.rubyTileX : state.playerTileX, ay = state.rubyTileX !== -1 ? state.rubyTileY : state.playerTileY;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) if (isFloorTile(state.map, ax + dx, ay + dy)) return { tileX: ax + dx, tileY: ay + dy };
  return { tileX: ax, tileY: ay };
}

// Runs an attack from the player and, while Binary Star is active, again from the twin at reduced damage.
/** The Binary Star copy's damage share: full on the Binary Star map, SPECIAL_TWIN_DAMAGE_MULT elsewhere. */
const twinDamageMult = (state: GameState) => state.binary ? 1 : SPECIAL_TWIN_DAMAGE_MULT;
function withMirrorTwin(state: GameState, attack: (tileX: number, tileY: number, mult: number, secondary: boolean) => boolean): boolean {
  let hit = attack(state.playerTileX, state.playerTileY, 1,false);
  const twin = getMirrorTwinTile(state);
  if (twin) hit = attack(twin.tileX, twin.tileY, twinDamageMult(state),true) || hit;
  const copy=rubyBlessingCopy(state);if(copy){const beams=state.laserBeams.length,waves=state.waveEffects.length;hit=attack(copy.tileX,copy.tileY,copy.mult,true)||hit;for(const beam of state.laserBeams.slice(beams))beam.opal=copy.opal;for(const wave of state.waveEffects.slice(waves))wave.opal=copy.opal;}
  return hit;
}

/** Triangulum: aliens this Laser hit that stand within TRIANGULUM.radius of another hit alien step one tile toward their group's centre. */
function pullLaserGroup(state: GameState, hitIds: Set<number>) {
  const hit = state.enemies.filter(e => hitIds.has(e.id) && e.hp > 0 && !isBossType(e.type) && !e.twin?.downedTicks && e.type !== 'aegis_construct');
  for (const e of hit) {
    const group = hit.filter(o => o === e || tileEuclidDist(o.tileX, o.tileY, e.tileX, e.tileY) <= TRIANGULUM.radius);
    if (group.length < 2) continue;
    const cx = group.reduce((sum, o) => sum + o.tileX, 0) / group.length, cy = group.reduce((sum, o) => sum + o.tileY, 0) / group.length;
    const dx = cx - e.tileX, dy = cy - e.tileY;
    if (Math.hypot(dx, dy) < .5) continue;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    e.pushDirX = horizontal ? Math.sign(dx) : 0; e.pushDirY = horizontal ? 0 : Math.sign(dy);
    e.pushTiles = Math.max(e.pushTiles, TRIANGULUM.pullTiles); e.buildWallDamage = undefined;
  }
}

export function useLaser(state: GameState) {
  if (state.gamePhase !== 'playing' || state.playerFrozenTicks > 0) return;
  if (state.laserCooldown > 0) return;
  const refreshBefore=state.build.siriusRefreshSerial??0;
  blessingAttack(state,'laser');
  const firstBeam=state.laserBeams.length;
  const powered = checkAndConsumePower(state);
  const wide=state.constellations.includes('waveLaser')&&state.build.waveLaserReady;
  const beamWidth=wide?(powered?96:72):undefined;
  state.build.waveLaserReady=false;
  const range = Math.max(1, Math.round(((powered ? LASER_RANGE_PWR : LASER_RANGE) + 2 * constellationBonus(state, 'laserRange')) * gaiaLaserRangeMult(state)));
  // Hydra: +HYDRA.perEnemy damage for each distinct enemy the previous Laser cast hit (up to HYDRA.maxEnemies).
  const hydra = state.constellations.includes('laserChain') ? 1 + HYDRA.perEnemy * Math.min(HYDRA.maxEnemies, state.laserMomentum ?? 0) : 1;
  const baseDmg = (powered ? LASER_DMG_PWR : LASER_DMG) * (1 + 0.25 * constellationBonus(state, 'laser')) * hydra;
  const castHits = new Set<number>();

  const emit=(originX:number,originY:number,mult:number,fromX:number,fromY:number,mirror=false)=> {
    let hit=false;const hitIds=new Set<number>();
    const reflect=(startX:number,startY:number,vx:number,vy:number,remaining:number,damage:number)=>{
      const turn=(Math.random()*2-1)*Math.PI/24,cos=Math.cos(turn),sin=Math.sin(turn),rx=-vx*cos+vy*sin,ry=-vx*sin-vy*cos;
      let endX=startX,endY=startY;const touched=new Set<number>(),tiles=new Set<number>();
      const thickness=beamWidth??(powered?60:48);
      for(let distance=.2;distance<=remaining+.0001;distance+=.2){
        const px=startX+rx*distance,py=startY+ry*distance,tx=Math.floor(px),ty=Math.floor(py);
        if(!isFloorTile(state.map,tx,ty))break;
        if(mirrorCrossing(state,px-rx*.2,py-ry*.2,px,py))break; // a Reflector's mirror stops the ricochet
        endX=px;endY=py;
        const key=ty*MAP_COLS+tx;
        if(!tiles.has(key)){tiles.add(key);if(!mirror&&isMoonMirror(state,tx,ty)){moonReflect(state,tx,ty,damage);break;}gaiaClearTile(state,tx,ty,1);}
        hitSupernova(state,(x,y)=>Math.hypot(x/TILE_SIZE-px,y/TILE_SIZE-py)<=thickness/TILE_SIZE/2);
        for(const enemy of [...state.enemies].reverse()){
          if(!state.enemies.includes(enemy)||enemy.hp<=0||enemy.twin?.downedTicks||touched.has(enemy.id)||(wide&&hitIds.has(enemy.id)))continue;
          const ex=enemy.x/TILE_SIZE-startX,ey=enemy.y/TILE_SIZE-startY,along=ex*rx+ey*ry,across=Math.abs(ex*ry-ey*rx)*TILE_SIZE;
          if(along<0||along>distance+.02||across>thickness/2+TILE_SIZE*ENEMY_CONFIGS[enemy.type].bodyFraction/2)continue;
          touched.add(enemy.id);hitIds.add(enemy.id);castHits.add(enemy.id);damageEnemy(state,enemy,damage,'player',mirror?0:1.5);chainElectric(state,enemy);laserStun(state,enemy);hit=true;
          if(enemy.hp<=0)killEnemy(state,state.enemies.indexOf(enemy));
        }
      }
      state.laserBeams.push({fromX:startX*TILE_SIZE,fromY:startY*TILE_SIZE,endX:endX*TILE_SIZE,endY:endY*TILE_SIZE,dirX:rx,dirY:ry,ticks:18,powered,width:beamWidth,buildDamage:damage});
    };
    for(const [startDX,startDY] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      let dx=startDX,dy=startDY,tx=originX,ty=originY,bounced=false,pierced=false,segmentX=fromX,segmentY=fromY,dmg=baseDmg*mult;
      const finishSegment=()=>state.laserBeams.push({fromX:segmentX,fromY:segmentY,dirX:dx,dirY:dy,endX:(tx+.5)*TILE_SIZE,endY:(ty+.5)*TILE_SIZE,ticks:18,powered,width:beamWidth,buildDamage:dmg});
      for(let r=0;r<range;r++) {
        let nx=tx+dx,ny=ty+dy;
        if(!isFloorTile(state.map,nx,ny)) {
          if(wide&&!pierced&&nx>0&&ny>0&&nx<MAP_COLS-1&&ny<MAP_ROWS-1&&state.map[ny]?.[nx]===T_WALL){pierced=true;tx=nx;ty=ny;continue;}
          if(!state.constellations.includes('ricochet')||bounced)break;
          finishSegment();bounced=true;reflect(tx+.5,ty+.5,dx,dy,range-r+2,dmg*.5);break;
        }
        const crossed=mirrorCrossing(state,tx+.5,ty+.5,nx+.5,ny+.5);
        if(crossed){ // a Reflector's mirror stops the beam and sends it straight back
          crossed.e.flashTicks=6;
          const hitX=crossed.x*TILE_SIZE,hitY=crossed.y*TILE_SIZE;
          state.laserBeams.push({fromX:segmentX,fromY:segmentY,dirX:dx,dirY:dy,endX:hitX,endY:hitY,ticks:18,powered,width:beamWidth,buildDamage:dmg});
          if(!mirror)bendReflectedLaser(state,crossed.e,crossed.x,crossed.y,-dx,-dy,range);
          playAudioOneShot('/sounds/laserBeam.mp3',.266,1.3);
          bounced=true;break;
        }
        tx=nx;ty=ny;
        if(!mirror&&isMoonMirror(state,tx,ty)){moonReflect(state,tx,ty,dmg);break;}
        gaiaClearTile(state,tx,ty,1);
        hitSupernova(state,(x,y)=>Math.floor(x/TILE_SIZE)===tx&&Math.floor(y/TILE_SIZE)===ty);
        for(const enemy of [...state.enemies].reverse()) {
          if(!state.enemies.includes(enemy)||enemy.twin?.downedTicks)continue;
          const bodyRadius=TILE_SIZE*ENEMY_CONFIGS[enemy.type].bodyFraction/2;
          const inBeam=wide?(dx!==0?enemy.tileX===tx&&Math.abs(enemy.y-(ty+.5)*TILE_SIZE)<=beamWidth!/2+bodyRadius:enemy.tileY===ty&&Math.abs(enemy.x-(tx+.5)*TILE_SIZE)<=beamWidth!/2+bodyRadius):enemy.tileX===tx&&enemy.tileY===ty;
          if(!inBeam||(wide&&hitIds.has(enemy.id)))continue;
          hitIds.add(enemy.id);
          castHits.add(enemy.id);damageEnemy(state,enemy,dmg,'player',mirror?0:1.5);chainElectric(state,enemy);laserStun(state,enemy);hit=true;
          if(enemy.hp<=0)killEnemy(state,state.enemies.indexOf(enemy));
        }
      }
      if(!bounced)finishSegment();
    }
    return hit;
  };
  let laserHit=withMirrorTwin(state,(x,y,mult,secondary)=>emit(x,y,mult,!secondary?state.playerX:(x+.5)*TILE_SIZE,!secondary?state.playerY:(y+.5)*TILE_SIZE,secondary));
  if(state.constellations.includes('rubyLaser')&&state.rubyTileX>=0&&Math.hypot(state.playerX-(state.rubyTileX+.5)*TILE_SIZE,state.playerY-(state.rubyTileY+.5)*TILE_SIZE)<=3*TILE_SIZE) {
    laserHit=emit(state.rubyTileX,state.rubyTileY,.35,(state.rubyTileX+.5)*TILE_SIZE,(state.rubyTileY+.5)*TILE_SIZE,true)||laserHit;
  }
  for(const beam of state.laserBeams.slice(firstBeam))beam.solar=solarBlessingReady(state);
  if (state.constellations.includes('laserChain')) state.laserMomentum = castHits.size;
  if (state.constellations.includes('laserPull') && castHits.size >= 2) pullLaserGroup(state, castHits);
  state.laserCooldown = (state.build.siriusRefreshSerial??0)!==refreshBefore?0:LASER_COOLDOWN * (state.constellations.includes('laserRate') ? 0.85 : 1);
  playSFX_laser();
  if (laserHit) playSFX_alienHit();
}

export function pressCharge(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.waveCooldown > 0) return;
  state.chargeDecayTimer = 0;
  state.chargeCount+=state.build.quickWave?2:1;
  playSFX_charge();
  if (state.chargeCount >= CHARGE_NEEDED) {
    fireWave(state);
  }
}

// Directly fire wave without charge count — used for hold-left-click and keyboard K
export function activateWave(state: GameState) {
  if (state.gamePhase !== 'playing' || state.playerFrozenTicks > 0) return;
  if (state.waveCooldown > 0) return;
  fireWave(state);
}

function fireWave(state: GameState, teleportBurst = false) {
  stopChargeSound();
  const refreshBefore=state.build.siriusRefreshSerial??0;
  blessingAttack(state,'wave');
  const powered = teleportBurst ? state.poweredTicks > 0 : checkAndConsumePower(state);
  const heavyImpact=(state.heavyImpactUntil??0)>state.gameTick;
  const radius = (powered ? WAVE_RADIUS_PWR : WAVE_RADIUS) + constellationBonus(state, 'waveReach') + (teleportBurst ? JAMMER.rewardRadius : 0) + (heavyImpact ? DROPPER.rewardRadius : 0);
  const dmg = (powered ? WAVE_DMG_PWR : WAVE_DMG) * (1 + 0.25 * constellationBonus(state, 'wave')) * (heavyImpact?DROPPER.rewardWaveDamage:1) * (teleportBurst?JAMMER.rewardDamage:1);
  const push = (powered ? WAVE_PUSH_TILES_PWR : WAVE_PUSH_TILES) + constellationBonus(state, 'waveReach') + (heavyImpact?DROPPER.rewardPush:0);

  const waveHit = withMirrorTwin(state, (originX, originY, mult, secondary) => {
    state.waveEffects.push({
      cx: !secondary ? state.playerX : originX * TILE_SIZE + TILE_SIZE / 2, cy: !secondary ? state.playerY : originY * TILE_SIZE + TILE_SIZE / 2,
      radius: 0, maxRadius: radius * TILE_SIZE, ticks: 30, powered, solar:solarBlessingReady(state)
    });
    hitSupernova(state, (x, y) => Math.hypot(x / TILE_SIZE - .5 - originX, y / TILE_SIZE - .5 - originY) <= radius);
    gaiaClearArea(state, originX, originY, radius);
    let hit = false;
    for (const e of [...state.enemies].reverse()) {
      if (!state.enemies.includes(e) || (e.twin?.downedTicks ?? 0) > 0) continue;
      const dist = tileEuclidDist(e.tileX, e.tileY, originX, originY);
      if (dist <= radius) {
        damageEnemy(state, e, dmg * mult,'player',!secondary?3:0); buildWaveHit(state,e,dmg*mult); dropReflectorMirror(state, e); hit = true;
        chainElectric(state, e);
        const edx = e.tileX - originX;
        const edy = e.tileY - originY;
        const len = Math.sqrt(edx * edx + edy * edy) || 1;
        e.pushDirX = Math.round(edx / len);
        e.pushDirY = Math.round(edy / len);
        if (e.pushDirX === 0 && e.pushDirY === 0) e.pushDirX = 1;
        e.pushTiles = push;
        e.buildWallDamage=state.constellations.includes('wallSlam')&&!isBossType(e.type)?dmg*mult*.75:undefined; // Sculptor: 75% of the Wave on a wall slam
        if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e));
      }
    }
    return hit;
  });
  if(state.constellations.includes('waveEcho'))state.build.echoes.push({x:state.playerX,y:state.playerY,radius,damage:dmg*.4,ticks:120}); // Eridanus: echo 2s later
  if(state.constellations.includes('rubyWave')&&state.rubyTileX>=0)emitBuildWave(state,(state.rubyTileX+.5)*TILE_SIZE,(state.rubyTileY+.5)*TILE_SIZE,Math.max(1,radius*.6),dmg*.35);
  if(state.constellations.includes('waveLaser'))state.build.waveLaserReady=true;
  if(!teleportBurst) {
    state.chargeCount = 0;
    state.build.quickWave=false;
    state.waveCooldown = (state.build.siriusRefreshSerial??0)!==refreshBefore?0:WAVE_COOLDOWN * (state.constellations.includes('waveRate') ? 0.85 : 1);
  }
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 8);
  state.screenShakeAmt = Math.max(state.screenShakeAmt, 3);
  playSFX_wave();
  if (waveHit) playSFX_alienHit();
}

export function useSpeedBoost(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.speedCooldown > 0) return;
  const powered = checkAndConsumePower(state);
  leaveQueenBlessingDecoy(state);
  const dur = (powered ? SPEED_DURATION_PWR : SPEED_DURATION) * (state.constellations.includes('burstDuration') ? 1.25 : 1);
  state.speedActiveTicks = dur;
  state.build.wallStepReady=state.constellations.includes('wallStep');
  if(state.constellations.includes('boostCharge'))state.build.quickWave=true;
  state.speedFlashTicks = 30;
  state.speedCooldown = SPEED_COOLDOWN * (state.constellations.includes('burstRate') ? 0.8 : 1);
  playSFX_speed();
}

export function playSFX_placeBomb() { playAudioOneShot('/sounds/place_bomb.wav', 0.1625 * ATTACK_SFX_VOLUME); }

export function useBomb(state: GameState) {
  if (state.gamePhase !== 'playing' || state.playerFrozenTicks > 0) return;
  if (state.bomb === null) {
    if (state.bombCooldown > 0) return; // still on cooldown from last explosion
    const powered = checkAndConsumePower(state);
    state.bomb = { tileX: state.playerTileX, tileY: state.playerTileY, powered };
    state.playerCastTicks = 24; state.playerCastKind = 'bomb'; state.playerPrimalCast = false;
    playSFX_placeBomb();
    useSpeedBoost(state); // Automatically try to use speed boost to escape
  } else {
    if(state.bomb.detonateTicks!==undefined)return;
    if(state.constellations.includes('bombPull'))state.bomb.detonateTicks=24;
    else detonateBomb(state);
  }
}

function detonateBomb(state:GameState) {
    if(!state.bomb)return;
    state.playerCastTicks = 24; state.playerCastKind = 'bomb'; state.playerPrimalCast = false;
    const powered = state.bomb.powered;
    const refreshBefore=state.build.siriusRefreshSerial??0;
    blessingAttack(state,'bomb');
    const radius = getBombRadius(state, powered);
    const dmg = (powered ? BOMB_DMG_PWR : BOMB_DMG) * (1 + 0.25 * constellationBonus(state, 'bombDamage'));

    const bx = state.bomb.tileX, by = state.bomb.tileY;
    playSFX_bomb();
    // Snapshot protection before any blast/chain hit can break a shield. The same
    // detonation must not then hit that enemy's HP through a later chained strike.
    const frostProtected = new Set(state.enemies.filter(e => e.icyShieldHP > 0).map(e => e.id));
    const blastAt = (originX: number, originY: number, mult: number, secondary=false) => {
      hitSupernova(state, (x, y) => Math.hypot(x / TILE_SIZE - .5 - originX, y / TILE_SIZE - .5 - originY) <= radius);
      gaiaClearArea(state, originX, originY, radius);
      state.bombBlasts.push({
        cx: originX * TILE_SIZE + TILE_SIZE / 2,
        cy: originY * TILE_SIZE + TILE_SIZE / 2,
        radius: 0, maxRadius: radius * TILE_SIZE, ticks: 28, powered,
      });
      let hit = false;
      for (const e of [...state.enemies].reverse()) {
        if (!state.enemies.includes(e) || (e.twin?.downedTicks ?? 0) > 0) continue;
        if (tileEuclidDist(e.tileX, e.tileY, originX, originY) <= radius) {
          // An active frost shield blocks this entire blast: it can lose shield HP,
          // but excess bomb damage never spills into the enemy's real HP.
          const damage = frostProtected.has(e.id) ? Math.min(dmg * mult, e.icyShieldHP) : dmg * mult;
          const hpBeforeBlast=e.hp;
          if (damage > 0) damageEnemy(state, e, damage,'player',!secondary?4:0);
          if(e.hp<hpBeforeBlast)buildBombStun(state,e);
          hit = true;
          chainElectric(state, e, frostProtected);
          if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e));
        }
      }
      return hit;
    };
    let bombHit = blastAt(bx, by, 1);
    // The twin answers the detonation with its own blast where it stands; it never hurts the player.
    const twin = getMirrorTwinTile(state);
    if (twin) bombHit = blastAt(twin.tileX, twin.tileY, twinDamageMult(state),true) || bombHit;
    const copy=rubyBlessingCopy(state);if(copy){const first=state.bombBlasts.length;bombHit=blastAt(copy.tileX,copy.tileY,copy.mult,true)||bombHit;for(const blast of state.bombBlasts.slice(first))blast.opal=copy.opal;}
    if (bombHit) playSFX_alienHit();
    // Damage player if in blast radius (own bomb hurts you), unless Scutum is taken
    if (!state.constellations.includes('bombSafe') && tileEuclidDist(state.playerTileX, state.playerTileY, bx, by) <= radius) {
      damagePlayer(state, Math.floor(dmg * 0.35));
    }
    state.bomb = null;
    state.bombCooldown = (state.build.siriusRefreshSerial??0)!==refreshBefore?0:300 * (state.constellations.includes('bombRate') ? 0.8 : 1);
    state.screenShakeTicks = 22;
    state.screenShakeAmt = powered ? 18 : 12;
}

export function toggleCarryRuby(state: GameState) {
  if (state.gamePhase !== 'playing') return;
  if (state.rubyStolenBy !== undefined) return; // a Snatcher holds her: defeat it first
  if (state.playerCarryingRuby) {
    state.rubyTileX = state.playerTileX;
    state.rubyTileY = state.playerTileY;
    state.playerCarryingRuby = false;
    playSFX_rubyToggle();
  } else {
    if (state.rubyTileX === -1) return;
    const chebyshev = Math.max(
      Math.abs(state.playerTileX - state.rubyTileX),
      Math.abs(state.playerTileY - state.rubyTileY),
    );
    if (chebyshev <= 2) {
      state.playerCarryingRuby = true;
      state.rubyTileX = -1;
      state.rubyTileY = -1;
      state.rubyPlacedFlashTicks = 0;
      playSFX_rubyToggle();
    }
  }
}

/** A defeated Blinker displaces the player without triggering pad benefits or dropping carried Ruby. */
function warpPlayerFromBlinker(state: GameState) {
  if(playerCCImmune(state))return;
  if(state.gamePhase!=='playing')return;
  const tiles=[0,1,2,3].flatMap(room=>freeChamberTiles(state,room)).filter(([tx,ty])=>
    (tx!==Math.floor(state.playerX/TILE_SIZE)||ty!==Math.floor(state.playerY/TILE_SIZE))
    && !(tx===state.rubyTileX&&ty===state.rubyTileY)
    && !state.enemies.some(e=>e.hp>0&&Math.floor(e.x/TILE_SIZE)===tx&&Math.floor(e.y/TILE_SIZE)===ty));
  if(!tiles.length)return;
  const [tx,ty]=tiles[Math.floor(Math.random()*tiles.length)],fromX=state.playerX,fromY=state.playerY;
  state.playerTileX=state.playerTargetX=tx;state.playerTileY=state.playerTargetY=ty;
  state.playerX=(tx+.5)*TILE_SIZE;state.playerY=(ty+.5)*TILE_SIZE;
  state.playerStepProgress=0;state.playerKnockback=null;state.playerQueuedDirX=state.playerQueuedDirY=0;
  state.playerChamber=chamberOfTile(tx,ty);
  state.blinkerWarp={fromX,fromY,x:state.playerX,y:state.playerY,until:state.gameTick+BLINKER.warpTicks};
  state.enemies.forEach(e=>e.pathTimer=0);
  playSFX_teleport();
}

export function doTeleport(state: GameState, chamberIdx: number) {
  if (state.gamePhase !== 'teleporting') return;
  if (!state.teleportDestOptions.includes(chamberIdx)) return;
  const [tx, ty] = TELEPORT_PADS[chamberIdx] ?? TELEPORT_PADS[0]; // the active layout's pad for that chamber

  leaveQueenBlessingDecoy(state);
  if(state.constellations.includes('teleportDecoy')){
    state.build.decoy={x:(state.playerTileX+.5)*TILE_SIZE,y:(state.playerTileY+.5)*TILE_SIZE,tileX:state.playerTileX,tileY:state.playerTileY,ticks:360};
    state.enemies.forEach(enemy=>enemy.pathTimer=0);
  }
  state.playerTileX = tx; state.playerTileY = ty;
  state.playerTargetX = tx; state.playerTargetY = ty;
  state.playerX = tx * TILE_SIZE + TILE_SIZE / 2;
  state.playerY = ty * TILE_SIZE + TILE_SIZE / 2;
  state.playerStepProgress = 0;
  state.playerKnockback = null;
  state.playerChamber = chamberIdx;
  state.gamePhase = 'playing';
  state.teleportDestOptions = [];
  state.teleportCooldown = TELEPORT_COOLDOWN;
  playSFX_teleport();

  // Carrying the ruby through a teleport auto-places it on the destination pad.
  if (state.playerCarryingRuby) {
    state.rubyTileX = tx;
    state.rubyTileY = ty;
    state.playerCarryingRuby = false;
    state.rubyPlacedFlashTicks = 120;
  }

  // Every teleport grants a free speed burst (no cooldown interaction), not just ones
  // made while carrying the ruby.
  grantInstantSpeedBoost(state, false, false);
  if(state.jammerWaveReady) {
    state.jammerWaveReady=false;
    fireWave(state,true);
    state.teleportCooldown=0; // Jammer kill: the teleport is ready again at once
  }
}

// A pad works from its own tile or any of the eight tiles around it.
export function isNearTeleportPad(state: GameState): boolean {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (state.map[state.playerTileY + dy]?.[state.playerTileX + dx] === T_TELEPORT) return true;
  }
  return false;
}

/** Shared tile membership keeps the interference footprint and teleport rule identical. */
export function jammerCoversTile(enemy:Enemy,tx:number,ty:number):boolean {
  return enemy.type==='jammer'&&enemy.hp>0&&Math.hypot((tx+.5)*TILE_SIZE-enemy.x,(ty+.5)*TILE_SIZE-enemy.y)<=JAMMER.radius*TILE_SIZE;
}
export function teleportJammed(state:Readonly<GameState>):boolean {
  if(playerCCImmune(state))return false;
  const tx=Math.floor(state.playerX/TILE_SIZE),ty=Math.floor(state.playerY/TILE_SIZE);
  return state.enemies.some(enemy=>jammerCoversTile(enemy,tx,ty));
}

function updateJammerEntry(state:GameState) {
  const active=teleportJammed(state);
  if(active&&!state.jammerWasActive) {
    // The low buzz and detuned denial chirp belong to Effects, not the attack channel.
    playTone(130,.2,.06,'sawtooth');
    try{const sound=gameAudio('/sounds/celestial/empty-charge.wav','effects');sound.volume=.38;sound.playbackRate=.8;sound.preservesPitch=false;sound.play().catch(()=>{});}catch{}
  }
  state.jammerWasActive=active;
}

// Opens the teleport screen when the player is on or next to a pad.
export function tryActivateTeleport(state: GameState): boolean {
  if (state.gamePhase !== 'playing') return false;
  if (state.teleportCooldown > 0 || teleportJammed(state) || (state.saturn && state.playerFrozenTicks > 0)) return false;

  if (!isNearTeleportPad(state)) return false;
  const chamberIdx = state.playerChamber;
  const destinations = CHAMBER_BOUNDS.map((_, c) => c).filter(c => c !== chamberIdx); // every chamber of the active layout
  state.teleportDestOptions = destinations;
  state.gamePhase = 'teleporting';
  return true;
}

// Returns true when all conditions to heal the ruby are met (used by UI hint too)
export function canHealRuby(state: GameState): boolean {
  if (state.gamePhase !== 'playing') return false;
  if (state.rubyHP >= RUBY_MAX_HP && state.playerHP >= PLAYER_MAX_HP) return false;
  if (!state.playerCarryingRuby && state.rubyTileX !== -1) {
    const dist = Math.max(
      Math.abs(state.playerTileX - state.rubyTileX),
      Math.abs(state.playerTileY - state.rubyTileY),
    );
    if (dist > RUBY_HEAL_RANGE) return false;
  }
  for (const e of state.enemies) {
    if (e.type === 'fish_blue' || e.type === 'fish_red' || e.type === 'lifebloom' || e.type === 'cinder_wisp' || e.type === 'scorch_sapper' || (e.type === 'emberling' && e.extinguished) || (e.type === 'sand_scorpion' && duneWormHidden(e))) continue; // fish, lifeblooms, sappers and buried Sand Scorpions never stop healing
    if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= RUBY_HEAL_CLEAR_RANGE) return false;
  }
  return true;
}

export function healRuby(state: GameState): boolean {
  if (state.rubyStolenBy !== undefined) return false;
  if (state.sun && sunStationNearPlayer(state)) return false; // Space charges a nearby cooling station instead
  if (!canHealRuby(state)) return false;
  if (state.rubyHealCooldown > 0) return false;
  const rubyWasHurt=state.rubyHP<RUBY_MAX_HP;
  healCore(state, RUBY_HEAL_AMOUNT + constellationBonus(state, 'manualHealing'));
  if(rubyWasHurt&&state.constellations.includes('rubyDefense'))state.build.rubyWaveStored=true;
  healPlayer(state, 3 + constellationBonus(state, 'manualHealing'));
  state.rubyHealCooldown = RUBY_HEAL_COOLDOWN / (1 + 0.5 * constellationBonus(state, 'healing'));
  state.healJiggleTicks = 18;
  try { const a = gameAudio('/sounds/deghost.wav'); a.volume = 0.32; a.play().catch(() => {}); } catch {}
  return true;
}

export function cancelTeleport(state: GameState) {
  if (state.gamePhase !== 'teleporting') return;
  state.gamePhase = 'playing';
  state.teleportDestOptions = [];
}

function takeNextNaturalBoss(state: GameState): BossType {
  if (state.trial) return state.trial.boss;
  // Each block of ten bosses (1–10, 11–20, ...) uses every boss once: the pool restarts whenever a new block begins,
  // so debug stage skips can never make a boss repeat inside a block.
  const block=Math.floor(state.bossesKilled/BOSS_TYPES.length);
  if(block!==state.bossPoolBlock||state.bossPool.length===0){state.bossPool=[...BOSS_TYPES];state.bossPoolBlock=block;}
  const active=new Set(state.enemies.filter(e=>e.hp>0&&isBossType(e.type)).map(e=>e.type));
  // First-time players (desktop profile with no Endless King defeat) always meet the Fiery King first; random after that.
  if(state.mode==='endless'&&state.bossesKilled===0&&!active.has('fiery_king')&&isDesktop()&&!getProfile().defeated.includes('fiery_king')){
    state.bossPool=state.bossPool.filter(type=>type!=='fiery_king');state.lastNaturalBoss='fiery_king';return 'fiery_king';
  }
  let available=state.bossPool.filter(type=>!active.has(type));
  if(!available.length){state.bossPool=BOSS_TYPES.filter(type=>!active.has(type));available=state.bossPool;}
  const choices=available.length>1?available.filter(type=>type!==state.lastNaturalBoss):available;
  const next=choices[Math.floor(Math.random()*choices.length)];
  state.bossPool=state.bossPool.filter(type=>type!==next);
  state.lastNaturalBoss=next;
  return next;
}

// Environmental damage cannot feed Chanter or chain player electricity.
function detonateSupernova(state: GameState) {
  const point = state.ambientEvents.active!.points[0];
  const x = (point.x + .5) * TILE_SIZE, y = (point.y + .5) * TILE_SIZE;
  const distance = Math.hypot(state.playerX - x, state.playerY - y) / TILE_SIZE;
  const originChamber = chamberOfTile(point.x, point.y);
  const playerChamber = chamberOfTile(Math.floor(state.playerX / TILE_SIZE), Math.floor(state.playerY / TILE_SIZE));
  if (distance < SUPERNOVA_PLAYER_RADIUS && playerChamber !== (originChamber ^ 3)) {
    const strength = Math.min(1, (SUPERNOVA_PLAYER_RADIUS - distance) / (SUPERNOVA_PLAYER_RADIUS - SUPERNOVA_FULL_DAMAGE_RADIUS));
    damagePlayer(state, Math.ceil(100 * strength ** 3));
  }
  const playerDied = (state as GameState).gamePhase === 'lost';
  const victims = state.enemies.filter(enemy => enemy.hp > 0);
  for (const enemy of victims) {
    const d = Math.hypot(enemy.x - x, enemy.y - y) / TILE_SIZE;
    const strength = Math.max(0, 1 - d / 65) ** 2;
    damageEnemy(state, enemy, isBossType(enemy.type) ? enemy.maxHp * (.05 + .55 * strength) : 5 + 95 * strength, 'enemy');
  }
  for (const enemy of victims) {
    const index = state.enemies.indexOf(enemy);
    if (index >= 0 && enemy.hp <= 0) killEnemy(state, index, true);
  }
  if (playerDied) state.playerHP = 0; // Boss restoration cannot revive a fatal simultaneous blast.
  state.screenShakeTicks = Math.max(state.screenShakeTicks, 30);
  state.screenShakeAmt = Math.max(state.screenShakeAmt, 16);
  playSFX_supernova();
}

// ─── Main tick ───────────────────────────────────────────────────────────────

export const ENDLESS_BOSS_OVERLAP_TICKS=80*60;
export const LATE_BOSS_OVERLAP_STAGE=30, LATE_BOSS_OVERLAP_TICKS=60*60; // from stage 30 a second boss can join sooner
export function bossOverlapTicks(state:GameState){return state.bossesKilled>=LATE_BOSS_OVERLAP_STAGE?LATE_BOSS_OVERLAP_TICKS:ENDLESS_BOSS_OVERLAP_TICKS;}
export function countBossEncounters(state:GameState,ignore?:Enemy):number {
  return new Set(state.enemies.filter(e=>e!==ignore&&e.hp>0&&isBossType(e.type)).map(e=>e.encounterId??e.twin?.pairId??e.id)).size;
}

export function tick(state: GameState) {
  if (state.gamePhase !== 'playing') { if(state.neptune)setNonMusicAudioDuck(1); if (state.sun) state.sun.charging = false; pauseAmbientEventSounds(); stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound(); return; }

  prepareBlessingChoice(state);
  if(state.gamePhase!=='playing'){pauseAmbientEventSounds();stopChargeSound();stopPoisonSound();stopSingularitySound();stopGaiaFieldSound();return;}
  resumeAmbientEventSounds();
  if (state.constellationDelayTicks > 0 && --state.constellationDelayTicks === 0 && state.constellationChoices.length) {
    state.gamePhase = 'constellation';
    try {
      const sound = gameAudio('/sounds/constellation-choice.wav'); sound.volume = .6; sound.play().catch(() => {});
    } catch { }
    state.playerQueuedDirX = state.playerQueuedDirY = 0;
    stopChargeSound(); stopPoisonSound(); stopSingularitySound(); stopGaiaFieldSound();
    return;
  }
  state.gameTick++;
  updateRunBuilds(state);
  if(state.bomb?.detonateTicks!==undefined){
    const b=state.bomb;
    if(b.detonateTicks!>0&&b.detonateTicks!%6===0)pullBuildEnemies(state,(b.tileX+.5)*TILE_SIZE,(b.tileY+.5)*TILE_SIZE,getBombRadius(state,b.powered)+2);
    if(--b.detonateTicks!<=0)detonateBomb(state);
  }
  if(state.gamePhase!=='playing')return;
  updateBossEncounters(state);
  if (state.constellationReveal && --state.constellationReveal.ticks <= 0) state.constellationReveal = null;
  if (state.meteoriteImpact && --state.meteoriteImpact.ticks <= 0) state.meteoriteImpact = null;
  if(state.lunarDecoy){
    if(state.lunarDecoy.flashTicks>0)state.lunarDecoy.flashTicks--;
    if(state.lunarDecoy.invulnerableTicks>0)state.lunarDecoy.invulnerableTicks--;
  }
  if (state.ascensionBannerTicks > 0) state.ascensionBannerTicks--;
  updateAlienIntros(state);
  state.specialEffects = state.specialEffects.filter(fx => --fx.ticks > 0);
  if (state.venusVeilTicks > 0) state.venusVeilTicks--;
  if (state.mirrorTwinTicks > 0) state.mirrorTwinTicks--;
  state.venusReflects = state.venusReflects.filter(fx => --fx.ticks > 0);
  if (state.kingArenaPulseTicks > 0) state.kingArenaPulseTicks--;
  if (state.bossSpawnTicks > 0) state.bossSpawnTicks--;

  // Score (time in seconds × 10)
  state.score += 1 / 60;

  // Ease into the first boss, then advance enemy pressure with defeated bosses.
  state.difficultyTimer++;
  let openingTier=0;
  for(let i=1;i<DIFFICULTY_OPENING_THRESHOLDS.length;i++)if(state.difficultyTimer>=DIFFICULTY_OPENING_THRESHOLDS[i])openingTier=i;
  const stageTier=state.bossesKilled>0?Math.min(DIFFICULTY_TIERS.length-1,3+state.bossesKilled):0;
  state.difficultyLevel=Math.max(state.difficultyLevel,openingTier,stageTier);

  // Cooldown tickers — LASER/BULLET/WAVE ("attack speed") tick down at half rate while
  // chilled by a Frost Warden sharing the player's chamber.
  const chilledNow = isPlayerChilled(state);
  if (chilledNow && !state.playerChilledPrev) playSFX_frostFieldEnter();
  state.playerChilledPrev = chilledNow;
  const chillRate = chilledNow ? FROST_CHILL_TICK_RATE : 1;
  if (state.laserCooldown > 0) state.laserCooldown -= chillRate;
  if (state.bulletCooldown > 0) state.bulletCooldown -= chillRate;
  if (state.waveCooldown > 0) state.waveCooldown = Math.max(0, state.waveCooldown - chillRate / ((state.heavyImpactUntil ?? 0) > state.gameTick ? DROPPER.rewardCooldownMult : 1));
  if (state.speedCooldown > 0) state.speedCooldown--;
  if ((state.stormHasteTicks ?? 0) > 0) state.stormHasteTicks!--;
  if (state.bombCooldown > 0 && --state.bombCooldown === 0) playUiSfx('bombReady'); // the bomb is ready again
  if (state.speedActiveTicks > 0) {
    state.speedActiveTicks--;
    // Carrying Ruby: boosts run out faster so they last CARRY_BOOST_MULT as long (fractional extra ticks carry over).
    if (state.playerCarryingRuby && state.speedActiveTicks > 0) {
      state.carryBoostDrain = (state.carryBoostDrain ?? 0) + 1 / CARRY_BOOST_MULT - 1;
      if (state.carryBoostDrain >= 1) { const extra = Math.floor(state.carryBoostDrain); state.carryBoostDrain -= extra; state.speedActiveTicks = Math.max(0, state.speedActiveTicks - extra); }
    }
  }
  if (state.speedFlashTicks > 0) state.speedFlashTicks--;
  if (state.rubyPlacedFlashTicks > 0) state.rubyPlacedFlashTicks--;
  if (state.playerCastTicks > 0 && --state.playerCastTicks === 0) state.playerCastKind = null;
  if (state.specialLockTicks > 0) state.specialLockTicks--;
  if (state.runnerEnergyFlashTicks > 0) state.runnerEnergyFlashTicks--;
  if ((state.bleedingUntil ?? 0) > state.gameTick && state.playerShieldHP > 0) state.playerShieldHP = Math.max(0, state.playerShieldHP - BLEEDER.shieldDrainPerSecond / 60);
  if ((state.regenUntil ?? 0) > state.gameTick && state.gameTick % BLEEDER.regenEvery === 0) healPlayer(state, 1, false);
  if (state.rubyStolenBy !== undefined) {
    const holder = state.enemies.find(en => en.id === state.rubyStolenBy && en.hp > 0);
    if (!holder) state.rubyStolenBy = undefined;
    else { state.rubyTileX = holder.tileX; state.rubyTileY = holder.tileY; damageRuby(state, SNATCHER.rubyDrainPerSecond / 60, undefined, true); }
  }
  if (state.playerFrozenTicks > 0) {
    state.playerFrozenTicks--;
    if (state.playerFrozenTicks === 0) { if (!state.playerStunned) playSFX_thaw(); state.playerStunned = false; }
  }
  if (state.teleportCooldown > 0) state.teleportCooldown--;
  if (state.poweredTicks > 0) state.poweredTicks--;
  if (state.screenShakeTicks > 0) state.screenShakeTicks--;
  if (state.rubyHealCooldown > 0) state.rubyHealCooldown--;
  if (state.electricBuffTicks > 0) state.electricBuffTicks--;
  if ((state.laserStunTicks ?? 0) > 0) state.laserStunTicks!--;
  if (state.healJiggleTicks > 0) state.healJiggleTicks--;
  if (state.hallwaySealCooldown > 0) state.hallwaySealCooldown--;

  // Storm Reaper hallway seal — lift it once its duration expires
  if (state.hallwaySealTicks > 0) {
    state.hallwaySealTicks--;
    if (state.hallwaySealTicks <= 0) {
      setHallwayWalled(state, state.hallwaySeal, false);
      state.hallwaySeal = -1;
    }
  }

  const encounters=countBossEncounters(state);
  const overlapping=(state.mode==='endless'||state.mode==='ascension')&&state.bossesKilled>=20;
  if(overlapping&&encounters>0)state.bossOverlapTicks++;
  const overlapDue=overlapping&&encounters>0&&state.bossOverlapTicks>=bossOverlapTicks(state)-BOSS_WARNING_TICKS;
  if (!state.noBossSpawns && (state.difficultyLevel >= 1 || state.trial) && encounters<(overlapping?2:1) && (encounters===0||overlapDue)) {
    if (state.bossWarningTicks > 0) {
      state.bossWarningTicks--;
      if (state.bossWarningTicks === 0) {
        // Spawn one random boss-tier enemy at a spawn tile far from player.
        // Late Endless permits two encounters; Twins and Devourer families each count once.
        if (countBossEncounters(state)<(overlapping?2:1)) {
          const allSpawns: [number, number][] = [];
          for (let ch = 0; ch < 4; ch++) {
            for (const [tx, ty] of CHAMBER_SPAWN_TILES[ch]) {
              if (Math.abs(tx - state.playerTileX) + Math.abs(ty - state.playerTileY) > 10) {
                allSpawns.push([tx, ty]);
              }
            }
          }
          if (allSpawns.length > 0) {
            const [tx, ty] = allSpawns[Math.floor(Math.random() * allSpawns.length)];
            const bossType = takeNextNaturalBoss(state);
            const cfg = ENEMY_CONFIGS[bossType];
            const bossHp = cfg.maxHp + state.bossesKilled * 15;
            state.enemies.push({
              id: state.nextEnemyId++, type: bossType,
              x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2,
              tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty,
              stepProgress: 0, hp: bossHp, maxHp: bossHp,
              path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
              pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0,
              shootTicks: 0, exploding: false, explodeTick: 0,
              windupTicks: bossType === 'frost_warden' ? FROST_SHIELD_CAST_DELAY : 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1,
              phaseTimer: bossType === 'splitter_queen' ? QUEEN_PHASE_INTERVAL : bossType === 'frost_warden' ? FROST_RELOCATE_INTERVAL : 0,
              icyShieldHP: 0,
              prayer: bossType === 'blind_prayer' ? createPrayerAbilities() : undefined,
              king: bossType === 'fiery_king' ? { untouchedTicks: 0, arenaWindupTicks: 0 } : undefined,
              sea: bossType === 'sea_chanter' ? createSeaChanterAbilities() : undefined,
              thorn: bossType === 'thorn_weaver' ? createThornAbilities() : undefined,
            });
            initializeNewEncounter(state, state.enemies[state.enemies.length - 1]);
            state.bossSpawnName = BOSS_NAMES[bossType];
            state.bossSpawnColor = cfg.color;
            state.bossSpawnTicks = BOSS_ANNOUNCEMENT_TICKS;
            if (bossType === 'frost_warden' && !state.saturn) scatterFrostIceTiles(state, chamberOfTile(tx, ty));
          }
        }
        state.bossTimer = BOSS_SPAWN_INTERVAL;
        state.bossOverlapTicks=0;
      }
    } else {
      if(overlapDue)state.bossTimer=0;
      else state.bossTimer--;
      if (state.bossTimer <= 0) {
        state.bossWarningTicks = BOSS_WARNING_TICKS;
      }
    }
  }

  // Charge decay
  if (state.chargeCount > 0) {
    state.chargeDecayTimer++;
    if (state.chargeDecayTimer >= CHARGE_DECAY_TICKS) {
      state.chargeCount = 0;
      state.chargeDecayTimer = 0;
    }
  }

  if (state.trial?.devourer) { updateSingularityMaws(state); if ((state as GameState).gamePhase !== 'playing') return; }
  // Minor events use the real player position before any Lunar AI substitution.
  const ambientResult = state.trial || state.mode === 'gambit' ? false : updateAmbientEvents(state); // no space events (black hole, shooting star, eclipse, Supernova) on any challenge map
  if (ambientResult === 'supernova') detonateSupernova(state);
  if ((state as GameState).gamePhase === 'lost') return;
  if (ambientResult === true) {
    healPlayer(state, 20); healCore(state, 20);
    addStarEnergy(state,STAR_ENERGY_MAX,false);
    state.stellarPowerBonusTicks = Math.max(state.stellarPowerBonusTicks, 120);
    grantInstantSpeedBoost(state, false);
    showRewardEffect(state, 'player', 'energy');
  }

  // Player movement + resource pickup
  updatePlayer(state);

  // Enemy spawning
  const spawnRegularAliens = !state.noMobs && !state.jupiter && !state.saturn && !state.sirius && !state.trial?.devourer; // the Singularity has only Lost Souls
  if (spawnRegularAliens) state.spawnTimer++;
  const tier = DIFFICULTY_TIERS[Math.min(state.difficultyLevel, DIFFICULTY_TIERS.length - 1)];
  const alienSpawnInterval = tier.spawnInterval * (state.gaia ? GAIA_SPAWN_RATE : state.sun ? 1 / SUN.alienSpawnRate : 1);
  if (spawnRegularAliens && state.spawnTimer >= alienSpawnInterval) {
    state.spawnTimer = 0;
    spawnEnemy(state);
  }

  // Enemy AI + attacks
  updateSingularity(state);
  syncToxicGasSound(state.trial?.devourer?gasDepth(state,state.playerX,state.playerY):0);
  updateCelestialField(state);
  const melodyReply=state.neptune?.refrain;
  const enemyFrame=!(melodyReply?.stage==='answer'&&melodyReply.answerStarted)||state.gameTick%8===0;
  if (!isEclipseActive(state)) {
    if(enemyFrame){updateEnemyTargets(state);updateSeaSongWaves(state);updateThornHazards(state);}
    updatePoisonSound(state);
  } else stopPoisonSound();

  // Meteorite
  if(enemyFrame&&!state.trial?.mapOnly&&state.mode!=='gambit')updateMeteorite(state);
  if (state.gambit) updateGambit(state);
  if (state.craterField) { // Crater: heal the player standing in the struck room, in short pulses
    if (--state.craterField.ticks <= 0 || !state.constellations.includes('meteorHeal')) state.craterField = null;
    else if (state.gameTick % CRATER.pulseTicks === 0) {
      const room = state.craterField.chamber, playerIn = chamberOfTile(state.playerTileX, state.playerTileY) === room;
      if (playerIn) healPlayer(state, CRATER.healPerPulse, false);
      // Ruby heals too: placed in the room, or carried by the player inside it.
      if (state.playerCarryingRuby ? playerIn : state.rubyTileX !== -1 && chamberOfTile(state.rubyTileX, state.rubyTileY) === room) healCore(state, CRATER.healPerPulse);
    }
  }
  if (state.mode === 'endless' || state.mode === 'ascension') updateComet(state);

  // Resource spawn
  state.resourceTimer++;
  if (state.resourceTimer >= RESOURCE_SPAWN_INTERVAL) {
    state.resourceTimer = 0;
    spawnResource(state);
  }

  if(enemyFrame)updateEnemyShots(state);
  updateMines(state);

  // Update bullets
  for (let i = state.laserBullets.length - 1; i >= 0; i--) {
    const b = state.laserBullets[i];
    b.x += b.dx;
    b.y += b.dy;
    b.ticks++;
    const maxRange = (b.powered ? LASER_RANGE_PWR : LASER_RANGE) + 3.5;
    if (b.x < 0 || b.x >= MAP_COLS || b.y < 0 || b.y >= MAP_ROWS || (b.ticks * BULLET_SPEED) > maxRange) {
      state.laserBullets.splice(i, 1);
      continue;
    }
    const dmg = b.blessingDamage ?? (b.powered ? BULLET_DMG_PWR : BULLET_DMG) * (1 + 0.25 * constellationBonus(state, 'bullets')) * (b.mirror ? twinDamageMult(state) : 1) * (b.damageScale??1) * ((state.bulletStunUntil ?? 0) > state.gameTick ? SHOOTER.rewardBulletMult : 1);
    const btx = Math.floor(b.x), bty = Math.floor(b.y);
    if (!b.mirror && isMoonMirror(state, btx, bty) && (btx !== state.playerTileX || bty !== state.playerTileY)) {
      moonReflect(state, btx, bty, dmg); state.laserBullets.splice(i, 1); continue; // bounced back into you
    }
    const crossed = mirrorCrossing(state, b.x - b.dx, b.y - b.dy, b.x, b.y);
    if (crossed) { // a Reflector's mirror bounces it back (decoy shots just stop)
      const m = crossed.e, len = Math.hypot(b.dx, b.dy) || 1, vx = b.dx / len, vy = b.dy / len, dot = vx * m.faceX! + vy * m.faceY!;
      if (!b.blessingDecoy) {
        (state.enemyShots ??= []).push({ x: crossed.x * TILE_SIZE, y: crossed.y * TILE_SIZE, dx: (vx - 2 * dot * m.faceX!) * REFLECTOR.shotSpeed, dy: (vy - 2 * dot * m.faceY!) * REFLECTOR.shotSpeed, ownerId: m.id, ticks: 0, mirror: true });
        playAudioOneShot('/sounds/shield.mp3', .3, 1.8);
      }
      state.laserBullets.splice(i, 1); continue;
    }
    let hit = false;
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (!e || e.id===b.avoidEnemyId || (e.twin?.downedTicks ?? 0) > 0) continue;
      if (isSeaChanterDiving(e)) continue;
      if (Math.abs(e.tileX + 0.5 - b.x) < 0.6 && Math.abs(e.tileY + 0.5 - b.y) < 0.6) {
        // Heavy bullets (every 20th shot): double damage and a one-tile push for regular aliens.
        const heavy = !!b.heavy && !b.blessingDecoy;
        const hitDmg = heavy ? dmg * BULLET_HEAVY_MULT : dmg;
        damageEnemy(state, e, hitDmg,b.blessingDecoy?'summon':'player',!b.blessingDecoy&&!b.mirror&&!b.blessingCopy?.5:0);
        if(!b.blessingDecoy){buildBulletHit(state,e,hitDmg);chainElectric(state,e);}
        if(!b.blessingDecoy&&(state.bulletStunUntil??0)>state.gameTick&&e.hp>0)e.buildStopUntil=Math.max(e.buildStopUntil??0,state.gameTick+(isBossType(e.type)?SHOOTER.rewardBossStunTicks:SHOOTER.rewardStunTicks)); // Shooter reward
        // A Charger or Lancer mid-attack (winding up or rushing) keeps its attack: no push.
        const attacking = (e.type === 'charger' && ((e.chargeWindupTicks ?? 0) > 0 || e.chargeDirX !== 0 || e.chargeDirY !== 0)) || (e.type === 'lancer' && e.windupTicks > 0) || (e.type === 'grappler' && e.hook !== undefined && e.hook.phase !== 'retract');
        if (heavy && e.hp > 0 && !isBossType(e.type) && !attacking) {
          const horizontal = Math.abs(b.dx) >= Math.abs(b.dy);
          e.pushDirX = horizontal ? Math.sign(b.dx) || 1 : 0; e.pushDirY = horizontal ? 0 : Math.sign(b.dy) || 1;
          e.pushTiles = Math.max(e.pushTiles, BULLET_HEAVY_PUSH);
        }
        if (heavy) { state.build.impacts.push({ x: e.x, y: e.y, kind: 'slam', ticks: 18 }); playAudioOneShot('/sounds/hitHurt.wav', .45 * ATTACK_SFX_VOLUME, .8); }
        if (!b.blessingDecoy && (state.explosiveBulletsUntil ?? 0) > state.gameTick) explodeBullet(state, e, hitDmg); // Trapper reward
        hit = true;
        if (e.hp <= 0) killEnemy(state, j);
        break; // no piercing
      }
    }
    if (hit) {
      gaiaClearTile(state, Math.floor(b.x), Math.floor(b.y), 1);
      state.laserBullets.splice(i, 1);
      playSFX_alienHit();
    }
  }

  // Decay visual FX
  state.prayerWaves = (state.prayerWaves ?? []).filter(wave => { wave.ticks--; return wave.ticks > 0; });
  state.rewardEffects = state.rewardEffects.filter(fx => { fx.ticks--; return fx.ticks > 0; });
  state.laserBeams = state.laserBeams.filter(b => { b.ticks--; return b.ticks > 0; });
  state.waveEffects = state.waveEffects.filter(w => { w.ticks--; w.radius = w.maxRadius * (1 - w.ticks / 30); return w.ticks > 0; });
  state.bombBlasts = state.bombBlasts.filter(b => { b.ticks--; b.radius = b.maxRadius * (1 - b.ticks / 28); return b.ticks > 0; });
  state.lightningArcs = state.lightningArcs.filter(a => { a.ticks--; return a.ticks > 0; });
  state.slashEffects = state.slashEffects.filter(s => { s.ticks--; return s.ticks > 0; });
  state.sapphireHitEffects = (state.sapphireHitEffects??[]).filter(effect => effect.untilTick > state.gameTick && state.enemies.some(enemy=>enemy.id===effect.enemyId&&enemy.hp>0&&!enemy.twin?.downedTicks));
  state.deathParticles = state.deathParticles.filter(p => {
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.9; p.vy *= 0.9;
    p.ticks--;
    return p.ticks > 0;
  });
  // Clean up chain-lightning casualties
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    if (state.enemies[i]?.hp <= 0) killEnemy(state, i);
  }
  if (state.gamePhase === 'playing') updateJammerEntry(state);
  if (state.tutorial) updateTutorial(state);
  if (state.trial) updateTrialSkill(state);
  if (state.neptune) updateNeptune(state);
  if (state.gaia) updateGaia(state);
  if (state.moon) updateMoon(state);
  if (state.sun) updateSun(state);
  if (state.jupiter) updateJupiter(state);
  if (state.saturn) updateSaturn(state);
  if (state.binary) updateBinary(state);
  if (state.sirius) updateSirius(state);
  if (state.venus) updateVenus(state);
}

// Challenge objectives (fish, water clones and balls, pods, blossoms, illusions): no score, energy or kill rewards.
export function isChallengeObject(type: EnemyType) { return type === 'cinder_wisp' || type === 'lost_soul' || type === 'sand_relic' || type === 'sand_core' || isNeptuneObject(type) || isGaiaObject(type) || isMoonObject(type); }

// Room picker shared by full-charge room strikes (Neptune's Ocean’s Chorus, Gaia's full Sunfire).
export function chooseSkyLaser(state: GameState, chamber: number): boolean {
  if (state.gamePhase !== 'laserTarget' || chamber < 0 || chamber > 3) return false;
  if (state.sirius?.ritual) return guessSiriusRitual(state, chamber); // Sirius: the picker is your guess of Ruby's destination
  if (state.gaia) { // full Sunfire: the chosen room winds up, then burns
    state.gaia.sunfire = { chamber, ticks: GAIA_SUN_WARNING }; state.gaia.sunCharge = 0; state.gamePhase = 'playing';
    state.playerCastTicks = 24; state.playerCastKind = 'thorn_weaver'; state.playerPrimalCast = true;
    playCelestialSound('ready');
    return true;
  }
  if (!state.neptune) return false;
  state.neptune.laser = { chamber, ticks: NEPTUNE_LASER_WARNING };
  state.playerCastTicks = 24; state.playerCastKind = 'sea_chanter'; state.playerPrimalCast = true;
  playOceanChorusCast();
  state.neptune.healCharge = 0;
  state.gamePhase = 'playing';
  return true;
}
export function cancelSkyLaser(state: GameState) {
  if (state.gamePhase === 'laserTarget' && state.sirius?.ritual) state.sirius.ritual.guess = -2; // skipped: no guess this time
  if (state.gamePhase === 'laserTarget') state.gamePhase = 'playing';
}

// Trial skill: once cast (the held skill empties), it comes back after its cooldown (20s; Gaia's Roots 40s).
function updateTrialSkill(state: GameState) {
  const trial = state.trial!;
  if (state.specialSkill) return;
  if (trial.cooldown === 0) trial.cooldown = trialSkillCooldown(trial.skill);
  else if (--trial.cooldown === 0) { state.specialSkill = trial.skill; playUiSfx('celestialReady'); } // the same cue as the god Skill Ready button
}

// ─── Tutorial ─────────────────────────────────────────────────────────────────

function spawnTutorialAliens(state: GameState, count: number, chamber = chamberOfTile(state.playerTileX, state.playerTileY)) {
  const room = chamber >= 0 ? chamber : 0;
  const tiles = freeChamberTiles(state, room).filter(([x, y]) => {
    const d = Math.hypot(x - state.playerTileX, y - state.playerTileY);
    return d >= 4 && d <= 8;
  });
  for (let i = 0; i < count && tiles.length; i++) {
    const [x, y] = tiles.splice(Math.floor(Math.random() * tiles.length), 1)[0];
    const alien = createEncounterEnemy(state, 'normal', x, y, ENEMY_CONFIGS.normal.maxHp);
    alien.attackTimer = 90;
    state.enemies.push(alien);
  }
}

function enterTutorialStep(state: GameState, step: number) {
  const t = state.tutorial!;
  t.step = step; t.count = 0; t.pauseTicks = 0; t.retry = false;
  const id = TUTORIAL_STEPS[step]?.id;
  if (id === 'laser' || id === 'bullet') spawnTutorialAliens(state, 2);
  if (id === 'wave' || id === 'bomb') spawnTutorialAliens(state, 3);
  if (id === 'energy') { state.starEnergy = Math.max(state.starEnergy, STAR_ENERGY_MAX - 10); state.poweredTicks = 0; spawnTutorialAliens(state, 3); }
  if (id === 'carry') t.carried = state.playerCarryingRuby;
  if (id === 'heal') {
    state.enemies = state.enemies.filter(enemy => isBossType(enemy.type));
    state.playerHP = Math.min(state.playerHP, 50); state.rubyHP = Math.min(state.rubyHP, 50);
  }
  if (id === 'meteor') {
    const chamber = chamberOfTile(state.playerTileX, state.playerTileY);
    state.meteoriteWarning = chamber >= 0 ? chamber : state.playerChamber >= 0 ? state.playerChamber : 0;
    state.meteoriteStrikeIn = METEORITE_WARNING;
    spawnTutorialAliens(state, 3, state.meteoriteWarning);
  }
  if (id === 'celestial') { state.specialSkill = 'fiery_king'; spawnTutorialAliens(state, 4); }
}

// Watches the player's actions (cooldowns starting, tiles moved, Ruby toggled) to advance the current step.
function updateTutorial(state: GameState) {
  const t = state.tutorial!;
  state.meteoriteTimer = Math.max(state.meteoriteTimer, METEORITE_CYCLE); // natural meteors never start
  state.ambientEvents.timer = Math.max(state.ambientEvents.timer, 3600);
  const started = (key: string, value: number) => { const fired = value > (t.cooldowns[key] ?? 0); t.cooldowns[key] = value; return fired; };
  const laser = started('laser', state.laserCooldown), bullet = started('bullet', state.bulletCooldown);
  const wave = started('wave', state.waveCooldown), speed = started('speed', state.speedCooldown);
  const bomb = started('bomb', state.bombCooldown), heal = started('heal', state.rubyHealCooldown);
  const powered = started('powered', state.poweredTicks);
  const moved = state.playerTileX !== t.lastTile[0] || state.playerTileY !== t.lastTile[1];
  const jumped = Math.max(Math.abs(state.playerTileX - t.lastTile[0]), Math.abs(state.playerTileY - t.lastTile[1])) > 2;
  t.lastTile = [state.playerTileX, state.playerTileY];
  const toggled = state.playerCarryingRuby !== t.carried; t.carried = state.playerCarryingRuby;

  const step = TUTORIAL_STEPS[t.step];
  if (!step || step.id === 'done') { if(step?.id==='done'&&!getProfile().tutorialCompleted)updateProfile(p=>{p.tutorialCompleted=true;delete p.resumes.tutorial;});return; }
  if (t.pauseTicks > 0) { if (--t.pauseTicks === 0) enterTutorialStep(state, t.step + 1); return; }
  const aliensLeft = state.enemies.some(enemy => !isBossType(enemy.type));
  switch (step.id) {
    case 'move': if (moved) t.count++; break;
    case 'laser': if (laser) t.count = Math.max(t.count, 1); if (!aliensLeft && t.count >= 1) t.count = step.goal; break;
    case 'bullet': if (bullet) t.count = Math.max(t.count, 1); if (!aliensLeft && t.count >= 1) t.count = step.goal; break;
    case 'wave': if (wave) t.count++; break;
    case 'speed': if (speed) t.count++; break;
    case 'bomb': if (bomb) t.count++; break;
    case 'energy': if (powered) t.count++; break;
    case 'carry': if (toggled) t.count++; break;
    case 'heal': if (heal) t.count++; break;
    case 'teleport': if (jumped) t.count++; break;
    case 'meteor':
      if (state.meteoriteImpact && state.meteoriteWarning < 0 && t.count === 0) {
        if (chamberOfTile(state.playerTileX, state.playerTileY) === state.meteoriteImpact.chamber) {
          t.retry = true; state.playerHP = Math.max(state.playerHP, 60); enterTutorialStep(state, t.step); t.retry = true;
        } else t.count = 1;
      }
      break;
    case 'celestial': if (!state.specialSkill && state.playerCastKind === 'fiery_king') t.count = 1; break;
  }
  if (t.count >= step.goal) { t.count = step.goal; t.pauseTicks = TUTORIAL_STEP_PAUSE; }
}

// God-mode debug tool: clear/suppress regular enemies without rewards or boss cleanup.
export function godSetNoFreeze(state: GameState, enabled: boolean) {
  state.noFreeze = enabled;
  if (enabled && !state.playerStunned) state.playerFrozenTicks = 0;
}

export function godSetNoBossSpawns(state: GameState, enabled: boolean) {
  state.noBossSpawns=enabled;
  if(enabled){
    clearSunEncounter(state); clearJupiterEncounter(state); clearSaturnEncounter(state); clearBinaryEncounter(state); clearSiriusEncounter(state); clearVenusEncounter(state);
    state.encounterEffects = [];
    state.enemies=state.enemies.filter(e=>!isBossType(e.type)&&e.type!=='queen_echo'&&e.type!=='moon_illusion'&&e.type!=='aegis_construct');
    clearThornHazards(state);stopSeaSounds();state.seaSongWaves=[];state.seaSongBursts=[];
    state.prayerWaves=[];state.frostIceTiles=[];state.playerFrozenTicks=0;state.kingArenaPulseTicks=0;state.slashEffects=[];
    const bossColors=new Set(['#cc0022','#cc33ff','#dd88ff','#6b2fa8','#aaeeff','#ffdd22','#89cbff']);
    state.laserBeams=state.laserBeams.filter(beam=>!bossColors.has(beam.color??''));
    if(state.hallwaySeal!==-1)setHallwayWalled(state,state.hallwaySeal,false);
    state.hallwaySeal=-1;state.hallwaySealTicks=0;
    state.bossWarningTicks=0;state.bossTimer=BOSS_SPAWN_INTERVAL;state.bossSpawnTicks=0;
  }
}

export function godSetNoMeteors(state:GameState,enabled:boolean){
  state.noMeteors=enabled;
  if(enabled){state.meteoriteWarning=-1;state.meteoriteStrikeIn=0;state.meteoriteImpact=null;state.meteoriteTimer=METEORITE_CYCLE;}
}

export function godSetNoMobs(state: GameState, enabled: boolean) {
  state.noMobs = enabled;
  state.spawnTimer = 0;
  if (enabled && state.trial?.devourer) state.trial.devourer.soulSigns = [];
  if (enabled && state.neptune) {
    state.neptune.shark = state.neptune.sharkFollowup = state.neptune.sharkThird = null;
    state.neptune.sharkTriple = false;
    state.neptune.sharkTimer = NEPTUNE_SHARK_GAP[0];
    state.neptune.jellyTimer = NEPTUNE_JELLY_GAP[0];
    if (state.neptune.dive) state.neptune.dive.jellyTimer = -1;
  }
  if (enabled) state.enemies = state.enemies.filter(e => isBossType(e.type) || e.type === 'queen_echo' || e.type === 'moon_illusion' || e.type === 'aegis_construct' || e.type === 'cinder_wisp');
}

// God-mode debug tool: force-spawn a specific boss type at a random valid spawn tile,
// removing whichever boss-tier enemy currently exists (queen decoys are left alone —
// they persist independently of their queen per normal rules).
export function godAdvanceStage(state: GameState) {
  if (state.gamePhase !== 'playing' || state.constellationChoices.length) return;
  state.bossesKilled++;
  recordStage(state);
  state.difficultyLevel = Math.max(state.difficultyLevel, Math.min(DIFFICULTY_TIERS.length - 1, 3 + state.bossesKilled));
  if (state.bossesKilled === SPECIAL_UNLOCK_KILLS) announceAscension(state);
  offerConstellation(state);
  offerCelestialBlessing(state);
}

export function godJumpStage20(state:GameState){
  if((state.mode!=='endless'&&state.mode!=='ascension')||state.gamePhase!=='playing'||state.constellationChoices.length||state.bossesKilled>=20)return false;
  const crossedAscension=state.bossesKilled<SPECIAL_UNLOCK_KILLS;
  state.bossesKilled=20;recordStage(state);state.difficultyLevel=DIFFICULTY_TIERS.length-1;state.difficultyTimer=0;
  if(crossedAscension)announceAscension(state);
  offerCelestialBlessing(state);return true;
}

export function godEnterAscension(state: GameState) {
  if(state.gamePhase!=='playing')return;
  const firstUnlock = state.bossesKilled < SPECIAL_UNLOCK_KILLS;
  state.bossesKilled=Math.max(state.bossesKilled,SPECIAL_UNLOCK_KILLS);
  state.difficultyLevel=DIFFICULTY_TIERS.length-1;state.difficultyTimer=0;
  state.noMobs=false;state.spawnTimer=0;state.ascensionBannerTicks=360;
  if (firstUnlock) announceAscension(state);
}

/** God control: restart the Singularity at a phase: the swarm is cleared and that phase's full original spawns, fuse lit. */
/** God panel: jumping to phase 2 or 3 also brings the clock (TIME and the spawn timer) up to at least 60 seconds. */
export function godPhaseClock(state: GameState, phase: 1 | 2 | 3) {
  if (phase < 2) return;
  state.score = Math.max(state.score, 60); state.difficultyTimer = Math.max(state.difficultyTimer, 3600);
}
export function godSetSingularityPhase(state: GameState, phase: 1 | 2 | 3) {
  godPhaseClock(state, phase);
  const trial = state.trial?.devourer; if (!trial || state.gamePhase !== 'playing') return;
  state.enemies = state.enemies.filter(e => e.type !== 'devourer');
  Object.assign(trial, { phase, maws: [], swallows: [], bursts: [], hook: undefined, hookCooldown: 0, flings: [], hookFx: [], feast: undefined, jaw: undefined, jawTimer: undefined, gas: [] });
  godSpawnBoss(state, 'devourer');
  state.bossSpawnName = `SOUL DEVOURER · PHASE ${phase}`; state.bossSpawnColor = ENEMY_CONFIGS.devourer.color; state.bossSpawnTicks = BOSS_ANNOUNCEMENT_TICKS;
}
export function godSpawnBoss(state: GameState, bossType: BossType, { playArrivalSound = true } = {}) {
  state.encounterEffects = [];
  state.noBossSpawns=false; // Explicit manual spawn exits No Boss mode.
  clearThornHazards(state);
  state.enemies = state.enemies.filter(e => !isBossType(e.type) && e.type !== 'aegis_construct');
  state.seaSongWaves = [];
  state.seaSongBursts = [];
  stopSeaSounds();
  if (state.hallwaySeal !== -1) {
    setHallwayWalled(state, state.hallwaySeal, false);
    state.hallwaySeal = -1;
    state.hallwaySealTicks = 0;
  }
  state.frostIceTiles = [];

  const allSpawns: [number, number][] = [];
  for (let ch = 0; ch < 4; ch++) {
    for (const [tx, ty] of CHAMBER_SPAWN_TILES[ch]) {
      if (Math.abs(tx - state.playerTileX) + Math.abs(ty - state.playerTileY) > 10) {
        allSpawns.push([tx, ty]);
      }
    }
  }
  if (allSpawns.length === 0) return;
  const [tx, ty] = allSpawns[Math.floor(Math.random() * allSpawns.length)];
  const cfg = ENEMY_CONFIGS[bossType];
  const bossHp = cfg.maxHp + state.bossesKilled * 15;
  state.enemies.push({
    id: state.nextEnemyId++, type: bossType,
    x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2,
    tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty,
    stepProgress: 0, hp: bossHp, maxHp: bossHp,
    path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
    pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0,
    shootTicks: 0, exploding: false, explodeTick: 0,
    windupTicks: bossType === 'frost_warden' ? FROST_SHIELD_CAST_DELAY : 0, chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1,
    phaseTimer: bossType === 'splitter_queen' ? QUEEN_PHASE_INTERVAL : bossType === 'frost_warden' ? FROST_RELOCATE_INTERVAL : 0,
    icyShieldHP: 0,
  });
  if (bossType === 'frost_warden' && !state.saturn) scatterFrostIceTiles(state, chamberOfTile(tx, ty));
  if (bossType === 'blind_prayer') state.enemies[state.enemies.length - 1].prayer = createPrayerAbilities();
  if (bossType === 'fiery_king') state.enemies[state.enemies.length - 1].king = { untouchedTicks: 0, arenaWindupTicks: 0 };
  if (bossType === 'sea_chanter') state.enemies[state.enemies.length - 1].sea = createSeaChanterAbilities();
  if (bossType === 'thorn_weaver') state.enemies[state.enemies.length - 1].thorn = createThornAbilities();
  initializeNewEncounter(state, state.enemies[state.enemies.length - 1], playArrivalSound);
  state.bossWarningTicks = 0;
  state.bossSpawnName = BOSS_NAMES[bossType];
  state.bossSpawnColor = cfg.color;
  state.bossSpawnTicks = BOSS_ANNOUNCEMENT_TICKS;
  state.bossTimer = BOSS_SPAWN_INTERVAL;
}

export function useSpecialSkill(state: GameState): boolean {
  if(state.gamePhase!=='playing'||state.playerFrozenTicks>0)return false;
  if(!state.specialSkill){playCelestialSound('empty');return false;}
  if(state.specialLockTicks>0)return false; // a skill just earned from the previous cast's kill is kept, not fired by a repeat press
  const kind = state.specialSkill;
  if(kind !== 'devourer') playCelestialSound(kind);
  if(kind === 'fiery_king') playCelestialSound('solar_swoosh');
  if(kind === 'storm_reaper') { playCelestialSound('jupiter_shot'); state.stormHasteTicks = SPECIAL_REAPER_HASTE_TICKS; } // it also hastes you briefly
  if(kind === 'storm_reaper') {
    try {const sound=gameAudio('/sounds/bossQueenAttack1.mp3', 'attack');sound.volume=.55*ATTACK_SFX_VOLUME;sound.loop=false;sound.play().catch(()=>{});} catch {}
  }
  if(kind === 'sea_chanter') playCelestialSound('neptune_electric');
  if(kind === 'astral_twins') playCelestialSound('binary_reach');
  // Consume before resolving kills so a newly earned reward is never erased.
  blessingAttack(state,'special');
  state.specialSkill = null;
  if (!state.trial) state.specialLockTicks = SPECIAL_RECAST_LOCK;
  state.playerCastTicks = 24; state.playerCastKind = kind; state.playerPrimalCast = false;
  state.specialEffects.push({ kind, x: state.playerX, y: state.playerY, ticks: kind==='splitter_queen'?54:kind==='fiery_king'?48:36 });
  if(kind==='devourer'){
    const ticks=state.trial?.devourer?SINGULARITY_CHALLENGE.fTicks:SPECIAL_SINGULARITY_TICKS; // half as long in the Singularity challenge
    state.singularity={x:(Math.floor(state.playerX/TILE_SIZE)+.5)*TILE_SIZE,y:(Math.floor(state.playerY/TILE_SIZE)+.5)*TILE_SIZE,ticks,maxTicks:ticks,pullTimer:15,damageTimer:60};
    updateSingularitySound(state);return true;
  }
  if(kind==='thorn_weaver'){
    state.celestialField={x:Math.floor(state.playerX/TILE_SIZE)*TILE_SIZE,y:Math.floor(state.playerY/TILE_SIZE)*TILE_SIZE,ticks:state.gaia?GAIA_ROOTS_DURATION:SPECIAL_WEAVER_DURATION,damageTimer:60};
    gaiaClearRootsField(state); // Gaia: the cast clears its whole field (and keeps it clean while active)
    return true;
  }
  if(kind==='splitter_queen'){
    state.lunarDecoy={x:state.playerX,y:state.playerY,tileX:state.playerTileX,tileY:state.playerTileY,hitsLeft:SPECIAL_QUEEN_DECOY_HITS,maxHits:SPECIAL_QUEEN_DECOY_HITS,flashTicks:0,invulnerableTicks:0};
    state.enemies.forEach(e=>e.pathTimer=0);return true;
  }
  if (kind === 'sea_chanter') {
    const heal = sustainSkillAmount(state, state.neptune?NEPTUNE_TIDE_SKILL_HEAL:SPECIAL_CHANTER_HEAL);
    const chargeScale=state.neptune?NEPTUNE_TIDE_SKILL_CHARGE_HEAL/NEPTUNE_TIDE_SKILL_HEAL:1;
    healPlayer(state, heal,true,chargeScale); healCore(state, heal,chargeScale);
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0 || Math.hypot(enemy.x-state.playerX, enemy.y-state.playerY)>SPECIAL_CHANTER_RADIUS) continue;
      const dx=enemy.x-state.playerX,dy=enemy.y-state.playerY,length=Math.hypot(dx,dy)||1;
      enemy.pushDirX=Math.round(dx/length);enemy.pushDirY=Math.round(dy/length);
      if(!enemy.pushDirX && !enemy.pushDirY)enemy.pushDirX=1;
      enemy.pushTiles=Math.max(enemy.pushTiles,SPECIAL_CHANTER_PUSH);
    }
    return true;
  }
  if (kind === 'blind_prayer') {
    playSFX_powerUp();
    if(state.sirius)state.sirius.holy=Math.min(100,state.sirius.holy+STAR_ENERGY_MAX*SIRIUS_HOLY_PER_ENERGY); // Sirius: Surge counts as a full bar of energy for Holy Light
    state.starEnergy=0;state.stellarPowerBonusTicks=0;state.poweredTicks=Math.max(state.poweredTicks,SPECIAL_PRAYER_DURATION+60*constellationBonus(state,'power')+(hasBlessing(state,'blind_prayer')?BLESSING.amberPowerTicks:0));
    state.laserCooldown=0;state.bulletCooldown=0;state.waveCooldown=0;
    state.bombCooldown=0;state.speedCooldown=0;
    grantInstantSpeedBoost(state, false);return true;
  }
  if (kind === 'astral_twins') {
    state.mirrorTwinTicks = SPECIAL_TWIN_DURATION;
    const twin = getMirrorTwinTile(state)!;
    state.specialEffects.push({ kind, x: (twin.tileX + .5) * TILE_SIZE, y: (twin.tileY + .5) * TILE_SIZE, ticks: 36 });
    return true;
  }
  if (kind === 'aegis_sentinel') {
    state.venusVeilTicks = SPECIAL_VENUS_DURATION;
    showRewardEffect(state, 'player', 'shield'); if (state.rubyTileX !== -1) showRewardEffect(state, 'ruby', 'shield');
    return true;
  }
  if (kind === 'frost_warden') {
    const shield = sustainSkillAmount(state, SPECIAL_WARDEN_SHIELD);
    // Shields stack: each cast adds its amount, up to twice one cast (a bigger pool from elsewhere is kept).
    state.playerShieldHP = Math.max(state.playerShieldHP, Math.min(shield * 2, state.playerShieldHP + shield)); state.rubyShieldHP = Math.max(state.rubyShieldHP, Math.min(shield * 2, state.rubyShieldHP + shield));
    state.playerSaturnShield=true;state.rubySaturnShield=true;
    showRewardEffect(state, 'player', 'shield'); showRewardEffect(state, 'ruby', 'shield');
    return true;
  }
  hitSupernova(state, (x, y) => kind === 'fiery_king' || Math.hypot(x - state.playerX, y - state.playerY) <= SPECIAL_REAPER_RADIUS);
  const cfg = SPECIAL_SKILLS[kind];
  const targets = state.enemies.filter(e => e.hp > 0 &&
    (kind === 'fiery_king' || Math.hypot(e.x - state.playerX, e.y - state.playerY) <= SPECIAL_REAPER_RADIUS));
  // Snapshot the cast's victims: splits/decoy cleanup cannot make it hit anyone twice.
  // Solar Flare's and Jupiter Storm's alien damage grows exactly like alien HP up to the skill cap, so each has the same
  // effect from the start to Stage 18.
  const normalDamage = cfg.normalDamage * skillAlienScale(state);
  for (const target of targets) {
    if(kind==='storm_reaper')target.stormSlowUntilTick=state.gameTick+SPECIAL_REAPER_SLOW_TICKS;
    const damage = state.jupiter && kind === 'storm_reaper' && target.id === state.jupiter.bossId ? jupiterPhaseHP(state.jupiter.phase) * JUPITER.celestialShare : state.sun && kind === 'fiery_king' && target.id === state.sun.bossId ? SUN.phaseHP * SUN.solarShare : isBossType(target.type) ? target.maxHp * cfg.bossDamage : normalDamage;
    if (state.sun && kind === 'fiery_king' && target.type === 'cinder_wisp') target.hp = 0;
    else damageEnemy(state, target, damage, 'special',4);
  }
  if (state.sun && kind === 'fiery_king') defuseSunFlare(state); // on the Sun, Solar Flare also stops a pending room flare
  if (kind === 'fiery_king') {
    // Resolve Solar's bomber cascades too, including victims processed earlier in the snapshot.
    let index: number;
    while ((index = state.enemies.findIndex(enemy => enemy.hp <= 0)) >= 0) killEnemy(state, index, false, true);
  } else {
    for (const target of targets) {
      const index = state.enemies.indexOf(target);
      if (index >= 0 && target.hp <= 0) killEnemy(state, index);
    }
  }

  const shakeActive=state.screenShakeTicks>0;
  state.screenShakeTicks = Math.max(state.screenShakeTicks, kind==='fiery_king'?14:18);
  state.screenShakeAmt = Math.max(shakeActive?state.screenShakeAmt:0, kind==='fiery_king'?6:8);
  return true;
}

function fireBulletFrom(state: GameState, tileX: number, tileY: number, x: number, y: number, powered: boolean, mirror: boolean) {
  // Find nearest enemy within bullet range
  const maxRange = powered ? LASER_RANGE_PWR : LASER_RANGE;
  let bestDist = maxRange + 3.5; // +3.5 because we added 3.5 to the actual range in the check
  let targetE = null;
  const targets:Enemy[]=[];
  for (const e of state.enemies) {
    if (e.hp<=0 || isSeaChanterDiving(e) || e.twin?.downedTicks || e.type === 'fish_blue' || e.type === 'fish_red' || e.type === 'lifebloom') continue;
    const dist = tileEuclidDist(e.tileX, e.tileY, tileX, tileY);
    if(dist<maxRange+3.5)targets.push(e);
    if (dist < bestDist) {
      bestDist = dist;
      targetE = e;
    }
  }

  let dx = 0, dy = 0;
  if (targetE) {
    const rdx = targetE.tileX - tileX;
    const rdy = targetE.tileY - tileY;
    const len = Math.sqrt(rdx * rdx + rdy * rdy) || 1;
    dx = (rdx / len) * BULLET_SPEED;
    dy = (rdy / len) * BULLET_SPEED;
  } else {
    // Fire in facing direction
    if (state.playerDirX === 0 && state.playerDirY === 0) {
      dx = BULLET_SPEED; dy = 0;
    } else {
      dx = state.playerDirX * BULLET_SPEED;
      dy = state.playerDirY * BULLET_SPEED;
    }
  }

  if(state.constellations.includes('twinShot')) {
    targets.sort((a,b)=>tileEuclidDist(a.tileX,a.tileY,tileX,tileY)-tileEuclidDist(b.tileX,b.tileY,tileX,tileY));
    for(let i=0;i<2;i++){
      const target=targets[i]??targets[0],other=targets.length>1?targets[1-i]:undefined;
      let shotX=dx,shotY=dy;
      if(target){const rx=target.tileX-tileX,ry=target.tileY-tileY,len=Math.hypot(rx,ry)||1;shotX=rx/len*BULLET_SPEED;shotY=ry/len*BULLET_SPEED;}
      const len=Math.hypot(shotX,shotY)||1,side=i?1:-1;
      state.laserBullets.push({x:x-shotY/len*.14*side,y:y+shotX/len*.14*side,dx:shotX,dy:shotY,powered,ticks:0,mirror,damageScale:.6,avoidEnemyId:other?.id});
    }
  } else state.laserBullets.push({ x, y, dx, dy, powered, ticks: 0, mirror });
}

/** Trapper reward: the bullet bursts on hit, hurting other aliens near the one it hit. */
function explodeBullet(state: GameState, hitEnemy: Enemy, damage: number) {
  const cx = hitEnemy.x, cy = hitEnemy.y, r = TRAPPER.rewardRadius;
  state.bombBlasts.push({ cx, cy, radius: 0, maxRadius: r * TILE_SIZE, ticks: 18 });
  for (const e of [...state.enemies]) {
    if (e === hitEnemy || !state.enemies.includes(e) || e.hp <= 0 || e.twin?.downedTicks || Math.hypot(e.x - cx, e.y - cy) > r * TILE_SIZE) continue;
    damageEnemy(state, e, damage * TRAPPER.rewardSplash, 'player');
    if (e.hp <= 0) killEnemy(state, state.enemies.indexOf(e));
  }
}

export function useBullet(state: GameState) {
  if (state.gamePhase !== 'playing' || state.playerFrozenTicks > 0) return;
  if (state.bulletCooldown > 0) return;
  const firstBullet=state.laserBullets.length;
  blessingAttack(state,'bullet');
  const powered = checkAndConsumePower(state);

  fireBulletFrom(state, state.playerTileX, state.playerTileY, state.playerX / TILE_SIZE, state.playerY / TILE_SIZE, powered, false);
  const heavyEvery = state.constellations.includes('heavyShot') ? BULLET_HEAVY_EVERY_MONOCEROS : BULLET_HEAVY_EVERY;
  const heavy = (state.bulletShotCount = (state.bulletShotCount ?? 0) + 1) % heavyEvery === 0;
  if (heavy) {
    for (const bullet of state.laserBullets.slice(firstBullet)) bullet.heavy = true; // the player's own shot, not twin or Ruby copies
    playAudioOneShot('/sounds/laserBullet.mp3', .9 * ATTACK_SFX_VOLUME, .7);
    playAudioOneShot('/sounds/bomb-ready.wav', .35 * ATTACK_SFX_VOLUME, 1.3);
  }
  const twin = getMirrorTwinTile(state);
  if (twin) fireBulletFrom(state, twin.tileX, twin.tileY, twin.tileX + .5, twin.tileY + .5, powered, true);
  const copy=rubyBlessingCopy(state);
  if(copy){const first=state.laserBullets.length;fireBulletFrom(state,copy.tileX,copy.tileY,copy.tileX+.5,copy.tileY+.5,powered,false);for(const bullet of state.laserBullets.slice(first)){bullet.damageScale=(bullet.damageScale??1)*copy.mult;bullet.blessingCopy=true;bullet.plainCopy=!copy.opal;}}
  for(const bullet of state.laserBullets.slice(firstBullet))bullet.solar=solarBlessingReady(state);
  state.bulletCooldown = BULLET_COOLDOWN;
  playSFX_laserBullet();
}
