import { inject, Injectable } from '@angular/core';
import { CalendarPermissionScope, CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { Capacitor } from '@capacitor/core';
import { Repository } from '../data/repository';
import { CalendarSettings } from './calendar-settings';
import { importWindow, planImport } from '../../domain/import-plan';
import { logError } from '../logging/log';

const EVERY_MS = 15 * 60_000;

@Injectable({ providedIn: 'root' })
export class CalendarImporter {
  private readonly settings = inject(CalendarSettings);
  private readonly repository = inject(Repository);
  private started = false;
  private running = false;

  readonly available = Capacitor.isNativePlatform();

  start() {
    if (!this.available || this.started) {
      return;
    }
    this.started = true;
    setTimeout(() => void this.run(), 3000);
    setInterval(() => void this.run(), EVERY_MS);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        void this.run();
      }
    });
  }

  async loadCalendars(): Promise<boolean> {
    const { result } = await CapacitorCalendar.requestReadOnlyCalendarAccess();
    if (result !== 'granted') {
      return false;
    }
    const calendars = (await CapacitorCalendar.listCalendars()).result;
    await this.settings.mergeDeviceCalendars(
      calendars.map((calendar) => ({
        id: calendar.id,
        name: calendar.title ?? calendar.internalTitle ?? 'Calendar',
      })),
    );
    return true;
  }

  async run() {
    if (this.running || !this.settings.enabled().length) {
      return;
    }
    this.running = true;
    try {
      const { result: permission } = await CapacitorCalendar.checkPermission({
        scope: CalendarPermissionScope.READ_CALENDAR,
      });
      if (permission === 'granted') {
        await this.importEvents(new Date());
      }
    } catch (error) {
      logError('Calendar import failed', error);
    } finally {
      this.running = false;
    }
  }

  private async importEvents(now: Date) {
    const fetched = (await CapacitorCalendar.listEventsInRange(importWindow(now))).result;
    const existing = await this.repository.all('calendar_events');
    const enabled = new Set(this.settings.enabled().map((calendar) => calendar.id));
    const plan = planImport(existing, fetched, enabled, now);
    for (const upsert of plan.upserts) {
      await this.repository.save('calendar_events', upsert);
    }
    for (const id of plan.removals) {
      await this.repository.remove('calendar_events', id);
    }
  }
}
