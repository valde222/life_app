import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

const GROUPS = [
  {
    name: 'Anywhere',
    keys: [
      { label: 'Capture', keys: ['Ctrl', 'Space'] },
      { label: 'Search', keys: ['Ctrl', 'K'] },
      { label: 'Shortcuts', keys: ['?'] },
    ],
  },
  {
    name: 'Capture',
    keys: [
      { label: 'Save', keys: ['Enter'] },
      { label: 'Add details', keys: ['Ctrl', 'D'] },
      { label: 'Close', keys: ['Esc'] },
    ],
  },
  {
    name: 'Inbox',
    keys: [
      { label: 'Next item', keys: ['↑', '↓'] },
      { label: 'Move to a list', keys: ['M'] },
      { label: 'Put on Today', keys: ['T'] },
      { label: 'Pick a date', keys: ['D'] },
      { label: 'Open', keys: ['Enter'] },
    ],
  },
  {
    name: 'Agenda',
    keys: [
      { label: 'Previous or next day', keys: ['←', '→'] },
      { label: 'Jump to today', keys: ['T'] },
    ],
  },
];

@Component({
  selector: 'app-shortcuts-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="head">
      <h2 class="t-sheet-title">Keyboard shortcuts.</h2>
      <button type="button" class="close" (click)="ref.close()">Close <kbd>Esc</kbd></button>
    </div>
    <div class="groups">
      @for (group of groups; track group.name) {
        <section>
          <h3 class="eyebrow">{{ group.name }}</h3>
          @for (shortcut of group.keys; track shortcut.label) {
            <div class="row">
              <span>{{ shortcut.label }}</span>
              <span class="keys">
                @for (key of shortcut.keys; track key) {
                  <kbd>{{ key }}</kbd>
                }
              </span>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: min(700px, 92vw);
      padding: 28px 32px 32px;
      border-radius: var(--radius-modal);
      background: var(--surface);
    }
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      h2 {
        margin: 0;
      }
    }
    .close {
      height: 36px;
      padding: 0 var(--space-1-5) 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-control);
      background: var(--bg);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-14);
      font-weight: 600;
    }
    .groups {
      margin-top: var(--space-5);
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--space-6) 40px;
    }
    .eyebrow {
      padding: 0;
      margin-bottom: var(--space-2);
    }
    .row {
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: var(--text-15);
    }
    .keys {
      display: flex;
      gap: var(--space-1);
    }
    kbd {
      min-width: 24px;
      height: 24px;
      padding: 0 var(--space-1-5);
      border-radius: var(--radius-check);
      background: var(--soft);
      font-family: inherit;
      font-size: var(--text-13);
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `,
})
export class ShortcutsOverlay {
  protected readonly ref = inject(DialogRef);
  protected readonly groups = GROUPS;
}
