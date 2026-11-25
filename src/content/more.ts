import { angDist, arcPts, gauss, joinPath, type PolarShape, type Pt } from '../core/geometry';
import type { CharKey } from '../core/types';
import { circ, INK, line, poly } from '../render/primitives';
import type { Character } from './characters';
import { ellipsePts, ellipseR, eye, keyChar, polarChar, rect, smile } from './friends';

/* Más dibujos originales: animales, vehículos, naturaleza y comida. */

type C = CanvasRenderingContext2D;
const fillIf = (lineOnly: boolean, col: string) => (lineOnly ? null : col);
const ell = (c: C, x: number, y: number, rx: number, ry: number, fill: string | null, lw = 0.55) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  c.lineWidth = lw;
  c.strokeStyle = INK;
  c.stroke();
};
const curve = (c: C, pts: Pt[], lw = 0.55) => {
  c.beginPath();
  c.moveTo(...pts[0]);
  for (let i = 1; i + 1 < pts.length; i += 2) c.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.strokeStyle = INK;
  c.stroke();
};

/* ---------------- Perro (cara de frente, orejas caídas) ---------------- */
const perroShape: PolarShape = {
  cx: 50, cy: 52, start: 90,
  rf: (a) => ellipseR(a, 25, 24) + 13 * gauss(angDist(a, 158), 13) + 13 * gauss(angDist(a, 22), 13),
};

/* ---------------- Tortuga (de lado) ---------------- */
const tortugaOutline = joinPath(arcPts(46, 62, 28, 180, 360), [[80, 52], [88, 51], [92, 56], [90, 62], [80, 65], [72, 65], [72, 76], [62, 76], [62, 66], [32, 66], [32, 76], [22, 76], [22, 66], [16, 66], [9, 68], [15, 63]]);
const tortugaKeys: Pt[] = [[18, 62], [26.2, 42.2], [46, 34], [65.8, 42.2], [74, 62], [80, 52], [88, 51], [92, 56], [90, 62], [72, 76], [62, 76], [32, 76], [22, 76], [9, 68]];

/* ---------------- Mariposa ---------------- */
const mariposaShape: PolarShape = {
  cx: 50, cy: 54, start: 90,
  rf: (a) => 8 + 30 * gauss(angDist(a, 40), 22) + 30 * gauss(angDist(a, 140), 22) + 22 * gauss(angDist(a, 235), 18) + 22 * gauss(angDist(a, 305), 18),
};

/* ---------------- Búho ---------------- */
const buhoShape: PolarShape = {
  cx: 50, cy: 55, start: 90,
  rf: (a) => ellipseR(a, 25, 32) + 10 * gauss(angDist(a, 62), 7) + 10 * gauss(angDist(a, 118), 7),
};

/* ---------------- Cohete ---------------- */
const coheteOutline: Pt[] = [[50, 8], [58, 18], [62, 30], [62, 62], [72, 72], [72, 84], [62, 78], [58, 84], [42, 84], [38, 78], [28, 84], [28, 72], [38, 62], [38, 30], [42, 18]];

/* ---------------- Barco de vela ---------------- */
const barcoOutline: Pt[] = [[14, 66], [46, 66], [46, 60], [22, 60], [46, 20], [48, 10], [52, 12], [80, 60], [52, 60], [52, 66], [86, 66], [76, 82], [24, 82]];

/* ---------------- Avión (visto desde arriba) ---------------- */
const avionOutline: Pt[] = [[50, 10], [54, 16], [54, 40], [88, 54], [88, 60], [54, 54], [54, 74], [64, 82], [64, 86], [50, 83], [36, 86], [36, 82], [46, 74], [46, 54], [12, 60], [12, 54], [46, 40], [46, 16]];

/* ---------------- Árbol ---------------- */
const crown = (deg: number): Pt => {
  const t = (deg * Math.PI) / 180;
  const r = 28 + 3.2 * Math.abs(Math.sin(t * 4));
  return [50 + r * Math.cos(t), 40 + r * Math.sin(t)];
};
const crownPts = (a0: number, a1: number, step = 3): Pt[] => {
  const n = Math.ceil((a1 - a0) / step);
  return Array.from({ length: n + 1 }, (_, i) => crown(a0 + ((a1 - a0) * i) / n));
};
const arbolOutline = joinPath([[42, 90], [44, 68]], crownPts(112, 428), [[56, 68], [58, 90]]);
const arbolKeys: Pt[] = [[42, 90], [44, 68], ...[130, 175, 220, 270, 320, 365, 410].map(crown), [56, 68], [58, 90]];

/* ---------------- Hongo ---------------- */
const hongoOutline = joinPath(ellipsePts(50, 50, 36, 34, 180, 360), [[66, 56], [64, 86], [36, 86], [34, 56]]);
const hongoKeys: Pt[] = [[14, 50], [24.5, 26], [50, 16], [75.5, 26], [86, 50], [66, 56], [64, 86], [36, 86], [34, 56]];

/* ---------------- Helado ---------------- */
const heladoOutline = joinPath([[50, 92]], arcPts(50, 44, 20, 145, 395));
const heladoKeys: Pt[] = [[50, 92], [33.6, 55.5], [30, 44], [35.9, 29.9], [50, 24], [64.1, 29.9], [70, 44], [66.4, 55.5]];

/* ---------------- Pastel ---------------- */
const pastelOutline: Pt[] = [[18, 88], [82, 88], [82, 62], [72, 62], [72, 44], [53, 44], [53, 30], [47, 30], [47, 44], [28, 44], [28, 62], [18, 62]];

export const MORE_CHARACTERS = {
  perro: {
    key: 'perro',
    label: 'Perro',
    group: 'Animales',
    color: '#C99A6B',
    ...polarChar(perroShape),
    counts: { '3-4': 8, '5-6': 14, '7-9': 22 },
    vocab: {
      es: 'perro', en: 'dog',
      titleEs: '¡Es un perrito!', titleEn: "It's a puppy!",
      sentenceEs: 'El perrito mueve la cola cuando está feliz.', sentenceEn: 'The puppy wags its tail when it is happy.',
      extra: [['oreja', 'ear'], ['nariz', 'nose'], ['cola', 'tail']],
      talk: [
        { q: '¿Cómo hace un perro? Ladren juntos.', word: 'bark' },
        { q: '¿Qué necesita un perrito para estar feliz?', word: 'happy' },
        { q: 'Señala tus orejas y tu nariz.', word: 'ear, nose' },
      ],
    },
    details(c, lineOnly) {
      for (const s of [-1, 1]) {
        c.beginPath();
        c.ellipse(50 + s * 27, 50, 8, 15, s * -0.35, 0, Math.PI * 2);
        if (!lineOnly) {
          c.fillStyle = '#8A5A3B';
          c.fill();
        }
        c.lineWidth = 0.55;
        c.strokeStyle = INK;
        c.stroke();
      }
      ell(c, 59, 46, 7, 6, fillIf(lineOnly, '#F1D3A6'));
      eye(c, 41, 46, 2.6, lineOnly);
      eye(c, 59, 46, 2.6, lineOnly);
      ell(c, 50, 62, 11, 8.5, fillIf(lineOnly, '#F7E3C4'));
      ell(c, 50, 57.5, 3.8, 2.6, fillIf(lineOnly, INK));
      line(c, [[50, 60], [50, 63]], 0.55);
      curve(c, [[44, 63], [47, 66.5], [50, 63], [53, 66.5], [56, 63]]);
      ell(c, 50, 68, 2.6, 3, fillIf(lineOnly, '#FF7A9A'));
    },
  },
  tortuga: {
    key: 'tortuga',
    label: 'Tortuga',
    group: 'Animales',
    color: '#6FBF73',
    ...keyChar(tortugaOutline, tortugaKeys, [46, 54]),
    counts: { '3-4': 9, '5-6': 14, '7-9': 22 },
    vocab: {
      es: 'tortuga', en: 'turtle',
      titleEs: '¡Es una tortuga!', titleEn: "It's a turtle!",
      sentenceEs: 'La tortuga camina despacio y lleva su casa a cuestas.', sentenceEn: 'The turtle walks slowly and carries its home.',
      extra: [['concha', 'shell'], ['despacio', 'slow'], ['pata', 'leg']],
      talk: [
        { q: 'Caminen despacio como tortugas, y luego rápido como conejos.', word: 'slow, fast' },
        { q: '¿Cuántas patas tiene la tortuga?', word: 'four' },
        { q: 'Si llevaras tu casa a cuestas, ¿qué meterías?', word: 'home' },
      ],
    },
    details(c, lineOnly) {
      line(c, [[18, 62], [74, 62]], 0.6);
      const hex: Pt[] = Array.from({ length: 6 }, (_, i) => [46 + 9 * Math.cos((i * Math.PI) / 3), 48 + 8 * Math.sin((i * Math.PI) / 3)] as Pt);
      poly(c, hex, fillIf(lineOnly, '#A8DB8C'), 0.55);
      for (const [a, b] of [[hex[0], [70, 50]], [hex[3], [22, 50]], [hex[4], [38, 36]], [hex[5], [56, 35]], [hex[1], [58, 61]], [hex[2], [35, 61]]] as [Pt, Pt][]) line(c, [a, b], 0.5);
      eye(c, 85, 55.5, 1.8, lineOnly);
      smile(c, 87, 58, 2.6, INK, 0.5);
      for (const x of [27, 67]) line(c, [[x - 3, 73], [x - 3, 76]], 0.45);
    },
  },
  mariposa: {
    key: 'mariposa',
    label: 'Mariposa',
    group: 'Animales',
    color: '#FF9BC8',
    ...polarChar(mariposaShape),
    counts: { '3-4': 10, '5-6': 16, '7-9': 24 },
    vocab: {
      es: 'mariposa', en: 'butterfly',
      titleEs: '¡Es una mariposa!', titleEn: "It's a butterfly!",
      sentenceEs: 'La mariposa vuela de flor en flor.', sentenceEn: 'The butterfly flies from flower to flower.',
      extra: [['ala', 'wing'], ['volar', 'fly'], ['flor', 'flower']],
      talk: [
        { q: 'Antes de ser mariposa fue oruga. ¿Sabían eso?', word: 'caterpillar' },
        { q: 'Muevan los brazos como alas y vuelen por el cuarto.', word: 'fly' },
        { q: '¿De qué colores pintarías sus alas?', word: 'colors' },
      ],
    },
    details(c, lineOnly) {
      ell(c, 50, 55, 3.6, 17, fillIf(lineOnly, '#6E56CF'));
      circ(c, 50, 35, 4.5, fillIf(lineOnly, '#6E56CF'), INK, 0.55);
      curve(c, [[48, 31], [44, 24], [40, 21]]);
      curve(c, [[52, 31], [56, 24], [60, 21]]);
      circ(c, 40, 21, 1.6, fillIf(lineOnly, '#FFD54A'), INK, 0.45);
      circ(c, 60, 21, 1.6, fillIf(lineOnly, '#FFD54A'), INK, 0.45);
      for (const [x, y, r, col] of [[69, 38, 6, '#FFD54A'], [31, 38, 6, '#FFD54A'], [62, 70, 4.5, '#7FD0F2'], [38, 70, 4.5, '#7FD0F2'], [77, 30, 2.4, '#fff'], [23, 30, 2.4, '#fff']] as const) circ(c, x, y, r, fillIf(lineOnly, col), INK, 0.5);
      for (const s of [-1, 1]) line(c, [[50 + s * 4, 52], [50 + s * 14, 56]], 0.45);
    },
  },
  buho: {
    key: 'buho',
    label: 'Búho',
    group: 'Animales',
    color: '#B08560',
    ...polarChar(buhoShape),
    counts: { '3-4': 8, '5-6': 14, '7-9': 22 },
    vocab: {
      es: 'búho', en: 'owl',
      titleEs: '¡Es un búho!', titleEn: "It's an owl!",
      sentenceEs: 'El búho abre grandes los ojos en la noche.', sentenceEn: 'The owl opens its big eyes at night.',
      extra: [['noche', 'night'], ['pluma', 'feather'], ['árbol', 'tree']],
      talk: [
        { q: '¿Cómo hace el búho? Uuu, uuu.', word: 'owl' },
        { q: '¿Qué animales están despiertos de noche?', word: 'night' },
        { q: 'Abran los ojos muy grandes, como el búho.', word: 'eyes' },
      ],
    },
    details(c, lineOnly) {
      ell(c, 50, 66, 15, 17, fillIf(lineOnly, '#F1D9B5'));
      for (const x of [41, 59]) {
        circ(c, x, 42, 8.5, fillIf(lineOnly, '#fff'), INK, 0.6);
        circ(c, x, 42, 4, fillIf(lineOnly, '#F2B91C'), INK, 0.5);
        circ(c, x, 42, 2, fillIf(lineOnly, INK), null);
      }
      poly(c, [[47, 50], [53, 50], [50, 56]], fillIf(lineOnly, '#F2884B'), 0.55);
      for (let r = 0; r < 3; r++) for (let k = -1; k <= 1; k++) {
        const x = 50 + k * 6 + (r % 2) * 3 - 1.5, y = 60 + r * 7;
        curve(c, [[x - 2.4, y], [x, y + 2.6], [x + 2.4, y]], 0.45);
      }
      for (const s of [-1, 1]) curve(c, [[50 + s * 20, 50], [50 + s * 28, 66], [50 + s * 18, 80]]);
      for (const x of [43, 57]) for (const d of [-2, 0, 2]) line(c, [[x, 86], [x + d, 89.5]], 0.6);
    },
  },
  cohete: {
    key: 'cohete',
    label: 'Cohete',
    group: 'Vehículos',
    color: '#FF6B6B',
    ...keyChar(coheteOutline, coheteOutline, [50, 50]),
    counts: { '3-4': 8, '5-6': 14, '7-9': 22 },
    vocab: {
      es: 'cohete', en: 'rocket',
      titleEs: '¡Es un cohete!', titleEn: "It's a rocket!",
      sentenceEs: 'El cohete despega hacia las estrellas.', sentenceEn: 'The rocket blasts off to the stars.',
      extra: [['luna', 'moon'], ['estrella', 'star'], ['espacio', 'space']],
      talk: [
        { q: 'Cuenten hacia atrás: diez, nueve, ocho… ¡despegue!', word: 'ten, nine, eight' },
        { q: 'Si viajaras al espacio, ¿a dónde irías?', word: 'space' },
        { q: '¿Qué ves en el cielo de noche?', word: 'moon, stars' },
      ],
    },
    details(c, lineOnly) {
      curve(c, [[42, 18], [50, 22], [58, 18]]);
      circ(c, 50, 38, 7.5, fillIf(lineOnly, '#BFE6FF'), INK, 0.6);
      circ(c, 50, 38, 5, null, INK, 0.45);
      rect(c, 38, 52, 62, 56, fillIf(lineOnly, '#FFD54A'), 0.5);
      line(c, [[50, 62], [50, 84]], 0.5);
      poly(c, [[42, 84], [46, 92], [50, 87], [54, 92], [58, 84]], fillIf(lineOnly, '#FFB23F'), 0.55);
    },
  },
  barco: {
    key: 'barco',
    label: 'Barco',
    group: 'Vehículos',
    color: '#4AA3F0',
    ...keyChar(barcoOutline, barcoOutline, [50, 60]),
    counts: { '3-4': 8, '5-6': 13, '7-9': 20 },
    vocab: {
      es: 'barco', en: 'boat',
      titleEs: '¡Es un barco de vela!', titleEn: "It's a sailboat!",
      sentenceEs: 'El viento empuja la vela y el barco navega en el mar.', sentenceEn: 'The wind pushes the sail and the boat sails on the sea.',
      extra: [['vela', 'sail'], ['mar', 'sea'], ['viento', 'wind']],
      talk: [
        { q: 'Soplen fuerte como el viento que mueve la vela.', word: 'wind' },
        { q: '¿Qué animales viven en el mar?', word: 'sea' },
        { q: '¿Qué cosas flotan en el agua y cuáles se hunden?', word: 'float' },
      ],
    },
    details(c, lineOnly) {
      line(c, [[49, 11], [49, 66]], 0.55);
      poly(c, [[52, 12], [52, 4], [60, 7]], fillIf(lineOnly, '#FF5C8F'), 0.5);
      line(c, [[18, 72], [82, 72]], 0.45);
      for (const x of [36, 50, 64]) circ(c, x, 76.5, 2.6, fillIf(lineOnly, '#fff'), INK, 0.5);
      for (const y of [87, 92]) curve(c, [[8, y], [15, y - 3], [22, y], [29, y + 3], [36, y], [43, y - 3], [50, y], [57, y + 3], [64, y], [71, y - 3], [78, y], [85, y + 3], [92, y]], 0.5);
    },
  },
  avion: {
    key: 'avion',
    label: 'Avión',
    group: 'Vehículos',
    color: '#E9EEF6',
    ...keyChar(avionOutline, avionOutline, [50, 48]),
    counts: { '3-4': 9, '5-6': 16, '7-9': 24 },
    vocab: {
      es: 'avión', en: 'airplane',
      titleEs: '¡Es un avión!', titleEn: "It's an airplane!",
      sentenceEs: 'El avión vuela alto, por encima de las nubes.', sentenceEn: 'The airplane flies high above the clouds.',
      extra: [['nube', 'cloud'], ['ala', 'wing'], ['piloto', 'pilot']],
      talk: [
        { q: 'Abran los brazos como alas y vuelen.', word: 'fly' },
        { q: 'Si pudieras viajar en avión, ¿a qué país irías?', word: 'country' },
        { q: '¿Qué hay arriba de las nubes?', word: 'cloud' },
      ],
    },
    details(c, lineOnly) {
      ell(c, 50, 20, 2.6, 4, fillIf(lineOnly, '#7FD0F2'));
      for (const y of [30, 36, 42, 48, 54, 60]) circ(c, 50, y, 1.3, fillIf(lineOnly, '#7FD0F2'), INK, 0.4);
      for (const x of [30, 70]) rect(c, x - 2.5, 50, x + 2.5, 58, fillIf(lineOnly, '#A9B7CC'), 0.5);
      line(c, [[54, 47], [86, 57]], 0.4);
      line(c, [[46, 47], [14, 57]], 0.4);
      for (const x of [14, 86]) circ(c, x, 57, 1.4, fillIf(lineOnly, x < 50 ? '#FF5C5C' : '#5DBB63'), INK, 0.4);
    },
  },
  arbol: {
    key: 'arbol',
    label: 'Árbol',
    group: 'Naturaleza',
    color: '#5DBB63',
    ...keyChar(arbolOutline, arbolKeys, [50, 45]),
    counts: { '3-4': 8, '5-6': 14, '7-9': 22 },
    vocab: {
      es: 'árbol', en: 'tree',
      titleEs: '¡Es un árbol con manzanas!', titleEn: "It's an apple tree!",
      sentenceEs: 'El árbol nos da sombra, aire limpio y frutas.', sentenceEn: 'The tree gives us shade, clean air and fruit.',
      extra: [['manzana', 'apple'], ['hoja', 'leaf'], ['tronco', 'trunk']],
      talk: [
        { q: 'Cuenten las manzanas del árbol.', word: 'apple' },
        { q: '¿Quién vive en los árboles?', word: 'bird' },
        { q: 'Párate como un árbol y mueve los brazos con el viento.', word: 'tree' },
      ],
    },
    details(c, lineOnly) {
      for (const [x, y] of [[38, 34], [60, 28], [58, 50], [36, 54], [48, 42], [68, 42]] as const) {
        circ(c, x, y, 3, fillIf(lineOnly, '#FF5C5C'), INK, 0.5);
        line(c, [[x, y - 3], [x + 1, y - 5]], 0.45);
      }
      curve(c, [[46, 74], [48, 78], [47, 84]], 0.45);
      curve(c, [[54, 72], [52, 78], [54, 86]], 0.45);
      line(c, [[30, 90], [70, 90]], 0.5);
    },
  },
  hongo: {
    key: 'hongo',
    label: 'Hongo',
    group: 'Naturaleza',
    color: '#FF6B6B',
    ...keyChar(hongoOutline, hongoKeys, [50, 50]),
    counts: { '3-4': 8, '5-6': 12, '7-9': 18 },
    vocab: {
      es: 'hongo', en: 'mushroom',
      titleEs: '¡Es un hongo sonriente!', titleEn: "It's a smiling mushroom!",
      sentenceEs: 'Los hongos crecen en el bosque cuando llueve.', sentenceEn: 'Mushrooms grow in the forest when it rains.',
      extra: [['bosque', 'forest'], ['lluvia', 'rain'], ['puntos', 'dots']],
      talk: [
        { q: 'Cuenten los puntos del sombrero del hongo.', word: 'dots' },
        { q: 'Los hongos del bosque no se comen sin un adulto. ¿Por qué?', word: 'safe' },
        { q: '¿Qué más hay en un bosque?', word: 'forest' },
      ],
    },
    details(c, lineOnly) {
      curve(c, [[14, 50], [50, 62], [86, 50]], 0.6);
      for (const [x, y, r] of [[34, 32, 5], [58, 27, 6], [50, 44, 4], [73, 41, 3.6], [25, 44, 3]] as const) circ(c, x, y, r, fillIf(lineOnly, '#fff'), INK, 0.5);
      eye(c, 44, 69, 2.2, lineOnly);
      eye(c, 56, 69, 2.2, lineOnly);
      smile(c, 50, 72, 3.4);
      line(c, [[24, 87], [76, 87]], 0.5);
    },
  },
  helado: {
    key: 'helado',
    label: 'Helado',
    group: 'Comida',
    color: '#FFB3C7',
    ...keyChar(heladoOutline, heladoKeys, [50, 50]),
    counts: { '3-4': 7, '5-6': 12, '7-9': 18 },
    vocab: {
      es: 'helado', en: 'ice cream',
      titleEs: '¡Es un helado!', titleEn: "It's an ice cream!",
      sentenceEs: 'El helado está frío y dulce.', sentenceEn: 'The ice cream is cold and sweet.',
      extra: [['frío', 'cold'], ['dulce', 'sweet'], ['cereza', 'cherry']],
      talk: [
        { q: '¿De qué sabor te gusta el helado?', word: 'flavor' },
        { q: '¿Qué cosas son frías y cuáles calientes?', word: 'cold, hot' },
        { q: 'Inventen un sabor de helado nuevo.', word: 'ice cream' },
      ],
    },
    details(c, lineOnly) {
      poly(c, [[34, 56], [66, 56], [50, 92]], fillIf(lineOnly, '#E9B872'), 0.6);
      for (const k of [0, 1, 2]) {
        line(c, [[38 + k * 8, 56], [48 + k * 4, 82 - k * 2]], 0.4);
        line(c, [[62 - k * 8, 56], [52 - k * 4, 82 - k * 2]], 0.4);
      }
      c.beginPath();
      c.moveTo(33.6, 55.5);
      for (let i = 0; i <= 8; i++) {
        const x = 33.6 + (32.8 * i) / 8;
        c.quadraticCurveTo(x - 2, 60 + (i % 2) * 3, x, 56);
      }
      if (!lineOnly) {
        c.fillStyle = '#FFB3C7';
        c.fill();
      }
      c.lineWidth = 0.55;
      c.strokeStyle = INK;
      c.stroke();
      for (const [x, y, a] of [[40, 38, 0.6], [56, 34, -0.4], [48, 46, 1.2], [62, 44, 0.2], [44, 30, -1]] as const) {
        line(c, [[x, y], [x + 3 * Math.cos(a), y + 3 * Math.sin(a)]], 0.8, lineOnly ? INK : '#6E56CF');
      }
      line(c, [[50, 20], [54, 13]], 0.55);
      circ(c, 50, 22, 4, fillIf(lineOnly, '#E53935'), INK, 0.55);
    },
  },
  pastel: {
    key: 'pastel',
    label: 'Pastel',
    group: 'Comida',
    color: '#FFD1E0',
    ...keyChar(pastelOutline, pastelOutline, [50, 66]),
    counts: { '3-4': 8, '5-6': 12, '7-9': 18 },
    vocab: {
      es: 'pastel', en: 'cake',
      titleEs: '¡Es un pastel de cumpleaños!', titleEn: "It's a birthday cake!",
      sentenceEs: 'Soplamos la vela y pedimos un deseo.', sentenceEn: 'We blow out the candle and make a wish.',
      extra: [['vela', 'candle'], ['cumpleaños', 'birthday'], ['deseo', 'wish']],
      talk: [
        { q: '¿Cuántos años tienes? Cuenta las velas que tendría tu pastel.', word: 'birthday' },
        { q: 'Canten juntos "Feliz cumpleaños" en español y en inglés.', word: 'happy birthday' },
        { q: '¿Qué deseo pedirías?', word: 'wish' },
      ],
    },
    details(c, lineOnly) {
      c.beginPath();
      c.moveTo(47, 26);
      c.quadraticCurveTo(45, 22, 50, 15);
      c.quadraticCurveTo(55, 22, 53, 26);
      c.quadraticCurveTo(50, 29, 47, 26);
      if (!lineOnly) {
        c.fillStyle = '#FFB23F';
        c.fill();
      }
      c.lineWidth = 0.55;
      c.strokeStyle = INK;
      c.stroke();
      line(c, [[47, 36], [53, 34]], 0.45);
      for (const [x0, x1, y] of [[28, 72, 48], [18, 82, 66]] as const) {
        const n = Math.round((x1 - x0) / 6);
        const pts: Pt[] = [[x0, y]];
        for (let i = 1; i <= n; i++) pts.push([x0 + ((x1 - x0) * (i - 0.5)) / n, y + 4], [x0 + ((x1 - x0) * i) / n, y]);
        curve(c, pts, 0.55);
      }
      for (const x of [34, 42, 50, 58, 66]) circ(c, x, 56, 1.5, fillIf(lineOnly, '#FF5C8F'), INK, 0.4);
      for (const x of [26, 38, 50, 62, 74]) circ(c, x, 78, 2, fillIf(lineOnly, '#7FD0F2'), INK, 0.4);
      line(c, [[12, 90], [88, 90]], 0.6);
    },
  },
} satisfies Partial<Record<CharKey, Character>>;
