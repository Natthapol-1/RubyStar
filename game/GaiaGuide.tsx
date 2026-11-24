'use client';
import { drawGuideLaser, drawGuideThornDrop, drawGuideFullSunfire, drawGuideRuby } from './guide-art';
import {bindingLabel} from './controls';

import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import type { Enemy } from './engine';
import type { EnemyType } from './constants';
import { GAIA_POD_FUSE } from './constants';
import { drawGaiaUnit, drawGrowthTile, drawStone, drawRootBind, drawSporeShot, drawSporeBurst, drawSunstoneBloom } from './gaia-art';

// Gaia challenge rule sheet: only what is new on this map, one small animated picture and one line per card.

type Paint = (ctx: CanvasRenderingContext2D, tick: number) => void;
const W = 200, H = 120;

function unit(type: EnemyType, id: number, extra: Partial<Enemy> = {}): Enemy {
  return { id, type, tileX: 0, tileY: 0, targetTileX: 1, targetTileY: 0, hp: 8, maxHp: 8, flashTicks: 0, shootTicks: 0, windupTicks: 0, ...extra } as Enemy;
}
function player(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = '#ffe14a'; ctx.shadowBlur = 4; ctx.fillStyle = '#fff07a'; ctx.fillRect(-10, -10, 20, 20); ctx.shadowBlur = 0;
  ctx.fillStyle = '#e8c93a'; ctx.fillRect(-6, -6, 12, 12); ctx.fillStyle = '#48c8ff'; ctx.fillRect(-5, 0, 10, 4);
  ctx.restore();
}
const ruby = drawGuideRuby; // the shared rule-sheet Ruby
// A small patch of overgrowth tiles at half scale.
function tiles(ctx: CanvasRenderingContext2D, x0: number, y0: number, levels: number[][], tick: number) {
  ctx.save(); ctx.translate(x0, y0); ctx.scale(.5, .5);
  levels.forEach((row, y) => row.forEach((level, x) => { ctx.fillStyle = '#0c1a0e'; ctx.fillRect(x * 48, y * 48, 48, 48); if (level) drawGrowthTile(ctx, level, x * 48, y * 48, x, y, tick); }));
  ctx.restore();
}
function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, x, y);
}

export default function GaiaGuide({ drawBoss, drawCelestial }: { drawCelestial: CelestialGuidePainter; drawBoss: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) => void }) {
  const cards: { title: string; color: string; text: string; paint: Paint }[] = [
    { title: 'VINES', color: '#8fdc4a', text: 'Slow you and heal the boss.', paint: (ctx, t) => {
      const cut = Math.floor((t % 120) / 20);
      tiles(ctx, 4, 24, [[1, 2, 2, 3, 3, 2, 2, 1].map((l, x) => x < cut + 2 && x > 0 ? 0 : l), [2, 3, 3, 2, 2, 3, 2, 2], [1, 2, 2, 2, 3, 2, 1, 1]], t);
      player(ctx, 16, 36); drawGuideLaser(ctx, 26, 36, 56 + cut * 24, 36);
    } },
    { title: 'PRIMAL SKILL', color: '#ffd36a', text: 'Sunfire: clearing vines charges it. Burns everything around you, or a chosen chamber when full.', paint: (ctx, t) => {
      const cycle = t % 600, full = cycle >= 240;
      const fill = full ? Math.min(1, (cycle - 240) / 120) : Math.min(.65, cycle / 160);
      ctx.fillStyle = '#1a140a'; ctx.fillRect(14, 98, 72, 10);
      ctx.fillStyle = fill >= 1 ? '#fff3b8' : '#e0a83a'; ctx.fillRect(15, 99, 70 * fill, 8);
      if (full) {
        if (cycle >= 360) drawGuideFullSunfire(ctx, cycle < 480 ? (cycle - 360) * 1.5 : 180 + cycle - 480, t);
        else { ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2; ctx.strokeRect(100, 18, 88, 88); }
        ctx.save(); ctx.translate(144, 62); ctx.scale(.35, .35); drawBoss(ctx, 0, 0, t); ctx.restore();
      } else {
        player(ctx, 140, 58);
        if (cycle >= 160 && cycle < 220) {
          drawSunstoneBloom(ctx,140,58,(cycle-160)/60,.7,1,32,true);
        }
      }
    } },
    { title: 'SUNSTONES', color: '#ffd36a', text: 'Thorn fields that hit a Sunstone hurt the boss.', paint: (ctx, t) => {
      const phase = t % 360;
      drawBoss(ctx, 40, 62, t);
      const impact = 150;
      if (phase < impact) {
        drawGuideThornDrop(ctx, 140, 70, Math.min(89, phase * 90 / impact), t);
        drawStone(ctx, 140, 70, true, 0, t);
      } else {
        if (phase < impact + 12) drawGuideThornDrop(ctx, 140, 70, 90 + phase - impact, t);
        drawStone(ctx, 140, 70, false, Math.max(0, (phase - 240) / 120), t);
        if (phase < 210) {
          const progress = (phase - impact) / 60;
          drawSunstoneBloom(ctx,140,70,progress,.5,1,24);
          ctx.globalAlpha = 1 - progress;
          ctx.fillStyle = '#fff3b8'; ctx.fillRect(Math.round(140 - progress * 100) - 4, 66, 8, 8); ctx.globalAlpha = 1;
        }
      }
    } },
    { title: 'RUBY WARD', color: '#ff8aa8', text: 'Ruby keeps nearby ground clean. Surrounding vines damage it.', paint: (ctx, t) => {
      const ring = Math.min(7, Math.floor((t % 180) / 20));
      const grid = Array.from({ length: 5 }, (_, y) => Array.from({ length: 7 }, (_, x) => (x === 0 || x === 6 || y === 0 || y === 4) && (x + y * 7) % 8 < ring + 1 ? 2 : 0));
      tiles(ctx, 16, 0, grid, t);
      ruby(ctx, 100, 60);
      if (ring >= 6) { ctx.globalAlpha = .5 + .5 * Math.sin(t * .3); ctx.strokeStyle = '#ff3b4f'; ctx.lineWidth = 4; ctx.strokeRect(18, 2, 164, 116); ctx.globalAlpha = 1; }
    } },
    { title: 'SEED PODS', color: '#c6e86a', text: 'Burst into vines if left alone.', paint: (ctx, t) => {
      const cycle = t % 200;
      if (cycle < 160) { ctx.save(); ctx.translate(100, 70); ctx.scale(1.6, 1.6); drawGaiaUnit(ctx, unit('seed_pod', 1, { hp: 6, maxHp: 6, windupTicks: GAIA_POD_FUSE * (1 - cycle / 160) }), 0, 0, t); ctx.restore(); }
      else tiles(ctx, 64, 24, [[0, 3, 3, 0], [3, 3, 3, 3], [0, 3, 3, 0]], t);
    } },
    { title: 'BLOSSOMS', color: '#ff8fc8', text: 'Heal the boss and push you away. Breaking one hurts the boss.', paint: (ctx, t) => {
      // Loop: a pollen shot, then a pulse bursts and pushes you back.
      const burst = 130, k = t % 240, ring = k >= burst && k < burst + 24 ? (k - burst) / 24 : -1;
      const flash = k < 12 ? 12 - k : k >= burst && k < burst + 12 ? burst + 12 - k : 0;
      ctx.save(); ctx.translate(70, 70); ctx.scale(1.4, 1.4); drawGaiaUnit(ctx, unit('blossom', 2, { hp: 12, maxHp: 12, shootTicks: flash }), 0, 0, t); ctx.restore();
      const push = k >= burst ? Math.min(1, (k - burst) / 18) : 0;
      player(ctx, 140 + Math.round(push * 48), 64);
      if (ring >= 0) for (let r = 0; r < 3; r++) {
        const u = ring - r * .14; if (u <= 0 || u >= 1) continue;
        const half = Math.round((10 + u * 84) / 6) * 6;
        ctx.globalAlpha = (1 - u) * .85; ctx.strokeStyle = r === 1 ? '#ff8fc8' : '#ffd6ec'; ctx.lineWidth = r === 1 ? 6 : 3;
        ctx.strokeRect(70 - half, 64 - half, half * 2, half * 2); ctx.globalAlpha = 1;
      }
      const u = k / 120; if (u < .6) { ctx.fillStyle = '#ffb7dc'; ctx.fillRect(80 + u / .6 * 54, 56, 8, 8); }
    } },
    { title: 'ROOT SNARE', color: '#ff6a7a', text: 'Holds you in place.', paint: (ctx, t) => {
      const cycle = t % 240, caught = cycle >= 50 && cycle < 180;
      const x = cycle < 50 ? 40 + cycle / 50 * 60 : cycle < 180 ? 100 : 100 + (cycle - 180) / 60 * 60;
      player(ctx, x, 64);
      if (caught) {
        ctx.save(); ctx.translate(100, 64); ctx.scale(.8, .8);
        drawRootBind(ctx, 0, 0, 1 - (cycle - 50) / 130, t);
        ctx.restore();
      }
    } },
    { title: 'TWIN FIELDS', color: '#e0c44a', text: 'The boss casts two thorn fields at once.', paint: (ctx, t) => {
      const cycle = t % 270;
      if (cycle < 220) {
        const age = cycle < 150 ? cycle * 90 / 150 : 90 + cycle - 150;
        drawGuideThornDrop(ctx, 66, 72, age, t);
        drawGuideThornDrop(ctx, 132, 72, age, t);
      }
      player(ctx, cycle < 100 ? 66 : 66 - Math.min(1, (cycle - 100) / 40) * 40, 72);
    } },
    { title: 'LIFEBLOOM', color: '#9fffc8', text: 'Break it to heal you and Ruby.', paint: (ctx, t) => {
      const p = (t % 210) / 210; // you shoot it, it breaks, and green crosses rise over you and Ruby (a 3.5s loop)
      if (p < .45) { ctx.save(); ctx.translate(90, 64); ctx.scale(1.5, 1.5); drawGaiaUnit(ctx, unit('lifebloom', 6, { hp: 1, maxHp: 1, windupTicks: 900 }), 0, 0, t); ctx.restore(); }
      else if (p < .6) { const r = 8 + (p - .45) / .15 * 30; ctx.globalAlpha = 1 - (p - .45) / .15; ctx.strokeStyle = '#9fffc8'; ctx.lineWidth = 3; ctx.strokeRect(90 - r, 64 - r, r * 2, r * 2); ctx.globalAlpha = 1; }
      player(ctx, 30, 64); ruby(ctx, 165, 66);
      if (p > .2 && p < .45) { drawGuideLaser(ctx, 40, 64, 40 + Math.min(1, (p - .2) / .15) * 40, 64); }
      if (p >= .5 && p < .9) { const rise = (p - .5) / .4; ctx.globalAlpha = 1 - rise; ctx.fillStyle = '#7dffb0'; for (const hx of [30, 165]) { ctx.fillRect(hx - 2, 36 - rise * 18, 4, 12); ctx.fillRect(hx - 6, 40 - rise * 18, 12, 4); } ctx.globalAlpha = 1; }
    } },
    { title: 'POLLEN', color: '#f2d64a', text: 'Slows you, shortens your laser and makes vines grow faster.', paint: (ctx, t) => {
      const front = Math.floor((t % 240) / 24); // vines creeping quickly across the floor inside the haze
      tiles(ctx, 4, 88, [Array.from({ length: 8 }, (_, x) => x < front - 2 ? 2 : x < front ? 1 : 0)], t);
      ctx.globalAlpha = .18; ctx.fillStyle = '#f2d64a'; ctx.fillRect(0, 0, W, H);
      for (let k = 0; k < 24; k++) {
        const x = (k * 37 + t * (.4 + (k % 3) * .2)) % W, y = (k * 53 + Math.sin(t * .03 + k) * 10 + H) % H;
        ctx.globalAlpha = .75; ctx.fillStyle = k % 4 ? '#ffe680' : '#fff8cc'; ctx.fillRect(Math.round(x), Math.round(y), 4, 4);
      }
      ctx.globalAlpha = 1; player(ctx, 40, 60);
      const reach = 60 + 20 * Math.sin(t * .05); // the short beam stops early
      drawGuideLaser(ctx, 50, 60, 50 + reach, 60);
    } },
    { title: 'RAGECAP', color: '#ff5a4a', text: 'Fast, with a knockback attack. Spreads vines.', paint: (ctx, t) => {
      const p = (t % 210) / 210, x = 30 + Math.min(1, p / .5) * 110; // it rushes in spreading vines, hits you and knocks you back (a 3.5s loop)
      tiles(ctx, 0, 76, [[0, 0, 0, 0, 0, 0, 0, 0].map((_, k) => k * 24 + 12 < x - 10 ? 2 : 0)], t);
      ctx.save(); ctx.translate(x, 60); ctx.scale(1.4, 1.4); drawGaiaUnit(ctx, unit('angry_mushroom', 5, { hp: 14, maxHp: 14, shootTicks: p > .5 && p < .58 ? 10 : 0 }), 0, 0, t); ctx.restore();
      player(ctx, 165 + (p > .5 ? Math.min(1, (p - .5) / .08) * 22 : 0), 60);
    } },
    { title: 'SPORELING', color: '#b9a8ff', text: 'Shoots spores that slow you and grow vines.', paint: (ctx, t) => {
      const cycle = t % 240, fired = cycle >= 50, hit = cycle >= 88;
      drawGaiaUnit(ctx, unit('sporeling', 3, { windupTicks: cycle < 50 ? 50-cycle : 0, shootTicks: cycle >= 50 && cycle < 64 ? 14 : 0 }), 38, 62, t);
      if (fired && !hit) drawSporeShot(ctx, 52 + (cycle-50)/38*85, 62, 1, 0);
      if (hit && cycle < 220) tiles(ctx, 108, 40, [[2, 2, 2], [2, 2, 2], [2, 2, 2]], t);
      const px = cycle < 88 ? 144 : 144 + Math.min(1,(cycle-88)/110)*25;
      player(ctx, px, 62);
      if (cycle >= 88 && cycle < 112) drawSporeBurst(ctx, 140, 62, cycle-88);
    } },
    { title: 'VINE CRAWLER', color: '#8fdc4a', text: 'Spreads vines as it walks. Does not attack.', paint: (ctx, t) => {
      const x = 36 + (t % 180) / 180 * 128;
      tiles(ctx, 4, 76, [[0, 0, 0, 0, 0, 0, 0, 0].map((_, k) => k * 24 + 16 < x ? 2 : 0)], t);
      ctx.save(); ctx.translate(x, 60); ctx.scale(1.4, 1.4); drawGaiaUnit(ctx, unit('vine_crawler', 4), 0, 0, t); ctx.restore();
    } },
    { title: 'DRIFTING SUNSTONES', color: '#ffd36a', text: 'Sunstones keep moving around.', paint: (ctx, t) => {
      // Pause on each floor tile, then make a clear two-tile move.
      const cycle = t % 240, returning = cycle >= 120, local = cycle % 120;
      const progress = Math.max(0, Math.min(1, (local - 45) / 36));
      const eased = progress * progress * (3 - 2 * progress);
      const x = returning ? 148 - eased * 96 : 52 + eased * 96;
      for (let k = 0; k < 3; k++) { ctx.fillStyle = '#17251a'; ctx.fillRect(28 + k * 48, 48, 46, 46); ctx.strokeStyle = '#516044'; ctx.lineWidth = 1; ctx.strokeRect(28 + k * 48, 48, 46, 46); }
      if (progress > 0 && progress < 1) { ctx.globalAlpha = .3; drawStone(ctx, returning ? 148 : 52, 71, true, 0, t); ctx.globalAlpha = 1; }
      drawStone(ctx, x, 71, true, 0, t);
    } },
  ];

  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let frame = 0, raf = 0;
    const loop = () => {
      frame++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.save(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0c1a10'; ctx.fillRect(0, 0, W, H);
        cards[i].paint(ctx, frame); ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>GAIA CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Clear vines, charge Sunfire and bait thorn fields onto Sunstones.</p>
    {[
      { title: 'GENERAL RULES & SKILLS', indices: [0, 1, 2, 3, 8, 9], skill: true },
      { title: 'ENEMIES', indices: [4, 10, 11, 12], skill: false },
      { title: 'PHASE 2+', indices: [5, 6], skill: false },
      { title: 'PHASE 3', indices: [7, 13], skill: false },
    ].map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
    <h4 className="rs-guide-group-title">{section.title}</h4>
    <div className="rs-nep-grid">
      {section.indices.map(i => { const card = cards[i]; return <article key={card.title} className="rs-nep-card" style={{ borderColor: card.color + '66' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={W} height={H} aria-hidden="true" />
        <h5 style={{ color: card.color }}>{card.title==='PRIMAL SKILL'?'PRIMAL SKILL ('+bindingLabel('mapSkill')+')':card.title}</h5>
        <p>{card.text}</p>
      </article>; })}
      {section.skill && <CelestialSkillGuideCard name="Gaia’s Roots" description="Clears vines and thorn fields, stops regrowth and slows and damages enemies." color="#a5de65" draw={drawCelestial} />}
    </div></section>)}
  </div>;
}
