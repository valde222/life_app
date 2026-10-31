import { afterNextRender, AnimationCallbackEvent, DestroyRef, inject, signal } from '@angular/core';

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
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => {
      this.settleSoon();
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.timer);
    });
  }

  leave(event: AnimationCallbackEvent, className: string) {
    if (!this.settled()) {
      event.animationComplete();
      return;
    }
    event.target.classList.add(className);
    event.target.addEventListener('animationend', event.animationComplete, { once: true });
  }

  pause() {
    this.settled.set(false);
    this.settleSoon();
  }

  private settleSoon() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.settled.set(true);
    }, SETTLE_MS);
  }

  animate(className: string): string {
    return this.settled() ? className : '';
  }
}
