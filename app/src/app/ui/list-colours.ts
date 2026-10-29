import { ListColour } from '../data/models';

export const LIST_COLOUR_TOKENS: Record<ListColour, string> = {
  blue: 'life',
  purple: 'apartment',
  teal: 'shopping',
  green: 'music',
  orange: 'client-a',
  pink: 'client-b',
  grey: 'grey',
};

export const LIST_COLOURS = Object.keys(LIST_COLOUR_TOKENS) as ListColour[];

export function listColourStyle(colour: ListColour | undefined) {
  const token = LIST_COLOUR_TOKENS[colour ?? 'grey'];
  return { '--pair-bg': `var(--${token}-bg)`, '--pair-fg': `var(--${token}-fg)` };
}
