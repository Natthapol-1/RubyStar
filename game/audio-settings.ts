import {getProfile,isDesktop} from './profile';
export type AudioChannel='music'|'attack'|'effects';
export function channelVolume(channel:AudioChannel){return Math.max(0,Math.min(1,Number(getProfile().settings[channel])||0));}
const active=new Set<()=>boolean>();let listening=false;
// Per-instance volume preserves each original mix while routing clips to a player preference.
export function gameAudio(src:string,channel:AudioChannel=/(?:celestial\/|laser|chargeWave|bombExplode|slash|soundWaveAttack|bossQueenAttack|kingFireSpell|thornCast|poisoned|jupiter-fence|reaper-boost|snowball-hit)/i.test(src)?'attack':'effects'):HTMLAudioElement {
 const sound=new Audio(src);if(typeof HTMLMediaElement==='undefined')return sound;
 let base=1;const descriptor=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'volume')!;
 const apply=()=>{descriptor.set!.call(sound,base*channelVolume(channel));return !sound.ended;};
 Object.defineProperty(sound,'volume',{get:()=>base,set:(value:number)=>{base=value;apply();}});
 const track=()=>{active.add(apply);apply();};sound.addEventListener('play',track);sound.addEventListener('ended',()=>active.delete(apply));sound.addEventListener('pause',()=>active.delete(apply));
 if(!listening){listening=true;window.addEventListener('ruby-audio',()=>{for(const refresh of active)if(!refresh())active.delete(refresh);});}
 apply();return sound;
}

let audioContext: AudioContext | null = null;
// Reversed clips: decoded once through Web Audio, flipped in memory and cached, so no reversed file is shipped.
const reversed = new Map<string, Promise<AudioBuffer | null>>();
export function preloadReversed(src: string) {
 const ctx = getAudioCtx(); if (!ctx) return null;
 let buffer = reversed.get(src);
 if (!buffer) {
  buffer = fetch(src).then(r => r.arrayBuffer()).then(data => ctx.decodeAudioData(data)).then(decoded => {
   for (let c = 0; c < decoded.numberOfChannels; c++) decoded.getChannelData(c).reverse();
   return decoded;
  }).catch(() => null);
  reversed.set(src, buffer);
 }
 return buffer;
}
/** Plays a clip backwards on a player channel; playbackRate also raises the pitch. */
export function playReversed(src: string, volume: number, playbackRate = 1, channel: AudioChannel = 'effects') {
 const ctx = getAudioCtx(); const buffer = preloadReversed(src); if (!ctx || !buffer) return;
 void buffer.then(decoded => {
  if (!decoded) return;
  const source = ctx.createBufferSource(), gain = ctx.createGain();
  source.buffer = decoded; source.playbackRate.value = playbackRate; gain.gain.value = volume * channelVolume(channel);
  source.connect(gain).connect(ctx.destination); source.start();
 });
}
export function getAudioCtx(): AudioContext | null {
 if (typeof window === 'undefined') return null;
 const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
 if (!Context) return null;
 audioContext ??= new Context();
 if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
 return audioContext;
}
