import { errorLogText } from './error-log-page';

describe('error log page', () => {
  it('copies each entry as its time and context, then the message', () => {
    const text = errorLogText([
      { at: '2026-11-07T10:00:00.000Z', context: 'Sync failed', message: 'Error: offline' },
      { at: '2026-11-06T09:00:00.000Z', context: 'Uncaught error', message: 'TypeError: x' },
    ]);

    expect(text).toBe(
      '2026-11-07T10:00:00.000Z  Sync failed\nError: offline\n\n' +
        '2026-11-06T09:00:00.000Z  Uncaught error\nTypeError: x',
    );
  });
});
