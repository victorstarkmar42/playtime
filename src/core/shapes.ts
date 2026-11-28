import type { Age, CharKey } from './types';

/**
 * Construye con figuras: cada figura (casa, cohete, tren…) se arma con piezas geométricas.
 * Las piezas se colocan en su lugar arrastrando o tocando; luego se colorean.
 */
export type ShapeKind = 'rect' | 'square' | 'tri' | 'triDown' | 'triLeft' | 'triRight' | 'circle' | 'semi' | 'trap';

export interface Piece {
  kind: ShapeKind;
  /** Box in 0–100 board units. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** 0: every age; 1: from 5–6; 2: only 7–9. */
  lv: 0 | 1 | 2;
}

export interface Figure {
  id: string;
  es: string;
  en: string;
  /** Feminine noun in Spanish (una casa, una flor). */
  fem?: boolean;
  pieces: Piece[];
  /** The same drawing in "Une los puntos", offered when the figure is finished. */
  dots?: CharKey;
}

export const SHAPE_NAME: Record<ShapeKind, { es: string; en: string; esPl: string; enPl: string }> = {
  rect: { es: 'rectángulo', en: 'rectangle', esPl: 'rectángulos', enPl: 'rectangles' },
  square: { es: 'cuadrado', en: 'square', esPl: 'cuadrados', enPl: 'squares' },
  tri: { es: 'triángulo', en: 'triangle', esPl: 'triángulos', enPl: 'triangles' },
  triDown: { es: 'triángulo', en: 'triangle', esPl: 'triángulos', enPl: 'triangles' },
  triLeft: { es: 'triángulo', en: 'triangle', esPl: 'triángulos', enPl: 'triangles' },
  triRight: { es: 'triángulo', en: 'triangle', esPl: 'triángulos', enPl: 'triangles' },
  circle: { es: 'círculo', en: 'circle', esPl: 'círculos', enPl: 'circles' },
  semi: { es: 'semicírculo', en: 'semicircle', esPl: 'semicírculos', enPl: 'semicircles' },
  trap: { es: 'trapecio', en: 'trapezoid', esPl: 'trapecios', enPl: 'trapezoids' },
};

const P = (kind: ShapeKind, x: number, y: number, w: number, h: number, lv: 0 | 1 | 2 = 0): Piece => ({ kind, x, y, w, h, lv });

export const FIGURES: Figure[] = [
  {
    id: 'casa', es: 'casa', en: 'house', fem: true, dots: 'casa',
    pieces: [P('rect', 25, 50, 50, 40), P('tri', 18, 18, 64, 32), P('rect', 44, 68, 12, 22), P('square', 30, 57, 10, 10, 1), P('square', 60, 57, 10, 10, 1), P('rect', 62, 20, 8, 16, 2), P('circle', 46, 36, 8, 8, 2)],
  },
  {
    id: 'cohete', es: 'cohete', en: 'rocket', dots: 'cohete',
    pieces: [P('rect', 40, 26, 20, 46), P('tri', 40, 8, 20, 18), P('circle', 44, 34, 12, 12), P('tri', 27, 56, 13, 16, 1), P('tri', 60, 56, 13, 16, 1), P('triDown', 42, 72, 16, 16, 2), P('circle', 46, 52, 8, 8, 2)],
  },
  {
    id: 'arbol', es: 'árbol', en: 'tree', dots: 'arbol',
    pieces: [P('rect', 44, 58, 12, 32), P('circle', 24, 10, 52, 52), P('semi', 30, 82, 40, 10, 1), P('circle', 36, 26, 7, 7, 2), P('circle', 56, 22, 7, 7, 2), P('circle', 52, 42, 7, 7, 2)],
  },
  {
    id: 'robot', es: 'robot', en: 'robot', dots: 'robi',
    pieces: [P('rect', 36, 10, 28, 24), P('rect', 30, 36, 40, 32), P('rect', 36, 70, 10, 20, 1), P('rect', 54, 70, 10, 20, 1), P('rect', 18, 38, 10, 26, 1), P('rect', 72, 38, 10, 26, 1), P('circle', 41, 16, 7, 7, 2), P('circle', 52, 16, 7, 7, 2), P('semi', 44, 26, 12, 6, 2)],
  },
  {
    id: 'barco', es: 'barco', en: 'boat', dots: 'barco',
    pieces: [P('trap', 14, 62, 72, 18), P('tri', 30, 14, 40, 46), P('rect', 48, 56, 4, 6, 1), P('circle', 72, 10, 14, 14, 1), P('semi', 4, 82, 30, 10, 2), P('semi', 35, 82, 30, 10, 2), P('semi', 66, 82, 30, 10, 2)],
  },
  {
    id: 'tren', es: 'tren', en: 'train', dots: 'tren',
    pieces: [P('rect', 8, 44, 36, 28), P('square', 8, 26, 18, 18), P('circle', 12, 70, 14, 14), P('circle', 28, 70, 14, 14), P('rect', 32, 30, 8, 14, 1), P('rect', 50, 48, 40, 24, 1), P('circle', 54, 70, 14, 14, 1), P('circle', 72, 70, 14, 14, 1), P('semi', 28, 18, 16, 8, 2)],
  },
  {
    id: 'castillo', es: 'castillo', en: 'castle', dots: 'castillo',
    pieces: [P('rect', 30, 44, 40, 46), P('rect', 12, 34, 18, 56), P('rect', 70, 34, 18, 56), P('tri', 10, 14, 22, 20, 1), P('tri', 68, 14, 22, 20, 1), P('semi', 42, 72, 16, 8, 1), P('rect', 42, 80, 16, 10, 1), P('tri', 40, 26, 20, 18, 2), P('square', 16, 46, 10, 10, 2), P('square', 74, 46, 10, 10, 2)],
  },
  {
    id: 'flor', es: 'flor', en: 'flower', fem: true, dots: 'flor',
    pieces: [P('circle', 40, 22, 20, 20), P('circle', 40, 4, 20, 20), P('circle', 22, 22, 20, 20), P('circle', 58, 22, 20, 20), P('rect', 47, 42, 6, 48, 1), P('circle', 40, 40, 20, 20, 1), P('semi', 26, 60, 20, 10, 2), P('semi', 54, 70, 20, 10, 2)],
  },
  {
    id: 'avion', es: 'avión', en: 'airplane', dots: 'avion',
    pieces: [P('rect', 14, 44, 60, 14), P('circle', 67, 44, 14, 14), P('tri', 34, 22, 26, 22), P('triDown', 34, 58, 26, 22, 1), P('tri', 12, 28, 14, 16, 1), P('circle', 38, 48, 6, 6, 2), P('circle', 48, 48, 6, 6, 2), P('circle', 58, 48, 6, 6, 2)],
  },
  {
    id: 'autobus', es: 'autobús', en: 'bus', dots: 'autobus',
    pieces: [P('rect', 10, 30, 80, 40), P('circle', 18, 62, 16, 16), P('circle', 62, 62, 16, 16), P('rect', 70, 36, 12, 24, 1), P('square', 16, 38, 12, 12, 1), P('square', 34, 38, 12, 12, 1), P('square', 52, 38, 12, 12, 2), P('rect', 30, 22, 40, 8, 2), P('circle', 83, 62, 5, 5, 2)],
  },
  {
    id: 'pez', es: 'pez', en: 'fish', dots: 'pez',
    pieces: [P('circle', 30, 26, 48, 48), P('triRight', 8, 32, 26, 36), P('circle', 60, 40, 8, 8, 1), P('tri', 44, 14, 20, 14, 1), P('triDown', 46, 72, 16, 12, 2), P('circle', 84, 22, 6, 6, 2), P('circle', 88, 10, 6, 6, 2)],
  },
  {
    id: 'tortuga', es: 'tortuga', en: 'turtle', fem: true, dots: 'tortuga',
    pieces: [P('semi', 20, 30, 60, 34), P('circle', 76, 44, 18, 18), P('rect', 18, 62, 66, 8), P('rect', 24, 68, 10, 14, 1), P('rect', 66, 68, 10, 14, 1), P('triLeft', 8, 58, 12, 10, 2), P('circle', 38, 42, 9, 9, 2), P('circle', 54, 42, 9, 9, 2)],
  },
  {
    id: 'helado', es: 'helado', en: 'ice cream', dots: 'helado',
    pieces: [P('triDown', 32, 56, 36, 38), P('circle', 28, 24, 44, 44), P('circle', 34, 4, 32, 32, 1), P('rect', 32, 56, 36, 6, 1), P('circle', 46, 0, 8, 8, 2), P('square', 44, 70, 6, 6, 2), P('square', 50, 76, 6, 6, 2)],
  },
  {
    id: 'pastel', es: 'pastel', en: 'cake', dots: 'pastel',
    pieces: [P('rect', 14, 58, 72, 30), P('rect', 26, 36, 48, 22), P('rect', 47, 20, 6, 16, 1), P('tri', 46, 9, 8, 11, 1), P('trap', 6, 88, 88, 8, 2), P('circle', 32, 30, 8, 8, 2), P('circle', 60, 30, 8, 8, 2)],
  },
  {
    id: 'hongo', es: 'hongo', en: 'mushroom', dots: 'hongo',
    pieces: [P('semi', 14, 18, 72, 40), P('rect', 38, 56, 24, 32), P('circle', 28, 36, 10, 10, 1), P('circle', 62, 36, 10, 10, 1), P('circle', 46, 24, 8, 8, 2), P('semi', 8, 86, 30, 10, 2), P('semi', 62, 86, 30, 10, 2)],
  },
  {
    id: 'mariposa', es: 'mariposa', en: 'butterfly', fem: true, dots: 'mariposa',
    pieces: [P('rect', 46, 24, 8, 52), P('circle', 14, 14, 34, 34), P('circle', 52, 14, 34, 34), P('circle', 44, 12, 12, 12), P('circle', 20, 46, 28, 28, 1), P('circle', 52, 46, 28, 28, 1), P('circle', 36, 2, 6, 6, 2), P('circle', 58, 2, 6, 6, 2)],
  },
];

export const LEVEL: Record<Age, 0 | 1 | 2> = { '3-4': 0, '5-6': 1, '7-9': 2 };

export function piecesFor(f: Figure, age: Age): Piece[] {
  const lv = LEVEL[age];
  return f.pieces.filter((p) => p.lv <= lv);
}

/** Pieces with the same kind and size can swap places. */
export const sameShape = (a: Piece, b: Piece): boolean => a.kind === b.kind && Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5;

/** How far (board units) a dropped piece's centre may be from its place and still snap in. */
export const SNAP: Record<Age, number> = { '3-4': 22, '5-6': 15, '7-9': 10 };

/** Index of the empty place that a piece dropped with its centre at (x, y) fits, or -1. */
export function snapTarget(piece: Piece, x: number, y: number, slots: Piece[], filled: boolean[], tol: number): number {
  let best = -1;
  let bd = tol;
  slots.forEach((s, i) => {
    if (filled[i] || !sameShape(s, piece)) return;
    const d = Math.hypot(s.x + s.w / 2 - x, s.y + s.h / 2 - y);
    if (d <= bd) [best, bd] = [i, d];
  });
  return best;
}

/** "2 cuadrados, 1 triángulo…" — what the finished figure is made of. */
export function shapeCounts(pieces: Piece[]): { kind: ShapeKind; n: number }[] {
  const m = new Map<string, { kind: ShapeKind; n: number }>();
  for (const p of pieces) {
    const k = p.kind === 'triDown' || p.kind === 'triLeft' || p.kind === 'triRight' ? 'tri' : p.kind;
    const e = m.get(k) ?? { kind: k, n: 0 };
    e.n++;
    m.set(k, e);
  }
  return [...m.values()].sort((a, b) => b.n - a.n);
}

/** SVG path for a piece, in board units. */
export function piecePath(p: Piece): string {
  const { x, y, w, h } = p;
  switch (p.kind) {
    case 'rect':
    case 'square':
      return `M${x} ${y}h${w}v${h}h${-w}Z`;
    case 'tri':
      return `M${x + w / 2} ${y}L${x + w} ${y + h}L${x} ${y + h}Z`;
    case 'triDown':
      return `M${x} ${y}L${x + w} ${y}L${x + w / 2} ${y + h}Z`;
    case 'triLeft':
      return `M${x + w} ${y}L${x + w} ${y + h}L${x} ${y + h / 2}Z`;
    case 'triRight':
      return `M${x} ${y}L${x + w} ${y + h / 2}L${x} ${y + h}Z`;
    case 'circle': {
      const r = w / 2;
      return `M${x} ${y + r}a${r} ${r} 0 1 0 ${w} 0a${r} ${r} 0 1 0 ${-w} 0Z`;
    }
    case 'semi':
      return `M${x} ${y + h}a${w / 2} ${h} 0 0 1 ${w} 0Z`;
    case 'trap':
      return `M${x} ${y}h${w}l${-w * 0.14} ${h}h${-w * 0.72}Z`;
  }
}

/** "una casa", "un cohete". */
export const unEs = (f: Figure): string => `${f.fem ? 'una' : 'un'} ${f.es}`;
/** "Tu casa quedó preciosa", "tu cohete quedó precioso". */
export const preciosoEs = (f: Figure): string => (f.fem ? 'preciosa' : 'precioso');
