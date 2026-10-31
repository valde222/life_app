import { dayOfTimestamp, parseTimestamp, pocketBaseTimestamp } from './timestamps';

describe('PocketBase timestamps', () => {
  it('writes and reads the space-separated UTC form', () => {
    const at = new Date('2026-10-31T09:30:00.000Z');
    expect(pocketBaseTimestamp(at)).toBe('2026-10-31 09:30:00.000Z');
    expect(parseTimestamp('2026-10-31 09:30:00.000Z').getTime()).toBe(at.getTime());
  });

  it('gives the local day a timestamp falls on', () => {
    const noon = new Date(2026, 9, 31, 12, 0);
    expect(dayOfTimestamp(pocketBaseTimestamp(noon))).toBe('2026-10-31');
  });
});
