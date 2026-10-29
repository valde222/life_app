import { TestBed } from '@angular/core/testing';
import { LocalStore } from '../data/local-store';
import { CollectionName, Collections, Todo } from '../data/models';
import { Repository } from '../data/repository';
import { drainOutbox, RemoteWriter, SendError } from './outbox';

class FakeRemote implements RemoteWriter {
  sent: { collection: CollectionName; record: Collections[CollectionName] }[] = [];
  failWith: SendError | null = null;

  async upsert<C extends CollectionName>(collection: C, record: Collections[C]) {
    if (this.failWith) {
      throw this.failWith;
    }
    this.sent.push({ collection, record });
    return record;
  }
}

describe('outbox', () => {
  let store: LocalStore;
  let repository: Repository;
  let remote: FakeRemote;
  const noop = async () => undefined;

  beforeEach(async () => {
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
    repository = TestBed.inject(Repository);
    remote = new FakeRemote();
  });

  it('writes to the local copy at once and queues the change', async () => {
    const todo = await repository.save('todos', { title: 'buy butter', inbox: true });

    expect(await store.records('todos').get(todo.id)).toMatchObject({
      title: 'buy butter',
      inbox: true,
    });
    expect(await store.outbox.count()).toBe(1);
  });

  it('collapses several edits of one record into one send of its latest state', async () => {
    const todo = await repository.save('todos', { title: 'first' });
    await repository.save('todos', { id: todo.id, title: 'second' });
    await repository.save('todos', { id: todo.id, title: 'third' });

    await drainOutbox(store, remote, noop);

    expect(remote.sent.map(({ record }) => (record as Todo).title)).toEqual(['third']);
    expect(await store.outbox.count()).toBe(0);
  });

  it('sends in the order changes were first made, so parents go before children', async () => {
    const group = await repository.save('groups', { name: 'Life' });
    const list = await repository.save('lists', { name: 'Garden', group: group.id });
    await repository.save('groups', { id: group.id, name: 'Life and home' });

    await drainOutbox(store, remote, noop);

    expect(remote.sent.map(({ collection }) => collection)).toEqual(['groups', 'lists']);
    expect(remote.sent[1].record.id).toBe(list.id);
  });

  it('keeps everything queued while offline', async () => {
    await repository.save('todos', { title: 'offline todo' });
    remote.failWith = new SendError('offline');

    await expect(drainOutbox(store, remote, noop)).rejects.toThrow('offline');

    expect(await store.outbox.count()).toBe(1);
  });

  it('drops a change the server rejects so the queue keeps moving', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await repository.save('todos', { title: '' });
    remote.failWith = new SendError('rejected');

    await drainOutbox(store, remote, noop);

    expect(await store.outbox.count()).toBe(0);
  });

  it('a delete is a change with deleted_at set', async () => {
    const todo = await repository.save('todos', { title: 'gone soon' });
    await repository.remove('todos', todo.id);

    await drainOutbox(store, remote, noop);

    expect((remote.sent[0].record as Todo).deleted_at).not.toBe('');
  });
});
