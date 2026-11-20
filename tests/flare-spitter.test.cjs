const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const spitterTest={spawnEnemy,updateEnemies,updateEnemyShots};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),ai=require('../game/aliens.ts'),sun=require('../game/sun.ts'),F=c.SUN.spitter,T=c.TILE_SIZE;
function player(s,x,y){Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*T,playerY:(y+.5)*T});}
function fresh(){const s=e.createModeState('trial','fiery_king');s.enemies=[];s.sun.noWisps=true;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;player(s,10,10);s.rubyTileX=s.rubyTileY=45;const mob=e.createEncounterEnemy(s,'flare_spitter',5,10,10);mob.attackTimer=0;s.enemies.push(mob);return {s,mob};}
function advance(s,mob,n){for(let i=0;i<n;i++){s.gameTick++;ai.updateRegularAlien(s,mob,false);}}
test('Spitter locks its aim, warns for 0.7s, then fires three spreading fireballs every 3s',()=>{
 const {s,mob}=fresh();advance(s,mob,1);assert.equal(mob.spit.ticks,F.warningTicks);assert.equal(s.enemyShots.length,0);
 player(s,10,13);advance(s,mob,F.warningTicks-1);assert.equal(s.enemyShots.length,0);advance(s,mob,1);
 assert.equal(s.enemyShots.length,3);assert.ok(s.enemyShots.every(q=>q.flare&&q.dx>0));assert.equal(s.enemyShots[1].dy,0);assert.ok(s.enemyShots[0].dy<0&&s.enemyShots[2].dy>0);
 player(s,10,10);advance(s,mob,c.ENEMY_CONFIGS.flare_spitter.attackCooldown);assert.equal(s.enemyShots.length,6);assert.equal(s.laserBeams.length,0);
});
test('Spitter requires range and line of sight; water cancels its windup and strips its flame armor without stunning it',()=>{
 const {s,mob}=fresh();s.map[10][8]=c.T_WALL;advance(s,mob,1);assert.equal(mob.spit,undefined);
 s.map[10][8]=c.T_FLOOR;mob.targetTileX=mob.tileX;mob.targetTileY=mob.tileY;advance(s,mob,1);assert.ok(mob.spit);
 assert.ok(sun.useCoolingWave(s));assert.equal(mob.spit,undefined);assert.ok(mob.doused,'doused');assert.equal(mob.hp,10-c.SUN.waveDamage,'the wave hits it after the armor is gone');assert.ok(!(mob.buildStopUntil>s.gameTick),'no stun');
 player(s,30,30);mob.buildStopUntil=0;advance(s,mob,1);assert.equal(mob.spit,undefined);
});
test('fireballs deal six damage and a brief stun, stop at cover, expire, and leave temporary burning ground',()=>{
 const {s,mob}=fresh(),shot=()=>({x:s.playerX-4.5,y:s.playerY,dx:4.5,dy:0,ownerId:mob.id,ticks:0,flare:true});
 s.enemyShots=[shot()];e.spitterTest.updateEnemyShots(s);assert.equal(s.playerHP,94);assert.equal(s.playerFrozenTicks,c.SUN.spitter.hitStun);assert.equal(s.enemyShots.length,0);assert.ok(s.sun.burning.some(b=>b.x===10&&b.y===10));assert.equal(s.sun.spitterHits.length,1);
 const q=shot();q.x=6.95*T;q.dx=6.5;s.map[10][7]=c.T_WALL;s.enemyShots=[q];e.spitterTest.updateEnemyShots(s);assert.equal(s.enemyShots.length,0);assert.equal(s.playerHP,94);assert.ok(s.sun.burning.some(b=>b.x===6&&b.y===10));assert.ok(!s.sun.burning.some(b=>b.x===7&&b.y===10));
 s.enemyShots=[{...shot(),x:15.5*T,ticks:F.shotLife}];e.spitterTest.updateEnemyShots(s);assert.equal(s.enemyShots.length,0);
 s.rubyTileX=10;s.rubyTileY=11;s.enemyShots=[{...shot(),x:10.5*T-4.5,y:11.5*T}];e.spitterTest.updateEnemyShots(s);assert.equal(s.rubyHP,94);
});
test('phase-two Spitters replace non-Emberling slots only and stop at three living; No Mobs removes them',()=>{
 const {s}=fresh();s.enemies=[];const oldRandom=Math.random,oldChance=F.chance;
 try{Math.random=()=>.99;F.chance=1;e.spitterTest.spawnEnemy(s);assert.ok(s.enemies.every(m=>m.type!=='flare_spitter'),'none in phase one');s.enemies=[];s.sun.phase=2;for(let i=0;i<8;i++)e.spitterTest.spawnEnemy(s);
  assert.equal(s.sun.phase,2);assert.equal(s.enemies.filter(m=>m.type==='flare_spitter').length,3);assert.ok(s.enemies.some(m=>m.type!=='flare_spitter'));
  s.enemies=[];Math.random=()=>0;e.spitterTest.spawnEnemy(s);assert.ok(s.enemies.length>0&&s.enemies[0].type==='emberling','Emberling branch stays first');
  e.godSetNoMobs(s,true);assert.equal(s.enemies.length,0);
 }finally{Math.random=oldRandom;F.chance=oldChance;}
});
test('Sapper speed is faster and Spitter shots clear with the Sun encounter',()=>{
 const {s}=fresh();assert.equal(c.ENEMY_CONFIGS.scorch_sapper.speed,2.9);assert.equal(c.ENEMY_CONFIGS.scorch_sapper.maxHp,10);s.enemyShots=[{x:1,y:1,dx:1,dy:0,ownerId:1,ticks:0,flare:true}];sun.clearSunEncounter(s);assert.equal(s.enemyShots.length,0);
});


test('Sun adds Ghost, Bomber and Lancer after one minute, with Shooter much rarer and custom-only challenge pools unchanged',()=>{
 const {s}=fresh(),base=c.DIFFICULTY_TIERS[3].spawnTypes,copy=[...base],P=c.CHALLENGE_EXTRA_POOL;
 s.difficultyTimer=P.afterTicks-1;assert.deepEqual(e.spawnPool(s,base),base);
 s.difficultyTimer=P.afterTicks;const pool=e.spawnPool(s,base),count=type=>pool.filter(t=>t===type).length;
 for(const type of ['ghost','bomber','lancer']){assert.ok(pool.includes(type));assert.ok(count(type)>=4*count('shooter'));}
 assert.equal(count('shooter'),1);assert.equal(count('normal'),count('ghost'),'Normal no longer doubled after a minute');assert.deepEqual(base,copy,'shared base is unchanged');
 const other=e.createModeState('trial','storm_reaper');other.difficultyTimer=P.afterTicks+6000;assert.deepEqual(e.spawnPool(other,base),base);
});


test('fireball range endings ignite floor for three seconds; water clears the fire and hit effects expire only during gameplay',()=>{
 const {s,mob}=fresh();s.enemyShots=[{x:15.5*T,y:10.5*T,dx:F.shotSpeed,dy:0,ticks:F.shotLife-1,ownerId:mob.id,flare:true}];e.spitterTest.updateEnemyShots(s);
 assert.equal(s.enemyShots.length,0);assert.ok(s.sun.burning.some(b=>b.x===15&&b.y===10&&b.ticks===F.fireTicks));
 s.sun.spitterHits=[{x:s.playerX,y:s.playerY,ticks:24}];s.gamePhase='rules';sun.updateSun(s);assert.equal(s.sun.spitterHits[0].ticks,24);s.gamePhase='playing';
 for(let i=0;i<24;i++)sun.updateSun(s);assert.equal(s.sun.spitterHits.length,0);
 assert.ok(sun.useCoolingWave(s));assert.equal(s.sun.burning.length,0);
});
test('Sapper attachment blocks manual and Hydro station charging, drains with a bounded sound, and resumes charging after removal',()=>{
 const {s,mob}=fresh();s.enemies=[];s.sun.stations=[{id:0,x:10,y:10,charge:80,blocked:false}];s.sun.charging=true;
 const sap=e.createEncounterEnemy(s,'scorch_sapper',11,10,c.SUN.sapperHP);s.enemies.push(sap);const station=s.sun.stations[0],oldAudio=global.Audio,calls=[];
 global.Audio=class{constructor(src){this.src=src;}play(){calls.push(this.src);return Promise.resolve();}};
 try{
  for(let i=0;i<120;i++){s.gameTick++;sun.updateScorchSapper(s,sap);sun.updateSun(s);}
  assert.ok(station.blocked&&station.sapped);assert.ok(station.charge<80);assert.equal(calls.filter(src=>src.endsWith('empty-charge.wav')).length,2);
  const charge=station.charge;assert.ok(sun.useCoolingWave(s));assert.ok(s.enemies.includes(sap));assert.equal(sap.hp,9);assert.equal(station.charge,charge);
  sap.hp=0;e.killEnemy(s,s.enemies.indexOf(sap));sun.updateSun(s);assert.equal(station.blocked,false);assert.ok(station.charge>charge);
 }finally{if(oldAudio===undefined)delete global.Audio;else global.Audio=oldAudio;}
});
test('Spitter fire sound layers play once per volley',()=>{
 const {s,mob}=fresh(),oldAudio=global.Audio,calls=[];global.Audio=class{constructor(src){this.src=src;}play(){calls.push(this.src);return Promise.resolve();}};
 try{advance(s,mob,F.warningTicks+1);assert.equal(calls.filter(x=>x.endsWith('kingFireSpell.mp3')).length,1);assert.equal(calls.filter(x=>x.endsWith('kingFireSpread.wav')).length,1);}finally{if(oldAudio===undefined)delete global.Audio;else global.Audio=oldAudio;}
});

test('Sun phase 2+ sometimes adds one extra ordinary alien on top of a regular spawn; phase 1 never does',()=>{
 const old=Math.random;
 try{for(const [phase,extra] of [[1,false],[2,true]]){
  const {s}=fresh();s.enemies=[];s.difficultyLevel=3;s.sun.phase=phase;
  Math.random=()=>.01; // every roll low: the usual spawn is an Emberling, and the extra roll passes
  e.spitterTest.spawnEnemy(s);
  assert.equal(s.enemies.length>1,extra,'phase '+phase);
 }}finally{Math.random=old;}
});

test('a Flare Spitter has flame armor until water douses it',()=>{
 const {s,mob}=fresh();mob.hp=mob.maxHp=10;e.damageEnemy(s,mob,5,'player');assert.equal(mob.hp,10-5*F.armor,'armored');
 mob.doused=true;e.damageEnemy(s,mob,5,'player');assert.equal(mob.hp,10-5*F.armor-5,'doused: full damage');
});
