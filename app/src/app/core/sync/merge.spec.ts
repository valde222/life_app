import { TestBed } from '@angular/core/testing';
import { LocalStore } from '../data/local-store';
import { EMPTY_RECORDS, Todo } from '../../domain/models';
import { applyRemote, isAtLeastAsNew } from './merge';

const todo = (fields: Partial<Todo>): Todo => ({
  ...EMPTY_RECORDS.todos,
  id: 'todo00000000001',
  ...fields,
});

describe('merge', () => {
  it('always takes the server photo and file lists, even when the local note is newer', async () => {
    const store = TestBed.inject(LocalStore);
    await store.open();
    const note = { ...EMPTY_RECORDS.notes, id: 'note00000000001' };
    await store
      .records('notes')
      .put({ ...note, title: 'local', changed_at: 200, photos: [], files: [] });

    await applyRemote(store, 'notes', [
      { ...note, title: 'remote', changed_at: 100, photos: ['a.jpg'], files: ['b.pdf'] },
    ]);

    expect(await store.records('notes').get(note.id)).toMatchObject({
      title: 'local',
      photos: ['a.jpg'],
      files: ['b.pdf'],
    });
  });

  let store: LocalStore;

  beforeEach(async () => {
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
  });

  it('the change with the later changed_at wins', () => {
    expect(isAtLeastAsNew({ changed_at: 2 }, { changed_at: 1 })).toBe(true);
    expect(isAtLeastAsNew({ changed_at: 1 }, { changed_at: 2 })).toBe(false);
    expect(isAtLeastAsNew({ changed_at: 1 }, undefined)).toBe(true);
  });

  it('an older remote record leaves a newer local one alone', async () => {
    await store.records('todos').put(todo({ title: 'local, newer', changed_at: 200 }));

    await applyRemote(store, 'todos', [todo({ title: 'remote, older', changed_at: 100 })]);

    expect((await store.records('todos').get('todo00000000001'))?.title).toBe('local, newer');
  });

  it('a newer remote record replaces the local one, without server-only fields', async () => {
    await store.records('todos').put(todo({ title: 'local', changed_at: 100 }));

    await applyRemote(store, 'todos', [
      { ...todo({ title: 'remote', changed_at: 200 }), collectionName: 'todos' } as Todo,
    ]);

    const stored = await store.records('todos').get('todo00000000001');
    expect(stored?.title).toBe('remote');
    expect(stored).not.toHaveProperty('collectionName');
  });
});
