'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLoadingRouter as useRouter } from './NavigationProvider';
import { canEnter, challengeCleared, isDesktop } from './profile';
import CelestialBackdrop from './CelestialBackdrop';
import CelestialBody from './CelestialBody';
import BlessingGem from './BlessingGem';
import LobbyUtilityIcon from './LobbyUtilityIcon';
import { CELESTIAL_BLESSINGS } from './endless-builds';
import BackButton from '@/components/BackButton';
import PixelArrow from '@/components/PixelArrow';
import { playUiSfx } from './ui-sfx';
import { TRIALS, trialBossName, trialSkill, type TrialBody } from './trials';

type WorldLore = { world: string; title: string; chapters: { title: string; paragraphs: string[] }[] };

export default function CelestialTrialsMap({ loreByWorld }: { loreByWorld: Partial<Record<TrialBody, WorldLore>> }) {
  const router = useRouter();
  const loreDialog = useRef<HTMLDialogElement>(null);
  const loreBody = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [, refreshProfile] = useState(0);
  useEffect(() => { const refresh = () => refreshProfile(value => value + 1); window.addEventListener('ruby-profile', refresh); return () => window.removeEventListener('ruby-profile', refresh); }, []);
  const [selected, setSelected] = useState(() => Math.max(0, TRIALS.findIndex(t => t.ready)));
  const [notReady, setNotReady] = useState<{ name: string; key: number; message?:string } | null>(null);
  useEffect(() => { if (!notReady) return; const timer = setTimeout(() => setNotReady(null), notReady.message?3000:1600); return () => clearTimeout(timer); }, [notReady]);
  const ready = TRIALS.map((t, i) => t.ready ? i : -1).filter(i => i >= 0);
  useEffect(() => { setQuery(window.location.search);if(!canEnter('trials'))router.replace('/'); }, []);
  const trial = TRIALS[selected], skill = trialSkill(trial);
  const lore = loreByWorld[trial.id];
  const gem = CELESTIAL_BLESSINGS[trial.boss];
  const cleared = challengeCleared(trial.boss);

  const select = useCallback((index: number) => {
    if (!TRIALS[index].ready) { playUiSfx('locked'); setNotReady({ name: TRIALS[index].name, key: Date.now() }); return; }
    if(!canEnter('trial',TRIALS[index].boss)){playUiSfx('locked');setSelected(index);setNotReady({name:TRIALS[index].name,key:Date.now(),message:'Defeat '+trialBossName(TRIALS[index])+' in Endless Space to unlock.'});return;}
    setSelected(current => { if (current !== index) playUiSfx('page'); return index; });
  }, []);
  const begin = useCallback(() => {
    if(!canEnter('trial',TRIALS[selected].boss)){playUiSfx('locked');setNotReady({name:TRIALS[selected].name,key:Date.now(),message:'Defeat '+trialBossName(TRIALS[selected])+' in Endless Space to unlock.'});return;}
    playUiSfx('ascension');
    setTimeout(() => router.push(`/challenge/${TRIALS[selected].id}${query}`), 180);
  }, [router, query, selected]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (loreDialog.current?.open) return;
      const at = ready.indexOf(selected);
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); select(ready[(at + 1) % ready.length]); }
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); select(ready[(at - 1 + ready.length) % ready.length]); }

    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, select, ready]);

  return (
    <main className="ruby-star-ui sm-page">
      <style>{`
        .sm-page { height:100dvh; min-height:0; overflow:hidden; box-sizing: border-box; padding:16px 24px; color: #e7e9f6;
          background: radial-gradient(circle at 20% 50%, #3a1a10 0%, transparent 35%), radial-gradient(circle at 85% 80%, #14142a 0%, transparent 40%), #06070d; }
        .sm-stars { position: fixed; inset: 0; pointer-events: none; opacity: .6;
          background-image: radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#9fb6ff 1px, transparent 1px), radial-gradient(#ffd6e6 1px, transparent 1px);
          background-size: 83px 79px, 131px 127px, 197px 173px; background-position: 7px 19px, 53px 3px, 101px 67px; }
        .sm-inner { position:relative; max-width:1200px; width:100%; height:100%; min-height:0; margin:0 auto; display:grid; grid-template-rows:auto auto auto minmax(0,1fr) auto; gap:8px; }
        .sm-title { margin:0; text-align: center; font-family: var(--font-pixel); font-size: clamp(1.4rem, 3.4vw, 2.2rem); letter-spacing: .1em;
          color: #c9cfff; text-shadow: 0 0 6px #7f8cff88, 3px 3px 0 #1a1d3a; }
        .sm-sub { text-align: center; font-family: var(--font-mono); font-size: .78rem; letter-spacing: .28em; color: #8d93b3; margin:0; }
        .sm-map { position: relative; width:100%; height:100%; min-height:0; border: 1px solid #3d4878; background:#080d1a80; overflow: hidden; box-shadow: inset 0 0 0 3px #0d1226; }
        .sm-map::before { content:''; position:absolute; inset:6px; pointer-events:none; z-index:0; opacity:.8; background:
          linear-gradient(#7f8cff,#7f8cff) 0 0 / 18px 2px no-repeat, linear-gradient(#7f8cff,#7f8cff) 0 0 / 2px 18px no-repeat,
          linear-gradient(#7f8cff,#7f8cff) 100% 0 / 18px 2px no-repeat, linear-gradient(#7f8cff,#7f8cff) 100% 0 / 2px 18px no-repeat,
          linear-gradient(#7f8cff,#7f8cff) 0 100% / 18px 2px no-repeat, linear-gradient(#7f8cff,#7f8cff) 0 100% / 2px 18px no-repeat,
          linear-gradient(#7f8cff,#7f8cff) 100% 100% / 18px 2px no-repeat, linear-gradient(#7f8cff,#7f8cff) 100% 100% / 2px 18px no-repeat; }
        .sm-route { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; filter: drop-shadow(0 0 3px #7f8cff); }
        .sm-node { position: absolute; transform: translate(-50%, -50%); padding: 0; background: none; border: 0; cursor: pointer; color: inherit; font: inherit;
          filter: drop-shadow(0 0 4px var(--glow)); transition: filter 160ms ease, transform 160ms ease; }
        .sm-node:hover, .sm-node:focus-visible { outline: none; filter: drop-shadow(0 0 6px var(--glow)); transform: translate(-50%, -50%) scale(1.08); }
        .sm-art { position: relative; display: block; width: var(--s); height: var(--s); animation: smFloat 3.2s ease-in-out infinite; animation-delay: var(--delay); }
        @keyframes smFloat { 0%, 100% { translate: 0 0; } 50% { translate: 0 -5px; } }
        .sm-label { position: absolute; left: 50%; top: calc(100% + 10px); transform: translateX(-50%); white-space: nowrap;
          font-family: var(--font-pixel); font-size: 9px; letter-spacing: .08em; color: #8d93b3; }
        .sm-node[aria-pressed="true"] .sm-label { color: var(--glow); }
        .sm-node.sm-cleared { isolation:isolate; }
        .sm-completion-aura { position:absolute; left:50%; top:50%; width:max(96px,calc(var(--s) * 1.9)); aspect-ratio:1; transform:translate(-50%,-50%); z-index:-1; pointer-events:none;
          background:radial-gradient(circle,#fff2be66 0%,#f5ce6740 28%,#e8ad3824 46%,transparent 70%); animation:smRadiance 3.6s ease-in-out infinite; }
        .sm-completion-aura::before { content:''; position:absolute; inset:-12%; background:repeating-conic-gradient(from 0deg,transparent 0deg 16deg,#ffe6a34d 20deg 25deg,transparent 29deg 45deg);
          mask-image:radial-gradient(circle,transparent 12%,#000 30%,#0009 43%,transparent 67%); animation:smRadiantRays 36s linear infinite; }
        .sm-completion-aura::after { content:''; position:absolute; inset:18%; border-radius:50%; background:radial-gradient(circle,#fff8dc55,transparent 68%); }
        @keyframes smRadiance { 0%,100% { opacity:.72; } 50% { opacity:1; } }
        @keyframes smRadiantRays { to { rotate:360deg; } }
        @media(prefers-reduced-motion:reduce) { .sm-completion-aura,.sm-completion-aura::before { animation:none; } }
        .sm-clear-badge { position:absolute; right:-19px; top:-19px; z-index:4; width:24px; height:24px; display:grid; place-items:center; box-sizing:border-box; background:#241c10; border:2px solid #f3ca66; box-shadow:0 0 8px #edbd4955; color:#ffe6a0; }
        .sm-clear-badge svg { width:18px; height:18px; }
        .sm-node.sm-cleared .sm-label { color:#f3d083; }
        .sm-select { position: absolute; left: 50%; top: 50%; width: calc(var(--s) + 26px); height: calc(var(--s) + 26px); transform: translate(-50%, -50%);
          pointer-events: none; animation: smPulse 1.2s ease-in-out infinite; background:
          linear-gradient(var(--glow), var(--glow)) 0 0 / 14px 3px no-repeat, linear-gradient(var(--glow), var(--glow)) 0 0 / 3px 14px no-repeat,
          linear-gradient(var(--glow), var(--glow)) 100% 0 / 14px 3px no-repeat, linear-gradient(var(--glow), var(--glow)) 100% 0 / 3px 14px no-repeat,
          linear-gradient(var(--glow), var(--glow)) 0 100% / 14px 3px no-repeat, linear-gradient(var(--glow), var(--glow)) 0 100% / 3px 14px no-repeat,
          linear-gradient(var(--glow), var(--glow)) 100% 100% / 14px 3px no-repeat, linear-gradient(var(--glow), var(--glow)) 100% 100% / 3px 14px no-repeat; }
        @keyframes smPulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
        .sm-panel { display: flex; align-items: center; gap: 24px; margin-top:0; padding:14px 20px; background: #10131ff2;
          border: 2px solid var(--glow); box-shadow: inset 0 0 0 3px #161a2c, 0 0 6px color-mix(in srgb, var(--glow) 35%, transparent); }
        .sm-panel-name { font-family: var(--font-pixel); font-size: 1rem; line-height: 1.6; color: var(--glow); }
        .sm-panel-row { margin-top: 4px; font-family: var(--font-mono); font-size: .85rem; color: #b9bdd6; }
        .sm-panel-row strong { color: #e7e9f6; }
        .sm-panel-info { flex:1; min-width:0; }
        .sm-gem-reward { display:flex; align-items:center; gap:8px; flex-shrink:0; color:var(--gem); }
        .sm-gem-art { width:48px; display:block; }
        .sm-gem-art svg { width:100%; display:block; }
        .sm-gem-reward small { display:block; margin-bottom:5px; color:#a2abc6; font-family:var(--font-mono); font-size:.65rem; letter-spacing:.12em; }
        .sm-gem-reward strong { display:block; font-family:var(--font-pixel); font-size:.7rem; text-shadow:0 0 8px color-mix(in srgb,var(--gem) 35%,transparent); }
        .sm-panel-note { margin-top: 6px; font-family: var(--font-mono); font-size: .75rem; color: #7d84a3; }
        .sm-begin { flex-shrink:0; padding: 14px 20px; font-family: var(--font-pixel); font-size: .8rem; cursor: pointer; white-space: nowrap;
          color: #0b0c14; background: var(--glow); border: 2px solid #ffffffaa; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--glow) 70%, #000), 0 0 6px color-mix(in srgb, var(--glow) 50%, transparent); }
        .sm-begin:hover, .sm-begin:focus-visible { outline: none; filter: brightness(1.12); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--glow) 70%, #000), 0 0 8px var(--glow); }
        .sm-actions { display:flex; align-items:stretch; gap:10px; flex-shrink:0; }
        .sm-lore-button, .sm-lore-close { display:inline-grid; place-items:center; padding:6px 9px; cursor:pointer; color:#e6e4ff; background:#17182b;
          border:1px solid #827bb1; box-shadow:inset 0 0 0 3px #22253d; }
        .sm-lore-button:hover, .sm-lore-button:focus-visible, .sm-lore-close:hover, .sm-lore-close:focus-visible { background:#272342; border-color:#c6b5ff; }
        .sm-lore { --lore-light:#ffc491; --lore-rim:#b27b58; --lore-edge:#654739; --lore-dark:#181520; --lore-panel:#1c1825; --lore-hover:#e5ac80;
          inset:0; margin:auto; width:min(760px, calc(100vw - 48px)); height:min(760px, calc(100dvh - 48px)); box-sizing:border-box; padding:0; overflow:hidden;
          color:#f0e9e3; background:#111321; border:2px solid var(--lore-rim); box-shadow:0 0 24px color-mix(in srgb, var(--lore-light) 20%, transparent); }
        .sm-lore[data-world="moon"] { --lore-light:#e1c8ff; --lore-rim:#9b74cf; --lore-edge:#4e3d69; --lore-dark:#161426; --lore-panel:#201a32; --lore-hover:#c6a0f7; color:#ece7f5; }
        .sm-lore[data-world="saturn"] { --lore-light:#c9f4ff; --lore-rim:#71b5cf; --lore-edge:#355769; --lore-dark:#111c2b; --lore-panel:#18283a; --lore-hover:#9eddf2; color:#e6f0f5; }
        .sm-lore[data-world="gaia"] { --lore-light:#d6f5ab; --lore-rim:#91b85a; --lore-edge:#455d36; --lore-dark:#151f1c; --lore-panel:#1b2b22; --lore-hover:#b7db86; color:#eef2e5; }
        .sm-lore[data-world="venus"] { --lore-light:#ffe2d1; --lore-rim:#c79b8a; --lore-edge:#674b45; --lore-dark:#221923; --lore-panel:#2a2028; --lore-hover:#e6bbaa; color:#f4ebe7; }
        .sm-lore[data-world="binary"] { --lore-light:#e9f6ff; --lore-rim:#83b6eb; --lore-edge:#504d68; --lore-dark:#172034; --lore-panel:linear-gradient(90deg,#32222c,#1a2b43); --lore-hover:#afd8ff;
          color:#edf1fa; border-top-color:#ff8f7a; border-left-color:#ff8f7a; }
        .sm-lore[data-world="neptune"] { --lore-light:#c7e2ff; --lore-rim:#648bec; --lore-edge:#354b79; --lore-dark:#101a30; --lore-panel:#142840; --lore-hover:#91b7ff; color:#e8effb; }
        .sm-lore[data-world="sirius"] { --lore-light:#fff0bb; --lore-rim:#d3b568; --lore-edge:#655735; --lore-dark:#211e26; --lore-panel:#2d2830; --lore-hover:#ecd88b; color:#f6f1e5; }
        .sm-lore[data-world="singularity"] { --lore-light:#e7def4; --lore-rim:#9a8caa; --lore-edge:#4c405b; --lore-dark:#171520; --lore-panel:#211b2c; --lore-hover:#c3b6d3; color:#ece8f3; }
        .sm-lore[data-world="jupiter"] { --lore-light:#c1f7e7; --lore-rim:#69bda8; --lore-edge:#355b59; --lore-dark:#121f27; --lore-panel:#1a2b30; --lore-hover:#9ae6d0; color:#e7f2ef; }
        .sm-lore[open] { display:flex; flex-direction:column; }
        .sm-lore::backdrop { background:#06070de0; }
        .sm-lore-header { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:18px 24px; border-bottom:1px solid var(--lore-edge); background:var(--lore-panel); }
        .sm-lore-header h2 { margin:0; color:var(--lore-light); font-family:var(--font-pixel); font-size:1rem; line-height:1.6; }
        .sm-lore-close { font-family:var(--font-pixel); font-size:.6875rem; min-height:40px; padding-inline:12px; }
        .sm-lore-body { flex:1; min-height:0; overflow:auto; padding:24px clamp(24px, 6vw, 64px) 32px; font:1.125rem/1.65 var(--font-mono); }
        .sm-lore-body::-webkit-scrollbar { width:16px; }
        .sm-lore-body::-webkit-scrollbar-track { background:var(--lore-dark); border-left-color:var(--lore-edge); }
        .sm-lore-body::-webkit-scrollbar-thumb { background:var(--lore-rim); border-color:var(--lore-dark); }
        .sm-lore-body::-webkit-scrollbar-thumb:hover { background:var(--lore-hover); }
        .sm-lore-body::-webkit-scrollbar-thumb:active { background:var(--lore-light); }
        @supports (-moz-appearance:none) { .sm-lore-body { scrollbar-width:auto; scrollbar-color:var(--lore-rim) var(--lore-dark); } }
        .sm-lore-body:focus { outline:none; }
        .sm-lore-body section + section { margin-top:28px; padding-top:24px; border-top:1px solid var(--lore-edge); }
        .sm-lore-body h3 { margin:0 0 14px; color:var(--lore-light); font-family:var(--font-pixel); font-size:.75rem; line-height:1.6; }
        .sm-lore-body p { margin:0 0 .9em; }
        /* EXIT stands out against the dark map: brighter frame, panel fill and a soft glow (overrides the shared button's inline style). */
        .sm-exit button { padding: 12px 22px !important; font-size: 1rem !important; gap: 10px !important; color: #e7e9f6 !important; background: #161b36 !important;
          border: 2px solid #7f8cff !important; border-radius: 0 !important; box-shadow: inset 0 0 0 3px #0e1228, 0 0 6px #7f8cff55; }
        .sm-exit button:hover, .sm-exit button:focus-visible { outline: none; color: #ffffff !important; background: #222a52 !important; border-color: #c9cfff !important; box-shadow: inset 0 0 0 3px #0e1228, 0 0 8px #7f8cffaa; }
        .sm-node.sm-locked { filter: grayscale(1) brightness(.45); }
        .sm-node.sm-locked:hover, .sm-node.sm-locked:focus-visible { filter: grayscale(1) brightness(.6); transform: translate(-50%, -50%); }
        .sm-node.sm-locked .sm-art { animation: none; }
        .sm-lock { position: absolute; left: 50%; top: 50%; z-index: 3; width: 14px; height: 11px; transform: translate(-50%, -30%); background: #c9cde0;
          box-shadow: inset -3px -3px 0 #7d84a3; }
        .sm-lock::before { content: ''; position: absolute; left: 3px; top: -7px; width: 8px; height: 8px; box-sizing: border-box; border: 2px solid #c9cde0; border-bottom: 0; }
        .sm-toast { position: absolute; left: 50%; bottom: 18px; z-index: 5; transform: translateX(-50%); padding: 10px 16px; font-family: var(--font-pixel); font-size: .7rem;
          width:max-content;max-width:calc(100% - 36px);text-align:center;line-height:1.8;box-sizing:border-box;letter-spacing: .08em; color: #ffd6d6; background: #1a0f16f2; border: 2px solid #c75b6b; box-shadow: 0 0 14px #c75b6b55; animation: smToast 1.6s ease forwards; }
        @keyframes smToast { 0%, 80% { opacity: 1; } 100% { opacity: 0; } }
        @media(max-height:680px) {
          .sm-page { padding:12px 20px; }.sm-inner { gap:6px; }
          .sm-title { font-size:1.3rem; }.sm-sub { font-size:.68rem; }
          .sm-exit button { padding:8px 16px !important; font-size:.85rem !important; }
          .sm-panel { padding:10px 16px; gap:16px; }.sm-panel-name { font-size:.8rem; }.sm-panel-row { font-size:.75rem; }
          .sm-gem-art { width:38px; }.sm-gem-reward { gap:6px; }.sm-gem-reward strong { font-size:.6rem; }
          .sm-begin { padding:12px 14px; font-size:.7rem; }
        }
      `}</style>
      <CelestialBackdrop variant="atlas"/>
      <div className="sm-inner">
        <div className="sm-exit"><BackButton href={'/' + query} playSound={() => playUiSfx('back')} arrow={<PixelArrow direction="left" />} /></div>
        <h1 className="sm-title">CELESTIAL CHALLENGE</h1>
        <p className="sm-sub">CHOOSE A WORLD</p>
        <div className="sm-map" role="group" aria-label="Star map">
          <svg className="sm-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={TRIALS.map(t => `${t.x},${t.y}`).join(' ')} fill="none" stroke="#5a64a0" strokeWidth=".35" strokeDasharray="1.2 1.2" vectorEffect="non-scaling-stroke" />
          </svg>
          {[[6, 14], [19, 86], [38, 12], [58, 88], [66, 10], [80, 44], [97, 12], [44, 54], [24, 46], [76, 90]].map(([x, y], i) =>
            <span key={'spark' + i} className="sm-spark" aria-hidden="true" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${-i * .53}s` }} />)}
          {TRIALS.map((body, i) => {
            const glow = trialSkill(body).color === '#303036' ? '#bcbccd' : trialSkill(body).color;
            const cleared = challengeCleared(body.boss);
            return (
              <button key={body.id} type="button" className={'sm-node' + (cleared ? ' sm-cleared' : '') + (body.ready && canEnter('trial',body.boss) ? '' : ' sm-locked')} aria-pressed={i === selected} aria-label={`Challenge: ${body.name}${body.ready ? '' : ' (not ready)'}${cleared ? ' (cleared)' : ''}`}
                style={{ left: `${body.x}%`, top: `${body.y}%`, ['--glow' as string]: glow, ['--s' as string]: `${body.size}px`, ['--delay' as string]: `${-i * .37}s` }}
                onMouseEnter={() => playUiSfx('hover')} onFocus={() => playUiSfx('hover')}
                onClick={() => i === selected ? begin() : select(i)}>
                {cleared && <span className="sm-completion-aura" aria-hidden="true" />}
                <span className="sm-art"><CelestialBody trial={body} /></span>
                {cleared && <span className="sm-clear-badge" aria-hidden="true"><svg viewBox="0 0 20 20" shapeRendering="crispEdges"><path d="M2 8H6V12H9V8H12V4H16V11H13V14H10V17H6V14H2Z" fill="currentColor" /></svg></span>}
                {(!body.ready||!canEnter('trial',body.boss)) && <span className="sm-lock" aria-hidden="true" />}
                {i === selected && <span className="sm-select" aria-hidden="true" />}
                <span className="sm-label" style={{ top: `calc(100% + ${body.id === 'sun' || body.id === 'sirius' ? Math.round(body.size * .3) + 10 : 18}px)` }}>{body.name}</span>
              </button>
            );
          })}
          {notReady && <div key={notReady.key} className="sm-toast" role="status">{notReady.message??notReady.name+' · CHALLENGE NOT READY'}</div>}
        </div>
        <section className="sm-panel" aria-live="polite" style={{ ['--glow' as string]: skill.color === '#303036' ? '#bcbccd' : skill.color }}>
          <div className="sm-panel-info">
            <div className="sm-panel-note">{!canEnter('trial',trial.boss)?'Defeat this guardian in Endless Space to unlock.':cleared?(isDesktop()?'CLEARED · GEMSTONE ACQUIRED':'CLEARED'):'UNCLEARED'}</div><div className="sm-panel-name">CHALLENGE: {trial.name}</div>
            <div className="sm-panel-row">Guardian: <strong>{trialBossName(trial)}</strong> · Celestial skill: <strong>{skill.name}</strong></div>
          </div>
          <div className="sm-gem-reward" aria-label={`Gemstone: ${gem.name}`} style={{ ['--gem' as string]: gem.color }}>
            <span className="sm-gem-art"><BlessingGem kind={trial.boss} /></span>
            <span><small>GEMSTONE</small><strong>{gem.name.toUpperCase()}</strong></span>
          </div>
          <div className="sm-actions">
            {lore && <button type="button" className="sm-lore-button" aria-label={`Read ${lore.world} lore`} aria-haspopup="dialog" title={`Read ${lore.world} lore`}
              onMouseEnter={() => playUiSfx('hover')} onClick={() => {
                playUiSfx('page');
                loreDialog.current?.showModal();
                loreBody.current?.focus();
              }}><LobbyUtilityIcon kind="book" /></button>}
            <button type="button" className="sm-begin" onMouseEnter={() => playUiSfx('hover')} onClick={begin}>BEGIN CHALLENGE ▶</button>
          </div>
        </section>
      </div>
      {lore && <dialog key={trial.id} ref={loreDialog} className="sm-lore" data-world={trial.id} aria-labelledby="world-lore-title" onClose={() => playUiSfx('back')}
        onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <header className="sm-lore-header">
          <h2 id="world-lore-title">{lore.title}</h2>
          <button type="button" className="sm-lore-close" onClick={() => loreDialog.current?.close()}>CLOSE</button>
        </header>
        <article ref={loreBody} className="sm-lore-body" tabIndex={0}>
          {lore.chapters.map(chapter => <section key={chapter.title}>
            <h3>{chapter.title}</h3>
            {chapter.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>)}
        </article>
      </dialog>}
    </main>
  );
}
