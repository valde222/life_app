import { CalendarEvent, EMPTY_RECORDS, EMPTY_RECORDS as E, Todo } from './models';
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

describe('when an event has ended (R6)', () => {
  const event = (time: string, timeEnd: string): Todo => ({
    ...EMPTY_RECORDS.todos,
    is_event: true,
    date: '2026-10-31',
    time,
    time_end: timeEnd,
  });
  const at = (time: string) => new Date(`2026-10-31T${time}:00`);

  it('ends at its end time, or at its start without one', () => {
    expect(hasEnded(event('09:00', '10:00'), at('09:30'))).toBe(false);
    expect(hasEnded(event('09:00', '10:00'), at('10:00'))).toBe(true);
    expect(hasEnded(event('09:00', ''), at('09:01'))).toBe(true);
  });

  it('an event running past midnight has not ended that evening', () => {
    expect(hasEnded(event('23:00', '01:00'), at('22:00'))).toBe(false);
    expect(hasEnded(event('23:00', '01:00'), at('23:30'))).toBe(false);
  });
});
