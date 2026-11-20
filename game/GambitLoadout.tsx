'use client';
import { useEffect, useState } from 'react';
import { slotKeyLabel } from './gambit-art';
import { SLOT_NAMES, WEAPONS, WEAPON_IDS, setWeapon, slotAllows, type WeaponId } from './gambit';
import type { GameState } from './engine';
import { playUiSfx } from './ui-sfx';

/**
 * Star Gambit weapon loadout: three columns (left, right and middle click), each listing the weapons that slot can
 * hold. The left slot only offers tap weapons, since holding left click is the Pulse Wave. Gameplay is paused while
 * it is open; Done, Escape or a backdrop click resumes.
 */
export default function GambitLoadout({ state, onClose }: { state: GameState; onClose: () => void }) {
  const [, refresh] = useState(0);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const g = state.gambit; if (!g) return null;
  return <div role="dialog" aria-modal="true" aria-label="Choose weapons" onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: '#05060ccc' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '28px 32px', background: '#10131ff7', border: '3px solid #ffd27a', boxShadow: 'inset 0 0 0 3px #2b2414, 0 0 24px #ffd27a33', maxHeight: '92vh', overflowY: 'auto' }}>
      <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', letterSpacing: '.1em', color: '#ffd27a', textAlign: 'center' }}>WEAPONS</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: '#b2bad2', textAlign: 'center' }}>Holding {slotKeyLabel(0)} is always the Pulse Wave.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 230px)', gap: 18 }}>
        {SLOT_NAMES.map((slotName, slot) => <div key={slotName} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '.6rem', color: '#e7e9f6', textAlign: 'center', marginBottom: 4 }}>{slotKeyLabel(slot)}</div>
          {WEAPON_IDS.filter(id => slotAllows(slot, id)).map((id: WeaponId) => {
            const w = WEAPONS[id], picked = g.slots[slot] === id;
            return <button key={id} type="button" aria-pressed={picked}
              onMouseEnter={() => playUiSfx('hover')}
              onClick={() => { setWeapon(state, slot as 0 | 1 | 2, id); playUiSfx('confirm'); refresh(n => n + 1); }}
              style={{ textAlign: 'left', padding: '8px 10px', cursor: 'pointer', background: picked ? '#2b2414' : '#141a2b', color: '#e7e9f6',
                border: `2px solid ${picked ? w.color : '#3a4460'}`, boxShadow: picked ? `0 0 10px ${w.color}55` : 'none' }}>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: '.55rem', color: w.color, marginBottom: 4 }}>{w.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', color: '#9ba6bd', lineHeight: 1.35 }}>{w.desc}</div>
            </button>;
          })}
        </div>)}
      </div>
      <button type="button" onClick={onClose} style={{ alignSelf: 'center', padding: '10px 28px', fontFamily: 'var(--font-pixel)', fontSize: '.7rem', cursor: 'pointer', background: '#2b2414', color: '#ffe6a6', border: '2px solid #ffd27a' }}>DONE</button>
    </div>
  </div>;
}
