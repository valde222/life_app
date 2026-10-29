import { addDays, daysBetween, longDate, relativeDay } from './local-date';

describe('local dates', () => {
  it('formats like the screens', () => {
    expect(longDate('2026-10-21')).toBe('Wed 21 Oct');
  });

  it('counts days across a month end', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
    expect(daysBetween('2026-10-12', '2026-10-21')).toBe(9);
  });

  it('names nearby days', () => {
    expect(relativeDay('2026-10-21', '2026-10-21')).toBe('Today');
    expect(relativeDay('2026-10-22', '2026-10-21')).toBe('Tomorrow');
    expect(relativeDay('2026-10-23', '2026-10-21')).toBe('Fri 23 Oct');
  });
});
