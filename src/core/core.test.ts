import { describe, expect, it } from 'vitest';
import { cleanPicName, fitRect, LINE_LEVELS, photoInk } from './photo';
import { CHARACTER_ORDER, CHARACTERS } from '../content/characters';
import { keyDots } from '../content/extra';
import { WORD_SECTIONS } from '../content/wordbank';
import { ABC, LETTER_OPTIONS, makeRounds as letterRounds, plain, usableWords } from './letters';
import { createGame, connectNext, hitTest } from './dotgame';
import { abacusFor, abacusValue, KINDS_FOR, MATH_RANGE, mathQuestion, missingWords, questionText, touchBead } from './arith';
import { floodRegion } from './flood';
import { canStep, countSolutions, makeCrossword, makeMaze, makeSudoku, mazeSize, solveMaze, sudokuAllows, sudokuFor, SUDOKU_BLANKS, crosswordFor } from './puzzles';
import { GUESS_POOL, makeRounds, spellable, spellTiles, wordOf, type GuessKind } from './guess';
import { dist, outwardNormals, perimeter, sampleByLength, type Pt } from './geometry';
import { pickText, practiceLang, speakOrder } from './lang';
import { evaluate, makeOp, makeOps, opWords, skillOf, type Op } from './math';
import { activePlan, sanitizeSettings } from './settings';
import { AGES } from './types';
import { pickVoice } from './voice';
import { aiMove, emptyBoard, isFull, other, winner, type Cell, type Player } from './tictactoe';
import { advance, figureBounds, nextFigure, numberOf, resample, TRACE_NUMBERS, TRACE_SHAPES, TRACE_STEP, TRACE_TAPS, traceStars, type TraceFigure } from './trace';
import { clusterColors, insideDistance, labelRegions } from './paintnum';
import { BASTA_CATEGORIES, bastaFirstLetter, bastaHints, bastaLetters, robiAnswer } from './basta';
import { reviewPlan } from './review';
import { breakSteps, RestClock, REST_PRESETS } from './rest';
import { FIGURES, piecesFor, sameShape, shapeCounts, snapTarget } from './shapes';
import { colorableMask, inkWalls } from './flood';
import { continentAt, lonDelta, unproject } from './geo';
import { CONTINENTS } from '../content/world';
import { checkBackup, DATA_KEYS, exportData, importData } from './storage';
import { SYL_WORDS, sylPool, sylRounds } from './syllables';
import { factKey, factsOf, grade, INTERVALS, learnedIn, pickRound, ROUND, TABLES_FOR, tableOptions, type TableState } from './tables';
import { kindsFor, makeProblem, makeRound, PROBLEM_MAX } from './problems';
import { STORIES, storiesFor } from '../content/stories';

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
    expect(s.solo.limitMin).toBe(20); // the old single limit moves to the plan for playing alone
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
      if (!q.hide) expect(evaluate(q.op)).toBe(q.answer);
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
    for (const age of AGES) for (const level of [1, 2, 3, 4] as const) for (let seed = 1; seed <= 15; seed++) {
      const spec = sudokuFor(age, level);
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

describe('letters game', () => {
  const pool = (lang: 'es' | 'en') => [
    ...ABC[lang].flatMap((x) => x.words),
    ...WORD_SECTIONS.flatMap((s) => s.words.map((w) => ({ word: lang === 'en' ? w.en : w.es, pic: w.pic }))),
  ];
  it('has every letter once, each in its example word', () => {
    expect(ABC.es.map((x) => x.letter).join('')).toBe('abcdefghijklmnñopqrstuvwxyz');
    expect(ABC.en.map((x) => x.letter).join('')).toBe('abcdefghijklmnopqrstuvwxyz');
    for (const lang of ['es', 'en'] as const) {
      for (const x of ABC[lang]) {
        expect(x.words.length).toBeGreaterThanOrEqual(3);
        for (const w of x.words) {
          expect(w.pic).toBeTruthy();
          expect([...w.word].map(plain)).toContain(x.letter);
        }
      }
    }
  });
  it('builds 5 consistent rounds for every age and language', () => {
    for (const lang of ['es', 'en'] as const) {
      for (const age of AGES) for (const level of [1, 2, 3, 4] as const) {
        for (let seed = 0; seed < 12; seed++) {
          const rounds = letterRounds(age, lang, pool(lang), 5, Math.random, level);
          expect(rounds).toHaveLength(5);
          expect(new Set(rounds.map((r) => r.word)).size).toBe(5);
          for (const r of rounds) {
            expect(r.slots.length).toBeGreaterThan(0);
            for (const i of r.slots) expect(plain(r.word[i])).toBe(r.letter);
            if (r.kind === 'find') {
              // every matching letter must be a target
              [...r.word].forEach((ch, i) => { if (plain(ch) === r.letter) expect(r.slots).toContain(i); });
            } else {
              expect(r.options).toContain(r.letter);
              expect(new Set(r.options).size).toBe(r.options.length);
              expect(r.options.length).toBe(LETTER_OPTIONS[age][level]);
              expect(r.word[r.slots[0]]).toBe(r.letter); // never a hidden accented letter
            }
            if (age === '3-4') expect(r.kind).toBe('first');
          }
        }
      }
    }
  });
  it('keeps only words made of letters and of a fitting length', () => {
    const ws = usableWords([{ word: 'T-shirt', pic: '' }, { word: 'buenos días', pic: '' }, { word: 'sol', pic: '' }, { word: 'sol', pic: '' }], '5-6');
    expect(ws.map((w) => w.word)).toEqual(['sol']);
  });
});

describe('missing-number questions', () => {
  it('hide one side; the answer completes the equation', () => {
    for (const age of ['5-6', '7-9'] as const) {
      expect(KINDS_FOR[age]).toContain('missing');
      for (let i = 0; i < 300; i++) {
        const q = mathQuestion('missing', age);
        expect(q.hide).toBeDefined();
        const op = q.op;
        if (op.kind !== 'calc') throw new Error('calc expected');
        const a = q.hide === 'a' ? q.answer : op.a;
        const b = q.hide === 'b' ? q.answer : op.b;
        expect(evaluate({ ...op, a, b })).toBe(evaluate(op));
        expect(q.answer).toBeGreaterThan(0);
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(4);
        const text = questionText(q);
        expect(text.split('?').length).toBe(2); // exactly one gap
        expect(text.endsWith(`= ${evaluate(op)}`)).toBe(true);
        if (age === '5-6') expect(evaluate(op) <= 10 || op.sym === '−').toBe(true);
        expect(missingWords(q, 'es')).toContain('¿qué número?');
      }
    }
  });
});

describe('light trails', () => {
  it('resamples every stroke evenly and keeps its ends', () => {
    for (const f of [...TRACE_SHAPES, ...TRACE_NUMBERS]) {
      for (const s of f.strokes) {
        const r = resample(s);
        expect(r[0]).toEqual(s[0]);
        expect(dist(r[r.length - 1], s[s.length - 1])).toBeLessThan(TRACE_STEP);
        for (let i = 1; i < r.length; i++) expect(dist(r[i - 1], r[i])).toBeLessThan(TRACE_STEP * 1.01);
        for (const p of r) {
          expect(p[0]).toBeGreaterThan(0);
          expect(p[0]).toBeLessThan(100);
          expect(p[1]).toBeGreaterThan(0);
          expect(p[1]).toBeLessThan(100);
        }
      }
    }
    expect(TRACE_NUMBERS).toHaveLength(10);
  });
  it('a finger moving along the line lights all of it; one far away lights nothing', () => {
    const pts = resample(TRACE_SHAPES.find((f) => f.id === 'cuadrado')!.strokes[0]);
    let pos = 0;
    for (const p of pts) pos = advance(pts, pos, [p[0] + 2, p[1] + 2], 6, 13);
    expect(pos).toBe(pts.length - 1);
    expect(advance(pts, 0, [50, 50], 6, 13)).toBe(0);
    // cannot jump ahead to a far part of the line
    expect(advance(pts, 0, pts[Math.floor(pts.length / 2)], 6, 13)).toBe(0);
  });
});

describe('paint by numbers', () => {
  it('finds the areas between lines', () => {
    const w = 20, h = 10;
    const wall = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) wall[y * w + 10] = 1; // a line down the middle
    for (let x = 3; x < 8; x++) for (const y of [2, 7]) wall[y * w + x] = 1;
    for (let y = 2; y < 8; y++) for (const x of [3, 7]) wall[y * w + x] = 1; // a closed box on the left
    const r = labelRegions(wall, w, h);
    expect(r.count).toBe(3);
    const inBox = r.labels[4 * w + 5];
    expect(r.edge[inBox]).toBe(false);
    expect(r.area[inBox]).toBe(3 * 4);
    const d = insideDistance(r.labels, w, h);
    expect(d[4 * w + 5]).toBeGreaterThanOrEqual(1);
    expect(d[2 * w + 3]).toBe(0);
  });
  it('groups close colours and never uses more paints than allowed', () => {
    const cols: [number, number, number][] = [[250, 0, 0], [240, 10, 10], [0, 0, 250], [0, 200, 0], [255, 255, 0], [120, 60, 20], [200, 100, 255]];
    const one = clusterColors(cols, cols.map(() => 1), 10);
    expect(one.of[0]).toBe(one.of[1]);
    expect(one.palette).toHaveLength(6);
    const few = clusterColors(cols, [9, 1, 5, 4, 3, 2, 1], 4);
    expect(few.palette).toHaveLength(4);
    expect(Math.max(...few.of)).toBe(3);
    expect(few.palette[0]).toEqual([250, 0, 0]); // the biggest area keeps its colour
  });
});

describe('basta letter wheel', () => {
  it('every category has words for Robi in both languages, and Robi only uses free letters', () => {
    for (const age of AGES) {
      const letters = bastaLetters(age);
      expect(new Set(letters).size).toBe(letters.length);
      for (const cat of BASTA_CATEGORIES) {
        for (const lang of ['es', 'en'] as const) {
          const hints = bastaHints(cat, lang, letters, []);
          expect(hints.length, cat.es + ' ' + lang + ' ' + age).toBeGreaterThan(0);
          const used: string[] = [];
          for (let k = 0; k < 40; k++) {
            const a = robiAnswer(cat, lang, letters, used);
            if (!a) break;
            expect(letters).toContain(a.letter);
            expect(used).not.toContain(a.letter);
            expect(bastaFirstLetter(a.word[lang])).toBe(a.letter);
            used.push(a.letter);
          }
        }
      }
    }
  });
  it('reads accents and ñ correctly', () => {
    expect(bastaFirstLetter('árbol')).toBe('A');
    expect(bastaFirstLetter('ñu')).toBe('Ñ');
  });
});

describe('review plan', () => {
  it('suggests a technique for weak skills and lists mastered ones', () => {
    const s = (right: number, tries: number) => ({ right, tries });
    const plan = reviewPlan({ seq: s(9, 10), count: s(0, 2), sum: s(6, 10), sub: s(4, 10), mul: s(0, 0), div: s(0, 0), read: s(0, 0), syl: s(0, 0), prob: s(0, 0) });
    expect(plan.review.map((r) => r.skill)).toEqual(['sub', 'sum']);
    expect(plan.review[0].technique).toBe('cpa');
    expect(plan.review[1].technique).toBe('interleaved');
    expect(plan.mastered).toEqual(['seq']);
    expect(reviewPlan({ seq: s(1, 2), count: s(0, 0), sum: s(0, 0), sub: s(0, 0), mul: s(0, 0), div: s(0, 0), read: s(0, 0), syl: s(0, 0), prob: s(0, 0) }).review).toEqual([]);
  });
});

describe('rest breaks', () => {
  const min = 60000;
  it('asks for a break every interval and ends play at the limit', () => {
    const c = new RestClock();
    const plan = { breakEvery: 10, breakSec: 60, limitMin: 25 };
    const events: string[] = [];
    for (let t = 0; t < 30 * 12; t++) {
      const e = c.advance(5000, plan);
      if (e) events.push(`${e}@${(t + 1) * 5 / 60}`);
    }
    expect(events).toEqual(['break@10', 'break@20', 'limit@25']);
  });

  it('waits while the screen is busy and does not count paused time', () => {
    const c = new RestClock();
    const plan = { breakEvery: 10, breakSec: 40, limitMin: 0 };
    expect(c.advance(10 * min, plan, false)).toBeNull();
    expect(c.pendingBreak).toBe(true);
    expect(c.advance(1000, plan, true)).toBe('break');
    expect(c.advance(9 * min, plan)).toBeNull();
    c.breakDone();
    expect(c.advance(9 * min, plan)).toBeNull();
    expect(c.advance(1 * min, plan)).toBe('break');
  });

  it('an adult continuing after the limit starts a fresh period', () => {
    const c = new RestClock();
    const plan = { breakEvery: 0, breakSec: 40, limitMin: 15 };
    expect(c.advance(15 * min, plan)).toBe('limit');
    expect(c.advance(30 * min, plan)).toBeNull();
    c.resetLimit();
    expect(c.advance(15 * min, plan)).toBe('limit');
  });

  it('two plans: alone is stricter than with an adult, and the setting picks one', () => {
    for (const a of AGES) {
      const p = REST_PRESETS[a];
      expect(p.solo.breakEvery).toBeLessThanOrEqual(p.together.breakEvery);
      expect(p.solo.limitMin).toBeLessThanOrEqual(p.together.limitMin);
    }
    const s = sanitizeSettings({ age: '3-4', supervised: true, solo: { breakEvery: 15, breakSec: 999, limitMin: 20 } });
    expect(s.solo).toEqual({ breakEvery: 15, breakSec: 60, limitMin: 20 });
    expect(activePlan(s)).toEqual(REST_PRESETS['3-4'].together);
    expect(activePlan({ ...s, supervised: false })).toBe(s.solo);
  });

  it('break steps fit the length', () => {
    expect(breakSteps(20)).toHaveLength(2);
    expect(breakSteps(60)).toHaveLength(5);
    expect(new Set(breakSteps(60).map((x) => x.icon)).size).toBe(5);
  });
});

describe('backup', () => {
  it('exports the child data and restores it on another device', () => {
    const mem = new Map<string, string>();
    const g = globalThis as { localStorage?: unknown };
    const prev = g.localStorage;
    g.localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
    try {
      mem.set(DATA_KEYS.settings, JSON.stringify({ age: '7-9' }));
      mem.set(DATA_KEYS.paintDone, JSON.stringify(['zones:briz']));
      mem.set('pym-install-dismissed', '123');
      const b = exportData();
      expect(b.data.settings).toEqual({ age: '7-9' });
      expect(typeof (b.data.profile as { id: string }).id).toBe('string');
      expect('installDismissed' in b.data).toBe(false);
      const roundTrip = checkBackup(JSON.parse(JSON.stringify(b)));
      expect(roundTrip.ok).toBe(true);
      mem.clear();
      mem.set(DATA_KEYS.game, '{"key":"momu"}');
      if (roundTrip.ok) importData(roundTrip.backup);
      expect(JSON.parse(mem.get(DATA_KEYS.paintDone)!)).toEqual(['zones:briz']);
      expect(mem.has(DATA_KEYS.game)).toBe(false);
    } finally {
      g.localStorage = prev;
    }
    expect(checkBackup({ app: 'otra', data: {} }).ok).toBe(false);
    expect(checkBackup({ app: 'playhour', schema: 99, data: {} }).ok).toBe(false);
  });
});

describe('colouring inside the drawing', () => {
  it('areas closed by lines outside the outline can be coloured; open space cannot', () => {
    // 12×12 board: a closed square of lines (2..6) and a stray open line
    const w = 12, h = 12, rgba = new Uint8ClampedArray(w * h * 4).fill(255);
    const ink = (x: number, y: number) => rgba.set([30, 40, 70, 255], (y * w + x) * 4);
    for (let i = 2; i <= 6; i++) { ink(i, 2); ink(i, 6); ink(2, i); ink(6, i); }
    for (let i = 8; i <= 10; i++) ink(i, 9);
    const m = colorableMask(inkWalls(rgba, w * h), w, h);
    expect(m[4 * w + 4]).toBe(1); // inside the square
    expect(m[2 * w + 2]).toBe(1); // the line itself
    expect(m[0]).toBe(0);
    expect(m[8 * w + 9]).toBe(0); // next to the open line
  });
});

describe('build with shapes', () => {
  it('each age gets more pieces, all inside the board, and the youngest at least 3', () => {
    for (const f of FIGURES) {
      const a = piecesFor(f, '3-4').length, b = piecesFor(f, '5-6').length, c = piecesFor(f, '7-9').length;
      expect(a, f.id).toBeGreaterThanOrEqual(2);
      expect(a).toBeLessThanOrEqual(b);
      expect(b).toBeLessThanOrEqual(c);
      for (const p of f.pieces) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x + p.w).toBeLessThanOrEqual(100);
        expect(p.y + p.h).toBeLessThanOrEqual(100);
        if (p.kind === 'square' || p.kind === 'circle') expect(p.w, `${f.id} ${p.kind}`).toBe(p.h);
      }
    }
  });

  it('a piece snaps only into an empty place of the same shape, near enough', () => {
    const slots = piecesFor(FIGURES[0], '5-6');
    const filled = slots.map(() => false);
    const roof = slots.find((p) => p.kind === 'tri')!;
    const cx = roof.x + roof.w / 2, cy = roof.y + roof.h / 2;
    expect(snapTarget(roof, cx + 5, cy, slots, filled, 15)).toBe(slots.indexOf(roof));
    expect(snapTarget(roof, cx + 40, cy + 40, slots, filled, 15)).toBe(-1);
    const win = slots.filter((p) => p.kind === 'square' && p.w === 10);
    expect(win).toHaveLength(2);
    expect(sameShape(win[0], win[1])).toBe(true);
    filled[slots.indexOf(win[0])] = true;
    // the twin window goes into whichever window place is still empty
    expect(snapTarget(win[0], win[1].x + 5, win[1].y + 5, slots, filled, 15)).toBe(slots.indexOf(win[1]));
    expect(shapeCounts(slots).find((c) => c.kind === 'square')?.n).toBe(2);
  });
});

describe('world', () => {
  it('lists every country once, with the usual counts', () => {
    const n = Object.fromEntries(CONTINENTS.map((c) => [c.id, c.countries.length]));
    expect(n).toEqual({ norteamerica: 23, sudamerica: 12, europa: 44, africa: 54, asia: 48, oceania: 14, antartida: 0 });
    const all = CONTINENTS.flatMap((c) => c.countries.map(([es]) => es));
    expect(new Set(all).size).toBe(all.length);
  });

  it('finds the continent of well-known cities and leaves the oceans empty', () => {
    const at = (lon: number, lat: number) => continentAt(lon, lat)?.id ?? 'mar';
    expect(at(-99.1, 19.4)).toBe('norteamerica'); // Ciudad de México
    expect(at(-74, 4.6)).toBe('sudamerica'); // Bogotá
    expect(at(-46.6, -23.5)).toBe('sudamerica'); // São Paulo
    expect(at(2.35, 48.85)).toBe('europa'); // París
    expect(at(37.6, 55.75)).toBe('europa'); // Moscú
    expect(at(-3.7, 40.4)).toBe('europa'); // Madrid
    expect(at(31.2, 30)).toBe('africa'); // El Cairo
    expect(at(36.8, -1.3)).toBe('africa'); // Nairobi
    expect(at(77.2, 28.6)).toBe('asia'); // Delhi
    expect(at(116.4, 39.9)).toBe('asia'); // Pekín
    expect(at(139.7, 35.7)).toBe('asia'); // Tokio
    expect(at(151.2, -33.9)).toBe('oceania'); // Sídney
    expect(at(0, -85)).toBe('antartida');
    expect(at(-30, 0)).toBe('mar'); // Atlántico
    expect(at(-150, 0)).toBe('mar'); // Pacífico
    expect(at(80, -20)).toBe('mar'); // Índico
  });

  it('the globe view maps its centre to where it is turned', () => {
    const [lon, lat] = unproject(0, 0, -100, 30)!;
    expect(lon).toBeCloseTo(-100);
    expect(lat).toBeCloseTo(30);
    expect(unproject(0.9, 0.9, 0, 0)).toBeNull();
    expect(lonDelta(170, -170)).toBe(20);
  });
});

describe('para la escuela', () => {
  it('every syllable split rebuilds a real word, with no empty syllables', () => {
    for (const w of SYL_WORDS) {
      expect(w.es.every((x) => x.length > 0)).toBe(true);
      expect(w.es.join('')).toMatch(/^[a-záéíóúüñ]+$/);
      if (w.en) expect(w.en.join('')).toMatch(/^[a-z]+$/);
    }
    const es = SYL_WORDS.map((w) => w.es.join(''));
    expect(new Set(es).size).toBe(es.length);
  });

  it('syllables, letters, sudoku and crossword have enough material at every level', () => {
    for (const age of AGES) for (const level of [1, 2, 3, 4] as const) {
      for (const lang of ['es', 'en'] as const) {
        const rounds = sylRounds(age, lang, 5, seeded(level), level);
        expect(rounds, `${age} ${level} ${lang}`).toHaveLength(5);
        expect(new Set(rounds.map((r) => r.parts.join('-'))).size).toBe(5);
        for (const r of rounds) {
          expect(r.tiles.length).toBeGreaterThanOrEqual(r.parts.length);
          if (age === '3-4') expect(r.claps).toContain(r.parts.length);
        }
      }
      expect(SUDOKU_BLANKS[age][1]).toBeLessThan(SUDOKU_BLANKS[age][3]);
      expect(SUDOKU_BLANKS[age][3]).toBeLessThan(SUDOKU_BLANKS[age][4]);
      expect(crosswordFor(age, 1).reveal).toBeGreaterThanOrEqual(crosswordFor(age, 3).reveal);
      expect(LETTER_OPTIONS[age][1]).toBeLessThanOrEqual(LETTER_OPTIONS[age][3]);
    }
  });

  it('syllable rounds fit the age and tiles hold every syllable', () => {
    for (const age of AGES) for (const lang of ['es', 'en'] as const) {
      expect(sylPool(age, lang).length).toBeGreaterThanOrEqual(8);
      for (let seed = 1; seed < 30; seed++) {
        const rounds = sylRounds(age, lang, 5, seeded(seed));
        expect(rounds).toHaveLength(5);
        expect(new Set(rounds.map((r) => r.parts.join('-'))).size).toBe(5);
        for (const r of rounds) {
          const left = [...r.tiles];
          for (const part of r.parts) {
            const i = left.indexOf(part);
            expect(i).toBeGreaterThanOrEqual(0);
            left.splice(i, 1);
          }
          expect(left.length).toBe(age === '7-9' ? 2 : 0);
          if (age === '3-4') expect(r.claps).toContain(r.parts.length);
        }
      }
    }
  });

  it('times tables: spaced review moves facts up and sends mistakes back', () => {
    const st: TableState = {};
    const f = { a: 7, b: 8 };
    expect(grade(st, f, true, 100)).toEqual({ box: 1, due: 100 + INTERVALS[1] });
    expect(grade(st, f, true, 101)).toEqual({ box: 2, due: 101 + INTERVALS[2] });
    expect(grade(st, f, false, 103)).toEqual({ box: 0, due: 103 });
    for (let i = 0; i < 10; i++) grade(st, f, true, 200);
    expect(st[factKey(f)].box).toBe(INTERVALS.length - 1);
    expect(TABLES_FOR['3-4']).toEqual([]);
  });

  it('times tables: rounds bring back due facts first and options include the answer', () => {
    const st: TableState = {};
    for (const x of factsOf(3)) grade(st, x, true, 10); // box 1, due day 11
    grade(st, { a: 6, b: 7 }, false, 11); // box 0, due day 11
    const tables = TABLES_FOR['7-9'];
    const daily = pickRound(st, tables, null, 11, seeded(4));
    expect(daily).toHaveLength(ROUND);
    expect(daily.map(factKey)).toContain('6x7');
    expect(new Set(daily.map(factKey)).size).toBe(ROUND);
    const one = pickRound(st, tables, 9, 11, seeded(5));
    expect(one).toHaveLength(ROUND);
    expect(one.filter((x) => x.a !== 9).length).toBeLessThanOrEqual(3);
    expect(learnedIn(st, 3)).toBe(0);
    for (let seed = 1; seed < 40; seed++) {
      const x = { a: 1 + (seed % 10), b: 1 + ((seed * 7) % 10) };
      const opts = tableOptions(x, 4, seeded(seed));
      expect(opts).toContain(x.a * x.b);
      expect(new Set(opts).size).toBe(opts.length);
      expect(opts.every((n) => n > 0)).toBe(true);
    }
  });

  it('word problems: right answer, in range, and Spanish agrees with the noun', () => {
    for (const age of AGES) for (let seed = 1; seed < 200; seed++) {
      const pr = makeProblem(age, seeded(seed));
      expect(kindsFor(age)).toContain(pr.kind);
      expect(pr.options).toContain(pr.answer);
      expect(new Set(pr.options).size).toBe(pr.options.length);
      expect(pr.answer).toBeGreaterThan(0);
      if (age === '3-4') expect(pr.answer).toBeLessThanOrEqual(5);
      if (age === '5-6') expect(pr.answer).toBeLessThanOrEqual(10);
      expect(pr.es).toContain(pr.item.fem ? '¿Cuántas' : '¿Cuántos');
      expect(pr.es).not.toContain(` 1 ${pr.item.es[1]}`); // "1 manzanas"
      expect(pr.en).not.toMatch(/undefined|NaN/);
      expect(pr.es).not.toMatch(/undefined|NaN/);
    }
  });

  it('word problems by level: in range, valid at every level, and no repeats inside a round', () => {
    const levels = [1, 2, 3, 4] as const;
    for (const age of AGES) for (const level of levels) for (let seed = 1; seed < 80; seed++) {
      const round = makeRound(age, 5, level, seeded(seed));
      expect(round.length).toBe(5);
      const keys = round.map((p) => `${p.kind}:${p.es.match(/\d+/g)?.join(',')}`);
      expect(new Set(keys).size, `${age} ${level}`).toBe(5);
      for (const p of round) {
        expect(kindsFor(age, level)).toContain(p.kind);
        expect(p.options).toContain(p.answer);
        expect(p.answer).toBeGreaterThan(0);
        if (p.kind === 'join' || p.kind === 'take' || p.kind === 'compare')
          for (const n of p.es.match(/\d+/g)!.map(Number)) expect(n).toBeLessThanOrEqual(PROBLEM_MAX[age][level]);
        expect(p.es).not.toMatch(/undefined|NaN/);
      }
    }
    expect(PROBLEM_MAX['3-4'][1]).toBeLessThan(PROBLEM_MAX['3-4'][3]);
  });

  it('math and mazes get harder with the level', () => {
    for (const age of AGES) {
      const [w1, h1] = mazeSize(age, 1), [w2, h2] = mazeSize(age, 2), [w3, h3] = mazeSize(age, 3), [w4, h4] = mazeSize(age, 4);
      expect(w1 * h1).toBeLessThan(w2 * h2);
      expect(w2 * h2).toBeLessThan(w3 * h3);
      expect(w3 * h3).toBeLessThan(w4 * h4);
      for (const level of [1, 2, 3, 4] as const) for (let seed = 1; seed < 40; seed++) {
        const m = makeMaze(...mazeSize(age, level), seeded(seed));
        expect(solveMaze(m).at(-1)).toBe(m.w * m.h - 1);
      }
    }
    for (const level of [1, 2, 3, 4] as const) for (let seed = 1; seed < 100; seed++) {
      const q = mathQuestion('sum', '7-9', seeded(seed), level);
      const R = MATH_RANGE['7-9'][level];
      expect(q.answer).toBeGreaterThanOrEqual(R.total[0]);
      expect(q.answer).toBeLessThanOrEqual(R.total[1]);
      expect(q.options).toContain(q.answer);
      const c = mathQuestion('count', '3-4', seeded(seed), level);
      expect(c.answer).toBeLessThanOrEqual(MATH_RANGE['3-4'][level].count[1]);
    }
  });

  it('stories: same sentences in both languages, questions with the right answer first', () => {
    for (const age of AGES) expect(storiesFor(age).length).toBeGreaterThanOrEqual(3);
    expect(new Set(STORIES.map((x) => x.id)).size).toBe(STORIES.length);
    for (const st of STORIES) {
      expect(st.es.length).toBe(st.en.length);
      expect(st.questions.length).toBeGreaterThanOrEqual(2);
      for (const q of st.questions) {
        expect(q.options.length).toBe(3);
        expect(new Set(q.options.map((o) => o.es)).size).toBe(3);
        if (st.age === '3-4') expect(q.options.every((o) => !!o.pic)).toBe(true);
      }
    }
  });
});

describe('trazos de luz: después de trazar', () => {
  it('shape and number ids are unique and never use the drawings prefix (d-)', () => {
    const ids = [...TRACE_SHAPES, ...TRACE_NUMBERS].map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.some((id) => id.startsWith('d-'))).toBe(false);
  });

  it('stars: 3 without lifting the finger, fewer with extra lifts', () => {
    expect(traceStars(1, 1)).toBe(3);
    expect(traceStars(2, 2)).toBe(3);
    expect(traceStars(3, 1)).toBe(2);
    expect(traceStars(4, 1)).toBe(1);
  });

  it('every shape has something to touch: counted points on its line, or a spot inside it', () => {
    for (const f of TRACE_SHAPES) expect(TRACE_TAPS[f.id], f.id).toBeTruthy();
    for (const [id, c] of Object.entries(TRACE_TAPS)) {
      const f = TRACE_SHAPES.find((x) => x.id === id);
      expect(f, id).toBeTruthy();
      const pts = f!.strokes.flatMap((st) => resample(st));
      const b = figureBounds(f!.strokes);
      for (const q of c.pts) {
        const near = Math.min(...pts.map((p) => Math.hypot(p[0] - q[0], p[1] - q[1])));
        if (c.count) expect(near, id).toBeLessThan(1);
        else {
          expect(q[0] > b.x && q[0] < b.x + b.w && q[1] > b.y && q[1] < b.y + b.h, id).toBe(true);
          expect(c.pts.length, id).toBe(1);
        }
      }
      if (c.count) expect(c.say[0]).toContain(String(c.pts.length));
      expect(new Set(c.pts.map((p) => p.join())).size, id).toBe(c.pts.length);
    }
    expect(TRACE_TAPS.montanas.ask[0]).toContain('cuéntalos');
    expect(numberOf(TRACE_NUMBERS[2])).toBe(3);
    expect(numberOf(TRACE_SHAPES[0])).toBeNull();
  });

  it('offers the next figure not done, then the next group once, then just the next one', () => {
    const fig = (id: string, group: TraceFigure['group']): TraceFigure => ({ id, group, es: id, en: id, strokes: [[[0, 0], [1, 1]]] });
    const order = [fig('a', 'shapes'), fig('b', 'shapes'), fig('c', 'shapes'), fig('n1', 'numbers'), fig('n2', 'numbers')];
    const done: Record<string, number> = { a: 3 };
    expect(nextFigure(order, done, 'a', true)).toMatchObject({ fig: { id: 'b' }, groupDone: false, allDone: false });
    done.c = 2;
    expect(nextFigure(order, done, 'c', true).fig.id).toBe('b'); // wraps inside the group
    done.b = 1;
    expect(nextFigure(order, done, 'b', true)).toMatchObject({ fig: { id: 'n1' }, groupDone: true, allDone: false });
    expect(nextFigure(order, done, 'b', false).groupDone).toBe(false); // repeating a figure: no new "finished" message
    done.n1 = 3;
    done.n2 = 3;
    expect(nextFigure(order, done, 'n2', true)).toMatchObject({ fig: { id: 'a' }, groupDone: true, allDone: true });
    expect(nextFigure(order, done, 'a', false)).toMatchObject({ fig: { id: 'b' }, groupDone: false, allDone: true });
  });
});

describe('colorea tu dibujo: foto a líneas', () => {
  /** A "photo": paper that goes from light to grey (a shadow), with a dark square outline drawn on it. */
  const photo = (w: number, h: number) => {
    const d = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const paper = 235 - (x / w) * 110; // shadow on the right: 235 → 125
      const onLine = (x >= 20 && x <= 22 || x >= 77 && x <= 79) && y >= 20 && y <= 79 || (y >= 20 && y <= 22 || y >= 77 && y <= 79) && x >= 20 && x <= 79;
      const v = onLine ? paper * 0.35 : paper;
      const o = (y * w + x) * 4;
      d[o] = d[o + 1] = d[o + 2] = v;
      d[o + 3] = 255;
    }
    return d;
  };
  it('finds the lines and ignores the shadow on the paper', () => {
    const w = 100, h = 100;
    const ink = photoInk(photo(w, h), w, h);
    expect(ink[21 * w + 50]).toBeGreaterThan(200); // top line
    expect(ink[50 * w + 78]).toBeGreaterThan(200); // right line, inside the shadow
    expect(ink[50 * w + 50]).toBe(0); // middle of the paper
    expect(ink[50 * w + 95]).toBe(0); // darkest paper, no line
  });
  it('more lines never finds fewer ink pixels', () => {
    const w = 100, h = 100;
    const count = (l: number) => photoInk(photo(w, h), w, h, l).filter((v) => v > 0).length;
    for (let l = 1; l < LINE_LEVELS.length; l++) expect(count(l)).toBeGreaterThanOrEqual(count(l - 1));
  });
  it('drops lonely specks', () => {
    const w = 40, h = 40;
    const d = new Uint8ClampedArray(w * h * 4).fill(255);
    const o = (20 * w + 20) * 4;
    d[o] = d[o + 1] = d[o + 2] = 0;
    expect(photoInk(d, w, h, LINE_LEVELS.length - 1).some((v) => v > 0)).toBe(false);
  });
  it('fits any picture whole and centred, and cleans names', () => {
    const r = fitRect(4000, 3000, 900, 900);
    expect(r.w).toBeLessThanOrEqual(900);
    expect(Math.abs(r.x + r.w / 2 - 450)).toBeLessThanOrEqual(1);
    expect(Math.abs(r.y + r.h / 2 - 450)).toBeLessThanOrEqual(1);
    expect(fitRect(300, 1200, 900, 900).h).toBeLessThanOrEqual(900);
    expect(cleanPicName('IMG_2045-casa.jpg')).toBe('IMG 2045 casa');
    expect(cleanPicName('   ')).toBe('Mi dibujo');
    expect(cleanPicName('x'.repeat(40)).length).toBe(24);
  });
});
