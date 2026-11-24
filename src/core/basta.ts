import { WORD_SECTIONS, type PicWord } from '../content/wordbank';
import { plain } from './letters';
import type { Age, Lang } from './types';

/**
 * Basta en rueda de letras: a category card, a wheel of letters and a short timer. On your turn you
 * say a word of the category out loud and press its first letter; each letter is used once.
 * Whoever runs out of time loses the round.
 */

export interface BastaCategory {
  es: string;
  en: string;
  /** Word section that gives picture hints and Robi's answers. */
  section: string;
}

export const BASTA_CATEGORIES: BastaCategory[] = [
  { es: 'Un animal', en: 'An animal', section: 'animales' },
  { es: 'Algo de comer', en: 'Something to eat', section: 'comida' },
  { es: 'Una parte del cuerpo', en: 'A body part', section: 'cuerpo' },
  { es: 'Ropa', en: 'Clothes', section: 'ropa' },
  { es: 'Algo de la casa', en: 'Something at home', section: 'casa' },
  { es: 'Algo de la naturaleza', en: 'Something in nature', section: 'naturaleza' },
  { es: 'Algo que se mueve con ruedas, alas o motor', en: 'Something that takes you places', section: 'transporte' },
  { es: 'Algo de la escuela', en: 'Something at school', section: 'escuela' },
  { es: 'Un oficio', en: 'A job', section: 'oficios' },
  { es: 'Un lugar', en: 'A place', section: 'lugares' },
];

/** Letters on the wheel: few and common for the little ones, more for the older ones. */
export function bastaLetters(age: Age): string[] {
  if (age === '3-4') return 'ABCDEGLMOPST'.split('');
  if (age === '5-6') return 'ABCDEFGHILMNOPRSTV'.split('');
  return 'ABCDEFGHIJLMNOPQRSTUVZ'.split('');
}

/** Seconds per turn. */
export const BASTA_SECONDS: Record<Age, number> = { '3-4': 20, '5-6': 15, '7-9': 10 };

/** How often Robi "runs out of time" on purpose, so little ones win often. */
export const ROBI_SLIP: Record<Age, number> = { '3-4': 0.3, '5-6': 0.15, '7-9': 0.06 };

const firstLetter = (word: string): string => plain(word.trim()[0]?.toLowerCase() ?? '').toUpperCase();

/** Picture words of the category whose first letter is still free on the wheel. */
export function bastaHints(cat: BastaCategory, lang: Lang, letters: string[], used: string[]): PicWord[] {
  const words = WORD_SECTIONS.find((s) => s.id === cat.section)?.words ?? [];
  return words.filter((w) => {
    const l = firstLetter(w[lang]);
    return letters.includes(l) && !used.includes(l);
  });
}

/** Robi's answer: a real word of the category with a free letter, or null when he can't find one. */
export function robiAnswer(cat: BastaCategory, lang: Lang, letters: string[], used: string[], rnd: () => number = Math.random): { letter: string; word: PicWord } | null {
  const options = bastaHints(cat, lang, letters, used);
  if (!options.length) return null;
  const word = options[Math.floor(rnd() * options.length)];
  return { letter: firstLetter(word[lang]), word };
}

export { firstLetter as bastaFirstLetter };
