import type { Pt } from '../core/geometry';

export const INK = '#22304F';

type C = CanvasRenderingContext2D;

export function circ(c: C, x: number, y: number, r: number, fill?: string | null, stroke?: string | null, lw = 0.6): void {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (stroke) {
    c.lineWidth = lw;
    c.strokeStyle = stroke;
    c.stroke();
  }
}

export function arc(c: C, x: number, y: number, r: number, a0: number, a1: number, lw = 0.7): void {
  c.beginPath();
  c.arc(x, y, r, a0, a1);
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.strokeStyle = INK;
  c.stroke();
}

export function line(c: C, pts: Pt[], lw = 0.7, color = INK): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = color;
  c.stroke();
}

export function poly(c: C, pts: Pt[], fill: string | null, lw = 0.6): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  c.lineWidth = lw;
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.stroke();
}

export function note(c: C, x: number, y: number, fill: string, lineOnly: boolean): void {
  c.save();
  c.translate(x, y);
  c.rotate(-0.35);
  c.beginPath();
  c.ellipse(0, 0, 2.6, 1.9, 0, 0, Math.PI * 2);
  if (!lineOnly) {
    c.fillStyle = fill;
    c.fill();
  }
  c.lineWidth = 0.6;
  c.strokeStyle = INK;
  c.stroke();
  c.restore();
  line(c, [[x + 2.3, y - 0.8], [x + 2.3, y - 10], [x + 6, y - 8]]);
}

/** Five-point star centred on (x, y). */
export function star(c: C, x: number, y: number, r: number, fill: string | null, lw = 0.5): void {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + rr * Math.cos(a), y + rr * Math.sin(a)]);
  }
  poly(c, pts, fill, lw);
}
