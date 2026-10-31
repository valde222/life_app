import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Repository } from '../core/data/repository';
import { Store } from '../core/data/store';
import { Clock } from '../core/time/clock';
import { EmptyState } from '../ui/empty-state';
import { Icon } from '../ui/icon';
import { DeletedItem, deletedItems, deletedSub } from '../domain/deleted-items';

@Component({
  selector: 'app-deleted-page',
  imports: [EmptyState, Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <a class="back" routerLink="/archive"
        ><app-icon name="chevron-left" [size]="18" [stroke]="2.2" />Archive</a
      >
    </header>
    <h1 class="t-display title">Deleted.</h1>
    <main class="content">
      @if (items().length) {
        <div class="options">
          @for (item of items(); track item.kind + item.id) {
            <div class="option row">
              <span class="text">
                <span class="name">{{ item.title }}</span>
                <span class="sub">{{ sub(item) }}</span>
              </span>
              <button type="button" class="restore" (click)="restore(item)">Restore</button>
            </div>
          }
        </div>
        <button type="button" class="card empty-now" (click)="emptyNow()">
          {{ confirming() ? 'Remove all ' + items().length + ' for good' : 'Empty now' }}
        </button>
      } @else {
        <app-empty-state class="empty" title="Nothing deleted." />
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
      margin: 0;
      padding: 0 var(--space-5);
    }
    .content {
      padding: var(--space-4) var(--space-4) 164px;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .row {
      min-height: 60px;
    }
    .text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .name {
      font-size: 16px;
    }
    .sub {
      font-size: 12px;
      color: var(--ink-2);
    }
    .restore {
      height: 36px;
      padding: 0 12px;
      border: 0;
      border-radius: var(--radius-chip);
      background: var(--bg);
      font-size: 14px;
      font-weight: 600;
    }
    .empty-now {
      min-height: 52px;
      border: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--overdue-icon);
    }
    .empty {
      margin-top: 24dvh;
    }
  `,
})
export class DeletedPage {
  private readonly store = inject(Store);
  private readonly repository = inject(Repository);
  private readonly today = inject(Clock).today();
  private readonly allTodos = this.repository.watchAll('todos');
  private readonly allNotes = this.repository.watchAll('notes');
  private readonly allLists = this.repository.watchAll('lists');
  protected readonly confirming = signal(false);
  protected readonly sub = deletedSub;

  protected readonly items = computed(() =>
    deletedItems(this.allTodos(), this.allNotes(), this.allLists(), this.today),
  );

  protected async restore(item: DeletedItem) {
    await this.repository.save(item.kind, { id: item.id, deleted_at: '' });
  }

  protected async emptyNow() {
    if (!this.confirming()) {
      this.confirming.set(true);
      return;
    }
    for (const item of this.items()) {
      await this.repository.purge(item.kind, item.id);
    }
    this.confirming.set(false);
  }
}
