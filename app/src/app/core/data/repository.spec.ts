import { TestBed } from '@angular/core/testing';
import { LocalStore } from './local-store';
import { Repository } from './repository';

describe('Repository', () => {
  let store: LocalStore;
  let repository: Repository;

  beforeEach(async () => {
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
    repository = TestBed.inject(Repository);
  });

  it('fills a new record from the empty record and gives it an id', async () => {
    const todo = await repository.save('todos', { title: 'Pay rent' });

    expect(todo.id).toMatch(/^[a-z0-9]{15}$/);
    expect(todo).toMatchObject({ title: 'Pay rent', list: '', inbox: false, repeat_mode: 'none' });
    expect(await store.records('todos').get(todo.id)).toEqual(todo);
  });

  it('merges a change into the stored record', async () => {
    const todo = await repository.save('todos', { title: 'Pay rent', list: 'l1' });
    const changed = await repository.save('todos', { id: todo.id, date: '2026-11-01' });

    expect(changed).toMatchObject({ title: 'Pay rent', list: 'l1', date: '2026-11-01' });
  });

  it('always moves changed_at forward, even within the same millisecond', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000);
    const first = await repository.save('todos', { title: 'a' });
    const second = await repository.save('todos', { id: first.id, title: 'b' });

    expect(first.changed_at).toBe(1000);
    expect(second.changed_at).toBe(1001);
    vi.restoreAllMocks();
  });

  it('queues one outbox entry per record', async () => {
    const todo = await repository.save('todos', { title: 'a' });
    await repository.save('todos', { id: todo.id, title: 'b' });

    const entries = await store.outbox.toArray();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ key: `todos/${todo.id}`, collection: 'todos' });
  });

  it('remove marks the record deleted rather than dropping it', async () => {
    const todo = await repository.save('todos', { title: 'a' });
    const removed = await repository.remove('todos', todo.id);

    expect(removed.deleted_at).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}Z$/);
    expect(await store.records('todos').get(todo.id)).toMatchObject({ title: 'a' });
  });

  it('purge drops the record and queues a hard delete', async () => {
    const todo = await repository.save('todos', { title: 'a' });
    await repository.purge('todos', todo.id);

    expect(await store.records('todos').get(todo.id)).toBeUndefined();
    expect((await store.outbox.toArray())[0]).toMatchObject({ op: 'purge', id: todo.id });
  });

  it('watch leaves out deleted records and those the filter refuses', async () => {
    const kept = await repository.save('todos', { title: 'kept', list: 'l1' });
    await repository.save('todos', { title: 'other list', list: 'l2' });
    const gone = await repository.save('todos', { title: 'gone', list: 'l1' });
    await repository.remove('todos', gone.id);

    const watched = TestBed.runInInjectionContext(() =>
      repository.watch('todos', (todo) => todo.list === 'l1'),
    );
    const all = TestBed.runInInjectionContext(() => repository.watchAll('todos'));

    await vi.waitFor(() => expect(all()).toHaveLength(3));
    expect(watched().map((todo) => todo.id)).toEqual([kept.id]);
  });
});
