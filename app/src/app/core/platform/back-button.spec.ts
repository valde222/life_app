import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { backAction, BackButton } from './back-button';

describe('Android back button', () => {
  it('closes a sheet first, then goes back a screen, and only then leaves the app', () => {
    expect(backAction({ sheetOpen: true, canGoBack: true })).toBe('close-sheet');
    expect(backAction({ sheetOpen: true, canGoBack: false })).toBe('close-sheet');
    expect(backAction({ sheetOpen: false, canGoBack: true })).toBe('go-back');
    expect(backAction({ sheetOpen: false, canGoBack: false })).toBe('leave-app');
  });

  it('closes the top sheet when one is open', () => {
    const close = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: Dialog, useValue: { openDialogs: [{ close: vi.fn() }, { close }] } }],
    });
    TestBed.inject(BackButton).handle(true);
    expect(close).toHaveBeenCalledOnce();
  });
});
