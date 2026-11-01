'use client';
import { useEffect, useRef } from 'react';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawStormShard, drawChargedTile, drawReaperCharge, drawVoltFence, drawMiniStorm } from './jupiter-art';
import { drawGuidePlayer, drawGuideRuby } from './guide-art';

const cards = [
  ['THE HUNT', 'Survive two pursuits, then race him for Storm Shards.'],
  ['CHARGING', 'He takes less damage while charging. Leave his room before the countdown ends—it will explode.'],
  ['STORM PURSUIT', 'He takes less damage. The room where pursuit begins stays safe. Storms hurt you and Ruby elsewhere.'],
  ['SPECIAL SKILL (PRESS MIDDLE CLICK OR C)', 'Place an electric fence and dash forward. An enemy crossing it takes damage and slows down, and you heal.'],
  ['TIME YOUR GUARD', 'Casting Volt Fence briefly protects you and Ruby. Time it before a heavy hit.'],
  ['DRAIN HIS ENERGY', 'His energy drains over time. Hit him to drain it faster. A violet bar marks the second pursuit.'],
  ['CHARGED FLOOR', 'Blue tiles slow you. During pursuit, they also restore his energy.'],
  ['SHARD RACE', 'He takes more damage. Collect Storm Shards to strike him with lightning. Shards he collects heal him. The race ends when no shards remain.'],
  ['PHASE 2 · PURSUIT FRAGMENTS', 'Collect fragments before they charge up, or he gains extra speed. Collecting one strikes him with lightning and stops the boost.'],
  ['PHASE 3 · MINI STORMS', 'Roaming storms hurt and knock you back. During Shard Race, they chase you when you get close.'],
] as const;
export default function JupiterGuide({drawBoss,drawCelestial}:{drawBoss:(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,exposed?:boolean,charge?:number)=>void;drawCelestial:CelestialGuidePainter}) {
  const refs=useRef<(HTMLCanvasElement|null)[]>([]);
  useEffect(()=>{let raf=0,tick=0;const frame=()=>{tick++;
    refs.current.forEach((canvas,i)=>{const ctx=canvas?.getContext('2d');if(!ctx)return;
      ctx.clearRect(0,0,200,120);ctx.fillStyle=i===2?'#0b2430':'#211b24';ctx.fillRect(0,0,200,120);
      if(i===9){drawMiniStorm(ctx,100+Math.sin(tick*.025)*45,60,tick);drawGuidePlayer(ctx,155,83);}
      else if(i===8){drawStormShard(ctx,100,53,tick,0);for(let k=0;k<8;k++){ctx.fillStyle=k<8-Math.floor(tick%240/30)?'#c5a4ff':'#392d51';ctx.fillRect(62+k*10,95,7,4);}}
      else if(i===3){drawVoltFence(ctx,100,60,true,40,tick);drawGuidePlayer(ctx,143+Math.sin(tick*.025)*16,60);}
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
    <p className="rs-guide-intro">Survive his pursuit, then beat him to the shards.</p>
    <div className="rs-nep-grid">
      <CelestialSkillGuideCard name="Jupiter Storm" description="Lightning damages and briefly slows nearby enemies." color="#ffad4d" draw={drawCelestial}/>
      {cards.map(([title,text],i)=><article className="rs-nep-card" key={title} style={{borderColor:'#8ce8ce55'}}>
        <canvas ref={el=>{refs.current[i]=el;}} width={200} height={120} aria-hidden="true"/>
        <h5 style={{color:i===3?'#9affe4':'#edc490'}}>{title}</h5><p>{text}</p>
      </article>)}
    </div></div>;
}
