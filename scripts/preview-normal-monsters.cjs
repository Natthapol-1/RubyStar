const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('@napi-rs/canvas');
const c=require('../game/constants.ts'),engine=require('../game/engine.ts'),source=fs.readFileSync('game/RubyStarGame.tsx','utf8');
const modules='convergence-art|devourer-model-art|player-suit-art|binary-art|binary-world-art|binary|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun';
const imports=[...source.matchAll(new RegExp("^import\\s+(\\{[^}]*\\})\\s+from\\s+'\\./("+modules+")';",'gm'))].map(m=>`const ${m[1].replace(/\btype\s+/g,'')}=require('./${m[2]}.ts');`).join('');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');"+imports+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawEnemy=drawEnemy;exports.drawGame=drawGame;exports.drawDropperAttacks=drawDropperAttacks;';
const renderer=new Module(path.resolve('game/mob-preview.cjs'),module);renderer.filename=path.resolve('game/mob-preview.cjs');renderer.paths=module.paths;
renderer._compile(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,jsx:ts.JsxEmit.React}}).outputText,renderer.filename);
const output=process.argv[2]||'.',prefix=process.argv[3]||'normal-monsters';
const state=engine.createInitialState();engine.godSpawnBoss(state,'fiery_king');const template=state.enemies[0];
const types=require('../game/guide-data.ts').aliens.map(a=>a.type).filter(type=>type!=='queen_echo');
function enemy(type,extra={}){return {...template,type,hp:c.ENEMY_CONFIGS[type].maxHp,maxHp:c.ENEMY_CONFIGS[type].maxHp,phaseTimer:100000,path:[],shootTicks:0,attackTimer:100,windupTicks:0,chargeDirX:0,chargeDirY:0,icyShieldHP:0,shieldTargetId:-1,...extra};}
const samples=types.map(type=>[type.toUpperCase(),enemy(type),false]);
samples.push(['SHIELDED',enemy('normal'),true],['ICE SHIELD',enemy('normal',{icyShieldHP:15}),false],['HEAL FLASH',enemy('normal',{healFlashTicks:12}),false],['BOMBER WARNING',enemy('bomber',{exploding:true,explodeTick:24}),false],['SNIPER AIM',enemy('sniper',{windupTicks:20}),false]);
samples.push(['LEECH CHARGED',enemy('energy_leech',{stolenEnergy:60}),false],['LANCER CHARGE',enemy('lancer',{windupTicks:15}),false]);
const height=Math.ceil(samples.length/4)*260;
const canvas=createCanvas(1200,height),ctx=canvas.getContext('2d');ctx.fillStyle='#101923';ctx.fillRect(0,0,1200,height);
for(const [i,[label,mob,shielded]]of samples.entries()){
 const x=i%4*300,y=Math.floor(i/4)*260;ctx.strokeStyle='#26303c';ctx.strokeRect(x+8,y+8,284,244);
 ctx.fillStyle=c.ENEMY_CONFIGS[mob.type].color;ctx.font='14px monospace';ctx.textAlign='center';ctx.fillText(label,x+150,y+35);
 ctx.save();ctx.translate(x+150,y+155);ctx.scale(2,2);renderer.exports.drawEnemy(ctx,mob,0,0,40,shielded);ctx.restore();
 ctx.globalAlpha=1;ctx.shadowBlur=0;
}
fs.writeFileSync(path.join(output,prefix+'.png'),canvas.toBuffer('image/png'));
if(prefix==='aliens'){
 const closeup=createCanvas(600,260),detail=closeup.getContext('2d');
 detail.fillStyle='#101923';detail.fillRect(0,0,600,260);
 for(const [i,charged] of [false,true].entries()){
  detail.strokeStyle='#26303c';detail.strokeRect(i*300+8,8,284,244);
  detail.fillStyle='#c77aff';detail.font='14px monospace';detail.textAlign='center';detail.fillText(charged?'LEECH CHARGED':'LEECH',i*300+150,35);
  detail.save();detail.translate(i*300+150,155);detail.scale(2,2);
  renderer.exports.drawEnemy(detail,enemy('energy_leech',{stolenEnergy:charged?60:0}),0,0,40,false);detail.restore();
 }
 fs.writeFileSync(path.join(output,'energy-leech.png'),closeup.toBuffer('image/png'));
}
// Actual game renderer exercises attack overlays at several life stages.
const scene=createCanvas(1000,700);state.noMobs=true;state.frostIceTiles=[];state.screenShakeTicks=0;
state.playerTileX=state.playerTargetX=11;state.playerTileY=state.playerTargetY=10;state.playerX=11.5*c.TILE_SIZE;state.playerY=10.5*c.TILE_SIZE;
state.enemies=['normal','ghost','armored','splitter','sniper','energy_leech'].map((type,i)=>enemy(type,{id:100+i,x:(8.5+i%3*3)*c.TILE_SIZE,y:(8.5+Math.floor(i/3)*5)*c.TILE_SIZE,tileX:8+i%3*3,targetTileX:8+i%3*3,tileY:8+Math.floor(i/3)*5,targetTileY:8+Math.floor(i/3)*5,targeting:'player',shootTicks:8}));
state.laserBeams=[{fromX:state.enemies[4].x,fromY:state.enemies[4].y,endX:state.playerX,endY:state.playerY,dirX:0,dirY:0,ticks:16,color:'#ff3300'}];
for(const tick of [12,40,88])renderer.exports.drawGame(scene.getContext('2d'),state,1000,700,tick);
fs.writeFileSync(path.join(output,prefix+'-attacks.png'),scene.toBuffer('image/png'));

// Dropper's 2x2 target area, falling weight and transient impact, rendered from the live effect painter.
const dropSheet=createCanvas(1000,240),dropCtx=dropSheet.getContext('2d');
const d=enemy('dropper',{id:800,x:8.5*48,y:10.5*48,tileX:8,tileY:10,targetTileX:8,targetTileY:10});state.enemies=[d];state.gameTick=100;
for(const [i,left] of [c.DROPPER.warningTicks-4,Math.floor(c.DROPPER.warningTicks/2),4,0].entries()){
 dropCtx.save();dropCtx.translate(i*250,0);dropCtx.fillStyle='#101923';dropCtx.fillRect(0,0,250,240);
 dropCtx.strokeStyle='#28343f';dropCtx.strokeRect(77,115,96,96);
 d.dropAttack=left?{tileX:10,tileY:10,ticks:left}:undefined;
 d.dropImpact=left?undefined:{tileX:10,tileY:10,until:state.gameTick+c.DROPPER.impactTicks-4};
 renderer.exports.drawEnemy(dropCtx,d,45,163,100);
 const before=JSON.stringify(state);renderer.exports.drawDropperAttacks(dropCtx,state,11*48-125,11*48-163);
 if(JSON.stringify(state)!==before)throw Error('Dropper art mutated state');
 dropCtx.fillStyle='#ffc36a';dropCtx.font='13px monospace';dropCtx.textAlign='center';dropCtx.fillText(['TARGET LOCK','DESCENDING','IMPACT IMMINENT','IMPACT'][i],125,222);dropCtx.restore();
}
fs.writeFileSync(path.join(output,'dropper-warning.png'),dropSheet.toBuffer('image/png'));

const tabSheet=createCanvas(600,200),tabCtx=tabSheet.getContext('2d');
const blink=enemy('blinker',{id:0});
for(const [i,tick] of [0,16,47].entries()) {
 tabCtx.fillStyle='#101923';tabCtx.fillRect(i*200,0,200,200);tabCtx.save();tabCtx.translate(i*200+100,110);tabCtx.scale(3,3);
 const before=JSON.stringify(blink);renderer.exports.drawEnemy(tabCtx,blink,0,0,tick);if(JSON.stringify(blink)!==before)throw Error('Blinker body mutated state');tabCtx.restore();
}
fs.writeFileSync(path.join(output,'blinker-tabs.png'),tabSheet.toBuffer('image/png'));
const warpSheet=createCanvas(640*4,360),warpCtx=warpSheet.getContext('2d');state.enemies=[];state.laserBeams=[];
for(const [i,age] of [2,8,18,30].entries()) {
 state.blinkerWarp={fromX:state.playerX-300,fromY:state.playerY,x:state.playerX,y:state.playerY,until:state.gameTick+c.BLINKER.warpTicks-age};
 const frame=createCanvas(640,360),before=JSON.stringify(state);renderer.exports.drawGame(frame.getContext('2d'),state,640,360,state.gameTick);
 if(JSON.stringify(state)!==before)throw Error('Blinker warp drawing mutated state');warpCtx.drawImage(frame,i*640,0);
}
fs.writeFileSync(path.join(output,'blinker-warp.png'),warpSheet.toBuffer('image/png'));

// Jammer's real floor field and broadcast model; rendering must not modify gameplay.
const jamState=engine.createInitialState();jamState.noMobs=jamState.noBossSpawns=true;jamState.resources=[];jamState.gameTick=120;
const spot=engine.freeChamberTiles(jamState,0).sort((a,b)=>Math.hypot(a[0]-14,a[1]-12)-Math.hypot(b[0]-14,b[1]-12))[0];
jamState.enemies=[engine.createEncounterEnemy(jamState,'jammer',...spot,c.ENEMY_CONFIGS.jammer.maxHp)];
jamState.playerTileX=jamState.playerTargetX=10;jamState.playerTileY=jamState.playerTargetY=10;jamState.playerX=10.5*48;jamState.playerY=10.5*48;
const jamFrame=createCanvas(960,640),beforeJam=JSON.stringify(jamState);renderer.exports.drawGame(jamFrame.getContext('2d'),jamState,960,640,jamState.gameTick);
if(JSON.stringify(jamState)!==beforeJam)throw Error('Jammer drawing mutated state');
fs.writeFileSync(path.join(output,'jammer-field.png'),jamFrame.toBuffer('image/png'));

const spookSheet=createCanvas(640*4,360),spookCtx=spookSheet.getContext('2d');jamState.enemies=[];
for(const [i,age] of [2,9,Math.floor(c.SPOOK.faceTicks*.55),c.SPOOK.faceTicks-5].entries()) {
 jamState.spookFace={until:jamState.gameTick+c.SPOOK.faceTicks-age,id:2};
 const frame=createCanvas(640,360),before=JSON.stringify(jamState);renderer.exports.drawGame(frame.getContext('2d'),jamState,640,360,jamState.gameTick);
 if(JSON.stringify(jamState)!==before)throw Error('Spook drawing mutated state');spookCtx.drawImage(frame,i*640,0);
}
fs.writeFileSync(path.join(output,'spook-face.png'),spookSheet.toBuffer('image/png'));

// Grappler's actual locked warning, travelling shot and attached cable.
const hookState=engine.createInitialState();hookState.resources=[];hookState.noMobs=hookState.noBossSpawns=true;
for(let y=1;y<50;y++)for(let x=1;x<50;x++)hookState.map[y][x]=c.T_FLOOR;
Object.assign(hookState,{playerTileX:16,playerTargetX:16,playerTileY:13,playerTargetY:13,playerX:16.5*48,playerY:13.5*48,playerCarryingRuby:false});
const grappler=engine.createEncounterEnemy(hookState,'grappler',10,10,14);grappler.attackTimer=0;hookState.enemies=[grappler];
const hookSheet=createCanvas(640*4,400),hookCtx=hookSheet.getContext('2d'),ai=require('../game/aliens.ts');
for(const [i,count] of [22,c.GRAPPLER.warningTicks-21+12,18,8].entries()) {
 for(let step=0;step<count;step++){if(i===3)engine.tick(hookState);else{hookState.gameTick++;ai.updateRegularAlien(hookState,grappler,false);}}
 const before=JSON.stringify(hookState),frame=createCanvas(640,400);renderer.exports.drawGame(frame.getContext('2d'),hookState,640,400,hookState.gameTick);
 if(JSON.stringify(hookState)!==before)throw Error('Grappler drawing mutated state');hookCtx.drawImage(frame,i*640,0);
}
fs.writeFileSync(path.join(output,'grappler-hook.png'),hookSheet.toBuffer('image/png'));

// Reflector's framed mirror in ready, turning and broken states.
const mirrorSheet=createCanvas(640*3,400),mirrorCtx=mirrorSheet.getContext('2d');
const mirror=engine.createEncounterEnemy(hookState,'reflector',12,10,12);mirror.faceX=1;mirror.faceY=0;hookState.enemies=[mirror];
for(let i=0;i<3;i++) {
 hookState.gameTick=80+i*17;mirror.turnTimer=i===1?30:0;mirror.mirrorDownUntil=i===2?hookState.gameTick+60:0;mirror.mirrorDown=i===2;
 const before=JSON.stringify(hookState),frame=createCanvas(640,400);renderer.exports.drawGame(frame.getContext('2d'),hookState,640,400,hookState.gameTick);
 if(JSON.stringify(hookState)!==before)throw Error('Reflector drawing mutated state');mirrorCtx.drawImage(frame,i*640,0);
}
fs.writeFileSync(path.join(output,'reflector-mirror.png'),mirrorSheet.toBuffer('image/png'));
