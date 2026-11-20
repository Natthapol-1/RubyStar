'use client';
import {SvgMapSkillHint} from './MapSpecialSkillHint';
import {bindingLabel} from './controls';

const SAND = '#e3c08a', DARK_SAND = '#ad7645', LIGHT = '#fff1d0';

export default function SandSweepStatus({ cooldown, totalCooldown }: { cooldown: number; totalCooldown: number }) {
  const cooling = cooldown > 0;
  const label = cooling ? `Sand Swirl recharging — ${Math.ceil(cooldown / 60)} seconds` : `Sand Swirl ready — ${bindingLabel('mapSkill')} clears sand nearby; time it to counter`;
  const progress = Math.max(0, Math.min(1, 1 - cooldown / totalCooldown));
  const fill = cooling ? '#6b5d45' : SAND;
  return <div className="sweep-status" role="img" aria-label={label} title={label}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#1a130b" stroke={cooling ? '#4a3c28' : SAND} strokeWidth="2" />
      {cooling && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke={SAND} strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g className={cooling ? '' : 'sweep-glow'} style={{ color: fill }}>
        {/* Three wind bands curl into a funnel, with a few grains thrown clear. */}
        <path d="M7 9H11V6H30V9H33V13H28V15H16V13H25V10H11V12H7Z" fill="currentColor" />
        <path d="M11 16H16V18H26V22H23V24H15V22H20V21H13V19H11Z" fill="currentColor" />
        <path d="M14 25H18V27H22V30H19V32H15V30H17V29H14Z" fill={cooling ? fill : DARK_SAND} />
        <path d="M12 7H28V9H12ZM16 18H24V20H16Z" fill={cooling ? '#8a785a' : LIGHT} />
        <path d="M32 17H35V19H32ZM6 19H8V22H6ZM10 29H12V31H10Z" fill={cooling ? fill : DARK_SAND} />
      </g>
      <SvgMapSkillHint/>
    </svg>
    <style jsx>{`
      .sweep-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .sweep-glow { filter: drop-shadow(0 0 3px currentColor); }
    `}</style>
  </div>;
}
