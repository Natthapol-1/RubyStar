// Compare actual Endless/challenge renderers at full, high, medium and low HP.
const fs=require('fs'),path=require('path'),Module=require('module'),ts=require('typescript');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017,jsx:ts.JsxEmit.React}}).outputText;
require.extensions['.ts']=(m,f)=>m._compile(compile(fs.readFileSync(f,'utf8')),f);
const {createCanvas}=require('@napi-rs/canvas'),c=require('../game/constants.ts'),engine=require('../game/engine.ts');
const source=fs.readFileSync('game/RubyStarGame.tsx','utf8');
const modules='field-art|blessing-art|blessing-effects|endless-build-art|warning-art|singularity-art|saturn-art|saturn|ice-shield-art|enemy-health-art|jupiter-art|jupiter|encounter-art|neptune-art|gaia-art|moon-art|sun-art|neptune|gaia|moon|sun';
const imports=[...source.matchAll(new RegExp("^import\\s+(\\{[^}]*\\})\\s+from\\s+'\\./("+modules+")';",'gm'))].map(m=>`const ${m[1].replace(/\btype\s+/g,'')}=require('./${m[2]}.ts');`).join('');
const code='const {'+Object.keys(c).join(',')+"}=require('./constants.ts');const {"+Object.keys(engine).filter(k=>!(k in c)).join(',')+"}=require('./engine.ts');"+imports+source.slice(source.indexOf('const BG_COLOR'),source.indexOf('// Challenge HUD centre: the guardian'))+';exports.drawEnemy=drawEnemy;';
const renderer=new Module(path.resolve('game/enemy-health-preview.cjs'),module);renderer.filename=path.resolve('game/enemy-health-preview.cjs');renderer.paths=module.paths;renderer._compile(compile(code),renderer.filename);
const saturn=require('../game/saturn-art.ts');
const types=['normal','cinder_wisp','emberling','scorch_sapper','stinger','jellyfish','pufferfish','water_clone','water_bomb','fish_blue','fish_red','sporeling','vine_crawler','angry_mushroom','seed_pod','blossom','lifebloom','mirror_mite','moon_shade','moon_mimic','frost_raider','ice_caller','rime_brute','aegis_construct'];
const out=process.argv[2]||'docs/ruby-star/visual-reference';fs.mkdirSync(out,{recursive:true});
const cv=createCanvas(1440,720),ctx=cv.getContext('2d'),s=engine.createInitialState();
ctx.fillStyle='#0c1728';ctx.fillRect(0,0,1440,720);ctx.imageSmoothingEnabled=false;
types.forEach((type,index)=>{
 const col=index%6,row=Math.floor(index/6),x=col*240,y=row*180;
 ctx.fillStyle='#d5e8fa';ctx.font='12px monospace';ctx.fillText(type.replaceAll('_',' '),x+8,y+18);
 ctx.save();ctx.beginPath();ctx.rect(x+1,y+25,238,120);ctx.clip();
 for(const [i,ratio] of [1,.75,.4,.15].entries()){
  const enemy=engine.createEncounterEnemy(s,type,10,10,c.ENEMY_CONFIGS[type].maxHp);enemy.hp=enemy.maxHp*ratio;enemy.attackTimer=120;
  const before=JSON.stringify(enemy);const px=x+31+i*58,py=y+105;
  if(!saturn.drawSaturnUnit(ctx,enemy,px,py,40))renderer.exports.drawEnemy(ctx,enemy,px,py,40);
  if(JSON.stringify(enemy)!==before)throw new Error('Rendering mutated '+type);
 }
 ctx.restore();for(const [i,ratio] of [1,.75,.4,.15].entries()){ctx.fillStyle='#7995ad';ctx.font='10px monospace';ctx.fillText(Math.round(ratio*100)+'%',x+19+i*58,y+154);}
 ctx.strokeStyle='#29415a';ctx.strokeRect(x+.5,y+.5,239,179);
});
fs.writeFileSync(path.join(out,'enemy-health-bars.png'),cv.toBuffer('image/png'));
console.log('Rendered actual Endless and 23 challenge unit HP bars; verified read-only drawing.');
