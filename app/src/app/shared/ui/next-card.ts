import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { List } from '../../domain/models';
import { Icon } from './icon';
import { untilText } from '../../domain/time/until';

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
      padding: var(--space-3-5) var(--space-4);
      border-radius: var(--radius-feature);
      background: var(--accent);
      color: var(--on-accent);
      display: flex;
      align-items: center;
      gap: var(--space-3-5);
    }
    .time {
      font-size: var(--text-24);
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
      font-size: var(--text-17);
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .soon {
      font-size: var(--text-12);
      color: var(--on-accent-2);
    }
    .label {
      height: 24px;
      padding: 0 9px;
      border-radius: var(--radius-label);
      background: var(--on-accent-soft);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: var(--text-12);
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
