import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button
    type="button"
    role="switch"
    [attr.aria-checked]="on()"
    [attr.aria-label]="label()"
    (click)="on.set(!on())"
  >
    <span class="knob"></span>
  </button>`,
  styles: `
    button {
      width: 48px;
      height: 28px;
      padding: 2px;
      border: 0;
      border-radius: 14px;
      background: var(--control);
      display: flex;
      transition: background 150ms;
    }
    .knob {
      width: 24px;
      height: 24px;
      border-radius: 12px;
      background: var(--surface);
      box-shadow: 0 1px 2px rgba(21, 23, 30, 0.2);
      transition: transform 150ms;
    }
    button[aria-checked='true'] {
      background: var(--accent);
      .knob {
        transform: translateX(20px);
      }
    }
  `,
})
export class Switch {
  readonly on = model(false);
  readonly label = input.required<string>();
}
