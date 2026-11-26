import { pop } from '../../core/audio';
import { primaryLang } from '../../core/lang';
import { recordStep } from '../../core/progress';
import { settings } from '../../core/settings';
import { sylKindFor, sylRounds, wordText, type SylRound } from '../../core/syllables';
import type { Ctx, Screen } from '../context';
import { h, ICONS } from '../dom';
import { exitBtn, progressDots, shake } from './gamekit';

const ROUNDS = 5;

/**
 * Sílabas, by age:
 * 3–4 hear the word split into syllables and pick how many claps it has;
 * 5–6 build the word by tapping its syllables in order;
 * 7–9 the same with longer words and two syllables that don't belong.
 */
export function syllablesScreen(ctx: Ctx): Screen {
  const age = settings.age;
  const kind = sylKindFor(age);
  const lang = primaryLang(settings.lang);
  let rounds: SylRound[] = [];
  let idx = 0;
  let score = 0;
  let firstTry = true;
  let placed: string[] = [];
  let timer = 0;
  const wrap = h('div', { class: 'sylg' });
  const el = h('div', { class: 'view' }, wrap);
  const r = () => rounds[idx];
  const say = (t: string) => ctx.sayOne(t, lang);
  /** "ma... ri... po... sa": the word, then each syllable slowly. */
  const spell = () => ctx.sayItems([{ t: wordText(r().parts), lang }, { t: r().parts.join('... '), lang }]);

  function begin(): void {
    rounds = sylRounds(age, lang, ROUNDS);
    idx = 0;
    score = 0;
    show();
  }

  function head(): HTMLElement {
    return h('div', { class: 'ghead' },
      h('h2', null, 'Sílabas', h('small', null, kind === 'clap' ? 'Syllables · ¿Cuántos aplausos?' : 'Syllables · Arma la palabra')),
      progressDots(ROUNDS, idx), exitBtn(ctx));
  }

  function show(): void {
    firstTry = true;
    placed = [];
    const word = r();
    const speakBtn = h('button', { class: 'bigbtn violet small', onClick: () => (kind === 'clap' ? spell() : say(wordText(word.parts))) },
      h('span', { class: 'ico', html: ICONS.speaker }), 'Oír');
    if (kind === 'clap') {
      wrap.replaceChildren(head(),
        h('div', { class: 'syl-card kcard' }, h('span', { class: 'syl-pic' }, word.word.pic), speakBtn),
        h('div', { class: 'syl-claps' }, ...word.claps.map((n) => {
          const b: HTMLButtonElement = h('button', { class: 'syl-clap', 'aria-label': `${n}`, onClick: () => clap(n, b) },
            h('span', null, '👏'.repeat(n)), h('b', null, String(n)));
          return b;
        })));
      ctx.sayItems([{ t: lang === 'es' ? '¿Cuántos aplausos tiene?' : 'How many claps?', lang }, { t: wordText(word.parts), lang }, { t: word.parts.join('... '), lang }]);
      return;
    }
    const slots = h('div', { class: 'syl-slots' }, ...word.parts.map(() => h('span', { class: 'syl-slot' })));
    const tiles = h('div', { class: 'syl-tiles' }, ...word.tiles.map((t) => {
      const b: HTMLButtonElement = h('button', { class: 'syl-tile', onClick: () => tap(t, b, slots) }, t);
      return b;
    }));
    wrap.replaceChildren(head(),
      h('div', { class: 'syl-card kcard' }, h('span', { class: 'syl-pic' }, word.word.pic), speakBtn),
      slots,
      tiles,
      h('div', { class: 'kbtnrow syl-row' }, h('button', { class: 'bigbtn alt small', onClick: () => undo(slots, tiles) }, 'Borrar')));
    ctx.sayItems([{ t: lang === 'es' ? 'Arma la palabra' : 'Build the word', lang }, { t: wordText(word.parts), lang }]);
  }

  function clap(n: number, b: HTMLButtonElement): void {
    if (wrap.classList.contains('right')) return;
    if (n !== r().parts.length) {
      firstTry = false;
      b.disabled = true;
      shake(b);
      pop(220, 0.12);
      ctx.sayItems([{ t: lang === 'es' ? 'Escucha otra vez' : 'Listen again', lang }, { t: r().parts.join('... '), lang }]);
      return;
    }
    b.classList.add('ok');
    win();
  }

  function tap(t: string, b: HTMLButtonElement, slots: HTMLElement): void {
    if (wrap.classList.contains('right') || b.disabled) return;
    const want = r().parts[placed.length];
    say(t);
    if (t !== want) {
      firstTry = false;
      shake(b);
      pop(220, 0.12);
      return;
    }
    placed.push(t);
    b.disabled = true;
    b.classList.add('used');
    const slot = slots.children[placed.length - 1] as HTMLElement;
    slot.textContent = t;
    slot.classList.add('full');
    pop(520 + placed.length * 80, 0.15);
    if (placed.length === r().parts.length) win();
  }

  function undo(slots: HTMLElement, tiles: HTMLElement): void {
    if (wrap.classList.contains('right') || !placed.length) return;
    const t = placed.pop()!;
    const slot = slots.children[placed.length] as HTMLElement;
    slot.textContent = '';
    slot.classList.remove('full');
    const b = [...tiles.children].reverse().find((x) => x.textContent === t && (x as HTMLButtonElement).disabled) as HTMLButtonElement | undefined;
    if (b) (b.disabled = false), b.classList.remove('used');
  }

  function win(): void {
    recordStep('syl', firstTry);
    if (firstTry) score++;
    wrap.classList.add('right');
    pop(880, 0.3);
    const w = wordText(r().parts);
    ctx.sayItems([{ t: lang === 'es' ? '¡Muy bien!' : 'Great!', lang }, { t: r().parts.join('... '), lang }, { t: w, lang }]);
    timer = window.setTimeout(() => {
      wrap.classList.remove('right');
      idx++;
      if (idx < ROUNDS) show();
      else finish();
    }, 2600);
  }

  function finish(): void {
    const msg = score === ROUNDS ? '¡Perfecto!' : score >= 3 ? '¡Muy bien!' : '¡Buen intento!';
    wrap.replaceChildren(
      h('div', { class: 'gend kcard' },
        h('h2', null, msg, h('small', null, `${score} de ${ROUNDS} al primer intento`)),
        h('div', { class: 'syl-done' }, ...rounds.map((x) => h('span', null, x.word.pic, h('small', null, x.parts.join('-'))))),
        h('div', { class: 'kbtnrow' }, h('button', { class: 'bigbtn', onClick: begin }, 'Otra vez · Again'), exitBtn(ctx))),
    );
    ctx.sayPair(`${msg} ${score} de ${ROUNDS}.`, `${score} out of ${ROUNDS}.`);
  }

  begin();
  return { el, destroy: () => clearTimeout(timer), onHelp: () => rounds.length && idx < ROUNDS && spell() };
}
