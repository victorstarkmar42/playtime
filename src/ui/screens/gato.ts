import { pop } from '../../core/audio';
import { settings } from '../../core/settings';
import { aiMove, emptyBoard, isFull, levelFor, other, winner, type Cell, type Player } from '../../core/tictactoe';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { exitBtn } from './gamekit';

export const STAR_SVG = '<svg viewBox="0 0 100 100"><path d="M50 8l12 29 32 3-24 21 8 31-28-17-28 17 8-31-24-21 32-3z" fill="#FFD54A" stroke="#22304F" stroke-width="5" stroke-linejoin="round"/></svg>';
export const HEART_SVG = '<svg viewBox="0 0 100 100"><path d="M50 88C20 66 8 50 8 33a21 21 0 0142-9 21 21 0 0142 9c0 17-12 33-42 55z" fill="#FF6FA5" stroke="#22304F" stroke-width="5" stroke-linejoin="round"/></svg>';
export const ROBOT_SVG = '<svg viewBox="0 0 100 100"><path d="M50 10v12" stroke="#22304F" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="10" r="6" fill="#FF6FA5" stroke="#22304F" stroke-width="4"/><rect x="16" y="24" width="68" height="56" rx="16" fill="#B9A8FF" stroke="#22304F" stroke-width="5"/><circle cx="37" cy="48" r="7" fill="#22304F"/><circle cx="63" cy="48" r="7" fill="#22304F"/><path d="M38 66q12 8 24 0" fill="none" stroke="#22304F" stroke-width="5" stroke-linecap="round"/></svg>';
const PIECE: Record<Player, string> = { 1: STAR_SVG, 2: HEART_SVG };
const NAME: Record<Player, { es: string; en: string }> = { 1: { es: 'Estrella', en: 'Star' }, 2: { es: 'Corazón', en: 'Heart' } };
export const LEVEL_LABEL = { easy: 'fácil', medium: 'normal', hard: 'difícil' } as const;

/**
 * Gato (tic-tac-toe). Two players take turns on the same device, or one child plays the computer,
 * whose strength follows the age setting. Who starts alternates every game.
 */
export function gatoScreen(ctx: Ctx): Screen {
  const level = levelFor(settings.age);
  let mode: 'two' | 'cpu' = 'two';
  let board: Cell[] = emptyBoard();
  let turn: Player = 1;
  let starter: Player = 1;
  let over = false;
  let busy = false;
  let timer = 0;
  const score = { 1: 0, 2: 0, tie: 0 };

  const wrap = h('div', { class: 'gato' });
  const el = h('div', { class: 'view' }, wrap);
  const nameOf = (p: Player) => (mode === 'cpu' ? (p === 1 ? { es: 'Tú', en: 'You' } : { es: 'La compu', en: 'Computer' }) : NAME[p]);

  function chooseMode(): void {
    clearTimeout(timer);
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, 'Gato', h('small', null, 'Tic-tac-toe · Pon tres iguales en línea: derecho, de lado o en diagonal')), exitBtn(ctx)),
      h('div', { class: 'gmodes' },
        h('button', { class: 'gmode', onClick: () => start('two') },
          h('span', { class: 'gpair' }, h('i', { html: STAR_SVG }), h('i', { html: HEART_SVG })),
          h('b', null, 'Dos jugadores'), h('small', null, 'Two players · Se turnan en este mismo dispositivo')),
        h('button', { class: 'gmode', onClick: () => start('cpu') },
          h('span', { class: 'gpair' }, h('i', { html: STAR_SVG }), h('i', { html: ROBOT_SVG })),
          h('b', null, 'Contra la compu'), h('small', null, `Against the computer · Nivel ${LEVEL_LABEL[level]} (según la edad)`)),
      ),
    );
    ctx.sayPair('¿Con quién quieres jugar?', 'Who do you want to play with?');
  }

  function start(m: 'two' | 'cpu'): void {
    mode = m;
    score[1] = score[2] = score.tie = 0;
    starter = 1;
    newRound();
  }

  function newRound(): void {
    board = emptyBoard();
    over = false;
    turn = starter;
    render();
    const n = nameOf(turn);
    if (mode === 'cpu') ctx.sayPair(turn === 1 ? 'Empiezas tú' : 'Empieza la compu', turn === 1 ? 'You go first' : 'The computer goes first');
    else ctx.sayPair(`Empieza ${n.es}`, `${n.en} goes first`);
    cpuTurn();
  }

  function cpuTurn(): void {
    if (mode !== 'cpu' || turn !== 2 || over) return;
    busy = true;
    timer = window.setTimeout(() => {
      busy = false;
      place(aiMove(board, 2, level));
    }, 650);
  }

  function place(i: number): void {
    board[i] = turn;
    pop(turn === 1 ? 660 : 520);
    const w = winner(board);
    if (w) {
      over = true;
      score[w.who]++;
      pop(880, 0.35);
      if (mode === 'cpu') ctx.sayPair(w.who === 1 ? '¡Ganaste!' : '¡Ganó la compu! Juega otra vez.', w.who === 1 ? 'You win!' : 'The computer wins! Play again.');
      else ctx.sayPair(`¡Ganó ${NAME[w.who].es}!`, `${NAME[w.who].en} wins!`);
    } else if (isFull(board)) {
      over = true;
      score.tie++;
      ctx.sayPair('¡Empate! Nadie gana.', "It's a tie!");
    } else turn = other(turn);
    if (over) starter = other(starter);
    render(w?.line);
    cpuTurn();
  }

  function render(line?: readonly number[]): void {
    const chip = (p: Player) =>
      h('div', { class: `gchip${!over && turn === p ? ' on' : ''}` }, h('i', { html: PIECE[p] }), h('span', null, nameOf(p).es), h('b', null, String(score[p])));
    const status = over
      ? line
        ? `¡Ganó ${nameOf(board[line[0]] as Player).es}!`
        : '¡Empate! · Tie'
      : mode === 'cpu' && turn === 2
        ? 'La compu está pensando…'
        : `Turno de ${nameOf(turn).es} · ${nameOf(turn).en}`;
    const cells = board.map((c, i) =>
      h('button', {
        class: `gcell${line?.includes(i) ? ' win' : ''}`,
        'aria-label': c ? NAME[c as Player].es : `Casilla ${i + 1}`,
        disabled: over || c !== 0,
        html: c ? PIECE[c as Player] : '',
        onClick: () => {
          if (over || busy || board[i] || (mode === 'cpu' && turn === 2)) return;
          place(i);
        },
      }),
    );
    wrap.replaceChildren(
      h('div', { class: 'gtop' }, chip(1), h('div', { class: 'gchip tie' }, h('span', null, 'Empates'), h('b', null, String(score.tie))), chip(2)),
      h('p', { class: 'gstatus', role: 'status' }, status),
      h('div', { class: 'gboard' }, ...cells),
      h('div', { class: 'kbtnrow gbtns' },
        over ? h('button', { class: 'bigbtn', onClick: newRound }, 'Otra vez · Again') : null,
        h('button', { class: 'bigbtn alt small', onClick: chooseMode }, 'Cambiar jugadores'),
        exitBtn(ctx),
      ),
    );
  }

  chooseMode();
  return { el, destroy: () => clearTimeout(timer), onHelp: () => ctx.sayPair('Toca una casilla. Gana quien pone tres iguales en línea.', 'Touch a square. Three in a row wins.') };
}
