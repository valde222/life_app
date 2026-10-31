import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Group } from '../domain/models';
import { Repository } from '../core/data/repository';
import { Store } from '../core/data/store';
import { Sheet } from '../shared/ui/sheet';

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
  private readonly store = inject(Store);
  private readonly repository = inject(Repository);
  protected readonly name = signal('');

  protected async create() {
    const name = this.name().trim();
    if (!name) {
      return;
    }
    const order = Math.max(-1, ...this.store.groups().map((group) => group.order)) + 1;
    this.ref.close(await this.repository.save('groups', { name, order }));
  }
}
