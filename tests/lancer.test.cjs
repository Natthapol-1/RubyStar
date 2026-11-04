const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.immortal=true;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;s.rubyTileX=s.rubyTileY=-1;s.playerCarryingRuby=true;return s;}
function lancer(s,x=4,y=10){const a=e.createEncounterEnemy(s,'lancer',x,y,1000);a.attackTimer=0;a.pathTimer=1e7;s.enemies.push(a);return a;}
const ticks=(s,n)=>{for(let i=0;i<n;i++)e.tick(s);};
function movePlayer(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*T;s.playerY=(y+.5)*T;}

test('a Lancer locks its aim, charges, then hits hard and knocks the player back',()=>{
  const s=fresh(),a=lancer(s);e.tick(s);
  assert.equal(a.windupTicks,c.LANCER.windupTicks-0);assert.ok(Math.abs(a.lanceDirX-1)<1e-9);assert.ok(Math.abs(a.lanceDirY)<1e-9);
  ticks(s,c.LANCER.windupTicks-1);assert.equal(s.playerHP,100,'no damage while charging');
  e.tick(s);assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.lancer.damageToPlayer);assert.equal(a.attackTimer,c.ENEMY_CONFIGS.lancer.attackCooldown);
  for(let i=0;i<120&&(s.playerKnockback||s.playerTileX!==s.playerTargetX);i++)e.tick(s);
  assert.equal(s.playerTileX,10+c.ALIEN_KNOCKBACK.lancer);
});

test('stepping out of the locked line dodges the beam',()=>{
  const s=fresh(),a=lancer(s);e.tick(s);assert.ok(a.windupTicks>0);
  movePlayer(s,10,12);ticks(s,c.LANCER.windupTicks);
  assert.equal(s.playerHP,100);assert.equal(a.windupTicks,0);
});

test('walls stop the beam, and the warning line ends at the wall',()=>{
  const s=fresh(),a=lancer(s);e.tick(s);
  s.map[10][7]=c.T_WALL;
  const end=e.lancerBeamEnd(s,a);assert.ok(end.x<7&&end.x>6.9,`beam ends at the wall, got ${end.x}`);
  ticks(s,c.LANCER.windupTicks);assert.equal(s.playerHP,100);
});

test('a Lancer only charges with a clear line in range; otherwise it walks',()=>{
  const s=fresh();s.map[10][7]=c.T_WALL;const a=lancer(s);e.tick(s);assert.equal(a.windupTicks,0);
  const far=fresh(),b=lancer(far,1,10);e.tick(far);assert.equal(b.windupTicks,0);
});

test('defeating a Lancer makes lasers briefly stun aliens (bosses for less) for five seconds',()=>{
  const s=fresh(),a=lancer(s);a.hp=0;e.killEnemy(s,s.enemies.indexOf(a));
  assert.equal(s.laserStunTicks,c.LANCER.rewardTicks);
  const mob=e.createEncounterEnemy(s,'normal',12,10,1000);s.enemies.push(mob);
  const boss=e.createEncounterEnemy(s,'fiery_king',10,7,1e6);s.enemies.push(boss);
  s.laserCooldown=0;e.useLaser(s);
  assert.ok(mob.hp<1000,'laser hit the alien');assert.equal(mob.buildStopUntil,s.gameTick+c.LANCER.stunTicks);
  assert.ok(boss.hp<1e6,'laser hit the boss');assert.equal(boss.buildStopUntil,s.gameTick+c.LANCER.bossStunTicks);
  const plain=fresh(),other=e.createEncounterEnemy(plain,'normal',12,10,1000);plain.enemies.push(other);plain.laserCooldown=0;e.useLaser(plain);
  assert.ok(other.hp<1000);assert.equal(other.buildStopUntil,undefined,'no stun without the reward');
  ticks(s,c.LANCER.rewardTicks);assert.equal(s.laserStunTicks,0);
});
