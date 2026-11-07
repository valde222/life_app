import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { clearLoggedErrors, LoggedError, loggedErrors } from '../../core/logging/log';
import { Icon } from '../../shared/ui/icon';

export function errorLogText(entries: LoggedError[]): string {
  return entries.map((entry) => `${entry.at}  ${entry.context}\n${entry.message}`).join('\n\n');
}

@Component({
  selector: 'app-error-log-page',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <a class="back" routerLink="/settings"
        ><app-icon name="chevron-left" [size]="18" [stroke]="2.2" />Settings</a
      >
    </header>
    <main class="body">
      <h1 class="t-display">Error log.</h1>
      @if (entries().length) {
        <ol class="options list">
          @for (entry of entries(); track $index) {
            <li class="entry">
              <div class="meta">{{ entry.at }}</div>
              <div class="context">{{ entry.context }}</div>
              <div class="message">{{ entry.message }}</div>
            </li>
          }
        </ol>
        <button type="button" class="btn btn-secondary" (click)="copy()">
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
        <button type="button" class="btn btn-secondary" (click)="clear()">Clear</button>
      } @else {
        <p class="t-empty-title empty">No errors.</p>
      }
    </main>
  `,
  styles: `
    :host {
      display: block;
      max-width: 480px;
      margin: 0 auto;
    }
    .bar {
      padding: calc(44px + env(safe-area-inset-top)) var(--space-2) 0 var(--space-1);
    }
    .body {
      padding: 0 var(--space-4) 48px;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      h1 {
        margin: 0 var(--space-1) var(--space-2);
      }
    }
    .list {
      margin: 0;
      padding: 0 var(--space-4);
      list-style: none;
    }
    .entry {
      padding: var(--space-3) 0;
      user-select: text;
      overflow-wrap: anywhere;
    }
    .meta {
      font-size: var(--text-12);
      color: var(--muted);
    }
    .context {
      font-size: var(--text-15);
      font-weight: 600;
    }
    .message {
      font-size: var(--text-13);
      color: var(--ink-2);
    }
    .empty {
      margin: var(--space-6) 0 0;
      text-align: center;
    }
  `,
})
export class ErrorLogPage {
  protected readonly entries = signal(loggedErrors());
  protected readonly copied = signal(false);

  protected async copy() {
    await navigator.clipboard.writeText(errorLogText(this.entries()));
    this.copied.set(true);
  }

  protected clear() {
    clearLoggedErrors();
    this.entries.set([]);
  }
}
