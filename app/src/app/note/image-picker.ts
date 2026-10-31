import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Icon } from '../shared/ui/icon';
import { Sheet } from '../shared/ui/sheet';

@Component({
  selector: 'app-image-picker',
  imports: [Icon, Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet heading="Add a photo.">
      <div class="sources">
        <label class="btn btn-secondary">
          <app-icon name="camera" [size]="18" [stroke]="2" />Take photo
          <input
            class="visually-hidden"
            type="file"
            accept="image/*"
            capture="environment"
            (change)="picked($event)"
          />
        </label>
        <label class="btn btn-secondary">
          <app-icon name="folder" [size]="18" [stroke]="2" />Files
          <input
            class="visually-hidden"
            type="file"
            accept="image/*"
            multiple
            aria-label="Choose photos"
            (change)="picked($event)"
          />
        </label>
      </div>
      <button type="button" class="btn btn-secondary" (click)="ref.close()">Cancel</button>
    </app-sheet>
  `,
  styles: `
    .sources {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-2);
    }
    label {
      cursor: pointer;
    }
  `,
})
export class ImagePicker {
  protected readonly ref = inject(DialogRef<File[]>);

  protected picked(event: Event) {
    const files = [...((event.target as HTMLInputElement).files ?? [])];
    if (files.length) {
      this.ref.close(files);
    }
  }
}
