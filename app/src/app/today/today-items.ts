import { Todo } from '../data/models';
import { localDate } from '../time/local-date';
import { startOf } from '../time/until';

export interface TodayItems {
  next: Todo | null;
  scheduled: Todo[];
  anytime: Todo[];
  done: Todo[];
  leftOver: Todo[];
  total: number;
}

const isLive = (todo: Todo) => !todo.deleted_at && !todo.archived_at;
const isOneOff = (todo: Todo) => todo.repeat_mode === 'none' || !todo.repeat_mode;
const byTime = (a: Todo, b: Todo) => a.time.localeCompare(b.time) || a.title.localeCompare(b.title);

export function todayItems(todos: Todo[], now: Date): TodayItems {
  const today = localDate(now);
  const dated = todos.filter((todo) => isLive(todo) && isOneOff(todo) && todo.date === today);
  const open = dated.filter((todo) => !todo.done_at);
  const timed = open.filter((todo) => todo.time).sort(byTime);
  const next = timed.find((todo) => startOf(today, todo.time) > now) ?? null;
  return {
    next,
    scheduled: timed.filter((todo) => todo !== next),
    anytime: open
      .filter((todo) => !todo.time)
      .sort(
        (a, b) =>
          (a.created ?? '').localeCompare(b.created ?? '') || a.title.localeCompare(b.title),
      ),
    done: dated.filter((todo) => todo.done_at).sort((a, b) => b.done_at.localeCompare(a.done_at)),
    leftOver: todos.filter(
      (todo) =>
        isLive(todo) &&
        isOneOff(todo) &&
        !todo.done_at &&
        !todo.is_event &&
        todo.date &&
        todo.date < today,
    ),
    total: dated.length,
  };
}
