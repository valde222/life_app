import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { readPreference, writePreference } from '../../core/platform/preferences';

const TIP_KEY = 'life.tip.capture';

function seen(): boolean {
  return readPreference(TIP_KEY) === 'seen';
}

@Component({
  selector: 'app-first-launch-tip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <div class="tip" role="note">
        <p>Capture anything with +. It waits in Inbox until you sort it.</p>
        <button type="button" (click)="dismiss()">Got it</button>
      </div>
    }
  `,
  styles: `
    .tip {
      position: fixed;
      left: 54px;
      right: 54px;
      bottom: calc(150px + env(safe-area-inset-bottom));
      max-width: 292px;
      margin: 0 auto;
      padding: var(--space-3-5) var(--space-4);
      border-radius: var(--radius-feature);
      background: var(--ink);
      color: var(--on-accent);
      z-index: 11;
    }
    .tip::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: -6px;
      width: 12px;
      height: 12px;
      background: var(--ink);
      transform: translateX(-50%) rotate(45deg);
    }
    p {
      margin: 0;
      font-size: var(--text-15);
      font-weight: 600;
      line-height: 1.35;
    }
    button {
      margin-top: var(--space-3);
      height: 34px;
      padding: 0 var(--space-3);
      border: 0;
      border-radius: var(--radius-chip);
      background: var(--on-accent-faint);
      color: var(--on-accent);
      font-size: var(--text-14);
      font-weight: 700;
    }
  `,
})
export class FirstLaunchTip {
  protected readonly visible = signal(!seen());

  protected dismiss() {
    writePreference(TIP_KEY, 'seen');
    this.visible.set(false);
  }
}
