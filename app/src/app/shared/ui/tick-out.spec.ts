import { TestBed } from '@angular/core/testing';
import { TICK_OUT_MS, TickOut } from './tick-out';

describe('TickOut', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const make = (reducedMotion = false) =>
    TestBed.runInInjectionContext(() => new TickOut(() => reducedMotion));

  it('shows the row leaving, then saves once the animation is over', () => {
    const tickOut = make();
    const done = vi.fn();

    tickOut.start(done);
    expect(tickOut.leaving()).toBe(true);
    vi.advanceTimersByTime(TICK_OUT_MS - 1);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledOnce();
  });

  it('ignores a second press while leaving', () => {
    const tickOut = make();
    const done = vi.fn();

    tickOut.start(done);
    tickOut.start(done);
    vi.advanceTimersByTime(TICK_OUT_MS);
    expect(done).toHaveBeenCalledOnce();
  });

  it('saves at once when the system asks for reduced motion', () => {
    const tickOut = make(true);
    const done = vi.fn();

    tickOut.start(done);
    expect(done).toHaveBeenCalledOnce();
    expect(tickOut.leaving()).toBe(false);
  });

  it('brings the row back if it is still there after saving', () => {
    const tickOut = make();
    tickOut.start(() => undefined);
    vi.advanceTimersByTime(TICK_OUT_MS);
    expect(tickOut.leaving()).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(tickOut.leaving()).toBe(false);
  });
});
