import { storiesFor, type Story, type StoryOption } from '../../content/stories';
import { pop } from '../../core/audio';
import { pickText, primaryLang } from '../../core/lang';
import { recordStep } from '../../core/progress';
import { settings } from '../../core/settings';
import type { Ctx, Screen } from '../context';
import { h, ICONS } from '../dom';
import { exitBtn, progressDots, shake } from './gamekit';

/**
 * Cuentos: a short story read aloud sentence by sentence (the sentence, and the word when the voice
 * reports it, light up), any word can be tapped to hear it, then questions: who, what happened, why.
 * Stories are in the main language of the voice setting.
 */
export function storiesScreen(ctx: Ctx): Screen {
  const age = settings.age;
  const lang = primaryLang(settings.lang);
  const list = storiesFor(age);
  const little = age === '3-4';
  let story: Story = list[0];
  let qi = 0;
  let score = 0;
  let firstTry = true;
  let timer = 0;
  let order: StoryOption[] = [];
  const wrap = h('div', { class: 'storyg' });
  const el = h('div', { class: 'view' }, wrap);
  const tx = (es: string, en: string) => pickText(settings.lang, es, en);
  const speak = (t: string) => ctx.sayOne(t, lang);
  const clean = (w: string) => w.replace(/[¡!¿?.,:;"]/g, '');

  function menu(): void {
    clearTimeout(timer);
    ctx.speaker.cancel();
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, 'Cuentos', h('small', null, 'Stories · Elige un cuento')), exitBtn(ctx)),
      h('div', { class: 'st-list' }, ...list.map((s) => {
        const t = tx(s.title.es, s.title.en);
        return h('button', { class: 'st-card', onClick: () => (speak(s.title[lang]), open(s)) },
          h('span', { class: 'st-pic' }, s.pic), t.main, t.sub ? h('small', null, t.sub) : null);
      })),
    );
    ctx.sayPair('Elige un cuento', 'Pick a story');
  }

  let lines: HTMLElement[] = [];
  let wordsOf: { el: HTMLElement; at: number }[][] = [];

  function open(s: Story): void {
    story = s;
    const sentences = s[lang];
    lines = [];
    wordsOf = [];
    const text = h('div', { class: 'st-text' }, ...sentences.map((sent, i) => {
      let at = 0;
      const ws: { el: HTMLElement; at: number }[] = [];
      const line = h('p', { class: 'st-line' }, ...sent.split(' ').flatMap((w, j) => {
        const span = h('span', { class: 'st-w', onClick: (e: Event) => (e.stopPropagation(), speak(clean(w))) }, w);
        ws.push({ el: span, at });
        at += w.length + 1;
        return j ? [' ', span] : [span];
      }));
      line.addEventListener('click', () => readFrom(i));
      lines.push(line);
      wordsOf.push(ws);
      return line;
    }));
    const t = tx(s.title.es, s.title.en);
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, `${s.pic} ${t.main}`, t.sub ? h('small', null, t.sub) : null), h('button', { class: 'bigbtn alt small', onClick: menu }, 'Cuentos'), exitBtn(ctx)),
      h('div', { class: `st-page kcard${little ? ' big' : ''}` }, text),
      h('div', { class: 'kbtnrow st-actions' },
        h('button', { class: 'bigbtn violet', onClick: () => readFrom(0) }, h('span', { class: 'ico', html: ICONS.speaker }), 'Leer conmigo'),
        h('button', { class: 'bigbtn', onClick: () => startQuestions() }, 'Preguntas →')),
      h('p', { class: 'muted st-tip' }, little ? 'Escucha el cuento. Toca una palabra para oírla.' : 'Lee el cuento. Toca una palabra para oírla, o una frase para leer desde ahí.'),
    );
    if (little) readFrom(0);
  }

  function mark(i: number, w = -1): void {
    lines.forEach((l, k) => l.classList.toggle('on', k === i));
    wordsOf.forEach((ws, k) => ws.forEach((x, j) => x.el.classList.toggle('on', k === i && j === w)));
  }

  function readFrom(start: number): void {
    const sentences = story[lang].slice(start);
    if (!settings.voice) return;
    ctx.speaker.say(sentences.map((t) => ({ t, lang })), {
      start: (i) => mark(start + i),
      word: (i, ch) => {
        const ws = wordsOf[start + i];
        if (!ws) return;
        let j = 0;
        while (j + 1 < ws.length && ws[j + 1].at <= ch) j++;
        mark(start + i, j);
      },
      end: () => mark(-1),
    });
  }

  function startQuestions(): void {
    ctx.speaker.cancel();
    qi = 0;
    score = 0;
    ask();
  }

  function ask(): void {
    firstTry = true;
    const qq = story.questions[qi];
    order = qq.options.slice().sort(() => Math.random() - 0.5);
    const t = tx(qq.es, qq.en);
    wrap.replaceChildren(
      h('div', { class: 'ghead' },
        h('h2', null, `${story.pic} ${tx(story.title.es, story.title.en).main}`),
        progressDots(story.questions.length, qi),
        h('button', { class: 'bigbtn alt small', onClick: () => open(story) }, 'Ver cuento'),
        exitBtn(ctx)),
      h('div', { class: 'st-q kcard' },
        h('button', { class: 'ibtn st-say', 'aria-label': 'Oír la pregunta', html: ICONS.speaker, onClick: sayQ }),
        h('div', null, h('b', null, t.main), t.sub ? h('small', null, t.sub) : null)),
      h('div', { class: `st-opts${little ? ' pics' : ''}` }, ...order.map((op) => {
        const ot = tx(op.es, op.en);
        const b: HTMLButtonElement = h('button', { class: 'st-opt', onClick: () => answer(op, b) },
          op.pic && (little || age === '5-6') ? h('span', { class: 'st-pic' }, op.pic) : null,
          h('span', null, ot.main, ot.sub ? h('small', null, ot.sub) : null));
        return b;
      })),
    );
    sayQ();
  }

  function sayQ(): void {
    const qq = story.questions[qi];
    // the youngest hear the choices too, since they don't read yet
    const extra = little ? order.map((o) => o[lang]).join(lang === 'es' ? ', o ' : ', or ') : '';
    ctx.speaker.say([{ t: qq[lang], lang }, ...(extra ? [{ t: extra, lang }] : [])]);
  }

  function answer(op: StoryOption, b: HTMLButtonElement): void {
    if (wrap.classList.contains('right')) return;
    const right = op === story.questions[qi].options[0];
    if (!right) {
      firstTry = false;
      b.disabled = true;
      shake(b);
      pop(220, 0.12);
      ctx.sayPair('Casi. Piensa en el cuento.', 'Almost. Think about the story.');
      return;
    }
    recordStep('read', firstTry);
    if (firstTry) score++;
    b.classList.add('ok');
    wrap.classList.add('right');
    pop(880, 0.3);
    ctx.sayPair(`¡Sí! ${op.es}`, `Yes! ${op.en}`);
    timer = window.setTimeout(() => {
      wrap.classList.remove('right');
      qi++;
      if (qi < story.questions.length) ask();
      else finish();
    }, 1600);
  }

  function finish(): void {
    const n = story.questions.length;
    const msg = score === n ? '¡Excelente lectura!' : score >= n - 1 ? '¡Muy bien!' : '¡Buen intento!';
    const idx = list.indexOf(story);
    const next = list[(idx + 1) % list.length];
    wrap.replaceChildren(
      h('div', { class: 'gend kcard' },
        h('h2', null, msg, h('small', null, `${score} de ${n} al primer intento`)),
        progressDots(n, score, false),
        h('div', { class: 'kbtnrow' },
          h('button', { class: 'bigbtn', onClick: () => open(next) }, `Siguiente: ${next.pic} ${tx(next.title.es, next.title.en).main}`),
          h('button', { class: 'bigbtn alt', onClick: () => open(story) }, 'Leer otra vez'),
          h('button', { class: 'bigbtn alt', onClick: menu }, 'Cuentos'))),
    );
    ctx.sayPair(`${msg} ${score} de ${n}.`, `${score} out of ${n}.`);
  }

  menu();
  return {
    el,
    destroy: () => (clearTimeout(timer), ctx.speaker.cancel()),
    onHelp: () => (wrap.querySelector('.st-q') ? sayQ() : wrap.querySelector('.st-text') ? readFrom(0) : ctx.sayPair('Elige un cuento', 'Pick a story')),
  };
}
