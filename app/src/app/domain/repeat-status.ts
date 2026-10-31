import { Completion, Draft, RepeatMode, Todo } from './models';
import { addDays, daysBetween, localDate, weekday, weekdayName } from './time/local-date';

export const ROUGH_CHOICES = [
  { label: 'Every few days', days: 3, sub: 'about every few days', unit: 'a few days' },
  { label: 'Weekly', days: 7, sub: 'about weekly', unit: 'a week' },
  { label: 'Every 2 weeks', days: 14, sub: 'about every 2 weeks', unit: '2 weeks' },
  { label: 'Monthly', days: 30, sub: 'about monthly', unit: 'a month' },
  { label: 'Just count days', days: 0, sub: 'counting days', unit: '' },
];

export const WEEK_CHOICES = [1, 2, 4];
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SCHEDULE_LOOKAHEAD_DAYS = 7 * 4 * 2;

export interface RepeatStatus {
  lastDone: string | null;
  daysSince: number;
  target: number;
  overdue: boolean;
  nextDue: string | null;
  tag: string;
  sub: string;
}

export function isRepeating(todo: Todo) {
  return todo.repeat_mode === 'rough' || todo.repeat_mode === 'schedule';
}

export function completionDays(todo: Todo, completions: Completion[]): string[] {
  return completions
    .filter(
      (completion) => completion.todo === todo.id && !completion.deleted_at && completion.done_on,
    )
    .map((completion) => completion.done_on)
    .sort()
    .reverse();
}

function startDay(todo: Todo): string {
  return todo.created
    ? localDate(new Date(todo.created.replace(' ', 'T')))
    : localDate(new Date(todo.changed_at || Date.now()));
}

export function weekdayList(days: number[]): string {
  const names = WEEKDAY_ORDER.filter((day) => days.includes(day)).map((day) => WEEKDAY_SHORT[day]);
  return names.length > 1
    ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
    : (names[0] ?? '');
}

export function scheduleSub(todo: Todo): string {
  const every =
    todo.repeat_every_weeks > 1 ? `every ${todo.repeat_every_weeks} weeks on ` : 'every ';
  return `${every}${weekdayList(todo.repeat_weekdays ?? [])}`;
}

function mondayOf(day: string): string {
  return addDays(day, -((weekday(day) + 6) % 7));
}

export function isScheduledOn(todo: Todo, day: string): boolean {
  const weekdays = todo.repeat_weekdays ?? [];
  if (!weekdays.includes(weekday(day))) {
    return false;
  }
  const every = Math.max(1, todo.repeat_every_weeks || 1);
  const weeks = Math.round(daysBetween(mondayOf(startDay(todo)), mondayOf(day)) / 7);
  return weeks >= 0 && weeks % every === 0;
}

export function repeatStatus(todo: Todo, completions: Completion[], today: string): RepeatStatus {
  const done = completionDays(todo, completions);
  const lastDone = done[0] ?? null;
  const daysSince = Math.max(0, daysBetween(lastDone ?? startDay(todo), today));
  if (todo.repeat_mode === 'schedule') {
    return scheduleStatus(todo, { done, lastDone, daysSince }, today);
  }
  const target = todo.repeat_every_days ?? 0;
  const choice = ROUGH_CHOICES.find((each) => each.days === target);
  return {
    lastDone,
    daysSince,
    target,
    overdue: target > 0 && daysSince > target,
    nextDue: null,
    tag: dayWord(daysSince),
    sub: choice?.sub ?? `about every ${target} days`,
  };
}

interface History {
  done: string[];
  lastDone: string | null;
  daysSince: number;
}

function missedSinceLastDone(todo: Todo, lastDone: string | null, today: string): boolean {
  const start = startDay(todo);
  for (
    let day = addDays(today, -1);
    day >= start && (!lastDone || day > lastDone);
    day = addDays(day, -1)
  ) {
    if (isScheduledOn(todo, day)) {
      return true;
    }
  }
  return false;
}

function nextDueDay(todo: Todo, done: Set<string>, today: string): string | null {
  for (let offset = 0; offset <= SCHEDULE_LOOKAHEAD_DAYS; offset++) {
    const day = addDays(today, offset);
    if (isScheduledOn(todo, day) && !done.has(day)) {
      return day;
    }
  }
  return null;
}

function scheduleTag(nextDue: string | null, today: string, daysSince: number): string {
  if (nextDue === today) {
    return 'Today';
  }
  return nextDue ? weekdayName(nextDue) : dayWord(daysSince);
}

function scheduleStatus(todo: Todo, history: History, today: string): RepeatStatus {
  const nextDue = nextDueDay(todo, new Set(history.done), today);
  const target =
    (7 * Math.max(1, todo.repeat_every_weeks || 1)) /
    Math.max(1, (todo.repeat_weekdays ?? []).length);
  return {
    lastDone: history.lastDone,
    daysSince: history.daysSince,
    target: Math.round(target),
    overdue: missedSinceLastDone(todo, history.lastDone, today),
    nextDue,
    tag: scheduleTag(nextDue, today, history.daysSince),
    sub: scheduleSub(todo),
  };
}

export function dayWord(days: number): string {
  if (days === 0) {
    return 'Today';
  }
  return days === 1 ? '1 day' : `${days} days`;
}

export interface RepeatSettings {
  title: string;
  list: string;
  mode: Exclude<RepeatMode, 'none'>;
  everyDays: number;
  everyWeeks: number;
  weekdays: number[];
}

export interface StopRepeating {
  list: string;
  date: string;
}

export function repeatFields(settings: RepeatSettings): Draft<'todos'> {
  return {
    title: settings.title.trim(),
    list: settings.list,
    inbox: false,
    repeat_mode: settings.mode,
    repeat_every_days: settings.mode === 'rough' ? settings.everyDays : 0,
    repeat_every_weeks: settings.mode === 'schedule' ? settings.everyWeeks : 0,
    repeat_weekdays: settings.mode === 'schedule' ? [...settings.weekdays].sort() : null,
    date: '',
    time: '',
    time_end: '',
    is_event: false,
    done_at: '',
  };
}

export function stoppedRepeatFields(stop: StopRepeating): Draft<'todos'> {
  return {
    repeat_mode: 'none',
    repeat_every_days: 0,
    repeat_every_weeks: 0,
    repeat_weekdays: null,
    list: stop.list,
    date: stop.date,
    inbox: !stop.list && !stop.date,
  };
}
