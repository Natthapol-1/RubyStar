import { AEGIS_DAMAGE_MULT, CHAMBER_BOUNDS, ENEMY_CONFIGS, TILE_SIZE, chamberOfTile } from './constants';
import { godPhaseClock, stunPlayer, createEncounterEnemy, damageEnemy, damagePlayer, encounterEffect, healCore, healPlayer, freeChamberTiles, godSpawnBoss, isFloorTile, killEnemy, playAudioOneShot, playSFX_meteorWarning, shovePlayerFromEnemy, type Enemy, type GameState } from './engine';
import { playUiSfx } from './ui-sfx';

// Venus challenge: the Aegis Sentinel is shielded by a sequence of numbered totems. They appear one at a time, show
// their number for a moment, then the sand buries them and they vanish from the map. Sand Swirl (C) clears the sand
// around you and exposes buried totems for a while. Destroy them strictly in order: hitting the wrong one makes it
// explode and move, and a totem left too long does the same. When every totem of the sequence is gone the shield
// breaks and he can be hurt for a while. He leaps onto you from anywhere and charges a lance; a Sand Swirl timed just
// before either lands parries it back at him.

export const VENUS = {
  phaseHP: 1000, finalPhaseHP: 1100, // three phases, one HP pool: 1000 / 1000 / 1100 (3100 in all)
  veilDamage: .15,                   // here Venus Veil cuts 85% of the damage you and Ruby take (65% elsewhere)
  reflectMult: .85,                  // every Venus reflection (guard, Veil, reflected blast) deals 85% of the damage
  reflectBaseHP: 400,                // reflections onto him scale by phaseHP / 400, so each stays the same share of his HP as at 400
  totemsPerRoom: 2, totemSpacing: 7, // totems spread out: at most 2 in one chamber, at least 7 tiles apart (relaxed only if nothing fits)
  totems: [4, 5, 5],                 // totems in each phase's sequence (phase 3 adds his hidden core instead)
  meteorShare: .1,                   // a meteor hits him for 10% of a phase (100), shield or not
  clueTicks: 240,                    // a clue arrow toward the core shows for 4s where a totem broke
  coreHP: 1, coreTicks: 900,         // phase 3: his buried core (1 HP: any hit breaks it); once the totems are gone you have 15s to destroy it or the shield recovers
  totemHP: 60,
  recoverySpawnDelay: 150,           // ticks before the first totem after the shield returns (2.5s)
  spawnGap: 120,                     // ticks between the sequence's totems appearing
  revealTicks: 180,                  // a totem shows itself for 3s when it appears or moves
  lifeTicks: [1800, 1560, 1320],     // a totem not destroyed in time explodes and moves
  firstLifeBonus: 60,               // one extra second before a newly spawned totem's first overload
  sandTicks: 24,                     // a totem takes 0.4s to rise out of the sand, and 0.4s to sink back in
  totemHeal: 16,                      // breaking a totem in order heals you and Ruby 16
  totemBossShare: .01,               // and hits him for 1% of a phase, shield or not
  missHeal: .04,                     // a totem that blows and moves (overload or broken out of order) heals him 4% of a phase
  blastDamage: 60,                   // a totem blast hits everyone in its chamber for 60 (endless keeps TOTEM_OVERLOAD_DAMAGE)
  overloadTicks: 90,                 // a totem about to blow shows itself, glowing amber, for 1.5s; then, as in endless, it hits
                                     // everyone in its chamber for blastDamage and moves
  sweepRadius: 3, sweepExpose: 300, sweepCooldown: 75, // C: clear sand in a 7×7 blocky octagon (3-tile edges), exposing totems for 5s; 1.25s cooldown
  exposeTicks: 720, shieldHeal: 30, breakShare: .19, finalBreakShare: .09, shatterTicks: 100, // breaking the shield also deals him 19% of a phase (190), 9% in the final phase (99); never past his phase
    // shield down for 12s once the whole sequence is destroyed; breaking it heals you and Ruby 30
  // leapSlow/leapSlowSpeed: after landing he moves at most leapSlowSpeed for leapSlow ticks
  leapSlow: 90, leapSlowSpeed: 1.8, leapParryReach: 1, // leapParryReach: tiles beyond the landing reach where you can still parry it
  leapGap: 840, leapAim: 110, leapLock: 78, leapDamage: 18, leapRadius: 1.6, leapShove: 2,
  lanceGap: 480, lanceWindup: 54, lanceLock: 14, lanceRange: 9, lanceHalfWidth: .55, lanceDamage: 16,
  attackSoften: .8, // his leap and lance hit you for 80% of leapDamage / lanceDamage, but reflect at the full amount
  meleeDamage: 7, // his ordinary melee hits you for 7 here (12 in endless)
  shieldedSpeed: 2.6, // he moves at 2.6 while shielded (4 in endless)
  exposedSpeedMult: .87, // and at 87% of the endless exposed speed (about 1.04) while his shield is broken
  shieldedPace: .7,                  // while shielded he leaps and lances 30% more often
  brokenLanceGap: 108,               // while his shield is broken he lances every 1.8s (plus the charge), in every phase
  // parryWindow: C pressed within 20 ticks before a hit parries it; a parried leap stuns him longer (leapParryStun)
  parryWindow: 20, parryDamage: .06, parryStun: 120, leapParryStun: 210,
  nestRange: 3, nestScarabs: 1,      // nests lie at random within 3 tiles of a totem (a hint one is near); each releases one Sand Scarab
  nestsPerTarget: 2, // never more than 2 nests per totem left (or the core), so fewer totems mean fewer scarabs
  nestGap: 180, nestCap: [8, 10, 10], // every totem starts with one; another is buried near a random totem every 3s, up to 8 / 10 / 10 by phase
  wormChance: .35, wormMax: 5, wormFromPhase: 2, // from phase 2, this share of regular spawns are Dune Worms, at most 5 alive
  scorpKnockSpeed: 2.5, // its knockback flings you this many times faster than a normal shove
  scorpRespawn: 2100, // phase 3: with fewer than the full set alive, a new one is buried somewhere every 35 seconds
  scorpions: 5, scorpRise: 14, scorpUp: 180, scorpRest: 60, scorpKnockback: 6, // phase 3: 5 Sand Scorpions buried on fixed tiles; they burst up in 0.23s, stay up 3s, rest 1s; their sting knocks you back 6
  // burrowStun: a Dune Worm bite stuns you for 0.5s once its knockback ends
  burrowRise: 12, burrowUp: 60, burrowSink: 24, burrowRest: 60, burrowDazed: 180, burrowKnockback: 2, burrowStun: 30, trailTicks: 150,
  relicCap: 9, relicPerKind: 3, relicStart: 5, relicGap: 720, // up to 9 relics at a time (at most 3 of each kind), one more every 12s; nothing hints where they are
  urnHeal: 20, sunVeilCut: .5, seerTicks: 120, // Healing Urn heals you and Ruby 20; Sun Disk halves Venus Veil's remaining cooldown; Seer's Eye shows where the totems lie (not their order) for 2s
  counterHeal: 25, // any successful counter (a parry, or a totem blast caught by the guard) heals you 25
  counterBlastRadius: 3.5, counterBlastDamage: 25, // and its shockwave hits every other enemy within 3.5 tiles of you for 25
  guardTicks: 45, guardDamage: .05, guardReflect: 1, // C also raises a 0.75s guard: direct hits on you do 5% and reflect their full damage to the attacker
} as const;

/** Phase HP bands: phases 1–2 are phaseHP each, the final phase finalPhaseHP (it sits at the bottom of the pool). */
export const venusBand = (phase: number) => phase >= 3 ? VENUS.finalPhaseHP : VENUS.phaseHP;
export const venusFloor = (phase: number) => phase >= 3 ? 0 : phase === 2 ? VENUS.finalPhaseHP : VENUS.finalPhaseHP + VENUS.phaseHP;
export const venusTotalHP = () => VENUS.phaseHP * 2 + VENUS.finalPhaseHP;
export const venusPhaseOf = (hp: number): 1 | 2 | 3 => hp > venusFloor(1) ? 1 : hp > venusFloor(2) ? 2 : 3;
export interface VenusTotem { enemy: Enemy; order: number; life: number; visible: number; buried: boolean; overload: number; rise?: number; intro?: boolean }
interface VenusNest { tx: number; ty: number; totemId?: number }
/** A successful counter resets the Sand Swirl cooldown, and its shockwave hits every enemy within counterBlastRadius of you, visible totems included (not the boss, relics or
 * his core; buried units are untouchable as usual). */
function counterBlast(s: GameState, skip?: Enemy) {
  playAudioOneShot('/sounds/shield.mp3', .9); playAudioOneShot('/sounds/ice.mp3', .55);
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 24); s.screenShakeAmt = Math.max(s.screenShakeAmt, 10);
  if (s.venus && s.venus.sweepCooldown > 1) s.venus.sweepCooldown = 1; // a successful counter readies Sand Swirl again (its ready chime plays next tick)
  const r = VENUS.counterBlastRadius * TILE_SIZE;
  for (const e of [...s.enemies]) {
    if (e === skip || e.hp <= 0 || e.id === s.venus?.bossId || e.type === 'sand_relic' || e.type === 'sand_core') continue;
    if (Math.hypot(e.x - s.playerX, e.y - s.playerY) > r) continue;
    damageEnemy(s, e, VENUS.counterBlastDamage, 'reflection');
    if (e.hp <= 0 && s.enemies.includes(e)) killEnemy(s, s.enemies.indexOf(e));
    if (s.gamePhase !== 'playing') return;
  }
}
/** A relic buried in the sand: uncovered by Sand Swirl, broken with one hit for its effect. */
export type RelicKind = 'urn' | 'sun' | 'eye';
export interface VenusRelic { enemy: Enemy; kind: RelicKind; visible: number; buried: boolean; rise?: number }
/** Phase 3: his core, buried somewhere. A Sand Swirl uncovers it for a while, like a totem; found: uncovered at least once. */
export interface VenusCore {
  enemy: Enemy; visible: number; buried: boolean; rise?: number; found: boolean;
  clues?: { tileX: number; tileY: number; ticks: number }[]; // arrows toward the core where totems broke; each fades after clueTicks
}
export interface VenusState {
  phase: 1 | 2 | 3; bossId: number;
  totems: VenusTotem[];              // spawned, not yet destroyed
  total: number; next: number;       // totems in this sequence; the order number to destroy next (0-based)
  spawned: number; spawnTimer: number;
  exposed: number;                   // ticks the shield stays down
  core: VenusCore | null; coreWindow: number; // phase 3: the hidden core; ticks left to destroy it once the totems are gone
  coreHintOff?: [number, number]; // where the core sits inside the final 9×9 minimap hint (tiles from its top-left)
  sweepCooldown: number; parryUntil: number; guardUntil: number;
  wormStun?: boolean; // a Dune Worm bite: stun the player once its knockback ends
  leapSlow?: number; // ticks left of his slow walk after a leap
  reflectAs?: number; // the next hit on you reflects as this much (his softened leap and lance reflect at full strength)
  scorpTimer?: number; // phase 3: ticks until a missing Sand Scorpion is buried again
  godReveal?: boolean;               // god panel: show buried totems on the minimap
  nests: VenusNest[]; nestTimer?: number; nestClock?: number; nestBursts: { x: number; y: number; ticks: number }[]; // nestTimer exists in older saves; nestClock: ticks to the next extra nest
  trails: { x: number; y: number; ticks: number; id: number }[]; // the sand a Dune Worm pushes up as it tunnels // buried Sand Scarab nests (nothing spawns until one is uncovered)
  relics: VenusRelic[]; relicTimer: number; seer: number; // buried relics; ticks to the next; Seer's Eye reveal ticks left
  finds: { x: number; y: number; ticks: number; kind: RelicKind }[]; // relic pickup effects
  leap: { stage: 'aim' | 'lock'; ticks: number; tx: number; ty: number } | null; leapTimer: number; leapTotal: number; // leapTotal: the full wait, for the HUD countdown
  lance: { ticks: number; dx: number; dy: number } | null; lanceTimer: number;
  stun: number;
  sweeps: { x: number; y: number; ticks: number }[];
  blasts: { x: number; y: number; ticks: number; kind?: 'totemBreak' | 'overload' }[];
  beams: { x: number; y: number; dx: number; dy: number; ticks: number; parried?: boolean }[];
  impacts: { x: number; y: number; ticks: number }[];
  parries: { x: number; y: number; ticks: number }[];
  shatter: { x: number; y: number; ticks: number } | null; // the shield shattering (drawn over the view)
  reflects: { fromX: number; fromY: number; toX: number; toY: number; ticks: number }[]; // Sand Swirl guard reflections
}

const S = TILE_SIZE;
const idx = (t: VenusState) => t.phase - 1;
// Time until his next leap or lance: shorter while his shield is up.
const attackGap = (s: GameState, gap: number) => Math.round(gap * (venusBoss(s)?.aegis?.shielded ? VENUS.shieldedPace : 1));
const lanceGap = (s: GameState) => s.venus!.exposed > 0 ? VENUS.brokenLanceGap : attackGap(s, VENUS.lanceGap);
export function createVenusState(s: GameState) {
  s.venus = { phase: 1, bossId: -1, totems: [], total: VENUS.totems[0], next: 0, spawned: 0, spawnTimer: 0, exposed: 0, sweepCooldown: 0, parryUntil: -1, guardUntil: -1,
    leap: null, leapTimer: VENUS.leapGap, leapTotal: VENUS.leapGap, lance: null, lanceTimer: VENUS.lanceGap, stun: 0, sweeps: [], blasts: [], beams: [], impacts: [], parries: [], reflects: [], relics: [], relicTimer: 60, seer: 0, finds: [], nests: [], nestBursts: [], trails: [], shatter: null, core: null, coreWindow: 0 };
}
export const venusBoss = (s: GameState) => s.enemies.find(e => e.id === s.venus?.bossId && e.hp > 0);
export function initializeVenusBoss(s: GameState, boss: Enemy) {
  const t = s.venus!;
  t.bossId = boss.id; t.phase = 1; boss.hp = boss.maxHp = venusTotalHP(); boss.pushTiles = 0;
  boss.aegis = { shielded: true, exposedUntilTick: 0, constructsLeft: 0, openAmount: 0, reflectTicks: 0, brokenOnce: false, reshieldTicks: 0 };
  startSequence(s);
}
/** The boss is airborne (mid leap): untargetable and not drawn. */
export const venusAirborne = (s: GameState, e: Enemy) => !!s.venus?.leap && e.id === s.venus.bossId;
/** The boss is busy with the challenge (leaping, charging the lance or stunned): its ordinary AI waits. */
export const venusHoldsBoss = (s: GameState, e: Enemy) => !!s.venus && e.id === s.venus.bossId && (!!s.venus.leap || !!s.venus.lance || s.venus.stun > 0);

// ─── Totems ──────────────────────────────────────────────────────────────────

function startSequence(s: GameState, firstSpawnDelay = 30) {
  const t = s.venus!;
  for (const p of t.totems) bury(s, p);
  t.nests = [];
  t.totems = []; t.total = VENUS.totems[idx(t)]; t.next = 0; t.spawned = 0; t.spawnTimer = firstSpawnDelay; t.exposed = 0;
  const boss = venusBoss(s); if (boss?.aegis) { boss.aegis.shielded = true; boss.aegis.constructsLeft = t.total; }
  removeCore(s); if (t.phase === 3) buryCore(s, t); // phase 3: a fresh core hides in the sand with every sequence
}

// ─── Phase 3: the hidden core ────────────────────────────────────────────────

function removeCore(s: GameState) { const t = s.venus!; if (t.core) { s.enemies = s.enemies.filter(e => e !== t.core!.enemy); t.nests = t.nests.filter(n => n.totemId !== t.core!.enemy.id); } t.core = null; t.coreWindow = 0; }
function buryCore(s: GameState, t: VenusState) {
  const spot = buriedSpot(s, t); if (!spot) return;
  t.core = { enemy: createEncounterEnemy(s, 'sand_core', spot[0], spot[1], VENUS.coreHP), visible: 0, buried: true, found: false }; t.core.enemy.coreSealed = true;
  placeTotemNest(s, t.core as never); // scarab nests gather near the core too
}
/** Phase 3 hint: with one totem (or none) left, the minimap shows which chamber his core is in. */
export const venusCoreHint = (s: Readonly<GameState>) => !!s.venus?.core && s.venus.total - s.venus.next <= 1;
/** The core window's minimap hint, as [row1, col1, row2, col2] in tiles: the core's whole chamber at first, shrinking
 * steadily to a 9×9 square holding the core (at a random spot in it) as the window runs out. Null before the window. */
export function venusCoreHintRect(s: Readonly<GameState>): [number, number, number, number] | null {
  const t = s.venus; if (!t?.core || t.coreWindow <= 0) return null;
  const room = chamberOfTile(t.core.enemy.tileX, t.core.enemy.tileY); if (room < 0) return null;
  const [r1, c1, r2, c2] = CHAMBER_BOUNDS[room], [ox, oy] = t.coreHintOff ?? [0, 0];
  const left = Math.min(c2 - 8, Math.max(c1, t.core.enemy.tileX - ox)), top = Math.min(r2 - 8, Math.max(r1, t.core.enemy.tileY - oy)); // the final 9×9, kept in the chamber
  const p = 1 - t.coreWindow / VENUS.coreTicks, lerp = (a: number, b: number) => a + (b - a) * p;
  return [lerp(r1, top), lerp(c1, left), lerp(r2, top + 8), lerp(c2, left + 8)];
}
/** The core is sealed while any totem of the sequence is left. */
export const venusCoreSealed = (s: Readonly<GameState>) => !!s.venus && s.venus.next < s.venus.total;
/** Called from damageEnemy for the core: a hit while it is sealed does nothing. Returns true if it is sealed. */
export function venusCoreHit(s: GameState, e: Enemy): boolean {
  if (!venusCoreSealed(s)) return false;
  if ((e.flashTicks ?? 0) <= 0) { playUiSfx('locked'); e.flashTicks = 12; }
  return true;
}
/** Called from killEnemy: the core is destroyed and the shield breaks. */
export function venusCoreDestroyed(s: GameState, e: Enemy) {
  const t = s.venus!; s.enemies = s.enemies.filter(q => q !== e);
  t.nests = t.nests.filter(n => n.totemId !== e.id); // its nests go with it
  t.core = null; t.coreWindow = 0; t.blasts.push({ x: e.x, y: e.y, ticks: 30 });
  const boss = venusBoss(s); if (boss?.aegis?.shielded) breakShield(s, t, boss);
}
function updateCore(s: GameState) {
  const t = s.venus!, c = t.core; if (!c) return;
  if (c.clues) c.clues = c.clues.filter(k => --k.ticks > 0);
  c.enemy.coreSealed = venusCoreSealed(s);
  if ((c.rise ?? 0) > 0) c.rise!--;
  if (c.visible > 0 && --c.visible <= 0) { c.buried = true; s.enemies = s.enemies.filter(e => e !== c.enemy); }
  if (t.coreWindow > 0 && --t.coreWindow === 0) { // too slow: the shield recovers with a fresh sequence and core
    playAudioOneShot('/sounds/aegis-shield-break.wav', .7, .6); playUiSfx('locked');
    startSequence(s, VENUS.recoverySpawnDelay);
  }
}
function bury(s: GameState, p: VenusTotem) { p.buried = true; p.visible = 0; p.intro = false; s.enemies = s.enemies.filter(e => e !== p.enemy); }
function show(s: GameState, p: { enemy: Enemy; visible: number; buried: boolean; rise?: number }, ticks: number) {
  p.visible = Math.max(p.visible, ticks);
  if (p.buried) { p.buried = false; p.rise = VENUS.sandTicks; if (!s.enemies.includes(p.enemy)) s.enemies.push(p.enemy); }
}
/** How far a totem is down in the sand (0 standing – 1 fully under), as it rises out or sinks back in. Drawing only. */
export function venusTotemSink(s: Readonly<GameState>, e: Enemy) {
  const p: { visible: number; buried: boolean; rise?: number; overload?: number } | undefined = s.venus?.totems.find(q => q.enemy === e) ?? s.venus?.relics.find(q => q.enemy === e) ?? (s.venus?.core?.enemy === e ? s.venus.core : undefined); // totems, relics and the core alike
  if (!p || p.buried) return 0;
  const rising = (p.rise ?? 0) / VENUS.sandTicks, sinking = (p.overload ?? 0) <= 0 && p.visible < VENUS.sandTicks ? 1 - p.visible / VENUS.sandTicks : 0;
  return Math.max(0, Math.min(1, Math.max(rising, sinking)));
}
// A random open tile anywhere, away from you and the other totems.
// Totems spread out: at most totemsPerRoom in one chamber and totemSpacing tiles apart, relaxed only if nothing fits.
function totemSpot(s: GameState, except?: VenusTotem): [number, number] | null {
  const t = s.venus!, others = t.totems.filter(p => p !== except);
  const needsNest = !except || t.nests.some(n => n.totemId === except.enemy.id);
  const all = [0, 1, 2, 3].flatMap(r => freeChamberTiles(s, r).map(([x, y]) => [x, y, r] as const)).filter(([x, y]) =>
    Math.hypot(x - s.playerTileX, y - s.playerTileY) >= 4 &&
    !(except && x === except.enemy.tileX && y === except.enemy.tileY) &&
    !t.nests.some(n => n.tx === x && n.ty === y));
  const inRoom = (r: number) => others.filter(p => chamberOfTile(p.enemy.tileX, p.enemy.tileY) === r).length;
  for (const [cap, gap] of [[VENUS.totemsPerRoom, VENUS.totemSpacing], [VENUS.totemsPerRoom, 3], [99, 3], [99, 0]] as const) {
    const tiles = all.filter(([x, y, r]) => inRoom(r) < cap && !others.some(p => Math.hypot(x - p.enemy.tileX, y - p.enemy.tileY) < gap));
    if (!tiles.length) continue;
    const start = Math.floor(Math.random() * tiles.length);
    for (let i = 0; i < tiles.length; i++) {
      const [x, y] = tiles[(start + i) % tiles.length];
      if (!needsNest || scarabTiles(s, x, y, except?.enemy.id).length >= VENUS.nestScarabs) return [x, y];
    }
  }
  return null;
}
function place(s: GameState, p: VenusTotem, x: number, y: number) {
  Object.assign(p.enemy, { tileX: x, tileY: y, targetTileX: x, targetTileY: y, x: (x + .5) * S, y: (y + .5) * S, stepProgress: 0, path: [], visualSpawnTicks: 30 });
  p.life = VENUS.lifeTicks[idx(s.venus!)];
  playAudioOneShot('/sounds/saturn-warning.mp3', .9);
  show(s, p, VENUS.revealTicks); p.rise = VENUS.sandTicks; // it rises out of the sand at its new spot // it shows itself and its number before the sand takes it
}
function spawnTotem(s: GameState) {
  const t = s.venus!, spot = totemSpot(s); if (!spot) return;
  const enemy = createEncounterEnemy(s, 'aegis_construct', spot[0], spot[1], VENUS.totemHP);
  enemy.venusOrder = t.spawned;
  const p: VenusTotem = { enemy, order: t.spawned, life: 0, visible: 0, buried: true, overload: 0 };
  t.totems.push(p); t.spawned++;
  place(s, p, spot[0], spot[1]);
  placeTotemNest(s, p);
  p.life += VENUS.firstLifeBonus;
  p.intro = true;
}
/** A totem starts to overload (wrong order or out of time): it shows itself, glowing amber, until it blows. */
function overload(s: GameState, p: VenusTotem) {
  if (p.overload > 0) return;
  p.intro = false;
  p.overload = VENUS.overloadTicks; p.enemy.totem = { ageTicks: 0, overloadTicks: p.overload };
  show(s, p, p.overload + 2);
  playSFX_meteorWarning(true);
}
/** A totem blast reflected by the Sand Swirl guard or Venus Veil: its full damage hits every enemy in that chamber (he
 * takes it through his shield as usual). It is reflection damage, so it never bounces back to you. Totems, relics and
 * his core are spared. */
function reflectBlast(s: GameState, room: number) {
  const t = s.venus!;
  for (const e of [...s.enemies]) {
    if (e.hp <= 0 || e.venusOrder !== undefined || e.type === 'sand_relic' || e.type === 'sand_core' || chamberOfTile(e.tileX, e.tileY) !== room) continue;
    damageEnemy(s, e, VENUS.blastDamage * venusReflectScale(s, e), 'reflection');
    t.reflects.push({ fromX: s.playerX, fromY: s.playerY, toX: e.x, toY: e.y, ticks: 18 });
  }
}
/** Wrong-order blasts keep the original overload schedule; timed blasts begin the next cycle. */
function explode(s: GameState, p: VenusTotem, preserveSchedule = false) {
  const life = p.life, warning = p.overload;
  const t = s.venus!, x = p.enemy.x, y = p.enemy.y, room = chamberOfTile(p.enemy.tileX, p.enemy.tileY);
  p.overload = 0; p.enemy.totem = undefined; p.intro = false;
  t.blasts.push({ x, y, ticks: 30, kind: 'overload' });
  encounterEffect(s, 'totem-overload', p.enemy, x, y, 36, '#ffce8a');
  if (room >= 0 && chamberOfTile(s.playerTileX, s.playerTileY) === room) {
    // The Sand Swirl guard counters the blast too: it blocks all of it and heals you.
    const guarded = s.gameTick <= t.guardUntil, veiled = s.venusVeilTicks > 0;
    if (guarded) { healPlayer(s, VENUS.counterHeal); t.parries.push({ x: s.playerX, y: s.playerY, ticks: 36 }); counterBlast(s); }
    else damagePlayer(s, VENUS.blastDamage);
    if (guarded || veiled) reflectBlast(s, room); // Sand Swirl or Venus Veil turns the blast on every enemy in the chamber
    s.screenShakeTicks = Math.max(s.screenShakeTicks, 22); s.screenShakeAmt = Math.max(s.screenShakeAmt, 8);
  }
  playAudioOneShot('/sounds/totem-explode.mp3', 1.8); playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .6, .7); // louder than in endless, with a low boom under it
  if (s.gamePhase !== 'playing') return;
  const boss = venusBoss(s); // every miss heals him a little, never past his current phase
  if (boss && boss.hp > 0) { boss.hp = Math.min(venusFloor(t.phase) + venusBand(t.phase), boss.hp + venusBand(t.phase) * VENUS.missHeal); boss.healFlashTicks = 24; }
  p.enemy.hp = p.enemy.maxHp;
  const spot = totemSpot(s, p);
  if (spot) {
    place(s, p, spot[0], spot[1]);
    for (const nest of t.nests.filter(n => n.totemId === p.enemy.id)) placeTotemNest(s, p, nest); // its nests move with it
  } else {
    p.life = VENUS.lifeTicks[idx(t)];
    show(s, p, VENUS.revealTicks);
  }
  if (preserveSchedule) {
    p.life = life; p.overload = warning;
    if (warning > 0) p.enemy.totem = { ageTicks: 0, overloadTicks: warning };
  }
}
/** Called from killEnemy when a totem breaks. The right one advances the sequence (the last breaks the shield); a wrong
 * one blows up its whole chamber at once and reappears elsewhere at full HP, keeping its place in the sequence. */
export function venusTotemDestroyed(s: GameState, e: Enemy) {
  const t = s.venus!, p = t.totems.find(q => q.enemy === e);
  s.enemies = s.enemies.filter(q => q !== e);
  if (!p) return;
  if (p.order !== t.next) { p.buried = true; explode(s, p, true); return; } // wrong one: move without delaying its scheduled blast
  t.totems = t.totems.filter(q => q !== p); t.next++;
  healPlayer(s, VENUS.totemHeal); healCore(s, VENUS.totemHeal); // breaking one in order heals you and Ruby a little
  t.nests = t.nests.filter(n => n.totemId !== e.id);
  if (t.core) (t.core.clues ??= []).push({ tileX: e.tileX, tileY: e.tileY, ticks: VENUS.clueTicks });
  t.blasts.push({ x: e.x, y: e.y, ticks: 36, kind: 'totemBreak' });
  playAudioOneShot('/sounds/aegis-shield-break.wav', .6, 1.2);
  const boss = venusBoss(s);
  if (boss?.aegis) boss.aegis.constructsLeft = t.total - t.next;
  // Each totem broken in order also hits him for 1% of a phase, through his shield (scaled past its cut; never reflected).
  if (boss) { damageEnemy(s, boss, venusBand(t.phase) * VENUS.totemBossShare / (boss.aegis?.shielded ? AEGIS_DAMAGE_MULT : 1), 'summon'); if (s.gamePhase !== 'playing') return; }
  if (t.next >= t.total && boss?.aegis) {
    if (t.core) { t.coreWindow = VENUS.coreTicks; t.coreHintOff = [Math.floor(Math.random() * 9), Math.floor(Math.random() * 9)]; playSFX_meteorWarning(true); } // phase 3: the core is open now; the shield holds until it breaks
    else breakShield(s, t, boss);
  }
}
/** The shield breaks: he is exposed, you and Ruby heal, the backlash hurts him, and it shatters over the view. */
function breakShield(s: GameState, t: VenusState, boss: Enemy) {
  boss.aegis!.shielded = false; boss.aegis!.brokenOnce = true; boss.aegis!.constructsLeft = 0; boss.flashTicks = 20;
  t.exposed = VENUS.exposeTicks; t.lanceTimer = Math.min(t.lanceTimer, lanceGap(s));
  healPlayer(s, VENUS.shieldHeal); healCore(s, VENUS.shieldHeal); // breaking the shield heals you and Ruby
  const floor = venusFloor(t.phase), hurt = Math.min(venusBand(t.phase) * (t.phase >= 3 ? VENUS.finalBreakShare : VENUS.breakShare), boss.hp - floor - 1);
  if (hurt > 0) { boss.hp -= hurt; boss.flashTicks = 20; } // and the backlash hurts him, even mid-leap (when he cannot otherwise be hit)
  t.shatter = { x: boss.x, y: boss.y, ticks: VENUS.shatterTicks };
  playAudioOneShot('/sounds/aegis-shield-break.wav', 1.6, .8); playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .6, .7);
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 30); s.screenShakeAmt = Math.max(s.screenShakeAmt, 12);
}
function updateTotems(s: GameState) {
  const t = s.venus!;
  if (t.exposed > 0) return;
  updateCore(s);
  if (t.spawned < t.total && --t.spawnTimer <= 0) { spawnTotem(s); t.spawnTimer = VENUS.spawnGap; }
  for (const p of [...t.totems]) {
    if ((p.rise ?? 0) > 0) p.rise!--;
    if (p.overload > 0) { // about to blow
      p.enemy.totem = { ageTicks: 0, overloadTicks: --p.overload };
      if (p.overload <= 0) { explode(s, p); if (s.gamePhase !== 'playing') return; }
      continue;
    }
    if (--p.life <= 0) { overload(s, p); continue; }
    if (p.visible > 0 && --p.visible <= 0) bury(s, p); // the sand takes it again
  }
}

// ─── Sand Swirl (C) ──────────────────────────────────────────────────────────

/** C: clear the sand around you, exposing buried totems for a while. It also opens the parry window. */
/** Sand Swirl's footprint: a 7×7 square (3 tiles out each way) with three tiles cut from each corner, so each outer
 * edge is only 3 tiles long (a blocky octagon of 37 tiles). */
export function venusSweepCovers(dx: number, dy: number) {
  const ax = Math.abs(dx), ay = Math.abs(dy), r = VENUS.sweepRadius;
  return Math.max(ax, ay) <= r && ax + ay <= r + 1;
}
export function useSandSweep(s: GameState): boolean {
  const t = s.venus;
  if (!t || s.gamePhase !== 'playing' || t.sweepCooldown > 0) return false;
  s.playerCastTicks = 24; s.playerCastKind = 'aegis_sentinel'; s.playerPrimalCast = true;
  t.sweepCooldown = VENUS.sweepCooldown; t.parryUntil = s.gameTick + VENUS.parryWindow; t.guardUntil = s.gameTick + VENUS.guardTicks;
  const cx = Math.floor(s.playerX / S), cy = Math.floor(s.playerY / S), x = (cx + .5) * S, y = (cy + .5) * S;
  const inSweep = (tx: number, ty: number) => venusSweepCovers(tx - cx, ty - cy);
  t.sweeps.push({ x, y, ticks: 30 });
  for (const totem of [...t.totems, ...t.relics]) {
    if (inSweep(totem.enemy.tileX, totem.enemy.tileY)) {
      show(s, totem, VENUS.sweepExpose);
    }
  }
  for (const nest of [...t.nests]) if (inSweep(nest.tx, nest.ty)) openNest(s, t, nest);
  if (t.core && inSweep(t.core.enemy.tileX, t.core.enemy.tileY)) { // uncovered for a while, like a totem
    if (t.core.buried) { t.finds.push({ x: t.core.enemy.x, y: t.core.enemy.y, ticks: 50, kind: 'eye' }); playAudioOneShot('/sounds/aegis-shield-break.wav', .6, 1.4); }
    t.core.found = true; show(s, t.core, VENUS.sweepExpose);
  }
  for (const e of s.enemies) if (e.hp > 0 && duneWormHidden(e) && inSweep(e.tileX, e.tileY)) { // dug up: dazed above ground
    e.burrow = 'up'; e.burrowTicks = VENUS.burrowDazed; e.flashTicks = 10; e.attackTimer = Math.max(e.attackTimer, 90); // dazed: no sting for 1.5s
    t.nestBursts.push({ x: e.x, y: e.y, ticks: 36 });
  }
  playAudioOneShot('/sounds/venus-sand-sweep.wav', .9);
  return true;
}
/** Called from damagePlayer: while the Sand Swirl guard is up, a direct hit does guardDamage of its damage and its full
 * damage is reflected to the attacker (separately from Venus Veil, which reflects its own). Returns the damage to take. */
/** Venus reflections (Sand Swirl guard, Venus Veil, a reflected totem blast) deal reflectMult of the damage; onto him
 * they are also scaled with his HP, so they stay the same share of it. Outside Venus nothing changes. */
export const venusReflectScale = (s: Readonly<GameState>, e: Enemy) => !s.venus ? 1 : VENUS.reflectMult * (e.id === s.venus.bossId ? venusBand(s.venus.phase) / VENUS.reflectBaseHP : 1);
export function venusGuard(s: GameState, attacker: Enemy | undefined, amount: number, reflectAmount = amount) {
  const t = s.venus;
  if (!t || !attacker || attacker.hp <= 0 || s.gameTick > t.guardUntil) return amount;
  damageEnemy(s, attacker, reflectAmount * VENUS.guardReflect * venusReflectScale(s, attacker), 'reflection');
  t.reflects.push({ fromX: s.playerX, fromY: s.playerY, toX: attacker.x, toY: attacker.y, ticks: 18 });
  return amount * VENUS.guardDamage;
}
// A hit that lands while the parry window is open is turned back on him: he takes it and is stunned.
function parried(s: GameState, boss: Enemy, x: number, y: number, stun: number = VENUS.parryStun) {
  const t = s.venus!;
  if (s.gameTick > t.parryUntil) return false;
  t.parryUntil = -1; t.stun = stun; t.parries.push({ x, y, ticks: 36 });
  healPlayer(s, VENUS.counterHeal); // a successful counter heals you
  counterBlast(s, boss);
  const floor = venusFloor(t.phase); // a parry never carries him past a phase
  const scratch = boss.aegis?.shielded ? AEGIS_DAMAGE_MULT : 1; // full damage only while his shield is broken
  boss.hp = Math.max(floor, boss.hp - venusBand(t.phase) * VENUS.parryDamage * scratch); boss.flashTicks = 16;
  if (boss.hp <= 0) killEnemy(s, s.enemies.indexOf(boss));
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 12); s.screenShakeAmt = Math.max(s.screenShakeAmt, 5);
  return true;
}

// ─── His attacks: the leap and the lance ─────────────────────────────────────

function updateLeap(s: GameState, boss: Enemy) {
  const t = s.venus!;
  if (!t.leap) {
    if (t.lance || t.stun > 0 || t.exposed > 0 || --t.leapTimer > 0) return; // no leaps while his shield is broken: the countdown waits
    t.leap = { stage: 'aim', ticks: VENUS.leapAim, tx: s.playerTileX, ty: s.playerTileY };
    playAudioOneShot('/sounds/charging.wav', .6, .7);
    return;
  }
  const l = t.leap;
  if (l.stage === 'aim') { l.tx = s.playerTileX; l.ty = s.playerTileY; if (--l.ticks <= 0) { l.stage = 'lock'; l.ticks = VENUS.leapLock; } return; }
  if (--l.ticks > 0) {
    if (l.ticks === 45) playAudioOneShot('/sounds/falling-thing.wav', .85);
    return;
  }
  // Land: on the locked tile (or the nearest open one), hurting and shoving anyone close.
  t.leap = null; t.leapTimer = t.leapTotal = attackGap(s, VENUS.leapGap); t.leapSlow = VENUS.leapSlow; // he lumbers for a moment after landing
  const x = isFloorTile(s.map, l.tx, l.ty) ? l.tx : boss.tileX, y = isFloorTile(s.map, l.tx, l.ty) ? l.ty : boss.tileY;
  Object.assign(boss, { tileX: x, tileY: y, targetTileX: x, targetTileY: y, x: (x + .5) * S, y: (y + .5) * S, stepProgress: 0, path: [] });
  t.impacts.push({ x: boss.x, y: boss.y, ticks: 30 });
  playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .7, .7);
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 16); s.screenShakeAmt = Math.max(s.screenShakeAmt, 7);
  // You can parry the landing from up to a tile outside its reach (leapParryReach); only inside the reach does it hurt.
  const d = Math.hypot(s.playerX - boss.x, s.playerY - boss.y);
  if (d <= (VENUS.leapRadius + VENUS.leapParryReach) * S && parried(s, boss, s.playerX, s.playerY, VENUS.leapParryStun)) return;
  if (d <= VENUS.leapRadius * S) { t.reflectAs = VENUS.leapDamage; damagePlayer(s, VENUS.leapDamage * VENUS.attackSoften, boss); t.reflectAs = undefined; if (s.gamePhase === 'playing') shovePlayerFromEnemy(s, boss, VENUS.leapShove); }
}
function updateLance(s: GameState, boss: Enemy) {
  const t = s.venus!;
  if (!t.lance) {
    if (t.leap || t.stun > 0 || --t.lanceTimer > 0) return;
    if (Math.hypot(s.playerX - boss.x, s.playerY - boss.y) > (VENUS.lanceRange + 1) * S) { t.lanceTimer = 30; return; }
    t.lance = { ticks: VENUS.lanceWindup, dx: 1, dy: 0 };
    playAudioOneShot('/sounds/charging.wav', .55, .9);
  }
  const l = t.lance;
  if (l.ticks > VENUS.lanceLock) { const d = Math.hypot(s.playerX - boss.x, s.playerY - boss.y) || 1; l.dx = (s.playerX - boss.x) / d; l.dy = (s.playerY - boss.y) / d; } // aims, then locks
  if (--l.ticks > 0) return;
  t.lance = null; t.lanceTimer = lanceGap(s);
  const beam = { x: boss.x, y: boss.y, dx: l.dx, dy: l.dy, ticks: 20, parried: false };
  t.beams.push(beam);
  playAudioOneShot('/sounds/aegis-attack.mp3', .8, .8);
  // The player is hit if within the lance's width along its length.
  const px = s.playerX - boss.x, py = s.playerY - boss.y, along = px * l.dx + py * l.dy, across = Math.abs(px * l.dy - py * l.dx);
  if (along >= 0 && along <= VENUS.lanceRange * S && across <= VENUS.lanceHalfWidth * S) {
    if (parried(s, boss, s.playerX, s.playerY)) beam.parried = true; else { t.reflectAs = VENUS.lanceDamage; damagePlayer(s, VENUS.lanceDamage * VENUS.attackSoften, boss); t.reflectAs = undefined; }
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────

export function updateVenus(s: GameState) {
  const t = s.venus;
  if (!t || s.gamePhase !== 'playing') return;
  for (const list of [t.sweeps, t.blasts, t.beams, t.impacts, t.parries, t.reflects]) for (const fx of list) fx.ticks--;
  t.reflects = t.reflects.filter(f => f.ticks > 0);
  t.sweeps = t.sweeps.filter(f => f.ticks > 0); t.blasts = t.blasts.filter(f => f.ticks > 0); t.beams = t.beams.filter(f => f.ticks > 0);
  t.impacts = t.impacts.filter(f => f.ticks > 0); t.parries = t.parries.filter(f => f.ticks > 0);
  if (t.sweepCooldown > 0 && --t.sweepCooldown === 0) playUiSfx('fenceReady');
  if ((t.leapSlow ?? 0) > 0) t.leapSlow!--;
  if (t.phase >= 3) { t.scorpTimer ??= VENUS.scorpRespawn; refillScorpions(s, t); }
  if (t.wormStun && !s.playerKnockback) { t.wormStun = false; stunPlayer(s, VENUS.burrowStun); } // a Dune Worm bite stuns you once the knockback ends
  t.trails = t.trails.filter(m => --m.ticks > 0); if (t.shatter && --t.shatter.ticks <= 0) t.shatter = null;
  updateRelics(s); updateNests(s); // relics, nests (and their effects) run with or without him on the map
  const boss = venusBoss(s);
  if (!boss) return;
  const phase = venusPhaseOf(boss.hp);
  if (phase > t.phase) { // a new phase: the shield returns with a longer sequence
    t.phase = phase; s.bossSpawnName = `AEGIS SENTINEL · PHASE ${phase}`; s.bossSpawnTicks = 150;
    startSequence(s, VENUS.recoverySpawnDelay); setScorpions(s); return;
  }
  if (t.exposed > 0 && --t.exposed === 0) {
    startSequence(s, VENUS.recoverySpawnDelay);
    playAudioOneShot('/sounds/aegis-shield-break.wav', .4, .6);
  }
  if (boss.aegis) boss.aegis.exposedUntilTick = s.gameTick + t.exposed; // drives the usual reshield warning (closing frame, bar and beeps)
  if (t.stun > 0) t.stun--;
  updateTotems(s); if (s.gamePhase !== 'playing') return;
  updateLeap(s, boss); if (s.gamePhase !== 'playing') return;
  updateLance(s, boss);
}

// ─── Sand relics ─────────────────────────────────────────────────────────────

const RELIC_KINDS: RelicKind[] = ['urn', 'sun', 'eye'];
// ─── Sand Scarab nests ───────────────────────────────────────────────────────

// An open spot for something buried: away from you, the totems, the relics and other nests.
function buriedSpot(s: GameState, t: VenusState): [number, number] | null {
  const tiles = [0, 1, 2, 3].flatMap(r => freeChamberTiles(s, r)).filter(([x, y]) => Math.hypot(x - s.playerTileX, y - s.playerTileY) >= 4
    && ![...t.totems, ...t.relics].some(p => Math.hypot(x - p.enemy.tileX, y - p.enemy.tileY) < 3) && !t.nests.some(n => Math.hypot(x - n.tx, y - n.ty) < 3));
  return tiles.length ? tiles[Math.floor(Math.random() * tiles.length)] : null;
}
function scarabTiles(s: GameState, tx: number, ty: number, totemId?: number): [number, number][] {
  const t = s.venus!, room = chamberOfTile(tx, ty);
  const spots: [number, number][] = [];
  for (let dy = -VENUS.nestRange; dy <= VENUS.nestRange; dy++) {
    for (let dx = -VENUS.nestRange; dx <= VENUS.nestRange; dx++) {
      const x = tx + dx, y = ty + dy;
      if ((!dx && !dy) || Math.hypot(dx, dy) > VENUS.nestRange || chamberOfTile(x, y) !== room ||
          !isFloorTile(s.map, x, y) ||
          (x === s.playerTileX && y === s.playerTileY) || (x === s.rubyTileX && y === s.rubyTileY) ||
          s.enemies.some(e => e.hp > 0 && e.tileX === x && e.tileY === y) ||
          t.totems.some(p => p.enemy.id !== totemId && p.enemy.tileX === x && p.enemy.tileY === y) ||
          t.nests.some(n => n.totemId !== totemId && n.tx === x && n.ty === y) ||
          t.relics.some(r => r.enemy.tileX === x && r.enemy.tileY === y) ||
          (t.core?.enemy.tileX === x && t.core.enemy.tileY === y)) continue;
      spots.push([x, y]);
    }
  }
  return spots.sort(([ax, ay], [bx, by]) => Math.hypot(ax - tx, ay - ty) - Math.hypot(bx - tx, by - ty));
}

function placeTotemNest(s: GameState, totem: VenusTotem, nest?: VenusNest) {
  const t = s.venus!, { id, tileX, tileY } = totem.enemy;
  const tiles = scarabTiles(s, tileX, tileY, id).filter(([x, y]) => (x !== nest?.tx || y !== nest?.ty) && !t.nests.some(n => n !== nest && n.tx === x && n.ty === y));
  if (!tiles.length) return;
  const spot = tiles[Math.floor(Math.random() * tiles.length)]; // anywhere within range, not always the nearest tile
  if (nest) [nest.tx, nest.ty] = spot;
  else t.nests.push({ tx: spot[0], ty: spot[1], totemId: id });
}

/** A swirl uncovers a nest: it bursts open and its scarabs scuttle out after you. */
function openNest(s: GameState, t: VenusState, nest: VenusNest) {
  const totem = t.totems.find(p => p.enemy.id === nest.totemId);
  if (!totem) return;
  const spots = scarabTiles(s, totem.enemy.tileX, totem.enemy.tileY, nest.totemId)
    .sort(([ax, ay], [bx, by]) => Math.hypot(ax - nest.tx, ay - nest.ty) - Math.hypot(bx - nest.tx, by - nest.ty));
  if (spots.length < VENUS.nestScarabs) return;
  t.nests = t.nests.filter(n => n !== nest);
  for (const [x, y] of spots.slice(0, VENUS.nestScarabs)) {
    const bug = createEncounterEnemy(s, 'sand_scarab', x, y, ENEMY_CONFIGS.sand_scarab.maxHp);
    bug.visualSpawnTicks = 30; bug.attackTimer = 45; bug.pathTimer = 0;
    s.enemies.push(bug);
  }
  t.nestBursts.push({ x: (nest.tx + .5) * S, y: (nest.ty + .5) * S, ticks: 36 });
  playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .35, 1.6); playAudioOneShot('/sounds/slash.mp3', .5, 1.4);
}
function updateNests(s: GameState) {
  const t = s.venus!;
  t.nestBursts = t.nestBursts.filter(b => --b.ticks > 0);
  if (t.nestTimer !== undefined) {
    delete t.nestTimer;
    t.nests = [];
    for (const totem of t.totems) placeTotemNest(s, totem);
  }
  // More nests over time, shared out among the totems, up to the phase's cap.
  t.nestClock ??= VENUS.nestGap;
  if (--t.nestClock <= 0) {
    t.nestClock = VENUS.nestGap;
    // Shared out among the totems left (and the phase 3 core): at most nestsPerTarget each, so a lone totem never gathers a swarm.
    const targets: { enemy: Enemy }[] = [...t.totems, ...(t.core ? [t.core] : [])], cap = Math.min(VENUS.nestCap[idx(t)], VENUS.nestsPerTarget * targets.length);
    if (targets.length && t.nests.length < cap) { // a target with the fewest nests (ties at random)
      const count = (p: { enemy: Enemy }) => t.nests.filter(n => n.totemId === p.enemy.id).length, fewest = Math.min(...targets.map(count));
      const pick = targets.filter(p => count(p) === fewest);
      placeTotemNest(s, pick[Math.floor(Math.random() * pick.length)] as never);
    }
  }
}

// ─── Dune Worm ───────────────────────────────────────────────────────────

/** Underground (or about to burst up): it cannot be hit and only its sand trail shows. */
export function duneWormHidden(e: Enemy) { return (e.type === 'dune_worm' || e.type === 'sand_scorpion') && (!e.burrow || e.burrow === 'under' || e.burrow === 'rising'); } // also a buried Sand Scorpion
/** A Dune Worm's own steps. Underground it tunnels after you with the ordinary chase (returns false), leaving a
 * trail. Once it settles on a tile next to you it rumbles, bursts up with a knockback bite, stays up, then digs back
 * down to rest before it can surface again. Returns true while it is surfacing, up or sinking (it does not move). */
// ─── Sand Scorpion (phase 3) ─────────────────────────────────────────────────

/** Phase 3 buries scorpions on fixed tiles for the whole phase; any other phase clears them. */
function setScorpions(s: GameState) {
  const t = s.venus!;
  s.enemies = s.enemies.filter(e => e.type !== 'sand_scorpion'); t.scorpTimer = VENUS.scorpRespawn;
  if (t.phase < 3) return;
  for (let i = 0; i < VENUS.scorpions; i++) if (!buryScorpion(s, t)) break;
}
function buryScorpion(s: GameState, t: VenusState): boolean {
  const spot = buriedSpot(s, t); if (!spot) return false;
  const e = createEncounterEnemy(s, 'sand_scorpion', spot[0], spot[1], ENEMY_CONFIGS.sand_scorpion.maxHp);
  e.burrow = 'under'; e.burrowTicks = 0; e.attackTimer = 0; e.pushTiles = 0;
  s.enemies.push(e); return true;
}
/** Phase 3: while fewer than the full set are alive, a new scorpion is buried somewhere every scorpRespawn ticks. */
function refillScorpions(s: GameState, t: VenusState) {
  if (t.phase < 3) return;
  if (s.enemies.filter(e => e.type === 'sand_scorpion' && e.hp > 0).length >= VENUS.scorpions) { t.scorpTimer = VENUS.scorpRespawn; return; }
  if (--t.scorpTimer! > 0) return;
  t.scorpTimer = VENUS.scorpRespawn; buryScorpion(s, t);
}
/** A scorpion never leaves its tile. Buried, it waits; when you stand beside it, it bursts up stinging you hard with a
 * knockback, stays up (stinging again if you stay close), then buries itself and rests before it can rise again. */
export function updateSandScorpion(s: GameState, e: Enemy) {
  const cfg = ENEMY_CONFIGS.sand_scorpion;
  e.burrow ??= 'under'; e.burrowTicks ??= 0; e.pushTiles = 0;
  if (e.attackTimer > 0) e.attackTimer--;
  const near = !s.enemyDecoyActive && Math.max(Math.abs(e.tileX - s.playerTileX), Math.abs(e.tileY - s.playerTileY)) <= 1;
  const sting = () => {
    if (!near || e.attackTimer > 0) return;
    damagePlayer(s, cfg.damageToPlayer, e);
    if (shovePlayerFromEnemy(s, e, VENUS.scorpKnockback) && s.playerKnockback) s.playerKnockback.speedMult = VENUS.scorpKnockSpeed; // a fast fling
    e.shootTicks = 16; e.attackTimer = cfg.attackCooldown;
    playAudioOneShot('/sounds/slash.mp3', .6, .8);
  };
  if (e.burrow === 'under') {
    if (e.burrowTicks > 0) e.burrowTicks--;
    else if (near) { e.burrow = 'rising'; e.burrowTicks = VENUS.scorpRise; playAudioOneShot('/sounds/venus-sand-sweep.wav', .35, 1.8); }
    return;
  }
  if (e.burrow === 'rising') {
    if (--e.burrowTicks <= 0) { e.burrow = 'up'; e.burrowTicks = VENUS.scorpUp; s.venus!.nestBursts.push({ x: e.x, y: e.y, ticks: 36 }); sting(); }
    return;
  }
  if (e.burrow === 'up') { sting(); if (--e.burrowTicks <= 0) { e.burrow = 'sinking'; e.burrowTicks = VENUS.burrowSink; } return; }
  if (--e.burrowTicks <= 0) { e.burrow = 'under'; e.burrowTicks = VENUS.scorpRest; }
}

export function updateDuneWorm(s: GameState, e: Enemy): boolean {
  const t = s.venus;
  if (!t) return false;
  e.burrow ??= 'under'; e.burrowTicks ??= 0;
  if (e.burrow === 'under') {
    if (e.burrowTicks > 0) e.burrowTicks--;
    const last = t.trails.filter(m => m.id === e.id).pop();
    if (!last || Math.hypot(last.x - e.x, last.y - e.y) >= S * .4) t.trails.push({ x: e.x, y: e.y, ticks: VENUS.trailTicks, id: e.id });
    const settled = e.tileX === e.targetTileX && e.tileY === e.targetTileY;
    if (settled && e.burrowTicks <= 0 && !s.enemyDecoyActive && Math.max(Math.abs(e.tileX - s.playerTileX), Math.abs(e.tileY - s.playerTileY)) <= 1) {
      e.burrow = 'rising'; e.burrowTicks = VENUS.burrowRise;
      playAudioOneShot('/sounds/venus-sand-sweep.wav', .35, 1.5);
      return true;
    }
    return false;
  }
  e.pushTiles = 0;
  if (--e.burrowTicks > 0) return true;
  if (e.burrow === 'rising') { // bursts up: a knockback bite if you are still beside it
    e.burrow = 'up'; e.burrowTicks = VENUS.burrowUp; e.shootTicks = 14;
    t.nestBursts.push({ x: e.x, y: e.y, ticks: 36 });
    playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .3, 1.8);
    if (Math.max(Math.abs(e.tileX - s.playerTileX), Math.abs(e.tileY - s.playerTileY)) <= 1) {
      damagePlayer(s, ENEMY_CONFIGS.dune_worm.damageToPlayer, e);
      shovePlayerFromEnemy(s, e, VENUS.burrowKnockback); t.wormStun = true; // stunned once you land
    }
  } else if (e.burrow === 'up') { e.burrow = 'sinking'; e.burrowTicks = VENUS.burrowSink; }
  else { e.burrow = 'under'; e.burrowTicks = VENUS.burrowRest; }
  return true;
}

function buryRelic(s: GameState, t: VenusState) {
  const tiles = [0, 1, 2, 3].flatMap(r => freeChamberTiles(s, r)).filter(([x, y]) => Math.hypot(x - s.playerTileX, y - s.playerTileY) >= 4
    && ![...t.totems, ...t.relics].some(p => Math.hypot(x - p.enemy.tileX, y - p.enemy.tileY) < 3));
  if (!tiles.length) return;
  const [x, y] = tiles[Math.floor(Math.random() * tiles.length)];
  const enemy = createEncounterEnemy(s, 'sand_relic', x, y, 1);
  // A mix of kinds: the rarest on the map first, never more than relicPerKind of one kind.
  const count = (k: RelicKind) => t.relics.filter(r => r.kind === k).length, open = RELIC_KINDS.filter(k => count(k) < VENUS.relicPerKind);
  if (!open.length) return;
  const fewest = Math.min(...open.map(count)), pick = open.filter(k => count(k) === fewest), kind = pick[Math.floor(Math.random() * pick.length)];
  enemy.relicKind = kind;
  t.relics.push({ enemy, kind, visible: 0, buried: true });
}
// Relics stay buried until a sweep uncovers them; then they sink back in after a while.
function updateRelics(s: GameState) {
  const t = s.venus!;
  if (t.seer > 0) t.seer--;
  t.finds = t.finds.filter(f => --f.ticks > 0);
  if (!t.relics.length && t.relicTimer === 60) for (let i = 0; i < VENUS.relicStart; i++) buryRelic(s, t);
  if (--t.relicTimer <= 0) { t.relicTimer = VENUS.relicGap; if (t.relics.length < VENUS.relicCap) buryRelic(s, t); }
  for (const r of t.relics) {
    if ((r.rise ?? 0) > 0) r.rise!--;
    if (r.visible > 0 && --r.visible <= 0) { r.buried = true; s.enemies = s.enemies.filter(e => e !== r.enemy); }
  }
}
/** Called from killEnemy: a relic breaks and gives its effect. */
export function venusRelicDestroyed(s: GameState, e: Enemy) {
  const t = s.venus!, r = t.relics.find(q => q.enemy === e);
  s.enemies = s.enemies.filter(q => q !== e);
  if (!r) return;
  t.relics = t.relics.filter(q => q !== r);
  if (r.kind === 'urn') { healPlayer(s, VENUS.urnHeal); healCore(s, VENUS.urnHeal); }
  else if (r.kind === 'sun') { if (s.trial && s.trial.cooldown > 0) s.trial.cooldown = Math.max(1, Math.round(s.trial.cooldown * VENUS.sunVeilCut)); } // F comes back sooner
  else t.seer = VENUS.seerTicks;
  t.finds.push({ x: e.x, y: e.y, ticks: 50, kind: r.kind });
  playAudioOneShot('/sounds/aegis-shield-break.wav', .5, 1.9); playUiSfx('fenceReady');
}
/** Where the buried totems lie is shown (god panel toggle, or a Seer's Eye for a while). */
export const venusRevealing = (s: Readonly<GameState>) => !!s.venus && (!!s.venus.godReveal || s.venus.seer > 0);
/** Their order is shown too: only the god panel toggle. */
export const venusRevealingOrder = (s: Readonly<GameState>) => !!s.venus?.godReveal;
/** Totem numbers are shown: the god panel toggle, or a Seer's Eye for a while. */
export const venusShowingNumbers = (s: Readonly<GameState>) => !!s.venus && (!!s.venus.godReveal || s.venus.seer > 0);

export function clearVenusEncounter(s: GameState) {
  const t = s.venus; if (!t) return;
  Object.assign(t, { leap: null, lance: null, stun: 0, sweeps: [], blasts: [], beams: [], impacts: [], parries: [], reflects: [] });
}

/** God controls. */
export function godSetVenusPhase(s: GameState, phase: 1 | 2 | 3) {
  godPhaseClock(s, phase); // phase 2+ starts at least a minute in
  const t = s.venus;
  if (!t || s.gamePhase !== 'playing') return;
  if (!venusBoss(s)) { godSpawnBoss(s, 'aegis_sentinel'); if (!venusBoss(s)) return; }
  const boss = venusBoss(s)!;
  boss.hp = venusFloor(phase) + venusBand(phase); t.phase = phase;
  s.bossSpawnName = `AEGIS SENTINEL · PHASE ${phase}`; s.bossSpawnTicks = 150;
  startSequence(s); setScorpions(s);
}
export function godVenusBreakShield(s: GameState) {
  const t = s.venus, boss = venusBoss(s); if (!t || !boss?.aegis) return;
  for (const p of t.totems) bury(s, p);
  t.nests = [];
  t.totems = []; t.spawned = t.next = t.total; removeCore(s);
  if (boss.aegis.shielded) breakShield(s, t, boss); // the same break as in play: heal, backlash and the shatter
}
export function godVenusLeap(s: GameState) { if (s.venus && !s.venus.leap) s.venus.leapTimer = 1; }
export function godVenusLance(s: GameState) { if (s.venus && !s.venus.lance) s.venus.lanceTimer = 1; }
export const venusTotemRoom = (p: VenusTotem) => chamberOfTile(p.enemy.tileX, p.enemy.tileY);
