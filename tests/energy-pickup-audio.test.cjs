const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const engine=require('../game/engine.ts'),c=require('../game/constants.ts');
for(const full of [false,true])test('energy shard plays one '+(full?'power-up':'pickup')+' cue without stacked or boost sounds',()=>{
 const oldAudio=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;}play(){played.push(this.src);return Promise.resolve();}pause(){}};
 try{
  const s=engine.createInitialState();s.noMobs=true;s.meteoriteTimer=100000;s.resourceTimer=-100000;
  s.starEnergy=full?c.STAR_ENERGY_MAX-c.ENERGY_AMOUNT:0;
  s.resources=[{type:'energy',tileX:s.playerTileX,tileY:s.playerTileY}];engine.tick(s);
  assert.deepEqual(played,[full?'/sounds/powerUpBoost.mp3':'/sounds/celestial/energy-pickup.wav']);
  assert.equal(s.resources.length,0);assert.ok(s.speedActiveTicks>0);
  engine.tick(s);assert.equal(played.length,1);
 }finally{global.Audio=oldAudio;}
});

test('direct energy gains use the Endless full-bar sound once on every challenge',()=>{
 const {addStarEnergy}=require('../game/blessing-effects.ts');
 const oldAudio=global.Audio,played=[];
 global.Audio=class{constructor(src){this.src=src;}play(){played.push([this.src,this.volume]);return Promise.resolve();}pause(){}};
 try{
  for(const skill of ['fiery_king','sea_chanter','thorn_weaver','blind_prayer','devourer','frost_warden','storm_reaper','astral_twins','aegis_sentinel','splitter_queen']){
   const state=engine.createModeState('trial',skill);
   played.length=0;
   addStarEnergy(state, c.STAR_ENERGY_MAX-1, false);
   assert.deepEqual(played,[],skill);
   addStarEnergy(state,1,false);
   addStarEnergy(state,1,false);
   assert.deepEqual(played,[['/sounds/powerUpBoost.mp3',.38]],skill);
  }
 }finally{global.Audio=oldAudio;}
});
