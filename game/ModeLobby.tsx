'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PixelArrow from '@/components/PixelArrow';
import { canEnter, getProfile, highestStage, introSeen, isDesktop, markIntroSeen } from './profile';
import IntroCutscene from './IntroCutscene';
import RulesModal from '@/components/RulesModal';
import RubyStarGuide from './RubyStarGuide';
import MenuButton from './MenuButton';
import GameSettings from './GameSettings';
import LobbyUtilityIcon from './LobbyUtilityIcon';
import ExplorationTerminal from './ExplorationTerminal';
import CelestialBackdrop from './CelestialBackdrop';
import { playUiSfx, UiSfx } from './ui-sfx';

type ModeCard = { id: string; title: string; tag?: string; description: string; path?: string; color: string; sound: UiSfx };

const MODES: ModeCard[] = [
  {
    id: 'tutorial', title: 'FIRST ORBIT', tag: 'TUTORIAL', color: '#7fd7ff', sound: 'confirm', path: '/tutorial',
    description: 'Learn to move, fight, power up with star energy, protect Ruby, teleport, dodge meteors and cast a celestial skill.',
  },
  {
    id: 'endless', title: 'ENDLESS SPACE', color: '#ff4f8b', sound: 'endless', path: '/endless',
    description: 'Defend the Ruby across four chambers and see how long you can survive the endless onslaught.',
  },
  {
    id: 'trials', title: 'CELESTIAL CHALLENGE', color: '#9aa8ff', sound: 'ascension', path: '/challenge',
    description: 'Travel to a world and face its guardian in an epic multi-phase boss battle with its own rules.',
  },
  {
    id: 'gambit', title: 'STAR GAMBIT', tag: 'IN DEVELOPMENT', color: '#ffd27a', sound: 'confirm', path: '/gambit',
    description: 'Build your run: pick a rule, fill three weapon slots and hold the bazaar.',
  },
];

// The Endless Space card asks Endless or Ascension once Ascension is unlocked.
const ENDLESS_STARTS: ModeCard[] = [
  { id: 'endless', title: 'ENDLESS', color: '#ff4f8b', sound: 'endless', path: '/endless', description: 'Start from stage 0.' },
  { id: 'ascension', title: 'ASCENSION', color: '#c99bff', sound: 'ascension', path: '/ascension', description: 'Start at stage 10 with celestial powers awakened.' },
];

// Square pixel emblems for each mode, drawn with CSS blocks.
function Emblem({ id }: { id: string }) {
  if (id === 'tutorial') return <div className="rs-emblem">
    <span className="rs-orbit-path" /><span className="rs-gem rs-gem-small" />
    <span className="rs-orbit-arm"><span className="rs-orbit-ship" /></span>
  </div>;
  if (id === 'trials') return <div className="rs-emblem">
    <span className="rs-tp">
      <span className="rs-tp-ring rs-tp-ring-back" /><span className="rs-tp-planet" /><span className="rs-tp-ring rs-tp-ring-front" />
    </span>
    <span className="rs-tp-moon" /><span className="rs-tp-spark rs-tp-spark-a" /><span className="rs-tp-spark rs-tp-spark-b" />
  </div>;
  if (id === 'gambit') return <div className="rs-emblem"><span className="rs-gambit">
    <span className="rs-gambit-card rs-gambit-card-a"><span className="rs-glint" /></span><span className="rs-gambit-card rs-gambit-card-b"><span className="rs-glint" /></span>
  </span><span className="rs-tp-spark rs-gambit-spark" />
  </div>;
  return <div className="rs-emblem">
    {id === 'ascension' && <><span className="rs-ray rs-ray-a" /><span className="rs-ray rs-ray-b" /><span className="rs-crown" /></>}
    <span className={id === 'ascension' ? 'rs-gem rs-gem-ascended' : 'rs-gem'} />
  </div>;
}

export default function RubyStarLobby() {
  const router = useRouter();
  const [terminal,setTerminal]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [rulesOpen,setRulesOpen]=useState(false);
  const [intro,setIntro]=useState<null|'first'|'replay'>(null); // the opening cutscene: on first launch (then the tutorial), or replayed
  useEffect(()=>{if(!introSeen()&&!(isDesktop()&&getProfile().tutorialCompleted))setIntro('first');},[]); // new players only; anyone can replay it
  const [query, setQuery] = useState('');
  const [, refreshProfile] = useState(0);
  useEffect(() => { const refresh=()=>refreshProfile(value=>value+1);window.addEventListener('ruby-profile',refresh);return ()=>window.removeEventListener('ruby-profile',refresh); }, []);
  const [index, setIndex] = useState(0); // First Orbit (the tutorial) starts centred
  // Debug query flags such as ?god=1 carry through to the chosen mode.
  useEffect(() => { setQuery(window.location.search);if(isDesktop()&&getProfile().tutorialCompleted)setIndex(1); }, []);

  const rotate = useCallback((step: number) => {
    playUiSfx(step > 0 ? 'page' : 'back');
    setIndex(i => (i + step + MODES.length) % MODES.length);
  }, []);

  const [startPick,setStartPick]=useState(false); // Normal / Ascension choice for Endless Space
  const launch = useCallback((mode: ModeCard) => {
    playUiSfx(mode.sound);
    if (mode.path) setTimeout(() => router.push(mode.path + query), 180);
  }, [router, query]);
  const choose = useCallback((mode: ModeCard) => {
    if(!canEnter(mode.id)){playUiSfx('locked');return;}
    if(mode.id==='endless'&&canEnter('ascension')){playUiSfx('page');setStartPick(true);return;}
    launch(mode);
  }, [launch]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if(terminal||settingsOpen||rulesOpen)return;
      if(startPick){
        if(event.key==='Escape'){event.preventDefault();playUiSfx('back');setStartPick(false);}
        else if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const options=[...document.querySelectorAll<HTMLButtonElement>('.rs-start-option')],at=options.indexOf(document.activeElement as HTMLButtonElement);options[(at+(event.key==='ArrowRight'?1:options.length-1))%options.length]?.focus();}
        return;
      }
      if (event.key === 'ArrowLeft') { event.preventDefault(); rotate(-1); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); rotate(1); }
      else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) choose(MODES[index]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rotate, choose, index, terminal, settingsOpen, rulesOpen, startPick]);

  return (
    <main className="ruby-star-ui rs-lobby">
      <style>{`
        body:has(.ruby-star-ui)::after { display: none; }
        .rs-lobby { height:100dvh; min-height:0; display:grid; place-items:center; box-sizing: border-box; padding:16px 24px; color: #e7e9f6; overflow: hidden;
          background: radial-gradient(circle at 50% 18%, #2a1230 0%, transparent 42%), radial-gradient(circle at 80% 85%, #10203a 0%, transparent 45%), #07080f; }
        .rs-lobby-stars { position: fixed; inset: 0; pointer-events: none; opacity: .55;
          background-image: radial-gradient(#ffffff 1px, transparent 1px), radial-gradient(#9fb6ff 1px, transparent 1px);
          background-size: 97px 89px, 151px 137px; background-position: 13px 29px, 61px 7px; }
        .rs-lobby-inner { position:relative; width:100%; max-width:1200px; margin:0 auto; }
        .rs-lobby-title { margin:0 0 6px; text-align: center; font-family: var(--font-pixel); font-size: clamp(2rem, 5vw, 3.2rem);
          letter-spacing: .12em; color: #ff6f9f; text-shadow: 0 0 18px #ff2f6f88, 4px 4px 0 #3a0f22; }
        .rs-lobby-sub { text-align: center; font-family: var(--font-mono); font-size: .8rem; letter-spacing: .3em; color: #8d93b3; margin: 0 0 18px; }
        .rs-lobby-records { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:10px 18px; margin:0 auto 8px; font-family:var(--font-pixel); font-size:.52rem; line-height:1.8; color:#b2bad2; }
        .rs-lobby-records > strong { color:#f5d78e; letter-spacing:.08em; }
        .rs-lobby-records > span { padding:6px 10px; border:1px solid #8b774b88; background:#131727dc; }
        .rs-lobby-records b { margin-left:8px; color:#f5d78e; }
        .rs-carousel { position: relative; height: 470px; display: flex; align-items: center; justify-content: center; }
        .rs-card { position: absolute; width: 400px; height: 400px; box-sizing: border-box; padding: 24px; display: flex; flex-direction: column;
          align-items: center; text-align: center; background: #10131ff2; color: inherit; font: inherit; cursor: pointer;
          border: 3px solid var(--mode); box-shadow: 0 0 18px color-mix(in srgb, var(--mode) 35%, transparent);
          transition: transform 320ms cubic-bezier(.2,.8,.2,1), opacity 320ms ease, box-shadow 200ms ease, filter 320ms ease; }
        .rs-card[data-slot="0"] { z-index: 3; transform: translateX(0) scale(1); }
        .rs-card[data-slot="0"]:hover, .rs-card[data-slot="0"]:focus-visible { outline: none; box-shadow: 0 0 34px color-mix(in srgb, var(--mode) 70%, transparent); }
        .rs-card[data-slot="-1"] { z-index: 2; transform: translateX(-370px) scale(.72); opacity: .45; filter: saturate(.6); }
        .rs-card[data-slot="1"] { z-index: 2; transform: translateX(370px) scale(.72); opacity: .45; filter: saturate(.6); }
        .rs-card[data-slot="-1"]:hover, .rs-card[data-slot="1"]:hover { opacity: .7; }
        .rs-card[aria-disabled="true"][data-slot] { filter:grayscale(1); opacity:.42; border-style:dashed; }
        .rs-mode-lock { position:absolute; right:20px; top:20px; width:22px; height:18px; background:#b8c1d0; box-shadow:inset -4px -4px 0 #687186; }
        .rs-mode-lock::before { content:''; position:absolute; left:5px; top:-10px; width:12px; height:12px; border:3px solid #b8c1d0; border-bottom:0; box-sizing:border-box; }
        .rs-mode-lock::after { content:''; position:absolute; left:10px; top:6px; width:3px; height:7px; background:#263044; }
        .rs-card[data-hidden] { z-index: 1; transform: scale(.5); opacity: 0; pointer-events: none; }
        .rs-card-name { margin-top: 18px; font-family: var(--font-pixel); font-size:1.35rem; line-height:1.5; color:var(--mode); text-shadow:0 0 14px color-mix(in srgb,var(--mode) 22%,transparent); }
        .rs-card-tag { display: inline-block; margin-top: 8px; font-family: var(--font-pixel); font-size:.6rem; padding:3px 7px; color:var(--mode); border:1px solid color-mix(in srgb,var(--mode) 45%,transparent); background:transparent; }
        .rs-card-desc { margin-top: 12px; font-family: var(--font-mono); font-size:.78rem; line-height:1.5; color:#9ba6bd; }
        .rs-card-go { margin-top: auto; font-family: var(--font-pixel); font-size:.65rem; color:var(--mode); opacity:.8; }
        .rs-arrow { position: absolute; top: 50%; z-index: 4; transform: translateY(-50%); width: 64px; height: 64px; display: grid; place-items: center; transform-origin: center;
          background: #141a2bf0; color: #e7e9f6; border: 2px solid #4a5478; cursor: pointer; transition: border-color 150ms, color 150ms, box-shadow 150ms; }
        .rs-arrow svg { width: 28px; height: 28px; }
        .rs-arrow:hover, .rs-arrow:focus-visible { outline: none; border-color: #ff6f9f; color: #ff6f9f; box-shadow: 0 0 16px #ff2f6f66; }
        .rs-arrow-left { left:0; }
        .rs-arrow-right { right:0; }
        .rs-dots { display: flex; justify-content: center; gap: 10px; }
        .rs-dot { width: 12px; height: 12px; padding: 0; border: 2px solid #4a5478; background: transparent; cursor: pointer; }
        .rs-dot[aria-current="true"] { background: var(--mode); border-color: var(--mode); }
        .rs-card .rs-emblem { transform:scale(1.25); margin:16px 0 22px; }
        .rs-emblem { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
        .rs-gem { position: absolute; left: 42px; top: 42px; width: 56px; height: 56px; background: #ff4f8b; transform: rotate(45deg);
          box-shadow: 0 0 26px #ff2f6f, inset -12px -12px 0 #b8255a, inset 10px 10px 0 #ffb3cc; animation: rsGemFloat 2.4s ease-in-out infinite; }
        .rs-gem-small { left:52px; top:52px; width:36px; height:36px; box-shadow:0 0 18px #ff2f6f88,inset -7px -7px 0 #b8255a,inset 6px 6px 0 #ffb3cc; }
        .rs-orbit-path { position:absolute; inset:16px; border:2px dashed #7fd7ff66; }
        .rs-orbit-arm { position:absolute; inset:16px; }
        .rs-orbit-ship { position:absolute; width:20px; height:20px; left:-10px; top:-10px; animation:rsFirstOrbit 9s linear infinite; background:#ffd35c; border:2px solid #fff0ab; box-shadow:inset -3px -3px 0 #ae772d,0 0 8px #7fd7ff66; }
        .rs-orbit-ship::after { content:''; position:absolute; left:5px; top:3px; width:8px; height:5px; background:#6ecbff; }
        @keyframes rsFirstOrbit { 0% { transform:translate(0,0); } 25% { transform:translate(108px,0); } 50% { transform:translate(108px,108px); } 75% { transform:translate(0,108px); } 100% { transform:translate(0,0); } }
        .rs-gem-ascended { background: #c99bff; box-shadow: 0 0 30px #a56bff, inset -12px -12px 0 #7a45c8, inset 10px 10px 0 #efe0ff; }
        .rs-crown { position: absolute; left: 46px; top: 4px; width: 48px; height: 16px; background:
          linear-gradient(#ffe477, #ffe477) 0 8px / 48px 8px no-repeat, linear-gradient(#ffe477, #ffe477) 0 0 / 8px 8px no-repeat,
          linear-gradient(#ffe477, #ffe477) 20px 0 / 8px 8px no-repeat, linear-gradient(#ffe477, #ffe477) 40px 0 / 8px 8px no-repeat; filter: drop-shadow(0 0 6px #ffcb3a); }
        .rs-ray { position: absolute; left: 66px; top: 6px; width: 8px; height: 128px; background: linear-gradient(transparent, #c99bff66, transparent); }
        .rs-ray-a { transform: rotate(45deg); } .rs-ray-b { transform: rotate(-45deg); }
        .rs-tp { position: absolute; inset: 0; filter: drop-shadow(0 0 14px #7f8cff); animation: rsGemFloat 2.8s ease-in-out infinite; }
        .rs-tp-planet { position: absolute; left: 38px; top: 38px; width: 64px; height: 64px; background: #8f9cff;
          clip-path: polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%);
          box-shadow: inset -14px -14px 0 #5560c8, inset 10px 10px 0 #d6dbff; }
        .rs-tp-planet::after { content: ''; position: absolute; left: 14px; top: 34px; width: 34px; height: 6px; background: #6e79e0; }
        .rs-tp-ring { position: absolute; left: 6px; top: 55px; width: 128px; height: 30px; box-sizing: border-box; border: 6px solid #e3e6ff; transform: rotate(-14deg); }
        .rs-tp-ring-back { clip-path: inset(0 0 50% 0); border-color: #a9b1ee; }
        .rs-tp-ring-front { clip-path: inset(50% 0 0 0); }
        .rs-tp-moon { position: absolute; left: 112px; top: 20px; width: 16px; height: 16px; background: #c9cfe6;
          clip-path: polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%); box-shadow: inset -4px -4px 0 #7d84a3; }
        .rs-tp-spark { position: absolute; width: 14px; height: 14px; background:
          linear-gradient(#ffffff, #ffffff) 50% 0 / 2px 100% no-repeat, linear-gradient(#ffffff, #ffffff) 0 50% / 100% 2px no-repeat;
          animation: rsTwinkle 1.8s ease-in-out infinite; }
        .rs-tp-spark-a { left: 14px; top: 18px; } .rs-tp-spark-b { left: 114px; top: 108px; animation-delay: .9s; }
        @media(max-height:700px) {
          .rs-lobby-title { font-size:2rem; }.rs-lobby-sub { margin-bottom:8px; }
          .rs-carousel { height:400px; }.rs-card { width:350px; height:350px; padding:20px; }
          .rs-card .rs-emblem { transform:scale(1.1); margin:4px 0 8px; }
          .rs-card-name { font-size:1.15rem; margin-top:12px; }.rs-card-desc { font-size:.72rem; margin-top:8px; }
          .rs-card[data-slot="-1"] { transform:translateX(-310px) scale(.68); }.rs-card[data-slot="1"] { transform:translateX(310px) scale(.68); }
        }
        /* a hand of two solid bevelled cards fanned from the bottom, each with a pale glint; the hand floats and glows as one */
        .rs-gambit { position:absolute; inset:0; filter:drop-shadow(0 0 14px #ffb84d); animation:rsGemFloat 2.6s ease-in-out infinite; }
        .rs-gambit-card { position:absolute; width:52px; height:72px; background:#ffd27a; display:grid; place-items:center;
          box-shadow:inset -8px -8px 0 #b8862e, inset 6px 6px 0 #fff0b8; }
        .rs-gambit-card-a { left:32px; top:30px; transform-origin:50% 110%; transform:rotate(-16deg); background:#e0ad4e; box-shadow:inset -8px -8px 0 #8f6420, inset 6px 6px 0 #ffdf94; }
        .rs-gambit-card-b { left:56px; top:28px; transform-origin:50% 110%; transform:rotate(9deg); }
        /* Glint: a flat stepped pale-yellow crystal */
        .rs-glint { width:20px; height:28px; background:#fff3c8; clip-path:polygon(30% 0,70% 0,70% 14%,100% 14%,100% 86%,70% 86%,70% 100%,30% 100%,30% 86%,0 86%,0 14%,30% 14%); }
        .rs-gambit-spark { left:110px; top:16px; }
        .rs-start { position:fixed; inset:0; z-index:20; display:grid; place-items:center; background:#05060ccc; }
        .rs-start-panel { display:flex; flex-direction:column; align-items:center; gap:28px; padding:44px 52px 52px; background:#10131ff7; border:3px solid #ff4f8b; box-shadow:inset 0 0 0 3px #1c1222,0 0 24px #ff2f6f44; }
        .rs-start-title { font-family:var(--font-pixel); font-size:1.1rem; letter-spacing:.1em; color:#ff6f9f; text-shadow:0 0 14px #ff2f6f66; }
        .rs-start-options { display:flex; gap:18px; }
        .rs-start-option { width:260px; padding:30px 24px; display:flex; flex-direction:column; align-items:center; text-align:center; background:#141a2b; color:inherit; font:inherit; cursor:pointer;
          border:3px solid var(--mode); box-shadow:0 0 12px color-mix(in srgb,var(--mode) 25%,transparent); transition:box-shadow 150ms; }
        .rs-start-option:hover, .rs-start-option:focus-visible { outline:none; box-shadow:0 0 30px color-mix(in srgb,var(--mode) 70%,transparent); }
        .rs-start-option .rs-emblem { transform:scale(.8); margin:-12px 0 -10px; }
        @keyframes rsTwinkle { 0%, 100% { opacity: .25; transform: scale(.6); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes rsGemFloat { 0%, 100% { translate: 0 0; } 50% { translate: 0 -6px; } }
      `}</style>
      <CelestialBackdrop/>
      {isDesktop()&&<MenuButton sound="back" aria-label="Quit" style={{position:'fixed',left:24,top:18,zIndex:10,height:44,padding:'0 16px',display:'grid',placeItems:'center',background:'#10192be8',border:'1px solid #b07b7b',color:'#ffd6d6',fontFamily:'var(--font-pixel)',fontSize:12,letterSpacing:'.08em',cursor:'pointer',boxShadow:'inset 0 0 0 3px #2a1820,0 0 12px #e38f8f1c'}} onClick={()=>void window.rubyDesktop?.quit()}>QUIT</MenuButton>}
      <div style={{position:'fixed',top:18,right:24,zIndex:10,display:'flex',gap:12}}>
       <MenuButton sound="page" aria-label="Replay intro" title="Replay intro" onClick={()=>setIntro('replay')} style={{width:48,height:44,display:'grid',placeItems:'center',padding:7,background:'#10192be8',border:'1px solid #b07ba0',cursor:'pointer',boxShadow:'inset 0 0 0 3px #18263a,0 0 12px #e38fc91c'}}>
        <svg viewBox="0 0 16 16" width={22} height={22} shapeRendering="crispEdges" aria-hidden="true"><rect x="1" y="3" width="14" height="10" fill="#2a1830" stroke="#ff8ac8" strokeWidth="1"/><rect x="1" y="3" width="2" height="2" fill="#ff8ac8"/><rect x="1" y="11" width="2" height="2" fill="#ff8ac8"/><rect x="13" y="3" width="2" height="2" fill="#ff8ac8"/><rect x="13" y="11" width="2" height="2" fill="#ff8ac8"/><rect x="6" y="5" width="2" height="6" fill="#ffd6ec"/><rect x="8" y="6" width="2" height="4" fill="#ffd6ec"/><rect x="10" y="7" width="1" height="2" fill="#ffd6ec"/></svg>
       </MenuButton>
       <MenuButton sound="page" aria-label="Rules" title="Rules" onClick={()=>setRulesOpen(true)} style={{width:48,height:44,display:'grid',placeItems:'center',padding:7,background:'#10192be8',border:'1px solid #778cae',color:'#c7ddec',fontFamily:'var(--font-pixel)',fontSize:18,cursor:'pointer',boxShadow:'inset 0 0 0 3px #18263a'}}>?</MenuButton>
       {(['book','settings'] as const).map(kind=><MenuButton key={kind} sound="page" aria-label={kind==='book'?'Exploration terminal':'Settings'} title={kind==='book'?'Exploration terminal · Guidebook':'Settings'} onClick={()=>{if(kind==='book')setTerminal(true);else setSettingsOpen(true);}}
        style={{width:48,height:44,display:'grid',placeItems:'center',padding:7,background:'#10192be8',border:'1px solid '+(kind==='book'?'#827bb1':'#639d9a'),cursor:'pointer',boxShadow:'inset 0 0 0 3px #18263a,0 0 12px #8fc9e31c'}}><LobbyUtilityIcon kind={kind}/></MenuButton>)}
      </div>
      <RulesModal isOpen={rulesOpen} onClose={()=>setRulesOpen(false)} title=":: ENDLESS SPACE" playSound={kind=>playUiSfx(kind)}><RubyStarGuide showEnemyGuide={false} endlessOnly/></RulesModal>
      {settingsOpen&&<GameSettings onClose={()=>setSettingsOpen(false)}/>}
      {intro&&<IntroCutscene onDone={()=>{const first=intro==='first';setIntro(null);if(first){markIntroSeen();router.push('/tutorial'+query);}}}/>}
      {terminal&&<ExplorationTerminal onClose={()=>setTerminal(false)}/>}
      {startPick&&<div className="rs-start" role="dialog" aria-modal="true" aria-label="Choose an Endless Space start" onClick={e=>{if(e.target===e.currentTarget){playUiSfx('back');setStartPick(false);}}}>
        <div className="rs-start-panel">
          <span className="rs-start-title">ENDLESS SPACE</span>
          <div className="rs-start-options">{ENDLESS_STARTS.map((start,i)=>
            <button key={start.id} type="button" className="rs-start-option" autoFocus={i===0} style={{['--mode' as string]:start.color}}
              aria-label={start.title} onMouseEnter={()=>playUiSfx('hover')} onClick={()=>launch(start)}>
              <Emblem id={start.id}/>
              <span className="rs-card-name" style={{marginTop:0}}>{start.title}</span>
              <span className="rs-card-desc">{start.description}</span>
            </button>)}
          </div>
        </div>
      </div>}
      <div className="rs-lobby-inner">
        <h1 className="rs-lobby-title">RUBY STAR</h1>
        <p className="rs-lobby-sub">SELECT MODE</p>
        {isDesktop()&&<div className="rs-lobby-records" aria-label="Highest run"><strong>HIGHEST RUN</strong><span>ENDLESS<b>{highestStage('endless')>0?`STAGE ${highestStage('endless')}`:'—'}</b></span></div>}
        <div className="rs-carousel" role="group" aria-label="Game modes">
          <button type="button" className="rs-arrow rs-arrow-left" aria-label="Previous mode"
            onMouseEnter={() => playUiSfx('hover')} onClick={() => rotate(-1)}><PixelArrow direction="left" /></button>
          {MODES.map((mode, i) => {
            let slot = i - index;
            if (slot > 1) slot -= MODES.length;
            if (slot < -1) slot += MODES.length;
            const center = slot === 0;
            return (
              <button key={mode.id} type="button" className="rs-card" data-slot={slot} data-hidden={Math.abs(slot) > 1 || undefined} aria-hidden={Math.abs(slot) > 1 || undefined} aria-disabled={!mode.path || !canEnter(mode.id) || undefined}
                aria-label={`${mode.title}${mode.tag ? ' ' + mode.tag : ''}${mode.path ? '' : ' (coming soon)'}`}
                tabIndex={center ? 0 : -1} style={{ ['--mode' as string]: mode.color }}
                onMouseEnter={() => playUiSfx('hover')}
                onClick={() => center ? choose(mode) : rotate(slot)}>
                <Emblem id={mode.id} />
                {!canEnter(mode.id)&&<span className="rs-mode-lock" aria-hidden="true"/>}
                <span className="rs-card-name">{mode.title}</span>
                {mode.tag && <span className="rs-card-tag">{mode.tag}</span>}
                <span className="rs-card-desc">{mode.description}</span>
                <span className="rs-card-go" aria-hidden="true">{mode.path ? 'PLAY ▶' : 'COMING SOON'}</span>
              </button>
            );
          })}
          <button type="button" className="rs-arrow rs-arrow-right" aria-label="Next mode"
            onMouseEnter={() => playUiSfx('hover')} onClick={() => rotate(1)}><PixelArrow /></button>
        </div>
        <div className="rs-dots">
          {MODES.map((mode, i) => <button key={mode.id} type="button" className="rs-dot" aria-label={`Show ${mode.title}${mode.tag ? ' ' + mode.tag : ''}`}
            aria-current={i === index} style={{ ['--mode' as string]: mode.color }}
            onClick={() => { if (i !== index) { playUiSfx(i > index ? 'page' : 'back'); setIndex(i); } }} />)}
        </div>
      </div>
    </main>
  );
}
