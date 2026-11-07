// Regular alien AI with its own behaviour: Sniper, Lancer, Healer, Charger, Ghost and Shielder.
// Ordinary melee chasers (Normal, Armored, Runner, Bomber, Splitter, Leech and challenge melee units)
// still use the shared chase in engine.ts. The engine calls in through updateRegularAlien; like the
// challenge modules, this file imports engine helpers and must only use them inside functions.
import {
  ALIEN_KNOCKBACK, CHARGER_CHARGE_SPEED, CHARGER_KNOCKBACK, CHARGER_CHARGE_TILES, CHARGER_SIGHT_RANGE, CHARGER_STUN_TICKS, CHARGER_WINDUP_TICKS,
  ENCHANTER, IMPOSTOR, SHOOTER, SNATCHER, ENEMY_CONFIGS, HEALER_HEAL_AMOUNT, HEALER_HEAL_INTERVAL, HEALER_HEAL_RADIUS, LANCER, MAP_COLS, MAP_ROWS,
  SHIELDER_SHIELD_RANGE, SNIPER_ATTACK_RANGE, SNIPER_WINDUP_TICKS, TILE_SIZE, T_WALL, isBossType,
} from './constants';
import {
  ALIEN_ATTACK_SFX, ATTACK_SFX_VOLUME, bfs, playSFX_special, celestialMoveMultiplier, damagePlayer, damageRuby, hasLineOfSight, isFloorTile, playAudioOneShot,
  playSFX_alienShoot, playSFX_chargerImpact, playSFX_enemyAttack, playSFX_laser, playSFX_placeBomb, shovePlayerFromEnemy,
  tileDist, tileEuclidDist, type Enemy, type GameState,
} from './engine';
import { gameAudio } from './audio-settings';

/** Advances one step toward the alien's target tile. Returns true on the tick it arrives. */
export function stepEnemy(state: GameState, e: Enemy, speed: number) {
  e.stepProgress += speed * celestialMoveMultiplier(state, e);
  const dx = e.targetTileX - e.tileX, dy = e.targetTileY - e.tileY;
  e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2 + dx * Math.min(e.stepProgress, TILE_SIZE);
  e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2 + dy * Math.min(e.stepProgress, TILE_SIZE);
  if (e.stepProgress < TILE_SIZE) return false;
  e.tileX = e.targetTileX; e.tileY = e.targetTileY;
  e.x = e.tileX * TILE_SIZE + TILE_SIZE / 2; e.y = e.tileY * TILE_SIZE + TILE_SIZE / 2;
  e.stepProgress = 0;
  return true;
}

/** Walks along a BFS path toward (tx, ty), re-pathing every `repath` + random(`jitter`) ticks. */
export function walkPath(state: GameState, e: Enemy, tx: number, ty: number, speed: number, repath = 25, jitter = 15) {
  e.pathTimer--;
  if (e.pathTimer <= 0) { e.path = bfs(state.map, e.targetTileX, e.targetTileY, tx, ty); e.pathTimer = repath + Math.floor(Math.random() * jitter); }
  if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
    if (!e.path.length) return;
    const [ntx, nty] = e.path.shift()!;
    if (isFloorTile(state.map, ntx, nty)) { e.targetTileX = ntx; e.targetTileY = nty; e.stepProgress = 0; }
  } else stepEnemy(state, e, speed);
}

/** Player, or a placed Ruby that is clearly closer (more than two tiles). Carrying always means the player. */
function pickTarget(state: GameState, e: Enemy, playerCarrying: boolean) {
  if (playerCarrying || state.rubyTileX === -1) e.targeting = 'player';
  else e.targeting = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) + 2 ? 'player' : 'ruby';
  return e.targeting === 'player' ? { tx: state.playerTileX, ty: state.playerTileY } : { tx: state.rubyTileX, ty: state.rubyTileY };
}

/** Runs the alien's own AI and returns true, or returns false for aliens that use the shared chase. */
export function updateRegularAlien(state: GameState, e: Enemy, playerCarrying: boolean) {
  switch (e.type) {
    case 'sniper': updateSniper(state, e, playerCarrying); return true;
    case 'lancer': updateLancer(state, e, playerCarrying); return true;
    case 'healer': updateHealer(state, e); return true;
    case 'charger': updateCharger(state, e); return true;
    case 'ghost': updateGhost(state, e, playerCarrying); return true;
    case 'shielder': updateShielder(state, e); return true;
    case 'enchanter': updateEnchanter(state, e); return true;
    case 'snatcher': updateSnatcher(state, e); return true;
    case 'impostor': updateImpostor(state, e); return true;
    case 'shooter': updateShooter(state, e); return true;
    default: return false;
  }
}

// ── Sniper: stops in range with line of sight, telegraphs, then fires a long shot ──
function fireSniperLaser(state: GameState, e: Enemy) {
  const tgtX = e.targeting === 'player' ? state.playerX : state.rubyTileX * TILE_SIZE + TILE_SIZE / 2;
  const tgtY = e.targeting === 'player' ? state.playerY : state.rubyTileY * TILE_SIZE + TILE_SIZE / 2;
  state.laserBeams.push({ fromX: e.x, fromY: e.y, dirX: 0, dirY: 0, endX: tgtX, endY: tgtY, ticks: 22, color: '#ff3300' });
  if (e.targeting === 'player') damagePlayer(state, ENEMY_CONFIGS.sniper.damageToPlayer, e);
  else if (state.rubyTileX !== -1) damageRuby(state, ENEMY_CONFIGS.sniper.damageToRuby, e);
  e.shootTicks = 22;
  e.attackTimer = ENEMY_CONFIGS.sniper.attackCooldown;
  playSFX_laser(ALIEN_ATTACK_SFX.laser);
}

function updateSniper(state: GameState, e: Enemy, playerCarrying: boolean) {
  const { tx, ty } = pickTarget(state, e, playerCarrying);
  const dist = tileEuclidDist(e.tileX, e.tileY, tx, ty), los = hasLineOfSight(state.map, e.tileX, e.tileY, tx, ty);
  if (e.windupTicks > 0) {
    // Losing line of sight or range cancels the shot.
    if (!los || dist > SNIPER_ATTACK_RANGE) e.windupTicks = 0;
    else if (--e.windupTicks === 0) fireSniperLaser(state, e);
    return;
  }
  if (e.attackTimer > 0) e.attackTimer--;
  if (e.attackTimer === 0 && dist <= SNIPER_ATTACK_RANGE && los) { e.windupTicks = SNIPER_WINDUP_TICKS; return; }
  if (dist > SNIPER_ATTACK_RANGE) walkPath(state, e, tx, ty, ENEMY_CONFIGS.sniper.speed);
}

// ── Lancer: walks into a clear line, locks aim with a visible warning line, then fires a beam that walls stop ──
/** Where a Lancer's locked beam ends: its attack range, or the first wall along the line. In tiles. */
export function lancerBeamEnd(state: GameState, e: Enemy) {
  const ox = e.x / TILE_SIZE, oy = e.y / TILE_SIZE, dx = e.lanceDirX ?? 0, dy = e.lanceDirY ?? 0;
  const range = ENEMY_CONFIGS.lancer.attackRange, step = .05;
  let t = 0;
  while (t + step <= range) {
    const nx = ox + dx * (t + step), ny = oy + dy * (t + step);
    if ((state.map[Math.floor(ny)]?.[Math.floor(nx)] ?? T_WALL) === T_WALL) break;
    t += step;
  }
  return { x: ox + dx * t, y: oy + dy * t };
}

function lancerBeamHits(ox: number, oy: number, end: { x: number; y: number }, px: number, py: number) {
  const vx = end.x - ox, vy = end.y - oy, len2 = vx * vx + vy * vy;
  if (len2 <= 0) return false;
  const t = ((px - ox) * vx + (py - oy) * vy) / len2;
  if (t < 0 || t > 1) return false;
  return Math.hypot(ox + vx * t - px, oy + vy * t - py) <= LANCER.hitRadius;
}

function fireLancerBeam(state: GameState, e: Enemy) {
  const cfg = ENEMY_CONFIGS.lancer, ox = e.x / TILE_SIZE, oy = e.y / TILE_SIZE, end = lancerBeamEnd(state, e);
  state.laserBeams.push({ fromX: e.x, fromY: e.y, dirX: 0, dirY: 0, endX: end.x * TILE_SIZE, endY: end.y * TILE_SIZE, ticks: LANCER.beamTicks, color: cfg.color });
  if (lancerBeamHits(ox, oy, end, state.playerX / TILE_SIZE, state.playerY / TILE_SIZE)) {
    damagePlayer(state, cfg.damageToPlayer, e);
    shovePlayerFromEnemy(state, e, ALIEN_KNOCKBACK.lancer!);
  }
  if (state.rubyTileX !== -1 && !state.playerCarryingRuby && lancerBeamHits(ox, oy, end, state.rubyTileX + .5, state.rubyTileY + .5)) damageRuby(state, cfg.damageToRuby, e);
  e.lanceDirX = e.lanceDirY = undefined;
  e.shootTicks = LANCER.beamTicks;
  e.attackTimer = cfg.attackCooldown;
  playSFX_laser(ALIEN_ATTACK_SFX.laser);
}

function updateLancer(state: GameState, e: Enemy, playerCarrying: boolean) {
  const cfg = ENEMY_CONFIGS.lancer, { tx, ty } = pickTarget(state, e, playerCarrying);
  if (e.windupTicks > 0) { if (--e.windupTicks === 0) fireLancerBeam(state, e); return; }
  if (e.attackTimer > 0) e.attackTimer--;
  const inRange = tileEuclidDist(e.tileX, e.tileY, tx, ty) <= cfg.attackRange && hasLineOfSight(state.map, e.tileX, e.tileY, tx, ty);
  const settled = e.tileX === e.targetTileX && e.tileY === e.targetTileY;
  if (e.attackTimer === 0 && inRange && settled) {
    const aimX = e.targeting === 'player' ? state.playerX / TILE_SIZE : tx + .5, aimY = e.targeting === 'player' ? state.playerY / TILE_SIZE : ty + .5;
    const ax = aimX - e.x / TILE_SIZE, ay = aimY - e.y / TILE_SIZE, len = Math.hypot(ax, ay) || 1;
    e.lanceDirX = ax / len; e.lanceDirY = ay / len;
    e.windupTicks = LANCER.windupTicks;
    // charging.wav (0.59s) pitched to 0.6x spans the 1s windup; distant Lancers stay quiet.
    if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= 16) playAudioOneShot('/sounds/charging.wav', ALIEN_ATTACK_SFX.lancerCharge, .6);
    return;
  }
  if (!inRange) walkPath(state, e, tx, ty, cfg.speed);
  else if (!settled) stepEnemy(state, e, cfg.speed);
}

// ── Healer: pulses healing to nearby allies and walks toward the most injured one ──
function updateHealer(state: GameState, e: Enemy) {
  if (e.attackTimer > 0) e.attackTimer--;
  if (e.attackTimer === 0) {
    let healedAnyone = false;
    for (const ally of state.enemies) {
      if (ally === e || ally.type === 'aegis_construct' || (ally.twin?.downedTicks ?? 0) > 0) continue;
      if (tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) <= HEALER_HEAL_RADIUS && ally.hp < ally.maxHp) {
        ally.hp = Math.min(ally.maxHp, ally.hp + HEALER_HEAL_AMOUNT);
        ally.healFlashTicks = 20; // pink heal aura
        healedAnyone = true;
      }
    }
    if (healedAnyone) { const a = gameAudio('/sounds/swap.mp3'); a.volume = 0.15; a.play().catch(() => {}); }
    e.attackTimer = HEALER_HEAL_INTERVAL;
  }
  // Most injured ally (lowest HP ratio); with none injured, drift toward the player.
  let tx = state.playerTileX, ty = state.playerTileY, lowestRatio = 1;
  for (const ally of state.enemies) {
    if (ally === e || ally.type === 'aegis_construct' || (ally.twin?.downedTicks ?? 0) > 0) continue;
    const ratio = ally.hp / ally.maxHp;
    if (ratio < lowestRatio) { lowestRatio = ratio; tx = ally.tileX; ty = ally.tileY; }
  }
  if (tileEuclidDist(e.tileX, e.tileY, tx, ty) > HEALER_HEAL_RADIUS) walkPath(state, e, tx, ty, ENEMY_CONFIGS.healer.speed);
}

// ── Charger: locks a cardinal lane toward the player, warns, then rushes until it hits something ──
function updateCharger(state: GameState, e: Enemy) {
  const cfg = ENEMY_CONFIGS.charger;
  if (e.attackTimer > 0) e.attackTimer--;
  if (e.windupTicks > 0) { e.windupTicks--; return; } // stunned after a wall or a hit
  // Snowbowl's sounds: place_bomb when the lane locks, the pitched alien shot when the rush starts (nearby Chargers only).
  const heard = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= 16;
  if ((e.chargeWindupTicks ?? 0) > 0) { if (--e.chargeWindupTicks! === 0 && heard) playSFX_alienShoot(ALIEN_ATTACK_SFX.shot, 1.3); return; }
  const recover = (wall: boolean) => {
    e.chargeDirX = 0; e.chargeDirY = 0; e.chargeTilesLeft = 0;
    e.windupTicks = wall ? CHARGER_STUN_TICKS : Math.floor(CHARGER_STUN_TICKS / 2);
    e.attackTimer = cfg.attackCooldown; e.path = []; e.pathTimer = 0;
  };

  if (e.chargeDirX !== 0 || e.chargeDirY !== 0) {
    if (e.tileX === e.targetTileX && e.tileY === e.targetTileY) {
      const nx = e.tileX + e.chargeDirX, ny = e.tileY + e.chargeDirY;
      if (!isFloorTile(state.map, nx, ny)) recover(true);
      else if ((e.chargeTilesLeft ?? CHARGER_CHARGE_TILES) <= 0) recover(false);
      else { e.targetTileX = nx; e.targetTileY = ny; e.stepProgress = 0; }
    } else if (stepEnemy(state, e, CHARGER_CHARGE_SPEED)) {
      e.chargeTilesLeft = (e.chargeTilesLeft ?? CHARGER_CHARGE_TILES) - 1;
      // Contact damage happens on arrival, rather than a tile before impact.
      const hitPlayer = e.tileX === state.playerTileX && e.tileY === state.playerTileY;
      const hitRuby = !state.enemyDecoyActive && state.rubyTileX !== -1 && e.tileX === state.rubyTileX && e.tileY === state.rubyTileY;
      if (hitPlayer || hitRuby) {
        playSFX_chargerImpact();
        if (hitPlayer) {
          damagePlayer(state, cfg.damageToPlayer, e);
          if (state.gamePhase !== 'lost' && !state.enemyDecoyActive && !state.playerKnockback && !state.saturn?.roll) {
            state.playerKnockback = { dirX: e.chargeDirX, dirY: e.chargeDirY, started: false, tilesLeft: CHARGER_KNOCKBACK };
          }
        } else damageRuby(state, cfg.damageToRuby, e);
        e.shootTicks = 14; recover(false);
      }
    }
    return;
  }

  // Idle: lock a lane when the player is in sight, otherwise walk toward them.
  const dist = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
  if (e.attackTimer === 0 && e.tileX === e.targetTileX && e.tileY === e.targetTileY && dist <= CHARGER_SIGHT_RANGE && hasLineOfSight(state.map, e.tileX, e.tileY, state.playerTileX, state.playerTileY)) {
    const ddx = state.playerTileX - e.tileX, ddy = state.playerTileY - e.tileY;
    if (Math.abs(ddx) >= Math.abs(ddy)) { e.chargeDirX = ddx > 0 ? 1 : -1; e.chargeDirY = 0; }
    else { e.chargeDirX = 0; e.chargeDirY = ddy > 0 ? 1 : -1; }
    e.chargeWindupTicks = CHARGER_WINDUP_TICKS; e.chargeTilesLeft = CHARGER_CHARGE_TILES; e.path = [];
    if (heard) playAudioOneShot('/sounds/place_bomb.wav', ALIEN_ATTACK_SFX.chargerLock);
  } else walkPath(state, e, state.playerTileX, state.playerTileY, cfg.speed, 35, 20);
}

// ── Ghost: moves straight through walls toward the player, or a placed Ruby that is clearly closer ──
function updateGhost(state: GameState, e: Enemy, playerCarrying: boolean) {
  const cfg = ENEMY_CONFIGS.ghost, hasRuby = state.rubyTileX !== -1;
  const dPlayer = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
  const dRuby = hasRuby ? tileEuclidDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) : Infinity;
  const targetRuby = !playerCarrying && hasRuby && dRuby < dPlayer - 2;
  const tx = targetRuby ? state.rubyTileX : state.playerTileX, ty = targetRuby ? state.rubyTileY : state.playerTileY;
  e.targeting = targetRuby ? 'ruby' : 'player';
  if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) { stepEnemy(state, e, cfg.speed); return; }
  const nearPlayer = tileDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= cfg.attackRange;
  const nearRuby = hasRuby && tileDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= cfg.attackRange;
  if (e.attackTimer > 0) e.attackTimer--;
  else if (nearPlayer && !targetRuby) {
    playSFX_enemyAttack(); damagePlayer(state, cfg.damageToPlayer, e);
    shovePlayerFromEnemy(state, e, ALIEN_KNOCKBACK.ghost!);
    e.attackTimer = cfg.attackCooldown; e.shootTicks = 14;
  } else if (nearRuby && targetRuby) {
    playSFX_enemyAttack(); damageRuby(state, cfg.damageToRuby, e);
    e.attackTimer = cfg.attackCooldown; e.shootTicks = 14;
  } else if (e.tileX !== tx || e.tileY !== ty) {
    // Greedy step along the longer axis, ignoring walls.
    const ddx = tx - e.tileX, ddy = ty - e.tileY;
    let nx = e.tileX, ny = e.tileY;
    if (Math.abs(ddx) >= Math.abs(ddy)) nx += ddx > 0 ? 1 : -1; else ny += ddy > 0 ? 1 : -1;
    e.targetTileX = Math.max(0, Math.min(MAP_COLS - 1, nx)); e.targetTileY = Math.max(0, Math.min(MAP_ROWS - 1, ny)); e.stepProgress = 0;
  }
}

// ── Shielder: follows and protects one ally in range (most injured first); never attacks ──
function updateShielder(state: GameState, e: Enemy) {
  if (e.attackTimer > 0) e.attackTimer--;
  // Each Shielder protects a different ally.
  const taken = new Set(state.enemies.filter(other => other.type === 'shielder' && other !== e && other.shieldTargetId !== -1).map(other => other.shieldTargetId));
  const valid = state.enemies.filter(ally => ally !== e && ally.type !== 'shielder' && ally.type !== 'aegis_construct' && !((ally.twin?.downedTicks ?? 0) > 0)
    && !taken.has(ally.id) && tileEuclidDist(e.tileX, e.tileY, ally.tileX, ally.tileY) <= SHIELDER_SHIELD_RANGE);
  let target: Enemy | null = null, lowestRatio = 1;
  for (const ally of valid) { const ratio = ally.hp / ally.maxHp; if (ratio < lowestRatio) { lowestRatio = ratio; target = ally; } }
  // No one injured: keep the current target if still valid, otherwise pick one at random.
  if (!target && valid.length) target = valid.find(a => a.id === e.shieldTargetId) ?? valid[Math.floor(Math.random() * valid.length)];
  const speed = ENEMY_CONFIGS.shielder.speed;
  if (target) { e.shieldTargetId = target.id; walkPath(state, e, target.tileX, target.tileY, speed, 20, 15); }
  else { e.shieldTargetId = -1; walkPath(state, e, state.playerTileX, state.playerTileY, speed, 30, 20); }
}

// ── Enchanter: stays near other aliens and pulses a buff (speed and damage; smaller on bosses) onto those in range; never attacks ──
function updateEnchanter(state: GameState, e: Enemy) {
  const allies = state.enemies.filter(a => a !== e && a.hp > 0 && !a.twin?.downedTicks && a.type !== 'aegis_construct');
  if ((e.enchantPulseTicks ?? 0) > 0) e.enchantPulseTicks!--;
  if (e.attackTimer > 0) e.attackTimer--;
  else {
    const inRange = allies.filter(a => tileEuclidDist(e.tileX, e.tileY, a.tileX, a.tileY) <= ENCHANTER.radius);
    if (inRange.length) {
      for (const a of inRange) a.enchantedUntil = state.gameTick + ENCHANTER.buffTicks;
      e.enchantPulseTicks = 30; // pulse ring
      if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= 16) playAudioOneShot('/sounds/gem_passive_trigger.wav', .5 * ATTACK_SFX_VOLUME, .8);
    }
    e.attackTimer = ENCHANTER.pulseTicks;
  }
  // Head for the nearest ally (staying a couple of tiles off), or drift toward the player when alone.
  let target: Enemy | undefined, best = Infinity;
  for (const a of allies) { const d = tileEuclidDist(e.tileX, e.tileY, a.tileX, a.tileY); if (d < best) { best = d; target = a; } }
  if (target && best <= 2) { if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) stepEnemy(state, e, ENEMY_CONFIGS.enchanter.speed); return; }
  walkPath(state, e, target ? target.tileX : state.playerTileX, target ? target.tileY : state.playerTileY, ENEMY_CONFIGS.enchanter.speed);
}

// ── Snatcher: goes for a placed Ruby, grabs her and carries her away from the player, slowed; never attacks ──
function updateSnatcher(state: GameState, e: Enemy) {
  const speed = ENEMY_CONFIGS.snatcher.speed;
  if (state.rubyStolenBy === e.id) {
    if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) { stepEnemy(state, e, speed * SNATCHER.fleeSpeedMult); return; }
    // Step to the neighbouring floor tile farthest from the player (stays put if cornered).
    let best: [number, number] | null = null, bestD = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = e.tileX + dx, ny = e.tileY + dy;
      if (!isFloorTile(state.map, nx, ny)) continue;
      const d = tileEuclidDist(nx, ny, state.playerTileX, state.playerTileY);
      if (d > bestD) { bestD = d; best = [nx, ny]; }
    }
    if (best) { e.targetTileX = best[0]; e.targetTileY = best[1]; e.stepProgress = 0; }
    return;
  }
  const rubyPlaced = state.rubyTileX !== -1 && !state.playerCarryingRuby && state.rubyStolenBy === undefined;
  if (rubyPlaced && e.tileX === e.targetTileX && e.tileY === e.targetTileY && tileDist(e.tileX, e.tileY, state.rubyTileX, state.rubyTileY) <= 1) {
    state.rubyStolenBy = e.id; e.path = []; e.pathTimer = 0; playSFX_special('snatch'); return; // grabbed
  }
  if (rubyPlaced) walkPath(state, e, state.rubyTileX, state.rubyTileY, speed);
  else if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) > 2) walkPath(state, e, state.playerTileX, state.playerTileY, speed); // shadows a carrier
  else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) stepEnemy(state, e, speed);
}

// ── Impostor: copies a living boss's look and hangs back like one; never attacks ──
function updateImpostor(state: GameState, e: Enemy) {
  const bosses = state.enemies.filter(b => isBossType(b.type) && b.hp > 0 && !b.twin?.downedTicks);
  e.disguiseIn ??= IMPOSTOR.disguiseDelay;
  if (e.disguiseIn > 0) { // shows its own plain look for the first 2 seconds
    if (--e.disguiseIn === 0 && tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= 16) playSFX_special('disguise');
  } else if (!bosses.some(b => b.id === e.disguiseOf)) {
    if (!bosses.length) { e.impostorExpired = true; e.hp = 0; return; }
    e.disguiseOf = bosses[Math.floor(Math.random() * bosses.length)].id;
  }
  const speed = ENEMY_CONFIGS.impostor.speed;
  if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) > IMPOSTOR.keepAway) walkPath(state, e, state.playerTileX, state.playerTileY, speed);
  else if (e.tileX !== e.targetTileX || e.tileY !== e.targetTileY) stepEnemy(state, e, speed);
}

// ── Shooter: stops in range with a clear line, glows briefly, then fires a slow stunning orb at the player ──
function updateShooter(state: GameState, e: Enemy) {
  const cfg = ENEMY_CONFIGS.shooter;
  e.targeting = 'player';
  if (e.windupTicks > 0) {
    if (--e.windupTicks === 0) {
      const dx = state.playerX - e.x, dy = state.playerY - e.y, len = Math.hypot(dx, dy) || 1;
      (state.enemyShots ??= []).push({ x: e.x, y: e.y, dx: dx / len * SHOOTER.shotSpeed, dy: dy / len * SHOOTER.shotSpeed, ownerId: e.id, ticks: 0 });
      e.attackTimer = cfg.attackCooldown; e.shootTicks = 14;
      if (tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= 16) playSFX_alienShoot(ALIEN_ATTACK_SFX.shot, .8);
    }
    return;
  }
  if (e.attackTimer > 0) e.attackTimer--;
  const settled = e.tileX === e.targetTileX && e.tileY === e.targetTileY;
  const inRange = tileEuclidDist(e.tileX, e.tileY, state.playerTileX, state.playerTileY) <= cfg.attackRange && hasLineOfSight(state.map, e.tileX, e.tileY, state.playerTileX, state.playerTileY);
  if (inRange && settled && e.attackTimer === 0) { e.windupTicks = SHOOTER.windupTicks; return; }
  if (!inRange) walkPath(state, e, state.playerTileX, state.playerTileY, cfg.speed);
  else if (!settled) stepEnemy(state, e, cfg.speed);
}
