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
import { ListActions } from '../../core/data/list-actions';
import { Group, List } from '../../domain/models';
import { Store } from '../../core/data/store';
import { Icon } from '../../shared/ui/icon';
import { ListLabel } from '../../shared/ui/list-label';
import { Sheets } from '../../shared/ui/sheet';
import { NewGroupSheet } from './new-group-sheet';
import { NewListData, NewListSheet } from './new-list-sheet';

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
  private readonly lists = inject(ListActions);
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
    await this.lists.moveList({
      moved: event.item.data,
      group: event.container.data,
      index: event.currentIndex,
    });
  }

  protected startRename(group: Group) {
    this.newName.set(group.name);
    this.renaming.set(group.id);
  }

  protected async rename(group: Group) {
    await this.lists.renameGroup(group, this.newName());
    this.renaming.set(null);
  }

  protected async deleteGroup(group: Group, lists: List[]) {
    if (this.confirming() !== group.id) {
      this.confirming.set(group.id);
      return;
    }
    await this.lists.deleteGroupWithItems(group, lists);
    this.confirming.set(null);
  }

  protected newList(group: Group) {
    this.sheets.open<List, NewListData>(NewListSheet, { group: group.id }, { autoFocus: 'input' });
  }

  protected newGroup() {
    this.sheets.open(NewGroupSheet, undefined, { autoFocus: 'input' });
  }
}
