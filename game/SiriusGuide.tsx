'use client';
import { drawGuideBullet } from './guide-art';
import { useEffect, useRef } from 'react';
import { bindingLabel } from './controls';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawGuidePlayer, drawGuideRuby } from './guide-art';
import { drawSiriusUnit, drawRuneTiles, runeCells, drawSanctuarySeal, drawHaloKnockbackWave, RUNE_GOLD, WRATH_RED, TRAIL_GOLD } from './sirius-art';
import { RUNES } from './sirius';
import type { Enemy } from './engine';

const cards = [
  ['LIGHT AND DARK', 'The sanctuary swaps between light and dark. In the dark, your movement is reversed.'],
  ['RUNES', 'Walk the boss’s rune shape in one unbroken line before time runs out.'],
  ['TRACED RUNE', 'Hurts the boss and fills your energy.'],
  ['MISSED RUNE', 'Heals the boss and makes aliens stronger for a while.'],
  ['BROKEN TRAIL', 'Knockback or teleporting breaks your trail.'],
  ['RUBY RITUAL', 'When he moves Ruby, guess its new chamber.'],
  ['HOLY LIGHT', 'Fills as you gain energy.'],
  ['PRIMAL SKILL', 'Sacred Halo: stuns nearby aliens and lets you float over walls. With full Holy Light, it hits every enemy hard.'],
  ['BLIND PRAYER', 'Never attacks and resists most damage. Holy Light hurts him most.'],
  ['ZEALOT', 'Dashes in a straight line and knocks you far back.'],
  ['BELLRINGER', 'Its bell hurts you and pushes you away.'],
  ['MASON', 'Raises a stone wall in your path.'],
  ['PENITENT', 'Follows and erases your trail.'],
  ['HARDER RUNES', 'Runes get longer.'],
  ['SANCTUARY SEALS', 'Your rune shape must pass through a Sanctuary Seal.'],
] as const;

const unit = (type: Enemy['type'], extra: Partial<Enemy> = {}) => ({ type, id: 1, hp: 20, maxHp: 20, icyShieldHP: 0, flashTicks: 0, shootTicks: 0, attackTimer: 99, ...extra }) as Enemy;
const HOOK = RUNES[0];

// The rune as tiles, with `traced` tiles lit; returns the centre of the last lit tile (where you stand).
function drawRune(ctx: CanvasRenderingContext2D, ox: number, oy: number, cell: number, traced: number) {
  drawRuneTiles(ctx, HOOK, ox, oy, cell * 4, traced);
  const cells = runeCells(HOOK), xs = cells.map(c => c[0]), ys = cells.map(c => c[1]), minX = Math.min(...xs), minY = Math.min(...ys);
  const cols = Math.max(...xs) - minX + 1, rows = Math.max(...ys) - minY + 1, size = Math.floor(cell * 4 / Math.max(cols, rows));
  const [x, y] = cells[Math.min(traced, cells.length - 1)];
  return [Math.round(ox - cols * size / 2) + (x - minX + .5) * size, Math.round(oy - rows * size / 2) + (y - minY + .5) * size] as const;
}

export default function SiriusGuide({ drawBoss, drawCelestial }: { drawBoss: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, flash?: boolean) => void; drawCelestial: CelestialGuidePainter }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let raf = 0, tick = 0;
    const frame = () => {
      tick++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        const cycle = tick % 240; // 4s loops: each idea plays, then holds briefly so it can be read
        ctx.save(); ctx.clearRect(0, 0, 200, 120);
        ctx.fillStyle = i === 0 && cycle >= 120 ? '#0d0b1a' : '#1c1a26'; ctx.fillRect(0, 0, 200, 120);
        if (i === 14) {
          const cells = runeCells(HOOK), traced = Math.min(cells.length - 1, Math.floor(cycle / 20));
          drawSanctuarySeal(ctx, 84, 42, tick, traced >= 2, 30);
          drawSanctuarySeal(ctx, 163, 30, tick, false, 28);
          ctx.strokeStyle = TRAIL_GOLD; ctx.lineWidth = 4;ctx.beginPath();
          cells.slice(0, traced + 1).forEach(([x,y],j)=>{if(j===0)ctx.moveTo(40+x*22,42+y*22);else ctx.lineTo(40+x*22,42+y*22);});ctx.stroke();
          const [x,y]=cells[traced];drawGuidePlayer(ctx,40+x*22,42+y*22);
        } else if (i === 0) { // light, then dark with the arrows reversed
          const dark = cycle >= 120;
          if (!dark) { ctx.globalAlpha = .18; ctx.fillStyle = '#ffe9a8'; ctx.fillRect(0, 0, 200, 120); ctx.globalAlpha = 1; }
          drawGuidePlayer(ctx, 100, 62);
          ctx.fillStyle = dark ? '#b9a6ff' : '#ffe9a8';
          const dir = dark ? -1 : 1; // pressing right moves you left in the dark
          ctx.fillRect(100 + dir * 26 - 8, 58, 16, 8); ctx.fillRect(100 + dir * 34 - (dir > 0 ? 0 : 8), 54, 8, 16);
          ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillText(dark ? 'DARK' : 'LIGHT', 100, 22);
        } else if (i === 1 || i === 4) { // walking the rune; a shove breaks the trail
          const steps = Math.min(6, Math.floor(cycle / 18)), broken = i === 4 && cycle > 80;
          const [px, py] = drawRune(ctx, 100, 60, 24, broken ? 0 : steps);
          if (i === 4 && cycle > 70) { drawSiriusUnit(ctx, unit('zealot'), 150, 90, tick); }
          drawGuidePlayer(ctx, broken ? 120 : px, broken ? 90 : py, 16);
        } else if (i === 2) { // traced: a golden strike on the boss, and you heal
          drawBoss(ctx, 60, 64, tick, cycle > 30 && cycle < 50);
          if (cycle > 20 && cycle < 60) { ctx.globalAlpha = 1 - (cycle - 20) / 40; ctx.fillStyle = '#fff2b0'; ctx.fillRect(52, 0, 16, 64); ctx.globalAlpha = 1; }
          drawGuidePlayer(ctx, 145, 64); ctx.fillStyle = '#7dff8a'; if (cycle > 40) { ctx.fillRect(141, 30 - (cycle % 30), 8, 3); ctx.fillRect(143, 28 - (cycle % 30), 3, 8); }
        } else if (i === 3) { // missed: aliens glow red
          for (const [x, type] of [[60, 'zealot'], [140, 'bellringer']] as const) {
            drawSiriusUnit(ctx, unit(type), x, 66, tick);
            ctx.strokeStyle = WRATH_RED; ctx.lineWidth = 3; ctx.globalAlpha = .6; const r = 24 + Math.sin(tick * .2) * 2; ctx.strokeRect(x - r, 66 - r, r * 2, r * 2); ctx.globalAlpha = 1;
          }
        } else if (i === 5) { // Ruby's ritual and the 1-4 guess
          drawGuideRuby(ctx, 100, 44);
          const labels = ['1', '2', '3', '4'], pick = Math.floor(tick / 60) % 4;
          ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center';
          labels.forEach((label, k) => { const x = 28 + k * 48; ctx.strokeStyle = k === pick ? '#ff9fbf' : '#6e6448'; ctx.lineWidth = 2; ctx.strokeRect(x - 16, 82, 32, 22); ctx.fillStyle = k === pick ? '#ff9fbf' : '#c9b986'; ctx.fillText(label, x, 97); });
        } else if (i === 6) { // Holy Light filling
          const fill = (cycle % 180) / 180; ctx.strokeStyle = '#ffe27a'; ctx.lineWidth = 2; ctx.strokeRect(40, 54, 120, 14); ctx.fillStyle = fill > .95 ? '#fff6d0' : '#e8c45c'; ctx.fillRect(42, 56, 116 * fill, 10);
          ctx.fillStyle = '#ffe27a'; ctx.fillRect(97, 26, 6, 18); ctx.fillRect(91, 32, 18, 6);
        } else if (i === 7) { // Halo: floating over a wall, then the burst
          if (cycle < 60) {
            const p = Math.min(1, cycle / 30);
            drawHaloKnockbackWave(ctx, 40, 62, p, 92);
            drawSiriusUnit(ctx, unit('penitent'), 78 + p * 60, 96, tick);
          }
          ctx.fillStyle = '#4a4252'; ctx.fillRect(84, 52, 32, 32); ctx.fillStyle = '#625b68'; ctx.fillRect(84, 52, 32, 5);
          const x = 40 + (cycle % 120) * 1.1, y = 62; drawGuidePlayer(ctx, x, y);
          ctx.fillStyle = RUNE_GOLD; ctx.fillRect(x - 12, y - 30, 24, 3); ctx.fillRect(x - 12, y - 24, 24, 3); ctx.fillRect(x - 15, y - 27, 3, 3); ctx.fillRect(x + 12, y - 27, 3, 3);
          if (cycle > 140 && cycle < 180) { ctx.globalAlpha = (180 - cycle) / 40 * .5; ctx.fillStyle = '#fff2b0'; ctx.fillRect(0, 0, 200, 120); ctx.globalAlpha = 1; }
        } else if (i === 8) { // the Prayer shrugging off a shot
          drawBoss(ctx, 100, 62, tick);
          const x = 30 + (cycle % 60) * 1.1; if (x < 85) { drawGuideBullet(ctx, x, 62, 1, 0); }
        } else if (i === 9) { // Zealot braces, then dashes
          const dash = cycle > 60 && cycle < 80, x = dash ? 40 + (cycle - 60) * 6 : cycle >= 80 ? 160 : 40;
          if (cycle < 60) for (let k = 1; k <= 4; k++) { ctx.strokeStyle = WRATH_RED; ctx.globalAlpha = .4; ctx.lineWidth = 2; ctx.strokeRect(40 + k * 30 - 12, 50, 24, 24); ctx.globalAlpha = 1; }
          drawSiriusUnit(ctx, unit('zealot', { siriusAct: cycle < 60 ? { ticks: 60 - cycle, tx: 0, ty: 0, dx: 1, dy: 0, fromX: 0, fromY: 0, dashing: false } : dash ? { ticks: 5, tx: 0, ty: 0, dx: 1, dy: 0, fromX: 0, fromY: 0, dashing: true } : undefined }), Math.min(x, 128), 62, tick);
          const knocked = cycle >= 74 ? Math.min(1, (cycle - 74) / 16) : 0; drawGuidePlayer(ctx, 150 + knocked * 34, 62); // you, knocked far back
        } else if (i === 11) { // Mason hoists its tablet; a wall rises in front of the player
          const raising = cycle >= 45 && cycle < 150;
          drawSiriusUnit(ctx, unit('mason', { siriusAct: cycle < 45 ? { ticks: 45 - cycle, tx: 0, ty: 0, dx: 0, dy: 0, fromX: 0, fromY: 0, dashing: false } : undefined, shootTicks: cycle >= 45 && cycle < 60 ? 10 : 0 }), 40, 66, tick);
          drawGuidePlayer(ctx, 165, 62);
          for (let k = 0; k < 4; k++) { const y = 14 + k * 24; if (raising) { ctx.fillStyle = '#625b68'; ctx.fillRect(120, y, 22, 22); ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = 2; ctx.strokeRect(121, y + 1, 20, 20); } else if (cycle < 45) { ctx.setLineDash([4, 3]); ctx.strokeStyle = '#d8d2ec'; ctx.lineWidth = 2; ctx.strokeRect(121, y + 1, 20, 20); ctx.setLineDash([]); } }
        } else if (i === 12) { // Penitent eats the trail behind you
          const n = 6, eaten = Math.min(n, Math.floor(cycle / 25));
          for (let k = 0; k < n; k++) { const x = 30 + k * 22; ctx.fillStyle = k < eaten ? '#1a1020' : TRAIL_GOLD; ctx.globalAlpha = k < eaten ? .7 : .8; ctx.fillRect(x - 4, 76, 8, 8); if (k) { ctx.fillRect(x - 22, 78, 22, 4); } }
          ctx.globalAlpha = 1; drawGuidePlayer(ctx, 30 + n * 22, 80, 16);
          drawSiriusUnit(ctx, unit('penitent'), 30 + Math.max(0, eaten - 1) * 22, 54, tick);
        } else if (i === 13) { // a short rune, then a longer one
          ctx.fillStyle = '#ffe9a8'; ctx.font = '8px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.fillText('→', 100, 64);
          drawRuneTiles(ctx, RUNES[0], 50, 60, 64, 0); drawRuneTiles(ctx, RUNES[RUNES.length - 3], 150, 60, 70, 0);
        } else if (i === 10) { // Bellringer rings
          const ringing = cycle > 60 && cycle < 90;
          drawSiriusUnit(ctx, unit('bellringer', { shootTicks: ringing ? 10 : 0 }), 100, 66, tick);
          if (ringing) { const p = (cycle - 60) / 30, r = 20 + p * 50; ctx.globalAlpha = 1 - p; ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = 4; ctx.strokeRect(100 - r, 62 - r, r * 2, r * 2); ctx.globalAlpha = 1; }
          const pushed = cycle >= 66 ? Math.min(1, (cycle - 66) / 20) : 0; drawGuidePlayer(ctx, 140 + pushed * 30, 62); // you, pushed away
        }
        ctx.restore();
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [drawBoss]);
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>SIRIUS CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Trace the boss’s runes to burn him while his aliens try to knock you off course.</p>
    {[
      { title: 'GENERAL RULES & SKILLS', indices: [0, 1, 2, 3, 4, 5, 6, 7], skill: true },
      { title: 'ENEMIES', indices: [8, 9, 10], skill: false },
      { title: 'PHASE 2+', indices: [11, 13], skill: false },
      { title: 'PHASE 3', indices: [12, 14], skill: false },
    ].map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
    <h4 className="rs-guide-group-title">{section.title}</h4>
    <div className="rs-nep-grid">
      {section.indices.map(i => { const [title, text] = cards[i]; return <article className="rs-nep-card" key={title} style={{ borderColor: '#e8c45c55' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={200} height={120} aria-hidden="true" />
        <h5 style={{ color: i === 3 ? WRATH_RED : '#ffe9a8' }}>{title === 'PRIMAL SKILL' ? `PRIMAL SKILL (${bindingLabel('mapSkill')})` : title}</h5><p>{text}</p>
      </article>; })}
      {section.skill && <CelestialSkillGuideCard name="Sirius Surge" description="Grants powered mode, a speed burst and resets your cooldowns." color={TRAIL_GOLD} draw={drawCelestial} />}
    </div></section>)}
  </div>;
}
