const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>{let src=fs.readFileSync(f,'utf8');if(f.endsWith('engine.ts'))src+='\nexport const spookTest={spawnEnemy};';m._compile(ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);};
const e=require('../game/engine.ts'),c=require('../game/constants.ts');
function fresh(){const s=e.createInitialState();s.noMobs=s.noBossSpawns=true;s.meteoriteTimer=s.ambientEvents.timer=1e7;s.comet.timer=1e9;s.resourceTimer=-1e7;return s;}
function spook(s,hp=1){const m=e.createEncounterEnemy(s,'spook',15,15,hp);s.enemies.push(m);return m;}
function kill(s,m,source='player',solar=false){e.damageEnemy(s,m,.01,source);e.killEnemy(s,s.enemies.indexOf(m),source==='meteor'||solar,solar);}

test('Spook joins Endless from Stage 22, caps at one alive and never joins challenge pools',()=>{
 const s=fresh();s.bossesKilled=21;assert.ok(!e.spawnPool(s,['normal']).includes('spook'));
 s.bossesKilled=22;assert.ok(e.spawnPool(s,['normal']).includes('spook'));spook(s);assert.ok(!e.spawnPool(s,['normal']).includes('spook'));
 s.enemies=[];s.trial={boss:'fiery_king'};assert.deepEqual(e.spawnPool(s,['normal']),['normal']);
});
test('one fractional damaging hit defeats a Spook even if its HP was boosted',()=>{
 for(const hp of [1,100]){const s=fresh(),m=spook(s,hp);e.damageEnemy(s,m,.01);assert.ok(m.hp<=0);}
 const s=fresh(),m=spook(s);e.damageEnemy(s,m,0);assert.equal(m.hp,1,'zero damage is not a hit');
});
test('natural Spooks keep one HP even at late difficulty and stage scaling',()=>{
 const s=fresh();s.bossesKilled=50;s.difficultyLevel=c.DIFFICULTY_TIERS.length-1;
 const pool=e.spawnPool(s,c.DIFFICULTY_TIERS[s.difficultyLevel].spawnTypes),roll=Math.random;
 Math.random=()=> (pool.indexOf('spook')+.1)/pool.length;
 try{e.spookTest.spawnEnemy(s);}finally{Math.random=roll;}
 const m=s.enemies.find(x=>x.type==='spook');assert.ok(m,'spawned naturally');assert.equal(m.hp,1);assert.equal(m.maxHp,1);
});
test('all actual deaths show one brief face, including meteor, alien and Solar Flare kills',()=>{
 for(const [source,solar] of [['player',false],['meteor',false],['enemy',false],['special',true]]){
 const s=fresh(),m=spook(s);kill(s,m,source,solar);assert.equal(s.spookFace.id,m.id);assert.equal(s.spookFace.until,s.gameTick+c.SPOOK.faceTicks);assert.ok(!s.enemies.includes(m));}
});
test('successive deaths replace the face and its timer pauses with gameplay without stopping controls',()=>{
 const s=fresh();kill(s,spook(s));const end=s.spookFace.until;
 s.gamePhase='teleporting';e.tick(s);assert.equal(s.gameTick,0);assert.equal(s.spookFace.until,end);
 s.gamePhase='playing';s.gameTick=20;const next=spook(s);kill(s,next);assert.equal(s.spookFace.id,next.id);assert.equal(s.spookFace.until,20+c.SPOOK.faceTicks);
 assert.equal(s.gamePhase,'playing');assert.equal(s.playerFrozenTicks,0);assert.equal(s.playerKnockback,null);
 for(let i=0;i<c.SPOOK.faceTicks;i++)e.tick(s);assert.ok(s.spookFace.until<=s.gameTick);
});

test('Spook death layers the loud supplied bleh with its original ghost cue for the 1.7-second face',()=>{
 const prior=global.Audio,played=[];global.Audio=class{constructor(src){this.src=src;this.volume=1;}play(){played.push({src:this.src,volume:this.volume,rate:this.playbackRate??1});return Promise.resolve();}};
 try{const s=fresh();kill(s,spook(s));assert.equal(s.spookFace.until-s.gameTick,102);
 assert.equal(played.filter(a=>a.src==='/sounds/spook-bleh.mp3').length,1);
 assert.equal(played.find(a=>a.src==='/sounds/spook-bleh.mp3').volume,1);
 assert.ok(played.some(a=>a.src==='/sounds/deghost.wav'&&a.rate===1.4));
 assert.ok(fs.statSync('public/sounds/spook-bleh.mp3').size>0);
 }finally{global.Audio=prior;}
});
