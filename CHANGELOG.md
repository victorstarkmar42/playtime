# Cambios

## 0.6.0 — 2026-11-23

- Nuevo juego **Letras** en Juegos, para reconocer el abecedario dentro de palabras: la letra con la que empieza (3–4), la letra que falta (5–6), letras que se parecen y buscar todas las letras de una palabra (7–9). Incluye un **abecedario** con la ñ, para tocar cada letra y oír su nombre con un ejemplo.
- **Dibujos aún más grandes** en Unir puntos y Colorear: el lienzo se acerca solo a cada dibujo, según su tamaño real, en lugar de mostrar los márgenes de su caja. En celular el dibujo ocupa casi todo el recuadro.
- **Íconos PNG** para instalar la app: Android ofrece "Instalar app" (con ícono adaptable) y el iPhone muestra el ícono en la pantalla de inicio.
- La **tecla de retroceso** del celular ya no cierra la app: regresa dentro de ella (juego → menú de juegos → Inicio; colorear → galería) y en Inicio se queda. Para salir hay que cerrar la app desde el celular.

## 0.5.0 — 2026-11-23

- **Dibujos más grandes** en Unir puntos y Colorear: el lienzo ahora es cuadrado y el dibujo lo llena. En celular vertical se ve un tercio más grande y en tableta horizontal un 20 % más.
- **Palabras por secciones:** 16 temas con dibujo (formas, animales, comida, mi cuerpo, familia, ropa, en casa, naturaleza y clima, transporte, acciones, emociones, saludos, además de números, colores y las palabras de tus dibujos) y un botón "Oír todas".
- **Diseño responsivo revisado** en celular, celular horizontal, tableta y laptop:
  - El laberinto ya no se sale de la pantalla en tableta vertical; las flechas quedan debajo.
  - El sudoku 6 × 6 ya no aplasta la primera fila.
  - El crucigrama de 7–9 años cabe completo en celular.
  - Botones del área de padres más fáciles de tocar.

## 0.4.0 — 2026-11-23

- Nuevo botón **Juegos** en Inicio, con siete juegos que se adaptan a la edad: Cuentas, Ábaco, Adivina la palabra, Crucigrama con dibujos, Laberinto, Sudoku y Gato.
- **Cuentas:** sumas, restas, multiplicaciones y divisiones como juego propio, con dibujos de apoyo para los pequeños. Antes sólo aparecían dentro de Unir puntos ("Resuelve y conecta").
- **Ábaco** para contar: una fila, dos filas o valor posicional (centenas, decenas, unidades), según la edad.
- **Gato** para dos jugadores en el mismo dispositivo o contra la compu, con dificultad según la edad.
- Cada juego tiene un botón **Salir** visible.
- **Evaluación para padres** en el área de padres, con preguntas para la edad del niño y recomendaciones según su progreso.

## 0.3.0 — 2026-11-23

- **Estrella** de cinco puntas con carita, dividida en diez caras para colorear con dos tonos.
- **Casas:** casa (con chimenea y jardín) y granero.
- **Carros:** auto de carreras, camioneta y autobús, junto al auto que ya existía.
- **Mandalas para relajarse:** flor, copo de nieve y sol, con muchas zonas para el bote de pintura.
- Mina y Kira (versión cabeza) ahora tienen cabello largo lacio, igual que en concierto.
- En las casas y los carros los puntos caen siempre en las esquinas; si la edad pide menos puntos que esquinas, se quitan las menos importantes.

## 0.2.0 — 2026-11-22

- Las Resonantes completas: Mina (trenza) y Kira (dos chongos) junto a Nara, más el objeto Micrófono mágico. Nueve dibujos en total.
- Pantalla **Palabras · Words**: números, colores y las palabras de cada dibujo descubierto, con un botón para oírlas en español y otro en inglés.
- Edad y modo de voz visibles en Inicio, con explicación de lo que se va a oír. La edad se cambia sin entrar al área de padres.
- **Las Resonantes: cantan y cazan demonios.** Tres dibujos de cuerpo completo, estilo anime, con ropa futurista y micrófonos, para unir puntos y colorear: Mina (cabello largo lacio y espada de luz), Nara (cabello corto) y Kira (cabello largo lacio).
- Hoja para imprimir y colorear con las tres y pequeños demonios sombra: `public/colorear/las-resonantes.svg`. La hoja y los dibujos de la app salen del mismo archivo: `node scripts/singers.mjs`.
- El bote de pintura llena sólo la zona que se toca (cabello, falda, una bota), usando las líneas del dibujo como borde.
- Los servidores usan puertos fijos: 5390 (desarrollo) y 4390 (preview).

## 0.1.0 — 2026-11-22

Primera versión jugable (PWA).

- Unir puntos con tres niveles por edad, modo secuencia y "Resuelve y conecta" (contar, sumas, restas, multiplicaciones, divisiones).
- Seis dibujos: Briz, Momu, Nara, Leo (Los Ecos), Lentes y Auto. Galería con siluetas para los dibujos no descubiertos.
- Colorear con crayón, plumón, bote, sellos y goma; presión, inclinación y rechazo de palma para lápiz.
- Voz en español e inglés con cuatro modos de idioma, "Dilo conmigo" y elección automática de la mejor voz.
- Área de padres con progreso, ajustes, tiempo de juego y preguntas para platicar.
- Álbum local, partida que se puede continuar y funcionamiento sin conexión.
- Diseño adaptable a celular (vertical y horizontal), tableta y laptop.
