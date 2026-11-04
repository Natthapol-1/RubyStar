const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE;
function fresh(mode='endless'){const s=e.createModeState(mode);if(mode==='ascension')s.gamePhase='playing';s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.bossTimer=1e7;
  for(let y=3;y<18;y++)for(let x=3;x<18;x++)s.map[y][x]=c.T_FLOOR;movePlayer(s,10,10);s.rubyTileX=s.rubyTileY=-1;s.playerCarryingRuby=true;return s;}
function movePlayer(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*T;s.playerY=(y+.5)*T;s.playerChamber=c.chamberOfTile(x,y);}
function strikeAt(s,x,y){s.comet.target={x,y,ticks:1};e.tick(s);}

test('Endless comets arrive every 20 to 70 seconds and mark a 3x3 area inside the player room',()=>{
  const s=fresh();movePlayer(s,10,10);assert.ok(s.comet.timer>=c.COMET.minGap&&s.comet.timer<=c.COMET.maxGap);
  s.comet.timer=1;e.tick(s);const t=s.comet.target;
  assert.ok(t,'warning started');assert.equal(t.ticks,c.COMET.warningTicks);
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)assert.equal(c.chamberOfTile(t.x+dx,t.y+dy),0,'whole area inside ALPHA');
  for(let i=0;i<c.COMET.warningTicks;i++)e.tick(s);
  assert.equal(s.comet.target,null);assert.ok(s.comet.impact);assert.ok(s.comet.timer>=c.COMET.minGap&&s.comet.timer<=c.COMET.maxGap);
});

test('a comet hits the player, placed Ruby, aliens and bosses inside the area only',()=>{
  const s=fresh();s.playerCarryingRuby=false;s.rubyTileX=11;s.rubyTileY=11;
  const inside=e.createEncounterEnemy(s,'normal',9,9,1000),outside=e.createEncounterEnemy(s,'normal',13,10,1000),boss=e.createEncounterEnemy(s,'fiery_king',11,9,1000);
  for(const a of [inside,outside,boss]){a.pathTimer=a.attackTimer=1e7;s.enemies.push(a);}
  const king=boss.hp;strikeAt(s,10,10);
  assert.equal(s.playerHP,100-c.COMET.playerDamage);assert.equal(s.rubyHP,100-c.COMET.rubyDamage);
  assert.ok(Math.abs(1000-inside.hp-c.COMET.alienDamage*e.skillAlienScale(s))<1e-9);assert.equal(outside.hp,1000);
  assert.ok(Math.abs(king-boss.hp-boss.maxHp*c.COMET.bossShare)<1e-9);
});

test('stepping out of the marked area avoids the comet; a weak alien inside dies',()=>{
  const s=fresh(),weak=e.createEncounterEnemy(s,'normal',10,10,5);weak.pathTimer=weak.attackTimer=1e7;s.enemies.push(weak);
  movePlayer(s,13,10);strikeAt(s,10,10);assert.equal(s.playerHP,100);assert.equal(s.enemies.includes(weak),false);
});

test('comets use the nearest room from a hallway, run in Ascension, and never appear in the tutorial or challenges',()=>{
  const s=fresh();const hall=[...Array(c.MAP_ROWS).keys()].flatMap(y=>[...Array(c.MAP_COLS).keys()].map(x=>[x,y])).find(([x,y])=>c.hallwayOfTile(x,y)===0&&s.map[y][x]===c.T_FLOOR);
  movePlayer(s,hall[0],hall[1]);const real=Math.random;Math.random=()=>.5; // no player-aimed roll
  try{assert.ok(e.godTriggerComet(s));}finally{Math.random=real;}
  assert.notEqual(c.chamberOfTile(s.comet.target.x,s.comet.target.y),-1);
  const asc=fresh('ascension');asc.comet.timer=1;e.tick(asc);assert.ok(asc.comet.target);
  for(const mode of ['tutorial','trial']){const o=fresh(mode);o.comet.timer=1;for(let i=0;i<5;i++)e.tick(o);assert.equal(o.comet.target,null,mode);}
});

test('a comet aims straight at the player about one time in five',()=>{
  const real=Math.random;
  try{
    Math.random=()=>.1;const s=fresh();movePlayer(s,6,7);e.godTriggerComet(s);assert.deepEqual([s.comet.target.x,s.comet.target.y],[6,7]);
    let n=0;Math.random=()=>{n++;return n===1?.99:.5;};const o=fresh();movePlayer(o,6,7);e.godTriggerComet(o);assert.notDeepEqual([o.comet.target.x,o.comet.target.y],[6,7]);
  }finally{Math.random=real;}
});
