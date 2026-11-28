/**
 * "Colorea tu dibujo": turns a photo of a drawing (or any picture) into dark lines to colour.
 *
 * A plain threshold fails on phone photos (shadows, grey paper, one side lighter than the other),
 * so each pixel is compared with the average brightness around it: a line is something clearly
 * darker than the paper next to it.
 */

/** "Menos líneas" … "Más líneas". Index 2 is the starting point. */
export const LINE_LEVELS = [0.62, 0.7, 0.78, 0.85, 0.91] as const;
export const DEFAULT_LINE_LEVEL = 2;

/** Brightness 0–255 of each pixel (RGBA input; transparent counts as white paper). */
export function luminance(rgba: Uint8ClampedArray, n: number): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const a = rgba[o + 3] / 255;
    const l = 0.299 * rgba[o] + 0.587 * rgba[o + 1] + 0.114 * rgba[o + 2];
    out[i] = l * a + 255 * (1 - a);
  }
  return out;
}

/**
 * Ink strength (0–255) of each pixel. `level` picks how dark, compared with the paper around it,
 * something must be to count as a line. Tiny specks (one or two pixels alone) are dropped.
 */
export function photoInk(rgba: Uint8ClampedArray, w: number, h: number, level = DEFAULT_LINE_LEVEL): Uint8ClampedArray {
  const n = w * h;
  const lum = luminance(rgba, n);
  // Integral images for the local average. Pure white (the margin around a fitted photo) is left
  // out, so the photo's own edge does not look like a line next to it.
  const sum = new Float64Array((w + 1) * (h + 1));
  const cnt = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0, rowN = 0;
    for (let x = 0; x < w; x++) {
      const l = lum[y * w + x];
      if (l < 254.5) {
        row += l;
        rowN++;
      }
      sum[(y + 1) * (w + 1) + x + 1] = sum[y * (w + 1) + x + 1] + row;
      cnt[(y + 1) * (w + 1) + x + 1] = cnt[y * (w + 1) + x + 1] + rowN;
    }
  }
  const box = (a: Float64Array, x0: number, y0: number, x1: number, y1: number) =>
    a[y1 * (w + 1) + x1] - a[y0 * (w + 1) + x1] - a[y1 * (w + 1) + x0] + a[y0 * (w + 1) + x0];
  const r = Math.max(4, Math.round(Math.min(w, h) / 40));
  const k = LINE_LEVELS[Math.max(0, Math.min(LINE_LEVELS.length - 1, level))];
  const ink = new Uint8ClampedArray(n);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const l = lum[y * w + x];
      const n = box(cnt, x0, y0, x1, y1);
      if (l >= 254.5 || !n) continue;
      const mean = box(sum, x0, y0, x1, y1) / n;
      const limit = mean * k;
      if (l >= limit) continue;
      // soft edge: fully dark a little below the limit, so lines stay smooth
      ink[y * w + x] = Math.min(255, Math.round(((limit - l) / Math.max(8, limit * 0.18)) * 255));
    }
  }
  // drop specks: an ink pixel needs at least two ink neighbours
  const out = new Uint8ClampedArray(ink);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!ink[i]) continue;
      let nb = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < w && yy < h && ink[yy * w + xx] > 60) nb++;
      }
      if (nb < 2) out[i] = 0;
    }
  }
  return out;
}

/** Where a picture of sw×sh goes inside a W×H board, whole and centred, with a margin. */
export function fitRect(sw: number, sh: number, W: number, H: number, margin = 0.04): { x: number; y: number; w: number; h: number } {
  const mw = W * (1 - 2 * margin), mh = H * (1 - 2 * margin);
  const s = Math.min(mw / sw, mh / sh);
  const w = Math.round(sw * s), h = Math.round(sh * s);
  return { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w, h };
}

/** A clean short name for a saved drawing. */
export function cleanPicName(raw: string): string {
  const t = raw.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return (t || 'Mi dibujo').slice(0, 24);
}
