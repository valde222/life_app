import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { List } from '../../domain/models';
import { Checkbox } from './checkbox';
import { ListLabel } from './list-label';
import { TickOut } from './tick-out';

@Component({
  selector: 'app-todo-row',
  imports: [Checkbox, ListLabel, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.event]': 'event()',
    '[class.done]': 'done()',
    '[class.ticked]': 'tickOut.leaving()',
  },
  template: `
    @if (!event()) {
      <app-checkbox
        [checked]="done() || tickOut.leaving()"
        [pop]="tickOut.leaving()"
        [label]="done() ? 'Mark ' + title() + ' not done' : 'Mark ' + title() + ' done'"
        (pressed)="press()"
      />
    }
    @if (time()) {
      <span class="time tabular">{{ time() }}</span>
    }
    <a class="title" [routerLink]="link()">{{ title() }}</a>
    @if (trailing()) {
      <span class="trailing">{{ trailing() }}</span>
    }
    @if (event()) {
      <app-list-label [event]="true" />
    } @else if (list()) {
      @if (done()) {
        <span class="done-list">{{ list()!.name }}</span>
      } @else {
        <app-list-label [list]="list()" />
      }
    }
  `,
  styles: `
    :host {
      min-height: 56px;
      padding: 0 var(--space-3-5) 0 var(--space-1-5);
      border-radius: var(--radius-row);
      background: var(--surface);
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }
    :host(.event) {
      padding-left: var(--space-4);
      gap: 0;
    }
    :host(.done) {
      min-height: 52px;
      background: var(--quiet);
    }
    .time {
      width: 52px;
      font-size: var(--text-17);
      font-weight: 700;
      flex-shrink: 0;
    }
    .title {
      flex: 1;
      min-width: 0;
      padding: var(--space-2) 0;
      font-size: var(--text-17);
      font-weight: 500;
      line-height: 1.3;
      color: var(--ink);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    :host(.ticked) {
      pointer-events: none;
    }
    :host(.done) .title {
      font-size: var(--text-16);
      color: var(--ink-2);
      text-decoration: line-through;
    }
    :host(.ticked) .title {
      color: var(--ink-2);
      text-decoration: line-through;
    }
    .trailing {
      margin-right: var(--space-2);
      font-size: var(--text-13);
      color: var(--ink-2);
      flex-shrink: 0;
    }
    .done-list {
      font-size: var(--text-12);
      font-weight: 600;
      color: var(--ink-2);
    }
  `,
})
export class TodoRow {
  readonly title = input.required<string>();
  readonly link = input.required<string | string[]>();
  readonly time = input('');
  readonly trailing = input('');
  readonly list = input<List | undefined>();
  readonly event = input(false);
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
