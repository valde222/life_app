import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, inject, Injectable, input } from '@angular/core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Sheets {
  private readonly dialog = inject(Dialog);

  open<R, D = unknown, C = unknown>(
    component: ComponentType<C>,
    data?: D,
    config: Partial<DialogConfig<D, DialogRef<R, C>>> = {},
  ) {
    const ref = this.dialog.open<R, D, C>(component, {
      data,
      panelClass: 'sheet-panel',
      backdropClass: 'sheet-backdrop',
      autoFocus: 'first-tabbable',
      ...config,
    });
    return { ref, closed: firstValueFrom(ref.closed) };
  }

  openFull<R, D = unknown, C = unknown>(component: ComponentType<C>, data?: D) {
    return this.open<R, D, C>(component, data, { panelClass: ['sheet-panel', 'sheet-full'] });
  }
}

@Component({
  selector: 'app-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="handle" aria-hidden="true"></div>
    @if (heading()) {
      <h2 class="t-sheet-title">{{ heading() }}</h2>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: 10px var(--space-4) 32px;
      max-height: 92dvh;
      overflow-y: auto;
    }
    .handle {
      align-self: center;
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--control);
      margin-bottom: var(--space-2);
      flex-shrink: 0;
    }
    h2 {
      margin: 0 var(--space-1) var(--space-1);
    }
  `,
})
export class Sheet {
  readonly heading = input('');
}

export function closeWith<R>(ref: DialogRef<R>, result: R) {
  ref.close(result);
}
