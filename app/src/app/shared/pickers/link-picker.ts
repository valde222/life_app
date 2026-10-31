import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Actions } from '../../core/data/actions';
import { Note, Todo } from '../../domain/models';
import { Store } from '../../core/data/store';
import { Clock } from '../../core/time/clock';
import { localDate, relativeDay, shortDate } from '../../domain/time/local-date';
import { Icon } from '../ui/icon';
import { Segmented } from '../ui/segmented';

export interface LinkPickerData {
  self?: string;
  onlyNotes?: boolean;
  list?: string;
  notes?: string[];
  todos?: string[];
}

export interface LinkPickerResult {
  notes: string[];
  todos: string[];
}

type Filter = 'all' | 'notes' | 'todos';

interface Candidate {
  kind: 'note' | 'todo';
  id: string;
  title: string;
  meta: string;
  list: string;
  changedAt: number;
}

const RECENT = 6;

@Component({
  selector: 'app-link-picker',
  imports: [FormsModule, Icon, NgTemplateOutlet, Segmented],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './link-picker.html',
  styleUrl: './link-picker.scss',
})
export class LinkPicker {
  protected readonly ref = inject(DialogRef<LinkPickerResult>);
  protected readonly data = inject<LinkPickerData>(DIALOG_DATA);
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);
  private readonly clock = inject(Clock);

  protected readonly filters = [
    { value: 'all' as Filter, label: 'All' },
    { value: 'notes' as Filter, label: 'Notes' },
    { value: 'todos' as Filter, label: 'Todos' },
  ];
  protected readonly filter = signal<Filter>(this.data.onlyNotes ? 'notes' : 'all');
  protected readonly query = signal('');
  protected readonly notes = signal(new Set(this.data.notes ?? []));
  protected readonly todos = signal(new Set(this.data.todos ?? []));
  protected readonly listName = computed(() => this.store.list(this.data.list ?? '')?.name);

  private readonly candidates = computed<Candidate[]>(() => [
    ...this.store
      .notes()
      .filter((note) => note.id !== this.data.self && !note.archived_at)
      .map((note) => this.fromNote(note)),
    ...this.store
      .todos()
      .filter((todo) => !todo.archived_at)
      .map((todo) => this.fromTodo(todo)),
  ]);

  private readonly matching = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.filter();
    return this.candidates()
      .filter((candidate) => filter === 'all' || `${candidate.kind}s` === filter)
      .filter((candidate) => !query || candidate.title.toLowerCase().includes(query))
      .sort((a, b) => b.changedAt - a.changedAt);
  });

  protected readonly suggested = computed(() =>
    this.data.list && !this.query()
      ? this.matching().filter((candidate) => candidate.list === this.data.list)
      : [],
  );
  protected readonly others = computed(() => {
    const suggested = new Set(this.suggested().map((candidate) => candidate.id));
    const rest = this.matching().filter((candidate) => !suggested.has(candidate.id));
    return this.query() ? rest : rest.slice(0, RECENT);
  });

  protected isPicked(candidate: Candidate) {
    return (candidate.kind === 'note' ? this.notes() : this.todos()).has(candidate.id);
  }

  protected toggle(candidate: Candidate) {
    const target = candidate.kind === 'note' ? this.notes : this.todos;
    const next = new Set(target());
    if (next.has(candidate.id)) {
      next.delete(candidate.id);
    } else {
      next.add(candidate.id);
    }
    target.set(next);
  }

  protected async newNote() {
    const note = await this.actions.createNote({
      title: this.query().trim(),
      list: this.data.list ?? '',
      inbox: !this.data.list,
    });
    this.notes.set(new Set([...this.notes(), note.id]));
    this.done();
  }

  protected done() {
    this.ref.close({ notes: [...this.notes()], todos: [...this.todos()] });
  }

  private fromNote(note: Note): Candidate {
    const day = note.created
      ? localDate(new Date(note.created.replace(' ', 'T')))
      : this.clock.today();
    return {
      kind: 'note',
      id: note.id,
      title: note.title || 'Untitled',
      meta: [this.store.list(note.list)?.name, shortDate(day)].filter(Boolean).join(', '),
      list: note.list,
      changedAt: note.changed_at,
    };
  }

  private fromTodo(todo: Todo): Candidate {
    const state = todo.done_at
      ? 'done'
      : todo.date
        ? `due ${relativeDay(todo.date, this.clock.today())}`
        : '';
    return {
      kind: 'todo',
      id: todo.id,
      title: todo.title,
      meta: [this.store.list(todo.list)?.name, state].filter(Boolean).join(', '),
      list: todo.list,
      changedAt: todo.changed_at,
    };
  }
}
