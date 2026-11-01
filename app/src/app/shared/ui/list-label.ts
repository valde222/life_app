import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { List } from '../../domain/models';
import { Icon } from './icon';
import { listColourStyle } from './list-colours';

@Component({
  selector: 'app-list-label',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style]': 'style()', '[class.event]': 'event()' },
  template: `
    @if (event()) {
      <app-icon name="calendar" [size]="12" [stroke]="2.4" />Event
    } @else {
      <span class="name">{{ list()?.name }}</span>
    }
  `,
  styles: `
    :host {
      height: 24px;
      padding: 0 9px;
      border-radius: var(--radius-label);
      background: var(--pair-bg);
      color: var(--pair-fg);
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: var(--text-12);
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
      min-width: 0;
      max-width: 60%;
    }
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class ListLabel {
  readonly list = input<List | undefined>();
  readonly event = input(false);

  protected readonly style = computed(() =>
    listColourStyle(this.event() ? 'grey' : this.list()?.colour),
  );
}
