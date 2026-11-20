const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts');
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.comet.timer=1e9;s.immortal=true;return s;}
function mob(s,type,x){const a=e.createEncounterEnemy(s,type,x,5,1000);a.pathTimer=a.attackTimer=a.windupTicks=1e7;s.enemies.push(a);return a;}

test('web version shows no NEW ALIEN callout',()=>{
  const s=fresh();s.mode='endless';mob(s,'shooter',5);e.tick(s);assert.equal(s.alienIntro??null,null);
});

test('desktop Endless: each alien except the basic ones gets one NEW ALIEN callout; several queue up',(t)=>{
  global.window={rubyDesktop:{save:async()=>true}};t.after(()=>{delete global.window;});
  const s=fresh();s.mode='endless';mob(s,'normal',2);mob(s,'mini_splitter',3);mob(s,'queen_echo',4);e.tick(s);assert.equal(s.alienIntro??null,null,'basic aliens are not introduced');
  mob(s,'healer',5);mob(s,'bleeder',7);e.tick(s);
  assert.equal(s.alienIntro.type,'healer');assert.deepEqual(s.alienIntroQueue,['bleeder']);
  for(let i=0;i<e.ALIEN_INTRO_TICKS+1;i++)e.tick(s);assert.equal(s.alienIntro.type,'bleeder','next one follows');
  for(let i=0;i<e.ALIEN_INTRO_TICKS+1;i++)e.tick(s);assert.equal(s.alienIntro,null);
  mob(s,'healer',9);e.tick(s);assert.equal(s.alienIntro,null,'never shown twice');
});

test('desktop: bosses and aliens get callouts in Endless only',(t)=>{
  global.window={rubyDesktop:{save:async()=>true}};t.after(()=>{delete global.window;});
  const s=fresh();s.mode='endless';mob(s,'fiery_king',5);e.tick(s);assert.equal(s.alienIntro.type,'fiery_king');
  const trial=fresh();trial.mode='trial';mob(trial,'fiery_king',5);mob(trial,'healer',6);e.tick(trial);assert.equal(trial.alienIntro??null,null,'not in challenges');
});
