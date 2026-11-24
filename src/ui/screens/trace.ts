import { CHARACTER_ORDER, charOf } from '../../content/characters';
import { pop } from '../../core/audio';
import type { Pt } from '../../core/geometry';
import { settings } from '../../core/settings';
import { advance, figureBounds, resample, TRACE_NUMBERS, TRACE_SHAPES, TRACE_STEP, TRACE_TOL, type TraceFigure } from '../../core/trace';
import type { Ctx, Screen } from '../context';
import { canvas, h, ICONS } from '../dom';
import { exitBtn } from './gamekit';

const RAINBOW = ['#FF3EA5', '#FF8A1F', '#FFE53D', '#45F27A', '#3D8BFF', '#A04DFF'];
const BRUSHES: { es: string; colors: string[] }[] = [
  { es: 'Arcoíris', colors: RAINBOW },
  { es: 'Rosa', colors: ['#FF4FB8', '#FFA3DA'] },
  { es: 'Naranja', colors: ['#FF9A3D', '#FFCB8F'] },
  { es: 'Amarillo', colors: ['#FFE14D', '#FFF4AE'] },
  { es: 'Verde', colors: ['#4DFF88', '#B8FFCF'] },
  { es: 'Azul', colors: ['#4D8BFF', '#AFCBFF'] },
  { es: 'Morado', colors: ['#B36BFF', '#DFC2FF'] },
];
let brushIx = 0;

/** Every figure: shapes, numbers and the outline of each drawing. */
function allFigures(): TraceFigure[] {
  const drawings: TraceFigure[] = CHARACTER_ORDER.map((k) => {
    const ch = charOf(k);
    return { id: k, group: 'drawings', es: ch.label, en: ch.vocab.en, strokes: [[...ch.outline, ch.outline[0]]] };
  });
  return [...TRACE_SHAPES, ...TRACE_NUMBERS, ...drawings];
}

const GROUPS: [TraceFigure['group'], string][] = [['shapes', 'Figuras · Shapes'], ['numbers', 'Números · Numbers'], ['drawings', 'Dibujos · Drawings']];

function starPath(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  c.closePath();
}

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  c.globalAlpha = alpha;
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.globalAlpha = 1;
}

/** Thumbnail: the figure as a soft glowing line on the night sky. */
function thumb(f: TraceFigure): HTMLCanvasElement {
  const cv = canvas(160, 160);
  const c = cv.getContext('2d')!;
  const b = figureBounds(f.strokes);
  const side = Math.max(b.w, b.h) + 16;
  const k = 160 / side;
  c.setTransform(k, 0, 0, k, (80 / k - (b.x + b.w / 2)) * k, (80 / k - (b.y + b.h / 2)) * k);
  c.lineCap = c.lineJoin = 'round';
  c.shadowColor = '#8FB2FF';
  c.shadowBlur = 8;
  c.strokeStyle = '#EAF0FF';
  c.lineWidth = 2.4 / (k / 1.6);
  c.setLineDash([3 / (k / 1.6), 2.4 / (k / 1.6)]);
  for (const s of f.strokes) {
    c.beginPath();
    s.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
  return cv;
}

interface Seg { s: number; a: number; b: number; brush: number }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; r: number }

/** Trazos de luz: follow the dashed line with a finger; it lights up with little stars that stay. */
export function traceScreen(ctx: Ctx): Screen {
  const figures = allFigures();
  const el = h('div', { class: 'view tview' });
  let stop: (() => void) | null = null;

  function showPicker(): void {
    if (stop) ctx.speaker.cancel();
    stop?.();
    stop = null;
    const sections = GROUPS.map(([g, title]) =>
      h('section', null, h('h3', null, title),
        h('div', { class: 'tpick-grid' }, ...figures.filter((f) => f.group === g).map((f) =>
          h('button', { class: 'tpick-card', dataset: { id: f.id }, 'aria-label': f.es, onClick: () => (pop(520, 0.1), play(f)) }, thumb(f), h('span', null, f.es))))));
    el.replaceChildren(h('div', { class: 'tpick' },
      h('div', { class: 'ghead' }, h('h2', null, 'Trazos de luz', h('small', null, 'Light trails · Sigue la línea con tu dedo')), exitBtn(ctx)),
      ...sections));
    el.scrollTop = 0;
  }

  function play(fig: TraceFigure): void {
    stop?.();
    const strokes = fig.strokes.map((s) => resample(s));
    const K = 3; // a star every 3 samples (~2 units)
    const ahead = Math.round(9 / TRACE_STEP);
    let si = 0;
    let pos = 0;
    const segs: Seg[] = [];
    let live: { s: number; a: number } | null = null;
    let last: Pt | null = null;
    let done = false;
    let doneAt = 0;
    let hintUntil = 0;
    let hinted = false;
    let lastPop = 0;
    const sparks: Spark[] = [];

    const cv = canvas(10, 10, 'tcanvas');
    cv.setAttribute('aria-label', `Traza: ${fig.es}`);
    const c = cv.getContext('2d')!;
    const bg = document.createElement('canvas');
    const lit = document.createElement('canvas');
    let cw = 0, chh = 0, dpr = 1, k = 1, ox = 0, oy = 0;
    const toPx = (p: Pt): Pt => [ox + p[0] * k, oy + p[1] * k];

    const title = h('h2', null, fig.es, h('small', null, fig.en));
    const undoBtn = h('button', { class: 'bigbtn alt small ticon', 'aria-label': 'Deshacer', html: ICONS.undo, onClick: undo });
    const nextBtn = h('button', { class: 'bigbtn small', onClick: () => play(figures[(figures.indexOf(fig) + 1) % figures.length]) }, 'Otra →');
    const backBtn = h('button', { class: 'bigbtn alt small gexit', onClick: showPicker }, '← Figuras');
    const status = h('p', { class: 'tstatus', role: 'status' }, 'Empieza en la luz que brilla y sigue la línea.');
    const brushes = h('div', { class: 'tbrushes', role: 'radiogroup', 'aria-label': 'Colores de luz' },
      ...BRUSHES.map((b, i) => h('button', {
        class: 'tbrush', role: 'radio', 'aria-label': b.es, 'aria-checked': String(i === brushIx),
        style: `--bg:${b.colors.length > 2 ? `conic-gradient(${b.colors.join(',')},${b.colors[0]})` : `radial-gradient(circle at 40% 35%, #fff, ${b.colors[1]} 30%, ${b.colors[0]} 75%)`}`,
        onClick: (e: Event) => {
          brushIx = i;
          brushes.querySelectorAll('.tbrush').forEach((x) => x.setAttribute('aria-checked', String(x === e.currentTarget)));
          pop(600 + i * 60, 0.08);
        },
      }, h('i'))));
    const wrap = h('div', { class: 'twrap' }, cv);
    el.replaceChildren(h('div', { class: 'traceg' },
      h('div', { class: 'ghead' }, backBtn, title, undoBtn, nextBtn),
      h('div', { class: 'tbody' }, wrap, brushes),
      status));

    function layout(): void {
      const r = wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      cw = r.width;
      chh = r.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const x of [cv, bg, lit]) {
        x.width = Math.round(cw * dpr);
        x.height = Math.round(chh * dpr);
      }
      const b = figureBounds(fig.strokes);
      const m = 9;
      k = Math.min(cw / (b.w + 2 * m), chh / (b.h + 2 * m));
      ox = cw / 2 - (b.x + b.w / 2) * k;
      oy = chh / 2 - (b.y + b.h / 2) * k;
      drawBg();
      renderLit();
    }

    function drawBg(): void {
      const g = bg.getContext('2d')!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const grad = g.createLinearGradient(0, 0, 0, chh);
      grad.addColorStop(0, '#040720');
      grad.addColorStop(1, '#0B1440');
      g.fillStyle = grad;
      g.fillRect(0, 0, cw, chh);
      g.strokeStyle = '#1A2A6E';
      g.lineWidth = 2;
      g.lineJoin = g.lineCap = 'round';
      // soft hills, a little house and two trees: our own night scene
      g.beginPath();
      g.moveTo(0, chh * 0.8);
      g.quadraticCurveTo(cw * 0.22, chh * 0.6, cw * 0.45, chh * 0.78);
      g.quadraticCurveTo(cw * 0.7, chh * 0.62, cw, chh * 0.76);
      g.moveTo(0, chh * 0.9);
      g.quadraticCurveTo(cw * 0.5, chh * 0.84, cw, chh * 0.92);
      const hx = cw * 0.08, hy = chh * 0.74, hs = Math.min(cw, chh) * 0.09;
      g.moveTo(hx, hy); g.lineTo(hx, hy - hs); g.lineTo(hx + hs * 0.6, hy - hs * 1.6); g.lineTo(hx + hs * 1.2, hy - hs); g.lineTo(hx + hs * 1.2, hy - hs * 0.15);
      g.moveTo(hx + hs * 0.4, hy - hs * 0.05); g.lineTo(hx + hs * 0.4, hy - hs * 0.5); g.lineTo(hx + hs * 0.8, hy - hs * 0.5); g.lineTo(hx + hs * 0.8, hy - hs * 0.1);
      for (const tx of [0.88, 0.95]) {
        const x = cw * tx, y = chh * 0.77;
        g.moveTo(x, y); g.lineTo(x, y - hs * 0.5);
        g.moveTo(x + hs * 0.35, y - hs * 0.5);
        g.ellipse(x, y - hs, hs * 0.35, hs * 0.55, 0, 0, Math.PI * 2);
      }
      g.stroke();
      // faint four-point stars
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      g.strokeStyle = '#22337A';
      for (let i = 0; i < 18; i++) {
        const x = rnd() * cw, y = rnd() * chh * 0.55, s = 4 + rnd() * 6;
        g.beginPath();
        g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s);
        g.stroke();
      }
    }

    const starColor = (s: number, i: number, brush: number) => {
      const cols = BRUSHES[brush].colors;
      return cols[(Math.floor(i / K) + s * 2) % cols.length];
    };

    function drawStars(g: CanvasRenderingContext2D, s: number, a: number, b: number, brush: number, hot: boolean): void {
      const pts = strokes[s];
      const u = Math.max(k, 3);
      g.globalCompositeOperation = 'lighter';
      // a faint continuous line under the stars
      g.beginPath();
      for (let i = a; i <= b; i++) {
        const [x, y] = toPx(pts[i]);
        i === a ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.lineCap = g.lineJoin = 'round';
      g.strokeStyle = BRUSHES[brush].colors[0];
      g.globalAlpha = hot ? 0.35 : 0.18;
      g.lineWidth = u * (hot ? 3.2 : 2);
      g.stroke();
      g.globalAlpha = 1;
      for (let i = Math.ceil(a / K) * K; i <= b; i += K) {
        const [x, y] = toPx(pts[i]);
        const col = starColor(s, i, brush);
        glow(g, x, y, u * (hot ? 3.6 : 2.4), col, hot ? 0.5 : 0.32);
        g.fillStyle = col;
        starPath(g, x, y, u * (hot ? 1.05 : 0.8));
        g.fill();
        if (hot) glow(g, x, y, u * 1.1, '#ffffff', 0.55);
      }
      g.globalCompositeOperation = 'source-over';
    }

    function renderLit(): void {
      const g = lit.getContext('2d')!;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, lit.width, lit.height);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const sg of segs) drawStars(g, sg.s, sg.a, sg.b, sg.brush, false);
    }

    function guide(s: number, from: number, now: number): void {
      const pts = strokes[s];
      if (from >= pts.length - 1) return;
      c.beginPath();
      for (let i = from; i < pts.length; i++) {
        const [x, y] = toPx(pts[i]);
        i === from ? c.moveTo(x, y) : c.lineTo(x, y);
      }
      const u = Math.max(k, 3);
      c.lineCap = c.lineJoin = 'round';
      c.setLineDash([]);
      c.strokeStyle = s === si ? 'rgba(110,130,210,.55)' : 'rgba(110,130,210,.25)';
      c.lineWidth = u * 2.2;
      c.stroke();
      c.setLineDash([u * 2.2, u * 1.6]);
      c.lineDashOffset = -now * 0.004 * u;
      c.strokeStyle = s === si ? '#F4F6FF' : 'rgba(244,246,255,.45)';
      c.lineWidth = u * 0.75;
      c.stroke();
      c.setLineDash([]);
    }

    function emit(x: number, y: number, n: number, spread: number): void {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = Math.random() * spread;
        const max = 400 + Math.random() * 500;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: max, max, color: RAINBOW[(Math.random() * 6) | 0], r: 2 + Math.random() * 4 });
      }
      if (sparks.length > 260) sparks.splice(0, sparks.length - 260);
    }

    let raf = 0;
    let prev = performance.now();
    function frame(now: number): void {
      const dt = Math.min(50, now - prev);
      prev = now;
      if (cv.width > 10) {
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(bg, 0, 0);
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!done) for (let s = si; s < strokes.length; s++) guide(s, s === si ? pos : 0, now);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.drawImage(lit, 0, 0);
        if (done) {
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = 0.3 + 0.3 * Math.sin((now - doneAt) / 220);
          c.drawImage(lit, 0, 0);
          c.globalAlpha = 1;
          c.globalCompositeOperation = 'source-over';
        }
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (live && pos > live.a) {
          drawStars(c, live.s, live.a, pos, brushIx, true);
          const [x, y] = toPx(strokes[si][pos]);
          c.globalCompositeOperation = 'lighter';
          glow(c, x, y, Math.max(k, 3) * 6, '#ffffff', 0.7);
          glow(c, x, y, Math.max(k, 3) * 9, BRUSHES[brushIx].colors[0], 0.5);
          c.globalCompositeOperation = 'source-over';
        }
        if (!done && !live) {
          // where to start: a pulsing light with an arrow along the line
          const pts = strokes[si];
          const [x, y] = toPx(pts[pos]);
          const big = now < hintUntil ? 1.8 : 1;
          const u = Math.max(k, 3);
          const pulse = (2.6 + 0.8 * Math.sin(now / 200)) * u * big;
          c.globalCompositeOperation = 'lighter';
          glow(c, x, y, pulse * 2.2, '#FFE53D', 0.6);
          c.globalCompositeOperation = 'source-over';
          c.fillStyle = '#FFF6B0';
          starPath(c, x, y, u * 1.6);
          c.fill();
          const j = Math.min(pts.length - 1, pos + Math.round(7 / TRACE_STEP));
          const [ax, ay] = toPx(pts[j]);
          const ang = Math.atan2(ay - y, ax - x);
          c.save();
          c.translate(ax, ay);
          c.rotate(ang);
          c.beginPath();
          c.moveTo(u * 1.6, 0);
          c.lineTo(-u * 1.2, -u * 1.3);
          c.lineTo(-u * 1.2, u * 1.3);
          c.closePath();
          c.fillStyle = 'rgba(255,246,176,.9)';
          c.fill();
          c.restore();
        }
        // sparkles
        c.globalCompositeOperation = 'lighter';
        for (let i = sparks.length - 1; i >= 0; i--) {
          const p = sparks[i];
          p.life -= dt;
          if (p.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }
          p.x += p.vx * dt * 0.06;
          p.y += p.vy * dt * 0.06;
          p.vy += 0.002 * dt;
          const t = p.life / p.max;
          c.globalAlpha = t;
          c.strokeStyle = p.color;
          c.lineWidth = 1.5;
          const r = p.r * (0.5 + t);
          c.beginPath();
          c.moveTo(p.x - r, p.y); c.lineTo(p.x + r, p.y);
          c.moveTo(p.x, p.y - r); c.lineTo(p.x, p.y + r);
          c.stroke();
          glow(c, p.x, p.y, r * 1.6, p.color, t * 0.5);
        }
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
      }
      raf = requestAnimationFrame(frame);
    }

    const toUnits = (e: PointerEvent): Pt => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left - ox) / k, (e.clientY - r.top - oy) / k];
    };
    const tol = () => Math.max(TRACE_TOL[settings.age], 24 / k);

    function step(q: Pt): void {
      const pts = strokes[si];
      const np = advance(pts, pos, q, tol(), ahead);
      if (np <= pos) return;
      pos = np;
      const [x, y] = toPx(pts[pos]);
      emit(x, y, 2, 2.2);
      const now = performance.now();
      if (now - lastPop > 90) {
        lastPop = now;
        pop(420 + 600 * (pos / pts.length), 0.07);
      }
      if (pos >= pts.length - 1) finishStroke();
    }

    function commit(): void {
      if (live && pos > live.a) segs.push({ s: live.s, a: live.a, b: pos, brush: brushIx });
      live = null;
      renderLit();
    }

    function finishStroke(): void {
      commit();
      last = null;
      const [x, y] = toPx(strokes[si][strokes[si].length - 1]);
      emit(x, y, 18, 4);
      si++;
      pos = 0;
      if (si >= strokes.length) return complete();
      pop(880, 0.15);
      status.textContent = '¡Bien! Ahora la otra línea.';
    }

    function complete(): void {
      done = true;
      doneAt = performance.now();
      for (const s of strokes) for (let i = 0; i < s.length; i += 12) {
        const [x, y] = toPx(s[i]);
        emit(x, y, 2, 3);
      }
      [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => pop(f, 0.2), i * 120));
      status.textContent = `¡Lo lograste! ${fig.es} · ${fig.en}`;
      nextBtn.classList.add('pulse');
      ctx.sayPair(`¡Lo lograste! ${fig.es.replace(/^\d+ · /, '')}`, `You did it! ${fig.en}`);
    }

    function undo(): void {
      const sg = segs.pop();
      if (!sg) return;
      si = sg.s;
      pos = sg.a;
      done = false;
      nextBtn.classList.remove('pulse');
      status.textContent = 'Sigue la línea desde la luz.';
      renderLit();
    }

    cv.addEventListener('pointerdown', (e) => {
      if (done) return;
      const q = toUnits(e);
      const pts = strokes[si];
      if (advance(pts, pos, q, tol(), ahead) === pos && Math.hypot(q[0] - pts[pos][0], q[1] - pts[pos][1]) > tol()) {
        hintUntil = performance.now() + 900;
        if (!hinted) {
          hinted = true;
          ctx.sayPair('Empieza en la estrellita que brilla', 'Start at the shining star');
        }
        return;
      }
      cv.setPointerCapture(e.pointerId);
      live = { s: si, a: pos };
      last = q;
      step(q);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!live || done) return;
      const evs = e.getCoalescedEvents?.() ?? [e];
      for (const ev of evs.length ? evs : [e]) {
        const q = toUnits(ev);
        // walk from the last point in small steps so quick swipes still follow the line
        const from = last ?? q;
        const n = Math.max(1, Math.ceil(Math.hypot(q[0] - from[0], q[1] - from[1]) / 1.2));
        for (let i = 1; i <= n && live; i++) step([from[0] + ((q[0] - from[0]) * i) / n, from[1] + ((q[1] - from[1]) * i) / n]);
        last = q;
        if (!live) break;
      }
    });
    const end = () => {
      if (!live) return;
      const moved = pos > live.a;
      commit();
      last = null;
      if (moved) {
        const [x, y] = toPx(strokes[si][pos]);
        emit(x, y, 8, 2.5);
      }
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);

    const ro = new ResizeObserver(layout);
    ro.observe(wrap);
    raf = requestAnimationFrame(frame);
    stop = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    ctx.sayPair(`Sigue la línea con tu dedo: ${fig.es.replace(/^\d+ · /, '')}`, `Trace the line: ${fig.en}`);

    if (location.search.includes('e2e')) {
      (window as unknown as { __pymTrace?: () => Pt[][] }).__pymTrace = () => {
        const r = cv.getBoundingClientRect();
        return strokes.map((s) => s.filter((_, i) => i % 4 === 0 || i === s.length - 1).map((p) => [r.left + ox + p[0] * k, r.top + oy + p[1] * k] as Pt));
      };
    }
  }

  showPicker();
  return {
    el,
    destroy: () => stop?.(),
    onHelp: () => ctx.sayPair('Pon tu dedo en la estrellita que brilla y sigue la línea sin soltar', 'Put your finger on the shining star and follow the line'),
  };
}
