import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface Segment<T> {
  value: T;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="track" role="tablist">
      @for (segment of segments(); track segment.value) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="segment.value === value()"
          [class.on]="segment.value === value()"
          (click)="value.set(segment.value)"
        >
          {{ segment.label }}
          @if (segment.count !== undefined) {
            {{ segment.count }}
          }
        </button>
      }
    </div>
  `,
  styles: `
    .track {
      padding: var(--space-1);
      border-radius: var(--radius-input);
      background: var(--soft);
      display: flex;
    }
    button {
      flex: 1;
      height: 40px;
      border: 0;
      border-radius: var(--radius-chip);
      background: transparent;
      font-size: var(--text-14);
      font-weight: 700;
      color: var(--ink-2);
    }
    .on {
      background: var(--surface);
      color: var(--ink);
      box-shadow: var(--shadow-segment);
    }
  `,
})
export class Segmented<T> {
  readonly segments = input.required<Segment<T>[]>();
  readonly value = model.required<T>();
}
