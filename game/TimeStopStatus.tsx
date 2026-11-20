'use client';
import {SvgMapSkillHint} from './MapSpecialSkillHint';
import {bindingLabel} from './controls';

// HUD icon for Saturn's C (Absolute Zero, a time-stop field), in the same 42px style as the Moon Mark: an hourglass in a frame,
// glowing when ready and dimmed with a filling perimeter while recharging. Casting flips the hourglass once.
const ICE = '#e9f7ff';
export default function TimeStopStatus({ cooldown, totalCooldown, flip = 0 }: { cooldown: number; totalCooldown: number; flip?: number }) {
  const cooling = cooldown > 0, progress = Math.max(0, Math.min(1, 1 - cooldown / totalCooldown));
  const label = cooling ? `Absolute Zero recharging — ${Math.ceil(cooldown / 60)} seconds` : `Absolute Zero ready — ${bindingLabel('mapSkill')} as her frost shield lands`;
  return <div className="stop-status" role="img" aria-label={label} title={label}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#0b1424" stroke={cooling ? '#314058' : ICE} strokeWidth="2" />
      {cooling && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke={ICE} strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g transform="translate(3 3)">{/* centred in the 40px box */}
      <g className={flip > 0 ? 'glass flipping' : cooling ? 'glass' : 'glass ready'} style={{ color: cooling && flip <= 0 ? '#536176' : ICE }}>
        {/* frame bars, glass and sand: the top bulb drains into the bottom one */}
        <rect x="7" y="5" width="20" height="3" fill="currentColor" />
        <rect x="7" y="25" width="20" height="3" fill="currentColor" />
        <path d="M9 8H25V11H22V14H19V19H22V22H25V25H9V22H12V19H15V14H12V11H9Z" fill="currentColor" opacity=".45" />
        <path d="M12 11H22V13H19V15H15V13H12Z" fill="#9ff1ff" />
        <path d="M15 20H19V22H22V24H12V22H15Z" fill="#9ff1ff" />
      </g></g>
      <SvgMapSkillHint/>
    </svg>
    <style jsx>{`
      .stop-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .glass { transform-box: fill-box; transform-origin: 50% 50%; }
      .ready { filter: drop-shadow(0 0 3px currentColor); }
      .flipping { animation: glass-flip .5s steps(6) 1; filter: drop-shadow(0 0 5px #ffffff); }
      @keyframes glass-flip { from { transform: rotate(0deg); } to { transform: rotate(180deg); } }
      @media (prefers-reduced-motion: reduce) { .flipping { animation: none; } }
    `}</style>
  </div>;
}
