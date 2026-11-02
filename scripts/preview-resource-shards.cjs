// Compare actual pickup painters at game scale and enlarged reference scale.
const fs=require('fs'),vm=require('vm'),ts=require('typescript'),{createCanvas}=require('@napi-rs/canvas');
const source=fs.readFileSync('game/RubyStarGame.tsx','utf8');
function extract(name){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);return source.slice(start,end);}
const code=ts.transpileModule(extract('drawPixelBolt')+'\n'+extract('drawResourcePickup'),{compilerOptions:{target:ts.ScriptTarget.ES2017}}).outputText;
const draw=vm.runInNewContext(code+';drawResourcePickup;');
const canvas=createCanvas(600,260),ctx=canvas.getContext('2d');ctx.fillStyle='#101923';ctx.fillRect(0,0,600,260);
for(const [i,type]of [true,false,'shield'].entries()){
 ctx.fillStyle='#b8c8d9';ctx.font='14px monospace';ctx.textAlign='center';ctx.fillText(['HEAL','ENERGY','SHIELD'][i],100+i*200,28);
 draw(ctx,100+i*200,75,type,40);ctx.save();ctx.translate(100+i*200,180);ctx.scale(3,3);draw(ctx,0,0,type,40);ctx.restore();
}
const out=process.argv[2]||'docs/ruby-star/visual-reference/resource-shards.png';fs.writeFileSync(out,canvas.toBuffer('image/png'));
