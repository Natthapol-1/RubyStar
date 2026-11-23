const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let source = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) source += '\nexport const moonTest = { damageEnemy, killEnemy, fireQueenBolt };';
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../game/engine.ts'), c = require('../game/constants.ts'), moon = require('../game/moon.ts'), api = e.moonTest;
// Runs fn with a fixed-seed Math.random (mulberry32), so a test that walks through random spawns is repeatable.
function seeded(seed,fn){const original=Math.random;let a=seed>>>0;Math.random=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};try{return fn();}finally{Math.random=original;}}

function fresh() {
  const s = e.createModeState('trial', 'splitter_queen');
  s.noMobs = true; s.meteoriteTimer = 100000;
  e.godSpawnBoss(s, 'splitter_queen');
  const boss = s.enemies.find(x => x.type === 'splitter_queen');
  return { s, boss };
}
const illusions = s => s.enemies.filter(x => x.type === 'moon_illusion');
const jump = (s, boss) => { boss.phaseTimer = 1; e.tick(s); };

test('the Moon guardian has three phases of HP and starts alone', () => {
  const { s, boss } = fresh();
  assert.equal(boss.maxHp, c.MOON_PHASE_HP * 3);
  assert.equal(s.moon.phase, 1);
  assert.equal(s.moon.bossId, boss.id);
  assert.equal(illusions(s).length, 0);
});

test('her first jump brings four illusions, later jumps two, up to the cap; no permanent echoes', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  assert.equal(illusions(s).length, c.MOON_FIRST_CLONES);
  jump(s, boss);
  assert.equal(illusions(s).length, c.MOON_FIRST_CLONES + c.MOON_CLONES_PER_JUMP);
  for (let i = 0; i < 4; i++) jump(s, boss);
  assert.equal(illusions(s).length, c.MOON_CLONE_CAPS[1]);
  assert.equal(s.enemies.filter(x => x.type === 'queen_echo').length, 0);
  assert.equal(boss.hp, boss.maxHp, 'no jump heal');
});

test('one illusion lands in her new chamber, and none in yours', () => {
  for (let run = 0; run < 20; run++) {
    const { s, boss } = fresh();
    jump(s, boss);
    const mine = c.chamberOfTile(s.playerTileX, s.playerTileY), hers = c.chamberOfTile(boss.tileX, boss.tileY);
    assert.ok(illusions(s).some(x => c.chamberOfTile(x.tileX, x.tileY) === hers));
    assert.ok(illusions(s).every(x => c.chamberOfTile(x.tileX, x.tileY) !== mine));
  }
});

test('she takes extra damage only while revealed, just before a jump', () => {
  const { s, boss } = fresh();
  boss.phaseTimer = c.MOON_REVEAL_TICKS + 1;
  api.damageEnemy(s, boss, 10, 'player');
  assert.equal(boss.maxHp - boss.hp, 10);
  assert.ok(moon.moonWearsGuise(s, boss));
  boss.phaseTimer = c.MOON_REVEAL_TICKS;
  const before = boss.hp;
  api.damageEnemy(s, boss, 10, 'player');
  assert.equal(before - boss.hp, 10 * c.MOON_REVEAL_DAMAGE_MULT);
  assert.ok(!moon.moonWearsGuise(s, boss));
});

test('her hits are softened; illusions use their own lighter damage', () => {
  const { s, boss } = fresh();
  e.damagePlayer(s, 10, boss);
  assert.equal(c.PLAYER_MAX_HP - s.playerHP, 10 * c.MOON_QUEEN_DAMAGE_MULT);
  assert.equal(c.ENEMY_CONFIGS.moon_illusion.attackCooldown, c.ENEMY_CONFIGS.splitter_queen.attackCooldown);
});

test('an illusion shot down shatters into a ring of shards that cut you; a meteor wipes it without shards', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  const victim = illusions(s)[0];
  // Put it right next to you so the shards fly through you.
  victim.x = s.playerX + c.TILE_SIZE * .8; victim.y = s.playerY; // close enough that the shard ring cannot miss you
  api.killEnemy(s, s.enemies.indexOf(victim));
  assert.equal(s.moon.shards.length, c.MOON_SHARD_COUNT);
  const hp = s.playerHP;
  for (let i = 0; i < 20; i++) e.tick(s);
  const lost = hp - s.playerHP; // at close range one or two neighbouring shards of the ring catch you, each once
  assert.ok(lost >= c.MOON_SHARD_DAMAGE && lost % c.MOON_SHARD_DAMAGE === 0 && lost <= 2 * c.MOON_SHARD_DAMAGE, 'shards cut you: ' + lost);
  s.moon.shards = [];
  const score = s.score, energy = s.starEnergy;
  api.killEnemy(s, s.enemies.indexOf(illusions(s)[0]), true);
  assert.equal(s.moon.shards.length, 0);
  api.killEnemy(s, s.enemies.indexOf(illusions(s)[0]));
  assert.deepEqual([s.score, s.starEnergy], [score, energy], 'illusions give no rewards');
});

test('defeating her clears every illusion and wins', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  boss.hp = 1;
  api.damageEnemy(s, boss, 5, 'player');
  api.killEnemy(s, s.enemies.indexOf(boss));
  assert.equal(illusions(s).length, 0);
  e.tick(s);
  assert.equal(s.gamePhase, 'won');
});

test('C marks the nearest Queen or illusion; the mark follows her jump, lasts a while, then recharges', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  const near = [boss, ...illusions(s)].sort((a, b) => Math.hypot(a.x - s.playerX, a.y - s.playerY) - Math.hypot(b.x - s.playerX, b.y - s.playerY))[0];
  assert.equal(moon.useMoonMark(s), true);
  assert.equal(s.moon.mark.id, near.id);
  assert.equal(moon.useMoonMark(s), false, 'on cooldown');
  // Mark the Queen herself: it rides along when she jumps.
  s.moon.mark = { id: boss.id, ticks: c.MOON_MARK_TICKS };
  const from = [boss.tileX, boss.tileY];
  jump(s, boss);
  assert.notDeepEqual([boss.tileX, boss.tileY], from);
  assert.equal(s.moon.mark.id, boss.id);
  for (let i = 0; i < c.MOON_MARK_TICKS; i++) e.tick(s);
  assert.equal(s.moon.mark, null, 'expires');
  for (let i = 0; i < c.MOON_MARK_COOLDOWN; i++) e.tick(s);
  assert.equal(moon.canUseMoonMark(s), true);
});

test('with a Lunar Echo out, her illusions shoot the decoy but the real Queen still shoots you', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  const clone = illusions(s)[0];
  for (const x of illusions(s)) if (x !== clone) s.enemies.splice(s.enemies.indexOf(x), 1);
  // Put you, the decoy, the Queen and one illusion in the same chamber, all in range.
  const [r1, c1] = c.CHAMBER_BOUNDS[0], at = (e, x, y) => { e.tileX = e.targetTileX = x; e.tileY = e.targetTileY = y; e.x = (x + .5) * c.TILE_SIZE; e.y = (y + .5) * c.TILE_SIZE; };
  Object.assign(s, { playerTileX: c1 + 4, playerTileY: r1 + 4, playerTargetX: c1 + 4, playerTargetY: r1 + 4, playerX: (c1 + 4.5) * c.TILE_SIZE, playerY: (r1 + 4.5) * c.TILE_SIZE });
  at(boss, c1 + 8, r1 + 4); at(clone, c1 + 4, r1 + 8);
  boss.phaseTimer = 10000; boss.attackTimer = clone.attackTimer = 0;
  s.lunarDecoy = { x: (c1 + 6.5) * c.TILE_SIZE, y: (r1 + 6.5) * c.TILE_SIZE, tileX: c1 + 6, tileY: r1 + 6, hitsLeft: 12, maxHits: 12, flashTicks: 0, invulnerableTicks: 0 };
  const hp = s.playerHP;
  for (let i = 0; i < c.QUEEN_WINDUP_TICKS + 3; i++) e.tick(s);
  assert.ok(s.playerHP < hp, 'the Queen hit you');
  assert.ok(s.lunarDecoy.hitsLeft < 12, 'the illusion hit the decoy');
});

test('mirror mites are fragile, spawn often on the Moon, and heal you well when killed', () => {
  const s = e.createModeState('trial', 'splitter_queen');
  s.meteoriteTimer = 100000; s.bossTimer = 100000;
  for (let i = 0; i < 3000 && !s.enemies.some(x => x.type === 'mirror_mite'); i++) e.tick(s);
  const mite = s.enemies.find(x => x.type === 'mirror_mite');
  assert.ok(mite, 'a mirror mite spawned');
  assert.ok(mite.maxHp < 2, 'one hit kills it');
  s.playerHP = 50;
  api.killEnemy(s, s.enemies.indexOf(mite));
  assert.equal(s.playerHP, 50 + 5 + c.MOON_MITE_KILL_HEAL);
});

test('a mirror mite kill shows two rooms on the minimap, one of them hers', () => {
  for (let run = 0; run < 20; run++) {
    const { s, boss } = fresh();
    const mite = e.createEncounterEnemy(s, 'mirror_mite', s.playerTileX + 2, s.playerTileY, 1);
    s.enemies.push(mite);
    api.killEnemy(s, s.enemies.indexOf(mite));
    const hers = c.chamberOfTile(boss.tileX, boss.tileY);
    assert.equal(s.moon.hint.rooms.length, 2);
    assert.ok(s.moon.hint.rooms.includes(hers));
    assert.notEqual(s.moon.hint.rooms[0], s.moon.hint.rooms[1]);
  }
  const { s } = fresh();
  s.moon.hint = { rooms: [0, 1], ticks: c.MOON_MITE_HINT_TICKS };
  for (let i = 0; i < c.MOON_MITE_HINT_TICKS; i++) e.tick(s);
  assert.equal(s.moon.hint, null, 'fades');
});

test('hitting the real Queen heals you only when she next jumps; illusions and meteors earn nothing', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  boss.phaseTimer = 10000; s.playerHP = 50; s.rubyHP = 40;
  api.damageEnemy(s, boss, 20, 'player');
  api.damageEnemy(s, illusions(s)[0], 2, 'player');
  api.damageEnemy(s, boss, 20, 'meteor');
  assert.equal(s.playerHP, 50, 'no heal on the hit');
  const departed={x:boss.x,y:boss.y,room:c.chamberOfTile(boss.tileX,boss.tileY)};
  jump(s, boss);
  const pulse=s.moon.healPulses.at(-1);assert.ok(pulse);
  assert.equal(pulse.x,departed.x);assert.equal(pulse.y,departed.y);assert.equal(pulse.room,departed.room);
  assert.notEqual(pulse.room,c.chamberOfTile(boss.tileX,boss.tileY),'healing effect stays in the old chamber');
  assert.deepEqual(pulse.targets.map(t=>t.ruby),[false,true]);
  assert.equal(s.playerHP, 50 + 20 * c.MOON_HIT_HEAL);
  assert.equal(s.rubyHP, 40 + 20 * c.MOON_HIT_HEAL, 'Ruby too');
  assert.equal(s.moon.healBank, 0);
});

test('Ruby shares the jump heal only when it is with you', () => {
  const { s, boss } = fresh();
  jump(s, boss);
  boss.phaseTimer = 10000; s.rubyHP = 40; s.playerCarryingRuby = false;
  // Ruby placed in a room you are not in.
  const mine = c.chamberOfTile(s.playerTileX, s.playerTileY), other = c.TELEPORT_PADS[(mine + 1) % 4];
  s.rubyTileX = other[0] + 1; s.rubyTileY = other[1];
  api.damageEnemy(s, boss, 20, 'player');
  jump(s, boss);
  assert.equal(s.rubyHP, 40, 'Ruby away from you gets nothing');
  s.rubyTileX = s.rubyTileY = -1; s.playerCarryingRuby = true;
  api.damageEnemy(s, boss, 20, 'player');
  jump(s, boss);
  assert.equal(s.rubyHP, 40 + 20 * c.MOON_HIT_HEAL, 'carried Ruby shares it');
});

test('her phase follows her HP and never goes back; the God buttons jump to a phase', () => {
  const { s, boss } = fresh();
  boss.phaseTimer = 10000;
  api.damageEnemy(s, boss, c.MOON_PHASE_HP + 1, 'player');
  e.tick(s);
  assert.equal(s.moon.phase, 1, 'no phase change while she is disguised');
  jump(s, boss);
  assert.equal(s.moon.phase, 2);
  assert.equal(s.bossSpawnName, 'PHASE 2');
  boss.hp = boss.maxHp; jump(s, boss);
  assert.equal(s.moon.phase, 2, 'healing never lowers the phase');
  moon.godSetMoonPhase(s, 3);
  assert.equal(s.moon.phase, 3);
  assert.ok(boss.hp <= c.MOON_PHASE_HP && boss.hp > c.MOON_PHASE_HP - 1);
});

test('a mite room hint clears as soon as she jumps', () => {
  const { s, boss } = fresh();
  s.moon.hint = { rooms: [0, 1], ticks: c.MOON_MITE_HINT_TICKS };
  jump(s, boss);
  assert.equal(s.moon.hint, null);
});

test('the guardian bar holds while she is disguised and catches up when she reveals or jumps', () => {
  const { s, boss } = fresh();
  boss.phaseTimer = 10000;
  api.damageEnemy(s, boss, 100, 'player');
  e.tick(s);
  assert.equal(s.moon.shownHp, boss.maxHp, 'a disguised hit does not show');
  boss.phaseTimer = c.MOON_REVEAL_TICKS; e.tick(s);
  assert.equal(s.moon.shownHp, boss.hp, 'revealed: the bar catches up');
  boss.phaseTimer = 10000; api.damageEnemy(s, boss, 50, 'player'); e.tick(s);
  assert.notEqual(s.moon.shownHp, boss.hp);
  jump(s, boss);
  assert.equal(s.moon.shownHp, boss.hp, 'a jump syncs it too');
});

test('a shade goes for a placed Ruby even with you right beside it, and for you while you carry Ruby', () => {
  const { s } = fresh();
  s.noMobs = true;
  if (s.rubyTileX === -1) e.toggleCarryRuby(s); // make sure Ruby is placed
  const [r1, c1] = c.CHAMBER_BOUNDS[0];
  const shade = e.createEncounterEnemy(s, 'moon_shade', c1 + 3, r1 + 3, 6);
  s.enemies.push(shade);
  Object.assign(s, { playerTileX: c1 + 4, playerTileY: r1 + 3, playerTargetX: c1 + 4, playerTargetY: r1 + 3, playerX: (c1 + 4.5) * c.TILE_SIZE, playerY: (r1 + 3.5) * c.TILE_SIZE });
  e.tick(s);
  assert.equal(shade.targeting, 'ruby');
  s.playerCarryingRuby = true; s.rubyTileX = s.rubyTileY = -1;
  e.tick(s);
  assert.equal(shade.targeting, 'player');
});

test('from phase 2 the illusion cap rises to 8 and mirror strips appear in every room', () => {
  const { s, boss } = fresh();
  assert.equal(s.moon.mirrors.length, 0, 'no mirrors in phase 1');
  moon.godSetMoonPhase(s, 2);
  assert.equal(s.moon.mirrors.length, 4 * c.MOON_MIRROR_STRIPS * c.MOON_MIRROR_LENGTH);
  for (const i of s.moon.mirrors) assert.equal(s.map[Math.floor(i / c.MAP_COLS)][i % c.MAP_COLS], c.T_FLOOR, 'on open floor');
  for (let k = 0; k < 6; k++) jump(s, boss);
  assert.equal(illusions(s).length, c.MOON_CLONE_CAPS[2]);
});

test('a mirror stops your laser and bullets and bounces their damage into you', () => {
  const { s, boss } = fresh();
  moon.godSetMoonPhase(s, 2);
  boss.phaseTimer = 10000;
  s.enemies = s.enemies.filter(x => x === boss);
  s.moon.mirrors = [];
  // You in an open row; a mirror 3 tiles to your right and an illusion just behind it.
  const [r1, c1, r2, c2] = c.CHAMBER_BOUNDS[0];
  let row = -1, col = -1;
  for (let y = r1 + 1; y < r2 && row < 0; y++) for (let x = c1 + 1; x + 6 < c2 && row < 0; x++)
    if ([0, 1, 2, 3, 4, 5].every(k => s.map[y][x + k] === c.T_FLOOR)) { row = y; col = x; }
  Object.assign(s, { playerTileX: col, playerTileY: row, playerTargetX: col, playerTargetY: row, playerX: (col + .5) * c.TILE_SIZE, playerY: (row + .5) * c.TILE_SIZE });
  s.moon.mirrors = [row * c.MAP_COLS + col + 3];
  const behind = e.createEncounterEnemy(s, 'moon_illusion', col + 4, row, 4);
  s.enemies.push(behind);
  boss.tileX = boss.tileY = 0; // out of the way
  const hp = s.playerHP;
  e.useLaser(s);
  assert.ok(Math.abs(hp - s.playerHP - c.LASER_DMG) < 1e-9, 'laser bounced into you');
  assert.equal(behind.hp, 4, 'nothing behind the mirror is hit');
  s.playerHP = hp; s.laserBullets = [{ x: col + .5, y: row + .5, dx: c.BULLET_SPEED, dy: 0, powered: false, ticks: 0, mirror: false }];
  for (let i = 0; i < 30 && s.laserBullets.length; i++) e.tick(s);
  assert.ok(Math.abs(hp - s.playerHP - c.BULLET_DMG) < 1e-9, 'bullet bounced into you');
  assert.equal(behind.hp, 4);
});

test('mimics come from phase 1; disguised, one looks like an illusion, stays put, never attacks and never changes back', () => {seeded(2,()=>{
  const p1 = e.createModeState('trial', 'splitter_queen');
  p1.meteoriteTimer = 100000; p1.immortal = true; // the Queen arrives as usual: mimics only come while she is here
  for (let i = 0; i < 2500; i++) e.tick(p1);
  assert.equal(p1.moon.phase, 1);
  assert.ok(p1.enemies.some(x => x.type === 'moon_mimic'), 'mimics already in phase 1');

  const { s, boss } = fresh();
  moon.godSetMoonPhase(s, 2);
  boss.attackTimer = boss.phaseTimer = 1e9; // keep her quiet so only the mimic could hurt you
  const [sx, sy] = c.CHAMBER_SPAWN_TILES[0][0], [px, py] = [[sx + 1, sy], [sx - 1, sy], [sx, sy + 1], [sx, sy - 1]].find(([x, y]) => s.map[y][x] === c.T_FLOOR);
  Object.assign(s, { playerTileX: px, playerTileY: py, playerTargetX: px, playerTargetY: py, playerX: (px + .5) * c.TILE_SIZE, playerY: (py + .5) * c.TILE_SIZE });
  s.enemies = s.enemies.filter(x => x.tileX !== sx || x.tileY !== sy);
  const mimic = e.createEncounterEnemy(s, 'moon_mimic', sx, sy, 5); // on a wall spot, right beside you
  mimic.mimic = { disguised: false, timer: 0 }; mimic.attackTimer = 0;
  s.enemies.push(mimic);
  e.tick(s);
  assert.ok(mimic.mimic.disguised);
  assert.ok(moon.moonWearsGuise(s, mimic), 'drawn exactly like an illusion');
  const hp = s.playerHP, at = [mimic.tileX, mimic.tileY];
  for (let i = 0; i < 200; i++) e.tick(s);
  assert.equal(s.playerHP, hp, 'never attacks while disguised');
  assert.deepEqual([mimic.tileX, mimic.tileY], at, 'stays put');
  for (let i = 0; i < 1200; i++) e.tick(s);
  assert.ok(mimic.mimic.disguised, 'stays disguised for good');
});});

test('a posing mimic has 1 HP: one laser breaks it', () => {
  const { s } = fresh();
  moon.godSetMoonPhase(s, 2);
  const [sx, sy] = c.CHAMBER_SPAWN_TILES[1][0];
  s.enemies = s.enemies.filter(x => x.tileX !== sx || x.tileY !== sy);
  const mimic = e.createEncounterEnemy(s, 'moon_mimic', sx, sy, 5);
  mimic.mimic = { disguised: false, timer: 0 };
  s.enemies.push(mimic);
  moon.updateMoonMimic(s, mimic);
  assert.equal(mimic.hp, 1);
  api.damageEnemy(s, mimic, c.LASER_DMG, 'player');
  assert.ok(mimic.hp <= 0);
});

test('before posing, a mimic walks to the nearest free wall-side spot where she and her illusions stand', () => {
  const { s } = fresh();
  moon.godSetMoonPhase(s, 2);
  s.enemies = s.enemies.filter(x => x.type === 'splitter_queen');
  const [sx, sy] = c.CHAMBER_SPAWN_TILES[0][0];
  // Start a few floor tiles away from that spot.
  const start = s.map.flatMap((row, y) => row.map((v, x) => [x, y, v])).filter(([x, y, v]) => v === c.T_FLOOR && c.chamberOfTile(x, y) === 0)
    .sort((a, b) => Math.abs(Math.hypot(a[0] - sx, a[1] - sy) - 3) - Math.abs(Math.hypot(b[0] - sx, b[1] - sy) - 3))[0];
  const mimic = e.createEncounterEnemy(s, 'moon_mimic', start[0], start[1], 5);
  mimic.mimic = { disguised: false, timer: 0 };
  s.enemies.push(mimic);
  for (let i = 0; i < 400 && !mimic.mimic.disguised; i++) moon.updateMoonMimic(s, mimic);
  assert.ok(mimic.mimic.disguised);
  assert.ok(c.CHAMBER_SPAWN_TILES.some(pool => pool.some(([x, y]) => x === mimic.tileX && y === mimic.tileY)), 'poses on a wall-side spot');
});

test('a mimic in its own form wanders and never attacks you, even right beside you', () => {
  const { s, boss } = fresh();
  moon.godSetMoonPhase(s, 2);
  s.enemies = s.enemies.filter(x => x === boss); boss.tileX = boss.tileY = 0;
  const [r1, c1] = c.CHAMBER_BOUNDS[0];
  Object.assign(s, { playerTileX: c1 + 4, playerTileY: r1 + 4, playerTargetX: c1 + 4, playerTargetY: r1 + 4, playerX: (c1 + 4.5) * c.TILE_SIZE, playerY: (r1 + 4.5) * c.TILE_SIZE });
  const mimic = e.createEncounterEnemy(s, 'moon_mimic', c1 + 5, r1 + 4, 5);
  mimic.mimic = { disguised: false, timer: 300 };
  s.enemies.push(mimic);
  const hp = s.playerHP;
  for (let i = 0; i < 280; i++) moon.updateMoonMimic(s, mimic);
  assert.equal(s.playerHP, hp);
  assert.ok(!mimic.mimic.disguised);
});

test('mirrors move to new spots every so often, never right under you', () => {
  const { s } = fresh();
  moon.godSetMoonPhase(s, 2);
  const before = s.moon.mirrors.join(',');
  for (let i = 0; i < c.MOON_MIRROR_SHIFT; i++) e.tick(s);
  assert.notEqual(s.moon.mirrors.join(','), before, 'they moved');
  assert.equal(s.moon.mirrors.length, 4 * c.MOON_MIRROR_STRIPS * c.MOON_MIRROR_LENGTH);
  assert.ok(!s.moon.mirrors.includes(s.playerTileY * c.MAP_COLS + s.playerTileX));
});

test('mimics arrive on their own timer from phase 1, up to a cap, without taking the place of other spawns', () => {
  const { s, boss } = fresh();
  s.noMobs = false;
  boss.phaseTimer = 1e9; boss.attackTimer = 1e9;
  s.immortal = true;
  s.spawnTimer = -1e9; // no regular aliens here: only the mimic timer runs (noMobs would also stop mimics)
  for (let i = 0; i < c.MOON_MIMIC_GAP + 1; i++) e.tick(s);
  assert.equal(s.enemies.filter(x => x.type === 'moon_mimic').length, 1);
  for (let i = 0; i < c.MOON_MIMIC_GAP * 8; i++) e.tick(s);
  assert.equal(s.enemies.filter(x => x.type === 'moon_mimic').length, c.MOON_MIMIC_CAP);
});

test('every wall-side spawn spot (used by bosses, illusions and mimics) is open floor', () => {
  const map = c.generateMap();
  c.CHAMBER_SPAWN_TILES.forEach((pool, room) => pool.forEach(([x, y]) => assert.equal(map[y][x], c.T_FLOOR, `room ${room} spot ${x},${y}`)));
});

test('phase 3 darkness hides units until hit and shifts away from the previous room', () => {
  const { s, boss } = fresh();
  moon.godSetMoonPhase(s, 2);
  assert.equal(s.moon.dark, -1, 'no dark in phase 2');
  moon.godSetMoonPhase(s, 3);
  const room = s.moon.dark;
  assert.ok(room >= 0 && room < 4);
  boss.attackTimer = boss.phaseTimer = 1e9;
  const [x, y] = c.CHAMBER_SPAWN_TILES[room][0];
  const mite = e.createEncounterEnemy(s, 'mirror_mite', x, y, 5);
  s.enemies.push(mite);
  assert.ok(moon.moonHiddenInDark(s, mite.tileX, mite.tileY, mite.id), 'hidden in the dark');
  api.damageEnemy(s, mite, 1, 'player');
  assert.ok(!moon.moonHiddenInDark(s, mite.tileX, mite.tileY, mite.id), 'a hit shows it');
  for (let i = 0; i < c.MOON_SEEN_TICKS; i++) e.tick(s);
  if (s.moon.dark === room) assert.ok(moon.moonHiddenInDark(s, mite.tileX, mite.tileY, mite.id), 'and it fades back into the dark');
  s.moon.darkTimer = 1; e.tick(s);
  assert.notEqual(s.moon.dark, room, 'the dark moved');
  moon.godSetMoonPhase(s, 1);
  assert.equal(s.moon.dark, -1);
});


test('jump heal visuals require banked healing, pause with gameplay and clear on defeat',()=>{
 const{s,boss}=fresh();jump(s,boss);assert.equal(s.moon.healPulses?.length??0,0);
 s.moon.healBank=10;jump(s,boss);assert.equal(s.moon.healPulses.length,1);
 const ticks=s.moon.healPulses[0].ticks;s.gamePhase='paused';e.tick(s);assert.equal(s.moon.healPulses[0].ticks,ticks);
 s.gamePhase='playing';boss.phaseTimer=10000;
 for(let i=0;i<90;i++)e.tick(s);assert.equal(s.moon.healPulses.length,0);
 s.moon.healBank=10;jump(s,boss);moon.clearMoonIllusions(s);assert.equal(s.moon.healPulses.length,0);
});


test('the Moon healing-wave sound plays once with the healing pulse, never on an empty jump',()=>{
 const ui=require('../game/ui-sfx.ts'),original=ui.playUiSfx,cues=[];
 ui.playUiSfx=kind=>cues.push(kind);
 try{
  const{s,boss}=fresh();jump(s,boss);assert.equal(cues.filter(k=>k==='moonHealingWave').length,0);
  s.moon.healBank=15;jump(s,boss);assert.ok(s.moon.healPulses.length);
  assert.equal(cues.filter(k=>k==='moonHealingWave').length,1);
  boss.phaseTimer=10000;for(let i=0;i<20;i++)e.tick(s);
  assert.equal(cues.filter(k=>k==='moonHealingWave').length,1,'no per-frame replay');
 }finally{ui.playUiSfx=original;}
});


test('Moon healing uses the requested gem recording once at original speed and pitch',()=>{
 const original=global.Audio,played=[];
 global.Audio=class{constructor(src){this.src=src;this.playbackRate=1;}play(){played.push(this);return Promise.resolve();}};
 try{
  require('../game/ui-sfx.ts').playUiSfx('moonHealingWave');
  assert.equal(played.length,1);assert.equal(played[0].src,'/sounds/gem_passive_2.wav');
  assert.equal(played[0].playbackRate,1);assert.equal(played[0].loop,false);assert.equal(played[0].volume,.75);
 }finally{if(original===undefined)delete global.Audio;else global.Audio=original;}
});


test('the real Moon Queen attack mix is 10% quieter than the ordinary Queen mix',()=>{
 const original=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this);return Promise.resolve();}pause(){}};
 try{
  const{s,boss}=fresh(),moonState=s.moon;s.invincible=true;s.moon=null;
  api.fireQueenBolt(s,boss,s.playerX,s.playerY,true);
  const normal=played.filter(a=>['/sounds/bossQueenAttack1.mp3','/sounds/gameModeClick.mp3'].includes(a.src)).slice(-2).map(a=>a.volume);
  s.moon=moonState;api.fireQueenBolt(s,boss,s.playerX,s.playerY,true);
  const quiet=played.filter(a=>['/sounds/bossQueenAttack1.mp3','/sounds/gameModeClick.mp3'].includes(a.src)).slice(-2).map(a=>a.volume);
  assert.equal(normal.length,2);quiet.forEach((v,i)=>assert.ok(Math.abs(v-normal[i]*.9)<1e-9));
 }finally{if(original===undefined)delete global.Audio;else global.Audio=original;}
});

test('a darkness shift can hide two distinct rooms and cross-fades both when it moves', () => {
  const { s } = fresh();
  s.moon.phase = 3;
  const random = Math.random;
  try {
    Math.random = () => .349;
    moon.moveMoonDark(s);
    const first = [s.moon.dark, s.moon.secondDark];
    assert.equal(new Set(first).size, 2);
    for (const room of first) assert.ok(moon.moonHiddenInDark(s, ...c.TELEPORT_PADS[room]));
    moon.moveMoonDark(s);
    assert.deepEqual([s.moon.oldDark, s.moon.oldSecondDark], first);
    assert.equal(s.moon.darkFade, c.MOON_DARK_FADE);
    assert.ok(!first.includes(s.moon.dark) && !first.includes(s.moon.secondDark));
    for (const room of first) assert.equal(moon.moonHiddenInDark(s, ...c.TELEPORT_PADS[room]), false);
    Math.random = () => .35;
    moon.moveMoonDark(s);
    assert.equal(s.moon.secondDark, -1);
  } finally {
    Math.random = random;
  }
});

test('darkness haze ramps in on entry and ramps out after leaving', () => {
  const { s } = fresh();
  s.moon.dark = 0;
  s.moon.secondDark = 1;
  s.moon.darkTimer = 300;
  [s.playerTileX, s.playerTileY] = c.TELEPORT_PADS[1];
  for (let i = 0; i < c.MOON_DARK_OVERLAY_TICKS; i++) moon.updateMoon(s);
  assert.equal(s.moon.darkOverlayTicks, c.MOON_DARK_OVERLAY_TICKS);
  [s.playerTileX, s.playerTileY] = c.TELEPORT_PADS[2];
  moon.updateMoon(s);
  assert.equal(s.moon.darkOverlayTicks, c.MOON_DARK_OVERLAY_TICKS - 1);
  for (let i = 1; i < c.MOON_DARK_OVERLAY_TICKS; i++) moon.updateMoon(s);
  assert.equal(s.moon.darkOverlayTicks, 0);
});

test('mirror strips never lie right alongside a wall (a one-tile gap is fine), and every room still gets its strips', () => {
  for (let run = 0; run < 25; run++) {
    const { s } = fresh(); moon.placeMoonMirrors(s);
    const set = new Set(s.moon.mirrors), strips = [];
    for (const i of s.moon.mirrors) { const x = i % c.MAP_COLS, y = Math.floor(i / c.MAP_COLS);
      if (!set.has(i - 1) && !set.has(i - c.MAP_COLS)) strips.push(set.has(i + 1) ? [[x, y], [x + 1, y], [x + 2, y]] : [[x, y], [x, y + 1], [x, y + 2]]); }
    assert.equal(strips.length, 4 * c.MOON_MIRROR_STRIPS);
    for (const strip of strips) {
      const vertical = strip[0][0] === strip[1][0], [sx, sy] = vertical ? [1, 0] : [0, 1];
      for (const side of [1, -1]) assert.ok(strip.filter(([x, y]) => s.map[y + sy * side]?.[x + sx * side] !== c.T_FLOOR).length < 2, 'not hugging a wall');
    }
  }
});

test('darkness entry plays once and reentry restarts the clip while the haze is still fading', () => {
  const audio = require('../game/event-audio.ts');
  const { s } = fresh();
  const previousAudio = global.Audio, entries = [];
  global.Audio = class {
    constructor(src) { this.src = src; }
    play() { if (this.src === '/sounds/moon-darkness-entry.mp3') entries.push(this); return Promise.resolve(); }
    pause() { this.paused = true; }
  };
  try {
    s.moon.dark = 0;
    s.moon.secondDark = 1;
    s.moon.darkTimer = 300;
    [s.playerTileX, s.playerTileY] = c.TELEPORT_PADS[1];
    for (let i = 0; i < 5; i++) moon.updateMoon(s);
    assert.equal(entries.length, 1);
    [s.playerTileX, s.playerTileY] = c.TELEPORT_PADS[2];
    moon.updateMoon(s);
    assert.equal(entries.length, 1);
    [s.playerTileX, s.playerTileY] = c.TELEPORT_PADS[0];
    moon.updateMoon(s);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].paused, true);
  } finally {
    audio.stopAmbientEventSounds();
    global.Audio = previousAudio;
  }
});

test('Blinkers join the regular spawns only from phase 3, up to the cap', () => {seeded(3,()=>{
  const run = phase => {
    const s = e.createModeState('trial', 'splitter_queen');
    s.meteoriteTimer = 100000; s.bossTimer = 100000; s.immortal = true; s.moon.phase = phase;
    let most = 0;
    for (let i = 0; i < 6000; i++) { e.tick(s); s.moon.phase = phase; most = Math.max(most, s.enemies.filter(x => x.type === 'blinker').length); }
    return most;
  };
  assert.equal(run(1), 0, 'none before phase 3');
  const most = run(3);
  assert.ok(most >= 1 && most <= c.MOON_BLINKER_MAX, 'phase 3 spawns them, capped: ' + most);
});});

// A floor row with room: Ruby at (x, y), floor at x-1 (shade) and x+1..x+push (its landing tiles).
function rubyRow(s) {
  for (let y = 2; y < c.MAP_ROWS - 2; y++) for (let x = 2; x < c.MAP_COLS - 4; x++) {
    let ok = true;
    for (let k = -1; k <= c.MOON_SHADE_RUBY_PUSH; k++) if (s.map[y][x + k] !== c.T_FLOOR) ok = false;
    if (ok) return [x, y];
  }
}
const stepPush = s => { for (let i = 0; i < c.MOON_RUBY_PUSH_STEP * (c.MOON_SHADE_RUBY_PUSH + 1); i++) moon.updateMoon(s); };

test('a shade hit shoves a placed Ruby away from it, a tile at a time', () => {
  const { s } = fresh();
  const [x, y] = rubyRow(s);
  s.playerCarryingRuby = false; s.rubyTileX = x; s.rubyTileY = y;
  const shade = e.createEncounterEnemy(s, 'moon_shade', x - 1, y, 6);
  moon.moonShadePushRuby(s, shade);
  moon.updateMoon(s);
  assert.equal(s.rubyTileX, x + 1, 'first hop right away');
  stepPush(s);
  assert.deepEqual([s.rubyTileX, s.rubyTileY], [x + c.MOON_SHADE_RUBY_PUSH, y]);
  assert.equal(s.moon.rubyPush, null);
});

test('walls stop the shove, and picking Ruby up cancels it', () => {
  const { s } = fresh();
  const [x, y] = rubyRow(s);
  s.playerCarryingRuby = false; s.rubyTileX = x; s.rubyTileY = y;
  s.map[y][x + 1] = c.T_WALL; // cover right behind Ruby
  moon.moonShadePushRuby(s, e.createEncounterEnemy(s, 'moon_shade', x - 1, y, 6));
  stepPush(s);
  assert.deepEqual([s.rubyTileX, s.rubyTileY], [x, y], 'blocked by the wall');
  s.map[y][x + 1] = c.T_FLOOR;
  moon.moonShadePushRuby(s, e.createEncounterEnemy(s, 'moon_shade', x - 1, y, 6));
  s.rubyTileX = -1; // carried
  stepPush(s);
  assert.equal(s.moon.rubyPush, null);
});

test('in play, a shade striking a placed Ruby hurts and shoves it', () => {
  const { s, boss } = fresh();
  const [x, y] = rubyRow(s);
  s.enemies = s.enemies.filter(en => en === boss); boss.attackTimer = 1e9;
  s.playerCarryingRuby = false; s.rubyTileX = x; s.rubyTileY = y; s.rubyShieldHP = 0;
  const shade = e.createEncounterEnemy(s, 'moon_shade', x - 1, y, 6); shade.attackTimer = 0; s.enemies.push(shade);
  const hp = s.rubyHP;
  for (let i = 0; i < 3 && s.rubyHP === hp; i++) e.tick(s);
  assert.ok(s.rubyHP < hp, 'Ruby hit');
  for (let i = 0; i < 20; i++) e.tick(s);
  assert.ok(s.rubyTileX > x, `pushed right: ${s.rubyTileX} from ${x}`);
});

test('a Crystal Hound is fast, and its bite hurts a little and knocks you back', () => {
  const { s, boss } = fresh();
  for (const other of ['moon_shade', 'mirror_mite', 'moon_mimic']) assert.ok(c.ENEMY_CONFIGS.moon_hound.speed > c.ENEMY_CONFIGS[other].speed, 'faster than ' + other);
  const [x, y] = rubyRow(s); // a free floor row: the hound at x-1, you at x, room behind you
  s.enemies = s.enemies.filter(en => en === boss); boss.attackTimer = 1e9; boss.phaseTimer = 1e9;
  s.playerCarryingRuby = false; s.rubyTileX = 2; s.rubyTileY = 2; // Ruby placed far off: the hound comes for you, and the push is full length
  s.godMode = false; s.playerShieldHP = 0;
  s.playerTileX = s.playerTargetX = x; s.playerTileY = s.playerTargetY = y; s.playerX = (x + .5) * c.TILE_SIZE; s.playerY = (y + .5) * c.TILE_SIZE; s.playerKnockback = null;
  const hound = e.createEncounterEnemy(s, 'moon_hound', x - 1, y, 10); hound.attackTimer = 0; s.enemies.push(hound);
  const hp = s.playerHP;
  for (let i = 0; i < 3 && s.playerHP === hp; i++) e.tick(s);
  assert.ok(s.playerHP < hp, 'bitten');
  assert.ok(s.playerKnockback, 'knocked back');
  assert.equal(s.playerKnockback.dirX, 1, 'away from the hound');
  assert.equal(s.playerKnockback.tilesLeft, c.MOON_HOUND.knockback);
});

test('a mirror mite dies to any damaging hit, even a weak bullet late in a run', () => {
  const { s } = fresh();
  const [x, y] = rubyRow(s);
  const mite = e.createEncounterEnemy(s, 'mirror_mite', x, y, 3); s.enemies.push(mite); // as if scaled up
  api.damageEnemy(s, mite, .35);
  assert.ok(mite.hp <= 0, `mite left at ${mite.hp}`);
});

test('a Crystal Hound ignores a placed Ruby right beside it and hunts you', () => {
  const { s, boss } = fresh();
  const [x, y] = rubyRow(s);
  s.enemies = s.enemies.filter(en => en === boss); boss.attackTimer = 1e9; boss.phaseTimer = 1e9;
  s.playerCarryingRuby = false; s.rubyTileX = x; s.rubyTileY = y; s.rubyShieldHP = 0;
  const hound = e.createEncounterEnemy(s, 'moon_hound', x - 1, y, 16); hound.attackTimer = 0; s.enemies.push(hound);
  const rubyHp = s.rubyHP;
  for (let i = 0; i < 30; i++) e.tick(s);
  assert.equal(s.rubyHP, rubyHp, 'Ruby untouched');
  assert.equal(hound.targeting, 'player');
});

// Two placed-Ruby spots: one in the shade's chamber, one in another chamber.
const roomFloor = (s, room) => { const [r1, c1, r2, c2] = c.CHAMBER_BOUNDS[room]; for (let y = r1 + 2; y < r2 - 1; y++) for (let x = c1 + 2; x < c2 - 1; x++) if (s.map[y][x] === c.T_FLOOR && !c.TELEPORT_PADS.some(p => p[0] === x && p[1] === y)) return [x, y]; };
function shadeIn(room) {
  const { s, boss } = fresh();
  s.enemies = s.enemies.filter(en => en === boss); boss.attackTimer = 1e9; boss.phaseTimer = 1e9;
  const [x, y] = roomFloor(s, room);
  const shade = e.createEncounterEnemy(s, 'moon_shade', x, y, 6); s.enemies.push(shade);
  s.playerCarryingRuby = false; s.godMode = false; s.immortal = true; s.rubyShieldHP = 0; // Ruby can take damage, so a hit shows
  return { s, shade };
}

test('a shade never leaves its chamber, even when Ruby is placed in another one', () => {
  const { s, shade } = shadeIn(0);
  const [rx, ry] = roomFloor(s, 3); s.rubyTileX = rx; s.rubyTileY = ry;
  const rubyHp = s.rubyHP;
  for (let i = 0; i < 1800; i++) { e.tick(s); assert.equal(c.chamberOfTile(shade.tileX, shade.tileY), 0, 'stays home'); }
  assert.equal(s.rubyHP, rubyHp, 'Ruby elsewhere is safe from it');
});

test('a shade hunts Ruby placed in its own chamber', () => {
  const { s, shade } = shadeIn(0);
  const [rx, ry] = roomFloor(s, 0);
  s.rubyTileX = rx + 4 < c.CHAMBER_BOUNDS[0][3] && s.map[ry][rx + 4] === c.T_FLOOR ? rx + 4 : rx; s.rubyTileY = ry;
  s.rubyShieldHP = 0; const rubyHp = s.rubyHP;
  for (let i = 0; i < 1200 && s.rubyHP === rubyHp; i++) e.tick(s);
  assert.ok(s.rubyHP < rubyHp, 'Ruby in its chamber gets hit');
  assert.equal(c.chamberOfTile(shade.tileX, shade.tileY), 0);
});

test('a shade lines up on the pad side of Ruby, so its shove pushes Ruby away from the pad', () => {
  for (const room of [0, 1, 2, 3]) {
    const { s, shade } = shadeIn(room);
    const pad = c.TELEPORT_PADS.find(([px, py]) => c.chamberOfTile(px, py) === room);
    // Ruby three tiles from the pad with open floor around it (any side), the shade starting elsewhere in the room.
    const spots = [[3, 0], [-3, 0], [0, 3], [0, -3]].map(([dx, dy]) => [pad[0] + dx, pad[1] + dy])
      .filter(([x, y]) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => s.map[y + b]?.[x + a] === c.T_FLOOR));
    assert.ok(spots.length, 'room ' + room + ' has an open spot near its pad');
    const [rx, ry] = spots[0]; s.rubyTileX = rx; s.rubyTileY = ry;
    const before = Math.hypot(rx - pad[0], ry - pad[1]), hp = s.rubyHP;
    for (let i = 0; i < 1500 && s.rubyHP === hp; i++) e.tick(s);
    assert.ok(s.rubyHP < hp, 'room ' + room + ': Ruby hit');
    for (let i = 0; i < 20; i++) e.tick(s); // let the shove finish
    assert.ok(Math.hypot(s.rubyTileX - pad[0], s.rubyTileY - pad[1]) > before, `room ${room}: pushed away from the pad (${before} -> ${Math.hypot(s.rubyTileX - pad[0], s.rubyTileY - pad[1])})`);
    assert.equal(c.chamberOfTile(shade.tileX, shade.tileY), room);
  }
});

test('a shade cannot be knocked back', () => {
  const { s, shade } = shadeIn(0);
  const at = [shade.tileX, shade.tileY];
  shade.pushDirX = 1; shade.pushDirY = 0; shade.pushTiles = 3; // as a Wave would push it
  e.tick(s); e.tick(s);
  assert.equal(shade.pushTiles, 0);
  assert.ok(Math.abs(shade.tileX - at[0]) + Math.abs(shade.tileY - at[1]) <= 1, 'not shoved several tiles');
});

test('shades join the regular spawns only from phase 2', () => {
  const run = phase => {
    const s = e.createModeState('trial', 'splitter_queen');
    s.meteoriteTimer = 1e5; s.bossTimer = 1e5; s.immortal = true; s.moon.phase = phase;
    let seen = 0;
    for (let i = 0; i < 4000; i++) {
      e.tick(s); s.moon.phase = phase;
      if (i % 300 === 0) { seen += s.enemies.filter(x => x.type === 'moon_shade').length; s.enemies = s.enemies.filter(x => x.type === 'splitter_queen'); } // clear room for new spawns
    }
    return seen + s.enemies.filter(x => x.type === 'moon_shade').length;
  };
  assert.equal(run(1), 0, 'none in phase 1');
  assert.ok(run(2) > 0, 'they appear in phase 2');
});
