const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),v=require('../game/venus.ts');
const V=v.VENUS;
function fresh(){const s=e.createModeState('trial','aegis_sentinel');e.godSpawnBoss(s,'aegis_sentinel');s.noMobs=true;s.meteoriteTimer=1e6;s.playerHP=1e4;s.rubyHP=1e4;s.immortal=true;return s;}
const boss=s=>v.venusBoss(s);
const run=(s,n=1)=>{for(let i=0;i<n;i++){s.gameTick++;v.updateVenus(s);}};
// Holds his attacks so totem tests are not disturbed.
const calm=s=>{s.venus.leapTimer=1e9;s.venus.lanceTimer=1e9;};
function player(s,x,y){Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*48,playerY:(y+.5)*48,playerStepProgress:0,playerKnockback:null});}
const inPlay=(s,p)=>s.enemies.includes(p.enemy);
// Damage, then the end-of-tick casualty sweep for anything it killed.
function hit(s,x,n){e.damageEnemy(s,x,n);if(x.hp<=0&&s.enemies.includes(x))e.killEnemy(s,s.enemies.indexOf(x));}
const floorTile=(s,room)=>e.freeChamberTiles(s,room).filter(([x,y])=>Math.hypot(x-c.TELEPORT_PADS[room][0],y-c.TELEPORT_PADS[room][1])>2)[0];
function spawnAll(s){calm(s);run(s,V.spawnGap*s.venus.total+40);}

test('three phases of one HP pool; phase 1 has a four-totem sequence and starts shielded',()=>{
 const s=fresh();assert.equal(s.trial.mapOnly,undefined);
 assert.equal(boss(s).maxHp,V.phaseHP*2+V.finalPhaseHP);assert.equal(s.venus.total,V.totems[0]);assert.equal(boss(s).aegis.shielded,true);
});

test('totems appear one at a time, show themselves, then the sand buries them',()=>{
 const s=fresh();calm(s);run(s,30);
 assert.equal(s.venus.totems.length,1);const first=s.venus.totems[0];assert.ok(inPlay(s,first),'visible when it appears');assert.equal(first.order,0);
 assert.equal(first.life,V.lifeTicks[0]+59,'first overload gets 60 extra ticks, including the spawn tick');
 run(s,V.spawnGap);assert.equal(s.venus.totems.length,2);
 assert.equal(s.venus.totems[1].life-first.life,V.spawnGap,'first overloads keep the original spacing');
 run(s,V.revealTicks);assert.ok(!inPlay(s,first),'buried: off the map and untargetable');
});

test('Sand Swirl exposes buried totems nearby for a while, then it needs to recharge',()=>{
 const s=fresh();spawnAll(s);const p=s.venus.totems[0];assert.ok(!inPlay(s,p));
 player(s,p.enemy.tileX+2,p.enemy.tileY+2);
 const castCenter = [s.playerX,s.playerY];
 s.playerX += c.TILE_SIZE*.45; // cast before reaching the next tile
 assert.equal(v.useSandSweep(s),true);assert.ok(inPlay(s,p),'exposed from the snapped center');
 player(s,p.enemy.tileX+3,p.enemy.tileY+2);
 assert.deepEqual([s.venus.sweeps[0].x,s.venus.sweeps[0].y],castCenter,'walking leaves the footprint in place');
 assert.equal(v.useSandSweep(s),false,'cooling down');
 run(s,V.sweepExpose);assert.ok(!inPlay(s,p),'buried again');
});

test('breaking the wrong totem blows its whole chamber at once and moves it, keeping its place; hits alone do not',()=>{
 const s=fresh();spawnAll(s);const wrong=s.venus.totems[2];s.immortal=false;s.playerHP=500;
 const at=[wrong.enemy.tileX,wrong.enemy.tileY],room=c.chamberOfTile(at[0],at[1]);
 const spot=e.freeChamberTiles(s,room).find(([x,y])=>Math.hypot(x-at[0],y-at[1])>5);player(s,spot[0],spot[1]);
 if(!inPlay(s,wrong))s.enemies.push(wrong.enemy);
 e.damageEnemy(s,wrong.enemy,5);
 assert.equal(s.venus.next,0);assert.equal(wrong.enemy.hp,V.totemHP-5,'a hit just damages it');assert.equal(wrong.overload,0,'no overload from a hit');assert.equal(s.playerHP,500);
 hit(s,wrong.enemy,999);
 assert.equal(s.playerHP,500-V.blastDamage,'the whole chamber is hit, even far from it');
 assert.notDeepEqual([wrong.enemy.tileX,wrong.enemy.tileY],at,'moved');assert.ok(inPlay(s,wrong),'shows its new spot');assert.equal(wrong.order,2);
});

test('wrong-order explosions keep the remaining overload timer in every phase, even after repeated mistakes',()=>{
 for(const phase of [1,2,3]){
  const s=fresh();if(phase>1)v.godSetVenusPhase(s,phase);spawnAll(s);
  const p=s.venus.totems[2],life=p.life;
  for(let mistake=0;mistake<2;mistake++){
   if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);
   assert.equal(p.life,life-mistake*7,'phase '+phase+': the mistake must not reset its countdown');
   assert.equal(p.enemy.hp,V.totemHP);assert.equal(s.venus.next,0);run(s,7);
  }
  assert.equal(p.life,life-14);
 }
});

test('a wrong-order move still explodes on schedule after the preceding totem',()=>{
 const s=fresh();spawnAll(s);const previous=s.venus.totems[1],wrong=s.venus.totems[2];
 previous.life=3;wrong.life=5;if(!inPlay(s,wrong))s.enemies.push(wrong.enemy);hit(s,wrong.enemy,999);
 const moved=[wrong.enemy.tileX,wrong.enemy.tileY];run(s,3);
 assert.equal(previous.overload,V.overloadTicks);assert.equal(wrong.life,2);
 run(s,2);assert.equal(wrong.overload,V.overloadTicks);assert.equal(previous.overload,V.overloadTicks-2);
 run(s,V.overloadTicks-2);assert.equal(previous.life,V.lifeTicks[0]);assert.equal(wrong.overload,2);
 assert.deepEqual([wrong.enemy.tileX,wrong.enemy.tileY],moved,'the later scheduled blast has not happened yet');
 run(s,2);assert.notDeepEqual([wrong.enemy.tileX,wrong.enemy.tileY],moved);assert.equal(wrong.life,V.lifeTicks[0]);
});

test('breaking a wrong totem during its warning preserves the remaining warning time',()=>{
 const s=fresh();spawnAll(s);const p=s.venus.totems[2];p.life=1;run(s,11);const warning=p.overload;
 assert.equal(warning,V.overloadTicks-10);hit(s,p.enemy,999);
 assert.equal(p.overload,warning);assert.equal(p.enemy.totem.overloadTicks,warning);
 const moved=[p.enemy.tileX,p.enemy.tileY];run(s,warning-1);
 assert.equal(p.overload,1);assert.deepEqual([p.enemy.tileX,p.enemy.tileY],moved);
 run(s,1);assert.equal(p.overload,0);assert.equal(p.life,V.lifeTicks[0]);assert.notDeepEqual([p.enemy.tileX,p.enemy.tileY],moved);
});

test('destroying the sequence in order breaks the shield; it returns with a new sequence later',()=>{
 const s=fresh();spawnAll(s);s.immortal=false;s.playerHP=20;
 for(let i=0;i<s.venus.total;i++){const p=s.venus.totems.find(q=>q.order===i);if(!inPlay(s,p))s.enemies.push(p.enemy);const bhp=boss(s).hp,last=i===s.venus.total-1;hit(s,p.enemy,999);assert.equal(s.venus.next,i+1);
  if(!last)assert.ok(Math.abs(bhp-boss(s).hp-V.phaseHP*V.totemBossShare)<1e-6,'each totem hits him for '+V.totemBossShare*100+'% of a phase, through his shield');}
 assert.equal(boss(s).aegis.shielded,false);assert.equal(s.venus.exposed,V.exposeTicks);assert.equal(s.playerHP,Math.min(c.PLAYER_MAX_HP,20+s.venus.total*V.totemHeal+V.shieldHeal),'each totem heals a little, and breaking the shield heals you');
 run(s,V.exposeTicks);assert.equal(boss(s).aegis.shielded,true);assert.equal(s.venus.next,0);assert.equal(s.venus.totems.length,0);
 run(s,V.recoverySpawnDelay-2);assert.equal(s.venus.totems.length,0);
 run(s,1);assert.equal(s.venus.totems.length,1);
});

test('a totem left too long overloads for a second, then blows and moves',()=>{
 const s=fresh();calm(s);run(s,31+V.revealTicks);const p=s.venus.totems[0];assert.ok(!inPlay(s,p),'buried');const at=[p.enemy.tileX,p.enemy.tileY];p.life=1;
 run(s,1);assert.equal(p.overload,V.overloadTicks);assert.ok(inPlay(s,p),'shows itself before it blows');
 run(s,V.overloadTicks);assert.notDeepEqual([p.enemy.tileX,p.enemy.tileY],at);assert.ok(inPlay(s,p));assert.equal(p.order,0);
 assert.equal(p.life,V.lifeTicks[0],'a relocated totem uses the regular timer');
});

test('while shielded he reflects your hits; once the shield breaks he takes full damage',()=>{
 const s=fresh();s.immortal=false;s.playerHP=100;const b=boss(s),hp=b.hp;
 e.damageEnemy(s,b,20);assert.ok(s.playerHP<100,'reflected');assert.ok(hp-b.hp<5,'barely hurt');
 v.godVenusBreakShield(s);const before=b.hp;e.damageEnemy(s,b,20);assert.equal(before-b.hp,20);
});

test('he leaps onto your locked position from anywhere; a well-timed Sand Swirl parries the landing',()=>{
 const s=fresh();s.immortal=false;s.playerHP=100;s.venus.lanceTimer=1e9;const [lx,ly]=floorTile(s,3);player(s,lx,ly);s.venus.leapTimer=1;
 run(s,1);assert.ok(s.venus.leap);assert.ok(v.venusAirborne(s,boss(s)));
 run(s,V.leapAim+V.leapLock);assert.equal(boss(s).tileX,lx);assert.equal(boss(s).tileY,ly);assert.ok(s.playerHP<100,'landed on you');
 const s2=fresh();s2.immortal=false;s2.playerHP=100;s2.venus.lanceTimer=1e9;player(s2,...floorTile(s2,3));s2.venus.leapTimer=1;
 run(s2,V.leapAim+V.leapLock);v.useSandSweep(s2);const hp=boss(s2).hp;run(s2,1);
 assert.equal(s2.playerHP,100,'parried');assert.ok(hp-boss(s2).hp<=V.phaseHP*V.parryDamage*c.AEGIS_DAMAGE_MULT+1e-6,'through the shield it barely scratches him');assert.equal(s2.venus.stun,V.leapParryStun,'a parried leap stuns him longer');
 const s3=fresh();s3.immortal=false;s3.playerHP=100;s3.venus.lanceTimer=1e9;player(s3,...floorTile(s3,3));s3.venus.leapTimer=1;run(s3,1);v.godVenusBreakShield(s3); // a leap already under way still lands after the shield breaks
 run(s3,V.leapAim+V.leapLock-1);v.useSandSweep(s3);const hp3=boss(s3).hp;run(s3,1);assert.ok(Math.abs(hp3-boss(s3).hp-V.phaseHP*V.parryDamage)<1e-6,'shield broken: full damage');
});

test('his lance charges, then hits along its line; a well-timed Sand Swirl parries it',()=>{
 const s=fresh();s.immortal=false;s.playerHP=100;s.venus.leapTimer=1e9;const b=boss(s);player(s,b.tileX+3,b.tileY);s.venus.lanceTimer=1;
 run(s,V.lanceWindup);assert.ok(s.playerHP<100);
 const s2=fresh();s2.immortal=false;s2.playerHP=100;s2.venus.leapTimer=1e9;const b2=boss(s2);player(s2,b2.tileX+3,b2.tileY);s2.venus.lanceTimer=1;
 run(s2,V.lanceWindup-1);v.useSandSweep(s2);run(s2,1);assert.equal(s2.playerHP,100);assert.equal(s2.venus.stun,V.parryStun);
});

test('each new phase brings the shield back with a longer sequence',()=>{
 const s=fresh();v.godSetVenusPhase(s,2);assert.equal(s.venus.total,V.totems[1]);assert.equal(boss(s).aegis.shielded,true);
 v.godSetVenusPhase(s,3);assert.equal(s.venus.total,V.totems[2]);
 v.godVenusBreakShield(s);boss(s).hp=1;hit(s,boss(s),5);assert.equal(s.gamePhase,'won');
});

test('Sand Swirl also raises a short guard: hits on you are cut and reflected, separately from Venus Veil',()=>{
 const s=fresh();s.immortal=false;s.playerHP=100;player(s,5,5);
 const alien=e.createEncounterEnemy(s,'normal',6,5,100);s.enemies.push(alien);
 v.useSandSweep(s);e.damagePlayer(s,10,alien);
 assert.ok(Math.abs(s.playerHP-(100-10*V.guardDamage*c.CARRY_DAMAGE_MULT**(s.playerCarryingRuby?1:0)))<1e-6||s.playerHP>100-10,'cut');
 const after=alien.hp;assert.ok(after<100,'reflected to the attacker');
 s.venusVeilTicks=60;e.damagePlayer(s,10,alien);assert.ok(alien.hp<after-10+1e-6,'Veil and the guard each reflect their own');
 run(s,V.guardTicks+1);const hp=s.playerHP,ahp=alien.hp;s.venusVeilTicks=0;e.damagePlayer(s,10,alien);assert.equal(alien.hp,ahp,'guard over: nothing reflected');assert.ok(s.playerHP<hp);
});

test('with his shield up he leaps more often',()=>{
 const s=fresh();s.venus.lanceTimer=1e9;player(s,...floorTile(s,3));s.venus.leapTimer=1;run(s,1+V.leapAim+V.leapLock);
 assert.equal(s.venus.leapTimer,Math.round(V.leapGap*V.shieldedPace));
});

test('countering heals you: a parry, or a totem blast caught by the Sand Swirl guard',()=>{
 const s=fresh();s.immortal=false;s.playerHP=50;s.venus.lanceTimer=1e9;player(s,...floorTile(s,3));s.venus.leapTimer=1;
 run(s,V.leapAim+V.leapLock);v.useSandSweep(s);run(s,1);assert.equal(s.playerHP,50+V.counterHeal,'parry heals');
 const s2=fresh();spawnAll(s2);s2.immortal=false;s2.playerHP=50;const p=s2.venus.totems[2];
 const room=c.chamberOfTile(p.enemy.tileX,p.enemy.tileY),spot=e.freeChamberTiles(s2,room).find(([x,y])=>Math.hypot(x-p.enemy.tileX,y-p.enemy.tileY)>5);player(s2,spot[0],spot[1]);
 if(!inPlay(s2,p))s2.enemies.push(p.enemy);v.useSandSweep(s2);hit(s2,p.enemy,999);
 assert.ok(s2.playerHP>=50+V.counterHeal-1e-6,'blast fully blocked, and a heal (more if its shockwave sets off another caught blast)');
});

test('sand relics lie buried until a sweep uncovers them; breaking one gives its gift',()=>{
 const s=fresh();calm(s);run(s,1);assert.equal(s.venus.relics.length,V.relicStart);
 for(const r of s.venus.relics)assert.ok(!s.enemies.includes(r.enemy),'buried: off the map');
 const relic=s.venus.relics[0];player(s,relic.enemy.tileX+2,relic.enemy.tileY);s.venus.sweepCooldown=0;v.useSandSweep(s);
 assert.ok(s.enemies.includes(relic.enemy),'uncovered by the sweep');
 const gift=kind=>{const s2=fresh();calm(s2);run(s2,1);const r=s2.venus.relics[0];r.kind=r.enemy.relicKind=kind;s2.enemies.push(r.enemy);s2.immortal=false;s2.playerHP=50;s2.rubyHP=50;s2.trial.cooldown=600;hit(s2,r.enemy,1);assert.ok(!s2.venus.relics.includes(r));return s2;};
 const urn=gift('urn');
 assert.equal(urn.playerHP,50+V.urnHeal,'Healing Urn heals the player');
 assert.equal(urn.rubyHP,50+V.urnHeal,'Healing Urn heals Ruby');
 assert.equal(gift('sun').trial.cooldown,300,'Sun Disk halves Venus Veil cooldown');
 const eye=gift('eye');assert.equal(eye.venus.seer,V.seerTicks);assert.equal(v.venusRevealing(eye),true);assert.equal(v.venusRevealingOrder(eye),false,'where they lie, not their order');
 run(eye,V.seerTicks);assert.equal(v.venusRevealing(eye),false);
});

test('relics and their pickup effect run without the Sentinel on the map, and the effect fades',()=>{
 const s=e.createModeState('trial','aegis_sentinel');s.noMobs=true;s.immortal=true;s.meteoriteTimer=1e6;
 run(s,1);assert.equal(s.venus.relics.length,V.relicStart,'relics before he arrives');
 const r=s.venus.relics[0];s.enemies.push(r.enemy);hit(s,r.enemy,1);assert.equal(s.venus.finds.length,1);
 run(s,60);assert.equal(s.venus.finds.length,0,'the ring fades');
});

test('a totem moves its buried nest and leaves released scarabs in place',()=>{
 const s=fresh();calm(s);s.venus.nestClock=1e9;run(s,30); // no extra timed nests, so only this nest's fate is tested
 const totem=s.venus.totems[0], nest=s.venus.nests.find(n=>n.totemId===totem.enemy.id);
 const distance=(x,y)=>Math.hypot(x-totem.enemy.tileX,y-totem.enemy.tileY);
 const relocate=()=>{totem.life=1;run(s,1+V.overloadTicks);};
 assert.ok(distance(nest.tx,nest.ty)<=3);
 assert.equal(s.enemies.filter(x=>x.type==='sand_scarab').length,0,'nothing until found');
 const firstNestTile=[nest.tx,nest.ty];
 relocate();
 assert.notDeepEqual([nest.tx,nest.ty],firstNestTile);
 assert.ok(distance(nest.tx,nest.ty)<=3);
 player(s,nest.tx,nest.ty);v.useSandSweep(s);
 assert.ok(!s.venus.nests.includes(nest),'the swirl opens the nest');
 const bugs=s.enemies.filter(x=>x.type==='sand_scarab');
 assert.ok(bugs.length>=V.nestScarabs,'one scarab per opened nest');
 for(const bug of bugs) assert.ok(distance(bug.tileX,bug.tileY)<=3);
 const oldTotemTile=[totem.enemy.tileX,totem.enemy.tileY];
 const oldBugTiles=bugs.map(bug=>[bug.tileX,bug.tileY]);
 relocate();
 assert.notDeepEqual([totem.enemy.tileX,totem.enemy.tileY],oldTotemTile);
 assert.deepEqual(bugs.map(bug=>[bug.tileX,bug.tileY]),oldBugTiles);
 assert.deepEqual(s.enemies.filter(x=>x.type==='sand_scarab'),bugs);
 assert.ok(!s.venus.nests.some(n=>n.totemId===totem.enemy.id),'the opened nest stays consumed');
});

test('a Dune Worm cannot be hit underground, bursts up beside you with a knockback bite, then digs back down',()=>{
 const s=e.createModeState('trial','aegis_sentinel');s.noMobs=true;s.meteoriteTimer=1e6;s.playerHP=1e4;s.immortal=false;run(s,1);
 const [x,y]=floorTile(s,0);player(s,x+1,y);const w=e.createEncounterEnemy(s,'dune_worm',x,y,12);s.enemies.push(w);
 hit(s,w,5);assert.equal(w.hp,12,'underground it takes no damage');
 assert.equal(v.updateDuneWorm(s,w),true);assert.equal(w.burrow,'rising');
 const hp=s.playerHP;for(let i=0;i<V.burrowRise;i++)v.updateDuneWorm(s,w);
 assert.equal(w.burrow,'up');assert.ok(s.playerHP<hp,'it bites');assert.ok(s.playerKnockback&&s.playerKnockback.tilesLeft===V.burrowKnockback,'and knocks you back');
 assert.equal(s.playerFrozenTicks,0,'no stun mid-knockback');s.playerKnockback=null;v.updateVenus(s);assert.equal(s.playerFrozenTicks,V.burrowStun,'stunned once you land');
 hit(s,w,5);assert.equal(w.hp,7,'up, it can be hit');
 for(let i=0;i<V.burrowUp+V.burrowSink;i++)v.updateDuneWorm(s,w);assert.equal(w.burrow,'under');
});

test('Sand Swirl digs up an underground Dune Worm, dazed and hittable',()=>{
 const s=e.createModeState('trial','aegis_sentinel');s.noMobs=true;s.meteoriteTimer=1e6;s.immortal=true;run(s,1);
 const [x,y]=floorTile(s,0);player(s,x+2,y);const w=e.createEncounterEnemy(s,'dune_worm',x,y,12);s.enemies.push(w);
 v.useSandSweep(s);assert.equal(w.burrow,'up');assert.equal(w.burrowTicks,V.burrowDazed);hit(s,w,5);assert.equal(w.hp,7);
});

test('breaking the shield hurts him, but never past his phase',()=>{
 const s=fresh();calm(s);const b=boss(s);spawnAll(s);
 const hp=b.hp;for(let i=0;i<s.venus.total;i++){const p=s.venus.totems.find(q=>q.order===i);if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);}
 assert.equal(b.aegis.shielded,false);assert.ok(Math.abs(hp-b.hp-V.phaseHP*(V.breakShare+s.venus.total*V.totemBossShare))<1e-6,'the break plus each totem hit');assert.ok(s.venus.shatter);
});

test('an underground Dune Worm still tunnels after you in the game loop',()=>{
 const s=e.createModeState('trial','aegis_sentinel');s.noMobs=true;s.immortal=true;s.meteoriteTimer=1e6;s.gamePhase='playing';
 const [x,y]=e.freeChamberTiles(s,0)[0];const w=e.createEncounterEnemy(s,'dune_worm',x,y,12);s.enemies.push(w);
 const d0=Math.hypot(w.tileX-s.playerTileX,w.tileY-s.playerTileY);for(let i=0;i<200;i++)e.tick(s);
 assert.equal(w.burrow,'under');assert.ok(Math.hypot(w.tileX-s.playerTileX,w.tileY-s.playerTileY)<d0-2,'it moved toward you');
});

test('the usual reshield warning runs in the last seconds before his shield returns',()=>{
 const s=fresh();calm(s);const b=boss(s);spawnAll(s);
 for(let i=0;i<s.venus.total;i++){const p=s.venus.totems.find(q=>q.order===i);if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);}
 s.gamePhase='playing';for(let i=0;i<V.exposeTicks-60;i++)e.tick(s);
 assert.equal(b.aegis.shielded,false);assert.ok(b.aegis.reshieldTicks>0&&b.aegis.reshieldTicks<=c.AEGIS_RESHIELD_WARNING_TICKS,'warning is showing');
});

test('with his shield broken he lances far more often; Sand Swirl keeps its cooldown',()=>{
 const s=fresh();calm(s);const b=boss(s);spawnAll(s);s.venus.lanceTimer=1e9;
 for(let i=0;i<s.venus.total;i++){const p=s.venus.totems.find(q=>q.order===i);if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);}
 assert.equal(s.venus.lanceTimer,V.brokenLanceGap);
 s.gamePhase='playing';assert.ok(v.useSandSweep(s));assert.equal(s.venus.sweepCooldown,V.sweepCooldown);
});

test('phase 3: his core hides in the sand, sealed until the totems are gone; only breaking it breaks the shield',()=>{
 const s=fresh();calm(s);v.godSetVenusPhase(s,3);const b=boss(s),t=s.venus;
 assert.equal(t.total,V.totems[2]);assert.equal(t.total,5);assert.ok(t.core&&t.core.buried&&!s.enemies.includes(t.core.enemy),'core buried');
 const core=t.core.enemy;player(s,core.tileX+2,core.tileY);s.gamePhase='playing';v.useSandSweep(s);
 assert.ok(t.core.found&&s.enemies.includes(core),'a swirl finds it');hit(s,core,50);assert.equal(core.hp,V.coreHP,'sealed: no damage');
 run(s,V.sweepExpose+1);assert.ok(t.core.buried&&!s.enemies.includes(core),'the sand takes it again');
 spawnAll(s);for(let i=0;i<t.total;i++){const p=t.totems.find(q=>q.order===i);if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);}
 assert.equal(b.aegis.shielded,true,'totems alone do not break it');assert.equal(t.coreWindow,V.coreTicks);
 assert.equal(t.core.clues.length,t.total,'each destroyed totem marks a tile pointing to the core');
 t.sweepCooldown=0;v.useSandSweep(s);assert.ok(s.enemies.includes(core),'uncovered again');hit(s,core,999);assert.equal(b.aegis.shielded,false);assert.equal(t.core,null);
});

test('phase 3: leave the open core too long and the shield recovers with a new sequence and core',()=>{
 const s=fresh();calm(s);v.godSetVenusPhase(s,3);const t=s.venus,old=t.core;spawnAll(s);
 for(let i=0;i<t.total;i++){const p=t.totems.find(q=>q.order===i);if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);}
 run(s,V.coreTicks);assert.equal(t.next,0);assert.equal(t.coreWindow,0);assert.ok(t.core&&t.core!==old,'a fresh core');assert.equal(boss(s).aegis.shielded,true);
 assert.equal(t.core.clues,undefined,'the new core starts without arrows from the old sequence');
});

test('a meteor always deals him 10% of a phase, shielded or not',()=>{
 for(const shielded of [true,false]){
  const s=fresh();const b=boss(s);s.immortal=true;s.godMode=true;b.aegis.shielded=shielded;if(!shielded)b.aegis.exposedUntilTick=s.gameTick+1e6;const hp=b.hp;
  s.meteoriteWarning=c.chamberOfTile(b.tileX,b.tileY);s.meteoriteStrikeIn=1;e.tick(s);
  assert.ok(Math.abs(hp-b.hp-V.phaseHP*V.meteorShare)<1e-6,(shielded?'shielded':'exposed')+': '+(hp-b.hp));
 }
});

test('phase 3 hint: the core chamber shows once only one totem is left',()=>{
 const s=fresh();calm(s);v.godSetVenusPhase(s,3);const t=s.venus;spawnAll(s);
 assert.equal(v.venusCoreHint(s),false);
 for(let i=0;i<t.total-1;i++){const p=t.totems.find(q=>q.order===i);if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);}
 assert.equal(v.venusCoreHint(s),true);
});

test('totems spread out: at most 2 in one chamber, 7 tiles apart',()=>{
 for(let k=0;k<10;k++){
  const s=fresh();calm(s);v.godSetVenusPhase(s,2);spawnAll(s);const ps=s.venus.totems.map(p=>p.enemy);
  assert.equal(ps.length,5);
  for(let r=0;r<4;r++)assert.ok(ps.filter(p=>c.chamberOfTile(p.tileX,p.tileY)===r).length<=V.totemsPerRoom);
  for(const a of ps)for(const b of ps)if(a!==b)assert.ok(Math.hypot(a.tileX-b.tileX,a.tileY-b.tileY)>=V.totemSpacing);
 }
});

test('a totem shows its number only during its first appearance',()=>{
 const s=fresh();calm(s);run(s,40);const p=s.venus.totems[0];
 assert.ok(p&&p.intro,'first reveal');run(s,V.revealTicks+5);assert.equal(p.intro,false,'buried: never again');
 player(s,p.enemy.tileX+1,p.enemy.tileY);s.gamePhase='playing';v.useSandSweep(s);assert.ok(!p.buried&&!p.intro,'uncovered later: no number');
});

test('a totem blast reflected by the guard or Venus Veil hits every enemy in the chamber, never you again',()=>{
 for(const how of ['guard','veil']){
  const s=fresh();spawnAll(s);s.immortal=false;s.playerHP=90;const p=s.venus.totems[2],b=boss(s);
  const room=c.chamberOfTile(p.enemy.tileX,p.enemy.tileY),spot=e.freeChamberTiles(s,room).find(([x,y])=>Math.hypot(x-p.enemy.tileX,y-p.enemy.tileY)>3);player(s,spot[0],spot[1]);
  const alien=e.createEncounterEnemy(s,'fast',spot[0],spot[1]===p.enemy.tileY?spot[1]:spot[1],50);s.enemies.push(alien);
  Object.assign(b,{tileX:spot[0],tileY:spot[1]});b.hp-=300;const bhp=b.hp;
  if(how==='guard'){s.gamePhase='playing';v.useSandSweep(s);}else s.venusVeilTicks=60;
  if(!inPlay(s,p))s.enemies.push(p.enemy);const hp0=s.playerHP;hit(s,p.enemy,999);
  assert.ok(alien.hp<50,how+': the alien is hit');assert.ok(b.hp<bhp+V.phaseHP*V.missHeal,how+': he is hit through his shield (on top of the miss heal)');assert.ok(s.playerHP>hp0-V.blastDamage,how+': you are protected and nothing bounces back');
 }
});

test('the shield-break backlash hurts him even mid-leap',()=>{
 const s=fresh();calm(s);const b=boss(s);spawnAll(s);s.venus.leap={stage:'aim',ticks:20,tx:b.tileX,ty:b.tileY};
 assert.ok(v.venusAirborne(s,b),'airborne');const hp=b.hp;
 for(let i=0;i<s.venus.total;i++){const p=s.venus.totems.find(q=>q.order===i);if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);}
 assert.equal(hp-b.hp,V.phaseHP*V.breakShare);
});

test('a clue arrow toward the core fades after 2 seconds',()=>{
 const s=fresh();calm(s);v.godSetVenusPhase(s,3);const t=s.venus;spawnAll(s);
 const p=t.totems.find(q=>q.order===0);if(!inPlay(s,p))s.enemies.push(p.enemy);hit(s,p.enemy,999);
 assert.equal(t.core.clues.length,1);run(s,V.clueTicks);assert.equal(t.core.clues.length,0);
});

test('extra nests are shared out among the totems',()=>{
 const s=fresh();calm(s);spawnAll(s);run(s,V.nestGap*12);const t=s.venus;
 const counts=t.totems.map(p=>t.nests.filter(n=>n.totemId===p.enemy.id).length);
 assert.ok(Math.max(...counts)-Math.min(...counts)<=1,'no totem flooded: '+counts);
});

test('the final phase has 100 more HP than the others, and a hit never crosses into it early',()=>{
 const s=fresh();calm(s);v.godSetVenusPhase(s,3);const b=boss(s);
 assert.equal(b.hp,V.finalPhaseHP);assert.equal(v.venusPhaseOf(b.hp),3);
 v.godSetVenusPhase(s,2);assert.equal(b.hp,V.finalPhaseHP+V.phaseHP);b.aegis.shielded=false;
 e.damageEnemy(s,b,5000,'special');assert.equal(b.hp,V.finalPhaseHP,'stops at the top of the final phase');
});

test('phase 3 buries Sand Scorpions on fixed tiles: they burst up beside you with a hard knockback sting and never move',()=>{
 const s=fresh();calm(s);v.godSetVenusPhase(s,3);
 const sc=s.enemies.filter(x=>x.type==='sand_scorpion');assert.equal(sc.length,V.scorpions);
 const k=sc[0],home=[k.tileX,k.tileY];hit(s,k,10);assert.equal(k.hp,k.maxHp,'buried: cannot be hit');
 s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));s.immortal=false;s.playerHP=100;s.gamePhase='playing';player(s,k.tileX+1,k.tileY);
 for(let i=0;i<V.scorpRise+2;i++)v.updateSandScorpion(s,k);
 assert.equal(k.burrow,'up');assert.ok(s.playerHP<100,'it stings');assert.ok(s.playerKnockback&&s.playerKnockback.tilesLeft>=1,'and knocks you back');
 for(let i=0;i<400;i++)e.tick(s);assert.deepEqual([k.tileX,k.tileY],home,'it never leaves its tile');
 v.godSetVenusPhase(s,2);assert.equal(s.enemies.filter(x=>x.type==='sand_scorpion').length,0,'only in phase 3');
});

test('relics: at most 9 at a time, never more than 3 of one kind',()=>{
 const s=e.createModeState('trial','aegis_sentinel');s.noMobs=true;s.immortal=true;s.meteoriteTimer=1e6;
 run(s,V.relicGap*20);const kinds=s.venus.relics.map(r=>r.kind);
 assert.ok(kinds.length<=V.relicCap,`${kinds.length}`);for(const k of ['urn','sun','eye'])assert.ok(kinds.filter(x=>x===k).length<=V.relicPerKind,k);
});

test('a totem that blows and moves heals him 5% of a phase, never past his phase',()=>{
 const s=fresh();spawnAll(s);s.immortal=true;const b=boss(s);b.hp-=200;const hp=b.hp;
 const wrong=s.venus.totems.find(q=>q.order===1);if(!inPlay(s,wrong))s.enemies.push(wrong.enemy);hit(s,wrong.enemy,999);
 assert.ok(Math.abs(b.hp-hp-V.phaseHP*V.missHeal)<1e-6,'healed '+(b.hp-hp));
 b.hp=b.maxHp;const w2=s.venus.totems.find(q=>q.order===2);if(!inPlay(s,w2))s.enemies.push(w2.enemy);hit(s,w2.enemy,999);assert.equal(b.hp,b.maxHp,'capped at his phase');
});


test('each totem spawn and overload reposition plays one arrival cue, with no repeated or paused cues',()=>{
 const oldAudio=global.Audio,calls=[];global.Audio=class{constructor(src){this.src=src;}play(){calls.push({src:this.src,pitch:this.playbackRate});return Promise.resolve();}};
 try{
  const s=fresh();spawnAll(s);const arrival=()=>calls.filter(x=>x.src.endsWith('/saturn-warning.mp3')).length;
  assert.equal(arrival(),s.venus.total);
  const p=s.venus.totems[0],previous=[p.enemy.tileX,p.enemy.tileY];p.life=1;run(s,V.overloadTicks+2);
  assert.notDeepEqual([p.enemy.tileX,p.enemy.tileY],previous);assert.equal(arrival(),s.venus.total+1);
  const n=arrival();run(s,10);assert.equal(arrival(),n);s.gamePhase='rules';run(s,30);assert.equal(arrival(),n);
 }finally{if(oldAudio===undefined)delete global.Audio;else global.Audio=oldAudio;}
});

test('he never starts a leap while his shield is broken; the countdown waits',()=>{
 const s=fresh();calm(s);s.immortal=true;const t=s.venus;t.exposed=600;t.leapTimer=2;t.lance=null;t.stun=0;
 for(let i=0;i<120;i++)v.updateVenus(s);
 assert.equal(t.leap,null,'no leap while exposed');assert.equal(t.leapTimer,2,'the countdown held');
});

test('after every leap he lumbers at the slow speed for a moment',()=>{
 const s=fresh();s.immortal=true;s.venus.lanceTimer=1e9;player(s,...floorTile(s,3));s.venus.leapTimer=1;
 run(s,1+V.leapAim+V.leapLock);assert.equal(s.venus.leap,null,'landed');assert.ok(s.venus.leapSlow>0&&s.venus.leapSlow<=V.leapSlow);
 run(s,V.leapSlow);assert.equal(s.venus.leapSlow,0,'it wears off');
});

test('you can parry a leap from a tile outside its reach; out there an unparried landing misses you',()=>{
 const make=()=>{const s=fresh();s.immortal=false;s.playerHP=100;s.venus.lanceTimer=1e9;const [lx,ly]=floorTile(s,3);player(s,lx,ly);s.venus.leapTimer=1;run(s,1+V.leapAim);assert.equal(s.venus.leap.stage,'lock');
  const off=Math.floor(V.leapRadius)+1;player(s,lx+off,ly);return s;};
 const s=make();run(s,V.leapLock-2);v.useSandSweep(s);run(s,2);
 assert.equal(s.venus.stun,V.leapParryStun,'parried from just outside the reach');assert.equal(s.playerHP,100);
 const s2=make();run(s2,V.leapLock);assert.equal(s2.playerHP,100,'out there the landing misses you');assert.equal(s2.venus.stun,0);
});

test('phase 3: a killed Sand Scorpion is replaced by a new buried one after a while, up to the full set',()=>{
 const s=fresh();calm(s);s.immortal=true;v.godSetVenusPhase(s,3);
 const scorps=()=>s.enemies.filter(x=>x.type==='sand_scorpion'&&x.hp>0);assert.equal(scorps().length,V.scorpions);
 const gone=scorps()[0];s.enemies=s.enemies.filter(x=>x!==gone);assert.equal(scorps().length,V.scorpions-1);
 run(s,V.scorpRespawn-2);assert.equal(scorps().length,V.scorpions-1,'not yet');
 run(s,3);assert.equal(scorps().length,V.scorpions,'a new one is buried');assert.equal(scorps().at(-1).burrow,'under');
 run(s,V.scorpRespawn*2);assert.equal(scorps().length,V.scorpions,'never more than the full set');
});

test('a successful counter sends out a shockwave that hits other enemies around you',()=>{
 const s=fresh();s.immortal=true;s.venus.lanceTimer=1e9;const [lx,ly]=floorTile(s,3);player(s,lx,ly);s.venus.leapTimer=1;
 const near=e.createEncounterEnemy(s,'normal',lx+2,ly,100),far=e.createEncounterEnemy(s,'normal',lx+6,ly,100);s.enemies.push(near,far);
 run(s,V.leapAim+V.leapLock-1);player(s,lx,ly);v.useSandSweep(s);run(s,2);
 assert.ok(s.venus.stun>0,'parried');assert.ok(near.hp<100,'the shockwave hits a nearby enemy');assert.ok(s.venus.sweepCooldown<=1,'and Sand Swirl is ready again');assert.equal(far.hp,100,'but not one far away');
});

test('a buried Sand Scorpion beside you does not stop you healing Ruby; a surfaced one does',()=>{
 const s=e.createModeState('trial','aegis_sentinel');s.noMobs=true;s.meteoriteTimer=1e6;s.enemies=[];
 const [x,y]=floorTile(s,0);player(s,x,y);Object.assign(s,{playerCarryingRuby:false,rubyTileX:x,rubyTileY:y,gamePhase:'playing',playerHP:50});
 const sc=e.createEncounterEnemy(s,'sand_scorpion',x+1,y,40);sc.burrow='under';s.enemies.push(sc);
 assert.equal(e.canHealRuby(s),true,'buried: no effect');sc.burrow='up';assert.equal(e.canHealRuby(s),false,'surfaced: it blocks healing');
});

test('his leap hits you softer but the guard reflects it at full strength',()=>{
 const land=(guard)=>{const s=fresh();s.immortal=false;s.playerHP=100;s.venus.lanceTimer=1e9;const [lx,ly]=floorTile(s,3);player(s,lx,ly);s.venus.leapTimer=1;
  run(s,1+V.leapAim+V.leapLock-30);if(guard){s.gamePhase='playing';v.useSandSweep(s);s.venus.parryUntil=-1;}const b=boss(s),hp=b.hp;run(s,30);return{s,b,lost:hp-b.hp};};
 const plain=land(false);assert.ok(Math.abs(100-plain.s.playerHP-V.leapDamage*V.attackSoften*(plain.s.playerCarryingRuby?c.CARRY_DAMAGE_MULT:1))<1e-6,'80% of the leap');
 const g=land(true);const full=V.leapDamage*V.guardReflect*v.venusReflectScale(g.s,g.b)*(g.b.aegis?.shielded?c.AEGIS_DAMAGE_MULT:1);
 assert.ok(Math.abs(g.lost-full)<1e-6,'reflected at the full leap damage: '+g.lost+' vs '+full);
});

test('the counter shockwave also hits visible totems nearby',()=>{
 const s=fresh();spawnAll(s);s.immortal=true;const p=s.venus.totems[0];if(!s.enemies.includes(p.enemy))s.enemies.push(p.enemy);
 const [px,py]=floorTile(s,3);player(s,px,py);Object.assign(p.enemy,{tileX:px+1,tileY:py,x:(px+1.5)*48,y:(py+.5)*48});const hp=p.enemy.hp; // a visible totem right beside you
 s.venus.parryUntil=s.gameTick+5;s.venus.leap={stage:'lock',ticks:1,tx:s.playerTileX,ty:s.playerTileY};run(s,1);
 assert.ok(s.venus.stun>0,'parried');assert.ok(p.enemy.hp<hp,'the totem is hit');
});

test('in the core window the minimap hint shrinks from the core\'s chamber to a 9×9 square that holds the core',()=>{
 const s=fresh();calm(s);s.immortal=true;v.godSetVenusPhase(s,3);const t=s.venus;assert.ok(t.core,'phase 3 has a core');
 assert.equal(v.venusCoreHintRect(s),null,'nothing before the window');
 t.next=t.total;t.coreWindow=V.coreTicks;t.coreHintOff=[4,1];
 const room=c.chamberOfTile(t.core.enemy.tileX,t.core.enemy.tileY);assert.deepEqual(v.venusCoreHintRect(s),c.CHAMBER_BOUNDS[room],'starts as the chamber');
 t.coreWindow=1;const [r1,c1,r2,c2]=v.venusCoreHintRect(s);
 assert.ok(Math.abs((r2-r1)-8)<.05&&Math.abs((c2-c1)-8)<.05,'about 9×9 at the end');
 const {tileX:x,tileY:y}=t.core.enemy;assert.ok(x>=c1-.01&&x<=c2+.01&&y>=r1-.01&&y<=r2+.01,'and it holds the core');
});

test('scarab nests are capped at two per totem left (plus the phase 3 core), and gather near the core too',()=>{
 const s=fresh();calm(s);s.immortal=true;spawnAll(s);const t=s.venus;
 while(t.totems.length>1){const p=t.totems.find(q=>q.order===t.next);if(!s.enemies.includes(p.enemy))s.enemies.push(p.enemy);hit(s,p.enemy,999);}
 run(s,V.nestGap*12);assert.ok(t.nests.length<=V.nestsPerTarget*1,'one totem left: at most two nests ('+t.nests.length+')');
 const s3=fresh();calm(s3);s3.immortal=true;v.godSetVenusPhase(s3,3);run(s3,V.nestGap*15);
 const core=s3.venus.core;assert.ok(core&&s3.venus.nests.some(n=>n.totemId===core.enemy.id),'a nest lies near the core');
});
