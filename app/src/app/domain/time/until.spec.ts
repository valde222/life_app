import { untilText } from './until';

describe('untilText', () => {
  const at = (time: string) => new Date(`2026-10-21T${time}:00`);

  it('says how soon in hours and minutes', () => {
    expect(untilText(at('10:40'), '2026-10-21', '12:00')).toBe('in 1h 20m');
    expect(untilText(at('11:45'), '2026-10-21', '12:00')).toBe('in 15m');
    expect(untilText(at('10:00'), '2026-10-21', '12:00')).toBe('in 2h');
  });
});
