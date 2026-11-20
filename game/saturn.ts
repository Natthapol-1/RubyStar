import { CHAMBER_SPAWN_TILES, DIFFICULTY_TIERS, ENEMY_CONFIGS, MAP_COLS, MAP_ROWS, TELEPORT_PADS, TILE_SIZE, chamberOfTile, type EnemyType } from './constants';
import { godPhaseClock, spawnPool, createEncounterEnemy, damageEnemy, damagePlayer, damageRuby, godSpawnBoss, healPlayer, healCore, isFloorTile, killEnemy, playAudioOneShot, playSFX_objectBreak, relocateFrostWarden, shovePlayerFromEnemy, tileEuclidDist, type Enemy, type GameState } from './engine';
import { stepEnemy, walkPath } from './aliens';
import { playUiSfx } from './ui-sfx';

// Saturn challenge: the Frost Warden's ice is her life. She gives large ice shields to her aliens; every point of that
// ice you break, or take for yourself, is taken from her. She recalls the ice left out to heal, and backlashes on
// herself when none is left. Phase 2 adds Frost Bloom and frost-shield-empowered aliens; phase 3 adds freezing grant and recall lines.
export const SATURN = {
  phaseHP: 1200,
  directDamage: .1,       // your weapons barely touch her body
  meteorShare: .1,        // a meteor takes 10% of a phase
  blizzardDamage: 4, pulseTicks: 60, // constant blizzard on you (never Ruby): a shield takes it instead of HP and stops the chill
  trailDelay: 15, trailIceTicks: 72, trailReplaceFadeTicks: 12, trailFreezeTicks: 12, trailShieldLoss: 1 / 5, trailCap: 5,
  iceCount: [32, 40, 48], iceInterval: [360, 240, 240], iceWarning: 60, freezeTicks: 72, // the moving frozen floor (moves every 6s, every 4s from phase 2); 1.2s player freeze
  // Grants: targets are marked for the whole 6s cycle, then each gets a big shield (a Glacier Hulk double).
  grantInterval: 360, grantTargets: 3, grantAmount: 45, hulkGrantMult: 2, grantWarning: 90,
  shatterShare: .2,       // ice you break on her aliens costs her 20% of its amount (9 HP per 45-ice grant)
  absorbShare: .2,        // ice you take (marked target killed first, or caught by C) also damages her, at 20% of its amount
  // Shield you gain from taken ice: 2/3 of the grant when a marked target died first (30), 2× when C caught it (90).
  killShieldShare: 2 / 3, fieldShieldShare: 2,
  shieldCap: 200,         // your shield never holds more than this here, however it was gained
  // The first recall waits an extra half grant cycle, so recalls always land midway between two grants (3s apart).
  recallInterval: 1080, recallOffset: 180, recallWarning: 90, backlashShare: .2,
  recallHealShare: .4,    // she heals for 40% of the ice she pulls back...
  loneRecallHealShare: .4 / 3, // ...but only a third of that (about 13%) when it comes from a single holder
  counterDamage: 8,       // a successful counter (caught grant or countered recall) also hurts every alien inside the field
  counterHealShare: .2,   // countering recall heals you for 20% of protected ice; Ruby receives two-thirds of that amount
  // C: a short time-stop field where you cast it. Aliens inside freeze and their attacks are cancelled, mortar shells
  // landing inside fizzle, and frozen tiles cannot freeze you inside. A grant landing inside comes to you, and a
  // recall cannot pull any ice inside (yours included, if you stand in it). Her grant lasers reach the whole map.
  fieldTicks: 45, fieldRadius: 7,
  cooldown: 156,          // C: 2.6s
  // Phase 2+: holders pass existing frost shield to a nearby unshielded alien, once per pulse.
  bloomFromPhase: 2, bloomInterval: 240, bloomAmount: 10, bloomRadius: 4,
  // Phase 2+: aliens holding her ice also move faster and hit harder, scaling with how much they hold.
  empowerFromPhase: 2, empowerFullIce: 90, empowerSpeed: .5, empowerDamage: .5,
  // Phase 3: when a grant or recall fires, every line it casts freezes the floor tiles it crosses for a while.
  lineIceFromPhase: 3, lineIceTicks: 117, lineFreezeMult: 1 / 3, // line ice lasts 1.95s
  spawnInterval: [180, 120, 120], population: [16, 22, 22], // an alien every 3s up to 16 units, every 2s up to 22 from phase 2
  frostbiter: { range: 4, crouch: 30, leapTicks: 14, damage: 14, rubyDamage: 10, push: 2, cooldown: 120, hitRadius: .8, speed: 1.4 },
  mortar: { range: 9, interval: 240, warning: 60, damage: 10, rubyDamage: 7, iceTicks: 144, spread: 2, maxAlive: 3, speed: .55 },
  hulk: { reach: 2, windup: 45, damage: 18, rubyDamage: 12, push: 2, iceTicks: 96, missIceTicks: 24, cooldown: 210, maxAlive: 2, speed: 1.3 },
} as const;

export const SATURN_COUNTER_FX_TICKS = 48;
export const SATURN_BACKLASH_TICKS = 66; // the failed-recall screen effect
export const SATURN_ALIENS: EnemyType[] = ['frostbiter', 'sleet_mortar', 'glacier_hulk'];
export const isSaturnAlien = (type: EnemyType) => SATURN_ALIENS.includes(type);

export type SaturnBeam = { fromX: number; fromY: number; toX: number; toY: number; ticks: number; kind: 'grant' | 'steal' | 'recall' | 'bloom' };
export interface SaturnState {
  phase: 1 | 2 | 3; bossId: number; pulse: number; spawnTimer: number;
  iceTimer: number; iceWarning: number; nextIce: [number, number][];
  frostTrail?: { x: number; y: number; ticks: number }[]; // positive ticks count down to ice, then negative ticks count its age
  trailFades?: { x: number; y: number; footprintTicks: number; ticks: number }[];
  lastTrailTile?: { x: number; y: number };
  temporaryIce: { x: number; y: number; ticks: number; freezeTicks?: number }[];
  grantTimer: number; grantTargets: number[];  // ids marked for the coming grant
  grantHulks: number[];                       // which marked ids are Glacier Hulks (a dead one still gives double)
  recallTimer: number; bloomTimer: number;
  playerIce: number;                          // the part of your shield that is her ice (she can recall it)
  field: { x: number; y: number; ticks: number } | null; cooldown: number; castTicks: number; // C's time-stop field; castTicks drives the HUD hourglass flip
  shells: { x: number; y: number; ticks: number }[];
  beams: SaturnBeam[];
  effects: { x: number; y: number; ticks: number; kind: 'shatter' | 'steal' | 'backlash' | 'intercept' | 'grantCounter' | 'recallCounter' | 'slam' | 'shell' | 'pounce' | 'fizzle' }[];
  lastShatterSound: number;
  backlash: { x: number; y: number; ticks: number } | null; // screen-wide effect after a failed recall
}

export function createSaturnState(s: GameState) {
  s.saturn = { phase: 1, bossId: -1, pulse: 0, spawnTimer: 60, iceTimer: 0, iceWarning: 0, nextIce: [], temporaryIce: [],
    grantTimer: SATURN.grantInterval, grantTargets: [], grantHulks: [], recallTimer: SATURN.recallInterval + SATURN.recallOffset, bloomTimer: SATURN.bloomInterval, playerIce: 0,
    field: null, cooldown: 0, castTicks: 0, shells: [], beams: [], effects: [], lastShatterSound: -99, backlash: null };
}
export function saturnBoss(s: GameState) { return s.enemies.find(e => e.id === s.saturn?.bossId && e.hp > 0); }
export function saturnBlizzard(s: GameState) { return !!s.saturn && !!saturnBoss(s); }
/** Her body only takes a small share of your direct hits. */
export function saturnDamageTaken(s: GameState, e: Enemy, source: string) {
  return s.saturn?.bossId === e.id && (source === 'player' || source === 'special') ? SATURN.directDamage : 1;
}
export function initializeSaturnBoss(s: GameState, boss: Enemy) {
  const t = s.saturn!;
  t.bossId = boss.id; t.phase = 1; t.pulse = 0; t.bloomTimer = SATURN.bloomInterval;
  t.grantTimer = SATURN.grantInterval; t.grantTargets = chooseGrantTargets(s, boss); t.recallTimer = SATURN.recallInterval + SATURN.recallOffset;
  boss.hp = boss.maxHp = SATURN.phaseHP * 3;
  boss.icyShieldHP = 0; boss.pushTiles = 0; boss.phaseTimer = 1800;
  t.frostTrail = []; t.trailFades = []; t.lastTrailTile = { x: s.playerTileX, y: s.playerTileY };
  s.frostIceTiles = []; t.iceTimer = 0; t.nextIce = []; t.iceWarning = 0;
}
export function clearSaturnEncounter(s: GameState) {
  if (!s.saturn) return;
  const t = s.saturn;
  t.frostTrail = []; t.trailFades = []; t.lastTrailTile = { x: s.playerTileX, y: s.playerTileY };
  t.backlash = null; t.bloomTimer = SATURN.bloomInterval;
  t.nextIce = []; t.iceWarning = 0; t.temporaryIce = []; t.shells = []; t.beams = []; t.effects = []; t.grantTargets = []; t.field = null;
  s.frostIceTiles = []; s.playerFrozenTicks = 0;
}
/** Inside C's time-stop field (pixel position). */
export function inSaturnField(s: GameState, x: number, y: number) {
  const f = s.saturn?.field;
  return !!f && Math.hypot(x - f.x, y - f.y) <= SATURN.fieldRadius * TILE_SIZE;
}
/** Frozen tiles cannot freeze you while you stand in your own time-stop field. */
export function saturnFreezeImmune(s: GameState) { return inSaturnField(s, s.playerX, s.playerY); }
function fadeFrostFootprint(saturn: SaturnState, footprint: { x: number; y: number; ticks: number }) {
  (saturn.trailFades ??= []).push({
    x: footprint.x, y: footprint.y, footprintTicks: footprint.ticks, ticks: SATURN.trailReplaceFadeTicks,
  });
}

function fadeFrostTrail(saturn: SaturnState) {
  for (const footprint of saturn.frostTrail ?? []) fadeFrostFootprint(saturn, footprint);
  saturn.frostTrail = [];
}

export function freezeSaturnPlayer(s: GameState) {
  if (saturnFreezeImmune(s)) { s.playerFrozenTicks = 0; s.playerStunned = false; return; }
  const normalTile = s.frostIceTiles.some(([x, y]) => x === s.playerTileX && y === s.playerTileY);
  const temporary = s.saturn?.temporaryIce.find(t => t.x === s.playerTileX && t.y === s.playerTileY);
  const trail=s.saturn?.frostTrail?.some(t=>t.ticks<=0&&t.x===s.playerTileX&&t.y===s.playerTileY);
  s.playerShieldHP *= trail&&!normalTile&&!temporary ? 1-SATURN.trailShieldLoss : .5;
  if (s.playerShieldHP <= 0) s.playerSaturnShield = false;
  s.playerFrozenTicks = normalTile ? SATURN.freezeTicks : Math.max(temporary ? temporary.freezeTicks??SATURN.freezeTicks : 0,trail?SATURN.trailFreezeTicks:0)||SATURN.freezeTicks;
  if (s.saturn) {
    fadeFrostTrail(s.saturn);
    s.saturn.lastTrailTile = { x: s.playerTileX, y: s.playerTileY };
  }
  s.playerQueuedDirX = s.playerQueuedDirY = 0;
  s.frostIceTiles = s.frostIceTiles.filter(([x, y]) => x !== s.playerTileX || y !== s.playerTileY);
  if (s.saturn) s.saturn.temporaryIce = s.saturn.temporaryIce.filter(t => t.x !== s.playerTileX || t.y !== s.playerTileY);
}
export function saturnIceAt(s: GameState, x: number, y: number) {
  const t=s.saturn;if(!t)return false;
  return t.temporaryIce.some(tile=>tile.x===x&&tile.y===y)
    || !!t.frostTrail?.some(tile=>tile.ticks<=0&&tile.x===x&&tile.y===y);
}
/** A successful counter hurts every alien inside the field (after its ice is stripped, so it lands on HP). */
function counterBlast(s: GameState) {
  const t = s.saturn!;
  for (const e of [...s.enemies]) {
    if (e.id === t.bossId || e.hp <= 0 || !s.enemies.includes(e) || !inSaturnField(s, e.x, e.y)) continue;
    damageEnemy(s, e, SATURN.counterDamage, 'special');
    if (e.hp <= 0) { killEnemy(s, s.enemies.indexOf(e)); if (s.gamePhase !== 'playing') return; }
  }
}
/** Phase 3: freeze every floor tile a fired grant or recall line crosses (lines added since `from`). */
function freezeLines(s: GameState, from: number) {
  const t = s.saturn!;
  if (t.phase < SATURN.lineIceFromPhase) return;
  for (const b of t.beams.slice(from)) {
    if (b.kind === 'bloom') continue;
    // Traverse the beam's exact world-space segment, including short diagonal tile crossings.
    let x = Math.floor(b.fromX / TILE_SIZE), y = Math.floor(b.fromY / TILE_SIZE);
    const startX = x, startY = y;
    const endX = Math.floor(b.toX / TILE_SIZE), endY = Math.floor(b.toY / TILE_SIZE);
    const dx = b.toX - b.fromX, dy = b.toY - b.fromY, sx = Math.sign(dx), sy = Math.sign(dy);
    const deltaX = dx ? TILE_SIZE / Math.abs(dx) : Infinity, deltaY = dy ? TILE_SIZE / Math.abs(dy) : Infinity;
    let nextX = dx ? ((sx > 0 ? (x + 1) * TILE_SIZE : x * TILE_SIZE) - b.fromX) / dx : Infinity;
    let nextY = dy ? ((sy > 0 ? (y + 1) * TILE_SIZE : y * TILE_SIZE) - b.fromY) / dy : Infinity;
    for (;;) {
      if (x === endX && y === endY) break;
      if ((x !== startX || y !== startY) && !isPad(x, y)) freezeTile(s, x, y, SATURN.lineIceTicks, Math.round(SATURN.freezeTicks * SATURN.lineFreezeMult));
      // A boundary endpoint belongs to its floor-indexed tile, without stepping past the segment.
      if (Math.min(nextX, nextY) >= 1 - 1e-12) { x = endX; y = endY; continue; }
      if (Math.abs(nextX - nextY) < 1e-10) { x += sx; y += sy; nextX += deltaX; nextY += deltaY; }
      else if (nextX < nextY) { x += sx; nextX += deltaX; }
      else { y += sy; nextY += deltaY; }
    }
  }
}
/** Teleport pads stay clear of the moving frozen floor and the Warden's line ice; only alien attacks can freeze them. */
const isPad = (x: number, y: number) => TELEPORT_PADS.some(([px, py]) => px === x && py === y);
function freezeTile(s: GameState, x: number, y: number, ticks: number, freezeTicks: number = SATURN.freezeTicks) {
  if (!isFloorTile(s.map, x, y)) return;
  const old = s.saturn!.temporaryIce.find(t => t.x === x && t.y === y);
  if (old) {
    old.ticks = Math.max(old.ticks, ticks);
    old.freezeTicks = Math.max(old.freezeTicks ?? SATURN.freezeTicks, freezeTicks);
  } else s.saturn!.temporaryIce.push({ x, y, ticks, freezeTicks });
}
const hurtBoss = (s: GameState, boss: Enemy, amount: number) => {
  damageEnemy(s, boss, amount, 'enemy');
  if (boss.hp <= 0) { const i = s.enemies.indexOf(boss); if (i >= 0) killEnemy(s, i); }
};

// ─── Her ice: give, shatter, take, recall ────────────────────────────────────

/** Ice on one of her aliens broken by your attack is taken from her (at shatterShare). */
export function saturnShatter(s: GameState, amount: number, at: Enemy) {
  const boss = saturnBoss(s); if (!boss || amount <= 0) return;
  const t = s.saturn!;
  t.effects.push({ x: at.x, y: at.y, ticks: 18, kind: 'shatter' });
  if (s.gameTick - t.lastShatterSound >= 8) { t.lastShatterSound = s.gameTick; playAudioOneShot('/sounds/ice.mp3', .35, 1.5); }
  hurtBoss(s, boss, amount * SATURN.shatterShare);
}
/** Frost Bloom conserves frost shield. Only holders at the start of this pulse can pass it on. */
function frostBloom(s: GameState, boss: Enemy) {
  const t = s.saturn!;
  const aliens = s.enemies.filter(e => e !== boss && e.hp > 0 && !e.twin?.downedTicks && !saturnTimeStopped(s, e));
  const donors = aliens.filter(e => e.icyShieldHP > 0).sort((a, b) => a.id - b.id);
  const recipients = aliens.filter(e => e.icyShieldHP <= 0);
  for (const donor of donors) {
    const recipient = recipients.filter(e => e.icyShieldHP <= 0)
      .map(e => ({ e, distance: Math.hypot(e.x - donor.x, e.y - donor.y) }))
      .filter(candidate => candidate.distance <= SATURN.bloomRadius * TILE_SIZE)
      .sort((a, b) => a.distance - b.distance || a.e.id - b.e.id)[0]?.e;
    if (!recipient) continue;
    const amount = Math.min(SATURN.bloomAmount, donor.icyShieldHP);
    donor.icyShieldHP -= amount; recipient.icyShieldHP += amount;
    t.beams.push({ fromX: donor.x, fromY: donor.y, toX: recipient.x, toY: recipient.y, ticks: 24, kind: 'bloom' });
  }
}
/** Phase 2+: how much stronger an alien is from the ice it holds (1 = normal, up to 1 + empower share at full). */
export function saturnEmpower(s: GameState, e: Enemy, kind: 'speed' | 'damage') {
  const t = s.saturn;
  if (!t || t.phase < SATURN.empowerFromPhase || e.id === t.bossId || e.icyShieldHP <= 0) return 1;
  return 1 + Math.min(1, e.icyShieldHP / SATURN.empowerFullIce) * (kind === 'speed' ? SATURN.empowerSpeed : SATURN.empowerDamage);
}
/** Ice you take for yourself: it shields you and is torn from her as well. */
function takeIce(s: GameState, boss: Enemy, amount: number, shieldShare: number) {
  const shield = Math.max(0, Math.min(amount * shieldShare, SATURN.shieldCap - s.playerShieldHP));
  s.playerShieldHP += shield; s.saturn!.playerIce += shield; s.playerSaturnShield = true;
  hurtBoss(s, boss, amount * SATURN.absorbShare);
}
/** Grants she will give next: hulks first (she favours them), then the aliens holding the least ice. */
function chooseGrantTargets(s: GameState, boss: Enemy) {
  const aliens = s.enemies.filter(e => e !== boss && e.hp > 0 && !e.twin?.downedTicks);
  aliens.sort((a, b) => Number(b.type === 'glacier_hulk') - Number(a.type === 'glacier_hulk') || a.icyShieldHP - b.icyShieldHP || a.id - b.id);
  return aliens.slice(0, SATURN.grantTargets).map(e => e.id);
}
const grantSize = (e?: Enemy) => SATURN.grantAmount * (e?.type === 'glacier_hulk' ? SATURN.hulkGrantMult : 1);

function showSaturnCounter(s: GameState, kind: 'grantCounter' | 'recallCounter') {
  s.saturn!.effects.push({ x: s.playerX, y: s.playerY, ticks: SATURN_COUNTER_FX_TICKS, kind });
  const grant = kind === 'grantCounter';
  s.screenShakeTicks = Math.max(s.screenShakeTicks, grant ? 8 : 12);
  s.screenShakeAmt = Math.max(s.screenShakeAmt, grant ? 2 : 4);
}

function resolveGrant(s: GameState, boss: Enemy) {
  const t = s.saturn!;
  let taken = false, caught = false;
  const targets = t.grantTargets.map(id => ({ id, e: s.enemies.find(x => x.id === id && x.hp > 0) }));
  for (const { id, e } of targets) {
    const amount = e ? grantSize(e) : SATURN.grantAmount * (t.grantHulks.includes(id) ? SATURN.hulkGrantMult : 1); // a dead Hulk's slot still holds double
    if (!e || inSaturnField(s, e.x, e.y)) {
      // A marked alien that died first, or a grant caught by C, comes to you instead.
      t.beams.push({ fromX: boss.x, fromY: boss.y, toX: s.playerX, toY: s.playerY, ticks: 24, kind: 'steal' });
      t.effects.push({ x: s.playerX, y: s.playerY, ticks: 24, kind: 'steal' });
      taken = true; caught ||= !!e;
      takeIce(s, boss, amount, e ? SATURN.fieldShieldShare : SATURN.killShieldShare);
      if (s.gamePhase !== 'playing') return;
      continue;
    }
    e.icyShieldHP += amount;
    t.beams.push({ fromX: boss.x, fromY: boss.y, toX: e.x, toY: e.y, ticks: 24, kind: 'grant' });
  }
  if (caught) { // a grant caught by C also strips every alien's frost shield inside the field (not taken)
    for (const e of s.enemies) if (e !== boss && e.icyShieldHP > 0 && inSaturnField(s, e.x, e.y)) {
      e.icyShieldHP = 0; t.effects.push({ x: e.x, y: e.y, ticks: 18, kind: 'shatter' });
    }
    counterBlast(s); if (s.gamePhase !== 'playing') return;
  }
  if (taken) {
    if (caught) showSaturnCounter(s, 'grantCounter');
    else t.effects.push({ x: s.playerX, y: s.playerY, ticks: 30, kind: 'intercept' });
    playAudioOneShot('/sounds/shield.mp3', .9);
  }
  if (targets.length) { boss.shootTicks = 20; playAudioOneShot('/sounds/ice.mp3', .55); }
  t.grantTargets = chooseGrantTargets(s, boss); // the next targets are marked at once, for the whole cycle
  if (t.grantTargets.length) playAudioOneShot('/sounds/constellation-choice.wav', .2, 1.6);
}

function resolveRecall(s: GameState, boss: Enemy) {
  const t = s.saturn!;
  let returned = 0, guarded = false, kept = 0, holders = 0;
  for (const e of s.enemies) {
    if (e === boss || e.hp <= 0 || e.icyShieldHP <= 0) continue;
    t.beams.push({ fromX: e.x, fromY: e.y, toX: boss.x, toY: boss.y, ticks: 24, kind: 'recall' });
    if (inSaturnField(s, e.x, e.y)) { // a countered recall strips aliens' frost shield inside the field (not taken)
      guarded = true; kept += e.icyShieldHP; e.icyShieldHP = 0; t.effects.push({ x: e.x, y: e.y, ticks: 18, kind: 'shatter' }); continue;
    }
    returned += e.icyShieldHP; e.icyShieldHP = 0; holders++;
  }
  t.playerIce = Math.min(t.playerIce, s.playerShieldHP);
  if (t.playerIce > 0) {
    t.beams.push({ fromX: s.playerX, fromY: s.playerY, toX: boss.x, toY: boss.y, ticks: 24, kind: 'recall' });
    if (inSaturnField(s, s.playerX, s.playerY)) { guarded = true; kept += t.playerIce; }
    else {
      returned += t.playerIce; s.playerShieldHP -= t.playerIce; t.playerIce = 0; holders++;
      if (s.playerShieldHP <= 0) s.playerSaturnShield = false;
    }
  }
  if (guarded) { counterBlast(s); if (s.gamePhase !== 'playing') return; }
  if (guarded) { showSaturnCounter(s, 'recallCounter'); playAudioOneShot('/sounds/shield.mp3', .9); healPlayer(s, kept * SATURN.counterHealShare); healCore(s, kept * SATURN.counterHealShare * (2 / 3)); }
  if (returned > 0) {
    boss.hp = Math.min((4 - t.phase) * SATURN.phaseHP, boss.hp + returned * (holders === 1 ? SATURN.loneRecallHealShare : SATURN.recallHealShare)); boss.healFlashTicks = 24;
    playAudioOneShot('/sounds/frost-shield-break.mp3', .3); // her ice returning, played softly
    return;
  }
  // Nothing came back: the recall tears at her instead.
  t.effects.push({ x: boss.x, y: boss.y, ticks: 36, kind: 'backlash' });
  t.backlash = { x: boss.x, y: boss.y, ticks: SATURN_BACKLASH_TICKS };
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 26); s.screenShakeAmt = Math.max(s.screenShakeAmt, 12);
  playSFX_objectBreak('frost'); playAudioOneShot('/sounds/saturn-barrier-break.mp3', .55);
  hurtBoss(s, boss, SATURN.phaseHP * SATURN.backlashShare);
}

/** C: stop time in a field around you. Time it as a grant or recall lands. */
export function useSaturnIntercept(s: GameState): boolean {
  const t = s.saturn;
  if (!t || s.gamePhase !== 'playing' || t.cooldown > 0) return false;
  s.playerFrozenTicks = 0; s.playerStunned = false;
  t.field = { x: s.playerX, y: s.playerY, ticks: SATURN.fieldTicks }; t.cooldown = SATURN.cooldown; t.castTicks = 30;
  stopTimeInField(s);
  playAudioOneShot('/sounds/absolute-zero-cast.mp3', .75, 1.4);
  return true;
}
/** Aliens inside the field are frozen in time (the Warden is not). */
export function saturnTimeStopped(s: GameState, e: Enemy) {
  return !!s.saturn?.field && e.id !== s.saturn.bossId && inSaturnField(s, e.x, e.y);
}
// Every enemy attack inside the field is cancelled: wind-ups, pounces (a leaper drops where it is) and incoming shells.
function stopTimeInField(s: GameState) {
  const t = s.saturn!;
  for (const e of s.enemies) {
    if (e.id === t.bossId || !inSaturnField(s, e.x, e.y)) continue;
    if (e.frostAct?.leaping) {
      const x = Math.floor(e.x / TILE_SIZE), y = Math.floor(e.y / TILE_SIZE);
      if (isFloorTile(s.map, x, y)) { e.tileX = e.targetTileX = x; e.tileY = e.targetTileY = y; }
      e.x = (e.tileX + .5) * TILE_SIZE; e.y = (e.tileY + .5) * TILE_SIZE; e.stepProgress = 0;
    }
    if (e.frostAct) { e.frostAct = undefined; e.attackTimer = Math.max(e.attackTimer, 60); t.effects.push({ x: e.x, y: e.y, ticks: 18, kind: 'fizzle' }); }
    if (e.windupTicks > 0 && !isSaturnAlien(e.type)) e.windupTicks = 0;
  }
  const kept = t.shells.filter(sh => !inSaturnField(s, (sh.x + .5) * TILE_SIZE, (sh.y + .5) * TILE_SIZE));
  for (const sh of t.shells) if (!kept.includes(sh)) t.effects.push({ x: (sh.x + .5) * TILE_SIZE, y: (sh.y + .5) * TILE_SIZE, ticks: 18, kind: 'fizzle' });
  t.shells = kept;
}

// ─── Frozen floor ────────────────────────────────────────────────────────────

/** Phase 2+: a departed footstep becomes short-lived ice after a warning. */
function updateFrostTrail(s: GameState) {
  const t=s.saturn!,last=t.lastTrailTile;
  t.lastTrailTile={x:s.playerTileX,y:s.playerTileY};
  if (t.phase < 2) { t.frostTrail = []; t.trailFades = []; return; }
  if (s.playerFrozenTicks > 0) { fadeFrostTrail(t); return; }
  t.frostTrail??=[];
  // Standing still creates nothing. Only completed adjacent steps leave footprints; teleport pads stay clear.
  if(last&&Math.abs(last.x-s.playerTileX)+Math.abs(last.y-s.playerTileY)===1
    &&!isPad(last.x,last.y)&&isFloorTile(s.map,last.x,last.y)) {
    const old=t.frostTrail.find(tile=>tile.x===last.x&&tile.y===last.y);
    t.frostTrail=t.frostTrail.filter(tile=>tile.x!==last.x||tile.y!==last.y);
    t.frostTrail.push({x:last.x,y:last.y,ticks:old?.ticks??SATURN.trailDelay});
    t.trailFades = (t.trailFades ?? []).filter(tile => tile.x !== last.x || tile.y !== last.y);
    if (t.frostTrail.length > SATURN.trailCap) {
      const oldest = t.frostTrail.shift()!;
      fadeFrostFootprint(t, oldest);
    }
  }
}

function chooseIce(s: GameState): [number, number][] {
  const pool: [number, number][] = [];
  for (let y = 1; y < MAP_ROWS - 1; y++) for (let x = 1; x < MAP_COLS - 1; x++) {
    if (!isFloorTile(s.map, x, y) || isPad(x, y) || Math.hypot(x - s.playerTileX, y - s.playerTileY) < 2 || (x === s.rubyTileX && y === s.rubyTileY)) continue;
    pool.push([x, y]);
  }
  const result: [number, number][] = [];
  const count = SATURN.iceCount[(s.saturn?.phase ?? 1) - 1]; // a little more frozen floor each phase
  while (result.length < count && pool.length) result.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return result;
}

export function updateSaturn(s: GameState) {
  const t = s.saturn;
  if (!t || s.gamePhase !== 'playing') return;
  if (t.cooldown > 0 && --t.cooldown === 0) playUiSfx('markReady');
  if (t.castTicks > 0) t.castTicks--;
  if (t.backlash && --t.backlash.ticks <= 0) t.backlash = null;
  t.effects = t.effects.filter(fx => --fx.ticks > 0);
  t.beams = t.beams.filter(b => --b.ticks > 0);
  if (t.field) { if (--t.field.ticks <= 0) t.field = null; else stopTimeInField(s); }
  t.temporaryIce = t.temporaryIce.filter(tile => --tile.ticks > 0);
  if (t.trailFades) t.trailFades = t.trailFades.filter(tile => --tile.ticks > 0);
  if (t.frostTrail) t.frostTrail = t.frostTrail.filter(tile => --tile.ticks > -SATURN.trailIceTicks);
  s.playerShieldHP = Math.min(s.playerShieldHP, SATURN.shieldCap); // Saturn Guard and every other source respect the cap
  t.playerIce = Math.min(t.playerIce, s.playerShieldHP);
  spawnSaturnAliens(s);
  updateShells(s); if (s.gamePhase !== 'playing') return;
  const frozenBefore = s.playerFrozenTicks > 0;
  if (s.playerFrozenTicks <= 0 && saturnIceAt(s, s.playerTileX, s.playerTileY)) freezeSaturnPlayer(s);
  const boss = saturnBoss(s);
  if (boss) {
    const phase = Math.min(3, 3 - Math.floor(Math.max(0, boss.hp - .001) / SATURN.phaseHP)) as 1 | 2 | 3;
    if (phase > t.phase) { t.phase = phase; t.bloomTimer = SATURN.bloomInterval; s.bossSpawnName = `FROST WARDEN · PHASE ${phase}`; s.bossSpawnTicks = 150; }
    updateFrostTrail(s);
    if (s.playerFrozenTicks <= 0 && saturnIceAt(s, s.playerTileX, s.playerTileY)) freezeSaturnPlayer(s);
    if (--boss.phaseTimer <= 0) relocateFrostWarden(s, boss);
    // Frozen floor.
    if (--t.iceTimer <= 0 && t.iceWarning <= 0) { t.nextIce = chooseIce(s); t.iceWarning = SATURN.iceWarning; t.iceTimer = SATURN.iceInterval[t.phase - 1]; }
    if (t.iceWarning > 0 && --t.iceWarning === 0) { s.frostIceTiles = t.nextIce; t.nextIce = []; }
    if (s.playerFrozenTicks <= 0 && s.frostIceTiles.some(([x, y]) => x === s.playerTileX && y === s.playerTileY)) freezeSaturnPlayer(s); // a triggered tile melts
    // Grants: targets stay marked through the cycle (a dead one keeps its slot: that ice comes to you); empty slots fill as aliens arrive.
    if (t.grantTargets.length < SATURN.grantTargets) for (const id of chooseGrantTargets(s, boss)) if (t.grantTargets.length < SATURN.grantTargets && !t.grantTargets.includes(id)) t.grantTargets.push(id);
    t.grantHulks = t.grantTargets.filter(id => t.grantHulks.includes(id) || s.enemies.some(e => e.id === id && e.type === 'glacier_hulk'));
    // Grant warning: a bright rising chime as the closing rings appear, 1.5s before the ice lands.
    if (--t.grantTimer === SATURN.grantWarning && t.grantTargets.length) playAudioOneShot('/sounds/saturn-warning.mp3', .6); // the supplied crystal-beat recording
    if (t.grantTimer <= 0) { t.grantTimer = SATURN.grantInterval; const from = t.beams.length; resolveGrant(s, boss); if (s.gamePhase !== 'playing') return; freezeLines(s, from); }
    if (t.phase >= SATURN.bloomFromPhase) {
      // Missing timers in older resumes start a fresh cycle.
      t.bloomTimer ??= SATURN.bloomInterval;
      if (--t.bloomTimer <= 0) { t.bloomTimer = SATURN.bloomInterval; frostBloom(s, boss); }
    }
    // Recall, with its own rising warning.
    if (--t.recallTimer === SATURN.recallWarning) playAudioOneShot('/sounds/saturn-warning.mp3', .6, 1.35); // the same recording, higher
    if (t.recallTimer <= 0) { t.recallTimer = SATURN.recallInterval; const from = t.beams.length; resolveRecall(s, boss); if (s.gamePhase !== 'playing') return; freezeLines(s, from); }
    // Constant blizzard on you only: hurts the unshielded, drains the shielded.
    if (++t.pulse >= SATURN.pulseTicks) {
      t.pulse = 0;
      const before = s.playerHP;
      damagePlayer(s, SATURN.blizzardDamage, undefined, true);
      if (s.playerHP < before) playAudioOneShot('/sounds/blizzard-damage.mp3', .65);
    }
  }
  if (!frozenBefore && s.playerFrozenTicks > 0) playAudioOneShot('/sounds/freeze.mp3', .55);
}

// ─── Her aliens ──────────────────────────────────────────────────────────────

function spawnSaturnAliens(s: GameState) {
  const t = s.saturn!;
  if (s.noMobs || --t.spawnTimer > 0) return;
  t.spawnTimer = SATURN.spawnInterval[t.phase - 1];
  if (s.enemies.length >= SATURN.population[t.phase - 1]) return;
  const room = Math.floor(Math.random() * 4), pool = CHAMBER_SPAWN_TILES[room];
  const options = pool.filter(([x, y]) => Math.hypot(x - s.playerTileX, y - s.playerTileY) > 4);
  const tile = options[Math.floor(Math.random() * options.length)];
  if (!tile) return;
  const count = (type: EnemyType) => s.enemies.filter(e => e.type === type).length, pick = Math.random();
  let type: EnemyType = pick < .3 ? 'frostbiter' : pick < .55 ? 'sleet_mortar' : pick < .7 ? 'glacier_hulk' : 'normal';
  if (type === 'sleet_mortar' && count(type) >= SATURN.mortar.maxAlive) type = 'frostbiter';
  if (type === 'glacier_hulk' && count(type) >= SATURN.hulk.maxAlive) type = 'normal';
  if(type==='normal'){const pool=spawnPool(s,DIFFICULTY_TIERS[Math.min(s.difficultyLevel,DIFFICULTY_TIERS.length-1)].spawnTypes);type=pool[Math.floor(Math.random()*pool.length)];} // Normal slots use the same timed pool as the other maps
  const enemy = createEncounterEnemy(s, type, tile[0], tile[1], ENEMY_CONFIGS[type].maxHp);
  enemy.attackTimer = 90;
  s.enemies.push(enemy);
}

// Player, or a placed Ruby that is more than two tiles closer.
function saturnTarget(s: GameState, e: Enemy) {
  const rx = (s.rubyTileX + .5) * TILE_SIZE, ry = (s.rubyTileY + .5) * TILE_SIZE;
  const ruby = s.rubyTileX >= 0 && !s.playerCarryingRuby && !s.enemyDecoyActive && Math.hypot(e.x - s.playerX, e.y - s.playerY) > Math.hypot(e.x - rx, e.y - ry) + 2 * TILE_SIZE;
  e.targeting = ruby ? 'ruby' : 'player';
  return ruby ? { x: rx, y: ry, tx: s.rubyTileX, ty: s.rubyTileY } : { x: s.playerX, y: s.playerY, tx: s.playerTileX, ty: s.playerTileY };
}
const hitsYou = (s: GameState, x: number, y: number, r: number) => Math.hypot(s.playerX - x, s.playerY - y) <= r * TILE_SIZE;
const hitsRuby = (s: GameState, x: number, y: number, r: number) => s.rubyTileX >= 0 && !s.playerCarryingRuby && Math.hypot((s.rubyTileX + .5) * TILE_SIZE - x, (s.rubyTileY + .5) * TILE_SIZE - y) <= r * TILE_SIZE;

/** A shove from Wave or bomb cancels a crouch or a wind-up (not a leap already in the air). */
export function interruptSaturnAlien(e: Enemy) {
  if (e.frostAct && !e.frostAct.leaping) { e.frostAct = undefined; e.attackTimer = Math.max(e.attackTimer, 60); }
}

export function updateSaturnAlien(s: GameState, e: Enemy) {
  if (e.attackTimer > 0) e.attackTimer--;
  if (e.type === 'frostbiter') updateFrostbiter(s, e);
  else if (e.type === 'sleet_mortar') updateMortar(s, e);
  else updateHulk(s, e);
}

// Frostbiter: crouches (its landing tile is marked), then pounces onto where you stood, knocking you back. Sidestep it.
function updateFrostbiter(s: GameState, e: Enemy) {
  const c = SATURN.frostbiter, act = e.frostAct;
  if (act) {
    if (!act.leaping) { if (--act.ticks <= 0) { act.leaping = true; act.ticks = c.leapTicks; playAudioOneShot('/sounds/slash.mp3', .5, 1.3); } return; }
    const p = 1 - --act.ticks / c.leapTicks, tx = (act.tx + .5) * TILE_SIZE, ty = (act.ty + .5) * TILE_SIZE;
    e.x = act.fromX + (tx - act.fromX) * p; e.y = act.fromY + (ty - act.fromY) * p;
    if (act.ticks > 0) return;
    e.tileX = e.targetTileX = act.tx; e.tileY = e.targetTileY = act.ty; e.stepProgress = 0; e.x = tx; e.y = ty; e.path = [];
    e.frostAct = undefined; e.attackTimer = c.cooldown; e.shootTicks = 18;
    s.saturn!.effects.push({ x: tx, y: ty, ticks: 20, kind: 'pounce' });
    playAudioOneShot('/sounds/snowball-hit.mp3', .55, 1.1);
    if (hitsYou(s, tx, ty, c.hitRadius)) {
      s.playerShieldHP = 0; s.playerSaturnShield = false; s.saturn!.playerIce = 0;
      damagePlayer(s, c.damage, e);
      if (s.gamePhase === 'playing') shovePlayerFromEnemy(s, e, c.push);
    }
    if (s.gamePhase === 'playing' && hitsRuby(s, tx, ty, c.hitRadius)) damageRuby(s, c.rubyDamage, e);
    return;
  }
  const target = saturnTarget(s, e), d = Math.hypot(target.x - e.x, target.y - e.y) / TILE_SIZE;
  if (e.attackTimer <= 0 && d <= c.range && e.stepProgress === 0 && isFloorTile(s.map, target.tx, target.ty)) {
    e.frostAct = { kind: 'pounce', ticks: c.crouch, tx: target.tx, ty: target.ty, fromX: e.x, fromY: e.y };
    playAudioOneShot('/sounds/hitHurt.wav', .25, .6); // a low growl as it crouches
    return;
  }
  walkPath(s, e, target.tx, target.ty, c.speed);
}

// Hailer: keeps its distance and lobs three shells over cover at your tile and either side of it. Each
// landing hurts and freezes that tile for a while.
function updateMortar(s: GameState, e: Enemy) {
  const c = SATURN.mortar, target = saturnTarget(s, e), d = Math.hypot(target.x - e.x, target.y - e.y) / TILE_SIZE;
  if (e.attackTimer <= 0 && d <= c.range) {
    e.attackTimer = c.interval; e.shootTicks = 30;
    const horizontal = Math.abs(target.x - e.x) >= Math.abs(target.y - e.y); // spread across the line of fire
    for (const k of [-c.spread, 0, c.spread]) {
      const x = target.tx + (horizontal ? 0 : k), y = target.ty + (horizontal ? k : 0);
      if (isFloorTile(s.map, x, y) && !inSaturnField(s, (x + .5) * TILE_SIZE, (y + .5) * TILE_SIZE)) s.saturn!.shells.push({ x, y, ticks: c.warning });
    }
    playAudioOneShot('/sounds/place_bomb.wav', .3, .8); playAudioOneShot('/sounds/falling-thing.wav', .25, 1.2);
    return;
  }
  // It chases you, holding one tile short of Absolute Zero's reach (so a cast right beside you still catches it).
  if (d > SATURN.fieldRadius - 1) walkPath(s, e, target.tx, target.ty, c.speed);
  else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) stepEnemy(s, e, c.speed); // finish the step it is on, then stop
}
function updateShells(s: GameState) {
  const t = s.saturn!, c = SATURN.mortar;
  let landed = false;
  for (const shell of t.shells) {
    if (--shell.ticks > 0) continue;
    landed = true;
    const x = (shell.x + .5) * TILE_SIZE, y = (shell.y + .5) * TILE_SIZE;
    t.effects.push({ x, y, ticks: 20, kind: 'shell' });
    freezeTile(s, shell.x, shell.y, c.iceTicks);
    if (hitsYou(s, x, y, .7)) damagePlayer(s, c.damage);
    if (s.gamePhase !== 'playing') return;
    if (hitsRuby(s, x, y, .7)) damageRuby(s, c.rubyDamage);
    if (s.gamePhase !== 'playing') return;
  }
  if (landed) playSFX_objectBreak('frost');
  t.shells = t.shells.filter(sh => sh.ticks > 0);
}

// Glacier Hulk: tough, and the Warden's favourite (double ice). Up close it raises its fists, then slams the 5×5 area
// around it: a big hit and a shove. The floor around it freezes; if the slam missed you, that ice melts quickly.
function updateHulk(s: GameState, e: Enemy) {
  const c = SATURN.hulk, act = e.frostAct;
  if (act) {
    if (act.ticks === c.windup) playAudioOneShot('/sounds/charging.wav', .3, .6);
    if (--act.ticks > 0) return;
    e.frostAct = undefined; e.attackTimer = c.cooldown; e.shootTicks = 24;
    s.saturn!.effects.push({ x: e.x, y: e.y, ticks: 24, kind: 'slam' });
    s.screenShakeTicks = Math.max(s.screenShakeTicks, 12); s.screenShakeAmt = Math.max(s.screenShakeAmt, 6);
    playSFX_objectBreak('frost'); playAudioOneShot('/sounds/bombExplode.wav', .4, .7);
    const inside = (x: number, y: number) => Math.max(Math.abs(x - e.tileX), Math.abs(y - e.tileY)) <= c.reach;
    const hit = inside(s.playerTileX, s.playerTileY);
    if (hit) { damagePlayer(s, c.damage, e); if (s.gamePhase === 'playing') shovePlayerFromEnemy(s, e, c.push); }
    if (s.gamePhase === 'playing' && s.rubyTileX >= 0 && !s.playerCarryingRuby && inside(s.rubyTileX, s.rubyTileY)) damageRuby(s, c.rubyDamage, e);
    for (let dy = -c.reach; dy <= c.reach; dy++) for (let dx = -c.reach; dx <= c.reach; dx++) {
      const x = e.tileX + dx, y = e.tileY + dy;
      if ((dx || dy) && (x !== s.playerTileX || y !== s.playerTileY)) freezeTile(s, x, y, hit ? c.iceTicks : c.missIceTicks);
    }
    return;
  }
  const target = saturnTarget(s, e);
  if (e.attackTimer <= 0 && e.stepProgress === 0 && Math.max(Math.abs(target.tx - e.tileX), Math.abs(target.ty - e.tileY)) <= c.reach) {
    e.frostAct = { kind: 'slam', ticks: c.windup, tx: e.tileX, ty: e.tileY, fromX: e.x, fromY: e.y };
    return;
  }
  walkPath(s, e, target.tx, target.ty, c.speed);
}

// ─── God controls ────────────────────────────────────────────────────────────

export function godSetSaturnPhase(s: GameState, phase: 1 | 2 | 3) {
  godPhaseClock(s, phase); // phase 2+ starts at least a minute in
  if (!s.saturn) return;
  if (!saturnBoss(s)) godSpawnBoss(s, 'frost_warden');
  const boss = saturnBoss(s); if (!boss) return;
  clearSaturnEncounter(s);
  boss.hp = SATURN.phaseHP * (4 - phase); s.saturn.phase = phase;
  s.saturn.grantTimer = SATURN.grantInterval; s.saturn.grantTargets = chooseGrantTargets(s, boss); s.saturn.recallTimer = SATURN.recallInterval + SATURN.recallOffset; s.saturn.iceTimer = 0;
}
export function godSaturnGrant(s: GameState) { const t = s.saturn; if (t && saturnBoss(s)) t.grantTimer = Math.min(t.grantTimer, 60); }
export function godSaturnRecall(s: GameState) { const t = s.saturn; if (t && saturnBoss(s)) t.recallTimer = Math.min(t.recallTimer, SATURN.recallWarning + 1); }
