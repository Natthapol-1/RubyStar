'use client';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';

export default function SaturnGuide({drawCelestial}:{drawCelestial:CelestialGuidePainter}) {
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>SATURN · FROZEN RINGS</h3></div>
    <p className="rs-guide-intro">Explore the frozen ring station with Frost Warden. He uses his existing abilities; the Saturn encounter is coming later.</p>
    <div className="rs-nep-grid">
      <article className="rs-nep-card" style={{borderColor:'#a8e8d755'}}><h5 style={{color:'#e1fff5'}}>THE RING STATION</h5><p>Move through four icy chambers and their connecting hallways. Drifting snow is scenery. Frost Warden’s glowing ice tiles still slow you.</p></article>
      <CelestialSkillGuideCard name="Saturn Guard" description="Creates protective shields around you and Ruby." color="#68e0c9" draw={drawCelestial}/>
    </div>
  </div>;
}
