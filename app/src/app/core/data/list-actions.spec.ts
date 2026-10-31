import { TestBed } from '@angular/core/testing';
import { ListActions } from './list-actions';
import { LocalStore } from './local-store';
import { Repository } from './repository';
import { Store } from './store';

describe('ListActions', () => {
  let local: LocalStore;
  let repository: Repository;
  let store: Store;
  let lists: ListActions;

  beforeEach(async () => {
    local = TestBed.inject(LocalStore);
    await local.open();
    await Promise.all(local.tables.map((table) => table.clear()));
    repository = TestBed.inject(Repository);
    store = TestBed.inject(Store);
    lists = TestBed.inject(ListActions);
  });

  const settled = (count: number) => vi.waitFor(() => expect(store.lists()).toHaveLength(count));

  it('creates groups and lists after the last one', async () => {
    const life = await lists.createGroup('Life');
    await lists.createList({ name: 'Home', group: life.id, colour: 'blue' });
    await settled(1);
    const garden = await lists.createList({ name: 'Garden', group: life.id, colour: 'green' });
    expect([life.order, garden.order]).toEqual([0, 1]);
  });

  it('sets up a group with its lists, numbered by group', async () => {
    await lists.createGroupWithLists({
      name: 'Work',
      order: 1,
      lists: [
        { name: 'Client A', colour: 'orange' },
        { name: 'Client B', colour: 'pink' },
      ],
    });
    const saved = await local.records('lists').toArray();
    expect(saved.map((list) => [list.name, list.order]).sort()).toEqual([
      ['Client A', 100],
      ['Client B', 101],
    ]);
  });

  it('renames a group only to a new, non-empty name', async () => {
    const group = await lists.createGroup('Life');
    await lists.renameGroup(group, '  ');
    await lists.renameGroup(group, ' Home ');
    expect((await local.records('groups').get(group.id))?.name).toBe('Home');
  });

  it('archives with undo, and deletes a list with its todos and notes', async () => {
    const list = await lists.createList({ name: 'Home', group: 'g', colour: 'blue' });
    const undo = await lists.archiveList(list.id);
    expect((await local.records('lists').get(list.id))?.archived_at).not.toBe('');
    await undo();
    expect((await local.records('lists').get(list.id))?.archived_at).toBe('');

    const todo = await repository.save('todos', { title: 'Fix shelf', list: list.id });
    await vi.waitFor(() => expect(store.todos()).toHaveLength(1));
    await lists.deleteListWithItems(list.id);
    expect((await local.records('todos').get(todo.id))?.deleted_at).not.toBe('');
    expect((await local.records('lists').get(list.id))?.deleted_at).not.toBe('');
  });

  it('moves a dropped list to its new group and renumbers', async () => {
    const life = await repository.save('groups', { name: 'Life', order: 0 });
    const work = await repository.save('groups', { name: 'Work', order: 1 });
    const home = await repository.save('lists', { name: 'Home', group: life.id, order: 0 });
    await repository.save('lists', { name: 'Client', group: work.id, order: 1 });
    await settled(2);
    await vi.waitFor(() => expect(store.groups()).toHaveLength(2));

    await lists.moveList({ moved: home, group: work.id, index: 1 });

    const moved = await local.records('lists').get(home.id);
    expect([moved?.group, moved?.order]).toEqual([work.id, 1]);
  });
});
