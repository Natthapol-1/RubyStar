const fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('@napi-rs/canvas'),e=require('../game/engine.ts'),art=require('../game/world-themes.ts');
const canvas=createCanvas(960,240),ctx=canvas.getContext('2d');
for(const [i,ticks] of [39,32,24,16,11,4].entries()){
 const s=e.createModeState('trial','devourer');s.enemies=[];s.trial.devourer.maws=[];s.trial.devourer.soulSigns=[];
 s.trial.devourer.swallows=[{x:80,y:120,ticks,big:true,fromX:130,fromY:150,size:34}];
 ctx.save();ctx.translate(i*160,0);ctx.beginPath();ctx.rect(0,0,160,240);ctx.clip();ctx.fillStyle='#100a18';ctx.fillRect(0,0,160,240);
 ctx.strokeStyle='#271a36';ctx.lineWidth=1;for(let k=0;k<240;k+=24){ctx.strokeRect(0,k,160,24);ctx.strokeRect(k,0,24,240);}
 ctx.fillStyle='#020106';ctx.fillRect(62,102,36,36);ctx.strokeStyle='#b89fda';ctx.lineWidth=3;ctx.strokeRect(62,102,36,36);
 const before=JSON.stringify(s);art.drawSingularityMawEffects(ctx,s,0,0);if(before!==JSON.stringify(s))throw Error('Renderer mutated state');
 ctx.fillStyle='#e8d8ff';ctx.font='12px monospace';ctx.fillText(['DRAW IN','COLLAPSE','INHALE','CLOSE','SNAP','FADE'][i],12,24);ctx.restore();
}
fs.writeFileSync(process.argv[2]||'docs/ruby-star/visual-reference/singularity-eating.png',canvas.toBuffer('image/png'));
