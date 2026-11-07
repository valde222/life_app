import { signOutLabel } from './settings-page';

describe('sign out', () => {
  it('reads Sign out until it asks again', () => {
    expect(signOutLabel(0, false)).toBe('Sign out');
    expect(signOutLabel(3, false)).toBe('Sign out');
  });

  it('names the waiting changes it would lose', () => {
    expect(signOutLabel(1, true)).toBe('Sign out and lose 1 change');
    expect(signOutLabel(4, true)).toBe('Sign out and lose 4 changes');
  });
});
