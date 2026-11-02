import {GEM_CUTS,gemMaterial} from './gemstone-cuts';
import {CELESTIAL_BLESSINGS,type CelestialBlessing} from './endless-builds';

// The desktop Ruby icon's solid rim, deep inset, broad highlight and luminous core.
export default function BlessingGem({kind}:{kind:CelestialBlessing}){
 const gem=CELESTIAL_BLESSINGS[kind],[outline,table]=GEM_CUTS[gem.cut],m=gemMaterial(kind,gem.color);
 const glintX=gem.cut==='shard'?32:gem.cut==='crystal'?34:gem.cut==='prism'?28:25;
 return <svg viewBox="0 0 80 68" aria-hidden="true" data-gemstone={kind} style={{overflow:'visible',filter:`drop-shadow(0 0 3px ${gem.color}a0) drop-shadow(0 0 7px ${gem.color}40)`}} shapeRendering="crispEdges">
  <path d={outline} fill={m.rim}/>
  <path d={outline} fill={m.shade} transform="translate(40 34) scale(.82) translate(-40 -34)"/>
  <path d={table} fill={m.body}/>
  {gem.cut==='twin'?<><rect x="22" y="25" width="6" height="16" fill={m.light}/><rect x="51" y="25" width="6" height="16" fill={m.core}/><rect x="26" y="33" width="5" height="7" fill="#efb5ea"/><rect x="49" y="28" width="5" height="5" fill="#a3f0df"/></>:
   <><rect x={glintX} y={gem.cut==='crystal'?17:21} width="5" height={gem.cut==='prism'?21:14} fill={m.light}/><rect x={glintX+5} y={gem.cut==='crystal'?17:21} width="9" height="4" fill={m.light}/>
   <path d={table} fill={m.core} transform={`translate(40 34) scale(${kind==='aegis_sentinel'?'.6 .65':kind==='devourer'?'.22 .54':'.42 .56'}) translate(-40 -34)`}/></>}
  {kind==='blind_prayer'&&<g fill="#995010"><rect x="43" y="39" width="3" height="5"/><rect x="34" y="45" width="3" height="3"/></g>}
  {kind==='aegis_sentinel'&&<path d="M48 46H54V40H58V45H54V51H47V54H36V50H48Z" fill="#cb9eac"/>}
  <path d="M58 6H61V11H66V14H61V19H58V14H53V11H58Z" fill={m.core}/>
  <rect x="18" y="53" width="3" height="3" fill={gem.color}/>
 </svg>;
}
