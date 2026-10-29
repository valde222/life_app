import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Actions } from '../data/actions';
import { EMPTY_RECORDS, Note } from '../data/models';
import { Draft, Repository } from '../data/repository';
import { Store } from '../data/store';
import { MoveTo, MoveToData } from '../pickers/move-to';
import { Icon } from '../ui/icon';
import { listColourStyle } from '../ui/list-colours';
import { Sheets } from '../ui/sheet';
import { Toasts } from '../ui/toast';

export type NoteMode = 'edit' | 'keep' | 'new';

export interface NoteEditorState {
  mode?: NoteMode;
  draft?: Draft<'notes'>;
  back?: string;
}

@Component({
  selector: 'app-note-editor',
  imports: [FormsModule, Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note-editor.html',
  styleUrl: './note-editor.scss',
})
export class NoteEditor {
  readonly id = input.required<string>();

  private readonly store = inject(Store);
  private readonly repository = inject(Repository);
  private readonly actions = inject(Actions);
  private readonly sheets = inject(Sheets);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly state = (history.state ?? {}) as NoteEditorState;
  protected readonly mode = signal<NoteMode>(this.state.mode ?? 'edit');
  protected readonly back = this.state.back ?? '/';

  private readonly saved = computed(() => this.store.notes().find((note) => note.id === this.id()));
  private readonly draft = signal<Note>({ ...EMPTY_RECORDS.notes, ...this.state.draft });
  protected readonly note = computed(() => (this.id() === 'new' ? this.draft() : this.saved()));

  protected readonly title = signal('');
  protected readonly body = signal('');
  protected readonly list = signal('');

  protected readonly listRecord = computed(() => this.store.list(this.list()));
  protected readonly linkedTodos = computed(() => {
    const ids = new Set(this.note()?.todos ?? []);
    return this.store.todos().filter((todo) => ids.has(todo.id));
  });
  protected readonly heading = computed(() => (this.mode() === 'keep' ? 'Keep note' : 'Note'));
  protected readonly swatch = listColourStyle;

  constructor() {
    let loaded = false;
    effect(() => {
      const note = this.note();
      if (note && !loaded) {
        loaded = true;
        untracked(() => {
          this.title.set(note.title);
          this.body.set(note.body);
          this.list.set(note.list);
        });
      }
    });
  }

  protected async pickList() {
    const list = await this.sheets.open<string, MoveToData>(MoveTo, { current: this.list() })
      .closed;
    if (list !== undefined) {
      this.list.set(list);
      if (this.mode() === 'edit') {
        await this.persist();
      }
    }
  }

  protected async persist() {
    if (this.mode() !== 'edit' || !this.saved()) {
      return;
    }
    const note = this.saved()!;
    const changes: Draft<'notes'> = {
      title: this.title().trim(),
      body: this.body(),
      list: this.list(),
    };
    if (changes.title !== note.title || changes.body !== note.body || changes.list !== note.list) {
      await this.repository.save('notes', {
        ...changes,
        id: note.id,
        inbox: note.inbox && !changes.list,
      });
    }
  }

  protected async save() {
    const fields: Draft<'notes'> = {
      title: this.title().trim(),
      body: this.body(),
      list: this.list(),
    };
    if (this.mode() === 'new') {
      await this.actions.createNote({ ...this.draft(), ...fields, id: undefined });
    } else if (this.mode() === 'keep') {
      const undo = await this.actions.keepNote(this.saved()!, fields);
      this.toasts.show({ title: 'Kept as a note', undo });
    }
    await this.router.navigateByUrl(this.back);
  }

  protected cancel() {
    this.location.back();
  }

  protected async delete() {
    await this.actions.delete('notes', this.saved()!);
    await this.router.navigateByUrl(this.back);
  }
}
