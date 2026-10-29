import { Group, List, Note, Todo } from '../data/models';

export interface ListCounts {
  todos: number;
  notes: number;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function isOpenTodo(todo: Todo) {
  return !todo.done_at && !todo.archived_at && !todo.deleted_at;
}

export function isFiledNote(note: Note) {
  return !note.inbox && !note.archived_at && !note.deleted_at;
}

export function countsByList(todos: Todo[], notes: Note[]): Map<string, ListCounts> {
  const counts = new Map<string, ListCounts>();
  const entry = (list: string) =>
    counts.get(list) ?? counts.set(list, { todos: 0, notes: 0 }).get(list)!;
  for (const todo of todos) {
    if (todo.list && isOpenTodo(todo)) {
      entry(todo.list).todos++;
    }
  }
  for (const note of notes) {
    if (note.list && isFiledNote(note)) {
      entry(note.list).notes++;
    }
  }
  return counts;
}

export function listSummary(counts: ListCounts | undefined): string {
  if (!counts || (!counts.todos && !counts.notes)) {
    return 'Empty';
  }
  return [
    counts.todos && plural(counts.todos, 'todo'),
    counts.notes && plural(counts.notes, 'note'),
  ]
    .filter(Boolean)
    .join(', ');
}

export function groupSummary(group: Group, lists: List[], counts: Map<string, ListCounts>): string {
  const own = lists.filter((list) => list.group === group.id);
  const todos = own.reduce((sum, list) => sum + (counts.get(list.id)?.todos ?? 0), 0);
  return todos
    ? `${plural(own.length, 'list')}, ${plural(todos, 'todo')}`
    : plural(own.length, 'list');
}
