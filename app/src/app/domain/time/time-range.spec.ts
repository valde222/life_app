import { timeRange } from './time-range';

describe('timeRange', () => {
  it('shows a start, a start and end, or nothing', () => {
    expect(timeRange('09:00', '10:30')).toBe('09:00–10:30');
    expect(timeRange('09:00', '')).toBe('09:00');
    expect(timeRange('', '10:30')).toBe('');
  });
});
