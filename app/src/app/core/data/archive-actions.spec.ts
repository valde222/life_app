import { TestBed } from '@angular/core/testing';
import { ArchiveActions } from './archive-actions';
import { LocalStore } from './local-store';
import { Repository } from './repository';

describe('ArchiveActions', () => {
  let local: LocalStore;
  let repository: Repository;
  let archive: ArchiveActions;

  beforeEach(async () => {
    local = TestBed.inject(LocalStore);
    await local.open();
    await Promise.all(local.tables.map((table) => table.clear()));
    repository = TestBed.inject(Repository);
    archive = TestBed.inject(ArchiveActions);
  });

  it('brings back archived and deleted items, and purges for good', async () => {
    const todo = await repository.save('todos', { title: 'a', archived_at: 'x' });
    const note = await repository.save('notes', { title: 'b', deleted_at: 'x' });

    await archive.unarchive({ kind: 'todos', id: todo.id });
    await archive.undelete({ kind: 'notes', id: note.id });
    expect((await local.records('todos').get(todo.id))?.archived_at).toBe('');
    expect((await local.records('notes').get(note.id))?.deleted_at).toBe('');

    await archive.purgeAll([
      { kind: 'todos', id: todo.id },
      { kind: 'notes', id: note.id },
    ]);
    expect(await local.records('todos').count()).toBe(0);
    expect(await local.records('notes').count()).toBe(0);
  });
});
