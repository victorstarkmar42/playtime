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
