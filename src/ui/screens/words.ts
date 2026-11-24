import { CHARACTER_ORDER, charOf } from '../../content/characters';
import { WORD_SECTIONS } from '../../content/wordbank';
import { COLORS, NUMBERS, type Word } from '../../content/words';
import { LANG_NAME, speakOrder } from '../../core/lang';
import { progress, recordWord } from '../../core/progress';
import { settings } from '../../core/settings';
import type { Lang } from '../../core/types';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h, ICONS } from '../dom';

interface Entry {
  word: Word;
  lead?: () => HTMLElement;
}
interface Section {
  id: string;
  es: string;
  en: string;
  icon: string;
  entries: () => Entry[];
}

/** The section the child was looking at last, so coming back keeps their place. */
let lastSection = 'numeros';

/**
 * "Palabras · Words": words grouped by topic (numbers, colours, animals, food…), each with a
 * picture and one button per language so the child can hear either word as often as they like.
 */
export function wordsScreen(ctx: Ctx): Screen {
  const hear = (w: Word, lang: Lang) => {
    ctx.sayOne(lang === 'en' ? w.en : w.es, lang);
    if (lang === 'en') recordWord(w.en);
  };
  const btn = (w: Word, lang: Lang) =>
    h('button', { class: `wbtn ${lang}`, 'aria-label': `${lang === 'en' ? 'Inglés' : 'Español'}: ${lang === 'en' ? w.en : w.es}`, onClick: () => hear(w, lang) },
      h('small', null, lang === 'en' ? 'EN' : 'ES'), lang === 'en' ? w.en : w.es, h('span', { class: 'ico', html: ICONS.speaker }));
  const card = (e: Entry) => h('div', { class: 'wcard' }, e.lead?.() ?? null, btn(e.word, 'es'), btn(e.word, 'en'));

  // this screen always says both languages; the mode only picks which comes first
  const bothLangs = settings.lang === 'en' ? 'en-es' : settings.lang === 'es' ? 'es-en' : settings.lang;
  const found = CHARACTER_ORDER.filter((k) => progress.found.includes(k));
  const sections: Section[] = [
    { id: 'numeros', es: 'Números', en: 'Numbers', icon: '🔢', entries: () => NUMBERS.map((word, i) => ({ word, lead: () => h('span', { class: 'wlead num' }, String(i + 1)) })) },
    { id: 'colores', es: 'Colores', en: 'Colors', icon: '🎨', entries: () => COLORS.map((word) => ({ word, lead: () => h('span', { class: 'wlead', style: `background:${word.hex}` }) })) },
    ...WORD_SECTIONS.map((s) => ({ ...s, entries: () => s.words.map((word) => ({ word, lead: () => h('span', { class: 'wlead emo', 'aria-hidden': 'true' }, word.pic) })) })),
    {
      id: 'dibujos', es: 'De tus dibujos', en: 'From your drawings', icon: '✏️',
      entries: () => found.flatMap((k) => {
        const v = charOf(k).vocab;
        const pic = () => {
          const th = canvas(160, 120);
          drawThumb(th, k, 'fill');
          return h('span', { class: 'wlead pic' }, th);
        };
        return [{ word: { es: v.es, en: v.en }, lead: pic }, ...v.extra.map(([es, en]) => ({ word: { es, en } }))];
      }),
    },
  ];
  if (!sections.some((s) => s.id === lastSection)) lastSection = 'numeros';

  const tabs = h('div', { class: 'wtabs', role: 'tablist' });
  const body = h('div', { class: 'wbody' });

  const open = (id: string, speak: boolean) => {
    lastSection = id;
    const s = sections.find((x) => x.id === id)!;
    for (const t of tabs.children) t.setAttribute('aria-selected', String((t as HTMLElement).dataset.id === id));
    const entries = s.entries();
    const missing = CHARACTER_ORDER.length - found.length;
    body.replaceChildren(...[
      h('div', { class: 'whead' },
        h('h3', null, h('span', { 'aria-hidden': 'true' }, s.icon), ` ${s.es} · ${s.en}`),
        entries.length
          ? h('button', { class: 'bigbtn alt small', onClick: () => ctx.sayItems(entries.flatMap((e) => speakOrder(bothLangs, e.word.es, e.word.en))) },
              h('span', { class: 'ico', html: ICONS.speaker }), 'Oír todas')
          : null),
      entries.length ? h('div', { class: 'wgrid' }, ...entries.map(card)) : null,
      s.id === 'dibujos' && missing > 0
        ? h('button', { class: 'wmore', onClick: () => ((ctx.state.pickFor = 'dots'), ctx.show('pick')) },
            entries.length ? `Descubre ${missing} dibujos más para ganar palabras nuevas` : 'Une los puntos de un dibujo para ganar sus palabras')
        : null,
    ].filter((x) => x !== null));
    body.scrollTop = 0;
    if (speak) ctx.sayPair(s.es, s.en);
  };

  for (const s of sections) {
    tabs.append(h('button', { class: 'wtab', role: 'tab', dataset: { id: s.id }, onClick: () => open(s.id, true) },
      h('span', { class: 'wtab-ico', 'aria-hidden': 'true' }, s.icon), h('span', null, s.es)));
  }
  open(lastSection, false);
  queueMicrotask(() => tabs.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' }));

  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'words' },
      h('h2', null, 'Palabras · Words'),
      h('p', { class: 'words-help' },
        'Elige un tema. Toca ', h('b', { class: 'tag es' }, 'ES'), ' para oír la palabra en español y ', h('b', { class: 'tag en' }, 'EN'), ' para oírla en inglés. ',
        `En los juegos la voz está en modo: ${LANG_NAME[settings.lang]}.`),
      tabs,
      body,
    ),
  );
  return { el };
}
