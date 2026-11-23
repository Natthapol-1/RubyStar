import { playUiSfx } from './ui-sfx';
import { prepareSiriusSwapBell, playSiriusSwapBell } from './sirius-swap-audio';
import { CHAMBER_SPAWN_TILES, DIFFICULTY_TIERS, ENEMY_CONFIGS, MAP_COLS, MAP_ROWS, SIRIUS_HOLY_PER_ENERGY, TELEPORT_PADS, TILE_SIZE, T_FLOOR, T_WALL, chamberOfTile, type EnemyType } from './constants';
import { addStarEnergy } from './blessing-effects';
import { godPhaseClock, ALIEN_ATTACK_SFX, playSFX_alienShoot, playSFX_chargerImpact, healCore, spawnPool, createEncounterEnemy, godSpawnBoss, damageEnemy, damagePlayer, damageRuby, healPlayer, isFloorTile, killEnemy, playAudioOneShot, shovePlayerFromEnemy, type Enemy, type GameState } from './engine';
import { stepEnemy, walkPath } from './aliens';
import { gameAudio } from './audio-settings';
import { playStrikeCharged } from './gaia';

// Sirius challenge: the Blind Prayer does not fight. The sanctuary swaps between light (normal controls) and dark
// (reversed controls). The Prayer keeps casting runes that you must trace with one continuous walk; a traced rune
// burns him and heals you, a missed one empowers every alien for a while. When he moves Ruby, you may guess where.
export const SIRIUS = {
  phaseHP: 1200,          // three identical phases
  directDamage: .05,      // he takes only 5% of your attacks: runes and Holy Light are how you hurt him
  meteorShare: .1,        // a meteor takes 10% of a phase (120), like the other maps
  lightTicks: 1080,       // 18s of light (normal controls)
  darkTicks: 720,         // 12s of dark (reversed controls)
  swapWarning: 120,       // 2s warning before each swap
  laterLightTicks: 960, laterDarkTicks: 600, // phases 2–3: 16s light, 10s dark
  firstRune: 360,         // the first rune 6s after he arrives
  runeGap: 420,           // 7s between one rune ending and the next cast
  runeCast: 60,           // 1s cast before tracing starts
  runeTicks: 1200,        // 20s to trace it
  phase3RuneBonus: 300,   // phase 3: 5 extra seconds to include a seal
  runeDamage: 60,         // a traced rune burns 5% of a phase: runes also build Holy Light for the Halo burst
  runeHeal: 45,
  runeFailHeal: 60,      // 5% of a phase, without undoing phase progress
  holyFailLoss: 20,       // a missed rune drains all your energy and this much Holy Light
  haloTicks: 360,         // C: Halo lets you float for 6s: walk over walls, 40% faster
  haloCooldown: 900,      // 15s from cast
  haloSpeed: 1.4,
  haloWaveRadius: 6, haloWavePush: 5, haloWaveTicks: 30, haloWaveStun: 18,
  burstBoss: 240,         // Halo cast with full Holy Light: 20% of a phase to the Prayer
  burstAlien: 90,         // and this much to every other enemy
  alienHpMult: 2.5,
  alienSpeed: 1.25,       // every alien moves 25% faster here (wrath stacks on top)       // energy comes often here, so his aliens are much tougher
  wrathTicks: 600,        // a missed rune empowers aliens for 10s
  wrathDamage: 1.6, wrathSpeed: 1.35,
  trailMax: 30,           // tiles of trail kept
  sealsPerChamber: 8,     // phase 3: include any one Sanctuary Seal in the rune shape
  ritualCooldown: 1500,   // 25s between Ruby rituals, only while a rune is being traced
  ritualWindup: 60,       // after your guess (time stops while you choose), Ruby moves 1s later
  ritualMinLeft: 360,     // only starts with at least 6s left on the rune
  guessBonus: 300,        // a correct guess adds 5s to the rune
  guessPenalty: 120,      // a wrong guess takes only 2s off
  spawnInterval: 120, population: 14,
  laterPhaseMore: 1.1,    // phase 2+: 10% more aliens (cap and spawn rate)
  zealot: { range: 5, windup: 36, dashTiles: 6, dashTicks: 14, damage: 12, damageRuby: 9, push: 3, cooldown: 150, hitRadius: .75, speed: 1.9 },
  bellringer: { keep: 4, radius: 3.5, windup: 45, damage: 8, damageRuby: 6, push: 2, cooldown: 240, speed: 1.1 },
  penitent: { fromPhase: 3, maxAlive: 2, chance: .25, speed: 1.75, reach: .6 },
  mason: { fromPhase: 2, maxAlive: 3, spawnInterval: 360, keep: 5, range: 10, windup: 30, ahead: 2, length: 4, wallTicks: 300, cooldown: 240, speed: 1 },
} as const;

/** The full Holy Light burst plays over 2 seconds. */
export const SIRIUS_BURST_TICKS = 120;
export const SIRIUS_ALIENS: EnemyType[] = ['zealot', 'bellringer', 'mason', 'penitent'];
export const isSiriusAlien = (type: EnemyType) => SIRIUS_ALIENS.includes(type);

/** Directions on the grid: right, down, left, up. */
export type RuneDir = 0 | 1 | 2 | 3;
export const RUNE_STEP: readonly [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
export interface Rune { name: string; tier: 1 | 2 | 3; strokes: readonly (readonly [RuneDir, number])[] }
/** Every rune is one continuous walk; the centerline shows its route even where separate strokes touch. */
// Tier 1 runes have three strokes, tier 2 four, tier 3 five or six. Phase 1 draws tier 1, phase 2 tiers 1–2, phase 3
// tiers 2–3 (`runeTiers`).
export const RUNES: readonly Rune[] = [
  { name: 'HOOK', tier: 1, strokes: [[0, 3], [1, 2], [2, 1]] },
  { name: 'STAIR', tier: 1, strokes: [[0, 2], [1, 2], [0, 2]] },
  { name: 'CROWN', tier: 1, strokes: [[3, 2], [0, 2], [1, 2]] },
  { name: 'CUP', tier: 1, strokes: [[1, 2], [0, 3], [3, 2]] },
  { name: 'BOLT', tier: 1, strokes: [[1, 2], [0, 2], [1, 2]] },
  { name: 'SPIRAL', tier: 2, strokes: [[0, 3], [1, 3], [2, 2], [3, 1]] },
  { name: 'WAVE', tier: 2, strokes: [[0, 2], [3, 2], [0, 2], [1, 2]] },
  { name: 'KEY', tier: 2, strokes: [[0, 3], [1, 1], [2, 1], [1, 2]] },
  { name: 'SERPENT', tier: 3, strokes: [[0, 2], [1, 2], [2, 2], [1, 2], [0, 2]] },
  { name: 'TOWER', tier: 3, strokes: [[3, 3], [0, 2], [1, 1], [0, 2], [1, 2]] },
  { name: 'LADDER', tier: 3, strokes: [[0, 1], [1, 1], [0, 1], [1, 1], [0, 1], [1, 1]] },
  { name: 'CRESCENT', tier: 1, strokes: [[0, 2], [3, 3], [2, 2]] },
  { name: 'FANG', tier: 1, strokes: [[1, 3], [0, 1], [3, 2]] },
  { name: 'CREST', tier: 1, strokes: [[0, 2], [3, 2], [0, 3]] },
  { name: 'CROOK', tier: 1, strokes: [[3, 3], [0, 2], [3, 1]] },
  { name: 'FORK', tier: 2, strokes: [[3, 2], [0, 3], [1, 3], [0, 2]] },
  { name: 'RIBBON', tier: 2, strokes: [[0, 2], [1, 2], [0, 2], [1, 2]] },
  { name: 'GATE', tier: 2, strokes: [[1, 3], [0, 3], [3, 2], [2, 1]] },
  { name: 'BEAK', tier: 2, strokes: [[0, 3], [3, 2], [2, 1], [3, 2]] },
  { name: 'COIL', tier: 3, strokes: [[0, 4], [1, 3], [2, 3], [3, 2], [0, 2]] },
  { name: 'SPIRE', tier: 3, strokes: [[3, 2], [0, 2], [3, 2], [0, 2], [1, 3]] },
  { name: 'RIVER', tier: 3, strokes: [[0, 2], [1, 2], [0, 2], [3, 3], [0, 2], [1, 2]] },
  { name: 'RELIC', tier: 3, strokes: [[3, 3], [0, 3], [1, 2], [2, 2], [1, 2], [0, 3]] },
];
export const runeTiers = (phase: number): readonly number[] => phase >= 3 ? [2, 3] : phase === 2 ? [1, 2] : [1];

export interface SiriusState {
  phase: 1 | 2 | 3; bossId: number; spawnTimer: number; masonSpawnTimer?: number;
  light: boolean; lightTimer: number;                 // current state and ticks until it swaps
  rune: { index: number; cast: number; ticks: number; total: number } | null; runeTimer: number;
  trail: { x: number; y: number }[];                  // the tiles you walked, oldest first, in one unbroken line
  steps: RuneDir[];                                   // the direction of each step along the trail
  lastTile: [number, number];
  sanctuarySeals?: { x: number; y: number }[]; // optional for older saves; refreshed at each rune cast
  wrath: number;                                      // ticks left of empowered aliens
  ritual: { destination: number; ticks: number; guess: number } | null; ritualCooldown: number;
  flashes: { kind: 'success' | 'fail' | 'guessRight' | 'guessWrong' | 'swap'; ticks: number }[];
  bolts: { x: number; y: number; ticks: number; big?: boolean }[]; // rune strikes; burst pillars are big
  rings: { x: number; y: number; ticks: number; radius: number }[]; // Bellringer pulses
  burstAt: { x: number; y: number };                  // where the Holy Light burst was released
  walls: { x: number; y: number; ticks: number }[];   // Mason walls: floor tiles turned to wall for a while
  lastRune: number;                                   // so the next rune differs
  eaten: { x: number; y: number; ticks: number }[];   // Penitent erasing your trail, for its effect
  holy: number;                                       // Holy Light, 0–100
  halo: number; haloCooldown: number;                 // C: ticks left floating, and until it is ready again
  haloWave?: { x: number; y: number; ticks: number }; // one pulse from the cast position; optional for older saves
  burst: number;                                      // ticks left of the Holy Light burst effect
  traced: number;                                     // rune tiles matched so far, for the step chime
  wasFull: boolean;                                   // Holy Light was already full last tick
}

export function createSiriusState(s: GameState) {
  stopSiriusFloatSound();
  // It opens in the dark (reversed controls).
  s.sirius = { phase: 1, bossId: -1, spawnTimer: 120, light: false, lightTimer: SIRIUS.darkTicks, rune: null, runeTimer: SIRIUS.firstRune,
    trail: [{ x: s.playerTileX, y: s.playerTileY }], steps: [], lastTile: [s.playerTileX, s.playerTileY], wrath: 0,
    ritual: null, ritualCooldown: SIRIUS.ritualCooldown / 2, flashes: [], bolts: [], rings: [], holy: 0, halo: 0, haloCooldown: 0, burst: 0, traced: 0, wasFull: false, burstAt: { x: 0, y: 0 }, walls: [], lastRune: -1, eaten: [], sanctuarySeals: [] };
  if (s.trial) { s.trial.siriusLight = false; s.trial.siriusLightBlend = 0; }
  void prepareSiriusSwapBell();
}
export function siriusBoss(s: GameState) { return s.enemies.find(e => e.id === s.sirius?.bossId && e.hp > 0); }
export function initializeSiriusBoss(s: GameState, boss: Enemy) {
  const t = s.sirius!;
  t.bossId = boss.id; t.phase = 1; t.runeTimer = SIRIUS.firstRune; t.rune = null; t.wrath = 0; t.ritual = null;
  boss.hp = boss.maxHp = SIRIUS.phaseHP * 3; boss.pushTiles = 0;
}
export function clearSiriusEncounter(s: GameState) {
  if (!s.sirius) return;
  clearSiriusWalls(s);
  Object.assign(s.sirius, { rune: null, ritual: null, wrath: 0, flashes: [], bolts: [], rings: [], halo: 0, haloWave: undefined, burst: 0, sanctuarySeals: [] });
  stopSiriusFloatSound();
}

/** Dark reverses your movement; the Prayer himself no longer does. */
export const siriusReversed = (s: GameState) => !!s.sirius && !s.sirius.light;
export function siriusDamageTaken(s: GameState, e: Enemy, source: string) {
  return s.sirius?.bossId === e.id && (source === 'player' || source === 'special') ? SIRIUS.directDamage : 1;
}
export function siriusEmpower(s: GameState, e: Enemy, kind: 'speed' | 'damage') {
  const t = s.sirius;
  if (!t || e.id === t.bossId) return 1;
  const wrath = t.wrath > 0 ? (kind === 'speed' ? SIRIUS.wrathSpeed : SIRIUS.wrathDamage) : 1;
  return kind === 'speed' ? SIRIUS.alienSpeed * wrath : wrath; // his aliens are always quicker here
}

// ─── The trail and rune matching ─────────────────────────────────────────────

function resetTrail(t: SiriusState, x: number, y: number) { t.trail = [{ x, y }]; t.steps = []; }

/** Runs of steps in one direction, oldest first: [direction, length]. */
export function trailRuns(steps: readonly RuneDir[]): [RuneDir, number][] {
  const runs: [RuneDir, number][] = [];
  for (const d of steps) { const last = runs[runs.length - 1]; if (last && last[0] === d) last[1]++; else runs.push([d, 1]); }
  return runs;
}

/**
 * How far the end of your trail matches the rune: the number of its tiles traced so far, and whether it is complete.
 * The first stroke may be longer than drawn (you can walk in from that direction); every later stroke must match
 * exactly, and the stroke you are on may be partly done.
 */
export function runeProgress(steps: readonly RuneDir[], rune: Rune): { tiles: number; complete: boolean } {
  const runs = trailRuns(steps), strokes = rune.strokes, total = strokes.reduce((n, [, len]) => n + len, 0);
  for (let k = Math.min(strokes.length, runs.length); k >= 1; k--) {
    const tail = runs.slice(runs.length - k);
    let tiles = 0, ok = true;
    for (let i = 0; i < k && ok; i++) {
      const [dir, len] = tail[i], [want, need] = strokes[i], last = i === k - 1;
      if (dir !== want) { ok = false; break; }
      if (last) { if (len > need && !(i === 0 && k === 1)) ok = false; else tiles += Math.min(len, need); }
      else if (i === 0 ? len < need : len !== need) ok = false;
      else tiles += need;
    }
    if (!ok) continue;
    return { tiles, complete: k === strokes.length && tiles === total };
  }
  return { tiles: 0, complete: false };
}

/** Follows your walk: one step adds to the trail; a shove, a teleport or any jump breaks it and starts a new one. */
function trackTrail(s: GameState) {
  const t = s.sirius!, [lx, ly] = t.lastTile, x = s.playerTileX, y = s.playerTileY;
  if (x === lx && y === ly) return;
  t.lastTile = [x, y];
  const dx = x - lx, dy = y - ly, dir = RUNE_STEP.findIndex(([sx, sy]) => sx === dx && sy === dy);
  if (dir < 0 || s.playerKnockback) { resetTrail(t, x, y); return; }
  t.trail.push({ x, y }); t.steps.push(dir as RuneDir);
  if (t.steps.length > SIRIUS.trailMax) { t.steps.shift(); t.trail.shift(); }
}

// ─── Light and dark ──────────────────────────────────────────────────────────

export const siriusLightDuration = (t: Pick<SiriusState, 'light' | 'phase'>) => {
  return t.phase >= 2 ? (t.light ? SIRIUS.laterLightTicks : SIRIUS.laterDarkTicks) : (t.light ? SIRIUS.lightTicks : SIRIUS.darkTicks);
};

function updateLight(s: GameState) {
  const t = s.sirius!;
  t.lightTimer = Math.min(t.lightTimer, siriusLightDuration(t)); // includes older saves with a longer timer
  if (--t.lightTimer === SIRIUS.swapWarning) playSiriusSwapBell();
  if (t.lightTimer > 0) return;
  swapLight(s);
}

function swapLight(s: GameState) {
  const t = s.sirius!;
  t.light = !t.light; t.lightTimer = siriusLightDuration(t);
  if (s.trial) s.trial.siriusLight = t.light;
  t.flashes.push({ kind: 'swap', ticks: 40 });
  playAudioOneShot('/sounds/sirius-heal.mp3', .7, t.light ? 1 : .75); // the holy chime, pitched lower as the dark falls
}

// ─── Runes ───────────────────────────────────────────────────────────────────

/** Only the matched rune suffix counts, including its start and end tiles, never an unrelated approach. */
export function sanctuarySealInRune(t: Readonly<SiriusState>) {
  if (!t.rune || t.rune.cast > 0) return false;
  const matched = runeProgress(t.steps, RUNES[t.rune.index]).tiles;
  if (matched <= 0) return false;
  const shape = t.trail.slice(-(matched + 1));
  return !!t.sanctuarySeals?.some(seal => shape.some(p => p.x === seal.x && p.y === seal.y));
}

function placeSanctuarySeals(s: GameState) {
  const t = s.sirius!;
  if (t.phase < 3 || !t.rune) { t.sanctuarySeals = []; return; }
  const previous = t.sanctuarySeals ?? [], chosen: { x: number; y: number }[] = [];
  // Each candidate is the start of a complete, unobstructed copy of this rune.
  const footprint: [number, number][] = [[0, 0]];
  let dx = 0, dy = 0;
  for (const [dir, count] of RUNES[t.rune.index].strokes) for (let i = 0; i < count; i++) {
    dx += RUNE_STEP[dir][0]; dy += RUNE_STEP[dir][1]; footprint.push([dx, dy]);
  }
  const floors: { x: number; y: number }[] = [];
  for (let y = 1; y < MAP_ROWS - 1; y++) for (let x = 1; x < MAP_COLS - 1; x++) if (isFloorTile(s.map, x, y)) floors.push({ x, y });
  // Halo may currently put the player on a wall; use its nearest floor as the flood-fill seed.
  const seed = floors.reduce((best, p) => Math.hypot(p.x - s.playerTileX, p.y - s.playerTileY) < Math.hypot(best.x - s.playerTileX, best.y - s.playerTileY) ? p : best, floors[0]);
  const reachable = new Set<string>(), queue = seed ? [seed] : [];
  if (seed) reachable.add(`${seed.x},${seed.y}`);
  for (let i = 0; i < queue.length; i++) for (const [mx, my] of RUNE_STEP) {
    const x = queue[i].x + mx, y = queue[i].y + my, key = `${x},${y}`;
    if (!reachable.has(key) && isFloorTile(s.map, x, y)) { reachable.add(key); queue.push({ x, y }); }
  }
  for (let chamber = 0; chamber < 4; chamber++) {
    const candidates = floors.filter(p => chamberOfTile(p.x, p.y) === chamber && reachable.has(`${p.x},${p.y}`)
      && !TELEPORT_PADS.some(([x, y]) => x === p.x && y === p.y) && !(s.rubyTileX === p.x && s.rubyTileY === p.y)
      && footprint.every(([x, y]) => isFloorTile(s.map, p.x + x, p.y + y)));
    for (let i = 0; i < SIRIUS.sealsPerChamber && candidates.length; i++) {
      const fresh = candidates.filter(p => !previous.some(q => p.x === q.x && p.y === q.y));
      const pool = fresh.length ? fresh : candidates;
      const spaced = pool.filter(p => chosen.every(q => Math.hypot(p.x - q.x, p.y - q.y) >= 4));
      const available = spaced.length ? spaced : pool;
      const seal = available[Math.floor(Math.random() * available.length)]; chosen.push(seal);
      candidates.splice(candidates.indexOf(seal), 1);
    }
  }
  t.sanctuarySeals = chosen;
}

function castRune(s: GameState) {
  const t = s.sirius!, previous = t.rune?.index ?? t.lastRune;
  const tiers = runeTiers(t.phase), pool = RUNES.map((r, i) => i).filter(i => tiers.includes(RUNES[i].tier) && i !== previous);
  const index = pool[Math.floor(Math.random() * pool.length)];
  t.lastRune = index;
  const time = SIRIUS.runeTicks + (t.phase >= 3 ? SIRIUS.phase3RuneBonus : 0);
  t.rune = { index, cast: SIRIUS.runeCast, ticks: time, total: time };
  placeSanctuarySeals(s);
  playAudioOneShot('/sounds/sirius-rune-cast.mp3', 1.5); // boosted: the cast must be heard over combat
}

function resolveRune(s: GameState, success: boolean) {
  const t = s.sirius!, boss = siriusBoss(s);
  t.rune = null; t.runeTimer = SIRIUS.runeGap; t.ritual = null; t.traced = 0;
  resetTrail(t, s.playerTileX, s.playerTileY);
  if (success) {
    t.flashes.push({ kind: 'success', ticks: 50 });
    playAudioOneShot('/sounds/sirius-rune-seal.mp3', 2.2); playAudioOneShot('/sounds/holy2.mp3', .6, 1.1); // boosted so a success always lands
    healPlayer(s, SIRIUS.runeHeal); healCore(s, SIRIUS.runeHeal); // you and Ruby both heal
    const holy = t.holy;
    addStarEnergy(s, 100, false); // full energy
    t.holy = Math.min(100, holy + 100 * SIRIUS_HOLY_PER_ENERGY); // counted as exactly one full bar of energy, however full you were
    if (boss) {
      t.bolts.push({ x: boss.x, y: boss.y, ticks: 36 });
      damageEnemy(s, boss, SIRIUS.runeDamage, 'enemy'); // his own rune burns him: not reduced like your attacks
      if (boss.hp <= 0) { const i = s.enemies.indexOf(boss); if (i >= 0) killEnemy(s, i); }
    }
  } else {
    if (boss) {
      const healed = Math.min(boss.maxHp, SIRIUS.phaseHP * (4 - t.phase), boss.hp + SIRIUS.runeFailHeal);
      if (healed > boss.hp) { boss.hp = healed; boss.healFlashTicks = 24; }
    }
    t.wrath = SIRIUS.wrathTicks; t.flashes.push({ kind: 'fail', ticks: 50 });
    s.starEnergy = 0; t.holy = Math.max(0, t.holy - SIRIUS.holyFailLoss);
    playAudioOneShot('/sounds/dusk-attack.mp3', .55, .8); playAudioOneShot('/sounds/holy2.mp3', .8, .6); // a deep, broken holy chord
  }
}

function updateRune(s: GameState) {
  const t = s.sirius!;
  if (t.phase >= 3 && t.rune && !t.sanctuarySeals?.length) placeSanctuarySeals(s);
  if (!t.rune) { if (--t.runeTimer <= 0) castRune(s); return; }
  if (t.rune.cast > 0) { if (--t.rune.cast === 0) resetTrail(t, s.playerTileX, s.playerTileY); return; } // tracing starts fresh once the cast ends
  const rune = RUNES[t.rune.index], progress = runeProgress(t.steps, rune);
  if (progress.tiles > t.traced) { // each correct step chimes, rising in pitch toward the end of the rune
    const total = rune.strokes.reduce((n, [, len]) => n + len, 0);
    playAudioOneShot('/sounds/celestial/skill-ready.wav', .55, .8 + .8 * progress.tiles / total);
  }
  t.traced = progress.tiles;
  if (progress.complete && (t.phase < 3 || sanctuarySealInRune(t))) { resolveRune(s, true); return; }
  if (--t.rune.ticks <= 0) resolveRune(s, false);
}

// ─── Ruby ritual and guessing ────────────────────────────────────────────────

function updateRitual(s: GameState) {
  const t = s.sirius!;
  if (t.ritualCooldown > 0) t.ritualCooldown--;
  if (!t.ritual) {
    if (t.ritualCooldown > 0 || !t.rune || t.rune.cast > 0 || t.rune.ticks < SIRIUS.ritualMinLeft || s.rubyTileX < 0 || s.playerCarryingRuby) return;
    const current = chamberOfTile(s.rubyTileX, s.rubyTileY), options = [0, 1, 2, 3].filter(ch => ch !== current && ch !== s.meteoriteWarning);
    if (!options.length) return;
    t.ritual = { destination: options[Math.floor(Math.random() * options.length)], ticks: SIRIUS.ritualWindup, guess: -1 };
    t.ritualCooldown = SIRIUS.ritualCooldown;
    playAudioOneShot('/sounds/holy1.mp3', .8);
    s.gamePhase = 'laserTarget'; s.playerQueuedDirX = s.playerQueuedDirY = 0; // time stops while you pick a chamber, like the teleport menu
    return;
  }
  if (s.rubyTileX < 0 || s.playerCarryingRuby) { t.ritual = null; return; } // picking Ruby up cancels it
  if (--t.ritual.ticks > 0) return;
  const { destination, guess } = t.ritual; t.ritual = null;
  [s.rubyTileX, s.rubyTileY] = TELEPORT_PADS[destination];
  playAudioOneShot('/sounds/gameModeClick.mp3', .7);
  if (guess < 0 || !t.rune) return; // skipped
  const right = guess === destination;
  t.rune.ticks = Math.max(1, Math.min(t.rune.total + SIRIUS.guessBonus, t.rune.ticks + (right ? SIRIUS.guessBonus : -SIRIUS.guessPenalty)));
  t.flashes.push({ kind: right ? 'guessRight' : 'guessWrong', ticks: 45 });
  // A right guess also fills your energy (and so Holy Light).
  if (right) { const holy = t.holy; addStarEnergy(s, 100, false); t.holy = Math.min(100, holy + 100 * SIRIUS_HOLY_PER_ENERGY); playAudioOneShot('/sounds/sirius-guess-right.mp3', .9); } // one full bar, however full you were
  else { playAudioOneShot('/sounds/hitHurt.wav', .5, .7); playAudioOneShot('/sounds/shieldBreak.mp3', .45, .8); }
}

/** The room picker (keys 1–4 or a click) while time is stopped: guess which chamber Ruby is being sent to. */
export function guessSiriusRitual(s: GameState, room: number): boolean {
  const r = s.sirius?.ritual;
  if (!r || r.guess !== -1 || s.gamePhase !== 'laserTarget' || room === chamberOfTile(s.rubyTileX, s.rubyTileY)) return false;
  r.guess = room; s.gamePhase = 'playing';
  playAudioOneShot('/sounds/commandClick.mp3', .5);
  return true;
}

// ─── Aliens ──────────────────────────────────────────────────────────────────

function spawnSiriusAlien(s:GameState,type:EnemyType) {
  if(type==='normal'){const pool=spawnPool(s,DIFFICULTY_TIERS[Math.min(s.difficultyLevel,DIFFICULTY_TIERS.length-1)].spawnTypes);type=pool[Math.floor(Math.random()*pool.length)];} // Normal slots use the same timed pool as the other maps
  const room=Math.floor(Math.random()*4),pool=CHAMBER_SPAWN_TILES[room];
  const options=pool.filter(([x,y])=>Math.hypot(x-s.playerTileX,y-s.playerTileY)>4);
  const tile=options[Math.floor(Math.random()*options.length)];if(!tile)return;
  const enemy=createEncounterEnemy(s,type,tile[0],tile[1],Math.round(ENEMY_CONFIGS[type].maxHp*SIRIUS.alienHpMult));
  enemy.attackTimer=90;s.enemies.push(enemy);
}
function spawnSiriusAliens(s: GameState) {
  const t=s.sirius!;if(s.noMobs)return;
  const m=SIRIUS.mason;
  if(t.phase>=m.fromPhase) {
    t.masonSpawnTimer??=m.spawnInterval;
    if(--t.masonSpawnTimer<=0){
      t.masonSpawnTimer=m.spawnInterval;
      if(s.enemies.filter(e=>e.type==='mason').length<m.maxAlive)spawnSiriusAlien(s,'mason');
    }
  }
  if(--t.spawnTimer>0)return;
  const more=t.phase>=2?SIRIUS.laterPhaseMore:1;
  t.spawnTimer=Math.round(SIRIUS.spawnInterval/more);
  // Masons have their own timer and allowance, so they cannot crowd out other aliens.
  if(s.enemies.filter(e=>e.type!=='mason').length>=Math.round(SIRIUS.population*more)+1)return;
  const pick=Math.random(),bells=s.enemies.filter(e=>e.type==='bellringer').length;
  const penitents=s.enemies.filter(e=>e.type==='penitent').length,pn=SIRIUS.penitent;
  const type:EnemyType=t.phase>=pn.fromPhase&&penitents<pn.maxAlive&&Math.random()<pn.chance?'penitent'
    :pick<.5?'zealot':pick<.85?(bells<3?'bellringer':'zealot'):'normal';
  spawnSiriusAlien(s,type);
}

/** A shove from Wave or bomb cancels a wind-up (not a dash already under way). */
export function interruptSiriusAlien(e: Enemy) {
  if (e.siriusAct && !e.siriusAct.dashing) { e.siriusAct = undefined; e.attackTimer = Math.max(e.attackTimer, 60); }
}

/** Player, or a placed Ruby that is more than two tiles closer (the shared alien rule). */
function siriusTarget(s: GameState, e: Enemy) {
  const ruby = s.rubyTileX >= 0 && !s.playerCarryingRuby && !s.enemyDecoyActive &&
    Math.hypot(e.tileX - s.playerTileX, e.tileY - s.playerTileY) > Math.hypot(e.tileX - s.rubyTileX, e.tileY - s.rubyTileY) + 2;
  e.targeting = ruby ? 'ruby' : 'player';
  return ruby ? { tx: s.rubyTileX, ty: s.rubyTileY, x: (s.rubyTileX + .5) * TILE_SIZE, y: (s.rubyTileY + .5) * TILE_SIZE }
    : { tx: s.playerTileX, ty: s.playerTileY, x: s.playerX, y: s.playerY };
}

export function updateSiriusAlien(s: GameState, e: Enemy) {
  if (e.attackTimer > 0) e.attackTimer--;
  if (e.type === 'zealot') updateZealot(s, e); else if (e.type === 'mason') updateMason(s, e); else if (e.type === 'penitent') updatePenitent(s, e); else updateBellringer(s, e);
}

// Zealot: lines up, braces, then dashes straight through, knocking you far back and breaking your trail.
function updateZealot(s: GameState, e: Enemy) {
  const c = SIRIUS.zealot, act = e.siriusAct;
  if (act) {
    if (!act.dashing) { if (--act.ticks <= 0) { act.dashing = true; act.ticks = c.dashTicks; playSFX_alienShoot(ALIEN_ATTACK_SFX.shot, 1.3); } return; } // the Charger's launch
    const p = 1 - --act.ticks / c.dashTicks, tx = (act.tx + .5) * TILE_SIZE, ty = (act.ty + .5) * TILE_SIZE;
    e.x = act.fromX + (tx - act.fromX) * p; e.y = act.fromY + (ty - act.fromY) * p;
    if (!act.hit && Math.hypot(s.playerX - e.x, s.playerY - e.y) <= c.hitRadius * TILE_SIZE) {
      act.hit = true; playSFX_chargerImpact();
      damagePlayer(s, c.damage, e);
      if (s.gamePhase === 'playing' && !s.enemyDecoyActive && !s.playerKnockback) {
        if (isFloorTile(s.map, s.playerTargetX + act.dx, s.playerTargetY + act.dy)) s.playerKnockback = { dirX: act.dx, dirY: act.dy, started: false, tilesLeft: c.push };
        else shovePlayerFromEnemy(s, e, c.push);
        s.screenShakeTicks = Math.max(s.screenShakeTicks, 10); s.screenShakeAmt = Math.max(s.screenShakeAmt, 5);
      }
    }
    if (s.gamePhase === 'playing' && s.rubyTileX >= 0 && !s.playerCarryingRuby && !act.hitRuby && Math.hypot((s.rubyTileX + .5) * TILE_SIZE - e.x, (s.rubyTileY + .5) * TILE_SIZE - e.y) <= c.hitRadius * TILE_SIZE) {
      act.hitRuby = true; damageRuby(s, c.damageRuby, e); playSFX_chargerImpact();
    }
    if (act.ticks > 0) return;
    e.tileX = e.targetTileX = act.tx; e.tileY = e.targetTileY = act.ty; e.stepProgress = 0; e.x = tx; e.y = ty; e.path = [];
    e.siriusAct = undefined; e.attackTimer = c.cooldown; e.shootTicks = 14;
    return;
  }
  const target = siriusTarget(s, e), dx = target.tx - e.tileX, dy = target.ty - e.tileY, d = Math.hypot(dx, dy);
  if (e.attackTimer <= 0 && d <= c.range && e.stepProgress === 0 && (dx === 0 || dy === 0 || Math.min(Math.abs(dx), Math.abs(dy)) <= 1)) {
    const [kx, ky] = Math.abs(dx) >= Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)];
    let tx = e.tileX, ty = e.tileY;
    for (let k = 0; k < c.dashTiles && isFloorTile(s.map, tx + kx, ty + ky); k++) { tx += kx; ty += ky; }
    if (tx !== e.tileX || ty !== e.tileY) {
      e.siriusAct = { ticks: c.windup, tx, ty, dx: kx, dy: ky, fromX: e.x, fromY: e.y, dashing: false };
      playAudioOneShot('/sounds/place_bomb.wav', ALIEN_ATTACK_SFX.chargerLock); // the Charger's lane lock
      return;
    }
  }
  walkPath(s, e, target.tx, target.ty, c.speed);
}

// Bellringer: keeps a few tiles away and rings its bell, a pulse that hurts and pushes you out of the ring.
function updateBellringer(s: GameState, e: Enemy) {
  const c = SIRIUS.bellringer, act = e.siriusAct, t = s.sirius!;
  if (act) {
    if (--act.ticks > 0) return;
    e.siriusAct = undefined; e.attackTimer = c.cooldown; e.shootTicks = 24;
    t.rings.push({ x: e.x, y: e.y, ticks: 30, radius: c.radius });
    playAudioOneShot('/sounds/sirius-bell.mp3', .8); // the church bell rings with the pulse
    if (Math.hypot(s.playerX - e.x, s.playerY - e.y) <= c.radius * TILE_SIZE) {
      damagePlayer(s, c.damage, e);
      if (s.gamePhase === 'playing') shovePlayerFromEnemy(s, e, c.push);
    }
    if (s.gamePhase === 'playing' && s.rubyTileX >= 0 && !s.playerCarryingRuby && Math.hypot((s.rubyTileX + .5) * TILE_SIZE - e.x, (s.rubyTileY + .5) * TILE_SIZE - e.y) <= c.radius * TILE_SIZE) damageRuby(s, c.damageRuby, e);
    return;
  }
  const target = siriusTarget(s, e), d = Math.hypot(target.tx - e.tileX, target.ty - e.tileY);
  if (e.attackTimer <= 0 && d <= c.radius - .5 && e.stepProgress === 0) {
    e.siriusAct = { ticks: c.windup, tx: e.tileX, ty: e.tileY, dx: 0, dy: 0, fromX: e.x, fromY: e.y, dashing: false };
    playAudioOneShot('/sounds/charging.wav', .4, 1.3); // it charges as it lifts the bell
    return;
  }
  if (d > c.keep - 1) walkPath(s, e, target.tx, target.ty, c.speed);
  else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) stepEnemy(s, e, c.speed);
}

// ─── Halo (primal skill) ─────────────────────────────────────────────────────

// A soft holy cast plays under the whole float, then fades out as you land. The recording is audible for only its
// first ~3.5s, so it plays slowed (pitch kept) to stretch that across the 6s float; a fresh copy starts only if a float
// runs longer. Stops on pause, exit and reset.
const FLOAT_VOLUME = .3, FLOAT_RATE = .5, FLOAT_RELOOP = 3.35; // FLOAT_RELOOP is in the recording's own seconds
let floatVoices: HTMLAudioElement[] = [], floatFade = 0;
function addFloatVoice() {
  try { const a = gameAudio('/sounds/sirius-float.mp3'); a.volume = FLOAT_VOLUME; a.preservesPitch = true; a.playbackRate = FLOAT_RATE; a.play().catch(() => {}); floatVoices.push(a); } catch {}
  if (floatVoices.length > 3) floatVoices.shift()?.pause();
}
function startFloatSound() { stopSiriusFloatSound(); addFloatVoice(); }
function keepFloatSound() { // while floating: chain a new copy before the audible part ends
  const latest = floatVoices[floatVoices.length - 1];
  if (latest && latest.currentTime >= FLOAT_RELOOP) addFloatVoice();
}
function fadeFloatSound() {
  if (!floatVoices.length) return;
  floatFade++; for (const a of floatVoices) a.volume = Math.max(0, FLOAT_VOLUME * (1 - floatFade / 30));
  if (floatFade >= 30) stopSiriusFloatSound();
}
export function stopSiriusFloatSound() { for (const a of floatVoices) a.pause(); floatVoices = []; floatFade = 0; }

function readyFullHolyLight(t: SiriusState) {
  if (!t.wasFull) playStrikeCharged();
  t.wasFull = true;
  t.haloCooldown = 0;
}

export function godFillHolyLight(state: GameState) {
  const t = state.sirius;
  if (!t) return;
  if (t.holy < 100) t.wasFull = false;
  t.holy = 100;
  readyFullHolyLight(t);
}

/** C: repel nearby aliens and float over walls. With full Holy Light it also releases a damaging burst. */
export function useHalo(s: GameState): boolean {
  const t = s.sirius;
  if (!t || s.gamePhase !== 'playing' || t.haloCooldown > 0) return false;
  s.playerCastTicks = 24; s.playerCastKind = 'blind_prayer'; s.playerPrimalCast = true;
  t.halo = SIRIUS.haloTicks; t.haloCooldown = SIRIUS.haloCooldown;
  t.haloWave = { x: s.playerX, y: s.playerY, ticks: SIRIUS.haloWaveTicks };
  playAudioOneShot('/sounds/light.mp3', .7, .85);
  for (const e of s.enemies) {
    if (e.hp <= 0 || e.id === t.bossId || e.twin?.downedTicks) continue;
    const dx = e.x - s.playerX, dy = e.y - s.playerY, distance = Math.hypot(dx, dy);
    if (distance > SIRIUS.haloWaveRadius * TILE_SIZE) continue;
    e.pushDirX = Math.round(dx / (distance || 1)); e.pushDirY = Math.round(dy / (distance || 1));
    if (!e.pushDirX && !e.pushDirY) e.pushDirX = 1;
    e.pushTiles = Math.max(e.pushTiles, SIRIUS.haloWavePush); e.buildWallDamage = undefined;
    e.haloStunTicks = Math.max(e.haloStunTicks ?? 0, SIRIUS.haloWaveStun);
    // A displaced dash cannot resume from its old origin after the push.
    if (e.siriusAct) { e.siriusAct = undefined; e.attackTimer = Math.max(e.attackTimer, 60); }
  }
  playAudioOneShot('/sounds/sirius-heal.mp3', 1.4, 1.25);
  startFloatSound(); // boosted so the cast stands out over combat
  if (t.holy >= 100) holyBurst(s);
  return true;
}
function holyBurst(s: GameState) {
  const t = s.sirius!;
  t.holy = 0; t.burst = SIRIUS_BURST_TICKS; t.burstAt = { x: s.playerX, y: s.playerY };
  t.wasFull = false;
  playAudioOneShot('/sounds/sirius-rune-seal.mp3', 1.4); playAudioOneShot('/sounds/holy2.mp3', 1, .8); playAudioOneShot('/sounds/levelup.mp3', .6, .7); playAudioOneShot('/sounds/sirius-float.mp3', 1.2); // the holy spell at full strength
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 36); s.screenShakeAmt = Math.max(s.screenShakeAmt, 11);
  for (const e of [...s.enemies]) {
    if (e.hp <= 0 || !s.enemies.includes(e)) continue;
    const boss = e.id === t.bossId;
    t.bolts.push({ x: e.x, y: e.y, ticks: boss ? 70 : 50, big: true });
    damageEnemy(s, e, boss ? SIRIUS.burstBoss : SIRIUS.burstAlien, boss ? 'enemy' : 'special'); // his own light burns him unreduced
    if (e.hp <= 0) { const i = s.enemies.indexOf(e); if (i >= 0) killEnemy(s, i); }
    if (s.gamePhase !== 'playing') return;
  }
}
/** While floating, any station wall inside the map can be walked over (not the outer edge). */
export function siriusCanFloat(s: GameState, x: number, y: number) {
  return !!s.sirius && s.sirius.halo > 0 && x > 0 && y > 0 && x < MAP_COLS - 1 && y < MAP_ROWS - 1 && chamberOfTile(x, y) >= 0;
}
export const siriusPlayerSpeed = (s: GameState) => s.sirius && s.sirius.halo > 0 ? SIRIUS.haloSpeed : 1;

// When the halo fades over a wall, you settle on the nearest open floor.
function landFromFloat(s: GameState) {
  if (isFloorTile(s.map, s.playerTileX, s.playerTileY)) return;
  for (let r = 1; r < 8; r++) {
    let best: [number, number] | null = null, bestD = Infinity;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const x = s.playerTileX + dx, y = s.playerTileY + dy, d = Math.hypot(dx, dy);
      if (d < bestD && isFloorTile(s.map, x, y)) { best = [x, y]; bestD = d; }
    }
    if (best) {
      [s.playerTileX, s.playerTileY] = best; s.playerTargetX = best[0]; s.playerTargetY = best[1];
      s.playerX = (best[0] + .5) * TILE_SIZE; s.playerY = (best[1] + .5) * TILE_SIZE; s.playerStepProgress = 0; s.playerKnockback = null;
      return;
    }
  }
}

// Mason (phase 2+): keeps its distance; when you are within reach it lifts a stone tablet for 0.75s while the target
// tiles are marked, then raises up to a 4-tile wall across your path, two tiles ahead of you, for 5s. Floating walks over it.
function wallTiles(s: GameState): [number, number][] {
  const dx = s.playerDirX || 1, dy = dx ? 0 : s.playerDirY || 1, fx = s.playerTileX + dx * SIRIUS.mason.ahead, fy = s.playerTileY + dy * SIRIUS.mason.ahead;
  const start = -Math.floor((SIRIUS.mason.length - 1) / 2), tiles: [number, number][] = [];
  for (let k = start; k < start + SIRIUS.mason.length; k++) {
    const x = fx + (dy ? k : 0), y = fy + (dx ? k : 0);
    if (!isFloorTile(s.map, x, y) || chamberOfTile(x, y) < 0) continue;
    if (s.sirius?.sanctuarySeals?.some(p => p.x === x && p.y === y)) continue;
    if (TELEPORT_PADS.some(([px, py]) => px === x && py === y) || (x === s.rubyTileX && y === s.rubyTileY)) continue;
    if ((x === s.playerTileX && y === s.playerTileY) || (x === s.playerTargetX && y === s.playerTargetY)) continue;
    if (s.enemies.some(e => e.hp > 0 && ((e.tileX === x && e.tileY === y) || (e.targetTileX === x && e.targetTileY === y)))) continue;
    tiles.push([x, y]);
  }
  return tiles;
}
function updateMason(s: GameState, e: Enemy) {
  const c = SIRIUS.mason, act = e.siriusAct, t = s.sirius!;
  if (act) {
    if (--act.ticks > 0) return;
    e.siriusAct = undefined; e.attackTimer = c.cooldown; e.shootTicks = 20;
    for (const [x, y] of (act.tiles ?? [])) {
      if (t.sanctuarySeals?.some(p => p.x === x && p.y === y)) continue;
      if (!isFloorTile(s.map, x, y) || (x === s.playerTileX && y === s.playerTileY) || (x === s.playerTargetX && y === s.playerTargetY)) continue; // never on you
      if (s.enemies.some(o => o.hp > 0 && ((o.tileX === x && o.tileY === y) || (o.targetTileX === x && o.targetTileY === y)))) continue;
      s.map[y][x] = T_WALL; t.walls.push({ x, y, ticks: c.wallTicks });
    }
    playAudioOneShot('/sounds/place_bomb.wav', .5, .6); playAudioOneShot('/sounds/falling-thing.wav', .4, .7);
    return;
  }
  const d = Math.hypot(s.playerTileX - e.tileX, s.playerTileY - e.tileY);
  if (e.attackTimer <= 0 && d <= c.range && e.stepProgress === 0) {
    const tiles = wallTiles(s);
    if (tiles.length) { e.siriusAct = { ticks: c.windup, tx: e.tileX, ty: e.tileY, dx: 0, dy: 0, fromX: e.x, fromY: e.y, dashing: false, tiles }; playAudioOneShot('/sounds/grow.wav', .4, .8); return; }
  }
  if (d > c.keep) walkPath(s, e, s.playerTileX, s.playerTileY, c.speed);
  else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) stepEnemy(s, e, c.speed);
}
// Penitent (phase 3): walks to the oldest tile of your trail and erases it, eating its way toward you. Reaching
// the part you traced loses that progress; reaching you breaks the whole trail. It walks, so Sacred Halo loses it.
function updatePenitent(s: GameState, e: Enemy) {
  const t = s.sirius!, c = SIRIUS.penitent;
  // Eat any trail tile it stands on, and everything older than it.
  const here = t.trail.findIndex(p => p.x === e.tileX && p.y === e.tileY);
  if (here >= 0 && here < t.trail.length - 1) {
    for (const p of t.trail.slice(0, here + 1)) t.eaten.push({ x: p.x, y: p.y, ticks: 24 });
    t.trail.splice(0, here + 1); t.steps.splice(0, here + 1);
    playAudioOneShot('/sounds/deghost.wav', .3, .7); // a hollow, ghostly wipe each time it eats
  }
  if (Math.hypot(s.playerX - e.x, s.playerY - e.y) <= c.reach * TILE_SIZE && (t.trail.length > 1 || t.steps.length)) {
    for (const p of t.trail) t.eaten.push({ x: p.x, y: p.y, ticks: 24 });
    resetTrail(t, s.playerTileX, s.playerTileY); t.traced = 0;
    playAudioOneShot('/sounds/shieldBreak.mp3', .4, .6);
  }
  const target = t.trail.length > 1 ? t.trail[0] : { x: s.playerTileX, y: s.playerTileY };
  walkPath(s, e, target.x, target.y, c.speed, 12, 6);
}

function updateWalls(s: GameState) {
  const t = s.sirius!;
  t.walls = t.walls.filter(w => {
    if (--w.ticks > 0) return true;
    if (s.map[w.y]?.[w.x] === T_WALL) s.map[w.y][w.x] = T_FLOOR;
    return false;
  });
}
/** Restores every Mason wall to floor (encounter cleanup). */
export function clearSiriusWalls(s: GameState) {
  const t = s.sirius; if (!t) return;
  for (const w of t.walls) if (s.map[w.y]?.[w.x] === T_WALL) s.map[w.y][w.x] = T_FLOOR;
  t.walls = [];
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function updateSirius(s: GameState) {
  const t = s.sirius;
  if (!t || s.gamePhase !== 'playing') return;
  t.flashes = t.flashes.filter(f => --f.ticks > 0);
  t.bolts = t.bolts.filter(b => --b.ticks > 0);
  t.rings = t.rings.filter(r => --r.ticks > 0);
  t.eaten = t.eaten.filter(p => --p.ticks > 0);
  if (t.wrath > 0) t.wrath--;
  if (t.burst > 0) t.burst--;
  if (t.haloWave && --t.haloWave.ticks <= 0) t.haloWave = undefined;
  updateWalls(s);
  if (t.halo <= 0) fadeFloatSound(); else keepFloatSound();
  let primalReadied = false;
  if (t.haloCooldown > 0 && --t.haloCooldown === 0) primalReadied = true;
  if (t.halo > 0 && s.playerTileX === s.playerTargetX && s.playerTileY === s.playerTargetY && --t.halo <= 0) landFromFloat(s);
  else if (t.halo > 0 && (s.playerTileX !== s.playerTargetX || s.playerTileY !== s.playerTargetY)) t.halo = Math.max(1, t.halo - 1); // it ends once your step lands
  // Filling Holy Light readies Halo at once, so the burst can be released.
  if (t.holy >= 100 && !t.wasFull) readyFullHolyLight(t);
  else if (primalReadied) playUiSfx('fenceReady');
  t.wasFull = t.holy >= 100;
  trackTrail(s);
  updateLight(s);
  spawnSiriusAliens(s);
  const boss = siriusBoss(s);
  if (!boss) return;
  const phase = Math.min(3, 3 - Math.floor(Math.max(0, boss.hp - .001) / SIRIUS.phaseHP)) as 1 | 2 | 3;
  if (phase > t.phase) {
    t.phase = phase; s.bossSpawnName = `BLIND PRAYER · PHASE ${phase}`; s.bossSpawnTicks = 150;
    if (phase >= 2) t.lightTimer = Math.min(t.lightTimer, siriusLightDuration(t)); // the quicker swaps start at once
  }
  updateRune(s); if (s.gamePhase !== 'playing') return;
  updateRitual(s);
}

/** God control: put the Prayer at the start of a phase with that phase's full HP (summoning him first if needed). */
export function godSetSiriusPhase(s: GameState, phase: 1 | 2 | 3) {
  godPhaseClock(s, phase); // phase 2+ starts at least a minute in
  const t = s.sirius;
  if (!t || s.gamePhase !== 'playing') return;
  if (!siriusBoss(s)) { godSpawnBoss(s, 'blind_prayer'); if (!siriusBoss(s)) return; }
  const boss = siriusBoss(s)!;
  boss.hp = (4 - phase) * SIRIUS.phaseHP; t.phase = phase;
  t.lightTimer = Math.min(t.lightTimer, siriusLightDuration(t));
  placeSanctuarySeals(s);
  s.bossSpawnName = `BLIND PRAYER · PHASE ${phase}`; s.bossSpawnTicks = 150;
}

/** God controls. */
export function godSiriusRune(s: GameState) { const t = s.sirius; if (t && siriusBoss(s) && !t.rune) castRune(s); }
export function godSiriusSwap(s: GameState) { if (s.sirius) swapLight(s); }
export function godSiriusRitual(s: GameState) { if (s.sirius) s.sirius.ritualCooldown = 0; }
