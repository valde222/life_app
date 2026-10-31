import { ClientResponseError } from 'pocketbase';
import { SendError } from '../sync/outbox';
import { needsRefresh, toSendError } from './server';

const response = (status: number) => new ClientResponseError({ status });

describe('toSendError', () => {
  it('keeps a change to retry when the server is unreachable, failing or throttling', () => {
    for (const status of [0, 429, 500, 503]) {
      expect((toSendError(response(status)) as SendError).failure, String(status)).toBe('offline');
    }
  });

  it('signs out on 401 and 403, and drops a change the server refuses', () => {
    expect((toSendError(response(401)) as SendError).failure).toBe('unauthorised');
    expect((toSendError(response(400)) as SendError).failure).toBe('rejected');
  });
});

describe('needsRefresh', () => {
  const day = 86_400;
  const now = 1_000_000 * 1000;

  it('refreshes a token with less than half its life left', () => {
    expect(needsRefresh({ iat: now / 1000 - 3 * day, exp: now / 1000 + 2 * day }, now)).toBe(true);
    expect(needsRefresh({ exp: now / 1000 + day }, now)).toBe(true);
  });

  it('leaves a fresh token, an expired one and a malformed one alone', () => {
    expect(needsRefresh({ iat: now / 1000 - day, exp: now / 1000 + 4 * day }, now)).toBe(false);
    expect(needsRefresh({ exp: now / 1000 - 1 }, now)).toBe(false);
    expect(needsRefresh({}, now)).toBe(false);
  });
});
