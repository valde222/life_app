import { inject, Injectable } from '@angular/core';
import { Repository } from './repository';
import { Store } from './store';

export interface NoteLinks {
  notes: string[];
  todos: string[];
}

@Injectable({ providedIn: 'root' })
export class LinkActions {
  private readonly repository = inject(Repository);
  private readonly store = inject(Store);

  async setNoteLinks(note: string, links: NoteLinks): Promise<void> {
    await this.repository.save('notes', { id: note, links: links.notes, todos: links.todos });
  }

  async setNotesOfTodo(todo: string, chosen: ReadonlySet<string>): Promise<void> {
    for (const note of this.store.notes()) {
      const linked: boolean | undefined = note.todos?.includes(todo);
      if (chosen.has(note.id) !== (linked === true)) {
        const todos = linked
          ? note.todos.filter((each) => each !== todo)
          : [...(note.todos ?? []), todo];
        await this.repository.save('notes', { id: note.id, todos });
      }
    }
  }
}
