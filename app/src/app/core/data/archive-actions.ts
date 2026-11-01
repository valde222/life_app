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
    await this.repository.save(item.kind, {
      id: item.id,
      archived_at: '',
      ...(await this.homeless(item)),
    });
  }

  async undelete(item: ItemRef<DeletedKind>): Promise<void> {
    const rehome =
      item.kind === 'lists' ? {} : await this.homeless({ kind: item.kind, id: item.id });
    await this.repository.save(item.kind, { id: item.id, deleted_at: '', ...rehome });
  }

  async purgeAll(items: readonly ItemRef<DeletedKind>[]): Promise<void> {
    for (const item of items) {
      await this.repository.purge(item.kind, item.id);
    }
  }

  private async homeless(item: ItemRef<ArchivedKind>): Promise<{ list?: string; inbox?: boolean }> {
    const records: { id: string; list: string }[] = await this.repository.all(item.kind);
    const list = records.find((record) => record.id === item.id)?.list;
    if (!list) {
      return {};
    }
    const home = (await this.repository.all('lists')).find((each) => each.id === list);
    return home && !home.deleted_at ? {} : { list: '', inbox: true };
  }
}
