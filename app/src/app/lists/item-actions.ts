import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, Undo } from '../data/actions';
import { Note, Todo } from '../domain/models';
import { DatePicker, DatePickerData, DatePickerResult } from '../pickers/date-picker';
import { MoveTo, MoveToData } from '../pickers/move-to';
import { ActionSheet, ActionSheetData } from '../ui/action-sheet';
import { Sheets } from '../ui/sheet';
import { Toasts } from '../ui/toast';
import { Store } from '../data/store';
import { LinkPicker, LinkPickerData, LinkPickerResult } from '../note/link-picker';
import { Repository } from '../data/repository';

type TodoAction = 'today' | 'date' | 'move' | 'repeat' | 'delete';
type NoteAction = 'move' | 'link' | 'archive' | 'delete';

@Injectable({ providedIn: 'root' })
export class ItemActions {
  private readonly sheets = inject(Sheets);
  private readonly actions = inject(Actions);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly repository = inject(Repository);

  async putOnToday(todo: Todo) {
    this.done('On Today', await this.actions.putOnToday(todo));
  }

  async forTodo(todo: Todo, back: string) {
    const action = await this.sheets.open<TodoAction, ActionSheetData<TodoAction>>(ActionSheet, {
      title: todo.title,
      options: [
        { value: 'today', label: 'Put on Today' },
        { value: 'date', label: 'Date…' },
        { value: 'move', label: 'Move to…' },
        { value: 'repeat', label: 'Repeat…' },
        { value: 'delete', label: 'Delete', danger: true },
      ],
    }).closed;
    switch (action) {
      case undefined:
        return;
      case 'today':
        return this.putOnToday(todo);
      case 'date':
        return this.pickDate(todo);
      case 'move':
        return this.moveTodo(todo);
      case 'repeat':
        return this.router.navigate(['/repeat', todo.id], { state: { back } });
      case 'delete': {
        this.done('Deleted', await this.actions.delete('todos', todo));
        return;
      }
    }
  }

  async forNote(note: Note) {
    const action = await this.sheets.open<NoteAction, ActionSheetData<NoteAction>>(ActionSheet, {
      title: note.title || 'Untitled',
      options: [
        { value: 'move', label: 'Move to…' },
        { value: 'link', label: 'Link to…' },
        { value: 'archive', label: 'Archive' },
        { value: 'delete', label: 'Delete', danger: true },
      ],
    }).closed;
    switch (action) {
      case undefined:
        return;
      case 'move': {
        const list = await this.sheets.open<string, MoveToData>(MoveTo, { current: note.list })
          .closed;
        if (list !== undefined) {
          this.done(
            `Moved to ${this.store.list(list)?.name ?? 'Inbox'}`,
            await this.actions.moveNote(note, list),
          );
        }
        return;
      }
      case 'link': {
        const result = await this.sheets.open<LinkPickerResult, LinkPickerData>(
          LinkPicker,
          { self: note.id, list: note.list, notes: note.links ?? [], todos: note.todos ?? [] },
          { panelClass: ['sheet-panel', 'sheet-tall'] },
        ).closed;
        if (result) {
          await this.repository.save('notes', {
            id: note.id,
            links: result.notes,
            todos: result.todos,
          });
        }
        return;
      }
      case 'archive': {
        this.done('Moved to the archive', await this.actions.archiveNote(note));
        return;
      }
      case 'delete': {
        this.done('Deleted', await this.actions.delete('notes', note));
        return;
      }
    }
  }

  private async pickDate(todo: Todo) {
    const result = await this.sheets.open<DatePickerResult, DatePickerData>(DatePicker, {
      date: todo.date,
      time: todo.time,
      timeEnd: todo.time_end,
    }).closed;
    if (result) {
      this.done('Dated', await this.actions.setDate(todo, result.date));
    }
  }

  private async moveTodo(todo: Todo) {
    const list = await this.sheets.open<string, MoveToData>(MoveTo, { current: todo.list }).closed;
    if (list !== undefined) {
      this.done(
        `Moved to ${this.store.list(list)?.name ?? 'Inbox'}`,
        await this.actions.moveTodo(todo, list),
      );
    }
  }

  private done(title: string, undo: Undo) {
    this.toasts.show({ title, undo });
  }
}
