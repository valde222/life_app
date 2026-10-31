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
import { Router, RouterLink } from '@angular/router';
import { Actions } from '../data/actions';
import { EMPTY_RECORDS, Note, Step, Todo } from '../domain/models';
import { Draft, Repository } from '../data/repository';
import { Store } from '../data/store';
import { DatePicker, DatePickerData, DatePickerResult } from '../pickers/date-picker';
import { MoveTo, MoveToData } from '../pickers/move-to';
import { reminderLabel, ReminderPicker, ReminderPickerData } from '../pickers/reminder-picker';
import { TimePicker, TimePickerData, TimePickerResult } from '../pickers/time-picker';
import { LinkPicker, LinkPickerData, LinkPickerResult } from '../note/link-picker';
import { Clock } from '../time/clock';
import { relativeDay } from '../domain/time/local-date';
import { Checkbox } from '../ui/checkbox';
import { DetailRow } from '../ui/detail-row';
import { Icon } from '../ui/icon';
import { ListLabel } from '../ui/list-label';
import { Sheets } from '../ui/sheet';
import { Switch } from '../ui/switch';

export interface TodoDraftState {
  draft?: Draft<'todos'>;
  back?: string;
}

interface DraftStep {
  id?: string;
  text: string;
  done: boolean;
}

@Component({
  selector: 'app-todo-editor',
  imports: [Checkbox, DetailRow, FormsModule, Icon, ListLabel, RouterLink, Switch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './todo-editor.html',
  styleUrl: './todo-editor.scss',
  host: { '[class.new]': 'isNew()' },
})
export class TodoEditor {
  readonly id = input.required<string>();

  private readonly store = inject(Store);
  private readonly repository = inject(Repository);
  private readonly actions = inject(Actions);
  private readonly sheets = inject(Sheets);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly clock = inject(Clock);

  private readonly state = (history.state ?? {}) as TodoDraftState;
  protected readonly back = this.state.back ?? '/';
  protected readonly backLabel = this.backName(this.back);

  protected readonly isNew = computed(() => this.id() === 'new');
  private readonly saved = computed(() => this.store.todos().find((todo) => todo.id === this.id()));
  protected readonly draft = signal<Todo>({ ...EMPTY_RECORDS.todos, ...this.state.draft });
  protected readonly todo = computed(() => (this.isNew() ? this.draft() : this.saved()));

  private readonly savedSteps = computed(() =>
    this.store
      .steps()
      .filter((step) => step.todo === this.id())
      .sort((a, b) => a.order - b.order),
  );
  protected readonly draftSteps = signal<DraftStep[]>([]);
  protected readonly steps = computed<DraftStep[]>(() =>
    this.isNew() ? this.draftSteps() : this.savedSteps(),
  );
  protected readonly doneSteps = computed(() => this.steps().filter((step) => step.done).length);
  protected readonly newStep = signal('');

  protected readonly linkedNotes = computed<Note[]>(() =>
    this.store.notes().filter((note) => note.todos?.includes(this.id())),
  );

  protected readonly list = computed(() => this.store.list(this.todo()?.list ?? ''));
  protected readonly dateLabel = computed(() => {
    const date = this.todo()?.date;
    return date ? relativeDay(date, this.clock.today()) : '';
  });
  protected readonly timeLabel = computed(() => {
    const todo = this.todo();
    return todo?.time ? (todo.time_end ? `${todo.time}–${todo.time_end}` : todo.time) : '';
  });
  protected readonly reminderText = computed(() => {
    const todo = this.todo();
    return todo ? reminderLabel(todo.reminder, todo.date, todo.time) : '';
  });
  protected readonly heading = computed(() => (this.todo()?.is_event ? 'New event' : 'New todo'));

  protected readonly title = signal('');

  constructor() {
    effect(() => {
      const todo = this.todo();
      untracked(() => {
        if (todo && todo.title !== this.title()) {
          this.title.set(todo.title);
        }
      });
    });
  }

  protected async update(changes: Draft<'todos'>) {
    if (this.isNew()) {
      this.draft.update((draft) => ({ ...draft, ...changes }));
      return;
    }
    await this.repository.save('todos', { ...changes, id: this.id() });
  }

  protected saveTitle() {
    const title = this.title().trim();
    if (!this.isNew() && title && title !== this.todo()?.title) {
      this.update({ title });
    }
  }

  protected async pickList() {
    const list = await this.sheets.open<string, MoveToData>(MoveTo, {
      current: this.todo()?.list ?? '',
    }).closed;
    if (list !== undefined) {
      await this.update({ list, inbox: !list && !this.todo()?.date });
    }
  }

  protected async pickDate() {
    const todo = this.todo()!;
    const result = await this.sheets.open<DatePickerResult, DatePickerData>(DatePicker, {
      date: todo.date,
      time: todo.time,
      timeEnd: todo.time_end,
    }).closed;
    if (result) {
      await this.update({ date: result.date, time: result.time, time_end: result.timeEnd });
    }
  }

  protected async pickTime() {
    const todo = this.todo()!;
    const result = await this.sheets.open<TimePickerResult, TimePickerData>(TimePicker, {
      time: todo.time,
      timeEnd: todo.time_end,
    }).closed;
    if (result) {
      await this.update({
        time: result.time,
        time_end: result.timeEnd,
        date: result.time && !todo.date ? this.clock.today() : todo.date,
      });
    }
  }

  protected async pickReminder() {
    const todo = this.todo()!;
    const reminder = await this.sheets.open<string, ReminderPickerData>(ReminderPicker, {
      date: todo.date,
      time: todo.time,
      reminder: todo.reminder,
    }).closed;
    if (reminder !== undefined) {
      await this.update({ reminder });
    }
  }

  protected async repeat() {
    if (this.isNew()) {
      const draft = this.draft();
      await this.router.navigate(['/repeat/new'], {
        state: { back: this.back, title: this.title(), list: draft.list },
      });
      return;
    }
    this.saveTitle();
    await this.router.navigate(['/repeat', this.id()], { state: { back: this.back } });
  }

  protected setEvent(isEvent: boolean) {
    this.update({ is_event: isEvent });
  }

  protected async toggleDone() {
    const todo = this.todo()!;
    await (todo.done_at ? this.actions.untick(todo) : this.actions.tick(todo));
  }

  protected async addStep() {
    const text = this.newStep().trim();
    if (!text) {
      return;
    }
    this.newStep.set('');
    if (this.isNew()) {
      this.draftSteps.update((steps) => [...steps, { text, done: false }]);
      return;
    }
    await this.repository.save('steps', { todo: this.id(), text, order: this.steps().length });
  }

  protected async toggleStep(step: DraftStep, index: number) {
    if (this.isNew()) {
      this.draftSteps.update((steps) =>
        steps.map((each, i) => (i === index ? { ...each, done: !each.done } : each)),
      );
      return;
    }
    await this.repository.save('steps', { id: step.id, done: !step.done });
  }

  protected async removeStep(step: DraftStep, index: number) {
    if (this.isNew()) {
      this.draftSteps.update((steps) => steps.filter((_, i) => i !== index));
      return;
    }
    await this.repository.remove('steps', step.id!);
  }

  protected async writeNote() {
    const note = await this.actions.createNote({
      title: '',
      list: this.todo()?.list ?? '',
      todos: [this.id()],
      inbox: false,
    });
    await this.router.navigate(['/note', note.id], { state: { back: `/todo/${this.id()}` } });
  }

  protected async link() {
    const linked = this.linkedNotes().map((note) => note.id);
    const result = await this.sheets.open<LinkPickerResult, LinkPickerData>(
      LinkPicker,
      { onlyNotes: true, list: this.todo()?.list ?? '', notes: linked },
      { panelClass: ['sheet-panel', 'sheet-tall'] },
    ).closed;
    if (!result) {
      return;
    }
    const chosen = new Set(result.notes);
    for (const note of this.store.notes()) {
      const has: boolean | undefined = note.todos?.includes(this.id());
      if (chosen.has(note.id) !== (has === true)) {
        const todos = has
          ? note.todos.filter((todo) => todo !== this.id())
          : [...(note.todos ?? []), this.id()];
        await this.repository.save('notes', { id: note.id, todos });
      }
    }
  }

  protected async save() {
    const title = this.title().trim();
    if (!title) {
      return;
    }
    const draft = this.draft();
    const todo = await this.actions.createTodo({
      ...draft,
      id: undefined,
      title,
      inbox: !draft.list && !draft.date,
    });
    if (!draft.is_event) {
      for (const [order, step] of this.draftSteps().entries()) {
        await this.repository.save('steps', {
          todo: todo.id,
          text: step.text,
          done: step.done,
          order,
        });
      }
    }
    await this.router.navigateByUrl(this.back);
  }

  protected cancel() {
    this.location.back();
  }

  protected async delete() {
    const todo = this.todo()!;
    await this.actions.delete('todos', todo);
    await this.router.navigateByUrl(this.back);
  }

  protected trackStep(index: number, step: DraftStep | Step) {
    return step.id ?? index;
  }

  private backName(path: string) {
    const names: Record<string, string> = {
      '/': 'Today',
      '/inbox': 'Inbox',
      '/lists': 'Lists',
      '/agenda': 'Agenda',
    };
    return names[path] ?? 'Back';
  }
}
