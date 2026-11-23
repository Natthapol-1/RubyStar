import { CHAMBER_SPAWN_TILES, ENEMY_CONFIGS, TELEPORT_PADS, TILE_SIZE, TWIN_RANGED_SPEED, chamberOfTile } from './constants';
import { walkPath } from './aliens';
import { playUiSfx } from './ui-sfx';
import { godPhaseClock, createEncounterEnemy, damageEnemy, damagePlayer, stunPlayer, damageRuby, shovePlayerFromEnemy, twinBerserk, healCore, playSFX_objectBreak, encounterEffect, getMirrorTwinTile, godSpawnBoss, healPlayer, killEnemy, playAudioOneShot, playCelestialSound, freeChamberTiles, isFloorTile, playSFX_twinRevive, tileEuclidDist, type Enemy, type GameState } from './engine';

// Binary Star challenge: the Astral Twins have one life per phase (three in all) and jump to opposite chambers on a
// timer; you and your Binary Star twin push and pull them with opposite magnetic poles.
export const BINARY = {
  twinHP: 1650,         // each twin, per phase (one life)
  reviveHpRatio: .4,    // a twin revived inside a phase returns with 40% of its life (Endless: 60%)
  lateReviveHpRatio: .25, // ...and with 25% from its second revival in the same phase
  transferDelay: 540,   // the twins share HP every 15–18s here (Endless: 6–9s)
  meteorShare: .1,      // a meteor takes 10% of a twin's phase HP
  swapTicks: [2100, 2100, 2700] as const, // the twins jump to two opposite chambers every 35s in phases 1–2, 45s in phase 3
  swapWarning: 90,      // 1.5s warning before the jump
  swapMinDistance: 3,   // landing tiles keep this far from the player when possible
  jumpVolume: 1.6,      // the twins' jump plays the teleport sound at 2.5× its usual 0.64
  jumpStormVolume: .9,  // layered with the Jupiter Storm recording
  phaseGraceTicks: 180, // a fresh life waits 3s before attacking
  lodestoneChance: .3,  // share of regular alien spawns that become Lodestones
  lodestoneFromPhase: 1, // Lodestones spawn from phase 1
  // Grounder (phase 2+): one arrives every 20s on its own timer, at most 2 alive, at least 6 tiles from you. It escorts
  // the nearest twin; any twin within 3 tiles of a Grounder ignores magnetic fields, swap jolts and collisions. When
  // it dies, the twin it escorted is stunned for 1s.
  grounder: { fromPhase: 2, gap: 1200, max: 2, hp: 30, reach: 3, follow: 2, killStun: 60, spawnGap: 6 },
  // Pulsar (from phase 1): 25% of regular spawns, at most 2 alive, with a random pole. When it dies its field takes hold
  // for 2.5s: within 5 tiles, every 12 ticks it moves you 2 tiles (away for a matching pole, in for an opposite one,
  // stopping a tile short). Then it explodes within 3 tiles: 28 to you, 16 to a placed Ruby, 20 to regular aliens and
  // 3% of a twin's life.
  // Pole Reversal (phase 3): each twin flips its own pole on its own timer, every 22–26s, after a 1.5s warning.
  reversal: { fromPhase: 3, gap: [1320, 1560], warn: 90 },
  // Charging tiles (phase 3): one per room, at least 3 tiles from its teleport pad. A twin below 80% of its life walks to the tile in
  // its room and stands on it, healing 1.2% of its life a second, until full or moved off (a push, pull or knockback),
  // then waits 8s before seeking one again. It does not attack while it seeks or charges.
  charge: { fromPhase: 3, setupTicks: 60, heal: .012, seekBelow: .8, cooldown: 480, failCooldown: 960, padGap: 3, firstSeek: 300 },
  pulsar: { fromPhase: 1, chance: .25, max: 2, fieldTicks: 150, range: 5, pulse: 12, tiles: 2, blast: 3, damage: 28, rubyDamage: 16, alienDamage: 20, twinShare: .03 },
  magnetFromPhase: 2,   // room magnets join from phase 2
  lodestoneMax: 3,      // at most this many alive
  magnetsPerRoom: 1,    // from phase 2, one magnet in every room; diagonally opposite rooms share a pole (phase 1 has none)
  magnetRange: 4,       // tiles
  cloneRange: 3,        // your F twin's field reaches 3 tiles (yours reaches magnetRange)
  magnetPulse: 16,      // every 16 ticks the net magnetic force moves you (and each field moves the magnetic enemies in reach)
  fieldTiles: 2,        // each pulse a field moves an enemy this many tiles (a pull never closer than magnetHold)
  magnetStrong: 3,      // a net force this strong (within about 2 tiles of a source) moves you two tiles instead of one
  magnetMoveTicks: 1500, // every 25s the magnets move to new spots (and at each new phase)
  magnetMoveWarning: 90, // they blink for 1.5s first
  magnetPadGap: 6,      // a magnet sits at least 6 tiles (along both axes) from its room's teleport pad: beyond its 4-tile reach of the pad and the tiles around it
  magnetHold: 1.5,      // a pull stops once you are this close
  poleCooldown: 120,    // C swaps your pole at most every 2 seconds
  swapVisualTicks: 36, // Pole Shift brackets and filings turn over 0.6 seconds; gameplay timing is separate
  surgeTicks: 45,       // for 0.75s after a swap, magnetic enemies in your or your F twin's field are shoved once
  // Each surge jolt (push or pull alike) deals a little damage and heals you and Ruby.
  // A Lodestone your field (or a swap) drives within 1 tile of a twin in the next second, or a twin driven within
  // 1 tile of a Lodestone, bursts it on that twin: 5% of the twin's
  // life (6.5%, about 98 HP) and a 1s stun. The Lodestone is destroyed.
  lodestoneHitShare: .08, lodestoneHitStun: 60, lodestoneHitReach: 1,
  surgeTwinShare: .02, surgeDamage: 2, surgeHeal: 10, // 2% of a twin's life (30 HP) or 2 to a Lodestone (so it survives as ammo); +10 HP to you and to Ruby
  slamStunTicks: 90,    // an enemy pushed or pulled into a wall (surge or field) is stunned 1.5s (no damage or healing)
  wallStunCooldown: 180, // then cannot be wall-stunned again for 3s from the stun's start, so a field cannot pin it against a wall forever
  exposedSkew: .5,      // while exposed, ordinary hits scale 0.5–1.5× by each twin's share of their HP (averaging 1×), so they even out
  exposedAloneDamage: 1, // while exposed with its partner dead or down, a lone twin takes 100% from ordinary hits
  boundDamage: .6,      // while the twins are bound (not exposed), ordinary hits on them (yours, your copy's, meteors) deal 60%
  collideWindow: 60,    // a twin any magnetic force moved (field pulse or swap shove) can crash for 1s afterwards
  collideReach: 2,      // within 2 tiles of the other twin (along both axes) counts as a crash
  collideShare: .15, collideStunTicks: 300, exposeTicks: 420, collideHeal: 15, // a surge-shoved twin meeting the other: 15% of a life in every phase, split to even out their HP, both stunned 5s, then exposed 7s more; you heal 15
  twinDamage: .85,      // every twin attack on this map (ordinary hits and the new moves) deals 85%
  // While its partner is down the survivor goes berserk; here it is far more dangerous than in Endless.
  berserk: { speed: 1.6, cooldown: .4, damage: 1.5 },
  // Extra twin moves on this map (berserk shortens their cooldowns and raises their damage too).
  // Dawn's Comet Dash: within 3–7 tiles and lined up with you (row or column, one tile of slack), she marks the lane
  // for 0.6s, then dashes up to 7 tiles at half a tile per tick: 14 and a 2-tile shove to you, 10 to a placed Ruby.
  dash: { cooldown: 420, minRange: 3, maxRange: 7, warn: 36, speed: 24, damage: 14, rubyDamage: 10, shove: 2 },
  // Dusk's Starfall: within 10 tiles, three 3×3 areas around you (yours first) close in for 1.1s, then burst:
  // 12 to you, 8 to a placed Ruby, once per volley.
  starfall: { cooldown: 540, range: 10, warn: 66, count: 3, spread: 3, damage: 12, rubyDamage: 8, stunTicks: 30 }, // stunTicks: a hit stops you for 0.5s, like a comet
  // Twin Beam: with both twins in one chamber at least 3 tiles apart, a link tracks between them for 1s, then fires
  // for 0.4s along its locked line: 18 to you within 0.6 tiles of it, 12 to a placed Ruby.
  beam: { cooldown: 720, minGap: 3, warn: 60, fire: 24, reach: .6, damage: 18, rubyDamage: 12 },
  surgeShove: 3,        // the surge shoves each enemy in a field up to 3 tiles: away for a push, toward the source for a pull
  surgeTwinCooldown: 120, // at most every 2s per enemy, so swapping rapidly cannot stack it
} as const;

/** North is coral like Dawn; south is blue like Dusk. Like poles push you away, opposite poles pull you in. */
export type Pole = 'north' | 'south';
export const POLE_COLORS: Record<Pole, string> = { north: '#f08062', south: '#83cfff' };

export const BINARY_TWIN_COLORS = ['#f08062', '#83cfff'] as const; // Dawn (melee), Dusk (ranged)
export interface BinaryState {
  phase: 1 | 2 | 3; pairId: number; swapTimer: number;
  jumps: { x: number; y: number; ticks: number; color: string; arrive: boolean }[];
  pole: Pole; poleCooldown: number; pulse: number; swapFlashTicks: number; magnetTimer: number;
  exposed?: number; collisions?: { x: number; y: number; ticks: number; small?: boolean }[]; // Binary Collision: exposed ticks left, and the crash effects
  magnets: { x: number; y: number; pole: Pole }[];
  magnetPush: { dx: number; dy: number; ticks: number } | null; // last magnetic shove, for its cue
  surge: number; surgeHit: number[]; surgeReadyAt: Record<number, number>; // swap surge window, twins hit this swap, per-twin cooldown
  wallStunReadyAt?: Record<number, number>; // per enemy: the tick a wall can stun it again
  reversal?: Record<number, number>; // phase 3: ticks until each twin flips its pole
  chargeTiles?: { x: number; y: number }[]; chargeSeek?: Record<number, { x: number; y: number; charging: boolean; onTicks?: number } | null>; chargeCd?: Record<number, number>;
  grounderTimer?: number; grounderLinks?: { id: number; twinId: number }[]; // Grounder spawns, and which twin each escorts
  pulsarFields?: { x: number; y: number; pole: Pole; ticks: number; pulse: number; blast: number }[]; // dead Pulsars' fields
  zaps: { x: number; y: number; ticks: number; color: string; fromX?: number; fromY?: number }[]; // fromX/Y: the F twin when its field did the shove
  moves?: TwinMoves;
}

/** The twins' extra moves: Dawn's Comet Dash, Dusk's Starfall and their shared Twin Beam. */
export interface TwinMoves {
  dashCd: number; starCd: number; beamCd: number;
  dash: { id: number; dx: number; dy: number; tiles: number; warn: number; moved: number; hit: boolean; rubyHit: boolean; trail: { x: number; y: number; ticks: number }[] } | null;
  stars: { x: number; y: number; ticks: number; burst: number }[]; starHit: boolean;
  beam: { warn: number; fire: number; ax: number; ay: number; bx: number; by: number; hit: boolean; rubyHit: boolean } | null;
}
function freshMoves(): TwinMoves { return { dashCd: 240, starCd: 300, beamCd: 480, dash: null, stars: [], starHit: false, beam: null }; }

export function createBinaryState(s: GameState) {
  s.binary = { phase: 1, pairId: -1, swapTimer: BINARY.swapTicks[0], jumps: [],
    pole: 'north', poleCooldown: 0, pulse: BINARY.magnetPulse, swapFlashTicks: 0, magnetTimer: BINARY.magnetMoveTicks, magnets: [], magnetPush: null, surge: 0, surgeHit: [], surgeReadyAt: {}, zaps: [] };
  placeMagnets(s);
}

// Two magnets per room, one of each pole, on open floor away from pads, Ruby and each other.
function placeMagnets(s: GameState) {
  const b = s.binary!;
  b.magnets = []; b.magnetTimer = BINARY.magnetMoveTicks;
  if (b.phase < BINARY.magnetFromPhase) return;
  const flip = Math.random() < .5; // ALPHA and GAMMA share one pole, BETA and DELTA the other
  for (let room = 0; room < 4; room++) {
    const poles: Pole[] = [((room === 0 || room === 3) !== flip) ? 'north' : 'south'];
    // Keep each magnet out of reach of the teleport pad and the tiles around it (where you can use it), so it never
    // shoves you off or onto a pad; relax to a smaller gap only if the room has no such tile.
    const [padX, padY] = TELEPORT_PADS[room], padGap = (x: number, y: number) => Math.max(Math.abs(x - padX), Math.abs(y - padY));
    const base = freeChamberTiles(s, room).filter(([x, y]) => tileEuclidDist(x, y, s.playerTileX, s.playerTileY) >= 4 &&
      [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => isFloorTile(s.map, x + dx, y + dy)));
    const far = base.filter(([x, y]) => padGap(x, y) >= BINARY.magnetPadGap), tiles = far.length ? far : base.filter(([x, y]) => padGap(x, y) >= 3);
    for (const pole of poles) {
      const open = tiles.filter(([x, y]) => b.magnets.every(m => tileEuclidDist(m.x, m.y, x, y) >= 6));
      const pool = open.length ? open : tiles;
      if (!pool.length) continue;
      const [x, y] = pool[Math.floor(Math.random() * pool.length)];
      b.magnets.push({ x, y, pole });
    }
  }
}

/** Dawn is north and Dusk south, unless phase 3's Pole Reversal has flipped them (stored on the twin as `pole`). */
export function twinPole(twin: Enemy): Pole { return twin.pole ?? (twin.twin?.index === 1 ? 'south' : 'north'); }
/** Whether Pole Reversal has flipped this twin away from its own colour. */
export function twinReversed(twin: Readonly<Enemy>) { return twin.type === 'astral_twins' && !!twin.pole && twin.pole !== (twin.twin?.index === 1 ? 'south' : 'north'); }

/** Magnetic enemies: the living twins (Dawn north, Dusk south) and Lodestone aliens with their own pole. */
export function magneticEnemies(s: GameState): { e: Enemy; pole: Pole }[] {
  return s.enemies.filter(e => e.hp > 0 && !e.twin?.downedTicks && (e.type === 'lodestone' ? !!e.pole : e.type === 'astral_twins' && e.twin?.pairId === s.binary?.pairId))
    .map(e => ({ e, pole: e.type === 'lodestone' ? e.pole! : twinPole(e) }));
}

/** Your F twin: always the opposite pole to yours, with a longer reach. */
export function opposite(pole: Pole): Pole { return pole === 'north' ? 'south' : 'north'; }
export function cloneMagnet(s: Readonly<GameState>): { x: number; y: number; pole: Pole; range: number } | null {
  const clone = s.binary ? getMirrorTwinTile(s as GameState) : null;
  return clone ? { x: clone.tileX, y: clone.tileY, pole: opposite(s.binary!.pole), range: BINARY.cloneRange } : null;
}

/** Whether a field from a source with that pole and reach acts on an enemy: in range, and not a pull already held close. */
/** Inside a source's square reach, whatever its pole. */
function inReach(e: Enemy, src: { x: number; y: number; range: number }) { return Math.max(Math.abs(e.tileX - src.x), Math.abs(e.tileY - src.y)) <= src.range; }
function fieldReaches(e: Enemy, pole: Pole, src: { x: number; y: number; pole: Pole; range: number }) {
  const d = Math.hypot(e.tileX - src.x, e.tileY - src.y), reach = Math.max(Math.abs(e.tileX - src.x), Math.abs(e.tileY - src.y));
  return reach <= src.range && (pole === src.pole || d > BINARY.magnetHold); // reach is the square drawn around the source
}

// Right after a swap, each magnetic enemy in your field (else your F twin's) gets one strong shove from it: matching
// poles fling it away, opposite poles yank it in, stopping just short of the source. Into a wall, it is stunned.
function magneticSurge(s: GameState) {
  const b = s.binary!, you = { x: s.playerTargetX, y: s.playerTargetY, pole: b.pole, range: BINARY.magnetRange }, clone = cloneMagnet(s);
  for (const { e: twin, pole } of magneticEnemies(s)) {
    // Your field takes priority: a twin inside your reach answers only to you, even if your pull is already holding it close.
    const src = inReach(twin, you) ? (fieldReaches(twin, pole, you) ? you : null) : clone && fieldReaches(twin, pole, clone) ? clone : null;
    if (!src || grounded(s, twin) || !s.enemies.includes(twin) || twin.hp <= 0 || b.surgeHit.includes(twin.id) || (b.surgeReadyAt[twin.id] ?? 0) > s.gameTick) continue;
    b.surgeHit.push(twin.id); b.surgeReadyAt[twin.id] = s.gameTick + BINARY.surgeTwinCooldown;
    b.zaps.push({ x: twin.x, y: twin.y, ticks: 24, color: POLE_COLORS[src.pole], ...(src === you ? {} : { fromX: (src.x + .5) * TILE_SIZE, fromY: (src.y + .5) * TILE_SIZE }) });
    playCelestialSound('neptune_electric', 3.5); // the jolt crackles like Dusk's shot
    healPlayer(s, BINARY.surgeHeal); healCore(s, BINARY.surgeHeal);
    hitTwin(s, twin, twin.type === 'astral_twins' ? twin.maxHp * BINARY.surgeTwinShare : BINARY.surgeDamage, 'special'); // the jolt ignores their bond
    if (s.gamePhase !== 'playing') return;
    if (twin.hp <= 0 || !s.enemies.includes(twin) || twin.twin?.downedTicks) continue;
    const push = pole === src.pole;
    const dx = twin.tileX - src.x, dy = twin.tileY - src.y, horizontal = Math.abs(dx) >= Math.abs(dy), sign = push ? 1 : -1;
    const tiles = push ? BINARY.surgeShove : Math.min(BINARY.surgeShove, Math.max(0, Math.max(Math.abs(dx), Math.abs(dy)) - 1));
    if (tiles > 0 && (dx || dy)) {
      twin.pushDirX = horizontal ? Math.sign(dx) * sign : 0; twin.pushDirY = horizontal ? 0 : Math.sign(dy) * sign; twin.pushTiles = tiles; twin.surgeShoved = 30; twin.magnetMoved = BINARY.collideWindow; // a crash into the other twin soon after is a collision
      twin.buildWallDamage = 0; twin.slamStun = BINARY.slamStunTicks; // into a wall: a stun, no damage
    }
  }
}

// ─── Binary Collision ────────────────────────────────────────────────────────

/**
 * Ordinary hits on the twins (yours, your copy's, meteors). While bound they deal boundDamage. While exposed, yours and your
 * copy's even out the twins' HP (meteors stay at full): each twin takes 2 × its share of their combined HP (so the healthier one takes more, the weaker one less,
 * within exposedSkew either way), which averages to full damage. The surge, slams and collisions ignore both.
 */
export function binaryDamageTaken(s: Readonly<GameState>, e: Enemy, source: string) {
  const b = s.binary;
  if (!b || e.type !== 'astral_twins' || e.twin?.pairId !== b.pairId) return 1;
  if (source !== 'player' && source !== 'meteor' && source !== 'reflection') return 1;
  if ((b.exposed ?? 0) <= 0) return BINARY.boundDamage;
  if (source === 'meteor') return 1; // a meteor already hits both twins alike
  const other = s.enemies.find(t => t !== e && t.type === 'astral_twins' && t.twin?.pairId === b.pairId && t.hp > 0 && !t.twin?.downedTicks);
  if (!other) return BINARY.exposedAloneDamage; // its partner is dead or down: the lone twin's own rate
  if (e.hp + other.hp <= 0) return 1;
  return Math.max(1 - BINARY.exposedSkew, Math.min(1 + BINARY.exposedSkew, 2 * e.hp / (e.hp + other.hp)));
}
/** A twin the surge shoved meets the other: they crash. Both are hurt and stunned, then exposed (full damage, no jumps). */
// ─── Grounder and Pulsar (phase 2+) ──────────────────────────────────────────

/** A twin within a living Grounder's reach is grounded: magnetic fields, swap jolts and collisions leave it alone. */
export function grounded(s: Readonly<GameState>, e: Enemy) {
  if (e.type !== 'astral_twins' || !s.binary) return false;
  return s.enemies.some(g => g.type === 'grounder' && g.hp > 0 && Math.max(Math.abs(g.tileX - e.tileX), Math.abs(g.tileY - e.tileY)) <= BINARY.grounder.reach);
}

function updateGrounders(s: GameState, living: Enemy[]) {
  const b = s.binary!, G = BINARY.grounder;
  // A Grounder that is gone (killed) stuns the twin it escorted for a moment.
  const links = b.grounderLinks ?? [];
  for (const link of links) if (!s.enemies.some(e => e.id === link.id && e.hp > 0)) {
    const twin = living.find(t => t.id === link.twinId);
    if (twin) { twin.buildStopUntil = Math.max(twin.buildStopUntil ?? 0, s.gameTick + G.killStun); twin.flashTicks = 12; }
  }
  b.grounderLinks = links.filter(l => s.enemies.some(e => e.id === l.id && e.hp > 0));
  if (b.phase < G.fromPhase || s.noMobs) return;
  b.grounderTimer ??= G.gap;
  if (--b.grounderTimer > 0) return;
  b.grounderTimer = G.gap;
  if (s.enemies.filter(e => e.type === 'grounder' && e.hp > 0).length >= G.max) return;
  const tiles: [number, number][] = [];
  for (let room = 0; room < 4; room++) tiles.push(...freeChamberTiles(s, room).filter(([x, y]) => tileEuclidDist(x, y, s.playerTileX, s.playerTileY) >= G.spawnGap));
  if (!tiles.length) return;
  const [x, y] = tiles[Math.floor(Math.random() * tiles.length)];
  const g = createEncounterEnemy(s, 'grounder', x, y, G.hp); g.visualSpawnTicks = 30; s.enemies.push(g);
}

/** Grounder AI: walk to the nearest living twin and stay within a couple of tiles of it. It never attacks. */
export function updateGrounder(s: GameState, e: Enemy) {
  const b = s.binary; if (!b) return;
  const twins = binaryTwins(s).filter(t => t.hp > 0 && !t.twin!.downedTicks);
  if (!twins.length) return;
  const twin = twins.reduce((best, t) => tileEuclidDist(t.tileX, t.tileY, e.tileX, e.tileY) < tileEuclidDist(best.tileX, best.tileY, e.tileX, e.tileY) ? t : best);
  const links = (b.grounderLinks ??= []), link = links.find(l => l.id === e.id);
  if (link) link.twinId = twin.id; else links.push({ id: e.id, twinId: twin.id });
  if (Math.max(Math.abs(twin.tileX - e.tileX), Math.abs(twin.tileY - e.tileY)) <= BINARY.grounder.follow && e.tileX === e.targetTileX && e.tileY === e.targetTileY) return;
  walkPath(s, e, twin.tileX, twin.tileY, ENEMY_CONFIGS.grounder.speed);
}

/** A Pulsar dies: its field takes hold where it fell. */
export function pulsarDied(s: GameState, e: Enemy) {
  const b = s.binary; if (!b || !e.pole) return;
  (b.pulsarFields ??= []).push({ x: e.tileX, y: e.tileY, pole: e.pole, ticks: BINARY.pulsar.fieldTicks, pulse: 1, blast: 0 });
  playCelestialSound('neptune_electric', 2.5);
}

function updatePulsarFields(s: GameState) {
  const b = s.binary!, P = BINARY.pulsar;
  for (const f of b.pulsarFields ?? []) {
    if (f.ticks > 0) {
      f.ticks--;
      // A strong pull or push on you only: matching your pole throws you clear, opposite drags you toward the core.
      if (--f.pulse <= 0) {
        f.pulse = P.pulse;
        const dx = s.playerTargetX - f.x, dy = s.playerTargetY - f.y, reach = Math.max(Math.abs(dx), Math.abs(dy));
        if (reach <= P.range && !s.playerKnockback && s.playerFrozenTicks <= 0) {
          const repel = f.pole === b.pole, horizontal = Math.abs(dx) >= Math.abs(dy), sign = repel ? 1 : -1;
          const kx = (dx || dy) ? (horizontal ? Math.sign(dx) * sign : 0) : 0, ky = (dx || dy) ? (horizontal ? 0 : Math.sign(dy) * sign) : 0;
          const tiles = repel ? P.tiles : Math.min(P.tiles, Math.max(0, reach - 1));
          if ((kx || ky) && tiles > 0 && isFloorTile(s.map, s.playerTargetX + kx, s.playerTargetY + ky)) { s.playerKnockback = { dirX: kx, dirY: ky, started: false, tilesLeft: tiles, shaken: true }; b.magnetPush = { dx: kx, dy: ky, ticks: 12 }; }
        }
      }
      if (f.ticks === 0) { // it explodes
        f.blast = 30;
        s.bombBlasts.push({ cx: (f.x + .5) * TILE_SIZE, cy: (f.y + .5) * TILE_SIZE, radius: 0, maxRadius: P.blast * TILE_SIZE, ticks: 28, trap: true });
        s.screenShakeTicks = Math.max(s.screenShakeTicks, 14); s.screenShakeAmt = Math.max(s.screenShakeAmt, 7);
        playAudioOneShot('/sounds/bombExplode.wav', .6, .8);
        const inBlast = (x: number, y: number) => Math.max(Math.abs(x - f.x), Math.abs(y - f.y)) <= P.blast;
        if (inBlast(s.playerTileX, s.playerTileY)) { damagePlayer(s, P.damage); if (s.gamePhase !== 'playing') return; }
        if (s.rubyTileX !== -1 && !s.playerCarryingRuby && inBlast(s.rubyTileX, s.rubyTileY)) { damageRuby(s, P.rubyDamage); if (s.gamePhase !== 'playing') return; }
        for (const e of s.enemies.filter(e => e.hp > 0 && inBlast(e.tileX, e.tileY) && !e.twin?.downedTicks)) {
          if (e.type === 'astral_twins') hitTwin(s, e, e.maxHp * P.twinShare, 'special');
          else hitTwin(s, e, P.alienDamage, 'special');
          if (s.gamePhase !== 'playing') return;
        }
      }
    } else if (f.blast > 0) f.blast--;
  }
  b.pulsarFields = (b.pulsarFields ?? []).filter(f => f.ticks > 0 || f.blast > 0);
}

// ─── Phase 3: Pole Reversal and charging tiles ───────────────────────────────

function randomGap([lo, hi]: readonly [number, number]) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

/** Each twin flips its own pole on its own timer; the warning shows in the last `warn` ticks. */
function updatePoleReversal(s: GameState, living: Enemy[]) {
  const b = s.binary!, R = BINARY.reversal;
  if (b.phase < R.fromPhase) return;
  const timers = (b.reversal ??= {});
  living.forEach((t, i) => {
    timers[t.id] ??= randomGap(R.gap) + i * 300; // staggered so they rarely flip together
    if (--timers[t.id] > 0) return;
    timers[t.id] = randomGap(R.gap);
    t.pole = opposite(twinPole(t)); t.flashTicks = 12;
    b.zaps.push({ x: t.x, y: t.y, ticks: 24, color: POLE_COLORS[t.pole] });
    playCelestialSound('neptune_electric', 2.5);
  });
}
/** Ticks until this twin's next pole flip (Infinity outside phase 3). */
export function reversalTimer(s: Readonly<GameState>, t: Enemy) { return s.binary?.reversal?.[t.id] ?? Infinity; }

function placeChargeTiles(s: GameState) {
  const tiles: { x: number; y: number }[] = [];
  for (let room = 0; room < 4; room++) {
    const [px, py] = TELEPORT_PADS[room];
    const pool = freeChamberTiles(s, room).filter(([x, y]) => Math.max(Math.abs(x - px), Math.abs(y - py)) >= BINARY.charge.padGap &&
      [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => isFloorTile(s.map, x + dx, y + dy)) && !s.binary!.magnets.some(m => m.x === x && m.y === y));
    if (pool.length) { const [x, y] = pool[Math.floor(Math.random() * pool.length)]; tiles.push({ x, y }); }
  }
  return tiles;
}

/** A hurt twin walks to the charging tile in its room and heals while it stands there; moving it off ends the charge. */
function updateChargeTiles(s: GameState, living: Enemy[]) {
  const b = s.binary!, C = BINARY.charge;
  if (b.phase < C.fromPhase || !b.chargeTiles?.length) return;
  const seek = (b.chargeSeek ??= {}), cd = (b.chargeCd ??= {});
  for (const t of living) {
    if (cd[t.id] === undefined) cd[t.id] = C.firstSeek;
    if (cd[t.id] > 0) cd[t.id]--;
    const goal = seek[t.id];
    const busy = (t.buildStopUntil ?? 0) > s.gameTick || (t.pushTiles ?? 0) > 0;
    if (goal) {
      if ((t.pushTiles ?? 0) > 0 && goal.charging) { seek[t.id] = null; cd[t.id] = C.failCooldown; continue; } // knocked, pushed or pulled off: a longer wait
      if (busy) continue;
      const on = t.tileX === goal.x && t.tileY === goal.y && t.stepProgress === 0;
      if (on) {
        goal.charging = true;
        // The first second on the tile is set-up: no healing yet, so a quick push stops it before it gains anything.
        if ((goal.onTicks = (goal.onTicks ?? 0) + 1) <= C.setupTicks) continue;
        t.hp = Math.min(t.maxHp, t.hp + t.maxHp * C.heal / 60);
        if (s.gameTick % 30 === 0) t.healFlashTicks = 20;
        if (t.hp >= t.maxHp) { seek[t.id] = null; cd[t.id] = C.cooldown; }
      } else walkPath(s, t, goal.x, goal.y, t.twin!.index === 1 ? TWIN_RANGED_SPEED : ENEMY_CONFIGS.astral_twins.speed, 12, 6);
      continue;
    }
    if (busy || cd[t.id] > 0 || t.hp >= t.maxHp * C.seekBelow || b.moves?.dash?.id === t.id || (b.exposed ?? 0) > 0) continue;
    const room = chamberOfTile(t.tileX, t.tileY);
    const tile = b.chargeTiles.find(c => chamberOfTile(c.x, c.y) === room);
    if (tile) { seek[t.id] = { x: tile.x, y: tile.y, charging: false }; t.path = []; t.pathTimer = 0; t.windupTicks = 0; }
  }
}

/** A Lodestone driven by a magnetic force into a twin bursts on it: damage, a short stun, and the Lodestone is gone. */
function updateLodestoneHits(s: GameState, living: Enemy[]) {
  const b = s.binary!;
  for (const l of s.enemies.filter(e => e.type === 'lodestone' && e.hp > 0)) {
    const lodeMoved = (l.magnetMoved ?? 0) > 0;
    if (lodeMoved) l.magnetMoved!--;
    // Either way round: a Lodestone driven into a twin, or a twin driven into a Lodestone.
    const twin = living.find(t => (lodeMoved || (t.magnetMoved ?? 0) > 0) && Math.max(Math.abs(t.tileX - l.tileX), Math.abs(t.tileY - l.tileY)) <= BINARY.lodestoneHitReach);
    if (!twin) continue;
    l.magnetMoved = 0;
    b.collisions = [...(b.collisions ?? []), { x: (l.x + twin.x) / 2, y: (l.y + twin.y) / 2, ticks: 50, small: true }];
    s.screenShakeTicks = Math.max(s.screenShakeTicks, 12); s.screenShakeAmt = Math.max(s.screenShakeAmt, 6);
    playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .5, 1.2); playCelestialSound('neptune_electric', 2);
    twin.buildStopUntil = Math.max(twin.buildStopUntil ?? 0, s.gameTick + BINARY.lodestoneHitStun); twin.flashTicks = 16;
    hitTwin(s, twin, twin.maxHp * BINARY.lodestoneHitShare, 'special');
    if (s.gamePhase !== 'playing') return;
    hitTwin(s, l, l.hp + 1, 'special'); // the Lodestone shatters (ordinary kill rewards)
    if (s.gamePhase !== 'playing') return;
  }
}

function updateCollision(s: GameState, living: Enemy[]) {
  const b = s.binary!;
  b.collisions = (b.collisions ?? []).filter(c => --c.ticks > 0);
  if ((b.exposed ?? 0) > 0) b.exposed!--;
  for (const t of living) { if ((t.surgeShoved ?? 0) > 0) t.surgeShoved!--; if ((t.magnetMoved ?? 0) > 0) t.magnetMoved!--; }
  if (living.length !== 2 || (b.exposed ?? 0) > 0) return;
  const [a, c] = living;
  if (grounded(s, a) || grounded(s, c)) return; // a grounded twin cannot crash
  if (!((a.magnetMoved ?? 0) > 0 || (c.magnetMoved ?? 0) > 0) || Math.max(Math.abs(a.tileX - c.tileX), Math.abs(a.tileY - c.tileY)) > BINARY.collideReach) return;
  crashTwins(s, a, c);
}

/** The twins crash: the exposed window, the burst, healing, and damage split to even out their HP, with a stun. */
function crashTwins(s: GameState, a: Enemy, c: Enemy) {
  const b = s.binary!;
  a.surgeShoved = c.surgeShoved = a.magnetMoved = c.magnetMoved = 0; a.pushTiles = c.pushTiles = 0;
  b.exposed = BINARY.collideStunTicks + BINARY.exposeTicks;
  b.swapTimer = Math.max(b.swapTimer, BINARY.swapWarning + 60);
  (b.collisions ??= []).push({ x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, ticks: 90 });
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 40); s.screenShakeAmt = Math.max(s.screenShakeAmt, 16);
  playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', 1, .7); playAudioOneShot('/sounds/bombExplode.wav', .7, .6); playCelestialSound('neptune_electric', 3.5);
  healPlayer(s, BINARY.collideHeal);
  const split = collisionSplit(a.hp, c.hp, a.maxHp * BINARY.collideShare);
  for (const t of [a, c]) { t.buildStopUntil = Math.max(t.buildStopUntil ?? 0, s.gameTick + BINARY.collideStunTicks); t.flashTicks = 20; }
  for (const [t, amount] of [[a, split[0]], [c, split[1]]] as const) {
    if (amount > 0) hitTwin(s, t, amount, 'special');
    if (s.gamePhase !== 'playing') return;
  }
}

/** Pushed or pulled into a wall: a stun (no damage), unless this enemy was wall-stunned within wallStunCooldown. */
export function binaryWallStun(s: GameState, e: Enemy, ticks: number) {
  const b = s.binary; if (!b) return;
  const ready = (b.wallStunReadyAt ??= {});
  if ((ready[e.id] ?? 0) > s.gameTick) return;
  ready[e.id] = s.gameTick + BINARY.wallStunCooldown;
  e.buildStopUntil = Math.max(e.buildStopUntil ?? 0, s.gameTick + ticks); e.flashTicks = 12;
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 10); s.screenShakeAmt = Math.max(s.screenShakeAmt, 5);
  playSFX_objectBreak('frost');
}

/** A collision's damage pool goes to the healthier twin first until they are even, then splits equally. */
export function collisionSplit(a: number, c: number, pool: number): [number, number] {
  const first = Math.max(0, Math.min(pool, (pool + a - c) / 2));
  return [first, pool - first];
}

/** C: swap your pole. */
export function swapPole(s: GameState): boolean {
  const b = s.binary;
  if (!b || s.gamePhase !== 'playing' || b.poleCooldown > 0) return false;
  s.playerCastTicks = 24; s.playerCastKind = 'astral_twins'; s.playerPrimalCast = true;
  b.pole = b.pole === 'north' ? 'south' : 'north';
  b.poleCooldown = BINARY.poleCooldown; b.swapFlashTicks = BINARY.swapVisualTicks;
  b.surge = BINARY.surgeTicks; b.surgeHit = [];
  playCelestialSound('sea_chanter'); // the swap plays the Neptune's Tide cast sound
  b.pulse = Math.min(b.pulse, 12); // the new pole takes hold almost at once
  return true;
}

/** Your field and your F twin's move the magnetic enemies (twins and Lodestones) in reach each pulse: like poles away,
 * opposite poles toward the source. The twins never move you, and your F twin has no force on you. */
function fieldsOnEnemies(s: GameState) {
  const you = { x: s.playerTargetX, y: s.playerTargetY, pole: s.binary!.pole, range: BINARY.magnetRange };
  fieldOnEnemies(s, you);
  const clone = cloneMagnet(s);
  if (clone) fieldOnEnemies(s, clone, you); // your field takes priority: the F twin leaves alone anything inside your reach
}
function fieldOnEnemies(s: GameState, src: { x: number; y: number; pole: Pole; range: number }, over?: { x: number; y: number; range: number }) {
  for (const { e, pole } of magneticEnemies(s)) {
    if (e.pushTiles > 0 || (over && inReach(e, over)) || grounded(s, e)) continue;
    if (s.binary?.moves?.dash?.id === e.id && s.binary.moves.dash.warn <= 0) continue; // mid-dash, the passive field leaves Dawn alone
    if (e.type === 'lodestone' && ((e.chargeWindupTicks ?? 0) > 0 || e.chargeDirX !== 0 || e.chargeDirY !== 0)) continue; // nor a Lodestone mid-snap
    const dx = e.tileX - src.x, dy = e.tileY - src.y, d = Math.hypot(dx, dy);
    if (Math.max(Math.abs(dx), Math.abs(dy)) > src.range || d === 0) continue; // the same square as the drawn reach
    const repel = pole === src.pole;
    if (!repel && d <= BINARY.magnetHold) continue;
    const sign = repel ? 1 : -1, horizontal = Math.abs(dx) >= Math.abs(dy);
    const kx = horizontal ? Math.sign(dx) * sign : 0, ky = horizontal ? 0 : Math.sign(dy) * sign;
    if (!isFloorTile(s.map, e.tileX + kx, e.tileY + ky)) { if (e.type === 'astral_twins') binaryWallStun(s, e, BINARY.slamStunTicks); continue; } // already against the wall
    e.pushDirX = kx; e.pushDirY = ky; e.pushTiles = repel ? BINARY.fieldTiles : Math.max(1, Math.min(BINARY.fieldTiles, Math.floor(d - BINARY.magnetHold)));
    e.magnetMoved = BINARY.collideWindow; // a field pulse can drive a twin into the other, or a Lodestone into a twin
    if (e.type === 'astral_twins') { e.buildWallDamage = 0; e.slamStun = BINARY.slamStunTicks; } // a twin dragged into a wall mid-push is stunned
  }
}

/** Every room magnet and Lodestone in range pushes (like pole) or pulls (opposite pole); the net force moves you one tile. */
function magnetForce(s: GameState) {
  const b = s.binary!;
  const sources: { x: number; y: number; pole: Pole }[] = [...b.magnets,
    ...magneticEnemies(s).filter(({ e }) => e.type === 'lodestone').map(({ e, pole }) => ({ x: e.tileX, y: e.tileY, pole }))]; // the twins never move you
  let fx = 0, fy = 0, nearestPull = Infinity;
  for (const src of sources) {
    const dx = s.playerTargetX - src.x, dy = s.playerTargetY - src.y, d = Math.hypot(dx, dy);
    if (d > BINARY.magnetRange || d === 0) continue;
    const repel = src.pole === b.pole;
    if (!repel && d <= BINARY.magnetHold) continue;
    if (!repel) nearestPull = Math.min(nearestPull, d);
    const weight = (BINARY.magnetRange + 1 - d) / d * (repel ? 1 : -1);
    fx += dx * weight; fy += dy * weight;
  }
  if (Math.abs(fx) < .05 && Math.abs(fy) < .05) return;
  const steps: [number, number][] = Math.abs(fx) >= Math.abs(fy) ? [[Math.sign(fx), 0], [0, Math.sign(fy)]] : [[0, Math.sign(fy)], [Math.sign(fx), 0]];
  for (const [kx, ky] of steps) {
    if ((!kx && !ky) || !isFloorTile(s.map, s.playerTargetX + kx, s.playerTargetY + ky)) continue;
    // A strong force moves two tiles, but a pull never overshoots its source. A steady drift, so no knockback shake.
    s.playerKnockback = { dirX: kx, dirY: ky, started: false, tilesLeft: Math.hypot(fx, fy) >= BINARY.magnetStrong && nearestPull > 3 ? 2 : 1, shaken: true };
    b.magnetPush = { dx: kx, dy: ky, ticks: 16 };
    return;
  }
}

export function binaryTwins(s: GameState): Enemy[] {
  const b = s.binary;
  if (!b) return [];
  return s.enemies.filter(e => e.type === 'astral_twins' && e.twin?.pairId === b.pairId).sort((a, c) => a.twin!.index - c.twin!.index);
}

/** Called once the guardian pair exists: each twin carries one phase's HP. */
export function initializeBinaryTwins(s: GameState, leader: Enemy) {
  const b = s.binary!;
  b.pairId = leader.twin!.pairId; b.phase = 1; b.swapTimer = swapTicks(b);
  for (const twin of binaryTwins(s)) twin.hp = twin.maxHp = BINARY.twinHP;
  for (const [twin, room] of jumpRooms(s, binaryTwins(s))) jumpTwin(s, twin, room); // they arrive in two opposite chambers, as after a jump
}

/**
 * The last standing twin has fallen. Before phase 3 the pair loses one life and both rise again at full HP;
 * returns true when that happened, so the kill is not a defeat.
 */
/** The teleport interval for the current phase. */
export function swapTicks(b: { phase: 1 | 2 | 3 }) { return BINARY.swapTicks[b.phase - 1]; }

export function binaryLoseLife(s: GameState, victim: Enemy): boolean {
  const b = s.binary;
  if (!b || victim.twin?.pairId !== b.pairId || b.phase >= 3) return false;
  b.phase = (b.phase + 1) as 1 | 2 | 3;
  b.swapTimer = swapTicks(b);
  placeMagnets(s);
  for (const twin of binaryTwins(s)) {
    const t = twin.twin!;
    twin.hp = twin.maxHp = BINARY.twinHP;
    Object.assign(t, { downedTicks: 0, partnerDownTicks: 0, fallTicks: 0, reviveTicks: 48, hasteTicks: 0, transferGiveTicks: 0, transferGetTicks: 0 });
    twin.attackTimer = BINARY.phaseGraceTicks; twin.windupTicks = 0; twin.shootTicks = 0;
    twin.icyShieldHP = 0; twin.path = []; twin.pathTimer = 0; twin.pushTiles = 0; twin.healFlashTicks = 30;
    encounterEffect(s, 'revive', twin, twin.x, twin.y, 48, BINARY_TWIN_COLORS[t.index]);
  }
  b.moves = freshMoves(); b.grounderTimer = BINARY.grounder.gap;
  for (const twin of binaryTwins(s)) twin.pole = undefined; // a fresh life starts on its own pole
  b.reversal = {}; b.chargeSeek = {}; b.chargeCd = {};
  b.chargeTiles = b.phase >= BINARY.charge.fromPhase ? placeChargeTiles(s) : [];
  s.bossSpawnName = `ASTRAL TWINS · PHASE ${b.phase}`; s.bossSpawnTicks = 150;
  playSFX_twinRevive();
  return true;
}

export function clearBinaryEncounter(s: GameState) {
  if (!s.binary) return;
  s.binary.moves = freshMoves(); s.binary.pulsarFields = []; s.binary.grounderLinks = [];
  s.binary.reversal = {}; s.binary.chargeSeek = {}; s.binary.chargeCd = {}; if (s.binary.phase < BINARY.charge.fromPhase) s.binary.chargeTiles = [];
  for (const twin of binaryTwins(s)) twin.pole = undefined;
  s.binary.jumps = [];
}

function nearestChamber(x: number, y: number) {
  const room = chamberOfTile(x, y);
  if (room >= 0) return room;
  let best = 0, bestDist = Infinity;
  CHAMBER_SPAWN_TILES.forEach((tiles, ch) => tiles.forEach(([tx, ty]) => { const d = Math.hypot(tx - x, ty - y); if (d < bestDist) { bestDist = d; best = ch; } }));
  return best;
}

// Rooms are indexed [ALPHA, BETA, DELTA, GAMMA]: ALPHA ↔ GAMMA and BETA ↔ DELTA sit diagonally opposite.
export function oppositeChamber(room: number) { return 3 - room; }

function jumpTwin(s: GameState, twin: Enemy, destination: number) {
  if (s.binary?.chargeSeek) s.binary.chargeSeek[twin.id] = null; // a jump ends any trip to a charging tile
  const tiles = freeChamberTiles(s, destination);
  if (!tiles.length) return;
  const far = tiles.filter(([x, y]) => tileEuclidDist(x, y, s.playerTileX, s.playerTileY) >= BINARY.swapMinDistance);
  const pool = far.length ? far : tiles;
  const [x, y] = pool[Math.floor(Math.random() * pool.length)];
  const color = BINARY_TWIN_COLORS[twin.twin!.index];
  s.binary!.jumps.push({ x: twin.x, y: twin.y, ticks: 30, color, arrive: false });
  Object.assign(twin, { tileX: x, tileY: y, targetTileX: x, targetTileY: y, x: (x + .5) * TILE_SIZE, y: (y + .5) * TILE_SIZE, stepProgress: 0, path: [], pathTimer: 0, pushTiles: 0, windupTicks: 0 });
  twin.visualSpawnTicks = 30;
  s.binary!.jumps.push({ x: twin.x, y: twin.y, ticks: 30, color, arrive: true });
}

// A magnetic hit (surge jolt or collision) lands on a twin or Lodestone: ordinary damage rules, and a kill counts.
function hitTwin(s: GameState, twin: Enemy, amount: number, source: 'player' | 'special' = 'player') {
  if (twin.hp <= 0 || twin.twin?.downedTicks || !s.enemies.includes(twin)) return;
  damageEnemy(s, twin, amount, source);
  if (twin.hp <= 0) killEnemy(s, s.enemies.indexOf(twin));
}

/**
 * The twins split into two diagonally opposite chambers, facing each other across the station. They use the opposite
 * pair that does not hold you, so they flank you from the neighbouring rooms; each prefers a room it is not already in.
 * A lone survivor jumps to the chamber opposite its fallen partner.
 */
export function jumpRooms(s: GameState, living: Enemy[]): [Enemy, number][] {
  const all = binaryTwins(s), fallen = all.find(t => t.twin!.downedTicks);
  if (living.length === 1 && fallen) return [[living[0], oppositeChamber(nearestChamber(fallen.tileX, fallen.tileY))]];
  const mine = chamberOfTile(s.playerTileX, s.playerTileY);
  const pairs: [number, number][] = [[0, 3], [1, 2]];
  const pair = mine >= 0 ? pairs.find(p => !p.includes(mine))! : pairs[Math.floor(Math.random() * 2)];
  if (living.length === 1) return [[living[0], pair[Math.floor(Math.random() * 2)]]];
  const [a, b] = living, aRoom = nearestChamber(a.tileX, a.tileY), bRoom = nearestChamber(b.tileX, b.tileY);
  const swapped = aRoom === pair[0] || bRoom === pair[1];
  return swapped ? [[a, pair[1]], [b, pair[0]]] : [[a, pair[0]], [b, pair[1]]];
}


export function updateBinary(s: GameState) {
  const b = s.binary;
  if (!b || s.gamePhase !== 'playing') return;
  if (b.poleCooldown > 0 && --b.poleCooldown === 0) playUiSfx('fenceReady'); // C is ready again: the shared primal-skill ready cue
  if (b.swapFlashTicks > 0) b.swapFlashTicks--;
  b.zaps = b.zaps.filter(z => --z.ticks > 0);
  if (b.surge > 0) { b.surge--; magneticSurge(s); if (s.gamePhase !== 'playing') return; }
  if (b.magnetPush && --b.magnetPush.ticks <= 0) b.magnetPush = null;
  if (--b.magnetTimer <= 0) placeMagnets(s);
  if (--b.pulse <= 0) {
    b.pulse = BINARY.magnetPulse;
    if (!s.playerKnockback && s.playerFrozenTicks <= 0 && !s.enemyDecoyActive) magnetForce(s);
    fieldsOnEnemies(s);
  }
  b.jumps = b.jumps.filter(j => --j.ticks > 0);
  // Opposite-room jumps.
  const living = binaryTwins(s).filter(t => t.hp > 0 && !t.twin!.downedTicks);
  updateCollision(s, living); if (s.gamePhase !== 'playing') return;
  updateLodestoneHits(s, living); if (s.gamePhase !== 'playing') return;
  updateGrounders(s, living); updatePulsarFields(s); if (s.gamePhase !== 'playing') return;
  updatePoleReversal(s, living); updateChargeTiles(s, living);
  updateTwinMoves(s, living); if (s.gamePhase !== 'playing') return;
  if (!living.length) return;
  if ((b.exposed ?? 0) > 0) return; // exposed: no jumps until the window ends
  if (--b.swapTimer === BINARY.swapWarning) playCelestialSound('solar_swoosh'); // the blinking warning starts with a swoosh
  if (b.swapTimer > 0) return;
  b.swapTimer = swapTicks(b);
  for (const [twin, room] of jumpRooms(s, living)) jumpTwin(s, twin, room);
  playAudioOneShot('/sounds/gameModeClick.mp3', BINARY.jumpVolume); // the teleport sound, boosted so the jump is heard across the map
  playAudioOneShot('/sounds/celestial/jupiter-storm.wav', BINARY.jumpStormVolume); // layered with a crackling storm burst
}

// ─── Twin moves ──────────────────────────────────────────────────────────────

const stunned = (s: GameState, t: Enemy) => (t.buildStopUntil ?? 0) > s.gameTick;
const busyDuringAttack = (t: Enemy) => t.windupTicks > 0 || t.shootTicks > 0;
/** Dawn is mid-dash (marking or dashing): the engine skips her ordinary AI. */
export function binaryTwinBusy(s: GameState, e: Enemy) { return s.binary?.moves?.dash?.id === e.id || !!s.binary?.chargeSeek?.[e.id]; }

function updateTwinMoves(s: GameState, living: Enemy[]) {
  const b = s.binary!, m = (b.moves ??= freshMoves());
  const dawn = living.find(t => t.twin!.index === 0), dusk = living.find(t => t.twin!.index === 1);
  const rubyPlaced = s.rubyTileX !== -1 && !s.playerCarryingRuby;
  const scale = (t: Enemy | undefined) => t ? twinBerserk(s, t) : { cooldown: 1, damage: BINARY.twinDamage };
  if (m.dashCd > 0) m.dashCd--; if (m.starCd > 0) m.starCd--; if (m.beamCd > 0) m.beamCd--;
  // Comet Dash.
  if (m.dash) {
    const d = m.dash, t = living.find(x => x.id === d.id);
    d.trail = d.trail.filter(p => --p.ticks > 0);
    // Only a stun or a Pole Shift shove (an active move) cancels the dash; the passive field just moves her while she marks.
    if (!t || stunned(s, t) || ((t.pushTiles ?? 0) > 0 && (t.surgeShoved ?? 0) > 0)) { m.dash = null; }
    else if ((t.pushTiles ?? 0) > 0) { /* moved by the passive field: keep the lane, wait for her to land */ }
    else if (d.warn > 0) {
      if (--d.warn === 0) { // she sets off from wherever the field left her, along the same direction
        d.tiles = 0;
        while (d.tiles < BINARY.dash.maxRange && isFloorTile(s.map, t.tileX + d.dx * (d.tiles + 1), t.tileY + d.dy * (d.tiles + 1))) d.tiles++;
        if (!d.tiles) m.dash = null;
      }
    }
    else {
      if (d.moved === 0) playAudioOneShot('/sounds/slash.mp3', .55, .8);
      d.trail.push({ x: t.x, y: t.y, ticks: 12 });
      d.moved += BINARY.dash.speed;
      const startX = t.tileX, startY = t.tileY;
      t.x += d.dx * BINARY.dash.speed; t.y += d.dy * BINARY.dash.speed;
      const tx = Math.floor(t.x / TILE_SIZE), ty = Math.floor(t.y / TILE_SIZE);
      if (tx !== startX || ty !== startY) {
        if (!isFloorTile(s.map, tx, ty)) { t.x = (startX + .5) * TILE_SIZE; t.y = (startY + .5) * TILE_SIZE; d.moved = d.tiles * TILE_SIZE; }
        else Object.assign(t, { tileX: tx, tileY: ty, targetTileX: tx, targetTileY: ty, stepProgress: 0, path: [], pathTimer: 0 });
      }
      const k = scale(t);
      if (!d.hit && Math.hypot(s.playerX - t.x, s.playerY - t.y) <= TILE_SIZE * .8) {
        d.hit = true; damagePlayer(s, BINARY.dash.damage * k.damage, t); shovePlayerFromEnemy(s, t, BINARY.dash.shove);
        if (s.gamePhase !== 'playing') return;
      }
      if (!d.rubyHit && rubyPlaced && Math.hypot((s.rubyTileX + .5) * TILE_SIZE - t.x, (s.rubyTileY + .5) * TILE_SIZE - t.y) <= TILE_SIZE * .8) {
        d.rubyHit = true; damageRuby(s, BINARY.dash.rubyDamage * k.damage, t);
        if (s.gamePhase !== 'playing') return;
      }
      if (d.moved >= d.tiles * TILE_SIZE) {
        Object.assign(t, { x: (t.tileX + .5) * TILE_SIZE, y: (t.tileY + .5) * TILE_SIZE, targetTileX: t.tileX, targetTileY: t.tileY, stepProgress: 0 });
        t.attackTimer = Math.max(t.attackTimer, 30);
        m.dash = null; m.dashCd = Math.round(BINARY.dash.cooldown * k.cooldown);
      }
    }
  } else if (dawn && m.dashCd <= 0 && !stunned(s, dawn) && !busyDuringAttack(dawn) && !(dawn.pushTiles > 0) && dawn.stepProgress === 0) {
    const dx = s.playerTileX - dawn.tileX, dy = s.playerTileY - dawn.tileY, horizontal = Math.abs(dx) >= Math.abs(dy);
    const along = Math.abs(horizontal ? dx : dy), side = Math.abs(horizontal ? dy : dx);
    if (along >= BINARY.dash.minRange && along <= BINARY.dash.maxRange && side <= 1) {
      const ux = horizontal ? Math.sign(dx) : 0, uy = horizontal ? 0 : Math.sign(dy);
      let tiles = 0;
      while (tiles < BINARY.dash.maxRange && isFloorTile(s.map, dawn.tileX + ux * (tiles + 1), dawn.tileY + uy * (tiles + 1))) tiles++;
      if (tiles >= 2) {
        m.dash = { id: dawn.id, dx: ux, dy: uy, tiles, warn: BINARY.dash.warn, moved: 0, hit: false, rubyHit: false, trail: [] };
        playAudioOneShot('/sounds/charging.wav', .35, 1.3);
      }
    }
  }
  // Starfall.
  if (m.stars.length) {
    for (const st of m.stars) {
      if (st.ticks > 0 && --st.ticks === 0) {
        st.burst = 24;
        const k = scale(dusk);
        if (!m.starHit && Math.max(Math.abs(s.playerTileX - st.x), Math.abs(s.playerTileY - st.y)) <= 1) { m.starHit = true; damagePlayer(s, BINARY.starfall.damage * k.damage, dusk); if (s.gamePhase !== 'playing') return; if (!s.enemyDecoyActive) stunPlayer(s, BINARY.starfall.stunTicks); }
        if (rubyPlaced && Math.max(Math.abs(s.rubyTileX - st.x), Math.abs(s.rubyTileY - st.y)) <= 1) { damageRuby(s, BINARY.starfall.rubyDamage * k.damage, dusk); if (s.gamePhase !== 'playing') return; }
        playAudioOneShot('/sounds/snowball-hit.mp3', .4, .8);
      } else if (st.ticks === 0 && st.burst > 0) st.burst--;
    }
    m.stars = m.stars.filter(st => st.ticks > 0 || st.burst > 0);
    if (!m.stars.some(st => st.ticks > 0)) m.starHit = false;
  } else if (dusk && m.starCd <= 0 && !stunned(s, dusk) && tileEuclidDist(dusk.tileX, dusk.tileY, s.playerTileX, s.playerTileY) <= BINARY.starfall.range) {
    const spots: [number, number][] = [[s.playerTileX, s.playerTileY]];
    for (let tries = 0; spots.length < BINARY.starfall.count && tries < 40; tries++) {
      const r = BINARY.starfall.spread, x = s.playerTileX + Math.round((Math.random() * 2 - 1) * r), y = s.playerTileY + Math.round((Math.random() * 2 - 1) * r);
      if (isFloorTile(s.map, x, y) && spots.every(([px, py]) => Math.max(Math.abs(px - x), Math.abs(py - y)) >= 2)) spots.push([x, y]);
    }
    m.stars = spots.map(([x, y]) => ({ x, y, ticks: BINARY.starfall.warn, burst: 0 }));
    m.starCd = Math.round(BINARY.starfall.cooldown * scale(dusk).cooldown);
    playAudioOneShot('/sounds/falling-thing.wav', .45, 1.2);
  }
  // Twin Beam.
  if (m.beam) {
    const bm = m.beam;
    if (!dawn || !dusk || stunned(s, dawn) || stunned(s, dusk)) { m.beam = null; m.beamCd = 240; }
    else if (bm.warn > 0) {
      bm.ax = dawn.x; bm.ay = dawn.y; bm.bx = dusk.x; bm.by = dusk.y; // the link tracks them until it fires
      if (--bm.warn === 0) { bm.fire = BINARY.beam.fire; playAudioOneShot('/sounds/laserBeam.mp3', .5, .8); }
    } else if (bm.fire > 0) {
      const near = (px: number, py: number) => segmentDistance(px, py, bm.ax, bm.ay, bm.bx, bm.by) <= BINARY.beam.reach * TILE_SIZE;
      if (!bm.hit && near(s.playerX, s.playerY)) { bm.hit = true; damagePlayer(s, BINARY.beam.damage * BINARY.twinDamage, dawn); if (s.gamePhase !== 'playing') return; }
      if (!bm.rubyHit && rubyPlaced && near((s.rubyTileX + .5) * TILE_SIZE, (s.rubyTileY + .5) * TILE_SIZE)) { bm.rubyHit = true; damageRuby(s, BINARY.beam.rubyDamage * BINARY.twinDamage, dawn); if (s.gamePhase !== 'playing') return; }
      if (--bm.fire === 0) { m.beam = null; m.beamCd = BINARY.beam.cooldown; }
    }
  } else if (dawn && dusk && m.beamCd <= 0 && !stunned(s, dawn) && !stunned(s, dusk) && (b.exposed ?? 0) <= 0) {
    const room = chamberOfTile(dawn.tileX, dawn.tileY);
    if (room >= 0 && room === chamberOfTile(dusk.tileX, dusk.tileY) && tileEuclidDist(dawn.tileX, dawn.tileY, dusk.tileX, dusk.tileY) >= BINARY.beam.minGap) {
      m.beam = { warn: BINARY.beam.warn, fire: 0, ax: dawn.x, ay: dawn.y, bx: dusk.x, by: dusk.y, hit: false, rubyHit: false };
      playAudioOneShot('/sounds/charging.wav', .3, .9);
    }
  }
}

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const vx = bx - ax, vy = by - ay, len = vx * vx + vy * vy, t = len ? Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / len)) : 0;
  return Math.hypot(px - (ax + vx * t), py - (ay + vy * t));
}

/** God control: put the pair at the start of a phase with full HP (summoning them first if needed). */
export function godSetBinaryPhase(s: GameState, phase: 1 | 2 | 3) {
  godPhaseClock(s, phase); // phase 2+ starts at least a minute in
  const b = s.binary;
  if (!b || s.gamePhase !== 'playing') return;
  if (!binaryTwins(s).length) { godSpawnBoss(s, 'astral_twins'); if (!binaryTwins(s).length) return; }
  b.phase = Math.max(1, phase - 1) as 1 | 2 | 3;
  if (phase === 1) {
    for (const twin of binaryTwins(s)) { twin.hp = twin.maxHp; Object.assign(twin.twin!, { downedTicks: 0, partnerDownTicks: 0, fallTicks: 0 }); }
    placeMagnets(s); clearBinaryEncounter(s); s.bossSpawnName = 'ASTRAL TWINS · PHASE 1'; s.bossSpawnTicks = 150; return;
  }
  binaryLoseLife(s, binaryTwins(s)[0]);
}

/** God control: move Dusk beside Dawn and crash them at once (only while both are standing). */
export function godCollideTwins(s: GameState) {
  const b = s.binary;
  if (!b || s.gamePhase !== 'playing') return;
  const living = binaryTwins(s).filter(t => t.hp > 0 && !t.twin!.downedTicks);
  if (living.length !== 2) return;
  const [a, c] = living, taken = (x: number, y: number) => s.enemies.some(e => e !== c && e.hp > 0 && e.tileX === x && e.tileY === y);
  const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dy]) => [a.tileX + dx, a.tileY + dy]).find(([x, y]) => isFloorTile(s.map, x, y) && !taken(x, y));
  if (spot) Object.assign(c, { tileX: spot[0], tileY: spot[1], targetTileX: spot[0], targetTileY: spot[1], x: (spot[0] + .5) * TILE_SIZE, y: (spot[1] + .5) * TILE_SIZE, stepProgress: 0, path: [], pathTimer: 0, pushTiles: 0 });
  b.exposed = 0;
  crashTwins(s, a, c);
}

/** God control: start the opposite-room jump warning now. */
export function godJumpTwins(s: GameState) {
  if (s.binary && s.gamePhase === 'playing') s.binary.swapTimer = Math.min(s.binary.swapTimer, BINARY.swapWarning + 1); // +1 so the warning (and its swoosh) starts next tick
}
