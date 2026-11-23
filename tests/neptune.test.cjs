const assert = require('node:assert/strict'), fs = require('node:fs'), test = require('node:test'), ts = require('typescript');
require.extensions['.ts'] = (m, f) => {
  let source = fs.readFileSync(f, 'utf8');
  if (f.endsWith('engine.ts')) source += '\nexport const neptuneTest = { damageEnemy, killEnemy, healPlayer, damagePlayer };';
  m._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, f);
};
const e = require('../game/engine.ts'), c = require('../game/constants.ts'), api = e.neptuneTest, nep = require('../game/neptune.ts');
const HP = c.NEPTUNE_PHASE_HPS, TOTAL = c.NEPTUNE_TOTAL_HP, F1 = HP[2] + HP[3]; // phase 1 sits above phases 2 and 3
function allowNeptuneMobs(s) { s.noMobs = false; s.spawnTimer = 1e9; }

function fresh() {
  const s = e.createModeState('trial', 'sea_chanter');
  s.noMobs = true; s.godMode = true; s.meteoriteTimer = 100000; s.neptune.fishTimer = 100000; s.neptune.tideTimer = 100000; s.neptune.sharkTimer = 1e9; s.neptune.jellyTimer = 1e9;
  e.godSpawnBoss(s, 'sea_chanter');
  const boss = s.enemies.find(x => x.type === 'sea_chanter');
  boss.attackTimer = boss.sea.songCooldown = 100000;
  return { s, boss };
}
const clones = s => s.enemies.filter(x => x.type === 'water_clone');
function dropAllClones(s) { for (let i = 0; i < 1200 && s.neptune.dive?.dropsLeft; i++) e.tick(s); }

test('the guardian carries three phases and cannot be pushed below the current phase', () => {
  const { s, boss } = fresh();
  assert.equal(boss.maxHp, TOTAL); assert.equal(boss.hp, TOTAL); assert.equal(s.neptune.phase, 1);
  api.damageEnemy(s, boss, 5000);
  assert.ok(boss.hp > F1 && boss.hp < F1 + 1, 'held at the phase floor: ' + boss.hp);
  assert.ok(s.enemies.includes(boss));
});

test('God Next Dive selects the next lower armed dive threshold', () => {
  const { s, boss } = fresh();
  assert.equal(nep.godDiveToNextThreshold(s), true);
  assert.ok(Math.abs(boss.hp - (F1 + (2/3) * HP[1])) < .01);
  e.tick(s); assert.equal(s.neptune.dive.point, 2/3);
  assert.equal(nep.godDiveToNextThreshold(s), false, 'cannot skip ahead during a dive');

  nep.godSetNeptunePhase(s, 2); s.neptune.armed[0] = false;
  assert.equal(nep.godDiveToNextThreshold(s), true);
  assert.ok(Math.abs(boss.hp - (HP[3] + .33 * HP[2])) < .01, 'skips an already-cleared threshold');
});

test('phase 1 completes after three equal dive intervals', () => {
  const {s,boss}=fresh();let previous=TOTAL;
  assert.equal(TOTAL,6750);assert.equal(HP[1],2000);
  assert.deepEqual(c.NEPTUNE_DIVE_POINTS[1],[2/3,1/3,0]);
  for(const point of c.NEPTUNE_DIVE_POINTS[1]){
    const target=F1+point*HP[1];assert.ok(Math.abs(previous-target-HP[1]/3)<.01);
    boss.hp=target+.1;e.tick(s);assert.equal(s.neptune.dive,null,'not before the threshold');
    api.damageEnemy(s,boss,1);e.tick(s);assert.equal(s.neptune.dive.point,point);dropAllClones(s);
    for(const clone of clones(s))api.damageEnemy(s,clone,100);
    e.tick(s);e.tick(s);previous=target;
  }
  assert.equal(s.neptune.phase,2);assert.equal(s.neptune.dive,null);assert.ok(Math.abs(boss.hp-F1)<.1);
});

test('older phase-1 snapshots keep the final dive available with the reduced HP pool',()=>{
  const{s,boss}=fresh();boss.maxHp=7200;boss.hp=F1+.01;s.neptune.armed=[false,false,false,true];
  const saved=JSON.parse(JSON.stringify(s));e.tick(saved);
  assert.equal(saved.enemies.find(x=>x.id===boss.id).maxHp,6750);
  assert.equal(saved.neptune.armed.length,3);assert.equal(saved.neptune.dive.point,0);
});

test('crossing a dive point dives; destroying every clone snaps HP down to the point', () => {
  const { s, boss } = fresh();
  boss.hp = F1 + (2/3) * HP[1] - 1; e.tick(s);
  assert.ok(s.neptune.dive, 'dive started'); assert.ok(e.isSeaChanterDiving(boss));
  e.tick(s);
  assert.equal(s.neptune.dive.dropsLeft, 0, 'all clones appear together'); assert.equal(clones(s).length, c.NEPTUNE_CLONES[1]);
  assert.equal(new Set(clones(s).map(x => c.chamberOfTile(x.tileX, x.tileY))).size, c.NEPTUNE_CLONES[1], 'each clone in its own room');
  boss.hp += 20; // ally healing during the dive
  for (const clone of clones(s)) api.damageEnemy(s, clone, 100);
  e.tick(s); e.tick(s);
  assert.equal(s.neptune.dive, null); assert.ok(!e.isSeaChanterDiving(boss));
  assert.ok(Math.abs(boss.hp - (F1 + (2/3) * HP[1])) < .5, 'snapped to two-thirds: ' + boss.hp);
  assert.ok(boss.sea.resurfaceTicks > 0, 'she resurfaces as soon as the last clone is gone');
  assert.ok(s.neptune.resurfaceEffectTicks > 0, 'clearing all clones still triggers the resurface effect');
  assert.equal(s.neptune.resurfaceHealed, false, 'clearing all clones does not show healing');
});

test('surviving clones each restore 10% of the phase when time runs out, never past the phase top', () => {
  const { s, boss } = fresh();
  boss.hp = F1 + (1/3) * HP[1] - 1; s.neptune.armed = [false, true, true]; e.tick(s);
  dropAllClones(s);
  api.damageEnemy(s, clones(s)[0], 100);
  const before = boss.hp;
  for (let i = 0; i < c.NEPTUNE_DIVE_TICKS[1] && s.neptune.dive; i++) e.tick(s);
  assert.equal(s.neptune.dive, null);
  assert.ok(Math.abs(boss.hp - (before + 2 * c.NEPTUNE_CLONE_HEAL * HP[1])) < 1, 'healed by two clones: ' + boss.hp);
  assert.equal(s.neptune.resurfaceEffectTicks, c.NEPTUNE_CLONE_HEAL_FX_TICKS);
  assert.equal(s.neptune.resurfaceHealed, true);
  boss.hp = TOTAL + 50; e.tick(s); assert.equal(boss.hp, TOTAL, 'capped at the phase top');
});

test('cleared phase-1 points stay finished when healing restores HP',()=>{
  const{s,boss}=fresh();boss.hp=F1+1000-1;e.tick(s);dropAllClones(s);
  for(const clone of clones(s))api.damageEnemy(s,clone,100);e.tick(s);e.tick(s);
  nep.healNeptune(s,boss,1000);e.tick(s);assert.equal(s.neptune.armed[0],false);
  boss.hp=F1+999;e.tick(s);assert.equal(s.neptune.dive,null,'no repeated cleared dive');
  boss.hp=F1+499;e.tick(s);assert.equal(s.neptune.dive.point,1/3);
});

test('a failed phase-1 dive re-arms so healing cannot strand the phase',()=>{
  const{s,boss}=fresh();boss.hp=F1+1000-1;e.tick(s);dropAllClones(s);s.neptune.dive.ticks=1;e.tick(s);
  assert.equal(s.neptune.armed[0],true);boss.hp=F1+999;e.tick(s);assert.equal(s.neptune.dive.point,2/3);
});

test('later-phase dive points still re-arm when she heals above them', () => {
  const { s, boss } = fresh();nep.godSetNeptunePhase(s,2);
  boss.hp=HP[3]+.66*HP[2]-1;e.tick(s);dropAllClones(s);
  for(const clone of clones(s))api.damageEnemy(s,clone,100);e.tick(s);e.tick(s);
  boss.hp=HP[3]+.9*HP[2];e.tick(s);assert.equal(s.neptune.armed[0],true);
  boss.hp=HP[3]+.65*HP[2];e.tick(s);assert.equal(s.neptune.dive.point,.66);
});

test('hitting a clone pauses her ally-feeding heal, and clones swim', () => {
  const { s, boss } = fresh();
  boss.hp = F1 + (2/3) * HP[1] - 1; e.tick(s); dropAllClones(s);
  const clone = clones(s)[0];
  api.damageEnemy(s, clone, 1);
  assert.ok(boss.sea.healingBlockedUntilTick >= s.gameTick + c.NEPTUNE_CLONE_HEAL_BLOCK - 1);
  const start = [clone.x, clone.y]; for (let i = 0; i < 90; i++) e.tick(s);
  assert.ok(clone.x !== start[0] || clone.y !== start[1] || clone.stepProgress > 0, 'clone moves');
});

test('destroying an echo heals twenty HP each while keeping its Chorus contribution', () => {
  const { s } = fresh();
  s.playerHP = 40; s.rubyHP = 35; s.neptune.healCharge = 0;
  const clone = e.createEncounterEnemy(s, 'water_clone', 5, 5, c.ENEMY_CONFIGS.water_clone.maxHp);
  s.enemies.push(clone); api.damageEnemy(s, clone, 100); api.killEnemy(s, s.enemies.indexOf(clone));
  assert.equal(s.playerHP, 60); assert.equal(s.rubyHP, 55);
  assert.ok(Math.abs(s.neptune.healCharge - 10 * c.NEPTUNE_HEAL_CHARGE_RATE) < 1e-8);
});

test('a clone bursts to 3x flee speed for one second with a 10-second cooldown', () => {
  const { s } = fresh();
  s.map = Array.from({length:12},(_,y)=>Array.from({length:12},(_,x)=>x===0||y===0||x===11||y===11?c.T_WALL:c.T_FLOOR));
  s.playerTileX=s.playerTargetX=3;s.playerTileY=s.playerTargetY=5;s.playerX=3.5*c.TILE_SIZE;s.playerY=5.5*c.TILE_SIZE;
  const clone=e.createEncounterEnemy(s,'water_clone',5,5,c.ENEMY_CONFIGS.water_clone.maxHp);s.enemies.push(clone);
  nep.updateFish(s,clone);
  assert.equal(clone.neptuneCloneMode,'flee');
  assert.equal(clone.neptuneFleeBurstTicks,c.NEPTUNE_CLONE_FLEE_BURST_TICKS);
  assert.equal(clone.neptuneFleeBurstCooldown,c.NEPTUNE_CLONE_FLEE_BURST_COOLDOWN);
  nep.updateFish(s,clone);
  assert.equal(clone.stepProgress,c.ENEMY_CONFIGS.water_clone.speed*c.MOVE_SPEED_MULT*c.NEPTUNE_CLONE_FLEE_BURST_MULT);
  for(let i=0;i<59;i++)nep.updateFish(s,clone);
  assert.equal(clone.neptuneFleeBurstTicks,0);

  clone.tileX=clone.targetTileX=5;clone.tileY=clone.targetTileY=5;clone.stepProgress=0;clone.x=5.5*c.TILE_SIZE;clone.y=5.5*c.TILE_SIZE;clone.neptuneCloneMode='roam';
  nep.updateFish(s,clone);
  assert.equal(clone.neptuneFleeBurstTicks,0,'no repeat while the cooldown is active');
  for(let i=0;i<c.NEPTUNE_CLONE_FLEE_BURST_COOLDOWN-c.NEPTUNE_CLONE_FLEE_BURST_TICKS-2;i++){
    clone.tileX=clone.targetTileX=5;clone.tileY=clone.targetTileY=5;clone.stepProgress=0;clone.x=5.5*c.TILE_SIZE;clone.y=5.5*c.TILE_SIZE;clone.neptuneCloneMode='roam';
    nep.updateFish(s,clone);
  }
  assert.equal(clone.neptuneFleeBurstTicks,0);
  clone.tileX=clone.targetTileX=5;clone.tileY=clone.targetTileY=5;clone.stepProgress=0;clone.x=5.5*c.TILE_SIZE;clone.y=5.5*c.TILE_SIZE;clone.neptuneCloneMode='roam';
  nep.updateFish(s,clone);
  assert.equal(clone.neptuneFleeBurstTicks,c.NEPTUNE_CLONE_FLEE_BURST_TICKS,'burst is ready after 10 seconds');
});

test('the final dive of a phase moves to the next phase; clearing the phase 3 final dive defeats her', () => {
  const { s, boss } = fresh();
  for (const phase of [1, 2, 3]) {
    assert.equal(s.neptune.phase, phase);
    api.damageEnemy(s, boss, 5000); s.neptune.armed = s.neptune.armed.map((_, i, all) => i === all.length - 1);
    e.tick(s); assert.ok(s.neptune.dive && s.neptune.dive.point === 0, 'final dive of phase ' + phase);
    dropAllClones(s); assert.equal(clones(s).length, c.NEPTUNE_CLONES[phase]);
    for (const clone of clones(s)) api.damageEnemy(s, clone, 100);
    e.tick(s); e.tick(s);
  }
  assert.equal(s.gamePhase, 'won', 'no last hit needed');
  assert.ok(!s.enemies.includes(boss) || boss.hp <= 0, 'she is defeated');
});

test('every phase 3 dive drops three faster echoes', () => {
  const { s, boss } = fresh();
  nep.godSetNeptunePhase(s, 3);
  boss.hp = .65 * HP[3]; e.tick(s); assert.ok(s.neptune.dive && s.neptune.dive.point > 0);
  dropAllClones(s); assert.equal(clones(s).length, 3);
});

test('phase 2 water balls: popping one hurts her, letting it burst hurts you', () => {
  const { s, boss } = fresh();
  s.neptune.phase = 2; s.neptune.armed = [false, false, false]; boss.hp = HP[3] + .9 * HP[2]; s.neptune.bombTimer = 1; s.godMode = false;
  e.tick(s);
  let ball = s.enemies.find(x => x.type === 'water_bomb'); assert.ok(ball);
  const hp = boss.hp; api.damageEnemy(s, ball, 100); e.tick(s);
  assert.ok(Math.abs(boss.hp - (hp - c.NEPTUNE_BOMB_SELF_DAMAGE * HP[2])) < .5, 'self damage: ' + boss.hp);
  s.neptune.bombTimer = 1; e.tick(s); ball = s.enemies.find(x => x.type === 'water_bomb');
  const playerHP = s.playerHP; for (let i = 0; i < c.NEPTUNE_BOMB_FUSE + 2; i++) e.tick(s);
  assert.ok(!s.enemies.includes(ball)); assert.ok(s.playerHP <= playerHP - c.NEPTUNE_BOMB_DAMAGE + .01);
});

test('only Melody breaks fish; blue heals, red hurts, and distant fish survive', () => {
  const { s, boss } = fresh(); s.godMode = false; s.playerHP = 50;
  const spawn = (type, distance=0) => { const f = { ...boss, id: s.nextEnemyId++, type, hp: 1, maxHp: 1, sea: undefined, x:s.playerX+distance*c.TILE_SIZE,y:s.playerY }; s.enemies.push(f); return f; };
  const blue=spawn('fish_blue'),red=spawn('fish_red'),far=spawn('fish_blue',8);
  for(const source of ['player','meteor','enemy','special','reflection','summon']){
    api.damageEnemy(s,blue,100,source);api.damageEnemy(s,red,100,source);
    assert.equal(blue.hp,1);assert.equal(red.hp,1);
  }
  api.killEnemy(s,s.enemies.indexOf(blue),true);assert.ok(s.enemies.includes(blue),'meteor cannot bypass immunity');
  assert.equal(s.playerHP,50);nep.useOceanMelody(s);
  assert.equal(blue.hp,0);assert.equal(red.hp,0);assert.equal(far.hp,1);
  assert.equal(s.playerHP,50+c.NEPTUNE_FISH_HEAL-c.NEPTUNE_FISH_HURT);
  const hp=s.playerHP;nep.useOceanMelody(s);assert.equal(s.playerHP,hp,'already broken fish cannot trigger again');
  boss.hp = F1 + (2/3) * HP[1] - 1; e.tick(s); assert.ok(e.isSeaChanterDiving(boss));
  const bossHP=boss.hp,player=s.playerHP;const divingBlue=spawn('fish_blue');nep.useOceanMelody(s);
  assert.equal(divingBlue.hp,0);assert.equal(s.playerHP,player);
  assert.ok(Math.abs(boss.hp-(bossHP+c.NEPTUNE_FISH_BOSS_HEAL*HP[1]))<.01);
});

test('healing charges the sky laser; it strikes the chosen room like a meteor for a share of phase HP', () => {
  const { s, boss } = fresh(); s.godMode = false; s.playerHP = 10;
  assert.equal(nep.openSkyLaser(s), false);
  for (let i = 0; i < 20; i++) { s.playerHP = 10; api.healPlayer(s, 10); if(i===0)assert.ok(Math.abs(s.neptune.healCharge-9.3)<1e-9,'healing charges Ocean’s Chorus at 93% rate'); }
  assert.equal(s.neptune.healCharge, c.NEPTUNE_HEAL_CHARGE_MAX);
  assert.ok(nep.openSkyLaser(s)); assert.equal(s.gamePhase, 'laserTarget');
  const room = c.chamberOfTile(boss.tileX, boss.tileY);
  assert.ok(e.chooseSkyLaser(s, room)); assert.equal(s.neptune.healCharge, 0);
  const hp = boss.hp; boss.path = []; boss.pathTimer = 100000; boss.stepProgress = 0; boss.targetTileX = boss.tileX; boss.targetTileY = boss.tileY;
  for (let i = 0; i < c.NEPTUNE_LASER_WARNING + 1; i++) e.tick(s);
  assert.ok(Math.abs(hp - boss.hp - .10 * HP[1]) < 1, 'phase 1 Ocean’s Chorus damage ' + (hp - boss.hp));
});

test('blue fish heal both health pools, cap normally and keep normalized Chorus income',()=>{
  const{s}=fresh();s.playerHP=40;s.rubyHP=50;s.neptune.healCharge=0;
  nep.blueFishPopped(s);assert.equal(s.playerHP,52);assert.equal(s.rubyHP,62);
  assert.ok(Math.abs(s.neptune.healCharge-4.836)<1e-8);
  const bluePerSecond=(1-c.NEPTUNE_FISH_RED_CHANCE)*60/c.NEPTUNE_FISH_SPAWN_GAP;
  assert.ok(Math.abs(s.neptune.healCharge*bluePerSecond-2.418)<1e-8,'spawn throughput does not accelerate Chorus');
  s.playerHP=99;s.rubyHP=98;s.neptune.healCharge=0;nep.blueFishPopped(s);
  assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);
  assert.ok(Math.abs(s.neptune.healCharge-3*c.NEPTUNE_FISH_CHARGE_SCALE*c.NEPTUNE_HEAL_CHARGE_RATE)<1e-8);
  s.playerHP=50;s.rubyHP=50;s.bleedingUntil=s.gameTick+60;nep.blueFishPopped(s);
  assert.equal(s.playerHP,50);assert.equal(s.rubyHP,62,'Ruby can recover while player healing is blocked');
});

test('Neptune F heals sixty-five each while keeping its original Chorus contribution',()=>{
  const{s}=fresh();s.playerHP=10;s.rubyHP=10;s.neptune.healCharge=0;s.specialSkill='sea_chanter';
  assert.ok(e.useSpecialSkill(s));assert.equal(s.playerHP,75);assert.equal(s.rubyHP,75);
  assert.ok(Math.abs(s.neptune.healCharge-80*c.NEPTUNE_HEAL_CHARGE_RATE)<1e-8);
});

test('phase-3 blue-only refill slots cannot accelerate nominal Chorus income',()=>{
  for(const phase of [1,2,3]){
    const{s}=fresh();nep.godSetNeptunePhase(s,phase);s.playerHP=s.rubyHP=40;s.neptune.healCharge=0;
    nep.blueFishPopped(s);assert.equal(s.playerHP,52);assert.equal(s.rubyHP,52);
    const frequency=(phase===3?1:1-c.neptuneFishRedChance(phase))*60/c.NEPTUNE_FISH_SPAWN_GAP;
    assert.ok(Math.abs(s.neptune.healCharge*frequency-2.418)<1e-8);
  }
});

test('fish fill the larger population cap and blue/red selection uses its configured split',()=>{
  for(const [phase,roll,type] of [[1,.249,'fish_red'],[1,.25,'fish_blue'],[3,.249,'fish_red'],[3,.25,'fish_blue']]){
    const{s}=fresh();nep.godSetNeptunePhase(s,phase);s.neptune.bombTimer=s.neptune.tidePushTimer=1e9;s.map=s.map.map(row=>row.map(()=>c.T_FLOOR));s.playerTileX=s.playerTileY=2;s.neptune.refrainTimer=1e9;s.neptune.fishTimer=1;
    const random=Math.random;try{Math.random=()=>roll;
      for(let i=0;i<c.neptuneFishCap(phase)*c.NEPTUNE_FISH_SPAWN_GAP+100;i++)nep.updateNeptune(s);
    }finally{Math.random=random;}
    const fish=s.enemies.filter(v=>v.type==='fish_blue'||v.type==='fish_red');assert.equal(fish.length,phase===3?20:16);assert.ok(fish.slice(0,16).every(v=>v.type===type));if(phase===3)assert.ok(fish.slice(16).every(v=>v.type==='fish_blue'),'four additional blue fish preserve the existing red fish');
  }
});

test('meteors spare water clones in the struck chamber', () => {
  const { s, boss } = fresh();
  boss.hp = F1 + (2/3) * HP[1] - 1;
  e.tick(s);
  dropAllClones(s);
  const clone = clones(s)[0];
  const hp = clone.hp;
  const alien = e.createEncounterEnemy(s, 'normal', clone.tileX, clone.tileY, 10);
  s.enemies.push(alien);
  s.meteoriteWarning = c.chamberOfTile(clone.tileX, clone.tileY);
  s.meteoriteStrikeIn = 1;
  e.tick(s);
  assert.ok(s.enemies.includes(clone));
  assert.equal(clone.hp, hp);
  assert.ok(!s.enemies.includes(alien));
});

test('tides are exclusive to phase 3, clear old currents and refresh two chambers',()=>{
  for(const phase of [1,2]){
    const{s}=fresh();nep.godSetNeptunePhase(s,phase);s.neptune.refrainTimer=s.neptune.bombTimer=1e9;
    s.neptune.tides=[{chamber:c.chamberOfTile(s.playerTileX,s.playerTileY),dirX:1,dirY:0,ticks:600}];
    s.neptune.tideTimer=1;s.neptune.tidePushTimer=1;s.playerTargetX=s.playerTileX+1;
    assert.equal(nep.neptuneTideSpeed(s),1,'old current cannot change speed in phase '+phase);
    for(let i=0;i<180;i++)nep.updateNeptune(s);
    assert.deepEqual(s.neptune.tides,[]);assert.equal(s.playerKnockback,null);
    nep.godSetNeptunePhase(s,3);nep.updateNeptune(s);
    assert.equal(s.neptune.tides.length,2);assert.equal(new Set(s.neptune.tides.map(t=>t.chamber)).size,2);
    const previous=s.neptune.tides;s.neptune.tides.forEach(t=>t.ticks=1);nep.updateNeptune(s);nep.updateNeptune(s);
    assert.notEqual(s.neptune.tides,previous);assert.equal(s.neptune.tides.length,2);
  }
});

test('phase 3 hits do not heal the boss; meteors deal phase damage and tides affect movement', () => {
  const { s, boss } = fresh(); s.godMode = false;
  s.neptune.phase = 3; s.neptune.armed = [false, false, false]; boss.hp = .5 * HP[3];
  api.damageEnemy(s, boss, 0.0001);
  s.neptune.tides = [{ chamber: c.chamberOfTile(s.playerTileX, s.playerTileY), dirX: 1, dirY: 0, ticks: 100 }];
  s.playerTargetX = s.playerTileX + 1; s.playerTargetY = s.playerTileY;
  assert.equal(nep.neptuneTideSpeed(s), c.NEPTUNE_TIDE_WITH);
  s.playerTargetX = s.playerTileX - 1; assert.equal(nep.neptuneTideSpeed(s), c.NEPTUNE_TIDE_AGAINST);
  s.playerTargetX = s.playerTileX;
  // Her hits keep their phase damage bonus without restoring boss HP.
  s.playerHP = 100; const stolen = boss.hp; api.damagePlayer(s, 10, boss);
  assert.equal(s.playerHP, 100 - 10 * c.NEPTUNE_ATTACK_MULT[3]);
  assert.equal(boss.hp,stolen);s.rubyHP=100;e.damageRuby(s,10,boss);assert.equal(s.rubyHP,100-10*c.NEPTUNE_ATTACK_MULT[3]);assert.equal(boss.hp,stolen);
  // Meteors deal a share of phase HP.
  boss.hp = .5 * HP[3]; const room = c.chamberOfTile(boss.tileX, boss.tileY); boss.path = []; boss.pathTimer = 100000;
  s.meteoriteWarning = room; s.meteoriteStrikeIn = 1; s.playerHP = 100; e.tick(s);
  assert.ok(Math.abs(.5 * HP[3] - boss.hp - c.NEPTUNE_STRIKE_DAMAGE * HP[3]) < 1, 'meteor ' + boss.hp);
});

test('her HP pool is large: a single bomb is a small dent and never reaches the first dive point', () => {
  const { s, boss } = fresh();
  assert.deepEqual([HP[1], HP[2], HP[3]], [2000, 2300, 2450]);
  assert.equal(TOTAL, 6750);
  const hp = boss.hp; api.damageEnemy(s, boss, 45); assert.equal(hp - boss.hp, 45);
  api.damageEnemy(s, boss, 90); e.tick(s); assert.equal(s.neptune.dive, null, 'no dive from a couple of bombs');
});

test('God panel phase buttons jump to a phase at full phase HP, summoning her if needed', () => {
  const s = e.createModeState('trial', 'sea_chanter'); s.noMobs = true; s.godMode = true;
  nep.godSetNeptunePhase(s, 3);
  const boss = s.enemies.find(x => x.type === 'sea_chanter'); assert.ok(boss, 'summoned');
  assert.equal(s.neptune.phase, 3); assert.ok(Math.abs(boss.hp - HP[3]) < .1);
  nep.godSetNeptunePhase(s, 1); assert.equal(s.neptune.phase, 1); assert.ok(Math.abs(boss.hp - TOTAL) < .1);
  boss.hp = F1 + (2/3) * HP[1] - 1; e.tick(s); assert.ok(s.neptune.dive);
  nep.godSetNeptunePhase(s, 2); assert.equal(s.neptune.dive, null); assert.equal(s.enemies.filter(x => x.type === 'water_clone').length, 0);
});

test('fish nearby never block manual healing', () => {
  const { s, boss } = fresh(); s.godMode = false; s.playerHP = 50;
  boss.tileX = boss.targetTileX = 40; boss.tileY = boss.targetTileY = 40;
  s.playerCarryingRuby = true; s.rubyTileX = s.rubyTileY = -1;
  for (const type of ['fish_blue', 'fish_red']) s.enemies.push({ ...boss, id: s.nextEnemyId++, type, hp: 1, maxHp: 1, sea: undefined, tileX: s.playerTileX + 1, tileY: s.playerTileY });
  assert.equal(e.canHealRuby(s), true);
});

test('her song bursts also hit a placed Ruby', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.rubyShieldHP = 0;
  const x = (s.rubyTileX + .5) * c.TILE_SIZE, y = (s.rubyTileY + .5) * c.TILE_SIZE, ruby = s.rubyHP;
  s.playerX = x + 50 * c.TILE_SIZE; s.playerY = y;
  s.seaSongWaves.push({ x: x - 1, y, dx: 1, dy: 0, rangeLeft: 1, aimX: x, aimY: y, hitPlayer: false, ownerId: boss.id });
  e.tick(s); e.tick(s);
  assert.ok(Math.abs(ruby - s.rubyHP - (c.SEA_SONG_BLAST_DAMAGE_CENTER + c.NEPTUNE_SONG_BONUS)*c.NEPTUNE_ATTACK_MULT[1]) < .01, 'ruby took a full centre burst (+2): ' + (ruby - s.rubyHP));
});

test('her water waves hit you for +2 on this map', () => {
  const { s, boss } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  const hp = s.playerHP, x = s.playerX, y = s.playerY;
  s.seaSongWaves.push({ x: x - 30, y, dx: 1, dy: 0, rangeLeft: 400, aimX: x + 400, aimY: y, hitPlayer: false, ownerId: boss.id });
  for (let i = 0; i < 10; i++) e.tick(s);
  assert.ok(Math.abs(hp-s.playerHP-(c.ENEMY_CONFIGS.sea_chanter.damageToPlayer+c.NEPTUNE_SONG_BONUS)*c.NEPTUNE_ATTACK_MULT[1])<1e-8);
});

test('No Mobs prevents Neptune sharks and jellyfish, including dive arrivals', () => {
  const { s, boss } = fresh();
  allowNeptuneMobs(s); s.neptune.sharkTimer = s.neptune.jellyTimer = 1;
  e.tick(s); assert.ok(s.neptune.shark); assert.ok(s.enemies.some(x => x.type === 'jellyfish'));
  e.godSetNoMobs(s, true);
  assert.equal(s.neptune.shark, null); assert.equal(s.neptune.sharkFollowup, null); assert.equal(s.neptune.sharkThird, null);
  assert.ok(!s.enemies.some(x => x.type === 'jellyfish'));
  s.neptune.sharkTimer = s.neptune.jellyTimer = 1; e.tick(s);
  assert.equal(s.neptune.shark, null); assert.ok(!s.enemies.some(x => x.type === 'jellyfish'));

  boss.hp = F1 + (2/3) * HP[1] - 1; e.tick(s); assert.ok(s.neptune.dive);
  s.neptune.dive.jellyTimer = 1; e.tick(s);
  assert.equal(s.neptune.dive.jellyTimer, 1); assert.ok(!s.enemies.some(x => x.type === 'jellyfish'));
});

test('jellyfish drift in now and then; killing one during a dive reveals the nearest clone for a while', () => {
  const { s, boss } = fresh();
  allowNeptuneMobs(s);
  s.neptune.jellyTimer = 1; e.tick(s);
  assert.ok(s.enemies.some(x => x.type === 'jellyfish'), 'spawns outside dives too');
  boss.hp = F1 + (2/3) * HP[1] - 1; e.tick(s); dropAllClones(s);
  s.enemies = s.enemies.filter(x => x.type !== 'jellyfish');
  s.neptune.dive.jellyTimer = 1; e.tick(s); // the dive's own jellyfish
  const jelly = s.enemies.find(x => x.type === 'jellyfish'); assert.ok(jelly, 'a jellyfish drifted in');
  api.damageEnemy(s, jelly, 5); api.killEnemy(s, s.enemies.indexOf(jelly));
  assert.ok(s.neptune.reveal, 'a clone is revealed');
  assert.ok(clones(s).some(x => x.id === s.neptune.reveal.cloneId));
  for (let i = 0; i < c.NEPTUNE_REVEAL_TICKS + 1; i++) e.tick(s);
  assert.equal(s.neptune.reveal, null);
});

test('a shark warns its lane, then hits you once, knocks you off the lane and bites her too', () => {
  const { s, boss } = fresh();
  allowNeptuneMobs(s);
  s.godMode = false; s.playerShieldHP = 0;
  s.neptune.sharkTimer = 1; e.tick(s);
  const shark = s.neptune.shark; assert.ok(shark); assert.ok(shark.warning > 0);
  // Put her in the lane as well.
  if (shark.vertical) { boss.tileX = boss.targetTileX = shark.line; boss.tileY = boss.targetTileY = s.playerTileY + (s.map[s.playerTileY + 2]?.[shark.line] === c.T_FLOOR ? 2 : -2); }
  else { boss.tileY = boss.targetTileY = shark.line; boss.tileX = boss.targetTileX = s.playerTileX + (s.map[shark.line][s.playerTileX + 2] === c.T_FLOOR ? 2 : -2); }
  boss.attackTimer = boss.sea.songCooldown = 100000; boss.path = []; boss.pathTimer = 100000;
  const hp = s.playerHP, bossHP = boss.hp;
  for (let i = 0; i < 160 && s.neptune.shark; i++) { e.tick(s); boss.tileX = boss.targetTileX; boss.tileY = boss.targetTileY; }
  assert.ok(Math.abs(hp - s.playerHP - c.NEPTUNE_SHARK_DAMAGE) < 1e-9, `${hp - s.playerHP}`);
  assert.ok(bossHP - boss.hp >= c.NEPTUNE_SHARK_BOSS_DAMAGE * HP[1] - 1, 'bit her: ' + (bossHP - boss.hp));
  assert.equal(s.neptune.shark, null, 'it swims away');
});

test('a pufferfish swells when close, then bursts: damage and a two-tile knockback', () => {
  const { s } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  const tile = [s.playerTileX - 1, s.playerTileY];
  const boss = s.enemies.find(x => x.type === 'sea_chanter'); boss.attackTimer = 1e9;
  const puff = { ...boss, id: 900, type: 'pufferfish', sea: undefined, x: (tile[0] + .5) * c.TILE_SIZE, y: (tile[1] + .5) * c.TILE_SIZE, tileX: tile[0], tileY: tile[1],
    targetTileX: tile[0], targetTileY: tile[1], stepProgress: 0, hp: 7, maxHp: 7, path: [], pathTimer: 0, attackTimer: 0, windupTicks: 0, shootTicks: 0, flashTicks: 0 };
  s.enemies.push(puff);
  e.tick(s); assert.ok(puff.windupTicks > 0, 'swelling');
  const hp = s.playerHP;
  for (let i = 0; i < c.NEPTUNE_PUFF_TICKS + 1; i++) e.tick(s);
  assert.equal(hp - s.playerHP, c.NEPTUNE_PUFF_DAMAGE);
  assert.ok(s.playerKnockback && s.playerKnockback.tilesLeft === c.NEPTUNE_PUFF_KNOCKBACK, 'knocked back');
});

test('a pufferfish also bursts when it dies', () => {
  const { s } = fresh();
  s.godMode = false; s.playerShieldHP = 0;
  const boss = s.enemies.find(x => x.type === 'sea_chanter'); boss.attackTimer = 1e9;
  const tile = [s.playerTileX - 1, s.playerTileY];
  const puff = { ...boss, id: 901, type: 'pufferfish', sea: undefined, x: (tile[0] + .5) * c.TILE_SIZE, y: (tile[1] + .5) * c.TILE_SIZE, tileX: tile[0], tileY: tile[1],
    targetTileX: tile[0], targetTileY: tile[1], stepProgress: 0, hp: 7, maxHp: 7, path: [], pathTimer: 0, attackTimer: 1e9, windupTicks: 0, shootTicks: 0, flashTicks: 0 };
  s.enemies.push(puff);
  const hp = s.playerHP; api.damageEnemy(s, puff, 100); api.killEnemy(s, s.enemies.indexOf(puff), true); // no kill reward, to read the burst alone
  assert.equal(hp - s.playerHP, c.NEPTUNE_PUFF_DAMAGE);
  assert.ok(s.playerKnockback, 'knocked back');
});


test('a shark can warn a single follow-up that launches exactly one second later; it pauses with gameplay',()=>{
 const {s}=fresh();allowNeptuneMobs(s);s.neptune.sharkTimer=1;e.tick(s);
 const first=s.neptune.shark;first.warning=1;
 const random=Math.random;
 try{
  Math.random=()=>.1;e.tick(s);
  const second=s.neptune.sharkFollowup;assert.ok(second);assert.equal(second.warning,60);
  assert.equal(second.vertical,!first.vertical);assert.equal(second.hitPlayer,false);
  const pos=second.pos;s.gamePhase='paused';for(let i=0;i<80;i++)e.tick(s);assert.equal(second.warning,60);
  s.gamePhase='playing';for(let i=0;i<59;i++)e.tick(s);
  assert.equal(second.warning,1);assert.equal(second.pos,pos,'warning only');
  e.tick(s);assert.equal(second.warning,0);assert.equal(s.neptune.sharkFollowup,second,'follow-up cannot create another');
  e.tick(s);assert.notEqual(second.pos,pos,'second shark charges');
  for(let i=0;i<80;i++)e.tick(s);
  assert.equal(s.neptune.shark,null);assert.equal(s.neptune.sharkFollowup,null);
 }finally{Math.random=random;}
});

test('ordinary shark charges do not always produce a follow-up',()=>{
 const {s}=fresh();allowNeptuneMobs(s);s.neptune.sharkTimer=1;e.tick(s);s.neptune.shark.warning=1;
 const random=Math.random;try{Math.random=()=>.9;e.tick(s);assert.equal(s.neptune.sharkFollowup,undefined);}finally{Math.random=random;}
});


test('double-shark chance increases from 35% to 43% and 50% across phases',()=>{
 for(const [phase,roll,expected] of [[1,.349,true],[1,.35,false],[2,.429,true],[2,.43,false],[3,.499,true],[3,.5,false]]){
  const{s}=fresh();allowNeptuneMobs(s);s.neptune.sharkTimer=1;e.tick(s);s.neptune.phase=phase;s.neptune.shark.warning=1;
  const random=Math.random;
  try{Math.random=()=>roll;e.tick(s);assert.equal(!!s.neptune.sharkFollowup,expected,`phase ${phase}, roll ${roll}`);}finally{Math.random=random;}
 }
});

test('phase 3: a triple shark sends a follow-up and then a third charge', () => {
  const { s } = fresh(); allowNeptuneMobs(s); s.neptune.phase = 3;
  const random = Math.random; Math.random = () => .05; // below the 10% triple chance
  try {
    s.neptune.sharkTimer = 1; e.tick(s); assert.ok(s.neptune.shark && s.neptune.sharkTriple);
    for (let i = 0; i < c.NEPTUNE_SHARK_WARNING; i++) e.tick(s);
    assert.ok(s.neptune.sharkFollowup, 'the follow-up always comes');
    for (let i = 0; i < c.NEPTUNE_SHARK_FOLLOWUP_DELAY; i++) e.tick(s);
    assert.ok(s.neptune.sharkThird, 'and a third shark after it');
  } finally { Math.random = random; }
});

test('pufferfish join the spawns only from phase 2', () => {
  const run = phase => {
    const s = e.createModeState('trial', 'sea_chanter');
    s.meteoriteTimer = 1e5; s.bossTimer = 1e5; s.immortal = true; s.neptune.phase = phase;
    s.neptune.fishTimer = s.neptune.tideTimer = s.neptune.sharkTimer = s.neptune.jellyTimer = 1e9;
    let seen = 0;
    for (let i = 0; i < 4000; i++) {
      e.tick(s); s.neptune.phase = phase;
      seen += s.enemies.filter(x => x.type === 'pufferfish').length;
      s.enemies = s.enemies.filter(x => x.type !== 'pufferfish' && x.type !== 'sea_chanter' ? i % 600 !== 0 : true); // keep room for new spawns
    }
    return seen;
  };
  assert.equal(run(1), 0, 'none in phase 1');
  assert.ok(run(2) > 0, 'they appear in phase 2');
});
