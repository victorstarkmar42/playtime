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
      w('⬛', 'rectángulo', 'rectangle'), w('🥚', 'óvalo', 'oval'), w('🌙', 'media luna', 'crescent'), w('➕', 'cruz', 'cross'), w('🔶', 'hexágono', 'hexagon'), w('⚫', 'punto', 'dot'),
      w('🦆', 'pato', 'duck'), w('🐑', 'oveja', 'sheep'), w('🐯', 'tigre', 'tiger'), w('🦒', 'jirafa', 'giraffe'), w('🐧', 'pingüino', 'penguin'), w('🐬', 'delfín', 'dolphin'),
      w('🐝', 'abeja', 'bee'), w('🐍', 'serpiente', 'snake'), w('🐭', 'ratón', 'mouse'), w('🦊', 'zorro', 'fox'), w('🦉', 'búho', 'owl'), w('🐙', 'pulpo', 'octopus'),
    ],
  },
  {
    id: 'comida', es: 'Comida', en: 'Food', icon: '🍎',
    words: [
      w('🍎', 'manzana', 'apple'), w('🍌', 'plátano', 'banana'), w('🍊', 'naranja', 'orange'), w('🍇', 'uvas', 'grapes'), w('🍓', 'fresa', 'strawberry'), w('🍉', 'sandía', 'watermelon'),
      w('🥕', 'zanahoria', 'carrot'), w('🍞', 'pan', 'bread'), w('🥛', 'leche', 'milk'), w('💧', 'agua', 'water'), w('🥚', 'huevo', 'egg'), w('🧀', 'queso', 'cheese'),
      w('🍚', 'arroz', 'rice'), w('🍪', 'galleta', 'cookie'),
      w('🍕', 'pizza', 'pizza'), w('🌮', 'taco', 'taco'), w('🍗', 'pollo', 'chicken'), w('🍐', 'pera', 'pear'), w('🍋', 'limón', 'lemon'), w('🥔', 'papa', 'potato'),
      w('🍅', 'tomate', 'tomato'), w('🍦', 'helado', 'ice cream'), w('🎂', 'pastel', 'cake'), w('🧃', 'jugo', 'juice'), w('🍲', 'sopa', 'soup'), w('🌽', 'elote', 'corn'),
    ],
  },
  {
    id: 'cuerpo', es: 'Mi cuerpo', en: 'My body', icon: '🖐️',
    words: [
      w('🙂', 'cara', 'face'), w('👁️', 'ojo', 'eye'), w('👃', 'nariz', 'nose'), w('👄', 'boca', 'mouth'), w('👂', 'oreja', 'ear'), w('🦷', 'diente', 'tooth'),
      w('💇', 'cabello', 'hair'), w('✋', 'mano', 'hand'), w('☝️', 'dedo', 'finger'), w('💪', 'brazo', 'arm'), w('🦵', 'pierna', 'leg'), w('🦶', 'pie', 'foot'),
      w('🧠', 'cabeza', 'head'), w('👅', 'lengua', 'tongue'), w('💅', 'uña', 'nail'), w('🦴', 'hueso', 'bone'), w('❤️', 'corazón', 'heart'), w('🫁', 'pulmones', 'lungs'),
    ],
  },
  {
    id: 'familia', es: 'Familia', en: 'Family', icon: '👪',
    words: [
      w('👩', 'mamá', 'mom'), w('👨', 'papá', 'dad'), w('👧', 'hermana', 'sister'), w('👦', 'hermano', 'brother'), w('👵', 'abuela', 'grandma'), w('👴', 'abuelo', 'grandpa'),
      w('👶', 'bebé', 'baby'), w('🧒', 'amigo', 'friend'), w('👩‍🏫', 'maestra', 'teacher'),
      w('👨‍👩‍👧', 'familia', 'family'), w('🧑', 'tío', 'uncle'), w('👩‍🦰', 'tía', 'aunt'), w('👫', 'primos', 'cousins'), w('🐶', 'mascota', 'pet'),
    ],
  },
  {
    id: 'ropa', es: 'Ropa', en: 'Clothes', icon: '👕',
    words: [
      w('👕', 'playera', 'T-shirt'), w('👖', 'pantalón', 'pants'), w('👗', 'vestido', 'dress'), w('👟', 'tenis', 'sneakers'), w('🧦', 'calcetines', 'socks'),
      w('🧢', 'gorra', 'cap'), w('🧥', 'chamarra', 'jacket'), w('🩳', 'shorts', 'shorts'), w('🧤', 'guantes', 'gloves'),
      w('👒', 'sombrero', 'hat'), w('👢', 'botas', 'boots'), w('🧣', 'bufanda', 'scarf'), w('🩱', 'traje de baño', 'swimsuit'), w('🎒', 'mochila', 'backpack'), w('👓', 'lentes', 'glasses'),
    ],
  },
  {
    id: 'casa', es: 'En casa', en: 'At home', icon: '🏠',
    words: [
      w('🛏️', 'cama', 'bed'), w('🪑', 'silla', 'chair'), w('🚪', 'puerta', 'door'), w('🪟', 'ventana', 'window'), w('🛁', 'tina', 'bathtub'), w('🍽️', 'plato', 'plate'),
      w('🥄', 'cuchara', 'spoon'), w('🥤', 'vaso', 'cup'), w('📚', 'libro', 'book'), w('🧸', 'juguete', 'toy'), w('⚽', 'pelota', 'ball'), w('💡', 'lámpara', 'lamp'),
      w('🛋️', 'sillón', 'sofa'), w('📺', 'televisión', 'TV'), w('🚿', 'regadera', 'shower'), w('🪥', 'cepillo de dientes', 'toothbrush'), w('🧽', 'esponja', 'sponge'), w('🔑', 'llave', 'key'),
      w('⏰', 'reloj', 'clock'), w('🖼️', 'cuadro', 'picture'),
    ],
  },
  {
    id: 'naturaleza', es: 'Naturaleza y clima', en: 'Nature and weather', icon: '🌞',
    words: [
      w('☀️', 'sol', 'sun'), w('🌙', 'luna', 'moon'), w('⭐', 'estrella', 'star'), w('☁️', 'nube', 'cloud'), w('🌧️', 'lluvia', 'rain'), w('❄️', 'nieve', 'snow'),
      w('🌈', 'arcoíris', 'rainbow'), w('🌳', 'árbol', 'tree'), w('🌸', 'flor', 'flower'), w('🌊', 'mar', 'sea'), w('⛰️', 'montaña', 'mountain'), w('💨', 'viento', 'wind'),
      w('🔥', 'fuego', 'fire'), w('🌋', 'volcán', 'volcano'), w('🏝️', 'isla', 'island'), w('🍃', 'hoja', 'leaf'), w('🌵', 'cactus', 'cactus'), w('⛈️', 'tormenta', 'storm'),
    ],
  },
  {
    id: 'transporte', es: 'Transporte', en: 'Transportation', icon: '🚗',
    words: [
      w('🚗', 'carro', 'car'), w('🚌', 'autobús', 'bus'), w('🚲', 'bicicleta', 'bike'), w('✈️', 'avión', 'airplane'), w('🚂', 'tren', 'train'), w('⛵', 'barco', 'boat'),
      w('🚁', 'helicóptero', 'helicopter'), w('🚒', 'camión de bomberos', 'fire truck'), w('🚀', 'cohete', 'rocket'),
      w('🏍️', 'moto', 'motorcycle'), w('🚕', 'taxi', 'taxi'), w('🚑', 'ambulancia', 'ambulance'), w('🚓', 'patrulla', 'police car'), w('🚜', 'tractor', 'tractor'), w('🛴', 'patín del diablo', 'scooter'),
      w('🚇', 'metro', 'subway'), w('🚚', 'camión', 'truck'),
    ],
  },
  {
    id: 'acciones', es: 'Acciones', en: 'Actions', icon: '🏃',
    words: [
      w('🏃', 'correr', 'run'), w('🦘', 'saltar', 'jump'), w('🍽️', 'comer', 'eat'), w('🥤', 'beber', 'drink'), w('😴', 'dormir', 'sleep'), w('🎨', 'pintar', 'paint'),
      w('🎵', 'cantar', 'sing'), w('💃', 'bailar', 'dance'), w('📖', 'leer', 'read'), w('🏊', 'nadar', 'swim'), w('🎮', 'jugar', 'play'), w('🧼', 'lavar', 'wash'),
      w('✍️', 'escribir', 'write'), w('👂', 'escuchar', 'listen'), w('🗣️', 'hablar', 'talk'), w('🧗', 'trepar', 'climb'), w('🚶', 'caminar', 'walk'), w('🤸', 'dar maromas', 'tumble'),
      w('🍳', 'cocinar', 'cook'), w('🧹', 'barrer', 'sweep'),
    ],
  },
  {
    id: 'emociones', es: 'Emociones', en: 'Feelings', icon: '😊',
    words: [
      w('😊', 'feliz', 'happy'), w('😢', 'triste', 'sad'), w('😠', 'enojado', 'angry'), w('😨', 'asustado', 'scared'), w('😮', 'sorprendido', 'surprised'),
      w('😴', 'cansado', 'tired'), w('😌', 'tranquilo', 'calm'), w('🤗', 'cariño', 'love'),
      w('😂', 'divertido', 'funny'), w('😳', 'apenado', 'embarrassed'), w('🤒', 'enfermo', 'sick'), w('😋', 'con hambre', 'hungry'), w('😎', 'orgulloso', 'proud'),
    ],
  },
  {
    id: 'escuela', es: 'Escuela', en: 'School', icon: '🎒',
    words: [
      w('🏫', 'escuela', 'school'), w('👩‍🏫', 'maestra', 'teacher'), w('✏️', 'lápiz', 'pencil'), w('🖍️', 'crayón', 'crayon'), w('📏', 'regla', 'ruler'), w('✂️', 'tijeras', 'scissors'),
      w('📓', 'cuaderno', 'notebook'), w('🎒', 'mochila', 'backpack'), w('🧮', 'ábaco', 'abacus'), w('📐', 'escuadra', 'set square'), w('🖌️', 'pincel', 'brush'), w('🗑️', 'basura', 'trash'),
      w('🔔', 'campana', 'bell'), w('🧑‍🤝‍🧑', 'compañeros', 'classmates'),
    ],
  },
  {
    id: 'oficios', es: 'Oficios', en: 'Jobs', icon: '👩‍🚒',
    words: [
      w('👩‍⚕️', 'doctora', 'doctor'), w('🧑‍🚒', 'bombero', 'firefighter'), w('👮', 'policía', 'police officer'), w('🧑‍🍳', 'cocinero', 'cook'), w('🧑‍🌾', 'granjero', 'farmer'), w('🧑‍🚀', 'astronauta', 'astronaut'),
      w('🧑‍🎨', 'pintor', 'painter'), w('🧑‍🔧', 'mecánico', 'mechanic'), w('👷', 'albañil', 'builder'), w('🧑‍✈️', 'piloto', 'pilot'), w('🦷', 'dentista', 'dentist'), w('🎤', 'cantante', 'singer'),
    ],
  },
  {
    id: 'lugares', es: 'Lugares', en: 'Places', icon: '🏞️',
    words: [
      w('🏠', 'casa', 'house'), w('🏫', 'escuela', 'school'), w('🏥', 'hospital', 'hospital'), w('🛝', 'parque', 'park'), w('🏪', 'tienda', 'store'), w('🏖️', 'playa', 'beach'),
      w('🌲', 'bosque', 'forest'), w('🏙️', 'ciudad', 'city'), w('🚜', 'granja', 'farm'), w('🦁', 'zoológico', 'zoo'), w('📚', 'biblioteca', 'library'), w('⛪', 'iglesia', 'church'),
    ],
  },
  {
    id: 'opuestos', es: 'Opuestos', en: 'Opposites', icon: '↕️',
    words: [
      w('🐘', 'grande', 'big'), w('🐭', 'pequeño', 'small'), w('🔥', 'caliente', 'hot'), w('🧊', 'frío', 'cold'), w('⬆️', 'arriba', 'up'), w('⬇️', 'abajo', 'down'),
      w('🐇', 'rápido', 'fast'), w('🐢', 'lento', 'slow'), w('☀️', 'día', 'day'), w('🌙', 'noche', 'night'), w('🔓', 'abierto', 'open'), w('🔒', 'cerrado', 'closed'),
      w('🪶', 'ligero', 'light'), w('🏋️', 'pesado', 'heavy'),
    ],
  },
  {
    id: 'dias', es: 'Días y meses', en: 'Days and months', icon: '📅',
    words: [
      w('1️⃣', 'lunes', 'Monday'), w('2️⃣', 'martes', 'Tuesday'), w('3️⃣', 'miércoles', 'Wednesday'), w('4️⃣', 'jueves', 'Thursday'), w('5️⃣', 'viernes', 'Friday'), w('6️⃣', 'sábado', 'Saturday'),
      w('7️⃣', 'domingo', 'Sunday'), w('⛄', 'enero', 'January'), w('💘', 'febrero', 'February'), w('🌱', 'marzo', 'March'), w('🌧️', 'abril', 'April'), w('🌷', 'mayo', 'May'),
      w('🌞', 'junio', 'June'), w('🏖️', 'julio', 'July'), w('🍉', 'agosto', 'August'), w('🎒', 'septiembre', 'September'), w('🎃', 'octubre', 'October'), w('🍂', 'noviembre', 'November'),
      w('🎄', 'diciembre', 'December'), w('📆', 'hoy', 'today'), w('⏭️', 'mañana', 'tomorrow'), w('⏮️', 'ayer', 'yesterday'),
    ],
  },
  {
    id: 'saludos', es: 'Saludos', en: 'Greetings', icon: '👋',
    words: [
      w('👋', 'hola', 'hello'), w('🌅', 'buenos días', 'good morning'), w('🌆', 'buenas tardes', 'good afternoon'), w('🌃', 'buenas noches', 'good night'),
      w('🙏', 'por favor', 'please'), w('💛', 'gracias', 'thank you'), w('👋', 'adiós', 'goodbye'), w('🙂', 'sí', 'yes'), w('🙅', 'no', 'no'), w('😔', 'perdón', 'sorry'),
      w('🙋', '¿cómo estás?', 'how are you?'), w('👍', 'muy bien', 'very well'), w('🤝', 'mucho gusto', 'nice to meet you'), w('🎂', 'feliz cumpleaños', 'happy birthday'), w('😊', 'de nada', "you're welcome"),
    ],
  },
];
