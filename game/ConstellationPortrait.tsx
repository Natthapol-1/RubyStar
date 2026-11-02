import {CONSTELLATIONS,type Constellation} from './engine';
import {CONSTELLATION_STARS,constellationLinks} from './ConstellationChoice';
export default function ConstellationPortrait({kind}:{kind:Constellation}){
 const points=CONSTELLATION_STARS[kind];
 return <svg viewBox="0 0 80 68" width="112" height="96" aria-label={CONSTELLATIONS[kind].name+' constellation'} shapeRendering="crispEdges" style={{color:CONSTELLATIONS[kind].color,overflow:'visible'}}>
 <g fill="currentColor" opacity=".45">{constellationLinks(points).map(([x,y])=><rect key={x+','+y} x={x-1} y={y-1} width="2" height="2"/>)}</g>
 {points.map(([x,y],i)=><g key={i} style={{filter:'drop-shadow(0 0 2px currentColor)'}}><rect x={x-4} y={y-4} width="8" height="8" fill="currentColor"/><rect x={x-2} y={y-2} width="4" height="4" fill="#18263b"/><rect x={x-1} y={y-1} width="2" height="2" fill="#fff4d5"/></g>)}
 </svg>;
}
