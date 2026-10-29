import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Repository } from '../data/repository';
import { SyncService } from '../sync/sync.service';
import { localDate } from '../time/local-date';

@Component({
  selector: 'app-today',
  imports: [FormsModule],
  templateUrl: './today.html',
  styleUrl: './today.scss',
})
export class Today {
  private readonly repository = inject(Repository);
  protected readonly sync = inject(SyncService);

  protected readonly today = localDate();
  protected readonly todos = this.repository.watch(
    'todos',
    (todo) => todo.date === this.today && !todo.done_at,
  );
  protected readonly sorted = computed(() =>
    [...this.todos()].sort(
      (a, b) => (a.time || '99').localeCompare(b.time || '99') || a.title.localeCompare(b.title),
    ),
  );
  protected readonly dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(new Date())
    .replace(',', '');

  protected title = '';

  protected async add() {
    const title = this.title.trim();
    if (!title) {
      return;
    }
    this.title = '';
    await this.repository.save('todos', { title, date: this.today });
  }
}
