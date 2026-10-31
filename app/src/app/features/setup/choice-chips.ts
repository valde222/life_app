import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../../shared/ui/icon';
import { Choice } from './setup-state';

@Component({
  selector: 'app-choice-chips',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (choice of choices(); track choice.name) {
      <button
        type="button"
        class="choice"
        [class.on]="choice.picked"
        [attr.aria-pressed]="choice.picked"
        (click)="choose.emit(choice.name)"
      >
        @if (choice.picked) {
          <app-icon name="check" [size]="14" [stroke]="2.6" />
        } @else {
          +
        }
        {{ choice.name }}
      </button>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }
    .choice {
      height: var(--chip-height, 44px);
      padding: 0 var(--space-4);
      border: 0;
      border-radius: var(--radius-input);
      background: var(--chip-off, var(--surface));
      color: var(--ink);
      font-size: var(--chip-font, var(--text-17));
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1-5);
    }
    .on {
      background: var(--accent);
      color: var(--on-accent);
    }
  `,
})
export class ChoiceChips {
  readonly choices = input.required<Choice[]>();
  readonly choose = output<string>();
}
