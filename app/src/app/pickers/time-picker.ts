import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Segmented } from '../ui/segmented';
import { Sheet } from '../ui/sheet';

export interface TimePickerData {
  time: string;
  timeEnd: string;
}

export interface TimePickerResult {
  time: string;
  timeEnd: string;
}

type Mode = 'at' | 'range';
type Editing = 'from' | 'to';

const PRESETS = [
  { name: 'Morning', time: '09:00' },
  { name: 'Noon', time: '12:00' },
  { name: 'Afternoon', time: '15:00' },
  { name: 'Evening', time: '18:00' },
];

export function shiftTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const total = (((hours * 60 + mins + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function wheel(selected: number, step: number, size: number) {
  return [-2, -1, 0, 1, 2].map((offset) => (((selected + offset * step) % size) + size) % size);
}

const pad = (value: number) => String(value).padStart(2, '0');

@Component({
  selector: 'app-time-picker',
  imports: [Segmented, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet heading="Time.">
      <app-segmented [segments]="modes" [(value)]="mode" />
      @if (mode() === 'range') {
        <div class="ends">
          <button
            type="button"
            class="end"
            [class.on]="editing() === 'from'"
            (click)="editing.set('from')"
          >
            <span class="end-label">From</span><span class="end-time tabular">{{ from() }}</span>
          </button>
          <button
            type="button"
            class="end"
            [class.on]="editing() === 'to'"
            (click)="editing.set('to')"
          >
            <span class="end-label">To</span><span class="end-time tabular">{{ to() }}</span>
          </button>
        </div>
      } @else {
        <div class="presets">
          @for (preset of presets; track preset.name) {
            <button
              type="button"
              class="preset"
              [class.on]="preset.time === from()"
              [attr.aria-pressed]="preset.time === from()"
              (click)="from.set(preset.time)"
            >
              <span class="preset-name">{{ preset.name }}</span>
              <span class="preset-time tabular">{{ preset.time }}</span>
            </button>
          }
        </div>
      }
      <div class="card wheels">
        <div class="wheel" (wheel)="scroll($event, 60)">
          @for (hour of hours(); track $index) {
            <button
              type="button"
              class="tabular"
              [class.on]="$index === 2"
              (click)="setPart(hour, 'hour')"
            >
              {{ pad(hour) }}
            </button>
          }
        </div>
        <span class="colon">:</span>
        <div class="wheel" (wheel)="scroll($event, 5)">
          @for (minute of minutes(); track $index) {
            <button
              type="button"
              class="tabular"
              [class.on]="$index === 2"
              (click)="setPart(minute, 'minute')"
            >
              {{ pad(minute) }}
            </button>
          }
        </div>
      </div>
      <button type="button" class="btn btn-primary" (click)="set()">{{ setLabel() }}</button>
      <button
        type="button"
        class="btn btn-secondary quiet-cancel"
        (click)="ref.close({ time: '', timeEnd: '' })"
      >
        No time
      </button>
    </app-sheet>
  `,
  styles: `
    .ends,
    .presets {
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .presets {
      gap: 6px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .end,
    .preset {
      border: 0;
      border-radius: var(--radius-input);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    .end {
      height: 64px;
    }
    .preset {
      height: 56px;
    }
    .end.on,
    .preset.on {
      box-shadow: inset 0 0 0 2px var(--accent);
    }
    .end-label,
    .preset-name {
      font-size: 12px;
      font-weight: 600;
      color: var(--ink-2);
    }
    .end-time {
      font-size: 22px;
      font-weight: 700;
    }
    .preset-time {
      font-size: 15px;
      font-weight: 700;
    }
    .wheels {
      padding: 8px 12px;
      display: grid;
      grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr);
      align-items: center;
    }
    .wheel {
      display: grid;
      grid-template-rows: repeat(5, 40px);
      gap: 2px;
    }
    .wheel button {
      border: 0;
      border-radius: var(--radius-control);
      background: transparent;
      font-size: 18px;
      font-weight: 500;
      color: var(--ink-2);
    }
    .wheel button.on {
      background: var(--soft);
      color: var(--ink);
      font-size: 22px;
      font-weight: 700;
    }
    .colon {
      text-align: center;
      font-size: 24px;
      font-weight: 700;
    }
    .quiet-cancel {
      height: 48px;
      border-radius: var(--radius-input);
      font-size: 15px;
    }
  `,
})
export class TimePicker {
  protected readonly ref = inject(DialogRef<TimePickerResult>);
  private readonly data = inject<TimePickerData>(DIALOG_DATA);
  protected readonly presets = PRESETS;
  protected readonly pad = pad;
  protected readonly modes = [
    { value: 'at' as Mode, label: 'At a time' },
    { value: 'range' as Mode, label: 'From – to' },
  ];

  protected readonly mode = signal<Mode>(this.data.timeEnd ? 'range' : 'at');
  protected readonly editing = signal<Editing>('from');
  protected readonly from = signal(this.data.time || '18:30');
  protected readonly to = signal(this.data.timeEnd || shiftTime(this.data.time || '18:30', 60));

  private readonly editedTime = computed(() =>
    this.mode() === 'range' && this.editing() === 'to' ? this.to() : this.from(),
  );
  protected readonly hours = computed(() => wheel(Number(this.editedTime().slice(0, 2)), 1, 24));
  protected readonly minutes = computed(() =>
    wheel((Math.round(Number(this.editedTime().slice(3)) / 5) * 5) % 60, 5, 60),
  );
  protected readonly setLabel = computed(() =>
    this.mode() === 'range' ? `Set ${this.from()}–${this.to()}` : `Set ${this.from()}`,
  );

  protected setPart(value: number, part: 'hour' | 'minute') {
    const [hours, minutes] = this.editedTime().split(':');
    this.write(part === 'hour' ? `${pad(value)}:${minutes}` : `${hours}:${pad(value)}`);
  }

  protected scroll(event: WheelEvent, step: number) {
    event.preventDefault();
    this.write(shiftTime(this.editedTime(), Math.sign(event.deltaY) * step));
  }

  protected set() {
    this.ref.close({ time: this.from(), timeEnd: this.mode() === 'range' ? this.to() : '' });
  }

  private write(time: string) {
    if (this.mode() === 'range' && this.editing() === 'to') {
      this.to.set(time);
    } else {
      this.from.set(time);
    }
  }
}
