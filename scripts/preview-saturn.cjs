// Render the Saturn map and existing Warden palette comparison. Usage: node scripts/preview-saturn.cjs <output-directory>
const fs = require('fs'), path = require('path'), Module = require('module'), ts = require('typescript');
const compile = src => ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.React } }).outputText;
require.extensions['.ts'] = (m, f) => m._compile(compile(fs.readFileSync(f, 'utf8')), f);
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const c = require('../game/constants.ts'), engine = require('../game/engine.ts');
const source = fs.readFileSync('game/RubyStarGame.tsx', 'utf8');
// Local art modules keep their real imports; React/UI imports are dropped since only canvas drawing runs.
const imports = [...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(display-settings|player-suit-art|convergence-art|devourer-model-art|singularity-maw|venus-art|venus|gambit-art|gambit|thorn-art|field-art|blessing-art|blessing-effects|endless-build-art|warning-art|world-themes|sirius-art|sirius|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun|binary-world-art|binary-art|binary)';/gm)]
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
function scene(name,setup){
 const state=engine.createModeState('trial','frost_warden');state.resources=[];
 engine.godSpawnBoss(state,'frost_warden');const boss=saturn.saturnBoss(state);
 Object.assign(boss,{tileX:16,targetTileX:16,tileY:8,targetTileY:8,x:16.5*48,y:8.5*48});
 const [x,y]=c.TELEPORT_PADS[0];Object.assign(state,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*48,playerY:(y+.5)*48,gameTick:240});
 state.frostIceTiles=[[9,14],[8,12]];
 const mobs={};
 for(const [type,tx,ty] of [['frostbiter',8,9],['sleet_mortar',15,13],['glacier_hulk',13,6]]){const m=engine.createEncounterEnemy(state,type,tx,ty,c.ENEMY_CONFIGS[type].maxHp);state.enemies.push(m);mobs[type]=m;}
 state.saturn.grantTargets=[mobs.glacier_hulk.id,mobs.frostbiter.id,mobs.sleet_mortar.id];
 setup(state,mobs,boss);
 const cv=createCanvas(W,H),ctx=cv.getContext('2d');const before=JSON.stringify(state);
 renderer.exports.drawGame(ctx,state,W,H,state.gameTick,0,false);
 if(JSON.stringify(state)!==before)throw new Error('Renderer mutated Saturn state');
 fs.writeFileSync(path.join(out,name+'.png'),cv.toBuffer('image/png'));
}
// Grant: targets marked early in the cycle, then the closing cyan rings just before the ice lands.
scene('saturn',(s)=>{s.saturn.grantTimer=300;});
scene('saturn-grant',(s)=>{s.saturn.grantTimer=30;});
scene('saturn-reversed-grant',(s,m,boss)=>{
 s.saturn.phase=3;boss.hp=saturn.SATURN.phaseHP;s.saturn.grantTimer=30;
 const [x,y]=[[11,11],[11,9],[12,9],[10,9]].find(([x,y])=>engine.isFloorTile(s.map,x,y));
 const extra=engine.createEncounterEnemy(s,'frostbiter',x,y,40);s.enemies.push(extra);
 s.saturn.grantTargets.push(extra.id);s.saturn.reverseGrantCycle=true;s.saturn.reverseGrantId=m.sleet_mortar.id;
});
// Recall: violet diamonds and chevrons back to her on everything holding her ice.
scene('saturn-recall',(s,m)=>{s.saturn.grantTimer=300;s.saturn.recallTimer=40;m.glacier_hulk.icyShieldHP=120;m.frostbiter.icyShieldHP=60;s.playerShieldHP=40;s.saturn.playerIce=40;});
// Capture the counter visuals from real Grant and Recall resolutions.
for (const kind of ['grant', 'recall']) {
 scene('saturn-' + kind + '-counter', (s, mobs, boss) => {
  s.noMobs = true;
  boss.phaseTimer = 1000;
  s.saturn.field = { x: s.playerX, y: s.playerY, ticks: 45 };
  s.saturn.grantTimer = kind === 'grant' ? 1 : 1000;
  s.saturn.recallTimer = kind === 'recall' ? 1 : 1000;
  if (kind === 'recall') {
   mobs.frostbiter.icyShieldHP = 60;
   const hulk = mobs.glacier_hulk;
   Object.assign(hulk, { x: 19.5 * c.TILE_SIZE, y: 5.5 * c.TILE_SIZE, tileX: 19, tileY: 5 });
   hulk.icyShieldHP = 60;
  }
  for (let frame = 0; frame < (kind === 'recall' ? 17 : 12); frame++) saturn.updateSaturn(s);
  if (!s.saturn.effects.some(effect => effect.kind === kind + 'Counter')) throw Error('Counter did not resolve');
 });
}
// Time-stop field around you with aliens frozen inside.
scene('saturn-field',(s,m)=>{s.saturn.grantTimer=20;s.saturn.field={x:s.playerX,y:s.playerY,ticks:30};});
// Alien attacks: a Frostbiter crouching on a marked tile, Hailer shells and a Hulk winding up.
scene('saturn-attacks',(s,m,boss)=>{s.saturn.grantTimer=300;const [px,py]=[s.playerTileX,s.playerTileY];
 m.frostbiter.frostAct={kind:'pounce',ticks:12,tx:px,ty:py,fromX:m.frostbiter.x,fromY:m.frostbiter.y};
 s.saturn.shells=[{x:px+1,y:py+2,ticks:30},{x:px+3,y:py+2,ticks:30},{x:px-1,y:py+2,ticks:30}];
 m.glacier_hulk.frostAct={kind:'slam',ticks:20,tx:13,ty:6,fromX:m.glacier_hulk.x,fromY:m.glacier_hulk.y};});
// Phase 2: Frost Bloom transfers shield from an empowered holder to a nearby bare alien.
scene('saturn-phase-2',(s,m)=>{s.saturn.phase=2;s.saturn.grantTimer=300;s.saturn.bloomTimer=1;
 Object.assign(m.frostbiter,{tileX:12,targetTileX:12,tileY:6,targetTileY:6,x:12.5*48,y:6.5*48});
 m.glacier_hulk.icyShieldHP=90;m.frostbiter.icyShieldHP=0;saturn.updateSaturn(s);});
// Alien models at play scale and enlarged: idle, shielded, mid-attack.
const state=engine.createModeState('trial','frost_warden');
const gallery=createCanvas(900,360),gc=gallery.getContext('2d');gc.fillStyle='#101e30';gc.fillRect(0,0,900,360);
for(const [col,type] of ['frostbiter','sleet_mortar','glacier_hulk'].entries())for(const [row,age] of [0,30,60].entries()){
 const mob=engine.createEncounterEnemy(state,type,10,10,c.ENEMY_CONFIGS[type].maxHp);mob.icyShieldHP=row===1?60:0;
 if(row===2){if(type==='frostbiter')mob.frostAct={kind:'pounce',ticks:6,tx:0,ty:0,fromX:0,fromY:0};else if(type==='glacier_hulk')mob.frostAct={kind:'slam',ticks:8,tx:0,ty:0,fromX:0,fromY:0};else mob.shootTicks=18;}
 art.drawSaturnUnit(gc,mob,55+col*300,60+row*115,age);gc.save();gc.translate(180+col*300,60+row*115);gc.scale(1.7,1.7);art.drawSaturnUnit(gc,mob,0,0,age);gc.restore();
}
fs.writeFileSync(path.join(out,'saturn-enemies.png'),gallery.toBuffer('image/png'));
console.log('Rendered Saturn: marked targets, grant, recall, time-stop field, alien attacks and models.');


// Pause after five footsteps so the oldest ice is visibly fading.
scene('saturn-frost-trail',(s,m,boss)=>{
 s.noMobs=true;boss.hp=saturn.SATURN.phaseHP*2;boss.phaseTimer=1e6;s.saturn.phase=2;
 s.saturn.iceTimer=s.saturn.grantTimer=s.saturn.recallTimer=1e6;s.saturn.pulse=-1e6;
 const pool=engine.freeChamberTiles(s,0),start=pool.slice().sort((a,b)=>Math.hypot(a[0]-8,a[1]-10)-Math.hypot(b[0]-8,b[1]-10))[0];
 const path=pool.map(([x,y])=>engine.bfs(s.map,...start,x,y)).filter(p=>p.length>=7&&p.every(([x,y])=>!c.TELEPORT_PADS.some(([px,py])=>x===px&&y===py))).sort((a,b)=>a.length-b.length)[0];
 const place=([x,y])=>Object.assign(s,{playerTileX:x,playerTargetX:x,playerTileY:y,playerTargetY:y,playerX:(x+.5)*48,playerY:(y+.5)*48});
 s.saturn.frostTrail=[];place(start);s.saturn.lastTrailTile={x:start[0],y:start[1]};
 for(const tile of path.slice(0,6)){place(tile);saturn.updateSaturn(s);for(let i=0;i<7;i++)saturn.updateSaturn(s);}
 for(let i=0;i<36;i++)saturn.updateSaturn(s);
});


// The exact shared grant mark used by the Marked Targets rule-sheet card.
{
 const art=require('../game/saturn-art.ts'),w=220,h=140,sheet=createCanvas(w*3,h),ctx=sheet.getContext('2d');
 for(const [i,left] of [140,55,5].entries()){
  ctx.save();ctx.translate(i*w,0);ctx.fillStyle='#102533';ctx.fillRect(0,0,w,h);
  const mob={type:'sleet_mortar',id:1,hp:40,maxHp:40,icyShieldHP:0,flashTicks:0,shootTicks:0,attackTimer:99};
  art.drawSaturnUnit(ctx,mob,150,74,150-left);art.drawSaturnGrantMark(ctx,150,74,40,74,left,150-left);ctx.restore();
 }
 fs.writeFileSync(path.join(out,'saturn-guide-grant-mark.png'),sheet.toBuffer('image/png'));
}
// Reversed and ordinary marks use the exact gameplay painters.
{
 const sheet=createCanvas(660,170),ctx=sheet.getContext('2d');
 for(const [i,left] of [140,55,5].entries()){
  ctx.save();ctx.translate(i*220,0);ctx.fillStyle='#102533';ctx.fillRect(0,0,220,170);
  ctx.fillStyle=art.REVERSE_GRANT_COLOR;ctx.font='bold 12px monospace';ctx.fillText('REVERSED GRANT',14,20);
  const mob={type:'sleet_mortar',id:1,hp:40,maxHp:40,icyShieldHP:0,flashTicks:0,shootTicks:0,attackTimer:99};
  art.drawSaturnUnit(ctx,mob,150,100,150-left);art.drawSaturnGrantMark(ctx,150,100,35,100,left,150-left,true);ctx.restore();
 }
 fs.writeFileSync(path.join(out,'saturn-reversed-grant-cues.png'),sheet.toBuffer('image/png'));
}
