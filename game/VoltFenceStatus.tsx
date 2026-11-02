'use client';
import {SvgMapSkillHint} from './MapSpecialSkillHint';
import {bindingLabel} from './controls';
import { JUPITER } from './constants';
export default function VoltFenceStatus({ cooldown }: { cooldown: number }) {
  const ready=cooldown<=0,progress=Math.max(0,1-cooldown/JUPITER.wallCooldown),color=ready?'#8affdc':'#576b76';
  const label=ready?'Volt Fence ready — '+bindingLabel('mapSkill')+' to cast':`Volt Fence recharging — ${Math.ceil(cooldown/60)} seconds`;
  return <div role="img" aria-label={label} title={label} style={{width:42,height:42,flexShrink:0}}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges" style={{width:'100%',height:'100%'}}>
      <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={color} strokeWidth="2" />
      {!ready&&<path d="M20 1H39V39H1V1H20" pathLength="100" fill="none" stroke="#8affdc" strokeWidth="2" strokeDasharray={`${progress*100} 100`} />}
      <g style={{filter:ready?'drop-shadow(0 0 2px #8affdc66)':undefined}}>
        <path d="M19 5H30V9H27V13H24V17H29V21H25V25H21V29H17V33H10V29H13V25H16V21H10V17H13V13H16V9H19Z" fill={color} />
        <path d="M21 7H27V9H24V12H21V15H17V13H19V10H21Z" fill={ready?'#e5fff4':'#7d979a'} />
      </g>
      <SvgMapSkillHint/>
    </svg>
  </div>;
}
