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
