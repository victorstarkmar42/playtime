import { kindFor, spellLang } from '../../core/guess';
import { settings } from '../../core/settings';
import { levelFor } from '../../core/tictactoe';
import type { Ctx, Screen, ScreenName } from '../context';
import { h } from '../dom';
import { exitBtn } from './gamekit';
import { HEART_SVG, LEVEL_LABEL, STAR_SVG } from './gato';

const inner = (svg: string) => svg.replace(/<\/?svg[^>]*>/g, '');
const T = (x: number, y: number, t: string, color: string) =>
  `<text x="${x}" y="${y}" font-size="16" font-weight="800" text-anchor="middle" fill="${color}" font-family="sans-serif">${t}</text>`;
const ICON = {
  letters: `<svg viewBox="0 0 100 100"><rect x="8" y="14" width="38" height="38" rx="10" fill="#fff" stroke="#22304F" stroke-width="5"/><rect x="54" y="14" width="38" height="38" rx="10" fill="#fff" stroke="#22304F" stroke-width="5"/><rect x="31" y="56" width="38" height="38" rx="10" fill="#FFD54A" stroke="#22304F" stroke-width="5"/>${T(27, 40, 'A', '#F2672E').replace('font-size="16"', 'font-size="24"')}${T(73, 40, 'b', '#3FA35B').replace('font-size="16"', 'font-size="24"')}${T(50, 82, 'c', '#7B61D9').replace('font-size="16"', 'font-size="24"')}</svg>`,
  guess: '<svg viewBox="0 0 100 100"><rect x="10" y="12" width="80" height="60" rx="14" fill="#fff" stroke="#22304F" stroke-width="5"/><path d="M22 62l18-20 12 12 10-8 18 16" fill="#9FD8A8" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/><circle cx="68" cy="30" r="7" fill="#F2B91C"/><circle cx="72" cy="78" r="16" fill="#7B61D9" stroke="#22304F" stroke-width="4"/><text x="72" y="85" font-size="22" font-weight="800" text-anchor="middle" fill="#fff" font-family="sans-serif">?</text></svg>',
  gato: `<svg viewBox="0 0 100 100"><path d="M36 10v80M64 10v80M10 36h80M10 64h80" stroke="#22304F" stroke-width="5" stroke-linecap="round"/><g transform="translate(12 12) scale(.2)">${inner(STAR_SVG)}</g><g transform="translate(68 40) scale(.2)">${inner(HEART_SVG)}</g><g transform="translate(40 68) scale(.2)">${inner(STAR_SVG)}</g></svg>`,
  math: '<svg viewBox="0 0 100 100"><rect x="12" y="12" width="76" height="76" rx="16" fill="#fff" stroke="#22304F" stroke-width="5"/><path d="M32 30v20M22 40h20M58 40h20M24 66l16 16M40 66L24 82M58 70h20M58 78h20" stroke="#F2672E" stroke-width="6" stroke-linecap="round"/></svg>',
  abacus: '<svg viewBox="0 0 100 100"><rect x="8" y="10" width="84" height="80" rx="8" fill="none" stroke="#B5654A" stroke-width="7"/><path d="M12 32h76M12 52h76M12 72h76" stroke="#22304F" stroke-width="3"/><g stroke="#22304F" stroke-width="3"><circle cx="24" cy="32" r="7" fill="#F2672E"/><circle cx="38" cy="32" r="7" fill="#F2672E"/><circle cx="76" cy="32" r="7" fill="#F2672E"/><circle cx="24" cy="52" r="7" fill="#3FA35B"/><circle cx="62" cy="52" r="7" fill="#3FA35B"/><circle cx="76" cy="52" r="7" fill="#3FA35B"/><circle cx="24" cy="72" r="7" fill="#7B61D9"/><circle cx="38" cy="72" r="7" fill="#7B61D9"/><circle cx="52" cy="72" r="7" fill="#7B61D9"/></g></svg>',
  maze: '<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="6" fill="#fff" stroke="#22304F" stroke-width="6"/><path d="M30 10v40M30 70h40M50 30v40M70 10v40M10 50h20M70 50h20" stroke="#22304F" stroke-width="6" stroke-linecap="round"/><circle cx="20" cy="20" r="6" fill="#5DBB63"/><path d="M80 72l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#FFD54A" stroke="#22304F" stroke-width="2"/></svg>',
  sudoku: `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="8" fill="#fff" stroke="#22304F" stroke-width="5"/><path d="M30 10v80M70 10v80M10 30h80M10 70h80" stroke="#B9CFE6" stroke-width="2"/><path d="M50 10v80M10 50h80" stroke="#22304F" stroke-width="5"/>${T(20, 26, '1', '#F2672E')}${T(60, 46, '2', '#3FA35B')}${T(40, 66, '3', '#7B61D9')}${T(80, 86, '4', '#4AA3F0')}</svg>`,
  crossword: `<svg viewBox="0 0 100 100"><g stroke="#22304F" stroke-width="4" fill="#fff"><rect x="10" y="38" width="20" height="20"/><rect x="30" y="38" width="20" height="20"/><rect x="50" y="38" width="20" height="20"/><rect x="70" y="38" width="20" height="20"/><rect x="50" y="18" width="20" height="20"/><rect x="50" y="58" width="20" height="20"/><rect x="50" y="78" width="20" height="18"/></g>${T(20, 54, 'S', '#F2672E')}${T(40, 54, 'O', '#F2672E')}${T(60, 54, 'L', '#F2672E')}</svg>`,
};

const AGE_TEXT = {
  letters: { '3-4': 'Oye la palabra y toca la letra con la que empieza.', '5-6': 'Completa la palabra con la letra que falta.', '7-9': 'Letras que se parecen (b, d, p…) y busca todas las letras.' },
  guess: { 'pick-image': 'Escucha la palabra y toca su dibujo.', 'pick-word': 'Mira el dibujo y toca su palabra.' },
  math: { '3-4': 'Cuenta estrellas.', '5-6': 'Contar, sumas y restas hasta 10, con dibujos, y ¿qué número falta? (4 + ? = 5).', '7-9': 'Sumas y restas hasta 100, multiplicaciones, divisiones y ¿qué número falta?' },
  abacus: { '3-4': 'Una fila de 10 cuentas: cuenta en voz alta.', '5-6': 'Dos filas: números hasta el 20.', '7-9': 'Centenas, decenas y unidades: hasta 999.' },
  maze: { '3-4': 'Laberintos pequeños (4 × 3).', '5-6': 'Laberintos medianos (7 × 5).', '7-9': 'Laberintos grandes (11 × 8).' },
  sudoku: { '3-4': '4 × 4 con dibujos, pocos espacios.', '5-6': '4 × 4 con números.', '7-9': '6 × 6 con números.' },
  crossword: { '3-4': '2 palabras cortas con casi todas las letras.', '5-6': '3 palabras con algunas letras.', '7-9': '5 palabras desde cero.' },
} as const;

/** Games menu, explained for the current age. */
export function gamesScreen(ctx: Ctx): Screen {
  const age = settings.age;
  const kind = kindFor(age);
  const inLang = spellLang(settings.lang) === 'en' ? 'inglés' : 'español';
  const guessHelp = kind === 'spell' ? `Mira el dibujo y escribe su nombre en ${inLang}.` : AGE_TEXT.guess[kind];
  const card = (to: ScreenName, cls: string, icon: string, es: string, en: string, help: string) =>
    h('button', { class: `tile gtile-card ${cls}`, onClick: () => (ctx.sayPair(es, en), ctx.show(to)) },
      h('span', { class: 'tile-ico', html: icon }), es, h('small', null, en), h('span', { class: 'ghelp' }, help));
  const el = h('div', { class: 'view' },
    h('div', { class: 'games' },
      h('div', { class: 'ghead' }, h('h2', null, 'Juegos', h('small', null, `Games · Para ${age.replace('-', '–')} años (la edad se cambia en Inicio)`)), exitBtn(ctx, 'home')),
      h('div', { class: 'games-grid' },
        card('math', 'g3', ICON.math, 'Cuentas', 'Math', AGE_TEXT.math[age]),
        card('abacus', 'g4', ICON.abacus, 'Ábaco', 'Abacus', AGE_TEXT.abacus[age]),
        card('letters', 'g8', ICON.letters, 'Letras', 'Letters', AGE_TEXT.letters[age]),
        card('guess', 'g1', ICON.guess, 'Adivina la palabra', 'Guess the word', guessHelp),
        card('crossword', 'g6', ICON.crossword, 'Crucigrama', 'Crossword', `${AGE_TEXT.crossword[age]} Con dibujos, en ${inLang}.`),
        card('maze', 'g5', ICON.maze, 'Laberinto', 'Maze', AGE_TEXT.maze[age]),
        card('sudoku', 'g7', ICON.sudoku, 'Sudoku', 'Sudoku', AGE_TEXT.sudoku[age]),
        card('gato', 'g2', ICON.gato, 'Gato', 'Tic-tac-toe', `Dos jugadores en este dispositivo, o contra la compu (nivel ${LEVEL_LABEL[levelFor(age)]}).`),
      ),
    ),
  );
  return { el };
}
