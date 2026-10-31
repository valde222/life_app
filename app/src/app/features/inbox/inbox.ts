import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Actions, Undo } from '../../core/data/actions';
import { Note, Todo } from '../../domain/models';
import { Store } from '../../core/data/store';
import { DatePicker, DatePickerData, DatePickerResult } from '../../shared/pickers/date-picker';
import { MoveTo, MoveToData } from '../../shared/pickers/move-to';
import { Clock } from '../../core/time/clock';
import { EmptyState } from '../../shared/ui/empty-state';
import { Icon } from '../../shared/ui/icon';
import { listColourStyle } from '../../shared/ui/list-colours';
import { Sheets } from '../../shared/ui/sheet';
import { SwipeRow } from '../../shared/ui/swipe-row';
import { Toasts } from '../../shared/ui/toast';
import { inboxSections, InboxItem } from '../../domain/inbox-items';
import { isTyping } from '../../shared/ui/keyboard';

const QUICK_LISTS = 4;

@Component({
  selector: 'app-inbox',
  imports: [EmptyState, Icon, RouterLink, SwipeRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inbox.html',
  host: { '(document:keydown)': 'onKey($event)' },
  styleUrl: './inbox.scss',
})
export class Inbox {
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly toasts = inject(Toasts);
  private readonly sheets = inject(Sheets);
  private readonly router = inject(Router);
  private readonly clock = inject(Clock);

  protected readonly sections = computed(() =>
    inboxSections(this.store.inboxTodos(), this.store.inboxNotes(), this.clock.today()),
  );
  protected readonly open = signal<string | null>(null);
  protected readonly focused = signal(-1);
  private readonly flat = computed(() => this.sections().flatMap((section) => section.items));
  protected readonly quickLists = computed(() => this.store.openLists().slice(0, QUICK_LISTS));
  protected readonly swatch = listColourStyle;

  protected readonly todoSwipe = {
    right: { label: 'Today', icon: 'sun' as const },
    left: { label: 'Move to', icon: 'lists' as const },
  };
  protected readonly noteSwipe = {
    right: { label: 'Keep', icon: 'check' as const },
    left: { label: 'Archive', icon: 'archive' as const, quiet: true },
  };

  protected onKey(event: KeyboardEvent) {
    if (isTyping(event.target) || event.ctrlKey || event.metaKey || this.sheets.anyOpen()) {
      return;
    }
    const items = this.flat();
    const item = items[this.focused()];
    const key = event.key.toLowerCase();
    if (key === 'arrowdown' || key === 'arrowup') {
      event.preventDefault();
      const next = this.focused() + (key === 'arrowdown' ? 1 : -1);
      this.focused.set(Math.max(0, Math.min(items.length - 1, next)));
    } else if (!item) {
      return;
    } else if (key === 'enter') {
      if (item.kind === 'todo') {
        this.router.navigate(['/todo', item.record.id], { state: { back: '/inbox' } });
      } else {
        this.keep(item.record);
      }
    } else if (key === 't' && item.kind === 'todo') {
      this.putOnToday(item.record);
    } else if (key === 'm' && item.kind === 'todo') {
      this.moreLists(item.record);
    } else if (key === 'd' && item.kind === 'todo') {
      this.pickDate(item.record);
    }
  }

  protected isFocused(item: InboxItem) {
    return this.flat()[this.focused()]?.record.id === item.record.id;
  }

  protected toggle(item: InboxItem) {
    this.open.set(this.open() === item.record.id ? null : item.record.id);
  }

  protected async putOnToday(todo: Todo) {
    this.done('On Today', await this.actions.putOnToday(todo));
  }

  protected async moveTo(todo: Todo, list: string) {
    const name = this.store.list(list)?.name ?? 'Inbox';
    this.done(`Moved to ${name}`, await this.actions.moveTodo(todo, list));
  }

  protected async moreLists(todo: Todo) {
    const list = await this.sheets.open<string, MoveToData>(MoveTo, { current: todo.list }).closed;
    if (list) {
      await this.moveTo(todo, list);
    }
  }

  protected async pickDate(todo: Todo) {
    const result = await this.sheets.open<DatePickerResult, DatePickerData>(DatePicker, {
      date: todo.date,
      time: todo.time,
      timeEnd: todo.time_end,
    }).closed;
    if (result?.date) {
      const undo = await this.actions.setDate(todo, result.date);
      this.done('Dated', undo);
    }
  }

  protected async delete(todo: Todo) {
    this.done('Deleted', await this.actions.delete('todos', todo));
  }

  protected async keep(note: Note) {
    await this.router.navigate(['/note', note.id], { state: { mode: 'keep', back: '/inbox' } });
  }

  protected async keepNow(note: Note) {
    this.done('Kept as a note', await this.actions.keepNote(note));
  }

  protected async makeTodo(note: Note) {
    this.done('Made into a todo', await this.actions.makeTodo(note));
  }

  protected async archive(note: Note) {
    this.done('Moved to the archive', await this.actions.archiveNote(note));
  }

  private done(title: string, undo: Undo) {
    this.open.set(null);
    this.toasts.show({ title, undo });
  }

  protected asTodo(item: InboxItem) {
    return item.record as Todo;
  }

  protected asNote(item: InboxItem) {
    return item.record as Note;
  }
}
