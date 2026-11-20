const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
test('casting Jupiter Storm hastes you by 30% for 1.5 seconds, in any mode',()=>{
 for(const mode of [['endless'],['trial','storm_reaper'],['trial','fiery_king']]){
  const s=e.createModeState(...mode);s.noMobs=true;s.meteoriteTimer=1e6;s.specialSkill='storm_reaper';s.specialLockTicks=0;
  e.useSpecialSkill(s);assert.equal(s.stormHasteTicks,c.SPECIAL_REAPER_HASTE_TICKS,mode.join(' '));
  for(let i=0;i<c.SPECIAL_REAPER_HASTE_TICKS;i++)e.tick(s);assert.equal(s.stormHasteTicks,0,'it wears off');
 }
});
