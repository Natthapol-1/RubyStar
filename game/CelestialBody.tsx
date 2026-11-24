import type React from 'react';
import type {Trial} from './trials';
// One flat darker patch along the lower-right edge (no bevel highlight; the pale glint is a separate square).
const shade = (size: number, dark: string, _light?: string) => `inset ${-Math.round(size * .16)}px ${-Math.round(size * .16)}px 0 ${dark}`;
/** A planet body: a chunky stepped silhouette with a bold border in a darker shade of the planet, a flat body and one pale square glint. */
function Orb({ rim, light, style, glint = true, cushion = false, soft = false }: { rim: string; light?: string; style: React.CSSProperties; glint?: boolean; cushion?: boolean; soft?: boolean }) {
  // cushion: the Ruby gemstone's notched-square silhouette (small worlds); soft: a square with two-step rounded corners
  const shape = cushion ? ' sm-cushion' : soft ? ' sm-soft' : '';
  return <><span className={'sm-orb sm-orb-rim' + shape} style={{ background: rim }} /><span className={'sm-orb sm-orb-body' + shape} style={style} />{glint && <span className="sm-glint" style={{ background: light ?? rim }} />}</>;
}

/** A rimmed planet body placed inside the icon box: left/top in %, size in px. */
function OrbAt({ left, top, size, rim, light, style, className, cushion }: { left: string; top: string; size: number; rim: string; light?: string; style: React.CSSProperties; className?: string; cushion?: boolean }) {
  return <span className={'sm-twin' + (className ? ' ' + className : '')} style={{ left, top, width: size, height: size, zIndex: 1 }}><Orb rim={rim} light={light} style={style} cushion={cushion} /></span>;
}

// A flat ring with depth: the back half is drawn before the body, the front half after it.
function Ring({ size, color, back, tilt = -14 }: { size: number; color: string; back: string; tilt?: number }) {
  const style = { width: size * 1.9, height: size * .46, borderWidth: Math.max(4, Math.round(size * .09)), transform: `translate(-50%, -50%) rotate(${tilt}deg)` };
  return <><span className="sm-ring sm-ring-back" style={{ ...style, borderColor: back }} /><span className="sm-ring-slot" /><span className="sm-ring sm-ring-front" style={{ ...style, borderColor: color }} /></>;
}

// Blocky pixel art for each celestial body, built from CSS blocks.
export default function CelestialBody({ trial }: { trial: Trial }) {
  const s = trial.size;
  switch (trial.id) {
    case 'sun': return <>
      <span className="sm-ray sm-ray-h sm-pulse" /><span className="sm-ray sm-ray-v sm-pulse" />
      <Orb rim="#d0602a" light="#ffd27a" style={{ background: '#ff8a2a', boxShadow: shade(s, '#c94a16', '#ffc06a') }} />
      <span className="sm-core" style={{ width: s * .4, height: s * .4, background: '#fff1a8', boxShadow: 'inset -5px -5px 0 #ffd36a' }} />
    </>;
    case 'venus': return <Orb soft rim="#c0927c" light="#fff3e8" style={{ background: 'repeating-linear-gradient(180deg, #f5dcc8 0 11px, #e9c3ad 11px 17px)', boxShadow: shade(s, '#b98a72', '#fff3e8') }} />;
    case 'gaia': return <Orb soft rim="#2e5cb0" light="#9fd0ff" style={{ background:
      'linear-gradient(#78cc4f, #78cc4f) 22% 24% / 34% 22% no-repeat, linear-gradient(#78cc4f, #78cc4f) 62% 66% / 30% 26% no-repeat, linear-gradient(#ffffff, #ffffff) 70% 14% / 22% 8% no-repeat, #2f6fd0',
      boxShadow: shade(s, '#1c4790', '#7fb0ff') }} />;
    case 'moon': return <> {/* the Ruby gemstone's notched-square silhouette with the Moon's own surface: a dark side and a crater */}
      <OrbAt left="-11%" top="-11%" size={s * 1.22} cushion rim="#7a58c4" light="#e6d4ff" style={{ background: '#c6a2ff', boxShadow: `inset ${-Math.round(s * .42)}px 0 0 #4a2d8c` }} />
      <span className="sm-spot" style={{ left: '18%', top: '26%', width: s * .22, height: s * .22, background: '#a27ee8', zIndex: 2 }} />
    </>;
    case 'jupiter': return <>
      <Orb rim="#9a5a30" light="#ffe2b8" style={{ background: 'repeating-linear-gradient(180deg, #e0a36a 0 13px, #b9713f 13px 21px, #f2cf9a 21px 28px)', boxShadow: shade(s, '#7a4322', '#ffe2b8') }} />
      <span className="sm-spot" style={{ left: '56%', top: '56%', width: s * .22, height: s * .13, background: '#c8452f', boxShadow: 'inset -3px -3px 0 #8f2b1c' }} />
    </>;
    case 'saturn': return <>
      <Ring size={s} color="#ddfaff" back="#649fa5" />
      <Orb rim="#4a8f9c" light="#ecfffc" style={{ background: 'repeating-linear-gradient(180deg, #89e7e4 0 11px, #70b9c4 11px 17px)', boxShadow: shade(s, '#39778a', '#ecfffc') }} />
    </>;
    case 'neptune': return <>
      <Orb soft rim="#2f55b8" light="#9fc0ff" style={{ background: '#3f78e8', boxShadow: shade(s, '#1f3e9a', '#9fc0ff') }} />
      <span className="sm-spot" style={{ left: '30%', top: '42%', width: s * .24, height: s * .14, background: '#1b2f78' }} />
    </>;
    case 'sirius': return <> {/* a bright star in the click-star style: solid gold compass bars, a pale yellow core with a white top-left in a dark-bordered gold square, four diagonal sparks */}
      <span className="sm-ray sm-ray-h sm-pulse" style={{ background: '#ffe680', width: '190%', height: Math.max(4, Math.round(s * .12)), boxShadow: '0 0 5px #ffd24a' }} />
      <span className="sm-ray sm-ray-v sm-pulse" style={{ background: '#ffe680', height: '190%', width: Math.max(4, Math.round(s * .12)), boxShadow: '0 0 5px #ffd24a' }} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => <span key={i} className="sm-spot sm-pulse" style={{ left: `calc(50% + ${dx * s * .3}px - ${s * .06}px)`, top: `calc(50% + ${dy * s * .3}px - ${s * .06}px)`, width: s * .12, height: s * .12, background: '#fff3b0' }} />)}
      <span className="sm-core" style={{ width: s * .42, height: s * .42, background: '#ffe680', clipPath: 'none', zIndex: 2, boxShadow: '0 0 0 3px #d29a2a, 0 0 6px #fff6c8' }} />
      <span className="sm-core" style={{ width: s * .26, height: s * .26, background: '#ffffff', clipPath: 'none', zIndex: 3, boxShadow: `inset ${-Math.round(s * .12)}px ${-Math.round(s * .12)}px 0 #fff8d2` }} />
    </>;
    case 'binary': return <> {/* two small stars in the Ruby gemstone's notched-square silhouette, coral and blue, on a dashed link */}
      <span className="sm-twin-link" />
      <OrbAt className="sm-orbit-a" left="-6%" top="30%" size={s * .62} cushion rim="#c04a36" light="#ffd0c4" style={{ background: '#ff8f7a', boxShadow: shade(s * .62, '#b8452f', '#ffd0c4') }} />
      <OrbAt className="sm-orbit-b" left="54%" top="0%" size={s * .48} cushion rim="#3d82c0" light="#d8f1ff" style={{ background: '#83cfff', boxShadow: shade(s * .48, '#3f7fb8', '#d8f1ff') }} />
    </>;
    case 'singularity': return <> {/* a black hole, as in the map's backdrop: a black stepped core with a pale violet photon-ring edge, radiating layers of violet light and a few bright streak blocks */}
      <span className="sm-orb sm-soft sm-halo sm-pulse" style={{ inset: '-46%', background: '#3a1d6a40' }} />
      <span className="sm-orb sm-soft sm-halo sm-pulse" style={{ inset: '-30%', background: '#4b28885c', animationDelay: '-.8s' }} />
      <span className="sm-orb sm-soft sm-halo" style={{ inset: '-15%', background: '#62399f73' }} />
      <Orb soft rim="#e2d4ff" glint={false} style={{ background: '#030208', boxShadow: `inset 0 0 0 ${Math.round(s * .07)}px #120c22` }} />
      <span className="sm-spot" style={{ left: '-30%', top: '44%', width: s * .14, height: 3, background: '#9dff8a' }} />
      <span className="sm-spot" style={{ left: '112%', top: '30%', width: s * .12, height: 3, background: '#c8a8ff' }} />
      <span className="sm-spot" style={{ left: '40%', top: '-30%', width: 3, height: s * .12, background: '#c8a8ff' }} />
      <span className="sm-spot" style={{ left: '62%', top: '116%', width: 3, height: s * .1, background: '#9dff8a' }} />
    </>;
  }
}

export function WorldPortrait({trial}:{trial:Trial}){
 return <div aria-label={trial.name} style={{width:96,height:96,display:'grid',placeItems:'center'}}><span style={{width:52,height:52,position:'relative',display:'block'}}><CelestialBody trial={{...trial,size:52}}/></span></div>;
}
