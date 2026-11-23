export type Pt = readonly [number, number];

export const tri = (x: number): number => {
  const f = x - Math.floor(x);
  return 1 - Math.abs(2 * f - 1);
};
export const gauss = (d: number, w: number): number => Math.exp(-(d / w) * (d / w));
export const angDist = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
export const dist = (a: Pt, b: Pt): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** A closed outline described by its radius at each angle (degrees, counter-clockwise, y up), in a 0–100 box. */
export interface PolarShape {
  cx: number;
  cy: number;
  /** Angle of dot number 1. */
  start: number;
  rf: (angle: number) => number;
}

export function polarAt(s: PolarShape, angle: number): Pt {
  const a = ((angle % 360) + 360) % 360;
  const r = s.rf(a);
  const rad = (angle * Math.PI) / 180;
  return [s.cx + r * Math.cos(rad), s.cy - r * Math.sin(rad)];
}

/** n dots evenly spread by angle, starting at dot 1. */
export function sampleOutline(s: PolarShape, n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => polarAt(s, s.start + (i * 360) / n));
}

/** Dense closed outline of a polar shape, one point per degree. */
export function densePolar(s: PolarShape): Pt[] {
  return Array.from({ length: 360 }, (_, i) => polarAt(s, s.start + i));
}

/** Points along a circle arc; angles in degrees, screen orientation (y down), from a0 to a1 inclusive. */
export function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, step = 4): Pt[] {
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
}

/** Joins outline pieces into one closed polyline, dropping repeated points. */
export function joinPath(...parts: Pt[][]): Pt[] {
  const out: Pt[] = [];
  for (const p of parts.flat()) {
    const last = out[out.length - 1];
    if (!last || dist(last, p) > 0.01) out.push(p);
  }
  if (out.length > 1 && dist(out[0], out[out.length - 1]) < 0.01) out.pop();
  return out;
}

/** Unit vector pointing out of a closed polygon at each vertex (for placing dot numbers outside the line). */
export function outwardNormals(poly: Pt[]): Pt[] {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  const sign = area >= 0 ? 1 : -1;
  return poly.map((_, i) => {
    const [px, py] = poly[(i - 1 + n) % n];
    const [nx, ny] = poly[(i + 1) % n];
    const tx = nx - px;
    const ty = ny - py;
    const len = Math.hypot(tx, ty) || 1;
    return [(sign * ty) / len, (-sign * tx) / len] as const;
  });
}

export function perimeter(poly: Pt[]): number {
  let L = 0;
  for (let i = 0; i < poly.length; i++) L += dist(poly[i], poly[(i + 1) % poly.length]);
  return L;
}

/** n points evenly spaced by length along a closed polyline, starting at its first point. */
export function sampleByLength(poly: Pt[], n: number): Pt[] {
  const L = perimeter(poly);
  const out: Pt[] = [];
  let seg = 0;
  let segStart = 0;
  for (let k = 0; k < n; k++) {
    const target = (k * L) / n;
    let a = poly[seg];
    let b = poly[(seg + 1) % poly.length];
    let len = dist(a, b);
    while (segStart + len < target && seg < poly.length - 1) {
      segStart += len;
      seg++;
      a = poly[seg];
      b = poly[(seg + 1) % poly.length];
      len = dist(a, b);
    }
    const t = len === 0 ? 0 : (target - segStart) / len;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}
