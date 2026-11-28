// Browser check for "Colorea tu dibujo": a grown-up adds a photo in Padres, it becomes lines,
// is saved, shows first when colouring, the bucket fills it, and two fingers zoom.
// Run `npm run build && npm run preview` first, then `node scripts/mypic-check.mjs`.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = process.argv[2] ?? 'e2e-shots';
mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = (process.env.APP_URL ?? 'http://localhost:4390/') + '?e2e';
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: 'tablet', width: 1194, height: 834, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
  { name: 'laptop', width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1 },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const problems = [];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--mute-audio'] });

for (const vp of VIEWPORTS) {
  const page = await browser.newPage();
  page.on('console', (m) => m.type() === 'error' && problems.push(`[${vp.name}] console: ${m.text()}`));
  page.on('pageerror', (e) => problems.push(`[${vp.name}] pageerror: ${e.message}`));
  await page.setViewport(vp);
  await page.evaluateOnNewDocument(() => {
    const speak = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = (u) => { u.volume = 0; speak(u); };
  });
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('playhour-pics'); indexedDB.deleteDatabase('punto-y-magia'); });
  await page.reload({ waitUntil: 'networkidle0' });
  const shot = (n) => page.screenshot({ path: `${OUT}/${vp.name}-mypic-${n}.png` });
  const clickText = async (sel, text) => {
    const ok = await page.evaluate((s, t) => { const el = [...document.querySelectorAll(s)].find((e) => e.textContent.includes(t)); if (el) el.click(); return !!el; }, sel, text);
    if (!ok) problems.push(`[${vp.name}] not found: ${sel} "${text}"`);
    await sleep(300);
  };
  await clickText('button', 'Empezar');

  // A "photo" of a child's drawing: grey paper with a shadow, a house, a sun and a tree in pencil.
  const fixture = `${OUT}/fixture-casa.png`;
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 1200;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 1600, 1200);
    g.addColorStop(0, '#EEE9DD'); g.addColorStop(1, '#A9A396');
    x.fillStyle = g; x.fillRect(0, 0, 1600, 1200);
    x.strokeStyle = '#4A4A52'; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(320, 640); x.lineTo(590, 420); x.lineTo(860, 640); x.stroke();
    x.strokeRect(370, 640, 440, 380); x.strokeRect(540, 800, 120, 220); x.strokeRect(410, 690, 90, 90);
    x.beginPath(); x.arc(1300, 240, 110, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(1120, 1020); x.lineTo(1120, 780); x.stroke();
    x.beginPath(); x.arc(1120, 640, 150, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(100, 1030); x.quadraticCurveTo(800, 980, 1500, 1040); x.stroke();
    return c.toDataURL('image/png');
  });
  writeFileSync(fixture, Buffer.from(dataUrl.split(',')[1], 'base64'));

  await page.evaluate(() => window.__pymShow('parents'));
  await sleep(500);
  await page.evaluate(() => document.querySelector('.mypics-card')?.scrollIntoView());
  await shot('1-parents');
  const [chooser] = await Promise.all([
    page.waitForFileChooser({ timeout: 5000 }),
    clickText('.mypics-card button', 'Subir imagen'),
  ]);
  await chooser.accept([fixture]);
  await page.waitForSelector('.mp-preview canvas', { timeout: 8000 }).catch(() => problems.push(`[${vp.name}] no line preview`));
  await sleep(300);
  await shot('2-lines');
  await clickText('button', 'Más líneas');
  await clickText('button', 'Menos líneas');
  await clickText('button', 'Se ve bien');
  await page.evaluate(() => { const i = document.querySelector('.mp-name'); i.value = 'Casa de prueba'; });
  await shot('3-name');
  await clickText('button', 'Guardar en Mis dibujos');
  await sleep(900);
  const saved = await page.evaluate(() => document.querySelectorAll('.mpic-row').length);
  if (saved !== 1) problems.push(`[${vp.name}] saved rows: ${saved}`);
  await shot('4-saved');

  // Colour it: it shows first in the gallery
  await page.evaluate(() => window.__pymShow('home'));
  await sleep(400);
  await clickText('.tile', 'Colorear');
  await page.waitForSelector('.pick-mine:not([hidden]) .pick-card', { timeout: 5000 }).catch(() => problems.push(`[${vp.name}] Mis dibujos not in gallery`));
  await shot('5-gallery');
  await page.evaluate(() => document.querySelector('.pick-mine .pick-card')?.click());
  await page.waitForFunction(() => document.querySelector('.apptitle')?.textContent.includes('Colorear'), { timeout: 8000 }).catch(() => problems.push(`[${vp.name}] colour screen did not open`));
  await sleep(500);
  await clickText('.tools button', 'Bote');
  const box = await page.evaluate(() => { const r = document.querySelector('.stage').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
  // inside the house walls: the 1600×1200 photo fits the stage square at 0.54× from (168, 126) on the board,
  // so photo point (750, 700), between the window and the door, is board (573, 504).
  const toScreen = (bx, by) => [box.x + ((bx - 150) / 900) * box.w, box.y + (by / 900) * box.h];
  const [hx, hy] = toScreen(573, 504);
  if (vp.hasTouch) await page.touchscreen.tap(hx, hy); else await page.mouse.click(hx, hy);
  await sleep(500);
  const filled = await page.evaluate(([x, y]) => {
    const cv = document.querySelector('.stage canvas:not(.minimap)');
    const r = cv.getBoundingClientRect();
    const px = Math.round(((x - r.left) / r.width) * cv.width), py = Math.round(((y - r.top) / r.height) * cv.height);
    const d = cv.getContext('2d').getImageData(px, py, 1, 1).data;
    return [d[0], d[1], d[2]];
  }, [hx, hy]);
  if (filled[0] > 240 && filled[1] > 240 && filled[2] > 240) problems.push(`[${vp.name}] bucket did not fill the house: ${filled}`);
  await shot('6-filled');

  // Zoom: two fingers (touch) or the wheel (laptop)
  if (vp.hasTouch) {
    const c = await page.target().createCDPSession();
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const pts = (d) => [{ x: cx - d, y: cy, id: 1 }, { x: cx + d, y: cy, id: 2 }];
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pts(30)[0]] });
    await sleep(60);
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts(30) });
    for (let d = 30; d <= 90; d += 10) {
      await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts(d) });
      await sleep(30);
    }
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(box.x + box.w / 2, box.y + box.h / 2);
    for (let i = 0; i < 5; i++) { await page.mouse.wheel({ deltaY: -100 }); await sleep(60); }
  }
  await sleep(400);
  const zoom = await page.evaluate(() => document.querySelector('.zoomchip')?.textContent ?? '');
  const barShown = await page.evaluate(() => !document.querySelector('.zoombar')?.hidden);
  if (!barShown) problems.push(`[${vp.name}] zoom bar not shown (zoom ${zoom})`);
  // the pinch must not have painted a stroke: the paint layer only has the bucket fill
  await shot('7-zoomed');
  console.log(vp.name, 'saved', saved, 'fill', filled.join(','), 'zoom', zoom);
  await clickText('button', 'Ver todo');
  const reset = await page.evaluate(() => document.querySelector('.zoombar')?.hidden);
  if (!reset) problems.push(`[${vp.name}] Ver todo did not reset`);

  // Ctrl+V in Padres opens "Nuevo dibujo" with the pasted image
  await page.evaluate(() => window.__pymShow('parents'));
  await sleep(400);
  await page.evaluate(async (url) => {
    const blob = await (await fetch(url)).blob();
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'pegada.png', { type: 'image/png' }));
    document.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
  }, dataUrl);
  await page.waitForSelector('.mp-preview canvas', { timeout: 8000 }).catch(() => problems.push(`[${vp.name}] paste did not open the new drawing`));
  await page.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'No console errors or problems.');
process.exit(problems.length ? 1 : 0);
