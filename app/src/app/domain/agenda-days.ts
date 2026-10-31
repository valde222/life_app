import { CalendarEvent, Completion, List, Todo } from './models';
import { calendarEventAsTodo, itemLink } from './calendar-items';
import { completionDays, isRepeating, isScheduledOn, repeatStatus } from './repeat-status';
import { addDays, daysBetween } from './time/local-date';

export interface AgendaItem {
  key: string;
  title: string;
  time: string;
  timeEnd: string;
  event: boolean;
  list?: List;
  repeating: boolean;
  link: string[];
  tickable?: Todo;
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

export interface DayRange {
  from: string;
  count: number;
}

export interface DateSpan {
  from: string;
  to: string;
}

interface RepeatContext {
  today: string;
  completions: Completion[];
}

function scheduledRepeatOn(todo: Todo, day: string, context: RepeatContext): boolean {
  const status = repeatStatus(todo, context.completions, context.today);
  if (status.overdue && day === context.today) {
    return true;
  }
  return isScheduledOn(todo, day) && !completionDays(todo, context.completions).includes(day);
}

function roughRepeatOn(todo: Todo, day: string, context: RepeatContext): boolean {
  if (!todo.repeat_every_days) {
    return false;
  }
  const { lastDone } = repeatStatus(todo, context.completions, context.today);
  const due = addDays(lastDone ?? context.today, todo.repeat_every_days);
  return day === (due < context.today ? context.today : due);
}

function repeatingOn(todo: Todo, day: string, context: RepeatContext): boolean {
  if (day < context.today) {
    return false;
  }
  return todo.repeat_mode === 'schedule'
    ? scheduledRepeatOn(todo, day, context)
    : roughRepeatOn(todo, day, context);
}

function datedItemsOn(day: string, sources: AgendaSources): AgendaItem[] {
  return [
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
      ...(todo.is_event ? {} : { tickable: todo }),
    }));
}

function repeatingItemsOn(day: string, today: string, sources: AgendaSources): AgendaItem[] {
  const context = { today, completions: sources.completions };
  return sources.todos
    .filter(
      (todo) =>
        isRepeating(todo) &&
        !todo.archived_at &&
        !todo.deleted_at &&
        repeatingOn(todo, day, context),
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
}

export function agendaItemsOn(day: string, today: string, sources: AgendaSources): AgendaItem[] {
  return [...datedItemsOn(day, sources), ...repeatingItemsOn(day, today, sources)].sort(byTime);
}

export function agendaDays(range: DayRange, today: string, sources: AgendaSources): AgendaDay[] {
  const days: AgendaDay[] = [];
  for (let offset = 0; offset < range.count; offset++) {
    const date = addDays(range.from, offset);
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

export function datesWithItems(span: DateSpan, today: string, sources: AgendaSources): Set<string> {
  const dates = new Set<string>();
  for (let date = span.from; date <= span.to; date = addDays(date, 1)) {
    if (agendaItemsOn(date, today, sources).length) {
      dates.add(date);
    }
  }
  return dates;
}
