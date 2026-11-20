'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import BlessingGem from './BlessingGem';
import CutscenePlayer from './CutscenePlayer';
import { drawSunArrivalFrame, SUN_ARRIVAL_DURATION } from './sun-arrival';
import type { CutsceneFrame } from './cutscene-art';
import { bindings } from './controls';
import { gameAudio } from './audio-settings';
import { challengeCleared, getProfile, isDesktop, updateProfile } from './profile';
import { drawSunExplore } from './sun-explore-art';
import { startSunExploreAudio } from './sun-explore-audio';
import { AREAS, COOLING_SCENE, SITES, START, TAVI_HOME, WORLD_HEIGHT, WORLD_SCALE, WORLD_WIDTH, contains, isDocument, nextSunTile, sunMinimapPaths, type Point, type Site, type SiteId } from './sun-explore-map';
import {
  BYPASS_KNOWN, CONFIRMED, COOLING, DISMISSED, INITIAL_PROGRESS, TESTED,
  normalizeSunProgress, sunStory, type SunExploreProgress, type Topic,
} from './sun-explore-story';
import { playUiSfx } from './ui-sfx';
import styles from './sun-explore.module.css';

const STORAGE_KEY = 'rubyStar.sunExplore.v1';
const INTERACT_DISTANCE = 57;
const STEP_SECONDS = .145;
const drawArrival: CutsceneFrame = (ctx, time, cue) => drawSunArrivalFrame(ctx, time, cue, false);
type OpenStory = { id: SiteId; topic: Topic; page: number };
const playerActions = ['moveUp', 'moveDown', 'moveLeft', 'moveRight'] as const;
const directions = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];

function loadProgress() {
  if (isDesktop()) return normalizeSunProgress(getProfile().sunExplore);
  try { return normalizeSunProgress(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')); }
  catch { return INITIAL_PROGRESS; }
}

function saveProgress(progress: SunExploreProgress) {
  if (isDesktop()) updateProfile(profile => { profile.sunExplore = progress; });
  else {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch {}
  }
}

export default function SunExplore() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [opened, setOpened] = useState<OpenStory | null>(null);
  const [area, setArea] = useState<(typeof AREAS)[number]['name']>('Sunbridge');
  const [near, setNear] = useState<Site>();
  const [audioActive, setAudioActive] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const mapMarker = useRef<SVGCircleElement>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const player = useRef({ ...START });
  const facing = useRef({ x: 0, y: 1 });
  const exploreAudio = useRef<ReturnType<typeof startSunExploreAudio>>(null);
  const moving = useRef<{ from: Point; to: Point; age: number } | null>(null);
  const queued = useRef<Point | null>(null);
  const nearest = useRef<Site | undefined>(undefined);
  const currentArea = useRef<(typeof AREAS)[number]['name']>('Sunbridge');
  const press = useRef(new Set<string>());

  const back = useCallback(() => {
    playUiSfx('back');
    router.push('/challenge' + window.location.search);
  }, [router]);
  const finishArrival = useCallback(() => setArrived(true), []);
  useEffect(() => {
    if (!challengeCleared('fiery_king')) {
      router.replace('/challenge' + window.location.search);
      return;
    }
    setProgress(loadProgress());
    setReady(true);
  }, [router]);

  const sites = useMemo<Site[]>(() => SITES.map(site => site.id === 'tavi' && progress.taviHome
    ? { ...site, ...TAVI_HOME }
    : site), [progress.taviHome]);
  const minimapPaths = useMemo(sunMinimapPaths, []);

  const openStory = useCallback((id: SiteId, topic: Topic = 'main') => {
    press.current.clear();
    queued.current = null;
    if (moving.current) player.current = moving.current.to;
    moving.current = null;
    setAudioActive(true);
    setOpened({ id, topic, page: 0 });
    if (topic === 'main') {
      const site = SITES.find(entry => entry.id === id);
      playUiSfx(site?.kind === 'person' || site?.kind === 'king' ? 'page' : 'confirm');
    } else if (topic === 'ring') {
      const bell = gameAudio('/sounds/sirius-bell.mp3', 'effects');
      bell.volume = .53;
      void bell.play().catch(() => {});
    } else if (topic === 'cool') {
      playUiSfx('confirm');
      player.current = { ...COOLING_SCENE };
    } else if (topic === 'test') playUiSfx('stationCharge');
    else playUiSfx('confirm');
  }, []);

  const story = opened && sunStory(opened.id, opened.topic, progress);
  const last = !!(opened && story && opened.page === story.lines.length - 1);
  const actionScene = opened?.topic === 'test' || opened?.topic === 'cool' || opened?.topic === 'ring';
  const coolingBegins = opened?.topic === 'cool' && opened.page >= 8;
  const quiet = progress.stage >= COOLING || coolingBegins;
  const sceneEffect = coolingBegins ? 'cool' : opened?.topic === 'test' || opened?.topic === 'ring' ? opened.topic : undefined;

  useEffect(() => { if (coolingBegins) playUiSfx('sunExtinguish'); }, [coolingBegins]);

  const commit = () => {
    if (!opened) return;
    const { id, topic } = opened;
    let stage = progress.stage;
    if ((id === 'blueprint' || topic === 'bypass') && stage < BYPASS_KNOWN) stage = BYPASS_KNOWN;
    if (topic === 'test' && stage === BYPASS_KNOWN) stage = TESTED;
    if (['lyra', 'tap', 'tube'].includes(id) && stage === TESTED) stage = CONFIRMED;
    if (topic === 'cool' && stage === CONFIRMED) stage = COOLING;
    if (topic === 'ring' && stage === COOLING) stage = DISMISSED;
    const updated = {
      stage,
      readGlove: progress.readGlove || id === 'glove',
      taviHome: progress.taviHome || (stage >= COOLING && id === 'tavi' && topic === 'main'),
    };
    if (Object.keys(updated).some(key => updated[key as keyof SunExploreProgress] !== progress[key as keyof SunExploreProgress])) {
      setProgress(updated);
      saveProgress(updated);
    }
  };

  const advance = () => {
    if (!opened) return;
    if (!last) {
      playUiSfx('confirm');
      setOpened({ ...opened, page: opened.page + 1 });
      return;
    }
    commit();
    playUiSfx('close');
    setOpened(null);
  };

  const dialogOpen = opened !== null;
  useEffect(() => {
    const dialog = modal.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) {
      dialog.close();
      canvas.current?.focus();
    }
  }, [dialogOpen]);
  useEffect(() => { if (opened) next.current?.focus(); }, [opened]);

  useEffect(() => {
    if (!ready || !audioActive) return;
    exploreAudio.current = startSunExploreAudio();
    return () => {
      exploreAudio.current?.stop();
      exploreAudio.current = null;
    };
  }, [ready, audioActive]);

  useEffect(() => {
    const refresh = () => exploreAudio.current?.update(player.current, quiet, !document.hidden);
    refresh();
    const timer = window.setInterval(refresh, 100);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [audioActive, quiet, ready]);

  useEffect(() => {
    if (!ready || !arrived) return;
    const keymap = bindings();
    const keyDown = (event: KeyboardEvent) => {
      if (dialogOpen || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.code === 'Escape') { event.preventDefault(); back(); return; }
      const action = playerActions.findIndex(action => keymap[action].includes(event.code));
      if (action >= 0) {
        event.preventDefault();
        press.current.add(event.code);
        if (!event.repeat) queued.current = directions[action];
        setAudioActive(true);
      }
      if (event.code === 'KeyE' && !event.repeat && nearest.current) {
        event.preventDefault();
        openStory(nearest.current.id);
      }
    };
    const keyUp = (event: KeyboardEvent) => press.current.delete(event.code);
    const blur = () => { press.current.clear(); queued.current = null; };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', blur);
    };
  }, [arrived, back, dialogOpen, openStory, ready]);

  useEffect(() => {
    const surface = canvas.current;
    const ctx = surface?.getContext('2d');
    if (!ready || !arrived || !ctx || !surface) return;
    void document.fonts.load('12px "Press Start 2P"').catch(() => {});
    const keymap = bindings();
    let width = 0, height = 0;
    const resize = () => {
      width = Math.max(1, surface.clientWidth);
      height = Math.max(1, surface.clientHeight);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    resize();
    let frame: number;
    let previous = performance.now();
    const draw = (time: number) => {
      const dt = Math.max(0, Math.min(.04, (time - previous) / 1000));
      previous = time;
      const p = player.current;
      let landed = false;
      if (!dialogOpen) {
        if (!moving.current) {
          const lastHeld = [...press.current].pop();
          const action = playerActions.findIndex(action => lastHeld && keymap[action].includes(lastHeld));
          const direction = queued.current ?? directions[action];
          queued.current = null;
          if (direction) {
            facing.current = direction;
            const to = nextSunTile(p, direction);
            if (to) moving.current = { from: { ...p }, to, age: 0 };
          }
        }
        const step = moving.current;
        if (step) {
          step.age += dt;
          const t = Math.min(1, step.age / STEP_SECONDS);
          p.x = step.from.x + (step.to.x - step.from.x) * t;
          p.y = step.from.y + (step.to.y - step.from.y) * t;
          if (t === 1) {
            moving.current = null;
            landed = true;
          }
        }
      }
      let closest: Site | undefined;
      let best = INTERACT_DISTANCE;
      for (const site of sites) {
        const distance = Math.hypot(site.x * WORLD_SCALE - p.x, site.y * WORLD_SCALE - p.y);
        if (distance < best) { closest = site; best = distance; }
      }
      if (nearest.current !== closest) {
        nearest.current = closest;
        setNear(closest);
      }
      const zone = AREAS.find(r => contains(r, p.x / WORLD_SCALE, p.y / WORLD_SCALE));
      if (landed && !document.hidden) exploreAudio.current?.step(zone?.surface ?? 'catwalk');
      if (zone && zone.name !== currentArea.current) {
        currentArea.current = zone.name;
        setArea(zone.name);
      }
      mapMarker.current?.setAttribute('cx', String(p.x / WORLD_SCALE));
      mapMarker.current?.setAttribute('cy', String(p.y / WORLD_SCALE));
      drawSunExplore(ctx, p, facing.current, sites, closest, progress, time * .06, width, height, sceneEffect);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [arrived, dialogOpen, progress, ready, sceneEffect, sites]);

  if (!ready) return <main className={styles.loading} />;
  if (!arrived) return <CutscenePlayer label="Arrival at the Sun" duration={SUN_ARRIVAL_DURATION}
    drawFrame={drawArrival} fill onDone={finishArrival} />;

  const openedSite = opened && SITES.find(site => site.id === opened.id);
  const reading = !!openedSite && isDocument(openedSite);

  return (
    <main className={'ruby-star-ui ' + styles.page}>
      <header className={styles.header}>
        <div><p>THE SUN</p><h1>The Last Shift</h1></div>
        <button type="button" onClick={back}>Star map</button>
      </header>
      <div className={styles.map}>
        <canvas ref={canvas} tabIndex={0}
          aria-label="Sun exploration map" onClick={() => canvas.current?.focus()} />
      </div>
      <aside className={styles.minimap} aria-label="Station overview">
        <svg viewBox={`0 0 ${WORLD_WIDTH / WORLD_SCALE} ${WORLD_HEIGHT / WORLD_SCALE}`} aria-hidden="true">
          <path d={minimapPaths[0]} fill="#8b5847" />
          {AREAS.map((r, i) => <path key={r.name} d={minimapPaths[i + 1]} fill={r.color}
            fillOpacity={r.name === area ? .66 : .32} />)}
          <circle ref={mapMarker} cx={START.x / WORLD_SCALE} cy={START.y / WORLD_SCALE} r={34} fill="#fff3c2" />
        </svg>
      </aside>
      {near && <button className={styles.interact} type="button" onClick={() => openStory(near.id)}>
        <kbd>E</kbd> {isDocument(near) ? 'Read ' : ''}{near.name}
      </button>}
      <dialog ref={modal} className={styles.dialog + (reading ? ' ' + styles.document : '')} aria-labelledby="sun-story-title"
        onCancel={event => {
          event.preventDefault();
          if (actionScene) return;
          if (last) commit();
          playUiSfx('close');
          setOpened(null);
        }}>
        {opened && story && (
          <>
            <div className={styles.dialogHeader}>
              <h2 id="sun-story-title">{opened.topic === 'cool' ? 'North Reservoir' : openedSite?.name}</h2>
              <span>{opened.page + 1} / {story.lines.length}</span>
            </div>
            <p key={opened.id + opened.topic + opened.page} aria-live="polite">{story.lines[opened.page]}</p>
            <div className={styles.choices}>
              {last && story.choices?.map(choice => (
                <button type="button" key={choice.topic} onClick={() => {
                  commit();
                  openStory(opened.id, choice.topic);
                }}>
                  {choice.topic === 'test' && <span className={styles.gem}><BlessingGem kind="fiery_king" /></span>}
                  {choice.label}
                </button>
              ))}
              <button type="button" ref={next} onClick={advance}>{last ? 'Close' : 'Continue'}</button>
            </div>
          </>
        )}
      </dialog>
    </main>
  );
}
