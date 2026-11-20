const fs=require('fs'),ts=require('typescript');require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const {createCanvas}=require('@napi-rs/canvas'),e=require('../game/engine.ts'),c=require('../game/constants.ts'),ai=require('../game/aliens.ts'),sun=require('../game/sun.ts'),art=require('../game/sun-art.ts');
const canvas=createCanvas(1200,190),ctx=canvas.getContext('2d');
for(const [i,age] of [0,22,64,-1,-2].entries()){
 const s=e.createModeState('trial','fiery_king');s.enemies=[];s.playerTileX=s.playerTargetX=15;s.playerTileY=s.playerTargetY=10;s.playerX=15.5*48;s.playerY=10.5*48;
 const m=e.createEncounterEnemy(s,'flare_spitter',10,10,10);m.attackTimer=0;s.enemies.push(m);for(let n=0;n<age;n++){s.gameTick++;ai.updateRegularAlien(s,m,false);for(const q of s.enemyShots){q.x+=q.dx;q.y+=q.dy;}}
 if(age===-1){s.playerTileX=s.playerTargetX=12;s.playerX=12.5*48;sun.useCoolingWave(s);}
 ctx.save();ctx.translate(i*240,0);ctx.beginPath();ctx.rect(0,0,240,190);ctx.clip();ctx.fillStyle='#190f14';ctx.fillRect(0,0,240,190);ctx.strokeStyle='#3b2921';for(let k=0;k<240;k+=32)ctx.strokeRect(k,0,32,190);
 const before=JSON.stringify(s);art.drawSunUnit(ctx,m,58,105,s.gameTick);if(age===-2){art.drawBurningTile(ctx,102,81,s.gameTick,1,0,0);require('../game/guide-art.ts').drawGuidePlayer(ctx,126,105);art.drawSpitterHit(ctx,126,105,18);}for(const q of s.enemyShots)art.drawFlareFireball(ctx,q.x-m.x+58,q.y-m.y+105,q.dx,q.dy);if(before!==JSON.stringify(s))throw Error('Spitter art mutated state');
 ctx.fillStyle='#ffe2a1';ctx.font='13px monospace';ctx.fillText(['IDLE','WINDUP','THREE FIREBALLS','WATER INTERRUPT','HIT & BURN'][i],12,25);ctx.restore();
}
fs.writeFileSync(process.argv[2]||'docs/ruby-star/visual-reference/sun-flare-spitter.png',canvas.toBuffer('image/png'));
