import { pop } from '../../core/audio';
import { recordStep } from '../../core/progress';
import { settings } from '../../core/settings';
import { DATA_KEYS, readJSON, writeJSON } from '../../core/storage';
import {
  FAMILIES, HARD_GROUPS, familyRounds, modesFor, picFor, robiPace,
  type FamilyMode, type FamilyRound, type FamilyScores, type SylFamily,
} from '../../core/sylfamily';
import { drawThumb } from '../../render/character';
import type { Ctx } from '../context';
import { canvas, h, ICONS } from '../dom';
import { levelPicker, progressDots, shake } from './gamekit';

const ROUNDS = 6;
const MODE_NAME: Record<FamilyMode, string> = { read: 'Lee la familia', listen: 'Escucha y elige', complete: 'Completa la palabra' };
const MODE_HINT: Record<FamilyMode, string> = {
  read: 'Toca cada sílaba y óyela',
  listen: 'Oye una sílaba y búscala',
  complete: 'Elige la sílaba que le falta',
};

export interface FamilyView {
  back(): boolean;
  busy(): boolean;
  destroy(): void;
  help(): void;
}

/**
 * "Familias" inside Sílabas: pick a family (ta te ti to tu…) or one of "Las difíciles", then
 * read it, hear-and-pick, or complete a word; alone or racing Robi, the robot.
 * The syllables are Spanish (reading is taught in Spanish), so the voice always uses Spanish.
 */
export function familyView(ctx: Ctx, wrap: HTMLElement, tabs: () => HTMLElement): FamilyView {
  const age = settings.age;
  let step: 'pick' | 'setup' | 'play' = 'pick';
  let fam: SylFamily = FAMILIES[0];
  let mode: FamilyMode = 'read';
  let vsRobi = false;
  let rounds: FamilyRound[] = [];
  let idx = 0;
  let score = 0;
  let robiScore = 0;
  let firstTry = true;
  let locked = false;
  let racing = false;
  let timers: number[] = [];
  let raf = 0;
  const scores = (): FamilyScores => readJSON<FamilyScores>(DATA_KEYS.sylFamilies, {});
  const say = (t: string) => ctx.sayOne(t, 'es');
  const put = (...xs: (Node | null | false)[]) => wrap.replaceChildren(...xs.filter((x): x is Node => !!x));
  const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
  const stopAll = () => {
    timers.forEach(clearTimeout);
    timers = [];
    cancelAnimationFrame(raf);
    racing = false;
  };

  const head = (sub: string, extra: (HTMLElement | null)[] = []) =>
    h('div', { class: 'ghead' }, h('h2', null, 'Sílabas', h('small', null, sub)), ...extra.filter((x): x is HTMLElement => !!x));

  // ---------- 1. choose a family ----------
  function showPick(): void {
    stopAll();
    step = 'pick';
    const best = scores();
    const card = (f: SylFamily) => h('button', {
      class: `fam-card${f.group === 'dificil' ? ' hard' : ''}`,
      'aria-label': f.group === 'dificil' ? `Las difíciles: ${f.label}` : `Familia ${f.syl.join(', ')}`,
      onClick: () => {
        pop(520, 0.1);
        fam = f;
        showSetup();
      },
    },
    h('b', null, f.label),
    f.tip ? h('small', null, f.tip) : null,
    best[f.id] != null ? h('span', { class: 'fam-best', 'aria-label': best[f.id] >= ROUNDS - 1 ? 'muy bien' : 'practicada' }, best[f.id] >= ROUNDS - 1 ? '⭐' : '✓') : null);
    const simple = FAMILIES.filter((f) => f.group === 'simple');
    const trab = FAMILIES.filter((f) => f.group === 'trabada');
    put(
      head('Familias · ¿Cuál practicamos?', [tabs()]),
      h('section', { class: 'fam-sec' }, h('h3', null, 'Familias'), h('div', { class: 'fam-grid' }, ...simple.map(card))),
      age === '3-4' ? null : h('section', { class: 'fam-sec' }, h('h3', null, 'Las difíciles'),
        h('p', { class: 'muted' }, 'Las letras que más se confunden al leer y escribir.'),
        h('div', { class: 'fam-grid wide' }, ...HARD_GROUPS.map(card))),
      age === '3-4' ? null : h('section', { class: 'fam-sec' }, h('h3', null, 'Trabadas'), h('div', { class: 'fam-grid' }, ...trab.map(card))),
    );
    say('¿Qué familia practicamos?');
  }

  // ---------- 2. exercise and opponent ----------
  function showSetup(): void {
    stopAll();
    step = 'setup';
    const modes = modesFor(fam);
    if (!modes.includes(mode)) mode = modes[0];
    const modeBtns = modes.map((m) => h('button', {
      class: 'fam-mode', role: 'radio', 'aria-checked': String(m === mode),
      onClick: () => {
        mode = m;
        pop(520, 0.1);
        showSetup();
      },
    }, h('b', null, MODE_NAME[m]), h('small', null, MODE_HINT[m])));
    const robiPic = canvas(120, 90);
    drawThumb(robiPic, 'robi', 'fill');
    const who = mode === 'read' ? null : h('div', { class: 'fam-who', role: 'radiogroup', 'aria-label': 'Con quién juegas' },
      h('button', { class: 'fam-whobtn', role: 'radio', 'aria-checked': String(!vsRobi), onClick: () => ((vsRobi = false), showSetup()) }, h('span', { class: 'fam-me' }, '🙂'), 'Solo'),
      h('button', { class: 'fam-whobtn', role: 'radio', 'aria-checked': String(vsRobi), onClick: () => ((vsRobi = true), showSetup()) }, robiPic, 'Contra Robi'));
    put(
      head(fam.group === 'dificil' ? `Las difíciles · ${fam.label}` : `Familia ${fam.syl[0]}`, [levelPicker(ctx, 'syllables', showSetup)]),
      h('div', { class: 'fam-show kcard' }, ...fam.syl.slice(0, 10).map((s) => h('span', null, s))),
      fam.tip ? h('p', { class: 'fam-tip' }, fam.tip) : null,
      h('div', { class: 'fam-modes', role: 'radiogroup', 'aria-label': 'Ejercicio' }, ...modeBtns),
      who,
      h('button', { class: 'bigbtn violet fam-go', onClick: start }, '¡A jugar!'),
    );
    say(fam.group === 'dificil' ? fam.label.replace(/\//g, ' y ') : fam.syl.join(', '));
  }

  function start(): void {
    stopAll();
    step = 'play';
    idx = 0;
    score = 0;
    robiScore = 0;
    if (mode === 'read') return showRead();
    rounds = familyRounds(fam, mode, age, settings.levels.syllables, ROUNDS);
    showRound();
  }

  // ---------- Lee la familia: in order, then shuffled ----------
  function showRead(): void {
    let phase: 'order' | 'mixed' = 'order';
    let next = 0;
    const order = fam.syl.slice();
    const draw = () => {
      const list = phase === 'order' ? order : order.slice().sort(() => Math.random() - 0.5);
      const heard = new Set<string>();
      const tiles = list.map((s, i) => {
        const pic = picFor(s);
        const b: HTMLButtonElement = h('button', {
          class: `fam-read${phase === 'order' && i === 0 ? ' next' : ''}`,
          onClick: () => {
            if (phase === 'order' && i !== next) {
              shake(b);
              return;
            }
            say(s);
            pop(520 + i * 60, 0.12);
            b.classList.add('heard');
            b.classList.remove('next');
            heard.add(s);
            if (phase === 'order') {
              next++;
              tiles[next]?.classList.add('next');
            }
            if (heard.size === list.length) done();
          },
        }, h('b', null, s), pic ? h('span', { 'aria-hidden': 'true' }, pic) : null);
        return b;
      });
      put(
        head(phase === 'order' ? 'Lee en orden' : 'Ahora revueltas', [progressDots(2, phase === 'order' ? 0 : 1)]),
        h('p', { class: 'fam-tip' }, phase === 'order' ? 'Toca cada sílaba, de izquierda a derecha.' : 'Toca cada sílaba y léela en voz alta.'),
        h('div', { class: 'fam-reads' }, ...tiles),
      );
      say(phase === 'order' ? 'Toca cada sílaba en orden' : 'Ahora están revueltas. Léelas');
    };
    const done = () => {
      if (phase === 'order') {
        phase = 'mixed';
        later(draw, 900);
        return;
      }
      recordStep('syl', true);
      saveBest(ROUNDS);
      pop(880, 0.3);
      later(() => finish(true), 700);
    };
    draw();
  }

  // ---------- Escucha y elige / Completa la palabra ----------
  function prompt(r: FamilyRound): void {
    if (mode === 'listen') ctx.sayItems([{ t: '¿Dónde dice?', lang: 'es' }, { t: r.answer, lang: 'es' }]);
    else ctx.sayItems([{ t: 'Completa', lang: 'es' }, { t: r.word!.parts.join(''), lang: 'es' }]);
  }

  function showRound(): void {
    stopAll();
    locked = false;
    firstTry = true;
    const r = rounds[idx];
    const hear = h('button', { class: 'bigbtn violet small', onClick: () => prompt(r) }, h('span', { class: 'ico', html: ICONS.speaker }), 'Oír');
    let card: HTMLElement;
    if (mode === 'listen') {
      card = h('div', { class: 'syl-card kcard fam-ear' }, h('span', { class: 'syl-pic', 'aria-hidden': 'true' }, '👂'), hear);
    } else {
      const w = r.word!;
      card = h('div', { class: 'syl-card kcard' }, h('span', { class: 'syl-pic', 'aria-hidden': 'true' }, w.pic),
        h('div', { class: 'fam-word' }, ...w.parts.map((p, i) => h('span', { class: i === r.at ? 'syl-slot fam-gap' : 'fam-part' }, i === r.at ? '' : p))),
        hear);
    }
    const choices = h('div', { class: 'syl-tiles fam-choices' }, ...r.choices.map((c) => {
      const b: HTMLButtonElement = h('button', { class: 'syl-tile', onClick: () => pick(c, b, card) }, c);
      return b;
    }));
    const board = vsRobi ? robiBoard() : null;
    put(
      head(MODE_NAME[mode], [progressDots(ROUNDS, idx)]),
      board?.el ?? null,
      card,
      choices,
    );
    prompt(r);
    if (board) race(board, choices);
  }

  function robiBoard() {
    const bar = h('span', { class: 'fam-robibar' });
    const pic = canvas(90, 68);
    drawThumb(pic, 'robi', 'fill');
    const el = h('div', { class: 'fam-vs' },
      h('span', { class: 'fam-score me' }, h('small', null, 'Tú'), h('b', null, String(score))),
      h('div', { class: 'fam-robi' }, pic, h('span', { class: 'fam-track' }, bar)),
      h('span', { class: 'fam-score robi' }, h('small', null, 'Robi'), h('b', null, String(robiScore))));
    return { el, bar };
  }

  /** Robi fills its bar and answers when it is full; sometimes it gets it wrong. */
  function race(board: { bar: HTMLElement }, choices: HTMLElement): void {
    const { ms, right } = robiPace(age, settings.levels.syllables);
    racing = true;
    const go = (wait: number) => {
      const t0 = performance.now();
      const tick = () => {
        if (!racing) return;
        const p = Math.min(1, (performance.now() - t0) / wait);
        board.bar.style.width = `${p * 100}%`;
        if (p < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        const r = rounds[idx];
        const open = [...choices.children].filter((b) => !(b as HTMLButtonElement).disabled) as HTMLButtonElement[];
        const wrong = open.filter((b) => b.textContent !== r.answer);
        if (Math.random() < right || !wrong.length) {
          const b = open.find((x) => x.textContent === r.answer);
          b?.classList.add('robi');
          robiWins();
        } else {
          const b = wrong[Math.floor(Math.random() * wrong.length)];
          b.disabled = true;
          b.classList.add('robi-miss');
          say(`Robi dice ${b.textContent}... ¡no!`);
          go(wait * 0.6);
        }
      };
      raf = requestAnimationFrame(tick);
    };
    // a little head start while the voice says the question
    later(() => go(ms), 900);
  }

  function robiWins(): void {
    racing = false;
    locked = true;
    robiScore++;
    recordStep('syl', false);
    pop(300, 0.2);
    const r = rounds[idx];
    if (mode === 'complete') fillGap(r);
    ctx.sayItems([{ t: 'Robi lo encontró', lang: 'es' }, { t: mode === 'complete' ? r.word!.parts.join('') : r.answer, lang: 'es' }]);
    later(nextRound, 2600);
  }

  function fillGap(r: FamilyRound): void {
    const gap = wrap.querySelector('.fam-gap');
    if (gap) {
      gap.textContent = r.word!.parts[r.at!];
      gap.classList.add('full');
    }
  }

  function pick(c: string, b: HTMLButtonElement, card: HTMLElement): void {
    if (locked || b.disabled) return;
    const r = rounds[idx];
    if (c !== r.answer) {
      firstTry = false;
      b.disabled = true;
      shake(b);
      pop(220, 0.12);
      if (!vsRobi) prompt(r);
      else say(c);
      return;
    }
    stopAll();
    locked = true;
    b.classList.add('ok');
    recordStep('syl', firstTry);
    // alone, only first tries count; racing Robi, any right answer before Robi's is a point
    if (firstTry || vsRobi) score++;
    if (mode === 'complete') fillGap(r);
    card.classList.add('right');
    pop(880, 0.3);
    ctx.sayItems([{ t: '¡Muy bien!', lang: 'es' }, { t: mode === 'complete' ? r.word!.parts.join('') : r.answer, lang: 'es' }]);
    later(nextRound, 2200);
  }

  function nextRound(): void {
    idx++;
    if (idx < ROUNDS) showRound();
    else {
      saveBest(score);
      finish(false);
    }
  }

  function saveBest(n: number): void {
    const s = scores();
    s[fam.id] = Math.max(s[fam.id] ?? 0, n);
    writeJSON(DATA_KEYS.sylFamilies, s);
  }

  function finish(read: boolean): void {
    stopAll();
    let msg: string;
    let sub: string;
    if (read) {
      msg = '¡Leíste la familia!';
      sub = fam.syl.join(' ');
    } else if (vsRobi) {
      msg = score > robiScore ? '¡Le ganaste a Robi!' : score === robiScore ? '¡Empate!' : '¡Robi ganó esta vez!';
      sub = `Tú ${score} · Robi ${robiScore}`;
    } else {
      msg = score === ROUNDS ? '¡Perfecto!' : score >= ROUNDS / 2 ? '¡Muy bien!' : '¡Buen intento!';
      sub = `${score} de ${ROUNDS} al primer intento`;
    }
    const modes = modesFor(fam);
    const nextMode = modes[modes.indexOf(mode) + 1];
    put(
      h('div', { class: 'gend kcard' },
        h('h2', null, msg, h('small', null, sub)),
        h('div', { class: 'kbtnrow' },
          h('button', { class: 'bigbtn', onClick: start }, 'Otra vez'),
          nextMode ? h('button', { class: 'bigbtn violet', onClick: () => ((mode = nextMode), start()) }, MODE_NAME[nextMode]) : null,
          h('button', { class: 'bigbtn alt', onClick: showPick }, 'Otra familia'))),
    );
    say(`${msg} ${read ? '' : sub.replace('·', 'y')}`);
  }

  showPick();
  return {
    back: () => {
      if (step === 'play') {
        showSetup();
        return true;
      }
      if (step === 'setup') {
        showPick();
        return true;
      }
      return false;
    },
    busy: () => racing,
    destroy: stopAll,
    help: () => {
      if (step === 'play' && mode !== 'read' && rounds[idx]) prompt(rounds[idx]);
      else if (step === 'pick') say('Elige una familia de sílabas, como ta, te, ti, to, tu.');
      else say('Elige un ejercicio y toca A jugar.');
    },
  };
}
