import { pop } from '../../core/audio';
import { recordStep } from '../../core/progress';
import { settings } from '../../core/settings';
import {
  dayNumber, dueCount, factKey, factsOf, grade, learnedIn, LEARNED_BOX, loadTables, pickRound, saveTables, TABLES_FOR, tableOptions, type Fact,
} from '../../core/tables';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { progressDots, shake } from './gamekit';

/**
 * Tablas de multiplicar with spaced review. 5–6: tables of 2, 5 and 10, with dots and choices;
 * 7–9: all tables, answered on a number pad (remembering the answer, not recognising it).
 */
export function tablesScreen(ctx: Ctx): Screen {
  const age = settings.age;
  const tables = TABLES_FOR[age];
  const pad = age === '7-9';
  const state = loadTables();
  let round: Fact[] = [];
  let idx = 0;
  let score = 0;
  let misses = 0;
  let typed = '';
  let timer = 0;
  let current: number | null = null;
  const wrap = h('div', { class: 'tabg' });
  const el = h('div', { class: 'view' }, wrap);
  const today = () => dayNumber();
  const f = () => round[idx];

  function stars(t: number): HTMLElement {
    const n = learnedIn(state, t);
    return h('span', { class: 'tab-bar', 'aria-label': `${n} de 10 aprendidas` }, h('i', { style: `width:${n * 10}%` }));
  }

  function menu(): void {
    clearTimeout(timer);
    if (!tables.length) {
      wrap.replaceChildren(h('div', { class: 'ghead' }, h('h2', null, 'Tablas', h('small', null, 'Times tables'))),
        h('div', { class: 'kcard gend' }, h('p', null, 'Las tablas son a partir de 5 años. Mientras, cuenta estrellas en Cuentas.'), h('button', { class: 'bigbtn', onClick: () => ctx.show('math') }, 'Ir a Cuentas')));
      return;
    }
    const due = dueCount(state, tables, today());
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, 'Tablas', h('small', null, 'Times tables · Un poco cada día'))),
      h('button', { class: 'tab-daily', onClick: () => start(null) },
        h('b', null, 'Repaso de hoy'),
        h('small', null, due ? `${due} por repasar · Las que fallas vuelven pronto` : 'Mezcla de tablas · Las que fallas vuelven pronto')),
      h('div', { class: 'tab-grid' }, ...[...tables].sort((x, y) => x - y).map((t) =>
        h('button', { class: 'tab-btn', onClick: () => (ctx.sayPair(`La tabla del ${t}`, `The ${t} times table`), study(t)) },
          h('span', { class: 'tab-n' }, `× ${t}`), h('small', null, `Tabla del ${t}`), stars(t)))),
      h('p', { class: 'muted' }, 'La barra se llena con las multiplicaciones que ya recuerda bien.'),
    );
    ctx.sayPair('¿Qué tabla quieres practicar?', 'Which times table?');
  }

  /** The whole table, coloured by how well each fact is known, before practising it. */
  function study(t: number): void {
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, `Tabla del ${t}`, h('small', null, `${t} times table`)), h('button', { class: 'bigbtn alt small', onClick: menu }, 'Tablas')),
      h('div', { class: 'tab-sheet kcard' }, ...factsOf(t).map((x) => {
        const box = state[factKey(x)]?.box ?? -1;
        return h('button', { class: `tab-fact${box >= LEARNED_BOX ? ' good' : box >= 0 ? ' some' : ''}`, onClick: () => ctx.sayPair(`${x.a} por ${x.b}, ${x.a * x.b}`, `${x.a} times ${x.b}, ${x.a * x.b}`) },
          `${x.a} × ${x.b} = ${x.a * x.b}`);
      })),
      h('div', { class: 'kbtnrow' }, h('button', { class: 'bigbtn', onClick: () => start(t) }, 'Practicar →')),
      h('p', { class: 'muted' }, 'Toca una para oírla. Verde: ya la recuerda; amarillo: la está aprendiendo.'),
    );
  }

  function start(t: number | null): void {
    current = t;
    round = pickRound(state, tables, t, today());
    idx = 0;
    score = 0;
    next();
  }

  function visual(x: Fact): HTMLElement | null {
    if (pad || x.a * x.b > 50) return null;
    return h('div', { class: 'mvis grid', style: `grid-template-columns: repeat(${x.a}, auto)` }, ...Array.from({ length: x.a * x.b }, () => h('span', { class: 'mdot b' })));
  }

  function next(): void {
    misses = 0;
    typed = '';
    const x = f();
    const shown = h('span', { class: 'tab-typed' }, '?');
    const q = h('div', { class: 'mq kcard' }, h('div', { class: 'mtext' }, `${x.a} × ${x.b} = `, shown), visual(x));
    const answers = pad
      ? h('div', { class: 'tab-pad' }, ...['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].map((k) =>
        h('button', { class: `tab-key${k === '✓' ? ' go' : k === '⌫' ? ' del' : ''}`, onClick: () => key(k, shown) }, k)))
      : h('div', { class: 'mopts' }, ...tableOptions(x, 4).map((n) => {
        const b: HTMLButtonElement = h('button', { class: 'mopt', onClick: () => check(n, b) }, String(n));
        return b;
      }));
    wrap.replaceChildren(
      h('div', { class: 'ghead' },
        h('h2', null, current ? `Tabla del ${current}` : 'Repaso de hoy'),
        progressDots(round.length, idx),
        h('button', { class: 'bigbtn alt small', onClick: menu }, 'Tablas')),
      q, answers);
    ctx.sayPair(`${x.a} por ${x.b}`, `${x.a} times ${x.b}`);
  }

  function key(k: string, shown: HTMLElement): void {
    if (wrap.classList.contains('right')) return;
    if (k === '⌫') typed = typed.slice(0, -1);
    else if (k === '✓') {
      if (typed) check(Number(typed), shown);
      return;
    } else if (typed.length < 3) typed += k;
    shown.textContent = typed || '?';
  }

  function check(n: number, b: HTMLElement): void {
    if (wrap.classList.contains('right')) return;
    const x = f();
    const ans = x.a * x.b;
    if (n !== ans) {
      misses++;
      shake(b);
      pop(220, 0.12);
      if (b instanceof HTMLButtonElement) b.disabled = true;
      if (misses < 2) {
        ctx.sayPair('Casi. Intenta otra vez.', 'Almost. Try again.');
        if (pad) (typed = ''), (b.textContent = '?');
        return;
      }
      // second miss: show it, so the right fact is what stays in memory
      done(false, `${x.a} × ${x.b} = ${ans}`);
      return;
    }
    if (!pad) b.classList.add('ok');
    done(misses === 0, null);
  }

  function done(right: boolean, reveal: string | null): void {
    const x = f();
    grade(state, x, right, today());
    saveTables(state);
    recordStep('mul', right);
    if (right) score++;
    const t = wrap.querySelector('.mtext');
    if (t) t.textContent = `${x.a} × ${x.b} = ${x.a * x.b}`;
    wrap.classList.add(right ? 'right' : 'showans');
    if (right) pop(880, 0.3);
    if (reveal) ctx.sayPair(`${x.a} por ${x.b} es ${x.a * x.b}. La repasaremos pronto.`, `${x.a} times ${x.b} is ${x.a * x.b}.`);
    else ctx.sayPair(`¡Sí! ${x.a * x.b}`, `Yes! ${x.a * x.b}`);
    timer = window.setTimeout(() => {
      wrap.classList.remove('right', 'showans');
      idx++;
      if (idx < round.length) next();
      else finish();
    }, reveal ? 2800 : 1300);
  }

  function finish(): void {
    const n = round.length;
    const msg = score === n ? '¡Perfecto!' : score >= n * 0.7 ? '¡Muy bien!' : '¡Sigue practicando!';
    wrap.replaceChildren(
      h('div', { class: 'gend kcard' },
        h('h2', null, msg, h('small', null, `${score} de ${n} al primer intento`)),
        h('p', null, score === n ? 'Estas volverán en unos días para no olvidarlas.' : 'Las que fallaste volverán en el próximo repaso.'),
        h('div', { class: 'kbtnrow' },
          h('button', { class: 'bigbtn', onClick: () => start(current) }, 'Otra ronda'),
          h('button', { class: 'bigbtn alt', onClick: menu }, 'Tablas'))),
    );
    ctx.sayPair(`${msg} ${score} de ${n}.`, `${score} out of ${n}.`);
  }

  menu();
  return { el, back: () => (tables.length > 0 && !wrap.querySelector('.tab-grid') ? (menu(), true) : false), destroy: () => clearTimeout(timer), onHelp: () => round.length && idx < round.length && wrap.querySelector('.mq') && ctx.sayPair(`${f().a} por ${f().b}`, `${f().a} times ${f().b}`) };
}
