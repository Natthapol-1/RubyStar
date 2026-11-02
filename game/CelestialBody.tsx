import type {Trial} from './trials';
// Three-tone pixel shading like the lobby emblems: dark lower-right edge, pale upper-left highlight.
const shade = (size: number, dark: string, light: string) =>
  `inset ${-Math.round(size * .2)}px ${-Math.round(size * .2)}px 0 ${dark}, inset ${Math.round(size * .14)}px ${Math.round(size * .14)}px 0 ${light}`;

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
      <span className="sm-orb" style={{ background: '#ff8a2a', boxShadow: shade(s, '#c94a16', '#ffc06a') }} />
      <span className="sm-core" style={{ width: s * .4, height: s * .4, background: '#fff1a8', boxShadow: 'inset -5px -5px 0 #ffd36a' }} />
    </>;
    case 'venus': return <span className="sm-orb" style={{ background: 'repeating-linear-gradient(170deg, #f5dcc8 0 8px, #e9c3ad 8px 14px)', boxShadow: shade(s, '#b98a72', '#fff3e8') }} />;
    case 'gaia': return <span className="sm-orb" style={{ background:
      'linear-gradient(#78cc4f, #78cc4f) 22% 24% / 34% 22% no-repeat, linear-gradient(#78cc4f, #78cc4f) 62% 66% / 30% 26% no-repeat, linear-gradient(#ffffff, #ffffff) 70% 14% / 22% 8% no-repeat, #2f6fd0',
      boxShadow: shade(s, '#1c4790', '#7fb0ff') }} />;
    case 'moon': return <>
      <span className="sm-orb" style={{ background: '#c6a2ff', boxShadow: `inset ${-Math.round(s * .36)}px 0 0 #4a2d8c, inset 3px 3px 0 #f3e6ff` }} />
      <span className="sm-spot" style={{ left: '22%', top: '30%', width: s * .2, height: s * .2, background: '#a27ee8' }} />
    </>;
    case 'jupiter': return <>
      <span className="sm-orb" style={{ background: 'repeating-linear-gradient(180deg, #e0a36a 0 9px, #b9713f 9px 15px, #f2cf9a 15px 20px)', boxShadow: shade(s, '#7a4322', '#ffe2b8') }} />
      <span className="sm-spot" style={{ left: '56%', top: '56%', width: s * .22, height: s * .13, background: '#c8452f', boxShadow: 'inset -3px -3px 0 #8f2b1c' }} />
    </>;
    case 'saturn': return <>
      <Ring size={s} color="#ddfaff" back="#649fa5" />
      <span className="sm-orb" style={{ background: 'repeating-linear-gradient(180deg, #89e7e4 0 8px, #70b9c4 8px 13px)', boxShadow: shade(s, '#39778a', '#ecfffc') }} />
    </>;
    case 'neptune': return <>
      <span className="sm-orb" style={{ background: '#3f78e8', boxShadow: shade(s, '#1f3e9a', '#9fc0ff') }} />
      <span className="sm-spot" style={{ left: '30%', top: '42%', width: s * .24, height: s * .14, background: '#1b2f78' }} />
    </>;
    case 'sirius': return <>
      <span className="sm-ray sm-ray-h sm-pulse" style={{ background: '#fff6b0' }} /><span className="sm-ray sm-ray-v sm-pulse" style={{ background: '#fff6b0' }} />
      <span className="sm-diamond" style={{ width: s * .56, height: s * .56, background: '#ffe45c', boxShadow: 'inset -6px -6px 0 #c99d1f, inset 4px 4px 0 #fff8c8' }} />
    </>;
    case 'binary': return <>
      <span className="sm-twin-link" />
      <span className="sm-twin sm-orbit-a" style={{ left: '0%', top: '34%', width: s * .5, height: s * .5, background: '#ff8f7a', boxShadow: shade(s * .5, '#b8452f', '#ffd0c4') }} />
      <span className="sm-twin sm-orbit-b" style={{ left: '56%', top: '6%', width: s * .38, height: s * .38, background: '#83cfff', boxShadow: shade(s * .38, '#3f7fb8', '#d8f1ff') }} />
    </>;
    case 'singularity': return <>
      <span className="sm-spot" style={{left:'-12%',top:'8%',width:s*.36,height:s*.32,background:'#43525f',clipPath:'polygon(0 0, 91% 18%, 100% 100%, 18% 64%)'}} />
      <span className="sm-spot" style={{left:'65%',top:'-5%',width:s*.38,height:s*.58,background:'#3d4b5b',clipPath:'polygon(21% 0, 100% 21%, 74% 100%, 0 68%)',boxShadow:'inset 1px 1px 0 #8193a4'}} />
      <span className="sm-spot" style={{left:'57%',top:'62%',width:s*.34,height:s*.3,background:'#647583',clipPath:'polygon(0 0, 100% 25%, 62% 100%, 13% 64%)'}} />
      <span className="sm-spot" style={{left:'-8%',top:'60%',width:s*.48,height:s*.42,background:'#374656',clipPath:'polygon(28% 0, 100% 14%, 72% 100%, 0 75%)'}} />
      <span className="sm-core" style={{width:s*.53,height:s*1.05,background:'#a6b6c5',clipPath:'polygon(30% 0, 80% 26%, 65% 50%, 100% 68%, 31% 100%, 0 74%, 18% 49%, 0 28%)'}} />
      <span className="sm-core" style={{width:s*.45,height:s*.98,background:'#010205',clipPath:'polygon(30% 0, 80% 26%, 65% 50%, 100% 68%, 31% 100%, 0 74%, 18% 49%, 0 28%)',zIndex:3}} />
    </>;
  }
}

export function WorldPortrait({trial}:{trial:Trial}){
 return <div aria-label={trial.name} style={{width:96,height:96,display:'grid',placeItems:'center'}}><span style={{width:52,height:52,position:'relative',display:'block'}}><CelestialBody trial={{...trial,size:52}}/></span></div>;
}
