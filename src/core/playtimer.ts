/**
 * Counts active play time (only while the app is visible). When the parent's limit is reached it
 * calls `onLimit` once; there is no countdown shown to the child.
 */
export class PlayTimer {
  private activeMs = 0;
  private minuteMs = 0;
  private last = performance.now();
  private fired = false;

  constructor(
    private readonly limitMin: () => number,
    private readonly onLimit: () => void,
    private readonly onMinute: () => void,
  ) {
    setInterval(() => this.tick(), 5000);
    document.addEventListener('visibilitychange', () => {
      this.last = performance.now();
    });
  }

  private tick(): void {
    const now = performance.now();
    if (document.hidden) {
      this.last = now;
      return;
    }
    const dt = Math.min(now - this.last, 10000);
    this.last = now;
    this.activeMs += dt;
    this.minuteMs += dt;
    if (this.minuteMs >= 60000) {
      this.minuteMs -= 60000;
      this.onMinute();
    }
    const lim = this.limitMin();
    if (!this.fired && lim > 0 && this.activeMs >= lim * 60000) {
      this.fired = true;
      this.onLimit();
    }
  }

  /** An adult chose to keep playing: start a fresh period. */
  reset(): void {
    this.activeMs = 0;
    this.fired = false;
  }

  /** For "Probar" in the parents area. */
  trigger(): void {
    this.fired = true;
    this.onLimit();
  }
}
