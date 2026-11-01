import { EMPTY_RECORDS, Group, List, Note, Todo } from './models';
import { countsByList, groupSummary, listSummary } from './list-counts';

const life: Group = { ...EMPTY_RECORDS.groups, id: 'life', name: 'Life' };
const lists: List[] = [
  { ...EMPTY_RECORDS.lists, id: 'a', name: 'Apartment', group: 'life' },
  { ...EMPTY_RECORDS.lists, id: 's', name: 'Shopping', group: 'life' },
];
const todo = (list: string, fields: Partial<Todo> = {}): Todo => ({
  ...EMPTY_RECORDS.todos,
  id: Math.random().toString(),
  list,
  ...fields,
});
const note = (list: string): Note => ({
  ...EMPTY_RECORDS.notes,
  id: Math.random().toString(),
  list,
});

describe('list counts (R22)', () => {
  const counts = countsByList(
    [todo('a'), todo('a'), todo('a', { done_at: '2026-10-21 10:00:00Z' }), todo('s')],
    [note('a')],
  );

  it('counts open todos and filed notes per list', () => {
    expect(listSummary(counts.get('a'))).toBe('2 todos, 1 note');
    expect(listSummary(counts.get('nothing'))).toBe('Empty');
  });

  it('sums a closed group as lists and todos', () => {
    expect(groupSummary(life, lists, counts)).toBe('2 lists, 3 todos');
    expect(groupSummary(life, lists, new Map())).toBe('2 lists');
  });

  it('counts the todos a list page shows, so chores in a list are not counted (R22)', () => {
    const counts = countsByList(
      [
        todo('a'),
        todo('a', { repeat_mode: 'rough', repeat_every_days: 7 }),
        todo('a', { repeat_mode: 'schedule', repeat_weekdays: [1] }),
      ],
      [],
    );
    expect(counts.get('a')?.todos).toBe(1);
    expect(groupSummary(life, lists, counts)).toBe('2 lists, 1 todo');
  });
});
