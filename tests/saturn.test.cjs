const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const saturnTest={updateEnemies,updatePlayer,updateMeteorite,spawnResource};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),a=require('../game/saturn.ts'),{SATURN:S}=a;
const near=(mob,x,y)=>Object.assign(mob,{tileX:x,targetTileX:x,tileY:y,targetTileY:y,x:(x+.5)*48,y:(y+.5)*48,stepProgress:0});
const player=(s,x,y)=>Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*48,playerY:(y+.5)*48,playerStepProgress:0,playerDirX:1,playerDirY:0});
function fresh(){const s=e.createModeState('trial','frost_warden');e.godSpawnBoss(s,'frost_warden');s.noMobs=true;s.meteoriteTimer=1e6;s.saturn.iceTimer=1e6;s.saturn.shieldTimer=1e6;const boss=a.saturnBoss(s);near(boss,39,39);player(s,10,10);s.rubyTileX=11;s.rubyTileY=10;s.frostIceTiles=[];return{s,boss,t:s.saturn};}
function roll(s,ticks=90){s.saturn.cooldown=0;assert.equal(a.beginSnowball(s),true);for(let i=0;i<ticks;i++)a.moveSaturnPlayer(s);assert.equal(a.releaseSnowball(s),true);for(let i=0;i<80&&s.saturn.roll;i++)a.moveSaturnPlayer(s);}
test('Saturn starts as a real three-phase challenge, with stackable Saturn Guard',()=>{
 const s=e.createModeState('trial','frost_warden');assert.ok(s.saturn);assert.ok(!s.trial.mapOnly);assert.equal(s.noMobs,false);
 assert.equal(s.playerShieldHP,20);e.useSpecialSkill(s);assert.equal(s.playerShieldHP,60);assert.equal(s.rubyShieldHP,60);
 s.specialSkill='frost_warden';e.useSpecialSkill(s);assert.equal(s.playerShieldHP,100);
 const endless=e.createInitialState();endless.specialSkill='frost_warden';e.useSpecialSkill(endless);endless.specialSkill='frost_warden';endless.specialLockTicks=0;e.useSpecialSkill(endless);assert.equal(endless.playerShieldHP,40);
});
test('guardian barrier ignores every ordinary damage source; weak guardian takes normal damage',()=>{
 const{s,boss,t}=fresh();assert.equal(boss.hp,S.phaseHP*3);
 for(const source of ['player','special','meteor','enemy','reflection','summon'])e.damageEnemy(s,boss,9999,source);
 assert.equal(boss.hp,boss.maxHp);assert.equal(t.barrier,S.barrier);t.barrier=0;t.weakTicks=100;e.damageEnemy(s,boss,20);assert.equal(boss.hp,boss.maxHp-20);
});
test('blizzard pulses drain shields before HP, use gentler alien damage and spare the Warden',()=>{
 const{s,boss,t}=fresh();const mob=e.createEncounterEnemy(s,'normal',39,10,8);mob.icyShieldHP=3;s.enemies.push(mob);
 for(const level of [1,2,3]){t.level=level;t.pulse=59;const hp=s.playerHP,sh=s.playerShieldHP,r=s.rubyShieldHP,ice=mob.icyShieldHP,bhp=boss.hp;a.updateSaturn(s);assert.equal(s.playerHP,hp);assert.equal(s.playerShieldHP,sh-S.damage[level-1]*.5);assert.equal(s.rubyShieldHP,r-S.damage[level-1]*.5);assert.equal(mob.icyShieldHP,ice-S.enemyDamage[level-1]*.5);assert.equal(boss.hp,bhp);}
 s.playerShieldHP=1;t.level=2;t.pulse=59;a.updateSaturn(s);assert.equal(s.playerShieldHP,0);assert.equal(s.playerHP,98);
});
test('blizzard keeps full HP damage without shields and applies half shield cost after defenses',()=>{
 const{s,t}=fresh();s.playerShieldHP=s.rubyShieldHP=0;t.level=2;t.pulse=59;a.updateSaturn(s);assert.equal(s.playerHP,96);assert.equal(s.rubyHP,96);
 s.playerHP=s.rubyHP=100;s.playerShieldHP=s.rubyShieldHP=.85;s.constellations=['playerGuard','ruby'];t.pulse=59;a.updateSaturn(s);
 assert.ok(Math.abs(s.playerHP-98.3)<1e-9);assert.ok(Math.abs(s.rubyHP-98.3)<1e-9);assert.equal(s.playerShieldHP,0);assert.equal(s.rubyShieldHP,0);
 s.constellations=[];s.playerShieldHP=10;e.damagePlayer(s,4);assert.equal(s.playerShieldHP,6);
});
test('blizzard slows apply globally only when unshielded; shielded enemies keep full cadence',()=>{
 const{s,t}=fresh();s.playerShieldHP=0;assert.equal(e.isPlayerChilled(s),true);s.playerShieldHP=.01;assert.equal(e.isPlayerChilled(s),false);
 const mage=e.createEncounterEnemy(s,'ice_caller',39,10,12);mage.attackTimer=100;s.enemies.push(mage);s.gameTick=1;e.saturnTest.updateEnemies(s);assert.equal(mage.attackTimer,100);mage.icyShieldHP=1;e.saturnTest.updateEnemies(s);assert.equal(mage.attackTimer,99);
 t.weakTicks=100;s.playerShieldHP=0;assert.equal(e.isPlayerChilled(s),false);
});
test('storm escalates through three levels and caps there',()=>{
 const{s,t}=fresh();s.godMode=true;for(let i=0;i<S.levelTicks;i++)a.updateSaturn(s);assert.equal(t.level,2);for(let i=0;i<S.levelTicks*2;i++)a.updateSaturn(s);assert.equal(t.level,3);
});
test('charging allows walking, preview length grows, walls clip both preview and rush',()=>{
 const{s,t}=fresh();s.map=Array.from({length:51},()=>Array(51).fill(c.T_FLOOR));s.playerQueuedDirX=1;const x=s.playerX;a.beginSnowball(s);const short=a.snowballPath(s).length;
 for(let i=0;i<90;i++)e.saturnTest.updatePlayer(s);assert.ok(s.playerX>x);assert.ok(t.charging);assert.ok(a.snowballPath(s).length>short);player(s,10,10);
 s.map[10][14]=c.T_WALL;assert.equal(a.snowballPath(s).length,3);a.releaseSnowball(s);for(let i=0;i<90&&t.roll;i++)a.moveSaturnPlayer(s);assert.equal(s.playerTileX,13);assert.equal(s.playerTargetX,13);assert.equal(s.playerX,13.5*48);
});
test('snowball steals shields before dealing damage, once per unit, and ordinary attacks cancel it',()=>{
 const{s,t}=fresh(),mob=e.createEncounterEnemy(s,'normal',12,10,100);mob.icyShieldHP=24;s.enemies.push(mob);roll(s);assert.equal(s.playerShieldHP,44);assert.equal(s.rubyShieldHP,44);assert.equal(mob.icyShieldHP,0);assert.equal(mob.hp,98);
 for(const attack of [e.useLaser,e.useBullet,e.activateWave,e.useBomb]){t.cooldown=0;a.beginSnowball(s);const hp=mob.hp;attack(s);assert.equal(t.charging,false);assert.equal(mob.hp,hp);}
});
test('Ruby also receives the Armored shield reward when Snowball lands the killing hit',()=>{
 const{s}=fresh(),mob=e.createEncounterEnemy(s,'armored',12,10,1);s.enemies.push(mob);roll(s);assert.equal(mob.hp,-1);e.killEnemy(s,s.enemies.indexOf(mob));assert.equal(s.playerShieldHP,40);assert.equal(s.rubyShieldHP,40);
});
test('Snowball gives light shield impact shake and a stronger barrier break without weakening existing shake',()=>{
 const impact=(shield,bossHit=false)=>{
  const {s,boss,t}=fresh();
  if(bossHit){near(boss,12,10);s.playerShieldHP=shield;}
  else{const mob=e.createEncounterEnemy(s,'normal',12,10,100);mob.icyShieldHP=shield;s.enemies.push(mob);}
  s.screenShakeTicks=0;s.screenShakeAmt=0;roll(s);return s;
 };
 const plain=impact(0),shielded=impact(24),barrier=impact(40,true),broken=impact(S.barrier+20,true);
 assert.equal(plain.screenShakeTicks,0);
 assert.ok(shielded.screenShakeTicks>0);assert.ok(barrier.screenShakeTicks>shielded.screenShakeTicks);assert.ok(barrier.screenShakeAmt>shielded.screenShakeAmt);
 assert.ok(broken.screenShakeTicks>barrier.screenShakeTicks);assert.ok(broken.screenShakeAmt>barrier.screenShakeAmt);
 const {s,boss}=fresh();near(boss,12,10);s.playerShieldHP=S.barrier+20;s.screenShakeTicks=30;s.screenShakeAmt=16;roll(s);
 assert.equal(s.screenShakeTicks,30);assert.equal(s.screenShakeAmt,16);
});
test('ram refunds ten percent of shields, even a partial crack calms the storm; zero shield cannot crack it',()=>{
 const{s,boss,t}=fresh();near(boss,12,10);t.level=3;t.levelTicks=999;s.playerShieldHP=40;roll(s);assert.equal(s.playerShieldHP,4);assert.ok(Math.abs(t.barrier-(S.barrier-100*Math.expm1(Math.LN2*.4)))<1e-9);assert.equal(t.level,1);assert.equal(t.levelTicks,0);assert.equal(boss.hp,boss.maxHp);
 player(s,10,10);t.level=2;s.playerShieldHP=0;roll(s);assert.ok(Math.abs(t.barrier-(S.barrier-100*Math.expm1(Math.LN2*.4)))<1e-9);assert.equal(t.level,2);
});
test('breaking the barrier causes phase-based self damage, stops storm, exposes briefly, then loops',()=>{
 const{s,boss,t}=fresh();near(boss,12,10);s.playerShieldHP=S.barrier+20;roll(s);assert.equal(t.barrier,0);assert.equal(t.weakTicks,S.weakTicks);assert.equal(boss.hp,boss.maxHp-S.phaseHP*S.breakShare);assert.equal(a.saturnBlizzard(s),false);
 const hp=s.playerHP;for(let i=0;i<S.weakTicks-1;i++)a.updateSaturn(s);assert.equal(s.playerHP,hp);a.updateSaturn(s);assert.equal(t.barrier,S.barrier);assert.equal(a.saturnBlizzard(s),true);
});
test('frozen tiles halve player shield, cancel rush, and preserve Ruby shield',()=>{
 const{s,t}=fresh();s.playerShieldHP=400;s.rubyShieldHP=70;s.frostIceTiles=[[11,10]];roll(s);assert.equal(s.playerShieldHP,200);assert.equal(s.rubyShieldHP,70);assert.equal(s.playerFrozenTicks,c.FROST_FREEZE_DURATION);assert.equal(t.roll,null);
});
test('Warden grants up to three additive shields across chambers',()=>{
 const{s,t}=fresh();const mobs=[[10,10],[39,10],[10,39],[39,39]].map(([x,y])=>e.createEncounterEnemy(s,'normal',x,y,100));s.enemies.push(...mobs);t.shieldTimer=1;a.updateSaturn(s);assert.equal(mobs.filter(m=>m.icyShieldHP===20).length,3);assert.equal(s.laserBeams.length,3);
 mobs.forEach(m=>m.icyShieldHP=20);t.shieldTimer=1;a.updateSaturn(s);assert.equal(mobs.filter(m=>m.icyShieldHP===40).length,3);
});
test('Snowbowl telegraphs, steals once on contact and can be dodged sideways',()=>{
 for(const dodge of [false,true]){const{s}=fresh();s.rubyTileY=14;const mob=e.createEncounterEnemy(s,'frost_raider',8,10,18);s.enemies.push(mob);mob.attackTimer=0;a.updateFrostRaider(s,mob);assert.equal(mob.windupTicks,S.thiefWindup);
 if(dodge)player(s,10,12);for(let i=0;i<100;i++)a.updateFrostRaider(s,mob);assert.equal(s.playerShieldHP,dodge?20:0);assert.equal(mob.icyShieldHP,dodge?0:20);}
});
test('Frosticle marks the cast location; impact is dodgeable and leaves temporary floor-only ice',()=>{
 const{s,t}=fresh(),mage=e.createEncounterEnemy(s,'ice_caller',17,10,12);mage.attackTimer=0;a.updateIceCaller(s,mage);assert.equal(t.icicles.length,1);assert.deepEqual([t.icicles[0].x,t.icicles[0].y],[10,10]);player(s,12,10);
 const hp=s.playerHP;for(let i=0;i<S.icicleWarning;i++)a.updateSaturn(s);assert.equal(s.playerHP,hp);assert.ok(t.temporaryIce.some(i=>i.x===10&&i.y===10));assert.ok(t.temporaryIce.every(i=>e.isFloorTile(s.map,i.x,i.y)));
 for(let i=0;i<S.icicleIceTicks;i++)a.updateSaturn(s);assert.equal(t.temporaryIce.length,0);
});
test('Ice Cub strikes immediately in range, respects cooldown and moves at its faster configured speed',()=>{
 const{s}=fresh(),mob=e.createEncounterEnemy(s,'rime_brute',9,10,30);mob.attackTimer=0;a.updateRimeBrute(s,mob);assert.equal(mob.windupTicks,0);assert.equal(s.playerKnockback.tilesLeft,2);assert.equal(s.playerShieldHP,8);
 a.updateRimeBrute(s,mob);assert.equal(s.playerShieldHP,8);assert.equal(mob.attackTimer,179);
 near(mob,15,10);mob.targetTileX=14;mob.attackTimer=100;a.updateRimeBrute(s,mob);assert.equal(mob.stepProgress,3.2);
});
test('shield kill rewards add in Saturn, but refill outside it',()=>{
 for(const mode of ['saturn','endless']){const s=mode==='saturn'?fresh().s:e.createInitialState();s.playerShieldHP=30;const mob=e.createEncounterEnemy(s,'armored',10,10,1);s.enemies.push(mob);e.killEnemy(s,s.enemies.indexOf(mob));assert.equal(s.playerShieldHP,mode==='saturn'?50:30);}
});
test('pause freezes Saturn hazards and disallows charging or release',()=>{
 const{s,t}=fresh();a.beginSnowball(s);s.gamePhase='teleporting';const before=[t.levelTicks,t.shieldTimer,t.cooldown];e.tick(s);a.updateSaturn(s);assert.deepEqual([t.levelTicks,t.shieldTimer,t.cooldown],before);assert.equal(a.beginSnowball(s),false);assert.equal(a.releaseSnowball(s),false);assert.equal(t.charging,false);
});
test('all three phases have the same shield/storm loop; only final defeat wins and cleans hazards',()=>{
 const{s,t}=fresh();for(const phase of [1,2,3]){a.godSetSaturnPhase(s,phase);assert.equal(t.phase,phase);assert.equal(t.barrier,S.barrier);assert.equal(t.level,1);assert.equal(s.gamePhase,'playing');}
 const boss=a.saturnBoss(s);t.barrier=0;t.weakTicks=100;e.damageEnemy(s,boss,boss.hp);e.killEnemy(s,s.enemies.indexOf(boss));assert.equal(s.gamePhase,'won');assert.equal(t.roll,null);assert.equal(s.frostIceTiles.length,0);assert.equal(t.icicles.length,0);
});
test('blizzard uses supplied damage sound only for actual player/Ruby HP loss, once per pulse',()=>{
 const oldAudio=global.Audio,played=[];
 global.Audio=class{constructor(src){this.src=src;}play(){played.push(this.src);return Promise.resolve();}pause(){}};
 try{
  const{s,t}=fresh();played.length=0;t.pulse=59;a.updateSaturn(s);assert.deepEqual(played,[]);
  played.length=0;s.playerShieldHP=s.rubyShieldHP=0;t.pulse=59;a.updateSaturn(s);assert.deepEqual(played,['/sounds/blizzard-damage.mp3']);
  played.length=0;s.enemyDecoyActive=true;t.pulse=59;const ruby=s.rubyHP;a.updateSaturn(s);assert.equal(s.rubyHP,ruby-2);assert.deepEqual(played,['/sounds/blizzard-damage.mp3']);
  played.length=0;s.enemyDecoyActive=false;s.godMode=true;t.pulse=59;a.updateSaturn(s);assert.deepEqual(played,[]);
 }finally{global.Audio=oldAudio;}
});
test('beginning Snowball reuses bomb placement audio once, without bomb or speed side effects',()=>{
 const oldAudio=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this);return Promise.resolve();}pause(){}};
 try{const{s}=fresh();played.length=0;assert.equal(a.beginSnowball(s),true);assert.equal(a.beginSnowball(s),false);for(let i=0;i<90;i++)a.moveSaturnPlayer(s);assert.equal(played.length,1);assert.equal(played[0].src,'/sounds/place_bomb.wav');assert.equal(played[0].volume,.1625*e.ATTACK_SFX_VOLUME);assert.equal(s.bomb,null);assert.equal(s.speedActiveTicks,0);}
 finally{global.Audio=oldAudio;}
});
test('Snowball plays the supplied impact recording once per enemy hit, without retriggering contact',()=>{
 const oldAudio=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this.src);return Promise.resolve();}pause(){}};
 try{const{s}=fresh();for(let x=10;x<=20;x++)s.map[10][x]=c.T_FLOOR;for(const x of [12,14])s.enemies.push(e.createEncounterEnemy(s,'normal',x,10,100));played.length=0;roll(s);assert.equal(played.filter(src=>src==='/sounds/snowball-hit.mp3').length,2);}
 finally{global.Audio=oldAudio;}
});
test('Snowball release uses the louder alien laser shot with higher pitch',()=>{
 const oldAudio=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this);return Promise.resolve();}pause(){}};
 try{const{s}=fresh();a.beginSnowball(s);played.length=0;a.releaseSnowball(s);assert.equal(played.length,1);assert.equal(played[0].src,'/sounds/alienShootLaser.wav');assert.equal(played[0].volume,.2*e.ATTACK_SFX_VOLUME*3);assert.equal(played[0].playbackRate,1.3);assert.equal(played[0].preservesPitch,false);assert.equal(a.releaseSnowball(s),false);assert.equal(played.length,1);}
 finally{global.Audio=oldAudio;}
});
test('Snowball charge and travel have an eight-tile hard cap even on an open map',()=>{
 const{s,t}=fresh();s.map=Array.from({length:51},()=>Array(51).fill(c.T_FLOOR));a.beginSnowball(s);for(let i=0;i<600;i++)a.moveSaturnPlayer(s);assert.equal(t.charge,S.chargeTicks);assert.equal(a.snowballPath(s).length,8);const x=s.playerX;a.releaseSnowball(s);for(let i=0;i<100&&t.roll;i++)a.moveSaturnPlayer(s);assert.equal(s.playerX-x,8*48);
});
test('Perma Shield never drains from damage, freezing, theft or ramming; removing it restores normal rules',()=>{
 const{s,boss,t}=fresh();t.permaShield=true;s.playerShieldHP=s.rubyShieldHP=40;
 e.damagePlayer(s,9999);e.damageRuby(s,9999);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);assert.equal(s.playerShieldHP,40);assert.equal(s.rubyShieldHP,40);
 a.freezeSaturnPlayer(s);assert.equal(s.playerShieldHP,40);assert.equal(s.playerFrozenTicks,c.FROST_FREEZE_DURATION);s.playerFrozenTicks=0;
 const thief=e.createEncounterEnemy(s,'frost_raider',10,10,18);thief.chargeDirX=1;thief.frostRollLeft=1;a.updateFrostRaider(s,thief);assert.equal(s.playerShieldHP,40);
 near(boss,12,10);roll(s);assert.equal(s.playerShieldHP,40);assert.ok(Math.abs(t.barrier-(S.barrier-100*Math.expm1(Math.LN2*.4)))<1e-9);
 t.permaShield=false;s.playerShieldHP=s.rubyShieldHP=0;e.damagePlayer(s,2);e.damageRuby(s,2);assert.equal(s.playerHP,98);assert.equal(s.rubyHP,98);
});
test('Frosticle targets only within eight tiles and uses the slower attack interval',()=>{
 const{s,t}=fresh(),mage=e.createEncounterEnemy(s,'ice_caller',19,10,12);mage.attackTimer=0;a.updateIceCaller(s,mage);assert.equal(t.icicles.length,0);
 near(mage,18,10);a.updateIceCaller(s,mage);assert.equal(t.icicles.length,1);assert.equal(mage.attackTimer,480);
 for(let i=0;i<479;i++)a.updateIceCaller(s,mage);assert.equal(t.icicles.length,1);a.updateIceCaller(s,mage);assert.equal(t.icicles.length,2);assert.equal(S.icicleWarning-S.icicleFallTicks,120);assert.equal(S.icicleIceTicks,90);
});
test('frozen player cannot attack or cast Saturn Guard until thawing',()=>{
 for(const attack of [e.useLaser,e.useBullet,e.activateWave,e.useBomb,e.useSpecialSkill]){
  const{s}=fresh();s.playerFrozenTicks=90;const x=s.playerX,y=s.playerY;s.playerQueuedDirX=1;e.saturnTest.updatePlayer(s);assert.deepEqual([s.playerX,s.playerY],[x,y]);
  const before=JSON.stringify([s.laserBeams,s.laserBullets,s.waveEffects,s.bomb,s.playerShieldHP]);attack(s);assert.equal(JSON.stringify([s.laserBeams,s.laserBullets,s.waveEffects,s.bomb,s.playerShieldHP]),before);assert.equal(s.playerFrozenTicks,90);assert.deepEqual([s.playerX,s.playerY],[x,y]);s.playerFrozenTicks=0;attack(s);assert.notEqual(JSON.stringify([s.laserBeams,s.laserBullets,s.waveEffects,s.bomb,s.playerShieldHP]),before);
 }
});
test('No Boss preserves normal spawns and Frosticle impacts; No Mobs suppresses them independently',()=>{
 const{s,t}=fresh();s.noMobs=false;e.godSetNoBossSpawns(s,true);t.spawnTimer=1;a.updateSaturn(s);assert.equal(s.enemies.length,1);assert.equal(a.saturnBlizzard(s),false);
 const mage=e.createEncounterEnemy(s,'ice_caller',17,10,12);mage.attackTimer=0;s.enemies.push(mage);a.updateIceCaller(s,mage);assert.equal(t.icicles.length,1);s.godMode=true;
 for(let i=0;i<S.icicleWarning;i++)a.updateSaturn(s);assert.equal(t.icicles[0].landed,true);assert.ok(t.temporaryIce.length>0);
 s.noMobs=true;const count=s.enemies.length;t.spawnTimer=1;for(let i=0;i<S.spawnInterval*2;i++)a.updateSaturn(s);assert.equal(s.enemies.length,count);
});
test('Snowball wall contact uses the same impact sound, once; open maximum range is silent',()=>{
 const oldAudio=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this.src);return Promise.resolve();}pause(){}};
 try{for(const wall of [true,false]){const{s}=fresh();for(let x=10;x<=20;x++)s.map[10][x]=c.T_FLOOR;if(wall)s.map[10][14]=c.T_WALL;played.length=0;roll(s);assert.equal(played.filter(src=>src==='/sounds/snowball-hit.mp3').length,wall?1:0);}}
 finally{global.Audio=oldAudio;}
});
test('only Snowbowls are born with shield; every other Saturn spawn starts unshielded',()=>{
 const random=Math.random;
 try{for(const [pick,type] of [[.1,'frost_raider'],[.35,'ice_caller'],[.55,'rime_brute'],[.75,'armored'],[.95,'normal']]){
  const{s,t}=fresh();s.noMobs=false;t.spawnTimer=1;const values=[0,0,pick];Math.random=()=>values.shift()??.5;a.updateSaturn(s);const mob=s.enemies.find(m=>m.id!==t.bossId);assert.equal(mob.type,type);assert.equal(mob.icyShieldHP,type==='frost_raider'?24:0);
 }}finally{Math.random=random;}
});
test('Snowbowl reuses player Snowball wind-up, pitched release and impact recordings',()=>{
 const oldAudio=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this);return Promise.resolve();}pause(){}};
 try{const{s}=fresh();for(let x=5;x<=20;x++)s.map[10][x]=c.T_FLOOR;const bandit=e.createEncounterEnemy(s,'frost_raider',8,10,18);bandit.attackTimer=0;played.length=0;
  a.updateFrostRaider(s,bandit);assert.equal(played[0].src,'/sounds/place_bomb.wav');for(let i=0;i<S.thiefWindup;i++)a.updateFrostRaider(s,bandit);
  assert.equal(played[1].src,'/sounds/alienShootLaser.wav');assert.equal(played[1].playbackRate,1.3);assert.equal(played[1].volume,.2*e.ATTACK_SFX_VOLUME*3);
  for(let i=0;i<40;i++)a.updateFrostRaider(s,bandit);assert.equal(played.filter(s=>s.src==='/sounds/snowball-hit.mp3').length,1);
 }finally{global.Audio=oldAudio;}
});
test('Snowball cooldown is two seconds and emits the existing map-ready cue once on completion',()=>{
 const ui=require('../game/ui-sfx.ts'),old=ui.playUiSfx,played=[];ui.playUiSfx=kind=>played.push(kind);
 try{const{s,t}=fresh();assert.equal(S.cooldown,120);t.cooldown=2;a.updateSaturn(s);assert.deepEqual(played,[]);a.updateSaturn(s);a.updateSaturn(s);assert.deepEqual(played,['fenceReady']);s.gamePhase='teleporting';t.cooldown=1;a.updateSaturn(s);assert.equal(t.cooldown,1);assert.equal(played.length,1);}
 finally{ui.playUiSfx=old;}
});
test('Ice Cub shares Emberling/Ragecap knockback through shields and Invincible, stopping at walls',()=>{
 for(const wall of [false,true]){const{s}=fresh();s.godMode=true;const cub=e.createEncounterEnemy(s,'rime_brute',9,10,30);cub.attackTimer=0;
  if(wall)s.map[10][11]=c.T_WALL;a.updateRimeBrute(s,cub);for(let i=0;i<45;i++)a.updateRimeBrute(s,cub);
  assert.equal(s.playerHP,100);assert.equal(s.screenShakeTicks,8);assert.equal(s.playerKnockback?.tilesLeft,wall?undefined:2);
  const x=s.playerX;for(let i=0;i<80;i++)e.saturnTest.updatePlayer(s);assert.equal(s.playerX-x,wall?0:2*48);
 }
});
test('active Snowball rolls take damage but ignore knockback; stationary charging can be interrupted',()=>{
 for(const rolling of [false,true]){const{s,t}=fresh(),cub=e.createEncounterEnemy(s,'rime_brute',9,10,30);cub.attackTimer=0;a.beginSnowball(s);if(rolling)a.releaseSnowball(s);
  a.updateRimeBrute(s,cub);assert.equal(s.playerShieldHP,8);
  if(rolling){assert.ok(t.roll);assert.equal(s.playerKnockback,null);assert.equal(e.shovePlayerFromEnemy(s,cub,2),false);}
  else{assert.equal(t.charging,false);assert.equal(s.playerKnockback.tilesLeft,2);}
 }
});

 test('Saturn combat kills add ten shield to both characters; environmental deaths do not',()=>{
  const {s}=fresh();
  for(const type of ['normal','frost_raider','ice_caller','rime_brute']){
   const mob=e.createEncounterEnemy(s,type,12,10,1);s.enemies.push(mob);e.killEnemy(s,s.enemies.indexOf(mob));
  }
  assert.equal(s.playerShieldHP,60);assert.equal(s.rubyShieldHP,60);
  const mob=e.createEncounterEnemy(s,'normal',12,10,1);s.enemies.push(mob);e.killEnemy(s,s.enemies.indexOf(mob),true);
  assert.equal(s.playerShieldHP,60);assert.equal(s.rubyShieldHP,60);
 });

test('Saturn enemies target placed Ruby, attack her and fall back to the player when carried',()=>{
 for(const [type,update] of [['ice_caller',a.updateIceCaller],['rime_brute',a.updateRimeBrute],['frost_raider',a.updateFrostRaider]]){
  const {s,t}=fresh();player(s,25,10);s.rubyTileX=10;s.rubyTileY=10;
  const mob=e.createEncounterEnemy(s,type,9,10,100);mob.attackTimer=0;s.enemies.push(mob);const hp=s.rubyHP;
  update(s,mob);assert.equal(mob.targeting,'ruby');
  if(type==='ice_caller'){
   assert.deepEqual([t.icicles[0].x,t.icicles[0].y],[10,10]);s.rubyShieldHP=0;
   for(let i=0;i<S.icicleWarning;i++)a.updateSaturn(s);
  }else if(type==='frost_raider'){
   for(let i=0;i<100;i++)update(s,mob);
   assert.equal(mob.icyShieldHP,20);assert.equal(s.rubyShieldHP,0);
  }else assert.equal(s.rubyShieldHP,8);
  if(type!=='rime_brute')assert.ok(s.rubyHP<hp);
  s.rubyTileX=-1;update(s,mob);assert.equal(mob.targeting,'player');
 }
});

test('barrier rams scale exponentially, rewarding larger shield pools per point spent',()=>{
 let previousEfficiency=0;
 for(const [shield,expected] of [[0,0],[25,18.9207115],[50,41.4213562],[100,100],[150,182.8427125]]){
  const {s,boss,t}=fresh();near(boss,12,10);s.playerShieldHP=shield;roll(s);
  const damage=S.barrier-t.barrier;assert.ok(Math.abs(damage-expected)<1e-6);assert.equal(s.playerShieldHP,shield*.1);
  if(shield){assert.ok(damage/shield>previousEfficiency);previousEfficiency=damage/shield;}
 }
 const {s,boss,t}=fresh();near(boss,12,10);s.playerShieldHP=600;roll(s);
 assert.equal(t.barrier,0);assert.equal(t.weakTicks,S.weakTicks);
});

test('barrier hits heal proportionally plus a separate break bonus, including carried Ruby, capped at full HP',()=>{
 for(const carried of [false,true]){
  const {s,boss,t}=fresh();near(boss,12,10);if(carried)s.rubyTileX=-1;
  s.playerHP=c.PLAYER_MAX_HP*.5;s.rubyHP=c.RUBY_MAX_HP*.5;s.playerShieldHP=40;roll(s);
  const healed=(S.barrier-t.barrier)/S.barrier*.2;assert.ok(Math.abs(s.playerHP-c.PLAYER_MAX_HP*(.5+healed))<=.05);assert.ok(Math.abs(s.rubyHP-c.RUBY_MAX_HP*(.5+healed))<1e-9);
  player(s,10,10);s.playerShieldHP=600;roll(s);
  assert.equal(t.barrier,0);assert.ok(Math.abs(s.playerHP-c.PLAYER_MAX_HP*.9)<1e-9);assert.ok(Math.abs(s.rubyHP-c.RUBY_MAX_HP*.9)<1e-9);
  assert.equal(s.screenShakeTicks,30);assert.equal(s.screenShakeAmt,16);
  player(s,10,10);roll(s);assert.ok(Math.abs(s.playerHP-c.PLAYER_MAX_HP*.9)<1e-9);assert.ok(Math.abs(s.rubyHP-c.RUBY_MAX_HP*.9)<1e-9);
  player(s,10,10);t.barrier=S.barrier;t.weakTicks=0;s.playerShieldHP=600;s.playerHP=c.PLAYER_MAX_HP-1;s.rubyHP=c.RUBY_MAX_HP-1;roll(s);
  assert.equal(s.playerHP,c.PLAYER_MAX_HP);assert.equal(s.rubyHP,c.RUBY_MAX_HP);
 }
});

test('boss ram refunds player shield on a break and while exposed without adding Ruby shield',()=>{
 const {s,boss,t}=fresh();near(boss,12,10);s.playerShieldHP=600;const ruby=s.rubyShieldHP;roll(s);
 assert.equal(t.barrier,0);assert.equal(s.playerShieldHP,60);assert.equal(s.playerSaturnShield,true);assert.equal(s.rubyShieldHP,ruby);
 player(s,10,10);roll(s);assert.equal(s.playerShieldHP,6);assert.equal(s.rubyShieldHP,ruby);
});

test('Saturn shield shards spawn in the shared resource pool and grant both shields once',()=>{
 const random=Math.random;
 try{
  Math.random=()=>.99;const {s}=fresh();s.resources=[];e.saturnTest.spawnResource(s);assert.equal(s.resources[0].type,'shield');
  const outside=e.createInitialState();outside.resources=[];e.saturnTest.spawnResource(outside);assert.equal(outside.resources[0].type,'energy');
  s.resources=[{type:'shield',tileX:s.playerTileX,tileY:s.playerTileY}];const energy=s.starEnergy,hp=s.playerHP;
  e.saturnTest.updatePlayer(s);assert.equal(s.playerShieldHP,60);assert.equal(s.rubyShieldHP,60);assert.equal(s.resources.length,0);assert.equal(s.starEnergy,energy);assert.equal(s.playerHP,hp);
  e.saturnTest.updatePlayer(s);assert.equal(s.playerShieldHP,60);assert.equal(s.rubyShieldHP,60);
 }finally{Math.random=random;}
});

test('stealing enemy shield stuns and interrupts its attack; unshielded hits do not stun',()=>{
 for(const type of ['normal','frost_raider','ice_caller','rime_brute']){
  const {s}=fresh();const mob=e.createEncounterEnemy(s,type,12,10,100);mob.icyShieldHP=20;mob.windupTicks=30;mob.frostRollLeft=100;mob.shootTicks=20;s.enemies.push(mob);
  roll(s);assert.equal(mob.buildStopUntil,s.gameTick+72);assert.equal(mob.windupTicks,0);assert.equal(mob.frostRollLeft,0);assert.equal(mob.shootTicks,0);
  const before=JSON.stringify(mob);s.gameTick=mob.buildStopUntil-1;e.saturnTest.updateEnemies(s);assert.equal(JSON.stringify(mob),before);
 }
 const {s}=fresh();const mob=e.createEncounterEnemy(s,'normal',12,10,100);s.enemies.push(mob);roll(s);assert.equal(mob.buildStopUntil,undefined);
});

test('player attacks absorb one hundred percent of actual non-boss shield damage only',()=>{
 const {s,boss,t}=fresh();const mob=e.createEncounterEnemy(s,'normal',12,10,100);mob.icyShieldHP=10;s.enemies.push(mob);
 e.damageEnemy(s,mob,4);assert.equal(s.playerShieldHP,24);assert.equal(s.rubyShieldHP,20);assert.equal(mob.icyShieldHP,6);
 e.damageEnemy(s,mob,20,'special');assert.equal(s.playerShieldHP,30);assert.equal(mob.hp,86);
 e.damageEnemy(s,mob,5);assert.equal(s.playerShieldHP,30);
 for(const source of ['enemy','meteor','reflection','summon']){mob.icyShieldHP=10;e.damageEnemy(s,mob,4,source);assert.equal(s.playerShieldHP,30);}
 e.damageEnemy(s,boss,100);assert.equal(s.playerShieldHP,30);assert.equal(t.barrier,S.barrier);
 const outside=e.createInitialState();const alien=e.createEncounterEnemy(outside,'normal',12,10,100);alien.icyShieldHP=10;outside.enemies.push(alien);e.damageEnemy(outside,alien,4);assert.equal(outside.playerShieldHP,0);
});
test('blizzard is fifty percent stronger in the current boss chamber for every vulnerable unit',()=>{
 for(const shielded of [false,true])for(const level of [1,2,3]){
  const {s,boss,t}=fresh();near(boss,10,10);s.playerShieldHP=s.rubyShieldHP=shielded?100:0;
  const inside=e.createEncounterEnemy(s,'normal',12,10,100),outside=e.createEncounterEnemy(s,'normal',39,10,100);inside.icyShieldHP=outside.icyShieldHP=shielded?100:0;s.enemies.push(inside,outside);
  t.level=level;t.pulse=59;a.updateSaturn(s);
  if(shielded){assert.equal(s.playerShieldHP,100-S.damage[level-1]*1.5*.5);assert.equal(s.rubyShieldHP,s.playerShieldHP);assert.equal(inside.icyShieldHP,100-S.enemyDamage[level-1]*1.5*.5);assert.equal(outside.icyShieldHP,100-S.enemyDamage[level-1]*.5);}
  else{assert.equal(s.playerHP,100-S.damage[level-1]*1.5);assert.equal(s.rubyHP,s.playerHP);assert.equal(inside.hp,100-S.enemyDamage[level-1]*1.5);assert.equal(outside.hp,100-S.enemyDamage[level-1]);}
  assert.equal(boss.hp,boss.maxHp);
 }
});

test('Snowball Warden impacts are louder and higher pitched, with strong shake even while exposed',()=>{
 const oldAudio=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this);return Promise.resolve();}pause(){}};
 try{for(const exposed of [false,true]){
  const {s,boss,t}=fresh();near(boss,12,10);if(exposed){t.barrier=0;t.weakTicks=100;}
  played.length=0;roll(s);const hits=played.filter(sound=>sound.src==='/sounds/snowball-hit.mp3');assert.equal(hits.length,1);
  assert.equal(hits[0].volume,1);assert.equal(hits[0].playbackRate,1.25);assert.equal(hits[0].preservesPitch,false);
  assert.equal(s.screenShakeTicks,18);assert.equal(s.screenShakeAmt,10);
 }}finally{global.Audio=oldAudio;}
});

test('Snowball stops outside the near side of the Warden in all directions, shielded or exposed',()=>{
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])for(const exposed of [false,true]){
  const {s,boss,t}=fresh();s.map=Array.from({length:51},()=>Array(51).fill(c.T_FLOOR));near(boss,10+dx*2,10+dy*2);boss.x+=dx*17+dy*8;boss.y+=dy*17+dx*8;
  s.playerDirX=dx;s.playerDirY=dy;s.playerQueuedDirX=dx;s.playerQueuedDirY=dy;if(exposed){t.barrier=0;t.weakTicks=100;}
  roll(s);assert.equal(t.roll,null);const reach=Math.ceil(c.TILE_SIZE*c.ENEMY_CONFIGS.frost_warden.bodyFraction/2)+15;
  assert.ok((s.playerX-boss.x)*dx+(s.playerY-boss.y)*dy<=-reach);assert.equal(s.playerQueuedDirX,0);assert.equal(s.playerQueuedDirY,0);
  const position=[s.playerX,s.playerY];e.saturnTest.updatePlayer(s);assert.deepEqual([s.playerX,s.playerY],position);
 }
});

test('Snowball misses refund cooldown immediately; any enemy or boss contact keeps it',()=>{
 for(const kind of ['range','wall','immediate-wall','cancel','freeze','enemy','boss']){
  const {s,boss,t}=fresh();s.map=Array.from({length:51},()=>Array(51).fill(c.T_FLOOR));
  if(kind==='wall')s.map[10][14]=c.T_WALL;if(kind==='immediate-wall')s.map[10][11]=c.T_WALL;
  if(kind==='enemy')s.enemies.push(e.createEncounterEnemy(s,'normal',12,10,100));if(kind==='boss')near(boss,12,10);
  a.beginSnowball(s);t.charge=S.chargeTicks;a.releaseSnowball(s);
  if(kind==='cancel')a.cancelSnowball(s);else if(kind==='freeze')a.freezeSaturnPlayer(s);else for(let i=0;i<100&&t.roll;i++)a.moveSaturnPlayer(s);
  assert.equal(t.roll,null);assert.equal(t.cooldown,kind==='enemy'||kind==='boss'?S.cooldown:0,kind);
 }
});

test('proportional barrier healing uses actual damage, excluding overkill and zero shield hits',()=>{
 const {s,boss,t}=fresh();near(boss,12,10);s.playerHP=s.rubyHP=20;s.playerShieldHP=0;roll(s);assert.equal(s.playerHP,20);assert.equal(s.rubyHP,20);
 player(s,10,10);s.playerShieldHP=100;roll(s);assert.equal(t.barrier,S.barrier-100);assert.equal(s.playerHP,20.4);assert.equal(s.rubyHP,20.4);
 player(s,10,10);t.barrier=100;s.playerShieldHP=600;roll(s);assert.equal(t.barrier,0);assert.equal(s.playerHP,40.8);assert.equal(s.rubyHP,40.8);
});

test('barrier shatter triggers only on break, pauses with gameplay and expires or clears cleanly',()=>{
 const {s,boss,t}=fresh();near(boss,12,10);s.playerShieldHP=100;roll(s);assert.equal(t.shatter,null);
 player(s,10,10);s.playerShieldHP=600;const hp=boss.hp;roll(s);assert.equal(hp-boss.hp,240);assert.equal(t.shatter.ticks,S.shatterTicks);
 s.gamePhase='teleporting';a.updateSaturn(s);assert.equal(t.shatter.ticks,S.shatterTicks);s.gamePhase='playing';
 for(let i=0;i<S.shatterTicks;i++)a.updateSaturn(s);assert.equal(t.shatter,null);
 t.shatter={x:boss.x,y:boss.y,ticks:S.shatterTicks};a.clearSaturnEncounter(s);assert.equal(t.shatter,null);
});

test('full Warden barrier break layers supplied glass sound once, excluding partial and exposed hits',()=>{
 const oldAudio=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this);return Promise.resolve();}pause(){}};
 try{
  const {s,boss}=fresh();near(boss,12,10);s.playerShieldHP=100;roll(s);assert.equal(played.filter(a=>a.src==='/sounds/saturn-barrier-break.mp3').length,0);
  player(s,10,10);s.playerShieldHP=600;roll(s);const glass=played.filter(a=>a.src==='/sounds/saturn-barrier-break.mp3');assert.equal(glass.length,1);assert.equal(glass[0].volume,.85);
  player(s,10,10);roll(s);assert.equal(played.filter(a=>a.src==='/sounds/saturn-barrier-break.mp3').length,1);
 }finally{global.Audio=oldAudio;}
});

test('Saturn Warden relocates on the normal interval and warns extra destination-chamber ice',()=>{
 const {s,boss,t}=fresh();assert.equal(boss.phaseTimer,c.FROST_RELOCATE_INTERVAL);const room=c.chamberOfTile(boss.tileX,boss.tileY);
 boss.phaseTimer=2;a.updateSaturn(s);assert.equal(c.chamberOfTile(boss.tileX,boss.tileY),room);a.updateSaturn(s);
 const destination=c.chamberOfTile(boss.tileX,boss.tileY);assert.notEqual(destination,room);assert.equal(boss.phaseTimer,c.FROST_RELOCATE_INTERVAL);
 assert.equal(t.nextIce.length,S.iceCount+S.bossIceCount);assert.ok(t.nextIce.filter(([x,y])=>c.chamberOfTile(x,y)===destination).length>=S.bossIceCount);
 assert.equal(new Set(t.nextIce.map(p=>p.join(','))).size,t.nextIce.length);assert.ok(t.nextIce.every(([x,y])=>e.isFloorTile(s.map,x,y)));
 for(let i=0;i<S.iceWarning-1;i++)a.updateSaturn(s);assert.equal(s.frostIceTiles.length,S.iceCount+S.bossIceCount);
 const timer=boss.phaseTimer;t.weakTicks=10;a.updateSaturn(s);assert.equal(boss.phaseTimer,timer);
 s.gamePhase='teleporting';a.updateSaturn(s);assert.equal(boss.phaseTimer,timer);
});

test('shielded players are mildly slowed only inside the Warden chamber during blizzard',()=>{
 for(const mode of ['inside','outside','weak']){
  const {s,boss,t}=fresh();if(mode!=='outside')near(boss,12,10);if(mode==='weak')t.weakTicks=100;
  assert.equal(e.isPlayerChilled(s),mode==='inside');s.playerQueuedDirX=1;e.saturnTest.updatePlayer(s);e.saturnTest.updatePlayer(s);
  assert.ok(Math.abs(s.playerStepProgress-c.PLAYER_BASE_SPEED*(mode==='inside'?.85:1))<1e-9);
  s.laserCooldown=100;for(let i=0;i<10;i++)e.tick(s);assert.ok(Math.abs(s.laserCooldown-(mode==='inside'?91.5:90))<1e-9);
 }
});
