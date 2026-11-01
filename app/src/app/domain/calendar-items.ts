import { CalendarEvent, EMPTY_RECORDS, Todo } from './models';
import { localDate } from './time/local-date';
import { startOf } from './time/until';
import { parseTimestamp } from './time/timestamps';

export const CALENDAR_PREFIX = 'cal:';

function clock(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function calendarEventAsTodo(event: CalendarEvent): Todo {
  const start = parseTimestamp(event.start);
  const end = event.end ? parseTimestamp(event.end) : null;
  const sameDay = end && localDate(end) === localDate(start);
  return {
    ...EMPTY_RECORDS.todos,
    id: `${CALENDAR_PREFIX}${event.id}`,
    title: event.title,
    date: localDate(start),
    time: event.all_day ? '' : clock(start),
    time_end: event.all_day || !end || !sameDay ? '' : clock(end),
    is_event: true,
    changed_at: event.changed_at,
    created: event.created,
  };
}

export function isCalendarItem(todo: Todo) {
  return todo.id.startsWith(CALENDAR_PREFIX);
}

export function itemLink(todo: Todo): string[] {
  return isCalendarItem(todo)
    ? ['/event', todo.id.slice(CALENDAR_PREFIX.length)]
    : ['/todo', todo.id];
}

export function hasEnded(todo: Todo, now: Date): boolean {
  if (!todo.time || todo.date !== localDate(now)) {
    return false;
  }
  const endsTomorrow = !!todo.time_end && todo.time_end < todo.time;
  return !endsTomorrow && startOf(todo.date, todo.time_end || todo.time) <= now;
}
