import type { Rng } from './math';
import type { Age, Lang } from './types';

/**
 * Sílabas: words split into syllables, the way Mexican schools teach reading (ma-má, ca-sa).
 * 3–4: hear the word and say how many claps it has; 5–6: build it with its syllables;
 * 7–9: longer words and two extra syllables that don't belong.
 */

export interface SylWord {
  pic: string;
  es: string[];
  /** English split; missing when the English word is two words. */
  en?: string[];
}

const s = (pic: string, es: string, en?: string): SylWord => ({ pic, es: es.split('-'), en: en ? en.split('-') : undefined });

export const SYL_WORDS: SylWord[] = [
  s('☀️', 'sol', 'sun'), s('🐟', 'pez', 'fish'), s('🍞', 'pan', 'bread'), s('🦶', 'pie', 'foot'), s('🌸', 'flor', 'flow-er'),
  s('🏠', 'ca-sa', 'house'), s('🐱', 'ga-to', 'cat'), s('🐶', 'pe-rro', 'dog'), s('🦆', 'pa-to', 'duck'), s('🐸', 'ra-na', 'frog'),
  s('🐮', 'va-ca', 'cow'), s('🌙', 'lu-na', 'moon'), s('✋', 'ma-no', 'hand'), s('🐻', 'o-so', 'bear'), s('🐭', 'ra-tón', 'mouse'),
  s('🍐', 'pe-ra', 'pear'), s('🌮', 'ta-co', 'ta-co'), s('🍕', 'piz-za', 'piz-za'), s('🎈', 'glo-bo', 'bal-loon'), s('🐵', 'mo-no', 'mon-key'),
  s('🚗', 'ca-rro', 'car'), s('🌳', 'ár-bol', 'tree'), s('🦉', 'bú-ho', 'owl'), s('🐙', 'pul-po', 'oc-to-pus'), s('🧀', 'que-so', 'cheese'),
  s('🐬', 'del-fín', 'dol-phin'), s('🦁', 'le-ón', 'li-on'), s('🐯', 'ti-gre', 'ti-ger'), s('🍋', 'li-món', 'lem-on'), s('🎂', 'pas-tel', 'cake'),
  s('🍇', 'u-vas', 'grapes'), s('🥚', 'hue-vo', 'egg'), s('📚', 'li-bro', 'book'), s('✏️', 'lá-piz', 'pen-cil'), s('🪑', 'si-lla', 'chair'),
  s('🦷', 'dien-te', 'tooth'), s('👁️', 'o-jo', 'eye'), s('👃', 'na-riz', 'nose'), s('🦊', 'zo-rro', 'fox'), s('⚽', 'pe-lo-ta', 'ball'),
  s('⭐', 'es-tre-lla', 'star'), s('🍎', 'man-za-na', 'ap-ple'), s('🍌', 'plá-ta-no', 'ba-na-na'), s('🐢', 'tor-tu-ga', 'tur-tle'), s('🐰', 'co-ne-jo', 'rab-bit'),
  s('🦒', 'ji-ra-fa', 'gi-raffe'), s('🍓', 'fre-sa', 'straw-ber-ry'), s('🍪', 'ga-lle-ta', 'cook-ie'), s('🐝', 'a-be-ja', 'bee'), s('🍅', 'to-ma-te', 'to-ma-to'),
  s('🐧', 'pin-güi-no', 'pen-guin'), s('🚀', 'co-he-te', 'rock-et'), s('🌽', 'e-lo-te', 'corn'), s('🐑', 'o-ve-ja', 'sheep'), s('🦜', 'pe-ri-co', 'par-rot'),
  s('🏫', 'es-cue-la', 'school'), s('🐍', 'ser-pien-te', 'snake'), s('🍉', 'san-dí-a', 'wa-ter-mel-on'), s('🐔', 'ga-lli-na', 'hen'), s('🧸', 'o-si-to', 'ted-dy'),
  s('🥕', 'za-na-ho-ria', 'car-rot'), s('🦋', 'ma-ri-po-sa', 'but-ter-fly'), s('🐘', 'e-le-fan-te', 'el-e-phant'), s('🐞', 'ca-ta-ri-na', 'la-dy-bug'),
  s('🍿', 'pa-lo-mi-tas', 'pop-corn'), s('🎸', 'gui-ta-rra', 'gui-tar'), s('🍫', 'cho-co-la-te', 'choc-o-late'), s('🐊', 'co-co-dri-lo', 'croc-o-dile'),
  s('🌈', 'ar-co-í-ris', 'rain-bow'), s('☂️', 'pa-ra-guas', 'um-brel-la'), s('🦖', 'di-no-sau-rio', 'di-no-saur'), s('🚲', 'bi-ci-cle-ta', 'bi-cy-cle'),
];

export type SylKind = 'clap' | 'build';
export const sylKindFor = (age: Age): SylKind => (age === '3-4' ? 'clap' : 'build');

/** How many syllables a word may have at each age. */
const RANGE: Record<Age, [number, number]> = { '3-4': [1, 3], '5-6': [2, 3], '7-9': [3, 5] };
/** Extra syllables mixed in with the right ones. */
export const DISTRACTORS: Record<Age, number> = { '3-4': 0, '5-6': 0, '7-9': 2 };

export const partsOf = (w: SylWord, lang: Lang): string[] | undefined => (lang === 'es' ? w.es : w.en);
export const wordText = (parts: string[]): string => parts.join('');

export interface SylRound {
  word: SylWord;
  parts: string[];
  /** 'build': shuffled tiles (the parts plus any distractors). */
  tiles: string[];
  /** 'clap': choices for the number of claps. */
  claps: number[];
}

function shuffle<T>(a: T[], rng: Rng): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Words usable for an age and language. English goes one syllable lower (fewer long words). */
export function sylPool(age: Age, lang: Lang): SylWord[] {
  const [lo, hi] = RANGE[age];
  const min = lang === 'en' && age === '7-9' ? 2 : lo;
  return SYL_WORDS.filter((w) => {
    const p = partsOf(w, lang);
    return p && p.length >= min && p.length <= hi;
  });
}

/** `n` different rounds. Tiles never read the word in order. */
export function sylRounds(age: Age, lang: Lang, n: number, rng: Rng = Math.random): SylRound[] {
  const pool = shuffle(sylPool(age, lang).slice(), rng).slice(0, n);
  const all = SYL_WORDS.flatMap((w) => partsOf(w, lang) ?? []);
  return pool.map((word) => {
    const parts = partsOf(word, lang)!;
    const extra: string[] = [];
    for (let guard = 0; extra.length < DISTRACTORS[age] && guard < 200; guard++) {
      const x = all[Math.floor(rng() * all.length)];
      if (!parts.includes(x) && !extra.includes(x)) extra.push(x);
    }
    let tiles = shuffle([...parts, ...extra], rng);
    for (let guard = 0; tiles.length > 1 && tiles.slice(0, parts.length).join('-') === parts.join('-') && guard < 20; guard++) tiles = shuffle(tiles, rng);
    const claps = age === '3-4' ? [1, 2, 3] : [1, 2, 3, 4];
    return { word, parts, tiles, claps };
  });
}
