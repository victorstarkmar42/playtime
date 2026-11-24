import { charOf } from '../../content/characters';
import { addToAlbum } from '../../core/album';
import { pop } from '../../core/audio';
import type { Pt } from '../../core/geometry';
import { pickText } from '../../core/lang';
import { recordWord } from '../../core/progress';
import { settings } from '../../core/settings';
import { drawCharacter, H, pathOf, useBoardTransform, W } from '../../render/character';
import { fitBoard } from '../../render/fit';
import { INK } from '../../render/primitives';
import { COLORS } from '../../content/words';
import { floodRegion } from '../../core/flood';
import type { Ctx, Screen } from '../context';
import { canvas, h, ICONS } from '../dom';

const STAMPS: [string, string][] = [['estrella', 'star'], ['corazón', 'heart'], ['flor', 'flower']];
const SIZES = [12, 24, 44];
type Tool = 'crayon' | 'marker' | 'fill' | 'stamp' | 'eraser';
const TOOLS: [Tool, string, string][] = [
  ['crayon', 'Crayón', 'crayon'],
  ['marker', 'Plumón', 'marker'],
  ['fill', 'Bote', 'paint bucket'],
  ['stamp', 'Sellos', 'stamps'],
  ['eraser', 'Goma', 'eraser'],
];

/** Paint layer persists while the app is open, so leaving and coming back keeps the drawing. */
const paint = document.createElement('canvas');
paint.width = W;
paint.height = H;
let paintKey: string | null = null;

export function colorScreen(ctx: Ctx): Screen {
  const key = ctx.state.colorKey;
  const ch = charOf(key);
  const pctx = paint.getContext('2d')!;
  if (ctx.state.freshColor || paintKey !== key) {
    pctx.clearRect(0, 0, W, H);
    paintKey = key;
    ctx.state.freshColor = false;
  }
  const undo: ImageData[] = [];
  const brush = { tool: 'crayon' as Tool, color: COLORS[3].hex, size: 24 };
  let stampIdx = 0;

  const view = canvas(W, H);
  fitBoard(view, key, 4);
  view.setAttribute('aria-label', `Colorear ${ch.label}`);
  const vctx = view.getContext('2d')!;
  const info = h('span', null, 'Toca un color: se dice en español y en inglés.');
  const palm = h('span', null, settings.penOnly ? 'Sólo lápiz: el dedo no pinta' : 'Rechazo de palma: automático');

  const render = () => {
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.fillStyle = '#fff';
    vctx.fillRect(0, 0, W, H);
    vctx.drawImage(paint, 0, 0);
    useBoardTransform(vctx);
    drawCharacter(vctx, ch, 'line');
    vctx.setTransform(1, 0, 0, 1, 0, 0);
  };
  const clipShape = () => {
    useBoardTransform(pctx);
    pctx.clip(pathOf(ch));
    pctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  function seg(a: Pt, b: Pt, pressure: number | null, tilt: number): void {
    pctx.save();
    if (settings.inside && brush.tool !== 'eraser') clipShape();
    let w = brush.size * (pressure == null ? 1 : 0.35 + 1.3 * pressure);
    if (brush.tool === 'crayon') {
      w *= 1 + tilt / 45;
      pctx.fillStyle = brush.color;
      const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
      for (let s = 0; s <= steps; s++) {
        const x = a[0] + ((b[0] - a[0]) * s) / steps;
        const y = a[1] + ((b[1] - a[1]) * s) / steps;
        const grain = Math.max(2.5, w / 7);
        for (let k = 0; k < 9; k++) {
          const ang = Math.random() * Math.PI * 2;
          const rr = (Math.random() * w) / 2;
          pctx.globalAlpha = 0.35 + Math.random() * 0.4;
          pctx.fillRect(x + Math.cos(ang) * rr - grain / 2, y + Math.sin(ang) * rr - grain / 2, grain, grain);
        }
      }
    } else {
      pctx.lineCap = 'round';
      pctx.lineJoin = 'round';
      pctx.lineWidth = brush.tool === 'eraser' ? w * 1.6 : w;
      if (brush.tool === 'eraser') pctx.globalCompositeOperation = 'destination-out';
      else {
        pctx.globalAlpha = 0.92;
        pctx.strokeStyle = brush.color;
      }
      pctx.beginPath();
      pctx.moveTo(...a);
      pctx.lineTo(...b);
      pctx.stroke();
    }
    pctx.restore();
  }

  function stamp(type: number, x: number, y: number, s: number): void {
    const c = pctx;
    c.save();
    c.translate(x, y);
    c.fillStyle = brush.color;
    c.strokeStyle = INK;
    c.lineWidth = 5;
    c.lineJoin = 'round';
    c.beginPath();
    if (type === 0) {
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.42 : s;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      c.closePath();
      c.fill();
      c.stroke();
    } else if (type === 1) {
      c.moveTo(0, s * 0.9);
      c.bezierCurveTo(-s * 1.3, 0, -s * 0.7, -s, 0, -s * 0.35);
      c.bezierCurveTo(s * 0.7, -s, s * 1.3, 0, 0, s * 0.9);
      c.fill();
      c.stroke();
    } else {
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
        c.beginPath();
        c.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.42, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      }
      c.beginPath();
      c.arc(0, 0, s * 0.35, 0, Math.PI * 2);
      c.fillStyle = '#FFD54A';
      c.fill();
      c.stroke();
    }
    c.restore();
  }

  const pushUndo = () => {
    try {
      undo.push(pctx.getImageData(0, 0, W, H));
      if (undo.length > 10) undo.shift();
    } catch {
      /* memory pressure: skip undo */
    }
  };
  // Paint bucket: fills only the area enclosed by the drawing's lines (hair, skirt, a boot…).
  let walls: Uint8Array | null = null;
  const bucket = (p: Pt): boolean => {
    if (!walls) {
      const art = canvas(W, H).getContext('2d', { willReadFrequently: true })!;
      useBoardTransform(art);
      drawCharacter(art, ch, 'line');
      const px = art.getImageData(0, 0, W, H).data;
      walls = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) {
        const o = i * 4;
        walls[i] = px[o + 3] > 100 && px[o] + px[o + 1] + px[o + 2] < 480 ? 1 : 0;
      }
    }
    const region = floodRegion(walls, W, H, p[0], p[1]);
    const n = parseInt(brush.color.slice(1), 16);
    const img = new ImageData(W, H);
    let any = false;
    for (let i = 0; i < region.length; i++) {
      if (!region[i]) continue;
      any = true;
      img.data.set([n >> 16, (n >> 8) & 255, n & 255, 255], i * 4);
    }
    if (!any) return false;
    const tmp = canvas(W, H);
    tmp.getContext('2d')!.putImageData(img, 0, 0);
    pctx.save();
    if (settings.inside) clipShape();
    pctx.drawImage(tmp, 0, 0);
    pctx.restore();
    return true;
  };

  const toPt = (e: PointerEvent): Pt => {
    const r = view.getBoundingClientRect();
    return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height];
  };
  const describe = (e: PointerEvent) =>
    e.pointerType === 'pen'
      ? `Lápiz · presión ${e.pressure.toFixed(2)} · inclinación ${Math.round(Math.hypot(e.tiltX || 0, e.tiltY || 0))}°`
      : e.pointerType === 'touch'
        ? 'Dedo · grosor fijo'
        : 'Mouse · grosor fijo';

  // Palm rejection: while a pen is near (hovering or drawing) finger contacts are ignored.
  let penSeen = 0;
  let activeId: number | null = null;
  let last: Pt | null = null;
  view.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'pen') penSeen = performance.now();
  }, { capture: true });
  view.addEventListener('pointerdown', (e) => {
    const now = performance.now();
    if (e.pointerType === 'pen') penSeen = now;
    if (settings.penOnly && e.pointerType !== 'pen') return ctx.toast('Sólo lápiz está activo');
    if (e.pointerType === 'touch' && now - penSeen < 800) {
      palm.textContent = 'Palma ignorada ✓';
      return;
    }
    if (activeId !== null) return;
    const p = toPt(e);
    pushUndo();
    if (brush.tool === 'fill') {
      if (bucket(p)) {
        render();
        pop(520);
      } else undo.pop();
      return;
    }
    if (brush.tool === 'stamp') {
      const [es, en] = STAMPS[stampIdx];
      stamp(stampIdx, p[0], p[1], brush.size * 1.8 + 20);
      render();
      pop(660, 0.12);
      ctx.sayPair(es, en);
      recordWord(en);
      stampIdx = (stampIdx + 1) % STAMPS.length;
      return;
    }
    activeId = e.pointerId;
    view.setPointerCapture(e.pointerId);
    last = p;
    seg(p, p, e.pointerType === 'pen' ? e.pressure : null, 0);
    render();
    info.textContent = describe(e);
  });
  view.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeId || !last) return;
    const evs = e.getCoalescedEvents?.() ?? [];
    for (const ev of evs.length ? evs : [e]) {
      const p = toPt(ev);
      const tilt = ev.pointerType === 'pen' ? Math.hypot(ev.tiltX || 0, ev.tiltY || 0) : 0;
      seg(last, p, ev.pointerType === 'pen' ? ev.pressure : null, tilt);
      last = p;
    }
    render();
    info.textContent = describe(e);
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId === activeId) {
      activeId = null;
      last = null;
    }
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);

  // ---- tools ----
  const swatches = h('div', { class: 'kcard swatches', role: 'group', 'aria-label': 'Colores' });
  for (const col of COLORS) {
    const b = h('button', {
      class: 'swatch',
      style: `background:${col.hex}`,
      'aria-label': `${col.es} / ${col.en}`,
      'aria-pressed': String(col.hex === brush.color),
      onClick: () => {
        brush.color = col.hex;
        if (brush.tool === 'eraser') setTool('crayon');
        swatches.querySelectorAll('.swatch').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        ctx.sayPair(col.es, col.en);
        recordWord(col.en);
        const t = pickText(settings.lang, col.es, col.en);
        info.textContent = t.sub ? `${t.main} · ${t.sub}` : t.main;
      },
    });
    swatches.append(b);
  }
  const toolBtns = TOOLS.map(([t, es, en]) =>
    h('button', {
      class: 'ibtn wide',
      'aria-pressed': String(t === brush.tool),
      onClick: () => {
        setTool(t);
        ctx.sayPair(es, en);
        if (t === 'stamp') info.textContent = 'Toca el dibujo para poner un sello: estrella, corazón, flor.';
      },
    }, es),
  );
  function setTool(t: Tool): void {
    brush.tool = t;
    toolBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(TOOLS[i][0] === t)));
  }
  const sizeBtns = SIZES.map((s, i) =>
    h('button', {
      class: 'size',
      'aria-label': ['Fino', 'Medio', 'Grueso'][i],
      'aria-pressed': String(s === brush.size),
      onClick: () => {
        brush.size = s;
        sizeBtns.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
      },
    }, h('i', { style: `width:${6 + i * 7}px;height:${6 + i * 7}px` })),
  );
  const btnUndo = h('button', {
    class: 'ibtn',
    'aria-label': 'Deshacer',
    title: 'Deshacer',
    html: ICONS.undo,
    onClick: () => {
      const d = undo.pop();
      if (d) {
        pctx.putImageData(d, 0, 0);
        render();
      }
    },
  });
  const btnSave = h('button', {
    class: 'bigbtn',
    onClick: () => {
      void addToAlbum(key, 'colored', view);
      ctx.toast('Tu dibujo está guardado · Saved');
      ctx.sayPair('Tu dibujo está guardado', 'Your drawing is saved');
      pop(760, 0.3);
    },
  }, 'Guardar');

  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'main' },
      h('div', { class: 'stagebox' }, h('div', { class: 'stage' }, view)),
      h('div', { class: 'tools' },
        swatches,
        h('div', { class: 'kcard' }, ...toolBtns),
        h('div', { class: 'kcard' }, ...sizeBtns, btnUndo, btnSave),
        h('div', { class: 'kcard inputinfo' }, info, h('br'), palm),
      ),
    ),
  );
  render();
  return { el };
}
