import { inject, Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { enqueue } from '../sync/outbox';
import { newId, pocketBaseTimestamp } from '../../domain/ids';
import { LocalStore } from './local-store';
import { CollectionName, Collections, EMPTY_RECORDS } from '../../domain/models';

export type Draft<C extends CollectionName> = Partial<Collections[C]>;

@Injectable({ providedIn: 'root' })
export class Repository {
  private readonly store = inject(LocalStore);

  async save<C extends CollectionName>(collection: C, draft: Draft<C>): Promise<Collections[C]> {
    const table = this.store.records(collection);
    return this.store.transaction('rw', table, this.store.outbox, async () => {
      const existing = draft.id ? await table.get(draft.id) : undefined;
      const record = {
        ...EMPTY_RECORDS[collection],
        ...existing,
        ...draft,
        id: draft.id ?? newId(),
        changed_at: Math.max(Date.now(), (existing?.changed_at ?? 0) + 1),
      } as Collections[C];
      await table.put(record);
      await enqueue(this.store, collection, record.id, record.changed_at);
      return record;
    });
  }

  remove<C extends CollectionName>(collection: C, id: string): Promise<Collections[C]> {
    return this.save(collection, { id, deleted_at: pocketBaseTimestamp() } as Draft<C>);
  }

  async purge(collection: CollectionName, id: string) {
    const table = this.store.records(collection);
    await this.store.transaction('rw', table, this.store.outbox, async () => {
      await table.delete(id);
      await enqueue(this.store, collection, id, Date.now(), 'purge');
    });
  }

  watchAll<C extends CollectionName>(collection: C): Signal<Collections[C][]> {
    return toSignal(from(liveQuery(() => this.store.records(collection).toArray())), {
      initialValue: [],
    });
  }

  watch<C extends CollectionName>(
    collection: C,
    keep: (record: Collections[C]) => boolean = () => true,
  ): Signal<Collections[C][]> {
    const query = liveQuery(() =>
      this.store
        .records(collection)
        .filter((record) => !record.deleted_at && keep(record))
        .toArray(),
    );
    return toSignal(from(query), { initialValue: [] });
  }

  watchOutboxSize(): Signal<number> {
    return toSignal(from(liveQuery(() => this.store.outbox.count())), { initialValue: 0 });
  }
}
