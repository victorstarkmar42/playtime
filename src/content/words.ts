/** Shared bilingual word lists (colours are also the colouring palette). */
export interface Word {
  es: string;
  en: string;
}

export const COLORS: (Word & { hex: string })[] = [
  { hex: '#F2672E', es: 'naranja', en: 'orange' },
  { hex: '#E84545', es: 'rojo', en: 'red' },
  { hex: '#FFD54A', es: 'amarillo', en: 'yellow' },
  { hex: '#5DBB63', es: 'verde', en: 'green' },
  { hex: '#4AA3F0', es: 'azul', en: 'blue' },
  { hex: '#8E6CF0', es: 'morado', en: 'purple' },
  { hex: '#FF8AB8', es: 'rosa', en: 'pink' },
  { hex: '#8B5A3C', es: 'café', en: 'brown' },
  { hex: '#F5C7A0', es: 'durazno', en: 'peach' },
  { hex: '#22304F', es: 'azul oscuro', en: 'dark blue' },
];

export const NUMBERS: Word[] = [
  ['uno', 'one'], ['dos', 'two'], ['tres', 'three'], ['cuatro', 'four'], ['cinco', 'five'],
  ['seis', 'six'], ['siete', 'seven'], ['ocho', 'eight'], ['nueve', 'nine'], ['diez', 'ten'],
].map(([es, en]) => ({ es, en }));

/** More numbers for "Palabras": 11 to 20 and the tens up to 100. */
export const MORE_NUMBERS: (Word & { n: number })[] = (
  [
    [11, 'once', 'eleven'], [12, 'doce', 'twelve'], [13, 'trece', 'thirteen'], [14, 'catorce', 'fourteen'], [15, 'quince', 'fifteen'],
    [16, 'dieciséis', 'sixteen'], [17, 'diecisiete', 'seventeen'], [18, 'dieciocho', 'eighteen'], [19, 'diecinueve', 'nineteen'], [20, 'veinte', 'twenty'],
    [30, 'treinta', 'thirty'], [40, 'cuarenta', 'forty'], [50, 'cincuenta', 'fifty'], [60, 'sesenta', 'sixty'], [70, 'setenta', 'seventy'],
    [80, 'ochenta', 'eighty'], [90, 'noventa', 'ninety'], [100, 'cien', 'one hundred'],
  ] as [number, string, string][]
).map(([n, es, en]) => ({ n, es, en }));
