import { shiftTime } from './time-picker';
import { reminderLabel, reminderOptions } from './reminder-picker';
import { pocketBaseTimestamp } from '../data/ids';

describe('time picking', () => {
  it('wraps around midnight', () => {
    expect(shiftTime('23:55', 10)).toBe('00:05');
    expect(shiftTime('00:00', -5)).toBe('23:55');
  });

  it('offers reminders relative to the time, and names a stored one', () => {
    const options = reminderOptions('2026-10-21', '17:00');
    expect(options.map((option) => option.label)).toEqual([
      'Off',
      'At the time',
      '10 minutes before',
      '1 hour before',
      'Morning of',
    ]);
    const tenBefore = pocketBaseTimestamp(options[2].at!);
    expect(reminderLabel(tenBefore, '2026-10-21', '17:00')).toBe('10 minutes before');
  });

  it('only offers Morning of without a time', () => {
    expect(reminderOptions('2026-10-21', '').map((option) => option.label)).toEqual([
      'Off',
      'Morning of',
    ]);
  });
});
