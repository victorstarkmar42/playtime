import { PARENT_QUIZ, QUIZ_NOTE } from '../../content/parentquiz';
import { accuracy, progress } from '../../core/progress';
import { settings } from '../../core/settings';
import { DATA_KEYS, readJSON, writeJSON } from '../../core/storage';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';

const KEY = DATA_KEYS.parentQuiz;
export interface QuizResult {
  age: string;
  score: number;
  total: number;
  date: string;
}
export const lastQuizResult = (): QuizResult | null => readJSON<QuizResult | null>(KEY, null);

const SKILL_TIP: Record<string, string> = {
  count: 'contar objetos de la casa tocándolos uno por uno, y el Ábaco en Juegos',
  sum: 'sumar con objetos o con los dedos, y Cuentas → Sumas en Juegos',
  sub: 'restar quitando objetos ("tenías 5 galletas y comiste 2"), y Cuentas → Restas',
  mul: 'armar grupos iguales con objetos (3 platos con 4 uvas) y Cuentas → Multiplicaciones',
  div: 'repartir cosas en partes iguales entre la familia, y Cuentas → Divisiones',
};

/** Profile tip from what the child has actually played. */
function profileTips(): string[] {
  const tips: string[] = [];
  const weak = (Object.entries(progress.skills) as [string, { right: number; tries: number }][])
    .filter(([k, s]) => k !== 'seq' && s.tries >= 5)
    .map(([k, s]) => [k, accuracy(s) ?? 1] as const)
    .sort((a, b) => a[1] - b[1])[0];
  if (weak && weak[1] < 0.75 && SKILL_TIP[weak[0]]) tips.push(`Lo que más le cuesta hoy (${Math.round(weak[1] * 100)} % al primer intento): practiquen ${SKILL_TIP[weak[0]]}.`);
  if (progress.words.length < 10) tips.push(`Ha escuchado ${progress.words.length} palabras en inglés. Repasen juntos en Palabras y "Adivina la palabra".`);
  else tips.push(`Ya ha escuchado ${progress.words.length} palabras en inglés. Pídale que se las enseñe a usted: explicar ayuda a recordar.`);
  const week = Object.entries(progress.minutes).filter(([d]) => Date.now() - new Date(d).getTime() < 7 * 864e5).reduce((a, [, m]) => a + m, 0);
  if (week > 7 * 60) tips.push(`Esta semana lleva ${week} minutos en la app. Recuerde equilibrar con juego activo y lectura.`);
  return tips;
}

/** Evaluación para padres: 8 questions for the child's age, explanation after each, result with tips. */
export function parentQuizScreen(ctx: Ctx): Screen {
  const qs = PARENT_QUIZ[settings.age];
  let idx = 0;
  let score = 0;
  const wrap = h('div', { class: 'pquiz' });
  const el = h('div', { class: 'view' }, wrap);
  const back = () => h('button', { class: 'bigbtn alt small', onClick: () => ctx.show('parents') }, '← Volver a Padres');

  function show(): void {
    const q = qs[idx];
    const why = h('div', { class: 'pwhy', hidden: true });
    const next = h('button', { class: 'bigbtn', hidden: true, onClick: () => (++idx < qs.length ? show() : finish()) }, idx + 1 < qs.length ? 'Siguiente' : 'Ver resultado');
    const opts = q.options.map((o, i) =>
      h('button', { class: 'popt', onClick: () => {
        opts.forEach((b, k) => {
          b.disabled = true;
          if (k === q.answer) b.classList.add('ok');
        });
        if (i === q.answer) score++;
        else opts[i].classList.add('bad');
        why.replaceChildren(h('b', null, i === q.answer ? 'Correcto. ' : 'No exactamente. '), q.why, h('small', null, `Fuente: ${q.src}`));
        why.hidden = false;
        next.hidden = false;
      } }, o));
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, 'Evaluación para padres', h('small', null, `Perfil: niño o niña de ${settings.age.replace('-', '–')} años · Pregunta ${idx + 1} de ${qs.length}`)), back()),
      h('div', { class: 'pqcard kcard' }, h('p', { class: 'pq' }, q.q), h('div', { class: 'popts' }, ...opts), why, next),
      h('p', { class: 'muted' }, QUIZ_NOTE),
    );
  }

  function finish(): void {
    writeJSON(KEY, { age: settings.age, score, total: qs.length, date: new Date().toISOString().slice(0, 10) } satisfies QuizResult);
    const level = score >= qs.length - 1 ? 'Muy bien informado' : score >= qs.length / 2 ? 'Va por buen camino' : 'Buen momento para repasar';
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, 'Resultado', h('small', null, `${score} de ${qs.length} · ${level}`)), back()),
      h('div', { class: 'pqcard kcard' },
        h('h3', null, 'Según el perfil de su hijo'),
        h('ul', null, ...profileTips().map((t) => h('li', null, t))),
        h('h3', null, 'Para repasar'),
        h('ul', null, ...qs.map((q) => h('li', null, h('b', null, q.options[q.answer]), ` — ${q.why}`))),
        h('div', { class: 'kbtnrow' }, h('button', { class: 'bigbtn', onClick: () => ((idx = 0), (score = 0), show()) }, 'Repetir la evaluación'), back()),
      ),
      h('p', { class: 'muted' }, QUIZ_NOTE),
    );
  }

  show();
  return { el };
}
