const fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('@napi-rs/canvas'),e=require('../game/engine.ts'),art=require('../game/convergence-art.ts'),world=require('../game/world-themes.ts');
const canvas=createCanvas(1440,720),ctx=canvas.getContext('2d'),s=e.createModeState('trial','devourer');
s.enemies=[];const members=[];
for(let i=0;i<20;i++){const a=i*2.399,d=150+i%5*40,b=e.createEncounterEnemy(s,'devourer',10+i%10,10,130);b.devourer={generation:1,challenge:true};b.chargeDirX=i%3;b.x=1000+Math.cos(a)*d;b.y=1000+Math.sin(a)*d;s.enemies.push(b);members.push({id:b.id,x:b.x,y:b.y,tx:b.tileX,ty:b.tileY,size:Math.floor(48*.95*e.devourerBodyScale(b))});}
const gatherTicks=require('../game/singularity-maw.ts').convergenceGatherTicks(members.length);
const frames=[['gather',216,1,'ONE AT A TIME'],['gather',118,1,'ARRIVAL SWELL'],['gather',2,1,'LAST ARRIVAL'],['blast',172,1,'IMMEDIATE EXPLOSION'],['blast',158,.13,'ACROSS THE STATION'],['blast',142,.13,'MAP-WIDE AFTERSHOCK']];
for(const [i,[stage,ticks,zoom,label]] of frames.entries()){
 const px=i%3*480,py=Math.floor(i/3)*360;
 s.trial.devourer.convergence={x:1000,y:1000,stage,ticks,count:20,gatherTicks,members};s.gameTick=100;
 ctx.save();ctx.translate(px,py);ctx.beginPath();ctx.rect(0,0,480,360);ctx.clip();ctx.fillStyle='#100a18';ctx.fillRect(0,0,480,360);
 ctx.strokeStyle='#22162e';ctx.lineWidth=1;for(let k=0;k<480;k+=32)ctx.strokeRect(k,0,32,360);for(let k=0;k<360;k+=32)ctx.strokeRect(0,k,480,32);
 ctx.save();ctx.translate(240,180);ctx.scale(zoom,zoom);if(stage==='gather'){const elapsed=gatherTicks-ticks,index=Math.floor(elapsed/(gatherTicks/members.length));for(const [k,m] of members.entries()){m.started=k<=index;if(k>index)require('../game/devourer-model-art.ts').drawDevourerModel(ctx,m.x-1000,m.y-1000,m.size);}}const before=JSON.stringify(s);if(zoom<1){ctx.fillStyle='#241936';for(const [r1,c1,r2,c2] of require('../game/constants.ts').CHAMBER_BOUNDS)ctx.fillRect(c1*48-1000,r1*48-1000,(c2-c1+1)*48,(r2-r1+1)*48);}art.drawSwarmConvergence(ctx,s,1000,1000);ctx.restore();world.drawSingularityAtmosphere(ctx,s,480,360);
 if(before!==JSON.stringify(s))throw Error('Convergence art mutated state');
 ctx.globalAlpha=1;ctx.fillStyle='#e8d8ff';ctx.font='14px monospace';ctx.fillText(label,14,24);ctx.restore();
}
fs.writeFileSync(process.argv[2]||'docs/ruby-star/visual-reference/singularity-convergence.png',canvas.toBuffer('image/png'));
// Screen-space explosion from each offscreen corner, using the actual viewport painter.
{
 const screen=createCanvas(1280,720),g=screen.getContext('2d'),p=require('path');
 for(const [i,[dx,dy,label]] of [[-180,-160,'OFFSCREEN TOP LEFT'],[820,-160,'OFFSCREEN TOP RIGHT'],[-180,520,'OFFSCREEN BOTTOM LEFT'],[820,520,'OFFSCREEN BOTTOM RIGHT']].entries()){
  const col=i%2*640,row=Math.floor(i/2)*360;
  s.trial.devourer.convergence={x:1000,y:1000,stage:'blast',ticks:158,count:20,gatherTicks,members};
  g.save();g.translate(col,row);g.beginPath();g.rect(0,0,640,360);g.clip();g.fillStyle='#100a18';g.fillRect(0,0,640,360);
  g.strokeStyle='#2b1d37';g.lineWidth=1;for(let k=0;k<640;k+=32)g.strokeRect(k,0,32,360);for(let k=0;k<360;k+=32)g.strokeRect(0,k,640,32);
  const before=JSON.stringify(s);art.drawConvergenceScreen(g,s,640,360,1000-dx,1000-dy,1);if(before!==JSON.stringify(s))throw Error('Screen explosion mutated state');
  g.globalAlpha=1;g.fillStyle='#e8d8ff';g.font='13px monospace';g.fillText(label,14,344);g.restore();
 }
 fs.writeFileSync(p.join(p.dirname(process.argv[2]||'docs/ruby-star/visual-reference/singularity-convergence.png'),'singularity-convergence-screen.png'),screen.toBuffer('image/png'));
}
