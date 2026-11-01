import { addDays, daysBetween, longDate, relativeDay, weekday } from './local-date';

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

describe('dates across clock changes and calendar edges', () => {
  it('counts whole days across both DST changes', () => {
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(daysBetween('2027-03-27', '2027-03-29')).toBe(2);
    expect(addDays('2027-03-28', 1)).toBe('2027-03-29');
  });

  it('crosses month and year ends and handles leap years', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(daysBetween('2028-02-01', '2028-03-01')).toBe(29);
    expect(weekday('2026-11-02')).toBe(1);
  });
});
