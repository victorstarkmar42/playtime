import { charOf, type Character } from '../content/characters';
import type { Pt } from '../core/geometry';
import type { CharKey } from '../core/types';
import { INK } from './primitives';

/** Board: 1200×900 canvas; the 0–100 drawing box maps to x 150–1050, y 0–900. */
export const W = 1200;
export const H = 900;
export const SCALE = 9;
export const OFFSET_X = 150;
export const toBoard = (p: Pt): Pt => [OFFSET_X + p[0] * SCALE, p[1] * SCALE];

const paths = new Map<CharKey, Path2D>();
export function pathOf(ch: Character): Path2D {
  let p = paths.get(ch.key);
  if (!p) {
    p = new Path2D();
    ch.outline.forEach(([x, y], i) => (i ? p!.lineTo(x, y) : p!.moveTo(x, y)));
    p.closePath();
    paths.set(ch.key, p);
  }
  return p;
}

export function useBoardTransform(c: CanvasRenderingContext2D): void {
  c.setTransform(SCALE, 0, 0, SCALE, OFFSET_X, 0);
}

/** Draws a character in drawing-box units (set the transform first). */
export function drawCharacter(c: CanvasRenderingContext2D, ch: Character, mode: 'fill' | 'line', alpha = 1): void {
  c.save();
  c.globalAlpha = alpha;
  const path = pathOf(ch);
  if (mode === 'fill' && !ch.art) {
    c.fillStyle = ch.color;
    c.fill(path);
  }
  ch.details(c, mode === 'line');
  if (ch.art) {
    c.restore();
    return;
  }
  c.lineWidth = mode === 'line' ? 0.75 : 0.85;
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.stroke(path);
  c.restore();
}

/** Silhouette used for drawings not discovered yet. */
export function drawSilhouette(c: CanvasRenderingContext2D, ch: Character): void {
  c.save();
  c.fillStyle = '#C5D6EA';
  c.fill(pathOf(ch));
  c.restore();
}

export function drawThumb(canvas: HTMLCanvasElement, key: CharKey, mode: 'fill' | 'line' | 'silhouette' = 'fill'): void {
  const c = canvas.getContext('2d');
  if (!c) return;
  const w = canvas.width;
  const h = canvas.height;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, w, h);
  const s = Math.min(w / 105, h / 100);
  c.setTransform(s, 0, 0, s, (w - 100 * s) / 2, (h - 100 * s) / 2);
  const ch = charOf(key);
  if (mode === 'silhouette') drawSilhouette(c, ch);
  else drawCharacter(c, ch, mode);
  c.setTransform(1, 0, 0, 1, 0, 0);
}
