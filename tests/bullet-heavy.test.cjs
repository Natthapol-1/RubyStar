const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE,near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e7;s.immortal=true;
  for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;s.playerTileX=s.playerTargetX=s.playerTileY=s.playerTargetY=10;s.playerX=s.playerY=10.5*T;return s;}
function mob(s,type='normal',x=13,y=10){const a=e.createEncounterEnemy(s,type,x,y,1000);a.pathTimer=a.attackTimer=a.windupTicks=1e7;s.enemies.push(a);return a;}
function shoot(s,a){const hp=a.hp;s.bulletCooldown=0;e.useBullet(s);for(let i=0;i<30&&a.hp===hp;i++)e.tick(s);return hp-a.hp;}

test('every 20th bullet shot is heavy: double damage and a one-tile knockback for a regular alien',()=>{
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

test('heavy bullet knockback discards a walking path that would cross cover after the push', () => {
  const s = fresh(), a = mob(s);
  s.map[11][14] = c.T_WALL;
  a.targetTileY = 11;
  a.path = [[13, 12]];
  s.bulletShotCount = c.BULLET_HEAVY_EVERY - 1;
  near(shoot(s, a), c.BULLET_DMG * c.BULLET_HEAVY_MULT);
  e.tick(s);
  assert.deepEqual([a.tileX, a.tileY], [14, 10]);
  assert.deepEqual(a.path, []);

  for (let i = 0; i < 48; i++) {
    e.tick(s);
    assert.ok(e.isFloorTile(s.map, Math.floor(a.x / T), Math.floor(a.y / T)));
  }
});

test('heavy bullet knockback checks for a wall beside the tile the alien has entered', () => {
  const s = fresh(), a = mob(s);
  s.map[11][14] = c.T_WALL;
  a.targetTileY = 11;
  a.stepProgress = T * .6;
  a.y += a.stepProgress;
  s.bulletShotCount = c.BULLET_HEAVY_EVERY - 1;
  near(shoot(s, a), c.BULLET_DMG * c.BULLET_HEAVY_MULT);
  e.tick(s);
  assert.deepEqual([a.tileX, a.tileY, a.targetTileX, a.targetTileY], [13, 11, 13, 11]);
  assert.deepEqual([a.x, a.y], [13.5 * T, 11.5 * T]);
});

test('Monoceros makes every 8th shot heavy instead of every 20th',()=>{
  const s=fresh(),a=mob(s);s.constellations=['heavyShot'];
  for(let i=1;i<c.BULLET_HEAVY_EVERY_MONOCEROS;i++)near(shoot(s,a),c.BULLET_DMG);
  near(shoot(s,a),c.BULLET_DMG*c.BULLET_HEAVY_MULT);
  near(shoot(s,a),c.BULLET_DMG);
});

test('a heavy bullet does not push (or cancel) a Lancer winding up or a Charger mid-rush',()=>{
  for(const type of ['lancer','charger']){
    const s=fresh(),a=mob(s,type);
    if(type==='lancer'){a.windupTicks=1e7;a.lanceDirX=-1;a.lanceDirY=0;}else{a.windupTicks=0;a.chargeWindupTicks=1e7;a.chargeDirX=-1;a.chargeDirY=0;}
    for(let i=1;i<c.BULLET_HEAVY_EVERY;i++)shoot(s,a);
    near(shoot(s,a),c.BULLET_DMG*c.BULLET_HEAVY_MULT);
    assert.equal(a.tileX,13,type+' not pushed');
    if(type==='lancer')assert.equal(a.lanceDirX,-1,'aim kept');else assert.equal(a.chargeDirX,-1,'rush kept');
  }
});

test('heavy bullets damage Grappler without interrupting an active warning, flight or pull',()=>{
 for(const phase of ['warning','flying','pull']){
  const s=fresh(),a=mob(s,'grappler');a.windupTicks=0;a.attackTimer=0;
  a.hook={phase,dx:-1,dy:0,x:a.x,y:a.y,ticks:1000,travel:0};
  if(phase==='pull')s.playerKnockback={dirX:1,dirY:0,started:false,tilesLeft:2,hookOwnerId:a.id};
  s.ccImmuneUntil=s.gameTick+300;
  // Hold AI so the assertion isolates heavy-shot knockback from the hook's travel and pull completion.
  s.ambientEvents.active={kind:'eclipse',ticks:1000,points:[]};
  s.bulletShotCount=c.BULLET_HEAVY_EVERY-1;
  near(shoot(s,a),c.BULLET_DMG*c.BULLET_HEAVY_MULT);assert.equal(a.pushTiles,0);assert.equal(a.hook.phase,phase);
 }
});
