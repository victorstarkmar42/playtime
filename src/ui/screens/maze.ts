import { pop } from '../../core/audio';
import { canStep, DIRS, E, makeMaze, mazeSize, N, S, solveMaze, W, type Maze } from '../../core/puzzles';
import { settings } from '../../core/settings';
import type { Ctx, Screen } from '../context';
import { canvas, h } from '../dom';

const CELL = 90;
const PAD = 14;
const INK = '#22304F';

/** Laberinto: drag Briz (or use the arrows) from the top-left corner to the star. Size grows with age. */
export function mazeScreen(ctx: Ctx): Screen {
  const [w, h_] = mazeSize(settings.age);
  let maze: Maze;
  let trail: number[] = [0];
  let solved = 0;
  let won = false;
  const cv = canvas(w * CELL + PAD * 2, h_ * CELL + PAD * 2, 'mazecv');
  cv.setAttribute('aria-label', 'Laberinto');
  const c = cv.getContext('2d')!;
  const status = h('p', { class: 'gstatus', role: 'status' });
  const wrap = h('div', { class: 'mazeg' });
  const el = h('div', { class: 'view' }, wrap);

  const center = (i: number): [number, number] => [PAD + (i % w) * CELL + CELL / 2, PAD + Math.floor(i / w) * CELL + CELL / 2];

  function draw(): void {
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#fff';
    c.fillRect(0, 0, cv.width, cv.height);
    // trail
    c.lineCap = c.lineJoin = 'round';
    c.strokeStyle = '#FFC9A8';
    c.lineWidth = CELL * 0.32;
    c.beginPath();
    trail.forEach((i, k) => (k ? c.lineTo(...center(i)) : c.moveTo(...center(i))));
    c.stroke();
    // goal star
    const [gx, gy] = center(w * h_ - 1);
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? CELL * 0.15 : CELL * 0.34;
      c.lineTo(gx + r * Math.cos(a), gy + r * Math.sin(a));
    }
    c.closePath();
    c.fillStyle = '#FFD54A';
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = INK;
    c.stroke();
    // walls
    c.lineWidth = settings.age === '7-9' ? 7 : 9;
    c.strokeStyle = INK;
    c.beginPath();
    maze.walls.forEach((m, i) => {
      const x = PAD + (i % w) * CELL, y = PAD + Math.floor(i / w) * CELL;
      if (m & N) (c.moveTo(x, y), c.lineTo(x + CELL, y));
      if (m & W) (c.moveTo(x, y), c.lineTo(x, y + CELL));
      if (m & S) (c.moveTo(x, y + CELL), c.lineTo(x + CELL, y + CELL));
      if (m & E) (c.moveTo(x + CELL, y), c.lineTo(x + CELL, y + CELL));
    });
    c.stroke();
    // the walker: a round friendly face
    const [px, py] = center(trail[trail.length - 1]);
    c.beginPath();
    c.arc(px, py, CELL * 0.3, 0, Math.PI * 2);
    c.fillStyle = '#5DBB63';
    c.fill();
    c.lineWidth = 4;
    c.stroke();
    c.fillStyle = INK;
    for (const dx of [-0.1, 0.1]) {
      c.beginPath();
      c.arc(px + dx * CELL, py - 0.05 * CELL, CELL * 0.04, 0, Math.PI * 2);
      c.fill();
    }
    c.beginPath();
    c.arc(px, py + 0.04 * CELL, CELL * 0.1, 0.15 * Math.PI, 0.85 * Math.PI);
    c.lineWidth = 3;
    c.stroke();
  }

  function step(n: number): void {
    if (won) return;
    const cur = trail[trail.length - 1];
    if (trail.length > 1 && n === trail[trail.length - 2]) {
      trail.pop();
    } else if (canStep(maze, cur, n)) {
      trail.push(n);
      pop(420 + (trail.length % 8) * 30, 0.06);
    } else return;
    draw();
    if (n === w * h_ - 1) {
      won = true;
      solved++;
      pop(880, 0.35);
      status.textContent = `¡Llegaste a la estrella! · You made it! (${solved})`;
      ctx.sayPair('¡Llegaste a la estrella!', 'You made it to the star!');
      nextBtn.hidden = false;
    }
  }

  function move(dir: number): void {
    const cur = trail[trail.length - 1];
    const d = DIRS[dir];
    const x = (cur % w) + d.dx, y = Math.floor(cur / w) + d.dy;
    if (x >= 0 && y >= 0 && x < w && y < h_) step(y * w + x);
  }

  // drag: every cell the finger enters is a step (only if it is open and next to the walker)
  let dragging = false;
  const cellAt = (e: PointerEvent) => {
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * cv.width - PAD, y = ((e.clientY - r.top) / r.height) * cv.height - PAD;
    if (x < 0 || y < 0 || x >= w * CELL || y >= h_ * CELL) return -1;
    return Math.floor(y / CELL) * w + Math.floor(x / CELL);
  };
  cv.addEventListener('pointerdown', (e) => {
    dragging = true;
    cv.setPointerCapture(e.pointerId);
    const n = cellAt(e);
    if (n >= 0 && n !== trail[trail.length - 1]) step(n);
  });
  cv.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const n = cellAt(e);
    if (n >= 0 && n !== trail[trail.length - 1]) step(n);
  });
  const stop = () => (dragging = false);
  cv.addEventListener('pointerup', stop);
  cv.addEventListener('pointercancel', stop);
  const onKey = (e: KeyboardEvent) => {
    const k = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(e.key);
    if (k >= 0) (e.preventDefault(), move(k));
  };
  window.addEventListener('keydown', onKey);

  const arrow = (dir: number, label: string, txt: string) => h('button', { class: `marrow a${dir}`, 'aria-label': label, onClick: () => move(dir) }, txt);
  const nextBtn = h('button', { class: 'bigbtn', hidden: true, onClick: () => start() }, 'Otro laberinto · New maze');

  function start(): void {
    maze = makeMaze(w, h_);
    trail = [0];
    won = false;
    nextBtn.hidden = true;
    status.textContent = 'Lleva la carita hasta la estrella · Get to the star';
    draw();
    ctx.sayPair('Lleva la carita hasta la estrella', 'Take the face to the star');
  }

  wrap.append(
    h('div', { class: 'ghead' }, h('h2', null, 'Laberinto', h('small', null, 'Maze · Arrastra el dedo por el camino'))),
    status,
    h('div', { class: 'mazebox' }, h('div', { class: 'mazewrap', style: `--ar:${cv.width / cv.height}` }, cv),
      h('div', { class: 'marrows' }, arrow(0, 'Arriba', '▲'), arrow(3, 'Izquierda', '◀'), arrow(1, 'Derecha', '▶'), arrow(2, 'Abajo', '▼'))),
    h('div', { class: 'kbtnrow gbtns' }, nextBtn, h('button', { class: 'bigbtn alt small', onClick: () => ((trail = [0]), (won = false), draw()) }, 'Empezar de nuevo')),
  );
  start();
  // Automated browser tests (?e2e) need the way out.
  if (location.search.includes('e2e')) (window as unknown as { __pymMaze?: () => number[] }).__pymMaze = () => solveMaze(maze).map((c) => c);
  return { el, destroy: () => window.removeEventListener('keydown', onKey), onHelp: () => ctx.sayPair('Arrastra el dedo por el camino blanco.', 'Drag your finger along the white path.') };
}
