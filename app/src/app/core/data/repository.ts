import { Signal } from '@angular/core';
import { CollectionName, Collections, Draft } from '../../domain/models';

export abstract class Repository {
  abstract save<C extends CollectionName>(collection: C, draft: Draft<C>): Promise<Collections[C]>;
  abstract remove<C extends CollectionName>(collection: C, id: string): Promise<Collections[C]>;
  abstract purge(collection: CollectionName, id: string): Promise<void>;
  abstract all<C extends CollectionName>(collection: C): Promise<Collections[C][]>;
  abstract count(collection: CollectionName): Promise<number>;
  abstract watchAll<C extends CollectionName>(collection: C): Signal<Collections[C][]>;
  abstract watch<C extends CollectionName>(
    collection: C,
    keep?: (record: Collections[C]) => boolean,
  ): Signal<Collections[C][]>;
}
