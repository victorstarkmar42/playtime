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
