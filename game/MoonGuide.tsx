'use client';
import { drawGuideLaser, drawGuideBullet, drawGuideRuby } from './guide-art';
import {bindingLabel} from './controls';

import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import type { Enemy } from './engine';
import { drawMoonUnit } from './moon-art';

// Moon challenge rule sheet: only what is new on this map, one small animated picture and one line per card.

type Paint = (ctx: CanvasRenderingContext2D, tick: number) => void;
type DrawQueen = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, disguised: boolean) => void;
type DrawBlinker = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) => void;
const W = 200, H = 120;

function player(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = '#ffe14a'; ctx.shadowBlur = 4; ctx.fillStyle = '#fff07a'; ctx.fillRect(-10, -10, 20, 20); ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8c93a'; ctx.fillRect(-6, -6, 12, 12); ctx.fillStyle = '#48c8ff'; ctx.fillRect(-5, 0, 10, 4);
  ctx.restore();
}
function shard(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, alpha: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#8f5fe0'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(0, -4); ctx.lineTo(-6, 0); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f4eaff'; ctx.fillRect(-2, -1, 8, 2); ctx.restore();
}

export default function MoonGuide({ drawQueen, drawBlinker, drawCelestial }: { drawQueen: DrawQueen; drawBlinker: DrawBlinker; drawCelestial: CelestialGuidePainter }) {
  const cards: { title: string; color: string; text: React.ReactNode; paint: Paint }[] = [
    { title: 'HIDDEN QUEEN', color: '#dd88ff', text: 'Hides among identical illusions and jumps between chambers.', paint: (ctx, t) => {
      const shown = 1 + Math.min(3, Math.floor((t % 200) / 50));
      [[40, 60], [100, 44], [160, 64], [100, 92]].slice(0, shown).forEach(([x, y]) => drawQueen(ctx, x, y, t, true));
    } },
    { title: 'DECOY', color: '#cc88ff', text: 'Illusions attack your decoy. The real Queen ignores it.', paint: (ctx, t) => {
      const fire = t % 80 < 16;
      ctx.globalAlpha = .75; ctx.fillStyle = '#b278f3'; ctx.fillRect(88, 82, 22, 22); ctx.fillStyle = '#8fffe0'; ctx.fillRect(93, 90, 12, 4); ctx.globalAlpha = 1; // your Lunar Echo
      player(ctx, 172, 92);
      drawQueen(ctx, 40, 34, t, true); drawQueen(ctx, 156, 30, t, true);
      if (fire) { ctx.fillStyle = '#dd88ff'; ctx.fillRect(48, 44, 4, 4);
        ctx.strokeStyle = '#dd88ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(44, 42); ctx.lineTo(96, 88); ctx.moveTo(158, 42); ctx.lineTo(172, 84); ctx.stroke(); }
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#8a7aa8'; ctx.fillText('FAKE', 40, 64); ctx.fillStyle = '#f4eaff'; ctx.fillText('REAL', 132, 64);
    } },
    { title: 'REVEAL', color: '#ff9cf0', text: <>Reveals herself before jumping and <strong style={{ color: '#ffe6a6', fontWeight: 800, textShadow: '0 0 5px #ffc75e44' }}>takes more damage</strong> then.</>, paint: (ctx, t) => {
      const cycle = t % 160, revealed = cycle >= 90;
      drawQueen(ctx, 110, 60, t, !revealed);
      if (revealed && cycle < 110) { const k = (cycle - 90) / 20; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#f4eaff'; ctx.lineWidth = 3; ctx.strokeRect(110 - 20 - k * 20, 60 - 20 - k * 20, 40 + k * 40, 40 + k * 40); ctx.globalAlpha = 1; }
      player(ctx, 30, 60); if (revealed) { drawGuideLaser(ctx, 40, 60, 92, 60); }
    } },
    { title: 'PRIMAL SKILL', color: '#a9e6ff', text: 'Moon Mark: marks the nearest Queen or illusion. A mark on the real Queen follows her jump.', paint: (ctx, t) => {
      const cycle = t % 200, jumped = cycle >= 110, x = jumped ? 160 : 60, y = jumped ? 70 : 50;
      if (!jumped) drawQueen(ctx, x, y, t, true); else { drawQueen(ctx, 60, 50, t, true); drawQueen(ctx, x, y, t, true); }
      if (cycle > 20 && (cycle < 180 || Math.floor(t / 6) % 2 === 0)) {
        const mx = jumped ? x : 60, my = jumped ? y : 50; ctx.fillStyle = '#a9e6ff';
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.fillRect(mx + dx * 20 - (dx > 0 ? 6 : 0), my + dy * 20 - (dy > 0 ? 2 : 0), 6, 2); ctx.fillRect(mx + dx * 20 - (dx > 0 ? 2 : 0), my + dy * 20 - (dy > 0 ? 6 : 0), 2, 6); }
      }
    } },
    { title: 'MIRROR MITE', color: '#c6b8ff', text: 'Killing one marks two chambers on the minimap. One holds the real Queen.', paint: (ctx, t) => {
      const cycle = t % 120, x = 60 + Math.min(50, cycle * .8);
      if (cycle < 70) { ctx.save(); ctx.translate(x, 60); ctx.scale(1.4, 1.4); drawMoonUnit(ctx, { id: 1, type: 'mirror_mite', flashTicks: cycle > 62 ? 4 : 0, attackTimer: 30 } as Enemy, 0, 0, t); ctx.restore(); }
      player(ctx, 160, 60);
      if (cycle >= 70) { const rise = (cycle - 70) / 50; ctx.globalAlpha = 1 - rise; ctx.fillStyle = '#ff5a8a'; ctx.fillRect(157, 34 - rise * 18, 6, 16); ctx.fillRect(152, 39 - rise * 18, 16, 6); ctx.globalAlpha = 1; }
    } },
    { title: 'CRYSTAL HOUND', color: '#a9e6ff', text: 'Fast, with a knockback attack.', paint: (ctx, t) => {
      // Loop: it dashes in, bites, and you are knocked back.
      const k = t % 120, bite = k >= 60 && k < 72, x = 30 + Math.min(60, k) * 1.5, push = k >= 60 ? Math.min(1, (k - 60) / 10) * 34 : 0;
      ctx.save(); ctx.translate(x, 64); ctx.scale(1.3, 1.3); drawMoonUnit(ctx, { id: 5, type: 'moon_hound', flashTicks: 0, shootTicks: bite ? 8 : 0, hp: 10, maxHp: 10 } as Enemy, 0, 0, t); ctx.restore();
      player(ctx, 148 + Math.round(push), 62);
    } },
    { title: 'SHADE', color: '#9f86e0', text: 'Attacks and pushes Ruby.', paint: (ctx, t) => {
      const k = t % 120, x = 40 + k * .7, shove = k > 104 ? Math.min(1, (k - 104) / 10) * 26 : 0; // the strike knocks Ruby back
      ctx.save(); ctx.translate(x, 60); ctx.scale(1.3, 1.3); drawMoonUnit(ctx, { id: 3, type: 'moon_shade', flashTicks: 0, attackTimer: k > 100 ? 8 : 30 } as Enemy, 0, 0, t); ctx.restore();
      drawGuideRuby(ctx, 160 + Math.round(shove), 62); // the same Ruby as every rule sheet
    } },
    { title: 'MIRRORS', color: '#e6dcff', text: 'Reflect your shots back at you.', paint: (ctx, t) => {
      for (let k = 0; k < 3; k++) { const y = 26 + k * 24; ctx.globalAlpha = .45; ctx.fillStyle = '#2c2450'; ctx.fillRect(118, y, 22, 22); ctx.globalAlpha = .4; ctx.fillStyle = '#8f86c8'; ctx.fillRect(121, y + 3, 16, 16); ctx.globalAlpha = .8; ctx.strokeStyle = '#e6dcff'; ctx.lineWidth = 2; ctx.strokeRect(119, y + 1, 20, 20); ctx.globalAlpha = 1; }
      player(ctx, 40, 62);
      const k = (t % 180) / 180; // your laser reaches the mirror, then comes back at you (a 3s loop)
      if (k < .3) { drawGuideLaser(ctx, 50, 62, 50 + 68 * k / .3, 62); }
      else if (k < .6) { drawGuideBullet(ctx, 118 - 68 * (k - .3) / .3, 62, -1, 0); }
      else if (k < .7) { ctx.globalAlpha = (.7 - k) / .1 * .6; ctx.fillStyle = '#ff8aa0'; ctx.fillRect(28, 48, 24, 24); ctx.globalAlpha = 1; }
    } },
    { title: 'MIMIC', color: '#b6a8e8', text: 'Disguises itself as an illusion but never attacks.', paint: (ctx, t) => {
      const posing = t % 160 >= 80;
      if (posing) drawQueen(ctx, 70, 60, t, true);
      else { ctx.save(); ctx.translate(70, 64); ctx.scale(1.3, 1.3); drawMoonUnit(ctx, { id: 2, type: 'moon_mimic', flashTicks: 0, attackTimer: 30 } as Enemy, 0, 0, t); ctx.restore(); }
      drawQueen(ctx, 150, 60, t, true);
      if (t % 80 < 14) { ctx.strokeStyle = '#dd88ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(150, 70); ctx.lineTo(176, 104); ctx.stroke(); }
      player(ctx, 180, 104);
    } },
    { title: 'DARKNESS', color: '#8a7aa8', text: 'Hides enemies and moves between chambers. Hits briefly reveal them.', paint: (ctx, t) => {
      ctx.fillStyle = '#030108'; ctx.fillRect(16, 12, 168, 96); ctx.strokeStyle = '#b98cff99'; ctx.lineWidth = 3; ctx.strokeRect(16, 12, 168, 96);
      player(ctx, 40, 60);
      const hit = t % 180 < 70; // a hit lights up the hidden Queen for a moment
      if (hit) { drawGuideLaser(ctx, 50, 60, 134, 60); drawQueen(ctx, 146, 60, t, true); }
    } },
    { title: 'SHATTER', color: '#b98cff', text: 'Destroyed illusions shatter into damaging shards.', paint: (ctx, t) => {
      const cycle = t % 120;
      if (cycle < 40) drawQueen(ctx, 100, 60, t, true);
      else for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + .2, d = (cycle - 40) * 1.2; shard(ctx, 100 + Math.cos(a) * d, 60 + Math.sin(a) * d, a, 1 - (cycle - 40) / 80); }
      player(ctx, 176, 96);
    } },
    { title: 'BLINKER', color: '#7fe0ff', text: 'Killing it teleports you to a random place.', paint: (ctx, t) => {
      const cycle = t % 150, warped = cycle >= 70;
      if (cycle < 60) drawBlinker(ctx, 110, 60, t);
      if (cycle < 60 && cycle % 30 < 10) { drawGuideLaser(ctx, 50, 60, 96, 60); }
      if (cycle >= 60 && cycle < 76) { const k = (cycle - 60) / 16; ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#7fe0ff'; ctx.lineWidth = 3; ctx.strokeRect(40 - 12 - k * 14, 60 - 12 - k * 14, 24 + k * 28, 24 + k * 28); ctx.strokeRect(166 - 24 + k * 12, 92 - 24 + k * 12, 48 - k * 24, 48 - k * 24); ctx.globalAlpha = 1; }
      if (warped) player(ctx, 166, 92); else player(ctx, 40, 60);
    } },
    { title: 'SHADOW QUEEN', color: '#dd88ff', text: 'Shoots you or Ruby through cover. When she jumps, she leaves a healing field based on the damage she took.', paint: (ctx, t) => {
      const cycle = t % 180, jumped = cycle >= 70;
      if (jumped) { // the field where she stood: a violet square with rising heal crosses, fading out
        const k = (cycle - 70) / 110;
        ctx.globalAlpha = (1 - k) * .3; ctx.fillStyle = '#b98cff'; ctx.fillRect(28, 28, 64, 64);
        ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#a9e6ff'; ctx.lineWidth = 3; ctx.strokeRect(28, 28, 64, 64);
        ctx.fillStyle = '#b8ffd8';
        for (const [x, y] of [[44, 76], [60, 62], [76, 80]]) { const cy = y - k * 30; ctx.fillRect(x - 2, cy - 6, 4, 12); ctx.fillRect(x - 6, cy - 2, 12, 4); }
        ctx.globalAlpha = 1;
      }
      if (!jumped) drawQueen(ctx, 60, 60, t, false); // she jumps away; you stay where you are
      player(ctx, 140, 60);
      if (!jumped && cycle >= 20 && cycle < 50) drawGuideLaser(ctx, 130, 60, 130 - 50 * (cycle - 20) / 30, 60);
    } },
  ];

  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let frame = 0, raf = 0;
    const loop = () => {
      frame++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.save(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0b0717'; ctx.fillRect(0, 0, W, H);
        cards[i].paint(ctx, frame); ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>MOON CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>The Queen hides among illusions. Moon Mark tracks its target, while Lunar Echo draws attacks.</p>
    {[
      { title: 'GENERAL RULES & SKILLS', indices: [3, 1], skill: true },
      { title: 'ENEMIES', indices: [12, 0, 2, 10, 4, 8, 5], skill: false }, // the Queen, hiding, reveal and shatter, then mite, mimic, crystal hound
      { title: 'PHASE 2+', indices: [7, 6], skill: false },          // mirrors, shade
      { title: 'PHASE 3', indices: [9, 11], skill: false },          // darkness, blinker
    ].map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
    <h4 className="rs-guide-group-title">{section.title}</h4>
    <div className="rs-nep-grid">
      {section.indices.map(i => { const card = cards[i]; return <article key={card.title} className="rs-nep-card" style={{ borderColor: card.color + '66' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={W} height={H} aria-hidden="true" />
        <h5 style={{ color: card.color }}>{card.title==='PRIMAL SKILL'?'PRIMAL SKILL ('+bindingLabel('mapSkill')+')':card.title}</h5>
        <p>{card.text}</p>
      </article>; })}
      {section.skill && <CelestialSkillGuideCard name="Lunar Echo" description="Creates a decoy that draws enemy attacks." color="#c6a2f2" draw={drawCelestial} />}
    </div></section>)}
  </div>;
}
