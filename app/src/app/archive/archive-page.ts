import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Actions } from '../data/actions';
import { List } from '../data/models';
import { Repository } from '../data/repository';
import { Store } from '../data/store';
import { search } from '../search/search-items';
import { Clock } from '../time/clock';
import { localDate, longDate, shortDate } from '../time/local-date';
import { Icon } from '../ui/icon';
import { Segmented } from '../ui/segmented';
import { Toasts } from '../ui/toast';
import { deletedItems } from './deleted-items';

type Tab = 'archive' | 'done';

interface Row {
  kind: 'todos' | 'notes';
  id: string;
  title: string;
  sub: string;
  day: string;
}

const dayOf = (timestamp: string) => localDate(new Date(timestamp.replace(' ', 'T')));

function byDay(rows: Row[]) {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    groups.set(row.day, [...(groups.get(row.day) ?? []), row]);
  }
  return [...groups]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, items]) => ({ day, label: longDate(day), items }));
}

@Component({
  selector: 'app-archive-page',
  imports: [FormsModule, Icon, RouterLink, Segmented],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './archive-page.html',
  styleUrl: './archive-page.scss',
})
export class ArchivePage {
  private readonly store = inject(Store);
  private readonly repository = inject(Repository);
  private readonly actions = inject(Actions);
  private readonly toasts = inject(Toasts);
  private readonly today = inject(Clock).today();
  private readonly allTodos = this.repository.watchAll('todos');
  private readonly allNotes = this.repository.watchAll('notes');
  private readonly allLists = this.repository.watchAll('lists');

  protected readonly tabs = [
    { value: 'archive' as Tab, label: 'Archive' },
    { value: 'done' as Tab, label: 'Done' },
  ];
  protected readonly tab = signal<Tab>('archive');
  protected readonly query = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q') ?? '');

  protected readonly archived = computed(() =>
    byDay(
      search(this.store.todos(), this.store.notes(), this.query(), 'all', true).map((hit) => {
        const record =
          hit.kind === 'todo'
            ? this.store.todos().find((todo) => todo.id === hit.id)!
            : this.store.notes().find((note) => note.id === hit.id)!;
        return {
          kind: hit.kind === 'todo' ? ('todos' as const) : ('notes' as const),
          id: hit.id,
          title: hit.title,
          sub: this.store.list(hit.list)?.name ?? '',
          day: dayOf(record.archived_at),
        };
      }),
    ),
  );

  protected readonly closedLists = computed(() =>
    this.allLists().filter((list) => list.archived_at && !list.deleted_at),
  );

  protected readonly done = computed(() =>
    byDay(
      this.store
        .todos()
        .filter(
          (todo) =>
            todo.done_at &&
            !todo.archived_at &&
            (!this.query() || todo.title.toLowerCase().includes(this.query().toLowerCase())),
        )
        .map((todo) => ({
          kind: 'todos' as const,
          id: todo.id,
          title: todo.title,
          sub: this.store.list(todo.list)?.name ?? '',
          day: dayOf(todo.done_at),
        })),
    ),
  );

  protected readonly deletedCount = computed(
    () => deletedItems(this.allTodos(), this.allNotes(), this.allLists(), this.today).length,
  );

  protected closedSub(list: List) {
    const notes = this.allNotes().filter(
      (note) => note.list === list.id && !note.deleted_at,
    ).length;
    return `Closed ${shortDate(dayOf(list.archived_at))}${notes ? `, ${notes} note${notes === 1 ? '' : 's'}` : ''}`;
  }

  protected async restore(row: Row) {
    await this.repository.save(row.kind, { id: row.id, archived_at: '' });
    this.toasts.show({ title: 'Restored' });
  }

  protected async delete(row: Row) {
    const record =
      row.kind === 'todos'
        ? this.store.todos().find((todo) => todo.id === row.id)!
        : this.store.notes().find((note) => note.id === row.id)!;
    const undo = await this.actions.delete(row.kind, record);
    this.toasts.show({ title: 'Deleted', undo });
  }

  protected async restoreList(list: List) {
    await this.repository.save('lists', { id: list.id, archived_at: '' });
    this.toasts.show({ title: `${list.name} is back` });
  }

  protected async deleteList(list: List) {
    await this.repository.remove('lists', list.id);
    this.toasts.show({
      title: 'Deleted',
      undo: () => this.repository.save('lists', { id: list.id, deleted_at: '' }),
    });
  }

  protected async notDone(row: Row) {
    const todo = this.store.todos().find((each) => each.id === row.id)!;
    const undo = await this.actions.untick(todo);
    this.toasts.show({ title: 'Not done', undo });
  }
}
