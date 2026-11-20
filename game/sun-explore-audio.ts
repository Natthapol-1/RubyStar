import { channelVolume, getAudioCtx } from './audio-settings';
import { STRUCTURES, WORLD_SCALE, type AREAS, type Point } from './sun-explore-map';

type Footing = typeof AREAS[number]['surface'] | 'catwalk';
const footTone: Record<Footing, readonly [number, number, number]> = {
  forge: [760, 145, .23], reservoir: [1050, 178, .22], bridge: [625, 135, .21],
  ward: [560, 119, .22], ash: [370, 106, .27], catwalk: [1500, 236, .24],
};
const tanks = STRUCTURES.filter(prop => prop.kind === 'tank');
const vents = STRUCTURES.filter(prop => prop.kind === 'stack' || prop.kind === 'exchanger');
const furnaces = STRUCTURES.filter(prop => prop.kind === 'forge');

function audibility(emitters: typeof STRUCTURES, player: Point, radius: number) {
  const x = player.x / WORLD_SCALE, y = player.y / WORLD_SCALE;
  let gain = 0;
  for (const prop of emitters) {
    const dx = Math.max(prop.x - x, x - prop.x - prop.w, 0);
    const dy = Math.max(prop.y - y, y - prop.y - prop.h, 0);
    gain = Math.max(gain, Math.max(0, 1 - Math.hypot(dx, dy) / radius) ** 2);
  }
  return gain;
}

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();

function noiseBuffer(ctx: AudioContext) {
  let buffer = noiseBuffers.get(ctx);
  if (buffer) return buffer;
  buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  noiseBuffers.set(ctx, buffer);
  return buffer;
}

function sunFootstep(ctx: AudioContext, output: AudioNode, surface: Footing, alternate: boolean) {
  if (channelVolume('effects') === 0) return;
  const start = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  const [frequency, impact, level] = footTone[surface];
  const variation = alternate ? .88 : 1;
  filter.frequency.value = frequency * variation;
  filter.Q.value = surface === 'catwalk' ? 1.9 : .72;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + .006);
  gain.gain.exponentialRampToValueAtTime(.0001, start + .095);
  source.connect(filter).connect(gain).connect(output);
  source.start(start, alternate ? .6 : .18, .1);

  const heel = ctx.createOscillator();
  heel.type = surface === 'catwalk' ? 'triangle' : 'sine';
  heel.frequency.setValueAtTime(impact * variation, start);
  heel.frequency.exponentialRampToValueAtTime(impact * .58, start + .065);
  const heelGain = ctx.createGain();
  heelGain.gain.setValueAtTime(.0001, start);
  heelGain.gain.exponentialRampToValueAtTime(.085, start + .009);
  heelGain.gain.exponentialRampToValueAtTime(.0001, start + .075);
  heel.connect(heelGain).connect(output);
  heel.start(start);
  heel.stop(start + .08);
}

export function startSunExploreAudio() {
  const ctx = getAudioCtx();
  if (!ctx) return null;
  const output = ctx.createGain();
  output.connect(ctx.destination);
  const refreshVolume = () => output.gain.setTargetAtTime(channelVolume('effects'), ctx.currentTime, .07);
  refreshVolume();
  window.addEventListener('ruby-audio', refreshVolume);

  const motor = ctx.createOscillator();
  motor.type = 'triangle';
  motor.frequency.value = 52;
  const motorGain = ctx.createGain();
  motorGain.gain.value = 0;
  motor.connect(motorGain).connect(output);
  motor.start();

  const ambience = (frequency: number, q: number, offset: number) => {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(output);
    source.start(0, offset);
    return { source, gain };
  };
  const steam = ambience(1850, .6, 0);
  const coolant = ambience(510, 1.15, .7);

  let step = false;
  return {
    step(surface: Footing) {
      step = !step;
      sunFootstep(ctx, output, surface, step);
    },
    update(player: Point, cooling: boolean, visible: boolean) {
      const time = ctx.currentTime;
      const forge = visible ? audibility(furnaces, player, 230) : 0;
      const hiss = visible ? audibility(vents, player, 135) : 0;
      const water = visible ? audibility(tanks, player, 175) : 0;
      motorGain.gain.setTargetAtTime(forge * (cooling ? .005 : .059), time, .22);
      steam.gain.gain.setTargetAtTime(hiss * (cooling ? .022 : .15) * (.84 + Math.sin(time * 2) * .16), time, .18);
      coolant.gain.gain.setTargetAtTime(water * (.13 + Math.sin(time * 3) * .025), time, .22);
    },
    stop() {
      window.removeEventListener('ruby-audio', refreshVolume);
      motor.stop();
      steam.source.stop();
      coolant.source.stop();
      output.disconnect();
    },
  };
}
