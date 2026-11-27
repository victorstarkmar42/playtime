import { KINDS_FOR, mathQuestion, missingWords, questionText, type MathKind, type MathQuestion } from '../../core/arith';
import { pop } from '../../core/audio';
import { evaluate, opWords, skillOf } from '../../core/math';
import { recordStep } from '../../core/progress';
import { settings } from '../../core/settings';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { levelPicker, levelUpButton, progressDots, shake } from './gamekit';

const ROUNDS = 5;
const KIND_LABEL: Record<MathKind, { es: string; en: string; sym: string }> = {
  count: { es: 'Contar', en: 'Count', sym: '★' },
  sum: { es: 'Sumas', en: 'Addition', sym: '+' },
  sub: { es: 'Restas', en: 'Subtraction', sym: '−' },
  missing: { es: '¿Qué número falta?', en: 'Missing number', sym: '□' },
  mul: { es: 'Multiplicaciones', en: 'Multiplication', sym: '×' },
  div: { es: 'Divisiones', en: 'Division', sym: '÷' },
  mix: { es: 'De todo', en: 'Mixed', sym: '?' },
};

/** Cuentas: the child picks the kind of operation allowed for their age, then answers 5 questions. */
export function mathScreen(ctx: Ctx): Screen {
  const kinds = KINDS_FOR[settings.age];
  let kind: MathKind = kinds[0];
  let q: MathQuestion;
  let idx = 0;
  let score = 0;
  let firstTry = true;
  let timer = 0;
  const wrap = h('div', { class: 'mathg' });
  const el = h('div', { class: 'view' }, wrap);

  const seen = new Set<string>();

  function menu(): void {
    clearTimeout(timer);
    if (kinds.length === 1) return start(kinds[0]);
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, 'Cuentas', h('small', null, 'Math · ¿Qué quieres practicar?')), h('span', { class: 'lvl-label' }, 'Nivel'), levelPicker(ctx, 'math', menu)),
      h('div', { class: 'mkinds' }, ...kinds.map((k) =>
        h('button', { class: `mkind k-${k}`, onClick: () => (ctx.sayPair(KIND_LABEL[k].es, KIND_LABEL[k].en), start(k)) },
          h('span', { class: 'msym' }, KIND_LABEL[k].sym), KIND_LABEL[k].es, h('small', null, KIND_LABEL[k].en)))),
    );
  }

  function start(k: MathKind): void {
    kind = k;
    idx = 0;
    score = 0;
    seen.clear();
    next();
  }

  /** Something to count or look at: stars for counting, two coloured groups for small sums and subtractions, an array for ×. */
  function visual(): HTMLElement | null {
    const op = q.op;
    if (q.hide) return null; // the dots would give the answer away
    const dots = (n: number, cls: string) => Array.from({ length: n }, () => h('span', { class: cls }));
    if (op.kind === 'count') return h('div', { class: 'mvis stars' }, ...dots(op.n, 'mstar'));
    if (op.kind !== 'calc') return null;
    if ((op.sym === '+' || op.sym === '−') && op.a <= 10 && (op.sym === '−' || op.a + op.b <= 10))
      return op.sym === '+'
        ? h('div', { class: 'mvis' }, h('div', { class: 'mgroup' }, ...dots(op.a, 'mdot a')), h('b', null, '+'), h('div', { class: 'mgroup' }, ...dots(op.b, 'mdot b')))
        : h('div', { class: 'mvis' }, h('div', { class: 'mgroup' }, ...dots(op.a - op.b, 'mdot a'), ...dots(op.b, 'mdot a gone')));
    if (op.sym === '×' && op.a * op.b <= 40)
      return h('div', { class: 'mvis grid', style: `grid-template-columns: repeat(${op.b}, auto)` }, ...dots(op.a * op.b, 'mdot b'));
    return null;
  }

  function next(): void {
    firstTry = true;
    // no repeated question inside a round
    for (let t = 0; t < 30; t++) {
      q = mathQuestion(kind, settings.age, Math.random, settings.levels.math);
      if (!seen.has(`${questionText(q)}|${q.answer}`)) break;
    }
    seen.add(`${questionText(q)}|${q.answer}`);
    const text = q.op.kind === 'count' ? '¿Cuántas estrellas hay?' : questionText(q);
    wrap.replaceChildren(
      h('div', { class: 'ghead' },
        h('h2', null, KIND_LABEL[kind].es, h('small', null, KIND_LABEL[kind].en)),
        progressDots(ROUNDS, idx),
        kinds.length > 1 ? h('button', { class: 'bigbtn alt small', onClick: menu }, 'Cambiar') : levelPicker(ctx, 'math', () => start(kind))),
      h('div', { class: 'mq kcard' }, h('div', { class: `mtext${q.op.kind === 'count' ? ' small' : ''}` }, text), visual()),
      h('div', { class: 'mopts' }, ...q.options.map((n) => {
        const b: HTMLButtonElement = h('button', { class: 'mopt', onClick: () => answer(n, b) }, String(n));
        return b;
      })),
    );
    say();
  }

  function say(): void {
    if (q.hide) ctx.sayPair(missingWords(q, 'es'), missingWords(q, 'en'));
    else ctx.sayPair(opWords(q.op, 'es'), opWords(q.op, 'en'));
  }

  function answer(n: number, b: HTMLButtonElement): void {
    if (wrap.classList.contains('right')) return;
    if (n !== q.answer) {
      firstTry = false;
      b.disabled = true;
      shake(b);
      pop(220, 0.12);
      ctx.sayPair('Casi. Intenta otra vez.', 'Almost. Try again.');
      return;
    }
    recordStep(skillOf(q.op), firstTry);
    if (firstTry) score++;
    b.classList.add('ok');
    wrap.classList.add('right');
    pop(880, 0.3);
    if (q.hide && q.op.kind === 'calc') {
      const t = wrap.querySelector('.mtext');
      if (t) t.textContent = `${q.op.a} ${q.op.sym} ${q.op.b} = ${evaluate(q.op)}`;
    }
    ctx.sayPair(`¡Sí! ${q.answer}`, `Yes! ${q.answer}`);
    timer = window.setTimeout(() => {
      wrap.classList.remove('right');
      idx++;
      if (idx < ROUNDS) next();
      else finish();
    }, 1500);
  }

  function finish(): void {
    const msg = score === ROUNDS ? '¡Perfecto!' : score >= 3 ? '¡Muy bien!' : '¡Buen intento!';
    wrap.replaceChildren(
      h('div', { class: 'gend kcard' },
        h('h2', null, msg, h('small', null, `${score} de ${ROUNDS} al primer intento · ${score} of ${ROUNDS}`)),
        progressDots(ROUNDS, score, false),
        h('div', { class: 'kbtnrow' },
          levelUpButton(ctx, 'math', score, ROUNDS, () => start(kind)),
          h('button', { class: 'bigbtn', onClick: () => start(kind) }, 'Otra vez · Again'),
          kinds.length > 1 ? h('button', { class: 'bigbtn alt', onClick: menu }, 'Otra cuenta') : null)),
    );
    ctx.sayPair(`${msg} ${score} de ${ROUNDS}.`, `${score} out of ${ROUNDS}.`);
  }

  menu();
  return { el, back: () => (kinds.length > 1 && !wrap.querySelector('.mkinds') ? (menu(), true) : false), destroy: () => clearTimeout(timer), onHelp: () => q && say() };
}
