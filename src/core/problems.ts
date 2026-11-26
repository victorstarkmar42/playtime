import type { Rng, Sym } from './math';
import type { Age } from './types';

/**
 * Problemas con dibujos: short story problems in Spanish and English.
 * 3–4: join and take away up to 5, with pictures and voice;
 * 5–6: join, take away and compare up to 10, with pictures;
 * 7–9: up to 100, groups (×), sharing (÷) and two steps. For one-step problems the child first
 * chooses the operation, the step where most mistakes happen.
 */

export interface Item {
  pic: string;
  es: [string, string];
  /** Spanish noun is feminine (manzanas → cuántas). */
  fem: boolean;
  en: [string, string];
}
const it = (pic: string, es: string, esPl: string, fem: boolean, en: string, enPl: string): Item => ({ pic, es: [es, esPl], fem, en: [en, enPl] });

export const ITEMS: Item[] = [
  it('🍎', 'manzana', 'manzanas', true, 'apple', 'apples'),
  it('🎈', 'globo', 'globos', false, 'balloon', 'balloons'),
  it('⭐', 'estrella', 'estrellas', true, 'star', 'stars'),
  it('🍪', 'galleta', 'galletas', true, 'cookie', 'cookies'),
  it('🚗', 'carrito', 'carritos', false, 'toy car', 'toy cars'),
  it('🌸', 'flor', 'flores', true, 'flower', 'flowers'),
  it('🐟', 'pez', 'peces', false, 'fish', 'fish'),
  it('✏️', 'lápiz', 'lápices', false, 'pencil', 'pencils'),
  it('🍓', 'fresa', 'fresas', true, 'strawberry', 'strawberries'),
  it('⚽', 'pelota', 'pelotas', true, 'ball', 'balls'),
];
export const NAMES = ['Ana', 'Leo', 'Sofi', 'Tomás', 'Mía', 'Iker', 'Lía', 'Teo'];

export type ProblemKind = 'join' | 'take' | 'compare' | 'groups' | 'share' | 'two';

export interface Problem {
  kind: ProblemKind;
  es: string;
  en: string;
  item: Item;
  answer: number;
  /** Operation that solves it (null for two-step problems). */
  sym: Sym | null;
  /** Pictures: one group per number in the story (empty when the numbers are too big to draw). */
  groups: number[];
  options: number[];
}

const KINDS: Record<Age, ProblemKind[]> = {
  '3-4': ['join', 'take'],
  '5-6': ['join', 'take', 'compare'],
  '7-9': ['join', 'take', 'compare', 'groups', 'share', 'two'],
};
export const kindsFor = (age: Age): ProblemKind[] => KINDS[age];
/** Only the oldest choose the operation first. */
export const choosesOperation = (age: Age): boolean => age === '7-9';
export const SYM_OF: Record<ProblemKind, Sym | null> = { join: '+', take: '−', compare: '−', groups: '×', share: '÷', two: null };

const int = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
const pick = <T>(rng: Rng, a: readonly T[]): T => a[Math.floor(rng() * a.length)];

/** "1 manzana" / "3 manzanas". */
export const countEs = (n: number, i: Item): string => `${n} ${n === 1 ? i.es[0] : i.es[1]}`;
export const countEn = (n: number, i: Item): string => `${n} ${n === 1 ? i.en[0] : i.en[1]}`;
const cuantos = (i: Item) => (i.fem ? 'Cuántas' : 'Cuántos');

export function makeProblem(age: Age, rng: Rng = Math.random, kind?: ProblemKind): Problem {
  const k = kind ?? pick(rng, KINDS[age]);
  const item = pick(rng, ITEMS);
  const n1 = pick(rng, NAMES);
  let n2 = pick(rng, NAMES);
  while (n2 === n1) n2 = pick(rng, NAMES);
  const max = age === '3-4' ? 5 : age === '5-6' ? 10 : 100;
  const big = age === '7-9';
  let es = '', en = '', answer = 0;
  let groups: number[] = [];
  const P = (n: number) => countEs(n, item);
  const E = (n: number) => countEn(n, item);
  const pl = item.es[1], plEn = item.en[1];

  switch (k) {
    case 'join': {
      const total = big ? int(rng, 12, max) : int(rng, 2, max);
      const a = int(rng, 1, total - 1), b = total - a;
      es = `${n1} tiene ${P(a)}. Le regalan ${b} más. ¿${cuantos(item)} ${pl} tiene ahora?`;
      en = `${n1} has ${E(a)}. Someone gives ${n1} ${b} more. How many ${plEn} does ${n1} have now?`;
      answer = total;
      groups = [a, b];
      break;
    }
    case 'take': {
      const a = big ? int(rng, 12, max) : int(rng, 2, max);
      const b = int(rng, 1, a - 1);
      es = `${n1} tiene ${P(a)} y le da ${b} a ${n2}. ¿${cuantos(item)} ${pl} le quedan a ${n1}?`;
      en = `${n1} has ${E(a)} and gives ${b} to ${n2}. How many ${plEn} does ${n1} have left?`;
      answer = a - b;
      groups = [a];
      break;
    }
    case 'compare': {
      const a = big ? int(rng, 12, max) : int(rng, 3, max);
      const b = int(rng, 1, a - 1);
      es = `${n1} tiene ${P(a)} y ${n2} tiene ${P(b)}. ¿${cuantos(item)} ${pl} más tiene ${n1} que ${n2}?`;
      en = `${n1} has ${E(a)} and ${n2} has ${E(b)}. How many more ${plEn} does ${n1} have than ${n2}?`;
      answer = a - b;
      groups = [a, b];
      break;
    }
    case 'groups': {
      const a = int(rng, 2, 9), b = int(rng, 2, 9);
      es = `Hay ${a} cajas y en cada caja hay ${P(b)}. ¿${cuantos(item)} ${pl} hay en total?`;
      en = `There are ${a} boxes with ${E(b)} in each box. How many ${plEn} are there in all?`;
      answer = a * b;
      groups = Array.from({ length: a }, () => b);
      break;
    }
    case 'share': {
      const b = int(rng, 2, 6), q = int(rng, 2, 9);
      es = `${n1} reparte ${P(b * q)} entre ${b} amigos, en partes iguales. ¿${cuantos(item)} ${pl} le tocan a cada amigo?`;
      en = `${n1} shares ${E(b * q)} equally among ${b} friends. How many ${plEn} does each friend get?`;
      answer = q;
      groups = [b * q];
      break;
    }
    case 'two': {
      const a = int(rng, 10, 40), b = int(rng, 5, 30);
      const c = int(rng, 2, a + b - 1);
      es = `${n1} tiene ${P(a)}. Compra ${b} más y después le da ${c} a ${n2}. ¿${cuantos(item)} ${pl} tiene ${n1} al final?`;
      en = `${n1} has ${E(a)}. ${n1} buys ${b} more and then gives ${c} to ${n2}. How many ${plEn} does ${n1} have at the end?`;
      answer = a + b - c;
      groups = [];
      break;
    }
  }
  if (groups.reduce((x, y) => x + y, 0) > 30) groups = [];
  const n = age === '3-4' ? 3 : 4;
  const set = new Set([answer]);
  for (let guard = 0; set.size < n && guard < 100; guard++) {
    const d = int(rng, 1, Math.max(2, Math.round(answer * 0.15)));
    const v = rng() < 0.5 ? answer - d : answer + d;
    if (v >= 0) set.add(v);
  }
  const options = [...set];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { kind: k, es, en, item, answer, sym: SYM_OF[k], groups, options };
}
