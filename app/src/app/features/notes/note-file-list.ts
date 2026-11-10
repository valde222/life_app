import { inject, signal, Signal } from '@angular/core';
import { logError } from '../../core/logging/log';
import { NoteFiles, ShownFile } from '../../core/data/note-files';
import { OpenError } from '../../core/platform/file-opener';
import { Toasts } from '../../core/toasts/toasts';
import { Note } from '../../domain/models';

export function refusedTitle(names: string[]): string {
  return names.length === 1 ? `${names[0]} is over 50 MB` : `${names.length} files are over 50 MB`;
}

export function openFailedTitle(name: string, error: unknown, online: boolean): string {
  if (!online) {
    return `${name} opens when you're online`;
  }
  if (error instanceof OpenError && error.failure === 'no-app') {
    return `No app here opens ${name}`;
  }
  return `Couldn't open ${name}`;
}

export class NoteFileList {
  private readonly files = inject(NoteFiles);
  private readonly toasts = inject(Toasts);

  readonly shown;
  readonly removing = signal('');

  constructor(
    private readonly note: Signal<Note | undefined>,
    private readonly noteId: Signal<string>,
  ) {
    this.shown = this.files.shown(note);
  }

  async picked(event: Event) {
    const input = event.target as HTMLInputElement;
    const refused = await this.files.add(this.noteId(), [...(input.files ?? [])]);
    input.value = '';
    if (refused.length) {
      this.toasts.show({ title: refusedTitle(refused.map((file) => file.name)) });
    }
  }

  async open(file: ShownFile) {
    const note = this.note();
    if (!note) {
      return;
    }
    try {
      await this.files.open(note, file);
    } catch (error) {
      logError(`Could not open ${file.name}`, error);
      this.toasts.show({ title: openFailedTitle(file.name, error, navigator.onLine) });
    }
  }

  async remove(file: ShownFile) {
    if (this.removing() !== file.key) {
      this.removing.set(file.key);
      return;
    }
    const note = this.note();
    if (note) {
      await this.files.remove(note, file);
    }
    this.removing.set('');
  }

  async discardPending(draft: Note) {
    for (const file of this.shown().filter((each) => each.pendingId)) {
      await this.files.remove(draft, file);
    }
  }
}
