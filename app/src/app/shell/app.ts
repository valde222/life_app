import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { BackButton } from '../core/platform/back-button';
import { DesktopShell } from '../core/platform/desktop-shell';
import { Session } from '../core/session/session';

const SIGN_IN = '/sign-in';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<router-outlet />',
})
export class App {
  private readonly router = inject(Router);
  private readonly session = inject(Session);

  constructor() {
    inject(BackButton).start();
    if (inject(DesktopShell).inCaptureWindow()) {
      void this.router.navigateByUrl('/capture');
    }
    effect(() => {
      if (this.session.expired() && !this.router.url.startsWith(SIGN_IN)) {
        void this.router.navigateByUrl(SIGN_IN);
      }
    });
  }
}
