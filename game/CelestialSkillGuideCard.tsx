'use client';
import {bindingLabel} from './controls';

import { useEffect, useRef } from 'react';

export type CelestialGuidePainter = (ctx: CanvasRenderingContext2D, age: number, tick: number) => void;

export default function CelestialSkillGuideCard({ name, description, color, draw, duration = 1800 }: {
  name: string; description: string; color: string; draw: CelestialGuidePainter; duration?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0, start: number | null = null;
    const frame = (now: number) => {
      if (start === null) start = now;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.save(); ctx.clearRect(0, 0, 200, 120);
        ctx.fillStyle = '#0b1020'; ctx.fillRect(0, 0, 200, 120);
        const elapsed = now - start, age = (elapsed % (duration + 600)) / duration;
        if (age < 1) draw(ctx, age, elapsed * .06);
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [draw, duration]);
  return <article className="rs-nep-card" style={{ borderColor: color + '66' }}>
    <canvas ref={canvasRef} width={200} height={120} aria-hidden="true" />
    <h5 style={{ color }}>CELESTIAL SKILL ({bindingLabel('celestial')})</h5>
    <p>{name}: {description}</p>
  </article>;
}
