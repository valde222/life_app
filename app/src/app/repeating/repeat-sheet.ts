import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Store } from '../data/store';
import { Clock } from '../time/clock';
import { addDays, daysBetween, longDate, shortDate } from '../time/local-date';
import { Sheet } from '../ui/sheet';
import { completionDays, repeatStatus, ROUGH_CHOICES } from './repeat-status';

export type RepeatSheetResult = 'today' | 'yesterday' | 'edit';
const HISTORY = 4;

@Component({
  selector: 'app-repeat-sheet',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet>
      <div class="head">
        <div>
          <h2 class="t-sheet-title-small">{{ todo().title }}</h2>
          <div class="sub">{{ status().sub }}{{ listName() ? ', ' + listName() : '' }}</div>
        </div>
        <button type="button" class="edit" (click)="ref.close('edit')">Edit</button>
      </div>
      <div class="card big">
        <div class="count" [class.over]="status().overdue">
          <span class="number tabular">{{ doneToday() ? 'Today' : status().daysSince }}</span>
          @if (!doneToday()) {
            <span class="unit">{{ status().daysSince === 1 ? 'day since' : 'days since' }}</span>
          }
        </div>
        @if (status().target) {
          <div class="bar">
            <span [style.width.%]="progress()" [class.over]="status().overdue"></span>
          </div>
          <div class="target">{{ targetText() }}</div>
        }
      </div>
      @if (history().length) {
        <h3 class="eyebrow">Recently done</h3>
        <div class="options">
          @for (day of history(); track day) {
            <div class="option history">
              <span>{{ longDate(day) }}</span>
            </div>
          }
        </div>
        @if (average()) {
          <p class="average">{{ average() }}</p>
        }
      }
      @if (!doneToday()) {
        <button type="button" class="btn btn-primary" (click)="ref.close('today')">
          Done today
        </button>
        <button type="button" class="btn btn-secondary" (click)="ref.close('yesterday')">
          Did it yesterday
        </button>
      }
    </app-sheet>
  `,
  styles: `
    .head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
      padding: 0 var(--space-1);
      h2 {
        margin: 0;
      }
    }
    .sub {
      margin-top: 2px;
      font-size: 13px;
      color: var(--ink-2);
    }
    .edit {
      height: 36px;
      padding: 0 12px;
      border: 0;
      border-radius: var(--radius-chip);
      background: var(--surface);
      font-size: 14px;
      font-weight: 600;
    }
    .big {
      padding: var(--space-5);
    }
    .count {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
    }
    .number {
      font-size: 44px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .over .number {
      color: var(--overdue-fg);
    }
    .unit {
      font-size: 15px;
      color: var(--ink-2);
    }
    .bar {
      margin-top: var(--space-4);
      height: 8px;
      border-radius: var(--radius-tiny);
      background: var(--soft);
      overflow: hidden;
      span {
        display: block;
        height: 100%;
        border-radius: var(--radius-tiny);
        background: var(--accent);
      }
      .over {
        background: var(--overdue-icon);
      }
    }
    .target {
      margin-top: var(--space-2);
      font-size: 13px;
      color: var(--ink-2);
    }
    .history {
      min-height: 44px;
      font-size: 15px;
    }
    .average {
      margin: 0;
      padding: 0 var(--space-1);
      font-size: 13px;
      color: var(--ink-2);
    }
    .btn-primary {
      font-weight: 700;
    }
  `,
})
export class RepeatSheet {
  protected readonly ref = inject(DialogRef<RepeatSheetResult>);
  private readonly id = inject<string>(DIALOG_DATA);
  private readonly store = inject(Store);
  private readonly clock = inject(Clock);
  protected readonly longDate = longDate;

  protected readonly todo = computed(() => this.store.todos().find((todo) => todo.id === this.id)!);
  protected readonly status = computed(() =>
    repeatStatus(this.todo(), this.store.completions(), this.clock.today()),
  );
  protected readonly listName = computed(() => this.store.list(this.todo().list)?.name);
  protected readonly doneToday = computed(() => this.status().lastDone === this.clock.today());
  protected readonly progress = computed(
    () => Math.min(this.status().daysSince / this.status().target, 1) * 100,
  );
  protected readonly history = computed(() =>
    completionDays(this.todo(), this.store.completions()).slice(0, HISTORY),
  );

  protected readonly targetText = computed(() => {
    const todo = this.todo();
    if (todo.repeat_mode === 'schedule') {
      return this.status().nextDue ? `Next ${longDate(this.status().nextDue!)}` : '';
    }
    const unit =
      ROUGH_CHOICES.find((choice) => choice.days === todo.repeat_every_days)?.unit ??
      `${todo.repeat_every_days} days`;
    const due = this.status().lastDone
      ? addDays(this.status().lastDone!, todo.repeat_every_days)
      : '';
    return due ? `About ${unit}, due ${shortDate(due)}` : `About ${unit}`;
  });

  protected readonly average = computed(() => {
    const days = completionDays(this.todo(), this.store.completions());
    if (days.length < 3) {
      return '';
    }
    const gaps = days.slice(0, -1).map((day, index) => daysBetween(days[index + 1], day));
    return `Usually every ${Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length)} days`;
  });
}
