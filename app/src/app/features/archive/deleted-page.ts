import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AllRecords } from '../../core/data/all-records';
import { ArchiveActions } from '../../core/data/archive-actions';
import { Clock } from '../../core/time/clock';
import { EmptyState } from '../../shared/ui/empty-state';
import { Icon } from '../../shared/ui/icon';
import { DeletedItem, deletedSub } from '../../domain/deleted-items';

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
      padding: calc(44px + env(safe-area-inset-top)) var(--space-2) 0 var(--space-1);
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
      font-size: var(--text-16);
    }
    .sub {
      font-size: var(--text-12);
      color: var(--ink-2);
    }
    .restore {
      height: 36px;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-chip);
      background: var(--bg);
      font-size: var(--text-14);
      font-weight: 600;
    }
    .empty-now {
      min-height: 52px;
      border: 0;
      font-size: var(--text-16);
      font-weight: 600;
      color: var(--overdue-icon);
    }
    .empty {
      margin-top: 24dvh;
    }
  `,
})
export class DeletedPage {
  private readonly all = inject(AllRecords);
  private readonly archive = inject(ArchiveActions);
  private readonly today = inject(Clock).today();
  protected readonly confirming = signal(false);
  protected readonly sub = deletedSub;

  protected readonly items = computed(() => this.all.deletedOn(this.today));

  protected async restore(item: DeletedItem) {
    await this.archive.undelete(item);
  }

  protected async emptyNow() {
    if (!this.confirming()) {
      this.confirming.set(true);
      return;
    }
    await this.archive.purgeAll(this.items());
    this.confirming.set(false);
  }
}
