import type { Level } from './settings';
import type { Rng } from './math';
import type { Age } from './types';

const int = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
function shuffle<T>(a: T[], rng: Rng): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

/* =============================== Laberinto =============================== */

/** Walls of each cell as a bitmask: N 1, E 2, S 4, W 8. Start top-left, goal bottom-right. */
export interface Maze {
  w: number;
  h: number;
  walls: number[];
}
export const N = 1, E = 2, S = 4, W = 8;
export const DIRS = [
  { bit: N, dx: 0, dy: -1, back: S },
  { bit: E, dx: 1, dy: 0, back: W },
  { bit: S, dx: 0, dy: 1, back: N },
  { bit: W, dx: -1, dy: 0, back: E },
] as const;

/** Columns × rows per age and level (Fácil, Normal, Reto). Normal grew a little in 0.17. */
export const MAZE_SIZES: Record<Age, Record<Level, [number, number]>> = {
  '3-4': { 1: [4, 3], 2: [5, 4], 3: [6, 5] },
  '5-6': { 1: [6, 4], 2: [8, 6], 3: [10, 7] },
  '7-9': { 1: [9, 7], 2: [12, 9], 3: [15, 11] },
};
export const mazeSize = (age: Age, level: Level = 2): [number, number] => MAZE_SIZES[age][level];

/** Perfect maze (exactly one path between any two cells), carved by a depth-first walk. */
export function makeMaze(w: number, h: number, rng: Rng = Math.random): Maze {
  const walls = Array(w * h).fill(N | E | S | W);
  const seen = new Uint8Array(w * h);
  const stack = [0];
  seen[0] = 1;
  while (stack.length) {
    const c = stack[stack.length - 1];
    const x = c % w, y = Math.floor(c / w);
    const opts = DIRS.filter((d) => {
      const nx = x + d.dx, ny = y + d.dy;
      return nx >= 0 && ny >= 0 && nx < w && ny < h && !seen[ny * w + nx];
    });
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const d = opts[int(rng, 0, opts.length - 1)];
    const n = (y + d.dy) * w + x + d.dx;
    walls[c] &= ~d.bit;
    walls[n] &= ~d.back;
    seen[n] = 1;
    stack.push(n);
  }
  return { w, h, walls };
}

/** Can you step from cell `c` to the neighbour cell `n`? (adjacent and no wall between) */
export function canStep(m: Maze, c: number, n: number): boolean {
  const x = c % m.w, y = Math.floor(c / m.w);
  return DIRS.some((d) => (y + d.dy) * m.w + x + d.dx === n && x + d.dx >= 0 && x + d.dx < m.w && y + d.dy >= 0 && y + d.dy < m.h && !(m.walls[c] & d.bit));
}

/** Shortest path from start to goal (cell indices), for tests and hints. */
export function solveMaze(m: Maze): number[] {
  const goal = m.w * m.h - 1;
  const prev = new Int32Array(m.w * m.h).fill(-1);
  prev[0] = 0;
  const q = [0];
  while (q.length) {
    const c = q.shift()!;
    if (c === goal) break;
    const x = c % m.w, y = Math.floor(c / m.w);
    for (const d of DIRS) {
      if (m.walls[c] & d.bit) continue;
      const n = (y + d.dy) * m.w + x + d.dx;
      if (prev[n] === -1) {
        prev[n] = c;
        q.push(n);
      }
    }
  }
  const path = [goal];
  while (path[0] !== 0) path.unshift(prev[path[0]]);
  return path;
}

/* =============================== Sudoku =============================== */

/** 3–4: 4×4 with pictures and few gaps; 5–6: 4×4 with numbers; 7–9: 6×6 (boxes of 2×3). */
export interface SudokuSpec {
  n: number;
  boxW: number;
  boxH: number;
  blanks: number;
  pictures: boolean;
}
export const sudokuFor = (age: Age): SudokuSpec =>
  age === '3-4'
    ? { n: 4, boxW: 2, boxH: 2, blanks: 4, pictures: true }
    : age === '5-6'
      ? { n: 4, boxW: 2, boxH: 2, blanks: 8, pictures: false }
      : { n: 6, boxW: 3, boxH: 2, blanks: 18, pictures: false };

export interface Sudoku {
  spec: SudokuSpec;
  /** Full solution, values 1..n, row by row. */
  solution: number[];
  /** Puzzle: 0 = empty. */
  given: number[];
}

/** Is value v allowed at cell i of the (partial) grid g? */
export function sudokuAllows(g: number[], spec: SudokuSpec, i: number, v: number): boolean {
  const { n, boxW, boxH } = spec;
  const r = Math.floor(i / n), c = i % n;
  for (let k = 0; k < n; k++) {
    if (k !== c && g[r * n + k] === v) return false;
    if (k !== r && g[k * n + c] === v) return false;
  }
  const br = r - (r % boxH), bc = c - (c % boxW);
  for (let y = br; y < br + boxH; y++) for (let x = bc; x < bc + boxW; x++) if (y * n + x !== i && g[y * n + x] === v) return false;
  return true;
}

/** Number of solutions, stopping at `limit`. */
export function countSolutions(g: number[], spec: SudokuSpec, limit = 2): number {
  const i = g.indexOf(0);
  if (i < 0) return 1;
  let total = 0;
  for (let v = 1; v <= spec.n && total < limit; v++) {
    if (!sudokuAllows(g, spec, i, v)) continue;
    g[i] = v;
    total += countSolutions(g, spec, limit - total);
    g[i] = 0;
  }
  return total;
}

/** A shuffled valid grid, then cells emptied one by one while the answer stays unique. */
export function makeSudoku(spec: SudokuSpec, rng: Rng = Math.random): Sudoku {
  const { n, boxW, boxH } = spec;
  const base = (r: number, c: number) => ((r % boxH) * boxW + Math.floor(r / boxH) + c) % n;
  // shuffle rows inside bands, bands, columns inside stacks, stacks, and the symbols
  const bands = shuffle([...Array(n / boxH).keys()], rng).flatMap((b) => shuffle([...Array(boxH).keys()], rng).map((r) => b * boxH + r));
  const stacks = shuffle([...Array(n / boxW).keys()], rng).flatMap((s) => shuffle([...Array(boxW).keys()], rng).map((c) => s * boxW + c));
  const sym = shuffle([...Array(n).keys()].map((k) => k + 1), rng);
  const solution = Array.from({ length: n * n }, (_, i) => sym[base(bands[Math.floor(i / n)], stacks[i % n])]);
  const given = [...solution];
  let removed = 0;
  for (const i of shuffle([...Array(n * n).keys()], rng)) {
    if (removed >= spec.blanks) break;
    const keep = given[i];
    given[i] = 0;
    if (countSolutions([...given], spec) === 1) removed++;
    else given[i] = keep;
  }
  return { spec, solution, given };
}

/* =============================== Crucigrama =============================== */

export interface Placed {
  word: string;
  x: number;
  y: number;
  across: boolean;
  /** Clue number shown in the first cell. */
  num: number;
}
export interface Crossword {
  w: number;
  h: number;
  /** Letter of each cell, '' when unused. */
  cells: string[];
  words: Placed[];
}

/** How many words and how long, and how many letters come already written. */
export const crosswordFor = (age: Age) =>
  age === '3-4'
    ? { words: 2, maxLen: 5, reveal: 0.6 }
    : age === '5-6'
      ? { words: 3, maxLen: 6, reveal: 0.3 }
      : { words: 5, maxLen: 9, reveal: 0 };

/**
 * Greedy crossword: the first word goes across, every next word must cross a letter already on the
 * board without touching other words side by side. Words that do not fit are skipped.
 */
export function makeCrossword(candidates: string[], count: number, rng: Rng = Math.random): Crossword {
  const SIZE = 21;
  const grid = new Map<string, string>();
  const at = (x: number, y: number) => grid.get(`${x},${y}`) ?? '';
  const placed: Omit<Placed, 'num'>[] = [];

  const fits = (word: string, x: number, y: number, across: boolean): boolean => {
    const L = [...word];
    const dx = across ? 1 : 0, dy = across ? 0 : 1;
    if (at(x - dx, y - dy) || at(x + dx * L.length, y + dy * L.length)) return false;
    let crosses = 0;
    for (let k = 0; k < L.length; k++) {
      const cx = x + dx * k, cy = y + dy * k;
      if (cx < 0 || cy < 0 || cx >= SIZE || cy >= SIZE) return false;
      const cur = at(cx, cy);
      if (cur) {
        if (cur !== L[k]) return false;
        crosses++;
      } else if (at(cx + dy, cy + dx) || at(cx - dy, cy - dx)) return false; // side neighbours
    }
    return crosses > 0 && crosses < L.length;
  };
  const put = (word: string, x: number, y: number, across: boolean) => {
    [...word].forEach((ch, k) => grid.set(`${x + (across ? k : 0)},${y + (across ? 0 : k)}`, ch));
    placed.push({ word, x, y, across });
  };

  for (const word of shuffle(candidates, rng)) {
    if (placed.length >= count) break;
    if (placed.some((p) => p.word === word)) continue;
    if (!placed.length) {
      put(word, Math.floor((SIZE - [...word].length) / 2), Math.floor(SIZE / 2), true);
      continue;
    }
    const spots: [number, number, boolean][] = [];
    const L = [...word];
    for (const p of placed) {
      [...p.word].forEach((ch, k) => {
        const px = p.x + (p.across ? k : 0), py = p.y + (p.across ? 0 : k);
        L.forEach((c, j) => {
          if (c !== ch) return;
          const across = !p.across;
          const x = across ? px - j : px, y = across ? py : py - j;
          if (fits(word, x, y, across)) spots.push([x, y, across]);
        });
      });
    }
    if (spots.length) put(word, ...spots[int(rng, 0, spots.length - 1)]);
  }

  // crop to the used area and number the clues in reading order
  const xs = [...grid.keys()].map((k) => +k.split(',')[0]);
  const ys = [...grid.keys()].map((k) => +k.split(',')[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  const w = Math.max(...xs) - x0 + 1, h = Math.max(...ys) - y0 + 1;
  const cells = Array.from({ length: w * h }, (_, i) => at(x0 + (i % w), y0 + Math.floor(i / w)));
  const order = [...placed].sort((a, b) => a.y - b.y || a.x - b.x);
  const nums = new Map<string, number>();
  const words = order.map((p) => {
    const key = `${p.x},${p.y}`;
    if (!nums.has(key)) nums.set(key, nums.size + 1);
    return { ...p, x: p.x - x0, y: p.y - y0, num: nums.get(key)! };
  });
  return { w, h, cells, words };
}
