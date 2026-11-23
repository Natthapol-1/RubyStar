import { TILE_SIZE, MAP_COLS, MAP_ROWS } from './constants';
import type { Enemy, GameState } from './engine';
import { RUNES, RUNE_STEP, SIRIUS, SIRIUS_BURST_TICKS, runeProgress, type Rune } from './sirius';

// Sirius challenge art: the walked trail, rune strikes, the two sanctuary aliens and their tells, and screen flashes.
export const RUNE_GOLD = '#ffe27a', WRATH_RED = '#ff6a4d', TRAIL_GOLD = '#e8c45c';
const panel = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

/** An inlaid sanctuary crest: open gold tracery and an ivory light, with floor visible between the lines. */
export function drawSanctuarySeal(ctx: CanvasRenderingContext2D, x: number, y: number, tick: number, covered: boolean, size = TILE_SIZE, light = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / TILE_SIZE, size / TILE_SIZE);
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  const gold = covered ? '#ffd057' : light > .5 ? '#77736b' : '#686471';
  ctx.strokeStyle = gold; ctx.lineWidth = covered ? 2 : 1.3;
  ctx.beginPath(); ctx.moveTo(-9, -19); ctx.lineTo(9, -19); ctx.lineTo(19, -9); ctx.lineTo(19, 9);
  ctx.lineTo(9, 19); ctx.lineTo(-9, 19); ctx.lineTo(-19, 9); ctx.lineTo(-19, -9); ctx.closePath(); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 2);
    panel(ctx, -1, -22, 2, 6, gold); panel(ctx, -5, -17, 10, 2, gold);
    ctx.restore();
  }
  ctx.shadowColor = '#ffd057'; ctx.shadowBlur = covered ? 4 + Math.sin(tick * .045) : 0;
  ctx.fillStyle = covered ? '#fff9d6' : light > .5 ? '#8b8578' : '#8a8591';
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(4, -4); ctx.lineTo(14, 0); ctx.lineTo(4, 4);
  ctx.lineTo(0, 14); ctx.lineTo(-4, 4); ctx.lineTo(-14, 0); ctx.lineTo(-4, -4); ctx.closePath(); ctx.fill();
  if (covered) { ctx.strokeStyle = '#ffdb72'; ctx.lineWidth = 1.5; ctx.stroke(); }
  ctx.shadowBlur = 0; panel(ctx, -2, -2, 4, 4, covered ? '#ffd057' : '#34343c');
  ctx.restore();
}

/** The rune as the tiles you walk: the start tile, then one tile per step. */
export function runeCells(rune: Rune): [number, number][] {
  const cells: [number, number][] = [[0, 0]];
  let x = 0, y = 0;
  for (const [dir, len] of rune.strokes) for (let k = 0; k < len; k++) { x += RUNE_STEP[dir][0]; y += RUNE_STEP[dir][1]; cells.push([x, y]); }
  return cells;
}

/** Tile-counted rune with a continuous centerline following the exact stroke order, and an outlined start tile. */
export function drawRuneTiles(ctx: CanvasRenderingContext2D, rune: Rune, cx: number, cy: number, box: number, traced: number) {
  const cells = runeCells(rune), xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys), cols = Math.max(...xs) - minX + 1, rows = Math.max(...ys) - minY + 1;
  const size = Math.floor(box / Math.max(cols, rows)), ox = Math.round(cx - cols * size / 2), oy = Math.round(cy - rows * size / 2);
  cells.forEach(([x, y], i) => {
    const px = ox + (x - minX) * size, py = oy + (y - minY) * size, lit = i <= traced && traced > 0;
    panel(ctx, px + 1, py + 1, size - 2, size - 2, lit ? '#fff6d0' : '#5e5130');
    if (!lit) panel(ctx, px + 3, py + 3, size - 6, size - 6, '#a88d45');
    if (i === 0) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(px + 1, py + 1, size - 2, size - 2); }
  });
  ctx.save(); ctx.shadowBlur = 0; ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  ctx.beginPath();
  cells.forEach(([x, y], i) => {
    const px = ox + (x - minX + .5) * size, py = oy + (y - minY + .5) * size;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = Math.max(1.25, size * .12); ctx.stroke();
  const markerSize = Math.max(2, Math.round(size * .24));
  for (const [x, y] of [cells[0], cells[cells.length - 1]]) {
    const px = ox + (x - minX + .5) * size, py = oy + (y - minY + .5) * size;
    panel(ctx, px - markerSize / 2, py - markerSize / 2, markerSize, markerSize, '#fff3c4');
  }
  ctx.restore();
}

/** Your trail on the floor: a gold line through the tiles you walked; the part that already matches the rune glows. */
export function drawSiriusGround(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const t = state.sirius; if (!t) return;
  ctx.save(); ctx.shadowBlur = 0;
  const rune = t.rune && t.rune.cast <= 0 ? RUNES[t.rune.index] : null;
  const matched = rune ? runeProgress(t.steps, rune).tiles : 0, first = t.trail.length - 1 - matched;
  const shape = matched > 0 ? t.trail.slice(first) : [];
  if (t.phase >= 3 && t.rune) for (const seal of t.sanctuarySeals ?? []) {
    const covered = shape.some(p => p.x === seal.x && p.y === seal.y);
    drawSanctuarySeal(ctx, (seal.x + .5) * TILE_SIZE - camX, (seal.y + .5) * TILE_SIZE - camY, tick, covered, TILE_SIZE, state.trial?.siriusLightBlend ?? 0);
  }
  for (let i = 0; i < t.trail.length; i++) {
    const p = t.trail[i], age = (t.trail.length - 1 - i) / Math.max(1, SIRIUS.trailMax), lit = i >= first && matched > 0;
    const x = (p.x + .5) * TILE_SIZE - camX, y = (p.y + .5) * TILE_SIZE - camY;
    ctx.globalAlpha = lit ? .85 : .4 * (1 - age * .7);
    if (i > 0) { // a connecting bar to the previous tile
      const q = t.trail[i - 1], qx = (q.x + .5) * TILE_SIZE - camX, qy = (q.y + .5) * TILE_SIZE - camY;
      panel(ctx, Math.min(x, qx) - 3, Math.min(y, qy) - 3, Math.abs(x - qx) + 6, Math.abs(y - qy) + 6, lit ? RUNE_GOLD : TRAIL_GOLD);
      if (lit) { ctx.globalAlpha = .25 + .15 * Math.sin(tick * .2 + i); panel(ctx, Math.min(x, qx) - 8, Math.min(y, qy) - 8, Math.abs(x - qx) + 16, Math.abs(y - qy) + 16, RUNE_GOLD); }
    }
    ctx.globalAlpha = lit ? 1 : .5 * (1 - age * .7); panel(ctx, x - 4, y - 4, 8, 8, lit ? '#fff6d0' : TRAIL_GOLD);
  }
  // Penitent bites: a dark smudge where it ate a trail tile.
  for (const p of t.eaten) { ctx.globalAlpha = p.ticks / 24 * .6; panel(ctx, p.x * TILE_SIZE - camX + 14, p.y * TILE_SIZE - camY + 14, TILE_SIZE - 28, TILE_SIZE - 28, '#1a1020'); }
  // Mason walls: a gold seam outlines each raised stone; it flickers as the wall is about to sink.
  for (const w of t.walls) {
    const x = w.x * TILE_SIZE - camX, y = w.y * TILE_SIZE - camY, rise = Math.min(1, (SIRIUS.mason.wallTicks - w.ticks) / 10), end = w.ticks < 45 ? (Math.floor(tick / 6) % 2 ? .35 : 1) : 1;
    ctx.globalAlpha = .75 * rise * end; ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.globalAlpha = .25 * rise * end; panel(ctx, x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8, '#fff2c4');
    ctx.globalAlpha = .6 * end; panel(ctx, x + 6, y + TILE_SIZE - 8, (TILE_SIZE - 12) * (w.ticks / SIRIUS.mason.wallTicks), 3, RUNE_GOLD); // time left
  }
  // Zealot lanes, Bellringer rings and Mason wall marks in wind-up.
  for (const e of state.enemies) {
    const act = e.siriusAct; if (!act) continue;
    if (e.type === 'zealot' && !act.dashing) {
      const p = 1 - act.ticks / SIRIUS.zealot.windup;
      let x = e.tileX, y = e.tileY;
      while (x !== act.tx || y !== act.ty) {
        x += act.dx; y += act.dy;
        ctx.globalAlpha = .2 + .35 * p; ctx.strokeStyle = WRATH_RED; ctx.lineWidth = 2; ctx.strokeRect(x * TILE_SIZE - camX + 6, y * TILE_SIZE - camY + 6, TILE_SIZE - 12, TILE_SIZE - 12);
      }
    } else if (e.type === 'mason') {
      const p = 1 - act.ticks / SIRIUS.mason.windup;
      for (const [x, y] of act.tiles ?? []) {
        ctx.globalAlpha = .25 + .55 * p; ctx.strokeStyle = '#d8d2ec'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.strokeRect(x * TILE_SIZE - camX + 4, y * TILE_SIZE - camY + 4, TILE_SIZE - 8, TILE_SIZE - 8); ctx.setLineDash([]);
        ctx.globalAlpha = .15 * p; panel(ctx, x * TILE_SIZE - camX + 4, y * TILE_SIZE - camY + TILE_SIZE - 4 - (TILE_SIZE - 8) * p, TILE_SIZE - 8, (TILE_SIZE - 8) * p, '#9a94ad');
      }
    } else if (e.type === 'bellringer') {
      const p = 1 - act.ticks / SIRIUS.bellringer.windup, r = SIRIUS.bellringer.radius * TILE_SIZE;
      ctx.globalAlpha = .15 + .4 * p; ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
      ctx.strokeRect(e.x - camX - r, e.y - camY - r, r * 2, r * 2); ctx.setLineDash([]);
    }
  }
  ctx.restore();
}

/** Sacred Halo: layered open light fronts and sanctuary tracery, shared with the guide. */
export function drawHaloKnockbackWave(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number, radius: number, full = false) {
  const p = Math.max(0, Math.min(1, progress));
  if(p>=1)return;
  const fade=Math.min(1,(1-p)*3),ease=1-(1-p)*(1-p),reach=radius*(full?p:.08+.92*ease),weight=full?2.5:1;
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.shadowBlur=0;
  // Full Holy Light adds two trailing fronts to the normal three cardinal bands.
  for(let layer=0;layer<(full?5:3);layer++){
    const q=p-layer*.085;if(q<0)continue;
    const r=radius*(full?q:.08+.92*(1-(1-q)*(1-q))),length=Math.max(18,r*.56),strength=fade*(1-layer*(full?.18:.3));
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(i*Math.PI/2);
      ctx.globalAlpha=strength*(full?.2:.13);panel(ctx,-length*.56,-r-7*weight,length*1.12,15*weight,RUNE_GOLD);
      ctx.globalAlpha=strength*.9;panel(ctx,-length/2,-r-3*weight,length,6*weight,layer?'#d1ad55':RUNE_GOLD);
      ctx.globalAlpha=strength;panel(ctx,-length*.4,-r-weight,length*.8,2*weight,'#fff8de');
      // Paired inset rails and squared tips echo the sanctuary's gilded stonework.
      if(layer===0){
        ctx.globalAlpha=fade*.65;
        panel(ctx,-length/2,-r+5*weight,length*.28,2*weight,'#e8c45c');panel(ctx,length*.22,-r+5*weight,length*.28,2*weight,'#e8c45c');
        panel(ctx,-length/2-2*weight,-r-7*weight,3*weight,14*weight,'#fff0b5');panel(ctx,length/2-weight,-r-7*weight,3*weight,14*weight,'#fff0b5');
      }
      ctx.restore();
    }
  }
  // Four detached corner crests travel with the leading front, inside the real reach.
  for(let i=0;i<4;i++){
    ctx.save();ctx.rotate(i*Math.PI/2);
    const d=reach*.69,arm=(10+ease*9)*weight;
    ctx.globalAlpha=fade*.75;panel(ctx,d-arm,-d,arm,3*weight,RUNE_GOLD);panel(ctx,d-3*weight,-d,3*weight,arm,RUNE_GOLD);
    ctx.globalAlpha=fade;panel(ctx,d-4*weight,-d+weight,3*weight,3*weight,'#fff8de');
    ctx.restore();
  }
  // Short rays and drifting square lights, with stable positions rather than random flicker.
  for(let i=0;i<16;i++){
    const angle=i*Math.PI/8,travel=reach*(.64+(i%3)*.11),length=(8+i%4*5)*(1-p*.5);
    ctx.save();ctx.rotate(angle);ctx.globalAlpha=fade*(i%2?.5:.8);
    panel(ctx,travel-length*weight,-weight,length*weight,2*weight,i%2?'#e8c45c':'#fff5cc');
    if(i%2===0){ctx.globalAlpha=fade*.8;panel(ctx,travel+5,-2,4,4,RUNE_GOLD);}
    ctx.restore();
  }
  // A brief luminous sanctuary seal anchors the release to the cast position.
  const flash=Math.max(0,1-p/.55),core=12+p*30;
  if(flash>0){
    ctx.globalAlpha=flash*.8;ctx.strokeStyle=RUNE_GOLD;ctx.lineWidth=2;ctx.strokeRect(-core,-core,core*2,core*2);
    ctx.globalAlpha=flash;panel(ctx,-core-9,-2,core*2+18,4,'#fff8de');
    ctx.globalAlpha=flash*.9;panel(ctx,-5,-5,10,10,RUNE_GOLD);panel(ctx,-2,-2,4,4,'#ffffff');
  }
  ctx.restore();
}

/** Holy Light shafts render below the player shell, following its floating position. */
export function drawSiriusHolyRays(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,camX:number,camY:number,tick:number){
  const t=state.sirius;if(!t||t.burst<=0)return;
  const p=1-t.burst/SIRIUS_BURST_TICKS;
  const reach=Math.max(...[[0,0],[MAP_COLS*TILE_SIZE,0],[0,MAP_ROWS*TILE_SIZE],[MAP_COLS*TILE_SIZE,MAP_ROWS*TILE_SIZE]].map(([x,y])=>Math.hypot(x-t.burstAt.x,y-t.burstAt.y)));
  ctx.save();ctx.shadowBlur=0;
    // Narrow cathedral shafts shine from the player, with the light overlay's feathered sides.
    const beamIn=Math.min(1,p*15);
    const beamFade=beamIn*beamIn*(3-2*beamIn)*(.5+.5*Math.cos(p*Math.PI)),beamLength=reach*Math.min(1,p*5);
    if(beamLength>0){
      ctx.save();ctx.translate(state.playerX-camX,state.playerY-camY-siriusFloatLift(state,tick));
      for(let i=0;i<8;i++){
        ctx.save();ctx.rotate(i*Math.PI/4+.08);
        const shaft=ctx.createLinearGradient(0,0,beamLength,0);
        for(let stop=0;stop<=24;stop++){
          const distance=stop/24,alpha=.5+.5*Math.cos(distance*Math.PI);
          shaft.addColorStop(distance,`rgba(${Math.round(255-distance*17)},${Math.round(252-distance*39)},${Math.round(231-distance*83)},${alpha})`);
        }
        ctx.fillStyle=shaft;
        const near=4,far=beamLength*(i%2?.03:.046);
        // Adjacent feather strips avoid the uneven accumulated opacity of nested cones.
        for(let strip=0;strip<96;strip++){
          const left=strip/48-1,right=(strip+1)/48-1,middle=(left+right)/2;
          ctx.globalAlpha=beamFade*.34*(.5+.5*Math.cos(middle*Math.PI));
          ctx.beginPath();ctx.moveTo(0,left*near);ctx.lineTo(0,right*near);ctx.lineTo(beamLength,right*far);ctx.lineTo(beamLength,left*far);ctx.closePath();ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();
    }
  ctx.restore();
}

/** Effects over the battlefield: Halo wave, Bellringer pulses, rune strikes and wrath. */
export function drawSiriusEffects(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, camX: number, camY: number, tick: number) {
  const t = state.sirius; if (!t) return;
  ctx.save(); ctx.shadowBlur = 0;
  if (t.haloWave) drawHaloKnockbackWave(ctx, t.haloWave.x - camX, t.haloWave.y - camY, 1 - t.haloWave.ticks / SIRIUS.haloWaveTicks, SIRIUS.haloWaveRadius * TILE_SIZE);
  for (const ring of t.rings) {
    const p = 1 - ring.ticks / 30, r = ring.radius * TILE_SIZE * (.4 + .6 * p);
    ctx.globalAlpha = (1 - p) * .8; ctx.strokeStyle = RUNE_GOLD; ctx.lineWidth = 6 - p * 4;
    ctx.strokeRect(ring.x - camX - r, ring.y - camY - r, r * 2, r * 2);
  }
  // Full Holy Light shares Sacred Halo's open sanctuary wave, at arena scale.
  if (t.burst > 0) {
    const p=1-t.burst/SIRIUS_BURST_TICKS,cx=t.burstAt.x-camX,cy=t.burstAt.y-camY;
    const reach=Math.max(...[[0,0],[MAP_COLS*TILE_SIZE,0],[0,MAP_ROWS*TILE_SIZE],[MAP_COLS*TILE_SIZE,MAP_ROWS*TILE_SIZE]].map(([x,y])=>Math.hypot(x-t.burstAt.x,y-t.burstAt.y)));
    // Broad, feathered square light is richer gold at its outer front and paler in its inner trail.
    const front=p*reach,wake=Math.min(front,Math.max(120,front*.36)),step=wake/32;
    if(step>0){
      ctx.save();ctx.lineJoin='miter';
      for(let i=0;i<32;i++){
        const u=(i+.5)/32,r=front-u*wake;
        ctx.globalAlpha=Math.sin(u*Math.PI)*Math.min(1,(1-p)*3)*.34;
        const gold=1-u;
        ctx.strokeStyle=`rgb(255,${Math.round(245-gold*59)},${Math.round(207-gold*123)})`;
        ctx.globalAlpha*=.65+.95*gold;
        ctx.lineWidth=step+.5;ctx.strokeRect(cx-r,cy-r,r*2,r*2);
      }
      ctx.restore();
    }
    drawHaloKnockbackWave(ctx,cx,cy,p,reach,true);
    // Quiet square prayer lights accompany the open bands rather than filling the centre.
    for(let i=0;i<48;i++){
      const angle=i*2.39996,travel=reach*p*(.6+i%5*.08);
      const shimmer=.35+.65*Math.pow(Math.max(0,Math.sin(p*18+i)),3),size=i%3?3:5;
      ctx.globalAlpha=(1-p)*shimmer*.55;
      panel(ctx,cx+Math.cos(angle)*travel,cy+Math.sin(angle)*travel,size,size,i%3?RUNE_GOLD:'#fff8de');
    }
  }
  for (const bolt of t.bolts) {
    const life = bolt.big ? (bolt.ticks > 0 ? bolt.ticks : 0) / 70 : bolt.ticks / 36, x = bolt.x - camX, y = bolt.y - camY, p = Math.min(1, life * 1.4);
    if (bolt.big) { // a wide pillar of light slams down, flares at the base and narrows as it fades
      const w = 46 * p + 8;
      ctx.globalAlpha = p * .35; panel(ctx, x - w, y - 900, w * 2, 900, RUNE_GOLD);
      ctx.globalAlpha = p; panel(ctx, x - w / 2, y - 900, w, 900, '#fff2b0'); panel(ctx, x - w / 6, y - 900, w / 3, 900, '#ffffff');
      ctx.globalAlpha = p * .6; panel(ctx, x - 70 * p, y - 22, 140 * p, 44, RUNE_GOLD); panel(ctx, x - 40 * p, y - 40 * p, 80 * p, 80 * p, '#ffffff');
      continue;
    }
    ctx.globalAlpha = life; panel(ctx, x - 10, y - 600, 20, 600, '#fff2b0'); panel(ctx, x - 4, y - 600, 8, 600, '#ffffff');
    ctx.globalAlpha = life * .5; panel(ctx, x - 36, y - 36, 72, 72, RUNE_GOLD);
  }
  if (t.wrath > 0) for (const e of state.enemies) {
    if (e.id === t.bossId || e.hp <= 0) continue;
    const x = e.x - camX, y = e.y - camY, r = 22 + Math.sin(tick * .2 + e.id) * 2;
    ctx.globalAlpha = .55; ctx.strokeStyle = WRATH_RED; ctx.lineWidth = 3; ctx.strokeRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = .18; panel(ctx, x - r, y - r, r * 2, r * 2, WRATH_RED);
  }
  ctx.restore();
}

/** Cathedral tracery gathers at the view edges before the sanctuary changes its light. */
export function drawSiriusSwapWarning(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,w:number,h:number){
  const t=state.sirius;
  if(!t||t.lightTimer<=0||t.lightTimer>SIRIUS.swapWarning||state.gamePhase==='won'||state.gamePhase==='lost')return;
  const p=1-t.lightTimer/SIRIUS.swapWarning,a=Math.min(1,p*5)*(.72+.28*p)*(t.light?.95:.8);if(a<=0)return;
  const incomingLight=!t.light,core=incomingLight?'#fff5cf':'#dbc5ef',rim=incomingLight?'#e8c86b':'#b39bc9',shade=incomingLight?'#7b6132':'#33233f';
  ctx.save();ctx.shadowBlur=0;ctx.lineJoin='miter';
  const edge=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.32,w/2,h/2,Math.max(w,h)*.65);
  edge.addColorStop(0,incomingLight?'#b9904200':'#27193600');edge.addColorStop(1,incomingLight?'#b99042':'#271936');
  ctx.globalAlpha=a*.66;ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
  const band=Math.min(180,w*.15);
  for(const side of [0,1]){
    ctx.save();if(side){ctx.translate(w,0);ctx.scale(-1,1);}
    const curtain=ctx.createLinearGradient(0,0,band,0);
    curtain.addColorStop(0,incomingLight?'#ffe8a0':'#261337');curtain.addColorStop(.35,incomingLight?'#b68b46':'#705087');curtain.addColorStop(1,incomingLight?'#b68b4600':'#70508700');
    ctx.globalAlpha=a*.64;ctx.fillStyle=curtain;ctx.fillRect(0,0,band,h);
    ctx.globalAlpha=a*.65;ctx.strokeStyle=rim;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(8,h);ctx.stroke();
    ctx.globalAlpha=a*.35;ctx.strokeStyle=core;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(20,h);ctx.stroke();
    ctx.restore();
  }
  const depth=Math.min(w*.2,225)*( .8+.2*p),rise=Math.min(h*.32,230);
  for(const [x,y,sx,sy] of [[0,0,1,1],[w,0,-1,1],[0,h,1,-1],[w,h,-1,-1]]){
    ctx.save();ctx.translate(x,y);ctx.scale(sx,sy);
    ctx.globalAlpha=a*.72;ctx.fillStyle=shade;
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(depth,0);ctx.lineTo(depth,16);ctx.lineTo(depth*.65,16);ctx.lineTo(depth*.65,36);ctx.lineTo(36,36);ctx.lineTo(36,rise*.7);ctx.lineTo(16,rise*.7);ctx.lineTo(16,rise);ctx.lineTo(0,rise);ctx.closePath();ctx.fill();
    ctx.globalAlpha=a*.95;ctx.strokeStyle=rim;ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(10,rise);ctx.lineTo(10,28);ctx.lineTo(28,28);ctx.lineTo(28,10);ctx.lineTo(depth,10);ctx.stroke();
    ctx.globalAlpha=a*.95;panel(ctx,23,23,10,10,core);panel(ctx,44,14,Math.max(12,depth-68),3,rim);
    ctx.restore();
  }
  // Sparse prayer lights remain at the sides, leaving the rune and player clear.
  for(let i=0;i<14;i++){
    const left=i%2===0,x=left?18+(i%4)*15:w-18-(i%4)*15;
    const y=(i*.173*h+(incomingLight?-1:1)*p*55+h)%h;
    ctx.globalAlpha=a*(.25+(i%3)*.09);panel(ctx,x,y,2,i%3?7:12,i%3?rim:core);
  }
  ctx.restore();
}

/** Screen flashes: a gold burst for a traced rune, a red pulse for a missed one, a soft wash on a light swap. */
export function drawSiriusScreen(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number) {
  const t = state.sirius; if (!t) return;
  ctx.save();
  // In the dark: a light indigo tint over the view, a little deeper at the edges. It follows the light/dark blend.
  const dark = 1 - (state.trial?.siriusLightBlend ?? (t.light ? 1 : 0));
  if (dark > 0) {
    ctx.globalAlpha = dark * .14; ctx.fillStyle = '#0a0618'; ctx.fillRect(0, 0, w, h);
    const rim = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .4, w / 2, h / 2, Math.max(w, h) * .75);
    rim.addColorStop(0, '#0a061800'); rim.addColorStop(1, '#0a0618');
    ctx.globalAlpha = dark * .22; ctx.fillStyle = rim; ctx.fillRect(0, 0, w, h);
  }
  for (const f of t.flashes) {
    const p = f.ticks / (f.kind === 'swap' ? 40 : f.kind.startsWith('guess') ? 45 : 50);
    const color = f.kind === 'success' || f.kind === 'guessRight' ? RUNE_GOLD : f.kind === 'swap' ? (t.light ? '#fff6d8' : '#1a1430') : WRATH_RED;
    ctx.globalAlpha = p * (f.kind === 'swap' ? .35 : f.kind.startsWith('guess') ? .12 : .2); ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = p * .8; ctx.strokeStyle = color; ctx.lineWidth = 14; ctx.strokeRect(7, 7, w - 14, h - 14);
  }
  if (t.wrath > 0) { ctx.globalAlpha = .25 + .1 * Math.sin(state.gameTick * .1); ctx.strokeStyle = WRATH_RED; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6); }
  if (t.halo > 0) { // floating: a warm glow at the edges, light from above and motes drifting up the view
    const tick = state.gameTick, k = Math.min(1, (SIRIUS.haloTicks - t.halo) / 20, t.halo / 30);
    const lit = 1 + .7 * (state.trial?.siriusLightBlend ?? (t.light ? 1 : 0)); // stronger in light, where it competes with the rays
    const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75);
    edge.addColorStop(0, '#ffe27a00'); edge.addColorStop(1, '#ffe27a');
    ctx.globalAlpha = Math.min(1, k * lit * (.32 + .06 * Math.sin(tick * .08))); ctx.fillStyle = edge; ctx.fillRect(0, 0, w, h);
    const top = ctx.createLinearGradient(0, 0, 0, h * .45); top.addColorStop(0, '#fff6d0'); top.addColorStop(1, '#fff6d000');
    ctx.globalAlpha = k * lit * .14; ctx.fillStyle = top; ctx.fillRect(0, 0, w, h * .45);
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 211.7 + Math.sin(tick * .02 + i) * 30) % w + w) % w, sy = h - (((tick * (1.2 + (i % 4) * .4) + i * 97) % (h + 40)));
      ctx.globalAlpha = Math.min(1, k * lit * (.35 + .3 * Math.sin(tick * .1 + i))); ctx.fillStyle = i % 3 ? (lit > 1.3 ? '#fff6d0' : '#ffe27a') : '#ffffff';
      ctx.fillRect(Math.round(sx), Math.round(sy), i % 5 ? 3 : 4, i % 5 ? 6 : 8); // small upright feathers of light
    }
  }
  ctx.restore();
}

/** Zealot and Bellringer. The Zealot is an ivory-armoured lancer with a crimson plume and a long spear that points
 * where it is going; the Bellringer is a robed violet body bearing a cream bell. Returns false for other types. */
export function drawSiriusUnit(ctx: CanvasRenderingContext2D, e: Enemy, x: number, y: number, tick: number) {
  if (e.type !== 'zealot' && e.type !== 'bellringer' && e.type !== 'mason' && e.type !== 'penitent') return false;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.shadowBlur = 0;
  if (e.flashTicks > 0) ctx.filter = 'brightness(1.8)';
  const act = e.siriusAct;
  if (e.type === 'zealot') {
    const dx = act ? act.dx : Math.sign((e.targetTileX ?? e.tileX) - e.tileX) || 1, dy = act ? act.dy : Math.sign((e.targetTileY ?? e.tileY) - e.tileY);
    const brace = act && !act.dashing ? 1 - act.ticks / SIRIUS.zealot.windup : 0, dash = !!act?.dashing;
    if (dash) for (let k = 3; k >= 1; k--) { ctx.globalAlpha = .16 * (4 - k); panel(ctx, -11 - dx * k * 12, -13 - dy * k * 12, 22, 26, '#f2e6c8'); }
    ctx.globalAlpha = 1;
    // Body: an upright ivory cuirass with a dark visor, red sash and a tall crimson plume.
    ctx.shadowColor = '#ff6a4d'; ctx.shadowBlur = 4;
    panel(ctx, -11, -12, 22, 26, '#f2e6c8'); ctx.shadowBlur = 0;
    panel(ctx, -8, -9, 16, 7, '#2a1a24'); panel(ctx, -6, -7, 12, 3, brace > .5 || dash ? '#ffffff' : '#ff6a4d'); // visor and its burning slit
    panel(ctx, -11, 2, 22, 4, '#c8332a'); // sash
    panel(ctx, -11, 10, 7, 5, '#b9a98a'); panel(ctx, 4, 10, 7, 5, '#b9a98a'); // greaves
    panel(ctx, -3, -22, 6, 10, '#c8332a'); panel(ctx, -1, -26, 6, 5, '#ff6a4d'); // plume
    // The spear turns as one solid shape toward its line; it draws back while bracing.
    ctx.save(); ctx.rotate(Math.atan2(dy, dx)); ctx.translate(-brace * 8, 0);
    panel(ctx, 4, -2, 26, 4, '#8a6a3a'); panel(ctx, 28, -4, 8, 8, '#ffd36b'); panel(ctx, 34, -2, 4, 4, '#ffffff');
    ctx.restore();
  } else if (e.type === 'penitent') {
    // A hunched ash-grey penitent in a black cowl with a pale bone mask and red-violet eyes, dragging a chain; it
    // stoops low, sniffing out your trail.
    const sway = Math.sin(tick * .15 + e.id) * 2;
    ctx.translate(sway, 0);
    ctx.shadowColor = '#b04a8a'; ctx.shadowBlur = 4; panel(ctx, -12, -14, 24, 30, '#5a5262'); ctx.shadowBlur = 0;
    panel(ctx, -14, -18, 28, 12, '#1a1420'); panel(ctx, -9, -12, 18, 12, '#d8cfc0'); // cowl and mask
    panel(ctx, -6, -8, 4, 3, '#ff5fa8'); panel(ctx, 2, -8, 4, 3, '#ff5fa8'); panel(ctx, -3, -3, 6, 2, '#8a8070');
    panel(ctx, -12, 4, 24, 3, '#3a3242'); panel(ctx, -12, 14, 8, 3, '#3a3242'); panel(ctx, 4, 14, 8, 3, '#3a3242');
    for (let k = 0; k < 4; k++) panel(ctx, 12 + k * 4 - sway, 8 + (k % 2) * 2, 3, 3, '#8a8494'); // the dragging chain
  } else if (e.type === 'mason') {
    // A squat stone builder: a slate block with gold eyes and stone fists; it hoists a gold-edged tablet overhead
    // while it raises a wall, and slams it down when the wall rises.
    const lift = act ? 1 - act.ticks / SIRIUS.mason.windup : 0, slam = e.shootTicks > 0;
    ctx.shadowColor = '#9a94ad'; ctx.shadowBlur = 4; panel(ctx, -17, -10, 34, 26, '#9a94ad'); ctx.shadowBlur = 0;
    panel(ctx, -14, -7, 28, 20, '#3c3848'); panel(ctx, -14, -7, 28, 4, '#6e6880');
    panel(ctx, -8, -1, 5, 4, '#ffe27a'); panel(ctx, 3, -1, 5, 4, '#ffe27a');
    panel(ctx, -21, 4 - lift * 14, 7, 8, '#7a7490'); panel(ctx, 14, 4 - lift * 14, 7, 8, '#7a7490'); // fists
    const ty = slam ? -14 : -18 - lift * 12;
    panel(ctx, -12, ty, 24, 8, '#b8b2c8'); panel(ctx, -12, ty, 24, 2, '#ffe27a'); panel(ctx, -2, ty + 3, 4, 3, '#ffe27a'); // tablet
    panel(ctx, -15, 16, 9, 4, '#6e6880'); panel(ctx, 6, 16, 9, 4, '#6e6880');
  } else {
    // A robed bell-bearer: a cream bell on a violet body; it lifts the bell before each ring.
    const lift = act ? 1 - act.ticks / SIRIUS.bellringer.windup : 0, ring = e.shootTicks > 0 ? Math.sin(tick * .8) * 3 : 0, bob = Math.round(Math.sin(tick * .05 + e.id));
    ctx.translate(0, bob);
    ctx.shadowColor = '#e9c98a'; ctx.shadowBlur = 4; panel(ctx, -15, -6, 30, 22, '#e9c98a'); ctx.shadowBlur = 0;
    panel(ctx, -12, -3, 24, 16, '#2e2442');
    panel(ctx, -8, 1, 4, 3, '#fff2c4'); panel(ctx, 4, 1, 4, 3, '#fff2c4');
    ctx.save(); ctx.translate(ring, -14 - lift * 8);
    panel(ctx, -9, -8, 18, 14, '#f6e3a8'); panel(ctx, -11, 4, 22, 4, '#c9a44a'); panel(ctx, -2, 7, 4, 4, '#fff6d8'); panel(ctx, -2, -12, 4, 4, '#c9a44a');
    ctx.restore();
    panel(ctx, -16, 14, 8, 4, '#a98a4a'); panel(ctx, 8, 14, 8, 4, '#a98a4a');
  }
  ctx.restore();
  return true;
}

/** How high your model floats under Halo: it rises over a quarter second, bobs, and settles as the halo fades. */
export function siriusFloatLift(state: Readonly<GameState>, tick: number) {
  const t = state.sirius; if (!t || t.halo <= 0) return 0;
  const rise = Math.min(1, (SIRIUS.haloTicks - t.halo) / 15), settle = Math.min(1, t.halo / 20), ease = (v: number) => v * v * (3 - 2 * v);
  return Math.round((16 + Math.sin(tick * .12) * 3) * ease(rise) * ease(settle));
}

/** Halo: your shadow stays on the floor and shrinks as you rise; a gold halo over a small crown hovers above you, with motes. */
export function drawSiriusHalo(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, x: number, y: number, lift: number, tick: number) {
  const t = state.sirius; if (!t || t.halo <= 0) return;
  const fade = Math.min(1, t.halo / 30), w = 30 - lift * .5;
  ctx.save(); ctx.shadowBlur = 0;
  ctx.globalAlpha = .4 * fade; panel(ctx, x - w / 2, y + 16, w, 6, '#000000');
  ctx.globalAlpha = .9 * fade; ctx.shadowColor = RUNE_GOLD; ctx.shadowBlur = 8;
  y -= lift; const hy = y - 34;
  panel(ctx, x - 14, hy, 28, 3, RUNE_GOLD); panel(ctx, x - 14, hy + 6, 28, 3, RUNE_GOLD); panel(ctx, x - 17, hy + 3, 3, 3, RUNE_GOLD); panel(ctx, x + 14, hy + 3, 3, 3, RUNE_GOLD);
  ctx.shadowBlur = 0;
  panel(ctx, x - 8, hy + 12, 16, 4, '#fff2c4'); for (const k of [-8, -2, 4]) panel(ctx, x + k, hy + 9, 4, 3, '#fff2c4');
  for (let i = 0; i < 4; i++) { const p = ((tick * .03 + i / 4) % 1); ctx.globalAlpha = (1 - p) * .7 * fade; panel(ctx, x - 18 + i * 11, y + 14 - p * 40, 3, 3, '#fff6d0'); }
  ctx.restore();
}

/** Full Holy Light: separated sanctuary edge bands and detached ivory/gold crests. */
/** Rich gold illumination belongs below the player shell, not in the final screen wash. */
export function drawSiriusBurstGlow(ctx:CanvasRenderingContext2D,state:Readonly<GameState>,w:number,h:number,x:number,y:number){
  const t=state.sirius;if(!t||t.burst<=0)return;
  const p=1-t.burst/SIRIUS_BURST_TICKS,fade=Math.pow(1-p,1.3),rise=Math.min(1,p*15);
  const gold=ctx.createRadialGradient(x,y,0,x,y,Math.hypot(w,h)*.65);
  gold.addColorStop(0,'rgba(239,164,12,.55)');gold.addColorStop(.12,'rgba(242,178,28,.43)');gold.addColorStop(.3,'rgba(243,194,73,.21)');gold.addColorStop(1,'rgba(255,224,150,0)');
  ctx.save();ctx.globalAlpha=fade*rise*rise*(3-2*rise);ctx.fillStyle=gold;ctx.fillRect(0,0,w,h);ctx.restore();
}

export function drawSiriusBurst(ctx: CanvasRenderingContext2D, state: Readonly<GameState>, w: number, h: number) {
  const t=state.sirius;if(!t||t.burst<=0)return;
  const p=1-t.burst/SIRIUS_BURST_TICKS,fade=Math.pow(1-p,1.3),open=1-(1-p)*(1-p);
  ctx.save();ctx.shadowBlur=0;
  if(p<.1){ctx.globalAlpha=(1-p/.1)*.6;panel(ctx,0,0,w,h,'#fff8de');}
  ctx.globalAlpha=fade*.14;panel(ctx,0,0,w,h,'#fff2b0');
  // Small flat feathers peel outward, rotating as whole block-built silhouettes.
  for(let i=0;i<26;i++){
    const angle=i*2.39996,travel=18+Math.min(w,h)*(.22+i%5*.045)*open;
    const fx=w/2+Math.cos(angle)*travel,fy=h/2+Math.sin(angle)*travel;
    ctx.save();ctx.translate(fx,fy);ctx.rotate(angle+Math.PI/2+p*(i%2?1:-1)*.7);ctx.scale(.7+i%3*.13,.7+i%3*.13);
    ctx.globalAlpha=fade*(.14+i%3*.035);ctx.fillStyle=i%3?'#fff2c5':'#eac565';
    for(const [row,width]of [4,8,12,10,7,4].entries())ctx.fillRect(-width/2,-9+row*3,width,2);
    ctx.globalAlpha=fade*.24;panel(ctx,-.5,-10,1,20,'#fff9df');ctx.restore();
  }
  for(let side=0;side<4;side++){
    ctx.save();ctx.translate(w/2,h/2);ctx.rotate(side*Math.PI/2);
    const vertical=side%2===0,span=(vertical?w:h)*.42,edge=(vertical?h:w)/2-12-open*10;
    ctx.globalAlpha=fade*.13;panel(ctx,-span/2-8,-edge-6,span+16,28,RUNE_GOLD);
    ctx.globalAlpha=fade*.7;panel(ctx,-span/2,-edge,span,10,RUNE_GOLD);
    ctx.globalAlpha=fade*.85;panel(ctx,-span*.4,-edge+1,span*.8,4,'#fff8de');
    ctx.globalAlpha=fade*.45;panel(ctx,-span/2,-edge+9,span*.27,2,'#e8c45c');panel(ctx,span*.23,-edge+9,span*.27,2,'#e8c45c');
    ctx.restore();
  }
  for(const dx of [-1,1])for(const dy of [-1,1]){
    ctx.save();ctx.translate(dx<0?22:w-22,dy<0?22:h-22);ctx.scale(-dx,-dy);
    const arm=42+open*32;ctx.globalAlpha=fade*.65;
    panel(ctx,0,0,arm,7,RUNE_GOLD);panel(ctx,0,0,7,arm,RUNE_GOLD);
    ctx.globalAlpha=fade*.85;panel(ctx,1,1,8,2,'#fff8de');panel(ctx,1,1,2,8,'#fff8de');ctx.restore();
  }
  ctx.restore();
}
