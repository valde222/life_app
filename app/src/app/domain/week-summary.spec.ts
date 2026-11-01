import { Completion, EMPTY_RECORDS, Note, Todo } from './models';
import { weekSummary } from './week-summary';

describe('weekSummary (R29)', () => {
  const thursday = '2026-10-22';
  const at = (date: string) => new Date(`${date}T12:00:00`).toISOString().replace('T', ' ');
  const todos: Todo[] = [
    {
      ...EMPTY_RECORDS.todos,
      id: 'a',
      title: 'Set up the desk',
      list: 'apt',
      done_at: at('2026-10-20'),
    },
    {
      ...EMPTY_RECORDS.todos,
      id: 'b',
      title: 'Review login PR',
      list: 'cla',
      done_at: at('2026-10-21'),
    },
    { ...EMPTY_RECORDS.todos, id: 'c', title: 'Last week', done_at: at('2026-10-15') },
    { ...EMPTY_RECORDS.todos, id: 'r', title: 'Vacuum', list: 'apt', repeat_mode: 'rough' },
  ];
  const completions: Completion[] = [
    { ...EMPTY_RECORDS.completions, id: 'x', todo: 'r', done_on: '2026-10-21' },
  ];
  const notes: Note[] = [
    { ...EMPTY_RECORDS.notes, id: 'n', title: 'Living room plan', created: at('2026-10-21') },
  ];

  it('counts things done and notes written Monday to Sunday', () => {
    const week = weekSummary(thursday, { todos, completions, notes });
    expect([week.start, week.end]).toEqual(['2026-10-19', '2026-10-25']);
    expect(week.doneCount).toBe(3);
    expect(week.days.map((day) => day.done)).toEqual([0, 1, 2, 0, 0, 0, 0]);
    expect(week.finished.map((todo) => todo.title)).toEqual(['Review login PR', 'Set up the desk']);
    expect(week.notes).toHaveLength(1);
    expect(week.byList).toEqual([
      { list: 'apt', count: 2 },
      { list: 'cla', count: 1 },
    ]);
  });
});

describe('This week boundaries (R29)', () => {
  it('runs Monday to Sunday, also across the DST change and a year end', () => {
    expect([weekSummary('2026-10-25', { todos: [], completions: [], notes: [] }).start]).toEqual([
      '2026-10-19',
    ]);
    expect(weekSummary('2026-10-26', { todos: [], completions: [], notes: [] }).start).toBe(
      '2026-10-26',
    );
    const yearEnd = weekSummary('2026-12-31', { todos: [], completions: [], notes: [] });
    expect([yearEnd.start, yearEnd.end]).toEqual(['2026-12-28', '2027-01-03']);
  });
});
