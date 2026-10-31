import { Completion, Note, Step, Todo } from './models';
import { addDays, parseLocalDate } from './time/local-date';
import { dayOfTimestamp } from './time/timestamps';

export interface WeekSummary {
  start: string;
  end: string;
  days: { date: string; done: number }[];
  finished: Todo[];
  doneCount: number;
  notes: Note[];
  byList: { list: string; count: number }[];
}

export interface WeekRecords {
  todos: Todo[];
  completions: Completion[];
  notes: Note[];
}

function countByList(lists: string[]): { list: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const list of lists.filter(Boolean)) {
    counts.set(list, (counts.get(list) ?? 0) + 1);
  }
  return [...counts].map(([list, count]) => ({ list, count })).sort((a, b) => b.count - a.count);
}

function notesWritten(notes: Note[], inWeek: (date: string) => boolean): Note[] {
  return notes
    .filter(
      (note) =>
        !note.deleted_at && !note.inbox && note.created && inWeek(dayOfTimestamp(note.created)),
    )
    .sort((a, b) => (b.created ?? '').localeCompare(a.created ?? ''));
}

function weekOf(today: string): { start: string; end: string } {
  const start = addDays(today, -((parseLocalDate(today).getDay() + 6) % 7));
  return { start, end: addDays(start, 6) };
}

export function weekSummary(today: string, records: WeekRecords): WeekSummary {
  const { start, end } = weekOf(today);
  const inWeek = (date: string) => date >= start && date <= end;

  const finished = records.todos
    .filter((todo) => todo.done_at && !todo.deleted_at && inWeek(dayOfTimestamp(todo.done_at)))
    .sort((a, b) => b.done_at.localeCompare(a.done_at));
  const repeats = records.completions.filter(
    (completion) => !completion.deleted_at && inWeek(completion.done_on),
  );
  const doneDays = [
    ...finished.map((todo) => dayOfTimestamp(todo.done_at)),
    ...repeats.map((completion) => completion.done_on),
  ];
  const listOf = new Map(records.todos.map((todo) => [todo.id, todo.list]));

  return {
    start,
    end,
    days: Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      return { date, done: doneDays.filter((day) => day === date).length };
    }),
    finished,
    doneCount: doneDays.length,
    notes: notesWritten(records.notes, inWeek),
    byList: countByList([
      ...finished.map((todo) => todo.list),
      ...repeats.map((completion) => listOf.get(completion.todo) ?? ''),
    ]),
  };
}

export function stepsLabel(todo: Todo, steps: Step[]): string {
  const count = steps.filter((step) => step.todo === todo.id && !step.deleted_at).length;
  return count ? `${count} step${count === 1 ? '' : 's'}` : '';
}
