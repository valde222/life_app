import { computed, inject, Injectable } from '@angular/core';
import { CalendarChoice } from '../../domain/models';
import { Repository } from '../data/repository';
import { Store } from '../data/store';

@Injectable({ providedIn: 'root' })
export class CalendarSettings {
  private readonly store = inject(Store);
  private readonly repository = inject(Repository);

  private readonly record = computed(() => this.store.settings()[0]);
  readonly calendars = computed<CalendarChoice[]>(() => this.record()?.calendars ?? []);
  readonly enabled = computed(() => this.calendars().filter((calendar) => calendar.enabled));
  readonly summary = computed(() =>
    this.enabled()
      .map((calendar) => calendar.name)
      .join(', '),
  );

  nameOf(id: string) {
    return this.calendars().find((calendar) => calendar.id === id)?.name ?? 'Calendar';
  }

  async setEnabled(id: string, enabled: boolean) {
    await this.save(
      this.calendars().map((calendar) =>
        calendar.id === id ? { ...calendar, enabled } : calendar,
      ),
    );
  }

  async mergeDeviceCalendars(found: { id: string; name: string }[]) {
    const known = new Map(this.calendars().map((calendar) => [calendar.id, calendar]));
    const merged = found.map((calendar) => ({
      ...calendar,
      enabled: known.get(calendar.id)?.enabled ?? false,
    }));
    if (JSON.stringify(merged) !== JSON.stringify(this.calendars())) {
      await this.save(merged);
    }
  }

  private async save(calendars: CalendarChoice[]) {
    await this.repository.save('settings', { id: this.record()?.id, calendars });
  }
}
