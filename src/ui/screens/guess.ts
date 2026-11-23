import { charOf } from '../../content/characters';
import { pop } from '../../core/audio';
import { kindFor, makeRounds, spellLang, spellTiles, type GuessRound } from '../../core/guess';
import { pickText, primaryLang } from '../../core/lang';
import { recordWord } from '../../core/progress';
import { settings } from '../../core/settings';
import type { CharKey } from '../../core/types';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h, ICONS } from '../dom';
import { exitBtn } from './gamekit';

const ROUNDS = 5;

/**
 * "Adivina la palabra", by age:
 * 3–4 hear the word and touch its picture (3 pictures);
 * 5–6 see the picture and touch its word (4 words);
 * 7–9 see the picture and spell its name with letter tiles.
 */
export function guessScreen(ctx: Ctx): Screen {
  const kind = kindFor(settings.age);
  const lang = spellLang(settings.lang);
  let rounds: GuessRound[] = [];
  let idx = 0;
  let score = 0;
  let firstTry = true;
  let timer = 0;

  const wrap = h('div', { class: 'guess' });
  const el = h('div', { class: 'view' }, wrap);
  const vocab = (k: CharKey) => charOf(k).vocab;
  const thumb = (k: CharKey, w = 300, hh = 225) => {
    const c = canvas(w, hh);
    drawThumb(c, k, 'fill');
    return c;
  };
  const speakerBtn = (label: string, onClick: () => void) =>
    h('button', { class: 'bigbtn violet small', onClick }, h('span', { class: 'ico', html: ICONS.speaker }), label);

  function begin(): void {
    rounds = makeRounds(kind, ROUNDS, lang);
    idx = 0;
    score = 0;
    show();
  }

  function stars(): HTMLElement {
    return h('div', { class: 'gstars', 'aria-label': `Pregunta ${idx + 1} de ${ROUNDS}` },
      ...rounds.map((_, i) => h('span', { class: i < idx ? 'done' : i === idx ? 'now' : '' })));
  }

  function prompt(): void {
    const v = vocab(rounds[idx].key);
    if (kind === 'pick-image') ctx.sayPair(`Busca: ${v.es}`, `Find: ${v.en}`);
    else if (kind === 'pick-word') ctx.sayPair('¿Qué es?', 'What is it?');
    else ctx.sayPair('Escribe su nombre', 'Spell the word');
  }

  function correct(): void {
    const v = vocab(rounds[idx].key);
    if (firstTry) score++;
    recordWord(v.en);
    pop(880, 0.3);
    ctx.sayPair(`¡Muy bien! ${v.es}`, `Great! ${v.en}`);
    wrap.classList.add('right');
    timer = window.setTimeout(() => {
      wrap.classList.remove('right');
      idx++;
      if (idx < ROUNDS) show();
      else finish();
    }, 1800);
  }

  function wrong(btn: HTMLElement): void {
    firstTry = false;
    pop(220, 0.12);
    btn.classList.remove('shake');
    void btn.offsetWidth;
    btn.classList.add('shake');
  }

  function show(): void {
    firstTry = true;
    const r = rounds[idx];
    const v = vocab(r.key);
    let body: HTMLElement;
    let title: HTMLElement;

    if (kind === 'pick-image') {
      const t = pickText(settings.lang, v.es, v.en);
      title = h('h2', null, `Busca: ${t.main}`, t.sub ? h('small', null, `Find: ${t.sub}`) : null);
      body = h('div', { class: 'gopts pics' },
        ...r.options.map((k) => {
          const b: HTMLButtonElement = h('button', { class: 'gopt pic', 'aria-label': vocab(k).es, onClick: () => {
            if (wrap.classList.contains('right')) return;
            if (k === r.key) {
              b.classList.add('ok');
              correct();
            } else {
              wrong(b);
              b.disabled = true;
              ctx.sayPair('Ése no. Busca otra vez.', 'Not that one. Try again.');
            }
          } }, thumb(k));
          return b;
        }));
    } else if (kind === 'pick-word') {
      title = h('h2', null, '¿Qué es?', h('small', null, 'What is it? · Toca su palabra'));
      body = h('div', { class: 'gsplit' },
        h('div', { class: 'gpic' }, thumb(r.key, 480, 360)),
        h('div', { class: 'gopts words' },
          ...r.options.map((k) => {
            const t = pickText(settings.lang, vocab(k).es, vocab(k).en);
            const b: HTMLButtonElement = h('button', { class: 'gopt word', onClick: () => {
              if (wrap.classList.contains('right')) return;
              if (k === r.key) {
                b.classList.add('ok');
                correct();
              } else {
                wrong(b);
                b.disabled = true;
                ctx.sayPair(`No, ésa es: ${vocab(k).es}`, `No, that says: ${vocab(k).en}`);
              }
            } }, t.main, t.sub ? h('small', null, t.sub) : null);
            return b;
          }),
          speakerBtn('Oír las palabras', () =>
            ctx.sayItems(r.options.map((k) => ({ t: vocab(k)[primaryLang(settings.lang)], lang: primaryLang(settings.lang) })))),
        ));
    } else {
      const word = v[lang];
      const letters = [...word.toLowerCase()];
      let pos = 0;
      const slots = letters.map(() => h('span', { class: 'gslot' }));
      const other = lang === 'en' ? v.es : v.en;
      const bilingual = settings.lang !== 'es' && settings.lang !== 'en';
      title = h('h2', null, lang === 'en' ? 'Escríbelo en inglés' : 'Escribe su nombre',
        h('small', null, lang === 'en' ? 'Spell it in English' : 'Spell it', bilingual ? ` · Pista: ${other}` : ''));
      const tiles = spellTiles(word).map((ch) => {
        const b: HTMLButtonElement = h('button', { class: 'gtile', onClick: () => {
          if (wrap.classList.contains('right')) return;
          if (ch === letters[pos]) {
            slots[pos].textContent = ch;
            slots[pos].classList.add('full');
            b.disabled = true;
            b.classList.add('used');
            pop(500 + pos * 40, 0.1);
            pos++;
            if (pos === letters.length) correct();
          } else wrong(b);
        } }, ch);
        return b;
      });
      body = h('div', { class: 'gsplit' },
        h('div', { class: 'gpic' }, thumb(r.key, 480, 360)),
        h('div', { class: 'gspell' },
          h('div', { class: 'gslots' }, ...slots),
          h('div', { class: 'gtiles' }, ...tiles),
          speakerBtn('Oír la palabra', () => ctx.sayOne(word, lang)),
        ));
    }

    wrap.replaceChildren(h('div', { class: 'ghead' }, title, stars(), exitBtn(ctx)), body);
    prompt();
  }

  function finish(): void {
    const msg = score === ROUNDS ? '¡Perfecto!' : score >= 3 ? '¡Muy bien!' : '¡Buen intento!';
    wrap.replaceChildren(
      h('div', { class: 'gend kcard' },
        h('h2', null, msg, h('small', null, `Acertaste ${score} de ${ROUNDS} al primer intento · ${score} of ${ROUNDS}`)),
        h('div', { class: 'gstars big' }, ...rounds.map((_, i) => h('span', { class: i < score ? 'done' : '' }))),
        h('div', { class: 'kbtnrow' },
          h('button', { class: 'bigbtn', onClick: begin }, 'Jugar otra vez · Again'),
          exitBtn(ctx),
        ),
      ),
    );
    ctx.sayPair(`${msg} Acertaste ${score} de ${ROUNDS}.`, `${score === ROUNDS ? 'Perfect!' : 'Well done!'} ${score} out of ${ROUNDS}.`);
  }

  begin();
  return { el, destroy: () => clearTimeout(timer), onHelp: prompt };
}
