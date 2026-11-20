const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const challengePoolTest={spawnEnemy};';if(f.endsWith('saturn.ts'))src+='\nexport const saturnPoolTest={spawnSaturnAliens};';if(f.endsWith('sirius.ts'))src+='\nexport const siriusPoolTest={spawnSiriusAliens};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),sat=require('../game/saturn.ts'),sir=require('../game/sirius.ts'),P=c.CHALLENGE_EXTRA_POOL;
test('all eight requested maps share the timed pool, with Normal no longer doubled, and keep Shooter rare',()=>{
 const base=c.DIFFICULTY_TIERS[3].spawnTypes,original=[...base];
 for(const boss of ['fiery_king','thorn_weaver','splitter_queen','aegis_sentinel','astral_twins','sea_chanter','frost_warden','blind_prayer']){
  const s=e.createModeState('trial',boss);s.difficultyTimer=P.afterTicks-1;assert.deepEqual(e.spawnPool(s,base),base);
  s.difficultyTimer=P.afterTicks;const pool=e.spawnPool(s,base),count=t=>pool.filter(x=>x===t).length;
  for(const t of ['ghost','bomber','lancer'])assert.equal(count(t),P.commonWeight);assert.equal(count('shooter'),1);assert.equal(count('normal'),P.normalWeight,'Normal loses its double weight');
 }
 assert.deepEqual(base,original);
 for(const boss of ['storm_reaper','devourer']){const s=e.createModeState('trial',boss);s.difficultyTimer=P.afterTicks+1;assert.deepEqual(e.spawnPool(s,base),base);}
});
test('Sun, Gaia, Moon, Venus, Binary Star and Neptune actually use the expanded regular pool',()=>{
 const old=Math.random;
 try{for(const boss of ['fiery_king','thorn_weaver','splitter_queen','aegis_sentinel','astral_twins','sea_chanter']){
  Math.random=old;const s=e.createModeState('trial',boss);s.enemies=[];s.difficultyLevel=3;s.difficultyTimer=P.afterTicks;Math.random=()=>.999;
  e.challengePoolTest.spawnEnemy(s);assert.ok(s.enemies.some(m=>m.type==='shooter'),boss);
 }}finally{Math.random=old;}
});
test('Saturn and Sirius expand only their Normal slots after one minute and still obey No Mobs',()=>{
 const old=Math.random;
 try{for(const [boss,key,spawn]of [['frost_warden','saturn',sat.saturnPoolTest.spawnSaturnAliens],['blind_prayer','sirius',sir.siriusPoolTest.spawnSiriusAliens]]){
  Math.random=old;const s=e.createModeState('trial',boss);s.enemies=[];s[key].spawnTimer=1;s.difficultyTimer=P.afterTicks-1;Math.random=()=>.999;spawn(s);assert.equal(s.enemies[0].type,'normal');
  s.enemies=[];s[key].spawnTimer=1;s.difficultyTimer=P.afterTicks;spawn(s);assert.equal(s.enemies[0].type,'shooter');
  s.enemies=[];s.noMobs=true;s[key].spawnTimer=1;spawn(s);assert.equal(s.enemies.length,0);
 }}finally{Math.random=old;}
});
test('Saturn and Sirius Normal slots draw from the same timed pool as the other maps',()=>{
 for(const [boss,key,spawn]of [['frost_warden','saturn',sat.saturnPoolTest.spawnSaturnAliens],['blind_prayer','sirius',sir.siriusPoolTest.spawnSiriusAliens]]){
  const seen=new Set();
  for(let i=0;i<600;i++){const s=e.createModeState('trial',boss);s.enemies=[];s[key].spawnTimer=1;s.difficultyLevel=3;s.difficultyTimer=P.afterTicks;spawn(s);for(const m of s.enemies)seen.add(m.type);}
  for(const t of ['normal','armored','fast','healer','charger','ghost','bomber','lancer'])assert.ok(seen.has(t),boss+' spawns '+t);
 }
});


test('Venus Dune Worms join from phase two at the increased chance and cap at five',()=>{
 const s=e.createModeState('trial','aegis_sentinel'),old=Math.random;s.enemies=[];s.difficultyLevel=3;
 try{Math.random=()=>.32;e.challengePoolTest.spawnEnemy(s);assert.ok(s.enemies.every(m=>m.type!=='dune_worm'),'none in phase one');
 s.enemies=[];s.venus.phase=2;for(let i=0;i<8;i++)e.challengePoolTest.spawnEnemy(s);
 assert.equal(s.enemies.filter(m=>m.type==='dune_worm').length,5,'35% roll succeeds and five-body cap holds');
 s.enemies=[];Math.random=()=>.36;e.challengePoolTest.spawnEnemy(s);assert.ok(s.enemies.every(m=>m.type!=='dune_worm'),'outside the new 35% threshold');
 }finally{Math.random=old;}
});
