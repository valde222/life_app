import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Store } from '../data/store';
import { Icon } from '../ui/icon';
import { listColourStyle } from '../ui/list-colours';
import { Sheet } from '../ui/sheet';

export interface MoveToData {
  current: string;
  allowInbox?: boolean;
}

const RECENT = 'Recent';
const INBOX = 'Inbox';

@Component({
  selector: 'app-move-to',
  imports: [Icon, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet heading="Move to.">
      <div class="tabs" role="tablist" aria-label="Groups">
        @for (tab of tabs(); track tab) {
          <button
            type="button"
            role="tab"
            class="tab"
            [class.on]="tab === selected()"
            [attr.aria-selected]="tab === selected()"
            (click)="selected.set(tab)"
          >
            {{ tab }}
          </button>
        }
      </div>
      <div class="options">
        @for (list of shown(); track list.id) {
          <button type="button" class="option" (click)="ref.close(list.id)">
            <span class="swatch" [style]="swatch(list.colour)"></span>
            <span class="name">{{ list.name }}</span>
            <span class="count">{{ counts().get(list.id) || '' }}</span>
            @if (list.id === data.current) {
              <app-icon name="check-picked" [size]="18" [stroke]="2.4" />
            }
          </button>
        } @empty {
          @if (selected() === inbox) {
            <button type="button" class="option" (click)="ref.close('')">
              <span class="swatch inbox"></span>
              <span class="name">Inbox</span>
              @if (!data.current) {
                <app-icon name="check-picked" [size]="18" [stroke]="2.4" />
              }
            </button>
          }
        }
      </div>
      <button type="button" class="btn btn-secondary cancel" (click)="ref.close()">Cancel</button>
    </app-sheet>
  `,
  styles: `
    .tabs {
      margin: 0 calc(-1 * var(--space-4));
      padding: 0 var(--space-4);
      display: flex;
      gap: 6px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .tab {
      flex-shrink: 0;
      height: 38px;
      padding: 0 16px;
      border: 0;
      border-radius: var(--radius-control);
      background: var(--surface);
      color: var(--accent);
      font-size: 15px;
      font-weight: 600;
    }
    .tab.on {
      background: var(--accent);
      color: var(--on-accent);
    }
    .swatch {
      width: 12px;
      height: 26px;
      border-radius: var(--radius-tiny);
      background: var(--pair-bg);
      box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--pair-fg) 20%, transparent);
      flex-shrink: 0;
    }
    .swatch.inbox {
      --pair-bg: var(--soft);
      --pair-fg: var(--accent);
    }
    .name {
      flex: 1;
      font-size: 16px;
    }
    .count {
      font-size: 13px;
      color: var(--muted);
    }
    .cancel {
      height: 48px;
      border-radius: var(--radius-input);
      font-size: 15px;
    }
  `,
})
export class MoveTo {
  protected readonly ref = inject(DialogRef<string>);
  protected readonly data = inject<MoveToData>(DIALOG_DATA);
  private readonly store = inject(Store);
  protected readonly inbox = INBOX;
  protected readonly counts = this.store.openTodoCountByList;

  private readonly recent = computed(() => {
    const latest = new Map<string, number>();
    for (const item of [...this.store.todos(), ...this.store.notes()]) {
      if (item.list && item.changed_at > (latest.get(item.list) ?? 0)) {
        latest.set(item.list, item.changed_at);
      }
    }
    return this.store
      .openLists()
      .filter((list) => latest.has(list.id))
      .sort((a, b) => latest.get(b.id)! - latest.get(a.id)!)
      .slice(0, 3);
  });

  protected readonly tabs = computed(() => [
    ...(this.recent().length ? [RECENT] : []),
    ...this.store.sortedGroups().map((group) => group.name),
    ...(this.data.allowInbox === false ? [] : [INBOX]),
  ]);
  protected readonly selected = signal(this.tabs()[0] ?? INBOX);

  protected readonly shown = computed(() => {
    const tab = this.selected();
    if (tab === RECENT) {
      return this.recent();
    }
    const group = this.store.sortedGroups().find((candidate) => candidate.name === tab);
    return group ? this.store.openLists().filter((list) => list.group === group.id) : [];
  });

  protected swatch = listColourStyle;
}
