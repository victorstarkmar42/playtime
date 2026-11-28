import { COLORS } from '../../content/words';
import { pop } from '../../core/audio';
import { recordWord } from '../../core/progress';
import { settings } from '../../core/settings';
import { FIGURES, piecePath, preciosoEs, unEs, piecesFor, sameShape, SHAPE_NAME, shapeCounts, snapTarget, SNAP, type Figure, type Piece, type ShapeKind } from '../../core/shapes';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { shake } from './gamekit';

const NS = 'http://www.w3.org/2000/svg';
const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

/** Colour of a piece before the child paints it, by shape (helps match shapes by sight too). */
const KIND_TINT: Record<ShapeKind, string> = { rect: '#FFE082', square: '#FFD54A', tri: '#FFAB91', triDown: '#FFAB91', triLeft: '#FFAB91', triRight: '#FFAB91', circle: '#81D4FA', semi: '#CE93D8', trap: '#A5D6A7' };
const INK = '#22304F';

const shuffle = <T,>(a: T[]): T[] => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

/** Thumbnail of a piece. With `box` (the biggest piece of the figure) pieces keep their size relative to each other. */
function thumb(p: Piece, fill: string, box = Math.max(p.w, p.h)): SVGSVGElement {
  const m = box * 1.12;
  const s = svg('svg', { viewBox: `${p.x + p.w / 2 - m / 2} ${p.y + p.h / 2 - m / 2} ${m} ${m}`, 'aria-hidden': 'true' });
  s.append(svg('path', { d: piecePath(p), fill, stroke: INK, 'stroke-width': m / 40, 'stroke-linejoin': 'round' }));
  return s;
}

/** Figure preview for the picker: the pieces in their own colours. */
function preview(f: Figure): SVGSVGElement {
  const s = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true' });
  for (const p of piecesFor(f, settings.age)) s.append(svg('path', { d: piecePath(p), fill: KIND_TINT[p.kind], stroke: INK, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }));
  return s;
}

/** Construye con figuras: put each shape in its place to build a house, a rocket, a train… then colour it. */
export function buildScreen(ctx: Ctx): Screen {
  const el = h('div', { class: 'view' });
  let cleanup: (() => void) | null = null;

  const sayShape = (k: ShapeKind) => {
    const n = SHAPE_NAME[k];
    ctx.sayPair(n.es, n.en);
    recordWord(n.en);
  };

  function picker(): void {
    cleanup?.();
    const grid = h('div', { class: 'bd-grid' });
    for (const f of FIGURES) {
      grid.append(h('button', {
        class: 'bd-card',
        'aria-label': f.es,
        onClick: () => play(f),
      }, preview(f), h('span', null, f.es[0].toUpperCase() + f.es.slice(1))));
    }
    el.replaceChildren(h('div', { class: 'bd-pick' },
      h('div', { class: 'ghead' }, h('h2', null, 'Construye con figuras', h('small', null, 'Build with shapes'))),
      h('p', { class: 'gstatus' }, settings.age === '3-4' ? 'Elige qué quieres construir.' : 'Elige una figura. Pon cada pieza en su lugar y después coloréala.'),
      grid));
    ctx.sayPair('¿Qué quieres construir?', 'What do you want to build?');
  }

  function play(f: Figure): void {
    cleanup?.();
    const age = settings.age;
    const slots = piecesFor(f, age);
    const filled = slots.map(() => false);
    const colours = slots.map((p) => KIND_TINT[p.kind]);
    const outlined = age !== '7-9'; // the oldest only see the figure's shadow, not each piece's place
    let selected = -1; // tray index
    let phase: 'build' | 'paint' | 'done' = 'build';
    let paintColor = COLORS[0].hex;

    const board = svg('svg', { viewBox: '-2 -2 104 104', class: 'bd-board', role: 'img', 'aria-label': f.es });
    const shadow = svg('g', { class: 'bd-shadow' });
    const slotLayer = svg('g');
    const placedLayer = svg('g');
    board.append(shadow, slotLayer, placedLayer);
    for (const p of slots) shadow.append(svg('path', { d: piecePath(p), fill: '#DCE6F2' }));
    const slotEls = slots.map((p, i) => {
      const e = svg('path', { d: piecePath(p), class: outlined ? 'bd-slot' : 'bd-slot quiet', 'data-i': i });
      slotLayer.append(e);
      return e;
    });
    const placedEls: (SVGPathElement | null)[] = slots.map(() => null);

    const title = h('h2', null, `Construye: ${f.es}`, h('small', null, `Build a ${f.en}`));
    const status = h('p', { class: 'gstatus', role: 'status' });
    const tray = h('div', { class: 'bd-tray', role: 'group', 'aria-label': 'Piezas' });
    const side = h('div', { class: 'bd-side' }, tray);
    const boardBox = h('div', { class: 'bd-boardbox' }, board);
    const ghost = h('div', { class: 'bd-ghost', hidden: true });
    el.replaceChildren(h('div', { class: 'buildg' },
      h('div', { class: 'ghead' }, title, h('button', { class: 'bigbtn alt small', onClick: picker }, 'Otra figura')),
      status,
      h('div', { class: 'bd-main' }, boardBox, side),
      ghost));

    // tray: one button per piece, shuffled
    const biggest = Math.max(...slots.map((p) => Math.max(p.w, p.h)));
    const order = shuffle(slots.map((_, i) => i));
    const trayBtns = order.map((si) => {
      const p = slots[si];
      const b = h('button', { class: 'bd-piece', 'aria-label': SHAPE_NAME[p.kind].es }, thumb(p, KIND_TINT[p.kind], biggest));
      b.dataset.slot = String(si);
      tray.append(b);
      return b;
    });
    const used = trayBtns.map(() => false);

    const setStatus = () => {
      const left = filled.filter((x) => !x).length;
      status.textContent = left
        ? age === '3-4' ? 'Arrastra cada figura a su lugar, o tócala y luego toca su lugar.' : `Faltan ${left} piezas. Arrastra cada una a su lugar.`
        : '';
    };
    setStatus();

    const select = (t: number) => {
      selected = t;
      trayBtns.forEach((b, i) => b.classList.toggle('sel', i === t));
      if (t >= 0) {
        const p = slots[Number(trayBtns[t].dataset.slot)];
        sayShape(p.kind);
        if (age === '3-4') slotEls.forEach((e, i) => e.classList.toggle('hint', !filled[i] && sameShape(slots[i], p)));
      } else slotEls.forEach((e) => e.classList.remove('hint'));
    };

    const place = (t: number, si: number) => {
      filled[si] = true;
      used[t] = true;
      trayBtns[t].hidden = true;
      slotEls[si].classList.remove('hint');
      const e = svg('path', { d: piecePath(slots[si]), fill: colours[si], class: 'bd-placed', stroke: INK, 'stroke-width': 1, 'stroke-linejoin': 'round' });
      e.addEventListener('click', () => paintPiece(si));
      placedLayer.append(e);
      placedEls[si] = e;
      select(-1);
      pop(500 + filled.filter(Boolean).length * 60, 0.12);
      setStatus();
      if (filled.every(Boolean)) built();
    };

    const boardPt = (cx: number, cy: number): [number, number] => {
      const r = board.getBoundingClientRect();
      return [-2 + ((cx - r.left) / r.width) * 104, -2 + ((cy - r.top) / r.height) * 104];
    };
    const tryDrop = (t: number, cx: number, cy: number): boolean => {
      const p = slots[Number(trayBtns[t].dataset.slot)];
      const [x, y] = boardPt(cx, cy);
      const si = snapTarget(p, x, y, slots, filled, SNAP[age]);
      if (si < 0) return false;
      place(t, si);
      return true;
    };

    // drag from the tray (a short tap selects instead)
    let drag: { t: number; id: number; x0: number; y0: number; moved: boolean } | null = null;
    trayBtns.forEach((b, t) => {
      b.addEventListener('pointerdown', (e) => {
        if (phase !== 'build' || used[t]) return;
        drag = { t, id: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false };
        try { b.setPointerCapture(e.pointerId); } catch { /* synthetic or ended pointer */ }
      });
      b.addEventListener('pointermove', (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 10) return;
        if (!drag.moved) {
          drag.moved = true;
          const p = slots[Number(b.dataset.slot)];
          const r = board.getBoundingClientRect();
          const k = r.width / 104;
          ghost.replaceChildren(thumb(p, KIND_TINT[p.kind]));
          const m = Math.max(p.w, p.h) * 1.12 * k;
          ghost.style.width = ghost.style.height = `${m}px`;
          ghost.hidden = false;
          b.classList.add('lifted');
          sayShape(p.kind);
        }
        ghost.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      });
      const end = (e: PointerEvent) => {
        if (!drag || drag.id !== e.pointerId) return;
        const d = drag;
        drag = null;
        ghost.hidden = true;
        b.classList.remove('lifted');
        if (!d.moved) return select(selected === t ? -1 : t);
        if (!tryDrop(t, e.clientX, e.clientY)) {
          shake(b);
          const p = slots[Number(b.dataset.slot)];
          ctx.sayPair(`Busca el lugar del ${SHAPE_NAME[p.kind].es}.`, `Find the place for the ${SHAPE_NAME[p.kind].en}.`);
        }
      };
      b.addEventListener('pointerup', end);
      b.addEventListener('pointercancel', (e) => {
        if (drag?.id === e.pointerId) {
          drag = null;
          ghost.hidden = true;
          b.classList.remove('lifted');
        }
      });
    });

    // tap a place after choosing a piece
    board.addEventListener('click', (e) => {
      if (phase !== 'build' || selected < 0) return;
      const [x, y] = boardPt(e.clientX, e.clientY);
      const p = slots[Number(trayBtns[selected].dataset.slot)];
      // the place under the finger that fits this piece, if any
      const si = slots.findIndex((s, i) => !filled[i] && sameShape(s, p) && x >= s.x - 3 && x <= s.x + s.w + 3 && y >= s.y - 3 && y <= s.y + s.h + 3);
      if (si >= 0) place(selected, si);
      else {
        shake(trayBtns[selected]);
        ctx.sayPair(`Ahí no va. Busca el lugar del ${SHAPE_NAME[p.kind].es}.`, `Not there. Find the place for the ${SHAPE_NAME[p.kind].en}.`);
      }
    });

    function built(): void {
      phase = 'paint';
      const counts = shapeCounts(slots);
      const list = counts.map((c) => `${c.n} ${c.n === 1 ? SHAPE_NAME[c.kind].es : SHAPE_NAME[c.kind].esPl}`).join(', ');
      const listEn = counts.map((c) => `${c.n} ${c.n === 1 ? SHAPE_NAME[c.kind].en : SHAPE_NAME[c.kind].enPl}`).join(', ');
      status.textContent = age === '3-4' ? `¡Construiste ${unEs(f)}! Ahora coloréalo.` : `¡Construiste ${unEs(f)} con ${list}! Ahora coloréalo: toca un color y luego una pieza.`;
      ctx.sayPair(age === '3-4' ? `¡Muy bien! Construiste ${unEs(f)}. Ahora coloréalo.` : `¡Muy bien! Construiste ${unEs(f)} con ${list}. Ahora coloréalo.`, age === '3-4' ? `Great! You built a ${f.en}. Now color it.` : `Great! You built a ${f.en} with ${listEn}. Now color it.`);
      shadow.remove();
      slotLayer.remove();
      const sw = h('div', { class: 'bd-swatches', role: 'group', 'aria-label': 'Colores' });
      for (const col of COLORS) {
        const b = h('button', {
          class: 'swatch',
          style: `background:${col.hex}`,
          'aria-label': `${col.es} / ${col.en}`,
          'aria-pressed': String(col.hex === paintColor),
          onClick: () => {
            paintColor = col.hex;
            sw.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
            ctx.sayPair(col.es, col.en);
            recordWord(col.en);
          },
        });
        sw.append(b);
      }
      side.replaceChildren(sw, h('button', { class: 'bigbtn violet', onClick: finish }, '¡Terminé!'));
    }

    const painted = new Set<number>();
    function paintPiece(si: number): void {
      if (phase !== 'paint') return;
      colours[si] = paintColor;
      placedEls[si]?.setAttribute('fill', paintColor);
      painted.add(si);
      pop(620, 0.08);
      if (painted.size === slots.length) finish();
    }

    function finish(): void {
      if (phase === 'done') return;
      phase = 'done';
      board.classList.add('win');
      const next = FIGURES[(FIGURES.indexOf(f) + 1) % FIGURES.length];
      status.textContent = '';
      side.replaceChildren(h('div', { class: 'cdone-card bd-done' },
        h('div', { class: 'cdone-stars', 'aria-hidden': 'true' }, '★ ★ ★'),
        h('h2', null, '¡Felicidades, terminaste!'),
        h('p', null, `Tu ${f.es} quedó ${preciosoEs(f)}.`),
        h('button', { class: 'bigbtn', onClick: () => play(next) }, `Siguiente: ${next.es} →`),
        f.dots ? h('button', { class: 'bigbtn violet', onClick: () => { ctx.state.pickFor = 'dots'; ctx.startGame(f.dots!); } }, 'Ahora únelo con puntos') : null,
        h('button', { class: 'bigbtn alt small', onClick: picker }, 'Elegir otra')));
      pop(660, 0.12);
      setTimeout(() => pop(880, 0.12), 140);
      setTimeout(() => pop(1100, 0.25), 280);
      ctx.sayPair(`¡Felicidades, terminaste! Ahora puedes construir ${unEs(next)}.`, `Congratulations, you finished! Now you can build a ${next.en}.`);
    }

    ctx.sayPair(age === '3-4' ? `Vamos a construir ${unEs(f)}. Pon cada figura en su lugar.` : `Construye ${unEs(f)}: pon cada pieza en su lugar.`, `Let's build a ${f.en}. Put each shape in its place.`);
    cleanup = () => ghost.remove();
  }

  picker();
  return {
    el,
    back: () => (el.querySelector('.bd-grid') ? false : (picker(), true)),
    destroy: () => cleanup?.(),
    onHelp: () => ctx.sayPair('Arrastra cada figura a su lugar, o tócala y luego toca su lugar. Cuando termines, toca un color y luego una pieza para pintarla.', 'Drag each shape to its place. Then pick a color and touch a piece to paint it.'),
  };
}
