import type { Age, Lang } from './types';

export type Sym = '+' | '−' | '×' | '÷';
export type Op =
  | { kind: 'start' }
  | { kind: 'count'; n: number }
  | { kind: 'calc'; a: number; sym: Sym; b: number };
export type Skill = 'seq' | 'count' | 'sum' | 'sub' | 'mul' | 'div' | 'read' | 'syl' | 'prob';
export type Rng = () => number;

const rnd = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
const calc = (a: number, sym: Sym, b: number): Op => ({ kind: 'calc', a, sym, b });

/**
 * The operation whose answer is `n`, the number of the next dot.
 * Dots are numbered 1..N, so every answer points to exactly one dot.
 *  - 3–4: count n stars
 *  - 5–6: sums and subtractions within 20
 *  - 7–9: multiplications, exact divisions (dividend ≤ 100) and some sums/subtractions
 */
export function makeOp(n: number, age: Age, rng: Rng = Math.random): Op {
  if (n <= 1) return { kind: 'start' };
  if (age === '3-4') return { kind: 'count', n };

  if (age === '5-6') {
    if (n > 18 || rng() < 0.55) {
      const a = rnd(rng, 1, n - 1);
      return calc(a, '+', n - a);
    }
    const b = rnd(rng, 1, Math.min(5, 20 - n));
    return calc(n + b, '−', b);
  }

  const pairs: [number, number][] = [];
  for (let a = 2; a * a <= n; a++) if (n % a === 0) pairs.push([a, n / a]);
  const r = rng();
  if (pairs.length > 0 && r < 0.6) {
    const [a, b] = pairs[rnd(rng, 0, pairs.length - 1)];
    return rng() < 0.5 ? calc(a, '×', b) : calc(b, '×', a);
  }
  const maxD = Math.min(5, Math.floor(100 / n));
  if (maxD >= 2 && r < 0.85) {
    const d = rnd(rng, 2, maxD);
    return calc(n * d, '÷', d);
  }
  if (rng() < 0.5) {
    const b = rnd(rng, 1, 20);
    return calc(n + b, '−', b);
  }
  const a = rnd(rng, 1, n - 1);
  return calc(a, '+', n - a);
}

/** ops[n] is the operation that leads to dot n (index 0 unused). */
export function makeOps(count: number, age: Age, rng: Rng = Math.random): Op[] {
  const ops: Op[] = [{ kind: 'start' }];
  for (let n = 1; n <= count; n++) ops.push(makeOp(n, age, rng));
  return ops;
}

export function evaluate(op: Op): number {
  if (op.kind === 'start') return 1;
  if (op.kind === 'count') return op.n;
  switch (op.sym) {
    case '+':
      return op.a + op.b;
    case '−':
      return op.a - op.b;
    case '×':
      return op.a * op.b;
    case '÷':
      return op.a / op.b;
  }
}

export function skillOf(op: Op): Skill {
  if (op.kind === 'start') return 'seq';
  if (op.kind === 'count') return 'count';
  return ({ '+': 'sum', '−': 'sub', '×': 'mul', '÷': 'div' } as const)[op.sym];
}

export function opText(op: Op): string {
  return op.kind === 'calc' ? `${op.a} ${op.sym} ${op.b}` : '';
}

const WORDS: Record<Sym, Record<Lang, string>> = {
  '+': { es: 'más', en: 'plus' },
  '−': { es: 'menos', en: 'minus' },
  '×': { es: 'por', en: 'times' },
  '÷': { es: 'entre', en: 'divided by' },
};

export function opWords(op: Op, lang: Lang): string {
  if (op.kind === 'calc') return `${op.a} ${WORDS[op.sym][lang]} ${op.b}`;
  if (op.kind === 'count') return lang === 'es' ? '¿Cuántas estrellas hay?' : 'How many stars?';
  return lang === 'es' ? 'Toca el uno' : 'Touch number one';
}
