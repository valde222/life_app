import { EMPTY_RECORDS } from './models';
import { search } from './search-items';

describe('search (R30)', () => {
  const todos = [
    { ...EMPTY_RECORDS.todos, id: 't1', title: 'Set up Client A staging', changed_at: 3 },
    {
      ...EMPTY_RECORDS.todos,
      id: 't2',
      title: 'Old staging task',
      changed_at: 1,
      archived_at: 'x',
    },
  ];
  const notes = [
    {
      ...EMPTY_RECORDS.notes,
      id: 'n1',
      title: 'Why the deploy failed',
      body: 'Staging migrations ran late',
      changed_at: 2,
    },
  ];

  it('finds todo titles and note titles and bodies, newest first', () => {
    expect(
      search({ todos, notes }, { query: 'staging', filter: 'all' }).map((hit) => hit.id),
    ).toEqual(['t1', 'n1']);
  });

  it('filters to todos or notes', () => {
    expect(
      search({ todos, notes }, { query: 'staging', filter: 'notes' }).map((hit) => hit.id),
    ).toEqual(['n1']);
    expect(
      search({ todos, notes }, { query: 'staging', filter: 'todos' }).map((hit) => hit.id),
    ).toEqual(['t1']);
  });

  it('searches the archive separately', () => {
    expect(
      search({ todos, notes }, { query: 'staging', filter: 'all', archived: true }).map(
        (hit) => hit.id,
      ),
    ).toEqual(['t2']);
  });

  it('marks repeating items as chores', () => {
    const chore = { ...todos[0], id: 'c1', title: 'Clean bathroom', repeat_mode: 'rough' as const };
    const hits = search({ todos: [chore], notes: [] }, { query: 'bathroom', filter: 'todos' });
    expect(hits.map((hit) => [hit.id, hit.repeating])).toEqual([['c1', true]]);
  });
});
