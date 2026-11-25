import { RestClock, type RestPlan } from './rest';

/**
 * Counts active play time (only while the app is visible and not paused). When an eye break or the
 * end of play is due it calls `onBreak` / `onLimit`; there is no countdown shown to the child.
 */
export class PlayTimer {
  readonly clock = new RestClock();
  private minuteMs = 0;
  private last = performance.now();
  private paused = false;

  constructor(
    private readonly plan: () => RestPlan,
    private readonly onBreak: () => void,
    private readonly onLimit: () => void,
    private readonly onMinute: () => void,
    /** False while the current screen must not be interrupted (e.g. a timed round). */
    private readonly canInterrupt: () => boolean = () => true,
  ) {
    setInterval(() => this.tick(), 5000);
    document.addEventListener('visibilitychange', () => {
      this.last = performance.now();
    });
  }

  private tick(): void {
    const now = performance.now();
    const dt = Math.min(now - this.last, 10000);
    this.last = now;
    if (document.hidden || this.paused) return;
    this.minuteMs += dt;
    if (this.minuteMs >= 60000) {
      this.minuteMs -= 60000;
      this.onMinute();
    }
    const ev = this.clock.advance(dt, this.plan(), this.canInterrupt());
    if (ev === 'break') this.onBreak();
    else if (ev === 'limit') this.onLimit();
  }

  /** A break or the night screen is showing: stop counting. */
  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
    this.last = performance.now();
  }

  /** An adult chose to keep playing after the limit: start a fresh period. */
  reset(): void {
    this.clock.resetLimit();
    this.resume();
  }

  /** For "Probar" in the parents area. */
  trigger(kind: 'break' | 'limit' = 'limit'): void {
    if (kind === 'break') this.onBreak();
    else this.onLimit();
  }
}
