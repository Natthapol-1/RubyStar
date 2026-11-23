const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),r=require('../game/neptune-refrain.ts'),art=require('../game/neptune-refrain-art.ts'),{createCanvas}=require('@napi-rs/canvas');
test('incorrect answer presses leave red timestamp markers; correct presses do not, and history is bounded',()=>{
 const s=e.createModeState('trial','sea_chanter');s.neptune.clams=[];
 const song={stage:'answer',tick:0,span:120,notes:[{at:0,pitch:0,result:'pending'},{at:60,pitch:1,result:'pending'}],extraMisses:0,healBudget:1,phase:1,answerStarted:true};s.neptune.refrain=song;
 r.playOceanMelody(s);assert.equal(song.mistakeMarks,undefined);song.tick=30;r.playOceanMelody(s);assert.deepEqual(song.mistakeMarks,[30]);
 for(let i=0;i<100;i++)r.playOceanMelody(s);assert.equal(song.mistakeMarks.length,64);assert.equal(song.extraMisses,101);
 const cv=createCanvas(320,24),ctx=cv.getContext('2d'),before=JSON.stringify(song);art.drawRefrainScore(ctx,song,320,24,'');
 const x=Math.round(8+30/120*(320-16)),pixel=ctx.getImageData(x,3,1,1).data;
 assert.deepEqual([...pixel],[240,107,135,255]);assert.equal(JSON.stringify(song),before,'rendering preserves state');
});
