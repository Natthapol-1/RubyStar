'use client';
import {playUiSfx} from './ui-sfx';
import SkillPortrait from './SkillPortrait';
import ConstellationPortrait from './ConstellationPortrait';
import type {Constellation} from './engine';
import MenuButton from './MenuButton';
import {useState} from 'react';
import {getProfile,isDesktop} from './profile';
import {aliens,bosses} from './guide-data';
import {BOSS_TYPES,BOSS_NAMES,BOSS_SKILL_REWARDS,SPECIAL_SKILLS} from './constants';
import {CONSTELLATIONS} from './engine';
import {CELESTIAL_BLESSINGS} from './endless-builds';
import {TRIALS} from './trials';
import EnemyPortrait from './EnemyPortrait';
import {WorldPortrait} from './CelestialBody';
import BlessingGem from './BlessingGem';
const ENVIRONMENT:Record<string,string>={sun:'Solar forge. Coolant stations hold back rising heat.',gaia:'Living forest. Sunstones fuel Sunfire against spreading plants.',moon:'Crystal cavern. Reveal the Queen among her illusions.',jupiter:'Storm station. Ground charge and escape the pursuing Reaper.',neptune:'Ocean station. Currents, fish and tides protect a diving guardian.',saturn:'Frozen ring station. Stack shields and roll through the blizzard to break the Warden’s barrier.',singularity:'Dying star field. Map preview.',venus:'Guardian world under development.',sirius:'Guardian world under development.',binary:'Guardian world under development.'};
export default function ExplorationTerminal({onClose}:{onClose:()=>void}){
 const [topic,setTopic]=useState('Aliens');const p=getProfile();const known=(value:boolean)=>!isDesktop()||value;
 const cards=topic==='Aliens'?aliens.map(a=>({id:a.type,name:a.name,text:a.reward?`${a.description}\nKilling buff: ${a.reward}`:a.description,seen:known(p.encountered.includes(a.type)),art:<EnemyPortrait type={a.type}/>})):
 topic==='Alien bosses'?BOSS_TYPES.map(type=>({id:type,name:BOSS_NAMES[type],text:bosses[type].description,seen:known(p.encountered.includes(type)),art:<EnemyPortrait type={type}/>})):
 topic==='Constellations'?Object.entries(CONSTELLATIONS).map(([id,c])=>({id,name:c.name,text:c.description,seen:known(p.constellations.includes(id)),art:<ConstellationPortrait kind={id as Constellation}/>})):
 topic==='Celestial skills'?BOSS_TYPES.map(type=>{const id=BOSS_SKILL_REWARDS[type],s=SPECIAL_SKILLS[id];return {id,name:s.name,text:bosses[type].skill,seen:known(p.skills.includes(id)),art:<SkillPortrait kind={id}/>};}):
 topic==='Celestial gems'?BOSS_TYPES.map(type=>({id:type,name:CELESTIAL_BLESSINGS[type].name,text:CELESTIAL_BLESSINGS[type].description,seen:known(p.completed.includes(type)),art:<div style={{width:72}}><BlessingGem kind={type}/></div>})):
 TRIALS.map(t=>({id:t.id,name:t.name,text:`${BOSS_NAMES[t.boss]} guards ${CELESTIAL_BLESSINGS[t.boss].name}. ${ENVIRONMENT[t.id]}`,seen:known(p.defeated.includes(t.boss)),art:<WorldPortrait trial={t}/>}));
 return <div role="dialog" aria-modal="true" aria-label="Exploration terminal" onClick={e=>{if(e.target===e.currentTarget){playUiSfx('back');onClose();}}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape')onClose();}} style={{position:'fixed',inset:0,zIndex:400,background:'#050914f5',padding:24,overflow:'auto',color:'#d9e8ff'}}>
 <div style={{maxWidth:1100,margin:'auto'}}><div style={{display:'flex',justifyContent:'space-between'}}><h2 style={{color:'#9aa8ff'}}>EXPLORATION TERMINAL</h2><MenuButton autoFocus className="btn" sound="back" onClick={onClose}>CLOSE</MenuButton></div>
 <nav aria-label="Exploration topics" style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,margin:'12px 0 24px'}}>{['Aliens','Alien bosses','Constellations','Celestial gems','Celestial skills','Planets & stars'].map(t=><MenuButton sound="page" style={{flex:"1 1 156px",minHeight:44,padding:"10px 14px",border:"1px solid "+(topic===t?"#a5e6e0":"#485a77"),background:topic===t?"#20394d":"#101a2b",color:topic===t?"#d6fff5":"#aebed7",fontFamily:"var(--font-pixel)",fontSize:10,lineHeight:1.6,letterSpacing:".02em",cursor:"pointer"}} aria-pressed={topic===t} key={t} onClick={()=>setTopic(t)}>{t}</MenuButton>)}</nav>
 <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12}}>{cards.map(c=><article key={c.id} style={{padding:16,border:'1px solid '+(c.seen?'#6d9cab':'#323849'),background:'#101a2b',opacity:c.seen?1:.45}}>
 <div style={{filter:c.seen?'none':'grayscale(1)'}}>{c.art}</div><h3 style={{color:c.seen?'#a5e6e0':'#8b91aa'}}>{c.name}</h3><small>{c.seen?'RECORDED':'UNDISCOVERED'}</small><p style={{lineHeight:1.6,fontFamily:'var(--font-mono)',whiteSpace:'pre-line'}}>{c.seen?c.text:'Continue exploring to record this entry.'}</p></article>)}</div>
 </div></div>;
}
