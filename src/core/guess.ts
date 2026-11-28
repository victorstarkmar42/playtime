import { charOf } from '../content/characters';
import { practiceLang } from './lang';
import type { Age, CharKey, Lang, LangMode } from './types';

/**
 * Drawings used by "Adivina la palabra": one clear word per picture, no repeated words
 * (the concert singers and the head-only characters are left out: their words are not the picture).
 */
export const GUESS_POOL: readonly CharKey[] = [
  'briz', 'momu', 'leo', 'micro', 'lentes', 'estrella', 'casa', 'granero', 'castillo', 'tren',
  'auto', 'carreras', 'camioneta', 'autobus', 'mandalaFlor', 'mandalaCopo', 'mandalaSol',
];

/** 3–4: hear the word, touch the picture. 5–6: see the picture, touch the word. 7–9: spell it. */
export type GuessKind = 'pick-image' | 'pick-word' | 'spell';
export const kindFor = (age: Age): GuessKind => (age === '3-4' ? 'pick-image' : age === '5-6' ? 'pick-word' : 'spell');
export const optionCount = (kind: GuessKind): number => (kind === 'pick-image' ? 3 : kind === 'pick-word' ? 4 : 0);

/** Spelling language: the only one in a single-language mode, otherwise the one being practised. */
export const spellLang = (m: LangMode): Lang => (m === 'es' ? 'es' : m === 'en' ? 'en' : practiceLang(m));

export const wordOf = (k: CharKey, lang: Lang): string => charOf(k).vocab[lang];
/** Words a child can spell with tiles: one word, at most 10 letters. */
export const spellable = (w: string): boolean => !/\s/.test(w) && [...w].length <= 10;

export interface GuessRound {
  key: CharKey;
  /** Shuffled choices including `key` (empty when spelling). */
  options: CharKey[];
}

function shuffle<T>(a: T[], rnd: () => number): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/**
 * `n` rounds with different answers. For the youngest, the wrong pictures come from other groups
 * (no car-versus-truck puzzles at three years old).
 */
export function makeRounds(kind: GuessKind, n: number, lang: Lang, rnd: () => number = Math.random): GuessRound[] {
  const pool = kind === 'spell' ? GUESS_POOL.filter((k) => spellable(wordOf(k, lang))) : [...GUESS_POOL];
  const targets = shuffle(pool, rnd).slice(0, n);
  return targets.map((key) => {
    if (kind === 'spell') return { key, options: [] };
    const group = (k: CharKey) => charOf(k).group;
    const used = new Set([group(key)]);
    const picks: CharKey[] = [];
    for (const k of shuffle(GUESS_POOL.filter((k) => k !== key), rnd)) {
      if (picks.length >= optionCount(kind) - 1) break;
      if (kind === 'pick-image') {
        if (used.has(group(k))) continue;
        used.add(group(k));
      }
      picks.push(k);
    }
    return { key, options: shuffle([key, ...picks], rnd) };
  });
}

/** Letter tiles for spelling: the word's letters plus two decoys, shuffled. */
export function spellTiles(word: string, rnd: () => number = Math.random): string[] {
  const letters = [...word.toLowerCase()];
  const decoys = [...'aeioulmnrst'].filter((c) => !letters.includes(c));
  const extra = shuffle(decoys, rnd).slice(0, 2);
  return shuffle([...letters, ...extra], rnd);
}
