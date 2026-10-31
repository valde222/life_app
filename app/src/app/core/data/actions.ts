import { inject, Injectable } from '@angular/core';
import { Clock } from '../time/clock';
import { pocketBaseTimestamp } from '../../domain/ids';
import { CollectionName, Collections, Note, Todo } from '../../domain/models';
import { Draft, Repository } from './repository';

export type Undo = () => Promise<unknown>;

@Injectable({ providedIn: 'root' })
export class Actions {
  private readonly repository = inject(Repository);
  private readonly clock = inject(Clock);

  createTodo(draft: Draft<'todos'>) {
    return this.repository.save('todos', { inbox: !draft.list, ...draft });
  }

  createNote(draft: Draft<'notes'>) {
    return this.repository.save('notes', { inbox: !draft.list, ...draft });
  }

  tick(todo: Todo): Promise<Undo> {
    return this.change('todos', todo, { done_at: pocketBaseTimestamp(this.clock.now()) });
  }

  untick(todo: Todo): Promise<Undo> {
    return this.change('todos', todo, { done_at: '' });
  }

  putOnToday(todo: Todo): Promise<Undo> {
    return this.change('todos', todo, { date: this.clock.today(), inbox: false });
  }

  setDate(todo: Todo, date: string): Promise<Undo> {
    return this.change('todos', todo, { date, inbox: todo.inbox && !date });
  }

  moveTodo(todo: Todo, list: string): Promise<Undo> {
    return this.change('todos', todo, { list, inbox: !list });
  }

  moveNote(note: Note, list: string): Promise<Undo> {
    return this.change('notes', note, { list, inbox: !list });
  }

  keepNote(note: Note, changes: Draft<'notes'> = {}): Promise<Undo> {
    return this.change('notes', note, { ...changes, inbox: false });
  }

  archiveNote(note: Note): Promise<Undo> {
    return this.change('notes', note, { archived_at: pocketBaseTimestamp(this.clock.now()) });
  }

  archiveTodo(todo: Todo): Promise<Undo> {
    return this.change('todos', todo, { archived_at: pocketBaseTimestamp(this.clock.now()) });
  }

  delete<C extends 'todos' | 'notes'>(collection: C, record: Collections[C]): Promise<Undo> {
    return this.change(collection, record, {
      deleted_at: pocketBaseTimestamp(this.clock.now()),
    } as Draft<C>);
  }

  async makeTodo(note: Note): Promise<Undo> {
    const todo = await this.repository.save('todos', {
      title: note.title || note.body.split('\n')[0] || 'Untitled',
      list: note.list,
      inbox: note.inbox,
    });
    const undoDelete = await this.delete('notes', note);
    return async () => {
      await this.repository.remove('todos', todo.id);
      await undoDelete();
    };
  }

  async complete(todo: Todo, day = this.clock.today()): Promise<Undo> {
    const completion = await this.repository.save('completions', { todo: todo.id, done_on: day });
    return () => this.repository.remove('completions', completion.id);
  }

  private async change<C extends CollectionName>(
    collection: C,
    record: Collections[C],
    changes: Draft<C>,
  ): Promise<Undo> {
    const before = Object.fromEntries(
      Object.keys(changes).map((field) => [field, record[field as keyof Collections[C]]]),
    ) as Draft<C>;
    await this.repository.save(collection, { ...changes, id: record.id });
    return () => this.repository.save(collection, { ...before, id: record.id });
  }
}
