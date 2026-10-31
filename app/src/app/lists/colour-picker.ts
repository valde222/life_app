import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { ListColour } from '../domain/models';
import { LIST_COLOURS, listColourStyle } from '../shared/ui/list-colours';

const NAMES: Record<ListColour, string> = {
  blue: 'Blue',
  purple: 'Purple',
  teal: 'Teal',
  green: 'Green',
  orange: 'Orange',
  pink: 'Pink',
  grey: 'Grey',
};

@Component({
  selector: 'app-colour-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (colour of colours; track colour) {
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="colour === value()"
        [attr.aria-label]="names[colour]"
        [style]="style(colour)"
        [class.on]="colour === value()"
        (click)="value.set(colour)"
      ></button>
    }
  `,
  host: { role: 'radiogroup', 'aria-label': 'Colour' },
  styles: `
    :host {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    button {
      width: 40px;
      height: 40px;
      padding: 0;
      border: 0;
      border-radius: var(--radius-control);
      background: var(--pair-bg);
      box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--pair-fg) 20%, transparent);
    }
    .on {
      box-shadow: inset 0 0 0 2.5px var(--accent);
    }
  `,
})
export class ColourPicker {
  readonly value = model<ListColour>('grey');
  protected readonly colours = LIST_COLOURS;
  protected readonly names = NAMES;
  protected readonly style = listColourStyle;
}
