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
import { Actions } from '../data/actions';
import { newId } from '../domain/ids';
import { EMPTY_RECORDS, Note } from '../domain/models';
import { Draft, Repository } from '../data/repository';
import { Store } from '../data/store';
import { MoveTo, MoveToData } from '../pickers/move-to';
import { Clock } from '../time/clock';
import { localDate, shortDate } from '../domain/time/local-date';
import { Icon } from '../ui/icon';
import { ListLabel } from '../ui/list-label';
import { listColourStyle } from '../ui/list-colours';
import { Sheets } from '../ui/sheet';
import { Toasts } from '../ui/toast';
import { ImagePicker } from './image-picker';
import { ImageView, ImageViewData } from './image-view';
import { LinkPicker, LinkPickerData, LinkPickerResult } from './link-picker';
import { renderMarkdown } from './markdown';
import { Photos } from './photos';

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
  private readonly repository = inject(Repository);
  private readonly actions = inject(Actions);
  private readonly sheets = inject(Sheets);
  private readonly toasts = inject(Toasts);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly clock = inject(Clock);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly photosService = inject(Photos);
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
  protected readonly backLabel = computed(() => {
    if (this.back.startsWith('/lists/')) {
      return this.store.list(this.back.split('/')[2])?.name ?? 'Back';
    }
    const names: Record<string, string> = { '/': 'Today', '/inbox': 'Inbox', '/search': 'Search' };
    return names[this.back] ?? 'Back';
  });
  protected readonly dateLabel = computed(() => {
    const created = this.note()?.created;
    const day = created ? localDate(new Date(created.replace(' ', 'T'))) : this.clock.today();
    return day === this.clock.today() ? 'Today' : shortDate(day);
  });
  protected readonly rendered = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(this.body())),
  );
  protected readonly photos = this.photosService.shown(this.note);

  protected readonly linkedNotes = computed(() => {
    const ids = new Set(this.note()?.links ?? []);
    return this.store.notes().filter((note) => ids.has(note.id));
  });
  protected readonly linkedTodos = computed(() => {
    const ids = new Set(this.note()?.todos ?? []);
    return this.store.todos().filter((todo) => ids.has(todo.id));
  });
  protected readonly linkedFrom = computed(() =>
    this.store
      .notes()
      .filter(
        (note) => note.links?.includes(this.noteId()) && !this.note()?.links?.includes(note.id),
      ),
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
    const list = await this.sheets.open<string, MoveToData>(MoveTo, { current: this.list() })
      .closed;
    if (list !== undefined) {
      this.list.set(list);
      await this.persist();
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

  protected async stopEditing() {
    await this.persist();
    if (this.mode() === 'edit') {
      this.editing.set(false);
    }
  }

  protected insertHeading() {
    this.edit((text, start) => {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      return { text: `${text.slice(0, lineStart)}## ${text.slice(lineStart)}`, cursor: start + 3 };
    });
  }

  protected insertCode() {
    this.edit((text, start, end) => {
      const selected = text.slice(start, end);
      const wrapped = selected.includes('\n')
        ? `\n\`\`\`\n${selected}\n\`\`\`\n`
        : `\`${selected}\``;
      return {
        text: text.slice(0, start) + wrapped + text.slice(end),
        cursor: start + (selected ? wrapped.length : 1),
      };
    });
  }

  protected async addPhoto() {
    const files = await this.sheets.open<File[]>(ImagePicker).closed;
    if (files?.length) {
      await this.photosService.add(this.noteId(), files);
    }
  }

  protected async openPhoto(index: number) {
    const result = await this.sheets.openFull<string, ImageViewData>(ImageView, {
      photos: this.photos(),
      index,
    }).closed;
    if (result?.startsWith('delete:')) {
      await this.photosService.remove(this.note()!, this.photos()[Number(result.slice(7))]);
    }
  }

  protected async addLink() {
    const note = this.note()!;
    const result = await this.sheets.open<LinkPickerResult, LinkPickerData>(
      LinkPicker,
      { self: this.noteId(), list: this.list(), notes: note.links ?? [], todos: note.todos ?? [] },
      { panelClass: ['sheet-panel', 'sheet-tall'] },
    ).closed;
    if (result) {
      await this.setLinks(result.notes, result.todos);
    }
  }

  protected unlinkNote(id: string) {
    const note = this.note()!;
    return this.setLinks(
      (note.links ?? []).filter((each) => each !== id),
      note.todos ?? [],
    );
  }

  protected unlinkTodo(id: string) {
    const note = this.note()!;
    return this.setLinks(
      note.links ?? [],
      (note.todos ?? []).filter((each) => each !== id),
    );
  }

  protected openWikiLink(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest<HTMLElement>('a.note-link');
    if (!target) {
      if (!(event.target as HTMLElement).closest('a')) {
        this.editing.set(true);
        setTimeout(() => this.bodyField()?.nativeElement.focus());
      }
      return;
    }
    event.preventDefault();
    const title = target.dataset['note']?.toLowerCase();
    const linked = this.store.notes().find((note) => note.title.toLowerCase() === title);
    if (linked) {
      this.router.navigate(['/note', linked.id], { state: { back: `/note/${this.noteId()}` } });
    }
  }

  protected async save() {
    const fields: Draft<'notes'> = {
      title: this.title().trim(),
      body: this.body(),
      list: this.list(),
    };
    if (this.mode() === 'new') {
      await this.actions.createNote({ ...this.draft(), ...fields });
    } else if (this.mode() === 'keep') {
      const undo = await this.actions.keepNote(this.saved()!, fields);
      this.toasts.show({ title: 'Kept as a note', undo });
    }
    await this.router.navigateByUrl(this.back);
  }

  protected async cancel() {
    if (this.mode() === 'new') {
      for (const photo of this.photos().filter((each) => each.pendingId)) {
        await this.photosService.remove(this.draft(), photo);
      }
    }
    this.location.back();
  }

  protected async delete() {
    await this.actions.delete('notes', this.saved()!);
    await this.router.navigateByUrl(this.back);
  }

  private async setLinks(links: string[], todos: string[]) {
    if (this.id() === 'new') {
      this.draft.update((draft) => ({ ...draft, links, todos }));
      return;
    }
    await this.repository.save('notes', { id: this.id(), links, todos });
  }

  private edit(
    change: (text: string, start: number, end: number) => { text: string; cursor: number },
  ) {
    const field = this.bodyField()?.nativeElement;
    const start = field?.selectionStart ?? this.body().length;
    const end = field?.selectionEnd ?? start;
    const result = change(this.body(), start, end);
    this.body.set(result.text);
    setTimeout(() => {
      field?.focus();
      field?.setSelectionRange(result.cursor, result.cursor);
    });
  }
}
