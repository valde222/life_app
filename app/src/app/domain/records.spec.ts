import { omitFields } from './records';

describe('omitFields', () => {
  it('copies a record without the named fields, leaving the original alone', () => {
    const record = { id: 'a', title: 'x', expand: {} };
    expect(omitFields(record, ['expand'])).toEqual({ id: 'a', title: 'x' });
    expect(record).toHaveProperty('expand');
  });
});
