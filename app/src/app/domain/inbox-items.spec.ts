import { EMPTY_RECORDS, Note, Todo } from './models';
import { inboxSections } from './inbox-items';

describe('inboxSections', () => {
  it('splits by the day each item was captured, newest first (R16)', () => {
    const butter: Todo = {
      ...EMPTY_RECORDS.todos,
      id: 'a',
      title: 'buy butter',
      created: '2026-10-21 12:32:00.000Z',
    };
    const wall: Note = {
      ...EMPTY_RECORDS.notes,
      id: 'b',
      title: 'Wall is 312 cm',
      created: '2026-10-21 07:12:00.000Z',
    };
    const bike: Todo = {
      ...EMPTY_RECORDS.todos,
      id: 'c',
      title: 'fix the bike light',
      created: '2026-10-19 09:00:00.000Z',
    };

    const sections = inboxSections([butter, bike], [wall], '2026-10-21');

    expect(sections.map((section) => section.label)).toEqual(['Today', 'Earlier']);
    expect(sections[0].items.map((item) => item.record.id)).toEqual(['a', 'b']);
    expect(sections[1].items.map((item) => item.record.id)).toEqual(['c']);
  });
});
