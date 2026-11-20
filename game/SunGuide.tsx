'use client';
import {bindingLabel} from './controls';

import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawFlareSpitter, drawFlareFireball, drawSunburstWarning, drawBurningTile, drawCoolingRipple, drawCoolingStation, drawSunUnit } from './sun-art';
import type { Enemy } from './engine';
import { SUN } from './constants';

const guideCards = () => [
  ['TEMPERATURE', 'At full heat, an eruption damages everyone but the King. Keep the arena cool to prevent it.'],
  ['CINDER WISPS', 'Wisps keep spawning and raise heat while alive. Clear them to keep heat under control.'],
  ['THE KING', 'Chases you or Ruby. Keep hitting him to stop his arena blast, which also spawns wisps.'],
  ['PRIMAL SKILL', 'Hydro Pulse: clears nearby wisps and flames, cools the arena and lowers the King’s rage. It also charges nearby cooling stations.'],
  ['EMBERLINGS', 'Resist damage while burning, and their hits knock you back. Water puts them out, removing their armor and stopping them.'],
  ['COOLING STATIONS', <>Hold {bindingLabel('heal')} nearby to charge. A full station cools the arena, releases water and heals you and Ruby. The King resets nearby stations.</>],
  ['RAGE', 'Builds over time, making the King faster and spawning more wisps. Hit him or use nearby water to reduce it.'],
  ['BURNING TRAIL', 'With enough rage, the King leaves burning ground that damages you and Ruby and raises heat. Water puts it out.'],
  ['EXTINGUISH THE KING', <>Reach zero heat to stun the King and slow other enemies. Get close and cast <strong style={{ color: '#ffe6a6', fontWeight: 800, textShadow: '0 0 5px #ffc75e44' }}>five rapid Hydro Pulses</strong> for heavy damage before he recovers.</>],
  ['SCORCH SAPPER', 'Drains cooling stations, blocks charging and raises heat.'],
  ['SUNBURST', 'A marked room bursts after the countdown, damaging you and Ruby inside and raising arena heat. Use water in that room or Solar Flare anywhere to stop it.'],
  ['FLARE SPITTER', 'Spits three spreading fireballs that leave burning ground. Resists damage until water removes its armor.'],
] as const;

const sections = [
  { title: 'GENERAL RULES & SKILLS', cards: [0, 5, 3, 8], solar: true },
  { title: 'ENEMIES', cards: [2, 6, 1, 4], solar: false },
  { title: 'PHASE 2', cards: [7, 11], solar: false },
  { title: 'PHASE 3', cards: [10, 9], solar: false },
];

export default function SunGuide({ drawCelestial, drawKing }: { drawCelestial: CelestialGuidePainter; drawKing: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number) => void }) {
  const cards = guideCards();
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let tick = 0, raf = 0;
    const frame = () => {
      tick++;
      const rippleTick = tick / 3;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.clearRect(0, 0, 200, 120); ctx.fillStyle = '#1b1112'; ctx.fillRect(0, 0, 200, 120);
        if (i === 0) {
          ctx.fillStyle = '#41261f'; ctx.fillRect(25, 46, 150, 24); ctx.fillStyle = '#ff8a47'; ctx.fillRect(25, 46, 150 * (.5 + (tick % 180) / 360), 24);
        } else if (i === 5) drawCoolingStation(ctx, { id: 0, x: 0, y: 0, charge: Math.min(100, (tick % 200) / 150 * 100), blocked: false }, 100, 65, tick, true);
        else if (i === 3) drawCoolingRipple(ctx, 100, 65, 36 - rippleTick % 36, false, 65);
        else if (i === 8) { // the heat bar drains to zero, then flashes icy white
          const k = tick % 200, heat = k < 130 ? .5 * (1 - k / 130) : 0, flash = k >= 130 ? Math.max(0, 1 - (k - 130) / 50) : 0;
          ctx.fillStyle = '#41261f'; ctx.fillRect(25, 46, 150, 24); ctx.fillStyle = '#ff8a47'; ctx.fillRect(25, 46, 150 * heat, 24);
          if (k >= 130) { ctx.globalAlpha = .35 + .65 * flash; ctx.strokeStyle = '#d8fbff'; ctx.lineWidth = 3; ctx.strokeRect(23, 44, 154, 28); ctx.globalAlpha = flash * .5; ctx.fillStyle = '#bff4ff'; ctx.fillRect(0, 0, 200, 120); ctx.globalAlpha = 1;
            ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#d8fbff'; ctx.fillText('0', 100, 63); }
        }
        else if (i === 7) { // a short burning trail, put out by a water ripple
          const k = tick % 200, out = k >= 140;
          if (!out) for (let j = 0; j < 4; j++) drawBurningTile(ctx, 8 + j * 48, 40, tick, 1, j, 0);
          else drawCoolingRipple(ctx, 100, 64, 36 - (k - 140) / 60 * 36, false, 70);
        }
        else if (i === 6) { // the King's rage glow builds, then a water ripple calms it
          const k = tick % 240, rage = k < 180 ? k / 180 : 1 - (k - 180) / 60 * .6, pulse = .6 + .4 * Math.sin(tick * .2);
          for (let r = 3; r >= 1; r--) { ctx.globalAlpha = rage * pulse * .22 * r / 3; ctx.fillStyle = '#ff4a3a'; const g = 6 + r * 7 * rage; ctx.fillRect(79 - g, 38 - g, 42 + g * 2, 42 + g * 2); }
          ctx.globalAlpha = 1; drawKing(ctx, 100, 59, tick);
          if (k >= 180) drawCoolingRipple(ctx, 100, 59, 36 - (k - 180) / 60 * 36, false, 45);
        }
        else if (i === 10) { // a room glows gold, then water lands in it and it is defused
          const k = tick % 220;
          if (k < 150) drawSunburstWarning(ctx, 20, 16, 160, 88, Math.ceil((1 - k / 150) * SUN.flareWarning), tick, true);
          else drawCoolingRipple(ctx, 100, 60, 36 - (k - 150) / 70 * 36, false, 70);
        }
        else if (i === 9) { // an attached Sapper blocks and drains the cooling station
          const k=tick%240;
          drawCoolingStation(ctx,{id:0,x:0,y:0,charge:Math.max(0,90-k*.35),blocked:true,sapped:true},70,62,tick,false);
          drawSunUnit(ctx,{id:7,type:'scorch_sapper',hp:10,maxHp:10,flashTicks:0,sapStation:0} as Enemy,128,62,tick);
          ctx.strokeStyle='#ffb04a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(116,62);ctx.lineTo(88,62);ctx.stroke();
        }
        else if(i===11){
          const age=tick%210,warn=age<SUN.spitter.warningTicks;
          drawFlareSpitter(ctx,{id:12,type:'flare_spitter',flashTicks:0,spit:warn?{dx:1,dy:0,ticks:SUN.spitter.warningTicks-age}:undefined} as Enemy,45,65,tick);
          if(!warn&&age<80){const d=(age-SUN.spitter.warningTicks)*4;for(const angle of [-SUN.spitter.spread,0,SUN.spitter.spread])drawFlareFireball(ctx,45+Math.cos(angle)*d,65+Math.sin(angle)*d,Math.cos(angle),Math.sin(angle));}
          else if(age>=80&&age<170)drawBurningTile(ctx,144,40,tick,1,3,1);
          else if(age>=170)drawCoolingRipple(ctx,168,64,36-(age-170)/40*36,false,60);
        }
        else if (i === 1 || i === 4) {
          const cold = i === 4 && tick % 180 > 90;
          drawSunUnit(ctx, { id: 1, type: i === 1 ? 'cinder_wisp' : 'emberling', extinguished: cold, flashTicks: 0 } as Enemy, 100, 65, tick);
          if (cold) drawCoolingRipple(ctx, 100, 65, 36 - rippleTick % 36, false, 55);
        } else {
          drawKing(ctx, 100, 55, tick);
          for (let j = 0; j < 3; j++) drawSunUnit(ctx, { id: j, type: 'cinder_wisp', flashTicks: 0 } as Enemy, 40 + j * 60, 100, tick);
        }
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, []);
  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>SUN CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Control the arena temperature, fill cooling stations and keep the King’s rage down.</p>
    {sections.map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
    <h4 className="rs-guide-group-title">{section.title}</h4>
    <div className="rs-nep-grid">
      {section.cards.map(i => { const [title, text] = cards[i]; return <article key={title} className="rs-nep-card" style={{ borderColor: '#ffac5a66' }}>
      <canvas ref={el => { refs.current[i] = el; }} width={200} height={120} aria-hidden="true" />
      <h5 style={{ color: i === 3 || i === 5 || i === 8 ? '#a5efff' : '#ffb46b' }}>{title==='PRIMAL SKILL'?'PRIMAL SKILL ('+bindingLabel('mapSkill')+')':title}</h5><p>{text}</p>
    </article>; })}
      {section.solar && <CelestialSkillGuideCard name="Solar Flare" duration={800} description="Damages all enemies and clears every Cinder Wisp. Also stops Sunbursts from anywhere." color="#ff8c80" draw={drawCelestial} />}
    </div></section>)}
  </div>;
}
