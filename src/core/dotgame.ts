import { dist, type Pt } from './geometry';

export interface DotGame {
  dots: Pt[];
  /** How many dots are joined; the next target is dots[connected]. */
  connected: number;
  done: boolean;
}

export type Hit = { type: 'connect' } | { type: 'wrong'; index: number } | { type: 'none' };

export function createGame(dots: Pt[], connected = 0): DotGame {
  const c = Math.max(0, Math.min(connected, dots.length));
  return { dots, connected: c, done: c === dots.length && dots.length > 0 };
}

/**
 * Gentle hit test. The next dot wins whenever the pointer is inside its (large) touch area.
 * That area is capped at 70 % of the distance from the previous dot, so touching the dot you are
 * already on never skips ahead. A different dot only counts as a mistake inside a small radius.
 */
export function hitTest(g: DotGame, p: Pt, opts: { hitR: number; dotR: number }): Hit {
  if (g.done) return { type: 'none' };
  const nx = g.connected;
  const target = g.dots[nx];
  let hr = opts.hitR;
  if (nx > 0) hr = Math.max(opts.dotR * 1.3, Math.min(hr, 0.7 * dist(target, g.dots[nx - 1])));
  if (dist(p, target) <= hr) return { type: 'connect' };

  const wrongR = opts.dotR * 1.6;
  for (let i = nx + 1; i < g.dots.length; i++) {
    if (dist(p, g.dots[i]) <= wrongR) return { type: 'wrong', index: i };
  }
  return { type: 'none' };
}

/** Joins the next dot. Returns true when that closed the drawing. */
export function connectNext(g: DotGame): boolean {
  if (g.done) return true;
  g.connected++;
  g.done = g.connected === g.dots.length;
  return g.done;
}
