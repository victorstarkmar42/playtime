import type { Ctx } from '../context';
import { h } from '../dom';

/** Always-visible way out of a game, back to the games menu. */
export const exitBtn = (ctx: Ctx, to: 'games' | 'home' = 'games'): HTMLButtonElement =>
  h('button', { class: 'bigbtn alt small gexit', onClick: () => ctx.show(to) }, to === 'games' ? '← Salir · Exit' : '← Inicio · Home');

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
