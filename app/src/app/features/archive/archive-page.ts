import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Actions } from '../../core/data/actions';
import { AllRecords } from '../../core/data/all-records';
import { ArchiveActions } from '../../core/data/archive-actions';
import { ListActions } from '../../core/data/list-actions';
import { Store } from '../../core/data/store';
import { Clock } from '../../core/time/clock';
import { Toasts } from '../../core/toasts/toasts';
import { closedListSub, groupByDay } from '../../domain/archive-rows';
import { List, Note, Todo } from '../../domain/models';
import { matches, search } from '../../domain/search-items';
import { dayOfTimestamp } from '../../domain/time/timestamps';
import { Icon } from '../../shared/ui/icon';
import { Segmented } from '../../shared/ui/segmented';

type Tab = 'archive' | 'done';

interface Row {
  kind: 'todos' | 'notes';
  id: string;
  title: string;
  sub: string;
  day: string;
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
  private readonly all = inject(AllRecords);
  private readonly actions = inject(Actions);
  private readonly archive = inject(ArchiveActions);
  private readonly lists = inject(ListActions);
  private readonly toasts = inject(Toasts);
  private readonly today = inject(Clock).today();

  protected readonly tabs = [
    { value: 'archive' as Tab, label: 'Archive' },
    { value: 'done' as Tab, label: 'Done' },
  ];
  protected readonly tab = signal<Tab>('archive');
  protected readonly query = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('q') ?? '');

  protected readonly archived = computed(() => {
    const archivedAt = new Map(
      [...this.store.todos(), ...this.store.notes()].map((record) => [
        record.id,
        record.archived_at,
      ]),
    );
    const hits = search(
      { todos: this.store.todos(), notes: this.store.notes() },
      { query: this.query(), filter: 'all', archived: true },
    );
    return groupByDay(
      hits.map((hit) => ({
        kind: hit.kind === 'todo' ? ('todos' as const) : ('notes' as const),
        id: hit.id,
        title: hit.title,
        sub: this.listName(hit.list),
        day: dayOfTimestamp(archivedAt.get(hit.id) ?? ''),
      })),
    );
  });

  protected readonly closedLists = computed(() =>
    this.all.lists().filter((list) => list.archived_at && !list.deleted_at),
  );

  protected readonly done = computed(() =>
    groupByDay(
      this.store
        .todos()
        .filter(
          (todo) =>
            todo.done_at &&
            !todo.archived_at &&
            (!this.query() || matches(todo.title, this.query())),
        )
        .map((todo) => ({
          kind: 'todos' as const,
          id: todo.id,
          title: todo.title,
          sub: this.listName(todo.list),
          day: dayOfTimestamp(todo.done_at),
        })),
    ),
  );

  protected readonly deletedCount = computed(() => this.all.deletedOn(this.today).length);

  protected closedSub(list: List) {
    return closedListSub(list, this.all.notes());
  }

  protected async restore(row: Row) {
    await this.archive.unarchive(row);
    this.toasts.show({ title: 'Restored' });
  }

  protected async delete(row: Row) {
    const record = this.recordOf(row);
    if (record) {
      const undo = await this.actions.delete(row.kind, record);
      this.toasts.show({ title: 'Deleted', undo });
    }
  }

  protected async restoreList(list: List) {
    await this.lists.restoreList(list.id);
    this.toasts.show({ title: `${list.name} is back` });
  }

  protected async deleteList(list: List) {
    const undo = await this.lists.deleteList(list.id);
    this.toasts.show({ title: 'Deleted', undo });
  }

  protected async notDone(row: Row) {
    const todo = this.store.todos().find((each) => each.id === row.id);
    if (todo) {
      const undo = await this.actions.untick(todo);
      this.toasts.show({ title: 'Not done', undo });
    }
  }

  private recordOf(row: Row): Todo | Note | undefined {
    const records: (Todo | Note)[] = row.kind === 'todos' ? this.store.todos() : this.store.notes();
    return records.find((record) => record.id === row.id);
  }

  private listName(id: string) {
    return this.store.list(id)?.name ?? '';
  }
}
