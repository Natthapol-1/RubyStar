const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE,S=c.SNATCHER;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e9;s.immortal=true;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;s.playerCarryingRuby=false;s.rubyTileX=s.rubyTileY=25;return s;}
function snatcher(s,x,y){const a=e.createEncounterEnemy(s,'snatcher',x,y,1000);a.pathTimer=0;s.enemies.push(a);return a;}

test('a Snatcher grabs a placed Ruby, carries her away from the player slowly, and she loses HP',()=>{
  const s=fresh(),a=snatcher(s,26,25);for(let i=0;i<10&&s.rubyStolenBy===undefined;i++)e.tick(s);
  assert.equal(s.rubyStolenBy,a.id);
  const start=Math.hypot(a.tileX-10,a.tileY-10),hp=s.rubyHP;for(let i=0;i<180;i++)e.tick(s);
  assert.ok(Math.hypot(a.tileX-10,a.tileY-10)>start,'moved away from the player');
  assert.deepEqual([s.rubyTileX,s.rubyTileY],[a.tileX,a.tileY],'Ruby goes with it');
  assert.ok(Math.abs(hp-s.rubyHP-3*S.rubyDrainPerSecond)<.2,`Ruby lost ${hp-s.rubyHP}`);
  e.toggleCarryRuby(s);assert.equal(s.playerCarryingRuby,false,'cannot pick her up while held');
});

test('killing the Snatcher drops Ruby with a shield; it cannot steal a carried Ruby',()=>{
  const s=fresh(),a=snatcher(s,26,25);for(let i=0;i<10&&s.rubyStolenBy===undefined;i++)e.tick(s);
  a.hp=0;e.killEnemy(s,s.enemies.indexOf(a));assert.equal(s.rubyStolenBy,undefined);assert.deepEqual([s.rubyTileX,s.rubyTileY],[a.tileX,a.tileY]);assert.ok(s.rubyShieldHP>=S.rewardRubyShield);
  const held=fresh();held.playerCarryingRuby=true;held.rubyTileX=held.rubyTileY=-1;const b=snatcher(held,12,10);for(let i=0;i<120;i++)e.tick(held);assert.equal(held.rubyStolenBy,undefined);
});

test('Enchanter and Bleeder kill rewards: Empowered damage and regeneration',()=>{
  const s=fresh(),en=e.createEncounterEnemy(s,'enchanter',30,30,1);s.enemies.push(en);en.hp=0;e.killEnemy(s,s.enemies.indexOf(en));
  const target=e.createEncounterEnemy(s,'normal',12,10,1000);s.enemies.push(target);e.useLaser(s);assert.ok(Math.abs(1000-target.hp-c.LASER_DMG*c.ENCHANTER.rewardDamageMult)<1e-9);
  const r=fresh(),bl=e.createEncounterEnemy(r,'bleeder',30,30,1);r.enemies.push(bl);r.bleedingUntil=r.gameTick+100;r.playerHP=50;bl.hp=0;e.killEnemy(r,r.enemies.indexOf(bl));
  assert.ok(r.playerHP>50,'the kill heal works because the curse lifts first');const after=r.playerHP;for(let i=0;i<c.BLEEDER.regenTicks;i++)e.tick(r);assert.ok(Math.abs(r.playerHP-after-15)<=1,`regenerated ${r.playerHP-after}`);
});
