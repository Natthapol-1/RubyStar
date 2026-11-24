// ─── Map ─────────────────────────────────────────────────────────────────────

export const TILE_SIZE = 48;
// The map size follows the chamber layout (51×51 for the standard station, larger for Star Gambit's Bazaar).
export let MAP_COLS = 51;
export let MAP_ROWS = 51;

// Tile types
export const T_WALL = 0;
export const T_FLOOR = 1;
export const T_TELEPORT = 2;

// Chamber indices
export const CH_ALPHA = 0; // top-left
export const CH_BETA = 1; // top-right
export const CH_GAMMA = 3; // bottom-right
export const CH_DELTA = 2; // bottom-left

// The chamber layout is data: every mode uses the standard four chambers except Star Gambit's seven-room Bazaar.
// These arrays keep their names (and identity) everywhere; applyChamberLayout swaps their contents when a mode starts.
type Bounds = [number, number, number, number]; // [row1, col1, row2, col2] inclusive (outer walls)
const STANDARD_LAYOUT = {
  bounds: [[1, 1, 20, 20], [1, 30, 20, 49], [30, 1, 49, 20], [30, 30, 49, 49]] as Bounds[], // ALPHA TL, BETA TR, DELTA BL, GAMMA BR
  labels: ['ALPHA', 'BETA', 'DELTA', 'GAMMA'],
  colors: ['#00d4ff', '#ff6b6b', '#00ff88', '#ffaa00'],
  pads: [[10, 10], [39, 10], [10, 39], [39, 39]] as [number, number][], // tileX, tileY
  // Spawn points per chamber: floor tiles on the perimeter, away from the hallway openings.
  spawns: [
    [[2, 2], [10, 2], [18, 2], [2, 10], [2, 18], [19, 5], [19, 15], [7, 19], [15, 19]],
    [[31, 2], [39, 2], [47, 2], [31, 7], [31, 15], [47, 10], [35, 19], [46, 19]],
    [[7, 31], [15, 31], [2, 31], [2, 39], [2, 47], [19, 32], [19, 45], [7, 48], [15, 48]],
    [[35, 31], [46, 31], [31, 35], [31, 45], [47, 39], [48, 46], [35, 48], [46, 48]],
  ] as [number, number][][],
};
// Star Gambit's Bazaar (63×63): six stalls on the corners of a hexagon (clockwise from the top) around a central plaza
// chamber, with corridors of several tiles between them.
const BAZAAR_SIZE = 63;
const BAZAAR_ROOMS: Bounds[] = [[1, 24, 15, 38], [14, 42, 28, 56], [34, 42, 48, 56], [47, 24, 61, 38], [34, 6, 48, 20], [14, 6, 28, 20], [24, 24, 38, 38]];
function perimeterSpawns([r1, c1, r2, c2]: Bounds): [number, number][] {
  const out: [number, number][] = [], ir1 = r1 + 1, ic1 = c1 + 1, ir2 = r2 - 1, ic2 = c2 - 1, midR = (ir1 + ir2) / 2, midC = (ic1 + ic2) / 2;
  for (let c = ic1; c <= ic2; c += 3) for (const r of [ir1, ir2]) if (Math.abs(c - midC) > 2) out.push([c, r]); // skip the openings at the middle of each side
  for (let r = ir1 + 3; r <= ir2 - 3; r += 3) for (const c of [ic1, ic2]) if (Math.abs(r - midR) > 2) out.push([c, r]);
  return out;
}
const BAZAAR_LAYOUT = {
  bounds: BAZAAR_ROOMS,
  labels: ['ALPHA', 'BETA', 'GAMMA', 'DELTA', 'EPSILON', 'ZETA', 'PLAZA'], // clockwise from the top stall
  colors: ['#ffd27a', '#ff8fb1', '#7fe8ff', '#9dff8a', '#c9a8ff', '#ffb070', '#e9f2ff'],
  pads: BAZAAR_ROOMS.map(([r1, c1, r2, c2]) => [(c1 + c2) / 2, (r1 + r2) / 2] as [number, number]),
  spawns: BAZAAR_ROOMS.slice(0, 6).map(perimeterSpawns).concat([[]]), // nothing enters through the plaza
};
export const CHAMBER_BOUNDS: Bounds[] = STANDARD_LAYOUT.bounds.map(b => [...b] as Bounds);
export const CHAMBER_LABELS: string[] = [...STANDARD_LAYOUT.labels];
export const CHAMBER_COLORS: string[] = [...STANDARD_LAYOUT.colors];
export const TELEPORT_PADS: [number, number][] = STANDARD_LAYOUT.pads.map(p => [...p] as [number, number]);
export const CHAMBER_SPAWN_TILES: [number, number][][] = STANDARD_LAYOUT.spawns.map(l => l.map(p => [...p] as [number, number]));
export type ChamberLayout = 'standard' | 'bazaar';
/** Swap the chamber layout in place (bounds, labels, colours, pads, spawn tiles). Call before building the map. */
export function applyChamberLayout(kind: ChamberLayout) {
  const L = kind === 'bazaar' ? BAZAAR_LAYOUT : STANDARD_LAYOUT;
  MAP_COLS = MAP_ROWS = kind === 'bazaar' ? BAZAAR_SIZE : 51;
  const put = <T,>(target: T[], source: T[]) => { target.length = 0; target.push(...source); };
  put(CHAMBER_BOUNDS, L.bounds.map(b => [...b] as Bounds)); put(CHAMBER_LABELS, [...L.labels]); put(CHAMBER_COLORS, [...L.colors]);
  put(TELEPORT_PADS, L.pads.map(p => [...p] as [number, number])); put(CHAMBER_SPAWN_TILES, L.spawns.map(l => l.map(p => [...p] as [number, number])));
}
export const TELEPORT_COOLDOWN = 2 * 60; // ticks after arrival

// Player starting tile
export const PLAYER_START: [number, number] = [10, 10]; // [tileX, tileY] in ALPHA

// ─── Map generator ────────────────────────────────────────────────────────────

export function generateMap(): number[][] {
  const map: number[][] = Array.from({ length: MAP_ROWS }, () =>
    new Array(MAP_COLS).fill(T_WALL),
  );

  function fillFloor(r1: number, c1: number, r2: number, c2: number) {
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        map[r][c] = T_FLOOR;
  }

  // Chamber interiors (1-tile wall border → interior starts at +1)
  fillFloor(2, 2, 19, 19);   // ALPHA
  fillFloor(2, 31, 19, 48);  // BETA
  fillFloor(31, 2, 48, 19);  // DELTA
  fillFloor(31, 31, 48, 48); // GAMMA

  // Hallways (3 tiles wide)
  fillFloor(9, 20, 11, 30);   // top horizontal  (ALPHA <-> BETA)
  fillFloor(38, 20, 40, 30);  // bottom horizontal (DELTA <-> GAMMA)
  fillFloor(20, 9, 30, 11);   // left vertical   (ALPHA <-> DELTA)
  fillFloor(20, 38, 30, 40);  // right vertical  (BETA  <-> GAMMA)

  // Teleport pads
  for (const [tx, ty] of TELEPORT_PADS) map[ty][tx] = T_TELEPORT;

  // Scatter wall cover inside chambers (2×2 blocks in corners, a few singles mid-chamber)
  const coverWalls: [number, number][] = [
    // ALPHA (interior rows 2-19, cols 2-19; teleport at col 10, row 10)
    [3, 3], [4, 3], [3, 4], [4, 4],     // upper-left
    [3, 17], [4, 17], [3, 16], [4, 16], // upper-right
    [16, 3], [17, 3], [16, 4], [17, 4], // lower-left
    [16, 17], [17, 17], [16, 16], [17, 16], // lower-right
    [7, 14], [13, 7],               // mid singles
    // horizontal bars
    [6, 5], [6, 6], [6, 7], [6, 8],
    [14, 12], [14, 13], [14, 14], [14, 15], [14, 16],
    // vertical bar
    [6, 17], [7, 17], [8, 17], [9, 17], [10, 17],
    // L-shape (left-center)
    [10, 5], [11, 5], [12, 5], [12, 6], [12, 7], [12, 8],
    // diagonal staircase
    [5, 14], [6, 15], [7, 16],
    // Z-shape
    [11, 12], [11, 13], [12, 13], [12, 14],

    // BETA (interior rows 2-19, cols 31-48; teleport at col 39, row 10)
    [3, 32], [4, 32], [3, 33], [4, 33],
    [3, 46], [4, 46], [3, 47], [4, 47],
    [16, 32], [17, 32], [16, 33], [17, 33],
    [16, 46], [17, 46], [16, 47], [17, 47],
    [7, 44], [13, 36],
    // horizontal bars
    [6, 33], [6, 34], [6, 35], [6, 36],
    [14, 40], [14, 41], [14, 42], [14, 43], [14, 44],
    // vertical bars
    [6, 46], [7, 46], [8, 46], [9, 46],
    [13, 34], [14, 34], [15, 34], [16, 34],
    // L-shape
    [9, 34], [9, 35], [9, 36], [10, 34], [11, 34],
    // Diagonal pair; leave the wall-side tile (row 5, col 31) open.
    [6, 32], [7, 33],

    // DELTA (interior rows 31-48, cols 2-19; teleport at col 10, row 39)
    [32, 3], [33, 3], [32, 4], [33, 4],
    [32, 16], [33, 16], [32, 17], [33, 17],
    [46, 3], [47, 3], [46, 4], [47, 4],
    [46, 16], [47, 16], [46, 17], [47, 17],
    [35, 14], [43, 7],
    // horizontal bars
    [34, 12], [34, 13], [34, 14], [34, 15],
    [44, 5], [44, 6], [44, 7], [44, 8],
    // L-shape from horizontal into vertical
    [45, 8], [46, 8], [47, 8],
    // vertical bar
    [35, 12], [36, 12], [37, 12], [38, 12],
    // L-shape (center-right)
    [41, 13], [42, 13], [42, 14], [42, 15], [42, 16],
    // diagonal staircase
    [34, 5], [35, 6], [36, 7],

    // GAMMA (interior rows 31-48, cols 31-48; teleport at col 39, row 39)
    [32, 32], [33, 32], [32, 33], [33, 33],
    [32, 46], [33, 46], [32, 47], [33, 47],
    [46, 32], [47, 32], [46, 33], [47, 33],
    [46, 46], [47, 46], [46, 47], [47, 47],
    [35, 44], [43, 36],
    // horizontal bars
    [33, 40], [33, 41], [33, 42], [33, 43],
    [44, 35], [44, 36], [44, 37], [44, 38],
    // vertical bars
    [34, 35], [35, 35], [36, 35], [37, 35],
    [36, 46], [37, 46], [38, 46], [39, 46],
    // L-shape
    [40, 44], [41, 44], [42, 44], [42, 43], [42, 42], [42, 41],
    // diagonal staircase
    [34, 32], [35, 33], [36, 34],
  ];

  const hallwayZones: [number, number, number, number][] = [
    [9, 20, 11, 30], [38, 20, 40, 30], [20, 9, 30, 11], [20, 38, 30, 40],
  ];
  function inHallway(r: number, c: number) {
    return hallwayZones.some(([r1, c1, r2, c2]) => r >= r1 && r <= r2 && c >= c1 && c <= c2);
  }
  function isTeleport(r: number, c: number) {
    return TELEPORT_PADS.some(([tx, ty]) => tx === c && ty === r);
  }

  for (const [r, c] of coverWalls) {
    if (!inHallway(r, c) && !isTeleport(r, c)) map[r][c] = T_WALL;
  }

  return map;
}

/**
 * Star Gambit's Bazaar (call after applyChamberLayout('bazaar')): six market stalls on the corners of a hexagon around a
 * central plaza chamber, joined by 3-wide corridors. The ring: the top stall reaches each upper stall along a bent
 * corridor, each side has a corridor down from upper to lower stall, and the bottom stall reaches each lower stall the
 * same way. The hub: the top and bottom stalls have spokes into the plaza, and each side stall has a straight corridor
 * across into it.
 */
export function generateBazaarMap(): number[][] {
  const map: number[][] = Array.from({ length: MAP_ROWS }, () => new Array(MAP_COLS).fill(T_WALL));
  const fill = (r1: number, c1: number, r2: number, c2: number, t = T_FLOOR) => { for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) map[r][c] = t; };
  for (const [r1, c1, r2, c2] of CHAMBER_BOUNDS) fill(r1 + 1, c1 + 1, r2 - 1, c2 - 1);
  // The ring.
  fill(6, 12, 8, 24); fill(6, 12, 14, 14);   // top ↔ upper-left
  fill(6, 38, 8, 50); fill(6, 48, 14, 50);   // top ↔ upper-right
  fill(28, 12, 34, 14); fill(28, 48, 34, 50); // upper ↔ lower, each side
  fill(54, 12, 56, 24); fill(48, 12, 56, 14); // bottom ↔ lower-left
  fill(54, 38, 56, 50); fill(48, 48, 56, 50); // bottom ↔ lower-right
  // The hub.
  fill(15, 30, 24, 32); fill(38, 30, 47, 32); // spokes from the top and bottom stalls
  fill(25, 20, 27, 24); fill(35, 20, 37, 24); // upper-left and lower-left across into the plaza
  fill(25, 38, 27, 42); fill(35, 38, 37, 42); // upper-right and lower-right across into the plaza
  for (const [tx, ty] of TELEPORT_PADS) map[ty][tx] = T_TELEPORT;
  // Each stall has its own crate pattern (local row, col 0–12 from its top-left interior tile; pad at 6,6, edges kept clear).
  const bars = (r: number, c: number, len: number, down = false) => Array.from({ length: len }, (_, i) => down ? [r + i, c] : [r, c + i]);
  const STALL_CRATES: number[][][] = [
    [[2, 2], [2, 3], [3, 2], [2, 10], [2, 9], [3, 10], [10, 2], [9, 2], [10, 3], [10, 10], [10, 9], [9, 10]],          // ALPHA: corner brackets
    [...bars(3, 3, 3, true), ...bars(7, 3, 3, true), ...bars(3, 9, 3, true), ...bars(7, 9, 3, true)],                    // BETA: two broken shelves
    [...bars(3, 5, 3), ...bars(9, 5, 3), ...bars(5, 3, 3, true), ...bars(5, 9, 3, true)],                                // GAMMA: a broken ring round the pad
    [[2, 4], [3, 9], [5, 2], [4, 6], [6, 10], [8, 8], [9, 3], [10, 7]],                                                  // DELTA: scattered crates
    [[2, 2], [3, 3], [4, 4], [2, 10], [3, 9], [4, 8], [8, 4], [9, 3], [10, 2], [8, 8], [9, 9], [10, 10]],                // EPSILON: diagonal arms
    [...bars(3, 2, 3), ...bars(3, 8, 3), ...bars(9, 2, 3), ...bars(9, 8, 3)],                                            // ZETA: four counters
  ];
  CHAMBER_BOUNDS.slice(0, 6).forEach(([r1, c1], i) => { for (const [r, c] of STALL_CRATES[i]) map[r1 + 1 + r][c1 + 1 + c] = T_WALL; });
  // The plaza (local 0–12; pad at 6,6): four 2×2 pillars between the entrances.
  const [pr, pc] = CHAMBER_BOUNDS[6];
  for (const [r, c] of [[3, 3], [3, 8], [8, 3], [8, 8]]) fill(pr + 1 + r, pc + 1 + c, pr + 2 + r, pc + 2 + c, T_WALL);
  return map;
}

// Returns which chamber index a tile belongs to (-1 if none / hallway)
export function chamberOfTile(tileX: number, tileY: number): number {
  for (let i = 0; i < CHAMBER_BOUNDS.length; i++) {
    const [r1, c1, r2, c2] = CHAMBER_BOUNDS[i];
    if (tileY >= r1 && tileY <= r2 && tileX >= c1 && tileX <= c2) return i;
  }
  return -1;
}

// Hallway bounds [row1, col1, row2, col2] inclusive — must match generateMap's fillFloor calls.
// 0: top (ALPHA<->BETA), 1: bottom (DELTA<->GAMMA), 2: left (ALPHA<->DELTA), 3: right (BETA<->GAMMA)
export const HALLWAY_BOUNDS: readonly [number, number, number, number][] = [
  [9, 20, 11, 30],
  [38, 20, 40, 30],
  [20, 9, 30, 11],
  [20, 38, 30, 40],
];

// Returns which hallway index a tile belongs to (-1 if none / inside a chamber)
export function hallwayOfTile(tileX: number, tileY: number): number {
  for (let i = 0; i < HALLWAY_BOUNDS.length; i++) {
    const [r1, c1, r2, c2] = HALLWAY_BOUNDS[i];
    if (tileY >= r1 && tileY <= r2 && tileX >= c1 && tileX <= c2) return i;
  }
  return -1;
}

// ─── Enemy types ─────────────────────────────────────────────────────────────

export type EnemyType = 'normal' | 'armored' | 'fast' | 'bomber' | 'sniper' | 'healer' | 'charger' | 'ghost' | 'splitter' | 'mini_splitter' | 'shielder' | 'energy_leech' | 'lancer' | 'enchanter' | 'bleeder' | 'snatcher' | 'impostor' | 'shooter' | 'reflector' | 'trapper' | 'dropper' | 'blinker' | 'jammer' | 'spook' | 'grappler' | 'fiery_king' | 'splitter_queen' | 'queen_echo' | 'storm_reaper' | 'devourer' | 'frost_warden' | 'blind_prayer' | 'sea_chanter' | 'thorn_weaver' | 'aegis_sentinel' | 'aegis_construct' | 'astral_twins'
  | 'fish_blue' | 'fish_red' | 'stinger' | 'water_clone' | 'water_bomb' | 'jellyfish' | 'pufferfish'
  | 'seed_pod' | 'blossom' | 'sporeling' | 'vine_crawler' | 'angry_mushroom' | 'lifebloom'
  | 'moon_illusion' | 'mirror_mite' | 'moon_shade' | 'moon_hound' | 'moon_mimic' | 'cinder_wisp' | 'lost_soul' | 'soulless' | 'toxic_soulless' | 'sand_relic' | 'sand_core' | 'sand_scarab' | 'sand_scorpion' | 'dune_worm' | 'emberling' | 'scorch_sapper' | 'flare_spitter' | 'frost_anchor' | 'frostbiter' | 'sleet_mortar' | 'glacier_hulk' | 'lodestone' | 'grounder' | 'pulsar' | 'zealot' | 'bellringer' | 'mason' | 'penitent';

export const ENERGY_LEECH_DRAIN = 30;

export interface EnemyConfig {
  maxHp: number;
  speed: number;          // px per tick (at ~60 fps)
  color: string;
  shieldColor: string;
  bodyFraction: number;   // fraction of TILE_SIZE for body width
  scoreValue: number;
  damageToPlayer: number;
  damageToRuby: number;
  attackCooldown: number;
  attackRange: number;     // tile distance at which this enemy can attack
  bombExplodeRange: number;
}

export const JUPITER = {
  phaseHP: 1700, laterPhaseHPMult: 1.2, chargeTicks: 300, damageTaken: .2,
  pursuitEnergy: 100, secondPursuitEnergy: 120, laterPhaseEnergyMult: 1.1 * 1.05, energyDrainPerSecond: 1.2, energyPerDamage: .4,
  pursuitSpeed: 7.1, fleeSpeed: 8, playerRaceSpeed: 9, playerPursuitSpeed: 1.5, raceSpeedBoost: 1.4,
  catchupStartTiles: 8, catchupFullTiles: 20, catchupMultiplier: 2.25,
  boostCooldown: 180, boostTicks: 24, boostSpeed: 6,
  wallCooldown: 180, wallTicks: 1800, wallHalfLength: 1, wallDamage: 18, wallHealing: 17, wallEnergyDrain: 12,
  wallSlowTicks: 120, wallSlow: .55, exposedWallSlow: .18, fenceGuardTicks: 36, fenceGuardDamage: .1, playerBoostTicks: 24, playerBoostSpeed: 4,
  stormGrace: 90, stormInterval: 30, stormDamage: 14, stormRubyDamage: 7,
  shockTileCount: 20, shockTileRespawn: 180, shockSlowTicks: 120, shockSlow: .55, shockEnergy: 12,
  chargeBlastDamage: 60, chargeBlastTicks: 42,
  shardCount: 32, shardShare: .01, shardBossHealShare: .015, shardReach: .55, shardHeal: 4,
  fragmentCount: 2, fragmentChargeTicks: 480, fragmentBoost: 1.35,
  miniStormsPerRoom: 2, miniStormSpeed: 2.8, miniStormChaseSpeed: 4.6, miniStormChaseRange: 6,
  miniStormDamage: 10, miniStormHitCooldown: 60,
  trailTicks: 300, trailSlow: .7, trailSlowTicks: 12, trailMaxTiles: 65,
  coverMinInterval: 240, coverMaxInterval: 360, coverWarningTicks: 72, coverRetractTicks: 18, coverRiseTicks: 18,
  celestialShare: .2, meteorShare: .1,
} as const;

export function jupiterPhaseHP(phase:number) { return Math.round(JUPITER.phaseHP*(phase>=2?JUPITER.laterPhaseHPMult:1)); }
export function jupiterPhaseFloorHP(phase:number) { return phase===1?jupiterPhaseHP(2)+jupiterPhaseHP(3):phase===2?jupiterPhaseHP(3):0; }
export function jupiterPhaseCeilHP(phase:number) { return jupiterPhaseFloorHP(phase)+jupiterPhaseHP(phase); }
export function jupiterPhaseOfHP(hp:number):1|2|3 { return hp>jupiterPhaseCeilHP(2)?1:hp>jupiterPhaseCeilHP(3)?2:3; }

export const SUN = {
  phaseHP: 3000, meteorShare: .1, solarShare: .04, stations: 5, stationReach: 1.6, stationBossReach: 2.5, // solarShare: Solar Flare (F) hits the King for this share of a phase
  stationChargeTicks: 300, stationTrickle: .6, stationCooling: 11.96, stationHealing: 25, stationRubyHealing: 25,
  waveRadius: 8, waveCooldown: 330, waveVisualTicks: 36, waveDamage: 1, waveCooling: 2, waveStationCharge: 45, waveSlowTicks: 90, waveSlowMult: .5,
  rapidCooldown: 12, afterQuenchCooldown: 120, // afterQuenchCooldown: C returns as an ordinary wave 2s after the extinguished window ends
  empoweredDamage: .045, empoweredNormalDamage: 10, quenchTicks: 600, quenchDelayTicks: 120,
  quenchEnemyTickInterval: 2, // zero temperature: enemy movement, windups and attacks run at half speed
  wispHP: 3, initialWisps: 12, wispCap: 80, wispBatch: 4, wispGap: 240,
  bossWispGap: 360, arenaWisps: 18, heatPerWisp: .06,
  ragePerSecond: 1.75, lateRagePerSecond: 2.6, phase3RageMult: 1.05, rageCalmTicks: 600, rageCalmMult: .8 * .65, lateRageCalmMult: .65 / 1.3, rageCooling: 20, rageOnHit: .1, eruptionDamage: 75, // rageOnHit: rage removed per HP the King loses
  // Phase 2+: above trailRage the King sets the tiles he walks on burning for trailTicks. Standing on one costs trailDamage
  // (Ruby trailRubyDamage) and adds trailHeat every trailGap ticks. Water puts them out.
  trailRage: 20, trailRadius: 1, trailTicks: 600, trailCap: 80, trailGap: 30, trailDamage: 3, trailRubyDamage: 2, trailHeat: .5,
  // Phase 3: every flareGap ticks a room is marked for flareWarning ticks, then flares (+flareHeat). Water landing in that
  // room, a station burst there, or Solar Flare defuses it (-flareDefuseCool heat instead).
  flareGap: [600, 840] as const, flareWarning: 480, flareHeat: 25, flareDefuseCool: 5, flareDamage: 25, // flareWarning: 8s; flareDamage: to you and placed Ruby inside the room
  // Phase 3: Scorch Sappers arrive every sapperGap ticks (at most sapperCap), walk to the nearest cooling station and drain
  // sapperDrain % of its charge and sapperHeat heat per second while beside it. Water deals its normal damage.
  sapperFromPhase: 3, sapperGap: 480, sapperCap: 2, sapperHP: 10, sapperSoundGap: 60, sapperDrain: 12, sapperHeat: .5,
  spitter: { fromPhase: 2, chance: .35, cap: 3, warningTicks: 42, shotSpeed: 7.2, shotLife: 83, fireTicks: 180, spread: .24, hitStun: 48, armor: .1 }, // armor: like the Emberling, it takes this share of damage until water douses it // hitStun: a fireball that hits you stuns you this long
  alienSpawnRate: 1, // regular alien spawn frequency multiplier on Sun
  extraPlainChance: .06, // phase 2+: chance each regular spawn brings one extra ordinary (shared-pool) alien, within the cap
  emberlingSpawnChance: .4, emberlingArmor: .1, emberlingKnockback: 2,
} as const;

// Shared timed expansion for ordinary slots on eight challenges; Saturn/Sirius apply it to their Normal slots.
export const CHALLENGE_EXTRA_POOL = { afterTicks: 3600, commonWeight: 4, normalWeight: 4, shooterWeight: 1 } as const; // after 60s Normal loses its double weight (normalWeight, like the rest)

// Tiles a regular alien's hit on the player pushes them away (Bomber: its explosion).
export const CHARGER_KNOCKBACK = 3; // tiles a Charger's rush pushes the player along its lane
export const ALIEN_KNOCKBACK: Partial<Record<EnemyType, number>> = { armored: 2, fast: 1, ghost: 1, bomber: 2, lancer: 3 };
// Global walking/hunting speed for the player and every unit, in every mode (attack rolls and projectiles excluded).
export const MOVE_SPEED_MULT = 1.02;
// Small screen shake when any knockback starts pushing the player (peak about 3px, fading over 0.2s).
export const KNOCKBACK_SHAKE_TICKS = 12;
export const KNOCKBACK_SHAKE_AMOUNT = 6;

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  // Saturn aliens: their attacks live in saturn.ts (SATURN.frostbiter / mortar / hulk); damage values here are for reference.
  frost_anchor: { maxHp: 45, speed: 0, color: '#9ab5ef', shieldColor: '#dcf4ff', bodyFraction: .8, scoreValue: 0,
    damageToPlayer: 0, damageToRuby: 0, attackCooldown: 9999, attackRange: 0, bombExplodeRange: 0 },
  frostbiter: { // pounces onto the tile you stood on and strips your shield
    maxHp: 12, speed: 1.4, color: '#8fe3ff', shieldColor: '#e4ffff', bodyFraction: .66, scoreValue: 20,
    damageToPlayer: 14, damageToRuby: 10, attackCooldown: 120, attackRange: 4, bombExplodeRange: 0,
  },
  sleet_mortar: { // Hailer: keeps away and shells your tile and either side, freezing where shells land
    maxHp: 12, speed: .55, color: '#a7c4ff', shieldColor: '#e4ffff', bodyFraction: .72, scoreValue: 22,
    damageToPlayer: 10, damageToRuby: 7, attackCooldown: 240, attackRange: 9, bombExplodeRange: 0,
  },
  glacier_hulk: { // slow and tough, the Warden's favourite; slams the 5×5 area around it
    maxHp: 40, speed: 1.3, color: '#7fb3e6', shieldColor: '#e4ffff', bodyFraction: .92, scoreValue: 32,
    damageToPlayer: 18, damageToRuby: 12, attackCooldown: 210, attackRange: 2, bombExplodeRange: 0,
  },
  // Sirius aliens: their attacks live in sirius.ts (SIRIUS.zealot / bellringer); damage values here are for reference.
  zealot: { // braces, then dashes straight through you, knocking you far back
    maxHp: 22, speed: 1.9, color: '#f2e6c8', shieldColor: '#ff6a4d', bodyFraction: .7, scoreValue: 22,
    damageToPlayer: 12, damageToRuby: 9, attackCooldown: 150, attackRange: 5, bombExplodeRange: 0,
  },
  bellringer: { // rings its bell: a pulse that hurts and pushes you away
    maxHp: 28, speed: 1.1, color: '#e9c98a', shieldColor: '#fff2c4', bodyFraction: .78, scoreValue: 24,
    damageToPlayer: 8, damageToRuby: 6, attackCooldown: 240, attackRange: 3, bombExplodeRange: 0,
  },
  penitent: { // Sirius phase 3: walks your trail and erases it
    maxHp: 22, speed: 2.3, color: '#5a5262', shieldColor: '#d8cfc0', bodyFraction: .75, scoreValue: 26,
    damageToPlayer: 0, damageToRuby: 0, attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  mason: { // Sirius phase 2+: raises a short temporary wall of holy stone ahead of you
    maxHp: 24, speed: 1.0, color: '#9a94ad', shieldColor: '#ffe27a', bodyFraction: .8, scoreValue: 26,
    damageToPlayer: 0, damageToRuby: 0, attackCooldown: 240, attackRange: 7, bombExplodeRange: 0,
  },
  soulless: { // Singularity: a soulless skeleton that hunts you; the swarm will not eat it (spawned by singularity-maw.ts)
    maxHp: 30, speed: 4, color: '#c5bcae', shieldColor: '#eee4d2', bodyFraction: .9, scoreValue: 15,
    damageToPlayer: 12, damageToRuby: 11, attackCooldown: 80, attackRange: 6, bombExplodeRange: 0,
  },
  toxic_soulless: { // Singularity phase 3: a Soulless full of gas; it leaves a trail of gas puffs as it walks
    maxHp: 30, speed: 0.9, color: '#7dff8a', shieldColor: '#c6ffb0', bodyFraction: .6, scoreValue: 15,
    damageToPlayer: 8, damageToRuby: 7, attackCooldown: 60, attackRange: 1, bombExplodeRange: 0,
  },
  lost_soul: { // Singularity: a harmless wanderer the swarm eats to grow; one hit kills it
    maxHp: 1, speed: 0, color: '#d8fff0', shieldColor: '#9dff8a', bodyFraction: .5, scoreValue: 0,
    damageToPlayer: 0, damageToRuby: 0, attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  sand_core: { // Venus phase 3: his core, buried in the sand; it can only be destroyed once every totem is gone
    maxHp: 45, speed: 0, color: '#78dedf', shieldColor: '#ffd27a', bodyFraction: .7, scoreValue: 0,
    damageToPlayer: 0, damageToRuby: 0, attackCooldown: 999, attackRange: 0, bombExplodeRange: 0,
  },
  sand_scorpion: { // Venus phase 3: lies hidden under the sand on one tile; bursts up beside you with a hard, knockback sting
    maxHp: 40, speed: 0, color: '#9a6a2c', shieldColor: '#e3c08a', bodyFraction: .7, scoreValue: 25,
    damageToPlayer: 7, damageToRuby: 5, attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  dune_worm: { // Venus alien: tunnels under the sand, bursts up beside you with a knockback bite, then digs back down
    maxHp: 9, speed: 2.8, color: '#a8743a', shieldColor: '#e3c08a', bodyFraction: .6, scoreValue: 15,
    damageToPlayer: 7, damageToRuby: 6, attackCooldown: 90, attackRange: 1, bombExplodeRange: 0,
  },
  sand_scarab: { // Venus: a desert beetle that bursts out of a buried nest when a Sand Swirl uncovers it
    maxHp: 8, speed: 2.6, color: '#b0763a', shieldColor: '#e3c08a', bodyFraction: .55, scoreValue: 8,
    damageToPlayer: 4, damageToRuby: 3, attackCooldown: 60, attackRange: 1, bombExplodeRange: 0,
  },
  sand_relic: { // Venus: a relic buried in the sand; one hit breaks it for a helpful effect
    maxHp: 1, speed: 0, color: '#e3c08a', shieldColor: '#fff1d0', bodyFraction: .5, scoreValue: 0,
    damageToPlayer: 0, damageToRuby: 0, attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  cinder_wisp: {
    maxHp: 3, speed: 0, color: '#ff9c42', shieldColor: '#ffe3a0', bodyFraction: .5, scoreValue: 0,
    damageToPlayer: 0, damageToRuby: 0, attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  scorch_sapper: { // Sun phase 3: ignores you and Ruby and drains cooling stations
    maxHp: 10, speed: 2.9, color: '#ffb347', shieldColor: '#ffe0a0', bodyFraction: .55, scoreValue: 15,
    damageToPlayer: 0, damageToRuby: 0, attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  flare_spitter: {
    maxHp: 4, speed: 1.625, color: '#e88836', shieldColor: '#ffe2a1', bodyFraction: .8, scoreValue: 20,
    damageToPlayer: 6, damageToRuby: 6, attackCooldown: 90, attackRange: 10, bombExplodeRange: 0,
  },
  emberling: {
    maxHp: 4, speed: 2.65, color: '#ff6540', shieldColor: '#ffd88a', bodyFraction: 0.72, scoreValue: 15,
    damageToPlayer: 9, damageToRuby: 7, attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  // Neptune challenge units. Fish and water objects never attack; stingers poison on hit.
  fish_blue: {
    maxHp: 1, speed: 1.3, color: '#59c8ff', shieldColor: '#bfe9ff',
    bodyFraction: 0.5, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  fish_red: {
    maxHp: 1, speed: 1.3, color: '#ff5a6a', shieldColor: '#ffc2c8',
    bodyFraction: 0.5, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  stinger: {
    maxHp: 6, speed: 1.3, color: '#3fd6b0', shieldColor: '#a8f5e2',
    bodyFraction: 0.68, scoreValue: 15, damageToPlayer: 5, damageToRuby: 3.5,
    attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  jellyfish: { // fragile; killing one during a dive reveals a clone
    maxHp: 2, speed: 0.5, color: '#ff9ce6', shieldColor: '#ffd6f4',
    bodyFraction: 0.66, scoreValue: 10, damageToPlayer: 6, damageToRuby: 3.5,
    attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  pufferfish: { // chases you, swells up when close, then bursts into spikes that knock you back (melee handled by the challenge)
    maxHp: 7, speed: 2.5, color: '#ffc94a', shieldColor: '#fff0b8',
    bodyFraction: 0.7, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 150, attackRange: 0, bombExplodeRange: 0,
  },
  water_clone: {
    maxHp: 8, speed: 3.0, color: '#6fc7ff', shieldColor: '#d8f2ff',
    bodyFraction: 0.9, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  water_bomb: {
    maxHp: 6, speed: 0, color: '#7fd0ff', shieldColor: '#e1f6ff',
    bodyFraction: 0.6, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  // Gaia challenge units. Pods and blossoms are her plants (objectives, no rewards); sporelings and crawlers are aliens.
  seed_pod: {
    maxHp: 6, speed: 0, color: '#c6e86a', shieldColor: '#eaffb0',
    bodyFraction: 0.55, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  blossom: {
    maxHp: 12, speed: 0, color: '#ff8fc8', shieldColor: '#ffd6ec',
    bodyFraction: 0.7, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  // Moon challenge: an illusion of the Shadow Queen. Looks and attacks exactly like her disguise; shatters when destroyed.
  moon_illusion: {
    maxHp: 4, speed: 0, color: '#dd88ff', shieldColor: '#dd88ff',
    bodyFraction: 0.80, scoreValue: 0, damageToPlayer: 3, damageToRuby: 2,
    attackCooldown: 70, attackRange: 8, bombExplodeRange: 0,
  },
  grounder: { // Binary Star alien (phase 2+): a heavy anchor that escorts a twin; twins near it ignore magnetic fields
    maxHp: 30, speed: 1.5, color: '#9aa3b5', shieldColor: '#e2e6ee',
    bodyFraction: 0.78, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 999, attackRange: 0, bombExplodeRange: 0,
  },
  pulsar: { // Binary Star alien: a polarized chaser whose death leaves a strong magnetic field that then explodes
    maxHp: 12, speed: 0.9, color: '#e7b3ff', shieldColor: '#f6e8ff',
    bodyFraction: 0.66, scoreValue: 15, damageToPlayer: 6, damageToRuby: 4,
    attackCooldown: 70, attackRange: 1, bombExplodeRange: 0,
  },
  lodestone: { // Binary Star alien: a slow chaser carrying a north or south pole; it pushes or pulls you like a magnet
    maxHp: 10, speed: 0.8, color: '#c9b8ff', shieldColor: '#f1ecff',
    bodyFraction: 0.7, scoreValue: 15, damageToPlayer: 8, damageToRuby: 5,
    attackCooldown: 55, attackRange: 1, bombExplodeRange: 0, // plus the Magnet Snap (LODESTONE_SNAP)
  },
  mirror_mite: { // Moon alien: fragile and quick; killing one heals you a lot
    maxHp: 1, speed: 1.1, color: '#c6b8ff', shieldColor: '#efe8ff',
    bodyFraction: 0.55, scoreValue: 10, damageToPlayer: 4, damageToRuby: 3,
    attackCooldown: 60, attackRange: 1, bombExplodeRange: 0,
  },
  moon_shade: { // Moon alien: a translucent shadow that always hunts a placed Ruby (you only while you carry it)
    maxHp: 11, speed: 2, color: '#7a5cc8', shieldColor: '#c9b6ff',
    bodyFraction: 0.75, scoreValue: 15, damageToPlayer: 4, damageToRuby: 6,
    attackCooldown: 72, attackRange: 1, bombExplodeRange: 0,
  },
  moon_hound: { // Moon alien: a fast crystal beast that only hunts you; its bite knocks you back (like Gaia's Ragecap)
    maxHp: 10, speed: 3, color: '#6fc8ff', shieldColor: '#d6f2ff',
    bodyFraction: 0.75, scoreValue: 20, damageToPlayer: 4, damageToRuby: 0,
    attackCooldown: 75, attackRange: 1, bombExplodeRange: 0,
  },
  moon_mimic: { // Moon alien (phase 2+): wanders, then sits still looking exactly like a Queen illusion; never chases or attacks
    maxHp: 5, speed: 0.9, color: '#9a8cd0', shieldColor: '#d8d0ff',
    bodyFraction: 0.75, scoreValue: 15, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 1, bombExplodeRange: 0,
  },
  lifebloom: { // friendly: a phase 3 flower that heals you and Ruby when broken
    maxHp: 1, speed: 0, color: '#9fffc8', shieldColor: '#e8fff0',
    bodyFraction: 0.6, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  sporeling: {
    maxHp: 5, speed: 0.9, color: '#b9a8ff', shieldColor: '#e2d9ff',
    bodyFraction: 0.66, scoreValue: 15, damageToPlayer: 5, damageToRuby: 4,
    attackCooldown: 120, attackRange: 8, bombExplodeRange: 0,
  },
  angry_mushroom: { // fast melee; its hit knocks you back two tiles, and it leaves vines where it runs
    maxHp: 14, speed: 3, color: '#ff5a4a', shieldColor: '#ffc2b8',
    bodyFraction: 0.7, scoreValue: 20, damageToPlayer: 3, damageToRuby: 2,
    attackCooldown: 80, attackRange: 1, bombExplodeRange: 0,
  },
  vine_crawler: {
    maxHp: 8, speed: 1.2, color: '#5fbf4a', shieldColor: '#b6f0a0',
    bodyFraction: 0.7, scoreValue: 15, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  normal: {
    maxHp: 5, speed: 0.884, color: '#44ee44', shieldColor: '#44ee44',
    bodyFraction: 0.7, scoreValue: 10, damageToPlayer: 10, damageToRuby: 6,
    attackCooldown: 55, attackRange: 1, bombExplodeRange: 0,
  },
  armored: {
    maxHp: 22, speed: 0.611, color: '#4488ff', shieldColor: '#88bbff',
    bodyFraction: 0.82, scoreValue: 25, damageToPlayer: 15, damageToRuby: 10,
    attackCooldown: 70, attackRange: 2, bombExplodeRange: 0,
  },
  fast: {
    maxHp: 4, speed: 5.5, color: '#ff8844', shieldColor: '#ff8844',
    bodyFraction: 0.45, scoreValue: 15, damageToPlayer: 6, damageToRuby: 3,
    attackCooldown: 40, attackRange: 2, bombExplodeRange: 0,
  },
  bomber: {
    maxHp: 6, speed: 0.689, color: '#cc44ff', shieldColor: '#cc44ff',
    bodyFraction: 0.78, scoreValue: 30, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 999, attackRange: 1, bombExplodeRange: 4,
  },
  sniper: {
    maxHp: 5, speed: 0.442, color: '#ffee00', shieldColor: '#ffee00',
    bodyFraction: 0.64, scoreValue: 20, damageToPlayer: 12, damageToRuby: 12,
    attackCooldown: 130, attackRange: 1, bombExplodeRange: 0,
  },
  healer: {
    maxHp: 11, speed: 0.546, color: '#ff55cc', shieldColor: '#ff55cc',
    bodyFraction: 0.72, scoreValue: 12, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  charger: {
    maxHp: 17, speed: 0.975, color: '#ff4400', shieldColor: '#ff4400',
    bodyFraction: 0.76, scoreValue: 22, damageToPlayer: 25, damageToRuby: 17.5,
    attackCooldown: 90, attackRange: 1, bombExplodeRange: 0,
  },
  ghost: {
    maxHp: 4, speed: 1.157, color: '#8855ff', shieldColor: '#8855ff',
    bodyFraction: 0.60, scoreValue: 18, damageToPlayer: 12, damageToRuby: 9,
    attackCooldown: 50, attackRange: 3, bombExplodeRange: 0,
  },
  splitter: {
    maxHp: 17, speed: 1.066, color: '#66ff33', shieldColor: '#66ff33',
    bodyFraction: 0.80, scoreValue: 28, damageToPlayer: 11, damageToRuby: 8,
    attackCooldown: 60, attackRange: 2, bombExplodeRange: 0,
  },
  mini_splitter: {
    maxHp: 4, speed: 1.235, color: '#88ff55', shieldColor: '#88ff55',
    bodyFraction: 0.52, scoreValue: 5, damageToPlayer: 6, damageToRuby: 4,
    attackCooldown: 35, attackRange: 1, bombExplodeRange: 0,
  },
  shielder: {
    maxHp: 10, speed: 0.572, color: '#00ddcc', shieldColor: '#00ddcc',
    bodyFraction: 0.74, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 999, attackRange: 0, bombExplodeRange: 0,
  },
  shooter: {
    maxHp: 8, speed: 0.55, color: '#8fa83a', shieldColor: '#e4f0a8',
    bodyFraction: 0.68, scoreValue: 22, damageToPlayer: 8, damageToRuby: 5,
    attackCooldown: 120, attackRange: 9, bombExplodeRange: 0,
  },
  reflector: {
    maxHp: 12, speed: 0.55, color: '#a8c8ff', shieldColor: '#ffffff', // a cool periwinkle neon, like the other aliens
    bodyFraction: 0.8, scoreValue: 22, damageToPlayer: 9, damageToRuby: 6,
    attackCooldown: 60, attackRange: 1, bombExplodeRange: 0,
  },
  grappler: {
    maxHp: 14, speed: 0.85, color: '#42b9a9', shieldColor: '#ccfff2',
    bodyFraction: 0.8, scoreValue: 28, damageToPlayer: 6, damageToRuby: 0,
    attackCooldown: 150, attackRange: 10, bombExplodeRange: 0,
  },
  spook: {
    maxHp: 1, speed: 1.05, color: '#b8c4a7', shieldColor: '#f0f4df',
    bodyFraction: 0.65, scoreValue: 16, damageToPlayer: 4, damageToRuby: 2,
    attackCooldown: 90, attackRange: 1, bombExplodeRange: 0,
  },
  jammer: {
    maxHp: 8, speed: 1.10, color: '#ba6c99', shieldColor: '#f5c4df',
    bodyFraction: 0.72, scoreValue: 24, damageToPlayer: 5, damageToRuby: 0,
    attackCooldown: 90, attackRange: 1, bombExplodeRange: 0,
  },
  blinker: {
    maxHp: 3, speed: 1.25, color: '#454b56', shieldColor: '#bcc6d4',
    bodyFraction: 0.58, scoreValue: 16, damageToPlayer: 5, damageToRuby: 3,
    attackCooldown: 75, attackRange: 1, bombExplodeRange: 0,
  },
  dropper: {
    maxHp: 10, speed: 0.7, color: '#dca34f', shieldColor: '#fff0be',
    bodyFraction: 0.76, scoreValue: 22, damageToPlayer: 12, damageToRuby: 8,
    attackCooldown: 90, attackRange: 12, bombExplodeRange: 0,
  },
  trapper: {
    maxHp: 7, speed: 0.9, color: '#a0705a', shieldColor: '#e8c4a8',
    bodyFraction: 0.72, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  impostor: {
    maxHp: 10, speed: 1.0, color: '#9a9a9a', shieldColor: '#dddddd',
    bodyFraction: 0.9, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  snatcher: {
    maxHp: 16, speed: 1.2, color: '#b07a2c', shieldColor: '#f0cd8c',
    bodyFraction: 0.72, scoreValue: 35, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 1, bombExplodeRange: 0,
  },
  bleeder: {
    maxHp: 6, speed: 1.6, color: '#8f93ad', shieldColor: '#d4d6e6',
    bodyFraction: 0.6, scoreValue: 22, damageToPlayer: 6, damageToRuby: 4,
    attackCooldown: 60, attackRange: 1, bombExplodeRange: 0,
  },
  enchanter: {
    maxHp: 14, speed: 0.5, color: '#c8243c', shieldColor: '#ffb3bd',
    bodyFraction: 0.74, scoreValue: 30, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 360, attackRange: 6, bombExplodeRange: 0,
  },
  lancer: {
    maxHp: 12, speed: 0.6, color: '#ff3d6e', shieldColor: '#ffb3c6',
    bodyFraction: 0.74, scoreValue: 26, damageToPlayer: 33.6, damageToRuby: 21.6,
    attackCooldown: 180, attackRange: 8, bombExplodeRange: 0,
  },
  energy_leech: {
    maxHp: 8, speed: 1.8, color: '#c77aff', shieldColor: '#e7baff',
    bodyFraction: 0.66, scoreValue: 20, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 75, attackRange: 1, bombExplodeRange: 0,
  },
  fiery_king: {
    maxHp: 121, speed: 0.48, color: '#cc0022', shieldColor: '#ff4444',
    bodyFraction: 1.55, scoreValue: 500, damageToPlayer: 40, damageToRuby: 35,
    attackCooldown: 45, attackRange: 2, bombExplodeRange: 0,
  },
  splitter_queen: {
    maxHp: 50, speed: 0, color: '#cc33ff', shieldColor: '#ee99ff',
    bodyFraction: 0.95, scoreValue: 400, damageToPlayer: 7, damageToRuby: 10,
    attackCooldown: 70, attackRange: 8, bombExplodeRange: 0,
  },
  queen_echo: {
    maxHp: 1, speed: 0, color: '#dd88ff', shieldColor: '#dd88ff',
    bodyFraction: 0.80, scoreValue: 0, damageToPlayer: 5, damageToRuby: 4,
    attackCooldown: 55, attackRange: 8, bombExplodeRange: 0,
  },
  storm_reaper: {
    maxHp: 60, speed: 4.0, color: '#52ffd6', shieldColor: '#c2ffec',
    bodyFraction: 1.1, scoreValue: 450, damageToPlayer: 20, damageToRuby: 0,
    attackCooldown: 24, attackRange: 1, bombExplodeRange: 0, // 40 / 1.7 ≈ 24 — attacks 1.7x faster
  },

  devourer: {
    maxHp: 35, speed: 3.4, color: '#6b2fa8', shieldColor: '#b088e0',
    bodyFraction: 0.95, scoreValue: 480, damageToPlayer: 6, damageToRuby: 2,
    attackCooldown: 60, attackRange: 2, bombExplodeRange: 0,
  },
  blind_prayer: {
    maxHp: 80, speed: 2.0, color: '#ffdd22', shieldColor: '#fff199',
    bodyFraction: 1.05, scoreValue: 470, damageToPlayer: 6, damageToRuby: 0,
    attackCooldown: 720, attackRange: 6, bombExplodeRange: 0, // matches normal player WAVE_RADIUS
  },
  sea_chanter: {
    maxHp: 90, speed: 3.8, color: '#3998d6', shieldColor: '#c7e9ff',
    bodyFraction: 1.05, scoreValue: 470, damageToPlayer: 10, damageToRuby: 7,
    attackCooldown: 210, attackRange: 12, bombExplodeRange: 0,
  },
  thorn_weaver: {
    maxHp: 80, speed: 2.8, color: '#88bc45', shieldColor: '#d8ef9b',
    bodyFraction: 0.95, scoreValue: 480, damageToPlayer: 12, damageToRuby: 0,
    attackCooldown: 240, attackRange: 100, bombExplodeRange: 0,
  },
  frost_warden: {
    // Pure field-controller — no direct attack, so damageToPlayer/damageToRuby/attackCooldown/
    // attackRange are unused (kept only because EnemyConfig requires every field).
    maxHp: 100, speed: 0, color: '#aaeeff', shieldColor: '#ffffff',
    bodyFraction: 0.9, scoreValue: 460, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 65, attackRange: 10, bombExplodeRange: 0,
  },
  aegis_sentinel: {
    maxHp: 90, speed: 4.0, color: '#c5a35d', shieldColor: '#78dedf', // shielded speed, a touch above Sea Chanter
    bodyFraction: 1.05, scoreValue: 500, damageToPlayer: 12, damageToRuby: 8,
    attackCooldown: 75, attackRange: 2, bombExplodeRange: 0,
  },
  aegis_construct: {
    maxHp: 24, speed: 0, color: '#78dedf', shieldColor: '#d5ffff',
    bodyFraction: 0.8, scoreValue: 0, damageToPlayer: 0, damageToRuby: 0,
    attackCooldown: 0, attackRange: 0, bombExplodeRange: 0,
  },
  astral_twins: {
    maxHp: 60, speed: 2.9, color: '#f08062', shieldColor: '#ffe5c5',
    bodyFraction: 0.9, scoreValue: 500, damageToPlayer: 10, damageToRuby: 7,
    attackCooldown: 65, attackRange: 1, bombExplodeRange: 0,
  },
};

export const BOSS_SPAWN_INTERVAL = 1890; // 31.5s after boss death + 3.5s warning = 35s until the next boss
export const BOSS_WARNING_TICKS = 210;  // ticks of warning before boss appears (~3.5s)
export const BOSS_ANNOUNCEMENT_TICKS = 240; // show the spawned boss's name for 4 seconds
export const BOSS_NAMES = {
  fiery_king: 'FIERY KING',
  splitter_queen: 'SHADOW QUEEN',
  storm_reaper: 'STORM REAPER',
  devourer: 'SOUL DEVOURER',
  frost_warden: 'FROST WARDEN',
  blind_prayer: 'BLIND PRAYER',
  sea_chanter: 'SEA CHANTER',
  thorn_weaver: 'THORN WEAVER',
  aegis_sentinel: 'AEGIS SENTINEL',
  astral_twins: 'ASTRAL TWINS',
} as const;
export type BossType = keyof typeof BOSS_NAMES;
export const BOSS_TYPES = Object.keys(BOSS_NAMES) as BossType[];
export function isBossType(type: EnemyType): type is BossType {
  return BOSS_TYPES.includes(type as BossType);
}
export const AEGIS_DAMAGE_MULT = 0.05;
export const AEGIS_REFLECT_RATIO = 1; // Return 100% of incoming damage before Aegis reduction.
export const AEGIS_EXPOSE_TICKS = 1200;
export const AEGIS_RESHIELD_WARNING_TICKS = 180; // 3s warning before a fresh totem pair restores the shield
export const AEGIS_EXPOSED_SPEED = 1.19; // core exposed: slow, open to attack
export const TOTEM_LIFETIME_TICKS = 1200;
export const TOTEM_OVERLOAD_WINDUP = 180;
export const TOTEM_OVERLOAD_DAMAGE = 80;
export const TWIN_REVIVE_TICKS = 720;
export const TWIN_REVIVE_HP_RATIO = 0.6;
export const TWIN_REVIVE_HASTE_TICKS = 300; // 5s speed burst after reviving
export const TWIN_REVIVE_HASTE_MULT = 1.4;
// While its partner is down, the survivor goes berserk until the revival.
export const TWIN_BERSERK_SPEED_MULT = 1.25;
export const TWIN_BERSERK_COOLDOWN_MULT = 0.6;
export const TWIN_BERSERK_DAMAGE_TAKEN = 0.65;
export const TWIN_MELEE_KNOCKBACK = 2; // tiles Dawn's melee hit pushes the player
export const TWIN_MIN_SEPARATION = 6; // preferred spacing; tight passages can compress it
export const TWIN_RANGED_RANGE = 9;
export const TWIN_RANGED_SPEED = 3.8;
export const TWIN_RANGED_WINDUP = 36;
export const TWIN_RANGED_COOLDOWN = 100;
export const TWIN_RANGED_DAMAGE = 8;
export const TWIN_TRANSFER_MIN_TICKS = 360;
export const TWIN_TRANSFER_MAX_TICKS = 540;
export const TWIN_TRANSFER_RATIO = 0.3;
export const TWIN_TRANSFER_FX_TICKS = 60;
export const PRAYER_FLEE_REPATH_TICKS = 30;
export const THORN_WINDUP = 90; // locked ground target, 1.5s to leave
export const THORN_FIRST_DELAY = 120;
export const THORN_RADIUS = TILE_SIZE * 2;
export const THORN_DEFENSE_RADIUS = TILE_SIZE * 3;
export const THORN_DEFENSE_TRIGGER_RANGE = TILE_SIZE * 3;
export const THORN_DEFENSE_COOLDOWN = 720; // 12s, independent of aimed casts
// Four whole tiles per side, snapped to the nearest grid intersection.
// Shared by warning/plant rendering and actual hazard membership.
export function getThornFieldBounds(x: number, y: number, radius = THORN_RADIUS) {
  const centerX=Math.round(x/TILE_SIZE)*TILE_SIZE,centerY=Math.round(y/TILE_SIZE)*TILE_SIZE;
  return {x:centerX,y:centerY,left:centerX-radius,top:centerY-radius,right:centerX+radius,bottom:centerY+radius};
}
/** Tile membership shared by thorn damage, Sunfire clearing and field rendering. */
export function thornFieldContainsTile(field:{x:number;y:number;radius?:number;clearedTiles?:number[]},tx:number,ty:number){
  const bounds=getThornFieldBounds(field.x,field.y,field.radius),x=(tx+.5)*TILE_SIZE,y=(ty+.5)*TILE_SIZE;
  return x>=bounds.left&&x<bounds.right&&y>=bounds.top&&y<bounds.bottom&&!field.clearedTiles?.includes(ty*MAP_COLS+tx);
}
export const THORN_LIFETIME = 840; // 14s, about three simultaneous patches
export const THORN_MAX_PATCHES = 4;
export const THORN_POISON_TICKS = 240; // 4s, refreshed but never stacked
export const THORN_POISON_INTERVAL = 60;
export const THORN_POISON_DAMAGE = 2;
export const THORN_CONTACT_DAMAGE = 1;
export const THORN_CONTACT_INTERVAL = 45; // 0.75s while standing in plants
export const THORN_SLOW_MULT = 0.8; // only while physically inside plants
export const THORN_FLEE_RANGE = 24;
export const SEA_DIVE_DAMAGE_MULTIPLIER = 1.6;
export const SEA_DIVE_SPEED = 4.0;
export const SEA_DIVE_FLEE_RANGE = 18; // tiles, roughly one chamber wide
export const SEA_DIVE_ENTER_HP = 0.4;
export const SEA_DIVE_EXIT_HP = 0.75;
export const SEA_MINIMAP_INTERVAL = 480; // ticks: one reveal every 8 seconds
export const SEA_MINIMAP_REVEAL = 60; // ticks: visible for 1 second
export const SEA_ALLY_HEAL_RADIUS = 12; // tiles; broad circular area, not restricted to chambers
export const SEA_ALLY_HEAL_INTERVAL = 180; // 3 seconds while surfaced
export const SEA_ALLY_PASSIVE_HEAL = 3;
export const SEA_ALLY_HEAL_AMOUNT = 10; // per hit on surfaced Sea Chanter
export const SEA_FEED_HEAL_RATIO = 0.8; // actual HP damage dealt to other aliens
export const SEA_HEALING_BLOCK_TICKS = 180; // 3s after taking HP damage while diving
export const SEA_FEED_HEAL_CAP = 25; // max healing from one hit on one alien
export const SEA_SONG_WINDUP = 24;
export const SEA_SONG_FIRST_DELAY = 120;
export const SEA_SONG_SPEED = 20; // px/tick
export const SEA_SONG_HIT_RADIUS = 25; // px
export const SEA_SONG_BLAST_RADIUS = TILE_SIZE * 6;
export const SEA_SONG_BLAST_TICKS = 24;
export const SEA_SONG_BLAST_DAMAGE_CENTER = 15;
export const SEA_SONG_BLAST_DAMAGE_EDGE = 5;
export const PRAYER_RUBY_COOLDOWN = 1800; // 30s between ritual starts, only while the Ruby is placed
export const PRAYER_RUBY_WINDUP = 90; // 1.5s to pick the Ruby up and cancel the ritual
export const PRAYER_ESCAPE_WINDUP = 36; // 0.6s visible warning before the close-range attack
export const PRAYER_ESCAPE_DURATION = 150; // 2.5s speed burst
export const PRAYER_ESCAPE_SPEED = 5.4; // short burst outruns normal movement; player speed boost still counters it
export const PRAYER_ESCAPE_GRACE = 180; // no escape attack in the first 3s after spawn
export const PRAYER_KNOCKBACK_SPEED = 8; // one-tile push over ~0.1s, stopping at walls
// First boss timer starts counting only once difficultyLevel reaches 1 (~10s in), then this
// many ticks, then BOSS_WARNING_TICKS more — sized so the very first boss appears at ~60s total.
export const BOSS_FIRST_SPAWN_TIMER = 2790;
export const BOSS_LATE_METEOR_DMG = 45; // after special skills unlock
export const BOSS_METEOR_DMG = 75;   // meteor deals 75% of boss max HP
export const BOSS_ATTACK_RANGE = 3;    // boss can attack from 3 tiles away
export const KING_RAMP_SECONDS = 350;
export const KING_SPEED_RAMP_PER_SEC = 11.5 / KING_RAMP_SECONDS; // fraction of base speed gained per second alive
export const KING_SPEED_CAP = 6.0;    // px/tick — exceeds normal player speed after ~255s, caps after 350s
export const KING_UNTOUCHED_TICKS = 600; // warn after 10s untouched, 5s earlier than before
export const KING_ARENA_WINDUP = 390; // 6.5s to interrupt; pulse still lands after 16.5s total
export const KING_ARENA_DAMAGE = 15; // player and placed Ruby, regardless of chamber or cover
export const KING_ARENA_DAMAGE_MAX = 30; // increases with this King's age, reaching the cap alongside speed
export const KING_ARENA_FX_TICKS = 24;

export const HEALER_HEAL_RADIUS = 3;  // tiles — heals allies within this range
export const HEALER_HEAL_AMOUNT = 2;  // HP restored per interval
export const HEALER_HEAL_INTERVAL = 60; // ticks between heals (~1s)

export const SNIPER_ATTACK_RANGE = 10; // tiles — fires from this distance
export const SNIPER_WINDUP_TICKS = 50; // telegraph before firing (~0.83s)
// Lancer: locks its aim and shows the line for windupTicks, then fires a beam along it that walls stop.
// Defeating one grants rewardTicks of laser stun: each laser hit stops an alien for stunTicks (bosses bossStunTicks).
// Endless comets: every minGap–maxGap ticks a size×size area in the player's room is marked for warningTicks, then struck.
// Damage: player/Ruby flat; regular aliens alienDamage × skill alien scale; bosses a share of max HP (lateBossShare after Ascension).
export const COMET = { minGap: 1200, maxGap: 4200, warningTicks: 72, fallTicks: 45, impactTicks: 30, size: 3,
  playerDamage: 25, rubyDamage: 20, alienDamage: 15, bossShare: .08, lateBossShare: .05,
  playerAimChance: .7, spawnRange: 5, stunTicks: 30, fromStage: 3 } as const; // fromStage: no comets (and no countdown) before this stage // stunTicks: a hit player can't move or attack for 0.5s // spawnRange: random comets land within this many tiles of the player // chance the area is centred exactly on the player's tile
// Enemy attacks (on the player and Ruby) deal +LATE_ENEMY_DAMAGE_STEP more damage at stage LATE_ENEMY_DAMAGE_STAGE and every
// LATE_ENEMY_DAMAGE_EVERY stages after (15: +5%, 20: +10%, 25: +15%, ...), with no cap. Not in challenges.
export const LATE_ENEMY_DAMAGE_STAGE = 15, LATE_ENEMY_DAMAGE_EVERY = 5, LATE_ENEMY_DAMAGE_STEP = .05;
export function lateEnemyDamageMult(stage: number) {
  return stage < LATE_ENEMY_DAMAGE_STAGE ? 1 : 1 + LATE_ENEMY_DAMAGE_STEP * (Math.floor((stage - LATE_ENEMY_DAMAGE_STAGE) / LATE_ENEMY_DAMAGE_EVERY) + 1);
}
// Enchanter (Endless, stage 18+): every pulseTicks it gives aliens within radius tiles (not itself) speedMult speed and
// damageMult damage for buffTicks; bosses get the smaller bossSpeedMult / bossDamageMult. Joins the spawn pool from fromStage, at most maxAlive at once.
export const ENCHANTER = { fromStage: 18, maxAlive: 2, pulseTicks: 360, radius: 9, buffTicks: 240,
  speedMult: 1.3, damageMult: 1.3, bossSpeedMult: 1.15, bossDamageMult: 1.15,
  rewardTicks: 300, rewardDamageMult: 1.25, rewardSpeedMult: 1.15 } as const; // kill reward: Empowered, +25% player attack damage and +15% move speed for 5s
// Bleeder (Endless, stage 18+): its hit curses the player for curseTicks: no healing from any source, and the shield
// drains shieldDrainPerSecond. Killing a Bleeder lifts the curse. Joins the spawn pool from fromStage, at most maxAlive.
export const BLEEDER = { fromStage: 18, maxAlive: 3, curseTicks: 180, shieldDrainPerSecond: 5,
  regenTicks: 300, regenEvery: 12 } as const; // kill reward: heal 1 HP every regenEvery ticks for regenTicks (5 HP/s for 5s)
// Snatcher (Endless, stage 15+): ignores the player and grabs a placed Ruby, then carries her away from the player at
// fleeSpeedMult of its speed while she loses rubyDrainPerSecond. Killing it drops her. Shadows a player who carries her.
export const SNATCHER = { fromStage: 15, maxAlive: 1, fleeSpeedMult: .6, rubyDrainPerSecond: 2, rewardRubyShield: 20 } as const;
// Impostor (Endless, stage 20+, only while a boss is alive): looks like a living boss (model, HP bar, minimap marker)
// but never attacks; keeps keepAway tiles from the player. Gone when no boss is left. Kill reward: a decoy.
export const IMPOSTOR = { fromStage: 20, maxAlive: 1, keepAway: 5, disguiseDelay: 120, rewardDecoyTicks: 360 } as const; // disguiseDelay: plain look for 2s after spawning // kill reward: a 6s fragile decoy
// Shooter (Endless/Ascension, stage 10+): with a clear line within its attackRange it glows for windupTicks, then fires a
// slow shot (shotSpeed px/tick) at the player's position that flies until a wall; a hit stuns the player for stunTicks.
// Kill reward: for rewardTicks, bullets deal rewardBulletMult damage and each hit stops an alien for rewardStunTicks
// (bosses rewardBossStunTicks).
// Reflector (Endless, stage 10+): a 3-tile mirror (halfWidth each side of its centre) on one cardinal side, turning toward
// the player after turnTicks. Bullets and lasers crossing the mirror from the front bounce back: bullets as shots that hit
// only the player; lasers leave bent bendDegrees to a random side, hitting the player for laserDamage only in that path. Allies behind the mirror are covered too. Any Wave hit, push,
// pull, stun or slow drops the mirror for mirrorDownTicks. Kill reward: Ruby copies your attacks at rubyCopyMult for rewardTicks.
export const REFLECTOR = { fromStage: 10, maxAlive: 2, turnTicks: 90, halfWidth: 1.5, bulletDamage: 6, laserDamage: 8, bendDegrees: 30, bendHitRadius: .7, shotSpeed: 5,
  mirrorDownTicks: 180, rewardTicks: 300, rubyCopyMult: .5 } as const;
// Trapper (Endless, stage 15+): keeps keepAway tiles from the player and drops a mine every dropTicks (up to maxMines).
// A mine arms after armTicks; when the player steps onto it, it fuses for fuseTicks then blasts radius tiles
// (damage to player, placed Ruby and other aliens). Mines fade after lifeTicks.
// Kill reward: for rewardTicks your bullets explode on hit, dealing rewardSplash of their damage within rewardRadius.
// Jammer hunts the player and projects a five-tile teleport interference field.
export const SOULLESS_LUNGE = { warningTicks: 24, tiles: 6, range: 6, speed: 13, recoverTicks: 25, swipeTicks: 12, swipeRadius: 1.15, knockback: 2 } as const;
export const GRAPPLER = { fromStage: 22, maxAlive: 2, warningTicks: 42, shotSpeed: 12, hitRadius: .42, retractTicks: 18, rewardTicks: 300, pullSpeedMult: 1.2 } as const;
export const SPOOK = { fromStage: 22, maxAlive: 1, faceTicks: 102 } as const;
export const JAMMER = { fromStage: 20, maxAlive: 1, radius: 5, keepAway: 3, rewardRadius: 4, rewardDamage: 1.75 } as const;
// Blinker: a fragile melee alien whose defeat displaces the player.
export const BLINKER = { fromStage: 20, maxAlive: 2, warpTicks: 30 } as const;
// Dropper: ranged 2x2 overhead slam. A locked amber warning precedes each impact.
export const DROPPER = { chaseRange: 20, tiles: 2, fromStage: 5, maxAlive: 2, warningTicks: 33, knockback: 3, impactTicks: 20, rewardTicks: 300, rewardWaveDamage: 1.3, rewardPush: 1, rewardRadius: 2, rewardCooldownMult: .8 } as const;
export const TRAPPER = { fromStage: 15, maxAlive: 2, keepAway: 4, dropTicks: 200, maxMines: 5, armTicks: 60, fuseTicks: 18,
  lifeTicks: 1500, radius: 1.5, damage: 14, rubyDamage: 6, alienDamage: 10, triggerRange: .7,
  rewardTicks: 300, rewardRadius: 3, rewardSplash: .5 } as const;
export const SHOOTER = { fromStage: 10, maxAlive: 3, windupTicks: 24, shotSpeed: 4, hitRadius: .45, stunTicks: 30,
  rewardTicks: 300, rewardBulletMult: 1.3, rewardStunTicks: 8, rewardBossStunTicks: 3 } as const;
// Triangulum constellation: Laser-hit aliens within radius tiles of another hit alien are pulled pullTiles toward their group.
export const TRIANGULUM = { radius: 3, pullTiles: 1 } as const;
// Crater constellation: after a meteor strike its room heals the player healPerPulse every pulseTicks, for ticks (2.5 HP/s for 8s).
export const CRATER = { ticks: 480, healPerPulse: 1, pulseTicks: 24 } as const;
// Regular aliens gain this much HP every third boss defeat, up to six times (+24% at defeat 18); later defeats add LATE_ALIEN_HP_PER_STAGE each.
export const ALIEN_HP_PER_MILESTONE = 0.04;
// Celestial blessing tuning. Target: each is worth about 2-3 constellations (one = +25% damage or 15% less damage taken).
export const BLESSING = {
  amberEnergy: 1.6, amberPowerTicks: 120,                                  // Sirius: energy gain, extra powered time
  diamondHealShield: 6, diamondHitShare: .5, diamondHitMax: 20, diamondCap: 80, // Saturn: shield from heals and hits
  rubyDamage: 1.5, rubySpeed: 1.2,                                         // Sun: while unharmed
  emeraldSpeedPerStack: .05, emeraldDamagePerStack: .02,                   // Jupiter: per attack stack, up to 10
  emeraldSlowPerHit: .07, emeraldBossSlowPerHit: .035, emeraldSlowCap: .6, emeraldBossSlowCap: .3,
  amethystShotDamage: .45, amethystDecoyHP: 36, amethystMaxDecoys: 4,      // Moon: decoys
  obsidianChance: .75, obsidianWells: 5, obsidianPulse: 4.5, obsidianBossPulse: .0025, // Singularity: per 0.5s pulse
  opalChance: .65,                                                         // Binary Star: copy chance
  sapphireHealPerSecond: 5, sapphireWeaken: .8,                            // Neptune
  peridotPulse: 4, peridotSlow: .6, peridotBossSlow: .8, peridotFields: 16, // Gaia: per 0.5s pulse
  pearlReduction: .75, pearlBossReflectCap: .04,                           // Venus
} as const;
// Reticulum constellation: a Laser hit stops an ordinary alien for stunTicks, then that alien is immune for recoverTicks. Bosses are immune.
export const RETICULUM = { stunTicks: 24, recoverTicks: 120 } as const;
export const LANCER = { windupTicks: 42, hitRadius: .55, beamTicks: 18, rewardTicks: 300, stunTicks: 30, bossStunTicks: 12 } as const;

export const CHARGER_CHARGE_SPEED = 7.5; // px/tick during the committed rush
export const CHARGER_WINDUP_TICKS = 24; // 0.4s locked-lane warning
export const CHARGER_CHARGE_TILES = 8; // recover after a missed rush instead of charging forever
export const CHARGER_SIGHT_RANGE = 7;   // tiles — triggers charge when player in LoS
export const CHARGER_STUN_TICKS = 55;  // ticks stunned after hitting wall
// Lodestone Magnet Snap: a short Charger-style lunge. Within range and in sight it locks a lane toward you, warns, then
// snaps up to `tiles` along it; touching you deals `damage` and knocks you back. It rests `recover` ticks after, and
// snaps again no sooner than `cooldown`. The passive field leaves it alone; a swap shove cancels it.
export const LODESTONE_SNAP = { range: 4, windup: 36, tiles: 4, speed: 6.5, damage: 10, rubyDamage: 6, knockback: 1, recover: 40, cooldown: 150 } as const;

export const SHIELDER_SHIELD_RANGE = 8;  // tiles — shields allies within 8 tiles
export const KILL_SHIELD_HP = 10; // Armored/Shielder kill reward — added to the absorb pool
export const KILL_SHIELD_CAP = 40; // kill shields (Armored, Shielder, Snatcher) stack up to this; a bigger pool from elsewhere is kept

export const SNIPER_CHAIN_RANGE = 4;  // tiles — chain lightning radius on sniper kill
export const SNIPER_CHAIN_DMG = 8;  // damage per chain hit

export const QUEEN_PHASE_INTERVAL = 480; // ticks (~8s) between chamber phase-jumps
export const QUEEN_PHASE_TELEGRAPH = 60;  // ticks before a jump where she visibly destabilizes
export const QUEEN_ATTACK_RANGE = 16;  // tiles — fires from this distance, only within her own chamber
export const QUEEN_WINDUP_TICKS = 40;  // telegraph before firing (queen + echo share this)
export const QUEEN_PHASE_HEAL_PCT = 0.07; // fraction of max HP healed on each phase-jump
export const QUEEN_PHASE_HEAL_CAP = 8; // prevent excessive healing in late boss levels

export const REAPER_SEAL_DURATION = 240; // ticks (~4s) a sealed hallway stays walled off
export const REAPER_SEAL_COOLDOWN = 480; // ticks (~8s) before she can seal another hallway

// Soul Devourer: a swift swarm boss. Each ally eaten adds a stack (max 3); on death every
// stack bursts out as a nearly full-strength copy that can eat and split again; the swarm is the fight.
export const DEVOURER_MAX_STACKS = 3;
export const DEVOURER_SELF_SPLIT_TICKS = 1200;   // 20s alive: a body with a stack buds off a copy on its own
export const DEVOURER_SELF_SPLIT_WARNING = 120;  // 2s visible warning before a self-split
export const DEVOURER_FAMILY_CAP = 10; // most living Devourer bodies at once, shared by the whole family
export const DEVOURER_BODY_KILL_HEAL = 8; // player heal for each non-final Devourer body killed (regular kills heal 5)
export const DEVOURER_START_STACKS = 1; // the original spawns with one stack (copies start at 0)
export const DEVOURER_HP_PER_DEFEAT = 6; // original HP gain per prior boss defeat (other bosses use 15)
export const DEVOURER_ABSORB_RANGE = 5;   // tiles — how far she'll reach to consume a nearby ally
export const DEVOURER_ABSORB_COOLDOWN = 360;         // 6s between meals for the original
export const DEVOURER_ABSORB_COOLDOWN_PER_GEN = 180;  // first copy generation adds 3s ...
export const DEVOURER_ABSORB_COOLDOWN_GEN_STEP = 60;  // ... and each later generation adds 1s more than the last (9s, 13s, 18s, 24s, ...)
export const DEVOURER_COPY_FIRST_MEAL = 180; // ticks (3s) before a newborn copy can eat
export const DEVOURER_STACK_HP_PCT = 0.05; // fraction of max HP gained (and healed) per stack
export const DEVOURER_STACK_DAMAGE = 0.5; // extra player/Ruby damage per stack
export const DEVOURER_ENDLESS_BITE_BONUS = 1; // endless mode: +1 bite damage to the player and Ruby
export const DEVOURER_KNOCKBACK_CHANCE = .3, DEVOURER_KNOCKBACK_TILES = 2; // 30% of its bites on you also shove you 2 tiles
export const DEVOURER_HUNGRY_BELOW = 2;    // at 0–1 stacks she hunts aliens to eat before the player
export const DEVOURER_FULL_HEAL_PCT = 0.01; // eating at the stack cap heals this much instead
export const DEVOURER_COPY_HP_RATIO = 0.5; // each copy's max HP, as a share of its parent's max HP at death
export const DEVOURER_COPY_SCALE = 0.9;   // body size per generation
export const DEVOURER_NEWBORN_TICKS = 120;   // 2s: a fresh copy flees from the player at boosted speed
export const DEVOURER_NEWBORN_SPEED_MULT = 2.2; // newborn copies sprint away at 2.2x speed for their first 2s
export const DEVOURER_GEN_SPEED_MULT = 0.9; // speed multiplier per copy generation (10% slower each)
export const DEVOURER_GEN_DAMAGE_MULT = 0.8; // bite damage multiplier per copy generation (20% less each)
// Singularity challenge: the normal family loop, with stronger later generations.
// Singularity challenge: hook bodies and fling them into the Maws while they open (singularity-maw.ts). Per-phase values are [phase 1, 2, 3].
export const SINGULARITY_CHALLENGE = {
  // Each original spawns with maxStacks and bursts after gorgeTicks into one copy per stack. Copies start empty at copyHP;
  // each meal adds a stack (+stackHP). A copy at full stacks bursts after gorgeTicks into one copy per stack; killed by
  // hand it leaves one per two stacks; a Maw swallows it whole. A copy is full at bodyStacks; only the original carries
  // the phase's maxStacks.
  // mealStacks: stacks each Lost Soul gives; a copy is full at bodyStacks
  phaseHP: [150, 150, 150], copyHP: [130, 130, 130], stackHP: 25, bodyStacks: 3, mealStacks: 1, maxStacks: [12, 12, 12], gorgeTicks: 120, familyCap: [40, 48, 56], stacksPerCopy: 1, // familyCap: most bodies alive per phase
  // The full burst, within 3 tiles: 20 and a 2-tile shove to you, 10 to a placed Ruby, 30 to other enemies (Lost Souls are spared).
  burst: { radius: 6, damage: 12, rubyDamage: 5, enemyDamage: 30, knock: 3 },
  // A body leaving in a random jump (or flung by gas) blasts where it was: smaller than a burst.
  jumpBlast: { radius: 4, damage: 6, rubyDamage: 3, knock: 2 },
  soulKillHeal: 2, // killing a Lost Soul yourself heals you 3 (meteors give nothing)
  // bodySpeed: bodies walk 80% faster than the normal Devourer.
  newbornSpeed: 3, bodySpeed: 1.8, weakestGeneration: 2, generationSpeed: .97, generationDamage: .97, generationScale: .98, minimumScale: .7, minimumStats: .6,
  convergence: { everyTicks: 2580, gatherTicks: 120, gatherExtraTicks: 120, bodyTicks: 6, chargeTicks: 0, blastTicks: 180, waveTicks: 45, waveEchoTicks: 4, maxDamage: 63.3, rubyShare: .5, knock: 10, knockSpeedMult: 6,
    // Damage scales with distance from the gather point: nearMult within nearTiles, easing (quadratic) down to farMult at
    // farTiles and beyond; the chamber diagonally opposite the gather point always takes farMult.
    nearMult: 1.5, farMult: .5, nearTiles: 6, farTiles: 40 },
  mealSpeed: 1.4, mealSpeedTicks: 180, // eating refreshes a three-second movement boost; does not stack
  biteDamage: .9, biteFamilyExponent: .65, mealCooldown: 20, mealMaxCooldown: 70, mealPenalty: .35, firstMeal: 12,
  // Bodies hunt nearby food, then the player or Ruby.
  wellPullSpeed: 6,                                  // forced step speed for every pull (Maw and F)
  // Each Maw idles small (mawRadius), warns, then opens wide (mawOpenRadius, faster pulls) on a repeating cycle; the
  // two Maws are half a cycle apart. You are pulled only while a Maw is open.
  mawEatCooldown: 42, // ticks after a Maw (or the F field) swallows a copy before it can swallow another
  mawCycle: { closed: 960, warn: 90, open: 210 }, mawOpenRadius: 5, mawOpenPulse: 6,
  mawRadius: 2, mawSwellRadius: 5, mawPulse: 14, mawSwellPulse: 6, mawInnerRadius: 2, mawInnerMult: 4, mawInnerHeavyMult: 5, heavyPulseMult: 18 / 14, fullPullMult: 1.35, // a body one stack from full (or bursting) is pulled 35% less often // tiles; ticks between pulls
  playerRadius: 1.5, playerSwellRadius: 5, playerPulse: 100, playerSwellPulse: 30, playerInnerMult: 2, // a resting Maw pulls you only from the tiles around its centre
  horizonDamage: 20, horizonFling: 3, horizonCooldown: 60,
  mawCount: [2, 2, 2], mawMoveTicks: [2100, 2100, 2100], mawPreview: 300,
  swallowHeal: 6, swallowEnergy: 4, bodySwallowHeal: 8, bodySwallowBonus: 5, // a swallowed copy heals bodySwallowHeal (scaled by the Feast chain) + bodySwallowBonus
  // Feast: swallowing bodies within feastWindow of each other builds a chain; each heals and energises more (up to feastMax).
  feastWindow: 240, feastStep: .5, feastMax: 4, feastEnergy: 4,
  // Gravity Hook (C): hold to latch the nearest body within hookRange tiles in sight and tow it; release (or after
  // hookMaxTicks) flings it hookFling tiles the way you face. A fling swallows it on reaching a Maw's inner tiles, slams
  // it into another enemy (both stunned, no damage) or a wall. Release starts a 0.8-second cooldown. aimCone: the throw bends
  // toward a Maw (preferred) or body within this many degrees of your facing and within reach.
  hook: { range: 8, maxTicks: 180, cooldown: 48, towGap: 1.6, towSpeed: 7, fling: 7, aimCone: 30, flingSpeed: 11, slamDamage: 0, slamStun: 180, wallDamage: 0, wallStun: 60, endStun: 30,
    soullessImpact: 10 }, // a Soulless (either kind) in a hook slam or thrown into a wall takes this damage; a Lost Soul dies
  mawSoulless: { every: 60, damage: 10 }, // a Soulless (either kind) on a Maw's centre tile takes damage each every ticks it stays there
  foodRadius: 44, // tiles; a bit over two 20-tile chambers, so bodies cross into the next chamber for food
  loneBodyTicks: 1800, // in a phase's first 30s, a lone body (not already bursting) bursts at once with the phase's full stacks
  spreadChance: .6, // a body on or next to another body steps away from it this often instead of following its path
  aggroTicks: 60, // a body you hit ignores food and hunts you for this long (each hit restarts it)
  fleeRadius: 6, // with no food to chase, a body runs from you within this many tiles, and otherwise roams away from you
  fleeSpeed: 1.3, // a body running from you moves 30% faster (stacks with the meal boost)
  // Toxic gas (from phase 2): count clouds of radius tiles drift at speed px/tick, each living lifeTicks (a range) with
  // fade-in and fade-out, then re-forming elsewhere. Inside one you move at slow speed and your view hazes over. A
  // Devourer that touches one bursts at once: with stacks, into its copies; without, it is flung across the map.
  gas: { fromPhase: 2, count: 5, radius: 1.8, lifeTicks: [900, 1200], fade: 90, speed: .35, slow: .6, minFromYou: 4 }, // slows and obscures vision without dealing damage
  // Each copy jumps to a random open tile anywhere on the map (at least minFromYou tiles from you) every everyTicks (a
  // range), flickering for warn ticks first.
  bodyJump: { everyTicks: [480, 840], warn: 30, minFromYou: 4, toFoodChance: .6 }, // toFoodChance: with no food in range, how often a jump lands beside a Lost Soul
  // The Jaw: firstTicks into a phase, then every everyTicks (a range), a 3×3 area (radius 1) under you is marked for warn
  // ticks, then closes on its centre for snap ticks. Caught, you take damage, are thrown knock tiles to the far side of
  // its centre (along the axis you are further off it on), and are stunned for stun ticks once you land.
  jaw: { firstTicks: 300, everyTicks: [240, 360], everyTicksLate: [240, 360], // same attack frequency in every phase
    warn: 48, snap: 30, radius: 1, damage: 15, knock: 6, knockSpeedMult: 2.4 },
  // Limited food gives the swarm chances to multiply while leaving time to fight and set traps.
  soulCap: 22, soulStart: 6, soulWarnTicks: 90,
  soulSpawnTicks: 36, soulWander: 45, soulSpeed: 1.2, soulHP: 1,
  // Soulless: a soulless skeleton that hunts you (ordinary melee chase), announced by a grey sign; one more every everyTicks up
  // to the phase's cap. The swarm never eats it; a Maw or F swallows it like any alien.
  // From phase 3 some are Contaminated Soulless: as they walk they leave a trail of still gas puffs (trailRadius tiles,
  // trailTicks long, fading in and out over trailFade), at most one every trailGap ticks and only on a new tile, and at most
  // trailMax live puffs each (the oldest goes first). They walk
  // toxicSpeed times as fast as a Soulless, and a Devourer within touchRadius tiles of one bursts as it does in gas.
  soulless: { everyTicks: 240, cap: [3, 4, 5], hp: 30, toxicFromPhase: 3, toxicChance: .35, toxicSpeed: 1.4, touchRadius: 1, trailRadius: 1.2, trailTicks: 300, trailFade: 30, trailGap: 20, trailMax: 6 },
  soulFleeRadius: 3, soulFleeSpeed: 2.6, goldenFleeSpeed: 4.2, // goldenFleeSpeed: a Golden Soul runs from you faster // a soul runs from you (not the swarm) within soulFleeRadius tiles
  // Golden Souls (phase 2+): a quarter of new souls; a Devourer that eats one is filled to full stacks at once.
  goldenFromPhase: 2, goldenChance: .25,
  // Void Shell (phase 3): some new copies carry a shell that absorbs hp damage. The Gravity Hook cannot catch a shelled copy.
  shell: { fromPhase: 3, chance: .3, hp: 60 },
  soundGap: 60, eatSoundGap: 150, // eatSoundGap: the swarm eats constantly, so meals play at most every 2.5s // ticks: each repeatable Singularity sound (bites, meals, bursts, swallows, hook hits...) plays at most this often
  fTicks: 480, // the F Singularity lasts 8s in the challenge (18s elsewhere)
  fPullTicks: 10, // the F Singularity pulls every 10 ticks here (15 elsewhere); Devourer bodies on two of every three pulses
} as const;



export const FROST_CHILL_SPEED_MULT = 0.65; // player move-speed multiplier while sharing her chamber
export const FROST_CHILL_TICK_RATE = 0.5;  // LASER/BULLET/WAVE cooldowns tick down at this rate while chilled (half attack speed)
export const FROST_ICE_TILE_COUNT = 7;    // ice tiles scattered in whichever chamber she currently occupies
export const FROST_FREEZE_DURATION = 90;   // ticks (~1.5s) fully immobilized after stepping on ice
export const FROST_RELOCATE_INTERVAL = 1800; // ticks (~30s) between chamber relocations (re-scatters ice tiles)
export const FROST_SHIELD_HP = 15;   // base absorb capacity of the icy shield granted per cast
export const FROST_SHIELD_HP_PER_DEFEAT = 2; // extra absorb per prior boss defeat
export const FROST_SHIELD_HP_MAX = 45; // reached after 15 defeats
export const FROST_SHIELD_CAST_DELAY = 300;  // ticks (~5s) — recurring interval between ice-laser shield casts

// ─── Difficulty tiers ────────────────────────────────────────────────────────

export interface DifficultyTier {
  spawnInterval: number;   // ticks between enemy spawns
  maxEnemies: number;
  spawnTypes: EnemyType[];
  hpMult: number;
  spawnCount: number;      // how many enemies spawn per wave
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  { spawnInterval: 180, maxEnemies: 7, spawnTypes: ['normal'], hpMult: 1.0, spawnCount: 1 }, // opening
  { spawnInterval: 150, maxEnemies: 9, spawnTypes: ['normal'], hpMult: 1.0, spawnCount: 1 }, // after 10s
  { spawnInterval: 120, maxEnemies: 11, spawnTypes: ['normal', 'normal', 'armored', 'healer'], hpMult: 1.0, spawnCount: 1 }, // after 25s
  { spawnInterval: 100, maxEnemies: 16, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'healer', 'charger'], hpMult: 1.2, spawnCount: 1 }, // after 45s
  { spawnInterval: 80, maxEnemies: 18, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'energy_leech'], hpMult: 1.3, spawnCount: 2 }, // stage 1
  { spawnInterval: 65, maxEnemies: 21, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter', 'energy_leech', 'lancer'], hpMult: 1.5, spawnCount: 2 }, // stage 2
  { spawnInterval: 50, maxEnemies: 25, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter', 'energy_leech', 'lancer'], hpMult: 1.7, spawnCount: 2 }, // stage 3
  { spawnInterval: 38, maxEnemies: 31, spawnTypes: ['normal', 'normal', 'armored', 'fast', 'bomber', 'sniper', 'healer', 'charger', 'ghost', 'shielder', 'splitter', 'energy_leech', 'lancer'], hpMult: 2.0, spawnCount: 3 }, // stage 4+
];

export const DIFFICULTY_RAMP_TICKS = 600; // first opening increase, preserving first-boss timing
export const DIFFICULTY_OPENING_THRESHOLDS = [0, DIFFICULTY_RAMP_TICKS, 1500, 2700] as const;

// ─── Player / Ruby ────────────────────────────────────────────────────────────

export const PLAYER_MAX_HP = 100;
export const RUBY_MAX_HP = 100;
export const PLAYER_BASE_SPEED = 4.5;  // px/tick  (scaled with TILE_SIZE 48)
export const CARRY_DAMAGE_MULT = 0.9; // the player takes 10% less damage while carrying Ruby
export const CARRY_BOOST_MULT = 0.7; // speed boosts last 30% shorter while carrying Ruby
export const CARRY_BOOST_SPEED_MULT = 0.85; // boosted movement speed while carrying Ruby
export const URSA_PUSH_MULT = 0.5; // Ursa Major constellation: every push moves you half as far (stacks with carrying)
export const CARRY_PUSH_MULT = 0.5; // knockbacks, tides and pulls move a player carrying Ruby half as far
export const PLAYER_CARRY_MULT = 0.5; // 50% of normal speed while carrying Ruby

// ─── Abilities ────────────────────────────────────────────────────────────────

// 1. Laser beam (key J)
export const LASER_RANGE = 8;   // tiles
export const LASER_RANGE_PWR = 14;
export const LASER_DMG = 2.268;
export const LASER_DMG_PWR = 6.804;
export const LASER_COOLDOWN = 40;  // ticks (~0.67s) — frequent clicks, low damage

export const BULLET_COOLDOWN = 11;
export const BULLET_DMG = 0.35;
export const BULLET_DMG_PWR = 1.05;
export const BULLET_SPEED = 0.45;
// Every BULLET_HEAVY_EVERY-th bullet shot is heavy: on hit it deals ×BULLET_HEAVY_MULT and pushes a regular alien BULLET_HEAVY_PUSH tile(s).
export const BULLET_HEAVY_EVERY = 20;
export const BULLET_HEAVY_EVERY_MONOCEROS = 8; // with the Monoceros constellation
// Hydra constellation: the next Laser gains perEnemy damage for each distinct enemy the previous cast hit, up to maxEnemies.
export const HYDRA = { perEnemy: .075, maxEnemies: 5 } as const;
export const BULLET_HEAVY_MULT = 2;
export const BULLET_HEAVY_PUSH = 1;

// 2. Charge wave (key K, tap 4×)
export const CHARGE_NEEDED = 4;
export const CHARGE_DECAY_TICKS = 110; // reset charges if gap > 110 ticks
export const WAVE_RADIUS = 6;   // tiles
export const WAVE_RADIUS_PWR = 10;
export const WAVE_DMG = 8;
export const WAVE_DMG_PWR = 14;
export const WAVE_PUSH_TILES = 3;
export const WAVE_PUSH_TILES_PWR = 6;
export const WAVE_COOLDOWN = 120;

// 3. Speed boost (key L)
export const SPEED_DURATION = 120;  // ticks (~2s)
export const SPEED_DURATION_PWR = 240;
export const SPEED_MULT = 2.2;
export const SPEED_COOLDOWN = 270; // (4.5s) — was 360 (6s), reduced by 1.5s

// 4. Bomb (key B — place / detonate)
export const BOMB_RADIUS = 4;   // tiles
export const BOMB_RADIUS_PWR = 5;
export const BOMB_DMG = 45;
export const BOMB_DMG_PWR = 90;

// ─── Star energy ─────────────────────────────────────────────────────────────

export const STAR_ENERGY_MAX = 100;
export const STAR_ENERGY_PER_CRYSTAL = 40;
export const STAR_ENERGY_PER_KILL = 5;

// ─── Resources ───────────────────────────────────────────────────────────────

export const RESOURCE_SPAWN_INTERVAL = Math.round(600 / 1.1); // ~9.1s, 10% more frequent health/energy spawns
export const RESOURCE_MAX_ON_MAP = 5;
export const HEAL_AMOUNT = 33; // was 30, +10%
export const ENERGY_AMOUNT = 42; // was 38, +10%

// ─── Ruby Core healing ────────────────────────────────────────────────────────

export const RUBY_HEAL_AMOUNT = 5;  // HP per Space press
export const RUBY_HEAL_COOLDOWN = 18; // ticks between heals (~0.3s)
export const RUBY_HEAL_RANGE = 3;  // max Chebyshev distance player→ruby
export const RUBY_HEAL_CLEAR_RANGE = 6;  // no enemies within this many tiles

// ─── Meteorite ───────────────────────────────────────────────────────────────

// Tutorial mode: short guided steps, shown one at a time with a goal counter.
export type TutorialStepId = 'move' | 'laser' | 'bullet' | 'wave' | 'speed' | 'bomb' | 'energy' | 'carry' | 'heal' | 'teleport' | 'meteor' | 'celestial' | 'done';
export const TUTORIAL_STEPS: { id: TutorialStepId; title: string; text: string; goal: number }[] = [
  { id: 'move', title: 'MOVE', text: 'Move with W A S D.', goal: 8 },
  { id: 'laser', title: 'LASER', text: 'Left-click fires your laser in four directions. Defeat the aliens.', goal: 2 },
  { id: 'bullet', title: 'BULLETS', text: 'Right-click shoots bullets. Hold to keep firing. Defeat the aliens.', goal: 2 },
  { id: 'wave', title: 'CHARGED WAVE', text: 'Hold left-click to charge, then release for a wave that hits and pushes aliens back.', goal: 1 },
  { id: 'speed', title: 'SPEED BURST', text: 'Press R or Left Shift for a quick speed burst.', goal: 1 },
  { id: 'bomb', title: 'BOMB', text: 'Press Q to drop a bomb, step away, then press Q again to detonate. Your own blast hurts you.', goal: 1 },
  { id: 'energy', title: 'STAR ENERGY', text: 'Defeating aliens fills your energy bar (top left). When it is full, your next attack turns POWERED for 2 seconds. Fill it and fire!', goal: 1 },
  { id: 'carry', title: 'RUBY', text: 'Protect Ruby! Stand next to it and press E to pick it up, then E again to put it down.', goal: 2 },
  { id: 'heal', title: 'HEAL', text: 'Near Ruby or while carrying it, press Space to heal you both. No aliens may be close.', goal: 6 },
  { id: 'teleport', title: 'TELEPORT', text: 'Stand on or next to the glowing pad, press X, then click a room on the map.', goal: 1 },
  { id: 'meteor', title: 'METEOR', text: 'A meteor is falling on this room! Get out before it lands. It also wipes out aliens inside.', goal: 1 },
  { id: 'celestial', title: 'CELESTIAL SKILL', text: 'Bosses grant celestial skills. Press F to cast Solar Flare.', goal: 1 },
  { id: 'done', title: 'FIRST ORBIT COMPLETE', text: 'You are ready. Defeat bosses, keep Ruby alive and watch the skies.', goal: 0 },
];
export const TUTORIAL_STEP_PAUSE = 75; // ticks of "done" feedback before the next step starts

// Celestial Challenge (prototype): the guardian is the only boss, and its skill recharges after each cast.
export const TRIAL_BOSS_DELAY = 300;        // ticks (5s) before the guardian's arrival warning starts
export const SPECIAL_RECAST_LOCK = 90; // endless: 1.5s after a cast before F works again, so a skill earned by that cast isn't wasted
export const TRIAL_SKILL_COOLDOWN = 1200;   // ticks (20s) after casting before the skill returns
export const TRIAL_SKILL_COOLDOWNS: Partial<Record<SpecialSkill, number>> = { thorn_weaver: 2100, splitter_queen: 900, fiery_king: 1620, storm_reaper: 540, devourer: 540, frost_warden: 900 }; // Gaia's Roots: 35s; Lunar Echo: 15s; Solar Flare: 27s; Jupiter Storm: 9s; Saturn: 15s; Singularity: 9s
export function trialSkillCooldown(skill: SpecialSkill) { return TRIAL_SKILL_COOLDOWNS[skill] ?? TRIAL_SKILL_COOLDOWN; }

// Neptune challenge (Sea Chanter): three phases with their own HP (NEPTUNE_PHASE_HPS). Healing can never lift her into a
// finished phase. Dive points are fractions of the current phase; at each one she dives, drops water clones
// and stays under until they are all destroyed (HP snaps down to the dive point) or time runs out
// (each surviving clone restores NEPTUNE_CLONE_HEAL of the phase). Diving at 0 ends the phase; clearing
// phase 3's final dive (at 0 HP) defeats her.
export const NEPTUNE_PHASE_HPS: Record<1 | 2 | 3, number> = { 1: 2000, 2: 2300, 3: 2450 }; // phase 1: three equal dive intervals
export const NEPTUNE_TOTAL_HP = NEPTUNE_PHASE_HPS[1] + NEPTUNE_PHASE_HPS[2] + NEPTUNE_PHASE_HPS[3];
// HP left once a phase is emptied (later phases sit below it on the bar), and the top of a phase.
export function neptunePhaseFloorHP(phase: 1 | 2 | 3) { return phase === 1 ? NEPTUNE_PHASE_HPS[2] + NEPTUNE_PHASE_HPS[3] : phase === 2 ? NEPTUNE_PHASE_HPS[3] : 0; }
export function neptunePhaseCeilHP(phase: 1 | 2 | 3) { return neptunePhaseFloorHP(phase) + NEPTUNE_PHASE_HPS[phase]; }
export const NEPTUNE_DIVE_POINTS: Record<1 | 2 | 3, number[]> = { 1: [2/3, 1/3, 0], 2: [.66, .33, 0], 3: [.66, .33, 0] };
export const NEPTUNE_CLONES: Record<1 | 2 | 3, number> = { 1: 3, 2: 3, 3: 3 };
export const NEPTUNE_DIVE_TICKS: Record<1 | 2 | 3, number> = { 1: 1200, 2: 1200, 3: 960 }; // 20s, 20s, 16s
export const NEPTUNE_CLONE_HEAL_FX_TICKS = 72;
export const NEPTUNE_BOSS_SPEED_MULT = 1.07;
export const NEPTUNE_CLONE_KILL_HEAL = 20;
export const NEPTUNE_CLONE_CHARGE_HEAL = 5; // effective HP per recipient credited to Chorus
export const NEPTUNE_CLONE_FLEE_RADIUS = 7;
export const NEPTUNE_CLONE_FLEE_BURST_MULT = 3;
export const NEPTUNE_CLONE_FLEE_BURST_TICKS = 60;
export const NEPTUNE_CLONE_FLEE_BURST_COOLDOWN = 600;
export const NEPTUNE_MELODY_TAUNT_RADIUS = 7;
export const NEPTUNE_MELODY_TAUNT_TICKS = 180;
export const NEPTUNE_MELODY_WATER_BALL_DAMAGE = .85;
export const NEPTUNE_CLAM = {repositionTicks:3600,openTicks:240,waveTicks:36,radius:11,damage:4,pushTiles:3,slowTicks:180,slow:.55} as const;
export const NEPTUNE_CORRUPTED_CLAM = {openTicks:300,radius:10,damage:5,pushTiles:5,pushSpeed:1.6,slowTicks:60,slow:.7} as const;
export const NEPTUNE_CLONE_HEAL = .1;       // share of phase HP per surviving clone
export const NEPTUNE_CLONE_HEAL_BLOCK = 240; // hitting a clone stops her ally-feeding heal for 4s
export const NEPTUNE_DIVE_SPEED = 12; // very fast: on this map you hunt her clones, not her
export const NEPTUNE_BOMB_INTERVAL = 360;   // phase 2+: a water ball every 6s while surfaced
export const NEPTUNE_BOMB_FUSE = 180;       // 3s before it bursts
export const NEPTUNE_BOMB_RADIUS = 4;       // tiles
export const NEPTUNE_SONG_BONUS = 2;       // her water waves and bursts deal +2 here (to you and Ruby alike)
export const NEPTUNE_BOMB_DAMAGE = 28;      // to player and Ruby inside the burst
export const NEPTUNE_BOMB_SELF_DAMAGE = .03; // share of phase HP she takes when you pop it first
export const NEPTUNE_ATTACK_MULT: Record<1 | 2 | 3, number> = { 1: 1.1, 2: 1.65, 3: 1.65 };
export const NEPTUNE_STRIKE_DAMAGE = .10;   // meteors deal this share of phase HP
export const NEPTUNE_TRIDENT_DAMAGE: Record<1 | 2 | 3, number> = { 1: .10, 2: .10, 3: .10 }; // share of phase HP
export const NEPTUNE_HEAL_CHARGE_MAX = 120;  // sky laser charge capacity
export const NEPTUNE_HEAL_CHARGE_RATE = .93; // charge per HP actually healed
export const NEPTUNE_TIDE_SKILL_HEAL = 65;
export const NEPTUNE_TIDE_SKILL_CHARGE_HEAL = 40; // effective HP per recipient credited to Chorus
export const NEPTUNE_LASER_WARNING = 180;   // 3s from choosing a room to the strike
export const NEPTUNE_FISH_CAP = 16;
export function neptuneFishCap(phase:number){return NEPTUNE_FISH_CAP+(phase===3?4:0);}
export const NEPTUNE_FISH_RED_CHANCE = .25;
export function neptuneFishRedChance(_phase:number){return NEPTUNE_FISH_RED_CHANCE;}
export const NEPTUNE_FISH_SPAWN_GAP = 90;
export const NEPTUNE_FISH_HEAL = 12;        // blue fish heal the player and Ruby while she is surfaced
// Keep blue-fish Chorus income at 2.6 effective HP per second of uncapped spawning.
export const NEPTUNE_FISH_CHARGE_SCALE = (2.6/60) / ((1-NEPTUNE_FISH_RED_CHANCE)*NEPTUNE_FISH_HEAL*2/NEPTUNE_FISH_SPAWN_GAP);
export function neptuneFishChargeScale(phase:number){return NEPTUNE_FISH_CHARGE_SCALE*(phase===3?1-NEPTUNE_FISH_RED_CHANCE:1);}
export const NEPTUNE_FISH_BOSS_HEAL = .03;  // ...or heal her this share of phase HP if she is diving
export const NEPTUNE_FISH_HURT = 7;         // red fish cost you this much
export const NEPTUNE_STINGER_CHANCE = .35;  // share of natural alien spawns replaced by stingers...
export const NEPTUNE_PUFFER_CHANCE = .28;   // ...and then by pufferfish (phase 2+ only)
export const NEPTUNE_PUFF_TICKS = 30, NEPTUNE_PUFF_RADIUS = 3.5, NEPTUNE_PUFF_DAMAGE = 8, NEPTUNE_PUFF_KNOCKBACK = 2;
export const NEPTUNE_POISON_TICKS = 240;    // stinger poison: 3 damage per second for 4s
export const NEPTUNE_POISON_DAMAGE = 3;
export const NEPTUNE_TIDE_TICKS = 600;      // phases 1–2: one 10s tide every 20–30s
export const NEPTUNE_TIDE_GAP: [number, number] = [1200, 1800];
export const NEPTUNE_TIDE_ROTATE = 900;     // phase 3: two tides always flowing, moving every 15s
export const NEPTUNE_TIDE_WITH = 1.4, NEPTUNE_TIDE_AGAINST = .7;
export const NEPTUNE_TIDE_PUSH_GAP = 50;    // ticks between one-tile pushes when not swimming with the flow
export const NEPTUNE_JELLY_GAP: [number, number] = [1200, 1800]; // a jellyfish drifts in every 20–30s...
export const NEPTUNE_JELLY_CAP = 2;         // ...with at most two around
export const NEPTUNE_JELLY_DIVE_CHANCE = .5; // each dive also has this chance to bring one 4s in, even at the cap
export const NEPTUNE_JELLY_DIVE_DELAY = 240;
export const NEPTUNE_REVEAL_TICKS = 240;    // killing one during a dive marks a clone for 4s
export const NEPTUNE_SHARK_GAP: [number, number] = [450, 750];  // a shark every 7.5–12.5s
export const NEPTUNE_SHARK_FOLLOWUP_CHANCE: Record<1 | 2 | 3, number> = { 1: .35, 2: .43, 3: .5 };
export const NEPTUNE_SHARK_FOLLOWUP_DELAY = 60; // second charge begins 1s after the first
export const NEPTUNE_SHARK_TRIPLE_CHANCE = .1; // phase 3: a 10% chance that a shark brings two more, each 1s after the last
export const NEPTUNE_SHARK_WARNING = 72;    // lane warning before it charges
export const NEPTUNE_SHARK_SPEED = .5;      // tiles per tick
export const NEPTUNE_SHARK_DAMAGE = 22; // to you and to a placed Ruby
export const NEPTUNE_CLONE_PHASE3_SPEED = 1.25; // phase 3: echoes swim 25% faster
export const NEPTUNE_SHARK_KNOCKBACK = 3;   // tiles you are thrown sideways off its lane
export const NEPTUNE_SHARK_BOSS_DAMAGE = .05; // share of phase HP when she is caught in its lane

// Moon challenge (Shadow Queen): an illusion fight. She wears her Echo's look and hides among illusions that copy her;
// just before each jump she shows her true self and is vulnerable. Three phases, all playing the same for now.
export const MOON_PHASE_HP = 1850;           // per phase; she has three
export const MOON_FIRST_CLONES = 4;          // illusions on her first jump...
export const MOON_CLONES_PER_JUMP = 2;       // ...and on every jump after
export const MOON_CLONE_CAPS: Record<1 | 2 | 3, number> = { 1: 6, 2: 8, 3: 8 }; // the oldest fades when a new one would pass this
/** Sirius: each point of energy you gain also fills this much Holy Light (out of 100). A traced rune and Sirius Surge (F)
 * each count as exactly one full bar (100 points) however full your gauge was. */
export const SIRIUS_HOLY_PER_ENERGY = .15;
/** The Singularity backdrop's gravity gulp repeats this often (45s); its suck sound plays at the start of each. */
export const SINGULARITY_GULP_TICKS = 2700;
/** The gulp's own animation is timed against this span (10s), so a longer gap only adds quiet time between gulps. */
export const SINGULARITY_GULP_SHAPE = 600;
export const MOON_REVEAL_TICKS = 90;         // she shows her true self for the last 1.5s before a jump
export const MOON_REVEAL_DAMAGE_MULT = 2.5;  // and takes this much more damage then
export const MOON_QUEEN_DAMAGE_MULT = .4;    // her own hits are softer here (there are many shooters)
export const MOON_SHARD_COUNT = 8;           // a destroyed illusion bursts into a ring of crystal shards
export const MOON_SHARD_SPEED = 5;           // px per tick
export const MOON_SHARD_TICKS = 90;          // about 9 tiles of travel
export const MOON_SHARD_DAMAGE = 6;          // to you
export const MOON_SHARD_RUBY_DAMAGE = 4;     // to a placed Ruby
export const MOON_SHARD_HIT_RADIUS = .45;    // tiles
export const MOON_STRIKE_DAMAGE = .1;        // meteors deal this share of the phase to her
export const MOON_MITE_CHANCE = .6;          // share of the regular spawns left after the shade roll that are mirror mites (~53%)
// Phase 3: this share of regular alien spawns are Blinkers (a kill teleports you), at most MOON_BLINKER_MAX alive; rolled first.
export const MOON_BLINKER_CHANCE = .22;
export const MOON_BLINKER_MAX = 3;
export const MOON_HOUND = { chance: .16, max: 4, knockback: 2 }; // Crystal Hounds: rolled after shades, at most this many alive; the bite pushes you this many tiles
export const MOON_SHADE_CHANCE = .16;        // share of regular alien spawns that are shades (Ruby hunters), rolled first
export const MOON_DARK_SHIFT = 600;          // phase 3: darkness moves every 10s
export const MOON_DOUBLE_DARK_CHANCE = .35;
export const MOON_DARK_OVERLAY_TICKS = 24;  // screen haze fades on entering or leaving darkness
export const MOON_DARK_FADE = 30;            // visual: the dark fades across over 0.5s
export const MOON_SEEN_TICKS = 45;           // anything hit inside the dark shows itself for 0.75s
export const MOON_MIMIC_GAP = 360;           // every phase: a mimic arrives every 6s on its own timer (never replacing other spawns)...
export const MOON_MIMIC_CAP = 4;             // ...with at most this many alive
export const MOON_MIMIC_TRUE_TICKS: [number, number] = [120, 240];   // 2–4s in its own form, then it poses as an illusion for good
export const MOON_MITE_KILL_HEAL = 10;       // on top of the usual +5 kill heal
export const MOON_MITE_HINT_TICKS = 300;     // a mite kill shows two rooms on the minimap for 5s: hers and one other
export const MOON_HIT_HEAL = .3;             // this share of the HP she loses to your attacks heals you when she next jumps
export const MOON_MIRROR_STRIPS = 5;         // phase 2+: mirror strips per room; walkable, but they bounce your laser and bullets back into you
export const MOON_MIRROR_LENGTH = 3;         // tiles per strip
export const MOON_MIRROR_SHIFT = 1200;       // every 20s the mirrors move to new spots
export const MOON_MIRROR_FADE = 30;          // visual: old panes fade out, new ones fade in
export const MOON_SHADE_RUBY_PUSH = 3, MOON_RUBY_PUSH_STEP = 5; // a shade hit shoves a placed Ruby this many tiles away, one tile every this many ticks
export const MOON_MARK_TICKS = 360;          // C marks the nearest Queen or illusion for 6s; the mark follows her jumps
export const MOON_MARK_COOLDOWN = 600;       // 10s from each cast

// Gaia challenge (Thorn Weaver): overgrowth fight. Every floor tile has a growth level 0–3 (clean, moss, vines,
// thicket). Vines slow you and heal her; you clear them with attacks, meteors, Sunfire and Gaia's Roots.
// Three phases of GAIA_PHASE_HP; reaching a phase floor starts the next phase at once, and phase 3 plays like phase 2 until she dies.
export const GAIA_PHASE_HP = 3000;
export const GAIA_SEEK_RANGE = 8;               // when not fleeing she walks to overgrowth this close and lingers there
export const GAIA_CAST_COOLDOWN = 90;            // aimed fields every 1.5s after one lands (4s elsewhere)
export const GAIA_THORN_RUBY_DAMAGE = 1;         // a placed Ruby inside his field: 1 every 0.75s...
export const GAIA_THORN_RUBY_CUT = 3;            // ...after the eruption cuts it for this (you take 12)
export const GAIA_THORN_CONTACT_DAMAGE = 3;      // standing in his thorn field: 3 every 0.75s here (1 elsewhere), plus poison
export const GAIA_TRAIL_GAP = 90;                // she grows tiles within GAIA_TRAIL_RADIUS every 1.5s
export const GAIA_TRAIL_RADIUS = 2;
export const GAIA_CREEP_GAP = 180;               // every 3s vines creep into neighbours...
export const GAIA_CREEP_CHANCE = .15;            // ...clean neighbour -> moss
export const GAIA_MOSS_CHANCE = .08;             // ...moss next to vines -> vines
export const GAIA_CREEP_CAP = 120;               // at most this many upgrades per creep pass
export const GAIA_VINE_SLOW = .6, GAIA_THICKET_SLOW = .45;
export const GAIA_THICKET_DAMAGE = 1;            // per second while standing in thicket
export const GAIA_VINE_HEAL = .0095185546875, GAIA_THICKET_HEAL = .019037109375; // share of phase HP per second she heals on vines / thicket
export const GAIA_THICKET_ARMOR = .75;           // damage she takes while standing in thicket
export const GAIA_SCORCH_TICKS = 600;            // scorched tiles cannot regrow for 10s
export const GAIA_WARD_RADIUS = 2;               // placed Ruby keeps ground clean within this Chebyshev radius
export const GAIA_RING_RADIUS = 3;               // the ring vines must close around Ruby
export const GAIA_RING_WARN = .8;
export const GAIA_RING_DAMAGE = 3;               // per second while the ring is closed
// Sunfire (C) charges from overgrowth you clear (1 per level) and can be fired at any charge. A partial charge bursts around you at once,
// its reach and damage growing with the charge. A full charge picks a room, winds up, then burns the whole room:
// it costs you HP, and hits her hard if she is in that chamber.
export const GAIA_SUN_MAX = 100;
export const GAIA_SUN_CHARGE_RATE = .8262;        // Sunfire charge per growth level you clear
export const GAIA_CLEAR_HEAL = .1; // HP you and Ruby each heal per growth level you clear (no cap)
export const GAIA_POD_CHARGE = 6.885;                // breaking a seed pod adds this much
export const GAIA_SUN_MIN = 10;                  // smallest charge you can fire
export const GAIA_SUN_RADIUS: [number, number] = [2, 7]; // partial burst radius in tiles, from minimum to almost full
export const GAIA_SUN_WARNING = 180;             // full charge: 3s wind-up before the chamber burns
export const GAIA_SUN_DROP_SOUND_RATE = .68;     // stretches the 2.04s fall cue across the full wind-up
export const GAIA_SUN_WHOOSH_GAIN = .35;
// Shares of the current phase, ignoring her armor and thicket.
// A partial Sunfire scales its own share by its charge.
export const GAIA_STRIKE_DAMAGE = .1;
export const GAIA_SUN_DAMAGE = .12;
export const GAIA_SUN_SELF_DAMAGE = 50;          // full charge burns you and placed Ruby for this if inside the room (dodge it)
export const GAIA_STONE_COUNT = 8;
export const GAIA_STONE_HEAL = .01;              // share of player / Ruby max HP per successful Sunstone burn
export const GAIA_STONE_SELF_DAMAGE = .0495;     // a field burned by a Sunstone costs her this share of phase HP
export const GAIA_STONE_BLOOM_TICKS = 36; // contact bloom visual lifetime
export const GAIA_STONE_TRAVEL = 60, GAIA_STONE_RELIGHT = 60;
// Phase 3: each aimed cast adds a second field one field-width from you toward your nearest lit Sunstone, and lit
// stones hop 2 tiles in a random direction every 4s.
export const GAIA_P3_TWIN_OFFSET = 4;            // tiles between the two fields
export const GAIA_STONE_DRIFT_GAP = 240, GAIA_STONE_DRIFT_TICKS = 20, GAIA_STONE_DRIFT_STEP = 2; // every 4s, 2 tiles, random way
export const GAIA_POD_GAP: Record<1 | 2 | 3, number> = { 1: 900, 2: 1080, 3: 1080 };
export const GAIA_POD_FUSE = 480;                // 8s to burst
export const GAIA_POD_BURST_RADIUS = 3;
export const GAIA_BLOSSOM_GAP = 1080, GAIA_BLOSSOM_MAX = 4;
// Lifeblooms (help): rare in phase 1, more in phase 2, most in phase 3.
export const GAIA_LIFEBLOOM_GAP: Record<1 | 2 | 3, number> = { 1: 1500, 2: 900, 3: 360 }; // 25s, 15s, 6s
export const GAIA_LIFEBLOOM_MAX: Record<1 | 2 | 3, number> = { 1: 1, 2: 2, 3: 3 };
export const GAIA_LIFEBLOOM_HEAL = 25, GAIA_LIFEBLOOM_LIFE = 900;
export const GAIA_BLOSSOM_KILL_HEAL = 15;         // breaking a blossom heals you this much
export const GAIA_BLOSSOM_SELF_DAMAGE = .08;     // breaking a blossom costs her this share of the phase
export const GAIA_BLOSSOM_HEAL = .006;           // share of phase HP per second, per blossom
export const GAIA_BLOSSOM_SHOT_GAP = 180, GAIA_BLOSSOM_SHOT_RANGE = 7, GAIA_BLOSSOM_SHOT_DAMAGE = 4;
export const GAIA_POLLEN_SLOW_TICKS = 60, GAIA_POLLEN_SLOW = .7;
// Blossom pulse: an instant wave-like burst that knocks you back, fired only while you are in reach (it waits otherwise).
export const GAIA_BLOSSOM_PULSE = { gap: 480, firstGap: [180, 420] as [number, number], retry: 30, radius: 6, damage: 3, push: 4, ringTicks: 24 };
/** Tiles a blossom pulse reaches; it fires only when you stand on one. */
export function blossomPulseHits(bx: number, by: number, x: number, y: number) { return Math.hypot(bx - x, by - y) <= GAIA_BLOSSOM_PULSE.radius; }
export const GAIA_SNARE_GAP = 270, GAIA_SNARE_WARNING = 60, GAIA_SNARE_DAMAGE = 6, GAIA_SNARE_ROOT = 90;
export const GAIA_SPAWN_RATE = .6, GAIA_EXTRA_ENEMIES = 3; // aliens spawn 1.7× as often here, with 3 more allowed at once
export const GAIA_ALIEN_CHANCE = .5;             // share of natural alien spawns replaced by Gaia aliens: 40% Ragecaps,
                                                 // 30% each sporelings and vine crawlers
export const GAIA_MUSHROOM_KNOCKBACK = 2;        // tiles a Ragecap's hit pushes you
// A Sporeling's death cloud: slows you, poisons you (GAIA_SPORE_DAMAGE every GAIA_SPORE_EVERY ticks) and grows vines.
export const GAIA_SPORE_SHOT = { windup: 36, speed: 4.5, life: 112, radius: 1.5, slowTicks: 90, slow: .5 };
export const GAIA_SPORE_TICKS = 240, GAIA_SPORE_RADIUS = 2, GAIA_SPORE_SLOW = .7, GAIA_SPORE_DAMAGE = 2, GAIA_SPORE_EVERY = 30, GAIA_SPORE_GROWTH = 2;
export const GAIA_POLLEN_GAP = 1800, GAIA_POLLEN_TICKS = 480, GAIA_POLLEN_LASER = .5, GAIA_POLLEN_DRIFT_SLOW = .75; // inside the haze

export const METEORITE_CYCLE = 1800; // ticks (~30s) until next strike is chosen
export const METEORITE_WARNING = 300;  // ticks of warning (5s)
export const METEORITE_PLAYER_DMG = 75;
export const METEORITE_RUBY_DMG = 75;

// ─── BFS (re-exported for engine) ────────────────────────────────────────────
// Actual BFS lives in engine.ts; this comment is a cross-reference placeholder.

// One-use late-game rewards, starting with the tenth defeated boss.
export type SpecialSkill = 'fiery_king' | 'storm_reaper' | 'frost_warden' | 'sea_chanter' | 'blind_prayer' | 'splitter_queen' | 'thorn_weaver' | 'devourer' | 'aegis_sentinel' | 'astral_twins';
export const SPECIAL_UNLOCK_KILLS = 10;
export const SPECIAL_SKILLS = {
  devourer: { name: 'SINGULARITY', color: '#303036', bossDamage: 0, normalDamage: 0 },
  thorn_weaver: { name: "GAIA'S ROOTS", color: '#a5de65', bossDamage: 0, normalDamage: 0 },
  splitter_queen: { name: 'LUNAR ECHO', color: '#b278f3', bossDamage: 0, normalDamage: 0 },
  fiery_king: { name: 'SOLAR FLARE', color: '#ff5252', bossDamage: .1, normalDamage: 25 },
  storm_reaper: { name: 'JUPITER STORM', color: '#ffad4d', bossDamage: .25, normalDamage: 60 },
  frost_warden: { name: 'SATURN GUARD', color: '#68e0c9', bossDamage: 0, normalDamage: 0 },
  sea_chanter: { name: "NEPTUNE'S TIDE", color: '#5d9fff', bossDamage: 0, normalDamage: 0 },
  blind_prayer: { name: 'SIRIUS SURGE', color: '#ffe45c', bossDamage: 0, normalDamage: 0 },
  aegis_sentinel: { name: 'VENUS VEIL', color: '#f5dcc8', bossDamage: 0, normalDamage: 0 },
  astral_twins: { name: 'BINARY STAR', color: '#ff8f7a', bossDamage: 0, normalDamage: 0 },
} as const;
export const SPECIAL_REAPER_RADIUS = TILE_SIZE * 7;
export const SPECIAL_REAPER_SLOW = .5;
export const SPECIAL_REAPER_SLOW_TICKS = 60;
// Jupiter Storm also hastes you: +30% movement speed for 1.5s after each cast, in every mode.
export const SPECIAL_REAPER_HASTE_TICKS = 90, SPECIAL_REAPER_HASTE = 1.3;
export const BOSS_SKILL_REWARDS: Record<BossType, SpecialSkill> = {
  fiery_king: 'fiery_king', splitter_queen: 'splitter_queen', storm_reaper: 'storm_reaper',
  devourer: 'devourer', frost_warden: 'frost_warden', blind_prayer: 'blind_prayer',
  sea_chanter: 'sea_chanter', thorn_weaver: 'thorn_weaver',
  aegis_sentinel: 'aegis_sentinel', astral_twins: 'astral_twins',
};
export const SPECIAL_WARDEN_SHIELD = 40;
export const SPECIAL_SUSTAIN_PER_STAGE = 1; // Saturn Guard's shield and Neptune's Tide's heal grow by this per stage

// Venus Veil: player/placed Ruby take reduced damage; direct attackers receive the full hit back.
export const SPECIAL_VENUS_DURATION = 600;
export const SPECIAL_VENUS_DAMAGE_MULT = .35;
export const SPECIAL_VENUS_BOSS_REFLECT_CAP = .03;

// Binary Star: a stationary mirror twin beside Ruby repeats the player's attacks at reduced damage.
export const SPECIAL_TWIN_DURATION = 900;
export const SPECIAL_TWIN_DAMAGE_MULT = .6;

export const SPECIAL_CHANTER_HEAL = SPECIAL_WARDEN_SHIELD;
export const SPECIAL_CHANTER_RADIUS = TILE_SIZE * 8;
export const SPECIAL_CHANTER_PUSH = 3;
export const SPECIAL_PRAYER_DURATION = 360;

export const SPECIAL_QUEEN_DECOY_HITS = 12;

export const SPECIAL_WEAVER_DURATION = 1800;
export const GAIA_ROOTS_DURATION = 1500; // Gaia's Roots field lasts 25s in the Gaia challenge (30s elsewhere)
export const SPECIAL_WEAVER_RADIUS = TILE_SIZE * 6;
export const SPECIAL_WEAVER_SLOW = .6;
export const SPECIAL_WEAVER_NORMAL_DAMAGE = 4;
export const SPECIAL_WEAVER_BOSS_DAMAGE = .01;

export const REGULAR_ENEMY_HP_MULT = 1.1;
export const SPECIAL_SINGULARITY_RADIUS = TILE_SIZE * 5;
export const SPECIAL_SINGULARITY_TICKS = 1080;        // 18s field
export const SPECIAL_SINGULARITY_NORMAL_DAMAGE = 6;   // per second to regular aliens inside
export const SPECIAL_SINGULARITY_BOSS_DAMAGE = .015;  // share of boss max HP per second

export const SPECIAL_QUEEN_DECOY_INVULNERABILITY = 21; // .35 seconds after each connected hit
