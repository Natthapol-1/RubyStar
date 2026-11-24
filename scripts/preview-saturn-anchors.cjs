const fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('@napi-rs/canvas'),engine=require('../game/engine.ts'),art=require('../game/saturn-art.ts'),{SATURN}=require('../game/saturn.ts'),{drawGuidePlayer}=require('../game/guide-art.ts'),{T_FLOOR}=require('../game/constants.ts');
const cv=createCanvas(1300,650),ctx=cv.getContext('2d');
for(let stage=0;stage<2;stage++){
 const state=engine.createModeState('trial','frost_warden');state.saturn.phase=2;state.gameTick=40;
 for(const row of state.map)row.fill(T_FLOOR);
 state.enemies=[];state.saturn.nextIce=[];
 const pillar=engine.createEncounterEnemy(state,'frost_anchor',6,6,SATURN.anchorHP);pillar.x=312;pillar.y=312;
 if(!stage)state.enemies.push(pillar);
 ctx.save();ctx.translate(stage*650,0);ctx.beginPath();ctx.rect(0,0,650,650);ctx.clip();ctx.fillStyle='#102030';ctx.fillRect(0,0,650,650);
 ctx.strokeStyle='#203744';for(let x=10;x<650;x+=48)for(let y=5;y<650;y+=48)ctx.strokeRect(x,y,48,48);
 const before=JSON.stringify(state);art.drawSaturnGround(ctx,state,0,0);if(JSON.stringify(state)!==before)throw Error('Art mutated state');
 drawGuidePlayer(ctx,255,360,24);
 if(!stage)art.drawSaturnUnit(ctx,pillar,312,312,40);
 else{
  ctx.strokeStyle='#d9f3ff';ctx.lineWidth=3;ctx.globalAlpha=.55;ctx.strokeRect(240,345,30,30);ctx.globalAlpha=1;
  for(let i=0;i<12;i++){const a=i*2.39996,r=30+i%3*12;ctx.fillStyle=i%2?'#b59bdf':'#bceaff';ctx.globalAlpha=.6;ctx.fillRect(312+Math.cos(a)*r,312+Math.sin(a)*r,3,4);}ctx.globalAlpha=1;
 }
 ctx.fillStyle='#d9e8fa';ctx.font='bold 17px monospace';ctx.fillText(stage?'DESTROYED · COUNTERS RESTORED':'FROST ANCHOR · COUNTERS BLOCKED',25,32);
 ctx.fillStyle='#9faec9';ctx.font='14px monospace';ctx.fillText('Absolute Zero still stops enemies',25,625);ctx.restore();
}
fs.writeFileSync('docs/ruby-star/visual-reference/saturn-frost-anchors.png',cv.toBuffer('image/png'));
console.log('Rendered Frost Anchor from actual ground and unit painters; art is read-only.');

{const model=createCanvas(380,340),c=model.getContext('2d');c.fillStyle='#102030';c.fillRect(0,0,380,340);c.translate(190,210);c.scale(3,3);art.drawFrostAnchor(c,0,0,40);fs.writeFileSync('docs/ruby-star/visual-reference/saturn-frost-anchor-model.png',model.toBuffer('image/png'));}
