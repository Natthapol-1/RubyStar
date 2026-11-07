const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),events=require('../game/events.ts');
function position(a,x,y){a.tileX=a.targetTileX=x;a.tileY=a.targetTileY=y;a.x=(x+.5)*48;a.y=(y+.5)*48;a.path=[];a.pathTimer=100000;a.stepProgress=0;}
function player(s,x,y){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*48;s.playerY=(y+.5)*48;s.playerStepProgress=0;}
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=s.godMode=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;return s;}
function boss(s,type){e.godSpawnBoss(s,type);s.noBossSpawns=true;const a=s.enemies.find(a=>a.type===type);position(a,11,10);a.windupTicks=100000;return a;}
function ticks(s,n){for(let i=0;i<n;i++)e.tick(s);}

test('Solar kills give no energy (including the Charger bonus and Leech refunds), no killing buff and no kill heal; other specials still do',()=>{
 const s=fresh(),template=boss(s,'frost_warden');s.enemies=[];
 for(let i=0;i<24;i++)s.enemies.push({...template,id:i+100,type:i===0?'charger':i===1?'energy_leech':i===2?'healer':i===3?'bleeder':i===4?'armored':'normal',hp:1,maxHp:10,stolenEnergy:60});
 s.starEnergy=17;s.playerHP=20;s.specialSkill='fiery_king';e.useSpecialSkill(s);
 assert.equal(s.enemies.length,0);assert.equal(s.starEnergy,17);assert.equal(s.killScore>0,true);assert.equal(s.playerHP,20,'no kill heal or Healer heal');assert.equal(s.regenUntil??0,0,'no Bleeder regen');assert.equal(s.playerShieldHP??0,0,'no Armored shield');
 const a={...template,type:'normal',hp:1,maxHp:10};s.enemies=[a];s.specialSkill='storm_reaper';s.specialLockTicks=0;e.useSpecialSkill(s);assert.equal(s.starEnergy,17+c.STAR_ENERGY_PER_KILL);
});

test('Solar boss defeat still fully restores player, Ruby and energy, with normal boss rewards',()=>{
 const s=fresh(),a=boss(s,'fiery_king');a.hp=1;s.bossesKilled=9;s.playerHP=20;s.rubyHP=30;s.starEnergy=0;s.specialSkill='fiery_king';
 e.useSpecialSkill(s);assert.equal(s.bossesKilled,10);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);assert.equal(s.starEnergy,100);assert.equal(s.specialSkill,'fiery_king');
});

test('Singularity blocks Queen/Frost teleport and side effects until leaving or field expiry',()=>{
 for(const kind of ['splitter_queen','frost_warden'])for(const escape of ['leave','expire']){
  const s=fresh(),a=boss(s,kind);a.phaseTimer=1;s.specialSkill='devourer';e.useSpecialSkill(s);const original=[a.tileX,a.tileY];
  ticks(s,3);assert.deepEqual([a.tileX,a.tileY],original);assert.equal(s.enemies.length,1);
  if(escape==='leave')position(a,18,10);else s.singularity.ticks=1;
  e.tick(s);assert.notEqual(c.chamberOfTile(a.tileX,a.tileY),0);if(kind==='splitter_queen')assert.ok(s.enemies.some(a=>a.type==='queen_echo'));
 }
});

test('Shooting Star grants four-second next power, combines with Phoenix, and Sirius consumes its bonus',()=>{
 for(const phoenix of [false,true]){
  const s=fresh();if(phoenix)s.constellations=['power'];e.triggerAmbientEvent(s,'shootingStar');for(let i=0;i<180;i++)events.updateAmbientEvents(s);
  const active=s.ambientEvents.active;active.age=36;player(s,active.points[0].x,active.points[0].y);e.tick(s);
  assert.equal(s.starEnergy,100);assert.equal(s.stellarPowerBonusTicks,120);e.useLaser(s);assert.equal(s.poweredTicks,phoenix?300:240);assert.equal(s.stellarPowerBonusTicks,0);
 }
 const s=fresh();s.starEnergy=100;s.stellarPowerBonusTicks=120;s.specialSkill='blind_prayer';e.useSpecialSkill(s);assert.equal(s.poweredTicks,360);assert.equal(s.stellarPowerBonusTicks,0);
});

test('God Constellation screen freezes play and toggles every upgrade without progression or duplicates',()=>{
 const s=fresh();assert.equal(e.openGodConstellations(s),true);assert.equal(s.constellationChoices.length,Object.keys(e.CONSTELLATIONS).length);assert.equal(s.gamePhase,'constellation');
 const before=s.gameTick;ticks(s,60);assert.equal(s.gameTick,before);
 for(const kind of Object.keys(e.CONSTELLATIONS)){assert.equal(e.chooseConstellation(s,kind),true);assert.ok(s.constellations.includes(kind));}
 assert.equal(new Set(s.constellations).size,Object.keys(e.CONSTELLATIONS).length);assert.equal(s.bossesKilled,0);assert.equal(e.chooseConstellation(s,'invalid'),false);
 for(const kind of Object.keys(e.CONSTELLATIONS))e.chooseConstellation(s,kind);assert.deepEqual(s.constellations,[]);
 assert.equal(e.closeGodConstellations(s),true);assert.equal(s.gamePhase,'playing');assert.deepEqual(s.constellationChoices,[]);assert.equal(s.godConstellationMode,false);
 s.gamePhase='lost';assert.equal(e.openGodConstellations(s),false);assert.equal(e.createInitialState().godConstellationMode,false);
});


test('Solar bomber cascades give no energy even when they finish an earlier surviving target',()=>{
 const s=fresh(),template=boss(s,'frost_warden');
 const armor={...template,id:100,type:'armored',hp:40,maxHp:40},bomber={...template,id:101,type:'bomber',hp:1,maxHp:10};position(armor,11,10);position(bomber,11,11);
 s.enemies=[armor,bomber];s.starEnergy=0;s.specialSkill='fiery_king';e.useSpecialSkill(s);assert.equal(s.enemies.length,0);assert.equal(s.starEnergy,0);
});

test('Solar Flare damage to aliens grows exactly like their HP at every stage',()=>{
 for(const [kills,tier] of [[0,0],[10,7],[18,7],[25,7]]){
  const s=fresh(),template=boss(s,'frost_warden');s.enemies=[];
  s.bossesKilled=kills;s.difficultyLevel=tier;
  const alien={...template,id:500,type:'armored',hp:10000,maxHp:10000};s.enemies.push(alien);
  s.specialSkill='fiery_king';e.useSpecialSkill(s);
  const mult=1+Math.min(6,Math.floor(kills/3))*c.ALIEN_HP_PER_MILESTONE+Math.max(0,kills-18)*e.LATE_ALIEN_HP_PER_STAGE;
  const expected=c.SPECIAL_SKILLS.fiery_king.normalDamage*c.DIFFICULTY_TIERS[tier].hpMult*mult;
  assert.ok(Math.abs(10000-alien.hp-expected)<1e-6,'stage '+kills+': '+(10000-alien.hp)+' vs '+expected);
 }
});

test("Singularity and Gaia's Roots damage to aliens grows with the stage like their HP",()=>{
 for(const [kills,tier] of [[0,0],[25,7]]){
  const s=fresh();s.bossesKilled=kills;s.difficultyLevel=tier;
  assert.ok(Math.abs(e.skillAlienScale(s)-c.DIFFICULTY_TIERS[tier].hpMult*e.constellationAlienHPMult(s))<1e-9,'matches alien HP growth');
 }
 assert.equal(e.skillAlienScale(Object.assign(fresh(),{bossesKilled:0,difficultyLevel:0})),1,'unchanged at the start');
});

test("Neptune's Tide and Saturn Guard grow by 1 per stage to stage 18, then keep pace with late enemy damage",()=>{
 const near=(x,y)=>assert.ok(Math.abs(x-y)<.051,`${x} != ${y}`);
 for(const [kills,bonus] of [[0,0],[10,10],[18,18],[30,18],[40,18]]){
  const mult=c.lateEnemyDamageMult(kills),heal=Math.min(100,(c.SPECIAL_CHANTER_HEAL+bonus)*mult),shield=Math.min(100,(c.SPECIAL_WARDEN_SHIELD+bonus)*mult);
  const s=fresh();s.bossesKilled=kills;s.godMode=false;s.playerHP=1;s.rubyHP=1;s.specialSkill='sea_chanter';e.useSpecialSkill(s);
  near(s.playerHP,Math.min(100,1+heal));near(s.rubyHP,Math.min(100,1+heal));
  const t=fresh();t.bossesKilled=kills;t.playerShieldHP=t.rubyShieldHP=0;t.specialSkill='frost_warden';e.useSpecialSkill(t);
  near(t.playerShieldHP,shield);near(t.rubyShieldHP,shield);
 }
});

test('Jupiter Storm damage to aliens grows like their HP at every stage; bosses take 25%',()=>{
 for(const [kills,tier] of [[0,0],[10,7],[25,7]]){
  const s=fresh(),template=boss(s,'frost_warden');s.enemies=[];s.bossesKilled=kills;s.difficultyLevel=tier;
  const alien={...template,id:600,type:'armored',hp:10000,maxHp:10000};position(alien,s.playerTileX+1,s.playerTileY);s.enemies.push(alien);
  s.specialSkill='storm_reaper';e.useSpecialSkill(s);
  const expected=60*c.DIFFICULTY_TIERS[tier].hpMult*e.constellationAlienHPMult(s);
  assert.ok(Math.abs(10000-alien.hp-expected)<1e-6,'stage '+kills+': '+(10000-alien.hp)+' vs '+expected);
 }
});

test('Jupiter Storm halves movement for exactly 60 gameplay ticks, only on enemies hit',()=>{
 const s=fresh(),a=e.createEncounterEnemy(s,'normal',14,10,1000),outside=e.createEncounterEnemy(s,'normal',39,39,1000);
 s.enemies=[a,outside];a.targetTileX=15;a.pathTimer=100000;s.specialSkill='storm_reaper';
 assert.equal(e.useSpecialSkill(s),true);const end=a.stormSlowUntilTick;
 assert.equal(end,s.gameTick+60);assert.equal(outside.stormSlowUntilTick,undefined);
 const before=a.stepProgress;e.tick(s);assert.ok(Math.abs(a.stepProgress-before-c.ENEMY_CONFIGS.normal.speed*.5*c.MOVE_SPEED_MULT)<1e-9);
 for(let t=1;t<=60;t++){s.gameTick=t;assert.equal(e.stormSlowMultiplier(s,a),.5);}
 s.gameTick=61;assert.equal(e.stormSlowMultiplier(s,a),1);
});

test('Jupiter Storm slow refreshes and remains paused in menus',()=>{
 const s=fresh(),a=e.createEncounterEnemy(s,'normal',11,10,1000);s.enemies=[a];s.specialSkill='storm_reaper';e.useSpecialSkill(s);
 s.gameTick=30;s.specialSkill='storm_reaper';s.specialLockTicks=0;e.useSpecialSkill(s);assert.equal(a.stormSlowUntilTick,90);
 s.gamePhase='teleporting';ticks(s,120);assert.equal(s.gameTick,30);assert.equal(e.stormSlowMultiplier(s,a),.5);
});
