// Browser check for Sílabas → Familias: read a family, hear-and-pick against Robi, and complete words.
// Run `npm run build && npm run preview` first, then `node scripts/syllables-check.mjs`.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

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
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle0' });
  const shot = (n) => page.screenshot({ path: `${OUT}/${vp.name}-syl-${n}.png` });
  const clickText = async (sel, text) => {
    const ok = await page.evaluate((s, t) => { const el = [...document.querySelectorAll(s)].find((e) => e.textContent.includes(t)); if (el) el.click(); return !!el; }, sel, text);
    if (!ok) problems.push(`[${vp.name}] not found: ${sel} "${text}"`);
    await sleep(250);
  };
  await clickText('button', 'Empezar');
  await page.evaluate(() => window.__pymShow('syllables'));
  await sleep(400);
  await clickText('.syl-modes button', 'Familias');
  await shot('1-families');
  if (!(await page.evaluate(() => document.querySelectorAll('.fam-card').length >= 20))) problems.push(`[${vp.name}] few family cards`);

  // Lee la familia: t
  await clickText('.fam-card', 'ta te ti to tu');
  await shot('2-setup');
  await clickText('.fam-mode', 'Lee la familia');
  await clickText('button', '¡A jugar!');
  await shot('3-read');
  for (let i = 0; i < 5; i++) await page.evaluate((i) => document.querySelectorAll('.fam-read')[i].click(), i);
  await sleep(1200);
  for (let i = 0; i < 5; i++) await page.evaluate((i) => document.querySelectorAll('.fam-read')[i].click(), i);
  await sleep(1000);
  const readEnd = await page.evaluate(() => document.querySelector('.gend')?.textContent ?? '');
  if (!readEnd.includes('Leíste')) problems.push(`[${vp.name}] read did not finish: ${readEnd.slice(0, 40)}`);

  // Escucha y elige contra Robi: answer right away each round
  await clickText('.gend button', 'Escucha y elige');
  await page.evaluate(() => window.__pymBack?.());
  await sleep(300);
  // back from play goes to setup: choose Robi there
  if (!(await page.evaluate(() => !!document.querySelector('.fam-who')))) {
    // __pymBack may not exist: open setup again
    await page.evaluate(() => window.__pymShow('syllables'));
    await sleep(300);
    await clickText('.syl-modes button', 'Familias');
    await clickText('.fam-card', 'ta te ti to tu');
    await clickText('.fam-mode', 'Escucha y elige');
  }
  await clickText('.fam-whobtn', 'Contra Robi');
  await clickText('button', '¡A jugar!');
  await sleep(1500);
  await shot('4-robi');
  for (let r = 0; r < 6; r++) {
    // the right syllable is the one spoken: read it from the round via the "ok" check (try each)
    for (let k = 0; k < 10; k++) {
      const done = await page.evaluate(() => {
        if (document.querySelector('.syl-tile.ok, .syl-tile.robi')) return true;
        const b = [...document.querySelectorAll('.fam-choices .syl-tile')].find((x) => !x.disabled);
        b?.click();
        return !!document.querySelector('.syl-tile.ok, .syl-tile.robi');
      });
      if (done) break;
      await sleep(120);
    }
    await sleep(2800);
  }
  const vsEnd = await page.evaluate(() => document.querySelector('.gend')?.textContent ?? '');
  if (!vsEnd.includes('Robi')) problems.push(`[${vp.name}] robi game did not finish: ${vsEnd.slice(0, 50)}`);
  await shot('5-robi-end');

  // Completa la palabra: b / v (same sound, so no "Escucha y elige")
  await clickText('.gend button', 'Otra familia');
  await clickText('.fam-card', 'b / v');
  const modes = await page.evaluate(() => [...document.querySelectorAll('.fam-mode b')].map((b) => b.textContent));
  if (modes.includes('Escucha y elige')) problems.push(`[${vp.name}] b/v offers listening`);
  await clickText('.fam-whobtn', 'Solo');
  await clickText('button', '¡A jugar!');
  await sleep(500);
  await shot('6-complete');
  for (let r = 0; r < 6; r++) {
    for (let k = 0; k < 10; k++) {
      const done = await page.evaluate(() => {
        if (document.querySelector('.syl-tile.ok')) return true;
        [...document.querySelectorAll('.fam-choices .syl-tile')].find((x) => !x.disabled)?.click();
        return !!document.querySelector('.syl-tile.ok');
      });
      if (done) break;
      await sleep(80);
    }
    await sleep(2400);
  }
  const cEnd = await page.evaluate(() => document.querySelector('.gend')?.textContent ?? '');
  if (!cEnd.includes('al primer intento')) problems.push(`[${vp.name}] complete did not finish: ${cEnd.slice(0, 50)}`);
  console.log(vp.name, '|', readEnd.slice(0, 20), '|', vsEnd.slice(0, 40), '|', cEnd.slice(0, 30));
  await page.close();
}
await browser.close();
console.log(problems.length ? problems.join('\n') : 'No console errors or problems.');
process.exit(problems.length ? 1 : 0);
