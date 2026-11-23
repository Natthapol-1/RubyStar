'use client';
import { bindingLabel } from './controls';
import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawGuidePlayer } from './guide-art';
import { drawMagnet, drawBinaryUnit, drawChargeTile } from './binary-art';
import type { Enemy } from './engine';
import { BINARY_TWIN_COLORS, POLE_COLORS } from './binary';

// Binary Star rule sheet: only what is new on this map, one small animated picture and one or two lines per card.
const cards = {
  lives: ['THREE LIVES', 'Defeat both twins three times. A fallen twin revives if the other lasts too long.'],
  rooms: ['OPPOSITE ROOMS', 'The twins jump to opposite chambers now and then.'],
  pole: ['PRIMAL SKILL', 'Pole Shift: swaps your pole. Matching poles push the twins away; opposites pull them in.'],
  collision: ['BINARY COLLISION', 'Slamming the twins together hurts and stuns both. Apart, they take less damage.'],
  dawn: ['DAWN', 'North. Fights up close and dashes along a marked lane.'],
  dusk: ['DUSK', 'South. Shoots from afar and drops stunning stars around you.'],
  beam: ['TWIN BEAM', 'In the same room, the twins fire a beam between them.'],
  magnets: ['MAGNETS', 'Magnets push you away or pull you in.'],
  lodestone: ['LODESTONE', 'Pushes or pulls you and lunges at you. Bursts when it hits a twin.'],
  pulsar: ['PULSAR', 'When it dies, its field pulls or pushes you, then explodes.'],
  grounder: ['GROUNDER', 'Twins near it can’t be pushed or pulled.'],
  reversal: ['POLE REVERSAL', 'Each twin sometimes switches its pole.'],
  charge: ['CHARGING TILE', 'A hurt twin heals while standing on it.'],
} as const;
type CardKey = keyof typeof cards;

const SECTIONS: { title: string; keys: CardKey[]; skill?: boolean }[] = [
  { title: 'GENERAL RULES & SKILLS', keys: ['lives', 'rooms', 'pole', 'collision'], skill: true },
  { title: 'ENEMIES', keys: ['dawn', 'dusk', 'beam', 'lodestone', 'pulsar'] },
  { title: 'PHASE 2+', keys: ['magnets', 'grounder'] },
  { title: 'PHASE 3', keys: ['reversal', 'charge'] },
];

type TwinPainter = (ctx: CanvasRenderingContext2D, x: number, y: number, index: 0 | 1, tick: number) => void;

export default function BinaryGuide({ drawTwin, drawCelestial }: { drawTwin: TwinPainter; drawCelestial: CelestialGuidePainter }) {
  const refs = useRef<Partial<Record<CardKey, HTMLCanvasElement | null>>>({});
  useEffect(() => {
    let raf = 0, tick = 0;
    const paint: Record<CardKey, (ctx: CanvasRenderingContext2D) => void> = {
      lives: ctx => {
        drawTwin(ctx, 62, 60, 0, tick); drawTwin(ctx, 138, 60, 1, tick);
        for (let k = 0; k < 3; k++) { ctx.fillStyle = k < 3 - Math.floor(tick / 90) % 3 ? '#ffffff' : '#3a3550'; ctx.fillRect(82 + k * 14, 100, 10, 6); }
      },
      rooms: ctx => { // the pair alternates between the two diagonals, always facing each other across the station
        ctx.strokeStyle = '#3d3a5a'; ctx.lineWidth = 2;
        for (let k = 0; k < 4; k++) ctx.strokeRect(20 + (k % 2) * 84, 10 + Math.floor(k / 2) * 52, 76, 46);
        const flip = Math.floor(tick / 120) % 2, spots = flip ? [[142, 33], [58, 88]] : [[58, 33], [142, 88]];
        spots.forEach(([x, y], k) => {
          drawTwin(ctx, x, y, k as 0 | 1, tick);
          if (tick % 120 > 90) { ctx.strokeStyle = BINARY_TWIN_COLORS[k]; ctx.globalAlpha = .5 + .5 * Math.abs(Math.sin(tick * .4)); ctx.strokeRect(x - 20, y - 20, 40, 40); ctx.globalAlpha = 1; }
        });
      },
      pole: ctx => { // your pole flips: Dawn (north) is pushed away while you are north, pulled in while you are south
        const north = Math.floor(tick / 120) % 2 === 0, t = (tick % 120) / 120;
        drawGuidePlayer(ctx, 50, 60);
        ctx.strokeStyle = POLE_COLORS[north ? 'north' : 'south']; ctx.lineWidth = 3; ctx.strokeRect(30, 40, 40, 40);
        drawTwin(ctx, north ? 110 + t * 40 : 150 - t * 40, 60, 0, tick);
      },
      collision: ctx => { // Dawn is shoved into Dusk: they crash and flash white
        const t = (tick % 140) / 140, hit = t > .45, ax = hit ? 92 : 50 + t / .45 * 42;
        drawTwin(ctx, ax, 62, 0, tick); drawTwin(ctx, 112, 62, 1, tick);
        if (hit && t < .7) { ctx.globalAlpha = 1 - (t - .45) / .25; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; const r = 20 + (t - .45) * 160; ctx.strokeRect(102 - r, 62 - r, r * 2, r * 2); ctx.globalAlpha = 1; }
        if (hit) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.globalAlpha = .5 + .4 * Math.abs(Math.sin(tick * .2)); ctx.strokeRect(ax - 22, 40, 44, 44); ctx.strokeRect(90, 40, 44, 44); ctx.globalAlpha = 1; }
      },
      dawn: ctx => drawTwin(ctx, 100, 62, 0, tick),
      dusk: ctx => drawTwin(ctx, 100, 62, 1, tick),
      beam: ctx => { // the link charges, then fires between them
        const t = (tick % 120) / 120;
        drawTwin(ctx, 45, 60, 0, tick); drawTwin(ctx, 155, 60, 1, tick);
        ctx.save();
        if (t < .7) { ctx.globalAlpha = .4 + .6 * t / .7; ctx.lineWidth = 2 + t * 5; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -tick * 2; ctx.strokeStyle = BINARY_TWIN_COLORS[0]; ctx.beginPath(); ctx.moveTo(65, 60); ctx.lineTo(100, 60); ctx.stroke(); ctx.strokeStyle = BINARY_TWIN_COLORS[1]; ctx.beginPath(); ctx.moveTo(100, 60); ctx.lineTo(135, 60); ctx.stroke(); }
        else { const f = 1 - (t - .7) / .3; for (const [w, col, a] of [[22, BINARY_TWIN_COLORS[0], .35], [13, BINARY_TWIN_COLORS[1], .7], [5, '#ffffff', 1]] as const) { ctx.globalAlpha = a * f; ctx.fillStyle = col; ctx.fillRect(65, 60 - w / 2, 70, w); } }
        ctx.restore();
      },
      magnets: ctx => {
        const pull = Math.floor(tick / 120) % 2 === 1, t = (tick % 120) / 120;
        drawMagnet(ctx, 60, 60, 'north', tick, .8);
        const x = pull ? 150 - t * 60 : 90 + t * 60;
        drawGuidePlayer(ctx, x, 60);
        ctx.strokeStyle = POLE_COLORS[pull ? 'south' : 'north']; ctx.lineWidth = 3; ctx.strokeRect(x - 16, 44, 32, 32);
      },
      lodestone: ctx => { // a Lodestone is driven into Dawn and bursts on her
        const t = (tick % 150) / 150, hit = t > .5;
        drawTwin(ctx, 145, 62, 0, tick);
        if (!hit) drawBinaryUnit(ctx, { type: 'lodestone', pole: 'south', id: 1, hp: 10, maxHp: 10, flashTicks: 0 } as Enemy, 50 + t / .5 * 70, 66, tick);
        else if (t < .75) { const p = (t - .5) / .25, r = 10 + p * 30; ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(128 - r, 62 - r, r * 2, r * 2); ctx.globalAlpha = 1; }
      },
      pulsar: ctx => { // it falls; its field drags you in, then explodes
        const t = (tick % 180) / 180, pole = 'south' as const, col = POLE_COLORS[pole];
        if (t < .25) drawBinaryUnit(ctx, { type: 'pulsar', pole, id: 1, hp: 12, maxHp: 12, flashTicks: 0 } as Enemy, 70, 60, tick);
        else if (t < .8) { const p = (t - .25) / .55; ctx.globalAlpha = .15 + .2 * p; ctx.fillStyle = col; ctx.fillRect(25, 15, 90, 90); ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(25, 15, 90, 90); ctx.fillStyle = col; ctx.fillRect(64, 54, 12, 12); }
        else { const p = (t - .8) / .2, r = 10 + p * 45; ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#ff6a6a'; ctx.lineWidth = 6; ctx.strokeRect(70 - r, 60 - r, r * 2, r * 2); ctx.globalAlpha = 1; }
        drawGuidePlayer(ctx, t < .25 ? 150 : t < .8 ? 150 - (t - .25) / .55 * 50 : 100, 60);
      },
      grounder: ctx => { // a Grounder pins Dawn in a grey square
        ctx.globalAlpha = .1; ctx.fillStyle = '#9aa3b5'; ctx.fillRect(40, 10, 120, 100); ctx.globalAlpha = .6; ctx.strokeStyle = '#9aa3b5'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.strokeRect(40, 10, 120, 100); ctx.setLineDash([]); ctx.globalAlpha = 1;
        drawBinaryUnit(ctx, { type: 'grounder', id: 1, hp: 30, maxHp: 30, flashTicks: 0 } as Enemy, 75, 60, tick);
        drawTwin(ctx, 130, 60, 0, tick); ctx.strokeStyle = '#9aa3b5'; ctx.lineWidth = 3; ctx.strokeRect(108, 38, 44, 44);
      },
      reversal: ctx => { // Dawn's aura blinks between both colours, then turns blue
        const t = (tick % 200) / 200, flipped = t > .5, warning = t > .35 && t <= .5;
        const col = warning && Math.floor(tick / 6) % 2 ? BINARY_TWIN_COLORS[1] : flipped ? BINARY_TWIN_COLORS[1] : BINARY_TWIN_COLORS[0];
        ctx.globalAlpha = .2; ctx.fillStyle = col; ctx.fillRect(66, 26, 68, 68); ctx.globalAlpha = .8; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(66, 26, 68, 68); ctx.globalAlpha = 1;
        drawTwin(ctx, 100, 60, 0, tick); // the body keeps its own colour; only the aura shows the new pole
      },
      charge: ctx => { // an 8s loop: Dusk walks onto the tile and heals, then your matching pole pushes her off
        const t = (tick % 480) / 480, cx = 100, cy = 74, tileX = cx - 24, tileY = cy - 24;
        const charging = t >= .25 && t < .65, pushT = Math.max(0, Math.min(1, (t - .65) / .08));
        const twinX = t < .25 ? 22 + t / .25 * (cx - 22) : cx - pushT * 60;
        drawChargeTile(ctx, tileX, tileY, tick, charging);
        drawTwin(ctx, twinX, cy, 1, tick);
        // her HP bar refills while she charges
        const hp = t < .25 ? .55 : t < .65 ? .55 + (t - .25) / .4 * .35 : .9;
        ctx.fillStyle = '#3a0f14'; ctx.fillRect(twinX - 20, cy - 34, 40, 5); ctx.fillStyle = '#66d17a'; ctx.fillRect(twinX - 20, cy - 34, 40 * hp, 5);
        if (t >= .58) { drawGuidePlayer(ctx, 168, cy); ctx.strokeStyle = POLE_COLORS.south; ctx.lineWidth = 3; ctx.strokeRect(168 - 18, cy - 18, 36, 36); } // you, south like Dusk: a push
      },
    };
    const frame = () => {
      tick++;
      (Object.keys(paint) as CardKey[]).forEach(key => {
        const ctx = refs.current[key]?.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, 200, 120); ctx.fillStyle = '#16142a'; ctx.fillRect(0, 0, 200, 120);
        paint[key](ctx);
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [drawTwin]);
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>BINARY STAR CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Push and pull the twins with your magnetic pole and slam them together.</p>
    {SECTIONS.map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
      <h4 className="rs-guide-group-title">{section.title}</h4>
      <div className="rs-nep-grid">
        {section.keys.map(key => { const [title, text] = cards[key]; return <article className="rs-nep-card" key={key} style={{ borderColor: '#ff8f7a55' }}>
          <canvas ref={el => { refs.current[key] = el; }} width={200} height={120} aria-hidden="true" />
          <h5 style={{ color: key === 'dusk' ? BINARY_TWIN_COLORS[1] : key === 'dawn' ? BINARY_TWIN_COLORS[0] : '#ffb7a6' }}>{key === 'pole' ? `PRIMAL SKILL (${bindingLabel('mapSkill')})` : title}</h5><p>{text}</p>
        </article>; })}
        {section.skill && <CelestialSkillGuideCard name="Binary Star" description="A twin by Ruby copies your attacks and holds the opposite pole." color="#ff8f7a" draw={drawCelestial} />}
      </div></section>)}
  </div>;
}
