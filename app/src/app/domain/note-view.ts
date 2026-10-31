import { Note, Todo } from './models';
import { shortDate } from './time/local-date';
import { dayOfTimestamp } from './time/timestamps';

export interface NoteConnections {
  notes: Note[];
  todos: Todo[];
  linkedFrom: Note[];
}

export interface Notebook {
  notes: Note[];
  todos: Todo[];
}

export function noteConnections(
  note: Note | undefined,
  id: string,
  all: Notebook,
): NoteConnections {
  const notes = new Set(note?.links ?? []);
  const todos = new Set(note?.todos ?? []);
  return {
    notes: all.notes.filter((each) => notes.has(each.id)),
    todos: all.todos.filter((todo) => todos.has(todo.id)),
    linkedFrom: all.notes.filter((each) => each.links?.includes(id) && !notes.has(each.id)),
  };
}

export function noteDateLabel(created: string | undefined, today: string): string {
  const day = created ? dayOfTimestamp(created) : today;
  return day === today ? 'Today' : shortDate(day);
}
