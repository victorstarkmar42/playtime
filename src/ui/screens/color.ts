import { CHARACTER_ORDER, charOf } from '../../content/characters';
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
import { colorableMask, floodRegion, inkWalls } from '../../core/flood';
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
  /** A picture from "Mis dibujos" instead of one of the app's drawings. */
  const pic = ctx.state.colorPic;
  const label = pic ? pic.name : ch.label;
  const docKey = pic ? `pic:${pic.id}` : key;
  const pctx = paint.getContext('2d')!;
  if (ctx.state.freshColor || paintKey !== docKey) {
    pctx.clearRect(0, 0, W, H);
    paintKey = docKey;
    ctx.state.freshColor = false;
  }
  const undo: ImageData[] = [];
  const brush = { tool: 'crayon' as Tool, color: COLORS[3].hex, size: 24 };
  let stampIdx = 0;

  const view = canvas(W, H);
  if (!pic) fitBoard(view, key, 4);
  view.setAttribute('aria-label', `Colorear ${label}`);
  const vctx = view.getContext('2d')!;
  const info = h('span', null, 'Toca un color: se dice en español y en inglés.');
  const palm = h('span', null, settings.penOnly ? 'Sólo lápiz: el dedo no pinta' : 'Rechazo de palma: automático');

  // The drawing's lines, prepared once:
  // - ink: only the dark lines (white fills such as eyes or a penguin's belly become transparent,
  //   so they never hide the colour painted under them);
  // - walls: line pixels, for the paint bucket;
  // - mask: where colour may go with "colorear dentro": the outline plus every area closed by
  //   lines, even outside the outline (a robot's arms, a car's wheels and windows).
  const art = canvas(W, H).getContext('2d', { willReadFrequently: true })!;
  if (pic) art.drawImage(pic.ink, 0, 0);
  else {
    useBoardTransform(art);
    drawCharacter(art, ch, 'line');
    art.setTransform(1, 0, 0, 1, 0, 0);
  }
  const artPx = art.getImageData(0, 0, W, H);
  const walls = inkWalls(artPx.data, W * H);
  const ink = pic ? pic.ink : canvas(W, H);
  if (!pic) {
    const d = artPx.data;
    const out = new ImageData(W, H);
    const n = parseInt(INK.slice(1), 16);
    for (let i = 0; i < W * H; i++) {
      const o = i * 4;
      const sum = d[o] + d[o + 1] + d[o + 2];
      const dark = Math.max(0, Math.min(1, (660 - sum) / 460));
      if (!d[o + 3] || !dark) continue;
      out.data[o] = n >> 16;
      out.data[o + 1] = (n >> 8) & 255;
      out.data[o + 2] = n & 255;
      out.data[o + 3] = Math.round(d[o + 3] * dark);
    }
    ink.getContext('2d')!.putImageData(out, 0, 0);
  }
  const mask = canvas(W, H);
  if (!pic) {
    const m = mask.getContext('2d', { willReadFrequently: true })!;
    useBoardTransform(m);
    m.fillStyle = '#000';
    m.fill(pathOf(ch));
    m.setTransform(1, 0, 0, 1, 0, 0);
    const shape = m.getImageData(0, 0, W, H);
    const inside = colorableMask(walls, W, H);
    for (let i = 0; i < W * H; i++) if (inside[i]) shape.data[i * 4 + 3] = 255;
    m.putImageData(shape, 0, 0);
  }

  const render = () => {
    vctx.setTransform(1, 0, 0, 1, 0, 0);
    vctx.fillStyle = '#fff';
    vctx.fillRect(0, 0, W, H);
    vctx.drawImage(paint, 0, 0);
    vctx.drawImage(ink, 0, 0);
  };
  /** "Colorear dentro": drop any colour that fell outside the drawing. */
  const keepInside = () => {
    // Photos have no outline: open areas (the sky around a house) must stay paintable.
    if (!settings.inside || pic) return;
    pctx.save();
    pctx.globalCompositeOperation = 'destination-in';
    pctx.drawImage(mask, 0, 0);
    pctx.restore();
  };

  // ---- "¡Terminaste!" ----
  // Colourable pixels (inside the mask, not on a line), sampled on a grid to keep it quick.
  const STEP = 4;
  const targets: number[] = [];
  if (pic) {
    // Closed areas of the picture; if it has almost none, the whole square the stage shows.
    const inside = colorableMask(walls, W, H);
    for (let y = 0; y < H; y += STEP) for (let x = 150; x < 1050; x += STEP) {
      const i = y * W + x;
      if (inside[i] && !walls[i]) targets.push(i);
    }
    if (targets.length < 400) {
      targets.length = 0;
      for (let y = 0; y < H; y += STEP) for (let x = 150; x < 1050; x += STEP) if (!walls[y * W + x]) targets.push(y * W + x);
    }
  } else {
    const md = mask.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y += STEP) for (let x = 0; x < W; x += STEP) {
      const i = y * W + x;
      if (md[i * 4 + 3] > 128 && !walls[i]) targets.push(i);
    }
  }
  const coverage = (): number => {
    if (!targets.length) return 0;
    const d = pctx.getImageData(0, 0, W, H).data;
    let n = 0;
    for (const i of targets) if (d[i * 4 + 3] > 40) n++;
    return n / targets.length;
  };
  const nextKey = CHARACTER_ORDER[(CHARACTER_ORDER.indexOf(key) + 1) % CHARACTER_ORDER.length];
  let celebrated = coverage() >= 0.9; // coming back to a finished picture does not celebrate again
  const doneBox = h('div', { class: 'cdone', hidden: true, role: 'dialog', 'aria-label': 'Terminaste' },
    h('div', { class: 'cdone-card' },
      h('div', { class: 'cdone-stars', 'aria-hidden': 'true' }, '★ ★ ★'),
      h('h2', null, '¡Felicidades, terminaste!'),
      h('p', null, `${label} quedó precioso. Ya está en tu álbum.`),
      pic
        ? h('button', { class: 'bigbtn', onClick: () => ((ctx.state.pickFor = 'color'), ctx.show('pick')) }, 'Elegir otro dibujo')
        : h('button', { class: 'bigbtn', onClick: () => {
          ctx.state.colorKey = nextKey;
          ctx.state.freshColor = true;
          ctx.show('color');
        } }, `Siguiente dibujo: ${charOf(nextKey).label} →`),
      h('div', { class: 'kbtnrow' },
        h('button', { class: 'bigbtn alt small', onClick: () => ((ctx.state.pickFor = 'color'), ctx.show('pick')) }, 'Elegir otro'),
        h('button', { class: 'bigbtn alt small', onClick: () => (doneBox.hidden = true) }, 'Seguir coloreando')),
    ));
  const celebrate = () => {
    celebrated = true;
    void addToAlbum(pic ? 'pic' : key, 'colored', view, pic?.name);
    doneBox.hidden = false;
    pop(660, 0.12);
    setTimeout(() => pop(880, 0.12), 140);
    setTimeout(() => pop(1100, 0.25), 280);
    if (pic) ctx.sayPair('¡Felicidades, terminaste!', 'Congratulations, you finished!');
    else ctx.sayPair(`¡Felicidades, terminaste! Ahora puedes colorear ${charOf(nextKey).label}.`, 'Congratulations, you finished! Try the next drawing.');
  };
  /** After each stroke or fill: celebrate once when almost everything has colour. */
  const checkDone = () => {
    if (!celebrated && coverage() >= 0.9) celebrate();
  };

  function seg(a: Pt, b: Pt, pressure: number | null, tilt: number): void {
    pctx.save();
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
  const bucket = (p: Pt): boolean => {
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
    pctx.drawImage(tmp, 0, 0);
    keepInside();
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
  /** When the last stroke, fill or stamp started, to take it back if it was really the start of a pinch. */
  let downAt = 0;
  let undoAtDown = 0;
  let pinching = false;
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
    if (activeId !== null || pinching) return;
    const p = toPt(e);
    downAt = now;
    undoAtDown = undo.length;
    pushUndo();
    if (brush.tool === 'fill') {
      if (bucket(p)) {
        render();
        pop(520);
        checkDone();
      } else undo.pop();
      return;
    }
    if (brush.tool === 'stamp') {
      const [es, en] = STAMPS[stampIdx];
      stamp(stampIdx, p[0], p[1], brush.size * 1.8 + 20);
      keepInside();
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
    keepInside();
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
    keepInside();
    render();
    info.textContent = describe(e);
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId === activeId) {
      activeId = null;
      last = null;
      checkDone();
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
      void addToAlbum(pic ? 'pic' : key, 'colored', view, pic?.name);
      ctx.toast('Tu dibujo está guardado · Saved');
      ctx.sayPair('Tu dibujo está guardado', 'Your drawing is saved');
      pop(760, 0.3);
    },
  }, 'Guardar');
  const btnDone = h('button', { class: 'bigbtn violet', onClick: celebrate }, '¡Terminé!');

  // ---- zoom: two fingers (or the mouse wheel) zoom up to 4× and move the drawing ----
  const zoomer = h('div', { class: 'zoomer' }, view);
  const z = { s: 1, x: 0, y: 0 };
  const zoomChip = h('span', { class: 'zoomchip' });
  const btnFit = h('button', { class: 'zoomfit', onClick: () => setZoom(1, 0, 0) }, 'Ver todo');
  const zoomBar = h('div', { class: 'zoombar', hidden: true }, zoomChip, btnFit);
  const mini = canvas(132, 132, 'minimap');
  mini.hidden = true;
  mini.setAttribute('aria-hidden', 'true');
  const coarse = matchMedia?.('(pointer: coarse)').matches;
  const hint = h('div', { class: 'zoomhint', hidden: !coarse }, 'Dos dedos: acercar y mover');
  if (coarse) setTimeout(() => (hint.hidden = true), 3500);
  const stageEl = h('div', { class: 'stage' }, zoomer, zoomBar, mini, hint, doneBox);

  function drawMini(): void {
    if (z.s <= 1.01) return;
    const r = stageEl.getBoundingClientRect();
    const v = view.getBoundingClientRect();
    const m = mini.getContext('2d')!;
    // the board's place in the stage without the zoom
    const vl = (v.left - r.left - z.x) / z.s, vt = (v.top - r.top - z.y) / z.s;
    const vw = v.width / z.s || 1, vh = v.height / z.s || 1;
    const sx = (-vl / vw) * W, sy = (-vt / vh) * H;
    const sw = (r.width / vw) * W, sh = (r.height / vh) * H;
    m.fillStyle = '#fff';
    m.fillRect(0, 0, mini.width, mini.height);
    m.drawImage(view, sx, sy, sw, sh, 0, 0, mini.width, mini.height);
    const k = mini.width / r.width;
    m.strokeStyle = '#F2672E';
    m.lineWidth = 4;
    m.strokeRect((-z.x / z.s) * k + 2, (-z.y / z.s) * k + 2, (r.width / z.s) * k - 4, (r.height / z.s) * k - 4);
  }
  function setZoom(s: number, x: number, y: number): void {
    const r = stageEl.getBoundingClientRect();
    z.s = Math.max(1, Math.min(4, s));
    z.x = Math.min(0, Math.max(r.width * (1 - z.s), x));
    z.y = Math.min(0, Math.max(r.height * (1 - z.s), y));
    zoomer.style.transform = z.s > 1.01 ? `translate(${z.x}px, ${z.y}px) scale(${z.s})` : '';
    const on = z.s > 1.01;
    zoomBar.hidden = !on;
    mini.hidden = !on;
    zoomChip.textContent = `${Math.round(z.s * 10) / 10}×`.replace('.', ',');
    drawMini();
  }
  /** Zoom to `s` keeping the point under (cx, cy) in place. */
  function zoomAt(cx: number, cy: number, s: number, from = z): void {
    const r = stageEl.getBoundingClientRect();
    const px = cx - r.left, py = cy - r.top;
    const ns = Math.max(1, Math.min(4, s));
    setZoom(ns, px - (ns * (px - from.x)) / from.s, py - (ns * (py - from.y)) / from.s);
  }
  const touches = new Map<number, [number, number]>();
  let pinch: { d: number; cx: number; cy: number; z: typeof z } | null = null;
  const spread = () => {
    const [a, b] = [...touches.values()];
    return { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 };
  };
  zoomer.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (touches.size < 2) return;
    e.stopPropagation();
    if (touches.size > 2 || pinching) return;
    // The first finger already drew (or filled): that was the start of a pinch, take it back.
    if (performance.now() - downAt < 450 && undo.length > undoAtDown) {
      const d = undo.pop();
      if (d) pctx.putImageData(d, 0, 0);
    }
    activeId = null;
    last = null;
    pinching = true;
    hint.hidden = true;
    render();
    pinch = { ...spread(), z: { ...z } };
  }, { capture: true });
  zoomer.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (!pinching || !pinch || touches.size < 2) return;
    e.stopPropagation();
    const now = spread();
    const s = pinch.z.s * (now.d / pinch.d);
    // keep the content under the starting middle point under the fingers' middle point
    const r = stageEl.getBoundingClientRect();
    const cx = (pinch.cx - r.left - pinch.z.x) / pinch.z.s, cy = (pinch.cy - r.top - pinch.z.y) / pinch.z.s;
    const ns = Math.max(1, Math.min(4, s));
    setZoom(ns, now.cx - r.left - ns * cx, now.cy - r.top - ns * cy);
  }, { capture: true });
  const lift = (e: PointerEvent) => {
    if (!touches.delete(e.pointerId)) return;
    if (touches.size < 2) pinch = null;
    if (!touches.size && pinching) {
      pinching = false;
      drawMini();
    }
  };
  zoomer.addEventListener('pointerup', lift, { capture: true });
  zoomer.addEventListener('pointercancel', lift, { capture: true });
  zoomer.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, z.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { passive: false });
  const afterStroke = () => drawMini();
  view.addEventListener('pointerup', afterStroke);

  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'main' },
      h('div', { class: 'stagebox' }, stageEl),
      h('div', { class: 'tools' },
        swatches,
        h('div', { class: 'kcard' }, ...toolBtns),
        h('div', { class: 'kcard' }, ...sizeBtns, btnUndo, btnSave, btnDone),
        h('div', { class: 'kcard inputinfo' }, info, h('br'), palm),
      ),
    ),
  );
  render();
  return {
    el,
    // Back first zooms out, then leaves.
    back: () => {
      if (z.s <= 1.01) return false;
      setZoom(1, 0, 0);
      return true;
    },
  };
}
