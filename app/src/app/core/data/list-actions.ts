import { inject, Injectable } from '@angular/core';
import { pocketBaseTimestamp } from '../../domain/ids';
import { ListDrop, nextOrder, reorderLists } from '../../domain/list-order';
import { Group, List, ListColour } from '../../domain/models';
import { Actions, Undo } from './actions';
import { Repository } from './repository';
import { Store } from './store';

export interface ListFields {
  name: string;
  group: string;
  colour: ListColour;
}

export interface NewGroup {
  name: string;
  order: number;
  lists: { name: string; colour: ListColour }[];
}

@Injectable({ providedIn: 'root' })
export class ListActions {
  private readonly repository = inject(Repository);
  private readonly store = inject(Store);
  private readonly actions = inject(Actions);

  createList(fields: ListFields): Promise<List> {
    return this.repository.save('lists', { ...fields, order: nextOrder(this.store.lists()) });
  }

  createGroup(name: string): Promise<Group> {
    return this.repository.save('groups', { name, order: nextOrder(this.store.groups()) });
  }

  async createGroupWithLists(group: NewGroup): Promise<void> {
    const saved = await this.repository.save('groups', { name: group.name, order: group.order });
    for (const [index, list] of group.lists.entries()) {
      await this.repository.save('lists', {
        ...list,
        group: saved.id,
        order: group.order * 100 + index,
      });
    }
  }

  async updateList(id: string, fields: ListFields): Promise<void> {
    await this.repository.save('lists', { id, ...fields });
  }

  async renameGroup(group: Group, name: string): Promise<void> {
    const trimmed = name.trim();
    if (trimmed && trimmed !== group.name) {
      await this.repository.save('groups', { id: group.id, name: trimmed });
    }
  }

  async moveList(drop: ListDrop): Promise<void> {
    const groupRank = new Map(this.store.sortedGroups().map((group, index) => [group.id, index]));
    const rank = (list: List) => groupRank.get(list.group) ?? Number.NaN;
    const ordered = reorderLists(this.store.openLists(), drop).sort((a, b) => rank(a) - rank(b));
    for (const [order, list] of ordered.entries()) {
      const stored = this.store.list(list.id);
      if (stored?.order !== order || stored.group !== list.group) {
        await this.repository.save('lists', { id: list.id, order, group: list.group });
      }
    }
  }

  async archiveList(id: string): Promise<Undo> {
    await this.repository.save('lists', { id, archived_at: pocketBaseTimestamp() });
    return () => this.restoreList(id);
  }

  async restoreList(id: string): Promise<void> {
    await this.repository.save('lists', { id, archived_at: '' });
  }

  async deleteList(id: string): Promise<Undo> {
    await this.repository.remove('lists', id);
    return () => this.repository.save('lists', { id, deleted_at: '' });
  }

  async deleteListWithItems(id: string): Promise<void> {
    await this.deleteItemsIn(new Set([id]));
    await this.repository.remove('lists', id);
  }

  async deleteGroupWithItems(group: Group, lists: List[]): Promise<void> {
    await this.deleteItemsIn(new Set(lists.map((list) => list.id)));
    for (const list of lists) {
      await this.repository.remove('lists', list.id);
    }
    await this.repository.remove('groups', group.id);
  }

  private async deleteItemsIn(lists: Set<string>) {
    for (const todo of this.store.todos().filter((todo) => lists.has(todo.list))) {
      await this.actions.delete('todos', todo);
    }
    for (const note of this.store.notes().filter((note) => lists.has(note.list))) {
      await this.actions.delete('notes', note);
    }
  }
}
