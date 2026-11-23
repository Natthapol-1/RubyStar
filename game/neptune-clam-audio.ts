import { gameAudio, getAudioCtx, channelVolume } from './audio-settings';

const file='/sounds/neptune-corrupted-wave.mp3';
let loading:Promise<AudioBuffer|null>|undefined,lastPlay=-Infinity;
const voices=new Set<AudioBufferSourceNode>();
export function prepareCorruptedClamAudio(){
  const ctx=getAudioCtx();if(!ctx)return Promise.resolve(null);
  return loading??=fetch(file).then(response=>{if(!response.ok)throw Error('corrupted clam sound');return response.arrayBuffer();}).then(data=>ctx.decodeAudioData(data)).catch(()=>{loading=undefined;return null;});
}
export function playCorruptedClamAudio(){
  const ctx=getAudioCtx();
  if(!ctx){try{const sound=gameAudio(file,'effects');sound.volume=.65;void sound.play().catch(()=>{});}catch{}return;}
  // Several clams opened by one wave share a single impact instead of multiplying its volume.
  if(ctx.currentTime-lastPlay<.06)return;lastPlay=ctx.currentTime;
  void prepareCorruptedClamAudio().then(buffer=>{
    if(!buffer)return;
    try{
      while(voices.size>=2){const oldest=voices.values().next().value!;oldest.stop();voices.delete(oldest);}
      const source=ctx.createBufferSource(),high=ctx.createBiquadFilter(),low=ctx.createBiquadFilter(),distort=ctx.createWaveShaper(),gain=ctx.createGain();
      const nodes:AudioNode[]=[source,high,low,distort,gain];source.buffer=buffer;source.playbackRate.value=.96;source.detune.value=-30;
      high.type='highpass';high.frequency.value=90;low.type='lowpass';low.frequency.value=7200;
      const curve=new Float32Array(1024);for(let i=0;i<curve.length;i++)curve[i]=Math.tanh((i*2/(curve.length-1)-1)*4)*.5;
      distort.curve=curve;distort.oversample='2x';gain.gain.value=.65*channelVolume('effects');
      source.connect(high).connect(low).connect(distort).connect(gain).connect(ctx.destination);
      for(const [time,level,pan] of [[.11,.18,-.45],[.23,.08,.45]]){
        const delay=ctx.createDelay(.5),echo=ctx.createGain(),stereo=ctx.createStereoPanner();delay.delayTime.value=time;echo.gain.value=level;stereo.pan.value=pan;
        gain.connect(delay).connect(echo).connect(stereo).connect(ctx.destination);nodes.push(delay,echo,stereo);
      }
      voices.add(source);source.onended=()=>{voices.delete(source);setTimeout(()=>{for(const node of nodes)node.disconnect();},300);};source.start();
    }catch{}
  });
}
