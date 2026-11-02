const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),test=require('node:test'),assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React}}).outputText;
require.extensions['.ts']=(m,f)=>m._compile(compile(fs.readFileSync(f,'utf8')),f);
const c=require('../game/constants.ts'),engine=require('../game/engine.ts'),art=require('../game/blessing-art.ts'),calls=[];
const original=art.drawSapphireHitCorners;art.drawSapphireHitCorners=(...args)=>{calls.push(args);return original(...args);};
const source=fs.readFileSync(path.join(__dirname,'../game/RubyStarGame.tsx'),'utf8');
const imports=[...source.matchAll(/^import\s+(\{[^}]*\})\s+from\s+'\.\/(field-art|blessing-art|blessing-effects|endless-build-art|warning-art|singularity-art|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun)';/gm)].map(m=>`const ${m[1].replace(/\btype\s+/g,'')}=require('./${m[2]}.ts');`).join('');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');"+imports+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawGame=drawGame;';
const renderer=new Module(path.resolve(__dirname,'../game/sapphire-test-renderer.cjs'),module);renderer.filename=path.resolve(__dirname,'../game/sapphire-test-renderer.cjs');renderer.paths=module.paths;
try{renderer._compile(compile(code),renderer.filename);}finally{art.drawSapphireHitCorners=original;}

test('Sapphire hit corners remain visible after animation time advances in an upgrade menu',()=>{
 const s=engine.createModeState('endless');s.build.blessings=['sea_chanter'];s.noMobs=s.noBossSpawns=true;
 const enemy=engine.createEncounterEnemy(s,'normal',s.playerTileX+1,s.playerTileY,100);s.enemies.push(enemy);s.gameTick=30;engine.damageEnemy(s,enemy,1,'player');
 const canvas=createCanvas(640,480),ctx=canvas.getContext('2d');calls.length=0;renderer.exports.drawGame(ctx,s,640,480,3000,0,false);assert.equal(calls.length,1);assert.equal(calls[0][4],30,'the renderer passes gameplay time, not the independent animation clock');assert.equal(calls[0][5],102);
 if(process.env.RUBY_STAR_RENDER_REF==='1')fs.writeFileSync(path.join(__dirname,'../docs/ruby-star/visual-reference/sapphire-hit.png'),canvas.toBuffer('image/png'));
 const withEffect=ctx.getImageData(0,0,640,480).data.slice();s.sapphireHitEffects=[];renderer.exports.drawGame(ctx,s,640,480,3000,0,false);const without=ctx.getImageData(0,0,640,480).data;let changed=0;for(let i=0;i<without.length;i+=4)if(withEffect[i]!==without[i]||withEffect[i+1]!==without[i+1]||withEffect[i+2]!==without[i+2])changed++;assert.ok(changed>100,'the hit cue adds a visible frame to the real battlefield render');
});
