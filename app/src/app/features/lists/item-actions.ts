import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Undo } from '../../core/data/actions';
import { LinkActions } from '../../core/data/link-actions';
import { Store } from '../../core/data/store';
import { Toasts } from '../../core/toasts/toasts';
import { Note, Todo } from '../../domain/models';
import { Pickers } from '../../shared/pickers/pickers';
import { ActionSheet, ActionSheetData, ActionOption } from '../../shared/ui/action-sheet';
import { Sheets } from '../../shared/ui/sheet';

type TodoAction = 'today' | 'date' | 'move' | 'repeat' | 'delete';
type NoteAction = 'move' | 'link' | 'archive' | 'delete';
type Handlers<A extends string> = Record<A, () => Promise<unknown>>;

const TODO_OPTIONS: ActionOption<TodoAction>[] = [
  { value: 'today', label: 'Put on Today' },
  { value: 'date', label: 'Date…' },
  { value: 'move', label: 'Move to…' },
  { value: 'repeat', label: 'Repeat…' },
  { value: 'delete', label: 'Delete', danger: true },
];

const NOTE_OPTIONS: ActionOption<NoteAction>[] = [
  { value: 'move', label: 'Move to…' },
  { value: 'link', label: 'Link to…' },
  { value: 'archive', label: 'Archive' },
  { value: 'delete', label: 'Delete', danger: true },
];

@Injectable({ providedIn: 'root' })
export class ItemActions {
  private readonly sheets = inject(Sheets);
  private readonly pickers = inject(Pickers);
  private readonly actions = inject(Actions);
  private readonly links = inject(LinkActions);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  async putOnToday(todo: Todo) {
    this.done('On Today', await this.actions.putOnToday(todo));
  }

  async forTodo(todo: Todo, back: string) {
    const action = await this.choose(todo.title, TODO_OPTIONS);
    if (action) {
      await this.todoHandlers(todo, back)[action]();
    }
  }

  async forNote(note: Note) {
    const action = await this.choose(note.title || 'Untitled', NOTE_OPTIONS);
    if (action) {
      await this.noteHandlers(note)[action]();
    }
  }

  private choose<A extends string>(title: string, options: ActionOption<A>[]) {
    return this.sheets.open<A, ActionSheetData<A>>(ActionSheet, { title, options }).closed;
  }

  private todoHandlers(todo: Todo, back: string): Handlers<TodoAction> {
    return {
      today: () => this.putOnToday(todo),
      date: () => this.pickDate(todo),
      move: () => this.moveTodo(todo),
      repeat: () => this.router.navigate(['/repeat', todo.id], { state: { back } }),
      delete: async () => {
        this.done('Deleted', await this.actions.delete('todos', todo));
      },
    };
  }

  private noteHandlers(note: Note): Handlers<NoteAction> {
    return {
      move: () => this.moveNote(note),
      link: () => this.linkNote(note),
      archive: async () => {
        this.done('Moved to the archive', await this.actions.archiveNote(note));
      },
      delete: async () => {
        this.done('Deleted', await this.actions.delete('notes', note));
      },
    };
  }

  private async pickDate(todo: Todo) {
    const result = await this.pickers.date({
      date: todo.date,
      time: todo.time,
      timeEnd: todo.time_end,
    });
    if (result) {
      this.done('Dated', await this.actions.setDate(todo, result.date));
    }
  }

  private async moveTodo(todo: Todo) {
    const list = await this.pickers.list(todo.list);
    if (list !== undefined) {
      this.done(this.movedTo(list), await this.actions.moveTodo(todo, list));
    }
  }

  private async moveNote(note: Note) {
    const list = await this.pickers.list(note.list);
    if (list !== undefined) {
      this.done(this.movedTo(list), await this.actions.moveNote(note, list));
    }
  }

  private async linkNote(note: Note) {
    const result = await this.pickers.links({
      self: note.id,
      list: note.list,
      notes: note.links ?? [],
      todos: note.todos ?? [],
    });
    if (result) {
      await this.links.setNoteLinks(note.id, result);
    }
  }

  private movedTo(list: string) {
    return `Moved to ${this.store.list(list)?.name ?? 'Inbox'}`;
  }

  private done(title: string, undo: Undo) {
    this.toasts.show({ title, undo });
  }
}
