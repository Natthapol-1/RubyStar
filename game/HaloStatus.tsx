'use client';
import {SvgMapSkillHint} from './MapSpecialSkillHint';
import {bindingLabel} from './controls';

// HUD icon for the Sirius primal skill, Sacred Halo (C), in the same 42px style as the other primal skills: a blocky gold
// halo over a crown. A perimeter fill shows the cooldown; with full Holy Light the icon glows white (the cast bursts).
export default function HaloStatus({ cooldown, totalCooldown, floating, full }: { cooldown: number; totalCooldown: number; floating: boolean; full: boolean }) {
  const cooling = cooldown > 0, color = full ? '#fff6d0' : '#ffe27a';
  const label = floating ? 'Sacred Halo — floating' : cooling ? `Sacred Halo recharging — ${Math.ceil(cooldown / 60)} seconds` : `Sacred Halo ready${full ? ' with full Holy Light' : ''} — ${bindingLabel('mapSkill')}`;
  const progress = Math.max(0, Math.min(1, 1 - cooldown / totalCooldown));
  return <div className="halo-status" role="img" aria-label={label} title={label}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges" style={{ opacity: cooling && !floating ? .55 : 1 }}>
      <rect x="1" y="1" width="38" height="38" fill="#14121f" stroke={color} strokeWidth="2" />
      {cooling && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g className="halo-glow" style={{ color }}>
        <path d="M10 8H30V10H32V14H30V16H10V14H8V10H10ZM12 11V13H28V11Z" fill="currentColor" />
        <path d="M10 22H14V26H17V20H23V26H26V22H30V32H10Z" fill="currentColor" />
        <rect x="13" y="28" width="14" height="2" fill="#14121f" opacity=".6" />
      </g>
      <SvgMapSkillHint/>
    </svg>
    <style jsx>{`
      .halo-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .halo-glow { filter: drop-shadow(0 0 3px currentColor); }
    `}</style>
  </div>;
}
