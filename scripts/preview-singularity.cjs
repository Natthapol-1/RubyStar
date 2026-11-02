// Render the Singularity map. Usage: node scripts/preview-singularity.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(field-art|blessing-art|blessing-effects|endless-build-art|warning-art|singularity-art|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;exports.drawMinimap=drawMinimap;exports.drawGuideCelestial=drawGuideCelestial;';
const renderer = new Module(path.resolve('game/jupiter-preview.cjs'), module);
renderer.filename = path.resolve('game/jupiter-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);


const out = process.argv[2];
if (!out) throw new Error('Provide an output directory');
fs.mkdirSync(out, {recursive:true});
const jupiter = require('../game/jupiter.ts'), art = require('../game/jupiter-art.ts');

const W=1280,H=720;
for(const [name,room]of[['singularity',0],['singularity-gamma',3]]){
 const state=engine.createModeState('trial','devourer');state.resources=[];state.gameTick=240;
 const [x,y]=c.TELEPORT_PADS[room];state.playerTileX=state.playerTargetX=x;state.playerTileY=state.playerTargetY=y;state.playerX=(x+.5)*48;state.playerY=(y+.5)*48;
 const cv=createCanvas(W,H),before=JSON.stringify(state);renderer.exports.drawGame(cv.getContext('2d'),state,W,H,240,0,false);
 if(before!==JSON.stringify(state))throw new Error('Art mutated state');fs.writeFileSync(path.join(out,name+'.png'),cv.toBuffer('image/png'));
}
console.log('Rendered actual Singularity map in two chambers; art is read-only.');
