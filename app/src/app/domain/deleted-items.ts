import { List, Note, Todo } from './models';
import { daysBetween } from './time/local-date';
import { dayOfTimestamp } from './time/timestamps';

export const KEEP_DELETED_DAYS = 30;

export interface DeletedItem {
  kind: 'todos' | 'notes' | 'lists';
  id: string;
  title: string;
  deletedAt: string;
  daysLeft: number;
}

const KIND_LABEL = { todos: 'Todo', notes: 'Note', lists: 'List' } as const;

export interface DeletableRecords {
  todos: Todo[];
  notes: Note[];
  lists: List[];
}

export function deletedItems(records: DeletableRecords, today: string): DeletedItem[] {
  const { todos, notes, lists } = records;
  const entries = [
    ...todos.map((record) => ({ kind: 'todos' as const, record, title: record.title })),
    ...notes.map((record) => ({
      kind: 'notes' as const,
      record,
      title: record.title || 'Untitled',
    })),
    ...lists.map((record) => ({ kind: 'lists' as const, record, title: record.name })),
  ];
  return entries
    .filter(({ record }) => record.deleted_at)
    .map(({ kind, record, title }) => ({
      kind,
      id: record.id,
      title,
      deletedAt: record.deleted_at,
      daysLeft: KEEP_DELETED_DAYS - daysBetween(dayOfTimestamp(record.deleted_at), today),
    }))
    .filter((item) => item.daysLeft > 0)
    .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

export function deletedSub(item: DeletedItem): string {
  return `${KIND_LABEL[item.kind]}, ${item.daysLeft} day${item.daysLeft === 1 ? '' : 's'} left`;
}
