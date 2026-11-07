const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE,J=c.BLEEDER;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e9;s.immortal=true;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}

test('a Bleeder hit curses the player: no healing and a draining shield for 3 seconds',()=>{
  const s=fresh(),j=e.createEncounterEnemy(s,'bleeder',11,10,1000);j.attackTimer=0;j.pathTimer=1e7;s.enemies.push(j);
  for(let i=0;i<5&&!s.bleedingUntil;i++)e.tick(s);
  assert.ok(s.bleedingUntil>s.gameTick,'cursed');s.playerHP=50;e.healPlayer(s,20);assert.equal(s.playerHP,50,'no healing while cursed');
  s.playerShieldHP=10;j.attackTimer=1e7;for(let i=0;i<60;i++)e.tick(s);assert.ok(Math.abs(s.playerShieldHP-(10-J.shieldDrainPerSecond))<.2,`shield ${s.playerShieldHP}`);
  for(let i=0;i<J.curseTicks;i++)e.tick(s);e.healPlayer(s,20);assert.equal(s.playerHP,70,'heals again after the curse');
});

test('killing a Bleeder lifts the curse',()=>{
  const s=fresh(),j=e.createEncounterEnemy(s,'bleeder',20,20,1);s.enemies.push(j);s.bleedingUntil=s.gameTick+J.curseTicks;
  j.hp=0;e.killEnemy(s,s.enemies.indexOf(j));s.playerHP=50;e.healPlayer(s,10,false);assert.equal(s.playerHP,60);
});
