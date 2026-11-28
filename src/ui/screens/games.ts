import { kindFor, spellLang } from '../../core/guess';
import { settings } from '../../core/settings';
import { DATA_KEYS, readJSON, writeJSON } from '../../core/storage';
import { levelFor } from '../../core/tictactoe';
import type { Ctx, Screen, ScreenName } from '../context';
import { h } from '../dom';
import { HEART_SVG, LEVEL_LABEL, STAR_SVG } from './gato';

const inner = (svg: string) => svg.replace(/<\/?svg[^>]*>/g, '');
const T = (x: number, y: number, t: string, color: string) =>
  `<text x="${x}" y="${y}" font-size="16" font-weight="800" text-anchor="middle" fill="${color}" font-family="sans-serif">${t}</text>`;
const ICON = {
  stories: '<svg viewBox="0 0 100 100"><path d="M50 24C38 16 22 16 10 20v60c12-4 28-4 40 4 12-8 28-8 40-4V20c-12-4-28-4-40 4z" fill="#fff" stroke="#22304F" stroke-width="5" stroke-linejoin="round"/><path d="M50 24v60" stroke="#22304F" stroke-width="4"/><path d="M20 34h20M20 46h22M20 58h18M60 34h20M58 46h22M60 58h16" stroke="#7B61D9" stroke-width="4" stroke-linecap="round"/></svg>',
  syllables: `<svg viewBox="0 0 100 100"><rect x="6" y="30" width="40" height="40" rx="10" fill="#FFD54A" stroke="#22304F" stroke-width="5"/><rect x="54" y="30" width="40" height="40" rx="10" fill="#8FD3F5" stroke="#22304F" stroke-width="5"/>${T(26, 57, 'ca', '#22304F').replace('font-size="16"', 'font-size="22"')}${T(74, 57, 'sa', '#22304F').replace('font-size="16"', 'font-size="22"')}</svg>`,
  tables: `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="16" fill="#fff" stroke="#22304F" stroke-width="5"/><g fill="#3FA35B"><circle cx="30" cy="30" r="6"/><circle cx="50" cy="30" r="6"/><circle cx="70" cy="30" r="6"/><circle cx="30" cy="50" r="6"/><circle cx="50" cy="50" r="6"/><circle cx="70" cy="50" r="6"/></g>${T(50, 82, '2 × 3', '#F2672E').replace('font-size="16"', 'font-size="20"')}</svg>`,
  problems: `<svg viewBox="0 0 100 100"><rect x="8" y="12" width="84" height="60" rx="14" fill="#fff" stroke="#22304F" stroke-width="5"/><path d="M30 72l-6 16 20-16" fill="#fff" stroke="#22304F" stroke-width="5" stroke-linejoin="round"/><circle cx="30" cy="40" r="9" fill="#F2672E"/><circle cx="52" cy="40" r="9" fill="#F2672E"/><circle cx="74" cy="40" r="9" fill="#F2672E" opacity=".35"/><path d="M30 31q2-6 6-6" stroke="#3FA35B" stroke-width="3" fill="none"/></svg>`,
  build: '<svg viewBox="0 0 100 100"><path d="M14 50L42 22L70 50Z" fill="#FFAB91" stroke="#22304F" stroke-width="4" stroke-linejoin="round"/><rect x="18" y="50" width="48" height="38" fill="#FFE082" stroke="#22304F" stroke-width="4"/><rect x="36" y="64" width="12" height="24" fill="#CE93D8" stroke="#22304F" stroke-width="3.5"/><circle cx="78" cy="30" r="14" fill="#81D4FA" stroke="#22304F" stroke-width="4"/><rect x="70" y="60" width="20" height="20" fill="#A5D6A7" stroke="#22304F" stroke-width="4"/></svg>',
  globe: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#3B8FD9" stroke="#22304F" stroke-width="4"/><path d="M24 30c8-6 18-4 20 4s-6 10-4 18-8 12-14 6-10-22-2-28zM56 22c10 0 20 6 22 14-6 2-10-2-16 2s-2 12-8 14-10-8-8-16 2-14 10-14zM60 62c6-2 14 0 14 6s-6 12-12 10-8-14-2-16z" fill="#5DBB63" stroke="#22304F" stroke-width="3" stroke-linejoin="round"/><ellipse cx="38" cy="30" rx="12" ry="6" fill="#fff" opacity=".25"/></svg>',
  basta: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#F2672E" stroke="#22304F" stroke-width="4"/><circle cx="50" cy="50" r="26" fill="#8FD3F5"/><g fill="#fff" stroke="#22304F" stroke-width="3"><rect x="42" y="2" width="16" height="16" rx="4"/><rect x="82" y="42" width="16" height="16" rx="4"/><rect x="42" y="82" width="16" height="16" rx="4"/><rect x="2" y="42" width="16" height="16" rx="4"/></g><circle cx="50" cy="50" r="15" fill="#FFD54A" stroke="#22304F" stroke-width="4"/><path d="M50 42v9l6 4" fill="none" stroke="#22304F" stroke-width="4" stroke-linecap="round"/></svg>',
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
  stories: { '3-4': 'Escucha un cuento corto y contesta tocando los dibujos.', '5-6': 'Lee (o escucha) un cuento y contesta quién, qué pasó y por qué.', '7-9': 'Cuentos más largos con preguntas para pensar: por qué pasó y qué enseña.' },
  syllables: { '3-4': 'Oye la palabra y di cuántos aplausos tiene: ma-ri-po-sa.', '5-6': 'Arma la palabra tocando sus sílabas en orden: ca-sa. En Familias: ta te ti to tu, las difíciles y contra Robi.', '7-9': 'Palabras largas y sílabas de más que no van. En Familias: las letras que se confunden (b/d, r/rr, b/v…), solo o contra Robi.' },
  tables: { '3-4': '', '5-6': 'Tablas del 2, del 5 y del 10, con puntitos.', '7-9': 'Todas las tablas con repaso: las que fallas vuelven pronto.' },
  problems: { '3-4': 'Problemas cortos con dibujos y voz: juntar y quitar hasta 5.', '5-6': 'Juntar, quitar y comparar hasta 10, con dibujos.', '7-9': 'Primero elige la operación y luego el resultado: hasta 100, grupos y repartos.' },
  basta: { '3-4': 'Rueda de letras con dibujos de ayuda: di una palabra y toca su letra (20 segundos).', '5-6': 'Di una palabra de la tarjeta y toca su primera letra antes de 15 segundos.', '7-9': 'Rueda de 22 letras y 10 segundos por turno. Contra Robi o entre dos.' },
  build: { '3-4': 'Pon cada figura en su lugar para armar una casa, un cohete o un robot, y coloréalo.', '5-6': 'Arma figuras con cuadrados, triángulos y círculos; oye su nombre en español e inglés.', '7-9': 'Arma figuras con más piezas sólo viendo su sombra, y cuenta qué figuras usaste.' },
  trace: { '3-4': 'Sigue la línea con el dedo: figuras, números y dibujos que se encienden.', '5-6': 'Traza figuras, números y dibujos; la línea se llena de estrellas de luz.', '7-9': 'Traza números, figuras y el contorno de cada dibujo con más precisión.' },
  paintnum: { '3-4': 'Cada figura (corazón, círculo, rombo…) tiene su color: pinta las partes iguales.', '5-6': 'Pinta cada parte con el color de su número (hasta 6 colores).', '7-9': 'Pinta por números con hasta 8 colores, en zonas o en cuadritos.' },
  letters: { '3-4': 'Oye la palabra y toca la letra con la que empieza.', '5-6': 'Completa la palabra con la letra que falta.', '7-9': 'Letras que se parecen (b, d, p…) y busca todas las letras.' },
  guess: { 'pick-image': 'Escucha la palabra y toca su dibujo.', 'pick-word': 'Mira el dibujo y toca su palabra.' },
  math: { '3-4': 'Cuenta estrellas.', '5-6': 'Contar, sumas y restas hasta 10, con dibujos, y ¿qué número falta? (4 + ? = 5).', '7-9': 'Sumas y restas hasta 100, multiplicaciones, divisiones y ¿qué número falta?' },
  abacus: { '3-4': 'Una fila de 10 cuentas: cuenta en voz alta.', '5-6': 'Dos filas: números hasta el 20.', '7-9': 'Centenas, decenas y unidades: hasta 999.' },
  maze: { '3-4': 'Laberintos pequeños (de 4 × 3 a 6 × 5 según el nivel).', '5-6': 'Laberintos medianos (de 6 × 4 a 10 × 7 según el nivel).', '7-9': 'Laberintos grandes (de 9 × 7 a 15 × 11 según el nivel).' },
  sudoku: { '3-4': '4 × 4 con dibujos, pocos espacios.', '5-6': '4 × 4 con números.', '7-9': '6 × 6 con números.' },
  crossword: { '3-4': '2 palabras cortas con casi todas las letras.', '5-6': '3 palabras con algunas letras.', '7-9': '5 palabras desde cero.' },
} as const;

/** Kinds of games: each has a fixed colour, so children find "the green ones" (numbers) without reading. */
export type GameCat = 'read' | 'num' | 'art' | 'think';
export const GAME_CATS: { id: GameCat; es: string; en: string; say: string }[] = [
  { id: 'read', es: 'Leer y escribir', en: 'Reading', say: 'morados, para leer y escribir' },
  { id: 'num', es: 'Números', en: 'Numbers', say: 'verdes, para los números' },
  { id: 'art', es: 'Arte y trazos', en: 'Art', say: 'naranjas, para dibujar y pintar' },
  { id: 'think', es: 'Pensar y explorar', en: 'Thinking', say: 'azules, para pensar y explorar' },
];

export interface GameInfo {
  to: ScreenName;
  cat: GameCat;
  es: string;
  en: string;
  icon: string;
  /** What it is for the current age (shown to parents). */
  help: () => string;
}

const inLang = () => (spellLang(settings.lang) === 'en' ? 'inglés' : 'español');
const byAge = (t: Record<'3-4' | '5-6' | '7-9', string>) => () => t[settings.age];

export const GAMES: GameInfo[] = [
  { to: 'stories', cat: 'read', es: 'Cuentos', en: 'Stories', icon: ICON.stories, help: byAge(AGE_TEXT.stories) },
  { to: 'syllables', cat: 'read', es: 'Sílabas', en: 'Syllables', icon: ICON.syllables, help: byAge(AGE_TEXT.syllables) },
  { to: 'letters', cat: 'read', es: 'Letras', en: 'Letters', icon: ICON.letters, help: byAge(AGE_TEXT.letters) },
  {
    to: 'guess', cat: 'read', es: 'Adivina la palabra', en: 'Guess the word', icon: ICON.guess,
    help: () => { const k = kindFor(settings.age); return k === 'spell' ? `Mira el dibujo y escribe su nombre en ${inLang()}.` : AGE_TEXT.guess[k]; },
  },
  { to: 'crossword', cat: 'read', es: 'Crucigrama', en: 'Crossword', icon: ICON.crossword, help: () => `${AGE_TEXT.crossword[settings.age]} Con dibujos, en ${inLang()}.` },
  { to: 'basta', cat: 'read', es: 'Basta', en: 'Letter wheel', icon: ICON.basta, help: byAge(AGE_TEXT.basta) },
  { to: 'math', cat: 'num', es: 'Cuentas', en: 'Math', icon: ICON.math, help: byAge(AGE_TEXT.math) },
  { to: 'tables', cat: 'num', es: 'Tablas', en: 'Times tables', icon: ICON.tables, help: byAge(AGE_TEXT.tables) },
  { to: 'problems', cat: 'num', es: 'Problemas', en: 'Word problems', icon: ICON.problems, help: byAge(AGE_TEXT.problems) },
  { to: 'abacus', cat: 'num', es: 'Ábaco', en: 'Abacus', icon: ICON.abacus, help: byAge(AGE_TEXT.abacus) },
  { to: 'trace', cat: 'art', es: 'Trazos de luz', en: 'Light trails', icon: ICON.trace, help: byAge(AGE_TEXT.trace) },
  { to: 'reveal', cat: 'art', es: 'Destapa el dibujo', en: 'Unwrap it', icon: ICON.reveal, help: () => 'Rompe el papel de regalo para descubrir un dibujo y luego coloréalo.' },
  { to: 'paintnum', cat: 'art', es: 'Pinta por números', en: 'Paint by numbers', icon: ICON.paintnum, help: byAge(AGE_TEXT.paintnum) },
  { to: 'build', cat: 'art', es: 'Construye con figuras', en: 'Build with shapes', icon: ICON.build, help: byAge(AGE_TEXT.build) },
  { to: 'maze', cat: 'think', es: 'Laberinto', en: 'Maze', icon: ICON.maze, help: byAge(AGE_TEXT.maze) },
  { to: 'sudoku', cat: 'think', es: 'Sudoku', en: 'Sudoku', icon: ICON.sudoku, help: byAge(AGE_TEXT.sudoku) },
  { to: 'gato', cat: 'think', es: 'Gato', en: 'Tic-tac-toe', icon: ICON.gato, help: () => `Dos jugadores en este dispositivo, o contra Robi, un robot que juega solo (nivel ${LEVEL_LABEL[levelFor(settings.age)]}).` },
  { to: 'globe', cat: 'think', es: 'Países del mundo', en: 'Countries', icon: ICON.globe, help: () => 'Gira el globo terráqueo, toca un continente y conoce su forma, su nombre y sus países.' },
];

/** The games offered at the current age (times tables start at 5). */
export const gamesForAge = (): GameInfo[] => GAMES.filter((g) => !(g.to === 'tables' && settings.age === '3-4'));

/** The last game opened from the menu, for "Seguir jugando" on Inicio. */
export function lastGame(): GameInfo | null {
  const to = readJSON<unknown>(DATA_KEYS.lastGame, null);
  return gamesForAge().find((g) => g.to === to) ?? null;
}
export const openGame = (ctx: Ctx, g: GameInfo): void => {
  writeJSON(DATA_KEYS.lastGame, g.to);
  ctx.sayPair(g.es, g.en);
  ctx.show(g.to);
};

/** Games menu: one-line cards grouped by kind, each kind with its colour. What each game is lives in Padres. */
export function gamesScreen(ctx: Ctx): Screen {
  const age = settings.age;
  const list = gamesForAge();
  const card = (g: GameInfo) =>
    h('button', { class: `gcard cat-${g.cat}`, onClick: () => openGame(ctx, g) },
      h('span', { class: 'gcard-ico', html: g.icon }), h('span', null, g.es));
  const el = h('div', { class: 'view' },
    h('div', { class: 'games' },
      h('div', { class: 'ghead' }, h('h2', null, 'Juegos', h('small', null, `Games · ${age.replace('-', '–')} años`))),
      ...GAME_CATS.flatMap((c) => [
        h('h3', { class: `gsec cat-${c.id}` }, h('i', { 'aria-hidden': 'true' }), c.es, h('small', null, c.en)),
        h('div', { class: 'gcards' }, ...list.filter((g) => g.cat === c.id).map(card)),
      ]),
    ),
  );
  return {
    el,
    onHelp: () => ctx.sayPair(
      `Toca un juego. Los juegos ${GAME_CATS.map((c) => c.say).join('; los ')}.`,
      'Touch a game. Purple for reading, green for numbers, orange for art, blue for thinking.',
    ),
  };
}
