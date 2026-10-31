import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Actions } from '../core/data/actions';
import { Todo } from '../domain/models';
import { Store } from '../core/data/store';
import { Server } from '../core/server/server';
import { SyncService } from '../core/sync/sync.service';
import { Clock } from '../core/time/clock';
import { longDate } from '../domain/time/local-date';
import { EmptyState } from '../shared/ui/empty-state';
import { Icon } from '../shared/ui/icon';
import { NextCard } from '../shared/ui/next-card';
import { Sheets } from '../shared/ui/sheet';
import { Toasts } from '../shared/ui/toast';
import { TodoRow } from '../shared/ui/todo-row';
import { FirstLaunchTip } from './first-launch-tip';
import { PickSheet } from './pick-sheet';
import { todayItems } from '../domain/today-items';
import { calendarEventAsTodo, hasEnded, itemLink } from '../domain/calendar-items';
import { isRepeating, repeatStatus } from '../domain/repeat-status';
import { RepeatRow } from '../shared/ui/repeat-row';

@Component({
  selector: 'app-today',
  imports: [EmptyState, FirstLaunchTip, Icon, NextCard, RepeatRow, RouterLink, TodoRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './today.html',
  styleUrl: './today.scss',
})
export class Today {
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly toasts = inject(Toasts);
  private readonly sheets = inject(Sheets);
  private readonly router = inject(Router);
  protected readonly clock = inject(Clock);
  protected readonly sync = inject(SyncService);

  private readonly dayItems = computed(() => [
    ...this.store.todos(),
    ...this.store.calendarEvents().map(calendarEventAsTodo),
  ]);
  protected readonly items = computed(() => todayItems(this.dayItems(), this.clock.now()));
  protected readonly link = itemLink;
  protected readonly overdue = computed(() =>
    this.store
      .todos()
      .filter((todo) => isRepeating(todo) && !todo.archived_at)
      .map((todo) => ({
        todo,
        status: repeatStatus(todo, this.store.completions(), this.clock.today()),
      }))
      .filter((item) => item.status.overdue)
      .sort((a, b) => b.status.daysSince - a.status.daysSince),
  );
  protected readonly dateLabel = computed(() => longDate(this.clock.today()));
  protected readonly doneCount = computed(() => this.items().done.length);
  protected readonly allDone = computed(() => {
    const { next, scheduled, anytime } = this.items();
    const remaining = [...scheduled, ...anytime].filter(
      (todo) => !todo.is_event || !hasEnded(todo, this.clock.now()),
    );
    return this.doneCount() > 0 && !next && remaining.length === 0;
  });
  protected readonly nothing = computed(() => this.items().total === 0);
  protected readonly firstLaunch = computed(
    () => this.store.todos().length === 0 && this.store.notes().length === 0,
  );
  protected readonly showDone = signal(false);
  protected readonly compact = signal(false);
  protected readonly initial =
    (inject(Server).pb.authStore.record?.['email'] as string | undefined)?.[0]?.toUpperCase() ??
    'V';

  constructor() {
    const onScroll = () => this.compact.set(window.scrollY > 90);
    window.addEventListener('scroll', onScroll, { passive: true });
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', onScroll));
  }

  protected ended(todo: Todo) {
    return todo.is_event && hasEnded(todo, this.clock.now());
  }

  protected list(todo: Todo) {
    return this.store.list(todo.list);
  }

  protected steps(todo: Todo) {
    const steps = this.store.steps().filter((step) => step.todo === todo.id);
    return steps.length ? `${steps.filter((step) => step.done).length}/${steps.length}` : '';
  }

  protected async tick(todo: Todo) {
    const undo = await this.actions.tick(todo);
    this.toasts.show({
      title: `${todo.title} done`,
      action: { label: 'Add note', run: () => this.addNote(todo) },
      undo,
    });
  }

  protected async untick(todo: Todo) {
    const undo = await this.actions.untick(todo);
    this.toasts.show({ title: `${todo.title} is back on Today`, undo });
  }

  protected async completeRepeating(todo: Todo) {
    const undo = await this.actions.complete(todo);
    this.toasts.show({ title: `${todo.title} done`, undo });
  }

  protected openRepeating() {
    this.router.navigateByUrl('/repeating');
  }

  protected openPick() {
    this.sheets.open(PickSheet, undefined, { panelClass: ['sheet-panel', 'sheet-tall'] });
  }

  private async addNote(todo: Todo) {
    const note = await this.actions.createNote({
      title: '',
      list: todo.list,
      todos: [todo.id],
      inbox: false,
    });
    await this.router.navigate(['/note', note.id], { state: { back: '/' } });
  }
}
