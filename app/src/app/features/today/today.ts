import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Actions } from '../../core/data/actions';
import { Todo } from '../../domain/models';
import { Store } from '../../core/data/store';
import { Session } from '../../core/session/session';
import { Sync } from '../../core/sync/sync';
import { Clock } from '../../core/time/clock';
import { longDate } from '../../domain/time/local-date';
import { EmptyState } from '../../shared/ui/empty-state';
import { Icon } from '../../shared/ui/icon';
import { NextCard } from '../../shared/ui/next-card';
import { Sheets } from '../../shared/ui/sheet';
import { TodoRow } from '../../shared/ui/todo-row';
import { FirstLaunchTip } from './first-launch-tip';
import { PickSheet } from './pick-sheet';
import { allDoneToday, stepProgress, todayItems } from '../../domain/today-items';
import { calendarEventAsTodo, hasEnded, itemLink } from '../../domain/calendar-items';
import { overdueRepeating } from '../../domain/repeat-status';
import { RepeatRow } from '../../shared/ui/repeat-row';
import { Toasts } from '../../core/toasts/toasts';
import { Settled } from '../../shared/ui/motion';
import { Ticking } from '../../shared/ticking/ticking';

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
  private readonly ticking = inject(Ticking);
  private readonly toasts = inject(Toasts);
  private readonly sheets = inject(Sheets);
  private readonly router = inject(Router);
  protected readonly clock = inject(Clock);
  protected readonly sync = inject(Sync);

  private readonly dayItems = computed(() => [
    ...this.store.todos(),
    ...this.store.calendarEvents().map(calendarEventAsTodo),
  ]);
  protected readonly items = computed(() => todayItems(this.dayItems(), this.clock.now()));
  protected readonly link = itemLink;
  protected readonly overdue = computed(() =>
    overdueRepeating(this.store.todos(), this.store.completions(), this.clock.today()),
  );
  protected readonly dateLabel = computed(() => longDate(this.clock.today()));
  protected readonly doneCount = computed(() => this.items().done.length);
  protected readonly allDone = computed(() => allDoneToday(this.items(), this.clock.now()));
  protected readonly nothing = computed(() => this.items().total === 0);
  protected readonly firstLaunch = computed(
    () => this.store.todos().length === 0 && this.store.notes().length === 0,
  );
  protected readonly showDone = signal(false);
  protected readonly settled = new Settled();
  protected readonly compact = signal(false);
  protected readonly initial = inject(Session).email()[0]?.toUpperCase() ?? 'V';

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
    return stepProgress(todo, this.store.steps());
  }

  protected tick(todo: Todo) {
    return this.ticking.tick(todo, '/');
  }

  protected untick(todo: Todo) {
    return this.ticking.untick(todo, `${todo.title} is back on Today`);
  }

  protected async completeRepeating(todo: Todo) {
    const undo = await this.actions.complete(todo);
    this.toasts.show({ title: `${todo.title} done`, undo });
  }

  protected openRepeating() {
    void this.router.navigateByUrl('/repeating');
  }

  protected openPick() {
    this.sheets.open(PickSheet, undefined, { panelClass: ['sheet-panel', 'sheet-tall'] });
  }
}
