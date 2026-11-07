'use client';

import {bindingLabel} from './controls';
import EnemyPortrait from './EnemyPortrait';
import {aliens,bosses} from './guide-data';
import { playUiSfx } from './ui-sfx';
import { useEffect, useRef, useState } from 'react';
import PixelArrow from '@/components/PixelArrow';
import { BOSS_NAMES, BOSS_TYPES, BOSS_SKILL_REWARDS, ENEMY_CONFIGS, SPECIAL_SKILLS, type BossType, type EnemyType } from './constants';

const controls = () => [
  [[bindingLabel('moveUp'),bindingLabel('moveLeft'),bindingLabel('moveDown'),bindingLabel('moveRight')].join(' · '), 'Move'],
  [bindingLabel('laser'), 'Fire lasers'],
  ['HOLD '+bindingLabel('laser'), 'Charge a wave'],
  [bindingLabel('bullet'), 'Fire a bullet'],
  [bindingLabel('boost'), 'Speed burst'],
  [bindingLabel('bomb'), 'Place bomb · press again to explode'],
  [bindingLabel('ruby'), 'Carry or place Ruby'],
  [bindingLabel('heal'), 'Heal, including on a pad'],
  [bindingLabel('teleport'), 'Teleport on or next to a pad'],
  [bindingLabel('celestial'), 'Use your celestial skill'],
];

export default function RubyStarGuide({showEnemyGuide=true,endlessOnly=false}:{showEnemyGuide?:boolean;endlessOnly?:boolean}={}) {
  const [sheet, setSheet] = useState<'main' | 'aliens'>('main');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = root.current?.closest('.modal-body');
    if (scroller) scroller.scrollTop = 0;
  }, [sheet]);

  return <div ref={root} className="rs-guide">
    <div className="rs-guide-nav">
      <h3>{sheet === 'main' ? endlessOnly?'ENDLESS SPACE':'HOW TO PLAY' : 'ALIENS & BOSSES'}</h3>
      {showEnemyGuide&&<button type="button" className="btn rs-guide-link" onMouseEnter={() => playUiSfx('hover')}
        onClick={() => { playUiSfx(sheet === 'main' ? 'page' : 'back'); setSheet(sheet === 'main' ? 'aliens' : 'main'); }}>
        {sheet !== 'main' && <PixelArrow direction="left" />}
        <span>{sheet === 'main' ? 'ALIENS & BOSSES' : 'MAIN RULES'}</span>
        {sheet === 'main' && <PixelArrow />}
      </button>}
    </div>

    {sheet === 'main' ? <>
      <p className="rs-guide-intro">Defeat bosses. Keep yourself and Ruby alive.</p>
      <section className="rs-guide-section" aria-labelledby="rs-controls-title">
        <h4 id="rs-controls-title">CONTROLS</h4>
        <dl className="rs-guide-controls">
          {controls().map(([key, action]) => <div key={key}><dt>{key}</dt><dd>{action}</dd></div>)}
        </dl>
      </section>

      <div className="rs-guide-grid">
        <section className="rs-guide-section"><h4>RUBY & HEALING</h4>
          <p>Carrying Ruby slows you and shortens speed boosts, but you take 10% less damage and get pushed half as far. With no enemies near, use {bindingLabel('heal')} by Ruby to heal both.</p>
        </section>
        <section className="rs-guide-section"><h4>METEORS</h4>
          <p>Meteors move clockwise and hit everything in the chamber. Get Ruby out of the flashing one.</p>
          <p>From stage 3, comets hit a small marked area near you and briefly stun you. Step out before they land.</p>
        </section>
        <section className="rs-guide-section"><h4>TELEPORT</h4>
          <p>Use {bindingLabel('teleport')} at a pad to pick a chamber. Carried Ruby comes along.</p>
        </section>
        <section className="rs-guide-section"><h4>STAR ENERGY</h4>
          <p>Kills and blue shards fill energy. When full, your next ability is boosted. Red shards heal.</p>
        </section>
      </div>

      <section className="rs-guide-section"><h4>SPACE EVENTS</h4>
        <p><strong>Black Hole:</strong> Pulls everything in.</p>
        <p><strong>Shooting Star:</strong> Grab its shard to heal and recharge.</p>
        <p><strong>Eclipse:</strong> Briefly freezes enemies.</p>
        <p><strong>Supernova:</strong> Hit it, then escape the blast.</p>
      </section>
      <section className="rs-guide-section"><h4>CONSTELLATIONS</h4>
        <p>Every 3 stages, choose one of 3 upgrades for the run.</p>
      </section>
      <section className="rs-guide-section"><h4>ASCENSION (STAGE 10+)</h4>
        <p>From stage 10, boss kills give a one-use celestial skill ({bindingLabel('celestial')}). Hold one at a time.</p>
      </section>
      <section className="rs-guide-section"><h4>TRANSCENDENCE (STAGE 20+)</h4><p>Bosses can stack up if you don't defeat them in time.</p><p>Choose a celestial blessing at stage 20 and every 10 stages after.</p></section>
      <section className="rs-guide-hints"><h4>HINTS</h4>
        <ul>
          <li>Teleport out with Ruby and leave aliens in the meteor blast.</li>
          <li>Step away before detonating your bomb.</li>
        </ul>
      </section>
    </> : <>
      <p className="rs-guide-intro">Boss skills become yours after Ascension.</p>
      <section aria-labelledby="rs-aliens-title"><h4 id="rs-aliens-title" className="rs-guide-group-title">ALIENS</h4>
        <div className="rs-guide-grid">
          {aliens.map(alien => <article key={alien.type} className="rs-guide-entry" style={{ borderLeftColor: ENEMY_CONFIGS[alien.type].color }}>
            <EnemyPortrait type={alien.type}/><h5 style={{ color: ENEMY_CONFIGS[alien.type].color }}>{alien.name}</h5><p>{alien.description}</p>{alien.reward && <p className="rs-guide-reward">Killing buff: {alien.reward}</p>}
          </article>)}
        </div>
      </section>
      <section aria-labelledby="rs-bosses-title"><h4 id="rs-bosses-title" className="rs-guide-group-title">BOSSES</h4>
        <div className="rs-guide-grid">
          {BOSS_TYPES.map(type => <article key={type} className="rs-guide-entry" style={{ borderLeftColor: ENEMY_CONFIGS[type].color }}>
            <EnemyPortrait type={type}/><h5 style={{ color: ENEMY_CONFIGS[type].color }}>{BOSS_NAMES[type]}</h5>
            <p>{bosses[type].description}</p>
            <p className="rs-guide-skill"><strong style={{ color: type === 'devourer' ? '#c3c3d4' : SPECIAL_SKILLS[BOSS_SKILL_REWARDS[type]].color }}>Celestial skill: {SPECIAL_SKILLS[BOSS_SKILL_REWARDS[type]].name}</strong>{bosses[type].skill}</p>
          </article>)}
        </div>
      </section>
      <button type="button" className="btn btn-ghost rs-guide-back" onMouseEnter={() => playUiSfx('hover')} onClick={() => { playUiSfx('back'); setSheet('main'); }}><PixelArrow direction="left" /> MAIN RULES</button>
    </>}
  </div>;
}
