import { TestBed } from '@angular/core/testing';
import { HapticTicks } from '../../core/platform/haptics';
import { SwipeRow, swipeOutcome, SWIPE_THRESHOLD } from './swipe-row';

describe('swipeOutcome', () => {
  it('needs the threshold in either direction', () => {
    expect(swipeOutcome(SWIPE_THRESHOLD)).toBe('right');
    expect(swipeOutcome(-SWIPE_THRESHOLD)).toBe('left');
    expect(swipeOutcome(SWIPE_THRESHOLD - 1)).toBeNull();
    expect(swipeOutcome(0)).toBeNull();
  });
});

describe('SwipeRow haptics', () => {
  it('ticks once when the drag crosses the threshold, not on every move', () => {
    const ticks = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: HapticTicks, useValue: { tick: ticks } }],
    });
    const fixture = TestBed.createComponent(SwipeRow);
    fixture.componentRef.setInput('right', { icon: 'sun', label: 'Today' });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const content = host.querySelector<HTMLElement>('.content')!;
    content.setPointerCapture = () => undefined;
    const pointer = (type: string, clientX: number) =>
      content.dispatchEvent(
        Object.assign(new Event(type, { bubbles: true }), { clientX, clientY: 0, pointerId: 1 }),
      );

    pointer('pointerdown', 0);
    for (const x of [20, 60, SWIPE_THRESHOLD + 5, SWIPE_THRESHOLD + 30, 40, SWIPE_THRESHOLD + 10]) {
      pointer('pointermove', x);
    }

    expect(ticks).toHaveBeenCalledTimes(2);
  });
});
