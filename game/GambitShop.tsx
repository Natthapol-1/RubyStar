'use client';
import { useEffect } from 'react';
import { oxygenBill, wavesToBill } from './gambit';
import type { GameState } from './engine';

const GOLD = '#ffd27a', DEEP = '#2b2414';

/**
 * Star Gambit's shop, opened from the SHOP button beside the WAVE box (play pauses while it is open). The same gold
 * cabinet as the slot machine: a marquee title, your Glint, the next oxygen bill, and the shelf. The shelf has no stock
 * yet. Close, Escape or a backdrop click resumes.
 */
export default function GambitShop({ state, onClose }: { state: GameState; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const g = state.gambit; if (!g) return null;
  const waves = wavesToBill(state), short = Math.max(0, oxygenBill(state) - g.glint);
  return <div className="gp-back" role="dialog" aria-modal="true" aria-label="Shop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="gp-cabinet">
      <div className="gp-marquee">
        {Array.from({ length: 18 }, (_, i) => <i key={i} className="gp-bulb" style={{ animationDelay: `${(i % 2) * .35}s` }} />)}
        <span className="gp-title">BAZAAR SHOP</span>
      </div>
      <div className="gp-purse">
        <span className="gp-glint"><svg width="14" height="18" viewBox="0 0 10 14" aria-hidden="true" shapeRendering="crispEdges"><path d="M3 0H7V2H10V12H7V14H3V12H0V2H3Z" fill="#ffd23f" /></svg>{g.glint}</span>
        {g.debt > 0
          ? <span className="gp-o2 gp-debt">OXYGEN DEBT {g.debt}</span>
          : <span className="gp-o2">NEXT O2 BILL {oxygenBill(state)} IN {waves} WAVE{waves > 1 ? 'S' : ''}{short > 0 ? ` · ${short} SHORT` : ''}</span>}
      </div>
      <div className="gp-shelf">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="gp-slot"><span>EMPTY</span></div>)}
      </div>
      <div className="gp-note">No stock yet.</div>
      <button type="button" className="gp-close" onClick={onClose}>CLOSE</button>
    </div>
    <style jsx>{`
      .gp-back { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: #05060ccc; overflow-y: auto; padding: 16px; }
      .gp-cabinet { width: min(720px, 100%); display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 22px 26px 26px;
        background: #10131f; border: 4px solid ${GOLD}; box-shadow: inset 0 0 0 4px ${DEEP}, inset 0 0 0 7px #6b4510, 0 0 24px #ffb84d44; }
      .gp-marquee { position: relative; width: 100%; padding: 24px 0; display: grid; place-items: center; background: ${DEEP}; border: 3px solid #6b4510; }
      .gp-bulb { position: absolute; width: 8px; height: 8px; background: #ffe6a6; animation: gpBulb .7s steps(1) infinite; }
      ${Array.from({ length: 18 }, (_, i) => `.gp-bulb:nth-child(${i + 1}) { ${i < 9 ? `top: 3px; left: ${4 + i * 11.6}%;` : `bottom: 3px; left: ${4 + (i - 9) * 11.6}%;`} }`).join('\n      ')}
      @keyframes gpBulb { 0% { opacity: 1; box-shadow: 0 0 6px #ffd27a; } 50% { opacity: .25; box-shadow: none; } }
      .gp-title { font-family: var(--font-pixel); font-size: 1.5rem; letter-spacing: .12em; color: ${GOLD}; text-shadow: 3px 3px 0 #6b4510, 0 0 6px #ffb84d; }
      .gp-purse { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
      .gp-glint { display: flex; align-items: center; gap: 8px; font-family: var(--font-pixel); font-size: 1rem; color: #ffd23f; }
      .gp-o2 { padding: 5px 10px; font-family: var(--font-pixel); font-size: .55rem; color: #e7f6ff; background: #0d1a24; border: 2px solid #3a6f8a; }
      .gp-debt { color: #ff8a96; background: #3a1018; border-color: #ff5a6a; }
      .gp-shelf { width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 10px; background: #070810; border: 3px solid #6b4510; box-shadow: inset 0 0 0 3px #1c1a24; }
      .gp-slot { min-height: 120px; display: grid; place-items: center; background: #141a2b; border: 3px dashed #2a3148; }
      .gp-slot span { font-family: var(--font-pixel); font-size: .55rem; color: #3a4460; }
      .gp-note { font-family: var(--font-mono); font-size: .76rem; color: #8b93ab; }
      .gp-close { padding: 10px 28px; font-family: var(--font-pixel); font-size: .7rem; cursor: pointer; background: ${DEEP}; color: #ffe6a6; border: 2px solid ${GOLD}; }
      .gp-close:hover, .gp-close:focus-visible { outline: none; box-shadow: 0 0 10px #ffd27a66; }
      @media (max-width: 620px) { .gp-shelf { grid-template-columns: repeat(2, 1fr); } }
      @media (prefers-reduced-motion: reduce) { .gp-bulb { animation: none; } }
    `}</style>
  </div>;
}
