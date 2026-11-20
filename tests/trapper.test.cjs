const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE,P=c.TRAPPER;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e9;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}
function mob(s,type,x,y,hp=100){const a=e.createEncounterEnemy(s,type,x,y,hp);a.attackTimer=1e7;s.enemies.push(a);return a;}

test('a Trapper plants mines on its path, at most five at once, and keeps its distance',()=>{
  const s=fresh(),t=mob(s,'trapper',20,10);
  for(let i=0;i<P.dropTicks*8;i++)e.tick(s);
  const mines=s.mines.filter(m=>m.ownerId===t.id);assert.ok(mines.length>=1&&mines.length<=P.maxMines);
  assert.ok(Math.hypot(t.tileX-10,t.tileY-10)>=P.keepAway-1,'hangs back');
});

test('an armed mine fuses when you step on it, then blasts you and nearby aliens',()=>{
  const s=fresh(),t=mob(s,'trapper',40,40),near=mob(s,'normal',11,10);near.pathTimer=1e7;
  s.mines=[{tileX:10,tileY:10,ownerId:t.id,ticks:0}];
  for(let i=0;i<P.armTicks;i++)e.tick(s);
  assert.equal(s.playerHP,100,'nothing before it arms');
  e.tick(s);assert.ok(s.mines[0].fuse!==undefined,'fuse lit');
  for(let i=0;i<P.fuseTicks+1;i++)e.tick(s);
  assert.equal(s.mines.length,0);assert.ok(s.playerHP<100);assert.ok(near.hp<100,'aliens in the blast are hurt too');
});

test('killing a Trapper removes its mines and makes your bullets explode for 5s',()=>{
  const s=fresh(),t=mob(s,'trapper',30,30);s.mines=[{tileX:20,tileY:20,ownerId:t.id,ticks:0}];
  t.hp=0;e.killEnemy(s,s.enemies.indexOf(t));assert.equal(s.mines.length,0);assert.ok(s.explosiveBulletsUntil>s.gameTick);
  const a=mob(s,'normal',13,10),b=mob(s,'normal',16,10),outside=mob(s,'normal',17,10);a.pathTimer=b.pathTimer=outside.pathTimer=1e7;
  s.bulletCooldown=0;e.useBullet(s);for(let i=0;i<20&&a.hp===100;i++)e.tick(s);
  assert.ok(a.hp<100);assert.ok(Math.abs(100-b.hp-(100-a.hp)*P.rewardSplash)<1e-6,'splash reaches three tiles');assert.equal(outside.hp,100,'outside blast is unharmed');assert.ok(s.bombBlasts.some(v=>v.maxRadius===3*T),'blast visual matches damage radius');
});

test('Trapper and Snatcher join at Stage 15 in Endless and Ascension, with their existing caps',()=>{
  for(const mode of ['endless','ascension'])for(const type of ['trapper','snatcher']){
    const s=fresh();s.mode=mode;s.bossesKilled=14;assert.ok(!e.spawnPool(s,['normal']).includes(type));
    s.bossesKilled=15;assert.ok(e.spawnPool(s,['normal']).includes(type));
    const cap=type==='trapper'?c.TRAPPER.maxAlive:c.SNATCHER.maxAlive;
    for(let i=0;i<cap;i++)mob(s,type,20+i,20);
    assert.ok(!e.spawnPool(s,['normal']).includes(type));
    s.enemies=[];s.trial={boss:'fiery_king'};assert.deepEqual(e.spawnPool(s,['normal']),['normal']);
  }
});
