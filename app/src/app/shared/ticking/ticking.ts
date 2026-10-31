import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions } from '../../core/data/actions';
import { Toasts } from '../../core/toasts/toasts';
import { Todo } from '../../domain/models';

@Injectable({ providedIn: 'root' })
export class Ticking {
  private readonly actions = inject(Actions);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);

  async tick(todo: Todo, back: string): Promise<void> {
    const undo = await this.actions.tick(todo);
    this.toasts.show({
      title: `${todo.title} done`,
      action: { label: 'Add note', run: () => this.addNote(todo, back) },
      undo,
    });
  }

  async untick(todo: Todo, title = `${todo.title} is not done`): Promise<void> {
    const undo = await this.actions.untick(todo);
    this.toasts.show({ title, undo });
  }

  private async addNote(todo: Todo, back: string) {
    const note = await this.actions.startNoteFor(todo);
    await this.router.navigate(['/note', note.id], { state: { back } });
  }
}
