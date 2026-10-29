import { ListColour } from '../data/models';

export const GROUP_SUGGESTIONS = [
  { name: 'Life', picked: true },
  { name: 'Work', picked: true },
  { name: 'Family', picked: false },
  { name: 'Hobbies', picked: false },
  { name: 'Study', picked: false },
];

export const LIST_SUGGESTIONS: Record<string, { name: string; picked: boolean }[]> = {
  Life: [
    { name: 'Life', picked: true },
    { name: 'Shopping', picked: true },
    { name: 'Apartment', picked: true },
    { name: 'Someday', picked: false },
  ],
  Work: [
    { name: 'Client A', picked: true },
    { name: 'Client B', picked: false },
    { name: 'Admin', picked: false },
  ],
  Family: [{ name: 'Family', picked: true }],
  Hobbies: [{ name: 'Hobbies', picked: true }],
  Study: [{ name: 'Study', picked: true }],
};

const COOL: ListColour[] = ['blue', 'teal', 'purple', 'green', 'grey'];
const WARM: ListColour[] = ['orange', 'pink', 'grey'];

export function colourFor(groupName: string, index: number): ListColour {
  const palette = groupName === 'Work' ? WARM : COOL;
  return palette[index % palette.length];
}
