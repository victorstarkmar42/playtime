import { pop } from '../../core/audio';
import { MAX_PICS, newPicId, picStore } from '../../core/mypics';
import { cleanPicName, DEFAULT_LINE_LEVEL, LINE_LEVELS } from '../../core/photo';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { boardFromImage, inkFromBoard, previewOf } from '../mypic';

/**
 * "Nuevo dibujo" (opened from Padres): the photo becomes lines, a grown-up picks more or fewer
 * lines, names it, and it is saved in "Mis dibujos" on this device.
 */
export function mypicScreen(ctx: Ctx): Screen {
  const file = ctx.state.newPic;
  let step: 'lines' | 'name' = 'lines';
  let level = DEFAULT_LINE_LEVEL;
  let board: HTMLCanvasElement | null = null;
  let ink: HTMLCanvasElement | null = null;

  const chips = [h('li', null, '1 · Foto'), h('li', null, '2 · Líneas'), h('li', null, '3 · Nombre')];
  const stepsEl = h('ol', { class: 'mp-steps' }, ...chips);
  const paintSteps = () => chips.forEach((c, i) => c.className = i === 0 || (i === 1 && step === 'name') ? 'done' : (i === 1 && step === 'lines') || (i === 2 && step === 'name') ? 'on' : '');
  const big = h('div', { class: 'mp-preview' }, h('p', { class: 'muted' }, 'Preparando la foto…'));
  const original = h('div', { class: 'mp-orig' });

  const less = h('button', { class: 'bigbtn alt mp-lv', onClick: () => setLevel(level - 1) }, 'Menos líneas');
  const more = h('button', { class: 'bigbtn alt mp-lv', onClick: () => setLevel(level + 1) }, 'Más líneas');
  const next = h('button', { class: 'bigbtn violet', disabled: true, onClick: () => go('name') }, 'Se ve bien · Siguiente');
  const linesBox = h('div', { class: 'mp-body' },
    h('div', { class: 'mp-row' }, original, h('p', { class: 'muted' }, 'Quitamos el papel y las sombras. Quedan sólo las líneas.')),
    big,
    h('div', { class: 'kbtnrow mp-levels' }, less, more),
    next,
  );

  const nameIn = h('input', { type: 'text', class: 'mp-name', maxlength: '24', value: cleanPicName(file?.name ?? ''), 'aria-label': 'Nombre del dibujo' }) as HTMLInputElement;
  const save = h('button', { class: 'bigbtn violet', onClick: () => void doSave() }, 'Guardar en Mis dibujos');
  const small = h('div', { class: 'mp-small' });
  const nameBox = h('div', { class: 'mp-body', hidden: true },
    small,
    h('label', { class: 'mp-label' }, '¿Cómo se llama este dibujo?', nameIn),
    save,
  );

  function render(): void {
    if (!ink) return;
    big.replaceChildren(previewOf(ink, 600, 450));
    less.toggleAttribute('disabled', level <= 0);
    more.toggleAttribute('disabled', level >= LINE_LEVELS.length - 1);
    next.removeAttribute('disabled');
  }
  function setLevel(l: number): void {
    if (!board || l < 0 || l >= LINE_LEVELS.length) return;
    level = l;
    ink = inkFromBoard(board, level);
    render();
  }
  function go(s: typeof step): void {
    step = s;
    linesBox.hidden = s !== 'lines';
    nameBox.hidden = s !== 'name';
    if (s === 'name' && ink) small.replaceChildren(previewOf(ink, 300, 225));
    paintSteps();
    if (s === 'name') nameIn.focus();
  }
  async function doSave(): Promise<void> {
    if (!board || !ink) return;
    const have = await picStore.list();
    if (have.length >= MAX_PICS) return ctx.toast(`Ya hay ${MAX_PICS} dibujos. Borra alguno en Padres.`);
    save.setAttribute('disabled', '');
    const src = await new Promise<Blob | null>((res) => board!.toBlob(res, 'image/jpeg', 0.86));
    if (!src) {
      save.removeAttribute('disabled');
      return ctx.toast('No se pudo guardar la imagen');
    }
    await picStore.put({
      id: newPicId(),
      name: cleanPicName(nameIn.value),
      src,
      level,
      thumb: previewOf(ink, 300, 225).toDataURL('image/jpeg', 0.8),
      createdAt: Date.now(),
    });
    pop(760, 0.3);
    ctx.toast('Guardado en Mis dibujos');
    ctx.state.newPic = null;
    ctx.show(ctx.state.newPicFrom, 'back');
  }

  const el = h('div', { class: 'view' },
    h('div', { class: 'mypic' },
      h('div', { class: 'ghead' }, h('h2', null, 'Nuevo dibujo', h('small', null, 'New drawing'))),
      stepsEl, linesBox, nameBox,
    ),
  );
  paintSteps();

  if (!file) {
    big.replaceChildren(h('p', { class: 'muted' }, 'Elige una foto con Agregar mi dibujo.'));
  } else {
    boardFromImage(file).then((b) => {
      board = b;
      original.replaceChildren(previewOf(b, 160, 120));
      setLevel(level);
    }).catch(() => {
      big.replaceChildren(h('p', { class: 'muted' }, 'No se pudo abrir esta imagen. Prueba con otra foto (JPG o PNG).'));
    });
  }

  return {
    el,
    back: () => {
      if (step === 'name') {
        go('lines');
        return true;
      }
      return false;
    },
    onHelp: () => ctx.sayPair('Si faltan líneas, toca Más líneas. Si hay manchas, toca Menos líneas.', 'Tap More lines or Fewer lines until it looks right.'),
  };
}
