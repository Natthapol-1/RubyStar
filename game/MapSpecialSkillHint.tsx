import {bindings,bindingLabel,keyLabel} from './controls';
export function SvgMapSkillHint({x=27,y=25,color='#e7e9f6'}:{x?:number;y?:number;color?:string}){
 const code=bindings().mapSkill[0]??'';
 if(code.startsWith('Mouse'))return <g transform={`translate(${x} ${y})`}><path d="M2 0H8V2H10V12H0V2H2Z" fill="#0b1424" stroke={color} strokeWidth="1"/><path d="M0 5H10M3 0V5M7 0V5" fill="none" stroke={color} strokeWidth=".7"/><rect x={code==='Mouse0'?1:code==='Mouse2'?7:4} y="1" width="2" height="3" fill={color}/></g>;
 const label=keyLabel(code).replace('LEFT ','L').replace('RIGHT ','R').slice(0,4)||'—';
 return <text x={x+5} y={y+11} textAnchor="middle" fontFamily="var(--font-pixel)" fontSize={label.length>2?5:8} fill={color}>{label}</text>;
}
export default function MapSpecialSkillHint(){return <svg viewBox="0 0 12 14" width="12" height="14" role="img" aria-label={bindingLabel('mapSkill')}><title>{bindingLabel('mapSkill')}</title><SvgMapSkillHint x={1} y={1}/></svg>;}
