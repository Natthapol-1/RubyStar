const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{const src=fs.readFileSync(f,'utf8');m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),si=require('../game/sirius.ts');
const S=si.SIRIUS;
const player=(s,x,y)=>{s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;s.playerStepProgress=0;s.playerKnockback=null;};
function fresh(){
  const s=e.createModeState('trial','blind_prayer');s.noMobs=true;s.meteoriteTimer=1e6;s.invincible=false;
  e.godSpawnBoss(s,'blind_prayer');const boss=s.enemies.find(x=>x.type==='blind_prayer');
  const [top,left]=c.CHAMBER_BOUNDS[0];player(s,left+3,top+3);s.sirius.lastTile=[s.playerTileX,s.playerTileY];
  return{s,boss};
}
// Walk the player along a list of directions, one tile per update (without the rest of the tick).
function walk(s,dirs){for(const d of dirs){const[dx,dy]=si.RUNE_STEP[d];player(s,s.playerTileX+dx,s.playerTileY+dy);si.updateSirius(s);}}
const expand=rune=>rune.strokes.flatMap(([d,n])=>Array(n).fill(d));

test('automatic light/dark warning tolls once at two seconds and manual swaps skip it',()=>{
  const audio=require('../game/sirius-swap-audio.ts'),original=audio.playSiriusSwapBell;let calls=0;audio.playSiriusSwapBell=()=>calls++;
  try{
    for(const light of [false,true]){
      const{s}=fresh();s.sirius.light=light;s.sirius.lightTimer=S.swapWarning+1;const before=calls;
      si.updateSirius(s);assert.equal(calls,before+1);assert.equal(s.sirius.light,light);
      si.updateSirius(s);assert.equal(calls,before+1);
      si.godSiriusSwap(s);assert.equal(calls,before+1);assert.equal(s.sirius.light,!light);
    }
  }finally{audio.playSiriusSwapBell=original;}
});

test('swap overlay appears only in its warning window, keeps the center clear and draws no labels',()=>{
  const {createCanvas}=require('@napi-rs/canvas'),{drawSiriusSwapWarning}=require('../game/sirius-art.ts'),{s}=fresh();
  const cv=createCanvas(960,540),ctx=cv.getContext('2d');ctx.fillText=()=>{throw Error('warning must have no text');};
  const pixels=()=>ctx.getImageData(0,0,960,540).data;
  s.sirius.lightTimer=S.swapWarning+1;drawSiriusSwapWarning(ctx,s,960,540);assert.ok(pixels().every(v=>v===0));
  for(const light of [false,true]){
    ctx.clearRect(0,0,960,540);s.sirius.light=light;s.sirius.lightTimer=20;const before=JSON.stringify(s);
    drawSiriusSwapWarning(ctx,s,960,540);assert.ok(pixels().some(v=>v>0));assert.equal(ctx.getImageData(480,270,1,1).data[3],0);assert.equal(JSON.stringify(s),before);
  }
  ctx.clearRect(0,0,960,540);si.godSiriusSwap(s);drawSiriusSwapWarning(ctx,s,960,540);assert.ok(pixels().every(v=>v===0));
});

test('manual light switch changes state immediately, including while paused, and resets the new state timer',()=>{
  const{s}=fresh();
  si.godSiriusSwap(s);
  assert.equal(s.sirius.light,true);assert.equal(s.trial.siriusLight,true);
  assert.equal(e.isMovementReversed(s),false);assert.equal(s.sirius.lightTimer,S.lightTicks);
  s.gamePhase='paused';s.sirius.phase=3;
  si.godSiriusSwap(s);
  assert.equal(s.sirius.light,false);assert.equal(s.trial.siriusLight,false);
  assert.equal(s.sirius.lightTimer,600);
});

test('phase 3 scatters reachable Sanctuary Seals with room for the rune and changes them each cast',()=>{
  const {s}=fresh();si.godSetSiriusPhase(s,3);
  let previous=[];
  for(let n=0;n<30;n++){
    s.sirius.rune=null;si.godSiriusRune(s);
    const seals=s.sirius.sanctuarySeals;
    assert.equal(seals.length,32);
    for(let room=0;room<4;room++)assert.equal(seals.filter(p=>c.chamberOfTile(p.x,p.y)===room).length,8);
    for(const seal of seals){
      assert.ok(!previous.some(p=>p.x===seal.x&&p.y===seal.y),'each seal moves');
      let{x,y}=seal;assert.ok(e.isFloorTile(s.map,x,y));
      for(const dir of expand(si.RUNES[s.sirius.rune.index])){x+=si.RUNE_STEP[dir][0];y+=si.RUNE_STEP[dir][1];assert.ok(e.isFloorTile(s.map,x,y),'rune fits from seal');}
    }
    previous=seals;
  }
});

test('phase 3 accepts a seal at the rune start, middle or end, but rejects an unrelated approach',()=>{
  for(const location of ['approach','start','middle','end']){
    const{s,boss}=fresh();si.godSetSiriusPhase(s,3);
    const x=s.playerTileX,y=s.playerTileY;
    s.sirius.rune={index:0,cast:0,ticks:500,total:500};
    const seals={approach:{x,y},start:{x,y:y+1},middle:{x:x+2,y:y+1},end:{x:x+2,y:y+3}};
    s.sirius.sanctuarySeals=[seals[location]];s.sirius.trail=[{x,y}];
    const hp=boss.hp;walk(s,[1,...expand(si.RUNES[0])]);
    const included=location!=='approach';
    assert.equal(s.sirius.rune===null,included,location);assert.equal(hp-boss.hp,included?S.runeDamage:0,location);
  }
});

test('extra first-stroke approach tiles do not count as part of the rune',()=>{
  for(const included of [false,true]){
    const{s,boss}=fresh();si.godSetSiriusPhase(s,3);const x=s.playerTileX,y=s.playerTileY;
    s.sirius.rune={index:0,cast:0,ticks:500,total:500};s.sirius.trail=[{x,y}];
    s.sirius.sanctuarySeals=[{x:x+(included?4:1),y}];
    const hp=boss.hp;walk(s,[0,0,0,0,0,0,1,1,2]);
    assert.equal(s.sirius.rune===null,included);assert.equal(hp-boss.hp,included?S.runeDamage:0);
  }
});

test('seal coverage follows the currently matched rune, and disappears after an invalid turn or teleport',()=>{
  const{s}=fresh();si.godSetSiriusPhase(s,3);const t=s.sirius,x=s.playerTileX,y=s.playerTileY;
  t.rune={index:0,cast:0,ticks:500,total:500};t.sanctuarySeals=[{x,y}];t.trail=[{x,y}];
  assert.equal(si.sanctuarySealInRune(t),false,'no tracing yet');
  walk(s,[0,0]);assert.equal(si.sanctuarySealInRune(t),true);
  walk(s,[1]);assert.equal(si.sanctuarySealInRune(t),false,'turning before the first stroke is complete loses the match');
  assert.ok(t.trail.some(p=>p.x===x&&p.y===y),'seal remains in the unrelated trail');
  walk(s,[0]);t.sanctuarySeals=[{x:s.playerTileX,y:s.playerTileY}];assert.equal(si.sanctuarySealInRune(t),true);
  player(s,s.playerTileX+4,s.playerTileY);si.updateSirius(s);assert.equal(si.sanctuarySealInRune(t),false);
});

test('erasing the matched rune start removes seal coverage and casting never counts old trail tiles',()=>{
  const{s}=fresh();si.godSetSiriusPhase(s,3);const t=s.sirius,x=s.playerTileX,y=s.playerTileY;
  t.rune={index:0,cast:0,ticks:500,total:500};t.sanctuarySeals=[{x,y}];t.trail=[{x,y}];
  walk(s,[0,0,0,1]);assert.equal(si.sanctuarySealInRune(t),true);
  t.rune.cast=1;assert.equal(si.sanctuarySealInRune(t),false);t.rune.cast=0;
  t.trail.shift();t.steps.shift();assert.equal(si.sanctuarySealInRune(t),false);
});

test('entering phase 3 during a rune and loading an older save both supply seals',()=>{
  const{s,boss}=fresh();si.godSiriusRune(s);delete s.sirius.sanctuarySeals;boss.hp=S.phaseHP;si.updateSirius(s);
  assert.equal(s.sirius.phase,3);assert.equal(s.sirius.sanctuarySeals.length,32);
  const before=JSON.stringify(s.sirius.sanctuarySeals);s.gamePhase='paused';si.updateSirius(s);assert.equal(JSON.stringify(s.sirius.sanctuarySeals),before);
  si.clearSiriusEncounter(s);assert.deepEqual(s.sirius.sanctuarySeals,[]);
});

test('Mason walls cannot cover a seal even if it moved into an already marked wall lane',()=>{
  const{s}=fresh();for(let y=6;y<=14;y++)for(let x=6;x<=15;x++)s.map[y][x]=c.T_FLOOR;
  player(s,9,9);s.playerDirX=1;s.playerDirY=0;s.rubyTileX=s.rubyTileY=30;
  const m=e.createEncounterEnemy(s,'mason',6,9,60);s.enemies.push(m);m.attackTimer=0;
  si.updateSiriusAlien(s,m);assert.equal(m.siriusAct.tiles.length,4);
  s.sirius.sanctuarySeals=[{x:11,y:9}];
  for(let i=0;i<S.mason.windup;i++)si.updateSiriusAlien(s,m);
  assert.equal(s.map[9][11],c.T_FLOOR);assert.equal(s.sirius.walls.length,3);
});

test('Sirius is a real challenge: a 3-phase tanky Prayer, no map preview',()=>{
  const{s,boss}=fresh();
  assert.ok(!s.trial.mapOnly);assert.equal(boss.maxHp,S.phaseHP*3);assert.equal(s.specialSkill,'blind_prayer');
  e.damageEnemy(s,boss,100,'player');assert.equal(boss.maxHp-boss.hp,100*S.directDamage);
});

test('rune matching: exact strokes complete; a longer first stroke is fine; overshooting a later stroke is not',()=>{
  const hook=si.RUNES[0];
  assert.equal(si.runeProgress(expand(hook),hook).complete,true);
  assert.equal(si.runeProgress([0,...expand(hook)],hook).complete,true);
  assert.equal(si.runeProgress([...expand(hook),2],hook).complete,false);
  assert.equal(si.runeProgress([0,0,0,1,1,1,2],hook).complete,false);
  assert.equal(si.runeProgress([0,0,0,1],hook).tiles,4);
  assert.equal(si.runeProgress([3,3],hook).tiles,0);
});

test('it opens in the dark (reversed); light restores normal controls; they swap on a timer',()=>{
  const{s}=fresh();
  assert.equal(s.sirius.light,false);assert.equal(e.isMovementReversed(s),true);assert.equal(s.trial.siriusLight,false);
  s.sirius.lightTimer=1;si.updateSirius(s);
  assert.equal(s.sirius.light,true);assert.equal(e.isMovementReversed(s),false,'the Prayer alone no longer reverses you');
  assert.equal(s.sirius.lightTimer,S.lightTicks);
});

test('tracing the rune in one line burns the Prayer and heals you',()=>{
  const{s,boss}=fresh();s.playerHP=50;s.rubyHP=50;
  s.sirius.rune={index:0,cast:0,ticks:S.runeTicks,total:S.runeTicks};s.sirius.steps=[];
  const before=boss.hp;walk(s,expand(si.RUNES[0]));
  assert.equal(s.sirius.rune,null);assert.equal(before-boss.hp,S.runeDamage);assert.equal(s.playerHP,50+S.runeHeal);assert.equal(s.rubyHP,50+S.runeHeal);
});

test('a knockback breaks the trail',()=>{
  const{s}=fresh();
  walk(s,[0,0]);assert.equal(s.sirius.steps.length,2);
  s.playerKnockback={dirX:1,dirY:0,started:true,tilesLeft:1};player(s,s.playerTileX+1,s.playerTileY);s.playerKnockback={dirX:1,dirY:0,started:true,tilesLeft:0};
  si.updateSirius(s);assert.equal(s.sirius.steps.length,0);
});

test('an unfinished rune slightly heals the Prayer without restoring a cleared phase',()=>{
  for(const phase of [1,2,3])for(const missing of [0,5,100]){
    const{s,boss}=fresh();si.godSetSiriusPhase(s,phase);
    const ceiling=S.phaseHP*(4-phase);boss.hp=ceiling-missing;
    s.sirius.rune={index:0,cast:0,ticks:1,total:S.runeTicks};s.sirius.steps=[];
    si.updateSirius(s);
    assert.equal(s.sirius.rune,null);
    assert.equal(boss.hp,Math.min(ceiling,ceiling-missing+S.runeFailHeal));
    assert.equal(s.sirius.phase,phase);
    if(missing>0)assert.ok(boss.healFlashTicks>0);
  }
});

test('a missed rune empowers the aliens for a while',()=>{
  const{s}=fresh();
  s.sirius.rune={index:0,cast:0,ticks:1,total:S.runeTicks};si.updateSirius(s);
  assert.equal(s.sirius.rune,null);assert.ok(s.sirius.wrath>0);
  const mob=e.createEncounterEnemy(s,'zealot',2,2,10);s.enemies.push(mob);
  assert.equal(si.siriusEmpower(s,mob,'damage'),S.wrathDamage);
  assert.equal(si.siriusEmpower(s,mob,'speed'),S.alienSpeed*S.wrathSpeed);
  s.sirius.wrath=0;assert.equal(si.siriusEmpower(s,mob,'speed'),S.alienSpeed);assert.equal(si.siriusEmpower(s,mob,'damage'),1);
});

test('the Ruby ritual stops time for a guess; right adds rune time, wrong takes it away, skipping changes nothing',()=>{
  for(const outcome of ['right','wrong','skip']){
    const{s}=fresh();s.starEnergy=60;s.sirius.holy=0;s.sirius.rune={index:0,cast:0,ticks:600,total:S.runeTicks};s.sirius.ritualCooldown=0;
    si.updateSirius(s);
    assert.equal(s.gamePhase,'laserTarget');const dest=s.sirius.ritual.destination;
    const own=c.chamberOfTile(s.rubyTileX,s.rubyTileY),wrong=[0,1,2,3].find(r=>r!==dest&&r!==own);
    if(outcome==='skip')e.cancelSkyLaser(s);else assert.equal(e.chooseSkyLaser(s,outcome==='right'?dest:wrong),true);
    assert.equal(s.gamePhase,'playing');
    const ticks=s.sirius.rune.ticks;s.sirius.ritual.ticks=1;si.updateSirius(s);
    assert.deepEqual([s.rubyTileX,s.rubyTileY],[...c.TELEPORT_PADS[dest]]);
    const expected=outcome==='right'?ticks-1+S.guessBonus:outcome==='wrong'?ticks-1-S.guessPenalty:ticks-1;
    assert.equal(s.sirius.rune.ticks,expected,outcome);
    if(outcome==='right'){assert.equal(s.starEnergy,100,'a right guess fills your energy');assert.equal(Math.round(s.sirius.holy),Math.round(100*c.SIRIUS_HOLY_PER_ENERGY),'worth one full bar of Holy Light');}
  }
});

test('a Zealot dash hurts and knocks you back along its line',()=>{
  const{s}=fresh();
  let spot=null;for(let y=1;y<c.MAP_ROWS-1&&!spot;y++)for(let x=4;x<c.MAP_COLS-2&&!spot;x++)if([0,1,2,3,4].every(k=>e.isFloorTile(s.map,x-3+k,y)))spot=[x,y];
  player(s,spot[0],spot[1]);const z=e.createEncounterEnemy(s,'zealot',spot[0]-3,spot[1],10);s.enemies.push(z);
  z.attackTimer=0;si.updateSiriusAlien(s,z);assert.ok(z.siriusAct&&!z.siriusAct.dashing);
  const hp=s.playerHP;for(let i=0;i<S.zealot.windup+S.zealot.dashTicks+2;i++)si.updateSiriusAlien(s,z);
  assert.ok(s.playerHP<hp);assert.equal(s.playerKnockback?.dirX,1);
});

test('energy fills Holy Light; a traced rune gives full energy, a missed one drains it and some Holy Light',()=>{
  const fx=require('../game/blessing-effects.ts');
  const{s}=fresh();s.starEnergy=0;fx.addStarEnergy(s,50,false);
  assert.equal(Math.round(s.sirius.holy*100)/100,50*c.SIRIUS_HOLY_PER_ENERGY);
  s.starEnergy=10;s.sirius.holy=40;s.sirius.rune={index:0,cast:0,ticks:S.runeTicks,total:S.runeTicks};s.sirius.steps=[];
  walk(s,expand(si.RUNES[0]));
  assert.equal(s.starEnergy,100);assert.equal(Math.round(s.sirius.holy),40+Math.round(100*c.SIRIUS_HOLY_PER_ENERGY),'a traced rune counts as exactly one full bar');
  s.playerHP=80;s.rubyHP=80;s.sirius.rune={index:0,cast:0,ticks:1,total:S.runeTicks};const holy=s.sirius.holy;si.updateSirius(s);
  assert.equal(s.starEnergy,0);assert.equal(s.playerHP,80);assert.equal(s.rubyHP,80,'a miss does not hurt you or Ruby');assert.equal(s.sirius.holy,holy-S.holyFailLoss);
});

test('Halo floats you over walls and faster, then lands you on floor',()=>{
  const{s}=fresh();
  let wall=null;for(let y=2;y<c.MAP_ROWS-2&&!wall;y++)for(let x=2;x<c.MAP_COLS-2&&!wall;x++)if(!e.isFloorTile(s.map,x,y)&&e.isFloorTile(s.map,x-1,y)&&c.chamberOfTile(x,y)>=0)wall=[x,y];
  assert.equal(si.siriusCanFloat(s,wall[0],wall[1]),false);
  assert.equal(si.useHalo(s),true);assert.equal(si.useHalo(s),false,'cooldown');
  assert.equal(si.siriusCanFloat(s,wall[0],wall[1]),true);assert.equal(si.siriusPlayerSpeed(s),S.haloSpeed);
  player(s,wall[0],wall[1]);s.sirius.halo=1;si.updateSirius(s);
  assert.equal(s.sirius.halo,0);assert.ok(e.isFloorTile(s.map,s.playerTileX,s.playerTileY),'landed on floor');
});

test('Halo knockback covers six tiles, pushes outward without damage, and skips the Prayer and dead aliens',()=>{
  const{s,boss}=fresh();player(s,10,10);boss.x=s.playerX;boss.y=s.playerY;
  const cases=[[13,10,true],[8,10,true],[10,7,true],[10,13,true],[14,14,true],[16,10,true],[16,11,false]];
  const mobs=cases.map(([x,y])=>{const m=e.createEncounterEnemy(s,'normal',x,y,100);s.enemies.push(m);return m;});
  const dead=e.createEncounterEnemy(s,'normal',11,10,100);dead.hp=0;s.enemies.push(dead);
  const hp=boss.hp;assert.equal(si.useHalo(s),true);
  cases.forEach(([x,y,hit],i)=>{const m=mobs[i];assert.equal(m.pushTiles,hit?5:0);assert.equal(m.haloStunTicks,hit?18:undefined);assert.equal(m.hp,100);if(hit)assert.ok((x-10)*m.pushDirX+(y-10)*m.pushDirY>0);});
  assert.equal(boss.pushTiles,0);assert.equal(boss.hp,hp);assert.equal(dead.pushTiles,0);
});

test('Halo stuns only after five-tile knockback or an earlier wall collision, then enemies recover',()=>{
  for(const wall of [false,true]){
    const{s,boss}=fresh();player(s,10,10);
    for(let y=7;y<=14;y++)for(let x=7;x<=20;x++)s.map[y][x]=c.T_FLOOR;
    if(wall)s.map[10][15]=c.T_WALL;
    Object.assign(boss,{tileX:39,targetTileX:39,tileY:39,targetTileY:39,x:39.5*c.TILE_SIZE,y:39.5*c.TILE_SIZE});
    const m=e.createEncounterEnemy(s,'zealot',12,10,100);s.enemies.push(m);
    m.siriusAct={ticks:5,tx:10,ty:10,dx:-1,dy:0,fromX:m.x,fromY:m.y,dashing:true};
    assert.equal(si.useHalo(s),true);assert.equal(m.siriusAct,undefined);assert.ok(!m.buildStopUntil);
    for(let i=0;i<(wall?3:5);i++)e.tick(s);
    assert.equal(m.tileX,wall?14:17);assert.equal(m.pushTiles,0);assert.equal(m.haloStunTicks,undefined);
    assert.equal(m.buildStopUntil-s.gameTick,18,'0.3s stun starts after displacement');
    const x=m.x,y=m.y,until=m.buildStopUntil;
    while(s.gameTick<until-1){e.tick(s);assert.equal(m.x,x);assert.equal(m.y,y);assert.equal(m.siriusAct,undefined);}
    for(let i=0;i<8;i++)e.tick(s);
    assert.ok(m.x!==x||m.y!==y||m.siriusAct,'enemy resumes after stun');
  }
});

test('Halo wave has a fixed cast origin, pauses, expires and clears; blocked casts create no extra pulse',()=>{
  const{s}=fresh();const x=s.playerX,y=s.playerY;
  assert.equal(si.useHalo(s),true);assert.deepEqual(s.sirius.haloWave,{x,y,ticks:30});
  assert.equal(si.useHalo(s),false);assert.equal(s.sirius.haloWave.ticks,30);
  s.gamePhase='paused';si.updateSirius(s);assert.equal(s.sirius.haloWave.ticks,30);assert.equal(si.useHalo(s),false);
  s.gamePhase='playing';player(s,s.playerTileX+1,s.playerTileY);
  si.updateSirius(s);assert.equal(s.sirius.haloWave.x,x);assert.equal(s.sirius.haloWave.y,y);
  for(let i=1;i<30;i++)si.updateSirius(s);assert.equal(s.sirius.haloWave,undefined);
  s.sirius.haloCooldown=0;si.useHalo(s);si.clearSiriusEncounter(s);assert.equal(s.sirius.haloWave,undefined);
});

test('Halo with full Holy Light bursts: heavy unreduced damage to the Prayer, damage to every alien, Holy Light spent',()=>{
  const{s,boss}=fresh();const mob=e.createEncounterEnemy(s,'bellringer',3,3,500);s.enemies.push(mob);
  s.sirius.holy=100;const hp=boss.hp;si.useHalo(s);
  assert.equal(hp-boss.hp,S.burstBoss);assert.equal(500-mob.hp,S.burstAlien);assert.equal(s.sirius.holy,0);
  assert.ok(S.burstBoss>=S.runeDamage*3,'the burst stays a major share of the damage');
});

test('filling Holy Light resets the Halo cooldown',()=>{
  const{s}=fresh();s.sirius.haloCooldown=900;s.sirius.holy=99;si.updateSirius(s);assert.ok(s.sirius.haloCooldown>0);
  s.sirius.holy=100;si.updateSirius(s);assert.equal(s.sirius.haloCooldown,0);
});

test('god Phase buttons set the Prayer to the start of that phase',()=>{
  const{s,boss}=fresh();si.godSetSiriusPhase(s,3);assert.equal(boss.hp,S.phaseHP);assert.equal(s.sirius.phase,3);
  si.godSetSiriusPhase(s,1);assert.equal(boss.hp,S.phaseHP*3);assert.equal(s.sirius.phase,1);
});

test('Sirius Surge (F) fills Holy Light like a full bar of energy',()=>{
  const{s}=fresh();s.sirius.holy=20;s.specialSkill='blind_prayer';s.trial.cooldown=0;e.useSpecialSkill(s);
  assert.equal(Math.round(s.sirius.holy),20+Math.round(c.STAR_ENERGY_MAX*c.SIRIUS_HOLY_PER_ENERGY));
});

test('Mason raises a short wall ahead of you that sinks back to floor; never on you',()=>{
  const{s}=fresh();
  let spot=null;for(let y=3;y<c.MAP_ROWS-3&&!spot;y++)for(let x=3;x<c.MAP_COLS-6&&!spot;x++)if([0,1,2,3].every(k=>[-1,0,1].every(j=>e.isFloorTile(s.map,x+k,y+j)))&&c.chamberOfTile(x+2,y)>=0)spot=[x,y];
  player(s,spot[0],spot[1]);s.playerDirX=1;s.playerDirY=0;
  const m=e.createEncounterEnemy(s,'mason',spot[0]-3>0?spot[0]-3:spot[0],spot[1]+1,60);s.enemies.push(m);m.attackTimer=0;
  si.updateSiriusAlien(s,m);assert.ok(m.siriusAct?.tiles?.length,'it marks tiles first');
  for(let i=0;i<S.mason.windup;i++)si.updateSiriusAlien(s,m);
  assert.ok(s.sirius.walls.length>0);assert.equal(m.attackTimer,240);
  for(const w of s.sirius.walls){assert.equal(s.map[w.y][w.x],c.T_WALL);assert.equal(w.x,spot[0]+S.mason.ahead);}
  assert.ok(!s.sirius.walls.some(w=>w.x===s.playerTileX&&w.y===s.playerTileY));
  const walls=[...s.sirius.walls];for(let i=0;i<S.mason.wallTicks;i++)si.updateSirius(s);
  assert.equal(s.sirius.walls.length,0);for(const w of walls)assert.equal(s.map[w.y][w.x],c.T_FLOOR);
});

test('Masons join only from phase 2',()=>{
  const{s}=fresh();s.noMobs=false;const orig=Math.random;Math.random=()=>0.01;
  try{for(let i=0;i<40;i++){s.sirius.spawnTimer=1;si.updateSirius(s);}assert.equal(s.enemies.filter(x=>x.type==='mason').length,0);
    s.sirius.phase=2;s.sirius.masonSpawnTimer=1;s.enemies=s.enemies.filter(x=>x.type==='blind_prayer');for(let i=0;i<5;i++){s.sirius.spawnTimer=1;si.updateSirius(s);}
    assert.ok(s.enemies.some(x=>x.type==='mason'));}finally{Math.random=orig;}
});

test('phases 2 and 3 swap light and dark at the same faster rate',()=>{
  for(const phase of [2,3]){
  const{s}=fresh();si.godSetSiriusPhase(s,phase);s.sirius.lightTimer=1;si.updateSirius(s);
  assert.equal(s.sirius.lightTimer,960);
  }
});

test('later phase entry and older timers stay within the shorter light/dark duration without extending a nearly finished cycle',()=>{
  for(const phase of [2,3])for(const light of [false,true])for(const left of [30,light?S.lightTicks:S.darkTicks]){
    const{s,boss}=fresh();s.sirius.light=light;s.sirius.lightTimer=left;
    si.godSetSiriusPhase(s,phase);
    const duration=si.siriusLightDuration(s.sirius);
    assert.equal(duration,light?960:600);
    assert.equal(s.sirius.lightTimer,Math.min(left,duration));
    s.sirius.lightTimer=light?S.lightTicks:S.darkTicks;si.updateSirius(s);
    assert.equal(s.sirius.lightTimer,duration-1,'older timer is shortened on the first update');
    s.sirius.phase=1;s.sirius.lightTimer=left;boss.hp=(4-phase)*S.phaseHP;si.updateSirius(s);
    assert.equal(s.sirius.phase,phase);assert.equal(s.sirius.lightTimer,Math.min(left-1,duration));
  }
});

test('rune tracing allows 20 seconds in phases 1–2 and 25 seconds in phase 3',()=>{
  const{s}=fresh();si.godSiriusRune(s);assert.equal(s.sirius.rune.total,S.runeTicks);
  s.sirius.rune=null;s.sirius.phase=2;si.godSiriusRune(s);assert.equal(s.sirius.rune.total,20*60);
  s.sirius.rune=null;s.sirius.phase=3;si.godSiriusRune(s);assert.equal(s.sirius.rune.total,25*60);
});

test('runes get harder by phase: tier 1 in phase 1, tiers 2–3 in phase 3',()=>{
  const{s}=fresh();
  for(let i=0;i<30;i++){s.sirius.rune=null;si.godSiriusRune(s);assert.equal(si.RUNES[s.sirius.rune.index].tier,1);}
  s.sirius.phase=3;for(let i=0;i<30;i++){s.sirius.rune=null;si.godSiriusRune(s);assert.ok(si.RUNES[s.sirius.rune.index].tier>=2);}
});

test('a Penitent eats your trail from the oldest tile, and breaks it when it reaches you',()=>{
  const{s}=fresh();walk(s,[0,0,0,0]);const old=s.sirius.trail[1];
  const p=e.createEncounterEnemy(s,'penitent',old.x,old.y,60);s.enemies.push(p);p.x=(old.x+.5)*c.TILE_SIZE;p.y=(old.y+.5)*c.TILE_SIZE;
  const before=s.sirius.trail.length;si.updateSiriusAlien(s,p);
  assert.equal(s.sirius.trail.length,before-2,'it ate up to its tile');
  p.x=s.playerX;p.y=s.playerY;p.tileX=p.targetTileX=s.playerTileX;p.tileY=p.targetTileY=s.playerTileY;si.updateSiriusAlien(s,p);
  assert.equal(s.sirius.steps.length,0);
});

test('Sirius aliens go after a placed Ruby that is clearly closer, and their attacks hurt it',()=>{
  const{s}=fresh();s.playerCarryingRuby=false;
  let spot=null;for(let y=3;y<c.MAP_ROWS-3&&!spot;y++)for(let x=3;x<c.MAP_COLS-8&&!spot;x++)if([0,1,2,3,4,5].every(k=>e.isFloorTile(s.map,x+k,y)))spot=[x,y];
  s.rubyTileX=spot[0]+4;s.rubyTileY=spot[1];player(s,spot[0]+20<c.MAP_COLS?spot[0]:spot[0],spot[1]+8);
  const b=e.createEncounterEnemy(s,'bellringer',spot[0]+2,spot[1],70);s.enemies.push(b);b.attackTimer=0;
  si.updateSiriusAlien(s,b);assert.equal(b.targeting,'ruby');
  const hp=s.rubyHP;b.siriusAct={ticks:1,tx:b.tileX,ty:b.tileY,dx:0,dy:0,fromX:b.x,fromY:b.y,dashing:false};si.updateSiriusAlien(s,b);
  assert.ok(s.rubyHP<hp,'the ring hurts Ruby');
});

test('a meteor takes only 5% of a phase from the Prayer',()=>{
  const{s,boss}=fresh();const hp=boss.hp;
  const room=c.chamberOfTile(boss.tileX,boss.tileY);assert.ok(room>=0);
  s.meteoriteWarning=room;s.meteoriteStrikeIn=1;s.godMode=true;
  for(let i=0;i<3&&boss.hp===hp;i++)e.tick(s);
  assert.equal(hp-boss.hp,S.phaseHP*S.meteorShare);
});


test('Masons have their own spawn allowance, never replace other mobs, and stop at three',()=>{
 const{s}=fresh();s.sirius.phase=2;s.noMobs=false;
 const cap=Math.round(S.population*S.laterPhaseMore)+1;
 for(let i=s.enemies.length;i<cap;i++)s.enemies.push(e.createEncounterEnemy(s,'normal',39,39,20));
 const count=()=>s.enemies.filter(m=>m.type==='mason').length;
 const random=Math.random;
 try{
  Math.random=()=>.01;
  for(let i=0;i<4;i++){s.sirius.spawnTimer=s.sirius.masonSpawnTimer=1;si.updateSirius(s);}
  assert.equal(count(),3);assert.equal(s.enemies.filter(m=>m.type!=='mason').length,cap);
  const dead=s.enemies.find(m=>m.type==='normal');s.enemies=s.enemies.filter(m=>m!==dead);
  s.sirius.spawnTimer=1;si.updateSirius(s);
  assert.equal(s.enemies.filter(m=>m.type!=='mason').length,cap,'regular mob still spawns beside a full Mason allowance');
  s.noMobs=true;const timer=s.sirius.masonSpawnTimer;si.updateSirius(s);assert.equal(s.sirius.masonSpawnTimer,timer);
  s.noMobs=false;s.gamePhase='paused';si.updateSirius(s);assert.equal(s.sirius.masonSpawnTimer,timer);
 }finally{Math.random=random;}
});


test('Mason marks and raises four wall tiles on open ground, skipping occupied tiles',()=>{
 for(const blocked of [false,true]){
  const{s}=fresh();for(let y=6;y<=14;y++)for(let x=6;x<=15;x++)s.map[y][x]=c.T_FLOOR;
  player(s,9,9);s.playerDirX=1;s.playerDirY=0;s.rubyTileX=blocked?11:30;s.rubyTileY=blocked?8:30;
  const m=e.createEncounterEnemy(s,'mason',6,9,60);s.enemies.push(m);m.attackTimer=0;
  si.updateSiriusAlien(s,m);assert.equal(m.siriusAct.tiles.length,blocked?3:4);
  for(let i=0;i<S.mason.windup;i++)si.updateSiriusAlien(s,m);
  assert.equal(s.sirius.walls.length,blocked?3:4);assert.ok(s.sirius.walls.every(w=>w.x===11));
  if(blocked)assert.equal(s.map[8][11],c.T_FLOOR,'Ruby tile remains clear');
 }
});


test('expanded rune pools give every phase more variety while every pattern fits a valid continuous trail',()=>{
 for(const [phase,oldSize] of [[1,5],[2,8],[3,6]]){
  assert.ok(si.RUNES.filter(r=>si.runeTiers(phase).includes(r.tier)).length>oldSize);
 }
 const names=new Set(),patterns=new Set();
 for(const rune of si.RUNES){
  assert.ok(!names.has(rune.name));names.add(rune.name);
  const key=JSON.stringify(rune.strokes);assert.ok(!patterns.has(key));patterns.add(key);
  assert.ok(rune.tier===1?rune.strokes.length===3:rune.tier===2?rune.strokes.length===4:[5,6].includes(rune.strokes.length));
  const steps=expand(rune);assert.ok(steps.length+1<=S.trailMax);assert.equal(si.runeProgress(steps,rune).complete,true,rune.name);
  let x=0,y=0;const visited=new Set(['0,0']);
  for(const dir of steps){x+=si.RUNE_STEP[dir][0];y+=si.RUNE_STEP[dir][1];const tile=`${x},${y}`;assert.ok(!visited.has(tile),`${rune.name} cannot cross itself`);visited.add(tile);}
 }
});

test('rune centerline joins the actual route across tile gaps without joining touching strokes',()=>{
  const {createCanvas}=require('@napi-rs/canvas'),art=require('../game/sirius-art.ts');
  const canvas=createCanvas(160,160),ctx=canvas.getContext('2d');
  const key=si.RUNES.find(r=>r.name==='KEY');
  art.drawRuneTiles(ctx,key,80,80,128,0);
  const connected=ctx.getImageData(128,48,1,1).data;
  assert.ok(connected[0]>200&&connected[1]>200&&connected[3]===255,'line bridges the real downward turn');
  assert.equal(ctx.getImageData(96,48,1,1).data[3],0,'adjacent strokes have no misleading shortcut');
});
