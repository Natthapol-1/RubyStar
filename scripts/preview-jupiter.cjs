// Render the actual Jupiter battlefield and all loop states. Usage: node scripts/preview-jupiter.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
require.extensions['.tsx'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } }).outputText, f);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
  .map(m => `const ${m[1].replace(/\btype\s+/g, '')}=require('./${m[2]}.ts');`).join('');
const code = "const {drawConvergenceScreen,drawConvergenceMinimap}=require('./convergence-art.ts');const {drawSuitShell,drawSuitHelmet}=require('./player-suit-art.ts');" + 'const {' + Object.keys(c).join(',') + "}=require('./constants.ts');const {" + Object.keys(engine).filter(k => !(k in c)).join(',') + "}=require('./engine.ts');" + imports
  + source.slice(source.indexOf('const BG_COLOR'), source.indexOf('// Challenge HUD centre: the guardian')) + ';exports.drawGame=drawGame;exports.drawMinimap=drawMinimap;exports.drawGuideCelestial=drawGuideCelestial;exports.drawGuideReaper=drawGuideReaper;';
const renderer = new Module(path.resolve('game/jupiter-preview.cjs'), module);
renderer.filename = path.resolve('game/jupiter-preview.cjs'); renderer.paths = module.paths;
renderer._compile(compile(code), renderer.filename);


const out = process.argv[2];
if (!out) throw new Error('Provide an output directory');
fs.mkdirSync(out, {recursive:true});
const jupiter = require('../game/jupiter.ts'), art = require('../game/jupiter-art.ts');
const guide=require('../game/JupiterGuide.tsx');
for(const [name,dash] of [['jupiter-dash-effect',true],['jupiter-slow-impact',false]]) {
 const cv=createCanvas(800,240),ctx=cv.getContext('2d');
 for(let i=0;i<4;i++) {
  const st=engine.createModeState('trial','storm_reaper');st.jupiter.stage='pursuit';st.jupiter.stormAge=100;
  ctx.save();ctx.translate(i*200,0);ctx.beginPath();ctx.rect(0,0,200,240);ctx.clip();ctx.fillStyle='#211b24';ctx.fillRect(0,0,200,240);
  if(dash){st.jupiter.bossBoost=24-i*5;st.jupiter.bossDashX=1;st.jupiter.bossDashY=0;renderer.exports.drawGuideReaper(ctx,110,130,i*5);art.drawJupiterBossEffect(ctx,st,110,130,i*5);}
  else {require('../game/guide-art.ts').drawGuidePlayer(ctx,100,170);art.drawJupiterSlowImpact(ctx,100,170,1-i*.22);}
  ctx.restore();
 }
 fs.writeFileSync(path.join(out,name+'.png'),cv.toBuffer('image/png'));
}
for(const [name,paint,ages] of [
 ['jupiter-guide-race', (ctx,t)=>guide.drawShardRacePreview(ctx,t,renderer.exports.drawGuideReaper),[0,35,70,89]],
 ['jupiter-guide-floor',guide.drawChargedFloorPreview,[0,18,27,60]],
 ['jupiter-guide-cover',guide.drawMovingCoverPreview,[0,40,69,87]],
 ['jupiter-guide-trail',(ctx,t)=>guide.drawReaperTrailPreview(ctx,t,renderer.exports.drawGuideReaper),[0,55,100,165]],
]) {
 const cv=createCanvas(800,120),ctx=cv.getContext('2d');
 ages.forEach((age,i)=>{ctx.save();ctx.translate(i*200,0);ctx.beginPath();ctx.rect(0,0,200,120);ctx.clip();ctx.fillStyle='#211b24';ctx.fillRect(0,0,200,120);paint(ctx,age);ctx.restore();});
 fs.writeFileSync(path.join(out,name+'.png'),cv.toBuffer('image/png'));
}

// Real phase-2 pursuit: preview footprints, retraction, rising replacement and new layout.
{
 const st=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(st,'storm_reaper');
 st.immortal=true;st.resources=[];st.jupiter.shockTiles=[];
 st.playerTileX=st.playerTargetX=10;st.playerTileY=st.playerTargetY=10;st.playerX=10.5*48;st.playerY=10.5*48;
 const boss=jupiter.jupiterBoss(st);Object.assign(boss,{tileX:39,targetTileX:39,tileY:39,targetTileY:39,x:39.5*48,y:39.5*48,stepProgress:0});
 jupiter.godSetJupiterPhase(st,2);jupiter.godSetJupiterStage(st,'pursuit');st.jupiter.stormBlend=1;st.jupiter.stormAge=120;st.jupiter.coverTimer=1;jupiter.updateJupiter(st);
 const cv=createCanvas(1800,1200),ctx=cv.getContext('2d');let age=0;
 for(const [i,target]of [0,80,98,108].entries()) {
  while(age<target){st.gameTick++;jupiter.updateJupiter(st);age++;}
  const frame=createCanvas(900,600),before=JSON.stringify(st);renderer.exports.drawGame(frame.getContext('2d'),st,900,600,st.gameTick,0,false);
  if(before!==JSON.stringify(st))throw Error('Reconfiguring cover art mutated simulation');
  ctx.drawImage(frame,(i%2)*900,Math.floor(i/2)*600);
 }
 fs.writeFileSync(path.join(out,'jupiter-moving-cover.png'),cv.toBuffer('image/png'));
}

const W=1280,H=720,sheet=createCanvas(W,H*4),sc=sheet.getContext('2d');
for(const [i,stage] of ['charging','pursuit','overcharged','escape'].entries()) {
 const state=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(state,'storm_reaper');
 const boss=jupiter.jupiterBoss(state);boss.tileX=boss.targetTileX=14;boss.tileY=boss.targetTileY=10;boss.x=14.5*c.TILE_SIZE;boss.y=10.5*c.TILE_SIZE;
 state.resources=[];state.gameTick=8;
 jupiter.godSetJupiterStage(state,stage==='overcharged'?'pursuit':stage);
 if(stage==='overcharged')state.jupiter.round=2;
 state.jupiter.stormBlend=stage==='pursuit'||stage==='overcharged'?1:0;
 state.jupiter.energy=stage==='escape'?0:stage==='charging'?65:75;state.jupiter.stormAge=120;if(stage==='charging')state.jupiter.stageTicks=84;
 jupiter.useVoltFence(state);state.jupiter.walls[0].x=12.5*c.TILE_SIZE;state.jupiter.playerBoost=0;
 const canvas=createCanvas(W,H),ctx=canvas.getContext('2d');renderer.exports.drawGame(ctx,state,W,H,8,0,false);
 const before=JSON.stringify(state);art.drawJupiterBackdrop(ctx,state,W,H,0,0,240);art.drawJupiterGround(ctx,state,0,0,240);art.drawJupiterBossEffect(ctx,state,200,200,240);art.drawJupiterMinimap(ctx,state,0,0,4);
 if(JSON.stringify(state)!==before)throw new Error('Jupiter art mutated simulation');
 renderer.exports.drawGame(ctx,state,W,H,8,0,false);
 fs.writeFileSync(path.join(out,'jupiter-'+stage+'.png'),canvas.toBuffer('image/png'));sc.drawImage(canvas,0,i*H);
}
fs.writeFileSync(path.join(out,'jupiter-loop.png'),sheet.toBuffer('image/png'));
console.log('Rendered the real Jupiter battlefield in all four loop states; art is read-only.');

const transitions=createCanvas(1280,720),tc=transitions.getContext('2d');
for(const [i,blend] of [.2,.5,.8].entries()) {
 const st=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(st,'storm_reaper');
 jupiter.godSetJupiterStage(st,'pursuit');st.jupiter.stormBlend=blend;st.gameTick=8;
 const cv=createCanvas(1280,720);renderer.exports.drawGame(cv.getContext('2d'),st,1280,720,8,0,false);
 tc.drawImage(cv,(i%2)*640,Math.floor(i/2)*360,640,360);
}
const danger=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(danger,'storm_reaper');
 jupiter.godSetJupiterStage(danger,'pursuit');danger.jupiter.safeRoom=1;danger.jupiter.stormBlend=1;danger.jupiter.stormAge=120;danger.gameTick=4;
const dc=createCanvas(1280,720);renderer.exports.drawGame(dc.getContext('2d'),danger,1280,720,4,0,false);
tc.drawImage(dc,640,360,640,360);fs.writeFileSync(path.join(out,'jupiter-transitions-storm.png'),transitions.toBuffer('image/png'));

// Actual charged-floor warning, discharge and static slow states.
const hazards=createCanvas(1280,720),hz=hazards.getContext('2d');
for(let i=0;i<4;i++) {
 const st=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(st,'storm_reaper');st.godMode=true;st.resources=[];
 const boss=jupiter.jupiterBoss(st);Object.assign(boss,{tileX:14,targetTileX:14,tileY:10,targetTileY:10,x:14.5*48,y:10.5*48,stepProgress:0});
 jupiter.godSetJupiterStage(st,'charging');st.jupiter.energy=80;st.jupiter.stageTicks=48;st.gameTick=40;
 if(i===0) {
  const [r1,c1,r2,c2]=c.CHAMBER_BOUNDS[st.jupiter.chargeRoom];
  const x=Math.floor((c1+c2+1)/2),y=Math.floor(r1+1+(r2-r1-1)*.23);
  st.jupiter.shockTiles.push({id:999,room:st.jupiter.chargeRoom,x,y,cooldown:0});
  st.jupiter.tileBursts.push({x,y,ticks:25});
 }
 if(i>0){st.jupiter.stageTicks=1;jupiter.updateJupiter(st);st.jupiter.blast.ticks=[0,38,24,12][i];st.jupiter.stormAge=c.JUPITER.chargeBlastTicks-st.jupiter.blast.ticks;st.jupiter.stormBlend=Math.min(1,st.jupiter.stormAge/30);}
 if(i===3){st.jupiter.slowTicks=100;st.jupiter.tileBursts.push({x:10,y:10,ticks:22});}
 const cv=createCanvas(1280,720);renderer.exports.drawGame(cv.getContext('2d'),st,1280,720,40,0,false);hz.drawImage(cv,(i%2)*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'jupiter-discharge-tiles.png'),hazards.toBuffer('image/png'));
(async()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),filename=path.resolve('game/VoltFenceStatus.tsx'),component=new Module(filename,module);
 component.filename=filename;component.paths=module.paths;component._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,filename);
 const cv=createCanvas(320,150),ctx=cv.getContext('2d');ctx.fillStyle='#0b1020';ctx.fillRect(0,0,320,150);
 for(const [i,cooldown]of[0,90].entries()){const markup=renderToStaticMarkup(React.createElement(component.exports.default,{cooldown})),svg=markup.match(/<svg[\s\S]*?<\/svg>/)[0].replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" ');ctx.drawImage(await loadImage(Buffer.from(svg)),25+i*160,20,110,110);}
 fs.writeFileSync(path.join(out,'jupiter-fence-hud.png'),cv.toBuffer('image/png'));
})().catch(error=>{console.error(error);process.exitCode=1;});

// Shared Beta wall-side clearance, matching the removed cover block in every world's layout.
const clearance=engine.createModeState('trial','storm_reaper');clearance.jupiter.shockTiles=[];clearance.enemies=[];clearance.resources=[];
clearance.playerTileX=clearance.playerTargetX=31;clearance.playerTileY=clearance.playerTargetY=8;clearance.playerX=31.5*48;clearance.playerY=8.5*48;
const clearCanvas=createCanvas(1280,720);renderer.exports.drawGame(clearCanvas.getContext('2d'),clearance,1280,720,80,0,false);
fs.writeFileSync(path.join(out,'jupiter-beta-clearance.png'),clearCanvas.toBuffer('image/png'));

// Real player and slow effect at four static animation ages, enlarged for style inspection.
const slowSheet=createCanvas(960,240),slowCtx=slowSheet.getContext('2d');
for(const [i,tick]of[0,5,10,15].entries()) {
 const st=engine.createModeState('trial','storm_reaper');st.enemies=[];st.resources=[];st.jupiter.slowTicks=90;st.gameTick=tick;st.jupiter.shockTiles=[];
 const cv=createCanvas(1280,720);renderer.exports.drawGame(cv.getContext('2d'),st,1280,720,tick,0,false);
 slowCtx.imageSmoothingEnabled=false;slowCtx.drawImage(cv,600,320,80,80,i*240,0,240,240);
}
fs.writeFileSync(path.join(out,'jupiter-static-slow.png'),slowSheet.toBuffer('image/png'));

// Actual shard pickup damage/heal effects, after resolving the gameplay collection.
for(const heal of [false,true]) {
 const st=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(st,'storm_reaper');st.resources=[];
 const boss=jupiter.jupiterBoss(st);Object.assign(boss,{tileX:14,targetTileX:14,tileY:10,targetTileY:10,x:14.5*48,y:10.5*48,stepProgress:0});
 jupiter.godSetJupiterStage(st,'escape');boss.hp=boss.maxHp-100;
 st.jupiter.shards=[{id:1,x:heal?14:10,y:10},{id:2,x:39,y:39}];st.jupiter.shardBossX=boss.x;st.jupiter.shardBossY=boss.y;st.jupiter.shockTiles=[];
 jupiter.updateJupiter(st);st.jupiter.stormBlend=0;
 const cv=createCanvas(1280,720);renderer.exports.drawGame(cv.getContext('2d'),st,1280,720,24,0,false);
 fs.writeFileSync(path.join(out,heal?'jupiter-shard-heal.png':'jupiter-shard-strike.png'),cv.toBuffer('image/png'));
}

// Actual tile variants in both palettes, enlarged without introducing preview-only art.
const variants=createCanvas(640,240),vc=variants.getContext('2d');vc.fillStyle='#0b111d';vc.fillRect(0,0,640,240);
for(let row=0;row<2;row++)for(let i=0;i<4;i++){
 const st=engine.createModeState('trial','storm_reaper');st.jupiter.stage=row?'pursuit':'charging';st.jupiter.stormBlend=row;st.gameTick=42;
 vc.save();vc.translate(50+i*150,12+row*120);vc.scale(2,2);art.drawJupiterTile(vc,st,4+i,4,0,0,true);vc.restore();
}
fs.writeFileSync(path.join(out,'jupiter-wall-variants.png'),variants.toBuffer('image/png'));

// Volt Fence ignition, using the real simulation and painter at four cast ages.
{
 const st=engine.createModeState('trial','storm_reaper');st.noMobs=true;st.noBossSpawns=true;st.meteoriteTimer=100000;st.immortal=true;st.resources=[];
 st.playerDirX=1;st.playerDirY=0;jupiter.useVoltFence(st);
 const w=720,h=460,sheet=createCanvas(w*2,h*2),ctx=sheet.getContext('2d');let age=0;
 for(const [i,target] of [0,5,12,24].entries()) {
  while(age<target){engine.tick(st);age++;}
  const frame=createCanvas(w,h),before=JSON.stringify(st);renderer.exports.drawGame(frame.getContext('2d'),st,w,h,st.gameTick,0,false);
  if(before!==JSON.stringify(st))throw Error('Volt Fence cast art mutated simulation');
  ctx.drawImage(frame,(i%2)*w,Math.floor(i/2)*h);
 }
 fs.writeFileSync(path.join(out,'jupiter-fence-cast.png'),sheet.toBuffer('image/png'));
}

// Charge completion uses the actual transition, then samples its release, forks and wind tail.
const releaseSheet=createCanvas(1280,720),releaseCtx=releaseSheet.getContext('2d');
for(const [i,age] of [-5,3,16,38].entries()) {
 const st=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(st,'storm_reaper');
 st.noMobs=true;st.godMode=true;st.resources=[];
 const boss=st.enemies.find(e=>e.id===st.jupiter.bossId);
 Object.assign(boss,{tileX:14,targetTileX:14,tileY:10,targetTileY:10,x:14.5*c.TILE_SIZE,y:10.5*c.TILE_SIZE});
 st.jupiter.chargeRoom=0;st.jupiter.stageTicks=age<0?-age:1;
 st.jupiter.energy=97;
 if(age>=0){
  jupiter.updateJupiter(st);
  for(let frame=0;frame<age;frame++){st.gameTick++;jupiter.updateJupiter(st);}
 }
 const cv=createCanvas(1280,720),before=JSON.stringify(st);
 renderer.exports.drawGame(cv.getContext('2d'),st,1280,720,age,0,false);
 if(before!==JSON.stringify(st))throw Error('Pursuit transition rendering mutated state');
 releaseCtx.drawImage(cv,(i%2)*640,Math.floor(i/2)*360,640,360);
}
fs.writeFileSync(path.join(out,'jupiter-pursuit-release.png'),releaseSheet.toBuffer('image/png'));

// Phase-3 trail generated by real movement, then left to expire under the player.
{
 const st=engine.createModeState('trial','storm_reaper');engine.godSpawnBoss(st,'storm_reaper');st.godMode=true;st.noMobs=true;st.resources=[];
 jupiter.godSetJupiterPhase(st,3);jupiter.godSetJupiterStage(st,'pursuit');st.jupiter.shockTiles=[];st.jupiter.miniStormHitCooldown=1e9;st.jupiter.stormBlend=1;st.jupiter.stormAge=120;
 const boss=jupiter.jupiterBoss(st);Object.assign(boss,{tileX:11,targetTileX:11,tileY:10,targetTileY:10,x:11.5*48,y:10.5*48,stepProgress:0,path:[],pathTimer:0});
 Object.assign(st,{playerTileX:18,playerTargetX:18,playerTileY:10,playerTargetY:10,playerX:18.5*48,playerY:10.5*48});
 for(let x=11;x<=18;x++)st.map[10][x]=c.T_FLOOR;
 for(let i=0;i<38;i++)jupiter.updateJupiterReaper(st,boss);
 if(!st.jupiter.reaperTrail?.length)throw Error('Reaper movement emitted no trail');
 Object.assign(st,{playerTileX:12,playerTargetX:12,playerX:12.5*48});
 const cv=createCanvas(1800,1200),ctx=cv.getContext('2d');let age=0;
 for(const [i,target]of [0,60,270,300].entries()) {
  while(age<target){st.gameTick++;jupiter.updateJupiter(st);age++;}
  const before=JSON.stringify(st),frame=createCanvas(900,600);renderer.exports.drawGame(frame.getContext('2d'),st,900,600,st.gameTick,0,false);
  if(before!==JSON.stringify(st))throw Error('Trail art mutated simulation');
  ctx.drawImage(frame,(i%2)*900,Math.floor(i/2)*600);
 }
 fs.writeFileSync(path.join(out,'jupiter-reaper-trail.png'),cv.toBuffer('image/png'));
}
