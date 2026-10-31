import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '../data/store';
import { NewGroupSheet } from '../lists/new-group-sheet';
import { NewListData, NewListSheet } from '../lists/new-list-sheet';
import { SyncService } from '../sync/sync.service';
import { Icon } from '../ui/icon';
import { ListSwatch } from '../ui/list-swatch';
import { Sheets } from '../ui/sheet';

const OPEN_KEY = 'life.sidebar.open';

@Component({
  selector: 'app-sidebar',
  imports: [Icon, ListSwatch, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly store = inject(Store);
  protected readonly sync = inject(SyncService);
  private readonly sheets = inject(Sheets);
  readonly capture = output();
  readonly shortcuts = output();

  protected readonly nav = [
    { path: '/', label: 'Today', icon: 'sun' as const },
    { path: '/agenda', label: 'Agenda', icon: 'calendar' as const },
    { path: '/inbox', label: 'Inbox', icon: 'inbox' as const },
    { path: '/search', label: 'Search', icon: 'search' as const },
  ];

  private readonly open = signal<string[]>(this.readOpen());
  protected readonly groups = computed(() =>
    this.store.sortedGroups().map((group) => ({
      group,
      open: this.open().includes(group.id),
      lists: this.store.listsIn(group.id),
    })),
  );

  protected toggle(id: string) {
    const next = this.open().includes(id)
      ? this.open().filter((each) => each !== id)
      : [...this.open(), id];
    this.open.set(next);
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(next));
    } catch {}
  }

  protected newList(group: string) {
    this.sheets.open<unknown, NewListData>(NewListSheet, { group }, { autoFocus: 'input' });
  }

  protected newGroup() {
    this.sheets.open(NewGroupSheet, undefined, { autoFocus: 'input' });
  }

  private readOpen(): string[] {
    try {
      return JSON.parse(localStorage.getItem(OPEN_KEY) ?? '[]') as string[];
    } catch {
      return [];
    }
  }
}
