# Guía para agentes (Codex)

PlayHour es una PWA para niñas y niños de 3 a 9 años, hecha con TypeScript sin frameworks, Vite, Canvas 2D y vite-plugin-pwa. Lee primero el [README](README.md).

## Comandos

```bash
npm install
npm run dev        # http://localhost:5390
npm run typecheck  # tsc --noEmit
npm test           # Vitest, lógica en src/core/core.test.ts
npm run build      # tipos + dist/ con service worker
npm run preview    # http://localhost:4390
npm run e2e        # con preview corriendo; Chrome en 4 tamaños de pantalla, capturas en e2e-shots/
```

Antes de dar un cambio por terminado: `npm run typecheck`, `npm test` y `npm run build` deben pasar. Si tocaste pantallas, corre también `npm run e2e`; debe terminar con "No console errors or problems".

## Dónde está cada cosa

- `src/core/`: lógica sin interfaz (operaciones, gato, adivinanzas, letras, ábaco, laberinto, sudoku, crucigrama, idiomas, voz, ajustes, progreso). Aquí van las pruebas.
- `src/content/`: dibujos (`characters.ts`, `extra.ts`), vocabulario ES/EN, secciones de palabras con dibujo (`wordbank.ts`) y preguntas para padres (`parentquiz.ts`).
- `src/render/`: canvas de 1200×900; el dibujo vive en una caja de 0–100.
- `src/ui/screens/`: una pantalla por archivo. Se registran en `src/ui/app.ts` y en `ScreenName` (`src/ui/context.ts`).
- `src/ui/pwa.ts`: tarjeta para instalar la app (Inicio) y barra "Hay una versión nueva" (el service worker usa `registerType: 'prompt'`).
- `src/core/rest.ts` y `src/ui/restbreak.ts`: descansos para los ojos y límite de juego, con planes "sin supervisión" y "con supervisión". Una pantalla con ronda cronometrada debe devolver `busy()` mientras corre, para que el descanso espere.
- `src/ui/fullscreen.ts`: pantalla completa.
- `src/core/shapes.ts` + `src/ui/screens/build.ts`: Construye con figuras.
- `src/content/world.ts` (continentes y países) + `src/core/geo.ts` + `src/ui/screens/globe.ts`: Países del mundo.
- Para la escuela: `src/content/stories.ts` + `src/ui/screens/stories.ts` (Cuentos), `src/core/syllables.ts` (Sílabas), `src/core/tables.ts` (Tablas, repaso espaciado guardado en `pym-tables`), `src/core/problems.ts` (Problemas). Cuentos y Sílabas usan el idioma principal de la voz (`primaryLang`), porque son lectura.
- `src/core/flood.ts`: bote de pintura y la máscara de "colorear dentro" (todo lo cerrado por líneas).
- Navegación (`src/ui/app.ts`): la barra superior tiene la flecha **Atrás** siempre en el mismo lugar, el título de la pantalla, Ayuda, Voz y el menú **Más** (Inicio, Dibujos, idioma y Padres con pulsación larga). La flecha y el botón atrás del celular usan la misma función: primero `screen.back()` (un paso dentro del juego; devuelve `false` si ya no hay pasos) y luego `backTarget`. No pongas botones "Salir" dentro de las pantallas.
- El título de la barra se toma del `h2` de `.ghead` (texto principal y `small`); ese `h2` no se muestra en la pantalla. Si una pantalla no tiene `.ghead`, agrega su título en `TITLES` de `app.ts`.
- `src/ui/screens/gamekit.ts`: `progressDots`, `shake`.
- `src/styles.css`: todos los estilos. Se adaptan con consultas de contenedor (`@container app`): vertical, ancho máximo de 600 px y 440 px, y alto máximo de 480 px.

## Reglas del proyecto

- Los textos que ve el usuario van en español. Las palabras que se practican van en español o inglés según `settings.lang` (usa `pickText`, `spellLang` y `ctx.sayPair`).
- Sólo personajes originales. No uses personajes, nombres ni arte con licencia.
- Todo se adapta a la edad (`settings.age`: `'3-4' | '5-6' | '7-9'`). Los niños de 3–4 años no leen: usa voz, dibujos y pocas opciones.
- Sin cuentas, anuncios ni envío de datos. Todo se guarda en `localStorage`, siempre con `readJSON`/`writeJSON` de `src/core/storage.ts`; si agregas un dato del niño, ponlo en `DATA_KEYS` para que entre en la copia de seguridad y, más adelante, en la sincronización.
- Los botones deben ser grandes y fáciles de tocar. Revisa celular, tableta y laptop.
- Usa el constructor DOM `h()` de `src/ui/dom.ts`, no innerHTML con datos.
- Al colorear, los rellenos blancos de `details` no tapan la pintura (las líneas se ponen encima como tinta). Aun así, en modo línea evita rellenos de color.
- Un dibujo nuevo necesita: contorno, cantidad de puntos por edad, `details`, vocabulario y su clave en `CharKey` y `CHARACTER_ORDER`. Las pruebas revisan la separación de los puntos.
- Anota los cambios visibles en `CHANGELOG.md` y actualiza el `README.md` si cambia lo que incluye la app.
- El código está en GitHub (rama `main`). Cada push a `main` publica la app en GitHub Pages con `.github/workflows/deploy.yml`.
- **Al terminar cada petición, pregunta siempre al usuario si desea subir los cambios** (commit y push a `main`, que los publica en la página). No hagas commits ni push sin que el usuario lo confirme en esa petición.
