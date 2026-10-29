import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Actions } from '../data/actions';
import { Todo } from '../data/models';
import { Store } from '../data/store';
import { Clock } from '../time/clock';
import { addDays } from '../time/local-date';
import { EmptyState } from '../ui/empty-state';
import { Icon } from '../ui/icon';
import { Sheets } from '../ui/sheet';
import { Toasts } from '../ui/toast';
import { isRepeating, repeatStatus } from './repeat-status';
import { RepeatRow } from './repeat-row';
import { RepeatSheet, RepeatSheetResult } from './repeat-sheet';

@Component({
  selector: 'app-repeating-page',
  imports: [EmptyState, Icon, RepeatRow, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <a class="back" routerLink="/"
        ><app-icon name="chevron-left" [size]="18" [stroke]="2.2" />Today</a
      >
    </header>
    <div class="title">
      <h1 class="t-display">Repeating.</h1>
      <a class="new" routerLink="/repeat/new" [state]="{ back: '/repeating' }">+ New</a>
    </div>
    <main class="content stack">
      @for (item of items(); track item.todo.id) {
        <app-repeat-row
          [title]="item.todo.title"
          [status]="item.status"
          (tick)="done(item.todo)"
          (open)="open(item.todo)"
        />
      } @empty {
        <app-empty-state class="empty" title="Nothing repeats yet." />
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
    }
    .bar {
      padding: calc(44px + env(safe-area-inset-top)) 8px 0 4px;
    }
    .title {
      padding: 0 var(--space-4) 0 var(--space-5);
      display: flex;
      align-items: center;
      justify-content: space-between;
      h1 {
        margin: 0;
      }
    }
    .new {
      height: 38px;
      padding: 0 12px;
      border-radius: var(--radius-control);
      background: var(--surface);
      color: var(--ink);
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
    }
    .content {
      padding: var(--space-4) var(--space-4) 164px;
    }
    .empty {
      margin-top: 30dvh;
    }
  `,
})
export class RepeatingPage {
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly sheets = inject(Sheets);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly clock = inject(Clock);

  protected readonly items = computed(() =>
    this.store
      .todos()
      .filter((todo) => isRepeating(todo) && !todo.archived_at)
      .map((todo) => ({
        todo,
        status: repeatStatus(todo, this.store.completions(), this.clock.today()),
      }))
      .sort(
        (a, b) =>
          Number(b.status.overdue) - Number(a.status.overdue) ||
          b.status.daysSince / (b.status.target || 1000) -
            a.status.daysSince / (a.status.target || 1000),
      ),
  );

  protected async done(todo: Todo, day = this.clock.today()) {
    const undo = await this.actions.complete(todo, day);
    this.toasts.show({
      title: `${todo.title} done ${day === this.clock.today() ? 'today' : 'yesterday'}`,
      undo,
    });
  }

  protected async open(todo: Todo) {
    const result = await this.sheets.open<RepeatSheetResult, string>(RepeatSheet, todo.id).closed;
    if (result === 'today') {
      await this.done(todo);
    } else if (result === 'yesterday') {
      await this.done(todo, addDays(this.clock.today(), -1));
    } else if (result === 'edit') {
      await this.router.navigate(['/repeat', todo.id], { state: { back: '/repeating' } });
    }
  }
}
