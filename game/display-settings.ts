'use client';
import { getProfile, isDesktop, updateProfile, type DisplayPreferences } from './profile';

// Comfort settings: how much the screen shakes, whether full-screen flashes are toned down, and whether the
// photosensitivity notice has been acknowledged. Desktop keeps them in the profile; the web build in localStorage.
export type ShakeLevel = DisplayPreferences['shake'];
const DEFAULTS: DisplayPreferences = { shake: 'full', reduceFlashing: false };
const KEY = 'rubyStar.display.v1', NOTICE_KEY = 'rubyStar.photosensitivity.v1';
const SHAKE_SCALE: Record<ShakeLevel, number> = { off: 0, low: .4, full: 1 };
/** How strongly reduced flashing draws full-screen flash effects. */
export const REDUCED_FLASH_ALPHA = .35;

let web: DisplayPreferences | null = null;
function readWeb(): DisplayPreferences {
  if (web) return web;
  web = { ...DEFAULTS };
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (data && (data.shake === 'off' || data.shake === 'low' || data.shake === 'full')) web.shake = data.shake;
    if (data && typeof data.reduceFlashing === 'boolean') web.reduceFlashing = data.reduceFlashing;
  } catch {}
  return web;
}
export function displaySettings(): DisplayPreferences {
  if (typeof window === 'undefined') return DEFAULTS;
  return isDesktop() ? { ...DEFAULTS, ...getProfile().display } : readWeb();
}
export function setDisplaySetting(change: Partial<DisplayPreferences>) {
  const next = { ...displaySettings(), ...change };
  if (isDesktop()) updateProfile(p => { p.display = next; });
  else { web = next; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {} }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('ruby-display'));
}
/** Multiplier for screen shake strength (0 turns it off). */
export const shakeScale = () => SHAKE_SCALE[displaySettings().shake];
export const reduceFlashing = () => displaySettings().reduceFlashing;

export function photosensitivitySeen() {
  if (typeof window === 'undefined') return true;
  if (isDesktop()) return !!getProfile().photosensitivitySeen;
  try { return localStorage.getItem(NOTICE_KEY) === '1'; } catch { return true; }
}
export function markPhotosensitivitySeen() {
  if (isDesktop()) updateProfile(p => { p.photosensitivitySeen = true; });
  else { try { localStorage.setItem(NOTICE_KEY, '1'); } catch {} }
}
