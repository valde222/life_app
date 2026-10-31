import { swipeOutcome, SWIPE_THRESHOLD } from './swipe-row';

describe('swipeOutcome', () => {
  it('needs the threshold in either direction', () => {
    expect(swipeOutcome(SWIPE_THRESHOLD)).toBe('right');
    expect(swipeOutcome(-SWIPE_THRESHOLD)).toBe('left');
    expect(swipeOutcome(SWIPE_THRESHOLD - 1)).toBeNull();
    expect(swipeOutcome(0)).toBeNull();
  });
});
