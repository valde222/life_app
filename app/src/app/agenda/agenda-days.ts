import { CalendarEvent, Completion, List, Todo } from '../data/models';
import { calendarEventAsTodo, itemLink } from '../calendar/calendar-items';
import {
  completionDays,
  isRepeating,
  isScheduledOn,
  repeatStatus,
} from '../repeating/repeat-status';
import { addDays, daysBetween } from '../time/local-date';

export interface AgendaItem {
  key: string;
  title: string;
  time: string;
  timeEnd: string;
  event: boolean;
  list?: List;
  repeating: boolean;
  link: string[];
}

export interface AgendaDay {
  date: string;
  endDate?: string;
  items: AgendaItem[];
}

export interface AgendaSources {
  todos: Todo[];
  calendarEvents: CalendarEvent[];
  completions: Completion[];
  lists: Map<string, List>;
}

const byTime = (a: AgendaItem, b: AgendaItem) =>
  Number(a.repeating) - Number(b.repeating) ||
  (a.time || '99').localeCompare(b.time || '99') ||
  a.title.localeCompare(b.title);

function repeatingOn(todo: Todo, day: string, today: string, completions: Completion[]): boolean {
  if (day < today) {
    return false;
  }
  const status = repeatStatus(todo, completions, today);
  if (todo.repeat_mode === 'schedule') {
    return status.overdue && day === today
      ? true
      : isScheduledOn(todo, day) && !completionDays(todo, completions).includes(day);
  }
  if (!todo.repeat_every_days) {
    return false;
  }
  const due = addDays(status.lastDone ?? today, todo.repeat_every_days);
  return day === (due < today ? today : due);
}

export function agendaItemsOn(day: string, today: string, sources: AgendaSources): AgendaItem[] {
  const dated = [
    ...sources.todos.filter((todo) => !isRepeating(todo)),
    ...sources.calendarEvents.map(calendarEventAsTodo),
  ]
    .filter((todo) => todo.date === day && !todo.done_at && !todo.archived_at && !todo.deleted_at)
    .map((todo) => ({
      key: todo.id,
      title: todo.title,
      time: todo.time,
      timeEnd: todo.time_end,
      event: todo.is_event,
      list: sources.lists.get(todo.list),
      repeating: false,
      link: itemLink(todo),
    }));
  const repeating = sources.todos
    .filter(
      (todo) =>
        isRepeating(todo) &&
        !todo.archived_at &&
        !todo.deleted_at &&
        repeatingOn(todo, day, today, sources.completions),
    )
    .map((todo) => {
      const lastDone = completionDays(todo, sources.completions)[0];
      const since = lastDone ? daysBetween(lastDone, day) : 0;
      return {
        key: `${todo.id}@${day}`,
        title: todo.title,
        time: lastDone ? `${since} days` : '',
        timeEnd: '',
        event: false,
        repeating: true,
        link: ['/repeating'],
      };
    });
  return [...dated, ...repeating].sort(byTime);
}

export function agendaDays(
  from: string,
  count: number,
  today: string,
  sources: AgendaSources,
): AgendaDay[] {
  const days: AgendaDay[] = [];
  for (let offset = 0; offset < count; offset++) {
    const date = addDays(from, offset);
    const items = agendaItemsOn(date, today, sources);
    const last = days.at(-1);
    if (!items.length && last && !last.items.length) {
      last.endDate = date;
    } else {
      days.push({ date, items });
    }
  }
  return days;
}

export function datesWithItems(
  from: string,
  to: string,
  today: string,
  sources: AgendaSources,
): Set<string> {
  const dates = new Set<string>();
  for (let date = from; date <= to; date = addDays(date, 1)) {
    if (agendaItemsOn(date, today, sources).length) {
      dates.add(date);
    }
  }
  return dates;
}
