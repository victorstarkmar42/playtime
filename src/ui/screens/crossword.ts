import { charOf } from '../../content/characters';
import { COLORS, NUMBERS } from '../../content/words';
import { pop } from '../../core/audio';
import { GUESS_POOL, spellLang } from '../../core/guess';
import { crosswordFor, makeCrossword, type Crossword, type Placed } from '../../core/puzzles';
import { recordWord } from '../../core/progress';
import { settings } from '../../core/settings';
import { drawThumb } from '../../render/character';
import type { Ctx, Screen } from '../context';
import { canvas, h } from '../dom';
import { shake } from './gamekit';

/** A clue is a picture, a colour swatch or a number: no reading needed to know the word. */
type Clue = { word: string; es: string; en: string; draw: () => HTMLElement };

function clues(lang: 'es' | 'en', maxLen: number): Clue[] {
  const ok = (w: string) => !/\s/.test(w) && [...w].length >= 3 && [...w].length <= maxLen;
  const out: Clue[] = [];
  for (const k of GUESS_POOL) {
    const v = charOf(k).vocab;
    out.push({ word: v[lang], es: v.es, en: v.en, draw: () => { const c = canvas(160, 120); drawThumb(c, k, 'fill'); return c; } });
  }
  for (const c of COLORS) out.push({ word: c[lang], es: c.es, en: c.en, draw: () => h('span', { class: 'cswatch', style: `background:${c.hex}` }) });
  NUMBERS.forEach((n, i) => out.push({ word: n[lang], es: n.es, en: n.en, draw: () => h('span', { class: 'cnum' }, String(i + 1)) }));
  return out.filter((c) => ok(c.word)).map((c) => ({ ...c, word: c.word.toLowerCase() }));
}

/** Crucigrama con dibujos: 2 short words with most letters written (3–4) up to 5 words from scratch (7–9). */
export function crosswordScreen(ctx: Ctx): Screen {
  const cfg = crosswordFor(settings.age);
  const lang = spellLang(settings.lang);
  const pool = clues(lang, cfg.maxLen);
  let cw: Crossword;
  let fill: string[] = [];
  let cur: Placed;
  let sel = -1;
  const wrap = h('div', { class: 'crossg' });
  const el = h('div', { class: 'view' }, wrap);
  const gridEl = h('div', { class: 'cgrid' });
  const clueEl = h('div', { class: 'cclues' });
  const keys = h('div', { class: 'ckeys' });
  const status = h('p', { class: 'gstatus', role: 'status' });
  const clueOf = (p: Placed) => pool.find((c) => c.word === p.word)!;
  const cellsOf = (p: Placed) => [...p.word].map((_, k) => (p.y + (p.across ? 0 : k)) * cw.w + p.x + (p.across ? k : 0));
  const done = (p: Placed) => cellsOf(p).every((i) => fill[i]);

  function start(): void {
    cw = makeCrossword(pool.map((c) => c.word), cfg.words);
    fill = cw.cells.map(() => '');
    // write some letters already (never a whole word)
    for (const p of cw.words) {
      const idx = cellsOf(p);
      const show = Math.min(idx.length - 1, Math.round(idx.length * cfg.reveal));
      for (const i of [...idx].sort(() => Math.random() - 0.5).slice(0, show)) fill[i] = cw.cells[i];
    }
    // a crossing word may have filled the last gap of another: open one of its own letters again
    for (const p of cw.words) {
      if (!done(p)) continue;
      const idx = cellsOf(p);
      const own = idx.filter((i) => cw.words.every((q) => q === p || !cellsOf(q).includes(i)));
      fill[(own.length ? own : idx)[Math.floor(Math.random() * (own.length || idx.length))]] = '';
    }
    cur = cw.words.find((p) => !done(p)) ?? cw.words[0];
    sel = cellsOf(cur).find((i) => !fill[i]) ?? -1;
    status.textContent = lang === 'en' ? 'Escribe en inglés lo que ves · Write it in English' : 'Escribe lo que ves en cada dibujo';
    render();
    ctx.sayPair('Mira los dibujos y escribe sus nombres', 'Look at the pictures and write their names');
  }

  function choose(p: Placed): void {
    cur = p;
    sel = cellsOf(p).find((i) => !fill[i]) ?? cellsOf(p)[0];
    if (settings.age === '3-4') ctx.sayOne(p.word, lang);
    render();
  }

  function render(): void {
    const active = new Set(cellsOf(cur));
    const numAt = new Map(cw.words.map((p) => [p.y * cw.w + p.x, p.num]));
    gridEl.style.setProperty('--w', String(cw.w));
    gridEl.replaceChildren(...cw.cells.map((ch, i) => {
      if (!ch) return h('span', { class: 'ccell empty' });
      return h('button', {
        class: `ccell${active.has(i) ? ' on' : ''}${i === sel ? ' sel' : ''}${fill[i] ? ' full' : ''}`,
        onClick: () => {
          const mine = cw.words.filter((p) => cellsOf(p).includes(i));
          if (mine.length > 1 && sel === i) cur = mine.find((p) => p !== cur) ?? cur;
          else if (!mine.includes(cur)) cur = mine[0];
          sel = i;
          render();
        },
      }, numAt.has(i) ? h('small', null, String(numAt.get(i))) : null, fill[i]);
    }));
    clueEl.replaceChildren(...cw.words.map((p) =>
      h('button', { class: `cclue${p === cur ? ' on' : ''}${done(p) ? ' ok' : ''}`, onClick: () => choose(p) },
        h('b', null, `${p.num} ${p.across ? '→' : '↓'}`), clueOf(p).draw())));
    const need = new Set(cw.cells.filter((ch, i) => ch && !fill[i]));
    const decoys = [...'aeioulnrst'].filter((c) => !need.has(c)).slice(0, 3);
    keys.replaceChildren(...[...need, ...decoys].sort((a, b) => a.localeCompare(b, 'es')).map((ch) => {
      const b: HTMLButtonElement = h('button', { class: 'gtile', onClick: () => type(ch, b) }, ch);
      return b;
    }));
  }

  function type(ch: string, btn: HTMLElement): void {
    if (sel < 0 || fill[sel]) return;
    if (cw.cells[sel] !== ch) {
      shake(btn);
      pop(220, 0.12);
      return;
    }
    fill[sel] = ch;
    pop(560, 0.08);
    if (done(cur)) {
      const c = clueOf(cur);
      recordWord(c.en);
      ctx.sayPair(c.es, c.en);
      const next = cw.words.find((p) => !done(p));
      if (next) cur = next;
    }
    sel = cellsOf(cur).find((i) => !fill[i]) ?? -1;
    render();
    if (cw.words.every(done)) {
      pop(880, 0.35);
      status.textContent = '¡Crucigrama completo! · Crossword complete!';
      window.setTimeout(() => ctx.sayPair('¡Completaste el crucigrama!', 'You finished the crossword!'), 1200);
    }
  }

  wrap.append(
    h('div', { class: 'ghead' }, h('h2', null, 'Crucigrama', h('small', null, `Crossword · Toca un dibujo y escribe su nombre${lang === 'en' ? ' en inglés' : ''}`))),
    status,
    h('div', { class: 'cbox' }, h('div', { class: 'cleft' }, gridEl, keys), clueEl),
    h('div', { class: 'kbtnrow gbtns' }, h('button', { class: 'bigbtn alt small', onClick: start }, 'Otro crucigrama · New')),
  );
  start();
  return { el, onHelp: () => ctx.sayPair('Toca un dibujo y escribe su nombre con las letras.', 'Touch a picture and spell its name.') };
}
