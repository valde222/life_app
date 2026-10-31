import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/ui/icon';
import { Switch } from '../shared/ui/switch';
import { CalendarImporter } from '../core/calendar/calendar-importer';
import { CalendarSettings } from '../core/calendar/calendar-settings';

@Component({
  selector: 'app-calendars-page',
  imports: [Icon, RouterLink, Switch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <a class="back" routerLink="/settings"
        ><app-icon name="chevron-left" [size]="18" [stroke]="2.2" />Settings</a
      >
    </header>
    <main class="body">
      <h1 class="t-display">Calendars.</h1>
      @if (settings.calendars().length) {
        <div class="options list">
          @for (calendar of settings.calendars(); track calendar.id) {
            <div class="row">
              <span>{{ calendar.name }}</span>
              @if (importer.available) {
                <app-switch
                  [label]="calendar.name"
                  [on]="calendar.enabled"
                  (onChange)="toggle(calendar.id, $event)"
                />
              } @else {
                <span class="state">{{ calendar.enabled ? 'On' : 'Off' }}</span>
              }
            </div>
          }
        </div>
      } @else if (!importer.available) {
        <p class="t-empty-title empty">Set up on the phone.</p>
      }
      @if (importer.available) {
        <button type="button" class="btn btn-secondary" (click)="load()">
          {{ denied() ? 'Allow calendar access' : 'Find calendars' }}
        </button>
      }
    </main>
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
      padding: 0 var(--space-4) 48px;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      h1 {
        margin: 0 var(--space-1) var(--space-2);
      }
    }
    .list {
      padding: 0 var(--space-4);
    }
    .row {
      min-height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 16px;
    }
    .state {
      color: var(--muted);
    }
    .empty {
      margin: var(--space-6) 0 0;
      text-align: center;
    }
  `,
})
export class CalendarsPage {
  protected readonly settings = inject(CalendarSettings);
  protected readonly importer = inject(CalendarImporter);
  protected readonly denied = signal(false);

  constructor() {
    if (this.importer.available) {
      this.load();
    }
  }

  protected async load() {
    this.denied.set(!(await this.importer.loadCalendars()));
  }

  protected async toggle(id: string, enabled: boolean) {
    await this.settings.setEnabled(id, enabled);
    await this.importer.run();
  }
}
