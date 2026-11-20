const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{const src=fs.readFileSync(f,'utf8');m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const player=(s,x,y)=>{s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*c.TILE_SIZE;s.playerY=(y+.5)*c.TILE_SIZE;s.playerStepProgress=0;s.playerKnockback=null;s.playerChamber=c.chamberOfTile(x,y);};

test('Star Gambit teleport offers every Bazaar chamber and lands on its pad', () => {
  const s=e.createModeState('gambit');
  assert.equal(c.CHAMBER_BOUNDS.length,7);
  for(let from=0;from<7;from++)for(let to=0;to<7;to++){
    if(from===to)continue;
    const [px,py]=c.TELEPORT_PADS[from];player(s,px,py+1);s.teleportCooldown=0;s.gamePhase='playing';
    assert.ok(e.tryActivateTeleport(s));
    assert.deepEqual(s.teleportDestOptions,[0,1,2,3,4,5,6].filter(ch=>ch!==from));
    e.doTeleport(s,to);
    assert.deepEqual([s.playerTileX,s.playerTileY],c.TELEPORT_PADS[to]);
    assert.equal(s.playerChamber,to);
  }
});

test('the standard station keeps four chambers and its own pads after a Star Gambit run', () => {
  e.createModeState('gambit');
  const s=e.createModeState('endless');
  assert.equal(c.CHAMBER_BOUNDS.length,4);
  const [px,py]=c.TELEPORT_PADS[0];player(s,px,py+1);s.teleportCooldown=0;s.gamePhase='playing';
  assert.ok(e.tryActivateTeleport(s));
  assert.deepEqual(s.teleportDestOptions,[1,2,3]);
  e.doTeleport(s,3);
  assert.deepEqual([s.playerTileX,s.playerTileY],[39,39]);
});

test('the Star Gambit wave clock drains and then moves to the next wave', () => {
  const g=require('../game/gambit.ts'),s=e.createModeState('gambit');s.gamePhase='playing';
  assert.equal(s.gambit.wave,1);assert.equal(s.gambit.glint,0);
  for(let i=0;i<g.GAMBIT_WAVE_TICKS-1;i++)g.updateGambit(s);
  assert.equal(s.gambit.wave,1);assert.equal(s.gambit.waveTicks,1);
  g.updateGambit(s);
  assert.equal(s.gambit.wave,2);assert.equal(s.gambit.waveTicks,g.GAMBIT_WAVE_TICKS);
});

test('every floor tile of the Bazaar can be reached', () => {
  e.createModeState('gambit');const map=c.generateBazaarMap(),[sx,sy]=c.TELEPORT_PADS[0],seen=new Set([sx+','+sy]),q=[[sx,sy]];
  while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,k=nx+','+ny;if(!seen.has(k)&&map[ny]?.[nx]!==undefined&&map[ny][nx]!==c.T_WALL){seen.add(k);q.push([nx,ny]);}}}
  map.forEach((row,y)=>row.forEach((t,x)=>{if(t!==c.T_WALL)assert.ok(seen.has(x+','+y),'unreachable '+x+','+y);}));
});
