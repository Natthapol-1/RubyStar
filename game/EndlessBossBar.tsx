import type { GameState } from './engine';
import { BINARY_TWIN_COLORS } from './binary';
import { BOSS_FIRST_SPAWN_TIMER, BOSS_SPAWN_INTERVAL, BOSS_WARNING_TICKS, DIFFICULTY_OPENING_THRESHOLDS, BOSS_NAMES, ENEMY_CONFIGS, isBossType, type BossType } from './constants';

export default function EndlessBossBar({state}:{state:GameState}) {
 const encounters=new Map<number,{type:BossType;hp:number;maxHp:number;bodies:GameState['enemies']}>();
 for(const enemy of state.enemies){
  if(!isBossType(enemy.type)||enemy.hp<=0)continue;
  const id=enemy.encounterId??enemy.twin?.pairId??enemy.id;
  const encounter=encounters.get(id)??{type:enemy.type,hp:0,maxHp:0,bodies:[]};
  encounter.bodies.push(enemy);
  encounter.hp+=(enemy.twin?.downedTicks??0)>0?0:enemy.hp;
  encounter.maxHp+=enemy.maxHp;
  encounters.set(id,encounter);
 }
 const openingWait=state.difficultyLevel<1?Math.max(0,DIFFICULTY_OPENING_THRESHOLDS[1]-state.difficultyTimer):0;
 const remaining=state.bossWarningTicks>0?state.bossWarningTicks:Math.max(0,state.bossTimer)+BOSS_WARNING_TICKS+openingWait;
 const total=state.bossesKilled===0?BOSS_FIRST_SPAWN_TIMER+BOSS_WARNING_TICKS+(state.mode==='endless'?DIFFICULTY_OPENING_THRESHOLDS[1]:0):BOSS_SPAWN_INTERVAL+BOSS_WARNING_TICKS;
 return <div className="rs-endless-boss">
  {encounters.size?[...encounters].map(([id,boss])=>{
   if(boss.type==='astral_twins')return <div key={id} className="rs-endless-twins">
    {[0,1].map(index=>{
     const twin=boss.bodies.find(body=>body.twin?.index===index);
     const maxHp=twin?.maxHp??1;
     const hp=twin&&!(twin.twin?.downedTicks)?Math.max(0,Math.min(maxHp,twin.hp)):0;
     return <span key={index} className="rs-guardian-bar" style={{['--guardian' as string]:BINARY_TWIN_COLORS[index]}} role="meter" aria-label={`Astral Twins ${index?'Dusk':'Dawn'} health`} aria-valuemin={0} aria-valuemax={maxHp} aria-valuenow={hp}>
      <span className="rs-guardian-fill" style={{width:`${hp/maxHp*100}%`}}/>
     </span>;
    })}
   </div>;
   const hp=Math.max(0,Math.min(boss.maxHp,boss.hp));
   const name=BOSS_NAMES[boss.type];
   return <div key={id} className="rs-endless-encounter" style={{['--guardian' as string]:ENEMY_CONFIGS[boss.type].color}}>
    <span className="rs-guardian-bar" role="meter" aria-label={`${name} health`} aria-valuemin={0} aria-valuemax={boss.maxHp} aria-valuenow={hp}>
     <span className="rs-guardian-fill" style={{width:`${boss.maxHp>0?hp/boss.maxHp*100:0}%`}}/>
    </span>
   </div>;
  }):<div className="rs-endless-encounter rs-endless-next">
   <span className="rs-guardian-bar" role="meter" aria-label="Next boss countdown" aria-valuemin={0} aria-valuemax={Math.max(total,remaining)} aria-valuenow={remaining} aria-valuetext={`${Math.ceil(remaining/60)} seconds until next boss`}>
    <span className="rs-guardian-fill" style={{width:`${Math.min(1,remaining/total)*100}%`}}/>
   </span>
  </div>}
 </div>;
}
