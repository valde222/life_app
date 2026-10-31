import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from './icon';
import { RepeatStatus } from '../../domain/repeat-status';

@Component({
  selector: 'app-repeat-row',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="done"
      [attr.aria-label]="'Mark ' + title() + ' done today'"
      (click)="tick.emit()"
    >
      @if (checkbox()) {
        <span class="box"></span>
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
    @if (status().overdue) {
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
      padding: 0 14px 0 6px;
      border-radius: var(--radius-row);
      background: var(--surface);
      display: flex;
      align-items: center;
      gap: 4px;
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
      font-size: 17px;
      font-weight: 500;
    }
    .sub {
      font-size: 12px;
      color: var(--ink-2);
    }
    .tag {
      font-size: 13px;
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
      font-size: 12px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  `,
})
export class RepeatRow {
  readonly title = input.required<string>();
  readonly status = input.required<RepeatStatus>();
  readonly checkbox = input(false);
  readonly tick = output();
  readonly open = output();
}
