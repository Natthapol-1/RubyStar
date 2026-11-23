// Render the Sirius challenge: trail matching a rune, a bracing Zealot, a ringing Bellringer and empowered aliens. Usage: node scripts/preview-sirius.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = "const {drawConvergenceScreen,drawConvergenceMinimap}=require('./convergence-art.ts');const {drawSuitShell,drawSuitHelmet}=require('./player-suit-art.ts');" + 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;exports.drawMinimap=drawMinimap;exports.drawGuideCelestial=drawGuideCelestial;';
const renderer = new Module(path.resolve('game/jupiter-preview.cjs'), module);
renderer.filename = path.resolve('game/jupiter-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);

const out = process.argv[2];
if (!out) throw new Error('Provide an output directory');
fs.mkdirSync(out, { recursive: true });
const si = require('../game/sirius.ts');
const state = engine.createModeState('trial', 'blind_prayer');
state.noMobs = true; state.resources = []; state.gameTick = 240;
const [px, py] = c.TELEPORT_PADS[0];
let spot = null; // an open run of floor so the trail and the Zealot lane read clearly
for (let y = 2; y < 18 && !spot; y++) for (let x = 3; x < 20 && !spot; x++) if ([0, 1, 2, 3, 4, 5].every(k => engine.isFloorTile(state.map, x + k, y)) && [0, 1, 2].every(k => engine.isFloorTile(state.map, x + 3, y + k))) spot = [x, y];
const [sx, sy] = spot;
const at = (x, y) => { state.playerTileX = state.playerTargetX = x; state.playerTileY = state.playerTargetY = y; state.playerX = (x + .5) * 48; state.playerY = (y + .5) * 48; };
// Trace the first strokes of HOOK (3 right, 2 down) so the matching part glows.
at(sx, sy); state.sirius.trail = [{ x: sx, y: sy }]; state.sirius.steps = [];
for (const d of [0, 0, 0, 1]) { const [dx, dy] = si.RUNE_STEP[d]; at(state.playerTileX + dx, state.playerTileY + dy); state.sirius.trail.push({ x: state.playerTileX, y: state.playerTileY }); state.sirius.steps.push(d); }
state.sirius.lastTile = [state.playerTileX, state.playerTileY];
state.sirius.rune = { index: 0, cast: 0, ticks: 600, total: si.SIRIUS.runeTicks };
const mob = (type, x, y) => { const e = engine.createEncounterEnemy(state, type, x, y, c.ENEMY_CONFIGS[type].maxHp); state.enemies.push(e); return e; };
const z = mob('zealot', sx + 5, sy + 1); z.siriusAct = { ticks: 12, tx: sx + 1, ty: sy + 1, dx: -1, dy: 0, fromX: z.x, fromY: z.y, dashing: false };
z.hp = Math.round(z.maxHp * .6); // damaged, so its HP bar shows
const b = mob('bellringer', sx + 1, sy + 3); b.hp = Math.round(b.maxHp * .4); b.siriusAct = { ticks: 10, tx: b.tileX, ty: b.tileY, dx: 0, dy: 0, fromX: b.x, fromY: b.y, dashing: false };
// Phase 3: a Penitent eating the start of the trail.
const pen = mob('penitent', sx, sy);
// Phase 2: a Mason marking a wall, and one already raised.
state.sirius.phase = 3;
state.sirius.sanctuarySeals = [{x:sx+1,y:sy}, {x:sx+5,y:sy+2}];
const m = mob('mason', sx + 5, sy + 4);
const marks = [[sx + 3, sy + 2], [sx + 3, sy + 3], [sx + 3, sy + 4], [sx + 3, sy + 5]].filter(([x, y]) => engine.isFloorTile(state.map, x, y));
m.siriusAct = { ticks: 20, tx: m.tileX, ty: m.tileY, dx: 0, dy: 0, fromX: m.x, fromY: m.y, dashing: false, tiles: marks };
for (const [x, y] of [[sx + 4, sy + 2], [sx + 4, sy + 3], [sx + 4, sy + 4], [sx + 4, sy + 5]]) if (engine.isFloorTile(state.map, x, y)) { state.map[y][x] = c.T_WALL; state.sirius.walls.push({ x, y, ticks: 200 }); }
state.sirius.rings.push({ x: b.x, y: b.y, ticks: 18, radius: si.SIRIUS.bellringer.radius });
const W = 1280, H = 720, sheet = createCanvas(W, H * 3), sc = sheet.getContext('2d');
for (const [i, wrath, halo] of [[0, 0, 0], [1, 400, 0], [2, 0, 200]]) {
  state.sirius.wrath = wrath; state.sirius.halo = halo; // the third frame floats you under Halo
  state.sirius.haloWave = i === 2 ? {x:state.playerX,y:state.playerY,ticks:20} : undefined;
  const cv = createCanvas(W, H), before = JSON.stringify(state);
  renderer.exports.drawGame(cv.getContext('2d'), state, W, H, 240, 0, false);
  if (before !== JSON.stringify(state)) throw new Error('Sirius art mutated state');
  if (i === 2) fs.writeFileSync(path.join(out,'sirius-halo-wave.png'),cv.toBuffer('image/png'));
  sc.drawImage(cv, 0, i * H);
}
fs.writeFileSync(path.join(out, 'sirius-challenge.png'), sheet.toBuffer('image/png'));
console.log('Rendered the Sirius challenge: trail, Zealot lane, Bellringer ring, Mason wall, empowered aliens and Halo; art is read-only.');


// All rune shapes use the real tile painter, ordered by tier for checking their phase pools.
{
 const art=require('../game/sirius-art.ts'),runes=si.RUNES.slice().sort((a,b)=>a.tier-b.tier),w=220,h=180,cols=5;
 const sheet=createCanvas(w*cols,h*Math.ceil(runes.length/cols)),ctx=sheet.getContext('2d');
 ctx.fillStyle='#100d1f';ctx.fillRect(0,0,sheet.width,sheet.height);
 for(const [i,rune] of runes.entries()){
  const x=(i%cols)*w,y=Math.floor(i/cols)*h;ctx.fillStyle='#181226';ctx.fillRect(x+4,y+4,w-8,h-8);
  ctx.fillStyle='#ecd993';ctx.font='bold 14px monospace';ctx.fillText(`${rune.name} / TIER ${rune.tier}`,x+14,y+25);
  art.drawRuneTiles(ctx,rune,x+w/2,y+100,116,0);
 }
 fs.writeFileSync(path.join(out,'sirius-rune-patterns.png'),sheet.toBuffer('image/png'));
}

// Compare the shared minimap marker with Ruby in another chamber, in the same chamber,
// and while the player is in a connecting hall.
const minimaps = createCanvas(750, 250);
const minimapCtx = minimaps.getContext('2d');
for (const [i, [skill, room, rubyRoom]] of [['blind_prayer', 1, 0], ['thorn_weaver', 3, 3], ['storm_reaper', -1, 0]].entries()) {
  const st = engine.createModeState('trial', skill);
  const hall = st.map.flatMap((row, y) => row.flatMap((tile, x) => tile === c.T_FLOOR && c.chamberOfTile(x,y) < 0 ? [[x,y]] : []));
  const [x, y] = room < 0 ? hall[Math.floor(hall.length / 2)] : c.TELEPORT_PADS[room];
  [st.rubyTileX, st.rubyTileY] = c.TELEPORT_PADS[rubyRoom];
  st.playerTileX = x; st.playerTileY = y; st.playerCarryingRuby = false;
  const panel = createCanvas(240, 240);
  const before = JSON.stringify(st);
  renderer.exports.drawMinimap(panel.getContext('2d'), st, 240, 120);
  if (before !== JSON.stringify(st)) throw Error('Minimap rendering mutated state');
  minimapCtx.drawImage(panel, i * 250, 0);
}
fs.writeFileSync(path.join(out, 'minimap-current-chamber.png'), minimaps.toBuffer('image/png'));
{
const art = require('../game/sirius-art.ts');
const seals = createCanvas(720, 240), sx = seals.getContext('2d');
sx.fillStyle='#100d1f';sx.fillRect(0,0,720,240);
for(const [i,covered] of [false,true].entries()){
 const x=180+i*360;
 sx.fillStyle='#ecd993';sx.font='bold 16px monospace';sx.textAlign='center';sx.fillText(covered?'IN THE RUNE':'SANCTUARY SEAL',x,35);
 art.drawSanctuarySeal(sx,x,130,240,covered,112);
 if(covered){sx.strokeStyle='#e8c45c';sx.lineWidth=5;sx.beginPath();sx.moveTo(x-130,130);sx.lineTo(x+130,130);sx.stroke();}
}
fs.writeFileSync(path.join(out,'sirius-sanctuary-seals.png'),seals.toBuffer('image/png'));
}

// Final-second warnings use the real viewport painter and preserve the simulation.
for(const light of [false,true]){
 const s=engine.createModeState('trial','blind_prayer');s.noMobs=true;s.resources=[];s.gameTick=240;
 engine.godSpawnBoss(s,'blind_prayer');s.sirius.light=light;s.sirius.lightTimer=18;s.trial.siriusLight=light;s.trial.siriusLightBlend=light?1:0;
 const cv=createCanvas(1280,720),before=JSON.stringify(s);renderer.exports.drawGame(cv.getContext('2d'),s,1280,720,240,0,false);
 if(before!==JSON.stringify(s))throw Error('Sirius swap warning mutated state');
 fs.writeFileSync(path.join(out,light?'sirius-swap-to-dark.png':'sirius-swap-to-light.png'),cv.toBuffer('image/png'));
}

// Full Holy Light uses the real world and screen painters, at four release stages.
{
 const sheet=createCanvas(1280,720),ctx=sheet.getContext('2d');
 for(const [i,age]of [8,28,60,95].entries()){
  const state=engine.createModeState('trial','blind_prayer');state.noMobs=true;state.resources=[];state.enemies=[];
  Object.assign(state.sirius,{burst:si.SIRIUS_BURST_TICKS-age,burstAt:{x:state.playerX,y:state.playerY},haloWave:null});
  const frame=createCanvas(1280,720),before=JSON.stringify(state);
  renderer.exports.drawGame(frame.getContext('2d'),state,1280,720,age,0,false);
  if(before!==JSON.stringify(state))throw Error('Holy Light painter mutated state');
  ctx.drawImage(frame,i%2*640,Math.floor(i/2)*360,640,360);
 }
 fs.writeFileSync(path.join(out,'sirius-holy-burst.png'),sheet.toBuffer('image/png'));
}
