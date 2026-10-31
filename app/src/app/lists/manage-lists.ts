import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Actions } from '../data/actions';
import { Group, List } from '../domain/models';
import { Repository } from '../data/repository';
import { Store } from '../data/store';
import { Icon } from '../ui/icon';
import { ListLabel } from '../ui/list-label';
import { Sheets } from '../ui/sheet';
import { NewGroupSheet } from './new-group-sheet';
import { NewListData, NewListSheet } from './new-list-sheet';

export function reorder(
  lists: List[],
  moved: List,
  targetGroup: string,
  targetIndex: number,
): List[] {
  const others = lists.filter((list) => list.id !== moved.id);
  const inTarget = others.filter((list) => list.group === targetGroup);
  inTarget.splice(targetIndex, 0, { ...moved, group: targetGroup });
  const rest = others.filter((list) => list.group !== targetGroup);
  return [...rest, ...inTarget];
}

@Component({
  selector: 'app-manage-lists',
  imports: [
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    CdkDropListGroup,
    FormsModule,
    Icon,
    ListLabel,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-lists.html',
  styleUrl: './manage-lists.scss',
})
export class ManageLists {
  private readonly store = inject(Store);
  private readonly repository = inject(Repository);
  private readonly actions = inject(Actions);
  private readonly sheets = inject(Sheets);
  protected readonly router = inject(Router);

  protected readonly groups = computed(() =>
    this.store.sortedGroups().map((group) => ({ group, lists: this.store.listsIn(group.id) })),
  );
  protected readonly renaming = signal<string | null>(null);
  protected readonly confirming = signal<string | null>(null);
  protected readonly newName = signal('');

  protected count(list: List) {
    return this.store.countsByList().get(list.id)?.todos ?? 0;
  }

  protected async drop(event: CdkDragDrop<string, string, List>) {
    const ordered = reorder(
      this.store.openLists(),
      event.item.data,
      event.container.data,
      event.currentIndex,
    );
    const groupOrder = new Map(this.store.sortedGroups().map((group, index) => [group.id, index]));
    ordered.sort((a, b) => groupOrder.get(a.group)! - groupOrder.get(b.group)!);
    for (const [order, list] of ordered.entries()) {
      const stored = this.store.list(list.id)!;
      if (stored.order !== order || stored.group !== list.group) {
        await this.repository.save('lists', { id: list.id, order, group: list.group });
      }
    }
  }

  protected startRename(group: Group) {
    this.newName.set(group.name);
    this.renaming.set(group.id);
  }

  protected async rename(group: Group) {
    const name = this.newName().trim();
    if (name && name !== group.name) {
      await this.repository.save('groups', { id: group.id, name });
    }
    this.renaming.set(null);
  }

  protected async deleteGroup(group: Group, lists: List[]) {
    if (this.confirming() !== group.id) {
      this.confirming.set(group.id);
      return;
    }
    const listIds = new Set(lists.map((list) => list.id));
    for (const todo of this.store.todos().filter((todo) => listIds.has(todo.list))) {
      await this.actions.delete('todos', todo);
    }
    for (const note of this.store.notes().filter((note) => listIds.has(note.list))) {
      await this.actions.delete('notes', note);
    }
    for (const list of lists) {
      await this.repository.remove('lists', list.id);
    }
    await this.repository.remove('groups', group.id);
    this.confirming.set(null);
  }

  protected newList(group: Group) {
    this.sheets.open<List, NewListData>(NewListSheet, { group: group.id }, { autoFocus: 'input' });
  }

  protected newGroup() {
    this.sheets.open(NewGroupSheet, undefined, { autoFocus: 'input' });
  }
}
