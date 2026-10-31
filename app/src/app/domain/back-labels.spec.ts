import { backLabel } from './back-labels';

describe('back labels', () => {
  const lists = (id: string) => (id === 'l1' ? 'Garden' : undefined);

  it('names the screen an editor goes back to, the same for todos and notes (B2)', () => {
    for (const [path, label] of [
      ['/', 'Today'],
      ['/inbox', 'Inbox'],
      ['/lists', 'Lists'],
      ['/agenda', 'Agenda'],
      ['/search', 'Search'],
      ['/lists/l1', 'Garden'],
    ]) {
      expect(backLabel(path, lists), path).toBe(label);
    }
  });

  it('falls back to Back', () => {
    expect(backLabel('/week', lists)).toBe('Back');
    expect(backLabel('/lists/gone', lists)).toBe('Back');
  });
});
