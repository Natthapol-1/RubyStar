'use client';
import {SvgMapSkillHint} from './MapSpecialSkillHint';
import {bindingLabel} from './controls';

export default function TetherStatus({cooldown,totalCooldown,active=false}:{cooldown:number;totalCooldown:number;active?:boolean}){
  const cooling=cooldown>0,progress=Math.max(0,Math.min(1,1-cooldown/totalCooldown));
  const color=active?'#e6fbff':cooling?'#526578':'#7fe8ff';
  const label=active?`Gravity Hook holding — release ${bindingLabel('mapSkill')} to throw`:cooling?`Gravity Hook recharging — ${(cooldown/60).toFixed(1)} seconds`:`Gravity Hook ready — ${bindingLabel('mapSkill')}`;
  return <div role="img" aria-label={label} title={label} style={{width:42,height:42,flexShrink:0}}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges" style={{width:'100%',height:'100%',overflow:'visible'}}>
      <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={cooling?'#314058':color} strokeWidth="2"/>
      {cooling&&<path d="M20 1H39V39H1V1H20" pathLength="100" fill="none" stroke="#7fe8ff" strokeWidth="2" strokeDasharray={`${progress*100} 100`}/>}
      <g fill={color} style={{filter:cooling?'none':`drop-shadow(0 0 3px ${color})`}}>
        <path d="M13 7H23V11H20V23H24V17H28V25H25V29H15V26H12V21H16V11H13Z"/>
        <rect x="16" y="8" width="4" height="3" fill={cooling?'#7a91a6':'#edfcff'}/>
        {active&&<><rect x="7" y="16" width="3" height="3"/><rect x="29" y="10" width="3" height="3"/></>}
      </g>
      <SvgMapSkillHint/>
    </svg>
  </div>;
}
