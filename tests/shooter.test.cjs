const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE,S=c.SHOOTER;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e9;s.immortal=true;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}
function shooter(s,x,y){const a=e.createEncounterEnemy(s,'shooter',x,y,1000);a.attackTimer=0;a.pathTimer=1e7;s.enemies.push(a);return a;}

test('a Shooter winds up, fires a slow orb at the player, and a hit damages and stuns',()=>{
  const s=fresh(),a=shooter(s,16,10);e.tick(s);assert.ok(a.windupTicks>0,'winding up');
  for(let i=0;i<S.windupTicks;i++)e.tick(s);assert.equal(s.enemyShots.length,1);
  for(let i=0;i<200&&s.playerHP===100;i++)e.tick(s);
  assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.shooter.damageToPlayer);assert.equal(s.playerStunned,true);assert.ok(s.playerFrozenTicks>0);assert.equal(s.enemyShots.length,0);
});

test('the orb keeps flying past its firing range until it hits a wall',()=>{
  const s=fresh(),a=shooter(s,16,10);e.tick(s);for(let i=0;i<S.windupTicks;i++)e.tick(s);
  s.playerTileY=s.playerTargetY=20;s.playerY=20.5*T;a.attackTimer=1e7;s.map[10][2]=c.T_WALL;
  let far=0;for(let i=0;i<400&&s.enemyShots.length;i++){e.tick(s);if(s.enemyShots[0])far=Math.max(far,16.5-s.enemyShots[0].x/T);}
  assert.ok(far>c.ENEMY_CONFIGS.shooter.attackRange,`flew ${far} tiles`);assert.equal(s.enemyShots.length,0,'stopped at the wall');
});

test('Shooters spawn from stage 10; killing one makes your bullets stun for 5s',()=>{
  const pool=(kills)=>{const s=fresh();s.bossesKilled=kills;return e.spawnPool(s,['normal']);};
  assert.ok(!pool(9).includes('shooter'));assert.ok(pool(10).includes('shooter'));assert.ok(!pool(10).includes('bleeder'),'stage-20 aliens wait');
  const s=fresh(),a=shooter(s,30,30);a.hp=0;e.killEnemy(s,s.enemies.indexOf(a));assert.ok(s.bulletStunUntil>s.gameTick);
  const m=e.createEncounterEnemy(s,'normal',13,10,1000);m.pathTimer=m.attackTimer=1e7;s.enemies.push(m);s.bulletCooldown=0;e.useBullet(s);
  for(let i=0;i<20&&m.hp===1000;i++)e.tick(s);assert.ok(Math.abs(1000-m.hp-c.BULLET_DMG*S.rewardBulletMult)<1e-9,'+30% damage');assert.ok(m.buildStopUntil>s.gameTick,'the hit alien is stopped');
});
