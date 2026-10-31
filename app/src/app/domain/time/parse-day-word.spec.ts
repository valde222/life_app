import { parseDayWord } from './day-words';

const WEDNESDAY = '2026-10-21';

describe('parseDayWord', () => {
  it('takes a weekday at the end of the title as the next such day', () => {
    expect(parseDayWord('Set up Client A staging fri', WEDNESDAY)).toEqual({
      title: 'Set up Client A staging',
      date: '2026-10-23',
    });
    expect(parseDayWord('Call mum Wednesday', WEDNESDAY)?.date).toBe('2026-10-28');
  });

  it('understands today, tomorrow, next week and this weekend', () => {
    expect(parseDayWord('a today', WEDNESDAY)?.date).toBe(WEDNESDAY);
    expect(parseDayWord('a tomorrow', WEDNESDAY)?.date).toBe('2026-10-22');
    expect(parseDayWord('a next week', WEDNESDAY)?.date).toBe('2026-10-26');
    expect(parseDayWord('a this weekend', WEDNESDAY)?.date).toBe('2026-10-24');
  });

  it('leaves titles without a day word alone', () => {
    expect(parseDayWord('buy butter', WEDNESDAY)).toBeNull();
    expect(parseDayWord('friday', WEDNESDAY)).toBeNull();
  });
});
