import type { Age } from '../core/types';

/**
 * Cuentos cortos para leer (o escuchar) y preguntas de comprensión: quién, qué pasó y por qué.
 * La primera opción de cada pregunta es la correcta; la pantalla las revuelve.
 * Personajes originales (Robi y Chispa son los robots de la app).
 */

export interface StoryOption {
  es: string;
  en: string;
  /** Emoji: the youngest answer with pictures. */
  pic?: string;
}
export type QuestionKind = 'quien' | 'que' | 'porque';
export interface StoryQuestion {
  kind: QuestionKind;
  es: string;
  en: string;
  options: StoryOption[];
}
export interface Story {
  id: string;
  age: Age;
  pic: string;
  title: { es: string; en: string };
  /** One sentence per entry, same order in both languages. */
  es: string[];
  en: string[];
  questions: StoryQuestion[];
}

const o = (es: string, en: string, pic?: string): StoryOption => (pic ? { es, en, pic } : { es, en });
const q = (kind: QuestionKind, es: string, en: string, ...options: StoryOption[]): StoryQuestion => ({ kind, es, en, options });

export const STORIES: Story[] = [
  /* ---------- 3–4 ---------- */
  {
    id: 'globo', age: '3-4', pic: '🎈', title: { es: 'El globo rojo', en: 'The red balloon' },
    es: ['Mía tiene un globo rojo.', 'El viento sopla fuerte.', '¡El globo sube al cielo!'],
    en: ['Mía has a red balloon.', 'The wind blows hard.', 'The balloon goes up to the sky!'],
    questions: [
      q('que', '¿De qué color es el globo?', 'What color is the balloon?', o('rojo', 'red', '🔴'), o('azul', 'blue', '🔵'), o('verde', 'green', '🟢')),
      q('que', '¿A dónde se fue el globo?', 'Where did the balloon go?', o('al cielo', 'to the sky', '☁️'), o('al mar', 'to the sea', '🌊'), o('a la casa', 'to the house', '🏠')),
    ],
  },
  {
    id: 'toby', age: '3-4', pic: '🐶', title: { es: 'Toby tiene hambre', en: 'Toby is hungry' },
    es: ['Toby es un perro.', 'Toby tiene mucha hambre.', 'Toby come un hueso grande.'],
    en: ['Toby is a dog.', 'Toby is very hungry.', 'Toby eats a big bone.'],
    questions: [
      q('quien', '¿Quién es Toby?', 'Who is Toby?', o('un perro', 'a dog', '🐶'), o('un gato', 'a cat', '🐱'), o('un pez', 'a fish', '🐟')),
      q('que', '¿Qué come Toby?', 'What does Toby eat?', o('un hueso', 'a bone', '🦴'), o('una manzana', 'an apple', '🍎'), o('queso', 'cheese', '🧀')),
    ],
  },
  {
    id: 'lluvia', age: '3-4', pic: '🌧️', title: { es: 'Día de lluvia', en: 'Rainy day' },
    es: ['Llueve mucho.', 'Leo abre su paraguas amarillo.', 'Leo salta en los charcos.'],
    en: ['It is raining a lot.', 'Leo opens his yellow umbrella.', 'Leo jumps in the puddles.'],
    questions: [
      q('que', '¿Qué abre Leo?', 'What does Leo open?', o('un paraguas', 'an umbrella', '☂️'), o('un libro', 'a book', '📚'), o('una puerta', 'a door', '🚪')),
      q('que', '¿Cómo está el día?', 'What is the weather like?', o('llueve', 'rainy', '🌧️'), o('hace sol', 'sunny', '☀️'), o('nieva', 'snowy', '❄️')),
    ],
  },
  {
    id: 'robi', age: '3-4', pic: '🤖', title: { es: 'Robi y la estrella', en: 'Robi and the star' },
    es: ['Robi es un robot.', 'De noche, Robi ve una estrella.', 'Robi le dice: ¡buenas noches!'],
    en: ['Robi is a robot.', 'At night, Robi sees a star.', 'Robi says: good night!'],
    questions: [
      q('quien', '¿Quién es Robi?', 'Who is Robi?', o('un robot', 'a robot', '🤖'), o('un oso', 'a bear', '🐻'), o('una niña', 'a girl', '👧')),
      q('que', '¿Qué ve Robi?', 'What does Robi see?', o('una estrella', 'a star', '⭐'), o('un arcoíris', 'a rainbow', '🌈'), o('un pájaro', 'a bird', '🐦')),
    ],
  },
  /* ---------- 5–6 ---------- */
  {
    id: 'semilla', age: '5-6', pic: '🌱', title: { es: 'La semilla de Sofi', en: "Sofi's seed" },
    es: ['Sofi pone una semilla en una maceta.', 'Cada mañana le echa agua.', 'El sol la calienta.', 'Un día sale una flor amarilla.', 'Sofi sonríe muy contenta.'],
    en: ['Sofi puts a seed in a pot.', 'Every morning she waters it.', 'The sun keeps it warm.', 'One day a yellow flower comes out.', 'Sofi smiles, very happy.'],
    questions: [
      q('quien', '¿Quién plantó la semilla?', 'Who planted the seed?', o('Sofi', 'Sofi', '👧'), o('Leo', 'Leo', '👦'), o('la abuela', 'grandma', '👵')),
      q('que', '¿Qué salió de la semilla?', 'What came out of the seed?', o('una flor amarilla', 'a yellow flower', '🌼'), o('un árbol', 'a tree', '🌳'), o('una fresa', 'a strawberry', '🍓')),
      q('porque', '¿Por qué creció la planta?', 'Why did the plant grow?', o('porque tuvo agua y sol', 'because it had water and sun', '💧'), o('porque estaba en un cajón', 'because it was in a drawer', '🗄️'), o('porque hacía mucho frío', 'because it was very cold', '❄️')),
    ],
  },
  {
    id: 'nube', age: '5-6', pic: '🐱', title: { es: 'Nube y la pelota', en: 'Nube and the ball' },
    es: ['Nube es una gata blanca.', 'Nube juega con una pelota de lana.', 'La pelota rueda debajo del sillón.', 'Nube mete la pata y la saca.', 'Ahora Nube está cansada y se duerme.'],
    en: ['Nube is a white cat.', 'Nube plays with a ball of yarn.', 'The ball rolls under the sofa.', 'Nube reaches in with her paw and gets it out.', 'Now Nube is tired and falls asleep.'],
    questions: [
      q('quien', '¿Cómo se llama la gata?', "What is the cat's name?", o('Nube', 'Nube', '🐱'), o('Luna', 'Luna', '🌙'), o('Toby', 'Toby', '🐶')),
      q('que', '¿A dónde rodó la pelota?', 'Where did the ball roll?', o('debajo del sillón', 'under the sofa', '🛋️'), o('al jardín', 'to the garden', '🌳'), o('a la cocina', 'to the kitchen', '🍳')),
      q('porque', '¿Por qué se durmió Nube?', 'Why did Nube fall asleep?', o('porque jugó mucho y se cansó', 'because she played a lot and got tired', '😴'), o('porque tenía hambre', 'because she was hungry', '🍽️'), o('porque estaba enojada', 'because she was angry', '😠')),
    ],
  },
  {
    id: 'tito', age: '5-6', pic: '🐢', title: { es: 'El cumpleaños de Tito', en: "Tito's birthday" },
    es: ['Hoy es el cumpleaños de Tito, la tortuga.', 'Sus amigos llegan con regalos.', 'El conejo trae un pastel de zanahoria.', 'Tito sopla las velas despacio.', 'Todos cantan y aplauden.'],
    en: ["Today is Tito the turtle's birthday.", 'His friends arrive with presents.', 'The rabbit brings a carrot cake.', 'Tito blows out the candles slowly.', 'Everyone sings and claps.'],
    questions: [
      q('quien', '¿Quién cumple años?', 'Whose birthday is it?', o('Tito, la tortuga', 'Tito the turtle', '🐢'), o('el conejo', 'the rabbit', '🐰'), o('el pato', 'the duck', '🦆')),
      q('que', '¿Qué trajo el conejo?', 'What did the rabbit bring?', o('un pastel de zanahoria', 'a carrot cake', '🎂'), o('una pelota', 'a ball', '⚽'), o('un libro', 'a book', '📚')),
      q('que', '¿Qué hace Tito con las velas?', 'What does Tito do with the candles?', o('las sopla', 'blows them out', '🕯️'), o('las pinta', 'paints them', '🎨'), o('las esconde', 'hides them', '🙈')),
    ],
  },
  {
    id: 'chispa', age: '5-6', pic: '🐦', title: { es: 'Chispa ayuda', en: 'Chispa helps' },
    es: ['Chispa es una robot muy amable.', 'Ve a un pajarito que se cayó del nido.', 'Chispa estira su brazo largo.', 'Sube al pajarito con cuidado.', 'La mamá pájaro canta: ¡gracias!'],
    en: ['Chispa is a very kind robot.', 'She sees a little bird that fell out of its nest.', 'Chispa stretches out her long arm.', 'She lifts the little bird up carefully.', 'The mother bird sings: thank you!'],
    questions: [
      q('quien', '¿Quién se cayó del nido?', 'Who fell out of the nest?', o('un pajarito', 'a little bird', '🐦'), o('Chispa', 'Chispa', '🤖'), o('un gato', 'a cat', '🐱')),
      q('que', '¿Qué usó Chispa para ayudar?', 'What did Chispa use to help?', o('su brazo largo', 'her long arm', '🦾'), o('una escalera', 'a ladder', '🪜'), o('un globo', 'a balloon', '🎈')),
      q('porque', '¿Por qué canta la mamá pájaro?', 'Why does the mother bird sing?', o('para dar las gracias', 'to say thank you', '💛'), o('porque tiene hambre', 'because she is hungry', '🍽️'), o('porque está lloviendo', 'because it is raining', '🌧️')),
    ],
  },
  /* ---------- 7–9 ---------- */
  {
    id: 'mapa', age: '7-9', pic: '🗺️', title: { es: 'El mapa del abuelo', en: "Grandpa's map" },
    es: [
      'Iker encontró un mapa viejo en el desván de su abuelo.',
      'El mapa tenía una X roja junto a un árbol grande del parque.',
      'Con su hermana Ana caminó hasta el parque.',
      'Contaron diez pasos desde el árbol y cavaron con cuidado.',
      'Encontraron una caja con fotos del abuelo cuando era niño.',
      'Esa tarde, el abuelo les contó una historia de cada foto.',
    ],
    en: [
      "Iker found an old map in his grandpa's attic.",
      'The map had a red X next to a big tree in the park.',
      'He walked to the park with his sister Ana.',
      'They counted ten steps from the tree and dug carefully.',
      'They found a box with photos of grandpa when he was a boy.',
      'That afternoon, grandpa told them a story about each photo.',
    ],
    questions: [
      q('que', '¿Dónde encontró Iker el mapa?', 'Where did Iker find the map?', o('en el desván del abuelo', "in grandpa's attic"), o('en la escuela', 'at school'), o('debajo de un árbol', 'under a tree')),
      q('que', '¿Qué había dentro de la caja?', 'What was inside the box?', o('fotos del abuelo de niño', 'photos of grandpa as a boy'), o('monedas de oro', 'gold coins'), o('juguetes nuevos', 'new toys')),
      q('porque', '¿Qué crees que sintió el abuelo al ver las fotos?', 'How do you think grandpa felt when he saw the photos?', o('alegría al recordar', 'happy to remember'), o('miedo', 'scared'), o('enojo', 'angry')),
    ],
  },
  {
    id: 'carrera', age: '7-9', pic: '🏃', title: { es: 'La carrera', en: 'The race' },
    es: [
      'En la escuela de Lía hubo una carrera.',
      'Lía corría muy rápido, pero tropezó con una piedra.',
      'Su amigo Teo, que iba detrás, se detuvo a ayudarla.',
      'Los dos llegaron a la meta caminando juntos.',
      'No ganaron la carrera, pero todos los aplaudieron.',
      'La maestra dijo que ayudar a un amigo vale más que una medalla.',
    ],
    en: [
      "There was a race at Lía's school.",
      'Lía was running very fast, but she tripped over a stone.',
      'Her friend Teo, who was behind her, stopped to help her.',
      'The two of them walked to the finish line together.',
      'They did not win the race, but everyone clapped for them.',
      'The teacher said that helping a friend is worth more than a medal.',
    ],
    questions: [
      q('que', '¿Qué le pasó a Lía?', 'What happened to Lía?', o('tropezó con una piedra', 'she tripped over a stone'), o('perdió un zapato', 'she lost a shoe'), o('se quedó dormida', 'she fell asleep')),
      q('porque', '¿Por qué todos los aplaudieron?', 'Why did everyone clap for them?', o('porque Teo ayudó a Lía', 'because Teo helped Lía'), o('porque ganaron la carrera', 'because they won the race'), o('porque corrieron hacia atrás', 'because they ran backwards')),
      q('porque', '¿Qué nos enseña el cuento?', 'What does the story teach us?', o('que ayudar a otros es importante', 'that helping others is important'), o('que correr es aburrido', 'that running is boring'), o('que siempre hay que ganar', 'that you must always win')),
    ],
  },
  {
    id: 'huerto', age: '7-9', pic: '🥕', title: { es: 'El huerto de la escuela', en: 'The school garden' },
    es: [
      'El grupo de tercero sembró un huerto en la escuela.',
      'Plantaron zanahorias, lechugas y jitomates.',
      'Cada semana, un equipo distinto regaba las plantas.',
      'Una semana nadie regó y las lechugas se marchitaron.',
      'Desde entonces hicieron un calendario para no olvidarse.',
      'Al final del año prepararon una ensalada para todos.',
    ],
    en: [
      'The third grade class planted a garden at school.',
      'They planted carrots, lettuce and tomatoes.',
      'Every week, a different team watered the plants.',
      'One week nobody watered them and the lettuce wilted.',
      'After that they made a calendar so they would not forget.',
      'At the end of the year they made a salad for everyone.',
    ],
    questions: [
      q('que', '¿Qué pasó cuando nadie regó?', 'What happened when nobody watered?', o('las lechugas se marchitaron', 'the lettuce wilted'), o('las plantas crecieron más', 'the plants grew more'), o('salieron flores', 'flowers came out')),
      q('porque', '¿Para qué hicieron un calendario?', 'Why did they make a calendar?', o('para no olvidar regar', 'so they would not forget to water'), o('para contar las vacaciones', 'to count the holidays'), o('para hacer dibujos', 'to make drawings')),
      q('que', '¿Qué prepararon al final del año?', 'What did they make at the end of the year?', o('una ensalada', 'a salad'), o('un pastel', 'a cake'), o('una sopa', 'a soup')),
    ],
  },
  {
    id: 'faro', age: '7-9', pic: '🌊', title: { es: 'Luz en la tormenta', en: 'Light in the storm' },
    es: [
      'Don Ramón cuida el faro de un pueblo junto al mar.',
      'Una noche hubo una tormenta y se fue la luz en todo el pueblo.',
      'Don Ramón subió las escaleras del faro con una linterna.',
      'Encendió la lámpara de emergencia.',
      'Un barco de pescadores vio la luz y llegó a salvo al puerto.',
      'Al día siguiente, los pescadores le llevaron pescado fresco para agradecerle.',
    ],
    en: [
      'Don Ramón looks after the lighthouse of a town by the sea.',
      'One night there was a storm and the whole town lost power.',
      'Don Ramón climbed the lighthouse stairs with a flashlight.',
      'He turned on the emergency lamp.',
      'A fishing boat saw the light and reached the harbor safely.',
      'The next day, the fishermen brought him fresh fish to thank him.',
    ],
    questions: [
      q('quien', '¿Qué cuida Don Ramón?', 'What does Don Ramón look after?', o('un faro', 'a lighthouse'), o('un barco', 'a boat'), o('una escuela', 'a school')),
      q('porque', '¿Por qué fue importante encender la lámpara?', 'Why was it important to turn on the lamp?', o('para que el barco llegara a salvo', 'so the boat could arrive safely'), o('para leer un libro', 'to read a book'), o('para ver la televisión', 'to watch TV')),
      q('que', '¿Cómo le agradecieron los pescadores?', 'How did the fishermen thank him?', o('con pescado fresco', 'with fresh fish'), o('con una carta', 'with a letter'), o('con una fiesta', 'with a party')),
    ],
  },
];

export const storiesFor = (age: Age): Story[] => STORIES.filter((s) => s.age === age);
