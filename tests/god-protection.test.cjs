const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;s.playerCarryingRuby=false;s.rubyTileX=s.rubyTileY=10;return s;}
function meteor(s){s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);}

test('No Freeze thaws immediately, prevents ordinary ice freezes, and can be disabled',()=>{
 const s=fresh();s.playerFrozenTicks=72;s.playerStunned=false;e.godSetNoFreeze(s,true);assert.equal(s.playerFrozenTicks,0);
 const step=()=>{Object.assign(s,{playerTileX:10,playerTileY:10,playerTargetX:11,playerTargetY:10,playerX:10.5*c.TILE_SIZE,playerY:10.5*c.TILE_SIZE,playerStepProgress:c.TILE_SIZE-1});s.map[10][10]=s.map[10][11]=c.T_FLOOR;s.frostIceTiles=[[11,10]];e.tick(s);};
 step();assert.equal(s.playerFrozenTicks,0);assert.equal(s.playerTileX,11);
 e.godSetNoFreeze(s,false);step();assert.ok(s.playerFrozenTicks>0);
});

test('No Freeze does not remove non-ice stuns or prevent normal damage',()=>{
 const s=fresh();e.godSetNoFreeze(s,true);e.stunPlayer(s,30);assert.equal(s.playerStunned,true);
 const frozen=s.playerFrozenTicks;e.godSetNoFreeze(s,true);assert.equal(s.playerFrozenTicks,frozen);
 const hp=s.playerHP;e.damagePlayer(s,10);assert.equal(s.playerHP,hp-10);
});
test('Immortal takes normal damage but clamps both player and Ruby to 1 HP',()=>{
 const s=fresh();s.immortal=true;meteor(s);assert.equal(s.playerHP,100-c.METEORITE_PLAYER_DMG);assert.equal(s.rubyHP,100-c.METEORITE_RUBY_DMG);
 s.playerHP=s.rubyHP=2;for(let i=0;i<3;i++){meteor(s);assert.equal(s.playerHP,1);assert.equal(s.rubyHP,1);assert.equal(s.gamePhase,'playing');}
});
test('Invincible prevents HP and shield damage; disabling it permits defeat',()=>{
 const s=fresh();s.godMode=true;s.playerHP=s.rubyHP=2;s.playerShieldHP=s.rubyShieldHP=10;meteor(s);
 assert.equal(s.playerHP,2);assert.equal(s.rubyHP,2);assert.equal(s.playerShieldHP,10);assert.equal(s.rubyShieldHP,10);s.godMode=false;meteor(s);assert.equal(s.gamePhase,'lost');
});
test('Immortal still consumes shields, but survives bomb self-damage and Supernova',()=>{
 const s=fresh();s.immortal=true;s.playerHP=s.rubyHP=1;s.playerShieldHP=s.rubyShieldHP=5;meteor(s);assert.equal(s.playerShieldHP,0);assert.equal(s.rubyShieldHP,0);
 s.bomb={tileX:s.playerTileX,tileY:s.playerTileY,powered:false};e.useBomb(s);assert.equal(s.playerHP,1);
 s.ambientEvents.warning=null;s.ambientEvents.active={kind:'supernova',points:[{x:10,y:10}],age:180,ticks:151,maxTicks:2700,pullTimer:0,chargeTicks:1};e.tick(s);assert.equal(s.playerHP,1);assert.equal(s.gamePhase,'playing');
});

test('No Meteors cancels pending strikes, suppresses scheduling and resumes a fresh cycle',()=>{
 const s=fresh();s.meteoriteWarning=0;s.meteoriteStrikeIn=1;s.meteoriteImpact={chamber:0,ticks:10};
 e.godSetNoMeteors(s,true);assert.equal(s.noMeteors,true);assert.equal(s.meteoriteWarning,-1);assert.equal(s.meteoriteStrikeIn,0);assert.equal(s.meteoriteImpact,null);
 s.meteoriteTimer=1;const hp=s.playerHP,ruby=s.rubyHP;
 for(let i=0;i<120;i++)e.tick(s);
 assert.equal(s.meteoriteWarning,-1);assert.equal(s.meteoriteTimer,1);assert.equal(s.playerHP,hp);assert.equal(s.rubyHP,ruby);
 e.godSetNoMeteors(s,false);e.tick(s);assert.ok(s.meteoriteWarning>=0);assert.equal(s.meteoriteStrikeIn,c.METEORITE_WARNING);
});

