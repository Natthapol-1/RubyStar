const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),b=require('../game/endless-builds.ts');
const near=(a,v)=>assert.ok(Math.abs(a-v)<1e-7,`${a} != ${v}`);
function fresh(upgrades=[],blessings=[]){const s=e.createInitialState();s.constellations=upgrades;s.build.blessings=blessings;s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.godMode=true;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*c.TILE_SIZE;s.rubyTileX=s.rubyTileY=30;return s;}
function mob(s,x=11,y=10,type='normal',hp=1000){const a=e.createEncounterEnemy(s,type,x,y,hp);a.pathTimer=a.windupTicks=a.attackTimer=1e7;s.enemies.push(a);return a;}
const ticks=(s,n)=>{for(let i=0;i<n;i++)e.tick(s);};
test('Endless overlap waits ninety seconds from stage 20, caps at two encounters and pauses in menus',()=>{
 assert.equal(e.ENDLESS_BOSS_OVERLAP_TICKS,90*60);
 const s=fresh();s.noBossSpawns=false;s.bossesKilled=20;mob(s,39,39,'fiery_king');s.bossOverlapTicks=e.ENDLESS_BOSS_OVERLAP_TICKS-c.BOSS_WARNING_TICKS-1;
 e.tick(s);assert.equal(e.countBossEncounters(s),1);assert.equal(s.bossWarningTicks,c.BOSS_WARNING_TICKS);
 s.gamePhase='teleporting';const timer=s.bossOverlapTicks;ticks(s,120);assert.equal(s.bossOverlapTicks,timer);s.gamePhase='playing';
 ticks(s,c.BOSS_WARNING_TICKS-1);assert.equal(e.countBossEncounters(s),1);e.tick(s);assert.equal(e.countBossEncounters(s),2);assert.equal(s.bossOverlapTicks,0);
 s.bossOverlapTicks=e.ENDLESS_BOSS_OVERLAP_TICKS+100;ticks(s,120);assert.equal(e.countBossEncounters(s),2);
 const early=fresh();early.noBossSpawns=false;early.bossesKilled=19;mob(early,39,39,'fiery_king');early.bossOverlapTicks=1e6;early.bossTimer=1;ticks(early,120);assert.equal(e.countBossEncounters(early),1);
});
test('Twins and Devourer copies count as one encounter and separate Devourer families reward separately',()=>{
 const s=fresh();e.godSpawnBoss(s,'astral_twins');assert.equal(s.enemies.filter(a=>a.type==='astral_twins').length,2);assert.equal(e.countBossEncounters(s),1);
 e.godSpawnBoss(s,'devourer');const parent=s.enemies.find(a=>a.type==='devourer');parent.hp=0;e.killEnemy(s,s.enemies.indexOf(parent));assert.ok(s.enemies.some(a=>a.type==='devourer'));assert.equal(e.countBossEncounters(s),1);
 const separate=mob(s,39,39,'devourer',1);separate.encounterId=separate.id;separate.chargeDirX=0;separate.hp=0;e.killEnemy(s,s.enemies.indexOf(separate));assert.equal(s.bossesKilled,1);assert.equal(e.countBossEncounters(s),1);
});
test('finishing one overlapping boss preserves the pending timer; finishing the last restores ordinary delay',()=>{
 const s=fresh();s.bossesKilled=20;const a=mob(s,35,35,'fiery_king'),other=mob(s,38,38,'storm_reaper');s.bossOverlapTicks=3000;s.bossTimer=7;
 a.hp=0;e.killEnemy(s,s.enemies.indexOf(a));assert.equal(s.bossOverlapTicks,3000);assert.equal(s.bossTimer,7);
 other.hp=0;e.killEnemy(s,s.enemies.indexOf(other));assert.equal(s.bossOverlapTicks,0);assert.equal(s.bossTimer,c.BOSS_SPAWN_INTERVAL);
});
test('all nine mechanic constellations are offered with numerical upgrades; simultaneous milestones queue',()=>{
 const s=fresh();s.bossesKilled=2;e.godAdvanceStage(s);const initial=[...s.constellationChoices];assert.equal(initial.length,3);s.bossesKilled=5;
 // God skips are gated while a reward is pending; actual defeats still queue correctly.
 const a=mob(s,35,35,'fiery_king',1);a.hp=0;e.killEnemy(s,s.enemies.indexOf(a));assert.deepEqual(s.constellationChoices,initial);assert.equal(s.queuedConstellationRewards,1);
 ticks(s,60);assert.equal(e.chooseConstellation(s,initial[2]),true);assert.equal(s.constellationChoices.length,3);assert.ok(!s.constellationChoices.includes(initial[2]));ticks(s,60);assert.equal(s.gamePhase,'constellation');
});
test('celestial blessings offer every remaining gemstone at 20 and every ten stages, with all ten identities',()=>{
 const s=fresh();assert.equal(Object.keys(b.CELESTIAL_BLESSINGS).filter(k=>k!=='stardust').length,10);
 for(let stage=20;stage<=110;stage+=10){s.bossesKilled=stage;b.offerCelestialBlessing(s);e.tick(s);assert.equal(s.gamePhase,'blessing');assert.equal(s.build.blessingChoices.length,10-s.build.blessings.length);const snapshot=JSON.stringify(s);ticks(s,20);assert.equal(JSON.stringify(s),snapshot);assert.equal(b.chooseCelestialBlessing(s,s.build.blessingChoices[0]),true);}
 s.bossesKilled=120;b.offerCelestialBlessing(s);e.tick(s);assert.equal(s.gamePhase,'playing');assert.equal(s.build.blessings.length,10);
 const trial=e.createModeState('trial','storm_reaper');trial.bossesKilled=20;b.offerCelestialBlessing(trial);assert.equal(trial.build.pendingBlessings,0);
});
test('stage 30 offers constellation first and blessing afterward without losing either',()=>{
 const s=fresh();s.bossesKilled=29;e.godAdvanceStage(s);ticks(s,60);assert.equal(s.gamePhase,'constellation');e.chooseConstellation(s,s.constellationChoices[0]);e.tick(s);assert.equal(s.gamePhase,'blessing');
 assert.equal(b.chooseCelestialBlessing(s,'invalid'),false);b.chooseCelestialBlessing(s,s.build.blessingChoices[0]);assert.equal(s.gamePhase,'playing');assert.equal(s.constellations.length,1);assert.equal(s.build.blessings.length,1);
});
test('Lepus fires two readable shots with only twenty percent total damage gain',()=>{
 const s=fresh(['twinShot']),a=mob(s);e.useBullet(s);assert.equal(s.laserBullets.length,2);assert.notEqual(s.laserBullets[0].y,s.laserBullets[1].y);ticks(s,5);near(1000-a.hp,c.BULLET_DMG*1.2);
});
test('Sagitta reflects once at a real wall, adds two return tiles, and reduces return damage',()=>{
 const s=fresh(['ricochet']),a=mob(s);s.map[10][13]=c.T_WALL;e.useLaser(s);near(1000-a.hp,c.LASER_DMG*1.5);assert.equal(s.laserBeams.filter(l=>l.dirX<-.98&&l.fromX===12.5*c.TILE_SIZE).length,1);assert.ok(s.laserBeams.length<=8);
});
test('delayed and Ruby waves are weaker, emit once, and never recursively create echoes',()=>{
 const s=fresh(['waveEcho','rubyWave']);s.rubyTileX=20;s.rubyTileY=20;const a=mob(s),rubyTarget=mob(s,21,20);e.activateWave(s);near(1000-a.hp,c.WAVE_DMG);near(1000-rubyTarget.hp,c.WAVE_DMG*.35);assert.equal(s.build.echoes.length,1);
 // Keep target still rather than allowing ordinary wave knockback to move it out of range.
 a.pushTiles=0;ticks(s,120);near(1000-a.hp,c.WAVE_DMG*1.4);assert.equal(s.build.echoes.length,0);ticks(s,30);near(1000-a.hp,c.WAVE_DMG*1.4);
});
test('Fornax pulls normal aliens on floor, never bosses or through walls, then detonates once',()=>{
 const s=fresh(['bombPull']);s.bomb={tileX:10,tileY:10,powered:false};const a=mob(s,13),boss=mob(s,13,11,'fiery_king');s.map[11][12]=c.T_WALL;const blocked=mob(s,13,11);e.useBomb(s);e.useBomb(s);assert.equal(s.bomb.detonateTicks,24);
 ticks(s,6);assert.equal(a.tileX,12);assert.equal(boss.tileX,13);assert.equal(blocked.tileX,13);ticks(s,18);assert.equal(s.bomb,null);assert.ok(a.hp<1000);assert.ok(s.bombCooldown>0);
});
test('boost trail slows only nearby enemies, expires, and the next fast charge is consumed once',()=>{
 const s=fresh(['boostTrail','boostCharge']),a=mob(s,10);e.useSpeedBoost(s);assert.equal(s.build.quickWave,true);ticks(s,10);assert.ok(s.build.zones.some(z=>z.kind==='trail'));near(b.buildSlowMultiplier(s,a),.65);
 e.pressCharge(s);assert.equal(s.chargeCount,2);e.pressCharge(s);assert.equal(s.chargeCount,0);assert.equal(s.build.quickWave,false);s.speedActiveTicks=0;ticks(s,110);assert.equal(s.build.zones.length,0);near(b.buildSlowMultiplier(s,a),1);
});
test('bullet marks detonate once with Charge Wave and expire without triggering',()=>{
 const s=fresh(['bulletMark']),a=mob(s),nearby=mob(s,12,11);for(let i=0;i<3;i++)b.buildBulletHit(s,a,1);e.activateWave(s);near(1000-a.hp,c.WAVE_DMG*1.5);near(1000-nearby.hp,c.WAVE_DMG*1.5);assert.equal(a.buildMarks,0);
 const clean=fresh(['bulletMark']),target=mob(clean);for(let i=0;i<3;i++)b.buildBulletHit(clean,target,1);clean.gameTick=361;e.activateWave(clean);near(1000-target.hp,c.WAVE_DMG);
});
test('Ruby copies all four laser directions only while placed and close, without recursion',()=>{
 const s=fresh(['rubyLaser']);s.rubyTileX=12;s.rubyTileY=10;const a=mob(s,12,12);e.useLaser(s);near(1000-a.hp,c.LASER_DMG*.35);assert.equal(s.laserBeams.length,8);
 s.laserCooldown=0;s.rubyTileX=-1;e.useLaser(s);assert.equal(s.laserBeams.length,12);
});
test('Ascension uses the same late Endless blessing and overlap rules',()=>{const s=fresh();s.mode='ascension';s.bossesKilled=20;b.offerCelestialBlessing(s);e.tick(s);assert.equal(s.gamePhase,'blessing');assert.equal(s.build.blessingChoices.length,10);});

test('Lepus aims at two separate enemies and keeps the second shot from hitting the first target',()=>{
 const s=fresh(['twinShot']),a=mob(s,11,10),other=mob(s,10,12);e.useBullet(s);assert.equal(s.laserBullets.length,2);assert.ok(s.laserBullets.some(b=>b.dx>0&&b.dy===0));assert.ok(s.laserBullets.some(b=>b.dy>0&&b.dx===0));ticks(s,12);near(1000-a.hp,c.BULLET_DMG*.6);near(1000-other.hp,c.BULLET_DMG*.6);
 const aligned=fresh(['twinShot']),front=mob(aligned,11),back=mob(aligned,13);e.useBullet(aligned);ticks(aligned,20);near(1000-front.hp,c.BULLET_DMG*.6);near(1000-back.hp,c.BULLET_DMG*.6);
});

test('Andromeda arms only after full Wave release, survives blocked input, and empowers one Laser',()=>{
 const s=fresh(['waveLaser']);for(let i=0;i<c.CHARGE_NEEDED-1;i++)e.pressCharge(s);assert.equal(s.build.waveLaserReady,false);
 e.pressCharge(s);assert.equal(s.build.waveLaserReady,true);s.laserCooldown=5;e.useLaser(s);assert.equal(s.build.waveLaserReady,true);
 s.laserCooldown=0;e.useLaser(s);assert.equal(s.build.waveLaserReady,false);assert.ok(s.laserBeams.every(l=>l.width===72));s.laserBeams=[];s.laserCooldown=0;e.useLaser(s);assert.ok(s.laserBeams.every(l=>l.width===undefined));
});
test('Andromeda pierces only one interior wall and catches adjacent bodies once without changing damage',()=>{
 const s=fresh(['waveLaser']);s.map[10][12]=c.T_WALL;s.map[10][14]=c.T_WALL;const behind=mob(s,13,10),blocked=mob(s,15,10),adjacent=mob(s,11,11);
 e.activateWave(s);const hp=behind.hp,otherHP=blocked.hp,sideHP=adjacent.hp;e.useLaser(s);
 near(hp-behind.hp,c.LASER_DMG);near(blocked.hp,otherHP);near(sideHP-adjacent.hp,c.LASER_DMG);assert.equal(s.map[10][12],c.T_WALL);assert.equal(s.map[10][14],c.T_WALL);
});
test('Andromeda delayed and Ruby echoes cannot refill the stored Laser charge',()=>{
 const s=fresh(['waveLaser','waveEcho','rubyWave']);e.activateWave(s);e.useLaser(s);assert.equal(s.build.waveLaserReady,false);ticks(s,30);assert.equal(s.build.waveLaserReady,false);assert.equal(e.createInitialState().build.waveLaserReady,false);
});
test('God Blessings editor pauses, toggles all ten without duplicates, and preserves milestone rewards',()=>{
 const s=fresh();s.build.pendingBlessings=1;assert.equal(b.openGodBlessings(s),true);assert.equal(s.gamePhase,'blessing');assert.equal(s.build.blessingChoices.length,10);const snapshot=JSON.stringify(s);ticks(s,10);assert.equal(JSON.stringify(s),snapshot);
 for(const kind of Object.keys(b.CELESTIAL_BLESSINGS).filter(k=>k!=='stardust')){assert.equal(b.chooseCelestialBlessing(s,kind),true);assert.ok(s.build.blessings.includes(kind));}
 assert.equal(s.build.blessings.length,10);for(const kind of Object.keys(b.CELESTIAL_BLESSINGS).filter(k=>k!=='stardust'))b.chooseCelestialBlessing(s,kind);assert.equal(s.build.blessings.length,0);
 assert.equal(b.closeGodBlessings(s),true);assert.equal(s.gamePhase,'playing');assert.equal(s.build.pendingBlessings,1);e.tick(s);assert.equal(s.gamePhase,'blessing');assert.equal(s.build.godBlessingMode,false);assert.equal(s.bossesKilled,0);
});

test('Sagitta gives the reflected beam a bounded random angle and damage follows that angle',()=>{
 const s=fresh(['ricochet']),target=mob(s,9,11);s.map[10][13]=c.T_WALL;const previous=Math.random;
 try{Math.random=()=>.01;e.useLaser(s);}finally{Math.random=previous;}
 const ray=s.laserBeams.find(l=>l.dirX<-.98&&l.dirY>0);assert.ok(ray);assert.ok(Math.abs(ray.dirY)<=Math.sin(Math.PI/24)+1e-8);assert.notEqual(ray.endY,ray.fromY);near(1000-target.hp,c.LASER_DMG*.5);
});

test('speed trail snaps to floor cells, refreshes without duplicates and slows only that cell',()=>{
 const s=fresh(['boostTrail']);s.speedActiveTicks=100;s.playerX=10*c.TILE_SIZE+2;s.playerY=10*c.TILE_SIZE+7;
 b.updateRunBuilds(s);assert.equal(s.build.zones.length,1);const zone=s.build.zones[0];assert.equal(zone.x,10.5*c.TILE_SIZE);assert.equal(zone.y,10.5*c.TILE_SIZE);
 s.playerX=11*c.TILE_SIZE-1;b.updateRunBuilds(s);assert.equal(s.build.zones.length,1);assert.equal(zone.ticks,89);
 const inside=mob(s,10,10),outside=mob(s,11,10);inside.x=10*c.TILE_SIZE+1;inside.y=10*c.TILE_SIZE+1;outside.x=11*c.TILE_SIZE+1;
 b.updateRunBuilds(s);assert.equal(inside.buildSlow,.65);assert.equal(outside.buildSlow,undefined);
 s.playerX=11*c.TILE_SIZE+1;b.updateRunBuilds(s);assert.equal(s.build.zones.length,2);
 s.map[10][12]=c.T_WALL;s.playerX=12.5*c.TILE_SIZE;b.updateRunBuilds(s);assert.equal(s.build.zones.length,2);
});

test('Sculptor applies one wall impact per direct Wave and preserves cover and interpolation',()=>{
 const s=fresh(['wallSlam']),a=mob(s,12,10);s.map[10][14]=c.T_WALL;e.activateWave(s);near(a.hp,1000-c.WAVE_DMG);ticks(s,3);near(a.hp,1000-c.WAVE_DMG*1.5);assert.equal(a.tileX,13);assert.equal(a.targetTileX,13);assert.equal(a.stepProgress,0);assert.equal(s.map[10][14],c.T_WALL);ticks(s,3);near(a.hp,1000-c.WAVE_DMG*1.5);
 const open=fresh(['wallSlam']),target=mob(open,12,10);e.activateWave(open);ticks(open,10);near(target.hp,1000-c.WAVE_DMG);assert.equal(target.buildWallDamage,undefined);
 const boss=fresh(['wallSlam']),king=mob(boss,12,10,'fiery_king');e.activateWave(boss);assert.equal(king.buildWallDamage,undefined);
});
test('Columba stores one wave only when manually healing Ruby, pauses and fires once near placed Ruby',()=>{
 const s=fresh(['rubyDefense']);s.rubyTileX=s.rubyTileY=10;s.rubyHP=80;assert.equal(e.healRuby(s),true);assert.equal(s.build.rubyWaveStored,true);
 s.rubyHealCooldown=0;e.healRuby(s);assert.equal(s.build.rubyWaveStored,true);
 s.gamePhase='teleporting';const a=mob(s,12,10);ticks(s,30);near(a.hp,1000);assert.equal(s.build.rubyWaveStored,true);s.gamePhase='playing';e.tick(s);near(a.hp,1000-c.WAVE_DMG*.5);assert.equal(s.build.rubyWaveStored,false);ticks(s,30);near(a.hp,1000-c.WAVE_DMG*.5);
 const other=fresh(['rubyDefense']);other.rubyTileX=other.rubyTileY=10;other.rubyHP=c.RUBY_MAX_HP;other.playerHP=50;assert.equal(e.healRuby(other),true);assert.equal(other.build.rubyWaveStored,false);
});
test('Columba stored wave travels with carried Ruby but only triggers after placing it',()=>{
 const s=fresh(['rubyDefense']);s.build.rubyWaveStored=true;s.rubyTileX=-1;s.playerCarryingRuby=true;const a=mob(s,11,10);b.updateRunBuilds(s);assert.equal(s.build.rubyWaveStored,true);near(a.hp,1000);
 s.playerCarryingRuby=false;s.rubyTileX=s.rubyTileY=10;b.updateRunBuilds(s);assert.equal(s.build.rubyWaveStored,false);near(a.hp,1000-c.WAVE_DMG*.5);
});
test('Pyxis leaves a one-hit decoy at teleport origin and restores the real player and Lunar Echo',()=>{
 const s=fresh(['teleportDecoy']);s.specialSkill='splitter_queen';e.useSpecialSkill(s);const lunar=s.lunarDecoy;s.gamePhase='teleporting';s.teleportDestOptions=[1];e.doTeleport(s,1);assert.equal(s.build.decoy.tileX,10);assert.equal(s.build.decoy.ticks,360);
 const a=mob(s,11,10);a.attackTimer=0;s.godMode=false;const hp=s.playerHP,rhp=s.rubyHP;const pos=[s.playerX,s.playerY,s.playerTileX,s.playerTileY];e.tick(s);assert.equal(s.build.decoy,null);assert.equal(s.lunarDecoy,lunar);assert.equal(lunar.hitsLeft,lunar.maxHits);assert.equal(s.playerHP,hp);assert.equal(s.rubyHP,rhp);assert.deepEqual([s.playerX,s.playerY,s.playerTileX,s.playerTileY],pos);assert.equal(s.enemyDecoyActive,false);assert.equal(s.build.decoyTargetActive,false);
});
test('Pyxis lures only nearby ordinary aliens, expires and cancelling teleport makes no decoy',()=>{
 const s=fresh(['teleportDecoy']);s.build.decoy={x:10.5*c.TILE_SIZE,y:10.5*c.TILE_SIZE,tileX:10,tileY:10,ticks:360};s.playerTileX=s.playerTargetX=18;s.playerTileY=s.playerTargetY=18;s.playerX=s.playerY=18.5*c.TILE_SIZE;s.rubyTileX=s.rubyTileY=30;const a=mob(s,13,10);a.pathTimer=0;e.tick(s);assert.equal(a.targeting,'player');assert.ok(a.path.length||a.targetTileX!==a.tileX);assert.equal(s.playerTileX,18);s.build.decoy.ticks=1;e.tick(s);assert.equal(s.build.decoy,null);
 s.gamePhase='teleporting';s.teleportDestOptions=[0];e.cancelTeleport(s);assert.equal(s.build.decoy,null);
});
test('Caelum crosses one interior cover tile, consumes the boost and synchronizes landing',()=>{
 const s=fresh(['wallStep']);s.map[10][11]=c.T_WALL;e.useSpeedBoost(s);s.playerQueuedDirX=1;e.tick(s);assert.equal(s.playerTileX,12);assert.equal(s.playerTargetX,12);assert.equal(s.playerX,12.5*c.TILE_SIZE);assert.equal(s.playerStepProgress,0);assert.equal(s.speedActiveTicks,0);assert.equal(s.build.wallStepReady,false);assert.equal(s.map[10][11],c.T_WALL);
 s.map[10][13]=c.T_WALL;ticks(s,10);assert.equal(s.playerTileX,12);
});
test('Caelum cannot cross thick walls, chamber boundaries or use free passive boosts',()=>{
 const s=fresh(['wallStep']);s.map[10][11]=s.map[10][12]=c.T_WALL;e.useSpeedBoost(s);s.playerQueuedDirX=1;e.tick(s);assert.equal(s.playerTileX,10);assert.equal(s.build.wallStepReady,true);
 const free=fresh(['wallStep']);free.map[10][11]=c.T_WALL;e.grantInstantSpeedBoost(free,false);free.playerQueuedDirX=1;e.tick(free);assert.equal(free.playerTileX,10);
 const edge=fresh(['wallStep']);edge.playerTileX=edge.playerTargetX=19;edge.playerX=19.5*c.TILE_SIZE;edge.map[10][20]=c.T_WALL;e.useSpeedBoost(edge);edge.playerQueuedDirX=1;e.tick(edge);assert.equal(edge.playerTileX,19);
});
test('Ara explodes on lethal bullet hits, shares its cooldown across shots and cannot chain itself',()=>{
 const s=fresh(['bulletBurst']),a=mob(s,11,10),nearby=mob(s,12,10),far=mob(s,14,10);a.hp=0;b.buildBulletHit(s,a,c.BULLET_DMG);near(nearby.hp,1000-c.BULLET_DMG);near(far.hp,1000);assert.equal(s.build.bulletBurstReadyAt,90);assert.equal(s.bombBlasts.length,1);b.buildBulletHit(s,nearby,c.BULLET_DMG);assert.equal(s.bombBlasts.length,1);
 s.gameTick=180;b.buildBulletHit(s,nearby,c.BULLET_DMG);assert.equal(s.bombBlasts.length,2);near(nearby.hp,1000-c.BULLET_DMG*2);
});

test('Pyxis taunts ordinary aliens through ten tiles but excludes aliens beyond the boundary and bosses',()=>{
 const s=fresh(['teleportDecoy']);s.build.decoy={x:10.5*c.TILE_SIZE,y:10.5*c.TILE_SIZE,tileX:10,tileY:10,ticks:360};
 s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=30;s.playerX=s.playerY=30.5*c.TILE_SIZE;s.rubyTileX=s.rubyTileY=30;
 const inside=mob(s,20,10),outside=mob(s,21,10),boss=mob(s,19,10,'fiery_king');inside.pathTimer=outside.pathTimer=boss.pathTimer=0;e.tick(s);
 assert.deepEqual(inside.path.at(-1),[10,10]);assert.notDeepEqual(outside.path.at(-1),[10,10]);assert.notDeepEqual(boss.path.at(-1),[10,10]);
 assert.equal(s.playerTileX,30);assert.equal(s.playerTileY,30);
});

test('Sagitta return reaches two tiles beyond its remaining range without extending the original ray',()=>{
 const s=fresh(['ricochet']),extra=mob(s,5,10),beyond=mob(s,3,10);s.map[10][13]=c.T_WALL;
 const previous=Math.random;Math.random=()=>.5;try{e.useLaser(s);}finally{Math.random=previous;}
 near(1000-extra.hp,c.LASER_DMG*1.5);near(1000-beyond.hp,c.LASER_DMG);
 const reflected=s.laserBeams.find(beam=>beam.fromX===12.5*c.TILE_SIZE&&beam.dirX===-1);assert.ok(reflected);near(Math.abs(reflected.endX-reflected.fromX)/c.TILE_SIZE,8);
});
test('Reticulum Laser hits stun ordinary aliens briefly, once per two seconds each; bosses are immune',()=>{
 const s=fresh(['laserWire']),a=mob(s,12,10),boss=mob(s,10,7,'fiery_king',1e6);e.useLaser(s);
 assert.ok(a.hp<1000);assert.equal(a.buildStopUntil,s.gameTick+c.RETICULUM.stunTicks);assert.equal(a.reticulumReadyAt,s.gameTick+c.RETICULUM.recoverTicks);
 assert.ok(boss.hp<1e6);assert.equal(boss.buildStopUntil,undefined);
 ticks(s,60);a.buildStopUntil=0;s.laserCooldown=0;e.useLaser(s);assert.equal(a.buildStopUntil,0,'still recovering');
 ticks(s,c.RETICULUM.recoverTicks);s.laserCooldown=0;e.useLaser(s);assert.equal(a.buildStopUntil,s.gameTick+c.RETICULUM.stunTicks);
 const plain=fresh(),other=mob(plain,12,10);e.useLaser(plain);assert.equal(other.buildStopUntil,undefined);
});
test('Eridanus echo wave lands two seconds after the original Wave, centred on where the player is then',()=>{
 const s=fresh(['waveEcho']),a=mob(s);e.activateWave(s);const after=a.hp;
 ticks(s,119);near(a.hp,after);ticks(s,1);near(after-a.hp,c.WAVE_DMG*.4);assert.equal(s.build.echoes.length,0);
 const moved=fresh(['waveEcho']),left=mob(moved,30,10);e.activateWave(moved);near(left.hp,1000);
 moved.playerTileX=moved.playerTargetX=29;moved.playerX=29.5*c.TILE_SIZE;ticks(moved,120);near(1000-left.hp,c.WAVE_DMG*.4);
});
