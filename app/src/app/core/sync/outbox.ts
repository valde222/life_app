import { LocalStore, OutboxEntry } from '../data/local-store';
import { CollectionName, Collections } from '../../domain/models';

export interface RemoteWriter {
  upsert<C extends CollectionName>(collection: C, record: Collections[C]): Promise<Collections[C]>;
  purge(collection: CollectionName, id: string): Promise<void>;
}

export type SendFailure = 'offline' | 'unauthorised' | 'rejected';

export class SendError extends Error {
  constructor(
    readonly failure: SendFailure,
    cause?: unknown,
  ) {
    super(failure, { cause });
  }
}

export async function enqueue(
  store: LocalStore,
  collection: CollectionName,
  id: string,
  changedAt: number,
  op?: 'purge',
) {
  const key = `${collection}/${id}`;
  const existing = await store.outbox.where('key').equals(key).first();
  if (existing) {
    await store.outbox.update(existing.seq!, { changed_at: changedAt, op });
  } else {
    await store.outbox.add({ key, collection, id, changed_at: changedAt, ...(op ? { op } : {}) });
  }
}

export async function drainOutbox(
  store: LocalStore,
  remote: RemoteWriter,
  onSent: (collection: CollectionName, saved: Collections[CollectionName]) => Promise<void>,
): Promise<void> {
  for (
    let entry = await store.outbox.orderBy('seq').first();
    entry;
    entry = await store.outbox.orderBy('seq').first()
  ) {
    const record =
      entry.op === 'purge' ? undefined : await store.records(entry.collection).get(entry.id);
    if (entry.op === 'purge') {
      await remote.purge(entry.collection, entry.id);
    } else if (record) {
      try {
        await onSent(entry.collection, await remote.upsert(entry.collection, record));
      } catch (error) {
        if (!(error instanceof SendError) || error.failure !== 'rejected') {
          throw error;
        }
        console.error(`Dropped ${entry.key}: the server rejected it`, error.cause);
      }
    }
    await removeIfUnchanged(store, entry);
  }
}

async function removeIfUnchanged(store: LocalStore, sent: OutboxEntry) {
  await store.transaction('rw', store.outbox, async () => {
    const current = await store.outbox.get(sent.seq!);
    if (current?.changed_at === sent.changed_at) {
      await store.outbox.delete(sent.seq!);
    }
  });
}
