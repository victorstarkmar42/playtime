import type { Age } from './types';

/**
 * Pausas para los ojos y límite de juego. Hay dos planes que el adulto configura por separado:
 * "sin supervisión" (el niño juega solo: los descansos no se pueden saltar) y "con supervisión"
 * (un adulto está cerca: puede saltar un descanso manteniendo presionado).
 */
export interface RestPlan {
  /** Minutes of play between eye breaks; 0 = no breaks. */
  breakEvery: number;
  /** Length of each break, in seconds. */
  breakSec: number;
  /** Minutes of play before the "time to rest" night screen; 0 = no limit. */
  limitMin: number;
}

export const BREAK_EVERY: readonly number[] = [0, 10, 15, 20, 30];
export const BREAK_SEC: readonly number[] = [20, 40, 60, 120];
export const LIMIT_MIN: readonly number[] = [0, 15, 20, 30, 40, 60];

/** Starting points by age, based on the 20-20-20 habit and screen-time guidance for young children. */
export const REST_PRESETS: Record<Age, { solo: RestPlan; together: RestPlan }> = {
  '3-4': { solo: { breakEvery: 10, breakSec: 60, limitMin: 20 }, together: { breakEvery: 15, breakSec: 40, limitMin: 40 } },
  '5-6': { solo: { breakEvery: 15, breakSec: 60, limitMin: 30 }, together: { breakEvery: 20, breakSec: 40, limitMin: 60 } },
  '7-9': { solo: { breakEvery: 20, breakSec: 60, limitMin: 40 }, together: { breakEvery: 20, breakSec: 40, limitMin: 60 } },
};

export function sanitizePlan(raw: unknown, fallback: RestPlan): RestPlan {
  const out = { ...fallback };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  const pick = (v: unknown, list: readonly number[]) => typeof v === 'number' && list.includes(v);
  if (pick(r.breakEvery, BREAK_EVERY)) out.breakEvery = r.breakEvery as number;
  if (pick(r.breakSec, BREAK_SEC)) out.breakSec = r.breakSec as number;
  if (pick(r.limitMin, LIMIT_MIN)) out.limitMin = r.limitMin as number;
  return out;
}

export type RestEvent = 'break' | 'limit' | null;

/**
 * Counts active play time and says when a break or the end of play is due. Time does not count
 * while paused (a break or the night screen is showing, or the app is hidden).
 */
export class RestClock {
  playMs = 0;
  sinceBreakMs = 0;
  private limitFired = false;
  /** A break is due but the current screen asked to wait (e.g. a timed Basta round). */
  pendingBreak = false;

  advance(dtMs: number, plan: RestPlan, canInterrupt = true): RestEvent {
    if (this.limitFired) return null; // play is over until an adult continues
    this.playMs += dtMs;
    this.sinceBreakMs += dtMs;
    if (!this.limitFired && plan.limitMin > 0 && this.playMs >= plan.limitMin * 60000) {
      if (!canInterrupt) return null;
      this.limitFired = true;
      this.pendingBreak = false;
      return 'limit';
    }
    if (plan.breakEvery > 0 && this.sinceBreakMs >= plan.breakEvery * 60000) this.pendingBreak = true;
    if (this.pendingBreak && canInterrupt) {
      this.pendingBreak = false;
      this.sinceBreakMs = 0;
      return 'break';
    }
    return null;
  }

  /** A break was taken (or skipped by an adult): the next one is a full interval away. */
  breakDone(): void {
    this.sinceBreakMs = 0;
    this.pendingBreak = false;
  }

  /** An adult chose to keep playing after the limit: start a fresh period. */
  resetLimit(): void {
    this.playMs = 0;
    this.sinceBreakMs = 0;
    this.limitFired = false;
    this.pendingBreak = false;
  }
}

/** What the child does during a break, said aloud one step at a time. */
export const BREAK_STEPS: { es: string; en: string; icon: 'far' | 'blink' | 'close' | 'stretch' | 'water' }[] = [
  { es: 'Mira algo que esté lejos, por la ventana o al fondo del cuarto.', en: 'Look at something far away.', icon: 'far' },
  { es: 'Parpadea muchas veces, rápido, como mariposa.', en: 'Blink many times, like a butterfly.', icon: 'blink' },
  { es: 'Cierra los ojos y respira despacio. Uno, dos, tres.', en: 'Close your eyes and breathe slowly.', icon: 'close' },
  { es: 'Levántate y estírate muy alto, como una jirafa.', en: 'Stand up and stretch up high, like a giraffe.', icon: 'stretch' },
  { es: 'Toma un poco de agua.', en: 'Have a little water.', icon: 'water' },
];

/** Steps for a break of `sec` seconds: about one step every 12 seconds, at least two. */
export function breakSteps(sec: number, offset = 0): typeof BREAK_STEPS {
  const n = Math.max(2, Math.min(BREAK_STEPS.length, Math.round(sec / 12)));
  return Array.from({ length: n }, (_, i) => BREAK_STEPS[(offset + i) % BREAK_STEPS.length]);
}
