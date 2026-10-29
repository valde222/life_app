import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

const TIP_KEY = 'life.tip.capture';

function seen(): boolean {
  try {
    return localStorage.getItem(TIP_KEY) === 'seen';
  } catch {
    return false;
  }
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
      padding: 14px 16px;
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
      font-size: 15px;
      font-weight: 600;
      line-height: 1.35;
    }
    button {
      margin-top: 12px;
      height: 34px;
      padding: 0 12px;
      border: 0;
      border-radius: var(--radius-chip);
      background: rgba(255, 255, 255, 0.14);
      color: var(--on-accent);
      font-size: 14px;
      font-weight: 700;
    }
  `,
})
export class FirstLaunchTip {
  protected readonly visible = signal(!seen());

  protected dismiss() {
    try {
      localStorage.setItem(TIP_KEY, 'seen');
    } catch {}
    this.visible.set(false);
  }
}
