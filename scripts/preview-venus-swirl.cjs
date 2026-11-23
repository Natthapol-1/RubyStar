const fs=require('fs'),ts=require('typescript'),{createCanvas}=require('@napi-rs/canvas');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),a=require('../game/venus-art.ts'),cv=createCanvas(1440,480),ctx=cv.getContext('2d');
for(const[i,age]of [4,12,22].entries()){
 const s=e.createModeState('trial','aegis_sentinel');for(const row of s.map)row.fill(c.T_FLOOR);s.enemies=[];s.venus.sweeps=[{x:504,y:504,ticks:30-age}];s.gameTick=age;
 ctx.save();ctx.translate(i*480,0);ctx.beginPath();ctx.rect(0,0,480,480);ctx.clip();ctx.fillStyle='#281f1b';ctx.fillRect(0,0,480,480);ctx.strokeStyle='#413128';for(let k=0;k<480;k+=48){ctx.strokeRect(k,0,48,480);ctx.strokeRect(0,k,480,48);}
 const before=JSON.stringify(s);a.drawVenusGround(ctx,s,264,264,age);if(before!==JSON.stringify(s))throw Error('Swirl mutated state');ctx.fillStyle='#fff4ce';ctx.font='14px monospace';ctx.fillText('SAND SWIRL · '+age,20,28);ctx.restore();
}
const veil=createCanvas(840,260),vc=veil.getContext('2d');vc.fillStyle='#281f1b';vc.fillRect(0,0,840,260);
for(const[i,age]of [2,18,36].entries()){
 const s=e.createModeState('trial','aegis_sentinel');s.enemies=[];s.venus.guardUntil=45;s.gameTick=age;s.playerX=140;s.playerY=130;
 vc.save();vc.translate(i*280,0);vc.fillStyle='#fa5577';vc.fillRect(125,115,30,30);vc.fillStyle='#ffdae3';vc.fillRect(130,120,20,20);
 const before=JSON.stringify(s);a.drawVenusEffects(vc,s,0,0,age);if(before!==JSON.stringify(s))throw Error('Veil mutated state');vc.restore();
}
fs.writeFileSync(require('path').join(require('path').dirname(process.argv[2]||'.tmp/venus-swirl.png'),'venus-sand-veil.png'),veil.toBuffer('image/png'));
fs.writeFileSync(process.argv[2]||'.tmp/venus-swirl.png',cv.toBuffer('image/png'));
