import { WORD_SECTIONS } from '../../content/wordbank';
import { pop } from '../../core/audio';
import { primaryLang } from '../../core/lang';
import { ABC, letterName, makeRounds, plain, type AbcEntry, type LetterRound } from '../../core/letters';
import { settings } from '../../core/settings';
import type { Lang } from '../../core/types';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { levelPicker, progressDots, shake } from './gamekit';

const ROUNDS = 5;
/** Last word shown for each letter in the alphabet (kept while the app is open). */
const lastWord = new Map<string, number>();

const T = {
  es: {
    first: (w: string) => `¿Con qué letra empieza ${w}?`,
    missing: (w: string) => `¿Qué letra le falta a ${w}?`,
    find: (l: string, w: string) => `Toca todas las ${l} de ${w}.`,
    yes: (l: string, w: string) => `¡Sí! La ${l}. ${w}.`,
    no: (l: string) => `Esa es la ${l}. Intenta otra vez.`,
    abc: (name: string, word: string, first: boolean) => (first ? `${name}, de ${word}` : `${name}, como en ${word}`),
  },
  en: {
    first: (w: string) => `What letter does ${w} start with?`,
    missing: (w: string) => `Which letter is missing in ${w}?`,
    find: (l: string, w: string) => `Tap every ${l} in ${w}.`,
    yes: (l: string, w: string) => `Yes! ${l}. ${w}.`,
    no: (l: string) => `That is ${l}. Try again.`,
    abc: (name: string, word: string, first: boolean) => (first ? `${name} is for ${word}` : `${name}, as in ${word}`),
  },
};

const PICTURE_SECTIONS = ['animales', 'comida', 'cuerpo', 'ropa', 'casa', 'naturaleza', 'transporte', 'formas', 'escuela', 'lugares'];

/** A letter as it appears in the words (lowercase). */
const letterFace = (l: string) => h('span', { class: 'lface' }, l);
/** Capital and small letter, for the alphabet: "M m". */
const letterPair = (l: string) => h('span', { class: 'lface pair' }, h('b', null, l.toUpperCase()), h('span', null, l));

/**
 * Letras: recognise the letters of the alphabet inside words.
 * 3–4 start letter, 5–6 missing letter, 7–9 look-alike letters and "tap every letter X"; plus a free alphabet.
 */
export function lettersScreen(ctx: Ctx): Screen {
  const lang: Lang = primaryLang(settings.lang);
  const t = T[lang];
  const say = (text: string) => ctx.sayOne(text, lang);
  const wordsPool = [
    ...ABC[lang].flatMap((x) => x.words),
    // only things a picture shows without doubt (no actions, feelings or greetings)
    ...WORD_SECTIONS.filter((s) => PICTURE_SECTIONS.includes(s.id)).flatMap((s) => s.words.map((w) => ({ word: lang === 'en' ? w.en : w.es, pic: w.pic }))),
  ];
  const wrap = h('div', { class: 'lettersg' });
  const el = h('div', { class: 'view' }, wrap);
  let rounds: LetterRound[] = [];
  let idx = 0;
  let score = 0;
  let firstTry = true;
  let timer = 0;
  let prompt = '';

  const head = (title: string, sub: string, ...extra: (HTMLElement | null)[]) =>
    h('div', { class: 'ghead' }, h('h2', null, title, h('small', null, sub)), ...extra);

  function menu(): void {
    clearTimeout(timer);
    wrap.replaceChildren(
      head('Letras', lang === 'en' ? 'Letters · Alphabet in English' : 'Letters · El abecedario en las palabras', h('span', { class: 'lvl-label' }, 'Nivel'), levelPicker(ctx, 'letters', menu)),
      h('div', { class: 'gmodes' },
        h('button', { class: 'gmode', onClick: () => (say(lang === 'en' ? 'Play' : 'A jugar'), start()) },
          h('span', { class: 'lbig' }, letterPair('a')), 'Jugar', h('small', null, PLAY_HELP[settings.age])),
        h('button', { class: 'gmode', onClick: () => (say(lang === 'en' ? 'Alphabet' : 'Abecedario'), alphabet()) },
          h('span', { class: 'lbig' }, 'ABC'), 'Abecedario', h('small', null, 'Toca cada letra para oír su nombre y una palabra que la tiene.'))),
    );
  }

  function start(): void {
    rounds = makeRounds(settings.age, lang, wordsPool, ROUNDS, Math.random, settings.levels.letters);
    idx = 0;
    score = 0;
    next();
  }

  function next(): void {
    firstTry = true;
    const r = rounds[idx];
    const name = letterName(r.letter, lang);
    prompt = r.kind === 'first' ? t.first(r.word) : r.kind === 'missing' ? t.missing(r.word) : t.find(name, r.word);
    const shown = r.kind === 'find' ? '' : '?';
    const found = new Set<number>();
    const tiles = [...r.word].map((ch, i) => {
      const hidden = r.kind !== 'find' && r.slots.includes(i);
      if (r.kind !== 'find') return h('span', { class: `ltile${hidden ? ' gap' : ''}` }, hidden ? shown : ch);
      const b: HTMLButtonElement = h('button', { class: 'ltile tap', onClick: () => tapLetter(i, b) }, ch);
      return b;
    });
    const wordEl = h('div', { class: 'lword' }, ...tiles);
    const status = h('p', { class: 'gstatus' },
      r.kind === 'find' ? h('span', null, 'Toca todas las ', letterFace(r.letter)) : r.kind === 'first' ? '¿Con qué letra empieza?' : '¿Qué letra falta?');
    const win = () => {
      if (firstTry) score++;
      wrap.classList.add('right');
      pop(880, 0.3);
      say(t.yes(name, r.word));
      timer = window.setTimeout(() => {
        wrap.classList.remove('right');
        idx++;
        if (idx < rounds.length) next();
        else finish();
      }, 2000);
    };
    function tapLetter(i: number, b: HTMLButtonElement): void {
      if (wrap.classList.contains('right') || found.has(i)) return;
      if (!r.slots.includes(i)) {
        firstTry = false;
        shake(b);
        pop(220, 0.12);
        say(t.no(letterName(plain(r.word[i]), lang)));
        return;
      }
      found.add(i);
      b.classList.add('ok');
      pop(640 + found.size * 80, 0.12);
      if (found.size === r.slots.length) win();
      else say(name);
    }
    const opts = r.kind === 'find' ? null : h('div', { class: 'lopts' }, ...r.options.map((l) => {
      const b: HTMLButtonElement = h('button', { class: 'lopt', 'aria-label': letterName(l, lang), onClick: () => choose(l, b) }, letterFace(l));
      return b;
    }));
    function choose(l: string, b: HTMLButtonElement): void {
      if (wrap.classList.contains('right')) return;
      if (l !== r.letter) {
        firstTry = false;
        b.disabled = true;
        shake(b);
        pop(220, 0.12);
        say(t.no(letterName(l, lang)));
        return;
      }
      b.classList.add('ok');
      for (const i of r.slots) {
        tiles[i].textContent = r.word[i];
        tiles[i].classList.add('ok');
      }
      win();
    }
    wrap.replaceChildren(
      head('Letras', lang === 'en' ? 'Letters' : 'Letters · Abecedario', progressDots(rounds.length, idx)),
      status,
      h('div', { class: 'lcard kcard' }, h('span', { class: 'lpic', 'aria-hidden': 'true' }, r.pic), wordEl),
      ...(opts ? [opts] : []),
    );
    say(prompt);
  }

  function finish(): void {
    const n = rounds.length;
    const msg = score === n ? '¡Perfecto!' : score >= 3 ? '¡Muy bien!' : '¡Buen intento!';
    wrap.replaceChildren(
      h('div', { class: 'gend kcard' },
        h('h2', null, msg, h('small', null, `${score} de ${n} al primer intento · ${score} of ${n}`)),
        progressDots(n, score, false),
        h('div', { class: 'kbtnrow' },
          h('button', { class: 'bigbtn', onClick: start }, 'Otra vez · Again'),
          h('button', { class: 'bigbtn alt', onClick: alphabet }, 'Abecedario'))),
    );
    ctx.sayPair(`${msg} ${score} de ${n}.`, `${score} out of ${n}.`);
  }

  function alphabet(): void {
    clearTimeout(timer);
    prompt = lang === 'en' ? 'Tap a letter.' : 'Toca una letra.';
    const card = (x: AbcEntry) => {
      // a different picture word than last time, so each visit brings new words
      const key = `${lang}:${x.letter}`;
      const last = lastWord.get(key) ?? -1;
      let pick = Math.floor(Math.random() * x.words.length);
      if (x.words.length > 1 && pick === last) pick = (pick + 1 + Math.floor(Math.random() * (x.words.length - 1))) % x.words.length;
      lastWord.set(key, pick);
      const w = x.words[pick];
      const word = h('span', { class: 'aword' }, ...[...w.word].map((ch) => (plain(ch) === x.letter ? h('b', null, ch) : ch)));
      return h('button', { class: 'acard', 'aria-label': x.name, onClick: (ev: Event) => {
        pop(560, 0.08);
        say(t.abc(x.name, w.word, plain(w.word[0]) === x.letter));
        (ev.currentTarget as HTMLElement).classList.add('seen');
      } }, letterPair(x.letter), h('span', { class: 'apic', 'aria-hidden': 'true' }, w.pic), word);
    };
    wrap.replaceChildren(
      head('Abecedario', lang === 'en' ? 'Alphabet · Toca una letra' : 'Alphabet · Toca una letra para oírla',
        h('button', { class: 'bigbtn alt small', onClick: () => (say(lang === 'en' ? 'New words' : 'Palabras nuevas'), alphabet()) }, 'Otras palabras'),
        h('button', { class: 'bigbtn alt small', onClick: menu }, 'Jugar')),
      h('div', { class: 'agrid2' }, ...ABC[lang].map(card)),
    );
    say(prompt);
  }

  menu();
  return { el, destroy: () => clearTimeout(timer), onHelp: () => prompt && say(prompt) };
}

const PLAY_HELP = {
  '3-4': '¿Con qué letra empieza? Oye la palabra y toca su primera letra.',
  '5-6': '¿Qué letra falta? Completa la palabra.',
  '7-9': 'Letras que se parecen (b, d, p…) y busca todas las letras de una palabra.',
} as const;
