import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Toasts } from '../../core/toasts/toasts';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toasts.current(); as toast) {
      <div class="toast" role="status">
        <div class="title">{{ toast.title }}</div>
        @if (toast.action; as action) {
          <button type="button" class="action" (click)="toasts.run(action.run)">
            {{ action.label }}
          </button>
        }
        @if (toast.undo; as undo) {
          <button type="button" class="undo" (click)="toasts.run(undo)">Undo</button>
        }
      </div>
    }
  `,
  styles: `
    .toast {
      position: fixed;
      left: var(--space-4);
      right: var(--space-4);
      bottom: calc(164px + env(safe-area-inset-bottom));
      max-width: 448px;
      margin: 0 auto;
      height: 56px;
      padding: 0 var(--space-1-5) 0 var(--space-4-5);
      border-radius: var(--radius-feature);
      background: var(--accent);
      display: flex;
      align-items: center;
      gap: var(--space-1-5);
      z-index: 20;
    }
    .title {
      flex: 1;
      min-width: 0;
      font-size: var(--text-15);
      font-weight: 600;
      color: var(--on-accent);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    button {
      height: 44px;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-control);
      font-size: var(--text-14);
      font-weight: 700;
    }
    .action {
      background: var(--on-accent-faint);
      color: var(--on-accent);
    }
    .undo {
      padding: 0 var(--space-3-5);
      background: var(--surface);
      color: var(--accent);
    }
  `,
})
export class Toast {
  protected readonly toasts = inject(Toasts);
}
