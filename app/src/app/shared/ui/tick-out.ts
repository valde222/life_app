import { DestroyRef, inject, signal } from '@angular/core';

export const TICK_OUT_MS = 600;
const RESTORE_AFTER_MS = 1500;

const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export class TickOut {
  readonly leaving = signal(false);
  readonly duration = `${TICK_OUT_MS}ms`;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly reducedMotion: () => boolean = prefersReducedMotion) {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  start(done: () => void) {
    if (this.leaving()) {
      return;
    }
    if (this.reducedMotion()) {
      done();
      return;
    }
    this.leaving.set(true);
    this.timer = setTimeout(() => {
      done();
      this.timer = setTimeout(() => {
        this.leaving.set(false);
      }, RESTORE_AFTER_MS);
    }, TICK_OUT_MS);
  }
}
