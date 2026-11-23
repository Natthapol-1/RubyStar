const assert=require('node:assert/strict'),fs=require('node:fs'),test=require('node:test'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2017}}).outputText,f);
const e=require('../game/engine.ts'),c=require('../game/constants.ts'),n=require('../game/neptune.ts'),r=require('../game/neptune-refrain.ts'),audio=require('../game/audio-settings.ts');
function fresh(phase=1){
 const s=e.createModeState('trial','sea_chanter');s.noMobs=true;s.godMode=true;s.meteoriteTimer=1e9;e.godSpawnBoss(s,'sea_chanter');n.godSetNeptunePhase(s,phase);
 const b=s.enemies.find(e=>e.id===s.neptune.bossId),t=s.neptune;
 b.hp=c.neptunePhaseCeilHP(phase)-c.NEPTUNE_PHASE_HPS[phase]*.15;b.attackTimer=b.sea.songCooldown=b.sea.allyHealCooldown=1e9;
 Object.assign(t,{clams:[],fishTimer:1e9,tideTimer:1e9,sharkTimer:1e9,jellyTimer:1e9,bombTimer:1e9,refrainTimer:1});
 return{s,b,t};
}
function start(scene){r.updateNeptuneRefrain(scene.s,scene.b);assert.equal(scene.t.refrain.stage,'listen');return scene.t.refrain;}
function answer(scene){const song=start(scene),listenTicks=song.span+(song.exampleLeadIn??0);for(let i=0;i<listenTicks;i++)r.updateNeptuneRefrain(scene.s,scene.b);assert.equal(song.stage,'answer');song.answerStarted=true;return song;}
function finish(scene){scene.t.refrain.answerStarted=true;scene.t.refrain.tick=scene.t.refrain.span-1;n.updateNeptune(scene.s);}

test('a single example precedes the answer, and accumulating ghost healing never changes real HP',()=>{
 const scene=fresh(),song=start(scene),hp=scene.b.hp;
 assert.equal(r.neptunePendingRefrainHeal(scene.s),0);
 assert.equal(song.healBudget,c.NEPTUNE_PHASE_HPS[scene.t.phase]*.20);
 assert.equal(r.neptunePendingRefrainPreview(scene.s),Math.min(song.healBudget,c.neptunePhaseCeilHP(scene.t.phase)-hp));
 const listenTicks=song.exampleLeadIn+song.span/2;for(let i=0;i<listenTicks;i++)r.updateNeptuneRefrain(scene.s,scene.b);
 assert.ok(r.neptunePendingRefrainHeal(scene.s)>0);assert.equal(scene.b.hp,hp);assert.equal(song.stage,'listen');
});

test('the example ducks attack and effects audio, but not music, and pause clears the duck',()=>{
 audio.setNonMusicAudioDuck(1);
 const effects=audio.channelVolume('effects',false),attack=audio.channelVolume('attack',false),music=audio.channelVolume('music');
 const scene=fresh(),song=start(scene);
 assert.equal(audio.channelVolume('effects'),effects*.5);assert.equal(audio.channelVolume('attack'),attack*.5);assert.equal(audio.channelVolume('music'),music);
 scene.s.gamePhase='paused';e.tick(scene.s);
 assert.equal(audio.channelVolume('effects'),effects);assert.equal(audio.channelVolume('attack'),attack);
 scene.s.gamePhase='playing';r.updateNeptuneRefrain(scene.s,scene.b);
 assert.equal(audio.channelVolume('effects'),effects*.5);assert.equal(audio.channelVolume('attack'),attack*.5);
 while(song.stage==='listen')r.updateNeptuneRefrain(scene.s,scene.b);
 assert.equal(audio.channelVolume('effects'),effects);assert.equal(audio.channelVolume('attack'),attack);assert.equal(audio.channelVolume('music'),music);
});

test('water-ball fuse advances at one-eighth speed during the answer only',()=>{
 const createScene=stage=>{
  const scene=fresh(2),ball=e.createEncounterEnemy(scene.s,'water_bomb',scene.s.playerTileX,scene.s.playerTileY,c.ENEMY_CONFIGS.water_bomb.maxHp);
  ball.windupTicks=1000;scene.s.enemies.push(ball);
  scene.t.refrain={stage,tick:0,span:1000,notes:[],extraMisses:0,healBudget:0,phase:2,answerStarted:stage==='answer',answerElapsed:0};
  return{...scene,ball};
 };
 const answerScene=createScene('answer'),exampleScene=createScene('listen');
 for(let i=0;i<8;i++){e.tick(answerScene.s);e.tick(exampleScene.s);}
 assert.equal(answerScene.ball.windupTicks,999);assert.equal(exampleScene.ball.windupTicks,992);
});
test('meteor countdown and warning advance at one-eighth speed during the answer',()=>{
 const scene=fresh();answer(scene);scene.s.meteoriteTimer=1000;
 for(let i=0;i<8;i++)e.tick(scene.s);
 assert.equal(scene.s.meteoriteTimer,999);
 scene.s.meteoriteWarning=0;scene.s.meteoriteStrikeIn=1000;
 for(let i=0;i<8;i++)e.tick(scene.s);
 assert.equal(scene.s.meteoriteStrikeIn,999);
});

test('free skill notes are quieter during the example, but normal during the answer',()=>{
 const previousWindow=global.window,gains=[];
 class AudioContext{
  constructor(){this.currentTime=0;this.state='running';this.destination={};}
  createOscillator(){return{frequency:{value:0},connect(){return this;},start(){},stop(){},disconnect(){}};}
  createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(value){gains.push(value);},linearRampToValueAtTime(){}},connect(){return this;},disconnect(){}};}
  createStereoPanner(){return{pan:{value:0},connect(){return this;},disconnect(){}};}
 }
 global.window={AudioContext};
 audio.setNonMusicAudioDuck(.5);
 try{
  const listen=fresh();listen.t.refrain={stage:'listen',tick:0,span:1,notes:[],extraMisses:0,healBudget:0,phase:1};
  n.useOceanMelody(listen.s);const listenGain=Math.max(...gains);gains.length=0;
  const answerScene=fresh();answerScene.t.refrain={stage:'answer',tick:0,span:1,notes:[{at:0,pitch:0,result:'pending'}],extraMisses:0,healBudget:0,phase:1};
  n.useOceanMelody(answerScene.s);const answerGain=Math.max(...gains);
  assert.ok(listenGain>0);assert.ok(answerGain>0);assert.ok(listenGain<answerGain*.11,`${listenGain} vs ${answerGain}`);
 }finally{
   audio.setNonMusicAudioDuck(1);
  if(previousWindow===undefined)delete global.window;else global.window=previousWindow;
 }
});

test('the HP preview starts at the remaining maximum and shrinks for correct notes',()=>{
 const scene=fresh();scene.b.hp=c.neptunePhaseCeilHP(scene.t.phase)-c.NEPTUNE_PHASE_HPS[scene.t.phase]*.3;
 const song=start(scene);
 assert.equal(r.neptunePendingRefrainPreview(scene.s),song.healBudget);
 song.notes[0].result='hit';
 assert.ok(Math.abs(r.neptunePendingRefrainPreview(scene.s)-song.healBudget*(song.notes.length-1)/song.notes.length)<1e-10);
 while(song.stage==='listen')r.updateNeptuneRefrain(scene.s,scene.b);
 assert.equal(song.tick,0);assert.equal(scene.b.hp,c.neptunePhaseCeilHP(scene.t.phase)-c.NEPTUNE_PHASE_HPS[scene.t.phase]*.3);assert.ok(song.notes.every(note=>note.played));
});

test('perfect, partial and missed answers commit only the remaining heal at turn end',()=>{
 for(const hits of [0,1,2,3,6]){
  const scene=fresh();scene.b.hp=c.neptunePhaseCeilHP(scene.t.phase)-c.NEPTUNE_PHASE_HPS[scene.t.phase]*.3;
  const song=answer(scene),hp=scene.b.hp;
  song.notes.slice(0,hits).forEach(note=>{song.tick=note.at;assert.ok(n.useOceanMelody(scene.s));});
  assert.equal(scene.b.hp,hp,'pressing a note never commits healing early');
  finish(scene);const perfectDamage=hits===song.notes.length?c.NEPTUNE_PHASE_HPS[scene.t.phase]*r.NEPTUNE_REFRAIN.perfectDamageShare:0;assert.ok(Math.abs(scene.b.hp-hp-song.healBudget*(song.notes.length-hits)/song.notes.length+perfectDamage)<1e-8);
  assert.equal(scene.t.refrain,null);assert.equal(scene.t.refrainResult.hits,hits);
 }
});

test('wrong-time and duplicate presses count as misses; spamming cannot cancel healing',()=>{
 const scene=fresh();scene.b.hp=c.neptunePhaseCeilHP(scene.t.phase)-c.NEPTUNE_PHASE_HPS[scene.t.phase]*.3;
 const song=answer(scene),hp=scene.b.hp;
 song.notes.forEach((note,i)=>{song.tick=note.at;n.useOceanMelody(scene.s);if(i===0)n.useOceanMelody(scene.s);});
 assert.equal(song.extraMisses,1);finish(scene);assert.ok(Math.abs(scene.b.hp-hp-song.healBudget/song.notes.length)<1e-8);
 const spam=fresh();spam.b.hp=c.neptunePhaseCeilHP(spam.t.phase)-c.NEPTUNE_PHASE_HPS[spam.t.phase]*.3;
 const phrase=answer(spam),before=spam.b.hp;phrase.tick=11;
 for(let i=0;i<40;i++)n.useOceanMelody(spam.s);
 finish(spam);assert.ok(Math.abs(spam.b.hp-before-phrase.healBudget)<1e-8);
});

test('timing accepts the window boundaries and rejects presses just outside',()=>{
 for(const delta of [-11,-10,10,11]){
  const scene=fresh(),song=answer(scene);song.tick=song.notes[0].at+delta;n.useOceanMelody(scene.s);
  assert.equal(song.notes[0].result,Math.abs(delta)<=10?'hit':'pending');
  assert.equal(song.extraMisses,Math.abs(delta)<=10?0:1);
 }
});

test('the uncharged primal sings freely without cooldown or charge consumption',()=>{
 const {s,t}=fresh();t.healCharge=31;
 for(let i=0;i<20;i++)assert.equal(n.useOceanMelody(s),true);
 assert.equal(t.healCharge,31);assert.equal(s.gamePhase,'playing');assert.equal(t.notePulses.length,12);
});

test('a short tap stays Melody at full charge, leaving Ocean’s Chorus for a hold',()=>{
 const {s,t,b}=fresh();n.fillNeptuneCharge(s);
 for(let i=0;i<1000;i++)r.updateNeptuneRefrain(s,b);
 assert.ok(!t.refrain);assert.ok(n.canOpenSkyLaser(s));assert.ok(n.useOceanMelody(s));assert.equal(s.gamePhase,'playing');
 assert.equal(t.healCharge,c.NEPTUNE_HEAL_CHARGE_MAX);assert.ok(n.openSkyLaser(s));assert.equal(s.gamePhase,'laserTarget');
});

test('pending full charge can be spent during either half; choosing a room resumes the song',()=>{
 for(const stage of ['listen','answer']){
  const scene=fresh(),song=stage==='listen'?start(scene):answer(scene);
  n.chargeNeptuneHealing(scene.s,1000);assert.equal(scene.t.healCharge,c.NEPTUNE_HEAL_CHARGE_MAX-1);assert.equal(scene.t.refrainFullPending,true);
  assert.ok(n.canOpenSkyLaser(scene.s));assert.equal(n.useOceanMelody(scene.s),true);assert.equal(scene.s.gamePhase,'playing');
  assert.ok(n.openSkyLaser(scene.s));assert.equal(scene.t.healCharge,c.NEPTUNE_HEAL_CHARGE_MAX);assert.equal(scene.t.refrainFullPending,false);
  assert.ok(e.chooseSkyLaser(scene.s,0));assert.equal(scene.s.gamePhase,'playing');assert.equal(scene.t.healCharge,0);
  assert.equal(scene.t.refrain,song);assert.equal(song.stage,stage);
 }
});

test('diving cancels unfinished songs without healing or penalties and releases held Ocean’s Chorus charge',()=>{
 const scene=fresh(),song=answer(scene);song.tick=song.span*.5;n.fillNeptuneCharge(scene.s);
 const hp=c.neptunePhaseFloorHP(1)+c.NEPTUNE_PHASE_HPS[1]*2/3;scene.b.hp=hp;n.updateNeptune(scene.s);
 assert.ok(scene.t.dive);assert.equal(scene.t.refrain,null);assert.equal(scene.b.hp,hp);assert.equal(scene.t.healCharge,c.NEPTUNE_HEAL_CHARGE_MAX);
 for(let i=0;i<80;i++)n.updateNeptune(scene.s);assert.equal(scene.t.refrain,null);
});

test('paused gameplay freezes the song, note effects and input; phase jumps discard pending healing',()=>{
 const scene=fresh();answer(scene);n.useOceanMelody(scene.s);scene.s.gamePhase='paused';
 const before=JSON.stringify(scene.t);n.updateNeptune(scene.s);assert.equal(n.useOceanMelody(scene.s),false);assert.equal(JSON.stringify(scene.t),before);
 scene.s.gamePhase='playing';n.godSetNeptunePhase(scene.s,2);assert.equal(scene.t.refrain,null);assert.equal(scene.t.refrainResult,undefined);assert.equal(scene.t.phase,2);
});

test('rhythm healing stays within its phase and no rhythm runs without a surfaced living boss',()=>{
 const scene=fresh(3);answer(scene);scene.b.hp=c.neptunePhaseCeilHP(3)-1;finish(scene);
 assert.equal(scene.b.hp,c.neptunePhaseCeilHP(3));scene.s.enemies=[];scene.t.refrainTimer=1;n.updateNeptune(scene.s);assert.equal(scene.t.refrain,null);
});

test('meteors and full Ocean’s Chorus each damage exactly ten percent of every phase',()=>{
 for(const phase of [1,2,3])for(const source of ['meteor','trident']){
  const {s,b,t}=fresh(phase);t.refrainTimer=1e9;const hp=b.hp,room=c.chamberOfTile(b.tileX,b.tileY);
  if(source==='meteor'){s.meteoriteWarning=room;s.meteoriteStrikeIn=1;e.tick(s);}
  else {n.fillNeptuneCharge(s);n.openSkyLaser(s);assert.ok(e.chooseSkyLaser(s,room));t.laser.ticks=1;n.updateNeptune(s);}
  assert.ok(Math.abs(hp-b.hp-c.NEPTUNE_PHASE_HPS[phase]*.1)<.01,`${phase} ${source}: ${hp-b.hp}`);
 }
});

test('older saves with no rhythm fields can play a note and initialize a new example',()=>{
 const scene=fresh();delete scene.t.refrain;delete scene.t.refrainTimer;delete scene.t.refrainFullPending;delete scene.t.notePulses;
 assert.ok(n.useOceanMelody(scene.s));n.updateNeptune(scene.s);assert.equal(scene.t.refrainTimer,r.NEPTUNE_REFRAIN.first-1);
});

test('authored two-bar patterns stay musical and dense note windows never overlap',()=>{
 for(const phrase of r.REFRAIN_PHRASES){
  assert.ok(phrase.bars.every(bar=>bar.reduce((a,b)=>a+b,0)===4));assert.equal(phrase.lengths.reduce((a,b)=>a+b,0),8);assert.ok(phrase.lengths.every(length=>[4,3,2,1.5,1,.5].includes(length)));
  assert.equal(phrase.pitches.length,phrase.beats.length);assert.ok(phrase.pitches.every(p=>p>=0&&p<=5));
  assert.ok(phrase.beats.length>=4&&phrase.beats.length<=10);
  assert.ok(phrase.beats.every((beat,i)=>beat>=0&&beat<8&&Number.isInteger(beat*2)&&(!i||beat>phrase.beats[i-1])));
 }
 const scene=fresh(3),song=start(scene);assert.equal(song.span,120);assert.equal(song.span*2+r.NEPTUNE_REFRAIN.gap,1080);assert.equal(r.NEPTUNE_REFRAIN.healShare,.20);
 scene.t.refrain=null;scene.t.refrainTimer=0;scene.t.lastRefrain=0;
 const dense=start(scene);for(const note of dense.notes)assert.ok(r.refrainWindow(dense,note)<=10);
 const notes=[0,18,36].map(at=>({at,pitch:2,result:'pending'}));assert.equal(r.refrainWindow({...song,notes},notes[1]),8);
});
test('God Start Song restarts and works with a full charge while preserving it',()=>{
 const scene=fresh();assert.equal(n.godStartOceanMelody(scene.s),true);const first=scene.t.refrain;assert.equal(n.godStartOceanMelody(scene.s),true);assert.notEqual(scene.t.refrain,first);
 r.cancelNeptuneRefrain(scene.s);n.fillNeptuneCharge(scene.s);assert.equal(n.godStartOceanMelody(scene.s),true);assert.equal(scene.t.healCharge,c.NEPTUNE_HEAL_CHARGE_MAX-1);
 const song=scene.t.refrain;while(song.stage==='listen')n.updateNeptune(scene.s);finish(scene);assert.equal(scene.t.healCharge,c.NEPTUNE_HEAL_CHARGE_MAX);
});

test('miss and completion overlays replace text feedback and expire on game ticks',()=>{
 const scene=fresh(),song=answer(scene);song.tick=11;n.useOceanMelody(scene.s);assert.equal(scene.t.rhythmOverlay.kind,'miss');
 for(let i=0;i<30;i++)r.updateRefrainVisuals(scene.s);assert.equal(scene.t.rhythmOverlay,undefined);
 finish(scene);assert.equal(scene.t.rhythmOverlay.kind,'complete');
 const perfect=fresh(),phrase=answer(perfect);for(const note of phrase.notes){phrase.tick=note.at;n.useOceanMelody(perfect.s);}finish(perfect);assert.equal(perfect.t.rhythmOverlay.kind,'perfect');
});

test('off-beat presses color their share of pending healing red, without adding a second heal',()=>{
 const scene=fresh(),song=answer(scene);assert.equal(r.neptunePendingMistakeHeal(scene.s),0);song.tick=11;
 n.useOceanMelody(scene.s);const once=r.neptunePendingMistakeHeal(scene.s);assert.ok(once>0);
 n.useOceanMelody(scene.s);assert.ok(r.neptunePendingMistakeHeal(scene.s)>once);
 assert.ok(r.neptunePendingMistakeHeal(scene.s)<=r.neptunePendingRefrainHeal(scene.s));
 for(let i=0;i<30;i++)n.useOceanMelody(scene.s);assert.equal(r.neptunePendingMistakeHeal(scene.s),r.neptunePendingRefrainHeal(scene.s));
 r.cancelNeptuneRefrain(scene.s);assert.equal(r.neptunePendingMistakeHeal(scene.s),0);
});

test('God Start Song previews without spawning or re-enabling a disabled boss',()=>{
 const scene=fresh();e.godSetNoBossSpawns(scene.s,true);assert.equal(n.godStartOceanMelody(scene.s),true);
 assert.equal(scene.s.noBossSpawns,true);assert.ok(!scene.s.enemies.some(enemy=>enemy.type==='sea_chanter'));
 const song=scene.t.refrain,listenTicks=song.span+(song.exampleLeadIn??0);for(let i=0;i<listenTicks;i++)n.updateNeptune(scene.s);assert.equal(song.stage,'answer');
 for(const note of song.notes){song.tick=note.at;n.useOceanMelody(scene.s);}song.tick=song.span-1;n.updateNeptune(scene.s);
 assert.equal(scene.t.refrain,null);assert.equal(scene.t.refrainResult.hits,6);assert.equal(scene.s.noBossSpawns,true);assert.ok(!scene.s.enemies.some(enemy=>enemy.type==='sea_chanter'));
});

test('example has a 1.5-second quiet lead-in and shows the completion overlay while playing',()=>{
 const scene=fresh();scene.t.refrainTimer=r.NEPTUNE_REFRAIN.first;
 for(let i=0;i<r.NEPTUNE_REFRAIN.first-r.NEPTUNE_REFRAIN.exampleLeadIn-1;i++)r.updateNeptuneRefrain(scene.s,scene.b);
 assert.equal(scene.t.refrain,null);r.updateNeptuneRefrain(scene.s,scene.b);
 const song=scene.t.refrain;assert.ok(song);assert.equal(song.exampleLeadIn,r.NEPTUNE_REFRAIN.exampleLeadIn);
 assert.equal(song.notes[0].at,0);assert.equal(song.notes[0].played,undefined);
 assert.equal(scene.t.rhythmOverlay,undefined);assert.equal(audio.channelVolume('effects'),audio.channelVolume('effects',false)*.5);
 for(let i=0;i<r.NEPTUNE_REFRAIN.exampleLeadIn-1;i++)r.updateNeptuneRefrain(scene.s,scene.b);
 assert.equal(song.notes[0].played,undefined);assert.equal(scene.t.rhythmOverlay,undefined);
 r.updateNeptuneRefrain(scene.s,scene.b);assert.equal(song.notes[0].played,true);
 assert.deepEqual(scene.t.rhythmOverlay,{kind:'complete',ticks:180});
 for(let i=0;i<song.span;i++)r.updateNeptuneRefrain(scene.s,scene.b);assert.equal(song.answerStarted,false);
 for(let i=0;i<20;i++)r.updateNeptuneRefrain(scene.s,scene.b);assert.equal(song.tick,0);assert.equal(song.answerElapsed,20);
 n.useOceanMelody(scene.s);assert.equal(song.answerStarted,true);assert.equal(song.notes[0].result,'hit');
 r.updateNeptuneRefrain(scene.s,scene.b);assert.equal(song.tick,1);
 while(scene.t.refrain)r.updateNeptuneRefrain(scene.s,scene.b);
 assert.equal(scene.t.refrainResult.hits,1);assert.ok(song.notes.slice(1).every(note=>note.result==='miss'));
 assert.equal(scene.t.refrainTimer+song.span+song.answerElapsed,r.NEPTUNE_REFRAIN.cycle);
 const idle=fresh(),silent=start(idle),listenTicks=silent.span+(silent.exampleLeadIn??0);for(let i=0;i<listenTicks;i++)r.updateNeptuneRefrain(idle.s,idle.b);
 for(let i=0;i<silent.span+r.NEPTUNE_REFRAIN.answerGrace;i++)r.updateNeptuneRefrain(idle.s,idle.b);
 assert.equal(idle.t.refrain,null);assert.equal(idle.t.refrainResult.hits,0);assert.ok(silent.notes.every(note=>note.result==='miss'));
});
test('enemy AI advances at one-eighth speed during the melody answer',()=>{
 const scene=fresh(),song=answer(scene),[x,y]=e.freeChamberTiles(scene.s,0)[0];
 const enemy=e.createEncounterEnemy(scene.s,'ghost',x,y,c.ENEMY_CONFIGS.ghost.maxHp);enemy.flashTicks=100;scene.s.enemies.push(enemy);
 for(let i=0;i<8;i++)e.tick(scene.s);
 assert.equal(enemy.flashTicks,99);
});
test('shark warning and movement advance at one-eighth speed during the melody answer',()=>{
 const scene=fresh();answer(scene);scene.s.noMobs=false;scene.s.spawnTimer=1e9;
 const shark={chamber:0,vertical:false,line:scene.s.playerTileY,dir:1,from:0,to:50,pos:0,warning:8,hitPlayer:true,hitRuby:true,hitBoss:true};
 scene.t.shark=shark;
 for(let i=0;i<8;i++)e.tick(scene.s);
 assert.equal(shark.warning,7);
 shark.warning=0;shark.pos=0;
 for(let i=0;i<8;i++)e.tick(scene.s);
 assert.equal(shark.pos,c.NEPTUNE_SHARK_SPEED);
});
test('nearby clones flee, while Melody taunts them through navigable floor then expires',()=>{
 const {s}=fresh();s.map=Array.from({length:12},(_,y)=>Array.from({length:12},(_,x)=>x===0||y===0||x===11||y===11?c.T_WALL:c.T_FLOOR));
 s.playerTileX=s.playerTargetX=3;s.playerTileY=s.playerTargetY=5;s.playerX=3.5*c.TILE_SIZE;s.playerY=5.5*c.TILE_SIZE;
 const clone=e.createEncounterEnemy(s,'water_clone',5,5,8);s.enemies.push(clone);n.updateFish(s,clone);assert.equal(clone.neptuneCloneMode,'flee');assert.ok(clone.targetTileX>clone.tileX);
 clone.tileX=clone.targetTileX=5;clone.tileY=clone.targetTileY=5;clone.stepProgress=0;clone.x=5.5*c.TILE_SIZE;clone.y=5.5*c.TILE_SIZE;
 assert.ok(clone.neptuneFleeBurstTicks>0,'clone is still in its flee burst');n.useOceanMelody(s);assert.equal(clone.neptuneTauntTicks,c.NEPTUNE_MELODY_TAUNT_TICKS);assert.equal(clone.neptuneFleeBurstTicks,0,'taunting cancels the flee burst');n.updateFish(s,clone);assert.equal(clone.neptuneCloneMode,'taunt');assert.equal(clone.targetTileX,4);
 clone.neptuneTauntTicks=1;clone.tileX=clone.targetTileX=5;clone.tileY=clone.targetTileY=5;clone.stepProgress=0;n.updateFish(s,clone);assert.equal(clone.neptuneCloneMode,'flee');
 clone.x=9.5*c.TILE_SIZE;clone.tileX=clone.targetTileX=9;n.useOceanMelody(s);assert.equal(clone.neptuneTauntTicks,c.NEPTUNE_MELODY_TAUNT_TICKS);
 clone.neptuneTauntTicks=0;clone.x=10.5*c.TILE_SIZE;clone.tileX=clone.targetTileX=10;clone.y=10.5*c.TILE_SIZE;clone.tileY=clone.targetTileY=10;n.useOceanMelody(s);assert.equal(clone.neptuneTauntTicks,0);
});

test('Melody damages nearby water balls 0.85 HP per press, and popping one hurts the boss',()=>{
 const {s,b,t}=fresh(2),bossHp=b.hp,x=s.playerTileX,y=s.playerTileY;
 const ball=e.createEncounterEnemy(s,'water_bomb',x,y,c.ENEMY_CONFIGS.water_bomb.maxHp);
 const distant=e.createEncounterEnemy(s,'water_bomb',x+8,y,c.ENEMY_CONFIGS.water_bomb.maxHp);s.enemies.push(ball,distant);
 n.useOceanMelody(s);assert.ok(Math.abs(ball.hp-5.15)<1e-8);assert.equal(distant.hp,6);assert.equal(b.hp,bossHp);
 for(let i=0;i<11;i++)n.useOceanMelody(s);
 assert.ok(ball.hp<=0);assert.equal(distant.hp,6);
 assert.ok(Math.abs(b.hp-(bossHp-c.NEPTUNE_BOMB_SELF_DAMAGE*c.NEPTUNE_PHASE_HPS[t.phase]))<.01);
});

test('perfect Melody heals the player and Ruby and damages the current boss once in each phase',()=>{
 for(const phase of [1,2,3]){
  const scene=fresh(phase),song=answer(scene);scene.s.playerHP=70;scene.s.rubyHP=65;scene.t.healCharge=0;const hp=scene.b.hp;
  for(const note of song.notes){song.tick=note.at;n.useOceanMelody(scene.s);}finish(scene);
  assert.equal(scene.s.playerHP,90);assert.equal(scene.s.rubyHP,85);assert.ok(Math.abs(scene.b.hp-(hp-c.NEPTUNE_PHASE_HPS[phase]*.05))<1e-8);
  assert.ok(Math.abs(scene.t.healCharge-30*c.NEPTUNE_HEAL_CHARGE_RATE)<1e-8);assert.ok(scene.s.rewardEffects.some(fx=>fx.target==='player'&&fx.kind==='heal'));
  const after=scene.b.hp;n.updateNeptune(scene.s);assert.equal(scene.s.playerHP,90);assert.equal(scene.s.rubyHP,85);assert.equal(scene.b.hp,after);
 }
});
test('reply healing caps at maximum HP; a wrong press lowers it and No Boss previews grant none',()=>{
 const capped=fresh(),score=answer(capped);capped.s.playerHP=c.PLAYER_MAX_HP-2;capped.s.rubyHP=c.RUBY_MAX_HP-3;
 for(const note of score.notes){score.tick=note.at;n.useOceanMelody(capped.s);}finish(capped);assert.equal(capped.s.playerHP,c.PLAYER_MAX_HP);assert.equal(capped.s.rubyHP,c.RUBY_MAX_HP);
 const wrong=fresh(),song=answer(wrong);wrong.s.playerHP=70;for(const note of song.notes){song.tick=note.at;n.useOceanMelody(wrong.s);}n.useOceanMelody(wrong.s);const hp=wrong.b.hp;finish(wrong);assert.equal(wrong.s.playerHP,86.7);assert.ok(wrong.b.hp>hp);
 const preview=fresh();e.godSetNoBossSpawns(preview.s,true);preview.s.playerHP=70;n.godStartOceanMelody(preview.s);const tune=preview.t.refrain;
 const listenTicks=tune.span+(tune.exampleLeadIn??0);for(let i=0;i<listenTicks;i++)n.updateNeptune(preview.s);for(const note of tune.notes){tune.tick=note.at;n.useOceanMelody(preview.s);}tune.tick=tune.span-1;n.updateNeptune(preview.s);assert.equal(preview.s.playerHP,70);
});
test('the five-second reply deadline includes three seconds to start before shortening the full phrase',()=>{
 const scene=fresh(),song=start(scene),listenTicks=song.span+(song.exampleLeadIn??0);for(let i=0;i<listenTicks;i++)r.updateNeptuneRefrain(scene.s,scene.b);
 assert.equal(r.refrainAnswerLeft(song),300);for(let i=0;i<160;i++)r.updateNeptuneRefrain(scene.s,scene.b);assert.equal(song.tick,0);
 n.useOceanMelody(scene.s);for(let i=1;i<song.span;i++){song.tick=i-1;if(song.notes.some(note=>note.at===i-1&&note.result==='pending'))n.useOceanMelody(scene.s);r.updateNeptuneRefrain(scene.s,scene.b);}
 assert.ok(scene.t.refrain);r.updateNeptuneRefrain(scene.s,scene.b);assert.equal(scene.t.refrainResult.hits,6);
 assert.equal(scene.t.refrainTimer+song.span+song.answerElapsed,r.NEPTUNE_REFRAIN.cycle);
});

test('a short tap stays Melody during dives, while full Chorus can open and resume the dive',()=>{
 const {s,b,t}=fresh();b.hp=c.neptunePhaseFloorHP(1)+c.NEPTUNE_PHASE_HPS[1]*2/3;n.updateNeptune(s);assert.ok(t.dive);n.fillNeptuneCharge(s);
 const clone=e.createEncounterEnemy(s,'water_clone',s.playerTileX,s.playerTileY,8);s.enemies.push(clone);t.dive.cloneIds.push(clone.id);
 assert.ok(n.canOpenSkyLaser(s));assert.equal(n.useOceanMelody(s),true);
 assert.equal(s.gamePhase,'playing');assert.equal(t.healCharge,c.NEPTUNE_HEAL_CHARGE_MAX);assert.equal(clone.neptuneTauntTicks,c.NEPTUNE_MELODY_TAUNT_TICKS);
 const dive=t.dive;assert.ok(n.openSkyLaser(s));assert.equal(s.gamePhase,'laserTarget');assert.equal(t.dive,dive);
 assert.ok(e.chooseSkyLaser(s,0));assert.equal(s.gamePhase,'playing');assert.equal(t.dive,dive);assert.equal(t.healCharge,0);
});

test('every authored melody can be completed perfectly at its own note count and dotted timings',()=>{
 for(const phrase of r.REFRAIN_PHRASES){
  const scene=fresh(phrase.phase),song=answer(scene);song.notes=phrase.beats.map((beat,i)=>({at:beat*r.NEPTUNE_REFRAIN.beat,pitch:phrase.pitches[i],beats:phrase.lengths[i],result:'pending'}));
  song.answerStarted=false;song.answerElapsed=0;song.tick=0;scene.s.playerHP=70;scene.s.rubyHP=70;const hp=scene.b.hp;
  n.useOceanMelody(scene.s);
  for(let tick=1;tick<=song.span;tick++){
    n.updateNeptune(scene.s);
    if(scene.t.refrain&&song.notes.some(note=>note.result==='pending'&&Math.round(note.at)===tick))n.useOceanMelody(scene.s);
  }
  assert.equal(scene.t.refrainResult.hits,phrase.beats.length);assert.equal(scene.t.refrainResult.mistakes,0);assert.equal(scene.s.playerHP,90);assert.equal(scene.s.rubyHP,90);
  assert.ok(Math.abs(scene.b.hp-(hp-c.NEPTUNE_PHASE_HPS[phrase.phase]*.05))<1e-8);
 }
});

test('enemy motion and attack clocks run at one-eighth speed only while playing the reply',()=>{
 const scene=fresh(),song=start(scene);let before=scene.b.sea.songCooldown;
 for(let i=0;i<20;i++)e.tick(scene.s);assert.equal(before-scene.b.sea.songCooldown,20);
 while(song.stage==='listen')e.tick(scene.s);
 before=scene.b.sea.songCooldown;for(let i=0;i<20;i++)e.tick(scene.s);assert.equal(before-scene.b.sea.songCooldown,20);assert.equal(song.tick,0);
 n.useOceanMelody(scene.s);scene.s.speedCooldown=100;before=scene.b.sea.songCooldown;
 for(let i=0;i<40;i++)e.tick(scene.s);assert.equal(before-scene.b.sea.songCooldown,5);assert.equal(song.tick,40);assert.equal(scene.s.speedCooldown,60);
 r.cancelNeptuneRefrain(scene.s);before=scene.b.sea.songCooldown;for(let i=0;i<20;i++)e.tick(scene.s);assert.equal(before-scene.b.sea.songCooldown,20);
});

test('reply healing follows credited accuracy for both health pools, with wrong presses reducing it',()=>{
 for(const [hits,extras] of [[0,0],[3,0],[6,0],[6,3],[3,3]]){
  const scene=fresh(),song=answer(scene);scene.s.playerHP=40;scene.s.rubyHP=40;scene.t.healCharge=0;
  for(const note of song.notes.slice(0,hits)){song.tick=note.at;n.useOceanMelody(scene.s);}song.extraMisses=extras;finish(scene);
  const recovery=20*Math.max(0,(hits-extras)/song.notes.length);assert.ok(Math.abs(scene.s.playerHP-(40+recovery))<1e-8);assert.ok(Math.abs(scene.s.rubyHP-(40+recovery))<1e-8);
 }
});
test('destroying a clone heals player and Ruby once; dive cleanup grants neither heal',()=>{
 const scene=fresh();scene.s.playerHP=50;scene.s.rubyHP=60;scene.t.healCharge=0;
 const clone=e.createEncounterEnemy(scene.s,'water_clone',scene.s.playerTileX,scene.s.playerTileY,8);scene.s.enemies.push(clone);e.killEnemy(scene.s,scene.s.enemies.indexOf(clone));
 assert.equal(scene.s.playerHP,70);assert.equal(scene.s.rubyHP,80);assert.ok(Math.abs(scene.t.healCharge-10*c.NEPTUNE_HEAL_CHARGE_RATE)<1e-8);
 scene.b.hp=c.neptunePhaseFloorHP(1)+c.NEPTUNE_PHASE_HPS[1]*2/3;n.updateNeptune(scene.s);n.updateNeptune(scene.s);scene.t.dive.ticks=1;
 const player=scene.s.playerHP,ruby=scene.s.rubyHP;n.updateNeptune(scene.s);assert.equal(scene.s.playerHP,player);assert.equal(scene.s.rubyHP,ruby);
});

test('God Start Song runs as practice during a dive, without ending it or granting combat rewards',()=>{
 const scene=fresh();scene.b.hp=c.neptunePhaseFloorHP(1)+c.NEPTUNE_PHASE_HPS[1]*2/3;n.updateNeptune(scene.s);const dive=scene.t.dive;n.fillNeptuneCharge(scene.s);scene.s.playerHP=50;scene.s.rubyHP=50;
 assert.equal(n.godStartOceanMelody(scene.s),true);assert.equal(scene.t.refrain.practice,true);assert.equal(scene.t.dive,dive);
 const song=scene.t.refrain,hp=scene.b.hp;while(song.stage==='listen')n.updateNeptune(scene.s);for(const note of song.notes){song.tick=note.at;n.useOceanMelody(scene.s);}song.tick=song.span-1;n.updateNeptune(scene.s);
 assert.equal(scene.t.refrain,null);assert.equal(scene.s.playerHP,50);assert.equal(scene.s.rubyHP,50);assert.equal(scene.b.hp,hp);assert.equal(scene.t.dive,dive);assert.equal(scene.t.healCharge,c.NEPTUNE_HEAL_CHARGE_MAX);
});

test('wrong-time presses and expired notes give a slight shake without stacking over stronger impacts',()=>{
 const scene=fresh(),song=answer(scene);scene.s.screenShakeTicks=0;scene.s.screenShakeAmt=0;song.tick=11;n.useOceanMelody(scene.s);
 assert.equal(scene.s.screenShakeTicks,6);assert.equal(scene.s.screenShakeAmt,1.5);
 scene.s.screenShakeTicks=20;scene.s.screenShakeAmt=8;n.useOceanMelody(scene.s);assert.equal(scene.s.screenShakeTicks,20);assert.equal(scene.s.screenShakeAmt,8);
 scene.s.screenShakeTicks=0;scene.s.screenShakeAmt=0;song.tick=song.notes[0].at+r.refrainWindow(song,song.notes[0]);r.updateNeptuneRefrain(scene.s,scene.b);
 assert.equal(song.notes[0].result,'miss');assert.equal(scene.s.screenShakeTicks,6);assert.equal(scene.s.screenShakeAmt,1.5);
});
