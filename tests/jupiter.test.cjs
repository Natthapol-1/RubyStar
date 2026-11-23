const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const jupiterTest={updateEnemies,updatePlayer,updateMeteorite};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),j=require('../game/jupiter.ts');
const near=(mob,x,y)=>{mob.tileX=mob.targetTileX=x;mob.tileY=mob.targetTileY=y;mob.x=(x+.5)*c.TILE_SIZE;mob.y=(y+.5)*c.TILE_SIZE;mob.stepProgress=0;};
const player=(s,x,y)=>{s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function fresh(){const s=e.createModeState('trial','storm_reaper');e.godSpawnBoss(s,'storm_reaper');const boss=j.jupiterBoss(s);near(boss,14,10);s.noMobs=true;s.meteoriteTimer=1e6;return{s,boss};}
function pursue(s,round=1){s.jupiter.round=round;j.godSetJupiterStage(s,'pursuit');}

function seededCover(seed,run){const original=Math.random;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};try{return run();}finally{Math.random=original;}}
const wallCount=s=>s.map.flat().filter(t=>t===c.T_WALL).length;
function coverRun(){const {s,boss}=fresh();s.immortal=true;near(boss,39,39);j.godSetJupiterPhase(s,2);pursue(s);return {s,boss};}
function finishShuffle(s){for(let i=0;i<c.JUPITER.coverWarningTicks+c.JUPITER.coverRetractTicks+c.JUPITER.coverRiseTicks;i++)j.updateJupiter(s);}
function assertRoomsConnected(s){
 for(let room=0;room<4;room++){
  const [r1,c1,r2,c2]=c.CHAMBER_BOUNDS[room],[px,py]=c.TELEPORT_PADS[room],seen=new Set([`${px},${py}`]),queue=[[px,py]];
  for(let i=0;i<queue.length;i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const x=queue[i][0]+dx,y=queue[i][1]+dy,key=`${x},${y}`;
   if(x<=c1||x>=c2||y<=r1||y>=r2||s.map[y][x]===c.T_WALL||seen.has(key))continue;
   seen.add(key);queue.push([x,y]);
  }
  for(let y=r1+1;y<r2;y++)for(let x=c1+1;x<c2;x++)if(s.map[y][x]!==c.T_WALL)assert.ok(seen.has(`${x},${y}`),`room ${room} floor ${x},${y} remains connected`);
 }
}

test('phase 2 pursuit reshuffles substantial sections in all rooms, after a collision-free preview',()=>seededCover(17,()=>{
 const{s}=fresh();s.jupiter.coverTimer=1;j.updateJupiter(s);assert.equal(s.jupiter.coverShuffle,undefined);
 j.godSetJupiterPhase(s,2);j.updateJupiter(s);assert.equal(s.jupiter.coverShuffle,undefined);
 pursue(s);const before=JSON.stringify(s.map),walls=wallCount(s);s.jupiter.coverTimer=1;j.updateJupiter(s);
 const change=s.jupiter.coverShuffle;assert.equal(change.phase,'warning');assert.equal(JSON.stringify(s.map),before);
 assert.ok(change.moves.length>=12);assert.ok(change.moves.reduce((sum,m)=>sum+m.from.length,0)>=48);
 assert.ok(change.moves.every(m=>m.from.length>=3&&m.to.length===m.from.length));
 assert.deepEqual([...new Set(change.moves.map(m=>c.chamberOfTile(...m.from[0])))].sort(),[0,1,2,3]);
 for(let i=0;i<c.JUPITER.coverWarningTicks;i++)j.updateJupiter(s);
 assert.equal(change.phase,'retract');assert.equal(JSON.stringify(s.map),before);
 for(let i=0;i<c.JUPITER.coverRetractTicks;i++)j.updateJupiter(s);
 assert.equal(change.phase,'rise');assert.notEqual(JSON.stringify(s.map),before);assert.equal(wallCount(s),walls);assertRoomsConnected(s);
 for(let i=0;i<c.JUPITER.coverRiseTicks;i++)j.updateJupiter(s);
 const duration=c.JUPITER.coverWarningTicks+c.JUPITER.coverRetractTicks+c.JUPITER.coverRiseTicks;
 assert.equal(s.jupiter.coverShuffle,undefined);assert.ok(s.jupiter.coverTimer>=c.JUPITER.coverMinInterval-duration&&s.jupiter.coverTimer<=c.JUPITER.coverMaxInterval-duration);
}));

test('room reshuffles remain connected, varied and constant in cover across many layouts',()=>seededCover(103,()=>{
 const{s}=coverRun(),walls=wallCount(s),layouts=new Set();
 for(let cycle=0;cycle<24;cycle++){
  s.jupiter.energy=120;s.jupiter.coverTimer=1;j.updateJupiter(s);assert.ok(s.jupiter.coverShuffle);finishShuffle(s);
  assert.equal(wallCount(s),walls);assertRoomsConnected(s);layouts.add(JSON.stringify(s.map));
  for(const [x,y]of c.TELEPORT_PADS)assert.equal(s.map[y][x],c.T_TELEPORT);
  for(const f of s.jupiter.fragments)assert.equal(s.map[f.y][f.x],c.T_FLOOR);
  for(const [x,y]of c.TELEPORT_PADS.slice(1))assert.ok(e.bfs(s.map,10,10,x,y).length);
 }
 assert.ok(layouts.size>=20);
}));

test('entering a marked area cancels that obstacle without placing a wall on the player',()=>seededCover(47,()=>{
 const{s}=coverRun();s.jupiter.coverTimer=1;j.updateJupiter(s);
 const move=s.jupiter.coverShuffle.moves.find(m=>m.to.some(([x,y])=>s.map[y][x]===c.T_FLOOR));
 const [x,y]=move.to.find(([x,y])=>s.map[y][x]===c.T_FLOOR);player(s,x,y);finishShuffle(s);
 assert.equal(s.map[y][x],c.T_FLOOR);assert.deepEqual(s.jupiter.coverBlocks.find(b=>b.id===move.id).tiles,move.from);assertRoomsConnected(s);
}));

test('Surge Cells remain reachable and pickups reset Overdrive during reconfiguration',()=>seededCover(87,()=>{
 const{s,boss}=coverRun(),q=s.jupiter;q.coverTimer=1;j.updateJupiter(s);
 const cell=q.fragments[0],hp=boss.hp;player(s,cell.x,cell.y);q.overdriveCharge=c.JUPITER.fragmentChargeTicks;q.fragmentOverdrive=true;q.bossBoost=10;
 j.updateJupiter(s);close(hp-boss.hp,c.jupiterPhaseHP(q.phase)*c.JUPITER.shardShare);assert.equal(q.fragmentOverdrive,false);assert.equal(q.overdriveCharge,0);assert.equal(q.bossBoost,0);
 // A relocated cell landing in a marked area also cancels that section.
 const move=q.coverShuffle.moves.find(m=>m.to.some(([x,y])=>s.map[y][x]===c.T_FLOOR&&Math.hypot(x-s.playerTileX,y-s.playerTileY)>4));
 const [x,y]=move.to.find(([x,y])=>s.map[y][x]===c.T_FLOOR&&Math.hypot(x-s.playerTileX,y-s.playerTileY)>4);
 Object.assign(q.fragments[0],{x,y});finishShuffle(s);
 assert.equal(q.fragments.length,c.JUPITER.fragmentCount);assert.equal(s.map[y][x],c.T_FLOOR);
 assert.deepEqual(q.coverBlocks.find(b=>b.id===move.id).tiles,move.from);
 for(const f of q.fragments){assert.equal(s.map[f.y][f.x],c.T_FLOOR);assert.ok(e.bfs(s.map,10,10,f.x,f.y).length);}
}));

test('reshuffle stages pause, survive JSON run snapshots, and stop outside pursuit',()=>seededCover(91,()=>{
 const{s}=coverRun();s.jupiter.coverTimer=1;j.updateJupiter(s);
 for(const phase of ['warning','retract','rise']){
  while(s.jupiter.coverShuffle.phase!==phase)j.updateJupiter(s);
  s.gamePhase='teleporting';const before=JSON.stringify(s);j.updateJupiter(s);assert.equal(JSON.stringify(s),before);s.gamePhase='playing';
 }
 const saved=JSON.parse(JSON.stringify(s)),walls=wallCount(saved);finishShuffle(saved);assert.equal(wallCount(saved),walls);assertRoomsConnected(saved);
 j.godSetJupiterStage(saved,'escape');const race=JSON.stringify(saved.map);for(let i=0;i<1000;i++)j.updateJupiter(saved);assert.equal(JSON.stringify(saved.map),race);assert.equal(saved.jupiter.coverShuffle,undefined);
 for(const stage of ['warning','retract','rise']){
  const{ s:active }=coverRun();active.jupiter.coverTimer=1;j.updateJupiter(active);while(active.jupiter.coverShuffle.phase!==stage)j.updateJupiter(active);
  const map=JSON.stringify(active.map);j.clearJupiterEncounter(active);assert.equal(active.jupiter.coverShuffle,undefined);assert.equal(JSON.stringify(active.map),map);
 }
}));

test('old sliding-cover snapshots release their departure reservation before reshuffling',()=>{
 const{s}=coverRun();s.map[12][14]=c.T_WALL;s.map[12][15]=c.T_WALL;s.jupiter.movingCover=[{x:15,y:12,dx:1,dy:0,fromX:14,fromY:12,slideTicks:10}];
 j.updateJupiter(s);assert.equal(s.map[12][14],c.T_FLOOR);assert.equal(s.map[12][15],c.T_WALL);assert.equal(s.jupiter.movingCover,undefined);
});

test('Jupiter is playable and starts with three HP phases and stationary charging',()=>{
  assert.equal(require('../game/trials.ts').findTrial('jupiter').ready,true);
  const{s,boss}=fresh();assert.equal(s.specialSkill,'storm_reaper');assert.equal(boss.hp,c.jupiterPhaseCeilHP(1));
  const before=[boss.x,boss.y];for(let i=0;i<c.JUPITER.chargeTicks;i++){j.updateJupiterReaper(s,boss);j.updateJupiter(s);}
  assert.deepEqual([boss.x,boss.y],before);assert.equal(s.jupiter.stage,'pursuit');assert.equal(s.jupiter.energy,100);
  assert.equal(s.jupiter.safeRoom,c.chamberOfTile(s.playerTileX,s.playerTileY));
});
test('charge and pursuit take 20% damage; damage drains pursuit energy only; exposed takes full damage',()=>{
  const{s,boss}=fresh();let hp=boss.hp;e.damageEnemy(s,boss,100);close(hp-boss.hp,20);assert.equal(s.jupiter.energy,0);
  pursue(s);hp=boss.hp;e.damageEnemy(s,boss,100);close(hp-boss.hp,20);close(s.jupiter.energy,100-20*c.JUPITER.energyPerDamage);
  j.godSetJupiterStage(s,'escape');hp=boss.hp;e.damageEnemy(s,boss,100);close(hp-boss.hp,100);
});
test('two pursuits alternate energy colours/rounds before exposed escape and restart',()=>{
  const{s}=fresh();pursue(s);s.jupiter.energy=0;j.updateJupiter(s);assert.equal(s.jupiter.stage,'charging');assert.equal(s.jupiter.round,2);
  for(let i=0;i<c.JUPITER.chargeTicks;i++)j.updateJupiter(s);assert.equal(s.jupiter.stage,'pursuit');assert.equal(s.jupiter.round,2);
  s.jupiter.energy=0;j.updateJupiter(s);assert.equal(s.jupiter.stage,'escape');assert.equal(s.jupiter.safeRoom,-1);
  s.jupiter.shards=[];j.updateJupiter(s);assert.equal(s.jupiter.stage,'charging');assert.equal(s.jupiter.round,1);
});
test('an HP phase boundary immediately restarts charging from any part of the loop',()=>{
 for(const phase of [1,2])for(const stage of ['charging','pursuit','escape']){
  const{s,boss}=fresh();j.godSetJupiterPhase(s,phase);j.godSetJupiterStage(s,stage);
  const q=s.jupiter;q.round=2;q.stageTicks=1;q.bossBoost=24;q.fragmentOverdrive=true;q.overdriveCharge=480;
  q.blast={room:0,ticks:20};boss.shootTicks=14;boss.windupTicks=12;
  boss.hp=c.jupiterPhaseFloorHP(phase)+1;e.damageEnemy(s,boss,100,'player');
  assert.equal(q.phase,phase+1);assert.equal(q.stage,'charging');assert.equal(q.round,1);assert.equal(q.stageTicks,300);
  assert.equal(q.energy,0);assert.equal(q.safeRoom,-1);assert.equal(q.bossBoost,0);assert.equal(q.fragmentOverdrive,false);
  assert.equal(q.overdriveCharge,0);assert.equal(q.fragments.length,0);assert.equal(q.shards.length,0);assert.equal(q.miniStorms.length,0);
  assert.equal(q.blast,null);assert.equal(boss.shootTicks,0);assert.equal(boss.windupTicks,0);assert.equal(boss.targetTileX,boss.tileX);
  assert.equal(s.bossSpawnName,`PHASE ${phase+1}`);
 }
});
test('a phase-ending race pickup discards remaining shards without extra damage or healing',()=>{
 const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');near(boss,39,39);s.playerHP=50;boss.hp=c.jupiterPhaseFloorHP(1)+1;
 const q=s.jupiter;q.shards=[{id:1,x:10,y:10},{id:2,x:10,y:10},{id:3,x:39,y:39}];
 q.shardPlayerX=s.playerX;q.shardPlayerY=s.playerY;q.shardBossX=boss.x;q.shardBossY=boss.y;
 j.updateJupiter(s);assert.equal(q.phase,2);assert.equal(q.stage,'charging');assert.equal(q.round,1);assert.equal(q.stageTicks,300);
 close(boss.hp,c.jupiterPhaseFloorHP(1));close(s.playerHP,50+c.JUPITER.shardHeal);assert.equal(q.shards.length,0);
});
test('a phase-ending Surge Cell cancels pursuit and its wall preview without relocating another cell',()=>seededCover(77,()=>{
 const{s,boss}=coverRun(),q=s.jupiter;q.coverTimer=1;j.updateJupiter(s);assert.ok(q.coverShuffle);
 const f=q.fragments[0];player(s,f.x,f.y);boss.hp=c.jupiterPhaseFloorHP(2)+1;
 j.updateJupiter(s);assert.equal(q.phase,3);assert.equal(q.stage,'charging');assert.equal(q.stageTicks,300);
 assert.equal(q.fragments.length,0);assert.equal(q.coverShuffle,undefined);assert.equal(q.miniStorms.length,0);
}));
test('phase transitions release an active hallway seal',()=>{
 const{s,boss}=fresh();player(s,24,10);near(boss,26,10);pursue(s);e.tryReaperHallwaySeal(s,boss);assert.notEqual(s.hallwaySeal,-1);
 boss.hp=c.jupiterPhaseFloorHP(1)+1;e.damageEnemy(s,boss,100,'player');assert.equal(s.hallwaySeal,-1);assert.equal(s.hallwaySealTicks,0);
 assert.equal(s.map[10][20],c.T_FLOOR);assert.equal(s.map[10][30],c.T_FLOOR);
});
test('old equal-band saved runs preserve their current phase HP percentage',()=>{
 for(const phase of [1,2,3]){
  const{s,boss}=fresh();s.jupiter.phase=phase;boss.maxHp=5100;boss.hp=(3-phase)*1700+850;
  j.normalizeJupiterHealth(s,boss);assert.equal(boss.maxHp,5780);close(boss.hp,c.jupiterPhaseFloorHP(phase)+c.jupiterPhaseHP(phase)*.5);
  assert.equal(s.jupiter.phase,phase);
 }
});
test('later phases use their larger HP band for skill damage, shard healing and meteors',()=>{
 for(const phase of [2,3]){
  const{s,boss}=fresh();s.godMode=true;j.godSetJupiterPhase(s,phase);pursue(s);near(boss,12,10);
  const hp=boss.hp;e.useSpecialSkill(s);close(hp-boss.hp,2040*.2*c.JUPITER.damageTaken);
  j.godSetJupiterPhase(s,phase);j.godSetJupiterStage(s,'escape');near(boss,14,10);boss.hp-=100;
  const injured=boss.hp;s.jupiter.shards=[{id:1,x:14,y:10}];s.jupiter.shardBossX=boss.x;s.jupiter.shardBossY=boss.y;
  j.updateJupiter(s);close(boss.hp-injured,30.6);
  j.godSetJupiterPhase(s,phase);const full=boss.hp;s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.tick(s);close(full-boss.hp,204);
 }
});
test('all three HP phases retain the same loop and only final defeat wins',()=>{
  const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');
  for(const phase of [1,2,3]){j.godSetJupiterPhase(s,phase);j.updateJupiter(s);assert.equal(s.jupiter.phase,phase);assert.equal(s.gamePhase,'playing');}
  assert.equal(boss.hp,c.jupiterPhaseHP(3));j.godSetJupiterStage(s,'escape');e.damageEnemy(s,boss,boss.hp);e.killEnemy(s,s.enemies.indexOf(boss));
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
  j.updateJupiterReaper(s,boss);close(boss.stepProgress,c.JUPITER.fleeSpeed*c.JUPITER.exposedWallSlow*c.MOVE_SPEED_MULT);
  assert.ok(c.JUPITER.exposedWallSlow<c.JUPITER.wallSlow/2);
  near(boss,11,10);boss.pathTimer=0;boss.path=[];s.jupiter.shardTarget=-1;
  for(let x=12;x<=15;x++)s.map[10][x]=c.T_FLOOR;
  s.jupiter.shards=[{id:999,x:15,y:10}]; // fixed reachable goal, away from the player
  const hp=s.playerHP;j.updateJupiterReaper(s,boss);close(s.playerHP,hp);assert.ok(boss.path.length>0);
});
test('celestial skill hits for a phase share, protected during pursuit and full during escape',()=>{
  const{s,boss}=fresh();near(boss,12,10);pursue(s);let hp=boss.hp;e.useSpecialSkill(s);close(hp-boss.hp,c.JUPITER.phaseHP*c.JUPITER.celestialShare*c.JUPITER.damageTaken);
  s.specialSkill='storm_reaper';s.specialRecastTicks=0;j.godSetJupiterStage(s,'escape');hp=boss.hp;e.useSpecialSkill(s);close(hp-boss.hp,c.JUPITER.phaseHP*c.JUPITER.celestialShare);
});
test('Jupiter Storm recharges after nine seconds of active challenge play',()=>{
  const{s}=fresh();s.godMode=true;e.useSpecialSkill(s);e.tick(s);
  assert.equal(s.trial.cooldown,540);assert.equal(s.specialSkill,null);
  s.gamePhase='teleporting';e.tick(s);assert.equal(s.trial.cooldown,540);s.gamePhase='playing';
  for(let i=0;i<539;i++)e.tick(s);assert.equal(s.specialSkill,null);
  e.tick(s);assert.equal(s.specialSkill,'storm_reaper');
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
  assert.equal(boss.hp,c.jupiterPhaseCeilHP(1));assert.equal(s.jupiter.phase,1);assert.equal(s.jupiter.stage,'charging');
  pursue(s,2);j.godSetJupiterPhase(s,3);assert.equal(s.jupiter.phase,3);assert.equal(s.jupiter.round,1);assert.equal(s.jupiter.energy,0);assert.equal(s.jupiter.stage,'charging');
});
test('pursuit entry flashes/shakes through its real transition state and preserves stronger shake',()=>{
  const{s}=fresh();pursue(s);
  assert.equal(s.jupiter.stormAge,0);assert.equal(s.screenShakeTicks,36);assert.equal(s.screenShakeAmt,17);
  s.screenShakeTicks=42;s.screenShakeAmt=22;pursue(s);
  assert.equal(s.screenShakeTicks,42);assert.equal(s.screenShakeAmt,22);
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

test('Reaper shards heal 1.5% but never restore a defeated HP phase',()=>{
 const{s,boss}=fresh();j.godSetJupiterPhase(s,2);j.godSetJupiterStage(s,'escape');near(boss,14,10);boss.hp=c.jupiterPhaseCeilHP(2)-100;
 const pickup=()=>{j.godSetJupiterStage(s,'escape');s.jupiter.shards=[{id:1,x:14,y:10}];s.jupiter.shardBossX=boss.x;s.jupiter.shardBossY=boss.y;j.updateJupiter(s);};
 pickup();close(boss.hp,c.jupiterPhaseCeilHP(2)-100+c.jupiterPhaseHP(2)*.015);assert.equal(s.jupiter.shardEffects.at(-1).heal,true);
 boss.hp=c.jupiterPhaseCeilHP(2)-5;pickup();close(boss.hp,c.jupiterPhaseCeilHP(2));assert.equal(s.jupiter.phase,2);assert.equal(s.jupiter.shards.length,0);
});

test('simultaneous shard collection has one winner and damage can win the encounter',()=>{
 const{s,boss}=fresh();j.godSetJupiterPhase(s,3);j.godSetJupiterStage(s,'escape');near(boss,10,10);boss.hp=c.jupiterPhaseHP(3)*c.JUPITER.shardShare;
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
 const hp=boss.hp;j.updateJupiter(s);close(boss.hp,hp-c.JUPITER.phaseHP*c.JUPITER.shardShare);assert.equal(s.jupiter.shards.length,0);
 s.jupiter.shards=[{id:2,x:25,y:10}];s.jupiter.shardPlayerX=10.5*c.TILE_SIZE;s.jupiter.shardPlayerY=10.5*c.TILE_SIZE;
 player(s,39,10);j.updateJupiter(s);assert.equal(s.jupiter.shards.length,1);
});

test('exposed Reaper actually gathers shards through the normal tick loop without attacking',()=>{
 const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');boss.hp=boss.maxHp-200;const hp=boss.hp;s.jupiter.shockTiles=[];
 for(let i=0;i<220;i++)e.tick(s);
 assert.ok(s.jupiter.shards.length<32);assert.ok(boss.hp>hp);assert.equal(s.playerHP,100);
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

test('player has a small speed advantage during Shard Race and returns to normal after it',()=>{
 const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');s.jupiter.playerBoost=0;s.jupiter.slowTicks=0;
 close(c.PLAYER_BASE_SPEED*j.jupiterPlayerSpeed(s),c.JUPITER.playerRaceSpeed);close(j.jupiterReaperSpeed(s,boss),8);
 s.jupiter.slowTicks=30;close(c.PLAYER_BASE_SPEED*j.jupiterPlayerSpeed(s),c.JUPITER.playerRaceSpeed*c.JUPITER.shockSlow);
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

test('later HP phases gain 10% more energy while phase one and the second-pursuit bonus remain intact',()=>{
 const{s}=fresh();
 for(const [phase,first,second] of [[1,100,120],[2,139,166],[3,162,194]]) {
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
  e.jupiterTest.updatePlayer(s);close(s.playerStepProgress,c.JUPITER.playerRaceSpeed*c.JUPITER.raceSpeedBoost*c.MOVE_SPEED_MULT);
 }
 const{s}=fresh();pursue(s);s.speedActiveTicks=100;s.playerTargetX=s.playerTileX+1;s.map[s.playerTileY][s.playerTargetX]=c.T_FLOOR;
 e.jupiterTest.updatePlayer(s);close(s.playerStepProgress,c.PLAYER_BASE_SPEED*c.JUPITER.playerPursuitSpeed*c.SPEED_MULT*c.MOVE_SPEED_MULT);
});


test('phase 2 fragments stay in the safe chamber, charge into overdrive without disappearing, and pickup stops it with a true lightning hit',()=>{
 const {s,boss}=fresh();j.godSetJupiterPhase(s,2);pursue(s);const q=s.jupiter;
 assert.equal(q.fragments.length,c.JUPITER.fragmentCount);assert.ok(q.fragments.every(f=>c.chamberOfTile(f.x,f.y)===q.safeRoom&&s.map[f.y][f.x]===c.T_FLOOR));
 const base=j.jupiterReaperSpeed(s,boss);q.overdriveCharge=c.JUPITER.fragmentChargeTicks-1;q.bossBoost=0;q.boostCooldown=1000;
 j.updateJupiter(s);assert.equal(q.fragmentOverdrive,true);close(j.jupiterReaperSpeed(s,boss),base*c.JUPITER.fragmentBoost);
 const f=q.fragments[0],hp=boss.hp;player(s,f.x,f.y);q.bossBoost=10;j.updateJupiter(s);
 close(hp-boss.hp,c.jupiterPhaseHP(q.phase)*c.JUPITER.shardShare);assert.equal(q.fragmentOverdrive,false);assert.equal(q.bossBoost,0);assert.equal(q.fragments.length,c.JUPITER.fragmentCount);
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

test('only phase 3 movement leaves floor trails during pursuit and Shard Race',()=>{
 for(const phase of [2,3])for(const stage of ['pursuit','escape']){
  const{s,boss}=fresh();j.godSetJupiterPhase(s,phase);player(s,39,10);near(boss,11,10);j.godSetJupiterStage(s,stage);
  for(let x=11;x<=19;x++)s.map[10][x]=c.T_FLOOR;
  s.jupiter.shards=[{id:1,x:19,y:10}];s.jupiter.shardTarget=-1;s.jupiter.bossBoost=0;
  for(let i=0;i<50;i++)j.updateJupiterReaper(s,boss);
  const trail=s.jupiter.reaperTrail??[];
  if(phase===2)assert.equal(trail.length,0);
  else {assert.ok(trail.length>=2);assert.equal(new Set(trail.map(t=>`${t.x},${t.y}`)).size,trail.length);assert.ok(trail.every(t=>s.map[t.y][t.x]===c.T_FLOOR&&t.ticks===c.JUPITER.trailTicks));}
 }
});
test('Reaper trail slows on contact, uses the stronger slow, and does no damage or energy refill',()=>{
 const{s}=fresh();s.godMode=true;j.godSetJupiterPhase(s,3);pursue(s);s.jupiter.shockTiles=[];s.jupiter.miniStormHitCooldown=1e9;
 player(s,11,10);s.jupiter.reaperTrail=[{x:11,y:10,ticks:60}];
 const hp=s.playerHP,ruby=s.rubyHP,energy=s.jupiter.energy;j.updateJupiter(s);
 assert.equal(s.jupiter.trailSlowTicks,c.JUPITER.trailSlowTicks);close(j.jupiterPlayerSpeed(s),c.JUPITER.playerPursuitSpeed*.7);
 close(s.playerHP,hp);close(s.rubyHP,ruby);close(s.jupiter.energy,energy-c.JUPITER.energyDrainPerSecond/60);
 s.jupiter.slowTicks=100;close(j.jupiterPlayerSpeed(s),c.JUPITER.playerPursuitSpeed*c.JUPITER.shockSlow);
 s.jupiter.slowTicks=0;player(s,12,10);for(let i=0;i<c.JUPITER.trailSlowTicks;i++)j.updateJupiter(s);assert.equal(s.jupiter.trailSlowTicks,0);
 player(s,11,10);s.ccImmuneUntil=s.gameTick+300;j.updateJupiter(s);assert.equal(s.jupiter.trailSlowTicks,0);
});
test('Reaper trails expire, pause, survive snapshots and clear on charging or cleanup',()=>{
 const{s}=fresh();s.godMode=true;j.godSetJupiterPhase(s,3);pursue(s);s.jupiter.shockTiles=[];s.jupiter.miniStormHitCooldown=1e9;
 s.map[10][11]=c.T_FLOOR;s.jupiter.reaperTrail=[{x:11,y:10,ticks:c.JUPITER.trailTicks}];s.gamePhase='teleporting';
 const before=JSON.stringify(s.jupiter.reaperTrail);j.updateJupiter(s);assert.equal(JSON.stringify(s.jupiter.reaperTrail),before);
 s.gamePhase='playing';const saved=JSON.parse(JSON.stringify(s));
 for(let i=0;i<c.JUPITER.trailTicks;i++)j.updateJupiter(saved);assert.equal(saved.jupiter.reaperTrail.length,0);
 j.godSetJupiterStage(s,'escape');assert.equal(s.jupiter.reaperTrail.length,1);
 j.godSetJupiterStage(s,'charging');assert.equal(s.jupiter.reaperTrail.length,0);assert.equal(s.jupiter.trailSlowTicks,0);
 s.jupiter.reaperTrail=[{x:11,y:10,ticks:60}];s.jupiter.trailSlowTicks=10;j.clearJupiterEncounter(s);
 assert.equal(s.jupiter.reaperTrail.length,0);assert.equal(s.jupiter.trailSlowTicks,0);
});
test('Reaper trail never exceeds 65 tiles and replaces the oldest residue first',()=>{
 const{s,boss}=fresh();j.godSetJupiterPhase(s,3);pursue(s);player(s,39,10);near(boss,11,10);boss.targetTileX=12;s.map[10][11]=s.map[10][12]=c.T_FLOOR;
 const trail=[];for(let y=2;y<49&&trail.length<65;y++)for(let x=2;x<49&&trail.length<65;x++)if(s.map[y][x]===c.T_FLOOR&&y!==10)trail.push({x,y,ticks:120+trail.length});
 const oldest={...trail[0]};s.jupiter.reaperTrail=trail;assert.equal(c.JUPITER.trailMaxTiles,65);
 j.updateJupiterReaper(s,boss);assert.equal(s.jupiter.reaperTrail.length,65);
 assert.ok(!s.jupiter.reaperTrail.some(t=>t.x===oldest.x&&t.y===oldest.y));
 assert.ok(s.jupiter.reaperTrail.some(t=>t.x===11&&t.y===10));
});
test('Reaper trails skip pads and cover and stationary bodies do not renew them',()=>{
 const{s,boss}=fresh();j.godSetJupiterPhase(s,3);pursue(s);player(s,39,10);near(boss,9,10);
 for(let x=8;x<=14;x++)if(x!==10)s.map[10][x]=c.T_FLOOR;
 s.map[10][10]=c.T_TELEPORT;s.jupiter.bossBoost=0;
 for(let i=0;i<40;i++)j.updateJupiterReaper(s,boss);
 assert.ok((s.jupiter.reaperTrail??[]).length);assert.ok(s.jupiter.reaperTrail.every(t=>s.map[t.y][t.x]===c.T_FLOOR));
 near(boss,14,10);boss.path=[];boss.pathTimer=100;const before=JSON.stringify(s.jupiter.reaperTrail);j.updateJupiterReaper(s,boss);
 assert.equal(JSON.stringify(s.jupiter.reaperTrail),before);
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

test('full Overdrive plays the supplied Aegis attack recording once, at the boosted level',()=>{
 const original=e.playAudioOneShot,files=[];e.playAudioOneShot=(file,volume)=>files.push({file,volume});
 try{
  const{s}=fresh();j.godSetJupiterPhase(s,2);pursue(s);s.jupiter.overdriveCharge=c.JUPITER.fragmentChargeTicks-1;
  j.updateJupiter(s);
  assert.deepEqual(files.filter(v=>v.file==='/sounds/aegis-attack.mp3'),[{file:'/sounds/aegis-attack.mp3',volume:1.6*e.ATTACK_SFX_VOLUME}]);
  j.updateJupiter(s);assert.equal(files.filter(v=>v.file==='/sounds/aegis-attack.mp3').length,1);
 } finally {e.playAudioOneShot=original;}
});
test('collecting a Storm Shard heals the player a little',()=>{
  const{s,boss}=fresh();j.godSetJupiterStage(s,'escape');near(boss,40,40);s.playerHP=50;
  const shard=s.jupiter.shards[0];player(s,shard.x,shard.y);s.jupiter.shardPlayerX=s.playerX;s.jupiter.shardPlayerY=s.playerY;
  j.updateJupiter(s);assert.equal(s.playerHP,50+c.JUPITER.shardHeal);
});

test('a meteor always hits the Reaper for 10% of a phase, ignoring his charge and pursuit protection',()=>{
  for(const stage of ['charging','pursuit']){
    const{s,boss}=fresh();s.godMode=true;if(stage==='pursuit')pursue(s);
    const hp=boss.hp,energy=s.jupiter.energy;s.meteoriteWarning=c.chamberOfTile(boss.tileX,boss.tileY);s.meteoriteStrikeIn=1;e.tick(s);
    if(stage==='pursuit')assert.ok(energy-s.jupiter.energy<c.JUPITER.phaseHP*c.JUPITER.meteorShare*c.JUPITER.damageTaken*c.JUPITER.energyPerDamage+.5,'energy drain stays small: '+(energy-s.jupiter.energy));
    assert.ok(Math.abs(hp-boss.hp-c.JUPITER.phaseHP*c.JUPITER.meteorShare)<1e-6,stage+': '+(hp-boss.hp));
  }
});

test('fence drawing keeps each clipped end on its valid side, including horizontal fences',()=>{
 const {createCanvas}=require('@napi-rs/canvas'),art=require('../game/jupiter-art.ts');
 for(const vertical of [true,false])for(const [negative,positive]of [[72,24],[24,72],[24,24]]){
  const canvas=createCanvas(220,220),ctx=canvas.getContext('2d');
  art.drawVoltFence(ctx,100,100,vertical,Math.max(negative,positive),0,1,negative,positive);
  const alpha=(along)=>ctx.getImageData(vertical?100:100+along,vertical?100+along:100,1,1).data[3];
  assert.ok(alpha(-negative)>0,'negative emitter is on the unblocked side');
  assert.ok(alpha(positive)>0,'positive emitter is on the unblocked side');
  assert.equal(alpha(-negative-16),0,'no fence past the negative endpoint');
  assert.equal(alpha(positive+16),0,'no fence past the positive endpoint');
 }
});
