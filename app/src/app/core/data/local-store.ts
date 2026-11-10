import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { CollectionName, Collections, NoteFileField } from '../../domain/models';

export interface OutboxEntry {
  seq: number;
  key: string;
  collection: CollectionName;
  id: string;
  changed_at: number;
  op?: 'purge';
}

export type NewOutboxEntry = Omit<OutboxEntry, 'seq'>;

export interface PendingUpload {
  id: string;
  note: string;
  field?: NoteFileField;
  file: Blob;
  name: string;
}

export interface PendingRemoval {
  id: string;
  note: string;
  field?: NoteFileField;
  filename: string;
}

export const fieldOf = (entry: { field?: NoteFileField }): NoteFileField => entry.field ?? 'photos';

const OWNER_KEY = 'owner';

export interface MetaEntry {
  key: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class LocalStore extends Dexie {
  outbox!: Table<OutboxEntry, number, NewOutboxEntry>;
  meta!: Table<MetaEntry, string>;
  // Named from when only photos were queued; renaming them would drop queues not yet sent.
  pendingPhotos!: Table<PendingUpload, string>;
  photoRemovals!: Table<PendingRemoval, string>;

  constructor() {
    super('life');
    this.version(1).stores({
      groups: 'id',
      lists: 'id, group',
      todos: 'id, list, date, inbox',
      steps: 'id, todo',
      completions: 'id, todo',
      notes: 'id, list, inbox',
      calendar_events: 'id, start',
      settings: 'id',
      outbox: '++seq, &key',
      meta: 'key',
    });
    this.version(2).stores({
      pendingPhotos: 'id, note',
      photoRemovals: 'id, note',
    });
  }

  async adopt(owner: string) {
    const current = (await this.meta.get(OWNER_KEY))?.value;
    if (current === owner) {
      return;
    }
    await this.transaction('rw', this.tables, async () => {
      const unsentFromBefore = current === undefined && (await this.outbox.count()) > 0;
      if (!unsentFromBefore) {
        await Promise.all(this.tables.map((table) => table.clear()));
      }
      await this.meta.put({ key: OWNER_KEY, value: owner });
    });
  }

  records<C extends CollectionName>(collection: C): Table<Collections[C], string> {
    return this.table(collection);
  }
}
