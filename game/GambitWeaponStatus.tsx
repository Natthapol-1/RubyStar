'use client';
import {SvgMapSkillHint} from './MapSpecialSkillHint';
import {bindingLabel} from './controls';
import {WEAPONS, type WeaponId} from './gambit';

/** Star Gambit: the run's weapon beside the bomb, like a challenge's primal skill icon. A blocky pictogram in the
 * weapon's colour, a perimeter that fills while it recharges, and a white charge bar while Comet Dash is held. */
export default function GambitWeaponStatus({ weapon, cooldown, totalCooldown, charge }: { weapon: WeaponId; cooldown: number; totalCooldown: number; charge: number }) {
  const w = WEAPONS[weapon], cooling = cooldown > 0;
  const name = w.name.charAt(0) + w.name.slice(1).toLowerCase();
  const label = cooling ? `${name} recharging — ${Math.ceil(cooldown / 60)} seconds` : `${name} ready — ${bindingLabel('mapSkill')}`;
  const progress = Math.max(0, Math.min(1, 1 - cooldown / totalCooldown));
  const fill = cooling ? '#56607a' : w.color;
  return <div className="gw-status" role="img" aria-label={label} title={label}>
    <svg viewBox="0 0 40 40" aria-hidden="true" shapeRendering="crispEdges">
      <rect x="1" y="1" width="38" height="38" fill="#10131f" stroke={cooling ? '#3a4460' : w.color} strokeWidth="2" />
      {cooling && <path d="M20 1 H39 V39 H1 V1 H20" pathLength="100" fill="none" stroke={w.color} strokeWidth="2" strokeDasharray={`${progress * 100} 100`} />}
      <g className={cooling ? '' : 'gw-glow'} style={{ color: fill }}>
        <WeaponGlyph weapon={weapon} dim={cooling} />
      </g>
      {charge > 0 && <rect x="4" y="35" width={Math.round(32 * charge)} height="2" fill="#ffffff" />}
      <SvgMapSkillHint/>
    </svg>
    <style jsx>{`
      .gw-status { width: 42px; height: 42px; flex-shrink: 0; }
      svg { width: 100%; height: 100%; overflow: visible; }
      .gw-glow { filter: drop-shadow(0 0 3px currentColor); }
    `}</style>
  </div>;
}

/** A weapon's blocky 40×40 pictogram in currentColor, with a white (or Ruby-pink) accent; dim draws the accent in
 * currentColor too (a recharging icon). Shared by the HUD icon and the slot machine reels. */
export function WeaponGlyph({ weapon, dim = false }: { weapon: WeaponId; dim?: boolean }) {
  return <>
    {weapon === 'orbital' && <>{/* a star falling into four corner brackets */}
      <path d="M8 22H12V24H10V26H8ZM28 22H32V26H30V24H28ZM8 32H10V34H12V36H8ZM30 32H32V36H28V34H30Z" fill="currentColor" />
      <path d="M19 6H21V11H26V13H21V18H19V13H14V11H19Z" fill="currentColor" />
      <path d="M19 20H21V28H19Z" fill="currentColor" opacity=".7" />
      <path d="M18 28H22V32H18Z" fill={dim ? 'currentColor' : '#ffffff'} />
    </>}
    {weapon === 'blade' && <>{/* a stepped crescent sweep with a pale edge */}
      <path d="M8 8H14V10H20V12H25V15H28V20H30V30H26V22H24V18H21V16H17V14H8Z" fill="currentColor" />
      <path d="M10 10H14V12H19V14H11ZM26 24H28V29H26Z" fill={dim ? 'currentColor' : '#ffffff'} opacity=".85" />
      <path d="M28 32H32V34H28ZM31 28H33V30H31Z" fill="currentColor" opacity=".6" />
    </>}
    {weapon === 'dash' && <>{/* a comet head with a stepped streak behind it */}
      <path d="M24 14H32V26H24Z" fill="currentColor" />
      <path d="M26 16H30V24H26Z" fill={dim ? 'currentColor' : '#ffffff'} />
      <path d="M14 16H23V24H14Z" fill="currentColor" opacity=".7" />
      <path d="M7 18H13V22H7Z" fill="currentColor" opacity=".4" />
    </>}
    {weapon === 'sling' && <>{/* Ruby on its point at the end of a rose tether */}
      <path d="M6 32H10V30H14V28H18V26H20V30H16V32H12V34H6Z" fill="currentColor" opacity=".6" />
      <path d="M27 9L35 17L27 25L19 17Z" fill="currentColor" />
      <path d="M27 13L31 17L27 21L23 17Z" fill={dim ? 'currentColor' : '#ffffff'} />
    </>}
    {weapon === 'well' && <>{/* nested squares closing on a dark core */}
      <path d="M6 6H34V34H6ZM10 10V30H30V10Z" fill="currentColor" fillRule="evenodd" opacity=".55" />
      <path d="M13 13H27V27H13ZM16 16V24H24V16Z" fill="currentColor" fillRule="evenodd" />
      <path d="M18 18H22V22H18Z" fill={dim ? 'currentColor' : '#ffffff'} />
    </>}
    {weapon === 'leap' && <>{/* a stepped arc landing beside Ruby, with a push line either side */}
      <path d="M6 24H8V18H10V14H14V12H20V14H24V16H20V18H16V16H12V20H10V24Z" fill="currentColor" />
      <path d="M24 25L30 31L24 37L18 31Z" fill={dim ? 'currentColor' : '#ff6f9f'} />
      <path d="M8 33H14V35H8ZM32 33H36V35H32Z" fill="currentColor" opacity=".7" />
    </>}
    {weapon === 'nova' && <>{/* a field square around you with a heal cross */}
      <path d="M5 5H35V35H5ZM9 9V31H31V9Z" fill="currentColor" fillRule="evenodd" opacity=".6" />
      <path d="M18 12H22V18H28V22H22V28H18V22H12V18H18Z" fill="currentColor" />
      <path d="M19 19H21V21H19Z" fill={dim ? 'currentColor' : '#ffffff'} />
    </>}
    {weapon === 'cannon' && <>{/* one big orb with a trail */}
      <path d="M18 10H32V24H18Z" fill="currentColor" />
      <path d="M21 13H29V21H21Z" fill="#123a5a" />
      <path d="M23 15H27V19H23Z" fill={dim ? 'currentColor' : '#ffffff'} />
      <path d="M10 26H16V30H10ZM5 31H9V34H5Z" fill="currentColor" opacity=".6" />
    </>}
    {weapon === 'mark' && <>{/* corner brackets around a lightning bolt */}
      <path d="M5 5H13V8H8V13H5ZM27 5H35V13H32V8H27ZM5 27H8V32H13V35H5ZM32 27H35V35H27V32H32Z" fill="currentColor" />
      <path d="M22 9H26V13H23V18H27V22H24V26H21V31H17V26H20V22H14V18H18V13H22Z" fill="currentColor" />
      <path d="M21 13H23V17H21ZM18 23H21V26H18Z" fill={dim ? 'currentColor' : '#ffffff'} />
    </>}
  </>;
}
