import type { Age } from './types';

export type RGB = [number, number, number];

/** How many different colours (numbers) a picture may use, by age. */
export const PN_MAX_COLORS: Record<Age, number> = { '3-4': 4, '5-6': 6, '7-9': 8 };
/** Squares per side in "Cuadritos", by age. */
export const PN_GRID: Record<Age, number> = { '3-4': 10, '5-6': 14, '7-9': 18 };
/** 3–4 year olds match shapes instead of numbers. */
export const usesSymbols = (age: Age): boolean => age === '3-4';

export interface Regions {
  /** Region id per pixel, -1 on lines. */
  labels: Int32Array;
  count: number;
  area: number[];
  /** Region reaches the picture's edge (the background around the drawing). */
  edge: boolean[];
}

/** Splits the picture into the areas enclosed by its lines (4-connected). */
export function labelRegions(wall: Uint8Array, w: number, h: number): Regions {
  const labels = new Int32Array(w * h).fill(-2);
  const area: number[] = [];
  const edge: boolean[] = [];
  let count = 0;
  const stack: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (wall[start]) {
      labels[start] = -1;
      continue;
    }
    if (labels[start] !== -2) continue;
    const id = count++;
    let a = 0;
    let e = false;
    labels[start] = id;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop()!;
      a++;
      const x = i % w, y = (i / w) | 0;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) e = true;
      if (x > 0 && labels[i - 1] === -2 && !wall[i - 1]) (labels[i - 1] = id), stack.push(i - 1);
      if (x < w - 1 && labels[i + 1] === -2 && !wall[i + 1]) (labels[i + 1] = id), stack.push(i + 1);
      if (y > 0 && labels[i - w] === -2 && !wall[i - w]) (labels[i - w] = id), stack.push(i - w);
      if (y < h - 1 && labels[i + w] === -2 && !wall[i + w]) (labels[i + w] = id), stack.push(i + w);
    }
    area.push(a);
    edge.push(e);
  }
  return { labels, count, area, edge };
}

const d2 = (a: RGB, b: RGB) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/**
 * Groups similar colours into at most `max` paints. Bigger areas choose first, so each paint keeps the
 * colour of its largest area. Returns the paint index of each input colour and the paints.
 */
export function clusterColors(colors: RGB[], weights: number[], max: number, near = 48): { of: number[]; palette: RGB[] } {
  const order = colors.map((_, i) => i).sort((a, b) => weights[b] - weights[a]);
  const palette: RGB[] = [];
  const mass: number[] = [];
  const of = new Array<number>(colors.length).fill(0);
  for (const i of order) {
    let best = -1;
    let bd = near * near;
    palette.forEach((p, k) => {
      const d = d2(p, colors[i]);
      if (d < bd) (bd = d), (best = k);
    });
    if (best < 0) {
      palette.push(colors[i]);
      mass.push(0);
      best = palette.length - 1;
    }
    of[i] = best;
    mass[best] += weights[i];
  }
  // too many paints: fold the lightest-used paint into its closest neighbour
  while (palette.length > max) {
    let small = 0;
    mass.forEach((m, k) => m < mass[small] && (small = k));
    let to = small === 0 ? 1 : 0;
    palette.forEach((p, k) => k !== small && d2(p, palette[small]) < d2(palette[to], palette[small]) && (to = k));
    for (let i = 0; i < of.length; i++) {
      if (of[i] === small) of[i] = to;
      if (of[i] > small) of[i]--;
    }
    mass[to] += mass[small];
    palette.splice(small, 1);
    mass.splice(small, 1);
  }
  return { of, palette };
}

/** Distance (px) from each pixel to the nearest pixel of another region or line: two-pass chamfer. */
export function insideDistance(labels: Int32Array, w: number, h: number): Float32Array {
  const d = new Float32Array(w * h);
  const BIG = 1e6;
  for (let i = 0; i < d.length; i++) d[i] = labels[i] < 0 ? 0 : BIG;
  const relax = (i: number, j: number, cost: number) => {
    const v = labels[j] === labels[i] ? d[j] + cost : cost;
    if (v < d[i]) d[i] = v;
  };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!d[i]) continue;
    if (x === 0 || y === 0) d[i] = Math.min(d[i], 1);
    if (x > 0) relax(i, i - 1, 1);
    if (y > 0) relax(i, i - w, 1);
    if (x > 0 && y > 0) relax(i, i - w - 1, 1.414);
    if (x < w - 1 && y > 0) relax(i, i - w + 1, 1.414);
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    if (!d[i]) continue;
    if (x === w - 1 || y === h - 1) d[i] = Math.min(d[i], 1);
    if (x < w - 1) relax(i, i + 1, 1);
    if (y < h - 1) relax(i, i + w, 1);
    if (x < w - 1 && y < h - 1) relax(i, i + w + 1, 1.414);
    if (x > 0 && y < h - 1) relax(i, i + w - 1, 1.414);
  }
  return d;
}

/** Near-white colours are left as paper (painting white on white would look like nothing happened). */
export const isPaper = (c: RGB): boolean => Math.min(...c) > 236;
