'use client';
import { useEffect, useRef } from 'react';
import { bindingLabel } from './controls';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawGuidePlayer } from './guide-art';
import { drawLostSoul, drawSoulless, drawToxicSoulless } from './world-themes';
import { SOULLESS_LUNGE } from './constants';

// Singularity rule sheet: only what is new on this map, one small animated picture and one or two lines per card.
const VIOLET = '#b07aff', PALE = '#e8d8ff', GREEN = '#9dff8a', CYAN = '#7fe8ff', HEAL = '#8dffb0';
const cards = {
  maws: ['THE MAWS', 'Two black holes take turns opening to pull everything in. They move to new rooms now and then.'],
  swallow: ['SWALLOWED', 'A Devourer a Maw swallows is gone for good and heals you and Ruby.'],
  centre: ['MIND THE CENTRE', 'An open Maw pulls you too. Its centre hurts and throws you out.'],
  jaw: ['THE JAW', 'A jaw opens under you and snaps shut, eating any enemy inside. It throws you away.'],
  pole: ['PRIMAL SKILL', 'Hold to grab a Devourer copy or another mob; release to throw it. Throws deal no damage.'],
  devourer: ['SOUL DEVOURER', 'It runs from you. Each Soul it eats adds a stack. When full, it bursts into more Devourers. Hit it to distract it from souls.'],
  original: ['THE ORIGINAL', 'Each phase starts with a big Devourer that bursts into copies. Periodically, the swarm gathers and explodes across the arena; more bodies mean more damage.'],
  soul: ['SOUL', 'Food for the swarm. Dies in one hit and heals you.'],
  soulless: ['SOULLESS', 'A bone husk that lunges and swipes at you. The swarm won’t eat it.'],
  gnasher: ['GNASHER', 'A Devourer that bites other Devourers, making them burst twice as much.'],
  toxic: ['CONTAMINATED SOULLESS', 'A Soulless full of gas. Where it dies, a gas cloud lingers.'],
  gas: ['TOXIC GAS', 'Clouds slow you and blur your view. A Devourer that touches one bursts.'],
  golden: ['GOLDEN SOUL', 'A Devourer that eats one is filled to full stacks at once.'],
} as const;
type CardKey = keyof typeof cards;

const SECTIONS: { title: string; keys: CardKey[]; skill?: boolean }[] = [
  { title: 'GENERAL RULES & SKILLS', keys: ['maws', 'swallow', 'centre', 'jaw', 'pole'], skill: true },
  { title: 'ENEMIES', keys: ['devourer', 'original', 'soul', 'soulless'] },
  { title: 'PHASE 2+', keys: ['gas', 'golden', 'toxic'] },
  { title: 'PHASE 3', keys: ['gnasher'] },
];

type BodyOptions = { scale?: number; original?: boolean; gorge?: number; flash?: boolean; gnasher?: boolean };
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
function cross(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number) {
  ctx.globalAlpha = alpha; ctx.fillStyle = HEAL; ctx.fillRect(x - 2, y - 6, 4, 12); ctx.fillRect(x - 6, y - 2, 12, 4); ctx.globalAlpha = 1;
}

export function drawSoullessGuide(ctx:CanvasRenderingContext2D,tick:number) {
  const age=tick%180,attack=age-25,warn=SOULLESS_LUNGE.warningTicks,dash=SOULLESS_LUNGE.tiles*5;
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
    let raf = 0, tick = 0;
    // Each card loops slowly (4–6 seconds) and shows one clear idea.
    const loop = (n: number) => (tick % n) / n;
    const paint: Record<CardKey, (ctx: CanvasRenderingContext2D) => void> = {
      maws: ctx => { // the two Maws take turns: one rests small while the other opens wide
        const p = loop(360), a = p < .5, grow = (q: number) => 18 + 26 * Math.sin(Math.min(1, q) * Math.PI);
        drawMaw(ctx, 55, 60, a ? grow(p / .5) : 18, tick); drawMaw(ctx, 148, 60, a ? 18 : grow((p - .5) / .5), tick + 50);
      },
      swallow: ctx => { // a body is dragged into the Maw and vanishes; you and Ruby heal
        const p = loop(300), drag = Math.min(1, p / .6);
        drawMaw(ctx, 70, 60, 44, tick);
        if (p < .6) drawBody(ctx, 70 + 50 * (1 - drag), 60, tick, { scale: .5 * (1 - drag * .7) });
        drawGuidePlayer(ctx, 170, 60);
        if (p > .62) { const q = (p - .62) / .38; cross(ctx, 170, 40 - q * 16, 1 - q); }
      },
      centre: ctx => { // you drift in, touch the centre and are thrown out
        const p = loop(300), fling = p > .55;
        drawMaw(ctx, 80, 60, 44, tick);
        drawGuidePlayer(ctx, fling ? 80 + Math.min(1, (p - .55) / .1) * 75 : 160 - Math.min(1, p / .55) * 80, 60);
        if (fling && p < .7) { ctx.globalAlpha = 1 - (p - .55) / .15; ctx.strokeStyle = '#ff6a6a'; ctx.lineWidth = 3; ctx.strokeRect(68, 48, 24, 24); ctx.globalAlpha = 1; }
      },
      jaw: ctx => { // a jaw marks the ground under you, snaps shut, and throws you far to the right
        const p = loop(300), warn = p < .45, shut = Math.min(1, Math.max(0, (p - .45) / .06)), fly = Math.min(1, Math.max(0, (p - .5) / .15));
        const r = 30 * (1 - shut * shut);
        if (r > 2) { ctx.fillStyle = '#000'; ctx.fillRect(80 - r, 60 - r, r * 2, r * 2); ctx.strokeStyle = warn ? (Math.floor(tick / 6) % 2 ? '#7dff8a' : '#2fae5e') : '#f0e4ff'; ctx.lineWidth = 3; ctx.strokeRect(80 - r, 60 - r, r * 2, r * 2);
          ctx.fillStyle = '#efe4ff'; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const o of [-.5, 0, .5]) { const fx = 80 + dx * (r - 6) + (dy ? o * r : 0), fy = 60 + dy * (r - 6) + (dx ? o * r : 0); ctx.fillRect(fx - 3, fy - 3, 6, 6); } }
        else if (p < .62) { ctx.fillStyle = '#7dff8a'; ctx.globalAlpha = 1 - (p - .51) / .11; ctx.fillRect(72, 52, 16, 16); ctx.globalAlpha = 1; }
        const px = 72 + fly * 100; drawGuidePlayer(ctx, px, 60);
      },
      pole: ctx => { // you hook a body, tow it, then fling it into the Maw
        const p = loop(360), towing = p < .55, fly = Math.min(1, Math.max(0, (p - .55) / .2));
        drawMaw(ctx, 36, 60, 30, tick);
        const px = 168 - (towing ? p / .55 * 30 : 30), bx = towing ? px + 34 - Math.min(1, p / .2) * 0 : px + 34 - fly * (px + 34 - 36);
        if (towing && p > .08) { ctx.strokeStyle = CYAN; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, 60); ctx.lineTo(bx, 60); ctx.stroke(); for (let k = 1; k < 4; k++) { ctx.fillStyle = k % 2 ? '#e6fbff' : CYAN; ctx.fillRect(px + (bx - px) * k / 4 - 3, 57, 6, 6); } }
        drawGuidePlayer(ctx, px, 60);
        if (fly < 1) { if (!towing) for (let k = 1; k <= 3; k++) { ctx.globalAlpha = .5 - k * .12; ctx.fillStyle = CYAN; ctx.fillRect(bx + k * 10 - 5, 55, 10, 10); } ctx.globalAlpha = 1; drawBody(ctx, bx, 60, tick, { scale: .42 }); }
        else { const q = Math.min(1, (p - .75) / .15); ctx.globalAlpha = 1 - q; ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.strokeRect(36 - 14 - q * 20, 46 - q * 20, 28 + q * 40, 28 + q * 40); ctx.globalAlpha = 1; }
      },
      devourer: ctx => { // a body walks to a soul, eats it and swells with a new stack, then a full one swells to burst
        const p = loop(360);
        if (p < .4) { soul(ctx, 140, 62, tick, 2, false); drawBody(ctx, 60 + p / .4 * 60, 60, tick, { scale: .45 }); }
        else if (p < .65) { const q = Math.min(1, (p - .4) / .1); drawBody(ctx, 120, 60, tick, { scale: .45 + .1 * q, flash: q < .5 }); }
        else drawBody(ctx, 120, 62, tick, { scale: .55, gorge: (p - .65) / .35 });
      },
      original: ctx => { // the full original swells, bursts, and flings its copies out
        const p = loop(330);
        if (p < .55) drawBody(ctx, 100, 62, tick, { scale: .6, original: true, gorge: p / .55 });
        else {
          const q = Math.min(1, (p - .55) / .25);
          ctx.globalAlpha = 1 - q; ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.strokeRect(100 - 70 * q, 60 - 70 * q, 140 * q, 140 * q); ctx.strokeStyle = VIOLET; ctx.strokeRect(100 - 45 * q, 60 - 45 * q, 90 * q, 90 * q); ctx.globalAlpha = 1;
          for (const [tx, ty] of [[28, 30], [172, 34], [100, 104]]) drawBody(ctx, 100 + (tx - 100) * q, 60 + (ty - 60) * q - Math.sin(q * Math.PI) * 18, tick, { scale: .38 });
        }
      },
      gas: ctx => { // a Devourer walks into a drifting cloud and bursts into copies
        const p = loop(330), cx = 80 + Math.sin(tick * .01) * 6;
        for (let k = 0; k < 9; k++) { const a = k * 2.3 + tick * .01, d = 8 + (k % 3) * 9, size = 14 + (k % 4) * 5; ctx.globalAlpha = .22; ctx.fillStyle = k % 3 ? '#7dff8a' : '#b6ff9a'; ctx.fillRect(cx + Math.cos(a) * d - size / 2, 60 + Math.sin(a) * d * .8 - size / 2, size, size); }
        ctx.globalAlpha = 1;
        if (p < .5) drawBody(ctx, 180 - p / .5 * 80, 60, tick, { scale: .45 });
        else { const q = Math.min(1, (p - .5) / .3); ctx.globalAlpha = 1 - q; ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.strokeRect(100 - 50 * q, 60 - 50 * q, 100 * q, 100 * q); ctx.globalAlpha = 1;
          for (const [tx, ty] of [[30, 28], [176, 96]]) drawBody(ctx, 100 + (tx - 100) * q, 60 + (ty - 60) * q - Math.sin(q * Math.PI) * 14, tick, { scale: .32 }); }
      },
      golden: ctx => { // a body eats a Golden Soul and swells straight to full, its fuse lit
        const p = loop(300);
        if (p < .45) { soul(ctx, 140, 62, tick, 4, false, true); drawBody(ctx, 60 + p / .45 * 80, 60, tick, { scale: .45 }); }
        else drawBody(ctx, 140, 62, tick, { scale: .58, gorge: Math.min(1, (p - .45) / .55), flash: p < .5 });
      },
      soulless: ctx => drawSoullessGuide(ctx,tick),
      gnasher: ctx => { // a Gnasher rushes a Devourer and bites it; the bitten one bursts into copies
        const p = loop(300), gx = 30 + Math.min(1, p / .45) * 80;
        if (p < .5) { drawBody(ctx, 140, 60, tick, { scale: .42 }); drawBody(ctx, gx, 60, tick, { scale: .42, gnasher: true }); }
        else { const q = Math.min(1, (p - .5) / .3); drawBody(ctx, 110, 60, tick, { scale: .42, gnasher: true }); ctx.globalAlpha = 1 - q; ctx.strokeStyle = GREEN; ctx.lineWidth = 4; ctx.strokeRect(140 - 40 * q, 60 - 40 * q, 80 * q, 80 * q); ctx.globalAlpha = 1;
          for (const [tx, ty] of [[178, 24], [182, 98], [150, 104]]) drawBody(ctx, 140 + (tx - 140) * q, 60 + (ty - 60) * q, tick, { scale: .3 }); }
      },
      toxic: ctx => { // a Contaminated Soulless falls, and its gas cloud lingers where it fell
        const p = loop(300);
        if (p < .45) { ctx.save(); ctx.translate(100, 58); ctx.scale(.7, .7); drawToxicSoulless(ctx, 0, 0, tick, 3); ctx.restore(); }
        else { const f = Math.min(1, (p - .45) / .1) * Math.min(1, (1 - p) / .15); for (let k = 0; k < 12; k++) { const a = k * 2.3 + tick * .008, d = 6 + (k % 4) * 9, size = 16 + (k % 3) * 6; ctx.globalAlpha = .24 * f; ctx.fillStyle = k % 3 ? '#7dff8a' : '#b6ff9a'; ctx.fillRect(100 + Math.cos(a) * d - size / 2, 60 + Math.sin(a) * d * .8 - size / 2, size, size); } ctx.globalAlpha = 1; }
      },
      soul: ctx => { // you shoot a soul; it pops and heals you
        const p = loop(240);
        drawGuidePlayer(ctx, 50, 62);
        if (p < .5) { soul(ctx, 140, 62, tick, 3, false); ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(64 + p / .5 * 70), 60, 8, 4); }
        else cross(ctx, 50, 42 - (p - .5) * 30, 1 - (p - .5) * 2);
      },

    };
    const frame = () => {
      tick++;
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
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Throw the Devourers into the Maws before their swarm grows out of control.</p>
    {SECTIONS.map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
      <h4 className="rs-guide-group-title">{section.title}</h4>
      <div className="rs-nep-grid">
        {section.keys.map(key => { const [title, text] = cards[key]; return <article className="rs-nep-card" key={key} style={{ borderColor: '#b07aff55' }}>
          <canvas ref={el => { refs.current[key] = el; }} width={200} height={120} aria-hidden="true" />
          <h5 style={{ color: key === 'pole' ? CYAN : key === 'golden' ? '#ffd86a' : key === 'gas' || key === 'toxic' ? '#9dff8a' : key === 'gnasher' ? '#efe4d0' : '#d5c8f0' }}>{key === 'pole' ? `PRIMAL SKILL (${bindingLabel('mapSkill')})` : title}</h5><p>{text}</p>
        </article>; })}
        {section.skill && <CelestialSkillGuideCard name="Singularity" description="A black hole that pulls enemies in and swallows Devourers at its centre." color="#bcbccd" draw={drawCelestial} />}
      </div></section>)}
  </div>;
}
