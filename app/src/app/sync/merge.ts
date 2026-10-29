import { LocalStore } from '../data/local-store';
import { CollectionName, Collections } from '../data/models';

const SERVER_ONLY_FIELDS = ['collectionId', 'collectionName', 'expand'];

export function isAtLeastAsNew(
  remote: { changed_at: number },
  local: { changed_at: number } | undefined,
) {
  return !local || remote.changed_at >= local.changed_at;
}

export function withoutServerFields<T extends object>(record: T): T {
  const copy = { ...record } as Record<string, unknown>;
  for (const field of SERVER_ONLY_FIELDS) {
    delete copy[field];
  }
  return copy as T;
}

export async function applyRemote<C extends CollectionName>(
  store: LocalStore,
  collection: C,
  records: Collections[C][],
): Promise<void> {
  const table = store.records(collection);
  await store.transaction('rw', table, async () => {
    for (const remote of records) {
      const local = await table.get(remote.id);
      if (isAtLeastAsNew(remote, local)) {
        await table.put(withoutServerFields(remote));
      }
    }
  });
}
