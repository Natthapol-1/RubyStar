import { NEPTUNE_CLAM, NEPTUNE_CORRUPTED_CLAM, TILE_SIZE, TELEPORT_PADS, chamberOfTile, hallwayOfTile, T_FLOOR } from './constants';
import { damageEnemy, damagePlayer, freeChamberTiles, isFloorTile, playerCCImmune, type GameState } from './engine';
import { hitNeptuneMelodyTarget } from './neptune-melody-targets';
import { playRefrainNote } from './neptune-refrain';
import { playCorruptedClamAudio, prepareCorruptedClamAudio } from './neptune-clam-audio';

export interface NeptuneClam { tileX:number;tileY:number;openTicks:number;waveTicks:number;hitIds:number[];pitch:number;corrupted?:boolean;hitPlayer?:boolean }

export function neptuneClamSlow(state:GameState){return state.neptune?.phase===3&&(state.neptune.corruptedClamSlowUntil??0)>state.gameTick?NEPTUNE_CORRUPTED_CLAM.slow:1;}

function addClam(state:GameState,chamber:number,corrupted:boolean,previous:NeptuneClam[]=[]){
  const n=state.neptune!;
  const available:[number,number][]=chamber>=0?freeChamberTiles(state,chamber):state.map.flatMap((row,y)=>row.flatMap((tile,x)=>tile===T_FLOOR&&hallwayOfTile(x,y)>=0&&chamberOfTile(x,y)<0&&!(x===state.playerTileX&&y===state.playerTileY)&&!(x===state.rubyTileX&&y===state.rubyTileY)&&!state.enemies.some(e=>e.tileX===x&&e.tileY===y)?[[x,y] as [number,number]]:[]));
  const candidates=available.filter(([x,y])=>!TELEPORT_PADS.some(([px,py])=>px===x&&py===y)&&!n.clams?.some(clam=>clam.tileX===x&&clam.tileY===y));
  const moved=candidates.filter(([x,y])=>!previous.some(clam=>clam.tileX===x&&clam.tileY===y));
  const tiles=moved.length?moved:candidates;if(!tiles.length)return;
  const [tileX,tileY]=tiles[Math.floor(Math.random()*tiles.length)];
  n.clams!.push({tileX,tileY,openTicks:0,waveTicks:0,hitIds:[],pitch:chamber%6,corrupted});
}

export function placeNeptuneClams(state:GameState){
  const n=state.neptune;if(!n)return;
  const previous=n.clams??[];
  n.clams=[];
  for(const chamber of [0,1,2,3])addClam(state,chamber,false,previous);
  if(n.phase===3)for(const chamber of [0,1,2,3])addClam(state,chamber,true,previous);
  if(n.phase===3)addClam(state,-1,true,previous);
  n.clamRepositionTicks=NEPTUNE_CLAM.repositionTicks;
}

export function openNeptuneClam(state:GameState,clam:NeptuneClam,pitch:number,playNote=true):boolean{
  if(clam.openTicks>0)return false;
  clam.openTicks=clam.corrupted?NEPTUNE_CORRUPTED_CLAM.openTicks:NEPTUNE_CLAM.openTicks;
  clam.waveTicks=NEPTUNE_CLAM.waveTicks;clam.hitIds=[];clam.pitch=pitch;
  clam.hitPlayer=false;
  if(clam.corrupted)playCorruptedClamAudio();
  if(playNote)playRefrainNote(pitch);
  playRefrainNote(pitch,'miss');return true;
}

export function openNeptuneClamsInRange(state:GameState,x:number,y:number,radius:number,pitch:number){
  for(const clam of state.neptune?.clams??[]){
    if(Math.hypot((clam.tileX+.5)*TILE_SIZE-x,(clam.tileY+.5)*TILE_SIZE-y)<=radius)openNeptuneClam(state,clam,pitch,false);
  }
}

/** A moving front hits each target once, and can relay Melody through another closed clam. */
export function updateNeptuneClams(state:GameState){
  const n=state.neptune;if(!n||state.gamePhase!=='playing')return;
  if(!n.clams)placeNeptuneClams(state);
  else if((n.clamRepositionTicks=(n.clamRepositionTicks??NEPTUNE_CLAM.repositionTicks)-1)<=0)placeNeptuneClams(state);
  if(n.phase!==3)n.clams=n.clams?.filter(clam=>!clam.corrupted);
  else for(const chamber of [0,1,2,3,-1])if(!n.clams?.some(clam=>clam.corrupted&&(chamber>=0?chamberOfTile(clam.tileX,clam.tileY)===chamber:hallwayOfTile(clam.tileX,clam.tileY)>=0)))addClam(state,chamber,true);
  if(n.phase===3)void prepareCorruptedClamAudio();
  for(const clam of n.clams??[]){
    if(clam.openTicks>0)clam.openTicks--;
    if(clam.waveTicks<=0)continue;
    clam.waveTicks--;
    const radius=(clam.corrupted?NEPTUNE_CORRUPTED_CLAM.radius:NEPTUNE_CLAM.radius)*TILE_SIZE*(1-clam.waveTicks/NEPTUNE_CLAM.waveTicks);
    const x=(clam.tileX+.5)*TILE_SIZE,y=(clam.tileY+.5)*TILE_SIZE;
    if(clam.corrupted){
      if(!clam.hitPlayer&&Math.hypot(state.playerX-x,state.playerY-y)<=radius){
        clam.hitPlayer=true;damagePlayer(state,NEPTUNE_CORRUPTED_CLAM.damage);
        if(!state.enemyDecoyActive&&!playerCCImmune(state)){
          n.corruptedClamSlowUntil=Math.max(n.corruptedClamSlowUntil??0,state.gameTick+NEPTUNE_CORRUPTED_CLAM.slowTicks);
          const dx=state.playerTileX-clam.tileX,dy=state.playerTileY-clam.tileY;
          const [kx,ky]=Math.abs(dx)>=Math.abs(dy)?[Math.sign(dx)||1,0]:[0,Math.sign(dy)||1];
          if(!state.playerKnockback&&isFloorTile(state.map,state.playerTargetX+kx,state.playerTargetY+ky))state.playerKnockback={dirX:kx,dirY:ky,started:false,tilesLeft:NEPTUNE_CORRUPTED_CLAM.pushTiles,speedMult:NEPTUNE_CORRUPTED_CLAM.pushSpeed};
        }
      }
      continue;
    }
    let fishHit=false;
    for(const enemy of state.enemies.slice()){
      if(enemy.hp<=0||clam.hitIds.includes(enemy.id)||Math.hypot(enemy.x-x,enemy.y-y)>radius)continue;
      clam.hitIds.push(enemy.id);fishHit=hitNeptuneMelodyTarget(state,enemy)||fishHit;
      if(['fish_blue','fish_red','water_bomb'].includes(enemy.type))continue;
      damageEnemy(state,enemy,NEPTUNE_CLAM.damage,'special');
      if(enemy.hp<=0)continue;
      enemy.clamSlowUntil=Math.max(enemy.clamSlowUntil??0,state.gameTick+NEPTUNE_CLAM.slowTicks);
      const dx=enemy.x-x,dy=enemy.y-y,length=Math.hypot(dx,dy)||1;
      enemy.pushDirX=Math.round(dx/length);enemy.pushDirY=Math.round(dy/length);
      if(!enemy.pushDirX&&!enemy.pushDirY)enemy.pushDirX=1;
      enemy.pushTiles=Math.max(enemy.pushTiles,NEPTUNE_CLAM.pushTiles);
    }
    if(fishHit)playRefrainNote(clam.pitch,'miss');
    for(const other of n.clams??[]){
      if(other===clam||other.openTicks>0||Math.hypot(other.tileX-clam.tileX,other.tileY-clam.tileY)*TILE_SIZE>radius)continue;
      openNeptuneClam(state,other,clam.pitch);
    }
  }
}
