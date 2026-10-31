import { EMPTY_RECORDS } from './models';
import { deletedItems, deletedSub } from './deleted-items';

describe('Recently deleted (R27)', () => {
  const at = (date: string) => new Date(`${date}T12:00:00`).toISOString().replace('T', ' ');

  it('shows days left out of 30 and drops anything older', () => {
    const items = deletedItems(
      [{ ...EMPTY_RECORDS.todos, id: 'a', title: 'Old', deleted_at: at('2026-09-01') }],
      [{ ...EMPTY_RECORDS.notes, id: 'b', title: 'Sofa ideas', deleted_at: at('2026-10-18') }],
      [],
      '2026-10-21',
    );
    expect(items.map((item) => item.id)).toEqual(['b']);
    expect(deletedSub(items[0])).toBe('Note, 27 days left');
  });
});
