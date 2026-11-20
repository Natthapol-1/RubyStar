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
  assert.equal(s.starEnergy,0);assert.ok(s.playerHP<80&&s.rubyHP<80,'a miss hurts you and Ruby');assert.equal(s.sirius.holy,holy-S.holyFailLoss);
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

test('Halo with full Holy Light bursts: heavy unreduced damage to the Prayer, damage to every alien, Holy Light spent',()=>{
  const{s,boss}=fresh();const mob=e.createEncounterEnemy(s,'bellringer',3,3,500);s.enemies.push(mob);
  s.sirius.holy=100;const hp=boss.hp;si.useHalo(s);
  assert.equal(hp-boss.hp,S.burstBoss);assert.equal(500-mob.hp,S.burstAlien);assert.equal(s.sirius.holy,0);
  assert.ok(S.burstBoss>=S.runeDamage*4,'the burst outweighs the runes that built it');
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

test('phase 3 swaps light and dark faster',()=>{
  const{s,boss}=fresh();si.godSetSiriusPhase(s,3);s.sirius.lightTimer=1;si.updateSirius(s);
  assert.equal(s.sirius.lightTimer,Math.round(S.lightTicks*S.phase3Swap));
});

test('rune tracing allows 20, 17 and 17 seconds across the three phases',()=>{
  const{s}=fresh();si.godSiriusRune(s);assert.equal(s.sirius.rune.total,S.runeTicks);
  s.sirius.rune=null;s.sirius.phase=2;si.godSiriusRune(s);assert.equal(s.sirius.rune.total,17*60);
  s.sirius.rune=null;s.sirius.phase=3;si.godSiriusRune(s);assert.equal(s.sirius.rune.total,17*60);
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
