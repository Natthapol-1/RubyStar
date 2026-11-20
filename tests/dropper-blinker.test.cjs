const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),ai=require('../game/aliens.ts');
const T=c.TILE_SIZE;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.comet.timer=1e9;s.resourceTimer=-1e7;
 for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;
 player(s,10,10);s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}
function player(s,x,y){Object.assign(s,{playerTileX:x,playerTileY:y,playerTargetX:x,playerTargetY:y,playerX:(x+.5)*T,playerY:(y+.5)*T,playerStepProgress:0,playerKnockback:null});}
function mob(s,type,x,y){const m=e.createEncounterEnemy(s,type,x,y,c.ENEMY_CONFIGS[type].maxHp);m.attackTimer=0;s.enemies.push(m);return m;}
function advance(s,m,n){for(let i=0;i<n;i++){s.gameTick++;ai.updateRegularAlien(s,m,s.playerCarryingRuby);}}
function kill(s,m,source='player'){e.damageEnemy(s,m,999,source);e.killEnemy(s,s.enemies.indexOf(m),source==='meteor');}

test('Dropper unlocks at stage 5; Blinker at stage 20; both obey caps and stay out of challenges',()=>{
 const s=fresh();s.bossesKilled=4;assert.ok(!e.spawnPool(s,['normal']).includes('dropper'));
 s.bossesKilled=5;assert.ok(e.spawnPool(s,['normal']).includes('dropper'));
 s.bossesKilled=19;assert.ok(!e.spawnPool(s,['normal']).includes('blinker'));
 s.bossesKilled=20;assert.ok(e.spawnPool(s,['normal']).includes('blinker'));
 for(let i=0;i<c.DROPPER.maxAlive;i++)mob(s,'dropper',3+i,3);
 for(let i=0;i<c.BLINKER.maxAlive;i++)mob(s,'blinker',3+i,4);
 assert.ok(!e.spawnPool(s,['normal']).includes('dropper'));assert.ok(!e.spawnPool(s,['normal']).includes('blinker'));
 s.enemies=[];s.trial={boss:'fiery_king'};assert.deepEqual(e.spawnPool(s,['normal']),['normal']);
});

test('Dropper waits for the warning, hits its locked area once, and knocks back three tiles',()=>{
 const s=fresh(),m=mob(s,'dropper',6,10);advance(s,m,1);
 assert.deepEqual(m.dropAttack,{tileX:10,tileY:10,ticks:c.DROPPER.warningTicks});
 advance(s,m,c.DROPPER.warningTicks-1);assert.equal(s.playerHP,100);
 advance(s,m,1);assert.equal(s.playerHP,88);assert.equal(s.playerKnockback.tilesLeft,3);assert.equal(m.dropAttack,undefined);
 const hp=s.playerHP;advance(s,m,30);assert.equal(s.playerHP,hp,'impact leaves no damage field');assert.equal(s.thornPatches.length,0);
});

test('Dropper locks its area instead of tracking movement, and tiles outside are safe',()=>{
 const s=fresh(),m=mob(s,'dropper',6,10);advance(s,m,1);player(s,12,10);
 advance(s,m,c.DROPPER.warningTicks);assert.equal(s.playerHP,100);assert.equal(s.playerKnockback,null);
 assert.equal(m.dropImpact.tileX,10);
});

test('Dropper has twelve-tile range and can attack over walls',()=>{
 for(const [x,wall,expected] of [[22,false,true],[23,false,false],[6,true,true]]){
 const s=fresh(),m=mob(s,'dropper',x,10);if(wall)s.map[10][8]=c.T_WALL;
 advance(s,m,1);assert.equal(!!m.dropAttack,expected);}
});

test('Dropper can hit placed Ruby, and knockback stops at walls',()=>{
 const s=fresh(),m=mob(s,'dropper',6,10);player(s,40,40);s.rubyTileX=7;s.rubyTileY=10;advance(s,m,1);
 assert.equal(m.dropAttack.tileX,7);advance(s,m,c.DROPPER.warningTicks);assert.equal(s.rubyHP,92);assert.equal(s.playerHP,100);
 const t=fresh(),n=mob(t,'dropper',6,10);t.map[10][11]=c.T_WALL;advance(t,n,1+c.DROPPER.warningTicks);
 assert.equal(t.playerHP,88);assert.equal(t.playerKnockback,null);
});

test('killed Droppers cannot land their pending attacks; pushing cancels their warning',()=>{
 const s=fresh(),m=mob(s,'dropper',6,10);advance(s,m,1);kill(s,m);
 for(let i=0;i<c.DROPPER.warningTicks+2;i++)e.tick(s);assert.equal(s.playerHP,100);
 const n=mob(s,'dropper',6,10);advance(s,n,1);n.pushTiles=1;n.pushDirX=-1;n.pushDirY=0;e.tick(s);assert.equal(n.dropAttack,undefined);
});

test('Blinker is fragile and player kills warp to an unoccupied floor tile with clean movement state',()=>{
 const s=fresh(),m=mob(s,'blinker',6,10);assert.ok(m.hp<c.ENEMY_CONFIGS.normal.maxHp);
 s.playerStepProgress=12;s.playerKnockback={dirX:1,dirY:0,started:false,tilesLeft:2};s.teleportCooldown=90;
 kill(s,m);assert.notDeepEqual([s.playerTileX,s.playerTileY],[10,10]);
 assert.ok(e.isFloorTile(s.map,s.playerTileX,s.playerTileY));assert.equal(s.playerTileX,s.playerTargetX);assert.equal(s.playerTileY,s.playerTargetY);
 assert.equal(s.playerX,(s.playerTileX+.5)*T);assert.equal(s.playerStepProgress,0);assert.equal(s.playerKnockback,null);
 assert.equal(s.teleportCooldown,90);assert.deepEqual([s.rubyTileX,s.rubyTileY],[45,45]);assert.ok(s.blinkerWarp);
});

test('Blinker carries Ruby along when held, and environmental deaths do not warp the player',()=>{
 const s=fresh();s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;kill(s,mob(s,'blinker',6,10));
 assert.equal(s.playerCarryingRuby,true);assert.equal(s.rubyTileX,-1);
 for(const source of ['meteor','enemy']){const t=fresh();kill(t,mob(t,'blinker',6,10),source);assert.deepEqual([t.playerTileX,t.playerTileY],[10,10]);}
});

test('Blinker does nothing if no valid destination remains',()=>{
 const s=fresh(),m=mob(s,'blinker',6,10);for(const row of s.map)row.fill(c.T_WALL);s.map[10][10]=c.T_FLOOR;
 kill(s,m);assert.deepEqual([s.playerTileX,s.playerTileY],[10,10]);
});

test('Dropper prefers the player even when Ruby is closer',()=>{
 const s=fresh(),m=mob(s,'dropper',6,10);s.rubyTileX=7;s.rubyTileY=10;advance(s,m,1);
 assert.equal(m.targeting,'player');assert.deepEqual([m.dropAttack.tileX,m.dropAttack.tileY],[10,10]);
});

test('Dropper hits each of the four marked tiles and nothing outside its 2x2 footprint',()=>{
 for(const [x,y,hit] of [[10,10,true],[11,10,true],[10,11,true],[11,11,true],[9,10,false],[12,10,false],[10,9,false],[10,12,false]]){
 const s=fresh(),m=mob(s,'dropper',6,10);advance(s,m,1);player(s,x,y);advance(s,m,c.DROPPER.warningTicks);
 assert.equal(s.playerHP,hit?88:100,`${x},${y}`);}
});
test('Dropper can hit both player and Ruby in its marked area but excludes blocked tiles',()=>{
 const s=fresh(),m=mob(s,'dropper',6,10);s.rubyTileX=11;s.rubyTileY=11;
 advance(s,m,1+c.DROPPER.warningTicks);assert.equal(s.playerHP,88);assert.equal(s.rubyHP,92);
 const t=fresh(),n=mob(t,'dropper',6,10);advance(t,n,1);t.map[11][11]=c.T_WALL;player(t,11,11);
 advance(t,n,c.DROPPER.warningTicks);assert.equal(t.playerHP,100);
});

test('Dropper pursues the player within a chamber distance instead of attacking closer Ruby',()=>{
 const s=fresh(),m=mob(s,'dropper',3,10);player(s,18,10);s.rubyTileX=4;s.rubyTileY=10;
 advance(s,m,1);assert.equal(m.targeting,'player');assert.equal(m.dropAttack,undefined,'player still outside attack range');
 assert.ok(m.path.some(([x,y])=>x===18&&y===10),'chases player');
});
test('Dropper keeps player priority across the full shared chamber, including opposite corners',()=>{
 const s=fresh(),m=mob(s,'dropper',2,2);player(s,19,19);s.rubyTileX=3;s.rubyTileY=2;
 advance(s,m,1);assert.equal(m.targeting,'player');assert.equal(m.dropAttack,undefined);
});

test('Dropper kills grant Heavy Impact for five seconds and repeated kills refresh without stacking',()=>{
 const s=fresh();kill(s,mob(s,'dropper',30,30));assert.equal(s.heavyImpactUntil,s.gameTick+300);
 s.gameTick+=100;kill(s,mob(s,'dropper',31,30));assert.equal(s.heavyImpactUntil,s.gameTick+300);
 const t=fresh();kill(t,mob(t,'dropper',30,30),'meteor');assert.equal(t.heavyImpactUntil,undefined);
 const u=fresh(),m=mob(u,'dropper',30,30);m.hp=0;e.killEnemy(u,u.enemies.indexOf(m),false,true);assert.equal(u.heavyImpactUntil,undefined);
});
test('Heavy Impact increases normal and powered Wave damage, radius and push; expiry restores all three',()=>{
 for(const powered of [false,true])for(const active of [false,true]){
 const s=fresh();s.poweredTicks=powered?60:0;s.gameTick=100;s.heavyImpactUntil=active?400:100;
 const m=mob(s,'normal',12,10),edge=mob(s,'normal',10+(powered?c.WAVE_RADIUS_PWR:c.WAVE_RADIUS)+2,10);m.hp=m.maxHp=edge.hp=edge.maxHp=1000;e.activateWave(s);
 const damage=(powered?c.WAVE_DMG_PWR:c.WAVE_DMG)*(active?1.3:1);
 assert.ok(Math.abs(1000-m.hp-damage)<1e-8);
 assert.equal(m.pushTiles,(powered?c.WAVE_PUSH_TILES_PWR:c.WAVE_PUSH_TILES)+(active?1:0));
 assert.equal(s.waveEffects[0].maxRadius,((powered?c.WAVE_RADIUS_PWR:c.WAVE_RADIUS)+(active?2:0))*T);
 assert.ok(Math.abs(edge.hp-(1000-(active?damage:0)))<1e-8);
 }
});
test('Heavy Impact combines with Wave constellations and pauses its duration in menus',()=>{
 const s=fresh();s.constellations=['wave','waveReach'];s.heavyImpactUntil=s.gameTick+300;
 const m=mob(s,'normal',12,10);m.hp=m.maxHp=1000;e.activateWave(s);
 assert.ok(Math.abs(1000-m.hp-c.WAVE_DMG*1.25*1.3)<1e-8);assert.equal(m.pushTiles,c.WAVE_PUSH_TILES+2);
 s.gamePhase='teleporting';const tick=s.gameTick,until=s.heavyImpactUntil;e.tick(s);
 assert.equal(s.gameTick,tick);assert.equal(s.heavyImpactUntil,until);
});

test('Heavy Impact shortens normal and Centaurus Wave recharge by 20% without affecting other cooldowns',()=>{
 for(const centaurus of [false,true]){
  const s=fresh();s.constellations=centaurus?['waveRate']:[];s.heavyImpactUntil=s.gameTick+300;e.activateWave(s);
  const initial=c.WAVE_COOLDOWN*(centaurus?.85:1);assert.equal(s.waveCooldown,initial);
  s.laserCooldown=s.bulletCooldown=100;
  e.tick(s);assert.equal(s.waveCooldown,initial-1.25);assert.equal(s.laserCooldown,99);assert.equal(s.bulletCooldown,99);
  const ticks=Math.ceil(initial*.8);
  for(let i=1;i<ticks;i++)e.tick(s);
  assert.equal(s.waveCooldown,0);
 }
});
test('Heavy Impact accelerates an existing recharge, pauses in menus and restores normal rate on expiry',()=>{
 const s=fresh();s.waveCooldown=60;kill(s,mob(s,'dropper',30,30));assert.equal(s.waveCooldown,60);
 e.tick(s);assert.equal(s.waveCooldown,58.75);
 s.gamePhase='teleporting';e.tick(s);assert.equal(s.waveCooldown,58.75);
 s.gamePhase='playing';s.heavyImpactUntil=s.gameTick+1;e.tick(s);assert.equal(s.waveCooldown,57.75);
});
test('Heavy Impact recharge still respects Frost Warden chill',()=>{
 const s=fresh(),warden=mob(s,'frost_warden',15,15);warden.attackTimer=1e7;
 s.heavyImpactUntil=s.gameTick+300;s.waveCooldown=60;assert.equal(e.isPlayerChilled(s),true);
 e.tick(s);assert.equal(s.waveCooldown,60-c.FROST_CHILL_TICK_RATE/.8);
});
