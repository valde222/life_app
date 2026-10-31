import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Group, List } from '../data/models';
import { Store } from '../data/store';
import { Icon } from '../ui/icon';
import { ListSwatch } from '../ui/list-swatch';
import { Sheets } from '../ui/sheet';
import { groupSummary, listSummary } from './list-counts';
import { NewGroupSheet } from './new-group-sheet';
import { NewListData, NewListSheet } from './new-list-sheet';

const OPEN_GROUPS_KEY = 'life.lists.open';

function readOpen(): string[] | null {
  try {
    return JSON.parse(localStorage.getItem(OPEN_GROUPS_KEY) ?? 'null') as string[] | null;
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-lists-page',
  imports: [Icon, ListSwatch, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lists-page.html',
  styleUrl: './lists-page.scss',
})
export class ListsPage {
  private readonly store = inject(Store);
  private readonly sheets = inject(Sheets);
  private readonly router = inject(Router);

  private readonly savedOpen = signal<string[] | null>(readOpen());
  protected readonly groups = computed(() =>
    this.store.sortedGroups().map((group, index) => {
      const open = this.savedOpen()?.includes(group.id) ?? index === 0;
      return {
        group,
        open,
        summary: open ? '' : groupSummary(group, this.store.openLists(), this.store.countsByList()),
        lists: this.store.listsIn(group.id),
      };
    }),
  );

  protected counts(list: List) {
    return listSummary(this.store.countsByList().get(list.id));
  }

  protected toggle(group: Group) {
    const open = new Set(
      this.groups()
        .filter((entry) => entry.open)
        .map((entry) => entry.group.id),
    );
    if (open.has(group.id)) {
      open.delete(group.id);
    } else {
      open.add(group.id);
    }
    this.savedOpen.set([...open]);
    try {
      localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify([...open]));
    } catch {}
  }

  protected async newList(group: Group) {
    const list = await this.sheets.open<List, NewListData>(
      NewListSheet,
      { group: group.id },
      { autoFocus: 'input' },
    ).closed;
    if (list) {
      await this.router.navigate(['/lists', list.id]);
    }
  }

  protected newGroup() {
    this.sheets.open(NewGroupSheet, undefined, { autoFocus: 'input' });
  }
}
