'use client';
import {playUiSfx} from './ui-sfx';
import SkillPortrait from './SkillPortrait';
import ConstellationPortrait from './ConstellationPortrait';
import type {Constellation} from './engine';
import MenuButton from './MenuButton';
import {useState,type ReactNode} from 'react';
import {getProfile,isDesktop} from './profile';
import {aliens,bosses} from './guide-data';
import {BOSS_TYPES,BOSS_NAMES,BOSS_SKILL_REWARDS,SPECIAL_SKILLS} from './constants';
import {CONSTELLATIONS} from './engine';
import {CELESTIAL_BLESSINGS} from './endless-builds';
import {TRIALS, type TrialBody} from './trials';
import EnemyPortrait from './EnemyPortrait';
import CelestialEnemyPortrait from './CelestialEnemyPortrait';
import {celestialEnemies} from './celestial-enemy-data';
import {WorldPortrait} from './CelestialBody';
import BlessingGem from './BlessingGem';
const ENVIRONMENT: Record<TrialBody, string> = {
 sun: 'A forge above a sea of solar plasma, with glowing seams and glass coolant tanks.',
 venus: 'A weathered sandstone citadel half buried in windblown sand.',
 gaia: 'A dense forest where moss, grass, and wildflowers grow over old stonework.',
 moon: 'A shadowy cavern filled with violet mist and tall crystal spires.',
 jupiter: 'A bronze station above rolling storm clouds, with lightning flashing below.',
 saturn: 'An icebound station overlooking Saturn’s rings, with snow sweeping past blue crystal walls.',
 neptune: 'A submerged station among limestone reefs, drifting kelp, and coral.',
 sirius: 'A pale stone sanctuary with tall arches, stained glass, and pools of warm light.',
 binary: 'A station between two orbiting stars, lit by shifting coral and blue light.',
 singularity: 'A dark station beside a black hole, surrounded by spirals of violet and green debris.',
};
type TerminalCard={id:string;name:string;text:ReactNode;seen:boolean;art:ReactNode;group?:TrialBody};
export default function ExplorationTerminal({onClose}:{onClose:()=>void}){
 const [topic,setTopic]=useState('Aliens');const p=getProfile();const known=(value:boolean)=>!isDesktop()||value;
 const cards:TerminalCard[]=topic==='Aliens'?aliens.map(a=>({id:a.type,name:a.name,text:<>{a.description}{a.reward&&<span style={{display:'block',marginTop:4,color:'#ffd98a'}}>Killing buff: {a.reward}</span>}</>,seen:known(p.encountered.includes(a.type)),art:<EnemyPortrait type={a.type}/>})):
 topic==='Celestial enemies'?celestialEnemies.map(entry=>({id:entry.id,name:entry.name,text:entry.description,seen:known(p.defeated.includes(TRIALS.find(t=>t.id===entry.map)!.boss)),art:<CelestialEnemyPortrait entry={entry}/>,group:entry.map})):
 topic==='Alien bosses'?BOSS_TYPES.map(type=>({id:type,name:BOSS_NAMES[type],text:bosses[type].description,seen:known(p.encountered.includes(type)),art:<EnemyPortrait type={type}/>})):
 topic==='Constellations'?Object.entries(CONSTELLATIONS).map(([id,c])=>({id,name:c.name,text:c.description,seen:known(p.constellations.includes(id)),art:<ConstellationPortrait kind={id as Constellation}/>})):
 topic==='Celestial skills'?BOSS_TYPES.map(type=>{const id=BOSS_SKILL_REWARDS[type],s=SPECIAL_SKILLS[id];return {id,name:s.name,text:bosses[type].skill,seen:known(p.skills.includes(id)),art:<SkillPortrait kind={id}/>};}):
 topic==='Celestial gems'?BOSS_TYPES.map(type=>({id:type,name:CELESTIAL_BLESSINGS[type].name,text:CELESTIAL_BLESSINGS[type].description,seen:known(p.completed.includes(type)),art:<div style={{width:72}}><BlessingGem kind={type}/></div>})):
 TRIALS.map(t=>({id:t.id,name:t.name,text:ENVIRONMENT[t.id],seen:known(p.defeated.includes(t.boss)),art:<WorldPortrait trial={t}/>}));
 const groups=topic==='Celestial enemies'?TRIALS.map(t=>({id:t.id,title:t.name,cards:cards.filter(c=>c.group===t.id)})).filter(g=>g.cards.length):[{id:'all',title:'',cards}];
 return <div role="dialog" aria-modal="true" aria-label="Exploration terminal" onClick={e=>{if(e.target===e.currentTarget){playUiSfx('back');onClose();}}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')onClose();}} style={{position:'fixed',inset:0,zIndex:400,background:'#050914f5',padding:24,overflow:'auto',color:'#d9e8ff'}}>
 <div style={{maxWidth:1100,margin:'auto'}}><div style={{display:'flex',justifyContent:'space-between'}}><h2 style={{color:'#9aa8ff'}}>EXPLORATION TERMINAL</h2><MenuButton autoFocus className="btn" sound="back" onClick={onClose}>CLOSE</MenuButton></div>
 <nav aria-label="Exploration topics" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,margin:'12px 0 24px'}}>{['Aliens','Celestial enemies','Alien bosses','Constellations','Celestial gems','Celestial skills','Planets & stars'].map(t=><MenuButton sound="page" style={{flex:"1 1 156px",minHeight:44,padding:"10px 14px",border:"1px solid "+(topic===t?"#a5e6e0":"#485a77"),background:topic===t?"#20394d":"#101a2b",color:topic===t?"#d6fff5":"#aebed7",fontFamily:"var(--font-pixel)",fontSize:10,lineHeight:1.6,letterSpacing:".02em",cursor:"pointer"}} aria-pressed={topic===t} key={t} onClick={()=>setTopic(t)}>{t}</MenuButton>)}</nav>
 {groups.map(group=><section key={group.id} aria-label={group.title||undefined} style={{marginBottom:24}}>{group.title&&<h3 style={{color:'#9aa8ff',fontFamily:'var(--font-pixel)',fontSize:12,margin:'20px 0 12px'}}>{group.title}</h3>}<div style={{display:'grid',gridTemplateColumns:topic==='Celestial enemies'?'repeat(auto-fill,minmax(230px,1fr))':'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{group.cards.map(c=><article key={c.id} style={{boxSizing:'border-box',height:topic==='Celestial enemies'?280:undefined,padding:16,border:'1px solid '+(c.seen?'#6d9cab':'#323849'),background:'#101a2b',opacity:c.seen?1:.45}}>
 <div style={{filter:c.seen?'none':'grayscale(1)'}}>{c.art}</div><h3 style={{color:c.seen?'#a5e6e0':'#8b91aa'}}>{c.name}</h3><small>{c.seen?'RECORDED':'UNDISCOVERED'}</small><p style={{lineHeight:1.6,fontFamily:'var(--font-mono)',whiteSpace:'pre-line'}}>{c.seen?c.text:'Continue exploring to record this entry.'}</p></article>)}</div></section>)}
 </div></div>;
}
