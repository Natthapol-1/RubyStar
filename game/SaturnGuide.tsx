'use client';
import { drawGuideBullet } from './guide-art';
import { useEffect, useRef } from 'react';
import { bindingLabel } from './controls';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawSaturnUnit, drawFrostAnchor, drawFrostAnchorZone, drawSaturnGrantMark, drawSaturnSnowflake, GRANT_COLOR, RECALL_COLOR } from './saturn-art';
import { drawMobIceShield } from './ice-shield-art';
import { drawGuidePlayer } from './guide-art';
import type { Enemy } from './engine';

const cards = [
  ['FROST WARDEN', 'Gives frost shields to her aliens. Breaking them hurts her; hitting her directly does little.'],
  ['MARKED TARGETS', 'Snowflakes mark her next shield targets. Kill one first to hurt her and gain a shield.'],
  ['RECALL', 'Violet diamonds mark shields she pulls back to heal. If none return, she is hurt instead.'],
  ['PRIMAL SKILL', 'Absolute Zero: stops time around you. Catching her grants steals the shield.'],
  ['COLD', 'Without a shield, the blizzard hurts and slows you. Frozen tiles freeze you.'],
  ['FROSTBITER', 'Pounces on a marked tile, strips your shield and knocks you back.'],
  ['HAILER', 'Shells marked tiles and freezes them.'],
  ['GLACIER HULK', 'Slams the ground around it, freezing it. Gets a double frost shield.'],
  ['FROST BLOOM', 'Shielded aliens spread frost shields to allies and get faster and stronger.'],
  ['FREEZING LINES', 'Her grant and recall lines leave frozen paths.'],
  ['FROST ANCHORS', 'Ice pillars block your Absolute Zero counters while you’re nearby. Destroying one grants you a shield.'],
  ['REVERSED GRANTS', 'A gold snowflake marks a reversed grant. It shields its target only when caught by Absolute Zero.'],
] as const;

const RED_MARK = '#ff8aa0';
const unit = (type: Enemy['type'], extra: Partial<Enemy> = {}) => ({ type, id: 1, hp: 40, maxHp: 40, icyShieldHP: 0, flashTicks: 0, shootTicks: 0, attackTimer: 99, ...extra }) as Enemy;

export default function SaturnGuide({ drawCelestial, drawFrozenTile, drawBoss }: { drawCelestial: CelestialGuidePainter; drawFrozenTile: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) => void; drawBoss: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, shielded?: boolean, flash?: boolean) => void }) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let raf = 0, tick = 0;
    const frame = () => {
      tick++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, 200, 120); ctx.fillStyle = '#102533'; ctx.fillRect(0, 0, 200, 120);
        const cycle = tick % 150;
        // Each card loops slowly enough to read (3–5 seconds), showing one clear idea.
        const loop = (n: number) => (tick % n) / n;
        const shot = (x1: number, x2: number, y: number, t: number) => drawGuideBullet(ctx, x1 + (x2 - x1) * t, y, x2 - x1, -20);
        const burst = (x: number, y: number, t: number, col: string) => { const r = 8 + t * 34; ctx.globalAlpha = 1 - t; ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.strokeRect(x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1; };
        const heal = (x: number, y: number, t: number) => { ctx.globalAlpha = 1 - t; ctx.fillStyle = '#8dffb0'; ctx.fillRect(x - 2, y - 30 - t * 14, 4, 12); ctx.fillRect(x - 6, y - 26 - t * 14, 12, 4); ctx.globalAlpha = 1; };
        const shield = (x: number, y: number) => { ctx.strokeStyle = '#9fe8ff'; ctx.lineWidth = 3; ctx.strokeRect(x - 18, y - 18, 36, 36); };
        if (i === 11) {
          const p=loop(300),blocked=p>=.5,landed=p% .5>.32;
          drawBoss(ctx,35,65,tick);drawSaturnUnit(ctx,unit('frostbiter'),150,65,tick);
          if(blocked){ctx.globalAlpha=.12;ctx.fillStyle='#f2f8ff';ctx.fillRect(113,28,74,74);ctx.globalAlpha=.75;ctx.strokeStyle='#f2f8ff';ctx.lineWidth=2;ctx.strokeRect(113,28,74,74);ctx.globalAlpha=1;}
          if(!landed)drawSaturnGrantMark(ctx,150,65,35,65,Math.max(1,90-(p%.5)/.32*90),tick,true);
          if(landed&&blocked)drawMobIceShield(ctx,150,65,26,tick);
        } else if (i === 0) { // you break the frost shield on her alien; its ice flies back and hurts her
          const p = loop(240), broken = p > .45; drawGuidePlayer(ctx, 100, 100);
          drawBoss(ctx, 40, 50, tick, false, p > .62 && p < .7);
          drawSaturnUnit(ctx, unit('frostbiter'), 155, 50, tick); if (!broken) drawMobIceShield(ctx, 155, 50, 26, tick);
          if (p < .45) shot(100, 150, 70 - (p % .15) / .15 * 20, (p % .15) / .15);
          if (p > .45 && p < .65) { const t = (p - .45) / .2; burst(155, 50, t, '#e8fbff'); ctx.fillStyle = '#e8fbff'; for (let k = 0; k < 4; k++) ctx.fillRect(155 - t * 110 + k * 6, 46 + (k % 2) * 6, 5, 5); }
        } else if (i === 1) { // a snowflake marks her next target; kill it before the grant lands to hurt her and gain a shield
          const p = loop(270), dead = p > .5; drawBoss(ctx, 40, 50, tick, false, p > .5 && p < .58); drawGuidePlayer(ctx, 100, 100);
          if (!dead) { drawSaturnUnit(ctx, unit('sleet_mortar'), 155, 50, tick); drawSaturnGrantMark(ctx, 155, 50, 40, 50, Math.max(1, 200 - p * 300), tick); }
          if (p > .25 && p < .5) shot(100, 150, 70 - ((p - .25) % .12) / .12 * 20, ((p - .25) % .12) / .12);
          if (p > .5 && p < .65) burst(155, 50, (p - .5) / .15, '#ffffff');
          if (p > .55) shield(100, 100);
        } else if (i === 2) { // a violet diamond closes on a shielded alien; the shield flies back and heals her
          const p = loop(240), taken = p > .55; drawBoss(ctx, 45, 60, tick); drawSaturnUnit(ctx, unit('frostbiter'), 150, 64, tick);
          if (!taken) { drawMobIceShield(ctx, 150, 64, 26, tick); const r = 24 + (1 - p / .55) * 30; ctx.save(); ctx.translate(150, 64); ctx.rotate(Math.PI / 4); ctx.strokeStyle = RECALL_COLOR; ctx.lineWidth = 4; ctx.strokeRect(-r * .72, -r * .72, r * 1.44, r * 1.44); ctx.restore(); }
          else if (p < .75) { const t = (p - .55) / .2; ctx.fillStyle = RECALL_COLOR; ctx.fillRect(150 - t * 100 - 6, 58, 12, 12); }
          else heal(45, 60, (p - .75) / .25);
        } else if (i === 3) { // Absolute Zero stops time around you: her grant flying in is caught and becomes your shield
          const p = loop(270), r = 44; drawGuidePlayer(ctx, 100, 62);
          ctx.globalAlpha = .18; ctx.fillStyle = '#cfe6ff'; ctx.fillRect(100 - r, 62 - r, r * 2, r * 2);
          ctx.globalAlpha = .9; ctx.strokeStyle = '#f2f8ff'; ctx.lineWidth = 3; ctx.strokeRect(100 - r, 62 - r, r * 2, r * 2);
          ctx.fillStyle = '#ffffff'; for (let h = 0; h < 12; h++) { const a = h / 12 * Math.PI * 2, sz = h % 3 ? 4 : 8; ctx.fillRect(100 + Math.sin(a) * (r - 9) - sz / 2, 62 - Math.cos(a) * (r - 9) - sz / 2, sz, sz); }
          ctx.save(); ctx.translate(100, 62); ctx.rotate(-tick * .03); ctx.fillRect(-2, -30, 4, 30); ctx.restore(); ctx.globalAlpha = 1;
          if (p < .4) { ctx.fillStyle = GRANT_COLOR; ctx.fillRect(10 + p / .4 * 60, 58, 12, 8); }
          else if (p < .55) { ctx.fillStyle = GRANT_COLOR; ctx.fillRect(70 + (p - .4) / .15 * 22, 58, 12, 8); }
          else shield(100, 62);
        } else if (i === 4) { // blizzard and a frozen tile
          ctx.save(); ctx.translate(55, 60); drawFrozenTile(ctx, -24, -24, tick); ctx.restore();
          drawGuidePlayer(ctx, 140, 60); for (let k = 0; k < 10; k++) { ctx.fillStyle = '#dcf6ff'; ctx.fillRect((k * 37 - tick * 2) % 200 + 200 * (k * 37 - tick * 2 < 0 ? 1 : 0), (k * 23 + tick) % 120, 3, 2); }
        } else if (i === 10) { // Destroying the pillar removes the counter suppression.
          const p=loop(180),broken=p>.55;
          drawGuidePlayer(ctx,34,75);drawSaturnUnit(ctx,unit('frostbiter'),153,65,tick);
          if(!broken){drawFrostAnchorZone(ctx,99,64,tick,55);drawFrostAnchor(ctx,99,64,tick);if(p>.25)drawGuideBullet(ctx,45+(p-.25)/.3*40,66,1,0);}
          else if(p<.75)burst(99,64,(p-.55)/.2,'#d4eaff');
          if(!broken)drawMobIceShield(ctx,153,65,22,tick);
          else{shield(34,75);if(p<.8){ctx.globalAlpha=1-(p-.55)/.25;ctx.fillStyle='#d7f8ff';ctx.fillRect(153-(p-.55)/.25*115,56,7,4);ctx.globalAlpha=1;}}
        } else if (i === 9) { // a fired line from her to an alien leaves frozen tiles along it
          drawBoss(ctx, 35, 60, tick); drawSaturnUnit(ctx, unit('frostbiter'), 168, 60, tick);
          const fired = tick % 180 > 70;
          ctx.strokeStyle = fired ? '#ffffff' : RECALL_COLOR; ctx.globalAlpha = fired ? .9 : .4; ctx.lineWidth = fired ? 4 : 2; ctx.beginPath(); ctx.moveTo(55, 60); ctx.lineTo(150, 60); ctx.stroke(); ctx.globalAlpha = 1;
          if (fired) for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(70 + k * 22, 60); ctx.scale(.4, .4); drawFrozenTile(ctx, -24, -24, tick); ctx.restore(); }
        } else if (i === 8) { // a holder passes frost shield to its neighbour
          const bloom = tick % 240;
          drawSaturnUnit(ctx, unit('frostbiter'), 50, 65, tick); drawMobIceShield(ctx, 50, 65, 25, tick);
          drawSaturnUnit(ctx, unit('sleet_mortar'), 150, 65, tick);
          if (bloom >= 120) drawMobIceShield(ctx, 150, 65, 25, tick);
          if (bloom >= 75 && bloom < 120) {
            const x = Math.round(70 + (bloom - 75) / 45 * 60);
            ctx.fillStyle = GRANT_COLOR; ctx.fillRect(x - 5, 61, 10, 8); ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 2, 63, 4, 4);
          }
        } else if (i === 6) { // Hailer fires three shells, which land and freeze their target tiles
          const attack = tick % 240, firing = attack >= 60 && attack < 90;
          drawSaturnUnit(ctx, unit('sleet_mortar', { shootTicks: firing ? 30 - (attack - 60) : 0 }), 100, 30, tick);
          for (const x of [50, 100, 150]) {
            if (attack >= 60 && attack < 150) {
              const p = (attack - 60) / 90, size = 34 - p * 10;
              ctx.strokeStyle = '#d6efff'; ctx.lineWidth = 2; ctx.strokeRect(x - size / 2, 94 - size / 2, size, size);
              const sx = Math.round(100 + (x - 100) * p), sy = Math.round(20 + 74 * p - Math.sin(p * Math.PI) * 28);
              ctx.fillStyle = '#7da9f4'; ctx.fillRect(sx - 4, sy - 6, 8, 12); ctx.fillStyle = '#e8fbff'; ctx.fillRect(sx - 2, sy - 4, 4, 8);
            }
            if (attack >= 150) {
              ctx.save(); ctx.translate(x, 94); ctx.scale(.6, .6); drawFrozenTile(ctx, -24, -24, tick); ctx.restore();
              if (attack < 180) { const p = (attack - 150) / 30, r = 6 + p * 14; ctx.globalAlpha = 1 - p; ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 3; ctx.strokeRect(x - r, 94 - r, r * 2, r * 2); ctx.globalAlpha = 1; }
            }
          }
        } else if (i === 5) { // a Frostbiter crouches at a marked tile, pounces, strips your shield and knocks you back
          const p = loop(240), crouch = p < .35, landed = p > .45;
          const bx = landed ? 120 : 60 + Math.max(0, (p - .35) / .1) * 60; drawSaturnUnit(ctx, unit('frostbiter', { frostAct: crouch ? { kind: 'pounce', ticks: 30 - Math.round(p / .35 * 30), tx: 0, ty: 0, fromX: 0, fromY: 0 } : undefined }), bx, 64, tick);
          ctx.strokeStyle = RED_MARK; ctx.lineWidth = 2; if (!landed) ctx.strokeRect(124 - 16, 48, 32, 32);
          const back = landed ? Math.min(1, (p - .45) / .1) : 0; drawGuidePlayer(ctx, 140 + back * 34, 64); if (!landed) shield(140, 64);
          if (p > .45 && p < .6) burst(130, 64, (p - .45) / .15, '#e8fbff');
        } else if (i === 7) { // a Glacier Hulk raises its fists and slams, freezing the ground around it
          const p = loop(240), slamming = p < .4; drawSaturnUnit(ctx, unit('glacier_hulk', { frostAct: slamming ? { kind: 'slam', ticks: 45 - Math.round(p / .4 * 45), tx: 0, ty: 0, fromX: 0, fromY: 0 } : undefined }), 100, 52, tick);
          if (p > .4) { for (const x of [60, 100, 140]) { ctx.save(); ctx.translate(x, 98); ctx.scale(.5, .5); drawFrozenTile(ctx, -24, -24, tick); ctx.restore(); } if (p < .55) burst(100, 90, (p - .4) / .15, '#e8fbff'); }
        }
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [drawBoss, drawFrozenTile]);
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>SATURN CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Break or steal the boss’s frost shield and block her recalls with Absolute Zero.</p>
    {[
      { title: 'GENERAL RULES & SKILLS', indices: [4, 3], skill: true },
      { title: 'ENEMIES', indices: [0, 1, 2, 5, 6, 7], skill: false },
      { title: 'PHASE 2+', indices: [8, 11], skill: false },
      { title: 'PHASE 3', indices: [9, 10], skill: false },
    ].map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
    <h4 className="rs-guide-group-title">{section.title}</h4>
    <div className="rs-nep-grid">
      {section.indices.map(i => { const [title, text] = cards[i]; return <article className="rs-nep-card" key={title} style={{ borderColor: '#a8e8d755' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={200} height={120} aria-hidden="true" />
        <h5 style={{ color: i === 2 ? RECALL_COLOR : '#d2f5ff' }}>{title === 'PRIMAL SKILL' ? `PRIMAL SKILL (${bindingLabel('mapSkill')})` : title}</h5><p>{text}</p>
      </article>; })}
      {section.skill && <CelestialSkillGuideCard name="Saturn Guard" description="Shields you and Ruby, and breaks you out of ice." color="#68e0c9" draw={drawCelestial} />}
    </div></section>)}
  </div>;
}
