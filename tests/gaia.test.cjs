const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let source = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) source += '\nexport const gaiaTest = { damageEnemy, eruptThornField, killEnemy };';
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../game/engine.ts'), c = require('../game/constants.ts'), api = e.gaiaTest, g = require('../game/gaia.ts');
// Runs fn with a fixed-seed Math.random (mulberry32), so a test that walks through random spawns is repeatable.
function seeded(seed,fn){const original=Math.random;let a=seed>>>0;Math.random=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};try{return fn();}finally{Math.random=original;}}
const PH = c.GAIA_PHASE_HP, idx = (x, y) => y * c.MAP_COLS + x;

function fresh() {
  const s = e.createModeState('trial', 'thorn_weaver');
  s.noMobs = true; s.godMode = true; s.meteoriteTimer = 100000; s.gaia.pollenTimer = 100000; s.gaia.podTimer = 100000;
  e.godSpawnBoss(s, 'thorn_weaver');
  const boss = s.enemies.find(x => x.type === 'thorn_weaver');
  boss.thorn.cooldown = 100000;
  return { s, boss };
}
const roomTiles = (s, room) => {
  const [r1, c1, r2, c2] = c.CHAMBER_BOUNDS[room], out = [];
  for (let y = r1; y <= r2; y++) for (let x = c1; x <= c2; x++) if (s.map[y][x] === c.T_FLOOR) out.push([x, y]);
  return out;
};

test('the Gaia guardian carries three phases, with eight Sunstones two per room', () => {
  const { s, boss } = fresh();
  assert.equal(boss.maxHp, 3 * PH);
  assert.equal(s.gaia.stones.length, 8);
  for (let room = 0; room < 4; room++) assert.equal(s.gaia.stones.filter(st => c.chamberOfTile(st.x, st.y) === room).length, 2);
});

test('she grows vines around her, and the laser clears them and charges Sunfire', () => {
  const { s, boss } = fresh();
  for (let i = 0; i < c.GAIA_TRAIL_GAP * 2 + 1; i++) e.tick(s);
  assert.ok(s.gaia.growth.some(g => g >= 1), 'growth appeared');
  // A row of vines next to the player is cleared by one laser.
  const y = s.playerTileY;
  for (let x = s.playerTileX + 1; x <= s.playerTileX + 3; x++) s.gaia.growth[idx(x, y)] = 2;
  e.useLaser(s);
  assert.equal(s.gaia.growth[idx(s.playerTileX + 1, y)], 1);
  assert.ok(s.gaia.sunCharge >= 3 * c.GAIA_SUN_CHARGE_RATE);
  void boss;
});

test('a field landing on a lit Sunstone burns away, costs the boss its Sunstone share and the stone moves room', () => {
  const { s, boss } = fresh();
  const stone = s.gaia.stones[0], room = c.chamberOfTile(stone.x, stone.y), hp = boss.hp;
  s.playerHP = 50; s.rubyHP = 60;
  api.eruptThornField(s, boss, (stone.x + .5) * c.TILE_SIZE, (stone.y + .5) * c.TILE_SIZE);
  assert.equal(s.thornPatches.length, 0, 'no thorn patch');
  assert.equal(s.playerHP, 50 + c.PLAYER_MAX_HP * c.GAIA_STONE_HEAL); assert.equal(s.rubyHP, 60 + c.RUBY_MAX_HP * c.GAIA_STONE_HEAL);
  assert.equal(s.playerHP, 51); assert.equal(s.rubyHP, 61);
  assert.ok(Math.abs(hp - boss.hp - c.GAIA_STONE_SELF_DAMAGE * PH) < .01);
  assert.notEqual(c.chamberOfTile(stone.x, stone.y), room);
  assert.equal(stone.lit, false);
  for (let i = 0; i < c.GAIA_STONE_TRAVEL + c.GAIA_STONE_RELIGHT + 2; i++) e.tick(s);
  assert.equal(stone.lit, true);
});

test('damage cannot skip a phase; at the floor phase 2 begins at once with full phase HP', () => {
  const { s, boss } = fresh();
  api.damageEnemy(s, boss, 5000);
  assert.ok(boss.hp > 2 * PH && boss.hp < 2 * PH + 1);
  e.tick(s);
  assert.equal(s.gaia.phase, 2);
  assert.ok(boss.hp > 2 * PH - 1 && boss.hp <= 2 * PH, `phase 2 starts full: ${boss.hp}`);
  const before = boss.hp; api.damageEnemy(s, boss, 100); assert.ok(boss.hp < before, 'she takes damage right away');
});

test("Ruby's ward keeps ground clean, and a closed ring of vines squeezes Ruby", () => {
  const { s } = fresh();
  s.godMode = false; s.rubyShieldHP = 0;
  const rx = s.rubyTileX, ry = s.rubyTileY;
  s.gaia.growth[idx(rx + 1, ry)] = 3;
  for (let y = ry - 3; y <= ry + 3; y++) for (let x = rx - 3; x <= rx + 3; x++) if (Math.max(Math.abs(x - rx), Math.abs(y - ry)) === 3) s.gaia.growth[idx(x, y)] = 2;
  const ruby = s.rubyHP;
  for (let i = 0; i < 61; i++) e.tick(s);
  assert.equal(s.gaia.growth[idx(rx + 1, ry)], 0, 'ward cleared');
  assert.equal(s.gaia.ringClosure, 1);
  assert.ok(s.rubyHP < ruby, 'ring squeezes Ruby');
});

test('a partial Sunfire bursts around you at once; more charge reaches further and hurts her more', () => {
  const { s, boss } = fresh();
  // Put her right next to you.
  boss.tileX = boss.targetTileX = s.playerTileX + 1; boss.tileY = boss.targetTileY = s.playerTileY;
  assert.equal(g.useSunfire(s), false, 'needs a minimum charge');
  const burst = charge => {
    const { s: t, boss: b } = fresh();
    b.tileX = b.targetTileX = t.playerTileX + 1; b.tileY = b.targetTileY = t.playerTileY;
    for (let x = t.playerTileX - 8; x <= t.playerTileX + 8; x++) if (t.map[t.playerTileY][x] === c.T_FLOOR) t.gaia.growth[idx(x, t.playerTileY)] = 2;
    t.gaia.sunCharge = charge; const hp = b.hp;
    assert.equal(g.useSunfire(t), true);
    const cleared = [...Array(9).keys()].filter(d => t.gaia.growth[idx(t.playerTileX + d, t.playerTileY)] === 0).length;
    return { lost: hp - b.hp, cleared, left: t.gaia.sunCharge, wound: t.gaia.sunfire };
  };
  const small = burst(c.GAIA_SUN_MIN), big = burst(c.GAIA_SUN_MAX - 1);
  assert.ok(big.lost > small.lost, 'more damage'); assert.ok(big.cleared > small.cleared, 'more reach');
  assert.ok(Math.abs(small.lost - PH * .12 * c.GAIA_SUN_MIN / c.GAIA_SUN_MAX) < .01, 'partial damage scales from 12%');
  assert.ok(Math.abs(big.lost - PH * .12 * (c.GAIA_SUN_MAX - 1) / c.GAIA_SUN_MAX) < .01, 'near-full burst uses the same damage scale');
  assert.equal(small.left, 0); assert.equal(small.wound, null, 'partial is instant');
});

test('a full Sunfire winds up, then burns the chosen room: you take damage if inside, and she is hit hard there', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  const room = c.chamberOfTile(s.playerTileX, s.playerTileY);
  const tiles = roomTiles(s, room).filter(([x, y]) => x !== s.playerTileX || y !== s.playerTileY);
  for (const [x, y] of tiles) s.gaia.growth[idx(x, y)] = 2;
  const spot = tiles.find(([x, y]) => Math.abs(x - s.playerTileX) + Math.abs(y - s.playerTileY) > 3);
  boss.tileX = boss.targetTileX = spot[0]; boss.tileY = boss.targetTileY = spot[1];
  s.gaia.sunCharge = c.GAIA_SUN_MAX;
  assert.equal(g.useSunfire(s), true);
  assert.equal(s.gamePhase, 'laserTarget', 'a full charge opens the room picker');
  assert.equal(e.chooseSkyLaser(s, room), true);
  assert.equal(s.gaia.sunfire.chamber, room); assert.equal(s.gaia.sunCharge, 0);
  assert.equal(g.useSunfire(s), false, 'cannot fire again while winding up');
  const hp = boss.hp, playerHP = s.playerHP;
  for (let i = 0; i < c.GAIA_SUN_WARNING + 1; i++) e.tick(s);
  assert.equal(g.gaiaRoomShare(s, room), 0);
  assert.ok(Math.abs(hp - boss.hp - .12 * PH) < 1, 'full Sunfire deals 12%: ' + (hp - boss.hp));
  assert.ok(playerHP - s.playerHP >= c.GAIA_SUN_SELF_DAMAGE - .01, 'self damage');
});

test('seed pods burst into thicket unless broken; breaking one charges Sunfire', () => {
  const { s } = fresh();
  s.gaia.podTimer = 1; e.tick(s);
  const pod = s.enemies.find(x => x.type === 'seed_pod'); assert.ok(pod);
  const charge = s.gaia.sunCharge;
  api.damageEnemy(s, pod, 100);
  assert.equal(s.gaia.sunCharge, charge + c.GAIA_POD_CHARGE);
  s.gaia.podTimer = 1; e.tick(s);
  const pod2 = s.enemies.find(x => x.type === 'seed_pod' && x.hp > 0); pod2.windupTicks = 1;
  s.playerCarryingRuby = true; s.rubyTileX = -1; // no ward in the way of a random pod
  s.gaia.stones = []; e.tick(s);
  assert.equal(s.gaia.growth[idx(pod2.tileX, pod2.tileY)], 3);
});

test('meteors scorch their room', () => {
  const { s } = fresh();
  for (const [x, y] of roomTiles(s, 1)) s.gaia.growth[idx(x, y)] = 2;
  s.meteoriteWarning = 1; s.meteoriteStrikeIn = 1; e.tick(s);
  assert.equal(g.gaiaRoomShare(s, 1), 0);
});

test("Gaia's Roots lasts 25s and comes back 35s after a cast in this challenge", () => {
  const { s } = fresh();
  assert.equal(s.specialSkill, 'thorn_weaver');
  e.useSpecialSkill(s);
  assert.equal(s.celestialField.ticks, c.GAIA_ROOTS_DURATION);
  assert.equal(c.GAIA_ROOTS_DURATION, 1500);
  e.tick(s);
  assert.equal(s.trial.cooldown, 2100);
  for (let i = 0; i < 2100; i++) e.tick(s);
  assert.equal(s.specialSkill, 'thorn_weaver');
});

test('standing in his thorn field hurts more on this map', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.playerShieldHP = 0; s.gaia.stones = [];
  s.thornPatches = [{ x: s.playerX, y: s.playerY, radius: c.THORN_RADIUS, ticks: 500, ownerId: boss.id }];
  e.tick(s); const hp = s.playerHP;
  for (let i = 0; i < c.THORN_CONTACT_INTERVAL; i++) e.tick(s);
  assert.ok(hp - s.playerHP >= c.GAIA_THORN_CONTACT_DAMAGE, 'contact: ' + (hp - s.playerHP));
});

test('a placed Ruby inside his thorn field takes a small continuous damage', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.rubyShieldHP = 0; s.gaia.stones = [];
  s.thornPatches = [{ x: (s.rubyTileX + .5) * c.TILE_SIZE, y: (s.rubyTileY + .5) * c.TILE_SIZE, radius: c.THORN_RADIUS, ticks: 500, ownerId: boss.id }];
  const ruby = s.rubyHP;
  for (let i = 0; i < c.THORN_CONTACT_INTERVAL + 1; i++) e.tick(s);
  assert.equal(ruby - s.rubyHP, c.GAIA_THORN_RUBY_DAMAGE);
});

test('a field erupting on placed Ruby cuts it for less than you; staying inside is small', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.rubyShieldHP = 0; s.gaia.stones = [];
  const ruby = s.rubyHP;
  api.eruptThornField(s, boss, (s.rubyTileX + .5) * c.TILE_SIZE, (s.rubyTileY + .5) * c.TILE_SIZE);
  assert.equal(ruby - s.rubyHP, c.GAIA_THORN_RUBY_CUT);
});

test('a full Sunfire on another room spares you and Ruby', () => {
  const { s } = fresh();
  s.godMode = false; s.playerShieldHP = 0; s.rubyShieldHP = 0;
  const mine = c.chamberOfTile(s.playerTileX, s.playerTileY), other = (mine + 1) % 4;
  s.gaia.sunCharge = c.GAIA_SUN_MAX; g.useSunfire(s); e.chooseSkyLaser(s, other);
  const hp = s.playerHP, ruby = s.rubyHP;
  for (let i = 0; i < c.GAIA_SUN_WARNING + 1; i++) e.tick(s);
  assert.equal(s.playerHP, hp); assert.equal(s.rubyHP, ruby);
});

test('an angry mushroom hit knocks you back two tiles, and it leaves vines where it runs', () => {
  const { s } = fresh();
  s.enemies = s.enemies.filter(x => x.type !== 'thorn_weaver');
  const tile = [s.playerTileX - 1, s.playerTileY];
  const m = { ...s.enemies[0] ?? {}, id: 500, type: 'angry_mushroom', x: (tile[0] + .5) * c.TILE_SIZE, y: (tile[1] + .5) * c.TILE_SIZE, tileX: tile[0], tileY: tile[1],
    targetTileX: tile[0], targetTileY: tile[1], stepProgress: 0, hp: 8, maxHp: 8, path: [], pathTimer: 0, attackTimer: 0, targeting: 'player',
    pushDirX: 0, pushDirY: 0, pushTiles: 0, flashTicks: 0, healFlashTicks: 0, shootTicks: 0, exploding: false, explodeTick: 0, windupTicks: 0,
    chargeDirX: 0, chargeDirY: 0, shieldTargetId: -1, phaseTimer: 0, icyShieldHP: 0 };
  s.enemies.push(m);
  const startX = s.playerTileX;
  for (let i = 0; i < 40 && !s.playerKnockback; i++) e.tick(s);
  assert.ok(s.playerKnockback, 'knocked back'); assert.equal(s.playerKnockback.tilesLeft, c.GAIA_MUSHROOM_KNOCKBACK);
  for (let i = 0; i < 60; i++) e.tick(s);
  assert.ok(s.playerTileX - startX >= 2, 'pushed two tiles: ' + (s.playerTileX - startX));
  // Away from Ruby's ward (which keeps its own ground clean), it grows the tile it stands on.
  const far = [s.rubyTileX + 6, s.rubyTileY]; m.tileX = m.targetTileX = far[0]; m.tileY = m.targetTileY = far[1]; m.x = (far[0] + .5) * c.TILE_SIZE; m.y = (far[1] + .5) * c.TILE_SIZE;
  s.gaia.growth.fill(0); m.attackTimer = 1e9; m.pathTimer = 1e9; m.path = [];
  for (let i = 0; i < 31; i++) { e.tick(s); m.tileX = m.targetTileX = far[0]; m.tileY = m.targetTileY = far[1]; }
  assert.ok(s.gaia.growth[idx(far[0], far[1])] >= 1, 'vines where it runs');
});

test('when not fleeing she walks to nearby overgrowth and lingers there', () => {
  const { s, boss } = fresh();
  s.gaia.growth.fill(0); s.gaia.trailTimer = 1e9; s.gaia.creepTimer = 1e9;
  s.playerCarryingRuby = true; s.rubyTileX = -1; s.gaia.stones = []; // no ward or stone in the way of the test thicket
  const px = boss.tileX > 25 ? 5 : 45, py = boss.tileY > 25 ? 5 : 45; // the opposite room, out of her flee range
  s.playerTileX = s.playerTargetX = px; s.playerTileY = s.playerTargetY = py; s.playerX = (px + .5) * c.TILE_SIZE; s.playerY = (py + .5) * c.TILE_SIZE;
  // A floor tile 4 away in some direction (a room edge can put walls on one side).
  const goal = [[4, 0], [-4, 0], [0, 4], [0, -4]].map(([dx, dy]) => [boss.tileX + dx, boss.tileY + dy]).find(([x, y]) => s.map[y]?.[x] === c.T_FLOOR);
  s.gaia.growth[idx(goal[0], goal[1])] = 3;
  boss.pathTimer = 0;
  for (let i = 0; i < 1500 && (boss.tileX !== goal[0] || boss.tileY !== goal[1]); i++) e.tick(s);
  assert.deepEqual([boss.tileX, boss.tileY], goal, 'reached the thicket');
  for (let i = 0; i < 120; i++) e.tick(s);
  assert.deepEqual([boss.tileX, boss.tileY], goal, 'lingers there');
});

test('phase 3 plays like phase 2 (she walks, pods, blossoms and snares) and ends when her HP runs out', () => {
  const { s, boss } = fresh();
  g.godSetGaiaPhase(s, 3);
  assert.equal(s.gaia.phase, 3);
  s.gaia.snareTimer = 1; s.gaia.blossomTimer = 1; s.gaia.podTimer = 1; e.tick(s);
  assert.ok(s.gaia.snares.length > 0, 'snares');
  assert.ok(s.enemies.some(x => x.type === 'blossom'), 'blossoms');
  assert.ok(s.enemies.some(x => x.type === 'seed_pod'), 'pods');
  api.damageEnemy(s, boss, boss.hp + 10);
  for (let i = s.enemies.length - 1; i >= 0; i--) if (s.enemies[i].hp <= 0) api.killEnemy(s, i);
  assert.equal(s.gamePhase, 'won');
});

test('meteors deal a share of the phase and ignore thicket armor', () => {
  const { s, boss } = fresh();
  s.gaia.growth[idx(boss.tileX, boss.tileY)] = 3;
  const room = c.chamberOfTile(boss.tileX, boss.tileY), hp = boss.hp;
  s.meteoriteWarning = room; s.meteoriteStrikeIn = 1; e.tick(s);
  assert.ok(Math.abs(hp - boss.hp - c.GAIA_STRIKE_DAMAGE * PH) < 2, 'meteor: ' + (hp - boss.hp));
});

test('at the blossom cap a new one replaces the oldest', () => {
  const { s, boss } = fresh(), max = c.GAIA_BLOSSOM_MAX;
  g.godSetGaiaPhase(s, 2); s.gaia.snareTimer = 1e9;
  for (let i = 0; i < max; i++) { s.gaia.blossomTimer = 1; e.tick(s); }
  const before = s.enemies.filter(x => x.type === 'blossom').map(x => x.id);
  assert.equal(before.length, max);
  s.gaia.blossomTimer = 1; e.tick(s);
  const after = s.enemies.filter(x => x.type === 'blossom').map(x => x.id);
  assert.equal(after.length, max); assert.ok(!after.includes(Math.min(...before)), 'oldest removed');
  void boss;
});

test('breaking a blossom costs the boss a little of the phase', () => {
  const { s, boss } = fresh();
  g.godSetGaiaPhase(s, 2); s.gaia.snareTimer = 1e9; s.gaia.blossomTimer = 1; e.tick(s);
  const blossom = s.enemies.find(x => x.type === 'blossom'); assert.ok(blossom);
  s.playerHP = 50; const hp = boss.hp; api.damageEnemy(s, blossom, 100);
  assert.ok(Math.abs(hp - boss.hp - c.GAIA_BLOSSOM_SELF_DAMAGE * PH) < 1, 'self damage: ' + (hp - boss.hp));
  assert.equal(s.playerHP, 50 + c.GAIA_BLOSSOM_KILL_HEAL, 'heals you');
});

test('phase 3 casts two fields: one on you, one blocking the way to your nearest Sunstone', () => {
  const { s, boss } = fresh();
  g.godSetGaiaPhase(s, 3); s.gaia.snareTimer = s.gaia.blossomTimer = s.gaia.podTimer = 1e9;
  s.gaia.stones = [{ x: s.playerTileX + 8, y: s.playerTileY, fromX: 0, fromY: 0, lit: true, travel: 0, relight: 0 }];
  boss.thorn.cooldown = 0; e.tick(s);
  assert.ok(boss.thorn.aim2, 'second field');
  assert.ok(boss.thorn.aim2.x > boss.thorn.aimX, 'toward the stone');
  const patches = s.thornPatches.length;
  for (let i = 0; i < c.THORN_WINDUP; i++) e.tick(s);
  assert.ok(s.thornPatches.length >= patches + 2, 'both erupted');
});

test('in phase 3 lit Sunstones hop two tiles every couple of seconds', () => {
  const { s } = fresh();
  g.godSetGaiaPhase(s, 3);
  // A tile with open floor around it and at least one clear two-tile hop.
  const open3 = (x, y) => { for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) if (s.map[y + oy]?.[x + ox] !== c.T_FLOOR) return false; return true; };
  let spot = null;
  for (let y = 3; y < 48 && !spot; y++) for (let x = 3; x < 48 && !spot; x++) {
    if (c.chamberOfTile(x, y) < 0 || !open3(x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => [1, 2].every(k => open3(x + dx * k, y + dy * k) && c.chamberOfTile(x + dx * k, y + dy * k) === c.chamberOfTile(x, y)))) spot = [x, y];
  }
  assert.ok(spot, 'open area');
  s.gaia.stones = [{ x: spot[0], y: spot[1], fromX: spot[0], fromY: spot[1], lit: true, travel: 0, relight: 0 }];
  for (let i = 0; i < c.GAIA_STONE_DRIFT_GAP + 1; i++) e.tick(s);
  const st = s.gaia.stones[0];
  assert.equal(Math.abs(st.x - spot[0]) + Math.abs(st.y - spot[1]), c.GAIA_STONE_DRIFT_STEP, 'moved two tiles');
});

test('phase 3 lifeblooms sprout; breaking one heals you and Ruby; unbroken ones fade', () => {
  const { s } = fresh();
  g.godSetGaiaPhase(s, 3); s.gaia.snareTimer = s.gaia.blossomTimer = s.gaia.podTimer = 1e9;
  s.gaia.lifebloomTimer = 1; e.tick(s);
  const bloom = s.enemies.find(x => x.type === 'lifebloom'); assert.ok(bloom, 'sprouted');
  s.playerHP = 50; s.rubyHP = 50;
  api.damageEnemy(s, bloom, 1);
  assert.equal(s.playerHP, 50 + c.GAIA_LIFEBLOOM_HEAL); assert.equal(s.rubyHP, 50 + c.GAIA_LIFEBLOOM_HEAL);
  s.gaia.lifebloomTimer = 1; e.tick(s);
  const next = s.enemies.find(x => x.type === 'lifebloom' && x.hp > 0); assert.ok(next);
  s.gaia.lifebloomTimer = 1e9; for (let i = 0; i < c.GAIA_LIFEBLOOM_LIFE + 1; i++) e.tick(s);
  assert.ok(!s.enemies.includes(next), 'faded');
});

test('full Sunfire layers its falling shot and whoosh across the whole wind-up',()=>{
 const original=e.playAudioOneShot,cues=[];e.playAudioOneShot=(...args)=>cues.push(args);
 try {
  const {s}=fresh();s.gaia.sunfire={chamber:0,ticks:c.GAIA_SUN_WARNING};
  g.updateGaia(s);assert.deepEqual(cues,[
   ['/sounds/meteorFalling.mp3',.5,c.GAIA_SUN_DROP_SOUND_RATE],
   ['/sounds/gaia-sunfire-whoosh.mp3',c.GAIA_SUN_WHOOSH_GAIN],
  ]);
  for(let i=0;i<c.GAIA_SUN_WARNING-2;i++)g.updateGaia(s);
  assert.equal(s.gaia.sunfire.ticks,1);assert.equal(cues.length,2);
 }finally{e.playAudioOneShot=original;}
});

test('a Sporeling death cloud poisons you while you stand in it and grows vines', () => {
  const { s } = fresh(); s.godMode = false; s.playerHP = 100; s.rubyTileX = -1; s.enemies = [];
  const x = s.playerTileX, y = s.playerTileY;
  g.gaiaSporeCloud(s, { tileX: x, tileY: y });
  assert.ok(g.gaiaLevel(s, x + 1, y) >= c.GAIA_SPORE_GROWTH || g.gaiaLevel(s, x, y + 1) >= c.GAIA_SPORE_GROWTH, 'vines around it');
  let hits = 0; for (let i = 0; i < 60; i++) { s.gameTick++; const hp = s.playerHP; g.updateGaia(s); if (s.playerHP < hp) hits++; }
  assert.equal(hits, 2, 'poisoned twice a second');
  assert.equal(c.ENEMY_CONFIGS.sporeling.speed, .9);
});


test('Sunstone healing caps at full HP and cannot repeat from an unlit stone', () => {
  const {s,boss} = fresh(), stone = s.gaia.stones[0];
  s.gaia.stones = [stone];
  const x = (stone.x+.5)*c.TILE_SIZE, y = (stone.y+.5)*c.TILE_SIZE;
  s.playerHP = c.PLAYER_MAX_HP-.5; s.rubyHP = c.RUBY_MAX_HP-.5;
  assert.equal(g.gaiaStoneBlocksField(s,boss,x,y,c.THORN_RADIUS),true);
  assert.equal(s.playerHP,c.PLAYER_MAX_HP);assert.equal(s.rubyHP,c.RUBY_MAX_HP);
  s.playerHP=50;s.rubyHP=60;
  assert.equal(g.gaiaStoneBlocksField(s,boss,x,y,c.THORN_RADIUS),false);
  assert.equal(s.playerHP,50);assert.equal(s.rubyHP,60);
});

test('clearing overgrowth heals you and Ruby for every level cut, with no cap; scorching heals nothing', () => {
  const { s } = fresh();
  s.gaia.lifebloomTimer = 100000; s.gaia.secondTimer = 60; s.playerHP = 50; s.rubyHP = 50;
  const tiles = roomTiles(s, 0).slice(0, 60);
  for (const [x, y] of tiles) s.gaia.growth[idx(x, y)] = 3;
  for (const [x, y] of tiles.slice(0, 5)) g.gaiaClearTile(s, x, y, 2); // 10 levels cut
  g.updateGaia(s);
  assert.ok(Math.abs(s.playerHP - (50 + 10 * c.GAIA_CLEAR_HEAL)) < .01, `healed to ${s.playerHP}`);
  assert.ok(Math.abs(s.rubyHP - (50 + 10 * c.GAIA_CLEAR_HEAL)) < .01, `Ruby healed to ${s.rubyHP}`);
  const before = s.playerHP;
  for (const [x, y] of tiles.slice(5)) g.gaiaClearTile(s, x, y, 3); // a big clear in the same second: 55 tiles x 3 levels
  g.updateGaia(s);
  const big = 50 + (10 + 55 * 3) * c.GAIA_CLEAR_HEAL;
  assert.ok(Math.abs(s.playerHP - big) < .01, `uncapped: ${s.playerHP}`);
  assert.ok(s.playerHP > before);
  assert.ok(Math.abs(s.rubyHP - big) < .01, `Ruby uncapped: ${s.rubyHP}`);
  for (let i = 0; i < 70; i++) g.updateGaia(s); // nothing more without further clearing
  assert.ok(Math.abs(s.playerHP - big) < .01, `nothing extra: ${s.playerHP}`);
  for (const [x, y] of roomTiles(s, 1)) s.gaia.growth[idx(x, y)] = 3;
  g.gaiaScorchRoom(s, 1); g.updateGaia(s);
  assert.ok(Math.abs(s.playerHP - big) < .01, 'a scorch does not heal');
});

const putPlayer = (s, x, y) => { s.playerTileX = s.playerTargetX = x; s.playerTileY = s.playerTargetY = y; s.playerX = (x + .5) * c.TILE_SIZE; s.playerY = (y + .5) * c.TILE_SIZE; s.playerStepProgress = 0; s.playerKnockback = null; };
function blossomNearPlayer() {
  const { s, boss } = fresh();
  g.godSetGaiaPhase(s, 2); s.gaia.snareTimer = 1e9; s.gaia.lifebloomTimer = 1e9;
  e.tick(s); // phase start plants one blossom at once
  const blossom = s.enemies.find(x => x.type === 'blossom');
  blossom.attackTimer = 1e9; // no pollen shots in these checks
  s.godMode = false; s.playerShieldHP = 0; s.thornPatches = []; boss.thorn.cooldown = 1e9;
  return { s, boss, blossom };
}
// A floor tile `dist` from the blossom with open floor behind it, so a push away from the blossom is not blocked.
const floorAt = (s, b, dist) => {
  for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let open = true;
    for (let k = dist; k <= dist + c.GAIA_BLOSSOM_PULSE.push; k++) if (s.map[b.tileY + uy * k]?.[b.tileX + ux * k] !== c.T_FLOOR) open = false;
    if (open) return [b.tileX + ux * dist, b.tileY + uy * dist];
  }
  return null;
};

test('entering phase 2 plants one blossom at once', () => {
  const { s } = fresh();
  g.godSetGaiaPhase(s, 2); s.gaia.snareTimer = 1e9;
  e.tick(s);
  assert.equal(s.enemies.filter(x => x.type === 'blossom').length, 1);
});

test('a blossom pulse bursts at once when you are in reach: a little damage and a push away', () => {
  const { s, blossom } = blossomNearPlayer();
  // Move the blossom to a spot with a straight run of open floor beside it, so the push is never blocked by chance.
  const run = 2 + c.GAIA_BLOSSOM_PULSE.push;
  let open = null;
  for (let y = 2; y < c.MAP_ROWS - 2 && !open; y++) for (let x = 2; x < c.MAP_COLS - run - 2 && !open; x++)
    if (c.chamberOfTile(x, y) >= 0 && Array.from({ length: run + 1 }, (_, k) => s.map[y][x + k] === c.T_FLOOR).every(Boolean)) open = [x, y];
  assert.ok(open, 'an open floor run exists');
  blossom.tileX = blossom.targetTileX = open[0]; blossom.tileY = blossom.targetTileY = open[1];
  blossom.x = (open[0] + .5) * c.TILE_SIZE; blossom.y = (open[1] + .5) * c.TILE_SIZE;
  const spot = floorAt(s, blossom, 2); assert.ok(spot, 'floor beside the blossom');
  putPlayer(s, spot[0], spot[1]);
  const hp = s.playerHP;
  blossom.phaseTimer = 1; g.updateGaia(s);
  assert.ok(Math.abs(hp - s.playerHP - c.GAIA_BLOSSOM_PULSE.damage) < .01, `damage ${hp - s.playerHP}`);
  assert.ok(s.playerKnockback, 'pushed');
  assert.equal(s.playerKnockback.tilesLeft, c.GAIA_BLOSSOM_PULSE.push);
  assert.ok(s.playerKnockback.dirX * (spot[0] - blossom.tileX) + s.playerKnockback.dirY * (spot[1] - blossom.tileY) > 0, 'away from the blossom');
  assert.equal(blossom.phaseTimer, c.GAIA_BLOSSOM_PULSE.gap);
  assert.ok(s.gaia.blossomPulses.length > 0, 'ring drawn');
});

test('a blossom pulse waits while you are out of reach', () => {seeded(4,()=>{
  const { s, blossom } = blossomNearPlayer();
  const out = roomTiles(s, c.chamberOfTile(blossom.tileX, blossom.tileY)).find(([x, y]) => Math.hypot(x - blossom.tileX, y - blossom.tileY) > c.GAIA_BLOSSOM_PULSE.radius);
  putPlayer(s, out[0], out[1]);
  const hp = s.playerHP;
  blossom.phaseTimer = 1; g.updateGaia(s);
  assert.equal(s.playerHP, hp, 'no damage');
  assert.equal(s.playerKnockback, null, 'no push');
  assert.equal(blossom.phaseTimer, c.GAIA_BLOSSOM_PULSE.retry, 'checks again soon');
  assert.ok(!(s.gaia.blossomPulses ?? []).length, 'no burst');
});});

function sunfireFieldScene(){
 const scene=fresh(),s=scene.s;s.gaia.stones=[];s.gaia.trailTimer=s.gaia.creepTimer=s.gaia.secondTimer=1e9;scene.boss.thorn.defenseCooldown=1e9;
 s.map=Array.from({length:c.MAP_ROWS},(_,y)=>Array.from({length:c.MAP_COLS},(_,x)=>x&&y&&x<c.MAP_COLS-1&&y<c.MAP_ROWS-1?c.T_FLOOR:c.T_WALL));
 Object.assign(s,{playerTileX:10,playerTargetX:10,playerTileY:10,playerTargetY:10,playerX:10.5*c.TILE_SIZE,playerY:10.5*c.TILE_SIZE,rubyTileX:10,rubyTileY:10});
 Object.assign(scene.boss,{tileX:30,targetTileX:30,tileY:30,targetTileY:30,x:30.5*c.TILE_SIZE,y:30.5*c.TILE_SIZE});return scene;
}
test('partial Sunfire burns only covered thorn tiles, preserving distant fields and removing full burns',()=>{
 const {s,boss}=sunfireFieldScene(),edge={x:12*c.TILE_SIZE,y:10*c.TILE_SIZE,radius:c.THORN_RADIUS,ticks:500,ownerId:boss.id},far={x:30*c.TILE_SIZE,y:28*c.TILE_SIZE,radius:c.THORN_RADIUS,ticks:500,ownerId:boss.id};s.thornPatches=[edge,far];
 s.gaia.sunCharge=c.GAIA_SUN_MIN;const hp=s.playerHP,ruby=s.rubyHP;assert.ok(g.useSunfire(s));
 assert.ok(s.thornPatches.includes(edge));assert.ok(s.thornPatches.includes(far));assert.equal(far.clearedTiles,undefined);
 assert.equal(c.thornFieldContainsTile(edge,10,10),false);assert.equal(e.isPlayerInThorns(s),false);assert.equal(c.thornFieldContainsTile(edge,13,9),true);
 assert.equal(s.playerHP,hp);assert.equal(s.rubyHP,ruby);assert.equal(s.gaia.sunCharge,0);
 s.playerX=13.5*c.TILE_SIZE;s.playerY=9.5*c.TILE_SIZE;assert.equal(e.isPlayerInThorns(s),true);
 Object.assign(s,{playerX:10.5*c.TILE_SIZE,playerY:10.5*c.TILE_SIZE});s.gaia.sunCharge=c.GAIA_SUN_MAX-1;assert.ok(g.useSunfire(s));assert.ok(!s.thornPatches.includes(edge));assert.ok(s.thornPatches.includes(far));
});
test('full Sunfire clears thorn tiles at impact only and preserves fields across the chamber edge',()=>{
 const {s,boss}=sunfireFieldScene(),[r1,c1,r2,c2]=c.CHAMBER_BOUNDS[0],y=Math.floor((r1+r2)/2);
 const edge={x:c2*c.TILE_SIZE,y:y*c.TILE_SIZE,radius:c.THORN_RADIUS,ticks:500,ownerId:boss.id};
 const inside={x:(c1+4)*c.TILE_SIZE,y:y*c.TILE_SIZE,radius:c.THORN_RADIUS,ticks:500,ownerId:boss.id};const far={x:30*c.TILE_SIZE,y:28*c.TILE_SIZE,radius:c.THORN_RADIUS,ticks:500,ownerId:boss.id};s.thornPatches=[edge,inside,far];
 s.gaia.sunCharge=c.GAIA_SUN_MAX;assert.ok(g.useSunfire(s));assert.ok(e.chooseSkyLaser(s,0));assert.equal(s.thornPatches.length,3);
 s.gaia.sunfire.ticks=1;g.updateGaia(s);assert.ok(!s.thornPatches.includes(inside));assert.ok(s.thornPatches.includes(edge));assert.ok(s.thornPatches.includes(far));
 assert.equal(c.thornFieldContainsTile(edge,c2,y),false);assert.equal(c.thornFieldContainsTile(edge,c2+1,y),true);assert.equal(far.clearedTiles,undefined);
});
test('Sunfire-cleared field tiles are visually empty and cannot hurt placed Ruby',()=>{
 const {s,boss}=sunfireFieldScene(),patch={x:12*c.TILE_SIZE,y:10*c.TILE_SIZE,radius:c.THORN_RADIUS,ticks:c.THORN_LIFETIME-80,ownerId:boss.id};s.thornPatches=[patch];s.gaia.sunCharge=c.GAIA_SUN_MIN;g.useSunfire(s);
 const {createCanvas}=require('@napi-rs/canvas'),art=require('../game/thorn-art.ts'),canvas=createCanvas(6*c.TILE_SIZE,6*c.TILE_SIZE),ctx=canvas.getContext('2d'),before=JSON.stringify(s.thornPatches);
 art.drawThornGround(ctx,s,8*c.TILE_SIZE,8*c.TILE_SIZE,100);assert.equal(JSON.stringify(s.thornPatches),before);
 assert.equal(ctx.getImageData(2.5*c.TILE_SIZE,2.5*c.TILE_SIZE,1,1).data[3],0);assert.ok(ctx.getImageData(5.5*c.TILE_SIZE,1.5*c.TILE_SIZE,1,1).data[3]>0);
 s.godMode=false;s.rubyShieldHP=0;s.rubyHP=70;for(let i=0;i<c.THORN_CONTACT_INTERVAL+2;i++)e.tick(s);assert.equal(s.rubyHP,70);
 s.rubyTileX=13;s.rubyTileY=9;for(let i=0;i<c.THORN_CONTACT_INTERVAL+2;i++)e.tick(s);assert.ok(s.rubyHP<70);
});

test('full Sunfire overlay fades in and out on the gameplay clock and freezes on pause',()=>{
 const{s}=fresh();s.gaia.sunCharge=c.GAIA_SUN_MAX;
 for(let i=0;i<15;i++)g.updateGaia(s);
 assert.ok(Math.abs(s.gaia.sunReadyFade-.5)<1e-8);
 s.gamePhase='paused';e.tick(s);assert.ok(Math.abs(s.gaia.sunReadyFade-.5)<1e-8);
 s.gamePhase='playing';for(let i=0;i<16;i++)g.updateGaia(s);assert.equal(s.gaia.sunReadyFade,1);
 s.gaia.sunCharge=0;for(let i=0;i<15;i++)g.updateGaia(s);assert.ok(Math.abs(s.gaia.sunReadyFade-.5)<1e-8);
 for(let i=0;i<16;i++)g.updateGaia(s);assert.equal(s.gaia.sunReadyFade,0);
});

test("Gaia's Roots removes her active thorn-field tiles inside its area, like Sunfire, and leaves fields outside it", () => {
  const { s, boss } = fresh();
  const [far] = roomTiles(s, (c.chamberOfTile(s.playerTileX, s.playerTileY) + 2) % 4);
  s.thornPatches = [{ x: s.playerX, y: s.playerY, radius: c.THORN_RADIUS, ticks: 500, ownerId: boss.id },
    { x: (far[0] + .5) * c.TILE_SIZE, y: (far[1] + .5) * c.TILE_SIZE, radius: c.THORN_RADIUS, ticks: 500, ownerId: boss.id }];
  const away = s.thornPatches[1];
  s.specialSkill = 'thorn_weaver'; s.specialLockTicks = 0;
  assert.equal(e.useSpecialSkill(s), true);
  assert.deepEqual(s.thornPatches, [away], 'the field under you is gone; the far one stays');
});

test('a Blossom heals the guardian from another chamber at the slightly raised rate, capped to its phase',()=>{
 const {s,boss,blossom}=blossomNearPlayer();
 const move=(unit,x,y)=>Object.assign(unit,{tileX:x,tileY:y,targetTileX:x,targetTileY:y,x:(x+.5)*c.TILE_SIZE,y:(y+.5)*c.TILE_SIZE});
 move(boss,...roomTiles(s,0)[0]);move(blossom,...roomTiles(s,3)[0]);
 s.gaia.growth.fill(0);s.gaia.blossomTimer=s.gaia.podTimer=s.gaia.snareTimer=1e9;blossom.phaseTimer=1e9;
 assert.notEqual(c.chamberOfTile(boss.tileX,boss.tileY),c.chamberOfTile(blossom.tileX,blossom.tileY));
 boss.hp=PH*1.5;s.gaia.secondTimer=1;g.updateGaia(s);
 assert.ok(Math.abs(boss.hp-(PH*1.5+19.5))<1e-9);
 boss.hp=PH*2-1;s.gaia.secondTimer=1;g.updateGaia(s);assert.equal(boss.hp,PH*2);
 assert.equal(c.GAIA_BLOSSOM_SHOT_GAP,180);assert.equal(c.GAIA_BLOSSOM_SHOT_DAMAGE,4);
});
