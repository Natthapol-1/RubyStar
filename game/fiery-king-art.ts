/** The Fiery King's armor, face and flames, shared by combat and cinematics. */
export function drawFieryKingModel(
  ctx: CanvasRenderingContext2D, sx: number, sy: number, bSz: number, tickN: number,
  attacking = false, bFlash = false, statue = false,
) {
  const bH = bSz / 2;
  const bPad = Math.max(3, Math.floor(bSz * 0.10));
  const pulse = 0.7 + 0.3 * Math.abs(Math.sin(tickN * 0.06));
  const bodyColor = bFlash ? '#ffffff' : '#cc0022';

  // Outer crimson glow
  ctx.shadowColor = '#ff0033'; ctx.shadowBlur = statue ? 0 : Math.floor(6 * pulse);

  // Shoulder spikes (left and right) - they extend further during attack
  const spikeW = Math.max(4, Math.floor(bSz * 0.18));
  const spikeH = Math.max(6, Math.floor(bSz * (attacking ? 0.50 : 0.30)));
  ctx.fillStyle = bFlash ? '#ffffff' : '#880011';
  ctx.fillRect(sx - bH - spikeW, sy - Math.floor(spikeH * 0.6), spikeW, spikeH); // left spike
  ctx.fillRect(sx + bH, sy - Math.floor(spikeH * 0.6), spikeW, spikeH); // right spike
  // Spike tips (gold)
  ctx.fillStyle = bFlash ? '#ffffff' : '#ffcc00';
  ctx.fillRect(sx - bH - spikeW - 2, sy - Math.floor(spikeH * 0.6), 3, 3);
  ctx.fillRect(sx + bH + spikeW, sy - Math.floor(spikeH * 0.6), 3, 3);

  // Main body
  ctx.fillStyle = bodyColor;
  ctx.fillRect(sx - bH, sy - bH, bSz, bSz);
  ctx.shadowBlur = 0;

  // Inner armor plate (dark inset)
  if (!bFlash) {
    ctx.fillStyle = '#4d0d1a';
    ctx.fillRect(sx - bH + bPad, sy - bH + bPad, bSz - bPad * 2, bSz - bPad * 2);
    // Gold cross/X armor detail
    ctx.fillStyle = '#ffcc0044';
    const cx = bSz - bPad * 2, gH = Math.max(1, Math.floor(bSz * 0.07));
    ctx.fillRect(sx - bH + bPad, sy - Math.floor(gH / 2), cx, gH); // horizontal bar
    ctx.fillRect(sx - Math.floor(gH / 2), sy - bH + bPad, gH, cx); // vertical bar

    // Corner rivet studs — small gold rivets bolting the armor plate, one per corner
    const rivetSz = Math.max(2, Math.floor(bSz * 0.07));
    const rivetInset = bPad + Math.floor(rivetSz * 0.8);
    ctx.fillStyle = '#ffcc00cc';
    for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as [number, number][]) {
      ctx.fillRect(sx + ox * (bH - rivetInset) - rivetSz / 2, sy + oy * (bH - rivetInset) - rivetSz / 2, rivetSz, rivetSz);
    }
  }

  // Crown (5 spikes on top)
  if (!bFlash) {
    ctx.fillStyle = '#ffcc00';
    ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = statue ? 0 : 4;
    const crownW = bSz;
    const crownX = sx - bH;
    const crownBase = sy - bH;
    const crownH = Math.max(5, Math.floor(bSz * (attacking ? 0.35 : 0.22)));
    // 5 alternating-height spikes: tall, short, tall, short, tall
    const spW = Math.floor(crownW / 5);
    const heights = [crownH, Math.floor(crownH * 0.55), crownH, Math.floor(crownH * 0.55), crownH];
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(crownX + i * spW, crownBase - heights[i], spW - 1, heights[i]);
    }
    ctx.shadowBlur = 0;

    // Twinkling ruby gem set into the center spike tip — a "living jewel" like the Queen's
    const gemTwinkle = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.09));
    ctx.shadowColor = '#ff0033'; ctx.shadowBlur = statue ? 0 : Math.floor(4 * gemTwinkle);
    ctx.fillStyle = `rgba(255,51,102,${gemTwinkle})`;
    ctx.fillRect(sx - 2, crownBase - heights[2] - 3, 4, 4);
    ctx.shadowBlur = 0;
  }

  // 4 eyes (2 rows of 2)
  if (!bFlash) {
    const eSz = Math.max(3, Math.floor(bSz * 0.16));
    const pSz = Math.max(2, Math.floor(eSz * 0.6));
    const ex1 = sx - bH + bPad + 2;
    const ex2 = sx + bH - bPad - eSz - 2;
    const ey1 = sy - bH + bPad + 2;
    const ey2 = ey1 + eSz + 3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ex1, ey1, eSz, eSz); ctx.fillRect(ex2, ey1, eSz, eSz);
    ctx.fillRect(ex1, ey2, eSz, eSz); ctx.fillRect(ex2, ey2, eSz, eSz);
    // Eyes glow yellow when attacking
    ctx.fillStyle = attacking ? '#ffcc00' : '#ff0000';
    ctx.shadowColor = attacking ? '#ffcc00' : '#ff0000'; ctx.shadowBlur = statue ? 0 : attacking ? 6 : 3;
    ctx.fillRect(ex1 + 1, ey1 + 1, pSz, pSz); ctx.fillRect(ex2 + 1, ey1 + 1, pSz, pSz);
    ctx.fillRect(ex1 + 1, ey2 + 1, pSz, pSz); ctx.fillRect(ex2 + 1, ey2 + 1, pSz, pSz);
    ctx.shadowBlur = 0;

    // Wide jagged mouth with teeth
    const mW = Math.max(8, Math.floor(bSz * 0.70));
    const mH = Math.max(2, Math.floor(bSz * (attacking ? 0.18 : 0.10)));
    const mX = sx - Math.floor(mW / 2);
    const mY = ey2 + eSz + 3 + (attacking ? 4 : 0); // Drop jaw slightly when attacking
    const toothW = Math.max(2, Math.floor(mW / 6));
    ctx.fillStyle = '#cc0000';
    ctx.fillRect(mX, mY, mW, mH);
    ctx.fillStyle = '#ffffff';
    for (let t = 0; t < 5; t++) {
      ctx.fillRect(mX + toothW * t + 1, mY - mH, Math.max(1, toothW - 2), mH + 1);
    }
  }

  // Three compact pixel flames decorate the lower armor without changing his silhouette.
  if (!bFlash) {
    const flameBase = sy + bH - bPad - 4;
    const flameWidth = Math.max(7, Math.floor(bSz * .13));
    for (let i = 0; i < 3; i++) {
      const fx = sx + Math.round((i - 1) * bSz * .23);
      const height = Math.max(8, Math.floor(bSz * (i === 1 ? .20 : .14)) + Math.round(Math.sin(tickN * .08 + i) * 1));
      const lean = i === 1 ? 1 : -1;
      ctx.shadowBlur = 0; ctx.fillStyle = '#b92d0b';
      ctx.fillRect(fx - Math.floor(flameWidth / 2), flameBase - 4, flameWidth, 4);
      ctx.fillRect(fx - Math.floor(flameWidth / 2) - 1, flameBase - 8, flameWidth + 2, 4);
      ctx.fillRect(fx - Math.floor(flameWidth / 2) + 1, flameBase - height + 2, flameWidth - 2, Math.max(2, height - 7));
      ctx.fillRect(fx + lean * 2 - 1, flameBase - height - 2, 3, 5);
      ctx.fillStyle = '#ed6414'; ctx.fillRect(fx - 2, flameBase - 5, 4, 5);
      ctx.fillRect(fx - 1, flameBase - 8, 2, 4);
    }
  }

  if (statue) return;

  const groundPulse = 0.6 + 0.4 * Math.abs(Math.sin(tickN * 0.08));
  ctx.shadowColor = '#ff4400'; ctx.shadowBlur = Math.floor(20 * groundPulse);
  ctx.fillStyle = `rgba(255,68,0,${0.25 * groundPulse})`;
  ctx.fillRect(sx - bH - 6, sy + bH - 4, bSz + 12, 10);
  ctx.shadowBlur = 0;

  // Orange fiery aura — a guttering flame-outline around his whole body, jittering in size/
  // brightness like unstable heat haze rather than the Queen's smooth magic-breathing pulse
  const auraFlicker = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.5) * Math.sin(tickN * 0.23 + 1));
  const fAuraR = bH + 8 + Math.floor(6 * auraFlicker);
  ctx.shadowColor = '#ff6600'; ctx.shadowBlur = Math.floor(14 * auraFlicker);
  ctx.strokeStyle = `rgba(255,${120 + Math.floor(60 * auraFlicker)},0,${0.2 + 0.15 * auraFlicker})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(sx - fAuraR, sy - fAuraR, fAuraR * 2, fAuraR * 2);
  ctx.shadowBlur = 0;

  // Rising embers — sparks kicking off his body and drifting upward, flickering out like real
  // cinders off a flame (not orbiting him — fire doesn't circle, it rises and dies)
  const emberCount = 14;
  for (let m = 0; m < emberCount; m++) {
    const cycle = 60 + (m % 3) * 15; // varied lifespans so they don't pulse in lockstep
    const phase = (tickN + m * (cycle / emberCount) * 5.3) % cycle;
    const riseT = phase / cycle; // 0 (spawn, at his base) -> 1 (fully risen, faded out)
    const jitterX = Math.sin(tickN * 0.22 + m * 2.1) * (bH * 0.7);
    const ex = sx + (m % 2 ? 1 : -1) * (bH + 4 + m % 3 * 3) + jitterX * riseT * .15;
    const ey = sy + bH - riseT * (bSz + 22);
    const emberSz = Math.max(1, 4 - Math.floor(riseT * 2.5));
    const emberAlpha = Math.sin(riseT * Math.PI); // fades in, peaks mid-rise, fades out
    ctx.globalAlpha = emberAlpha;
    ctx.shadowColor = '#ff4400'; ctx.shadowBlur = 10;
    ctx.fillStyle = riseT < 0.4 ? '#ffee00' : riseT < 0.7 ? '#ff8800' : '#ff3300';
    ctx.fillRect(ex - emberSz / 2, ey - emberSz / 2, emberSz, emberSz);
  }
  // Extra cinders travel up the sides, adding fire without obscuring his eyes and mouth.
  for (let i = 0; i < 6; i++) {
    const life = ((tickN + i * 17) % 95) / 95;
    const side = i % 2 ? 1 : -1;
    const px = sx + side * (bH + 7 + i % 3 * 4);
    const py = sy + bH - life * (bSz + 16);
    ctx.globalAlpha = Math.sin(life * Math.PI) * .75;
    ctx.shadowColor = '#ff6600'; ctx.shadowBlur = 5;
    ctx.fillStyle = life < .45 ? '#ffbd35' : '#e84d16';
    ctx.fillRect(Math.round(px), Math.round(py / 2) * 2, 2 + i % 2, 2 + i % 2);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Flickering flame licks — shoulder spike tips (bigger/brighter) plus the crown peak,
  // an actual guttering-fire flicker rather than a steady glow
  const flicker1 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.45));
  const flicker2 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.45 + 1.3));
  const flicker3 = 0.5 + 0.5 * Math.abs(Math.sin(tickN * 0.5 + 2.4));
  ctx.shadowColor = '#ff6600';
  ctx.shadowBlur = Math.floor(16 * flicker1);
  ctx.fillStyle = `rgba(255,${140 + Math.floor(90 * flicker1)},0,${0.75 + 0.25 * flicker1})`;
  ctx.fillRect(sx - bH - spikeW - 2, sy - Math.floor(spikeH * 0.6) - 5, 7, 6);
  ctx.shadowBlur = Math.floor(16 * flicker2);
  ctx.fillStyle = `rgba(255,${140 + Math.floor(90 * flicker2)},0,${0.75 + 0.25 * flicker2})`;
  ctx.fillRect(sx + bH + spikeW - 3, sy - Math.floor(spikeH * 0.6) - 5, 7, 6);
  ctx.shadowBlur = Math.floor(14 * flicker3);
  ctx.fillStyle = `rgba(255,${150 + Math.floor(80 * flicker3)},0,${0.7 + 0.3 * flicker3})`;
  ctx.fillRect(sx - 3, sy - bH - Math.floor(bSz * 0.30) - 6, 6, 6);
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}
