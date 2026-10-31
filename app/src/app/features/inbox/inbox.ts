import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Actions, Undo } from '../../core/data/actions';
import { Note, Todo } from '../../domain/models';
import { Store } from '../../core/data/store';
import { Clock } from '../../core/time/clock';
import { EmptyState } from '../../shared/ui/empty-state';
import { Icon } from '../../shared/ui/icon';
import { listColourStyle } from '../../shared/ui/list-colours';
import { Sheets } from '../../shared/ui/sheet';
import { SwipeRow } from '../../shared/ui/swipe-row';
import { inboxSections, InboxItem } from '../../domain/inbox-items';
import { isTyping } from '../../shared/ui/keyboard';
import { Toasts } from '../../core/toasts/toasts';
import { Pickers } from '../../shared/pickers/pickers';
import { motionMs, Settled } from '../../shared/ui/motion';
import { Ticking } from '../../shared/ticking/ticking';
import { TickBox } from '../../shared/ui/tick-box';

const QUICK_LISTS = 4;

@Component({
  selector: 'app-inbox',
  imports: [EmptyState, Icon, RouterLink, SwipeRow, TickBox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './inbox.html',
  host: { '(document:keydown)': 'onKey($event)' },
  styleUrl: './inbox.scss',
})
export class Inbox {
  private readonly store = inject(Store);
  private readonly ticking = inject(Ticking);
  protected readonly settled = new Settled();
  private readonly actions = inject(Actions);
  private readonly toasts = inject(Toasts);
  private readonly sheets = inject(Sheets);
  private readonly pickers = inject(Pickers);
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
    if (this.ignoresKey(event)) {
      return;
    }
    const key = event.key.toLowerCase();
    if (key === 'arrowdown' || key === 'arrowup') {
      event.preventDefault();
      this.moveFocus(key === 'arrowdown' ? 1 : -1);
      return;
    }
    const item = this.flat()[this.focused()];
    const action = item ? this.keyAction(key, item) : undefined;
    void action?.();
  }

  private ignoresKey(event: KeyboardEvent) {
    return isTyping(event.target) || event.ctrlKey || event.metaKey || this.sheets.anyOpen();
  }

  private moveFocus(by: number) {
    const last = this.flat().length - 1;
    this.focused.set(Math.max(0, Math.min(last, this.focused() + by)));
  }

  private keyAction(key: string, item: InboxItem): (() => Promise<unknown>) | undefined {
    if (item.kind === 'note') {
      return key === 'enter' ? () => this.keep(item.record) : undefined;
    }
    const todo = item.record;
    const actions: Record<string, () => Promise<unknown>> = {
      enter: () => this.router.navigate(['/todo', todo.id], { state: { back: '/inbox' } }),
      t: () => this.putOnToday(todo),
      m: () => this.moreLists(todo),
      d: () => this.pickDate(todo),
    };
    return actions[key];
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
    const list = await this.pickers.list(todo.list);
    if (list) {
      await this.moveTo(todo, list);
    }
  }

  protected async pickDate(todo: Todo) {
    const result = await this.pickers.date({
      date: todo.date,
      time: todo.time,
      timeEnd: todo.time_end,
    });
    if (result?.date) {
      const undo = await this.actions.setDate(todo, result.date);
      this.done('Dated', undo);
    }
  }

  protected tick(todo: Todo) {
    return this.ticking.tick(todo, '/inbox');
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
    setTimeout(() => {
      this.open.set(null);
    }, motionMs('base'));
    this.toasts.show({ title, undo });
  }

  protected asTodo(item: InboxItem) {
    return item.record as Todo;
  }

  protected asNote(item: InboxItem) {
    return item.record as Note;
  }
}
