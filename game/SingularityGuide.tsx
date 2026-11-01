'use client';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';

export default function SingularityGuide({drawCelestial}:{drawCelestial:CelestialGuidePainter}) {
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>THE SINGULARITY</h3></div>
    <p className="rs-guide-intro">At the end of everything, something remains in the dark. The existing Soul Devourer awaits; custom challenge mechanics come later.</p>
    <div className="rs-nep-grid">
      <article className="rs-nep-card" style={{borderColor:'#b4a4d255'}}><h5 style={{color:'#d5d3eb'}}>THE LAST LIGHT</h5><p>Cross blackened chambers above an unknowable void. The distant lights and darkness are scenery.</p></article>
      <CelestialSkillGuideCard name="Singularity" description="Creates a black hole that pulls in and damages nearby enemies." color="#bcbccd" draw={drawCelestial}/>
    </div>
  </div>;
}
