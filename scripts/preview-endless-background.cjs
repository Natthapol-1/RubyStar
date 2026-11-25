const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const source=fs.readFileSync('game/RubyStarGame.tsx','utf8');
const start=source.indexOf('// Fixed sky geometry'),end=source.indexOf('// Endless floor detail',start);
assert.ok(start>=0&&end>start);
const renderer=new Module(path.resolve('game/endless-backdrop-preview.cjs'),module);
renderer.filename=path.resolve('game/endless-backdrop-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(source.slice(start,end)+'\nexports.draw=drawEndlessSpaceBackdrop;', {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
function render(x,y,tick){
 const canvas=createCanvas(1280,720),ctx=canvas.getContext('2d');
 const initial=ctx.getTransform();renderer.exports.draw(ctx,1280,720,x,y,tick);
 assert.deepEqual(ctx.getTransform(),initial);assert.equal(ctx.globalAlpha,1);
 return canvas.toBuffer('image/png');
}
const image=render(380,240,1800);
assert.ok(image.equals(render(380,240,1800)),'Backdrop must render deterministically');
assert.ok(!image.equals(render(600,400,3600)),'Camera and time should affect the backdrop');
const output=process.argv[2]||'docs/ruby-star/visual-reference/endless-space-backdrop.png';
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,image);
console.log('Rendered the actual Endless backdrop; deterministic frames, camera/time response and canvas-state checks passed:',output);
