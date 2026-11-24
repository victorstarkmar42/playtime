import type { Age, Lang } from './types';

/** One letter of the alphabet with a picture word that has it (at the start whenever possible). */
export interface AbcEntry {
  letter: string;
  /** How the letter is said aloud. */
  name: string;
  word: string;
  pic: string;
}

const e = (letter: string, name: string, word: string, pic: string): AbcEntry => ({ letter, name, word, pic });

export const ABC: Record<Lang, AbcEntry[]> = {
  es: [
    e('a', 'a', 'abeja', '🐝'), e('b', 'be', 'ballena', '🐋'), e('c', 'ce', 'casa', '🏠'), e('d', 'de', 'dado', '🎲'),
    e('e', 'e', 'elefante', '🐘'), e('f', 'efe', 'flor', '🌸'), e('g', 'ge', 'gato', '🐱'), e('h', 'hache', 'helado', '🍦'),
    e('i', 'i', 'isla', '🏝️'), e('j', 'jota', 'jirafa', '🦒'), e('k', 'ka', 'koala', '🐨'), e('l', 'ele', 'luna', '🌙'),
    e('m', 'eme', 'manzana', '🍎'), e('n', 'ene', 'nube', '☁️'), e('ñ', 'eñe', 'piña', '🍍'), e('o', 'o', 'oso', '🐻'),
    e('p', 'pe', 'perro', '🐶'), e('q', 'cu', 'queso', '🧀'), e('r', 'erre', 'ratón', '🐭'), e('s', 'ese', 'sol', '☀️'),
    e('t', 'te', 'tortuga', '🐢'), e('u', 'u', 'uvas', '🍇'), e('v', 'uve', 'vaca', '🐮'), e('w', 'doble uve', 'wafle', '🧇'),
    e('x', 'equis', 'saxofón', '🎷'), e('y', 'ye', 'yoyo', '🪀'), e('z', 'zeta', 'zapato', '👞'),
  ],
  en: [
    e('a', 'A', 'apple', '🍎'), e('b', 'B', 'ball', '⚽'), e('c', 'C', 'cat', '🐱'), e('d', 'D', 'dog', '🐶'),
    e('e', 'E', 'egg', '🥚'), e('f', 'F', 'fish', '🐟'), e('g', 'G', 'grapes', '🍇'), e('h', 'H', 'hat', '🎩'),
    e('i', 'I', 'igloo', '🛖'), e('j', 'J', 'juice', '🧃'), e('k', 'K', 'kite', '🪁'), e('l', 'L', 'lion', '🦁'),
    e('m', 'M', 'moon', '🌙'), e('n', 'N', 'nose', '👃'), e('o', 'O', 'orange', '🍊'), e('p', 'P', 'pig', '🐷'),
    e('q', 'Q', 'queen', '👸'), e('r', 'R', 'rabbit', '🐰'), e('s', 'S', 'sun', '☀️'), e('t', 'T', 'tree', '🌳'),
    e('u', 'U', 'umbrella', '☂️'), e('v', 'V', 'van', '🚐'), e('w', 'W', 'whale', '🐋'), e('x', 'X', 'box', '📦'),
    e('y', 'Y', 'yo-yo', '🪀'), e('z', 'Z', 'zebra', '🦓'),
  ],
};

/** A picture word to play with. */
export interface PicWord {
  word: string;
  pic: string;
}

export type LetterKind = 'first' | 'missing' | 'find';

/**
 * 3–4: which letter does the word start with (3 big letters, very different from each other).
 * 5–6: fill in the missing letter of the word (4 letters).
 * 7–9: missing letter with look-alike letters (b/d/p…), alternating with "tap every letter X".
 */
export const kindsFor = (age: Age, round: number): LetterKind =>
  age === '3-4' ? 'first' : age === '5-6' ? 'missing' : round % 2 === 0 ? 'missing' : 'find';

/** Letters without accents or other marks (ñ stays ñ). */
export const plain = (ch: string): string => (ch === 'ñ' ? 'ñ' : ch.normalize('NFD').replace(/[̀-ͯ]/g, ''));

const LOOK_ALIKE: Record<string, string[]> = {
  b: ['d', 'p', 'v'], d: ['b', 'p', 'q'], p: ['q', 'b', 'd'], q: ['p', 'g', 'd'], m: ['n', 'w', 'ñ'], n: ['m', 'ñ', 'u'],
  ñ: ['n', 'm', 'u'], u: ['n', 'v', 'o'], v: ['b', 'u', 'w'], w: ['m', 'v', 'u'], s: ['z', 'c', 'x'], z: ['s', 'c', 'x'],
  c: ['s', 'z', 'k'], k: ['c', 'q', 'h'], g: ['j', 'q', 'y'], j: ['g', 'i', 'y'], y: ['v', 'i', 'j'], i: ['l', 'j', 'y'],
  l: ['i', 't', 'h'], t: ['f', 'l', 'd'], f: ['t', 'l', 'h'], h: ['n', 'k', 'l'], r: ['n', 'l', 't'], e: ['a', 'o', 'i'],
  a: ['e', 'o', 'u'], o: ['a', 'e', 'u'], x: ['s', 'z', 'k'],
};
/** Round shapes and sticks are easy to tell apart for the youngest. */
const EASY = ['a', 'b', 'e', 'i', 'l', 'm', 'o', 's', 't', 'u', 'p', 'r'];

export interface LetterRound {
  kind: LetterKind;
  word: string;
  pic: string;
  /** The letter to find (plain). */
  letter: string;
  /** Positions of the word the child has to fill or tap. */
  slots: number[];
  /** Choices to tap (for first / missing). */
  options: string[];
}

const shuffle = <T>(a: T[], rnd: () => number): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/** Words that can be shown letter by letter: letters only, length suited to the age. */
export function usableWords(words: PicWord[], age: Age): PicWord[] {
  const max = age === '3-4' ? 8 : age === '5-6' ? 7 : 10;
  const min = age === '7-9' ? 4 : 3;
  const seen = new Set<string>();
  return words.filter((w) => {
    const ok = /^[a-zñáéíóúü]+$/.test(w.word) && w.word.length >= min && w.word.length <= max && !seen.has(w.word);
    seen.add(w.word);
    return ok;
  });
}

function options(letter: string, n: number, alphabet: string[], kind: LetterKind, rnd: () => number): string[] {
  let pool: string[];
  if (kind === 'first') pool = EASY.filter((l) => l !== letter && !(LOOK_ALIKE[letter] ?? []).includes(l));
  else pool = alphabet.filter((l) => l !== letter);
  const out = new Set<string>([letter]);
  if (kind !== 'first') for (const l of shuffle(LOOK_ALIKE[letter] ?? [], rnd)) if (alphabet.includes(l) && out.size < Math.ceil(n / 2) + 1) out.add(l);
  for (const l of shuffle(pool, rnd)) if (out.size < n) out.add(l);
  return shuffle([...out], rnd);
}

/** Builds one round, or null if this word does not suit the kind. */
export function makeRound(kind: LetterKind, w: PicWord, age: Age, lang: Lang, rnd: () => number = Math.random): LetterRound | null {
  const letters = [...w.word];
  const alphabet = ABC[lang].map((x) => x.letter);
  const plainAt = (i: number) => plain(letters[i]);
  const clean = (i: number) => letters[i] === plainAt(i) && alphabet.includes(letters[i]);
  if (kind === 'first') {
    if (!clean(0)) return null;
    return { kind, word: w.word, pic: w.pic, letter: letters[0], slots: [0], options: options(letters[0], 3, alphabet, kind, rnd) };
  }
  if (kind === 'missing') {
    // 5–6 mostly the first letter or a middle consonant; 7–9 anywhere but the first
    const from = age === '5-6' ? 0 : 1;
    const cand = letters.map((_, i) => i).filter((i) => i >= from && clean(i));
    if (!cand.length) return null;
    const i = age === '5-6' && rnd() < 0.5 && clean(0) ? 0 : cand[Math.floor(rnd() * cand.length)];
    return { kind, word: w.word, pic: w.pic, letter: letters[i], slots: [i], options: options(letters[i], 4, alphabet, kind, rnd) };
  }
  // find: a letter that appears in the word; prefer one that repeats
  const counts = new Map<string, number[]>();
  letters.forEach((_, i) => {
    const p = plainAt(i);
    if (alphabet.includes(p)) counts.set(p, [...(counts.get(p) ?? []), i]);
  });
  const all = [...counts.entries()];
  if (!all.length) return null;
  const best = Math.max(...all.map(([, v]) => v.length));
  const pick = shuffle(all.filter(([, v]) => v.length === best), rnd)[0];
  return { kind, word: w.word, pic: w.pic, letter: pick[0], slots: pick[1], options: [] };
}

/** Five rounds with different words. */
export function makeRounds(age: Age, lang: Lang, words: PicWord[], n = 5, rnd: () => number = Math.random): LetterRound[] {
  const pool = shuffle(usableWords(words, age), rnd);
  const out: LetterRound[] = [];
  for (const w of pool) {
    if (out.length >= n) break;
    const r = makeRound(kindsFor(age, out.length), w, age, lang, rnd);
    if (r) out.push(r);
  }
  return out;
}

/** How a letter is said: "la eme" / "M". */
export function letterName(letter: string, lang: Lang): string {
  return ABC[lang].find((x) => x.letter === letter)?.name ?? letter;
}
