import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { List } from '../data/models';
import { Icon } from './icon';
import { untilText } from '../time/until';

@Component({
  selector: 'app-next-card',
  imports: [Icon, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="card" [routerLink]="link()">
      <span class="time tabular">{{ time() }}</span>
      <span class="body">
        <span class="title">{{ title() }}</span>
        <span class="soon">{{ soon() }}</span>
      </span>
      @if (event()) {
        <span class="label"><app-icon name="calendar" [size]="12" [stroke]="2.4" />Event</span>
      } @else if (list()) {
        <span class="label">{{ list()!.name }}</span>
      }
    </a>
  `,
  styles: `
    .card {
      padding: 14px 16px;
      border-radius: var(--radius-feature);
      background: var(--accent);
      color: var(--on-accent);
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .time {
      font-size: 24px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.02em;
    }
    .body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .title {
      font-size: 17px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .soon {
      font-size: 12px;
      color: var(--on-accent-2);
    }
    .label {
      height: 24px;
      padding: 0 9px;
      border-radius: var(--radius-label);
      background: rgba(255, 255, 255, 0.18);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
  `,
})
export class NextCard {
  readonly title = input.required<string>();
  readonly link = input.required<string | string[]>();
  readonly time = input.required<string>();
  readonly timeEnd = input('');
  readonly now = input.required<Date>();
  readonly date = input.required<string>();
  readonly event = input(false);
  readonly list = input<List | undefined>();

  protected readonly soon = computed(() => {
    const soon = untilText(this.now(), this.date(), this.time());
    return this.timeEnd() ? `${soon}, until ${this.timeEnd()}` : soon;
  });
}
