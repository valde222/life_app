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
      padding: 0 6px 0 18px;
      border-radius: var(--radius-feature);
      background: var(--accent);
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 20;
    }
    .title {
      flex: 1;
      min-width: 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--on-accent);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    button {
      height: 44px;
      padding: 0 12px;
      border: 0;
      border-radius: var(--radius-control);
      font-size: 14px;
      font-weight: 700;
    }
    .action {
      background: rgba(255, 255, 255, 0.14);
      color: var(--on-accent);
    }
    .undo {
      padding: 0 14px;
      background: var(--surface);
      color: var(--accent);
    }
  `,
})
export class Toast {
  protected readonly toasts = inject(Toasts);
}
