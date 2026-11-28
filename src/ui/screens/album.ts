import { charOf } from '../../content/characters';
import { listAlbum } from '../../core/album';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';

export function albumScreen(ctx: Ctx): Screen {
  const grid = h('div', { class: 'agrid' });
  const el = h('div', { class: 'view' }, h('div', { class: 'album' }, h('h2', null, 'Mi álbum', h('small', null, 'My album')), grid));
  void listAlbum().then((items) => {
    if (!items.length) {
      grid.replaceWith(
        h('div', { class: 'empty' },
          h('span', { html: '<svg width="90" height="70" viewBox="0 0 90 70"><rect x="4" y="4" width="82" height="62" rx="10" fill="#fff" stroke="#9DB6D6" stroke-width="4" stroke-dasharray="8 8"/></svg>' }),
          'Aquí aparecerán tus dibujos terminados',
          h('button', { class: 'bigbtn', onClick: () => ((ctx.state.pickFor = 'dots'), ctx.show('pick')) }, 'Unir puntos'),
        ),
      );
      return;
    }
    for (const it of items) {
      if (it.key === 'pic') {
        const name = it.label ?? 'Mi dibujo';
        grid.append(
          h('figure', { onClick: () => ctx.sayPair(name, name) },
            h('img', { src: it.img, alt: `Dibujo: ${name}` }),
            h('figcaption', null, name),
          ),
        );
        continue;
      }
      const v = charOf(it.key).vocab;
      grid.append(
        h('figure', { onClick: () => ctx.sayPair(v.es, v.en) },
          h('img', { src: it.img, alt: `Dibujo: ${charOf(it.key).label}` }),
          h('figcaption', null, `${charOf(it.key).label} · ${v.es} / ${v.en}`),
        ),
      );
    }
  });
  return { el };
}
