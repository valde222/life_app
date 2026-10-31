import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { DesktopShell } from '../../core/platform/desktop-shell';
import { CaptureSheet } from '../../shared/capture/capture-sheet';

@Component({
  selector: 'app-capture-page',
  imports: [CaptureSheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:focus)': 'focusField()' },
  template: `<app-capture-sheet (done)="close()" />`,
  styles: `
    :host {
      display: block;
      max-width: 480px;
      margin: 0 auto;
      padding-top: var(--space-2);
    }
  `,
})
export class CapturePage {
  private readonly shell = inject(DesktopShell);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(() => this.focusField());
  }

  protected focusField() {
    this.host.nativeElement.querySelector<HTMLInputElement>('.what')?.focus();
  }

  protected async close() {
    if (this.shell.inCaptureWindow()) {
      await this.shell.hideWindow();
      location.reload();
    } else {
      await this.router.navigateByUrl('/inbox');
    }
  }
}
