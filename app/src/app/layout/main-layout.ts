import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
    <app-bottom-nav (capture)="capture()" />
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

  capture() {
    this.sheets.open(CaptureSheet, {}, { autoFocus: '.what' });
  }
}
