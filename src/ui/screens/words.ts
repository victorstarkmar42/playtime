import { CHARACTER_ORDER, charOf } from '../../content/characters';
import { COLORS, NUMBERS, type Word } from '../../content/words';
import { LANG_NAME } from '../../core/lang';
import { progress, recordWord } from '../../core/progress';
import { settings } from '../../core/settings';
import type { Lang } from '../../core/types';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h, ICONS } from '../dom';

/**
 * "Palabras · Words": every word the child has met, with one button per language
 * so they can hear the English (or Spanish) word on its own, as many times as they like.
 */
export function wordsScreen(ctx: Ctx): Screen {
  const hear = (w: Word, lang: Lang) => {
    ctx.sayOne(lang === 'en' ? w.en : w.es, lang);
    if (lang === 'en') recordWord(w.en);
  };
  const btn = (w: Word, lang: Lang) =>
    h('button', { class: `wbtn ${lang}`, 'aria-label': `${lang === 'en' ? 'Inglés' : 'Español'}: ${lang === 'en' ? w.en : w.es}`, onClick: () => hear(w, lang) },
      h('small', null, lang === 'en' ? 'EN' : 'ES'), lang === 'en' ? w.en : w.es, h('span', { class: 'ico', html: ICONS.speaker }));

  const card = (w: Word, lead?: HTMLElement) => h('div', { class: 'wcard' }, lead ?? null, btn(w, 'es'), btn(w, 'en'));

  const numbers = NUMBERS.map((w, i) => card(w, h('span', { class: 'wlead num' }, String(i + 1))));
  const colors = COLORS.map((c) => card(c, h('span', { class: 'wlead', style: `background:${c.hex}` })));

  const found = CHARACTER_ORDER.filter((k) => progress.found.includes(k));
  const drawings = found.flatMap((k) => {
    const v = charOf(k).vocab;
    const th = canvas(160, 120);
    drawThumb(th, k, 'fill');
    return [card({ es: v.es, en: v.en }, h('span', { class: 'wlead pic' }, th)), ...v.extra.map(([es, en]) => card({ es, en }))];
  });
  const missing = CHARACTER_ORDER.length - found.length;

  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'words' },
      h('h2', null, 'Palabras · Words'),
      h('p', { class: 'words-help' },
        'Toca ', h('b', { class: 'tag es' }, 'ES'), ' para oír la palabra en español y ', h('b', { class: 'tag en' }, 'EN'), ' para oírla en inglés. ',
        `En los juegos la voz está en modo: ${LANG_NAME[settings.lang]}.`),
      h('h3', null, 'Números · Numbers'),
      h('div', { class: 'wgrid' }, ...numbers),
      h('h3', null, 'Colores · Colors'),
      h('div', { class: 'wgrid' }, ...colors),
      h('h3', null, 'De tus dibujos · From your drawings'),
      drawings.length ? h('div', { class: 'wgrid' }, ...drawings) : null,
      missing > 0
        ? h('button', { class: 'wmore', onClick: () => ((ctx.state.pickFor = 'dots'), ctx.show('pick')) },
            drawings.length ? `Descubre ${missing} dibujos más para ganar palabras nuevas` : 'Une los puntos de un dibujo para ganar sus palabras')
        : null,
    ),
  );
  return { el };
}
