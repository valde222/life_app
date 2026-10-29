import { computed, inject, Injectable } from '@angular/core';
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

  readonly openTodoCountByList = computed(() => {
    const counts = new Map<string, number>();
    for (const todo of this.todos()) {
      if (todo.list && !todo.done_at && !todo.archived_at) {
        counts.set(todo.list, (counts.get(todo.list) ?? 0) + 1);
      }
    }
    return counts;
  });

  stepsOf(todoId: string) {
    return computed(() =>
      this.steps()
        .filter((step) => step.todo === todoId)
        .sort((a, b) => a.order - b.order),
    );
  }

  list(id: string): List | undefined {
    return this.listsById().get(id);
  }
}

export function isInInbox(item: Todo | Note): boolean {
  const done = 'done_at' in item && item.done_at;
  return item.inbox && !done && !item.archived_at && !item.deleted_at;
}
