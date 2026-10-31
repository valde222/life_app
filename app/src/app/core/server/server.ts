import { Injectable, signal } from '@angular/core';
import PocketBase, { ClientResponseError, getTokenPayload } from 'pocketbase';
import { CollectionName, Collections } from '../../domain/models';
import { RemoteWriter, SendError } from '../sync/outbox';
import { Page, RemoteChange, RemoteReader } from '../sync/remote-reader';
import { PhotoWriter } from '../sync/photos';
import { Note } from '../../domain/models';

export interface Account {
  id: string;
  email: string;
}

export const DEFAULT_SERVER_URL = 'http://localhost:8090';
const SERVER_URL_KEY = 'life.serverUrl';
const DEFAULT_TOKEN_SECONDS = 5 * 86_400;
const READ_ONLY_FIELDS = [
  'created',
  'updated',
  'collectionId',
  'collectionName',
  'expand',
  'photos',
  'owner',
];

@Injectable({ providedIn: 'root' })
export class Server implements RemoteReader, RemoteWriter, PhotoWriter {
  readonly url = signal(localStorage.getItem(SERVER_URL_KEY) ?? DEFAULT_SERVER_URL);
  private pb = new PocketBase(this.url());
  readonly signedIn = signal(this.pb.authStore.isValid);

  account(): Account | null {
    const record = this.pb.authStore.record;
    return record ? { id: record.id, email: (record['email'] as string | undefined) ?? '' } : null;
  }

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

  async refreshIfStale() {
    if (
      this.pb.authStore.isValid &&
      needsRefresh(getTokenPayload(this.pb.authStore.token), Date.now())
    ) {
      await this.pb.collection('users').authRefresh({ requestKey: null });
    }
  }

  signOut() {
    this.pb.authStore.clear();
    this.signedIn.set(false);
  }

  async changedSince<C extends CollectionName>(
    collection: C,
    cursor: string,
    page: Page,
  ): Promise<Collections[C][]> {
    const result = await this.pb
      .collection(collection)
      .getList<Collections[C]>(page.number, page.size, {
        filter: cursor ? this.pb.filter('updated >= {:cursor}', { cursor }) : '',
        sort: 'updated',
        skipTotal: true,
        requestKey: null,
      });
    return result.items;
  }

  async deletedIds(collection: CollectionName): Promise<string[]> {
    const records = await this.pb.collection(collection).getFullList<{ id: string }>({
      filter: "deleted_at != ''",
      fields: 'id',
      requestKey: null,
    });
    return records.map((record) => record.id);
  }

  subscribe<C extends CollectionName>(
    collection: C,
    onChange: (change: RemoteChange<C>) => void,
  ): Promise<() => Promise<void>> {
    return this.pb.collection(collection).subscribe<Collections[C]>('*', ({ action, record }) => {
      onChange({ deleted: action === 'delete', record });
    });
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

  async purge(collection: CollectionName, id: string): Promise<void> {
    try {
      await this.pb.collection(collection).delete(id);
    } catch (error) {
      if (error instanceof ClientResponseError && error.status === 404) {
        return;
      }
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

export function needsRefresh(claims: { iat?: number; exp?: number }, now: number): boolean {
  if (!claims.exp || claims.exp * 1000 <= now) {
    return false;
  }
  const lifetime = claims.exp - (claims.iat ?? claims.exp - DEFAULT_TOKEN_SECONDS);
  return claims.exp * 1000 - now < (lifetime * 1000) / 2;
}

export function toSendError(error: unknown): unknown {
  if (!(error instanceof ClientResponseError)) {
    return error;
  }
  if (error.status === 0 || error.status === 429 || error.status >= 500) {
    return new SendError('offline', error);
  }
  if (error.status === 401 || error.status === 403) {
    return new SendError('unauthorised', error);
  }
  return new SendError('rejected', error);
}
