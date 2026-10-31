import { EMPTY_RECORDS, Todo } from './models';
import { agendaDays } from './agenda-days';

const todo = (fields: Partial<Todo>): Todo => ({
  ...EMPTY_RECORDS.todos,
  id: Math.random().toString(36).slice(2),
  ...fields,
});

describe('agendaDays (R28)', () => {
  const sources = {
    todos: [
      todo({ title: 'Call the landlord', date: '2026-10-21', time: '17:00' }),
      todo({ title: 'Pay taxes', date: '2026-10-21' }),
      todo({ title: 'Staging', date: '2026-10-23' }),
      todo({ title: 'Done already', date: '2026-10-23', done_at: 'x' }),
    ],
    calendarEvents: [],
    completions: [],
    lists: new Map(),
  };

  it('lists each day with timed items first', () => {
    const days = agendaDays({ from: '2026-10-21', count: 3 }, '2026-10-21', sources);
    expect(days[0].items.map((item) => item.title)).toEqual(['Call the landlord', 'Pay taxes']);
  });

  it('folds runs of empty days into one', () => {
    const days = agendaDays({ from: '2026-10-21', count: 7 }, '2026-10-21', sources);
    expect(days.map((day) => [day.date, day.endDate])).toEqual([
      ['2026-10-21', undefined],
      ['2026-10-22', undefined],
      ['2026-10-23', undefined],
      ['2026-10-24', '2026-10-27'],
    ]);
    expect(days[2].items.map((item) => item.title)).toEqual(['Staging']);
  });

  it('one-off todos can be ticked from the Agenda; events cannot', () => {
    const meeting = todo({ title: 'Meeting', date: '2026-10-21', time: '09:00', is_event: true });
    const days = agendaDays({ from: '2026-10-21', count: 1 }, '2026-10-21', {
      ...sources,
      todos: [...sources.todos, meeting],
    });
    const tickable = Object.fromEntries(days[0].items.map((item) => [item.title, !!item.tickable]));
    expect(tickable).toEqual({ Meeting: false, 'Call the landlord': true, 'Pay taxes': true });
  });
});
