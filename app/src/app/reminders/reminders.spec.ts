import { EMPTY_RECORDS, Todo } from '../data/models';
import { dueReminders, notificationId } from './reminders';

const todo = (fields: Partial<Todo>): Todo => ({
  ...EMPTY_RECORDS.todos,
  id: 'todo00000000001',
  title: 'Call',
  ...fields,
});

describe('reminders', () => {
  const now = new Date(2026, 9, 21, 10, 0);

  it('schedules only future reminders of open todos', () => {
    const later = new Date(2026, 9, 21, 16, 50).toISOString();
    const earlier = new Date(2026, 9, 21, 9, 0).toISOString();
    const due = dueReminders(
      [
        todo({ reminder: later }),
        todo({ id: 'b', reminder: earlier }),
        todo({ id: 'c', reminder: later, done_at: 'x' }),
      ],
      now,
    );
    expect(due).toHaveLength(1);
    expect(due[0].id).toBe(notificationId('todo00000000001'));
  });

  it('gives each todo a stable positive notification id', () => {
    expect(notificationId('abc')).toBe(notificationId('abc'));
    expect(notificationId('abc')).toBeGreaterThan(0);
  });
});
