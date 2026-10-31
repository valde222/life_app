import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { newId } from '../../domain/ids';
import { LocalStore, PendingPhoto } from './local-store';
import { Note } from '../../domain/models';
import { Server } from '../server/server';
import { Sync } from '../sync/sync';

const TOKEN_LIFETIME_MS = 90_000;
export const THUMB = '200x200';

export interface ShownPhoto {
  key: string;
  thumb: string;
  full: string;
  filename?: string;
  pendingId?: string;
}

@Injectable({ providedIn: 'root' })
export class Photos {
  private readonly store = inject(LocalStore);
  private readonly server = inject(Server);
  private readonly sync = inject(Sync);
  private readonly token = signal('');
  private tokenFetchedAt = 0;
  private readonly objectUrls = new Map<string, string>();

  private readonly pending = toSignal(from(liveQuery(() => this.store.pendingPhotos.toArray())), {
    initialValue: [] as PendingPhoto[],
  });

  constructor() {
    setInterval(() => this.refreshToken(), TOKEN_LIFETIME_MS);
  }

  async add(note: string, files: Iterable<File>) {
    for (const file of files) {
      await this.store.pendingPhotos.add({
        id: newId(),
        note,
        file,
        name: file.name || 'photo.jpg',
      });
    }
    this.sync.push();
  }

  async remove(note: Note, photo: ShownPhoto) {
    if (photo.pendingId) {
      await this.store.pendingPhotos.delete(photo.pendingId);
    } else if (photo.filename) {
      await this.store
        .records('notes')
        .update(note.id, { photos: note.photos.filter((name) => name !== photo.filename) });
      await this.store.photoRemovals.add({ id: newId(), note: note.id, filename: photo.filename });
      this.sync.push();
    }
  }

  shown(note: Signal<Note | undefined>): Signal<ShownPhoto[]> {
    this.refreshToken();
    return computed(() => {
      const current = note();
      if (!current) {
        return [];
      }
      const token = this.token();
      const uploaded = (current.photos ?? []).map((filename) => ({
        key: filename,
        filename,
        thumb: this.server.photoUrl(current, filename, token, THUMB),
        full: this.server.photoUrl(current, filename, token),
      }));
      const waiting = this.pending()
        .filter((photo) => photo.note === current.id)
        .map((photo) => {
          const url = this.objectUrl(photo);
          return { key: photo.id, pendingId: photo.id, thumb: url, full: url };
        });
      return [...uploaded, ...waiting];
    });
  }

  private async refreshToken() {
    if (Date.now() - this.tokenFetchedAt < TOKEN_LIFETIME_MS) {
      return;
    }
    this.tokenFetchedAt = Date.now();
    try {
      this.token.set(await this.server.fileToken());
    } catch {
      this.tokenFetchedAt = 0;
    }
  }

  private objectUrl(photo: PendingPhoto) {
    let url = this.objectUrls.get(photo.id);
    if (!url) {
      url = URL.createObjectURL(photo.file);
      this.objectUrls.set(photo.id, url);
    }
    return url;
  }
}
