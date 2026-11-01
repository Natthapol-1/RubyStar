import { CELESTIAL_BLESSINGS, type CelestialBlessing } from './endless-builds';

const CUTS = {
  brilliant: [[18,16],[26,10],[54,10],[62,16],[68,28],[40,60],[12,28]],
  prism: [[30,6],[50,6],[58,18],[58,50],[50,62],[30,62],[22,50],[22,18]],
  cushion: [[22,12],[58,12],[66,20],[66,48],[58,56],[22,56],[14,48],[14,20]],
  emerald: [[28,8],[52,8],[62,18],[62,50],[52,60],[28,60],[18,50],[18,18]],
  crystal: [[32,6],[46,12],[56,6],[62,28],[56,54],[38,62],[20,50],[22,22]],
  shard: [[42,4],[60,18],[54,34],[62,52],[34,62],[20,42],[24,16]],
  twin: [[24,10],[40,18],[56,10],[66,26],[56,54],[40,62],[24,54],[14,26]],
  kite: [[40,6],[60,18],[66,34],[54,52],[40,62],[26,52],[14,34],[20,18]],
  hexagon: [[26,10],[54,10],[68,34],[54,58],[26,58],[12,34]],
  square: [[20,12],[60,12],[64,16],[64,52],[60,56],[20,56],[16,52],[16,16]],
} satisfies Record<string, number[][]>;

function tint(hex:string,amount:number) {
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  return '#'+rgb.map(v=>Math.round(amount>=0?v+(255-v)*amount:v*(1+amount)).toString(16).padStart(2,'0')).join('');
}

/** Code-native cut gemstones: restrained facets, crisp silhouettes, no bitmap assets. */
export default function BlessingGem({kind}:{kind:CelestialBlessing}) {
  const gem=CELESTIAL_BLESSINGS[kind],outline=CUTS[gem.cut];
  const table=outline.map(([x,y])=>[Math.round((40+(x-40)*.5)/2)*2,Math.round((34+(y-34)*.5)/2)*2]);
  const points=(coords:number[][])=>coords.map(p=>p.join(',')).join(' ');
  return <svg viewBox="0 0 80 68" aria-hidden="true" data-gemstone={kind} shapeRendering="crispEdges">
    <path d="M10 18V8H20 M60 8H70V18 M10 50V60H20 M60 60H70V50" fill="none" stroke={gem.color} strokeWidth="1" opacity=".3"/>
    <polygon points={points(outline)} fill={tint(gem.color,-.7)} stroke={tint(gem.color,.25)} strokeWidth="1.5"/>
    {outline.map((p,i)=>{
      const n=(i+1)%outline.length,shade=i<2?.35:i<4?-.25:i<6?-.48:-.05;
      return <polygon key={i} points={points([p,outline[n],table[n],table[i]])} fill={tint(gem.color,shade)} />;
    })}
    <polygon points={points(table)} fill={tint(gem.color,gem.cut==='shard'?-.5:.02)} stroke={tint(gem.color,.5)} strokeWidth=".7"/>
    <path d={`M${table[0][0]} ${table[0][1]+8}V${table[0][1]}H${table[1][0]}`} fill="none" stroke={tint(gem.color,.8)} strokeWidth="2"/>
    <rect x="35" y="31" width="4" height="4" fill={tint(gem.color,.7)} opacity=".8"/>
  </svg>;
}
