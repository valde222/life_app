import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Actions } from '../../core/data/actions';
import { Store } from '../../core/data/store';
import { DatePicker, DatePickerData, DatePickerResult } from '../pickers/date-picker';
import { MoveTo, MoveToData } from '../pickers/move-to';
import { Clock } from '../../core/time/clock';
import { parseDayWord } from '../../domain/time/day-words';
import { longDate } from '../../domain/time/local-date';
import { Icon } from '../ui/icon';
import { Segmented } from '../ui/segmented';
import { Sheet, Sheets } from '../ui/sheet';
import { Toasts } from '../../core/toasts/toasts';

export type CaptureKind = 'todo' | 'note';

export interface CaptureData {
  kind?: CaptureKind;
  list?: string;
  back?: string;
}

@Component({
  selector: 'app-capture-sheet',
  imports: [FormsModule, Icon, Segmented, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './capture-sheet.html',
  host: { '(keydown)': 'onKey($event)' },
  styleUrl: './capture-sheet.scss',
})
export class CaptureSheet {
  private readonly ref = inject(DialogRef, { optional: true });
  private readonly data = inject<CaptureData>(DIALOG_DATA, { optional: true }) ?? {};
  readonly done = output();
  private readonly actions = inject(Actions);
  private readonly store = inject(Store);
  private readonly sheets = inject(Sheets);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly clock = inject(Clock);

  protected readonly kinds = [
    { value: 'todo' as CaptureKind, label: 'Todo' },
    { value: 'note' as CaptureKind, label: 'Note' },
  ];
  protected readonly kind = signal<CaptureKind>(this.data.kind ?? 'todo');
  protected readonly text = signal('');
  protected readonly list = signal(this.data.list ?? '');
  private readonly pickedDate = signal<string | null>(null);
  private readonly dateDismissed = signal(false);

  private readonly parsed = computed(() =>
    this.kind() === 'todo' && !this.dateDismissed()
      ? parseDayWord(this.text().trim(), this.clock.today())
      : null,
  );
  protected readonly date = computed(() => this.pickedDate() ?? this.parsed()?.date ?? '');
  protected readonly title = computed(() =>
    this.pickedDate() === null && this.parsed() ? this.parsed()!.title : this.text().trim(),
  );
  protected readonly dateLabel = computed(() => (this.date() ? longDate(this.date()) : ''));
  protected readonly listName = computed(() => this.store.list(this.list())?.name ?? 'Inbox');

  protected finish() {
    this.ref?.close();
    this.done.emit();
  }

  protected onKey(event: KeyboardEvent) {
    if (event.ctrlKey && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.addDetails();
    } else if (event.key === 'Escape' && !this.ref) {
      this.finish();
    }
  }

  protected async pickDate() {
    const result = await this.sheets.open<DatePickerResult, DatePickerData>(DatePicker, {
      date: this.date(),
      withTime: false,
    }).closed;
    if (result) {
      this.pickedDate.set(result.date);
    }
  }

  protected clearDate() {
    this.pickedDate.set(null);
    this.dateDismissed.set(true);
  }

  protected async pickList() {
    const list = await this.sheets.open<string, MoveToData>(MoveTo, { current: this.list() })
      .closed;
    if (list !== undefined) {
      this.list.set(list);
    }
  }

  protected async save() {
    const title = this.title();
    if (!title) {
      return;
    }
    if (this.kind() === 'todo') {
      await this.actions.createTodo({
        title,
        date: this.date(),
        list: this.list(),
        inbox: !this.list(),
      });
    } else {
      await this.actions.createNote({ title, list: this.list(), inbox: !this.list() });
    }
    this.finish();
    if (!this.list()) {
      this.toasts.show({ title: 'In the Inbox' });
    }
  }

  protected async addDetails() {
    this.finish();
    const back = this.data.back ?? this.router.url;
    if (this.kind() === 'todo') {
      await this.router.navigate(['/todo/new'], {
        state: { draft: { title: this.title(), date: this.date(), list: this.list() }, back },
      });
    } else {
      await this.router.navigate(['/note/new'], {
        state: { mode: 'new', draft: { title: this.title(), list: this.list() }, back },
      });
    }
  }
}
