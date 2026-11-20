'use client';

import { useCallback, useEffect, useRef } from 'react';
import { gameAudio } from './audio-settings';
import { playUiSfx } from './ui-sfx';
import { H, W, type CutsceneFrame, type CutsceneCue } from './cutscene-art';

export default function CutscenePlayer({ label, duration, drawFrame, onDone, fill = false }: {
  label: string;
  duration: number;
  drawFrame: CutsceneFrame;
  onDone: () => void;
  fill?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const done = useRef(false);
  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    onDone();
  }, [onDone]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) { finish(); return; }
    const key = (e: KeyboardEvent) => {
      if ((e.key === 'Escape' || e.key === 'Enter') && !e.altKey && !e.repeat) {
        e.preventDefault();
        playUiSfx('close');
        finish();
      }
    };
    window.addEventListener('keydown', key);
    void document.fonts.load('16px "Press Start 2P"').catch(() => {});
    const played = new Map<string, HTMLAudioElement>();
    const sfx: CutsceneCue = (id, at, t, src, vol, rate = 1) => {
      if (t < at || played.has(id)) return;
      try {
        const sound = gameAudio(src, 'effects');
        played.set(id, sound);
        sound.volume = Math.min(1, sound.volume * vol);
        sound.playbackRate = rate;
        sound.play().catch(() => {});
      } catch {}
    };
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const t = (now - start) / 1000;
      if (done.current) return;
      if (t >= duration) { finish(); return; }
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.round(canvas.clientWidth * dpr), height = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
      const sc = fill ? Math.max(width / W, height / H) : Math.min(width / W, height / H);
      ctx.setTransform(sc, 0, 0, sc, (width - W * sc) / 2, (height - H * sc) / 2);
      ctx.imageSmoothingEnabled = false;
      const shake = drawFrame(ctx, t, sfx);
      canvas.style.transform = shake > 0 ? `translate(${Math.round((Math.random() - .5) * shake)}px, ${Math.round((Math.random() - .5) * shake)}px)` : '';
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', key);
      for (const sound of played.values()) sound.pause();
    };
  }, [duration, drawFrame, fill, finish]);

  return <div role="dialog" aria-modal="true" aria-label={label} style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#000', overflow: 'hidden' }}>
    <canvas ref={ref} aria-hidden="true" style={{ width: '100%', height: '100%', display: 'block' }} />
    <button type="button" autoFocus onClick={() => { playUiSfx('close'); finish(); }}
      style={{ position: 'absolute', right: 28, bottom: 24, padding: '10px 16px', background: '#10192be8', border: '1px solid #778cae', color: '#c7ddec', fontFamily: 'var(--font-pixel)', fontSize: 12, cursor: 'pointer', boxShadow: 'inset 0 0 0 3px #18263a' }}>SKIP ▸</button>
  </div>;
}
