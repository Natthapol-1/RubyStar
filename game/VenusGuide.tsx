'use client';
import { drawGuideBullet } from './guide-art';
import { useEffect, useRef } from 'react';
import { bindingLabel } from './controls';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawGuidePlayer } from './guide-art';
import { drawEncounterEnemy } from './encounter-art';
import { VENUS } from './venus';
import { drawVenusRelic, drawVenusScarab, drawDuneWorm, drawVenusCore, drawSandScorpion, drawSandSwirlPreview } from './venus-art';
import type { Enemy } from './engine';

const SAND = '#e3c08a', CYAN = '#78dedf', GOLD = '#ffd27a', RED = '#ff6a4d';
const cards = [
  ['SEALED SHIELD', 'His shield blocks most damage and reflects your hits.'],
  ['TOTEM SEQUENCE', 'Totems appear one by one, then sink into the sand.'],
  ['IN ORDER', 'Break them in the order they appeared. A wrong one explodes and relocates.'],
  ['OUT OF TIME', 'A totem left too long explodes the same way.'],
  ['SHIELD BROKEN', 'Breaking every totem breaks his shield for a while.'],
  ['PRIMAL SKILL', 'Sand Swirl: uncovers what is buried around you and briefly blocks and reflects hits.'],
  ['PARRY', 'Sand Swirl right before a hit lands blocks it and stuns the boss.'],
  ['AEGIS SENTINEL', 'Leaps onto you from anywhere and fires a charged lance.'],
  ['LONGER SEQUENCES', 'Sequences get longer.'],
  ['HIDDEN CORE', 'His core hides in the sand; broken totems point to it. After the last totem, break the core to drop his shield.'],
  ['SAND SCARAB', 'Nests hide near totems and his core. Uncovering one releases a scarab.'],
  ['DUNE WORM', 'Tunnels under the sand and bursts up beside you to bite. Sand Swirl digs it up.'],
  ['SAND RELICS', 'Uncover and break relics for a bonus: healing, a faster Venus Veil or revealing all totems.'],
  ['SAND SCORPION', 'Hides under the sand and bursts up beside you to sting.'],
] as const;

const unit = (type: Enemy['type'], extra: Partial<Enemy> = {}) => ({ type, id: 1, hp: 30, maxHp: 30, icyShieldHP: 0, flashTicks: 0, shootTicks: 0, attackTimer: 99, ...extra }) as Enemy;
const totem = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, _n = 0, _color = CYAN) => { // no number: in play you remember the order
  ctx.save(); ctx.translate(x, y); ctx.scale(.55, .55); drawEncounterEnemy(ctx, unit('aegis_construct'), 0, 0, tick, false); ctx.restore();
};
const sentinel = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, open = 0) => {
  ctx.save(); ctx.translate(x, y); ctx.scale(.55, .55); drawEncounterEnemy(ctx, unit('aegis_sentinel', { aegis: { shielded: open < .5, exposedUntilTick: 0, constructsLeft: 0, openAmount: open, reflectTicks: 0 } }), 0, 0, tick, false); ctx.restore();
};
const sandOver = (ctx: CanvasRenderingContext2D, x: number, y: number, a: number) => { ctx.globalAlpha = a; ctx.fillStyle = SAND; ctx.fillRect(x - 16, y - 12, 32, 24); ctx.fillRect(x - 12, y - 16, 24, 32); ctx.globalAlpha = 1; };

export default function VenusGuide({ drawCelestial }: { drawCelestial: CelestialGuidePainter }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let raf = 0, tick = 0;
    const frame = () => {
      tick++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        const cycle = tick % 180;
        ctx.save(); ctx.globalAlpha = 1; ctx.clearRect(0, 0, 200, 120); ctx.fillStyle = '#1e170e'; ctx.fillRect(0, 0, 200, 120);
        // Each card loops slowly enough to read (3–5 seconds), showing one clear idea.
        const loop = (n: number) => (tick % n) / n;
        const shot = (x1: number, x2: number, y: number, t: number, _col: string) => drawGuideBullet(ctx, x1 + (x2 - x1) * t, y, x2 - x1, 0);
        const blast = (x: number, y: number, t: number, col: string) => { const r = 8 + t * 40; ctx.globalAlpha = 1 - t; ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; };
        const heal = (x: number, y: number, t: number) => { ctx.globalAlpha = 1 - t; ctx.fillStyle = '#8dffb0'; ctx.fillRect(x - 2, y - 18 - t * 14, 4, 12); ctx.fillRect(x - 6, y - 14 - t * 14, 12, 4); ctx.globalAlpha = 1; };
        if (i === 0) { // your shot hits his shield and comes back at you
          const p = loop(150); sentinel(ctx, 145, 62, tick); drawGuidePlayer(ctx, 45, 62);
          if (p < .4) shot(58, 128, 62, p / .4, '#ffffff'); else if (p < .8) shot(128, 58, 62, (p - .4) / .4, CYAN);
          if (p >= .4 && p < .5) blast(135, 62, (p - .4) / .1, CYAN);
          if (p >= .8 && p < .9) { ctx.globalAlpha = .6; ctx.fillStyle = RED; ctx.fillRect(33, 50, 24, 24); ctx.globalAlpha = 1; }
        } else if (i === 1) { // totems rise one by one, each briefly shown, then the sand covers them
          const c = tick % 300;
          for (let k = 0; k < 3; k++) { const born = 20 + k * 60, x = 45 + k * 55; if (c < born) continue; totem(ctx, x, 70, tick); sandOver(ctx, x, 70, Math.min(1, Math.max(0, (c - born - 45) / 25)));
            if (c - born < 45) { ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = GOLD; ctx.fillText(String(k + 1), x, 40); } }
        } else if (i === 2) { // you break the wrong one: it explodes over its chamber, then rises somewhere else
          const p = loop(270); totem(ctx, 55, 74, tick); drawGuidePlayer(ctx, 100, 100);
          ctx.strokeStyle = '#4a3a22'; ctx.lineWidth = 2; ctx.strokeRect(110, 20, 80, 80);
          if (p < .3) { totem(ctx, 150, 60, tick); shot(100, 150, 90 - p / .3 * 30, p / .3, '#ffffff'); }
          else if (p < .5) { const t = (p - .3) / .2; ctx.globalAlpha = .45 * (1 - t); ctx.fillStyle = '#ffce8a'; ctx.fillRect(110, 20, 80, 80); ctx.globalAlpha = 1; blast(150, 60, t, '#ffce8a'); }
          else { const t = Math.min(1, (p - .5) / .15); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 200, 86); ctx.clip(); ctx.translate(0, Math.round((1 - t) * 30)); totem(ctx, 30, 40, tick); ctx.restore(); }
        } else if (i === 3) { // a timer runs out: the totem glows amber, explodes, then rises somewhere else
          const p = loop(270), warn = p > .5 && p < .65;
          if (p < .65) { totem(ctx, 70, 66, tick); if (warn) { ctx.globalAlpha = .4 + .4 * Math.abs(Math.sin(tick * .4)); ctx.fillStyle = '#ffce8a'; ctx.fillRect(56, 48, 28, 36); ctx.globalAlpha = 1; } }
          else if (p < .8) blast(70, 66, (p - .65) / .15, '#ffce8a'); else totem(ctx, 150, 50, tick);
          ctx.fillStyle = '#3a2c18'; ctx.fillRect(40, 104, 120, 5); ctx.fillStyle = p > .45 ? RED : GOLD; ctx.fillRect(40, 104, 120 * Math.max(0, 1 - p / .65), 5);
        } else if (i === 4) { // the last totem breaks: his shield shatters open and you heal
          const p = loop(240), open = p > .3 ? Math.min(1, (p - .3) / .1) : 0; sentinel(ctx, 70, 62, tick, open); drawGuidePlayer(ctx, 160, 66);
          if (p < .3) totem(ctx, 130, 30, tick); else if (p < .45) { blast(130, 30, (p - .3) / .15, CYAN); blast(70, 62, (p - .3) / .15, '#ffffff'); }
          if (p > .35 && p < .65) heal(160, 66, (p - .35) / .3);
        } else if (i === 5) { // Sand Swirl blows the sand away around you, uncovering a totem
          // The game's own Sand Swirl (octagon footprint, ribbons and grit) at card scale; a totem two tiles away is uncovered.
          const p = loop(180), tile = 15, sweep = Math.min(1, p / .4); totem(ctx, 70 + tile * 2, 62, tick);
          sandOver(ctx, 70 + tile * 2, 62, p < .12 ? 1 : p < .25 ? 1 - (p - .12) / .13 : p > .85 ? (p - .85) / .15 : 0);
          if (sweep < 1) drawSandSwirlPreview(ctx, 70, 62, tile, sweep); ctx.globalAlpha = 1; drawGuidePlayer(ctx, 70, 62);
        } else if (i === 6) { // just as his lance fires, Sand Swirl turns it back on him and stuns him
          // As in play: the lance's charge fills the band from him toward you; the Sand Swirl (the game's own painter) goes up
          // just before it fires, and the beam turns back cyan.
          const p = loop(240); sentinel(ctx, 150, 62, tick);
          if (p < .5) {
            const late = p > .4, fill = Math.round(76 * Math.min(1, p / .5));
            ctx.globalAlpha = .2; ctx.fillStyle = late ? '#ffffff' : GOLD; ctx.fillRect(62, 56, 76, 12);
            ctx.globalAlpha = .9; ctx.strokeStyle = late ? '#ffffff' : GOLD; ctx.lineWidth = 2; ctx.setLineDash([8, 6]); ctx.lineDashOffset = tick * 2; ctx.strokeRect(62, 56, 76, 12); ctx.setLineDash([]);
            ctx.globalAlpha = .4; ctx.fillStyle = late ? '#ffffff' : '#ffb347'; ctx.fillRect(138 - fill, 58, fill, 8);
            ctx.globalAlpha = .95; ctx.fillStyle = '#ffffff'; ctx.fillRect(138 - fill, 56, 3, 12); ctx.globalAlpha = 1;
          }
          if (p > .43 && p < .7) { drawSandSwirlPreview(ctx, 50, 62, 10, (p - .43) / .27); ctx.globalAlpha = 1; }
          drawGuidePlayer(ctx, 50, 62);
          if (p < .5) { /* charging */ }
          else if (p < .62) { ctx.fillStyle = CYAN; ctx.fillRect(62, 58, 76, 8); blast(50, 62, (p - .5) / .12, '#ffffff'); }
          else if (p < .9) { for (let k = 0; k < 3; k++) { const a = tick * .15 + k * 2.1; ctx.fillStyle = '#fff6d0'; ctx.fillRect(150 + Math.cos(a) * 14 - 2, 34 + Math.sin(a) * 4 - 2, 4, 4); } heal(50, 62, (p - .62) / .28); }
        } else if (i === 7) { // he leaps onto a target that locks on you, then charges a lance at you
          const p = loop(330); drawGuidePlayer(ctx, 70, 70);
          if (p < .5) { const t = p / .5, r = 20; ctx.strokeStyle = t > .55 ? RED : GOLD; ctx.lineWidth = 3; ctx.strokeRect(70 - r, 70 - r, r * 2, r * 2);
            if (t < .3) sentinel(ctx, 160, 62 - t * 60, tick); else if (t > .8) { sentinel(ctx, 70, 70, tick); blast(70, 70, (t - .8) / .2, GOLD); } }
          else { const t = (p - .5) / .5; sentinel(ctx, 160, 62, tick); if (t < .6) { ctx.globalAlpha = .3 + .3 * (t / .6); ctx.fillStyle = t > .45 ? '#ffffff' : GOLD; ctx.fillRect(80, 65, 66, 10); ctx.globalAlpha = 1; } else if (t < .75) { ctx.fillStyle = GOLD; ctx.fillRect(80, 66, 66, 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(80, 69, 66, 2); } }
        } else if (i === 8) { // a phase adds a totem to the sequence
          const p = loop(240), n = p < .5 ? 4 : 5; for (let k = 0; k < n; k++) { const x = 40 + k * 30; if (k === 4) { const t = Math.min(1, (p - .5) / .1); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 200, 86); ctx.clip(); ctx.translate(0, Math.round((1 - t) * 30)); totem(ctx, x, 70, tick); ctx.restore(); } else totem(ctx, x, 70, tick); }
        } else if (i === 9) { // the last totems fall, the core opens, and you break it
          const p = loop(330); drawGuidePlayer(ctx, 40, 70);
          if (p < .2) totem(ctx, 160, 40, tick); else if (p < .3) blast(160, 40, (p - .2) / .1, CYAN);
          if (p < .75) drawVenusCore(ctx, 110, 74, tick, p < .3, false);
          if (p > .45 && p < .7) shot(52, 100, 70, ((p - .45) / .25 * 3) % 1, '#ffffff');
          if (p >= .75 && p < .9) { blast(110, 70, (p - .75) / .15, '#ffffff'); blast(110, 70, (p - .75) / .15 * .7, CYAN); }
        } else if (i === 10) { // a swirl near a totem uncovers a nest; a scarab bursts out and chases you
          const p = loop(270); totem(ctx, 150, 50, tick); drawGuidePlayer(ctx, 50, 70);
          if (p < .25) { ctx.fillStyle = '#c99a5a'; ctx.fillRect(112, 72, 18, 8); if (p > .1) { const r = 10 + (p - .1) / .15 * 30; ctx.globalAlpha = 1 - (p - .1) / .15; ctx.strokeStyle = SAND; ctx.lineWidth = 3; ctx.strokeRect(121 - r, 76 - r, r * 2, r * 2); ctx.globalAlpha = 1; } }
          else { if (p < .35) blast(121, 76, (p - .25) / .1, SAND); drawVenusScarab(ctx, 121 - Math.min(1, (p - .25) / .6) * 50, 76, tick, 1, false, false); }
        } else if (i === 11) { // the worm tunnels toward you leaving a trail, bursts up beside you, bites you back, then sinks
          const p = loop(300), stop = 140, bx = p < .4 ? 30 + (stop - 30) * (p / .4) : stop;
          const state = p < .4 ? 'under' : p < .47 ? 'rising' : p < .78 ? 'up' : p < .88 ? 'sinking' : 'under';
          const ticks = state === 'rising' ? Math.round((.47 - p) / .07 * VENUS.burrowRise) : state === 'sinking' ? Math.round((.88 - p) / .1 * VENUS.burrowSink) : 30;
          for (let k = 1; k <= 5; k++) { const tx = bx - k * 18; if (tx < 20 || p > .88) continue; ctx.globalAlpha = .4 * (1 - k / 6); ctx.fillStyle = '#8a6338'; ctx.fillRect(tx - 7, 74, 14, 5); ctx.globalAlpha = 1; }
          drawDuneWorm(ctx, bx, 72, tick, 1, state, ticks, p >= .47 && p < .55, false);
          const shove = p < .47 ? 0 : p < .55 ? (p - .47) / .08 : p < .88 ? 1 : 1 - (p - .88) / .12;
          drawGuidePlayer(ctx, 166 + Math.round(shove * 18), 66);
        } else if (i === 12) { // a swirl uncovers a relic; breaking it gives its gift (the three kinds take turns)
          const p = loop(240), kind = (['urn', 'sun', 'eye'] as const)[Math.floor(tick / 240) % 3]; drawGuidePlayer(ctx, 60, 66);
          if (p < .6) { drawVenusRelic(ctx, kind, 130, 66, tick); sandOver(ctx, 130, 66, p < .15 ? 1 : p < .25 ? 1 - (p - .15) / .1 : 0); if (p > .35) shot(72, 120, 66, ((p - .35) / .25 * 2) % 1, '#ffffff'); }
          else if (p < .8) { blast(130, 66, (p - .6) / .2, kind === 'urn' ? '#ff9f8a' : kind === 'sun' ? GOLD : CYAN); if (kind === 'urn') heal(60, 66, (p - .6) / .2); }
        } else if (i === 13) { // you step beside a buried scorpion; it bursts up, stings and knocks you back, then buries itself
          const p = loop(270), walk = Math.min(1, p / .3), px = 40 + walk * 52;
          const state = p < .3 ? 'under' : p < .36 ? 'rising' : p < .8 ? 'up' : p < .9 ? 'sinking' : 'under';
          const ticks = state === 'rising' ? Math.round((.36 - p) / .06 * VENUS.scorpRise) : state === 'sinking' ? Math.round((.9 - p) / .1 * VENUS.burrowSink) : 60;
          drawSandScorpion(ctx, 124, 70, tick, 1, state, ticks, p > .36 && p < .44, false);
          const back = p < .36 ? 0 : p < .46 ? (p - .36) / .1 : p < .9 ? 1 : 1 - (p - .9) / .1;
          drawGuidePlayer(ctx, px - Math.round(back * 34), 66);
        }
        ctx.restore();
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>VENUS</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Remember where each totem sank and its order, then break them in that order.</p>
    {[
      { title: 'GENERAL RULES & SKILLS', indices: [1, 2, 3, 5, 6, 12], skill: true },
      { title: 'ENEMIES', indices: [7, 0, 4, 10], skill: false },
      { title: 'PHASE 2+', indices: [8, 11], skill: false },
      { title: 'PHASE 3', indices: [9, 13], skill: false },
    ].map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
      <h4 className="rs-guide-group-title">{section.title}</h4>
      <div className="rs-nep-grid">
        {section.indices.map(i => { const [title, text] = cards[i]; return <article className="rs-nep-card" key={title} style={{ borderColor: '#e3c08a55' }}>
          <canvas ref={el => { refs.current[i] = el; }} width={200} height={120} aria-hidden="true" />
          <h5 style={{ color: i === 5 ? SAND : '#f0e2c4' }}>{title === 'PRIMAL SKILL' ? `PRIMAL SKILL (${bindingLabel('mapSkill')})` : title}</h5><p>{text}</p>
        </article>; })}
        {section.skill && <CelestialSkillGuideCard name="Venus Veil" description="Cuts the damage you and Ruby take and reflects direct hits back." color="#f5dcc8" draw={drawCelestial} />}
      </div></section>)}
  </div>;
}
