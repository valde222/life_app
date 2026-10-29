import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DesktopShell } from './desktop/desktop-shell';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet />',
})
export class App {
  constructor() {
    const shell = inject(DesktopShell);
    if (shell.inCaptureWindow()) {
      inject(Router).navigateByUrl('/capture');
    }
  }
}
