// Render the Saturn map and existing Warden palette comparison. Usage: node scripts/preview-saturn.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(endless-build-art|warning-art|singularity-art|saturn-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun)';/gm)]
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
for(const [name,room] of [['saturn',0],['saturn-gamma',3]]) {
 const state=engine.createModeState('trial','frost_warden');state.resources=[];
 const [x,y]=c.TELEPORT_PADS[room];state.playerTileX=state.playerTargetX=x;state.playerTileY=state.playerTargetY=y;
 state.playerX=(x+.5)*48;state.playerY=(y+.5)*48;state.gameTick=240;
 const cv=createCanvas(W,H),ctx=cv.getContext('2d');const before=JSON.stringify(state);
 renderer.exports.drawGame(ctx,state,W,H,240,0,false);
 if(JSON.stringify(state)!==before)throw new Error('Renderer mutated Saturn state');
 fs.writeFileSync(path.join(out,name+'.png'),cv.toBuffer('image/png'));
}
// Existing Frost Warden shown only in the source-rendered palette reference.
const state=engine.createModeState('trial','frost_warden');state.resources=[];engine.godSpawnBoss(state,'frost_warden');
const boss=state.enemies.find(e=>e.type==='frost_warden');Object.assign(boss,{tileX:14,tileY:10,targetTileX:14,targetTileY:10,x:14.5*48,y:10.5*48});
const cv=createCanvas(W,H);renderer.exports.drawGame(cv.getContext('2d'),state,W,H,240,0,false);
fs.writeFileSync(path.join(out,'saturn-warden-palette.png'),cv.toBuffer('image/png'));
console.log('Rendered actual Saturn map, second chamber and existing Frost Warden palette reference.');
