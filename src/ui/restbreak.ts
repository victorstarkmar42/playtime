import { pop } from '../core/audio';
import { breakSteps, type BREAK_STEPS } from '../core/rest';
import { h, holdToActivate } from './dom';

type Icon = (typeof BREAK_STEPS)[number]['icon'];

const INK = '#22304F';
const ICON_SVG: Record<Icon, string> = {
  far: `<svg viewBox="0 0 100 100"><circle cx="74" cy="26" r="13" fill="#FFD25A"/><path d="M4 84 L34 42 L52 64 L68 46 L96 84Z" fill="#8ED67E" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M28 50 L34 42 L40 50" fill="#fff"/></svg>`,
  blink: `<svg viewBox="0 0 100 100"><g class="rb-blink"><path d="M10 50 Q50 14 90 50 Q50 86 10 50Z" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="50" cy="50" r="14" fill="#4FB3E8"/><circle cx="50" cy="50" r="6" fill="${INK}"/></g></svg>`,
  close: `<svg viewBox="0 0 100 100" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"><path d="M12 46 Q50 76 88 46"/><path d="M26 58 L20 68 M42 64 L40 75 M58 64 L60 75 M74 58 L80 68"/></svg>`,
  stretch: `<svg viewBox="0 0 100 100" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><circle cx="50" cy="30" r="9" fill="#FFD9B8"/><path d="M50 40 V68 M50 68 L38 92 M50 68 L62 92 M50 46 L30 12 M50 46 L70 12"/></svg>`,
  water: `<svg viewBox="0 0 100 100"><path d="M28 18 H72 L66 90 H34Z" fill="#fff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M31 46 H69 L66 87 H34Z" fill="#7FC4F5"/></svg>`,
};

export interface RestBreak {
  el: HTMLElement;
  /** Shows the break. `canSkip`: an adult may end it early with a long press. */
  start(sec: number, canSkip: boolean, onDone: () => void): void;
  active(): boolean;
}

/**
 * Descanso para los ojos: pasos con dibujo y voz (mirar lejos, parpadear, estirarse…) y un reloj
 * en forma de anillo. Al terminar aparece "Seguir jugando".
 */
export function createRestBreak(sayPair: (es: string, en: string) => void, reduced: () => boolean): RestBreak {
  const icon = h('div', { class: 'rb-icon', 'aria-hidden': 'true' });
  const step = h('p', { class: 'rb-step', 'aria-live': 'polite' });
  const num = h('b', null);
  const ring = h('div', { class: 'rb-ring', role: 'timer' }, num);
  const go = h('button', { class: 'bigbtn rb-go', hidden: true }, 'Seguir jugando');
  const skip = h('button', { class: 'bigbtn alt small gate rb-skip', hidden: true }, 'Saltar descanso (adulto: mantén presionado)', h('span', { class: 'ring' }));
  const el = h(
    'div',
    { class: 'restbreak', hidden: true },
    h('div', { class: 'rb-box' }, h('h2', null, 'Descanso para los ojos'), icon, step, ring, go, skip),
  );

  let raf = 0;
  let done: (() => void) | null = null;
  let offset = 0;

  const finish = () => {
    cancelAnimationFrame(raf);
    el.hidden = true;
    const cb = done;
    done = null;
    cb?.();
  };
  go.onclick = finish;
  holdToActivate(skip, 1500, finish);

  return {
    el,
    active: () => !el.hidden,
    start(sec, canSkip, onDone) {
      cancelAnimationFrame(raf);
      done = onDone;
      const steps = breakSteps(sec, offset);
      offset = (offset + 1) % 5;
      const each = (sec * 1000) / steps.length;
      let shown = -1;
      go.hidden = true;
      skip.hidden = !canSkip;
      ring.hidden = false;
      el.hidden = false;
      el.classList.toggle('still', reduced());
      const t0 = performance.now();
      const tick = () => {
        const ms = performance.now() - t0;
        const i = Math.min(steps.length - 1, Math.floor(ms / each));
        if (i !== shown) {
          shown = i;
          const s = steps[i];
          icon.innerHTML = ICON_SVG[s.icon];
          step.textContent = s.es;
          if (i === 0) sayPair(`Es hora de descansar los ojos. ${s.es}`, `Time to rest your eyes. ${s.en}`);
          else sayPair(s.es, s.en);
        }
        const left = Math.max(0, sec - ms / 1000);
        num.textContent = String(Math.ceil(left));
        ring.style.setProperty('--p', String(1 - left / sec));
        if (left <= 0) {
          ring.hidden = true;
          step.textContent = '¡Muy bien! Tus ojos ya descansaron.';
          go.hidden = false;
          skip.hidden = true;
          pop(880, 0.15);
          sayPair('¡Muy bien! Ya puedes seguir jugando.', 'Well done! You can keep playing.');
          return;
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    },
  };
}
