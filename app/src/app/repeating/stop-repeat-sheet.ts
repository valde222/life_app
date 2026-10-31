import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Todo } from '../domain/models';
import { Store } from '../data/store';
import { DatePicker, DatePickerData, DatePickerResult } from '../pickers/date-picker';
import { MoveTo, MoveToData } from '../pickers/move-to';
import { Clock } from '../time/clock';
import { addDays, longDate, nextWeekday } from '../domain/time/local-date';
import { Sheet, Sheets } from '../ui/sheet';

export interface StopRepeatResult {
  list: string;
  date: string;
}

const QUICK_LISTS = 2;

@Component({
  selector: 'app-stop-repeat-sheet',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet heading="Make it a todo.">
      <div class="card name">{{ todo.title }}</div>
      <h3 class="eyebrow">List</h3>
      <div class="chips">
        <button type="button" class="chip" [class.on]="!list()" (click)="list.set('')">
          Inbox
        </button>
        @for (each of lists(); track each.id) {
          <button
            type="button"
            class="chip"
            [class.on]="each.id === list()"
            (click)="list.set(each.id)"
          >
            {{ each.name }}
          </button>
        }
        <button type="button" class="chip" (click)="moreLists()">More…</button>
      </div>
      <h3 class="eyebrow">Date</h3>
      <div class="chips">
        @for (choice of dates(); track choice.label) {
          <button
            type="button"
            class="chip"
            [class.on]="choice.date === date()"
            (click)="date.set(choice.date)"
          >
            {{ choice.label }}
          </button>
        }
        <button type="button" class="chip" [class.on]="picked()" (click)="pickDate()">
          {{ picked() ? pickedLabel() : 'Pick a date' }}
        </button>
      </div>
      <button
        type="button"
        class="btn btn-primary"
        (click)="ref.close({ list: list(), date: date() })"
      >
        Make todo
      </button>
      <button type="button" class="btn btn-secondary" (click)="ref.close()">Keep repeating</button>
    </app-sheet>
  `,
  styles: `
    .name {
      padding: 12px var(--space-4);
      font-size: 17px;
      font-weight: 600;
    }
    .eyebrow {
      margin-top: var(--space-1);
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip {
      height: 38px;
      font-size: 15px;
    }
    .btn-primary {
      margin-top: var(--space-2);
      font-weight: 700;
    }
  `,
})
export class StopRepeatSheet {
  protected readonly ref = inject(DialogRef<StopRepeatResult>);
  protected readonly todo = inject<Todo>(DIALOG_DATA);
  private readonly store = inject(Store);
  private readonly sheets = inject(Sheets);
  private readonly today = inject(Clock).today();

  protected readonly list = signal(this.todo.list);
  protected readonly date = signal('');
  protected readonly lists = computed(() => {
    const own = this.store.list(this.todo.list);
    const others = this.store.openLists().filter((list) => list.id !== own?.id);
    return [...(own ? [own] : []), ...others].slice(0, QUICK_LISTS);
  });
  protected readonly dates = computed(() => [
    { label: 'No date', date: '' },
    { label: 'Today', date: this.today },
    { label: 'Tomorrow', date: addDays(this.today, 1) },
    { label: 'This weekend', date: nextWeekday(this.today, 6, false) },
  ]);
  protected readonly picked = computed(
    () => !!this.date() && !this.dates().some((choice) => choice.date === this.date()),
  );
  protected readonly pickedLabel = computed(() => longDate(this.date()));

  protected async moreLists() {
    const list = await this.sheets.open<string, MoveToData>(MoveTo, { current: this.list() })
      .closed;
    if (list !== undefined) {
      this.list.set(list);
    }
  }

  protected async pickDate() {
    const result = await this.sheets.open<DatePickerResult, DatePickerData>(DatePicker, {
      date: this.date(),
      withTime: false,
    }).closed;
    if (result) {
      this.date.set(result.date);
    }
  }
}
