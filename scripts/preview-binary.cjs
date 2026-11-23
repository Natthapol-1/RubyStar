// Renders the Binary Star challenge with the game's real drawGame: the world at three ages (twins and magnets),
// plus the backdrop alone. Usage: node scripts/preview-binary.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts'), binary = require('../game/binary.ts'), world = require('../game/binary-world-art.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|player-suit-art|convergence-art|devourer-model-art|singularity-maw|venus-art|venus|gambit-art|gambit|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;';
const renderer = new Module(path.resolve('game/binary-preview.cjs'), module);
renderer.filename = path.resolve('game/binary-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);

const out = process.argv[2] || '.';fs.mkdirSync(out,{recursive:true});
const state = engine.createModeState('trial', 'astral_twins');
state.noMobs = true; state.resources = []; state.meteoriteTimer = 1e6;
engine.godSpawnBoss(state, 'astral_twins');
const place = (e, x, y) => { e.tileX = e.targetTileX = x; e.tileY = e.targetTileY = y; e.x = (x + .5) * c.TILE_SIZE; e.y = (y + .5) * c.TILE_SIZE; e.stepProgress = 0; e.visualSpawnTicks = 0; };
const twins = binary.binaryTwins(state); place(twins[0], 16, 8); place(twins[1], 9, 16);
const player = (x, y) => { state.playerTileX = state.playerTargetX = x; state.playerTileY = state.playerTargetY = y; state.playerX = (x + .5) * c.TILE_SIZE; state.playerY = (y + .5) * c.TILE_SIZE; };
state.binary.magnets = [{ x: 15, y: 13, pole: 'north' }, { x: 8, y: 9, pole: 'south' }];
player(12, 12);
const stone = engine.createEncounterEnemy(state, 'lodestone', 14, 16, 10); stone.pole = 'south'; state.enemies.push(stone);

const W = 1280, H = 720, ages = [60, 700, 1400];
const sheet = createCanvas(W, H * ages.length), sctx = sheet.getContext('2d');
for (const [i, age] of ages.entries()) {
  state.gameTick = age; state.binary.swapTimer = i === 2 ? 40 : 600; // the last frame shows the jump warning
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  renderer.exports.drawGame(ctx, state, W, H, age, 0, false);
  sctx.drawImage(canvas, 0, i * H);
}
fs.writeFileSync(path.join(out, 'binary-world.png'), sheet.toBuffer('image/png'));
// Both swap polarities at the same point in their release, using the real frame painter.
for(const pole of ['north','south']){
  state.binary.pole=pole;state.binary.swapFlashTicks=binary.BINARY.swapVisualTicks-6;state.binary.poleCooldown=binary.BINARY.poleCooldown-6;state.binary.swapTimer=600;
  const canvas=createCanvas(W,H),before=JSON.stringify(state);
  renderer.exports.drawGame(canvas.getContext('2d'),state,W,H,state.gameTick,0,false);
  if(JSON.stringify(state)!==before)throw Error('Swap preview mutated state');
  fs.writeFileSync(path.join(out,`binary-swap-${pole}.png`),canvas.toBuffer('image/png'));
}
state.binary.swapFlashTicks=0;
const sky = createCanvas(W, H), kctx = sky.getContext('2d');
world.drawBinaryBackdrop(kctx, W, H, 0, 0, 900);
fs.writeFileSync(path.join(out, 'binary-backdrop.png'), sky.toBuffer('image/png'));
console.log('wrote binary-world.png and binary-backdrop.png');

{
 const sheet=createCanvas(1280,720),ctx=sheet.getContext('2d');
 for(const[i,age]of [3,16,36,62].entries()){
  const state=engine.createModeState('trial','astral_twins');state.noMobs=true;state.resources=[];state.enemies=[];state.gameTick=age;
  state.binary.collisions=[{x:state.playerX+50,y:state.playerY,ticks:90-age}];
  const frame=createCanvas(1280,720),before=JSON.stringify(state);renderer.exports.drawGame(frame.getContext('2d'),state,1280,720,age,0,false);
  if(before!==JSON.stringify(state))throw Error('Binary collision drawing changed state');ctx.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
 }
 fs.writeFileSync(path.join(out,'binary-collision.png'),sheet.toBuffer('image/png'));
}
