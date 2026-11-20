'use client';
import {SvgMapSkillHint} from './MapSpecialSkillHint';
import {bindingLabel} from './controls';
import {POLE_COLORS, type Pole} from './binary';

// HUD icon for the Binary Star primal skill (C), in the same 42px style as the Moon Mark: a blocky horseshoe magnet
// in your current pole's colour. Pressing C swaps it; a brief perimeter fill shows the short swap cooldown.
export default function MagnetStatus({ pole, cooldown, totalCooldown }: { pole: Pole; cooldown: number; totalCooldown: number }) {
  const cooling = cooldown > 0, color = POLE_COLORS[pole], other = POLE_COLORS[pole === 'north' ? 'south' : 'north'];
  const label = `${pole === 'north' ? 'North' : 'South'} pole — ${bindingLabel('mapSkill')} swaps it`;
  const progress = Math.max(0, Math.min(1, 1 - cooldown / totalCooldown));
  return <div className="magnet-status" role="img" aria-label={label} title={label} data-pole={pole}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={color} strokeWidth="2" />
      {cooling && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g transform="translate(5 3)">{/* centred in the 40px box */}<g className="magnet-glow" style={{ color }}>
        <path d="M5 10H11V21H19V10H25V27H5Z" fill="currentColor" />
        <path d="M7 13H8V24H22V13H23V25H7Z" fill="#0b1424" opacity=".55" />
        <rect x="5" y="6" width="6" height="4" fill="#ffffff" opacity=".85" />
        <rect x="19" y="6" width="6" height="4" fill="#ffffff" opacity=".85" />
      </g></g>
      {/* a small chip of the other pole: the one C swaps to */}
      <rect x="32" y="4" width="5" height="5" fill={other} />
      <SvgMapSkillHint/>
    </svg>
    <style jsx>{`
      .magnet-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .magnet-glow { filter: drop-shadow(0 0 3px currentColor); }
    `}</style>
  </div>;
}
