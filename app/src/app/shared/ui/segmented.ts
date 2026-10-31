import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

export interface Segment<T> {
  value: T;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="track" role="tablist" [style.--segments]="segments().length">
      <span class="highlight" [style.--index]="selectedIndex()" aria-hidden="true"></span>
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
      position: relative;
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
    button {
      position: relative;
    }
    .highlight {
      position: absolute;
      top: var(--space-1);
      bottom: var(--space-1);
      left: var(--space-1);
      width: calc((100% - 2 * var(--space-1)) / var(--segments));
      border-radius: var(--radius-chip);
      background: var(--surface);
      box-shadow: var(--shadow-segment);
      transform: translateX(calc(var(--index) * 100%));
      transition: transform var(--motion-base) var(--ease-standard);
    }
    .on {
      color: var(--ink);
    }
  `,
})
export class Segmented<T> {
  readonly segments = input.required<Segment<T>[]>();
  readonly value = model.required<T>();
  protected readonly selectedIndex = computed(() =>
    this.segments().findIndex((segment) => segment.value === this.value()),
  );
}
