import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../../core/data/store';
import { Clock } from '../../core/time/clock';
import { monthName, parseLocalDate, weekdayName } from '../../domain/time/local-date';
import { Icon } from '../../shared/ui/icon';
import { ListLabel } from '../../shared/ui/list-label';
import { stepsLabel, weekSummary } from '../../domain/week-summary';

const NOTES_SHOWN = 3;
const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

@Component({
  selector: 'app-week-page',
  imports: [Icon, ListLabel, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './week-page.html',
  styleUrl: './week-page.scss',
})
export class WeekPage {
  private readonly store = inject(Store);
  protected readonly today = inject(Clock).today();

  protected readonly week = computed(() =>
    weekSummary(this.today, this.store.todos(), this.store.completions(), this.store.notes()),
  );
  protected readonly range = computed(() => {
    const start = parseLocalDate(this.week().start);
    const end = parseLocalDate(this.week().end);
    const startLabel = `${monthName(start.getMonth())} ${start.getDate()}`;
    return start.getMonth() === end.getMonth()
      ? `${startLabel} – ${end.getDate()}`
      : `${startLabel} – ${monthName(end.getMonth())} ${end.getDate()}`;
  });
  protected readonly quickNotes = computed(() => this.store.inboxNotes().length);
  protected readonly maxDone = computed(() =>
    Math.max(1, ...this.week().days.map((day) => day.done)),
  );
  protected readonly showAllNotes = signal(false);
  protected readonly shownNotes = computed(() =>
    this.showAllNotes() ? this.week().notes : this.week().notes.slice(0, NOTES_SHOWN),
  );

  protected letter(date: string) {
    return weekdayName(date)[0];
  }

  protected dayName(timestamp: string) {
    return WEEKDAY_NAMES[new Date(timestamp.replace(' ', 'T')).getDay()];
  }

  protected list(id: string) {
    return this.store.list(id);
  }

  protected finishedSub(todoId: string, doneAt: string) {
    const todo = this.store.todos().find((each) => each.id === todoId)!;
    return [stepsLabel(todo, this.store.steps()), this.dayName(doneAt)].filter(Boolean).join(', ');
  }
}
