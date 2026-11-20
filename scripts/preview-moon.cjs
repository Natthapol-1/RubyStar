// Renders the Moon challenge world with the game's real drawGame (backdrop, crystal cover, floor) at several animation
// ages, plus an enlarged crystal-block close-up. Usage: node scripts/preview-moon.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts'), moon = require('../game/moon-art.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;';
const renderer = new Module(path.resolve('game/moon-preview.cjs'), module);
renderer.filename = path.resolve('game/moon-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);

const out = process.argv[2] || '.';
const state = engine.createModeState('trial', 'splitter_queen');
state.noMobs = true; state.enemies = []; state.resources = [];
const place = (x, y) => { state.playerTileX = state.playerTargetX = x; state.playerTileY = state.playerTargetY = y; state.playerX = (x + .5) * c.TILE_SIZE; state.playerY = (y + .5) * c.TILE_SIZE; };

// Gameplay-scale views at three ages, stacked.
const W = 1280, H = 720, ages = [40, 400, 900];
const sheet = createCanvas(W, H * ages.length), sctx = sheet.getContext('2d');
for (const [i, age] of ages.entries()) {
  const canvas = createCanvas(W, H), ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  place(12, 12); renderer.exports.drawGame(ctx, state, W, H, age, 0, false);
  sctx.drawImage(canvas, 0, i * H);
}
fs.writeFileSync(path.join(out, 'moon-world.png'), sheet.toBuffer('image/png'));

// Crystal cover close-up: a 3×2 cluster at 3× across the glint sweep.
const close = createCanvas(1200, 360), cctx = close.getContext('2d'); cctx.fillStyle = '#0b0717'; cctx.fillRect(0, 0, 1200, 360);
const fake = { map: Array.from({ length: c.MAP_ROWS }, (_, y) => Array.from({ length: c.MAP_COLS }, (_, x) => (x >= 10 && x <= 12 && y >= 10 && y <= 11) ? c.T_WALL : c.T_FLOOR)) };
for (const [i, age] of [0, 20, 40, 60].entries()) {
  cctx.save(); cctx.translate(i * 300 + 15, 40); cctx.scale(1.8, 1.8);
  const tick = 20 * c.TILE_SIZE / 2.2 + age; // the glint reaches this cluster at age 0
  for (let ty = 10; ty <= 11; ty++) for (let tx = 10; tx <= 12; tx++) moon.drawMoonCrystalBlock(cctx, fake, tx, ty, (tx - 10) * c.TILE_SIZE, (ty - 10) * c.TILE_SIZE, moon.MOON_CHAMBER_COLORS[0], tick);
  cctx.restore();
}
fs.writeFileSync(path.join(out, 'moon-crystal-cover.png'), close.toBuffer('image/png'));
// The fight: she sits disguised among illusions (only she has a floor reflection) while one illusion's shards fly,
// then the same view as her reveal starts.
{
  const moonLogic = require('../game/moon.ts');
  const fight = engine.createModeState('trial', 'splitter_queen');
  fight.noMobs = true; fight.meteoriteTimer = 100000;
  engine.godSpawnBoss(fight, 'splitter_queen');
  const boss = fight.enemies.find(e => e.type === 'splitter_queen');
  const set = (e, x, y) => { e.tileX = e.targetTileX = x; e.tileY = e.targetTileY = y; e.x = (x + .5) * c.TILE_SIZE; e.y = (y + .5) * c.TILE_SIZE; };
  boss.phaseTimer = 1; engine.tick(fight);
  const ills = fight.enemies.filter(e => e.type === 'moon_illusion');
  set(boss, 9, 7); [[5, 10], [14, 9], [11, 13]].forEach(([x, y], i) => set(ills[i], x, y));
  const broken = ills[3]; set(broken, 12, 5); moonLogic.moonShatter(fight, broken);
  fight.enemies.splice(fight.enemies.indexOf(broken), 1);
  for (const sh of fight.moon.shards) { sh.x += sh.dx * 8; sh.y += sh.dy * 8; }
  Object.assign(fight, { playerTileX: 9, playerTileY: 11, playerTargetX: 9, playerTargetY: 11, playerX: 9.5 * c.TILE_SIZE, playerY: 11.5 * c.TILE_SIZE });
  const FW = 1100, FH = 700, sheetF = createCanvas(FW * 2, FH), fctx = sheetF.getContext('2d');
  for (const [i, timer] of [[0, 300], [1, c.MOON_REVEAL_TICKS - 10]]) {
    boss.phaseTimer = timer; fight.moon.unmask = i ? { id: boss.id, ticks: 12 } : null; fight.moon.mark = i ? { id: boss.id, ticks: 200 } : null;
    const canvas = createCanvas(FW, FH), ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    renderer.exports.drawGame(ctx, fight, FW, FH, 200, 0, false);
    fctx.drawImage(canvas, i * FW, 0);
  }
  fs.writeFileSync(path.join(out, 'moon-illusions.png'), sheetF.toBuffer('image/png'));
}
// Phase 2: mirror strips on the floor, with one shot bouncing back off a mirror.
{
  const moonLogic = require('../game/moon.ts');
  const p2 = engine.createModeState('trial', 'splitter_queen');
  p2.noMobs = true; p2.meteoriteTimer = 100000;
  moonLogic.godSetMoonPhase(p2, 2);
  const first = p2.moon.mirrors[0], mx = first % c.MAP_COLS, my = Math.floor(first / c.MAP_COLS);
  Object.assign(p2, { playerTileX: mx - 3, playerTileY: my + 2, playerTargetX: mx - 3, playerTargetY: my + 2, playerX: (mx - 2.5) * c.TILE_SIZE, playerY: (my + 2.5) * c.TILE_SIZE });
  p2.moon.reflects = [{ x: (mx + .5) * c.TILE_SIZE, y: (my + .5) * c.TILE_SIZE, toX: p2.playerX, toY: p2.playerY, ticks: 10 }];
  const canvas = createCanvas(1100, 700), ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  renderer.exports.drawGame(ctx, p2, 1100, 700, 300, 0, false);
  fs.writeFileSync(path.join(out, 'moon-mirrors.png'), canvas.toBuffer('image/png'));
}
// Phase 3: you in the dark room. Walls, outline, you, Ruby and effects show; one illusion just hit shows briefly.
{
  const moonLogic = require('../game/moon.ts');
  const p3 = engine.createModeState('trial', 'splitter_queen');
  p3.noMobs = true; p3.meteoriteTimer = 100000;
  moonLogic.godSetMoonPhase(p3, 3);
  const boss = p3.enemies.find(e => e.type === 'splitter_queen'); boss.phaseTimer = 1; engine.tick(p3); boss.phaseTimer = 300;
  const room = c.chamberOfTile(p3.playerTileX, p3.playerTileY); p3.moon.dark = room; p3.moon.secondDark = (room + 1) % 4; p3.moon.darkFade = 0; p3.moon.oldDark = p3.moon.oldSecondDark = -1; p3.gameTick = 420; p3.moon.darkOverlayTicks = c.MOON_DARK_OVERLAY_TICKS;
  const [r1, c1] = c.CHAMBER_BOUNDS[room];
  const shown = p3.enemies.find(e => e.type === 'moon_illusion');
  Object.assign(shown, { tileX: c1 + 9, tileY: r1 + 6, targetTileX: c1 + 9, targetTileY: r1 + 6, x: (c1 + 9.5) * c.TILE_SIZE, y: (r1 + 6.5) * c.TILE_SIZE, flashTicks: 6 });
  p3.moon.seen = [{ id: shown.id, ticks: 30 }];
  p3.laserBeams.push({ fromX: p3.playerX, fromY: p3.playerY, dirX: 1, dirY: 0, endX: p3.playerX + 6 * c.TILE_SIZE, endY: p3.playerY, ticks: 12 });
  const canvas = createCanvas(1100, 700), ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
  renderer.exports.drawGame(ctx, p3, 1100, 700, 420, 0, false);
  fs.writeFileSync(path.join(out, 'moon-dark.png'), canvas.toBuffer('image/png'));
}
console.log('wrote', path.join(out, 'moon-world.png'), path.join(out, 'moon-crystal-cover.png'), path.join(out, 'moon-illusions.png'), path.join(out, 'moon-mirrors.png'), path.join(out, 'moon-dark.png'));

// Inspect the full taper where lower-room parallax previously exposed rectangular stems.
{
  const cv = createCanvas(960, 540);
  moon.drawMoonBackdrop(cv.getContext('2d'), 960, 540, 700, 1800, 360);
  fs.writeFileSync(path.join(out, 'moon-lower-backdrop.png'), cv.toBuffer('image/png'));
}

// Moon Mark: cast travel, lock-on, persistent seal and dark-room readability.
{
 const logic=require('../game/moon.ts'),s=engine.createModeState('trial','splitter_queen');
 s.noMobs=true;engine.godSpawnBoss(s,'splitter_queen');
 const boss=s.enemies.find(e=>e.type==='splitter_queen');
 Object.assign(boss,{tileX:12,targetTileX:12,tileY:10,targetTileY:10,x:12.5*48,y:10.5*48,phaseTimer:300});
 Object.assign(s,{playerTileX:10,playerTargetX:10,playerTileY:10,playerTargetY:10,playerX:10.5*48,playerY:10.5*48});
 logic.useMoonMark(s);
 const w=720,h=460,sheet=createCanvas(w*2,h*2),ctx=sheet.getContext('2d');
 for(const [i,age] of [8,20,90,180].entries()) {
  s.gameTick=200+age;s.moon.mark.ticks=c.MOON_MARK_TICKS-age;
  s.moon.dark=i===3?0:-1;s.moon.secondDark=-1;s.moon.oldDark=s.moon.oldSecondDark=-1;s.moon.darkFade=0;
  const frame=createCanvas(w,h),before=JSON.stringify(s);
  renderer.exports.drawGame(frame.getContext('2d'),s,w,h,s.gameTick,0,false);
  if(before!==JSON.stringify(s))throw Error('Moon Mark art changed state');
  ctx.drawImage(frame,(i%2)*w,Math.floor(i/2)*h);
 }
 fs.writeFileSync(path.join(out,'moon-mark.png'),sheet.toBuffer('image/png'));
}


// Banked healing released from the Queen's actual departure chamber, across four animation ages.
{
 const s=engine.createModeState('trial','splitter_queen');s.noMobs=true;s.meteoriteTimer=1e6;s.resources=[];
 engine.godSpawnBoss(s,'splitter_queen');const boss=s.enemies.find(e=>e.type==='splitter_queen');
 const open=engine.freeChamberTiles(s,0),near=(x,y)=>open.slice().sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y))[0];
 const [bx,by]=near(14,8),[px,py]=near(12,12),[rx,ry]=near(13,13);
 Object.assign(boss,{tileX:bx,targetTileX:bx,tileY:by,targetTileY:by,x:(bx+.5)*48,y:(by+.5)*48,phaseTimer:1});
 Object.assign(s,{playerTileX:px,playerTargetX:px,playerTileY:py,playerTargetY:py,playerX:(px+.5)*48,playerY:(py+.5)*48,rubyTileX:rx,rubyTileY:ry,playerHP:50,rubyHP:50});
 s.moon.healBank=24;engine.tick(s);if(!s.moon.healPulses?.length)throw Error('Missing departure heal pulse');
 const w=1000,h=660,sheet=createCanvas(w*2,h*2),ctx=sheet.getContext('2d');
 for(const [i,age] of [12,30,58,82].entries()){
  s.moon.healPulses[0].ticks=90-age;s.moon.arrivals=[];
  const frame=createCanvas(w,h),before=JSON.stringify(s);renderer.exports.drawGame(frame.getContext('2d'),s,w,h,s.gameTick,0,false);
  if(before!==JSON.stringify(s))throw Error('Moon heal art changed state');ctx.drawImage(frame,(i%2)*w,Math.floor(i/2)*h);
 }
 fs.writeFileSync(path.join(out,'moon-healing.png'),sheet.toBuffer('image/png'));
}
