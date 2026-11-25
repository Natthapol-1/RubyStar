'use client';
import {bindingLabel} from './controls';
import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawStormShard, drawPursuitFragment, drawChargedTile, drawReaperCharge, drawVoltFence, drawMiniStorm, drawJupiterTile } from './jupiter-art';
import { drawGuidePlayer, drawGuideRuby } from './guide-art';
import { drawJupiterSlowAura, drawJupiterSlowImpact, drawShardEffects, drawJupiterCoverShuffle, drawJupiterTrailTile } from './jupiter-art';
import type { GameState } from './engine';

const cards = [
  ['STORM REAPER', 'Charges, pursues twice, then races for Storm Shards.'],
  ['CHARGING', 'Takes less damage while charging and pursuing. The Reaper\'s chamber explodes when charging ends.'],
  ['STORM PURSUIT', 'When pursuit begins, storms hit every chamber but yours.'],
  ['PRIMAL SKILL', 'Volt Fence: dashes forward, leaving a fence that hurts and slows enemies.'],
  ['GUARD', 'Casting Volt Fence briefly reduces damage to you and Ruby.'],
  ['ENERGY', 'The Reaper\'s energy drains over time and when hit. Each pursuit ends when it runs out.'],
  ['CHARGED FLOOR', 'Blue tiles slow you. During pursuit, they also restore the Reaper\'s energy.'],
  ['SHARD RACE', <>Your shards hurt the Reaper; his shards heal him. He <strong style={{ color: '#ffe6a6', fontWeight: 800, textShadow: '0 0 5px #ffc75e44' }}>takes more damage</strong> until all shards are gone.</>],
  ['SURGE CELLS', 'Full Overdrive makes the Reaper faster. Surge Cells hurt him and reset it.'],
  ['MINI STORMS', 'Roaming storms hurt and knock you back.'],
  ['SHIFTING COVER', 'During pursuit, cover rearranges itself.'],
  ['REAPER TRAIL', 'His trail slows you.'],
] as const;

export function drawChargedFloorPreview(ctx:CanvasRenderingContext2D,tick:number) {
  const age=tick%96,x=35+65*Math.min(1,age/24);
  ctx.save();ctx.translate(76,48);if(age<24)drawChargedTile(ctx,0,0,tick);ctx.restore();
  drawGuidePlayer(ctx,x,72);
  if(age>=24&&age<42){ctx.save();ctx.translate(x,72);ctx.scale(.56,.56);drawJupiterSlowImpact(ctx,0,0,(42-age)/18);ctx.restore();}
  if(age>=24){ctx.save();ctx.translate(x,72);ctx.scale(.56,.56);drawJupiterSlowAura(ctx,0,0,tick,Math.min(1,(96-age)/12));ctx.restore();}
}

export function drawShardRacePreview(ctx:CanvasRenderingContext2D,tick:number,drawBoss:(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,exposed?:boolean)=>void) {
  const age=tick%150,px=30+Math.min(1,age/30)*40,bx=165-Math.max(0,Math.min(1,(age-54)/30))*35;
  for(const [x,y,collected] of [[70,82,age>=30],[130,43,age>=84]] as const)if(!collected){ctx.save();ctx.translate(x,y);ctx.scale(.4,.4);drawStormShard(ctx,0,0,tick);ctx.restore();}
  drawGuidePlayer(ctx,px,82);ctx.save();ctx.translate(bx,43);ctx.scale(.65,.65);drawBoss(ctx,0,0,tick,true);ctx.restore();
  const effects=[];
  if(age>=30&&age<56)effects.push({x:px,y:82,bossX:bx,bossY:43,heal:false,ticks:56-age});
  if(age>=84&&age<110)effects.push({x:bx,y:43,bossX:bx,bossY:43,heal:true,ticks:110-age});
  drawShardEffects(ctx,{jupiter:{shardEffects:effects}} as unknown as GameState,0,0);
}

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

export function drawMovingCoverPreview(ctx:CanvasRenderingContext2D,tick:number) {
  const age=tick%180;
  const moves=[{id:0,from:[[34,7],[35,7],[36,7],[34,8]],to:[[37,7],[38,7],[37,8],[38,8]]},
    {id:1,from:[[35,10],[36,10],[37,10],[38,10]],to:[[40,7],[40,8],[40,9],[40,10]]}];
  const phase=age<60?'warning':age<78?'retract':'rise';
  const change=age<24||age>=96?undefined:{phase,ticks:age<60?(60-age)*2:age<78?78-age:96-age,moves};
  const state={gameTick:tick,jupiter:{stage:'pursuit',stormBlend:1,coverShuffle:change}} as unknown as GameState;
  const tiles=moves.flatMap(m=>age<78?m.from:m.to);
  ctx.save();ctx.translate(14,15);ctx.scale(.45,.45);
  for(let y=7;y<=10;y++)for(let x=33;x<=40;x++)drawJupiterTile(ctx,state,x,y,(x-33)*48,(y-7)*48,tiles.some(t=>t[0]===x&&t[1]===y));
  drawJupiterCoverShuffle(ctx,state,33*48,7*48);ctx.restore();
}

export function drawReaperTrailPreview(ctx:CanvasRenderingContext2D,tick:number,drawBoss:(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,exposed?:boolean)=>void) {
  const age=tick%180,bx=30+140*Math.min(1,age/45);
  const count=Math.min(6,Math.max(0,Math.ceil((bx-32)/24)));
  for(let i=0;i<count;i++){ctx.save();ctx.translate(26+i*24,50);ctx.scale(.5,.5);drawJupiterTrailTile(ctx,0,0,tick,age<135?150:(180-age),(i<count-1?2:0)|(i>0?8:0),i);ctx.restore();}
  ctx.save();ctx.translate(bx,39);ctx.scale(.45,.45);drawBoss(ctx,0,0,tick);ctx.restore();
  const walking=Math.max(0,age-54),px=22+Math.min(136,walking<24?walking*2:48+(walking-24)*1.4);
  drawGuidePlayer(ctx,px,64);
  if(age>=65&&age<160){ctx.save();ctx.translate(px,64);ctx.scale(.56,.56);drawJupiterSlowAura(ctx,0,0,tick);ctx.restore();}
}

export default function JupiterGuide({drawBoss,drawCelestial}:{drawBoss:(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,exposed?:boolean,charge?:number)=>void;drawCelestial:CelestialGuidePainter}) {
  const refs=useRef<(HTMLCanvasElement|null)[]>([]);
  useEffect(()=>{let raf=0,tick=0;const frame=()=>{tick++;
    refs.current.forEach((canvas,i)=>{const ctx=canvas?.getContext('2d');if(!ctx)return;
      ctx.clearRect(0,0,200,120);ctx.fillStyle=i===2?'#0b2430':'#211b24';ctx.fillRect(0,0,200,120);
      if(i===9){drawMiniStorm(ctx,100+Math.sin(tick*.025)*45,60,tick);drawGuidePlayer(ctx,155,83);}
      else if(i===11){drawReaperTrailPreview(ctx,tick,drawBoss);}
      else if(i===10){drawMovingCoverPreview(ctx,tick);}
      else if(i===8){drawPursuitFragment(ctx,100,53,tick);}
      else if(i===3){drawFenceDash(ctx,tick);}
      else if(i===4){
        ctx.strokeStyle='#b8ffe8';ctx.lineWidth=3;
        drawGuidePlayer(ctx,65,62);drawGuideRuby(ctx,135,62);
        for(const x of [65,135]){const r=20+Math.sin(tick*.06)*2;ctx.strokeRect(x-r,62-r,r*2,r*2);}
      }
      else if(i===6){drawChargedFloorPreview(ctx,tick);}
      else if(i===7){drawShardRacePreview(ctx,tick,drawBoss);}
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
      {title:'PHASE 2+',indices:[8,10],skill:false},
      {title:'PHASE 3',indices:[9,11],skill:false},
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
