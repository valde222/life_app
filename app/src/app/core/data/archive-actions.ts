import { inject, Injectable } from '@angular/core';
import { Repository } from './repository';

export type ArchivedKind = 'todos' | 'notes';
export type DeletedKind = ArchivedKind | 'lists';

export interface ItemRef<K> {
  kind: K;
  id: string;
}

@Injectable({ providedIn: 'root' })
export class ArchiveActions {
  private readonly repository = inject(Repository);

  async unarchive(item: ItemRef<ArchivedKind>): Promise<void> {
    await this.repository.save(item.kind, { id: item.id, archived_at: '' });
  }

  async undelete(item: ItemRef<DeletedKind>): Promise<void> {
    await this.repository.save(item.kind, { id: item.id, deleted_at: '' });
  }

  async purgeAll(items: readonly ItemRef<DeletedKind>[]): Promise<void> {
    for (const item of items) {
      await this.repository.purge(item.kind, item.id);
    }
  }
}
