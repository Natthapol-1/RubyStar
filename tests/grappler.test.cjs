const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),ai=require('../game/aliens.ts'),T=c.TILE_SIZE;
function player(s,x,y){Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*T,playerY:(y+.5)*T,playerStepProgress:0});}
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.comet.timer=1e9;s.resourceTimer=-1e7;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;player(s,16,10);s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}
function grappler(s){const m=e.createEncounterEnemy(s,'grappler',10,10,14);m.attackTimer=0;s.enemies.push(m);return m;}
function advance(s,m,n){for(let i=0;i<n;i++){s.gameTick++;ai.updateRegularAlien(s,m,s.playerCarryingRuby);}}
function launch(s,m){advance(s,m,1);assert.equal(m.hook.phase,'warning');advance(s,m,c.GRAPPLER.warningTicks);assert.equal(m.hook.phase,'flying');}
function hit(s,m){launch(s,m);for(let i=0;i<40&&!s.playerKnockback;i++)advance(s,m,1);assert.equal(m.hook.phase,'pull');}
test('Grappler and Spook unlock at Stage 22 with caps of two and one, and stay out of challenges',()=>{
 for(const mode of ['endless','ascension'])for(const type of ['grappler','spook']){
  const s=fresh();s.mode=mode;s.bossesKilled=21;assert.ok(!e.spawnPool(s,['normal']).includes(type));s.bossesKilled=22;assert.ok(e.spawnPool(s,['normal']).includes(type));
  const cap=type==='grappler'?2:1;for(let i=0;i<cap;i++){assert.ok(e.spawnPool(s,['normal']).includes(type));s.enemies.push(e.createEncounterEnemy(s,type,10+i,10,14));}assert.ok(!e.spawnPool(s,['normal']).includes(type));s.enemies=[];s.trial={boss:'fiery_king'};assert.deepEqual(e.spawnPool(s,['normal']),['normal']);
 }
});
test('hook warns for 0.7s before launch, stays locked and can be sidestepped',()=>{
 const s=fresh(),m=grappler(s);advance(s,m,1);assert.equal(m.hook.phase,'warning');advance(s,m,c.GRAPPLER.warningTicks-1);assert.equal(m.hook.phase,'warning');assert.equal(s.playerHP,100);
 player(s,16,11);advance(s,m,1);assert.equal(m.hook.dx,1);assert.equal(m.hook.dy,0);advance(s,m,42);assert.equal(s.playerHP,100);assert.equal(s.playerKnockback,null);assert.equal(m.hook.phase,'retract');
});
test('Grappler chases distant players, ignores Ruby and needs clear sight',()=>{
 for(const [x,y] of [[22,10]]){const s=fresh();player(s,x,y);const m=grappler(s);s.rubyTileX=11;s.rubyTileY=10;advance(s,m,1);assert.equal(m.hook,undefined);assert.equal(m.targeting,'player');assert.ok(m.path.length>0);}
 const s=fresh(),m=grappler(s);s.map[10][13]=c.T_WALL;advance(s,m,1);assert.equal(m.hook,undefined);
});
test('cover appearing during a warning stops the travelling hook',()=>{
 const s=fresh(),m=grappler(s);launch(s,m);s.map[10][13]=c.T_WALL;advance(s,m,12);assert.equal(s.playerHP,100);assert.equal(s.playerKnockback,null);assert.equal(m.hook.phase,'retract');
});
test('hook hits once and pulls adjacent without crossing its owner or damaging Ruby',()=>{
 const s=fresh(),m=grappler(s);s.playerQueuedDirX=1;hit(s,m);assert.equal(s.playerHP,94);assert.equal(s.rubyHP,100);assert.equal(s.playerKnockback.tilesLeft,5);
 for(let i=0;i<90&&s.playerKnockback;i++)e.tick(s);assert.equal(s.playerTileX,11);assert.equal(s.playerTileY,10);assert.equal(s.playerKnockback,null);assert.equal(s.playerHP,94);assert.equal(s.playerQueuedDirX,1);
});
test('pull stops at walls and carrying Ruby or Ursa shorten it',()=>{
 for(const [carry,steady,expected] of [[false,false,11],[true,false,14],[false,true,14],[true,true,15]]){
  const s=fresh(),m=grappler(s);s.playerCarryingRuby=carry;s.constellations=steady?['steady']:[];hit(s,m);
  for(let i=0;i<90&&s.playerKnockback;i++)e.tick(s);assert.equal(s.playerTileX,expected);
 }
 const s=fresh(),m=grappler(s);hit(s,m);s.map[10][13]=c.T_WALL;for(let i=0;i<90&&s.playerKnockback;i++)e.tick(s);assert.equal(s.playerTileX,14);
});
test('killing, pushing or stunning Grappler cancels its hook and releases a hooked player',()=>{
 for(const action of ['kill','push','stun']){
  const s=fresh(),m=grappler(s);hit(s,m);
  if(action==='kill'){m.hp=0;e.killEnemy(s,s.enemies.indexOf(m));}
  if(action==='push'){m.pushDirX=1;m.pushDirY=0;m.pushTiles=1;}
  if(action==='stun')m.buildStopUntil=s.gameTick+60;
  e.tick(s);assert.equal(s.playerKnockback,null);assert.equal(s.playerTileX,16);
 }
 const s=fresh(),m=grappler(s);advance(s,m,1);m.pushDirX=1;m.pushTiles=1;e.tick(s);assert.equal(m.hook,undefined);
});
test('hook warning and travel pause with gameplay and use a full recovery after missing',()=>{
 const s=fresh(),m=grappler(s);advance(s,m,1);s.gamePhase='teleporting';const before=JSON.stringify(m.hook);e.tick(s);assert.equal(JSON.stringify(m.hook),before);
 s.gamePhase='playing';player(s,16,11);advance(s,m,c.GRAPPLER.warningTicks+41);assert.equal(m.hook.phase,'retract');assert.equal(m.attackTimer,c.ENEMY_CONFIGS.grappler.attackCooldown);
 advance(s,m,c.GRAPPLER.retractTicks);assert.equal(m.hook,undefined);assert.equal(m.attackTimer,150);
});

test('hooks pull correctly from all four directions and never overshoot the owner',()=>{
 for(const [x,y,stopX,stopY] of [[16,10,11,10],[4,10,9,10],[10,16,10,11],[10,4,10,9]]){
  const s=fresh();player(s,x,y);const m=grappler(s);hit(s,m);
  for(let i=0;i<90&&s.playerKnockback;i++)e.tick(s);
  assert.equal(s.playerTileX,stopX);assert.equal(s.playerTileY,stopY);
 }
});
test('killing Grappler before launch prevents the warned hook, while a completed teleport escapes a pull',()=>{
 const s=fresh(),m=grappler(s);advance(s,m,1);m.hp=0;e.killEnemy(s,s.enemies.indexOf(m));const hp=s.playerHP;
 for(let i=0;i<90;i++)e.tick(s);assert.equal(s.playerHP,hp);assert.equal(s.playerKnockback,null);
 const t=fresh(),n=grappler(t);hit(t,n);t.gamePhase="teleporting";t.teleportDestOptions=[1];e.doTeleport(t,1);assert.equal(t.playerKnockback,null);ai.updateRegularAlien(t,n,false);assert.equal(n.hook.phase,'retract');
});

test('hooks aim at arbitrary angles in every quadrant and pull along safe adjacent tiles',()=>{
 for(const [x,y] of [[16,13],[13,16],[4,7],[7,4],[16,7],[13,4],[4,13],[7,16]]){
  const s=fresh();player(s,x,y);const m=grappler(s);hit(s,m);
  const len=Math.hypot(x-10,y-10);assert.ok(Math.abs(m.hook.dx-(x-10)/len)<1e-9);assert.ok(Math.abs(m.hook.dy-(y-10)/len)<1e-9);
  for(let i=0;i<120&&s.playerKnockback;i++){e.tick(s);assert.ok(Number.isInteger(s.playerTargetX)&&Number.isInteger(s.playerTargetY));assert.ok(e.isFloorTile(s.map,Math.floor(s.playerX/T),Math.floor(s.playerY/T)));}
  assert.equal(Math.abs(s.playerTileX-10)+Math.abs(s.playerTileY-10),1);assert.equal(s.playerKnockback,null);
 }
});
test('an angled warning stays locked after a dodge, and diagonal pulls cannot cut a wall corner',()=>{
 const s=fresh();player(s,16,13);const m=grappler(s);launch(s,m);const aim=[m.hook.dx,m.hook.dy];player(s,16,16);advance(s,m,41);assert.equal(s.playerHP,100);assert.deepEqual([m.hook.dx,m.hook.dy],aim);
 const t=fresh();player(t,16,13);const n=grappler(t);hit(t,n);t.map[13][15]=c.T_WALL;
 for(let i=0;i<120&&t.playerKnockback;i++)e.tick(t);assert.equal(t.playerTileX,16);assert.equal(t.playerTileY,13);
});
test('Grappler pull movement is 20% faster than ordinary knockback',()=>{
 const s=fresh(),m=grappler(s);hit(s,m);s.playerKnockback.started=true;s.playerTargetX=15;s.playerStepProgress=0;
 e.tick(s);assert.ok(Math.abs(s.playerStepProgress-c.PRAYER_KNOCKBACK_SPEED*c.GRAPPLER.pullSpeedMult*c.MOVE_SPEED_MULT)<1e-9);
});
test('Grappler kill grants five seconds of full CC immunity, cleanses control, refreshes and skips environmental kills',()=>{
 const s=fresh(),m=grappler(s);s.playerFrozenTicks=60;s.playerStunned=true;s.playerKnockback={dirX:1,dirY:0,started:false,tilesLeft:3};m.hp=0;e.killEnemy(s,0);
 assert.equal(s.ccImmuneUntil,s.gameTick+300);assert.equal(s.playerFrozenTicks,0);assert.equal(s.playerStunned,false);assert.equal(s.playerKnockback,null);
 s.gameTick+=100;const next=grappler(s);next.hp=0;e.killEnemy(s,s.enemies.indexOf(next));assert.equal(s.ccImmuneUntil,s.gameTick+300);
 s.gamePhase='teleporting';const tick=s.gameTick;e.tick(s);assert.equal(s.gameTick,tick);
 for(const [meteor,solar] of [[true,false],[false,true]]){const t=fresh(),n=grappler(t);n.hp=0;e.killEnemy(t,0,meteor,solar);assert.equal(t.ccImmuneUntil,undefined);}
});
test('CC immunity prevents pulls, pushes, stuns, ice freezes and Jammer interference but not damage',()=>{
 const s=fresh(),m=grappler(s);s.ccImmuneUntil=s.gameTick+300;launch(s,m);advance(s,m,25);assert.equal(s.playerHP,94);assert.equal(s.playerKnockback,null);assert.equal(m.hook.phase,'retract');
 e.stunPlayer(s,60);assert.equal(s.playerFrozenTicks,0);assert.equal(e.shovePlayerFromEnemy(s,m,3),false);
 const j=e.createEncounterEnemy(s,'jammer',17,10,8);s.enemies.push(j);assert.equal(e.teleportJammed(s),false);
 const t=fresh();player(t,10,10);t.ccImmuneUntil=300;t.frostIceTiles=[[11,10]];t.playerQueuedDirX=1;
 for(let i=0;i<12;i++)e.tick(t);assert.ok(t.playerTileX>=11);assert.equal(t.playerFrozenTicks,0);assert.equal(t.playerQueuedDirX,1);
 t.ccImmuneUntil=t.gameTick;e.stunPlayer(t,30);assert.equal(t.playerFrozenTicks,30);
});
test('CC immunity prevents chilled movement and attack slowdown, while normal carry penalties remain',()=>{
 const s=fresh();player(s,10,10);s.ccImmuneUntil=300;
 const w=e.createEncounterEnemy(s,'frost_warden',15,15,1000);w.attackTimer=1e7;s.enemies.push(w);assert.equal(e.isPlayerChilled(s),false);
 s.waveCooldown=10;s.playerQueuedDirX=1;e.tick(s);assert.equal(s.waveCooldown,9);e.tick(s);
 const clean=fresh();player(clean,10,10);clean.playerQueuedDirX=1;e.tick(clean);e.tick(clean);assert.equal(s.playerX,clean.playerX);
 const carry=fresh();player(carry,10,10);carry.ccImmuneUntil=300;carry.playerCarryingRuby=true;carry.playerQueuedDirX=1;e.tick(carry);e.tick(carry);assert.ok(carry.playerX-10.5*T<clean.playerX-10.5*T);
});

test('Grappler uses Lancer charge and launch cues once each, with warning audio aligned to 0.7 seconds',()=>{
 const audio=require('../game/audio-settings.ts'),original=audio.gameAudio,played=[];
 audio.gameAudio=src=>({volume:0,playbackRate:1,play(){played.push({src,rate:this.playbackRate,volume:this.volume});return Promise.resolve();}});
 try{
  const s=fresh(),m=grappler(s);advance(s,m,1);
  assert.equal(played.length,1);assert.equal(played[0].src,'/sounds/charging.wav');assert.equal(played[0].rate,.84);assert.equal(played[0].volume,e.ALIEN_ATTACK_SFX.lancerCharge);
  advance(s,m,c.GRAPPLER.warningTicks-1);assert.equal(played.length,1);
  advance(s,m,1);assert.equal(played.length,2);assert.equal(played[1].src,'/sounds/laserBeam.mp3');
 }finally{audio.gameAudio=original;}
});
test('full CC immunity blocks Blinker displacement and expiry restores control vulnerability',()=>{
 const s=fresh();s.ccImmuneUntil=s.gameTick+1;
 const m=e.createEncounterEnemy(s,'blinker',20,20,3);m.blinkOnDeath=true;m.hp=0;s.enemies.push(m);e.killEnemy(s,s.enemies.indexOf(m));
 assert.deepEqual([s.playerTileX,s.playerTileY],[16,10]);assert.equal(s.blinkerWarp,undefined);
 e.tick(s);assert.equal(e.playerCCImmune(s),false);e.stunPlayer(s,30);assert.equal(s.playerFrozenTicks,30);
});

test('CC immunity clears roots and prevents new Gaia roots without blocking snare damage',()=>{
 const s=e.createModeState('trial','thorn_weaver');s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=1e7;
 e.godSpawnBoss(s,'thorn_weaver');const boss=s.enemies.find(m=>m.type==='thorn_weaver');boss.thorn.cooldown=1e7;
 s.ccImmuneUntil=s.gameTick+300;s.gaia.snaredTicks=90;
 const x=s.playerTileX,y=s.playerTileY;s.gaia.snares=[{tileX:x,tileY:y,ticks:1,ruby:false}];
 e.tick(s);assert.equal(s.gaia.snaredTicks,0);assert.ok(s.playerHP<100);
});

test('two Grapplers cannot overwrite each other’s active pull',()=>{
 const s=fresh(),first=grappler(s);hit(s,first);const pull=s.playerKnockback;
 const second=e.createEncounterEnemy(s,'grappler',10,11,14);second.attackTimer=0;s.enemies.push(second);launch(s,second);advance(s,second,30);
 assert.equal(s.playerKnockback,pull);assert.equal(s.playerKnockback.hookOwnerId,first.id);assert.equal(s.playerHP,88);assert.equal(second.hook.phase,'retract');
});
