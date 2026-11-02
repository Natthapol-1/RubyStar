'use client';
import { SvgMapSkillHint } from './MapSpecialSkillHint';
import { bindingLabel } from './controls';
import { SATURN, type SaturnState } from './saturn';

export default function SnowballStatus({saturn:t}:{saturn:SaturnState}){
  const ready=t.cooldown<=0,color=ready?'#c7f6ff':'#637e91';
  const progress=t.charging?t.charge/SATURN.chargeTicks:1-t.cooldown/SATURN.cooldown;
  const label=t.charging?'Snowball charging — release to roll':t.roll?'Snowball rolling — attack to cancel':ready?'Snowball — hold '+bindingLabel('mapSkill')+', release to roll':`Snowball recharging — ${Math.ceil(t.cooldown/60)}s`;
  return <div role="img" aria-label={label} title={label} style={{width:42,height:42,flexShrink:0}}>
      <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges" style={{width:'100%',height:'100%'}}>
        <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={color} strokeWidth="2"/>
        <path d="M20 1H39V39H1V1H20" pathLength="100" fill="none" stroke="#dbffff" strokeWidth="2" strokeDasharray={`${Math.max(0,progress)*100} 100`}/>
        <path d="M14 7H26V11H30V24H26V28H14V24H10V11H14Z" fill={color}/>
        <path d="M15 9H24V12H16V17H12V12H15Z" fill="#ffffff"/>
        <path d="M24 18H28V23H24V26H16V23H24Z" fill="#77bacc"/>
        <SvgMapSkillHint/>
      </svg>
  </div>;
}
