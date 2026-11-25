import { pop } from '../../core/audio';
import { BASTA_CATEGORIES, BASTA_SECONDS, bastaFirstLetter, bastaHints, bastaLetters, ROBI_SLIP, robiAnswer } from '../../core/basta';
import { primaryLang } from '../../core/lang';
import { settings } from '../../core/settings';
import type { Ctx, Screen } from '../context';
import { h } from '../dom';
import { exitBtn } from './gamekit';
import { HEART_SVG, ROBOT_SVG, STAR_SVG } from './gato';

type Who = 1 | 2;

/** Basta en rueda de letras: say a word of the category, press its first letter, beat the clock. */
export function bastaScreen(ctx: Ctx): Screen {
  const age = settings.age;
  const lang = primaryLang(settings.lang);
  const letters = bastaLetters(age);
  const SECS = BASTA_SECONDS[age];
  let mode: 'two' | 'robi' = 'robi';
  let used: string[] = [];
  let turn: Who = 1;
  let starter: Who = 1;
  let running = false;
  let endsAt = 0;
  let loser: Who | 0 = 0;
  let lastBeep = 0;
  let catIx = Math.floor(Math.random() * BASTA_CATEGORIES.length);
  let showHints = age === '3-4';
  let choosing = true;
  const score: Record<Who, number> = { 1: 0, 2: 0 };
  let tick = 0;
  let robiTimer = 0;
  const wrap = h('div', { class: 'bastag' });
  const el = h('div', { class: 'view' }, wrap);
  const cat = () => BASTA_CATEGORIES[catIx];
  const nameOf = (p: Who) => (mode === 'robi' ? (p === 1 ? { es: 'Tú', en: 'You' } : { es: 'Robi', en: 'Robi' }) : p === 1 ? { es: 'Estrella', en: 'Star' } : { es: 'Corazón', en: 'Heart' });
  const sayCategory = () => ctx.sayPair(`Di ${cat().es.toLowerCase()}`, `Say ${cat().en.toLowerCase()}`);

  function stopTimers(): void {
    clearInterval(tick);
    clearTimeout(robiTimer);
  }

  // ---------------- choose who to play with ----------------
  function sayChoices(): void {
    ctx.sayPair(
      'Basta en rueda de letras. Di una palabra de la tarjeta y toca su primera letra antes de que se acabe el tiempo. ¿Juegas con otra persona en este celular, o contra Robi, el robot que juega solo?',
      'Letter wheel. Say a word for the card and press its first letter before time runs out. Play with someone on this device, or against Robi, the robot that plays by itself?',
    );
  }
  function chooseMode(): void {
    stopTimers();
    choosing = true;
    running = false;
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('h2', null, 'Basta', h('small', null, 'Rueda de letras · Di una palabra y toca su primera letra')), exitBtn(ctx)),
      h('div', { class: 'gmodes' },
        h('button', { class: 'gmode', onClick: () => start('two') },
          h('span', { class: 'gpair' }, h('i', { html: STAR_SVG }), h('i', { html: HEART_SVG })),
          h('b', null, 'Dos jugadores'), h('small', null, 'Two players · Se pasan el celular en cada turno')),
        h('button', { class: 'gmode', onClick: () => start('robi') },
          h('span', { class: 'gpair' }, h('i', { html: STAR_SVG }), h('i', { html: ROBOT_SVG })),
          h('b', null, 'Contra Robi'), h('small', null, 'Robi es un robot que juega solo: dice su palabra y toca su letra')),
      ),
    );
    sayChoices();
  }

  // ---------------- the game ----------------
  const status = h('p', { class: 'bstatus', role: 'status' });
  const catText = h('b');
  const nextCat = h('button', { class: 'bigbtn alt small', onClick: () => {
    if (running) return;
    catIx = (catIx + 1 + Math.floor(Math.random() * (BASTA_CATEGORIES.length - 1))) % BASTA_CATEGORIES.length;
    used = [];
    loser = 0;
    pop(600, 0.08);
    sayCategory();
    render();
  } }, 'Otra tarjeta');
  const chips: Record<Who, HTMLElement> = { 1: h('div', { class: 'bplayer' }), 2: h('div', { class: 'bplayer' }) };
  const size = Math.min(13, ((2 * Math.PI * 40) / letters.length) * 0.82);
  const letterBtns = letters.map((l, i) => {
    const a = (i / letters.length) * Math.PI * 2;
    return h('button', {
      class: 'blet',
      'aria-label': `Letra ${l}`,
      dataset: { l },
      style: `--s:${size.toFixed(2)};left:${(50 + 40 * Math.sin(a) - size / 2).toFixed(2)}%;top:${(50 - 40 * Math.cos(a) - size / 2).toFixed(2)}%`,
      onClick: () => humanPress(l),
    }, l);
  });
  const timeNum = h('span', null, '▶');
  const timeLabel = h('small', null, 'Empezar');
  const timer = h('button', { class: 'btimer', 'aria-label': 'Empezar ronda', onClick: () => !running && startRound() }, timeNum, timeLabel);
  const wheel = h('div', { class: 'bwheel' }, ...letterBtns, timer);
  const hintsBtn = h('button', { class: 'bigbtn alt small', onClick: () => ((showHints = !showHints), render()) });
  const hints = h('div', { class: 'bhints' });

  function start(m: 'two' | 'robi'): void {
    mode = m;
    choosing = false;
    score[1] = score[2] = 0;
    used = [];
    loser = 0;
    running = false;
    wrap.replaceChildren(
      h('div', { class: 'ghead' }, h('button', { class: 'bigbtn alt small gexit', onClick: chooseMode }, '← Salir · Exit'), h('h2', null, 'Basta')),
      h('div', { class: 'bbody' },
        h('div', { class: 'bside' },
          h('div', { class: 'bplayers' }, chips[1], chips[2]),
          h('div', { class: 'bcard' }, h('span', null, h('small', null, 'Tarjeta · Category'), catText), nextCat),
          status,
          h('div', { class: 'bhintrow' }, hintsBtn, hints),
        ),
        h('div', { class: 'bwheel-box' }, wheel),
      ),
    );
    render();
    sayCategory();
  }

  function startRound(): void {
    used = [];
    robiSaid = '';
    loser = 0;
    turn = starter;
    starter = starter === 1 ? 2 : 1;
    running = true;
    endsAt = performance.now() + SECS * 1000;
    pop(700, 0.12);
    sayCategory();
    clearInterval(tick);
    tick = window.setInterval(onTick, 200);
    render();
    if (mode === 'robi' && turn === 2) robiTurn();
  }

  function onTick(): void {
    if (!running) return;
    const left = endsAt - performance.now();
    if (left <= 0) return timeUp();
    const s = Math.ceil(left / 1000);
    if (s <= 3 && s !== lastBeep) {
      lastBeep = s;
      pop(440, 0.06);
    }
    renderTimer();
  }

  function timeUp(): void {
    running = false;
    clearInterval(tick);
    clearTimeout(robiTimer);
    loser = turn;
    const winner: Who = turn === 1 ? 2 : 1;
    score[winner]++;
    pop(260, 0.3);
    if (mode === 'robi') {
      if (loser === 1) ctx.sayPair('¡Se acabó el tiempo! Gana Robi. ¡Otra ronda!', 'Time is up! Robi wins. Another round!');
      else ctx.sayPair('¡A Robi se le acabó el tiempo! ¡Ganaste!', 'Robi ran out of time! You win!');
    } else ctx.sayPair(`Se acabó el tiempo de ${nameOf(loser).es}. ¡Gana ${nameOf(winner).es}!`, `${nameOf(loser).en} ran out of time. ${nameOf(winner).en} wins!`);
    render();
  }

  function take(l: string): void {
    used.push(l);
    if (used.length >= letters.length) {
      running = false;
      clearInterval(tick);
      clearTimeout(robiTimer);
      loser = 0;
      ctx.sayPair('¡Usaron todas las letras! Muy bien los dos.', 'You used every letter! Well done, both of you.');
      return render();
    }
    turn = turn === 1 ? 2 : 1;
    endsAt = performance.now() + SECS * 1000;
    lastBeep = 0;
    render();
    if (mode === 'robi' && turn === 2) robiTurn();
  }

  function humanPress(l: string): void {
    if (!running || used.includes(l) || (mode === 'robi' && turn === 2)) return;
    pop(520 + letters.indexOf(l) * 20, 0.08);
    take(l);
  }

  function robiTurn(): void {
    clearTimeout(robiTimer);
    robiTimer = window.setTimeout(() => {
      if (!running || turn !== 2) return;
      if (Math.random() < ROBI_SLIP[age]) return; // Robi gets stuck: the clock runs out
      const ans = robiAnswer(cat(), lang, letters, used);
      if (!ans) return;
      ctx.sayOne(ans.word[lang], lang);
      robiSaid = `${ans.word.pic} ${ans.word[lang]}`;
      pop(620, 0.08);
      take(ans.letter);
    }, 1800 + Math.random() * 2200);
  }
  let robiSaid = '';

  function renderTimer(): void {
    if (running) {
      const left = Math.max(0, endsAt - performance.now());
      const s = Math.ceil(left / 1000);
      timeNum.textContent = String(s);
      timeLabel.textContent = 'segundos';
      timer.setAttribute('aria-label', `${s} segundos`);
      timer.className = `btimer run${s <= 3 ? ' low' : ''}`;
    } else {
      timeNum.textContent = '▶';
      timeLabel.textContent = loser || used.length ? 'Otra ronda' : 'Empezar';
      timer.setAttribute('aria-label', 'Empezar ronda');
      timer.className = 'btimer';
    }
  }

  function render(): void {
    catText.textContent = lang === 'en' ? cat().en : cat().es;
    nextCat.disabled = running;
    for (const p of [1, 2] as Who[]) {
      chips[p].className = `bplayer${running && turn === p ? ' on' : ''}`;
      chips[p].replaceChildren(
        h('i', { html: p === 1 ? STAR_SVG : mode === 'robi' ? ROBOT_SVG : HEART_SVG }),
        h('span', null, nameOf(p).es),
        h('b', null, String(score[p])),
      );
    }
    for (const b of letterBtns) {
      const l = b.dataset.l!;
      const isUsed = used.includes(l);
      b.classList.toggle('used', isUsed);
      b.setAttribute('aria-pressed', String(isUsed));
      b.disabled = !running || isUsed || (mode === 'robi' && turn === 2);
    }
    status.textContent = loser
      ? mode === 'robi'
        ? loser === 1 ? 'Se acabó tu tiempo: gana Robi' : '¡A Robi se le acabó el tiempo! Ganaste'
        : `¡Gana ${nameOf(loser === 1 ? 2 : 1).es}!`
      : !running
        ? used.length ? '¡Usaron todas las letras!' : 'Toca el reloj para empezar'
        : mode === 'robi' && turn === 2
          ? 'Robi está pensando…'
          : mode === 'robi'
            ? robiSaid && used.length ? `Robi dijo: ${robiSaid}. ¡Tu turno!` : 'Tu turno: di una palabra y toca su letra'
            : `Turno de ${nameOf(turn).es}: di una palabra y toca su letra`;
    hintsBtn.textContent = showHints ? 'Ocultar ideas' : 'Ideas';
    const list = showHints ? bastaHints(cat(), lang, letters, used).slice(0, age === '3-4' ? 4 : 3) : [];
    hints.replaceChildren(...list.map((w) => {
      const word = w[lang];
      const first = bastaFirstLetter(word);
      return h('button', { class: 'bhint', onClick: () => ctx.sayOne(word, lang) }, h('i', null, w.pic), h('b', null, first), word.slice(1));
    }));
    renderTimer();
  }

  chooseMode();
  if (location.search.includes('e2e')) {
    (window as unknown as { __pymBasta?: () => { used: string[]; running: boolean; turn: number } }).__pymBasta = () => ({ used: [...used], running, turn });
  }
  return {
    el,
    busy: () => running,
    destroy: stopTimers,
    onHelp: () => (choosing
      ? sayChoices()
      : ctx.sayPair(
          `Di en voz alta ${cat().es.toLowerCase()} y toca la letra con la que empieza. Cada letra se usa una vez. Si se acaba el tiempo en tu turno, pierdes la ronda.${showHints ? '' : ' Si no se te ocurre nada, toca Ideas.'}`,
          `Say ${cat().en.toLowerCase()} out loud and press its first letter. Each letter is used once. If time runs out on your turn, you lose the round.`,
        )),
  };
}
