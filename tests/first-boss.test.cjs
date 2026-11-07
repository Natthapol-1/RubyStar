const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
global.window={addEventListener(){},dispatchEvent(){},removeEventListener(){}};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),profile=require('../game/profile.ts');
function firstBoss(desktop){
  window.rubyDesktop=desktop?{}:undefined;
  const s=e.createModeState('endless');s.noMobs=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.resourceTimer=-1e7;s.bossTimer=1;s.difficultyLevel=1;
  const real=Math.random;Math.random=()=>.99; // a random draw would not pick the King
  try{for(let i=0;i<c.BOSS_WARNING_TICKS+5&&!s.enemies.some(a=>c.isBossType(a.type));i++)e.tick(s);}finally{Math.random=real;}
  return s.enemies.find(a=>c.isBossType(a.type))?.type;
}

test('a new desktop player always meets the Fiery King first, until they have beaten it in Endless',()=>{
  const p=profile.getProfile();p.defeated.length=0;
  assert.equal(firstBoss(true),'fiery_king');
  p.defeated.push('fiery_king');assert.notEqual(firstBoss(true),'fiery_king','random once the King is beaten');
  p.defeated.length=0;assert.notEqual(firstBoss(false),'fiery_king','web runs stay random');
  window.rubyDesktop=undefined;
});
