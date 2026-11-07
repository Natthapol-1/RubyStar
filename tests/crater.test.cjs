const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
const T=c.TILE_SIZE;
function fresh(constellations){const s=e.createInitialState();s.constellations=constellations;s.noMobs=s.noBossSpawns=true;s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.comet.timer=1e9;s.rubyTileX=s.rubyTileY=-1;s.playerCarryingRuby=true;return s;}
function moveTo(s,room){const [r1,c1,r2,c2]=c.CHAMBER_BOUNDS[room];for(let y=r1+1;y<r2;y++)for(let x=c1+1;x<c2;x++)if(e.isFloorTile(s.map,x,y)){s.playerTileX=s.playerTargetX=x;s.playerTileY=s.playerTargetY=y;s.playerX=(x+.5)*T;s.playerY=(y+.5)*T;s.playerChamber=room;return;}}
function strike(s,room){s.meteoriteWarning=room;s.meteoriteStrikeIn=1;s.meteoriteTimer=1e7;e.tick(s);}

test('Crater: a meteor leaves its room healing the player for 8 seconds',()=>{
  const s=fresh(['meteorHeal']);moveTo(s,1);strike(s,0);
  assert.equal(s.craterField.chamber,0);assert.ok(s.craterField.ticks>=c.CRATER.ticks-1);
  s.playerHP=50;moveTo(s,0);for(let i=0;i<120;i++)e.tick(s);
  assert.ok(Math.abs(s.playerHP-(50+120/c.CRATER.pulseTicks*c.CRATER.healPerPulse))<=c.CRATER.healPerPulse,`healed to ${s.playerHP}`);
  moveTo(s,1);const outside=s.playerHP;for(let i=0;i<60;i++)e.tick(s);assert.equal(s.playerHP,outside,'no healing outside the room');
  s.playerCarryingRuby=false;s.rubyTileX=s.rubyTileY=10;s.rubyHP=50;for(let i=0;i<48;i++)e.tick(s);assert.ok(s.rubyHP>50,'placed Ruby in the room heals');
  for(let i=0;i<c.CRATER.ticks;i++)e.tick(s);assert.equal(s.craterField,null,'the glow ends');
});

test('without Crater a meteor leaves no healing room',()=>{
  const s=fresh([]);moveTo(s,1);strike(s,0);assert.equal(s.craterField??null,null);
});
