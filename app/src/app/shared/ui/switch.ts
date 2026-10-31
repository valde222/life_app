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
      padding: var(--space-half);
      border: 0;
      border-radius: var(--radius-input);
      background: var(--control);
      display: flex;
      transition: background var(--motion-fast) var(--ease-standard);
    }
    .knob {
      width: 24px;
      height: 24px;
      border-radius: var(--radius-control);
      background: var(--surface);
      box-shadow: var(--shadow-knob);
      transition: transform var(--motion-fast) var(--ease-standard);
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
