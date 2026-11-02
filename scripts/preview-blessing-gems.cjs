const fs=require('fs'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,jsx:ts.JsxEmit.ReactJSX}}).outputText,f);
const Gem=require('../game/BlessingGem.tsx').default,{CELESTIAL_BLESSINGS:catalog}=require('../game/endless-builds.ts');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{const cv=createCanvas(1200,570),ctx=cv.getContext('2d');ctx.fillStyle='#070d19';ctx.fillRect(0,0,1200,570);let i=0;
for(const [kind,gem]of Object.entries(catalog).filter(([kind])=>kind!=='stardust')){const x=20+i%5*238,y=20+Math.floor(i/5)*275;ctx.fillStyle='#17263c';ctx.fillRect(x,y,220,252);ctx.strokeStyle=gem.color;ctx.lineWidth=2;ctx.strokeRect(x,y,220,252);
const svg=renderToStaticMarkup(React.createElement(Gem,{kind})).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="160" height="136" ');
ctx.drawImage(await loadImage(Buffer.from(svg)),x+30,y+12,160,136);ctx.fillStyle=gem.color;ctx.textAlign='center';ctx.font='bold 17px monospace';ctx.fillText(gem.name.toUpperCase(),x+110,y+177);ctx.font='13px monospace';ctx.fillText(gem.celestial.toUpperCase(),x+110,y+199);ctx.fillStyle='#d7e3ef';ctx.font='12px monospace';ctx.fillText('CHOOSE · '+((i+1)%10),x+110,y+231);i++;}
fs.writeFileSync('docs/ruby-star/visual-reference/blessing-gemstones.png',cv.toBuffer('image/png'));console.log('Rendered all ten gemstone components from actual source.');})().catch(e=>{console.error(e);process.exitCode=1});
