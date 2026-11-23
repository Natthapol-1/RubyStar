import { NEPTUNE_HEAL_CHARGE_MAX, NEPTUNE_MELODY_TAUNT_RADIUS, TILE_SIZE, NEPTUNE_PHASE_HPS, neptunePhaseCeilHP } from './constants';
import { damageEnemy, healCore, healPlayer, type Enemy, type GameState } from './engine';
import { hitNeptuneMelodyTarget } from './neptune-melody-targets';
import { openNeptuneClamsInRange } from './neptune-clam';
import { channelVolume, getAudioCtx, gameAudio, setNonMusicAudioDuck } from './audio-settings';
import { playStrikeCharged } from './gaia';

export const NEPTUNE_REFRAIN = { first: 360, gap: 840, cycle: 1080, exampleLeadIn: 90, answerGrace: 180, beat: 15, lead: 0, beats: 8, window: 10, healShare: .20, maxReplyHeal: 20, replyChargeHeal:15, perfectDamageShare: .05 } as const;
export type RefrainNote = { at: number; pitch: number; result: 'pending' | 'hit' | 'miss'; played?: boolean; beats?: number };
export type NeptuneRefrain = { stage: 'listen' | 'answer'; tick: number; span: number; notes: RefrainNote[]; extraMisses: number; healBudget: number; phase: 1 | 2 | 3; exampleLeadIn?: number; answerStarted?: boolean; answerElapsed?: number; practice?: boolean; mistakeMarks?:number[] };
type NoteValue = 4 | 3 | 2 | 1.5 | 1 | .5;
/** Each inner array is exactly one 4/4 bar. Lengths include whole, half, quarter, eighth and dotted note values in beats. */
function phrase(phase:number,bars:readonly (readonly NoteValue[])[],pitches:readonly number[]){
  const lengths=bars.flat(),beats:number[]=[];let at=0;
  for(const length of lengths){beats.push(at);at+=length;}
  return {phase,bars,beats,pitches,lengths};
}
export const REFRAIN_PHRASES = [
  phrase(1,[[2,1,1],[1,1,2]],[0,2,3,3,2,0]),
  phrase(1,[[1,1,2],[2,1,1]],[0,1,2,3,2,0]),
  phrase(1,[[1,2,1],[1,1,2]],[0,2,3,2,1,0]),
  phrase(1,[[2,2],[2,2]],[0,3,2,0]),
  phrase(1,[[1,1,2],[2,2]],[2,3,4,2,0]),
  phrase(1,[[1,1,1,1],[2,1,1]],[0,1,2,3,4,2,0]),
  phrase(2,[[1,.5,.5,2],[2,2]],[0,2,3,2,1,0]),
  phrase(2,[[2,2],[.5,.5,1,2]],[3,2,3,4,2,0]),
  phrase(2,[[4],[1,.5,.5,1,1]],[0,0,1,2,3,0]),
  phrase(2,[[1.5,.5,2],[1.5,.5,2]],[0,2,3,0,1,0]),
  phrase(2,[[1,1,1,1],[1,1,1,1]],[0,2,3,4,3,2,1,0]),
  phrase(2,[[1,.5,.5,1,1],[1,1,2]],[0,1,2,3,2,3,1,0]),
  phrase(2,[[1,.5,.5,2],[1,.5,.5,2]],[0,2,3,2,0,1,2,0]),
  phrase(2,[[2,1,1],[1.5,.5,1,1]],[3,4,3,2,3,1,0]),
  phrase(3,[[.5,.5,2,1],[2,2]],[0,1,3,2,1,0]),
  phrase(3,[[1,3],[1,.5,.5,2]],[3,2,1,2,3,0]),
  phrase(3,[[.5,1,.5,2],[2,2]],[0,2,3,2,1,0]),
  phrase(3,[[1.5,1,1.5],[.5,1.5,2]],[0,2,4,3,2,0]),
  phrase(3,[[.5,.5,1,1,1],[1,.5,.5,1,1]],[0,1,2,3,4,3,4,3,2,0]),
  phrase(3,[[1,.5,.5,1,1],[1,1,.5,.5,1]],[3,4,5,4,3,2,3,2,1,0]),
  phrase(3,[[1.5,.5,1,1],[.5,.5,1,1,1]],[0,2,3,4,3,2,3,1,0]),
  phrase(3,[[.5,.5,1,.5,.5,1],[1,1,2]],[0,1,2,3,4,3,2,1,0]),
  phrase(3,[[4],[.5,.5,.5,.5,1,1]],[0,0,1,2,3,4,0]),
];
export function refrainWindow(song: NeptuneRefrain, note: RefrainNote) {
  const spacing = Math.min(...song.notes.filter(n => n !== note).map(n => Math.abs(n.at-note.at)));
  return Math.min(NEPTUNE_REFRAIN.window, Math.floor((spacing-1)/2));
}
const frequencies=[523.25,587.33,659.25,783.99,880,1046.5];
let finishSound: HTMLAudioElement | null=null;
let warningSound: HTMLAudioElement | null=null;
function prepareSongWarning(){
  if(typeof window==='undefined')return;
  try { if(!warningSound){warningSound=gameAudio('/sounds/neptune-song-warning.mp3','effects');warningSound.preload='auto';warningSound.volume=.9;warningSound.load();} } catch { warningSound=null; }
}
function playSongWarning(){
  prepareSongWarning();if(!warningSound)return;
  warningSound.currentTime=0;void warningSound.play().catch(()=>{});
}
function prepareSongFinish(){
  if(typeof window==='undefined')return;
  try { if(!finishSound){finishSound=gameAudio('/sounds/neptune-song-finish.mp3','effects');finishSound.preload='auto';finishSound.volume=.85;finishSound.load();} } catch { finishSound=null; }
}
function playSongFinish(){
  prepareSongFinish();if(!finishSound)return;
  finishSound.currentTime=0;void finishSound.play().catch(()=>{});
}
let harpBuffer:AudioBuffer|null=null,harpLoading:Promise<void>|null=null;
/** Decode the supplied C5 harp once before the example; trim only leading silence. */
export function prepareNeptuneMelodyAudio(){
  prepareSongWarning();
  if(typeof window==='undefined'||harpLoading)return harpLoading;
  const ctx=getAudioCtx();if(!ctx)return null;
  harpLoading=fetch('/sounds/neptune-melody-harp.mp3').then(response=>{if(!response.ok)throw new Error('harp');return response.arrayBuffer();}).then(data=>ctx.decodeAudioData(data)).then(buffer=>{
    let peak=0,start=buffer.length;
    for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++)peak=Math.max(peak,Math.abs(data[i]));}
    if(!peak)return;
    for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++)if(Math.abs(data[i])>peak*.006){start=Math.min(start,Math.max(0,i-16));break;}}
    const trimmed=ctx.createBuffer(buffer.numberOfChannels,buffer.length-start,buffer.sampleRate);
    for(let c=0;c<buffer.numberOfChannels;c++){const from=buffer.getChannelData(c),to=trimmed.getChannelData(c);for(let i=0;i<to.length;i++)to[i]=from[i+start]*.65/peak;}
    harpBuffer=trimmed;
  }).catch(()=>{harpLoading=null;});return harpLoading;
}
function playSampledHarp(ctx:AudioContext,pitch:number,kind:'note'|'example'|'miss',beats:number,volume:number){
  if(!harpBuffer)return false;
  const rate=frequencies[((pitch%frequencies.length)+frequencies.length)%frequencies.length]/523.25*(kind==='miss'?.5:1);
  const echoes=[[0,1,0],[.125,.2,-.5],[.25,.1,.5],[.375,.05,-.25]];
  for(const [delay,level,pan] of echoes){
    while(voices.size>=64){const oldest=voices.values().next().value!;oldest.stop();voices.delete(oldest);}
    const source=ctx.createBufferSource(),gain=ctx.createGain(),stereo=ctx.createStereoPanner(),now=ctx.currentTime+delay;
    source.buffer=harpBuffer;source.playbackRate.value=rate;stereo.pan.value=pan;
    const duration=Math.min(harpBuffer.duration/rate,1.1*Math.min(1.5,Math.sqrt(beats)));
    const loudness=level*volume*(kind==='miss'?.4:.9);
    gain.gain.setValueAtTime(loudness,now);gain.gain.setValueAtTime(loudness,now+Math.max(0,duration-.15));gain.gain.linearRampToValueAtTime(0,now+duration);
    const tone=kind==='example'?ctx.createBiquadFilter():null;
    if(tone){tone.type='lowpass';tone.frequency.value=4200;tone.Q.value=.55;source.connect(tone).connect(gain);}else source.connect(gain);
    gain.connect(stereo).connect(ctx.destination);voices.add(source);
    source.onended=()=>{voices.delete(source);source.disconnect();tone?.disconnect();gain.disconnect();stereo.disconnect();};source.start(now);source.stop(now+duration+.01);
  }return true;
}
const voices = new Set<AudioScheduledSourceNode>();
/** Plucked harp partials with diminishing, stereo echoes; only current taps are scheduled. */
export function playRefrainNote(pitch: number, kind: 'note' | 'example' | 'miss' | 'beat' = 'note', beats = 1, intensity = 1) {
  const volume = channelVolume('effects',false)*Math.max(0,Math.min(1,intensity)); if (volume <= 0) return;
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    if(kind!=='beat'){prepareNeptuneMelodyAudio();if(playSampledHarp(ctx,pitch,kind,beats,volume))return;}
    const hz = frequencies[((pitch%frequencies.length)+frequencies.length)%frequencies.length]*(kind==='miss'?.5:1);
    const layers = kind === 'beat' ? [[pitch===1?100:200,pitch===1?.035:.016,.09,0,0]] :
      [[hz,.13,.85,0,0],[hz*2,.075,.22,0,-.15],[hz*3,.035,.09,0,.15],
       [hz*4,.02,.055,0,0],[hz*5,.016,.035,0,0],[hz*6,.01,.02,0,0],[hz,.038,.65,.125,-.6],[hz*2,.009,.25,.125,-.6],
       [hz,.019,.55,.25,.6],[hz,.009,.4,.375,-.25]];
    for (const [frequency, level, duration, delay, pan] of layers) {
      while (voices.size >= 64) { const oldest=voices.values().next().value!; oldest.stop(); voices.delete(oldest); }
      const oscillator=ctx.createOscillator(), gain=ctx.createGain(), stereo=ctx.createStereoPanner(), now=ctx.currentTime+delay;
      oscillator.type='sine'; oscillator.frequency.value=frequency; stereo.pan.value=pan;
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(level*volume*(kind==='beat'?1:kind==='miss'?1.1:3.2)*(kind==='example'&&frequency>hz? .65:1),now+(kind==='example'?.002:.0008));
      gain.gain.exponentialRampToValueAtTime(.0001,now+duration*Math.min(1.8,Math.sqrt(beats)));
      oscillator.connect(gain).connect(stereo).connect(ctx.destination); voices.add(oscillator);
      oscillator.onended=()=>{voices.delete(oscillator);oscillator.disconnect();gain.disconnect();stereo.disconnect();};
      oscillator.start(now);oscillator.stop(now+duration*Math.min(1.8,Math.sqrt(beats))+.02);
    }
  } catch { /* Visual timing remains available with audio disabled. */ }
}

export function releaseRefrainCharge(state: GameState) {
  const n = state.neptune; if (!n?.refrainFullPending) return;
  n.refrainFullPending = false; n.healCharge = NEPTUNE_HEAL_CHARGE_MAX; playStrikeCharged();
}
export function cancelNeptuneRefrain(state: GameState) {
  const n = state.neptune; if (!n) return;
  setNonMusicAudioDuck(1);
  if(warningSound){warningSound.pause();warningSound.currentTime=0;}
  n.refrain = null; n.refrainPreview = false; n.rhythmOverlay = undefined; n.refrainTimer = NEPTUNE_REFRAIN.gap; releaseRefrainCharge(state);
}
export function refrainAnswerLeft(song:NeptuneRefrain){return Math.max(0,song.span+NEPTUNE_REFRAIN.answerGrace-(song.answerElapsed??song.tick));}
function healProgress(song:NeptuneRefrain){
  if(song.stage==='listen')return Math.min(1,song.tick/song.span)*.5;
  return .5+.5*Math.min(1,Math.max(song.tick/song.span,(song.answerElapsed??song.tick)/(song.span+NEPTUNE_REFRAIN.answerGrace)));
}
export function neptunePendingRefrainHeal(state: Readonly<GameState>) {
  const n = state.neptune, song = n?.refrain;
  if (!n || !song || song.practice) return 0;
  const boss = state.enemies.find(e => e.id === n.bossId && e.hp > 0); if (!boss) return 0;
  const hits = song.notes.filter(note => note.result === 'hit').length;
  const fraction = Math.min(1, Math.max(0, (song.notes.length - hits + song.extraMisses) / song.notes.length));
  return Math.min(Math.max(0, neptunePhaseCeilHP(n.phase) - boss.hp), song.healBudget * fraction * healProgress(song));
}
export function neptunePendingRefrainPreview(state: Readonly<GameState>) {
  const n = state.neptune, song = n?.refrain;
  if (!n || !song) return 0;
  const boss = state.enemies.find(e => e.id === n.bossId && e.hp > 0); if (!boss) return 0;
  const hits = song.notes.filter(note => note.result === 'hit').length;
  const fraction = Math.min(1, Math.max(0, (song.notes.length - hits + song.extraMisses) / song.notes.length));
  return Math.min(Math.max(0, neptunePhaseCeilHP(n.phase) - boss.hp), song.healBudget * fraction);
}
/** Red is a subset of the preview, never additional healing. */
export function neptunePendingMistakeHeal(state:Readonly<GameState>){
  const song=state.neptune?.refrain;if(!song)return 0;
  const mistakes=song.notes.filter(note=>note.result==='miss').length+song.extraMisses;
  return Math.min(neptunePendingRefrainHeal(state),song.healBudget*Math.min(1,mistakes/song.notes.length)*healProgress(song));
}
export function updateRefrainVisuals(state: GameState) {
  const n = state.neptune; if (!n || state.gamePhase !== 'playing') return;
  if (n.rhythmOverlay && --n.rhythmOverlay.ticks <= 0) n.rhythmOverlay = undefined;
  n.notePulses = (n.notePulses ?? []).filter(p => --p.ticks > 0);
  if (n.refrainResult && --n.refrainResult.ticks <= 0) n.refrainResult = undefined;
}
function pulse(state: GameState, x: number, y: number, pitch: number, good: boolean, boss = false) {
  const n = state.neptune!;
  (n.notePulses ??= []).push({ x, y, pitch, good, boss, ticks: 36 });
  if (n.notePulses.length > 12) n.notePulses.shift();
}

function playExampleNotes(state:GameState,song:NeptuneRefrain,boss?:Enemy){
  for(const note of song.notes)if(!note.played&&song.tick>=note.at){
    note.played=true;if(note.at===0)state.neptune!.rhythmOverlay={kind:'complete',ticks:180};playRefrainNote(note.pitch,'example',note.beats??1);
    pulse(state,boss?.x??state.playerX,boss?.y??state.playerY,note.pitch,true,true);
  }
}
function melodyMissFeedback(state:GameState){
  state.neptune!.rhythmOverlay={kind:'miss',ticks:30};
  state.screenShakeTicks=Math.max(state.screenShakeTicks,6);state.screenShakeAmt=Math.max(state.screenShakeAmt,1.5);
}
function missNote(state:GameState,note:RefrainNote,intensity=1){
  note.result='miss';melodyMissFeedback(state);playRefrainNote(note.pitch,'miss',1,intensity);
}
/** Surfaced combat and explicit God previews share the same fixed song clock. */
export function updateNeptuneRefrain(state: GameState, boss?: Enemy): number {
  const n=state.neptune;if(!n||state.gamePhase!=='playing'){setNonMusicAudioDuck(1);return 0;}
  if((!boss&&!n.refrainPreview)||(boss&&((n.dive&&!n.refrain?.practice)||boss.hp<=0))||(n.refrain&&!n.refrain.practice&&n.refrain.phase!==n.phase)){cancelNeptuneRefrain(state);return 0;}
  if(!n.refrain){
    setNonMusicAudioDuck(1);
    if(!n.refrainPreview&&(n.healCharge>=NEPTUNE_HEAL_CHARGE_MAX||n.laser))return 0;
    n.refrainTimer??=NEPTUNE_REFRAIN.first;if(--n.refrainTimer>NEPTUNE_REFRAIN.exampleLeadIn)return 0;
    const eligible=REFRAIN_PHRASES.map((phrase,index)=>({phrase,index})).filter(p=>p.phrase.phase<=n.phase&&p.index!==n.lastRefrain);
    const choice=n.lastRefrain===undefined?eligible[0]:eligible[Math.floor(Math.random()*eligible.length)],phrase=choice.phrase;n.lastRefrain=choice.index;
    n.refrain={stage:'listen',tick:0,span:NEPTUNE_REFRAIN.beats*NEPTUNE_REFRAIN.beat,
      notes:phrase.beats.map((beat,i)=>({at:beat*NEPTUNE_REFRAIN.beat,pitch:phrase.pitches[i],beats:phrase.lengths[i],result:'pending'})),
      extraMisses:0,healBudget:NEPTUNE_PHASE_HPS[n.phase]*NEPTUNE_REFRAIN.healShare,phase:n.phase,exampleLeadIn:NEPTUNE_REFRAIN.exampleLeadIn,practice:!boss};
    setNonMusicAudioDuck(.5);
    playSongWarning();
    prepareNeptuneMelodyAudio();prepareSongFinish();n.refrainResult=undefined;return 0;
  }
  const song=n.refrain;
  if(song.stage==='listen'){
    setNonMusicAudioDuck(.5);
    if((song.exampleLeadIn??0)>0){
      song.exampleLeadIn=(song.exampleLeadIn??0)-1;
      if(song.exampleLeadIn===0){playRefrainNote(1,'beat');playExampleNotes(state,song,boss);}
      return 0;
    }
    song.tick++;if(song.tick%NEPTUNE_REFRAIN.beat===0&&song.tick<song.span)playRefrainNote(song.tick%(NEPTUNE_REFRAIN.beat*4)===0?1:0,'beat');
    playExampleNotes(state,song,boss);
    if(song.tick>=song.span){song.stage='answer';song.tick=0;song.answerStarted=false;song.answerElapsed=0;setNonMusicAudioDuck(1);}
    return 0;
  }
  setNonMusicAudioDuck(1);
  song.answerElapsed=(song.answerElapsed??song.tick)+1;
  if(song.answerStarted){
    song.tick++;if(song.tick%NEPTUNE_REFRAIN.beat===0&&song.tick<song.span)playRefrainNote(song.tick%(NEPTUNE_REFRAIN.beat*4)===0?1:0,'beat');
    const expired=song.notes.filter(note=>note.result==='pending'&&song.tick>note.at+refrainWindow(song,note));
    for(const note of expired)missNote(state,note,1/Math.sqrt(expired.length));
  }
  const timeout=refrainAnswerLeft(song)<=0;
  if(!timeout&&(!song.answerStarted||song.tick<song.span))return 0;
  const remaining=song.notes.filter(note=>note.result==='pending');for(const note of remaining)missNote(state,note,1/Math.sqrt(remaining.length));
  const hits=song.notes.filter(note=>note.result==='hit').length,fraction=Math.min(1,Math.max(0,(song.notes.length-hits+song.extraMisses)/song.notes.length)),heal=song.healBudget*fraction;
  n.refrainResult={hits,total:song.notes.length,mistakes:song.notes.length-hits+song.extraMisses,heal,ticks:120};
  if(boss&&!song.practice){
    const recovery=NEPTUNE_REFRAIN.maxReplyHeal*(1-fraction);
    if(recovery>0){const scale=NEPTUNE_REFRAIN.replyChargeHeal/NEPTUNE_REFRAIN.maxReplyHeal;healPlayer(state,recovery,true,scale);healCore(state,recovery,scale);}
    if(fraction===0)damageEnemy(state,boss,NEPTUNE_PHASE_HPS[song.phase]*NEPTUNE_REFRAIN.perfectDamageShare,'special');
  }
  n.refrainTimer=Math.max(1,NEPTUNE_REFRAIN.cycle-(song.span+(song.answerElapsed??song.tick)));
  n.refrain=null;n.refrainPreview=false;setNonMusicAudioDuck(1);releaseRefrainCharge(state);n.rhythmOverlay={kind:fraction===0?'perfect':'complete',ticks:180};playSongFinish();return song.practice?0:heal;
}

/** Below full charge, every press plucks a note; the first answer press starts its bar. */
export function playOceanMelody(state:GameState):boolean{
  const n=state.neptune;if(!n||state.gamePhase!=='playing')return false;
  state.playerCastTicks = 24; state.playerCastKind = 'sea_chanter'; state.playerPrimalCast = true;
  const song=n.refrain;let pitch=(n.freeNote??0)%frequencies.length,good=true,beats=1;n.freeNote=(n.freeNote??0)+1;
  if(song?.stage==='answer'){
    if(!song.answerStarted){song.answerStarted=true;song.tick=0;playRefrainNote(1,'beat');}
    const closest=song.notes.filter(note=>note.result==='pending').sort((a,b)=>Math.abs(a.at-song.tick)-Math.abs(b.at-song.tick))[0];
    if(closest){pitch=closest.pitch;beats=closest.beats??1;}
    if(closest&&Math.abs(closest.at-song.tick)<=refrainWindow(song,closest))closest.result='hit';
    else{song.extraMisses++;good=false;(song.mistakeMarks??=[]).push(song.tick);if(song.mistakeMarks.length>64)song.mistakeMarks.shift();melodyMissFeedback(state);}
  }
  let hitFish=false;
  for(const target of state.enemies.slice()){
    if(target.hp<=0||Math.hypot(target.x-state.playerX,target.y-state.playerY)>NEPTUNE_MELODY_TAUNT_RADIUS*TILE_SIZE)continue;
    hitFish=hitNeptuneMelodyTarget(state,target)||hitFish;
  }
  const intensity=song?.stage==='listen'?.1:1;
  playRefrainNote(pitch,good?'note':'miss',beats,intensity);
  if(hitFish&&good)playRefrainNote(pitch,'miss',beats,intensity);
  openNeptuneClamsInRange(state,state.playerX,state.playerY,NEPTUNE_MELODY_TAUNT_RADIUS*TILE_SIZE,pitch);
  pulse(state,state.playerX,state.playerY,pitch,good);return true;
}
