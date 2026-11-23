// Render Venus shield-break stages through the actual battlefield painter.
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts'), art = require('../game/venus-art.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|player-suit-art|convergence-art|devourer-model-art|singularity-maw|venus-art|venus|gambit-art|gambit|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;';
const renderer = new Module(path.resolve('game/gaia-preview.cjs'), module);
renderer.filename = path.resolve('game/gaia-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);
const out=process.argv[2]||'.tmp/venus-shield-break';fs.mkdirSync(out,{recursive:true});
const sheet=createCanvas(1280,720),ctx=sheet.getContext('2d');
for(const [i,age]of [5,16,32,62].entries()){
 const state=engine.createModeState('trial','aegis_sentinel');state.noMobs=true;state.resources=[];state.enemies=[];state.gameTick=age;
 state.venus.shatter={x:state.playerX,y:state.playerY,ticks:100-age};
 const frame=createCanvas(1280,720),before=JSON.stringify(state);renderer.exports.drawGame(frame.getContext('2d'),state,1280,720,age,0,false);
 if(before!==JSON.stringify(state))throw Error('Venus shield-break drawing mutated state');
 ctx.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'venus-shield-break.png'),sheet.toBuffer('image/png'));
console.log('Rendered Venus shield-break stages; art is read-only.');

const edges=createCanvas(1280,720),ec=edges.getContext('2d');
for(const [i,[x,y]]of [[-250,360],[1530,360],[640,-250],[640,970]].entries()){
 const state=engine.createModeState('trial','aegis_sentinel');state.venus.shatter={x,y,ticks:92};
 const frame=createCanvas(1280,720),fc=frame.getContext('2d');fc.fillStyle='#201d23';fc.fillRect(0,0,1280,720);
 const before=JSON.stringify(state);art.drawVenusShatter(fc,state,1280,720,0,0);if(before!==JSON.stringify(state))throw Error('Offscreen shatter mutated state');
 ec.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'venus-shield-break-offscreen.png'),edges.toBuffer('image/png'));

{
 const sheet=createCanvas(1280,720),ctx=sheet.getContext('2d');
 for(const [i,age]of [3,10,20,30].entries()){
  const state=engine.createModeState('trial','aegis_sentinel');state.noMobs=true;state.resources=[];state.enemies=[];state.gameTick=age;
  state.venus.blasts=[{x:state.playerX+96,y:state.playerY,ticks:36-age,kind:'totemBreak'}];
  const frame=createCanvas(1280,720),before=JSON.stringify(state);renderer.exports.drawGame(frame.getContext('2d'),state,1280,720,age,0,false);
  if(before!==JSON.stringify(state))throw Error('Totem break painter changed state');ctx.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
 }
 fs.writeFileSync(path.join(out,'venus-totem-break.png'),sheet.toBuffer('image/png'));
}

const warnings=createCanvas(1280,720),wc=warnings.getContext('2d');
for(const[i,kind]of ['aim','lock','lance','lance-lock'].entries()){
 const state=engine.createModeState('trial','aegis_sentinel');state.gameTick=20;state.noMobs=true;state.resources=[];
 if(kind==='aim'||kind==='lock')state.venus.leap={stage:kind,ticks:kind==='aim'?50:18,tx:state.playerTileX+2,ty:state.playerTileY};
 else{require('../game/venus.ts').godSetVenusPhase(state,1);const boss=state.enemies.find(e=>e.id===state.venus.bossId);boss.x=state.playerX-160;boss.y=state.playerY;state.venus.lance={ticks:kind==='lance'?36:8,dx:1,dy:0};}
 const frame=createCanvas(1280,720),before=JSON.stringify(state);renderer.exports.drawGame(frame.getContext('2d'),state,1280,720,20,0,false);
 if(before!==JSON.stringify(state))throw Error('Venus warning drawing mutated state');wc.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'venus-attack-warnings.png'),warnings.toBuffer('image/png'));

{
 const sheet=createCanvas(1280,720),ctx=sheet.getContext('2d');
 for(const[i,age]of [3,10,20,30].entries()){
  const state=engine.createModeState('trial','aegis_sentinel');state.noMobs=true;state.resources=[];state.enemies=[];state.gameTick=age;
  state.venus.parries=[{x:state.playerX,y:state.playerY,ticks:36-age}];
  const frame=createCanvas(1280,720),before=JSON.stringify(state);renderer.exports.drawGame(frame.getContext('2d'),state,1280,720,age,0,false);
  if(before!==JSON.stringify(state))throw Error('Counter painter changed state');ctx.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
 }
 fs.writeFileSync(path.join(out,'venus-counter.png'),sheet.toBuffer('image/png'));
}

{
 const sheet=createCanvas(1280,720),ctx=sheet.getContext('2d');
 for(const[i,age]of [3,10,19,28].entries()){
  const state=engine.createModeState('trial','aegis_sentinel');state.noMobs=true;state.resources=[];state.enemies=[];state.gameTick=age;
  state.encounterEffects=[{kind:'totem-overload',ownerId:-1,x:state.playerX+70,y:state.playerY,toX:state.playerX+70,toY:state.playerY,ticks:36-age,maxTicks:36,color:'#ffce8a'}];
  const frame=createCanvas(1280,720),before=JSON.stringify(state);renderer.exports.drawGame(frame.getContext('2d'),state,1280,720,age,0,false);
  if(before!==JSON.stringify(state))throw Error('Totem overload painter changed state');ctx.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
 }
 fs.writeFileSync(path.join(out,'venus-totem-overload.png'),sheet.toBuffer('image/png'));
}
