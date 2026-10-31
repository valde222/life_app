import { newId, orderedId } from './ids';

describe('ids', () => {
  it('makes 15-character PocketBase ids', () => {
    expect(newId()).toMatch(/^[a-z0-9]{15}$/);
  });

  it('makes ids that sort in the order they were made', () => {
    const ids = [orderedId(1000, 9), orderedId(1000, 10), orderedId(1001, 0), orderedId(99999, 1)];
    expect([...ids].sort()).toEqual(ids);
  });
});
