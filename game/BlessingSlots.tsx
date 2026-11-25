import BlessingGem from './BlessingGem';
import { CELESTIAL_BLESSINGS, type CelestialBlessing } from './endless-builds';

const gems=(Object.keys(CELESTIAL_BLESSINGS) as CelestialBlessing[]).filter(kind=>kind!=='stardust');

export default function BlessingSlots({side,active}:{side:'left'|'right';active:CelestialBlessing[]}){
 return <div className="rs-blessing-slots" aria-label={`${side==='left'?'Left':'Right'} blessing slots`}>
  {gems.slice(side==='left'?0:5,side==='left'?5:10).map(kind=>{
   const owned=active.includes(kind),gem=CELESTIAL_BLESSINGS[kind];
   return <span key={kind} className="rs-blessing-slot" data-active={owned||undefined} role="img" aria-label={`${gem.name}: ${owned?'active':'not selected'}`} title={`${gem.name}${owned?'':' · Not selected'} — ${gem.description}`}>
    <BlessingGem kind={kind} compact/>
   </span>;
  })}
 </div>;
}
