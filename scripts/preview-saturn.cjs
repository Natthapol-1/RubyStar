// Render the Saturn map and existing Warden palette comparison. Usage: node scripts/preview-saturn.cjs <output-directory>
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
const saturn = require('../game/saturn.ts'), art = require('../game/saturn-art.ts');

const W=1280,H=720;
for(const [name,room,level,age] of [['saturn',0,1,240],['saturn-chamber-2',1,1,240],['saturn-chamber-3',2,1,240],['saturn-gamma',3,1,240],['saturn-blizzard-2',0,2,240],['saturn-blizzard-3',0,3,240],['saturn-blizzard-motion',0,3,360],['saturn-snowball',0,1,120],['saturn-weak',0,1,240],['saturn-shatter-impact',0,1,240],['saturn-shatter-burst',0,1,240],['saturn-shatter-fade',0,1,240],['saturn-melting-ice',0,1,240]]) {
 const state=engine.createModeState('trial','frost_warden');state.resources=[];
 engine.godSpawnBoss(state,'frost_warden');const boss=saturn.saturnBoss(state);
 Object.assign(boss,{tileX:14,targetTileX:14,tileY:10,targetTileY:10,x:14.5*48,y:10.5*48});
 const [x,y]=c.TELEPORT_PADS[room];state.playerTileX=state.playerTargetX=x;state.playerTileY=state.playerTargetY=y;
 state.playerX=(x+.5)*48;state.playerY=(y+.5)*48;state.gameTick=age;state.saturn.level=level;
 state.frostIceTiles=[[9,14],[16,8],[8,12]];state.saturn.nextIce=[[11,7],[13,9]];state.saturn.iceWarning=30;
 for(const [type,tx,ty] of [['frost_raider',7,10],['ice_caller',15,13],['rime_brute',13,7]]){
  const mob=engine.createEncounterEnemy(state,type,tx,ty,c.ENEMY_CONFIGS[type].maxHp);mob.icyShieldHP=type==='frost_raider'?24:0;
  if(type==='frost_raider'){mob.windupTicks=32;mob.chargeDirX=1;mob.chargeDirY=0;}
  state.enemies.push(mob);
 }
 state.saturn.icicles=[{x:12,y:12,ticks:20,landed:false}];
 if(name==='saturn-snowball'){state.playerDirX=1;state.playerDirY=0;saturn.beginSnowball(state);state.saturn.charge=90;}
 if(name==='saturn-weak'){state.saturn.barrier=0;state.saturn.weakTicks=300;state.frostIceTiles=[];state.saturn.nextIce=[];}
 if(name.startsWith('saturn-shatter-')){state.saturn.barrier=0;state.saturn.weakTicks=300;state.frostIceTiles=[];state.saturn.nextIce=[];state.saturn.shatter={x:boss.x,y:boss.y,ticks:saturn.SATURN.shatterTicks-({'saturn-shatter-impact':3,'saturn-shatter-burst':18,'saturn-shatter-fade':44}[name])};}
 if(name==='saturn-melting-ice'){state.frostIceTiles=[];state.saturn.nextIce=[];state.saturn.icicles=[];state.saturn.temporaryIce=[{x:8,y:8,ticks:30},{x:10,y:8,ticks:15},{x:12,y:8,ticks:2}];}
 const cv=createCanvas(W,H),ctx=cv.getContext('2d');const before=JSON.stringify(state);
 renderer.exports.drawGame(ctx,state,W,H,age,0,false);
 if(JSON.stringify(state)!==before)throw new Error('Renderer mutated Saturn state');
 fs.writeFileSync(path.join(out,name+'.png'),cv.toBuffer('image/png'));
}
// Existing Frost Warden shown only in the source-rendered palette reference.
const state=engine.createModeState('trial','frost_warden');state.resources=[];engine.godSpawnBoss(state,'frost_warden');
const boss=state.enemies.find(e=>e.type==='frost_warden');Object.assign(boss,{tileX:14,tileY:10,targetTileX:14,targetTileY:10,x:14.5*48,y:10.5*48});
const cv=createCanvas(W,H);renderer.exports.drawGame(cv.getContext('2d'),state,W,H,240,0,false);
fs.writeFileSync(path.join(out,'saturn-warden-palette.png'),cv.toBuffer('image/png'));
// Actual enemy models at play scale and enlarged, across multiple animation ages.
const gallery=createCanvas(900,360),gc=gallery.getContext('2d');gc.fillStyle='#101e30';gc.fillRect(0,0,900,360);
for(const [col,type] of ['frost_raider','ice_caller','rime_brute'].entries())for(const [row,age] of [0,30,60].entries()){
 const mob=engine.createEncounterEnemy(state,type,10,10,c.ENEMY_CONFIGS[type].maxHp);mob.icyShieldHP=row===1?20:0;mob.windupTicks=row===1&&type!=='ice_caller'?30:0;mob.chargeDirX=1;
 if(row===2){if(type==='frost_raider')mob.frostRollLeft=100;else mob.shootTicks=18;}
 art.drawSaturnUnit(gc,mob,55+col*300,60+row*115,age);gc.save();gc.translate(180+col*300,60+row*115);gc.scale(1.7,1.7);art.drawSaturnUnit(gc,mob,0,0,age);gc.restore();
}
fs.writeFileSync(path.join(out,'saturn-enemies.png'),gallery.toBuffer('image/png'));
const icicles=createCanvas(1000,280),ic=icicles.getContext('2d');ic.fillStyle='#102030';ic.fillRect(0,0,1000,280);
for(const [index,ticks] of [55,14,5,-20,-8].entries()){
 const frame=engine.createModeState('trial','frost_warden');frame.saturn.icicles=[{x:2,y:4,ticks:Math.abs(ticks),landed:ticks<0}];
 const before=JSON.stringify(frame);ic.save();ic.translate(index*200-20,0);art.drawSaturnGround(ic,frame,0,0);ic.restore();
 if(JSON.stringify(frame)!==before)throw new Error('Icicle renderer mutated state');
}
fs.writeFileSync(path.join(out,'saturn-icicle.png'),icicles.toBuffer('image/png'));
console.log('Rendered Saturn, all blizzard levels, motion, charge, weak window and enemy models.');
