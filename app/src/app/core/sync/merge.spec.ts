import { TestBed } from '@angular/core/testing';
import { LocalStore } from '../data/local-store';
import { enqueue } from './outbox';
import { EMPTY_RECORDS, Todo } from '../../domain/models';
import { applyRemote } from './merge';

const ID = 'todo00000000001';

const todo = (fields: Partial<Todo>): Todo => ({
  ...EMPTY_RECORDS.todos,
  id: ID,
  ...fields,
});

describe('merge', () => {
  let store: LocalStore;

  const stored = () => store.records('todos').get(ID);

  const unsent = async (record: Todo) => {
    await store.records('todos').put(record);
    await enqueue(store, { collection: 'todos', id: record.id, changedAt: record.changed_at });
  };

  beforeEach(async () => {
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
  });

  it('the server record replaces a local copy with nothing unsent, even one changed later on its device', async () => {
    await store.records('todos').put(todo({ title: 'local, later clock', changed_at: 200 }));

    await applyRemote(store, 'todos', [todo({ title: 'remote', changed_at: 100 })]);

    expect((await stored())?.title).toBe('remote');
  });

  it('an unsent local change stays, whatever its clock says, because it reaches the server last', async () => {
    await unsent(todo({ title: 'local, unsent', changed_at: 100 }));

    await applyRemote(store, 'todos', [todo({ title: 'remote', changed_at: 200 })]);

    expect((await stored())?.title).toBe('local, unsent');
  });

  it('its own version coming back from the server replaces the local copy and brings the server times', async () => {
    await unsent(todo({ title: 'local', changed_at: 100 }));

    await applyRemote(store, 'todos', [
      todo({ title: 'local', changed_at: 100, updated: '2026-11-10 09:00:00.000Z' }),
    ]);

    expect(await stored()).toMatchObject({ updated: '2026-11-10 09:00:00.000Z' });
  });

  it('a record new to this device is added, without server-only fields', async () => {
    await applyRemote(store, 'todos', [
      { ...todo({ title: 'remote', changed_at: 200 }), collectionName: 'todos' } as Todo,
    ]);

    expect((await stored())?.title).toBe('remote');
    expect(await stored()).not.toHaveProperty('collectionName');
  });

  it('always takes the server photo and file lists, even while the local note has an unsent change', async () => {
    const note = { ...EMPTY_RECORDS.notes, id: 'note00000000001' };
    await store
      .records('notes')
      .put({ ...note, title: 'local', changed_at: 100, photos: [], files: [] });
    await enqueue(store, { collection: 'notes', id: note.id, changedAt: 100 });

    await applyRemote(store, 'notes', [
      {
        ...note,
        title: 'remote',
        changed_at: 200,
        photos: ['a.jpg'],
        files: ['b.pdf'],
        file_names: { 'b.pdf': 'Bólig.pdf' },
      },
    ]);

    expect(await store.records('notes').get(note.id)).toMatchObject({
      title: 'local',
      photos: ['a.jpg'],
      files: ['b.pdf'],
      file_names: { 'b.pdf': 'Bólig.pdf' },
    });
  });
});
