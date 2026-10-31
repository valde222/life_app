import { CollectionName, Collections } from '../../domain/models';

export interface Page {
  number: number;
  size: number;
}

export interface RemoteChange<C extends CollectionName> {
  deleted: boolean;
  record: Collections[C];
}

export interface RemoteReader {
  changedSince<C extends CollectionName>(
    collection: C,
    cursor: string,
    page: Page,
  ): Promise<Collections[C][]>;
  deletedIds(collection: CollectionName): Promise<string[]>;
  subscribe<C extends CollectionName>(
    collection: C,
    onChange: (change: RemoteChange<C>) => void,
  ): Promise<() => Promise<void>>;
}
