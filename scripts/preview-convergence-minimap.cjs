// Render the Venus, Sirius and Singularity map previews. Usage: node scripts/preview-singularity.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|singularity-maw|venus-art|venus|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary|player-suit-art|devourer-model-art|convergence-art)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;exports.drawMinimap=drawMinimap;exports.drawGuideCelestial=drawGuideCelestial;exports.drawEnemy=drawEnemy;';
const renderer = new Module(path.resolve('game/jupiter-preview.cjs'), module);
renderer.filename = path.resolve('game/jupiter-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);


const out=process.argv[2]||'.tmp/convergence-minimap';fs.mkdirSync(out,{recursive:true});

{
 const sheet=createCanvas(960,320),ctx=sheet.getContext('2d');
 for(const [i,room]of [0,2,3].entries()){
  const state=engine.createModeState('trial','devourer');state.enemies=[];
  const [tx,ty]=c.TELEPORT_PADS[room];state.trial.devourer.convergence={x:(tx+.5)*48,y:(ty+.5)*48,stage:'gather',ticks:180,gatherTicks:240,count:4,members:[]};
  const frame=createCanvas(320,320),before=JSON.stringify(state);renderer.exports.drawMinimap(frame.getContext('2d'),state,320,120);
  if(before!==JSON.stringify(state))throw Error('Convergence minimap painter mutated state');ctx.drawImage(frame,i*320,0);
 }
 fs.writeFileSync(path.join(out,'singularity-convergence-minimap.png'),sheet.toBuffer('image/png'));
}
