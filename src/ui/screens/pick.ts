import { CHARACTER_ORDER, charOf } from '../../content/characters';
import { pop } from '../../core/audio';
import { picStore } from '../../core/mypics';
import { newPicButtons, picArt } from '../mypic';
import { progress } from '../../core/progress';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h, holdToActivate } from '../dom';

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
            ctx.state.colorPic = null;
            ctx.state.freshColor = true;
            ctx.sayPair(ch.vocab.es, ch.vocab.en);
            ctx.show('color');
          } else ctx.startGame(key);
        },
      }, th, h('span', null, mystery ? '?' : ch.label)),
    );
  }
  // "Mis dibujos": pictures a grown-up added in Padres, shown first when colouring.
  const mine = h('section', { class: 'pick-mine', hidden: true });
  let opening = false;
  // "+ Agregar mi dibujo": a grown-up holds it, then picks a photo, a file or a copied image.
  const addPanel = h('div', { class: 'pick-addpanel', hidden: true });
  let hideTimer = 0;
  const addCard = h('button', { class: 'pick-card pick-add gate', 'aria-label': 'Agregar mi dibujo (una persona adulta mantiene presionado)' },
    h('span', { class: 'ring' }),
    h('span', { class: 'pick-addicon', 'aria-hidden': 'true' }, '+'),
    h('span', null, 'Agregar mi dibujo'),
    h('small', null, 'Adulto: mantén presionado'));
  holdToActivate(addCard, 1500, () => {
    pop(700, 0.2);
    addPanel.replaceChildren(
      h('p', null, '¿De dónde viene el dibujo?'),
      h('div', { class: 'kbtnrow' }, ...newPicButtons(ctx, 'pick'),
        h('button', { class: 'bigbtn alt', onClick: () => (addPanel.hidden = true) }, 'Cancelar')));
    addPanel.hidden = false;
    addPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => (addPanel.hidden = true), 30000);
  }, () => {
    ctx.toast('Pide a una persona adulta que lo mantenga presionado');
    ctx.sayPair('Pide ayuda a un adulto', 'Ask a grown-up for help');
  });
  async function showMine(): Promise<void> {
    const pics = await picStore.list();
    const grid = h('div', { class: 'pick-grid' }, addCard);
    for (const p of pics) {
      grid.append(h('button', {
        class: 'pick-card mine',
        'aria-label': p.name,
        onClick: async () => {
          if (opening) return;
          opening = true;
          pop(520, 0.1);
          try {
            ctx.state.colorPic = await picArt(p);
            ctx.state.freshColor = true;
            ctx.sayPair(p.name, p.name);
            ctx.show('color');
          } catch {
            ctx.toast('No se pudo abrir este dibujo');
          } finally {
            opening = false;
          }
        },
      }, h('img', { src: p.thumb, alt: '' }), h('span', null, p.name)));
    }
    mine.replaceChildren(h('h3', null, 'Mis dibujos · My drawings'), addPanel, grid);
    mine.hidden = false;
  }
  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'pick' },
      h('h2', null, forColor ? '¿Qué quieres colorear?' : '¿Qué dibujo descubrimos?', h('small', null, forColor ? 'What do you want to color?' : 'Which drawing shall we find?')),
      mine,
      ...[...groups].map(([name, grid]) => h('section', null, h('h3', null, GROUP_LABEL[name] ?? name), grid)),
    ),
  );
  if (forColor) void showMine();
  return { el };
}
