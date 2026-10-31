import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { List, ListColour } from '../../domain/models';
import { ListActions } from '../../core/data/list-actions';
import { Store } from '../../core/data/store';
import { LIST_COLOURS } from '../../shared/ui/list-colours';
import { Sheet } from '../../shared/ui/sheet';
import { ColourPicker } from './colour-picker';

export interface NewListData {
  group: string;
}

const WARM: ListColour[] = ['orange', 'pink'];

export function nextColour(groupName: string, used: ListColour[]): ListColour {
  const preferred =
    groupName === 'Work'
      ? [...WARM, ...LIST_COLOURS]
      : LIST_COLOURS.filter((colour) => !WARM.includes(colour));
  return (
    preferred.find((colour) => !used.includes(colour)) ?? preferred[used.length % preferred.length]
  );
}

@Component({
  selector: 'app-new-list-sheet',
  imports: [ColourPicker, FormsModule, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet [heading]="'New list in ' + groupName() + '.'">
      <label class="card name">
        <span>Name</span>
        <input
          name="name"
          [ngModel]="name()"
          (ngModelChange)="name.set($event)"
          (keydown.enter)="create()"
        />
      </label>
      <h3 class="eyebrow">Colour</h3>
      <app-colour-picker [(value)]="colour" />
      <button type="button" class="btn btn-primary" [disabled]="!name().trim()" (click)="create()">
        Create list
      </button>
      <button type="button" class="btn btn-secondary" (click)="ref.close()">Cancel</button>
    </app-sheet>
  `,
  styleUrl: './name-sheet.scss',
})
export class NewListSheet {
  protected readonly ref = inject(DialogRef<List>);
  private readonly data = inject<NewListData>(DIALOG_DATA);
  private readonly store = inject(Store);
  private readonly lists = inject(ListActions);

  protected readonly groupName = computed(() => this.store.group(this.data.group)?.name ?? '');
  protected readonly name = signal('');
  protected readonly colour = signal<ListColour>(
    nextColour(
      this.groupName(),
      this.store.listsIn(this.data.group).map((list) => list.colour),
    ),
  );

  protected async create() {
    const name = this.name().trim();
    if (!name) {
      return;
    }
    this.ref.close(
      await this.lists.createList({ name, group: this.data.group, colour: this.colour() }),
    );
  }
}
