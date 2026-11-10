import { displayName, MAX_FILE_BYTES, tooBig } from './file-names';

describe('file names', () => {
  it('drops the suffix PocketBase adds to stored files (R31)', () => {
    expect(displayName('report_k3j2h1g9f0.pdf')).toBe('report.pdf');
    expect(displayName('tax_return_2026_a1b2c3d4e5.xlsx')).toBe('tax_return_2026.xlsx');
    expect(displayName('README_a1b2c3d4e5')).toBe('README');
  });

  it('leaves names without a suffix alone', () => {
    expect(displayName('report.pdf')).toBe('report.pdf');
    expect(displayName('short_abc.pdf')).toBe('short_abc.pdf');
  });

  it('allows up to 50 MB', () => {
    expect(tooBig(MAX_FILE_BYTES)).toBe(false);
    expect(tooBig(MAX_FILE_BYTES + 1)).toBe(true);
  });
});
