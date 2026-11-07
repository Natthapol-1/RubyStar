const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.immortal=true;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*c.TILE_SIZE;s.comet.timer=1e9;s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;} // Ruby placed far away: pushes are full length
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

test('Dawn, the melee twin, pushes the player two tiles on a hit',()=>{
  const s=fresh();e.godSpawnBoss(s,'astral_twins');const [dawn,dusk]=s.enemies;
  const put=(m,x,y)=>{m.tileX=m.targetTileX=x;m.tileY=m.targetTileY=y;m.x=(x+.5)*c.TILE_SIZE;m.y=(y+.5)*c.TILE_SIZE;m.stepProgress=0;m.path=[];};
  put(dawn,9,10);put(dusk,30,30);dawn.attackTimer=0;dusk.attackTimer=1e7;
  for(let i=0;i<10&&s.playerHP===100;i++)e.tick(s);
  assert.ok(s.playerHP<100,'Dawn hit the player');settle(s);
  assert.equal(s.playerTileX,10+c.TWIN_MELEE_KNOCKBACK);assert.equal(s.playerTileY,10);
});

test('the player takes less damage while carrying Ruby',()=>{
  const carry=fresh();carry.playerCarryingRuby=true;e.damagePlayer(carry,20);assert.ok(Math.abs(carry.playerHP-(100-20*c.CARRY_DAMAGE_MULT))<1e-9);
  const placed=fresh();placed.playerCarryingRuby=false;placed.rubyTileX=placed.rubyTileY=30;e.damagePlayer(placed,20);assert.equal(placed.playerHP,80);
});

test('carrying Ruby halves every push, carrying the half tile over to the next one',()=>{
  const s=fresh();s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;
  const push=(tiles)=>{const x=s.playerTileX;s.playerKnockback={dirX:1,dirY:0,started:false,tilesLeft:tiles};settle(s);return s.playerTileX-x;};
  assert.equal(push(3),1);assert.equal(push(3),2,'the two half tiles add up');
  assert.equal(push(1),0,'a one-tile tide or pull is skipped...');assert.equal(push(1),1,'...then the next one moves a tile');
  const free=fresh();free.playerKnockback={dirX:1,dirY:0,started:false,tilesLeft:3};settle(free);assert.equal(free.playerTileX,13,'not carrying: full push');
});

test('speed boosts last 30% shorter while carrying Ruby',()=>{
  const run=(carrying)=>{const s=fresh();if(carrying){s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;}s.speedActiveTicks=100;let n=0;while(s.speedActiveTicks>0&&n<500){e.tick(s);n++;}return n;};
  assert.equal(run(false),100);const carried=run(true);assert.ok(Math.abs(carried-100*c.CARRY_BOOST_MULT)<=1,`${carried} ticks`);
});

test('enemy attacks deal +5% at stage 15 and another +5% every 5 stages; hazards and earlier stages are unchanged',()=>{
  for(const [kills,mult] of [[14,1],[15,1.05],[19,1.05],[20,1.1],[25,1.15],[30,1.2],[40,1.3]])assert.ok(Math.abs(c.lateEnemyDamageMult(kills)-mult)<1e-9,'stage '+kills);
  const s=fresh();s.bossesKilled=20;const m=e.createEncounterEnemy(s,'normal',30,30,10);s.enemies.push(m);e.damagePlayer(s,20,m);e.damageRuby(s,20,m);
  assert.ok(Math.abs(s.playerHP-(100-20*1.1))<1e-9);assert.ok(Math.abs(s.rubyHP-(100-20*1.1))<1e-9);
  const hazard=fresh();hazard.bossesKilled=25;e.damagePlayer(hazard,20);assert.equal(hazard.playerHP,80,'ownerless damage unchanged');
});
