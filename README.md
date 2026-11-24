# Punto y Magia

App web instalable (PWA) para niñas y niños de 3 a 9 años: unir puntos, descubrir el dibujo, colorearlo con el dedo o con lápiz (Apple Pencil, S Pen) y aprender números, sumas, restas, multiplicaciones y divisiones, con voz en español e inglés.

Funciona sin conexión después de la primera visita. No tiene cuentas ni anuncios, y no envía datos: todo se guarda en el dispositivo.

## Cómo correrla

```bash
npm install
npm run dev        # servidor de desarrollo en http://localhost:5390 (también accesible desde la red local, para probar en tableta o celular)
npm test           # pruebas de la lógica (Vitest)
npm run build      # revisa tipos y genera dist/ con service worker
npm run preview    # sirve dist/ en http://localhost:4390
npm run e2e        # con preview corriendo: prueba en Chrome a tamaño celular, tableta y laptop; capturas en e2e-shots/
```

`npm run e2e` usa el Chrome instalado. Si está en otra ruta, defínela con `CHROME_PATH`.

## Qué incluye

- **Unir puntos** (actividad principal). Tres niveles por edad: 3–4 cuentan estrellas, 5–6 suman y restan hasta 20, 7–9 multiplican y dividen. Se puede elegir modo secuencia (1, 2, 3…) o "Resuelve y conecta", donde la operación indica el siguiente punto. La línea que une los puntos sigue la forma real del dibujo (curvas, púas, orejas).
- **Precisión amable.** Cada punto tiene un área de toque invisible (6–16 mm, ajustable) y la línea se pega sola al punto. Un punto equivocado solo tiembla y dice su número. Hay pistas que brillan y se repite la instrucción.
- **Veintiséis dibujos.** Personajes: Briz (erizo), Momu (alienígena), Las Resonantes (Nara, Mina y Kira) y Leo (cantante de la boy band Los Ecos). Objetos: Micrófono mágico, Lentes y Estrella. Casas: casa y granero. Carros: auto, auto de carreras, camioneta y autobús. Robots: Robi y Chispa. Animales: rana, pingüino y pez. Mandalas: flor, copo de nieve y sol. Los que aún no se descubren aparecen como siluetas.
  - En los dibujos de líneas rectas, los puntos siempre caen en las esquinas (`keyDots` en `src/content/extra.ts`).
- **Las Resonantes: cantan y cazan demonios.** Mina (cabello largo lacio y espada de luz), Nara (cabello corto) y Kira (cabello largo lacio), de cuerpo completo, estilo anime, con ropa futurista y micrófonos. Se unen por puntos y se colorean.
- **Palabras · Words.** Unas 290 palabras con dibujo en secciones por tema: números (1 al 20 y decenas hasta el 100), colores, formas, animales, comida, mi cuerpo, familia, ropa, en casa, naturaleza y clima, transporte, acciones, emociones, escuela, oficios, lugares, opuestos, días y meses, saludos y las palabras de cada dibujo descubierto. Cada palabra tiene un botón para oírla en español y otro en inglés, y cada sección un botón "Oír todas".
- **Juegos** (botón en Inicio). Cada juego se adapta a la edad y tiene un botón "Salir" que regresa al menú de juegos; el menú tiene "Inicio".
  - **Cuentas:** contar (3–4), sumas y restas hasta 10 con dibujos (5–6), sumas y restas hasta 100, multiplicaciones y divisiones (7–9), y "¿qué número falta?" (4 + ? = 5) desde los 5 años. El niño elige qué practicar.
  - **Ábaco:** una fila de 10 cuentas que cuenta en voz alta (3–4), dos filas hasta el 20 (5–6), centenas, decenas y unidades hasta 999 (7–9). También hay ábaco libre.
  - **Letras:** reconocer las letras del abecedario dentro de palabras con dibujo. 3–4: oír la palabra y tocar la letra con la que empieza; 5–6: completar la letra que falta; 7–9: letras que se parecen (b, d, p, q…) y tocar todas las veces que aparece una letra. Incluye un abecedario para tocar cada letra y oír su nombre con un ejemplo ("be, de ballena"); cada letra tiene varias palabras y en cada visita aparece otra. Se juega en español, o en inglés si la voz está en inglés.
  - **Adivina la palabra:** oír y tocar el dibujo (3–4), ver el dibujo y tocar la palabra (5–6), deletrear con letras (7–9, en el idioma que se practica).
  - **Crucigrama con dibujos:** las pistas son dibujos, colores y números; de 2 palabras casi resueltas (3–4) a 5 palabras desde cero (7–9).
  - **Laberinto:** se arrastra el dedo o se usan flechas; 4 × 3, 7 × 5 u 11 × 8 según la edad.
  - **Sudoku:** 4 × 4 con dibujos (3–4), 4 × 4 con números (5–6), 6 × 6 (7–9). Siempre con una sola solución.
  - **Trazos de luz:** seguir con el dedo una línea punteada (olas, montañas, círculo, corazón, estrella, espiral…, los números del 0 al 9 y el contorno de cada dibujo). La parte trazada se enciende con estrellitas de colores que se quedan fijas al soltar el dedo; hay 7 colores de luz (uno arcoíris) y botón para deshacer. Los pequeños tienen más margen para salirse de la línea.
  - **Destapa el dibujo:** tocar y frotar un papel de regalo que se rompe hasta descubrir un dibujo sorpresa; al final se puede colorear.
  - **Pinta por números:** cada parte del dibujo tiene un número y cada número su color. Modo Zonas (las partes del dibujo, con un fondo de burbujas, olas o arcos dividido en piezas para pintar) y modo Cuadritos (el dibujo en una cuadrícula). Para 3–4 años se usan figuras (corazón, círculo, rombo…) en lugar de números. Hasta 4, 6 u 8 colores según la edad; al terminar se guarda en el álbum.
  - **Gato:** dos jugadores en el mismo dispositivo, o contra **Robi**, un robot que juega solo (fácil, normal o difícil según la edad). No es en línea.
- **Edad y voz en Inicio.** Se ven y se cambian desde la pantalla de inicio. Debajo se explica qué se va a oír en cada modo.
- **Hoja para imprimir.** `public/colorear/las-resonantes.svg`, con las tres cantantes y pequeños demonios sombra, en blanco y negro y con líneas gruesas. Con la app corriendo se abre en `/colorear/las-resonantes.svg`.
  - `node scripts/singers.mjs` genera la hoja y también los tres dibujos de la app.
  - Los puntos se colocan sobre el contorno de cada cantante, que el script calcula con Chrome.
- **Colorear.** Crayón, plumón, bote, sellos y goma, con deshacer. El bote llena sólo la zona que se toca: el cabello, la falda o una bota.
  - Con lápiz, el grosor cambia con la presión y el crayón sombrea más ancho al inclinarlo.
  - Rechazo de palma automático, más una opción de "solo lápiz".
  - Opción para colorear solo dentro del dibujo.
- **Bilingüe.**
  - Números, colores, sellos y palabras del dibujo se dicen en español e inglés.
  - El adulto elige el orden: solo español, español → inglés, inglés → español o solo inglés.
  - "Dilo conmigo" practica la palabra en el segundo idioma.
  - Se elige automáticamente la mejor voz instalada (es‑MX, en‑US) y se descartan voces de broma. En el área de padres se puede elegir otra voz para cada idioma, probarla y ver cómo instalar voces de mejor calidad en Android y iPhone.
- **Área de padres.** Se abre manteniendo presionado el candado.
  - Progreso por habilidad, minutos por día y palabras escuchadas.
  - Edad, modo, idioma, tolerancia, pistas, tiempo de juego y preguntas "Para platicar juntos".
  - **Evaluación para padres:** 8 preguntas según la edad del niño (sueño, pantallas, idiomas, hitos, aprendizaje y emociones), con explicación y fuente (OMS, AAP, CDC, AASM), y recomendaciones según lo que el niño ha jugado. Es orientativa; no sustituye al pediatra.
  - Borrar el álbum o el progreso.
- **Tiempo de juego.** Al llegar al límite no hay cuenta regresiva: aparece una pantalla de noche y un adulto mantiene presionado para seguir.
- **Álbum** guardado en IndexedDB (máximo 40 dibujos).

## Estructura

```
src/
  core/        lógica sin interfaz: operaciones, juego de puntos, geometría, idiomas, voz, ajustes, progreso, álbum, temporizador
  content/     dibujos: contorno, cantidad de puntos por edad, detalles y vocabulario ES/EN
  render/      dibujo en canvas (tablero de 1200×900; el dibujo vive en una caja de 0–100)
  game/        partida en curso (se guarda para "Continuar")
  ui/          armazón de la app y pantallas (bienvenida, inicio, galería, puntos, colorear, álbum, padres)
design/        propuesta de diseño interactiva original
scripts/e2e.mjs  prueba de navegador
```

### Agregar un dibujo

En `src/content/characters.ts`:

1. Define el contorno.
   - Figuras redondeadas: usa `PolarShape`, un radio por cada ángulo.
   - Formas libres: usa `joinPath` con puntos y `arcPts`, como en los lentes y el auto.
2. Define la cantidad de puntos por edad.
3. Escribe una función `details` que dibuje en dos modos: relleno y solo línea.
4. Agrega el vocabulario ES/EN con tres palabras extra y tres preguntas para platicar.
5. Agrega la clave a `CharKey` y a `CHARACTER_ORDER`.

Las pruebas verifican que el dibujo tenga puntos bien separados y dentro de la caja.

## Publicación

La app se publica en GitHub Pages: https://victorstarkmar42.github.io/playtime/. Cada push a la rama `main` corre las pruebas, compila y publica con [.github/workflows/deploy.yml](.github/workflows/deploy.yml). La app instalada se actualiza la siguiente vez que se abre con internet.

Al abrir el enlace, Inicio ofrece **Instalar app** (en iPhone muestra los pasos de Safari). Cuando se publica una versión nueva, la app muestra "Hay una versión nueva · Actualizar".

Para instalarla a mano: en Android, Chrome → menú ⋮ → **Instalar app**; en iPhone o iPad, Safari → Compartir → **Agregar a pantalla de inicio**. Se abre a pantalla completa, sin la barra del navegador, y funciona sin internet.

## Trabajar con Codex

El proyecto incluye [AGENTS.md](AGENTS.md), que Codex lee automáticamente al abrir esta carpeta. Ahí están los comandos, dónde está cada cosa y las reglas del proyecto: textos en español, sólo personajes originales, adaptación por edad, sin envío de datos y pruebas que deben pasar antes de terminar.

Para usarlo, abre Codex (CLI, extensión de VS Code o app) en esta carpeta y pide el cambio en español, por ejemplo: "agrega un dibujo de un tren para colorear" o "haz el sudoku más fácil para 5–6 años". Al terminar, revisa que pasen `npm run typecheck`, `npm test` y `npm run build`.

## Personajes y licencias

Las Guerreras K‑pop (KPop Demon Hunters) y los Saja Boys, Sonic y Stitch pertenecen a Sony/Netflix, SEGA y Disney. La app usa personajes originales inspirados en esos arquetipos (Las Resonantes, Los Ecos, Briz, Momu). Usar personajes con licencia requiere un acuerdo con sus dueños.
