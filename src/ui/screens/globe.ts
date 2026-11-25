import { CONTINENTS, COUNTRIES_SHOWN, type Continent, type Ring } from '../../content/world';
import { pop } from '../../core/audio';
import { continentAt, lonDelta } from '../../core/geo';
import { recordWord } from '../../core/progress';
import { settings } from '../../core/settings';
import type { Ctx, Screen } from '../context';
import { canvas, h } from '../dom';
import { exitBtn, progressDots, shake } from './gamekit';

const TW = 1024;
const TH = 512;
const G = 480; // globe canvas size
const R = G / 2 - 8;
const RAD = Math.PI / 180;
const OCEAN = '#3B8FD9';

const tx = (lon: number) => ((lon + 180) / 360) * TW;
const ty = (lat: number) => ((90 - lat) / 180) * TH;

/** Flat world map used as the globe's skin; the chosen continent is lighter with a white edge. */
function paintTexture(c: CanvasRenderingContext2D, selected: Continent | null): void {
  c.fillStyle = OCEAN;
  c.fillRect(0, 0, TW, TH);
  c.strokeStyle = 'rgba(255,255,255,.16)';
  c.lineWidth = 1;
  for (let lon = -180; lon < 180; lon += 30) {
    c.beginPath();
    c.moveTo(tx(lon), 0);
    c.lineTo(tx(lon), TH);
    c.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    c.beginPath();
    c.moveTo(0, ty(lat));
    c.lineTo(TW, ty(lat));
    c.stroke();
  }
  for (const ct of CONTINENTS) {
    const on = ct === selected;
    for (const ring of ct.rings) {
      c.beginPath();
      ring.forEach(([lon, lat], i) => (i ? c.lineTo(tx(lon), ty(lat)) : c.moveTo(tx(lon), ty(lat))));
      c.closePath();
      c.fillStyle = ct.color;
      c.fill();
      c.lineJoin = 'round';
      c.lineWidth = on ? 5 : 1.6;
      c.strokeStyle = on ? '#fff' : 'rgba(34,48,79,.55)';
      c.stroke();
      if (on) {
        c.fillStyle = 'rgba(255,255,255,.28)';
        c.fill();
      }
    }
  }
}

/** The continent alone, flat, for the info card (Antarctica seen from below the South Pole). */
function drawShape(cv: HTMLCanvasElement, ct: Continent): void {
  const c = cv.getContext('2d')!;
  c.clearRect(0, 0, cv.width, cv.height);
  const polar = ct.id === 'antartida';
  const wraps = ct.rings.some((r) => r.some(([lon]) => lon > 150)) && ct.rings.some((r) => r.some(([lon]) => lon < -150));
  const proj = ([lon, lat]: [number, number]): [number, number] =>
    polar ? [(90 + lat) * Math.sin(lon * RAD), (90 + lat) * Math.cos(lon * RAD)] : [wraps && lon < 0 ? lon + 360 : lon, -lat * 1.15];
  const rings: Ring[] = ct.rings.map((r) => r.filter(([, lat]) => !polar || lat > -89.9).map(proj));
  const all = rings.flat();
  const [x0, x1] = [Math.min(...all.map((p) => p[0])), Math.max(...all.map((p) => p[0]))];
  const [y0, y1] = [Math.min(...all.map((p) => p[1])), Math.max(...all.map((p) => p[1]))];
  const s = Math.min((cv.width - 20) / (x1 - x0), (cv.height - 20) / (y1 - y0));
  const ox = (cv.width - (x1 - x0) * s) / 2, oy = (cv.height - (y1 - y0) * s) / 2;
  for (const r of rings) {
    c.beginPath();
    r.forEach(([x, y], i) => (i ? c.lineTo(ox + (x - x0) * s, oy + (y - y0) * s) : c.moveTo(ox + (x - x0) * s, oy + (y - y0) * s)));
    c.closePath();
    c.fillStyle = ct.color;
    c.fill();
    c.lineWidth = 2.5;
    c.lineJoin = 'round';
    c.strokeStyle = '#22304F';
    c.stroke();
  }
}

/** Países del mundo: a globe that turns; touch a continent to see its shape, name and countries. */
export function globeScreen(ctx: Ctx): Screen {
  const age = settings.age;
  const tex = canvas(TW, TH).getContext('2d', { willReadFrequently: true })!;
  let texPx = new Uint32Array(TW * TH);
  const refreshTexture = (sel: Continent | null) => {
    paintTexture(tex, sel);
    texPx = new Uint32Array(tex.getImageData(0, 0, TW, TH).data.buffer);
  };
  refreshTexture(null);

  const globe = canvas(G, G, 'gl-globe');
  globe.setAttribute('aria-label', 'Globo terráqueo: toca un continente');
  const gctx = globe.getContext('2d')!;
  const out = gctx.createImageData(G, G);
  const out32 = new Uint32Array(out.data.buffer);

  // per-pixel lookup for the current tilt: which texture row, and the column before turning
  let tilt = 18;
  let lon0 = -95;
  let pix = new Int32Array(0), rows = new Int32Array(0), cols = new Float32Array(0);
  let tiltDirty = true;
  const precompute = () => {
    const s = Math.sin(tilt * RAD), c = Math.cos(tilt * RAD);
    const p: number[] = [], r: number[] = [], k: number[] = [];
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const x = (i + 0.5 - G / 2) / R, y = (G / 2 - j - 0.5) / R;
      const rr = x * x + y * y;
      if (rr > 1) continue;
      const z = Math.sqrt(1 - rr);
      const lat = Math.asin(Math.max(-1, Math.min(1, z * s + y * c))) / RAD;
      const dl = Math.atan2(x, z * c - y * s) / RAD;
      p.push(j * G + i);
      r.push(Math.min(TH - 1, Math.max(0, Math.floor(((90 - lat) / 180) * TH))));
      k.push(((dl + 180) / 360) * TW);
    }
    pix = Int32Array.from(p);
    rows = Int32Array.from(r);
    cols = Float32Array.from(k);
    tiltDirty = false;
  };

  const shade = gctx.createRadialGradient(G * 0.36, G * 0.32, R * 0.1, G / 2, G / 2, R);
  shade.addColorStop(0, 'rgba(255,255,255,.22)');
  shade.addColorStop(0.65, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(10,20,60,.38)');
  const render = () => {
    if (tiltDirty) precompute();
    out32.fill(0);
    const off = ((lon0 / 360) * TW) % TW;
    for (let n = 0; n < pix.length; n++) {
      let col = Math.floor(cols[n] + off) % TW;
      if (col < 0) col += TW;
      out32[pix[n]] = texPx[rows[n] * TW + col];
    }
    gctx.putImageData(out, 0, 0);
    gctx.beginPath();
    gctx.arc(G / 2, G / 2, R, 0, Math.PI * 2);
    gctx.fillStyle = shade;
    gctx.fill();
    gctx.lineWidth = 3;
    gctx.strokeStyle = 'rgba(34,48,79,.5)';
    gctx.stroke();
  };

  // --- info card ---
  const shape = canvas(320, 200, 'gl-shape');
  const name = h('h3', { class: 'gl-name' });
  const fact = h('p', { class: 'gl-fact' });
  const countHint = h('p', { class: 'gl-count' });
  const chips = h('div', { class: 'gl-chips' });
  const more = h('button', { class: 'bigbtn alt small', hidden: true });
  const info = h('div', { class: 'gl-info' },
    h('p', { class: 'gl-hint' }, age === '3-4' ? 'Toca un continente.' : 'Gira el globo con el dedo y toca un continente para ver su forma, su nombre y sus países.'));
  const status = h('p', { class: 'gstatus gl-status', role: 'status' });
  const dots = h('div');

  let selected: Continent | null = null;
  let quiz: { target: Continent; round: number; right: number } | null = null;

  const showCountries = (ct: Continent, all: boolean) => {
    const shown = all ? ct.countries : ct.countries.slice(0, COUNTRIES_SHOWN[age]);
    chips.replaceChildren(...shown.map(([es, en]) => h('button', { class: 'gl-chip', onClick: () => (ctx.sayPair(es, en), recordWord(en)) }, es)));
    more.hidden = all || shown.length >= ct.countries.length;
    more.textContent = `Ver los ${ct.countries.length} países`;
    more.onclick = () => showCountries(ct, true);
  };

  function select(ct: Continent, speak = true): void {
    selected = ct;
    refreshTexture(ct);
    turnTo(ct.center[0], Math.max(-55, Math.min(55, ct.center[1])));
    drawShape(shape, ct);
    name.replaceChildren(ct.es, h('small', null, ct.en));
    fact.textContent = ct.fact.es;
    const n = ct.countries.length;
    countHint.textContent = n ? (age === '3-4' ? `Algunos de sus países:` : `Tiene ${n} países. Toca uno para oír su nombre.`) : '';
    showCountries(ct, age === '7-9');
    info.replaceChildren(shape, name, fact, countHint, chips, more);
    recordWord(ct.en);
    if (speak) ctx.sayPair(`${ct.es}. ${age === '3-4' ? '' : ct.fact.es}${n && age !== '3-4' ? ` Tiene ${n} países.` : ''}`, `${ct.en}. ${age === '3-4' ? '' : ct.fact.en}`);
  }

  // --- turning ---
  let target: { lon: number; lat: number; from: [number, number]; t0: number } | null = null;
  const turnTo = (lon: number, lat: number) => (target = { lon, lat, from: [lon0, tilt], t0: performance.now() });
  let dragging = false;
  let idleSince = performance.now();
  let raf = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (target) {
      const t = Math.min(1, (now - target.t0) / 800);
      const e = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      lon0 = target.from[0] + lonDelta(target.from[0], target.lon) * e;
      const nt = target.from[1] + (target.lat - target.from[1]) * e;
      if (Math.abs(nt - tilt) > 0.05) (tilt = nt), (tiltDirty = true);
      if (t >= 1) target = null;
    } else if (!dragging && !settings.reduced && (!selected || now - idleSince > 12000)) {
      lon0 -= 9 * dt; // the globe turns west to east, like the Earth
    }
    render();
    raf = requestAnimationFrame(loop);
  };

  // drag to turn, tap to choose
  let down: { id: number; x: number; y: number; lon: number; tilt: number; moved: boolean } | null = null;
  globe.addEventListener('pointerdown', (e) => {
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, lon: lon0, tilt, moved: false };
    try { globe.setPointerCapture(e.pointerId); } catch { /* synthetic or ended pointer */ }
    target = null;
  });
  globe.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const k = G / globe.getBoundingClientRect().width;
    const dx = (e.clientX - down.x) * k, dy = (e.clientY - down.y) * k;
    if (!down.moved && Math.hypot(dx, dy) < 10) return;
    down.moved = true;
    dragging = true;
    lon0 = down.lon - (dx / R) * 57.3;
    const nt = Math.max(-60, Math.min(60, down.tilt + (dy / R) * 57.3));
    if (Math.abs(nt - tilt) > 0.3) (tilt = nt), (tiltDirty = true);
  });
  const up = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    const d = down;
    down = null;
    dragging = false;
    idleSince = performance.now();
    if (d.moved) return;
    const r = globe.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * G, y = ((e.clientY - r.top) / r.height) * G;
    const nx = (x - G / 2) / R, ny = (G / 2 - y) / R;
    const rr = nx * nx + ny * ny;
    if (rr > 1) return;
    const z = Math.sqrt(1 - rr), s = Math.sin(tilt * RAD), c = Math.cos(tilt * RAD);
    const lat = Math.asin(z * s + ny * c) / RAD;
    const lon = lon0 + Math.atan2(nx, z * c - ny * s) / RAD;
    const ct = continentAt(lon, lat);
    if (quiz) return answer(ct);
    if (!ct) {
      ctx.sayPair('Eso es el mar. Toca la tierra.', "That's the ocean. Touch the land.");
      return;
    }
    pop(620, 0.1);
    select(ct);
  };
  globe.addEventListener('pointerup', up);
  globe.addEventListener('pointercancel', () => ((down = null), (dragging = false)));

  // --- "¿Dónde está…?" game ---
  const ROUNDS = 5;
  const pool = () => CONTINENTS.filter((c) => age !== '3-4' || c.id !== 'antartida');
  const ask = () => {
    if (!quiz) return;
    const options = pool().filter((c) => c !== quiz!.target);
    quiz.target = options[Math.floor(Math.random() * options.length)];
    status.textContent = `¿Dónde está ${quiz.target.es}?`;
    dots.replaceChildren(progressDots(ROUNDS, quiz.round));
    ctx.sayPair(`¿Dónde está ${quiz.target.es}?`, `Where is ${quiz.target.en}?`);
  };
  function answer(ct: Continent | null): void {
    if (!quiz) return;
    if (ct === quiz.target) {
      pop(880, 0.15);
      select(ct, false);
      quiz.round++;
      quiz.right++;
      ctx.sayPair(`¡Sí! Esa es ${ct.es}.`, `Yes! That's ${ct.en}.`);
      if (quiz.round >= ROUNDS) {
        status.textContent = '¡Felicidades, encontraste todos!';
        dots.replaceChildren(progressDots(ROUNDS, ROUNDS, false));
        setTimeout(() => ctx.sayPair('¡Felicidades! Encontraste todos los continentes.', 'Congratulations! You found them all.'), 1600);
        quiz = null;
        quizBtn.textContent = 'Jugar otra vez';
        return;
      }
      setTimeout(ask, 1900);
    } else {
      shake(globe as unknown as HTMLElement);
      if (ct) ctx.sayPair(`Esa es ${ct.es}. Busca ${quiz.target.es}.`, `That's ${ct.en}. Find ${quiz.target.en}.`);
      else ctx.sayPair(`Eso es el mar. Busca ${quiz.target.es}.`, `That's the ocean. Find ${quiz.target.en}.`);
    }
  }
  const quizBtn = h('button', { class: 'bigbtn violet small', onClick: () => {
    quiz = { target: CONTINENTS[0], round: 0, right: 0 };
    quizBtn.textContent = 'Nueva ronda';
    ask();
  } }, '¿Dónde está?');

  const el = h('div', { class: 'view' },
    h('div', { class: 'globeg' },
      h('div', { class: 'ghead' }, h('h2', null, 'Países del mundo', h('small', null, 'Countries of the world')), quizBtn, exitBtn(ctx)),
      h('div', { class: 'gl-main' },
        h('div', { class: 'gl-stage' }, globe, h('div', { class: 'gl-q' }, status, dots)),
        info)));
  raf = requestAnimationFrame(loop);
  ctx.sayPair(age === '3-4' ? 'Este es el planeta Tierra. Toca un continente.' : 'Este es el planeta Tierra. Gíralo con el dedo y toca un continente.', 'This is planet Earth. Touch a continent.');

  if (location.search.includes('e2e')) {
    (window as unknown as { __pymGlobe?: (id: string) => string }).__pymGlobe = (id) => {
      const ct = CONTINENTS.find((c) => c.id === id)!;
      select(ct, false);
      return name.textContent ?? '';
    };
  }
  return {
    el,
    destroy: () => cancelAnimationFrame(raf),
    onHelp: () => ctx.sayPair('Gira el globo con el dedo. Toca un continente para oír su nombre y ver sus países.', 'Spin the globe and touch a continent to hear its name.'),
  };
}
