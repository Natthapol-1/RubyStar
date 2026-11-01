const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const compile=src=>ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,jsx:ts.JsxEmit.React}}).outputText;
require.extensions['.ts']=(m,f)=>m._compile(compile(fs.readFileSync(f,'utf8')),f);
const {createCanvas}=require('@napi-rs/canvas');
const {drawForestBackdrop}=require('../game/gaia-art.ts'),{drawMoonBackdrop}=require('../game/moon-art.ts');
const source=fs.readFileSync(path.join(__dirname,'../game/RubyStarGame.tsx'),'utf8');
// Neptune's backdrop is self-contained apart from the shared deterministic hash.
const a=source.indexOf('function drawOceanBackdrop('),b=source.indexOf('\nfunction ',a+1);
const renderer=new Module(path.join(__dirname,'ocean-preview.cjs'),module);renderer.paths=module.paths;
renderer._compile(compile('const MAP_ROWS=51,TILE_SIZE=48;'+source.slice(a,b)+';exports.draw=drawOceanBackdrop;'),renderer.filename||'ocean-preview.cjs');
const width=960,height=540;
function raster(draw,camY){const cv=createCanvas(width,height);draw(cv.getContext('2d'),width,height,300,camY,120);return cv.getContext('2d').getImageData(0,0,width,height).data;}
for(const [name,draw,boundaries]of[
 ['Gaia',drawForestBackdrop,[0,60/.14,60/.06,120/.14]],
 ['Moon',drawMoonBackdrop,[0,60/.12,60/.05,80/.09]],
 ['Neptune',renderer.exports.draw,[0,50/.06,60/.1,120/.1,51*48/2-height/2]]
])test(`${name} scenery stays continuous crossing vertical camera boundaries in both directions`,()=>{
 for(const y of boundaries){const before=raster(draw,y-.01),after=raster(draw,y+.01);let difference=0;
  for(let i=0;i<before.length;i+=4)difference+=Math.abs(before[i]-after[i])+Math.abs(before[i+1]-after[i+1])+Math.abs(before[i+2]-after[i+2]);
  const mean=difference/(width*height*3);assert.ok(mean<.4,`${name} jumped at camera Y=${y}: mean pixel change ${mean}`);
 }
});
