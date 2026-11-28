import { pop } from '../../core/audio';
import { makeSudoku, sudokuFor, type Sudoku } from '../../core/puzzles';
import { settings } from '../../core/settings';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { levelPicker, shake } from './gamekit';
import { HEART_SVG, STAR_SVG } from './gato';

const PICS = [
  STAR_SVG,
  HEART_SVG,
  '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="#7FD3FF" stroke="#22304F" stroke-width="5"/></svg>',
  '<svg viewBox="0 0 100 100"><path d="M50 12l40 74H10z" fill="#5DBB63" stroke="#22304F" stroke-width="5" stroke-linejoin="round"/></svg>',
];
const PIC_NAME = [
  { es: 'estrella', en: 'star' },
  { es: 'corazón', en: 'heart' },
  { es: 'círculo', en: 'circle' },
  { es: 'triángulo', en: 'triangle' },
];

/** Sudoku: 4×4 with pictures (3–4), 4×4 with numbers (5–6), 6×6 (7–9). A wrong symbol is not placed. */
export function sudokuScreen(ctx: Ctx): Screen {
  const spec = sudokuFor(settings.age, settings.levels.sudoku);
  let s: Sudoku;
  let grid: number[] = [];
  let sel = -1;
  const wrap = h('div', { class: 'sudokug' });
  const el = h('div', { class: 'view' }, wrap);
  const status = h('p', { class: 'gstatus', role: 'status' });
  const board = h('div', { class: 'sboard', style: `--n:${spec.n}` });
  const palette = h('div', { class: 'spal' });

  const sym = (v: number) => (spec.pictures ? { html: PICS[v - 1] } : {});
  const symText = (v: number) => (spec.pictures ? '' : String(v));

  function start(): void {
    s = makeSudoku(spec);
    grid = [...s.given];
    sel = grid.indexOf(0);
    status.textContent = 'Cada fila, columna y cuadro tiene uno de cada uno';
    render();
    ctx.sayPair('Llena los espacios. En cada fila, columna y cuadro va uno de cada uno.', 'Fill the gaps. One of each in every row, column and box.');
  }

  function render(): void {
    board.replaceChildren(...grid.map((v, i) => {
      const r = Math.floor(i / spec.n), c = i % spec.n;
      const cls = ['scell'];
      if (s.given[i]) cls.push('given');
      if (i === sel) cls.push('sel');
      if (c % spec.boxW === spec.boxW - 1 && c < spec.n - 1) cls.push('bR');
      if (r % spec.boxH === spec.boxH - 1 && r < spec.n - 1) cls.push('bB');
      return h('button', { class: cls.join(' '), 'aria-label': v ? `Fila ${r + 1}, columna ${c + 1}: ${v}` : `Fila ${r + 1}, columna ${c + 1}: vacío`, disabled: !!s.given[i], ...(v ? sym(v) : {}), onClick: () => ((sel = i), render()) }, v ? symText(v) : '');
    }));
    palette.replaceChildren(...Array.from({ length: spec.n }, (_, k) => {
      const v = k + 1;
      const b: HTMLButtonElement = h('button', { class: 'spick', 'aria-label': spec.pictures ? PIC_NAME[k].es : String(v), ...sym(v), onClick: () => place(v, b) }, symText(v));
      return b;
    }));
  }

  function place(v: number, btn: HTMLElement): void {
    if (sel < 0 || grid[sel]) return;
    if (spec.pictures) ctx.sayPair(PIC_NAME[v - 1].es, PIC_NAME[v - 1].en);
    if (s.solution[sel] !== v) {
      shake(btn);
      pop(220, 0.12);
      status.textContent = 'Ahí no va: revisa la fila, la columna y el cuadro';
      return;
    }
    grid[sel] = v;
    pop(600, 0.1);
    const nextEmpty = grid.indexOf(0, sel);
    sel = nextEmpty >= 0 ? nextEmpty : grid.indexOf(0);
    render();
    if (!grid.includes(0)) {
      pop(880, 0.35);
      status.textContent = '¡Resuelto! · Solved!';
      ctx.sayPair('¡Lo resolviste!', 'You solved it!');
    } else status.textContent = '¡Bien! · Good!';
  }

  wrap.append(
    h('div', { class: 'ghead' }, h('h2', null, 'Sudoku', h('small', null, spec.pictures ? 'Con dibujos · Toca un espacio y luego un dibujo' : 'Toca un espacio y luego un número')), levelPicker(ctx, 'sudoku', () => ctx.show('sudoku', 'none'))),
    status,
    h('div', { class: 'sbox' }, board, palette),
    h('div', { class: 'kbtnrow gbtns' }, h('button', { class: 'bigbtn alt small', onClick: start }, 'Otro sudoku · New')),
  );
  start();
  return { el, onHelp: () => ctx.sayPair('En cada fila, columna y cuadro va uno de cada uno.', 'One of each in every row, column and box.') };
}
