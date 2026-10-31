import { inject, Injectable } from '@angular/core';
import { CalendarPermissionScope, CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { Capacitor } from '@capacitor/core';
import { LocalStore } from '../data/local-store';
import { Repository } from '../data/repository';
import { CalendarSettings } from './calendar-settings';
import { importWindow, planImport } from '../domain/import-plan';

const EVERY_MS = 15 * 60_000;

@Injectable({ providedIn: 'root' })
export class CalendarImporter {
  private readonly settings = inject(CalendarSettings);
  private readonly repository = inject(Repository);
  private readonly store = inject(LocalStore);
  private started = false;
  private running = false;

  readonly available = Capacitor.isNativePlatform();

  start() {
    if (!this.available || this.started) {
      return;
    }
    this.started = true;
    setTimeout(() => this.run(), 3000);
    setInterval(() => this.run(), EVERY_MS);
    document.addEventListener('visibilitychange', () => document.hidden || this.run());
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
      if (permission !== 'granted') {
        return;
      }
      const now = new Date();
      const fetched = (await CapacitorCalendar.listEventsInRange(importWindow(now))).result;
      const existing = await this.store.records('calendar_events').toArray();
      const plan = planImport(
        existing,
        fetched,
        new Set(this.settings.enabled().map((calendar) => calendar.id)),
        now,
      );
      for (const upsert of plan.upserts) {
        await this.repository.save('calendar_events', upsert);
      }
      for (const id of plan.removals) {
        await this.repository.remove('calendar_events', id);
      }
    } catch (error) {
      console.error('Calendar import failed', error);
    } finally {
      this.running = false;
    }
  }
}
