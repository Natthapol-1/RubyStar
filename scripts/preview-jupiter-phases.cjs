// Render the actual Jupiter battlefield and all loop states. Usage: node scripts/preview-jupiter.cjs <output-directory>
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


for(const phase of [2,3])for(const stage of ['pursuit','escape']) {
 if(phase===2&&stage==='escape')continue;
 const s=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(s,'storm_reaper');s.godMode=true;s.resources=[];
 jupiter.godSetJupiterPhase(s,phase);jupiter.godSetJupiterStage(s,stage);jupiter.updateJupiter(s);s.jupiter.stormBlend=stage==='pursuit'?1:0;s.jupiter.stormAge=120;s.gameTick=124;
 if(stage==='pursuit')s.jupiter.overdriveCharge=300;
 const canvas=createCanvas(1440,900),ctx=canvas.getContext('2d');renderer.exports.drawGame(ctx,s,1440,900,124,0,false);
 fs.writeFileSync(path.join(out,`jupiter-phase-${phase}-${stage}.png`),canvas.toBuffer('image/png'));
}
console.log('Rendered actual Jupiter phase 2 pursuit, phase 3 pursuit and phase 3 Shard Race.');
