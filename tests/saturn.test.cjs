const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const saturnTest={updateEnemies,updatePlayer,updateMeteorite};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),a=require('../game/saturn.ts'),{SATURN:S}=a;
const near=(mob,x,y)=>Object.assign(mob,{tileX:x,targetTileX:x,tileY:y,targetTileY:y,x:(x+.5)*48,y:(y+.5)*48,stepProgress:0,path:[]});
const player=(s,x,y)=>Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*48,playerY:(y+.5)*48,playerStepProgress:0,playerDirX:1,playerDirY:0});
function fresh(){
  const s=e.createModeState('trial','frost_warden');e.godSpawnBoss(s,'frost_warden');s.noMobs=true;s.meteoriteTimer=1e6;
  const t=s.saturn;t.iceTimer=1e6;t.recallTimer=1e6;t.grantTimer=1e6;t.pulse=-1e6;
  const boss=a.saturnBoss(s);near(boss,39,39);boss.phaseTimer=1e6;player(s,10,10);s.rubyTileX=11;s.rubyTileY=10;s.frostIceTiles=[];
  return{s,t,boss};
}
const alien=(s,type,x,y,hp=100)=>{const m=e.createEncounterEnemy(s,type,x,y,hp);s.enemies.push(m);return m;};
const close=(x,y,m)=>assert.ok(Math.abs(x-y)<1e-6,`${m??''} ${x} vs ${y}`);

test('from phase 2 grants sometimes mark four targets with exactly one stable reversed one; phase 1 never does',()=>{
  const random=Math.random;
  try{
    for(const phase of [1,2,3]){
      const{s,t}=fresh();for(let i=0;i<5;i++)alien(s,'normal',20+i,20);
      Math.random=()=>0;a.godSetSaturnPhase(s,phase);t.iceTimer=t.recallTimer=1e6;t.pulse=-1e6;
      assert.equal(t.grantTargets.length,phase>=S.reverseGrantFromPhase?4:3);
      assert.equal(t.reverseGrantId!==undefined,phase>=S.reverseGrantFromPhase);
      if(phase===3){
        const id=t.reverseGrantId;Math.random=()=>.99;a.updateSaturn(s);assert.equal(t.reverseGrantId,id,'warning does not reroll');
        t.grantTimer=1;a.updateSaturn(s);assert.equal(t.grantTargets.length,3);assert.equal(t.reverseGrantId,undefined,'normal cycle remains possible');
      }
    }
  }finally{Math.random=random;}
});

test('reversed cycle fills its fourth slot as aliens arrive, and its cue pauses with gameplay',()=>{
  const{s,t}=fresh(),random=Math.random;
  try{
    Math.random=()=>0;a.godSetSaturnPhase(s,3);t.iceTimer=t.recallTimer=1e6;t.pulse=-1e6;
    for(let i=0;i<3;i++)alien(s,'normal',20+i,20);
    a.updateSaturn(s);assert.equal(t.grantTargets.length,3);assert.equal(t.reverseGrantId,undefined);
    alien(s,'normal',23,20);a.updateSaturn(s);assert.equal(t.grantTargets.length,4);assert.ok(t.grantTargets.includes(t.reverseGrantId));
    const before=JSON.stringify(t);s.gamePhase='paused';a.updateSaturn(s);assert.equal(JSON.stringify(t),before);
  }finally{Math.random=random;}
});

test('reversed grants give shield only when blocked, including double grants to Hulks, without a counter reward',()=>{
  for(const blocked of [false,true])for(const type of ['frostbiter','glacier_hulk']){
    const{s,t,boss}=fresh();t.phase=3;boss.hp=S.phaseHP;
    const mob=alien(s,type,13,10);t.grantTargets=[mob.id];t.reverseGrantId=mob.id;t.reverseGrantCycle=false;
    if(blocked)t.field={x:s.playerX,y:s.playerY,ticks:30};
    const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);
    assert.equal(mob.icyShieldHP,blocked?S.grantAmount*(type==='glacier_hulk'?2:1):0);
    assert.equal(boss.hp,hp);assert.equal(s.playerShieldHP,0);assert.equal(t.playerIce,0);
    assert.equal(t.beams[0].kind,'reverseGrant');assert.ok(t.temporaryIce.length,'the fired line still freezes its path');
  }
});

test('mixed normal and reversed grants preserve the reversed shield after the normal counter strips the field',()=>{
  const{s,t,boss}=fresh();t.phase=3;boss.hp=S.phaseHP;
  const normal=alien(s,'frostbiter',12,10),reverse=alien(s,'frostbiter',13,10);
  normal.icyShieldHP=20;reverse.icyShieldHP=20;
  t.grantTargets=[normal.id,reverse.id];t.reverseGrantId=reverse.id;t.reverseGrantCycle=false;
  t.field={x:s.playerX,y:s.playerY,ticks:30};const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);
  assert.equal(normal.icyShieldHP,0);assert.equal(reverse.icyShieldHP,S.grantAmount);
  close(hp-boss.hp,S.grantAmount*S.counterGrantShare+S.counterGrantBonus);
  close(s.playerShieldHP,S.grantAmount*S.fieldShieldShare);
});

test('a dead reversed target grants no shield to the player and causes no grant damage to the boss',()=>{
  const{s,t,boss}=fresh();t.phase=3;boss.hp=S.phaseHP;
  const mob=alien(s,'glacier_hulk',13,10);t.grantTargets=[mob.id];t.grantHulks=[mob.id];t.reverseGrantId=mob.id;t.reverseGrantCycle=false;
  s.enemies=s.enemies.filter(x=>x!==mob);const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);
  assert.equal(boss.hp,hp);assert.equal(s.playerShieldHP,0);assert.equal(t.playerIce,0);
});

test('grant counter damage never hits the reversed target, even when it has less HP than the counter damage',()=>{
  for(const hp of [1,4,100]){
    const{s,t,boss}=fresh();t.phase=3;boss.hp=S.phaseHP;
    const normal=alien(s,'frostbiter',12,10),reverse=alien(s,'frostbiter',13,10,hp);
    t.grantTargets=[normal.id,reverse.id];t.reverseGrantId=reverse.id;t.reverseGrantCycle=false;
    t.field={x:s.playerX,y:s.playerY,ticks:30};t.grantTimer=1;a.updateSaturn(s);
    assert.ok(s.enemies.includes(reverse));assert.equal(reverse.hp,hp);assert.equal(reverse.icyShieldHP,S.grantAmount);
    assert.equal(normal.hp,100-S.counterDamage,'normal target still takes counter damage');
  }
});

test('No Freeze prevents Saturn floor, fired-line and alien ice freezes without consuming shield',()=>{
  for(const kind of ['floor','line','alien']){
    const{s,t}=fresh();e.godSetNoFreeze(s,true);s.playerShieldHP=80;
    if(kind==='floor')s.frostIceTiles=[[10,10]];
    else t.temporaryIce=[{x:10,y:10,ticks:60,freezeTicks:kind==='line'?24:72}];
    a.freezeSaturnPlayer(s);assert.equal(s.playerFrozenTicks,0);assert.equal(s.playerShieldHP,80);
    e.godSetNoFreeze(s,false);a.freezeSaturnPlayer(s);assert.ok(s.playerFrozenTicks>0);assert.ok(s.playerShieldHP<80);
  }
});

test('an older phase 3 state without reversed-grant fields keeps normal grant behavior',()=>{
  const{s,t,boss}=fresh();t.phase=3;boss.hp=S.phaseHP;
  const mob=alien(s,'frostbiter',20,20);t.grantTargets=[mob.id];delete t.reverseGrantId;delete t.reverseGrantCycle;
  t.grantTimer=1;a.updateSaturn(s);assert.equal(mob.icyShieldHP,S.grantAmount);
});

test('Saturn is a three-phase guardian fight on her own population; F is the ordinary Saturn Guard',()=>{
  const{s,boss}=fresh();assert.equal(boss.hp,S.phaseHP*3);assert.equal(s.playerShieldHP,0);
  s.specialSkill='frost_warden';e.useSpecialSkill(s);const shield=s.playerShieldHP;assert.ok(shield>0);
  s.specialSkill='frost_warden';s.specialLockTicks=0;e.useSpecialSkill(s);assert.ok(s.playerShieldHP>shield&&s.playerShieldHP<=shield*2,'Saturn Guard stacks, up to twice one cast (and the Saturn cap)');
});

test('her body takes only a tenth of direct hits; broken ice comes off her HP',()=>{
  const{s,boss}=fresh();let hp=boss.hp;e.damageEnemy(s,boss,100,'player');close(hp-boss.hp,100*S.directDamage);
  const mob=alien(s,'glacier_hulk',20,20);mob.icyShieldHP=40;hp=boss.hp;e.damageEnemy(s,mob,30,'player');
  close(hp-boss.hp,30*S.shatterShare,'shatter');assert.equal(mob.icyShieldHP,10);
  hp=boss.hp;e.damageEnemy(s,mob,30,'enemy');close(hp-boss.hp,0,'only your attacks shatter for damage');
});

test('targets are marked for the whole cycle and get large shields, a Hulk double',()=>{
  const{s,t,boss}=fresh();const hulk=alien(s,'glacier_hulk',20,20),bite=alien(s,'frostbiter',22,20);
  t.grantTargets=[];t.grantTimer=S.grantInterval;a.updateSaturn(s);
  assert.deepEqual(t.grantTargets,[hulk.id,bite.id],'marked straight away, Hulk first');
  t.grantTimer=1;a.updateSaturn(s);
  assert.equal(hulk.icyShieldHP,S.grantAmount*S.hulkGrantMult);assert.equal(bite.icyShieldHP,S.grantAmount);
  assert.equal(t.grantTimer,S.grantInterval);assert.ok(t.grantTargets.length,'the next targets are marked at once');
  assert.ok(boss.hp===S.phaseHP*3);
});

test('killing a marked target first gives you its shield and tears that much from her',()=>{
  const{s,t,boss}=fresh();const bite=alien(s,'frostbiter',22,20);t.grantTargets=[bite.id];
  e.damageEnemy(s,bite,1e4,'player');e.killEnemy(s,s.enemies.indexOf(bite));
  const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);
  close(s.playerShieldHP,S.grantAmount*S.killShieldShare,'a kill gives a smaller shield');close(t.playerIce,S.grantAmount*S.killShieldShare);close(hp-boss.hp,S.grantAmount*S.absorbShare);
});

test('C stops time: grants landing inside come to you, aliens inside freeze and their attacks are cancelled',()=>{
  const{s,t,boss}=fresh();const near1=alien(s,'frostbiter',13,10),far=alien(s,'frostbiter',30,30);t.grantTargets=[near1.id,far.id];
  near1.frostAct={kind:'pounce',ticks:20,tx:10,ty:10,fromX:near1.x,fromY:near1.y};near1.icyShieldHP=50; // ice it already held
  assert.equal(a.useSaturnIntercept(s),true);assert.equal(a.useSaturnIntercept(s),false,'cooldown');
  assert.equal(near1.frostAct,undefined,'its pounce is cancelled');assert.ok(a.saturnTimeStopped(s,near1));assert.ok(!a.saturnTimeStopped(s,far));
  const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);
  assert.equal(near1.icyShieldHP,0);assert.equal(far.icyShieldHP,S.grantAmount);close(s.playerShieldHP,S.grantAmount*S.fieldShieldShare,'C gives a bigger shield');close(hp-boss.hp,S.grantAmount*S.counterGrantShare+S.counterGrantBonus);
  assert.ok(S.fieldShieldShare>S.killShieldShare);
  for(let i=0;i<S.fieldTicks;i++)a.updateSaturn(s);assert.equal(t.field,null);
});

test('Time Stop releases a frozen player immediately and prevents refreezing inside its field',()=>{
  const{s}=fresh();a.freezeSaturnPlayer(s);assert.ok(s.playerFrozenTicks>0);
  assert.equal(a.useSaturnIntercept(s),true);assert.equal(s.playerFrozenTicks,0);assert.equal(s.playerStunned,false);
  s.saturn.temporaryIce=[{x:10,y:10,ticks:100}];a.updateSaturn(s);assert.equal(s.playerFrozenTicks,0);
});

test('a blocked Time Stop cast does not release a freeze',()=>{
  for(const paused of [false,true]){
    const{s,t}=fresh();a.freezeSaturnPlayer(s);const ticks=s.playerFrozenTicks;
    if(paused)s.gamePhase='paused';else t.cooldown=1;
    assert.equal(a.useSaturnIntercept(s),false);assert.equal(s.playerFrozenTicks,ticks);assert.equal(t.field,null);
  }
});

test('the field reaches 7 tiles, and frozen tiles cannot freeze you inside it',()=>{
  assert.equal(S.fieldRadius,7);
  const{s,t}=fresh();a.useSaturnIntercept(s);s.frostIceTiles=[[10,10]];a.updateSaturn(s);assert.equal(s.playerFrozenTicks,0);
  t.field=null;a.updateSaturn(s);assert.ok(s.playerFrozenTicks>0);
});

test('mortar shells landing in the field fizzle',()=>{
  const{s,t}=fresh();t.shells=[{x:11,y:10,ticks:30},{x:30,y:30,ticks:30}];a.useSaturnIntercept(s);
  assert.deepEqual(t.shells.map(sh=>[sh.x,sh.y]),[[30,30]]);
});

test('recall pulls ice back to heal her, spares ice inside the field, and backlashes when nothing is left',()=>{
  const{s,t,boss}=fresh();boss.hp=S.phaseHP*2.5;
  const out=alien(s,'frostbiter',30,30),kept=alien(s,'frostbiter',12,10);out.icyShieldHP=40;kept.icyShieldHP=40;
  s.playerShieldHP=30;t.playerIce=30;s.playerHP=50;s.rubyHP=50;
  a.useSaturnIntercept(s);let hp=boss.hp;t.recallTimer=1;a.updateSaturn(s);
  close(s.playerHP,50+(40+30)*S.counterHealShare,'a countered recall heals you for the ice you kept');
  close(s.rubyHP,50+(40+30)*S.counterHealShare*(2/3),'Ruby receives two-thirds of the player heal');
  close(boss.hp-hp,40*S.loneRecallHealShare,'only the ice outside the field returns (one holder, so a small heal)');assert.equal(out.icyShieldHP,0);assert.equal(kept.icyShieldHP,0,'a countered recall strips ice inside the field');assert.equal(s.playerShieldHP,30,'your own ice is kept');
  t.field=null;kept.icyShieldHP=0;s.playerShieldHP=0;t.playerIce=0;hp=boss.hp;t.recallTimer=1;a.updateSaturn(s);
  close(hp-boss.hp,S.phaseHP*S.backlashShare,'backlash');
});

test('recall takes back the ice you hold unless you stand in the field',()=>{
  const{s,t,boss}=fresh();boss.hp=S.phaseHP*2.5;s.playerShieldHP=50;t.playerIce=30;
  const hp=boss.hp;t.recallTimer=1;a.updateSaturn(s);assert.equal(s.playerShieldHP,20);close(boss.hp-hp,30*S.loneRecallHealShare);
});

test('the blizzard never hurts her aliens',()=>{
  const{s,t}=fresh();const bare=alien(s,'frostbiter',20,20,40);t.pulse=S.pulseTicks-1;a.updateSaturn(s);assert.equal(bare.hp,40);
});

test('the blizzard hurts or drains only you, never Ruby, and chills you only without a shield',()=>{
  const{s,t}=fresh();t.pulse=S.pulseTicks-1;a.updateSaturn(s);assert.equal(s.playerHP,100-S.blizzardDamage);assert.equal(s.rubyHP,100);
  assert.equal(e.isPlayerChilled(s),true);s.playerShieldHP=10;assert.equal(e.isPlayerChilled(s),false);
  t.pulse=S.pulseTicks-1;a.updateSaturn(s);assert.equal(s.playerHP,100-S.blizzardDamage);assert.equal(s.playerShieldHP,10-S.blizzardDamage);
});

test('Frostbiter strips the entire shield before damage, including recalled ice, and knocks you back two tiles',()=>{
  const{s,t}=fresh();const b=alien(s,'frostbiter',13,10,40);b.attackTimer=0;s.playerShieldHP=250;s.playerSaturnShield=true;t.playerIce=180;
  a.updateSaturnAlien(s,b);assert.equal(b.frostAct.kind,'pounce');assert.deepEqual([b.frostAct.tx,b.frostAct.ty],[10,10]);
  for(let i=0;i<S.frostbiter.crouch+S.frostbiter.leapTicks+2&&b.frostAct;i++)a.updateSaturnAlien(s,b);
  assert.equal(s.playerShieldHP,0);assert.equal(s.playerSaturnShield,false);assert.equal(t.playerIce,0);assert.equal(s.playerHP,100-S.frostbiter.damage);assert.ok(s.playerKnockback);assert.equal(s.playerKnockback.tilesLeft,S.frostbiter.push);
  assert.equal(b.attackTimer,120);
});

test('a missed Frostbiter pounce leaves shields intact',()=>{
  const{s,t}=fresh();const b=alien(s,'frostbiter',13,10);b.attackTimer=0;s.playerShieldHP=250;t.playerIce=180;
  a.updateSaturnAlien(s,b);player(s,10,12);
  for(let i=0;i<S.frostbiter.crouch+S.frostbiter.leapTicks+2&&b.frostAct;i++)a.updateSaturnAlien(s,b);
  assert.equal(s.playerShieldHP,250);assert.equal(t.playerIce,180);assert.equal(s.playerHP,100);
});

test('Saturn uses 32 frozen tiles without a boss-room bonus and a shorter player freeze',()=>{
  const{s,t}=fresh();t.iceTimer=0;a.updateSaturn(s);assert.equal(t.nextIce.length,32);
  for(let i=0;i<S.iceWarning;i++)a.updateSaturn(s);
  assert.equal(s.frostIceTiles.length,32);
  const [x,y]=s.frostIceTiles[0];player(s,x,y);a.freezeSaturnPlayer(s);assert.equal(s.playerFrozenTicks,S.normalFreezeTicks);assert.equal(S.fieldTicks,45);
});

test('Glacier Hulk walks to an adjacent tile within 40 ticks',()=>{
  const{s}=fresh();const h=alien(s,'glacier_hulk',15,10);h.targetTileX=14;h.attackTimer=999;h.pathTimer=999;
  for(let i=0;i<40;i++)a.updateSaturnAlien(s,h);
  assert.equal(h.tileX,14);
});

test('Hailer shells three tiles and freezes them',()=>{
  const{s,t}=fresh();const m=alien(s,'sleet_mortar',18,10,40);m.attackTimer=0;a.updateSaturnAlien(s,m);
  assert.equal(t.shells.length,3);for(let i=0;i<S.mortar.warning;i++)a.updateSaturn(s);
  assert.equal(t.shells.length,0);assert.ok(t.temporaryIce.some(i=>i.x===10&&i.y===10)||s.playerHP<100);
});

test('Glacier Hulk slams the 5×5 around it; ice from a miss melts quickly',()=>{
  for(const hit of [true,false]){
    const{s,t}=fresh();const h=alien(s,'glacier_hulk',12,10,90);h.attackTimer=0;a.updateSaturnAlien(s,h);assert.equal(h.frostAct.kind,'slam');
    if(!hit)player(s,20,10);
    for(let i=0;i<S.hulk.windup;i++)a.updateSaturnAlien(s,h);
    assert.equal(s.playerHP<100,hit);
    assert.ok(t.temporaryIce.length>0);assert.ok(t.temporaryIce.every(i=>i.ticks===(hit?S.hulk.iceTicks:S.hulk.missIceTicks)));
  }
});

test('her aliens have modest HP; her large grants are what make them tough',()=>{
  assert.deepEqual(['frostbiter','sleet_mortar','glacier_hulk'].map(type=>c.ENEMY_CONFIGS[type].maxHp),[12,12,40]);
  assert.ok(S.grantAmount>=45);
});

test('only the final defeat wins',()=>{
  const{s,boss}=fresh();for(const phase of [1,2,3]){a.godSetSaturnPhase(s,phase);a.updateSaturn(s);assert.equal(s.saturn.phase,phase);assert.equal(s.gamePhase,'playing');}
  e.damageEnemy(s,boss,boss.hp,'enemy');e.killEnemy(s,s.enemies.indexOf(boss));assert.equal(s.gamePhase,'won');
});

test('a marked Hulk that dies first still gives double ice',()=>{
  const{s,t,boss}=fresh();const hulk=alien(s,'glacier_hulk',22,20,90);t.grantTargets=[];a.updateSaturn(s);assert.deepEqual(t.grantTargets,[hulk.id]);
  e.damageEnemy(s,hulk,1e4,'player');e.killEnemy(s,s.enemies.indexOf(hulk));const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);
  close(hp-boss.hp,S.grantAmount*S.hulkGrantMult*S.absorbShare);close(s.playerShieldHP,S.grantAmount*S.hulkGrantMult*S.killShieldShare);
});

test('your shield is capped; taken ice past the cap is lost but still hurts her',()=>{
  const{s,t,boss}=fresh();s.playerShieldHP=S.shieldCap-10;const bite=alien(s,'frostbiter',22,20);t.grantTargets=[bite.id];
  a.useSaturnIntercept(s);near(bite,12,10);const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);
  assert.equal(s.playerShieldHP,S.shieldCap);close(hp-boss.hp,S.grantAmount*S.counterGrantShare+S.counterGrantBonus);
  s.playerShieldHP=500;a.updateSaturn(s);assert.equal(s.playerShieldHP,S.shieldCap,'any source is clamped');
});

test('a caught grant strips the ice of every alien in the field, without giving it to you or hurting her',()=>{
  const{s,t,boss}=fresh();const marked=alien(s,'frostbiter',12,10),other=alien(s,'frostbiter',10,12),outside=alien(s,'frostbiter',30,30);
  const far1=alien(s,'frostbiter',35,35),far2=alien(s,'frostbiter',36,35);other.icyShieldHP=40;outside.icyShieldHP=40;t.grantTargets=[marked.id,far1.id,far2.id]; // all slots filled, so none are added
  a.useSaturnIntercept(s);const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);
  assert.equal(other.icyShieldHP,0);assert.equal(outside.icyShieldHP,40);
  close(s.playerShieldHP,S.grantAmount*S.fieldShieldShare);close(hp-boss.hp,S.grantAmount*S.counterGrantShare+S.counterGrantBonus);
  const{s:s2,t:t2}=fresh();const lone=alien(s2,'frostbiter',10,12),g=[1,2,3].map(k=>alien(s2,'frostbiter',33+k,35));lone.icyShieldHP=40;a.useSaturnIntercept(s2);t2.grantTargets=g.map(x=>x.id);t2.grantTimer=1;a.updateSaturn(s2);
  assert.equal(lone.icyShieldHP,40,'no catch, no strip');
});

test('a recall from a single holder heals her far less',()=>{
  for(const count of [1,2]){
    const{s,t,boss}=fresh();boss.hp=S.phaseHP*2.5;
    for(let k=0;k<count;k++){const m=alien(s,'frostbiter',30+k,30);m.icyShieldHP=60;}
    const hp=boss.hp;t.recallTimer=1;a.updateSaturn(s);
    close(boss.hp-hp,60*count*(count===1?S.loneRecallHealShare:S.recallHealShare),`${count} holder(s)`);
  }
});




test('phase 2: aliens holding her ice move faster and hit harder, scaling with the ice',()=>{
  const{s}=fresh();const mob=alien(s,'frostbiter',20,20);mob.icyShieldHP=S.empowerFullIce;
  assert.equal(a.saturnEmpower(s,mob,'speed'),1,'not in phase 1');
  a.godSetSaturnPhase(s,2);close(a.saturnEmpower(s,mob,'speed'),1+S.empowerSpeed);close(a.saturnEmpower(s,mob,'damage'),1+S.empowerDamage);
  mob.icyShieldHP=S.empowerFullIce/2;close(a.saturnEmpower(s,mob,'damage'),1+S.empowerDamage/2);
  mob.icyShieldHP=0;assert.equal(a.saturnEmpower(s,mob,'damage'),1);
  mob.icyShieldHP=S.empowerFullIce;const hp=s.playerHP;e.damagePlayer(s,10,mob);close(hp-s.playerHP,10*(1+S.empowerDamage));
});





test('frozen floor grows a little each phase',()=>{
  assert.deepEqual([...S.iceCount],[32,40,48]);
  for(const phase of [1,2,3]){const{s,t}=fresh();if(phase>1)a.godSetSaturnPhase(s,phase);t.iceTimer=1;t.iceWarning=0;a.updateSaturn(s);assert.equal(t.nextIce.length,S.iceCount[phase-1]);}
});

test('phase 3: fired grant and recall lines freeze the floor they cross; earlier phases and warnings do not',()=>{
  for(const phase of [2,3]){
    const{s,t,boss}=fresh();a.godSetSaturnPhase(s,phase);near(boss,30,10);player(s,40,40);
    const m=alien(s,'frostbiter',20,10),f1=alien(s,'frostbiter',35,35),f2=alien(s,'frostbiter',36,35);t.grantTargets=[m.id,f1.id,f2.id];t.temporaryIce=[];
    t.grantTimer=30;a.updateSaturn(s);assert.equal(t.temporaryIce.length,0,'no ice during the warning');
    t.grantTimer=1;a.updateSaturn(s);
    const onLine=t.temporaryIce.filter(i=>i.y===10&&i.x>20&&i.x<30);
    if(phase===2)assert.equal(t.temporaryIce.length,0);else{assert.ok(onLine.length>0,'grant line froze tiles');assert.ok(onLine.every(i=>i.ticks>=S.lineIceTicks-1));}
  }
  const{s,t,boss}=fresh();a.godSetSaturnPhase(s,3);near(boss,30,10);player(s,40,40);const h=alien(s,'frostbiter',20,10);h.icyShieldHP=30;t.temporaryIce=[];
  t.recallTimer=1;a.updateSaturn(s);assert.ok(t.temporaryIce.some(i=>i.y===10&&i.x>20&&i.x<30),'recall line froze tiles');
});

test('a meteor only breaks her ice on a shielded alien (costing her); an unshielded one dies as usual',()=>{
  const{s,boss}=fresh();near(boss,39,39);player(s,40,40);s.rubyTileX=-1;
  const m=alien(s,'frostbiter',12,12,12),bare=alien(s,'frostbiter',13,12,12);m.icyShieldHP=45;const hp=boss.hp;
  s.meteoriteWarning=c.chamberOfTile(12,12);s.meteoriteStrikeIn=1;e.tick(s);
  assert.ok(s.enemies.includes(m),'the shielded alien survives');assert.equal(m.icyShieldHP,0);assert.ok(!s.enemies.includes(bare),'the unshielded alien dies');
  close(hp-boss.hp,45*S.shatterShare,'her ice breaking costs her');
});

test('recalls never land on the same tick as a grant: always midway between two',()=>{
  const{s,t,boss}=fresh();a.godSetSaturnPhase(s,1);s.noMobs=true;const grants=[],recalls=[];
  for(let tick=1;tick<=S.recallInterval*3+S.recallOffset;tick++){const g=t.grantTimer,r=t.recallTimer;a.updateSaturn(s);if(t.grantTimer>g)grants.push(tick);if(t.recallTimer>r)recalls.push(tick);}
  assert.ok(recalls.length>=3);for(const r of recalls){assert.ok(!grants.includes(r));const gap=Math.min(...grants.map(g=>Math.abs(g-r)));assert.equal(gap,S.grantInterval/2);}
});

test('a successful counter also hurts every alien inside the field',()=>{
  for(const kind of ['grant','recall']){
    const{s,t}=fresh();const inside=alien(s,'frostbiter',12,10,40),out=alien(s,'frostbiter',35,35,40);
    if(kind==='grant'){const f1=alien(s,'frostbiter',36,35,40);t.grantTargets=[inside.id,out.id,f1.id];}else inside.icyShieldHP=20;
    a.useSaturnIntercept(s);if(kind==='grant')t.grantTimer=1;else t.recallTimer=1;a.updateSaturn(s);
    assert.equal(inside.hp,40-S.counterDamage,kind);assert.equal(out.hp,40,kind);
  }
  const{s,t}=fresh();const lone=alien(s,'frostbiter',12,10,40);a.useSaturnIntercept(s);a.updateSaturn(s);assert.equal(lone.hp,40,'no counter, no damage');
});

test('Hailer chases you and stops one tile short of Absolute Zero range',()=>{
  const{s}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));player(s,10,10);const h=alien(s,'sleet_mortar',25,10,12);h.attackTimer=1e6;
  for(let i=0;i<4000;i++)a.updateSaturnAlien(s,h);
  assert.equal(Math.round(Math.hypot(h.x-s.playerX,h.y-s.playerY)/c.TILE_SIZE),S.fieldRadius-1);
  const close=alien(s,'sleet_mortar',12,10,12);close.attackTimer=1e6;for(let i=0;i<300;i++)a.updateSaturnAlien(s,close);
  assert.deepEqual([close.tileX,close.tileY],[12,10],'it no longer backs away');
});


function bloomScene(phase=2){const scene=fresh();a.godSetSaturnPhase(scene.s,phase);const {t}=scene;t.grantTimer=t.recallTimer=t.iceTimer=1e6;t.pulse=-1e6;return scene;}
test('Frost Bloom starts in phase 2, repeats every 4 seconds, and transfers existing shield to the nearest bare alien',()=>{
  for(const phase of [1,2,3]){
    const {s,t}=bloomScene(phase),donor=alien(s,'frostbiter',20,20),nearby=alien(s,'frostbiter',21,20),farther=alien(s,'frostbiter',22,20);donor.icyShieldHP=45;
    for(let i=0;i<S.bloomInterval-1;i++)a.updateSaturn(s);
    assert.equal(nearby.icyShieldHP,0);a.updateSaturn(s);
    assert.equal(nearby.icyShieldHP,phase===1?0:10);assert.equal(donor.icyShieldHP,phase===1?45:35);assert.equal(farther.icyShieldHP,0);
    if(phase>1){for(let i=0;i<S.bloomInterval;i++)a.updateSaturn(s);assert.equal(farther.icyShieldHP,10);assert.equal(s.enemies.filter(m=>m!==a.saturnBoss(s)).reduce((n,m)=>n+m.icyShieldHP,0),45);}
  }
});
test('Frost Bloom cannot chain within a pulse, stack onto a holder, exceed range or transfer from a dead alien',()=>{
  const{s,t}=bloomScene(),donor=alien(s,'frostbiter',20,20),receiver=alien(s,'frostbiter',23,20),next=alien(s,'frostbiter',26,20),holder=alien(s,'frostbiter',20,21),dead=alien(s,'frostbiter',30,30),out=alien(s,'frostbiter',34,30);
  donor.icyShieldHP=7;holder.icyShieldHP=40;dead.icyShieldHP=45;dead.hp=0;t.bloomTimer=1;a.updateSaturn(s);
  assert.equal(donor.icyShieldHP,0);assert.equal(receiver.icyShieldHP,7);assert.equal(next.icyShieldHP,0);assert.equal(holder.icyShieldHP,40);assert.equal(out.icyShieldHP,0);
});
test('two Frost Bloom donors choose separate unshielded recipients without duplicating shield',()=>{
  const{s,t}=bloomScene(),d1=alien(s,'frostbiter',20,20),d2=alien(s,'frostbiter',22,20),r1=alien(s,'frostbiter',21,20),r2=alien(s,'frostbiter',22,22);d1.icyShieldHP=d2.icyShieldHP=45;t.bloomTimer=1;a.updateSaturn(s);
  assert.deepEqual([d1.icyShieldHP,d2.icyShieldHP,r1.icyShieldHP,r2.icyShieldHP],[35,35,10,10]);
});
test('Frost Bloom pauses in menus and Absolute Zero stops frozen donors spreading',()=>{
  const{s,t}=bloomScene(),donor=alien(s,'frostbiter',12,10),receiver=alien(s,'frostbiter',13,10);donor.icyShieldHP=45;t.bloomTimer=1;s.gamePhase='paused';a.updateSaturn(s);assert.equal(t.bloomTimer,1);
  s.gamePhase='playing';a.useSaturnIntercept(s);a.updateSaturn(s);assert.equal(donor.icyShieldHP,45);assert.equal(receiver.icyShieldHP,0);
});
test('Frost Bloom creates more recall holders; clearing a recipient retains the single-holder reduction',()=>{
  for(const clear of [false,true]){
    const{s,t,boss}=bloomScene(),donor=alien(s,'frostbiter',20,20),receiver=alien(s,'frostbiter',21,20);donor.icyShieldHP=45;boss.hp=S.phaseHP*1.5;t.bloomTimer=1;a.updateSaturn(s);
    if(clear){e.damageEnemy(s,receiver,1e4,'player');e.killEnemy(s,s.enemies.indexOf(receiver));}
    const hp=boss.hp;t.recallTimer=1;a.updateSaturn(s);close(boss.hp-hp,clear?35*S.loneRecallHealShare:45*S.recallHealShare);
  }
});
test('breaking frost shields and countering grants or recalls no longer creates pickups',()=>{
  const{s,t}=bloomScene(),mob=alien(s,'frostbiter',20,20);mob.icyShieldHP=30;e.damageEnemy(s,mob,30,'player');assert.equal(mob.icyShieldHP,0);assert.equal(s.playerShieldHP,0);assert.equal(t.shards,undefined);
});
test('phase 3 grant paths expire after lineIceTicks (1.95 seconds)',()=>{
  const{s,t,boss}=bloomScene(3);near(boss,30,10);player(s,40,40);const mob=alien(s,'frostbiter',20,10);t.grantTargets=[mob.id];t.grantTimer=1;a.updateSaturn(s);
  assert.ok(t.temporaryIce.some(i=>i.x===25&&i.y===10));
  for(let i=0;i<a.SATURN.lineIceTicks-1;i++)a.updateSaturn(s);assert.ok(t.temporaryIce.some(i=>i.x===25&&i.y===10));a.updateSaturn(s);assert.ok(!t.temporaryIce.some(i=>i.x===25&&i.y===10));
});

test('phase 3 paths use their own short freeze; overlapping normal floor and shell ice keep their own freezes',()=>{
  for(const overlap of ['none','floor','shell']){
    const{s,t,boss}=bloomScene(3);near(boss,30,10);player(s,40,40);
    const mob=alien(s,'frostbiter',20,10);t.grantTargets=[mob.id];t.grantTimer=1;a.updateSaturn(s);
    const path=t.temporaryIce.find(i=>i.x===25&&i.y===10);assert.ok(path);assert.equal(path.freezeTicks,S.lineFreezeTicks);
    if(overlap==='floor')s.frostIceTiles=[[25,10]];
    if(overlap==='shell')t.shells=[{x:25,y:10,ticks:1}];
    player(s,25,10);a.updateSaturn(s);
    assert.equal(s.playerFrozenTicks,overlap==='none'?S.lineFreezeTicks:overlap==='floor'?S.normalFreezeTicks:S.enemyFreezeTicks,overlap);
  }
});

test('blocked recalls still create frozen paths from aliens and the player, without taking their protected shield',()=>{
  const{s,t,boss}=bloomScene(3);near(boss,30,10);const mob=alien(s,'frostbiter',12,10);mob.icyShieldHP=40;
  s.playerShieldHP=30;t.playerIce=30;a.useSaturnIntercept(s);t.recallTimer=1;a.updateSaturn(s);
  assert.equal(t.beams.filter(b=>b.kind==='recall').length,2);
  assert.ok(t.temporaryIce.some(i=>i.x===25&&i.y===10),'the blocked lines freeze the floor outside the field');
  assert.equal(s.playerShieldHP,30);assert.equal(t.playerIce,30);assert.equal(mob.icyShieldHP,0);
  a.updateSaturn(s);assert.equal(s.playerFrozenTicks,0,'Absolute Zero still protects you from the path');
});

// Independent rectangle/segment clipping oracle: each crossed floor tile must match the fired beam.
function beamFloor(s,b){
  const result=[];
  for(let y=0;y<c.MAP_ROWS;y++)for(let x=0;x<c.MAP_COLS;x++){
    if(!e.isFloorTile(s.map,x,y)||[['fromX','fromY'],['toX','toY']].some(([kx,ky])=>x===Math.floor(b[kx]/48)&&y===Math.floor(b[ky]/48)))continue;
    let enter=0,leave=1,valid=true;
    for(const [start,end,lo,hi]of [[b.fromX,b.toX,x*48,(x+1)*48],[b.fromY,b.toY,y*48,(y+1)*48]]){
      const d=end-start;if(!d){if(start<lo||start>=hi)valid=false;continue;}
      const a=(lo-start)/d,z=(hi-start)/d;enter=Math.max(enter,Math.min(a,z));leave=Math.min(leave,Math.max(a,z));
    }
    const endpoint=[['fromX','fromY'],['toX','toY']].some(([kx,ky])=>Math.floor(b[kx]/48)===x&&Math.floor(b[ky]/48)===y);
    if(valid&&(leave-enter>1e-10||endpoint))result.push(`${x},${y}`);
  }
  return result.sort();
}
test('grant, stolen-grant and recall paths match exact beam endpoints, including thin diagonal crossings and walls',()=>{
  const segments=[[[20.01,10.99],[30.99,20.01]],[[20.5,10.5],[21,10]],[[20.5,10.5],[20,11]],[[20,10.5],[30,10.5]],[[20.5,10],[20.5,20]],[[20,10],[20,10]]];
  for(const kind of ['grant','steal','recall'])for(const segment of segments)for(const reverse of [false,true]){
    const{s,t,boss}=bloomScene(3);s.map=s.map.map(row=>row.map(()=>c.T_FLOOR));s.map[15][25]=c.T_WALL;
    const mob=alien(s,'frostbiter',20,10);const points=segment.map(pair=>pair.map(value=>value*48));if(reverse)points.reverse();
    [mob.x,mob.y]=points[0];[boss.x,boss.y]=points[1];
    if(kind==='steal'){
      [s.playerX,s.playerY]=points[0];t.grantTargets=[mob.id];t.field={x:mob.x,y:mob.y,ticks:30};t.grantTimer=1;
    }else if(kind==='grant'){t.grantTargets=[mob.id];t.grantTimer=1;}
    else {mob.icyShieldHP=40;t.recallTimer=1;}
    a.updateSaturn(s);const beam=t.beams.find(b=>b.kind===kind);assert.ok(beam,kind);
    assert.deepEqual(t.temporaryIce.map(i=>`${i.x},${i.y}`).sort(),beamFloor(s,beam),`${kind}, reverse=${reverse}`);
  }
});

test('a recall from the player does not freeze the player or the boss endpoint',()=>{
  const{s,t,boss}=bloomScene(3);near(boss,30,10);player(s,10,10);s.frostIceTiles=[];s.playerShieldHP=30;t.playerIce=30;t.recallTimer=1;
  a.updateSaturn(s);assert.equal(t.playerIce,0);assert.ok(t.temporaryIce.some(i=>i.x===20&&i.y===10));
  assert.ok(!t.temporaryIce.some(i=>i.x===10&&i.y===10));assert.ok(!t.temporaryIce.some(i=>i.x===30&&i.y===10));
  a.updateSaturn(s);assert.equal(s.playerFrozenTicks,0,'the completed recall leaves its shield holder free');
});


test('Frost Bloom shares out to its radius but not beyond',()=>{
 for(const distance of [S.bloomRadius,S.bloomRadius+.01]){
  const{s,t}=bloomScene(),donor=alien(s,'frostbiter',20,20),receiver=alien(s,'frostbiter',24,20);
  receiver.x=donor.x+distance*c.TILE_SIZE;donor.icyShieldHP=45;t.bloomTimer=1;a.updateSaturn(s);
  assert.equal(receiver.icyShieldHP,distance===S.bloomRadius?10:0);assert.equal(donor.icyShieldHP,distance===S.bloomRadius?35:45);
 }
});

test('a meteor hits the Frost Warden for 10% of a phase even through her own frost shield',()=>{
  const{s,boss}=fresh();s.godMode=true;boss.icyShieldHP=500;const hp=boss.hp;
  s.meteoriteWarning=c.chamberOfTile(boss.tileX,boss.tileY);s.meteoriteStrikeIn=1;e.tick(s);
  assert.ok(Math.abs(hp-boss.hp-S.phaseHP*S.meteorShare)<1e-6,'took '+(hp-boss.hp));assert.equal(boss.icyShieldHP,500,'her shield is untouched');
});

test('countering a normal and Hulk grant adds about 11.3 and 22.7 boss damage',()=>{
  const{s,t,boss}=fresh();const normal=alien(s,'frostbiter',12,10),hulk=alien(s,'glacier_hulk',10,12);t.grantTargets=[normal.id,hulk.id];
  a.useSaturnIntercept(s);const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);close(hp-boss.hp,34.008);
});

test('on Saturn F works while frozen in ice and breaks you out; a stun still blocks it',()=>{
  const{s}=fresh();s.specialSkill='frost_warden';s.specialLockTicks=0;s.playerFrozenTicks=60;s.playerStunned=false;
  assert.equal(e.useSpecialSkill(s),true,'cast while frozen');assert.equal(s.playerFrozenTicks,0,'thawed');assert.equal(s.specialSkill,null);
  const q=fresh().s;q.specialSkill='frost_warden';q.specialLockTicks=0;q.playerFrozenTicks=60;q.playerStunned=true;
  assert.equal(e.useSpecialSkill(q),false,'a stun still blocks it');assert.equal(q.playerFrozenTicks,60);
  const n=e.createModeState('endless');n.specialSkill='frost_warden';n.specialLockTicks=0;n.playerFrozenTicks=60;n.playerStunned=false;
  assert.equal(e.useSpecialSkill(n),false,'elsewhere frozen still blocks F');
});

function anchorScene(){const scene=fresh();scene.t.phase=S.anchorFromPhase;scene.boss.hp=1000;return scene;}
test('Frost Anchors arrive in phase 3, one per room, with pause, respawn and cleanup',()=>{
 const{s,t,boss}=fresh();s.noMobs=false;t.spawnTimer=1e6;a.updateSaturn(s);assert.equal(s.enemies.filter(e=>e.type==='frost_anchor').length,0);
 boss.hp=2400;a.updateSaturn(s);assert.equal(s.enemies.filter(e=>e.type==='frost_anchor').length,0,'not yet in phase 2');
 boss.hp=1200;a.updateSaturn(s);const anchors=s.enemies.filter(e=>e.type==='frost_anchor');assert.equal(anchors.length,4);assert.equal(new Set(anchors.map(e=>c.chamberOfTile(e.tileX,e.tileY))).size,4);
 for(const e of anchors){assert.equal(e.hp,S.anchorHP);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)assert.ok(s.map[e.tileY+dy]?.[e.tileX+dx]!==undefined&&s.map[e.tileY+dy][e.tileX+dx]!==c.T_WALL,'clear two-tile wall buffer');assert.ok(e.type==='frost_anchor');assert.ok(!t.grantTargets.includes(e.id));assert.ok(c.TELEPORT_PADS.every(([x,y])=>x!==e.tileX||y!==e.tileY));}
 const gone=anchors[0];e.damageEnemy(s,gone,100);e.killEnemy(s,s.enemies.indexOf(gone));assert.equal(s.enemies.filter(e=>e.type==='frost_anchor').length,3);
 const timer=t.anchorTimer;s.gamePhase='paused';a.updateSaturn(s);assert.equal(t.anchorTimer,timer);s.gamePhase='playing';t.anchorTimer=0;a.updateSaturn(s);assert.equal(s.enemies.filter(e=>e.type==='frost_anchor').length,4);
 player(s,11,10);a.updateSaturn(s);assert.deepEqual(t.frostTrail,[]);a.clearSaturnEncounter(s);assert.equal(s.enemies.filter(e=>e.type==='frost_anchor').length,0);
});
test('anchor aura blocks grant counters, but time stop still works; destroying it restores counters immediately',()=>{
 const{s,t,boss}=anchorScene(),mob=alien(s,'frostbiter',11,10),pillar=alien(s,'frost_anchor',12,10,S.anchorHP);
 t.grantTargets=[mob.id];a.useSaturnIntercept(s);assert.equal(a.saturnTimeStopped(s,mob),true);assert.equal(a.inSaturnCounterField(s,mob.x,mob.y),false);
 const hp=boss.hp;t.grantTimer=1;a.updateSaturn(s);assert.equal(mob.icyShieldHP,S.grantAmount);assert.equal(s.playerShieldHP,0);assert.equal(boss.hp,hp);assert.equal(pillar.hp,S.anchorHP);
 e.damageEnemy(s,pillar,100);e.killEnemy(s,s.enemies.indexOf(pillar));assert.equal(a.inSaturnCounterField(s,mob.x,mob.y),true);
 t.grantTargets=[mob.id];t.grantTimer=1;a.updateSaturn(s);assert.ok(s.playerShieldHP>0);assert.ok(boss.hp<hp);
});
test('anchor suppression depends only on the player, not on enemy or cast positions',()=>{
 const{s,t}=anchorScene(),mob=alien(s,'frostbiter',15,10);alien(s,'frost_anchor',20,10,S.anchorHP);
 a.useSaturnIntercept(s);assert.equal(a.saturnAnchorBlocks(s,s.playerX,s.playerY),false);assert.equal(a.inSaturnField(s,mob.x,mob.y),true);assert.equal(a.inSaturnCounterField(s,mob.x,mob.y),true);
 t.grantTargets=[mob.id];t.grantTimer=1;a.updateSaturn(s);assert.equal(mob.icyShieldHP,0);assert.ok(s.playerShieldHP>0);
 player(s,16,10);assert.equal(a.inSaturnCounterField(s,mob.x,mob.y),false);
 player(s,10,10);assert.equal(a.inSaturnCounterField(s,mob.x,mob.y),true);
});
test('anchor aura prevents recall blocking and keeps anchors out of grants and Frost Bloom',()=>{
 const{s,t,boss}=anchorScene(),mob=alien(s,'frostbiter',11,10),pillar=alien(s,'frost_anchor',12,10,S.anchorHP);
 mob.icyShieldHP=45;t.playerIce=20;s.playerShieldHP=20;a.useSaturnIntercept(s);t.recallTimer=1;const hp=boss.hp;a.updateSaturn(s);
 assert.equal(s.playerShieldHP,0);assert.equal(mob.icyShieldHP,0);assert.ok(boss.hp>hp);assert.ok(!t.effects.some(e=>e.kind==='recallCounter'));
 mob.icyShieldHP=45;t.bloomTimer=1;t.grantTimer=1;a.updateSaturn(s);assert.equal(pillar.icyShieldHP,0);assert.ok(!t.grantTargets.includes(pillar.id));
});

test('Frost Anchor placement rejects walls within two tiles, including diagonal walls and map edges',()=>{
 const{s}=fresh();for(let y=6;y<=14;y++)for(let x=6;x<=14;x++)s.map[y][x]=c.T_FLOOR;
 assert.equal(a.saturnAnchorSpotClear(s,10,10),true);
 for(const [dx,dy]of [[1,0],[2,0],[-2,0],[0,2],[2,2],[-2,-2]]){s.map[10+dy][10+dx]=c.T_WALL;assert.equal(a.saturnAnchorSpotClear(s,10,10),false);s.map[10+dy][10+dx]=c.T_FLOOR;}
 s.map[10][13]=c.T_WALL;assert.equal(a.saturnAnchorSpotClear(s,10,10),true,'wall three tiles away is allowed');
 assert.equal(a.saturnAnchorSpotClear(s,0,0),false);
});

test('Frost Anchor suppression covers all of each outermost tile and ends exactly at tile edges',()=>{
 const{s}=anchorScene();alien(s,'frost_anchor',20,20,S.anchorHP);const lo=20-S.anchorRadius,hi=21+S.anchorRadius;
 for(const [x,y]of [[lo*48,lo*48],[hi*48-.01,hi*48-.01],[(hi-1)*48+47,20.5*48]])assert.equal(a.saturnAnchorBlocks(s,x,y),true);
 for(const [x,y]of [[lo*48-.01,20.5*48],[hi*48,20.5*48],[20.5*48,hi*48]])assert.equal(a.saturnAnchorBlocks(s,x,y),false);
});

test('destroying a Frost Anchor grants ordinary shield, respects the cap and gives no meteor reward',()=>{
 for(const [start,meteor,expected]of [[0,false,20],[195,false,200],[0,true,0]]){
  const{s,t}=anchorScene();s.playerShieldHP=start;const pillar=alien(s,'frost_anchor',12,10,S.anchorHP);e.damageEnemy(s,pillar,100);e.killEnemy(s,s.enemies.indexOf(pillar),meteor);
  assert.equal(s.playerShieldHP,expected);assert.equal(t.playerIce,0);assert.equal(s.enemies.includes(pillar),false);if(!meteor)assert.equal(s.playerSaturnShield,true);
 }
});
