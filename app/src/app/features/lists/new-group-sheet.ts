import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Group } from '../../domain/models';
import { ListActions } from '../../core/data/list-actions';
import { Sheet } from '../../shared/ui/sheet';

@Component({
  selector: 'app-new-group-sheet',
  imports: [FormsModule, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet heading="New group.">
      <label class="card name">
        <span>Name</span>
        <input
          name="name"
          [ngModel]="name()"
          (ngModelChange)="name.set($event)"
          (keydown.enter)="create()"
        />
      </label>
      <button type="button" class="btn btn-primary" [disabled]="!name().trim()" (click)="create()">
        Create group
      </button>
      <button type="button" class="btn btn-secondary" (click)="ref.close()">Cancel</button>
    </app-sheet>
  `,
  styleUrl: './name-sheet.scss',
})
export class NewGroupSheet {
  protected readonly ref = inject(DialogRef<Group>);
  private readonly lists = inject(ListActions);
  protected readonly name = signal('');

  protected async create() {
    const name = this.name().trim();
    if (!name) {
      return;
    }
    this.ref.close(await this.lists.createGroup(name));
  }
}
