import { TestBed } from '@angular/core/testing';
import { ClientResponseError } from 'pocketbase';
import { LocalStore } from '../data/local-store';
import { CollectionName, Collections, EMPTY_RECORDS, Todo } from '../../domain/models';
import { Repository } from '../data/repository';
import { Server } from '../server/server';
import { Page, RemoteChange } from './remote-reader';
import { PocketBaseSync } from './pocketbase-sync';

type Handler = (change: RemoteChange<CollectionName>) => void;

class FakeServer {
  remote = new Map<CollectionName, Collections[CollectionName][]>();
  sent: string[] = [];
  handlers = new Map<CollectionName, Handler>();
  unsubscribed = 0;
  signedOut = false;
  failWith: Error | null = null;
  pulls: string[] = [];

  async changedSince(collection: CollectionName, cursor: string, page: Page) {
    if (this.failWith) {
      throw this.failWith;
    }
    this.pulls.push(`${collection}:${cursor}`);
    const start = (page.number - 1) * page.size;
    return (this.remote.get(collection) ?? []).slice(start, start + page.size);
  }

  async deletedIds(collection: CollectionName) {
    return (this.remote.get(collection) ?? [])
      .filter((record) => record.deleted_at)
      .map(({ id }) => id);
  }

  async subscribe(collection: CollectionName, handler: Handler) {
    this.handlers.set(collection, handler);
    return async () => {
      this.unsubscribed++;
    };
  }

  async refreshIfStale() {}

  async upsert<C extends CollectionName>(collection: C, record: Collections[C]) {
    this.sent.push(`${collection}/${record.id}`);
    return record;
  }

  async purge() {}

  expire() {
    this.signedOut = true;
  }
}

const todo = (id: string, fields: Partial<Todo> = {}): Todo => ({
  ...EMPTY_RECORDS.todos,
  id,
  title: id,
  changed_at: 1,
  updated: '2026-10-31 10:00:00.000Z',
  ...fields,
});

describe('PocketBaseSync', () => {
  let store: LocalStore;
  let server: FakeServer;
  let sync: PocketBaseSync;

  beforeEach(async () => {
    server = new FakeServer();
    TestBed.configureTestingModule({ providers: [{ provide: Server, useValue: server }] });
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
    sync = TestBed.inject(PocketBaseSync);
  });

  afterEach(() => sync.stop());

  it('pulls every collection, then only what changed since the last pull', async () => {
    server.remote.set('todos', [todo('t1', { updated: '2026-10-31 09:00:00.000Z' })]);

    await sync.sync();
    expect(await store.records('todos').get('t1')).toMatchObject({ title: 't1' });
    expect(server.pulls).toContain('todos:');
    expect((await store.meta.get('cursor:todos'))?.value).toBe('2026-10-31 09:00:00.000Z');

    await sync.sync();
    expect(server.pulls).toContain('todos:2026-10-31 09:00:00.000Z');
    expect(sync.online()).toBe(true);
    expect(sync.lastSynced()).toBeInstanceOf(Date);
  });

  it('sends queued changes, and an unsent local edit wins over what the pull brings', async () => {
    const saved = await TestBed.inject(Repository).save('todos', { title: 'local' });
    server.remote.set('todos', [{ ...saved, title: 'remote', changed_at: Date.now() + 1000 }]);

    await sync.sync();

    expect(server.sent).toEqual([`todos/${saved.id}`]);
    expect((await store.records('todos').get(saved.id))?.title).toBe('local');
    expect(await store.outbox.count()).toBe(0);
  });

  it('forgets locally deleted records the server no longer has', async () => {
    await store
      .records('todos')
      .bulkPut([todo('gone', { deleted_at: 'x' }), todo('kept', { deleted_at: 'x' })]);
    server.remote.set('todos', [todo('kept', { deleted_at: 'x' })]);

    await sync.sync();

    expect(await store.records('todos').get('gone')).toBeUndefined();
    expect(await store.records('todos').get('kept')).toBeDefined();
  });

  it('applies live updates and live deletes', async () => {
    await sync.sync();
    const live = server.handlers.get('todos');

    live?.({ deleted: false, record: todo('t2', { changed_at: 5 }) });
    await vi.waitFor(async () => expect(await store.records('todos').get('t2')).toBeDefined());
    live?.({ deleted: true, record: todo('t2') });
    await vi.waitFor(async () => expect(await store.records('todos').get('t2')).toBeUndefined());
  });

  it('signs out when the server refuses the token', async () => {
    server.failWith = new ClientResponseError({ status: 401 });
    await sync.sync();
    expect(server.signedOut).toBe(true);
  });

  it('goes offline and stops live updates when the server is unreachable', async () => {
    await sync.sync();
    server.failWith = new ClientResponseError({ status: 0 });

    await sync.sync();

    expect(sync.online()).toBe(false);
    expect(server.unsubscribed).toBe(8);
  });

  it('runs one sync at a time, running again once if asked meanwhile', async () => {
    await Promise.all([sync.sync(), sync.sync(), sync.sync()]);

    expect(server.pulls.filter((pull) => pull.startsWith('groups:'))).toHaveLength(2);
  });

  it('counts the changes waiting to be sent', async () => {
    const repository = TestBed.inject(Repository);
    await repository.save('todos', { title: 'a' });
    await repository.save('notes', { title: 'b' });

    await vi.waitFor(() => expect(sync.waiting()).toBe(2));
  });
});
