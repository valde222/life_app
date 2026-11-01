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

  it('brings an item whose list was deleted back into the Inbox, not into the deleted list', async () => {
    const list = await repository.save('lists', { name: 'Garden', deleted_at: 'x' });
    const todo = await repository.save('todos', { title: 'Prune', list: list.id, deleted_at: 'x' });
    const note = await repository.save('notes', { title: 'Plan', list: list.id, archived_at: 'x' });

    await archive.undelete({ kind: 'todos', id: todo.id });
    await archive.unarchive({ kind: 'notes', id: note.id });

    expect(await local.records('todos').get(todo.id)).toMatchObject({ list: '', inbox: true });
    expect(await local.records('notes').get(note.id)).toMatchObject({ list: '', inbox: true });
  });

  it('leaves an item whose list still exists in that list', async () => {
    const list = await repository.save('lists', { name: 'Garden' });
    const todo = await repository.save('todos', { title: 'Prune', list: list.id, deleted_at: 'x' });
    await archive.undelete({ kind: 'todos', id: todo.id });
    expect(await local.records('todos').get(todo.id)).toMatchObject({
      list: list.id,
      inbox: false,
    });
  });

  it('brings a list whose group was deleted back into the first group left', async () => {
    const gone = await repository.save('groups', { name: 'Old', order: 0, deleted_at: 'x' });
    const work = await repository.save('groups', { name: 'Work', order: 2 });
    const life = await repository.save('groups', { name: 'Life', order: 1 });
    const list = await repository.save('lists', {
      name: 'Garden',
      group: gone.id,
      deleted_at: 'x',
    });

    await archive.undelete({ kind: 'lists', id: list.id });

    expect((await local.records('lists').get(list.id))?.group).toBe(life.id);
    expect(work.id).not.toBe(life.id);
  });
});
