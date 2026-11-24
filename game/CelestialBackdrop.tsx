'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { playUiSfx } from './ui-sfx';

// A circle built from stacked axis-aligned rows (the stepped outline planets have in game), as a CSS polygon.
function steppedCircle(rows: number, n = 2) { // n > 2 gives a rounded square (superellipse) with straighter sides
  const right: string[] = [], left: string[] = [], h = 100 / rows;
  for (let k = 0; k < rows; k++) {
    const y0 = k * h, y1 = (k + 1) * h, mid = (y0 + y1) / 2, w = 50 * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(mid - 50) / 50, n)), 1 / n);
    right.push(`${(50 + w).toFixed(2)}% ${y0.toFixed(2)}%`, `${(50 + w).toFixed(2)}% ${y1.toFixed(2)}%`);
    left.unshift(`${(50 - w).toFixed(2)}% ${y1.toFixed(2)}%`, `${(50 - w).toFixed(2)}% ${y0.toFixed(2)}%`);
  }
  return `polygon(${[...right, ...left].join(',')})`;
}
// Blocky asteroid outlines (irregular stepped polygons), each drifting across the sky while it turns as one solid shape.
const ROCKS = [
  'polygon(20% 0,70% 0,70% 15%,100% 15%,100% 70%,80% 70%,80% 100%,25% 100%,25% 85%,0 85%,0 25%,20% 25%)',
  'polygon(30% 0,85% 0,85% 30%,100% 30%,100% 80%,60% 80%,60% 100%,10% 100%,10% 60%,0 60%,0 20%,30% 20%)',
  'polygon(15% 10%,60% 10%,60% 0,100% 0,100% 55%,85% 55%,85% 100%,35% 100%,35% 80%,0 80%,0 35%,15% 35%)',
];
// Sky events: one random thing crosses the sky now and then, with its own direction, height and speed.
type SkyKind = 'shooting' | 'comet' | 'satellite' | 'asteroid';
type SkyEvent = { id: number; kind: SkyKind; x: number; y: number; dx: number; dy: number; angle: number; dur: number; size: number; tilt: number; rock: number };
const KINDS: [SkyKind, number][] = [['shooting', .35], ['comet', .2], ['satellite', .25], ['asteroid', .2]];
const DURATION: Record<SkyKind, [number, number]> = { shooting: [1.2, 1.8], comet: [9, 13], satellite: [28, 40], asteroid: [32, 48] };
function makeEvent(id: number): SkyEvent {
  let roll = Math.random(), kind: SkyKind = 'shooting';
  for (const [k, w] of KINDS) { if (roll < w) { kind = k; break; } roll -= w; }
  const leftward = Math.random() < .5, tiltDeg = (Math.random() * 2 - 1) * (kind === 'shooting' ? 30 : 20) + (kind === 'shooting' ? 18 : 6);
  const angle = (leftward ? 180 - tiltDeg : tiltDeg), rad = angle * Math.PI / 180;
  const dist = kind === 'shooting' ? 30 + Math.random() * 20 : 125; // in vw
  const [lo, hi] = DURATION[kind];
  const x = kind === 'shooting' ? 15 + Math.random() * 70 : leftward ? 108 : -8, y = 4 + Math.random() * (kind === 'shooting' ? 40 : 52);
  return { id, kind, x, y, dx: Math.cos(rad) * dist, dy: Math.sin(rad) * dist, angle, dur: lo + Math.random() * (hi - lo),
    size: kind === 'asteroid' ? 18 + Math.random() * 24 : kind === 'satellite' ? .7 + Math.random() * .4 : 1, tilt: Math.round((Math.random() * 2 - 1) * 35), rock: Math.floor(Math.random() * 3) };
}
const HORIZON = steppedCircle(360), WORLD = steppedCircle(14); // the horizon's rows are about 6px tall: a fine stepped arc
const hashed = (i: number, k: number) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n); };
// Three depths of square stars: far (dim, slow), middle and near (larger, brighter, faster).
// Values are rounded so the server-rendered styles match the browser's exactly (no hydration mismatch).
const r2 = (n: number) => Math.round(n * 100) / 100;
const STARS = Array.from({ length: 90 }, (_, i) => ({ x: r2(hashed(i, 1) * 100), y: r2(hashed(i, 2) * 78), depth: i % 3, twinkle: r2(3 + hashed(i, 3) * 5), delay: r2(-hashed(i, 4) * 8) }));
const MOTES = Array.from({ length: 14 }, (_, i) => ({ x: r2(4 + hashed(i, 6) * 92), delay: r2(-hashed(i, 7) * 18), speed: r2(14 + hashed(i, 8) * 10), size: 2 + (i % 3) }));

/**
 * Shared navigation backdrop, in the game's blocky neon style: a deep gradient sky, the stepped rim of a huge planet
 * rising from the bottom edge with a glowing atmosphere, a small ringed world, square stars in three depths and a few
 * rising motes. 'ruby' (lobby) is rose and violet; 'atlas' (star map) is blue and teal.
 */
export default function CelestialBackdrop({variant='ruby',interactive=true}:{variant?:'ruby'|'atlas';interactive?:boolean}) {
  // Clicking empty background lights a bright yellow star at that spot for a moment.
  const [bursts,setBursts]=useState<{id:number;x:number;y:number}[]>([]);
  const [events,setEvents]=useState<SkyEvent[]>([]);
  useEffect(()=>{ // every 9–20 seconds, one random sky event (at most two at once)
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
    let next=0,timer:ReturnType<typeof setTimeout>;
    const schedule=(wait:number)=>{timer=setTimeout(()=>{
      const ev=makeEvent(next++);
      setEvents(list=>list.length>=2?list:[...list,ev]);
      setTimeout(()=>setEvents(list=>list.filter(e=>e.id!==ev.id)),ev.dur*1000+200);
      schedule(9000+Math.random()*11000);
    },wait);};
    schedule(2500+Math.random()*4000);
    return()=>clearTimeout(timer);
  },[]);
  useEffect(()=>{
    if(!interactive)return;
    let next=0;
    const onDown=(e:PointerEvent)=>{
      if(e.button!==0)return;
      const target=e.target as Element|null;
      if(target?.closest('button,a,input,select,textarea,label,dialog,[role="dialog"],canvas,.rs-card,.sm-node,.sm-panel,.sm-map .sm-toast'))return;
      const id=next++;setBursts(list=>[...list.slice(-5),{id,x:e.clientX,y:e.clientY}]);playUiSfx('gemPassive'); // a gem chime with the flash
      setTimeout(()=>setBursts(list=>list.filter(b=>b.id!==id)),700);
    };
    window.addEventListener('pointerdown',onDown);
    return()=>window.removeEventListener('pointerdown',onDown);
  },[interactive]);
  return <div className={'celestial-backdrop cb-'+variant} aria-hidden="true">
    <div className="cb-sky"/>
    {STARS.map((s,i)=><i key={i} className={'cb-star cb-depth-'+s.depth+(i%17===0?' cb-star-bright':'')} style={{left:s.x+'%',top:s.y+'%','--twinkle':s.twinkle+'s','--delay':s.delay+'s'} as CSSProperties}/>)}
    <div className="cb-world">
      <div className="cb-ring cb-ring-back"/>
      <div className="cb-world-disc" style={{clipPath:WORLD}}><i/></div>
      <div className="cb-ring cb-ring-front"/>
    </div>
    <div className="cb-glow"/>
    <div className="cb-horizon">
      <div className="cb-air cb-air-3" style={{clipPath:HORIZON}}/>
      <div className="cb-air cb-air-2" style={{clipPath:HORIZON}}/>
      <div className="cb-air cb-air-1" style={{clipPath:HORIZON}}/>
      <div className="cb-rim" style={{clipPath:HORIZON}}/>
      <div className="cb-ground" style={{clipPath:HORIZON}}><i className="cb-band cb-band-a"/><i className="cb-band cb-band-b"/><i className="cb-band cb-band-c"/></div>
    </div>
    {MOTES.map((m,i)=><i key={i} className="cb-mote" style={{left:m.x+'%',width:m.size,height:m.size,'--delay':m.delay+'s','--speed':m.speed+'s'} as CSSProperties}/>)}
    {events.map(ev=><div key={ev.id} className={'cb-event cb-'+ev.kind} style={{left:ev.x+'vw',top:ev.y+'vh','--dx':ev.dx.toFixed(1)+'vw','--dy':ev.dy.toFixed(1)+'vw','--dur':ev.dur.toFixed(2)+'s'} as CSSProperties}>
      {ev.kind==='shooting'&&<div className="cb-heading" style={{transform:`rotate(${ev.angle}deg)`}}><i className="cb-streak"/></div>}
      {ev.kind==='comet'&&<div className="cb-heading" style={{transform:`rotate(${ev.angle}deg)`}}><i className="cb-smoke"/><i className="cb-fire cb-fire-red"/><i className="cb-fire cb-fire-orange"/><i className="cb-fire cb-fire-yellow"/><span className="cb-stone"/></div>}
      {ev.kind==='satellite'&&<div className="cb-sat" style={{transform:`rotate(${ev.tilt}deg) scale(${ev.size.toFixed(2)})`}}><i className="cb-panel"/><i className="cb-body"><u/></i><i className="cb-panel"/><b/></div>}
      {ev.kind==='asteroid'&&<div className="cb-rock" style={{width:ev.size,height:ev.size,clipPath:ROCKS[ev.rock],animationDuration:(ev.dur/2).toFixed(1)+'s'}}><u/><u/></div>}
    </div>)}
    {bursts.map(b=><div key={b.id} className="cb-burst" style={{left:b.x,top:b.y}}><i className="cb-burst-h"/><i className="cb-burst-v"/><i className="cb-burst-d"/><i className="cb-burst-core"/></div>)}
    <style>{`
      .celestial-backdrop { --sky-top:#07061a; --sky-mid:#14092a; --sky-low:#2a0f33; --glow:255,92,150; --rim:#ff8fb8; --air:255,79,139; --ground:#0b0717; --band:#130b22;
        --world:#3a2a6e; --world-rim:#b9a3ff; --ring:#e2d6ff; --star:#e9e6ff;
        position:fixed; inset:0; overflow:hidden; pointer-events:none; background:var(--sky-top); }
      .cb-atlas { --sky-top:#050a1c; --sky-mid:#0a1230; --sky-low:#0b2440; --glow:96,200,255; --rim:#8fe0ff; --air:64,170,240; --ground:#06101c; --band:#0a1828;
        --world:#5a3a7c; --world-rim:#e2b8ff; --ring:#ffd9f0; --star:#e3efff; }
      .cb-sky { position:absolute; inset:0; background:linear-gradient(180deg,var(--sky-top) 0%,var(--sky-mid) 52%,var(--sky-low) 100%); }
      /* Square stars: the far layer is tiny and dim, the near layer larger and brighter; each layer drifts at its own pace. */
      .cb-star { position:absolute; background:var(--star); animation:cbTwinkle var(--twinkle) ease-in-out var(--delay) infinite alternate, cbDrift 60s linear var(--delay) infinite alternate; }
      .cb-depth-0 { width:1px; height:1px; opacity:.45; --dx:-10px; }
      .cb-depth-1 { width:2px; height:2px; opacity:.6; --dx:-22px; }
      .cb-depth-2 { width:3px; height:3px; opacity:.85; --dx:-40px; }
      .cb-star-bright { width:3px; height:3px; opacity:1; box-shadow:0 0 4px var(--star); }
      .cb-star-bright::before, .cb-star-bright::after { content:''; position:absolute; background:var(--star); opacity:.55; }
      .cb-star-bright::before { left:1px; top:-5px; width:1px; height:13px; } .cb-star-bright::after { left:-5px; top:1px; width:13px; height:1px; }
      /* A small ringed world: a stepped disc with a lit edge and a flat ring bar passing behind and in front of it. */
      .cb-world { position:absolute; right:9%; top:12%; width:clamp(70px,8vw,130px); aspect-ratio:1; animation:cbFloat 14s ease-in-out infinite alternate; }
      .cb-atlas .cb-world { right:2.5%; top:3%; width:clamp(56px,6vw,96px); }
      .cb-world-disc { position:absolute; inset:0; background:var(--world-rim); }
      .cb-world-disc > i { position:absolute; inset:2px 2px 2px 2px; clip-path:inherit; background:linear-gradient(180deg,transparent 0 30%,#00000033 30% 38%,transparent 38% 58%,#00000040 58% 64%,transparent 64%),var(--world);
        box-shadow:inset -14px -14px 0 #00000055; }
      .cb-ring { position:absolute; left:-38%; top:42%; width:176%; height:16%; border:3px solid var(--ring); box-sizing:border-box; transform:rotate(-16deg); opacity:.85; }
      .cb-ring-back { clip-path:inset(0 0 50% 0); opacity:.4; } .cb-ring-front { clip-path:inset(50% 0 0 0); }
      /* The horizon: a huge planet whose stepped rim rises from the bottom edge, with three layers of glowing air above it. */
      .cb-glow { position:absolute; left:-10%; right:-10%; bottom:0; height:46%; background:linear-gradient(0deg,rgba(var(--glow),.26) 0%,rgba(var(--glow),.08) 45%,transparent 100%); }
      .cb-horizon { position:absolute; left:50%; bottom:calc(-1 * clamp(1500px,160vw,2600px) + clamp(70px,11vh,120px)); width:clamp(1500px,160vw,2600px); aspect-ratio:1; transform:translateX(-50%); }
      .cb-air, .cb-rim, .cb-ground { position:absolute; }
      .cb-air-3 { inset:-54px; background:rgba(var(--air),.07); } .cb-air-2 { inset:-32px; background:rgba(var(--air),.1); } .cb-air-1 { inset:-14px; background:rgba(var(--air),.16); }
      .cb-rim { inset:0; background:var(--rim); filter:drop-shadow(0 0 6px rgba(var(--glow),.8)); }
      .cb-ground { inset:3px; background:var(--ground); overflow:hidden; }
      .cb-band { position:absolute; left:0; right:0; background:var(--band); } .cb-band-a { top:3%; height:1.2%; } .cb-band-b { top:6%; height:.7%; } .cb-band-c { top:9%; height:2%; }
      /* Motes rise slowly from the horizon and fade, like the game's small square sparks. */
      .cb-mote { position:absolute; bottom:8%; background:rgb(var(--glow)); opacity:0; animation:cbRise var(--speed) linear var(--delay) infinite; }
      /* Sky events travel by (--dx, --dy) over --dur, fading in and out; each is drawn heading the way it moves. */
      .cb-event { position:absolute; opacity:0; animation:cbTravel var(--dur) linear forwards; }
      .cb-heading { display:flex; align-items:center; transform-origin:100% 50%; position:absolute; right:0; top:0; }
      /* Shooting star: one solid band with a square pale head. */
      .cb-streak { display:block; width:130px; height:2px; background:linear-gradient(90deg,transparent,var(--star)); position:relative; }
      .cb-streak::after { content:''; position:absolute; right:-2px; top:-1px; width:4px; height:4px; background:#ffffff; }
      /* Comet: a blocky stone head with a flickering fire trail (yellow at the stone, then orange, red and fading smoke). */
      .cb-fire { display:block; animation:cbFlicker .22s steps(2) infinite alternate; }
      .cb-smoke { display:block; width:34px; height:3px; background:#6a5f6e; opacity:.35; }
      .cb-fire-red { width:22px; height:5px; background:#e8452f; opacity:.75; }
      .cb-fire-orange { width:16px; height:7px; background:#ff9a3a; box-shadow:0 0 4px #ff7a2a; animation-delay:-.1s; }
      .cb-fire-yellow { width:10px; height:9px; background:#ffe27a; box-shadow:0 0 6px #ffb84a; animation-delay:-.05s; }
      .cb-stone { display:block; width:12px; height:12px; background:#7d6f66; box-shadow:inset 2px 2px 0 #b3a497,inset -3px -3px 0 #43393a;
        clip-path:polygon(20% 0,80% 0,80% 15%,100% 15%,100% 80%,85% 80%,85% 100%,15% 100%,15% 85%,0 85%,0 20%,20% 20%); }
      /* Satellite: muted to the sky's palette: a pale grey body, two dark slate panels with faint lines, an antenna and a small blinking light; held at a random tilt. */
      .cb-sat { display:flex; align-items:center; gap:2px; position:relative; opacity:.8; }
      .cb-sat > .cb-panel { display:block; width:16px; height:8px; background:repeating-linear-gradient(90deg,#2c3048 0 4px,#1c1f33 4px 5px); box-shadow:inset 0 0 0 1px #6c7396; }
      .cb-sat > .cb-body { position:relative; display:block; width:7px; height:10px; background:#a9a6bd; box-shadow:inset -2px -2px 0 #5f5c75; }
      .cb-sat > .cb-body > u { position:absolute; left:2px; top:-5px; width:2px; height:5px; background:#8a87a0; }
      .cb-sat > b { position:absolute; left:18px; top:-7px; width:2px; height:2px; background:#ffb3c8; animation:cbBlink 1.6s steps(1) infinite; }
      /* Asteroid: a blocky rock with a lit upper-left edge, a shaded lower-right side and two craters, turning as one solid shape. */
      .cb-rock { position:relative; background:#5d5566; box-shadow:inset 3px 3px 0 #8f86a0,inset -4px -4px 0 #332c3d; animation:cbSpin 20s linear infinite; opacity:.85; }
      .cb-rock u { position:absolute; background:#433b4f; } .cb-rock u:first-child { left:30%; top:34%; width:22%; height:22%; } .cb-rock u:last-child { left:58%; top:58%; width:14%; height:14%; }
      /* Click star: a compass star of solid yellow bars with a white core and four diagonal sparks, flaring then fading. */
      .cb-burst { position:fixed; width:0; height:0; z-index:1; animation:cbBurst .6s ease-out forwards; }
      .cb-burst > i { position:absolute; background:#ffe680; box-shadow:0 0 6px #ffd24a; }
      .cb-burst-h { left:-34px; top:-2px; width:68px; height:4px; } .cb-burst-v { left:-2px; top:-34px; width:4px; height:68px; }
      .cb-burst-d { left:-6px; top:-6px; width:12px; height:12px; background:transparent !important; box-shadow:-14px -14px 0 -4px #fff3b0,14px -14px 0 -4px #fff3b0,-14px 14px 0 -4px #fff3b0,14px 14px 0 -4px #fff3b0 !important; }
      .cb-burst-core { left:-7px; top:-7px; width:14px; height:14px; background:#ffffff !important; box-shadow:0 0 6px #fff6c8,0 0 0 4px #ffe680 !important; }
      @keyframes cbBurst { 0% { opacity:0; transform:scale(.3); } 18% { opacity:1; transform:scale(1.15); } 45% { opacity:1; transform:scale(1); } 100% { opacity:0; transform:scale(.6); } }
      @keyframes cbSpin { to { transform:rotate(360deg); } }
      @keyframes cbTravel { 0% { opacity:0; transform:translate3d(0,0,0); } 8% { opacity:1; } 90% { opacity:1; } 100% { opacity:0; transform:translate3d(var(--dx),var(--dy),0); } }
      @keyframes cbFlicker { from { filter:brightness(1); } to { filter:brightness(1.35); transform:scaleY(.8); } }
      @keyframes cbBlink { 50% { opacity:0; } }
      @keyframes cbTwinkle { from { filter:brightness(.55); } to { filter:brightness(1.15); } }
      @keyframes cbDrift { to { transform:translate3d(var(--dx),0,0); } }
      @keyframes cbFloat { to { transform:translate3d(0,-12px,0); } }
      @keyframes cbRise { 0% { opacity:0; transform:translate3d(0,0,0); } 15% { opacity:.7; } 100% { opacity:0; transform:translate3d(0,-38vh,0); } }
      @media(prefers-reduced-motion:reduce) { .celestial-backdrop *:not(.cb-burst), .celestial-backdrop *::before, .celestial-backdrop *::after { animation:none !important; } .cb-mote, .cb-event { display:none; } .cb-burst { animation-duration:.3s; } }
    `}</style>
  </div>;
}
