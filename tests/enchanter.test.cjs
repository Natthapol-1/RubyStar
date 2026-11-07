const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE,E=c.ENCHANTER;
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e9;s.immortal=true;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=40;s.playerX=s.playerY=40.5*T;s.rubyTileX=s.rubyTileY=45;s.playerCarryingRuby=false;return s;}
function mob(s,type,x,y){const a=e.createEncounterEnemy(s,type,x,y,1000);a.pathTimer=a.attackTimer=a.windupTicks=1e7;s.enemies.push(a);return a;}

test('an Enchanter pulses a buff onto nearby aliens and bosses, never itself or out of range',()=>{
  const s=fresh(),ench=mob(s,'enchanter',10,10);ench.attackTimer=0;
  const near=mob(s,'normal',13,10),far=mob(s,'normal',10,10+E.radius+2),boss=mob(s,'fiery_king',10,12);
  e.tick(s);
  assert.ok(near.enchantedUntil>s.gameTick&&near.enchantedUntil<=s.gameTick+E.buffTicks,'near ally buffed');assert.equal(far.enchantedUntil,undefined);assert.ok(boss.enchantedUntil>s.gameTick,'bosses are buffed too');assert.equal(ench.enchantedUntil,undefined);
  assert.ok(ench.attackTimer>=E.pulseTicks-1,'next pulse waits');
});

test('buffed aliens hit harder and move faster until the buff ends',()=>{
  const s=fresh(),a=mob(s,'normal',20,20);a.enchantedUntil=s.gameTick+100;
  e.damagePlayer(s,10,a);assert.ok(Math.abs(s.playerHP-(100-10*E.damageMult))<1e-9);
  assert.ok(Math.abs(e.celestialMoveMultiplier(s,a)-c.MOVE_SPEED_MULT*E.speedMult)<1e-9);
  s.gameTick+=100;assert.ok(Math.abs(e.celestialMoveMultiplier(s,a)-c.MOVE_SPEED_MULT)<1e-9);
});

test('Enchanters join the spawn pool from stage 20, at most two alive',()=>{
  const s=fresh(),base=['normal'];s.bossesKilled=19;assert.ok(!e.spawnPool(s,base).includes('enchanter'));
  s.bossesKilled=20;assert.ok(e.spawnPool(s,base).includes('enchanter'));
  for(let i=0;i<E.maxAlive;i++)mob(s,'enchanter',30+i,30);assert.ok(!e.spawnPool(s,base).includes('enchanter'),'capped');
});

test('bosses get a smaller Enchanter buff',()=>{
  const s=fresh(),k=mob(s,'fiery_king',20,20);k.enchantedUntil=s.gameTick+100;
  e.damagePlayer(s,10,k);assert.ok(Math.abs(s.playerHP-(100-10*E.bossDamageMult))<1e-9);
  assert.ok(Math.abs(e.celestialMoveMultiplier(s,k)-c.MOVE_SPEED_MULT*E.bossSpeedMult)<1e-9);
});
