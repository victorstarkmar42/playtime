import { angDist, arcPts, densePolar, gauss, joinPath, sampleOutline, type PolarShape, type Pt } from '../core/geometry';
import type { CharKey } from '../core/types';
import { circ, INK, line, poly } from '../render/primitives';
import type { Character } from './characters';
import { keyDots } from './extra';

/* Robots and animals, all original designs. */

type C = CanvasRenderingContext2D;

export const keyChar = (outline: Pt[], keys: Pt[], center: Pt) => ({ outline, dots: (n: number) => keyDots(outline, keys, n), center });
export const polarChar = (shape: PolarShape) => ({ outline: densePolar(shape), dots: (n: number) => sampleOutline(shape, n), center: [shape.cx, shape.cy] as Pt });
export const rect = (c: C, x0: number, y0: number, x1: number, y1: number, fill: string | null, lw = 0.6) => poly(c, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]], fill, lw);
export const smile = (c: C, x: number, y: number, r: number, color = INK, lw = 0.6) => {
  c.beginPath();
  c.arc(x, y, r, 0.15 * Math.PI, 0.85 * Math.PI);
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.strokeStyle = color;
  c.stroke();
};
export const eye = (c: C, x: number, y: number, r: number, lineOnly: boolean) => {
  circ(c, x, y, r, lineOnly ? '#fff' : INK, INK, 0.5);
  circ(c, x + r * 0.35, y - r * 0.35, r * 0.35, '#fff');
};
export const ellipsePts = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, step = 4): Pt[] => {
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)] as const;
  });
};
export const ellipseR = (a: number, rx: number, ry: number) => {
  const t = (a * Math.PI) / 180;
  return 1 / Math.sqrt((Math.cos(t) / rx) ** 2 + (Math.sin(t) / ry) ** 2);
};

/* ---------------- Robi: robot de cabeza cuadrada ---------------- */
const robiOutline: Pt[] = [
  [30, 20], [70, 20], [70, 28], [74, 28], [74, 36], [70, 36], [70, 44], [55, 44], [55, 48], [72, 48], [72, 52], [82, 52], [86, 56], [86, 68], [80, 68], [80, 58], [72, 58],
  [72, 76], [66, 76], [66, 86], [68, 90], [54, 90], [56, 86], [56, 76], [44, 76], [44, 86], [46, 90], [32, 90], [34, 86], [34, 76], [28, 76],
  [28, 58], [20, 58], [20, 68], [14, 68], [14, 56], [18, 52], [28, 52], [28, 48], [45, 48], [45, 44], [30, 44], [30, 36], [26, 36], [26, 28], [30, 28],
];
const robiKeys: Pt[] = [[30, 20], [70, 20], [74, 28], [74, 36], [72, 48], [86, 56], [86, 68], [80, 68], [72, 76], [68, 90], [54, 90], [46, 90], [32, 90], [28, 76], [20, 68], [14, 68], [14, 56], [28, 48], [26, 36], [26, 28]];

/* ---------------- Chispa: robot de cúpula con ruedas ---------------- */
const chispaOutline = joinPath(arcPts(50, 40, 22, 180, 360), [[72, 78], [68, 78]], arcPts(62, 78, 6, 0, 180), [[44, 78]], arcPts(38, 78, 6, 0, 180), [[28, 78]]);
const chispaKeys: Pt[] = [[28, 40], [34.4, 24.4], [50, 18], [65.6, 24.4], [72, 40], [72, 78], [62, 84], [56, 78], [44, 78], [38, 84], [28, 78]];

/* ---------------- Rana (de frente, sentada) ---------------- */
const ranaShape: PolarShape = {
  cx: 50, cy: 58, start: 90,
  rf: (a) => ellipseR(a, 34, 26) + 12 * gauss(angDist(a, 62), 14) + 12 * gauss(angDist(a, 118), 14) + 7 * gauss(angDist(a, 235), 9) + 7 * gauss(angDist(a, 305), 9),
};

/* ---------------- Pingüino ---------------- */
const pinguinoShape: PolarShape = {
  cx: 50, cy: 54, start: 90,
  rf: (a) => ellipseR(a, 23, 35) + 11 * gauss(angDist(a, 200), 11) + 11 * gauss(angDist(a, 340), 11) + 3 * gauss(angDist(a, 258), 7) + 3 * gauss(angDist(a, 282), 7),
};

/* ---------------- Pez ---------------- */
const pezOutline = joinPath(ellipsePts(44, 50, 30, 20, -25, -335, 4), [[90, 70], [86, 50], [90, 30]]);
const pezKeys: Pt[] = [[71.2, 41.5], [44, 30], [14, 50], [44, 70], [71.2, 58.5], [90, 70], [86, 50], [90, 30]];

export const FRIEND_CHARACTERS = {
  robi: {
    key: 'robi',
    label: 'Robi',
    group: 'Robots',
    color: '#A9C6EA',
    ...keyChar(robiOutline, robiKeys, [50, 52]),
    counts: { '3-4': 10, '5-6': 18, '7-9': 28 },
    vocab: {
      es: 'robot', en: 'robot',
      titleEs: '¡Es Robi, el robot!', titleEn: "It's Robi the robot!",
      sentenceEs: 'Robi tiene un corazón y le gusta ayudar.', sentenceEn: 'Robi has a heart and likes to help.',
      extra: [['antena', 'antenna'], ['botón', 'button'], ['ayudar', 'help']],
      talk: [
        { q: 'Si tuvieras un robot, ¿qué le pedirías que hiciera?', word: 'help' },
        { q: 'Caminen como robots.', word: 'walk' },
        { q: 'Cuenten los botones y las luces de Robi.', word: 'button' },
      ],
    },
    details(c, lineOnly) {
      line(c, [[50, 20], [50, 12]], 0.7);
      circ(c, 50, 10, 3, lineOnly ? null : '#FF5C8F', INK, 0.6);
      rect(c, 34, 24, 66, 40, lineOnly ? null : '#E9F7FF');
      eye(c, 43, 31, 3, lineOnly);
      eye(c, 57, 31, 3, lineOnly);
      smile(c, 50, 33.5, 4);
      circ(c, 37.5, 37, 1.4, lineOnly ? null : '#FFB3C7', null);
      circ(c, 62.5, 37, 1.4, lineOnly ? null : '#FFB3C7', null);
      circ(c, 28, 32, 1.4, lineOnly ? null : '#FFD54A', INK, 0.45);
      circ(c, 72, 32, 1.4, lineOnly ? null : '#FFD54A', INK, 0.45);
      rect(c, 38, 53, 62, 70, lineOnly ? null : '#FFE59A');
      // heart on the chest
      c.beginPath();
      c.moveTo(50, 67);
      c.bezierCurveTo(41, 61, 43, 55, 47, 55.5);
      c.bezierCurveTo(48.6, 55.7, 49.6, 57, 50, 58);
      c.bezierCurveTo(50.4, 57, 51.4, 55.7, 53, 55.5);
      c.bezierCurveTo(57, 55, 59, 61, 50, 67);
      if (!lineOnly) {
        c.fillStyle = '#FF5C8F';
        c.fill();
      }
      c.lineWidth = 0.5;
      c.strokeStyle = INK;
      c.stroke();
      for (const [x, col] of [[33, '#5DBB63'], [67, '#4AA3F0']] as const) circ(c, x, 72, 1.6, lineOnly ? null : col, INK, 0.45);
      line(c, [[28, 52], [28, 58]], 0.6);
      line(c, [[72, 52], [72, 58]], 0.6);
      for (const [x0, x1] of [[34, 44], [56, 66]]) {
        rect(c, x0, 76, x1, 86, lineOnly ? null : '#7E9CC8');
        line(c, [[x0, 80], [x1, 80]], 0.45);
      }
      for (const [x0, x1] of [[14, 20], [80, 86]]) rect(c, x0, 64, x1, 68, lineOnly ? null : '#7E9CC8', 0.5);
      line(c, [[45, 46], [55, 46]], 0.45);
    },
  },
  chispa: {
    key: 'chispa',
    label: 'Chispa',
    group: 'Robots',
    color: '#7FD0F2',
    ...keyChar(chispaOutline, chispaKeys, [50, 52]),
    counts: { '3-4': 9, '5-6': 16, '7-9': 26 },
    vocab: {
      es: 'robot', en: 'robot',
      titleEs: '¡Es Chispa, la robot con ruedas!', titleEn: "It's Chispa, the robot on wheels!",
      sentenceEs: 'Chispa rueda muy rápido y brilla en la noche.', sentenceEn: 'Chispa rolls very fast and glows at night.',
      extra: [['rueda', 'wheel'], ['luz', 'light'], ['rápido', 'fast']],
      talk: [
        { q: '¿Qué cosas tienen ruedas en tu casa?', word: 'wheel' },
        { q: 'Inventen un nombre para el amigo de Chispa.', word: 'friend' },
        { q: '¿Rápido o despacio? Muévanse como Chispa.', word: 'fast, slow' },
      ],
    },
    details(c, lineOnly) {
      line(c, [[50, 18], [50, 11]], 0.7);
      poly(c, [[50, 4], [52.6, 8.2], [50.6, 8.2], [52, 12], [47.6, 7], [49.6, 7]], lineOnly ? null : '#FFD54A', 0.45);
      c.beginPath();
      c.roundRect(33, 28, 34, 18, 6);
      if (!lineOnly) {
        c.fillStyle = '#22304F';
        c.fill();
      }
      c.lineWidth = 0.6;
      c.strokeStyle = INK;
      c.stroke();
      for (const x of [43, 57]) {
        circ(c, x, 36, 3.6, lineOnly ? null : '#7FF0FF', INK, 0.5);
        circ(c, x + 1.2, 34.8, 1, '#fff');
      }
      smile(c, 50, 38.5, 3.2, lineOnly ? INK : '#7FF0FF', 0.6);
      line(c, [[28, 50], [72, 50]], 0.6);
      circ(c, 50, 63, 7, lineOnly ? null : '#FFD54A', INK, 0.6);
      line(c, [[50, 63], [54, 59]], 0.6);
      circ(c, 36, 57, 2, lineOnly ? null : '#FF5C8F', INK, 0.45);
      circ(c, 36, 65, 2, lineOnly ? null : '#5DBB63', INK, 0.45);
      for (const y of [56, 60, 64, 68]) line(c, [[61, y], [67, y]], 0.45);
      // arms with round hands
      line(c, [[28, 56], [20, 61], [18, 68]], 1.8);
      line(c, [[72, 56], [80, 61], [82, 68]], 1.8);
      line(c, [[28, 56], [20, 61], [18, 68]], 0.9, lineOnly ? '#fff' : '#7FD0F2');
      line(c, [[72, 56], [80, 61], [82, 68]], 0.9, lineOnly ? '#fff' : '#7FD0F2');
      circ(c, 18, 70.5, 2.6, lineOnly ? null : '#FFD54A', INK, 0.5);
      circ(c, 82, 70.5, 2.6, lineOnly ? null : '#FFD54A', INK, 0.5);
      for (const x of [38, 62]) {
        circ(c, x, 78, 6, lineOnly ? null : '#3A3F55', INK, 0.6);
        circ(c, x, 78, 2.2, lineOnly ? null : '#C9D3E3', INK, 0.45);
      }
    },
  },
  rana: {
    key: 'rana',
    label: 'Rana',
    group: 'Animales',
    color: '#7BD36A',
    ...polarChar(ranaShape),
    counts: { '3-4': 8, '5-6': 14, '7-9': 22 },
    vocab: {
      es: 'rana', en: 'frog',
      titleEs: '¡Es una rana!', titleEn: "It's a frog!",
      sentenceEs: 'La rana salta en el estanque.', sentenceEn: 'The frog jumps in the pond.',
      extra: [['saltar', 'jump'], ['agua', 'water'], ['verde', 'green']],
      talk: [
        { q: '¿Cómo hace la rana? Salten como ranas.', word: 'jump' },
        { q: '¿Dónde vive la rana?', word: 'pond' },
        { q: 'Busquen cosas verdes a su alrededor.', word: 'green' },
      ],
    },
    details(c, lineOnly) {
      for (const x of [35.5, 64.5]) {
        circ(c, x, 31, 8, lineOnly ? null : '#fff', INK, 0.6);
        eye(c, x + 1, 31.5, 4, lineOnly);
      }
      smile(c, 50, 44, 13, INK, 0.7);
      circ(c, 32, 52, 2.6, lineOnly ? null : '#FFB3C7', null);
      circ(c, 68, 52, 2.6, lineOnly ? null : '#FFB3C7', null);
      c.beginPath();
      c.ellipse(50, 70, 16, 11, 0, 0, Math.PI * 2);
      if (!lineOnly) {
        c.fillStyle = '#C9F2A6';
        c.fill();
      }
      c.lineWidth = 0.6;
      c.strokeStyle = INK;
      c.stroke();
      for (const s of [-1, 1]) {
        const x = 50 + s * 19;
        for (const d of [-3.5, 0, 3.5]) line(c, [[x, 79], [x + d * 1.2, 84.5]], 0.55);
      }
      circ(c, 41, 64, 1.2, lineOnly ? null : '#5DAE55', null);
      circ(c, 58, 67, 1.5, lineOnly ? null : '#5DAE55', null);
    },
  },
  pinguino: {
    key: 'pinguino',
    label: 'Pingüino',
    group: 'Animales',
    color: '#3B4A6B',
    ...polarChar(pinguinoShape),
    counts: { '3-4': 8, '5-6': 14, '7-9': 22 },
    vocab: {
      es: 'pingüino', en: 'penguin',
      titleEs: '¡Es un pingüino!', titleEn: "It's a penguin!",
      sentenceEs: 'El pingüino nada en el agua fría.', sentenceEn: 'The penguin swims in cold water.',
      extra: [['hielo', 'ice'], ['nadar', 'swim'], ['frío', 'cold']],
      talk: [
        { q: 'Caminen como pingüinos, con pasitos cortos.', word: 'walk' },
        { q: '¿El pingüino vive donde hace frío o calor?', word: 'cold' },
        { q: '¿Qué come el pingüino?', word: 'fish' },
      ],
    },
    details(c, lineOnly) {
      c.beginPath();
      c.ellipse(50, 63, 15, 23, 0, 0, Math.PI * 2);
      c.fillStyle = '#fff';
      c.fill();
      c.lineWidth = 0.6;
      c.strokeStyle = INK;
      c.stroke();
      for (const x of [44, 56]) circ(c, x, 37, 7.5, '#fff', INK, 0.55);
      c.fillStyle = '#fff';
      c.fillRect(43, 33, 14, 9);
      for (const x of [44, 56]) eye(c, x, 37, 2.6, lineOnly);
      poly(c, [[45.5, 42], [54.5, 42], [50, 48]], lineOnly ? null : '#FF9A3D', 0.55);
      circ(c, 40, 44, 1.8, lineOnly ? null : '#FFB3C7', null);
      circ(c, 60, 44, 1.8, lineOnly ? null : '#FFB3C7', null);
      for (const x of [42, 58]) {
        c.beginPath();
        c.ellipse(x, 89.5, 6.5, 2.6, 0, 0, Math.PI * 2);
        if (!lineOnly) {
          c.fillStyle = '#FF9A3D';
          c.fill();
        }
        c.lineWidth = 0.55;
        c.strokeStyle = INK;
        c.stroke();
      }
    },
  },
  pez: {
    key: 'pez',
    label: 'Pez',
    group: 'Animales',
    color: '#FF9A3D',
    ...keyChar(pezOutline, pezKeys, [46, 50]),
    counts: { '3-4': 8, '5-6': 14, '7-9': 22 },
    vocab: {
      es: 'pez', en: 'fish',
      titleEs: '¡Es un pez!', titleEn: "It's a fish!",
      sentenceEs: 'El pez nada y hace burbujas.', sentenceEn: 'The fish swims and makes bubbles.',
      extra: [['nadar', 'swim'], ['burbuja', 'bubble'], ['mar', 'sea']],
      talk: [
        { q: 'Hagan boca de pez y burbujas.', word: 'bubble' },
        { q: '¿Qué otros animales viven en el mar?', word: 'sea' },
        { q: 'Cuenten las rayas del pez.', word: 'stripes' },
      ],
    },
    details(c, lineOnly) {
      poly(c, [[36, 31.5], [46, 18], [58, 31]], lineOnly ? null : '#FFD54A', 0.6);
      poly(c, [[42, 69.5], [49, 78], [55, 69]], lineOnly ? null : '#FFD54A', 0.6);
      for (const x of [50, 60]) {
        c.beginPath();
        c.ellipse(x, 50, 4, 19 - (x - 44) * 0.25, 0, -Math.PI / 2, Math.PI / 2);
        if (!lineOnly) {
          c.fillStyle = '#FFD54A';
          c.fill();
        }
        c.lineWidth = 0.55;
        c.strokeStyle = INK;
        c.stroke();
      }
      c.beginPath();
      c.arc(28, 50, 12, -0.35 * Math.PI, 0.35 * Math.PI);
      c.lineWidth = 0.55;
      c.strokeStyle = INK;
      c.stroke();
      circ(c, 24, 45, 4.5, '#fff', INK, 0.55);
      eye(c, 24.5, 45.5, 2.2, lineOnly);
      smile(c, 19, 52, 3, INK, 0.55);
      for (const [x, y, r] of [[8, 34, 2.5], [11, 25, 3.2], [6, 16, 2]]) circ(c, x, y, r, lineOnly ? null : '#CDEBFF', INK, 0.45);
    },
  },
} satisfies Partial<Record<CharKey, Character>>;
