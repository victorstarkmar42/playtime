import { abacusFor, abacusTarget, abacusValue, touchBead } from '../../core/arith';
import { pop } from '../../core/audio';
import { recordStep } from '../../core/progress';
import { settings } from '../../core/settings';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { progressDots, shake } from './gamekit';

const ROUNDS = 5;
const ROW_COLORS = ['#F2672E', '#3FA35B', '#7B61D9'];
const PLACE = [
  { es: 'centenas', en: 'hundreds' },
  { es: 'decenas', en: 'tens' },
  { es: 'unidades', en: 'ones' },
];

/**
 * Ábaco: "pon el número". Touch a bead to slide it (and the ones before it) to the left.
 * 3–4 counts aloud on every touch and checks by itself; older children press "Listo".
 */
export function abacusScreen(ctx: Ctx): Screen {
  const spec = abacusFor(settings.age);
  const little = settings.age === '3-4';
  let rows: number[] = [];
  let target = 0;
  let idx = 0;
  let score = 0;
  let firstTry = true;
  let timer = 0;
  let free = false;
  const wrap = h('div', { class: 'abacusg' });
  const el = h('div', { class: 'view' }, wrap);

  const say = (n: number) => ctx.sayPair(String(n), String(n));

  function begin(freePlay = false): void {
    free = freePlay;
    idx = 0;
    score = 0;
    next();
  }

  function next(): void {
    rows = Array(spec.rows).fill(0);
    firstTry = true;
    target = abacusTarget(spec);
    render();
    if (free) ctx.sayPair('Mueve las cuentas y cuenta conmigo', 'Move the beads and count with me');
    else ctx.sayPair(`Pon el ${target} en el ábaco`, `Show ${target} on the abacus`);
  }

  function render(): void {
    const value = abacusValue(rows, spec);
    const rowEls = rows.map((v, r) => {
      const beads = Array.from({ length: spec.beads }, (_, i) =>
        h('button', {
          class: `bead${i < v ? ' on' : ''}`,
          style: `--c:${ROW_COLORS[spec.placeValue ? r : r % 3]}`,
          'aria-label': `Cuenta ${i + 1}`,
          onClick: () => touch(r, i),
        }));
      return h('div', { class: 'arow' },
        spec.placeValue ? h('span', { class: 'aplace' }, PLACE[r].es, h('small', null, `${v}`)) : null,
        h('div', { class: 'awire' }, ...beads));
    });
    const showValue = free || little || spec.placeValue;
    wrap.replaceChildren(
      h('div', { class: 'ghead' },
        h('h2', null, free ? 'Ábaco libre' : `Pon el ${target}`, h('small', null, free ? 'Free play · Toca las cuentas' : `Show ${target} on the abacus`)),
        free ? null : progressDots(ROUNDS, idx)),
      h('div', { class: 'aframe' }, ...rowEls),
      h('div', { class: 'abottom' },
        showValue ? h('div', { class: 'avalue' }, String(value)) : null,
        spec.placeValue ? h('p', { class: 'muted' }, `${rows[0]} centenas + ${rows[1]} decenas + ${rows[2]} unidades`) : null,
        h('div', { class: 'kbtnrow' },
          !free && !little ? h('button', { class: 'bigbtn', onClick: (e: Event) => check(e.currentTarget as HTMLElement) }, 'Listo · Done') : null,
          h('button', { class: 'bigbtn alt small', onClick: () => ((rows = rows.map(() => 0)), render()) }, 'Borrar'),
          h('button', { class: 'bigbtn alt small', onClick: () => begin(!free) }, free ? 'Jugar a poner números' : 'Ábaco libre'))),
    );
  }

  function touch(r: number, i: number): void {
    if (wrap.classList.contains('right')) return;
    rows[r] = touchBead(rows[r], i);
    pop(380 + rows[r] * 30, 0.08);
    render();
    const value = abacusValue(rows, spec);
    if (little || free) say(value);
    if (!free && little && value === target) done();
  }

  function check(btn: HTMLElement): void {
    if (abacusValue(rows, spec) === target) return done();
    firstTry = false;
    shake(btn);
    pop(220, 0.12);
    const v = abacusValue(rows, spec);
    ctx.sayPair(v < target ? `Tienes ${v}. Te faltan cuentas.` : `Tienes ${v}. Te sobran cuentas.`, v < target ? `That is ${v}. Add more.` : `That is ${v}. Too many.`);
  }

  function done(): void {
    recordStep('count', firstTry);
    if (firstTry) score++;
    wrap.classList.add('right');
    pop(880, 0.3);
    ctx.sayPair(`¡Muy bien! ${target}`, `Great! ${target}`);
    timer = window.setTimeout(() => {
      wrap.classList.remove('right');
      idx++;
      if (idx < ROUNDS) next();
      else finish();
    }, 1600);
  }

  function finish(): void {
    wrap.replaceChildren(
      h('div', { class: 'gend kcard' },
        h('h2', null, score >= 3 ? '¡Muy bien!' : '¡Buen intento!', h('small', null, `${score} de ${ROUNDS} al primer intento`)),
        progressDots(ROUNDS, score, false),
        h('div', { class: 'kbtnrow' },
          h('button', { class: 'bigbtn', onClick: () => begin() }, 'Otra vez · Again'),
          h('button', { class: 'bigbtn alt', onClick: () => begin(true) }, 'Ábaco libre'))),
    );
  }

  begin();
  return { el, destroy: () => clearTimeout(timer), onHelp: () => ctx.sayPair('Toca una cuenta para moverla.', 'Touch a bead to move it.') };
}
