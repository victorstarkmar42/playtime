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
  trace: '<svg viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="18" fill="#0B1440"/><path d="M50 22l9 20 22 2-17 14 6 21-20-12-20 12 6-21-17-14 22-2z" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="6 5" stroke-linejoin="round"/><circle cx="50" cy="22" r="4" fill="#FFE53D"/><circle cx="59" cy="42" r="4" fill="#FF3EA5"/><circle cx="81" cy="44" r="4" fill="#45F27A"/><circle cx="64" cy="58" r="4" fill="#3D8BFF"/></svg>',
  reveal: '<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="10" fill="#F7D35E" stroke="#22304F" stroke-width="4"/><path d="M30 24l6 12 13 1-10 8 4 13-13-8-11 8 3-13-10-8 13-1z" fill="#D9AE2E"/><path d="M50 40c10-12 30-6 32 8 3 16-8 30-24 30-14 0-22-12-18-22 2-7 6-12 10-16z" fill="#fff" stroke="#FFF1B8" stroke-width="5"/><circle cx="58" cy="56" r="4" fill="#22304F"/><circle cx="72" cy="56" r="4" fill="#22304F"/><path d="M60 66q5 5 10 0" stroke="#22304F" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  paintnum: `<svg viewBox="0 0 100 100"><rect x="8" y="8" width="84" height="84" rx="14" fill="#fff" stroke="#22304F" stroke-width="5"/><path d="M12 12h36v36H12z" fill="#7FD0F2"/><path d="M52 52h36v36H52z" fill="#FF6FB5"/><path d="M8 50h84M50 8v84" stroke="#22304F" stroke-width="4"/>${T(30, 38, '1', '#22304F').replace('font-size="16"', 'font-size="22"')}${T(70, 38, '2', '#7E8BA8').replace('font-size="16"', 'font-size="22"')}${T(30, 78, '3', '#7E8BA8').replace('font-size="16"', 'font-size="22"')}${T(70, 78, '2', '#fff').replace('font-size="16"', 'font-size="22"')}</svg>`,
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
  trace: { '3-4': 'Sigue la línea con el dedo: figuras, números y dibujos que se encienden.', '5-6': 'Traza figuras, números y dibujos; la línea se llena de estrellas de luz.', '7-9': 'Traza números, figuras y el contorno de cada dibujo con más precisión.' },
  paintnum: { '3-4': 'Cada figura (corazón, círculo, rombo…) tiene su color: pinta las partes iguales.', '5-6': 'Pinta cada parte con el color de su número (hasta 6 colores).', '7-9': 'Pinta por números con hasta 8 colores, en zonas o en cuadritos.' },
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
        card('trace', 'g9', ICON.trace, 'Trazos de luz', 'Light trails', AGE_TEXT.trace[age]),
        card('reveal', 'g10', ICON.reveal, 'Destapa el dibujo', 'Unwrap it', 'Rompe el papel de regalo para descubrir un dibujo y luego coloréalo.'),
        card('paintnum', 'g11', ICON.paintnum, 'Pinta por números', 'Paint by numbers', AGE_TEXT.paintnum[age]),
        card('math', 'g3', ICON.math, 'Cuentas', 'Math', AGE_TEXT.math[age]),
        card('abacus', 'g4', ICON.abacus, 'Ábaco', 'Abacus', AGE_TEXT.abacus[age]),
        card('letters', 'g8', ICON.letters, 'Letras', 'Letters', AGE_TEXT.letters[age]),
        card('guess', 'g1', ICON.guess, 'Adivina la palabra', 'Guess the word', guessHelp),
        card('crossword', 'g6', ICON.crossword, 'Crucigrama', 'Crossword', `${AGE_TEXT.crossword[age]} Con dibujos, en ${inLang}.`),
        card('maze', 'g5', ICON.maze, 'Laberinto', 'Maze', AGE_TEXT.maze[age]),
        card('sudoku', 'g7', ICON.sudoku, 'Sudoku', 'Sudoku', AGE_TEXT.sudoku[age]),
        card('gato', 'g2', ICON.gato, 'Gato', 'Tic-tac-toe', `Dos jugadores en este dispositivo, o contra Robi, un robot que juega solo (nivel ${LEVEL_LABEL[levelFor(age)]}).`),
      ),
    ),
  );
  return { el };
}
