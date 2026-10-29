import { TestBed } from '@angular/core/testing';
import { Toasts } from './toast';

describe('Toasts', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('goes away by itself after a few seconds', () => {
    const toasts = TestBed.inject(Toasts);
    toasts.show({ title: 'On Today' });
    expect(toasts.current()?.title).toBe('On Today');
    vi.advanceTimersByTime(5000);
    expect(toasts.current()).toBeNull();
  });

  it('runs undo once and closes', async () => {
    const toasts = TestBed.inject(Toasts);
    const undo = vi.fn();
    toasts.show({ title: 'Kept as a note', undo });
    await toasts.run(undo);
    expect(undo).toHaveBeenCalledOnce();
    expect(toasts.current()).toBeNull();
  });
});
