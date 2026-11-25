'use client';
import {useEffect,useRef} from 'react';
import {CONSTELLATIONS,type GameState} from './engine';
import {SPECIAL_SKILLS} from './constants';
import {bindingLabel} from './controls';
import {bosses} from './guide-data';
import {CELESTIAL_BLESSINGS} from './endless-builds';
import BlessingGem from './BlessingGem';
import {CONSTELLATION_STARS,constellationLinks} from './ConstellationChoice';

export default function RunBuildOverview({state}:{state:GameState}){
 const panel=useRef<HTMLElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;panel.current?.focus();return()=>previous?.focus();},[]);
 const constellations=[...new Set(state.constellations)],blessings=[...new Set(state.build.blessings)];
 const skill=state.specialSkill?SPECIAL_SKILLS[state.specialSkill]:null;
 return <div className="rs-build-overlay" role="dialog" aria-modal="true" aria-label="Run build overview">
  <section className="rs-build-panel" tabIndex={-1} ref={panel}>
   <header className="rs-build-header"><div><h2>RUN BUILD</h2><p>STAGE {state.bossesKilled}</p></div><span>{bindingLabel('buildOverview').toUpperCase()} TO CLOSE</span></header>
   <div className="rs-build-scroll">
    <section aria-label="Current celestial skill" className="rs-build-skill">
     <h3>CELESTIAL SKILL</h3>
     {skill&&state.specialSkill?<><strong style={{color:skill.color}}>{skill.name}</strong><p>{bosses[state.specialSkill].skill}</p></>:<p className="rs-build-empty">No celestial skill held.</p>}
    </section>
    <div className="rs-build-columns">
     <section aria-label="Owned constellations"><h3>CONSTELLATIONS <span>{constellations.length}</span></h3>
      {constellations.length?<ul>{constellations.map(kind=>{const info=CONSTELLATIONS[kind],points=CONSTELLATION_STARS[kind];return <li key={kind}>
       <svg viewBox="0 0 80 68" aria-hidden="true" shapeRendering="crispEdges" className="rs-build-art" style={{color:info.color}}>
        {constellationLinks(points).map(([x,y],i)=><rect key={i} x={x} y={y} width="2" height="2" fill="currentColor" opacity=".45"/>)}
        {points.map(([x,y],i)=><rect key={i} x={x-2} y={y-2} width="5" height="5" fill="currentColor"/>)}
       </svg><div><h4 style={{color:info.color}}>{info.name}</h4><p>{info.description}</p></div>
      </li>})}</ul>:<p className="rs-build-empty">No constellations collected yet.</p>}
     </section>
     <section aria-label="Owned blessings"><h3>BLESSINGS <span>{blessings.length}</span></h3>
      {blessings.length?<ul>{blessings.map(kind=>{const info=CELESTIAL_BLESSINGS[kind];return <li key={kind}>
       <div className="rs-build-art"><BlessingGem kind={kind}/></div><div><h4 style={{color:info.color}}>{info.name}</h4><p>{info.description}</p></div>
      </li>})}</ul>:<p className="rs-build-empty">No blessings collected yet. Blessings begin at Stage 20.</p>}
     </section>
    </div>
   </div>
  </section>
 </div>;
}
