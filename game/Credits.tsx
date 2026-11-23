'use client';
import MenuButton from './MenuButton';
import {APP_VERSION} from './app-version';

// The credits panel, opened from Settings. Keep this list in step with the sources recorded in docs/ruby-star/AUDIO.md.
const SECTIONS: { title: string; lines: string[] }[] = [
 { title: 'GAME', lines: ['Ruby Star', 'Design, programming and art by Natthapol'] },
 { title: 'MUSIC', lines: ['Fesliyan Studios — fesliyanstudios.com'] },
 { title: 'SOUND EFFECTS', lines: ['Uppbeat — uppbeat.io', 'Pixabay — pixabay.com', 'Mixkit — mixkit.co'] },
 { title: 'FONTS', lines: ['Press Start 2P — The Press Start 2P Project Authors (SIL Open Font License 1.1)', 'Share Tech Mono — Carrois Type Design (SIL Open Font License 1.1)'] },
 { title: 'BUILT WITH', lines: ['Next.js, React and Electron'] },
];

export default function Credits({onClose}:{onClose:()=>void}){
 return <div role="dialog" aria-modal="true" aria-label="Credits" onClick={e=>{if(e.target===e.currentTarget)onClose();}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')onClose();}} style={{position:'fixed',inset:0,zIndex:520,background:'#050914f2',display:'grid',placeItems:'center',padding:24}}>
  <section style={{width:'min(520px,100%)',maxHeight:'calc(100vh - 48px)',overflowY:'auto',background:'#101a2b',border:'2px solid #8eb7c9',padding:24,color:'#dfedf4',boxShadow:'0 0 24px #80bfd522'}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:24,marginBottom:18}}><h2 style={{fontFamily:'var(--font-pixel)',fontSize:17,color:'#b3dfeb'}}>CREDITS</h2><MenuButton autoFocus className="btn rs-panel-btn" sound="back" onClick={onClose}>CLOSE</MenuButton></div>
   {SECTIONS.map(section=><div key={section.title} style={{marginBottom:16}}>
    <h3 style={{fontFamily:'var(--font-pixel)',fontSize:10,color:'#ff8fb3',marginBottom:8}}>{section.title}</h3>
    {section.lines.map(line=><p key={line} style={{fontFamily:'var(--font-mono)',fontSize:16,lineHeight:1.5}}>{line}</p>)}
   </div>)}
   <p style={{fontFamily:'var(--font-pixel)',fontSize:9,color:'#7f98a8',marginTop:8}}>VERSION {APP_VERSION}</p>
  </section>
 </div>;
}
