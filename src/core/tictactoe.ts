import type { Age } from './types';

/** 0 = empty, 1 = first player (Estrella), 2 = second player (Corazón). Cells 0–8, row by row. */
export type Cell = 0 | 1 | 2;
export type Player = 1 | 2;
export type Level = 'easy' | 'medium' | 'hard';

export const LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const emptyBoard = (): Cell[] => Array<Cell>(9).fill(0);
export const other = (p: Player): Player => (p === 1 ? 2 : 1);
export const isFull = (b: Cell[]): boolean => b.every((c) => c !== 0);
const freeCells = (b: Cell[]): number[] => b.flatMap((c, i) => (c === 0 ? [i] : []));

export function winner(b: Cell[]): { who: Player; line: readonly number[] } | null {
  for (const line of LINES) {
    const [a, x, y] = line;
    if (b[a] && b[a] === b[x] && b[a] === b[y]) return { who: b[a] as Player, line };
  }
  return null;
}

/** How hard the computer plays, by age: little ones should win often. */
export const levelFor = (age: Age): Level => (age === '3-4' ? 'easy' : age === '5-6' ? 'medium' : 'hard');

const memo = new Map<string, number>(); // at most 3^9 boards
/** Score of the board for `me` with `turn` to play: +1 win, -1 loss, 0 draw (perfect play). */
function minimax(b: Cell[], me: Player, turn: Player): number {
  const id = b.join('') + me + turn;
  const known = memo.get(id);
  if (known !== undefined) return known;
  const s = search(b, me, turn);
  memo.set(id, s);
  return s;
}
function search(b: Cell[], me: Player, turn: Player): number {
  const w = winner(b);
  if (w) return w.who === me ? 1 : -1;
  if (isFull(b)) return 0;
  let best = turn === me ? -2 : 2;
  for (const i of freeCells(b)) {
    b[i] = turn;
    const s = minimax(b, me, other(turn));
    b[i] = 0;
    best = turn === me ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}

/**
 * The computer's move.
 * - easy: any free cell (it may even miss its own win);
 * - medium: takes a win, blocks most of the time, otherwise random;
 * - hard: wins and blocks always, otherwise plays perfectly — but slips now and then so a child can still win.
 */
export function aiMove(board: Cell[], me: Player, level: Level, rnd: () => number = Math.random): number {
  const free = freeCells(board);
  if (!free.length) return -1;
  const random = () => free[Math.floor(rnd() * free.length)];
  if (level === 'easy') return random();
  const winAt = (who: Player) =>
    free.find((i) => {
      const t = [...board];
      t[i] = who;
      return winner(t)?.who === who;
    });
  const win = winAt(me);
  if (win !== undefined) return win;
  const block = winAt(other(me));
  if (level === 'medium') return block !== undefined && rnd() < 0.6 ? block : random();
  if (block !== undefined) return block;
  if (rnd() < 0.15) return random();
  const b = [...board];
  let best = free[0], bestScore = -2;
  for (const i of free) {
    b[i] = me;
    const s = minimax(b, me, other(me)) + (i === 4 ? 0.1 : [0, 2, 6, 8].includes(i) ? 0.05 : 0);
    b[i] = 0;
    if (s > bestScore) [best, bestScore] = [i, s];
  }
  return best;
}
