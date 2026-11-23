import type { Pt } from '../core/geometry';
import { INK } from './primitives';

/** One shape of a detailed drawing (see scripts/singers.mjs). */
export interface ArtOp {
  /** SVG path data, in figure pixels. */
  d: string;
  /** Fill role (colour comes from the palette); null = no fill; 'black' stays ink. */
  f: string | null;
  /** Outline width; 0 = no outline. */
  w: number;
  /** Limb drawn as an outlined tube of this inner width. */
  t?: number;
  /** Figure transform [a b c d e f]. */
  m: number[];
}

export interface ArtData {
  /** Figure pixels → 0–100 drawing box. */
  matrix: number[];
  palette: Record<string, string>;
  outline: Pt[];
  ops: ArtOp[];
}

const LW = 7; // must match scripts/singers.mjs
const RES = 9; // pixels per box unit: matches the 1200×900 board, so the colouring page is drawn 1:1
const cache = new Map<string, HTMLCanvasElement>();
const paths = new WeakMap<ArtOp, Path2D>();
const pathOf = (o: ArtOp) => {
  let p = paths.get(o);
  if (!p) paths.set(o, (p = new Path2D(o.d)));
  return p;
};

/**
 * Renders the drawing once per mode into a transparent layer.
 * `line`: ink only, with every filled shape punched out (destination-out) so the shapes behind it
 * are hidden but the paint underneath shows through — the line art sits on top of the child's colours.
 */
function layer(art: ArtData, key: string, lineOnly: boolean): HTMLCanvasElement {
  const id = `${key}:${lineOnly ? 'line' : 'fill'}`;
  let cv = cache.get(id);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = 100 * RES;
  cv.height = 100 * RES;
  const c = cv.getContext('2d')!;
  const base = new DOMMatrix([RES, 0, 0, RES, 0, 0]).multiply(new DOMMatrix(art.matrix));
  c.lineJoin = 'round';
  c.lineCap = 'round';
  const punch = (draw: () => void) => {
    c.globalCompositeOperation = 'destination-out';
    draw();
    c.globalCompositeOperation = 'source-over';
  };
  for (const o of art.ops) {
    c.setTransform(base.multiply(new DOMMatrix(o.m)));
    const p = pathOf(o);
    if (o.t) {
      c.lineWidth = o.t + 2 * LW;
      c.strokeStyle = INK;
      c.stroke(p);
      c.lineWidth = o.t;
      if (lineOnly) punch(() => c.stroke(p));
      else {
        c.strokeStyle = art.palette[o.f ?? 'white'] ?? '#fff';
        c.stroke(p);
      }
      continue;
    }
    if (o.f) {
      if (o.f === 'black') {
        c.fillStyle = INK;
        c.fill(p);
      } else if (lineOnly) punch(() => c.fill(p));
      else {
        c.fillStyle = art.palette[o.f] ?? '#fff';
        c.fill(p);
      }
    }
    if (o.w) {
      c.lineWidth = o.w;
      c.strokeStyle = INK;
      c.stroke(p);
    }
  }
  cache.set(id, cv);
  return cv;
}

/** Draws the art into the 0–100 drawing box (the caller has set the box transform). */
export function drawArt(c: CanvasRenderingContext2D, art: ArtData, key: string, lineOnly: boolean): void {
  c.drawImage(layer(art, key, lineOnly), 0, 0, 100, 100);
}
