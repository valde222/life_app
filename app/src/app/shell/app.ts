import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DesktopShell } from '../core/platform/desktop-shell';
import { BackButton } from '../core/platform/back-button';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class App {
  constructor() {
    inject(BackButton).start();
    const shell = inject(DesktopShell);
    if (shell.inCaptureWindow()) {
      void inject(Router).navigateByUrl('/capture');
    }
  }
}
