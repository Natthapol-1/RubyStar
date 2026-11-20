const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const singularityTest={updateSingularity,updateEnemies,updatePlayer,initializeNewEncounter,spawnEnemy,updateMeteorite};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),maw=require('../game/singularity-maw.ts');
const SC=c.SINGULARITY_CHALLENGE;
const LONE=SC.loneBodyTicks;SC.loneBodyTicks=-1; // most tests set up single bodies on purpose: the lone-body rescue is off unless a test turns it on
// Lost Souls are held back unless a test wants them.
function fresh(){const s=e.createModeState('trial','devourer');e.godSpawnBoss(s,'devourer');s.noMobs=true;s.meteoriteTimer=1e6;s.trial.devourer.soulTimer=1e9;return s;}
const bodies=s=>s.enemies.filter(b=>b.type==='devourer'&&b.hp>0);
const souls=s=>s.enemies.filter(b=>b.type==='lost_soul'&&b.hp>0);
// A body with its spawn fuse cleared, so it does not burst on its own.
const calm=b=>{b.devourer.gorgeTicks=undefined;return b;};
function place(b,x,y){Object.assign(b,{tileX:x,targetTileX:x,tileY:y,targetTileY:y,x:(x+.5)*48,y:(y+.5)*48,stepProgress:0,path:[]});}
function player(s,x,y){Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*48,playerY:(y+.5)*48,playerStepProgress:0,playerKnockback:null});}
function emptyRoom(s){for(let y=2;y<20;y++)for(let x=2;x<20;x++)s.map[y][x]=c.T_FLOOR;}
function kill(s,b){b.hp=0;e.killEnemy(s,s.enemies.indexOf(b));}
// One Maw at a fixed spot in an open room, far from its move time; the second sits out of the way in the far chamber.
const mawAt=(x,y,forced='open')=>({x:(x+.5)*48,y:(y+.5)*48,tx:x,ty:y,room:c.chamberOfTile(x,y),ticks:5000,forced});
function setMaw(s,x,y){s.trial.devourer.maws=[mawAt(x,y),mawAt(40,40)];}
const tickMaws=(s,n=1)=>{for(let i=0;i<n;i++){s.gameTick++;maw.updateSingularityMaws(s);}};
const swarm=(s,n=1)=>{for(let i=0;i<n;i++)e.singularityTest.updateEnemies(s);};

test('three phases; each original spawns at the phase max stacks with a lit fuse; a phase clears when every body is gone',()=>{
 const s=fresh();assert.equal(s.trial.mapOnly,undefined);
 for(let phase=1;phase<=3;phase++){
  assert.equal(s.trial.devourer.phase,phase);
  const root=bodies(s)[0];assert.equal(root.maxHp,SC.phaseHP[phase-1]);assert.equal(root.chargeDirX,SC.maxStacks[phase-1]);
  assert.equal(root.devourer.gorgeTicks,SC.gorgeTicks);
  for(let guard=0;guard<200&&bodies(s).length&&s.trial.devourer.phase===phase&&s.gamePhase==='playing';guard++)kill(s,bodies(s)[0]);
 }
 assert.equal(s.gamePhase,'won');
});

test('the original bursts when its fuse runs out, flinging one stackless copy per stack across the map',()=>{
 const s=fresh();player(s,3,3);const root=bodies(s)[0];place(root,10,10);
 swarm(s,SC.gorgeTicks-1);assert.ok(s.enemies.includes(root),'still swelling');
 swarm(s,1);assert.ok(!s.enemies.includes(root),'burst');
 const copies=bodies(s);assert.equal(copies.length,SC.maxStacks[0]);
 for(const b of copies){assert.equal(b.chargeDirX,0);assert.equal(b.maxHp,SC.copyHP[0]);}
 assert.ok(copies.some(b=>Math.hypot(b.tileX-10,b.tileY-10)>=5),'flung far, not beside the body');
 assert.equal(s.trial.devourer.bursts.length,1);
});

test('each meal adds a stack and heals; full stacks light the fuse, and the burst leaves one copy per stack',()=>{
 const s=fresh();emptyRoom(s);player(s,3,3);const cap=SC.bodyStacks; // copies are full at bodyStacks
 const root=calm(bodies(s)[0]);root.chargeDirX=0;root.devourer.generation=1;root.maxHp=SC.copyHP[0];root.hp=20;place(root,8,8);root.windupTicks=0;
 s.enemies.push(e.createEncounterEnemy(s,'normal',8,8,20));swarm(s);
 assert.equal(bodies(s).length,1,'no split on a meal');assert.equal(root.chargeDirX,SC.mealStacks);assert.equal(root.maxHp,SC.copyHP[0]+SC.mealStacks*SC.stackHP);assert.equal(root.hp,root.maxHp,'healed');
 for(let k=1;k<Math.ceil(cap/SC.mealStacks);k++){root.windupTicks=0;place(root,8,8);s.enemies.push(e.createEncounterEnemy(s,'normal',8,8,20));swarm(s);}
 assert.equal(root.chargeDirX,cap);assert.equal(root.devourer.gorgeTicks,SC.gorgeTicks,'full: its fuse is lit');
 swarm(s,SC.gorgeTicks+1);assert.ok(!s.enemies.includes(root),'it burst');assert.equal(bodies(s).length,cap,'one copy per stack');
 for(const b of bodies(s)){assert.equal(b.maxHp,SC.copyHP[0]);assert.equal(b.chargeDirX,0);}
});

test('a stacked copy killed by hand leaves one copy per two stacks; a Maw swallows a full one without a split',()=>{
 const s=fresh(),root=calm(bodies(s)[0]);root.chargeDirX=5;root.devourer.generation=1;kill(s,root);assert.equal(bodies(s).length,3);
 const m=fresh();emptyRoom(m);setMaw(m,10,10);player(m,3,3);const full=calm(bodies(m)[0]);full.devourer.generation=1;full.chargeDirX=SC.maxStacks[0];full.devourer.gorgeTicks=60;place(full,10,10);
 const spare=e.createEncounterEnemy(m,'devourer',3,18,80);spare.devourer={generation:1,challenge:true};spare.encounterId=full.encounterId;m.enemies.push(spare);
 tickMaws(m);assert.ok(!m.enemies.includes(full));assert.deepEqual(bodies(m),[spare],'swallowed whole, no copies');
});
test('a copy killed by hand leaves nothing behind',()=>{
 const s=fresh(),root=calm(bodies(s)[0]);root.chargeDirX=0;root.devourer.generation=1;kill(s,root);
 assert.equal(s.trial.devourer.phase,2,'the only body is gone');assert.equal(bodies(s)[0].devourer.generation,0);
});

test('a stackless body never buds on its own',()=>{
 const s=fresh();emptyRoom(s);player(s,3,3);
 const root=calm(bodies(s)[0]);root.chargeDirX=0;place(root,10,10);root.devourer.splitTicks=c.DEVOURER_SELF_SPLIT_TICKS-1;
 swarm(s,5);assert.equal(bodies(s).length,1);
});

test('the Maw swallows a Devourer body of any size whole, without copies, and heals you',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,4,4);s.playerHP=50;
 const root=calm(bodies(s)[0]);root.devourer.generation=1;root.chargeDirX=SC.maxStacks[0];place(root,10,10); // a copy: originals are never swallowed
 tickMaws(s);
 assert.equal(s.trial.devourer.phase,2,'the only body is gone, so the phase advanced');assert.ok(s.playerHP>50);
 assert.equal(bodies(s).length,1,'only the new phase root: the eaten body left no copies');assert.equal(bodies(s)[0].devourer.generation,0);
});

test('the Maw leaves non-boss aliens alive at its centre',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,4,4);
 const a=e.createEncounterEnemy(s,'normal',10,10,20);s.enemies.push(a);tickMaws(s);
 assert.ok(s.enemies.includes(a));assert.equal(a.hp,20);
});

test('Lost Souls appear after their signs, never attack, die in one hit, are food for the swarm and are untouched by the Maw',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,3,3);s.noMobs=false;s.trial.devourer.soulTimer=undefined;
 tickMaws(s);s.trial.devourer.soulTimer=1e9;tickMaws(s,SC.soulWarnTicks);assert.equal(souls(s).length,SC.soulStart);
 assert.equal(c.ENEMY_CONFIGS.lost_soul.damageToPlayer,0);
 const one=souls(s)[0];e.damageEnemy(s,one,1);assert.ok(one.hp<=0,'one hit');s.enemies=s.enemies.filter(x=>x!==one);
 const fed=souls(s)[0];place(fed,10,10);tickMaws(s,SC.mawPulse*3);assert.ok(s.enemies.includes(fed)&&fed.hp>0,'the Maw never swallows a soul');
 const near=fed;place(near,12,10);near.singularityPull=undefined;tickMaws(s,SC.mawPulse*3);assert.equal(near.singularityPull,undefined,'nor pulls it');
 const root=calm(bodies(s)[0]);place(root,15,15);root.chargeDirX=0;root.windupTicks=0;
 const snack=souls(s)[0];place(snack,15,15);swarm(s);assert.ok(!s.enemies.includes(snack),'eaten by the swarm');assert.equal(root.chargeDirX,SC.mealStacks,'and it gained stacks');
});

test('enemies inside the pull radius are dragged toward the centre; enemies outside are not',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,3,3);
 const near=e.createEncounterEnemy(s,'normal',12,10,20),far=e.createEncounterEnemy(s,'normal',10,17,20);s.enemies.push(near,far);
 tickMaws(s,SC.mawPulse*2);
 assert.equal(near.singularityPull?.dx??(near.tileX<12?-1:0),-1,'pulled left toward the centre');
 assert.equal(far.singularityPull,undefined);
});

test('stepping onto the centre hurts you and throws you back out',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,10,10);s.playerHP=100;s.playerDirX=1;s.playerDirY=0;
 tickMaws(s);
 assert.equal(s.playerHP,100-SC.horizonDamage);assert.ok(s.playerKnockback);assert.equal(s.playerKnockback.tilesLeft,SC.horizonFling);
});

test('the two Maws stay in separate chambers, preview their next spot, then teleport there',()=>{
 for(const phase of [1,2,3]){const s=fresh();s.immortal=true;e.godSetSingularityPhase(s,phase);tickMaws(s); // immortal: the Jaw and gas must not end the run
 const ms=s.trial.devourer.maws;assert.equal(ms.length,2);assert.notEqual(ms[0].room,ms[1].room);
 const first=ms[0],from=[first.tx,first.ty,first.room];
 for(let i=0;i<SC.mawMoveTicks[0]*2&&!first.next;i++)tickMaws(s);
 assert.ok(first.next,'a preview appears');assert.notEqual(first.next.room,from[2],'to another chamber');assert.notEqual(first.next.room,ms[1].room,'not the other Maw room');
 for(let i=0;i<SC.mawMoveTicks[0]*2&&first.tx===from[0]&&first.ty===from[1];i++)tickMaws(s); // a failed spot pick retries, so wait for the move itself
 assert.notDeepEqual([first.tx,first.ty],[from[0],from[1]],'it teleported');assert.notEqual(first.room,from[2],'to another chamber');assert.notEqual(ms[0].room,ms[1].room);assert.ok(first.age<SC.mawCycle.closed*3,'and fades in again');}
});

test('a Maw never teleports while it is open',()=>{
 const s=fresh();tickMaws(s);const m=s.trial.devourer.maws[0];m.forced='open';m.ticks=50;const at=[m.tx,m.ty];
 tickMaws(s,400);assert.deepEqual([m.tx,m.ty],at);assert.equal(m.ticks,40,'held at the start of its fade-out');
 m.forced='closed';tickMaws(s,60);assert.notDeepEqual([m.tx,m.ty],at,'it goes once it rests');
});
test('the Gravity Hook latches the nearest body in range and sight, tows it behind you and blocks its own AI',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,18,18);player(s,10,10);s.rubyTileX=-1;
 const b=calm(bodies(s)[0]);b.chargeDirX=0;b.devourer.generation=1;b.windupTicks=999;place(b,14,10);
 assert.equal(maw.hookTarget(s),b);assert.equal(maw.pressGravityHook(s),true);assert.equal(s.trial.devourer.hook.id,b.id);
 assert.equal(maw.pressGravityHook(s),false,'one body at a time');
 for(let i=0;i<40;i++){tickMaws(s);swarm(s);}
 assert.ok(Math.hypot(b.tileX-10,b.tileY-10)<=2,'towed to you: '+b.tileX+','+b.tileY);
 const out=fresh();emptyRoom(out);player(out,10,10);const far=calm(bodies(out)[0]);far.devourer.generation=1;place(far,10+SC.hook.range+1,10);
 assert.equal(maw.hookTarget(out),undefined,'out of range');
 place(far,13,10);out.map[10][12]=c.T_WALL;assert.equal(maw.hookTarget(out),undefined,'out of sight');
 const orig=fresh();emptyRoom(orig);player(orig,10,10);place(bodies(orig)[0],12,10);assert.equal(maw.hookTarget(orig),undefined,'the original cannot be hooked');
});
test('releasing flings the body the way you face; it is swallowed on reaching a Maw, open or not',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(16,10,'closed'),mawAt(40,40)];player(s,10,10);s.rubyTileX=-1;
 const b=calm(bodies(s)[0]);b.chargeDirX=0;b.devourer.generation=1;b.windupTicks=999;place(b,9,10);
 const spare=e.createEncounterEnemy(s,'devourer',3,18,90);spare.devourer={generation:1,challenge:true};spare.encounterId=b.encounterId;s.enemies.push(spare);
 const hp=s.playerHP;s.playerHP=50;
 assert.ok(maw.pressGravityHook(s));s.playerDirX=1;s.playerDirY=0;maw.releaseGravityHook(s);
 assert.equal(s.trial.devourer.hook,undefined);assert.equal(s.trial.devourer.hookCooldown,SC.hook.cooldown);
 for(let i=0;i<120&&s.enemies.includes(b);i++){tickMaws(s);swarm(s);}
 assert.ok(!s.enemies.includes(b),'swallowed');assert.equal(b.devourer.consumed,true);assert.ok(s.playerHP>50,'and you healed');void hp;
});
test('phase health sums every living body against the phase capacity',()=>{
 const s=fresh(),root=calm(bodies(s)[0]);kill(s,root);
 const h=e.singularityTrialHealth(s),n=Math.ceil(SC.maxStacks[0]/SC.stacksPerCopy);
 assert.equal(h.bodies,n);assert.equal(h.hp,n*SC.copyHP[0]);assert.equal(h.max,SC.phaseHP[0]+n*SC.copyHP[0]);
});

test('no ordinary aliens spawn: only Lost Souls, the food, and the Soulless, which the swarm will not eat',()=>{
 const s=fresh();s.noMobs=false;s.immortal=true;s.noMobs=false;s.trial.devourer.soulTimer=undefined;
 for(let i=0;i<40;i++)e.singularityTest.spawnEnemy(s);
 let sawSoul=false;for(let i=0;i<600&&s.gamePhase==='playing';i++){e.tick(s);sawSoul||=s.enemies.some(x=>x.type==='lost_soul');} // the swarm may have eaten them all by the end
 assert.equal(s.enemies.filter(x=>x.type!=='devourer'&&x.type!=='lost_soul'&&x.type!=='soulless'&&x.type!=='toxic_soulless').length,0);
 assert.ok(sawSoul,'Lost Souls appeared');
});

test('god phase control restarts the swarm at the chosen phase with its full original',()=>{
 const s=fresh();kill(s,calm(bodies(s)[0]));assert.ok(bodies(s).length>1);
 e.godSetSingularityPhase(s,3);
 assert.equal(s.trial.devourer.phase,3);assert.equal(bodies(s).length,1);
 const root=bodies(s)[0];assert.equal(root.maxHp,SC.phaseHP[2]);assert.equal(root.chargeDirX,SC.maxStacks[2]);assert.equal(s.trial.devourer.defeatedMaxHp,0);
 tickMaws(s);assert.equal(s.trial.devourer.maws.length,2);
});

test('burst copies all start at the phase copy HP; weakening stops after the second generation',()=>{
 const s=fresh();emptyRoom(s);player(s,3,3);const b=calm(bodies(s)[0]);b.devourer.generation=1;b.chargeDirX=6;place(b,8,8);kill(s,b);
 for(const x of bodies(s))assert.equal(x.maxHp,SC.copyHP[0]);
 const scale=g=>e.devourerBodyScale({...b,chargeDirX:0,devourer:{...b.devourer,generation:g,gorgeTicks:undefined}});
 assert.equal(scale(3),scale(2));assert.equal(scale(4),scale(2));
});
test('without food a body flees from you when you are close, and roams away from you otherwise',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];s.rubyTileX=-1;player(s,10,10);
 const root=calm(bodies(s)[0]);root.chargeDirX=0;root.devourer.generation=1;place(root,13,10);root.pathTimer=0;root.windupTicks=999;swarm(s);
 const [fx,fy]=root.path[root.path.length-1];assert.ok(Math.hypot(fx-10,fy-10)>3,'close: it runs from you');
 player(s,3,3);place(root,15,15);root.pathTimer=0;root.devourer.roamTo=undefined;swarm(s);
 assert.ok(root.devourer.roamTo&&Math.hypot(root.devourer.roamTo[0]-3,root.devourer.roamTo[1]-3)>SC.fleeRadius,'far: it roams somewhere away from you');
});
test('a Maw never puts its chamber teleport pad inside its inner pull when it can avoid it',()=>{
 for(let i=0;i<20;i++){const s=fresh();tickMaws(s);
  for(const m of s.trial.devourer.maws){const [px,py]=c.TELEPORT_PADS[m.room];assert.ok(Math.hypot(m.tx-px,m.ty-py)>SC.mawInnerRadius);}}
});

test('the Maw never pulls in or swallows an original, so it always bursts',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,3,3);
 const root=bodies(s)[0];place(root,10,10);tickMaws(s,SC.mawPulse*4);
 assert.ok(s.enemies.includes(root),'not swallowed on the centre');assert.equal(s.trial.devourer.phase,1);
 place(root,12,10);root.singularityPull=undefined;tickMaws(s,SC.mawPulse*4);assert.equal(root.singularityPull,undefined,'not pulled');
});

test('every fixed Maw is fully visible after its fade-in',()=>{
 const art=require('../game/world-themes.ts');
 const s=fresh();tickMaws(s,40);
 for(const m of s.trial.devourer.maws)assert.equal(art.mawFade(m),1);

});

test('every Lost Soul is announced by a sign at its tile before it appears, anywhere on the map',()=>{
 const s=fresh();s.noMobs=false;s.trial.devourer.soulTimer=undefined;tickMaws(s);s.trial.devourer.soulTimer=1e9;
 const signs=[...s.trial.devourer.soulSigns];assert.equal(signs.length,SC.soulStart);assert.equal(souls(s).length,0,'nothing yet');
 tickMaws(s,SC.soulWarnTicks);
 assert.equal(s.trial.devourer.soulSigns.length,0);assert.equal(souls(s).length,SC.soulStart);
 for(const b of souls(s))assert.ok(signs.some(g=>Math.abs(g.tx-b.tileX)+Math.abs(g.ty-b.tileY)<=1),'appeared at its sign');

});

test('all phases share health and soul limits; Golden Souls appear only from phase 2',()=>{
 assert.equal(new Set(SC.phaseHP).size,1);assert.equal(new Set(SC.copyHP).size,1);
 const orig=Math.random;
 try{for(const phase of [1,2,3]){const s=fresh();e.godSetSingularityPhase(s,phase);s.noMobs=false;s.trial.devourer.soulTimer=undefined;Math.random=()=>.01; // every roll golden where allowed
  tickMaws(s,SC.soulSpawnTicks*8);assert.ok(souls(s).length<=SC.soulCap);assert.ok(souls(s).length>0);
  assert.equal(souls(s).some(x=>x.goldenSoul),phase>=SC.goldenFromPhase,'phase '+phase);}}finally{Math.random=orig;}
});

test('a body that eats a Golden Soul is filled to full stacks at once and lights its fuse',()=>{
 const s=fresh();emptyRoom(s);player(s,3,3);const b=calm(bodies(s)[0]);b.devourer.generation=1;b.chargeDirX=0;b.windupTicks=0;place(b,8,8);
 const g=e.createEncounterEnemy(s,'lost_soul',8,8,1);g.goldenSoul=true;g.windupTicks=1e6;s.enemies.push(g);swarm(s);
 assert.equal(b.chargeDirX,SC.bodyStacks);assert.equal(b.devourer.gorgeTicks,SC.gorgeTicks);
});


test('nearby food draws a body; with no food in range it never heads for you',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,40,10);s.rubyTileX=-1;player(s,3,15);
 const root=calm(bodies(s)[0]);root.chargeDirX=0;root.devourer.generation=1;place(root,10,10);root.windupTicks=999;
 const food=e.createEncounterEnemy(s,'lost_soul',12,12,1);food.windupTicks=1e6;s.enemies.push(food);
 root.pathTimer=0;swarm(s);assert.deepEqual(root.path[root.path.length-1],[12,12]);
 place(food,40,40);place(root,10,10);root.pathTimer=0;swarm(s);
 const [x,y]=root.path[root.path.length-1]??[10,10];assert.ok(Math.hypot(x-3,y-15)>SC.fleeRadius,'it roams away from you');
});
test('a bursting body is harder to pull than a normal one',()=>{
 const pulls=bursting=>{const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,3,3);
  const b=calm(bodies(s)[0]);b.devourer.generation=1;b.chargeDirX=0;if(bursting)b.devourer.gorgeTicks=1e6;let n=0;
  for(let i=0;i<400;i++){place(b,13,10);b.singularityPull=undefined;s.gameTick++;maw.updateSingularityMaws(s);if(b.singularityPull)n++;}
  return n;};
 assert.ok(pulls(true)<pulls(false));
});

test('a body has to walk over food to eat it',()=>{
 const s=fresh();emptyRoom(s);player(s,3,3);
 const root=calm(bodies(s)[0]);root.chargeDirX=0;root.devourer.generation=1;place(root,8,8);root.windupTicks=0;root.pathTimer=1e6;
 const food=e.createEncounterEnemy(s,'lost_soul',9,8,1);food.windupTicks=1e6;s.enemies.push(food);
 swarm(s);assert.ok(s.enemies.includes(food),'next to it: not eaten');
 place(food,8,8);swarm(s);assert.ok(!s.enemies.includes(food),'on its tile: eaten');
});




test("the full original's burst also hurts a placed Ruby and other bodies nearby, but spares Lost Souls",()=>{
  const s=fresh();emptyRoom(s);s.gamePhase='playing';const root=bodies(s)[0];place(root,10,10);player(s,18,18);
  s.rubyTileX=11;s.rubyTileY=10;s.playerCarryingRuby=false;const ruby=s.rubyHP;
  const other=e.createEncounterEnemy(s,'devourer',12,10,200);other.devourer={generation:1,challenge:true};s.enemies.push(other);
  root.devourer.gorgeTicks=1;e.tick(s);
  assert.equal(ruby-s.rubyHP,SC.burst.rubyDamage,'Ruby');
  assert.equal(other.maxHp-other.hp,SC.burst.enemyDamage,'a nearby body');
});

test('killing a Lost Soul heals you a little',()=>{
  const s=fresh();s.gamePhase='playing';s.playerHP=50;
  const soul=e.createEncounterEnemy(s,'lost_soul',12,12,SC.soulHP);s.enemies.push(soul);
  kill(s,soul);assert.equal(s.playerHP,50+SC.soulKillHeal);
});

test('a flung body slams into another or a wall: stun without damage',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,40,40);s.trial.devourer.maws=[mawAt(40,40),mawAt(41,41)];player(s,10,10);s.rubyTileX=-1;
 const b=calm(bodies(s)[0]);b.chargeDirX=0;b.devourer.generation=1;b.windupTicks=999;place(b,9,10);
 const o=e.createEncounterEnemy(s,'devourer',14,10,90);o.devourer={generation:1,challenge:true};o.encounterId=b.encounterId;o.windupTicks=999;o.devourer.stunTicks=10000;s.enemies.push(o); // hold the target still so this tests impact, independent of its walking speed
 maw.pressGravityHook(s);s.playerDirX=1;s.playerDirY=0;maw.releaseGravityHook(s);
 const hpB=b.hp,hpO=o.hp;for(let i=0;i<60&&!(b.devourer.stunTicks>0);i++){tickMaws(s);swarm(s);}
 assert.ok(o.devourer.stunTicks>0&&b.devourer.stunTicks>0,'both stunned');assert.equal(b.hp,hpB);assert.equal(o.hp,hpO);
 const w=fresh();emptyRoom(w);w.trial.devourer.maws=[mawAt(40,40),mawAt(41,41)];player(w,10,10);w.rubyTileX=-1;
 const x=calm(bodies(w)[0]);x.chargeDirX=0;x.devourer.generation=1;x.windupTicks=999;place(x,9,10);w.map[10][12]=c.T_WALL;
 maw.pressGravityHook(w);w.playerDirX=1;w.playerDirY=0;maw.releaseGravityHook(w);const hpX=x.hp;
 for(let i=0;i<60&&!(x.devourer.stunTicks>0);i++){tickMaws(w);swarm(w);}
 assert.ok(x.devourer.stunTicks>0,'stunned by the wall');assert.equal(x.hp,hpX);
});
test('the hook resets between rounds while Lost Souls carry over; paused gameplay freezes the hook',()=>{
 const s=fresh();emptyRoom(s);player(s,10,10);s.trial.devourer.maws=[mawAt(40,40),mawAt(41,41)];
 const root=calm(bodies(s)[0]);root.chargeDirX=0;root.devourer.generation=1;place(root,12,10);
 assert.ok(maw.pressGravityHook(s));const held=s.trial.devourer.hook.ticks;
 s.gamePhase='paused';tickMaws(s,60);assert.equal(s.trial.devourer.hook.ticks,held);
 s.gamePhase='playing';s.enemies.push(e.createEncounterEnemy(s,'lost_soul',15,15,1));kill(s,root);
 assert.equal(s.trial.devourer.phase,2);assert.equal(s.trial.devourer.hook,undefined);assert.equal(s.trial.devourer.hookCooldown,0);
 assert.equal(souls(s).length,1,'Lost Souls carry over into the next phase');
});
test('holding past the limit flings on its own and the hook is immediately ready again',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,18,18);player(s,10,10);s.rubyTileX=-1;
 const b=calm(bodies(s)[0]);b.chargeDirX=0;b.devourer.generation=1;b.windupTicks=999;place(b,12,10);
 assert.ok(maw.pressGravityHook(s));tickMaws(s,SC.hook.maxTicks);
 assert.equal(s.trial.devourer.hook,undefined,'auto release');assert.equal(s.trial.devourer.hookCooldown,0);
 place(b,12,10);b.devourer.stunTicks=0;s.trial.devourer.flings=[];assert.equal(maw.pressGravityHook(s),true);
});

test('each Maw idles small, warns, then opens wide; the two are half a cycle apart; you are pulled only while one is open',()=>{
 const s=fresh();tickMaws(s);const [a,b]=s.trial.devourer.maws,C=SC.mawCycle,total=C.closed+C.warn+C.open;
 assert.equal(maw.mawWindow(a).state,'closed');assert.equal(maw.mawReach(s,a),SC.mawRadius);
 a.age=C.closed;assert.equal(maw.mawWindow(a).state,'warn');a.age=C.closed+C.warn;assert.equal(maw.mawWindow(a).state,'open');assert.ok(maw.mawReach(s,a)<SC.mawOpenRadius,'its reach eases in');a.age=C.closed+C.warn+C.open/2;assert.equal(maw.mawReach(s,a),SC.mawOpenRadius);
 assert.equal(b.offset-a.offset,Math.floor(total/2));
 const q=fresh();emptyRoom(q);q.trial.devourer.maws=[mawAt(10,10,'closed'),mawAt(40,40,'closed')];player(q,12,10);let pulls=0;
 for(let i=0;i<300;i++){q.playerKnockback=null;tickMaws(q);if(q.playerKnockback)pulls++;}assert.equal(pulls,0,'closed: no pull from two tiles away');
 q.trial.devourer.maws[0].forced='open';for(let i=0;i<300;i++){q.playerKnockback=null;tickMaws(q);if(q.playerKnockback)pulls++;}assert.ok(pulls>0,'open: it pulls you');
});

test('swallowing bodies in quick succession builds a Feast chain that heals more each time',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,3,3);s.playerHP=10;s.rubyHP=10;
 const heals=[];for(let k=0;k<3;k++){const x=e.createEncounterEnemy(s,'devourer',10,10,90);x.devourer={generation:1,challenge:true};x.encounterId=s.trial.devourer.encounterId;s.enemies.push(x);const before=s.playerHP;tickMaws(s);heals.push(s.playerHP-before);s.playerHP=10;}
 assert.equal(s.trial.devourer.feast.count,3);assert.ok(heals[1]>heals[0]&&heals[2]>heals[1],String(heals));
 tickMaws(s,SC.feastWindow+80);const x=e.createEncounterEnemy(s,'devourer',10,10,90);x.devourer={generation:1,challenge:true};x.encounterId=s.trial.devourer.encounterId;s.enemies.push(x);tickMaws(s);
 assert.equal(s.trial.devourer.feast.count,1,'the chain resets after a pause');
});

test('a Lost Soul runs from you when you come close',()=>{
 const s=fresh();emptyRoom(s);player(s,10,10);s.enemies=s.enemies.filter(x=>x.type!=='devourer');
 const soul=e.createEncounterEnemy(s,'lost_soul',12,10,1);s.enemies.push(soul);
 for(let i=0;i<40;i++)maw.updateLostSoul(s,soul);
 assert.ok(Math.hypot(soul.tileX-10,soul.tileY-10)>2,'moved away: '+soul.tileX+','+soul.tileY);
});

test('a throw launches from you along your facing and bends toward a Maw near that line, not one off to the side',()=>{
 const run=(mx,my)=>{const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(mx,my,'closed'),mawAt(40,40,'closed')];player(s,8,10);s.rubyTileX=-1;
  const b=calm(bodies(s)[0]);b.chargeDirX=0;b.devourer.generation=1;b.windupTicks=999;place(b,6,10);
  const spare=e.createEncounterEnemy(s,'devourer',3,18,90);spare.devourer={generation:1,challenge:true};spare.encounterId=b.encounterId;s.enemies.push(spare);
  maw.pressGravityHook(s);s.playerDirX=1;s.playerDirY=0;maw.releaseGravityHook(s);
  assert.deepEqual([b.tileX,b.tileY],[8,10],'thrown from your tile');
  for(let i=0;i<120&&s.enemies.includes(b);i++){tickMaws(s);swarm(s);}
  return !s.enemies.includes(b);};
 assert.ok(run(13,12),'about 22 degrees off: auto-aimed into the Maw');
 assert.ok(!run(12,15),'about 51 degrees off: not aimed');
});


test('F stays where you cast it, even beside a Maw, and keeps its own reach, damage and cooldown',()=>{
 const s=fresh();emptyRoom(s);setMaw(s,10,10);player(s,13,10);s.specialSkill='devourer';
 assert.equal(e.useSpecialSkill(s),true);for(let i=0;i<120;i++)e.singularityTest.updateSingularity(s);
 assert.equal(s.singularity.x,13.5*48);assert.equal(s.singularity.y,10.5*48,'not drawn into the Maw');
 const a=e.createEncounterEnemy(s,'normal',15,10,100);s.enemies.push(a);s.singularity.damageTimer=1;e.singularityTest.updateSingularity(s);assert.ok(a.hp<100,'damages within its reach');
 assert.equal(c.trialSkillCooldown('devourer'),12*60);assert.equal(s.singularity.maxTicks,SC.fTicks,'half as long here');
});

test('a copy pulled to the F centre is swallowed like at a Maw: gone for good, and it heals you',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40),mawAt(41,41)];player(s,6,6);s.specialSkill='devourer';s.playerHP=40;
 const b=calm(bodies(s)[0]);b.devourer.generation=1;b.chargeDirX=0;b.windupTicks=999;b.devourer.stunTicks=1e9;place(b,9,6); // stunned: only the pull moves it
 const spare=e.createEncounterEnemy(s,'devourer',3,18,90);spare.devourer={generation:1,challenge:true};spare.encounterId=b.encounterId;s.enemies.push(spare);
 assert.ok(e.useSpecialSkill(s));player(s,3,3);
 for(let i=0;i<400&&s.enemies.includes(b);i++){e.singularityTest.updateSingularity(s);tickMaws(s);swarm(s);}
 assert.ok(!s.enemies.includes(b),'swallowed at the centre');assert.equal(b.devourer.consumed,true);assert.ok(s.playerHP>40,'healed');
 const o=fresh();emptyRoom(o);player(o,6,6);o.specialSkill='devourer';const orig=calm(bodies(o)[0]);place(orig,6,6);e.useSpecialSkill(o);player(o,3,3);
 for(let i=0;i<30;i++)e.singularityTest.updateSingularity(o);assert.ok(o.enemies.includes(orig),'the original is never swallowed');
});

test('the Jaw marks the ground under you, then bites: caught, you are thrown to the far side of its centre, with no stun',()=>{
 const J=SC.jaw,run=(ox,oy,move)=>{const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,10,10);s.playerHP=100;
  s.trial.devourer.jawTimer=1;tickMaws(s);const jaw=s.trial.devourer.jaw;assert.deepEqual([jaw.tx,jaw.ty],[10,10],'under you');
  player(s,10+ox,10+oy);if(move)player(s,13,10);tickMaws(s,J.warn);return s;};
 let s=run(-1,0,false);assert.equal(s.playerHP,100-J.damage);assert.equal(s.playerKnockback.dirX,1,'left of centre: thrown right');assert.equal(s.playerKnockback.tilesLeft,J.knock+1);
 s.playerKnockback=null;tickMaws(s);assert.ok(!(s.playerFrozenTicks>0),'no stun once you land');
 s=run(0,1,false);assert.equal(s.playerKnockback.dirY,-1,'below centre: thrown up');
 s=run(0,0,true);assert.equal(s.playerHP,100,'stepped out: it bites empty air');assert.equal(s.playerKnockback,null);
});

test('now and then a copy blinks to a random spot on the map, away from you; the original never does',()=>{
 const s=fresh();player(s,10,10);const orig=calm(bodies(s)[0]);const at=[orig.tileX,orig.tileY];
 const b=e.createEncounterEnemy(s,'devourer',orig.tileX,orig.tileY,100);b.devourer={generation:1,challenge:true,jumpTicks:1};b.encounterId=orig.encounterId;b.windupTicks=999;s.enemies.push(b);
 orig.devourer.jumpTicks=1;swarm(s);
 assert.notDeepEqual([b.tileX,b.tileY],at,'it jumped');assert.ok(Math.hypot(b.tileX-10,b.tileY-10)>=SC.bodyJump.minFromYou,'away from you');
 assert.deepEqual([orig.tileX,orig.tileY],at,'the original stays');
});

test('toxic gas from phase 2: clouds drift and re-form elsewhere; inside one you are slowed',()=>{
 const s1=fresh();tickMaws(s1,5);assert.equal((s1.trial.devourer.gas??[]).length,0,'none in phase 1');
 const s=fresh();e.godSetSingularityPhase(s,2);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];tickMaws(s);
 assert.equal(s.trial.devourer.gas.length,SC.gas.count);
 const g=s.trial.devourer.gas[0];g.ticks=g.max/2;player(s,Math.floor(g.x/48),Math.floor(g.y/48));
 assert.equal(maw.gasPlayerSlow(s),SC.gas.slow,'you are slowed inside');
 player(s,1,1);s.trial.devourer.gas=[];assert.equal(maw.gasPlayerSlow(s),1);
 const one=fresh();e.godSetSingularityPhase(one,2);tickMaws(one);const first=one.trial.devourer.gas[0];first.ticks=1;tickMaws(one);
 assert.ok(!one.trial.devourer.gas.includes(first)&&one.trial.devourer.gas.length===SC.gas.count,'a spent cloud is replaced');
});

test('a Devourer touching the gas bursts at once: with stacks into copies, without them it is flung elsewhere',()=>{
 const setup=stacks=>{const s=fresh();e.godSetSingularityPhase(s,2);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,3,3);
  const orig=calm(bodies(s)[0]);orig.hp=0;s.enemies=s.enemies.filter(x=>x!==orig);
  const b=e.createEncounterEnemy(s,'devourer',20,20,100);b.devourer={generation:1,challenge:true};b.encounterId=s.trial.devourer.encounterId;b.chargeDirX=stacks;s.enemies.push(b);
  const spare=e.createEncounterEnemy(s,'devourer',3,18,100);spare.devourer={generation:1,challenge:true};spare.encounterId=b.encounterId;s.enemies.push(spare);
  s.trial.devourer.gas=[{x:20.5*48,y:20.5*48,vx:0,vy:0,ticks:500,max:1000,seed:1}];tickMaws(s);return{s,b,spare};};
 let {s,b}=setup(3);assert.ok(!s.enemies.includes(b),'with stacks: it burst');assert.equal(bodies(s).length,1+3,'into one copy per stack');
 ({s,b}=setup(0));assert.ok(s.enemies.includes(b),'no stacks: it survives');assert.ok(Math.hypot(b.tileX-20,b.tileY-20)>2,'flung elsewhere');assert.equal(maw.gasDepth(s,b.x,b.y),0,'clear of the gas');
});

test('a resting Maw pulls you only from the tiles right around its centre',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(10,10,'closed'),mawAt(40,40,'closed')];player(s,11,11);let pulls=0;
 for(let i=0;i<300;i++){s.playerKnockback=null;player(s,11,11);tickMaws(s);if(s.playerKnockback)pulls++;}assert.ok(pulls>0,'next to it: pulled');
});

test('Soulless spawn after a grey sign up to the phase cap, hunt you, and the swarm never eats them',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,3,3);
 s.noMobs=false;s.trial.devourer.soullessTimer=1;tickMaws(s);const sign=s.trial.devourer.soulSigns.find(g=>g.hollow);assert.ok(sign,'a grey sign first');
 tickMaws(s,SC.soulWarnTicks);assert.equal(s.enemies.filter(x=>x.type==='soulless').length,1);
 for(let i=0;i<SC.soulless.everyTicks*6;i++)tickMaws(s);assert.ok(s.enemies.filter(x=>x.type==='soulless').length<=SC.soulless.cap[0],'capped');
 const root=calm(bodies(s)[0]);root.devourer.generation=1;root.chargeDirX=0;root.windupTicks=0;place(root,10,10);
 const husk=e.createEncounterEnemy(s,'soulless',10,10,30);s.enemies.push(husk);swarm(s);assert.ok(s.enemies.includes(husk),'not eaten');assert.equal(root.chargeDirX,0);
});

test('each repeatable Singularity sound plays at most once per cooldown, kinds apart',()=>{
 const s=fresh();assert.ok(e.devourerSoundAllowed(s,'boom'));assert.ok(!e.devourerSoundAllowed(s,'boom'),'blocked right after');
 assert.ok(e.devourerSoundAllowed(s,'bite'),'another kind still plays');
 s.gameTick+=SC.soundGap;assert.ok(e.devourerSoundAllowed(s,'boom'),'free again after the gap');
});

test('drifting and Contaminated Soulless gas slow you without damaging player or Ruby',()=>{
 for(const still of [false,true]){
  const s=fresh();e.godSetSingularityPhase(s,2);s.enemies=[];s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,10,10);s.playerHP=100;s.rubyHP=100;s.rubyTileX=10;s.rubyTileY=10;
  s.trial.devourer.gas=[{x:10.5*48,y:10.5*48,vx:0,vy:0,ticks:5000,max:10000,seed:1,still,r:still?SC.soulless.cloudRadius:SC.gas.radius}];
  tickMaws(s,120);assert.equal(s.playerHP,100);assert.equal(s.rubyHP,100);assert.equal(maw.gasPlayerSlow(s),SC.gas.slow);
 }
});

test('the Jaw also swallows any enemy caught in it, but never the original',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,3,3);
 const orig=calm(bodies(s)[0]);place(orig,11,10);
 const copy=e.createEncounterEnemy(s,'devourer',10,10,100);copy.devourer={generation:1,challenge:true};copy.encounterId=orig.encounterId;s.enemies.push(copy);
 const husk=e.createEncounterEnemy(s,'soulless',9,11,30);s.enemies.push(husk);
 s.trial.devourer.jaw={tx:10,ty:10,ticks:1,snap:SC.jaw.snap};tickMaws(s);
 assert.ok(!s.enemies.includes(copy)&&copy.devourer.consumed,'the copy is swallowed');assert.ok(!s.enemies.includes(husk),'and the Soulless');assert.ok(s.enemies.includes(orig),'the original stays');
});

test('a Toxic Soulless fights like a Soulless and leaves a still, larger gas cloud where it dies',()=>{
 const s=fresh();emptyRoom(s);e.godSetSingularityPhase(s,2);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,3,3);
 const t=e.createEncounterEnemy(s,'toxic_soulless',12,12,30);s.enemies.push(t);t.hp=0;e.killEnemy(s,s.enemies.indexOf(t));
 const cloud=s.trial.devourer.gas.find(g=>g.still);assert.ok(cloud,'a still cloud');assert.equal(cloud.r,SC.soulless.cloudRadius);
 const at=[cloud.x,cloud.y];tickMaws(s,60);assert.deepEqual([cloud.x,cloud.y],at,'it does not drift');
});

test('a Devourer you hit drops its food and hunts you for a while',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,4,10);s.rubyTileX=-1;
 const b=calm(bodies(s)[0]);b.devourer.generation=1;b.chargeDirX=0;b.windupTicks=999;place(b,12,10);
 const food=e.createEncounterEnemy(s,'lost_soul',15,10,1);food.windupTicks=1e6;s.enemies.push(food);
 b.pathTimer=0;swarm(s);assert.deepEqual(b.path[b.path.length-1],[15,10],'heads for food first');
 e.damageEnemy(s,b,1,'player');assert.equal(b.devourer.aggroTicks,SC.aggroTicks);
 swarm(s);assert.deepEqual(b.path[b.path.length-1],[4,10],'after a hit it hunts you');
 b.devourer.aggroTicks=1;player(s,3,3);swarm(s);b.pathTimer=0;swarm(s);assert.deepEqual(b.path[b.path.length-1],[15,10],'then back to food');
});
test('phase 3 Gnashers: only in phase 3; a bite bursts a stacked body with double stacks or splits a stackless one',()=>{
 const orig=Math.random;
 try{Math.random=()=>.01;const s1=fresh();assert.equal(maw.rollGnasher(s1),false,'not in phase 1');
  const s3=fresh();e.godSetSingularityPhase(s3,3);assert.equal(maw.rollGnasher(s3),true,'phase 3');}finally{Math.random=orig;}
 const mk=(stacks)=>{const s=fresh();e.godSetSingularityPhase(s,3);emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,3,3);
  const o=calm(bodies(s)[0]);place(o,18,18);
  const g=e.createEncounterEnemy(s,'devourer',10,10,100);g.devourer={generation:1,challenge:true,gnasher:true,biteTicks:0};g.encounterId=o.encounterId;s.enemies.push(g);
  const v=e.createEncounterEnemy(s,'devourer',11,10,100);v.devourer={generation:1,challenge:true};v.encounterId=o.encounterId;v.chargeDirX=stacks;s.enemies.push(v);
  maw.gnasherBite(s,g);return{s,v,g};};
 let {s,v}=mk(2);assert.ok(!s.enemies.includes(v),'stacked: it burst');assert.equal(bodies(s).length,2+4,'with double stacks: four copies');
 ({s,v}=mk(0));assert.ok(s.enemies.includes(v),'stackless: it stays');assert.equal(bodies(s).length,4,'and splits into two');
});

test('a bursting body can still burst while it is being pulled',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,3,3);
 const o=calm(bodies(s)[0]);place(o,18,18);
 const b=e.createEncounterEnemy(s,'devourer',10,10,100);b.devourer={generation:1,challenge:true,gorgeTicks:3};b.encounterId=o.encounterId;b.chargeDirX=3;s.enemies.push(b);
 for(let i=0;i<5;i++){if(!b.singularityPull)b.singularityPull={started:false,dx:1,dy:0,speed:2};swarm(s);}
 assert.ok(!s.enemies.includes(b),'it burst mid-pull');
});

test('early in a phase a lone body bursts at once with the phase full stacks; after 30s it does not',()=>{
 SC.loneBodyTicks=LONE;
 try{const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(s,3,3);
  const orig=calm(bodies(s)[0]);orig.devourer.generation=1;orig.chargeDirX=0;place(orig,10,10);
  tickMaws(s);assert.ok(!s.enemies.includes(orig),'the lone body burst');assert.equal(bodies(s).length,SC.maxStacks[0],'into the phase full stacks');
  const late=fresh();emptyRoom(late);late.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];player(late,3,3);
  const b=calm(bodies(late)[0]);b.devourer.generation=1;b.chargeDirX=0;place(b,10,10);late.gameTick+=LONE+1;tickMaws(late);assert.ok(late.enemies.includes(b),'after 30s it is left alone');
 }finally{SC.loneBodyTicks=-1;}
});

test('with no food in range, a jumping body can land beside a distant Lost Soul',()=>{
 const orig=Math.random;
 try{Math.random=()=>.01;const s=fresh();emptyRoom(s);player(s,3,3);const o=calm(bodies(s)[0]);place(o,5,18);
  const b=e.createEncounterEnemy(s,'devourer',4,4,100);b.devourer={generation:1,challenge:true,jumpTicks:1};b.encounterId=o.encounterId;b.windupTicks=999;s.enemies.push(b);
  const g=e.createEncounterEnemy(s,'lost_soul',40,40,1);g.windupTicks=1e6;s.enemies.push(g);
  swarm(s);assert.ok(Math.abs(b.tileX-40)+Math.abs(b.tileY-40)===1,'landed beside the soul: '+b.tileX+','+b.tileY);}finally{Math.random=orig;}
});

test('a body crowding another steps away from it, unless food is right there',()=>{
 const s=fresh();emptyRoom(s);player(s,3,3);const a=calm(bodies(s)[0]);a.devourer.generation=1;place(a,10,10);
 const b=e.createEncounterEnemy(s,'devourer',11,10,100);b.devourer={generation:1,challenge:true};b.encounterId=a.encounterId;s.enemies.push(b);
 assert.deepEqual(maw.bodySpreadStep(s,a),[9,10],'steps away from its neighbour');
 place(b,14,10);assert.equal(maw.bodySpreadStep(s,a),null,'not crowded: no step');
 place(b,11,10);const g=e.createEncounterEnemy(s,'lost_soul',10,12,1);s.enemies.push(g);assert.equal(maw.bodySpreadStep(s,a),null,'food right there: it stays');
});
test('hooking a flickering body cancels its jump; a body in mid-jump cannot be hooked',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];s.rubyTileX=-1;player(s,10,10);
 const b=calm(bodies(s)[0]);b.devourer.generation=1;b.chargeDirX=0;b.windupTicks=999;place(b,13,10);b.devourer.jumpTicks=2;
 assert.equal(maw.pressGravityHook(s),true);
 for(let i=0;i<20;i++){tickMaws(s);swarm(s);}
 assert.ok(!b.devourer.landTicks,'it did not jump while hooked');
 assert.ok(b.devourer.jumpTicks===undefined||b.devourer.jumpTicks>SC.bodyJump.warn,'its pending jump was cancelled');
 const out=fresh();emptyRoom(out);player(out,10,10);const air=calm(bodies(out)[0]);air.devourer.generation=1;place(air,13,10);air.devourer.landTicks=10;
 assert.equal(maw.hookTarget(out),undefined,'mid-jump bodies cannot be hooked');
});


test('a meteor destroys the stacked copies in its chamber without offspring, spares the original and other chambers',()=>{
 const s=fresh(),root=calm(bodies(s)[0]);place(root,10,10);
 const copy=e.createEncounterEnemy(s,'devourer',12,12,1000);copy.encounterId=root.encounterId;copy.devourer={...root.devourer,generation:1};copy.chargeDirX=5;s.enemies.push(copy);
 const survivor=e.createEncounterEnemy(s,'devourer',39,10,130);survivor.encounterId=root.encounterId;survivor.devourer={...root.devourer,generation:1};survivor.chargeDirX=0;s.enemies.push(survivor);
 s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.singularityTest.updateMeteorite(s);
 assert.deepEqual(bodies(s).map(b=>b.id).sort(),[root.id,survivor.id].sort());assert.equal(survivor.hp,130);assert.equal(s.trial.devourer.phase,1);
});

test('a meteor clearing the last Devourer copy advances only one phase',()=>{
 const s=fresh(),root=calm(bodies(s)[0]);s.enemies=s.enemies.filter(x=>x!==root);
 const last=e.createEncounterEnemy(s,'devourer',10,10,130);last.encounterId=root.encounterId;last.devourer={...root.devourer,generation:1};last.chargeDirX=0;s.enemies.push(last);
 s.meteoriteWarning=0;s.meteoriteStrikeIn=1;e.singularityTest.updateMeteorite(s);
 assert.equal(s.trial.devourer.phase,2);assert.equal(bodies(s).length,1);assert.notEqual(bodies(s)[0].id,last.id);assert.ok(bodies(s)[0].hp>0);
});


test('a thrown copy enters F inner reach and is consumed mid-step, but outer reach and expired fields do not consume it',()=>{
 for(const [distance,ticks,consumed] of [[1.9,100,true],[2.1,100,false],[1.9,0,false]]){
  const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40),mawAt(41,41)];
  const b=calm(bodies(s)[0]);b.devourer.generation=1;b.chargeDirX=3;place(b,10,10);
  const spare=e.createEncounterEnemy(s,'devourer',3,18,130);spare.encounterId=b.encounterId;spare.devourer={generation:1,challenge:true};s.enemies.push(spare);
  s.singularity={x:b.x+distance*c.TILE_SIZE,y:b.y,ticks,maxTicks:100,pullTimer:10,damageTimer:60};
  s.trial.devourer.flings=[{id:b.id,ax:16,ay:10,dx:1,dy:0,left:6,moved:1}];
  b.singularityPull={started:true,dx:1,dy:0,speed:11};s.playerHP=40;
  tickMaws(s);
  assert.equal(!s.enemies.includes(b),consumed);
  if(consumed){assert.equal(b.devourer.consumed,true);assert.deepEqual(bodies(s).map(x=>x.id),[spare.id]);assert.equal(s.trial.devourer.flings.length,0);assert.ok(s.playerHP>40);}
 }
});


test('eating grants a temporary movement boost that refreshes and expires without stacking',()=>{
 const s=fresh();emptyRoom(s);player(s,3,3);
 const b=calm(bodies(s)[0]);b.chargeDirX=0;b.devourer.generation=1;b.devourer.jumpTicks=9999;place(b,8,8);b.windupTicks=0;
 const eat=()=>{place(b,8,8);b.windupTicks=0;s.enemies.push(e.createEncounterEnemy(s,'lost_soul',8,8,1));swarm(s);};
 eat();assert.equal(b.devourer.mealSpeedTicks,SC.mealSpeedTicks);
 b.devourer.mealSpeedTicks=60;eat();assert.equal(b.devourer.mealSpeedTicks,SC.mealSpeedTicks,'refreshes');
 const step=()=>{place(b,8,8);b.targetTileX=9;b.pathTimer=999;b.windupTicks=999;swarm(s);return b.stepProgress;};
 const boosted=step();b.devourer.mealSpeedTicks=1;const normal=step();
 assert.equal(b.devourer.mealSpeedTicks,0);assert.ok(Math.abs(boosted/normal-SC.mealSpeed)<1e-9,'one multiplier only, removed when duration expires');
});


function convergenceSetup(phase,count){
 const s=fresh();e.godSetSingularityPhase(s,phase);s.enemies=[];s.playerHP=100;s.rubyHP=100;s.trial.devourer.convergenceTimer=0;
 for(let i=0;i<count;i++){const b=e.createEncounterEnemy(s,'devourer',3+i%15,3+Math.floor(i/15),130);b.encounterId=s.trial.devourer.encounterId;b.devourer={generation:1,challenge:true};b.chargeDirX=i%3;s.enemies.push(b);}
 return s;
}
test('convergence preserves each living body and stack; full cap deals exactly 30 player and 15 Ruby damage once in every phase',()=>{
 const C=SC.convergence;
 for(const phase of [1,2,3]){
  const s=convergenceSetup(phase,SC.familyCap[phase-1]),t=s.trial.devourer;
  const before=bodies(s).map(b=>[b.id,b.hp,b.maxHp,b.chargeDirX]);
  assert.equal(maw.updateConvergence(s,t),true);assert.equal(t.convergence.stage,'gather');
  assert.equal(bodies(s).filter(b=>b.devourer.merging).length,1,'only the body whose turn started is frozen');
  for(let i=0,n=t.convergence.gatherTicks-1;i<n;i++)maw.updateConvergence(s,t);assert.equal(t.convergence.stage,'gather');assert.equal(s.playerHP,100);
  maw.updateConvergence(s,t); // final arrival immediately explodes, without a charge delay
  assert.equal(t.convergence.stage,'blast');assert.equal(s.playerHP,70);assert.equal(s.rubyHP,85);
  assert.deepEqual(bodies(s).map(b=>[b.id,b.hp,b.maxHp,b.chargeDirX]),before);
  assert.ok(bodies(s).every(b=>!b.devourer.merging&&b.devourer.landTicks>0));
  for(let i=0;i<C.blastTicks;i++)maw.updateConvergence(s,t);assert.equal(t.convergence,undefined);assert.equal(s.playerHP,70);
 }
});
test('convergence pauses; its giant body is invincible, cannot be hooked, pulled or eaten, and reset clears it',()=>{
 const s=convergenceSetup(1,10),t=s.trial.devourer;maw.updateConvergence(s,t);
 const ticks=t.convergence.ticks;s.gamePhase='rules';maw.updateConvergence(s,t);assert.equal(t.convergence.ticks,ticks);s.gamePhase='playing';
 const victim=bodies(s)[0],hp=victim.hp;
 for(const source of ['player','special','meteor','enemy','reflection','summon'])e.damageEnemy(s,victim,100000,source);
 e.killEnemy(s,s.enemies.indexOf(victim));assert.equal(victim.hp,hp);assert.equal(bodies(s).length,10);assert.notEqual(maw.hookTarget(s),victim);
 s.singularity={x:victim.x,y:victim.y,ticks:300,maxTicks:300,pullTimer:1,damageTimer:1};e.singularityTest.updateSingularity(s);
 assert.equal(victim.singularityPull,undefined);assert.equal(victim.hp,hp);assert.equal(bodies(s).length,10);
 const ch=c.chamberOfTile(victim.tileX,victim.tileY);player(s,ch===0?39:10,10);s.rubyTileX=-1;s.meteoriteWarning=ch;s.meteoriteStrikeIn=1;e.singularityTest.updateMeteorite(s);
 assert.equal(victim.hp,hp);const remaining=bodies(s).length;
 for(let i=0,n=t.convergence.gatherTicks;i<n;i++)maw.updateConvergence(s,t);
 assert.equal(t.convergence.stage,'blast');assert.equal(bodies(s).length,remaining);
 e.godSetSingularityPhase(s,2);assert.equal(s.trial.devourer.convergence,undefined);assert.ok(bodies(s).every(b=>!b.devourer.merging));
});
test('a fractional damaging hit kills an ordinary or Golden Soul',()=>{
 for(const golden of [false,true]){const s=fresh(),soul=e.createEncounterEnemy(s,'lost_soul',8,8,1);soul.goldenSoul=golden;s.enemies.push(soul);e.damageEnemy(s,soul,.001);assert.ok(soul.hp<=0);}
});


test('Gravity Hook grabs Souls, Soulless, Contaminated Soulless and regular mobs, pauses their AI and throws without damage',()=>{
 for(const type of ['lost_soul','soulless','toxic_soulless','normal']){
  const s=fresh();emptyRoom(s);s.enemies=[];s.trial.devourer.maws=[mawAt(40,40),mawAt(41,41)];player(s,10,10);
  const mob=e.createEncounterEnemy(s,type,12,10,type==='lost_soul'?1:30);s.enemies.push(mob);s.rubyTileX=-1;
  assert.equal(maw.hookTarget(s),mob);assert.ok(maw.pressGravityHook(s));
  const before=[mob.x,mob.y,mob.hp];swarm(s,5);assert.deepEqual([mob.x,mob.y,mob.hp],before,'own AI waits while held');
  s.playerDirX=1;s.playerDirY=0;s.map[10][13]=c.T_WALL;maw.releaseGravityHook(s);
  for(let i=0;i<80&&s.trial.devourer.flings.length;i++){tickMaws(s);swarm(s);}
  assert.equal(mob.hp,before[2]);assert.ok(mob.devourer.stunTicks>0);assert.equal(s.trial.devourer.flings.length,0);
 }
});
test('a thrown Soul survives F inner reach without being consumed or damaged by the throw',()=>{
 const s=fresh();emptyRoom(s);s.enemies=[];s.trial.devourer.maws=[mawAt(40,40),mawAt(41,41)];player(s,10,10);
 const mob=e.createEncounterEnemy(s,'lost_soul',9,10,1);s.enemies.push(mob);assert.ok(maw.pressGravityHook(s));
 s.singularity={x:14.5*48,y:10.5*48,ticks:300,maxTicks:300,pullTimer:10,damageTimer:60};s.playerDirX=1;s.playerDirY=0;maw.releaseGravityHook(s);
 for(let i=0;i<80&&s.trial.devourer.flings.length;i++){tickMaws(s);swarm(s);}
 assert.ok(s.enemies.includes(mob));assert.equal(mob.hp,1);assert.equal(s.trial.devourer.flings.length,0);
});

test('a bursting body that is stunned holds its fuse until the stun ends',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];s.rubyTileX=-1;player(s,3,3);
 const b=calm(bodies(s)[0]);b.devourer.generation=1;b.chargeDirX=SC.bodyStacks;place(b,12,10);b.devourer.gorgeTicks=5;b.devourer.stunTicks=20;
 for(let i=0;i<19;i++)swarm(s);
 assert.ok(s.enemies.includes(b),'still there while stunned');assert.equal(b.devourer.gorgeTicks,5,'the fuse did not burn');
 for(let i=0;i<10;i++)swarm(s);
 assert.ok(!s.enemies.includes(b)||b.hp<=0,'it bursts once the stun is over');
});

test('Maws and F never eat non-boss mobs, including bodies thrown into Maw inner reach',()=>{
 for(const type of ['normal','lost_soul','soulless','toxic_soulless']){
  const s=fresh();emptyRoom(s);s.enemies=[];setMaw(s,10,10);player(s,4,4);
  const mob=e.createEncounterEnemy(s,type,10,10,type==='lost_soul'?1:30);s.enemies.push(mob);tickMaws(s);
  assert.ok(s.enemies.includes(mob));s.singularity={x:mob.x,y:mob.y,ticks:300,maxTicks:300,pullTimer:10,damageTimer:60};maw.swallowAtField(s);assert.ok(s.enemies.includes(mob));
  s.singularity=null;player(s,6,10);place(mob,5,10);assert.ok(maw.pressGravityHook(s));s.playerDirX=1;s.playerDirY=0;maw.releaseGravityHook(s);
  for(let i=0;i<100&&s.trial.devourer.flings.length;i++){tickMaws(s);swarm(s);}
  assert.ok(s.enemies.includes(mob));assert.equal(mob.hp,type==='lost_soul'?1:30);
 }
});
test('convergence stores each body at its real stack- and generation-scaled drawing size',()=>{
 const s=convergenceSetup(1,6),t=s.trial.devourer;
 for(const [i,b] of bodies(s).entries()){b.chargeDirX=i%3;b.devourer.generation=i%2+1;}
 const sizes=bodies(s).map(b=>Math.floor(c.TILE_SIZE*c.ENEMY_CONFIGS.devourer.bodyFraction*e.devourerBodyScale(b)));
 maw.updateConvergence(s,t);assert.deepEqual(t.convergence.members.map(m=>m.size),sizes);assert.ok(t.convergence.gatherTicks>=SC.convergence.gatherTicks);assert.ok(t.convergence.gatherTicks>=6*SC.convergence.bodyTicks);
});


test('No Mobs clears existing Singularity mobs and warnings, blocks all custom spawns, then resumes them when disabled',()=>{
 const s=fresh(),t=s.trial.devourer;s.noMobs=false;t.soulTimer=undefined;t.soullessTimer=1;tickMaws(s);
 assert.ok(t.soulSigns.length>0);s.enemies.push(e.createEncounterEnemy(s,'lost_soul',8,8,1),e.createEncounterEnemy(s,'soulless',9,9,30),e.createEncounterEnemy(s,'toxic_soulless',10,10,30));
 const ids=bodies(s).map(b=>b.id);e.godSetNoMobs(s,true);
 assert.deepEqual(bodies(s).map(b=>b.id),ids);assert.equal(s.enemies.filter(b=>b.type!=='devourer').length,0);assert.deepEqual(t.soulSigns,[]);
 t.soulTimer=1;t.soullessTimer=1;tickMaws(s,SC.soulWarnTicks+SC.soulless.everyTicks*2);
 assert.equal(t.soulSigns.length,0);assert.equal(s.enemies.filter(b=>b.type!=='devourer').length,0);assert.equal(t.soulTimer,1);assert.equal(t.soullessTimer,1);
 e.godSetNoMobs(s,false);tickMaws(s);assert.ok(t.soulSigns.some(g=>!g.hollow));assert.ok(t.soulSigns.some(g=>g.hollow));
 tickMaws(s,SC.soulWarnTicks);assert.ok(s.enemies.some(b=>b.type==='lost_soul'));assert.ok(s.enemies.some(b=>b.type==='soulless'));
});


test('queued bodies move and remain vulnerable until their own intake captures their live position',()=>{
 const s=convergenceSetup(1,6),t=s.trial.devourer;emptyRoom(s);player(s,18,18);
 const waiting=bodies(s)[4];waiting.chargeDirX=0;waiting.windupTicks=999;waiting.devourer.jumpTicks=9999;waiting.targetTileX=waiting.tileX+1;waiting.pathTimer=999;
 maw.updateConvergence(s,t);const originalX=waiting.x;swarm(s);
 assert.ok(waiting.x>originalX,'normal walk continues');assert.ok(!waiting.devourer.merging);
 const hp=waiting.hp;e.damageEnemy(s,waiting,.5);assert.ok(waiting.hp<hp,'waiting body is vulnerable');
 for(let i=0;i<t.convergence.gatherTicks&&!waiting.devourer.merging;i++){
  const before=[waiting.x,waiting.y];tickMaws(s);
  if(waiting.devourer.merging){const m=t.convergence.members.find(m=>m.id===waiting.id);assert.deepEqual([m.x,m.y],before,'pull starts from live position');break;}
  swarm(s);
 }
 assert.ok(waiting.devourer.merging);assert.equal(waiting.devourer.landTicks,0);assert.equal(waiting.devourer.jumpTicks,undefined);
});
test('jump, landing and swallow visuals expire during gathering; a dead waiting body is not resurrected',()=>{
 const s=convergenceSetup(1,6),t=s.trial.devourer;
 t.bursts=[{x:1,y:1,ticks:2,to:[]}];t.lands=[{x:1,y:1,ticks:2}];t.swallows=[{x:1,y:1,ticks:2,big:true}];tickMaws(s);
 assert.equal(t.bursts[0].ticks,1);tickMaws(s);assert.equal(t.bursts.length,0);assert.equal(t.lands.length,0);assert.equal(t.swallows.length,0);
 const victim=bodies(s)[5];victim.chargeDirX=0;kill(s,victim);assert.ok(!s.enemies.includes(victim));
 while(t.convergence.stage==='gather')tickMaws(s);
 assert.equal(t.convergence.count,5);assert.equal(bodies(s).length,5);assert.ok(!s.enemies.includes(victim));
});


test('Jaw knockback travels the same distance faster, and still stops at walls',()=>{
 const run=(fast,wall)=>{
  const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40),mawAt(41,41)];player(s,10,10);s.playerDirX=1;s.playerDirY=0;
  s.trial.devourer.jaw={tx:10,ty:10,ticks:1,snap:SC.jaw.snap};tickMaws(s);
  assert.equal(s.playerKnockback.speedMult,SC.jaw.knockSpeedMult);if(!fast)delete s.playerKnockback.speedMult;
  if(wall)s.map[10][7]=c.T_WALL;
  let ticks=0;while(s.playerKnockback&&ticks<300){s.gameTick++;e.singularityTest.updatePlayer(s);ticks++;}
  assert.equal(s.playerKnockback,null);return {x:s.playerTileX,y:s.playerTileY,ticks};
 };
 const normal=run(false,false),fast=run(true,false);assert.deepEqual([fast.x,fast.y],[normal.x,normal.y]);assert.equal(fast.x,10-SC.jaw.knock);assert.ok(fast.ticks<normal.ticks);
 const blocked=run(true,true);assert.equal(blocked.x,8);assert.equal(blocked.y,10);
});

test('a meteor destroys copies in its chamber but never the phase original',()=>{
 const s=fresh();emptyRoom(s);s.trial.devourer.maws=[mawAt(40,40,'closed'),mawAt(41,41,'closed')];s.rubyTileX=-1;s.godMode=true;player(s,40,40);
 const root=calm(bodies(s)[0]);place(root,10,10);root.devourer.gorgeTicks=undefined;
 const copy=e.createEncounterEnemy(s,'devourer',11,10,100);copy.devourer={generation:1,challenge:true};copy.encounterId=root.encounterId;s.enemies.push(copy);
 s.meteoriteWarning=c.chamberOfTile(10,10);s.meteoriteStrikeIn=1;e.tick(s);
 assert.ok(s.enemies.includes(root)&&root.hp>0,'the original survives');assert.ok(!s.enemies.includes(copy),'the copy is destroyed');
});
