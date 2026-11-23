const assert=require('node:assert/strict'),test=require('node:test'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const audio=require('../game/event-audio.ts');

test('gas exposure uses one pair of layers, follows depth, fades out and shares pause and cleanup',()=>{
  const previous=global.Audio,voices=[];
  global.Audio=class{constructor(src){this.src=src;this.volume=1;voices.push(this);}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};
  try{
    audio.stopAmbientEventSounds();audio.syncToxicGasSound(0);assert.equal(voices.length,0);
    for(let i=0;i<30;i++)audio.syncToxicGasSound(1);
    assert.equal(voices.length,2);const voice=voices[0],hiss=voices[1];assert.equal(voice.loop,true);assert.equal(voice.volume,.5);assert.equal(hiss.loop,true);assert.equal(hiss.volume,.55);assert.equal(hiss.playbackRate,1);assert.ok(hiss.src.endsWith('singularity-gas-hiss.mp3'));
    for(let i=0;i<20;i++)audio.syncToxicGasSound(.1);
    assert.ok(Math.abs(voice.volume-.32)<.001);
    audio.pauseAmbientEventSounds();assert.equal(voice.paused,true);assert.equal(hiss.paused,true);
    audio.syncToxicGasSound(1);assert.equal(voices.length,2);
    audio.resumeAmbientEventSounds();assert.equal(voice.paused,false);assert.equal(hiss.paused,false);
    for(let i=0;i<30;i++)audio.syncToxicGasSound(0);
    assert.equal(voice.paused,true);assert.equal(voice.volume,0);assert.equal(hiss.paused,true);assert.equal(hiss.volume,0);
    audio.syncToxicGasSound(1);assert.equal(voices.length,4);
    audio.stopAmbientEventSounds();assert.equal(voices[2].paused,true);assert.equal(voices[3].paused,true);
    audio.syncToxicGasSound(0);assert.equal(voices.length,4);
  }finally{audio.stopAmbientEventSounds();global.Audio=previous;}
});
