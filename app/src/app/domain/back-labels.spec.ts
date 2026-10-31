import { noteBackLabel, todoBackLabel } from './back-labels';

describe('back labels', () => {
  it('names the screen an editor goes back to', () => {
    expect(todoBackLabel('/agenda')).toBe('Agenda');
    expect(todoBackLabel('/week')).toBe('Back');
    expect(noteBackLabel('/search', () => undefined)).toBe('Search');
    expect(noteBackLabel('/lists/l1', (id) => (id === 'l1' ? 'Garden' : undefined))).toBe('Garden');
    expect(noteBackLabel('/lists/gone', () => undefined)).toBe('Back');
  });
});
