import { settings, updateSettings, type Level, type LevelGame } from '../../core/settings';
import type { Ctx } from '../context';
import { h } from '../dom';

// The way out of every screen is the back arrow of the top bar (and the phone's back button), see app.ts.

/** Progress dots for a 5-question round: done, current, pending. */
export const progressDots = (total: number, done: number, current = true): HTMLElement =>
  h('div', { class: 'gstars', 'aria-label': `Pregunta ${Math.min(done + 1, total)} de ${total}` },
    ...Array.from({ length: total }, (_, i) => h('span', { class: i < done ? 'done' : i === done && current ? 'now' : '' })));

/** Shakes an element after a wrong answer. */
export function shake(el: HTMLElement): void {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

export const LEVEL_NAME: Record<Level, string> = { 1: 'Fácil', 2: 'Normal', 3: 'Reto', 4: 'Experto' };
const LEVEL_EN: Record<Level, string> = { 1: 'Easy', 2: 'Normal', 3: 'Challenge', 4: 'Expert' };

/** Three buttons with 1–3 stars: the difficulty inside the child's age. Changing it starts again. */
export function levelPicker(ctx: Ctx, game: LevelGame, onChange: () => void): HTMLElement {
  const cur = settings.levels[game];
  return h('div', { class: 'lvl', role: 'radiogroup', 'aria-label': 'Nivel' },
    ...([1, 2, 3, 4] as Level[]).map((l) => h('button', {
      role: 'radio', 'aria-checked': String(l === cur), 'aria-label': `Nivel ${LEVEL_NAME[l]}`, title: LEVEL_NAME[l],
      onClick: () => {
        if (l === settings.levels[game]) return;
        setLevel(game, l);
        ctx.sayPair(`Nivel ${LEVEL_NAME[l]}`, `${LEVEL_EN[l]} level`);
        onChange();
      },
    }, '★'.repeat(l))));
}

export function setLevel(game: LevelGame, l: Level): void {
  updateSettings({ levels: { ...settings.levels, [game]: l } });
}

/** After a perfect round below "Experto": a button to go up one level. */
export function levelUpButton(ctx: Ctx, game: LevelGame, score: number, total: number, onChange: () => void): HTMLElement | null {
  const l = settings.levels[game];
  if (score < total || l >= 4) return null;
  const up = (l + 1) as Level;
  return h('button', { class: 'bigbtn violet', onClick: () => (setLevel(game, up), ctx.sayPair(`Nivel ${LEVEL_NAME[up]}`, `${LEVEL_EN[up]} level`), onChange()) },
    `Subir a ${LEVEL_NAME[up]} ${'★'.repeat(up)}`);
}
