import { Completion, Note, Step, Todo } from './models';
import { addDays, localDate, parseLocalDate } from './time/local-date';

export interface WeekSummary {
  start: string;
  end: string;
  days: { date: string; done: number }[];
  finished: Todo[];
  doneCount: number;
  notes: Note[];
  byList: { list: string; count: number }[];
}

const dayOf = (timestamp: string) => localDate(new Date(timestamp.replace(' ', 'T')));

export function weekSummary(
  today: string,
  todos: Todo[],
  completions: Completion[],
  notes: Note[],
): WeekSummary {
  const start = addDays(today, -((parseLocalDate(today).getDay() + 6) % 7));
  const end = addDays(start, 6);
  const inWeek = (date: string) => date >= start && date <= end;

  const finished = todos
    .filter((todo) => todo.done_at && !todo.deleted_at && inWeek(dayOf(todo.done_at)))
    .sort((a, b) => b.done_at.localeCompare(a.done_at));
  const repeats = completions.filter(
    (completion) => !completion.deleted_at && inWeek(completion.done_on),
  );
  const doneDays = [
    ...finished.map((todo) => dayOf(todo.done_at)),
    ...repeats.map((completion) => completion.done_on),
  ];

  const repeatLists = new Map(todos.map((todo) => [todo.id, todo.list]));
  const listCounts = new Map<string, number>();
  for (const list of [
    ...finished.map((todo) => todo.list),
    ...repeats.map((completion) => repeatLists.get(completion.todo) ?? ''),
  ]) {
    if (list) {
      listCounts.set(list, (listCounts.get(list) ?? 0) + 1);
    }
  }

  return {
    start,
    end,
    days: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      return { date, done: doneDays.filter((day) => day === date).length };
    }),
    finished,
    doneCount: doneDays.length,
    notes: notes
      .filter(
        (note) => !note.deleted_at && !note.inbox && note.created && inWeek(dayOf(note.created)),
      )
      .sort((a, b) => (b.created ?? '').localeCompare(a.created ?? '')),
    byList: [...listCounts]
      .map(([list, count]) => ({ list, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function stepsLabel(todo: Todo, steps: Step[]): string {
  const count = steps.filter((step) => step.todo === todo.id && !step.deleted_at).length;
  return count ? `${count} step${count === 1 ? '' : 's'}` : '';
}
