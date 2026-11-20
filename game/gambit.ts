import { TILE_SIZE, isBossType } from './constants';
import { ATTACK_SFX_VOLUME, damageEnemy, isFloorTile, killEnemy, playSFX_alienHit, useBullet, useLaser, type Enemy, type GameState } from './engine';
import { gameAudio } from './audio-settings';

// Weapon sounds on the attack channel. Each gain sets the clip's loudest 50ms near the player's own attacks (the Laser
// lands about -19 dB before the attack volume, bullets about -22 dB); frequent sounds sit lower. See AUDIO.md.
const WEAPON_SFX = {
  orbitalCall: { file: 'falling-thing.wav', gain: .166, pitch: 1.4 },   // the strike is called down (-22 dB)
  orbitalBlast: { file: 'bombExplode.wav', gain: .35, pitch: .95 },     // it lands (-18 dB, a heavy hit)
  blade: { file: 'slash.mp3', gain: .87, pitch: 1.1 },                  // -20 dB
  dashCharge: { file: 'charging.wav', gain: .39, pitch: 1.2 },          // starts charging (-24 dB)
  dash: { file: 'speedBoost.mp3', gain: .37, pitch: 1.2 },              // -20 dB
  spark: { file: 'jupiter-fence-hit.mp3', gain: .38, pitch: 1.25 },     // -20 dB
  disc: { file: 'venus-sand-sweep.wav', gain: .27, pitch: 1.6 },        // a quick whoosh (-22 dB)
  sentry: { file: 'place_bomb.wav', gain: .155, pitch: 1.2 },           // placed (-22 dB)
  sentryShot: { file: 'laserBullet.mp3', gain: .2, pitch: 1.5 },        // every shot (-26 dB)
  well: { file: 'reverse.mp3', gain: .245, pitch: 1 },                  // a reversed rush that pulls in (-20 dB)
  lance: { file: 'laserBeam.mp3', gain: .305, pitch: .8 },              // the Laser's level, pitched down for Ruby (-19 dB)
} as const;
function weaponSfx(cue: keyof typeof WEAPON_SFX) {
  try {
    const { file, gain, pitch } = WEAPON_SFX[cue], a = gameAudio('/sounds/' + file, 'attack');
    a.volume = gain * ATTACK_SFX_VOLUME; if (pitch !== 1) { a.playbackRate = pitch; a.preservesPitch = false; } a.play().catch(() => {});
  } catch { }
}

// Star Gambit weapons: three slots (left, right and middle click). Pulse Wave stays on holding left click in every run,
// so the left slot only takes tap weapons; hold weapons (Blaster auto-fire, a charged Comet Dash) go in right or middle.
export type WeaponId = 'laser' | 'blaster' | 'orbital' | 'blade' | 'dash' | 'spark' | 'disc' | 'sentry' | 'well' | 'lance';
export const WEAPON_IDS: WeaponId[] = ['laser', 'blaster', 'orbital', 'blade', 'dash', 'spark', 'disc', 'sentry', 'well', 'lance'];
export const WEAPONS: Record<WeaponId, { name: string; desc: string; color: string; hold?: boolean }> = {
  laser: { name: 'LASER', desc: 'Fires a beam in all four directions.', color: '#22cfff' },
  blaster: { name: 'BLASTER', desc: 'Hold to fire bullets at the nearest enemy.', color: '#44ddff', hold: true },
  orbital: { name: 'ORBITAL STRIKE', desc: 'Strikes the spot under your cursor after a short delay.', color: '#ffb84d' },
  blade: { name: 'ARC BLADE', desc: 'Slashes enemies right in front of you.', color: '#ff7a9a' },
  dash: { name: 'COMET DASH', desc: 'Hold to charge, then dash toward your cursor through enemies.', color: '#8fd8ff', hold: true },
  spark: { name: 'CHAIN SPARK', desc: 'Lightning that jumps between nearby enemies.', color: '#fff27a' },
  disc: { name: 'BOOMERANG DISC', desc: 'Thrown toward your cursor; hits going out and coming back.', color: '#9dff8a' },
  sentry: { name: 'SENTRY', desc: 'Places a turret that shoots nearby enemies for a while.', color: '#c9a8ff' },
  well: { name: 'GRAVITY WELL', desc: 'A field at your cursor that drags enemies together.', color: '#b07aff' },
  lance: { name: 'RUBY LANCE', desc: 'Ruby fires a beam in all four directions.', color: '#ff6f9f' },
};
export const SLOT_NAMES = ['LEFT CLICK', 'RIGHT CLICK', 'MIDDLE CLICK'] as const;
/** Which weapons a slot can hold: the left slot only takes tap weapons. */
export function slotAllows(slot: number, id: WeaponId) { return slot !== 0 || !WEAPONS[id].hold; }

export const GAMBIT = {
  orbital: { delay: 50, damage: 14, radius: 1, cooldown: 150 },             // a 3×3 strike
  blade: { reach: 1.8, damage: 9, push: 1, cooldown: 28 },
  dash: { minTiles: 3, maxTiles: 7, charge: 45, damage: 12, cooldown: 110 },
  spark: { range: 6, jump: 3.5, chain: 4, damage: 6, cooldown: 40 },
  disc: { range: 6, speed: 9, damage: 7, cooldown: 70 },
  sentry: { max: 2, life: 600, fireEvery: 30, range: 6, damage: 3, cooldown: 200 },
  well: { radius: 3, life: 180, pulse: 20, damage: 1, cooldown: 300 },
  lance: { range: 8, damage: 7, cooldown: 55 },
} as const;

export interface GambitState {
  slots: [WeaponId, WeaponId, WeaponId];
  glint: number;                             // the run's currency (nothing earns or spends it yet)
  wave: number; waveTicks: number;           // the current wave and the ticks left in it
  cd: [number, number, number];
  charge: [number, number, number];          // hold-charge ticks per slot (Comet Dash)
  aimX: number; aimY: number;                // the mouse, as an offset from you in pixels
  cursorX: number; cursorY: number;          // world pixels (you + aim), refreshed every tick
  strikes: { x: number; y: number; ticks: number; blast: number }[];
  arcs: { x: number; y: number; dx: number; dy: number; ticks: number }[];
  dash: { hit: number[]; ticks: number; fromX: number; fromY: number } | null; // fromX/Y: where the dash started, for its streak
  sparks: { pts: [number, number][]; ticks: number }[];
  discs: { x: number; y: number; dx: number; dy: number; out: number; back: boolean; hitOut: number[]; hitBack: number[] }[];
  sentries: { x: number; y: number; ticks: number; fire: number; shot: { x: number; y: number; ticks: number } | null }[];
  wells: { x: number; y: number; ticks: number; pulse: number }[];
  lances: { x: number; y: number; ends: [number, number][]; ticks: number }[];
}

/** How long each wave lasts (45 s). Nothing spawns yet; the clock only advances the wave number. */
export const GAMBIT_WAVE_TICKS = 2700;

export function createGambitState(s: GameState) {
  s.gambit = { slots: ['laser', 'blaster', 'orbital'], glint: 0, wave: 1, waveTicks: GAMBIT_WAVE_TICKS, cd: [0, 0, 0], charge: [0, 0, 0], aimX: 0, aimY: 0, cursorX: s.playerX, cursorY: s.playerY,
    strikes: [], arcs: [], dash: null, sparks: [], discs: [], sentries: [], wells: [], lances: [] };
}

/** God / loadout screen: put a weapon in a slot (refused when the slot cannot hold it). */
export function setWeapon(s: GameState, slot: 0 | 1 | 2, id: WeaponId) {
  const g = s.gambit; if (!g || !slotAllows(slot, id)) return;
  g.slots[slot] = id; g.cd[slot] = 0; g.charge[slot] = 0;
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
function cursorDir(s: GameState) {
  const g = s.gambit!, dx = g.cursorX - s.playerX, dy = g.cursorY - s.playerY, len = Math.hypot(dx, dy);
  return len > 4 ? [dx / len, dy / len] : [s.playerDirX || 1, s.playerDirY];
}

/** A slot's button went down. Tap weapons fire now; hold weapons start charging or firing. */
export function pressSlot(s: GameState, slot: 0 | 1 | 2) {
  const g = s.gambit; if (!g || s.gamePhase !== 'playing' || s.playerFrozenTicks > 0) return;
  g.cursorX = s.playerX + g.aimX; g.cursorY = s.playerY + g.aimY;
  const id = g.slots[slot];
  if (id === 'laser') { useLaser(s); return; }
  if (id === 'blaster') { useBullet(s); return; }
  if (id === 'dash') { if (g.cd[slot] <= 0) { g.charge[slot] = 1; weaponSfx('dashCharge'); } return; } // charges while held, fires on release
  if (g.cd[slot] > 0) return;
  if (fire(s, id)) { g.cd[slot] = GAMBIT[id as Exclude<WeaponId, 'laser' | 'blaster' | 'dash'>].cooldown; }
}
/** A slot's button is held this tick: Blaster keeps firing, Comet Dash keeps charging. */
export function holdSlot(s: GameState, slot: 0 | 1 | 2) {
  const g = s.gambit; if (!g || s.gamePhase !== 'playing') return;
  const id = g.slots[slot];
  if (id === 'blaster' && s.bulletCooldown <= 0) useBullet(s);
  if (id === 'dash' && g.charge[slot] > 0) g.charge[slot] = Math.min(GAMBIT.dash.charge, g.charge[slot] + 1);
}
/** A slot's button came up: a charged Comet Dash goes. */
export function releaseSlot(s: GameState, slot: 0 | 1 | 2) {
  const g = s.gambit; if (!g) return;
  if (g.slots[slot] === 'dash' && g.charge[slot] > 0) {
    const f = g.charge[slot] / GAMBIT.dash.charge; g.charge[slot] = 0;
    if (s.gamePhase === 'playing' && g.cd[slot] <= 0 && cometDash(s, f)) g.cd[slot] = GAMBIT.dash.cooldown;
  }
}

function fire(s: GameState, id: WeaponId): boolean {
  const g = s.gambit!, px = s.playerX, py = s.playerY;
  switch (id) {
    case 'orbital': {
      const tx = Math.floor(g.cursorX / TILE_SIZE), ty = Math.floor(g.cursorY / TILE_SIZE);
      if (!isFloorTile(s.map, tx, ty)) return false;
      g.strikes.push({ x: tx, y: ty, ticks: GAMBIT.orbital.delay, blast: 0 }); weaponSfx('orbitalCall'); return true;
    }
    case 'blade': {
      const [dx, dy] = cursorDir(s); let landed = false;
      for (const e of living(s)) {
        const ex = e.x - px, ey = e.y - py, d = Math.hypot(ex, ey) / TILE_SIZE;
        if (d <= GAMBIT.blade.reach && (ex * dx + ey * dy) >= -TILE_SIZE * .2) { landed = hit(s, e, GAMBIT.blade.damage) || landed; push(s, e, ex, ey, GAMBIT.blade.push); }
      }
      g.arcs.push({ x: px, y: py, dx, dy, ticks: 14 }); weaponSfx('blade'); if (landed) playSFX_alienHit(); return true;
    }
    case 'spark': {
      let from: [number, number] = [px, py]; const hitIds: number[] = [], pts: [number, number][] = [[px, py]];
      for (let k = 0; k < GAMBIT.spark.chain; k++) {
        const reach = (k ? GAMBIT.spark.jump : GAMBIT.spark.range) * TILE_SIZE;
        const next = living(s).filter(e => !hitIds.includes(e.id) && Math.hypot(e.x - from[0], e.y - from[1]) <= reach)
          .sort((a, b) => Math.hypot(a.x - from[0], a.y - from[1]) - Math.hypot(b.x - from[0], b.y - from[1]))[0];
        if (!next) break;
        hitIds.push(next.id); pts.push([next.x, next.y]); from = [next.x, next.y]; hit(s, next, GAMBIT.spark.damage);
      }
      if (pts.length < 2) return false;
      g.sparks.push({ pts, ticks: 16 }); weaponSfx('spark'); playSFX_alienHit(); return true;
    }
    case 'disc': {
      const [dx, dy] = cursorDir(s);
      g.discs.push({ x: px, y: py, dx: dx * GAMBIT.disc.speed, dy: dy * GAMBIT.disc.speed, out: 0, back: false, hitOut: [], hitBack: [] });
      weaponSfx('disc'); return true;
    }
    case 'sentry': {
      if (g.sentries.length >= GAMBIT.sentry.max) g.sentries.shift();
      g.sentries.push({ x: s.playerTileX, y: s.playerTileY, ticks: GAMBIT.sentry.life, fire: 10, shot: null }); weaponSfx('sentry'); return true;
    }
    case 'well': {
      const tx = Math.floor(g.cursorX / TILE_SIZE), ty = Math.floor(g.cursorY / TILE_SIZE);
      if (!isFloorTile(s.map, tx, ty)) return false;
      g.wells.push({ x: tx, y: ty, ticks: GAMBIT.well.life, pulse: GAMBIT.well.pulse }); weaponSfx('well'); return true;
    }
    case 'lance': {
      const [ox, oy] = s.rubyTileX !== -1 && !s.playerCarryingRuby ? [s.rubyTileX, s.rubyTileY] : [s.playerTileX, s.playerTileY];
      const ends: [number, number][] = [], tiles = new Set<number>([oy * 1000 + ox]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        let tx = ox, ty = oy;
        for (let r = 0; r < GAMBIT.lance.range && isFloorTile(s.map, tx + dx, ty + dy); r++) { tx += dx; ty += dy; tiles.add(ty * 1000 + tx); }
        ends.push([tx, ty]);
      }
      let landed = false;
      for (const e of living(s)) if (tiles.has(e.tileY * 1000 + e.tileX)) landed = hit(s, e, GAMBIT.lance.damage) || landed;
      g.lances.push({ x: ox, y: oy, ends, ticks: 16 }); weaponSfx('lance'); if (landed) playSFX_alienHit(); return true;
    }
  }
  return false;
}

/** Comet Dash: a dash toward the cursor (along its main axis), 3–7 tiles with charge, hitting everything it passes. */
function cometDash(s: GameState, charge: number) {
  const g = s.gambit!, [dx, dy] = cursorDir(s), horizontal = Math.abs(dx) >= Math.abs(dy);
  const kx = horizontal ? Math.sign(dx) : 0, ky = horizontal ? 0 : Math.sign(dy);
  if (!isFloorTile(s.map, s.playerTargetX + kx, s.playerTargetY + ky)) return false;
  const tiles = Math.round(GAMBIT.dash.minTiles + (GAMBIT.dash.maxTiles - GAMBIT.dash.minTiles) * charge);
  s.playerKnockback = { dirX: kx, dirY: ky, started: false, tilesLeft: tiles, shaken: true };
  g.dash = { hit: [], ticks: 40, fromX: s.playerX, fromY: s.playerY };
  weaponSfx('dash'); return true;
}

/** Once per playing tick: cooldowns, delayed strikes, flying discs, sentries, wells and fading effects. */
export function updateGambit(s: GameState) {
  const g = s.gambit; if (!g || s.gamePhase !== 'playing') return;
  g.cursorX = s.playerX + g.aimX; g.cursorY = s.playerY + g.aimY;
  for (let k = 0; k < 3; k++) if (g.cd[k] > 0) g.cd[k]--;
  if (--g.waveTicks <= 0) { g.wave++; g.waveTicks = GAMBIT_WAVE_TICKS; }
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
  for (const d of g.discs) {
    if (!d.back) { d.x += d.dx; d.y += d.dy; d.out += Math.hypot(d.dx, d.dy); if (d.out >= GAMBIT.disc.range * TILE_SIZE || !isFloorTile(s.map, Math.floor(d.x / TILE_SIZE), Math.floor(d.y / TILE_SIZE))) d.back = true; }
    else { const dx = s.playerX - d.x, dy = s.playerY - d.y, len = Math.hypot(dx, dy) || 1; d.x += dx / len * GAMBIT.disc.speed; d.y += dy / len * GAMBIT.disc.speed; if (len < GAMBIT.disc.speed) d.out = -1; }
    const list = d.back ? d.hitBack : d.hitOut;
    for (const e of living(s)) if (!list.includes(e.id) && Math.hypot(e.x - d.x, e.y - d.y) <= TILE_SIZE * .7) { list.push(e.id); if (hit(s, e, GAMBIT.disc.damage)) playSFX_alienHit(); }
  }
  g.discs = g.discs.filter(d => d.out >= 0);
  for (const t of g.sentries) {
    t.ticks--; if (t.shot && --t.shot.ticks <= 0) t.shot = null;
    if (--t.fire > 0) continue;
    t.fire = GAMBIT.sentry.fireEvery;
    const cx = (t.x + .5) * TILE_SIZE, cy = (t.y + .5) * TILE_SIZE;
    const target = living(s).filter(e => Math.hypot(e.x - cx, e.y - cy) <= GAMBIT.sentry.range * TILE_SIZE).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy))[0];
    if (target) { t.shot = { x: target.x, y: target.y, ticks: 8 }; weaponSfx('sentryShot'); hit(s, target, GAMBIT.sentry.damage); }
  }
  g.sentries = g.sentries.filter(t => t.ticks > 0);
  for (const w of g.wells) {
    w.ticks--;
    if (--w.pulse > 0) continue;
    w.pulse = GAMBIT.well.pulse;
    for (const e of living(s)) {
      const dx = w.x - e.tileX, dy = w.y - e.tileY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) > GAMBIT.well.radius) continue;
      hit(s, e, GAMBIT.well.damage); if (dx || dy) push(s, e, dx, dy, 1);
    }
  }
  g.wells = g.wells.filter(w => w.ticks > 0);
  g.arcs = g.arcs.filter(a => --a.ticks > 0);
  g.sparks = g.sparks.filter(p => --p.ticks > 0);
  g.lances = g.lances.filter(l => --l.ticks > 0);
}
