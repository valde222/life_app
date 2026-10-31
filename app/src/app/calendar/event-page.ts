import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../core/data/store';
import { Clock } from '../core/time/clock';
import { relativeDay } from '../domain/time/local-date';
import { Icon } from '../ui/icon';
import { calendarEventAsTodo } from '../domain/calendar-items';
import { CalendarSettings } from '../core/calendar/calendar-settings';

@Component({
  selector: 'app-event-page',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <a class="back" routerLink="/"
        ><app-icon name="chevron-left" [size]="18" [stroke]="2.2" />Today</a
      >
    </header>
    @if (item(); as item) {
      <main class="body">
        <div class="card title">
          <app-icon name="calendar" [size]="22" />
          <h1>{{ item.title }}</h1>
        </div>
        <div class="options details">
          <div class="row">
            <span class="label">Calendar</span><span class="value">{{ calendarName() }}</span>
          </div>
          <div class="row">
            <span class="label">Date</span><span class="value">{{ dateLabel() }}</span>
          </div>
          <div class="row">
            <span class="label">Time</span>
            <span class="value tabular">{{
              item.time ? item.time + (item.time_end ? '–' + item.time_end : '') : 'All day'
            }}</span>
          </div>
        </div>
      </main>
    }
  `,
  styles: `
    :host {
      display: block;
      max-width: 480px;
      margin: 0 auto;
    }
    .bar {
      padding: calc(44px + env(safe-area-inset-top)) 8px 0 4px;
    }
    .body {
      padding: var(--space-3) var(--space-4);
    }
    .title {
      min-height: 52px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      color: var(--ink-2);
      h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--ink);
      }
    }
    .details {
      margin-top: 14px;
      padding: 0 var(--space-4);
      border-radius: var(--radius-feature);
    }
    .row {
      min-height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 16px;
    }
    .label {
      color: var(--ink-2);
    }
    .value {
      font-weight: 600;
    }
  `,
})
export class EventPage {
  readonly id = input.required<string>();
  private readonly store = inject(Store);
  private readonly clock = inject(Clock);
  private readonly calendars = inject(CalendarSettings);

  private readonly event = computed(() =>
    this.store.calendarEvents().find((event) => event.id === this.id()),
  );
  protected readonly item = computed(() => {
    const event = this.event();
    return event ? calendarEventAsTodo(event) : undefined;
  });
  protected readonly dateLabel = computed(() => relativeDay(this.item()!.date, this.clock.today()));
  protected readonly calendarName = computed(() =>
    this.calendars.nameOf(this.event()?.calendar ?? ''),
  );
}
