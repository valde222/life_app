import { clearLoggedErrors, errorText, logError, loggedErrors } from './log';

describe('error log', () => {
  beforeEach(() => {
    clearLoggedErrors();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps errors on the device, newest first', () => {
    logError('Sync failed', new Error('first'));
    logError('Dropped todos/1: the server rejected it', 'second');

    expect(loggedErrors().map((entry) => [entry.context, entry.message])).toEqual([
      ['Dropped todos/1: the server rejected it', 'second'],
      ['Sync failed', 'Error: first'],
    ]);
  });

  it('keeps only the last 100', () => {
    for (let n = 0; n < 105; n++) {
      logError('Sync failed', n);
    }

    const entries = loggedErrors();
    expect(entries).toHaveLength(100);
    expect(entries[0].message).toBe('104');
    expect(entries.at(-1)?.message).toBe('5');
  });

  it('follows the cause, which holds what the server said', () => {
    const rejected = new Error('rejected', { cause: new TypeError('title is required') });

    expect(errorText(rejected)).toBe('Error: rejected ← TypeError: title is required');
  });

  it("includes PocketBase's response, which names the field it refused", () => {
    const refused = Object.assign(new Error('Failed to create record.'), {
      response: { data: { title: { code: 'validation_required' } } },
    });

    expect(errorText(refused)).toBe(
      'Error: Failed to create record. {"data":{"title":{"code":"validation_required"}}}',
    );
  });

  it('clears', () => {
    logError('Sync failed', 'x');
    clearLoggedErrors();

    expect(loggedErrors()).toEqual([]);
  });

  it('still logs when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => logError('Sync failed', 'x')).not.toThrow();
  });
});
