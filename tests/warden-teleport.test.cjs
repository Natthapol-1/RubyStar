const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE;
function place(s,[x,y]){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*T;s.playerY=(y+.5)*T;}

test('the Frost Warden teleports into the player\'s chamber, or a random other one when already sharing it',()=>{
  const s=e.createInitialState(),w=e.createEncounterEnemy(s,'frost_warden',...c.CHAMBER_SPAWN_TILES[0][0],100);s.enemies.push(w);
  place(s,c.CHAMBER_SPAWN_TILES[2][0]);
  for(let i=0;i<10;i++){const [x,y]=c.CHAMBER_SPAWN_TILES[i%2?0:1][0];w.tileX=w.targetTileX=x;w.tileY=w.targetTileY=y;
    e.relocateFrostWarden(s,w);assert.equal(c.chamberOfTile(w.tileX,w.tileY),2,'lands in the player\'s chamber');
    assert.ok(Math.hypot(w.tileX-s.playerTileX,w.tileY-s.playerTileY)>=3,'not on top of the player');}
  for(let i=0;i<10;i++){e.relocateFrostWarden(s,w);assert.equal(c.chamberOfTile(w.tileX,w.tileY)===2,false,'already together: moves elsewhere');
    const [x,y]=c.CHAMBER_SPAWN_TILES[2][1];w.tileX=w.targetTileX=x;w.tileY=w.targetTileY=y;}
});
