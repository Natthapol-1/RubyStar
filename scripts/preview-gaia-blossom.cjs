const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('@napi-rs/canvas'),art=require('../game/gaia-art.ts'),engine=require('../game/engine.ts');
const canvas=createCanvas(1344,360),ctx=canvas.getContext('2d');
const state=engine.createModeState('trial','thorn_weaver'),blossom=engine.createEncounterEnemy(state,'blossom',8,8,12);
for(const [i,level]of [0,2,3,0].entries()){
 blossom.shootTicks=i===2?6:0;const before=JSON.stringify(blossom);
 ctx.fillStyle='#0b1711';ctx.fillRect(i*336,0,336,360);
 ctx.save();ctx.translate(i*336+24,48);ctx.scale(2,2);
 for(let y=0;y<3;y++)for(let x=0;x<3;x++)if(level>0)art.drawGrowthTile(ctx,level,x*48,y*48,x+7,y+7,120);
 art.drawGaiaUnit(ctx,blossom,72,72,i===1?244:120,i!==3);ctx.restore();
 assert.equal(JSON.stringify(blossom),before,'Drawing must not change the Blossom');
 ctx.fillStyle='#d8e9d1';ctx.font='14px monospace';ctx.textAlign='center';ctx.fillText(['CLEAR GROUND','VINES','THICKET / FIRING','RULE SHEET / NO AURA'][i],i*336+168,25);
}
const output=process.argv[2]||'docs/ruby-star/visual-reference/gaia-blossom-visibility.png';
fs.writeFileSync(output,canvas.toBuffer('image/png'));console.log('Rendered actual Blossom art on clear ground, vines and thicket without changing unit state:',output);
