import type { Rng } from './math';
import { DATA_KEYS, readJSON, writeJSON } from './storage';
import type { Age } from './types';

/**
 * Tablas de multiplicar with spaced review (Leitner boxes): a fact answered right moves up a box
 * and comes back later; a mistake sends it back to box 0, so it comes back today.
 */

export interface Fact {
  a: number;
  b: number;
}
export interface FactState {
  box: number;
  /** Day number (days since 1970, local) when it is due again. */
  due: number;
}
export type TableState = Record<string, FactState>;

/** Days until the next review for each box. */
export const INTERVALS = [0, 1, 2, 4, 7, 14];
export const MAX_BOX = INTERVALS.length - 1;
/** From this box a fact counts as learned. */
export const LEARNED_BOX = 3;
export const ROUND = 10;

/**
 * Tables each age can practise, in the order new facts are introduced (easiest patterns first, the 1 last):
 * 5–6 count by 2, 5 and 10; 7–9 all of them. Menus show them sorted.
 */
export const TABLES_FOR: Record<Age, number[]> = { '3-4': [], '5-6': [2, 5, 10], '7-9': [2, 5, 10, 3, 4, 6, 7, 8, 9, 1] };

export const factKey = (f: Fact): string => `${f.a}x${f.b}`;
export const factsOf = (table: number): Fact[] => Array.from({ length: 10 }, (_, i) => ({ a: table, b: i + 1 }));

export function dayNumber(d = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
}

/** Updates a fact after an answer (first try only counts as right). Returns the new state. */
export function grade(state: TableState, f: Fact, right: boolean, today: number): FactState {
  const old = state[factKey(f)] ?? { box: 0, due: today };
  const box = right ? Math.min(MAX_BOX, old.box + 1) : 0;
  const next = { box, due: today + INTERVALS[box] };
  state[factKey(f)] = next;
  return next;
}

function shuffle<T>(a: T[], rng: Rng): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Facts for one round.
 * - One table: its 10 facts, but swaps in up to 3 due facts of other tables (mixed practice).
 * - Daily review (`table` null): due facts first, lowest box first; then facts never seen, from the
 *   lowest table not learned yet.
 */
export function pickRound(state: TableState, tables: number[], table: number | null, today: number, rng: Rng = Math.random): Fact[] {
  const due = tables
    .flatMap(factsOf)
    .filter((f) => state[factKey(f)] && state[factKey(f)].due <= today)
    .sort((x, y) => state[factKey(x)].box - state[factKey(y)].box || rng() - 0.5);
  if (table != null) {
    const own = shuffle(factsOf(table), rng);
    const others = due.filter((f) => f.a !== table).slice(0, 3);
    return shuffle([...own.slice(0, ROUND - others.length), ...others], rng);
  }
  const out = due.slice(0, ROUND);
  for (const t of tables) {
    if (out.length >= ROUND) break;
    const fresh = factsOf(t).filter((f) => !state[factKey(f)]);
    out.push(...shuffle(fresh, rng).slice(0, ROUND - out.length));
  }
  if (out.length < ROUND) {
    // everything is learned and nothing is due: practise the least solid facts anyway
    const rest = tables.flatMap(factsOf).filter((f) => !out.some((o) => factKey(o) === factKey(f)));
    rest.sort((x, y) => (state[factKey(x)]?.box ?? 0) - (state[factKey(y)]?.box ?? 0) || rng() - 0.5);
    out.push(...rest.slice(0, ROUND - out.length));
  }
  return shuffle(out, rng);
}

/** How many facts of a table are learned (0–10). */
export const learnedIn = (state: TableState, table: number): number =>
  factsOf(table).filter((f) => (state[factKey(f)]?.box ?? 0) >= LEARNED_BOX).length;

export const dueCount = (state: TableState, tables: number[], today: number): number =>
  tables.flatMap(factsOf).filter((f) => state[factKey(f)] && state[factKey(f)].due <= today).length;

/** Close wrong answers for multiple choice: neighbours in the same table and swapped digits. */
export function tableOptions(f: Fact, n: number, rng: Rng = Math.random): number[] {
  const ans = f.a * f.b;
  const cands = [f.a * (f.b + 1), f.a * (f.b - 1), (f.a + 1) * f.b, (f.a - 1) * f.b, ans + 1, ans - 1, ans + 10, ans - 10].filter((v) => v > 0 && v !== ans);
  const set = new Set<number>([ans]);
  for (const v of shuffle(cands, rng)) if (set.size < n) set.add(v);
  return shuffle([...set], rng);
}

export function loadTables(): TableState {
  const raw = readJSON<unknown>(DATA_KEYS.tables, null);
  const out: TableState = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const st = v as Partial<FactState>;
    if (/^\d+x\d+$/.test(k) && typeof st?.box === 'number' && typeof st?.due === 'number') out[k] = { box: Math.max(0, Math.min(MAX_BOX, st.box)), due: st.due };
  }
  return out;
}
export const saveTables = (s: TableState): void => writeJSON(DATA_KEYS.tables, s);
