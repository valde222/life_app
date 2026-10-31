import { DestroyRef, inject, signal } from '@angular/core';
import { motionMs } from './motion';

const RESTORE_AFTER_MS = 1500;

export class TickOut {
  readonly leaving = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly duration: () => number = () => motionMs('fast')) {
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  start(done: () => void) {
    if (this.leaving()) {
      return;
    }
    this.leaving.set(true);
    const duration = this.duration();
    if (!duration) {
      done();
      this.restoreLater();
      return;
    }
    this.timer = setTimeout(() => {
      done();
      this.restoreLater();
    }, duration);
  }

  private restoreLater() {
    this.timer = setTimeout(() => {
      this.leaving.set(false);
    }, RESTORE_AFTER_MS);
  }
}
