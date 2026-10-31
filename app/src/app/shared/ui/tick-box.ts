import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Checkbox } from './checkbox';
import { TickOut } from './tick-out';

@Component({
  selector: 'app-tick-box',
  imports: [Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-checkbox
      [checked]="done() || tickOut.leaving()"
      [pop]="tickOut.leaving()"
      [label]="done() ? 'Mark ' + title() + ' not done' : 'Mark ' + title() + ' done'"
      (pressed)="press()"
    />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class TickBox {
  readonly title = input.required<string>();
  readonly done = input(false);
  readonly tick = output();

  protected readonly tickOut = new TickOut();

  protected press() {
    if (this.done()) {
      this.tick.emit();
      return;
    }
    this.tickOut.start(() => {
      this.tick.emit();
    });
  }
}
