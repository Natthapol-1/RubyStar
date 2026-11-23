const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),n=require('../game/neptune.ts'),r=require('../game/neptune-refrain.ts'),cl=require('../game/neptune-clam.ts');
function fresh(){const s=e.createModeState('trial','sea_chanter');s.noMobs=true;s.godMode=true;s.meteoriteTimer=1e9;cl.updateNeptuneClams(s);return s;}
function arena(){const s=fresh();s.map=s.map.map(row=>row.map(()=>c.T_FLOOR));s.neptune.clams=[{tileX:10,tileY:10,openTicks:0,waveTicks:0,hitIds:[],pitch:0}];s.neptune.clamRepositionTicks=3600;s.playerTileX=s.playerTargetX=10;s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*c.TILE_SIZE;return s;}
function spawn(s,type,x,y=10){const target=e.createEncounterEnemy(s,type,x,y,c.ENEMY_CONFIGS[type].maxHp);s.enemies.push(target);return target;}
function wave(s){for(let i=0;i<c.NEPTUNE_CLAM.waveTicks;i++){s.gameTick++;cl.updateNeptuneClams(s);}}

test('one clam per chamber relocates every active minute, preserving positions across phases and pauses',()=>{
 const s=fresh(),before=s.neptune.clams.map(v=>[v.tileX,v.tileY]);assert.equal(before.length,4);
 assert.deepEqual(before.map(([x,y])=>c.chamberOfTile(x,y)),[0,1,2,3]);
 for(const [x,y] of before){assert.equal(s.map[y][x],c.T_FLOOR);assert.ok(!c.TELEPORT_PADS.some(([px,py])=>px===x&&py===y));}
 s.neptune.phase=2;cl.updateNeptuneClams(s);assert.deepEqual(s.neptune.clams.map(v=>[v.tileX,v.tileY]),before);
 s.neptune.clamRepositionTicks=1;s.gamePhase='paused';cl.updateNeptuneClams(s);assert.equal(s.neptune.clamRepositionTicks,1);
 s.gamePhase='playing';cl.updateNeptuneClams(s);assert.equal(s.neptune.clamRepositionTicks,3600);
 for(let i=0;i<4;i++)assert.notDeepEqual([s.neptune.clams[i].tileX,s.neptune.clams[i].tileY],before[i]);
});

test('Melody opens only closed clams in range; they close after four seconds and cannot be refreshed',()=>{
 const s=arena(),clam=s.neptune.clams[0];r.playOceanMelody(s);assert.equal(clam.openTicks,240);
 cl.updateNeptuneClams(s);r.playOceanMelody(s);assert.equal(clam.openTicks,239);
 s.gamePhase='paused';cl.updateNeptuneClams(s);assert.equal(clam.openTicks,239);s.gamePhase='playing';
 for(let i=0;i<239;i++)cl.updateNeptuneClams(s);assert.equal(clam.openTicks,0);
 s.playerX+=8*c.TILE_SIZE;r.playOceanMelody(s);assert.equal(clam.openTicks,0);
 s.playerX-=8*c.TILE_SIZE;r.playOceanMelody(s);assert.equal(clam.openTicks,240);
});

test('clam wave crosses walls, damages once out to eleven tiles, and slows and pushes enemies and the boss',()=>{
 const s=arena(),clam=s.neptune.clams[0],near=spawn(s,'normal',21),far=spawn(s,'normal',22),boss=spawn(s,'sea_chanter',12);
 near.hp=near.maxHp=30;s.map[10][11]=c.T_WALL;cl.openNeptuneClam(s,clam,0);cl.updateNeptuneClams(s);assert.equal(near.pushTiles,0,'wave must reach the target');
 wave(s);assert.equal(near.hp,26);assert.equal(near.pushTiles,3);assert.equal(near.pushDirX,1);
 assert.equal(e.stormSlowMultiplier(s,near),c.NEPTUNE_CLAM.slow);assert.equal(far.pushTiles,0);assert.equal(boss.pushTiles,3);assert.equal(boss.pushDirX,1);
 assert.equal(e.stormSlowMultiplier(s,boss),c.NEPTUNE_CLAM.slow);assert.equal(boss.hp,boss.maxHp-4);
 const bossX=boss.tileX;e.tick(s);assert.equal(boss.tileX,bossX+1,'the boss is moved by the clam wave like other enemies');
 const until=near.clamSlowUntil;cl.updateNeptuneClams(s);assert.equal(near.clamSlowUntil,until);
 s.gameTick=until;assert.equal(e.stormSlowMultiplier(s,near),1);
});

test('clam Melody breaks fish, damages balls once, taunts clones and relays closed clams without scoring a press',()=>{
 const s=arena(),clam=s.neptune.clams[0];s.godMode=false;s.playerHP=50;s.rubyHP=50;
 const blue=spawn(s,'fish_blue',12),red=spawn(s,'fish_red',13),ball=spawn(s,'water_bomb',14),clone=spawn(s,'water_clone',15);
 const other={tileX:17,tileY:10,openTicks:0,waveTicks:0,hitIds:[],pitch:0};s.neptune.clams.push(other);
 s.neptune.refrain={stage:'answer',tick:0,span:120,notes:[{at:0,pitch:0,result:'pending'}],extraMisses:0,healBudget:1,phase:1};
 cl.openNeptuneClam(s,clam,2);wave(s);
 assert.equal(blue.hp,0);assert.equal(red.hp,0);assert.equal(s.playerHP,50+c.NEPTUNE_FISH_HEAL-c.NEPTUNE_FISH_HURT);assert.equal(s.rubyHP,62);
 assert.ok(Math.abs(ball.hp-(ball.maxHp-2*c.NEPTUNE_MELODY_WATER_BALL_DAMAGE))<1e-8,'each of the two clam waves hits the ball once');
 assert.equal(clone.neptuneTauntTicks,c.NEPTUNE_MELODY_TAUNT_TICKS);assert.ok(other.openTicks>0);
 assert.equal(s.neptune.refrain.extraMisses,0);assert.equal(s.neptune.refrain.notes[0].result,'pending');assert.equal(s.neptune.refrain.answerStarted,undefined);
});

test('pufferfish charge faster and their expanded burst reaches one tile farther',()=>{
 const s=arena();s.godMode=false;s.playerHP=100;s.playerShieldHP=0;
 const puff=spawn(s,'pufferfish',13);puff.attackTimer=0;
 assert.ok(n.updatePufferfish(s,puff));assert.equal(puff.windupTicks,30);
 for(let i=0;i<29;i++)n.updatePufferfish(s,puff);assert.equal(s.playerHP,100);
 n.updatePufferfish(s,puff);assert.equal(s.playerHP,100-c.NEPTUNE_PUFF_DAMAGE);
});

test('phase 3 adds a corrupted clam per chamber and one hallway, preserving friendly positions',()=>{
 const s=fresh(),positions=s.neptune.clams.map(v=>[v.tileX,v.tileY]);s.neptune.phase=3;cl.updateNeptuneClams(s);
 assert.equal(s.neptune.clams.filter(v=>v.corrupted).length,5);assert.deepEqual(s.neptune.clams.filter(v=>!v.corrupted).map(v=>[v.tileX,v.tileY]),positions);
 const bad=s.neptune.clams.filter(v=>v.corrupted);for(const room of [0,1,2,3])assert.equal(bad.filter(v=>c.chamberOfTile(v.tileX,v.tileY)===room).length,1);
 assert.equal(bad.filter(v=>c.hallwayOfTile(v.tileX,v.tileY)>=0&&c.chamberOfTile(v.tileX,v.tileY)<0).length,1);
 assert.equal(new Set(s.neptune.clams.map(v=>v.tileX+v.tileY*c.MAP_COLS)).size,9);
 s.neptune.clamRepositionTicks=1;cl.updateNeptuneClams(s);assert.equal(s.neptune.clams.filter(v=>v.corrupted).length,5);
 s.neptune.phase=2;cl.updateNeptuneClams(s);assert.ok(s.neptune.clams.every(v=>!v.corrupted));
});

test('corrupted waves damage, push and slow the player once while leaving Ruby and Melody targets alone',()=>{
 const s=arena(),clam=s.neptune.clams[0];s.neptune.phase=3;clam.corrupted=true;s.godMode=false;s.playerHP=100;s.rubyHP=70;
 s.playerShieldHP=0;const fish=spawn(s,'fish_blue',11),mob=spawn(s,'normal',12),ball=spawn(s,'water_bomb',13);
 cl.openNeptuneClam(s,clam,0);assert.equal(clam.openTicks,c.NEPTUNE_CORRUPTED_CLAM.openTicks);
 assert.equal(clam.openTicks,c.NEPTUNE_CLAM.openTicks+60);wave(s);
 assert.equal(s.playerHP,95);assert.equal(s.rubyHP,70);assert.equal(fish.hp,1);assert.equal(ball.hp,ball.maxHp);assert.equal(mob.pushTiles,0);
 assert.ok(s.playerKnockback);assert.equal(s.playerKnockback.tilesLeft,5);assert.equal(s.playerKnockback.speedMult,1.6);assert.equal(cl.neptuneClamSlow(s),.7);
 const ticks=clam.openTicks;s.gamePhase='paused';cl.updateNeptuneClams(s);assert.equal(clam.openTicks,ticks);
 s.gamePhase='playing';cl.updateNeptuneClams(s);assert.equal(s.playerHP,95,'no repeated wave damage');
 s.gameTick=s.neptune.corruptedClamSlowUntil;assert.equal(cl.neptuneClamSlow(s),1);
});

test('corrupted clams stay open one second longer than friendly clams',()=>{
 const s=arena(),clam=s.neptune.clams[0];s.neptune.phase=3;clam.corrupted=true;
 cl.openNeptuneClam(s,clam,0);
 for(let i=0;i<c.NEPTUNE_CLAM.openTicks;i++)cl.updateNeptuneClams(s);
 assert.equal(clam.openTicks,c.NEPTUNE_CORRUPTED_CLAM.openTicks-c.NEPTUNE_CLAM.openTicks);
 for(let i=0;i<c.NEPTUNE_CORRUPTED_CLAM.openTicks-c.NEPTUNE_CLAM.openTicks;i++)cl.updateNeptuneClams(s);
 assert.equal(clam.openTicks,0);
});

test('corrupted wave respects shields and control immunity, and cannot reach past its radius',()=>{
 for(const outside of [false,true]){
  const s=arena(),clam=s.neptune.clams[0];s.neptune.phase=3;clam.corrupted=true;s.godMode=false;s.playerHP=100;s.playerShieldHP=20;s.ccImmuneUntil=s.gameTick+200;
  if(outside)s.playerX+=(c.NEPTUNE_CLAM.radius+1)*c.TILE_SIZE;
  cl.openNeptuneClam(s,clam,0);wave(s);assert.equal(s.playerHP,100);assert.equal(s.playerShieldHP,outside?20:15);
  assert.equal(s.playerKnockback,null);assert.equal(cl.neptuneClamSlow(s),1);
 }
});
