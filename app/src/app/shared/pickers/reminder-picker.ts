import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { pocketBaseTimestamp } from '../../domain/ids';
import { startOf } from '../../domain/time/until';
import { Sheet } from '../ui/sheet';

export interface ReminderPickerData {
  date: string;
  time: string;
  reminder: string;
}

interface ReminderOption {
  label: string;
  at: Date | null;
}

const MORNING = '08:00';

export function reminderOptions(date: string, time: string): ReminderOption[] {
  const options: ReminderOption[] = [{ label: 'Off', at: null }];
  if (date && time) {
    const start = startOf(date, time);
    options.push(
      { label: 'At the time', at: start },
      { label: '10 minutes before', at: new Date(start.getTime() - 10 * 60_000) },
      { label: '1 hour before', at: new Date(start.getTime() - 60 * 60_000) },
    );
  }
  if (date) {
    options.push({ label: 'Morning of', at: startOf(date, MORNING) });
  }
  return options;
}

export function reminderLabel(reminder: string, date: string, time: string): string {
  if (!reminder) {
    return '';
  }
  const at = new Date(reminder.replace(' ', 'T')).getTime();
  const match = reminderOptions(date, time).find((option) => option.at?.getTime() === at);
  return match?.label ?? clock(new Date(at));
}

const clock = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

@Component({
  selector: 'app-reminder-picker',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet heading="Remind me.">
      <div class="options" role="radiogroup">
        @for (option of options(); track option.label) {
          <button
            type="button"
            class="option"
            role="radio"
            [attr.aria-checked]="option.label === chosen()"
            (click)="chosen.set(option.label)"
          >
            <span class="name">{{ option.label }}</span>
            @if (option.at) {
              <span class="at tabular">{{ clock(option.at) }}</span>
            }
            <span class="radio" [class.on]="option.label === chosen()"></span>
          </button>
        }
      </div>
      <button type="button" class="btn btn-primary" (click)="done()">Done</button>
    </app-sheet>
  `,
  styles: `
    .name {
      flex: 1;
      font-size: 16px;
    }
    .at {
      font-size: 13px;
      color: var(--muted);
    }
    .radio {
      width: 20px;
      height: 20px;
      border-radius: 10px;
      border: 2px solid var(--control);
      flex-shrink: 0;
    }
    .radio.on {
      border: 6px solid var(--accent);
    }
  `,
})
export class ReminderPicker {
  private readonly ref = inject(DialogRef<string>);
  private readonly data = inject<ReminderPickerData>(DIALOG_DATA);
  protected readonly clock = clock;
  protected readonly options = computed(() => reminderOptions(this.data.date, this.data.time));
  protected readonly chosen = signal(
    reminderLabel(this.data.reminder, this.data.date, this.data.time) || 'Off',
  );

  protected done() {
    const option = this.options().find((candidate) => candidate.label === this.chosen());
    this.ref.close(option?.at ? pocketBaseTimestamp(option.at) : '');
  }
}
