import { CHARACTER_ORDER, charOf } from '../../content/characters';
import { pop } from '../../core/audio';
import { progress } from '../../core/progress';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h } from '../dom';

const GROUP_LABEL: Record<string, string> = {
  Personajes: 'Personajes · Characters',
  Concierto: 'Las Resonantes: cantan y cazan demonios · Demon hunters',
  Objetos: 'Objetos · Things',
  Casas: 'Casas · Houses',
  Vehículos: 'Vehículos · Vehicles',
  Robots: 'Robots · Robots',
  Animales: 'Animales · Animals',
  Naturaleza: 'Naturaleza · Nature',
  Comida: 'Comida · Food',
  Mandalas: 'Mandalas para relajarse · Mandalas',
};

/** Gallery. For dots, undiscovered drawings show as mystery silhouettes. */
export function pickScreen(ctx: Ctx): Screen {
  const forColor = ctx.state.pickFor === 'color';
  const groups = new Map<string, HTMLElement>();
  for (const key of CHARACTER_ORDER) {
    const ch = charOf(key);
    const found = progress.found.includes(key);
    const mystery = !forColor && !found;
    let grid = groups.get(ch.group);
    if (!grid) {
      grid = h('div', { class: 'pick-grid' });
      groups.set(ch.group, grid);
    }
    const th = canvas(300, 225);
    drawThumb(th, key, mystery ? 'silhouette' : forColor ? 'line' : 'fill');
    grid.append(
      h('button', {
        class: 'pick-card',
        dataset: { key },
        'aria-label': mystery ? 'Dibujo misterioso' : ch.label,
        onClick: () => {
          pop(520, 0.1);
          if (forColor) {
            ctx.state.colorKey = key;
            ctx.state.freshColor = true;
            ctx.sayPair(ch.vocab.es, ch.vocab.en);
            ctx.show('color');
          } else ctx.startGame(key);
        },
      }, th, h('span', null, mystery ? '?' : ch.label)),
    );
  }
  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'pick' },
      h('h2', null, forColor ? '¿Qué quieres colorear?' : '¿Qué dibujo descubrimos?', h('small', null, forColor ? 'What do you want to color?' : 'Which drawing shall we find?')),
      ...[...groups].map(([name, grid]) => h('section', null, h('h3', null, GROUP_LABEL[name] ?? name), grid)),
    ),
  );
  return { el };
}
