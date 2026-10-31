import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from './icon';
import { TickOut } from './tick-out';
import { RepeatStatus } from '../../domain/repeat-status';

@Component({
  selector: 'app-repeat-row',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.ticked]': 'tickOut.leaving()',
  },
  template: `
    <button
      type="button"
      class="done"
      [attr.aria-label]="'Mark ' + title() + ' done today'"
      (click)="press()"
    >
      @if (checkbox()) {
        <span class="box" [class.checked]="tickOut.leaving()">
          @if (tickOut.leaving()) {
            <app-icon name="check" [size]="14" [stroke]="3" animate.enter="pop" />
          }
        </span>
      } @else {
        <app-icon name="repeat" [size]="22" [stroke]="2.2" [class.over]="status().overdue" />
      }
    </button>
    <button type="button" class="body" (click)="open.emit()">
      <span class="title">{{ title() }}</span>
      @if (!checkbox()) {
        <span class="sub">{{ status().sub }}</span>
      }
    </button>
    @if (tickOut.leaving()) {
      <span class="tag" animate.enter="fade-in">Today</span>
    } @else if (status().overdue) {
      <span class="tag over"
        ><app-icon name="repeat" [size]="12" [stroke]="2.6" />{{ status().tag }}</span
      >
    } @else {
      <span class="tag">{{ status().tag }}</span>
    }
  `,
  styles: `
    :host {
      min-height: 60px;
      padding: 0 var(--space-3-5) 0 var(--space-1-5);
      border-radius: var(--radius-row);
      background: var(--surface);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    button {
      border: 0;
      background: transparent;
      padding: 0;
      color: var(--ink);
    }
    .done {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      flex-shrink: 0;
    }
    .over {
      color: var(--overdue-icon);
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
    .box.checked {
      background: var(--accent);
      border-color: var(--accent);
    }
    :host(.ticked) {
      pointer-events: none;
    }
    .pop {
      animation: pop var(--motion-fast) var(--ease-enter);
    }
    @keyframes pop {
      from {
        opacity: 0;
        transform: scale(0.6);
      }
    }
    :host(.ticked) .title {
      color: var(--ink-2);
      text-decoration: line-through;
    }
    .body {
      flex: 1;
      min-width: 0;
      min-height: 52px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: left;
    }
    .title {
      font-size: var(--text-17);
      font-weight: 500;
    }
    .sub {
      font-size: var(--text-12);
      color: var(--ink-2);
    }
    .tag {
      font-size: var(--text-13);
      font-weight: 500;
      color: var(--ink-2);
      white-space: nowrap;
    }
    .tag.over {
      height: 24px;
      padding: 0 9px;
      border-radius: var(--radius-label);
      background: var(--overdue-bg);
      color: var(--overdue-fg);
      font-size: var(--text-12);
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
    }
  `,
})
export class RepeatRow {
  readonly title = input.required<string>();
  readonly status = input.required<RepeatStatus>();
  readonly checkbox = input(false);
  readonly tick = output();
  readonly open = output();

  protected readonly tickOut = new TickOut();

  protected press() {
    if (!this.checkbox()) {
      this.tick.emit();
      return;
    }
    this.tickOut.start(() => {
      this.tick.emit();
    });
  }
}
