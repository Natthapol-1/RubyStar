/** Shared startup and route fallback. CSS animation remains independent of the game loop. */
export default function LoadingScreen() {
 return <main className="rs-loading" role="status" aria-label="Ruby Star loading">
  <style>{`
   .rs-loading{position:fixed;inset:0;z-index:10000;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;background:#07080f;
     background-image:radial-gradient(1px 1px at 20% 30%,#ffffff55,transparent),radial-gradient(1px 1px at 70% 60%,#ffffff44,transparent),radial-gradient(1px 1px at 45% 80%,#ffffff33,transparent);background-size:97px 89px,151px 137px,123px 113px}
   .rs-loading-title{margin:0;font-family:var(--font-pixel);font-size:1.6rem;letter-spacing:.12em;color:#ff6f9f;text-shadow:0 0 18px #ff2f6f88,4px 4px 0 #3a0f22}
   .rs-loading-pips{display:flex;gap:10px}
   .rs-loading-pips span{width:10px;height:10px;background:#ff6f9f;box-shadow:0 0 4px #ff2f6f;opacity:.2;animation:rs-load-pip 1.2s steps(1) infinite}
   .rs-loading-pips span:nth-child(2){animation-delay:.4s}.rs-loading-pips span:nth-child(3){animation-delay:.8s}
   @keyframes rs-load-pip{0%{opacity:1}33%{opacity:.2}}
   @media (prefers-reduced-motion:reduce){.rs-loading-pips span{animation:none}.rs-loading-pips span{opacity:.6}}
  `}</style>
  <h1 className="rs-loading-title">RUBY STAR</h1>
  <div className="rs-loading-pips" aria-hidden="true"><span/><span/><span/></div>
 </main>;
}
