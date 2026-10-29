import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content select="[icon]" />
    <p class="t-empty-title">{{ title() }}</p>
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      text-align: center;
    }
    p {
      margin: 0;
    }
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
}
