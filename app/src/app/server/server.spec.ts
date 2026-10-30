import { ClientResponseError } from 'pocketbase';
import { SendError } from '../sync/outbox';
import { toSendError } from './server';

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
