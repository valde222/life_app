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
import { Actions } from '../../core/data/actions';
import { Draft, EMPTY_RECORDS, Note, Todo } from '../../domain/models';
import { LinkActions } from '../../core/data/link-actions';
import { Store } from '../../core/data/store';
import { reminderLabel } from '../../shared/pickers/reminder-picker';
import { Clock } from '../../core/time/clock';
import { relativeDay } from '../../domain/time/local-date';
import { Checkbox } from '../../shared/ui/checkbox';
import { DetailRow } from '../../shared/ui/detail-row';
import { Icon } from '../../shared/ui/icon';
import { ListLabel } from '../../shared/ui/list-label';
import { Switch } from '../../shared/ui/switch';
import { timeRange } from '../../domain/time/time-range';
import { Pickers } from '../../shared/pickers/pickers';
import { backLabel } from '../../domain/back-labels';
import { TodoSteps } from './todo-steps';

export interface TodoDraftState {
  draft?: Draft<'todos'>;
  back?: string;
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
  private readonly actions = inject(Actions);
  private readonly links = inject(LinkActions);
  private readonly pickers = inject(Pickers);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly clock = inject(Clock);

  private readonly state = (history.state ?? {}) as TodoDraftState;
  protected readonly back = this.state.back ?? '/';
  protected readonly backLabel = computed(() =>
    backLabel(this.back, (id) => this.store.list(id)?.name),
  );

  protected readonly isNew = computed(() => this.id() === 'new');
  private readonly saved = computed(() => this.store.todos().find((todo) => todo.id === this.id()));
  protected readonly draft = signal<Todo>({ ...EMPTY_RECORDS.todos, ...this.state.draft });
  protected readonly todo = computed(() => (this.isNew() ? this.draft() : this.saved()));

  protected readonly steps = new TodoSteps(this.id, this.isNew);

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
    return todo ? timeRange(todo.time, todo.time_end) : '';
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
    await this.actions.updateTodo(this.id(), changes);
  }

  protected saveTitle() {
    const title = this.title().trim();
    if (!this.isNew() && title && title !== this.todo()?.title) {
      void this.update({ title });
    }
  }

  protected async pickList() {
    const list = await this.pickers.list(this.todo()?.list ?? '');
    if (list !== undefined) {
      await this.update({ list, inbox: !list && !this.todo()?.date });
    }
  }

  protected async pickDate() {
    const todo = this.todo();
    if (!todo) {
      return;
    }
    const result = await this.pickers.date({
      date: todo.date,
      time: todo.time,
      timeEnd: todo.time_end,
    });
    if (result) {
      await this.update({ date: result.date, time: result.time, time_end: result.timeEnd });
    }
  }

  protected async pickTime() {
    const todo = this.todo();
    if (!todo) {
      return;
    }
    const result = await this.pickers.time({
      time: todo.time,
      timeEnd: todo.time_end,
    });
    if (result) {
      await this.update({
        time: result.time,
        time_end: result.timeEnd,
        date: result.time && !todo.date ? this.clock.today() : todo.date,
      });
    }
  }

  protected async pickReminder() {
    const todo = this.todo();
    if (!todo) {
      return;
    }
    const reminder = await this.pickers.reminder({
      date: todo.date,
      time: todo.time,
      reminder: todo.reminder,
    });
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
    void this.update({ is_event: isEvent });
  }

  protected async toggleDone() {
    const todo = this.todo();
    if (todo) {
      await (todo.done_at ? this.actions.untick(todo) : this.actions.tick(todo));
    }
  }

  protected async writeNote() {
    const note = await this.actions.startNoteFor({ id: this.id(), list: this.todo()?.list ?? '' });
    await this.router.navigate(['/note', note.id], { state: { back: `/todo/${this.id()}` } });
  }

  protected async link() {
    const linked = this.linkedNotes().map((note) => note.id);
    const result = await this.pickers.links({
      onlyNotes: true,
      list: this.todo()?.list ?? '',
      notes: linked,
    });
    if (result) {
      await this.links.setNotesOfTodo(this.id(), new Set(result.notes));
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
      await this.steps.saveDrafts(todo.id);
    }
    await this.router.navigateByUrl(this.back);
  }

  protected cancel() {
    this.location.back();
  }

  protected async delete() {
    const todo = this.todo();
    if (todo) {
      await this.actions.delete('todos', todo);
      await this.router.navigateByUrl(this.back);
    }
  }
}
