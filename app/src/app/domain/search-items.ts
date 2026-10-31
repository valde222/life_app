import { Note, Todo } from './models';

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

export interface Searchable {
  todos: Todo[];
  notes: Note[];
}

export interface SearchOptions {
  query: string;
  filter: SearchFilter;
  archived?: boolean;
}

const inView = (record: Todo | Note, archived: boolean) =>
  !record.deleted_at && !!record.archived_at === archived;

function todoHits(todos: Todo[], query: string, archived: boolean): SearchHit[] {
  return todos
    .filter((todo) => inView(todo, archived) && (!query || matches(todo.title, query)))
    .map((todo) => ({
      kind: 'todo',
      id: todo.id,
      title: todo.title,
      list: todo.list,
      changedAt: todo.changed_at,
      done: !!todo.done_at,
    }));
}

function noteHits(notes: Note[], query: string, archived: boolean): SearchHit[] {
  return notes
    .filter(
      (note) =>
        inView(note, archived) &&
        (!query || matches(note.title, query) || matches(note.body, query)),
    )
    .map((note) => ({
      kind: 'note',
      id: note.id,
      title: note.title || 'Untitled',
      list: note.list,
      changedAt: note.changed_at,
      done: false,
    }));
}

export function search(records: Searchable, options: SearchOptions): SearchHit[] {
  const query = options.query.trim();
  const archived = options.archived ?? false;
  return [
    ...(options.filter === 'notes' ? [] : todoHits(records.todos, query, archived)),
    ...(options.filter === 'todos' ? [] : noteHits(records.notes, query, archived)),
  ].sort((a, b) => b.changedAt - a.changedAt);
}
