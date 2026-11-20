const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),ai=require('../game/aliens.ts'),T=c.TILE_SIZE;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.comet.timer=1e9;player(s,10,10);return s;}
function player(s,x,y){Object.assign(s,{playerTileX:x,playerTileY:y,playerTargetX:x,playerTargetY:y,playerX:(x+.5)*T,playerY:(y+.5)*T,playerChamber:c.chamberOfTile(x,y),playerStepProgress:0});}
function jammer(s,x=14,y=10){const m=e.createEncounterEnemy(s,'jammer',x,y,c.ENEMY_CONFIGS.jammer.maxHp);m.attackTimer=0;s.enemies.push(m);return m;}
function kill(s,m,meteor=false,solar=false){m.hp=0;e.killEnemy(s,s.enemies.indexOf(m),meteor,solar);}

test('Jammer unlocks at Stage 20 with one alive, including Ascension, and stays out of challenges',()=>{
 const s=fresh();s.bossesKilled=19;assert.ok(!e.spawnPool(s,['normal']).includes('jammer'));
 s.bossesKilled=20;assert.ok(e.spawnPool(s,['normal']).includes('jammer'));s.mode='ascension';assert.ok(e.spawnPool(s,['normal']).includes('jammer'));
 jammer(s);assert.ok(!e.spawnPool(s,['normal']).includes('jammer'));s.enemies=[];s.trial={boss:'fiery_king'};assert.deepEqual(e.spawnPool(s,['normal']),['normal']);
});
test('five-tile interference blocks starting teleport without spending cooldown or opening a picker',()=>{
 const s=fresh(),m=jammer(s,15,10);assert.equal(e.teleportJammed(s),true);
 assert.equal(e.jammerCoversTile(m,10,10),true);assert.equal(e.tryActivateTeleport(s),false);assert.equal(s.gamePhase,'playing');assert.equal(s.teleportCooldown,0);
 m.x+=.01;assert.equal(e.teleportJammed(s),false);assert.equal(e.tryActivateTeleport(s),true);
});
test('walls do not stop the interference, leaving it restores teleport, and dead Jammers do not block',()=>{
 const s=fresh(),m=jammer(s);s.map[10][12]=c.T_WALL;assert.equal(e.teleportJammed(s),true);
 player(s,...c.TELEPORT_PADS[1]);assert.equal(e.teleportJammed(s),false);assert.equal(e.tryActivateTeleport(s),true);e.cancelTeleport(s);
 player(s,10,10);m.hp=0;assert.equal(e.teleportJammed(s),false);assert.equal(e.tryActivateTeleport(s),true);
});
test('Jammer does not cancel an already opened teleport, including arrival inside interference',()=>{
 const s=fresh();assert.equal(e.tryActivateTeleport(s),true);jammer(s,39,11);e.doTeleport(s,1);
 assert.equal(s.gamePhase,'playing');assert.deepEqual([s.playerTileX,s.playerTileY],c.TELEPORT_PADS[1]);assert.equal(e.teleportJammed(s),true);
});
test('ordinary Jammer kills store a teleport Wave without changing cooldowns; repeated kills do not stack',()=>{
 const s=fresh(),m=jammer(s);s.teleportCooldown=100;s.speedCooldown=200;kill(s,m);
 assert.equal(s.jammerWaveReady,true);assert.equal(s.teleportCooldown,100);assert.equal(s.speedCooldown,200);
 kill(s,jammer(s));assert.equal(s.jammerWaveReady,true);assert.equal(s.waveEffects.length,0);
});
test('meteor and Solar Flare kills do not grant a teleport Wave',()=>{
 for(const [meteor,solar] of [[true,false],[true,true],[false,true]]){const s=fresh(),m=jammer(s);kill(s,m,meteor,solar);assert.equal(s.jammerWaveReady,undefined);}
});
test('arrival consumes one stored Wave, reaches four extra tiles and preserves normal charge, energy and cooldown',()=>{
 const s=fresh();kill(s,jammer(s));
 const [tx,ty]=c.TELEPORT_PADS[1],target=e.createEncounterEnemy(s,'normal',tx+9,ty,1000),outside=e.createEncounterEnemy(s,'normal',tx+11,ty,1000);s.enemies.push(target,outside);
 s.waveCooldown=77;s.chargeCount=2;s.build.quickWave=true;s.starEnergy=100;
 assert.equal(e.tryActivateTeleport(s),true);e.doTeleport(s,1);
 assert.equal(s.jammerWaveReady,false);assert.equal(s.waveEffects.length,1);assert.equal(s.waveEffects[0].maxRadius,(c.WAVE_RADIUS+4)*T);
 assert.equal(target.hp,1000-c.WAVE_DMG*1.75);assert.equal(target.pushTiles,c.WAVE_PUSH_TILES);assert.equal(outside.hp,1000);
 assert.equal(s.waveCooldown,77);assert.equal(s.chargeCount,2);assert.equal(s.build.quickWave,true);assert.equal(s.starEnergy,100);
 s.teleportCooldown=0;assert.equal(e.tryActivateTeleport(s),true);e.doTeleport(s,0);assert.equal(s.waveEffects.length,1,'one use only');
});
test('cancelled and jammed teleport attempts keep the stored Wave',()=>{
 const s=fresh();kill(s,jammer(s));assert.equal(e.tryActivateTeleport(s),true);e.cancelTeleport(s);assert.equal(s.jammerWaveReady,true);
 jammer(s);assert.equal(e.tryActivateTeleport(s),false);assert.equal(s.jammerWaveReady,true);assert.equal(s.waveEffects.length,0);
});
test('Jammer pursues the player rather than Ruby, stays nearby and deals only weak melee damage',()=>{
 const s=fresh(),m=jammer(s,17,10);s.rubyTileX=18;s.rubyTileY=10;
 ai.updateRegularAlien(s,m,false);assert.equal(m.targeting,'player');assert.ok(m.path.some(([x,y])=>x===10&&y===10));
 const t=fresh(),n=jammer(t,11,10);ai.updateRegularAlien(t,n,false);assert.equal(t.playerHP,95);assert.equal(t.rubyHP,100);
});

test('teleport Wave keeps powered and Heavy Impact bonuses while adding its own radius',()=>{
 const s=fresh();kill(s,jammer(s));s.poweredTicks=60;s.heavyImpactUntil=s.gameTick+300;s.constellations=['wave','waveReach'];
 const [tx,ty]=c.TELEPORT_PADS[1],target=e.createEncounterEnemy(s,'normal',tx-12,ty,1000);s.enemies.push(target);
 assert.equal(e.tryActivateTeleport(s),true);e.doTeleport(s,1);
 assert.equal(s.waveEffects[0].maxRadius,(c.WAVE_RADIUS_PWR+1+c.JAMMER.rewardRadius+c.DROPPER.rewardRadius)*T);
 assert.ok(Math.abs(1000-target.hp-c.WAVE_DMG_PWR*1.25*1.3*1.75)<1e-8);assert.equal(target.pushTiles,c.WAVE_PUSH_TILES_PWR+2);
});

test('entering interference plays one Effects cue, rearms outside, ignores overlap and pauses with gameplay',()=>{
 const audio=require('../game/audio-settings.ts'),original=audio.gameAudio,played=[];
 audio.gameAudio=(src,channel)=>({volume:0,playbackRate:1,play(){played.push({src,channel,volume:this.volume,rate:this.playbackRate});return Promise.resolve();}});
 try{
  const s=fresh(),m=jammer(s);m.buildStopUntil=1e7;
  e.tick(s);assert.deepEqual(played,[{src:'/sounds/celestial/empty-charge.wav',channel:'effects',volume:.38,rate:.8}]);
  for(let i=0;i<10;i++)e.tick(s);assert.equal(played.length,1);
  const overlap=jammer(s,14,11);overlap.buildStopUntil=1e7;e.tick(s);assert.equal(played.length,1);
  player(s,30,30);e.tick(s);assert.equal(s.jammerWasActive,false);player(s,10,10);
  s.gamePhase='teleporting';e.tick(s);assert.equal(played.length,1);
  s.gamePhase='playing';e.tick(s);assert.equal(played.length,2);
  s.enemies=[];e.tick(s);assert.equal(s.jammerWasActive,false);
  const next=jammer(s);next.buildStopUntil=1e7;e.tick(s);assert.equal(played.length,3);
 }finally{audio.gameAudio=original;}
});
