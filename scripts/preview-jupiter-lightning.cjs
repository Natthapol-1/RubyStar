// Render Venus shield-break stages through the actual battlefield painter.
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts'), art = require('../game/jupiter-art.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|player-suit-art|convergence-art|devourer-model-art|singularity-maw|venus-art|venus|gambit-art|gambit|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;';
const renderer = new Module(path.resolve('game/gaia-preview.cjs'), module);
renderer.filename = path.resolve('game/gaia-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);

const out=process.argv[2]||'.tmp/jupiter-lightning';fs.mkdirSync(out,{recursive:true});
const cv=createCanvas(1280,640),ctx=cv.getContext('2d');
const cases=[
 ['Warm sky',(ctx,s)=>art.drawJupiterBackdrop(ctx,s,320,280,0,0,8)],
 ['Storm sky',(ctx,s)=>{s.jupiter.stage='pursuit';s.jupiter.stormBlend=1;art.drawJupiterBackdrop(ctx,s,320,280,0,0,8);}],
 ['Reaper strike',(ctx)=>art.drawReaperStrike(ctx,160,145,0,.8)],
 ['Volt Fence',(ctx)=>art.drawVoltFence(ctx,160,145,true,95,12,.9)],
 ['Mini storm',(ctx)=>{ctx.save();ctx.translate(160,145);ctx.scale(1.6,1.6);art.drawMiniStorm(ctx,0,0,19,1);ctx.restore();}],
 ['Reaper charge',(ctx)=>art.drawReaperCharge(ctx,160,170,.93,25,false)],
 ['Fragment',(ctx)=>{ctx.save();ctx.translate(160,145);ctx.scale(1.8,1.8);art.drawPursuitFragment(ctx,0,0,13,true);ctx.restore();}],
 ['Blue / violet',(ctx)=>{art.drawJupiterLightning(ctx,[[100,55],[100,125],[111,125],[111,200],[105,200],[105,240]],1,['#315c91','#83c9ff','#e8f7ff']);art.drawJupiterLightning(ctx,[[210,55],[210,125],[200,125],[200,200],[213,200],[213,240]],1,['#634789','#c5a4ff','#eee4ff']);}]
];
cases.forEach(([label,paint],i)=>{const state=engine.createModeState('trial','storm_reaper');ctx.save();ctx.translate(i%4*320,Math.floor(i/4)*320);ctx.beginPath();ctx.rect(0,0,320,320);ctx.clip();ctx.fillStyle='#101c25';ctx.fillRect(0,0,320,320);paint(ctx,state);ctx.fillStyle='#d5e8e9';ctx.font='14px monospace';ctx.fillText(label,14,305);ctx.restore();});
fs.writeFileSync(path.join(out,'jupiter-lightning-material.png'),cv.toBuffer('image/png'));

{
 const sheet=createCanvas(1200,600),ctx=sheet.getContext('2d');
 for(const[row,vertical]of [false,true].entries())for(const[col,[negative,positive]]of [[72,72],[72,24],[24,72]].entries()){
  ctx.save();ctx.translate(col*400,row*300);ctx.fillStyle='#101c25';ctx.fillRect(0,0,400,300);
  const cx=200,cy=140;
  for(const side of [-1,0,1]){
   const valid=side===0||(side<0?negative:positive)>24,x=cx+(vertical?0:side*48)-24,y=cy+(vertical?side*48:0)-24;
   ctx.fillStyle=valid?'#23404b':'#4e3933';ctx.fillRect(x,y,48,48);ctx.strokeStyle='#576970';ctx.strokeRect(x,y,48,48);
  }
  art.drawVoltFence(ctx,cx,cy,vertical,72,0,1,negative,positive);
  ctx.fillStyle='#d5e8e9';ctx.font='14px monospace';ctx.fillText((vertical?'Vertical':'Horizontal')+' · '+(negative+positive)/48+' valid tiles',24,270);ctx.restore();
 }
 fs.writeFileSync(path.join(out,'jupiter-fence-clipping.png'),sheet.toBuffer('image/png'));
}
