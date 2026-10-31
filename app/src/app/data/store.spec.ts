import { TestBed } from '@angular/core/testing';
import { LocalStore } from './local-store';
import { Repository } from './repository';
import { isInInbox, Store } from './store';

describe('Store', () => {
  let repository: Repository;
  let store: Store;

  beforeEach(async () => {
    const local = TestBed.inject(LocalStore);
    await local.open();
    await Promise.all(local.tables.map((table) => table.clear()));
    repository = TestBed.inject(Repository);
    store = TestBed.inject(Store);
  });

  it('sorts groups and open lists by order, leaving out closed lists', async () => {
    const work = await repository.save('groups', { name: 'Work', order: 1 });
    const life = await repository.save('groups', { name: 'Life', order: 0 });
    await repository.save('lists', { name: 'B', group: life.id, order: 2 });
    await repository.save('lists', { name: 'A', group: life.id, order: 1 });
    await repository.save('lists', { name: 'Closed', group: life.id, order: 0, archived_at: 'x' });
    const client = await repository.save('lists', { name: 'Client', group: work.id, order: 3 });

    await vi.waitFor(() => expect(store.lists()).toHaveLength(4));
    expect(store.sortedGroups().map((group) => group.name)).toEqual(['Life', 'Work']);
    expect(store.openLists().map((list) => list.name)).toEqual(['A', 'B', 'Client']);
    expect(store.listsIn(life.id).map((list) => list.name)).toEqual(['A', 'B']);
    expect(store.list(client.id)?.name).toBe('Client');
    expect(store.group(work.id)?.name).toBe('Work');
  });

  it('counts the Inbox: undone, unarchived, undeleted todos and notes marked inbox', async () => {
    await repository.save('todos', { title: 'in', inbox: true });
    await repository.save('todos', { title: 'done', inbox: true, done_at: 'x' });
    await repository.save('todos', { title: 'filed', inbox: false });
    await repository.save('notes', { body: 'in', inbox: true });
    await repository.save('notes', { body: 'archived', inbox: true, archived_at: 'x' });

    await vi.waitFor(() => expect(store.notes()).toHaveLength(2));
    await vi.waitFor(() => expect(store.todos()).toHaveLength(3));
    expect(store.inboxCount()).toBe(2);
    expect(store.inboxTodos().map((todo) => todo.title)).toEqual(['in']);
  });

  it('counts open todos per list and lists the steps of a todo in order', async () => {
    const todo = await repository.save('todos', { title: 'a', list: 'l1' });
    await repository.save('todos', { title: 'b', list: 'l1', done_at: 'x' });
    await repository.save('steps', { todo: todo.id, text: 'second', order: 1 });
    await repository.save('steps', { todo: todo.id, text: 'first', order: 0 });

    await vi.waitFor(() => expect(store.steps()).toHaveLength(2));
    await vi.waitFor(() => expect(store.todos()).toHaveLength(2));
    expect(store.openTodoCountByList().get('l1')).toBe(1);
    const steps = TestBed.runInInjectionContext(() => store.stepsOf(todo.id));
    expect(steps().map((step) => step.text)).toEqual(['first', 'second']);
  });

  it('isInInbox refuses done, archived and deleted items', () => {
    const base = { inbox: true, done_at: '', archived_at: '', deleted_at: '' };
    expect(isInInbox(base as never)).toBe(true);
    expect(isInInbox({ ...base, deleted_at: 'x' } as never)).toBe(false);
    expect(isInInbox({ ...base, inbox: false } as never)).toBe(false);
  });
});
