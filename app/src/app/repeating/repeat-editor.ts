import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Actions } from '../core/data/actions';
import { RepeatMode, Todo } from '../domain/models';
import { Draft, Repository } from '../core/data/repository';
import { Store } from '../core/data/store';
import { MoveTo, MoveToData } from '../shared/pickers/move-to';
import { Clock } from '../core/time/clock';
import { DetailRow } from '../shared/ui/detail-row';
import { ListLabel } from '../shared/ui/list-label';
import { Segmented } from '../shared/ui/segmented';
import { Sheets } from '../shared/ui/sheet';
import { Toasts } from '../shared/ui/toast';
import { repeatStatus, ROUGH_CHOICES, WEEK_CHOICES, WEEKDAY_ORDER } from '../domain/repeat-status';
import { StopRepeatResult, StopRepeatSheet } from './stop-repeat-sheet';

type Mode = Exclude<RepeatMode, 'none'>;
const WEEKDAY_LETTERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface RepeatEditorState {
  back?: string;
  title?: string;
  list?: string;
}

@Component({
  selector: 'app-repeat-editor',
  imports: [DetailRow, FormsModule, ListLabel, Segmented],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './repeat-editor.html',
  styleUrl: './repeat-editor.scss',
})
export class RepeatEditor {
  readonly id = input.required<string>();

  private readonly store = inject(Store);
  private readonly repository = inject(Repository);
  private readonly actions = inject(Actions);
  private readonly sheets = inject(Sheets);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly clock = inject(Clock);

  private readonly state = (history.state ?? {}) as RepeatEditorState;
  private readonly back = this.state.back ?? '/repeating';
  protected readonly isNew = computed(() => this.id() === 'new');
  protected readonly todo = computed(() =>
    this.store.todos().find((todo) => todo.id === this.id()),
  );
  protected readonly wasRepeating = computed(() => {
    const todo = this.todo();
    return !!todo && todo.repeat_mode !== 'none' && !!todo.repeat_mode;
  });

  protected readonly modes = [
    { value: 'rough' as Mode, label: 'Roughly' },
    { value: 'schedule' as Mode, label: 'On a schedule' },
  ];
  protected readonly roughChoices = ROUGH_CHOICES;
  protected readonly weekChoices = WEEK_CHOICES;
  protected readonly weekdays = WEEKDAY_ORDER.map((day) => ({ day, label: WEEKDAY_LETTERS[day] }));

  protected readonly title = signal(this.state.title ?? '');
  protected readonly mode = signal<Mode>('rough');
  protected readonly everyDays = signal(7);
  protected readonly everyWeeks = signal(1);
  protected readonly days = signal<number[]>([]);
  protected readonly list = signal(this.state.list ?? '');

  protected readonly listRecord = computed(() => this.store.list(this.list()));
  protected readonly lastDone = computed(() => {
    const todo = this.todo();
    if (!todo || !this.wasRepeating()) {
      return '';
    }
    const status = repeatStatus(todo, this.store.completions(), this.clock.today());
    if (!status.lastDone) {
      return 'Never';
    }
    return status.daysSince === 0
      ? 'Today'
      : status.daysSince === 1
        ? 'Yesterday'
        : `${status.daysSince} days ago`;
  });
  protected readonly canSave = computed(
    () => !!this.title().trim() && (this.mode() === 'rough' || this.days().length > 0),
  );

  constructor() {
    let loaded = false;
    effect(() => {
      const todo = this.todo();
      if (todo && !loaded) {
        loaded = true;
        untracked(() => this.load(todo));
      }
    });
  }

  protected toggleDay(day: number) {
    this.days.update((days) =>
      days.includes(day) ? days.filter((each) => each !== day) : [...days, day],
    );
  }

  protected async pickList() {
    const list = await this.sheets.open<string, MoveToData>(MoveTo, { current: this.list() })
      .closed;
    if (list !== undefined) {
      this.list.set(list);
    }
  }

  protected async doneToday() {
    const todo = this.todo();
    if (todo) {
      const undo = await this.actions.complete(todo);
      this.toasts.show({ title: `${todo.title} done today`, undo });
    }
  }

  protected async save() {
    if (!this.canSave()) {
      return;
    }
    const fields: Draft<'todos'> = {
      title: this.title().trim(),
      list: this.list(),
      inbox: false,
      repeat_mode: this.mode(),
      repeat_every_days: this.mode() === 'rough' ? this.everyDays() : 0,
      repeat_every_weeks: this.mode() === 'schedule' ? this.everyWeeks() : 0,
      repeat_weekdays: this.mode() === 'schedule' ? [...this.days()].sort() : null,
      date: '',
      time: '',
      time_end: '',
      is_event: false,
      done_at: '',
    };
    if (this.isNew()) {
      await this.repository.save('todos', fields);
    } else {
      await this.repository.save('todos', { ...fields, id: this.id() });
    }
    await this.router.navigateByUrl(this.back);
  }

  protected async stopRepeating() {
    const todo = this.todo();
    if (!todo) {
      return;
    }
    const result = await this.sheets.open<StopRepeatResult, Todo>(StopRepeatSheet, todo).closed;
    if (result) {
      await this.repository.save('todos', {
        id: todo.id,
        repeat_mode: 'none',
        repeat_every_days: 0,
        repeat_every_weeks: 0,
        repeat_weekdays: null,
        list: result.list,
        date: result.date,
        inbox: !result.list && !result.date,
      });
      await this.router.navigate(['/todo', todo.id], { state: { back: this.back } });
    }
  }

  protected async delete() {
    const todo = this.todo();
    if (todo) {
      await this.actions.delete('todos', todo);
    }
    await this.router.navigateByUrl(this.back);
  }

  protected cancel() {
    this.location.back();
  }

  private load(todo: Todo) {
    this.title.set(todo.title);
    this.list.set(todo.list);
    if (todo.repeat_mode === 'schedule') {
      this.mode.set('schedule');
      this.everyWeeks.set(todo.repeat_every_weeks || 1);
      this.days.set(todo.repeat_weekdays ?? []);
    } else if (todo.repeat_mode === 'rough') {
      this.everyDays.set(todo.repeat_every_days ?? 7);
    }
  }
}
