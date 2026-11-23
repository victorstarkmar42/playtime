import { evaluate, type Op, type Rng } from './math';
import type { Age } from './types';

/* ---------------- Cuentas: practice by operation ---------------- */

export type MathKind = 'count' | 'sum' | 'sub' | 'mul' | 'div' | 'mix';

/** What each age can choose (the youngest only count). */
export const KINDS_FOR: Record<Age, MathKind[]> = {
  '3-4': ['count'],
  '5-6': ['count', 'sum', 'sub', 'mix'],
  '7-9': ['sum', 'sub', 'mul', 'div', 'mix'],
};

export interface MathQuestion {
  op: Op;
  answer: number;
  /** Shuffled choices including the answer. */
  options: number[];
}

const int = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1));

function opFor(kind: Exclude<MathKind, 'mix'>, age: Age, rng: Rng): Op {
  const small = age !== '7-9';
  switch (kind) {
    case 'count':
      return { kind: 'count', n: int(rng, 1, age === '3-4' ? 10 : 20) };
    case 'sum': {
      // 5–6: total up to 10; 7–9: up to 100
      const total = small ? int(rng, 2, 10) : int(rng, 11, 100);
      const a = int(rng, 1, total - 1);
      return { kind: 'calc', a, sym: '+', b: total - a };
    }
    case 'sub': {
      const a = small ? int(rng, 2, 10) : int(rng, 11, 100);
      return { kind: 'calc', a, sym: '−', b: int(rng, 1, a - 1) };
    }
    case 'mul':
      return { kind: 'calc', a: int(rng, 1, 10), sym: '×', b: int(rng, 1, 10) };
    case 'div': {
      const b = int(rng, 2, 10), q = int(rng, 1, 10);
      return { kind: 'calc', a: b * q, sym: '÷', b };
    }
  }
}

/** One question; wrong choices sit close to the answer so the child has to work it out. */
export function mathQuestion(kind: MathKind, age: Age, rng: Rng = Math.random): MathQuestion {
  const pool = KINDS_FOR[age].filter((k) => k !== 'mix') as Exclude<MathKind, 'mix'>[];
  const k = kind === 'mix' ? pool[int(rng, 0, pool.length - 1)] : (kind as Exclude<MathKind, 'mix'>);
  const op = opFor(k, age, rng);
  const answer = evaluate(op);
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
  return { op, answer, options };
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
