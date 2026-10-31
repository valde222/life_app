import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { List } from '../../domain/models';
import { Checkbox } from './checkbox';
import { ListLabel } from './list-label';

@Component({
  selector: 'app-todo-row',
  imports: [Checkbox, ListLabel, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.event]': 'event()', '[class.done]': 'done()' },
  template: `
    @if (!event()) {
      <app-checkbox
        [checked]="done()"
        [label]="done() ? 'Mark ' + title() + ' not done' : 'Mark ' + title() + ' done'"
        (pressed)="tick.emit()"
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
      padding: 0 14px 0 6px;
      border-radius: var(--radius-row);
      background: var(--surface);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    :host(.event) {
      padding-left: 16px;
      gap: 0;
    }
    :host(.done) {
      min-height: 52px;
      background: var(--quiet);
    }
    .time {
      width: 52px;
      font-size: 17px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .title {
      flex: 1;
      min-width: 0;
      padding: 8px 0;
      font-size: 17px;
      font-weight: 500;
      line-height: 1.3;
      color: var(--ink);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    :host(.done) .title {
      font-size: 16px;
      color: var(--ink-2);
      text-decoration: line-through;
    }
    .trailing {
      margin-right: 8px;
      font-size: 13px;
      color: var(--ink-2);
      flex-shrink: 0;
    }
    .done-list {
      font-size: 12px;
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
}
