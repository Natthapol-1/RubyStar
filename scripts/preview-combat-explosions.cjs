const fs=require('fs'),ts=require('typescript'),Module=require('module'),path=require('path'),{createCanvas}=require('@napi-rs/canvas');
const source=fs.readFileSync('game/RubyStarGame.tsx','utf8'),tree=ts.createSourceFile('RubyStarGame.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const names=new Set(['drawBombBlast','drawTrapBlast','drawLayeredBombExplosion']);
const functions=tree.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.has(n.name?.text));
if(functions.length!==names.size)throw Error('Explosion painters missing');
const renderer=new Module(path.resolve('game/explosion-preview.cjs'),module);renderer.filename=path.resolve('game/explosion-preview.cjs');
renderer._compile(ts.transpileModule(functions.map(n=>n.getText(tree)).join('\n')+'\nexports.draw={drawBombBlast,drawTrapBlast};',{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,renderer.filename);
const cv=createCanvas(1400,840),ctx=cv.getContext('2d');
const cases=[['PLAYER BOMB',(c,r,t)=>renderer.exports.draw.drawBombBlast(c,140,155,r,t)],['OPAL COPY',(c,r,t)=>renderer.exports.draw.drawBombBlast(c,140,155,r,t,true)],['AMBER',(c,r,t)=>renderer.exports.draw.drawBombBlast(c,140,155,r,t,false,true)],['BOMBER / TRAPPER',(c,r,t)=>renderer.exports.draw.drawTrapBlast(c,140,155,r,t)],['BINARY ECHO',(c,r,t)=>renderer.exports.draw.drawTrapBlast(c,140,155,r,t,true)]];
for(let row=0;row<3;row++)cases.forEach(([label,paint],col)=>{
 ctx.save();ctx.translate(col*280,row*280);ctx.beginPath();ctx.rect(0,0,280,280);ctx.clip();ctx.fillStyle='#101923';ctx.fillRect(0,0,280,280);
 ctx.strokeStyle='#1c2b39';for(let x=0;x<280;x+=48)for(let y=0;y<280;y+=48)ctx.strokeRect(x,y,48,48);
 ctx.fillStyle='#c4d4e4';ctx.font='bold 13px monospace';ctx.fillText(label,15,24);
 paint(ctx,[45,83,108][row],[25,16,7][row]);ctx.restore();
});
fs.writeFileSync('docs/ruby-star/visual-reference/combat-explosion-materials.png',cv.toBuffer('image/png'));
// All variants must render safely at spawn and expiry, including a radius of zero.
for(const [,paint]of cases)for(const [r,t]of [[0,30],[1,28],[120,1],[120,0]])paint(ctx,r,t);
console.log('Rendered five explosion palettes at three ages and checked zero-radius/expiry states.');
