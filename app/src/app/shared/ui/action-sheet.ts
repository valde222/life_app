import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Sheet } from './sheet';

export interface ActionOption<T extends string = string> {
  value: T;
  label: string;
  danger?: boolean;
}

export interface ActionSheetData<T extends string = string> {
  title: string;
  options: ActionOption<T>[];
}

@Component({
  selector: 'app-action-sheet',
  imports: [Sheet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-sheet>
      <h2 class="t-sheet-title-small title">{{ data.title }}</h2>
      <div class="options">
        @for (option of safe(); track option.value) {
          <button type="button" class="option" (click)="ref.close(option.value)">
            {{ option.label }}
          </button>
        }
      </div>
      @if (danger().length) {
        <div class="options">
          @for (option of danger(); track option.value) {
            <button type="button" class="option danger" (click)="ref.close(option.value)">
              {{ option.label }}
            </button>
          }
        </div>
      }
      <button type="button" class="btn btn-secondary" (click)="ref.close()">Cancel</button>
    </app-sheet>
  `,
  styles: `
    .title {
      margin: 0 var(--space-1) var(--space-1);
    }
    .option {
      font-size: var(--text-16);
    }
    .btn {
      font-size: var(--text-15);
    }
  `,
})
export class ActionSheet {
  protected readonly ref = inject(DialogRef<string>);
  protected readonly data = inject<ActionSheetData>(DIALOG_DATA);
  protected readonly safe = computed(() => this.data.options.filter((option) => !option.danger));
  protected readonly danger = computed(() => this.data.options.filter((option) => option.danger));
}
