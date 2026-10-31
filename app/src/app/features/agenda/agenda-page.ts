import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../../core/data/store';
import { Clock } from '../../core/time/clock';
import {
  addDays,
  localDate,
  longDate,
  monthName,
  parseLocalDate,
} from '../../domain/time/local-date';
import { Icon } from '../../shared/ui/icon';
import { ListLabel } from '../../shared/ui/list-label';
import { agendaDays, AgendaSources, datesWithItems } from '../../domain/agenda-days';
import { isTyping } from '../../shared/ui/keyboard';

type View = 'week' | 'month' | 'year';
const DAYS_SHOWN = 21;
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function mondayOf(date: string) {
  return addDays(date, -((parseLocalDate(date).getDay() + 6) % 7));
}

@Component({
  selector: 'app-agenda-page',
  imports: [Icon, ListLabel, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './agenda-page.html',
  host: { '(document:keydown)': 'onKey($event)' },
  styleUrl: './agenda-page.scss',
})
export class AgendaPage {
  private readonly store = inject(Store);
  private readonly clock = inject(Clock);
  protected readonly today = this.clock.today();
  protected readonly weekdays = WEEKDAYS;
  protected readonly months = Array.from({ length: 12 }, (_, month) => month);
  protected readonly monthName = monthName;

  protected readonly selected = signal(this.today);
  protected readonly view = signal<View>('week');
  protected readonly shownMonth = signal(this.today.slice(0, 7));
  protected readonly shownYear = signal(Number(this.today.slice(0, 4)));

  private readonly sources = computed<AgendaSources>(() => ({
    todos: this.store.todos(),
    calendarEvents: this.store.calendarEvents(),
    completions: this.store.completions(),
    lists: this.store.listsById(),
  }));

  protected readonly monthLabel = computed(() =>
    monthName(parseLocalDate(this.selected()).getMonth(), 'long'),
  );
  protected readonly week = computed(() =>
    Array.from({ length: 7 }, (_, index) => addDays(mondayOf(this.selected()), index)),
  );
  protected readonly monthGrid = computed(() => {
    const first = `${this.shownMonth()}-01`;
    const start = mondayOf(first);
    const last = localDate(
      new Date(parseLocalDate(first).getFullYear(), parseLocalDate(first).getMonth() + 1, 0),
    );
    const cells: (string | null)[] = [];
    for (let date = start; date <= last; date = addDays(date, 1)) {
      cells.push(date < first ? null : date);
    }
    return cells;
  });
  protected readonly shownMonthLabel = computed(() => {
    const first = parseLocalDate(`${this.shownMonth()}-01`);
    return `${monthName(first.getMonth(), 'long')} ${first.getFullYear()}`;
  });

  private readonly marked = computed(() => {
    const from = this.view() === 'month' ? mondayOf(`${this.shownMonth()}-01`) : this.week()[0];
    return datesWithItems({ from, to: addDays(from, 41) }, this.today, this.sources());
  });
  protected readonly days = computed(() =>
    agendaDays({ from: this.selected(), count: DAYS_SHOWN }, this.today, this.sources()),
  );

  protected dayNumber(date: string) {
    return Number(date.slice(8));
  }

  protected hasItems(date: string) {
    return this.marked().has(date);
  }

  protected dayHeader(date: string, endDate?: string) {
    const label = longDate(date);
    if (endDate) {
      return `${label} – ${longDate(endDate)}`;
    }
    return date === this.today ? `Today, ${label}` : label;
  }

  protected pick(date: string) {
    this.selected.set(date);
    this.shownMonth.set(date.slice(0, 7));
  }

  protected toggleMonth() {
    this.shownMonth.set(this.selected().slice(0, 7));
    this.view.set(this.view() === 'week' ? 'month' : 'week');
  }

  protected shiftWeek(by: number) {
    this.pick(addDays(this.selected(), by * 7));
  }

  protected shiftMonth(by: number) {
    const first = parseLocalDate(`${this.shownMonth()}-01`);
    this.shownMonth.set(
      localDate(new Date(first.getFullYear(), first.getMonth() + by, 1)).slice(0, 7),
    );
  }

  protected pickMonth(month: number) {
    const date = localDate(new Date(this.shownYear(), month, 1));
    this.shownMonth.set(date.slice(0, 7));
    this.pick(date);
    this.view.set('month');
  }

  protected openYear() {
    this.shownYear.set(Number(this.shownMonth().slice(0, 4)));
    this.view.set('year');
  }

  protected onKey(event: KeyboardEvent) {
    if (isTyping(event.target) || event.ctrlKey || event.metaKey) {
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      this.pick(addDays(this.selected(), event.key === 'ArrowLeft' ? -1 : 1));
    } else if (event.key.toLowerCase() === 't') {
      this.pick(this.today);
    }
  }

  private swipeStart = 0;

  protected swipeStartAt(event: PointerEvent) {
    this.swipeStart = event.clientX;
  }

  protected swipeEnd(event: PointerEvent) {
    const dx = event.clientX - this.swipeStart;
    if (Math.abs(dx) > 50) {
      this.shiftWeek(dx < 0 ? 1 : -1);
    }
  }
}
