import { TestBed } from '@angular/core/testing';
import { TickBox } from './tick-box';

describe('TickBox', () => {
  const press = (done: boolean) => {
    const fixture = TestBed.createComponent(TickBox);
    fixture.componentRef.setInput('title', 'Pay rent');
    fixture.componentRef.setInput('done', done);
    const ticks: number[] = [];
    fixture.componentInstance.tick.subscribe(() => ticks.push(1));
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const button = host.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBe(
      done ? 'Mark Pay rent not done' : 'Mark Pay rent done',
    );
    button?.click();
    return ticks;
  };

  it('ticks once pressed (at once here: tests have no motion tokens)', () => {
    expect(press(false)).toHaveLength(1);
  });

  it('unticks a done todo at once', () => {
    expect(press(true)).toHaveLength(1);
  });
});
