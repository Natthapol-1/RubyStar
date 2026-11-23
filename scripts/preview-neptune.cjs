// Render Neptune's actual battlefield and joined reef cover. Run from the repository root.
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts'), art = require('../game/neptune-art.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = "const {drawConvergenceScreen}=require('./convergence-art.ts');const {drawSuitShell,drawSuitHelmet}=require('./player-suit-art.ts');const {drawNeptuneRefrainEffects,drawNeptuneRhythmOverlay}=require('./neptune-refrain-art.ts');" + 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;exports.colors=OCEAN_CHAMBER_COLORS;';
const renderer = new Module(path.resolve('game/neptune-preview.cjs'), module);
renderer.filename = path.resolve('game/neptune-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);
const out = process.argv[2]; if (!out) throw Error('Provide an output directory');
fs.mkdirSync(out, { recursive: true });
for (const room of [0, 3]) {
  const state = engine.createModeState('trial', 'sea_chanter'); state.enemies = []; state.resources = []; state.noMobs = true; state.gameTick = 240;
  const [x, y] = c.TELEPORT_PADS[room];
  Object.assign(state, { playerTileX: x, playerTargetX: x, playerTileY: y, playerTargetY: y, playerX: (x + .5) * c.TILE_SIZE, playerY: (y + .5) * c.TILE_SIZE });
  const cv = createCanvas(1280, 720), before = JSON.stringify(state);
  renderer.exports.drawGame(cv.getContext('2d'), state, 1280, 720, 240, 0, false);
  if (before !== JSON.stringify(state)) throw Error('Neptune drawing mutated state');
  fs.writeFileSync(path.join(out, room ? 'neptune-gamma.png' : 'neptune.png'), cv.toBuffer('image/png'));
}
const cells = [[0,0],[1,0],[2,0],[0,1],[1,1],[0,2],[1,2],[2,2],[3,2],[4,2],[4,1],[6,1]];
const fake = { map: Array.from({length:c.MAP_ROWS}, () => Array(c.MAP_COLS).fill(c.T_FLOOR)) };
for (const [x,y] of cells) fake.map[y+8][x+8] = c.T_WALL;
const close = createCanvas(1200, 620), ctx = close.getContext('2d'), before = JSON.stringify(fake);
ctx.fillStyle = '#051824'; ctx.fillRect(0,0,1200,620); ctx.save(); ctx.translate(45,50); ctx.scale(3.2,3.2);
for (const [x,y] of cells) art.drawNeptuneRock(ctx,fake,x+8,y+8,x*c.TILE_SIZE,y*c.TILE_SIZE,renderer.exports.colors[0]);
ctx.restore(); if (before !== JSON.stringify(fake)) throw Error('Reef cover drawing mutated state');
fs.writeFileSync(path.join(out,'neptune-reef-cover.png'),close.toBuffer('image/png'));
console.log('Rendered Neptune in two chambers and joined/isolated reef cover; art is read-only.');

// Clam silhouettes and a live battlefield wave, using the same state and art as play.
{
 const clamArt=createCanvas(900,360),ctx=clamArt.getContext('2d');ctx.fillStyle='#0b1d30';ctx.fillRect(0,0,900,360);
 for(const [i,open] of [0,c.NEPTUNE_CLAM.openTicks-20,6].entries()){
  ctx.fillStyle='#b6e7df';ctx.font='bold 18px monospace';ctx.textAlign='center';ctx.fillText(['CLOSED','OPEN','CLOSING'][i],150+i*300,45);
  ctx.save();ctx.translate(150+i*300,190);ctx.scale(3,3);art.drawNeptuneClam(ctx,0,0,open,100);ctx.restore();
 }
 fs.writeFileSync(path.join(out,'neptune-clam.png'),clamArt.toBuffer('image/png'));
 const corruptedArt=createCanvas(900,360),corruptCtx=corruptedArt.getContext('2d');corruptCtx.fillStyle='#0b1d30';corruptCtx.fillRect(0,0,900,360);
 for(const [i,open] of [0,c.NEPTUNE_CORRUPTED_CLAM.openTicks-20,6].entries()){
  corruptCtx.fillStyle='#efbbcd';corruptCtx.font='bold 18px monospace';corruptCtx.textAlign='center';corruptCtx.fillText(['CLOSED','OPEN','CLOSING'][i],150+i*300,45);
  corruptCtx.save();corruptCtx.translate(150+i*300,190);corruptCtx.scale(3,3);art.drawNeptuneClam(corruptCtx,0,0,open,100,true);corruptCtx.restore();
 }
 fs.writeFileSync(path.join(out,'neptune-corrupted-clam.png'),corruptedArt.toBuffer('image/png'));
 const s=engine.createModeState('trial','sea_chanter');s.enemies=[];s.noMobs=true;s.gameTick=240;
 const tiles=engine.freeChamberTiles(s,0),[tileX,tileY]=tiles.find(([x,y])=>Math.hypot(x-s.playerTileX,y-s.playerTileY)>=2&&Math.hypot(x-s.playerTileX,y-s.playerTileY)<=3);
 s.neptune.clams=[{tileX,tileY,openTicks:c.NEPTUNE_CLAM.openTicks-20,waveTicks:16,hitIds:[],pitch:0}];
 const cv=createCanvas(1280,720),before=JSON.stringify(s);renderer.exports.drawGame(cv.getContext('2d'),s,1280,720,240,0,false);
 if(before!==JSON.stringify(s))throw Error('Clam drawing mutated state');
 fs.writeFileSync(path.join(out,'neptune-clam-wave.png'),cv.toBuffer('image/png'));
 s.neptune.clams[0].corrupted=true;
 s.neptune.clams[0].openTicks=c.NEPTUNE_CORRUPTED_CLAM.openTicks-20;
 const corruptWave=createCanvas(1280,720),corruptBefore=JSON.stringify(s);renderer.exports.drawGame(corruptWave.getContext('2d'),s,1280,720,240,0,false);
 if(corruptBefore!==JSON.stringify(s))throw Error('Corrupted wave drawing mutated state');
 fs.writeFileSync(path.join(out,'neptune-corrupted-clam-wave.png'),corruptWave.toBuffer('image/png'));
}
if(process.argv.includes('--clams-only'))process.exit(0);

// Leaf silhouettes and their rooted sway, enlarged at three simulation ages.
{
  const cv = createCanvas(1200, 240), ctx = cv.getContext('2d');
  ctx.fillStyle = '#051824'; ctx.fillRect(0, 0, cv.width, cv.height);
  const before = JSON.stringify(fake);
  for (const [index, tick] of [0, 90, 180].entries()) {
    ctx.save(); ctx.translate(index * 400 + 35, 140); ctx.scale(2, 2);
    for (let x = 0; x < 3; x++) art.drawNeptuneRock(ctx, fake, x+8, 10, x*c.TILE_SIZE, 0, renderer.exports.colors[0]);
    for (let x = 0; x < 3; x++) art.drawNeptuneKelp(ctx, fake, x+8, 10, x*c.TILE_SIZE, 0, tick);
    ctx.restore();
  }
  if (before !== JSON.stringify(fake)) throw Error('Kelp drawing mutated state');
  fs.writeFileSync(path.join(out, 'neptune-kelp.png'), cv.toBuffer('image/png'));
}


// First shark charging while the second shark's perpendicular lane is still warning.
{
 const s=engine.createModeState('trial','sea_chanter');engine.godSpawnBoss(s,'sea_chanter');
 s.noMobs=false;s.spawnTimer=1e6;s.godMode=true;s.meteoriteTimer=1e6;s.neptune.fishTimer=s.neptune.jellyTimer=s.neptune.tideTimer=1e6;s.neptune.sharkTimer=1;
 engine.tick(s);s.neptune.shark.warning=1;
 const random=Math.random;try{Math.random=()=>.1;engine.tick(s);}finally{Math.random=random;}
 for(let i=0;i<20;i++)engine.tick(s);
 if(!s.neptune.sharkFollowup)throw Error('Missing second shark warning');
 const cv=createCanvas(1280,720),before=JSON.stringify(s);renderer.exports.drawGame(cv.getContext('2d'),s,1280,720,s.gameTick,0,false);
 if(before!==JSON.stringify(s))throw Error('Shark follow-up drawing mutated state');
 fs.writeFileSync(path.join(out,'neptune-shark-followup.png'),cv.toBuffer('image/png'));
}

// Actual impact in its selected room, then its cosmetic front in the opposite room.
const impactSheet=createCanvas(1280,720),impactCtx=impactSheet.getContext('2d');
for(const [i,age] of [8,28,65,85].entries()) {
 const state=engine.createModeState('trial','sea_chanter');state.enemies=[];state.resources=[];state.noMobs=true;
 state.neptune.laserImpact={chamber:0,ticks:120-age};
 const [x,y]=c.TELEPORT_PADS[i<2?0:3];
 Object.assign(state,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*c.TILE_SIZE,playerY:(y+.5)*c.TILE_SIZE});
 const cv=createCanvas(1280,720),before=JSON.stringify(state);
 renderer.exports.drawGame(cv.getContext('2d'),state,1280,720,age,0,false);
 if(before!==JSON.stringify(state))throw Error('Impact art mutated simulation');
 impactCtx.drawImage(cv,(i%2)*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'neptune-trident-impact.png'),impactSheet.toBuffer('image/png'));

const healState = engine.createModeState('trial', 'sea_chanter');
healState.noMobs = true;
healState.godMode = true;
healState.meteoriteTimer = 100000;
engine.godSpawnBoss(healState, 'sea_chanter');
const chanter = healState.enemies.find(enemy => enemy.type === 'sea_chanter');
chanter.hp = c.neptunePhaseFloorHP(1) + c.NEPTUNE_DIVE_POINTS[1][1] * c.NEPTUNE_PHASE_HPS[1] - 1;
healState.neptune.armed[0] = false;
engine.tick(healState);
engine.tick(healState);
if (!healState.neptune.dive) throw Error('Clone heal preview did not start a dive');
const [healX, healY] = engine.freeChamberTiles(healState, 0)
  .sort((a,b) => Math.hypot(a[0]-14,a[1]-9)-Math.hypot(b[0]-14,b[1]-9))[0];
Object.assign(chanter, {tileX:healX,targetTileX:healX,tileY:healY,targetTileY:healY,x:(healX+.5)*c.TILE_SIZE,y:(healY+.5)*c.TILE_SIZE});
healState.neptune.dive.ticks = 1;
engine.tick(healState);
if (!healState.neptune.resurfaceEffectTicks || !healState.neptune.resurfaceHealed) throw Error('Clone heal preview did not trigger the effect');

const healSheet = createCanvas(1280, 720), healCtx = healSheet.getContext('2d');
for (const [index, age] of [2, 18, 34, 52].entries()) {
  healState.neptune.resurfaceEffectTicks = c.NEPTUNE_CLONE_HEAL_FX_TICKS - age;
  healState.gameTick = 240 + age;
  const frame = createCanvas(1280, 720), before = JSON.stringify(healState);
  renderer.exports.drawGame(frame.getContext('2d'), healState, 1280, 720, healState.gameTick, 0, false);
  if (before !== JSON.stringify(healState)) throw Error('Neptune clone heal drawing mutated state');
  healCtx.drawImage(frame, index % 2 * 640, Math.floor(index / 2) * 360, 640, 360);
}
fs.writeFileSync(path.join(out, 'neptune-clone-heal.png'), healSheet.toBuffer('image/png'));
// The real score painter and world note effects used by Ocean’s Melody.
{
 const music=require('../game/neptune-refrain.ts'),art=require('../game/neptune-refrain-art.ts');
 const sheet=createCanvas(1200,400),ctx=sheet.getContext('2d');ctx.fillStyle='#081925';ctx.fillRect(0,0,1200,400);
 for(const [i,stage] of ['listen','answer','answer'].entries()){
  const phrase=music.REFRAIN_PHRASES[0],span=music.NEPTUNE_REFRAIN.lead+music.NEPTUNE_REFRAIN.beats*music.NEPTUNE_REFRAIN.beat;
  const song={stage,tick:i===0?34:i===1?52:80,span,notes:phrase.beats.map((beat,j)=>({at:music.NEPTUNE_REFRAIN.lead+beat*music.NEPTUNE_REFRAIN.beat,pitch:phrase.pitches[j],result:i===0?'pending':j<i+1?'hit':i===1?'pending':'miss'})),extraMisses:i===2?1:0,mistakeMarks:i===2?[20]:[],healBudget:120,phase:1};
  ctx.save();ctx.translate(i*400,0);ctx.fillStyle='#326179';ctx.fillRect(0,0,400,2);art.drawRefrainScore(ctx,song,400,32,'C');
  const s=engine.createModeState('trial','sea_chanter');s.neptune.notePulses=[{x:200,y:220,pitch:i+1,good:i!==2,boss:i===0,ticks:27}];
  art.drawNeptuneRefrainEffects(ctx,s,0,0);ctx.restore();
 }
 fs.writeFileSync(path.join(out,'neptune-refrain-score.png'),sheet.toBuffer('image/png'));
}

// Clone water palette before and during a Melody taunt, using the live model.
{
 const sheet=createCanvas(520,220),ctx=sheet.getContext('2d');ctx.fillStyle='#081925';ctx.fillRect(0,0,520,220);
 for(let i=0;i<2;i++){
  const state=engine.createModeState('trial','sea_chanter'),clone=engine.createEncounterEnemy(state,'water_clone',5,5,8);clone.neptuneTauntTicks=i?180:0;
  const before=JSON.stringify(clone);ctx.save();ctx.translate(i*260,0);ctx.fillStyle=i?'#a5fff2':'#6fc7ff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(i?'TAUNTED':'ROAMING',130,27);ctx.scale(2,2);art.drawNeptuneUnit(ctx,clone,65,62,120);ctx.restore();if(before!==JSON.stringify(clone))throw Error('Clone drawing mutated state');
 }fs.writeFileSync(path.join(out,'neptune-clone-taunt.png'),sheet.toBuffer('image/png'));
}
