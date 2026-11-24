const fs=require('fs'),ts=require('typescript'),Module=require('module'),path=require('path'),{createCanvas}=require('@napi-rs/canvas');
const source=fs.readFileSync('game/RubyStarGame.tsx','utf8'),tree=ts.createSourceFile('RubyStarGame.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=new Set(['drawPlayerWave','drawEnergyPixelRay','drawCompassStar']);
const functions=tree.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.has(n.name?.text));
if(functions.length!==names.size)throw Error('Wave preview dependencies missing');
const renderer=new Module(path.resolve('game/charge-wave-preview.cjs'),module);renderer.filename=path.resolve('game/charge-wave-preview.cjs');
renderer._compile(ts.transpileModule(functions.map(n=>n.getText(tree)).join('\n')+'\nexports.draw=drawPlayerWave;',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const cv=createCanvas(1400,640),ctx=cv.getContext('2d');
const variants=[['NORMAL',false],['POWERED',true],['SOLAR',false,'solar'],['EMERALD',false,'emerald'],['OPAL',false,'opal'],['AMBER',false,'amber'],['ECHO',false,'echo'],['POWERED OPAL',true,'opal']];
variants.forEach(([label,powered,tint],i)=>{
 ctx.save();ctx.translate(i%4*350,Math.floor(i/4)*320);ctx.beginPath();ctx.rect(0,0,350,320);ctx.clip();ctx.fillStyle='#101923';ctx.fillRect(0,0,350,320);
 ctx.strokeStyle='#1c2b39';for(let x=0;x<350;x+=48)for(let y=0;y<320;y+=48)ctx.strokeRect(x,y,48,48);
 ctx.fillStyle='#c4d4e4';ctx.font='bold 15px monospace';ctx.fillText(label,20,28);
 renderer.exports.draw(ctx,175,173,98,powered,24,tint);ctx.restore();
});
fs.writeFileSync('docs/ruby-star/visual-reference/player-charge-wave-trails.png',cv.toBuffer('image/png'));
console.log('Rendered all eight wave variants from the actual player-wave painter.');
