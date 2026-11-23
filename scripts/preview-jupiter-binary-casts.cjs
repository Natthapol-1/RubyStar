const fs=require('fs'),ts=require('typescript'),Module=require('module'),path=require('path'),{createCanvas}=require('@napi-rs/canvas');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const c=require('../game/constants.ts'),source=fs.readFileSync('game/RubyStarGame.tsx','utf8'),ast=ts.createSourceFile('cast.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='drawCelestialCast');
if(!node)throw Error('Cast painter missing');
const m=new Module(path.resolve('game/skill-cast-preview.cjs'),module);m.filename=path.resolve('game/skill-cast-preview.cjs');m.paths=module.paths;
m._compile(ts.transpileModule("const {drawJupiterLightning}=require('./jupiter-art.ts');"+'const {'+Object.keys(c).join(',')+"}=require('./constants.ts');"+node.getText(ast)+';exports.draw=drawCelestialCast;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,m.filename);
const canvas=createCanvas(1200,720),ctx=canvas.getContext('2d');ctx.fillStyle='#0c1320';ctx.fillRect(0,0,1200,720);
for(const [row,kind] of ['storm_reaper','astral_twins'].entries())for(const [col,age] of [.15,.4,.7].entries()){
 const x=col*400,y=row*360;ctx.fillStyle='#d5e5ef';ctx.font='14px monospace';ctx.fillText(c.SPECIAL_SKILLS[kind].name+' · '+age,x+20,y+28);
 ctx.save();ctx.beginPath();ctx.rect(x,y+35,400,325);ctx.clip();ctx.translate(x+200,y+195);if(row===0)ctx.scale(.57,.57);m.exports.draw(ctx,kind,0,0,age,12);ctx.restore();
}
fs.writeFileSync(process.argv[2]||'.tmp/jupiter-binary-casts.png',canvas.toBuffer('image/png'));
