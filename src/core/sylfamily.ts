import type { Rng } from './math';
import type { Level } from './settings';
import type { Age } from './types';

/**
 * Familias de sílabas (ma me mi mo mu, ta te ti to tu…), como se enseñan en la primaria, y
 * "Las difíciles": las letras que más se confunden (b/d, p/q, m/n, l/r, r/rr, b/v, c/qu, g/gu,
 * ce-ci/se-si, ll/y y las trabadas). Ejercicios: leer la familia, escuchar y elegir, y completar
 * la palabra a la que le falta una sílaba.
 */

export interface SylFamily {
  id: string;
  /** What the card shows: "ta te ti to tu". */
  label: string;
  syl: string[];
  group: 'simple' | 'trabada' | 'dificil';
  /** Sílabas que se confunden con éstas (para los niveles Reto y Experto). */
  near?: string[];
  /**
   * The syllables sound the same (b/v, ce/se, ll/y, r/rr al inicio): only "Completa la palabra",
   * never "Escucha y elige".
   */
  sameSound?: boolean;
  /** Short note for grown-ups: why it is hard. */
  tip?: string;
}

const fam = (id: string, syl: string, near?: string, group: SylFamily['group'] = 'simple'): SylFamily => ({
  id, label: syl, syl: syl.split(' '), group, near: near?.split(' '),
});

/** Families in the order Mexican first grade usually teaches them. */
export const FAMILIES: SylFamily[] = [
  fam('m', 'ma me mi mo mu', 'na ne ni no nu'),
  fam('p', 'pa pe pi po pu', 'ba be bi bo bu'),
  fam('s', 'sa se si so su', 'za ce ci zo zu'),
  fam('l', 'la le li lo lu', 'ra re ri ro ru'),
  fam('t', 'ta te ti to tu', 'da de di do du'),
  fam('n', 'na ne ni no nu', 'ma me mi mo mu'),
  fam('d', 'da de di do du', 'ba be bi bo bu'),
  fam('r', 'ra re ri ro ru', 'la le li lo lu'),
  fam('rr', 'rra rre rri rro rru', 'ra re ri ro ru'),
  fam('c', 'ca que qui co cu', 'ga gue gui go gu'),
  fam('b', 'ba be bi bo bu', 'da de di do du'),
  fam('v', 'va ve vi vo vu', 'fa fe fi fo fu'),
  fam('f', 'fa fe fi fo fu', 'va ve vi vo vu'),
  fam('g', 'ga gue gui go gu', 'ca que qui co cu'),
  fam('j', 'ja je ji jo ju', 'ge gi'),
  fam('z', 'za ce ci zo zu', 'sa se si so su'),
  fam('ch', 'cha che chi cho chu', 'lla lle lli llo llu'),
  fam('ll', 'lla lle lli llo llu', 'ya ye yi yo yu'),
  fam('y', 'ya ye yi yo yu', 'lla lle lli llo llu'),
  fam('ñ', 'ña ñe ñi ño ñu', 'na ne ni no nu'),
  fam('h', 'ha he hi ho hu', 'a e i o u'),
  fam('bl', 'bla ble bli blo blu', 'bra bre bri bro bru', 'trabada'),
  fam('br', 'bra bre bri bro bru', 'bla ble bli blo blu', 'trabada'),
  fam('pl', 'pla ple pli plo plu', 'pra pre pri pro pru', 'trabada'),
  fam('pr', 'pra pre pri pro pru', 'pla ple pli plo plu', 'trabada'),
  fam('cl', 'cla cle cli clo clu', 'cra cre cri cro cru', 'trabada'),
  fam('cr', 'cra cre cri cro cru', 'cla cle cli clo clu', 'trabada'),
  fam('fl', 'fla fle fli flo flu', 'fra fre fri fro fru', 'trabada'),
  fam('fr', 'fra fre fri fro fru', 'fla fle fli flo flu', 'trabada'),
  fam('gl', 'gla gle gli glo glu', 'gra gre gri gro gru', 'trabada'),
  fam('gr', 'gra gre gri gro gru', 'gla gle gli glo glu', 'trabada'),
  fam('tr', 'tra tre tri tro tru', 'dra dre dri dro dru', 'trabada'),
  fam('dr', 'dra dre dri dro dru', 'tra tre tri tro tru', 'trabada'),
];

const hard = (id: string, label: string, syl: string, tip: string, sameSound = false): SylFamily => ({
  id, label, syl: syl.split(' '), group: 'dificil', sameSound, tip,
});

/** "Las difíciles": what first and second graders mix up most. */
export const HARD_GROUPS: SylFamily[] = [
  hard('b-d', 'b / d', 'ba be bi bo bu da de di do du', 'La b y la d se ven como espejo.'),
  hard('p-q', 'p / q', 'pa pe pi po pu que qui', 'La p y la q se ven como espejo.'),
  hard('m-n', 'm / n', 'ma me mi mo mu na ne ni no nu', 'Suenan parecido y la m tiene una patita más.'),
  hard('l-r', 'l / r', 'la le li lo lu ra re ri ro ru', 'Al leer rápido se cambian una por otra.'),
  hard('r-rr', 'r / rr', 'ra re ri ro ru rra rre rri rro rru', 'Entre vocales, la r fuerte se escribe rr: pe-rro.', true),
  hard('b-v', 'b / v', 'ba be bi bo bu va ve vi vo vu', 'Suenan igual: hay que recordar cómo se escribe.', true),
  hard('c-qu', 'ca co cu / que qui', 'ca que qui co cu ce ci', 'Antes de e o i, el sonido de la c se escribe qu.'),
  hard('g-gu', 'ga go gu / gue gui', 'ga gue gui go gu ge gi', 'Antes de e o i, la g suave se escribe gu.'),
  hard('c-s', 'ce ci / se si', 'ce ci se si za zo zu sa so su', 'Suenan igual: hay que recordar cómo se escribe.', true),
  hard('ll-y', 'll / y', 'lla lle lli llo llu ya ye yi yo yu', 'Suenan igual: hay que recordar cómo se escribe.', true),
  hard('tr-l', 'bra / bla', 'bra bla pra pla cra cla fra fla gra gla tra', 'En las trabadas, se cambia la r por la l o se brincan una letra.'),
];

export const familyById = (id: string): SylFamily | undefined => [...FAMILIES, ...HARD_GROUPS].find((f) => f.id === id);

/** A word with a picture, split into syllables. */
export interface PracticeWord {
  pic: string;
  parts: string[];
}

const W = (pic: string, word: string): PracticeWord => ({ pic, parts: word.split('-') });

/** Words for "Completa la palabra" and the pictures under each syllable in "Lee la familia". */
export const PRACTICE_WORDS: PracticeWord[] = [
  W('✋', 'ma-no'), W('🐵', 'mo-no'), W('🦋', 'ma-ri-po-sa'), W('🍯', 'miel'), W('🪆', 'mu-ñe-ca'), W('🍈', 'me-lón'), W('🍎', 'man-za-na'), W('🧳', 'ma-le-ta'),
  W('🦆', 'pa-to'), W('🍐', 'pe-ra'), W('🍍', 'pi-ña'), W('⚽', 'pe-lo-ta'), W('🐙', 'pul-po'), W('🍞', 'pan'), W('🥔', 'pa-pa'), W('🧩', 'pie-za'), W('🦜', 'pe-ri-co'), W('🐼', 'pan-da'),
  W('🍄', 'se-ta'), W('🪑', 'si-lla'), W('🍲', 'so-pa'), W('☀️', 'sol'), W('🍉', 'san-dí-a'), W('🛋️', 'so-fá'), W('🧂', 'sal'),
  W('🌙', 'lu-na'), W('🍋', 'li-món'), W('📚', 'li-bro'), W('🥛', 'le-che'), W('🦁', 'le-ón'), W('🌽', 'e-lo-te'), W('🍿', 'pa-lo-mi-tas'), W('🔑', 'lla-ve'),
  W('🍅', 'to-ma-te'), W('🐱', 'ga-to'), W('🌮', 'ta-co'), W('🐯', 'ti-gre'), W('🐢', 'tor-tu-ga'), W('🍰', 'tar-ta'), W('🦈', 'ti-bu-rón'), W('🐂', 'to-ro'), W('☕', 'ta-za'),
  W('👃', 'na-riz'), W('🐸', 'ra-na'), W('🪺', 'ni-do'), W('🍊', 'na-ran-ja'), W('☁️', 'nu-be'), W('🧒', 'ni-ño'), W('❄️', 'nie-ve'),
  W('☝️', 'de-do'), W('🎲', 'da-do'), W('🦷', 'dien-te'), W('🐬', 'del-fín'), W('🦖', 'di-no-sau-rio'), W('🍬', 'dul-ce'), W('💵', 'di-ne-ro'), W('🛝', 'res-ba-la-di-lla'),
  W('🐭', 'ra-tón'), W('🌹', 'ro-sa'), W('⏰', 're-loj'), W('🎁', 're-ga-lo'), W('🐍', 'cu-le-bra'), W('🦀', 'can-gre-jo'), W('🍇', 'u-vas'),
  W('🐶', 'pe-rro'), W('🦊', 'zo-rro'), W('🚗', 'ca-rro'), W('🎸', 'gui-ta-rra'), W('🗼', 'to-rre'), W('🧥', 'cha-ma-rra'), W('🛢️', 'ba-rril'),
  W('🏠', 'ca-sa'), W('🧀', 'que-so'), W('🦟', 'mos-qui-to'), W('🥥', 'co-co'), W('🛏️', 'ca-ma'), W('📦', 'pa-que-te'), W('🐄', 'va-ca'), W('🥄', 'cu-cha-ra'),
  W('🐋', 'ba-lle-na'), W('👄', 'bo-ca'), W('🎈', 'glo-bo'), W('🦉', 'bú-ho'), W('👢', 'bo-ta'), W('🧹', 'es-co-ba'), W('🚌', 'au-to-bús'), W('🪣', 'cu-be-ta'),
  W('🕯️', 've-la'), W('🥚', 'hue-vo'), W('🐑', 'o-ve-ja'), W('🌋', 'vol-cán'), W('🥤', 'va-so'), W('🏐', 'vo-lei-bol'), W('👗', 'ves-ti-do'),
  W('🦭', 'fo-ca'), W('💡', 'fo-co'), W('🦒', 'ji-ra-fa'), W('🍓', 'fre-sa'), W('🌸', 'flor'), W('🔥', 'fue-go'),
  W('🐔', 'ga-lli-na'), W('🍪', 'ga-lle-ta'), W('🐛', 'gu-sa-no'), W('🦅', 'á-gui-la'), W('🍔', 'ham-bur-gue-sa'), W('🧢', 'go-rra'), W('🐈', 'ga-ti-to'), W('🥅', 'gol'),
  W('👁️', 'o-jo'), W('🐝', 'a-be-ja'), W('🐰', 'co-ne-jo'), W('🧼', 'ja-bón'), W('🧃', 'ju-go'), W('🎮', 'ju-gue-te'), W('🦩', 'fla-men-co'), W('🌼', 'jaz-mín'),
  W('🥕', 'za-na-ho-ria'), W('👞', 'za-pa-to'), W('🧅', 'ce-bo-lla'), W('🍒', 'ce-re-za'), W('🦓', 'ce-bra'), W('🎬', 'ci-ne'), W('🏙️', 'ciu-dad'), W('🍳', 'co-ci-na'),
  W('🍫', 'cho-co-la-te'), W('🧸', 'pe-lu-che'), W('🌶️', 'chi-le'), W('🍭', 'chu-pe-te'),
  W('⭐', 'es-tre-lla'), W('🌧️', 'llu-via'), W('🛞', 'llan-ta'), W('🔑', 'lla-ve'), W('🍗', 'po-llo'),
  W('🤡', 'pa-ya-so'), W('🛥️', 'ya-te'), W('🪀', 'yo-yo'),
  W('👧', 'ni-ña'), W('🪆', 'mu-ñe-ca'), W('🍍', 'pi-ña'), W('🐿️', 'ar-di-lla'), W('🏔️', 'mon-ta-ña'), W('🕸️', 'a-ra-ña'),
  W('🐜', 'hor-mi-ga'), W('🍦', 'he-la-do'), W('🍃', 'ho-ja'), W('🦴', 'hue-so'), W('🧵', 'hi-lo'), W('🥚', 'hue-vo'), W('🌿', 'hier-ba'),
  W('🧱', 'blo-que'), W('🐐', 'ca-bra'), W('🧙', 'bru-ja'), W('🤗', 'a-bra-zo'), W('💪', 'bra-zo'),
  W('🍌', 'plá-ta-no'), W('🍽️', 'pla-to'), W('🏖️', 'pla-ya'), W('🪶', 'plu-ma'), W('🌱', 'plan-ta'), W('🖨️', 'im-pre-so-ra'), W('🥇', 'pre-mio'), W('👸', 'prin-ce-sa'),
  W('🔩', 'cla-vo'), W('🍀', 'tré-bol'), W('🖍️', 'cra-yo-la'), W('🧁', 'cre-ma'), W('🎹', 'te-cla-do'),
  W('🦩', 'fla-men-co'), 
  W('🦗', 'gri-llo'), W('🦍', 'go-ri-la'),
  W('🚆', 'tren'), W('🚜', 'trac-tor'), W('🏆', 'tro-fe-o'), W('🌾', 'tri-go'), W('🥁', 'tam-bor'),
  W('🐉', 'dra-gón'), W('🐊', 'co-co-dri-lo'), W('🐍', 'cu-le-bra'), W('🏰', 'cas-ti-llo'),
];

/** Strips accents so "plá" counts as "pla" (but the choices then show the word's own form). */
const plain = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Words that have one of the group's syllables (unaccented, so the answer isn't given away). */
export function wordsFor(f: SylFamily): { word: PracticeWord; at: number }[] {
  const seen = new Set<string>();
  const out: { word: PracticeWord; at: number }[] = [];
  for (const word of PRACTICE_WORDS) {
    const key = word.parts.join('-');
    if (seen.has(key)) continue;
    const at = word.parts.findIndex((p) => p === plain(p) && f.syl.includes(p.toLowerCase()));
    if (at < 0) continue;
    seen.add(key);
    out.push({ word, at });
  }
  return out;
}

/** A picture for a syllable in "Lee la familia": a word that starts with it. */
export function picFor(syl: string): string | undefined {
  return PRACTICE_WORDS.find((w) => w.parts[0] === syl)?.pic;
}

export type FamilyMode = 'read' | 'listen' | 'complete';

/** "Escucha y elige" makes no sense when the syllables sound the same. */
export const modesFor = (f: SylFamily): FamilyMode[] => {
  const m: FamilyMode[] = f.group === 'dificil' ? [] : ['read'];
  if (!f.sameSound) m.push('listen');
  if (wordsFor(f).length >= 2) m.push('complete');
  return m;
};

/** How many syllables to choose from, by age and level. */
export function optionCount(age: Age, level: Level): number {
  const n = ({ 1: 3, 2: 4, 3: 5, 4: 6 } as const)[level];
  return age === '3-4' ? Math.min(n, 4) : age === '5-6' ? Math.min(n + 1, 6) : Math.min(n + 2, 8);
}

export interface FamilyRound {
  /** The syllable to find. */
  answer: string;
  choices: string[];
  /** 'complete': the word and which syllable is missing. */
  word?: PracticeWord;
  at?: number;
}

function shuffle<T>(a: T[], rng: Rng): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** The answer plus distractors: first its own family, then the ones it gets confused with. */
function choicesFor(answer: string, f: SylFamily, n: number, level: Level, rng: Rng): string[] {
  let own = shuffle(f.syl.filter((s) => s !== answer), rng);
  // "Las difíciles": the look-alike with the same vowel goes first (vaso: va / ba).
  if (f.group === 'dificil') {
    const v = answer.slice(-1);
    own = [...own.filter((s) => s.endsWith(v)), ...own.filter((s) => !s.endsWith(v))];
  }
  const near = level >= 3 ? shuffle((f.near ?? []).filter((s) => s !== answer && !f.syl.includes(s)), rng) : [];
  // Reto and Experto put the confusing ones first, so they always show up.
  const pool = level >= 3 ? [...near.slice(0, level === 4 ? 3 : 1), ...own, ...near.slice(level === 4 ? 3 : 1)] : own;
  return shuffle([answer, ...pool.slice(0, n - 1)], rng);
}

/** `n` rounds; no answer (or word) repeats until all have been used. */
export function familyRounds(f: SylFamily, mode: Exclude<FamilyMode, 'read'>, age: Age, level: Level, n: number, rng: Rng = Math.random): FamilyRound[] {
  const k = optionCount(age, level);
  const out: FamilyRound[] = [];
  if (mode === 'complete') {
    let bag: { word: PracticeWord; at: number }[] = [];
    for (let i = 0; i < n; i++) {
      if (!bag.length) bag = shuffle(wordsFor(f).slice(), rng);
      const { word, at } = bag.pop()!;
      const answer = word.parts[at].toLowerCase();
      out.push({ answer, choices: choicesFor(answer, f, k, level, rng), word, at });
    }
    return out;
  }
  let bag: string[] = [];
  let last = '';
  for (let i = 0; i < n; i++) {
    if (!bag.length) {
      bag = shuffle(f.syl.slice(), rng);
      if (bag[bag.length - 1] === last && bag.length > 1) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    }
    const answer = bag.pop()!;
    last = answer;
    out.push({ answer, choices: choicesFor(answer, f, k, level, rng) });
  }
  return out;
}

/** Robi, the robot: how long it takes to answer (ms) and how often it gets it right. */
export function robiPace(age: Age, level: Level): { ms: number; right: number } {
  const base = { '3-4': 10000, '5-6': 7000, '7-9': 5000 }[age];
  const mult = { 1: 1.3, 2: 1, 3: 0.8, 4: 0.65 }[level];
  const right = { 1: 0.65, 2: 0.75, 3: 0.85, 4: 0.9 }[level];
  return { ms: Math.round(base * mult), right };
}

/** Best "first try" score per family, to mark the ones already practised. */
export type FamilyScores = Record<string, number>;
