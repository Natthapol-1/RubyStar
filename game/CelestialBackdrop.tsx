import type { CSSProperties } from 'react';

/** Slow, compositor-driven space scenery shared by the two navigation screens. */
export default function CelestialBackdrop({variant='ruby'}:{variant?:'ruby'|'atlas'}) {
  return <div className={'celestial-backdrop cb-'+variant} aria-hidden="true">
    <div className="cb-nebula cb-nebula-a"/><div className="cb-nebula cb-nebula-b"/>
    <div className="cb-galaxy"/><div className="cb-dust"/>
    <svg className="cb-orbits" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
      <ellipse cx="140" cy="1020" rx="1100" ry="710" transform="rotate(-24 140 1020)"/>
      <ellipse cx="140" cy="1020" rx="1140" ry="740" transform="rotate(-24 140 1020)" className="cb-orbit-faint"/>
      <path d="M980 -100 Q1180 110 1690 160"/>
      <path d="M-100 360 Q460 80 1120 220" className="cb-orbit-faint"/>
    </svg>
    <div className="cb-satellite cb-satellite-a"/><div className="cb-satellite cb-satellite-b"/><div className="cb-world"/><div className="cb-moon"/>
    {Array.from({length:74},(_,i)=><i key={i} className={'cb-star'+(i%11===0?' cb-star-bright':'')} style={{left:((i*73.37+11)%100)+'%',top:((i*37.19+7)%100)+'%','--twinkle':(3+i%7)+'s','--delay':(-i*.73)+'s','--alpha':.2+(i%5)*.13} as CSSProperties}/>)}
    <div className="cb-shooting cb-shooting-a"/><div className="cb-shooting cb-shooting-b"/><div className="cb-shooting cb-shooting-c"/>
    <div className="cb-vignette"/>
    <style>{`
      .celestial-backdrop { --space-a:158,42,91; --space-b:61,88,175; --space-star:#b9caff; position:fixed; inset:0; overflow:hidden; pointer-events:none; background:#050811; }
      .cb-atlas { --space-a:75,68,164; --space-b:42,116,154; --space-star:#d1dcff; }
      .cb-nebula { position:absolute; inset:-15%; will-change:transform; }
      .cb-nebula-a { background:radial-gradient(ellipse at 20% 65%,rgba(var(--space-a),.6),transparent 41%),radial-gradient(ellipse at 70% 15%,rgba(var(--space-b),.5),transparent 42%),radial-gradient(ellipse at 55% 65%,rgba(var(--space-a),.16),transparent 48%); animation:cbNebula 22s ease-in-out infinite alternate; }
      .cb-nebula-b { background:radial-gradient(ellipse at 8% 85%,rgba(var(--space-b),.36),transparent 27%),radial-gradient(ellipse at 92% 42%,rgba(var(--space-a),.22),transparent 32%); animation:cbNebula 30s ease-in-out -19s infinite alternate-reverse; }
      .cb-galaxy { position:absolute; inset:-20%; opacity:.65; background:radial-gradient(ellipse at 18% 65%,rgba(var(--space-a),.28),transparent 23%),radial-gradient(ellipse at 38% 48%,rgba(var(--space-b),.3),transparent 20%),radial-gradient(ellipse at 60% 35%,#ac7ed116,transparent 19%),radial-gradient(ellipse at 78% 25%,rgba(var(--space-b),.25),transparent 19%); animation:cbNebula 26s ease-in-out -9s infinite alternate; }
      .cb-satellite { position:absolute; left:0; top:0; width:4px; height:4px; background:#c7dcff; box-shadow:0 0 8px #9cbfff; opacity:.6; offset-rotate:0deg; animation:cbSatellite 24s linear infinite; }
      .cb-satellite-a { offset-path:ellipse(48% 30% at 23% 65%); }.cb-satellite-b { offset-path:ellipse(43% 39% at 76% 24%); animation-duration:32s; animation-delay:-16s; width:3px; height:3px; }
      .cb-dust { position:absolute; inset:0; opacity:.3; background:linear-gradient(156deg,transparent 30%,rgba(185,202,255,0) 40%,#cad1ff08 48%,transparent 55%),repeating-linear-gradient(156deg,transparent 0 58px,#b4baff03 59px,transparent 60px 120px); }
      .cb-orbits { position:absolute; inset:0; width:100%; height:100%; fill:none; stroke:var(--space-star); stroke-width:1; opacity:.16; }
      .cb-orbit-faint { stroke-dasharray:3 13; opacity:.45; animation:cbOrbit 25s linear infinite; }
      .cb-world { position:absolute; width:clamp(420px,53vw,900px); aspect-ratio:1; left:-20%; bottom:-48%; border-radius:50%; background:radial-gradient(circle at 72% 8%,#7485be16,transparent 40%),#060912; border:1px solid #a0b9ed65; animation:cbPlanet 24s ease-in-out infinite alternate; box-shadow:14px -17px 70px rgba(var(--space-b),.2),inset -3px 8px 24px #96aaff14; }
      .cb-moon { position:absolute; width:clamp(110px,16vw,250px); aspect-ratio:1; right:3%; top:5%; border-radius:50%; background:radial-gradient(circle at 25% 25%,#a4beee20,transparent 58%),#080b16; box-shadow:inset 2px 2px 0 #9ea9d13b,inset -20px -9px 40px #02040b,0 0 65px #6b82d40c; opacity:.65; animation:cbPlanet 19s ease-in-out -8s infinite alternate-reverse; }
      .cb-atlas .cb-world { left:auto; right:-15%; bottom:-48%; box-shadow:-14px -17px 70px rgba(var(--space-b),.2),inset 3px 8px 24px #96aaff14; }
      .cb-atlas .cb-moon { right:auto; left:2%; top:20%; width:clamp(100px,13vw,190px); opacity:.4; }
      .cb-star { position:absolute; width:2px; height:2px; background:var(--space-star); opacity:var(--alpha); animation:cbTwinkle var(--twinkle) ease-in-out var(--delay) infinite alternate,cbStarDrift 18s ease-in-out var(--delay) infinite alternate; }
      .cb-star-bright { width:3px; height:3px; background:#ecf3ff; box-shadow:0 0 9px #acbeff80; }
      .cb-star-bright::before,.cb-star-bright::after { content:''; position:absolute; background:#d6e4ff70; }
      .cb-star-bright::before { width:1px; height:11px; left:1px; top:-4px; }.cb-star-bright::after { width:11px; height:1px; left:-4px; top:1px; }
      .cb-shooting { position:absolute; width:150px; height:2px; background:linear-gradient(90deg,transparent,#bcd5ff,#f7fbff); opacity:0; transform:rotate(-25deg); animation:cbShooting 8s linear infinite; }
      .cb-shooting-a { left:15%; top:22%; }.cb-shooting-b { left:60%; top:12%; animation-delay:-7s; animation-duration:11s; width:100px; }
      .cb-shooting-c { left:36%; top:40%; animation-duration:13s; animation-delay:-4s; width:125px; }
      .cb-vignette { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 44%,transparent 25%,#03050b99 100%); }
      @keyframes cbSatellite { to { offset-distance:100%; } }
      @keyframes cbStarDrift { to { transform:translate3d(-25px,14px,0); } }
      @keyframes cbPlanet { to { transform:translate3d(0,-14px,0); } }
      @keyframes cbNebula { from { transform:translate3d(-1%,0,0) scale(1); } to { transform:translate3d(7%,-4%,0) scale(1.12); } }
      @keyframes cbTwinkle { from { opacity:calc(var(--alpha)*.35); } to { opacity:var(--alpha); } }
      @keyframes cbOrbit { to { stroke-dashoffset:-320; } }
      @keyframes cbShooting { 0%,88% { opacity:0; transform:translate3d(-80px,30px,0) rotate(-25deg); } 89% { opacity:.8; } 94%,100% { opacity:0; transform:translate3d(420px,-190px,0) rotate(-25deg); } }
      @media(prefers-reduced-motion:reduce) { .celestial-backdrop *, .celestial-backdrop *::before, .celestial-backdrop *::after { animation:none !important; } .cb-shooting { display:none; } }
    `}</style>
  </div>;
}
