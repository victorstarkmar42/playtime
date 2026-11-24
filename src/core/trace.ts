import { arcPts, dist, type Pt } from './geometry';
import type { Age } from './types';

/** A figure to trace with a finger: one or more strokes in the 0–100 box, each followed from its first point. */
export interface TraceFigure {
  id: string;
  group: 'shapes' | 'numbers' | 'drawings';
  es: string;
  en: string;
  strokes: Pt[][];
}

/** How far (box units) the finger may stray from the line and still light it up. */
export const TRACE_TOL: Record<Age, number> = { '3-4': 10, '5-6': 7.5, '7-9': 6 };
/** Distance between samples along a stroke, in box units. */
export const TRACE_STEP = 0.7;

const ellipse = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 90): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as const;
  });

const close = (p: Pt[]): Pt[] => [...p, p[0]];

function heart(): Pt[] {
  return Array.from({ length: 121 }, (_, i) => {
    const t = (i / 120) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [50 + x * 2.2, 50 + y * 2.2] as const;
  });
}

function starPts(): Pt[] {
  return close(Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 15 : 36;
    return [50 + r * Math.cos(a), 54 + r * Math.sin(a)] as const;
  }));
}

function spiral(): Pt[] {
  return Array.from({ length: 241 }, (_, i) => {
    const t = i / 240;
    const a = t * Math.PI * 2 * 2.75;
    const r = 3 + 31 * t;
    return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as const;
  });
}

const wave = (): Pt[] => Array.from({ length: 81 }, (_, i) => [12 + i * 0.95, 50 - 14 * Math.sin((i / 80) * Math.PI * 4)] as const);

export const TRACE_SHAPES: TraceFigure[] = [
  { id: 'olas', group: 'shapes', es: 'Olas', en: 'Waves', strokes: [wave()] },
  { id: 'montanas', group: 'shapes', es: 'Montañas', en: 'Mountains', strokes: [[[12, 66], [27, 34], [42, 66], [57, 34], [72, 66], [88, 34]]] },
  { id: 'circulo', group: 'shapes', es: 'Círculo', en: 'Circle', strokes: [arcPts(50, 50, 33, 270, -90)] },
  { id: 'cuadrado', group: 'shapes', es: 'Cuadrado', en: 'Square', strokes: [close([[20, 20], [80, 20], [80, 80], [20, 80]])] },
  { id: 'triangulo', group: 'shapes', es: 'Triángulo', en: 'Triangle', strokes: [close([[50, 16], [84, 80], [16, 80]])] },
  { id: 'rombo', group: 'shapes', es: 'Rombo', en: 'Diamond', strokes: [close([[50, 14], [80, 50], [50, 86], [20, 50]])] },
  { id: 'corazon', group: 'shapes', es: 'Corazón', en: 'Heart', strokes: [heart()] },
  { id: 'estrella', group: 'shapes', es: 'Estrella', en: 'Star', strokes: [starPts()] },
  { id: 'luna', group: 'shapes', es: 'Luna', en: 'Moon', strokes: [[...arcPts(50, 50, 32, -60, -300), ...arcPts(64, 50, 27.8, 85.9, 274.1)]] },
  { id: 'espiral', group: 'shapes', es: 'Espiral', en: 'Spiral', strokes: [spiral()] },
];

const NUM_ES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const NUM_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const DIGITS: Pt[][][] = [
  [ellipse(50, 50, 18, 30, 270, -90)],
  [[[38, 32], [53, 20], [53, 80]]],
  [[...arcPts(50, 36, 16, 200, 390), [34, 80], [68, 80]]],
  [[...arcPts(50, 35, 14, 200, 450), ...arcPts(50, 64.5, 15.5, 270, 520)]],
  [[[60, 80], [60, 20], [32, 62], [72, 62]]],
  [[[66, 20], [38, 20], [38, 49], ...arcPts(50, 61, 17, 225, 505)]],
  [[...arcPts(66, 62, 32, 250, 180), ...arcPts(50, 62, 16, 180, 540)]],
  [[[33, 20], [68, 20], [45, 80]]],
  [arcPts(50, 34, 13, 270, -90), arcPts(50, 64, 16, 270, 630)],
  [[...arcPts(50, 37, 15, 0, -360), [64, 80]]],
];
export const TRACE_NUMBERS: TraceFigure[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => ({
  id: `n${n}`, group: 'numbers' as const, es: `${n} · ${NUM_ES[n]}`, en: NUM_EN[n], strokes: DIGITS[n],
}));

/** Points every `step` units along a polyline (keeps both ends). */
export function resample(stroke: Pt[], step = TRACE_STEP): Pt[] {
  const out: Pt[] = [stroke[0]];
  let carry = 0;
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1], b = stroke[i];
    const len = dist(a, b);
    let d = step - carry;
    while (d <= len) {
      const t = d / len;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      d += step;
    }
    carry = len - (d - step);
  }
  const last = stroke[stroke.length - 1];
  if (dist(out[out.length - 1], last) > step * 0.3) out.push(last);
  return out;
}

/**
 * Moves the lit tip forward along `pts` when the finger at `p` is close to the line just ahead of it.
 * Only a short stretch ahead counts (`ahead` samples), so the finger cannot jump across the figure.
 */
export function advance(pts: Pt[], pos: number, p: Pt, tol: number, ahead: number): number {
  let best = pos;
  const end = Math.min(pts.length - 1, pos + ahead);
  for (let i = pos; i <= end; i++) if (dist(pts[i], p) <= tol) best = i;
  return best;
}

/** Bounding box of a figure's strokes. */
export function figureBounds(strokes: Pt[][]): { x: number; y: number; w: number; h: number } {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of strokes) for (const [x, y] of s) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
