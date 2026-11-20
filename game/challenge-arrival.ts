import { drawPlanetSurface } from './planet-surface';
import { createArrivalScenery } from './RubyStarGame';
import { CELESTIAL_BLESSINGS } from './endless-builds';
import { GEM_CUTS, gemMaterial } from './gemstone-cuts';
import { drawSunArrivalFrame, SUN_ARRIVAL_DURATION } from './sun-arrival';
import { W, H, CRUISE_CHARGE_SOUND, type Ctx, type CutsceneFrame, block, caption, cueArrivalApproach, discBands, ease, hash, nebula, ship, span, stars } from './cutscene-art';
import { type Trial, type TrialBody, trialBossName } from './trials';

const BOOST = .12, APPROACH = 4.1, LANDED = 7.1, REVEAL = 7.4;
const DURATION = 11.8;
const NEPTUNE_SONG_AT = 8.35;
// The longer singing take runs for 10.06 seconds, then the scene fades out.
const NEPTUNE_FADE_AT = 18.55;
const worlds = {
  venus: { site: 'FALLEN CITADEL', rim: '#efcfa5', shade: '#997061', accent: '#fff0cd' },
  gaia: { site: 'OVERGROWN SANCTUARY', rim: '#4a9cd4', shade: '#22466c', accent: '#9bca68' },
  moon: { site: 'CRYSTAL CAVERN', rim: '#b99be5', shade: '#483269', accent: '#e9d6ff' },
  jupiter: { site: 'STORM BELT', rim: '#df9b65', shade: '#875331', accent: '#ffe4ac' },
  saturn: { site: 'FROZEN RINGS', rim: '#85dbd3', shade: '#387b82', accent: '#dffcff' },
  neptune: { site: 'DEEP REEF', rim: '#4789e8', shade: '#163976', accent: '#91d8fa' },
  sirius: { site: 'BLIND SANCTUARY', rim: '#ffe27c', shade: '#af7626', accent: '#fff7c6' },
  binary: { site: 'TWIN ORBIT', rim: '#ff927b', shade: '#83cfff', accent: '#e5f2ff' },
  singularity: { site: "DEVOURER'S MAW", rim: '#9e91be', shade: '#232035', accent: '#d9cdef' },
} satisfies Record<Exclude<TrialBody, 'sun'>, {site: string; rim: string; shade: string; accent: string}>;
type Destination = keyof typeof worlds;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const guardianSounds: Record<Destination, readonly (readonly [file: string, volume: number, offset?: number])[]> = {
  venus: [['aegis-attack.mp3', .7]],
  gaia: [['thornCast.wav', .7]],
  moon: [['ghostHunt2.mp3', .5]],
  jupiter: [['jupiter-reaper-boost.mp3', .65]],
  saturn: [['ice.mp3', .7]],
  neptune: [['seaSinging4.mp3', .6]],
  sirius: [['holy2.mp3', .8]],
  binary: [['celestial/jupiter-storm.wav', .65], ['dusk-attack.mp3', .65, .25]],
  singularity: [['reverse.mp3', .7], ['grow.wav', .5]],
};

function destination(ctx: Ctx, id: Destination, x: number, y: number, r: number, t: number) {
  const { rim, shade, accent } = worlds[id];
  ctx.save(); ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, r * .3, 0, 0, r * 1.65);
  glow.addColorStop(0, rim + '66'); glow.addColorStop(1, rim + '00');
  ctx.fillStyle = glow; ctx.fillRect(-2*r,-2*r,4*r,4*r);

  if (id === 'sirius' || id === 'binary') {
    const star = (x0: number, y0: number, s: number, color: string) => {
      ctx.shadowColor = color; ctx.shadowBlur = 18;
      block(ctx, x0-s, y0-s*.08, 2*s, s*.16, color);
      block(ctx, x0-s*.08, y0-s, s*.16, 2*s, color);
      block(ctx, x0-s*.33, y0-s*.33, s*.66, s*.66, color);
      block(ctx, x0-s*.17, y0-s*.17, s*.34, s*.34, accent);
      ctx.shadowBlur = 0;
    };
    if (id === 'binary') {
      const orbit = Math.sin(t * 1.8) * r * .2;
      star(-r*.54, orbit, r*.66, rim); star(r*.54, -orbit, r*.54, shade);
    } else {
      star(0, 0, r, rim); star(r*.82, -r*.48, r*.2, '#e8ecff');
    }
  } else if (id === 'singularity') {
    ctx.save(); ctx.rotate(-.22);
    ctx.shadowColor = rim; ctx.shadowBlur = 22;
    block(ctx, -r*1.45, -r*.075, r*2.9, r*.15, rim);
    ctx.restore();
    discBands(ctx, r*.67, 15);
    ctx.fillStyle = '#020207'; ctx.fill();
    ctx.strokeStyle = rim; ctx.lineWidth = 1.5; ctx.stroke();
    for (let i = 0; i < 18; i++) {
      const angle = i * 2.4 + t * .6, distance = r * (1.4 - ((hash(i, 8) + t*.2) % 1)*.75);
      block(ctx, Math.cos(angle)*distance, Math.sin(angle)*distance*.56, 3+i%4, 2+i%3, i%3 ? shade : accent);
    }
  } else {
    const ring = (front: boolean) => {
      ctx.save(); ctx.rotate(-.23);
      ctx.beginPath(); ctx.rect(-2*r, front ? 0 : -r, 4*r, r); ctx.clip();
      const points = Array.from({ length: 25 }, (_, i) => {
        const angle = i * Math.PI * 2 / 24;
        return [Math.cos(angle), Math.sin(angle)] as const;
      });
      for (const [size, width, color] of [
        [1.66, .044, front ? '#b3ddd4' : '#406e70'],
        [1.54, .078, front ? '#e1f7e3' : '#699f99'],
        [1.43, .038, front ? '#80c3bb' : '#375c67'],
      ] as const) {
        ctx.beginPath();
        points.forEach(([x, y], i) => {
          const px = x * r * size, py = y * r * size * .255;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.lineWidth = r * width; ctx.strokeStyle = color; ctx.stroke();
      }
      ctx.restore();
    };
    if (id === 'saturn') ring(false);
    ctx.save();
    discBands(ctx, r, 19);
    ctx.clip();
    drawPlanetSurface(ctx, id, r, t, rim, shade, accent);
    ctx.restore();
    if (id === 'saturn') ring(true);
  }
  ctx.restore();
}

function drawGem(ctx: Ctx, trial: Trial, t: number) {
  const gem = CELESTIAL_BLESSINGS[trial.boss], [outer, inner] = GEM_CUTS[gem.cut];
  const material = gemMaterial(trial.boss, gem.color);
  const scale = trial.id === 'singularity' ? 1.45 : 1.2;
  ctx.save(); ctx.translate(640, 187 + Math.sin(t*3)*4); ctx.scale(scale, scale); ctx.translate(-40,-34);
  ctx.shadowColor = material.rim; ctx.shadowBlur = 15;
  ctx.fillStyle = material.rim; ctx.fill(new Path2D(outer)); ctx.shadowBlur = 0;
  const table = new Path2D(inner);
  ctx.fillStyle = material.shade; ctx.fill(table);
  ctx.translate(40,34); ctx.scale(.62,.65); ctx.translate(-40,-34);
  ctx.fillStyle = material.light; ctx.fill(table);
  ctx.restore();
}

export function challengeArrival(trial: Trial): { label: string; duration: number; drawFrame: CutsceneFrame } {
  const label = 'Arrival at ' + trial.name;
  const id = trial.id;
  if (id === 'sun') return { label: 'Arrival at the Sun', duration: SUN_ARRIVAL_DURATION, drawFrame: drawSunArrivalFrame };
  const world = worlds[id], gem = CELESTIAL_BLESSINGS[trial.boss];
  const guardianCueAt = id === 'neptune' ? NEPTUNE_SONG_AT : 9.15;
  const fadeAt = id === 'neptune' ? NEPTUNE_FADE_AT : 11.1;
  const duration = id === 'neptune' ? NEPTUNE_FADE_AT + .7 : DURATION;
  let scenery: ReturnType<typeof createArrivalScenery> | undefined;
  const drawFrame: CutsceneFrame = (ctx, t, cue) => {
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,H); ctx.clip();
    const tick = Math.floor(t*60);
    if (t < APPROACH) {
      const p = span(t, BOOST, APPROACH), close = p ** 1.65;
      block(ctx,0,0,W,H,'#070617');
      nebula(ctx,t*45,0); stars(ctx,t*270,0,t,.5+p*.65);
      destination(ctx,id,lerp(982,914,close),325,lerp(42,208,close),t);
      ship(ctx,185+p*390,412-p*53+Math.sin(t*4)*6,t,1.2*ease(span(t,BOOST,BOOST+.3)),-.08,1.45);
      caption(ctx,'COURSE SET FOR '+trial.name,568,ease(span(t,.55,1.2))*(1-span(t,3.35,4)),16,world.accent);
      cue('burn', BOOST, t, '/sounds/speedBoost.mp3', .45);
      cue('cruise', .5, t, CRUISE_CHARGE_SOUND, 1);
    } else {
      scenery ??= createArrivalScenery(id, trial.boss);
      if (t < REVEAL) {
        const p = ease(span(t,APPROACH,LANDED));
        const x = lerp(930,680,p), y = lerp(368,389,p);
        scenery.backdrop(ctx,W,H,tick,260*(1-p));
        ctx.save(); ctx.translate(x,y); ctx.scale(.28+.12*p,.28+.12*p); ctx.translate(-W/2,-H/2);
        scenery.court(ctx,W,H,tick); ctx.restore();
        ship(ctx,x-620*(1-p),y-150*(1-p),t,1-ease(span(t,5.85,LANDED)),.2*(1-p),lerp(1.6,.85,p));
        caption(ctx,world.site,565,ease(span(t,4.65,5.15))*(1-span(t,6.8,7.35)),22,world.accent);
        cueArrivalApproach(cue, t, APPROACH, id === 'moon' ? undefined : LANDED - .05);
      } else {
        const step = ease(span(t,7.7,9.45)), advance = ease(span(t,9.2,10.5));
        const zoom = 1 + .065 * ease(span(t,REVEAL,11.6));
        scenery.backdrop(ctx,W,H,tick,0);
        ctx.save(); ctx.translate(W/2,H/2); ctx.scale(zoom,zoom); ctx.translate(-W/2,-H/2);
        scenery.court(ctx,W,H,tick);
        block(ctx,572,158,136,68,'#100e1b');
        block(ctx,578,164,124,54,world.shade+'80');
        block(ctx,589,218,102,4,world.accent);
        drawGem(ctx,trial,t);
        scenery.guardians(ctx,tick,advance);
        ship(ctx,492,483,t,0,0,1.08);
        const px = lerp(518,640,step), py = lerp(484,454,step);
        block(ctx,px-18,py-18,36,36,'#d8d870');
        block(ctx,px-14,py-14,28,28,'#a0a040');
        block(ctx,px-10,py-12,20,10,'#44ccff');
        block(ctx,px-8,py-11,8,3,'#c7f2ff');
        ctx.restore();
        caption(ctx,trialBossName(trial),588,ease(span(t,8.65,9.35)),22,world.accent);
        caption(ctx,(id==='binary'?'GUARDIANS':'GUARDIAN')+' OF THE '+gem.name.toUpperCase(),620,ease(span(t,9,9.65)),13,'#e8e6ff');
        guardianSounds[id].forEach(([file, volume, offset = 0], i) => {
          cue('guardian-' + i, guardianCueAt + offset, t, '/sounds/' + file, volume);
        });
      }
    }
    block(ctx,0,0,W,70,'#000'); block(ctx,0,H-70,W,70,'#000');
    ctx.globalAlpha = Math.max(1-ease(span(t,0,.28)),1-ease(Math.abs(t-APPROACH)/.3),1-ease(Math.abs(t-REVEAL)/.3),ease(span(t,fadeAt,duration)));
    block(ctx,0,0,W,H,'#000'); ctx.restore();
    return 0;
  };
  return { label, duration, drawFrame };
}
