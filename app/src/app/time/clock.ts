import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { localDate } from './local-date';

const MINUTE = 60_000;

@Injectable({ providedIn: 'root' })
export class Clock {
  readonly now = signal(new Date());

  constructor() {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      this.now.set(new Date());
      timer = setTimeout(tick, MINUTE - (Date.now() % MINUTE));
    };
    timer = setTimeout(tick, MINUTE - (Date.now() % MINUTE));
    document.addEventListener(
      'visibilitychange',
      () => document.hidden || this.now.set(new Date()),
    );
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }

  today(): string {
    return localDate(this.now());
  }
}
