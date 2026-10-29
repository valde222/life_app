import { Injectable, signal } from '@angular/core';

export const DESKTOP_QUERY = '(min-width: 900px)';

@Injectable({ providedIn: 'root' })
export class Viewport {
  private readonly query = window.matchMedia(DESKTOP_QUERY);
  readonly desktop = signal(this.query.matches);

  constructor() {
    this.query.addEventListener('change', (event) => this.desktop.set(event.matches));
  }
}
