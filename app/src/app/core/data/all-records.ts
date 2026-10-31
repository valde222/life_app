import { inject, Injectable } from '@angular/core';
import { DeletedItem, deletedItems } from '../../domain/deleted-items';
import { Repository } from './repository';

@Injectable({ providedIn: 'root' })
export class AllRecords {
  private readonly repository = inject(Repository);

  readonly todos = this.repository.watchAll('todos');
  readonly notes = this.repository.watchAll('notes');
  readonly lists = this.repository.watchAll('lists');

  deletedOn(today: string): DeletedItem[] {
    return deletedItems({ todos: this.todos(), notes: this.notes(), lists: this.lists() }, today);
  }
}
