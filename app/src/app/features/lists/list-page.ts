import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Actions } from '../../core/data/actions';
import { Note, Todo } from '../../domain/models';
import { Store } from '../../core/data/store';
import { CaptureData, CaptureSheet } from '../../shared/capture/capture-sheet';
import { Clock } from '../../core/time/clock';
import { relativeDay, shortDate, weekdayName, daysBetween } from '../../domain/time/local-date';
import { EmptyState } from '../../shared/ui/empty-state';
import { Icon } from '../../shared/ui/icon';
import { Segmented } from '../../shared/ui/segmented';
import { Sheets } from '../../shared/ui/sheet';
import { SwipeRow } from '../../shared/ui/swipe-row';
import { TodoRow } from '../../shared/ui/todo-row';
import { isFiledNote } from '../../domain/list-counts';
import { ItemActions } from './item-actions';
import { Toasts } from '../../core/toasts/toasts';
import { dayOfTimestamp } from '../../domain/time/timestamps';

type Tab = 'todos' | 'notes';

@Component({
  selector: 'app-list-page',
  imports: [EmptyState, Icon, RouterLink, Segmented, SwipeRow, TodoRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './list-page.html',
  styleUrl: './list-page.scss',
})
export class ListPage {
  readonly id = input.required<string>();

  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly itemActions = inject(ItemActions);
  private readonly sheets = inject(Sheets);
  private readonly toasts = inject(Toasts);
  private readonly clock = inject(Clock);

  protected readonly list = computed(() => this.store.list(this.id()));
  protected readonly group = computed(() => this.store.group(this.list()?.group ?? ''));
  protected readonly tab = signal<Tab>('todos');

  private readonly todos = computed(() =>
    this.store
      .todos()
      .filter(
        (todo) =>
          todo.list === this.id() &&
          !todo.archived_at &&
          todo.repeat_mode !== 'rough' &&
          todo.repeat_mode !== 'schedule',
      ),
  );
  protected readonly open = computed(() =>
    this.todos()
      .filter((todo) => !todo.done_at)
      .sort(
        (a, b) =>
          (a.date || '9999').localeCompare(b.date || '9999') ||
          (a.created ?? '').localeCompare(b.created ?? ''),
      ),
  );
  protected readonly done = computed(() =>
    this.todos()
      .filter((todo) => todo.done_at)
      .sort((a, b) => b.done_at.localeCompare(a.done_at)),
  );
  protected readonly notes = computed(() =>
    this.store
      .notes()
      .filter((note) => note.list === this.id() && isFiledNote(note))
      .sort((a, b) => b.changed_at - a.changed_at),
  );
  protected readonly tabs = computed(() => [
    { value: 'todos', label: 'Todos', count: this.open().length },
    { value: 'notes', label: 'Notes', count: this.notes().length },
  ]);
  protected readonly showDone = signal(false);
  protected readonly back = computed(() => `/lists/${this.id()}`);

  protected readonly todoSwipe = {
    right: { label: 'Today', icon: 'sun' as const },
    left: { icon: 'more' as const },
  };
  protected readonly noteSwipe = { icon: 'more' as const };

  protected trailing(todo: Todo) {
    if (!todo.date) {
      return '';
    }
    const offset = daysBetween(this.clock.today(), todo.date);
    if (offset > 1 && offset < 7) {
      return weekdayName(todo.date);
    }
    return offset >= 7 ? shortDate(todo.date) : relativeDay(todo.date, this.clock.today());
  }

  protected noteDate(note: Note) {
    const day = note.created ? dayOfTimestamp(note.created) : this.clock.today();
    return day === this.clock.today() ? 'Today' : shortDate(day);
  }

  protected firstLine(note: Note) {
    return (
      note.body
        .split('\n')
        .find((line) => line.trim())
        ?.replace(/^#+\s*/, '') ?? ''
    );
  }

  protected async tick(todo: Todo) {
    const undo = await this.actions.tick(todo);
    this.toasts.show({ title: `${todo.title} done`, undo });
  }

  protected async untick(todo: Todo) {
    await this.actions.untick(todo);
  }

  protected putOnToday(todo: Todo) {
    return this.itemActions.putOnToday(todo);
  }

  protected todoActions(todo: Todo) {
    return this.itemActions.forTodo(todo, this.back());
  }

  protected noteActions(note: Note) {
    return this.itemActions.forNote(note);
  }

  protected add() {
    this.sheets.open<unknown, CaptureData>(
      CaptureSheet,
      { kind: this.tab() === 'notes' ? 'note' : 'todo', list: this.id(), back: this.back() },
      { autoFocus: '.what' },
    );
  }
}
