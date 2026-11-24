'use client';
import { useEffect, useRef, useState } from 'react';
import { WeaponGlyph } from './GambitWeaponStatus';
import { LUCKY_WEIGHT, WEAPONS, WEAPON_IDS, luckyOdds, rollWeapons, setWeapon, type WeaponId } from './gambit';
import type { GameState } from './engine';
import { playUiSfx } from './ui-sfx';

const GOLD = '#ffd27a', DEEP = '#2b2414';
const SPIN_STOPS = [900, 1400, 1900]; // ms after the pull when each reel lands

/**
 * Star Gambit's start-of-run slot machine. First you pick a lucky weapon (it is LUCKY_WEIGHT times as likely to come up),
 * then pull the lever: three reels spin and land on three different weapons, and you keep one of them. Blocky neon
 * cabinet: a gold frame with chasing marquee lights, dark reel windows, a lever, and the weapons' own pictograms.
 */
export default function GambitSlotMachine({ state, onDone }: { state: GameState; onDone: () => void }) {
  const [lucky, setLucky] = useState<WeaponId | null>(null);
  const [stage, setStage] = useState<'lucky' | 'spin' | 'choose'>('lucky');
  const [result, setResult] = useState<WeaponId[]>([]);
  const [landed, setLanded] = useState(0); // reels that have stopped
  const [frame, setFrame] = useState(0); // spinning reel animation step
  const timers = useRef<number[]>([]);

  const pull = () => {
    if (stage !== 'lucky' || !lucky) return;
    const r = rollWeapons(lucky); setResult(r); setLanded(0); setStage('spin'); playUiSfx('charged');
    SPIN_STOPS.forEach((ms, i) => timers.current.push(window.setTimeout(() => {
      setLanded(i + 1); playUiSfx('gemPassive');
      if (i === SPIN_STOPS.length - 1) { setStage('choose'); if (r.includes(lucky)) playUiSfx('gemBlessing'); }
    }, ms)));
  };
  const choose = (id: WeaponId) => { if (stage !== 'choose') return; setWeapon(state, id); playUiSfx('confirm'); onDone(); };

  useEffect(() => { // the reels' blur of pictograms while spinning
    if (stage !== 'spin') return;
    const t = window.setInterval(() => { setFrame(f => f + 1); }, 70);
    return () => window.clearInterval(t);
  }, [stage]);
  useEffect(() => () => timers.current.forEach(t => window.clearTimeout(t)), []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && stage === 'lucky' && lucky) { e.preventDefault(); pull(); }
      if (stage === 'choose' && ['1', '2', '3'].includes(e.key)) { e.preventDefault(); choose(result[Number(e.key) - 1]); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  const odds = Math.round(luckyOdds() * 100);

  return <div className="gs-back" role="dialog" aria-modal="true" aria-label="Star Gambit slot machine">
    <div className="gs-cabinet">
      <div className="gs-marquee">
        {Array.from({ length: 18 }, (_, i) => <i key={i} className="gs-bulb" style={{ animationDelay: `${(i % 2) * .35}s` }} />)}
        <span className="gs-title">STAR GAMBIT</span>
      </div>
      <div className="gs-sub">{stage === 'lucky' ? 'PICK YOUR LUCKY WEAPON, THEN PULL' : stage === 'spin' ? 'SPINNING...' : 'TAKE ONE'}</div>

      <div className="gs-machine">
        <div className="gs-reels">
          {[0, 1, 2].map(i => {
          const spinning = stage === 'spin' && landed <= i, id = spinning ? WEAPON_IDS[(frame + i * 3) % WEAPON_IDS.length] : result[i];
          const w = id ? WEAPONS[id] : null, pick = stage === 'choose' && w;
          return <button key={i} type="button" className={'gs-reel' + (spinning ? ' gs-spinning' : '') + (pick ? ' gs-pick' : '') + (pick && id === lucky ? ' gs-lucky' : '')}
            disabled={!pick} onClick={() => id && choose(id)} onMouseEnter={() => pick && playUiSfx('hover')}
            style={{ ['--c' as string]: w?.color ?? '#3a4460' }} aria-label={pick && w ? `Take ${w.name}` : 'Reel'}>
            <span className="gs-window">
              {w ? <svg viewBox="0 0 40 40" shapeRendering="crispEdges" aria-hidden="true" style={{ color: w.color }}><WeaponGlyph weapon={id!} dim={spinning} /></svg>
                : <span className="gs-q">?</span>}
            </span>
            <span className="gs-name">{w && !spinning ? w.name : stage === 'lucky' ? '- - -' : ''}</span>
            {pick && <span className="gs-desc">{w!.desc}</span>}
            {pick && <span className="gs-key">{i + 1}</span>}
            {pick && id === lucky && <span className="gs-tag">LUCKY</span>}
          </button>;
          })}
        </div>
        <button type="button" className={'gs-lever' + (stage !== 'lucky' ? ' gs-pulled' : '') + (stage === 'lucky' && lucky ? ' gs-ready' : '')}
          onClick={pull} disabled={stage !== 'lucky' || !lucky} aria-label="Pull the lever">
          <span className="gs-knob" /><span className="gs-arm" /><span className="gs-base" />
          <span className="gs-pull">PULL</span>
        </button>
      </div>

      {stage === 'lucky' && <>
        <div className="gs-hint">Your lucky weapon is {LUCKY_WEIGHT}× as likely to land: about {odds}% to show up in a pull.</div>
        <div className="gs-grid">
          {WEAPON_IDS.map(id => {
            const w = WEAPONS[id], on = lucky === id;
            return <button key={id} type="button" className={'gs-chip' + (on ? ' gs-on' : '')} style={{ ['--c' as string]: w.color }}
              onMouseEnter={() => playUiSfx('hover')} onClick={() => { setLucky(id); playUiSfx('gemPassive'); }} aria-pressed={on}>
              <svg viewBox="0 0 40 40" shapeRendering="crispEdges" aria-hidden="true" style={{ color: w.color }}><WeaponGlyph weapon={id} /></svg>
              <span>{w.name}</span>
              {on && <b>×{LUCKY_WEIGHT}</b>}
            </button>;
          })}
        </div>
      </>}
    </div>
    <style jsx>{`
      .gs-back { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: #05060ccc; overflow-y: auto; padding: 16px; }
      .gs-cabinet { width: min(760px, 100%); display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 22px 26px 26px;
        background: #10131f; border: 4px solid ${GOLD}; box-shadow: inset 0 0 0 4px ${DEEP}, inset 0 0 0 7px #6b4510, 0 0 24px #ffb84d44; }
      .gs-marquee { position: relative; width: 100%; padding: 24px 0; display: grid; place-items: center; background: ${DEEP}; border: 3px solid #6b4510; }
      .gs-bulb { position: absolute; width: 8px; height: 8px; background: #ffe6a6; animation: gsBulb .7s steps(1) infinite; }
      ${Array.from({ length: 18 }, (_, i) => `.gs-bulb:nth-child(${i + 1}) { ${i < 9 ? `top: 3px; left: ${4 + i * 11.6}%;` : `bottom: 3px; left: ${4 + (i - 9) * 11.6}%;`} }`).join('\n      ')}
      @keyframes gsBulb { 0% { opacity: 1; box-shadow: 0 0 6px #ffd27a; } 50% { opacity: .25; box-shadow: none; } }
      .gs-title { font-family: var(--font-pixel); font-size: 1.7rem; letter-spacing: .12em; color: ${GOLD}; text-shadow: 3px 3px 0 #6b4510, 0 0 6px #ffb84d; }
      .gs-sub { font-family: var(--font-pixel); font-size: .62rem; letter-spacing: .14em; color: #ffe6a6; }
      .gs-machine { display: flex; align-items: stretch; gap: 16px; }
      .gs-reels { display: grid; grid-template-columns: repeat(3, 168px); gap: 10px; padding: 10px; background: #070810; border: 3px solid #6b4510; box-shadow: inset 0 0 0 3px #1c1a24; }
      .gs-reel { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 10px 14px; min-height: 188px;
        background: #141a2b; border: 3px solid #2a3148; color: #e7e9f6; font: inherit; text-align: center; }
      .gs-reel:disabled { cursor: default; }
      .gs-window { width: 96px; height: 96px; display: grid; place-items: center; background: #0a0c16; border: 2px solid #2a3148; }
      .gs-window svg { width: 76px; height: 76px; filter: drop-shadow(0 0 3px currentColor); }
      .gs-spinning .gs-window svg { transform: translateY(4px); opacity: .55; filter: none; }
      .gs-q { font-family: var(--font-pixel); font-size: 2rem; color: #3a4460; }
      .gs-name { min-height: 12px; font-family: var(--font-pixel); font-size: .56rem; color: var(--c); }
      .gs-desc { font-family: var(--font-mono); font-size: .7rem; line-height: 1.35; color: #9ba6bd; }
      .gs-pick { cursor: pointer; border-color: var(--c); animation: gsLand .35s steps(3) 1; }
      .gs-pick:hover, .gs-pick:focus-visible { outline: none; background: #1c2236; box-shadow: 0 0 12px color-mix(in srgb, var(--c) 55%, transparent); }
      .gs-lucky { border-color: ${GOLD}; box-shadow: 0 0 10px #ffd27a66; }
      @keyframes gsLand { 0% { transform: translateY(-6px); } 100% { transform: none; } }
      .gs-key { position: absolute; top: 6px; left: 8px; font-family: var(--font-pixel); font-size: .5rem; color: #6c7590; }
      .gs-tag { position: absolute; top: -10px; right: 8px; padding: 3px 6px; font-family: var(--font-pixel); font-size: .5rem; color: ${DEEP}; background: ${GOLD}; }
      .gs-lever { position: relative; width: 64px; background: none; border: 0; padding: 0; font: inherit; color: inherit; cursor: pointer; }
      .gs-lever:disabled { cursor: default; }
      .gs-arm { position: absolute; left: 26px; top: 26px; width: 12px; height: 110px; background: #8d97b3; box-shadow: inset -4px 0 0 #5a6380; transform-origin: 50% 100%; transition: transform .18s steps(3); }
      .gs-knob { position: absolute; left: 14px; top: 0; width: 36px; height: 36px; z-index: 1; background: #ff1155; box-shadow: inset -6px -6px 0 #a8183f, inset 5px 5px 0 #ff8fb0; transition: transform .18s steps(3); }
      .gs-base { position: absolute; left: 10px; top: 132px; width: 44px; height: 26px; background: ${DEEP}; border: 3px solid #6b4510; }
      .gs-pull { position: absolute; left: 0; right: 0; top: 168px; font-family: var(--font-pixel); font-size: .55rem; color: #6c7590; text-align: center; }
      .gs-ready .gs-pull { color: ${GOLD}; animation: gsBulb .7s steps(1) infinite; }
      .gs-ready .gs-knob { box-shadow: inset -6px -6px 0 #a8183f, inset 5px 5px 0 #ff8fb0, 0 0 8px #ff2f6f; }
      .gs-pulled .gs-knob { transform: translateY(96px); }
      .gs-pulled .gs-arm { transform: scaleY(.15); }
      .gs-hint { font-family: var(--font-mono); font-size: .76rem; color: #b2bad2; }
      .gs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; }
      .gs-chip { position: relative; display: flex; align-items: center; gap: 10px; padding: 6px 10px; cursor: pointer; background: #141a2b; border: 2px solid #2a3148; color: var(--c); font: inherit; text-align: left; }
      .gs-chip svg { width: 32px; height: 32px; flex-shrink: 0; }
      .gs-chip span { font-family: var(--font-pixel); font-size: .5rem; }
      .gs-chip b { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-family: var(--font-pixel); font-size: .55rem; color: ${DEEP}; background: ${GOLD}; padding: 3px 5px; }
      .gs-chip:hover, .gs-chip:focus-visible { outline: none; border-color: var(--c); }
      .gs-on { border-color: ${GOLD}; background: ${DEEP}; box-shadow: 0 0 10px #ffd27a55; }
      @media (max-width: 760px) { .gs-reels { grid-template-columns: repeat(3, 1fr); } .gs-machine { width: 100%; } .gs-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (prefers-reduced-motion: reduce) { .gs-bulb, .gs-ready .gs-pull, .gs-pick { animation: none; } }
    `}</style>
  </div>;
}
