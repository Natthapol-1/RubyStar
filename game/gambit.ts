import { TILE_SIZE, chamberOfTile, isBossType } from './constants';
import { ATTACK_SFX_VOLUME, damageEnemy, damagePlayer, hasLineOfSight, healPlayer, isFloorTile, killEnemy, playSFX_alienHit, type Enemy, type GameState } from './engine';
import { gameAudio } from './audio-settings';
import { playUiSfx } from './ui-sfx';

// Weapon sounds on the attack channel. Each gain sets the clip's loudest 50ms near the player's own attacks (the Laser
// lands about -19 dB before the attack volume, bullets about -22 dB); frequent sounds sit lower. See AUDIO.md.
const WEAPON_SFX = {
  orbitalCall: { file: 'falling-thing.wav', gain: .166, pitch: 1.4 },   // the strike is called down (-22 dB)
  orbitalBlast: { file: 'bombExplode.wav', gain: .35, pitch: .95 },     // it lands (-18 dB, a heavy hit)
  blade: { file: 'slash.mp3', gain: .87, pitch: 1.1 },                  // -20 dB
  dashCharge: { file: 'charging.wav', gain: .39, pitch: 1.2 },          // starts charging (-24 dB)
  dash: { file: 'speedBoost.mp3', gain: .37, pitch: 1.2 },              // -20 dB
  slingLatch: { file: 'place_bomb.wav', gain: .155, pitch: 1.2 },       // Ruby caught on the tether (-22 dB)
  slingThrow: { file: 'speedBoost.mp3', gain: .35, pitch: 1.4 },        // Ruby flung (-20 dB)
  slingImpact: { file: 'bombExplode.wav', gain: .3, pitch: 1.25 },      // Ruby lands (-19 dB)
  well: { file: 'reverse.mp3', gain: .245, pitch: 1 },                  // a reversed rush that pulls in (-20 dB)
  leap: { file: 'speedBoost.mp3', gain: .35, pitch: .9 },               // you leap (-20 dB)
  novaCharge: { file: 'charging.wav', gain: .39, pitch: .85 },          // starts charging (-24 dB)
  nova: { file: 'shield.mp3', gain: .45, pitch: .8 },                   // the burst (-20 dB)
  cannon: { file: 'laserBullet.mp3', gain: .32, pitch: .55 },          // a deep, heavy shot (-20 dB)
  cannonBurst: { file: 'bombExplode.wav', gain: .26, pitch: 1.1 },      // the orb bursts (-20 dB)
  glint: { file: 'gem_passive_2.wav', gain: .22, pitch: 1.6 },           // a Glint chip collected (-26 dB)
  mark: { file: 'jupiter-fence-hit.mp3', gain: .3, pitch: 1.4 },        // an enemy is marked (-22 dB)
  markArc: { file: 'jupiter-fence-hit.mp3', gain: .26, pitch: 1.15 },   // the mark sends lightning (-23 dB)
  leapLand: { file: 'bombExplode.wav', gain: .32, pitch: .85 },         // you land by Ruby (-19 dB)
} as const;
function weaponSfx(cue: keyof typeof WEAPON_SFX) {
  try {
    const { file, gain, pitch } = WEAPON_SFX[cue], a = gameAudio('/sounds/' + file, 'attack');
    a.volume = gain * ATTACK_SFX_VOLUME; if ((pitch as number) !== 1) { a.playbackRate = pitch; a.preservesPitch = false; } a.play().catch(() => {});
  } catch { }
}

// Star Gambit weapon: one per run, on the Primal Skill control (it replaces the primal skill). Laser, bullets and the
// Pulse Wave stay on their usual controls. Hold weapons (a charged Comet Dash) charge while that control is held.
export type WeaponId = 'orbital' | 'blade' | 'dash' | 'sling' | 'well' | 'leap' | 'mark' | 'cannon' | 'nova';
export const WEAPON_IDS: WeaponId[] = ['orbital', 'blade', 'dash', 'sling', 'well', 'leap', 'mark', 'cannon', 'nova'];
export const WEAPONS: Record<WeaponId, { name: string; desc: string; color: string; hold?: boolean }> = {
  orbital: { name: 'ORBITAL STRIKE', desc: 'Strikes the spot under your cursor after a short delay.', color: '#ffb84d' },
  blade: { name: 'ARC BLADE', desc: 'Slashes enemies in front of you and knocks them back.', color: '#ff7a9a' },
  sling: { name: 'RUBY SLING', desc: 'Hold to tow Ruby behind you, release to fling it the way you face. Where it lands, enemies are hurt and stunned.', color: '#ff6f9f', hold: true },
  well: { name: 'GRAVITY WELL', desc: 'A quick field at your cursor that pulls enemies in for a short while and hurts them a little.', color: '#b07aff' },
  leap: { name: 'RUBY LEAP', desc: 'Jump to Ruby when it is in range. Where you land, enemies are hurt and pushed away.', color: '#ffb0c8' },
  nova: { name: 'SIPHON NOVA', desc: 'Hold to grow a field around you (you move slower). Release to slow and hurt every enemy in it, healing you for each one.', color: '#7affc4', hold: true },
  cannon: { name: 'STAR CANNON', desc: 'Fires one big, slow orb the way you face that hits every enemy it passes and knocks them back.', color: '#7ad8ff' },
  mark: { name: 'STORM MARK', desc: 'Marks the enemy nearest your cursor. Your hits on it send lightning to enemies around it.', color: '#fff27a' },
  dash: { name: 'COMET DASH', desc: 'Dash the way you are moving or facing, through enemies. Hold longer to go further.', color: '#8fd8ff', hold: true },
};

export const GAMBIT = {
  // Skills on the Primal Skill control. Balance: each is worth roughly 12-24 damage to a group every 3.5-7s, and skills
  // with extra utility (stun, pull, heal, movement, lightning) trade some damage or cooldown for it. Blade is the most
  // frequent but melee only; Ruby skills need Ruby placed nearby.
  orbital: { delay: 50, damage: 24, radius: 1, cooldown: 300 },             // every 5s: a 3x3 strike after .83s; the biggest single hit, but it must be aimed ahead
  blade: { reach: 1.8, damage: 8, push: 2, cooldown: 90 }, // every 1.5s: the most frequent skill, but only in melee; push: tiles each hit enemy is knocked back
  sling: { range: 8, maxHold: 180, towEvery: 6, fling: 7, aimCone: 30, flight: 12, radius: 1, damage: 14, stun: 90, cooldown: 270 }, // every 4.5s: latch Ruby within 8 tiles; a 3x3 landing hit and 1.5s stun (needs Ruby nearby)
  well: { delay: 20, radius: 2, life: 120, pulse: 15, damage: 2, cooldown: 360 }, // every 6s: a 5x5 field after .33s that pulls for 2s; 2 damage per pull (16 in all): control first
  leap: { range: 12, speed: .4, minFlight: 8, radius: 3, damage: 12, push: 2, cooldown: 360 }, // every 6s: jump to Ruby within 12 tiles at .4 tiles/tick; a 7x7 landing hit pushing 2 tiles (needs Ruby in range)
  nova: { charge: 90, holdMove: .5, minRadius: 1, maxRadius: 5, minDamage: 3, maxDamage: 8, minHeal: 1, maxHeal: 2, maxTotalHeal: 15, slow: .5, minSlow: 90, maxSlow: 180, cooldown: 420 }, // every 7s: a 1.5s full charge at half speed; square radius in tiles; heal per enemy hit (at most 15)
  cannon: { speed: 3.5, radius: 1.5, damage: 14, push: 1, cooldown: 300 }, // every 5s: px/tick; flies until it meets a wall; a 3-tile-wide square orb (radius 1.5 tiles); each enemy hit once
  mark: { aim: 2.5, ticks: 360, range: 4, targets: 2, damage: 5, every: 30, cooldown: 600 }, // every 10s: mark the enemy within 2.5 tiles of the cursor for 6s; each hit on it arcs to 2 enemies within 4 tiles (at most every .5s)
  dash: { minTiles: 1, maxTiles: 7, charge: 45, curve: 2, speedMult: 3, damage: 12, cooldown: 210 }, // every 3.5s: a tap goes minTiles, a full hold maxTiles; distance grows with charge^curve; speedMult: 3x knockback speed
} as const;

export interface GambitState {
  weapon: WeaponId;                          // the run's weapon, on the Primal Skill control
  picked: boolean;                           // false until the start-of-run slot machine has given you a weapon
  glint: number;                             // the run's currency
  bills: number; debt: number; billFlash: number; // oxygen: bills charged so far, unpaid Glint owed, and a HUD flash after a bill
  wave: number; waveTicks: number;           // the current wave and the ticks left in it
  cd: number;                                // the weapon's cooldown
  charge: number;                            // hold-charge ticks (Comet Dash)
  aimX: number; aimY: number;                // the mouse, as an offset from you in pixels
  cursorX: number; cursorY: number;          // world pixels (you + aim), refreshed every tick
  strikes: { x: number; y: number; ticks: number; blast: number }[];
  arcs: { x: number; y: number; dx: number; dy: number; ticks: number }[];
  dash: { hit: number[]; ticks: number; fromX: number; fromY: number } | null; // fromX/Y: where the dash started, for its streak
  sling: { held: number; tow: number } | null;                                // Ruby on the tether: ticks held, towing timer
  slingFlight: { fromX: number; fromY: number; toX: number; toY: number; ticks: number } | null; // Ruby in the air (tiles)
  leapFlight: { fromX: number; fromY: number; toX: number; toY: number; tx: number; ty: number; ticks: number; total: number } | null; // your leap in the air (pixels; tx/ty: landing tile)
  blasts: { x: number; y: number; ticks: number; kind: 'sling' | 'leap' | 'cannon' }[];
  novas: { x: number; y: number; radius: number; ticks: number; hits: number }[]; // Siphon Nova bursts (pixels, radius in tiles)
  wells: { x: number; y: number; delay: number; ticks: number; pulse: number }[];
  mark: { id: number; ticks: number; ready: number } | null;                // Storm Mark: the marked enemy, time left and arc cooldown
  orbs: { x: number; y: number; dx: number; dy: number; travelled: number; hit: number[] }[]; // Star Cannon orbs in flight (pixels; travelled -1 = burst)
  drops: { x: number; y: number; value: number; ticks: number; speed: number }[]; // Glint chips on the floor (pixels); speed > 0 while flying to you
}

/** Glint, the run's currency: every alien killed (not by a meteor) drops one chip worth about its max HP / perHp, +perWave
 * for each wave after the first (at least 1). A chip within pickup tiles of you (in any direction, diagonals too) flies to you and is collected; uncollected
 * chips fade after life ticks, blinking in their last blink ticks. */
export const GLINT = { perHp: .05, perWave: .1, pickup: 2, life: 1200, blink: 180, flySpeed: 4, flyAccel: .6, scatter: 10 } as const;

/** Oxygen: after every `every` waves the station bills you base × growth^n Glint (n = bills so far, to the nearest 10). It takes
 * what you have; any shortfall becomes debt. While in debt you lose 1 HP per drainPer Glint owed (rounded, at least 1)
 * every drainEvery ticks, so a bigger debt hurts faster; Glint you collect pays the debt first. */
export const OXYGEN = { every: 3, base: 1000, growth: 1.5, drainPer: 500, drainEvery: 60 } as const;
/** The size of the next oxygen bill. */
export function oxygenBill(s: GameState) { return Math.round(OXYGEN.base * Math.pow(OXYGEN.growth, s.gambit?.bills ?? 0) / 10) * 10; } // to the nearest 10
/** HP lost per second while owing this much oxygen debt. */
export function oxygenDrain(debt: number) { return debt > 0 ? Math.max(1, Math.round(debt / OXYGEN.drainPer)) : 0; }
/** Waves left (counting the current one) until the next oxygen bill. */
export function wavesToBill(s: GameState) { const w = s.gambit?.wave ?? 1; return OXYGEN.every - ((w - 1) % OXYGEN.every); }

/** How long each wave lasts (45 s). Nothing spawns yet; the clock only advances the wave number. */
export const GAMBIT_WAVE_TICKS = 2700;

export function createGambitState(s: GameState) {
  s.gambit = { weapon: 'orbital', picked: false, glint: 0, bills: 0, debt: 0, billFlash: 0, wave: 1, waveTicks: GAMBIT_WAVE_TICKS, cd: 0, charge: 0, aimX: 0, aimY: 0, cursorX: s.playerX, cursorY: s.playerY,
    strikes: [], arcs: [], dash: null, sling: null, slingFlight: null, leapFlight: null, blasts: [], wells: [], mark: null, orbs: [], novas: [], drops: [] };
}

/** The slot machine's lucky weapon weighs this much in a pull (every other weapon weighs 1). */
export const LUCKY_WEIGHT = 3;
/** One pull of the start-of-run slot machine: three different weapons, drawn by weight, the lucky one LUCKY_WEIGHT times
 * as likely as each other. */
export function rollWeapons(lucky: WeaponId | null, rng: () => number = Math.random): WeaponId[] {
  const pool = [...WEAPON_IDS], out: WeaponId[] = [];
  while (out.length < 3 && pool.length) {
    const weights = pool.map(id => id === lucky ? LUCKY_WEIGHT : 1), total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total, k = 0;
    while (k < pool.length - 1 && r >= weights[k]) { r -= weights[k]; k++; }
    out.push(pool.splice(k, 1)[0]);
  }
  return out;
}
/** The chance (0–1) that the lucky weapon shows up among the three in a pull. */
export function luckyOdds() {
  const n = WEAPON_IDS.length, others = n - 1; let miss = 1, rest = others, total = others + LUCKY_WEIGHT;
  for (let k = 0; k < 3; k++) { miss *= rest / total; rest--; total--; }
  return 1 - miss;
}

/** God / loadout screen: choose the run's weapon. */
export function setWeapon(s: GameState, id: WeaponId) {
  const g = s.gambit; if (!g) return;
  g.weapon = id; g.picked = true; g.cd = 0; g.charge = 0; g.sling = null;
}

const living = (s: GameState) => s.enemies.filter(e => e.hp > 0 && !e.twin?.downedTicks);
function hit(s: GameState, e: Enemy, amount: number): boolean {
  if (e.hp <= 0 || !s.enemies.includes(e)) return false;
  damageEnemy(s, e, amount, 'player');
  if (e.hp <= 0 && s.enemies.includes(e)) killEnemy(s, s.enemies.indexOf(e));
  return true;
}
function push(s: GameState, e: Enemy, dx: number, dy: number, tiles: number) {
  if (isBossType(e.type) || (e.pushTiles ?? 0) > 0) return;
  const horizontal = Math.abs(dx) >= Math.abs(dy), kx = horizontal ? Math.sign(dx) : 0, ky = horizontal ? 0 : Math.sign(dy);
  if ((kx || ky) && isFloorTile(s.map, e.tileX + kx, e.tileY + ky)) { e.pushDirX = kx; e.pushDirY = ky; e.pushTiles = tiles; }
}

/** The Primal Skill control went down. Tap weapons fire now; Comet Dash starts charging. */
export function pressWeapon(s: GameState) {
  const g = s.gambit; if (!g || s.gamePhase !== 'playing' || s.playerFrozenTicks > 0) return;
  g.cursorX = s.playerX + g.aimX; g.cursorY = s.playerY + g.aimY;
  const id = g.weapon;
  if (id === 'dash') { if (g.cd <= 0) { g.charge = 1; weaponSfx('dashCharge'); } return; } // charges while held, fires on release
  if (id === 'nova') { if (g.cd <= 0) { g.charge = 1; weaponSfx('novaCharge'); } return; } // grows while held, bursts on release
  if (id === 'sling') { if (g.cd <= 0 && rubyReachable(s)) { g.sling = { held: 0, tow: GAMBIT.sling.towEvery }; weaponSfx('slingLatch'); } return; }
  if (g.cd > 0) return;
  if (fire(s, id)) g.cd = GAMBIT[id].cooldown;
}
/** The Primal Skill control is held this tick: Comet Dash keeps charging; Ruby Sling tows Ruby behind you. */
export function holdWeapon(s: GameState) {
  const g = s.gambit; if (!g || s.gamePhase !== 'playing') return;
  if (g.weapon === 'dash' && g.charge > 0) g.charge = Math.min(GAMBIT.dash.charge, g.charge + 1);
  if (g.weapon === 'nova' && g.charge > 0) g.charge = Math.min(GAMBIT.nova.charge, g.charge + 1);
  if (g.weapon === 'sling' && g.sling) {
    if (!rubyReachable(s)) { g.sling = null; return; }
    if (++g.sling.held >= GAMBIT.sling.maxHold) { releaseWeapon(s); return; } // the tether lets go on its own
    if (!s.playerCarryingRuby && --g.sling.tow <= 0) { // a placed Ruby is towed one tile toward you at a time, a tile behind you
      g.sling.tow = GAMBIT.sling.towEvery;
      if (Math.max(Math.abs(s.playerTileX - s.rubyTileX), Math.abs(s.playerTileY - s.rubyTileY)) > 1) {
        const dx = Math.sign(s.playerTileX - s.rubyTileX), dy = Math.sign(s.playerTileY - s.rubyTileY);
        const step = [[dx, dy], [dx, 0], [0, dy]].find(([x, y]) => (x || y) && isFloorTile(s.map, s.rubyTileX + x, s.rubyTileY + y));
        if (step) { s.rubyTileX += step[0]; s.rubyTileY += step[1]; }
      }
    }
  }
}
/** The Primal Skill control came up: a charged Comet Dash goes. */
export function releaseWeapon(s: GameState) {
  const g = s.gambit; if (!g) return;
  if (g.weapon === 'dash' && g.charge > 0) {
    const f = g.charge / GAMBIT.dash.charge; g.charge = 0;
    if (s.gamePhase === 'playing' && g.cd <= 0 && cometDash(s, f)) g.cd = GAMBIT.dash.cooldown;
  }
  if (g.weapon === 'nova' && g.charge > 0) {
    const f = g.charge / GAMBIT.nova.charge; g.charge = 0;
    if (s.gamePhase === 'playing' && g.cd <= 0) { siphonNova(s, f); g.cd = GAMBIT.nova.cooldown; }
  }
  if (g.weapon === 'sling' && g.sling) { g.sling = null; if (s.gamePhase === 'playing' && rubyReachable(s) && flingRuby(s)) g.cd = GAMBIT.sling.cooldown; }
}

/** Ruby Sling can take Ruby when you carry it, or when it is placed within range (not held by a Snatcher or in the air). */
function rubyReachable(s: GameState) {
  if (s.rubyStolenBy !== undefined || s.gambit?.slingFlight) return false;
  if (s.playerCarryingRuby) return true;
  return s.rubyTileX !== -1 && Math.hypot(s.rubyTileX - s.playerTileX, s.rubyTileY - s.playerTileY) <= GAMBIT.sling.range;
}
/** Ruby Sling release, like the Singularity's Gravity Hook: Ruby comes to your tile (if it is in sight), then flies up to
 * fling tiles the way you face, bending toward an enemy within aimCone; it stops at walls and at the first enemy. */
function flingRuby(s: GameState): boolean {
  const g = s.gambit!, S = GAMBIT.sling;
  const carried = s.playerCarryingRuby, clear = carried || hasLineOfSight(s.map, s.playerTileX, s.playerTileY, s.rubyTileX, s.rubyTileY);
  const ox = clear ? s.playerTileX : s.rubyTileX, oy = clear ? s.playerTileY : s.rubyTileY;
  const fl = Math.hypot(s.playerDirX, s.playerDirY), fx = fl ? s.playerDirX / fl : 1, fy = fl ? s.playerDirY / fl : 0;
  const cone = Math.cos(S.aimCone * Math.PI / 180);
  const target = living(s).filter(e => { const dx = e.tileX - ox, dy = e.tileY - oy, d = Math.hypot(dx, dy); return d > 0 && d <= S.fling && (dx * fx + dy * fy) / d >= cone; })
    .sort((a, b) => Math.hypot(a.tileX - ox, a.tileY - oy) - Math.hypot(b.tileX - ox, b.tileY - oy))[0];
  const [ax, ay] = target ? [target.tileX, target.tileY] : [ox + Math.round(fx * S.fling), oy + Math.round(fy * S.fling)];
  const steps = Math.max(Math.abs(ax - ox), Math.abs(ay - oy));
  let lx = ox, ly = oy;
  for (let i = 1; i <= steps; i++) {
    const tx = Math.round(ox + (ax - ox) * i / steps), ty = Math.round(oy + (ay - oy) * i / steps);
    if (!isFloorTile(s.map, tx, ty)) break;
    lx = tx; ly = ty;
    if (living(s).some(e => e.tileX === tx && e.tileY === ty)) break;
  }
  if (carried) s.playerCarryingRuby = false;
  s.rubyTileX = -1; s.rubyTileY = -1; // in the air until it lands
  g.slingFlight = { fromX: ox, fromY: oy, toX: lx, toY: ly, ticks: S.flight };
  weaponSfx('slingThrow'); return true;
}
/** Ruby lands: it is placed on the tile, and every enemy within radius takes damage and is stunned. */
function landRuby(s: GameState) {
  const g = s.gambit!, f = g.slingFlight!, S = GAMBIT.sling; g.slingFlight = null;
  s.rubyTileX = f.toX; s.rubyTileY = f.toY;
  let landed = false;
  for (const e of living(s)) if (Math.max(Math.abs(e.tileX - f.toX), Math.abs(e.tileY - f.toY)) <= S.radius) {
    landed = hit(s, e, S.damage) || landed;
    if (e.hp > 0) e.buildStopUntil = Math.max(e.buildStopUntil ?? 0, s.gameTick + S.stun);
  }
  g.blasts.push({ x: f.toX, y: f.toY, ticks: 24, kind: 'sling' }); weaponSfx('slingImpact'); if (landed) playSFX_alienHit();
}

/** Ruby Leap: jump to a free tile beside a placed Ruby within range (the one nearest you). You fly there at a steady
 * speed, so a longer jump takes longer; on landing, enemies within radius take damage and are pushed away. */
function rubyLeap(s: GameState): boolean {
  const g = s.gambit!, L = GAMBIT.leap;
  if (s.playerCarryingRuby || s.rubyTileX === -1 || s.rubyStolenBy !== undefined) return false;
  if (Math.hypot(s.rubyTileX - s.playerTileX, s.rubyTileY - s.playerTileY) > L.range) return false;
  const spots = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([dx, dy]) => [s.rubyTileX + dx, s.rubyTileY + dy])
    .filter(([x, y]) => isFloorTile(s.map, x, y) && !living(s).some(e => e.tileX === x && e.tileY === y))
    .sort((a, b) => Math.hypot(a[0] - s.playerTileX, a[1] - s.playerTileY) - Math.hypot(b[0] - s.playerTileX, b[1] - s.playerTileY));
  const [tx, ty] = spots[0] ?? [s.rubyTileX, s.rubyTileY];
  const total = Math.max(L.minFlight, Math.round(Math.hypot(tx - s.playerTileX, ty - s.playerTileY) / L.speed)); // the same speed for any distance
  g.leapFlight = { fromX: s.playerX, fromY: s.playerY, toX: (tx + .5) * TILE_SIZE, toY: (ty + .5) * TILE_SIZE, tx, ty, ticks: total, total };
  s.playerKnockback = null; weaponSfx('leap');
  return true;
}
/** Mid-leap: you move along the jump each tick (your own movement waits); at the end you land and the blast goes off. */
function leapStep(s: GameState) {
  const g = s.gambit!, f = g.leapFlight!, L = GAMBIT.leap, p = 1 - --f.ticks / f.total;
  const x = f.fromX + (f.toX - f.fromX) * p, y = f.fromY + (f.toY - f.fromY) * p, tx = Math.floor(x / TILE_SIZE), ty = Math.floor(y / TILE_SIZE);
  Object.assign(s, { playerX: x, playerY: y, playerTileX: tx, playerTileY: ty, playerTargetX: tx, playerTargetY: ty, playerStepProgress: 0, playerKnockback: null, playerChamber: chamberOfTile(tx, ty) });
  if (f.ticks > 0) return;
  g.leapFlight = null;
  Object.assign(s, { playerX: f.toX, playerY: f.toY, playerTileX: f.tx, playerTileY: f.ty, playerTargetX: f.tx, playerTargetY: f.ty, playerChamber: chamberOfTile(f.tx, f.ty) });
  let landed = false;
  for (const e of living(s)) if (Math.max(Math.abs(e.tileX - f.tx), Math.abs(e.tileY - f.ty)) <= L.radius) {
    landed = hit(s, e, L.damage) || landed;
    if (e.hp > 0) push(s, e, e.tileX - f.tx, e.tileY - f.ty, L.push);
  }
  g.blasts.push({ x: f.tx, y: f.ty, ticks: 24, kind: 'leap' }); weaponSfx('leapLand'); if (landed) playSFX_alienHit();
}

function fire(s: GameState, id: WeaponId): boolean {
  const g = s.gambit!, px = s.playerX, py = s.playerY;
  switch (id) {
    case 'orbital': {
      const tx = Math.floor(g.cursorX / TILE_SIZE), ty = Math.floor(g.cursorY / TILE_SIZE);
      if (!isFloorTile(s.map, tx, ty)) return false;
      g.strikes.push({ x: tx, y: ty, ticks: GAMBIT.orbital.delay, blast: 0 }); weaponSfx('orbitalCall'); return true;
    }
    case 'well': {
      const tx = Math.floor(g.cursorX / TILE_SIZE), ty = Math.floor(g.cursorY / TILE_SIZE);
      if (!isFloorTile(s.map, tx, ty)) return false;
      g.wells.push({ x: tx, y: ty, delay: GAMBIT.well.delay, ticks: GAMBIT.well.life, pulse: 0 }); weaponSfx('well'); return true;
    }
    case 'leap': return rubyLeap(s);
    case 'cannon': {
      const ux = s.playerDirX || (s.playerDirY ? 0 : 1), uy = s.playerDirX ? 0 : s.playerDirY; // straight the way you face
      g.orbs.push({ x: px, y: py, dx: ux * GAMBIT.cannon.speed, dy: uy * GAMBIT.cannon.speed, travelled: 0, hit: [] }); weaponSfx('cannon'); return true;
    }
    case 'mark': {
      const target = markTarget(s); if (!target) return false;
      g.mark = { id: target.id, ticks: GAMBIT.mark.ticks, ready: 0 }; weaponSfx('mark'); return true;
    }
    case 'blade': {
      const dx = s.playerDirX || (s.playerDirY ? 0 : 1), dy = s.playerDirY; let landed = false; // the way you face
      for (const e of living(s)) {
        const ex = e.x - px, ey = e.y - py, d = Math.hypot(ex, ey) / TILE_SIZE;
        if (d <= GAMBIT.blade.reach && (ex * dx + ey * dy) >= -TILE_SIZE * .2) { landed = hit(s, e, GAMBIT.blade.damage) || landed; push(s, e, ex, ey, GAMBIT.blade.push); }
      }
      g.arcs.push({ x: px, y: py, dx, dy, ticks: 14 }); weaponSfx('blade'); if (landed) playSFX_alienHit(); return true;
    }
  }
  return false;
}

/** Comet Dash: a dash the way you are moving (or facing when still), 1 tile on a tap up to 7 on a full hold,
 * hitting everything it passes. A tap goes 1 tile and short holds stay short; it moves at 3x knockback speed. */
function cometDash(s: GameState, charge: number) {
  const g = s.gambit!, mx = Math.sign(s.playerTargetX - s.playerTileX), my = Math.sign(s.playerTargetY - s.playerTileY);
  const [dx, dy] = mx || my ? [mx, my] : s.playerQueuedDirX || s.playerQueuedDirY ? [s.playerQueuedDirX, s.playerQueuedDirY] : s.playerDirX || s.playerDirY ? [s.playerDirX, s.playerDirY] : [1, 0];
  const horizontal = Math.abs(dx) >= Math.abs(dy), kx = horizontal ? Math.sign(dx) : 0, ky = horizontal ? 0 : Math.sign(dy);
  if (!isFloorTile(s.map, s.playerTargetX + kx, s.playerTargetY + ky)) return false;
  const tiles = Math.round(GAMBIT.dash.minTiles + (GAMBIT.dash.maxTiles - GAMBIT.dash.minTiles) * Math.pow(charge, GAMBIT.dash.curve));
  s.playerKnockback = { dirX: kx, dirY: ky, started: false, tilesLeft: tiles, shaken: true, speedMult: GAMBIT.dash.speedMult };
  g.dash = { hit: [], ticks: 40, fromX: s.playerX, fromY: s.playerY };
  weaponSfx('dash'); return true;
}

/** Once per playing tick: cooldowns, delayed strikes, the dash and fading effects. */
export function updateGambit(s: GameState) {
  const g = s.gambit; if (!g || s.gamePhase !== 'playing') return;
  g.cursorX = s.playerX + g.aimX; g.cursorY = s.playerY + g.aimY;
  if (g.cd > 0 && --g.cd === 0) playUiSfx('fenceReady'); // the shared primal-skill ready cue
  if (--g.waveTicks <= 0) endWave(s);
  if (g.billFlash > 0) g.billFlash--;
  if (g.debt > 0) { // in debt: new Glint pays it off first, and the thin air hurts
    const pay = Math.min(g.glint, g.debt); g.glint -= pay; g.debt -= pay;
    if (g.debt > 0 && s.gameTick % OXYGEN.drainEvery === 0) { damagePlayer(s, oxygenDrain(g.debt)); if (s.gamePhase !== 'playing') return; }
  }
  // Comet Dash: hit everything near you while the dash carries you.
  if (g.dash) {
    for (const e of living(s)) if (!g.dash.hit.includes(e.id) && Math.hypot(e.x - s.playerX, e.y - s.playerY) <= TILE_SIZE * .9) { g.dash.hit.push(e.id); if (hit(s, e, GAMBIT.dash.damage)) playSFX_alienHit(); }
    if (--g.dash.ticks <= 0 || !s.playerKnockback) g.dash = null;
  }
  for (const st of g.strikes) {
    if (st.ticks > 0 && --st.ticks === 0) {
      st.blast = 24; weaponSfx('orbitalBlast'); let landed = false;
      for (const e of living(s)) if (Math.abs(e.tileX - st.x) <= GAMBIT.orbital.radius && Math.abs(e.tileY - st.y) <= GAMBIT.orbital.radius) landed = hit(s, e, GAMBIT.orbital.damage) || landed;
      if (landed) playSFX_alienHit();
    } else if (st.ticks === 0 && st.blast > 0) st.blast--;
  }
  g.strikes = g.strikes.filter(st => st.ticks > 0 || st.blast > 0);
  // Ruby Sling: Ruby lands at the end of its flight. Ruby Leap's arc fades.
  if (g.slingFlight && --g.slingFlight.ticks <= 0) landRuby(s);
  if (g.leapFlight) leapStep(s);
  g.blasts = g.blasts.filter(b => --b.ticks > 0);
  // Gravity Well: after a short delay, every pulse pulls each enemy in the field one tile toward its centre and hurts it a little.
  for (const w of g.wells) {
    if (w.delay > 0) { w.delay--; continue; }
    w.ticks--;
    if (--w.pulse > 0) continue;
    w.pulse = GAMBIT.well.pulse;
    for (const e of living(s)) {
      const dx = w.x - e.tileX, dy = w.y - e.tileY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > GAMBIT.well.radius) continue;
      hit(s, e, GAMBIT.well.damage); if (dx || dy) push(s, e, dx, dy, 1);
    }
  }
  g.wells = g.wells.filter(w => w.delay > 0 || w.ticks > 0);
  // Storm Mark: it fades after its time or when the enemy dies.
  if (g.mark) { if (g.mark.ready > 0) g.mark.ready--; if (--g.mark.ticks <= 0 || !living(s).some(e => e.id === g.mark!.id)) g.mark = null; }
  // Star Cannon: each orb drifts on, hitting every enemy it touches once (with a small knockback), until it bursts at a wall.
  for (const o of g.orbs) {
    o.x += o.dx; o.y += o.dy; o.travelled += Math.hypot(o.dx, o.dy);
    for (const e of living(s)) if (!o.hit.includes(e.id) && Math.max(Math.abs(e.x - o.x), Math.abs(e.y - o.y)) <= GAMBIT.cannon.radius * TILE_SIZE) {
      o.hit.push(e.id); if (hit(s, e, GAMBIT.cannon.damage)) playSFX_alienHit(); if (e.hp > 0) push(s, e, o.dx, o.dy, GAMBIT.cannon.push);
    }
    if (!isFloorTile(s.map, Math.floor(o.x / TILE_SIZE), Math.floor(o.y / TILE_SIZE))) {
      o.travelled = -1; g.blasts.push({ x: Math.floor(o.x / TILE_SIZE), y: Math.floor(o.y / TILE_SIZE), ticks: 18, kind: 'cannon' }); weaponSfx('cannonBurst');
    }
  }
  g.orbs = g.orbs.filter(o => o.travelled >= 0);
  g.novas = g.novas.filter(n => --n.ticks > 0);
  // Glint: chips within pickup tiles fly to you; one that reaches you is counted.
  for (const d of g.drops) {
    d.ticks--;
    if (!d.speed && Math.max(Math.abs(Math.floor(d.x / TILE_SIZE) - s.playerTileX), Math.abs(Math.floor(d.y / TILE_SIZE) - s.playerTileY)) <= GLINT.pickup) d.speed = GLINT.flySpeed;
    if (!d.speed) continue;
    const dx = s.playerX - d.x, dy = s.playerY - d.y, len = Math.hypot(dx, dy);
    if (len <= d.speed + 6) { g.glint += d.value; d.ticks = -1; weaponSfx('glint'); continue; }
    d.x += dx / len * d.speed; d.y += dy / len * d.speed; d.speed += GLINT.flyAccel;
  }
  g.drops = g.drops.filter(d => d.ticks > 0);
  g.arcs = g.arcs.filter(a => --a.ticks > 0);
}

/** Storm Mark's target: the living enemy nearest the cursor, within aim tiles of it. */
export function markTarget(s: GameState): Enemy | undefined {
  const g = s.gambit; if (!g) return undefined;
  const cx = s.playerX + g.aimX, cy = s.playerY + g.aimY, reach = GAMBIT.mark.aim * TILE_SIZE;
  return living(s).filter(e => Math.hypot(e.x - cx, e.y - cy) <= reach).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0];
}
/** One of your attacks hit an enemy (the same hook as the Sniper kill buff): when it is the marked one, lightning arcs to
 * the nearest enemies around it, like the Sniper buff's chain. */
export function gambitMarkHit(s: GameState, e: Enemy) {
  const m = s.gambit?.mark; if (!m || m.id !== e.id || m.ready > 0) return;
  m.ready = GAMBIT.mark.every;
  const near = living(s).filter(o => o !== e && Math.hypot(o.tileX - e.tileX, o.tileY - e.tileY) <= GAMBIT.mark.range)
    .sort((a, b) => Math.hypot(a.tileX - e.tileX, a.tileY - e.tileY) - Math.hypot(b.tileX - e.tileX, b.tileY - e.tileY)).slice(0, GAMBIT.mark.targets);
  for (const o of near) { s.lightningArcs.push({ fromX: e.x, fromY: e.y, toX: o.x, toY: o.y, ticks: 22 }); damageEnemy(s, o, GAMBIT.mark.damage); }
  if (near.length) weaponSfx('markArc');
}

/** Siphon Nova's square radius (tiles) at a charge fraction 0–1. */
export function novaRadius(f: number) { const N = GAMBIT.nova; return N.minRadius + (N.maxRadius - N.minRadius) * f; }
/** Siphon Nova release: every enemy within the square radius is slowed and hurt, and you heal for each one hit (capped).
 * Radius, damage, heal and slow all grow with the charge. */
function siphonNova(s: GameState, f: number) {
  const g = s.gambit!, N = GAMBIT.nova, lerp = (a: number, b: number) => a + (b - a) * f, r = novaRadius(f) * TILE_SIZE;
  const caught = living(s).filter(e => Math.max(Math.abs(e.x - s.playerX), Math.abs(e.y - s.playerY)) <= r + TILE_SIZE / 2);
  const damage = Math.round(lerp(N.minDamage, N.maxDamage)), slowTicks = Math.round(lerp(N.minSlow, N.maxSlow));
  for (const e of caught) {
    hit(s, e, damage);
    if (e.hp > 0) { e.weaponSlowUntil = s.gameTick + slowTicks; e.weaponSlowMult = N.slow; }
  }
  if (caught.length) { healPlayer(s, Math.min(N.maxTotalHeal, caught.length * lerp(N.minHeal, N.maxHeal))); playSFX_alienHit(); }
  g.novas.push({ x: s.playerX, y: s.playerY, radius: novaRadius(f), ticks: 26, hits: caught.length }); weaponSfx('nova');
}

/** An alien died (not to a meteor): it drops a Glint chip worth about its max HP / perHp, scattered a little. */
export function dropGlint(s: GameState, e: Enemy) {
  const g = s.gambit; if (!g) return;
  const value = Math.max(1, Math.round(e.maxHp / GLINT.perHp * (1 + GLINT.perWave * (g.wave - 1)))); // its actual max HP and the wave, so later waves pay more
  const a = Math.random() * Math.PI * 2, r = Math.random() * GLINT.scatter;
  g.drops.push({ x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r, value, ticks: GLINT.life, speed: 0 });
}

/** The oxygen bill: pay what you can from your Glint; the rest becomes debt. */
export function chargeOxygen(s: GameState) {
  const g = s.gambit; if (!g) return;
  const bill = oxygenBill(s), pay = Math.min(g.glint, bill);
  g.glint -= pay; g.debt += bill - pay; g.bills++; g.billFlash = 120;
  weaponSfx(pay < bill ? 'slingImpact' : 'glint');
}

/** The current wave ends: the end of every third wave brings the oxygen bill, then the next wave starts. */
export function endWave(s: GameState) {
  const g = s.gambit; if (!g) return;
  if (g.wave % OXYGEN.every === 0) chargeOxygen(s);
  g.wave++; g.waveTicks = GAMBIT_WAVE_TICKS;
}
/** God panel: Wave +1 ends the current wave (charging a due bill); Wave −1 steps back a wave (not below 1), restarting its
 * timer without refunding anything. */
export function godShiftWave(s: GameState, delta: 1 | -1) {
  const g = s.gambit; if (!g) return;
  if (delta > 0) endWave(s);
  else { g.wave = Math.max(1, g.wave - 1); g.waveTicks = GAMBIT_WAVE_TICKS; }
}
