'use client';
import {bindingLabel} from './controls';

import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import type { Enemy } from './engine';
import type { EnemyType } from './constants';
import { NEPTUNE_BOMB_FUSE } from './constants';
import { drawNeptuneUnit, drawWaterBurst } from './neptune-art';

// Neptune challenge rule sheet: only what is new on this map, one small animated picture and one line per card.

type Paint = (ctx: CanvasRenderingContext2D, tick: number) => void;
const W = 200, H = 120;

function unit(type: EnemyType, id: number, extra: Partial<Enemy> = {}): Enemy {
  return { id, type, tileX: 0, tileY: 0, targetTileX: 1, targetTileY: 0, hp: 8, maxHp: 8, flashTicks: 0, shootTicks: 0, windupTicks: 0, ...extra } as Enemy;
}

function player(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = '#ffe14a'; ctx.shadowBlur = 4; ctx.fillStyle = '#fff07a'; ctx.fillRect(-12, -12, 24, 24); ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8c93a'; ctx.fillRect(-8, -8, 16, 16); ctx.fillStyle = '#48c8ff'; ctx.fillRect(-6, 0, 12, 5);
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, x, y);
}

function cross(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(x - 2, y - 6, 4, 12); ctx.fillRect(x - 6, y - 2, 12, 4);
}

export default function NeptuneGuide({ drawBoss, drawCelestial }: { drawCelestial: CelestialGuidePainter; drawBoss: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, diving: boolean) => void }) {
  const cards: { title: string; color: string; text: string; paint: Paint }[] = [
    { title: 'PRIMAL SKILL', color: '#a0ecff', text: 'Trident: healing you and Ruby charges it. At full charge, strikes a chosen chamber and damages all units inside.', paint: (ctx, t) => {
      ctx.fillStyle = '#0a1422'; ctx.fillRect(14, 96, 70, 10);
      const fill = Math.min(1, (t % 120) / 90); ctx.fillStyle = fill >= 1 ? '#e8fbff' : '#59c8ff'; ctx.fillRect(15, 97, 68 * fill, 8);
      ctx.strokeStyle = '#59c8ff'; ctx.lineWidth = 2; ctx.strokeRect(112, 50, 70, 56);
      if (fill >= 1) {
        const beam = 30 * (1 - ((t % 120) - 90) / 30);
        ctx.fillStyle = 'rgba(159,228,255,.7)'; ctx.fillRect(147 - beam / 2, 0, beam, 78); ctx.fillStyle = '#ffffff'; ctx.fillRect(147 - beam / 6, 0, beam / 3, 78);
      } else if (Math.floor(t / 6) % 2) { ctx.fillStyle = 'rgba(160,236,255,.35)'; ctx.fillRect(113, 51, 68, 54); }
    } },
    { title: 'THREE PHASES', color: '#6fb6ff', text: 'The boss has three phases. Marks on her HP bar show when she dives.', paint: (ctx, t) => {
      drawBoss(ctx, 100, 50, t, false);
      for (let i = 0; i < 3; i++) {
        const x = 22 + i * 54; ctx.fillStyle = '#0a1422'; ctx.fillRect(x, 96, 50, 10);
        ctx.fillStyle = i === 2 ? '#3998d6' : '#6fb6ff'; ctx.fillRect(x + 1, 97, i === 2 ? 30 : 48, 8);
      }
      ctx.fillStyle = '#ffffff'; for (const f of [.25, .5, .75]) ctx.fillRect(130 + f * 50, 93, 2, 16);
    } },
    { title: 'DIVE & CLONES', color: '#6fc7ff', text: 'Each dive hides clones around the station. Destroy them all to end the dive.', paint: (ctx, t) => {
      drawBoss(ctx, 46, 62, t, true);
      [[110, 40], [168, 40], [139, 88]].forEach(([x, y], i) => { ctx.save(); ctx.translate(x, y); ctx.scale(.75, .75); drawNeptuneUnit(ctx, unit('water_clone', i + 2), 0, 0, t); ctx.restore(); });
    } },
    { title: 'MISSED CLONES', color: '#ff8a9a', text: 'Clones left when time runs out heal the boss. Hitting a clone pauses her healing.', paint: (ctx, t) => {
      drawNeptuneUnit(ctx, unit('water_clone', 4), 70, 66, t);
      drawBoss(ctx, 150, 62, t, false); // a clone left over heals her: a green cross rises over her (a 2.5s loop)
      const p = (t % 150) / 150; if (p < .5) { ctx.fillStyle = '#7fd0ff'; ctx.fillRect(85 + p / .5 * 50, 60, 8, 4); }
      else { const rise = (p - .5) / .5; ctx.globalAlpha = 1 - rise; cross(ctx, 150, 34 - rise * 18, '#7dffb0'); ctx.globalAlpha = 1; }
    } },
    { title: 'FINAL DIVE', color: '#d8f2ff', text: 'Destroying the final clones exposes the boss. One more hit defeats her.', paint: (ctx, t) => {
      [30, 77, 124, 171].forEach((x, i) => { ctx.save(); ctx.translate(x, 66 + (i % 2 ? 10 : -6)); ctx.scale(.75, .75); drawNeptuneUnit(ctx, unit('water_clone', 5 + i), 0, 0, t); ctx.restore(); });
    } },
    { title: 'FISH', color: '#59c8ff', text: 'Hitting blue fish heals you, or the boss while she dives. Red fish hurt you.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(60, 54); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('fish_blue', 9), 0, 0, t); ctx.restore();
      ctx.save(); ctx.translate(140, 54); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('fish_red', 10), 0, 0, t); ctx.restore();
      label(ctx, '+HP', 60, 104, '#7dffb0'); label(ctx, '-HP', 140, 104, '#ff6a7a');
    } },
    { title: 'JELLYFISH', color: '#ff9ce6', text: 'Killing one during a dive reveals a clone.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(60, 62); ctx.scale(1.6, 1.6); drawNeptuneUnit(ctx, unit('jellyfish', 13, { hp: 2, maxHp: 2 }), 0, 0, t); ctx.restore();
      const pulse = .5 + .5 * Math.sin(t * .2);
      ctx.save(); ctx.translate(145, 70); ctx.scale(.7, .7); drawNeptuneUnit(ctx, unit('water_clone', 14), 0, 0, t); ctx.restore();
      ctx.globalAlpha = .3 + .2 * pulse; ctx.fillStyle = '#ffd6f4'; ctx.fillRect(139, 0, 12, 50); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ff9ce6'; ctx.lineWidth = 3; ctx.strokeRect(122, 48, 46, 46);
    } },
    { title: 'SHARK', color: '#9fb8cc', text: 'Charges through the red lane, damaging units and knocking you aside. Sometimes another shark follows.', paint: (ctx, t) => {
      const cycle = t % 150;
      ctx.globalAlpha = cycle < 70 ? .25 + .2 * Math.abs(Math.sin(t * .25)) : .1; ctx.fillStyle = '#ff4d5a'; ctx.fillRect(0, 48, W, 26); ctx.globalAlpha = 1;
      if (cycle >= 70) {
        const x = -40 + (cycle - 70) * 3.5;
        ctx.save(); ctx.translate(x, 61); ctx.fillStyle = '#5f7e98'; ctx.fillRect(-24, -8, 40, 16); ctx.fillRect(16, -5, 8, 10); ctx.fillRect(-32, -11, 8, 7); ctx.fillRect(-32, 4, 8, 7);
        ctx.fillStyle = '#4a667e'; ctx.fillRect(-6, -16, 10, 8); ctx.fillStyle = '#0b1020'; ctx.fillRect(12, -4, 3, 3); ctx.restore();
      }
      player(ctx, 120, cycle < 50 ? 61 : 30);
    } },
    { title: 'PUFFERFISH', color: '#ffc94a', text: 'Swells up when close, then bursts and knocks you back. It bursts when killed too.', paint: (ctx, t) => {
      const cycle = (t % 180) - 70, wind = cycle < 60 ? 0 : cycle < 96 ? 36 - (cycle - 60) : 0, burst = cycle >= 96 ? 18 - (cycle - 96) : 0; // idle, swell, burst, then a pause (3s)
      ctx.save(); ctx.translate(80, 62); ctx.scale(1.5, 1.5); drawNeptuneUnit(ctx, unit('pufferfish', 15, { hp: 7, maxHp: 7, windupTicks: wind, shootTicks: burst }), 0, 0, t); ctx.restore();
      player(ctx, cycle >= 96 ? 150 + Math.min(30, (cycle - 96) * 3) : 150, 62);
    } },
    { title: 'STINGER', color: '#3fd6b0', text: 'Its bite poisons you.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(100, 60); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('stinger', 11, { hp: 6, maxHp: 6 }), 0, 0, t); ctx.restore();
    } },
    { title: 'WATER BALL', color: '#7fd0ff', text: 'Explodes after a countdown, hurting you and Ruby. Destroying it first damages the boss.', paint: (ctx, t) => {
      const cycle = t % 150;
      if (cycle < 122) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); ctx.translate(100, 60); ctx.scale(1.4, 1.4);
        drawNeptuneUnit(ctx, unit('water_bomb', 12, { windupTicks: NEPTUNE_BOMB_FUSE * (1 - cycle / 122), hp: 6, maxHp: 6 }), 0, 0, t); ctx.restore();
      } else { ctx.save(); ctx.translate(100, 60); ctx.scale(.45, .45); drawWaterBurst(ctx, 0, 0, 192, 28 - (cycle - 122)); ctx.restore(); }
    } },
    { title: 'TIDES', color: '#59c8ff', text: 'Currents push you. Moving with them is faster; moving against them is slower.', paint: (ctx, t) => {
      ctx.fillStyle = 'rgba(89,200,255,.16)'; ctx.fillRect(10, 14, 180, 92);
      ctx.fillStyle = 'rgba(216,244,255,.8)';
      for (let i = 0; i < 4; i++) {
        const x = 14 + ((i * 50 + t * .8) % 180);
        for (let k = 0; k < 5; k++) { ctx.fillRect(x - k * 3, 58 - k * 3, 3, 3); ctx.fillRect(x - k * 3, 58 + k * 3, 3, 3); }
      }
      player(ctx, 40 + ((t * .5) % 120), 60);
    } },
    { title: 'HEALING & TIDES', color: '#9a7dff', text: 'The boss’s hits heal her. Two chambers always have tides.', paint: (ctx, t) => {
      drawBoss(ctx, 60, 54, t, false); player(ctx, 150, 56); // her water hits you, and the hit heals her (a 3s loop)
      const p = (t % 180) / 180;
      if (p < .35) { ctx.fillStyle = '#7fd0ff'; ctx.fillRect(80 + p / .35 * 60, 52, 10, 6); }
      else if (p < .45) { ctx.globalAlpha = .5; ctx.fillStyle = '#ff6b7a'; ctx.fillRect(138, 44, 24, 24); ctx.globalAlpha = 1; }
      else if (p < .85) { const rise = (p - .45) / .4; ctx.globalAlpha = 1 - rise; cross(ctx, 60, 28 - rise * 16, '#7dffb0'); ctx.globalAlpha = 1; }
      ctx.fillStyle = '#59c8ff'; ctx.globalAlpha = .5; for (let k = 0; k < 5; k++) { const x = ((t * .6 + k * 40) % 200); ctx.fillRect(x, 100, 10, 3); ctx.fillRect(x + 6, 97, 4, 3); ctx.fillRect(x + 6, 103, 4, 3); } ctx.globalAlpha = 1; // a tide flowing along the floor
    } },
  ];

  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let frame = 0, raf = 0;
    const loop = () => {
      frame++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.save(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0b1d30'; ctx.fillRect(0, 0, W, H);
        cards[i].paint(ctx, frame); ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>NEPTUNE CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Find and destroy all clones when the boss dives. Healing charges Trident for a chamber-wide strike.</p>
    {[
      { title: 'GENERAL RULES & SKILLS', indices: [1, 2, 3, 0, 11], skill: true },
      { title: 'ENEMIES', indices: [5, 6, 7, 8, 9], skill: false },
      { title: 'PHASE 2+', indices: [10], skill: false },
      { title: 'PHASE 3', indices: [12, 4], skill: false },
    ].map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
    <h4 className="rs-guide-group-title">{section.title}</h4>
    <div className="rs-nep-grid">
      {section.indices.map(i => { const card = cards[i]; return <article key={card.title} className="rs-nep-card" style={{ borderColor: card.color + '66' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={W} height={H} aria-hidden="true" />
        <h5 style={{ color: card.color }}>{card.title==='PRIMAL SKILL'?'PRIMAL SKILL ('+bindingLabel('mapSkill')+')':card.title}</h5>
        <p>{card.text}</p>
      </article>; })}
      {section.skill && <CelestialSkillGuideCard name="Neptune’s Tide" description="Heals you and Ruby and pushes nearby enemies away." color="#91baff" draw={drawCelestial} />}
    </div></section>)}
  </div>;
}
