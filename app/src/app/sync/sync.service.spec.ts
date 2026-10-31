import { TestBed } from '@angular/core/testing';
import { ClientResponseError } from 'pocketbase';
import { LocalStore } from '../data/local-store';
import { CollectionName, Collections, EMPTY_RECORDS, Todo } from '../data/models';
import { Repository } from '../data/repository';
import { Server } from '../server/server';
import { SyncService } from './sync.service';

type Handler = (event: { action: string; record: Collections[CollectionName] }) => void;

class FakeServer {
  remote = new Map<CollectionName, Collections[CollectionName][]>();
  sent: string[] = [];
  handlers = new Map<CollectionName, Handler>();
  unsubscribed = 0;
  signedOut = false;
  failWith: Error | null = null;
  filters: string[] = [];

  pb = {
    filter: (text: string, params: { cursor: string }) => text.replace('{:cursor}', params.cursor),
    collection: (name: CollectionName) => ({
      getList: async (page: number, perPage: number, options: { filter: string }) => {
        if (this.failWith) {
          throw this.failWith;
        }
        this.filters.push(`${name}:${options.filter}`);
        const items = (this.remote.get(name) ?? []).slice((page - 1) * perPage, page * perPage);
        return { items };
      },
      getFullList: async () =>
        (this.remote.get(name) ?? [])
          .filter((record) => record.deleted_at)
          .map(({ id }) => ({ id })),
      subscribe: async (_topic: string, handler: Handler) => {
        this.handlers.set(name, handler);
        return async () => {
          this.unsubscribed++;
        };
      },
    }),
  };

  async refreshIfStale() {}

  async upsert<C extends CollectionName>(collection: C, record: Collections[C]) {
    this.sent.push(`${collection}/${record.id}`);
    return record;
  }

  async purge() {}

  signOut() {
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

describe('SyncService', () => {
  let store: LocalStore;
  let server: FakeServer;
  let sync: SyncService;

  beforeEach(async () => {
    server = new FakeServer();
    TestBed.configureTestingModule({ providers: [{ provide: Server, useValue: server }] });
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
    sync = TestBed.inject(SyncService);
  });

  afterEach(() => sync.stop());

  it('pulls every collection, then only what changed since the last pull', async () => {
    server.remote.set('todos', [todo('t1', { updated: '2026-10-31 09:00:00.000Z' })]);

    await sync.sync();
    expect(await store.records('todos').get('t1')).toMatchObject({ title: 't1' });
    expect(server.filters).toContain('todos:');
    expect((await store.meta.get('cursor:todos'))?.value).toBe('2026-10-31 09:00:00.000Z');

    await sync.sync();
    expect(server.filters).toContain('todos:updated >= 2026-10-31 09:00:00.000Z');
    expect(sync.online()).toBe(true);
    expect(sync.lastSynced()).toBeInstanceOf(Date);
  });

  it('sends queued changes and keeps the newer local edit over an older remote one', async () => {
    const saved = await TestBed.inject(Repository).save('todos', { title: 'local' });
    server.remote.set('todos', [{ ...saved, title: 'older remote', changed_at: 0 }]);

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

    live?.({ action: 'create', record: todo('t2', { changed_at: 5 }) });
    await vi.waitFor(async () => expect(await store.records('todos').get('t2')).toBeDefined());
    live?.({ action: 'delete', record: todo('t2') });
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
    let pulls = 0;
    const getList = server.pb.collection('groups').getList;
    server.pb.collection = (name: CollectionName) => ({
      ...new FakeServer().pb.collection(name),
      getList: async (...args: Parameters<typeof getList>) => {
        if (name === 'groups') {
          pulls++;
        }
        return getList(...args);
      },
      subscribe: async () => async () => undefined,
    });

    await Promise.all([sync.sync(), sync.sync(), sync.sync()]);

    expect(pulls).toBe(2);
  });
});
