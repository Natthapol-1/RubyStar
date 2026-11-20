'use client';
import {bindingLabel} from './controls';
import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawStormShard, drawPursuitFragment, drawChargedTile, drawReaperCharge, drawVoltFence, drawMiniStorm } from './jupiter-art';
import { drawGuidePlayer, drawGuideRuby } from './guide-art';

const cards = [
  ['THE HUNT', 'Charges, pursues twice, then races for Storm Shards.'],
  ['CHARGING', 'Takes less damage while charging and pursuing. His chamber explodes when charging ends.'],
  ['STORM PURSUIT', 'Your chamber becomes safe when pursuit begins. Storms hurt you and Ruby in other chambers.'],
  ['PRIMAL SKILL', 'Volt Fence: places an electric fence and dashes forward. Enemies crossing it take damage and slow down, and you heal.'],
  ['GUARD', 'Casting Volt Fence briefly reduces damage to you and Ruby.'],
  ['ENERGY', 'His energy drains over time and when hit. Each pursuit ends when it runs out.'],
  ['CHARGED FLOOR', 'Blue tiles slow you. During pursuit, they also restore his energy.'],
  ['SHARD RACE', 'Your shard pickups damage him and heal you; his pickups heal him. He takes more damage until all shards are collected.'],
  ['SURGE CELLS', 'Overdrive builds during pursuit and makes him faster when full. Surge Cell pickups damage him and reset it.'],
  ['MINI STORMS', 'Roaming storms hurt and knock you back. During Shard Race, nearby storms chase you.'],
] as const;

function drawFenceDash(ctx:CanvasRenderingContext2D,tick:number) {
  const cycle=tick%180,progress=Math.max(0,Math.min(1,(cycle-40)/24));
  const dashing=cycle>=40&&cycle<64,x=Math.round(48+112*(1-Math.pow(1-progress,3)));
  ctx.save();
  // A single forward burst leaves the perpendicular fence at the cast position.
  if(cycle>=40)drawVoltFence(ctx,48,60,true,38,tick,Math.min(1,(cycle-40)/6));
  if(dashing){
    ctx.fillStyle='#52ffd6';
    for(let i=4;i>=1;i--){ctx.globalAlpha=.24/i;ctx.fillRect(Math.max(38,x-i*15-10),50,20,20);}
    ctx.globalAlpha=1;ctx.shadowColor='#52ffd6';ctx.shadowBlur=4;
    ctx.fillStyle='#52ffd6';ctx.fillRect(x-10,50,20,20);ctx.shadowBlur=0;
    ctx.fillStyle='#176354';ctx.fillRect(x-6,54,12,12);
    ctx.fillStyle='#dcfff1';ctx.fillRect(x-5,60,10,4);
  }else drawGuidePlayer(ctx,x,60);
  ctx.restore();
}

export default function JupiterGuide({drawBoss,drawCelestial}:{drawBoss:(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,exposed?:boolean,charge?:number)=>void;drawCelestial:CelestialGuidePainter}) {
  const refs=useRef<(HTMLCanvasElement|null)[]>([]);
  useEffect(()=>{let raf=0,tick=0;const frame=()=>{tick++;
    refs.current.forEach((canvas,i)=>{const ctx=canvas?.getContext('2d');if(!ctx)return;
      ctx.clearRect(0,0,200,120);ctx.fillStyle=i===2?'#0b2430':'#211b24';ctx.fillRect(0,0,200,120);
      if(i===9){drawMiniStorm(ctx,100+Math.sin(tick*.025)*45,60,tick);drawGuidePlayer(ctx,155,83);}
      else if(i===8){drawPursuitFragment(ctx,100,53,tick);}
      else if(i===3){drawFenceDash(ctx,tick);}
      else if(i===4){
        ctx.strokeStyle='#b8ffe8';ctx.lineWidth=3;
        drawGuidePlayer(ctx,65,62);drawGuideRuby(ctx,135,62);
        for(const x of [65,135]){const r=20+Math.sin(tick*.06)*2;ctx.strokeRect(x-r,62-r,r*2,r*2);}
      }
      else if(i===6){ctx.save();ctx.translate(76,38);drawChargedTile(ctx,0,0,tick);ctx.restore();}
      else if(i===2){for(let k=0;k<4;k++){ctx.fillStyle=k===0?'#f8d198':'#53d4be';ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=3;ctx.strokeRect(18+(k%2)*88,13+Math.floor(k/2)*49,73,38);if(k){ctx.globalAlpha=.18;ctx.fillRect(18+(k%2)*88,13+Math.floor(k/2)*49,73,38);ctx.globalAlpha=1;}}}
      else {const x=i===7?100+Math.sin(tick*.025)*44:100;
        if(i===1){ctx.save();ctx.translate(x,65);ctx.scale(.65,.65);drawReaperCharge(ctx,0,0,(tick%180)/180,tick);ctx.restore();}
        drawBoss(ctx,x,65,tick,i===7,i===1?(tick%180)/180:-1);
        if(i===1){ctx.save();ctx.translate(x,65);ctx.scale(.65,.65);drawReaperCharge(ctx,0,0,(tick%180)/180,tick,false,true);ctx.restore();}
        if(i===1||i===5){ctx.fillStyle='#313645';ctx.fillRect(35,99,130,7);ctx.fillStyle=i===5?'#c5a4ff':'#52ffd6';ctx.fillRect(35,99,130*(i===1?(tick%180)/180:1-(tick%180)/180),7);}
        if(i===7){for(let k=0;k<3;k++)drawStormShard(ctx,45+k*48,91,tick,k);drawGuidePlayer(ctx,35+Math.sin(tick*.025)*12,62);}
      }
    });raf=requestAnimationFrame(frame);};raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);},[drawBoss]);
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>JUPITER CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{color:'#ffe6a6',fontWeight:700}}>Survive the pursuit and race for shards to prevent the boss’s comeback.</p>
    {[
      {title:'GENERAL RULES & SKILLS',indices:[3,4,6],skill:true},
      {title:'ENEMIES',indices:[0,1,2,5,7],skill:false},
      {title:'PHASE 2+',indices:[8],skill:false},
      {title:'PHASE 3',indices:[9],skill:false},
    ].map(section=><section key={section.title} className="rs-guide-section" aria-label={section.title}>
    <h4 className="rs-guide-group-title">{section.title}</h4>
    <div className="rs-nep-grid">
      {section.indices.map(i=>{const [title,text]=cards[i];return <article className="rs-nep-card" key={title} style={{borderColor:'#8ce8ce55'}}>
        <canvas ref={el=>{refs.current[i]=el;}} width={200} height={120} aria-hidden="true"/>
        <h5 style={{color:i===3?'#9affe4':'#edc490'}}>{title==='PRIMAL SKILL'?'PRIMAL SKILL ('+bindingLabel('mapSkill')+')':title}</h5><p>{text}</p>
      </article>;})}
      {section.skill&&<CelestialSkillGuideCard name="Jupiter Storm" description="Lightning damages and briefly slows nearby enemies." color="#ffad4d" draw={drawCelestial}/>}
    </div></section>)}</div>;
}
