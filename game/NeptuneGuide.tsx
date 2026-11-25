'use client';
import {bindingLabel} from './controls';
import { prepareCorruptedClamAudio } from './neptune-clam-audio';

import { useEffect, useRef } from 'react';
import { drawGuidePlayer } from './guide-art';
import CelestialSkillGuideCard, { type CelestialGuidePainter } from './CelestialSkillGuideCard';
import type { Enemy, GameState } from './engine';
import type { EnemyType } from './constants';
import { CHAMBER_BOUNDS, TILE_SIZE, ENEMY_CONFIGS, NEPTUNE_CLAM, NEPTUNE_CORRUPTED_CLAM, NEPTUNE_PUFF_TICKS, NEPTUNE_BOMB_RADIUS, NEPTUNE_BOMB_FUSE, NEPTUNE_DIVE_POINTS } from './constants';
import { drawNeptuneUnit, drawWaterBurst, drawNeptuneShark, drawSkyLaserImpact, drawNeptuneClam, drawNeptuneClamWave } from './neptune-art';
import { drawRefrainScore, drawNeptuneRefrainEffects } from './neptune-refrain-art';
import { NEPTUNE_REFRAIN, REFRAIN_PHRASES, prepareNeptuneMelodyAudio } from './neptune-refrain';

// Neptune challenge rule sheet: only what is new on this map, one small animated picture and one line per card.

type Paint = (ctx: CanvasRenderingContext2D, tick: number) => void;
const W = 200, H = 120;

function unit(type: EnemyType, id: number, extra: Partial<Enemy> = {}): Enemy {
  return { id, type, tileX: 0, tileY: 0, targetTileX: 1, targetTileY: 0, hp: ENEMY_CONFIGS[type].maxHp, maxHp: ENEMY_CONFIGS[type].maxHp, flashTicks: 0, shootTicks: 0, windupTicks: 0, ...extra } as Enemy;
}

function player(ctx:CanvasRenderingContext2D,x:number,y:number){drawGuidePlayer(ctx,x,y,24);}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string) {
  ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color; ctx.fillText(text, x, y);
}

function cross(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(x - 2, y - 6, 4, 12); ctx.fillRect(x - 6, y - 2, 12, 4);
}

function drawTideArrow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  for (let k = 0; k < 5; k++) {
    ctx.fillRect(x - k * 3, y - k * 3, 3, 3);
    ctx.fillRect(x - k * 3, y + k * 3, 3, 3);
  }
}

function drawTidePreview(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle='#102f43';
  ctx.fillRect(12,22,80,74);ctx.fillRect(108,22,80,74);
  ctx.strokeStyle='#69b9d5';ctx.lineWidth=2;
  ctx.strokeRect(12,22,80,74);ctx.strokeRect(108,22,80,74);
  ctx.fillStyle='#a4e7f0';ctx.globalAlpha=.55;
  ctx.save();ctx.beginPath();ctx.rect(12,22,80,74);ctx.rect(108,22,80,74);ctx.clip();
  for(let room=0;room<2;room++){
    const chamberX=12+room*96;
    for(let i=0;i<6;i++){
      const travel=(i*18+t*.35)%108;
      ctx.save();
      if(room){
        ctx.translate(chamberX+40,108-travel);ctx.rotate(-Math.PI/2);drawTideArrow(ctx,0,0);
      }else drawTideArrow(ctx,chamberX-12+travel,58);
      ctx.restore();
    }
  }
  ctx.restore();ctx.globalAlpha=1;
}

/** Both primal casts use their live painters, scaled and clipped to their own half-card. */
export function drawNeptunePrimalPreview(ctx:CanvasRenderingContext2D,t:number){
  const age=t%180,taunted=age>=24,cloneX=taunted?Math.max(52,82-(age-24)*.6):70+age*.7;
  ctx.save();ctx.beginPath();ctx.rect(0,0,100,120);ctx.clip();
  if(taunted&&age<60){
    const preview={neptune:{notePulses:[{x:0,y:0,pitch:0,good:true,boss:false,ticks:36-(age-24)}]}} as unknown as GameState;
    ctx.save();ctx.translate(28,70);ctx.scale(.18,.18);drawNeptuneRefrainEffects(ctx,preview,0,0);ctx.restore();
  }
  player(ctx,28,70);ctx.save();ctx.translate(cloneX,58);ctx.scale(.52,.52);drawNeptuneUnit(ctx,unit('water_clone',3,{neptuneTauntTicks:taunted?180:0}),0,0,t);ctx.restore();ctx.restore();
  ctx.restore();
  const [r1,c1,r2,c2]=CHAMBER_BOUNDS[0],w=(c2-c1+1)*TILE_SIZE,h=(r2-r1+1)*TILE_SIZE,scale=86/w;
  ctx.save();ctx.beginPath();ctx.rect(106,0,94,120);ctx.clip();ctx.translate(108,16);ctx.scale(scale,scale);
  ctx.fillStyle='#102f43';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#79cce0';ctx.lineWidth=1/scale;ctx.strokeRect(0,0,w,h);
  if(age>=80){const preview={map:[],neptune:{laserImpact:{chamber:0,ticks:120-(age-80)}}} as unknown as GameState;drawSkyLaserImpact(ctx,preview,c1*TILE_SIZE,r1*TILE_SIZE);}
  ctx.restore();ctx.fillStyle='#284557';ctx.fillRect(101,16,1,88);
}

export function drawNeptuneChorusPreview(ctx:CanvasRenderingContext2D,t:number){
  const age=t%240,full=age>=120,fill=full?1:Math.min(1,age/120);
  ctx.fillStyle='#102434';ctx.fillRect(14,98,172,10);
  ctx.fillStyle=fill>=1?'#d6fbff':'#59c8ff';ctx.fillRect(15,99,170*fill,8);
  if(!full){player(ctx,100,58);return;}
  const [r1,c1,r2,c2]=CHAMBER_BOUNDS[0],w=(c2-c1+1)*TILE_SIZE,h=(r2-r1+1)*TILE_SIZE,scale=86/w;
  ctx.save();ctx.beginPath();ctx.rect(49,19,102,74);ctx.clip();ctx.translate(57,27);ctx.scale(scale*.88,scale*.88);
  ctx.fillStyle='#102f43';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#79cce0';ctx.lineWidth=1/scale;ctx.strokeRect(0,0,w,h);
  if(age>=180){const preview={map:[],neptune:{laserImpact:{chamber:0,ticks:120-(age-180)}}} as unknown as GameState;drawSkyLaserImpact(ctx,preview,c1*TILE_SIZE,r1*TILE_SIZE);}
  ctx.restore();
}

export default function NeptuneGuide({ drawBoss, drawCelestial }: { drawCelestial: CelestialGuidePainter; drawBoss: (ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, diving: boolean) => void }) {
  useEffect(()=>{void prepareNeptuneMelodyAudio();void prepareCorruptedClamAudio();},[]);
  const cards: { title: string; color: string; text: string; paint: Paint }[] = [
    { title: 'PRIMAL SKILL', color: '#a0ecff', text: 'Ocean Melody: tap to play a note. Hold when Ocean Chorus is full to strike a chosen chamber.', paint: drawNeptunePrimalPreview },
    { title: 'OCEAN CHORUS', color: '#79cce0', text: 'Charges as you heal.', paint: drawNeptuneChorusPreview },
    { title: 'SEA CHANTER', color: '#6fb6ff', text: 'Dives at each mark on her HP bar.', paint: (ctx, t) => {
      drawBoss(ctx, 100, 50, t, false);
      for (let i = 0; i < 3; i++) {
        const x = 22 + i * 54; ctx.fillStyle = '#0a1422'; ctx.fillRect(x, 96, 50, 10);
        ctx.fillStyle = i === 2 ? '#3998d6' : '#6fb6ff'; ctx.fillRect(x + 1, 97, i === 2 ? 30 : 48, 8);
      }
      ctx.fillStyle = '#ffffff'; for (const f of NEPTUNE_DIVE_POINTS[1].filter(point=>point>0)) ctx.fillRect(130 + f * 50, 93, 2, 16);
    } },
    { title: 'DIVE & ECHOES', color: '#6fc7ff', text: 'Diving scatters echoes. Destroying them all ends the dive.', paint: (ctx, t) => {
      drawBoss(ctx, 46, 62, t, true);
      [[110, 40], [168, 40], [139, 88]].forEach(([x, y], i) => { ctx.save(); ctx.translate(x, y); ctx.scale(.75, .75); drawNeptuneUnit(ctx, unit('water_clone', i + 2), 0, 0, t); ctx.restore(); });
    } },
    { title: 'MISSED ECHOES', color: '#ff8a9a', text: 'Surviving echoes heal the boss when the dive ends.', paint: (ctx, t) => {
      drawNeptuneUnit(ctx, unit('water_clone', 4), 70, 66, t);
      drawBoss(ctx, 150, 62, t, false); // an echo left over heals her: a green cross rises over her (a 2.5s loop)
      const p = (t % 150) / 150; if (p < .5) { ctx.fillStyle = '#7fd0ff'; ctx.fillRect(85 + p / .5 * 50, 60, 8, 4); }
      else { const rise = (p - .5) / .5; ctx.globalAlpha = 1 - rise; cross(ctx, 150, 34 - rise * 18, '#7dffb0'); ctx.globalAlpha = 1; }
    } },
    { title: 'FISH', color: '#59c8ff', text: 'Ocean Melody breaks fish. Blue fish heal you; red fish hurt you.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(60, 54); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('fish_blue', 9), 0, 0, t); ctx.restore();
      ctx.save(); ctx.translate(140, 54); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('fish_red', 10), 0, 0, t); ctx.restore();
      label(ctx, '+HP', 60, 104, '#7dffb0'); label(ctx, '-HP', 140, 104, '#ff6a7a');
    } },
    { title: 'JELLYFISH', color: '#ff9ce6', text: 'Killing it reveals an echo.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(60, 62); ctx.scale(1.6, 1.6); drawNeptuneUnit(ctx, unit('jellyfish', 13, { hp: 2, maxHp: 2 }), 0, 0, t); ctx.restore();
      const pulse = .5 + .5 * Math.sin(t * .2);
      ctx.save(); ctx.translate(145, 70); ctx.scale(.7, .7); drawNeptuneUnit(ctx, unit('water_clone', 14), 0, 0, t); ctx.restore();
      ctx.globalAlpha = .3 + .2 * pulse; ctx.fillStyle = '#ffd6f4'; ctx.fillRect(139, 0, 12, 50); ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ff9ce6'; ctx.lineWidth = 3; ctx.strokeRect(122, 48, 46, 46);
    } },
    { title: 'SHARK', color: '#9fb8cc', text: 'Charges through a marked lane and knocks you aside.', paint: (ctx, t) => {
      const cycle = t % 150;
      ctx.globalAlpha = cycle < 70 ? .25 + .2 * Math.abs(Math.sin(t * .25)) : .1; ctx.fillStyle = '#ff4d5a'; ctx.fillRect(0, 48, W, 26); ctx.globalAlpha = 1;
      if (cycle >= 70) {
        const x = -40 + (cycle - 70) * 3.5;
        ctx.save();ctx.translate(x,61);ctx.scale(.65,.65);drawNeptuneShark(ctx,0,0,0);ctx.restore();
      }
      player(ctx, 120, cycle < 50 ? 61 : 30);
    } },
    { title: 'PUFFERFISH', color: '#ffc94a', text: 'Swells nearby, then bursts and knocks you back.', paint: (ctx, t) => {
      const cycle=t%180,swellEnd=60+NEPTUNE_PUFF_TICKS,wind=cycle>=60&&cycle<swellEnd?swellEnd-cycle:0,burst=cycle>=swellEnd&&cycle<swellEnd+18?18-(cycle-swellEnd):0; // idle, swell, burst, then a pause (3s)
      ctx.save(); ctx.translate(80, 62); ctx.scale(1.5, 1.5); drawNeptuneUnit(ctx, unit('pufferfish', 15, { hp: 7, maxHp: 7, windupTicks: wind, shootTicks: burst }), 0, 0, t); ctx.restore();
      player(ctx, cycle >= swellEnd ? 150 + Math.min(30, (cycle - swellEnd) * 3) : 150, 62);
    } },
    { title: 'STINGER', color: '#3fd6b0', text: 'Its bite poisons you.', paint: (ctx, t) => {
      ctx.save(); ctx.translate(100, 60); ctx.scale(1.8, 1.8); drawNeptuneUnit(ctx, unit('stinger', 11, { hp: 6, maxHp: 6 }), 0, 0, t); ctx.restore();
    } },
    { title: 'WATER BALL', color: '#7fd0ff', text: 'Explodes unless broken. Breaking it hurts the boss.', paint: (ctx, t) => {
      const cycle=t%(NEPTUNE_BOMB_FUSE+58);
      ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
      if(cycle<NEPTUNE_BOMB_FUSE){ctx.translate(100,60);ctx.scale(1.4,1.4);drawNeptuneUnit(ctx,unit('water_bomb',12,{windupTicks:NEPTUNE_BOMB_FUSE-cycle}),0,0,t);}
      else if(cycle<NEPTUNE_BOMB_FUSE+28){ctx.translate(100,60);ctx.scale(.45,.45);drawWaterBurst(ctx,0,0,NEPTUNE_BOMB_RADIUS*TILE_SIZE,28-(cycle-NEPTUNE_BOMB_FUSE));}
      ctx.restore();
    } },
    { title: 'TIDES', color: '#59c8ff', text: 'Currents push you along.', paint: drawTidePreview },
    { title: 'OCEAN MELODY', color: '#a1efd2', text: 'Repeat her rhythm with your primal skill to stop her healing.', paint: (ctx,t)=>{
      const phrase=REFRAIN_PHRASES[0],span=NEPTUNE_REFRAIN.lead+NEPTUNE_REFRAIN.beats*NEPTUNE_REFRAIN.beat,lead=NEPTUNE_REFRAIN.exampleLeadIn,listenEnd=lead+span,age=t%(lead+span*2),stage=age<listenEnd?'listen':'answer',tick=age<lead?0:age<listenEnd?age-lead:age-listenEnd;
      ctx.save();ctx.translate(8,34);drawRefrainScore(ctx,{stage,tick,span,exampleLeadIn:Math.max(0,lead-age),notes:phrase.beats.map((beat,i)=>({at:NEPTUNE_REFRAIN.lead+beat*NEPTUNE_REFRAIN.beat,pitch:phrase.pitches[i],result:stage==='answer'&&tick>=NEPTUNE_REFRAIN.lead+beat*NEPTUNE_REFRAIN.beat?'hit':'pending'})),extraMisses:0,healBudget:0,phase:1},184,52,'');ctx.restore();
    } },
  ];

  cards.push({title:'CLAM',color:'#b6e7df',text:'Ocean Melody opens it, sending out a wave that hurts enemies.',paint:(ctx,t)=>{
    const age=t%(NEPTUNE_CLAM.openTicks+60)-60,open=age>=0?NEPTUNE_CLAM.openTicks-age:0;
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
    ctx.save();ctx.translate(82,68);ctx.scale(.4,.4);drawNeptuneClamWave(ctx,0,0,age>=0&&age<36?36-age:0);ctx.restore();
    drawNeptuneClam(ctx,82,68,open,t);
    ctx.restore();
  }});
  cards.push({title:'CORRUPTED CLAM',color:'#e38ba8',text:'Ocean Melody opens it, sending out a wave that hurts you.',paint:(ctx,t)=>{
    const age=t%(NEPTUNE_CORRUPTED_CLAM.openTicks+60)-60,open=age>=0?NEPTUNE_CORRUPTED_CLAM.openTicks-age:0;
    ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
    ctx.save();ctx.translate(82,68);ctx.scale(.4,.4);drawNeptuneClamWave(ctx,0,0,age>=0&&age<36?36-age:0,true);ctx.restore();
    drawNeptuneClam(ctx,82,68,open,t,true);ctx.restore();
  }});
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  useEffect(() => {
    let frame = 0, raf = 0;
    const loop = () => {
      frame++;
      refs.current.forEach((canvas, i) => {
        const ctx = canvas?.getContext('2d'); if (!ctx) return;
        ctx.save(); ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0b1d30'; ctx.fillRect(0, 0, W, H);
        cards[i].paint(ctx, frame); ctx.restore();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  return <div className="rs-guide">
    <div className="rs-guide-nav"><h3>NEPTUNE CHALLENGE</h3></div>
    <p className="rs-guide-intro" style={{ color: '#ffe6a6', fontWeight: 700 }}>Destroy her echoes and answer her melody to defeat the Sea Chanter.</p>
    {[
      { title: 'GENERAL RULES & SKILLS', indices: [0, 1, 13], skill: true },
      { title: 'ENEMIES', indices: [2, 3, 4, 12, 5, 6, 7, 9], skill: false },
      { title: 'PHASE 2+', indices: [8, 10], skill: false },
      { title: 'PHASE 3', indices: [11, 14], skill: false },
    ].map(section => <section key={section.title} className="rs-guide-section" aria-label={section.title}>
    <h4 className="rs-guide-group-title">{section.title}</h4>
    <div className="rs-nep-grid">
      {section.indices.map(i => { const card = cards[i]; return <article key={card.title} className="rs-nep-card" style={{ borderColor: card.color + '66' }}>
        <canvas ref={el => { refs.current[i] = el; }} width={W} height={H} aria-hidden="true" />
        <h5 style={{ color: card.color }}>{card.title==='PRIMAL SKILL'?'PRIMAL SKILL ('+bindingLabel('mapSkill')+')':card.title}</h5>
        <p>{card.text.includes('\n') ? card.text.split('\n').map((line, i) => <span key={i}>{i > 0 && <br />}{line}</span>) : card.text}</p>
      </article>; })}
      {section.skill && <CelestialSkillGuideCard name="Neptune’s Tide" description="Heals you and Ruby and pushes nearby enemies away." color="#91baff" draw={drawCelestial} />}
    </div></section>)}
  </div>;
}
