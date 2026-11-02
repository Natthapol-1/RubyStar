const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {createCanvas}=require('@napi-rs/canvas');
test('Frosticle spells and Ice Cub shoves cannot draw the shared alien attack beam',()=>{
 const source=fs.readFileSync('game/RubyStarGame.tsx','utf8'),start=source.indexOf('function drawMobAttack('),end=source.indexOf('\nfunction ',start+1);
 const code=ts.transpileModule(source.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2017}}).outputText;
 const draw=vm.runInNewContext(code+';drawMobAttack;'),canvas=createCanvas(160,160),ctx=canvas.getContext('2d');
 for(const type of ['ice_caller','rime_brute'])for(const ticks of [30,20,10,1])draw(ctx,type,40,40,120,120,ticks,'#b8cffb');
 assert.ok(ctx.getImageData(0,0,160,160).data.every(value=>value===0));
});
