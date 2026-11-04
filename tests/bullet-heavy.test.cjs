const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE,near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e7;s.immortal=true;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;return s;}
function mob(s,type='normal',x=13,y=10){const a=e.createEncounterEnemy(s,type,x,y,1000);a.pathTimer=a.attackTimer=a.windupTicks=1e7;s.enemies.push(a);return a;}
function shoot(s,a){const hp=a.hp;s.bulletCooldown=0;e.useBullet(s);for(let i=0;i<30&&a.hp===hp;i++)e.tick(s);return hp-a.hp;}

test('every 20th bullet shot is heavy: 20% more damage and a one-tile knockback for a regular alien',()=>{
  const s=fresh(),a=mob(s);
  for(let i=1;i<c.BULLET_HEAVY_EVERY;i++)near(shoot(s,a),c.BULLET_DMG);
  assert.equal(a.tileX,13);
  s.bulletCooldown=0;e.useBullet(s);assert.equal(s.laserBullets.at(-1).heavy,true,'the 20th shot is marked heavy when fired');s.laserBullets=[];
  s.bulletShotCount=c.BULLET_HEAVY_EVERY-1;near(shoot(s,a),c.BULLET_DMG*c.BULLET_HEAVY_MULT);
  for(let i=0;i<5;i++)e.tick(s);assert.equal(a.tileX,14,'pushed away from the player');
  near(shoot(s,a),c.BULLET_DMG);
});

test('heavy bullet hits still add damage to bosses but never push them',()=>{
  const s=fresh(),boss=mob(s,'fiery_king');s.bulletShotCount=c.BULLET_HEAVY_EVERY-1;
  near(shoot(s,boss),c.BULLET_DMG*c.BULLET_HEAVY_MULT);assert.equal(boss.pushTiles,0);
});
