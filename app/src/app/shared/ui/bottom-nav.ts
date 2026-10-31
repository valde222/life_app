import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '../../core/data/store';
import { Icon, IconName } from './icon';

interface Tab {
  path: string;
  label: string;
  icon: IconName;
}

const TABS_LEFT: Tab[] = [
  { path: '/', label: 'Today', icon: 'sun' },
  { path: '/agenda', label: 'Agenda', icon: 'calendar' },
];
const TABS_RIGHT: Tab[] = [
  { path: '/inbox', label: 'Inbox', icon: 'inbox' },
  { path: '/lists', label: 'Lists', icon: 'lists' },
];

@Component({
  selector: 'app-bottom-nav',
  imports: [Icon, NgTemplateOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Main" [class.tucked]="tucked()">
      @if (showSearch()) {
        <a class="search" routerLink="/search" aria-label="Search"
          ><app-icon name="search" [size]="16" [stroke]="2" />Search</a
        >
      }
      @for (tab of left; track tab.path) {
        <ng-container [ngTemplateOutlet]="tabLink" [ngTemplateOutletContext]="{ $implicit: tab }" />
      }
      <button type="button" class="capture" aria-label="Capture" (click)="capture.emit()">
        <app-icon name="plus" [size]="24" [stroke]="2.6" />
      </button>
      @for (tab of right; track tab.path) {
        <ng-container [ngTemplateOutlet]="tabLink" [ngTemplateOutletContext]="{ $implicit: tab }" />
      }
    </nav>

    <ng-template #tabLink let-tab>
      <a
        class="tab"
        [routerLink]="tab.path"
        routerLinkActive="active"
        [routerLinkActiveOptions]="{ exact: tab.path === '/' }"
        #active="routerLinkActive"
        [attr.aria-current]="active.isActive ? 'page' : null"
      >
        <span class="icon">
          <app-icon [name]="tab.icon" [size]="22" [stroke]="active.isActive ? 2 : 1.8" />
          @if (tab.path === '/inbox' && store.inboxCount()) {
            <span class="badge" [attr.aria-label]="store.inboxCount() + ' in the inbox'">{{
              store.inboxCount()
            }}</span>
          }
        </span>
        {{ tab.label }}
      </a>
    </ng-template>
  `,
  styles: `
    nav {
      position: fixed;
      left: var(--space-4);
      right: var(--space-4);
      bottom: calc(24px + env(safe-area-inset-bottom));
      max-width: 448px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      align-items: center;
      padding: var(--space-2) var(--space-1-5) var(--space-1-5);
      border-radius: var(--radius-nav);
      background: var(--surface);
      box-shadow: var(--shadow-nav);
      z-index: 10;
    }
    .search {
      grid-column: 1 / -1;
      margin: 0 0 var(--space-1);
      height: 40px;
      padding: 0 var(--space-3-5);
      border-radius: var(--radius-modal);
      background: var(--bg);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-15);
      color: var(--muted);
      overflow: hidden;
      transition:
        height 150ms,
        margin 150ms;
    }
    .tucked .search {
      height: 0;
      margin: 0;
    }
    .tab {
      height: 52px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      font-size: var(--text-11);
      font-weight: 500;
      color: var(--ink-2);
    }
    .tab.active {
      font-weight: 700;
      color: var(--ink);
    }
    .icon {
      position: relative;
      display: flex;
    }
    .badge {
      position: absolute;
      top: -4px;
      right: -8px;
      min-width: 16px;
      height: 16px;
      padding: 0 var(--space-1);
      border-radius: var(--radius-label);
      background: var(--accent);
      color: var(--on-accent);
      font-size: var(--text-10);
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .capture {
      justify-self: center;
      width: 52px;
      height: 52px;
      border: 0;
      border-radius: var(--radius-capture);
      background: var(--accent);
      color: var(--on-accent);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `,
})
export class BottomNav {
  protected readonly store = inject(Store);
  protected readonly left = TABS_LEFT;
  protected readonly right = TABS_RIGHT;
  protected readonly tucked = signal(false);

  readonly showSearch = input(true);
  readonly capture = output();

  constructor() {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) > 8) {
        this.tucked.set(y > lastY && y > 40);
        lastY = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', onScroll));
  }
}
