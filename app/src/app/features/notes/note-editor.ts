import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { Actions, NoteEdit } from '../../core/data/actions';
import { LinkActions, NoteLinks } from '../../core/data/link-actions';
import { newId } from '../../domain/ids';
import { Draft, EMPTY_RECORDS, Note } from '../../domain/models';
import { Store } from '../../core/data/store';
import { Clock } from '../../core/time/clock';
import { Icon } from '../../shared/ui/icon';
import { ListLabel } from '../../shared/ui/list-label';
import { listColourStyle } from '../../shared/ui/list-colours';
import { renderMarkdown } from '../../shared/markdown/markdown';
import { NotePhotos } from './note-photos';
import { Toasts } from '../../core/toasts/toasts';
import { Pickers } from '../../shared/pickers/pickers';
import { backLabel } from '../../domain/back-labels';
import { Selection, TextEdit, withCode, withHeading } from '../../shared/markdown/markdown-edits';
import { noteConnections, noteDateLabel } from '../../domain/note-view';
import { Settled } from '../../shared/ui/motion';

export type NoteMode = 'edit' | 'keep' | 'new';

export interface NoteEditorState {
  mode?: NoteMode;
  draft?: Draft<'notes'>;
  back?: string;
}

@Component({
  selector: 'app-note-editor',
  imports: [FormsModule, Icon, ListLabel, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './note-editor.html',
  styleUrl: './note-editor.scss',
})
export class NoteEditor {
  readonly id = input.required<string>();

  private readonly store = inject(Store);
  protected readonly settled = new Settled();
  private readonly actions = inject(Actions);
  private readonly links = inject(LinkActions);
  private readonly pickers = inject(Pickers);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly clock = inject(Clock);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly bodyField = viewChild<ElementRef<HTMLTextAreaElement>>('bodyField');

  private readonly state = (history.state ?? {}) as NoteEditorState;
  protected readonly mode = signal<NoteMode>(this.state.mode ?? 'edit');
  protected readonly back = this.state.back ?? '/';
  private readonly draftId = newId();

  protected readonly noteId = computed(() => (this.id() === 'new' ? this.draftId : this.id()));
  private readonly saved = computed(() => this.store.notes().find((note) => note.id === this.id()));
  private readonly draft = signal<Note>({
    ...EMPTY_RECORDS.notes,
    ...this.state.draft,
    id: this.draftId,
  });
  protected readonly note = computed(() => (this.id() === 'new' ? this.draft() : this.saved()));

  protected readonly title = signal('');
  protected readonly body = signal('');
  protected readonly list = signal('');
  protected readonly editing = signal(this.mode() !== 'edit');

  protected readonly listRecord = computed(() => this.store.list(this.list()));
  protected readonly backLabel = computed(() =>
    backLabel(this.back, (id) => this.store.list(id)?.name),
  );
  protected readonly dateLabel = computed(() =>
    noteDateLabel(this.note()?.created, this.clock.today()),
  );
  protected readonly rendered = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(this.body())),
  );
  protected readonly photos = new NotePhotos(this.note, this.noteId);

  protected readonly connections = computed(() =>
    noteConnections(this.note(), this.noteId(), {
      notes: this.store.notes(),
      todos: this.store.todos(),
    }),
  );
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
          if (this.mode() === 'edit' && !note.body && !note.title) {
            this.editing.set(true);
          }
        });
      }
    });
  }

  protected async pickList() {
    const list = await this.pickers.list(this.list());
    if (list !== undefined) {
      this.list.set(list);
      await this.persist();
    }
  }

  protected async persist() {
    const note = this.saved();
    if (this.mode() === 'edit' && note) {
      await this.actions.editNote(note, this.fields());
    }
  }

  protected async stopEditing() {
    await this.persist();
    if (this.mode() === 'edit') {
      this.editing.set(false);
    }
  }

  protected insertHeading() {
    this.edit(withHeading);
  }

  protected insertCode() {
    this.edit(withCode);
  }

  protected async addLink() {
    const result = await this.pickers.links({
      self: this.noteId(),
      list: this.list(),
      ...this.currentLinks(),
    });
    if (result) {
      await this.setLinks(result);
    }
  }

  protected unlinkNote(id: string) {
    const { notes, todos } = this.currentLinks();
    return this.setLinks({ notes: notes.filter((each) => each !== id), todos });
  }

  protected unlinkTodo(id: string) {
    const { notes, todos } = this.currentLinks();
    return this.setLinks({ notes, todos: todos.filter((each) => each !== id) });
  }

  protected openWikiLink(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('a.note-link');
    if (!target) {
      if (!(event.target as HTMLElement).closest('a')) {
        this.startEditing();
      }
      return;
    }
    event.preventDefault();
    const title = target.dataset['note']?.toLowerCase();
    const linked = this.store.notes().find((note) => note.title.toLowerCase() === title);
    if (linked) {
      void this.router.navigate(['/note', linked.id], {
        state: { back: `/note/${this.noteId()}` },
      });
    }
  }

  protected editFromKeyboard(event: Event) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      this.startEditing();
    }
  }

  protected async save() {
    const saved = this.saved();
    if (this.mode() === 'new') {
      await this.actions.createNote({ ...this.draft(), ...this.fields() });
    } else if (this.mode() === 'keep' && saved) {
      const undo = await this.actions.keepNote(saved, this.fields());
      this.toasts.show({ title: 'Kept as a note', undo });
    }
    await this.router.navigateByUrl(this.back);
  }

  protected async cancel() {
    if (this.mode() === 'new') {
      await this.photos.discardPending(this.draft());
    }
    this.location.back();
  }

  protected async delete() {
    const saved = this.saved();
    if (saved) {
      await this.actions.delete('notes', saved);
      await this.router.navigateByUrl(this.back);
    }
  }

  private startEditing() {
    this.editing.set(true);
    setTimeout(() => this.bodyField()?.nativeElement.focus());
  }

  private fields(): NoteEdit {
    return { title: this.title().trim(), body: this.body(), list: this.list() };
  }

  private currentLinks(): NoteLinks {
    const note = this.note();
    return { notes: note?.links ?? [], todos: note?.todos ?? [] };
  }

  private async setLinks(links: NoteLinks) {
    if (this.id() === 'new') {
      this.draft.update((draft) => ({ ...draft, links: links.notes, todos: links.todos }));
      return;
    }
    await this.links.setNoteLinks(this.id(), links);
  }

  private edit(change: (text: string, selection: Selection) => TextEdit) {
    const field = this.bodyField()?.nativeElement;
    const start = field?.selectionStart ?? this.body().length;
    const result = change(this.body(), { start, end: field?.selectionEnd ?? start });
    this.body.set(result.text);
    setTimeout(() => {
      field?.focus();
      field?.setSelectionRange(result.cursor, result.cursor);
    });
  }
}
