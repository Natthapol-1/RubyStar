// Render the Venus, Sirius and Singularity map previews. Usage: node scripts/preview-singularity.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|singularity-maw|venus-art|venus|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary|player-suit-art|devourer-model-art|convergence-art)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;exports.drawMinimap=drawMinimap;exports.drawGuideCelestial=drawGuideCelestial;exports.drawEnemy=drawEnemy;';
const renderer = new Module(path.resolve('game/jupiter-preview.cjs'), module);
renderer.filename = path.resolve('game/jupiter-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);


const out = process.argv[2];
if (!out) throw new Error('Provide an output directory');
fs.mkdirSync(out, {recursive:true});
// Soulless physical model at actual gameplay scale, including the shared injured-only HP bars.
{
 const sheet=createCanvas(720,250),ctx=sheet.getContext('2d'),s=engine.createModeState('trial','devourer');
 ctx.fillStyle='#0c1728';ctx.fillRect(0,0,720,250);ctx.font='12px monospace';ctx.textAlign='center';
 for(let i=0;i<5;i++){
  const x=72+i*144;ctx.strokeStyle='#ffffff10';ctx.strokeRect(x-24,116,48,48);
  ctx.fillStyle='#c5d0dc';ctx.fillText(i?['','FULL HP','75% HP','40% HP','15% HP'][i]:'LOST SOUL',x,45);
  const before=JSON.stringify(s);
  if(i===0){ctx.save();require('../game/world-themes.ts').drawLostSoul(ctx,x,140,120,1,false);ctx.restore();}
  else {const unit=engine.createEncounterEnemy(s,'soulless',10,10,30);unit.hp=unit.maxHp*[1,1,.75,.4,.15][i];const beforeUnit=JSON.stringify(unit);renderer.exports.drawEnemy(ctx,unit,x,140,120);if(JSON.stringify(unit)!==beforeUnit)throw Error('Soulless drawing mutated unit');}
  if(JSON.stringify(s)!==before&&i===0)throw Error('Soulless preview mutated state');
 }
 fs.writeFileSync(path.join(out,'soulless.png'),sheet.toBuffer('image/png'));
}

// Actual physical lunge warning, rush, swipe and recovery on the Singularity floor.
{
 const s=engine.createModeState('trial','devourer'),ai=require('../game/aliens.ts');s.noMobs=s.noBossSpawns=true;s.resources=[];s.trial.devourer.maws=[];
 for(let y=1;y<50;y++)for(let x=1;x<50;x++)s.map[y][x]=c.T_FLOOR;
 Object.assign(s,{playerTileX:16,playerTargetX:16,playerTileY:10,playerTargetY:10,playerX:16.5*48,playerY:10.5*48,playerCarryingRuby:false});
 const unit=engine.createEncounterEnemy(s,'soulless',10,10,30);unit.hp=20;unit.attackTimer=0;s.enemies=[unit];
 const sheet=createCanvas(640*4,360),ctx=sheet.getContext('2d');
 for(const [i,count] of [1,c.SOULLESS_LUNGE.warningTicks+3,27,16].entries()){
  for(let j=0;j<count;j++){s.gameTick++;ai.updateRegularAlien(s,unit,false);}
  const before=JSON.stringify(s),frame=createCanvas(640,360);renderer.exports.drawGame(frame.getContext('2d'),s,640,360,s.gameTick);
  if(JSON.stringify(s)!==before)throw Error('Soulless lunge drawing mutated state');ctx.drawImage(frame,i*640,0);
 }
 fs.writeFileSync(path.join(out,'soulless-lunge.png'),sheet.toBuffer('image/png'));
}

// Render the rule sheet's actual Soulless painter at warning, lunge, swipe and recovery.
{
 const source=fs.readFileSync('game/SingularityGuide.tsx','utf8');
 const part=source.slice(source.indexOf('export function drawSoullessGuide('),source.indexOf('export default function'));
 const preview=new Module(path.resolve('game/soulless-guide-preview.cjs'),module);preview.filename=path.resolve('game/soulless-guide-preview.cjs');preview.paths=module.paths;
 preview._compile(compile("const {SOULLESS_LUNGE}=require('./constants.ts');const {drawSoulless}=require('./world-themes.ts');const {drawGuidePlayer}=require('./guide-art.ts');"+part),preview.filename);
 const sheet=createCanvas(800,120),ctx=sheet.getContext('2d');
 for(const [i,tick] of [42,65,88,120].entries()){
  ctx.save();ctx.translate(i*200,0);ctx.beginPath();ctx.rect(0,0,200,120);ctx.clip();ctx.fillStyle='#100a18';ctx.fillRect(0,0,200,120);preview.exports.drawSoullessGuide(ctx,tick);ctx.restore();
 }
 fs.writeFileSync(path.join(out,'soulless-guide.png'),sheet.toBuffer('image/png'));
}

if(process.argv.includes('--soulless'))process.exit(0);
const W=1280,H=720;
// Each world in two chambers, so both halves of its palette show.
for(const [world,boss] of [['venus','aegis_sentinel'],['sirius','blind_prayer'],['sirius-light','blind_prayer'],['singularity','devourer']])for(const room of [0,3]){
 const state=engine.createModeState('trial',boss);state.resources=[];state.gameTick=240;
 if(boss==='devourer'){engine.godSpawnBoss(state,boss);const guardian=state.enemies.find(e=>e.type===boss);Object.assign(guardian,{tileX:14,targetTileX:14,tileY:10,targetTileY:10,x:14.5*48,y:10.5*48,stepProgress:0});}
 if(state.sirius){const light=world==='sirius-light';state.sirius.light=light;state.trial.siriusLight=light;state.trial.siriusLightBlend=light?1:0;state.noMobs=true;}
 const [x,y]=c.TELEPORT_PADS[room];state.playerTileX=state.playerTargetX=x;state.playerTileY=state.playerTargetY=y;state.playerX=(x+.5)*48;state.playerY=(y+.5)*48;
 const cv=createCanvas(W,H),before=JSON.stringify(state);renderer.exports.drawGame(cv.getContext('2d'),state,W,H,240,0,false);
 if(before!==JSON.stringify(state))throw new Error('Art mutated state');fs.writeFileSync(path.join(out,world+(room?'-gamma':'')+'.png'),cv.toBuffer('image/png'));
}
console.log('Rendered Venus, both Sirius lighting states and Singularity in two chambers each; art is read-only.');

// Fixed Maw, Soul Lure, harmless lure burst with a swallow, and F merged into the Maw.
{
 const maw=require('../game/singularity-maw.ts'),s=engine.createModeState('trial','devourer');
 s.noMobs=true;s.noBossSpawns=true;s.immortal=true;s.meteoriteTimer=1e6;s.resources=[];engine.godSpawnBoss(s,'devourer');
 const tiles=engine.freeChamberTiles(s,0),clear=([x,y])=>[-1,0,1].every(dy=>[-1,0,1].every(dx=>engine.isFloorTile(s.map,x+dx,y+dy)));
 const [mx,my]=tiles.filter(clear).sort((a,b)=>Math.hypot(a[0]-9,a[1]-9)-Math.hypot(b[0]-9,b[1]-9))[0];
 s.trial.devourer.maws=[{x:(mx+.5)*48,y:(my+.5)*48,tx:mx,ty:my,room:0,ticks:1000}];
 const choose=(x,y)=>tiles.sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y))[0];
 const [px,py]=choose(mx+5,my);Object.assign(s,{playerTileX:px,playerTargetX:px,playerTileY:py,playerTargetY:py,playerX:(px+.5)*48,playerY:(py+.5)*48});
 const root=s.enemies.find(e=>e.type==='devourer'),[rx,ry]=choose(mx+2,my+1);Object.assign(root,{tileX:rx,targetTileX:rx,tileY:ry,targetTileY:ry,x:(rx+.5)*48,y:(ry+.5)*48,stepProgress:0,path:[]});
 root.devourer.gorgeTicks=undefined;
 for(const [x,y] of [[mx+4,my-2],[mx+6,my+2]]){const [tx,ty]=choose(x,y);s.enemies.push(engine.createEncounterEnemy(s,'normal',tx,ty,60));}
 for(const [i,[x,y]] of [[mx-3,my+3],[mx+7,my-1]].entries()){const [tx,ty]=choose(x,y),soul=engine.createEncounterEnemy(s,'lost_soul',tx,ty,1);s.enemies.push(soul);}
 {const [tx,ty]=choose(mx+3,my+4);s.trial.devourer.soulSigns=[{tx,ty,ticks:60,golden:false}];} // a Lost Soul about to appear
 const w=720,h=460,sheet=createCanvas(w*4,h),ctx=sheet.getContext('2d');
 for(const i of [0,1,2,3]){
  s.trial.devourer.lure=i===1?{x:(mx-2+.5)*48,y:(my+.5)*48,tx:mx-2,ty:my,ticks:240}:undefined;
  s.trial.devourer.lureBurst=i===2?{x:(mx-2+.5)*48,y:(my+.5)*48,ticks:18}:undefined;
  root.chargeDirX=0;root.devourer.generation=1;root.devourer.gorgeTicks=undefined;
  s.trial.devourer.swallows=i===2?[{x:(mx+.5)*48,y:(my+.5)*48,ticks:20,big:true}]:[];
  if(i===3){const m=s.trial.devourer.maws[0];s.singularity={mergeFrom:{x:m.x,y:m.y},maw:m,mergeTicks:1080,x:m.x,y:m.y,ticks:1052,maxTicks:1080,pullTimer:10,damageTimer:60};}
  const frame=createCanvas(w,h),before=JSON.stringify(s);renderer.exports.drawGame(frame.getContext('2d'),s,w,h,s.gameTick,0,false);
  if(before!==JSON.stringify(s))throw Error('Maw drawing mutated gameplay');ctx.drawImage(frame,i*w,0);
 }
 fs.writeFileSync(path.join(out,'singularity-maw.png'),sheet.toBuffer('image/png'));
 // Cast anticipation, bloom, fragments and settled broadcasting from the same live painter.
 const castSheet=createCanvas(w*4,h),castCtx=castSheet.getContext('2d');
 const [lx,ly]=choose(px-2,py);s.trial.devourer.swallows=[];s.trial.devourer.lureBurst=undefined;s.singularity=null;
 for(const [i,age] of [4,12,28,120].entries()) {
  s.trial.devourer.lure={x:(lx+.5)*48,y:(ly+.5)*48,tx:lx,ty:ly,ticks:c.SINGULARITY_CHALLENGE.lureTicks-age};
  const frame=createCanvas(w,h),before=JSON.stringify(s);renderer.exports.drawGame(frame.getContext('2d'),s,w,h,s.gameTick,0,false);
  if(before!==JSON.stringify(s))throw Error('Lure drawing mutated gameplay');castCtx.drawImage(frame,i*w,0);
 }
 fs.writeFileSync(path.join(out,'singularity-lure-cast.png'),castSheet.toBuffer('image/png'));
 s.trial.devourer.lure=undefined;
 const merged=s.trial.devourer.maws[0];s.singularity={mergeFrom:{x:merged.x,y:merged.y},maw:merged,mergeTicks:1080,x:merged.x,y:merged.y,ticks:1052,maxTicks:1080,pullTimer:10,damageTimer:60};
 const mergeSheet=createCanvas(w*4,h),mergeCtx=mergeSheet.getContext('2d');
 for(const [i,age] of [8,24,40,70].entries()){
  s.singularity.ticks=s.singularity.mergeTicks-age;
  const frame=createCanvas(w,h),before=JSON.stringify(s);renderer.exports.drawGame(frame.getContext('2d'),s,w,h,s.gameTick,0,false);
  if(before!==JSON.stringify(s))throw Error('Merge animation mutated gameplay');mergeCtx.drawImage(frame,i*w,0);
 }
 fs.writeFileSync(path.join(out,'singularity-merge.png'),mergeSheet.toBuffer('image/png'));
 // Actual floor-following absorption, then the arrival animation; drawing remains read-only.
 const m=s.trial.devourer.maws[0];s.singularity=null;
 const entry=tiles.map(([x,y])=>({x,y,path:engine.bfs(s.map,x,y,m.tx,m.ty)}))
  .filter(p=>Math.hypot(p.x-m.tx,p.y-m.ty)<=c.SINGULARITY_CHALLENGE.mawRadius&&p.path.length>=2&&p.path.length<=4)
  .sort((a,b)=>Math.abs(a.path.length-3)-Math.abs(b.path.length-3))[0];
 Object.assign(s,{playerX:(entry.x+.5)*48,playerY:(entry.y+.5)*48,playerTileX:entry.x,playerTargetX:entry.x,playerTileY:entry.y,playerTargetY:entry.y,specialSkill:'devourer'});
 engine.useSpecialSkill(s);s.specialEffects=[];s.playerCastTicks=0;
 const absorption=createCanvas(w*4,h),absorptionCtx=absorption.getContext('2d'),travel=entry.path.length*24;
 let elapsed=0;
 for(const [i,age] of [0,Math.floor(travel/2),travel+12,travel+38].entries()){
  while(elapsed<age){s.singularity.ticks--;s.gameTick++;maw.pullFieldIntoMaw(s);elapsed++;}
  const frame=createCanvas(w,h),before=JSON.stringify(s);renderer.exports.drawGame(frame.getContext('2d'),s,w,h,s.gameTick,0,false);
  if(before!==JSON.stringify(s))throw Error('Absorption drawing mutated gameplay');absorptionCtx.drawImage(frame,i*w,0);
 }
 fs.writeFileSync(path.join(out,'singularity-absorption.png'),absorption.toBuffer('image/png'));


}

// Venus challenge: the numbered totem sequence (one showing, others buried), a Sand Sweep, his leap target and lance.
{
 GlobalFonts.registerFromPath(path.resolve('public/fonts/press-start-2p.ttf'), 'Press Start 2P');
 const v=require('../game/venus.ts'),s=engine.createModeState('trial','aegis_sentinel');
 s.noMobs=true;s.immortal=true;s.meteoriteTimer=1e6;s.resources=[];engine.godSpawnBoss(s,'aegis_sentinel');
 const boss=v.venusBoss(s),t=s.venus,tiles=engine.freeChamberTiles(s,0),choose=(x,y)=>tiles.sort((a,b)=>Math.hypot(a[0]-x,a[1]-y)-Math.hypot(b[0]-x,b[1]-y))[0];
 const [px,py]=choose(8,10);Object.assign(s,{playerTileX:px,playerTargetX:px,playerTileY:py,playerTargetY:py,playerX:(px+.5)*48,playerY:(py+.5)*48});
 const [bx,by]=choose(14,8);Object.assign(boss,{tileX:bx,targetTileX:bx,tileY:by,targetTileY:by,x:(bx+.5)*48,y:(by+.5)*48,stepProgress:0,path:[]});
 t.leapTimer=t.lanceTimer=1e9;
 for(let i=0;i<3;i++){const [x,y]=choose([11,5,15][i],[13,6,12][i]);const enemy=engine.createEncounterEnemy(s,'aegis_construct',x,y,v.VENUS.totemHP);enemy.venusOrder=i;t.totems.push({enemy,order:i,life:900,visible:i===2?0:i===1?10:120,buried:i===2,overload:0,rise:i===0?12:0});if(i!==2)s.enemies.push(enemy);} // totem 1 is half risen, 2 sinking, 3 buried
 for(const [k,[x,y]] of [[12,8],[3,9],[15,15]].entries()){const [rx,ry]=choose(x,y),enemy=engine.createEncounterEnemy(s,'sand_relic',rx,ry,1);enemy.relicKind=['urn','sun','eye'][k];t.relics.push({enemy,kind:enemy.relicKind,visible:k===2?0:120,buried:k===2});if(k!==2)s.enemies.push(enemy);} // two uncovered relics and a buried one
 for(const [x,y] of [[10,12],[11,13]]){const [bx2,by2]=choose(x,y),bug=engine.createEncounterEnemy(s,'sand_scarab',bx2,by2,8);bug.targetTileX=bx2+1;s.enemies.push(bug);} // two Sand Scarabs
 {const [ux,uy]=choose(4,13),[ax,ay]=choose(6,7);const under=engine.createEncounterEnemy(s,'dune_worm',ux,uy,12);under.burrow='under';s.enemies.push(under);for(let k=1;k<=5;k++)t.trails.push({x:under.x+k*30,y:under.y-k*8,ticks:150-k*20,id:under.id});const up=engine.createEncounterEnemy(s,'dune_worm',ax,ay,12);up.burrow='up';up.burrowTicks=40;up.shootTicks=10;s.enemies.push(up);} // a Dune Worm tunnelling with its trail, and one burst up mid-bite
 t.spawned=3;t.godReveal=true;t.sweeps=[{x:s.playerX,y:s.playerY,ticks:18}];t.guardUntil=s.gameTick+30; // Reveal Totems on, so the numbers and buried totem show
 const [nx,ny]=choose(12,11);t.nests.push({tx:nx,ty:ny});
 const w=720,h=460,sheet=createCanvas(w*2,h*2),ctx=sheet.getContext('2d');
 for(const i of [0,1,2,3]){
  if(i===1){t.sweeps=[];t.guardUntil=-1;t.lance={ticks:8,dx:-1,dy:.3};t.leap=null;}
  else if(i===2){const aim=t.lance;t.lance=null;t.beams=[{x:boss.x,y:boss.y,dx:aim.dx,dy:aim.dy,ticks:18,parried:false}];}
  else if(i===3){
   const [cx,cy]=choose(6,15);
   t.phase=3;t.beams=[];t.godReveal=false;t.seer=v.VENUS.seerTicks;
   t.core={enemy:engine.createEncounterEnemy(s,'sand_core',cx,cy,v.VENUS.coreHP),visible:0,buried:true,found:false};
   const destroyed=t.totems[0].enemy;
   s.enemies=s.enemies.filter(enemy=>enemy.type!=='sand_scarab'||enemy.tileX!==destroyed.tileX||enemy.tileY!==destroyed.tileY);
   v.venusTotemDestroyed(s,destroyed);
  }
  else t.leap={stage:'lock',ticks:12,tx:px+1,ty:py+2};
  const frame=createCanvas(w,h),before=JSON.stringify(s);renderer.exports.drawGame(frame.getContext('2d'),s,w,h,s.gameTick,0,false);
  if(before!==JSON.stringify(s))throw Error('Venus drawing mutated gameplay');ctx.drawImage(frame,(i%2)*w,Math.floor(i/2)*h);
 }
 fs.writeFileSync(path.join(out,'venus-challenge.png'),sheet.toBuffer('image/png'));
}
