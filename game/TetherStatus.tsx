'use client';
import {SvgMapSkillHint} from './MapSpecialSkillHint';
import {bindingLabel} from './controls';

// HUD icon for the Singularity primal skill (C), the Gravity Hook, in the same 42px style as the other primal skills: a
// cyan grabber claw on a short chain, clutching a small green Devourer body. The border refills while it recharges; the
// held body glows while you tow one. The drawing sits up and left, clear of the key hint in the bottom-right corner.
export default function TetherStatus({ charge, max, active }: { charge: number; max: number; active: boolean }) {
  const fill = max <= 0 ? 1 : Math.max(0, Math.min(1, charge / max)), ready = fill >= 1, lit = ready || active;
  const label = `Gravity Hook — ${active ? `release ${bindingLabel('mapSkill')} to throw` : ready ? `hold ${bindingLabel('mapSkill')} to grab an enemy` : 'recharging'}`;
  return <div className="hook-status" role="img" aria-label={label} title={label}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#06121a" stroke={ready ? '#7fe8ff' : '#264a5a'} strokeWidth="2" />
      {!ready && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke="#7fe8ff" strokeWidth="2" strokeDasharray={`${fill * 100} 100`} />}
      <g opacity={lit ? 1 : .45}>
        {/* the chain: two hollow links stepping down from the corner */}
        <rect x="3" y="3" width="4" height="4" fill="none" stroke="#7fe8ff" strokeWidth="2" />
        <rect x="7" y="7" width="4" height="4" fill="none" stroke="#bff6ff" strokeWidth="2" />
        <g className="hook-glow">
          {/* the claw: a hub with two prongs closing round the body */}
          <rect x="10" y="10" width="6" height="6" fill="#7fe8ff" />
          <rect x="16" y="10" width="11" height="3" fill="#7fe8ff" />
          <rect x="24" y="13" width="3" height="5" fill="#7fe8ff" />
          <rect x="10" y="16" width="3" height="11" fill="#7fe8ff" />
          <rect x="13" y="24" width="5" height="3" fill="#7fe8ff" />
          <rect x="11" y="11" width="2" height="2" fill="#e6fbff" />
        </g>
        {/* the caught body: a green block with a dark core and a pale glint */}
        <g className={active ? 'body-glow' : undefined}>
          <rect x="14" y="14" width="9" height="9" fill="#7dff8a" />
          <rect x="16" y="16" width="5" height="5" fill="#1f4a2a" />
          <rect x="15" y="15" width="2" height="2" fill="#e8fff4" />
        </g>
      </g>
      <SvgMapSkillHint/>
    </svg>
    <style jsx>{`
      .hook-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .hook-glow { filter: drop-shadow(0 0 3px #7fe8ff); }
      .body-glow { filter: drop-shadow(0 0 4px #7dff8a); }
    `}</style>
  </div>;
}
