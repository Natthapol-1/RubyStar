const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts');
const maps=[['fiery_king','sun','godSetSunPhase'],['storm_reaper','jupiter','godSetJupiterPhase'],['sea_chanter','neptune','godSetNeptunePhase'],['thorn_weaver','gaia','godSetGaiaPhase'],['frost_warden','saturn','godSetSaturnPhase'],['astral_twins','binary','godSetBinaryPhase'],['blind_prayer','sirius','godSetSiriusPhase'],['aegis_sentinel','venus','godSetVenusPhase'],['splitter_queen','moon','godSetMoonPhase'],['devourer','engine','godSetSingularityPhase']];
test('the god panel phase 2/3 buttons bring TIME and the spawn clock up to at least 60 seconds on every map',()=>{
 for(const [boss,mod,fn] of maps){
  const set=require('../game/'+mod+'.ts')[fn];assert.ok(set,fn);
  const s=e.createModeState('trial',boss);s.noMobs=true;s.meteoriteTimer=1e6;
  set(s,1);assert.ok(s.score<60,boss+': phase 1 leaves the clock alone');
  set(s,2);assert.ok(s.score>=60&&s.difficultyTimer>=3600,boss+': phase 2 is at least a minute in');
  s.score=90;s.difficultyTimer=5400;set(s,3);assert.equal(s.score,90,boss+': a later clock is kept');assert.equal(s.difficultyTimer,5400);
 }
});
