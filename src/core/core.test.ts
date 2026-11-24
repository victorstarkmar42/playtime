import { describe, expect, it } from 'vitest';
import { CHARACTER_ORDER, CHARACTERS } from '../content/characters';
import { keyDots } from '../content/extra';
import { WORD_SECTIONS } from '../content/wordbank';
import { createGame, connectNext, hitTest } from './dotgame';
import { abacusFor, abacusValue, KINDS_FOR, mathQuestion, touchBead } from './arith';
import { floodRegion } from './flood';
import { canStep, countSolutions, makeCrossword, makeMaze, makeSudoku, mazeSize, solveMaze, sudokuAllows, sudokuFor } from './puzzles';
import { GUESS_POOL, makeRounds, spellable, spellTiles, wordOf, type GuessKind } from './guess';
import { dist, outwardNormals, perimeter, sampleByLength, type Pt } from './geometry';
import { pickText, practiceLang, speakOrder } from './lang';
import { evaluate, makeOp, makeOps, opWords, skillOf, type Op } from './math';
import { sanitizeSettings } from './settings';
import { AGES } from './types';
import { pickVoice } from './voice';
import { aiMove, emptyBoard, isFull, other, winner, type Cell, type Player } from './tictactoe';

/** Deterministic pseudo-random generator so failures are reproducible. */
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

describe('math', () => {
  it('every operation answers the number of its dot, for every age and many seeds', () => {
    for (const age of AGES) {
      for (let seed = 1; seed <= 200; seed++) {
        const rng = seeded(seed);
        for (let n = 1; n <= 40; n++) expect(evaluate(makeOp(n, age, rng))).toBe(n);
      }
    }
  });

  it('keeps 5–6 within 20, never negative, and only uses + and −', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = seeded(seed);
      for (let n = 2; n <= 20; n++) {
        const op = makeOp(n, '5-6', rng) as Extract<Op, { kind: 'calc' }>;
        expect(op.kind).toBe('calc');
        expect(['+', '−']).toContain(op.sym);
        expect(op.a).toBeGreaterThanOrEqual(0);
        expect(op.b).toBeGreaterThanOrEqual(1);
        expect(Math.max(op.a, op.b)).toBeLessThanOrEqual(20);
      }
    }
  });

  it('gives 7–9 exact divisions with dividends up to 100', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = seeded(seed);
      for (let n = 2; n <= 30; n++) {
        const op = makeOp(n, '7-9', rng);
        if (op.kind === 'calc' && op.sym === '÷') {
          expect(op.a % op.b).toBe(0);
          expect(op.a).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('asks 3–4 to count, and starts every drawing at 1', () => {
    expect(makeOp(1, '7-9')).toEqual({ kind: 'start' });
    expect(makeOp(6, '3-4')).toEqual({ kind: 'count', n: 6 });
    expect(makeOps(10, '5-6')).toHaveLength(11);
  });

  it('reads operations in both languages and maps them to skills', () => {
    const op: Op = { kind: 'calc', a: 12, sym: '÷', b: 3 };
    expect(opWords(op, 'es')).toBe('12 entre 3');
    expect(opWords(op, 'en')).toBe('12 divided by 3');
    expect(skillOf(op)).toBe('div');
    expect(skillOf({ kind: 'count', n: 3 })).toBe('count');
  });
});

describe('dot game', () => {
  const square: Pt[] = [[0, 0], [100, 0], [100, 100], [0, 100]];

  it('connects the next dot inside the touch area and finishes on the last', () => {
    const g = createGame(square);
    expect(hitTest(g, [5, 5], { hitR: 30, dotR: 10 })).toEqual({ type: 'connect' });
    connectNext(g);
    expect(hitTest(g, [92, 4], { hitR: 30, dotR: 10 })).toEqual({ type: 'connect' });
    connectNext(g);
    connectNext(g);
    expect(connectNext(g)).toBe(true);
    expect(g.done).toBe(true);
    expect(hitTest(g, [0, 0], { hitR: 30, dotR: 10 })).toEqual({ type: 'none' });
  });

  it('never jumps ahead while the finger rests on the dot just joined', () => {
    const close: Pt[] = [[0, 0], [20, 0], [40, 0]];
    const g = createGame(close, 1);
    // huge tolerance, but capped at 70 % of the 20-unit gap
    expect(hitTest(g, [1, 0], { hitR: 200, dotR: 4 })).toEqual({ type: 'none' });
    expect(hitTest(g, [15, 0], { hitR: 200, dotR: 4 })).toEqual({ type: 'connect' });
  });

  it('reports a wrong dot only when touched closely', () => {
    const g = createGame(square, 1);
    expect(hitTest(g, [100, 98], { hitR: 30, dotR: 10 })).toEqual({ type: 'wrong', index: 2 });
    expect(hitTest(g, [50, 50], { hitR: 30, dotR: 10 })).toEqual({ type: 'none' });
  });

  it('clamps restored progress', () => {
    expect(createGame(square, 99).connected).toBe(4);
    expect(createGame(square, 99).done).toBe(true);
    expect(createGame(square, -3).connected).toBe(0);
  });
});

describe('characters', () => {
  it('produce the configured number of dots for every age, inside the drawing box, well spaced', () => {
    for (const key of CHARACTER_ORDER) {
      const ch = CHARACTERS[key];
      for (const age of AGES) {
        const n = ch.counts[age];
        const dots = ch.dots(n);
        expect(dots, `${key} ${age}`).toHaveLength(n);
        for (const [x, y] of dots) {
          expect(x).toBeGreaterThanOrEqual(-2);
          expect(x).toBeLessThanOrEqual(102);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(100);
        }
        for (let i = 0; i < n; i++) expect(dist(dots[i], dots[(i + 1) % n]), `${key} ${age} gap ${i}`).toBeGreaterThan(1.5);
      }
    }
  });

  it('have bilingual vocabulary and talk prompts', () => {
    for (const key of CHARACTER_ORDER) {
      const v = CHARACTERS[key].vocab;
      expect(v.es && v.en && v.titleEs && v.titleEn).toBeTruthy();
      expect(v.extra.length).toBeGreaterThanOrEqual(3);
      expect(v.talk.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('points dot numbers outside the outline whichever way it is drawn', () => {
    const cw: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    const ccw = [...cw].reverse();
    for (const poly of [cw, ccw]) {
      const ns = outwardNormals(poly);
      poly.forEach(([x, y], i) => {
        // moving along the normal goes away from the centre (5, 5)
        expect(Math.hypot(x + ns[i][0] - 5, y + ns[i][1] - 5)).toBeGreaterThan(Math.hypot(x - 5, y - 5));
      });
    }
  });

  it('samples a polyline evenly by length', () => {
    const sq: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
    expect(perimeter(sq)).toBe(40);
    const pts = sampleByLength(sq, 8);
    expect(pts[0]).toEqual([0, 0]);
    expect(pts[2]).toEqual([10, 0]);
    expect(pts[5]).toEqual([5, 10]);
  });
});

describe('languages and voices', () => {
  it('speaks one phrase per language in the chosen order', () => {
    expect(speakOrder('es-en', 'verde', 'green')).toEqual([{ t: 'verde', lang: 'es' }, { t: 'green', lang: 'en' }]);
    expect(speakOrder('en-es', 'verde', 'green').map((i) => i.lang)).toEqual(['en', 'es']);
    expect(speakOrder('es', 'verde', 'green')).toHaveLength(1);
    expect(pickText('en', 'verde', 'green')).toEqual({ main: 'green', sub: '' });
    expect(practiceLang('es')).toBe('en');
    expect(practiceLang('en-es')).toBe('es');
  });

  it('prefers Mexican Spanish and good voices, and skips novelty voices', () => {
    const voices = [
      { name: 'Bad News', lang: 'en-US' },
      { name: 'Microsoft Helena', lang: 'es-ES' },
      { name: 'Microsoft Dalia Online (Natural)', lang: 'es-MX' },
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Daniel', lang: 'en_GB' },
    ];
    expect(pickVoice(voices, 'es')?.name).toBe('Microsoft Dalia Online (Natural)');
    expect(pickVoice(voices, 'en')?.name).toBe('Google US English');
    expect(pickVoice([{ name: 'Zarvox', lang: 'en-US' }], 'en')).toBeNull();
  });
});

describe('settings', () => {
  it('ignores unknown or out-of-range stored values', () => {
    const s = sanitizeSettings({ age: '12', lang: 'en', tolMm: 99, timeLimitMin: 20, voice: 'yes' });
    expect(s.age).toBe('5-6');
    expect(s.lang).toBe('en');
    expect(s.tolMm).toBe(12);
    expect(s.timeLimitMin).toBe(20);
    expect(s.voice).toBe(true);
    expect(sanitizeSettings(null).onboarded).toBe(false);
  });
});

describe('paint bucket', () => {
  it('fills only the enclosed area and stops at the lines', () => {
    // 10×10 board with a vertical wall at x = 5
    const w = 10, h = 10;
    const wall = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) wall[y * w + 5] = 1;
    const left = floodRegion(wall, w, h, 1, 1, 0);
    expect(left.reduce((a, b) => a + b, 0)).toBe(50);
    expect(left[9]).toBe(0);
    // grown by one pixel it tucks under the wall, but never past it
    const grown = floodRegion(wall, w, h, 1, 1, 1);
    expect(grown[5]).toBe(1);
    expect(grown[6]).toBe(0);
    expect(floodRegion(wall, w, h, 5, 3).every((v) => v === 0)).toBe(true);
  });
});

describe('corner dots', () => {
  const square: Pt[] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  it('always include the corners, extra dots go along the sides', () => {
    const d = keyDots(square, square, 8);
    expect(d).toHaveLength(8);
    for (const k of square) expect(d.some((p) => dist(p, k) < 1e-9)).toBe(true);
    expect(d[1]).toEqual([5, 0]);
  });
  it('drop the least important corner when there are fewer dots than corners', () => {
    const house: Pt[] = [[0, 10], [5, 0], [10, 10], [5, 10.2]];
    expect(keyDots(house, house, 3)).toEqual([[0, 10], [5, 0], [10, 10]]);
  });
});

describe('gato (tic-tac-toe)', () => {
  it('finds the winner and its line', () => {
    const b: Cell[] = [1, 1, 1, 2, 2, 0, 0, 0, 0];
    expect(winner(b)).toEqual({ who: 1, line: [0, 1, 2] });
    expect(winner([2, 1, 0, 1, 2, 0, 0, 0, 2])?.who).toBe(2);
    expect(winner(emptyBoard())).toBeNull();
  });
  it('medium and hard always take a winning move; hard always blocks', () => {
    const b: Cell[] = [2, 2, 0, 1, 1, 0, 0, 0, 0];
    for (let seed = 1; seed <= 50; seed++) {
      expect(aiMove(b, 2, 'hard', seeded(seed))).toBe(2);
      expect(aiMove(b, 2, 'medium', seeded(seed))).toBe(2);
      expect(aiMove([1, 1, 0, 2, 0, 0, 0, 0, 0], 2, 'hard', seeded(seed))).toBe(2);
    }
  });
  it('the computer only plays free cells, at every level, until the board is full', () => {
    for (const level of ['easy', 'medium', 'hard'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const rng = seeded(seed);
        const b = emptyBoard();
        let turn: Player = 1;
        while (!winner(b) && !isFull(b)) {
          const i = aiMove(b, turn, level, rng);
          expect(b[i]).toBe(0);
          b[i] = turn;
          turn = other(turn);
        }
      }
    }
  });
  it('hard never loses to a random player most of the time (it slips only rarely)', () => {
    let losses = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const rng = seeded(seed);
      const b = emptyBoard();
      let turn: Player = 1;
      while (!winner(b) && !isFull(b)) {
        b[turn === 2 ? aiMove(b, 2, 'hard', rng) : aiMove(b, 1, 'easy', rng)] = turn;
        turn = other(turn);
      }
      if (winner(b)?.who === 1) losses++;
    }
    expect(losses).toBeLessThan(30);
  });
});

describe('adivina la palabra', () => {
  it('rounds have different answers, the right number of options, and the answer among them', () => {
    for (const kind of ['pick-image', 'pick-word', 'spell'] as GuessKind[]) {
      for (let seed = 1; seed <= 100; seed++) {
        const rounds = makeRounds(kind, 5, 'en', seeded(seed));
        expect(rounds).toHaveLength(5);
        expect(new Set(rounds.map((r) => r.key)).size).toBe(5);
        for (const r of rounds) {
          expect(GUESS_POOL).toContain(r.key);
          if (kind === 'spell') {
            expect(r.options).toEqual([]);
            expect(spellable(wordOf(r.key, 'en'))).toBe(true);
          } else {
            expect(r.options).toContain(r.key);
            expect(new Set(r.options).size).toBe(kind === 'pick-image' ? 3 : 4);
          }
        }
      }
    }
  });
  it('the youngest get wrong pictures from other groups', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const r of makeRounds('pick-image', 5, 'es', seeded(seed))) {
        const groups = r.options.map((k) => CHARACTERS[k].group);
        expect(new Set(groups).size).toBe(3);
      }
    }
  });
  it('every word in the pool is different, in both languages', () => {
    for (const lang of ['es', 'en'] as const) expect(new Set(GUESS_POOL.map((k) => wordOf(k, lang))).size).toBe(GUESS_POOL.length);
  });
  it('spelling tiles hold every letter of the word plus two decoys', () => {
    const t = spellTiles('autobús', seeded(3));
    expect(t).toHaveLength(9);
    for (const ch of 'autobús') expect(t).toContain(ch);
  });
});

describe('cuentas y ábaco', () => {
  it('every question has its answer among distinct, non-negative options', () => {
    for (const age of AGES) for (const kind of KINDS_FOR[age]) for (let seed = 1; seed <= 100; seed++) {
      const q = mathQuestion(kind, age, seeded(seed));
      expect(evaluate(q.op)).toBe(q.answer);
      expect(q.options).toContain(q.answer);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBe(age === '3-4' ? 3 : 4);
      for (const o of q.options) expect(o).toBeGreaterThanOrEqual(0);
      if (q.op.kind === 'calc' && q.op.sym === '÷') expect(Number.isInteger(q.answer)).toBe(true);
      if (q.op.kind === 'calc' && q.op.sym === '−') expect(q.answer).toBeGreaterThan(0);
    }
  });
  it('abacus: touching a bead moves it with the ones before it; place value reads hundreds, tens, ones', () => {
    expect(touchBead(0, 4)).toBe(5);
    expect(touchBead(5, 2)).toBe(2);
    expect(touchBead(5, 5)).toBe(6);
    expect(abacusValue([3, 4], abacusFor('5-6'))).toBe(7);
    expect(abacusValue([2, 0, 7], abacusFor('7-9'))).toBe(207);
  });
});

describe('puzzles', () => {
  it('mazes are perfect: every cell reachable and the walls agree on both sides', () => {
    for (const age of AGES) for (let seed = 1; seed <= 30; seed++) {
      const [w, h] = mazeSize(age);
      const m = makeMaze(w, h, seeded(seed));
      const path = solveMaze(m);
      expect(path[0]).toBe(0);
      expect(path[path.length - 1]).toBe(w * h - 1);
      for (let i = 1; i < path.length; i++) expect(canStep(m, path[i - 1], path[i])).toBe(true);
      // perfect maze: open passages = cells - 1
      let open = 0;
      for (let c = 0; c < w * h; c++) for (const bit of [2, 4]) if (!(m.walls[c] & bit)) open++;
      expect(open).toBe(w * h - 1);
    }
  });
  it('sudokus are valid and have exactly one answer', () => {
    for (const age of AGES) for (let seed = 1; seed <= 30; seed++) {
      const spec = sudokuFor(age);
      const s = makeSudoku(spec, seeded(seed));
      s.solution.forEach((v, i) => expect(sudokuAllows(s.solution, spec, i, v)).toBe(true));
      s.given.forEach((v, i) => v && expect(v).toBe(s.solution[i]));
      expect(countSolutions([...s.given], spec)).toBe(1);
      expect(s.given.filter((v) => !v).length).toBeGreaterThan(0);
    }
  });
  it('crosswords: words cross, letters agree, and no word runs into another', () => {
    const words = ['casa', 'sol', 'flor', 'auto', 'estrella', 'lentes', 'erizo', 'granja', 'rojo', 'azul', 'tres', 'cinco'];
    for (let seed = 1; seed <= 50; seed++) {
      const cw = makeCrossword(words, 5, seeded(seed));
      expect(cw.words.length).toBeGreaterThanOrEqual(3);
      for (const p of cw.words) {
        [...p.word].forEach((ch, k) => expect(cw.cells[(p.y + (p.across ? 0 : k)) * cw.w + p.x + (p.across ? k : 0)]).toBe(ch));
        const bx = p.x - (p.across ? 1 : 0), by = p.y - (p.across ? 0 : 1);
        if (bx >= 0 && by >= 0) expect(cw.cells[by * cw.w + bx]).toBe('');
      }
    }
  });
});

describe('word sections', () => {
  it('have unique ids, a picture and both words, and no repeats inside a section', () => {
    expect(new Set(WORD_SECTIONS.map((s) => s.id)).size).toBe(WORD_SECTIONS.length);
    for (const s of WORD_SECTIONS) {
      expect(s.words.length).toBeGreaterThanOrEqual(6);
      for (const w of s.words) expect(w.pic && w.es.trim() && w.en.trim()).toBeTruthy();
      expect(new Set(s.words.map((w) => w.es)).size).toBe(s.words.length);
      expect(new Set(s.words.map((w) => w.en)).size).toBe(s.words.length);
    }
  });
});
