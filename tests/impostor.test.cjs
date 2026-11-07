const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e9;s.immortal=true;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}

test('an Impostor copies a living boss 2s after spawning, never attacks, and vanishes without rewards when no boss is left',()=>{
  const s=fresh(),boss=e.createEncounterEnemy(s,'fiery_king',40,40,500);boss.pathTimer=boss.attackTimer=1e7;s.enemies.push(boss);
  const imp=e.createEncounterEnemy(s,'impostor',11,10,10);s.enemies.push(imp);
  for(let i=0;i<c.IMPOSTOR.disguiseDelay-5;i++)e.tick(s);assert.equal(imp.disguiseOf,undefined,'plain look for the first 2 seconds');
  for(let i=0;i<10;i++)e.tick(s);
  assert.equal(imp.disguiseOf,boss.id);assert.equal(s.playerHP,100,'never attacks');
  const score=s.killScore;s.enemies=s.enemies.filter(x=>x!==boss);e.tick(s);e.tick(s);
  assert.equal(s.enemies.includes(imp),false,'gone with no boss to copy');assert.equal(s.killScore,score,'no rewards for vanishing');
});

test('killing an Impostor leaves a decoy where it fell',()=>{
  const s=fresh(),boss=e.createEncounterEnemy(s,'fiery_king',40,40,500);s.enemies.push(boss);const imp=e.createEncounterEnemy(s,'impostor',20,20,1);s.enemies.push(imp);
  imp.hp=0;e.killEnemy(s,s.enemies.indexOf(imp));assert.deepEqual([s.build.decoy.tileX,s.build.decoy.tileY],[20,20]);
  for(let i=0;i<60;i++)e.tick(s);assert.ok(s.build.decoy,'lasts without Pyxis');
});
