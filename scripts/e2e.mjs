// Browser check: walks onboarding → gallery → dots → reveal → colour → album → parents at phone, tablet and laptop sizes.
// Run `npm run build && npm run preview` first, then `npm run e2e`. Screenshots go to ./e2e-shots.
import puppeteer from 'puppeteer-core';

import { mkdirSync } from 'node:fs';
const OUT = process.argv[2] ?? 'e2e-shots';
mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = (process.env.APP_URL ?? 'http://localhost:4390/') + '?e2e';
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'phone-land', width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablet', width: 1194, height: 834, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  { name: 'laptop', width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const problems = [];
for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`[${vp.name}] console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`[${vp.name}] pageerror: ${e.message}`));
  await page.setViewport(vp);
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('punto-y-magia'); });
  await page.reload({ waitUntil: 'networkidle0' });
  const shot = (n) => page.screenshot({ path: `${OUT}/${vp.name}-${n}.png` });
  const tap = async (x, y) => (vp.hasTouch ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
  const clickSel = async (sel) => {
    const ok = await page.evaluate((s) => { const el = document.querySelector(s); el?.click(); return !!el; }, sel);
    if (!ok) problems.push(`[${vp.name}] not found: ${sel}`);
    await sleep(250);
  };
  const clickText = async (sel, text) => {
    const ok = await page.evaluate((s, t) => { const el = [...document.querySelectorAll(s)].find((e) => e.textContent.includes(t)); if (el) el.click(); return !!el; }, sel, text);
    if (!ok) problems.push(`[${vp.name}] not found: ${sel} "${text}"`);
    await sleep(250);
  };

  await shot('1-onboarding');
  await clickText('button', 'Empezar');
  await shot('2-home');
  await clickText('.tile', 'Unir puntos');
  await shot('3-pick');
  /** Connects every dot of the drawing on screen (after one wrong touch) and returns the revealed title. */
  const solve = async (tag) => {
    const dots = await page.evaluate(() => window.__pymDots());
    await tap(dots[3][0], dots[3][1]);
    await sleep(120);
    for (let i = 0; i < dots.length; i++) {
      await tap(dots[i][0], dots[i][1]);
      await sleep(40);
      if (tag && i === Math.floor(dots.length / 2)) await shot(`${tag}-half`);
    }
    await sleep(1800);
    const progressText = await page.evaluate(() => document.querySelector('.prog span')?.textContent);
    const title = await page.evaluate(() => document.querySelector('.prompt')?.textContent);
    console.log(vp.name, 'dots', dots.length, 'progress', progressText, 'title', title);
    return title;
  };
  // pick "Auto" by name to exercise a free-form outline
  await clickSel('.pick-card[data-key="auto"]');
  await sleep(400);
  await shot('4-dots-start');
  await solve('5-dots');
  await shot('6-revealed');
  await clickText('button', '¡A colorear!');
  const box = await page.evaluate(() => { const r = document.querySelector('.stage canvas').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  await page.mouse.move(box.x + box.w * 0.3, box.y + box.h * 0.5);
  await page.mouse.down();
  for (let k = 0; k <= 20; k++) await page.mouse.move(box.x + box.w * (0.3 + k * 0.02), box.y + box.h * (0.5 + Math.sin(k / 3) * 0.1));
  await page.mouse.up();
  await clickText('.swatch', '');
  await shot('7-color');
  await clickText('button', 'Guardar');
  await sleep(500);
  await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
  await sleep(300);
  await clickText('.tile', 'Mi álbum');
  await sleep(500);
  const albumCount = await page.evaluate(() => document.querySelectorAll('.agrid figure').length);
  console.log(vp.name, 'album items', albumCount);
  await shot('8-album');
  // words: the revealed car must bring its words, each with ES and EN buttons
  await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
  await sleep(300);
  await clickText('.tile', 'Palabras');
  await sleep(300);
  const tabs = await page.evaluate(() => document.querySelectorAll('.wtab').length);
  if (tabs < 10) problems.push(`[${vp.name}] words has ${tabs} sections`);
  await clickText('.wtab', 'Animales');
  await shot('8b-words-animals');
  await clickText('.wtab', 'De tus dibujos');
  const words = await page.evaluate(() => ({ cards: document.querySelectorAll('.wcard').length, en: [...document.querySelectorAll('.wbtn.en')].map((b) => b.textContent) }));
  if (!words.en.some((t) => t.includes('car'))) problems.push(`[${vp.name}] words screen lacks "car"`);
  console.log(vp.name, 'word cards', words.cards);
  await shot('8b-words');
  // age: change it from the home screen without the parents' gate
  await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
  await sleep(300);
  await clickText('.hchip', 'Edad');
  await shot('8c-home-age');
  await clickText('.agepick button', '7–9');
  const age = await page.evaluate(() => JSON.parse(localStorage.getItem('pym-settings')).age);
  if (age !== '7-9') problems.push(`[${vp.name}] age did not change (${age})`);
  // games: tic-tac-toe against the computer (age is 7–9 now: hard level) and two players
  const goGames = async () => {
    await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
    await sleep(300);
    await clickText('.tile', 'Juegos');
  };
  await goGames();
  await shot('12-games');
  await clickText('.gtile-card', 'Gato');
  await shot('12-gato-modes');
  for (const m of ['Contra la compu', 'Dos jugadores']) {
    await clickText('.gmode', m);
    for (let k = 0; k < 12; k++) {
      const st = await page.evaluate(() => document.querySelector('.gstatus')?.textContent ?? '');
      if (/Ganó|Empate/.test(st)) break;
      await page.evaluate(() => [...document.querySelectorAll('.gcell')].find((b) => !b.disabled)?.click());
      await sleep(900);
    }
    const st = await page.evaluate(() => document.querySelector('.gstatus')?.textContent ?? '');
    console.log(vp.name, 'gato', m, '→', st);
    if (!/Ganó|Empate/.test(st)) problems.push(`[${vp.name}] gato (${m}) did not finish: ${st}`);
    await shot(`12-gato-${m === 'Dos jugadores' ? 'two' : 'cpu'}`);
    await clickText('button', 'Cambiar jugadores');
  }
  // guess the word, for each age: pick the picture / pick the word / spell (brute force on the tiles)
  for (const [age, label] of [['3-4', '3–4'], ['5-6', '5–6'], ['7-9', '7–9']]) {
    await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
    await sleep(300);
    await clickText('.hchip', 'Edad');
    await clickText('.agepick button', label);
    await clickText('.tile', 'Juegos');
    await clickText('.gtile-card', 'Adivina');
    for (let round = 0; round < 5; round++) {
      await page.evaluate(async () => {
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const title = document.querySelector('.ghead h2')?.firstChild?.textContent ?? '';
        const pics = [...document.querySelectorAll('.gopt.pic')];
        if (pics.length) {
          const want = title.replace('Busca: ', '');
          (pics.find((b) => b.getAttribute('aria-label') === want) ?? pics[0]).click();
          return;
        }
        const words = [...document.querySelectorAll('.gopt.word')];
        if (words.length) {
          for (const b of words) {
            if (document.querySelector('.guess.right')) return;
            b.click();
            await wait(60);
          }
          return;
        }
        for (let guard = 0; guard < 200 && !document.querySelector('.guess.right'); guard++) {
          const filled = document.querySelectorAll('.gslot.full').length;
          for (const t of document.querySelectorAll('.gtile:not(.used)')) {
            t.click();
            if (document.querySelectorAll('.gslot.full').length > filled) break;
          }
        }
      });
      if (round === 0) await shot(`13-guess-${age}`);
      await sleep(2100);
    }
    const end = await page.evaluate(() => document.querySelector('.gend')?.textContent ?? '');
    console.log(vp.name, 'guess', age, '→', end.slice(0, 60));
    if (!end.includes('de 5')) problems.push(`[${vp.name}] guess ${age} did not finish`);
  }
  await shot('13-guess-end');
  // math, abacus, maze, sudoku and crossword, for the oldest and (tablet) the youngest age
  const setAge = async (label) => {
    await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
    await sleep(300);
    await clickText('.hchip', 'Edad');
    await clickText('.agepick button', label);
  };
  const openGame = async (name) => {
    await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
    await sleep(300);
    await clickText('.tile', 'Juegos');
    await clickText('.gtile-card', name);
    await sleep(300);
  };
  for (const label of vp.name === 'tablet' ? ['7–9', '3–4'] : ['7–9']) {
    await setAge(label);
    const tag = label === '7–9' ? '79' : '34';
    // Cuentas: pick a kind if offered, then try options until right, 5 times
    await openGame('Cuentas');
    await page.evaluate(() => document.querySelector('.mkind')?.click());
    await sleep(300);
    await shot(`14-math-${tag}`);
    for (let r = 0; r < 5; r++) {
      await page.evaluate(async () => {
        for (const b of document.querySelectorAll('.mopt')) {
          if (document.querySelector('.mathg.right')) return;
          b.click();
          await new Promise((res) => setTimeout(res, 50));
        }
      });
      await sleep(1700);
    }
    const mathEnd = await page.evaluate(() => document.querySelector('.gend')?.textContent ?? '');
    if (!mathEnd.includes('de 5')) problems.push(`[${vp.name}] math ${tag} did not finish`);
    // Ábaco: read the target and set it
    await openGame('Ábaco');
    for (let r = 0; r < 5; r++) {
      await page.evaluate(() => {
        const target = +document.querySelector('.ghead h2').firstChild.textContent.replace(/\D/g, '');
        const rows = [...document.querySelectorAll('.awire')];
        const want = rows.length === 3 ? [Math.floor(target / 100), Math.floor(target / 10) % 10, target % 10] : rows.length === 2 ? [Math.min(10, target), Math.max(0, target - 10)] : [target];
        want.forEach((v, i) => {
          if (v > 0) document.querySelectorAll('.awire')[i].querySelectorAll('.bead')[v - 1].click();
        });
        [...document.querySelectorAll('.abottom button')].find((b) => b.textContent.includes('Listo'))?.click();
      });
      if (r === 0) await shot(`14-abacus-${tag}`);
      await sleep(1900);
    }
    const abEnd = await page.evaluate(() => document.querySelector('.gend')?.textContent ?? '');
    if (!abEnd.includes('5 de 5')) problems.push(`[${vp.name}] abacus ${tag}: ${abEnd.slice(0, 40)}`);
    // Laberinto: follow the way out with the arrow buttons
    await openGame('Laberinto');
    await shot(`14-maze-${tag}`);
    await page.evaluate(async () => {
      const path = window.__pymMaze();
      const w = path.length > 1 ? null : 0;
      for (let i = 1; i < path.length; i++) {
        const d = path[i] - path[i - 1];
        const dir = d === 1 ? 1 : d === -1 ? 3 : d > 0 ? 2 : 0;
        document.querySelector(`.marrow.a${dir}`).click();
        await new Promise((res) => setTimeout(res, 20));
      }
      return w;
    });
    await sleep(300);
    const mz = await page.evaluate(() => document.querySelector('.mazeg .gstatus').textContent);
    if (!mz.includes('Llegaste')) problems.push(`[${vp.name}] maze ${tag}: ${mz}`);
    await shot(`14-maze-${tag}-done`);
    // Sudoku: for every gap, try each symbol
    await openGame('Sudoku');
    await shot(`14-sudoku-${tag}`);
    await page.evaluate(() => {
      for (let guard = 0; guard < 60; guard++) {
        const gap = [...document.querySelectorAll('.scell')].find((c) => !c.disabled && !c.textContent && !c.querySelector('svg'));
        if (!gap) return;
        gap.click();
        const before = document.querySelectorAll('.scell svg').length + [...document.querySelectorAll('.scell')].filter((c) => c.textContent).length;
        for (const b of document.querySelectorAll('.spick')) {
          b.click();
          const now = document.querySelectorAll('.scell svg').length + [...document.querySelectorAll('.scell')].filter((c) => c.textContent).length;
          if (now > before) break;
        }
      }
    });
    const sd = await page.evaluate(() => document.querySelector('.sudokug .gstatus').textContent);
    if (!sd.includes('Resuelto')) problems.push(`[${vp.name}] sudoku ${tag}: ${sd}`);
    await shot(`14-sudoku-${tag}-done`);
    // Crucigrama: keep typing letters until each cell fills
    await openGame('Crucigrama');
    await shot(`14-cross-${tag}`);
    await page.evaluate(() => {
      for (let guard = 0; guard < 80; guard++) {
        const filled = () => [...document.querySelectorAll('.ccell')].filter((c) => c.lastChild?.nodeType === 3).length;
        if (document.querySelector('.crossg .gstatus').textContent.includes('completo')) return;
        const before = filled();
        for (const k of document.querySelectorAll('.ckeys .gtile')) {
          k.click();
          if (filled() > before) break;
        }
      }
    });
    const cr = await page.evaluate(() => document.querySelector('.crossg .gstatus').textContent);
    if (!cr.includes('completo')) problems.push(`[${vp.name}] crossword ${tag}: ${cr}`);
    await shot(`14-cross-${tag}-done`);
    // Letras: play 5 rounds by trying every choice, then open the alphabet
    await openGame('Letras');
    await clickText('.gmode', 'Jugar');
    for (let r = 0; r < 5; r++) {
      await sleep(300);
      if (r === 1) await shot(`14-letters-${tag}`);
      await page.evaluate(() => {
        for (const o of document.querySelectorAll('.lopt, .ltile.tap')) {
          if (document.querySelector('.lettersg.right')) break;
          o.click();
        }
      });
      await sleep(2300);
    }
    const lt = await page.evaluate(() => document.querySelector('.gend')?.textContent ?? '');
    if (!lt.includes('de 5')) problems.push(`[${vp.name}] letters ${tag}: ${lt.slice(0, 40)}`);
    await clickText('.gend button', 'Abecedario');
    const abc = await page.evaluate(() => document.querySelectorAll('.acard').length);
    if (abc < 26) problems.push(`[${vp.name}] alphabet has ${abc} letters`);
    await shot(`14-abc-${tag}`);
    console.log(vp.name, tag, 'letters', lt.slice(0, 14), 'abc', abc);
    console.log(vp.name, tag, 'math', mathEnd.slice(0, 12), '| abacus', abEnd.slice(0, 12), '| maze', mz.slice(0, 12), '| sudoku', sd, '| cross', cr.slice(0, 22));
  }
  // the new Resonantes drawings must be solvable too (tablet only, to keep the run short)
  if (vp.name === 'tablet') {
    for (const [key, name] of [['mina', 'Mina'], ['kira', 'Kira'], ['micro', 'micrófono'], ['minaPop', 'Mina'], ['kiraPop', 'Kira'], ['estrella', 'estrella'], ['casa', 'casa'], ['granero', 'granero'], ['carreras', 'carreras'], ['camioneta', 'camioneta'], ['autobus', 'autobús'], ['mandalaFlor', 'flor'], ['mandalaCopo', 'copo'], ['mandalaSol', 'sol'], ['naraPop', 'Nara']]) {
      await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
      await sleep(300);
      await clickText('.tile', 'Unir puntos');
      await clickSel(`.pick-card[data-key="${key}"]`);
      await sleep(400);
      await shot(`10-${key}-start`);
      const t = await solve();
      if (!t || !t.includes(name)) problems.push(`[${vp.name}] ${name} not revealed (${t})`);
      await shot(`10-${key}-revealed`);
    }
    // colour the last singer: one crayon stroke and two bucket taps (each should fill one area only)
    await clickText('button', '¡A colorear!');
    await clickText('button', 'Bote');
    const b2 = await page.evaluate(() => { const r = document.querySelector('.stage canvas').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
    const at = (bx, by) => tap(b2.x + (bx / 1200) * b2.w, b2.y + (by / 900) * b2.h);
    await at(600, 455); // jacket
    await sleep(300);
    await clickText('.swatch', '');
    await at(600, 290); // face/hair area
    await sleep(300);
    await shot('11-singer-bucket');
  }
  // parents: keyboard hold on the lock (Enter down 1.6 s)
  await page.focus('.appbar .gate');
  await page.keyboard.down('Enter');
  await sleep(1700);
  await page.keyboard.up('Enter');
  await sleep(300);
  await shot('9-parents');
  const hasParents = await page.evaluate(() => !!document.querySelector('.parents'));
  if (!hasParents) problems.push(`[${vp.name}] parents did not open`);
  await clickText('.parents button', 'evaluación');
  for (let q = 0; q < 8; q++) {
    await page.evaluate(() => document.querySelector('.popt')?.click());
    await sleep(100);
    if (q === 0) await shot('15-parentquiz');
    await page.evaluate(() => [...document.querySelectorAll('.pqcard .bigbtn')].find((b) => !b.hidden)?.click());
    await sleep(150);
  }
  const quiz = await page.evaluate(() => document.querySelector('.pquiz h2')?.textContent ?? '');
  if (!quiz.includes('de 8')) problems.push(`[${vp.name}] parent quiz: ${quiz}`);
  await shot('15-parentquiz-result');
  await clickText('.pquiz button', 'Volver a Padres');
  // phone back button: game → games menu → home → stays in the app
  await page.evaluate(() => document.querySelector('.appbar .ibtn').click());
  await clickText('.tile', 'Juegos');
  await clickText('.gtile-card', 'Laberinto');
  const where = () => page.evaluate(() => (document.querySelector('.mazeg') ? 'maze' : document.querySelector('.games') ? 'games' : document.querySelector('.home') ? 'home' : 'other') + ' ' + location.href);
  const trail = [await where()];
  for (let i = 0; i < 4; i++) {
    await page.goBack({ timeout: 3000 }).catch(() => {});
    await sleep(300);
    trail.push(await where());
  }
  console.log(vp.name, 'back:', trail.map((t) => t.split(' ')[0]).join(' → '));
  const kinds = trail.map((t) => t.split(' ')[0]);
  if (kinds.join() !== 'maze,games,home,home,home' || trail.some((t) => !t.includes('localhost'))) problems.push(`[${vp.name}] back button: ${trail.join(' | ')}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  if (overflow) problems.push(`[${vp.name}] horizontal overflow`);
  await page.close();
}
await browser.close();
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'No console errors or problems.');
process.exitCode = problems.length ? 1 : 0;
