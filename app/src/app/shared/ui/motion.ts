import { afterNextRender, DestroyRef, inject, signal } from '@angular/core';

export type MotionSpeed = 'fast' | 'base' | 'slow';

const SETTLE_MS = 400;

export function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function motionMs(speed: MotionSpeed): number {
  if (reducedMotion()) {
    return 0;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--motion-${speed}`);
  return Number.parseFloat(value) || 0;
}

export class Settled {
  private readonly settled = signal(false);

  constructor() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    afterNextRender(() => {
      timer = setTimeout(() => {
        this.settled.set(true);
      }, SETTLE_MS);
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(timer);
    });
  }

  animate(className: string): string {
    return this.settled() ? className : '';
  }
}
