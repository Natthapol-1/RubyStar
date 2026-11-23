'use client';
import { useEffect, useRef } from 'react';
import { bindingLabel } from './controls';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawGuidePlayer, drawGuideBullet } from './guide-art';
import { drawLostSoul, drawSoulless, drawToxicSoulless } from './world-themes';
import { SOULLESS_LUNGE } from './constants';

// Singularity rule sheet: only what is new on this map, one small animated picture and one or two lines per card.
const VIOLET = '#b07aff', PALE = '#e8d8ff', GREEN = '#9dff8a', CYAN = '#7fe8ff';
const cards = {
  maws: ['THE MAWS', 'Open now and then to pull everything in. Devourers at the centre are swallowed; touching it hurts you.'],
  jaw: ['THE JAW', 'Opens under you and snaps shut on anything inside.'],
  pole: ['PRIMAL SKILL', 'Gravity Hook: hold to grab an enemy; release to throw it.'],
  devourer: ['SOUL DEVOURER', 'Eats Lost Souls to grow. When full, it bursts into more Devourers.'],
  convergence: ['CONVERGENCE', 'The swarm gathers into one body and explodes. The closer you are, the more it hurts.'],
  soul: ['LOST SOUL', 'Devourers eat it to grow.'],
  soulless: ['SOULLESS', 'Lunges at you and knocks you back.'],
  gas: ['TOXIC GAS', 'Slows you and blurs your view. Devourers that touch it burst.'],
  golden: ['GOLDEN SOUL', 'A Devourer that eats it bursts at once.'],
  shell: ['VOID SHELL', 'Protects a Devourer from the Gravity Hook until you break it.'],
  toxic: ['CONTAMINATED SOULLESS', 'Leaves a toxic trail. Devourers that touch it burst.'],
} as const;
type CardKey = keyof typeof cards;

const SECTIONS: { title: string; keys: CardKey[]; skill?: boolean }[] = [
  { title: 'GENERAL RULES & SKILLS', keys: ['maws', 'jaw', 'pole'], skill: true },
  { title: 'ENEMIES', keys: ['devourer', 'convergence', 'soul', 'soulless'] },
  { title: 'PHASE 2+', keys: ['gas', 'golden'] },
  { title: 'PHASE 3', keys: ['shell', 'toxic'] },
];

type BodyOptions = { scale?: number; original?: boolean; gorge?: number; flash?: boolean; shell?: number };
type BodyPainter = (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, o?: BodyOptions) => void;

// A small Maw: a stepped tile reach with a band sweeping inward, drifting matter and a black centre.
function drawMaw(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tick: number) {
  ctx.save();
  const t = 10, n = Math.floor(r / t), band = n * (1 - (tick * .012) % 1);
  for (let gy = -n; gy <= n; gy++) for (let gx = -n; gx <= n; gx++) {
    const d = Math.hypot(gx, gy); if (d > n) continue;
    ctx.globalAlpha = .18 + .4 * (1 - d / (n + .5)); ctx.fillStyle = '#6a32a8'; ctx.fillRect(x + gx * t - t / 2 + 1, y + gy * t - t / 2 + 1, t - 2, t - 2);
    if (Math.abs(d - band) < .6) { ctx.globalAlpha = .4; ctx.fillStyle = VIOLET; ctx.fillRect(x + gx * t - t / 2 + 2, y + gy * t - t / 2 + 2, t - 4, t - 4); }
  }
  for (let k = 0; k < 10; k++) { const life = (tick * .015 + k / 10) % 1, a = k * 2 + life * 6, d = r * (1 - life); ctx.globalAlpha = Math.sin(life * Math.PI) * .8; ctx.fillStyle = k % 3 ? VIOLET : GREEN; ctx.fillRect(x + Math.cos(a) * d - 2, y + Math.sin(a) * d - 2, 4, 4); }
  ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(x - 9, y - 9, 18, 18); ctx.strokeStyle = PALE; ctx.lineWidth = 2; ctx.strokeRect(x - 10, y - 10, 20, 20);
  ctx.restore();
}
// The real Lost Soul painter, kept from leaking its fading alpha into whatever is drawn next.
function soul(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, id: number, pulled: boolean, golden = false) { ctx.save(); drawLostSoul(ctx, x, y, tick, id, pulled, golden); ctx.restore(); }

export function drawSoullessGuide(ctx:CanvasRenderingContext2D,tick:number) {
  const age=tick%150,attack=age-25,warn=SOULLESS_LUNGE.warningTicks,dash=SOULLESS_LUNGE.tiles*5;
  const tileSize=Math.min(30,120/SOULLESS_LUNGE.tiles),startX=166,span=SOULLESS_LUNGE.tiles*tileSize;
  const progress=Math.max(0,Math.min(1,(attack-warn)/dash));
  const x=age<25?184-age/25*18:startX-progress*span,y=62;
  const hitAge=attack-warn-dash,knock=Math.max(0,Math.min(1,hitAge/8));
  drawGuidePlayer(ctx,startX-span-20-knock*12,y);
  if(attack>=0&&attack<warn){
    const p=attack/warn;
    for(let tile=1;tile<=SOULLESS_LUNGE.tiles;tile++){
      const tx=startX-tile*tileSize,half=tileSize/2-1;ctx.save();ctx.globalAlpha=.08+.12*p;ctx.fillStyle='#c5bcae';ctx.fillRect(tx-half,y-half,half*2,half*2);
      ctx.globalAlpha=.45+.5*p;ctx.strokeStyle='#eee4d2';ctx.lineWidth=2;ctx.strokeRect(tx-half+1,y-half+1,half*2-2,half*2-2);ctx.fillStyle='#eee4d2';ctx.fillRect(tx-4,y-2,8,4);ctx.restore();
    }
  }
  ctx.save();ctx.translate(Math.round(x+(attack>=0&&attack<warn?attack/warn*2:0)),y);ctx.scale(.7,.7);drawSoulless(ctx,0,0,tick,2);ctx.restore();
  if(hitAge>=0&&hitAge<SOULLESS_LUNGE.swipeTicks){
    const p=hitAge/SOULLESS_LUNGE.swipeTicks;ctx.save();ctx.globalAlpha=1-p;ctx.translate(x-16,y);ctx.rotate(-.65+p*1.3);ctx.fillStyle='#eee4d2';ctx.fillRect(-2,-14,4,28);ctx.restore();
  }
}

export default function SingularityGuide({ drawCelestial, drawBody }: { drawCelestial: CelestialGuidePainter; drawBody: BodyPainter }) {
  const refs = useRef<Partial<Record<CardKey, HTMLCanvasElement | null>>>({});
  useEffect(() => {
    let raf = 0, tick = 0, start: number | null = null;
    // Brisk action loops retain a readable result; each Maw has a two-second turn.
    const loop = (n: number) => (tick % n) / n;
    const paint: Record<CardKey, (ctx: CanvasRenderingContext2D) => void> = {
      maws: ctx => { // both Maws open together; a Devourer is dragged into one and vanishes
        const p = loop(180), open = p < .25 ? 0 : Math.sin(Math.min(1, (p - .25) / .7) * Math.PI), r = 18 + 22 * open, drag = Math.max(0, Math.min(1, (p - .3) / .4));
        drawMaw(ctx, 55, 60, r, tick); drawMaw(ctx, 150, 60, r, tick + 50);
        if (drag < 1) drawBody(ctx, 100 - 45 * drag * drag, 60, tick, { scale: .42 * (1 - drag * .7) });
      },
      jaw: ctx => { // a jaw marks the ground under you, snaps shut, and throws you far to the right
        const p = loop(150), warn = p < .45, shut = Math.min(1, Math.max(0, (p - .45) / .06)), fly = Math.min(1, Math.max(0, (p - .5) / .15));
        const r = 30 * (1 - shut * shut);
        if (r > 2) { ctx.fillStyle = '#000'; ctx.fillRect(80 - r, 60 - r, r * 2, r * 2); ctx.strokeStyle = warn ? (Math.floor(tick / 6) % 2 ? '#7dff8a' : '#2fae5e') : '#f0e4ff'; ctx.lineWidth = 3; ctx.strokeRect(80 - r, 60 - r, r * 2, r * 2);
          ctx.fillStyle = '#efe4ff'; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const o of [-.5, 0, .5]) { const fx = 80 + dx * (r - 6) + (dy ? o * r : 0), fy = 60 + dy * (r - 6) + (dx ? o * r : 0); ctx.fillRect(fx - 3, fy - 3, 6, 6); } }
        else if (p < .62) { ctx.fillStyle = '#7dff8a'; ctx.globalAlpha = 1 - (p - .51) / .11; ctx.fillRect(72, 52, 16, 16); ctx.globalAlpha = 1; }
        const px = 72 + fly * 100; drawGuidePlayer(ctx, px, 60);
      },
      pole: ctx => { // you hook a body, tow it, then fling it into the Maw
        const p = loop(180), towing = p < .55, fly = Math.min(1, Math.max(0, (p - .55) / .2));
        drawMaw(ctx, 36, 60, 30, tick);
        const px = 168 - (towing ? p / .55 * 30 : 30), bx = towing ? px + 34 - Math.min(1, p / .2) * 0 : px + 34 - fly * (px + 34 - 36);
        if (towing && p > .08) { ctx.strokeStyle = CYAN; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, 60); ctx.lineTo(bx, 60); ctx.stroke(); for (let k = 1; k < 4; k++) { ctx.fillStyle = k % 2 ? '#e6fbff' : CYAN; ctx.fillRect(px + (bx - px) * k / 4 - 3, 57, 6, 6); } }
        drawGuidePlayer(ctx, px, 60);
        if (fly < 1) { if (!towing) for (let k = 1; k <= 3; k++) { ctx.globalAlpha = .5 - k * .12; ctx.fillStyle = CYAN; ctx.fillRect(bx + k * 10 - 5, 55, 10, 10); } ctx.globalAlpha = 1; drawBody(ctx, bx, 60, tick, { scale: .42 }); }
        else { const q = Math.min(1, (p - .75) / .15); ctx.globalAlpha = 1 - q; ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.strokeRect(36 - 14 - q * 20, 46 - q * 20, 28 + q * 40, 28 + q * 40); ctx.globalAlpha = 1; }
      },
      devourer: ctx => { // a body walks to a soul, eats it and swells with a new stack, then a full one swells to burst
        const p = loop(210);
        if (p < .4) { soul(ctx, 140, 62, tick, 2, false); drawBody(ctx, 60 + p / .4 * 60, 60, tick, { scale: .45 }); }
        else if (p < .65) { const q = Math.min(1, (p - .4) / .1); drawBody(ctx, 120, 60, tick, { scale: .45 + .1 * q, flash: q < .5 }); }
        else drawBody(ctx, 120, 62, tick, { scale: .55, gorge: (p - .65) / .35 });
      },
      convergence: ctx => { // bodies fly into one spot one at a time, it swells, then a square blast rolls out past you
        const p = loop(210), cx = 70, cy = 60, from = [[20, 22], [24, 100], [126, 20], [120, 102]];
        if (p < .55) {
          const q = p / .55, joined = Math.floor(q * from.length);
          from.forEach(([x, y], i) => { if (i < joined) return; const f = i === joined ? (q * from.length) % 1 : 0; drawBody(ctx, x + (cx - x) * f, y + (cy - y) * f, tick, { scale: .3 }); });
          if (joined > 0) drawBody(ctx, cx, cy, tick, { scale: .32 + .1 * joined });
        } else {
          const q = Math.min(1, (p - .55) / .3);
          if (q < .2) { ctx.globalAlpha = 1 - q / .2; ctx.fillStyle = '#f0ffe8'; ctx.fillRect(cx - 26, cy - 26, 52, 52); }
          for (const [lag, col, lw] of [[0, GREEN, 8], [.12, VIOLET, 4]] as const) { const r = 10 + 170 * Math.max(0, q - lag); ctx.globalAlpha = 1 - q; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.strokeRect(cx - r, cy - r, r * 2, r * 2); }
          ctx.globalAlpha = 1;
        }
        const hit = p > .6 && p < .7, px = 168 + (p > .6 ? Math.min(1, (p - .6) / .1) * 14 : 0);
        drawGuidePlayer(ctx, px, 60);
        if (hit) { ctx.globalAlpha = .8; ctx.strokeStyle = '#ff6a6a'; ctx.lineWidth = 3; ctx.strokeRect(px - 13, 47, 26, 26); ctx.globalAlpha = 1; }
      },
      gas: ctx => { // a Devourer walks into a drifting cloud and bursts into copies
        const p = loop(180), cx = 80 + Math.sin(tick * .01) * 6;
        for (let k = 0; k < 9; k++) { const a = k * 2.3 + tick * .01, d = 8 + (k % 3) * 9, size = 14 + (k % 4) * 5; ctx.globalAlpha = .22; ctx.fillStyle = k % 3 ? '#7dff8a' : '#b6ff9a'; ctx.fillRect(cx + Math.cos(a) * d - size / 2, 60 + Math.sin(a) * d * .8 - size / 2, size, size); }
        ctx.globalAlpha = 1;
        if (p < .5) drawBody(ctx, 180 - p / .5 * 80, 60, tick, { scale: .45 });
        else { const q = Math.min(1, (p - .5) / .3); ctx.globalAlpha = 1 - q; ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.strokeRect(100 - 50 * q, 60 - 50 * q, 100 * q, 100 * q); ctx.globalAlpha = 1;
          for (const [tx, ty] of [[30, 28], [176, 96]]) drawBody(ctx, 100 + (tx - 100) * q, 60 + (ty - 60) * q - Math.sin(q * Math.PI) * 14, tick, { scale: .32 }); }
      },
      golden: ctx => { // a body eats a Golden Soul and swells straight to full, its fuse lit
        const p = loop(180);
        if (p < .45) { soul(ctx, 140, 62, tick, 4, false, true); drawBody(ctx, 60 + p / .45 * 80, 60, tick, { scale: .45 }); }
        else drawBody(ctx, 140, 62, tick, { scale: .58, gorge: Math.min(1, (p - .45) / .55), flash: p < .5 });
      },
      soulless: ctx => drawSoullessGuide(ctx,tick),
      toxic: ctx => { // a Contaminated Soulless walks across, leaving gas puffs behind that fade
        const p = loop(180), x = 170 - p * 140;
        for (let i = 0; i < 6; i++) { const at = i / 6, px = 170 - at * 140; if (at > p) break; const age = (p - at) / .5, f = Math.min(1, age * 4) * Math.max(0, 1 - age);
          for (let k = 0; k < 5; k++) { const a = k * 2.3 + i + tick * .01, d = 3 + (k % 3) * 5, size = 10 + (k % 3) * 4; ctx.globalAlpha = .26 * f; ctx.fillStyle = k % 3 ? '#7dff8a' : '#b6ff9a'; ctx.fillRect(px + Math.cos(a) * d - size / 2, 66 + Math.sin(a) * d * .8 - size / 2 - age * 6, size, size); } }
        ctx.globalAlpha = 1; ctx.save(); ctx.translate(Math.round(x), 58); ctx.scale(.7, .7); drawToxicSoulless(ctx, 0, 0, tick, 3); ctx.restore();
      },
      shell: ctx => { // you shoot a shelled Devourer until its shell breaks, then the hook catches it
        const p = loop(180), shell = Math.max(0, 1 - p / .5), broke = p >= .5 && p < .62;
        drawGuidePlayer(ctx, 40, 62);
        if (p < .5) drawGuideBullet(ctx, 56 + ((p * 6) % 1) * 80, 62, 1, 0);
        if (p > .65) { const q = Math.min(1, (p - .65) / .15); ctx.strokeStyle = CYAN; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(48, 62); ctx.lineTo(48 + (140 - 48) * q, 62); ctx.stroke(); }
        drawBody(ctx, 145, 62, tick, { scale: .5, shell, flash: broke });
        if (broke) { const q = (p - .5) / .12; ctx.globalAlpha = 1 - q; ctx.strokeStyle = PALE; ctx.lineWidth = 3; ctx.strokeRect(145 - 18 - q * 16, 62 - 18 - q * 16, 36 + q * 32, 36 + q * 32); ctx.globalAlpha = 1; }
      },
      soul: ctx => { // you shoot a soul and it pops
        const p = loop(120);
        drawGuidePlayer(ctx, 50, 62);
        if (p < .5) { soul(ctx, 140, 62, tick, 3, false); drawGuideBullet(ctx,64+p/.5*70,62,1,0); }
        else if (p < .7) { const q = (p - .5) / .2; ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#c6ffd8'; ctx.lineWidth = 3; ctx.strokeRect(140 - 8 - q * 14, 62 - 8 - q * 14, 16 + q * 28, 16 + q * 28); ctx.globalAlpha = 1; }
      },

    };
    const frame = (now: number) => {
      start ??= now;
      tick = (now-start)*.06;
      (Object.keys(paint) as CardKey[]).forEach(key => {
        const ctx = refs.current[key]?.getContext('2d'); if (!ctx) return;
        ctx.globalAlpha = 1; ctx.clearRect(0, 0, 200, 120); ctx.fillStyle = '#100a18'; ctx.fillRect(0, 0, 200, 120);
        paint[key](ctx);
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [drawBody]);
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>SINGULARITY CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Throw Devourers into the Maws to clear the swarm.</p>
    {SECTIONS.map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
      <h4 className="rs-guide-group-title">{section.title}</h4>
      <div className="rs-nep-grid">
        {section.keys.map(key => { const [title, text] = cards[key]; return <article className="rs-nep-card" key={key} style={{ borderColor: '#b07aff55' }}>
          <canvas ref={el => { refs.current[key] = el; }} width={200} height={120} aria-hidden="true" />
          <h5 style={{ color: key === 'pole' ? CYAN : key === 'golden' ? '#ffd86a' : key === 'gas' || key === 'toxic' ? '#9dff8a' : key === 'shell' ? PALE : '#d5c8f0' }}>{key === 'pole' ? `PRIMAL SKILL (${bindingLabel('mapSkill')})` : title}</h5><p>{text}</p>
        </article>; })}
        {section.skill && <CelestialSkillGuideCard name="Singularity" description="Opens a Maw where you cast it." color="#bcbccd" draw={drawCelestial} />}
      </div></section>)}
  </div>;
}
