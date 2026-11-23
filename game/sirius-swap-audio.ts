import { channelVolume, gameAudio, getAudioCtx } from './audio-settings';

const file='/sounds/sirius-swap-bell.mp3';
let loading:Promise<AudioBuffer|null>|undefined;
export function prepareSiriusSwapBell(){
  const ctx=getAudioCtx();if(!ctx)return Promise.resolve(null);
  return loading??=fetch(file).then(response=>{if(!response.ok)throw Error('Sirius bell');return response.arrayBuffer();}).then(data=>ctx.decodeAudioData(data)).then(buffer=>{
    let peak=0;for(let c=0;c<buffer.numberOfChannels;c++)for(const sample of buffer.getChannelData(c))peak=Math.max(peak,Math.abs(sample));
    if(peak>0)for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<data.length;i++)data[i]*=.6/peak;}
    return buffer;
  }).catch(()=>{loading=undefined;return null;});
}

/** A clear toll with softer, darker cathedral reflections; scheduled only on the warning transition. */
export function playSiriusSwapBell(){
  const ctx=getAudioCtx();if(!ctx){try{const bell=gameAudio(file,'effects');bell.volume=1;void bell.play().catch(()=>{});}catch{}return;}
  void prepareSiriusSwapBell().then(buffer=>{
    if(!buffer)return;
    const source=ctx.createBufferSource(),gain=ctx.createGain(),limit=ctx.createDynamicsCompressor(),nodes:AudioNode[]=[source,gain,limit];
    limit.threshold.value=-3;limit.knee.value=4;limit.ratio.value=12;limit.attack.value=.001;limit.release.value=.22;
    source.buffer=buffer;gain.gain.value=1.9*channelVolume('effects');source.connect(gain).connect(limit).connect(ctx.destination);
    for(const [time,level,pan] of [[.28,.35,-.4],[.56,.17,.4],[.84,.08,0]]){
      const delay=ctx.createDelay(1),echo=ctx.createGain(),filter=ctx.createBiquadFilter(),stereo=ctx.createStereoPanner();
      delay.delayTime.value=time;echo.gain.value=level;filter.type='lowpass';filter.frequency.value=2800-time*1500;stereo.pan.value=pan;
      gain.connect(delay).connect(filter).connect(echo).connect(stereo).connect(limit);nodes.push(delay,echo,filter,stereo);
    }
    source.onended=()=>{setTimeout(()=>{for(const node of nodes)node.disconnect();},1000);};source.start();
  });
}
