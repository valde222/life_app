import { computed, inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { displayName, tooBig } from '../../domain/file-names';
import { Note } from '../../domain/models';
import { FileOpener } from '../platform/file-opener';
import { Server } from '../server/server';
import { Sync } from '../sync/sync';
import { queueRemoval, queueUploads } from './file-queue';
import { fieldOf, LocalStore, PendingUpload } from './local-store';

export interface ShownFile {
  key: string;
  name: string;
  filename?: string;
  pendingId?: string;
}

@Injectable({ providedIn: 'root' })
export class NoteFiles {
  private readonly store = inject(LocalStore);
  private readonly server = inject(Server);
  private readonly sync = inject(Sync);
  private readonly opener = inject(FileOpener);

  private readonly pending = toSignal(from(liveQuery(() => this.store.pendingPhotos.toArray())), {
    initialValue: [] as PendingUpload[],
  });

  async add(note: string, files: File[]): Promise<File[]> {
    const fits = files.filter((file) => !tooBig(file.size));
    await queueUploads(this.store, { note, field: 'files', fallbackName: 'file' }, fits);
    void this.sync.push();
    return files.filter((file) => tooBig(file.size));
  }

  async remove(note: Note, file: ShownFile) {
    if (file.pendingId) {
      await this.store.pendingPhotos.delete(file.pendingId);
    } else if (file.filename) {
      await queueRemoval(this.store, note, { field: 'files', filename: file.filename });
      void this.sync.push();
    }
  }

  async open(note: Note, file: ShownFile) {
    if (!file.filename) {
      return;
    }
    const token = await this.server.fileToken();
    await this.opener.open(this.server.fileUrl(note, file.filename, { token }), file.name);
  }

  shown(note: Signal<Note | undefined>): Signal<ShownFile[]> {
    return computed(() => {
      const current = note();
      if (!current) {
        return [];
      }
      const uploaded = (current.files ?? []).map((filename) => ({
        key: filename,
        name: current.file_names?.[filename] ?? displayName(filename),
        filename,
      }));
      const waiting = this.pending()
        .filter((upload) => upload.note === current.id && fieldOf(upload) === 'files')
        .map((upload) => ({ key: upload.id, name: upload.name, pendingId: upload.id }));
      return [...uploaded, ...waiting];
    });
  }
}
