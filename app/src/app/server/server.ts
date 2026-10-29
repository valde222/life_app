import { Injectable, signal } from '@angular/core';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { CollectionName, Collections } from '../data/models';
import { RemoteWriter, SendError } from '../sync/outbox';
import { PhotoWriter } from '../sync/photos';
import { Note } from '../data/models';

export const DEFAULT_SERVER_URL = 'http://localhost:8090';
const SERVER_URL_KEY = 'life.serverUrl';
const READ_ONLY_FIELDS = [
  'created',
  'updated',
  'collectionId',
  'collectionName',
  'expand',
  'photos',
];

@Injectable({ providedIn: 'root' })
export class Server implements RemoteWriter, PhotoWriter {
  readonly url = signal(localStorage.getItem(SERVER_URL_KEY) ?? DEFAULT_SERVER_URL);
  pb = new PocketBase(this.url());
  readonly signedIn = signal(this.pb.authStore.isValid);

  setUrl(url: string) {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed === this.url()) {
      return;
    }
    localStorage.setItem(SERVER_URL_KEY, trimmed);
    this.url.set(trimmed);
    this.pb = new PocketBase(trimmed);
    this.signedIn.set(this.pb.authStore.isValid);
  }

  async signIn(email: string, password: string) {
    await this.pb.collection('users').authWithPassword(email, password);
    this.signedIn.set(true);
  }

  signOut() {
    this.pb.authStore.clear();
    this.signedIn.set(false);
  }

  async upsert<C extends CollectionName>(
    collection: C,
    record: Collections[C],
  ): Promise<Collections[C]> {
    const body = { ...record } as Record<string, unknown>;
    for (const field of READ_ONLY_FIELDS) {
      delete body[field];
    }
    const records = this.pb.collection(collection);
    try {
      try {
        return await records.update<Collections[C]>(record.id, body);
      } catch (error) {
        if (error instanceof ClientResponseError && error.status === 404) {
          return await records.create<Collections[C]>(body);
        }
        throw error;
      }
    } catch (error) {
      throw toSendError(error);
    }
  }

  async addPhoto(note: string, file: Blob, name: string): Promise<Note> {
    const form = new FormData();
    form.append('photos+', file, name);
    return this.send(() => this.pb.collection('notes').update<Note>(note, form));
  }

  async removePhoto(note: string, filename: string): Promise<Note> {
    return this.send(() =>
      this.pb.collection('notes').update<Note>(note, { 'photos-': [filename] }),
    );
  }

  async fileToken(): Promise<string> {
    return this.pb.files.getToken({ requestKey: null });
  }

  photoUrl(note: Note, filename: string, token: string, thumb?: string): string {
    return this.pb.files.getURL({ ...note, collectionName: 'notes' }, filename, {
      token,
      ...(thumb ? { thumb } : {}),
    });
  }

  private async send<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      throw toSendError(error);
    }
  }
}

export function toSendError(error: unknown): unknown {
  if (!(error instanceof ClientResponseError)) {
    return error;
  }
  if (error.status === 0 || error.status >= 500) {
    return new SendError('offline', error);
  }
  if (error.status === 401 || error.status === 403) {
    return new SendError('unauthorised', error);
  }
  return new SendError('rejected', error);
}
