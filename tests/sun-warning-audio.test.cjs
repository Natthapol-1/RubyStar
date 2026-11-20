const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),vm=require('node:vm'),ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('game/ui-sfx.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText;
function capture(effectVolume=1){
 const voices=[],gains=[],recordings=[];
 class AudioContext{
  constructor(){this.currentTime=0;this.state='running';this.destination={};}
  createOscillator(){
   const voice={type:'sine',from:0,to:0,startTime:0,stopTime:0,connect(){},start(t){this.startTime=t;},stop(t){this.stopTime=t;}};
   voice.frequency={setValueAtTime(v){voice.from=v;},exponentialRampToValueAtTime(v){voice.to=v;}};
   voices.push(voice);return voice;
  }
  createGain(){return{gain:{setValueAtTime(v){gains.push(v);},exponentialRampToValueAtTime(v){gains.push(v);}},connect(){}};}
 }
 const exports={};vm.runInNewContext(code,{exports,window:{AudioContext},require(name){if(name==='./event-audio')return{playSunHeatWarning:()=>recordings.push("heat"),playSunburstWarning:()=>recordings.push("sunburst")};assert.equal(name,'./audio-settings');return{channelVolume:()=>effectVolume};}});
 return{play:exports.playUiSfx,voices,gains,recordings};
}

test('both Sun warnings use the supplied recording without the old horn',()=>{
 const heat=capture(),burst=capture();heat.play('sunHeatWarning');heat.play('sunHeatWarning');burst.play('sunburstWarning');
 assert.deepEqual(heat.recordings,['heat','heat']);assert.deepEqual(burst.recordings,['sunburst']);
 assert.equal(heat.voices.length,0);assert.equal(burst.voices.length,0);
});

test('muting game effects silences both Sun warnings',()=>{
 const muted=capture(0);muted.play('sunHeatWarning');muted.play('sunburstWarning');assert.equal(muted.voices.length,0);assert.equal(muted.recordings.length,0);
});
