// Render the actual Jupiter battlefield and all loop states. Usage: node scripts/preview-jupiter.cjs <output-directory>
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
 if(i>0){st.jupiter.stageTicks=1;jupiter.updateJupiter(st);st.jupiter.blast.ticks=[0,38,24,12][i];st.jupiter.stormBlend=1;}
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
 jupiter.godSetJupiterStage(st,'escape');boss.hp=5300;
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
