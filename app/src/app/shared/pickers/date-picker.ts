import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Clock } from '../../core/time/clock';
import {
  addDays,
  localDate,
  monthName,
  nextWeekday,
  parseLocalDate,
  weekdayName,
} from '../../domain/time/local-date';
import { Sheet, Sheets } from '../ui/sheet';
import { TimePicker, TimePickerData, TimePickerResult } from './time-picker';
import { timeRange } from '../../domain/time/time-range';

export interface DatePickerData {
  date: string;
  time?: string;
  timeEnd?: string;
  withTime?: boolean;
}

export interface DatePickerResult {
  date: string;
  time: string;
  timeEnd: string;
}

interface Day {
  date: string;
  day: number;
  past: boolean;
}

@Component({
  selector: 'app-date-picker',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet heading="Date.">
      <div class="quick">
        @for (choice of quick(); track choice.label) {
          <button
            type="button"
            class="chip"
            [class.on]="choice.date === date()"
            [attr.aria-pressed]="choice.date === date()"
            (click)="date.set(choice.date)"
          >
            {{ choice.label }}
          </button>
        }
      </div>
      <div class="card month">
        <div class="month-head">
          <span>{{ monthLabel() }}</span>
          <span class="nav">
            <button type="button" aria-label="Previous month" (click)="shiftMonth(-1)">‹</button>
            <button type="button" aria-label="Next month" (click)="shiftMonth(1)">›</button>
          </span>
        </div>
        <div class="grid">
          @for (name of weekdays; track name) {
            <div class="weekday">{{ name }}</div>
          }
          @for (blank of leading(); track $index) {
            <span></span>
          }
          @for (day of days(); track day.date) {
            <button
              type="button"
              class="day tabular"
              [class.past]="day.past"
              [class.today]="day.date === today"
              [class.on]="day.date === date()"
              [attr.aria-pressed]="day.date === date()"
              [attr.aria-label]="day.date"
              (click)="date.set(day.date)"
            >
              {{ day.day }}
            </button>
          }
        </div>
      </div>
      @if (data.withTime !== false) {
        <button type="button" class="card time-row" (click)="pickTime()">
          <span class="label">Time</span>
          <span class="value" [class.empty]="!time()">{{ timeLabel() }}</span>
        </button>
      }
      <button type="button" class="btn btn-primary" (click)="done()">Done</button>
    </app-sheet>
  `,
  styles: `
    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1-5);
    }
    .quick .chip {
      height: 36px;
      color: var(--accent);
    }
    .quick .chip.on {
      color: var(--on-accent);
    }
    .month {
      padding: var(--space-3);
      border-radius: var(--radius-feature);
    }
    .month-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-1) var(--space-2);
      font-size: var(--text-16);
      font-weight: 700;
    }
    .nav {
      display: flex;
      gap: var(--space-1);
    }
    .nav button {
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: var(--radius-chip);
      background: var(--bg);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: var(--space-half);
    }
    .weekday {
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-11);
      font-weight: 600;
      color: var(--ink-2);
    }
    .day {
      height: 42px;
      border: 0;
      border-radius: var(--radius-control);
      background: transparent;
      font-size: var(--text-15);
      font-weight: 500;
      color: var(--ink);
    }
    .day.past {
      color: var(--faint);
    }
    .day.today {
      box-shadow: inset 0 0 0 2px var(--ink);
      font-weight: 700;
    }
    .day.on {
      background: var(--accent);
      color: var(--on-accent);
      font-weight: 700;
      box-shadow: none;
    }
    .time-row {
      height: 52px;
      padding: 0 var(--space-4);
      border: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--text-16);
    }
    .label {
      color: var(--ink-2);
      font-weight: 500;
    }
    .value {
      font-weight: 600;
    }
    .value.empty {
      color: var(--muted);
      font-weight: 500;
    }
  `,
})
export class DatePicker {
  private readonly ref = inject(DialogRef<DatePickerResult>);
  protected readonly data = inject<DatePickerData>(DIALOG_DATA);
  private readonly sheets = inject(Sheets);
  protected readonly today = inject(Clock).today();
  protected readonly weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  protected readonly date = signal(this.data.date);
  protected readonly time = signal(this.data.time ?? '');
  protected readonly timeEnd = signal(this.data.timeEnd ?? '');
  protected readonly month = signal(this.startOfMonth(this.data.date || this.today));

  protected readonly quick = computed(() => {
    const inTwo = addDays(this.today, 2);
    return [
      { label: 'Today', date: this.today },
      { label: 'Tomorrow', date: addDays(this.today, 1) },
      { label: weekdayName(inTwo), date: inTwo },
      { label: 'This weekend', date: nextWeekday(this.today, 6, false) },
      { label: 'Next week', date: nextWeekday(this.today, 1) },
      { label: 'No date', date: '' },
    ];
  });

  protected readonly monthLabel = computed(() => {
    const first = parseLocalDate(this.month());
    return `${monthName(first.getMonth(), 'long')} ${first.getFullYear()}`;
  });

  protected readonly leading = computed(
    () => new Array<undefined>((parseLocalDate(this.month()).getDay() + 6) % 7),
  );

  protected readonly days = computed<Day[]>(() => {
    const first = parseLocalDate(this.month());
    const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return Array.from({ length: count }, (_, index) => {
      const date = addDays(this.month(), index);
      return { date, day: index + 1, past: date < this.today };
    });
  });

  protected readonly timeLabel = computed(
    () => timeRange(this.time(), this.timeEnd()) || 'Add time',
  );

  protected shiftMonth(by: number) {
    const first = parseLocalDate(this.month());
    this.month.set(localDate(new Date(first.getFullYear(), first.getMonth() + by, 1)));
  }

  protected async pickTime() {
    const result = await this.sheets.open<TimePickerResult, TimePickerData>(TimePicker, {
      time: this.time(),
      timeEnd: this.timeEnd(),
    }).closed;
    if (result) {
      this.time.set(result.time);
      this.timeEnd.set(result.timeEnd);
      if (result.time && !this.date()) {
        this.date.set(this.today);
      }
    }
  }

  protected done() {
    this.ref.close({
      date: this.date(),
      time: this.date() ? this.time() : '',
      timeEnd: this.date() ? this.timeEnd() : '',
    });
  }

  private startOfMonth(date: string) {
    return `${date.slice(0, 7)}-01`;
  }
}
