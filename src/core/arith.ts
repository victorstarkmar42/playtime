import { evaluate, type Op, type Rng } from './math';
import type { Level } from './settings';
import type { Age } from './types';

/* ---------------- Cuentas: practice by operation ---------------- */

export type MathKind = 'count' | 'sum' | 'sub' | 'missing' | 'mul' | 'div' | 'mix';

/** What each age can choose (the youngest only count). */
export const KINDS_FOR: Record<Age, MathKind[]> = {
  '3-4': ['count'],
  '5-6': ['count', 'sum', 'sub', 'missing', 'mix'],
  '7-9': ['sum', 'sub', 'missing', 'mul', 'div', 'mix'],
};

export interface MathQuestion {
  op: Op;
  answer: number;
  /** Shuffled choices including the answer. */
  options: number[];
  /** "What number is missing?": which side of the operation is hidden (4 + ? = 5). */
  hide?: 'a' | 'b';
}

const int = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1));

/** Number ranges per age and level (Fácil, Normal, Reto, Experto); Normal is what each age always had. */
export const MATH_RANGE: Record<Age, Record<Level, { count: [number, number]; total: [number, number]; mul: [number, number]; div: [number, number] }>> = {
  '3-4': { 1: { count: [1, 5], total: [2, 5], mul: [1, 5], div: [2, 5] }, 2: { count: [1, 10], total: [2, 10], mul: [1, 5], div: [2, 5] }, 3: { count: [5, 15], total: [2, 10], mul: [1, 5], div: [2, 5] }, 4: { count: [10, 20], total: [5, 15], mul: [1, 5], div: [2, 5] } },
  '5-6': { 1: { count: [1, 10], total: [2, 5], mul: [1, 5], div: [2, 5] }, 2: { count: [1, 20], total: [2, 10], mul: [1, 5], div: [2, 5] }, 3: { count: [10, 30], total: [6, 20], mul: [1, 5], div: [2, 5] }, 4: { count: [20, 40], total: [10, 50], mul: [2, 5], div: [2, 5] } },
  '7-9': { 1: { count: [1, 20], total: [11, 50], mul: [1, 5], div: [2, 5] }, 2: { count: [1, 20], total: [11, 100], mul: [1, 10], div: [2, 10] }, 3: { count: [1, 20], total: [50, 200], mul: [2, 12], div: [2, 12] }, 4: { count: [1, 20], total: [200, 999], mul: [6, 15], div: [3, 15] } },
};

function opFor(kind: Exclude<MathKind, 'mix' | 'missing'>, age: Age, rng: Rng, level: Level): Op {
  const R = MATH_RANGE[age][level];
  switch (kind) {
    case 'count':
      return { kind: 'count', n: int(rng, R.count[0], R.count[1]) };
    case 'sum': {
      const total = int(rng, R.total[0], R.total[1]);
      const a = int(rng, 1, total - 1);
      return { kind: 'calc', a, sym: '+', b: total - a };
    }
    case 'sub': {
      const a = int(rng, R.total[0], R.total[1]);
      return { kind: 'calc', a, sym: '−', b: int(rng, 1, a - 1) };
    }
    case 'mul':
      return { kind: 'calc', a: int(rng, R.mul[0], R.mul[1]), sym: '×', b: int(rng, R.mul[0], R.mul[1]) };
    case 'div': {
      const b = int(rng, R.div[0], R.div[1]), q = int(rng, 1, R.div[1]);
      return { kind: 'calc', a: b * q, sym: '÷', b };
    }
  }
}

/** One question; wrong choices sit close to the answer so the child has to work it out. */
export function mathQuestion(kind: MathKind, age: Age, rng: Rng = Math.random, level: Level = 2): MathQuestion {
  const pool = KINDS_FOR[age].filter((k) => k !== 'mix') as Exclude<MathKind, 'mix'>[];
  const k = kind === 'mix' ? pool[int(rng, 0, pool.length - 1)] : (kind as Exclude<MathKind, 'mix'>);
  let op: Op;
  let answer: number;
  let hide: 'a' | 'b' | undefined;
  if (k === 'missing') {
    // 4 + ? = 5, ? − 3 = 6 …: sums and subtractions (and, for 7–9, some multiplications)
    const base = age === '7-9' && rng() < 0.25 ? 'mul' : rng() < 0.5 ? 'sum' : 'sub';
    op = opFor(base, age, rng, level);
    hide = rng() < 0.5 ? 'a' : 'b';
    answer = op.kind === 'calc' ? op[hide] : 0;
  } else {
    op = opFor(k, age, rng, level);
    answer = evaluate(op);
  }
  const n = age === '3-4' ? 3 : 4;
  const set = new Set([answer]);
  for (let guard = 0; set.size < n && guard < 100; guard++) {
    const d = int(rng, 1, Math.max(3, Math.round(answer * 0.2)));
    const v = rng() < 0.5 ? answer - d : answer + d;
    if (v >= 0) set.add(v);
  }
  const options = [...set];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return hide ? { op, answer, options, hide } : { op, answer, options };
}

const SAY: Record<string, { es: string; en: string }> = { '+': { es: 'más', en: 'plus' }, '−': { es: 'menos', en: 'minus' }, '×': { es: 'por', en: 'times' }, '÷': { es: 'entre', en: 'divided by' } };

/** "4 + ? = 5" for missing-number questions, "4 + 1 = ?" otherwise. */
export function questionText(q: MathQuestion): string {
  const op = q.op;
  if (op.kind !== 'calc') return '';
  if (!q.hide) return `${op.a} ${op.sym} ${op.b} = ?`;
  return `${q.hide === 'a' ? '?' : op.a} ${op.sym} ${q.hide === 'b' ? '?' : op.b} = ${evaluate(op)}`;
}

/** How a missing-number question is said aloud: "4 más ¿qué número? es igual a 5". */
export function missingWords(q: MathQuestion, lang: 'es' | 'en'): string {
  const op = q.op;
  if (op.kind !== 'calc') return '';
  const what = lang === 'es' ? '¿qué número?' : 'what number';
  const a = q.hide === 'a' ? what : String(op.a);
  const b = q.hide === 'b' ? what : String(op.b);
  return lang === 'es' ? `${a} ${SAY[op.sym].es} ${b} es igual a ${evaluate(op)}` : `${a} ${SAY[op.sym].en} ${b} equals ${evaluate(op)}`;
}

/* ---------------- Ábaco ---------------- */

/**
 * - 3–4: one row of 10 beads, numbers 1–10;
 * - 5–6: two rows of 10 (the second row counts after the first is full), numbers 1–20;
 * - 7–9: place value: centenas, decenas, unidades, 0–9 beads each, numbers 10–999.
 */
export interface AbacusSpec {
  rows: number;
  beads: number;
  placeValue: boolean;
  min: number;
  max: number;
}
export const abacusFor = (age: Age): AbacusSpec =>
  age === '3-4'
    ? { rows: 1, beads: 10, placeValue: false, min: 1, max: 10 }
    : age === '5-6'
      ? { rows: 2, beads: 10, placeValue: false, min: 1, max: 20 }
      : { rows: 3, beads: 9, placeValue: true, min: 10, max: 999 };

/** Value shown: plain count, or hundreds/tens/units from the top row down. */
export function abacusValue(rows: number[], spec: AbacusSpec): number {
  if (!spec.placeValue) return rows.reduce((a, b) => a + b, 0);
  return rows.reduce((acc, v) => acc * 10 + v, 0);
}

/** Touching bead `i` (0 = leftmost) of a row holding `v` beads to the left: it moves, and every bead between. */
export const touchBead = (v: number, i: number): number => (i < v ? i : i + 1);

export const abacusTarget = (spec: AbacusSpec, rng: Rng = Math.random): number => int(rng, spec.min, spec.max);
