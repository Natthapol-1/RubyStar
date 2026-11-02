'use client';
import { useEffect, useRef } from 'react';
import { bindingLabel } from './controls';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import { drawSnowball, drawSaturnUnit, drawSaturnGround, drawSaturnBlizzard, drawRollTiles } from './saturn-art';
import { drawSaturnShield } from './ice-shield-art';
import { drawGuidePlayer, drawGuideRuby } from './guide-art';
import { createModeState, type Enemy } from './engine';
import { SATURN } from './saturn';

const cards = [
  ['BLIZZARD', 'Blizzard is stronger in the Warden’s chamber.'],
  ['STACK SHIELDS', 'Kills give both 10 shield; shards give 40. Absorb 100% of enemy shield damage. Snowball steals and shares it.'],
  ['MAP SPECIAL SKILL', 'Snowball: walk while charging, then release. Steal shields to stun. Miss every enemy to reset cooldown. Attack to cancel.'],
  ['BREAK THE BARRIER', 'Barrier damage heals you and Ruby. Bigger shield makes a stronger ram; you keep 10% of your shield.'],
  ['WEAK WINDOW', 'Breaking the barrier heals both an extra 20%, hurts the Warden and stops the storm. Attack before it returns.'],
  ['FROZEN TILES', 'Frozen tiles stop movement and attacks, and halve your shield. More gather in the Warden’s chamber.'],
  ['SNOWBOWL', "Starts shielded. Dodge its rush: it can steal shield from you or Ruby."],
  ['FROSTICLE', 'Within eight tiles, it marks the floor before dropping an icicle. Dodge the warning; nearby ice melts quickly.'],
  ['ICE CUB', 'Keep your distance. This fast ice cube hits immediately up close and knocks you toward dangerous ice.'],
] as const;

export default function SaturnGuide({drawCelestial,drawFrozenTile,drawBoss}:{drawCelestial:CelestialGuidePainter;drawFrozenTile:(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number)=>void;drawBoss:(ctx:CanvasRenderingContext2D,x:number,y:number,tick:number,shielded?:boolean,flash?:boolean)=>void}) {
  const refs=useRef<(HTMLCanvasElement|null)[]>([]);
  useEffect(()=>{
    let raf=0,tick=0;const scene=createModeState('trial','frost_warden');
    const frame=()=>{tick++;
      refs.current.forEach((canvas,i)=>{
        const ctx=canvas?.getContext('2d');if(!ctx)return;
        ctx.clearRect(0,0,200,120);ctx.fillStyle='#102533';ctx.fillRect(0,0,200,120);
        if(i===0){drawSaturnBlizzard(ctx,200,120,0,0,tick,Math.floor(tick/180)%3+1);drawGuidePlayer(ctx,65,67);drawGuideRuby(ctx,137,67);}
        else if(i>=6){
          const type=i===6?'frost_raider':i===7?'ice_caller':'rime_brute';
          drawSaturnUnit(ctx,{type,hp:18,maxHp:18,icyShieldHP:i===6?24:0,flashTicks:0,windupTicks:0,shootTicks:i===8&&tick%100>75?100-tick%100:0,chargeDirX:1,chargeDirY:0} as Enemy,100,60,tick);
          if(i===7){const age=tick%(SATURN.icicleWarning+24);scene.gameTick=tick;scene.saturn!.icicles=[{x:10,y:10,ticks:age<SATURN.icicleWarning?SATURN.icicleWarning-age:24-(age-SATURN.icicleWarning),landed:age>=SATURN.icicleWarning}];ctx.save();ctx.translate(155,83);ctx.scale(.45,.45);drawSaturnGround(ctx,scene,10.5*48,10.5*48);ctx.restore();}
        }else if(i===2){
          ctx.save();ctx.translate(58,45);ctx.scale(.7,.7);drawRollTiles(ctx,[[0,0],[1,0],[2,0],[3,0]],0,0);ctx.restore();
          drawSnowball(ctx,30+(tick%140),60,15,tick);
        }else if(i===1){
          drawGuidePlayer(ctx,58,66);drawGuideRuby(ctx,142,66);
          drawSaturnShield(ctx,58,66,25,tick);drawSaturnShield(ctx,142,66,25,tick);
          for(let n=0;n<3;n++){const age=(tick+n*35)%110;ctx.globalAlpha=(1-age/110)*.7;ctx.fillStyle='#b5f9e6';ctx.fillRect(94,95-age*.55,5,5);}ctx.globalAlpha=1;
        }else if(i===3){
          const age=tick%180,hit=age>=75,impact=age-75;
          drawBoss(ctx,152,65,tick,!hit,hit&&impact<10);
          if(!hit){const rollX=35+Math.max(0,Math.min(1,(age-35)/40))*88;drawSnowball(ctx,rollX,70,15,tick);drawSaturnShield(ctx,rollX,70,21,tick);}
          else{
            drawGuidePlayer(ctx,112,70);
            if(impact<32){ctx.save();ctx.globalAlpha=1-impact/32;ctx.strokeStyle='#d6faff';ctx.lineWidth=3;const r=12+impact*.8;ctx.strokeRect(149-r,65-r,r*2,r*2);
              for(let k=0;k<8;k++){ctx.save();ctx.translate(144,65);ctx.rotate(k*Math.PI/4);ctx.fillStyle=k%2?'#8fd5ee':'#e7ffff';ctx.fillRect(8+impact*1.3,-2,7,4);ctx.restore();}ctx.restore();}
          }
        }else if(i===4){
          drawBoss(ctx,100,64,tick,false);
        }else if(i===5){ctx.save();ctx.translate(100,60);ctx.scale(1.25,1.25);drawFrozenTile(ctx,-24,-24,tick);ctx.restore();}
      });raf=requestAnimationFrame(frame);
    };raf=requestAnimationFrame(frame);return()=>cancelAnimationFrame(raf);
  },[drawFrozenTile,drawBoss]);
  return <div className="rs-guide"><div className="rs-guide-nav"><h3>SATURN CHALLENGE</h3></div>
    <p className="rs-guide-intro">Steal shields, weather the storm and break the Warden’s barrier.</p>
    <div className="rs-nep-grid">
      <CelestialSkillGuideCard name="Saturn Guard" description="Adds shields to you and Ruby. Save them for the storm or spend yours on a ram." color="#68e0c9" draw={drawCelestial}/>
      {cards.map(([title,text],i)=><article className="rs-nep-card" key={title} style={{borderColor:'#a8e8d755'}}>
        <canvas ref={el=>{refs.current[i]=el;}} width={200} height={120} aria-hidden="true"/>
        <h5 style={{color:'#d2f5ff'}}>{title==='MAP SPECIAL SKILL'?`MAP SPECIAL SKILL (${bindingLabel('mapSkill')})`:title}</h5><p>{text}</p>
      </article>)}
    </div>
  </div>;
}
