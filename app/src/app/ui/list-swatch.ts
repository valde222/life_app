import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ListColour } from '../domain/models';
import { listColourStyle } from './list-colours';

@Component({
  selector: 'app-list-swatch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style]': 'style()', 'aria-hidden': 'true' },
  template: '',
  styles: `
    :host {
      width: 12px;
      height: var(--swatch-height, 28px);
      border-radius: var(--radius-tiny);
      background: var(--pair-bg);
      box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--pair-fg) 20%, transparent);
      flex-shrink: 0;
    }
  `,
})
export class ListSwatch {
  readonly colour = input<ListColour>('grey');
  protected readonly style = computed(() => listColourStyle(this.colour()));
}
