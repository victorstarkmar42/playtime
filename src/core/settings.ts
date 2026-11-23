import { readJSON, writeJSON } from './storage';
import { TIME_LIMITS, type Age, type LangMode, type Mode } from './types';

export interface Settings {
  onboarded: boolean;
  age: Age;
  mode: Mode;
  lang: LangMode;
  voice: boolean;
  /** Invisible touch area around each dot, in millimetres. */
  tolMm: number;
  /** Seconds of inactivity before the next dot glows; 0 = never. */
  hintDelay: number;
  /** Keep colouring inside the character outline. */
  inside: boolean;
  /** Ignore fingers entirely while colouring (palm rejection). */
  penOnly: boolean;
  reduced: boolean;
  /** Minutes of play before the calm "time to rest" screen; 0 = no limit. */
  timeLimitMin: number;
}

const KEY = 'pym-settings';

function prefersReducedMotion(): boolean {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function defaultSettings(): Settings {
  return {
    onboarded: false,
    age: '5-6',
    mode: 'math',
    lang: 'es-en',
    voice: true,
    tolMm: 12,
    hintDelay: 4,
    inside: true,
    penOnly: false,
    reduced: prefersReducedMotion(),
    timeLimitMin: 15,
  };
}

/** Accept only known values from storage, falling back to defaults field by field. */
export function sanitizeSettings(raw: unknown): Settings {
  const out = defaultSettings();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  const bool = (v: unknown): v is boolean => typeof v === 'boolean';
  const num = (v: unknown, min: number, max: number): v is number =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;

  if (bool(r.onboarded)) out.onboarded = r.onboarded;
  if (r.age === '3-4' || r.age === '5-6' || r.age === '7-9') out.age = r.age;
  if (r.mode === 'seq' || r.mode === 'math') out.mode = r.mode;
  if (r.lang === 'es' || r.lang === 'es-en' || r.lang === 'en-es' || r.lang === 'en') out.lang = r.lang;
  if (bool(r.voice)) out.voice = r.voice;
  if (num(r.tolMm, 6, 16)) out.tolMm = r.tolMm;
  if (num(r.hintDelay, 0, 10)) out.hintDelay = r.hintDelay;
  if (bool(r.inside)) out.inside = r.inside;
  if (bool(r.penOnly)) out.penOnly = r.penOnly;
  if (bool(r.reduced)) out.reduced = r.reduced;
  if (typeof r.timeLimitMin === 'number' && TIME_LIMITS.includes(r.timeLimitMin)) out.timeLimitMin = r.timeLimitMin;
  return out;
}

export const settings: Settings = sanitizeSettings(readJSON<unknown>(KEY, null));

type Listener = (s: Settings) => void;
const listeners = new Set<Listener>();

export function updateSettings(patch: Partial<Settings>): void {
  Object.assign(settings, patch);
  writeJSON(KEY, settings);
  listeners.forEach((l) => l(settings));
}

export function onSettings(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
