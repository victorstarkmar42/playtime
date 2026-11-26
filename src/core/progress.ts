import type { Skill } from './math';
import { DATA_KEYS, readJSON, removeKey, writeJSON } from './storage';
import type { CharKey } from './types';

export interface SkillStat {
  right: number;
  tries: number;
}

export interface Progress {
  drawings: number;
  dots: number;
  skills: Record<Skill, SkillStat>;
  /** English words the child has heard (unique). */
  words: string[];
  /** Drawings the child has completed at least once. */
  found: CharKey[];
  /** Minutes played per local day, YYYY-MM-DD. */
  minutes: Record<string, number>;
}

const KEY = DATA_KEYS.progress;
const SKILLS: Skill[] = ['seq', 'count', 'sum', 'sub', 'mul', 'div', 'read', 'syl', 'prob'];

export function emptyProgress(): Progress {
  const skills = {} as Record<Skill, SkillStat>;
  for (const s of SKILLS) skills[s] = { right: 0, tries: 0 };
  return { drawings: 0, dots: 0, skills, words: [], found: [], minutes: {} };
}

function load(): Progress {
  const raw = readJSON<Partial<Progress> | null>(KEY, null);
  const p = emptyProgress();
  if (!raw || typeof raw !== 'object') return p;
  if (typeof raw.drawings === 'number') p.drawings = raw.drawings;
  if (typeof raw.dots === 'number') p.dots = raw.dots;
  if (raw.skills) for (const s of SKILLS) if (raw.skills[s]) p.skills[s] = { ...raw.skills[s] };
  if (Array.isArray(raw.words)) p.words = raw.words.filter((w) => typeof w === 'string');
  if (Array.isArray(raw.found)) p.found = raw.found.filter((k) => typeof k === 'string');
  if (raw.minutes && typeof raw.minutes === 'object') p.minutes = { ...raw.minutes };
  return p;
}

export const progress: Progress = load();
const save = () => writeJSON(KEY, progress);

export function dayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** One dot joined. `firstTry` is false if the child touched a wrong dot during this step. */
export function recordStep(skill: Skill, firstTry: boolean): void {
  progress.dots++;
  progress.skills[skill].tries++;
  if (firstTry) progress.skills[skill].right++;
  save();
}

export function recordDrawing(key: CharKey): void {
  progress.drawings++;
  if (!progress.found.includes(key)) progress.found.push(key);
  save();
}

export function recordWord(en: string): void {
  if (!progress.words.includes(en)) {
    progress.words.push(en);
    save();
  }
}

export function addMinutes(min: number, d = new Date()): void {
  const k = dayKey(d);
  progress.minutes[k] = (progress.minutes[k] ?? 0) + min;
  const keep = Object.keys(progress.minutes).sort().slice(-14);
  progress.minutes = Object.fromEntries(keep.map((x) => [x, progress.minutes[x]]));
  save();
}

export function accuracy(s: SkillStat): number | null {
  return s.tries === 0 ? null : Math.round((s.right / s.tries) * 100);
}

export function resetProgress(): void {
  Object.assign(progress, emptyProgress());
  save();
  removeKey(DATA_KEYS.tables);
}
