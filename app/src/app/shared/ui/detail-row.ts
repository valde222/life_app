import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-detail-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="pick.emit()">
      <span class="label">{{ label() }}</span>
      <span class="value" [class.empty]="!value()">
        <ng-content>{{ value() || empty() }}</ng-content>
      </span>
    </button>
  `,
  styles: `
    button {
      width: 100%;
      height: 52px;
      padding: 0;
      border: 0;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      font-size: var(--text-16);
    }
    .label {
      color: var(--ink-2);
      font-weight: 500;
    }
    .value {
      color: var(--ink);
      font-weight: 600;
    }
    .empty {
      color: var(--muted);
      font-weight: 500;
    }
  `,
})
export class DetailRow {
  readonly label = input.required<string>();
  readonly value = input('');
  readonly empty = input('None');
  readonly pick = output();
}
