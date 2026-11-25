/**
 * Paint-bucket region: every pixel reachable from (x, y) without crossing a wall pixel
 * (4-connected, scanline fill), grown by `grow` pixels so the colour tucks under anti-aliased lines.
 * `wall[i]` is 1 for line pixels. Returns 1 for pixels to paint; all zeros if the seed is on a wall.
 */
export function floodRegion(wall: Uint8Array, w: number, h: number, x: number, y: number, grow = 2): Uint8Array {
  const out = new Uint8Array(w * h);
  x = Math.floor(x);
  y = Math.floor(y);
  if (x < 0 || y < 0 || x >= w || y >= h || wall[y * w + x]) return out;
  const stack: number[] = [x, y];
  while (stack.length) {
    const sy = stack.pop()!;
    const sx = stack.pop()!;
    let l = sx;
    const row = sy * w;
    if (out[row + l] || wall[row + l]) continue;
    while (l > 0 && !wall[row + l - 1] && !out[row + l - 1]) l--;
    let r = sx;
    while (r < w - 1 && !wall[row + r + 1] && !out[row + r + 1]) r++;
    for (let i = l; i <= r; i++) out[row + i] = 1;
    for (const ny of [sy - 1, sy + 1]) {
      if (ny < 0 || ny >= h) continue;
      const nrow = ny * w;
      let inRun = false;
      for (let i = l; i <= r; i++) {
        const free = !wall[nrow + i] && !out[nrow + i];
        if (free && !inRun) stack.push(i, ny);
        inRun = free;
      }
    }
  }
  for (let k = 0; k < grow; k++) {
    const edge: number[] = [];
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const i = yy * w + xx;
        if (out[i]) continue;
        if ((xx > 0 && out[i - 1]) || (xx < w - 1 && out[i + 1]) || (yy > 0 && out[i - w]) || (yy < h - 1 && out[i + w])) edge.push(i);
      }
    }
    for (const i of edge) out[i] = 1;
  }
  return out;
}

/** Line pixels of a drawing (dark and mostly opaque), from canvas RGBA data. */
export function inkWalls(rgba: Uint8ClampedArray, n: number): Uint8Array {
  const walls = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    walls[i] = rgba[o + 3] > 100 && rgba[o] + rgba[o + 1] + rgba[o + 2] < 480 ? 1 : 0;
  }
  return walls;
}

/**
 * Where colour may go when colouring "inside the drawing": every pixel that cannot be reached
 * from the border of the board without crossing a line (closed areas and the lines themselves).
 */
export function colorableMask(wall: Uint8Array, w: number, h: number): Uint8Array {
  const n = w * h;
  const outside = new Uint8Array(n);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (outside[i] || wall[i]) continue;
    outside[i] = 1;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < n - w) stack.push(i + w);
  }
  for (let i = 0; i < n; i++) outside[i] ^= 1;
  return outside;
}
