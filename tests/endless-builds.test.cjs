const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),b=require('../game/endless-builds.ts');
const near=(a,v)=>assert.ok(Math.abs(a-v)<1e-7,`${a} != ${v}`);
function fresh(upgrades=[],blessings=[]){const s=e.createInitialState();s.constellations=upgrades;s.build.blessings=blessings;s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.godMode=true;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*c.TILE_SIZE;s.rubyTileX=s.rubyTileY=30;return s;}
function mob(s,x=11,y=10,type='normal',hp=1000){const a=e.createEncounterEnemy(s,type,x,y,hp);a.pathTimer=a.windupTicks=a.attackTimer=1e7;s.enemies.push(a);return a;}
const ticks=(s,n)=>{for(let i=0;i<n;i++)e.tick(s);};
test('Endless overlap waits two minutes from stage 20, caps at two encounters and pauses in menus',()=>{
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
 const s=fresh();assert.equal(Object.keys(b.CELESTIAL_BLESSINGS).length,10);
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
test('Sagitta reflects once at a real wall, shares range budget, and reduces return damage',()=>{
 const s=fresh(['ricochet']),a=mob(s);s.map[10][13]=c.T_WALL;e.useLaser(s);near(1000-a.hp,c.LASER_DMG*1.3);assert.equal(s.laserBeams.filter(l=>l.dirX===-1&&l.fromX===12.5*c.TILE_SIZE).length,1);assert.ok(s.laserBeams.length<=8);
});
test('delayed and Ruby waves are weaker, emit once, and never recursively create echoes',()=>{
 const s=fresh(['waveEcho','rubyWave']);s.rubyTileX=20;s.rubyTileY=20;const a=mob(s),rubyTarget=mob(s,21,20);e.activateWave(s);near(1000-a.hp,c.WAVE_DMG);near(1000-rubyTarget.hp,c.WAVE_DMG*.25);assert.equal(s.build.echoes.length,1);
 // Keep target still rather than allowing ordinary wave knockback to move it out of range.
 a.pushTiles=0;ticks(s,24);near(1000-a.hp,c.WAVE_DMG*1.25);assert.equal(s.build.echoes.length,0);ticks(s,30);near(1000-a.hp,c.WAVE_DMG*1.25);
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
 const s=fresh(['bulletMark']),a=mob(s),nearby=mob(s,12,11);for(let i=0;i<3;i++)b.buildBulletHit(s,a,1);e.activateWave(s);near(1000-a.hp,c.WAVE_DMG*1.3);near(1000-nearby.hp,c.WAVE_DMG*1.3);assert.equal(a.buildMarks,0);
 const clean=fresh(['bulletMark']),target=mob(clean);for(let i=0;i<3;i++)b.buildBulletHit(clean,target,1);clean.gameTick=361;e.activateWave(clean);near(1000-target.hp,c.WAVE_DMG);
});
test('Ruby copies all four laser directions only while placed and close, without recursion',()=>{
 const s=fresh(['rubyLaser']);s.rubyTileX=12;s.rubyTileY=10;const a=mob(s,12,12);e.useLaser(s);near(1000-a.hp,c.LASER_DMG*.25);assert.equal(s.laserBeams.length,8);
 s.laserCooldown=0;s.rubyTileX=-1;e.useLaser(s);assert.equal(s.laserBeams.length,12);
});
test('blessing offence stays modest and does not recursively proc itself',()=>{
 const s=fresh([],['storm_reaper','splitter_queen','astral_twins']),a=mob(s),other=mob(s,12,11);e.useLaser(s);near(1000-other.hp,c.LASER_DMG*.3);
 const hp=a.hp;for(let i=0;i<4;i++)b.buildBulletHit(s,a,10);near(hp-a.hp,6.5);
 const before=a.hp;e.activateWave(s);near(before-a.hp,c.WAVE_DMG*1.2);
});
test('defensive blessings give bounded shields, healing, chill and repeated-hit roots',()=>{
 const s=fresh([],['blind_prayer','aegis_sentinel','sea_chanter','frost_warden','thorn_weaver']),a=mob(s);s.playerHP=s.rubyHP=50;
 e.useLaser(s);e.activateWave(s);near(s.playerHP,53);near(s.rubyHP,53);near(b.buildSlowMultiplier(s,a),.65);s.laserCooldown=0;e.useLaser(s);near(s.playerShieldHP,6);near(s.rubyShieldHP,6);
 for(let i=0;i<5;i++)b.buildBulletHit(s,a,1);near(b.buildSlowMultiplier(s,a),.15);
 s.gameTick=899;e.tick(s);near(s.playerShieldHP,14);s.gameTick=1799;e.tick(s);near(s.playerShieldHP,16);
 s.playerShieldHP=80;s.gameTick=2699;e.tick(s);near(s.playerShieldHP,80);
});
test('meteor fire zones and bomb gravity persist briefly and hurt only enemies',()=>{
 const s=fresh([],['fiery_king','devourer']);b.buildMeteorZones(s,0);assert.equal(s.build.zones.length,3);const z=s.build.zones[0],a=mob(s,Math.floor(z.x/c.TILE_SIZE),Math.floor(z.y/c.TILE_SIZE));s.gameTick=29;e.tick(s);assert.ok(a.hp<1000);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);
 s.bomb={tileX:10,tileY:10,powered:false};e.useBomb(s);assert.ok(s.build.zones.some(z=>z.kind==='gravity'));ticks(s,361);assert.equal(s.build.zones.length,0);
});

test('Ascension uses the same late Endless blessing and overlap rules',()=>{const s=fresh();s.mode='ascension';s.bossesKilled=20;b.offerCelestialBlessing(s);e.tick(s);assert.equal(s.gamePhase,'blessing');assert.equal(s.build.blessingChoices.length,10);});
