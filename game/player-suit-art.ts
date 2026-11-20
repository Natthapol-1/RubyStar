/** Shared suit shell and facing visor for combat and exploration. */
export function drawSuitShell(ctx: CanvasRenderingContext2D, sx: number, sy: number, sz: number, suitColor: string, suitDark: string, glowColor: string, glow: number) {
  const h = Math.floor(sz / 2);
  ctx.shadowColor=glowColor;ctx.shadowBlur=glow;

  ctx.fillStyle = suitColor;
  ctx.fillRect(sx - h, sy - h, sz, sz);
  ctx.shadowBlur = 0;

  // ── Inner suit detail — slightly darker inset panel ───────────────────
  const pad = Math.max(2, Math.floor(sz * 0.12));
  ctx.fillStyle = suitDark;
  ctx.fillRect(sx - h + pad, sy - h + pad, sz - pad * 2, sz - pad * 2);
}

export function drawSuitHelmet(ctx: CanvasRenderingContext2D, sx: number, sy: number, sz: number, dx: number, dy: number, suitColor: string, visorColor: string, glowColor: string) {
  const h = Math.floor(sz / 2);
  const pad = Math.max(2, Math.floor(sz * 0.12));
  const vw = Math.floor(sz * 0.56); // visor width
  const vh = Math.floor(sz * 0.30); // visor height
  let vx = sx - vw / 2, vy = sy - vh / 2;

  if (dx === 1) { vx = sx + h - pad - Math.floor(vh * 0.1) - vh; vy = sy - vw / 2; }
  else if (dx === -1) { vx = sx - h + pad + Math.floor(vh * 0.1); vy = sy - vw / 2; }
  else if (dy === -1) { vx = sx - vw / 2; vy = sy - h + pad + Math.floor(vh * 0.1); }
  else { vx = sx - vw / 2; vy = sy + h - pad - Math.floor(vh * 0.1) - vh; }

  const vwFinal = (dx !== 0) ? vh : vw;
  const vhFinal = (dx !== 0) ? vw : vh;

  ctx.shadowColor=visorColor;ctx.shadowBlur=10;ctx.fillStyle=visorColor+'cc';
  ctx.fillRect(vx,vy,vwFinal,vhFinal);
  ctx.fillStyle='#ffffff55';ctx.fillRect(vx+1,vy+1,Math.floor(vwFinal*.4),Math.floor(vhFinal*.4));ctx.shadowBlur=0;

  const antH = Math.max(3, Math.floor(sz * 0.22));
  ctx.fillStyle = suitColor;
  ctx.fillRect(sx - 1, sy - h - antH, 2, antH);
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - 2, sy - h - antH - 2, 4, 4);
  ctx.shadowBlur = 0;
}
