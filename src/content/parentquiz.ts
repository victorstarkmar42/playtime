import type { Age } from '../core/types';

export interface ParentQuestion {
  q: string;
  options: string[];
  /** Index of the right option. */
  answer: number;
  /** Why, shown after answering. */
  why: string;
  /** Short public source. */
  src: string;
}

/**
 * Self-check for parents: what is useful to know for a child of this age (sleep, screens, language,
 * milestones, learning, emotions). Based on public recommendations (WHO, AAP, CDC, AASM).
 * It is a guide, not a diagnosis.
 */
export const PARENT_QUIZ: Record<Age, ParentQuestion[]> = {
  '3-4': [
    {
      q: '¿Cuántas horas de sueño al día (contando siestas) se recomiendan entre los 3 y los 5 años?',
      options: ['7 a 8 horas', '10 a 13 horas', '14 a 17 horas'],
      answer: 1,
      why: 'Entre 3 y 5 años se recomiendan de 10 a 13 horas en 24 horas, incluidas las siestas. Dormir bien ayuda a la atención, el ánimo y la memoria.',
      src: 'AASM, respaldada por la AAP',
    },
    {
      q: '¿Cuánto tiempo de pantalla se recomienda a esta edad?',
      options: ['Sin límite si el contenido es educativo', 'Máximo 1 hora al día, de buena calidad y de preferencia acompañado', 'Unas 3 horas, repartidas en el día'],
      answer: 1,
      why: 'Entre 2 y 5 años se recomienda no pasar de 1 hora al día, y menos es mejor. Verlo juntos y platicar sobre lo que ven lo hace más útil.',
      src: 'OMS y AAP',
    },
    {
      q: 'Tu hijo aprende español e inglés y a veces mezcla palabras de los dos. ¿Qué significa?',
      options: ['Que se está confundiendo y hay que dejar un idioma', 'Es normal: mezclar es parte de aprender dos idiomas y no causa retraso del lenguaje', 'Que debe esperar a los 7 años para el segundo idioma'],
      answer: 1,
      why: 'Mezclar idiomas es común y normal en niños bilingües. Aprender dos idiomas no causa retraso del lenguaje. Lo importante es que oiga mucho de ambos.',
      src: 'AAP y ASHA',
    },
    {
      q: 'Cerca de los 4 años, ¿qué es esperable para la mayoría de los niños?',
      options: ['Leer cuentos sin ayuda', 'Nombrar algunos colores y decir frases de 4 palabras o más', 'Sumar números de dos cifras'],
      answer: 1,
      why: 'A los 4 años la mayoría nombra algunos colores, dice frases de 4 o más palabras y cuenta lo que pasó en su día. Leer solo llega más adelante.',
      src: 'CDC, hitos del desarrollo',
    },
    {
      q: '¿Qué elogio ayuda más a que siga intentando?',
      options: ['"¡Qué inteligente eres!"', '"Te esforzaste mucho en ese dibujo, probaste muchos colores"', 'No elogiar, para que no se acostumbre'],
      answer: 1,
      why: 'Reconocer el esfuerzo y lo que hizo (y no sólo "eres listo") ayuda a que el niño siga intentando cuando algo cuesta.',
      src: 'Investigación sobre mentalidad de crecimiento (C. Dweck)',
    },
    {
      q: '¿Cuál es la mejor forma de practicar el conteo a esta edad?',
      options: ['Memorizar los números hasta el 100 cuanto antes', 'Contar objetos reales tocándolos uno por uno en juegos de todos los días', 'Hacer planas de números'],
      answer: 1,
      why: 'Contar tocando cada objeto (uno a uno) enseña que cada número es una cantidad. Juguetes, escalones y frutas sirven mejor que memorizar.',
      src: 'Educación matemática temprana',
    },
    {
      q: 'Tu hijo hace un berrinche porque no quiere irse del parque. ¿Qué ayuda más?',
      options: ['Es señal de un problema grave', 'Mantener la calma, nombrar lo que siente ("estás enojado porque querías jugar") y sostener el límite', 'Darle lo que pide para que se calme rápido'],
      answer: 1,
      why: 'Los berrinches son comunes a esta edad. Nombrar la emoción le enseña a reconocerla, y sostener el límite con calma le da seguridad.',
      src: 'AAP (HealthyChildren.org)',
    },
    {
      q: '¿Cuánta actividad física necesitan los niños de 3 a 4 años?',
      options: ['30 minutos a la semana', 'Al menos 3 horas al día de movimiento y juego, repartidas', 'Sólo los fines de semana'],
      answer: 1,
      why: 'Se recomiendan al menos 180 minutos al día de actividad física variada, de los cuales al menos 60 sean de juego intenso (correr, saltar).',
      src: 'OMS',
    },
  ],
  '5-6': [
    {
      q: '¿Cuántas horas de sueño se recomiendan a partir de los 6 años?',
      options: ['6 a 8 horas', '9 a 12 horas', '14 a 16 horas'],
      answer: 1,
      why: 'De 6 a 12 años se recomiendan de 9 a 12 horas (a los 5 años, todavía de 10 a 13). Una rutina fija para dormir ayuda mucho.',
      src: 'AASM, respaldada por la AAP',
    },
    {
      q: 'Cerca de los 5 años, ¿qué es esperable para la mayoría de los niños?',
      options: ['Leer libros por capítulos', 'Contar hasta 10, reconocer algunos números y escribir algunas letras de su nombre', 'Multiplicar'],
      answer: 1,
      why: 'A los 5 años la mayoría cuenta hasta 10, reconoce algunos números del 1 al 5, escribe algunas letras de su nombre y reconoce rimas sencillas.',
      src: 'CDC, hitos del desarrollo',
    },
    {
      q: '¿Qué ayuda más a prepararse para leer?',
      options: ['Hacer planas largas todos los días', 'Jugar con los sonidos de las palabras (rimas, "¿con qué letra empieza?") y leer juntos', 'Esperar a que la escuela haga todo'],
      answer: 1,
      why: 'Jugar con los sonidos (conciencia fonológica) y leer juntos a diario son de lo que más ayuda para aprender a leer.',
      src: 'AAP y National Reading Panel',
    },
    {
      q: 'Al empezar con las sumas, ¿qué conviene?',
      options: ['Que use objetos, dedos o un ábaco antes de pasar a la cuenta escrita', 'Que memorice resultados sin entenderlos', 'Prohibir los dedos porque es "trampa"'],
      answer: 0,
      why: 'Primero se entiende con cosas que se pueden tocar (objetos, dedos, ábaco); luego con dibujos; y al final con números escritos. Usar los dedos es una buena estrategia.',
      src: 'Educación matemática (de lo concreto a lo abstracto)',
    },
    {
      q: 'Tu hijo se equivoca en una tarea. ¿Qué es más útil?',
      options: ['Corregir cada error de inmediato y con firmeza', 'Preguntar "¿cómo lo pensaste?" y tratar el error como parte de aprender', 'Hacerlo por él para que no se equivoque'],
      answer: 1,
      why: 'Preguntar cómo lo pensó le ayuda a encontrar el error por sí mismo, y le enseña que equivocarse es parte de aprender.',
      src: 'Investigación sobre mentalidad de crecimiento',
    },
    {
      q: '¿Cuánta actividad física necesita un niño de 6 años?',
      options: ['Al menos 60 minutos diarios de actividad moderada a intensa', '1 hora a la semana', 'No hace falta si ya va a la escuela'],
      answer: 0,
      why: 'De los 5 a los 17 años se recomienda en promedio al menos 60 minutos al día de actividad moderada a intensa.',
      src: 'OMS',
    },
    {
      q: '¿Qué regla de pantallas es la más recomendable?',
      options: ['Dejar la tablet en su cuarto para que se duerma', 'Un plan familiar con horarios, sin pantallas en las comidas ni antes de dormir', 'Sin reglas, para que aprenda a regularse solo'],
      answer: 1,
      why: 'Un plan familiar con límites claros, sin pantallas en el cuarto, en las comidas ni antes de dormir, protege el sueño y la convivencia.',
      src: 'AAP, plan familiar de medios',
    },
    {
      q: 'Tu hijo llora porque perdió un juego. ¿Qué ayuda más?',
      options: ['Decirle "no llores, no es para tanto"', 'Ayudarle a nombrar lo que siente y pensar juntos qué hacer la próxima vez', 'Dejar de jugar juegos con ganadores'],
      answer: 1,
      why: 'Ponerle nombre a la emoción y buscar soluciones juntos desarrolla la autorregulación. Perder en juegos seguros es una buena práctica.',
      src: 'Aprendizaje socioemocional (CASEL)',
    },
  ],
  '7-9': [
    {
      q: '¿Cuántas horas de sueño se recomiendan entre los 6 y los 12 años?',
      options: ['7 horas o menos', '9 a 12 horas', '13 a 15 horas'],
      answer: 1,
      why: 'Se recomiendan de 9 a 12 horas. Dormir poco afecta la atención, el ánimo y el rendimiento escolar.',
      src: 'AASM, respaldada por la AAP',
    },
    {
      q: '¿Cómo conviene aprender las tablas de multiplicar?',
      options: ['Memorizarlas sin explicación', 'Primero entender que multiplicar es juntar grupos iguales (arreglos, saltos) y luego practicar', 'Usar siempre la calculadora'],
      answer: 1,
      why: 'Entender qué significa (por ejemplo, 3 × 4 son 3 grupos de 4) y después practicar hace que se memoricen mejor y se apliquen en problemas.',
      src: 'Educación matemática',
    },
    {
      q: '¿Cuál es el mejor apoyo con la tarea?',
      options: ['Hacerla por él cuando se atora', 'Rutina y lugar tranquilo; estar disponible, pero que él la haga', 'Sentarse a su lado corrigiendo cada cosa'],
      answer: 1,
      why: 'Una rutina y un lugar tranquilo, con un adulto disponible para orientar (no para resolver), favorecen la autonomía y la responsabilidad.',
      src: 'Recomendaciones de participación familiar en la escuela',
    },
    {
      q: 'Tu hijo ya lee solo. ¿Conviene seguir leyendo con él?',
      options: ['No, ya no hace falta', 'Sí: leer juntos y platicar de la historia sigue mejorando el vocabulario y la comprensión', 'Sólo los libros de la escuela'],
      answer: 1,
      why: 'Leer juntos después de que el niño ya lee solo sigue aumentando su vocabulario, su comprensión y el gusto por leer.',
      src: 'AAP y estudios de lectura compartida',
    },
    {
      q: '¿Cuánta actividad física necesita a esta edad?',
      options: ['Al menos 60 minutos diarios de actividad moderada a intensa', '20 minutos a la semana', 'La clase de educación física basta'],
      answer: 0,
      why: 'En promedio, al menos 60 minutos diarios, y actividades que fortalezcan músculos y huesos al menos 3 días por semana.',
      src: 'OMS',
    },
    {
      q: '¿Qué es lo más recomendable sobre internet a esta edad?',
      options: ['Darle sus propias redes sociales para que aprenda', 'Controles parentales, acompañarlo, y enseñarle a no compartir datos ni hablar con desconocidos', 'No hablar del tema para no darle ideas'],
      answer: 1,
      why: 'La mayoría de las redes sociales piden mínimo 13 años. Acompañar, usar controles y hablar de seguridad en línea lo protege.',
      src: 'AAP y términos de uso de las plataformas',
    },
    {
      q: 'Tu hijo dice "soy malo para las mates". ¿Qué le ayuda más?',
      options: ['"Sí, a mí tampoco se me daban"', 'Enseñarle a decir "todavía no me sale" y reconocer su esfuerzo y sus estrategias', 'Quitarle las mates difíciles'],
      answer: 1,
      why: 'Cambiar "no puedo" por "todavía no" y valorar el esfuerzo y las estrategias mejora la perseverancia. Evite transmitir que las mates "no se le dan" a la familia.',
      src: 'Investigación sobre mentalidad de crecimiento',
    },
    {
      q: '¿Deben tener tareas en casa a esta edad?',
      options: ['No, sólo deben jugar y estudiar', 'Sí, tareas sencillas para su edad (poner la mesa, ordenar su cuarto) fomentan la autonomía', 'Sí, las mismas que un adulto'],
      answer: 1,
      why: 'Las tareas de casa acordes a su edad desarrollan responsabilidad, autonomía y sentido de pertenencia a la familia.',
      src: 'AAP (HealthyChildren.org)',
    },
  ],
};

export const QUIZ_NOTE =
  'Guía orientativa basada en recomendaciones públicas (OMS, AAP, CDC, AASM). No es un diagnóstico ni sustituye a su pediatra: si algo del desarrollo de su hijo le preocupa, consúltelo.';
