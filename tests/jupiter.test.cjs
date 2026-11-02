const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const jupiterTest={updateEnemies,updatePlayer,updateMeteorite};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),j=require('../game/jupiter.ts');
const near=(mob,x,y)=>{mob.tileX=mob.targetTileX=x;mob.tileY=mob.targetTileY=y;mob.x=(x+.5)*c.TILE_SIZE;mob.y=(y+.5)*c.TILE_SIZE;mob.stepProgress=0;};
const player=(s,x,y)=>{s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function fresh(){const s=e.createModeState('trial','storm_reaper');e.godSpawnBoss(s,'storm_reaper');const boss=j.jupiterBoss(s);near(boss,14,10);s.noMobs=true;s.meteoriteTimer=1e6;return{s,boss};}
function pursue(s,round=1){s.jupiter.round=round;j.godSetJupiterStage(s,'pursuit');}

test('Jupiter is playable and starts with three equal HP phases and stationary charging',()=>{
  assert.equal(require('../game/trials.ts').findTrial('jupiter').ready,true);
  const{s,boss}=fresh();assert.equal(s.specialSkill,'storm_reaper');assert.equal(boss.hp,c.JUPITER.phaseHP*3);
  const before=[boss.x,boss.y];for(let i=0;i<c.JUPITER.chargeTicks;i++){j.updateJupiterReaper(s,boss);j.updateJupiter(s);}
  assert.deepEqual([boss.x,boss.y],before);assert.equal(s.jupiter.stage,'pursuit');assert.equal(s.jupiter.energy,100);
  assert.equal(s.jupiter.safeRoom,c.chamberOfTile(s.playerTileX,s.playerTileY));
});
test('charge and pursuit take 10% damage; damage drains pursuit energy only; exposed takes full damage',()=>{
  const{s,boss}=fresh();let hp=boss.hp;e.damageEnemy(s,boss,100);close(hp-boss.hp,10);assert.equal(s.jupiter.energy,0);
  pursue(s);hp=boss.hp;e.damageEnemy(s,boss,100);close(hp-boss.hp,10);close(s.jupiter.energy,100-10*c.JUPITER.energyPerDamage);
  j.godSetJupiterStage(s,'escape');hp=boss.hp;e.damageEnemy(s,boss,100);close(hp-boss.hp,100);
});
test('two pursuits alternate energy colours/rounds before exposed escape and restart',()=>{
  const{s}=fresh();pursue(s);s.jupiter.energy=0;j.updateJupiter(s);assert.equal(s.jupiter.stage,'charging');assert.equal(s.jupiter.round,2);
  for(let i=0;i<c.JUPITER.chargeTicks;i++)j.updateJupiter(s);assert.equal(s.jupiter.stage,'pursuit');assert.equal(s.jupiter.round,2);
  s.jupiter.energy=0;j.updateJupiter(s);assert.equal(s.jupiter.stage,'escape');assert.equal(s.jupiter.safeRoom,-1);
  s.jupiter.shards=[];j.updateJupiter(s);assert.equal(s.jupiter.stage,'charging');assert.equal(s.jupiter.round,1);
});
test('all three HP phases retain the same loop and only final defeat wins',()=>{
  const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');
  for(const phase of [1,2,3]){j.godSetJupiterPhase(s,phase);j.updateJupiter(s);assert.equal(s.jupiter.phase,phase);assert.equal(s.gamePhase,'playing');}
  assert.equal(boss.hp,c.JUPITER.phaseHP);j.godSetJupiterStage(s,'escape');e.damageEnemy(s,boss,boss.hp);e.killEnemy(s,s.enemies.indexOf(boss));
  assert.equal(s.gamePhase,'won');assert.equal(s.jupiter.safeRoom,-1);assert.equal(s.jupiter.walls.length,0);
});
test('storm locks three rooms, provides grace, hurts placed Ruby, and does not follow teleports',()=>{
  const{s}=fresh();pursue(s);const safe=s.jupiter.safeRoom;
  assert.equal([0,1,2,3].filter(room=>j.jupiterStormRoom(s,room)).length,3);
  const other=(safe+1)%4,[r1,c1]=c.CHAMBER_BOUNDS[other];player(s,c1+3,r1+3);s.rubyTileX=c1+4;s.rubyTileY=r1+3;
  let hp=s.playerHP,ruby=s.rubyHP;for(let i=0;i<c.JUPITER.stormGrace;i++)j.updateJupiter(s);
  close(s.playerHP,hp);close(s.rubyHP,ruby);
  for(let i=0;i<c.JUPITER.stormInterval;i++)j.updateJupiter(s);
  close(s.playerHP,hp-c.JUPITER.stormDamage);close(s.rubyHP,ruby-c.JUPITER.stormRubyDamage);assert.equal(s.jupiter.safeRoom,safe);
});
test('pursuit is finite without hits and boss boost starts immediately with the same cooldown as C',()=>{
  const{s}=fresh();pursue(s);const initial=s.jupiter.energy;j.updateJupiter(s);close(s.jupiter.energy,initial-c.JUPITER.energyDrainPerSecond/60);
  s.jupiter.boostCooldown=1;j.updateJupiter(s);assert.equal(s.jupiter.bossBoost,c.JUPITER.boostTicks);
  assert.equal(c.JUPITER.boostCooldown,c.JUPITER.wallCooldown);
});
test('Jupiter keeps the hallway seal, respects its cooldown, and releases it on expiry or removal',()=>{
  const{s,boss}=fresh();pursue(s);player(s,25,10);near(boss,24,10);j.updateJupiterReaper(s,boss);
  assert.equal(s.hallwaySeal,0);assert.equal(s.hallwaySealTicks,c.REAPER_SEAL_DURATION);
  assert.equal(s.map[10][20],c.T_WALL);assert.equal(s.map[10][30],c.T_WALL);assert.equal(s.map[10][25],c.T_FLOOR);
  player(s,10,10);near(boss,39,39);s.godMode=true;
  for(let i=0;i<c.REAPER_SEAL_DURATION;i++)e.tick(s);
  assert.equal(s.hallwaySeal,-1);assert.equal(s.map[10][20],c.T_FLOOR);assert.equal(s.map[10][30],c.T_FLOOR);
  player(s,25,10);near(boss,24,10);j.updateJupiterReaper(s,boss);assert.equal(s.hallwaySeal,-1);
  s.hallwaySealCooldown=0;j.updateJupiterReaper(s,boss);assert.equal(s.hallwaySeal,0);
  e.godSetNoBossSpawns(s,true);assert.equal(s.hallwaySeal,-1);assert.equal(s.map[10][20],c.T_FLOOR);
});
test('fences persist before their timeout, give a brief dash, and damage/slow only the first crossing enemy',()=>{
  const{s,boss}=fresh();near(boss,39,39);player(s,11,10);s.playerDirX=1;s.playerDirY=0;
  assert.equal(j.useVoltFence(s),true);assert.equal(j.useVoltFence(s),false);assert.ok(j.jupiterPlayerSpeed(s)>1);
  for(let i=0;i<1000;i++)j.updateJupiter(s);assert.equal(s.jupiter.walls.length,1);assert.equal(s.jupiter.playerBoost,0);
  const wall=s.jupiter.walls[0],a=e.createEncounterEnemy(s,'normal',11,10,100),b=e.createEncounterEnemy(s,'normal',11,10,100);
  s.enemies.push(a,b);j.updateJupiter(s);assert.equal(s.jupiter.walls.length,0);close(a.hp,100-c.JUPITER.wallDamage);close(b.hp,100);
  assert.equal(a.voltSlowTicks,c.JUPITER.wallSlowTicks);assert.equal(s.jupiter.bursts.length,1);assert.ok(wall.half>0);
});
test('fast crossing is caught, fences stop at cover, and do not hit beyond their endpoints',()=>{
  const{s,boss}=fresh();near(boss,39,39);player(s,11,10);s.playerDirX=1;s.map[11][11]=c.T_WALL;
  j.useVoltFence(s);const wall=s.jupiter.walls[0];close(wall.positive,c.TILE_SIZE*.5);close(wall.negative,c.TILE_SIZE*1.5);
  const mob=e.createEncounterEnemy(s,'fast',11,10,100);s.enemies.push(mob);mob.x=wall.x+30;mob.voltPreviousX=wall.x-30;mob.voltPreviousY=mob.y;
  j.updateJupiter(s);assert.equal(s.jupiter.walls.length,0);assert.ok(mob.hp<100);
  s.jupiter.wallCooldown=0;j.useVoltFence(s);mob.y=wall.y+wall.half+30;mob.x=wall.x;mob.voltPreviousX=mob.x;mob.voltPreviousY=mob.y;
  j.updateJupiter(s);assert.equal(s.jupiter.walls.length,1);
});
test('fence slow is much stronger during the shard rush and he does not attack',()=>{
  const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');near(boss,12,10);boss.targetTileX=13;boss.voltSlowTicks=100;
  j.updateJupiterReaper(s,boss);close(boss.stepProgress,c.JUPITER.fleeSpeed*c.JUPITER.exposedWallSlow);
  assert.ok(c.JUPITER.exposedWallSlow<c.JUPITER.wallSlow/2);
  near(boss,11,10);boss.pathTimer=0;const hp=s.playerHP;j.updateJupiterReaper(s,boss);close(s.playerHP,hp);assert.ok(boss.path.length>0);
});
test('celestial skill hits for a phase share, protected during pursuit and full during escape',()=>{
  const{s,boss}=fresh();near(boss,12,10);pursue(s);let hp=boss.hp;e.useSpecialSkill(s);close(hp-boss.hp,c.JUPITER.phaseHP*c.JUPITER.celestialShare*c.JUPITER.damageTaken);
  s.specialSkill='storm_reaper';s.specialRecastTicks=0;j.godSetJupiterStage(s,'escape');hp=boss.hp;e.useSpecialSkill(s);close(hp-boss.hp,c.JUPITER.phaseHP*c.JUPITER.celestialShare);
});
test('pause freezes Jupiter actions and timers; no-boss cleanup and restart remove effects',()=>{
  const{s}=fresh();pursue(s);j.useVoltFence(s);s.gamePhase='teleporting';const before=JSON.stringify(s.jupiter);
  j.updateJupiter(s);assert.equal(JSON.stringify(s.jupiter),before);assert.equal(j.useVoltFence(s),false);
  s.gamePhase='playing';e.godSetNoBossSpawns(s,true);assert.equal(s.jupiter.safeRoom,-1);assert.equal(s.jupiter.walls.length,0);
  const reset=e.createModeState('trial','storm_reaper');assert.equal(reset.jupiter.wallCooldown,0);assert.equal(reset.jupiter.round,1);
});
test('Volt Fence guard protects player and Ruby from a meteor for exactly its brief window',()=>{
  const{s,boss}=fresh();near(boss,39,39);s.playerChamber=0;s.rubyTileX=11;s.rubyTileY=10;
  j.useVoltFence(s);assert.equal(s.jupiter.guardTicks,c.JUPITER.fenceGuardTicks);
  e.damagePlayer(s,50);e.damageRuby(s,50);close(s.playerHP,95);close(s.rubyHP,95);
  s.playerHP=s.rubyHP=100;s.meteoriteWarning=0;s.meteoriteStrikeIn=1;
  e.jupiterTest.updateMeteorite(s);
  close(s.playerHP,100-c.METEORITE_PLAYER_DMG*.1);close(s.rubyHP,100-c.METEORITE_RUBY_DMG*.1);
  for(let i=0;i<c.JUPITER.fenceGuardTicks;i++)j.updateJupiter(s);
  assert.equal(s.jupiter.guardTicks,0);s.playerHP=s.rubyHP=100;
  e.damagePlayer(s,50);e.damageRuby(s,50);close(s.playerHP,50);close(s.rubyHP,50);
});
test('Fence guard reduces damage before shields and freezes with menus',()=>{
  const{s}=fresh();s.rubyTileX=11;s.rubyTileY=10;j.useVoltFence(s);s.playerShieldHP=s.rubyShieldHP=10;
  e.damagePlayer(s,50);e.damageRuby(s,50);close(s.playerHP,100);close(s.rubyHP,100);close(s.playerShieldHP,5);close(s.rubyShieldHP,5);
  s.gamePhase='teleporting';for(let i=0;i<100;i++)j.updateJupiter(s);assert.equal(s.jupiter.guardTicks,c.JUPITER.fenceGuardTicks);
});
test('pursuit thunder plays globally once on each entry, including the second round and God control',()=>{
  const original=e.playAudioOneShot,sounds=[];e.playAudioOneShot=(file,volume)=>sounds.push({file,volume});
  try {
    const{s}=fresh();player(s,39,39);s.playerCarryingRuby=true;s.rubyTileX=s.rubyTileY=-1;s.jupiter.stageTicks=1;j.updateJupiter(s);
    assert.equal(sounds.length,1);assert.deepEqual(sounds[0],{file:'/sounds/jupiter-pursuit-thunder.mp3',volume:.85});
    for(let i=0;i<90;i++)j.updateJupiter(s);assert.equal(sounds.length,1);
    s.jupiter.energy=0;j.updateJupiter(s);s.jupiter.stageTicks=1;j.updateJupiter(s);assert.equal(sounds.length,2);
    s.gamePhase='teleporting';for(let i=0;i<90;i++)j.updateJupiter(s);assert.equal(sounds.length,2);
    s.gamePhase='playing';j.godSetJupiterStage(s,'pursuit');assert.equal(sounds.length,3);
  } finally {e.playAudioOneShot=original;}
});
test('storm palette blends smoothly in and out and freezes in menus',()=>{
  const{s}=fresh();pursue(s);assert.equal(s.jupiter.stormBlend,0);
  j.updateJupiter(s);assert.ok(s.jupiter.stormBlend>0&&s.jupiter.stormBlend<.1);
  for(let i=0;i<30;i++)j.updateJupiter(s);close(s.jupiter.stormBlend,1);
  j.godSetJupiterStage(s,'escape');j.updateJupiter(s);assert.ok(s.jupiter.stormBlend>.9&&s.jupiter.stormBlend<1);
  s.gamePhase='teleporting';const before=s.jupiter.stormBlend;j.updateJupiter(s);close(s.jupiter.stormBlend,before);
});
test('fence cast recording and ready cue fire only on successful cast and cooldown completion',()=>{
  const ui=require('../game/ui-sfx.ts'),originalCue=ui.playUiSfx,originalAudio=e.playAudioOneShot,cues=[],files=[];
  ui.playUiSfx=kind=>cues.push(kind);e.playAudioOneShot=(file,volume)=>files.push({file,volume});
  try {
    const{s}=fresh();assert.equal(j.useVoltFence(s),true);assert.equal(j.useVoltFence(s),false);
    assert.deepEqual(files.filter(v=>v.file.includes('fence-cast')),[{file:'/sounds/jupiter-fence-cast.wav',volume:.85}]);
    s.jupiter.wallCooldown=1;s.gamePhase='teleporting';j.updateJupiter(s);assert.equal(cues.filter(k=>k==='fenceReady').length,0);
    s.gamePhase='playing';j.updateJupiter(s);assert.equal(cues.filter(k=>k==='fenceReady').length,1);
    for(let i=0;i<30;i++)j.updateJupiter(s);assert.equal(cues.filter(k=>k==='fenceReady').length,1);
  } finally {ui.playUiSfx=originalCue;e.playAudioOneShot=originalAudio;}
});
test('a damaging fence plays the supplied hit recording once when it breaks',()=>{
  const original=e.playAudioOneShot,files=[];e.playAudioOneShot=(file,volume)=>files.push({file,volume});
  try {
    const{s,boss}=fresh();near(boss,39,39);player(s,11,10);j.useVoltFence(s);
    j.updateJupiter(s);assert.equal(files.filter(v=>v.file.includes('fence-hit')).length,0);
    const mob=e.createEncounterEnemy(s,'normal',11,10,100);s.enemies.push(mob);j.updateJupiter(s);
    close(mob.hp,100-c.JUPITER.wallDamage);assert.equal(s.jupiter.walls.length,0);
    assert.deepEqual(files.filter(v=>v.file.includes('fence-hit')),[{file:'/sounds/jupiter-fence-hit.mp3',volume:.85}]);
    for(let i=0;i<10;i++)j.updateJupiter(s);assert.equal(files.filter(v=>v.file.includes('fence-hit')).length,1);
  } finally {e.playAudioOneShot=original;}
});
test('unused fences expire after 30 seconds, with their lifetime frozen in menus',()=>{
  const{s,boss}=fresh();near(boss,39,39);j.useVoltFence(s);
  s.jupiter.walls[0].age=c.JUPITER.wallTicks-2;j.updateJupiter(s);assert.equal(s.jupiter.walls.length,1);
  s.gamePhase='teleporting';j.updateJupiter(s);assert.equal(s.jupiter.walls.length,1);
  s.gamePhase='playing';j.updateJupiter(s);assert.equal(s.jupiter.walls.length,0);
});
test('C is a committed forward dash without held input, eases off, and respects cover',()=>{
  const{s,boss}=fresh();near(boss,39,39);player(s,10,10);s.playerCarryingRuby=false;s.playerDirX=1;s.playerDirY=0;
  s.playerQueuedDirX=s.playerQueuedDirY=0;s.map[10][11]=s.map[10][12]=c.T_FLOOR;s.map[10][13]=c.T_WALL;
  j.useVoltFence(s);const start=s.playerX,fast=j.jupiterPlayerSpeed(s);
  for(let i=0;i<c.JUPITER.playerBoostTicks;i++){e.jupiterTest.updatePlayer(s);j.updateJupiter(s);}
  assert.ok(s.playerX>start+c.TILE_SIZE);assert.ok(s.playerX<=12.5*c.TILE_SIZE);assert.ok(j.jupiterPlayerSpeed(s)<fast);
  assert.equal(s.jupiter.playerBoost,0);assert.ok(fast>3);
});
test('Reaper dash commits to a direction and cannot cross cover',()=>{
  const{s,boss}=fresh();pursue(s);near(boss,11,10);s.map[10][12]=c.T_WALL;
  s.jupiter.bossBoost=c.JUPITER.boostTicks;s.jupiter.bossDashX=1;s.jupiter.bossDashY=0;
  j.updateJupiterReaper(s,boss);assert.equal(s.jupiter.bossBoost,0);assert.equal(boss.tileX,11);
  assert.ok(j.jupiterDashMultiplier(18,18,4)>j.jupiterDashMultiplier(6,18,4));
});
test('phase controls summon a missing Reaper and begin a fresh loop in the chosen HP phase',()=>{
  const s=e.createModeState('trial','storm_reaper');e.godSetNoBossSpawns(s,true);
  j.godSetJupiterPhase(s,1);const boss=j.jupiterBoss(s);assert.ok(boss);assert.equal(s.noBossSpawns,false);
  assert.equal(boss.hp,c.JUPITER.phaseHP*3);assert.equal(s.jupiter.phase,1);assert.equal(s.jupiter.stage,'charging');
  pursue(s,2);j.godSetJupiterPhase(s,3);assert.equal(s.jupiter.phase,3);assert.equal(s.jupiter.round,1);assert.equal(s.jupiter.energy,0);assert.equal(s.jupiter.stage,'charging');
});
test('pursuit entry flashes/shakes through its real transition state and preserves stronger shake',()=>{
  const{s}=fresh();s.screenShakeTicks=30;s.screenShakeAmt=12;pursue(s);
  assert.equal(s.jupiter.stormAge,0);assert.equal(s.screenShakeTicks,30);assert.equal(s.screenShakeAmt,12);
});
test('room storms hurt aliens, spare the Reaper and safe room, and grant no player kill rewards',()=>{
  const{s,boss}=fresh();near(boss,39,39);pursue(s);s.playerHP=50;s.starEnergy=0;
  const outside=e.createEncounterEnemy(s,'normal',38,39,28),safe=e.createEncounterEnemy(s,'normal',12,10,28);s.enemies.push(outside,safe);
  s.jupiter.stormAge=c.JUPITER.stormGrace;s.jupiter.stormTimer=1;const hp=boss.hp;j.updateJupiter(s);
  close(outside.hp,14);close(safe.hp,28);close(boss.hp,hp);
  s.jupiter.stormTimer=1;j.updateJupiter(s);assert.ok(!s.enemies.includes(outside));close(safe.hp,28);
  close(s.playerHP,50);assert.equal(s.starEnergy,0);assert.equal(s.killScore,0);
});
test('Reaper dash recording plays once as the boost starts immediately',()=>{
  const original=e.playAudioOneShot,files=[];e.playAudioOneShot=(file,volume)=>files.push({file,volume});
  try {
    const{s}=fresh();pursue(s);s.jupiter.boostCooldown=1;j.updateJupiter(s);
    const hits=()=>files.filter(v=>v.file==='/sounds/jupiter-reaper-boost.mp3');
    assert.deepEqual(hits(),[{file:'/sounds/jupiter-reaper-boost.mp3',volume:.85}]);
    for(let i=0;i<c.JUPITER.boostTicks;i++)j.updateJupiter(s);assert.equal(hits().length,1);
  } finally {e.playAudioOneShot=original;}
});
test('fence hits heal only the player once and cap at maximum HP',()=>{
  const{s,boss}=fresh();near(boss,39,39);player(s,11,10);s.playerHP=50;s.rubyHP=50;
  j.useVoltFence(s);s.enemies.push(e.createEncounterEnemy(s,'normal',11,10,100));j.updateJupiter(s);
  close(s.playerHP,50+c.JUPITER.wallHealing);close(s.rubyHP,50);
  j.updateJupiter(s);close(s.playerHP,50+c.JUPITER.wallHealing);
  s.playerHP=99;s.jupiter.wallCooldown=0;j.useVoltFence(s);j.updateJupiter(s);close(s.playerHP,100);
});
test('charged tiles are spread across rooms, burst once, slow the player and feed pursuit energy',()=>{
  const{s}=fresh();assert.equal(s.jupiter.shockTiles.length,c.JUPITER.shockTileCount);
  assert.deepEqual([...new Set(s.jupiter.shockTiles.map(t=>t.room))].sort(),[0,1,2,3]);
  for(const tile of s.jupiter.shockTiles)assert.equal(s.map[tile.y][tile.x],c.T_FLOOR);
  pursue(s);const tile=s.jupiter.shockTiles[0];player(s,tile.x,tile.y);s.jupiter.energy=50;
  j.updateJupiter(s);close(s.jupiter.energy,50+c.JUPITER.shockEnergy-c.JUPITER.energyDrainPerSecond/60);
  assert.equal(s.jupiter.slowTicks,c.JUPITER.shockSlowTicks);assert.equal(tile.cooldown,c.JUPITER.shockTileRespawn);
  close(j.jupiterPlayerSpeed(s),c.JUPITER.playerPursuitSpeed*c.JUPITER.shockSlow);
  const after=s.jupiter.energy;j.updateJupiter(s);close(s.jupiter.energy,after-c.JUPITER.energyDrainPerSecond/60);
  s.gamePhase='teleporting';const slow=s.jupiter.slowTicks,cd=tile.cooldown;j.updateJupiter(s);assert.equal(s.jupiter.slowTicks,slow);assert.equal(tile.cooldown,cd);
});
test('charged tiles respawn elsewhere and cannot increase energy outside pursuit',()=>{
  const{s}=fresh();const tile=s.jupiter.shockTiles[0],before=[tile.x,tile.y];player(s,tile.x,tile.y);
  j.updateJupiter(s);assert.ok(s.jupiter.energy<1,'only charge progress, no tile energy reward');
  tile.cooldown=1;j.updateJupiter(s);assert.equal(tile.cooldown,0);assert.notDeepEqual([tile.x,tile.y],before);assert.equal(c.chamberOfTile(tile.x,tile.y),tile.room);
});
test('finishing charge blasts the warned chamber, respects guards and spares other rooms and the Reaper',()=>{
  const{s,boss}=fresh();near(boss,14,10);j.godSetJupiterStage(s,'charging');assert.equal(s.jupiter.chargeRoom,0);
  s.rubyTileX=12;s.rubyTileY=10;const mob=e.createEncounterEnemy(s,'normal',13,10,100),safe=e.createEncounterEnemy(s,'normal',39,39,100);s.enemies.push(mob,safe);
  s.jupiter.stageTicks=1;const hp=boss.hp;j.updateJupiter(s);
  close(s.playerHP,100-c.JUPITER.chargeBlastDamage);close(s.rubyHP,100-c.JUPITER.chargeBlastDamage);
  close(mob.hp,100-c.JUPITER.chargeBlastDamage);close(safe.hp,100);close(boss.hp,hp);assert.equal(s.jupiter.blast.room,0);assert.equal(s.jupiter.stage,'pursuit');
  j.godSetJupiterStage(s,'charging');s.playerHP=s.rubyHP=100;j.useVoltFence(s);s.jupiter.stageTicks=1;j.updateJupiter(s);
  close(s.playerHP,100-c.JUPITER.chargeBlastDamage*c.JUPITER.fenceGuardDamage);close(s.rubyHP,100-c.JUPITER.chargeBlastDamage*c.JUPITER.fenceGuardDamage);
});
test('leaving the charge room avoids the blast and pursuit outlasts the previous tuning',()=>{
  const{s,boss}=fresh();near(boss,14,10);j.godSetJupiterStage(s,'charging');player(s,39,39);s.rubyTileX=38;s.rubyTileY=39;
  s.jupiter.stageTicks=1;j.updateJupiter(s);close(s.playerHP,100);close(s.rubyHP,100);assert.equal(s.jupiter.safeRoom,3);
  assert.ok(c.JUPITER.pursuitSpeed>c.PLAYER_BASE_SPEED*c.JUPITER.playerPursuitSpeed);
  assert.ok(c.JUPITER.pursuitSpeed<c.PLAYER_BASE_SPEED*c.JUPITER.playerPursuitSpeed*1.1);
  assert.ok(c.JUPITER.energyDrainPerSecond<1.5);assert.ok(c.JUPITER.energyPerDamage<.6);
});
test('a boss fence hit drains extra pursuit energy and heals the increased amount',()=>{
  const{s,boss}=fresh();pursue(s);player(s,11,10);near(boss,11,10);s.playerHP=50;s.jupiter.energy=50;
  j.useVoltFence(s);j.updateJupiter(s);
  close(s.playerHP,50+c.JUPITER.wallHealing);
  close(s.jupiter.energy,50-c.JUPITER.wallDamage*c.JUPITER.damageTaken*c.JUPITER.energyPerDamage-c.JUPITER.wallEnergyDrain-c.JUPITER.energyDrainPerSecond/60);
  assert.equal(s.jupiter.walls.length,0);
});
test('Reaper keeps moving when his speed boost activates',()=>{
  const{s,boss}=fresh();pursue(s);near(boss,11,10);boss.targetTileX=12;s.map[10][12]=c.T_FLOOR;s.jupiter.boostCooldown=1;
  j.updateJupiter(s);assert.equal(s.jupiter.bossBoost,c.JUPITER.boostTicks);
  const before=boss.x;j.updateJupiterReaper(s,boss);assert.ok(boss.x>before);assert.ok(boss.stepProgress>c.JUPITER.pursuitSpeed);
});
test('Jupiter disables regular alien spawning without suppressing the guardian or other modes',()=>{
  const{s,boss}=fresh();s.noMobs=false;s.godMode=true;s.spawnTimer=100000;
  for(let i=0;i<120;i++)e.tick(s);
  assert.ok(s.enemies.includes(boss));assert.equal(s.enemies.filter(m=>m.type!=='storm_reaper').length,0);
  assert.equal(s.spawnTimer,100000);
  const normal=e.createModeState('endless');normal.spawnTimer=100000;e.tick(normal);
  assert.ok(normal.enemies.length>0);
});
test('exposure scatters 32 spaced Storm Shards, eight on clear floor in each chamber',()=>{
 const{s}=fresh();j.godSetJupiterStage(s,'escape');const shards=s.jupiter.shards;
 assert.equal(shards.length,c.JUPITER.shardCount);assert.deepEqual([0,1,2,3].map(room=>shards.filter(t=>c.chamberOfTile(t.x,t.y)===room).length),[8,8,8,8]);
 assert.equal(new Set(shards.map(t=>t.id)).size,32);
 for(const shard of shards){assert.equal(s.map[shard.y][shard.x],c.T_FLOOR);assert.ok(!s.jupiter.shockTiles.some(t=>t.x===shard.x&&t.y===shard.y));}
 j.godSetJupiterStage(s,'charging');assert.equal(s.jupiter.shards.length,0);
});

test('player shard pickup strikes Reaper for 1% phase HP once and creates lightning',()=>{
 const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');near(boss,39,39);
 s.jupiter.shards=[{id:1,x:10,y:10}];s.jupiter.shardPlayerX=s.playerX;s.jupiter.shardPlayerY=s.playerY;s.jupiter.shardBossX=boss.x;s.jupiter.shardBossY=boss.y;
 const hp=boss.hp;j.updateJupiter(s);close(boss.hp,hp-c.JUPITER.phaseHP*.01);assert.equal(s.jupiter.shards.length,0);assert.equal(s.jupiter.shardEffects.at(-1).heal,false);
 for(let i=0;i<10;i++)j.updateJupiter(s);close(boss.hp,hp-c.JUPITER.phaseHP*.01);assert.equal(s.playerHP,100);
});

test('Reaper shards heal 1% but never restore a defeated HP phase',()=>{
 const{s,boss}=fresh();j.godSetJupiterPhase(s,2);j.godSetJupiterStage(s,'escape');near(boss,14,10);boss.hp=3500;
 const pickup=()=>{j.godSetJupiterStage(s,'escape');s.jupiter.shards=[{id:1,x:14,y:10}];s.jupiter.shardBossX=boss.x;s.jupiter.shardBossY=boss.y;j.updateJupiter(s);};
 pickup();close(boss.hp,3518);assert.equal(s.jupiter.shardEffects.at(-1).heal,true);
 boss.hp=3595;pickup();close(boss.hp,3600);assert.equal(s.jupiter.phase,2);assert.equal(s.jupiter.shards.length,0);
});

test('simultaneous shard collection has one winner and damage can win the encounter',()=>{
 const{s,boss}=fresh();j.godSetJupiterPhase(s,3);j.godSetJupiterStage(s,'escape');near(boss,10,10);boss.hp=18;
 s.jupiter.shards=[{id:1,x:10,y:10}];s.jupiter.shardBossX=boss.x;s.jupiter.shardBossY=boss.y;
 j.updateJupiter(s);assert.equal(s.gamePhase,'won');assert.equal(s.enemies.includes(boss),false);assert.equal(s.jupiter.shards.length,0);
});

test('Reaper paths to reachable shards and retargets when the player steals his target',()=>{
 const{s,boss}=fresh();near(boss,10,10);player(s,39,39);j.godSetJupiterStage(s,'escape');
 s.jupiter.shards=[{id:1,x:12,y:10},{id:2,x:10,y:13}];
 for(const [x,y]of [[11,10],[12,10],[10,11],[10,12],[10,13]])s.map[y][x]=c.T_FLOOR;
 j.updateJupiterReaper(s,boss);assert.equal(s.jupiter.shardTarget,1);assert.equal(boss.targetTileX,11);assert.equal(boss.targetTileY,10);
 s.jupiter.shards=s.jupiter.shards.filter(t=>t.id!==1);j.updateJupiterReaper(s,boss);assert.equal(s.jupiter.shardTarget,2);
 s.jupiter.shards=[];for(let i=0;i<20;i++)j.updateJupiterReaper(s,boss);assert.equal(s.jupiter.shardTarget,-1);assert.equal(s.playerHP,100);
});

test('shards freeze in menus and clear only on phase reset or No Boss',()=>{
 const{s}=fresh();j.godSetJupiterStage(s,'escape');s.gamePhase='teleporting';const before=JSON.stringify(s.jupiter);
 for(let i=0;i<60;i++)j.updateJupiter(s);assert.equal(JSON.stringify(s.jupiter),before);
 s.gamePhase='playing';s.jupiter.stageTicks=1;for(let i=0;i<900;i++)j.updateJupiter(s);assert.equal(s.jupiter.stage,'escape');assert.ok(s.jupiter.shards.length>0);
 j.godSetJupiterStage(s,'escape');j.godSetJupiterPhase(s,2);assert.equal(s.jupiter.shards.length,0);
 j.godSetJupiterStage(s,'escape');j.clearJupiterEncounter(s);assert.equal(s.jupiter.shards.length,0);assert.equal(s.jupiter.shardEffects.length,0);
});

test('dash crossings collect shards but teleportation never sweeps intervening rooms',()=>{
 const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');near(boss,39,39);s.jupiter.shards=[{id:1,x:11,y:10}];
 s.jupiter.shardPlayerX=10.5*c.TILE_SIZE;s.jupiter.shardPlayerY=10.5*c.TILE_SIZE;
 s.playerX=12.1*c.TILE_SIZE;s.playerY=10.5*c.TILE_SIZE;
 const hp=boss.hp;j.updateJupiter(s);close(boss.hp,hp-18);assert.equal(s.jupiter.shards.length,0);
 s.jupiter.shards=[{id:2,x:25,y:10}];s.jupiter.shardPlayerX=10.5*c.TILE_SIZE;s.jupiter.shardPlayerY=10.5*c.TILE_SIZE;
 player(s,39,10);j.updateJupiter(s);assert.equal(s.jupiter.shards.length,1);
});

test('exposed Reaper actually gathers shards through the normal tick loop without attacking',()=>{
 const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');boss.hp=5200;s.jupiter.shockTiles=[];
 for(let i=0;i<220;i++)e.tick(s);
 assert.ok(s.jupiter.shards.length<32);assert.ok(boss.hp>5200);assert.equal(s.playerHP,100);
});

test('shard path skips an unreachable nearby shard and uses a reachable goal',()=>{
 const{s,boss}=fresh();near(boss,10,10);j.godSetJupiterStage(s,'escape');
 s.map[10][11]=c.T_FLOOR;s.map[10][12]=c.T_FLOOR;s.map[10][13]=c.T_FLOOR;
 s.map[8][10]=c.T_FLOOR;for(const [x,y]of [[9,8],[11,8],[10,7],[10,9]])s.map[y][x]=c.T_WALL;
 s.jupiter.shards=[{id:1,x:10,y:8},{id:2,x:13,y:10}];
 j.updateJupiterReaper(s,boss);assert.equal(s.jupiter.shardTarget,2);
});

test('distant pursuit gains smooth catch-up speed, then returns to base near the player',()=>{
 const{s,boss}=fresh();pursue(s);s.jupiter.bossBoost=0;boss.voltSlowTicks=0;player(s,10,10);
 near(boss,18,10);close(j.jupiterReaperSpeed(s,boss),c.JUPITER.pursuitSpeed);
 near(boss,24,10);const middle=j.jupiterReaperSpeed(s,boss);assert.ok(middle>c.JUPITER.pursuitSpeed&&middle<c.JUPITER.pursuitSpeed*c.JUPITER.catchupMultiplier);
 near(boss,39,10);close(j.jupiterReaperSpeed(s,boss),c.JUPITER.pursuitSpeed*c.JUPITER.catchupMultiplier);
 boss.voltSlowTicks=60;close(j.jupiterReaperSpeed(s,boss),c.JUPITER.pursuitSpeed*c.JUPITER.catchupMultiplier*c.JUPITER.wallSlow);
 boss.voltSlowTicks=0;s.jupiter.bossBoost=c.JUPITER.boostTicks;close(j.jupiterReaperSpeed(s,boss),c.JUPITER.pursuitSpeed*c.JUPITER.catchupMultiplier*c.JUPITER.boostSpeed);
 s.jupiter.bossBoost=0;s.jupiter.stage='escape';close(j.jupiterReaperSpeed(s,boss),c.JUPITER.fleeSpeed);
});

test('Jupiter Storm slow affects challenge Reaper and preserves the stronger exposed fence slow',()=>{
 const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');const normal=j.jupiterReaperSpeed(s,boss);
 s.specialSkill='storm_reaper';s.specialLockTicks=0;assert.equal(e.useSpecialSkill(s),true);close(j.jupiterReaperSpeed(s,boss),normal*.5);
 boss.voltSlowTicks=30;close(j.jupiterReaperSpeed(s,boss),normal*c.JUPITER.exposedWallSlow);
 boss.voltSlowTicks=0;s.gameTick=boss.stormSlowUntilTick+1;close(j.jupiterReaperSpeed(s,boss),normal);
});

test('full Reaper overdrive reduces Jupiter Storm and Volt Fence slow strength to one-fifth',()=>{
 const{s,boss}=fresh();j.godSetJupiterPhase(s,2);pursue(s);s.jupiter.fragmentOverdrive=true;
 const normal=j.jupiterReaperSpeed(s,boss);
 boss.stormSlowUntilTick=s.gameTick+60;close(j.jupiterReaperSpeed(s,boss),normal*(1-(1-c.SPECIAL_REAPER_SLOW)/5));
 delete boss.stormSlowUntilTick;boss.voltSlowTicks=30;close(j.jupiterReaperSpeed(s,boss),normal*(1-(1-c.JUPITER.wallSlow)/5));
 boss.stormSlowUntilTick=s.gameTick+60;close(j.jupiterReaperSpeed(s,boss),normal*(1-(1-c.SPECIAL_REAPER_SLOW)/5));
});

test('player base speed matches Reaper during Shard Race and returns to normal after it',()=>{
 const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');s.jupiter.playerBoost=0;s.jupiter.slowTicks=0;
 close(c.PLAYER_BASE_SPEED*j.jupiterPlayerSpeed(s),j.jupiterReaperSpeed(s,boss));
 s.jupiter.slowTicks=30;close(c.PLAYER_BASE_SPEED*j.jupiterPlayerSpeed(s),c.JUPITER.fleeSpeed*c.JUPITER.shockSlow);
 s.jupiter.slowTicks=0;j.godSetJupiterStage(s,'charging');close(j.jupiterPlayerSpeed(s),1);
});

test('the final player or Reaper shard pickup ends Shard Race and restarts round one charge',()=>{
 for(const heal of [false,true]){
  const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');boss.hp-=100;
  s.jupiter.shards=[{id:1,x:heal?boss.tileX:s.playerTileX,y:heal?boss.tileY:s.playerTileY}];
  j.updateJupiter(s);assert.equal(s.jupiter.shards.length,0);assert.equal(s.jupiter.stage,'charging');assert.equal(s.jupiter.round,1);assert.equal(s.jupiter.stageTicks,c.JUPITER.chargeTicks);
 }
});

test('second pursuit fills the larger purple bar and charged tiles respect its new cap',()=>{
 const{s,boss}=fresh();pursue(s);assert.equal(s.jupiter.energy,100);assert.equal(j.jupiterMaxEnergy(s.jupiter),100);
 s.jupiter.energy=0;j.updateJupiter(s);assert.equal(s.jupiter.round,2);assert.equal(j.jupiterMaxEnergy(s.jupiter),120,'second-pursuit charging uses its larger cap');
 s.godMode=true;for(let i=0;i<c.JUPITER.chargeTicks;i++)j.updateJupiter(s);
 assert.equal(s.jupiter.stage,'pursuit');assert.equal(s.jupiter.energy,120);assert.equal(j.jupiterMaxEnergy(s.jupiter),120);
 const hp=boss.hp;e.damageEnemy(s,boss,100);close(s.jupiter.energy,120-(hp-boss.hp)*c.JUPITER.energyPerDamage);
 s.jupiter.energy=119;const tile=s.jupiter.shockTiles[0];player(s,tile.x,tile.y);j.updateJupiter(s);
 close(s.jupiter.energy,120-c.JUPITER.energyDrainPerSecond/60);
});

test('Reaper energy capacity increases by 20% per HP phase and retains the second-pursuit bonus',()=>{
 const{s}=fresh();
 for(const [phase,first,second] of [[1,100,120],[2,120,144],[3,140,168]]) {
  j.godSetJupiterPhase(s,phase);
  assert.equal(j.jupiterMaxEnergy(s.jupiter),first);
  s.jupiter.round=2;
  assert.equal(j.jupiterMaxEnergy(s.jupiter),second);
 }
});

test('speed skill and teleport boosts are gentler only during Shard Race',()=>{
 for(const source of ['skill','teleport']) {
  const{s}=fresh();j.godSetJupiterStage(s,'escape');s.starEnergy=0;s.jupiter.playerBoost=0;
  if(source==='skill')e.useSpeedBoost(s);
  else {s.gamePhase='teleporting';s.teleportDestOptions=[1];e.doTeleport(s,1);}
  assert.ok(s.speedActiveTicks>0);
  s.playerTargetX=s.playerTileX+1;s.map[s.playerTileY][s.playerTargetX]=c.T_FLOOR;s.playerStepProgress=0;
  e.jupiterTest.updatePlayer(s);close(s.playerStepProgress,c.JUPITER.fleeSpeed*c.JUPITER.raceSpeedBoost);
 }
 const{s}=fresh();pursue(s);s.speedActiveTicks=100;s.playerTargetX=s.playerTileX+1;s.map[s.playerTileY][s.playerTargetX]=c.T_FLOOR;
 e.jupiterTest.updatePlayer(s);close(s.playerStepProgress,c.PLAYER_BASE_SPEED*c.JUPITER.playerPursuitSpeed*c.SPEED_MULT);
});


test('phase 2 fragments stay in the safe chamber, charge into overdrive without disappearing, and pickup stops it with a true lightning hit',()=>{
 const {s,boss}=fresh();j.godSetJupiterPhase(s,2);pursue(s);const q=s.jupiter;
 assert.equal(q.fragments.length,c.JUPITER.fragmentCount);assert.ok(q.fragments.every(f=>c.chamberOfTile(f.x,f.y)===q.safeRoom&&s.map[f.y][f.x]===c.T_FLOOR));
 const base=j.jupiterReaperSpeed(s,boss);q.overdriveCharge=c.JUPITER.fragmentChargeTicks-1;q.bossBoost=0;q.boostCooldown=1000;
 j.updateJupiter(s);assert.equal(q.fragmentOverdrive,true);close(j.jupiterReaperSpeed(s,boss),base*c.JUPITER.fragmentBoost);
 const f=q.fragments[0],hp=boss.hp;player(s,f.x,f.y);q.bossBoost=10;j.updateJupiter(s);
 close(hp-boss.hp,c.JUPITER.phaseHP*c.JUPITER.shardShare);assert.equal(q.fragmentOverdrive,false);assert.equal(q.bossBoost,0);assert.equal(q.fragments.length,c.JUPITER.fragmentCount);
 assert.equal(q.overdriveCharge,0);
 const replacement=q.fragments.find(t=>t.id===f.id);assert.ok(replacement);assert.equal(c.chamberOfTile(replacement.x,replacement.y),c.chamberOfTile(f.x,f.y));assert.ok(Math.hypot(replacement.x-f.x,replacement.y-f.y)>=3);
 j.godSetJupiterStage(s,'escape');assert.equal(q.fragments.length,0);assert.equal(q.fragmentOverdrive,false);
});
test('phase 1 has no new hazards; phase 3 storms persist into race and chase locally, then clear on charge',()=>{
 const {s,boss}=fresh();pursue(s);j.updateJupiter(s);assert.equal(s.jupiter.fragments.length,0);assert.equal(s.jupiter.miniStorms.length,0);
 j.godSetJupiterPhase(s,3);pursue(s);const q=s.jupiter;assert.equal(q.miniStorms.length,8);
 for(const storm of q.miniStorms)assert.equal(c.chamberOfTile(Math.floor(storm.x/c.TILE_SIZE),Math.floor(storm.y/c.TILE_SIZE)),storm.room);
 j.godSetJupiterStage(s,'escape');const storm=q.miniStorms.find(t=>t.room===0);storm.x=s.playerX+3*c.TILE_SIZE;storm.y=s.playerY;storm.path=[];storm.retarget=0;
 const before=Math.hypot(storm.x-s.playerX,storm.y-s.playerY);j.updateJupiter(s);assert.ok(Math.hypot(storm.x-s.playerX,storm.y-s.playerY)<before);
 const hp=s.playerHP;storm.x=s.playerX;storm.y=s.playerY;storm.path=[];j.updateJupiter(s);close(hp-s.playerHP,c.JUPITER.miniStormDamage);assert.equal(s.playerKnockback.tilesLeft,2);
 j.updateJupiter(s);close(hp-s.playerHP,c.JUPITER.miniStormDamage);
 s.gamePhase='constellation';const snapshot=JSON.stringify(q);j.updateJupiter(s);assert.equal(JSON.stringify(q),snapshot);
 s.gamePhase='playing';j.godSetJupiterStage(s,'charging');assert.equal(q.miniStorms.length,0);
});

test('fence independently clips each side: three open tiles, two beside one wall, one between two walls',()=>{
 for(const vertical of [true,false])for(const blocked of [[],[-1],[1],[-1,1]]){
  const {s}=fresh();player(s,11,10);s.playerDirX=vertical?1:0;s.playerDirY=vertical?0:1;
  for(const side of [-1,1])s.map[10+(vertical?side:0)][11+(vertical?0:side)]=blocked.includes(side)?c.T_WALL:c.T_FLOOR;
  j.useVoltFence(s);const w=s.jupiter.walls[0];close((w.negative+w.positive)/c.TILE_SIZE,3-blocked.length);
  close(w.negative/c.TILE_SIZE,blocked.includes(-1)?.5:1.5);close(w.positive/c.TILE_SIZE,blocked.includes(1)?.5:1.5);
 }
});

test('fast crossing cannot hit beyond the clipped fence end but still hits its longer open side',()=>{
 const {s,boss}=fresh();near(boss,39,39);player(s,11,10);s.playerDirX=1;s.playerDirY=0;s.map[11][11]=c.T_WALL;s.map[9][11]=c.T_FLOOR;j.useVoltFence(s);const w=s.jupiter.walls[0];
 const a=e.createEncounterEnemy(s,'normal',11,11,100);s.enemies.push(a);a.x=w.x+30;a.y=w.y+c.TILE_SIZE;a.voltPreviousX=w.x-30;a.voltPreviousY=a.y;
 j.updateJupiter(s);assert.equal(s.jupiter.walls.length,1);assert.equal(a.hp,100);
 a.x=w.x+30;a.y=w.y-c.TILE_SIZE;a.voltPreviousX=w.x-30;a.voltPreviousY=a.y;j.updateJupiter(s);assert.equal(s.jupiter.walls.length,0);assert.ok(a.hp<100);
});

test('shared pursuit overdrive fills, stays full without expiring fragments, pauses, and resets on pickup',()=>{
 const {s}=fresh();j.godSetJupiterPhase(s,2);pursue(s);const q=s.jupiter;q.overdriveCharge=0;
 const locations=q.fragments.map(f=>[f.id,f.x,f.y]);for(let i=0;i<c.JUPITER.fragmentChargeTicks;i++)j.updateJupiter(s);
 assert.equal(q.overdriveCharge,c.JUPITER.fragmentChargeTicks);assert.equal(q.fragmentOverdrive,true);assert.equal(q.overdriveBurstTicks,30);assert.ok(q.fragments.every(f=>!('charge' in f)));
 for(let i=0;i<120;i++)j.updateJupiter(s);assert.deepEqual(q.fragments.map(f=>[f.id,f.x,f.y]),locations);assert.equal(q.overdriveCharge,c.JUPITER.fragmentChargeTicks);
 s.gamePhase='constellation';const snapshot=JSON.stringify(q);j.updateJupiter(s);assert.equal(JSON.stringify(q),snapshot);s.gamePhase='playing';
 const f=q.fragments[0];player(s,f.x,f.y);j.updateJupiter(s);assert.equal(q.overdriveCharge,0);assert.equal(q.fragmentOverdrive,false);assert.equal(q.fragments.length,2);
});

test('full Overdrive plays the supplied Aegis attack recording once',()=>{
 const original=e.playAudioOneShot,files=[];e.playAudioOneShot=(file,volume)=>files.push({file,volume});
 try{
  const{s}=fresh();j.godSetJupiterPhase(s,2);pursue(s);s.jupiter.overdriveCharge=c.JUPITER.fragmentChargeTicks-1;
  j.updateJupiter(s);
  assert.deepEqual(files.filter(v=>v.file==='/sounds/aegis-attack.mp3'),[{file:'/sounds/aegis-attack.mp3',volume:.8*e.ATTACK_SFX_VOLUME}]);
  j.updateJupiter(s);assert.equal(files.filter(v=>v.file==='/sounds/aegis-attack.mp3').length,1);
 } finally {e.playAudioOneShot=original;}
});
