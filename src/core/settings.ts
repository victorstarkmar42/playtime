import { DATA_KEYS, readJSON, writeJSON } from './storage';
import { LIMIT_MIN, REST_PRESETS, sanitizePlan, type RestPlan } from './rest';
import type { Age, LangMode, Mode } from './types';

/** Difficulty inside an age: 1 Fácil, 2 Normal, 3 Reto. */
export type Level = 1 | 2 | 3;
export type LevelGame = 'problems' | 'math' | 'maze';
export const LEVEL_GAMES: LevelGame[] = ['problems', 'math', 'maze'];

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
  /** An adult is nearby: use the "con supervisión" plan (breaks can be skipped by an adult). */
  supervised: boolean;
  /** Breaks and play limit when the child plays alone. */
  solo: RestPlan;
  /** Breaks and play limit when an adult is watching. */
  together: RestPlan;
  /** Hide the phone's status and navigation bars while playing. */
  fullscreen: boolean;
  /** Voice names chosen by the adult ("" = the best one automatically). */
  voiceEs: string;
  voiceEn: string;
  /** Difficulty chosen in each game (the age still sets the range). */
  levels: Record<LevelGame, Level>;
}

const KEY = DATA_KEYS.settings;

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
    supervised: false,
    solo: { ...REST_PRESETS['5-6'].solo },
    together: { ...REST_PRESETS['5-6'].together },
    fullscreen: true,
    voiceEs: '',
    voiceEn: '',
    levels: { problems: 2, math: 2, maze: 2 },
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
  if (bool(r.supervised)) out.supervised = r.supervised;
  if (bool(r.fullscreen)) out.fullscreen = r.fullscreen;
  out.solo = sanitizePlan(r.solo, REST_PRESETS[out.age].solo);
  out.together = sanitizePlan(r.together, REST_PRESETS[out.age].together);
  // before 0.10 there was a single limit: keep what the adult chose for the child playing alone
  if (r.solo === undefined && typeof r.timeLimitMin === 'number' && LIMIT_MIN.includes(r.timeLimitMin)) out.solo.limitMin = r.timeLimitMin;
  for (const k of ['voiceEs', 'voiceEn'] as const) if (typeof r[k] === 'string' && (r[k] as string).length < 200) out[k] = r[k] as string;
  if (r.levels && typeof r.levels === 'object')
    for (const g of LEVEL_GAMES) {
      const v = (r.levels as Record<string, unknown>)[g];
      if (v === 1 || v === 2 || v === 3) out.levels[g] = v;
    }
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

/** The breaks and limit that apply right now. */
export const activePlan = (s: Settings = settings): RestPlan => (s.supervised ? s.together : s.solo);
