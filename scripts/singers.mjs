// Las Resonantes en concierto: three original pop singers (Mina, Nara, Kira) in a modern anime style,
// futuristic outfits and microphones. One source of truth for:
//   - public/colorear/las-resonantes.svg  (printable black-and-white colouring page, thick lines)
//   - src/content/singers.gen.ts          (the same drawings for the app: art ops + traced outline for dots)
// Run: node scripts/singers.mjs   (uses the installed Chrome to trace the outlines; set CHROME_PATH if needed)
import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const LW = 7; // main line width in figure pixels

// ---------- tiny op model: every shape is SVG path data + a fill role + an optional stroke ----------
// role: which colour it gets in the app's coloured version (null = no fill, 'black' stays black).
const I = [1, 0, 0, 1, 0, 0];
const mul = (A, B) => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];
const T = (x, y) => [1, 0, 0, 1, x, y];
const S = (sx, sy = sx) => [sx, 0, 0, sy, 0, 0];
const R = (deg) => { const a = (deg * Math.PI) / 180; return [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]; };
const g = (m, ...ops) => ops.flat(Infinity).map((o) => ({ ...o, m: mul(m, o.m ?? I) }));

const P = (d, f = 'white', w = LW) => ({ d, f, w });
const L = (d, w = LW) => ({ d, f: null, w }); // line only
const tube = (d, f, t) => ({ d, f, w: 0, t }); // outlined limb
const ellD = (x, y, rx, ry) => `M${x - rx} ${y} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
const C = (x, y, r, f = 'white', w = LW) => P(ellD(x, y, r, r), f, w);
const E = (x, y, rx, ry, f = 'white', w = LW) => P(ellD(x, y, rx, ry), f, w);
const mirror = (...ops) => g(S(-1, 1), ...ops);

function starD(x, y, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)} ${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}
const star = (x, y, r, f = 'accent', w = LW) => P(starD(x, y, r), f, w);
const heart = (x, y, s, f = 'accent') => P(`M${x} ${y + s * 0.9} C${x - s * 1.3} ${y} ${x - s * 0.7} ${y - s * 0.9} ${x} ${y - s * 0.3} C${x + s * 0.7} ${y - s * 0.9} ${x + s * 1.3} ${y} ${x} ${y + s * 0.9} Z`, f);
const bolt = (x, y, s) => P(`M${x + 0.2 * s} ${y - s} L${x - 0.6 * s} ${y + 0.1 * s} L${x - 0.05 * s} ${y + 0.1 * s} L${x - 0.25 * s} ${y + s} L${x + 0.6 * s} ${y - 0.15 * s} L${x + 0.05 * s} ${y - 0.15 * s} Z`, 'accent');
const note = (x, y, s = 1) => g(mul(T(x, y), mul(S(s), R(-12))), E(0, 0, 14, 10), L('M13 -2 L13 -52 L34 -40'));
const sparkle = (x, y, r) => P(`M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`);

/** Handheld microphone, head centred on (x, y), tilted by `rot` degrees. */
const mic = (x, y, rot) => g(mul(T(x, y), R(rot)),
  P('M-11 22 L11 22 L7 88 Q0 94 -7 88 Z', 'suit2'),
  P('M-14 16 L14 16 L12 30 L-12 30 Z', 'accent'),
  C(0, 0, 21, 'metal'),
  L('M-15 -10 L15 10 M-15 10 L15 -10 M-20 0 L20 0 M0 -20 L0 20', 4),
  C(0, 60, 4, 'accent', 4));

// ---------- shared body parts (local coords: x = 0 is the centre, ground at y ≈ 856) ----------
const legs = [tube('M-24 640 L-28 792', 'legs', 40), tube('M24 640 L28 792', 'legs', 40)];
const bootOne = [P('M-60 762 L-6 762 L-4 826 L2 836 L2 856 L-70 856 L-70 834 Q-64 826 -60 812 Z', 'boots'), L('M-62 788 L-5 788 M-69 838 L1 838'), L('M-48 800 L-20 800', 4)];
const boots = [bootOne, mirror(bootOne)];
const torso = [
  P('M-60 398 Q-70 470 -54 520 L54 520 Q70 470 60 398 Q0 384 -60 398 Z', 'suit'),
  L('M-44 428 Q-50 468 -42 506 M44 428 Q50 468 42 506', 4),
  P('M-56 506 L56 506 L56 526 L-56 526 Z', 'suit2'),
  P('M-12 504 L12 504 L16 516 L12 528 L-12 528 L-16 516 Z', 'accent'),
];
const collar = L('M-28 390 L-38 420 L0 434 L38 420 L28 390');
const neck = P('M-15 352 L-15 400 L15 400 L15 352 Z', 'skin');
const padOne = [P('M-40 404 Q-58 384 -84 398 Q-100 414 -90 432 Q-66 438 -44 426 Z', 'suit2'), L('M-58 400 L-74 428', 4)];
const pads = [padOne, mirror(padOne)];
const face = P('M-80 245 C-82 318 -42 366 0 370 C42 366 82 318 80 245 C80 160 -80 160 -80 245 Z', 'skin');
const blush = L('M-62 318 L-56 308 M-52 320 L-46 310 M-42 322 L-36 312 M62 318 L56 308 M52 320 L46 310 M42 322 L36 312', 4);
function eyes({ wink = false } = {}) {
  const one = (sx) => [
    E(36 * sx, 294, 17, 22, 'eye'),
    E(36 * sx, 299, 9, 12, 'black'),
    C(36 * sx - 5, 289, 5, 'white', 0),
    C(36 * sx + 5, 305, 2.5, 'white', 0),
    L(`M${62 * sx} 276 Q${36 * sx} 256 ${12 * sx} 274`, 10),
    L(`M${62 * sx} 276 L${70 * sx} 268`, 6),
  ];
  const closed = [L('M14 296 Q36 280 58 296', 9), L('M58 296 L66 290', 6)];
  return [one(-1), wink ? closed : one(1), L('M-1 318 L3 323', 4)];
}
const smile = P('M-14 336 Q0 354 14 336 Z', 'mouth', 5);
const singing = [E(0, 341, 10, 12, 'mouth', 5)];
const brows = L('M-50 252 Q-36 246 -22 252 M22 252 Q36 246 50 252', 5);
function arm(points) {
  const d = 'M' + points.map((q) => q.join(' ')).join(' L');
  const [hx, hy] = points[points.length - 1];
  return [tube(d, 'suit', 30), C(hx, hy, 17, 'skin'), L(`M${hx - 15} ${hy - 13} L${hx - 4} ${hy - 20}`, 4)];
}
const up = (...ops) => [legs, boots, g(T(0, 50), ...ops)];

/** Long straight hair falling behind the back to the waist. */
const longHairBack = [
  P('M-98 250 C-102 136 102 136 98 250 L112 540 Q96 556 80 544 L60 552 L-60 552 L-80 544 Q-96 556 -112 540 Z', 'hair'),
  L('M-104 330 L-106 520 M104 330 L106 520', 4),
];
/** Side lock over the shoulder (screen-left; mirror for the other side). */
const sideLock = [P('M-84 252 Q-92 300 -94 470 Q-82 482 -70 470 Q-68 330 -64 268 Z', 'hair'), L('M-80 300 L-82 450', 4)];

/** Light sword held at (x, y): grip in the hand, blade pointing up, tilted by rot. */
const sword = (x, y, rot) => g(mul(T(x, y), R(rot)),
  P('M-12 -14 L-12 -190 L0 -224 L12 -190 L12 -14 Z', 'metal'),
  L('M0 -26 L0 -196', 4),
  P('M-7 -2 L7 -2 L7 42 L-7 42 Z', 'suit2'),
  C(0, 50, 9, 'accent'),
  P('M-34 -16 L34 -16 Q40 -6 34 4 L-34 4 Q-40 -6 -34 -16 Z', 'accent'),
  star(0, -6, 8, 'eye', 4));

/** A small, cute shadow demon (for the hunt on the printable page). */
const demon = (x, y, sc = 1, flip = 1) => g(mul(T(x, y), S(sc * flip, sc)),
  P('M-20 -26 L-16 -52 L-6 -30 Z'), P('M20 -26 L16 -52 L6 -30 Z'),
  L('M30 14 Q58 12 54 -12'), P('M46 -14 L62 -20 L56 -4 Z'),
  P('M-34 20 Q-42 -36 0 -38 Q42 -36 34 20 Q30 36 18 30 Q10 42 0 32 Q-10 42 -18 30 Q-30 36 -34 20 Z'),
  C(-13, -8, 10), C(13, -8, 10), C(-11, -6, 4.5, 'black', 0), C(15, -6, 4.5, 'black', 0),
  E(0, 14, 6, 8, 'white', 5),
  L('M-34 4 L-50 -6 M34 4 L48 -8', 6));

// ---------- the three singers ----------
function mina() {
  const bangs = [P('M-86 256 C-94 156 94 156 86 256 L82 276 C62 222 12 212 -22 238 C-42 224 -66 240 -86 274 Z', 'hair'), L('M10 214 Q-2 236 -10 244 M40 222 Q50 238 56 252', 4)];
  const phones = [
    L('M-94 244 C-96 120 96 120 94 244', 12),
    P('M-104 236 L-80 236 Q-74 266 -80 296 L-104 296 Q-112 266 -104 236 Z', 'metal'),
    P('M104 236 L80 236 Q74 266 80 296 L104 296 Q112 266 104 236 Z', 'metal'),
    star(-92, 266, 9, 'accent', 4), star(92, 266, 9, 'accent', 4),
  ];
  const shorts = [P('M-56 522 L56 522 L66 600 L8 600 L0 566 L-8 600 L-66 600 Z', 'suit2'), L('M-60 586 L-6 586 M60 586 L6 586', 4)];
  return up(longHairBack, shorts, neck, torso, collar, star(0, 462, 24), sideLock, mirror(sideLock),
    sword(-120, 392, -12), arm([[-60, 414], [-108, 450], [-120, 392]]),
    face, blush, eyes(), brows, singing, bangs, phones,
    mic(66, 350, -28), arm([[60, 414], [120, 470], [92, 404]]), pads);
}

function nara() {
  const backHair = P('M-100 240 C-100 136 100 136 100 240 L106 352 Q88 368 72 346 L-72 346 Q-88 368 -106 352 Z', 'hair');
  const bangs = [
    P('M-88 254 C-96 152 96 152 88 254 L72 240 L58 266 L42 232 L20 260 L2 226 L-18 258 L-40 228 L-56 264 L-72 238 Z', 'hair'),
    P('M2 160 Q22 116 42 126 Q22 134 14 160', 'hair'),
    star(64, 196, 18),
  ];
  const skirt = [
    P('M-60 520 L60 520 L100 616 Q0 640 -100 616 Z', 'suit2'),
    L('M-94 600 Q0 622 94 600', 4),
    L('M-22 524 L-36 626 M22 524 L36 626', 4),
    ...[-70, -35, 0, 35, 70].map((x) => C(x, 612 - Math.abs(x) * 0.08, 5, 'accent', 4)),
  ];
  const fingers = [tube('M-130 276 L-142 240', 'skin', 12), tube('M-116 274 L-110 238', 'skin', 12)];
  return up(backHair, skirt, neck, torso, collar, heart(0, 462, 22),
    fingers, arm([[-60, 414], [-110, 362], [-122, 284]]),
    face, blush, eyes(), brows, smile, bangs,
    mic(66, 350, -28), arm([[60, 414], [120, 470], [92, 404]]), pads);
}

function kira() {
  const bangs = P('M-86 256 C-94 156 94 156 86 256 L86 262 Q70 236 56 258 Q42 234 28 256 Q14 232 0 256 Q-14 232 -28 256 Q-42 234 -56 258 Q-70 236 -86 262 Z', 'hair');
  const visor = [L('M-34 200 L34 200', 5), star(-44, 200, 20, 'eye'), star(44, 200, 20, 'eye')];
  const headset = [L('M84 284 Q86 330 34 344', 6), E(28, 344, 9, 7, 'metal'), P('M76 262 L92 262 L94 306 L78 306 Z', 'metal')];
  const skirt = [
    P('M-58 520 L58 520 L90 604 L-90 604 Z', 'suit2'),
    L('M-30 522 L-46 604 M0 522 L0 604 M30 522 L46 604', 4),
    L('M-86 590 L86 590', 4),
  ];
  return up(longHairBack, skirt, neck, torso, collar, bolt(0, 462, 24), sideLock, mirror(sideLock),
    arm([[60, 414], [104, 452], [126, 506]]),
    face, blush, eyes({ wink: true }), brows, singing, bangs, visor, headset,
    mic(-150, 252, 18), arm([[-60, 414], [-110, 380], [-142, 318]]), pads);
}

const FIGURES = { mina: g(I, mina()), nara: g(I, nara()), kira: g(I, kira()) };

// ---------- printable SVG page ----------
const fmt = (n) => +n.toFixed(3);
function opSvg(o, black = '#000') {
  const tr = o.m && o.m.join() !== I.join() ? ` transform="matrix(${o.m.map(fmt).join(' ')})"` : '';
  if (o.t) return `<path d="${o.d}"${tr} fill="none" stroke="${black}" stroke-width="${o.t + 2 * LW}"/><path d="${o.d}"${tr} fill="none" stroke="#fff" stroke-width="${o.t}"/>`;
  const fill = o.f === null ? 'none' : o.f === 'black' ? black : '#fff';
  const stroke = o.w ? ` stroke-width="${o.w}"` : ' stroke="none"';
  return `<path d="${o.d}"${tr} fill="${fill}"${stroke}/>`;
}
const background = [
  L('M0 868 L1200 868', 8),
  L('M-10 900 Q600 840 1210 900'),
  ...[[40, 1], [1160, -1]].map(([x, dir]) => g(mul(T(x, 150), mul(S(dir, 1), R(-30))),
    P('M-24 -46 L24 -46 L30 20 L-30 20 Z'), E(0, 20, 30, 10), L('M0 -46 L0 -80'), L('M-40 50 L-56 78 M0 46 L0 82 M40 50 L56 78', 5))),
  star(130, 60, 26), star(1070, 60, 26), star(420, 160, 18), star(790, 160, 20), star(1150, 540, 22), star(50, 520, 22),
  note(1130, 420, 1), note(760, 280, 0.8),
  demon(90, 790, 1.1), demon(470, 700, 0.9, -1), demon(755, 720, 0.9), demon(1110, 800, 1.05, -1), demon(1120, 300, 0.8, -1),
  sparkle(300, 200, 22), sparkle(920, 230, 22), sparkle(600, 170, 16), sparkle(1150, 740, 18), sparkle(40, 700, 18),
  heart(370, 820, 16), heart(830, 820, 16),
].flat(Infinity);
const pageOps = [
  ...background,
  ...g(mul(T(250, 18), S(0.96)), FIGURES.mina),
  ...g(mul(T(970, 18), S(0.96)), FIGURES.kira),
  ...g(T(600, 0), FIGURES.nara),
];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900">
<title>Las Resonantes — dibujo para colorear</title>
<rect width="1200" height="900" fill="#fff"/>
<g fill="#fff" stroke="#000" stroke-width="${LW}" stroke-linejoin="round" stroke-linecap="round">
<text x="600" y="82" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="66" letter-spacing="4" stroke-width="5">LAS RESONANTES</text>
<text x="600" y="124" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="3" fill="#000" stroke="none">CANTAN Y CAZAN DEMONIOS</text>
${pageOps.map((o) => opSvg(o)).join('\n')}
</g>
</svg>
`;
mkdirSync('public/colorear', { recursive: true });
writeFileSync('public/colorear/las-resonantes.svg', svg);
console.log('wrote public/colorear/las-resonantes.svg');

// ---------- trace each figure's outer outline in Chrome (for the dots) ----------
const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
const traced = {};
for (const [key, ops] of Object.entries(FIGURES)) {
  traced[key] = await page.evaluate((ops, LW, PAD, INSET) => {
    const W = 640, H = 1000, OX = 320; // figure x = 0 sits at canvas x = OX
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.lineJoin = 'round'; c.lineCap = 'round';
    for (const o of ops) {
      const [a, b, cc, d, e, f] = o.m;
      c.setTransform(a, b, cc, d, e + OX, f);
      const p = new Path2D(o.d);
      if (o.f) { c.fill(p); c.lineWidth = 2 * PAD; c.stroke(p); }
      if (o.w) { c.lineWidth = o.w + 2 * PAD; c.stroke(p); }
      if (o.t) { c.lineWidth = o.t + 2 * LW + 2 * PAD; c.stroke(p); }
    }
    const px = c.getImageData(0, 0, W, H).data;
    const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && px[(y * W + x) * 4 + 3] > 127;
    // bounding box and start pixel (topmost, then leftmost)
    let minX = W, maxX = 0, minY = H, maxY = 0, sx = -1, sy = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (on(x, y)) {
      if (sx < 0) { sx = x; sy = y; }
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    // Moore-neighbour tracing of the outer boundary (clockwise on screen)
    const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
    const pts = [[sx, sy]];
    let cx = sx, cy = sy, back = 4; // we "came from" the left
    for (let guard = 0; guard < 200000; guard++) {
      let found = false;
      for (let k = 1; k <= 8; k++) {
        const dIdx = (back + k) % 8;
        const nx = cx + dirs[dIdx][0], ny = cy + dirs[dIdx][1];
        if (on(nx, ny)) { back = (dIdx + 4) % 8; cx = nx; cy = ny; found = true; break; }
      }
      if (!found || (cx === sx && cy === sy)) break;
      pts.push([cx, cy]);
    }
    // Morphological closing: the silhouette was grown by PAD (which fills narrow gaps, e.g. between
    // a sword and the head); now walk the smooth contour back inwards by INSET along its normals.
    // The traversal is clockwise on screen, so the inside is on the right: (-dy, dx).
    {
      const n = pts.length, k = 6;
      const moved = pts.map((q, i) => {
        const a = pts[(i - k + n) % n], b = pts[(i + k) % n];
        const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        return [q[0] - (dy / len) * INSET, q[1] + (dx / len) * INSET];
      });
      pts.splice(0, n, ...moved);
      minX = Math.min(...pts.map((q) => q[0])); maxX = Math.max(...pts.map((q) => q[0]));
      minY = Math.min(...pts.map((q) => q[1])); maxY = Math.max(...pts.map((q) => q[1]));
    }
    // Ramer–Douglas–Peucker simplification
    const rdp = (p, eps) => {
      if (p.length < 3) return p;
      const [ax, ay] = p[0], [bx, by] = p[p.length - 1];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      let idx = 0, best = 0;
      for (let i = 1; i < p.length - 1; i++) {
        const dd = Math.abs((bx - ax) * (ay - p[i][1]) - (ax - p[i][0]) * (by - ay)) / len;
        if (dd > best) { best = dd; idx = i; }
      }
      return best > eps ? [...rdp(p.slice(0, idx + 1), eps).slice(0, -1), ...rdp(p.slice(idx), eps)] : [p[0], p[p.length - 1]];
    };
    const half = Math.floor(pts.length / 2);
    const simple = [...rdp(pts.slice(0, half + 1), 2.5).slice(0, -1), ...rdp([...pts.slice(half), pts[0]], 2.5).slice(0, -1)];
    return { simple, minX, maxX, minY, maxY, OX, raw: pts.length };
  }, ops, LW, 36, 22);
}
await browser.close();

// ---------- app module ----------
const PALETTES = {
  mina: { skin: '#F7D1B0', hair: '#5B3FA8', suit: '#4AA3F0', suit2: '#2F5FB3', legs: '#3A3F6B', boots: '#FFFFFF', accent: '#F2B91C', metal: '#D5DCEA', eye: '#6E56CF', mouth: '#E8506E', white: '#FFFFFF', black: '#22304F' },
  nara: { skin: '#F5C7A0', hair: '#FF8AB8', suit: '#FFFFFF', suit2: '#E2456F', legs: '#6E56CF', boots: '#E2456F', accent: '#F2B91C', metal: '#D5DCEA', eye: '#3FA35B', mouth: '#E8506E', white: '#FFFFFF', black: '#22304F' },
  kira: { skin: '#F0C29A', hair: '#E2456F', suit: '#2EC4B6', suit2: '#6E56CF', legs: '#22304F', boots: '#FFD54A', accent: '#FFD54A', metal: '#D5DCEA', eye: '#7FD3FF', mouth: '#E8506E', white: '#FFFFFF', black: '#22304F' },
};
const BOX_H = 91, TOP = 5;
const out = {};
for (const [key, tr] of Object.entries(traced)) {
  const s = BOX_H / (tr.maxY - tr.minY);
  const cxC = (tr.minX + tr.maxX) / 2;
  const matrix = [s, 0, 0, s, 50 + s * (tr.OX - cxC), TOP - s * tr.minY];
  const toBox = ([x, y]) => [fmt(50 + s * (x - cxC)), fmt(TOP + s * (y - tr.minY))];
  out[key] = {
    matrix: matrix.map(fmt),
    palette: PALETTES[key],
    outline: tr.simple.map(toBox),
    ops: FIGURES[key].map((o) => ({ d: o.d, f: o.f, w: o.w, ...(o.t ? { t: o.t } : {}), m: o.m.map(fmt) })),
  };
  console.log(key, 'outline points', tr.simple.length, '(raw', tr.raw + ')', 'width', fmt((tr.maxX - tr.minX) * s), 'box units');
}
const ts = `// Generated by scripts/singers.mjs — do not edit by hand.
import type { ArtData } from '../render/art';

export const SINGER_ART: Record<'mina' | 'nara' | 'kira', ArtData> = ${JSON.stringify(out)};
`;
writeFileSync('src/content/singers.gen.ts', ts);
console.log('wrote src/content/singers.gen.ts', ts.length, 'bytes');
