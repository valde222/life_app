import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h1 class="t-display">{{ title }}</h1>`,
  styles: `
    h1 {
      margin: 0;
      padding: calc(52px + env(safe-area-inset-top)) var(--space-5) 0;
    }
  `,
})
export class Placeholder {
  protected readonly title = inject(ActivatedRoute).snapshot.data['title'] as string;
}
