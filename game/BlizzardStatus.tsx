import type { SaturnState } from './saturn';

export default function BlizzardStatus({saturn:t}:{saturn:SaturnState}){
  const stopped=t.weakTicks>0;
  return <div role="img" aria-label={stopped?'Blizzard stopped':`Blizzard level ${t.level} of 3`} title={stopped?'Blizzard stopped':`Blizzard level ${t.level} of 3`} style={{display:'flex',alignItems:'center',flexShrink:0}}>
    <svg width="42" height="42" viewBox="0 0 40 40" aria-hidden="true">
      {[1,2,3].map(level=><g key={level} transform={`translate(20 21) rotate(${(level-1)*120})`} data-active={!stopped&&level<=t.level} opacity={!stopped&&level<=t.level?1:.22} fill={!stopped&&level<=t.level?'#c8f4ff':'#7a9aa9'}>
        <rect x="-2" y="-16" width="4" height="17"/>
        <g transform="translate(0 -8) rotate(-45)"><rect x="-2" y="-8" width="4" height="8"/></g>
        <g transform="translate(0 -8) rotate(45)"><rect x="-2" y="-8" width="4" height="8"/></g>
        <g transform="translate(0 -3) rotate(-45)"><rect x="-2" y="-7" width="4" height="7"/></g>
        <g transform="translate(0 -3) rotate(45)"><rect x="-2" y="-7" width="4" height="7"/></g>
      </g>)}
    </svg>
  </div>;
}
