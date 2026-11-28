import type { Level } from './settings';
import type { Age, Lang } from './types';

/** One letter of the alphabet with several picture words that have it (at the start whenever possible). */
export interface AbcEntry {
  letter: string;
  /** How the letter is said aloud. */
  name: string;
  /** Picture words for this letter; the alphabet shows a different one each visit. */
  words: { word: string; pic: string }[];
}

/** `e('a', 'a', 'abeja 🐝, avión ✈️')`: words and their pictures, separated by commas. */
const e = (letter: string, name: string, list: string): AbcEntry => ({
  letter,
  name,
  words: list.split(',').map((s) => {
    const [word, pic] = s.trim().split(' ');
    return { word, pic };
  }),
});

export const ABC: Record<Lang, AbcEntry[]> = {
  es: [
    e('a', 'a', 'abeja 🐝, avión ✈️, árbol 🌳, araña 🕷️, anillo 💍, ardilla 🐿️'),
    e('b', 'be', 'ballena 🐋, barco ⛵, bebé 👶, bicicleta 🚲, búho 🦉, bota 👢'),
    e('c', 'ce', 'casa 🏠, caballo 🐴, cohete 🚀, conejo 🐰, camión 🚚, corazón ❤️'),
    e('d', 'de', 'dado 🎲, delfín 🐬, dinosaurio 🦕, diente 🦷, durazno 🍑, dona 🍩'),
    e('e', 'e', 'elefante 🐘, estrella ⭐, escoba 🧹, erizo 🦔, elote 🌽, escalera 🪜'),
    e('f', 'efe', 'flor 🌸, fresa 🍓, foca 🦭, foco 💡, fuego 🔥, flamenco 🦩'),
    e('g', 'ge', 'gato 🐱, globo 🎈, gallina 🐔, guitarra 🎸, gusano 🪱, gorila 🦍'),
    e('h', 'hache', 'helado 🍦, hoja 🍃, hormiga 🐜, huevo 🥚, hamburguesa 🍔, hongo 🍄'),
    e('i', 'i', 'isla 🏝️, iguana 🦎, imán 🧲, insecto 🐞'),
    e('j', 'jota', 'jirafa 🦒, jugo 🧃, jabón 🧼, jaguar 🐆, jardín 🌷'),
    e('k', 'ka', 'koala 🐨, kiwi 🥝, karate 🥋, kayak 🛶'),
    e('l', 'ele', 'luna 🌙, león 🦁, libro 📚, lápiz ✏️, limón 🍋, llave 🔑'),
    e('m', 'eme', 'manzana 🍎, mono 🐵, mariposa 🦋, mano ✋, melón 🍈, moto 🏍️'),
    e('n', 'ene', 'nube ☁️, nariz 👃, naranja 🍊, nido 🪺, nieve ❄️, niño 👦'),
    e('ñ', 'eñe', 'piña 🍍, araña 🕷️, niña 👧, uña 💅, sueño 😴'),
    e('o', 'o', 'oso 🐻, oveja 🐑, ojo 👁️, olla 🍲, oreja 👂, ola 🌊'),
    e('p', 'pe', 'perro 🐶, pez 🐟, pato 🦆, pelota ⚽, pastel 🎂, pan 🍞'),
    e('q', 'cu', 'queso 🧀, mosquito 🦟, raqueta 🏸, esquí ⛷️'),
    e('r', 'erre', 'ratón 🐭, rana 🐸, rosa 🌹, reloj ⌚, regalo 🎁, robot 🤖'),
    e('s', 'ese', 'sol ☀️, serpiente 🐍, silla 🪑, sandía 🍉, sombrero 👒, sirena 🧜‍♀️'),
    e('t', 'te', 'tortuga 🐢, tigre 🐯, tren 🚂, tomate 🍅, tambor 🥁, taza ☕'),
    e('u', 'u', 'uvas 🍇, unicornio 🦄, uno 1️⃣, uña 💅'),
    e('v', 'uve', 'vaca 🐮, vela 🕯️, ventana 🪟, violín 🎻, volcán 🌋, vaso 🥛'),
    e('w', 'doble uve', 'wafle 🧇, kiwi 🥝, sándwich 🥪'),
    e('x', 'equis', 'saxofón 🎷, taxi 🚕, boxeo 🥊, México 🇲🇽'),
    e('y', 'ye', 'yoyo 🪀, yate 🛥️, payaso 🤡, yogur 🥣'),
    e('z', 'zeta', 'zapato 👞, zorro 🦊, zanahoria 🥕, pizza 🍕, lápiz ✏️'),
  ],
  en: [
    e('a', 'A', 'apple 🍎, ant 🐜, airplane ✈️, alligator 🐊'),
    e('b', 'B', 'ball ⚽, bear 🐻, banana 🍌, bus 🚌'),
    e('c', 'C', 'cat 🐱, car 🚗, cake 🎂, cow 🐮'),
    e('d', 'D', 'dog 🐶, duck 🦆, door 🚪, drum 🥁'),
    e('e', 'E', 'egg 🥚, elephant 🐘, ear 👂, eye 👁️'),
    e('f', 'F', 'fish 🐟, frog 🐸, flower 🌸, fox 🦊'),
    e('g', 'G', 'grapes 🍇, goat 🐐, gift 🎁, guitar 🎸'),
    e('h', 'H', 'hat 🎩, horse 🐴, house 🏠, heart ❤️'),
    e('i', 'I', 'insect 🐞, iguana 🦎, island 🏝️, igloo 🛖'),
    e('j', 'J', 'juice 🧃, jellyfish 🪼, jacket 🧥, jaguar 🐆'),
    e('k', 'K', 'kite 🪁, key 🔑, kangaroo 🦘, koala 🐨'),
    e('l', 'L', 'lion 🦁, leaf 🍃, lemon 🍋, lamp 💡'),
    e('m', 'M', 'moon 🌙, monkey 🐵, milk 🥛, mouse 🐭'),
    e('n', 'N', 'nose 👃, nest 🪺, nut 🥜, nine 9️⃣'),
    e('o', 'O', 'orange 🍊, owl 🦉, octopus 🐙, onion 🧅'),
    e('p', 'P', 'pig 🐷, pizza 🍕, penguin 🐧, pear 🍐'),
    e('q', 'Q', 'queen 👸, question ❓, quiet 🤫'),
    e('r', 'R', 'rabbit 🐰, rain 🌧️, robot 🤖, rocket 🚀'),
    e('s', 'S', 'sun ☀️, snake 🐍, star ⭐, sock 🧦'),
    e('t', 'T', 'tree 🌳, tiger 🐯, train 🚂, turtle 🐢'),
    e('u', 'U', 'umbrella ☂️, unicorn 🦄, up ⬆️'),
    e('v', 'V', 'van 🚐, violin 🎻, volcano 🌋, vest 🦺'),
    e('w', 'W', 'whale 🐋, watch ⌚, water 💧, worm 🪱'),
    e('x', 'X', 'box 📦, fox 🦊, taxi 🚕'),
    e('y', 'Y', 'yarn 🧶, yogurt 🥣, yacht 🛥️'),
    e('z', 'Z', 'zebra 🦓, zero 0️⃣, pizza 🍕'),
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
export const kindsFor = (age: Age, round: number, level: Level = 2): LetterKind =>
  age === '3-4' ? 'first' : age === '5-6' || level === 1 ? 'missing' : round % 2 === 0 ? 'missing' : 'find';

/** How many letters to choose from, per age and level (Fácil, Normal, Reto, Experto). */
export const LETTER_OPTIONS: Record<Age, Record<Level, number>> = {
  '3-4': { 1: 2, 2: 3, 3: 4, 4: 5 },
  '5-6': { 1: 3, 2: 4, 3: 5, 4: 6 },
  '7-9': { 1: 4, 2: 4, 3: 6, 4: 8 },
};

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
export function makeRound(kind: LetterKind, w: PicWord, age: Age, lang: Lang, rnd: () => number = Math.random, level: Level = 2): LetterRound | null {
  const nOpt = LETTER_OPTIONS[age][level];
  const letters = [...w.word];
  const alphabet = ABC[lang].map((x) => x.letter);
  const plainAt = (i: number) => plain(letters[i]);
  const clean = (i: number) => letters[i] === plainAt(i) && alphabet.includes(letters[i]);
  if (kind === 'first') {
    if (!clean(0)) return null;
    return { kind, word: w.word, pic: w.pic, letter: letters[0], slots: [0], options: options(letters[0], nOpt, alphabet, kind, rnd) };
  }
  if (kind === 'missing') {
    // 5–6 mostly the first letter or a middle consonant; 7–9 anywhere but the first
    const easyStart = age === '5-6' && level < 3;
    const from = easyStart ? 0 : 1;
    const cand = letters.map((_, i) => i).filter((i) => i >= from && clean(i));
    if (!cand.length) return null;
    const i = easyStart && rnd() < (level === 1 ? 0.8 : 0.5) && clean(0) ? 0 : cand[Math.floor(rnd() * cand.length)];
    return { kind, word: w.word, pic: w.pic, letter: letters[i], slots: [i], options: options(letters[i], nOpt, alphabet, kind, rnd) };
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
export function makeRounds(age: Age, lang: Lang, words: PicWord[], n = 5, rnd: () => number = Math.random, level: Level = 2): LetterRound[] {
  // Fácil prefers short words, Reto long ones, Experto the longest
  const usable = usableWords(words, age);
  const sized = level === 1 ? usable.filter((w) => w.word.length <= 5) : level === 3 ? usable.filter((w) => w.word.length >= 5) : level === 4 ? usable.filter((w) => w.word.length >= 6) : usable;
  const pool = shuffle(sized.length >= n * 2 ? sized : usable, rnd);
  const out: LetterRound[] = [];
  for (const w of pool) {
    if (out.length >= n) break;
    const r = makeRound(kindsFor(age, out.length, level), w, age, lang, rnd, level);
    if (r) out.push(r);
  }
  return out;
}

/** How a letter is said: "la eme" / "M". */
export function letterName(letter: string, lang: Lang): string {
  return ABC[lang].find((x) => x.letter === letter)?.name ?? letter;
}
