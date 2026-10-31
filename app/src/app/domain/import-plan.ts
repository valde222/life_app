import { CalendarEvent, Draft } from './models';
import { addDays, localDate, parseLocalDate } from './time/local-date';
import { pocketBaseTimestamp } from './time/timestamps';

export const WINDOW_DAYS_BACK = 14;
export const WINDOW_DAYS_AHEAD = 92;

export interface DeviceEvent {
  id: string;
  calendarId: string | null;
  title: string;
  startDate: number;
  endDate: number;
  isAllDay: boolean;
}

export interface ImportPlan {
  upserts: Draft<'calendar_events'>[];
  removals: string[];
}

export function importWindow(now: Date) {
  const today = localDate(now);
  return {
    from: parseLocalDate(addDays(today, -WINDOW_DAYS_BACK)).getTime(),
    to: parseLocalDate(addDays(today, WINDOW_DAYS_AHEAD)).getTime(),
  };
}

export function stableId(calendarId: string, eventId: string, start: number): string {
  let hash = 0xcbf29ce484222325n;
  for (const char of `${calendarId}|${eventId}|${start}`) {
    hash ^= BigInt(char.codePointAt(0) ?? 0);
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(36).padStart(15, '0').slice(-15);
}

export interface FetchedEvents {
  events: DeviceEvent[];
  enabledCalendars: Set<string>;
}

type CalendarDeviceEvent = DeviceEvent & { calendarId: string };

function toUpsert(event: CalendarDeviceEvent, syncedAt: string) {
  return {
    id: stableId(event.calendarId, event.id, event.startDate),
    calendar: event.calendarId,
    external_id: `${event.id}@${event.startDate}`,
    title: event.title || 'Busy',
    start: pocketBaseTimestamp(new Date(event.startDate)),
    end: pocketBaseTimestamp(new Date(event.endDate)),
    all_day: event.isAllDay,
    synced_at: syncedAt,
    deleted_at: '',
  };
}

function differs(stored: CalendarEvent | undefined, upsert: ReturnType<typeof toUpsert>): boolean {
  return (
    !stored ||
    !!stored.deleted_at ||
    stored.title !== upsert.title ||
    stored.start !== upsert.start ||
    stored.end !== upsert.end ||
    stored.all_day !== upsert.all_day
  );
}

export function planImport(
  existing: CalendarEvent[],
  fetched: FetchedEvents,
  now: Date,
): ImportPlan {
  const syncedAt = pocketBaseTimestamp(now);
  const upserts = fetched.events
    .filter(
      (event): event is CalendarDeviceEvent =>
        !!event.calendarId && fetched.enabledCalendars.has(event.calendarId),
    )
    .map((event) => toUpsert(event, syncedAt));
  const current = new Map(existing.map((event) => [event.id, event]));
  const kept = new Set(upserts.map((upsert) => upsert.id));
  return {
    upserts: upserts.filter((upsert) => differs(current.get(upsert.id), upsert)),
    removals: existing
      .filter((event) => !event.deleted_at && !kept.has(event.id))
      .map((event) => event.id),
  };
}
