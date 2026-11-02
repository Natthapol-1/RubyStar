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
