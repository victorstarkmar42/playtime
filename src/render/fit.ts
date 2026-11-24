import type { CharKey } from '../core/types';
import { drawThumb } from './character';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
const cache = new Map<CharKey, Box>();

/** Where the drawing really is inside its 0–100 box (most drawings leave wide margins). */
export function drawingBounds(key: CharKey): Box {
  const hit = cache.get(key);
  if (hit) return hit;
  const S = 2; // 2 px per box unit is plenty to find the edges
  const cv = document.createElement('canvas');
  cv.width = 105 * S;
  cv.height = 100 * S;
  drawThumb(cv, key, 'fill');
  let box: Box = { x: 0, y: 0, w: 100, h: 100 };
  const data = cv.getContext('2d')?.getImageData(0, 0, cv.width, cv.height).data;
  if (data) {
    let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y++) {
      for (let x = 0; x < cv.width; x++) {
        if (data[(y * cv.width + x) * 4 + 3] > 24) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    const ox = (cv.width - 100 * S) / 2; // drawThumb centres the box horizontally
    if (x1 >= 0) box = { x: (x0 - ox) / S, y: y0 / S, w: (x1 - x0 + 1) / S, h: (y1 - y0 + 1) / S };
  }
  cache.set(key, box);
  return box;
}

/**
 * Zooms the 1200×900 board (drawing box at x 150–1050) inside its square stage so the drawing
 * itself fills it, leaving `margin` box units around it (for dot numbers). Pointer maths keeps
 * working because the screens read positions from the canvas's own on-screen rectangle.
 */
export function fitBoard(board: HTMLCanvasElement, key: CharKey, margin: number): void {
  const b = drawingBounds(key);
  const side = Math.min(100, Math.max(55, Math.max(b.w, b.h) + 2 * margin));
  const x0 = b.x + b.w / 2 - side / 2;
  const y0 = b.y + b.h / 2 - side / 2;
  const unit = 100 / (9 * side); // % of the stage per board pixel
  Object.assign(board.style, {
    width: `${1200 * unit}%`,
    height: `${900 * unit}%`,
    left: `${-(150 + 9 * x0) * unit}%`,
    top: `${-9 * y0 * unit}%`,
  });
}
