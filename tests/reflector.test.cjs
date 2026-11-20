const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),b=require('../game/blessing-effects.ts');
const T=c.TILE_SIZE,R=c.REFLECTOR;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e9;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}
function mob(s,type,x,y,hp=100){const a=e.createEncounterEnemy(s,type,x,y,hp);a.pathTimer=a.attackTimer=1e7;s.enemies.push(a);return a;}
function reflector(s,x=14,y=10){const r=mob(s,'reflector',x,y);r.faceX=-1;r.faceY=0;r.speedOverride=0;return r;}
function shoot(s){s.bulletCooldown=0;e.useBullet(s);for(let i=0;i<60;i++)e.tick(s);}

test('bullets into the mirror bounce back at you; the Reflector takes nothing',()=>{
  const s=fresh(),r=reflector(s);shoot(s);
  assert.equal(r.hp,100,'mirror blocks');assert.ok(s.playerHP<100,'the bounced shot hits you');
});

test('a bullet from behind hits it normally',()=>{
  const s=fresh(),r=reflector(s);r.faceX=1;r.turnTimer=-1e7; // facing away from the player
  s.bulletCooldown=0;e.useBullet(s);for(let i=0;i<8&&r.hp===100;i++)e.tick(s);assert.ok(r.hp<100);
});

test('the 3-tile mirror covers allies behind it from lasers; the laser leaves bent 30 degrees',()=>{
  const s=fresh(),r=reflector(s),ally=mob(s,'normal',16,10),side=mob(s,'normal',16,11),before=s.laserBeams.length;
  e.useLaser(s);
  assert.equal(r.hp,100);assert.equal(ally.hp,100,'ally behind is covered');
  const bent=s.laserBeams.find(beam=>beam.color==='#dfe8f5');assert.ok(bent,'a visible bent beam');
  assert.ok(Math.abs(Math.abs(Math.atan2(bent.dirY,bent.dirX))-(Math.PI-R.bendDegrees*Math.PI/180))<1e-6,'30 degrees off straight back');
  assert.equal(s.playerHP,100,'four tiles away, the bent beam misses you');
  const close=fresh();reflector(close,11,10);close.laserCooldown=0;e.useLaser(close);assert.ok(close.playerHP<100,'right next to the mirror, it catches you');
});

test('a Wave hit drops the mirror for a while, then bullets get through',()=>{
  const s=fresh(),r=reflector(s,12,10);s.waveCooldown=0;e.activateWave(s);
  assert.ok(r.mirrorDownUntil>s.gameTick);const hp=r.hp;
  s.bulletCooldown=0;e.useBullet(s);for(let i=0;i<20&&r.hp===hp;i++)e.tick(s);assert.ok(r.hp<hp,'no mirror while it is down');
});

test('a stun drops the mirror too',()=>{
  const s=fresh(),r=reflector(s);r.buildStopUntil=s.gameTick+60;e.tick(s);assert.ok(r.mirrorDownUntil>s.gameTick);
});

test('killing a Reflector makes Ruby copy your attacks at reduced damage for 5s; it joins the pool at stage 10',()=>{
  const s=fresh(),r=reflector(s);r.hp=0;e.killEnemy(s,s.enemies.indexOf(r));
  assert.ok(s.rubyCopyUntil>s.gameTick);const copy=b.rubyBlessingCopy(s);assert.equal(copy.mult,R.rubyCopyMult);assert.deepEqual([copy.tileX,copy.tileY],[45,45]);
  s.gameTick=s.rubyCopyUntil;assert.equal(b.rubyBlessingCopy(s),null);
  const p=fresh();p.bossesKilled=9;assert.ok(!e.spawnPool(p,['normal']).includes('reflector'));p.bossesKilled=10;assert.ok(e.spawnPool(p,['normal']).includes('reflector'));
});
