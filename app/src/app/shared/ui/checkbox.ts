import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from './icon';

@Component({
  selector: 'app-checkbox',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      [attr.aria-label]="label()"
      [attr.aria-pressed]="checked()"
      (click)="pressed.emit()"
    >
      <span class="box" [class.checked]="checked()" [class.filling]="pop()">
        @if (checked()) {
          <app-icon name="check" [size]="14" [stroke]="3" [animate.enter]="pop() ? 'pop' : ''" />
        }
      </span>
    </button>
  `,
  styles: `
    button {
      width: 44px;
      height: 44px;
      border: 0;
      padding: 0;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .box {
      width: 22px;
      height: 22px;
      border-radius: var(--radius-check);
      border: 2px solid var(--control);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--on-accent);
    }
    .checked {
      background: var(--accent);
      border-color: var(--accent);
    }
    .filling {
      animation: fill var(--motion-fast) var(--ease-enter);
    }
    .pop {
      animation: pop var(--motion-fast) var(--ease-enter);
    }
    @keyframes fill {
      from {
        transform: scale(0.85);
      }
    }
    @keyframes pop {
      from {
        opacity: 0;
        transform: scale(0.6);
      }
    }
  `,
})
export class Checkbox {
  readonly checked = input(false);
  readonly pop = input(false);
  readonly label = input.required<string>();
  readonly pressed = output();
}
