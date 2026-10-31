import { EMPTY_RECORDS, Note } from './models';
import { noteConnections, noteDateLabel } from './note-view';
import { pocketBaseTimestamp } from './time/timestamps';

const note = (id: string, links: string[] = []): Note => ({ ...EMPTY_RECORDS.notes, id, links });

describe('note view', () => {
  it('lists linked notes and todos, and notes linking here that it does not link back', () => {
    const self = { ...note('self', ['a']), todos: ['t1'] };
    const all = {
      notes: [self, note('a', ['self']), note('b', ['self']), note('c')],
      todos: [
        { ...EMPTY_RECORDS.todos, id: 't1' },
        { ...EMPTY_RECORDS.todos, id: 't2' },
      ],
    };
    const connections = noteConnections(self, 'self', all);
    expect(connections.notes.map((each) => each.id)).toEqual(['a']);
    expect(connections.todos.map((each) => each.id)).toEqual(['t1']);
    expect(connections.linkedFrom.map((each) => each.id)).toEqual(['b']);
  });

  it('dates a note Today, or by its short date', () => {
    expect(noteDateLabel(undefined, '2026-10-31')).toBe('Today');
    const created = pocketBaseTimestamp(new Date(2026, 9, 3, 12));
    expect(noteDateLabel(created, '2026-10-31')).toBe('Oct 3');
  });
});
