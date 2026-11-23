const fs=require('fs'),ts=require('typescript'),Module=require('module'),path=require('path'),{createCanvas}=require('@napi-rs/canvas');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const c=require('../game/constants.ts'),source=fs.readFileSync('game/RubyStarGame.tsx','utf8'),ast=ts.createSourceFile('cast.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='drawCelestialCast');
if(!node)throw Error('Cast painter missing');
const m=new Module(path.resolve('game/skill-cast-preview.cjs'),module);m.filename=path.resolve('game/skill-cast-preview.cjs');m.paths=module.paths;
m._compile(ts.transpileModule("const {drawJupiterLightning}=require('./jupiter-art.ts');"+'const {'+Object.keys(c).join(',')+"}=require('./constants.ts');"+node.getText(ast)+';exports.draw=drawCelestialCast;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);

const canvas=createCanvas(1440,480),ctx=canvas.getContext('2d');ctx.fillStyle='#0c1320';ctx.fillRect(0,0,1440,480);
for(const[i,age]of [.15,.4,.7].entries()){
 ctx.save();ctx.beginPath();ctx.rect(i*480,0,480,480);ctx.clip();ctx.translate(i*480+240,250);ctx.scale(.8,.8);m.exports.draw(ctx,'blind_prayer',0,0,age,12);ctx.restore();
 ctx.fillStyle='#d5e5ef';ctx.font='14px monospace';ctx.fillText('Sirius Surge · '+age,i*480+20,30);
}
fs.writeFileSync(process.argv[2]||'.tmp/sirius-surge.png',canvas.toBuffer('image/png'));
