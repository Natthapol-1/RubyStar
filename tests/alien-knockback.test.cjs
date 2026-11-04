const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.immortal=true;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*c.TILE_SIZE;s.rubyTileX=s.rubyTileY=-1;s.playerCarryingRuby=true;return s;}
function alien(s,type,x,y){const a=e.createEncounterEnemy(s,type,x,y,1000);a.attackTimer=0;a.pathTimer=1e7;s.enemies.push(a);return a;}
function settle(s){for(let i=0;i<120&&(s.playerKnockback||s.playerTileX!==s.playerTargetX);i++)e.tick(s);}

for(const type of ['armored','fast','ghost']) test(`${type} hits push the player ${c.ALIEN_KNOCKBACK[type]} tile(s) away`,()=>{
  const s=fresh(),a=alien(s,type,9,10);
  for(let i=0;i<5&&s.playerHP===100;i++)e.tick(s);
  assert.ok(s.playerHP<100,'the alien hit the player');
  settle(s);
  assert.equal(s.playerTileX,10+c.ALIEN_KNOCKBACK[type]);assert.equal(s.playerTileY,10);assert.equal(a.tileX,9);
});

test('a Bomber explosion pushes the player away from the blast',()=>{
  const s=fresh(),b=alien(s,'bomber',10,8);b.exploding=true;b.explodeTick=1;
  e.tick(s);assert.ok(s.playerHP<100);
  settle(s);
  assert.equal(s.playerTileX,10);assert.equal(s.playerTileY,10+c.ALIEN_KNOCKBACK.bomber);
});

test('knockback stops at walls and leaves ordinary aliens alone',()=>{
  const s=fresh();s.map[10][11]=c.T_WALL;alien(s,'armored',9,10);
  for(let i=0;i<5&&s.playerHP===100;i++)e.tick(s);
  settle(s);assert.equal(s.playerTileX,10);
  const n=fresh();alien(n,'normal',9,10);for(let i=0;i<5&&n.playerHP===100;i++)e.tick(n);
  assert.ok(n.playerHP<100);assert.equal(n.playerKnockback,null);
});

test('any knockback shakes the screen a little once when it starts pushing the player',()=>{
  const s=fresh();s.screenShakeTicks=0;s.screenShakeAmt=0;s.playerKnockback={dirX:1,dirY:0,started:false,tilesLeft:2};
  e.tick(s);assert.equal(s.screenShakeAmt,c.KNOCKBACK_SHAKE_AMOUNT);assert.ok(s.screenShakeTicks>0&&s.screenShakeTicks<=c.KNOCKBACK_SHAKE_TICKS);
  s.screenShakeTicks=0;s.screenShakeAmt=0;settle(s);assert.equal(s.playerTileX,12);assert.equal(s.screenShakeAmt,0,'the second tile of the same push does not shake again');
});
