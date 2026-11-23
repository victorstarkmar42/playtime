import { arcPts, densePolar, dist, joinPath, perimeter, sampleByLength, sampleOutline, tri, type PolarShape, type Pt } from '../core/geometry';
import type { CharKey } from '../core/types';
import { circ, INK, line, poly, star } from '../render/primitives';
import type { Character } from './characters';

type C = CanvasRenderingContext2D;

/**
 * Dots that always land on the drawing's corners (`keys`, vertices of `outline` in order).
 * With fewer dots than corners, the least important corners (closest to the line joining their
 * neighbours) are dropped; with more, the extra dots are spread by length between corners.
 */
export function keyDots(outline: Pt[], keys: Pt[], n: number): Pt[] {
  const cum: number[] = [0];
  for (let i = 1; i < outline.length; i++) cum.push(cum[i - 1] + dist(outline[i - 1], outline[i]));
  const L = perimeter(outline);
  const posOf = (k: Pt) => {
    let best = 0;
    outline.forEach((p, i) => {
      if (dist(p, k) < dist(outline[best], k)) best = i;
    });
    return cum[best];
  };
  const at = (s: number): Pt => {
    s = ((s % L) + L) % L;
    let i = 0;
    while (i < outline.length - 1 && cum[i + 1] < s) i++;
    const a = outline[i], b = outline[(i + 1) % outline.length];
    const len = dist(a, b) || 1;
    const t = Math.min(1, (s - cum[i]) / len);
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  };
  let ks = keys.map((k) => ({ k, s: posOf(k) }));
  if (n < 3) return sampleByLength(outline, n);
  while (ks.length > n) {
    let worst = 1, wd = Infinity;
    for (let i = 1; i < ks.length; i++) {
      const a = ks[i - 1].k, p = ks[i].k, b = ks[(i + 1) % ks.length].k;
      const len = dist(a, b) || 1;
      const d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / len;
      if (d < wd) [wd, worst] = [d, i];
    }
    ks = ks.filter((_, i) => i !== worst);
  }
  const gaps = ks.map((k, i) => {
    const g = (((ks[(i + 1) % ks.length].s - k.s) % L) + L) % L;
    return g || L;
  });
  const extra = n - ks.length;
  const share = gaps.map((g) => (g / L) * extra);
  const cnt = share.map(Math.floor);
  const order = share.map((s, i) => [s - Math.floor(s), i]).sort((a, b) => b[0] - a[0]);
  const left = extra - cnt.reduce((a, b) => a + b, 0);
  for (let j = 0; j < left; j++) cnt[order[j][1]]++;
  const out: Pt[] = [];
  ks.forEach((k, i) => {
    out.push(k.k);
    for (let j = 1; j <= cnt[i]; j++) out.push(at(k.s + (gaps[i] * j) / (cnt[i] + 1)));
  });
  return out;
}

function keyChar(outline: Pt[], keys: Pt[], center: Pt) {
  return { outline, dots: (n: number) => keyDots(outline, keys, n), center };
}
function polarChar(shape: PolarShape) {
  return { outline: densePolar(shape), dots: (n: number) => sampleOutline(shape, n), center: [shape.cx, shape.cy] as Pt };
}

const fillIf = (c: C, lineOnly: boolean, color: string, draw: () => void) => {
  if (lineOnly) return;
  c.beginPath();
  draw();
  c.fillStyle = color;
  c.fill();
};
const rect = (c: C, x0: number, y0: number, x1: number, y1: number, fill: string | null, lw = 0.6) =>
  poly(c, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, lw);
/** Window with a cross (four panes). */
const windowX = (c: C, x0: number, y0: number, x1: number, y1: number, lineOnly: boolean) => {
  rect(c, x0, y0, x1, y1, lineOnly ? null : '#CDEBFF');
  line(c, [[(x0 + x1) / 2, y0], [(x0 + x1) / 2, y1]], 0.5);
  line(c, [[x0, (y0 + y1) / 2], [x1, (y0 + y1) / 2]], 0.5);
};
const wheels = (c: C, xs: number[], y: number, lineOnly: boolean) => {
  for (const wx of xs) {
    circ(c, wx, y, 8.5, lineOnly ? null : '#3A3F55', INK, 0.7);
    circ(c, wx, y, 3.5, lineOnly ? null : '#C9D3E3', INK, 0.5);
  }
};

/* ---------------- Casa ---------------- */
// Roof slopes from the apex (50,16) to the eaves at x 10 / 90 (y 50); chimney on the right slope.
const casaKeys: Pt[] = [[50, 16], [63, 27.05], [63, 12], [77, 12], [77, 38.95], [90, 50], [82, 50], [82, 88], [18, 88], [18, 50], [10, 50]];

/* ---------------- Granero ---------------- */
const graneroKeys: Pt[] = [[50, 14], [74, 28], [84, 48], [84, 88], [16, 88], [16, 48], [26, 28]];

/* ---------------- Vehículos (las ruedas tapan los arcos de abajo) ---------------- */
const wheelArc = (x: number, y: number) => arcPts(x, y, 10, 0, -180);
const carrerasOutline = joinPath(
  [[8, 46], [20, 46], [20, 56], [36, 55], [42, 45], [54, 45], [60, 55], [88, 60], [92, 65], [92, 72], [86, 72]],
  wheelArc(76, 72),
  [[36, 72]],
  wheelArc(26, 72),
  [[8, 72]],
);
const carrerasKeys: Pt[] = [[8, 46], [20, 46], [20, 56], [42, 45], [54, 45], [60, 55], [92, 65], [92, 72], [76, 62], [66, 72], [36, 72], [26, 62], [8, 72]];

const camionetaOutline = joinPath(
  [[8, 50], [50, 50], [52, 34], [68, 34], [78, 48], [90, 52], [92, 58], [92, 72], [86, 72]],
  wheelArc(76, 72),
  [[36, 72]],
  wheelArc(26, 72),
  [[8, 72]],
);
const camionetaKeys: Pt[] = [[8, 50], [50, 50], [52, 34], [68, 34], [78, 48], [90, 52], [92, 72], [76, 62], [66, 72], [36, 72], [26, 62], [8, 72]];

const autobusOutline = joinPath(
  [[14, 26], [86, 26], [91, 32], [91, 74], [84, 74]],
  wheelArc(74, 74),
  [[36, 74]],
  wheelArc(26, 74),
  [[10, 74], [10, 30]],
);
const autobusKeys: Pt[] = [[14, 26], [86, 26], [91, 32], [91, 74], [74, 64], [64, 74], [36, 74], [26, 64], [10, 74], [10, 30]];

/* ---------------- Estrella (5 puntas, centro 50,54) ---------------- */
const estrellaKeys: Pt[] = Array.from({ length: 10 }, (_, i) => {
  const a = ((-90 + 36 * i) * Math.PI) / 180, r = i % 2 ? 19 : 44;
  return [50 + r * Math.cos(a), 54 + r * Math.sin(a)] as Pt;
});

/* ---------------- Mandalas (centro 50,50) ---------------- */
const P = (r: number, deg: number): Pt => [50 + r * Math.cos((deg * Math.PI) / 180), 50 - r * Math.sin((deg * Math.PI) / 180)];
/** Petal from radius r0 to r1 along angle `a`, `w` = half width. */
function petal(c: C, a: number, r0: number, r1: number, w: number, fill: string | null, lw = 0.5): void {
  const [x0, y0] = P(r0, a), [x1, y1] = P(r1, a);
  const [mx, my] = P((r0 + r1) / 2, a);
  const px = Math.sin((a * Math.PI) / 180) * w, py = Math.cos((a * Math.PI) / 180) * w;
  c.beginPath();
  c.moveTo(x0, y0);
  c.quadraticCurveTo(mx + 2 * px, my + 2 * py, x1, y1);
  c.quadraticCurveTo(mx - 2 * px, my - 2 * py, x0, y0);
  c.closePath();
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  c.lineWidth = lw;
  c.strokeStyle = INK;
  c.stroke();
}
const ring = (c: C, r: number, fill: string | null, lw = 0.55) => circ(c, 50, 50, r, fill, INK, lw);
const polyline = (c: C, pts: Pt[], fill: string | null) => poly(c, pts, fill, 0.55);

const florShape: PolarShape = { cx: 50, cy: 50, start: 90, rf: (a) => 31 + 9 * Math.abs(Math.cos((6 * a * Math.PI) / 180)) };
const copoShape: PolarShape = { cx: 50, cy: 50, start: 90, rf: (a) => 25 + 15 * Math.pow(tri((a - 90) / 60 + 0.5), 1.8) };
const solShape: PolarShape = { cx: 50, cy: 50, start: 90, rf: (a) => 30 + 10 * tri((a - 90) / 30 + 0.5) };

function mandala(key: CharKey, label: string, shape: PolarShape, color: string, counts: Character['counts'], vocab: Character['vocab'], details: Character['details']): Character {
  return { key, label, group: 'Mandalas', color, ...polarChar(shape), counts, vocab, details };
}

export const EXTRA_CHARACTERS = {
  casa: {
    key: 'casa',
    label: 'Casa',
    group: 'Casas',
    color: '#FFD9A0',
    ...keyChar(casaKeys, casaKeys, [50, 60]),
    counts: { '3-4': 8, '5-6': 16, '7-9': 26 },
    vocab: {
      es: 'casa', en: 'house',
      titleEs: '¡Es una casa!', titleEn: "It's a house!",
      sentenceEs: 'En la casa vive una familia feliz.', sentenceEn: 'A happy family lives in the house.',
      extra: [['techo', 'roof'], ['puerta', 'door'], ['ventana', 'window']],
      talk: [
        { q: '¿De qué color es la puerta de tu casa?', word: 'door' },
        { q: 'Cuenten las ventanas de la casa.', word: 'windows' },
        { q: '¿Quién vive en tu casa?', word: 'family' },
      ],
    },
    details(c, lineOnly) {
      fillIf(c, lineOnly, '#B5654A', () => c.rect(63, 12, 14, 27));
      fillIf(c, lineOnly, '#E8505B', () => {
        c.moveTo(10, 50);
        c.lineTo(50, 16);
        c.lineTo(90, 50);
        c.closePath();
      });
      line(c, [[63, 27.05], [77, 38.95]], 0.5); // chimney meets the roof
      line(c, [[18, 50], [82, 50]], 0.6);
      line(c, [[63, 16], [77, 16]], 0.5);
      circ(c, 50, 37, 5.5, lineOnly ? null : '#CDEBFF', INK, 0.6);
      line(c, [[44.5, 37], [55.5, 37]], 0.5);
      windowX(c, 24, 56, 37, 69, lineOnly);
      windowX(c, 63, 56, 76, 69, lineOnly);
      rect(c, 43, 64, 57, 88, lineOnly ? null : '#6E56CF');
      c.beginPath();
      c.arc(50, 64, 7, Math.PI, 0);
      if (!lineOnly) {
        c.fillStyle = '#6E56CF';
        c.fill();
      }
      c.lineWidth = 0.6;
      c.strokeStyle = INK;
      c.stroke();
      circ(c, 54.5, 77, 1, lineOnly ? null : '#F2B91C', INK, 0.4);
      // smoke and a small garden
      for (const [x, y, r] of [[72, 7, 2.6], [78, 4, 3]]) circ(c, x, y, r, lineOnly ? null : '#E6ECF5', INK, 0.5);
      for (const fx of [24, 32, 68, 76]) {
        line(c, [[fx, 88], [fx, 82]], 0.5);
        circ(c, fx, 80.5, 2, lineOnly ? null : fx < 50 ? '#FF5C8F' : '#F2B91C', INK, 0.5);
      }
      line(c, [[6, 88], [94, 88]], 0.6);
    },
  },
  granero: {
    key: 'granero',
    label: 'Granero',
    group: 'Casas',
    color: '#D9534F',
    ...keyChar(graneroKeys, graneroKeys, [50, 60]),
    counts: { '3-4': 7, '5-6': 14, '7-9': 24 },
    vocab: {
      es: 'granja', en: 'farm',
      titleEs: '¡Es el granero de la granja!', titleEn: "It's the farm's barn!",
      sentenceEs: 'En el granero duermen las vacas.', sentenceEn: 'The cows sleep in the barn.',
      extra: [['vaca', 'cow'], ['caballo', 'horse'], ['paja', 'hay']],
      talk: [
        { q: '¿Qué animales viven en una granja?', word: 'cow, horse' },
        { q: 'Hagan el sonido de una vaca.', word: 'moo' },
        { q: '¿De qué color es el granero?', word: 'red' },
      ],
    },
    details(c, lineOnly) {
      fillIf(c, lineOnly, '#7A8599', () => {
        c.moveTo(16, 48);
        c.lineTo(26, 28);
        c.lineTo(50, 14);
        c.lineTo(74, 28);
        c.lineTo(84, 48);
        c.closePath();
      });
      line(c, [[16, 48], [84, 48]], 0.6);
      line(c, [[26, 28], [74, 28]], 0.4);
      // hayloft window
      rect(c, 43, 27, 57, 40, lineOnly ? null : '#FFF3D6');
      line(c, [[43, 27], [57, 40]], 0.45);
      line(c, [[57, 27], [43, 40]], 0.45);
      // big doors with crosses
      rect(c, 34, 58, 66, 88, lineOnly ? null : '#FFF3D6');
      line(c, [[50, 58], [50, 88]], 0.55);
      for (const [x0, x1] of [[34, 50], [50, 66]]) {
        line(c, [[x0, 58], [x1, 88]], 0.45);
        line(c, [[x1, 58], [x0, 88]], 0.45);
      }
      windowX(c, 21, 56, 29, 64, lineOnly);
      windowX(c, 71, 56, 79, 64, lineOnly);
      // hay bale and a weathervane
      rect(c, 70, 78, 82, 88, lineOnly ? null : '#F2D06B', 0.5);
      line(c, [[70, 83], [82, 83]], 0.4);
      line(c, [[50, 14], [50, 6]], 0.5);
      poly(c, [[50, 6], [57, 8], [50, 10]], lineOnly ? null : '#F2B91C', 0.5);
      line(c, [[6, 88], [94, 88]], 0.6);
    },
  },
  estrella: {
    key: 'estrella',
    label: 'Estrella',
    group: 'Objetos',
    color: '#FFD54A',
    ...keyChar(estrellaKeys, estrellaKeys, [50, 54]),
    counts: { '3-4': 10, '5-6': 20, '7-9': 30 },
    vocab: {
      es: 'estrella', en: 'star',
      titleEs: '¡Es una estrella brillante!', titleEn: "It's a shiny star!",
      sentenceEs: 'La estrella brilla en el cielo de noche.', sentenceEn: 'The star shines in the night sky.',
      extra: [['brillar', 'shine'], ['noche', 'night'], ['cinco', 'five']],
      talk: [
        { q: 'Cuenten las puntas de la estrella.', word: 'five' },
        { q: '¿Cuándo vemos estrellas en el cielo?', word: 'night' },
        { q: 'Canten "Estrellita, ¿dónde estás?".', word: 'twinkle' },
      ],
    },
    details(c, lineOnly) {
      // ten facets from the centre: light and dark yellow so the star looks puffy
      for (let i = 0; i < 10; i++) {
        const a = estrellaKeys[i], b = estrellaKeys[(i + 1) % 10];
        if (!lineOnly) {
          c.beginPath();
          c.moveTo(50, 54);
          c.lineTo(a[0], a[1]);
          c.lineTo(b[0], b[1]);
          c.closePath();
          c.fillStyle = i % 2 ? '#F2B91C' : '#FFE07A';
          c.fill();
        }
        line(c, [[50, 54], a], 0.45);
      }
      // friendly face on a round cheek patch
      circ(c, 50, 58, 10, lineOnly ? null : '#FFF3C4', INK, 0.5);
      circ(c, 46, 56, 1.8, INK);
      circ(c, 54, 56, 1.8, INK);
      circ(c, 46.6, 55.4, 0.6, '#fff');
      circ(c, 54.6, 55.4, 0.6, '#fff');
      if (!lineOnly) {
        circ(c, 43, 60, 1.6, '#FF9DB0');
        circ(c, 57, 60, 1.6, '#FF9DB0');
      }
      c.beginPath();
      c.arc(50, 59.5, 3.2, 0.15 * Math.PI, 0.85 * Math.PI);
      c.lineWidth = 0.6;
      c.strokeStyle = INK;
      c.stroke();
      // little sparkles around
      star(c, 14, 20, 4, lineOnly ? null : '#7FD3FF');
      star(c, 87, 22, 3, lineOnly ? null : '#FF8AB8');
      star(c, 12, 84, 3, lineOnly ? null : '#B39DFF');
      star(c, 88, 86, 4, lineOnly ? null : '#5DBB63');
    },
  },
  carreras: {
    key: 'carreras',
    label: 'Auto de carreras',
    group: 'Vehículos',
    color: '#FF8A3D',
    ...keyChar(carrerasOutline, carrerasKeys, [50, 58]),
    counts: { '3-4': 10, '5-6': 18, '7-9': 28 },
    vocab: {
      es: 'auto de carreras', en: 'race car',
      titleEs: '¡Es un auto de carreras!', titleEn: "It's a race car!",
      sentenceEs: 'El auto de carreras va muy rápido.', sentenceEn: 'The race car goes very fast.',
      extra: [['rápido', 'fast'], ['lento', 'slow'], ['casco', 'helmet']],
      talk: [
        { q: 'Corran rápido y luego lento.', word: 'fast, slow' },
        { q: '¿Qué se pone el piloto en la cabeza?', word: 'helmet' },
        { q: '¿Qué número le pondrías a tu auto?', word: 'number' },
      ],
    },
    details(c, lineOnly) {
      circ(c, 48, 50, 4.6, lineOnly ? null : '#FFD54A', INK, 0.6);
      poly(c, [[48, 47.5], [52.4, 48.6], [52, 51.5], [48, 51.5]], lineOnly ? null : '#7FD3FF', 0.5);
      line(c, [[8, 51], [20, 51]], 0.5);
      line(c, [[14, 51], [14, 56]], 0.5);
      line(c, [[62, 59], [90, 64]], 0.5);
      line(c, [[62, 62], [80, 65.5]], 0.5);
      circ(c, 50, 63.5, 4.5, lineOnly ? null : '#fff', INK, 0.6);
      star(c, 50, 63.8, 3, lineOnly ? null : '#E8505B');
      circ(c, 89.5, 67, 1.6, lineOnly ? null : '#FFE38A', INK, 0.5);
      wheels(c, [26, 76], 72, lineOnly);
      // speed lines
      line(c, [[0, 58], [5, 58]], 0.6);
      line(c, [[0, 64], [4, 64]], 0.6);
    },
  },
  camioneta: {
    key: 'camioneta',
    label: 'Camioneta',
    group: 'Vehículos',
    color: '#5DBB63',
    ...keyChar(camionetaOutline, camionetaKeys, [50, 58]),
    counts: { '3-4': 10, '5-6': 18, '7-9': 28 },
    vocab: {
      es: 'camioneta', en: 'truck',
      titleEs: '¡Es una camioneta!', titleEn: "It's a truck!",
      sentenceEs: 'La camioneta lleva cajas atrás.', sentenceEn: 'The truck carries boxes in the back.',
      extra: [['caja', 'box'], ['grande', 'big'], ['llevar', 'carry']],
      talk: [
        { q: '¿Qué llevarías atrás en la camioneta?', word: 'box' },
        { q: '¿Es grande o pequeña?', word: 'big' },
        { q: 'Hagan el sonido del motor.', word: 'vroom' },
      ],
    },
    details(c, lineOnly) {
      poly(c, [[55, 38], [66.5, 38], [73.5, 48], [55, 48]], lineOnly ? null : '#CDEBFF');
      line(c, [[52, 50], [52, 70]], 0.55);
      line(c, [[56, 54], [60, 54]], 0.9);
      line(c, [[8, 55], [50, 55]], 0.5);
      // boxes in the back
      rect(c, 14, 40, 26, 50, lineOnly ? null : '#E0A458', 0.5);
      rect(c, 28, 43, 38, 50, lineOnly ? null : '#E0A458', 0.5);
      line(c, [[20, 40], [20, 50]], 0.4);
      circ(c, 89.5, 56, 1.8, lineOnly ? null : '#FFE38A', INK, 0.5);
      rect(c, 8.5, 57, 11, 61, lineOnly ? null : '#FF5C5C', 0.5);
      wheels(c, [26, 76], 72, lineOnly);
    },
  },
  autobus: {
    key: 'autobus',
    label: 'Autobús',
    group: 'Vehículos',
    color: '#FFC83D',
    ...keyChar(autobusOutline, autobusKeys, [50, 50]),
    counts: { '3-4': 10, '5-6': 18, '7-9': 28 },
    vocab: {
      es: 'autobús', en: 'bus',
      titleEs: '¡Es un autobús!', titleEn: "It's a bus!",
      sentenceEs: 'El autobús lleva a los niños a la escuela.', sentenceEn: 'The bus takes the children to school.',
      extra: [['escuela', 'school'], ['amigos', 'friends'], ['parada', 'stop']],
      talk: [
        { q: '¿Cuántos amigos caben en el autobús?', word: 'friends' },
        { q: '¿Cómo vas a la escuela?', word: 'school' },
        { q: 'Canten "las ruedas del autobús".', word: 'wheels' },
      ],
    },
    details(c, lineOnly) {
      for (const x of [15, 30, 45]) rect(c, x, 33, x + 12, 46, lineOnly ? null : '#CDEBFF');
      rect(c, 64, 32, 80, 70, lineOnly ? null : '#FFE59A');
      line(c, [[72, 32], [72, 70]], 0.5);
      rect(c, 66, 35, 70.5, 48, lineOnly ? null : '#CDEBFF', 0.5);
      rect(c, 73.5, 35, 78, 48, lineOnly ? null : '#CDEBFF', 0.5);
      poly(c, [[83, 33], [89, 33], [89, 48], [83, 48]], lineOnly ? null : '#CDEBFF');
      line(c, [[10, 55], [64, 55]], 0.6);
      line(c, [[10, 59], [64, 59]], 0.6);
      circ(c, 88, 64, 2, lineOnly ? null : '#FFE38A', INK, 0.5);
      // round faces in the windows
      for (const x of [21, 36, 51]) {
        circ(c, x, 42, 3, lineOnly ? null : '#F7D1B0', INK, 0.45);
        c.beginPath();
        c.arc(x, 42.5, 1.5, 0.15 * Math.PI, 0.85 * Math.PI);
        c.lineWidth = 0.4;
        c.strokeStyle = INK;
        c.stroke();
      }
      wheels(c, [26, 74], 74, lineOnly);
    },
  },
  mandalaFlor: mandala('mandalaFlor', 'Mandala flor', florShape, '#FF8AB8', { '3-4': 12, '5-6': 24, '7-9': 36 }, {
    es: 'flor', en: 'flower',
    titleEs: '¡Es un mandala de flor!', titleEn: "It's a flower mandala!",
    sentenceEs: 'El mandala tiene pétalos en círculo.', sentenceEn: 'The mandala has petals in a circle.',
    extra: [['pétalo', 'petal'], ['círculo', 'circle'], ['colores', 'colors']],
    talk: [
      { q: 'Cuenten los pétalos de afuera.', word: 'twelve' },
      { q: 'Pinten todos los pétalos de un mismo color.', word: 'same color' },
      { q: 'Respiren despacio mientras pintan.', word: 'breathe' },
    ],
  }, (c, lineOnly) => {
    for (let k = 0; k < 12; k++) circ(c, ...P(35, 90 + 30 * k), 1.8, lineOnly ? null : '#fff', INK, 0.45);
    ring(c, 29, lineOnly ? null : '#FFD54A');
    for (let k = 0; k < 12; k++) petal(c, 105 + 30 * k, 14, 28.5, 3.4, lineOnly ? null : '#7FD3FF');
    for (let k = 0; k < 12; k++) circ(c, ...P(24, 90 + 30 * k), 1.3, lineOnly ? null : '#FF5C8F', INK, 0.4);
    ring(c, 14, lineOnly ? null : '#B39DFF');
    for (let k = 0; k < 6; k++) petal(c, 90 + 60 * k, 4, 13.5, 3, lineOnly ? null : '#5DBB63');
    ring(c, 4, lineOnly ? null : '#F2B91C');
  }),
  mandalaCopo: mandala('mandalaCopo', 'Mandala copo de nieve', copoShape, '#7FD3FF', { '3-4': 12, '5-6': 18, '7-9': 30 }, {
    es: 'copo de nieve', en: 'snowflake',
    titleEs: '¡Es un copo de nieve!', titleEn: "It's a snowflake!",
    sentenceEs: 'Cada copo de nieve tiene seis puntas.', sentenceEn: 'Every snowflake has six points.',
    extra: [['nieve', 'snow'], ['frío', 'cold'], ['seis', 'six']],
    talk: [
      { q: 'Cuenten las puntas del copo.', word: 'six' },
      { q: '¿Qué ropa usas cuando hace frío?', word: 'cold' },
      { q: 'Busquen formas que se repiten.', word: 'pattern' },
    ],
  }, (c, lineOnly) => {
    for (let k = 0; k < 6; k++) {
      const a = 90 + 60 * k;
      polyline(c, [P(24, a), P(31, a - 5), P(36, a), P(31, a + 5)], lineOnly ? null : '#fff');
    }
    polyline(c, Array.from({ length: 6 }, (_, k) => P(24, 90 + 60 * k)), lineOnly ? null : '#B39DFF');
    polyline(c, [P(24, 90), P(24, 210), P(24, 330)], lineOnly ? null : '#E6ECF5');
    polyline(c, [P(24, 30), P(24, 150), P(24, 270)], null);
    ring(c, 11, lineOnly ? null : '#FFD54A');
    for (let k = 0; k < 6; k++) petal(c, 90 + 60 * k, 3, 10.5, 2.4, lineOnly ? null : '#FF8AB8');
    for (let k = 0; k < 6; k++) circ(c, ...P(16, 120 + 60 * k), 1.6, lineOnly ? null : '#4AA3F0', INK, 0.45);
    ring(c, 3, lineOnly ? null : '#fff');
  }),
  mandalaSol: mandala('mandalaSol', 'Mandala sol', solShape, '#FFB52E', { '3-4': 12, '5-6': 24, '7-9': 36 }, {
    es: 'sol', en: 'sun',
    titleEs: '¡Es un mandala de sol!', titleEn: "It's a sun mandala!",
    sentenceEs: 'El sol brilla y nos da calor.', sentenceEn: 'The sun shines and keeps us warm.',
    extra: [['rayo', 'ray'], ['calor', 'warm'], ['día', 'day']],
    talk: [
      { q: '¿Qué haces cuando sale el sol?', word: 'day' },
      { q: 'Cuenten los rayos del sol.', word: 'twelve' },
      { q: 'Hagan una sonrisa como el sol.', word: 'smile' },
    ],
  }, (c, lineOnly) => {
    for (let k = 0; k < 12; k++) line(c, [P(30, 90 + 30 * k), P(37, 90 + 30 * k)], 0.45);
    ring(c, 30, lineOnly ? null : '#FFE07A');
    const wave: Pt[] = Array.from({ length: 144 }, (_, i) => P(24 + 2 * Math.cos((12 * i * 2.5 * Math.PI) / 180), i * 2.5));
    polyline(c, wave, lineOnly ? null : '#FF8A3D');
    for (let k = 0; k < 12; k++) circ(c, ...P(19, 105 + 30 * k), 1.5, lineOnly ? null : '#E8505B', INK, 0.45);
    ring(c, 16, lineOnly ? null : '#FFD54A');
    // friendly face
    circ(c, 44.5, 47, 1.8, INK);
    circ(c, 55.5, 47, 1.8, INK);
    if (!lineOnly) {
      circ(c, 41, 53, 2, '#FF9DB0');
      circ(c, 59, 53, 2, '#FF9DB0');
    }
    c.beginPath();
    c.arc(50, 52, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    c.lineWidth = 0.7;
    c.strokeStyle = INK;
    c.stroke();
  }),
} satisfies Partial<Record<CharKey, Character>>;
