import { TestBed } from '@angular/core/testing';
import { TickOut } from './tick-out';

describe('TickOut', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const make = (duration: number) =>
    TestBed.runInInjectionContext(() => new TickOut(() => duration));

  it('shows the tick, then saves once it has played', () => {
    const tickOut = make(120);
    const done = vi.fn();

    tickOut.start(done);
    expect(tickOut.leaving()).toBe(true);
    vi.advanceTimersByTime(119);
    expect(done).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(done).toHaveBeenCalledOnce();
  });

  it('ignores a second press while leaving', () => {
    const tickOut = make(120);
    const done = vi.fn();

    tickOut.start(done);
    tickOut.start(done);
    vi.advanceTimersByTime(120);
    expect(done).toHaveBeenCalledOnce();
  });

  it('saves at once with no motion (reduced motion)', () => {
    const tickOut = make(0);
    const done = vi.fn();

    tickOut.start(done);
    expect(done).toHaveBeenCalledOnce();
  });

  it('brings the row back if it is still there a while after saving', () => {
    const tickOut = make(120);
    tickOut.start(() => undefined);
    vi.advanceTimersByTime(120);
    expect(tickOut.leaving()).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(tickOut.leaving()).toBe(false);
  });
});
