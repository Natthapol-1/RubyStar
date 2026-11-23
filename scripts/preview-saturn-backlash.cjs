// Render Saturn recall backlash through the actual battlefield painter.
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts'), art = require('../game/saturn-art.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|player-suit-art|convergence-art|devourer-model-art|singularity-maw|venus-art|venus|gambit-art|gambit|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;';
const renderer = new Module(path.resolve('game/gaia-preview.cjs'), module);
renderer.filename = path.resolve('game/gaia-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);
const out=process.argv[2]||'.tmp/saturn-backlash';fs.mkdirSync(out,{recursive:true});
const sheet=createCanvas(1280,720),ctx=sheet.getContext('2d');
for(const [i,age]of [4,12,24,44].entries()){
 const state=engine.createModeState('trial','frost_warden');state.noMobs=true;state.resources=[];state.enemies=[];state.gameTick=age;
 state.saturn.backlash={x:state.playerX,y:state.playerY,ticks:66-age};
 const frame=createCanvas(1280,720),before=JSON.stringify(state);renderer.exports.drawGame(frame.getContext('2d'),state,1280,720,age,0,false);
 if(before!==JSON.stringify(state))throw Error('Saturn backlash drawing mutated state');
 ctx.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'saturn-recall-backlash.png'),sheet.toBuffer('image/png'));
console.log('Rendered Saturn recall backlash; art is read-only.');
