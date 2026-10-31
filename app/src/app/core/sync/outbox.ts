import { LocalStore, OutboxEntry } from '../data/local-store';
import { CollectionName, Collections } from '../../domain/models';
import { logError } from '../logging/log';

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

export interface QueuedChange {
  collection: CollectionName;
  id: string;
  changedAt: number;
  op?: 'purge';
}

export async function enqueue(store: LocalStore, change: QueuedChange) {
  const key = `${change.collection}/${change.id}`;
  const existing = await store.outbox.where('key').equals(key).first();
  if (existing) {
    await store.outbox.update(existing.seq, { changed_at: change.changedAt, op: change.op });
  } else {
    await store.outbox.add({
      key,
      collection: change.collection,
      id: change.id,
      changed_at: change.changedAt,
      ...(change.op ? { op: change.op } : {}),
    });
  }
}

type OnSent = (collection: CollectionName, saved: Collections[CollectionName]) => Promise<void>;

interface Drain {
  store: LocalStore;
  remote: RemoteWriter;
  onSent: OnSent;
}

export async function drainOutbox(
  store: LocalStore,
  remote: RemoteWriter,
  onSent: OnSent,
): Promise<void> {
  const oldest = () => store.outbox.orderBy('seq').first();
  for (let entry = await oldest(); entry; entry = await oldest()) {
    await send(entry, { store, remote, onSent });
    await removeIfUnchanged(store, entry);
  }
}

export function skipIfRejected(error: unknown, dropped: string): void {
  if (!(error instanceof SendError) || error.failure !== 'rejected') {
    throw error;
  }
  logError(`Dropped ${dropped}: the server rejected it`, error.cause);
}

async function send(entry: OutboxEntry, drain: Drain) {
  if (entry.op === 'purge') {
    await drain.remote.purge(entry.collection, entry.id);
    return;
  }
  const record = await drain.store.records(entry.collection).get(entry.id);
  if (!record) {
    return;
  }
  try {
    await drain.onSent(entry.collection, await drain.remote.upsert(entry.collection, record));
  } catch (error) {
    skipIfRejected(error, entry.key);
  }
}

async function removeIfUnchanged(store: LocalStore, sent: OutboxEntry) {
  await store.transaction('rw', store.outbox, async () => {
    const current = await store.outbox.get(sent.seq);
    if (current?.changed_at === sent.changed_at) {
      await store.outbox.delete(sent.seq);
    }
  });
}
