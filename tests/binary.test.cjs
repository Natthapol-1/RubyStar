const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{const src=fs.readFileSync(f,'utf8');m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),b=require('../game/binary.ts');
const place=(mob,x,y)=>{mob.tileX=mob.targetTileX=x;mob.tileY=mob.targetTileY=y;mob.x=(x+.5)*c.TILE_SIZE;mob.y=(y+.5)*c.TILE_SIZE;mob.stepProgress=0;mob.path=[];};
const player=(s,x,y)=>{s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;s.playerStepProgress=0;s.playerKnockback=null;};
function fresh(){
  const s=e.createModeState('trial','astral_twins');s.noMobs=true;s.meteoriteTimer=1e6;s.invincible=false;
  e.godSpawnBoss(s,'astral_twins');s.binary.magnets=[];return{s,twins:b.binaryTwins(s)};
}
const kill=(s,t)=>{e.damageEnemy(s,t,t.hp+1e4,'special');e.killEnemy(s,s.enemies.indexOf(t));};
const room=(t)=>c.chamberOfTile(t.tileX,t.tileY);

test('Binary Star is playable: two twins with one 500-HP life each, holding Binary Star',()=>{
  assert.equal(require('../game/trials.ts').findTrial('binary').ready,true);
  const{s,twins}=fresh();
  assert.equal(twins.length,2);assert.deepEqual(twins.map(t=>t.maxHp),[b.BINARY.twinHP,b.BINARY.twinHP]);
  assert.equal(s.specialSkill,'astral_twins');assert.equal(s.binary.phase,1);
});

test('defeating both twins costs one life; only the third defeat wins',()=>{
  const{s,twins}=fresh();
  for(const phase of [1,2]){
    kill(s,twins[0]);assert.ok(twins[0].twin.downedTicks>0,'first twin is only downed');
    kill(s,twins[1]);
    assert.equal(s.gamePhase,'playing');assert.equal(s.binary.phase,phase+1);
    assert.ok(twins.every(t=>s.enemies.includes(t)&&t.hp===t.maxHp&&!t.twin.downedTicks));
  }
  kill(s,twins[0]);kill(s,twins[1]);assert.equal(s.gamePhase,'won');
});

test('a fallen twin still revives inside a phase if its partner survives',()=>{
  const{s,twins}=fresh();kill(s,twins[0]);
  for(let i=0;i<c.TWIN_REVIVE_TICKS;i++){s.playerHP=100;s.rubyHP=100;e.tick(s);} // keep the run alive against the berserk survivor
  assert.equal(twins[0].twin.downedTicks,0);assert.ok(twins[0].hp>0);assert.equal(s.binary.phase,1);
});

test('every 45s the twins split into two opposite chambers, away from yours',()=>{
  const{s,twins}=fresh();place(twins[0],14,10);place(twins[1],16,12);
  const [r1,c1]=c.CHAMBER_BOUNDS[1];player(s,c1+4,r1+4); // you are in BETA
  s.binary.swapTimer=1;b.updateBinary(s);
  const rooms=twins.map(room).sort();
  assert.deepEqual(rooms,[0,3],'ALPHA and GAMMA: the opposite pair without your room');
  assert.notEqual(room(twins[0]),0,'a twin prefers a room it was not already in');
  assert.equal(s.binary.swapTimer,b.BINARY.swapTicks[0],'35s between jumps in phase 1');
});

test('Binary Star teleports every 35s in phases 1 and 2 and every 45s in phase 3', () => {
  assert.deepEqual([1,2,3].map(phase=>b.swapTicks({phase})/60),[35,35,45]);
});

test('a lone survivor jumps to the chamber opposite its fallen partner',()=>{
  const{s,twins}=fresh();place(twins[0],14,10);place(twins[1],36,12);player(s,40,40);
  kill(s,twins[1]);const fallenRoom=room(twins[1]);
  s.binary.swapTimer=1;b.updateBinary(s);
  assert.equal(room(twins[0]),b.oppositeChamber(fallenRoom));
});

test('magnets push a matching pole away and pull an opposite pole in; C swaps the pole',()=>{
  const{s,twins}=fresh();twins.forEach(t=>place(t,40,40));player(s,12,10);
  s.binary.magnets=[{x:10,y:10,pole:'north'}];s.binary.pole='north';s.binary.pulse=1;b.updateBinary(s);
  assert.deepEqual([s.playerKnockback.dirX,s.playerKnockback.dirY],[1,0],'like poles push away');
  player(s,13,10);assert.equal(b.swapPole(s),true);assert.equal(s.binary.pole,'south');assert.equal(b.swapPole(s),false,'short cooldown');
  s.binary.pulse=1;b.updateBinary(s);
  assert.deepEqual([s.playerKnockback.dirX,s.playerKnockback.dirY],[-1,0],'opposite poles pull in');
  player(s,11,10);s.binary.pulse=1;b.updateBinary(s);assert.equal(s.playerKnockback,null,'a pull holds once close');
});

test('Dawn is north and Dusk is south; your field moves them every pulse, and they never move you',()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[1],40,40);place(twins[0],10,10);player(s,13,10);
  s.binary.pole='north';s.binary.pulse=1;b.updateBinary(s);
  assert.equal(s.playerKnockback,null,'a twin never pushes or pulls you');
  assert.ok(twins[0].pushTiles>0&&twins[0].pushDirX===-1,'you (north) push Dawn (north) away');
  assert.equal(b.twinPole(twins[0]),'north');assert.equal(b.twinPole(twins[1]),'south');
});

test('while exposed, your hits even out the twins: the weaker takes less, the stronger more, averaging full damage',()=>{
  const{s,twins}=fresh();s.binary.exposed=1e9;twins[0].hp=1200;twins[1].hp=600;
  const k=[0,1].map(i=>b.binaryDamageTaken(s,twins[i],'player'));
  assert.ok(Math.abs(k[0]-4/3)<1e-9&&Math.abs(k[1]-2/3)<1e-9,String(k));assert.ok(Math.abs((k[0]+k[1])/2-1)<1e-9);
  twins[1].hp=100;assert.equal(b.binaryDamageTaken(s,twins[0],'player'),1.5,'capped at 1.5×');assert.equal(b.binaryDamageTaken(s,twins[1],'player'),.5,'and 0.5×');
  twins[1].hp=0;assert.equal(b.binaryDamageTaken(s,twins[0],'player'),b.BINARY.exposedAloneDamage,'a lone exposed twin takes its own rate');
  twins[1].hp=100;s.binary.exposed=0;assert.equal(b.binaryDamageTaken(s,twins[1],'player'),b.BINARY.boundDamage,'bound: the flat cut');
});

test('a meteor takes 10% of a twin life',()=>{
  const{s,twins}=fresh();place(twins[0],10,10);place(twins[1],12,12);player(s,40,40); s.binary.exposed=1e9; // exposed: full damage, so the raw values are checked
  s.meteoriteWarning=0;s.meteoriteStrikeIn=1;
  e.tick(s);
  for(const t of twins)assert.ok(Math.abs(t.maxHp-t.hp-b.BINARY.twinHP*b.BINARY.meteorShare)<1e-6,`${t.maxHp-t.hp}`);
});

test('a strong push moves you two tiles; phase 1 has no room magnets, phase 2 re-places them every 25s',()=>{
  const{s,twins}=fresh();twins.forEach(t=>place(t,40,40));player(s,11,10);
  s.binary.magnets=[{x:10,y:10,pole:'north'}];s.binary.pole='north';s.binary.pulse=1;b.updateBinary(s);
  assert.equal(s.playerKnockback.tilesLeft,2);
  s.binary.magnetTimer=1;b.updateBinary(s);assert.equal(s.binary.magnets.length,0,'phase 1: no room magnets');
  s.binary.phase=2;s.binary.magnetTimer=1;b.updateBinary(s);
  assert.equal(s.binary.magnets.length,4,'phase 2: one magnet per room');assert.equal(s.binary.magnetTimer,b.BINARY.magnetMoveTicks);
});

test('a pole swap jolts each twin in your field once per swap, with a per-twin cooldown: a shove, a little damage, and healing for you and Ruby',()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[0],13,10);place(twins[1],40,40);player(s,11,10);
  s.binary.pole='south'; // Dawn is north: swapping to north makes you push her
  s.playerHP=50;s.rubyHP=50;assert.equal(b.swapPole(s),true);b.updateBinary(s);
  assert.equal(twins[0].pushTiles,b.BINARY.surgeShove);assert.ok(Math.abs(twins[0].maxHp-twins[0].hp-twins[0].maxHp*b.BINARY.surgeTwinShare)<1e-6,'a little damage, through the bond');assert.equal(s.playerHP,50+b.BINARY.surgeHeal,'heals you');assert.equal(s.rubyHP,50+b.BINARY.surgeHeal,'and Ruby');
  assert.equal(twins[1].pushTiles,0,'Dusk is out of range');
  const shoves=()=>s.binary.zaps.length; // each surge shove leaves one zap cue
  twins[0].pushTiles=0;for(let i=0;i<b.BINARY.surgeTicks;i++)b.updateBinary(s);assert.equal(shoves(),0,'once per swap (the first zap has faded)');
  s.binary.poleCooldown=0;place(twins[0],13,10);twins[0].pushTiles=0;b.swapPole(s);b.updateBinary(s);assert.equal(shoves(),0,'per-twin cooldown blocks a rapid second shove');
});

test('no surge without a swap, and none when a pulled twin is already beside you',()=>{
  const{s,twins}=fresh();place(twins[0],12,10);place(twins[1],40,40);player(s,11,10);
  s.binary.pole='north';for(let i=0;i<60;i++)b.updateBinary(s);
  assert.equal(s.binary.surgeHit.length,0);
  b.swapPole(s);player(s,11,10);b.updateBinary(s); // now south: Dawn pulls, but you are already beside her
  assert.equal(s.binary.surgeHit.length,0);
});

test('from phase 2 every room holds one magnet; diagonally opposite rooms share a pole',()=>{
  const{s,twins}=fresh();kill(s,twins[0]);kill(s,twins[1]);
  assert.equal(s.binary.phase,2);assert.equal(s.binary.magnets.length,4);
  const pole=r=>s.binary.magnets.find(m=>c.chamberOfTile(m.x,m.y)===r).pole;
  for(const room of [0,1,2,3])assert.equal(s.binary.magnets.filter(m=>c.chamberOfTile(m.x,m.y)===room).length,1);
  assert.equal(pole(0),pole(3),'ALPHA and GAMMA match');assert.equal(pole(1),pole(2),'BETA and DELTA match');assert.notEqual(pole(0),pole(1));
});

test('Lodestones push or pull you like a magnet and are shoved by the swap surge',()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));s.binary.phase=2;twins.forEach(t=>place(t,40,40));s.binary.magnets=[];player(s,12,10);
  const l=e.createEncounterEnemy(s,'lodestone',10,10,30);l.pole='north';s.enemies.push(l);
  s.binary.pole='north';s.binary.pulse=1;b.updateBinary(s);
  assert.deepEqual([s.playerKnockback.dirX,s.playerKnockback.dirY],[1,0],'like poles push');
  player(s,13,10);s.binary.poleCooldown=0;b.swapPole(s);b.updateBinary(s);
  assert.equal(l.pushDirX,1,'now south: you yank it toward you');assert.equal(l.maxHp-l.hp,Math.min(l.maxHp,b.BINARY.surgeDamage),'and jolt it');
});

test('Lodestones join regular spawns from phase 1, capped',()=>{
  for(const phase of [1,2]){
    const{s}=fresh();s.noMobs=false;s.binary.phase=phase;s.binary.magnets=[];s.binary.magnetTimer=1e9;s.enemies=s.enemies.filter(x=>x.type==='astral_twins');
    const orig=Math.random;let n=0;Math.random=()=>(n++%7)/7;
    try{for(let i=0;i<4000&&s.gamePhase==='playing';i++){s.playerHP=100;s.rubyHP=100;e.tick(s);}}finally{Math.random=orig;}
    const stones=s.enemies.filter(x=>x.type==='lodestone');
    assert.ok(stones.length>=1&&stones.length<=b.BINARY.lodestoneMax,String(stones.length));
    assert.ok(stones.every(x=>x.pole==='north'||x.pole==='south'));
  }
});

test('your Binary Star twin holds the opposite pole: a swap shoves a twin in its field',()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[1],10,40);player(s,10,10);
  s.rubyTileX=34;s.rubyTileY=12;s.playerCarryingRuby=false;s.mirrorTwinTicks=300;const clone=e.getMirrorTwinTile(s);
  place(twins[0],clone.tileX+3,clone.tileY); // at the edge of the twin's reach, far from you
  s.binary.pole='north';assert.equal(b.cloneMagnet(s).pole,'south');
  assert.equal(b.swapPole(s),true);assert.equal(b.cloneMagnet(s).pole,'north');b.updateBinary(s);
  assert.equal(twins[0].pushDirX,1,'now north like Dawn: the twin flings her away from it');assert.equal(twins[0].pushTiles,b.BINARY.surgeShove);
});

test('your Binary Star twin pulls or pushes the twins every pulse, but never you',()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[0],14,10);place(twins[1],40,40);player(s,30,30);
  s.rubyTileX=12;s.rubyTileY=10;s.playerCarryingRuby=false;s.mirrorTwinTicks=300;const clone=e.getMirrorTwinTile(s);
  s.binary.pole='north';s.binary.pulse=1;b.updateBinary(s); // the twin is south: it pulls Dawn (north) in
  assert.ok(twins[0].pushTiles>0&&twins[0].pushDirX===-Math.sign(14-clone.tileX),'Dawn is drawn toward the south twin');
  assert.equal(s.playerKnockback,null,'the twin has no force on you');
});

test('a swap surge also gives each jolted enemy one strong shove: away for a push, in for a pull',()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[0],13,10);place(twins[1],40,40);player(s,10,10);
  s.binary.pole='south';assert.equal(b.swapPole(s),true);b.updateBinary(s); // now north, like Dawn: a push
  assert.equal(twins[0].pushTiles,b.BINARY.surgeShove);assert.equal(twins[0].pushDirX,1,'flung away from you');
  const{s:s2,twins:t2}=fresh();s2.map=s2.map.map(r=>r.map(()=>c.T_FLOOR));place(t2[0],14,10);place(t2[1],40,40);player(s2,10,10);
  s2.binary.pole='north';assert.equal(b.swapPole(s2),true);b.updateBinary(s2); // now south, opposite Dawn: a pull
  assert.equal(t2[0].pushDirX,-1,'yanked toward you');assert.equal(t2[0].pushTiles,3,'stopping just short of you');
});

test('a surged enemy that hits a wall is stunned, without damage, for a push or a pull through the wall',()=>{
  for(const how of ['push','pull']){
    const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[1],40,40);player(s,10,10);
    if(how==='push'){place(twins[0],13,10);s.map[10][14]=c.T_WALL;s.binary.pole='south';}
    else{place(twins[0],13,10);s.map[10][12]=c.T_WALL;s.binary.pole='north';} // a wall between you and Dawn
    assert.equal(b.swapPole(s),true);b.updateBinary(s);const afterSurge=twins[0].hp;
    for(let i=0;i<4;i++)e.tick(s);
    assert.equal(twins[0].hp,afterSurge,how+': no slam damage');assert.ok((twins[0].buildStopUntil??0)>s.gameTick,how+': but a stun');
  }
});

test('the twins arrive in two opposite chambers, as after a jump',()=>{
  for(let i=0;i<5;i++){const{twins}=fresh();assert.equal(room(twins[0]),3-room(twins[1]),'diagonally opposite rooms');}
});

test('no space events on a challenge map, even when one is due',()=>{
  const{s}=fresh();s.gamePhase='playing';s.ambientEvents.timer=1;s.meteoriteWarning=-1;s.bossWarningTicks=0;s.bossSpawnTicks=0;
  for(let i=0;i<300;i++)e.tick(s);
  assert.equal(s.ambientEvents.warning,null);assert.equal(s.ambientEvents.active,null);
});

test('Binary Collision: bound twins shrug off ordinary hits; a surge shove into the other twin stuns and exposes both',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));player(s,10,10);
  const hp=twins[0].hp;e.damageEnemy(s,twins[0],100,'player');assert.equal(hp-twins[0].hp,100*b.BINARY.boundDamage,'bound: ordinary hits cut');
  place(twins[0],13,10);place(twins[1],17,10);s.binary.pole='south';const before=twins.map(t=>t.hp);
  assert.equal(b.swapPole(s),true); // now north like Dawn: she is flung away from you, toward Dusk
  for(let i=0;i<8;i++)e.tick(s);
  assert.ok(s.binary.exposed>0,'they collided and are exposed');
  assert.ok(twins[1].hp<before[1],'Dusk is hurt too');assert.ok((twins[1].buildStopUntil??0)>s.gameTick,'and stunned');
  const h2=twins[0].hp;e.damageEnemy(s,twins[0],100,'player');assert.equal(h2-twins[0].hp,100,'exposed: full damage');
  const swap=s.binary.swapTimer;for(let i=0;i<30;i++)b.updateBinary(s);assert.equal(s.binary.swapTimer,swap,'no jumps while exposed');
});

test('collision damage goes to the healthier twin first, evening out their HP, then splits equally',()=>{
  assert.deepEqual(b.collisionSplit(1000,1000,288),[144,144]); // the split rule, independent of collideShare
  assert.deepEqual(b.collisionSplit(1200,800,288),[288,0],'a big gap: all on the healthier twin');
  assert.deepEqual(b.collisionSplit(1000,900,288),[194,94],'closes the 100 gap, then splits the rest');
  const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));player(s,10,10);
  twins[0].hp=1100;twins[1].hp=900;place(twins[0],13,10);place(twins[1],17,10);s.binary.pole='south';b.swapPole(s);
  for(let i=0;i<8;i++)e.tick(s);
  assert.ok(s.binary.exposed>0);assert.ok(Math.abs(twins[0].hp-twins[1].hp)<1e-6,'evened out: '+twins.map(t=>t.hp));
});

test('a twin downed while stunned cannot start reviving until its stun ends',()=>{
  const{s,twins}=fresh();twins[0].buildStopUntil=s.gameTick+120;kill(s,twins[0]);
  const down=twins[0].twin.downedTicks;for(let i=0;i<100;i++)e.tick(s);
  assert.equal(twins[0].twin.downedTicks,down,'frozen while stunned');
  for(let i=0;i<40;i++)e.tick(s);assert.ok(twins[0].twin.downedTicks<down,'counts down once the stun ends');
});

test('on Binary Star the berserk survivor is far more dangerous than in Endless',()=>{
  const{s,twins}=fresh();kill(s,twins[0]);e.tick(s);
  const k=e.twinBerserk(s,twins[1]);assert.deepEqual(k,{...b.BINARY.berserk,damage:b.BINARY.berserk.damage*b.BINARY.twinDamage});
  assert.equal(e.twinBerserk(s,twins[0]).damage,b.BINARY.twinDamage,'the downed twin: just the map-wide cut');
  assert.ok(k.speed>c.TWIN_BERSERK_SPEED_MULT&&k.cooldown<c.TWIN_BERSERK_COOLDOWN_MULT&&k.damage>1);
});

const movesOnly=(s,which)=>{s.binary.moves={dashCd:which==='dash'?0:1e9,starCd:which==='star'?0:1e9,beamCd:which==='beam'?0:1e9,dash:null,stars:[],starHit:false,beam:null};};

test("Dawn's Comet Dash marks a lane, then dashes through you for damage and a shove",()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[0],10,10);place(twins[1],40,40);player(s,15,10);movesOnly(s,'dash');
  const hp=s.playerHP;b.updateBinary(s);assert.ok(s.binary.moves.dash,'the lane is marked');
  for(let i=0;i<b.BINARY.dash.warn-1;i++)b.updateBinary(s);assert.equal(s.playerHP,hp,'no damage while marking');
  for(let i=0;i<20;i++)b.updateBinary(s);
  assert.ok(Math.abs(hp-s.playerHP-b.BINARY.dash.damage*b.BINARY.twinDamage)<1e-6);assert.ok(s.playerKnockback,'and a shove');
});

test("Dusk's Starfall marks three areas around you, then bursts once on you",()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[0],40,40);place(twins[1],10,16);player(s,10,10);movesOnly(s,'star');
  const hp=s.playerHP;b.updateBinary(s);assert.equal(s.binary.moves.stars.length,b.BINARY.starfall.count);
  for(let i=0;i<b.BINARY.starfall.warn+2;i++)b.updateBinary(s);
  assert.ok(Math.abs(hp-s.playerHP-b.BINARY.starfall.damage*b.BINARY.twinDamage)<1e-6,'hit once, however many areas overlap you');
  assert.ok(s.playerFrozenTicks>0&&s.playerStunned,'a hit stuns you briefly');
});

test('the Twin Beam links both twins in one chamber, then fires along the locked line',()=>{
  const{s,twins}=fresh();const[r1,c1]=c.CHAMBER_BOUNDS[0];s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));
  place(twins[0],c1+3,r1+5);place(twins[1],c1+9,r1+5);player(s,c1+6,r1+5);movesOnly(s,'beam');
  const hp=s.playerHP;b.updateBinary(s);assert.ok(s.binary.moves.beam);
  for(let i=0;i<b.BINARY.beam.warn+2;i++)b.updateBinary(s);
  assert.ok(Math.abs(hp-s.playerHP-b.BINARY.beam.damage*b.BINARY.twinDamage)<1e-6);
});

test('a twin pushed or pulled into a wall by a field pulse is stunned, then has a short wall-stun cooldown',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[1],40,40);player(s,30,30);
  s.rubyTileX=12;s.rubyTileY=10;s.playerCarryingRuby=false;s.mirrorTwinTicks=600;const clone=e.getMirrorTwinTile(s);
  place(twins[0],clone.tileX+2,clone.tileY);s.map[clone.tileY][clone.tileX+3]=c.T_WALL; // Dawn has a wall right behind her
  s.binary.pole='south'; // your twin is north like Dawn: it pushes her into the wall
  s.binary.pulse=1;b.updateBinary(s);
  assert.ok((twins[0].buildStopUntil??0)>s.gameTick,'stunned against the wall');
  twins[0].buildStopUntil=0;s.binary.pulse=1;b.updateBinary(s);
  assert.ok(!(twins[0].buildStopUntil>s.gameTick),'no second stun inside the cooldown');
  s.gameTick+=b.BINARY.wallStunCooldown;s.binary.pulse=1;b.updateBinary(s);
  assert.ok(twins[0].buildStopUntil>s.gameTick,'stunned again once the cooldown has passed');
});

test("your F twin's field reaches the whole drawn square, corners included",()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[1],40,40);player(s,40,10);
  s.rubyTileX=20;s.rubyTileY=20;s.playerCarryingRuby=false;s.mirrorTwinTicks=600;const clone=e.getMirrorTwinTile(s);
  const r=b.BINARY.cloneRange;place(twins[0],clone.tileX+r,clone.tileY+r); // the square's corner: further than r in a straight line
  s.binary.pole='south';s.binary.pulse=1;b.updateBinary(s); // your twin is north like Dawn: it pushes her
  assert.ok(twins[0].pushTiles>0,'pushed from the corner of the reach');
  place(twins[0],clone.tileX+r+1,clone.tileY);twins[0].pushTiles=0;s.binary.pulse=1;b.updateBinary(s);
  assert.equal(twins[0].pushTiles,0,'one tile outside the square is out of reach');
});

test("the passive field does not cancel Dawn's Comet Dash; a Pole Shift shove does",()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[0],10,10);place(twins[1],40,40);player(s,15,10);movesOnly(s,'dash');
  b.updateBinary(s);assert.ok(s.binary.moves.dash);
  twins[0].pushDirX=0;twins[0].pushDirY=1;twins[0].pushTiles=1; // a field pulse moves her while she marks the lane
  for(let i=0;i<5;i++)b.updateBinary(s);assert.ok(s.binary.moves.dash,'still dashing after a field push');
  twins[0].pushTiles=2;twins[0].surgeShoved=30;b.updateBinary(s);assert.equal(s.binary.moves.dash,null,'a swap shove cancels it');
});

test('a passive field pulse that drives one twin within 2 tiles of the other is a collision too',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));player(s,10,10);
  place(twins[0],13,10);place(twins[1],17,10);s.binary.pole='north'; // you push Dawn (north) toward Dusk
  s.binary.pulse=1;for(let i=0;i<6;i++)e.tick(s);
  assert.ok(s.binary.exposed>0,'they crashed without a swap');
});

test("your field takes priority: a twin inside your reach ignores your F twin's field",()=>{
  const{s,twins}=fresh();s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[1],40,40);player(s,10,10);
  s.rubyTileX=13;s.rubyTileY=10;s.playerCarryingRuby=false;s.mirrorTwinTicks=600;const clone=e.getMirrorTwinTile(s);
  place(twins[0],11,10); // beside you (a pull already holding it close), and inside your twin's reach
  s.binary.pole='south'; // you pull Dawn (north), but she is already close; your twin (north) would push her
  s.binary.pulse=1;b.updateBinary(s);
  assert.equal(twins[0].pushTiles,0,'your field holds her; your twin does not push her');
  assert.ok(Math.max(Math.abs(twins[0].tileX-clone.tileX),Math.abs(twins[0].tileY-clone.tileY))<=b.BINARY.cloneRange,'she was inside its reach');
});

test('room magnets keep clear of each teleport pad',()=>{
  for(let run=0;run<10;run++){
    const{s}=fresh();s.binary.phase=2;s.binary.magnetTimer=1;b.updateBinary(s);
    assert.equal(s.binary.magnets.length,4);
    for(const m of s.binary.magnets){const[px,py]=c.TELEPORT_PADS[c.chamberOfTile(m.x,m.y)];assert.ok(Math.max(Math.abs(m.x-px),Math.abs(m.y-py))>=b.BINARY.magnetPadGap,`magnet at ${m.x},${m.y} near pad ${px},${py}`);}
  }
});

test('a Lodestone your field drives into a twin bursts on it: damage, a short stun, and the Lodestone is gone',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[1],40,40);player(s,10,10);
  place(twins[0],15,10);const l=e.createEncounterEnemy(s,'lodestone',12,10,30);l.pole='north';l.snapCooldown=1e9;s.enemies.push(l); // no snap here
  s.binary.pole='north';s.binary.pulse=1; // you push the north Lodestone toward Dawn
  const hp=twins[0].hp;for(let i=0;i<8;i++)e.tick(s);
  assert.ok(!s.enemies.includes(l)||l.hp<=0,'the Lodestone shattered');
  assert.ok(Math.abs(hp-twins[0].hp-twins[0].maxHp*b.BINARY.lodestoneHitShare)<1e-6,'Dawn took 5% of a life: '+(hp-twins[0].hp));
  assert.ok((twins[0].buildStopUntil??0)>s.gameTick,'and is stunned');
});

test('a twin your field drives into a Lodestone bursts it on the twin too',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));place(twins[1],40,40);player(s,10,10);
  place(twins[0],12,10);const l=e.createEncounterEnemy(s,'lodestone',15,10,30);l.pole='south';s.enemies.push(l); // 5 tiles away: out of your reach
  s.binary.pole='north';s.binary.pulse=1; // you push Dawn (north) toward the Lodestone
  const hp=twins[0].hp;for(let i=0;i<8;i++)e.tick(s);
  assert.ok(!s.enemies.includes(l)||l.hp<=0,'the Lodestone shattered');
  assert.ok(Math.abs(hp-twins[0].hp-twins[0].maxHp*b.BINARY.lodestoneHitShare)<1e-6,'Dawn took 5% of a life: '+(hp-twins[0].hp));
});

test('a Grounder (phase 2+) grounds nearby twins: no field, no jolt; killing it stuns its twin',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));s.binary.phase=2;s.binary.magnets=[];s.binary.magnetTimer=1e9;place(twins[1],40,40);player(s,10,10);
  place(twins[0],13,10);const g=e.createEncounterEnemy(s,'grounder',15,10,30);s.enemies.push(g);
  assert.ok(b.grounded(s,twins[0]));
  s.binary.pole='north';s.binary.pulse=1;b.updateBinary(s);assert.equal(twins[0].pushTiles,0,'your field cannot move her');
  s.binary.pole='south';b.swapPole(s);b.updateBinary(s);assert.equal(twins[0].pushTiles,0,'nor can a swap');

  e.damageEnemy(s,g,g.hp+1,'player');e.killEnemy(s,s.enemies.indexOf(g));b.updateBinary(s);
  assert.ok(!b.grounded(s,twins[0]),'free once it dies');
});

test('Grounders arrive on their own timer from phase 2, never in phase 1',()=>{
  const{s}=fresh();s.noMobs=false;s.binary.magnets=[];s.binary.magnetTimer=1e9; // No Mobs also stops Grounders
  for(let i=0;i<b.BINARY.grounder.gap+5;i++)b.updateBinary(s);
  assert.equal(s.enemies.filter(x=>x.type==='grounder').length,0,'phase 1: none');
  s.binary.phase=2;s.binary.grounderTimer=1;b.updateBinary(s);
  assert.equal(s.enemies.filter(x=>x.type==='grounder').length,1);
});

test("a dead Pulsar's field moves you for a while, then explodes",()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));twins.forEach(t=>place(t,40,40));s.binary.magnets=[];s.binary.magnetTimer=1e9;player(s,12,10);
  const p=e.createEncounterEnemy(s,'pulsar',10,10,12);p.pole='south';s.enemies.push(p);s.binary.pole='north';
  e.damageEnemy(s,p,p.hp+1,'player');e.killEnemy(s,s.enemies.indexOf(p));
  assert.equal(s.binary.pulsarFields.length,1);
  b.updateBinary(s);assert.ok(s.playerKnockback&&s.playerKnockback.dirX===-1,'opposite pole: dragged toward it');
  player(s,12,10);s.binary.pole='south';s.binary.pulsarFields[0].pulse=1;b.updateBinary(s);
  assert.ok(s.playerKnockback&&s.playerKnockback.dirX===1,'matching pole: thrown clear');
  player(s,11,10);const hp=s.playerHP;s.binary.pulsarFields[0].ticks=1;s.binary.pulsarFields[0].pulse=99;b.updateBinary(s);
  assert.equal(hp-s.playerHP,b.BINARY.pulsar.damage,'the blast');
});

test('a collision deals the same 20% of a life in phase 2',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.binary.phase=2;s.binary.magnets=[];s.binary.magnetTimer=1e9;s.map=s.map.map(r=>r.map(()=>c.T_FLOOR));player(s,10,10);
  place(twins[0],13,10);place(twins[1],17,10);s.binary.pole='south';b.swapPole(s);
  const before=twins[0].hp+twins[1].hp;for(let i=0;i<8;i++)e.tick(s);
  assert.ok(s.binary.exposed>0);
  const lost=before-twins[0].hp-twins[1].hp,jolt=twins[0].maxHp*b.BINARY.surgeTwinShare;
  assert.ok(Math.abs(lost-jolt-twins[0].maxHp*b.BINARY.collideShare)<1e-6,'lost '+lost);
});

test('phase 3: each twin flips its own pole on its own timer, and a new life starts on its own pole',()=>{
  const{s,twins}=fresh();s.binary.magnets=[];s.binary.magnetTimer=1e9;twins.forEach(t=>place(t,40,40));player(s,10,10);
  for(let i=0;i<5;i++)b.updateBinary(s);assert.equal(b.twinPole(twins[0]),'north','no reversal before phase 3');
  s.binary.phase=3;b.updateBinary(s);s.binary.reversal[twins[0].id]=1;b.updateBinary(s);
  assert.equal(b.twinPole(twins[0]),'south');assert.ok(b.twinReversed(twins[0]));
  const gap=s.binary.reversal[twins[0].id];assert.ok(gap>=b.BINARY.reversal.gap[0]-1&&gap<=b.BINARY.reversal.gap[1],'next flip is 22–26s away');
});

test('phase 3: a hurt twin walks to its charging tile and heals there; pushing it off ends the charge',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';s.binary.magnets=[];s.binary.magnetTimer=1e9;place(twins[1],40,40);player(s,40,10);
  s.binary.phase=3;const [r1,c1]=c.CHAMBER_BOUNDS[0];s.binary.chargeTiles=[{x:c1+5,y:r1+5}];s.binary.chargeCd={[twins[0].id]:0};s.binary.reversal={[twins[0].id]:1e9,[twins[1].id]:1e9};
  place(twins[0],c1+5,r1+5);twins[0].hp=twins[0].maxHp*.5;
  b.updateBinary(s);assert.ok(s.binary.chargeSeek[twins[0].id],'it heads for the tile');assert.ok(b.binaryTwinBusy(s,twins[0]),'and stops attacking');
  const hp0=twins[0].hp;for(let i=0;i<b.BINARY.charge.setupTicks;i++)b.updateBinary(s);assert.equal(twins[0].hp,hp0,'no healing during the first second on the tile');
  const hp=twins[0].hp;for(let i=0;i<60;i++)b.updateBinary(s);
  assert.ok(Math.abs(twins[0].hp-hp-twins[0].maxHp*b.BINARY.charge.heal)<1e-6,'its heal per second');
  twins[0].pushTiles=1;twins[0].pushDirX=1;b.updateBinary(s);
  assert.equal(s.binary.chargeSeek[twins[0].id],null,'pushed off: the charge ends');assert.equal(s.binary.chargeCd[twins[0].id],b.BINARY.charge.failCooldown,'16s before it tries again');
});

test('the God Collide button moves the twins together and crashes them',()=>{
  const{s,twins}=fresh();s.gamePhase='playing';place(twins[0],10,10);place(twins[1],40,40);
  const before=twins[0].hp+twins[1].hp;b.godCollideTwins(s);
  assert.ok(Math.max(Math.abs(twins[0].tileX-twins[1].tileX),Math.abs(twins[0].tileY-twins[1].tileY))<=1,'side by side');
  assert.ok(s.binary.exposed>0&&twins[0].hp+twins[1].hp<before,'and crashed');
});

test('on Binary Star a revived twin returns with 40% of its life',()=>{
  const{s,twins}=fresh();kill(s,twins[0]);
  for(let i=0;i<c.TWIN_REVIVE_TICKS;i++){s.playerHP=100;s.rubyHP=100;e.tick(s);}
  assert.equal(twins[0].twin.downedTicks,0);assert.ok(Math.abs(twins[0].hp-twins[0].maxHp*b.BINARY.reviveHpRatio)<1e-6,String(twins[0].hp));
});

test('a Lodestone locks a lane, warns, then snaps into you for damage and a knockback',()=>{
  const{s,twins}=fresh();twins.forEach(t=>place(t,40,40));player(s,13,10);s.playerHP=s.playerHP;
  const l=e.createEncounterEnemy(s,'lodestone',10,10,30);l.pole=s.binary.pole==='north'?'south':'north';s.enemies.push(l);
  const c=require('../game/constants.ts'),hp0=s.playerHP;let warned=false,knocked=false;
  for(let i=0;i<c.LODESTONE_SNAP.windup+40&&s.gamePhase==='playing';i++){e.tick(s);warned||=(l.chargeWindupTicks??0)>0;knocked||=!!s.playerKnockback;}
  assert.ok(warned,'it warned first');assert.ok(hp0-s.playerHP>=c.LODESTONE_SNAP.damage-1e-6,String(hp0-s.playerHP));assert.ok(knocked,'and knocked you back');
});

test('the passive field leaves a Lodestone alone mid-snap; a swap shove still cancels it',()=>{
  const{s,twins}=fresh();twins.forEach(t=>place(t,40,40));player(s,13,10);
  const l=e.createEncounterEnemy(s,'lodestone',11,10,30);l.pole=s.binary.pole;s.enemies.push(l); // same pole: your field would push it
  l.chargeDirX=1;l.chargeDirY=0;l.chargeWindupTicks=30;l.chargeTilesLeft=4;
  for(let i=0;i<20;i++)e.tick(s);
  assert.ok(l.chargeWindupTicks>0||l.chargeDirX!==0,'still snapping');assert.equal(l.pushTiles,0,'not pushed by the passive field');
});

test('a meteor always takes 10% of a twin\'s HP, bound or not',()=>{
  const{s,twins}=fresh();s.godMode=true;const t=twins[0],hp=t.hp;
  s.meteoriteWarning=room(t);s.meteoriteStrikeIn=1;e.tick(s);
  assert.ok(Math.abs(hp-t.hp-b.BINARY.twinHP*b.BINARY.meteorShare)<1e-6,'took '+(hp-t.hp));
});
