import { EMPTY_RECORDS } from './models';
import { DeviceEvent, planImport, stableId } from './import-plan';

const now = new Date(2026, 9, 21, 10, 0);
const device = (fields: Partial<DeviceEvent>): DeviceEvent => ({
  id: 'e1',
  calendarId: 'personal',
  title: 'Dentist',
  startDate: new Date(2026, 9, 22, 9, 0).getTime(),
  endDate: new Date(2026, 9, 22, 10, 0).getTime(),
  isAllDay: false,
  ...fields,
});

describe('calendar import (R13)', () => {
  it('imports events from enabled calendars only, with a stable id', () => {
    const plan = planImport(
      [],
      {
        events: [device({}), device({ id: 'e2', calendarId: 'work' })],
        enabledCalendars: new Set(['personal']),
      },
      now,
    );
    expect(plan.upserts).toHaveLength(1);
    expect(plan.upserts[0].id).toBe(stableId('personal', 'e1', device({}).startDate));
    expect(plan.upserts[0].id).toMatch(/^[a-z0-9]{15}$/);
  });

  it('leaves unchanged events alone and removes ones gone from the calendar', () => {
    const first = planImport(
      [],
      { events: [device({})], enabledCalendars: new Set(['personal']) },
      now,
    ).upserts[0];
    const stored = { ...EMPTY_RECORDS.calendar_events, ...first };
    const gone = { ...EMPTY_RECORDS.calendar_events, id: 'gone00000000001' };

    const plan = planImport(
      [stored, gone],
      { events: [device({})], enabledCalendars: new Set(['personal']) },
      now,
    );

    expect(plan.upserts).toHaveLength(0);
    expect(plan.removals).toEqual(['gone00000000001']);
  });

  it('removes everything from a calendar that was switched off', () => {
    const first = planImport(
      [],
      { events: [device({})], enabledCalendars: new Set(['personal']) },
      now,
    ).upserts[0];
    const stored = { ...EMPTY_RECORDS.calendar_events, ...first };
    expect(
      planImport([stored], { events: [device({})], enabledCalendars: new Set() }, now).removals,
    ).toEqual([stored.id]);
  });
});
