import { TestBed } from '@angular/core/testing';
import { LinkActions } from './link-actions';
import { LocalStore } from './local-store';
import { Repository } from './repository';
import { Store } from './store';

describe('LinkActions', () => {
  let local: LocalStore;
  let repository: Repository;
  let links: LinkActions;

  beforeEach(async () => {
    local = TestBed.inject(LocalStore);
    await local.open();
    await Promise.all(local.tables.map((table) => table.clear()));
    repository = TestBed.inject(Repository);
    links = TestBed.inject(LinkActions);
  });

  it('sets the notes and todos a note links to', async () => {
    const note = await repository.save('notes', { title: 'a' });
    await links.setNoteLinks(note.id, { notes: ['n2'], todos: ['t1'] });
    expect(await local.records('notes').get(note.id)).toMatchObject({
      links: ['n2'],
      todos: ['t1'],
    });
  });

  it('links a todo to exactly the chosen notes', async () => {
    const kept = await repository.save('notes', { title: 'kept', todos: ['t1', 'x'] });
    const dropped = await repository.save('notes', { title: 'dropped', todos: ['t1'] });
    const added = await repository.save('notes', { title: 'added', todos: [] });
    await vi.waitFor(() => expect(TestBed.inject(Store).notes()).toHaveLength(3));

    await links.setNotesOfTodo('t1', new Set([kept.id, added.id]));

    const todosOf = async (id: string) => (await local.records('notes').get(id))?.todos;
    expect(await todosOf(kept.id)).toEqual(['t1', 'x']);
    expect(await todosOf(dropped.id)).toEqual([]);
    expect(await todosOf(added.id)).toEqual(['t1']);
  });
});
