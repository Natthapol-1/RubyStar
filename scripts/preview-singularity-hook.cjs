const fs=require('fs'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('@napi-rs/canvas'),engine=require('../game/engine.ts'),art=require('../game/world-themes.ts'),c=require('../game/constants.ts');
const cv=createCanvas(800,280),ctx=cv.getContext('2d');
for(let i=0;i<2;i++){
 const s=engine.createModeState('trial','devourer');for(const row of s.map)row.fill(c.T_FLOOR);s.enemies=[];Object.assign(s.trial.devourer,{maws:[],gas:[],soulSigns:[],swallows:[],bursts:[]});
 Object.assign(s,{playerTileX:2,playerTargetX:2,playerTileY:3,playerTargetY:3,playerX:120,playerY:168,gameTick:120});
 const e=engine.createEncounterEnemy(s,'soulless',5,3,30);e.x=264;e.y=168;s.enemies=[e];if(i)s.trial.devourer.hook={id:e.id,ticks:30};
 ctx.save();ctx.translate(i*400,0);ctx.beginPath();ctx.rect(0,0,400,280);ctx.clip();ctx.fillStyle='#100b1d';ctx.fillRect(0,0,400,280);ctx.strokeStyle='#20162f';ctx.lineWidth=1;for(let x=0;x<400;x+=48)for(let y=40;y<280;y+=48)ctx.strokeRect(x+.5,y+.5,48,48);
 ctx.fillStyle='#e6fbff';ctx.fillRect(108,156,24,24);ctx.fillStyle='#80ff91';ctx.fillRect(250,154,28,28);
 const before=JSON.stringify(s);art.drawSingularityMawEffects(ctx,s,0,0);if(JSON.stringify(s)!==before)throw Error('Art mutated state');
 ctx.fillStyle='#d9edfa';ctx.font='bold 14px monospace';ctx.fillText(i?'HELD BODY':'HOOK TARGET',18,28);ctx.restore();
}
fs.writeFileSync(process.argv[2]||'.tmp/singularity-hook-marks.png',cv.toBuffer('image/png'));

// Cast stages from the same pressure-front and tether painters used in combat.
{
 const {drawGravityHookCatch,drawGravityHookPulse,drawGravityTether}=require('../game/singularity-hook-art.ts');
 const sheet=createCanvas(1200,320),c=sheet.getContext('2d');
 for(let i=0;i<4;i++){
  c.save();c.translate(i*300,0);c.beginPath();c.rect(0,0,300,320);c.clip();c.fillStyle='#100c1d';c.fillRect(0,0,300,320);
  c.strokeStyle='#241930';for(let x=0;x<300;x+=48)for(let y=30;y<320;y+=48)c.strokeRect(x,y,48,48);
  if(i===1){drawGravityTether(c,55,160,240,160,24,.3);c.fillStyle='#e6fbff';c.fillRect(43,148,24,24);c.fillStyle='#81e189';c.fillRect(226,146,28,28);}
  else{if(i===0)drawGravityHookCatch(c,150,160,.24,Math.round(48*.7)*1.12);else drawGravityHookPulse(c,150,160,[.16,0,.48,.3][i],i===3?150:70);c.fillStyle='#81e189';c.fillRect(138,148,24,24);}
  c.fillStyle='#d9edfa';c.font='bold 16px monospace';c.fillText(['CATCH','TETHER','RELEASE','SLAM'][i],18,28);c.restore();
 }
 fs.writeFileSync('docs/ruby-star/visual-reference/singularity-primal-stages.png',sheet.toBuffer('image/png'));
}
