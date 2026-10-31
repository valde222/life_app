import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Actions, Undo } from '../core/data/actions';
import { Todo } from '../domain/models';
import { Store } from '../core/data/store';
import { Clock } from '../core/time/clock';
import { addDays, relativeDay } from '../domain/time/local-date';
import { Icon } from '../ui/icon';
import { ListLabel } from '../ui/list-label';
import { todayItems } from '../domain/today-items';

const ALL = 'All';
const DUE_SOON = 'Due soon';
const LEFT_OVER = 'Left over';

@Component({
  selector: 'app-pick-sheet',
  imports: [FormsModule, Icon, ListLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pick-sheet.html',
  styleUrl: './pick-sheet.scss',
})
export class PickSheet {
  protected readonly ref = inject(DialogRef);
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly clock = inject(Clock);
  private readonly today = this.clock.today();
  private readonly undos = new Map<string, Undo>();

  protected readonly query = signal('');
  protected readonly picked = signal<ReadonlySet<string>>(new Set());

  private readonly leftOverIds = computed(
    () => new Set(todayItems(this.store.todos(), this.clock.now()).leftOver.map((todo) => todo.id)),
  );

  protected readonly filters = computed(() => [
    ALL,
    DUE_SOON,
    ...(this.leftOverIds().size ? [LEFT_OVER] : []),
    ...this.store.openLists().map((list) => list.name),
  ]);
  protected readonly filter = signal(this.leftOverIds().size ? LEFT_OVER : ALL);

  private readonly candidates = computed(() =>
    this.store
      .todos()
      .filter(
        (todo) =>
          this.picked().has(todo.id) ||
          (!todo.done_at &&
            !todo.archived_at &&
            !todo.is_event &&
            todo.repeat_mode !== 'rough' &&
            todo.repeat_mode !== 'schedule' &&
            todo.date !== this.today),
      ),
  );

  protected readonly items = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.filter();
    const soon = addDays(this.today, 7);
    return this.candidates()
      .filter((todo) => !query || todo.title.toLowerCase().includes(query))
      .filter((todo) => {
        if (this.picked().has(todo.id) || filter === ALL) {
          return true;
        }
        if (filter === DUE_SOON) {
          return !!todo.date && todo.date > this.today && todo.date <= soon;
        }
        if (filter === LEFT_OVER) {
          return this.leftOverIds().has(todo.id);
        }
        return this.store.list(todo.list)?.name === filter;
      })
      .sort(
        (a, b) =>
          (a.date || '9999').localeCompare(b.date || '9999') || a.title.localeCompare(b.title),
      );
  });

  protected listOf(todo: Todo) {
    return this.store.list(todo.list);
  }

  protected meta(todo: Todo) {
    if (this.picked().has(todo.id)) {
      return 'Today';
    }
    if (!todo.date) {
      return '';
    }
    return todo.date < this.today
      ? relativeDay(todo.date, this.today)
      : `Due ${relativeDay(todo.date, this.today)}`;
  }

  protected async toggle(todo: Todo) {
    const picked = new Set(this.picked());
    if (picked.has(todo.id)) {
      picked.delete(todo.id);
      await this.undos.get(todo.id)?.();
      this.undos.delete(todo.id);
    } else {
      picked.add(todo.id);
      this.undos.set(todo.id, await this.actions.putOnToday(todo));
    }
    this.picked.set(picked);
  }
}
