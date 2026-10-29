import { CalendarEvent, EMPTY_RECORDS, EMPTY_RECORDS as E } from '../data/models';
import { calendarEventAsTodo, hasEnded, itemLink } from './calendar-items';

const event = (fields: Partial<CalendarEvent>): CalendarEvent => ({
  ...EMPTY_RECORDS.calendar_events,
  id: 'ev0000000000001',
  ...fields,
});

describe('calendar items (R12, R14)', () => {
  it('turns a timed calendar event into a dated event on its local day', () => {
    const start = new Date(2026, 9, 21, 12, 0);
    const end = new Date(2026, 9, 21, 13, 0);
    const item = calendarEventAsTodo(
      event({ title: 'Dentist', start: start.toISOString(), end: end.toISOString() }),
    );
    expect(item).toMatchObject({
      title: 'Dentist',
      date: '2026-10-21',
      time: '12:00',
      time_end: '13:00',
      is_event: true,
    });
    expect(itemLink(item)).toEqual(['/event', 'ev0000000000001']);
  });

  it('puts all-day events under Anytime', () => {
    const start = new Date(2026, 9, 21);
    expect(calendarEventAsTodo(event({ start: start.toISOString(), all_day: true })).time).toBe('');
  });

  it('knows when a timed item has ended', () => {
    const item = { ...E.todos, date: '2026-10-21', time: '12:00', time_end: '13:00' };
    expect(hasEnded(item, new Date(2026, 9, 21, 12, 30))).toBe(false);
    expect(hasEnded(item, new Date(2026, 9, 21, 13, 0))).toBe(true);
  });
});
