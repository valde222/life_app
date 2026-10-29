import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { RouterOutlet } from '@angular/router';
import { CaptureSheet } from '../capture/capture-sheet';
import { BottomNav } from '../ui/bottom-nav';
import { Sheets } from '../ui/sheet';
import { Toast } from '../ui/toast';

@Component({
  selector: 'app-main-layout',
  imports: [BottomNav, RouterOutlet, Toast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page"><router-outlet /></div>
    <app-toast />
    <app-bottom-nav [showSearch]="showSearch()" (capture)="capture()" />
  `,
  styles: `
    .page {
      max-width: 480px;
      margin: 0 auto;
    }
  `,
})
export class MainLayout {
  private readonly sheets = inject(Sheets);
  private readonly router = inject(Router);
  protected readonly showSearch = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => !/^\/(search|archive)/.test(this.router.url)),
    ),
    { initialValue: !/^\/(search|archive)/.test(this.router.url) },
  );

  capture() {
    this.sheets.open(CaptureSheet, {}, { autoFocus: '.what' });
  }
}
