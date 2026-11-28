import { CHARACTER_ORDER, charOf } from '../../content/characters';
import { pop } from '../../core/audio';
import { settings } from '../../core/settings';
import type { CharKey } from '../../core/types';
import { drawCharacter } from '../../render/character';
import { drawingBounds } from '../../render/fit';
import type { Ctx, Screen } from '../context';
import { canvas, h } from '../dom';

const SIZE = 720;
const GRID = 24;
const PAPERS: [string, string, string][] = [
  ['#F7D35E', '#D9AE2E', '#FFF1B8'],
  ['#8FD3F5', '#4FA7D6', '#E3F5FF'],
  ['#F7A8C8', '#D96A98', '#FFE3EE'],
  ['#A8E0A0', '#5DAE55', '#E3F7DF'],
  ['#C6B4FF', '#8A6CE0', '#EEE8FF'],
];
let lastKey: CharKey | null = null;

/** Scale and offset that fit a drawing (plus `margin` box units around it) in a square of `size` px. */
export function zoomOf(key: CharKey, size: number, margin = 6): [number, number, number] {
  const b = drawingBounds(key);
  const side = Math.max(b.w, b.h) + 2 * margin;
  const s = size / side;
  return [s, -(b.x + b.w / 2 - side / 2) * s, -(b.y + b.h / 2 - side / 2) * s];
}

/** Draws a drawing zoomed to its own size on a white square. */
export function drawZoomed(cv: HTMLCanvasElement, key: CharKey, mode: 'fill' | 'line', margin = 6, white = true): void {
  const c = cv.getContext('2d')!;
  const [s, ox, oy] = zoomOf(key, cv.width, margin);
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cv.width, cv.height);
  if (white) {
    c.fillStyle = '#fff';
    c.fillRect(0, 0, cv.width, cv.height);
  }
  c.setTransform(s, 0, 0, s, ox, oy);
  drawCharacter(c, charOf(key), mode);
  c.setTransform(1, 0, 0, 1, 0, 0);
}

/** Destapa el dibujo: tap and rub the wrapping paper until the drawing underneath shows, then colour it. */
export function revealScreen(ctx: Ctx): Screen {
  const el = h('div', { class: 'view' });
  let raf = 0;

  function round(): void {
    cancelAnimationFrame(raf);
    const pool = CHARACTER_ORDER.filter((k) => k !== lastKey);
    const key = pool[Math.floor(Math.random() * pool.length)];
    lastKey = key;
    const ch = charOf(key);
    const [paper, ink, rim] = PAPERS[Math.floor(Math.random() * PAPERS.length)];
    const under = canvas(SIZE, SIZE, 'rv-under');
    drawZoomed(under, key, 'line');
    const cover = canvas(SIZE, SIZE, 'rv-cover');
    const fx = canvas(SIZE, SIZE, 'rv-fx');
    const c = cover.getContext('2d')!;
    const f = fx.getContext('2d')!;
    const covered = new Uint8Array(GRID * GRID).fill(1);
    let left = GRID * GRID;
    let done = false;
    let lastHole: [number, number] | null = null;
    let lastPop = 0;
    const bits: { x: number; y: number; vx: number; vy: number; a: number; va: number; s: number; life: number }[] = [];
    const R = settings.age === '3-4' ? 62 : settings.age === '5-6' ? 52 : 44;

    // wrapping paper: our own pattern of stars, dots and little moons, with a wavy edge
    c.fillStyle = paper;
    c.beginPath();
    const E = 14;
    for (let i = 0; i <= 40; i++) c.lineTo((i / 40) * SIZE, E + Math.sin(i * 1.7) * 5);
    for (let i = 0; i <= 40; i++) c.lineTo(SIZE - E - Math.sin(i * 1.3) * 5, (i / 40) * SIZE);
    for (let i = 40; i >= 0; i--) c.lineTo((i / 40) * SIZE, SIZE - E - Math.sin(i * 1.9) * 5);
    for (let i = 40; i >= 0; i--) c.lineTo(E + Math.sin(i * 1.5) * 5, (i / 40) * SIZE);
    c.closePath();
    c.fill();
    c.lineWidth = 8;
    c.strokeStyle = rim;
    c.stroke();
    c.globalAlpha = 0.55;
    c.fillStyle = ink;
    c.strokeStyle = ink;
    c.lineWidth = 4;
    for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
      const cx = 70 + x * 116 + (y % 2) * 58, cy = 66 + y * 118;
      const kind = (x + y * 2) % 3;
      c.beginPath();
      if (kind === 0) {
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 9 : 22;
          c.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        c.closePath();
        c.fill();
      } else if (kind === 1) {
        c.arc(cx, cy, 18, 0.3 * Math.PI, 1.7 * Math.PI);
        c.arc(cx + 9, cy - 2, 14, 1.6 * Math.PI, 0.4 * Math.PI, true);
        c.fill();
      } else {
        for (const [dx, dy] of [[-12, -8], [12, -8], [0, 12]]) {
          c.moveTo(cx + dx + 7, cy + dy);
          c.arc(cx + dx, cy + dy, 7, 0, Math.PI * 2);
        }
        c.fill();
      }
    }
    c.globalAlpha = 1;

    const title = h('h2', null, '¿Qué hay debajo?', h('small', null, "What's under the paper?"));
    const status = h('p', { class: 'gstatus', role: 'status' }, 'Toca y frota el papel para romperlo.');
    const actions = h('div', { class: 'rv-actions', hidden: true },
      h('button', { class: 'bigbtn', onClick: () => ((ctx.state.colorKey = key), (ctx.state.colorPic = null), (ctx.state.freshColor = true), (ctx.state.pickFor = 'color'), ctx.show('color')) }, '¡A colorear!'),
      h('button', { class: 'bigbtn alt', onClick: round }, 'Otro regalo'));
    const stage = h('div', { class: 'rv-stage' }, under, cover, fx);
    el.replaceChildren(h('div', { class: 'revealg' },
      h('div', { class: 'ghead' }, title),
      h('div', { class: 'rv-box' }, stage),
      status, actions));

    function hole(x: number, y: number): void {
      // rough round tear: a pale paper rim, then the hole itself
      const pts: [number, number][] = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, r = R * (0.82 + Math.random() * 0.3);
        pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
      }
      c.save();
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = rim;
      c.beginPath();
      pts.forEach(([px, py]) => c.lineTo(x + (px - x) * 1.12, y + (py - y) * 1.12));
      c.fill();
      c.globalCompositeOperation = 'destination-out';
      c.beginPath();
      pts.forEach(([px, py]) => c.lineTo(px, py));
      c.fill();
      c.restore();
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * Math.PI * 2;
        bits.push({ x, y, vx: Math.cos(a) * (2 + Math.random() * 4), vy: Math.sin(a) * 3 - 3, a: 0, va: Math.random() - 0.5, s: 6 + Math.random() * 10, life: 1 });
      }
      const cell = SIZE / GRID;
      for (let gy = 0; gy < GRID; gy++) for (let gx = 0; gx < GRID; gx++) {
        const i = gy * GRID + gx;
        if (covered[i] && Math.hypot((gx + 0.5) * cell - x, (gy + 0.5) * cell - y) < R * 0.85) {
          covered[i] = 0;
          left--;
        }
      }
      const now = performance.now();
      if (now - lastPop > 70) {
        lastPop = now;
        pop(300 + Math.random() * 500, 0.05);
      }
      if (!done && left < GRID * GRID * 0.3) finish();
    }

    function finish(): void {
      done = true;
      cover.classList.add('gone');
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * SIZE, y = Math.random() * SIZE, a = Math.random() * Math.PI * 2;
        bits.push({ x, y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6 - 4, a: 0, va: Math.random() - 0.5, s: 8 + Math.random() * 12, life: 1 });
      }
      [660, 880, 1100].forEach((fq, i) => setTimeout(() => pop(fq, 0.2), i * 120));
      status.textContent = `¡Sorpresa! ${ch.label} · ${ch.vocab.en}`;
      actions.hidden = false;
      ctx.sayPair(`¡Sorpresa! ${ch.vocab.es}. ¿Lo coloreamos?`, `Surprise! ${ch.vocab.en}. Shall we color it?`);
    }

    const at = (e: PointerEvent): [number, number] => {
      const r = cover.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE];
    };
    let down = false;
    stage.addEventListener('pointerdown', (e) => {
      if (done) return;
      down = true;
      stage.setPointerCapture(e.pointerId);
      const p = at(e);
      lastHole = p;
      hole(...p);
    });
    stage.addEventListener('pointermove', (e) => {
      if (!down || done) return;
      const p = at(e);
      const from = lastHole ?? p;
      const d = Math.hypot(p[0] - from[0], p[1] - from[1]);
      const gap = R * 0.7;
      if (d < gap) return;
      const n = Math.floor(d / gap);
      for (let i = 1; i <= n; i++) hole(from[0] + ((p[0] - from[0]) * i * gap) / d, from[1] + ((p[1] - from[1]) * i * gap) / d);
      lastHole = [from[0] + ((p[0] - from[0]) * n * gap) / d, from[1] + ((p[1] - from[1]) * n * gap) / d];
    });
    const up = () => ((down = false), (lastHole = null));
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);

    const tick = () => {
      f.clearRect(0, 0, SIZE, SIZE);
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.5;
        b.a += b.va;
        b.life -= 0.025;
        if (b.life <= 0) {
          bits.splice(i, 1);
          continue;
        }
        f.save();
        f.globalAlpha = b.life;
        f.translate(b.x, b.y);
        f.rotate(b.a);
        f.fillStyle = paper;
        f.fillRect(-b.s / 2, -b.s / 3, b.s, (b.s * 2) / 3);
        f.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    ctx.sayPair('Hay un dibujo escondido. ¡Rompe el papel!', 'There is a hidden drawing. Tear the paper!');

    if (location.search.includes('e2e')) {
      (window as unknown as { __pymReveal?: () => DOMRect }).__pymReveal = () => cover.getBoundingClientRect();
    }
  }

  round();
  return {
    el,
    destroy: () => cancelAnimationFrame(raf),
    onHelp: () => ctx.sayPair('Toca el papel muchas veces o frótalo con tu dedo', 'Tap the paper or rub it with your finger'),
  };
}
