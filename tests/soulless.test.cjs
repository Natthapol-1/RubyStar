const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),ai=require('../game/aliens.ts'),T=c.TILE_SIZE,L=c.SOULLESS_LUNGE;
function player(s,x,y){Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*T,playerY:(y+.5)*T,playerStepProgress:0});}
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.comet.timer=1e9;s.resourceTimer=-1e7;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;player(s,13,10);s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}
function husk(s){const m=e.createEncounterEnemy(s,'soulless',10,10,30);m.attackTimer=0;s.enemies.push(m);return m;}
function advance(s,m,n){for(let i=0;i<n;i++){s.gameTick++;ai.updateRegularAlien(s,m,s.playerCarryingRuby);}}
function lock(s,m){advance(s,m,1);assert.equal(m.boneLunge.phase,'warning');}
function dash(s,m){lock(s,m);advance(s,m,L.warningTicks);assert.equal(m.boneLunge.phase,'dash');}
test('Soulless warns before it attacks, lunges up to six tiles and swipes only once with knockback',()=>{
 const s=fresh(),m=husk(s);lock(s,m);advance(s,m,L.warningTicks-1);assert.equal(m.boneLunge.phase,'warning');assert.equal(s.playerHP,100);assert.equal(m.tileX,10);
 advance(s,m,1);advance(s,m,12);assert.equal(m.tileX,13);assert.equal(m.tileY,10);assert.equal(m.boneLunge.phase,'recover');assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.soulless.damageToPlayer);assert.equal(s.rubyHP,100);assert.equal(s.playerKnockback.tilesLeft,2);
 advance(s,m,35);assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.soulless.damageToPlayer);assert.equal(s.laserBeams.length,0);assert.equal((s.enemyShots??[]).length,0);assert.equal(m.shootTicks,0);
});
test('a sidestep avoids the locked lunge and the enemy does not retarget during it',()=>{
 const s=fresh(),m=husk(s);lock(s,m);player(s,13,12);advance(s,m,L.warningTicks+33);
 assert.equal(s.playerHP,100);assert.equal(m.tileX,16);assert.equal(m.tileY,10);assert.equal(s.playerKnockback,null);
});
test('cover blocks both the lunge and its swipe, including cover added after the warning',()=>{
 const s=fresh(),m=husk(s);dash(s,m);s.map[10][11]=c.T_WALL;advance(s,m,15);
 assert.deepEqual([m.tileX,m.tileY],[10,10]);assert.equal(s.playerHP,100);assert.equal(m.boneLunge.phase,'recover');
 const t=fresh(),n=husk(t);t.map[10][11]=c.T_WALL;advance(t,n,1);assert.equal(n.boneLunge,undefined);
});
test('lunges and knockback work in four directions without passing walls',()=>{
 for(const [x,y,ex,ey] of [[13,10,13,10],[7,10,7,10],[10,13,10,13],[10,7,10,7]]){
  const s=fresh();player(s,x,y);const m=husk(s);dash(s,m);advance(s,m,12);assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.soulless.damageToPlayer);assert.deepEqual([m.tileX,m.tileY],[ex,ey]);
 }
 const s=fresh(),m=husk(s);s.map[10][14]=c.T_WALL;dash(s,m);advance(s,m,12);assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.soulless.damageToPlayer);assert.equal(s.playerKnockback,null);
});
test('a swipe hits placed Ruby once and never knocks Ruby back',()=>{
 const s=fresh();player(s,30,30);s.rubyTileX=13;s.rubyTileY=10;const m=husk(s);dash(s,m);advance(s,m,12);
 assert.equal(s.rubyHP,100-c.ENEMY_CONFIGS.soulless.damageToRuby);assert.equal(s.playerHP,100);assert.equal(s.playerKnockback,null);advance(s,m,35);assert.equal(s.rubyHP,100-c.ENEMY_CONFIGS.soulless.damageToRuby);
});
test('pushing or stunning a Soulless interrupts its warning and gives recovery instead of an immediate attack',()=>{
 for(const action of ['push','stun']){
  const s=fresh(),m=husk(s);lock(s,m);
  if(action==='push'){m.pushDirX=0;m.pushDirY=1;m.pushTiles=1;}else m.buildStopUntil=s.gameTick+60;
  e.tick(s);assert.equal(m.boneLunge,undefined);assert.equal(m.attackTimer,c.ENEMY_CONFIGS.soulless.attackCooldown);assert.equal(s.playerHP,100);
 }
});
test('the attack pauses with gameplay, has recovery, and CC immunity blocks only its knockback',()=>{
 const s=fresh(),m=husk(s);lock(s,m);s.gamePhase='teleporting';const before=JSON.stringify(m.boneLunge);e.tick(s);assert.equal(JSON.stringify(m.boneLunge),before);
 s.gamePhase='playing';s.ccImmuneUntil=s.gameTick+300;advance(s,m,L.warningTicks+12);assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.soulless.damageToPlayer);assert.equal(s.playerKnockback,null);
 advance(s,m,L.recoverTicks);assert.equal(m.boneLunge,undefined);assert.ok(m.attackTimer>0);
});

test('Soulless attacks from six tiles away, reaches that target and chases rather than attacks beyond range',()=>{
 const s=fresh();player(s,16,10);const m=husk(s);dash(s,m);advance(s,m,35);
 assert.equal(s.playerHP,100-c.ENEMY_CONFIGS.soulless.damageToPlayer);assert.equal(m.tileX,16);assert.equal(m.boneLunge.phase,'recover');
 const t=fresh();player(t,17,10);const n=husk(t);advance(t,n,1);assert.equal(n.boneLunge,undefined);assert.ok(n.path.length>0);
});
