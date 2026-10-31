import { Injectable, signal } from '@angular/core';

export interface ToastAction {
  label: string;
  run: () => unknown;
}

export interface ToastMessage {
  title: string;
  action?: ToastAction;
  undo?: () => unknown;
}

const VISIBLE_MS = 5000;

@Injectable({ providedIn: 'root' })
export class Toasts {
  readonly current = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(message: ToastMessage) {
    clearTimeout(this.timer);
    this.current.set(message);
    this.timer = setTimeout(() => this.dismiss(), VISIBLE_MS);
  }

  dismiss() {
    clearTimeout(this.timer);
    this.current.set(null);
  }

  async run(step: () => unknown) {
    this.dismiss();
    await step();
  }
}
