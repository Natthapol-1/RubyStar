const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const e=require('../game/engine.ts'),b=require('../game/endless-builds.ts'),fx=require('../game/blessing-effects.ts'),art=require('../game/blessing-art.ts'),c=require('../game/constants.ts');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function fresh(blessings){const s=e.createModeState('endless');s.build.blessings=blessings;s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e8;s.resourceTimer=-1e8;for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*c.TILE_SIZE;s.rubyTileX=s.rubyTileY=30;return s;}
function mob(s,x=11,y=10,type='normal'){const enemy=e.createEncounterEnemy(s,type,x,y,1000);enemy.pathTimer=enemy.attackTimer=enemy.windupTicks=1e7;s.enemies.push(enemy);return enemy;}
function random(value,fn){const old=Math.random;Math.random=()=>value;try{return fn();}finally{Math.random=old;}}
test('Ruby waits three seconds, boosts damage/speed, colors attacks and resets on shield hits',()=>{const s=fresh(['fiery_king']),a=mob(s);for(let i=0;i<179;i++)fx.updateBlessingEffects(s);assert.equal(fx.solarBlessingReady(s),false);fx.updateBlessingEffects(s);assert.equal(fx.solarBlessingReady(s),true);near(fx.blessingSpeedMultiplier(s),1.15);e.useLaser(s);near(1000-a.hp,c.LASER_DMG*1.3);assert.ok(s.laserBeams.every(beam=>beam.solar));s.playerShieldHP=20;e.damagePlayer(s,1);assert.equal(s.playerHP,100);assert.equal(fx.solarBlessingReady(s),false);near(fx.blessingSpeedMultiplier(s),1);});
test('Emerald caps haste and enemy slows and expires rather than growing without limit',()=>{const s=fresh(['storm_reaper']),a=mob(s),boss=mob(s,12,10,'fiery_king');for(let i=0;i<100;i++){fx.blessingAttack(s,'bullet');fx.blessingHit(s,a);fx.blessingHit(s,boss);}near(fx.blessingSpeedMultiplier(s),1.4);near(b.buildSlowMultiplier(s,a),.5);near(b.buildSlowMultiplier(s,boss),.75);s.gameTick=181;fx.updateBlessingEffects(s);near(fx.blessingSpeedMultiplier(s),1);near(b.buildSlowMultiplier(s,a),1);});
test('Sapphire heals only damaging hits, with a four-HP-per-second cap and no Ruby or copy healing',()=>{
 const s=fresh(['sea_chanter']);s.playerHP=s.rubyHP=40;e.useLaser(s);e.useBullet(s);near(s.playerHP,40,'misses do not heal');
 const a=mob(s);s.laserCooldown=0;e.useLaser(s);near(s.playerHP,41.5);e.useLaser(s);near(s.playerHP,41.5);
 a.icyShieldHP=100;s.laserCooldown=0;e.useLaser(s);near(s.playerHP,41.5);a.icyShieldHP=0;
 for(let i=0;i<100;i++)e.damageEnemy(s,a,1,'player',3);near(s.playerHP,44);near(s.rubyHP,40);
 s.gameTick=60;e.damageEnemy(s,a,1,'player',.5);near(s.playerHP,44.5);
 e.damageEnemy(s,a,1,'summon',4);e.damageEnemy(s,a,1,'reflection',4);near(s.playerHP,44.5);
 const bullets=fresh(['sea_chanter']);bullets.playerHP=40;mob(bullets);e.useBullet(bullets);near(bullets.playerHP,40);for(let i=0;i<3;i++)e.tick(bullets);near(bullets.playerHP,40.5);
 const copy=fresh(['sea_chanter','astral_twins']);copy.playerHP=40;copy.rubyTileX=12;copy.rubyTileY=10;mob(copy,13,10);random(.1,()=>e.useLaser(copy));near(copy.playerHP,41.5);
});
test('Diamond grants shields after real heals or incoming hits, respects its shared cooldown and keeps larger shields',()=>{const s=fresh(['frost_warden']);s.playerHP=50;e.healPlayer(s,1);near(s.playerShieldHP,4);e.damagePlayer(s,1);near(s.playerShieldHP,3);s.gameTick=60;e.damagePlayer(s,10);near(s.playerShieldHP,3);for(let i=0;i<30;i++){s.gameTick+=60;e.healPlayer(s,1);}near(s.playerShieldHP,60);s.playerShieldHP=100;s.gameTick+=60;e.healPlayer(s,1);near(s.playerShieldHP,100);s.playerHP=100;s.playerShieldHP=0;s.gameTick+=60;e.healPlayer(s,1);near(s.playerShieldHP,0);});
test('Pearl reflects direct hits, includes shield absorption, caps boss returns and cannot reflect recursively',()=>{const s=fresh(['aegis_sentinel']),a=mob(s),boss=mob(s,12,10,'aegis_sentinel');s.playerShieldHP=100;e.damagePlayer(s,10,a);near(a.hp,990);near(s.playerShieldHP,92);e.damagePlayer(s,100,boss);near(boss.hp,970);s.playerShieldHP=0;const before=s.playerHP;e.damagePlayer(s,3);near(s.playerHP,before-2.4);});
test('Pearl blessing aura coexists with the active Venus Veil aura',()=>{
 const s=fresh(['aegis_sentinel']),ctx=new Proxy({}, {get:(target,key)=>key==='fillColors'?target.fillColors:key==='fill'?()=>{target.fillColors.push(target.fillStyle);}:()=>{},set:(target,key,value)=>{target[key]=value;return true;}});
 ctx.fillColors=[];art.drawBlessingCombatEffects(ctx,s,0,0);assert.ok(ctx.fillColors.includes('#f6e6df')&&ctx.fillColors.includes('#d8a5b4'),'Pearl shell alternates ivory and rose blocks');
 s.venusVeilTicks=60;ctx.fillColors=[];art.drawBlessingCombatEffects(ctx,s,0,0);assert.ok(ctx.fillColors.includes('#f6e6df')&&ctx.fillColors.includes('#d8a5b4'),'Pearl shell remains while Venus Veil is active');
});
test('Amethyst handles manual, energy and teleport boosts; decoys shoot without recursively granting attack bonuses',()=>{const s=fresh(['splitter_queen','sea_chanter','storm_reaper']);s.playerHP=50;e.useSpeedBoost(s);assert.equal(s.build.queenDecoys.length,1);s.gameTick++;e.grantInstantSpeedBoost(s);assert.equal(s.build.queenDecoys.length,2);s.gamePhase='teleporting';s.teleportDestOptions=[1];s.gameTick++;e.doTeleport(s,1);assert.equal(s.build.queenDecoys.length,3);assert.equal(s.build.queenDecoys[2].tileX,10,'teleport echo stays at departure');s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=504;mob(s);fx.updateBlessingEffects(s);assert.ok(s.laserBullets.some(b=>b.blessingDecoy));near(s.playerHP,50);assert.equal(s.build.reaperHaste,undefined);const oldHP=s.playerHP;for(let i=0;i<60;i++)e.tick(s);near(s.playerHP,oldHP);assert.ok(s.laserBullets.length<20);});
test('Amethyst decoy destruction restores the real player target and never damages player/Ruby',()=>{const s=fresh(['splitter_queen']);fx.leaveQueenBlessingDecoy(s);const a=mob(s,10,10);a.attackTimer=0;a.pathTimer=0;s.build.queenDecoys[0].hp=1;s.playerTileX=s.playerTargetX=39;s.playerTileY=s.playerTargetY=39;s.playerX=s.playerY=39.5*48;const position=[s.playerX,s.playerY];e.tick(s);assert.equal(s.build.queenDecoys.length,0);near(s.playerHP,100);near(s.rubyHP,100);assert.deepEqual([s.playerX,s.playerY],position);assert.equal(s.enemyDecoyActive,false);assert.equal(s.build.queenTargetId,undefined);});
test('Peridot follows walking with wider floor-only fields; overlaps do not stack damage or slow',()=>{const s=fresh(['thorn_weaver']);fx.updateBlessingEffects(s);assert.equal(s.build.zones.length,0);s.playerTileX=11;fx.updateBlessingEffects(s);assert.equal(s.build.zones.length,1);s.playerTileX=12;fx.updateBlessingEffects(s);const a=mob(s,11,11),boss=mob(s,12,11,'fiery_king');s.gameTick=30;fx.updateBlessingEffects(s);near(a.hp,997.5);near(boss.hp,997.5);near(b.buildSlowMultiplier(s,a),.7);near(b.buildSlowMultiplier(s,boss),.85);for(let i=13;i<40;i++){s.playerTileX=i;fx.updateBlessingEffects(s);}assert.ok(s.build.zones.filter(z=>z.kind==='growth').length<=12);});
test('Peridot walking fields are silent until they damage an enemy',()=>{
 const ui=require('../game/ui-sfx.ts'),original=ui.playUiSfx,cues=[];ui.playUiSfx=cue=>cues.push(cue);
 try{
  const s=fresh(['thorn_weaver']);fx.updateBlessingEffects(s);s.gameTick=1;s.playerTileX=11;fx.updateBlessingEffects(s);
  assert.equal(s.build.zones.length,1);assert.deepEqual(cues,[]);
  s.playerTileX=12;fx.updateBlessingEffects(s);s.playerTileX=11;fx.updateBlessingEffects(s);assert.deepEqual(cues,[],'creating and refreshing fields stay silent');
  mob(s,11,10);mob(s,12,10);s.gameTick=30;fx.updateBlessingEffects(s);assert.deepEqual(cues,['gemFieldHit'],'overlapping fields and multiple enemies share one hit cue');
 }finally{ui.playUiSfx=original;}
});
test('Obsidian has a 50% kill chance, bounded larger wells, non-stacking damage/slow and floor-safe pulls',()=>{
 const s=fresh(['devourer']),a=mob(s);random(.5,()=>fx.blessingDeath(s,a));assert.equal(s.build.zones.length,0);random(.499,()=>{for(let i=0;i<30;i++)fx.blessingDeath(s,a);});assert.equal(s.build.zones.length,4);assert.ok(s.build.zones.every(z=>z.radius===4&&z.ticks===240));
 const target=mob(s,14,10),boss=mob(s,13,11,'fiery_king');s.gameTick=29;e.tick(s);assert.equal(target.tileX,13,'overlapping wells pull only one tile per pulse');assert.equal(boss.tileX,13);near(target.hp,997);near(boss.hp,998.5);near(b.buildSlowMultiplier(s,target),.75);near(b.buildSlowMultiplier(s,boss),.85);
 s.build.zones.forEach(z=>z.ticks=1);s.gameTick=59;const before=target.hp;e.tick(s);near(target.hp,before);assert.equal(s.build.zones.length,0);
});
test('Amber accelerates earned energy, refreshes once on the transition to full and leaves F inventory alone',()=>{const s=fresh(['blind_prayer']);fx.addStarEnergy(s,20);near(s.starEnergy,27);s.starEnergy=99;s.laserCooldown=s.waveCooldown=s.bulletCooldown=s.speedCooldown=s.bombCooldown=s.rubyHealCooldown=100;s.specialSkill='fiery_king';fx.addStarEnergy(s,1);assert.equal(s.waveCooldown,0);assert.equal(s.specialSkill,'fiery_king');s.waveCooldown=100;fx.addStarEnergy(s,1);assert.equal(s.waveCooldown,100);s.starEnergy=0;fx.addStarEnergy(s,20,false);near(s.starEnergy,20);});
test('Opal rolls once per original cast and copies from Ruby with bounded damage and no recursive copies',()=>{const s=fresh(['astral_twins']);s.rubyTileX=12;s.rubyTileY=10;const a=mob(s,13,10);random(.1,()=>e.useLaser(s));near(1000-a.hp,c.LASER_DMG*2);assert.ok(s.laserBeams.some(beam=>beam.fromX===12.5*48));s.laserCooldown=0;const hp=a.hp;random(.9,()=>e.useLaser(s));near(hp-a.hp,c.LASER_DMG);const clean=fresh(['astral_twins']);clean.rubyTileX=12;clean.rubyTileY=10;random(.1,()=>e.useBullet(clean));assert.equal(clean.laserBullets.length,2);assert.equal(clean.laserBullets[1].damageScale,1);});

test('Sapphire status star appears only after an actual healing hit and pauses with combat',()=>{
 const s=fresh(['sea_chanter']);e.useLaser(s);assert.equal(s.build.sapphireRegenUntil,undefined);mob(s);s.playerHP=60;s.laserCooldown=0;e.useLaser(s);assert.equal(s.build.sapphireRegenUntil,24);const tick=s.gameTick;s.gamePhase='teleporting';e.tick(s);assert.equal(s.gameTick,tick);s.gamePhase='playing';s.gameTick=60;s.playerHP=100;s.laserCooldown=0;e.useLaser(s);assert.equal(s.build.sapphireRegenUntil,24,'full health does not renew the healing indicator');
});
test('Sapphire marks enemies only when direct player attacks damage their HP',()=>{
 const s=fresh(['sea_chanter']),a=mob(s);e.damageEnemy(s,a,1,'player');assert.equal(s.sapphireHitEffects[0].untilTick,72);
 s.gameTick=5;e.damageEnemy(s,a,1,'special');assert.equal(s.sapphireHitEffects.length,1);assert.equal(s.sapphireHitEffects[0].untilTick,77,'a later direct hit refreshes the corners');
 e.damageEnemy(s,a,1,'summon');e.damageEnemy(s,a,1,'reflection');assert.equal(s.sapphireHitEffects[0].untilTick,77,'copies and reflections do not trigger the cue');
 const shielded=mob(s,12,10);shielded.icyShieldHP=20;e.damageEnemy(s,shielded,1,'player');assert.equal(s.sapphireHitEffects.length,1,'shield-only hits do not trigger the cue');
 const fatal=mob(s,14,10);fatal.hp=1;e.damageEnemy(s,fatal,1,'player');const fatalEffect=s.sapphireHitEffects.find(effect=>effect.enemyId===fatal.id);
 assert.equal(fatalEffect,undefined,'a lethal hit leaves no frame behind');e.damageEnemy(s,a,1000,'enemy');assert.equal(s.sapphireHitEffects.some(effect=>effect.enemyId===a.id),false,'death from another source also clears an existing frame');s.enemies=s.enemies.filter(enemy=>enemy.id!==fatal.id);
 const expiring=fresh(['sea_chanter']),target=mob(expiring);e.damageEnemy(expiring,target,1,'player');expiring.gameTick=71;e.tick(expiring);assert.equal(expiring.sapphireHitEffects.length,0,'the effect is removed after its display time');
 const unblessed=fresh([]),plain=mob(unblessed);e.damageEnemy(unblessed,plain,1,'player');assert.equal(unblessed.sapphireHitEffects.length,0);
});
test('Sapphire hit corners draw visibly and stop at expiry',()=>{
 const calls=[],ctx=new Proxy({}, {get:(_,key)=>key==='fillRect'?(...args)=>calls.push(args):()=>{},set:()=>true});
 art.drawSapphireHitCorners(ctx,100,100,24,10,55);assert.equal(calls.length,16,'four bright cyan corner brackets get a pale highlight');
 assert.ok(calls.some(([x,y,w,h])=>x<=66||x>134||y<=66||y>134),'the frame extends clearly beyond the enemy');
 calls.length=0;art.drawSapphireHitCorners(ctx,100,100,24,55,55);assert.equal(calls.length,0,'expired hit cues are not drawn');
});
test('gem reveal chime plays once for acquisition or debug activation, never removal or rejected selection',()=>{
 const ui=require('../game/ui-sfx.ts'),original=ui.playUiSfx,cues=[];ui.playUiSfx=kind=>cues.push(kind);
 try{const s=fresh([]);s.gamePhase='blessing';s.build.blessingChoices=['fiery_king'];assert.equal(b.chooseCelestialBlessing(s,'fiery_king'),true);assert.equal(b.chooseCelestialBlessing(s,'fiery_king'),false);assert.deepEqual(cues,['gemBlessing']);
 b.openGodBlessings(s);b.chooseCelestialBlessing(s,'fiery_king');assert.equal(cues.length,1);b.chooseCelestialBlessing(s,'fiery_king');assert.deepEqual(cues,['gemBlessing','gemBlessing']);assert.equal(s.build.blessingReveal.ticks,72);
 }finally{ui.playUiSfx=original;}
});

test('Emerald full-stack attack cue requires ten live stacks and ends when one expires',()=>{const s=fresh(['storm_reaper']);s.build.reaperHaste=Array(9).fill(100);assert.equal(fx.emeraldBlessingFull(s),false);s.build.reaperHaste.push(1);assert.equal(fx.emeraldBlessingFull(s),true);s.gameTick=1;assert.equal(fx.emeraldBlessingFull(s),false);s.build.blessings=[];s.build.reaperHaste=Array(10).fill(100);assert.equal(fx.emeraldBlessingFull(s),false);});

test('attack tints prioritize Opal copies, full Emerald, active Ruby, then unpowered Amber',()=>{
 const s=fresh(['fiery_king','storm_reaper','blind_prayer']);s.build.sunUntouchedTicks=480;s.build.reaperHaste=Array(10).fill(100);assert.equal(fx.playerAttackTint(s),'emerald');assert.equal(fx.playerAttackTint(s,true),'opal');s.gameTick=100;assert.equal(fx.playerAttackTint(s),'solar');s.build.sunUntouchedTicks=0;assert.equal(fx.playerAttackTint(s),'amber');assert.equal(fx.playerAttackTint(s,false,true),undefined);assert.equal(fx.playerAttackTint(s,true,true),'opal');s.build.blessings=['fiery_king','storm_reaper'];assert.equal(fx.playerAttackTint(s),undefined);
});
test('powered Amber bomb blasts keep their special-attack palette',()=>{
 const s=fresh(['blind_prayer']);s.starEnergy=100;e.useBomb(s);assert.equal(s.bomb.powered,true);e.useBomb(s);assert.ok(s.bombBlasts.length>0);assert.ok(s.bombBlasts.every(blast=>blast.powered));
});
test('Opal marks only coordinated Laser, Wave, bullet and bomb copies for their own palette',()=>{
 const s=fresh(['astral_twins']);random(.1,()=>e.useLaser(s));assert.ok(s.laserBeams.some(v=>v.opal));assert.ok(s.laserBeams.some(v=>!v.opal));random(.1,()=>e.activateWave(s));assert.ok(s.waveEffects.some(v=>v.opal));assert.ok(s.waveEffects.some(v=>!v.opal));random(.1,()=>e.useBullet(s));assert.ok(s.laserBullets.some(v=>v.blessingCopy));assert.ok(s.laserBullets.some(v=>!v.blessingCopy));random(.1,()=>{e.useBomb(s);e.useBomb(s);});assert.ok(s.bombBlasts.some(v=>v.opal));assert.ok(s.bombBlasts.some(v=>!v.opal));
});
test('Diamond status star requires a real shield increase and does not renew at the cap',()=>{
 const s=fresh(['frost_warden']);s.playerHP=50;e.healPlayer(s,1);assert.equal(s.build.diamondShieldUntil,30);s.gameTick=60;s.playerShieldHP=60;e.healPlayer(s,1);assert.equal(s.build.diamondShieldUntil,30);
});
test('Amber shows energy gains and a longer full-energy refresh cue without repeating at full',()=>{
 const s=fresh(['blind_prayer']);fx.addStarEnergy(s,10);assert.equal(s.build.amberRefreshUntil,36);s.gameTick=10;s.starEnergy=99;fx.addStarEnergy(s,1);assert.equal(s.build.amberRefreshUntil,58);s.gameTick=20;fx.addStarEnergy(s,1);assert.equal(s.build.amberRefreshUntil,58);
});
test('Pearl can reflect and show its cue under debug invincibility without resetting Ruby',()=>{
 const s=fresh(['aegis_sentinel','fiery_king']),a=mob(s);s.godMode=true;s.build.sunUntouchedTicks=480;e.damagePlayer(s,10,a);near(s.playerHP,100);near(a.hp,990);assert.equal(s.build.sunUntouchedTicks,480);assert.equal(s.build.pearlReflectUntil,42);assert.equal(s.build.pearlReflectTarget.x,a.x);
});

test('Sapphire hit effects initialize for an already-running state created before the feature',()=>{const s=fresh(['sea_chanter']),a=mob(s);delete s.sapphireHitEffects;e.damageEnemy(s,a,1,'player');assert.equal(s.sapphireHitEffects.length,1);delete s.sapphireHitEffects;assert.doesNotThrow(()=>e.tick(s));assert.deepEqual(s.sapphireHitEffects,[]);});

test('Amethyst fires twice as often at half damage without banking shots while idle',()=>{
 const s=fresh(['splitter_queen']);mob(s);fx.leaveQueenBlessingDecoy(s);const fired=[];
 for(let tick=0;tick<90;tick++){s.gameTick=tick;const before=s.laserBullets.length;fx.updateBlessingEffects(s);if(s.laserBullets.length>before)fired.push(tick);}
 assert.deepEqual(fired,[0,23,45,68]);assert.equal(s.laserBullets.length,4);near(s.laserBullets.reduce((sum,bullet)=>sum+bullet.blessingDamage,0),2*.55*e.skillAlienScale(s));
 const idle=fresh(['splitter_queen']);fx.leaveQueenBlessingDecoy(idle);idle.gameTick=1000;mob(idle);fx.updateBlessingEffects(idle);assert.equal(idle.laserBullets.length,1);idle.gameTick++;fx.updateBlessingEffects(idle);assert.equal(idle.laserBullets.length,1,'idle time never creates a catch-up burst');
});

test('Diamond shield scales with mitigated incoming damage before absorption and respects bounds',()=>{
 for(const [damage,grant]of [[1,2],[10,3],[20,6],[40,12],[60,12]]){const s=fresh(['frost_warden']);e.damagePlayer(s,damage);near(s.playerShieldHP,grant);}
 const shielded=fresh(['frost_warden']);shielded.playerShieldHP=30;e.damagePlayer(shielded,20);near(shielded.playerShieldHP,16);near(shielded.playerHP,100);
 const guarded=fresh(['frost_warden']);guarded.constellations.push('playerGuard');e.damagePlayer(guarded,20);near(guarded.playerShieldHP,5.1);
 const fatal=fresh(['frost_warden']);fatal.playerHP=1;e.damagePlayer(fatal,10);near(fatal.playerShieldHP,0);
});

test('Sapphire weakens directly hit enemies by ten percent for three seconds without stacking',()=>{
 const s=fresh(['sea_chanter']),a=mob(s);e.damageEnemy(s,a,1,'player');assert.equal(a.sapphireWeakenUntil,180);
 e.damagePlayer(s,10,a);near(s.playerHP,91);e.damageRuby(s,10,a);near(s.rubyHP,91);
 s.gameTick=100;e.damageEnemy(s,a,1,'player');assert.equal(a.sapphireWeakenUntil,280);e.damagePlayer(s,10,a);near(s.playerHP,82);
 s.gameTick=280;e.damagePlayer(s,10,a);near(s.playerHP,72);
 const other=mob(s,13,10);e.damageEnemy(s,other,1,'summon');assert.equal(other.sapphireWeakenUntil,undefined);e.damageEnemy(s,other,1,'special');assert.equal(other.sapphireWeakenUntil,undefined,'passive fields do not weaken');
 other.icyShieldHP=10;e.damageEnemy(s,other,1,'player');assert.equal(other.sapphireWeakenUntil,undefined,'shield-only hits do not weaken');
 e.damagePlayer(s,10);near(s.playerHP,62,'ownerless damage is unchanged');
});

test('Amber adds one powered second on top of Phoenix and Shooting Star without extending each attack',()=>{
 for(const phoenix of [false,true])for(const shootingStar of [false,true]){
  const s=fresh(['blind_prayer']);if(phoenix)s.constellations.push('power');s.stellarPowerBonusTicks=shootingStar?120:0;s.starEnergy=100;e.useBullet(s);
  const expected=180+(phoenix?60:0)+(shootingStar?120:0);assert.equal(s.poweredTicks,expected);assert.equal(s.stellarPowerBonusTicks,0);e.useLaser(s);assert.equal(s.poweredTicks,expected);
 }
 const surge=fresh(['blind_prayer']);surge.constellations.push('power');surge.specialSkill='blind_prayer';e.useSpecialSkill(surge);assert.equal(surge.poweredTicks,c.SPECIAL_PRAYER_DURATION+120);
});

test('Pearl reduces player damage but calculates reflection before its own reduction',()=>{
 const s=fresh(['aegis_sentinel']),a=mob(s);e.damagePlayer(s,20,a);near(s.playerHP,84);near(a.hp,980);
 s.constellations.push('playerGuard');e.damagePlayer(s,20,a);near(s.playerHP,70.4);near(a.hp,963);
 s.playerShieldHP=50;e.damagePlayer(s,20,a);near(s.playerShieldHP,36.4);near(a.hp,946);
 e.damagePlayer(s,20);near(s.playerShieldHP,22.8);near(a.hp,946,'hazards are reduced without reflecting');
 const veil=fresh(['aegis_sentinel']),boss=mob(veil,11,10,'fiery_king');veil.venusVeilTicks=60;e.damagePlayer(veil,100,boss);near(veil.playerHP,72);near(boss.hp,970,'Venus reflection does not duplicate');
});

test('Obsidian boss pressure needs ten direct hits in three seconds and shares a six-second cooldown',()=>{
 const s=fresh(['devourer']),boss=mob(s,12,10,'fiery_king');
 const hit=()=>e.damageEnemy(s,boss,.01,'player',.5);
 for(let i=0;i<9;i++){s.gameTick=i*10;hit();}assert.equal(s.build.zones.length,0);s.gameTick=90;hit();assert.equal(s.build.zones.length,1);assert.equal(s.build.obsidianBossReadyAt,450);assert.equal(s.build.zones[0].x,(boss.tileX+.5)*c.TILE_SIZE);
 for(let i=0;i<30;i++){s.gameTick++;hit();}assert.equal(s.build.zones.length,1);assert.equal(s.build.obsidianBossHits.length,0,'hits during cooldown do not bank');
 s.gameTick=450;for(let i=0;i<10;i++)hit();assert.equal(s.build.zones.length,2);
 const expired=fresh(['devourer']),b2=mob(expired,12,10,'fiery_king');for(let i=0;i<9;i++)e.damageEnemy(expired,b2,.01,'player',.5);expired.gameTick=180;e.damageEnemy(expired,b2,.01,'player',.5);assert.equal(expired.build.zones.length,0);assert.equal(expired.build.obsidianBossHits.length,1);
 const excluded=fresh(['devourer']),b3=mob(excluded,12,10,'fiery_king');for(let i=0;i<20;i++){e.damageEnemy(excluded,b3,.01,'summon');e.damageEnemy(excluded,b3,.01,'special');e.damageEnemy(excluded,b3,.01,'player',0);}assert.equal(excluded.build.zones.length,0);
});
test('Opal full-damage copies keep their own origin and never add Sapphire healing or Obsidian hits',()=>{
 const s=fresh(['astral_twins','sea_chanter','devourer']);s.playerHP=50;s.rubyTileX=12;s.rubyTileY=10;mob(s,13,10,'fiery_king');random(.449,()=>e.useLaser(s));near(s.playerHP,51.5);assert.equal(s.build.obsidianBossHits.length,1);assert.ok(s.laserBeams.some(beam=>beam.opal&&beam.fromX===12.5*c.TILE_SIZE));
 const noCopy=fresh(['astral_twins']);random(.45,()=>e.useBullet(noCopy));assert.equal(noCopy.laserBullets.length,1);
 const decoy=fresh(['splitter_queen']);fx.leaveQueenBlessingDecoy(decoy);assert.equal(decoy.build.queenDecoys[0].hp,18);
});
