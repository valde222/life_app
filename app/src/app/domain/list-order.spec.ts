import { EMPTY_RECORDS, List } from './models';
import { nextOrder, reorderLists } from './list-order';

const list = (id: string, group: string): List => ({ ...EMPTY_RECORDS.lists, id, group });

describe('list order', () => {
  it('puts a new item after the last one', () => {
    expect(nextOrder([])).toBe(0);
    expect(nextOrder([{ order: 3 }, { order: 1 }])).toBe(4);
  });

  it('moves a dropped list into its new group at the drop position', () => {
    const lists = [list('a', 'g1'), list('b', 'g1'), list('c', 'g2')];
    const moved = reorderLists(lists, { moved: lists[0], group: 'g2', index: 1 });
    expect(moved.map((each) => `${each.id}:${each.group}`)).toEqual(['b:g1', 'c:g2', 'a:g2']);
  });
});
