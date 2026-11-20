import { CHAMBER_BOUNDS, ENEMY_CONFIGS, SINGULARITY_CHALLENGE as SC, TELEPORT_PADS, TILE_SIZE, chamberOfTile, isBossType } from './constants';
import { addStarEnergy } from './blessing-effects';
import { bfs, devourerBodyScale, createEncounterEnemy, damageEnemy, damagePlayer, damageRuby, explodeDevourer, devourerSoundAllowed, splitBody, freeChamberTiles, hasLineOfSight, healCore, healPlayer, isFloorTile, killEnemy, playAudioOneShot, shovePlayerFromEnemy, type Enemy, type GameState } from './engine';

// Two Maws open in turns and consume bodies permanently; the Gravity Hook (C) tows a body and flings it into one.

export interface Maw { x: number; y: number; tx: number; ty: number; room: number; ticks: number; age?: number; offset?: number; opens?: number; forced?: 'open' | 'closed'; next?: { tx: number; ty: number; room: number } } // age: ticks since it appeared (fade-in and open cycle); offset: where in the cycle it started
/** A Lost Soul about to appear: a mark on the floor and minimap for soulWarnTicks before the soul comes out there. */
/** A drifting toxic gas cloud (phase 2+): its centre in pixels, its drift, and its life (ticks left of max). */
export interface GasCloud { x: number; y: number; vx: number; vy: number; ticks: number; max: number; seed: number; r?: number; still?: boolean } // r: radius in tiles (default gas.radius); still: left by a Contaminated Soulless, never drifts
export interface SoulSign { tx: number; ty: number; ticks: number; golden: boolean; hollow?: boolean; toxic?: boolean } // hollow: a Soulless is coming (toxic: a Contaminated Soulless)
export interface SingularityTrial {
  phase: 1 | 2 | 3; encounterId: number; defeatedMaxHp: number;
  soundTicks?: Record<string, number>; // when each repeatable sound last played (devourerSoundAllowed)
  maws?: Maw[];
  convergenceTimer?: number;
  convergence?: { x: number; y: number; ticks: number; stage: 'gather' | 'charge' | 'blast'; count: number; gatherTicks?: number; sequential?: boolean; members: { id: number; x: number; y: number; tx: number; ty: number; size?: number; started?: boolean }[] };

  hook?: { id: number; ticks: number };       // the body you hold, and for how long
  hookCooldown?: number;
  flings?: { id: number; ax: number; ay: number; dx: number; dy: number; left: number; moved: number }[]; // bodies in flight: the tile aimed at, the last step, steps left and taken
  hookFx?: { x: number; y: number; ticks: number; kind: 'slam' | 'wall' | 'latch' }[];
  feast?: { count: number; ticks: number }; // the swallow chain
  jaw?: { tx: number; ty: number; ticks: number; snap: number; hit?: boolean }; // a jaw warning (ticks left), then biting (snap left)
  jawTimer?: number;
  gas?: GasCloud[];                          // toxic gas clouds (phase 2+)      // ticks to the next jaw; a stun waiting for your knockback to land
  horizonCooldown?: number;
  soulTimer?: number; soullessTimer?: number; phaseStartTick?: number; // when this phase began (for the lone-body rescue)
  soulSigns?: SoulSign[];
  lands?: { x: number; y: number; ticks: number }[]; // a jumping body hitting the ground where its comet came down
  bursts?: { x: number; y: number; ticks: number; to: [number, number][] }[]; // a gorged body exploding, with where each copy was flung
  swallows?: { x: number; y: number; ticks: number; big: boolean; torn?: boolean; fromX?: number; fromY?: number; size?: number }[];  // effects where something was consumed or torn apart
}

export const SINGULARITY_BURST_TICKS = 48;
/** A flung body (a jump, a burst copy, a gas fling) is in the air for LAND_TICKS: its comet climbs to FALL_HEIGHT tiles
 * above the landing spot (1/1.4 of the burst animation), then the body drops straight down over the last FALL_TICKS. */
export const SINGULARITY_FALL_TICKS = 16;
export const SINGULARITY_FALL_HEIGHT = 6;
export const SINGULARITY_LAND_TICKS = Math.round(SINGULARITY_BURST_TICKS / 1.4) + SINGULARITY_FALL_TICKS;
/** How high (px) an airborne body is drawn above its tile: Infinity while still a comet, 0 when not in the air. */
export function singularityLift(e: Readonly<Enemy>): number {
  const lt = e.devourer?.landTicks ?? 0; if (lt <= 0) return 0;
  return lt > SINGULARITY_FALL_TICKS ? Infinity : SINGULARITY_FALL_HEIGHT * TILE_SIZE * (lt / SINGULARITY_FALL_TICKS) ** 2;
}
export const SINGULARITY_LAND_FX_TICKS = 30;
const phaseIndex = (t: SingularityTrial) => t.phase - 1;
export const mawCount = (t: SingularityTrial) => SC.mawCount[phaseIndex(t)];
export const phaseHP = (phase: 1 | 2 | 3) => SC.phaseHP[phase - 1];
export const phaseStacks = (phase: 1 | 2 | 3) => SC.maxStacks[phase - 1]; // the phase's max stacks; the original spawns full
/** A body's full stacks: the phase's max for the original, bodyStacks for every copy. */
export const bodyStackCap = (phase: 1 | 2 | 3, e: Enemy) => (e.devourer?.generation ?? 0) === 0 ? phaseStacks(phase) : SC.bodyStacks;

/** Where a Maw is in its cycle: idling small, warning, or open wide. `open` is 0–1 (eased in and out of the window). */
export function mawWindow(m: Maw): { state: 'closed' | 'warn' | 'open'; p: number; open: number } {
  if (m.forced) return { state: m.forced, p: 0, open: m.forced === 'open' ? 1 : 0 }; // held by the god panel (and tests)
  const { closed, warn, open } = SC.mawCycle, c = ((m.age ?? 0) + (m.offset ?? 0)) % (closed + warn + open);
  if (c < closed) return { state: 'closed', p: c / closed, open: 0 };
  if (c < closed + warn) return { state: 'warn', p: (c - closed) / warn, open: 0 };
  const into = c - closed - warn, p = into / open; // eased in over its first half second and out over its last 0.75s
  return { state: 'open', p, open: Math.min(1, into / 30, (open - into) / 45) };
}
/** The strongest open Maw right now (0–1), for the backdrop. */
export function singularityOpenness(s: Readonly<GameState>) { return Math.max(0, ...(s.trial?.devourer?.maws ?? []).map(m => mawWindow(m).open)); }
export function mawReach(s: GameState, m: Maw): number {
  void s; return SC.mawRadius + (SC.mawOpenRadius - SC.mawRadius) * mawWindow(m).open; // grows and shrinks with the window
}

// A 3×3 patch of open floor, so the Maw's centre and its rim are always walkable.
function clearPatch(s: GameState, x: number, y: number) {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!isFloorTile(s.map, x + dx, y + dy)) return false;
  return true;
}
function pickSpot(s: GameState, avoidRooms: number[]): { tx: number; ty: number; room: number } | null {
  const rooms = [0, 1, 2, 3].filter(r => !avoidRooms.includes(r));
  for (let i = rooms.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [rooms[i], rooms[j]] = [rooms[j], rooms[i]]; }
  // The teleport pad may sit in the outer reach but is kept out of the inner pull (mawInnerRadius) when any chamber
  // allows it; otherwise that rule is dropped.
  for (const padRule of [true, false]) for (const room of rooms.length ? rooms : [0, 1, 2, 3]) {
    // The normal reach stays inside the chamber's outer walls, and spots with the least cover inside it are preferred.
    const [top, left, bottom, right] = CHAMBER_BOUNDS[room], r = SC.mawRadius, [padX, padY] = TELEPORT_PADS[room];
    const tiles = freeChamberTiles(s, room).filter(([x, y]) => x - r > left && x + r < right && y - r > top && y + r < bottom
      && (!padRule || Math.hypot(x - padX, y - padY) > SC.mawInnerRadius)
      && clearPatch(s, x, y) && Math.hypot(x - s.playerTileX, y - s.playerTileY) >= 4 && Math.hypot(x - s.rubyTileX, y - s.rubyTileY) > 2);
    if (!tiles.length) continue;
    const cover = ([x, y]: number[]) => { let n = 0; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (Math.hypot(dx, dy) <= r && !isFloorTile(s.map, x + dx, y + dy)) n++; return n; };
    const scored = tiles.map(t => [t, cover(t)] as const), least = Math.min(...scored.map(([, n]) => n));
    const best = scored.filter(([, n]) => n <= least + 2).map(([t]) => t);
    const [tx, ty] = best[Math.floor(Math.random() * best.length)]; return { tx, ty, room };
  }
  return null;
}
const place = (spot: { tx: number; ty: number; room: number }, ticks: number): Maw => ({ ...spot, x: (spot.tx + .5) * TILE_SIZE, y: (spot.ty + .5) * TILE_SIZE, ticks, age: 0 });

/**
 * Two Maws in separate chambers. Each counts down `mawMoveTicks` (the second starts half as late again), shows where it
 * will go for the last `mawPreview` ticks (turning green), then teleports there. The last 40 ticks (its fade-out) only run
 * while it rests, so it never leaves mid-window; it reappears fading in, keeping its place in the open cycle. Age drives
 * the fade-in; `opens` counts its windows for the backdrop gulp.
 */
function manageMaws(s: GameState, t: SingularityTrial) {
  const maws = t.maws ??= [], moveTicks = SC.mawMoveTicks[phaseIndex(t)];
  while (maws.length > mawCount(t)) maws.pop();
  while (maws.length < mawCount(t)) {
    const spot = pickSpot(s, [...maws.map(m => m.room), ...(maws.length ? [] : [])]);
    if (!spot) return;
    const cycle = SC.mawCycle.closed + SC.mawCycle.warn + SC.mawCycle.open;
    maws.push({ ...place(spot, moveTicks + maws.length * Math.floor(moveTicks / 2)), offset: maws.length * Math.floor(cycle / 2) }); // half a cycle apart
  }
  for (const m of maws) {
    m.age = (m.age ?? 0) + 1;
    const c = SC.mawCycle, at = ((m.age ?? 0) + (m.offset ?? 0)) % (c.closed + c.warn + c.open);
    if (!m.forced && at === c.closed + c.warn) { // it opens: the deep gulp, slowed to the length of the window (the backdrop black hole gulps with it)
      playAudioOneShot('/sounds/reverse.mp3', .35, .42); playAudioOneShot('/sounds/celestial/singularity.wav', .22, .25);
    }
    if (!m.forced && at === c.closed + c.warn) m.opens = (m.opens ?? 0) + 1;
    if (m.ticks > 40 || mawWindow(m).state === 'closed') m.ticks--; // the fade-out waits for it to rest
    if (!m.next && m.ticks <= SC.mawPreview) {
      const spot = pickSpot(s, [m.room, ...maws.filter(o => o !== m).flatMap(o => [o.room, ...(o.next ? [o.next.room] : [])])]);
      if (spot) m.next = spot; else m.ticks = SC.mawPreview + 60; // nowhere to go: try again shortly
    }
    if (m.ticks <= 0 && m.next) {
      (t.swallows ??= []).push({ x: m.x, y: m.y, ticks: 40, big: true }); // it collapses where it was
      const cycle = c.closed + c.warn + c.open, keep = ((m.offset ?? 0) + (m.age ?? 0)) % cycle; // same place in its open cycle
      Object.assign(m, place(m.next, moveTicks), { offset: keep, next: undefined });
      for (const e of s.enemies) if (e.type === 'devourer') e.pathTimer = 0; // the swarm re-routes around its new reach
    }
  }
}

/** A Devourer body one stack from full, or already bursting: it is a little harder to pull. */
export function nearlyFull(s: GameState, e: Enemy) {
  const t = s.trial?.devourer as SingularityTrial | undefined;
  return !!t && e.type === 'devourer' && (e.devourer?.gorgeTicks !== undefined || e.chargeDirX >= bodyStackCap(t.phase, e) - 1);
}
// How much less often something is pulled: 1 for small enemies, more for heavy bodies, more again when nearly full.
const pullWeight = (s: GameState, e: Enemy, heavy: number) => e.type === 'devourer' || isBossType(e.type) ? heavy * (nearlyFull(s, e) ? SC.fullPullMult : 1) : 1;

// One tile toward a Maw's centre, preferring the longer axis and never into a wall.
function stepToward(s: GameState, m: { tx: number; ty: number }, x: number, y: number) {
  const dx = m.tx - x, dy = m.ty - y;
  if (!dx && !dy) return null;
  const choices = Math.abs(dx) >= Math.abs(dy) ? [[Math.sign(dx), 0], [0, Math.sign(dy)]] : [[0, Math.sign(dy)], [Math.sign(dx), 0]];
  return choices.find(([sx, sy]) => (sx || sy) && isFloorTile(s.map, x + sx, y + sy)) ?? null;
}

const consumable = (e: Enemy) => !e.devourer?.merging && e.hp > 0 && !e.twin?.downedTicks && e.type !== 'aegis_construct';
// Each phase's original (generation 0) is never pulled in or swallowed by a Maw, so it always bursts at least once.
// Lost Souls are never pulled in or swallowed either: they stay on the floor as food and bait.
const swallowable = (e: Enemy) => consumable(e) && !e.devourer?.landTicks && e.type !== 'lost_soul' && !(e.type === 'devourer' && (e.devourer?.generation ?? 0) === 0);

/** The F field (Singularity skill) is a small Maw of its own: a Devourer copy that reaches its centre tile is swallowed
 * whole, with the same heal and Feast chain. Called each tick while F is active in the challenge. */
export function swallowAtField(s: GameState) {
  const t = s.trial?.devourer as SingularityTrial | undefined, f = s.singularity;
  if (!t || !f || f.ticks <= 0 || s.gamePhase !== 'playing') return;
  const tx = Math.floor(f.x / TILE_SIZE), ty = Math.floor(f.y / TILE_SIZE), centre = { x: (tx + .5) * TILE_SIZE, y: (ty + .5) * TILE_SIZE } as Maw;
  for (const e of [...s.enemies]) {
    if (e.type !== 'devourer' || !swallowable(e) || held(t, e) || !s.enemies.includes(e)) continue;
    if (e.tileX === tx && e.tileY === ty && Math.hypot(e.x - centre.x, e.y - centre.y) <= TILE_SIZE * .55) { consume(s, t, centre, e); if (s.gamePhase !== 'playing') return; }
  }
}

/** Shared swallow resolution: Maws/F call this only for Devourer copies; the Jaw can also eat other aliens. */
function consume(s: GameState, t: SingularityTrial, m: Maw, e: Enemy) {
  const body = e.type === 'devourer';
  (t.swallows ??= []).push({ x: m.x, y: m.y, ticks: body ? 40 : 24, big: body, fromX: e.x, fromY: e.y, size: body ? TILE_SIZE * .7 : TILE_SIZE * .4 });
  if (body) {
    e.devourer = { ...(e.devourer ?? { generation: 0 }), consumed: true };
    const chain = t.feast && t.feast.ticks > 0 ? Math.min(SC.feastMax, t.feast.count + 1) : 1, heal = SC.bodySwallowHeal * (1 + SC.feastStep * (chain - 1));
    t.feast = { count: chain, ticks: SC.feastWindow };
    healPlayer(s, heal); healCore(s, heal); addStarEnergy(s, SC.feastEnergy * chain);
  }
  else { healPlayer(s, SC.swallowHeal); healCore(s, SC.swallowHeal); addStarEnergy(s, SC.swallowEnergy); }
  if (devourerSoundAllowed(s, 'swallow')) { // swallows in a row share one cooldown
    playAudioOneShot('/sounds/reverse.mp3', body ? .7 : .35, body ? .55 : 1.1);
    if (body) playAudioOneShot('/sounds/celestial/singularity.wav', .45, .6);
  }
  const i = s.enemies.indexOf(e);
  if (i >= 0) { e.hp = 0; killEnemy(s, i, true); }
}

function beginConvergenceMember(s:GameState,t:SingularityTrial,a:NonNullable<SingularityTrial['convergence']>,index:number) {
  const m=a.members[index];if(!m||m.started)return;
  const e=s.enemies.find(e=>e.id===m.id&&e.hp>0);if(!e)return;
  // Capture its live position and size only when its turn actually begins.
  Object.assign(m,{x:e.x,y:e.y,tx:e.tileX,ty:e.tileY,size:Math.floor(TILE_SIZE*ENEMY_CONFIGS.devourer.bodyFraction*devourerBodyScale(e)),started:true});
  const tx=Math.floor(a.x/TILE_SIZE),ty=Math.floor(a.y/TILE_SIZE);
  e.devourer!.merging=true;e.devourer!.landTicks=0;e.devourer!.jumpTicks=undefined;e.singularityPull=undefined;e.path=[];e.shootTicks=0;
  Object.assign(e,{tileX:tx,tileY:ty,targetTileX:tx,targetTileY:ty,x:a.x,y:a.y,stepProgress:0});
  if(t.hook?.id===e.id)t.hook=undefined;
  t.flings=(t.flings??[]).filter(f=>f.id!==e.id);
}

/** One synchronized swarm attack. Existing bodies keep their HP, stacks and identities throughout. */
export function updateConvergence(s: GameState, t: SingularityTrial): boolean {
  const C = SC.convergence;
  if (s.gamePhase !== 'playing') return false;
  if (!t.convergence) {
    t.convergenceTimer ??= C.everyTicks;
    if (--t.convergenceTimer > 0) return false;
    const bodies = s.enemies.filter(e => e.type === 'devourer' && e.hp > 0 && (e.encounterId ?? e.id) === t.encounterId);
    if (bodies.length < 1) { t.convergenceTimer = 60; return false; }
    const rooms = [0,1,2,3], spots = rooms.flatMap(r => freeChamberTiles(s,r));
    const spot = spots[Math.floor(Math.random()*spots.length)];
    if (!spot) { t.convergenceTimer = 60; return false; }
    const [tx,ty] = spot;
    t.convergence = { x:(tx+.5)*TILE_SIZE,y:(ty+.5)*TILE_SIZE,ticks:Math.max(C.gatherTicks,bodies.length*C.bodyTicks),gatherTicks:Math.max(C.gatherTicks,bodies.length*C.bodyTicks),stage:'gather',count:bodies.length,sequential:true,
      members:bodies.map(e=>({id:e.id,x:e.x,y:e.y,tx:e.tileX,ty:e.tileY,size:Math.floor(TILE_SIZE*ENEMY_CONFIGS.devourer.bodyFraction*devourerBodyScale(e))})) };
    t.jaw = undefined;
    beginConvergenceMember(s,t,t.convergence,0);
    playAudioOneShot('/sounds/reverse.mp3',.65,.5);
    return true;
  }
  const a=t.convergence;
  if(a.stage==='gather') {
    const duration=a.gatherTicks??Math.max(C.gatherTicks,a.members.length*C.bodyTicks);
    const index=Math.floor((duration-a.ticks)/(duration/Math.max(1,a.members.length)));
    // Older saved gathers hid every body at once. Restore waiting members before continuing their turns.
    if(!a.sequential){
      for(const [i,m] of a.members.entries()){
        const e=s.enemies.find(e=>e.id===m.id&&e.hp>0);if(!e)continue;
        if(i<=index)m.started=true;
        else{e.devourer!.merging=false;Object.assign(e,{tileX:m.tx,tileY:m.ty,targetTileX:m.tx,targetTileY:m.ty,x:(m.tx+.5)*TILE_SIZE,y:(m.ty+.5)*TILE_SIZE,stepProgress:0});}
      }
      a.sequential=true;
    }
  }
  if (a.stage === 'charge') a.ticks = 0; // resume an older snapshot without its obsolete charge delay
  if (--a.ticks > 0) {
    if(a.stage==='gather') {
      const duration=a.gatherTicks??Math.max(C.gatherTicks,a.members.length*C.bodyTicks),slot=duration/Math.max(1,a.members.length);
      beginConvergenceMember(s,t,a,Math.floor((duration-a.ticks)/slot));
    }
    return a.stage !== 'blast';
  }
  if (a.stage === 'gather' || a.stage === 'charge') {
    const alive=a.members.map(m=>({m,e:s.enemies.find(e=>e.id===m.id&&e.hp>0)})).filter(o=>o.e);
    a.count=alive.length; a.stage='blast';a.ticks=C.blastTicks;
    // Restore the same surviving bodies, at their own floor tiles, with no healing or new offspring.
    for(const {m,e} of alive){
      const b=e!;b.devourer!.merging=false;b.devourer!.landTicks=SINGULARITY_LAND_TICKS;
      Object.assign(b,{tileX:m.tx,tileY:m.ty,targetTileX:m.tx,targetTileY:m.ty,x:(m.tx+.5)*TILE_SIZE,y:(m.ty+.5)*TILE_SIZE,stepProgress:0,path:[]});
      b.singularityPull=undefined;
    }
    t.convergenceTimer=C.everyTicks;
    s.screenShakeTicks=Math.max(s.screenShakeTicks,30);s.screenShakeAmt=Math.max(s.screenShakeAmt,14);
    playAudioOneShot('/sounds/sci-fi-explosion-09.mp3',.9,.65);
    playAudioOneShot('/sounds/meteorExplode.mp3',.45,.75);
    const damage=Math.min(C.maxDamage,Math.ceil(C.maxDamage*a.count/SC.familyCap[t.phase-1]));
    if(damage>0){damagePlayer(s,damage);if(s.gamePhase==='playing')damageRuby(s,Math.ceil(damage*C.rubyShare));}
    return true;
  }
  t.convergence=undefined;return false;
}

/** Pull, consume and hurt: called every tick in the Singularity challenge. */
export function updateSingularityMaws(s: GameState) {
  const t = s.trial?.devourer as SingularityTrial | undefined;
  if (!t || s.gamePhase !== 'playing') return;
  // Cosmetic lifetimes continue even while Convergence suspends the environmental hazards.
  t.swallows = (t.swallows ?? []).filter(w => --w.ticks > 0);
  t.bursts = (t.bursts ?? []).filter(b => --b.ticks > 0);
  t.lands = (t.lands ?? []).filter(l => --l.ticks > 0);
  if (updateConvergence(s, t)) { updateHook(s, t); return; }
  manageMaws(s, t);
  if (t.horizonCooldown && t.horizonCooldown > 0) t.horizonCooldown--;
  if (t.feast && --t.feast.ticks <= 0) t.feast = undefined;
  updateHook(s, t); if (s.gamePhase !== 'playing') return;
  updateJaw(s, t); if (s.gamePhase !== 'playing') return;
  rescueLoneBody(s, t); if (s.gamePhase !== 'playing') return;
  updateGas(s, t);
  updateSouls(s, t);
  for (const m of t.maws ?? []) {
    const surging = mawWindow(m).state === 'open', pulse = surging ? SC.mawOpenPulse : SC.mawPulse;
    const playerRadius = (surging ? SC.playerSwellRadius : SC.playerRadius) * TILE_SIZE, playerPulse = surging ? SC.playerSwellPulse : SC.playerPulse;
    const radius = mawReach(s, m) * TILE_SIZE;
    // Consumption first: Devourer copies only. Other aliens can be pulled but are never eaten here.
    for (const e of [...s.enemies]) {
      if (e.type !== 'devourer' || !swallowable(e) || !s.enemies.includes(e)) continue;
      if (e.tileX === m.tx && e.tileY === m.ty && Math.hypot(e.x - m.x, e.y - m.y) <= TILE_SIZE * .55) { consume(s, t, m, e); if (s.gamePhase !== 'playing') return; }
    }
    // Pull enemies in. Devourer bodies are heavier and are pulled every other pulse; within mawInnerRadius tiles of the
    // centre the pull is mawInnerMult times as frequent.
    for (const e of s.enemies) {
      const d = Math.hypot(e.x - m.x, e.y - m.y);
      if (!swallowable(e) || e.singularityPull || d > radius || held(t, e)) continue;
      const heavy = e.type === 'devourer' || isBossType(e.type), inner = d <= SC.mawInnerRadius * TILE_SIZE;
      const every = Math.max(2, Math.round(pulse * pullWeight(s, e, SC.heavyPulseMult) / (inner ? (heavy ? SC.mawInnerHeavyMult : SC.mawInnerMult) : 1))); // bodies near the centre are sucked in a bit harder
      if ((s.gameTick + e.id) % every !== 0) continue;
      const step = stepToward(s, m, e.targetTileX, e.targetTileY);
      if (step) e.singularityPull = { started: false, dx: step[0], dy: step[1], speed: SC.wellPullSpeed };
    }
    // You are pulled more gently, and the centre throws you back out with a hit.
    const d = Math.hypot(s.playerX - m.x, s.playerY - m.y);
    const playerEvery = d <= SC.mawInnerRadius * TILE_SIZE ? Math.round(playerPulse / SC.playerInnerMult) : playerPulse; // harder to escape near the centre
    if (playerRadius > 0 && d <= playerRadius && s.gameTick % playerEvery === 0 && !s.playerKnockback && s.playerFrozenTicks <= 0) {
      const step = stepToward(s, m, s.playerTargetX, s.playerTargetY);
      if (step) s.playerKnockback = { dirX: step[0], dirY: step[1], started: false, shaken: true };
    }
    if (s.playerTileX === m.tx && s.playerTileY === m.ty && !(t.horizonCooldown! > 0)) {
      t.horizonCooldown = SC.horizonCooldown;
      damagePlayer(s, SC.horizonDamage);
      if (s.gamePhase !== 'playing') return;
      const dirs: [number, number][] = [[s.playerDirX ? -s.playerDirX : 1, s.playerDirX ? 0 : 0], [0, s.playerDirY ? -s.playerDirY : 1], [1, 0], [-1, 0], [0, 1], [0, -1]];
      const out = dirs.find(([x, y]) => (x || y) && isFloorTile(s.map, m.tx + x, m.ty + y));
      if (out) s.playerKnockback = { dirX: out[0], dirY: out[1], started: false, tilesLeft: SC.horizonFling };
      s.screenShakeTicks = Math.max(s.screenShakeTicks, 14); s.screenShakeAmt = Math.max(s.screenShakeAmt, 6);
      playAudioOneShot('/sounds/hitHurt.wav', .6, .6);
    }
  }
}

/** Devourer bodies chasing you fear the Maws: they route around each Maw's reach and never step closer to its centre.
 * Returns the tiles to avoid, or undefined when there are no Maws. (Food they chase anywhere; that path uses no avoider.) */
export function mawAvoider(s: GameState, e: Enemy): ((x: number, y: number) => boolean) | undefined {
  const t = s.trial?.devourer as SingularityTrial | undefined; if (!t?.maws?.length) return undefined;
  const maws = t.maws.map(m => ({ m, from: Math.hypot(e.targetTileX - m.tx, e.targetTileY - m.ty) }));
  return (x, y) => maws.some(({ m, from }) => { const d = Math.hypot(x - m.tx, y - m.ty); return d <= mawReach(s, m) && d < from; });
}

/** The Maw nearest to a point, if any. */
export function nearestMaw(s: GameState, x: number, y: number): Maw | null {
  const t = s.trial?.devourer as SingularityTrial | undefined;
  let best: Maw | null = null, bestD = Infinity;
  for (const m of t?.maws ?? []) { const d = Math.hypot(m.x - x, m.y - y); if (d < bestD) { best = m; bestD = d; } }
  return best;
}

/** A body leaving in a jump (or flung by gas) blasts where it was: damage and a shove to you, and damage to a placed Ruby, within jumpBlast.radius. */
function jumpBlast(s: GameState, x: number, y: number) {
  const J = SC.jumpBlast, r = J.radius * TILE_SIZE;
  s.bombBlasts.push({ cx: x, cy: y, radius: 0, maxRadius: r, ticks: 26, powered: true });
  if (s.rubyTileX !== -1 && !s.playerCarryingRuby && Math.hypot((s.rubyTileX + .5) * TILE_SIZE - x, (s.rubyTileY + .5) * TILE_SIZE - y) <= r) { damageRuby(s, J.rubyDamage); if (s.gamePhase !== 'playing') return; }
  if (Math.hypot(s.playerX - x, s.playerY - y) <= r) {
    damagePlayer(s, J.damage);
    shovePlayerFromEnemy(s, { tileX: Math.floor(x / TILE_SIZE), tileY: Math.floor(y / TILE_SIZE) } as Enemy, J.knock);
  }
}
/** Now and then a copy (not the original, not bursting or newborn) flickers, then bursts and arcs to a random open tile
 * anywhere on the map, away from you. Returns true on the tick it jumps. */
export function bodyJump(s: GameState, e: Enemy): boolean {
  const t = s.trial?.devourer as SingularityTrial | undefined, J = SC.bodyJump, d = e.devourer;
  if (t && d?.landTicks) { // in the air: it waits while its comet climbs and it falls, then lands with an impact
    if (--d.landTicks > 0) return true;
    d.landTicks = undefined; e.healFlashTicks = 26;
    (t.lands ??= []).push({ x: e.x, y: e.y, ticks: SINGULARITY_LAND_FX_TICKS });
    s.screenShakeTicks = Math.max(s.screenShakeTicks, 6); s.screenShakeAmt = Math.max(s.screenShakeAmt, 3);
    if (devourerSoundAllowed(s, 'land')) playAudioOneShot('/sounds/bombExplode.wav', .3, .7);
    return true;
  }
  if (!t || !d || (d.generation ?? 0) === 0 || d.gorgeTicks !== undefined || (d.newbornTicks ?? 0) > 0 || e.singularityPull) return false;
  const every = d.gnasher ? SC.gnasher.everyTicks : J.everyTicks; // a Gnasher jumps more often
  d.jumpTicks ??= every[0] + Math.floor(Math.random() * (every[1] - every[0]));
  if (--d.jumpTicks > 0) { if (d.jumpTicks <= J.warn && d.jumpTicks % 6 === 0) e.flashTicks = 3; return false; } // flickers first
  d.jumpTicks = undefined;
  // With no food in range it usually jumps to land beside a Lost Soul somewhere on the map; otherwise anywhere away from you.
  const souls = s.enemies.filter(o => o.type === 'lost_soul' && o.hp > 0);
  const hungry = souls.length && !souls.some(o => Math.hypot(o.tileX - e.tileX, o.tileY - e.tileY) <= SC.foodRadius) && Math.random() < J.toFoodChance;
  const near = hungry ? (() => { const g = souls[Math.floor(Math.random() * souls.length)]; return [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [g.tileX + dx, g.tileY + dy] as [number, number]).filter(([x, y]) => isFloorTile(s.map, x, y)); })() : [];
  const spots = near.length ? near : [0, 1, 2, 3].flatMap(room => freeChamberTiles(s, room)).filter(([x, y]) => Math.hypot(x - s.playerTileX, y - s.playerTileY) >= J.minFromYou);
  if (!spots.length) return false;
  const [x, y] = spots[Math.floor(Math.random() * spots.length)];
  // It bursts (the burst flash, shockwaves and debris, harmless) and arcs across the map as a green comet to land there.
  const to: [number, number] = [(x + .5) * TILE_SIZE, (y + .5) * TILE_SIZE];
  (t.bursts ??= []).push({ x: e.x, y: e.y, ticks: SINGULARITY_BURST_TICKS, to: [to] });
  jumpBlast(s, e.x, e.y); if (s.gamePhase !== 'playing') return true;
  Object.assign(e, { tileX: x, tileY: y, targetTileX: x, targetTileY: y, x: to[0], y: to[1], stepProgress: 0, path: [], pathTimer: 0 });
  d.landTicks = SINGULARITY_LAND_TICKS;
  if (devourerSoundAllowed(s, 'boom')) playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .35, 1.15);
  return true;
}

// ─── Toxic gas (phase 2+) ────────────────────────────────────────────────────

/** A cloud's strength (0–1): fading in over its first `fade` ticks and out over its last. */
export const gasFade = (g: GasCloud) => Math.max(0, Math.min(1, (g.max - g.ticks) / SC.gas.fade, g.ticks / SC.gas.fade));
/** How deep a point is in the gas (0 outside, up to 1 at a full-strength cloud's centre). */
export function gasDepth(s: Readonly<GameState>, x: number, y: number): number {
  let depth = 0;
  for (const g of s.trial?.devourer?.gas ?? []) {
    const d = Math.hypot(x - g.x, y - g.y) / ((g.r ?? SC.gas.radius) * TILE_SIZE);
    if (d < 1) depth = Math.max(depth, (1 - d * .5) * gasFade(g));
  }
  return depth;
}
/** Your speed multiplier inside the gas. */
export const gasPlayerSlow = (s: Readonly<GameState>) => gasDepth(s, s.playerX, s.playerY) > 0 ? SC.gas.slow : 1;
/** A Devourer that touches the gas bursts at once. With stacks it explodes into its copies (one per two stacks, the
 * original one per stack), like a full body; with none it bursts and is flung to a random spot elsewhere, clear of gas
 * and away from you. Hooked and thrown bodies pass through. */
function gasBursts(s: GameState, t: SingularityTrial) {
  for (const e of s.enemies.filter(x => x.type === 'devourer' && x.hp > 0 && !held(t, x) && !x.singularityPull && gasDepth(s, x.x, x.y) > .3)) { // a cloud still fading in does not burst them yet
    if (!s.enemies.includes(e)) continue;
    if (e.chargeDirX > 0) { explodeDevourer(s, e); if (s.gamePhase !== 'playing') return; continue; }
    const spots = [0, 1, 2, 3].flatMap(room => freeChamberTiles(s, room)).filter(([x, y]) => Math.hypot(x - s.playerTileX, y - s.playerTileY) >= SC.gas.minFromYou && gasDepth(s, (x + .5) * TILE_SIZE, (y + .5) * TILE_SIZE) === 0);
    if (!spots.length) continue;
    const [x, y] = spots[Math.floor(Math.random() * spots.length)], to: [number, number] = [(x + .5) * TILE_SIZE, (y + .5) * TILE_SIZE];
    (t.bursts ??= []).push({ x: e.x, y: e.y, ticks: SINGULARITY_BURST_TICKS, to: [to] });
    jumpBlast(s, e.x, e.y); if (s.gamePhase !== 'playing') return;
    Object.assign(e, { tileX: x, tileY: y, targetTileX: x, targetTileY: y, x: to[0], y: to[1], stepProgress: 0, path: [], pathTimer: 0 });
    if (e.devourer) e.devourer.landTicks = SINGULARITY_LAND_TICKS;
    if (devourerSoundAllowed(s, 'boom')) playAudioOneShot('/sounds/sci-fi-explosion-09.mp3', .45, 1.1);
  }
}
function newCloud(s: GameState): GasCloud | null {
  const spots = [0, 1, 2, 3].flatMap(room => freeChamberTiles(s, room)).filter(([x, y]) => Math.hypot(x - s.playerTileX, y - s.playerTileY) >= SC.gas.minFromYou);
  if (!spots.length) return null;
  const [tx, ty] = spots[Math.floor(Math.random() * spots.length)], a = Math.random() * Math.PI * 2, life = SC.gas.lifeTicks[0] + Math.floor(Math.random() * (SC.gas.lifeTicks[1] - SC.gas.lifeTicks[0]));
  return { x: (tx + .5) * TILE_SIZE, y: (ty + .5) * TILE_SIZE, vx: Math.cos(a) * SC.gas.speed, vy: Math.sin(a) * SC.gas.speed, ticks: life, max: life, seed: Math.random() * 100 };
}
/** Clouds drift slowly, turning a little and bouncing off walls; each fades out at the end of its life and a new one
 * forms somewhere else, away from you. */
function updateGas(s: GameState, t: SingularityTrial) {
  if (t.phase < SC.gas.fromPhase) { t.gas = (t.gas ?? []).filter(g => g.still); if (!t.gas.length) return; } // phase 1: only Contaminated Soulless clouds
  const gas = t.gas ??= [];
  for (const g of [...gas]) {
    if (--g.ticks <= 0) { gas.splice(gas.indexOf(g), 1); continue; }
    if (g.still) continue; // a Contaminated Soulless cloud stays where it fell
    const turn = Math.sin(s.gameTick * .01 + g.seed) * .004, c = Math.cos(turn), sn = Math.sin(turn);
    [g.vx, g.vy] = [g.vx * c - g.vy * sn, g.vx * sn + g.vy * c];
    const nx = g.x + g.vx, ny = g.y + g.vy;
    if (!isFloorTile(s.map, Math.floor(nx / TILE_SIZE), Math.floor(g.y / TILE_SIZE))) g.vx = -g.vx; else g.x = nx;
    if (!isFloorTile(s.map, Math.floor(g.x / TILE_SIZE), Math.floor(ny / TILE_SIZE))) g.vy = -g.vy; else g.y = ny;
  }
  while (t.phase >= SC.gas.fromPhase && gas.filter(g => !g.still).length < SC.gas.count) { const g = newCloud(s); if (!g) break; gas.push(g); }
  gasBursts(s, t);
}

/** A Contaminated Soulless died: it leaves a still, larger gas cloud on its spot for a while. */
export function toxicSoullessCloud(s: GameState, e: Enemy) {
  const t = s.trial?.devourer as SingularityTrial | undefined; if (!t) return;
  (t.gas ??= []).push({ x: (e.tileX + .5) * TILE_SIZE, y: (e.tileY + .5) * TILE_SIZE, vx: 0, vy: 0, ticks: SC.soulless.cloudTicks, max: SC.soulless.cloudTicks, seed: Math.random() * 100, r: SC.soulless.cloudRadius, still: true });
  if (devourerSoundAllowed(s, 'toxic')) playAudioOneShot('/sounds/poisoned.wav', .45, .8);
}

// ─── Spreading out ───────────────────────────────────────────────────────────

/** A body on or next to another body: the free adjacent floor tile that takes it furthest from its neighbours, or null
 * when it is not crowded, food is within two tiles, or no step helps. */
export function bodySpreadStep(s: GameState, e: Enemy): [number, number] | null {
  const t = s.trial?.devourer as SingularityTrial | undefined; if (!t) return null;
  const others = s.enemies.filter(o => o !== e && hookable(o) && !held(t, o));
  const crowd = others.filter(o => Math.max(Math.abs(o.tileX - e.tileX), Math.abs(o.tileY - e.tileY)) <= 1);
  if (!crowd.length) return null;
  if (s.enemies.some(o => o.type === 'lost_soul' && o.hp > 0 && Math.hypot(o.tileX - e.tileX, o.tileY - e.tileY) <= 2)) return null; // food right there: eat it
  const spacing = (x: number, y: number) => Math.min(...crowd.map(o => Math.hypot(o.tileX - x, o.tileY - y)));
  const here = spacing(e.tileX, e.tileY);
  const best = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [e.tileX + dx, e.tileY + dy] as [number, number])
    .filter(([x, y]) => isFloorTile(s.map, x, y) && !others.some(o => o.tileX === x && o.tileY === y))
    .map(p => [p, spacing(p[0], p[1])] as const).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > here ? best[0] : null;
}

// ─── Gnasher (phase 3) ───────────────────────────────────────────────────────

/** Whether a new copy should be a Gnasher: phase 3, by chance, and fewer than max alive. */
export function rollGnasher(s: GameState): boolean {
  const t = s.trial?.devourer as SingularityTrial | undefined, G = SC.gnasher;
  if (!t || t.phase < G.fromPhase || Math.random() >= G.chance) return false;
  return s.enemies.filter(e => e.type === 'devourer' && e.hp > 0 && e.devourer?.gnasher).length < G.max;
}
const biteable = (t: SingularityTrial, g: Enemy, o: Enemy) => o !== g && o.type === 'devourer' && o.hp > 0 && !o.devourer?.consumed && (o.devourer?.generation ?? 0) > 0 && o.devourer?.gorgeTicks === undefined && !o.devourer?.gnasher && !held(t, o);
/** The nearest body a ready Gnasher goes after, within seek tiles. */
export function gnasherPrey(s: GameState, g: Enemy): Enemy | undefined {
  const t = s.trial?.devourer as SingularityTrial | undefined; if (!t) return undefined;
  return s.enemies.filter(o => biteable(t, g, o) && Math.hypot(o.tileX - g.tileX, o.tileY - g.tileY) <= SC.gnasher.seek)
    .sort((a, b) => Math.hypot(a.x - g.x, a.y - g.y) - Math.hypot(b.x - g.x, b.y - g.y))[0];
}
/** A ready Gnasher bites a body within reach: with stacks it bursts at once with twice its stacks; with none it splits
 * into two. */
export function gnasherBite(s: GameState, g: Enemy) {
  const t = s.trial?.devourer as SingularityTrial | undefined, d = g.devourer; if (!t || !d) return;
  if ((d.biteTicks ?? 0) > 0) { d.biteTicks!--; return; }
  const victim = s.enemies.find(o => biteable(t, g, o) && Math.hypot(o.x - g.x, o.y - g.y) <= SC.gnasher.reach * TILE_SIZE);
  if (!victim) return;
  d.biteTicks = SC.gnasher.biteTicks; g.shootTicks = 16;
  s.laserBeams.push({ fromX: g.x, fromY: g.y, dirX: 0, dirY: 0, endX: victim.x, endY: victim.y, ticks: 20, color: '#6b2fa8' });
  if (devourerSoundAllowed(s, 'gnash')) playAudioOneShot('/sounds/slash.mp3', .55, .7);
  if (victim.chargeDirX > 0) { victim.chargeDirX *= 2; explodeDevourer(s, victim); }
  else { splitBody(s, victim); }
}

/** So a phase never ends too fast: in its first loneBodyTicks, if only one body is left and it is not already bursting, it
 * bursts at once with the phase's full stacks (one copy per stack). */
function rescueLoneBody(s: GameState, t: SingularityTrial) {
  if (s.gameTick - (t.phaseStartTick ?? s.gameTick) > SC.loneBodyTicks) return;
  const bodies = s.enemies.filter(e => e.type === 'devourer' && e.hp > 0 && !e.devourer?.consumed && (e.encounterId ?? e.id) === t.encounterId);
  if (bodies.length !== 1) return;
  const e = bodies[0];
  if (e.devourer?.gorgeTicks !== undefined || held(t, e)) return; // already bursting, or in your hands
  e.chargeDirX = phaseStacks(t.phase); explodeDevourer(s, e);
}

// ─── The Jaw ─────────────────────────────────────────────────────────────────

/** Now and then a jaw rises under you: its area is marked, then it closes on its centre from all four sides. Caught, you
 * are hurt, thrown far to the other side of its centre and stunned when you land. */
const JAW_SOUND_LEAD = 11; // ticks: the bite sound's crunch comes about 0.19 s in at 1.35× pitch
function updateJaw(s: GameState, t: SingularityTrial) {
  const J = SC.jaw;
  if (t.jaw) {
    const jaw = t.jaw;
    if (jaw.ticks > 0) {
      // The supplied monster bite, trimmed to start at once and pitched up; started early so its crunch lands on the snap.
      if (jaw.ticks === JAW_SOUND_LEAD) playAudioOneShot('/sounds/jaw-bite.wav', 1.6, 1.35);
      if (--jaw.ticks === 0) bite(s, t, jaw);
    }
    else if (--jaw.snap <= 0) t.jaw = undefined;
    return;
  }
  t.jawTimer ??= J.firstTicks;
  if (--t.jawTimer > 0) return;
  const every = t.phase >= 2 ? J.everyTicksLate : J.everyTicks; // more often from phase 2
  t.jawTimer = every[0] + Math.floor(Math.random() * (every[1] - every[0]));
  t.jaw = { tx: s.playerTileX, ty: s.playerTileY, ticks: J.warn, snap: J.snap };
  playAudioOneShot('/sounds/charging.wav', .4, .5);
}
function bite(s: GameState, t: SingularityTrial, jaw: NonNullable<SingularityTrial['jaw']>) {
  const J = SC.jaw, dx = s.playerTileX - jaw.tx, dy = s.playerTileY - jaw.ty;
  // It swallows every enemy caught in it, like a Maw (Devourer copies, Soulless, Lost Souls), but never the original.
  const centre = { x: (jaw.tx + .5) * TILE_SIZE, y: (jaw.ty + .5) * TILE_SIZE } as Maw;
  for (const e of s.enemies.filter(o => consumable(o) && !held(t, o) && !(o.type === 'devourer' && (o.devourer?.generation ?? 0) === 0) && Math.abs(o.tileX - jaw.tx) <= J.radius && Math.abs(o.tileY - jaw.ty) <= J.radius)) {
    if (!s.enemies.includes(e)) continue; consume(s, t, centre, e); if (s.gamePhase !== 'playing') return;
  }
  s.screenShakeTicks = Math.max(s.screenShakeTicks, 10); s.screenShakeAmt = Math.max(s.screenShakeAmt, 6);
  if (Math.abs(dx) > J.radius || Math.abs(dy) > J.radius) return; // stepped out: it bites empty air
  jaw.hit = true; damagePlayer(s, J.damage); if (s.gamePhase !== 'playing') return;
  // Thrown across to the other side of its centre, along the axis you are further off it on (left → right, above → down);
  // dead centre, back the way you face.
  const horizontal = dx || dy ? Math.abs(dx) >= Math.abs(dy) : Math.abs(s.playerDirX) >= Math.abs(s.playerDirY);
  const kx = horizontal ? (dx ? -Math.sign(dx) : -Math.sign(s.playerDirX) || 1) : 0, ky = horizontal ? 0 : (dy ? -Math.sign(dy) : -Math.sign(s.playerDirY) || 1);
  s.playerKnockback = { dirX: kx, dirY: ky, started: false, tilesLeft: J.knock + Math.abs(horizontal ? dx : dy), shaken: true, speedMult: J.knockSpeedMult };
  playAudioOneShot('/sounds/hitHurt.wav', .55, .7);
}

// ─── Gravity Hook (C) ─────────────────────────────────────────────────────────

const hooked = (t: SingularityTrial, e: Enemy) => t.hook?.id === e.id || !!t.flings?.some(f => f.id === e.id);
/** Out of everything else's reach: hooked, thrown, or in the air after a jump or burst. */
const held = (t: SingularityTrial, e: Enemy) => !!e.devourer?.merging || hooked(t, e) || !!e.devourer?.landTicks;
/** A body that can be hooked: a living copy (not the original). */
const hookable = (e: Enemy) => !e.devourer?.merging && e.hp > 0 && !e.devourer?.consumed && !e.devourer?.landTicks && (e.type === 'devourer' ? (e.devourer?.generation ?? 0) > 0 : !isBossType(e.type) && e.type !== 'aegis_construct'); // not mid-jump; a bursting copy too: its fuse keeps burning
/** The body the hook would catch now: the nearest hookable body within range and in sight. */
export function hookTarget(s: GameState): Enemy | undefined {
  const t = s.trial?.devourer; if (!t || t.hook || (t.hookCooldown ?? 0) > 0) return undefined;
  return s.enemies.filter(e => hookable(e) && !held(t, e) && Math.hypot(e.tileX - s.playerTileX, e.tileY - s.playerTileY) <= SC.hook.range
    && hasLineOfSight(s.map, s.playerTileX, s.playerTileY, e.tileX, e.tileY))
    .sort((a, b) => Math.hypot(a.x - s.playerX, a.y - s.playerY) - Math.hypot(b.x - s.playerX, b.y - s.playerY))[0];
}
/** The engine asks whether a body's own AI should wait: held, in flight, or stunned by a slam. Counts the stun down. */
export function singularityHeld(s: GameState, e: Enemy): boolean {
  const t = s.trial?.devourer; if (!t) return false;
  if (hooked(t, e)) return true;
  if ((e.devourer?.stunTicks ?? 0) > 0) { e.devourer!.stunTicks!--; return true; }
  return false;
}
/** C down: latch onto the nearest body. */
export function pressGravityHook(s: GameState): boolean {
  const t = s.trial?.devourer; if (!t || s.gamePhase !== 'playing') return false;
  const e = hookTarget(s); if (!e) return false;
  t.hook = { id: e.id, ticks: 0 }; e.path = []; e.pathTimer = 0; e.boneLunge = undefined;
  if (e.devourer) e.devourer.jumpTicks = undefined; // a hooked body never jumps: a pending jump is cancelled and its timer starts over
  (t.hookFx ??= []).push({ x: e.x, y: e.y, ticks: 20, kind: 'latch' });
  playAudioOneShot('/sounds/jupiter-fence-cast.wav', .35, 1.3);
  return true;
}
/** Auto-aim: the Maw (preferred) or other body within throwing range closest to the way you face, within aimCone. */
function hookAim(s: GameState, t: SingularityTrial, held: Enemy, fx: number, fy: number): [number, number] | null {
  const px = s.playerTileX, py = s.playerTileY, cos = Math.cos(SC.hook.aimCone * Math.PI / 180), reach = SC.hook.fling + 1;
  const score = (x: number, y: number, bonus: number) => { const dx = x - px, dy = y - py, d = Math.hypot(dx, dy); if (!d || d > reach) return -1; const c = (dx * fx + dy * fy) / d; return c >= cos ? c + bonus : -1; };
  const options = [...(t.maws ?? []).map(m => [m.tx, m.ty, score(m.tx, m.ty, 1)] as const),
    ...s.enemies.filter(o => o !== held && hookable(o)).map(o => [o.tileX, o.tileY, score(o.tileX, o.tileY, 0)] as const)].filter(o => o[2] >= 0).sort((a, b) => b[2] - a[2]);
  return options.length ? [options[0][0], options[0][1]] : null;
}
/** C up (or the hold runs out): the body is drawn into your hands and thrown the way you face, bending toward a Maw or
 * body near that line. */
export function releaseGravityHook(s: GameState) {
  const t = s.trial?.devourer; if (!t?.hook) return;
  const e = s.enemies.find(x => x.id === t.hook!.id); t.hook = undefined; t.hookCooldown = SC.hook.cooldown;
  if (!e || e.hp <= 0) return;
  const len = Math.hypot(s.playerDirX, s.playerDirY), fx = len ? s.playerDirX / len : 1, fy = len ? s.playerDirY / len : 0;
  const px = s.playerTileX, py = s.playerTileY;
  Object.assign(e, { tileX: px, tileY: py, targetTileX: px, targetTileY: py, x: (px + .5) * TILE_SIZE, y: (py + .5) * TILE_SIZE, stepProgress: 0, path: [], singularityPull: undefined });
  const aim = hookAim(s, t, e, fx, fy), [ax, ay] = aim ?? [px + Math.round(fx * SC.hook.fling), py + Math.round(fy * SC.hook.fling)];
  (t.flings ??= []).push({ id: e.id, ax, ay, dx: 0, dy: 0, left: Math.abs(ax - px) + Math.abs(ay - py) + (aim ? 2 : 0), moved: 0 });
  playAudioOneShot('/sounds/speedBoost.mp3', .35, 1.4);
}
function stun(e: Enemy, ticks: number) { e.devourer = { ...(e.devourer ?? { generation: 0 }), stunTicks: Math.max(e.devourer?.stunTicks ?? 0, ticks) }; e.flashTicks = 10; }
function updateHook(s: GameState, t: SingularityTrial) {
  if ((t.hookCooldown ?? 0) > 0 && --t.hookCooldown! === 0 && devourerSoundAllowed(s, 'ready')) playAudioOneShot('/sounds/celestial/skill-ready.wav', .9, 1.1);
  t.hookFx = (t.hookFx ?? []).filter(f => --f.ticks > 0);
  // Towing: the held body trails you, a step at a time, never closer than towGap tiles.
  if (t.hook) {
    const e = s.enemies.find(x => x.id === t.hook!.id);
    if (!e || e.hp <= 0) { t.hook = undefined; t.hookCooldown = SC.hook.cooldown; }
    else if (++t.hook.ticks >= SC.hook.maxTicks) releaseGravityHook(s);
    else if (!e.singularityPull && Math.hypot(e.x - s.playerX, e.y - s.playerY) > SC.hook.towGap * TILE_SIZE) {
      const step = stepToward(s, { tx: s.playerTileX, ty: s.playerTileY }, e.targetTileX, e.targetTileY);
      if (step) e.singularityPull = { started: false, dx: step[0], dy: step[1], speed: SC.hook.towSpeed };
    }
  }
  // Flying bodies: one tile at a time until they reach a Maw, hit a body or a wall, or run out of tiles.
  for (const f of [...(t.flings ?? [])]) {
    const e = s.enemies.find(x => x.id === f.id), end = () => t.flings!.splice(t.flings!.indexOf(f), 1);
    if (!e || e.hp <= 0) { end(); continue; }
    // A thrown body is swallowed as soon as it enters F's inner reach, even mid-step.
    const field = s.singularity;
    if (e.type === 'devourer' && field && field.ticks > 0 && Math.hypot(e.x - field.x, e.y - field.y) <= SC.mawInnerRadius * TILE_SIZE) {
      end(); consume(s, t, { x: field.x, y: field.y } as Maw, e);
      if (s.gamePhase !== 'playing') return;
      continue;
    }
    if (e.singularityPull) continue; // still mid-step
    const maw = (t.maws ?? []).find(m => Math.hypot(e.tileX - m.tx, e.tileY - m.ty) <= SC.mawInnerRadius);
    if (maw && e.type === 'devourer') { end(); consume(s, t, maw, e); if (s.gamePhase !== 'playing') return; continue; }
    const other = f.moved > 0 && s.enemies.find(o => o !== e && hookable(o) && !held(t, o) && Math.max(Math.abs(o.tileX - e.tileX), Math.abs(o.tileY - e.tileY)) <= 1);
    if (other) {
      end(); (t.hookFx ??= []).push({ x: (e.x + other.x) / 2, y: (e.y + other.y) / 2, ticks: 40, kind: 'slam' });
      s.screenShakeTicks = Math.max(s.screenShakeTicks, 12); s.screenShakeAmt = Math.max(s.screenShakeAmt, 7);
      if (devourerSoundAllowed(s, 'hit')) { playAudioOneShot('/sounds/hitHurt.wav', .5, .8); playAudioOneShot('/sounds/bombExplode.wav', .25, 1.2); }
      stun(e, SC.hook.slamStun); stun(other, SC.hook.slamStun);
      continue;
    }
    // Step toward the aimed tile along its longer axis (a staircase for a diagonal throw).
    const rx = f.ax - e.tileX, ry = f.ay - e.tileY;
    if (f.left <= 0 || (!rx && !ry)) { end(); stun(e, SC.hook.endStun); continue; }
    const axes: [number, number][] = Math.abs(rx) >= Math.abs(ry) ? [[Math.sign(rx), 0], [0, Math.sign(ry)]] : [[0, Math.sign(ry)], [Math.sign(rx), 0]];
    [f.dx, f.dy] = axes.find(([dx, dy]) => (dx || dy) && isFloorTile(s.map, e.tileX + dx, e.tileY + dy)) ?? axes[0];
    if (!isFloorTile(s.map, e.tileX + f.dx, e.tileY + f.dy)) {
      end(); (t.hookFx ??= []).push({ x: e.x + f.dx * TILE_SIZE / 2, y: e.y + f.dy * TILE_SIZE / 2, ticks: 22, kind: 'wall' });
      if (devourerSoundAllowed(s, 'hit')) playAudioOneShot('/sounds/hitHurt.wav', .4, .9);
      stun(e, SC.hook.wallStun); continue;
    }
    f.left--; f.moved++; e.singularityPull = { started: false, dx: f.dx, dy: f.dy, speed: SC.hook.flingSpeed };
  }
}

/** Lost Souls: harmless one-hit wanderers, topped up to a cap. Each is announced first: a sign marks its tile on the
 * floor and minimap for soulWarnTicks, then the soul appears there. The swarm eats them; the Maw leaves them alone. */
function updateSouls(s: GameState, t: SingularityTrial) {
  if (s.noMobs) { t.soulSigns = []; return; }
  const signs = t.soulSigns ??= [];
  const count = () => s.enemies.filter(e => e.type === 'lost_soul' && e.hp > 0).length + signs.filter(g => !g.hollow).length;
  if (t.soulTimer === undefined) { t.soulTimer = SC.soulSpawnTicks; for (let i = 0; i < SC.soulStart; i++) announceSoul(s, t); }
  if (--t.soulTimer <= 0) { t.soulTimer = SC.soulSpawnTicks; if (count() < SC.soulCap) announceSoul(s, t); }
  // Soulless: one more every everyTicks, up to the phase's cap (living or announced).
  const hollow = s.enemies.filter(e => (e.type === 'soulless' || e.type === 'toxic_soulless') && e.hp > 0).length + signs.filter(g => g.hollow).length;
  t.soullessTimer ??= SC.soulless.everyTicks;
  if (--t.soullessTimer <= 0) { t.soullessTimer = SC.soulless.everyTicks; if (hollow < SC.soulless.cap[t.phase - 1]) announceSoul(s, t, true); }
  for (const sign of [...signs]) if (--sign.ticks <= 0) { signs.splice(signs.indexOf(sign), 1); spawnSoul(s, sign); }
}
// A free floor tile anywhere on the map, away from you, for the next soul; its sign appears at once.
function announceSoul(s: GameState, t: SingularityTrial, hollow = false) {
  const taken = (x: number, y: number) => (t.soulSigns ?? []).some(o => o.tx === x && o.ty === y);
  const tiles = [0, 1, 2, 3].flatMap(r => freeChamberTiles(s, r)).filter(([x, y]) => !taken(x, y) && Math.hypot(x - s.playerTileX, y - s.playerTileY) >= 3);
  if (!tiles.length) return;
  const [tx, ty] = tiles[Math.floor(Math.random() * tiles.length)];
  (t.soulSigns ??= []).push(hollow ? { tx, ty, ticks: SC.soulWarnTicks, golden: false, hollow: true, toxic: t.phase >= SC.soulless.toxicFromPhase && Math.random() < SC.soulless.toxicChance } : { tx, ty, ticks: SC.soulWarnTicks, golden: t.phase >= SC.goldenFromPhase && Math.random() < SC.goldenChance });
}
function spawnSoul(s: GameState, sign: SoulSign) {
  const free = (x: number, y: number) => isFloorTile(s.map, x, y) && !s.enemies.some(e => e.hp > 0 && e.tileX === x && e.tileY === y);
  const spot = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [sign.tx + dx, sign.ty + dy]).find(([x, y]) => free(x, y));
  if (!spot) return;
  if (sign.hollow) { const husk = createEncounterEnemy(s, sign.toxic ? 'toxic_soulless' : 'soulless', spot[0], spot[1], SC.soulless.hp); husk.visualSpawnTicks = 30; s.enemies.push(husk); return; }
  const soul = createEncounterEnemy(s, 'lost_soul', spot[0], spot[1], SC.soulHP);
  soul.windupTicks = Math.floor(Math.random() * SC.soulWander); soul.visualSpawnTicks = 30;
  if (sign.golden) soul.goldenSoul = true; // phase 2+: some souls are golden
  s.enemies.push(soul);
}
/** You, if you are within soulFleeRadius tiles of a soul. */
function soulThreat(s: GameState, e: Enemy): [number, number] | null {
  const threats: [number, number][] = [[s.playerTileX, s.playerTileY]]; // only you: the swarm can run a soul down
  const near = threats.map(p => [p, Math.hypot(p[0] - e.tileX, p[1] - e.tileY)] as const).filter(([, d]) => d <= SC.soulFleeRadius).sort((a, b) => a[1] - b[1])[0];
  return near ? near[0] : null;
}
/** A Lost Soul drifts one tile at a time within its chamber, pausing between steps, and runs from you when you come
 * close (any floor, at soulFleeSpeed). It never attacks. */
export function updateLostSoul(s: GameState, e: Enemy) {
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    const threat = soulThreat(s, e);
    if (threat) {
      const away = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => isFloorTile(s.map, e.tileX + dx, e.tileY + dy))
        .map(([dx, dy]) => [dx, dy, Math.hypot(e.tileX + dx - threat[0], e.tileY + dy - threat[1])] as const).sort((a, b) => b[2] - a[2])[0];
      if (away && away[2] > Math.hypot(e.tileX - threat[0], e.tileY - threat[1])) { e.targetTileX = e.tileX + away[0]; e.targetTileY = e.tileY + away[1]; e.stepProgress = 0; e.windupTicks = 6; return; }
    }
    if (--e.windupTicks > 0) return;
    e.windupTicks = SC.soulWander + Math.floor(Math.random() * SC.soulWander);
    const room = chamberOfTile(e.tileX, e.tileY);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => isFloorTile(s.map, e.tileX + dx, e.tileY + dy) && chamberOfTile(e.tileX + dx, e.tileY + dy) === room);
    if (dirs.length) { const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)]; e.targetTileX = e.tileX + dx; e.targetTileY = e.tileY + dy; e.stepProgress = 0; }
    return;
  }
  e.stepProgress += soulThreat(s, e) ? (e.goldenSoul ? SC.goldenFleeSpeed : SC.soulFleeSpeed) : SC.soulSpeed; // a Golden Soul runs faster
  const dx = e.targetTileX - e.tileX, dy = e.targetTileY - e.tileY, p = Math.min(e.stepProgress, TILE_SIZE);
  e.x = (e.tileX + .5) * TILE_SIZE + dx * p; e.y = (e.tileY + .5) * TILE_SIZE + dy * p;
  if (e.stepProgress >= TILE_SIZE) { e.tileX = e.targetTileX; e.tileY = e.targetTileY; e.stepProgress = 0; }
}

export function clearSingularityMaws(s: GameState) {
  const t = s.trial?.devourer as SingularityTrial | undefined; if (!t) return;
  t.convergence = undefined; t.convergenceTimer = SC.convergence.everyTicks;
  for (const e of s.enemies) if (e.devourer) e.devourer.merging = false;
  t.soullessTimer = undefined; t.hook = undefined; t.hookCooldown = 0; t.flings = []; t.hookFx = []; t.feast = undefined; t.jaw = undefined; t.jawTimer = undefined; t.gas = []; t.swallows = []; t.bursts = []; t.soulSigns = [];
}
export const mawRoomOf = (m: Maw) => chamberOfTile(m.tx, m.ty);
