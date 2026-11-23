import { NEPTUNE_FISH_HURT, NEPTUNE_MELODY_TAUNT_TICKS, NEPTUNE_MELODY_WATER_BALL_DAMAGE } from './constants';
import { damageEnemy, damagePlayer, playSFX_hit, type Enemy, type GameState } from './engine';
import { blueFishPopped } from './neptune';

/** Shared by the player's note and clam waves. Returns whether a fish supplied hit feedback. */
export function hitNeptuneMelodyTarget(state:GameState,target:Enemy):boolean {
  if(target.hp<=0)return false;
  if(target.type==='fish_blue'||target.type==='fish_red'){
    target.hp=0;
    if(target.type==='fish_blue')blueFishPopped(state);else damagePlayer(state,NEPTUNE_FISH_HURT);
    return true;
  }
  if(target.type==='water_bomb'){
    const hp=target.hp;damageEnemy(state,target,NEPTUNE_MELODY_WATER_BALL_DAMAGE,'special');
    if(target.hp<hp)playSFX_hit();
  }else if(target.type==='water_clone'){
    target.neptuneTauntTicks=NEPTUNE_MELODY_TAUNT_TICKS;target.neptuneFleeBurstTicks=0;target.path=[];
  }
  return false;
}
