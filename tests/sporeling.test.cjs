const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const sporeTest={updateEnemyShots,updateEnemies};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),ai=require('../game/aliens.ts'),g=require('../game/gaia.ts'),F=c.GAIA_SPORE_SHOT,T=c.TILE_SIZE;
function player(s,x,y){Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*T,playerY:(y+.5)*T});}
function fresh(){const s=e.createModeState('trial','thorn_weaver');s.enemies=[];s.noMobs=true;s.rubyTileX=s.rubyTileY=45;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;player(s,10,10);if(s.gaia)s.gaia.stones=[]; // random stones would block growth on the tiles under test
 const mob=e.createEncounterEnemy(s,'sporeling',5,10,5);mob.attackTimer=0;s.enemies.push(mob);return{s,mob};}
function advance(s,m,n){for(let i=0;i<n;i++){s.gameTick++;ai.updateRegularAlien(s,m,false);}}
function shot(s,m,extra={}){return{x:s.playerX-F.speed,y:s.playerY,dx:F.speed,dy:0,ownerId:m.id,ticks:0,spore:true,...extra};}
test('Sporeling warns then shoots one travelling, non-homing spore instead of melee or laser damage',()=>{
 const{s,mob}=fresh();const hp=s.playerHP;advance(s,mob,1);assert.equal(mob.windupTicks,F.windup);advance(s,mob,F.windup);assert.equal(s.enemyShots.length,1);assert.equal(s.enemyShots[0].spore,true);assert.equal(s.playerHP,hp);assert.equal(s.laserBeams.length,0);
 const q=s.enemyShots[0];assert.equal(q.dx,F.speed);assert.equal(q.dy,0);player(s,10,13);e.sporeTest.updateEnemyShots(s);assert.equal(q.dy,0);assert.equal(s.playerHP,hp);advance(s,mob,c.ENEMY_CONFIGS.sporeling.attackCooldown+F.windup);assert.equal(s.enemyShots.length,2);
});
test('Sporeling needs line of sight and range before winding up',()=>{const{s,mob}=fresh();s.map[10][8]=c.T_WALL;advance(s,mob,1);assert.equal(mob.windupTicks,0);assert.equal(s.enemyShots.length,0);});
test('spores slow on hit without a stun, explode once, and grow a bounded vine patch',()=>{
 const{s,mob}=fresh();s.enemyShots=[shot(s,mob)];e.sporeTest.updateEnemyShots(s);assert.equal(s.playerHP,95);assert.equal(s.playerFrozenTicks,0);assert.equal(s.gaia.sporeSlowTicks,F.slowTicks);assert.equal(s.enemyShots.length,0);assert.equal(s.gaia.sporeBursts.length,1);assert.equal(g.gaiaLevel(s,10,10),2);assert.equal(g.gaiaLevel(s,11,11),2);assert.equal(g.gaiaLevel(s,12,10),0);assert.equal(s.gaia.spores.length,0);player(s,20,20);assert.equal(g.gaiaPlayerSpeed(s),.5,'bullet slow persists after leaving the new vines');s.gaia.pollenSlowTicks=60;assert.equal(g.gaiaPlayerSpeed(s),.5,'the weaker blossom slow does not multiply the spore slow');s.gaia.sporeSlowTicks=0;assert.equal(g.gaiaPlayerSpeed(s),.7,'blossom slow stays unchanged');
});
test('missed spores stop at walls and expire, with no remote player hit',()=>{
 const{s,mob}=fresh();s.map[10][7]=c.T_WALL;s.enemyShots=[shot(s,mob,{x:7*T-1})];e.sporeTest.updateEnemyShots(s);assert.equal(s.playerHP,100);assert.equal(s.enemyShots.length,0);assert.equal(g.gaiaLevel(s,6,10),2);assert.equal(g.gaiaLevel(s,7,10),0);
 s.enemyShots=[shot(s,mob,{x:15.5*T,ticks:F.life-1})];e.sporeTest.updateEnemyShots(s);assert.equal(s.enemyShots.length,0);assert.equal(g.gaiaLevel(s,15,10),2);
});
test('spore hits hurt placed Ruby and growth respects its ward',()=>{const{s,mob}=fresh();s.rubyTileX=10;s.rubyTileY=12;s.enemyShots=[shot(s,mob,{x:10.5*T-F.speed,y:12.5*T})];e.sporeTest.updateEnemyShots(s);assert.equal(s.rubyHP,96);assert.equal(s.enemyShots.length,0);assert.equal(g.gaiaLevel(s,10,12),0);assert.equal(s.gaia.sporeSlowTicks,0);});
test('spore slow and burst pause with the encounter and expire during play',()=>{const{s,mob}=fresh();s.enemyShots=[shot(s,mob)];e.sporeTest.updateEnemyShots(s);s.gamePhase='teleporting';e.tick(s);assert.equal(s.gaia.sporeSlowTicks,F.slowTicks);assert.equal(s.gaia.sporeBursts[0].ticks,24);s.gamePhase='playing';for(let i=0;i<F.slowTicks;i++){s.gameTick++;g.updateGaia(s);}assert.equal(s.gaia.sporeSlowTicks,0);assert.equal(s.gaia.sporeBursts.length,0);});
