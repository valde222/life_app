import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DesktopShell } from '../core/platform/desktop-shell';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class App {
  constructor() {
    const shell = inject(DesktopShell);
    if (shell.inCaptureWindow()) {
      void inject(Router).navigateByUrl('/capture');
    }
  }
}
