import { List, Note } from './models';
import { longDate, shortDate } from './time/local-date';
import { dayOfTimestamp } from './time/timestamps';

export interface DayGroup<T> {
  day: string;
  label: string;
  items: T[];
}

export function groupByDay<T extends { day: string }>(rows: readonly T[]): DayGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const row of rows) {
    groups.set(row.day, [...(groups.get(row.day) ?? []), row]);
  }
  return [...groups]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, items]) => ({ day, label: longDate(day), items }));
}

export function closedListSub(list: List, notes: readonly Note[]): string {
  const count = notes.filter((note) => note.list === list.id && !note.deleted_at).length;
  const closed = `Closed ${shortDate(dayOfTimestamp(list.archived_at))}`;
  return count ? `${closed}, ${count} note${count === 1 ? '' : 's'}` : closed;
}
