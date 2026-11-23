import { CHAMBER_BOUNDS, JUPITER, TELEPORT_PADS, TILE_SIZE, T_FLOOR, T_WALL } from './constants';
import type { GameState } from './engine';

type Tile = [number, number];
export interface JupiterCoverBlock { id:number; room:number; tiles:Tile[] }
export interface JupiterCoverMove { id:number; from:Tile[]; to:Tile[] }
export interface JupiterCoverShuffle { phase:'warning'|'retract'|'rise'; ticks:number; moves:JupiterCoverMove[] }
const directions:Tile[]=[[1,0],[-1,0],[0,1],[0,-1]];
const interval=()=>JUPITER.coverMinInterval+Math.floor(Math.random()*(JUPITER.coverMaxInterval-JUPITER.coverMinInterval+1));

function invalidatePaths(state:GameState) {
  for(const enemy of state.enemies){enemy.path=[];enemy.pathTimer=0;}
  for(const storm of state.jupiter!.miniStorms){storm.path=[];storm.retarget=0;}
}

export function stopJupiterCoverShuffle(state:GameState) {
  if(!state.jupiter)return;
  // Older saved runs may contain a sliding tile with both ends reserved.
  for(const block of state.jupiter.movingCover??[])if(block.fromX!==undefined&&block.fromY!==undefined)state.map[block.fromY][block.fromX]=T_FLOOR;
  delete state.jupiter.movingCover;
  state.jupiter.coverShuffle=undefined;
}

function collectBlocks(state:GameState):JupiterCoverBlock[] {
  const blocks:JupiterCoverBlock[]=[];
  CHAMBER_BOUNDS.forEach(([r1,c1,r2,c2],room)=>{
    const seen=new Set<string>();
    for(let y=r1+1;y<r2;y++)for(let x=c1+1;x<c2;x++) {
      if(state.map[y][x]!==T_WALL||seen.has(`${x},${y}`))continue;
      const tiles:Tile[]=[[x,y]];seen.add(`${x},${y}`);
      for(let i=0;i<tiles.length;i++)for(const [dx,dy]of directions) {
        const nx=tiles[i][0]+dx,ny=tiles[i][1]+dy,key=`${nx},${ny}`;
        if(nx<=c1||nx>=c2||ny<=r1||ny>=r2||state.map[ny][nx]!==T_WALL||seen.has(key))continue;
        seen.add(key);tiles.push([nx,ny]);
      }
      // Substantial free-standing sections, including the existing bars and L shapes.
      if(tiles.length>=3&&tiles.length<=12&&tiles.every(([tx,ty])=>tx>c1+1&&tx<c2-1&&ty>r1+1&&ty<r2-1))blocks.push({id:blocks.length,room,tiles});
    }
  });
  return blocks;
}

function occupied(state:GameState,x:number,y:number) {
  const j=state.jupiter!,near=(px:number,py:number,r=1.5)=>Math.hypot(px/TILE_SIZE-.5-x,py/TILE_SIZE-.5-y)<r;
  if(TELEPORT_PADS.some(([px,py])=>Math.abs(px-x)<=2&&Math.abs(py-y)<=2))return true;
  if(near(state.playerX,state.playerY,2)||Math.abs(state.playerTargetX-x)<=1&&Math.abs(state.playerTargetY-y)<=1)return true;
  if(state.rubyTileX>=0&&Math.abs(state.rubyTileX-x)<=1&&Math.abs(state.rubyTileY-y)<=1)return true;
  if(state.enemies.some(e=>near(e.x,e.y)||Math.abs(e.targetTileX-x)<=1&&Math.abs(e.targetTileY-y)<=1))return true;
  if(j.miniStorms.some(s=>near(s.x,s.y)||s.path[0]?.[0]===x&&s.path[0]?.[1]===y))return true;
  if(state.resources.some(r=>r.tileX===x&&r.tileY===y)||state.bomb?.tileX===x&&state.bomb?.tileY===y)return true;
  if(j.fragments.some(f=>Math.abs(f.x-x)<=1&&Math.abs(f.y-y)<=1)||j.shards.some(s=>s.x===x&&s.y===y)||j.shockTiles.some(t=>t.x===x&&t.y===y))return true;
  return j.walls.some(w=>w.vertical?Math.abs(w.x-(x+.5)*TILE_SIZE)<TILE_SIZE*.5&&(y+.5)*TILE_SIZE>=w.y-(w.negative??w.half)-TILE_SIZE*.5&&(y+.5)*TILE_SIZE<=w.y+(w.positive??w.half)+TILE_SIZE*.5:
    Math.abs(w.y-(y+.5)*TILE_SIZE)<TILE_SIZE*.5&&(x+.5)*TILE_SIZE>=w.x-(w.negative??w.half)-TILE_SIZE*.5&&(x+.5)*TILE_SIZE<=w.x+(w.positive??w.half)+TILE_SIZE*.5);
}

// Every interior floor cell must remain connected to its pad, including entrances
// and pickups. Check the room locally so a temporary Reaper hallway seal is valid.
function connected(map:number[][],room:number) {
  const [r1,c1,r2,c2]=CHAMBER_BOUNDS[room],[px,py]=TELEPORT_PADS[room];
  if(map[py][px]===T_WALL)return false;
  const seen=new Set<number>([py*100+px]),queue:Tile[]=[[px,py]];
  for(let i=0;i<queue.length;i++)for(const [dx,dy]of directions) {
    const x=queue[i][0]+dx,y=queue[i][1]+dy,key=y*100+x;
    if(x<=c1||x>=c2||y<=r1||y>=r2||map[y][x]===T_WALL||seen.has(key))continue;
    seen.add(key);queue.push([x,y]);
  }
  for(let y=r1+1;y<r2;y++)for(let x=c1+1;x<c2;x++)if(map[y][x]!==T_WALL&&!seen.has(y*100+x))return false;
  return true;
}

function shape(size:number):Tile[] {
  // Pick a designed silhouette with the same area as the section it replaces.
  const variants:Tile[][]=[];
  if(size<=6)variants.push(Array.from({length:size},(_,i)=>[i,0] as Tile));
  if(size%2===0)variants.push(Array.from({length:size},(_,i)=>[i%2,Math.floor(i/2)] as Tile));
  const arm=Math.ceil(size/2);
  variants.push(Array.from({length:size},(_,i)=>i<arm?[i,0] as Tile:[0,i-arm+1] as Tile));
  const chosen=variants[Math.floor(Math.random()*variants.length)],turns=Math.floor(Math.random()*4);
  let tiles=chosen.map(([x,y])=>[x,y] as Tile);
  for(let i=0;i<turns;i++)tiles=tiles.map(([x,y])=>[-y,x]);
  const minX=Math.min(...tiles.map(t=>t[0])),minY=Math.min(...tiles.map(t=>t[1]));
  return tiles.map(([x,y])=>[x-minX,y-minY]);
}

function planShuffle(state:GameState):JupiterCoverMove[] {
  const blocks=state.jupiter!.coverBlocks!,moves:JupiterCoverMove[]=[],map=state.map.map(row=>row.slice());
  for(let room=0;room<4;room++) {
    const options=blocks.filter(b=>b.room===room);
    // Fisher-Yates preserves a varied selection without depending on sort order.
    for(let i=options.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[options[i],options[k]]=[options[k],options[i]];}
    const selected=options.slice(0,Math.max(2,Math.ceil(options.length*.6)));
    for(const block of selected) {
      const [r1,c1,r2,c2]=CHAMBER_BOUNDS[room];
      for(const [x,y]of block.tiles)map[y][x]=T_FLOOR;
      let to:Tile[]|undefined;
      for(let attempt=0;attempt<80;attempt++) {
        const outline=shape(block.tiles.length),w=Math.max(...outline.map(t=>t[0]))+1,h=Math.max(...outline.map(t=>t[1]))+1;
        const x=c1+2+Math.floor(Math.random()*(c2-c1-w-3)),y=r1+2+Math.floor(Math.random()*(r2-r1-h-3));
        const candidate=outline.map(([dx,dy])=>[x+dx,y+dy] as Tile);
        const oldX=block.tiles.reduce((sum,t)=>sum+t[0],0)/block.tiles.length,oldY=block.tiles.reduce((sum,t)=>sum+t[1],0)/block.tiles.length;
        if(Math.hypot(x+w/2-oldX,y+h/2-oldY)<3||candidate.some(([tx,ty])=>map[ty][tx]!==T_FLOOR||occupied(state,tx,ty)))continue;
        for(const [tx,ty]of candidate)map[ty][tx]=T_WALL;
        const valid=connected(map,room);
        for(const [tx,ty]of candidate)map[ty][tx]=T_FLOOR;
        if(valid){to=candidate;break;}
      }
      if(to){for(const [x,y]of to)map[y][x]=T_WALL;moves.push({id:block.id,from:block.tiles.map(t=>[...t] as Tile),to});}
      else for(const [x,y]of block.tiles)map[y][x]=T_WALL;
    }
  }
  return moves;
}

function commitShuffle(state:GameState,moves:JupiterCoverMove[]) {
  // An actor or newly relocated cell can enter a preview. Cancel that section,
  // then recheck the combined layout before changing any collision.
  let accepted=moves.filter(m=>!m.to.some(([x,y])=>occupied(state,x,y)));
  const map=state.map.map(row=>row.slice());
  for(const m of accepted)for(const [x,y]of m.from)map[y][x]=T_FLOOR;
  let valid=true;
  for(const m of accepted)for(const [x,y]of m.to){if(map[y][x]!==T_FLOOR)valid=false;map[y][x]=T_WALL;}
  if(!valid||CHAMBER_BOUNDS.some((_,room)=>!connected(map,room)))accepted=[];
  const ids=new Set(accepted.map(m=>m.id));
  for(const m of accepted)for(const [x,y]of m.from)state.map[y][x]=T_FLOOR;
  for(const m of accepted) {
    for(const [x,y]of m.to)state.map[y][x]=T_WALL;
    state.jupiter!.coverBlocks!.find(b=>b.id===m.id)!.tiles=m.to;
  }
  for(const m of moves)if(!ids.has(m.id))m.to=m.from;
  if(accepted.length)invalidatePaths(state);
}

export function updateJupiterCover(state:GameState) {
  const j=state.jupiter!;
  if(state.gamePhase!=='playing')return;
  if(j.movingCover)stopJupiterCoverShuffle(state);
  if(j.phase<2||j.stage!=='pursuit'){stopJupiterCoverShuffle(state);j.coverTimer=undefined;return;}
  j.coverBlocks??=collectBlocks(state);
  const change=j.coverShuffle;
  if(change) {
    if(--change.ticks>0)return;
    if(change.phase==='warning'){change.phase='retract';change.ticks=JUPITER.coverRetractTicks;}
    else if(change.phase==='retract'){commitShuffle(state,change.moves);change.phase='rise';change.ticks=JUPITER.coverRiseTicks;}
    else {j.coverShuffle=undefined;j.coverTimer=interval()-JUPITER.coverWarningTicks-JUPITER.coverRetractTicks-JUPITER.coverRiseTicks;}
    return;
  }
  j.coverTimer=(j.coverTimer??interval())-1;
  if(j.coverTimer>0)return;
  const moves=planShuffle(state);
  if(moves.length)j.coverShuffle={phase:'warning',ticks:JUPITER.coverWarningTicks,moves};
  else j.coverTimer=interval();
}
