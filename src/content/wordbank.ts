import type { Word } from './words';

/** A word with a picture (an emoji, so 3–4-year-olds who don't read yet know what it is). */
export interface PicWord extends Word {
  pic: string;
}

export interface WordSection {
  id: string;
  es: string;
  en: string;
  /** Emoji shown on the section tab. */
  icon: string;
  words: PicWord[];
}

const w = (pic: string, es: string, en: string): PicWord => ({ pic, es, en });

/** Themed vocabulary for "Palabras". Numbers, colours and the drawings' words are added by the screen. */
export const WORD_SECTIONS: WordSection[] = [
  {
    id: 'formas', es: 'Formas', en: 'Shapes', icon: '🔺',
    words: [w('⚪', 'círculo', 'circle'), w('🟦', 'cuadrado', 'square'), w('🔺', 'triángulo', 'triangle'), w('⭐', 'estrella', 'star'), w('❤️', 'corazón', 'heart'), w('🔷', 'rombo', 'diamond')],
  },
  {
    id: 'animales', es: 'Animales', en: 'Animals', icon: '🐶',
    words: [
      w('🐶', 'perro', 'dog'), w('🐱', 'gato', 'cat'), w('🐦', 'pájaro', 'bird'), w('🐟', 'pez', 'fish'), w('🐴', 'caballo', 'horse'), w('🐮', 'vaca', 'cow'),
      w('🐷', 'cerdo', 'pig'), w('🐔', 'gallina', 'hen'), w('🐰', 'conejo', 'rabbit'), w('🐻', 'oso', 'bear'), w('🦁', 'león', 'lion'), w('🐘', 'elefante', 'elephant'),
      w('🐵', 'mono', 'monkey'), w('🐢', 'tortuga', 'turtle'), w('🦋', 'mariposa', 'butterfly'), w('🐸', 'rana', 'frog'),
    ],
  },
  {
    id: 'comida', es: 'Comida', en: 'Food', icon: '🍎',
    words: [
      w('🍎', 'manzana', 'apple'), w('🍌', 'plátano', 'banana'), w('🍊', 'naranja', 'orange'), w('🍇', 'uvas', 'grapes'), w('🍓', 'fresa', 'strawberry'), w('🍉', 'sandía', 'watermelon'),
      w('🥕', 'zanahoria', 'carrot'), w('🍞', 'pan', 'bread'), w('🥛', 'leche', 'milk'), w('💧', 'agua', 'water'), w('🥚', 'huevo', 'egg'), w('🧀', 'queso', 'cheese'),
      w('🍚', 'arroz', 'rice'), w('🍪', 'galleta', 'cookie'),
    ],
  },
  {
    id: 'cuerpo', es: 'Mi cuerpo', en: 'My body', icon: '🖐️',
    words: [
      w('🙂', 'cara', 'face'), w('👁️', 'ojo', 'eye'), w('👃', 'nariz', 'nose'), w('👄', 'boca', 'mouth'), w('👂', 'oreja', 'ear'), w('🦷', 'diente', 'tooth'),
      w('💇', 'cabello', 'hair'), w('✋', 'mano', 'hand'), w('☝️', 'dedo', 'finger'), w('💪', 'brazo', 'arm'), w('🦵', 'pierna', 'leg'), w('🦶', 'pie', 'foot'),
    ],
  },
  {
    id: 'familia', es: 'Familia', en: 'Family', icon: '👪',
    words: [
      w('👩', 'mamá', 'mom'), w('👨', 'papá', 'dad'), w('👧', 'hermana', 'sister'), w('👦', 'hermano', 'brother'), w('👵', 'abuela', 'grandma'), w('👴', 'abuelo', 'grandpa'),
      w('👶', 'bebé', 'baby'), w('🧒', 'amigo', 'friend'), w('👩‍🏫', 'maestra', 'teacher'),
    ],
  },
  {
    id: 'ropa', es: 'Ropa', en: 'Clothes', icon: '👕',
    words: [
      w('👕', 'playera', 'T-shirt'), w('👖', 'pantalón', 'pants'), w('👗', 'vestido', 'dress'), w('👟', 'tenis', 'sneakers'), w('🧦', 'calcetines', 'socks'),
      w('🧢', 'gorra', 'cap'), w('🧥', 'chamarra', 'jacket'), w('🩳', 'shorts', 'shorts'), w('🧤', 'guantes', 'gloves'),
    ],
  },
  {
    id: 'casa', es: 'En casa', en: 'At home', icon: '🏠',
    words: [
      w('🛏️', 'cama', 'bed'), w('🪑', 'silla', 'chair'), w('🚪', 'puerta', 'door'), w('🪟', 'ventana', 'window'), w('🛁', 'tina', 'bathtub'), w('🍽️', 'plato', 'plate'),
      w('🥄', 'cuchara', 'spoon'), w('🥤', 'vaso', 'cup'), w('📚', 'libro', 'book'), w('🧸', 'juguete', 'toy'), w('⚽', 'pelota', 'ball'), w('💡', 'lámpara', 'lamp'),
    ],
  },
  {
    id: 'naturaleza', es: 'Naturaleza y clima', en: 'Nature and weather', icon: '🌞',
    words: [
      w('☀️', 'sol', 'sun'), w('🌙', 'luna', 'moon'), w('⭐', 'estrella', 'star'), w('☁️', 'nube', 'cloud'), w('🌧️', 'lluvia', 'rain'), w('❄️', 'nieve', 'snow'),
      w('🌈', 'arcoíris', 'rainbow'), w('🌳', 'árbol', 'tree'), w('🌸', 'flor', 'flower'), w('🌊', 'mar', 'sea'), w('⛰️', 'montaña', 'mountain'), w('💨', 'viento', 'wind'),
    ],
  },
  {
    id: 'transporte', es: 'Transporte', en: 'Transportation', icon: '🚗',
    words: [
      w('🚗', 'carro', 'car'), w('🚌', 'autobús', 'bus'), w('🚲', 'bicicleta', 'bike'), w('✈️', 'avión', 'airplane'), w('🚂', 'tren', 'train'), w('⛵', 'barco', 'boat'),
      w('🚁', 'helicóptero', 'helicopter'), w('🚒', 'camión de bomberos', 'fire truck'), w('🚀', 'cohete', 'rocket'),
    ],
  },
  {
    id: 'acciones', es: 'Acciones', en: 'Actions', icon: '🏃',
    words: [
      w('🏃', 'correr', 'run'), w('🦘', 'saltar', 'jump'), w('🍽️', 'comer', 'eat'), w('🥤', 'beber', 'drink'), w('😴', 'dormir', 'sleep'), w('🎨', 'pintar', 'paint'),
      w('🎵', 'cantar', 'sing'), w('💃', 'bailar', 'dance'), w('📖', 'leer', 'read'), w('🏊', 'nadar', 'swim'), w('🎮', 'jugar', 'play'), w('🧼', 'lavar', 'wash'),
    ],
  },
  {
    id: 'emociones', es: 'Emociones', en: 'Feelings', icon: '😊',
    words: [
      w('😊', 'feliz', 'happy'), w('😢', 'triste', 'sad'), w('😠', 'enojado', 'angry'), w('😨', 'asustado', 'scared'), w('😮', 'sorprendido', 'surprised'),
      w('😴', 'cansado', 'tired'), w('😌', 'tranquilo', 'calm'), w('🤗', 'cariño', 'love'),
    ],
  },
  {
    id: 'saludos', es: 'Saludos', en: 'Greetings', icon: '👋',
    words: [
      w('👋', 'hola', 'hello'), w('🌅', 'buenos días', 'good morning'), w('🌆', 'buenas tardes', 'good afternoon'), w('🌃', 'buenas noches', 'good night'),
      w('🙏', 'por favor', 'please'), w('💛', 'gracias', 'thank you'), w('👋', 'adiós', 'goodbye'), w('🙂', 'sí', 'yes'), w('🙅', 'no', 'no'), w('😔', 'perdón', 'sorry'),
    ],
  },
];
