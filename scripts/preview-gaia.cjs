// Render Gaia's actual battlefield and mossy cover. Run from the repository root.
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts'), art = require('../game/gaia-art.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;exports.colors=GAIA_CHAMBER_COLORS;';
const renderer = new Module(path.resolve('game/gaia-preview.cjs'), module);
renderer.filename = path.resolve('game/gaia-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);
const out = process.argv[2]; if (!out) throw Error('Provide an output directory');
fs.mkdirSync(out, { recursive: true });
for (const room of [0, 3]) {
  const state = engine.createModeState('trial', 'thorn_weaver'); state.enemies = []; state.resources = []; state.noMobs = true; state.gameTick = 240;
  const [x,y] = c.TELEPORT_PADS[room]; Object.assign(state,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*c.TILE_SIZE,playerY:(y+.5)*c.TILE_SIZE});
  const cv=createCanvas(1280,720), before=JSON.stringify(state);
  renderer.exports.drawGame(cv.getContext('2d'),state,1280,720,240,0,false);
  if(before!==JSON.stringify(state))throw Error('Gaia drawing mutated state');
  fs.writeFileSync(path.join(out,room?'gaia-gamma.png':'gaia.png'),cv.toBuffer('image/png'));
}
const fake={map:Array.from({length:c.MAP_ROWS},()=>Array(c.MAP_COLS).fill(c.T_FLOOR))};
for(let y=6;y<=8;y++)for(let x=6;x<=11;x++)fake.map[y][x]=c.T_WALL;
const cv=createCanvas(1200,650),ctx=cv.getContext('2d'),before=JSON.stringify(fake);
ctx.fillStyle='#09140d';ctx.fillRect(0,0,1200,650);ctx.save();ctx.translate(24,35);ctx.scale(3.8,3.8);
for(let y=6;y<=8;y++)for(let x=6;x<=11;x++)art.drawGaiaStone(ctx,fake,x,y,(x-6)*48,(y-6)*48,art.GAIA_CHAMBER_COLORS[0]);
ctx.restore();if(before!==JSON.stringify(fake))throw Error('Gaia cover drawing mutated state');
fs.writeFileSync(path.join(out,'gaia-moss-cover.png'),cv.toBuffer('image/png'));
console.log('Rendered Gaia in two chambers and its varied stone cover; art is read-only.');

// Actual impact in its selected room, then its cosmetic front in the opposite room.
const impactSheet=createCanvas(1280,720),impactCtx=impactSheet.getContext('2d');
for(const [i,age] of [8,28,65,85].entries()) {
 const state=engine.createModeState('trial','thorn_weaver');state.enemies=[];state.resources=[];state.noMobs=true;
 state.gaia.sunImpact={chamber:0,ticks:120-age};
 const [x,y]=c.TELEPORT_PADS[i<2?0:3];
 Object.assign(state,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*c.TILE_SIZE,playerY:(y+.5)*c.TILE_SIZE});
 const cv=createCanvas(1280,720),before=JSON.stringify(state);
 renderer.exports.drawGame(cv.getContext('2d'),state,1280,720,age,0,false);
 if(before!==JSON.stringify(state))throw Error('Impact art mutated simulation');
 impactCtx.drawImage(cv,(i%2)*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'gaia-sunfire-impact.png'),impactSheet.toBuffer('image/png'));
