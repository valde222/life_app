import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocalStore } from '../data/local-store';
import { CalendarChoice, EMPTY_RECORDS } from '../../domain/models';
import { CalendarImporter } from './calendar-importer';
import { CalendarSettings } from './calendar-settings';
import { stableId } from '../../domain/import-plan';

const device = vi.hoisted(() => ({
  permission: 'granted',
  events: [] as unknown[],
  calendars: [] as unknown[],
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@ebarooni/capacitor-calendar', () => ({
  CalendarPermissionScope: { READ_CALENDAR: 'readCalendar' },
  CapacitorCalendar: {
    checkPermission: async () => ({ result: device.permission }),
    requestReadOnlyCalendarAccess: async () => ({ result: device.permission }),
    listCalendars: async () => ({ result: device.calendars }),
    listEventsInRange: async () => ({ result: device.events }),
  },
}));

class FakeSettings {
  readonly calendars = signal<CalendarChoice[]>([{ id: 'work', name: 'Work', enabled: true }]);
  readonly enabled = computed(() => this.calendars().filter((calendar) => calendar.enabled));
  merged: { id: string; name: string }[] = [];
  async mergeDeviceCalendars(found: { id: string; name: string }[]) {
    this.merged = found;
  }
}

describe('CalendarImporter', () => {
  let store: LocalStore;
  let settings: FakeSettings;
  let importer: CalendarImporter;
  const start = new Date();
  start.setHours(12, 0, 0, 0);

  beforeEach(async () => {
    device.permission = 'granted';
    device.events = [
      {
        id: 'e1',
        calendarId: 'work',
        title: 'Lunch',
        startDate: start.getTime(),
        endDate: start.getTime() + 3_600_000,
        isAllDay: false,
      },
      {
        id: 'e2',
        calendarId: 'home',
        title: 'Not imported',
        startDate: start.getTime(),
        endDate: start.getTime(),
        isAllDay: false,
      },
    ];
    settings = new FakeSettings();
    TestBed.configureTestingModule({
      providers: [{ provide: CalendarSettings, useValue: settings }],
    });
    store = TestBed.inject(LocalStore);
    await store.open();
    await Promise.all(store.tables.map((table) => table.clear()));
    importer = TestBed.inject(CalendarImporter);
  });

  it('imports events from enabled calendars and removes ones that are gone', async () => {
    await store.records('calendar_events').put({
      ...EMPTY_RECORDS.calendar_events,
      id: 'old',
      calendar: 'work',
      external_id: 'gone',
      start: new Date(start.getTime() - 86_400_000).toISOString().replace('T', ' '),
    });

    await importer.run();

    const events = await store.records('calendar_events').toArray();
    const lunch = events.find((event) => event.id === stableId('work', 'e1', start.getTime()));
    expect(lunch).toMatchObject({
      title: 'Lunch',
      calendar: 'work',
      external_id: `e1@${start.getTime()}`,
    });
    expect(events.find((event) => event.id === 'old')?.deleted_at).not.toBe('');
    expect(events.some((event) => event.title === 'Not imported')).toBe(false);
  });

  it('does nothing without permission or with no calendar enabled', async () => {
    device.permission = 'denied';
    await importer.run();
    expect(await store.records('calendar_events').count()).toBe(0);

    device.permission = 'granted';
    settings.calendars.set([]);
    await importer.run();
    expect(await store.records('calendar_events').count()).toBe(0);
  });

  it('loads device calendars by title, falling back to the internal title', async () => {
    device.calendars = [
      { id: 'a', title: 'Work' },
      { id: 'b', internalTitle: 'Family' },
      { id: 'c' },
    ];
    expect(await importer.loadCalendars()).toBe(true);
    expect(settings.merged).toEqual([
      { id: 'a', name: 'Work' },
      { id: 'b', name: 'Family' },
      { id: 'c', name: 'Calendar' },
    ]);

    device.permission = 'denied';
    expect(await importer.loadCalendars()).toBe(false);
  });
});
