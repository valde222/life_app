import { LocalStore } from '../data/local-store';
import { CollectionName, Collections } from '../../domain/models';
import { omitFields } from '../../domain/records';

const SERVER_ONLY_FIELDS = ['collectionId', 'collectionName', 'expand'];
const SERVER_OWNED_FIELDS: Partial<Record<CollectionName, string[]>> = {
  notes: ['photos', 'files', 'file_names'],
};

export function withoutServerFields<T extends object>(record: T): T {
  return omitFields(record, SERVER_ONLY_FIELDS);
}

export async function applyRemote<C extends CollectionName>(
  store: LocalStore,
  collection: C,
  records: Collections[C][],
): Promise<void> {
  const table = store.records(collection);
  await store.transaction('rw', table, store.outbox, async () => {
    for (const remote of records) {
      const local = await table.get(remote.id);
      const ownVersion = local?.changed_at === remote.changed_at;
      if (local && !ownVersion && (await isQueued(store, collection, local.id))) {
        await table.put({ ...local, ...serverOwned(collection, remote) });
      } else {
        await table.put(withoutServerFields(remote));
      }
    }
  });
}

async function isQueued(store: LocalStore, collection: CollectionName, id: string) {
  return (await store.outbox.where('key').equals(`${collection}/${id}`).count()) > 0;
}

function serverOwned<C extends CollectionName>(
  collection: C,
  remote: Collections[C],
): Partial<Collections[C]> {
  const fields = SERVER_OWNED_FIELDS[collection] ?? [];
  return Object.fromEntries(
    fields.map((field) => [field, remote[field as keyof Collections[C]]]),
  ) as Partial<Collections[C]>;
}
