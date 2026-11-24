import { CHARACTER_ORDER, charOf } from '../../content/characters';
import { addToAlbum } from '../../core/album';
import { pop } from '../../core/audio';
import { clusterColors, insideDistance, isPaper, labelRegions, PN_GRID, PN_MAX_COLORS, usesSymbols, type RGB } from '../../core/paintnum';
import { settings } from '../../core/settings';
import type { CharKey } from '../../core/types';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h } from '../dom';
import { exitBtn, shake } from './gamekit';
import { drawZoomed } from './reveal';

type Mode = 'zones' | 'squares';
const N = 640;
const DONE_KEY = 'pym-pn-done';
let lastMode: Mode = 'zones';

const doneSet = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(DONE_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
};
const markDone = (id: string) => localStorage.setItem(DONE_KEY, JSON.stringify([...doneSet().add(id)]));

const SYMBOL_NAME = ['corazón', 'círculo', 'rombo', 'estrella', 'triángulo', 'cuadrado', 'flor', 'luna'];
const SYMBOL_SVG = [
  '<path d="M50 86C20 64 8 48 8 32 8 18 19 9 31 9c8 0 15 4 19 11 4-7 11-11 19-11 12 0 23 9 23 23 0 16-12 32-42 54z"/>',
  '<circle cx="50" cy="50" r="38"/>',
  '<path d="M50 6l40 44-40 44-40-44z"/>',
  '<path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2z"/>',
  '<path d="M50 10l42 78H8z"/>',
  '<rect x="12" y="12" width="76" height="76" rx="8"/>',
  '<g><circle cx="50" cy="26" r="16"/><circle cx="74" cy="44" r="16"/><circle cx="65" cy="72" r="16"/><circle cx="35" cy="72" r="16"/><circle cx="26" cy="44" r="16"/></g>',
  '<path d="M64 8A42 42 0 1 0 92 70 34 34 0 1 1 64 8z"/>',
];
const symbolPaths = SYMBOL_SVG.map((s) => {
  const p = new Path2D();
  const div = document.createElement('div');
  div.innerHTML = `<svg>${s}</svg>`;
  for (const n of div.querySelectorAll('path,circle,rect')) {
    if (n.tagName === 'path') p.addPath(new Path2D(n.getAttribute('d')!));
    else if (n.tagName === 'circle') {
      const [cx, cy, r] = ['cx', 'cy', 'r'].map((a) => Number(n.getAttribute(a)));
      p.moveTo(cx + r, cy);
      p.arc(cx, cy, r, 0, Math.PI * 2);
    } else {
      const [x, y, w, hh] = ['x', 'y', 'width', 'height'].map((a) => Number(n.getAttribute(a)));
      p.rect(x, y, w, hh);
    }
  }
  return p;
});

const hex = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;
const light = (c: RGB): boolean => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11 > 170;

/** Pinta por números: each area (or square) shows a number, or a shape for the little ones; paint it with that paint. */
export function paintnumScreen(ctx: Ctx): Screen {
  const el = h('div', { class: 'view' });
  const sym = usesSymbols(settings.age);

  function showPicker(): void {
    const done = doneSet();
    const tabs = h('div', { class: 'pn-tabs', role: 'tablist' },
      ...(['zones', 'squares'] as Mode[]).map((m) => h('button', {
        class: 'wtab', role: 'tab', 'aria-selected': String(m === lastMode),
        onClick: () => ((lastMode = m), showPicker()),
      }, m === 'zones' ? 'Zonas · Areas' : 'Cuadritos · Squares')));
    const grid = h('div', { class: 'pick-grid' }, ...CHARACTER_ORDER.map((key) => {
      const th = canvas(300, 225);
      drawThumb(th, key, 'line');
      const ch = charOf(key);
      return h('button', { class: 'pick-card', dataset: { key }, 'aria-label': ch.label, onClick: () => (pop(520, 0.1), play(key, lastMode)) },
        th, h('span', null, ch.label), done.has(`${lastMode}:${key}`) ? h('b', { class: 'pn-check', 'aria-label': 'terminado' }, '✓') : null);
    }));
    el.replaceChildren(h('div', { class: 'pick pnpick' },
      h('div', { class: 'ghead' }, h('h2', null, 'Pinta por números', h('small', null, sym ? 'Paint by shapes · Cada figura tiene su color' : 'Paint by numbers · Cada número tiene su color')), exitBtn(ctx)),
      tabs, grid));
    el.scrollTop = 0;
  }

  function play(key: CharKey, mode: Mode): void {
    const ch = charOf(key);
    // --- read the picture ---
    const ref = canvas(N, N);
    drawZoomed(ref, key, 'fill');
    const refPx = ref.getContext('2d')!.getImageData(0, 0, N, N).data;
    const lines = canvas(N, N, 'pn-lines');
    drawZoomed(lines, key, 'line', 6, false);
    const paint = canvas(N, N, 'pn-paint');
    const marks = canvas(N, N, 'pn-marks');
    const pc = paint.getContext('2d')!;
    const mc = marks.getContext('2d')!;

    // areas: zones are regions between lines; squares are grid cells
    let areaOf: (x: number, y: number) => number; // area under a canvas pixel, -1 none
    let colorOfArea: number[] = []; // paint index per area, -1 = nothing to paint
    let labelAt: [number, number, number][] = []; // x, y, size per area
    let palette: RGB[] = [];
    const filled: boolean[] = [];
    let drawPaint: () => void;

    if (mode === 'zones') {
      const lp = lines.getContext('2d')!.getImageData(0, 0, N, N).data;
      const wall = new Uint8Array(N * N);
      for (let i = 0; i < N * N; i++) wall[i] = lp[i * 4 + 3] > 90 ? 1 : 0;
      const reg = labelRegions(wall, N, N);
      const sum = Array.from({ length: reg.count }, () => [0, 0, 0]);
      for (let i = 0; i < N * N; i++) {
        const r = reg.labels[i];
        if (r < 0) continue;
        sum[r][0] += refPx[i * 4];
        sum[r][1] += refPx[i * 4 + 1];
        sum[r][2] += refPx[i * 4 + 2];
      }
      const dist = insideDistance(reg.labels, N, N);
      const best = Array.from({ length: reg.count }, () => [0, 0, 0] as [number, number, number]);
      for (let i = 0; i < N * N; i++) {
        const r = reg.labels[i];
        if (r >= 0 && dist[i] > best[r][2]) best[r] = [i % N, (i / N) | 0, dist[i]];
      }
      const avg: RGB[] = sum.map((s, r) => s.map((v) => Math.round(v / reg.area[r])) as RGB);
      const paintable = avg.map((c, r) => !reg.edge[r] && reg.area[r] > 40 && !isPaper(c));
      const idx = avg.map((_, r) => r).filter((r) => paintable[r]);
      const cl = clusterColors(idx.map((r) => avg[r]), idx.map((r) => reg.area[r]), PN_MAX_COLORS[settings.age]);
      palette = cl.palette;
      colorOfArea = new Array(reg.count).fill(-1);
      idx.forEach((r, k) => (colorOfArea[r] = cl.of[k]));
      labelAt = best.map(([x, y, d]) => [x, y, Math.min(56, Math.max(16, d * 1.2))]);
      for (let r = 0; r < reg.count; r++) filled[r] = colorOfArea[r] < 0 || best[r][2] < 5; // too small to tap: painted already
      // let lines borrow a neighbour's area so paint tucks under them
      const own = Int32Array.from(reg.labels);
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < N * N; i++) {
          if (own[i] >= 0) continue;
          const x = i % N;
          const nb = [x > 0 ? i - 1 : -1, x < N - 1 ? i + 1 : -1, i - N, i + N].find((j) => j >= 0 && j < N * N && own[j] >= 0);
          if (nb !== undefined) own[i] = -10 - own[nb];
        }
        for (let i = 0; i < N * N; i++) if (own[i] <= -10) own[i] = -10 - own[i];
      }
      areaOf = (x, y) => {
        // a tap on a line counts for the nearest area around it
        for (let rr = 0; rr <= 10; rr += 2) for (const [dx, dy] of [[0, 0], [rr, 0], [-rr, 0], [0, rr], [0, -rr]]) {
          const xx = Math.round(x + dx), yy = Math.round(y + dy);
          if (xx < 0 || yy < 0 || xx >= N || yy >= N) continue;
          const r = reg.labels[yy * N + xx];
          if (r >= 0) return r;
        }
        return -1;
      };
      const img = pc.createImageData(N, N);
      drawPaint = () => {
        const sel = selected;
        const selCol = palette[sel];
        for (let i = 0; i < N * N; i++) {
          const r = own[i];
          let c: RGB = [255, 255, 255];
          if (r >= 0 && colorOfArea[r] >= 0) {
            if (filled[r]) c = palette[colorOfArea[r]];
            else if (colorOfArea[r] === sel) {
              // the areas still waiting for the chosen paint: soft stripes of that colour
              const x = i % N, y = (i / N) | 0;
              c = ((x + y) >> 3) % 2 ? [255, 255, 255] : [Math.round(255 - (255 - selCol[0]) * 0.35), Math.round(255 - (255 - selCol[1]) * 0.35), Math.round(255 - (255 - selCol[2]) * 0.35)];
            } else c = [244, 246, 250];
          }
          img.data[i * 4] = c[0];
          img.data[i * 4 + 1] = c[1];
          img.data[i * 4 + 2] = c[2];
          img.data[i * 4 + 3] = 255;
        }
        pc.putImageData(img, 0, 0);
      };
    } else {
      const G = PN_GRID[settings.age];
      const cell = N / G;
      const cols: RGB[] = [];
      const cellIdx: number[] = [];
      for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
        // the most common colour in the square (white counts only if it is most of it)
        const hist = new Map<number, number>();
        let white = 0, total = 0;
        for (let y = Math.floor(gy * cell); y < (gy + 1) * cell; y += 2) for (let x = Math.floor(gx * cell); x < (gx + 1) * cell; x += 2) {
          const i = (y * N + x) * 4;
          const c: RGB = [refPx[i], refPx[i + 1], refPx[i + 2]];
          total++;
          if (isPaper(c)) {
            white++;
            continue;
          }
          const q = ((c[0] >> 4) << 8) | ((c[1] >> 4) << 4) | (c[2] >> 4);
          hist.set(q, (hist.get(q) ?? 0) + 1);
        }
        if (white > total * 0.55 || !hist.size) {
          colorOfArea.push(-1);
          continue;
        }
        const q = [...hist].sort((a, b) => b[1] - a[1])[0][0];
        cols.push([((q >> 8) & 15) * 17, ((q >> 4) & 15) * 17, (q & 15) * 17]);
        cellIdx.push(colorOfArea.length);
        colorOfArea.push(0);
      }
      const cl = clusterColors(cols, cols.map(() => 1), PN_MAX_COLORS[settings.age], 60);
      palette = cl.palette;
      cellIdx.forEach((a, k) => (colorOfArea[a] = cl.of[k]));
      colorOfArea.forEach((c, a) => {
        filled[a] = c < 0;
        labelAt[a] = [((a % G) + 0.5) * cell, (Math.floor(a / G) + 0.5) * cell, cell * 0.5];
      });
      lines.getContext('2d')!.clearRect(0, 0, N, N);
      areaOf = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? -1 : Math.floor(y / cell) * G + Math.floor(x / cell));
      drawPaint = () => {
        pc.fillStyle = '#fff';
        pc.fillRect(0, 0, N, N);
        colorOfArea.forEach((c, a) => {
          const x = (a % G) * cell, y = Math.floor(a / G) * cell;
          if (c >= 0 && filled[a]) pc.fillStyle = hex(palette[c]);
          else if (c >= 0 && c === selected) {
            const s = palette[c];
            pc.fillStyle = `rgba(${s[0]},${s[1]},${s[2]},.28)`;
          } else return;
          pc.fillRect(x, y, cell, cell);
        });
        pc.strokeStyle = '#C3D0E4';
        pc.lineWidth = 1.5;
        pc.beginPath();
        for (let i = 0; i <= G; i++) {
          pc.moveTo(i * cell, 0); pc.lineTo(i * cell, N);
          pc.moveTo(0, i * cell); pc.lineTo(N, i * cell);
        }
        pc.stroke();
      };
    }

    let selected = 0;
    const leftOf = (k: number) => colorOfArea.filter((c, a) => c === k && !filled[a]).length;

    function drawMarks(): void {
      mc.clearRect(0, 0, N, N);
      mc.textAlign = 'center';
      mc.textBaseline = 'middle';
      colorOfArea.forEach((c, a) => {
        if (c < 0 || filled[a]) return;
        const [x, y, s] = labelAt[a];
        const hot = c === selected;
        if (sym) {
          mc.save();
          mc.translate(x - s * 0.42, y - s * 0.42);
          mc.scale((s * 0.84) / 100, (s * 0.84) / 100);
          mc.fillStyle = hot ? hex(palette[c]) : '#fff';
          mc.fill(symbolPaths[c]);
          mc.lineWidth = 9;
          mc.strokeStyle = hot ? '#22304F' : '#7E8BA8';
          mc.stroke(symbolPaths[c]);
          mc.restore();
        } else {
          mc.font = `800 ${Math.round(s * 0.95)}px "Baloo 2", "Trebuchet MS", sans-serif`;
          mc.fillStyle = hot ? '#22304F' : '#7E8BA8';
          mc.fillText(String(c + 1), x, y + 1);
        }
      });
    }

    const palBtns = palette.map((p, k) => h('button', {
      class: 'pn-swatch', 'aria-label': sym ? `Color ${SYMBOL_NAME[k]}` : `Color ${k + 1}`,
      style: `--c:${hex(p)};--t:${light(p) ? '#22304F' : '#fff'}`,
      onClick: () => select(k, true),
    }, sym ? h('span', { class: 'pn-sym', html: `<svg viewBox="0 0 100 100">${SYMBOL_SVG[k]}</svg>` }) : String(k + 1)));
    const pal = h('div', { class: 'pn-pal' }, ...palBtns);

    function refreshPal(): void {
      palBtns.forEach((b, k) => {
        b.setAttribute('aria-pressed', String(k === selected));
        b.classList.toggle('done', leftOf(k) === 0);
      });
    }

    function select(k: number, voice: boolean): void {
      selected = k;
      pop(560 + k * 50, 0.08);
      if (voice) {
        if (sym) ctx.sayOne(SYMBOL_NAME[k], 'es');
        else ctx.sayPair(`Número ${k + 1}`, `Number ${k + 1}`);
      }
      refreshPal();
      drawPaint();
      drawMarks();
    }

    const status = h('p', { class: 'gstatus', role: 'status' }, sym ? 'Elige un color y toca las figuras iguales.' : 'Elige un color y pinta las partes con su número.');
    const actions = h('div', { class: 'rv-actions', hidden: true },
      h('button', { class: 'bigbtn', onClick: showPicker }, 'Otro dibujo'),
      h('button', { class: 'bigbtn alt', onClick: () => play(key, mode === 'zones' ? 'squares' : 'zones') }, mode === 'zones' ? 'En cuadritos' : 'En zonas'));
    const stage = h('div', { class: `pn-stage ${mode}` }, paint, lines, marks);
    el.replaceChildren(h('div', { class: 'pnplay' },
      h('div', { class: 'ghead' }, h('button', { class: 'bigbtn alt small gexit', onClick: showPicker }, '← Dibujos'), h('h2', null, ch.label, h('small', null, mode === 'zones' ? 'Zonas' : 'Cuadritos'))),
      h('div', { class: 'pn-body' }, h('div', { class: 'pn-box' }, stage), pal),
      status, actions));

    let complete = false;
    function tryPaint(a: number, fromDrag: boolean): void {
      if (complete || a < 0 || filled[a] || colorOfArea[a] < 0) return;
      const want = colorOfArea[a];
      if (want !== selected) {
        if (fromDrag) return;
        shake(palBtns[want]);
        pop(220, 0.12);
        if (sym) ctx.sayOne(`Esta parte va con el ${SYMBOL_NAME[want]}`, 'es');
        else ctx.sayPair(`Esta parte es el ${want + 1}`, `This part is number ${want + 1}`);
        return;
      }
      filled[a] = true;
      pop(600 + Math.random() * 300, 0.08);
      if (leftOf(selected) === 0) {
        const next = palette.findIndex((_, k) => leftOf(k) > 0);
        if (next >= 0) setTimeout(() => select(next, true), 250);
      }
      refreshPal();
      drawPaint();
      drawMarks();
      if (filled.every((f) => f)) finish();
    }

    function finish(): void {
      complete = true;
      markDone(`${mode}:${key}`);
      status.textContent = `¡Terminaste! ${ch.label} · ${ch.vocab.en}`;
      actions.hidden = false;
      stage.classList.add('win');
      [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => pop(f, 0.2), i * 120));
      ctx.sayPair(`¡Terminaste! ${ch.vocab.es}`, `You finished! ${ch.vocab.en}`);
      const out = canvas(N, N);
      const oc = out.getContext('2d')!;
      oc.drawImage(paint, 0, 0);
      oc.drawImage(lines, 0, 0);
      void addToAlbum(key, 'colored', out).catch(() => {});
    }

    const at = (e: PointerEvent): [number, number] => {
      const r = paint.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * N, ((e.clientY - r.top) / r.height) * N];
    };
    let down = false;
    stage.addEventListener('pointerdown', (e) => {
      down = true;
      stage.setPointerCapture(e.pointerId);
      tryPaint(areaOf(...at(e)), false);
    });
    stage.addEventListener('pointermove', (e) => {
      if (down && mode === 'squares') tryPaint(areaOf(...at(e)), true);
    });
    stage.addEventListener('pointerup', () => (down = false));
    stage.addEventListener('pointercancel', () => (down = false));

    if (!palette.length) return finish();
    select(palette.findIndex((_, k) => leftOf(k) > 0) === -1 ? 0 : palette.findIndex((_, k) => leftOf(k) > 0), false);
    if (filled.every((f) => f)) finish();
    ctx.sayPair(sym ? 'Toca un color y pinta las figuras iguales' : 'Toca un número y pinta sus partes', sym ? 'Pick a color and paint the matching shapes' : 'Pick a number and paint its parts');

    if (location.search.includes('e2e')) {
      (window as unknown as { __pymPaint?: () => { pal: number; todo: [number, number, number][] } }).__pymPaint = () => {
        const r = paint.getBoundingClientRect();
        const todo: [number, number, number][] = [];
        colorOfArea.forEach((c, a) => {
          if (c < 0 || filled[a]) return;
          const [x, y] = labelAt[a];
          todo.push([c, r.left + (x / N) * r.width, r.top + (y / N) * r.height]);
        });
        return { pal: palette.length, todo };
      };
    }
  }

  showPicker();
  return {
    el,
    onHelp: () => ctx.sayPair(sym ? 'Cada figura tiene su color. Toca el color y luego las partes con esa figura.' : 'Cada número tiene su color. Toca el número y luego las partes con ese número.', 'Each number has its own color.'),
  };
}
