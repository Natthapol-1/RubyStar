const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts');
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.comet.timer=1e9;s.immortal=true;return s;}
function mob(s,type,x){const a=e.createEncounterEnemy(s,type,x,5,1000);a.pathTimer=a.attackTimer=a.windupTicks=1e7;s.enemies.push(a);return a;}

test('a late alien gets one NEW ALIEN callout per type; several queue up; older aliens get none',()=>{
  const s=fresh();mob(s,'lancer',3);e.tick(s);assert.equal(s.alienIntro??null,null,'older aliens are not introduced');
  mob(s,'shooter',5);mob(s,'bleeder',7);e.tick(s);
  assert.equal(s.alienIntro.type,'shooter');assert.deepEqual(s.alienIntroQueue,['bleeder']);
  for(let i=0;i<e.ALIEN_INTRO_TICKS+1;i++)e.tick(s);assert.equal(s.alienIntro.type,'bleeder','next one follows');
  for(let i=0;i<e.ALIEN_INTRO_TICKS+1;i++)e.tick(s);assert.equal(s.alienIntro,null);
  mob(s,'shooter',9);e.tick(s);assert.equal(s.alienIntro,null,'never shown twice');
});
