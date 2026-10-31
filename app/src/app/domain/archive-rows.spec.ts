import { closedListSub, groupByDay } from './archive-rows';
import { EMPTY_RECORDS } from './models';
import { pocketBaseTimestamp } from './time/timestamps';

describe('archive rows', () => {
  it('groups rows by day, newest day first, keeping row order within a day', () => {
    const groups = groupByDay([
      { id: 'a', day: '2026-10-20' },
      { id: 'b', day: '2026-10-21' },
      { id: 'c', day: '2026-10-20' },
    ]);
    expect(groups.map((group) => [group.label, group.items.map((row) => row.id)])).toEqual([
      ['Wed 21 Oct', ['b']],
      ['Tue 20 Oct', ['a', 'c']],
    ]);
  });

  it('says when a list was closed and how many notes it keeps', () => {
    const list = {
      ...EMPTY_RECORDS.lists,
      id: 'l1',
      archived_at: pocketBaseTimestamp(new Date(2026, 9, 3, 12)),
    };
    const note = { ...EMPTY_RECORDS.notes, list: 'l1' };
    expect(closedListSub(list, [])).toBe('Closed Oct 3');
    expect(closedListSub(list, [note, { ...note, deleted_at: 'x' }])).toBe('Closed Oct 3, 1 note');
    expect(closedListSub(list, [note, note])).toBe('Closed Oct 3, 2 notes');
  });
});
