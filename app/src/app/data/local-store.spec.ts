import { TestBed } from '@angular/core/testing';
import { LocalStore } from './local-store';

describe('local copy owner', () => {
  let store: LocalStore;

  beforeEach(async () => {
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
  });

  const addTodo = () => store.table('todos').put({ id: 't1', title: 'Pay taxes' });

  it('keeps the local copy when the same account signs in again', async () => {
    await store.adopt('http://pi#u1');
    await addTodo();
    await store.adopt('http://pi#u1');
    expect(await store.table('todos').count()).toBe(1);
  });

  it('empties the local copy when another server or account signs in', async () => {
    await store.adopt('http://pi#u1');
    await addTodo();
    await store.adopt('http://localhost:8090#u2');
    expect(await store.table('todos').count()).toBe(0);
    expect((await store.meta.get('owner'))?.value).toBe('http://localhost:8090#u2');
  });

  it('empties a copy from before owners were recorded', async () => {
    await addTodo();
    await store.adopt('http://pi#u1');
    await addTodo();
    await store.meta.delete('owner');
    await store.adopt('http://pi#u1');
    expect(await store.table('todos').count()).toBe(0);
  });

  it('keeps unsent changes from before owners were recorded', async () => {
    await addTodo();
    await store.outbox.add({ key: 'todos:t1', collection: 'todos', id: 't1', changed_at: 1 });
    await store.adopt('http://pi#u1');
    expect(await store.table('todos').count()).toBe(1);
  });
});
