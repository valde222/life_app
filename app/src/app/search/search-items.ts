import { Note, Todo } from '../data/models';

export type SearchFilter = 'all' | 'todos' | 'notes';

export interface SearchHit {
  kind: 'todo' | 'note';
  id: string;
  title: string;
  list: string;
  changedAt: number;
  done: boolean;
}

export function matches(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function search(
  todos: Todo[],
  notes: Note[],
  query: string,
  filter: SearchFilter,
  archived = false,
): SearchHit[] {
  const trimmed = query.trim();
  const keep = (record: Todo | Note) => !record.deleted_at && !!record.archived_at === archived;
  const todoHits: SearchHit[] =
    filter === 'notes'
      ? []
      : todos
          .filter((todo) => keep(todo) && (!trimmed || matches(todo.title, trimmed)))
          .map((todo) => ({
            kind: 'todo',
            id: todo.id,
            title: todo.title,
            list: todo.list,
            changedAt: todo.changed_at,
            done: !!todo.done_at,
          }));
  const noteHits: SearchHit[] =
    filter === 'todos'
      ? []
      : notes
          .filter(
            (note) =>
              keep(note) &&
              (!trimmed || matches(note.title, trimmed) || matches(note.body, trimmed)),
          )
          .map((note) => ({
            kind: 'note',
            id: note.id,
            title: note.title || 'Untitled',
            list: note.list,
            changedAt: note.changed_at,
            done: false,
          }));
  return [...todoHits, ...noteHits].sort((a, b) => b.changedAt - a.changedAt);
}
