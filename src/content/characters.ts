import {
  angDist,
  arcPts,
  densePolar,
  gauss,
  joinPath,
  polarAt,
  sampleByLength,
  sampleOutline,
  tri,
  type PolarShape,
  type Pt,
} from '../core/geometry';
import type { Age, CharKey } from '../core/types';
import { drawArt, type ArtData } from '../render/art';
import { arc, circ, INK, line, note, poly, star } from '../render/primitives';
import { EXTRA_CHARACTERS, keyDots } from './extra';
import { FRIEND_CHARACTERS } from './friends';
import { MORE_CHARACTERS } from './more';
import { SINGER_ART } from './singers.gen';

export interface TalkPrompt {
  /** Question for the adult to ask, in Spanish. */
  q: string;
  /** English word to practise together. */
  word: string;
}

export interface Vocab {
  es: string;
  en: string;
  titleEs: string;
  titleEn: string;
  sentenceEs: string;
  sentenceEn: string;
  extra: [string, string][];
  talk: TalkPrompt[];
}

export interface Character {
  key: CharKey;
  /** Name shown in the app. */
  label: string;
  /** Category for the gallery. */
  group: 'Personajes' | 'Concierto' | 'Objetos' | 'Casas' | 'Vehículos' | 'Robots' | 'Animales' | 'Naturaleza' | 'Comida' | 'Mandalas';
  /** Detailed drawing with its own line art: no extra outline stroke, colours come from the art. */
  art?: boolean;
  color: string;
  /** Point the dot labels push away from (0–100 box). */
  center: Pt;
  /** Dense closed outline in the 0–100 box (y down). */
  outline: Pt[];
  counts: Record<Age, number>;
  dots: (n: number) => Pt[];
  vocab: Vocab;
  /** Inner details. `lineOnly` = colouring-book version. */
  details: (c: CanvasRenderingContext2D, lineOnly: boolean) => void;
}

function polarChar(shape: PolarShape) {
  return { outline: densePolar(shape), dots: (n: number) => sampleOutline(shape, n), center: [shape.cx, shape.cy] as Pt };
}

function pathChar(outline: Pt[], center: Pt) {
  return { outline, dots: (n: number) => sampleByLength(outline, n), center };
}

/* ---------------- Briz, el erizo del viento ---------------- */
const brizShape: PolarShape = {
  cx: 50,
  cy: 56,
  start: 58,
  rf: (a) => {
    let r = 26;
    if (a >= 40 && a <= 220) r += 13 * tri((5 * (a - 40)) / 180);
    r += 9 * gauss(angDist(a, 355), 12);
    r += 4 * gauss(angDist(a, 255), 7) + 4 * gauss(angDist(a, 290), 7);
    return r;
  },
};

/* ---------------- Momu, visitante de las lunas ---------------- */
const momuShape: PolarShape = {
  cx: 50,
  cy: 58,
  start: 90,
  rf: (a) => {
    const rad = (a * Math.PI) / 180;
    return (
      24 +
      5 * Math.sin(rad) +
      12 * gauss(angDist(a, 45), 11) +
      12 * gauss(angDist(a, 135), 11) +
      5 * (gauss(angDist(a, 250), 7) + gauss(angDist(a, 270), 7) + gauss(angDist(a, 290), 7))
    );
  },
};

/* ---------------- Nara, de Las Resonantes ---------------- */
const naraShape: PolarShape = { cx: 50, cy: 55, start: 90, rf: (a) => 24 + 10 * Math.cos((5 * (a - 90) * Math.PI) / 180) };

/* ---------------- Leo, cantante de Los Ecos (boy band original) ---------------- */
const leoShape: PolarShape = {
  cx: 50,
  cy: 58,
  start: 50,
  rf: (a) => {
    let r = 24;
    if (a >= 30 && a <= 150) r += 11 * tri((3 * (a - 30)) / 120);
    r += 4 * gauss(angDist(a, 0), 7) + 4 * gauss(angDist(a, 180), 7);
    r += 3 * gauss(angDist(a, 270), 30);
    return r;
  },
};

/* ---------------- Lentes ---------------- */
// Two lenses (r 17) joined by a bridge 6 units thick; one closed outer loop.
const LX = 30, RX = 70, LY = 52, LR = 17;
// Starts at the far left of the left lens so dot 1 is easy to find.
const lentesOutline = joinPath(
  arcPts(LX, LY, LR, 180, 339.3),
  arcPts(RX, LY, LR, 200.7, 540),
  arcPts(LX, LY, LR, 0, 180),
);

/* ---------------- Auto (vista lateral) ---------------- */
const autoOutline = joinPath(
  [[12, 70], [12, 58], [14, 55], [22, 52], [33, 37], [36, 35.5], [58, 35.5], [61, 37], [70, 50], [86, 53], [89, 55], [90, 58], [90, 70], [83, 70]],
  arcPts(72, 70, 11, 0, -180),
  [[61, 70], [41, 70]],
  arcPts(30, 70, 11, 0, -180),
  [[19, 70]],
);

/* ---------------- Mina y Kira, de Las Resonantes: cabello largo lacio ---------------- */
// Face circle (FX, FY, FR); the hair is a dome over it with two straight panels down to the
// shoulders. The outline goes round the dome, down each panel and in under the chin.
const FX = 50, FY = 47, FR = 20;
const CHIN_A = (Math.acos(16 / FR) * 180) / Math.PI; // where the panels' inner edge (x 34 / 66) meets the face
const chinPt = (deg: number): Pt => [FX + FR * Math.cos((deg * Math.PI) / 180), FY + FR * Math.sin((deg * Math.PI) / 180)];
/** `round`: Kira's rounded ends; otherwise Mina's pointed (V) ends. */
function longHair(r: number, round: boolean): { outline: Pt[]; keys: Pt[] } {
  const L = 50 - r, R = 50 + r;
  const end = (x0: number, x1: number): Pt[] => (round ? arcPts((x0 + x1) / 2, 90, (x0 - x1) / 2, 0, 180) : [[x0, 92], [(x0 + x1) / 2, 96], [x1, 92]]);
  const outline = joinPath(
    arcPts(50, 46, r, 270, 360),
    [[R, 46]],
    end(R, 66),
    [chinPt(CHIN_A)],
    arcPts(FX, FY, FR, CHIN_A, 180 - CHIN_A),
    end(34, L),
    [[L, 46]],
    arcPts(50, 46, r, 180, 270),
  );
  const bottom = round ? 90 : 92;
  const keys: Pt[] = [[50, 46 - r], [R, 46], [R, bottom], [(R + 66) / 2, 96], [66, bottom], chinPt(CHIN_A), [FX, FY + FR], chinPt(180 - CHIN_A), [34, bottom], [(34 + L) / 2, 96], [L, bottom], [L, 46]];
  return { outline, keys };
}
const minaHair = longHair(27, false);
const kiraHair = longHair(28, true);
/** The face below the fringe line at height `fy` (closed path, for clipping out of the hair). */
function faceBelow(c: CanvasRenderingContext2D, fy: number): void {
  const a = Math.asin((fy - FY) / FR);
  c.moveTo(FX - FR * Math.cos(a), fy);
  c.lineTo(FX + FR * Math.cos(a), fy);
  c.arc(FX, FY, FR, a, Math.PI - a);
  c.closePath();
}
/** Paints the hair: inside the outline, everywhere except the face below the fringe. */
function paintHair(c: CanvasRenderingContext2D, outline: Pt[], color: string, face: () => void): void {
  clipped(c, outline, () => {
    c.beginPath();
    c.rect(0, 0, 100, 100);
    face();
    c.fillStyle = color;
    c.fill('evenodd');
  });
}

/* ---------------- Micrófono mágico ---------------- */
const micOutline = joinPath(arcPts(50, 30, 16, 120, 420), [[57, 50], [54.5, 86]], arcPts(50, 86, 4.5, 0, 180), [[43, 50]]);

/** Runs `draw` clipped to an outline (used to paint hair inside the head). */
function clipped(c: CanvasRenderingContext2D, outline: Pt[], draw: () => void): void {
  c.save();
  const p = new Path2D();
  outline.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  c.clip(p);
  draw();
  c.restore();
}

/** Kira's fringe: the face below y 40, with four scallops along the top edge. */
function kiraFace(c: CanvasRenderingContext2D): void {
  const a = Math.asin((40 - FY) / FR);
  const x0 = FX - FR * Math.cos(a), x1 = FX + FR * Math.cos(a), step = (x1 - x0) / 4;
  c.moveTo(x0, 40);
  for (let i = 0; i < 4; i++) c.quadraticCurveTo(x0 + step * (i + 0.5), 45, x0 + step * (i + 1), 40);
  c.arc(FX, FY, FR, a, Math.PI - a);
  c.closePath();
}

/** Strands, kept short so the hair still reads as straight. */
function strands(c: CanvasRenderingContext2D, r: number): void {
  for (const x of [50 - r + 6, 50 + r - 6]) line(c, [[x, 58], [x, 86]], 0.45);
  c.beginPath();
  c.moveTo(50, 46 - r + 2);
  c.quadraticCurveTo(46, 26, 40, 33);
  c.moveTo(50, 46 - r + 2);
  c.quadraticCurveTo(56, 25, 63, 31);
  c.lineWidth = 0.45;
  c.strokeStyle = INK;
  c.stroke();
}

/** A full-body singer from scripts/singers.mjs: dots on the traced outline, details from the art. */
function singer(key: CharKey, art: ArtData, label: string, counts: Record<Age, number>, vocab: Vocab): Character {
  return {
    key,
    label,
    group: 'Concierto',
    art: true,
    color: art.palette.suit,
    ...pathChar(art.outline, [50, 50]),
    counts,
    vocab,
    details: (c, lineOnly) => drawArt(c, art, key, lineOnly),
  };
}

export const CHARACTERS: Record<CharKey, Character> = {
  briz: {
    key: 'briz',
    label: 'Briz',
    group: 'Personajes',
    color: '#5DBB63',
    ...polarChar(brizShape),
    counts: { '3-4': 10, '5-6': 20, '7-9': 30 },
    vocab: {
      es: 'erizo', en: 'hedgehog',
      titleEs: '¡Es Briz!', titleEn: "It's Briz!",
      sentenceEs: 'Briz es un erizo.', sentenceEn: 'Briz is a hedgehog.',
      extra: [['hoja', 'leaf'], ['nariz', 'nose'], ['viento', 'wind']],
      talk: [
        { q: 'Señala la nariz de Briz. ¿Cómo se dice en inglés?', word: 'nose' },
        { q: '¿Qué hace el viento con las hojas? Busquen una afuera.', word: 'leaf' },
        { q: 'Cuenten juntos las púas en inglés.', word: 'one, two, three' },
      ],
    },
    details(c, lineOnly) {
      for (let k = 0; k < 5; k++) {
        const a = 58 + 36 * k;
        const [x0, y0] = polarAt(brizShape, a);
        const rad = (a * Math.PI) / 180;
        line(c, [[50 + 20 * Math.cos(rad), 56 - 20 * Math.sin(rad)], [x0 + (50 - x0) * 0.12, y0 + (56 - y0) * 0.12]], 0.6, lineOnly ? INK : '#2E7D3E');
      }
      c.beginPath();
      c.ellipse(60, 66, 13, 10, 0, 0, Math.PI * 2);
      if (!lineOnly) {
        c.fillStyle = '#F6E3B4';
        c.fill();
      }
      c.lineWidth = 0.6;
      c.strokeStyle = INK;
      c.stroke();
      circ(c, 66, 47, 3.8, '#fff', INK);
      circ(c, 67, 47.6, 1.9, INK);
      circ(c, 67.6, 46.8, 0.6, '#fff');
      const [nx, ny] = polarAt(brizShape, 355);
      circ(c, nx - 1.2, ny, 2.3, INK);
      if (!lineOnly) circ(c, 64, 54, 2.1, '#FF9DB0');
      arc(c, 73, 53, 4, 0.25 * Math.PI, 0.8 * Math.PI);
    },
  },
  momu: {
    key: 'momu',
    label: 'Momu',
    group: 'Personajes',
    color: '#FFD54A',
    ...polarChar(momuShape),
    counts: { '3-4': 8, '5-6': 16, '7-9': 24 },
    vocab: {
      es: 'alienígena', en: 'alien',
      titleEs: '¡Es Momu!', titleEn: "It's Momu!",
      sentenceEs: 'Momu es un alienígena.', sentenceEn: 'Momu is an alien.',
      extra: [['antenas', 'antennas'], ['ojos', 'eyes'], ['luna', 'moon']],
      talk: [
        { q: '¿Cuántos ojos tiene Momu?', word: 'two eyes' },
        { q: 'Si Momu viene de la luna, ¿qué ve desde allá?', word: 'moon' },
        { q: 'Toquen sus propias antenas imaginarias.', word: 'antennas' },
      ],
    },
    details(c, lineOnly) {
      for (const [x0, y0, x1, y1] of [[44, 30, 38, 16], [56, 30, 62, 16]]) {
        c.beginPath();
        c.moveTo(x0, y0);
        c.quadraticCurveTo((x0 + x1) / 2 + (x1 > x0 ? 3 : -3), (y0 + y1) / 2, x1, y1);
        c.lineWidth = 0.8;
        c.strokeStyle = INK;
        c.stroke();
        circ(c, x1, y1, 2.6, lineOnly ? '#fff' : '#7BD389', INK);
      }
      circ(c, 41, 52, 7, '#fff', INK);
      circ(c, 59, 52, 7, '#fff', INK);
      circ(c, 42.5, 53, 3.5, INK);
      circ(c, 60.5, 53, 3.5, INK);
      circ(c, 43.5, 51.8, 1, '#fff');
      circ(c, 61.5, 51.8, 1, '#fff');
      arc(c, 50, 62, 6, 0.15 * Math.PI, 0.85 * Math.PI);
      for (const [x, y, r] of [[35, 69, 3], [65, 71, 2.6], [52, 77, 2]]) circ(c, x, y, r, lineOnly ? null : '#F2A81D', INK, 0.5);
    },
  },
  nara: {
    key: 'nara',
    label: 'Nara',
    group: 'Personajes',
    color: '#FF8AB8',
    ...polarChar(naraShape),
    counts: { '3-4': 10, '5-6': 15, '7-9': 25 },
    vocab: {
      es: 'estrella', en: 'star',
      titleEs: '¡Es la estrella de Nara!', titleEn: "It's Nara's star!",
      sentenceEs: 'Nara canta con Las Resonantes.', sentenceEn: 'Nara sings with her band.',
      extra: [['nota musical', 'musical note'], ['sonrisa', 'smile'], ['canción', 'song']],
      talk: [
        { q: 'Canten una canción corta y digan la palabra al final.', word: 'song' },
        { q: '¿Cuántas puntas tiene la estrella?', word: 'five' },
        { q: 'Hagan una sonrisa grande.', word: 'smile' },
      ],
    },
    details(c, lineOnly) {
      arc(c, 44, 53, 3, Math.PI, 2 * Math.PI, 0.8);
      arc(c, 56, 53, 3, Math.PI, 2 * Math.PI, 0.8);
      if (!lineOnly) {
        circ(c, 40, 58.5, 2.3, '#FF5C8F');
        circ(c, 60, 58.5, 2.3, '#FF5C8F');
      }
      arc(c, 50, 58, 4.2, 0.15 * Math.PI, 0.85 * Math.PI, 0.8);
      note(c, 83, 30, '#6E56CF', lineOnly);
      note(c, 14, 38, '#2F9A50', lineOnly);
      note(c, 80, 80, '#F2B91C', lineOnly);
    },
  },
  mina: {
    key: 'mina',
    label: 'Mina',
    group: 'Personajes',
    color: '#F7D1B0',
    outline: minaHair.outline,
    dots: (n) => keyDots(minaHair.outline, minaHair.keys, n),
    center: [50, 52],
    counts: { '3-4': 10, '5-6': 18, '7-9': 28 },
    vocab: {
      es: 'heroína', en: 'hero',
      titleEs: '¡Es Mina, de Las Resonantes!', titleEn: "It's Mina from Las Resonantes!",
      sentenceEs: 'Mina vence a las sombras con su canción.', sentenceEn: 'Mina beats the shadows with her song.',
      extra: [['cabello largo', 'long hair'], ['valiente', 'brave'], ['sombra', 'shadow']],
      talk: [
        { q: '¿Qué te hace sentir valiente?', word: 'brave' },
        { q: 'Busquen su sombra en el piso o la pared.', word: 'shadow' },
        { q: '¿Quién en casa tiene el cabello largo?', word: 'long hair' },
      ],
    },
    details(c, lineOnly) {
      if (!lineOnly) paintHair(c, minaHair.outline, '#5B3FA8', () => faceBelow(c, 39));
      c.beginPath();
      faceBelow(c, 39);
      c.lineWidth = 0.7;
      c.strokeStyle = INK;
      c.stroke();
      strands(c, 27);
      // headphones over the hair
      c.beginPath();
      c.arc(50, 46, 29.5, 1.12 * Math.PI, 1.88 * Math.PI);
      c.lineWidth = 1.4;
      c.strokeStyle = INK;
      c.stroke();
      for (const x of [21.5, 78.5]) {
        c.beginPath();
        c.ellipse(x, 47, 3.6, 6, 0, 0, Math.PI * 2);
        if (!lineOnly) {
          c.fillStyle = '#FF5C8F';
          c.fill();
        }
        c.lineWidth = 0.6;
        c.stroke();
      }
      star(c, 36, 30, 3.6, lineOnly ? null : '#F2B91C');
      // determined, friendly face
      line(c, [[39, 45.5], [45, 46.5]], 0.8);
      line(c, [[55, 46.5], [61, 45.5]], 0.8);
      circ(c, 43, 51, 2.5, INK);
      circ(c, 57, 51, 2.5, INK);
      circ(c, 43.8, 50.2, 0.8, '#fff');
      circ(c, 57.8, 50.2, 0.8, '#fff');
      if (!lineOnly) {
        circ(c, 38, 57, 2.3, '#FF9DB0');
        circ(c, 62, 57, 2.3, '#FF9DB0');
      }
      arc(c, 50, 56, 4.5, 0.15 * Math.PI, 0.85 * Math.PI, 0.8);
      note(c, 8, 30, '#6E56CF', lineOnly);
      star(c, 90, 24, 3, lineOnly ? null : '#FF8AB8');
    },
  },
  kira: {
    key: 'kira',
    label: 'Kira',
    group: 'Personajes',
    color: '#F0C29A',
    outline: kiraHair.outline,
    dots: (n) => keyDots(kiraHair.outline, kiraHair.keys, n),
    center: [50, 52],
    counts: { '3-4': 10, '5-6': 16, '7-9': 26 },
    vocab: {
      es: 'bailarina', en: 'dancer',
      titleEs: '¡Es Kira, de Las Resonantes!', titleEn: "It's Kira from Las Resonantes!",
      sentenceEs: 'Kira baila y hace brillar el escenario.', sentenceEn: 'Kira dances on the stage.',
      extra: [['cabello lacio', 'straight hair'], ['bailar', 'dance'], ['brillar', 'shine']],
      talk: [
        { q: 'Pongan música y bailen como Kira.', word: 'dance' },
        { q: 'Kira guiña un ojo. ¿Puedes guiñar tú?', word: 'wink' },
        { q: '¿Qué cosas brillan en tu casa?', word: 'shine' },
      ],
    },
    details(c, lineOnly) {
      if (!lineOnly) paintHair(c, kiraHair.outline, '#E2456F', () => kiraFace(c));
      c.beginPath();
      kiraFace(c);
      c.lineWidth = 0.7;
      c.strokeStyle = INK;
      c.stroke();
      strands(c, 28);
      // star sunglasses pushed up on the head
      line(c, [[45, 31], [55, 31]], 0.6);
      star(c, 41, 31, 4.4, lineOnly ? null : '#7FD3FF');
      star(c, 59, 31, 4.4, lineOnly ? null : '#7FD3FF');
      // wink + open smile
      arc(c, 43, 52, 2.6, 1.1 * Math.PI, 1.9 * Math.PI, 0.9);
      circ(c, 57, 51, 2.5, INK);
      circ(c, 57.8, 50.2, 0.8, '#fff');
      if (!lineOnly) {
        circ(c, 38, 57, 2.3, '#FF9DB0');
        circ(c, 62, 57, 2.3, '#FF9DB0');
      }
      c.beginPath();
      c.moveTo(45.5, 57);
      c.quadraticCurveTo(50, 63.5, 54.5, 57);
      c.closePath();
      if (!lineOnly) {
        c.fillStyle = '#C2185B';
        c.fill();
      }
      c.lineWidth = 0.7;
      c.strokeStyle = INK;
      c.stroke();
      star(c, 10, 70, 3, lineOnly ? null : '#F2B91C');
      note(c, 86, 72, '#2F9A50', lineOnly);
    },
  },
  leo: {
    key: 'leo',
    label: 'Leo',
    group: 'Personajes',
    color: '#F5C7A0',
    ...polarChar(leoShape),
    counts: { '3-4': 9, '5-6': 18, '7-9': 27 },
    vocab: {
      es: 'cantante', en: 'singer',
      titleEs: '¡Es Leo, de Los Ecos!', titleEn: "It's Leo from Los Ecos!",
      sentenceEs: 'Leo canta en la banda Los Ecos.', sentenceEn: 'Leo is a singer in a band.',
      extra: [['cabello', 'hair'], ['micrófono', 'microphone'], ['canción', 'song']],
      talk: [
        { q: 'Canten juntos una canción y aplaudan al final.', word: 'song' },
        { q: 'Señalen su cabello.', word: 'hair' },
        { q: '¿Qué usa Leo para cantar?', word: 'microphone' },
      ],
    },
    details(c, lineOnly) {
      // hair: the top of the head, above the fringe line
      if (!lineOnly) {
        c.save();
        const p = new Path2D();
        leoOutline().forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
        p.closePath();
        c.clip(p);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(100, 0);
        c.lineTo(100, 47);
        c.quadraticCurveTo(66, 40, 52, 49);
        c.quadraticCurveTo(38, 41, 0, 47);
        c.closePath();
        c.fillStyle = '#3A2E6B';
        c.fill();
        c.restore();
      }
      c.beginPath();
      c.moveTo(26, 47.5);
      c.quadraticCurveTo(38, 41, 52, 49);
      c.quadraticCurveTo(66, 40, 74, 47.5);
      c.lineWidth = 0.7;
      c.strokeStyle = INK;
      c.stroke();
      line(c, [[39, 53], [45, 52]], 0.8);
      line(c, [[55, 52], [61, 53]], 0.8);
      circ(c, 42, 58, 2.6, INK);
      circ(c, 58, 58, 2.6, INK);
      circ(c, 42.8, 57.2, 0.8, '#fff');
      circ(c, 58.8, 57.2, 0.8, '#fff');
      if (!lineOnly) {
        circ(c, 37, 64, 2.4, '#FF9DB0');
        circ(c, 63, 64, 2.4, '#FF9DB0');
      }
      arc(c, 50, 64, 6, 0.15 * Math.PI, 0.85 * Math.PI, 0.8);
      // headset microphone
      c.beginPath();
      c.moveTo(75, 60);
      c.quadraticCurveTo(72, 72, 60, 72);
      c.lineWidth = 0.9;
      c.strokeStyle = INK;
      c.stroke();
      circ(c, 59, 72, 2.2, lineOnly ? '#fff' : '#6E56CF', INK);
      // little star earring
      circ(c, 25.5, 66, 1.4, lineOnly ? '#fff' : '#F2B91C', INK, 0.4);
      note(c, 86, 30, '#6E56CF', lineOnly);
    },
  },
  micro: {
    key: 'micro',
    label: 'Micrófono mágico',
    group: 'Objetos',
    color: '#6E56CF',
    ...pathChar(micOutline, [50, 45]),
    counts: { '3-4': 8, '5-6': 15, '7-9': 24 },
    vocab: {
      es: 'micrófono', en: 'microphone',
      titleEs: '¡Es un micrófono mágico!', titleEn: "It's a magic microphone!",
      sentenceEs: 'Con el micrófono cantamos fuerte.', sentenceEn: 'We sing with the microphone.',
      extra: [['cantar', 'sing'], ['fuerte', 'loud'], ['bajito', 'quiet']],
      talk: [
        { q: 'Usen un cepillo como micrófono y canten.', word: 'sing' },
        { q: 'Digan su nombre fuerte y luego bajito.', word: 'loud, quiet' },
        { q: '¿Qué canción te gusta más?', word: 'song' },
      ],
    },
    details(c, lineOnly) {
      clipped(c, arcPts(50, 30, 16, 0, 360), () => {
        if (!lineOnly) {
          c.fillStyle = '#D5DCEA';
          c.fillRect(30, 10, 40, 40);
        }
        for (let k = -40; k <= 40; k += 6) {
          line(c, [[50 + k - 20, 10], [50 + k + 20, 50]], 0.4);
          line(c, [[50 + k + 20, 10], [50 + k - 20, 50]], 0.4);
        }
      });
      circ(c, 50, 30, 16, null, INK, 0.7);
      poly(c, [[42.6, 46], [57.4, 46], [56.9, 52], [43.1, 52]], lineOnly ? null : '#F2B91C');
      circ(c, 50, 64, 2.4, lineOnly ? '#fff' : '#FF5C8F', INK, 0.5);
      star(c, 80, 22, 4, lineOnly ? '#fff' : '#F2B91C');
      star(c, 20, 44, 3, lineOnly ? '#fff' : '#7FD3FF');
      star(c, 76, 70, 2.5, lineOnly ? '#fff' : '#FF8AB8');
      note(c, 18, 72, '#2F9A50', lineOnly);
      note(c, 82, 46, '#E2456F', lineOnly);
    },
  },
  minaPop: singer('minaPop', SINGER_ART.mina, 'Mina en concierto', { '3-4': 12, '5-6': 22, '7-9': 32 }, {
    es: 'espada', en: 'sword',
    titleEs: '¡Mina caza demonios con su espada!', titleEn: 'Mina hunts demons with her sword!',
    sentenceEs: 'Mina canta y protege a todos con su espada de luz.', sentenceEn: 'Mina sings and protects everyone with her light sword.',
    extra: [['cabello largo', 'long hair'], ['audífonos', 'headphones'], ['valiente', 'brave']],
    talk: [
      { q: '¿Qué te hace sentir valiente?', word: 'brave' },
      { q: '¿De qué color pintarías la espada de luz de Mina?', word: 'sword' },
      { q: '¿Quién en casa tiene el cabello largo?', word: 'long hair' },
    ],
  }),
  naraPop: singer('naraPop', SINGER_ART.nara, 'Nara en concierto', { '3-4': 12, '5-6': 22, '7-9': 32 }, {
    es: 'cantante', en: 'singer',
    titleEs: '¡Nara canta contra los demonios!', titleEn: 'Nara sings against the demons!',
    sentenceEs: 'Con su canción, Nara hace correr a los demonios sombra.', sentenceEn: 'Nara’s song makes the shadow demons run away.',
    extra: [['cabello corto', 'short hair'], ['corazón', 'heart'], ['saludar', 'wave']],
    talk: [
      { q: 'Saluden con la mano como Nara.', word: 'hello' },
      { q: '¿Dónde está el corazón en su ropa?', word: 'heart' },
      { q: '¿Qué canción cantaría Nara?', word: 'song' },
    ],
  }),
  kiraPop: singer('kiraPop', SINGER_ART.kira, 'Kira en concierto', { '3-4': 12, '5-6': 22, '7-9': 32 }, {
    es: 'concierto', en: 'concert',
    titleEs: '¡Kira caza demonios cantando!', titleEn: 'Kira hunts demons by singing!',
    sentenceEs: 'Kira levanta el micrófono y los demonios sombra desaparecen.', sentenceEn: 'Kira holds up the microphone and the shadow demons disappear.',
    extra: [['cabello lacio', 'straight hair'], ['luces', 'lights'], ['guiño', 'wink']],
    talk: [
      { q: 'Levanten la mano como Kira con su micrófono.', word: 'up' },
      { q: 'Kira guiña un ojo. ¿Puedes guiñar?', word: 'wink' },
      { q: '¿Qué ropa del futuro te gustaría usar?', word: 'clothes' },
    ],
  }),
  lentes: {
    key: 'lentes',
    label: 'Lentes',
    group: 'Objetos',
    color: '#E8505B',
    ...pathChar(lentesOutline, [50, 52]),
    counts: { '3-4': 8, '5-6': 16, '7-9': 24 },
    vocab: {
      es: 'lentes', en: 'glasses',
      titleEs: '¡Son unos lentes!', titleEn: 'They are glasses!',
      sentenceEs: 'Con los lentes vemos mejor.', sentenceEn: 'Glasses help us see.',
      extra: [['ojos', 'eyes'], ['ver', 'see'], ['círculo', 'circle']],
      talk: [
        { q: '¿Quién en la familia usa lentes?', word: 'glasses' },
        { q: 'Tapen un ojo y miren: ¿qué ven?', word: 'I see' },
        { q: 'Busquen algo redondo como un lente.', word: 'circle' },
      ],
    },
    details(c, lineOnly) {
      for (const cx of [LX, RX]) {
        circ(c, cx, LY, 12.5, lineOnly ? null : '#CDEBFF', INK, 0.6);
        if (!lineOnly) {
          line(c, [[cx - 6, LY - 4], [cx - 2, LY - 8]], 1.2, '#FFFFFF');
          line(c, [[cx - 6, LY + 1], [cx + 1, LY - 6]], 0.8, '#FFFFFF');
        }
      }
      // temples (arms) folding back
      line(c, [[LX - LR, LY - 3], [4, LY - 9]], 1.4);
      line(c, [[RX + LR, LY - 3], [96, LY - 9]], 1.4);
      // nose pads
      circ(c, 46, 59, 1.3, lineOnly ? null : '#fff', INK, 0.4);
      circ(c, 54, 59, 1.3, lineOnly ? null : '#fff', INK, 0.4);
    },
  },
  auto: {
    key: 'auto',
    label: 'Auto',
    group: 'Vehículos',
    color: '#4AA3F0',
    ...pathChar(autoOutline, [50, 55]),
    counts: { '3-4': 10, '5-6': 18, '7-9': 28 },
    vocab: {
      es: 'auto', en: 'car',
      titleEs: '¡Es un auto!', titleEn: "It's a car!",
      sentenceEs: 'El auto tiene cuatro ruedas.', sentenceEn: 'The car has four wheels.',
      extra: [['rueda', 'wheel'], ['ventana', 'window'], ['puerta', 'door']],
      talk: [
        { q: '¿De qué color es el auto de la familia?', word: 'car' },
        { q: 'Cuenten las ruedas que ven en la calle.', word: 'wheels' },
        { q: 'Hagan el sonido del claxon.', word: 'beep beep' },
      ],
    },
    details(c, lineOnly) {
      poly(c, [[24, 52], [33.5, 39.5], [45, 39.5], [45, 52]], lineOnly ? null : '#CDEBFF');
      poly(c, [[48, 39.5], [58, 39.5], [66, 52], [48, 52]], lineOnly ? null : '#CDEBFF');
      line(c, [[46.5, 52], [46.5, 68]], 0.6);
      line(c, [[50, 56], [54, 56]], 1);
      circ(c, 86, 57.5, 2, lineOnly ? null : '#FFE38A', INK, 0.5);
      poly(c, [[12.5, 58], [15, 58], [15, 62], [12.5, 62]], lineOnly ? null : '#FF5C5C', 0.5);
      for (const wx of [30, 72]) {
        circ(c, wx, 70, 8.5, lineOnly ? '#fff' : '#3A3F55', INK, 0.7);
        circ(c, wx, 70, 3.5, lineOnly ? '#fff' : '#C9D3E3', INK, 0.5);
      }
    },
  },
  ...EXTRA_CHARACTERS,
  ...FRIEND_CHARACTERS,
  ...MORE_CHARACTERS,
};

function leoOutline(): Pt[] {
  return CHARACTERS.leo.outline;
}

export const CHARACTER_ORDER: CharKey[] = ['briz', 'momu', 'nara', 'mina', 'kira', 'leo', 'minaPop', 'naraPop', 'kiraPop', 'micro', 'lentes', 'estrella', 'casa', 'granero', 'castillo', 'auto', 'carreras', 'camioneta', 'autobus', 'tren', 'cohete', 'barco', 'avion', 'robi', 'chispa', 'rana', 'pinguino', 'pez', 'perro', 'tortuga', 'mariposa', 'buho', 'arbol', 'flor', 'hongo', 'helado', 'pastel', 'mandalaFlor', 'mandalaCopo', 'mandalaSol'];

export const charOf = (k: CharKey): Character => CHARACTERS[k];
