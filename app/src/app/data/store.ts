import { computed, inject, Injectable } from '@angular/core';
import { countsByList } from '../lists/list-counts';
import { List, Note, Todo } from './models';
import { Repository } from './repository';

@Injectable({ providedIn: 'root' })
export class Store {
  private readonly repository = inject(Repository);

  readonly groups = this.repository.watch('groups');
  readonly lists = this.repository.watch('lists');
  readonly todos = this.repository.watch('todos');
  readonly steps = this.repository.watch('steps');
  readonly completions = this.repository.watch('completions');
  readonly notes = this.repository.watch('notes');
  readonly calendarEvents = this.repository.watch('calendar_events');
  readonly settings = this.repository.watch('settings');

  readonly sortedGroups = computed(() => [...this.groups()].sort((a, b) => a.order - b.order));
  readonly openLists = computed(() =>
    this.lists()
      .filter((list) => !list.archived_at)
      .sort((a, b) => a.order - b.order),
  );
  readonly listsById = computed(() => new Map(this.lists().map((list) => [list.id, list])));

  readonly inboxTodos = computed(() => this.todos().filter(isInInbox));
  readonly inboxNotes = computed(() => this.notes().filter(isInInbox));
  readonly inboxCount = computed(() => this.inboxTodos().length + this.inboxNotes().length);

  readonly countsByList = computed(() => countsByList(this.todos(), this.notes()));
  readonly openTodoCountByList = computed(
    () => new Map([...this.countsByList()].map(([list, counts]) => [list, counts.todos])),
  );

  stepsOf(todoId: string) {
    return computed(() =>
      this.steps()
        .filter((step) => step.todo === todoId)
        .sort((a, b) => a.order - b.order),
    );
  }

  group(id: string) {
    return this.groups().find((group) => group.id === id);
  }

  listsIn(groupId: string) {
    return this.openLists().filter((list) => list.group === groupId);
  }

  list(id: string): List | undefined {
    return this.listsById().get(id);
  }
}

export function isInInbox(item: Todo | Note): boolean {
  const done = 'done_at' in item && item.done_at;
  return item.inbox && !done && !item.archived_at && !item.deleted_at;
}
