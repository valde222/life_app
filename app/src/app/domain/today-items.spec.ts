import { EMPTY_RECORDS, Todo } from './models';
import { todayItems } from './today-items';

let next = 0;
const todo = (fields: Partial<Todo>): Todo => ({
  ...EMPTY_RECORDS.todos,
  id: `todo${next++}`,
  ...fields,
});
const at = (time: string) => new Date(`2026-10-21T${time}:00`);

describe('todayItems', () => {
  const lunch = todo({
    title: 'Lunch with sister',
    date: '2026-10-21',
    time: '12:00',
    is_event: true,
  });
  const landlord = todo({ title: 'Call the landlord', date: '2026-10-21', time: '17:00' });
  const taxes = todo({ title: 'Pay taxes', date: '2026-10-21' });
  const coffee = todo({
    title: 'Coffee beans',
    date: '2026-10-21',
    done_at: '2026-10-21 08:00:00.000Z',
  });
  const dentist = todo({ title: 'Book the dentist', date: '2026-10-20' });
  const someday = todo({ title: 'Learn to juggle' });
  const chore = todo({ title: 'Clean bathroom', date: '2026-10-20', repeat_mode: 'rough' });
  const all = [lunch, landlord, taxes, coffee, dentist, someday, chore];

  it('splits today into the next card, Scheduled and Anytime (R5, R6)', () => {
    const items = todayItems(all, at('10:40'));
    expect(items.next).toBe(lunch);
    expect(items.scheduled).toEqual([landlord]);
    expect(items.anytime).toEqual([taxes]);
  });

  it('moves the next card on once its time has passed', () => {
    const items = todayItems(all, at('12:30'));
    expect(items.next).toBe(landlord);
    expect(items.scheduled).toEqual([lunch]);
  });

  it('folds done items away and counts done / total (R7, R11)', () => {
    const items = todayItems(all, at('10:40'));
    expect(items.done).toEqual([coffee]);
    expect(items.total).toBe(4);
  });

  it('keeps left over todos off Today (R8)', () => {
    const items = todayItems(all, at('10:40'));
    expect(items.leftOver).toEqual([dentist]);
    expect([...items.scheduled, ...items.anytime]).not.toContain(dentist);
  });
});
