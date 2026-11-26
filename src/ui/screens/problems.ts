import { pop } from '../../core/audio';
import { primaryLang } from '../../core/lang';
import type { Sym } from '../../core/math';
import { choosesOperation, makeProblem, type Problem } from '../../core/problems';
import { recordStep } from '../../core/progress';
import { settings } from '../../core/settings';
import type { Ctx, Screen } from '../context';
import { h, ICONS } from '../dom';
import { exitBtn, progressDots, shake } from './gamekit';

const ROUNDS = 5;
const SYMS: Sym[] = ['+', '−', '×', '÷'];
const SYM_NAME: Record<Sym, { es: string; en: string }> = {
  '+': { es: 'suma', en: 'addition' }, '−': { es: 'resta', en: 'subtraction' }, '×': { es: 'multiplicación', en: 'multiplication' }, '÷': { es: 'división', en: 'division' },
};

/**
 * Problemas con dibujos: a short story problem read aloud, with pictures when the numbers are small.
 * 7–9 first pick the operation (for one-step problems), then the answer.
 */
export function problemsScreen(ctx: Ctx): Screen {
  const age = settings.age;
  const lang = primaryLang(settings.lang);
  let p: Problem;
  let idx = 0;
  let score = 0;
  let firstTry = true;
  let timer = 0;
  const wrap = h('div', { class: 'probg' });
  const el = h('div', { class: 'view' }, wrap);
  const read = () => ctx.sayOne(p[lang], lang);

  function begin(): void {
    idx = 0;
    score = 0;
    next();
  }

  function pics(): HTMLElement | null {
    const g = p.groups;
    if (!g.length) return null;
    const row = (n: number, gone = 0) => h('div', { class: 'pb-group' }, ...Array.from({ length: n }, (_, i) => h('span', { class: i >= n - gone ? 'gone' : '' }, p.item.pic)));
    if (p.kind === 'join') return h('div', { class: 'pb-pics' }, row(g[0]), h('b', null, '+'), row(g[1]));
    if (p.kind === 'take') return h('div', { class: 'pb-pics' }, row(g[0], age === '3-4' ? g[0] - p.answer : 0));
    if (p.kind === 'compare') return h('div', { class: 'pb-pics col' }, row(g[0]), row(g[1]));
    if (p.kind === 'groups') return h('div', { class: 'pb-pics' }, ...g.map((n) => h('div', { class: 'pb-box' }, row(n))));
    return h('div', { class: 'pb-pics' }, row(g[0]));
  }

  function next(): void {
    firstTry = true;
    p = makeProblem(age);
    wrap.replaceChildren(
      h('div', { class: 'ghead' },
        h('h2', null, 'Problemas', h('small', null, 'Word problems')),
        progressDots(ROUNDS, idx), exitBtn(ctx)),
      h('div', { class: `pb-card kcard${age === '3-4' ? ' little' : ''}` },
        h('button', { class: 'ibtn st-say', 'aria-label': 'Oír el problema', html: ICONS.speaker, onClick: read }),
        h('p', { class: 'pb-text' }, p[lang]),
        pics()),
      h('div', { class: 'pb-answers' }),
    );
    read();
    if (choosesOperation(age) && p.sym) askOperation();
    else askNumber();
  }

  function slot(): HTMLElement {
    return wrap.querySelector('.pb-answers') as HTMLElement;
  }

  function askOperation(): void {
    slot().replaceChildren(
      h('p', { class: 'pb-ask' }, lang === 'es' ? '¿Qué operación usas?' : 'Which operation do you use?'),
      h('div', { class: 'mopts' }, ...SYMS.map((s) => {
        const b: HTMLButtonElement = h('button', { class: 'mopt pb-sym', 'aria-label': SYM_NAME[s][lang], onClick: () => pickOp(s, b) }, s, h('small', null, SYM_NAME[s][lang]));
        return b;
      })));
  }

  function pickOp(s: Sym, b: HTMLButtonElement): void {
    if (s !== p.sym) {
      firstTry = false;
      b.disabled = true;
      shake(b);
      pop(220, 0.12);
      ctx.sayOne(lang === 'es' ? 'Piensa: ¿juntas, quitas, comparas, haces grupos o repartes?' : 'Think: put together, take away, compare, make groups or share?', lang);
      return;
    }
    pop(660, 0.2);
    ctx.sayOne(lang === 'es' ? `Sí, es una ${SYM_NAME[s].es}.` : `Yes, it is ${SYM_NAME[s].en}.`, lang);
    askNumber();
  }

  function askNumber(): void {
    slot().replaceChildren(
      ...(p.sym && choosesOperation(age) ? [h('p', { class: 'pb-ask' }, `${lang === 'es' ? 'Operación' : 'Operation'}: ${p.sym}`)] : []),
      h('div', { class: 'mopts' }, ...p.options.map((n) => {
        const b: HTMLButtonElement = h('button', { class: 'mopt', onClick: () => answer(n, b) }, String(n));
        return b;
      })));
  }

  function answer(n: number, b: HTMLButtonElement): void {
    if (wrap.classList.contains('right')) return;
    if (n !== p.answer) {
      firstTry = false;
      b.disabled = true;
      shake(b);
      pop(220, 0.12);
      ctx.sayPair('Casi. Mira los dibujos otra vez.', 'Almost. Look again.');
      return;
    }
    recordStep('prob', firstTry);
    if (firstTry) score++;
    b.classList.add('ok');
    wrap.classList.add('right');
    pop(880, 0.3);
    wrap.querySelectorAll('.pb-group .gone').forEach((x) => x.classList.add('out'));
    ctx.sayPair(`¡Sí! ${p.answer}`, `Yes! ${p.answer}`);
    timer = window.setTimeout(() => {
      wrap.classList.remove('right');
      idx++;
      if (idx < ROUNDS) next();
      else finish();
    }, 1700);
  }

  function finish(): void {
    const msg = score === ROUNDS ? '¡Perfecto!' : score >= 3 ? '¡Muy bien!' : '¡Buen intento!';
    wrap.replaceChildren(
      h('div', { class: 'gend kcard' },
        h('h2', null, msg, h('small', null, `${score} de ${ROUNDS} al primer intento`)),
        progressDots(ROUNDS, score, false),
        h('div', { class: 'kbtnrow' }, h('button', { class: 'bigbtn', onClick: begin }, 'Otra vez · Again'), exitBtn(ctx))),
    );
    ctx.sayPair(`${msg} ${score} de ${ROUNDS}.`, `${score} out of ${ROUNDS}.`);
  }

  begin();
  return { el, destroy: () => clearTimeout(timer), onHelp: () => p && idx < ROUNDS && read() };
}
