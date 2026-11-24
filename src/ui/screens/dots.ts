import { charOf } from '../../content/characters';
import { addToAlbum } from '../../core/album';
import { pop } from '../../core/audio';
import { connectNext, hitTest } from '../../core/dotgame';
import { outwardNormals, type Pt } from '../../core/geometry';
import { pickText, practiceLang, primaryLang, speakOrder, type SpeakItem } from '../../core/lang';
import { opText, opWords, skillOf } from '../../core/math';
import { recordDrawing, recordStep, recordWord } from '../../core/progress';
import { settings } from '../../core/settings';
import type { Age } from '../../core/types';
import { saveSession } from '../../game/session';
import { drawCharacter, drawThumb, H, useBoardTransform, W } from '../../render/character';
import { fitBoard } from '../../render/fit';
import { circ, INK } from '../../render/primitives';
import type { Ctx, Screen } from '../context';
import { canvas, h, ICONS } from '../dom';

const DOT = '#F2672E';
const PX_PER_MM = 5; // CSS px per mm on typical phones/tablets
const BASE_R: Record<Age, number> = { '3-4': 17, '5-6': 14, '7-9': 12 };
const BASE_FONT: Record<Age, number> = { '3-4': 40, '5-6': 34, '7-9': 29 };

export function dotsScreen(ctx: Ctx): Screen {
  if (!ctx.state.game) {
    ctx.state.game = null;
    queueMicrotask(() => ctx.show('pick'));
    return { el: h('div', { class: 'view' }) };
  }
  const sess = ctx.state.game;
  const g = sess.game;
  const ch = charOf(sess.key);
  const N = g.dots.length;
  const normals = outwardNormals(g.dots);
  const reduced = () => settings.reduced;

  const board = canvas(W, H);
  board.setAttribute('aria-label', 'Tablero de unir puntos');
  fitBoard(board, sess.key, 9); // room for the dot numbers
  const bctx = board.getContext('2d')!;
  const promptEl = h('div', { class: 'prompt', 'aria-live': 'polite' });
  const prompt2 = h('div', { class: 'prompt2' });
  const progText = h('span');
  const progBar = h('i');
  const wordCard = h('div', { class: 'kcard' });
  const doneActions = h(
    'div',
    { class: 'kbtnrow', hidden: true },
    h('button', { class: 'bigbtn', onClick: () => ((ctx.state.colorKey = sess.key), (ctx.state.freshColor = true), ctx.show('color')) }, '¡A colorear!'),
    h('button', { class: 'bigbtn alt', onClick: () => ((ctx.state.pickFor = 'dots'), ctx.show('pick')) }, 'Otro dibujo'),
  );
  const el = h(
    'div',
    { class: 'view' },
    h('div', { class: 'main' },
      h('div', { class: 'stagebox' }, h('div', { class: 'stage' }, board)),
      h('div', { class: 'side' }, h('div', { class: 'kcard' }, promptEl, prompt2), h('div', { class: 'kcard prog' }, progText, h('span', { class: 'bar' }, progBar)), wordCard, doneActions),
    ),
  );

  // ---- interaction state ----
  let drawing = false;
  let live: Pt | null = null;
  let guide = false;
  let lastAct = performance.now();
  let lastWrong = -1;
  let stepClean = true;
  let doneAt = g.done ? performance.now() - 5000 : 0;
  const wrongAt: Record<number, number> = {};
  let raf = 0;
  let sayTimer = 0;

  const displayW = () => board.offsetWidth || 600;
  const dotR = () => BASE_R[sess.age] * Math.max(1, Math.min(2, 520 / displayW()));
  const hitR = () => settings.tolMm * PX_PER_MM * (W / displayW());

  function toBoardPt(e: PointerEvent): Pt {
    const r = board.getBoundingClientRect();
    return [((e.clientX - r.left) * W) / r.width, ((e.clientY - r.top) * H) / r.height];
  }

  // ---- texts and speech ----
  function nextPromptItems(n: number): SpeakItem[] {
    const op = sess.ops[n];
    if (sess.mode === 'seq' || op.kind === 'start') return speakOrder(settings.lang, n === 1 ? 'Toca el uno' : `Ahora el ${n}`, n === 1 ? 'Touch number one' : `Now number ${n}`);
    const lang = primaryLang(settings.lang);
    return [{ t: opWords(op, lang), lang }];
  }

  function updateSide(): void {
    progText.textContent = `${g.connected}/${N}`;
    progBar.style.width = `${(g.connected / N) * 100}%`;
    doneActions.hidden = !g.done;
    if (g.done) {
      const t = pickText(settings.lang, ch.vocab.titleEs, ch.vocab.titleEn);
      promptEl.textContent = t.main;
      prompt2.textContent = t.sub;
    } else {
      const n = g.connected + 1;
      const op = sess.ops[n];
      if (sess.mode === 'seq' || op.kind === 'start') {
        const t = pickText(settings.lang, n === 1 ? 'Toca el 1' : `Ahora el ${n}`, n === 1 ? 'Touch 1' : `Now ${n}`);
        promptEl.textContent = t.main;
        prompt2.textContent = t.sub;
      } else if (op.kind === 'count') {
        promptEl.replaceChildren(h('span', { class: 'stars', 'aria-label': `${op.n} estrellas` }, '★'.repeat(op.n)));
        prompt2.textContent = pickText(settings.lang, '¿Cuántas estrellas?', 'How many stars?').main;
      } else {
        promptEl.textContent = `${opText(op)} = ?`;
        const sub = pickText(settings.lang, opWords(op, 'es'), opWords(op, 'en'));
        prompt2.textContent = sub.sub || sub.main;
      }
    }
    renderWord();
  }

  function renderWord(): void {
    if (!g.done) {
      wordCard.replaceChildren(h('div', { class: 'mystery' }, h('b', null, '?'), h('span', null, 'Palabra misteriosa · Mystery word', h('br'), 'Termina el dibujo para descubrirla.')));
      return;
    }
    const v = ch.vocab;
    const th = canvas(128, 96);
    drawThumb(th, sess.key, 'fill');
    const wbtn = (lang: 'es' | 'en', word: string) =>
      h('button', { class: `wbtn ${lang}`, onClick: () => (ctx.sayOne(word, lang), lang === 'en' && recordWord(word)) }, h('small', null, lang.toUpperCase()), word, h('span', { class: 'ico', html: ICONS.speaker }));
    const sayMsg = h('span', { class: 'saymsg' });
    wordCard.replaceChildren(
      h('div', { class: 'word' }, th, h('div', { class: 'wpair' }, wbtn('es', v.es), wbtn('en', v.en))),
      h('div', { class: 'extras' }, ...v.extra.map(([es, en]) => {
        const t = pickText(settings.lang, es, en);
        return h('button', { onClick: () => (ctx.sayPair(es, en), recordWord(en)) }, t.sub ? `${t.main} · ${t.sub}` : t.main);
      })),
      h('div', { class: 'saywith' }, h('button', { class: 'bigbtn violet', onClick: () => sayWithMe(sayMsg) }, 'Dilo conmigo'), sayMsg),
    );
  }

  /** Say the word in the practice language, give 3 s with a ring, say it again. Any try counts. */
  function sayWithMe(msg: HTMLElement): void {
    const lang = practiceLang(settings.lang);
    const word = lang === 'en' ? ch.vocab.en : ch.vocab.es;
    if (lang === 'en') recordWord(word);
    clearInterval(sayTimer);
    msg.textContent = word;
    ctx.sayOne(word, lang);
    window.setTimeout(() => {
      const t0 = performance.now();
      const num = h('span', null, '3');
      const ring = h('span', { class: 'ringc' }, num);
      msg.replaceChildren(ring, ' ¡Ahora tú! · Your turn!');
      sayTimer = window.setInterval(() => {
        if (!ring.isConnected) return clearInterval(sayTimer);
        const p = Math.min(1, (performance.now() - t0) / 3000);
        ring.style.setProperty('--p', String(p));
        num.textContent = p >= 1 ? '✓' : String(Math.ceil(3 - p * 3));
        if (p >= 1) {
          clearInterval(sayTimer);
          msg.textContent = `¡Muy bien! · Great! — ${word}`;
          ctx.sayOne(word, lang);
          pop(880, 0.25);
        }
      }, 60);
    }, 1300);
  }

  function shake(): void {
    promptEl.classList.remove('shake');
    void promptEl.offsetWidth;
    promptEl.classList.add('shake');
  }

  // ---- game logic ----
  function check(p: Pt, now: number): void {
    const hit = hitTest(g, p, { hitR: hitR(), dotR: dotR() });
    if (hit.type === 'connect') return connect(now);
    if (hit.type === 'wrong') {
      if (lastWrong !== hit.index) {
        lastWrong = hit.index;
        wrongAt[hit.index] = now;
        stepClean = false;
        pop(220, 0.12);
        shake();
        ctx.sayPair(String(hit.index + 1), String(hit.index + 1));
      }
      return;
    }
    lastWrong = -1;
  }

  function connect(now: number): void {
    const n = g.connected + 1;
    const skill = sess.mode === 'seq' ? 'seq' : skillOf(sess.ops[n]);
    recordStep(skill, stepClean);
    stepClean = true;
    const finished = connectNext(g);
    lastAct = now;
    guide = false;
    lastWrong = -1;
    pop(420 + g.connected * 18);
    saveSession(sess);
    if (finished) {
      doneAt = now;
      pop(880, 0.35);
      recordDrawing(sess.key);
      recordWord(ch.vocab.en);
      ctx.sayPair(`${ch.vocab.titleEs} ${ch.vocab.sentenceEs}`, `${ch.vocab.titleEn} ${ch.vocab.sentenceEn}`);
      window.setTimeout(() => {
        if (!sess.saved) {
          sess.saved = true;
          void addToAlbum(sess.key, 'reveal', board);
        }
      }, reduced() ? 50 : 1500);
    } else {
      const items = speakOrder(settings.lang, String(n), String(n));
      if (sess.mode === 'math') items.push(...nextPromptItems(n + 1));
      ctx.sayItems(items);
    }
    updateSide();
  }

  board.addEventListener('pointerdown', (e) => {
    if (g.done) return;
    board.setPointerCapture(e.pointerId);
    drawing = true;
    live = toBoardPt(e);
    check(live, performance.now());
  });
  board.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const now = performance.now();
    const evs = e.getCoalescedEvents?.() ?? [];
    for (const ev of evs.length ? evs : [e]) {
      live = toBoardPt(ev);
      check(live, now);
    }
  });
  const end = () => {
    drawing = false;
    live = null;
    lastWrong = -1;
  };
  board.addEventListener('pointerup', end);
  board.addEventListener('pointercancel', end);

  // ---- rendering ----
  function render(now: number): void {
    const c = bctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    const R = dotR();
    const rv = g.done ? (reduced() ? 1 : Math.min(1, (now - doneAt) / 1400)) : 0;
    if (rv > 0) {
      useBoardTransform(c);
      drawCharacter(c, ch, 'fill', rv);
      c.setTransform(1, 0, 0, 1, 0, 0);
    }
    const fade = 1 - rv;
    if (fade <= 0) return;
    c.globalAlpha = fade;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    if (g.connected > 1) {
      c.beginPath();
      c.moveTo(...g.dots[0]);
      for (let i = 1; i < g.connected; i++) c.lineTo(...g.dots[i]);
      if (g.done) c.closePath();
      c.lineWidth = R * 0.6;
      c.strokeStyle = INK;
      c.stroke();
    }
    if (!g.done && g.connected > 0) {
      const a = g.dots[g.connected - 1];
      const b = g.dots[g.connected];
      if (guide) {
        c.setLineDash([4, 22]);
        c.lineWidth = 10;
        c.strokeStyle = '#9DB6D6';
        c.beginPath();
        c.moveTo(...a);
        c.lineTo(...b);
        c.stroke();
        c.setLineDash([]);
      }
      if (live && drawing) {
        c.lineWidth = R * 0.5;
        c.strokeStyle = 'rgba(34,48,79,.35)';
        c.beginPath();
        c.moveTo(...a);
        c.lineTo(...live);
        c.stroke();
      }
    }
    const idle = settings.hintDelay > 0 && now - lastAct > settings.hintDelay * 1000;
    const pulseNext = !g.done && (sess.age === '3-4' || guide || idle);
    const fs = Math.round((BASE_FONT[sess.age] * R) / BASE_R[sess.age]);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `800 ${fs}px "Baloo 2", "Trebuchet MS", sans-serif`;
    for (let i = 0; i < N; i++) {
      let [x, y] = g.dots[i];
      const since = now - (wrongAt[i] ?? -1e9);
      const wob = since < 450 ? Math.sin(since / 30) * 8 * (1 - since / 450) : 0;
      x += wob;
      const isNext = i === g.connected && !g.done;
      const joined = i < g.connected;
      if (isNext && pulseNext) {
        if (reduced()) circ(c, x, y, R + 14, 'rgba(242,103,46,.25)');
        else {
          const ph = (now % 1100) / 1100;
          circ(c, x, y, R + 10 + ph * 26, `rgba(242,103,46,${0.35 * (1 - ph)})`);
        }
      }
      circ(c, x, y, isNext ? R * 1.25 : R, joined ? INK : wob ? '#B9A8FF' : DOT);
      if (joined) circ(c, x, y, R * 0.45, '#fff');
      const [ox, oy] = normals[i];
      const lx = x + ox * (R + fs * 0.75);
      const ly = y + oy * (R + fs * 0.7);
      c.lineWidth = 8;
      c.strokeStyle = '#FFFFFF';
      c.strokeText(String(i + 1), lx, ly);
      c.fillStyle = joined ? '#8A97B4' : INK;
      c.fillText(String(i + 1), lx, ly);
    }
    c.globalAlpha = 1;
  }
  const loop = (now: number) => {
    render(now);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  // Automated browser tests (?e2e) need the on-screen position of each dot.
  if (location.search.includes('e2e')) {
    (window as unknown as { __pymDots?: () => Pt[] }).__pymDots = () => {
      const r = board.getBoundingClientRect();
      return g.dots.map(([x, y]) => [r.left + (x * r.width) / W, r.top + (y * r.height) / H] as const);
    };
  }

  updateSide();
  if (!g.done) window.setTimeout(() => ctx.sayItems(nextPromptItems(g.connected + 1)), 250);

  return {
    el,
    destroy() {
      cancelAnimationFrame(raf);
      clearInterval(sayTimer);
    },
    onHelp() {
      if (g.done) return;
      if (g.connected === 0) lastAct = 0;
      else guide = true;
      ctx.sayItems(nextPromptItems(g.connected + 1));
    },
  };
}
