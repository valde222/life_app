import { Note, Todo } from './models';
import { localDate } from './time/local-date';
import { dayOfTimestamp, parseTimestamp } from './time/timestamps';

export type InboxItem = { kind: 'todo'; record: Todo } | { kind: 'note'; record: Note };

export interface InboxSection {
  label: 'Today' | 'Earlier';
  items: InboxItem[];
}

export function capturedOn(record: Todo | Note): string {
  return record.created ? dayOfTimestamp(record.created) : localDate(new Date(record.changed_at));
}

const newestFirst = (a: InboxItem, b: InboxItem) => capturedAt(b.record) - capturedAt(a.record);

function capturedAt(record: Todo | Note) {
  return record.created ? parseTimestamp(record.created).getTime() : record.changed_at;
}

export function inboxSections(todos: Todo[], notes: Note[], today: string): InboxSection[] {
  const items: InboxItem[] = [
    ...todos.map((record) => ({ kind: 'todo' as const, record })),
    ...notes.map((record) => ({ kind: 'note' as const, record })),
  ].sort(newestFirst);
  const sections: InboxSection[] = [
    { label: 'Today', items: items.filter((item) => capturedOn(item.record) === today) },
    { label: 'Earlier', items: items.filter((item) => capturedOn(item.record) !== today) },
  ];
  return sections.filter((section) => section.items.length);
}
